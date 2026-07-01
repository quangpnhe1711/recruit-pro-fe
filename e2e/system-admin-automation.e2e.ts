import { test, expect } from "@playwright/test";
import { installApiMocks, ok, seedSession } from "./support/session";

const EXEC = {
  id: "exec-0001-aaaa-bbbb-cccc-000000000001",
  workflowDefinitionId: "wf-1",
  workflowName: "Pass CV → Notify Head Review",
  eventType: "PassedToHeadReview",
  mode: "Shadow",
  status: "Success",
  startedAt: "2026-07-01T08:00:00Z",
  finishedAt: "2026-07-01T08:00:01Z",
  durationMs: 1000,
  attemptCount: 1,
  errorReason: null,
  retryAvailable: false,
  createdAt: "2026-07-01T08:00:00Z",
};

const FAILED_EXEC = {
  ...EXEC,
  id: "exec-0001-aaaa-bbbb-cccc-000000000002",
  status: "Failed",
  errorReason: "Unknown action handler 'explode'",
  retryAvailable: true,
};

const WORKFLOWS = [
  { id: "wf-1", name: "Pass CV → Notify Head Review", isEnabled: true, activeVersionNo: 1, triggerEventType: "PassedToHeadReview", mode: "Shadow", lastRunAt: "2026-07-01T08:00:00Z", lastStatus: "Success" },
  { id: "wf-2", name: "Head Review Overdue Reminder", isEnabled: true, activeVersionNo: 1, triggerEventType: "HeadReviewOverdue", mode: "Shadow", lastRunAt: null, lastStatus: null },
  { id: "wf-3", name: "High-fit Candidate Alert", isEnabled: true, activeVersionNo: 2, triggerEventType: "CandidateApplied", mode: "Live", lastRunAt: "2026-07-01T09:00:00Z", lastStatus: "Success" },
  { id: "wf-4", name: "Interview Completed Follow-up", isEnabled: false, activeVersionNo: 1, triggerEventType: "InterviewCompleted", mode: "Shadow", lastRunAt: null, lastStatus: null },
];

const VERSION = {
  id: "ver-1",
  versionNo: 1,
  triggerEventType: "PassedToHeadReview",
  conditions: [{ field: "departmentHeadId", operator: "exists", value: null }],
  actions: [{ type: "notify_user", configJson: '{"recipients":["assignedDepartmentHead"],"title":"Hồ sơ chờ bạn duyệt"}', description: "Gửi thông báo tới người phụ trách" }],
  mode: "Shadow",
  isActive: true,
  publishedAt: "2026-07-01T07:00:00Z",
  createdAt: "2026-07-01T07:00:00Z",
};

function detail(id: string, mode = "Shadow") {
  const wf = WORKFLOWS.find((w) => w.id === id) ?? WORKFLOWS[0];
  return {
    id: wf.id,
    name: wf.name,
    description: "Quy trình tự động demo",
    isEnabled: wf.isEnabled,
    activeVersion: { ...VERSION, mode },
    versions: [{ ...VERSION, mode }],
    recentExecutions: [EXEC],
    createdAt: "2026-07-01T07:00:00Z",
    updatedAt: null,
  };
}

function baseMocks() {
  return [
    { method: "GET", match: /\/automation\/dashboard$/, json: ok({ totalWorkflows: 4, enabledWorkflows: 3, executionsToday: 5, failedExecutions: 1, deadLetterCount: 0, mostCommonFailedAction: "notify_user", recentExecutions: [EXEC] }) },
    { method: "GET", match: /\/automation\/workflows$/, json: ok(WORKFLOWS) },
    { method: "POST", match: /\/automation\/workflows$/, json: ok(detail("wf-1")) },
    { method: "POST", match: /\/automation\/workflows\/[^/]+\/publish$/, json: ok(VERSION) },
    { method: "PATCH", match: /\/automation\/workflows\/[^/]+\/enabled$/, json: ok(detail("wf-1")) },
    { method: "GET", match: /\/automation\/workflows\/[^/]+$/, json: (url: URL) => ok(detail(url.pathname.split("/").pop()!)) },
    { method: "POST", match: /\/automation\/executions\/[^/]+\/retry$/, json: ok({ ...FAILED_EXEC, status: "Success", retryAvailable: false }) },
    { method: "GET", match: /\/automation\/executions\/[^/]+$/, json: () => ok({
      ...EXEC,
      inputPayloadJson: '{"departmentHeadId":"head-1","finalScore":88}',
      outputJson: '{"mode":"Shadow","steps":[{"sent":false,"wouldNotify":["head-1"]}]}',
      versionSnapshot: VERSION,
      steps: [
        { id: "s1", stepNo: 1, stepType: "condition", actionType: null, status: "Success", inputJson: "[]", outputJson: '{"passed":true}', errorReason: null, startedAt: EXEC.startedAt, finishedAt: EXEC.finishedAt },
        { id: "s2", stepNo: 2, stepType: "action", actionType: "notify_user", status: "Success", inputJson: "{}", outputJson: '{"sent":false,"wouldNotify":["head-1"]}', errorReason: null, startedAt: EXEC.startedAt, finishedAt: EXEC.finishedAt },
      ],
    }) },
    { method: "GET", match: /\/automation\/executions$/, json: ok({ items: [EXEC, FAILED_EXEC], currentPage: 1, pageSize: 20, totalItems: 2, totalPages: 1 }) },
  ];
}

test.describe("SystemAdmin v4 Workflow Automation", () => {
  test("dashboard loads with stat cards and recent executions", async ({ page }) => {
    await seedSession(page, "systemAdmin");
    await installApiMocks(page, baseMocks());
    await page.goto("/system-admin/automation");
    await expect(page.getByRole("heading", { name: "Tự động hóa tuyển dụng" })).toBeVisible();
    await expect(page.getByText("Tổng workflow")).toBeVisible();
    await expect(page.getByText("Dead-letter").first()).toBeVisible();
    await expect(page.getByTestId("most-common-failed")).toHaveText("notify_user");
  });

  test("workflow list shows seeded templates with mode badges", async ({ page }) => {
    await seedSession(page, "systemAdmin");
    await installApiMocks(page, baseMocks());
    await page.goto("/system-admin/automation/workflows");
    await expect(page.getByRole("heading", { name: "Danh sách workflow" })).toBeVisible();
    for (const w of WORKFLOWS) {
      await expect(page.getByText(w.name).first()).toBeVisible();
    }
    await expect(page.getByText("Live").first()).toBeVisible();
  });

  test("workflow detail shows trigger, condition, action and mode", async ({ page }) => {
    await seedSession(page, "systemAdmin");
    await installApiMocks(page, baseMocks());
    await page.goto("/system-admin/automation/workflows/wf-1");
    await expect(page.getByRole("heading", { name: "Pass CV → Notify Head Review" })).toBeVisible();
    await expect(page.getByText("Chuyển Trưởng bộ phận duyệt").first()).toBeVisible();
    await expect(page.getByText("departmentHeadId").first()).toBeVisible();
    await expect(page.getByText("Thông báo người phụ trách").first()).toBeVisible();
    await expect(page.getByText("chế độ Shadow", { exact: false }).first()).toBeVisible();
  });

  test("workflow editor validates required fields", async ({ page }) => {
    await seedSession(page, "systemAdmin");
    await installApiMocks(page, baseMocks());
    await page.goto("/system-admin/automation/workflows");
    await page.getByRole("button", { name: "+ Tạo workflow" }).click();
    await expect(page.getByText("Tên workflow là bắt buộc.")).toBeVisible();
    await expect(page.getByTestId("save-workflow")).toBeDisabled();
    await page.getByPlaceholder("VD: Pass CV → Notify Head Review").fill("WF Test");
    await expect(page.getByTestId("save-workflow")).toBeEnabled();
  });

  test("publish shows confirmation, and Live mode shows a warning", async ({ page }) => {
    await seedSession(page, "systemAdmin");
    await installApiMocks(page, baseMocks());
    await page.goto("/system-admin/automation/workflows");
    // wf-3 is Live.
    const liveRow = page.locator("tr", { hasText: "High-fit Candidate Alert" });
    await liveRow.getByRole("button", { name: "Xuất bản" }).click();
    await expect(page.getByText("Chế độ Live sẽ gửi thông báo thật. Hãy kiểm tra kỹ trước khi xuất bản.")).toBeVisible();
  });

  test("enable/disable calls the API", async ({ page }) => {
    const calls: string[] = [];
    await seedSession(page, "systemAdmin");
    await installApiMocks(page, baseMocks(), { onRequest: (m, u) => calls.push(`${m} ${u.pathname}`) });
    await page.goto("/system-admin/automation/workflows");
    const row = page.locator("tr", { hasText: "Pass CV → Notify Head Review" });
    await row.getByRole("button", { name: "Tắt" }).click();
    await expect.poll(() => calls.some((c) => c.startsWith("PATCH") && c.endsWith("/enabled"))).toBe(true);
  });

  test("execution history filters by status and lists rows", async ({ page }) => {
    await seedSession(page, "systemAdmin");
    await installApiMocks(page, baseMocks());
    await page.goto("/system-admin/automation/executions");
    await expect(page.getByRole("heading", { name: "Lịch sử thực thi" })).toBeVisible();
    await expect(page.getByText("Pass CV → Notify Head Review").first()).toBeVisible();
    await expect(page.getByText("Thất bại").first()).toBeVisible();
  });

  test("execution detail shows step timeline and shadow would-run", async ({ page }) => {
    await seedSession(page, "systemAdmin");
    await installApiMocks(page, baseMocks());
    await page.goto(`/system-admin/automation/executions/${EXEC.id}`);
    await expect(page.getByRole("heading", { name: "Dòng thời gian các bước" })).toBeVisible();
    await expect(page.getByText("Đánh giá điều kiện").first()).toBeVisible();
    await expect(page.getByText("Chế độ Shadow", { exact: false }).first()).toBeVisible();
  });

  test("failed execution shows a working retry button", async ({ page }) => {
    const calls: string[] = [];
    await seedSession(page, "systemAdmin");
    await installApiMocks(page, baseMocks(), { onRequest: (m, u) => calls.push(`${m} ${u.pathname}`) });
    await page.goto("/system-admin/automation/executions");
    const row = page.locator("tr", { hasText: FAILED_EXEC.errorReason! });
    await row.getByRole("button", { name: "Thử lại" }).click();
    await expect(page.getByText("Chạy lại các hành động", { exact: false })).toBeVisible();
    await page.getByRole("button", { name: "Thử lại", exact: true }).last().click();
    await expect.poll(() => calls.some((c) => c.startsWith("POST") && c.endsWith("/retry"))).toBe(true);
  });

  test("non-SystemAdmin cannot access automation (redirected)", async ({ page }) => {
    await seedSession(page, "hr");
    await installApiMocks(page, baseMocks());
    await page.goto("/system-admin/automation");
    await expect(page.getByRole("heading", { name: "Tự động hóa tuyển dụng" })).toHaveCount(0);
    await expect(page).not.toHaveURL(/\/system-admin\/automation$/);
  });

  test("v4 automation screens have no placeholder text", async ({ page }) => {
    await seedSession(page, "systemAdmin");
    await installApiMocks(page, baseMocks());
    await page.goto("/system-admin/automation/workflows");
    await expect(page.getByText("coming soon", { exact: false })).toHaveCount(0);
    await expect(page.getByText("đang chờ hỗ trợ từ backend", { exact: false })).toHaveCount(0);
  });
});
