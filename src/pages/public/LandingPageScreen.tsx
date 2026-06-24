import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { jobsService } from "../../services/jobs/jobsService";

type HomeResponseDto = {
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

function LandingPageScreen() {
  const [homeData, setHomeData] = useState<HomeResponseDto | null>(null);

  useEffect(() => {
    let mounted = true;

    jobsService
      .listPublicJobs({ page: 1, pageSize: 3, sortBy: "newest" })
      .then((res) => {
        if (!mounted || !res.data) return;

        setHomeData({
          featuredJobs: res.data.items.slice(0, 3).map((job, index) => ({
            id: job.id,
            title: job.title,
            department: typeof job.department === "string" ? job.department : job.department?.name ?? "Phòng ban chung",
            location: job.location,
            workMode: job.workMode,
            employmentType: job.employmentType,
            tag: index === 0 ? "Mới" : "Đang tuyển",
          })),
        });
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  const featuredJobs = homeData?.featuredJobs ?? [];
  const hero = homeData?.hero;
  const stats = homeData?.stats;

  return (
    <div className="bg-[#f9f9f9] text-[#1a1c1c] selected-none">
      <main>
        {/* Hero */}
        <section
          id="home"
          className="relative h-[819px] min-h-[600px] flex items-center overflow-hidden"
        >
          <div className="absolute inset-0 z-0">
            <img
              className="w-full h-full object-cover"
              alt="Tòa nhà văn phòng hiện đại về đêm"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4mMkFjad2Mv7czUqOat_Dv9dxd07AIa5nlU9O8qjVhsZskDtxGEiVUuIsyQeIXb9rmgrPvoZl1PR5eH32Wt83SHmosxD8SR7kug1zG2joNkBtYT8pLZG9uvajZmTqKlhnHgP7VJXas5pg-4VnnP9FJrUYmZ_F9RGfU62Wf0rMh0d6QG-u1eu6XMlZuiuYO6gszzoYJvEzx2PqhMCb1glEzYhBWWW8DQz_4mWQnX2N01BZYBqH4denQbSWkt7NRtz5b_nyCA-9vQ"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/95 to-[#b90014]/70 opacity-90" />
          </div>

          <div className="relative z-10 w-full px-4 md:px-[40px]  ">
            <div className="max-w-3xl">
              <span className="inline-block px-4 py-1 bg-[#b90014] text-white text-[12px] font-semibold tracking-[0.05em] mb-6">
                CỔNG NỘI BỘ
              </span>
              <h1 className="text-white text-[44px] md:text-[64px] leading-[1.1] font-extrabold tracking-tight mb-8">
                {hero?.title ? (
                  hero.title
                ) : (
                  <>
                    Mở rộng <br />
                    cơ hội phát triển sự nghiệp tại{" "}
                    <span className="text-[#ffdad6]">RecruitPro</span>
                  </>
                )}
              </h1>
              <p className="text-[#eeeeee] text-[16px] leading-6 mb-10 max-w-xl">
                {hero?.subtitle ??
                  "Khám phá các cơ hội nội bộ nổi bật và tiến thêm một bước trong hành trình nghề nghiệp cùng đội ngũ bạn đã hiểu và tin tưởng."}
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  to="/candidate/jobs"
                  className="px-8 py-4 bg-[#b90014] text-white font-bold text-[12px] tracking-[0.05em] hover:scale-[1.02] transition-transform active:scale-95 text-center"
                >
                  Xem vị trí đang tuyển
                </Link>
                <Link
                  to="/internal/login"
                  className="px-8 py-4 bg-white text-[#1A1A1A] font-bold text-[12px] tracking-[0.05em] border border-[#1A1A1A] hover:bg-gray-100 transition-colors text-center"
                >
                  Cổng nội bộ
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-[#1A1A1A] py-16">
          <div className="px-4 md:px-[40px]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="p-8 md:border-r md:border-white/10 md:last:border-r-0">
                <h2 className="text-[#b90014] text-[48px] font-extrabold mb-2">
                  {stats ? `${stats.internalHires}+` : "500+"}
                </h2>
                <p className="text-[#e5e2e1] text-[12px] font-semibold tracking-[0.18em]">
                  TUYỂN DỤNG NỘI BỘ
                </p>
              </div>
              <div className="p-8 md:border-r md:border-white/10 md:last:border-r-0">
                <h2 className="text-[#b90014] text-[48px] font-extrabold mb-2">
                  {stats?.departments ?? 15}
                </h2>
                <p className="text-[#e5e2e1] text-[12px] font-semibold tracking-[0.18em]">
                  PHÒNG BAN
                </p>
              </div>
              <div className="p-8">
                <h2 className="text-[#b90014] text-[48px] font-extrabold mb-2">
                  {stats?.avgEmployeeRating ?? 4.8}
                </h2>
                <p className="text-[#e5e2e1] text-[12px] font-semibold tracking-[0.18em]">
                  ĐIỂM ĐÁNH GIÁ TB
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Jobs */}
        <section id="careers" className="py-24 bg-[#f9f9f9]">
          <div className="px-4 md:px-[40px]">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div>
                <h2 className="text-[32px] leading-10 tracking-[-0.01em] font-semibold text-[#1a1c1c] mb-4">
                  Vị trí nội bộ nổi bật
                </h2>
                <p className="text-[#5f5e5e] text-[16px] leading-6 max-w-xl">
                  Ưu tiên dành cho nhân sự nội bộ. Phát triển sự nghiệp mà vẫn
                  gắn bó với môi trường bạn đã quen thuộc.
                </p>
              </div>
              <Link
                className="text-[#b90014] font-bold flex items-center gap-2 hover:underline"
                to="/jobs"
              >
                Xem tất cả việc làm{" "}
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredJobs.map((job, index) => (
                <div
                  key={job.id}
                  className="bg-white border border-[#e2dfde] p-8 hover:border-[#b90014] transition-colors group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="bg-[#eeeeee] p-3">
                      <span className="material-symbols-outlined text-[#b90014]">
                        {index % 3 === 0 ? "engineering" : index % 3 === 1 ? "campaign" : "monitoring"}
                      </span>
                    </div>
                    <span
                      className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        job.tag === "Mới" ? "bg-[#b90014]/10 text-[#b90014]" : "bg-[#eeeeee] text-[#5f5e5e]"
                      }`}
                    >
                      {job.tag}
                    </span>
                  </div>
                  <h3 className="text-[20px] leading-7 font-semibold text-[#1a1c1c] mb-2 group-hover:text-[#b90014] transition-colors">
                    {job.title}
                  </h3>
                  <p className="text-[#5f5e5e] text-[14px] leading-5 mb-6">
                    {job.department} | {job.location}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {[job.workMode, job.employmentType].map((chip) => (
                      <span
                        key={chip}
                        className="bg-[#f3f3f3] px-2 py-1 text-[11px] font-bold text-[#5d3f3c] uppercase"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="w-full py-3 border border-[#1A1A1A] font-bold text-[12px] cursor-pointer tracking-[0.05em] hover:bg-[#1A1A1A] hover:text-white transition-all"
                  >
                    Ứng tuyển ngay
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 relative overflow-hidden bg-[#b90014]">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-64 h-64 border-4 border-white rotate-45 -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 border-4 border-white rotate-12 translate-x-1/4 translate-y-1/4" />
          </div>
          <div className="relative z-10 px-4 md:px-[40px] text-center">
            <h2 className="text-white text-[40px] leading-tight font-semibold mb-6">
              Sẵn sàng cho chặng đường tiếp theo?
            </h2>
            <p className="text-white/80 text-[16px] leading-6 mb-12 max-w-2xl mx-auto">
              Chương trình luân chuyển nội bộ được thiết kế để hỗ trợ mục tiêu
              phát triển của bạn. Hãy trao đổi với HR về các hướng đi phù hợp.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="px-10 py-4 bg-white text-[#b90014] font-extrabold text-[12px] uppercase tracking-[0.18em] hover:bg-[#eeeeee] transition-colors">
                Bắt đầu ngay
              </button>
              <button className="px-10 py-4 border-2 border-white text-white font-extrabold text-[12px] uppercase tracking-[0.18em] hover:bg-white/10 transition-colors">
                Xem tài nguyên
              </button>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

export default LandingPageScreen;
