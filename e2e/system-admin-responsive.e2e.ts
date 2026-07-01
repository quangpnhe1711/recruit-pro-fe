import { test, expect } from "@playwright/test";
import { installApiMocks, ok, seedSession } from "./support/session";

// E2E-RESP-001..004 — SystemAdmin navigation + layout on mobile viewport (390px). The desktop
// sidebar becomes a proper left drawer: hamburger opens it, a backdrop closes it, choosing a nav
// item closes it, and the page never overflows horizontally. Deterministic: mocked /api/**.

const MOBILE = { width: 390, height: 844 };

function visibleAside(page: import("@playwright/test").Page) {
  // On mobile only the drawer aside is displayed (the desktop-only one is display:none).
  return page.locator("aside:visible").first();
}

test.describe("SystemAdmin mobile drawer + responsive layout", () => {
  test.use({ viewport: MOBILE });

  test("E2E-RESP-001: hamburger opens the left drawer with automation nav groups", async ({ page }) => {
    await seedSession(page, "systemAdmin");
    await installApiMocks(page, [
      { method: "GET", match: /\/api\/sysadmin\/automation\/dashboard$/, json: ok(null) },
      { method: "GET", match: /\/api\/sysadmin\/automation\/diagnostics$/, json: ok(null) },
    ]);

    await page.goto("/system-admin/automation");

    const hamburger = page.getByRole("button", { name: "Mở menu điều hướng" });
    await expect(hamburger).toBeVisible();

    // Drawer starts off-screen (translated left).
    const drawer = visibleAside(page);
    const closedBox = await drawer.boundingBox();
    expect(closedBox).not.toBeNull();
    if (closedBox) expect(closedBox.x).toBeLessThan(0);

    await hamburger.click();

    // Drawer slid in (x >= 0) and shows the business nav groups + items.
    await expect.poll(async () => (await drawer.boundingBox())?.x ?? -1).toBeGreaterThanOrEqual(0);
    await expect(drawer.getByText("Tự động hóa tuyển dụng")).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Workflows" })).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Lịch sử chạy" })).toBeVisible();
    await expect(drawer.getByText("Công cụ nội bộ")).toBeVisible();
    await expect(page.getByTestId("mobile-drawer-backdrop")).toBeVisible();
  });

  test("E2E-RESP-002: choosing a nav item navigates and closes the drawer", async ({ page }) => {
    await seedSession(page, "systemAdmin");
    await installApiMocks(page, [
      { method: "GET", match: /\/api\/sysadmin\/automation\/dashboard$/, json: ok(null) },
      { method: "GET", match: /\/api\/sysadmin\/automation\/diagnostics$/, json: ok(null) },
      { method: "GET", match: /\/api\/sysadmin\/automation\/workflows$/, json: ok([]) },
    ]);

    await page.goto("/system-admin/automation");
    await page.getByRole("button", { name: "Mở menu điều hướng" }).click();

    const drawer = visibleAside(page);
    await drawer.getByRole("link", { name: "Workflows" }).click();

    await expect(page).toHaveURL(/\/system-admin\/automation\/workflows$/);
    // Drawer closed again (off-screen).
    await expect.poll(async () => (await drawer.boundingBox())?.x ?? 0).toBeLessThan(0);
  });

  test("E2E-RESP-003: tapping the backdrop closes the drawer", async ({ page }) => {
    await seedSession(page, "systemAdmin");
    await installApiMocks(page, [
      { method: "GET", match: /\/api\/sysadmin\/automation\/dashboard$/, json: ok(null) },
      { method: "GET", match: /\/api\/sysadmin\/automation\/diagnostics$/, json: ok(null) },
    ]);

    await page.goto("/system-admin/automation");
    await page.getByRole("button", { name: "Mở menu điều hướng" }).click();
    await expect(page.getByTestId("mobile-drawer-backdrop")).toBeVisible();

    // Click on the right side of the backdrop (the drawer covers only the left 260px).
    await page.getByTestId("mobile-drawer-backdrop").click({ position: { x: 360, y: 400 } });
    await expect(page.getByTestId("mobile-drawer-backdrop")).toHaveCount(0);
  });

  test("E2E-RESP-004: automation dashboard has no horizontal page overflow on mobile", async ({ page }) => {
    await seedSession(page, "systemAdmin");
    await installApiMocks(page, [
      {
        method: "GET",
        match: /\/api\/sysadmin\/automation\/dashboard$/,
        json: ok({
          totalWorkflows: 4,
          enabledWorkflows: 4,
          executionsToday: 2,
          failedExecutions: 0,
          deadLetterCount: 0,
          mostCommonFailedAction: null,
          recentExecutions: [],
        }),
      },
      {
        method: "GET",
        match: /\/api\/sysadmin\/automation\/diagnostics$/,
        json: ok({
          automationEnabled: true,
          defaultMode: "Shadow",
          workers: [{ name: "dispatcher", lastBeatAt: "2026-07-01T08:00:00Z", secondsSinceBeat: 3, isStale: false, status: "Running" }],
          dispatcherHealthy: true,
          pendingEvents: 0,
          processingEvents: 0,
          failedEvents: 0,
          deadLetterEvents: 0,
          executionsToday: 2,
          failedExecutions: 0,
          unresolvedDeadLetters: 0,
          latestEvent: null,
          latestExecution: null,
          warnings: [],
        }),
      },
    ]);

    await page.goto("/system-admin/automation");
    await expect(page.getByRole("heading", { name: "Tự động hóa tuyển dụng" })).toBeVisible();

    const noOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    );
    expect(noOverflow).toBe(true);
  });
});
