import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../common/components/PageHeader";
import { SkeletonGrid } from "../../common/components/Skeleton";
import Badge from "../../common/components/Badge";
import {
  getDiagnostics,
  getWorkflowDiagnostics,
  listWorkflows,
} from "../../services/system-admin/automationService";
import type {
  AutomationDiagnosticsDto,
  WorkflowDiagnosticsDto,
} from "../../modules/system-admin/automationSchema";
import { ErrorState, eventLabel, formatDateTime, modeBadge, statusBadge } from "./automationUi";

const STAT_DEFS: {
  key: keyof AutomationDiagnosticsDto;
  label: string;
  icon: string;
  tone: string;
}[] = [
  { key: "pendingEvents", label: "Sự kiện đang chờ", icon: "hourglass_top", tone: "#d97706" },
  { key: "executionsToday", label: "Thực thi hôm nay", icon: "play_circle", tone: "#0284c7" },
  { key: "failedEvents", label: "Sự kiện lỗi", icon: "error", tone: "#e11d48" },
  { key: "unresolvedDeadLetters", label: "Dead-letter", icon: "report", tone: "#b45309" },
];

function WorkerStatus({ data }: { data: AutomationDiagnosticsDto }) {
  const dispatcher = data.workers.find((w) => w.name === "dispatcher");
  const healthy = data.dispatcherHealthy && dispatcher && !dispatcher.isStale;
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] text-[#5f5e5e]">Worker xử lý (dispatcher)</p>
          <p className="mt-1 text-[17px] font-semibold text-[#1a1c1c]">
            {healthy ? "Đang chạy" : dispatcher ? "Quá hạn heartbeat" : "Chưa chạy"}
          </p>
        </div>
        <Badge tone={healthy ? "success" : "danger"} dot>
          {healthy ? "Khỏe mạnh" : "Cần kiểm tra"}
        </Badge>
      </div>
      <p className="mt-3 text-[12px] text-[#8a8786]">
        Heartbeat gần nhất: {formatDateTime(dispatcher?.lastBeatAt)}
        {dispatcher?.secondsSinceBeat != null
          ? ` (${Math.round(dispatcher.secondsSinceBeat)}s trước)`
          : ""}
      </p>
    </div>
  );
}

function AutomationStatus({ data }: { data: AutomationDiagnosticsDto }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] text-[#5f5e5e]">Trạng thái tự động hóa</p>
          <p className="mt-1 text-[17px] font-semibold text-[#1a1c1c]">
            {data.automationEnabled ? "Đang bật" : "Đang tắt"}
          </p>
        </div>
        <Badge tone={data.automationEnabled ? "success" : "neutral"} dot>
          {data.automationEnabled ? "Enabled" : "Disabled"}
        </Badge>
      </div>
      <p className="mt-3 text-[12px] text-[#8a8786]">
        Chế độ mặc định: <strong className="text-[#5f5e5e]">{data.defaultMode}</strong>
      </p>
    </div>
  );
}

function WorkflowDiagnosticCard({ d }: { d: WorkflowDiagnosticsDto }) {
  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={`/system-admin/automation/workflows/${d.id}`}
            className="text-[15px] font-semibold text-[#1a1c1c] hover:text-[#b90014]"
          >
            {d.name}
          </Link>
          <p className="mt-1 text-[12px] text-[#8a8786]">
            Trigger: {eventLabel(d.triggerEventType)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {modeBadge((d.effectiveMode as "Shadow" | "Live" | "Disabled") ?? "Disabled")}
          <Badge tone={d.healthy ? "success" : "warning"} dot>
            {d.healthy ? "Đang chạy" : "Chưa chạy"}
          </Badge>
        </div>
      </div>

      {d.noExecutionReason ? (
        <div className="mt-3 flex items-start gap-2 rounded-[10px] border border-[#f6e2c4] bg-[#fdf7ec] px-3 py-2.5">
          <span className="material-symbols-outlined mt-0.5 text-[18px] text-[#b45309]">info</span>
          <p className="text-[13px] leading-5 text-[#7a5320]">{d.noExecutionReason}</p>
        </div>
      ) : (
        <div className="mt-3 flex items-start gap-2 rounded-[10px] border border-[#cdeede] bg-[#eefaf3] px-3 py-2.5">
          <span className="material-symbols-outlined mt-0.5 text-[18px] text-[#15803d]">check_circle</span>
          <p className="text-[13px] leading-5 text-[#1f6b41]">
            Workflow đang hoạt động bình thường và sẽ tạo execution khi có sự kiện phù hợp.
          </p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Sự kiện hôm nay" value={d.eventsTodayOfType} />
        <MiniStat label="Thành công" value={d.successCount} />
        <MiniStat label="Bỏ qua" value={d.skippedCount} />
        <MiniStat label="Thất bại" value={d.failedCount} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[10px] bg-[#faf8f7] px-3 py-2">
      <p className="text-[18px] font-bold text-[#1a1c1c]">{value}</p>
      <p className="text-[11px] text-[#8a8786]">{label}</p>
    </div>
  );
}

function DiagnosticsScreen() {
  const [data, setData] = useState<AutomationDiagnosticsDto | null>(null);
  const [workflows, setWorkflows] = useState<WorkflowDiagnosticsDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getDiagnostics()
      .then(async (global) => {
        setData(global);
        const list = await listWorkflows();
        const diags = await Promise.all(
          list.map((w) => getWorkflowDiagnostics(w.id).catch(() => null)),
        );
        setWorkflows(diags.filter((d): d is WorkflowDiagnosticsDto => d !== null));
      })
      .catch(() => setError("Không tải được dữ liệu chẩn đoán tự động hóa."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);

  return (
    <div className="app-container animate-fade-in py-8">
      <PageHeader
        eyebrow="SystemAdmin"
        icon="troubleshoot"
        title="Chẩn đoán tự động hóa"
        subtitle="Kiểm tra worker, sự kiện, và lý do vì sao một workflow chưa tạo execution."
        actions={
          <button type="button" className="btn btn-secondary" onClick={load}>
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Làm mới
          </button>
        }
      />

      {loading ? (
        <div className="mt-6">
          <SkeletonGrid count={4} columns={4} />
        </div>
      ) : error ? (
        <div className="mt-6">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : data ? (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <AutomationStatus data={data} />
            <WorkerStatus data={data} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {STAT_DEFS.map((s) => (
              <div key={s.key} className="card p-5">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: `${s.tone}14`, color: s.tone }}
                >
                  <span className="material-symbols-outlined text-[22px]">{s.icon}</span>
                </span>
                <p className="mt-3 text-[26px] font-bold text-[#1a1c1c]">
                  {data[s.key] as number}
                </p>
                <p className="text-[13px] text-[#5f5e5e]">{s.label}</p>
              </div>
            ))}
          </div>

          {data.warnings.length > 0 ? (
            <div className="mt-4 card border-[#f6e2c4] bg-[#fdf9f0] p-5">
              <p className="mb-2 flex items-center gap-2 text-[14px] font-semibold text-[#7a5320]">
                <span className="material-symbols-outlined text-[20px]">warning</span>
                Cảnh báo
              </p>
              <ul className="space-y-1.5">
                {data.warnings.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-[#7a5320]">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#b45309]" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="card p-5">
              <p className="text-[13px] text-[#5f5e5e]">Sự kiện gần nhất</p>
              {data.latestEvent ? (
                <div className="mt-2">
                  <p className="text-[15px] font-semibold text-[#1a1c1c]">
                    {eventLabel(data.latestEvent.eventType)}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    {statusBadge(data.latestEvent.status)}
                    <span className="text-[12px] text-[#8a8786]">
                      {formatDateTime(data.latestEvent.occurredAt)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-[14px] text-[#a8a4a2]">Chưa có sự kiện.</p>
              )}
            </div>
            <div className="card p-5">
              <p className="text-[13px] text-[#5f5e5e]">Thực thi gần nhất</p>
              {data.latestExecution ? (
                <div className="mt-2">
                  <p className="text-[15px] font-semibold text-[#1a1c1c]">
                    {data.latestExecution.workflowName}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    {statusBadge(data.latestExecution.status)}
                    <span className="text-[12px] text-[#8a8786]">
                      {formatDateTime(data.latestExecution.createdAt)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-[14px] text-[#a8a4a2]">Chưa có lần thực thi nào.</p>
              )}
            </div>
          </div>

          <h2 className="mb-3 mt-8 text-[16px] font-semibold text-[#1a1c1c]">
            Chẩn đoán theo workflow
          </h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {workflows.map((d) => (
              <WorkflowDiagnosticCard key={d.id} d={d} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

export default DiagnosticsScreen;
