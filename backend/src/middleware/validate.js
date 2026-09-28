import { badRequest } from '../utils/http-error.js';

// Replaces request[source] with the parsed (trimmed, typed, stripped) value, so controllers only see validated data.
export const validate = (schema, source = 'body') => (request, _response, next) => {
  const result = schema.safeParse(request[source] ?? {});
  if (!result.success) {
    const fields = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join('.') || '_';
      if (!fields[key]) fields[key] = issue.message;
    }
    throw badRequest(Object.values(fields)[0] || 'Données invalides.', { code: 'VALIDATION_ERROR', details: { fields } });
  }
  if (source === 'body') request.body = result.data;
  else request.valid = { ...request.valid, [source]: result.data };
  next();
};
