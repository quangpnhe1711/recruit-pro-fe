import { ReactNode } from "react";
import Badge, { type BadgeTone } from "../../common/components/Badge";
import { getDateLocale, translate } from "../../i18n";
import type { WorkflowMode } from "../../modules/system-admin/automationSchema";

/** Enum code → i18n key. Unknown codes render as the raw code, never a key path. */
const EVENT_KEYS: Record<string, string> = {
  CandidateApplied: "automation.eventTypes.CandidateApplied",
  PassedToHeadReview: "automation.eventTypes.PassedToHeadReview",
  InterviewCompleted: "automation.eventTypes.InterviewCompleted",
  JobApproved: "automation.eventTypes.JobApproved",
  CandidateScoreReady: "automation.eventTypes.CandidateScoreReady",
  HeadReviewOverdue: "automation.eventTypes.HeadReviewOverdue",
};

const ACTION_KEYS: Record<string, string> = {
  notify_user: "automation.actionTypes.notify_user",
  notify_role: "automation.actionTypes.notify_role",
  send_reminder: "automation.actionTypes.send_reminder",
  rule_based_next_step_suggestion:
    "automation.actionTypes.rule_based_next_step_suggestion",
  shadow_log: "automation.actionTypes.shadow_log",
};

const OPERATOR_KEYS: Record<string, string> = {
  equals: "automation.operators.equals",
  not_equals: "automation.operators.not_equals",
  greater_than: "automation.operators.greater_than",
  greater_than_or_equal: "automation.operators.greater_than_or_equal",
  exists: "automation.operators.exists",
  in_list: "automation.operators.in_list",
  older_than_days: "automation.operators.older_than_days",
};

const RECIPIENT_KEYS: Record<string, string> = {
  assignedRecruiter: "automation.recipients.assignedRecruiter",
  assignedDepartmentHead: "automation.recipients.assignedDepartmentHead",
  candidate: "automation.recipients.candidate",
};

export function eventLabel(code?: string | null) {
  if (!code) return "-";
  const key = EVENT_KEYS[code];
  return key ? translate(key) : code;
}

export function actionLabel(type: string) {
  const key = ACTION_KEYS[type];
  return key ? translate(key) : type;
}

export function operatorLabel(op: string) {
  const key = OPERATOR_KEYS[op];
  return key ? translate(key) : op;
}

export function recipientLabel(recipient: string) {
  const key = RECIPIENT_KEYS[recipient];
  return key ? translate(key) : recipient;
}

export function modeBadge(mode: WorkflowMode) {
  const map: Record<WorkflowMode, { tone: BadgeTone; label: string; icon: string }> = {
    Shadow: { tone: "info", label: "Shadow", icon: "visibility" },
    Live: { tone: "danger", label: "Live", icon: "bolt" },
    Disabled: {
      tone: "neutral",
      label: translate("automation.disabled"),
      icon: "block",
    },
  };
  const m = map[mode] ?? map.Disabled;
  return (
    <Badge tone={m.tone} icon={m.icon}>
      {m.label}
    </Badge>
  );
}

export function enabledBadge(isEnabled: boolean) {
  return isEnabled ? (
    <Badge tone="success" dot>
      {translate("automation.enabled")}
    </Badge>
  ) : (
    <Badge tone="neutral" dot>
      {translate("automation.disabled")}
    </Badge>
  );
}

const STATUS_BADGES: Record<string, { tone: BadgeTone; key: string }> = {
  Success: { tone: "success", key: "automation.statusSucceeded" },
  Skipped: { tone: "neutral", key: "automation.statusSkipped" },
  Failed: { tone: "danger", key: "automation.statusFailed" },
  Retrying: { tone: "warning", key: "automation.statusRetrying" },
  DeadLetter: { tone: "danger", key: "automation.statusDead" },
  Running: { tone: "info", key: "automation.statusRunning" },
  Pending: { tone: "neutral", key: "automation.statusPending" },
  Processed: { tone: "success", key: "automation.statusProcessed" },
  Processing: { tone: "info", key: "automation.statusProcessing" },
};

export function statusBadge(status?: string | null) {
  if (!status) return <span className="text-[#a8a4a2]">-</span>;
  const s = STATUS_BADGES[status];
  return (
    <Badge tone={s?.tone ?? "neutral"}>{s ? translate(s.key) : status}</Badge>
  );
}

export function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(getDateLocale());
}

export function shortId(id: string) {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

/** Raw JSON tucked inside a collapsible so it is never the only UI content. */
export function JsonDetails({ label, json }: { label: string; json?: string | null }) {
  if (!json) return null;
  let pretty = json;
  try {
    pretty = JSON.stringify(JSON.parse(json), null, 2);
  } catch {
    /* leave as-is */
  }
  return (
    <details className="mt-2 rounded-[10px] border border-[#eee9e7] bg-[#fbfaf9] px-3 py-2 text-[13px]">
      <summary className="cursor-pointer select-none font-medium text-[#5f5e5e]">{label}</summary>
      <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words text-[12px] text-[#3a3a3a]">
        {pretty}
      </pre>
    </details>
  );
}

/** Hand-rolled confirmation modal (shared design-system overlay pattern). */
export function ConfirmModal({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel,
  danger = false,
  busy = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="animate-fade-in fixed inset-0 z-[100] flex items-center justify-center bg-[#1a1c1c]/45 p-4 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-scale-in w-full max-w-md rounded-2xl border border-[#ececec] bg-white p-6 shadow-[0_32px_80px_-16px_rgba(26,28,28,0.3)]"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="text-[18px] font-semibold text-[#1a1c1c]">{title}</h3>
          <button
            className="premium-action text-[#8a8786]"
            onClick={onClose}
            aria-label={translate("common.close")}
            type="button"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="text-[14px] leading-6 text-[#3a3a3a]">{children}</div>
        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
            {cancelLabel ?? translate("common.cancel")}
          </button>
          <button
            type="button"
            className={`btn ${danger ? "btn-dark" : "btn-primary"}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy
              ? translate("common.processing")
              : (confirmLabel ?? translate("common.confirm"))}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Standard error panel for a failed data load. */
export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="material-symbols-outlined text-[36px] text-[#b90014]">error</span>
      <p className="text-[14px] text-[#3a3a3a]">
        {message || translate("common.loadFailed")}
      </p>
      {onRetry ? (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          {translate("states.tryAgain")}
        </button>
      ) : null}
    </div>
  );
}
