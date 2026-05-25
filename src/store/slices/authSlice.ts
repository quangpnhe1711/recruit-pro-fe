import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type AuthState = {
  token: string | null
  isAuthenticated: boolean
}

const initialState: AuthState = {
  token: null,
  isAuthenticated: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken(state, action: PayloadAction<string | null>) {
      state.token = action.payload
      state.isAuthenticated = Boolean(action.payload)
    },
    logout(state) {
      state.token = null
      state.isAuthenticated = false
    },
  },
})

export const { setToken, logout } = authSlice.actions
export default authSlice.reducer
