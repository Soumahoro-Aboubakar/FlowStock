import { api } from './client.js'

export const employeeApi = {
  bootstrap: async () => {
    const [{ materials }, { requests }] = await Promise.all([api('/employee/materials'), api('/employee/requests')])
    return { materials, requests }
  },
  createRequest: (data) => api('/employee/requests', { method: 'POST', body: data }),
  cancelRequest: (code) => api(`/employee/requests/${encodeURIComponent(code)}/cancel`, { method: 'POST' }),
}
