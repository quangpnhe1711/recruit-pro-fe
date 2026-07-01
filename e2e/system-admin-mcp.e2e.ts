import { test, expect } from "@playwright/test";
import { installApiMocks, ok, seedSession } from "./support/session";

const TOOLS = [
  { name: "jobs.search", description: "Tìm kiếm danh sách job đang mở (chỉ đọc).", permissionsRequired: ["mcp.tools.view", "jobs.view"], access: "read", enabled: true, lastCalledAt: "2026-07-01T08:00:00Z" },
  { name: "jobs.get", description: "Lấy chi tiết một job theo id.", permissionsRequired: ["mcp.tools.view", "jobs.view"], access: "read", enabled: true, lastCalledAt: null },
  { name: "applications.get", description: "Lấy chi tiết hồ sơ ứng tuyển.", permissionsRequired: ["mcp.tools.view", "applications.view"], access: "read", enabled: true, lastCalledAt: null },
  { name: "applications.get_fit_analysis", description: "Tóm tắt mức độ phù hợp.", permissionsRequired: ["mcp.tools.view"], access: "read", enabled: true, lastCalledAt: null },
  { name: "interviews.get_schedule", description: "Lấy dữ liệu lịch phỏng vấn.", permissionsRequired: ["mcp.tools.view"], access: "read", enabled: true, lastCalledAt: null },
  { name: "analytics.get_funnel_summary", description: "Tóm tắt phễu tuyển dụng.", permissionsRequired: ["mcp.tools.view"], access: "read", enabled: true, lastCalledAt: null },
];

const AUDITS = {
  items: [
    { id: "aud-1", toolName: "jobs.search", callerUserId: "u-admin-1", allowed: true, deniedReason: null, latencyMs: 12, createdAt: "2026-07-01T08:00:00Z", inputJson: "{}", outputSummaryJson: '{"success":true,"statusCode":200}' },
    { id: "aud-2", toolName: "applications.get", callerUserId: "u-hr-1", allowed: false, deniedReason: "Caller lacks SystemAdmin", latencyMs: 3, createdAt: "2026-07-01T08:05:00Z", inputJson: '{"applicationId":"a1"}', outputSummaryJson: null },
  ],
  currentPage: 1,
  pageSize: 20,
  totalItems: 2,
  totalPages: 1,
};

function mcpMocks() {
  return [
    { method: "GET", match: /\/mcp\/tools$/, json: ok(TOOLS) },
    { method: "POST", match: /\/mcp\/tools\/[^/]+\/test$/, json: ok({ allowed: true, deniedReason: null, output: { success: true, statusCode: 200, message: "OK" } }) },
    { method: "GET", match: /\/mcp\/audits$/, json: ok(AUDITS) },
  ];
}

test.describe("SystemAdmin v4 MCP", () => {
  test("MCP tools catalog loads", async ({ page }) => {
    await seedSession(page, "systemAdmin");
    await installApiMocks(page, mcpMocks());
    await page.goto("/system-admin/mcp/tools");
    await expect(page.getByRole("heading", { name: "MCP Tools" })).toBeVisible();
    // Advanced/internal positioning copy is present.
    await expect(page.getByText("Đây là màn hình nâng cao / nội bộ")).toBeVisible();
    await expect(page.getByText("jobs.search").first()).toBeVisible();
    await expect(page.getByText("analytics.get_funnel_summary").first()).toBeVisible();
  });

  test("MCP tool test shows allowed result", async ({ page }) => {
    await seedSession(page, "systemAdmin");
    await installApiMocks(page, mcpMocks());
    await page.goto("/system-admin/mcp/tools");
    const card = page.locator("div", { hasText: "jobs.search" }).first();
    await card.getByRole("button", { name: "Chạy thử" }).first().click();
    await page.getByRole("button", { name: "Gọi công cụ" }).click();
    await expect(page.getByText("Được phép").first()).toBeVisible();
  });

  test("MCP audit log loads with allowed/denied rows", async ({ page }) => {
    await seedSession(page, "systemAdmin");
    await installApiMocks(page, mcpMocks());
    await page.goto("/system-admin/mcp/audits");
    await expect(page.getByRole("heading", { name: "Nhật ký audit MCP" })).toBeVisible();
    await expect(page.getByText("jobs.search").first()).toBeVisible();
    await expect(page.getByText("Bị từ chối").first()).toBeVisible();
    await expect(page.getByText("Caller lacks SystemAdmin").first()).toBeVisible();
  });

  test("non-SystemAdmin cannot access MCP tools (redirected)", async ({ page }) => {
    await seedSession(page, "hr");
    await installApiMocks(page, mcpMocks());
    await page.goto("/system-admin/mcp/tools");
    await expect(page.getByRole("heading", { name: "Danh mục công cụ MCP" })).toHaveCount(0);
  });
});
