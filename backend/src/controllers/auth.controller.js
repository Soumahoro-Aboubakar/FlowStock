import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { sendMail } from '../services/mailer.js';
import { verificationEmail } from '../services/email-templates.js';
import { activeLock, clearFailures, lockInfo, recordFailure } from '../services/login-throttle.js';
import { endSession, startSession } from '../services/session.js';
import { serializeUser } from '../utils/serializers.js';
import { HttpError, badRequest, conflict } from '../utils/http-error.js';

const BCRYPT_ROUNDS = 12;
// Compared against when the email is unknown, so response time does not reveal whether an account exists.
const DUMMY_HASH = bcrypt.hashSync('flowstock-timing-equaliser', BCRYPT_ROUNDS);

const hashCode = (userId, code) => createHmac('sha256', env.jwtSecret).update(`${userId}:${code}`).digest();
const resendAvailableAt = (verification) => (verification ? verification.sentAt.getTime() + env.verification.resendCooldownSeconds * 1000 : Date.now());

const lockedError = (lockedUntil) => new HttpError(429,
  `Trop de tentatives de connexion. Réessayez dans ${lockInfo(lockedUntil).retryInHours} heure${lockInfo(lockedUntil).retryInHours > 1 ? 's' : ''}.`,
  { code: 'ACCOUNT_LOCKED', details: lockInfo(lockedUntil) });

// Issues a fresh 6-digit code unless one was sent during the cooldown window. Returns when the next resend is
// allowed and, in test mode (env.showVerificationCode), the code itself instead of emailing it.
async function sendVerificationCode(user, { force = false } = {}) {
  // Only the hash is stored, so test mode always issues a new code it can hand back.
  if (!force && !env.showVerificationCode && user.verification && Date.now() < resendAvailableAt(user.verification)) {
    return { resendAvailableAt: resendAvailableAt(user.verification) };
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const now = new Date();
  user.verification = {
    codeHash: hashCode(user._id, code).toString('hex'),
    expiresAt: new Date(now.getTime() + env.verification.codeTtlMinutes * 60000),
    attempts: 0,
    sentAt: now,
  };
  await user.save();

  if (env.showVerificationCode) return { resendAvailableAt: resendAvailableAt(user.verification), code };

  try {
    await sendMail({ to: user.email, ...verificationEmail({ name: user.name, code }) });
  } catch (error) {
    console.error('Verification email failed:', error.message);
    throw new HttpError(502, "Impossible d'envoyer l'e-mail de vérification pour le moment. Réessayez dans un instant.", { code: 'MAIL_FAILED' });
  }
  return { resendAvailableAt: resendAvailableAt(user.verification) };
}

export async function signup(request, response) {
  const { name, email, password, team } = request.body;
  let user = await User.findOne({ email }).select('+passwordHash +verification');
  if (user && user.status === 'active') {
    throw conflict('Un compte existe déjà avec cette adresse. Connectez-vous.', { code: 'EMAIL_TAKEN' });
  }

  if (!user) user = new User({ email, role: 'employee', team });
  user.name = name;
  // An invitation fixes the team and role chosen by the administrator.
  if (user.status !== 'invited' || !user.team) user.team = team;
  if (env.adminEmails.includes(email)) user.role = 'admin';
  user.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  user.status = 'pending';

  const issued = await sendVerificationCode(user, { force: true });
  response.status(201).json({ email: user.email, ...issued, codeTtlMinutes: env.verification.codeTtlMinutes });
}

export async function verifyEmail(request, response) {
  const { email, code } = request.body;
  const user = await User.findOne({ email }).select('+verification');
  if (user && user.status === 'active') throw badRequest('Cette adresse est déjà vérifiée. Connectez-vous.', { code: 'ALREADY_VERIFIED' });
  if (!user || !user.verification) throw badRequest('Code invalide ou expiré. Demandez un nouveau code.', { code: 'CODE_INVALID' });

  const { verification } = user;
  if (verification.expiresAt < new Date()) throw badRequest('Ce code a expiré. Demandez-en un nouveau.', { code: 'CODE_EXPIRED' });
  if (verification.attempts >= env.verification.maxAttempts) {
    throw new HttpError(429, 'Trop de codes erronés. Demandez un nouveau code.', { code: 'CODE_LOCKED' });
  }

  const expected = Buffer.from(verification.codeHash, 'hex');
  if (!timingSafeEqual(expected, hashCode(user._id, code))) {
    verification.attempts += 1;
    await user.save();
    const remainingAttempts = env.verification.maxAttempts - verification.attempts;
    if (remainingAttempts <= 0) throw new HttpError(429, 'Trop de codes erronés. Demandez un nouveau code.', { code: 'CODE_LOCKED' });
    throw badRequest(`Code incorrect — ${remainingAttempts} essai${remainingAttempts > 1 ? 's' : ''} restant${remainingAttempts > 1 ? 's' : ''}.`, { code: 'CODE_INVALID', details: { remainingAttempts } });
  }

  user.status = 'active';
  user.emailVerifiedAt = new Date();
  user.verification = null;
  user.lastLoginAt = new Date();
  await user.save();
  await clearFailures(email);
  startSession(response, user);
  response.json({ user: serializeUser(user) });
}

export async function resendCode(request, response) {
  const { email } = request.body;
  const user = await User.findOne({ email, status: 'pending' }).select('+verification');
  // Same answer whether or not a pending account exists.
  if (!user) return response.status(202).json({ resendAvailableAt: Date.now() + env.verification.resendCooldownSeconds * 1000 });

  const availableAt = resendAvailableAt(user.verification);
  if (Date.now() < availableAt) {
    const seconds = Math.ceil((availableAt - Date.now()) / 1000);
    throw new HttpError(429, `Patientez ${seconds} s avant de demander un nouveau code.`, { code: 'RESEND_COOLDOWN', details: { resendAvailableAt: availableAt } });
  }
  const issued = await sendVerificationCode(user, { force: true });
  response.status(202).json(issued);
}

export async function login(request, response) {
  const { email, password } = request.body;

  const lockedUntil = await activeLock(email);
  if (lockedUntil) throw lockedError(lockedUntil);

  const user = await User.findOne({ email }).select('+passwordHash +verification');
  const valid = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);

  if (!user || !user.passwordHash || !valid) {
    const failure = await recordFailure(email);
    if (failure.lockedUntil) throw lockedError(failure.lockedUntil);
    throw new HttpError(401,
      `E-mail ou mot de passe incorrect. ${failure.remaining} tentative${failure.remaining > 1 ? 's' : ''} restante${failure.remaining > 1 ? 's' : ''}.`,
      { code: 'INVALID_CREDENTIALS', details: { remainingAttempts: failure.remaining, maxAttempts: env.login.maxAttempts } });
  }

  await clearFailures(email);

  if (user.status !== 'active') {
    const issued = await sendVerificationCode(user);
    throw new HttpError(403, 'Confirmez votre adresse e-mail pour vous connecter. Un code vous a été envoyé.', {
      code: 'EMAIL_NOT_VERIFIED', details: { email: user.email, ...issued },
    });
  }

  if (env.adminEmails.includes(email) && user.role !== 'admin') user.role = 'admin';
  user.lastLoginAt = new Date();
  await user.save();
  startSession(response, user);
  response.json({ user: serializeUser(user) });
}

export function me(request, response) {
  response.json({ user: serializeUser(request.user) });
}

export function logout(_request, response) {
  endSession(response);
  response.status(204).end();
}
