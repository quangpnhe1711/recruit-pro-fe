import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../common/components/PageHeader";
import CommonTable from "../../common/components/CommonTable";
import Badge from "../../common/components/Badge";
import { SkeletonGrid } from "../../common/components/Skeleton";
import { getOverview } from "../../services/system-admin/adminService";
import type { SysAdminOverviewDto, SystemLogDto } from "../../modules/system-admin/adminSchema";
import { useI18n } from "../../i18n";
import { ErrorState, formatDateTime } from "./automationUi";

function Metric({
  icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: string;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "danger" | "warning";
}) {
  const valueColor =
    tone === "danger" ? "text-[#b90014]" : tone === "warning" ? "text-amber-600" : "text-[#1a1c1c]";
  return (
    <div className="executive-metric">
      <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wide text-[#8a8786]">
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
        {label}
      </div>
      <div className={`mt-2 text-[28px] font-semibold leading-none ${valueColor}`}>{value}</div>
      {hint ? <div className="mt-1.5 text-[12px] text-[#8a8786]">{hint}</div> : null}
    </div>
  );
}

/**
 * System Admin landing page: one glance answers "how many users/jobs/applications are live,
 * is automation healthy, and what changed recently" — with direct links into each console area.
 */
function AdminOverviewScreen() {
  const { t } = useI18n();
  const [data, setData] = useState<SysAdminOverviewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getOverview()
      .then((overview) => {
        if (!overview) throw new Error("empty");
        setData(overview);
      })
      .catch(() => setError(t("common.loadFailed")))
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => load(), [load]);

  return (
    <div className="sysadmin-page animate-fade-in">
      <PageHeader
        icon="shield_person"
        eyebrow={t("admin.consoleEyebrow")}
        title={t("admin.overviewTitle")}
        subtitle={t("admin.overviewSubtitle")}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/system-admin/users" className="btn btn-secondary">
              {t("admin.manageUsers")}
            </Link>
            <Link to="/system-admin/permissions" className="btn btn-primary">
              {t("admin.openRbac")}
            </Link>
          </div>
        }
      />

      {loading ? (
        <div className="mt-6">
          <SkeletonGrid count={8} />
        </div>
      ) : error || !data ? (
        <div className="mt-6">
          <ErrorState message={error ?? undefined} onRetry={load} />
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric
              icon="group"
              label={t("admin.metricUsers")}
              value={data.activeUsers}
              hint={t("admin.metricUsersHint", {
                total: String(data.totalUsers),
                inactive: String(data.inactiveUsers),
              })}
            />
            <Metric
              icon="work"
              label={t("admin.metricOpenJobs")}
              value={data.openJobs}
              hint={t("admin.metricOpenJobsHint", {
                closingSoon: String(data.jobsClosingSoon),
                pending: String(data.pendingApprovalJobs),
              })}
              tone={data.jobsClosingSoon > 0 ? "warning" : "default"}
            />
            <Metric
              icon="description"
              label={t("admin.metricApplications")}
              value={data.applicationsLast7Days}
              hint={t("admin.metricApplicationsHint", { total: String(data.totalApplications) })}
            />
            <Metric
              icon="event_available"
              label={t("admin.metricInterviews")}
              value={data.upcomingInterviews}
              hint={t("admin.metricInterviewsHint")}
            />
            <Metric
              icon="account_tree"
              label={t("admin.metricWorkflows")}
              value={data.enabledWorkflows}
              hint={t("admin.metricWorkflowsHint", { executions: String(data.executionsLast7Days) })}
            />
            <Metric
              icon="error"
              label={t("admin.metricFailedExecutions")}
              value={data.failedExecutionsLast7Days}
              hint={t("admin.metricFailedExecutionsHint")}
              tone={data.failedExecutionsLast7Days > 0 ? "danger" : "default"}
            />
            <Metric
              icon="verified_user"
              label={t("admin.metricRoles")}
              value={data.totalRoles}
              hint={t("admin.metricRolesHint", { permissions: String(data.totalPermissions) })}
            />
            <Metric
              icon="badge"
              label={t("admin.metricInactiveUsers")}
              value={data.inactiveUsers}
              hint={t("admin.metricInactiveUsersHint")}
              tone={data.inactiveUsers > 0 ? "warning" : "default"}
            />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
            <section className="executive-section">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="section-title">{t("admin.recentActivity")}</h2>
                <Link to="/system-admin/audit-logs" className="btn btn-ghost btn-sm text-[13px]">
                  {t("admin.viewAllLogs")}
                </Link>
              </div>
              <CommonTable<SystemLogDto>
                variant="executive"
                data={data.recentLogs}
                keyExtractor={(log) => log.id}
                emptyMessage={t("admin.emptyLogs")}
                emptyIcon="history"
                columns={[
                  {
                    key: "action",
                    header: t("admin.logAction"),
                    primary: true,
                    renderCell: (log) => (
                      <Badge tone="neutral">
                        <code className="text-[12px]">{log.action ?? "-"}</code>
                      </Badge>
                    ),
                  },
                  {
                    key: "description",
                    header: t("admin.logDescription"),
                    renderCell: (log) => (
                      <span className="text-[13px] text-[#3a3a3a]">{log.description ?? "-"}</span>
                    ),
                  },
                  {
                    key: "user",
                    header: t("admin.logActor"),
                    hideOnMobile: true,
                    renderCell: (log) => (
                      <span className="text-[13px]">{log.userFullName ?? log.userEmail ?? "-"}</span>
                    ),
                  },
                  {
                    key: "createdAt",
                    header: t("admin.logTime"),
                    renderCell: (log) => (
                      <span className="text-[13px] text-[#8a8786]">{formatDateTime(log.createdAt)}</span>
                    ),
                  },
                ]}
              />
            </section>

            <section className="executive-section">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="section-title">{t("admin.rolesSummary")}</h2>
                <Link to="/system-admin/roles" className="btn btn-ghost btn-sm text-[13px]">
                  {t("common.viewDetail")}
                </Link>
              </div>
              <ul className="flex flex-col gap-2.5">
                {data.roles.map((role) => (
                  <li key={role.id} className="surface-card flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[14px] font-semibold text-[#1a1c1c]">{role.name}</span>
                        {role.isSystemAdmin ? (
                          <Badge tone="brand" icon="shield_person">
                            {t("admin.adminRole")}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="mt-0.5 text-[12px] text-[#8a8786]">
                        {t("admin.roleCounts", {
                          users: String(role.userCount),
                          permissions: String(role.permissionCount),
                        })}
                      </div>
                    </div>
                    <Link
                      to={`/system-admin/permissions?role=${role.id}`}
                      className="premium-action text-[#b90014]"
                      aria-label={t("admin.openRbac")}
                    >
                      <span className="material-symbols-outlined">chevron_right</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminOverviewScreen;
