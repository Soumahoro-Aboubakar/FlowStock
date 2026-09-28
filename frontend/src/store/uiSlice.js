import { createSlice } from '@reduxjs/toolkit'

const DEFAULT_ROUTES = { admin: 'dashboard', employee: 'catalog' }
const STORAGE_KEY = 'materio-ui'

function loadRoutes() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    return saved && saved.routeByRole ? { ...DEFAULT_ROUTES, ...saved.routeByRole } : DEFAULT_ROUTES
  } catch {
    return DEFAULT_ROUTES
  }
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: { routeByRole: loadRoutes() },
  reducers: {
    setCurrentRoute(state, action) {
      const { role, route } = action.payload
      state.routeByRole[role] = route
    },
  },
})

export const persistUi = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ routeByRole: state.ui.routeByRole }))
  } catch {
    // Storage can be unavailable; navigation still works in memory.
  }
}

export const { setCurrentRoute } = uiSlice.actions
export default uiSlice.reducer
