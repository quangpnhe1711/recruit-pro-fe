import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type AuthState = {
  token: string | null
  isAuthenticated: boolean,
  variant: string
}

const initialState: AuthState = {
  token: null,
  isAuthenticated: false,
  variant: "candidate",
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken(state, action: PayloadAction<string | null>) {
      state.token = action.payload
      state.isAuthenticated = Boolean(action.payload)
    },
    setVariant(state, action: PayloadAction<"internal" | "candidate" | undefined>) {
      state.variant = action.payload
    },
    logout(state) {
      state.token = null
      state.isAuthenticated = false
      state.variant = undefined
    },
  },
})

export const { setToken, setVariant, logout } = authSlice.actions
export default authSlice.reducer
