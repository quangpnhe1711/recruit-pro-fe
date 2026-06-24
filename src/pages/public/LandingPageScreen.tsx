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
            <div className="max-w-3xl animate-fade-in-up">
              <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[12px] font-semibold tracking-[0.05em] text-white backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ff857c]" />
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
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/candidate/jobs"
                  className="premium-action inline-flex items-center justify-center gap-2 rounded-[12px] bg-gradient-to-b from-[#e8242c] to-[#c50f1b] px-7 py-4 text-[14px] font-bold text-white shadow-[0_16px_36px_-10px_rgba(227,27,35,0.6)] transition-all hover:from-[#f0353d] hover:to-[#d11420]"
                >
                  Xem vị trí đang tuyển
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>
                <Link
                  to="/internal/login"
                  className="premium-action inline-flex items-center justify-center gap-2 rounded-[12px] border border-white/30 bg-white/10 px-7 py-4 text-[14px] font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                >
                  <span className="material-symbols-outlined text-[18px]">lock</span>
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

            <div className="stagger grid grid-cols-1 gap-6 md:grid-cols-3">
              {featuredJobs.map((job, index) => (
                <div key={job.id} className="card-interactive group flex flex-col p-7">
                  <div className="mb-6 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#fff1f0] to-[#ffdad6] text-[#b90014]">
                      <span className="material-symbols-outlined">
                        {index % 3 === 0 ? "engineering" : index % 3 === 1 ? "campaign" : "monitoring"}
                      </span>
                    </div>
                    <span
                      className={`badge ${
                        job.tag === "Mới" ? "bg-[#fff1f0] text-[#b90014]" : "bg-[#f2efed] text-[#5f5e5e]"
                      }`}
                    >
                      {job.tag}
                    </span>
                  </div>
                  <h3 className="mb-1.5 text-[19px] font-semibold leading-snug tracking-[-0.01em] text-[#1a1c1c] transition-colors group-hover:text-[#b90014]">
                    {job.title}
                  </h3>
                  <p className="mb-5 flex items-center gap-1.5 text-[13px] text-[#5f5e5e]">
                    <span className="material-symbols-outlined text-[16px]">apartment</span>
                    {job.department} · {job.location}
                  </p>
                  <div className="mb-7 flex flex-wrap gap-2">
                    {[job.workMode, job.employmentType].map((chip) => (
                      <span key={chip} className="badge bg-[#f2efed] text-[#5f5e5e]">
                        {chip}
                      </span>
                    ))}
                  </div>
                  <button type="button" className="btn btn-secondary mt-auto w-full">
                    Ứng tuyển ngay
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
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
