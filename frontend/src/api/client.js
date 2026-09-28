export class ApiError extends Error {
  constructor(status, message, code, details) {
    super(message)
    this.status = status
    this.code = code
    this.details = details || {}
  }

  get fields() {
    return this.details.fields || {}
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://flowstock-oh7l.onrender.com' : '')).trim().replace(/\/+$/, '')

export function apiUrl(path) {
  if (/^https?:\/\//i.test(path)) return path
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

// Uploaded images are served by the API as relative /media/... paths; they must point at the API origin.
export function mediaUrl(url) {
  return url && url.startsWith('/media/') ? apiUrl(url) : url
}

let sessionExpiredHandler = null
export const onSessionExpired = (handler) => { sessionExpiredHandler = handler }

export async function api(path, { method = 'GET', body, signal } = {}) {
  let response
  try {
    response = await fetch(apiUrl(`/api${path}`), {
      method,
      signal,
      credentials: 'include',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiError(0, 'Serveur injoignable. Vérifiez votre connexion puis réessayez.', 'NETWORK')
  }

  if (response.status === 204) return null
  const isJson = (response.headers.get('content-type') || '').includes('application/json')
  const data = isJson ? await response.json().catch(() => null) : null
  // A non-JSON answer means the request never reached the API (e.g. the static host served index.html
  // because /api is not proxied to the backend): fail loudly instead of returning null to the caller.
  if (response.ok && !isJson) {
    throw new ApiError(502, "L'API est injoignable. Vérifiez VITE_API_URL et la disponibilité du backend.", 'API_UNREACHABLE')
  }
  if (response.ok && data === null) {
    throw new ApiError(502, "L'API a renvoyé une réponse vide ou invalide.", 'INVALID_API_RESPONSE')
  }
  if (!response.ok) {
    const error = new ApiError(response.status, data?.message || 'Une erreur inattendue est survenue.', data?.code, data?.details)
    // A 401 outside of the auth endpoints means the session is gone (expired, revoked, logged out elsewhere).
    if (response.status === 401 && !path.startsWith('/auth/') && sessionExpiredHandler) sessionExpiredHandler(error)
    throw error
  }
  return data
}
