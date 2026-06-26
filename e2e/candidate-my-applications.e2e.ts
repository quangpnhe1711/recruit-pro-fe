import { test, expect } from "@playwright/test";
import { installApiMocks, ok, seedSession } from "./support/session";

// E2E-OWN-001 — Candidate "My Applications" canonical English status display.
// Verifies the application-status contract end to end: badges render English labels,
// ManagerReview presents as "Head Review", and an unknown status renders "Unknown" —
// never collapsing to "Rejected"/"Từ chối" (the regression this contract guards against).

type AppOverride = Record<string, unknown>;

function application(over: AppOverride): Record<string, unknown> {
  return {
    id: "app",
    jobId: "job",
    jobTitle: "Job",
    companyOrDepartment: "Engineering",
    appliedDate: "2026-06-01T08:00:00Z",
    status: "Applied",
    statusLabel: "",
    nextStep: "—",
    availableActions: [],
    ...over,
  };
}

test.describe("E2E-OWN-001 Candidate My Applications status display", () => {
  test("ManagerReview→Head Review, Rejected→Rejected, unknown→Unknown (never Rejected)", async ({
    page,
  }) => {
    await seedSession(page, "candidate");
    await installApiMocks(page, [
      {
        method: "GET",
        match: /\/api\/candidate\/applications$/,
        json: ok({
          items: [
            application({
              id: "a3",
              jobId: "j3",
              jobTitle: "Engineering Manager",
              status: "ManagerReview",
              statusLabel: "Trưởng bộ phận đang duyệt",
              appliedDate: "2026-06-03T08:00:00Z",
            }),
            application({
              id: "a4",
              jobId: "j4",
              jobTitle: "QA Engineer",
              status: "Rejected",
              statusLabel: "Đã từ chối",
              appliedDate: "2026-06-02T08:00:00Z",
            }),
            application({
              id: "a5",
              jobId: "j5",
              jobTitle: "DevOps Engineer",
              status: "TotallyBogusStatus",
              statusLabel: "???",
              appliedDate: "2026-06-01T08:00:00Z",
            }),
          ],
          summary: { total: 3, active: 1, closed: 1 },
        }),
      },
      { method: "GET", match: /\/api\/candidate\/interviews$/, json: ok({ items: [] }) },
    ]);

    await page.goto("/candidate/my-applications");
    await expect(page.getByRole("heading", { name: "Đơn ứng tuyển của tôi" })).toBeVisible();

    const table = page.locator("table");
    await expect(
      table.locator("tr", { hasText: "Engineering Manager" }).getByText("Head Review"),
    ).toBeVisible();
    await expect(
      table.locator("tr", { hasText: "QA Engineer" }).getByText("Rejected"),
    ).toBeVisible();

    const bogusRow = table.locator("tr", { hasText: "DevOps Engineer" });
    await expect(bogusRow.getByText("Unknown")).toBeVisible();
    await expect(bogusRow.getByText("Rejected")).toHaveCount(0);

    // No Vietnamese workflow-status label leaks into the status table.
    await expect(table.getByText("Từ chối")).toHaveCount(0);
    await expect(table.getByText("QL xét duyệt")).toHaveCount(0);
  });

  test("Applied/Screening/Interview render English labels", async ({ page }) => {
    await seedSession(page, "candidate");
    await installApiMocks(page, [
      {
        method: "GET",
        match: /\/api\/candidate\/applications$/,
        json: ok({
          items: [
            application({
              id: "b1",
              jobId: "k1",
              jobTitle: "Backend Engineer",
              status: "Screening",
              appliedDate: "2026-06-03T08:00:00Z",
            }),
            application({
              id: "b2",
              jobId: "k2",
              jobTitle: "Frontend Engineer",
              status: "Interview",
              appliedDate: "2026-06-02T08:00:00Z",
            }),
            application({
              id: "b0",
              jobId: "k0",
              jobTitle: "Intern Engineer",
              status: "Applied",
              appliedDate: "2026-06-01T08:00:00Z",
            }),
          ],
          summary: { total: 3, active: 3, closed: 0 },
        }),
      },
      { method: "GET", match: /\/api\/candidate\/interviews$/, json: ok({ items: [] }) },
    ]);

    await page.goto("/candidate/my-applications");
    const table = page.locator("table");
    await expect(
      table.locator("tr", { hasText: "Backend Engineer" }).getByText("Screening"),
    ).toBeVisible();
    await expect(
      table.locator("tr", { hasText: "Frontend Engineer" }).getByText("Interview"),
    ).toBeVisible();
    await expect(
      table.locator("tr", { hasText: "Intern Engineer" }).getByText("Applied"),
    ).toBeVisible();
    await expect(table.getByText("Sàng lọc")).toHaveCount(0);
  });
});
