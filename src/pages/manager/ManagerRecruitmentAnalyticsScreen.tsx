import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import EmptyState from "../../common/components/EmptyState";
import PageHeader from "../../common/components/PageHeader";
import { Skeleton, SkeletonCard } from "../../common/components/Skeleton";

import {
  managerService,
  type ManagerRecruitmentAnalyticsDto,
} from "../../services/manager/managerService";

function metricTone(value: number) {
  if (value > 0) return "text-[#b90014] bg-[#fff1f0]";
  if (value < 0) return "text-emerald-700 bg-emerald-50";
  return "text-[#5f5e5e] bg-[#f2efed]";
}

function distributionColor(colorToken: string) {
  switch (colorToken) {
    case "primary":
      return "bg-[#b90014]";
    case "tertiary":
      return "bg-[#005f93]";
    case "secondary":
      return "bg-[#926e6b]";
    default:
      return "bg-[#e2e2e2]";
  }
}

function formatSigned(value: number, suffix = "") {
  if (value > 0) return `+${value}${suffix}`;
  return `${value}${suffix}`;
}

function ManagerRecruitmentAnalyticsScreen() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<ManagerRecruitmentAnalyticsDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadAnalytics() {
      setLoading(true);

      try {
        const response = await managerService.getRecruitmentAnalytics();
        if (!mounted) return;
        setAnalytics(response.data ?? null);
      } catch {
        if (!mounted) return;
        setAnalytics(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadAnalytics();

    return () => {
      mounted = false;
    };
  }, []);

  const summaryCards = useMemo(() => {
    const overview = analytics?.overview;
    if (!overview) {
      return [
        { label: "Chu kỳ duyệt TB", value: "0d", helper: "Chưa có đủ dữ liệu", delta: 0, suffix: "%" },
        { label: "Ứng viên đang xử lý", value: "0", helper: "Đang ở trong pipeline", delta: 0, suffix: "" },
        { label: "Phỏng vấn chờ tới", value: "0", helper: "Lịch phỏng vấn sắp diễn ra", delta: 0, suffix: "" },
        { label: "Tỷ lệ nhận offer", value: "0%", helper: "Tính từ hồ sơ ở giai đoạn offer", delta: 0, suffix: "%" },
      ];
    }

    return [
      {
        label: "Chu kỳ duyệt TB",
        value: `${overview.averageReviewCycleDays}d`,
        helper: "Average from application date to latest completed interview",
        delta: overview.averageReviewCycleDeltaPercent,
        suffix: "%",
      },
      {
        label: "Ứng viên đang xử lý",
        value: String(overview.activeCandidates),
        helper: "Distinct candidates still moving through the pipeline",
        delta: overview.activeCandidatesDelta,
        suffix: "",
      },
      {
        label: "Phỏng vấn chờ tới",
        value: String(overview.pendingInterviews),
        helper: "Upcoming interviews waiting to be completed",
        delta: overview.pendingInterviewsDelta,
        suffix: "",
      },
      {
        label: "Tỷ lệ nhận offer",
        value: `${overview.offerAcceptanceRate}%`,
        helper: "Accepted versus all offer-stage applications",
        delta: overview.offerAcceptanceDeltaPercent,
        suffix: "%",
      },
    ];
  }, [analytics]);

  const trendMax = Math.max(
    ...(analytics?.trend.applications ?? [0]),
    ...(analytics?.trend.completedInterviews ?? [0]),
    1,
  );

  const funnel = analytics?.funnel ?? [];
  const distributionItems = analytics?.distribution.items ?? [];
  const breakdown = analytics?.departmentBreakdown ?? [];
  const performance = analytics?.departmentPerformance ?? [];

  if (loading) {
    return (
      <div className="app-container space-y-6 py-8">
        <div className="space-y-3">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-12 gap-6">
          <div className="surface-card col-span-12 h-96 lg:col-span-8" />
          <div className="surface-card col-span-12 h-96 lg:col-span-4" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="app-container py-10">
        <div className="surface-card p-10">
          <EmptyState
            icon="bar_chart"
            title="Phân tích tuyển dụng"
            description="Không thể tải dữ liệu phân tích. Vui lòng thử lại."
          />
        </div>
      </div>
    );
  }

  const cardIcons = ["schedule", "groups", "event", "verified"];
  const cardWraps = [
    "from-sky-50 to-sky-100 text-sky-600",
    "from-[#fff1f0] to-[#ffdad6] text-[#b90014]",
    "from-[#f2efed] to-[#e8e4e1] text-[#5f5e5e]",
    "from-emerald-50 to-emerald-100 text-emerald-600",
  ];

  return (
    <div className="app-container animate-fade-in py-8">
      <PageHeader
        className="mb-7"
        eyebrow="Phân tích"
        icon="monitoring"
        title="Phân tích tuyển dụng"
        subtitle="Theo dõi hiệu suất tuyển dụng từ job, hồ sơ, phỏng vấn và tải công việc theo phòng ban."
        actions={
          <>
            <button type="button" className="btn btn-secondary">
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              Dữ liệu hiện tại
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate("/manager/dashboard")}
            >
              <span className="material-symbols-outlined text-[18px]">dashboard</span>
              Về bảng điều khiển
            </button>
          </>
        }
      />

      <section className="stagger mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card, index) => (
          <div key={card.label} className="stat-card group">
            <div className="mb-4 flex items-start justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-[14px] bg-gradient-to-br ${cardWraps[index]} transition-transform duration-200 group-hover:scale-105`}>
                <span className="material-symbols-outlined">{cardIcons[index]}</span>
              </div>
              <span className={`badge ${metricTone(card.delta)}`}>
                {formatSigned(card.delta, card.suffix)}
              </span>
            </div>
            <p className="eyebrow">{card.label}</p>
            <p className="mt-2 text-[40px] font-bold leading-none tracking-[-0.02em] text-[#1a1c1c]">{card.value}</p>
            <p className="mt-2 text-[12px] leading-5 text-[#5f5e5e]">{card.helper}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-12 gap-6">
        <div className="card col-span-12 flex min-h-[400px] flex-col p-6 lg:col-span-8">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="section-title">Application vs Completed Interview Trend</h2>
              <p className="text-[14px] text-[#5f5e5e]">Monthly movement across the current six-month operating window.</p>
            </div>
            <div className="flex gap-4">
              <span className="flex items-center gap-1 text-[12px] font-bold text-[#b90014]">
                <span className="h-3 w-3 rounded-full bg-[#b90014]" />
                Applications
              </span>
              <span className="flex items-center gap-1 text-[12px] font-bold text-[#005f93]">
                <span className="h-3 w-3 rounded-full bg-[#005f93]" />
                Completed Interviews
              </span>
            </div>
          </div>
          <div className="flex flex-1 items-end gap-6 pb-8">
            {(analytics?.trend.labels ?? []).map((label, index) => {
              const applicationHeight = (((analytics?.trend.applications[index] ?? 0) / trendMax) * 100).toFixed(0);
              const interviewHeight = (((analytics?.trend.completedInterviews[index] ?? 0) / trendMax) * 100).toFixed(0);

              return (
                <div key={label} className="flex flex-1 flex-col justify-end gap-3">
                  <div className="flex h-[260px] items-end gap-2">
                    <div className="w-1/2 bg-[#b90014]/70" style={{ height: `${applicationHeight}%` }} />
                    <div className="w-1/2 bg-[#005f93]/70" style={{ height: `${interviewHeight}%` }} />
                  </div>
                  <span className="text-center font-mono text-[12px] text-[#5f5e5e]">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card col-span-12 flex flex-col p-6 lg:col-span-4">
          <h2 className="section-title mb-2">Conversion Funnel</h2>
          <p className="mb-8 text-[14px] text-[#5f5e5e]">Pipeline conversion based on actual application statuses.</p>
          <div className="space-y-6">
            {funnel.map((item, index) => (
              <div key={item.label}>
                <div className="mb-1 flex justify-between text-[12px] font-bold uppercase tracking-[0.05em]">
                  <span>{item.label}</span>
                  <span>
                    {item.count}
                    {index > 0 ? <span className="ml-2 font-normal text-[#5f5e5e]">{item.percentFromApplied}%</span> : null}
                  </span>
                </div>
                <div
                  className="h-8 bg-[#b90014]"
                  style={{ width: `${Math.max(item.percentFromApplied, index === 0 ? 100 : 8)}%`, opacity: `${1 - index * 0.15}` }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="card col-span-12 overflow-hidden p-6 lg:col-span-6">
          <h2 className="section-title mb-5">Department Pipeline Performance</h2>
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full min-w-[440px]">
              <thead>
                <tr className="border-b border-[#ececec] text-left">
                  <th className="px-2 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#8a8786]">Department</th>
                  <th className="px-2 py-3 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-[#8a8786]">Active</th>
                  <th className="px-2 py-3 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-[#8a8786]">Offer</th>
                  <th className="px-2 py-3 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-[#8a8786]">Hired</th>
                  <th className="px-2 py-3 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-[#8a8786]">Conv %</th>
                </tr>
              </thead>
              <tbody className="text-[14px]">
                {performance.map((item) => (
                  <tr key={item.departmentName} className="border-b border-[#f0eceb] last:border-0 transition-colors hover:bg-[#faf9f8]">
                    <td className="px-2 py-3.5 font-semibold text-[#1a1c1c]">{item.departmentName}</td>
                    <td className="px-2 py-3.5 text-right font-bold text-[#1a1c1c]">{item.activeApplications}</td>
                    <td className="px-2 py-3.5 text-right text-[#5f5e5e]">{item.offeredCandidates}</td>
                    <td className="px-2 py-3.5 text-right text-[#5f5e5e]">{item.acceptedCandidates}</td>
                    <td className="px-2 py-3.5 text-right font-bold text-[#b90014]">{item.conversionPercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card col-span-12 flex flex-col p-6 lg:col-span-6">
          <div className="mb-6">
            <h2 className="section-title">Pipeline Status Distribution</h2>
            <p className="text-[14px] text-[#5f5e5e]">Status mix across HR screening, manager review, interview, offer, and hired stages.</p>
          </div>
          <div className="flex flex-1 items-center gap-12">
            <div className="relative flex h-48 w-48 items-center justify-center rounded-full border-[16px] border-[#b90014]">
              <div className="text-center">
                <span className="text-[32px] font-bold leading-10 text-[#1a1c1c]">{analytics.distribution.total}</span>
                <span className="block text-[12px] text-[#5f5e5e]">TOTAL ACTIVE</span>
              </div>
            </div>
            <div className="flex-1 space-y-4">
              {distributionItems.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className={`h-3 w-3 rounded-sm ${distributionColor(item.colorToken)}`} />
                  <div className="flex flex-1 justify-between border-b border-dashed border-[#e2dfde] pb-1">
                    <span className="text-[12px] font-bold uppercase tracking-[0.05em]">{item.label}</span>
                    <span className="text-[12px] font-bold">{item.percent}% ({item.count})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#f0eceb] px-5 py-4">
            <h2 className="section-title">Departmental Breakdown</h2>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#b90014] transition-colors hover:gap-1.5"
              onClick={() => navigate("/manager/dashboard")}
            >
              Open Dashboard
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-[#ececec] text-left">
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#8a8786]">Department</th>
                  <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-[#8a8786]">Open Roles</th>
                  <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-[#8a8786]">Avg Review Cycle</th>
                  <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-[#8a8786]">Active Pipeline</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-[#8a8786]">Recruiter</th>
                </tr>
              </thead>
              <tbody className="text-[14px]">
                {breakdown.map((item) => (
                  <tr key={item.departmentName} className="border-b border-[#f0eceb] last:border-0 transition-colors hover:bg-[#faf9f8]">
                    <td className="px-5 py-3.5 font-semibold text-[#1a1c1c]">{item.departmentName}</td>
                    <td className="px-5 py-3.5 text-right text-[#5f5e5e]">{item.openRoles}</td>
                    <td className={`px-5 py-3.5 text-right font-bold ${item.averageReviewCycleDays >= 20 ? "text-[#b90014]" : "text-emerald-700"}`}>
                      {item.averageReviewCycleDays > 0 ? `${item.averageReviewCycleDays} Days` : "N/A"}
                    </td>
                    <td className="px-5 py-3.5 text-right text-[#1a1c1c]">
                      <div className="flex items-center justify-end gap-1">
                        <span className="material-symbols-outlined text-[18px] text-sky-600" style={{ fontVariationSettings: "'FILL' 1" }}>
                          groups
                        </span>
                        {item.activePipeline}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#5f5e5e]">{item.recruiterName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ManagerRecruitmentAnalyticsScreen;
