import { createSlice } from '@reduxjs/toolkit'
import { signedOut } from './sessionSlice.js'

// Server data for the signed-in role. It is never persisted: the API is the source of truth.
const initialState = { status: 'idle', error: null, loadedAt: 0, materials: [], requests: [], users: [] }

const upsert = (list, item) => {
  const index = list.findIndex((entry) => entry.id === item.id)
  if (index === -1) list.unshift(item)
  else list[index] = item
}

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    loadStarted(state) {
      state.status = 'loading'
      state.error = null
    },
    loadSucceeded(state, action) {
      const { materials = [], requests = [], users = [] } = action.payload
      Object.assign(state, { status: 'ready', error: null, loadedAt: Date.now(), materials, requests, users })
    },
    loadFailed(state, action) {
      state.status = 'error'
      state.error = action.payload
    },
    materialSaved(state, action) {
      upsert(state.materials, action.payload)
    },
    materialRemoved(state, action) {
      state.materials = state.materials.filter((item) => item.id !== action.payload)
    },
    materialRestored(state, action) {
      const { material, index } = action.payload
      if (!state.materials.some((item) => item.id === material.id)) state.materials.splice(Math.min(index, state.materials.length), 0, material)
    },
    requestSaved(state, action) {
      upsert(state.requests, action.payload)
    },
    userSaved(state, action) {
      const index = state.users.findIndex((entry) => entry.id === action.payload.id)
      if (index === -1) state.users.push(action.payload)
      else state.users[index] = action.payload
    },
  },
  extraReducers: (builder) => {
    builder.addCase(signedOut, () => initialState)
  },
})

export const { loadStarted, loadSucceeded, loadFailed, materialSaved, materialRemoved, materialRestored, requestSaved, userSaved } = dataSlice.actions
export default dataSlice.reducer
