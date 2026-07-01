import { useCallback, useEffect, useState } from "react";
import PageHeader from "../../common/components/PageHeader";
import CommonTable from "../../common/components/CommonTable";
import { SkeletonGrid } from "../../common/components/Skeleton";
import { listEvents } from "../../services/system-admin/automationService";
import type { OutboxEventDto, Paginated } from "../../modules/system-admin/automationSchema";
import { ErrorState, eventLabel, formatDateTime, JsonDetails, shortId, statusBadge } from "./automationUi";

function EventsScreen() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<OutboxEventDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listEvents({ page, pageSize: 20 })
      .then(setData)
      .catch(() => setError("Không tải được danh sách sự kiện."))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => load(), [load]);

  return (
    <div className="app-container animate-fade-in py-8">
      <PageHeader
        eyebrow="SystemAdmin"
        icon="bolt"
        title="Sự kiện nghiệp vụ (outbox)"
        subtitle="Các sự kiện bền vững sinh ra từ thao tác nghiệp vụ. Workflow xử lý các sự kiện Pending này."
      />

      {loading ? (
        <div className="mt-6">
          <SkeletonGrid count={4} columns={2} />
        </div>
      ) : error ? (
        <div className="mt-6">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : data ? (
        <>
          <div className="mt-6">
            <CommonTable<OutboxEventDto>
              data={data.items}
              keyExtractor={(e) => e.id}
              emptyMessage="Chưa có sự kiện nào. Hãy thực hiện một thao tác nghiệp vụ (ví dụ Pass CV)."
              onRowClick={(e) => setExpanded((cur) => (cur === e.id ? null : e.id))}
              columns={[
                {
                  key: "eventType",
                  header: "Sự kiện",
                  primary: true,
                  renderCell: (e) => <strong>{eventLabel(e.eventType)}</strong>,
                },
                { key: "status", header: "Trạng thái", renderCell: (e) => statusBadge(e.status) },
                { key: "occurredAt", header: "Thời điểm", renderCell: (e) => formatDateTime(e.occurredAt) },
                {
                  key: "processedAt",
                  header: "Đã xử lý",
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
            <div className="mt-4 card p-5">
              {(() => {
                const ev = data.items.find((e) => e.id === expanded);
                if (!ev) return null;
                return (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-[15px]">{eventLabel(ev.eventType)}</strong>
                      {statusBadge(ev.status)}
                    </div>
                    {ev.errorReason ? (
                      <p className="mt-2 text-[13px] text-[#c50f1b]">Lỗi: {ev.errorReason}</p>
                    ) : null}
                    <JsonDetails label="Payload sự kiện (kỹ thuật)" json={ev.payloadJson} />
                  </>
                );
              })()}
            </div>
          ) : null}

          <div className="mt-5 flex items-center justify-between">
            <p className="text-[13px] text-[#8a8786]">
              Trang {data.currentPage}/{Math.max(1, data.totalPages)} · {data.totalItems} sự kiện
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Trước
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default EventsScreen;
