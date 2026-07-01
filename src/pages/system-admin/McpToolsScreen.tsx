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
        eyebrow="Công cụ nội bộ cho Automation/AI"
        icon="hub"
        title="MCP Tools"
        subtitle="Danh mục công cụ nội bộ (chỉ đọc), gọi qua application service và tuân thủ quyền sở hữu. Mọi lệnh gọi đều được ghi audit."
        actions={
          <Link to="/system-admin/mcp/audits" className="btn btn-secondary">
            Nhật ký audit
          </Link>
        }
      />

      <div className="mt-6 card border-[#e3ddf5] bg-[#f7f4fe] p-5">
        <p className="flex items-center gap-2 text-[14px] font-semibold text-[#5b3fb0]">
          <span className="material-symbols-outlined text-[20px]">shield</span>
          Đây là màn hình nâng cao / nội bộ
        </p>
        <p className="mt-2 text-[13px] leading-6 text-[#5f5e5e]">
          MCP Tools là danh sách công cụ nội bộ mà workflow hoặc AI có thể gọi một cách có kiểm
          soát. Mỗi lần gọi đều được kiểm tra quyền và ghi audit. Người dùng tuyển dụng thông
          thường không dùng màn này. Ví dụ:{" "}
          <code className="text-[12px]">jobs.search</code> (tìm job),{" "}
          <code className="text-[12px]">applications.get</code> (đọc hồ sơ),{" "}
          <code className="text-[12px]">applications.get_fit_analysis</code> (độ phù hợp),{" "}
          <code className="text-[12px]">interviews.get_schedule</code> (lịch phỏng vấn),{" "}
          <code className="text-[12px]">analytics.get_funnel_summary</code> (số liệu funnel).
        </p>
        <p className="mt-2 text-[12.5px] leading-6 text-[#8a8786]">
          Audit cho biết tool nào được gọi, ai gọi, có được phép không, mất bao lâu, và output tóm
          tắt là gì.
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
