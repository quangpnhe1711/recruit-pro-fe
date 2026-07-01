import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../common/components/PageHeader";
import CommonTable from "../../common/components/CommonTable";
import CommonSelect from "../../common/components/CommonSelect";
import Badge from "../../common/components/Badge";
import { listAudits } from "../../services/system-admin/mcpService";
import type { McpAuditDto, Paginated } from "../../modules/system-admin/automationSchema";
import { ErrorState, formatDateTime, JsonDetails } from "./automationUi";

function McpAuditScreen() {
  const [page, setPage] = useState(1);
  const [allowed, setAllowed] = useState("");
  const [data, setData] = useState<Paginated<McpAuditDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listAudits({
      allowed: allowed === "" ? undefined : allowed === "true",
      page,
      pageSize: 20,
    })
      .then(setData)
      .catch(() => setError("Không tải được nhật ký audit MCP."))
      .finally(() => setLoading(false));
  }, [allowed, page]);

  useEffect(() => load(), [load]);

  const total = data?.totalItems ?? 0;
  const pageSize = data?.pageSize ?? 20;
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <div className="app-container animate-fade-in py-8">
      <PageHeader
        eyebrow="MCP"
        icon="fact_check"
        title="Nhật ký audit MCP"
        subtitle="Mọi lệnh gọi công cụ (được phép và bị từ chối) đều được ghi lại kèm độ trễ và tóm tắt kết quả."
        actions={
          <Link to="/system-admin/mcp/tools" className="btn btn-secondary">
            Danh mục công cụ
          </Link>
        }
      />

      <div className="mt-5 max-w-xs">
        <CommonSelect
          value={allowed}
          onValueChange={(v) => { setAllowed(v); setPage(1); }}
          options={[
            { label: "Tất cả", value: "" },
            { label: "Được phép", value: "true" },
            { label: "Bị từ chối", value: "false" },
          ]}
        />
      </div>

      {error ? (
        <div className="mt-6">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : (
        <div className="mt-4">
          <CommonTable<McpAuditDto>
            data={data?.items ?? []}
            loading={loading}
            keyExtractor={(a) => a.id}
            emptyMessage="Chưa có bản ghi audit"
            emptyIcon="fact_check"
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
              { key: "toolName", header: "Công cụ", primary: true, renderCell: (a) => <code className="text-[13px]">{a.toolName}</code> },
              { key: "callerUserId", header: "Người gọi", hideOnMobile: true, renderCell: (a) => <span className="text-[12px]">{a.callerUserId ?? "—"}</span> },
              { key: "allowed", header: "Kết quả", renderCell: (a) => <Badge tone={a.allowed ? "success" : "danger"}>{a.allowed ? "Được phép" : "Bị từ chối"}</Badge> },
              { key: "latencyMs", header: "Độ trễ", renderCell: (a) => (a.latencyMs != null ? `${a.latencyMs} ms` : "—") },
              { key: "createdAt", header: "Thời gian", renderCell: (a) => formatDateTime(a.createdAt) },
              { key: "deniedReason", header: "Lý do từ chối", hideOnMobile: true, renderCell: (a) => <span className="text-[13px] text-rose-600">{a.deniedReason ?? ""}</span> },
              {
                key: "output",
                header: "Tóm tắt",
                isAction: true,
                renderCell: (a) => <JsonDetails label="Chi tiết" json={a.outputSummaryJson ?? a.inputJson} />,
              },
            ]}
          />
        </div>
      )}
    </div>
  );
}

export default McpAuditScreen;
