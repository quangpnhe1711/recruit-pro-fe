import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { jobsService } from "../../services/jobs/jobsService";

type RecentApplication = {
  id: string;
  candidateName: string;
  applied: string;
  status: "Reviewing" | "Screening" | "Qualified";
  score: string;
  avatarUrl?: string;
  initials?: string;
};

type FunnelStage = {
  label: string;
  count: number;
  widthClassName: string;
};

type JobDetail = {
  id: string;
  title: string;
  location: string;
  posted: string;
  status: "Live" | "Closed";
  salaryRange: string;
  department: string;
  jobType: string;
  vacancyCount: number;
  description: string[];
  requirements: string[];
};

type JobDetailApiDto = {
  id: string;
  title: string;
  location: string;
  postedAt?: string | null;
  createdAt?: string | null;
  status?: string | null;
  salaryRange?: {
    min?: number | null;
    max?: number | null;
    currency?: string | null;
  } | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  department?: {
    name?: string | null;
  } | string | null;
  jobType?: string | null;
  employmentType?: string | null;
  vacancyCount?: number | null;
  description?: string | string[] | null;
  requirements?: string[] | null;
};

type JobStatisticsApiDto = {
  applicationSummary?: {
    funnel?: Array<{
      label: string;
      count: number;
    }>;
  } | null;
  hiringFunnel?: Array<{
    label: string;
    count: number;
  }> | null;
};

type RecentApplicationApiDto = {
  id: string;
  candidate?: {
    fullName?: string | null;
    avatarUrl?: string | null;
  } | null;
  candidateName?: string | null;
  appliedAt?: string | null;
  applied?: string | null;
  status?: string | null;
  score?: number | string | null;
  avatarUrl?: string | null;
};

const jobDirectory: Record<string, JobDetail> = {
  "JB-9402": {
    id: "JB-9402",
    title: "Senior Product Designer",
    location: "San Francisco, CA (Hybrid)",
    posted: "Posted 4 days ago",
    status: "Live",
    salaryRange: "$160,000 — $210,000 USD",
    department: "Design & User Experience",
    jobType: "Full-time, Permanent",
    vacancyCount: 1,
    description: [
      "We are seeking a Senior Product Designer to lead the evolution of our enterprise recruitment platform. You will be responsible for translating complex hiring workflows into intuitive, high-performance user interfaces that serve thousands of internal recruiters.",
      "This role requires a unique blend of strategic thinking, deep UX research capabilities, and pixel-perfect UI execution. You will partner closely with engineering and product management to define the future of RecruitPro.",
    ],
    requirements: [
      "6+ years of experience in Product Design, preferably in B2B SaaS or enterprise tools.",
      "Strong portfolio demonstrating high-fidelity UI design and systematic design thinking.",
      "Expert proficiency in Figma and building scalable design systems.",
      "Experience working directly with React/Tailwind developers and design-to-code handoffs.",
    ],
  },
};

const fallbackJob = jobDirectory["JB-9402"];

function getStatusClassName(status: RecentApplication["status"]) {
  switch (status) {
    case "Reviewing":
      return "bg-blue-50 text-blue-700 border-blue-100";
    case "Screening":
      return "bg-orange-50 text-orange-700 border-orange-100";
    case "Qualified":
      return "bg-green-50 text-green-700 border-green-100";
    default:
      return "bg-[#e2dfde] text-[#636262] border-[#e2dfde]";
  }
}

function Icon({ name }: { name: string }) {
  return <span className="material-symbols-outlined">{name}</span>;
}

function AppSidebar() {
  const items = [
    { icon: "dashboard", label: "Dashboard", active: false },
    { icon: "work", label: "Jobs", active: true },
    { icon: "description", label: "Applications", active: false },
    { icon: "analytics", label: "Analytics", active: false },
  ];

  return (
    <aside className="fixed left-0 top-0 hidden h-full w-64 flex-col border-r border-[#5f5e5e] bg-[#1A1A1A] md:flex">
      <div className="p-6">
        <h1 className="text-[20px] font-bold leading-7 text-white">RecruitPro</h1>
        <p className="text-[12px] font-semibold tracking-[0.05em] text-[#c8c6c5] opacity-70">
          Internal Portal
        </p>
      </div>

      <nav className="mt-4 flex-1">
        {items.map((item) => (
          <a
            key={item.label}
            href="#"
            className={`flex items-center gap-3 px-6 py-3 text-[12px] font-semibold tracking-[0.05em] transition-colors ${
              item.active
                ? "border-l-4 border-[#b90014] bg-white/10 text-white"
                : "text-[#c8c6c5] hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </a>
        ))}
      </nav>

      <div className="mt-auto border-t border-white/10 p-4">
        {[
          { icon: "settings", label: "Settings" },
          { icon: "help", label: "Support" },
        ].map((item) => (
          <a
            key={item.label}
            href="#"
            className="flex items-center gap-3 px-4 py-2 text-[12px] font-semibold tracking-[0.05em] text-[#c8c6c5] hover:text-white"
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </a>
        ))}

        <div className="mt-4 flex items-center gap-3 px-4">
          <img
            alt="HR Manager Profile"
            className="h-8 w-8 rounded-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvueXnNVld_vI78588pyngmq277IlO4fKdKYkC0E5sCqskXKHQY9adlONnaml-CtZNoiZCC69AgG3p5X4lraWgKOhjrhmT7kR-jpNWgx3B-Gk8xZRu_IHP7Q3WLGBwLUiG9L2wIkOESNwJSbBCsIgt0hPhxtpVInFKYAOH7uWDyJmWu_WcHnIVs_w5Fib8rR2QNeCxRyvH1FlMvCab2xjQoNIEyjDOBwdReyMJlgvoepfTXHkEZLP4o1fJkeaEz4abT-bkRVKogQ"
          />
          <div className="overflow-hidden">
            <p className="truncate text-[12px] font-semibold tracking-[0.05em] text-white">
              Marcus Chen
            </p>
            <p className="truncate text-[10px] text-[#c8c6c5]">Senior Recruiter</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function JobDetailScreen() {
  const navigate = useNavigate();
  const params = useParams();
  const jobId = params.jobId ?? "JB-9402";
  const [job, setJob] = useState<JobDetail>(jobDirectory[jobId] ?? fallbackJob);
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [hiringFunnel, setHiringFunnel] = useState<FunnelStage[]>([]);

  useEffect(() => {
    let mounted = true;

    jobsService
      .getJobDetail(jobId)
      .then((res) => {
        const data = res.data as JobDetailApiDto | null;
        if (!mounted || !data) return;

        setJob({
          id: data.id,
          title: data.title,
          location: data.location,
          posted: data.postedAt || data.createdAt ? `Posted ${new Date(data.postedAt ?? data.createdAt).toLocaleDateString()}` : "",
          status: data.status === "CLOSED" || data.status === "Closed" ? "Closed" : "Live",
          salaryRange: data.salaryRange
            ? `$${data.salaryRange.min?.toLocaleString()} — $${data.salaryRange.max?.toLocaleString()} ${data.salaryRange.currency ?? ""}`.trim()
            : data.salaryMin != null || data.salaryMax != null
              ? `$${(data.salaryMin ?? data.salaryMax ?? 0).toLocaleString()} — $${(data.salaryMax ?? data.salaryMin ?? 0).toLocaleString()}`
              : "Negotiable",
          department: data.department?.name ?? data.department,
          jobType: data.jobType ?? data.employmentType ?? "",
          vacancyCount: data.vacancyCount ?? 0,
          description: Array.isArray(data.description)
            ? data.description
            : typeof data.description === "string"
              ? [data.description]
              : [],
          requirements: data.requirements ?? [],
        });
      })
      .catch(() => undefined);

    jobsService.getJobStatistics(jobId)
      .then((res) => {
        if (!mounted) return;
        const data = res.data as JobStatisticsApiDto | null;
        const funnel = data?.applicationSummary?.funnel ?? data?.hiringFunnel ?? [];
        const maxCount = Math.max(...funnel.map((item) => item.count ?? 0), 1);

        setHiringFunnel(
          funnel.map((item) => ({
            label: item.label,
            count: item.count,
            widthClassName: `w-[${Math.max(5, Math.round(((item.count ?? 0) / maxCount) * 100))}%]`,
          })),
        );
      })
      .catch(() => undefined);

    jobsService
      .getRecentJobApplications(jobId)
      .then((res) => {
        if (!mounted) return;
        const payload = res.data as { items?: RecentApplicationApiDto[] } | RecentApplicationApiDto[] | null;
        const items = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
        setRecentApplications(
          items.slice(0, 5).map((item) => ({
            id: item.id,
            candidateName: item.candidate?.fullName ?? item.candidateName,
            applied: item.appliedAt ? new Date(item.appliedAt).toLocaleDateString() : item.applied ?? "",
            status:
              item.status === "REVIEWING" || item.status === "Reviewing"
                ? "Reviewing"
                : item.status === "SCREENING" || item.status === "Screening"
                  ? "Screening"
                  : "Qualified",
            score: String(item.score ?? "0"),
            avatarUrl: item.candidate?.avatarUrl ?? item.avatarUrl,
            initials:
              item.candidate?.fullName
                ?.split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2) ?? undefined,
          })),
        );
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, [jobId]);

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c]">
      <AppSidebar />

      <main className="flex min-h-screen flex-col md:ml-64">

        <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-6 py-6 md:px-10">
          <nav className="mb-6 flex items-center gap-2 text-[12px] font-semibold tracking-[0.05em] text-[#5f5e5e]">
            <button
              type="button"
              className="hover:text-[#b90014]"
              onClick={() => navigate("/jobs")}
            >
              Jobs
            </button>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-[#1a1c1c]">{job.title}</span>
          </nav>

          <section className="mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <h2 className="text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#1a1c1c]">
                  {job.title}
                </h2>
                <span className="rounded-full border border-green-200 bg-green-100 px-3 py-1 text-[12px] font-semibold text-green-800">
                  {job.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px] text-[#5f5e5e]">
                <div className="flex items-center gap-2">
                  <Icon name="location_on" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="schedule" />
                  <span>{job.posted}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="group" />
                  <span>Vacancy: {job.vacancyCount}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="flex items-center gap-2 border border-black bg-white px-5 py-2.5 text-[12px] font-semibold tracking-[0.05em] text-[#1a1c1c] transition-colors hover:bg-[#f3f3f3]"
              >
                <Icon name="edit" />
                Edit Job
              </button>
              <button
                type="button"
                className="flex items-center gap-2 bg-[#b90014] px-5 py-2.5 text-[12px] font-semibold tracking-[0.05em] text-white transition-all hover:brightness-110"
              >
                <Icon name="visibility" />
                View Applications
              </button>
              <button
                type="button"
                className="flex items-center gap-2 border border-[#5f5e5e] bg-white px-5 py-2.5 text-[12px] font-semibold tracking-[0.05em] text-[#ba1a1a] transition-colors hover:bg-[#ba1a1a]/5"
              >
                <Icon name="close" />
                Close Posting
              </button>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="flex flex-col gap-6 lg:col-span-8">
              <section className="border border-[#e2dfde] bg-white p-8">
                <h3 className="mb-6 flex items-center gap-2 text-[20px] font-semibold leading-7 text-[#1a1c1c]">
                  <span className="material-symbols-outlined text-[#b90014]">
                    description
                  </span>
                  Job Description
                </h3>

                <div className="space-y-4 text-[14px] leading-6 text-[#5d3f3c]">
                  {job.description.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>

                <h3 className="mt-10 mb-6 flex items-center gap-2 text-[20px] font-semibold leading-7 text-[#1a1c1c]">
                  <span className="material-symbols-outlined text-[#b90014]">
                    checklist
                  </span>
                  Requirements
                </h3>

                <ul className="space-y-3 text-[14px] leading-6 text-[#5d3f3c]">
                  {job.requirements.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="material-symbols-outlined mt-0.5 text-[20px] text-[#b90014]">
                        check_circle
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="overflow-hidden border border-[#e2dfde] bg-white">
                <div className="flex items-center justify-between border-b border-[#e2dfde] bg-white px-6 py-4">
                  <h3 className="flex items-center gap-2 text-[20px] font-semibold leading-7 text-[#1a1c1c]">
                    <span className="material-symbols-outlined text-[#b90014]">
                      group
                    </span>
                    Recent Applications
                  </h3>
                  <button
                    type="button"
                    className="text-[12px] font-bold tracking-[0.05em] text-[#b90014] hover:underline"
                  >
                    View All 42
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead className="bg-[#1A1A1A] text-white">
                      <tr>
                        <th className="px-6 py-4 text-[12px] font-semibold">Candidate</th>
                        <th className="px-6 py-4 text-[12px] font-semibold">Applied</th>
                        <th className="px-6 py-4 text-[12px] font-semibold">Status</th>
                        <th className="px-6 py-4 text-[12px] font-semibold">Score</th>
                        <th className="px-6 py-4 text-right text-[12px] font-semibold">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e2dfde]">
                      {recentApplications.map((item, index) => (
                        <tr
                          key={item.id}
                          className={index % 2 === 1 ? "bg-[#f9f9f9] hover:bg-[#eeeeee]" : "hover:bg-[#f9f9f9]"}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {item.avatarUrl ? (
                                <img
                                  alt="Candidate"
                                  className="h-8 w-8 rounded-full object-cover"
                                  src={item.avatarUrl}
                                />
                              ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ffdad6] text-[12px] font-bold text-[#b90014]">
                                  {item.initials}
                                </div>
                              )}
                              <div>
                                <p className="text-[14px] font-semibold text-[#1a1c1c]">
                                  {item.candidateName}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[14px] text-[#5d3f3c]">
                            {item.applied}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusClassName(
                                item.status,
                              )}`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <span className="text-[14px] font-bold text-[#1a1c1c]">
                                {item.score}
                              </span>
                              <span className="text-[12px] text-[#5f5e5e]">/10</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              className="text-[#5f5e5e] hover:text-[#b90014]"
                            >
                              <Icon name="more_vert" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <div className="flex flex-col gap-6 lg:col-span-4">
              <section className="border border-[#e2dfde] bg-white p-6">
                <h3 className="mb-6 text-[20px] font-semibold leading-7 text-[#1a1c1c]">
                  Hiring Funnel
                </h3>

                <div className="space-y-6">
                  {hiringFunnel.map((stage) => (
                    <div key={stage.label}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5f5e5e]">
                          {stage.label}
                        </span>
                        <span className="text-[14px] font-bold text-[#1a1c1c]">
                          {stage.count}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden bg-[#eeeeee]">
                        <div className={`h-full bg-[#b90014] ${stage.widthClassName}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="border border-[#e2dfde] bg-[#f3f3f3] p-6">
                <h3 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">
                  Posting Details
                </h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-[#c8c6c5]">
                      Salary Range
                    </p>
                    <p className="text-[14px] font-semibold text-[#1a1c1c]">
                      {job.salaryRange}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-[#c8c6c5]">
                      Department
                    </p>
                    <p className="text-[14px] font-semibold text-[#1a1c1c]">
                      {job.department}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-[#c8c6c5]">
                      Job Type
                    </p>
                    <p className="text-[14px] font-semibold text-[#1a1c1c]">
                      {job.jobType}
                    </p>
                  </div>
                </div>

                <div className="mt-8 border-t border-[#e2dfde] pt-6">
                  <button
                    type="button"
                    className="w-full border border-black bg-white py-3 text-[12px] font-bold tracking-[0.05em] text-[#1a1c1c] transition-all hover:bg-black hover:text-white"
                  >
                    Copy Shareable Link
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-[#e2dfde] bg-white md:hidden">
        {[
          { icon: "dashboard", label: "Dashboard", active: false },
          { icon: "work", label: "Jobs", active: true },
          { icon: "description", label: "Apps", active: false },
          { icon: "analytics", label: "Stats", active: false },
        ].map((item) => (
          <a
            key={item.label}
            href="#"
            className={`flex flex-col items-center gap-1 ${
              item.active ? "text-[#b90014]" : "text-[#5f5e5e]"
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={item.active ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {item.icon}
            </span>
            <span className={`text-[10px] ${item.active ? "font-bold" : ""}`}>
              {item.label}
            </span>
          </a>
        ))}
      </nav>
    </div>
  );
}

export default JobDetailScreen;
