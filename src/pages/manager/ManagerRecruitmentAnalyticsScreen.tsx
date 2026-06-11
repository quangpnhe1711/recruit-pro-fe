import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingIndicator from "../../common/components/LoadingIndicator";

import {
  managerService,
  type ManagerRecruitmentAnalyticsDto,
} from "../../services/manager/managerService";

function metricTone(value: number) {
  if (value > 0) return "text-[#b90014] bg-[#ffdad6]";
  if (value < 0) return "text-green-700 bg-green-50";
  return "text-[#5f5e5e] bg-[#f3f3f3]";
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
        { label: "Average Review Cycle", value: "0d", helper: "No completed interview cycles yet", delta: 0, suffix: "%" },
        { label: "Active Candidates", value: "0", helper: "Candidates currently active in pipeline", delta: 0, suffix: "" },
        { label: "Pending Interviews", value: "0", helper: "Upcoming scheduled interviews", delta: 0, suffix: "" },
        { label: "Offer Acceptance", value: "0%", helper: "Accepted from manager review stage", delta: 0, suffix: "%" },
      ];
    }

    return [
      {
        label: "Average Review Cycle",
        value: `${overview.averageReviewCycleDays}d`,
        helper: "Average from application date to latest completed interview",
        delta: overview.averageReviewCycleDeltaPercent,
        suffix: "%",
      },
      {
        label: "Active Candidates",
        value: String(overview.activeCandidates),
        helper: "Distinct candidates still moving through the pipeline",
        delta: overview.activeCandidatesDelta,
        suffix: "",
      },
      {
        label: "Pending Interviews",
        value: String(overview.pendingInterviews),
        helper: "Upcoming interviews waiting to be completed",
        delta: overview.pendingInterviewsDelta,
        suffix: "",
      },
      {
        label: "Offer Acceptance",
        value: `${overview.offerAcceptanceRate}%`,
        helper: "Accepted versus all final-review offer-stage applications",
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
      <div className="mx-auto flex min-h-[60vh] w-full max-w-[1440px] items-center justify-center px-4 py-10 md:px-10">
        <LoadingIndicator label="Loading recruitment analytics..." />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pb-12 pt-10 md:px-10">
      <section className="flex flex-col justify-between gap-6 pb-10 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#1a1c1c]">
            Recruitment Analytics
          </h1>
          <p className="mt-1 text-[16px] leading-6 text-[#5f5e5e]">
            Operational recruiting metrics derived from active jobs, applications, interviews, and department workload.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className="flex items-center gap-2 border border-[#e7bdb8] bg-white px-4 py-2 text-[12px] font-bold tracking-[0.05em] text-[#1a1c1c] transition-colors hover:bg-[#f3f3f3]"
          >
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            Current Snapshot
          </button>
          <button
            type="button"
            className="flex items-center gap-2 border border-[#e7bdb8] bg-white px-4 py-2 text-[12px] font-bold tracking-[0.05em] text-[#1a1c1c] transition-colors hover:bg-[#f3f3f3]"
            onClick={() => navigate("/manager/dashboard")}
          >
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            Back to Dashboard
          </button>
        </div>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-4">
        {summaryCards.map((card, index) => (
          <div key={card.label} className="border border-[#e2dfde] bg-white p-6">
            <div className="mb-4 flex items-start justify-between">
              <span className={`rounded px-2 py-2 ${index === 0 ? "bg-[#cde5ff] text-[#005f93]" : index === 1 ? "bg-[#ffdad6] text-[#b90014]" : index === 2 ? "bg-[#e2dfde] text-[#5f5e5e]" : "bg-green-100 text-green-700"}`}>
                <span className="material-symbols-outlined">
                  {index === 0 ? "schedule" : index === 1 ? "groups" : index === 2 ? "event" : "check_circle"}
                </span>
              </span>
              <span className={`px-2 py-1 text-[12px] font-bold ${metricTone(card.delta)}`}>
                {formatSigned(card.delta, card.suffix)}
              </span>
            </div>
            <h3 className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#5f5e5e]">{card.label}</h3>
            <p className="mt-2 text-[48px] font-bold leading-[56px] tracking-[-0.02em] text-[#1a1c1c]">{card.value}</p>
            <p className="mt-2 text-[12px] text-[#5f5e5e]">{card.helper}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-12 gap-6">
        <div className="col-span-12 flex min-h-[400px] flex-col border border-[#e2dfde] bg-white p-8 lg:col-span-8">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-[20px] font-semibold leading-7 text-[#1a1c1c]">Application vs Completed Interview Trend</h2>
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

        <div className="col-span-12 flex flex-col border border-[#e2dfde] bg-white p-8 lg:col-span-4">
          <h2 className="mb-2 text-[20px] font-semibold leading-7 text-[#1a1c1c]">Conversion Funnel</h2>
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

        <div className="col-span-12 border border-[#e2dfde] bg-white p-8 lg:col-span-6">
          <h2 className="mb-6 text-[20px] font-semibold leading-7 text-[#1a1c1c]">Department Pipeline Performance</h2>
          <table className="w-full">
            <thead>
              <tr className="bg-[#1a1a1a] text-white">
                <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-[0.05em]">Department</th>
                <th className="px-4 py-3 text-right text-[12px] font-semibold uppercase tracking-[0.05em]">Active</th>
                <th className="px-4 py-3 text-right text-[12px] font-semibold uppercase tracking-[0.05em]">Offered</th>
                <th className="px-4 py-3 text-right text-[12px] font-semibold uppercase tracking-[0.05em]">Accepted</th>
                <th className="px-4 py-3 text-right text-[12px] font-semibold uppercase tracking-[0.05em]">Conv %</th>
              </tr>
            </thead>
            <tbody className="text-[14px]">
              {performance.map((item, index) => (
                <tr key={item.departmentName} className={index % 2 === 1 ? "bg-[#f9f9f9]" : "bg-white"}>
                  <td className="px-4 py-4 font-bold text-[#1a1c1c]">{item.departmentName}</td>
                  <td className="px-4 py-4 text-right font-bold">{item.activeApplications}</td>
                  <td className="px-4 py-4 text-right">{item.offeredCandidates}</td>
                  <td className="px-4 py-4 text-right">{item.acceptedCandidates}</td>
                  <td className="px-4 py-4 text-right font-bold text-[#b90014]">{item.conversionPercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="col-span-12 flex flex-col border border-[#e2dfde] bg-white p-8 lg:col-span-6">
          <div className="mb-6">
            <h2 className="text-[20px] font-semibold leading-7 text-[#1a1c1c]">Pipeline Status Distribution</h2>
            <p className="text-[14px] text-[#5f5e5e]">Status mix across review, interview, final review, and accepted stages.</p>
          </div>
          <div className="flex flex-1 items-center gap-12">
            <div className="relative flex h-48 w-48 items-center justify-center rounded-full border-[16px] border-[#b90014]">
              <div className="text-center">
                <span className="text-[32px] font-bold leading-10 text-[#1a1c1c]">{analytics?.distribution.total ?? 0}</span>
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
        <div className="border border-[#e2dfde] bg-white">
          <div className="flex items-center justify-between border-b border-[#e2dfde] px-8 py-6">
            <h2 className="text-[20px] font-semibold leading-7 text-[#1a1c1c]">Departmental Breakdown</h2>
            <button
              type="button"
              className="flex items-center gap-1 text-[12px] font-bold uppercase tracking-[0.05em] text-[#b90014] hover:underline"
              onClick={() => navigate("/manager/dashboard")}
            >
              Open Dashboard
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#1a1a1a] text-white">
                  <th className="px-8 py-3 text-left text-[12px] font-semibold uppercase tracking-[0.05em]">Department</th>
                  <th className="px-8 py-3 text-right text-[12px] font-semibold uppercase tracking-[0.05em]">Open Roles</th>
                  <th className="px-8 py-3 text-right text-[12px] font-semibold uppercase tracking-[0.05em]">Avg Review Cycle</th>
                  <th className="px-8 py-3 text-right text-[12px] font-semibold uppercase tracking-[0.05em]">Active Pipeline</th>
                  <th className="px-8 py-3 text-left text-[12px] font-semibold uppercase tracking-[0.05em]">Recruiter</th>
                </tr>
              </thead>
              <tbody className="text-[14px]">
                {breakdown.map((item, index) => (
                  <tr key={item.departmentName} className={index % 2 === 1 ? "bg-[#f9f9f9]" : "bg-white"}>
                    <td className="px-8 py-4 font-bold">{item.departmentName}</td>
                    <td className="px-8 py-4 text-right">{item.openRoles}</td>
                    <td className={`px-8 py-4 text-right font-bold ${item.averageReviewCycleDays >= 20 ? "text-[#b90014]" : "text-green-700"}`}>
                      {item.averageReviewCycleDays > 0 ? `${item.averageReviewCycleDays} Days` : "N/A"}
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="material-symbols-outlined text-[18px] text-[#005f93]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          groups
                        </span>
                        {item.activePipeline}
                      </div>
                    </td>
                    <td className="px-8 py-4">{item.recruiterName}</td>
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
