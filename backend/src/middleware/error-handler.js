export function notFoundHandler(_request, response) {
  response.status(404).json({ message: 'Route introuvable.', code: 'NOT_FOUND' });
}

export function errorHandler(error, _request, response, _next) {
  if (error.type === 'entity.too.large') {
    return response.status(413).json({ message: 'Fichier trop volumineux — 5 Mo maximum.', code: 'PAYLOAD_TOO_LARGE' });
  }
  if (error.type === 'entity.parse.failed') {
    return response.status(400).json({ message: 'Requête invalide.', code: 'INVALID_JSON' });
  }
  if (error.name === 'CastError') {
    return response.status(404).json({ message: 'Ressource introuvable.', code: 'NOT_FOUND' });
  }
  if (error.status && error.status < 500) {
    return response.status(error.status).json({ message: error.message, code: error.code, ...(error.details && { details: error.details }) });
  }

  console.error(error);
  response.status(500).json({ message: 'Une erreur inattendue est survenue. Réessayez dans un instant.', code: 'SERVER_ERROR' });
}
