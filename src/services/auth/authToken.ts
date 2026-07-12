function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");

  return window.atob(padded);
}

function parseJwtPayload(token: string) {
  const parts = token.split(".");

  if (parts.length !== 3 || !parts[1]) {
    return null;
  }

  try {
    const payload = decodeBase64Url(parts[1]);
    return JSON.parse(payload) as { exp?: number };
  } catch {
    return null;
  }
}

export function isTokenValid(token: string | null | undefined) {
  if (!token) {
    return false;
  }

  const payload = parseJwtPayload(token);

  if (!payload) {
    return false;
  }

  if (typeof payload.exp !== "number") {
    return true;
  }

  return payload.exp * 1000 > Date.now();
}

export function hasUsableRefreshToken(token: string | null | undefined) {
  const normalized = token?.trim();

  return Boolean(normalized && normalized !== "null" && normalized !== "undefined");
}

export function hasValidStoredSession() {
  const accessToken = localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");

  // The access token is a JWT, but the refresh token is an opaque server-side random string.
  // Do not JWT-validate the refresh token; a real /auth/refresh call is the authority.
  return isTokenValid(accessToken) || hasUsableRefreshToken(refreshToken);
}

export function hasStoredToken() {
  return Boolean(
    localStorage.getItem("access_token") || localStorage.getItem("refresh_token"),
  );
}
