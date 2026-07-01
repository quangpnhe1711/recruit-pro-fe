import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../../common/components/PageHeader";
import CommonTable from "../../common/components/CommonTable";
import CommonSelect from "../../common/components/CommonSelect";
import { listExecutions, retryExecution } from "../../services/system-admin/automationService";
import type { ExecutionSummaryDto, Paginated } from "../../modules/system-admin/automationSchema";
import { TRIGGER_EVENT_TYPES } from "../../modules/system-admin/automationSchema";
import { ConfirmModal, ErrorState, eventLabel, formatDateTime, modeBadge, shortId, statusBadge } from "./automationUi";

const STATUS_OPTIONS = [
  { label: "Tất cả trạng thái", value: "" },
  { label: "Thành công", value: "Success" },
  { label: "Bỏ qua", value: "Skipped" },
  { label: "Thất bại", value: "Failed" },
  { label: "Đang thử lại", value: "Retrying" },
  { label: "Dead-letter", value: "DeadLetter" },
];

function ExecutionHistoryScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const workflowId = searchParams.get("workflowId") ?? undefined;

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [eventType, setEventType] = useState("");
  const [mode, setMode] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<Paginated<ExecutionSummaryDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryTarget, setRetryTarget] = useState<ExecutionSummaryDto | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listExecutions({
      workflowId,
      status: status || undefined,
      eventType: eventType || undefined,
      mode: mode || undefined,
      from: from || undefined,
      to: to || undefined,
      page,
      pageSize: 20,
    })
      .then(setData)
      .catch(() => setError("Không tải được lịch sử thực thi."))
      .finally(() => setLoading(false));
  }, [workflowId, status, eventType, mode, from, to, page]);

  useEffect(() => load(), [load]);

  const doRetry = async () => {
    if (!retryTarget) return;
    setBusy(true);
    try {
      await retryExecution(retryTarget.id);
      toast.success("Đã gửi yêu cầu thử lại.");
      setRetryTarget(null);
      load();
    } catch {
      toast.error("Không thể thử lại lần thực thi này.");
    } finally {
      setBusy(false);
    }
  };

  const total = data?.totalItems ?? 0;
  const pageSize = data?.pageSize ?? 20;
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <div className="app-container animate-fade-in py-8">
      <PageHeader eyebrow="SystemAdmin" icon="manage_history" title="Lịch sử thực thi" subtitle="Theo dõi, lọc và thử lại các lần chạy workflow." />

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <CommonSelect value={status} onValueChange={(v) => { setStatus(v); setPage(1); }} options={STATUS_OPTIONS} />
        <CommonSelect
          value={eventType}
          onValueChange={(v) => { setEventType(v); setPage(1); }}
          options={[{ label: "Tất cả sự kiện", value: "" }, ...TRIGGER_EVENT_TYPES.map((t) => ({ label: eventLabel(t), value: t }))]}
        />
        <CommonSelect
          value={mode}
          onValueChange={(v) => { setMode(v); setPage(1); }}
          options={[{ label: "Tất cả chế độ", value: "" }, { label: "Shadow", value: "Shadow" }, { label: "Live", value: "Live" }, { label: "Disabled", value: "Disabled" }]}
        />
        <input aria-label="Từ ngày" className="input-field" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
        <input aria-label="Đến ngày" className="input-field" type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
      </div>

      {error ? (
        <div className="mt-6">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : (
        <div className="mt-4">
          <CommonTable<ExecutionSummaryDto>
            data={data?.items ?? []}
            loading={loading}
            keyExtractor={(e) => e.id}
            emptyMessage="Không có lần thực thi nào"
            emptyIcon="manage_history"
            onRowClick={(e) => navigate(`/system-admin/automation/executions/${e.id}`)}
            showPagination
            pagination={{
              enabled: true,
              currentPage: page,
              totalPages: data?.totalPages ?? 1,
              totalItems: total,
              rangeStart,
              rangeEnd,
              onPageChange: setPage,
            }}
            columns={[
              { key: "id", header: "ID", primary: true, renderCell: (e) => <code className="text-[12px]">{shortId(e.id)}</code> },
              { key: "workflowName", header: "Workflow", renderCell: (e) => e.workflowName },
              { key: "eventType", header: "Sự kiện", renderCell: (e) => eventLabel(e.eventType) },
              { key: "mode", header: "Chế độ", renderCell: (e) => modeBadge(e.mode) },
              { key: "status", header: "Trạng thái", renderCell: (e) => statusBadge(e.status) },
              { key: "durationMs", header: "Thời lượng", hideOnMobile: true, renderCell: (e) => (e.durationMs != null ? `${e.durationMs} ms` : "—") },
              { key: "createdAt", header: "Bắt đầu", renderCell: (e) => formatDateTime(e.startedAt ?? e.createdAt) },
              { key: "errorReason", header: "Lỗi", hideOnMobile: true, renderCell: (e) => <span className="line-clamp-1 text-[13px] text-rose-600">{e.errorReason ?? ""}</span> },
              {
                key: "actions",
                header: "Thao tác",
                isAction: true,
                renderCell: (e) =>
                  e.retryAvailable ? (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setRetryTarget(e);
                      }}
                    >
                      Thử lại
                    </button>
                  ) : (
                    <span className="text-[13px] text-[#a8a4a2]">—</span>
                  ),
              },
            ]}
          />
        </div>
      )}

      <ConfirmModal
        open={!!retryTarget}
        title="Thử lại thực thi"
        confirmLabel="Thử lại"
        busy={busy}
        onConfirm={doRetry}
        onClose={() => setRetryTarget(null)}
      >
        <p>Chạy lại các hành động của lần thực thi thất bại/dead-letter này?</p>
      </ConfirmModal>
    </div>
  );
}

export default ExecutionHistoryScreen;
