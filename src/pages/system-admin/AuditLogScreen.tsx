import { FormEvent, useCallback, useEffect, useState } from "react";
import PageHeader from "../../common/components/PageHeader";
import CommonTable from "../../common/components/CommonTable";
import Badge, { type BadgeTone } from "../../common/components/Badge";
import { listAuditLogs } from "../../services/system-admin/adminService";
import type { Paginated } from "../../modules/system-admin/automationSchema";
import type { SystemLogDto } from "../../modules/system-admin/adminSchema";
import { useI18n } from "../../i18n";
import { ErrorState, formatDateTime } from "./automationUi";

/** Action prefixes → badge tone, so scanning the log by eye works without reading every row. */
function actionTone(action: string | null): BadgeTone {
  if (!action) return "neutral";
  if (action.startsWith("RBAC") || action.startsWith("USER_")) return "brand";
  if (action.startsWith("JOB")) return "info";
  if (action.startsWith("APPLICATION")) return "success";
  if (action.startsWith("INTERVIEW") || action.startsWith("OFFER")) return "violet";
  return "neutral";
}

/**
 * System Admin → Audit Logs: who did what, when. RBAC changes and account status changes made in
 * this console are recorded here too, so admin actions are always traceable.
 */
function AuditLogScreen() {
  const { t } = useI18n();
  const [data, setData] = useState<Paginated<SystemLogDto> | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listAuditLogs({ q: search || undefined, page, pageSize: 20 })
      .then(setData)
      .catch(() => setError(t("common.loadFailed")))
      .finally(() => setLoading(false));
  }, [search, page, t]);

  useEffect(() => load(), [load]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const total = data?.totalItems ?? 0;
  const pageSize = data?.pageSize ?? 20;
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <div className="sysadmin-page animate-fade-in">
      <PageHeader
        icon="history"
        eyebrow={t("admin.consoleEyebrow")}
        title={t("admin.auditTitle")}
        subtitle={t("admin.auditSubtitle")}
      />

      <form className="executive-filter-bar mt-5 flex flex-wrap items-end gap-3" onSubmit={submitSearch}>
        <div className="min-w-64 flex-1">
          <label className="field-label" htmlFor="audit-search">
            {t("common.search")}
          </label>
          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-[#a8a4a2]">
              search
            </span>
            <input
              id="audit-search"
              type="search"
              className="input-field pl-10"
              placeholder={t("admin.auditSearchPlaceholder")}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
        </div>
        <button type="submit" className="btn btn-primary h-11">
          {t("common.search")}
        </button>
      </form>

      {error ? (
        <div className="mt-6">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : (
        <div className="mt-4">
          <CommonTable<SystemLogDto>
            variant="executive"
            data={data?.items ?? []}
            loading={loading}
            keyExtractor={(log) => log.id}
            emptyMessage={t("admin.emptyAudit")}
            emptyIcon="history"
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
              {
                key: "createdAt",
                header: t("admin.logTime"),
                primary: true,
                renderCell: (log) => (
                  <span className="whitespace-nowrap text-[13px] text-[#3a3a3a]">
                    {formatDateTime(log.createdAt)}
                  </span>
                ),
              },
              {
                key: "action",
                header: t("admin.logAction"),
                renderCell: (log) => (
                  <Badge tone={actionTone(log.action)}>
                    <code className="text-[12px]">{log.action ?? "-"}</code>
                  </Badge>
                ),
              },
              {
                key: "actor",
                header: t("admin.logActor"),
                hideOnMobile: true,
                renderCell: (log) => (
                  <div className="min-w-0">
                    <div className="truncate text-[13px] text-[#1a1c1c]">
                      {log.userFullName ?? t("admin.systemActor")}
                    </div>
                    {log.userEmail ? (
                      <div className="truncate text-[12px] text-[#8a8786]">{log.userEmail}</div>
                    ) : null}
                  </div>
                ),
              },
              {
                key: "description",
                header: t("admin.logDescription"),
                renderCell: (log) => (
                  <span className="text-[13px] leading-5 text-[#3a3a3a]">{log.description ?? "-"}</span>
                ),
              },
            ]}
          />
        </div>
      )}
    </div>
  );
}

export default AuditLogScreen;
