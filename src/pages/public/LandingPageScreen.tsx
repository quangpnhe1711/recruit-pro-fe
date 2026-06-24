import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Skeleton } from "../../common/components/Skeleton";
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

const missionHighlights = [
  {
    title: "Guaranteed Feedback",
    description: "Every internal applicant receives a 1-on-1 with the hiring manager.",
  },
  {
    title: "Shadowing Program",
    description: "Test drive a new role for a week before you officially apply.",
  },
];

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

function LandingMetricCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-5 rounded-[18px] px-4 py-4 transition-transform duration-200 hover:-translate-y-0.5">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[12px] bg-[#fff1f0] text-[#b90014]">
        <span className="material-symbols-outlined text-[22px]">{icon}</span>
      </div>
      <div>
        <p className="text-[19px] font-semibold tracking-[-0.02em] text-[#1a1c1c]">
          {value}
        </p>
        <p className="mt-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6e6c6b]">
          {label}
        </p>
      </div>
    </div>
  );
}

function FeaturedJobCard({ job }: { job: FeaturedJobCardModel }) {
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
          aria-label={`Lưu vị trí ${job.title}`}
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
          : `${job.department} đang tìm kiếm nhân sự nội bộ phù hợp để tăng tốc đội ngũ và mở rộng ảnh hưởng trong những dự án quan trọng.`}
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
          Apply Now
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
  const [homeData, setHomeData] = useState<HomeResponseDto | null>(null);
  const [featuredJobs, setFeaturedJobs] = useState<FeaturedJobCardModel[]>([]);
  const [loading, setLoading] = useState(true);

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

  const heroTitle =
    homeData?.hero?.title ?? "Empowering Your Career Growth Within RecruitPro";
  const heroSubtitle =
    homeData?.hero?.subtitle ??
    "Discover the next phase of your professional journey without ever leaving the company. Unlock hidden opportunities and grow with a world-class team.";
  const heroImage = homeData?.hero?.backgroundImageUrl || DEFAULT_HERO_IMAGE;

  return (
    <div className="overflow-hidden bg-[#f9f9f9] text-[#1a1c1c]">
      <main>
        <section id="home" className="border-b border-[#edd8d4] bg-white">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-16 sm:px-6 md:py-24 lg:px-10 xl:py-28">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="max-w-[640px] space-y-8">
                <span className="inline-flex rounded-full bg-[#e31b23] px-4 py-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-white">
                  Internal Mobility First
                </span>

                <div className="space-y-5">
                  <h1 className="max-w-[11ch] text-[48px] font-semibold leading-[0.98] tracking-[-0.05em] text-[#1a1c1c] animate-fade-in-up sm:text-[58px] lg:text-[72px]">
                    {heroTitle}
                  </h1>
                  <p className="max-w-[580px] text-[18px] leading-8 text-[#5f5e5e] animate-fade-in-up">
                    {heroSubtitle}
                  </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row animate-fade-in-up">
                  <Link to="/jobs" className="btn btn-primary h-13 px-8 py-4 text-[16px]">
                    Browse Openings
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </Link>
                  <Link
                    to="/internal/login"
                    className="btn h-13 border-2 border-[#1a1c1c] bg-white px-8 py-4 text-[16px] font-bold text-[#1a1c1c] transition-colors hover:bg-[#f5f3f2]"
                  >
                    Internal Talent Pool
                  </Link>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-6 rounded-full bg-[#b90014]/10 blur-3xl" />
                <div className="relative overflow-hidden rounded-[16px] border border-[#eddad6] shadow-[0_28px_60px_-30px_rgba(26,28,28,0.35)]">
                  <img
                    className="aspect-[4/3] w-full object-cover"
                    alt="RecruitPro internal mobility platform hero"
                    src={heroImage}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="stats" className="border-y border-[#edd8d4] bg-[#f3f1f0]">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 lg:px-10">
            <div className="grid gap-6 md:grid-cols-3">
              <LandingMetricCard
                icon="groups"
                label="Internal Hires"
                value={`${homeData?.stats?.internalHires ?? 500}+`}
              />
              <LandingMetricCard
                icon="domain"
                label="Departments"
                value={String(homeData?.stats?.departments ?? 15)}
              />
              <LandingMetricCard
                icon="star"
                label="Avg Employee Rating"
                value={String(homeData?.stats?.avgEmployeeRating ?? 4.8)}
              />
            </div>
          </div>
        </section>

        <section id="careers" className="bg-white">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-20 sm:px-6 lg:px-10">
            <div className="mb-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-[34px] font-semibold tracking-[-0.03em] text-[#1a1c1c]">
                  Featured Internal Openings
                </h2>
                <p className="mt-2 text-[17px] text-[#6a6766]">
                  Your next big career jump is just a click away.
                </p>
              </div>
              <Link
                className="inline-flex items-center gap-2 self-start text-[15px] font-bold text-[#b90014] transition-all hover:gap-3"
                to="/jobs"
              >
                View All Jobs
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
                  Chưa có vị trí nổi bật để hiển thị
                </p>
                <p className="mt-3 text-[15px] leading-7 text-[#5f5e5e]">
                  Khi hệ thống có dữ liệu tuyển dụng public, phần Featured Internal Openings sẽ tự động hiển thị từ API hiện tại.
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
                  Ready to script your <span className="text-[#ffb4ac]">next chapter?</span>
                </h2>
                <p className="mt-8 max-w-[600px] text-[18px] leading-8 text-white/72">
                  At RecruitPro, we believe the best talent is already here. We prioritize internal growth, providing the mentorship, resources, and transparency needed to pivot into new roles or scale up your current path.
                </p>

                <div className="mt-10 space-y-6">
                  {missionHighlights.map((item) => (
                    <HighlightItem
                      key={item.title}
                      title={item.title}
                      description={item.description}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-[16px]">
                    <img
                      className="aspect-[3/4] w-full object-cover"
                      alt="RecruitPro mobility analytics"
                      src={MISSION_IMAGE_TOP}
                    />
                  </div>
                  <div className="rounded-[16px] border border-[#6e2e35] bg-[#4c161d] p-6">
                    <p className="text-[40px] font-semibold tracking-[-0.04em] text-white">74%</p>
                    <p className="mt-2 text-[15px] leading-6 text-white/70">
                      Managers promoted internally last year
                    </p>
                  </div>
                </div>
                <div className="space-y-4 pt-10">
                  <div className="rounded-[16px] border border-white/10 bg-white/10 p-6">
                    <p className="text-[40px] font-semibold tracking-[-0.04em] text-white">3k+</p>
                    <p className="mt-2 text-[15px] leading-6 text-white/70">
                      Mentorship sessions completed
                    </p>
                  </div>
                  <div className="overflow-hidden rounded-[16px]">
                    <img
                      className="aspect-[3/4] w-full object-cover"
                      alt="RecruitPro collaboration team"
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
                Your future self is calling.
              </h2>
              <p className="mt-5 text-[18px] leading-8 text-[#5f5e5e]">
                Join the thousands of RecruitPro teammates who have redefined their careers within our walls.
              </p>
              <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
                <Link to="/jobs" className="btn btn-primary h-14 px-10 text-[18px]">
                  Explore Career Paths
                </Link>
                <Link
                  to="/internal/login"
                  className="btn h-14 border-2 border-[#b90014] bg-white px-10 text-[18px] font-bold text-[#b90014] transition-colors hover:bg-[#fff6f5]"
                >
                  Contact Talent Ops
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
