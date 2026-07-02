import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Seo from "../../common/components/Seo";
import { Skeleton } from "../../common/components/Skeleton";
import { useI18n } from "../../i18n";
import {
  getEmploymentTypeBadgeClass,
  getWorkModeChipClass,
} from "../../common/utils/jobPresentation";
import { jobsService } from "../../services/jobs/jobsService";
import { publicService, type HomeResponseDto } from "../../services/public/publicService";

type FeaturedJobCardModel = {
  id: string;
  title: string;
  department: string;
  location: string;
  workMode: string;
  employmentType: string;
  tag: string;
  summary?: string | null;
};

const DEFAULT_HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAUfygHMUT0GsF8YdHRd9UEVxo58r1qiqQeM2IrV2hyEJUH2b-2LnalysZVzgAhGj08lVHPyMbD9tQuCoSKhxC7wGBhphuSRszTThOpLPw2rDu9oQtx1JzHL29XhBtuNtuOziq4LiN7z_GGG4E-8YxjUvTJynJlVHSa6RlC2wzAOYEs_AgA_0Y0U1y78Du0RERP91aU49ys4MlHQpO2E-Hq7UEkEGSft9B6DZ-GRvqi9B-6bapAiEZyFAsKrmMPD3Gaq1LBtaeTzA";

const MISSION_IMAGE_TOP =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDRUVrGvDGI0wIaWBmj5VEmyuTikfSJ6Ffy0vS3uUm1ugzNjyqSi-cKUtCtsWuDVGjMu8bB0vub7c4MmdSpxAllxvb8zqlxj4yf5u6Gwoe-2X0ppnUshF9I2Gk8ox3BjzsHx7rYHwtrBpKkJKaOUrFtsvXflBNFIOilEOGiykir3FUly1N-h5ruxtVWnbYwdQ5EhJrKESvt2hcEhbe1fFRqyf4HucDbw9O9KJ2obwmmxp0W3Ii8bBy4URl_RwOh0mh85584L__Bxw";

const MISSION_IMAGE_BOTTOM =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBNwKwKvx8QWCBWsgaeLzzMl4AhStc9WVkWEn_kVaXnA6sPLEj-kbsuTJ0h97Vu2enufLJIVXnts1zXbWhWmg7P9VR6QcFciQVbWMUgxIO69HGELN3dhKHAVcqkXH_isZw9qXLY0XwnXSRI-JJu9bONxCu3jlGsj6_9_VTYxe6RHEW9unLMZfZf8UDwD1V0Q7GkxwpDHXM5DbqXmnOZxpQK7tCQSs5jgqgHTOvTNopDfbXMZE8CGlz9ibNi40n3bXpCHG1LPxgy7Q";

// i18n key suffixes; titles/descriptions resolved via t("landing.*") in the component.
const missionHighlightKeys = ["highlight1", "highlight2"] as const;

const heroFeatureItems = [
  { icon: "auto_awesome", key: "feature1" },
  { icon: "swap_horiz", key: "feature2" },
  { icon: "bolt", key: "feature3" },
] as const;

/** Renders the hero title, coloring any "RecruitPro" occurrence in brand crimson. */
function renderHeroTitle(title: string) {
  const parts = title.split(/(RecruitPro)/g);
  return parts.map((part, index) =>
    part === "RecruitPro" ? (
      <span key={index} className="text-[#b90014]">
        {part}
      </span>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

function normalizeFeaturedJobs(data?: HomeResponseDto | null) {
  if (!data?.featuredJobs?.length) {
    return [];
  }

  return data.featuredJobs.map((job, index) => ({
    ...job,
    tag: job.tag || (index === 0 ? "New" : index === 1 ? "Hot" : "Urgent"),
  }));
}

function getTagClass(tag: string) {
  const normalized = tag.trim().toLowerCase();

  if (normalized === "urgent") {
    return "bg-[#b90014] text-white";
  }

  if (normalized === "hot") {
    return "bg-[#ffebe8] text-[#c0382b]";
  }

  return "bg-[#fff1f0] text-[#b90014]";
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Reveals + returns true once the element scrolls into view (one-shot). */
function useInView<T extends HTMLElement>(rootMargin = "0px 0px -10% 0px") {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, inView };
}

/** Counts up to `value` over `duration` ms once `active` flips true. */
function useCountUp(value: number, active: boolean, duration = 1400) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!active) return;
    if (prefersReducedMotion()) {
      setDisplay(value);
      return;
    }

    let frame = 0;
    let start: number | null = null;
    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      // easeOutCubic for a snappy, decelerating count
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, active, duration]);

  return display;
}

function LandingMetricCard({
  icon,
  label,
  sublabel,
  value,
  suffix = "",
  decimals = 0,
  stars = false,
  active,
  delay = 0,
}: {
  icon: string;
  label: string;
  sublabel?: string;
  value: number;
  suffix?: string;
  decimals?: number;
  stars?: boolean;
  active: boolean;
  delay?: number;
}) {
  const animated = useCountUp(value, active);
  const formatted = animated.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <div
      className={`group flex items-center justify-center gap-4 px-7 py-7 transition-colors ${
        active ? "animate-fade-in-up" : "opacity-0"
      }`}
      style={active ? { animationDelay: `${delay}ms` } : undefined}
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#fff1f0] to-[#ffe1de] text-[#b90014] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
        <span className="material-symbols-outlined text-[24px]">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[34px] font-bold leading-none tracking-[-0.03em] text-[#1a1c1c] tabular-nums">
          {formatted}
          <span className="text-[#b90014]">{suffix}</span>
        </p>
        <p className="mt-1.5 text-[15px] font-semibold text-[#1a1c1c]">{label}</p>
        {stars ? (
          <div className="mt-1 flex gap-0.5 text-[#b90014]">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className="material-symbols-outlined text-[15px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
            ))}
          </div>
        ) : sublabel ? (
          <p className="mt-1 text-[12px] text-[#8a8786]">{sublabel}</p>
        ) : null}
      </div>
    </div>
  );
}

function FeaturedJobCard({ job }: { job: FeaturedJobCardModel }) {
  const { t } = useI18n();

  return (
    <article className="group flex h-full flex-col rounded-[16px] border border-[#ebd7d4] bg-white p-6 shadow-[var(--shadow-xs)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-md)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <span className={`badge ${getTagClass(job.tag)}`}>{job.tag}</span>
          <span className={getWorkModeChipClass()}>{job.workMode}</span>
        </div>
        <button
          type="button"
          className="text-[#7f7c7b] transition-colors hover:text-[#b90014]"
          aria-label={t("landing.saveJobAria", { title: job.title })}
        >
          <span className="material-symbols-outlined text-[20px]">bookmark</span>
        </button>
      </div>

      <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-[#1a1c1c] transition-colors duration-200 group-hover:text-[#b90014]">
        {job.title}
      </h3>

      <p className="mt-3 line-clamp-3 text-[14px] leading-6 text-[#5f5e5e]">
        {job.summary?.trim()
          ? job.summary
          : t("landing.jobFallbackSummary", { department: job.department })}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className={getEmploymentTypeBadgeClass(job.employmentType)}>
          {job.employmentType}
        </span>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-[#efe3e1] pt-6">
        <div className="flex min-w-0 items-center gap-2 text-[#6d6a69]">
          <span className="material-symbols-outlined text-[18px]">location_on</span>
          <span className="truncate text-[14px]">{job.location}</span>
        </div>
        <Link
          className="text-[14px] font-bold text-[#b90014] transition-colors hover:text-[#930614]"
          to={`/jobs/${job.id}`}
        >
          {t("landing.applyNow")}
        </Link>
      </div>
    </article>
  );
}

function HighlightItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#5a232a] bg-[#2b1417] text-[#ffb4ac]">
        <span className="material-symbols-outlined text-[18px]">check</span>
      </div>
      <div>
        <h4 className="text-[20px] font-semibold text-white">{title}</h4>
        <p className="mt-1 text-[14px] leading-6 text-white/62">{description}</p>
      </div>
    </div>
  );
}

function LandingPageScreen() {
  const { t } = useI18n();
  const [homeData, setHomeData] = useState<HomeResponseDto | null>(null);
  const [featuredJobs, setFeaturedJobs] = useState<FeaturedJobCardModel[]>([]);
  const [loading, setLoading] = useState(true);
  const stats = useInView<HTMLDivElement>();

  useEffect(() => {
    let mounted = true;

    Promise.allSettled([
      publicService.getHome(),
      jobsService.listPublicJobs({ page: 1, pageSize: 3, sortBy: "newest" }),
    ])
      .then(([homeResult, jobsResult]) => {
        if (!mounted) return;

        const homePayload =
          homeResult.status === "fulfilled" ? homeResult.value.data ?? null : null;
        const homeFeaturedJobs = normalizeFeaturedJobs(homePayload);
        const jobsPayload =
          jobsResult.status === "fulfilled" ? jobsResult.value.data?.items ?? [] : [];

        const fallbackJobs = jobsPayload.slice(0, 3).map((job, index) => ({
          id: job.id,
          title: job.title,
          department:
            typeof job.department === "string"
              ? job.department
              : job.department?.name ?? "General",
          location: job.location,
          workMode: job.workMode || "Hybrid",
          employmentType: job.employmentType || "Full-time",
          tag: index === 0 ? "New" : index === 1 ? "Hot" : "Urgent",
          summary: job.shortDescription ?? job.summary ?? null,
        }));

        setHomeData(homePayload);
        setFeaturedJobs(homeFeaturedJobs.length ? homeFeaturedJobs : fallbackJobs);
      })
      .catch(() => {
        if (!mounted) return;
        setHomeData(null);
        setFeaturedJobs([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const heroTitle = homeData?.hero?.title ?? t("landing.heroTitle");
  const heroSubtitle = homeData?.hero?.subtitle ?? t("landing.heroSubtitle");
  const heroImage = homeData?.hero?.backgroundImageUrl || DEFAULT_HERO_IMAGE;

  return (
    <div className="overflow-hidden bg-[#f9f9f9] text-[#1a1c1c]">
      <Seo
        title={t("seo.defaultTitle")}
        description={t("seo.defaultDescription")}
        canonical="/"
      />
      <main>
        <section
          id="home"
          className="relative overflow-hidden border-b border-[#f1ddd9] bg-gradient-to-br from-white via-[#fff7f6] to-[#ffe9e7]"
        >
          {/* decorative brand glow — top right */}
          <div className="pointer-events-none absolute -right-20 -top-24 h-[480px] w-[480px] rounded-full bg-[#ffb3ac]/35 blur-[130px]" />
          <div className="pointer-events-none absolute left-1/4 top-1/2 h-72 w-72 rounded-full bg-[#ffd9d5]/40 blur-[120px]" />

          <div className="relative mx-auto w-full max-w-[1440px] px-4 pb-32 pt-14 sm:px-6 md:pb-40 md:pt-20 lg:px-10">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="max-w-[640px] space-y-7">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#ffc9c3] bg-white/70 px-4 py-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#b90014] backdrop-blur-sm animate-fade-in-up">
                  <span className="material-symbols-outlined text-[16px]">groups</span>
                  {t("landing.badge")}
                </span>

                <div className="space-y-5">
                  <h1 className="max-w-[12ch] text-[44px] font-bold leading-[0.98] tracking-[-0.04em] text-[#1a1c1c] animate-fade-in-up sm:text-[56px] lg:text-[64px]">
                    {renderHeroTitle(heroTitle)}
                  </h1>
                  <p className="max-w-[540px] text-[17px] leading-8 text-[#5f5e5e] animate-fade-in-up">
                    {heroSubtitle}
                  </p>
                </div>

                {/* feature highlights */}
                <div className="grid grid-cols-1 gap-4 animate-fade-in-up sm:grid-cols-3">
                  {heroFeatureItems.map((feature) => (
                    <div key={feature.key} className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#fff1f0] text-[#b90014]">
                        <span className="material-symbols-outlined text-[18px]">
                          {feature.icon}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold leading-tight text-[#1a1c1c]">
                          {t(`landing.${feature.key}Title`)}
                        </p>
                        <p className="mt-0.5 text-[12px] leading-tight text-[#6a6766]">
                          {t(`landing.${feature.key}Desc`)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-4 pt-1 animate-fade-in-up sm:flex-row">
                  <Link to="/jobs" className="btn btn-primary h-13 px-8 py-4 text-[16px]">
                    {t("landing.ctaBrowseJobs")}
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </Link>
                  <Link
                    to="/internal/login"
                    className="btn h-13 border-2 border-[#1a1c1c] bg-white px-8 py-4 text-[16px] font-bold text-[#1a1c1c] transition-colors hover:bg-[#f5f3f2]"
                  >
                    {t("landing.ctaTalentPool")}
                  </Link>
                </div>
              </div>

              <div className="group relative mx-auto w-full max-w-[600px] animate-fade-in-up">
                <div className="pointer-events-none absolute -inset-6 rounded-full bg-[#b90014]/10 blur-3xl transition-transform duration-700 group-hover:scale-110" />
                <div className="relative overflow-hidden rounded-[20px] border-4 border-white shadow-[0_30px_70px_-25px_rgba(185,0,20,0.35)] animate-scale-in">
                  <img
                    className="aspect-[4/3] w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                    alt={t("landing.heroImageAlt")}
                    src={heroImage}
                  />
                </div>

                {/* floating card — Match Score (top left) */}
                <div
                  className="absolute -left-3 top-8 hidden w-[190px] animate-float rounded-[16px] border border-[#f1e2e0] bg-white/95 p-4 shadow-[var(--shadow-lg)] backdrop-blur-sm sm:block"
                  style={{ animationDelay: "0s" }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[26px] font-bold leading-none text-[#b90014]">92%</p>
                    <svg viewBox="0 0 60 24" className="h-6 w-16" aria-hidden="true">
                      <polyline
                        points="0,20 12,15 24,17 36,9 48,11 60,2"
                        fill="none"
                        stroke="#059669"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <p className="mt-2 text-[13px] font-bold text-[#1a1c1c]">
                    {t("landing.matchScoreLabel")}
                  </p>
                  <p className="text-[11px] leading-tight text-[#8a8786]">
                    {t("landing.matchScoreHint")}
                  </p>
                </div>

                {/* floating card — Internal Transfer (right) */}
                <div
                  className="absolute -right-4 top-[38%] hidden w-[215px] animate-float rounded-[16px] border border-[#f1e2e0] bg-white/95 p-4 shadow-[var(--shadow-lg)] backdrop-blur-sm lg:block"
                  style={{ animationDelay: "1.3s" }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#b90014]">
                      {t("landing.transferLabel")}
                    </p>
                    <span className="material-symbols-outlined text-[16px] text-[#b90014]">
                      arrow_forward
                    </span>
                  </div>
                  <p className="mt-2 text-[14px] font-bold text-[#1a1c1c]">
                    {t("landing.transferRole")}
                  </p>
                  <p className="text-[11px] text-[#8a8786]">{t("landing.transferMeta")}</p>
                </div>

                {/* floating card — Interview Scheduled (bottom) */}
                <div
                  className="absolute -bottom-6 left-1/2 hidden w-[235px] -translate-x-1/2 animate-float items-center gap-3 rounded-[16px] border border-[#f1e2e0] bg-white/95 p-4 shadow-[var(--shadow-lg)] backdrop-blur-sm sm:flex"
                  style={{ animationDelay: "0.7s" }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff1f0] text-[#b90014]">
                    <span className="material-symbols-outlined text-[20px]">event</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[#1a1c1c]">
                      {t("landing.interviewLabel")}
                    </p>
                    <p className="text-[11px] text-[#8a8786]">{t("landing.interviewTime")}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#1a1c1c]">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {t("landing.interviewRole")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats — single elevated card overlapping the hero */}
        <section id="stats" className="relative z-10">
          <div className="mx-auto -mt-20 w-full max-w-[1180px] px-4 sm:px-6 md:-mt-24 lg:px-10">
            <div
              ref={stats.ref}
              className="overflow-hidden rounded-[22px] border border-[#f1e2e0] bg-white shadow-[0_30px_70px_-30px_rgba(26,28,28,0.30)]"
            >
              <div className="grid divide-y divide-[#f1e2e0] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                <LandingMetricCard
                  icon="groups"
                  label={t("landing.statInternalHires")}
                  sublabel={t("landing.statInternalHiresHint")}
                  value={homeData?.stats?.internalHires ?? 500}
                  suffix="+"
                  active={stats.inView}
                  delay={120}
                />
                <LandingMetricCard
                  icon="domain"
                  label={t("landing.statDepartments")}
                  sublabel={t("landing.statDepartmentsHint")}
                  value={homeData?.stats?.departments ?? 15}
                  active={stats.inView}
                  delay={220}
                />
                <LandingMetricCard
                  icon="star"
                  label={t("landing.statRating")}
                  value={homeData?.stats?.avgEmployeeRating ?? 4.8}
                  decimals={1}
                  stars
                  active={stats.inView}
                  delay={320}
                />
              </div>
            </div>
          </div>
        </section>

        <section id="careers" className="bg-white">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-20 sm:px-6 lg:px-10">
            <div className="mb-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-[34px] font-semibold tracking-[-0.03em] text-[#1a1c1c]">
                  {t("landing.featuredTitle")}
                </h2>
                <p className="mt-2 text-[17px] text-[#6a6766]">
                  {t("landing.featuredSubtitle")}
                </p>
              </div>
              <Link
                className="inline-flex items-center gap-2 self-start text-[15px] font-bold text-[#b90014] transition-all hover:gap-3"
                to="/jobs"
              >
                {t("landing.viewAllJobs")}
                <span className="material-symbols-outlined text-[18px]">trending_flat</span>
              </Link>
            </div>

            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-[16px] border border-[#ebd7d4] bg-white p-6 shadow-[var(--shadow-xs)]"
                  >
                    <div className="mb-5 flex gap-2">
                      <Skeleton className="h-7 w-14 rounded-md" />
                      <Skeleton className="h-7 w-16 rounded-md" />
                    </div>
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="mt-4 h-4 w-full" />
                    <Skeleton className="mt-2 h-4 w-11/12" />
                    <Skeleton className="mt-2 h-4 w-10/12" />
                    <div className="mt-8 border-t border-[#efe3e1] pt-6">
                      <div className="flex items-center justify-between gap-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : featuredJobs.length ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {featuredJobs.map((job) => (
                  <FeaturedJobCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <div className="rounded-[16px] border border-[#ebd7d4] bg-white p-8 text-center shadow-[var(--shadow-xs)]">
                <p className="text-[20px] font-semibold text-[#1a1c1c]">
                  {t("landing.emptyFeaturedTitle")}
                </p>
                <p className="mt-3 text-[15px] leading-7 text-[#5f5e5e]">
                  {t("landing.emptyFeaturedBody")}
                </p>
              </div>
            )}
          </div>
        </section>

        <section id="mobility" className="overflow-hidden bg-[#171818] text-white">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-20 sm:px-6 lg:px-10">
            <div className="grid items-center gap-14 lg:grid-cols-2">
              <div className="relative">
                <div className="absolute left-0 top-0 h-28 w-28 rounded-full bg-[#b90014]/20 blur-3xl" />
                <h2 className="max-w-[11ch] text-[46px] font-semibold leading-[1.02] tracking-[-0.05em] text-white sm:text-[58px]">
                  {t("landing.missionTitleLead")}{" "}
                  <span className="text-[#ffb4ac]">{t("landing.missionTitleAccent")}</span>
                </h2>
                <p className="mt-8 max-w-[600px] text-[18px] leading-8 text-white/72">
                  {t("landing.missionBody")}
                </p>

                <div className="mt-10 space-y-6">
                  {missionHighlightKeys.map((key) => (
                    <HighlightItem
                      key={key}
                      title={t(`landing.${key}Title`)}
                      description={t(`landing.${key}Desc`)}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-[16px]">
                    <img
                      className="aspect-[3/4] w-full object-cover"
                      alt={t("landing.missionImageTopAlt")}
                      src={MISSION_IMAGE_TOP}
                    />
                  </div>
                  <div className="rounded-[16px] border border-[#6e2e35] bg-[#4c161d] p-6">
                    <p className="text-[40px] font-semibold tracking-[-0.04em] text-white">74%</p>
                    <p className="mt-2 text-[15px] leading-6 text-white/70">
                      {t("landing.statPromoted")}
                    </p>
                  </div>
                </div>
                <div className="space-y-4 pt-10">
                  <div className="rounded-[16px] border border-white/10 bg-white/10 p-6">
                    <p className="text-[40px] font-semibold tracking-[-0.04em] text-white">3k+</p>
                    <p className="mt-2 text-[15px] leading-6 text-white/70">
                      {t("landing.statMentorship")}
                    </p>
                  </div>
                  <div className="overflow-hidden rounded-[16px]">
                    <img
                      className="aspect-[3/4] w-full object-cover"
                      alt={t("landing.missionImageBottomAlt")}
                      src={MISSION_IMAGE_BOTTOM}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="cta" className="bg-white">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-20 text-center sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-[44px] font-semibold tracking-[-0.04em] text-[#1a1c1c] sm:text-[56px]">
                {t("landing.ctaTitle")}
              </h2>
              <p className="mt-5 text-[18px] leading-8 text-[#5f5e5e]">
                {t("landing.ctaBody")}
              </p>
              <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
                <Link to="/jobs" className="btn btn-primary h-14 px-10 text-[18px]">
                  {t("landing.ctaExplore")}
                </Link>
                <Link
                  to="/internal/login"
                  className="btn h-14 border-2 border-[#b90014] bg-white px-10 text-[18px] font-bold text-[#b90014] transition-colors hover:bg-[#fff6f5]"
                >
                  {t("landing.ctaContact")}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default LandingPageScreen;
