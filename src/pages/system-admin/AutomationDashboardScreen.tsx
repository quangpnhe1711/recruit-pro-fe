import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../../common/components/PageHeader";
import CommonTable from "../../common/components/CommonTable";
import { SkeletonGrid } from "../../common/components/Skeleton";
import Badge from "../../common/components/Badge";
import { getDashboard, getDiagnostics } from "../../services/system-admin/automationService";
import type {
  AutomationDashboardDto,
  AutomationDiagnosticsDto,
  ExecutionSummaryDto,
} from "../../modules/system-admin/automationSchema";
import { useI18n } from "../../i18n";
import { ErrorState, eventLabel, formatDateTime, modeBadge, shortId, statusBadge } from "./automationUi";

const STAT_DEFS: { key: keyof AutomationDashboardDto; labelKey: string; icon: string; tone: string }[] = [
  { key: "totalWorkflows", labelKey: "automation.totalWorkflows", icon: "account_tree", tone: "#b90014" },
  { key: "enabledWorkflows", labelKey: "automation.activeWorkflows", icon: "toggle_on", tone: "#059669" },
  { key: "executionsToday", labelKey: "automation.executionsToday", icon: "play_circle", tone: "#0284c7" },
  { key: "failedExecutions", labelKey: "automation.failedExecutions", icon: "error", tone: "#e11d48" },
  { key: "deadLetterCount", labelKey: "automation.statusDead", icon: "report", tone: "#d97706" },
];

function AutomationDashboardScreen() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [data, setData] = useState<AutomationDashboardDto | null>(null);
  const [diag, setDiag] = useState<AutomationDiagnosticsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    // Diagnostics is best-effort — the dashboard still renders if it fails.
    getDiagnostics()
      .then(setDiag)
      .catch(() => setDiag(null));
    getDashboard()
      .then(setData)
      .catch(() => setError(t("common.loadFailed")))
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => load(), [load]);

  return (
    <div className="sysadmin-page animate-fade-in">
      <PageHeader
        icon="account_tree"
        title={t("automation.dashboardTitle")}
        subtitle={t("automation.dashboardSubtitle")}
        actions={
          <>
            <Link to="/system-admin/automation/diagnostics" className="btn btn-secondary">
              {t("nav.diagnostics")}
            </Link>
            <Link to="/system-admin/automation/workflows" className="btn btn-secondary">
              {t("nav.workflows")}
            </Link>
            <Link to="/system-admin/automation/executions" className="btn btn-primary">
              {t("automation.executionsTitle")}
            </Link>
          </>
        }
      />

      {diag ? (
        <div className="mt-6 flex flex-wrap items-center gap-2.5 rounded-[16px] border border-[#e5dedb] bg-[#fffdfc] px-4 py-3 shadow-[0_14px_36px_-32px_rgba(26,28,28,0.55)]">
          <Badge tone={diag.automationEnabled ? "success" : "neutral"} dot>
            {t("automation.title")}: {diag.automationEnabled ? t("automation.enabled") : t("automation.disabled")}
          </Badge>
          <Badge tone={diag.dispatcherHealthy ? "success" : "danger"} dot>
            Worker: {diag.dispatcherHealthy ? t("automation.workerOnline") : t("automation.workerNeedsAttention")}
          </Badge>
          <Badge tone={diag.pendingEvents > 0 ? "warning" : "neutral"}>
            {t("automation.pendingEventsCount", { count: diag.pendingEvents })}
          </Badge>
        </div>
      ) : null}

      {diag && diag.warnings.length > 0 ? (
        <div className="executive-section mt-4 border-[#f6e2c4] bg-[#fdf9f0] p-4">
          <p className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-[#7a5320]">
            <span className="material-symbols-outlined text-[18px]">warning</span>
            {t("automation.attention")}
          </p>
          <ul className="space-y-1">
            {diag.warnings.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-[12.5px] text-[#7a5320]">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#b45309]" />
                {w}
              </li>
            ))}
          </ul>
          <Link
            to="/system-admin/automation/diagnostics"
            className="mt-2 inline-block text-[12.5px] font-semibold text-[#b90014] hover:underline"
          >
            {t("automation.viewDiagnostics")}
          </Link>
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6">
          <SkeletonGrid count={5} columns={5} />
        </div>
      ) : error || !data ? (
        // `data == null` after a "successful" call is still a failed load —
        // never leave the page silently blank.
        <div className="mt-6">
          <ErrorState message={error ?? undefined} onRetry={load} />
        </div>
      ) : (
        <>
          <div className="stagger mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {STAT_DEFS.map((s) => (
              <div key={s.key} className="executive-metric">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: `${s.tone}14`, color: s.tone }}
                >
                  <span className="material-symbols-outlined text-[22px]">{s.icon}</span>
                </span>
                <p className="mt-3 text-[28px] font-bold tabular-nums text-[#1a1c1c]">
                  {data[s.key] as number}
                </p>
                <p className="text-[13px] text-[#5f5e5e]">{t(s.labelKey)}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.62fr)_minmax(0,0.38fr)]">
            <div className="executive-panel p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] text-[#5f5e5e]">{t("automation.mostCommonFailedAction")}</p>
                  <p className="mt-1 text-[17px] font-semibold text-[#1a1c1c]" data-testid="most-common-failed">
                    {data.mostCommonFailedAction ?? t("common.none")}
                  </p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-[#fff1f0] text-[#b90014]">
                  <span className="material-symbols-outlined text-[22px]">rule</span>
                </span>
              </div>
            </div>
            <div className="executive-panel p-5">
              <p className="text-[13px] text-[#5f5e5e]">{t("automation.recentExecutions")}</p>
              <p className="mt-1 text-[17px] font-semibold text-[#1a1c1c]">
                {data.recentExecutions.length}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="mb-3 text-[16px] font-semibold text-[#1a1c1c]">
              {t("automation.recentExecutions")}
            </h2>
            <CommonTable<ExecutionSummaryDto>
              variant="executive"
              data={data.recentExecutions}
              keyExtractor={(e) => e.id}
              emptyMessage={t("automation.noRecentActivity")}
              onRowClick={(e) => navigate(`/system-admin/automation/executions/${e.id}`)}
              columns={[
                {
                  key: "workflowName",
                  header: t("automation.workflow"),
                  primary: true,
                  renderCell: (e) => <strong>{e.workflowName}</strong>,
                },
                { key: "eventType", header: t("automation.eventType"), renderCell: (e) => eventLabel(e.eventType) },
                { key: "mode", header: t("automation.mode"), renderCell: (e) => modeBadge(e.mode) },
                { key: "status", header: t("common.status"), renderCell: (e) => statusBadge(e.status) },
                { key: "createdAt", header: t("common.time"), renderCell: (e) => formatDateTime(e.createdAt) },
                {
                  key: "id",
                  header: "ID",
                  hideOnMobile: true,
                  renderCell: (e) => <code className="text-[12px]">{shortId(e.id)}</code>,
                },
              ]}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default AutomationDashboardScreen;
