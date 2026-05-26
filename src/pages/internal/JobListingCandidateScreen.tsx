import { Link } from "react-router-dom";
import BottomNavBar from "../../common/components/layout/BottomNavBar";
import Footer from "../../common/components/layout/Footer";
import SideNavBar from "../../common/components/layout/SideNavBar";
import AppHeader from "../../common/components/layout/AppHeader";

type JobCard = {
  icon: string;
  title: string;
  meta: string;
  salary: string;
  posted: string;
  tags: string[];
  description: string;
};

const featuredJobs: JobCard[] = [
  {
    icon: "data_object",
    title: "Senior Full-Stack Engineer",
    meta: "Platform Infrastructure • San Francisco, CA (Remote)",
    salary: "$165k - $210k",
    posted: "Posted 2h ago",
    tags: ["React", "TypeScript", "Go", "Kubernetes"],
    description:
      "Looking for a technical lead to oversee the migration of our legacy monolith to a distributed microservices architecture using Go and React.",
  },
  {
    icon: "brush",
    title: "Lead Product Designer",
    meta: "Enterprise Solutions • New York, NY",
    salary: "$150k - $190k",
    posted: "Posted 5h ago",
    tags: ["Figma", "Design Systems", "UX Research"],
    description:
      "Shape the future of recruitment software. We need a design visionary to craft seamless user journeys for our internal dashboard ecosystem.",
  },
  {
    icon: "database",
    title: "Data Science Manager",
    meta: "Intelligence Unit • Austin, TX",
    salary: "$180k - $240k",
    posted: "Posted 1d ago",
    tags: ["Python", "PyTorch", "MLOps"],
    description:
      "Manage a team of 6 data scientists working on automated talent matching algorithms and predictive hiring models for high-volume enterprise clients.",
  },
  {
    icon: "cloud",
    title: "DevOps Specialist",
    meta: "Reliability Engineering • Remote",
    salary: "$140k - $175k",
    posted: "Posted 2d ago",
    tags: ["AWS", "Terraform", "Docker"],
    description:
      "Optimize our cloud infrastructure for scale. Focused on CI/CD pipeline automation and ensuring 99.99% uptime for our recruitment engine.",
  },
];

const filterGroups = [
  {
    title: "Salary Range",
    options: ["$50k - $80k", "$80k - $120k", "$120k - $180k", "$180k+"],
  },
  {
    title: "Employment Type",
    options: ["Full-time", "Contract", "Freelance", "Part-time"],
  },
];

function JobListingCandidateScreen() {
  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c]">
      <SideNavBar />

      <div className="flex min-h-screen flex-col lg:pl-64">
        <AppHeader />

        <main className="flex-1 pb-24 lg:pb-0">
          <div className="mx-auto flex w-full max-w-[1440px] gap-6 px-4 py-6 md:px-10">
            <aside className="hidden w-72 flex-shrink-0 space-y-6 xl:block">
              <div className="border border-[#e2dfde] bg-white p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-[20px] font-semibold text-[#1a1c1c]">
                    Filters
                  </h3>
                  <button
                    className="text-[12px] font-semibold text-[#b90014] hover:underline"
                    type="button"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-8">
                  {filterGroups.map((group) => (
                    <div key={group.title}>
                      <label className="mb-3 block text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5d3f3c]">
                        {group.title}
                      </label>

                      {group.title === "Salary Range" ? (
                        <div className="space-y-2">
                          {group.options.map((option, index) => (
                            <label
                              key={option}
                              className="flex items-center gap-3 text-[14px] text-[#5f5e5e]"
                            >
                              <input
                                className="rounded-sm border-[#926e6b] text-[#b90014] focus:ring-0"
                                defaultChecked={index === 2}
                                type="checkbox"
                              />
                              <span
                                className={index === 2 ? "text-[#1a1c1c]" : ""}
                              >
                                {option}
                              </span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {group.options.map((option, index) => (
                            <span
                              key={option}
                              className={`cursor-pointer rounded px-3 py-1 text-[12px] font-semibold ${
                                index === 0
                                  ? "bg-[#b90014] text-white"
                                  : "bg-[#eeeeee] text-[#5f5e5e]"
                              }`}
                            >
                              {option}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  <div>
                    <label className="mb-3 block text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5d3f3c]">
                      Required Skills
                    </label>
                    <div className="relative">
                      <input
                        className="w-full rounded-none border border-[#e2dfde] bg-white py-2 pl-3 pr-8 text-[14px] outline-none focus:border-[#1a1c1c]"
                        placeholder="Add skill..."
                        type="text"
                      />
                      <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[#5f5e5e]">
                        add
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {["React", "Node.js"].map((skill) => (
                        <div
                          key={skill}
                          className="flex items-center gap-1 rounded bg-[#e2dfde] px-2 py-1 text-[12px] font-semibold text-[#636262]"
                        >
                          {skill}
                          <span className="material-symbols-outlined text-[14px]">
                            close
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden border border-[#e2dfde] bg-[#b90014] p-6 text-white">
                <div className="absolute -right-6 -bottom-6 opacity-10">
                  <span className="material-symbols-outlined text-[120px]">
                    rocket_launch
                  </span>
                </div>
                <h4 className="mb-2 text-[20px] font-semibold">Job Alerts</h4>
                <p className="mb-4 text-[14px] leading-5 text-white/90">
                  Get notified immediately when high-matching roles are posted.
                </p>
                <button
                  className="w-full rounded-none bg-white py-2 text-[12px] font-bold uppercase tracking-[0.05em] text-[#b90014] transition-transform active:scale-[0.98]"
                  type="button"
                >
                  Enable Notifications
                </button>
              </div>
            </aside>

            <section className="flex-1 space-y-6">
              <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <h2 className="text-[24px] font-semibold leading-8 tracking-[-0.01em] md:text-[32px] md:leading-10">
                    Your Opportunities
                  </h2>
                  <p className="text-[14px] text-[#5f5e5e]">
                    Found 42 relevant positions for your profile
                  </p>
                  <Link
                    className="mt-2 inline-flex text-[12px] font-semibold tracking-[0.05em] text-[#b90014] hover:underline"
                    to="/internal/candidate-profile"
                  >
                    Open Candidate Profile
                  </Link>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="relative">
                    <input
                      className="w-[280px] border border-[#e2dfde] bg-white py-2 pl-10 pr-4 text-[14px] outline-none transition-colors focus:border-[#b90014]"
                      placeholder="Search jobs..."
                      type="text"
                    />

                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-[#5f5e5e]">
                      search
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5d3f3c]">
                      Sort by:
                    </span>

                    <select className="border-b-2 border-[#e7bdb8] bg-transparent py-1 text-[12px] font-semibold outline-none focus:border-[#b90014]">
                      <option>Newest First</option>
                      <option>Salary High-Low</option>
                      <option>Most Relevant</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {featuredJobs.map((job) => (
                  <article
                    key={job.title}
                    className="group flex flex-col gap-4 border border-[#e2dfde] bg-white p-6 transition-all duration-200 hover:border-[#b90014] hover:shadow-sm md:flex-row md:items-start md:gap-6"
                  >
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center bg-[#f3f3f3]">
                      <span className="material-symbols-outlined text-[32px] text-[#b90014]">
                        {job.icon}
                      </span>
                    </div>

                    <div className="flex-1">
                      <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h3 className="text-[20px] font-semibold leading-7 transition-colors group-hover:text-[#b90014]">
                            {job.title}
                          </h3>
                          <p className="text-[14px] font-medium text-[#5f5e5e]">
                            {job.meta}
                          </p>
                        </div>
                        <div className="text-left md:text-right">
                          <p className="text-[20px] font-semibold text-[#1a1c1c]">
                            {job.salary}
                          </p>
                          <p className="text-[12px] uppercase text-[#5f5e5e]">
                            {job.posted}
                          </p>
                        </div>
                      </div>

                      <div className="mb-4 flex flex-wrap gap-2">
                        {job.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-[#eeeeee] px-2 py-1 text-[12px] font-semibold text-[#636262]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <p className="max-w-3xl text-[14px] leading-5 text-[#5f5e5e]">
                          {job.description}
                        </p>
                        <button
                          className="bg-[#1a1c1c] px-6 py-2 text-[12px] font-bold uppercase tracking-[0.05em] text-white transition-colors hover:bg-[#b90014]"
                          type="button"
                        >
                          Apply Now
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <nav className="flex items-center justify-center gap-2 py-4">
                <button
                  className="flex h-10 w-10 items-center justify-center rounded border border-[#e2dfde] text-[#5f5e5e] transition-colors hover:bg-[#f3f3f3]"
                  type="button"
                >
                  <span className="material-symbols-outlined">
                    chevron_left
                  </span>
                </button>
                <button
                  className="flex h-10 w-10 items-center justify-center rounded bg-[#b90014] text-white"
                  type="button"
                >
                  1
                </button>
                <button
                  className="flex h-10 w-10 items-center justify-center rounded border border-[#e2dfde] text-[#1a1c1c] transition-colors hover:bg-[#f3f3f3]"
                  type="button"
                >
                  2
                </button>
                <button
                  className="flex h-10 w-10 items-center justify-center rounded border border-[#e2dfde] text-[#1a1c1c] transition-colors hover:bg-[#f3f3f3]"
                  type="button"
                >
                  3
                </button>
                <span className="px-2 text-[#5f5e5e]">...</span>
                <button
                  className="flex h-10 w-10 items-center justify-center rounded border border-[#e2dfde] text-[#1a1c1c] transition-colors hover:bg-[#f3f3f3]"
                  type="button"
                >
                  12
                </button>
                <button
                  className="flex h-10 w-10 items-center justify-center rounded border border-[#e2dfde] text-[#5f5e5e] transition-colors hover:bg-[#f3f3f3]"
                  type="button"
                >
                  <span className="material-symbols-outlined">
                    chevron_right
                  </span>
                </button>
              </nav>
            </section>
          </div>
        </main>

        <Footer />
      </div>

      <BottomNavBar />
    </div>
  );
}

export default JobListingCandidateScreen;
