import { test, expect } from "@playwright/test";
import { installApiMocks, ok, seedSession } from "./support/session";

// E2E-DIAG-001..002 — the Diagnostics screen explains automation health and, when a workflow has
// no execution, states the human reason (no raw JSON). Deterministic: mocked /api/**.

const GLOBAL = ok({
  automationEnabled: true,
  defaultMode: "Shadow",
  workers: [
    { name: "dispatcher", lastBeatAt: "2026-07-01T08:00:00Z", secondsSinceBeat: 4, isStale: false, status: "Running" },
  ],
  dispatcherHealthy: true,
  pendingEvents: 1,
  processingEvents: 0,
  failedEvents: 0,
  deadLetterEvents: 0,
  executionsToday: 3,
  failedExecutions: 0,
  unresolvedDeadLetters: 0,
  latestEvent: { eventType: "PassedToHeadReview", status: "Processed", occurredAt: "2026-07-01T08:00:00Z" },
  latestExecution: { workflowName: "Pass CV → Báo Head Review", status: "Success", createdAt: "2026-07-01T08:00:05Z" },
  warnings: ["Có 1 sự kiện đang chờ xử lý."],
});

const WORKFLOWS = ok([
  { id: "wf-1", name: "Pass CV → Báo Head Review", isEnabled: true, mode: "Shadow", triggerEventType: "PassedToHeadReview" },
  { id: "wf-2", name: "High-fit Candidate Alert", isEnabled: true, mode: "Shadow", triggerEventType: "CandidateApplied" },
]);

function wfDiag(over: Record<string, unknown>) {
  return ok({
    id: "wf-x",
    name: "WF",
    isEnabled: true,
    hasActiveVersion: true,
    versionMode: "Shadow",
    effectiveMode: "Shadow",
    triggerEventType: "PassedToHeadReview",
    eventsTodayOfType: 1,
    pendingEventsOfType: 0,
    executionsToday: 1,
    successCount: 1,
    failedCount: 0,
    skippedCount: 0,
    latestMatchingEvent: null,
    latestExecution: null,
    noExecutionReason: null,
    healthy: true,
    ...over,
  });
}

test.describe("SystemAdmin Diagnostics", () => {
  test("E2E-DIAG-001: shows automation + worker health and warnings", async ({ page }) => {
    await seedSession(page, "systemAdmin");
    await installApiMocks(page, [
      { method: "GET", match: /\/api\/sysadmin\/automation\/diagnostics$/, json: GLOBAL },
      { method: "GET", match: /\/api\/sysadmin\/automation\/workflows$/, json: WORKFLOWS },
      { method: "GET", match: /\/api\/sysadmin\/automation\/workflows\/wf-1\/diagnostics$/, json: wfDiag({ id: "wf-1", name: "Pass CV → Báo Head Review" }) },
      { method: "GET", match: /\/api\/sysadmin\/automation\/workflows\/wf-2\/diagnostics$/, json: wfDiag({ id: "wf-2", name: "High-fit Candidate Alert" }) },
    ]);

    await page.goto("/system-admin/automation/diagnostics");

    await expect(page.getByRole("heading", { name: "Chẩn đoán", exact: true })).toBeVisible();
    await expect(page.getByText("Tự động hóa workflow")).toBeVisible();
    await expect(page.getByText("Trạng thái worker").first()).toBeVisible();
    await expect(page.getByText("Có 1 sự kiện đang chờ xử lý.")).toBeVisible();
  });

  test("E2E-DIAG-002: a workflow with no active version explains why no execution appears", async ({ page }) => {
    await seedSession(page, "systemAdmin");
    await installApiMocks(page, [
      { method: "GET", match: /\/api\/sysadmin\/automation\/diagnostics$/, json: GLOBAL },
      { method: "GET", match: /\/api\/sysadmin\/automation\/workflows$/, json: ok([{ id: "wf-1", name: "Pass CV → Báo Head Review", isEnabled: true, mode: "Shadow", triggerEventType: "PassedToHeadReview" }]) },
      {
        method: "GET",
        match: /\/api\/sysadmin\/automation\/workflows\/wf-1\/diagnostics$/,
        json: wfDiag({
          id: "wf-1",
          name: "Pass CV → Báo Head Review",
          hasActiveVersion: false,
          healthy: false,
          noExecutionReason: "Workflow chưa có phiên bản active (chưa xuất bản).",
        }),
      },
    ]);

    await page.goto("/system-admin/automation/diagnostics");

    await expect(
      page.getByText("Workflow chưa có phiên bản active (chưa xuất bản)."),
    ).toBeVisible();
  });
});
