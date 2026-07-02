import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../common/components/PageHeader";
import CommonTable from "../../common/components/CommonTable";
import CommonSelect from "../../common/components/CommonSelect";
import Badge from "../../common/components/Badge";
import { listAudits } from "../../services/system-admin/mcpService";
import type { McpAuditDto, Paginated } from "../../modules/system-admin/automationSchema";
import { useI18n } from "../../i18n";
import { ErrorState, formatDateTime, JsonDetails } from "./automationUi";

function McpAuditScreen() {
  const { t } = useI18n();
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
      .catch(() => setError(t("common.loadFailed")))
      .finally(() => setLoading(false));
  }, [allowed, page, t]);

  useEffect(() => load(), [load]);

  const total = data?.totalItems ?? 0;
  const pageSize = data?.pageSize ?? 20;
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <div className="sysadmin-page animate-fade-in">
      <PageHeader
        icon="fact_check"
        title={t("automation.mcpAuditTitle")}
        subtitle={t("automation.mcpAuditSubtitle")}
        actions={
          <Link to="/system-admin/mcp/tools" className="btn btn-secondary">
            {t("automation.mcpToolsTitle")}
          </Link>
        }
      />

      <div className="executive-filter-bar mt-5 max-w-xs">
        <CommonSelect
          value={allowed}
          onValueChange={(v) => { setAllowed(v); setPage(1); }}
          options={[
            { label: t("common.all"), value: "" },
            { label: t("automation.allowed"), value: "true" },
            { label: t("automation.denied"), value: "false" },
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
            variant="executive"
            data={data?.items ?? []}
            loading={loading}
            keyExtractor={(a) => a.id}
            emptyMessage={t("automation.emptyMcpAudit")}
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
              {
                key: "toolName",
                header: t("automation.toolName"),
                primary: true,
                renderCell: (a) => <code className="text-[13px]">{a.toolName}</code>,
              },
              {
                key: "callerUserId",
                header: t("automation.caller"),
                hideOnMobile: true,
                renderCell: (a) => <span className="text-[12px]">{a.callerUserId ?? "-"}</span>,
              },
              {
                key: "allowed",
                header: t("automation.lastResult"),
                renderCell: (a) => (
                  <Badge tone={a.allowed ? "success" : "danger"}>
                    {a.allowed ? t("automation.allowed") : t("automation.denied")}
                  </Badge>
                ),
              },
              {
                key: "latencyMs",
                header: t("automation.latency"),
                renderCell: (a) => (a.latencyMs != null ? `${a.latencyMs} ms` : "-"),
              },
              { key: "createdAt", header: t("automation.invokedAt"), renderCell: (a) => formatDateTime(a.createdAt) },
              {
                key: "deniedReason",
                header: t("automation.deniedReason"),
                hideOnMobile: true,
                renderCell: (a) => <span className="text-[13px] text-rose-600">{a.deniedReason ?? ""}</span>,
              },
              {
                key: "output",
                header: t("automation.resultSummary"),
                isAction: true,
                renderCell: (a) => <JsonDetails label={t("common.viewDetail")} json={a.outputSummaryJson ?? a.inputJson} />,
              },
            ]}
          />
        </div>
      )}
    </div>
  );
}

export default McpAuditScreen;
