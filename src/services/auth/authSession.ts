import type { UserDto } from "../../modules/auth/authSchema";

// Each portal keeps its OWN session in its OWN localStorage key, stored as one JSON blob. This lets a
// user be signed into the internal (HR/manager/admin) portal and the candidate portal at the same
// time without the two clobbering each other. The active portal is derived from the current URL, so
// every auth read (token attach, refresh, guards) resolves the correct session deterministically.

export type Portal = "candidate" | "internal";

export type StoredSession = {
  accessToken: string;
  refreshToken: string | null;
  user: UserDto;
};

const SESSION_KEY: Record<Portal, string> = {
  candidate: "rp_candidate_session",
  internal: "rp_internal_session",
};

// URL prefixes that belong to the internal portal. Everything else (candidate area, public job
// browsing, /login, /register, "/") is the candidate portal.
const INTERNAL_PREFIXES = ["/hr", "/manager", "/internal", "/system-admin"];

export function portalForPath(pathname: string): Portal {
  return INTERNAL_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
    ? "internal"
    : "candidate";
}

export function activePortal(): Portal {
  return portalForPath(window.location.pathname);
}

export function loginPathForPortal(portal: Portal): string {
  return portal === "internal" ? "/internal/login" : "/login";
}

export function readSession(portal: Portal): StoredSession | null {
  const raw = localStorage.getItem(SESSION_KEY[portal]);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    localStorage.removeItem(SESSION_KEY[portal]);
    return null;
  }
}

export function writeSession(portal: Portal, session: StoredSession): void {
  localStorage.setItem(SESSION_KEY[portal], JSON.stringify(session));
}

export function patchSession(portal: Portal, patch: Partial<StoredSession>): void {
  const current = readSession(portal);
  if (!current) {
    return;
  }
  writeSession(portal, { ...current, ...patch });
}

export function clearSession(portal: Portal): void {
  localStorage.removeItem(SESSION_KEY[portal]);
}

// One-time cleanup of the pre-split shared keys, so old sessions don't linger after upgrade.
export function purgeLegacySharedSession(): void {
  for (const key of ["access_token", "refresh_token", "current_variant", "auth_user"]) {
    localStorage.removeItem(key);
  }
}
