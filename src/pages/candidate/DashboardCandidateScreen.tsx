import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import { candidateService, type CandidateDashboardDto } from "../../services/candidate/candidateService";

type StatCard = {
  icon: string;
  iconClassName: string;
  label: string;
  value: string;
  helper: string;
};

function DashboardCandidateScreen() {
  const [dashboard, setDashboard] = useState<CandidateDashboardDto | null>(null);
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    let mounted = true;

    candidateService
      .getDashboard()
      .then((res) => {
        if (mounted && res.data) setDashboard(res.data);
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  const statCards = [
    {
      icon: "assignment",
      iconClassName: "text-[#b90014]",
      label: "Applied Jobs",
      value: String(dashboard?.stats.appliedJobs ?? 4).padStart(2, "0"),
      helper: "+1 since last week",
    },
    {
      icon: "event",
      iconClassName: "text-[#005f93]",
      label: "Interviews",
      value: String(dashboard?.stats.interviews ?? 1).padStart(2, "0"),
      helper: dashboard?.upcomingInterview
        ? `Next scheduled at ${dashboard.upcomingInterview.time}`
        : "No interview scheduled",
    },
    {
      icon: "notifications_active",
      iconClassName: "text-[#1a1c1c]",
      label: "Unread",
      value: String(dashboard?.stats.unreadNotifications ?? 2).padStart(2, "0"),
      helper: "New updates available",
    },
  ];

  const recommendedJobs = dashboard?.recommendedJobs ?? [];
  const upcomingInterview = dashboard?.upcomingInterview;
  const stats = dashboard?.stats;

  return (
    <section className="page-shell space-y-8 py-10">
            <div className="reveal-up mb-10">
              <span className="section-kicker">Candidate Hub</span>
              <h2 className="mt-4 text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#1a1c1c]">
                Welcome back, {dashboard?.greetingName ?? user?.fullName ?? "Candidate"}
              </h2>
              <p className="mt-1 text-[16px] leading-6 text-[var(--rp-muted)]">
                {stats
                  ? `You have ${stats.interviews} interview${stats.interviews === 1 ? "" : "s"} scheduled and ${stats.unreadNotifications} new notification${stats.unreadNotifications === 1 ? "" : "s"}.`
                  : "No dashboard activity available yet."}
              </p>
            </div>

            <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
              {statCards.map((card, index) => (
                <div
                  key={card.label}
                  className="metric-card reveal-scale cursor-pointer p-6 hover:-translate-y-1"
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`material-symbols-outlined text-3xl ${card.iconClassName}`}
                    >
                      {card.icon}
                    </span>
                    <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">
                      {card.label}
                    </span>
                  </div>

                  <div className="mt-4">
                    <p className="text-[56px] font-extrabold leading-none text-[#1a1c1c]">
                      {card.value}
                    </p>
                    <p className="mt-2 flex items-center gap-2 text-[14px] text-[var(--rp-muted)]">
                      <span>{card.helper}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <div className="mb-4 flex items-center gap-3">
                  <span className="material-symbols-outlined text-[var(--rp-primary)]">
                    calendar_today
                  </span>
                  <h3 className="text-[20px] font-semibold leading-7 text-[#1a1c1c]">
                    Upcoming Interview
                  </h3>
                </div>

                <div className="surface-card-strong flex h-full flex-col p-6 text-white">
                  <div className="mb-6">
                    <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]">
                      Today
                    </span>
                    <h4 className="mt-4 text-[32px] font-semibold leading-10 tracking-[-0.01em]">
                      {upcomingInterview?.time ?? "No upcoming interview"}
                    </h4>
                    <p className="text-[16px] leading-6 text-[#c8c6c5]">
                      {upcomingInterview?.date ?? "No interview scheduled"}
                    </p>
                  </div>

                  <div className="mb-8 space-y-4">
                    <div className="flex flex-col">
                      <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#b90014]">
                        Job Title
                      </span>
                      <span className="text-[16px] font-bold">
                        {upcomingInterview?.jobTitle ?? "No interview scheduled"}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#b90014]">
                        Interviewer
                      </span>
                      <span className="text-[16px]">
                        {upcomingInterview
                          ? `${upcomingInterview.interviewerName}, ${upcomingInterview.interviewerTitle}`
                          : "No interviewer assigned"}
                      </span>
                    </div>
                  </div>

                  <a
                    className="btn-primary mt-auto flex w-full px-5 py-4 text-[12px] font-bold uppercase tracking-[0.18em]"
                    href={upcomingInterview?.meetingUrl ?? "#"}
                  >
                    <span className="material-symbols-outlined">
                      video_call
                    </span>
                    Join Meeting
                  </a>
                </div>
              </div>

              <div className="lg:col-span-8">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[var(--rp-primary)]">
                      recommend
                    </span>
                    <h3 className="text-[20px] font-semibold leading-7 text-[#1a1c1c]">
                      Recommended Jobs
                    </h3>
                  </div>
                  <a
                    className="text-[12px] font-semibold tracking-[0.05em] text-[var(--rp-primary)] hover:underline"
                    href="#"
                  >
                    View All Listings
                  </a>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {recommendedJobs.length === 0 ? (
                    <div className="surface-card p-6 text-[14px] text-[var(--rp-muted)] md:col-span-2">
                      Không có dữ liệu
                    </div>
                  ) : (
                    recommendedJobs.map((job) => {
                      const isCompact = job.layout === "compact";

                      if (isCompact) {
                        return (
                          <div
                            key={job.id}
                            className="surface-card p-6 md:col-span-2"
                          >
                          <div className="flex items-center gap-6">
                            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-[20px] bg-[rgba(182,64,44,0.1)]">
                              <span className="material-symbols-outlined text-4xl text-[var(--rp-primary)]">
                                work
                              </span>
                            </div>

                            <div className="flex-1">
                              <div className="mb-1 flex items-center justify-between">
                                <h4 className="text-[16px] font-bold text-[#1a1c1c]">
                                  {job.title}
                                </h4>
                                <span className="tag-chip uppercase">
                                  {job.employmentType}
                                </span>
                              </div>
                              <p className="mb-2 text-[14px] text-[var(--rp-muted)]">
                                {job.meta}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {job.skills.map((chip) => (
                                  <span key={chip} className="tag-chip">
                                    {chip}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <button
                              className="btn-primary px-10 py-4 text-[12px] font-bold uppercase tracking-[0.18em]"
                              type="button"
                            >
                              {job.actionLabel ?? "Apply Now"}
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={job.id}
                        className="surface-card p-6 transition-shadow hover:-translate-y-1"
                      >
                        <div className="mb-4 flex items-start justify-between">
                          <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[rgba(182,64,44,0.1)]">
                            <span className="material-symbols-outlined text-[var(--rp-primary)]">
                              work
                            </span>
                          </div>
                          <span className="tag-chip uppercase">
                            {job.employmentType}
                          </span>
                        </div>

                        <h4 className="mb-1 text-[16px] font-bold text-[#1a1c1c] transition-colors hover:text-[#b90014]">
                          {job.title}
                        </h4>
                        <p className="mb-4 text-[14px] text-[var(--rp-muted)]">
                          {job.meta}
                        </p>

                        <div className="mb-6 flex flex-wrap gap-2">
                          {job.skills.map((chip) => (
                            <span key={chip} className="tag-chip">
                              {chip}
                            </span>
                          ))}
                        </div>

                        <button
                          className="btn-secondary w-full px-5 py-3 text-[12px] font-bold uppercase tracking-[0.18em]"
                          type="button"
                        >
                          {job.actionLabel ?? "Quick Apply"}
                        </button>
                      </div>
                    );
                    })
                  )}
                </div>
              </div>
            </div>
    </section>
  );
}

export default DashboardCandidateScreen;
