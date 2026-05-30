import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { LoginResponseDto, UserDto } from "../../modules/auth/authSchema";

export type Variant = "candidate" | "internal";

export type AuthState = {
  accessToken: string | null;

  refreshToken: string | null;

  user: UserDto | null;

  currentVariant?: Variant;

  isAuthenticated: boolean;
};

const initialState: AuthState = {
  accessToken: null,

  refreshToken: null,

  user: null,

  currentVariant: undefined,

  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    setCredentials(state, action: PayloadAction<LoginResponseDto>) {
      const { accessToken, refreshToken, user } = action.payload;

      state.accessToken = accessToken;

      state.refreshToken = refreshToken;

      state.user = user;

      state.isAuthenticated = true;
    },

    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
    },

    setVariant(state, action: PayloadAction<Variant>) {
      state.currentVariant = action.payload;
    },

    updateUser(state, action: PayloadAction<UserDto>) {
      state.user = action.payload;
    },

    logout(state) {
      state.accessToken = null;

      state.refreshToken = null;

      state.user = null;

      state.currentVariant = undefined;

      state.isAuthenticated = false;
    },
  },
});

export const {
  setCredentials,
  setAccessToken,
  setVariant,
  updateUser,
  logout,
} = authSlice.actions;

export default authSlice.reducer;
