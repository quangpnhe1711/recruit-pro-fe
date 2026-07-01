import { test, expect, type Route } from "@playwright/test";
import { installApiMocks, ok, seedSession } from "./support/session";

// E2E-TOAST-001..004 — system/real-time notifications render as a polished bottom-right custom
// card (not raw toast.info), with Vietnamese copy, a working "Xem chi tiết" deep link, and a
// close button. Deterministic: seeded systemAdmin session + mocked /api/**; the SSE stream is
// overridden with a real text/event-stream body carrying one pushed notification.

const DEEP_LINK = "/system-admin/automation/executions";

function notif(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "rt-1",
    userId: "u-admin-1",
    eventCode: "workflow_head_review",
    title: "Hồ sơ đã được chuyển vòng",
    body: "Ứng viên Nguyễn Văn A đã được chuyển sang Head Review cho vị trí DevOps Engineer.",
    type: "workflow",
    data: { url: DEEP_LINK },
    isRead: false,
    isSeen: false,
    createdAt: "2026-07-01T08:00:00Z",
    ...over,
  };
}

async function pushOnStream(page: import("@playwright/test").Page, payload: Record<string, unknown>) {
  await page.route("**/api/notifications/stream", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: `event: notification.created\ndata: ${JSON.stringify(payload)}\n\n`,
    }),
  );
}

test.describe("System notification toast — custom bottom-right card", () => {
  test("E2E-TOAST-001: an SSE notification renders as a custom card with Vietnamese title + body", async ({
    page,
  }) => {
    await seedSession(page, "systemAdmin");
    await installApiMocks(page, [
      { method: "GET", match: /\/api\/notifications$/, json: ok({ items: [] }) },
      { method: "GET", match: /\/api\/notifications\/counts$/, json: ok({ unseen: 0, unread: 0 }) },
    ]);
    await pushOnStream(page, notif());

    await page.goto("/system-admin/automation");

    const card = page.getByRole("status").filter({ hasText: "Hồ sơ đã được chuyển vòng" });
    await expect(card).toBeVisible();
    await expect(card).toContainText("Nguyễn Văn A");
    // It is a real card with a deep-link action, not a plain text toast.info.
    await expect(card.getByRole("button", { name: "Xem chi tiết" })).toBeVisible();

    // The card sits in the bottom half of the viewport (bottom-right container).
    const box = await card.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    if (box && viewport) {
      expect(box.y).toBeGreaterThan(viewport.height / 2);
    }
  });

  test("E2E-TOAST-002: 'Xem chi tiết' navigates to the deep link", async ({ page }) => {
    await seedSession(page, "systemAdmin");
    await installApiMocks(page, [
      { method: "GET", match: /\/api\/notifications$/, json: ok({ items: [] }) },
      { method: "GET", match: /\/api\/notifications\/counts$/, json: ok({ unseen: 0, unread: 0 }) },
    ]);
    await pushOnStream(page, notif());

    await page.goto("/system-admin/automation");
    const card = page.getByRole("status").filter({ hasText: "Hồ sơ đã được chuyển vòng" });
    await card.getByRole("button", { name: "Xem chi tiết" }).click();

    await expect(page).toHaveURL(new RegExp(`${DEEP_LINK}$`));
  });

  test("E2E-TOAST-003: the close button dismisses the toast", async ({ page }) => {
    await seedSession(page, "systemAdmin");
    await installApiMocks(page, [
      { method: "GET", match: /\/api\/notifications$/, json: ok({ items: [] }) },
      { method: "GET", match: /\/api\/notifications\/counts$/, json: ok({ unseen: 0, unread: 0 }) },
    ]);
    await pushOnStream(page, notif());

    await page.goto("/system-admin/automation");
    const card = page.getByRole("status").filter({ hasText: "Hồ sơ đã được chuyển vòng" });
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: "Đóng thông báo" }).click();
    await expect(card).toHaveCount(0);
  });

  test("E2E-TOAST-004: on mobile the toast stays inside the viewport (no horizontal overflow)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedSession(page, "systemAdmin");
    await installApiMocks(page, [
      { method: "GET", match: /\/api\/notifications$/, json: ok({ items: [] }) },
      { method: "GET", match: /\/api\/notifications\/counts$/, json: ok({ unseen: 0, unread: 0 }) },
    ]);
    await pushOnStream(page, notif());

    await page.goto("/system-admin/automation");
    const card = page.getByRole("status").filter({ hasText: "Hồ sơ đã được chuyển vòng" });
    await expect(card).toBeVisible();

    // Poll until the enter animation settles, then assert it fits within the viewport.
    await expect
      .poll(async () => {
        const b = await card.boundingBox();
        return b ? Math.round(b.x + b.width) : 9999;
      })
      .toBeLessThanOrEqual(390);
    const box = await card.boundingBox();
    if (box) expect(box.x).toBeGreaterThanOrEqual(0);
    // No horizontal page overflow either.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    );
    expect(overflow).toBe(true);
  });
});
