import path from "node:path";
import { fileURLToPath } from "node:url";
import { test, expect } from "@playwright/test";
import { installApiMocks, ok, seedSession } from "./support/session";

// UAT-CV — Candidate CV upload & parse, driven with the REAL PDF fixtures in recruit-pro/cv/.
// See docs/testing/uat-cv-upload-parse.md. The frontend is real; the backend AI parse response is
// stubbed per candidate (repo e2e convention). The real PDF is read from disk and attached to the
// actual multipart upload — the test asserts the filename reaches the parse request, then that the
// UI renders the returned data. rp.lang=vi is seeded, so copy is asserted in Vietnamese.

const CV_DIR = fileURLToPath(new URL("../../cv", import.meta.url));

// Representative parsed extraction per fixture (the backend AI owns the real values; here we assert
// the FE renders whatever the parse endpoint returns for that file).
const CV_CASES = [
  {
    file: "CV Phạm Văn Phong_TTS Dev.pdf",
    // ASCII slice of the filename — multipart bodies encode non-ASCII names as raw UTF-8 bytes that
    // page.request().postData() may not round-trip cleanly, so assert on a stable ASCII token.
    asciiToken: "_TTS Dev.pdf",
    parsed: { name: "Phạm Văn Phong", headline: "Software Developer Intern", email: "phong.pham@example.com", phone: "0900000001" },
  },
  {
    file: "Liem-Nguyen-TopCV.vn-281125.83943 (1).pdf",
    asciiToken: "Liem-Nguyen-TopCV.vn-281125.83943 (1).pdf",
    parsed: { name: "Nguyễn Văn Liêm", headline: "Backend Engineer", email: "liem.nguyen@example.com", phone: "0900000002" },
  },
  {
    file: "NGUYỄN ANH HUY.pdf",
    asciiToken: " HUY.pdf",
    parsed: { name: "Nguyễn Anh Huy", headline: "Fullstack Developer", email: "huy.nguyen@example.com", phone: "0900000003" },
  },
  {
    file: "PhungNhatQuang-5_3_26.pdf",
    asciiToken: "PhungNhatQuang-5_3_26.pdf",
    parsed: { name: "Phùng Nhật Quang", headline: "Frontend Engineer", email: "quang.phung@example.com", phone: "0900000004" },
  },
] as const;

// Minimal-but-complete candidate profile so the screen mounts cleanly (no resume yet).
function emptyProfile(): Record<string, unknown> {
  return {
    profile: {
      id: "u-cand-1",
      username: "phungnhatquang",
      name: "Phùng Nhật Quang",
      avatarUrl: null,
      headline: "",
      email: "candidate@test.local",
      phone: "",
      location: "",
      memberSince: "2026-01-01T00:00:00Z",
      bio: "",
      github: "",
      linkedin: "",
      completionScore: 20,
    },
    skills: [],
    experienceEntries: [],
    projects: [],
    educations: [],
    certifications: [],
    languages: [],
    sections: [],
    resume: null,
    resumeHistory: [],
    resumeParsing: { status: "none", warnings: [] },
  };
}

function parseResponse(parsed: (typeof CV_CASES)[number]["parsed"]): Record<string, unknown> {
  return {
    usedAi: true,
    parsingMode: "ai",
    modelName: "claude-opus-4-8",
    aiFallbackReason: null,
    profile: {
      name: parsed.name,
      headline: parsed.headline,
      email: parsed.email,
      phone: parsed.phone,
      location: "Hà Nội",
      bio: "",
      github: "",
      linkedin: "",
    },
    skills: [],
    experienceEntries: [],
    projects: [],
    educations: [],
    certifications: [],
    languages: [],
    sections: [],
    notes: [],
    extractedTextPreview: `${parsed.name} — ${parsed.headline}`,
  };
}

for (const { file, asciiToken, parsed } of CV_CASES) {
  test(`UAT-CV: upload & parse "${file}"`, async ({ page }) => {
    const parseRequests: string[] = [];

    await seedSession(page, "candidate");
    await installApiMocks(
      page,
      [
        { method: "GET", match: /\/api\/candidate\/profile$/, json: ok(emptyProfile()) },
        { method: "GET", match: /\/api\/skills$/, json: ok([]) },
        {
          method: "POST",
          match: /\/api\/candidate\/profile\/resume\/parse$/,
          json: ok(parseResponse(parsed)),
        },
      ],
      {
        onRequest: (method, url, body) => {
          if (method === "POST" && /\/api\/candidate\/profile\/resume\/parse$/.test(url.pathname)) {
            parseRequests.push(body ?? "");
          }
        },
      },
    );

    await page.goto("/candidate/profile");
    await expect(page.getByRole("heading", { name: "Hồ sơ của tôi" })).toBeVisible();

    // UAT-CV-01 — select the real PDF; expect the exact-filename toast.
    const fileInput = page.locator('input[type="file"][accept*="pdf"]');
    await fileInput.setInputFiles(path.join(CV_DIR, file));

    await expect(page.getByText(`Đã chọn file CV: ${file}`)).toBeVisible();
    await expect(page.getByText("Đã chọn CV mới")).toBeVisible();

    // UAT-CV-02 — parse; the real file must reach the request, and the preview must render it.
    await page.getByRole("button", { name: "Phân tích CV" }).click();

    await expect
      .poll(() => parseRequests.length, { message: "parse endpoint was called" })
      .toBeGreaterThan(0);
    // Multipart body carries the file part + the real filename → the actual PDF was transmitted.
    expect(parseRequests[0]).toContain('name="resume"');
    expect(parseRequests[0]).toContain(asciiToken);

    // The parsed-preview candidate name is an h3 (profile header is h2) — scope by level so a CV whose
    // name matches the signed-in candidate doesn't collide with the header.
    await expect(page.getByRole("heading", { name: parsed.name, level: 3 })).toBeVisible();
    await expect(page.getByText(parsed.email)).toBeVisible();
    await expect(page.getByText("Đã phân tích CV bằng AI", { exact: false })).toBeVisible();
  });
}
