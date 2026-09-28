import { api } from './client.js'

export const adminApi = {
  bootstrap: async () => {
    const [{ materials }, { requests }, { users }] = await Promise.all([api('/admin/materials'), api('/admin/requests'), api('/admin/users')])
    return { materials, requests, users }
  },
  createMaterial: (data) => api('/admin/materials', { method: 'POST', body: data }),
  updateMaterial: (id, data) => api(`/admin/materials/${encodeURIComponent(id)}`, { method: 'PUT', body: data }),
  deleteMaterial: (id) => api(`/admin/materials/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  restoreMaterial: (id) => api(`/admin/materials/${encodeURIComponent(id)}/restore`, { method: 'POST' }),
  approveRequest: (code) => api(`/admin/requests/${encodeURIComponent(code)}/approve`, { method: 'POST' }),
  reopenRequest: (code) => api(`/admin/requests/${encodeURIComponent(code)}/reopen`, { method: 'POST' }),
  rejectRequest: (code, reason) => api(`/admin/requests/${encodeURIComponent(code)}/reject`, { method: 'POST', body: { reason } }),
  inviteUser: (data) => api('/admin/users/invitations', { method: 'POST', body: data }),
  changeRole: (id, role) => api(`/admin/users/${encodeURIComponent(id)}/role`, { method: 'PATCH', body: { role } }),
}
