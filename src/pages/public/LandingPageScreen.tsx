import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Skeleton } from "../../common/components/Skeleton";
import {
  getEmploymentTypeBadgeClass,
  getWorkModeChipClass,
} from "../../common/utils/jobPresentation";
import { jobsService } from "../../services/jobs/jobsService";
import { publicService } from "../../services/public/publicService";

type HomeResponseDto = {
  hero?: {
    title: string;
    subtitle: string;
    backgroundImageUrl: string;
  };
  stats?: {
    internalHires: number;
    departments: number;
    avgEmployeeRating: number;
  };
  featuredJobs: Array<{
    id: string;
    title: string;
    department: string;
    location: string;
    workMode: string;
    employmentType: string;
    tag: string;
  }>;
};

const platformBenefits = [
  {
    icon: "radar",
    title: "Matching rõ ràng hơn",
    description:
      "Đề xuất vị trí theo kỹ năng, kinh nghiệm và ngữ cảnh nội bộ thay vì chỉ lọc từ khóa.",
  },
  {
    icon: "timer",
    title: "Ra quyết định nhanh hơn",
    description:
      "Tập trung vào các vị trí đang tuyển gấp, deadline gần và luồng ứng tuyển ít ma sát hơn.",
  },
  {
    icon: "domain",
    title: "Phối hợp đa phòng ban",
    description:
      "HR, quản lý tuyển dụng và ứng viên nhìn chung một bức tranh thay vì các bước rời rạc.",
  },
];

const workflowSteps = [
  {
    step: "01",
    title: "Khám phá đúng cơ hội",
    description:
      "Từ trang chủ, nhân sự nội bộ có thể nhìn thấy ngay vị trí nổi bật, nhóm đang tuyển và ngữ cảnh phù hợp.",
  },
  {
    step: "02",
    title: "Ứng tuyển với ít thao tác",
    description:
      "Hồ sơ, kỹ năng và lịch sử ứng tuyển được tận dụng lại để rút ngắn thời gian nộp đơn.",
  },
  {
    step: "03",
    title: "Theo dõi tiến trình minh bạch",
    description:
      "Từ dashboard đến thông báo, mọi cập nhật được hiển thị theo một luồng rõ ràng và dễ hành động.",
  },
];

const successStories = [
  {
    quote:
      "RecruitPro giúp chúng tôi đưa những vị trí nội bộ quan trọng ra đúng người nhanh hơn rất nhiều. Cảm giác như cả quy trình finally thở được.",
    name: "Minh Chau",
    role: "Talent Acquisition Lead",
  },
  {
    quote:
      "Điểm mình thích nhất là sự gọn gàng. Không còn cảm giác phải đào trong nhiều màn hình để tìm việc phù hợp và theo dõi trạng thái.",
    name: "Thanh Ha",
    role: "Senior Product Designer",
  },
  {
    quote:
      "Landing page mới cho cảm giác đây là một sản phẩm thật sự được chăm chút, không phải một bản demo ghép nhanh.",
    name: "Ngoc Huy",
    role: "Engineering Manager",
  },
];

function normalizeFeaturedJobs(data?: HomeResponseDto | null) {
  return data?.featuredJobs ?? [];
}

function LandingPageScreen() {
  const [homeData, setHomeData] = useState<HomeResponseDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.allSettled([
      publicService.getHome(),
      jobsService.listPublicJobs({ page: 1, pageSize: 4, sortBy: "newest" }),
    ])
      .then(([homeResult, jobsResult]) => {
        if (!mounted) return;

        const homePayload =
          homeResult.status === "fulfilled" ? homeResult.value.data ?? null : null;
        const jobsPayload =
          jobsResult.status === "fulfilled" ? jobsResult.value.data?.items ?? [] : [];

        const fallbackJobs = jobsPayload.slice(0, 4).map((job, index) => ({
          id: job.id,
          title: job.title,
          department:
            typeof job.department === "string"
              ? job.department
              : job.department?.name ?? "Phòng ban chung",
          location: job.location,
          workMode: job.workMode,
          employmentType: job.employmentType,
          tag: index === 0 ? "Mới" : "Đang tuyển",
        }));

        setHomeData({
          hero: homePayload?.hero,
          stats: homePayload?.stats,
          featuredJobs:
            homePayload?.featuredJobs?.length
              ? homePayload.featuredJobs
              : fallbackJobs,
        });
      })
      .catch(() => {
        if (!mounted) return;
        setHomeData({ featuredJobs: [] });
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const featuredJobs = normalizeFeaturedJobs(homeData);
  const heroTitle =
    homeData?.hero?.title ?? "Nền tảng tuyển dụng nội bộ giúp cơ hội tốt tìm đúng người";
  const heroSubtitle =
    homeData?.hero?.subtitle ??
    "Từ khám phá cơ hội, ứng tuyển, đến theo dõi tiến trình, RecruitPro biến trải nghiệm tuyển dụng nội bộ thành một luồng làm việc hiện đại, rõ ràng và đáng tin cậy.";
  const stats = [
    {
      value: `${homeData?.stats?.internalHires ?? 500}+`,
      label: "Lượt dịch chuyển nội bộ",
      helper: "Tăng khả năng giữ chân nhân sự giỏi bằng cơ hội nhìn thấy được.",
    },
    {
      value: String(homeData?.stats?.departments ?? 15),
      label: "Phòng ban kết nối",
      helper: "Một bề mặt chung cho HR, quản lý tuyển dụng và ứng viên nội bộ.",
    },
    {
      value: `${homeData?.stats?.avgEmployeeRating ?? 4.8}/5`,
      label: "Điểm hài lòng trung bình",
      helper: "Trải nghiệm được tối ưu để ít ma sát hơn trong những bước quan trọng.",
    },
  ];

  return (
    <div className="overflow-hidden bg-[#f6f3ef] text-[#171717]">
      <main>
        <section
          id="home"
          className="relative border-b border-[#e8e0d9] bg-[#f6f3ef]"
        >
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute left-[-12%] top-16 h-72 w-72 rounded-full bg-[#efe4dc]" />
            <div className="absolute right-[-6%] top-10 h-96 w-96 rounded-full border border-[#e8ddd5]" />
            <div className="absolute bottom-10 left-1/3 h-48 w-48 rounded-full border border-[#eadfd8]" />
            <div className="absolute inset-x-0 top-0 h-full bg-[linear-gradient(to_right,rgba(140,120,108,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(140,120,108,0.08)_1px,transparent_1px)] bg-[size:32px_32px] opacity-30" />
          </div>

          <div className="relative mx-auto w-full max-w-[1560px] px-4 py-14 sm:px-6 lg:px-10 lg:py-20 xl:px-12">
            <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)] xl:gap-14">
              <div className="max-w-[760px]">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#e3d6ce] bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7b5b4b] shadow-[var(--shadow-xs)] animate-fade-in-up">
                  <span className="h-2 w-2 rounded-full bg-[#b90014]" />
                  Internal mobility, upgraded
                </span>

                <h1 className="mt-5 max-w-[12ch] text-[42px] font-semibold leading-[1.02] tracking-[-0.04em] text-[#161616] animate-fade-in-up md:text-[60px] xl:text-[76px]">
                  {heroTitle}
                </h1>

                <p className="mt-5 max-w-[62ch] text-[16px] leading-7 text-[#5f5e5e] animate-fade-in-up md:text-[18px]">
                  {heroSubtitle}
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row animate-fade-in-up">
                  <Link to="/jobs" className="btn btn-primary h-12 px-6">
                    Khám phá vị trí mở
                    <span className="material-symbols-outlined text-[18px]">north_east</span>
                  </Link>
                  <Link
                    to="/internal/login"
                    className="btn btn-secondary h-12 border-[#d8cbc3] px-6"
                  >
                    Vào cổng nội bộ
                    <span className="material-symbols-outlined text-[18px]">badge</span>
                  </Link>
                </div>

                <div className="mt-10 grid gap-3 sm:grid-cols-3 animate-fade-in-up">
                  {stats.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[16px] border border-[#e4d8d0] bg-white px-4 py-4 shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
                    >
                      <p className="text-[28px] font-semibold tracking-[-0.03em] text-[#161616]">
                        {item.value}
                      </p>
                      <p className="mt-2 text-[13px] font-semibold text-[#2f2f2f]">
                        {item.label}
                      </p>
                      <p className="mt-1 text-[12px] leading-5 text-[#7a7776]">
                        {item.helper}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-6 top-8 hidden h-24 w-24 rounded-[28px] border border-[#ddd0c7] bg-white shadow-[var(--shadow-sm)] lg:block" />
                <div className="absolute -right-5 bottom-10 hidden h-28 w-28 rounded-full border border-[#e2d7cf] bg-[#faf7f4] lg:block" />

                <div className="rounded-[28px] border border-[#dfd2ca] bg-[#fcfbf9] p-4 shadow-[0_24px_50px_-30px_rgba(26,28,28,0.22)] sm:p-5">
                  <div className="rounded-[24px] border border-[#ebe1db] bg-white p-5 shadow-[var(--shadow-sm)]">
                    <div className="flex items-center justify-between gap-4 border-b border-[#f0e9e4] pb-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a8786]">
                          Dashboard preview
                        </p>
                        <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-[#171717]">
                          Tuyển dụng nội bộ, rõ ràng hơn
                        </h2>
                      </div>
                      <div className="rounded-[14px] border border-[#e7ddd7] bg-[#faf7f5] px-3 py-2 text-right">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8786]">
                          Live
                        </p>
                        <p className="text-[18px] font-semibold text-[#b90014]">24 jobs</p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      {[
                        ["Ứng viên phù hợp", "132"],
                        ["Phỏng vấn tuần này", "18"],
                        ["Job ưu tiên", "06"],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-[18px] border border-[#ece4de] bg-[#fcfaf8] px-4 py-4"
                        >
                          <p className="text-[12px] font-semibold text-[#8a8786]">{label}</p>
                          <p className="mt-2 text-[26px] font-semibold tracking-[-0.03em] text-[#171717]">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(260px,0.9fr)]">
                      <div className="rounded-[22px] border border-[#ece4de] bg-[#fcfaf8] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8a8786]">
                              Job spotlight
                            </p>
                            <h3 className="mt-2 text-[19px] font-semibold text-[#171717]">
                              Senior Product Designer
                            </h3>
                          </div>
                          <span className="badge bg-[#fff1f0] text-[#b90014]">
                            Gấp
                          </span>
                        </div>
                        <p className="mt-3 text-[14px] leading-6 text-[#5f5e5e]">
                          Hybrid, Product Design, tập trung vào candidate experience và hệ thống nội bộ.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className={getWorkModeChipClass()}>Hybrid</span>
                          <span className={getEmploymentTypeBadgeClass("Full-time")}>
                            Full-time
                          </span>
                        </div>
                      </div>

                      <div className="rounded-[22px] border border-[#ece4de] bg-[#171717] p-4 text-white">
                        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/60">
                          Weekly pulse
                        </p>
                        <div className="mt-4 space-y-3">
                          {[
                            ["Tỉ lệ apply hoàn tất", "89%"],
                            ["Thời gian phản hồi đầu tiên", "1.8 ngày"],
                            ["Job được xem nhiều nhất", "Engineering"],
                          ].map(([label, value]) => (
                            <div
                              key={label}
                              className="rounded-[16px] border border-white/10 bg-white/5 px-4 py-3"
                            >
                              <p className="text-[12px] text-white/60">{label}</p>
                              <p className="mt-1 text-[16px] font-semibold">{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="platform" className="border-b border-[#e8e0d9] bg-[#f8f4f0]">
          <div className="mx-auto w-full max-w-[1560px] px-4 py-18 sm:px-6 lg:px-10 xl:px-12">
            <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-[760px]">
                <p className="eyebrow">Platform Benefits</p>
                <h2 className="mt-3 text-[34px] font-semibold leading-[1.08] tracking-[-0.03em] text-[#171717] md:text-[46px]">
                  Một landing page nên kể được vì sao sản phẩm này đáng tin
                </h2>
              </div>
              <p className="max-w-[520px] text-[15px] leading-7 text-[#5f5e5e]">
                Thay vì những khối rời rạc, RecruitPro giờ mở đầu bằng một câu chuyện rõ hơn:
                khám phá cơ hội, ra quyết định nhanh hơn và nhìn thấy tiến trình minh bạch hơn.
              </p>
            </div>

            <div className="stagger grid gap-5 lg:grid-cols-3">
              {platformBenefits.map((item) => (
                <article
                  key={item.title}
                  className="rounded-[22px] border border-[#e3d8d0] bg-white p-6 shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-[#f0e5df] bg-[#fbf7f4] text-[#b90014]">
                    <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                  </div>
                  <h3 className="mt-5 text-[22px] font-semibold tracking-[-0.02em] text-[#171717]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-7 text-[#5f5e5e]">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="careers" className="border-b border-[#e8e0d9] bg-[#f6f3ef]">
          <div className="mx-auto w-full max-w-[1560px] px-4 py-18 sm:px-6 lg:px-10 xl:px-12">
            <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-[720px]">
                <p className="eyebrow">Featured Jobs</p>
                <h2 className="mt-3 text-[34px] font-semibold leading-[1.08] tracking-[-0.03em] text-[#171717] md:text-[46px]">
                  Cơ hội nổi bật được trình bày như một sản phẩm, không chỉ là danh sách
                </h2>
              </div>
              <Link
                className="btn btn-secondary h-11 border-[#d9ccc4] px-5"
                to="/jobs"
              >
                Xem toàn bộ việc làm
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </div>

            {loading ? (
              <div className="grid gap-5 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-[22px] border border-[#e3d8d0] bg-white p-6 shadow-[var(--shadow-sm)]"
                  >
                    <Skeleton className="h-12 w-12 rounded-[14px]" />
                    <Skeleton className="mt-5 h-6 w-2/3" />
                    <Skeleton className="mt-3 h-4 w-5/6" />
                    <Skeleton className="mt-2 h-4 w-2/3" />
                    <div className="mt-6 flex gap-2">
                      <Skeleton className="h-7 w-20 rounded-full" />
                      <Skeleton className="h-7 w-24 rounded-full" />
                    </div>
                    <Skeleton className="mt-8 h-11 w-full rounded-[12px]" />
                  </div>
                ))}
              </div>
            ) : featuredJobs.length ? (
              <div className="stagger grid gap-5 lg:grid-cols-3">
                {featuredJobs.map((job, index) => (
                  <article
                    key={job.id}
                    className="group rounded-[22px] border border-[#e3d8d0] bg-white p-6 shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#d9c7be] hover:shadow-[var(--shadow-md)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-[#eee3dc] bg-[#faf7f4] text-[#b90014] transition-transform duration-200 group-hover:scale-105">
                        <span className="material-symbols-outlined text-[22px]">
                          {index % 3 === 0
                            ? "monitoring"
                            : index % 3 === 1
                              ? "hub"
                              : "rocket_launch"}
                        </span>
                      </div>
                      <span
                        className={`badge ${
                          job.tag === "Mới"
                            ? "bg-[#fff1f0] text-[#b90014]"
                            : "bg-[#f2efed] text-[#5f5e5e]"
                        }`}
                      >
                        {job.tag}
                      </span>
                    </div>

                    <h3 className="mt-5 text-[22px] font-semibold leading-[1.18] tracking-[-0.02em] text-[#171717] transition-colors duration-200 group-hover:text-[#b90014]">
                      {job.title}
                    </h3>

                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-[#5f5e5e]">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">apartment</span>
                        {job.department}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">location_on</span>
                        {job.location}
                      </span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <span className={getWorkModeChipClass()}>{job.workMode}</span>
                      <span className={getEmploymentTypeBadgeClass(job.employmentType)}>
                        {job.employmentType}
                      </span>
                    </div>

                    <p className="mt-5 text-[14px] leading-6 text-[#6a6766]">
                      Vai trò phù hợp với những ứng viên nội bộ muốn bước sang một nhịp phát triển tiếp theo nhưng vẫn giữ đà cộng tác với tổ chức hiện tại.
                    </p>

                    <Link
                      className="btn btn-secondary mt-8 h-11 w-full border-[#dccfc8] text-[#1a1c1c] group-hover:border-[#cdbcb1]"
                      to={`/jobs/${job.id}`}
                    >
                      Xem chi tiết vị trí
                      <span className="material-symbols-outlined text-[18px] transition-transform duration-200 group-hover:translate-x-0.5">
                        arrow_forward
                      </span>
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-[22px] border border-[#e3d8d0] bg-white p-8 text-center shadow-[var(--shadow-sm)]">
                <p className="text-[18px] font-semibold text-[#171717]">
                  Chưa có vị trí nổi bật để hiển thị
                </p>
                <p className="mt-2 text-[14px] leading-6 text-[#5f5e5e]">
                  Khi dữ liệu tuyển dụng sẵn sàng, phần này sẽ tự động cập nhật từ hệ thống public jobs.
                </p>
              </div>
            )}
          </div>
        </section>

        <section id="how-it-works" className="border-b border-[#e8e0d9] bg-white">
          <div className="mx-auto grid w-full max-w-[1560px] gap-8 px-4 py-18 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:px-10 xl:px-12">
            <div className="max-w-[560px]">
              <p className="eyebrow">How It Works</p>
              <h2 className="mt-3 text-[34px] font-semibold leading-[1.08] tracking-[-0.03em] text-[#171717] md:text-[46px]">
                Luồng trải nghiệm được thiết kế để người dùng ít phải nghĩ hơn
              </h2>
              <p className="mt-5 text-[15px] leading-7 text-[#5f5e5e]">
                Một landing page tốt không chỉ đẹp ở first impression. Nó phải giúp người dùng hiểu nhanh hệ thống sẽ hỗ trợ họ ở đâu và vì sao nên tin tưởng sản phẩm này.
              </p>
            </div>

            <div className="space-y-4">
              {workflowSteps.map((item) => (
                <article
                  key={item.step}
                  className="rounded-[22px] border border-[#e7dfd9] bg-[#fcfaf8] p-6 shadow-[var(--shadow-xs)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#b90014]">
                        Bước {item.step}
                      </p>
                      <h3 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-[#171717]">
                        {item.title}
                      </h3>
                    </div>
                    <span className="material-symbols-outlined text-[24px] text-[#b90014]">
                      north_east
                    </span>
                  </div>
                  <p className="mt-4 max-w-[70ch] text-[15px] leading-7 text-[#5f5e5e]">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="metrics" className="border-b border-[#e8e0d9] bg-[#f8f4f0]">
          <div className="mx-auto w-full max-w-[1560px] px-4 py-18 sm:px-6 lg:px-10 xl:px-12">
            <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-[700px]">
                <p className="eyebrow">Statistics</p>
                <h2 className="mt-3 text-[34px] font-semibold leading-[1.08] tracking-[-0.03em] text-[#171717] md:text-[46px]">
                  Các chỉ số được đặt trong đúng bối cảnh để hỗ trợ ra quyết định
                </h2>
              </div>
              <p className="max-w-[520px] text-[15px] leading-7 text-[#5f5e5e]">
                Tránh nhồi dashboard bằng những con số vô hồn. Chỉ số tốt là chỉ số giúp người dùng biết phải làm gì tiếp theo.
              </p>
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
              <div className="rounded-[24px] border border-[#e4d9d1] bg-white p-6 shadow-[var(--shadow-sm)]">
                <div className="grid gap-4 md:grid-cols-3">
                  {stats.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[18px] border border-[#ede4de] bg-[#fcfaf8] p-4"
                    >
                      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8a8786]">
                        {item.label}
                      </p>
                      <p className="mt-3 text-[36px] font-semibold tracking-[-0.04em] text-[#171717]">
                        {item.value}
                      </p>
                      <p className="mt-2 text-[13px] leading-6 text-[#666261]">
                        {item.helper}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-[#e4d9d1] bg-[#171717] p-6 text-white shadow-[var(--shadow-sm)]">
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/55">
                  Insight
                </p>
                <h3 className="mt-3 text-[28px] font-semibold leading-[1.14] tracking-[-0.03em]">
                  Không cần màu mè để trông premium
                </h3>
                <p className="mt-4 text-[15px] leading-7 text-white/72">
                  Chất lượng ở đây đến từ spacing, typography, nhịp điệu section và cảm giác hệ thống đã được tổ chức. Đó là thứ làm sản phẩm trông trưởng thành.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="stories" className="border-b border-[#e8e0d9] bg-white">
          <div className="mx-auto w-full max-w-[1560px] px-4 py-18 sm:px-6 lg:px-10 xl:px-12">
            <div className="mb-10 max-w-[760px]">
              <p className="eyebrow">Success Stories</p>
              <h2 className="mt-3 text-[34px] font-semibold leading-[1.08] tracking-[-0.03em] text-[#171717] md:text-[46px]">
                Những phản hồi đúng kiểu của một sản phẩm đã sẵn sàng đưa vào môi trường thật
              </h2>
            </div>

            <div className="stagger grid gap-5 lg:grid-cols-3">
              {successStories.map((item) => (
                <article
                  key={item.name}
                  className="rounded-[22px] border border-[#e4dad3] bg-[#fcfaf8] p-6 shadow-[var(--shadow-xs)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]"
                >
                  <span className="material-symbols-outlined text-[26px] text-[#b90014]">
                    format_quote
                  </span>
                  <p className="mt-4 text-[16px] leading-7 text-[#353434]">
                    {item.quote}
                  </p>
                  <div className="mt-6 border-t border-[#ebe2dc] pt-4">
                    <p className="text-[15px] font-semibold text-[#171717]">{item.name}</p>
                    <p className="mt-1 text-[13px] text-[#7a7776]">{item.role}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="cta" className="bg-[#171717]">
          <div className="mx-auto w-full max-w-[1560px] px-4 py-18 sm:px-6 lg:px-10 xl:px-12">
            <div className="rounded-[28px] border border-white/10 bg-white/4 p-8 shadow-[0_24px_48px_-32px_rgba(0,0,0,0.65)] backdrop-blur-sm md:p-10">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-[760px]">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#ffb3ac]">
                    Ready to move
                  </p>
                  <h2 className="mt-3 text-[34px] font-semibold leading-[1.06] tracking-[-0.03em] text-white md:text-[48px]">
                    Mở ứng dụng và cảm nhận đây là một nền tảng tuyển dụng nội bộ thực sự trưởng thành
                  </h2>
                  <p className="mt-4 text-[15px] leading-7 text-white/70">
                    Khám phá việc làm đang mở, đăng nhập vào cổng nội bộ hoặc tiếp tục tối ưu hành trình ứng viên với giao diện nhất quán hơn trên toàn hệ thống.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link to="/jobs" className="btn btn-primary h-12 px-6">
                    Xem việc làm mở
                  </Link>
                  <Link
                    to="/login"
                    className="btn h-12 border border-white/20 bg-transparent px-6 text-white hover:bg-white/10"
                  >
                    Đăng nhập ứng viên
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default LandingPageScreen;
