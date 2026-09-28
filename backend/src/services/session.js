import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const SESSION_COOKIE = 'fs_session';

const cookieOptions = () => ({
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'lax',
  path: '/',
});

export function startSession(response, user) {
  const token = jwt.sign({ sub: String(user._id), tv: user.tokenVersion }, env.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: `${env.sessionTtlDays}d`,
  });
  response.cookie(SESSION_COOKIE, token, { ...cookieOptions(), maxAge: env.sessionTtlDays * 86400000 });
}

export function endSession(response) {
  response.clearCookie(SESSION_COOKIE, cookieOptions());
}

export function readSession(request) {
  const token = request.cookies?.[SESSION_COOKIE];
  if (!token || typeof token !== 'string') return null;
  try {
    return jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
  } catch {
    return null;
  }
}
