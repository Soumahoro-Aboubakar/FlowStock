import { env } from '../../config/env.js';
import { User } from '../../models/User.js';
import { invitationEmail } from '../../services/email-templates.js';
import { sendMail } from '../../services/mailer.js';
import { serializeUser } from '../../utils/serializers.js';
import { HttpError, badRequest, conflict, notFound } from '../../utils/http-error.js';

export async function listUsers(_request, response) {
  const users = await User.find().sort({ name: 1 }).collation({ locale: 'fr' });
  response.json({ users: users.map(serializeUser) });
}

export async function inviteUser(request, response) {
  const { name, email, role, team } = request.body;
  if (await User.exists({ email })) throw conflict('Cette adresse est déjà utilisée.', { code: 'EMAIL_TAKEN', details: { fields: { email: 'Cette adresse est déjà utilisée.' } } });

  const user = await User.create({ name, email, role, team, status: 'invited' });
  const signupUrl = `${env.clientUrl}/?${new URLSearchParams({ view: 'signup', email })}`;
  try {
    await sendMail({ to: email, ...invitationEmail({ name, invitedBy: request.user.name, role, signupUrl }) });
  } catch (error) {
    console.error('Invitation email failed:', error.message);
    await User.deleteOne({ _id: user._id });
    throw new HttpError(502, "L'invitation n'a pas pu être envoyée. Réessayez dans un instant.", { code: 'MAIL_FAILED' });
  }
  response.status(201).json({ user: serializeUser(user) });
}

export async function changeRole(request, response) {
  const { id } = request.valid.params;
  if (id === String(request.user._id)) throw badRequest('Vous ne pouvez pas modifier votre propre rôle.', { code: 'SELF_ROLE_CHANGE' });
  const user = await User.findByIdAndUpdate(id, { role: request.body.role }, { new: true });
  if (!user) throw notFound('Cet utilisateur est introuvable.');
  response.json({ user: serializeUser(user) });
}
