import { api } from './client.js'

export const authApi = {
  me: () => api('/auth/me'),
  login: (credentials) => api('/auth/login', { method: 'POST', body: credentials }),
  signup: (data) => api('/auth/signup', { method: 'POST', body: data }),
  verifyEmail: (email, code) => api('/auth/verify-email', { method: 'POST', body: { email, code } }),
  resendCode: (email) => api('/auth/resend-code', { method: 'POST', body: { email } }),
  logout: () => api('/auth/logout', { method: 'POST' }),
}
