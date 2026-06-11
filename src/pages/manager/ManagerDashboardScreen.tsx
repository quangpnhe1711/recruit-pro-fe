import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingIndicator from "../../common/components/LoadingIndicator";
import { managerService, type ManagerDashboardDto } from "../../services/manager/managerService";

function statusChipTone(status: string) {
  switch (status.toLowerCase()) {
    case "managerreview":
      return "bg-[#b90014]/10 text-[#b90014]";
    case "reviewing":
      return "bg-amber-100 text-amber-800";
    case "interviewing":
      return "bg-[#005f93]/10 text-[#005f93]";
    default:
      return "bg-[#e2dfde] text-[#636262]";
  }
}

function ManagerDashboardScreen() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<ManagerDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      setLoading(true);

      try {
        const response = await managerService.getDashboard();
        if (!mounted) return;
        setDashboard(response.data);
      } catch {
        if (!mounted) return;
        setDashboard(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const summaryCards = useMemo(() => {
    if (!dashboard) {
      return [
        { label: "Pending Approvals", value: "0", helper: "No approval items loaded" },
        { label: "Active Applications", value: "0", helper: "Across 0 departments" },
        { label: "Avg. Review Cycle", value: "0d", helper: "Not enough completed interviews" },
        { label: "Application Acceptance", value: "0%", helper: "No offer-stage applications yet" },
      ];
    }

    return [
      {
        label: "Pending Approvals",
        value: String(dashboard.summary.pendingApprovals),
        helper:
          dashboard.summary.pendingApprovals > 0
            ? "Manager action required"
            : "No pending job approvals",
      },
      {
        label: "Active Applications",
        value: String(dashboard.summary.activeApplications),
        helper: `Across ${dashboard.summary.departmentCount} departments`,
      },
      {
        label: "Avg. Review Cycle",
        value: `${dashboard.summary.averageReviewCycleDays}d`,
        helper: dashboard.summary.averageReviewCycleLabel,
      },
      {
        label: "Application Acceptance",
        value: `${dashboard.summary.acceptanceRate}%`,
        helper: dashboard.summary.acceptanceRateLabel,
      },
    ];
  }, [dashboard]);

  const maxDepartmentDays = Math.max(
    ...(dashboard?.departmentHiringSpeed.map((item) => item.averageDays) ?? [1]),
    1,
  );

  const funnelConversionRate = useMemo(() => {
    if (!dashboard?.recruitmentFunnel.length) return 0;

    const sourced = dashboard.recruitmentFunnel[0]?.count ?? 0;
    const offered = dashboard.recruitmentFunnel[dashboard.recruitmentFunnel.length - 1]?.count ?? 0;
    if (sourced === 0) return 0;

    return ((offered / sourced) * 100).toFixed(2);
  }, [dashboard]);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-[1440px] items-center justify-center px-4 py-10 md:px-10">
        <LoadingIndicator label="Loading manager dashboard..." />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-[1440px] items-center justify-center px-4 py-10 md:px-10">
        <div className="w-full max-w-xl border border-[#e2dfde] bg-white p-8 text-center">
          <h1 className="text-[24px] font-semibold text-[#1a1c1c]">Manager Dashboard</h1>
          <p className="mt-3 text-[14px] text-[#5f5e5e]">
            Unable to load dashboard data right now. Please refresh and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-10 md:px-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#1a1c1c]">
            Manager Dashboard
          </h1>
          <p className="mt-1 text-[16px] leading-6 text-[#5f5e5e]">
            Decision-focused visibility for job approvals, candidate reviews, and pipeline health.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 border border-[#e2dfde] bg-white px-4 py-2 text-[12px] font-semibold tracking-[0.05em] text-[#1a1c1c] transition-colors hover:bg-[#f3f3f3]"
            onClick={() => navigate("/manager/applications")}
          >
            <span className="material-symbols-outlined text-[18px]">description</span>
            Open Review Queue
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 border border-[#e2dfde] bg-white px-4 py-2 text-[12px] font-semibold tracking-[0.05em] text-[#1a1c1c] transition-colors hover:bg-[#f3f3f3]"
            onClick={() => navigate("/jobs")}
          >
            <span className="material-symbols-outlined text-[18px]">approval</span>
            Review Jobs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {summaryCards.map((card, index) => (
          <div key={card.label} className="border border-[#e2dfde] bg-white p-6">
            <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5f5e5e]">
              {card.label}
            </p>
            <h3 className="mt-2 text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#1a1c1c]">
              {card.value}
            </h3>
            <div className={`mt-4 flex items-center gap-1 text-[12px] ${index === 0 || index === 3 ? "text-[#b90014]" : "text-[#5f5e5e]"}`}>
              <span className="material-symbols-outlined text-sm">
                {index === 0 ? "pending_actions" : index === 3 ? "check_circle" : "horizontal_rule"}
              </span>
              <span>{card.helper}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="overflow-hidden border border-[#e2dfde] bg-white">
            <div className="flex items-center justify-between border-b border-[#e2dfde] px-6 py-4">
              <h2 className="text-[20px] font-semibold leading-7 text-[#1a1c1c]">Pending Job Approvals</h2>
              <span className="rounded-full bg-[#b90014]/10 px-2 py-1 text-[12px] font-semibold text-[#b90014]">
                Action Required
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#1a1c1c] text-white">
                  <tr>
                    <th className="px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.05em]">Department</th>
                    <th className="px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.05em]">Job Title</th>
                    <th className="px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.05em]">Compensation / Meta</th>
                    <th className="px-6 py-3 text-right text-[12px] font-semibold uppercase tracking-[0.05em]">Action</th>
                  </tr>
                </thead>
                <tbody className="text-[14px]">
                  {dashboard.pendingApprovals.length ? (
                    dashboard.pendingApprovals.map((item, index) => (
                      <tr key={item.jobId} className={index % 2 === 1 ? "bg-[#f9fafb]" : "bg-white"}>
                        <td className="px-6 py-4 font-semibold">{item.meta.split(" • ")[0] || "General"}</td>
                        <td className="px-6 py-4">{item.title}</td>
                        <td className="px-6 py-4">{item.meta.split(" • ").slice(1).join(" • ") || item.meta}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            className="bg-[#b90014] px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[#e31b23]"
                            onClick={() => navigate("/jobs")}
                          >
                            Review & Approve
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-[#5f5e5e]">
                        No pending job approvals.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="border border-[#e2dfde] bg-white">
            <div className="border-b border-[#e2dfde] px-6 py-4">
              <h2 className="text-[20px] font-semibold leading-7 text-[#1a1c1c]">Final Decision Needed</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
              {dashboard.finalDecisions.length ? (
                dashboard.finalDecisions.map((item) => (
                  <article key={item.applicationId} className="flex gap-4 border border-[#e7bdb8] p-4 transition-colors hover:border-[#b90014]">
                    <div className="h-16 w-16 shrink-0 overflow-hidden bg-[#e2e2e2]">
                      {item.avatarUrl ? (
                        <img alt={item.candidateName} className="h-full w-full object-cover" src={item.avatarUrl} />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg font-bold text-[#5f5e5e]">
                          {item.candidateName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[16px] font-bold leading-6 text-[#1a1c1c]">{item.candidateName}</h3>
                      <p className="text-[14px] text-[#5f5e5e]">{item.jobTitle}</p>
                      <div className="mt-2 border-l-4 border-[#b90014] bg-[#f3f3f3] p-2 text-[12px] italic leading-5 text-[#5d3f3c]">
                        {item.recommendationNote}
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          className="flex-1 bg-[#1a1c1c] py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[#5f5e5e]"
                          onClick={() => navigate(`/manager/applications/${item.applicationId}`)}
                        >
                          Open Review
                        </button>
                        <span className={`inline-flex items-center px-3 text-[11px] font-bold uppercase tracking-[0.08em] ${statusChipTone(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="col-span-full border border-dashed border-[#e2dfde] p-6 text-sm text-[#5f5e5e]">
                  No candidates currently require a final manager decision.
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="border border-[#e2dfde] bg-white p-6">
            <h2 className="mb-6 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5f5e5e]">
              Review Cycle by Department (Days)
            </h2>
            <div className="space-y-4">
              {dashboard?.departmentHiringSpeed.length ? (
                dashboard.departmentHiringSpeed.map((item, index) => (
                  <div key={item.departmentName}>
                    <div className="mb-1 flex justify-between text-[12px]">
                      <span>{item.departmentName}</span>
                      <span className="font-bold">{item.averageDays}d</span>
                    </div>
                    <div className="h-2 w-full bg-[#eeeeee]">
                      <div
                        className={index % 3 === 1 ? "h-full bg-[#1a1c1c]" : index % 3 === 2 ? "h-full bg-[#5f5e5e]" : "h-full bg-[#b90014]"}
                        style={{ width: `${Math.max((item.averageDays / maxDepartmentDays) * 100, 10)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#5f5e5e]">No completed interview cycles available yet.</p>
              )}
            </div>
          </section>

          <section className="border border-[#e2dfde] bg-white p-6">
            <h2 className="mb-6 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5f5e5e]">
              Recruitment Funnel
            </h2>
            <div className="flex flex-col gap-2">
              {(dashboard?.recruitmentFunnel ?? []).map((item, index) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between p-3 text-white ${
                    index === 0 ? "bg-[#1a1c1c]" : index === 1 ? "mx-2 bg-[#1a1c1c]/90" : index === 2 ? "mx-4 bg-[#1a1c1c]/80" : "mx-8 bg-[#b90014]"
                  }`}
                >
                  <span className="text-[12px] font-semibold">{item.label}</span>
                  <span className="font-bold">{item.count}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-[12px] text-[#5f5e5e]">
              Offered conversion rate: <span className="font-bold text-[#1a1c1c]">{funnelConversionRate}%</span>
            </p>
          </section>

          <section className="bg-[#1a1c1c] p-6 text-white">
            <h2 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.05em] opacity-70">
              Quick Actions
            </h2>
            <ul className="space-y-3">
              <li>
                <button
                  type="button"
                  className="flex items-center gap-3 text-left text-[14px] transition-colors hover:text-[#ffdad6]"
                  onClick={() => navigate("/manager/applications")}
                >
                  <span className="h-2 w-2 rounded-full bg-[#b90014]" />
                  Review final candidate decisions
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="flex items-center gap-3 text-left text-[14px] transition-colors hover:text-[#ffdad6]"
                  onClick={() => navigate("/jobs")}
                >
                  <span className="h-2 w-2 rounded-full bg-[#b90014]" />
                  Approve pending job requests
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="flex items-center gap-3 text-left text-[14px] text-white/70 transition-colors hover:text-[#ffdad6]"
                  onClick={() => navigate("/manager/reports")}
                >
                  <span className="h-2 w-2 rounded-full bg-[#5f5e5e]" />
                  Open recruitment reports
                </button>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ManagerDashboardScreen;
