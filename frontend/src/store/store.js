import { configureStore } from '@reduxjs/toolkit'
import sessionReducer from './sessionSlice.js'
import dataReducer from './dataSlice.js'
import uiReducer, { persistUi } from './uiSlice.js'

// The previous demo stored all data in localStorage; it now comes from the API.
try { localStorage.removeItem('materio-redux-state') } catch { /* ignore */ }

export const store = configureStore({
  reducer: { session: sessionReducer, data: dataReducer, ui: uiReducer },
})

store.subscribe(() => persistUi(store.getState()))

export default store
