# Phase 4 — Ownership & Job-Approval Frontend Contract

**Scope:** frontend (`recruit-pro-internal`) only. No backend logic changed. This documents how the FE
consumes the Phase 2/3 backend ownership model (department heads, recruiters, the job-approval guard)
and the status-change / error contract it relies on.

Backend sources of truth: `RecruitProInternal/docs/source-of-truth/JOB-APPROVAL-FLOW.md`,
`ERROR-CONTRACT.md`, `RECRUITMENT-OWNERSHIP-MATRIX.md`.

---

## 1. Job status-change endpoint

The frontend changes a job's approval status (approve / reject / return-to-draft / close / reopen)
**only** through the guarded HR endpoint:

```
PATCH /api/hr/jobs/{id}/status        // endpoints.hrJobs.status(jobId) → jobsService.updateJobStatus
```

- `PATCH /api/jobs/{id}/status` is **not** the preferred FE path. It is a hardened *authenticated alias*
  that routes through the same `PatchJobAsync` guard. The FE `endpoints` map does not expose it and no
  production code calls it.
- Request body: `{ "status": "<value>" }`. The backend `ParseJobStatus` lowercases the input
  (`ToLowerInvariant`), so the ALL_CAPS values the FE sends (`APPROVED`, `REJECTED`, `DRAFT`, `CLOSED`)
  match. ⚠️ Underscore forms (`PENDING_APPROVAL`) do **not** parse — the FE never sends them to this
  endpoint. Canonical labels for display always go through `common/status/jobStatus.ts`
  (`getJobStatusPresentation`), never raw Vietnamese strings (INV-012).
- Response: `{ jobId, approvalStatus }`. The UI refreshes from the server after a confirmed response —
  it never optimistically marks a job approved before the backend confirms.

## 2. Authorization model (backend is the source of truth)

| Actor | Can approve/reject? | Notes |
|---|---|---|
| Job's **DepartmentHead** (`Department.HeadUserId`) | ✅ view queue/detail + approve | Queue/detail scoped to their department; `JobService.PatchJobAsync` guard for submit (BR-OWN-003). |
| **SystemAdmin** | ✅ all departments | Sees the full queue; role-based bypass of the head check on submit. |
| **Manager** not the dept head | ❌ empty queue, 403 detail/submit | Kept on the endpoints for compatibility but server-scoped — no cross-department approval. |
| **HR** / any non-head | ❌ → 403 `FORBIDDEN` | HR has no `JOB_APPROVE`, so it never reaches the approval screen; the 403 handler is a safety net. |
| Department with **no head** | ❌ → 422 `DEPARTMENT_HEAD_REQUIRED` | Must assign a head first (applies to detail view and submit). |

FE behavior:
- The job-approval screens are gated by the `JOB_APPROVE` permission, now held by **HeadDepartment**,
  **Manager**, and **SystemAdmin**. A `HeadDepartment` user lands on the approval queue from `/jobs`
  (`JobsRouteScreen`) and has a dedicated "Duyệt tin tuyển dụng" nav entry. The approve/reject buttons
  are additionally gated on `JOB_APPROVE` in `ManagerJobApprovalDetailScreen` and hidden otherwise.
- **Backend remains the gate.** The approval **queue/detail** endpoints (`/api/manager/...`) now admit
  `Manager,HeadDepartment,SystemAdmin` **and are scoped server-side**: a DepartmentHead (or legacy
  Manager) only sees/opens jobs of the department(s) they head (`Department.HeadUserId`), a SystemAdmin
  sees all. A Manager who is not the department head sees an **empty queue** and a **403** on detail —
  generic Manager role no longer grants cross-department approval. The approve/reject **submit**
  (`/api/hr/jobs/{id}/status`) keeps the same head/SystemAdmin guard.
- The approval **detail load** surfaces structured 403/422 (e.g. a head opening another department's
  job → 403; a department with no head → 422) via `getJobStatusErrorMessage`, not a generic toast.
- An informational note on the approval screen states that only the department head or a SystemAdmin can
  approve/reject.

## 3. Error handling

`src/common/utils/apiError.ts` now carries the ownership/approval error codes and a dedicated resolver:

- `ERROR_CODES`: added `DEPARTMENT_HEAD_REQUIRED`, `INVALID_DEPARTMENT_HEAD`, `JOB_RECRUITER_REQUIRED`,
  `INVALID_JOB_RECRUITER`, `INVALID_JOB_TRANSITION`, `DEPARTMENT_NOT_FOUND` (mirrors
  `RecruitPro.Application.Common.ErrorCodes`).
- `getJobStatusErrorMessage(error, fallback)` — precedence **errorCode → HTTP status → backend message →
  fallback**. Maps the workflow codes plus status-only cases the backend does not code-tag:

  | Condition | Surfaced message |
  |---|---|
  | 403 / `FORBIDDEN` | "Bạn không có quyền duyệt hoặc từ chối tin tuyển dụng này." |
  | 422 / `DEPARTMENT_HEAD_REQUIRED` | "Phòng ban này chưa có trưởng bộ phận nên chưa thể duyệt tin tuyển dụng." |
  | 401 / `UNAUTHENTICATED` | "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." |
  | 404 | "Không tìm thấy tin tuyển dụng này." |

  Raw backend exception text is never shown when a structured code or known status is present.

Consumers: `ManagerJobApprovalDetailScreen` (approve/reject — toast **and** inline banner) and
`JobDetailScreen` close/reopen (reopen → Approved hits the same head guard).

## 4. Ownership fields (displayed, always optional / null-safe)

Consumed where the backend DTOs expose them; never required — screens render fallbacks when null.

| Surface | Fields used | Fallback copy |
|---|---|---|
| `GET /api/departments` (`DepartmentDto`) | `headUserId/headUserName/headUserEmail` | — (type only; dropdown unchanged) |
| `GET /api/hr/jobs` list (`JobManagementScreen`) | `recruiterName`, `departmentHeadName`, `effectiveDepartmentHeadName` | "Chưa phân công" / "Chưa có trưởng bộ phận" |
| `GET /api/hr/jobs/{id}` detail (`JobDetailScreen` ownership panel) | `recruiter*`, `departmentHead*`, `effectiveDepartmentHead*`, `createdByName`, `approvedByName` | "Chưa phân công" / "Chưa có trưởng bộ phận" / "Chưa duyệt" |
| `GET /api/hr/applications/{id}` (`CandidateReviewDetailScreen`) | `assignedRecruiterName`, `assignedDepartmentHeadName` | "Chưa phân công" / "Chưa có trưởng bộ phận" |

`createdBy` / `approvedBy` are treated as **audit** fields (per BR-OWN-002/003) — the recruiter and
(effective) department head are the displayed business owners.

## 5. Department lookup

Unchanged endpoint: `GET /api/departments` (`endpoints.departments`, `jobsService.listDepartments`). The
FE does **not** use any `/api/lookup(s)` path. `DepartmentDto` now carries the optional head fields as a
superset; existing dropdown behaviour (label = department name) is preserved.

## 6. DepartmentHead approval-queue access (Phase 4 follow-up — done)

The earlier limitation ("HeadDepartment cannot reach the approval queue/detail because those endpoints
were `Manager`-role only") is **fixed**:

- Backend: queue/detail now `[Authorize(Roles = "Manager,HeadDepartment,SystemAdmin")]`, **scoped** to
  `Department.HeadUserId` (SystemAdmin = all). A non-head Manager gets an empty queue / 403 detail.
- Frontend: `JOB_APPROVE` now includes **HeadDepartment**; `JobsRouteScreen` routes HeadDepartment to the
  approval queue and the side-nav exposes it.
- Screen/route names kept (`ManagerJobApprovalListScreen`, `ManagerJobApprovalDetailScreen`,
  `/manager/...`) for compatibility; only the visible copy now reads "Trưởng bộ phận duyệt tin tuyển dụng".

## 7. Canonical English status display (implemented)

Status **badges, filters, and table status columns** render canonical **English**
display labels everywhere. Vietnamese is reserved for `nextStep`/guidance, buttons,
helper copy, empty states, errors, toasts, and page titles/subtitles. An unknown
status renders as a neutral **"Unknown"** — it never collapses to "Rejected"
(the INV-012 regression guard).

- Application statuses: `src/common/status/statusPresentation.ts` and
  `src/common/utils/applicationPresentation.ts` (kept in sync) →
  Applied, Screening, **Head Review** (= `ManagerReview`), Interview, Offer, Hired,
  Rejected, Offer Declined, Withdrawn, Unknown.
- Job statuses: `src/common/status/jobStatus.ts` (and the `jobStatusLabels` map in
  `modules/jobs/jobsSchema.ts`) → Draft, Pending Approval, Approved, Closed,
  Rejected, Unknown.
- The earlier Vietnamese labels in `applicationPresentation.ts` (e.g. "Từ chối",
  "QL xét duyệt") and `jobStatus.ts` (e.g. "Chờ duyệt", "Đang tuyển") — which still
  drove HR/candidate/manager badges and the analytics funnel — were converted to
  English; the candidate review-state chips were likewise englishized.

## 8. E2E verification (Playwright)

Deterministic, backend-free Playwright tests under `e2e/` cover the ownership +
status contract: **E2E-OWN-001** (candidate My Applications status display),
**E2E-OWN-002** (DepartmentHead approval queue/detail + approve via
`PATCH /api/hr/jobs/{id}/status`), **E2E-OWN-003** (HR ownership display + safe
fallbacks). They seed an authenticated session into `localStorage` and mock every
`/api/**` response via route interception (all HTTP 200). Run with `npm run e2e`
(one-time `npm run e2e:install` for the Chromium binary). See
`docs/testing/e2e-ownership-manual-checklist.md`.

## 9. Things deliberately NOT done

- No notification feature (that remains **Phase 6 / not implemented**). No role/enum/status rename
  (`ManagerReview` = the DepartmentHeadReview business stage, `HeadDepartment`, `Manager` all kept). No
  invented `Job.HiringManagerId`. HeadDepartment was **not** granted HR job-management permissions — only
  the approval surfaces.

## 10. Workflow correctness — Interview → Offer/Reject (BR-WF-001…005)

A later pass tightened the Head-Review → Interview → Offer/Reject workflow on the FE:

- **Manager/DepartmentHead review queue date.** `ManagerCandidateReviewListScreen` shows the
  **"Nhận review"** date from `departmentHeadReviewRequestedAt` (the date HR sent the application to Head
  Review), with the applied date kept as secondary metadata. Falls back to `appliedAt` for legacy rows.
  Type: `ManagerReviewQueueItemDto.departmentHeadReviewRequestedAt` / `ApplicationReviewDetailDto.departmentHeadReviewRequestedAt`.
- **Interview scheduling required + completion gate.** `CandidateReviewDetailScreen`: in the `Interview`
  stage with no interview it shows a "Cần lên lịch phỏng vấn" prompt; Offer and Reject are disabled with a
  visible reason until the interview is **marked completed** (HR action "Đánh dấu đã phỏng vấn" → `PATCH
  /hr/interviews/{id}/status` = `completed`).
- **Email-gated Offer/Reject.** Direct status-decision buttons for `Offer`/`Rejected` were removed.
  "Gửi email offer" routes to `SendOfferScreen` (`POST …/offer/send`); "Gửi email từ chối" opens a
  subject/body modal that calls `hrService.sendRejectionEmail` (`POST …/rejection-email`). The status
  changes only after the backend reports the email was sent. New error codes mirrored in
  `src/common/utils/apiError.ts`: `INTERVIEW_REQUIRED`, `INTERVIEW_NOT_COMPLETED`, `EMAIL_REQUIRED_FOR_OFFER`,
  `EMAIL_REQUIRED_FOR_REJECTION`, `EMAIL_SEND_FAILED`.
- **Schedule-interview button fix.** `InterviewScheduleScreen`'s confirm button required the Manager-only
  `INTERVIEW_APPROVE` permission and was permanently disabled for HR. It is now gated by `INTERVIEW_CREATE`
  only and renders a single visible disabled reason (permission / no slot / interviewer busy / missing link).

Covered by Playwright `E2E-WF-001…007` (`e2e/workflow-interview-offer-reject.e2e.ts`).
