# E2E AI Copilot Ranking Checklist (Frontend)

Covers the AI Copilot candidate-ranking table UX. Automated in
`e2e/ai-copilot-ranking.e2e.ts` (deterministic, seeded HR session + `/api/**` route mocks — no live AI
backend). Screen: `src/pages/hr/AiCopilotScreen.tsx`; normalizers: `src/common/utils/aiRankingPresentation.ts`.

## API quirk (documented, normalized on the FE)

`GET /api/copilot/jobs/{id}/candidates` returns each candidate's **`education` as a raw string** — the
profile's `EducationRecordsJson` (a JSON array of objects), or a legacy plain `Education` string, or null
(see `CopilotRepository.GetCandidatePoolAsync`). The backend contract was left unchanged (low-risk); the
frontend normalizes it before display:

- **`normalizeEducation`** parses the JSON array into structured `{ school, degree, fieldOfStudy,
  startYear, endYear }` entries; a legacy plain string becomes a single text entry; **malformed JSON
  returns `[]`** (never the raw string). It never throws.
- **`normalizeSkills`** accepts `string[]`, objects with `name`, a comma string, a JSON-array string, or
  null.
- **`normalizeAiScore` / `scoreBand`** treat a missing score as **null → "Chưa chấm"** (not ranked).

## Contract rules

- AI ranking rows MUST NOT render raw JSON.
- Education / skills MUST be normalized before display; fallbacks: "Chưa có thông tin học vấn" /
  "Chưa có kỹ năng".
- AI score `null` means **Not ranked / Chưa chấm** (neutral tone, no number).
- The not-ranked reasoning placeholder ("Chạy AI review để tạo lý do phù hợp") is rendered muted/italic so
  it never looks like a final AI result.
- Malformed optional profile fields MUST NOT crash the UI.

## Checklist

- [ ] **E2E-AI-001** Ranking table never shows raw JSON education (`[{"school"…`, `"degree":`).
- [ ] **E2E-AI-002** Education renders school (primary) + degree/field/years (secondary).
- [ ] **E2E-AI-003** Skills render as chips; the first 6 show, the rest collapse into "+N".
- [ ] **E2E-AI-004** A not-ranked candidate shows neutral "Chưa chấm" and the run-review CTA.
- [ ] **E2E-AI-005** Sending a ranking prompt calls `POST …/conversations/{id}/rankings` and updates the
      row (score badge + bar, status "Đã chấm"); the send button shows a spinner while reviewing.
- [ ] **E2E-AI-006** Malformed education JSON does not crash the UI — it falls back to "Chưa có thông tin
      học vấn".

## Manual UX notes

- Score badge tone: high ≥80 (green), medium ≥60 (blue), low <60 (amber), unknown/neutral when null —
  always paired with a label/number, never color-only.
- "Xem chi tiết" expands one candidate's AI reasoning (summary + strengths/weaknesses) inline without
  pushing every other row's height.
- Loading shows a spinner; the empty pool shows a helpful empty state.
- Notification dispatch is **Phase 6 (not implemented)** — this screen is AI-assist only.
