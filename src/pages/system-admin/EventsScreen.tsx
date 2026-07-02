import { useCallback, useEffect, useState } from "react";
import PageHeader from "../../common/components/PageHeader";
import CommonTable from "../../common/components/CommonTable";
import CommonSelect from "../../common/components/CommonSelect";
import { SkeletonGrid } from "../../common/components/Skeleton";
import { listEvents } from "../../services/system-admin/automationService";
import type { OutboxEventDto, Paginated } from "../../modules/system-admin/automationSchema";
import { TRIGGER_EVENT_TYPES } from "../../modules/system-admin/automationSchema";
import { useI18n } from "../../i18n";
import { ErrorState, eventLabel, formatDateTime, JsonDetails, shortId, statusBadge } from "./automationUi";

function EventsScreen() {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [eventType, setEventType] = useState("");
  const [data, setData] = useState<Paginated<OutboxEventDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listEvents({
      page,
      pageSize: 20,
      status: status || undefined,
      eventType: eventType || undefined,
    })
      .then(setData)
      .catch(() => setError(t("common.loadFailed")))
      .finally(() => setLoading(false));
  }, [page, status, eventType, t]);

  useEffect(() => load(), [load]);

  // The expanded panel only makes sense for rows on the current page.
  useEffect(() => {
    setExpanded(null);
  }, [page, status, eventType]);

  const total = data?.totalItems ?? 0;
  const pageSize = data?.pageSize ?? 20;
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <div className="sysadmin-page animate-fade-in">
      <PageHeader
        icon="bolt"
        title={t("automation.eventsTitle")}
        subtitle={t("automation.eventsSubtitle")}
      />

      <div className="executive-filter-bar mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-xl">
        <CommonSelect
          value={status}
          onValueChange={(v) => { setStatus(v); setPage(1); }}
          options={[
            { label: t("automation.filterAllStatuses"), value: "" },
            { label: t("automation.statusPending"), value: "Pending" },
            { label: t("automation.statusProcessing"), value: "Processing" },
            { label: t("automation.statusProcessed"), value: "Processed" },
            { label: t("automation.statusFailed"), value: "Failed" },
          ]}
        />
        <CommonSelect
          value={eventType}
          onValueChange={(v) => { setEventType(v); setPage(1); }}
          options={[
            { label: t("automation.filterAllTriggers"), value: "" },
            ...TRIGGER_EVENT_TYPES.map((tr) => ({ label: eventLabel(tr), value: tr })),
          ]}
        />
      </div>

      {loading && !data ? (
        <div className="mt-6">
          <SkeletonGrid count={4} columns={2} />
        </div>
      ) : error ? (
        <div className="mt-6">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : (
        <>
          <div className="mt-4">
            <CommonTable<OutboxEventDto>
              variant="executive"
              data={data?.items ?? []}
              loading={loading}
              keyExtractor={(e) => e.id}
              emptyMessage={t("automation.emptyEvents")}
              emptyIcon="bolt"
              onRowClick={(e) => setExpanded((cur) => (cur === e.id ? null : e.id))}
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
                  key: "eventType",
                  header: t("automation.eventType"),
                  primary: true,
                  renderCell: (e) => <strong>{eventLabel(e.eventType)}</strong>,
                },
                { key: "status", header: t("common.status"), renderCell: (e) => statusBadge(e.status) },
                { key: "occurredAt", header: t("automation.occurredAt"), renderCell: (e) => formatDateTime(e.occurredAt) },
                {
                  key: "processedAt",
                  header: t("automation.processedAt"),
                  hideOnMobile: true,
                  renderCell: (e) => formatDateTime(e.processedAt),
                },
                {
                  key: "id",
                  header: "ID",
                  hideOnMobile: true,
                  renderCell: (e) => <code className="text-[12px]">{shortId(e.id)}</code>,
                },
              ]}
            />
          </div>

          {expanded ? (
            <div className="executive-panel mt-4 p-5">
              {(() => {
                const ev = data?.items.find((e) => e.id === expanded);
                if (!ev) return null;
                return (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-[15px]">{eventLabel(ev.eventType)}</strong>
                      {statusBadge(ev.status)}
                    </div>
                    {ev.errorReason ? (
                      <p className="mt-2 text-[13px] text-[#c50f1b]">{ev.errorReason}</p>
                    ) : null}
                    <JsonDetails label={t("automation.eventPayload")} json={ev.payloadJson} />
                  </>
                );
              })()}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export default EventsScreen;
