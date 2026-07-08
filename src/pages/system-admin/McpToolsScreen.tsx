import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../common/components/PageHeader";
import Badge from "../../common/components/Badge";
import { SkeletonGrid } from "../../common/components/Skeleton";
import EmptyState from "../../common/components/EmptyState";
import { listTools, testTool } from "../../services/system-admin/mcpService";
import type { McpToolDto, McpToolResult } from "../../modules/system-admin/automationSchema";
import { useI18n } from "../../i18n";
import { handleNonFormApiError } from "../../common/utils/appToast";
import { ConfirmModal, ErrorState, formatDateTime, JsonDetails } from "./automationUi";

function McpToolsScreen() {
  const { t } = useI18n();
  const [tools, setTools] = useState<McpToolDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState<McpToolDto | null>(null);
  const [inputJson, setInputJson] = useState("{}");
  const [result, setResult] = useState<McpToolResult | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listTools()
      .then(setTools)
      .catch(() => setError(t("common.loadFailed")))
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => load(), [load]);

  const runTest = async () => {
    if (!testing || busy) return;
    setBusy(true);
    setResult(null);
    try {
      const r = await testTool(testing.name, inputJson);
      setResult(r);
      // Refresh "last called" timestamps in the catalog behind the modal.
      listTools().then(setTools).catch(() => {});
    } catch (err) {
      handleNonFormApiError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sysadmin-page animate-fade-in">
      <PageHeader
        icon="hub"
        title={t("automation.mcpToolsTitle")}
        subtitle={t("automation.mcpToolsSubtitle")}
        actions={
          <Link to="/system-admin/mcp/audits" className="btn btn-secondary">
            {t("automation.mcpAuditTitle")}
          </Link>
        }
      />

      <div className="executive-section mt-6 border-[#eadfdb] bg-[#fff8f6] p-4">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-[#b90014]">
          <span className="material-symbols-outlined text-[18px]">shield</span>
          {t("automation.mcpAdvancedTitle")}
        </p>
        <p className="mt-1.5 text-[13px] leading-6 text-[#5f5e5e]">
          {t("automation.mcpAdvancedBody")}
        </p>
      </div>

      {loading ? (
        <div className="mt-6">
          <SkeletonGrid count={6} columns={3} />
        </div>
      ) : error ? (
        <div className="mt-6">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : tools.length === 0 ? (
        <div className="executive-section mt-6">
          <EmptyState icon="hub" title={t("automation.emptyMcpTools")} />
        </div>
      ) : (
        <div className="stagger mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <div key={tool.name} className="executive-section flex flex-col p-5">
              <div className="flex items-start justify-between">
                <code className="text-[14px] font-semibold text-[#1a1c1c]">{tool.name}</code>
                <Badge tone={tool.access === "read" ? "info" : "warning"}>
                  {tool.access === "read" ? t("automation.readAccess") : t("automation.writeAccess")}
                </Badge>
              </div>
              <p className="mt-2 flex-1 text-[13px] text-[#5f5e5e]">{tool.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {tool.permissionsRequired.map((p) => (
                  <Badge key={p} tone="neutral">
                    {p}
                  </Badge>
                ))}
              </div>
              <p className="mt-3 text-[12px] text-[#a8a4a2]">
                {t("automation.lastCalled")}: {formatDateTime(tool.lastCalledAt)}
              </p>
              <button
                type="button"
                className="btn btn-secondary mt-3"
                onClick={() => {
                  setTesting(tool);
                  setInputJson("{}");
                  setResult(null);
                }}
              >
                {t("automation.testRun")}
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!testing}
        title={`${t("automation.testRun")}: ${testing?.name ?? ""}`}
        confirmLabel={t("automation.invokeTool")}
        busy={busy}
        onConfirm={runTest}
        onClose={() => setTesting(null)}
      >
        <label className="field-label">{t("automation.inputParams")}</label>
        <textarea className="input-field font-mono text-[13px]" rows={3} value={inputJson} onChange={(e) => setInputJson(e.target.value)} />
        {result ? (
          <div className="mt-3">
            <Badge tone={result.allowed ? "success" : "danger"}>
              {result.allowed ? t("automation.allowed") : t("automation.denied")}
            </Badge>
            {result.deniedReason ? <p className="mt-2 text-[13px] text-rose-600">{result.deniedReason}</p> : null}
            <JsonDetails label={t("automation.resultSummary")} json={JSON.stringify(result.output ?? {})} />
          </div>
        ) : null}
      </ConfirmModal>
    </div>
  );
}

export default McpToolsScreen;
