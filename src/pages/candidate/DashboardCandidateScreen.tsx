import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import { useI18n } from "../../i18n";
import EmptyState from "../../common/components/EmptyState";
import { Skeleton, SkeletonCard } from "../../common/components/Skeleton";
import {
  getEmploymentTypeBadgeClass,
  getSkillChipClass,
  quickApplyCardClass,
  quickApplyIconClass,
} from "../../common/utils/jobPresentation";
import {
  candidateService,
  type CandidateDashboardDto,
} from "../../services/candidate/candidateService";

function DashboardCandidateScreen() {
  const { t } = useI18n();
  const [dashboard, setDashboard] = useState<CandidateDashboardDto | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [recommendedPage, setRecommendedPage] = useState(0);
  const [recommendedPageSize, setRecommendedPageSize] = useState(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 639px)").matches
      ? 1
      : 2,
  );
  const [recommendedDirection, setRecommendedDirection] = useState<
    "next" | "previous"
  >("next");
  const dashboardLoadedRef = useRef(false);
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    if (dashboardLoadedRef.current) return;

    dashboardLoadedRef.current = true;
    let mounted = true;

    candidateService
      .getDashboard()
      .then((res) => {
        if (mounted && res.data) setDashboard(res.data);
      })
      .catch(() => {
        if (mounted) setDashboard(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const syncRecommendedPageSize = () => {
      setRecommendedPageSize(mediaQuery.matches ? 1 : 2);
      setRecommendedPage(0);
    };

    syncRecommendedPageSize();
    mediaQuery.addEventListener("change", syncRecommendedPageSize);

    return () => {
      mediaQuery.removeEventListener("change", syncRecommendedPageSize);
    };
  }, []);

  if (loading) {
    return (
      <section className="app-container animate-fade-in py-8">
        <div className="space-y-3">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Skeleton className="h-[320px] w-full rounded-[16px]" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:col-span-8">
            <Skeleton className="h-[220px] w-full rounded-[16px]" />
            <Skeleton className="h-[220px] w-full rounded-[16px]" />
          </div>
        </div>
      </section>
    );
  }

  if (!dashboard) {
    return (
      <section className="app-container animate-fade-in py-8">
        <div className="card">
          <EmptyState
            icon="dashboard"
            title={t("candidateDashboard.emptyTitle")}
            description={t("candidateDashboard.emptyDescription")}
          />
        </div>
      </section>
    );
  }

  const statCards = [
    {
      icon: "assignment",
      label: t("candidateDashboard.stats.appliedJobs"),
      value: String(dashboard.stats.appliedJobs).padStart(2, "0"),
      helper:
        dashboard.stats.appliedJobs > 0
          ? t("candidateDashboard.stats.appliedJobsActive")
          : t("candidateDashboard.stats.appliedJobsEmpty"),
    },
    {
      icon: "event",
      label: t("candidateDashboard.stats.interviews"),
      value: String(dashboard.stats.interviews).padStart(2, "0"),
      helper: dashboard.upcomingInterview
        ? t("candidateDashboard.stats.interviewsWithTime", {
            time: dashboard.upcomingInterview.time,
          })
        : t("candidateDashboard.stats.interviewsEmpty"),
    },
    {
      icon: "notifications_active",
      label: t("candidateDashboard.stats.unreadNotifications"),
      value: String(dashboard.stats.unreadNotifications).padStart(2, "0"),
      helper:
        dashboard.stats.unreadNotifications > 0
          ? t("candidateDashboard.stats.unreadNotificationsActive")
          : t("candidateDashboard.stats.unreadNotificationsEmpty"),
    },
  ];

  const recommendedJobs = dashboard.recommendedJobs ?? [];
  const recommendedPageCount = Math.max(
    1,
    Math.ceil(recommendedJobs.length / recommendedPageSize),
  );
  const safeRecommendedPage = Math.min(
    recommendedPage,
    recommendedPageCount - 1,
  );
  const visibleRecommendedJobs = recommendedJobs.slice(
    safeRecommendedPage * recommendedPageSize,
    safeRecommendedPage * recommendedPageSize + recommendedPageSize,
  );
  const canGoPreviousRecommended = safeRecommendedPage > 0;
  const canGoNextRecommended =
    safeRecommendedPage < recommendedPageCount - 1;
  const upcomingInterview = dashboard.upcomingInterview;
  const stats = dashboard.stats;

  return (
    <section className="app-container animate-fade-in py-8">
      <div className="mb-8">
        <p className="eyebrow mb-1.5">{t("candidateDashboard.eyebrow")}</p>
        <h1 className="page-title">
          {t("candidateDashboard.welcome", {
            name: dashboard?.greetingName ?? user?.fullName ?? t("roles.candidate"),
          })}
        </h1>
        <p className="page-subtitle">
          {stats
            ? t("candidateDashboard.subtitleActive", {
                interviews: stats.interviews,
                notifications: stats.unreadNotifications,
              })
            : t("candidateDashboard.subtitleEmpty")}
        </p>
      </div>

      <div className="stagger mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[#5f5e5e]">
                  {card.label}
                </p>
                <p className="mt-2 text-[40px] font-bold leading-none tracking-[-0.02em] text-[#1a1c1c]">
                  {card.value}
                </p>
                <p className="mt-2.5 text-[13px] leading-5 text-[#8a8786]">
                  {card.helper}
                </p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#fff1f0] to-[#ffdad6] text-[#b90014]">
                <span className="material-symbols-outlined text-[24px]">
                  {card.icon}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[20px] text-[#b90014]">
              calendar_today
            </span>
            <h2 className="section-title">{t("candidateDashboard.upcomingInterviewTitle")}</h2>
          </div>

          <div className="flex h-full min-h-[280px] flex-col overflow-hidden rounded-[16px] bg-[#1a1c1c] p-6 text-white shadow-[var(--shadow-lg)]">
            <div className="mb-6">
              {upcomingInterview ? (
                <span className="badge bg-[#b90014] text-white">
                  <span className="badge-dot bg-white" />
                  {t("candidateDashboard.upcomingStatusScheduled")}
                </span>
              ) : (
                <span className="badge bg-white/10 text-white/70">{t("candidateDashboard.upcomingStatusEmpty")}</span>
              )}
              <h3 className="mt-4 text-[30px] font-semibold leading-9 tracking-[-0.01em]">
                {upcomingInterview?.time ?? t("candidateDashboard.upcomingTimeEmpty")}
              </h3>
              <p className="mt-1 text-[15px] leading-6 text-[#c8c6c5]">
                {upcomingInterview?.date ?? t("candidateDashboard.upcomingDateEmpty")}
              </p>
            </div>

            <div className="mb-8 space-y-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#ff857c]">
                  {t("candidateDashboard.positionLabel")}
                </span>
                <span className="text-[15px] font-semibold">
                  {upcomingInterview?.jobTitle ?? t("candidateDashboard.upcomingDateEmpty")}
                </span>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#ff857c]">
                  {t("candidateDashboard.interviewerLabel")}
                </span>
                <span className="text-[15px]">
                  {upcomingInterview
                    ? `${upcomingInterview.interviewerName}, ${upcomingInterview.interviewerTitle}`
                    : t("candidateDashboard.interviewerEmpty")}
                </span>
              </div>
            </div>

            <a
              className={`btn mt-auto w-full ${
                upcomingInterview?.meetingUrl
                  ? "btn-primary"
                  : "pointer-events-none bg-white/10 text-white/50"
              }`}
              href={upcomingInterview?.meetingUrl ?? "#"}
            >
              <span className="material-symbols-outlined text-[18px]">
                video_call
              </span>
              {t("candidateDashboard.joinMeeting")}
            </a>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[20px] text-[#b90014]">
                recommend
              </span>
              <h2 className="section-title">{t("candidateDashboard.recommendedTitle")}</h2>
            </div>
            <Link
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#b90014] hover:underline"
              to="/jobs"
            >
              {t("candidateDashboard.viewAllJobs")}
              <span className="material-symbols-outlined text-[16px]">
                arrow_forward
              </span>
            </Link>
          </div>

          {recommendedJobs.length === 0 ? (
            <div className="card">
              <EmptyState
                icon="work_off"
                title={t("candidateDashboard.recommendedEmptyTitle")}
                description={t("candidateDashboard.recommendedEmptyDescription")}
                action={
                  <Link to="/jobs" className="btn btn-primary">
                    <span className="material-symbols-outlined text-[18px]">
                      search
                    </span>
                    {t("candidateDashboard.exploreJobs")}
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-[20px] border border-rose-200/80 bg-[linear-gradient(135deg,#fffafa_0%,#fff1f0_48%,#fff7ed_100%)] p-4 shadow-[0_22px_54px_-34px_rgba(185,0,20,0.62)] sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    className="premium-action flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-rose-200 bg-white text-[#b90014] shadow-[0_10px_24px_-18px_rgba(185,0,20,0.8)] transition-all hover:-translate-x-0.5 hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-x-0"
                    onClick={() => {
                      setRecommendedDirection("previous");
                      setRecommendedPage((current) =>
                        Math.max(0, current - 1),
                      );
                    }}
                    disabled={!canGoPreviousRecommended}
                    aria-label={t("candidateDashboard.previousRecommendations")}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      chevron_left
                    </span>
                  </button>

                  <div className="min-w-0">
                    <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#b90014]">
                      {t("candidateDashboard.featuredRecommendations")}
                    </p>
                    <p className="mt-1 text-[13px] font-semibold text-[#5f5e5e]">
                      {t("candidateDashboard.recommendationRange", {
                        start: safeRecommendedPage * recommendedPageSize + 1,
                        end: Math.min(
                          (safeRecommendedPage + 1) * recommendedPageSize,
                          recommendedJobs.length,
                        ),
                        total: recommendedJobs.length,
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="hidden rounded-full border border-white/80 bg-white/70 px-3 py-1 text-[12px] font-bold text-[#7a4b53] shadow-[var(--shadow-xs)] sm:inline-flex">
                    {safeRecommendedPage + 1}/{recommendedPageCount}
                  </span>
                  <button
                    type="button"
                    className="premium-action flex h-10 w-10 items-center justify-center rounded-full border border-rose-200 bg-white text-[#b90014] shadow-[0_10px_24px_-18px_rgba(185,0,20,0.8)] transition-all hover:translate-x-0.5 hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-x-0"
                    onClick={() => {
                      setRecommendedDirection("next");
                      setRecommendedPage((current) =>
                        Math.min(recommendedPageCount - 1, current + 1),
                      );
                    }}
                    disabled={!canGoNextRecommended}
                    aria-label={t("candidateDashboard.nextRecommendations")}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      chevron_right
                    </span>
                  </button>
                </div>
              </div>

              <div
                key={`${safeRecommendedPage}-${recommendedPageSize}`}
                className={`grid min-h-[292px] grid-cols-1 gap-4 sm:min-h-[316px] sm:grid-cols-2 ${
                  recommendedDirection === "next"
                    ? "animate-carousel-next"
                    : "animate-carousel-previous"
                }`}
              >
                {visibleRecommendedJobs.map((job) => (
                  <div
                    key={job.id}
                    className={`${quickApplyCardClass} group flex h-full min-h-[292px] flex-col p-5`}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div
                        className={`${quickApplyIconClass} h-12 w-12 transition-transform duration-300 group-hover:rotate-[-3deg] group-hover:scale-105`}
                      >
                        <span className="material-symbols-outlined text-[24px]">
                          work
                        </span>
                      </div>
                      <span className={getEmploymentTypeBadgeClass(job.employmentType)}>
                        {job.employmentType}
                      </span>
                    </div>

                    <h3 className="mb-1 text-[17px] font-semibold leading-6 text-[#1a1c1c] transition-colors group-hover:text-[#b90014]">
                      {job.title}
                    </h3>
                    <p className="mb-4 line-clamp-2 text-[14px] leading-6 text-[#5f5e5e]">
                      {job.meta}
                    </p>

                    <div className="mb-5 flex flex-wrap gap-1.5">
                      {job.skills.map((chip) => (
                        <span
                          key={chip}
                          className={getSkillChipClass(chip)}
                        >
                          {chip}
                        </span>
                      ))}
                    </div>

                    <Link
                      className="btn btn-secondary mt-auto w-full border-rose-200 bg-white/85 text-[#b90014] hover:border-rose-300 hover:bg-white hover:shadow-[0_12px_26px_-18px_rgba(185,0,20,0.75)]"
                      to={`/jobs/${job.id}`}
                    >
                      {job.actionLabel ?? t("candidateDashboard.quickApply")}
                      <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-0.5">
                        arrow_forward
                      </span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default DashboardCandidateScreen;
