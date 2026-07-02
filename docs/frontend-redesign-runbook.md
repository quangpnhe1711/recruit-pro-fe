# Frontend Redesign Runbook — RecruitPro Internal

How to run, build, verify, and manually test the redesigned frontend, including the
**v4 AI Roadmap (Workflow Automation)** feature.

Branch: `feat/frontend-high-end-ui-i18n-seo-ai-roadmap` (target: `develop`).

## 1. Project location

- Frontend app: `recruit-pro-internal/` (this repo). React 19 + TypeScript + Vite 8 + Tailwind CSS v4.
- Backend (separate repo/folder): `RecruitProInternal/` (.NET). The frontend expects its API at the base URL configured below.

## 2. Requirements

- Node.js ≥ 20 (Vite 8 requires modern Node; 20 LTS or 22 recommended).
- npm (repo has `package-lock.json`).

## 3. Install

```bash
cd recruit-pro-internal
npm install
```

## 4. Environment variables

Create `.env.local` in `recruit-pro-internal/`:

```bash
# Base URL of the RecruitProInternal backend API
VITE_API_BASE_URL=https://localhost:7139/api
```

(Check `src/services/http/` for the exact variable name your environment uses; a
missing value falls back to the built-in default used in development.)

## 5. Commands

| Task | Command |
|---|---|
| Dev server | `npm run dev` (default http://localhost:5173) |
| Production build | `npm run build` |
| Preview build | `npm run preview` |
| Lint | `npm run lint` |
| E2E (Playwright) | `npm run e2e` (first time: `npm run e2e:install`) |

There is no separate `typecheck` script; the TS project is checked by the IDE and
by `vite build`. Note: `npm run lint` reports **pre-existing** `react-refresh/only-export-components`
and `react-hooks/set-state-in-effect` errors that also exist on `develop`; they are
not introduced by this branch.

## 6. Language switching (VI/EN)

- The switcher is the **VI / EN** segmented control in the app header (top right,
  next to the notification bell), visible on every authenticated page.
- Default language: Vietnamese (or English if the browser reports an English locale).
- The choice persists in `localStorage` under `rp.lang`.
- Implementation: `src/i18n/` — `useI18n()` hook, `translate()` for non-component code,
  dictionaries `en.ts` / `vi.ts` (structurally type-locked to each other).

Adding a string: add the key to `en.ts` **and** `vi.ts` (build fails if the shapes
diverge), then use `t("namespace.key")`.

## 7. Accessing the v4 AI Roadmap (Workflow Automation)

1. Sign in on the internal portal (`/internal/login`) with a **SystemAdmin** account.
2. Sidebar group **"Tự động hóa tuyển dụng" / "Recruitment automation"**:
   - `/system-admin/automation` — overview dashboard (worker health, stats, warnings)
   - `/system-admin/automation/workflows` — workflow list + create/edit/enable/publish
   - `/system-admin/automation/executions` — run history (filter, retry)
   - `/system-admin/automation/events` — outbox events (filter, payload)
   - `/system-admin/automation/diagnostics` — pipeline checks per workflow
   - `/system-admin/mcp/tools`, `/system-admin/mcp/audits` — internal MCP tooling
3. On mobile, the SysAdmin bottom nav goes straight to Overview / Workflows / Runs / Diagnostics.

Backend dependencies: these screens call `/api/sysadmin/automation/*` and
`/api/sysadmin/mcp/*`. The v4 tables (including `workflow_worker_heartbeats`) must
exist — apply `RecruitProInternal/db/patches/20260702-add-v4-worker-heartbeat.sql`
(or a fresh `init.sql`) if diagnostics report missing tables.

## 8. Manual test checklist — v4 AI Roadmap

- [ ] Each of the 7 automation/MCP screens opens without crash (desktop + mobile).
- [ ] Loading: navigating to a screen shows skeletons (not raw "Loading..." text).
- [ ] Empty: with no data, tables/cards show a titled empty state, not a blank page.
- [ ] API error: stop the backend and reload — every screen shows the error card
      with a working **Retry** button (dashboard included; it must never render blank).
- [ ] Workflow list renders name/status/version/trigger/mode/last-run columns; rows
      navigate to detail.
- [ ] Create workflow: validation messages appear for empty name / no actions; Save
      is disabled while saving (no double submit); after save you land on the detail page.
- [ ] Enable/disable from list AND detail both ask for confirmation; confirming a
      **Live** workflow shows the red warning; the confirm button shows a busy state.
- [ ] Publish on the detail page is disabled when there is no draft (tooltip explains).
- [ ] Run history: filters (status/event/mode/date) reset to page 1; the
      `workflowId` deep-link from a detail page shows a **clearable filter chip**.
- [ ] Retry on a failed run asks for confirmation and refreshes the row after success.
- [ ] Events: status/event-type filters work; clicking a row expands the payload;
      changing page closes the expanded panel.
- [ ] Diagnostics: **Refresh** is disabled while loading; per-workflow cards show a
      reason when a workflow has produced no executions.
- [ ] MCP tools: test-run modal guards double submit; after a test the catalog's
      "last called" timestamp updates.
- [ ] Switch VI ↔ EN on every automation screen: all labels, badges, confirms,
      toasts, and the workflow preview sentence change language; no layout overflow.
- [ ] `npm run build` passes.

## 9. Manual test checklist — layout / navigation / toasts / responsive

- [ ] Desktop (≥1024px): fixed dark sidebar, sticky blurred header, content offset correctly.
- [ ] Tablet/mobile (<1024px): sidebar becomes a left drawer (hamburger in header);
      backdrop click and Escape close it; body scroll locks while open.
- [ ] Mobile bottom nav shows per-role items; SysAdmin items point at automation screens.
- [ ] Language switcher (VI/EN) visible in the header; choice survives reload.
- [ ] Notification bell: opening marks items seen; clicking an item navigates via its
      deep link; empty/loading states are localized.
- [ ] Toasts: top-right, colored per type (success/error/warning/info), auto-dismiss;
      system/realtime cards bottom-right; neither overflows a 360px-wide viewport.
- [ ] Footer: single line, current year, no dead links.
- [ ] A forced render error (React exception) shows the branded error screen with a
      Reload button instead of a white page.
- [ ] No horizontal scrolling on any main screen at 360px / 768px / 1280px widths,
      in both VI and EN.

## 10. SEO verification (public pages)

- [ ] `/` (landing): `document.title` and meta description present; `og:*` tags set;
      canonical `→ /`.
- [ ] `/jobs`: localized title/description; canonical `→ /jobs`.
- [ ] `/jobs/:id` (public, open job): title = job title; meta description from the
      job summary; canonical; **JobPosting JSON-LD** in `<head>` with title, location,
      employmentType, datePosted, validThrough (deadline), and salary when available.
      Closed/internal views are `noindex`.
- [ ] Authenticated pages carry `<meta name="robots" content="noindex,nofollow">`.
- [ ] `public/robots.txt` disallows `/hr/`, `/manager/`, `/candidate/`, `/internal/`,
      `/system-admin/`.

**Known SPA limitation:** this is a client-rendered Vite SPA. Meta tags and JSON-LD
are injected by JavaScript, so only crawlers that execute JS (Googlebot does) see
them; the raw HTML shell only has the static tags in `index.html`. Full SEO
guarantees would require SSR/prerendering (not in scope). A sitemap was not added
because job URLs are dynamic and the frontend has no build-time access to them; if
needed, serve one from the backend.

## 11. Known limitations / backend dependencies

- Automation/MCP screens require the v4 backend endpoints and DB patches (section 7).
- `/system-admin/users|roles|permissions|audit-logs` are placeholder screens
  ("waiting for backend") — intentionally unchanged.
- i18n coverage: app shell, shared components, all v4 automation screens, landing,
  auth screens, manager analytics, and toast/empty/error primitives are fully
  localized. Deep HR/candidate operational screens (e.g. JobCreating, CandidateReview,
  AiCopilot) still contain hardcoded Vietnamese strings — they render correctly in
  VI, and extraction can proceed screen-by-screen using the same `t()` pattern.
- Landing page hero/feature images come from an external CDN (pre-existing).

## 12. Troubleshooting

| Symptom | Fix |
|---|---|
| Blank page + console error on boot | Check `VITE_API_BASE_URL`; the error boundary screen offers Reload. |
| Automation dashboard shows the error card | Backend down or v4 tables missing — run diagnostics screen / apply DB patch. |
| Diagnostics "worker stale/offline" | The .NET background dispatcher is not running or heartbeats table missing. |
| Language switch seems ignored in a screen | That screen may still have hardcoded VI strings (see section 11). |
| `npm run lint` fails | Compare against `develop` — the same pre-existing errors exist there (section 5). |
| Playwright e2e fails on `ai-copilot-v2-acceptance` | Pre-existing failures on `develop`, unrelated to this branch. |
