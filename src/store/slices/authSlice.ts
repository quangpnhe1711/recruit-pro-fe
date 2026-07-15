import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { LoginResponseDto, UserDto } from "../../modules/auth/authSchema";
import { resolvePortalVariantFromUser } from "../../permissions/rolePermissions";
import { hasValidStoredSession } from "../../services/auth/authToken";
import {
  activePortal,
  clearSession,
  patchSession,
  purgeLegacySharedSession,
  readSession,
  writeSession,
  type Portal,
} from "../../services/auth/authSession";

export type Variant = Portal;

// Redux mirrors whichever portal the current URL belongs to. Each portal's tokens/user live in their
// own localStorage key (see authSession.ts); this state is just the hydrated view of the active one.
const emptyAuthState = (): AuthState => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  currentVariant: undefined,
  isAuthenticated: false,
});

const readAuthForPortal = (portal: Portal): AuthState => {
  const session = readSession(portal);
  if (!session || !hasValidStoredSession(portal)) {
    return emptyAuthState();
  }
  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    user: session.user,
    currentVariant: portal,
    isAuthenticated: true,
  };
};

export type AuthState = {
  accessToken: string | null;

  refreshToken: string | null;

  user: UserDto | null;

  currentVariant?: Variant;

  isAuthenticated: boolean;
};

purgeLegacySharedSession();
const initialState: AuthState = readAuthForPortal(activePortal());

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    setCredentials(state, action: PayloadAction<LoginResponseDto>) {
      const { accessToken, refreshToken, user } = action.payload;
      // The user's roles decide which portal this session belongs to — write it to that portal's key
      // (the internal and candidate login pages already sit under their respective portals).
      const portal = resolvePortalVariantFromUser(user, "candidate");

      writeSession(portal, {
        accessToken,
        refreshToken: refreshToken || null,
        user,
      });

      state.accessToken = accessToken;
      state.refreshToken = refreshToken || null;
      state.user = user;
      state.currentVariant = portal;
      state.isAuthenticated = true;
    },

    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
      patchSession(activePortal(), { accessToken: action.payload });
    },

    updateUser(state, action: PayloadAction<UserDto>) {
      state.user = action.payload;
      patchSession(activePortal(), { user: action.payload });
    },

    // Re-sync Redux to the session of whichever portal the current URL belongs to. Dispatched on
    // navigation so moving between portals in one tab never shows the other portal's identity.
    hydrateActivePortal(state) {
      const next = readAuthForPortal(activePortal());
      state.accessToken = next.accessToken;
      state.refreshToken = next.refreshToken;
      state.user = next.user;
      state.currentVariant = next.currentVariant;
      state.isAuthenticated = next.isAuthenticated;
    },

    logout(state) {
      clearSession(activePortal());

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
  updateUser,
  hydrateActivePortal,
  logout,
} = authSlice.actions;

export default authSlice.reducer;
