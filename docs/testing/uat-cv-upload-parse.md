# UAT — Candidate CV Upload & Parse

Feature under test: **Candidate profile → Resume/CV section** (`/candidate/profile`).
Flow: select a real CV file → in-app "file selected" toast → **Phân tích CV** (parse) →
parsed preview panel + success toast.

Real fixtures used (from `../cv/`, i.e. `recruit-pro/cv/`):

| # | File |
|---|------|
| 1 | `CV Phạm Văn Phong_TTS Dev.pdf` |
| 2 | `Liem-Nguyen-TopCV.vn-281125.83943 (1).pdf` |
| 3 | `NGUYỄN ANH HUY.pdf` |
| 4 | `PhungNhatQuang-5_3_26.pdf` |

## Scope note
The e2e harness runs the **real frontend** with the backend mocked (repo convention —
see `playwright.config.ts`). AI resume parsing is a backend concern, so the parse
*response* is stubbed per candidate. What is genuinely exercised with the real PDF:
the file is read from disk, attached to the real `multipart/form-data` upload, and
POSTed to `/api/candidate/profile/resume/parse` — the test asserts the actual
filename appears in the transmitted request body, then that the UI renders the
returned data. This validates the CV upload/parse UX end-to-end for each real file.

## Test cases

### UAT-CV-01 — File selection is acknowledged (per CV)
1. Given a signed-in candidate on `/candidate/profile`.
2. When they choose CV file *N* in the resume dropzone.
3. Then a success toast **"Đã chọn file CV: `<exact filename>`"** appears.
4. And the dropzone shows **"Đã chọn CV mới"** with the filename.

**Pass:** toast text matches the real filename exactly.

### UAT-CV-02 — Parse transmits the real file and renders the result (per CV)
1. Given a CV selected (UAT-CV-01).
2. When they click **"Phân tích CV"**.
3. Then a `POST /api/candidate/profile/resume/parse` is sent whose multipart body
   carries the real filename.
4. And the parsed-preview panel renders the candidate's name + email.
5. And a success toast **"Đã phân tích CV bằng AI…"** appears.

**Pass:** parse request carries the file AND preview shows parsed name/email AND success toast shown.

### UAT-CV-03 — Guard: parse with no file
1. Given no file selected.
2. The **Phân tích CV** button is not offered (only shown after selection).

**Pass:** button hidden until a file is chosen. (Covered implicitly — CV-02 depends on it.)

## How to run
```
cd recruit-pro-internal
npm run e2e -- candidate-cv-upload-parse
```
Playwright boots the dev server automatically (`webServer` in config).
