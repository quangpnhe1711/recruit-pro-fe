import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../../common/components/PageHeader";
import CommonTable from "../../common/components/CommonTable";
import { SkeletonGrid } from "../../common/components/Skeleton";
import { getDashboard } from "../../services/system-admin/automationService";
import type { AutomationDashboardDto, ExecutionSummaryDto } from "../../modules/system-admin/automationSchema";
import { ErrorState, eventLabel, formatDateTime, modeBadge, shortId, statusBadge } from "./automationUi";

const STAT_DEFS: { key: keyof AutomationDashboardDto; label: string; icon: string; tone: string }[] = [
  { key: "totalWorkflows", label: "Tổng workflow", icon: "account_tree", tone: "#b90014" },
  { key: "enabledWorkflows", label: "Đang bật", icon: "toggle_on", tone: "#059669" },
  { key: "executionsToday", label: "Thực thi hôm nay", icon: "play_circle", tone: "#0284c7" },
  { key: "failedExecutions", label: "Thực thi thất bại", icon: "error", tone: "#e11d48" },
  { key: "deadLetterCount", label: "Dead-letter", icon: "report", tone: "#d97706" },
];

function AutomationDashboardScreen() {
  const navigate = useNavigate();
  const [data, setData] = useState<AutomationDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getDashboard()
      .then(setData)
      .catch(() => setError("Không tải được dữ liệu bảng điều khiển tự động hóa."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);

  return (
    <div className="app-container animate-fade-in py-8">
      <PageHeader
        eyebrow="SystemAdmin"
        icon="account_tree"
        title="Tự động hóa tuyển dụng"
        subtitle="Trigger → Điều kiện → Hành động → Nhật ký thực thi. Deterministic-first, AI là tùy chọn."
        actions={
          <>
            <Link to="/system-admin/automation/workflows" className="btn btn-secondary">
              Danh sách workflow
            </Link>
            <Link to="/system-admin/automation/executions" className="btn btn-primary">
              Lịch sử thực thi
            </Link>
          </>
        }
      />

      {loading ? (
        <div className="mt-6">
          <SkeletonGrid count={5} columns={5} />
        </div>
      ) : error ? (
        <div className="mt-6">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : data ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {STAT_DEFS.map((s) => (
              <div key={s.key} className="card p-5">
                <div className="flex items-start justify-between">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: `${s.tone}14`, color: s.tone }}
                  >
                    <span className="material-symbols-outlined text-[22px]">{s.icon}</span>
                  </span>
                </div>
                <p className="mt-3 text-[28px] font-bold text-[#1a1c1c]">{data[s.key] as number}</p>
                <p className="text-[13px] text-[#5f5e5e]">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 card p-5">
            <p className="text-[13px] text-[#5f5e5e]">Hành động lỗi phổ biến nhất</p>
            <p className="mt-1 text-[15px] font-semibold text-[#1a1c1c]" data-testid="most-common-failed">
              {data.mostCommonFailedAction ?? "Không có"}
            </p>
          </div>

          <div className="mt-6">
            <h2 className="mb-3 text-[16px] font-semibold text-[#1a1c1c]">Thực thi gần đây</h2>
            <CommonTable<ExecutionSummaryDto>
              data={data.recentExecutions}
              keyExtractor={(e) => e.id}
              emptyMessage="Chưa có lần thực thi nào"
              onRowClick={(e) => navigate(`/system-admin/automation/executions/${e.id}`)}
              columns={[
                { key: "workflowName", header: "Workflow", primary: true, renderCell: (e) => <strong>{e.workflowName}</strong> },
                { key: "eventType", header: "Sự kiện", renderCell: (e) => eventLabel(e.eventType) },
                { key: "mode", header: "Chế độ chạy", renderCell: (e) => modeBadge(e.mode) },
                { key: "status", header: "Trạng thái", renderCell: (e) => statusBadge(e.status) },
                { key: "createdAt", header: "Thời gian", renderCell: (e) => formatDateTime(e.createdAt) },
                { key: "id", header: "ID", hideOnMobile: true, renderCell: (e) => <code className="text-[12px]">{shortId(e.id)}</code> },
              ]}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

export default AutomationDashboardScreen;
