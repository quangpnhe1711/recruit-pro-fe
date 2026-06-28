import type { Page, Route } from "@playwright/test";

// ---------------------------------------------------------------------------
// Auth seeding
// ---------------------------------------------------------------------------
// The app hydrates Redux auth from localStorage at store-creation time
// (src/store/slices/authSlice.ts). A session is "valid" only if BOTH access_token
// and refresh_token decode to a JWT payload with a future `exp`
// (src/services/auth/authToken.ts). The frontend only DECODES the token — it never
// verifies the signature — so any structurally valid JWT with a future exp works.

const FAR_FUTURE_EXP = 9999999999; // seconds → year 2286

function base64Url(value: object): string {
  return Buffer.from(JSON.stringify(value))
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export function makeJwt(exp: number = FAR_FUTURE_EXP): string {
  return `${base64Url({ alg: "HS256", typ: "JWT" })}.${base64Url({ exp })}.signature`;
}

export type Variant = "candidate" | "internal";

export type SeedUser = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  phone: string | null;
  roles: string[];
  permissions: string[];
};

export type SessionKey = "candidate" | "headDepartment" | "hr";

// Permissions are derived from `roles` automatically by the FE
// (rolePermissions.getEffectivePermissions), so seeding the role is enough.
export const SESSIONS: Record<SessionKey, { variant: Variant; user: SeedUser }> = {
  candidate: {
    variant: "candidate",
    user: {
      id: "u-cand-1",
      username: "phungnhatquang",
      email: "candidate@test.local",
      fullName: "Phùng Nhật Quang",
      avatarUrl: null,
      phone: null,
      roles: ["candidate"],
      permissions: [],
    },
  },
  headDepartment: {
    variant: "internal",
    user: {
      id: "u-head-1",
      username: "tiendat",
      email: "head@test.local",
      fullName: "Trần Trọng Tiến Đạt",
      avatarUrl: null,
      phone: null,
      roles: ["headdepartment"],
      permissions: [],
    },
  },
  hr: {
    variant: "internal",
    user: {
      id: "u-hr-1",
      username: "thucuyen",
      email: "hr@test.local",
      fullName: "Nguyễn Thục Uyên",
      avatarUrl: null,
      phone: null,
      roles: ["hr"],
      permissions: [],
    },
  },
};

export async function seedSession(page: Page, key: SessionKey): Promise<void> {
  const { variant, user } = SESSIONS[key];
  const payload = { token: makeJwt(), variant, user: JSON.stringify(user) };
  await page.addInitScript((data: { token: string; variant: string; user: string }) => {
    localStorage.setItem("access_token", data.token);
    localStorage.setItem("refresh_token", data.token);
    localStorage.setItem("current_variant", data.variant);
    localStorage.setItem("auth_user", data.user);
  }, payload);
}

// ---------------------------------------------------------------------------
// API mocking
// ---------------------------------------------------------------------------
// All app data calls go to http://localhost:5013/api/** (absolute VITE_API_BASE_URL).
// Every mock MUST return HTTP 200 — a 401 triggers the axios interceptor's
// force-logout + redirect (src/services/http/api-client.ts), which would break the test.

export function ok(data: unknown, message = "OK"): Record<string, unknown> {
  return { success: true, message, data };
}

export type MockHandler = {
  method?: string;
  match: RegExp; // tested against the URL pathname
  status?: number;
  json: unknown | ((url: URL, body: string | null) => unknown);
};

export type MockOptions = {
  onRequest?: (method: string, url: URL, body: string | null) => void;
};

export async function installApiMocks(
  page: Page,
  handlers: MockHandler[],
  options: MockOptions = {},
): Promise<void> {
  await page.route("**/api/**", async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method().toUpperCase();
    const body = request.postData();
    options.onRequest?.(method, url, body);

    // Notification realtime is now SSE (GET /api/notifications/stream). By default abort it so the
    // fetch-based client backs off quietly instead of holding an open stream during a test. A spec
    // that exercises realtime delivery registers its own `page.route(".../stream", ...)` with a
    // `text/event-stream` body — Playwright runs the most-recently-added route first, so that wins.
    if (/\/api\/notifications\/stream$/.test(url.pathname)) {
      return route.abort();
    }

    // Global shell calls fired by NotificationProvider on every authenticated screen. A spec can
    // override any of these by passing its own handler (checked before the default below).
    const hasOverride = handlers.some(
      (h) => h.match.test(url.pathname) && (!h.method || h.method.toUpperCase() === method),
    );
    if (!hasOverride && /\/api\/notifications\/counts$/.test(url.pathname)) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok({ unseen: 0, unread: 0 })),
      });
    }
    if (!hasOverride && /\/api\/notifications\/unread-count$/.test(url.pathname)) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok({ unreadCount: 0 })),
      });
    }
    if (!hasOverride && /\/api\/notifications$/.test(url.pathname)) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok({ items: [] })),
      });
    }

    for (const handler of handlers) {
      if (handler.method && handler.method.toUpperCase() !== method) continue;
      if (!handler.match.test(url.pathname)) continue;
      const payload =
        typeof handler.json === "function"
          ? (handler.json as (u: URL, b: string | null) => unknown)(url, body)
          : handler.json;
      return route.fulfill({
        status: handler.status ?? 200,
        contentType: "application/json",
        body: JSON.stringify(payload),
      });
    }

    // Fallback: any un-mocked /api call returns a benign success so the app never
    // hits a network error or 401-driven logout mid-test.
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(ok(null)),
    });
  });
}
