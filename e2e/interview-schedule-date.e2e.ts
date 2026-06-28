import { test, expect } from "@playwright/test";
import { installApiMocks, ok, seedSession } from "./support/session";

// E2E-INTERVIEW-001 — scheduling an interview for a chosen calendar day preserves that day end to end.
// The screen sends a local `YYYY-MM-DD` date string (built from local date components, never
// `toISOString()`), and the backend stores it as Unspecified-kind DateTime, so day 28 stays day 28
// (the off-by-one this guards against turned 28 → 27 via UTC midnight conversion).

const SCHEDULE_DATA = ok({
  candidate: {
    id: "c-1",
    applicationId: "app-1",
    jobId: "job-1",
    name: "Nguyễn Văn A",
    roleLabel: "Backend Engineer",
    appliedFor: "Backend Engineer",
    avatarUrl: null,
  },
  interviewers: [
    { id: "iv-1", name: "Người Phỏng Vấn", title: "HR", avatarUrl: "", busySlotsByDate: {} },
  ],
  slotMinutes: [540, 600, 660],
});

test("E2E-INTERVIEW-001 scheduling day 28 sends date with day 28 (no UTC off-by-one)", async ({
  page,
}) => {
  let createdDate: string | null = null;

  await seedSession(page, "hr");
  await installApiMocks(
    page,
    [
      { method: "GET", match: /\/api\/hr\/interviews\/schedule-data$/, json: SCHEDULE_DATA },
      { method: "POST", match: /\/api\/hr\/interviews$/, json: ok({ interviewId: "int-1" }) },
    ],
    {
      onRequest: (method, url, body) => {
        if (method === "POST" && /\/api\/hr\/interviews$/.test(url.pathname) && body) {
          try {
            createdDate = (JSON.parse(body) as { date?: string }).date ?? null;
          } catch {
            createdDate = null;
          }
        }
      },
    },
  );

  await page.goto("/hr/interviews/schedule?applicationId=app-1");

  // Pick calendar day 28 (the day button's accessible name is "Chọn 28 thg 6, 2026").
  await page.getByRole("button", { name: /Chọn 28 / }).click();

  await page.getByPlaceholder("Dán link cuộc họp").fill("https://meet.example/interview");

  const confirm = page.getByRole("button", { name: /Xác nhận lịch phỏng vấn/ });
  await expect(confirm).toBeEnabled();
  await confirm.click();

  await expect.poll(() => createdDate).not.toBeNull();
  // The submitted date keeps day 28 — it is NOT shifted to 27 by a timezone conversion.
  expect(createdDate).toMatch(/-28$/);
  expect(createdDate!.split("-")[2]).toBe("28");
});
