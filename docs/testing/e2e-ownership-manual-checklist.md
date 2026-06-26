# E2E Ownership & Status Manual Checklist (Frontend)

Covers the department-head ownership workflow and the canonical English status
contract. The automated Playwright suite under `e2e/` implements these as
**E2E-OWN-001 / 002 / 003**; this checklist is the manual fallback (and the
acceptance criteria the automated tests assert).

## Running the automated E2E suite

```bash
# from recruit-pro-internal/
npm install
npm run e2e:install     # one-time: downloads the Chromium browser binary
npm run e2e             # starts the vite dev server and runs e2e/*.e2e.ts
npm run e2e:ui          # interactive UI mode
```

The tests are **deterministic and backend-free**: they seed an authenticated
session into `localStorage` (`e2e/support/session.ts`) and mock every `/api/**`
response via Playwright route interception. No live backend or database is
needed. All mocked responses are HTTP 200 (a 401 would trigger the axios
force-logout interceptor). The SignalR notification hub (`/hubs/**`) is aborted;
the resulting "Failed to fetch" console lines from the app are expected noise.

> CI note: if a runner cannot download the Chromium binary (offline/locked
> network), `npm run e2e:install` will fail. The spec files + config still ship,
> so a connected CI runner executes them unchanged.

---

## E2E-OWN-001 — Candidate "My Applications" status display

Login as a candidate (seeded: Phùng Nhật Quang) and open **My Applications**
(`/candidate/my-applications`).

- [ ] `Screening` renders as **Screening** (never "Từ chối" / "Sàng lọc").
- [ ] `Interview` renders as **Interview**.
- [ ] `ManagerReview` renders as **Head Review** (the DepartmentHeadReview stage;
      the enum key is NOT renamed).
- [ ] `Rejected` renders as **Rejected**.
- [ ] An unknown/unrecognized status renders as **Unknown** (neutral) — it must
      **never** collapse to "Rejected".
- [ ] No status badge / filter / table status column shows Vietnamese workflow
      status text. Guidance copy (`nextStep`), buttons, toasts may stay Vietnamese.

## E2E-OWN-002 — DepartmentHead approval queue + detail

Login as a department head (seeded: Trần Trọng Tiến Đạt).

- [ ] `/jobs` renders the approval queue (`Duyệt tin tuyển dụng`) with the
      DepartmentHead eyebrow "Trưởng bộ phận duyệt tin tuyển dụng".
- [ ] Queue job-status badges are English (`Pending Approval`, not "Chờ duyệt").
- [ ] Approval detail (`/manager/jobs/:id/approval`) shows the DepartmentHead
      authorization wording: "Chỉ trưởng bộ phận của phòng ban hoặc quản trị hệ
      thống mới có thể duyệt hoặc từ chối tin tuyển dụng này."
- [ ] **Approve / Reject calls `PATCH /api/hr/jobs/{id}/status`** — never the
      non-hr `/api/jobs/{id}/status` alias. Navigation happens only after the
      backend confirms (no optimistic approval).
- [ ] A non-head manager sees a friendly "no permission" message, not raw errors.

## E2E-OWN-003 — HR ownership display

Login as HR (seeded: Nguyễn Thục Uyên) and open job management (`/jobs`).

- [ ] The **Phụ trách** column shows recruiter and department-head names.
- [ ] When an owner is missing, a safe fallback renders (`Chưa phân công` for
      recruiter, `Chưa có trưởng bộ phận` for department head) — no crash, no blank.
- [ ] Job-status badges are English (`Approved`, `Pending Approval`, `Draft`,
      `Closed`, `Rejected`, `Unknown`).
- [ ] Job detail (`/jobs/:id`, internal portal) shows the "Phụ trách & phê duyệt"
      ownership panel with the same safe fallbacks.

---

## Status display contract (reference)

| ApplicationStatus (enum key) | Display label |
| --- | --- |
| Applied | Applied |
| Screening | Screening |
| ManagerReview | **Head Review** |
| Interview | Interview |
| Offer | Offer |
| Hired | Hired |
| Rejected | Rejected |
| OfferDeclined | Offer Declined |
| Withdrawn | Withdrawn |
| (unknown) | Unknown |

| JobStatus (enum key) | Display label |
| --- | --- |
| Draft | Draft |
| PendingApproval | Pending Approval |
| Approved | Approved |
| Closed | Closed |
| Rejected | Rejected |
| (unknown) | Unknown |

Source of truth: `src/common/status/statusPresentation.ts`,
`src/common/status/jobStatus.ts`, `src/common/utils/applicationPresentation.ts`.
