import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { LoginResponseDto, UserDto } from "../../modules/auth/authSchema";
import { resolvePortalVariantFromUser } from "../../permissions/rolePermissions";

export type Variant = "candidate" | "internal";

const readAuthFromStorage = () => {
  const accessToken = localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");
  const variant = localStorage.getItem("current_variant") as Variant | null;

  return {
    accessToken,
    refreshToken,
    currentVariant: variant ?? undefined,
    isAuthenticated: Boolean(accessToken && refreshToken),
  };
};

const persistedAuth = readAuthFromStorage();

export type AuthState = {
  accessToken: string | null;

  refreshToken: string | null;

  user: UserDto | null;

  currentVariant?: Variant;

  isAuthenticated: boolean;
};

const initialState: AuthState = {
  accessToken: persistedAuth.accessToken,
  refreshToken: persistedAuth.refreshToken,
  user: null,
  currentVariant: persistedAuth.currentVariant,
  isAuthenticated: persistedAuth.isAuthenticated,
};

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    setCredentials(state, action: PayloadAction<LoginResponseDto>) {
      const { accessToken, refreshToken, user } = action.payload;
      const resolvedVariant = resolvePortalVariantFromUser(
        user,
        state.currentVariant ?? "candidate",
      );

      state.accessToken = accessToken;

      state.refreshToken = refreshToken;

      state.user = user;
      state.currentVariant = resolvedVariant;

      state.isAuthenticated = true;

      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
      localStorage.setItem("current_variant", resolvedVariant);
    },

    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
    },

    setVariant(state, action: PayloadAction<Variant>) {
      state.currentVariant = action.payload;

      localStorage.setItem("current_variant", action.payload);
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

      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("current_variant");
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
