import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type UserProfile = {
  id: string
  name: string
  email: string
}

type UserState = {
  profile: UserProfile | null
}

const initialState: UserState = {
  profile: null,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setProfile(state, action: PayloadAction<UserProfile | null>) {
      state.profile = action.payload
    },
    clearProfile(state) {
      state.profile = null
    },
  },
})

export const { setProfile, clearProfile } = userSlice.actions
export default userSlice.reducer
