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
import { useI18n } from "../../i18n";
import { enabledBadge, ErrorState, eventLabel, formatDateTime, modeBadge, statusBadge } from "./automationUi";

const STAT_DEFS: {
  key: keyof AutomationDiagnosticsDto;
  labelKey: string;
  icon: string;
  tone: string;
}[] = [
  { key: "pendingEvents", labelKey: "automation.pendingEvents", icon: "hourglass_top", tone: "#d97706" },
  { key: "executionsToday", labelKey: "automation.executionsToday", icon: "play_circle", tone: "#0284c7" },
  { key: "failedEvents", labelKey: "automation.failedEvents", icon: "error", tone: "#e11d48" },
  { key: "unresolvedDeadLetters", labelKey: "automation.statusDead", icon: "report", tone: "#b45309" },
];

function WorkerStatus({ data }: { data: AutomationDiagnosticsDto }) {
  const { t } = useI18n();
  const dispatcher = data.workers.find((w) => w.name === "dispatcher");
  const healthy = data.dispatcherHealthy && dispatcher && !dispatcher.isStale;
  return (
    <div className="executive-section p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] text-[#5f5e5e]">{t("automation.workerHealth")}</p>
          <p className="mt-1 text-[17px] font-semibold text-[#1a1c1c]">
            {healthy
              ? t("automation.workerOnline")
              : dispatcher
                ? t("automation.workerStale")
                : t("automation.workerOffline")}
          </p>
        </div>
        <Badge tone={healthy ? "success" : "danger"} dot>
          {healthy ? t("automation.healthy") : t("automation.workerNeedsAttention")}
        </Badge>
      </div>
      <p className="mt-3 text-[12px] text-[#8a8786]">
        {t("automation.lastHeartbeat")}: {formatDateTime(dispatcher?.lastBeatAt)}
        {dispatcher?.secondsSinceBeat != null
          ? ` (${Math.round(dispatcher.secondsSinceBeat)}s)`
          : ""}
      </p>
    </div>
  );
}

function AutomationStatus({ data }: { data: AutomationDiagnosticsDto }) {
  const { t } = useI18n();
  return (
    <div className="executive-section p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] text-[#5f5e5e]">{t("automation.title")}</p>
          <p className="mt-1 text-[17px] font-semibold text-[#1a1c1c]">
            {data.automationEnabled ? t("automation.enabled") : t("automation.disabled")}
          </p>
        </div>
        {enabledBadge(data.automationEnabled)}
      </div>
      <p className="mt-3 text-[12px] text-[#8a8786]">
        {t("automation.defaultMode")}: <strong className="text-[#5f5e5e]">{data.defaultMode}</strong>
      </p>
    </div>
  );
}

function WorkflowDiagnosticCard({ d }: { d: WorkflowDiagnosticsDto }) {
  const { t } = useI18n();
  return (
    <div className="executive-section p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={`/system-admin/automation/workflows/${d.id}`}
            className="text-[15px] font-semibold text-[#1a1c1c] hover:text-[#b90014]"
          >
            {d.name}
          </Link>
          <p className="mt-1 text-[12px] text-[#8a8786]">
            {t("automation.triggerEvent")}: {eventLabel(d.triggerEventType)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {modeBadge((d.effectiveMode as "Shadow" | "Live" | "Disabled") ?? "Disabled")}
          <Badge tone={d.healthy ? "success" : "warning"} dot>
            {d.healthy ? t("automation.statusRunning") : t("automation.notRunningYet")}
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
          <p className="text-[13px] leading-5 text-[#1f6b41]">{t("automation.workflowHealthy")}</p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label={t("automation.eventsToday")} value={d.eventsTodayOfType} />
        <MiniStat label={t("automation.statusSucceeded")} value={d.successCount} />
        <MiniStat label={t("automation.statusSkipped")} value={d.skippedCount} />
        <MiniStat label={t("automation.statusFailed")} value={d.failedCount} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[10px] bg-[#faf8f7] px-3 py-2">
      <p className="text-[18px] font-bold tabular-nums text-[#1a1c1c]">{value}</p>
      <p className="text-[11px] text-[#8a8786]">{label}</p>
    </div>
  );
}

function DiagnosticsScreen() {
  const { t } = useI18n();
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
      .catch(() => setError(t("common.loadFailed")))
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => load(), [load]);

  return (
    <div className="sysadmin-page animate-fade-in">
      <PageHeader
        icon="troubleshoot"
        title={t("automation.diagnosticsTitle")}
        subtitle={t("automation.diagnosticsSubtitle")}
        actions={
          <button type="button" className="btn btn-secondary" onClick={load} disabled={loading}>
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            {loading ? t("common.refreshing") : t("common.refresh")}
          </button>
        }
      />

      {loading ? (
        <div className="mt-6">
          <SkeletonGrid count={4} columns={4} />
        </div>
      ) : error || !data ? (
        <div className="mt-6">
          <ErrorState message={error ?? undefined} onRetry={load} />
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <AutomationStatus data={data} />
            <WorkerStatus data={data} />
          </div>

          <div className="stagger mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {STAT_DEFS.map((s) => (
              <div key={s.key} className="executive-metric">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: `${s.tone}14`, color: s.tone }}
                >
                  <span className="material-symbols-outlined text-[22px]">{s.icon}</span>
                </span>
                <p className="mt-3 text-[26px] font-bold tabular-nums text-[#1a1c1c]">
                  {data[s.key] as number}
                </p>
                <p className="text-[13px] text-[#5f5e5e]">{t(s.labelKey)}</p>
              </div>
            ))}
          </div>

          {data.warnings.length > 0 ? (
            <div className="executive-section mt-4 border-[#f6e2c4] bg-[#fdf9f0] p-5">
              <p className="mb-2 flex items-center gap-2 text-[14px] font-semibold text-[#7a5320]">
                <span className="material-symbols-outlined text-[20px]">warning</span>
                {t("automation.attention")}
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
            <div className="executive-section p-5">
              <p className="text-[13px] text-[#5f5e5e]">{t("automation.latestEvent")}</p>
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
                <p className="mt-2 text-[14px] text-[#a8a4a2]">{t("automation.emptyEvents")}</p>
              )}
            </div>
            <div className="executive-section p-5">
              <p className="text-[13px] text-[#5f5e5e]">{t("automation.latestExecution")}</p>
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
                <p className="mt-2 text-[14px] text-[#a8a4a2]">{t("automation.emptyExecutions")}</p>
              )}
            </div>
          </div>

          <h2 className="mb-3 mt-8 text-[16px] font-semibold text-[#1a1c1c]">
            {t("automation.perWorkflowDiagnostics")}
          </h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {workflows.map((d) => (
              <WorkflowDiagnosticCard key={d.id} d={d} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default DiagnosticsScreen;
