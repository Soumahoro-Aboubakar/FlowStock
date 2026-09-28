import { createSlice } from '@reduxjs/toolkit'

// status: 'checking' while the existing cookie is validated, then 'guest' or 'authenticated'.
const sessionSlice = createSlice({
  name: 'session',
  initialState: { status: 'checking', user: null },
  reducers: {
    sessionResolved(state, action) {
      state.user = action.payload
      state.status = action.payload ? 'authenticated' : 'guest'
    },
    signedOut(state) {
      state.user = null
      state.status = 'guest'
    },
  },
})

export const { sessionResolved, signedOut } = sessionSlice.actions
export default sessionSlice.reducer
