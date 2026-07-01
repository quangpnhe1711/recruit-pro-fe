import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../../common/components/PageHeader";
import Badge from "../../common/components/Badge";
import { SkeletonGrid } from "../../common/components/Skeleton";
import EmptyState from "../../common/components/EmptyState";
import { listTools, testTool } from "../../services/system-admin/mcpService";
import type { McpToolDto, McpToolResult } from "../../modules/system-admin/automationSchema";
import { ConfirmModal, ErrorState, formatDateTime, JsonDetails } from "./automationUi";

function McpToolsScreen() {
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
      .catch(() => setError("Không tải được danh mục công cụ MCP."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);

  const runTest = async () => {
    if (!testing) return;
    setBusy(true);
    setResult(null);
    try {
      const r = await testTool(testing.name, inputJson);
      setResult(r);
    } catch {
      toast.error("Gọi công cụ thất bại.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app-container animate-fade-in py-8">
      <PageHeader
        eyebrow="MCP"
        icon="hub"
        title="Danh mục công cụ MCP"
        subtitle="Bộ công cụ nội bộ (chỉ đọc), gọi qua application service và tuân thủ quyền sở hữu. Mọi lệnh gọi đều được ghi audit."
        actions={
          <Link to="/system-admin/mcp/audits" className="btn btn-secondary">
            Nhật ký audit
          </Link>
        }
      />

      {loading ? (
        <div className="mt-6">
          <SkeletonGrid count={6} columns={3} />
        </div>
      ) : error ? (
        <div className="mt-6">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : tools.length === 0 ? (
        <div className="mt-6 card">
          <EmptyState icon="hub" title="Chưa có công cụ MCP" />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((t) => (
            <div key={t.name} className="card flex flex-col p-5">
              <div className="flex items-start justify-between">
                <code className="text-[14px] font-semibold text-[#1a1c1c]">{t.name}</code>
                <Badge tone={t.access === "read" ? "info" : "warning"}>{t.access === "read" ? "Chỉ đọc" : "Ghi"}</Badge>
              </div>
              <p className="mt-2 flex-1 text-[13px] text-[#5f5e5e]">{t.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {t.permissionsRequired.map((p) => (
                  <Badge key={p} tone="neutral">
                    {p}
                  </Badge>
                ))}
              </div>
              <p className="mt-3 text-[12px] text-[#a8a4a2]">Gọi gần nhất: {formatDateTime(t.lastCalledAt)}</p>
              <button
                type="button"
                className="btn btn-secondary mt-3"
                onClick={() => {
                  setTesting(t);
                  setInputJson("{}");
                  setResult(null);
                }}
              >
                Chạy thử
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!testing}
        title={`Chạy thử: ${testing?.name ?? ""}`}
        confirmLabel="Gọi công cụ"
        busy={busy}
        onConfirm={runTest}
        onClose={() => setTesting(null)}
      >
        <label className="field-label">Tham số đầu vào (JSON)</label>
        <textarea className="input-field font-mono text-[13px]" rows={3} value={inputJson} onChange={(e) => setInputJson(e.target.value)} />
        {result ? (
          <div className="mt-3">
            <Badge tone={result.allowed ? "success" : "danger"}>{result.allowed ? "Được phép" : "Bị từ chối"}</Badge>
            {result.deniedReason ? <p className="mt-2 text-[13px] text-rose-600">{result.deniedReason}</p> : null}
            <JsonDetails label="Kết quả (tóm tắt)" json={JSON.stringify(result.output ?? {})} />
          </div>
        ) : null}
      </ConfirmModal>
    </div>
  );
}

export default McpToolsScreen;
