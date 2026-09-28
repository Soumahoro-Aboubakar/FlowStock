export class HttpError extends Error {
  constructor(status, message, { code, details } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message, options) => new HttpError(400, message, options);
export const unauthorized = (message = 'Authentification requise.', options) => new HttpError(401, message, { code: 'UNAUTHENTICATED', ...options });
export const forbidden = (message = 'Accès refusé.', options) => new HttpError(403, message, { code: 'FORBIDDEN', ...options });
export const notFound = (message = 'Ressource introuvable.') => new HttpError(404, message, { code: 'NOT_FOUND' });
export const conflict = (message, options) => new HttpError(409, message, options);
