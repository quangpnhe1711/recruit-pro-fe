import { ReactNode } from "react";
import Badge, { type BadgeTone } from "../../common/components/Badge";
import type { WorkflowMode } from "../../modules/system-admin/automationSchema";

export const EVENT_LABELS: Record<string, string> = {
  CandidateApplied: "Ứng viên nộp hồ sơ",
  PassedToHeadReview: "Chuyển Trưởng bộ phận duyệt",
  InterviewCompleted: "Hoàn tất phỏng vấn",
  JobApproved: "Job được duyệt",
  CandidateScoreReady: "Có điểm ứng viên",
  HeadReviewOverdue: "Quá hạn duyệt",
};

export const ACTION_LABELS: Record<string, string> = {
  notify_user: "Thông báo người phụ trách",
  notify_role: "Thông báo theo vai trò",
  send_reminder: "Gửi nhắc việc",
  rule_based_next_step_suggestion: "Gợi ý bước tiếp theo",
  shadow_log: "Ghi log shadow",
};

export const OPERATOR_LABELS: Record<string, string> = {
  equals: "bằng",
  not_equals: "khác",
  greater_than: "lớn hơn",
  greater_than_or_equal: "lớn hơn hoặc bằng",
  exists: "tồn tại",
  in_list: "thuộc danh sách",
  older_than_days: "cũ hơn (ngày)",
};

export const RECIPIENT_LABELS: Record<string, string> = {
  assignedRecruiter: "HR phụ trách",
  assignedDepartmentHead: "Trưởng bộ phận",
  candidate: "Ứng viên",
};

export function eventLabel(code?: string | null) {
  return code ? (EVENT_LABELS[code] ?? code) : "—";
}

export function actionLabel(type: string) {
  return ACTION_LABELS[type] ?? type;
}

export function modeBadge(mode: WorkflowMode) {
  const map: Record<WorkflowMode, { tone: BadgeTone; label: string; icon: string }> = {
    Shadow: { tone: "info", label: "Shadow", icon: "visibility" },
    Live: { tone: "danger", label: "Live", icon: "bolt" },
    Disabled: { tone: "neutral", label: "Đã tắt", icon: "block" },
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
      Đã bật
    </Badge>
  ) : (
    <Badge tone="neutral" dot>
      Đã tắt
    </Badge>
  );
}

export function statusBadge(status?: string | null) {
  if (!status) return <span className="text-[#a8a4a2]">—</span>;
  const map: Record<string, { tone: BadgeTone; label: string }> = {
    Success: { tone: "success", label: "Thành công" },
    Skipped: { tone: "neutral", label: "Bỏ qua" },
    Failed: { tone: "danger", label: "Thất bại" },
    Retrying: { tone: "warning", label: "Đang thử lại" },
    DeadLetter: { tone: "danger", label: "Dead-letter" },
    Running: { tone: "info", label: "Đang chạy" },
    Pending: { tone: "neutral", label: "Chờ xử lý" },
    Processed: { tone: "success", label: "Đã xử lý" },
    Processing: { tone: "info", label: "Đang xử lý" },
  };
  const s = map[status] ?? { tone: "neutral" as BadgeTone, label: status };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("vi-VN");
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
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
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
      <div className="animate-scale-in w-full max-w-md rounded-2xl border border-[#ececec] bg-white p-6 shadow-[0_32px_80px_-16px_rgba(26,28,28,0.3)]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="text-[18px] font-semibold text-[#1a1c1c]">{title}</h3>
          <button className="premium-action text-[#8a8786]" onClick={onClose} aria-label="Đóng" type="button">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="text-[14px] leading-6 text-[#3a3a3a]">{children}</div>
        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${danger ? "btn-dark" : "btn-primary"}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Đang xử lý..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Standard error panel for a failed data load. */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="material-symbols-outlined text-[36px] text-[#b90014]">error</span>
      <p className="text-[14px] text-[#3a3a3a]">{message}</p>
      {onRetry ? (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          Thử lại
        </button>
      ) : null}
    </div>
  );
}
