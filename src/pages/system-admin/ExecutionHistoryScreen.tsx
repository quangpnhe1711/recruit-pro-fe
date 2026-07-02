import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../../common/components/PageHeader";
import CommonTable from "../../common/components/CommonTable";
import CommonSelect from "../../common/components/CommonSelect";
import { listExecutions, retryExecution } from "../../services/system-admin/automationService";
import type { ExecutionSummaryDto, Paginated } from "../../modules/system-admin/automationSchema";
import { TRIGGER_EVENT_TYPES } from "../../modules/system-admin/automationSchema";
import { useI18n } from "../../i18n";
import { ConfirmModal, ErrorState, eventLabel, formatDateTime, modeBadge, shortId, statusBadge } from "./automationUi";

function ExecutionHistoryScreen() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
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
      .catch(() => setError(t("common.loadFailed")))
      .finally(() => setLoading(false));
  }, [workflowId, status, eventType, mode, from, to, page, t]);

  useEffect(() => load(), [load]);

  const doRetry = async () => {
    if (!retryTarget) return;
    setBusy(true);
    try {
      await retryExecution(retryTarget.id);
      toast.success(t("automation.retrySent"));
      setRetryTarget(null);
      load();
    } catch {
      toast.error(t("automation.retryFailed"));
    } finally {
      setBusy(false);
    }
  };

  const clearWorkflowFilter = () => {
    searchParams.delete("workflowId");
    setSearchParams(searchParams, { replace: true });
    setPage(1);
  };

  const total = data?.totalItems ?? 0;
  const pageSize = data?.pageSize ?? 20;
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  const STATUS_OPTIONS = [
    { label: t("automation.filterAllStatuses"), value: "" },
    { label: t("automation.statusSucceeded"), value: "Success" },
    { label: t("automation.statusSkipped"), value: "Skipped" },
    { label: t("automation.statusFailed"), value: "Failed" },
    { label: t("automation.statusRetrying"), value: "Retrying" },
    { label: t("automation.statusDead"), value: "DeadLetter" },
  ];

  return (
    <div className="sysadmin-page animate-fade-in">
      <PageHeader
        icon="manage_history"
        title={t("automation.executionsTitle")}
        subtitle={t("automation.executionsSubtitle")}
      />

      {/* Deep-link scope from a workflow detail page — visible and clearable. */}
      {workflowId ? (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#e0d4d2] bg-[#fff1f0] py-1.5 pl-3.5 pr-1.5 text-[13px] font-semibold text-[#b90014]">
          {t("automation.filteredByWorkflow")}
          <code className="text-[12px] font-normal">{shortId(workflowId)}</code>
          <button
            type="button"
            className="premium-action flex h-6 w-6 items-center justify-center rounded-full hover:bg-[#ffdad6]"
            aria-label={t("automation.clearFilter")}
            onClick={clearWorkflowFilter}
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      ) : null}

      <div className="executive-filter-bar mt-5 grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <CommonSelect value={status} onValueChange={(v) => { setStatus(v); setPage(1); }} options={STATUS_OPTIONS} />
        <CommonSelect
          value={eventType}
          onValueChange={(v) => { setEventType(v); setPage(1); }}
          options={[
            { label: t("automation.filterAllTriggers"), value: "" },
            ...TRIGGER_EVENT_TYPES.map((tr) => ({ label: eventLabel(tr), value: tr })),
          ]}
        />
        <CommonSelect
          value={mode}
          onValueChange={(v) => { setMode(v); setPage(1); }}
          options={[
            { label: t("automation.filterAllModes"), value: "" },
            { label: "Shadow", value: "Shadow" },
            { label: "Live", value: "Live" },
            { label: t("automation.disabled"), value: "Disabled" },
          ]}
        />
        <input aria-label={t("automation.fromDate")} className="input-field" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
        <input aria-label={t("automation.toDate")} className="input-field" type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
      </div>

      {error ? (
        <div className="mt-6">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : (
        <div className="mt-4">
          <CommonTable<ExecutionSummaryDto>
            variant="executive"
            data={data?.items ?? []}
            loading={loading}
            keyExtractor={(e) => e.id}
            emptyMessage={t("automation.emptyExecutions")}
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
              { key: "workflowName", header: t("automation.workflow"), renderCell: (e) => e.workflowName },
              { key: "eventType", header: t("automation.eventType"), renderCell: (e) => eventLabel(e.eventType) },
              { key: "mode", header: t("automation.mode"), renderCell: (e) => modeBadge(e.mode) },
              { key: "status", header: t("common.status"), renderCell: (e) => statusBadge(e.status) },
              {
                key: "durationMs",
                header: t("automation.duration"),
                hideOnMobile: true,
                renderCell: (e) => (e.durationMs != null ? `${e.durationMs} ms` : "-"),
              },
              { key: "createdAt", header: t("automation.startedAt"), renderCell: (e) => formatDateTime(e.startedAt ?? e.createdAt) },
              {
                key: "errorReason",
                header: t("automation.errorColumn"),
                hideOnMobile: true,
                renderCell: (e) => <span className="line-clamp-1 text-[13px] text-rose-600">{e.errorReason ?? ""}</span>,
              },
              {
                key: "actions",
                header: t("common.actions"),
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
                      {t("common.retry")}
                    </button>
                  ) : (
                    <span className="text-[13px] text-[#a8a4a2]">-</span>
                  ),
              },
            ]}
          />
        </div>
      )}

      <ConfirmModal
        open={!!retryTarget}
        title={t("automation.retryTitle")}
        confirmLabel={t("common.retry")}
        busy={busy}
        onConfirm={doRetry}
        onClose={() => setRetryTarget(null)}
      >
        <p>{t("automation.retryBody")}</p>
      </ConfirmModal>
    </div>
  );
}

export default ExecutionHistoryScreen;
