import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../../common/components/PageHeader";
import { SkeletonText } from "../../common/components/Skeleton";
import { getExecution, retryExecution } from "../../services/system-admin/automationService";
import type { ExecutionDetailDto } from "../../modules/system-admin/automationSchema";
import {
  actionLabel,
  ConfirmModal,
  ErrorState,
  eventLabel,
  formatDateTime,
  JsonDetails,
  modeBadge,
  statusBadge,
} from "./automationUi";

function ExecutionDetailScreen() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [exec, setExec] = useState<ExecutionDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmRetry, setConfirmRetry] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getExecution(id)
      .then(setExec)
      .catch(() => setError("Không tải được chi tiết thực thi."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => load(), [load]);

  const doRetry = async () => {
    setBusy(true);
    try {
      const updated = await retryExecution(id);
      setExec(updated);
      toast.success("Đã thử lại.");
      setConfirmRetry(false);
    } catch {
      toast.error("Không thể thử lại.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container py-8">
        <SkeletonText lines={6} />
      </div>
    );
  }
  if (error || !exec) {
    return (
      <div className="app-container py-8">
        <ErrorState message={error ?? "Không tìm thấy lần thực thi."} onRetry={load} />
      </div>
    );
  }

  const isShadow = exec.mode === "Shadow";

  return (
    <div className="app-container animate-fade-in py-8">
      <PageHeader
        eyebrow="Thực thi"
        icon="bolt"
        title={`Thực thi ${exec.workflowName}`}
        subtitle={eventLabel(exec.eventType)}
        actions={
          exec.retryAvailable ? (
            <button type="button" className="btn btn-primary" onClick={() => setConfirmRetry(true)}>
              Thử lại
            </button>
          ) : null
        }
      />

      <div className="mt-6 card p-5">
        <dl className="grid grid-cols-2 gap-4 text-[14px] md:grid-cols-4">
          <div>
            <dt className="text-[12px] uppercase tracking-wide text-[#a8a4a2]">Trạng thái</dt>
            <dd className="mt-1">{statusBadge(exec.status)}</dd>
          </div>
          <div>
            <dt className="text-[12px] uppercase tracking-wide text-[#a8a4a2]">Chế độ chạy</dt>
            <dd className="mt-1">{modeBadge(exec.mode)}</dd>
          </div>
          <div>
            <dt className="text-[12px] uppercase tracking-wide text-[#a8a4a2]">Số lần thử</dt>
            <dd className="mt-1 text-[#1a1c1c]">{exec.attemptCount}</dd>
          </div>
          <div>
            <dt className="text-[12px] uppercase tracking-wide text-[#a8a4a2]">Thời lượng</dt>
            <dd className="mt-1 text-[#1a1c1c]">{exec.durationMs != null ? `${exec.durationMs} ms` : "—"}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-[12px] uppercase tracking-wide text-[#a8a4a2]">Mã thực thi</dt>
            <dd className="mt-1 select-all font-mono text-[13px] text-[#1a1c1c]">{exec.id}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-[12px] uppercase tracking-wide text-[#a8a4a2]">Bắt đầu / Kết thúc</dt>
            <dd className="mt-1 text-[#1a1c1c]">
              {formatDateTime(exec.startedAt)} → {formatDateTime(exec.finishedAt)}
            </dd>
          </div>
        </dl>
        {exec.errorReason ? (
          <p className="mt-3 rounded-[10px] bg-rose-50 px-3 py-2 text-[13px] text-rose-700">{exec.errorReason}</p>
        ) : null}
        {isShadow ? (
          <p className="mt-3 rounded-[10px] bg-sky-50 px-3 py-2 text-[13px] text-sky-700">
            Chế độ Shadow: hệ thống chỉ ghi lại kết quả "sẽ chạy" (would run) và không gửi thông báo thật.
          </p>
        ) : null}
        <JsonDetails label="Payload sự kiện" json={exec.inputPayloadJson} />
        <JsonDetails label="Kết quả tổng hợp (output)" json={exec.outputJson} />
      </div>

      <h2 className="mt-6 text-[16px] font-semibold text-[#1a1c1c]">Dòng thời gian các bước</h2>
      <ol className="mt-3 space-y-3">
        {exec.steps.map((s) => (
          <li key={s.id} className="card p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[14px] font-medium text-[#1a1c1c]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f0eceb] text-[12px] font-bold">{s.stepNo}</span>
                {s.stepType === "action" ? actionLabel(s.actionType ?? "") : "Đánh giá điều kiện"}
              </span>
              {statusBadge(s.status)}
            </div>
            {s.errorReason ? <p className="mt-2 text-[13px] text-rose-600">{s.errorReason}</p> : null}
            <JsonDetails label="Input" json={s.inputJson} />
            <JsonDetails label="Output" json={s.outputJson} />
          </li>
        ))}
      </ol>

      {exec.versionSnapshot ? (
        <div className="mt-6 card p-5">
          <h3 className="text-[15px] font-semibold text-[#1a1c1c]">Ảnh chụp phiên bản workflow (v{exec.versionSnapshot.versionNo})</h3>
          <p className="mt-1 text-[13px] text-[#5f5e5e]">Trigger: {eventLabel(exec.versionSnapshot.triggerEventType)} · Chế độ: {exec.versionSnapshot.mode}</p>
          <JsonDetails label="Chi tiết phiên bản (JSON)" json={JSON.stringify(exec.versionSnapshot)} />
        </div>
      ) : null}

      <div className="mt-6">
        <button type="button" className="btn btn-ghost" onClick={() => navigate("/system-admin/automation/executions")}>
          ← Về lịch sử thực thi
        </button>
      </div>

      <ConfirmModal open={confirmRetry} title="Thử lại thực thi" confirmLabel="Thử lại" busy={busy} onConfirm={doRetry} onClose={() => setConfirmRetry(false)}>
        <p>Chạy lại các hành động của lần thực thi này?</p>
      </ConfirmModal>
    </div>
  );
}

export default ExecutionDetailScreen;
