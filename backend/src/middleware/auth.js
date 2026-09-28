import { User } from '../models/User.js';
import { endSession, readSession } from '../services/session.js';
import { forbidden, unauthorized } from '../utils/http-error.js';

// Loads the user on every request so role changes and revocations apply immediately.
export async function requireAuth(request, response, next) {
  const session = readSession(request);
  if (!session) throw unauthorized();

  const user = await User.findById(session.sub);
  if (!user || user.status !== 'active' || user.tokenVersion !== session.tv) {
    endSession(response);
    throw unauthorized('Votre session a expiré. Reconnectez-vous.', { code: 'SESSION_EXPIRED' });
  }

  request.user = user;
  next();
}

export const requireRole = (...roles) => (request, _response, next) => {
  if (!roles.includes(request.user.role)) throw forbidden("Vous n'avez pas les droits nécessaires pour cette action.");
  next();
};
