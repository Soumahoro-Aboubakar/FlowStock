import { env } from '../config/env.js';
import { badRequest, forbidden } from '../utils/http-error.js';

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Defence in depth against CSRF on top of SameSite cookies: mutating requests must come from the app.
export function requireSameOrigin(request, _response, next) {
  if (!MUTATING.has(request.method)) return next();
  const origin = request.get('origin');
  if (origin && origin !== env.clientUrl) throw forbidden('Origine de la requête non autorisée.');
  next();
}

// Blocks NoSQL operator injection ({ "$gt": "" }, "a.b" paths) anywhere in the payload.
function hasForbiddenKey(value, depth = 0) {
  if (depth > 10) return true;
  if (Array.isArray(value)) return value.some((item) => hasForbiddenKey(item, depth + 1));
  if (value && typeof value === 'object' && !Buffer.isBuffer(value)) {
    return Object.keys(value).some((key) => key.startsWith('$') || key.includes('.') || key === '__proto__' || key === 'constructor' || hasForbiddenKey(value[key], depth + 1));
  }
  return false;
}

export function rejectOperatorInjection(request, _response, next) {
  if (hasForbiddenKey(request.body) || hasForbiddenKey(request.query) || hasForbiddenKey(request.params)) {
    throw badRequest('Requête invalide.', { code: 'INVALID_PAYLOAD' });
  }
  next();
}
