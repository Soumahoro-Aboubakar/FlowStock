import { rateLimit } from 'express-rate-limit';

const limiter = (limit, windowMinutes, message) => rateLimit({
  windowMs: windowMinutes * 60000,
  limit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_request, response, _next, options) => {
    const retryAfterSeconds = Math.ceil(options.windowMs / 1000);
    response.status(429).json({ message, code: 'RATE_LIMITED', details: { retryAfterSeconds } });
  },
});

// Per-IP ceilings; the per-account lockout (remaining attempts, X hours) lives in the login controller.
export const authLimiter = limiter(60, 15, 'Trop de requêtes depuis cet appareil. Patientez quelques minutes.');
export const loginLimiter = limiter(20, 15, 'Trop de tentatives depuis cet appareil. Patientez 15 minutes avant de réessayer.');
export const apiLimiter = limiter(600, 15, 'Trop de requêtes. Patientez quelques instants.');
