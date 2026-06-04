import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { publicService, type HomeResponseDto } from "../../services/public/publicService";

function LandingPageScreen() {
  const [homeData, setHomeData] = useState<HomeResponseDto | null>(null);

  useEffect(() => {
    let mounted = true;

    publicService
      .getHome()
      .then((res) => {
        if (mounted && res.data) setHomeData(res.data);
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
              alt="Modern office building at night"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4mMkFjad2Mv7czUqOat_Dv9dxd07AIa5nlU9O8qjVhsZskDtxGEiVUuIsyQeIXb9rmgrPvoZl1PR5eH32Wt83SHmosxD8SR7kug1zG2joNkBtYT8pLZG9uvajZmTqKlhnHgP7VJXas5pg-4VnnP9FJrUYmZ_F9RGfU62Wf0rMh0d6QG-u1eu6XMlZuiuYO6gszzoYJvEzx2PqhMCb1glEzYhBWWW8DQz_4mWQnX2N01BZYBqH4denQbSWkt7NRtz5b_nyCA-9vQ"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/95 to-[#b90014]/70 opacity-90" />
          </div>

          <div className="relative z-10 w-full px-4 md:px-[40px]  ">
            <div className="max-w-3xl">
              <span className="inline-block px-4 py-1 bg-[#b90014] text-white text-[12px] font-semibold tracking-[0.05em] mb-6">
                INTERNAL PORTAL
              </span>
              <h1 className="text-white text-[44px] md:text-[64px] leading-[1.1] font-extrabold tracking-tight mb-8">
                {hero?.title ? (
                  hero.title
                ) : (
                  <>
                    Empowering Your <br />
                    Career Growth Within{" "}
                    <span className="text-[#ffdad6]">RecruitPro</span>
                  </>
                )}
              </h1>
              <p className="text-[#eeeeee] text-[16px] leading-6 mb-10 max-w-xl">
                {hero?.subtitle ??
                  "Explore exclusive internal opportunities and take the next step in your professional journey with the team you already know and trust."}
              </p>
              <div className="flex gap-4">
                <Link
                  to="/candidate/jobs"
                  className="px-8 py-4 bg-[#b90014] text-white font-bold text-[12px] tracking-[0.05em] hover:scale-[1.02] transition-transform active:scale-95"
                >
                  Browse Openings
                </Link>
                <Link
                  to="/internal/login"
                  className="px-8 py-4 bg-white text-[#1A1A1A] font-bold text-[12px] tracking-[0.05em] border border-[#1A1A1A] hover:bg-gray-100 transition-colors"
                >
                  Internal Portal
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
                  INTERNAL HIRES
                </p>
              </div>
              <div className="p-8 md:border-r md:border-white/10 md:last:border-r-0">
                <h2 className="text-[#b90014] text-[48px] font-extrabold mb-2">
                  {stats?.departments ?? 15}
                </h2>
                <p className="text-[#e5e2e1] text-[12px] font-semibold tracking-[0.18em]">
                  DEPARTMENTS
                </p>
              </div>
              <div className="p-8">
                <h2 className="text-[#b90014] text-[48px] font-extrabold mb-2">
                  {stats?.avgEmployeeRating ?? 4.8}
                </h2>
                <p className="text-[#e5e2e1] text-[12px] font-semibold tracking-[0.18em]">
                  AVG EMPLOYEE RATING
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
                  Featured Internal Openings
                </h2>
                <p className="text-[#5f5e5e] text-[16px] leading-6 max-w-xl">
                  Priority access for our internal family. Elevate your career
                  without leaving the community you love.
                </p>
              </div>
              <Link
                className="text-[#b90014] font-bold flex items-center gap-2 hover:underline"
                to="/jobs"
              >
                View All Jobs{" "}
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
                        job.tag === "New" ? "bg-[#b90014]/10 text-[#b90014]" : "bg-[#eeeeee] text-[#5f5e5e]"
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
                    Apply Now
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
              Ready to script your next chapter?
            </h2>
            <p className="text-white/80 text-[16px] leading-6 mb-12 max-w-2xl mx-auto">
              Our internal mobility program is designed to support your
              ambitions. Talk to your HR partner today about available paths.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="px-10 py-4 bg-white text-[#b90014] font-extrabold text-[12px] uppercase tracking-[0.18em] hover:bg-[#eeeeee] transition-colors">
                Get Started
              </button>
              <button className="px-10 py-4 border-2 border-white text-white font-extrabold text-[12px] uppercase tracking-[0.18em] hover:bg-white/10 transition-colors">
                View Resources
              </button>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

export default LandingPageScreen;
