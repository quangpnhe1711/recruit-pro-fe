import { test, expect, type Route } from "@playwright/test";
import { installApiMocks, ok, seedSession } from "./support/session";

// E2E-NOTI-001..006 — notification bell over SSE realtime + seen/read semantics + deep-link click.
// Deterministic: an authenticated HR session is seeded into localStorage and every /api/** response
// is mocked (see ./support/session). The notification bell lives in AppHeader, which renders on every
// authenticated screen via AuthenticatedLayout; we exercise it on /jobs.

const DEEP_LINK = "/hr/applications/app-77";

type Override = Record<string, unknown>;

function notif(over: Override = {}): Record<string, unknown> {
  return {
    id: "n1",
    userId: "u-hr-1",
    eventCode: "application_applied",
    title: "Ứng viên mới ứng tuyển",
    body: "Nguyễn Văn A đã ứng tuyển vị trí Backend Engineer.",
    type: "application",
    data: { url: DEEP_LINK, targetType: "application", targetId: "app-77" },
    entityType: "application",
    entityId: "app-77",
    isRead: false,
    isSeen: false,
    createdAt: "2026-06-28T08:00:00Z",
    ...over,
  };
}

// The bell button in AppHeader is the one carrying the "notifications" material-symbol ligature.
function bellButton(page: import("@playwright/test").Page) {
  return page
    .getByRole("button")
    .filter({ has: page.getByText("notifications", { exact: true }) });
}

const HR_JOBS_PAYLOAD = ok({
  items: [],
  meta: { page: 1, pageSize: 1000, totalItems: 0, totalPages: 1 },
  stats: { activeJobs: 0, pendingApproval: 0, totalApplications: 0, timeToHireDays: 0 },
});

test.describe("Notification bell — SSE realtime, seen/read, deep-link navigation", () => {
  test("E2E-NOTI-002/003: opening the bell marks all SEEN only — never READ", async ({ page }) => {
    const calls: { method: string; path: string }[] = [];

    await seedSession(page, "hr");
    await installApiMocks(
      page,
      [
        { method: "GET", match: /\/api\/hr\/jobs$/, json: HR_JOBS_PAYLOAD },
        { method: "GET", match: /\/api\/notifications$/, json: ok({ items: [notif()] }) },
        { method: "GET", match: /\/api\/notifications\/counts$/, json: ok({ unseen: 1, unread: 1 }) },
        { method: "POST", match: /\/api\/notifications\/seen$/, json: ok({ unseen: 0, unread: 1 }) },
      ],
      {
        onRequest: (method, url) => calls.push({ method, path: url.pathname }),
      },
    );

    await page.goto("/internal/jobs");
    // Wait for the unseen badge to render (GET /counts resolved → unseenCount=1) before opening the
    // bell. Clicking earlier races the counts fetch, and markAllSeen no-ops while unseenCount is 0.
    await expect(bellButton(page).getByText("1", { exact: true })).toBeVisible();
    await bellButton(page).click();

    // The bell dropdown opened and shows the notification.
    await expect(page.getByText("Ứng viên mới ứng tuyển")).toBeVisible();

    // SEEN was called…
    await expect
      .poll(() => calls.some((c) => c.method === "POST" && /\/api\/notifications\/seen$/.test(c.path)))
      .toBe(true);
    // …and READ was NOT (opening the bell must not mark items read).
    expect(calls.some((c) => /\/api\/notifications\/[^/]+\/read$/.test(c.path))).toBe(false);
    expect(calls.some((c) => /\/api\/notifications\/read-all$/.test(c.path))).toBe(false);
  });

  test("E2E-NOTI-004/005: clicking a notification marks only that item READ and navigates to data.url", async ({
    page,
  }) => {
    const calls: { method: string; path: string }[] = [];

    await seedSession(page, "hr");
    await installApiMocks(
      page,
      [
        { method: "GET", match: /\/api\/hr\/jobs$/, json: HR_JOBS_PAYLOAD },
        { method: "GET", match: /\/api\/notifications$/, json: ok({ items: [notif()] }) },
        { method: "GET", match: /\/api\/notifications\/counts$/, json: ok({ unseen: 1, unread: 1 }) },
        { method: "POST", match: /\/api\/notifications\/seen$/, json: ok({ unseen: 0, unread: 1 }) },
        // markAsRead tries PATCH first; mock it.
        { method: "PATCH", match: /\/api\/notifications\/n1\/read$/, json: ok(notif({ isRead: true, isSeen: true })) },
        // The deep-link target screen — any benign success keeps the route from erroring.
        { method: "GET", match: /\/api\/hr\/applications\/app-77$/, json: ok({ id: "app-77" }) },
      ],
      {
        onRequest: (method, url) => calls.push({ method, path: url.pathname }),
      },
    );

    await page.goto("/internal/jobs");
    await bellButton(page).click();

    await page.getByText("Ứng viên mới ứng tuyển").click();

    // Navigated to the stored deep link…
    await expect(page).toHaveURL(new RegExp(`${DEEP_LINK}$`));
    // …and exactly that item was marked read (PATCH or POST fallback on /n1/read).
    await expect
      .poll(() => calls.some((c) => /\/api\/notifications\/n1\/read$/.test(c.path)))
      .toBe(true);
    expect(calls.some((c) => /\/api\/notifications\/read-all$/.test(c.path))).toBe(false);
  });

  test("E2E-NOTI-006: a malformed deep link shows a toast and does not crash or navigate", async ({
    page,
  }) => {
    await seedSession(page, "hr");
    await installApiMocks(page, [
      { method: "GET", match: /\/api\/hr\/jobs$/, json: HR_JOBS_PAYLOAD },
      {
        method: "GET",
        match: /\/api\/notifications$/,
        // No usable url in data → resolveDeepLinkUrl returns null.
        json: ok({ items: [notif({ data: { targetType: "application", targetId: "app-77" } })] }),
      },
      { method: "GET", match: /\/api\/notifications\/counts$/, json: ok({ unseen: 1, unread: 1 }) },
      { method: "POST", match: /\/api\/notifications\/seen$/, json: ok({ unseen: 0, unread: 1 }) },
      { method: "PATCH", match: /\/api\/notifications\/n1\/read$/, json: ok(notif({ isRead: true })) },
    ]);

    await page.goto("/internal/jobs");
    await bellButton(page).click();
    await page.getByText("Ứng viên mới ứng tuyển").click();

    await expect(page.getByText("Không tìm thấy đường dẫn thông báo.")).toBeVisible();
    // Still on /jobs — no navigation occurred.
    await expect(page).toHaveURL(/\/jobs$/);
  });

  test("E2E-NOTI-001: an SSE notification.created event surfaces without a page refresh", async ({
    page,
  }) => {
    await seedSession(page, "hr");
    await installApiMocks(page, [
      { method: "GET", match: /\/api\/hr\/jobs$/, json: HR_JOBS_PAYLOAD },
      { method: "GET", match: /\/api\/notifications$/, json: ok({ items: [] }) },
      { method: "GET", match: /\/api\/notifications\/counts$/, json: ok({ unseen: 0, unread: 0 }) },
    ]);

    // Override the default stream-abort with a real text/event-stream body carrying one event.
    // Registered after installApiMocks, so Playwright runs it first (most-recent route wins).
    const pushed = notif({ id: "rt-1", title: "Thông báo realtime mới" });
    await page.route("**/api/notifications/stream", (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: `event: notification.created\ndata: ${JSON.stringify(pushed)}\n\n`,
      }),
    );

    await page.goto("/internal/jobs");

    // The realtime handler raises a toast for the pushed notification — no manual refresh needed.
    await expect(page.getByText("Thông báo realtime mới")).toBeVisible();
  });
});
