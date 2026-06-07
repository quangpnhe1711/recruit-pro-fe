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
    <div className="selected-none text-[#1a1c1c]">
      <main>
        <section
          id="home"
          className="relative flex min-h-[720px] items-center overflow-hidden"
        >
          <div className="absolute inset-0 z-0">
            <img
              className="w-full h-full object-cover"
              alt="Modern office building at night"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4mMkFjad2Mv7czUqOat_Dv9dxd07AIa5nlU9O8qjVhsZskDtxGEiVUuIsyQeIXb9rmgrPvoZl1PR5eH32Wt83SHmosxD8SR7kug1zG2joNkBtYT8pLZG9uvajZmTqKlhnHgP7VJXas5pg-4VnnP9FJrUYmZ_F9RGfU62Wf0rMh0d6QG-u1eu6XMlZuiuYO6gszzoYJvEzx2PqhMCb1glEzYhBWWW8DQz_4mWQnX2N01BZYBqH4denQbSWkt7NRtz5b_nyCA-9vQ"
            />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(7,14,17,0.94),rgba(17,36,43,0.78),rgba(182,64,44,0.72))]" />
          </div>
          <div className="float-orb left-[12%] top-28 h-44 w-44 bg-[rgba(255,255,255,0.12)]" />
          <div className="float-orb bottom-10 right-[14%] h-56 w-56 bg-[rgba(29,125,116,0.2)]" style={{ animationDelay: "1.1s" }} />

          <div className="page-shell-wide relative z-10 w-full py-24">
            <div className="reveal-up max-w-3xl">
              <span className="section-kicker border-white/20 bg-white/12 text-white">
                INTERNAL PORTAL
              </span>
              <h1 className="mb-8 mt-6 text-[44px] font-extrabold leading-[1.02] text-white md:text-[72px]">
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
              <p className="mb-10 max-w-2xl text-[17px] leading-7 text-[#f3ede6]">
                {hero?.subtitle ??
                  "Explore exclusive internal opportunities and take the next step in your professional journey with the team you already know and trust."}
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  to="/candidate/jobs"
                  className="btn-primary px-8 py-4 text-[12px] font-bold tracking-[0.18em]"
                >
                  Browse Openings
                </Link>
                <Link
                  to="/internal/login"
                  className="btn-secondary border-white/20 bg-white/12 px-8 py-4 text-[12px] font-bold tracking-[0.18em] text-white hover:bg-white/18"
                >
                  Internal Portal
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 -mt-16 pb-10">
          <div className="page-shell-wide">
            <div className="reveal-scale grid grid-cols-1 gap-6 text-center md:grid-cols-3">
              <div className="surface-card-strong p-8">
                <h2 className="mb-2 text-[48px] font-extrabold text-[#f4b09d]">
                  {stats ? `${stats.internalHires}+` : "500+"}
                </h2>
                <p className="text-[12px] font-semibold tracking-[0.18em] text-white/72">
                  INTERNAL HIRES
                </p>
              </div>
              <div className="surface-card p-8">
                <h2 className="mb-2 text-[48px] font-extrabold text-[var(--rp-primary)]">
                  {stats?.departments ?? 15}
                </h2>
                <p className="text-[12px] font-semibold tracking-[0.18em] text-[var(--rp-muted)]">
                  DEPARTMENTS
                </p>
              </div>
              <div className="surface-card p-8">
                <h2 className="mb-2 text-[48px] font-extrabold text-[var(--rp-accent)]">
                  {stats?.avgEmployeeRating ?? 4.8}
                </h2>
                <p className="text-[12px] font-semibold tracking-[0.18em] text-[var(--rp-muted)]">
                  AVG EMPLOYEE RATING
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="careers" className="py-24">
          <div className="page-shell-wide">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div>
                <span className="section-kicker">Featured Roles</span>
                <h2 className="mt-4 text-[32px] leading-10 tracking-[-0.01em] font-semibold text-[#1a1c1c] mb-4">
                  Featured Internal Openings
                </h2>
                <p className="text-[16px] leading-6 text-[var(--rp-muted)] max-w-xl">
                  Priority access for our internal family. Elevate your career
                  without leaving the community you love.
                </p>
              </div>
              <Link
                className="btn-secondary px-5 py-3 text-[12px] font-bold tracking-[0.12em]"
                to="/jobs"
              >
                View All Jobs
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredJobs.map((job, index) => (
                <div
                  key={job.id}
                  className="surface-card reveal-scale group p-8 hover:-translate-y-1 hover:border-[rgba(182,64,44,0.25)]"
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[rgba(182,64,44,0.1)]">
                      <span className="material-symbols-outlined text-[var(--rp-primary)]">
                        {index % 3 === 0 ? "engineering" : index % 3 === 1 ? "campaign" : "monitoring"}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        job.tag === "New" ? "bg-[rgba(182,64,44,0.1)] text-[var(--rp-primary)]" : "bg-[rgba(17,36,43,0.06)] text-[var(--rp-muted)]"
                      }`}
                    >
                      {job.tag}
                    </span>
                  </div>
                  <h3 className="mb-2 text-[20px] leading-7 font-semibold text-[#1a1c1c] transition-colors group-hover:text-[var(--rp-primary)]">
                    {job.title}
                  </h3>
                  <p className="mb-6 text-[14px] leading-5 text-[var(--rp-muted)]">
                    {job.department} | {job.location}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {[job.workMode, job.employmentType].map((chip) => (
                      <span key={chip} className="tag-chip uppercase">
                        {chip}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="btn-secondary w-full px-5 py-3 text-[12px] font-bold tracking-[0.12em]"
                  >
                    Apply Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden py-24">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#b6402c,#1d7d74)]" />
          <div className="absolute inset-0 opacity-10">
            <div className="absolute left-0 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rotate-45 border-4 border-white" />
            <div className="absolute bottom-0 right-0 h-96 w-96 translate-x-1/4 translate-y-1/4 rotate-12 border-4 border-white" />
          </div>
          <div className="page-shell-wide relative z-10 text-center">
            <h2 className="text-white text-[40px] leading-tight font-semibold mb-6">
              Ready to script your next chapter?
            </h2>
            <p className="text-white/80 text-[16px] leading-6 mb-12 max-w-2xl mx-auto">
              Our internal mobility program is designed to support your
              ambitions. Talk to your HR partner today about available paths.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="btn-secondary border-white/20 bg-white px-10 py-4 text-[12px] font-extrabold uppercase tracking-[0.18em] text-[var(--rp-primary)]">
                Get Started
              </button>
              <button className="btn-secondary border-white/20 bg-white/12 px-10 py-4 text-[12px] font-extrabold uppercase tracking-[0.18em] text-white hover:bg-white/18">
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
