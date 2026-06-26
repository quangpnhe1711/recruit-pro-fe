import { test, expect } from "@playwright/test";
import { installApiMocks, ok, seedSession } from "./support/session";

// E2E-OWN-003 — HR ownership display on the job management list.
// Verifies recruiter and department-head ownership fields render, with a safe fallback
// ("Chưa có trưởng bộ phận") when an owner is missing, and English job-status labels.

const JOBS = [
  {
    id: "job-201",
    title: "Senior Backend Engineer",
    department: "Engineering",
    status: "APPROVED",
    createdAt: "2026-05-01T08:00:00Z",
    applicationCount: 12,
    createdBy: { id: "u-hr-1", fullName: "Nguyễn Văn HR", email: "hr@corp.com" },
    approvedBy: null,
    vacancyCount: 2,
    recruiterName: "Lê Thị Recruiter",
    departmentHeadName: "Trần Văn Head",
    effectiveDepartmentHeadName: "Trần Văn Head",
  },
  {
    id: "job-202",
    title: "Data Analyst",
    department: "Data & Analytics",
    status: "PENDING_APPROVAL",
    createdAt: "2026-05-02T08:00:00Z",
    applicationCount: 0,
    createdBy: { id: "u-hr-2", fullName: "Phạm HR Hai", email: "hr2@corp.com" },
    approvedBy: null,
    vacancyCount: 1,
    recruiterName: null,
    departmentHeadName: null,
    effectiveDepartmentHeadName: null,
  },
];

test.describe("E2E-OWN-003 HR ownership display", () => {
  test("job management list shows recruiter/department-head ownership with safe fallback", async ({
    page,
  }) => {
    await seedSession(page, "hr");
    await installApiMocks(page, [
      {
        method: "GET",
        match: /\/api\/hr\/jobs$/,
        json: ok({
          items: JOBS,
          meta: { page: 1, pageSize: 1000, totalItems: 2, totalPages: 1 },
          stats: { activeJobs: 1, pendingApproval: 1, totalApplications: 12, timeToHireDays: 30 },
        }),
      },
    ]);

    await page.goto("/jobs");
    await expect(page.getByRole("heading", { name: "Quản lý job" })).toBeVisible();

    const table = page.locator("table");
    await expect(table.getByText("Phụ trách")).toBeVisible();

    // Job with owners assigned → both names shown.
    const ownedRow = table.locator("tr", { hasText: "Senior Backend Engineer" });
    await expect(ownedRow.getByText("Lê Thị Recruiter")).toBeVisible();
    await expect(ownedRow.getByText("Trần Văn Head")).toBeVisible();
    await expect(ownedRow.getByText("Approved")).toBeVisible();

    // Job missing a department head → safe fallback, English job status.
    const unownedRow = table.locator("tr", { hasText: "Data Analyst" });
    await expect(unownedRow.getByText("Chưa có trưởng bộ phận")).toBeVisible();
    await expect(unownedRow.getByText("Pending Approval")).toBeVisible();

    // English job-status labels only — no Vietnamese workflow status in the column.
    await expect(table.getByText("Đang tuyển")).toHaveCount(0);
    await expect(table.getByText("Chờ duyệt")).toHaveCount(0);
  });
});
