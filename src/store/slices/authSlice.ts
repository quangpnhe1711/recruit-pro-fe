import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { LoginResponseDto, UserDto } from "../../modules/auth/authSchema";
import { resolvePortalVariantFromUser } from "../../permissions/rolePermissions";
import { hasValidStoredSession } from "../../services/auth/authToken";

export type Variant = "candidate" | "internal";

const readAuthFromStorage = () => {
  const accessToken = localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");
  const variant = localStorage.getItem("current_variant") as Variant | null;
  const userRaw = localStorage.getItem("auth_user");
  const isValidSession = hasValidStoredSession();
  let user: UserDto | null = null;

  if (userRaw) {
    try {
      user = JSON.parse(userRaw) as UserDto;
    } catch {
      localStorage.removeItem("auth_user");
    }
  }

  return {
    accessToken: isValidSession ? accessToken : null,
    refreshToken: isValidSession ? refreshToken : null,
    user: isValidSession ? user : null,
    currentVariant: isValidSession ? variant ?? undefined : undefined,
    isAuthenticated: isValidSession,
  };
};

const persistedAuth = readAuthFromStorage();

if (!persistedAuth.isAuthenticated) {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("current_variant");
  localStorage.removeItem("auth_user");
}

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
  user: persistedAuth.user,
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
      // Guard against persisting the literal string "null" when the backend omits a refresh token.
      if (refreshToken) {
        localStorage.setItem("refresh_token", refreshToken);
      } else {
        localStorage.removeItem("refresh_token");
      }
      localStorage.setItem("current_variant", resolvedVariant);
      localStorage.setItem("auth_user", JSON.stringify(user));
    },

    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
      localStorage.setItem("access_token", action.payload);
    },

    setVariant(state, action: PayloadAction<Variant>) {
      state.currentVariant = action.payload;

      localStorage.setItem("current_variant", action.payload);
    },

    updateUser(state, action: PayloadAction<UserDto>) {
      state.user = action.payload;
      localStorage.setItem("auth_user", JSON.stringify(action.payload));
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
      localStorage.removeItem("auth_user");
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
