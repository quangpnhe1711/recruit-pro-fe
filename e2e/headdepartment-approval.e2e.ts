import { test, expect } from "@playwright/test";
import { installApiMocks, ok, seedSession } from "./support/session";

// E2E-OWN-002 — DepartmentHead job approval queue + detail.
// Verifies HeadDepartment reaches the approval queue, the screens use DepartmentHead
// wording + English job-status labels, and approve/reject submits via PATCH /api/hr/jobs/{id}/status.

const QUEUE_ITEM = {
  jobId: "job-101",
  referenceCode: "JOB-2026-101",
  title: "Senior Backend Engineer",
  departmentName: "Engineering",
  hiringTeamLabel: "Core Platform Team",
  hrOwnerName: "Nguyễn Văn HR",
  status: "PendingApproval",
  submittedAt: "2026-06-20T03:00:00Z",
  vacancyCount: 2,
  requiredSkillsCount: 5,
  applicationsCount: 8,
  isOverdue: true,
};

const APPROVAL_DETAIL = {
  jobId: "job-101",
  referenceCode: "JOB-2026-101",
  title: "Senior Backend Engineer",
  status: "PendingApproval",
  statusLabel: "Chờ duyệt",
  submittedAt: "2026-06-20T03:00:00Z",
  submittedAgoLabel: "Gửi 3 ngày trước",
  hrOwner: { userId: "u-hr-1", fullName: "Nguyễn Văn HR", email: "hr@corp.com", phone: "0900000000" },
  department: { departmentId: "dep-eng", name: "Engineering", description: "Bộ phận kỹ thuật lõi." },
  location: "Hà Nội",
  workMode: "Hybrid",
  employmentType: "Full-time",
  vacancyCount: 2,
  minExperienceYears: 3,
  salaryMin: 30000000,
  salaryMax: 50000000,
  deadline: "2026-07-31T00:00:00Z",
  description: ["Thiết kế và phát triển dịch vụ backend.", "Tối ưu hiệu năng hệ thống."],
  requirements: ["3+ năm kinh nghiệm .NET", "Hiểu biết về kiến trúc microservices"],
  benefits: ["Bảo hiểm cao cấp", "Thưởng dự án"],
  skills: [
    { skillId: "sk-1", name: "C#", minYearsExperience: 3, isRequired: true },
    { skillId: "sk-2", name: "PostgreSQL", minYearsExperience: 2, isRequired: false },
  ],
  insights: {
    applicationsCount: 8,
    activePipelineCount: 3,
    requiredSkillsCount: 5,
    optionalSkillsCount: 2,
    hasSalaryRange: true,
  },
  interviewFlow: [
    { order: 1, label: "Phỏng vấn HR", description: "Sàng lọc ban đầu." },
    { order: 2, label: "Phỏng vấn kỹ thuật", description: "Đánh giá chuyên môn." },
  ],
  approvalSnapshot: {
    approvedByName: null,
    lastUpdatedAt: null,
    summary: "Job đang chờ trưởng bộ phận duyệt.",
  },
};

test.describe("E2E-OWN-002 DepartmentHead approval", () => {
  test("approval queue loads with DepartmentHead wording and English status", async ({ page }) => {
    await seedSession(page, "headDepartment");
    await installApiMocks(page, [
      {
        method: "GET",
        match: /\/api\/manager\/jobs\/approval-queue$/,
        json: ok({
          items: [QUEUE_ITEM],
          meta: { page: 1, pageSize: 8, totalItems: 1, totalPages: 1 },
          summary: { pendingApprovals: 1, submittedToday: 0, overdueReviews: 1, departmentsWaiting: 1 },
        }),
      },
    ]);

    await page.goto("/internal/jobs");
    // DepartmentHead-scoped queue heading + eyebrow.
    await expect(page.getByRole("heading", { name: "Duyệt tin tuyển dụng" })).toBeVisible();
    await expect(page.getByText("Trưởng bộ phận duyệt tin tuyển dụng")).toBeVisible();

    const row = page.locator("table tbody tr", { hasText: "Senior Backend Engineer" });
    await expect(row).toBeVisible();
    // English job-status label in the status cell (not the Vietnamese "Chờ duyệt").
    await expect(row.getByText("Pending Approval")).toBeVisible();
    await expect(row.getByText("Chờ duyệt")).toHaveCount(0);
  });

  test("approval detail uses DepartmentHead wording and approve calls PATCH /api/hr/jobs/{id}/status", async ({
    page,
  }) => {
    await seedSession(page, "headDepartment");
    page.on("dialog", (dialog) => dialog.accept());
    await installApiMocks(page, [
      { method: "GET", match: /\/api\/manager\/jobs\/job-101\/approval-detail$/, json: ok(APPROVAL_DETAIL) },
      {
        method: "GET",
        match: /\/api\/manager\/jobs\/approval-queue$/,
        json: ok({ items: [], meta: { page: 1, pageSize: 8, totalItems: 0, totalPages: 0 }, summary: {} }),
      },
      {
        method: "PATCH",
        match: /\/api\/hr\/jobs\/job-101\/status$/,
        json: ok({ jobId: "job-101", approvalStatus: "APPROVED" }),
      },
    ]);

    await page.goto("/manager/jobs/job-101/approval");
    await expect(page.getByRole("heading", { name: "Senior Backend Engineer" })).toBeVisible();
    // DepartmentHead authorization wording.
    await expect(
      page.getByText(
        "Chỉ trưởng bộ phận của phòng ban hoặc quản trị hệ thống mới có thể duyệt hoặc từ chối tin tuyển dụng này.",
      ),
    ).toBeVisible();
    // English job-status label in the header (canonical presentation).
    await expect(page.getByText("Pending Approval")).toBeVisible();

    const approve = page.getByRole("button", { name: /Duyệt job/ });
    await expect(approve).toBeVisible();

    const patchRequest = page.waitForRequest(
      (req) => req.method() === "PATCH" && /\/api\/hr\/jobs\/job-101\/status$/.test(req.url()),
    );
    await approve.click();
    const request = await patchRequest;

    // Approval MUST go through the HR status endpoint, never the non-hr /api/jobs/{id}/status alias.
    expect(request.url()).toContain("/api/hr/jobs/job-101/status");
    expect(JSON.parse(request.postData() ?? "{}")).toMatchObject({ status: "APPROVED" });
  });
});
