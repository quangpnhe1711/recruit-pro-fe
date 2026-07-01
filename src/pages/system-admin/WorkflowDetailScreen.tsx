import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../../common/components/PageHeader";
import { SkeletonText } from "../../common/components/Skeleton";
import CommonTable from "../../common/components/CommonTable";
import {
  getWorkflow,
  publishWorkflow,
  setWorkflowEnabled,
} from "../../services/system-admin/automationService";
import type { ExecutionSummaryDto, WorkflowDetailDto, WorkflowVersionDto } from "../../modules/system-admin/automationSchema";
import WorkflowEditor from "./WorkflowEditor";
import {
  actionLabel,
  ConfirmModal,
  enabledBadge,
  ErrorState,
  eventLabel,
  formatDateTime,
  JsonDetails,
  modeBadge,
  OPERATOR_LABELS,
  statusBadge,
} from "./automationUi";

function VersionCard({ version, title }: { version: WorkflowVersionDto; title: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-[#1a1c1c]">
          {title} (v{version.versionNo})
        </h3>
        {modeBadge(version.mode)}
      </div>
      <dl className="mt-4 space-y-3 text-[14px]">
        <div>
          <dt className="text-[12px] font-semibold uppercase tracking-wide text-[#a8a4a2]">Trigger</dt>
          <dd className="mt-1 text-[#1a1c1c]">{eventLabel(version.triggerEventType)}</dd>
        </div>
        <div>
          <dt className="text-[12px] font-semibold uppercase tracking-wide text-[#a8a4a2]">Điều kiện</dt>
          <dd className="mt-1">
            {version.conditions.length === 0 ? (
              <span className="text-[#8a8786]">Không có (luôn chạy)</span>
            ) : (
              <ul className="space-y-1">
                {version.conditions.map((c, i) => (
                  <li key={i} className="text-[#3a3a3a]">
                    <code className="text-[13px]">{c.field}</code> {OPERATOR_LABELS[c.operator] ?? c.operator}{" "}
                    <code className="text-[13px]">{c.value ?? ""}</code>
                  </li>
                ))}
              </ul>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-[12px] font-semibold uppercase tracking-wide text-[#a8a4a2]">Hành động</dt>
          <dd className="mt-1 space-y-2">
            {version.actions.map((a, i) => (
              <div key={i} className="rounded-[8px] bg-[#fbfaf9] px-3 py-2">
                <span className="font-medium text-[#1a1c1c]">{actionLabel(a.type)}</span>
                <JsonDetails label="Cấu hình (JSON)" json={a.configJson} />
              </div>
            ))}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function WorkflowDetailScreen() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [wf, setWf] = useState<WorkflowDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState<null | "publish" | "toggle">(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getWorkflow(id)
      .then(setWf)
      .catch(() => setError("Không tải được chi tiết workflow."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => load(), [load]);

  const doPublish = async () => {
    setBusy(true);
    try {
      await publishWorkflow(id);
      toast.success("Đã xuất bản phiên bản workflow.");
      setConfirm(null);
      load();
    } catch {
      toast.error("Không thể xuất bản workflow.");
    } finally {
      setBusy(false);
    }
  };

  const doToggle = async () => {
    if (!wf) return;
    setBusy(true);
    try {
      await setWorkflowEnabled(id, !wf.isEnabled);
      toast.success(wf.isEnabled ? "Đã tắt workflow." : "Đã bật workflow.");
      setConfirm(null);
      load();
    } catch {
      toast.error("Không thể đổi trạng thái workflow.");
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
  if (error || !wf) {
    return (
      <div className="app-container py-8">
        <ErrorState message={error ?? "Không tìm thấy workflow."} onRetry={load} />
      </div>
    );
  }

  const liveMode = (wf.activeVersion?.mode ?? "Shadow") === "Live";

  return (
    <div className="app-container animate-fade-in py-8">
      <PageHeader
        eyebrow="Workflow"
        icon="account_tree"
        title={wf.name}
        subtitle={wf.description ?? "—"}
        actions={
          <>
            {enabledBadge(wf.isEnabled)}
            <button type="button" className="btn btn-secondary" onClick={() => setEditing(true)}>
              Sửa bản nháp
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setConfirm("toggle")}>
              {wf.isEnabled ? "Tắt" : "Bật"}
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setConfirm("publish")}>
              Xuất bản phiên bản
            </button>
          </>
        }
      />

      {liveMode ? (
        <p className="mt-4 rounded-[10px] bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
          Phiên bản đang hoạt động ở chế độ Live — hệ thống sẽ gửi thông báo thật cho sự kiện này.
        </p>
      ) : (
        <p className="mt-4 rounded-[10px] bg-sky-50 px-3 py-2 text-[13px] text-sky-700">
          Workflow đang ở chế độ Shadow nên hệ thống chỉ ghi log, chưa gửi thông báo thật.
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {wf.activeVersion ? (
          <VersionCard version={wf.activeVersion} title="Phiên bản đang hoạt động" />
        ) : (
          <div className="card p-5 text-[14px] text-[#8a8786]">Chưa có phiên bản hoạt động. Hãy tạo bản nháp và xuất bản.</div>
        )}

        <div className="card p-5">
          <h3 className="text-[15px] font-semibold text-[#1a1c1c]">Lịch sử phiên bản</h3>
          <ul className="mt-3 space-y-2 text-[14px]">
            {wf.versions.map((v) => (
              <li key={v.id} className="flex items-center justify-between rounded-[8px] bg-[#fbfaf9] px-3 py-2">
                <span>
                  v{v.versionNo} · {v.publishedAt ? `xuất bản ${formatDateTime(v.publishedAt)}` : "bản nháp"}
                </span>
                <span className="flex items-center gap-2">
                  {v.isActive ? <span className="text-[12px] font-semibold text-emerald-600">Đang dùng</span> : null}
                  {modeBadge(v.mode)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-[#1a1c1c]">Thực thi gần đây</h2>
        <Link to={`/system-admin/automation/executions?workflowId=${wf.id}`} className="btn btn-ghost">
          Xem tất cả
        </Link>
      </div>
      <div className="mt-3">
        <CommonTable<ExecutionSummaryDto>
          data={wf.recentExecutions}
          keyExtractor={(e) => e.id}
          emptyMessage="Chưa có lần thực thi nào"
          onRowClick={(e) => navigate(`/system-admin/automation/executions/${e.id}`)}
          columns={[
            { key: "eventType", header: "Sự kiện", primary: true, renderCell: (e) => eventLabel(e.eventType) },
            { key: "mode", header: "Chế độ", renderCell: (e) => modeBadge(e.mode) },
            { key: "status", header: "Trạng thái", renderCell: (e) => statusBadge(e.status) },
            { key: "createdAt", header: "Thời gian", renderCell: (e) => formatDateTime(e.createdAt) },
          ]}
        />
      </div>

      {editing ? (
        <WorkflowEditor
          mode="edit"
          workflow={wf}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            load();
          }}
        />
      ) : null}

      <ConfirmModal
        open={confirm === "publish"}
        title="Xuất bản phiên bản workflow"
        confirmLabel="Xuất bản"
        danger={liveMode}
        busy={busy}
        onConfirm={doPublish}
        onClose={() => setConfirm(null)}
      >
        <p>Xuất bản bản nháp mới nhất và kích hoạt phiên bản này.</p>
        {liveMode ? (
          <p className="mt-3 rounded-[10px] bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
            Chế độ Live sẽ gửi thông báo thật. Hãy kiểm tra kỹ trước khi xuất bản.
          </p>
        ) : null}
      </ConfirmModal>

      <ConfirmModal
        open={confirm === "toggle"}
        title={wf.isEnabled ? "Tắt workflow" : "Bật workflow"}
        confirmLabel={wf.isEnabled ? "Tắt" : "Bật"}
        busy={busy}
        onConfirm={doToggle}
        onClose={() => setConfirm(null)}
      >
        <p>
          {wf.isEnabled
            ? "Workflow sẽ ngừng chạy cho các sự kiện mới."
            : "Workflow sẽ bắt đầu chạy cho các sự kiện phù hợp."}
        </p>
      </ConfirmModal>
    </div>
  );
}

export default WorkflowDetailScreen;
