import { useEffect, useState } from "react";
import CommonTable, { TableColumn } from "../../common/components/CommonTable";
import { hrService, type HrDashboardDto } from "../../services/hr/hrService";

type StatCard = {
  label: string;
  value: string;
  helper: string;
  helperClassName?: string;
  icon: string;
};

type RecentApplication = {
  candidateName: string;
  jobAppliedFor: string;
  status: string;
  statusClassName: string;
  date: string;
};

type PendingApproval = {
  title: string;
  meta: string;
  avatarSrc?: string;
  extraCount?: string;
};

const statCards: StatCard[] = [
  {
    label: "Active Postings",
    value: "12",
    helper: "+2 from last week",
    helperClassName: "text-[#0079b9]",
    icon: "work",
  },
  {
    label: "Total Applicants",
    value: "84",
    helper: "15.2% conversion rate",
    helperClassName: "text-[#0079b9]",
    icon: "group",
  },
  {
    label: "Interviews Today",
    value: "5",
    helper: "Next: 2:00 PM (L6 Dev)",
    helperClassName: "text-[#ba1a1a]",
    icon: "schedule",
  },
];

const recentApplications: RecentApplication[] = [
  {
    candidateName: "Sarah Jenkins",
    jobAppliedFor: "Senior UX Designer",
    status: "Interviewing",
    statusClassName: "bg-[#005f93]/10 text-[#005f93]",
    date: "Oct 24, 2024",
  },
  {
    candidateName: "David Chen",
    jobAppliedFor: "Backend Engineer (L5)",
    status: "Reviewing",
    statusClassName: "bg-[#e2dfde] text-[#636262]",
    date: "Oct 23, 2024",
  },
  {
    candidateName: "Maria Rodriguez",
    jobAppliedFor: "HR Business Partner",
    status: "Interviewing",
    statusClassName: "bg-[#005f93]/10 text-[#005f93]",
    date: "Oct 22, 2024",
  },
  {
    candidateName: "Jameson Wright",
    jobAppliedFor: "Solutions Architect",
    status: "Reviewing",
    statusClassName: "bg-[#e2dfde] text-[#636262]",
    date: "Oct 22, 2024",
  },
  {
    candidateName: "Olivia Thorne",
    jobAppliedFor: "Lead Copywriter",
    status: "Offer Sent",
    statusClassName: "bg-[#b90014]/10 text-[#b90014]",
    date: "Oct 21, 2024",
  },
];

const pendingApprovals: PendingApproval[] = [
  {
    title: "Financial Analyst",
    meta: "Finance • Remote",
    avatarSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCZRNKp3_yw7dT1EBsoKDuRZeLjRr_EjK9XwWAcgAURrQxjZLH9r-Y3fv7Ljr8pKqJbCQZaE5z5H7Rm0CdzHBP4YSmrL9FxtkqpDNMva6TMCt5ecrRmVKDc1k6leYP7PMf7YBWNt9UH_9csbjd5hmX74NhYnrLM0Gxup4ITnfzRRP0YYXtvIJRjml9ovuQE5rqJLxNXuyZCnBrJivEg5jvofE7RF9igLc6iaSIWo6leA9ZsrA8fC8cCQTUZ-dn1u3Dm4FGalXwR5w",
    extraCount: "+1",
  },
  {
    title: "Product Marketing Manager",
    meta: "Marketing • Hybrid",
    avatarSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDgWXtaTN_CmW7ZGNOmJSx-bOFYyJp-ptms89pPgELQ5cEHsjTdEKG0A2MhF5SwP02Pl7syVDCaqFHQOpZ3FS-0R4h7DXIuotWAaD0X04zfgTi4K_wBGznSSPc810CXG7ZRSL9n7ts_i8PSmaD9HrrevzLPle7UDLrm0lTsjx1Cb6XsCrATNNWvBzY1J-Z8A9jpATG301RmcrqVCgDp2QaOdjD2lIDdovsCc4YWuWbQ7JFpbdt9o2sYYWA7pkWX1G68n-U2-_qZ9w",
  },
  {
    title: "Sales Development Rep",
    meta: "Commercial • On-site",
    avatarSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAVuxixCK6XQ6Rr7d_E5Wukh-3niKjlcZDF_BTXjUx1bIQo4pMMeqQH9UU1ZBZpiF-7VcZwoSyk08PS33XFJvxlDkv9MTSru-bV1atliooaG3Vwfrzbq4BfiiybtI1i4CTCD3DaAxsXPdAkV3aQQG2Kfu9s6nGA6KFRWGYuuStpubWU1mtBSHrbI1fAxSLoQgrBVBT00pRysikZQ_0D8hpVPxdrArAR0kWC6CvOKU19XQDo16ngUxGZefrHazXHvSzokE0kBVzpdw",
  },
];

function buildRecentApplicationsColumns(): TableColumn<RecentApplication>[] {
  return [
    {
      key: "candidateName",
      header: "Candidate Name",
      renderCell: (item) => <span className="font-semibold">{item.candidateName}</span>,
    },
    {
      key: "jobAppliedFor",
      header: "Job Applied For",
      renderCell: (item) => <span className="text-[#5f5e5e]">{item.jobAppliedFor}</span>,
    },
    {
      key: "status",
      header: "Status",
      renderCell: (item) => (
        <span
          className={`rounded px-3 py-1 text-[10px] font-bold uppercase ${item.statusClassName}`}
        >
          {item.status}
        </span>
      ),
    },
    {
      key: "date",
      header: "Date",
      renderCell: (item) => <span className="text-[#5f5e5e]">{item.date}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      alignRight: true,
      renderCell: () => (
        <button
          type="button"
          className="text-[#1a1c1c] transition-colors hover:text-[#b90014]"
          aria-label="More actions"
        >
          <span className="material-symbols-outlined text-[20px]">
            more_vert
          </span>
        </button>
      ),
    },
  ];
}

function HrDashboardScreen() {
  const [dashboard, setDashboard] = useState<HrDashboardDto | null>(null);

  useEffect(() => {
    let mounted = true;

    hrService
      .getDashboard()
      .then((res) => {
        if (mounted && res.data) setDashboard(res.data);
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  const statCardsData: StatCard[] = dashboard
    ? [
        {
          label: "Active Postings",
          value: String(dashboard.stats.activePostings),
          helper: "+2 from last week",
          helperClassName: "text-[#0079b9]",
          icon: "work",
        },
        {
          label: "Total Applicants",
          value: String(dashboard.stats.totalApplicants),
          helper: "15.2% conversion rate",
          helperClassName: "text-[#0079b9]",
          icon: "group",
        },
        {
          label: "Interviews Today",
          value: String(dashboard.stats.interviewsToday),
          helper: dashboard.stats.nextInterviewLabel,
          helperClassName: "text-[#ba1a1a]",
          icon: "schedule",
        },
      ]
    : statCards;

  const recentApplicationsData: RecentApplication[] =
    dashboard?.recentApplications?.map((item) => ({
      candidateName: item.candidateName,
      jobAppliedFor: item.jobAppliedFor,
      status: item.status,
      statusClassName:
        item.status === "Interviewing"
          ? "bg-[#005f93]/10 text-[#005f93]"
          : item.status === "Offer Sent"
            ? "bg-[#b90014]/10 text-[#b90014]"
            : "bg-[#e2dfde] text-[#636262]",
      date: new Date(item.date).toLocaleDateString(),
    })) ?? recentApplications;

  const pendingApprovalsData: PendingApproval[] =
    dashboard?.pendingApprovals?.map((item) => ({
      title: item.title,
      meta: item.meta,
      extraCount: item.approverCount > 1 ? `+${item.approverCount - 1}` : undefined,
    })) ?? pendingApprovals;

  return (
    <>
      <div className="page-shell space-y-6 py-6">
            <div className="reveal-up flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="section-kicker">Operations</span>
                <h2 className="mt-4 text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#1a1c1c]">
                  Recruitment Overview
                </h2>
                <p className="mt-1 text-[16px] leading-6 text-[var(--rp-muted)]">
                  Performance metrics for Q4 Hiring Cycle
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-secondary px-4 py-3 text-[12px] font-semibold tracking-[0.05em]"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    download
                  </span>
                  Export Report
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {statCardsData.map((card, index) => (
                <div
                  key={card.label}
                  className="metric-card reveal-scale flex cursor-default items-center justify-between p-6 hover:-translate-y-1"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--rp-muted)]">
                      {card.label}
                    </p>
                    <h3 className="mt-2 text-[40px] font-bold leading-none text-[#1a1c1c]">
                      {card.value}
                    </h3>
                    <p
                      className={`mt-2 text-[14px] leading-5 ${
                        card.helperClassName ?? "text-[#5f5e5e]"
                      }`}
                    >
                      {card.helper}
                    </p>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[rgba(182,64,44,0.12)]">
                    <span className="material-symbols-outlined text-[var(--rp-primary)]">
                      {card.icon}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <section className="surface-card lg:col-span-2 overflow-hidden">
                <div className="flex items-center justify-between border-b border-[rgba(24,33,38,0.08)] bg-white/40 px-6 py-4">
                  <h4 className="text-[20px] font-semibold leading-7 text-[#1a1c1c]">
                    Recent Applications
                  </h4>
                  <button
                    type="button"
                    className="text-[12px] font-bold tracking-[0.05em] text-[var(--rp-primary)] hover:underline"
                  >
                    View All
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <CommonTable
                    columns={buildRecentApplicationsColumns()}
                    data={recentApplicationsData}
                    keyExtractor={(item) => `${item.candidateName}-${item.date}`}
                    loading={false}
                    emptyMessage="No recent applications."
                    zebra
                    hover
                    tableWrapperClassName="overflow-hidden bg-transparent"
                  />
                </div>
              </section>

              <aside className="flex flex-col gap-6">
                <section className="surface-card flex h-full flex-col p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <h4 className="text-[20px] font-semibold leading-7 text-[#1a1c1c]">
                      Pending Approvals
                    </h4>
                    <span className="rounded-full bg-[var(--rp-primary)] px-2 py-0.5 text-[10px] font-bold text-white">
                      3
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col gap-4 overflow-y-auto pr-2 scrollbar-hide">
                    {pendingApprovalsData.map((item) => (
                      <div
                        key={item.title}
                        className="input-shell bg-white/50 p-4 transition-all hover:-translate-y-1"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-[12px] font-bold tracking-[0.05em] text-[#1a1c1c]">
                              {item.title}
                            </p>
                            <p className="text-[12px] text-[#5f5e5e]">
                              {item.meta}
                            </p>
                          </div>
                          <span className="material-symbols-outlined text-[20px] text-[var(--rp-muted)]">
                            history
                          </span>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex -space-x-2">
                            {item.avatarSrc ? (
                              <img
                                alt="Approver"
                                className="h-6 w-6 rounded-full border-2 border-white object-cover"
                                src={item.avatarSrc}
                              />
                            ) : null}
                            {item.extraCount ? (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#e2dfde] text-[8px] font-bold text-[#1a1c1c]">
                                {item.extraCount}
                              </div>
                            ) : null}
                          </div>

                          <button
                            type="button"
                            className="text-[12px] font-bold tracking-[0.05em] text-[var(--rp-primary)] hover:underline"
                          >
                            Review Draft
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="btn-secondary mt-6 w-full px-5 py-3 text-[12px] font-semibold tracking-[0.05em]"
                  >
                    View All Approvals
                  </button>
                </section>
              </aside>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              <section className="surface-card-strong relative overflow-hidden p-6 md:col-span-1">
                <div className="relative z-10">
                  <h4 className="mb-2 text-[20px] font-semibold leading-7 text-white">
                    Hiring Velocity
                  </h4>
                  <p className="text-[14px] leading-5 text-[#c8c6c5]">
                    Average time to hire decreased by 12% this quarter.
                  </p>
                </div>
                <div className="absolute bottom-[-20px] right-[-20px] opacity-10">
                  <span className="material-symbols-outlined text-[120px] text-white">
                    trending_up
                  </span>
                </div>
              </section>

              <section className="surface-card flex flex-col items-start gap-6 p-6 md:col-span-3 md:flex-row md:items-center">
                <div className="flex-1">
                  <h4 className="mb-2 text-[20px] font-semibold leading-7 text-[#1a1c1c]">
                    Diversity & Inclusion Report
                  </h4>
                  <p className="max-w-md text-[14px] leading-6 text-[var(--rp-muted)]">
                    Your team has reached 85% of the annual inclusion targets.
                    Explore the full breakdown to optimize your outreach
                    strategies.
                  </p>
                  <button
                    type="button"
                    className="btn-primary mt-4 px-6 py-3 text-[12px] font-bold tracking-[0.05em]"
                  >
                    View Full Report
                  </button>
                </div>

                <div className="input-shell flex h-32 w-full items-center justify-center bg-white/40 md:w-48">
                  <span className="material-symbols-outlined text-[48px] text-[var(--rp-muted)]">
                    bar_chart
                  </span>
                </div>
              </section>
            </div>
      </div>

      <button
        type="button"
        className="btn-primary fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white md:hidden"
        aria-label="Post new job"
      >
        <span className="material-symbols-outlined text-[32px]">add</span>
      </button>
    </>
  );
}

export default HrDashboardScreen;
