import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../common/components/PageHeader";
import CommonTable from "../../common/components/CommonTable";
import CommonSelect from "../../common/components/CommonSelect";
import { toast } from "react-toastify";
import { listWorkflows, publishWorkflow, setWorkflowEnabled } from "../../services/system-admin/automationService";
import type { WorkflowSummaryDto } from "../../modules/system-admin/automationSchema";
import { TRIGGER_EVENT_TYPES } from "../../modules/system-admin/automationSchema";
import WorkflowEditor from "./WorkflowEditor";
import {
  ConfirmModal,
  enabledBadge,
  ErrorState,
  eventLabel,
  formatDateTime,
  modeBadge,
  statusBadge,
} from "./automationUi";

function WorkflowListScreen() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<WorkflowSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enabledFilter, setEnabledFilter] = useState("");
  const [triggerFilter, setTriggerFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [publishTarget, setPublishTarget] = useState<WorkflowSummaryDto | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listWorkflows({
      isEnabled: enabledFilter === "" ? undefined : enabledFilter === "true",
      trigger: triggerFilter || undefined,
      mode: modeFilter || undefined,
    })
      .then(setRows)
      .catch(() => setError("Không tải được danh sách workflow."))
      .finally(() => setLoading(false));
  }, [enabledFilter, triggerFilter, modeFilter]);

  useEffect(() => load(), [load]);

  const toggleEnabled = async (wf: WorkflowSummaryDto) => {
    try {
      await setWorkflowEnabled(wf.id, !wf.isEnabled);
      toast.success(wf.isEnabled ? "Đã tắt workflow." : "Đã bật workflow.");
      load();
    } catch {
      toast.error("Không thể thay đổi trạng thái workflow.");
    }
  };

  const confirmPublish = async () => {
    if (!publishTarget) return;
    setBusy(true);
    try {
      await publishWorkflow(publishTarget.id);
      toast.success("Đã xuất bản phiên bản workflow.");
      setPublishTarget(null);
      load();
    } catch {
      toast.error("Không thể xuất bản workflow (cần có bản nháp).");
    } finally {
      setBusy(false);
    }
  };

  const triggerOptions = useMemo(
    () => [{ label: "Tất cả trigger", value: "" }, ...TRIGGER_EVENT_TYPES.map((t) => ({ label: eventLabel(t), value: t }))],
    [],
  );

  return (
    <div className="app-container animate-fade-in py-8">
      <PageHeader
        eyebrow="SystemAdmin"
        icon="account_tree"
        title="Danh sách workflow"
        subtitle="Quản lý các quy trình tự động. Chỉ SystemAdmin cấu hình; HR/Manager chỉ nhận kết quả."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
            + Tạo workflow
          </button>
        }
      />

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <CommonSelect
          value={enabledFilter}
          onValueChange={setEnabledFilter}
          options={[
            { label: "Tất cả trạng thái", value: "" },
            { label: "Đã bật", value: "true" },
            { label: "Đã tắt", value: "false" },
          ]}
        />
        <CommonSelect value={triggerFilter} onValueChange={setTriggerFilter} options={triggerOptions} />
        <CommonSelect
          value={modeFilter}
          onValueChange={setModeFilter}
          options={[
            { label: "Tất cả chế độ", value: "" },
            { label: "Shadow", value: "Shadow" },
            { label: "Live", value: "Live" },
            { label: "Đã tắt (Disabled)", value: "Disabled" },
          ]}
        />
      </div>

      {error ? (
        <div className="mt-6">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : (
        <div className="mt-4">
          <CommonTable<WorkflowSummaryDto>
            data={rows}
            loading={loading}
            keyExtractor={(w) => w.id}
            emptyMessage="Không có workflow nào"
            emptyIcon="account_tree"
            columns={[
              { key: "name", header: "Tên workflow", primary: true, renderCell: (w) => <strong>{w.name}</strong> },
              { key: "isEnabled", header: "Trạng thái", renderCell: (w) => enabledBadge(w.isEnabled) },
              { key: "activeVersionNo", header: "Phiên bản", renderCell: (w) => (w.activeVersionNo ? `v${w.activeVersionNo}` : "—") },
              { key: "triggerEventType", header: "Trigger", renderCell: (w) => eventLabel(w.triggerEventType) },
              { key: "mode", header: "Chế độ chạy", renderCell: (w) => modeBadge(w.mode) },
              { key: "lastRunAt", header: "Chạy gần nhất", hideOnMobile: true, renderCell: (w) => formatDateTime(w.lastRunAt) },
              { key: "lastStatus", header: "Kết quả", renderCell: (w) => statusBadge(w.lastStatus) },
              {
                key: "actions",
                header: "Thao tác",
                isAction: true,
                renderCell: (w) => (
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/system-admin/automation/workflows/${w.id}`);
                      }}
                    >
                      Xem
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleEnabled(w);
                      }}
                    >
                      {w.isEnabled ? "Tắt" : "Bật"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPublishTarget(w);
                      }}
                    >
                      Xuất bản
                    </button>
                  </div>
                ),
              },
            ]}
          />
        </div>
      )}

      {creating ? (
        <WorkflowEditor
          mode="create"
          onClose={() => setCreating(false)}
          onSaved={(newId) => {
            setCreating(false);
            navigate(`/system-admin/automation/workflows/${newId}`);
          }}
        />
      ) : null}

      <ConfirmModal
        open={!!publishTarget}
        title="Xuất bản phiên bản workflow"
        confirmLabel="Xuất bản"
        danger={publishTarget?.mode === "Live"}
        busy={busy}
        onConfirm={confirmPublish}
        onClose={() => setPublishTarget(null)}
      >
        <p>
          Xuất bản bản nháp mới nhất của <strong>{publishTarget?.name}</strong> và kích hoạt phiên bản này.
        </p>
        {publishTarget?.mode === "Live" ? (
          <p className="mt-3 rounded-[10px] bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
            Chế độ Live sẽ gửi thông báo thật. Hãy kiểm tra kỹ trước khi xuất bản.
          </p>
        ) : (
          <p className="mt-3 rounded-[10px] bg-sky-50 px-3 py-2 text-[13px] text-sky-700">
            Workflow đang ở chế độ Shadow nên hệ thống chỉ ghi log, chưa gửi thông báo thật.
          </p>
        )}
      </ConfirmModal>
    </div>
  );
}

export default WorkflowListScreen;
