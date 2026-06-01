import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import CommonTable, { type TableColumn } from "../../common/components/CommonTable";
import { ROLES } from "../../common/constants/app.constants";
import type { RootState } from "../../store";

type JobStage = {
  label: string;
  count: number;
  colorClassName: string;
};

type RecentApplication = {
  id: string;
  candidateName: string;
  title: string;
  stage: string;
  appliedDate: string;
  recruiter: string;
};

type JobDetail = {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  level: string;
  postedDate: string;
  status: "Open" | "Closed";
  applications: number;
  hiringManager: string;
  summary: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
};

const jobDirectory: Record<string, JobDetail> = {
  "JB-9402": {
    id: "JB-9402",
    title: "Senior Frontend Engineer",
    department: "Engineering",
    location: "Ho Chi Minh City • Hybrid",
    employmentType: "Full-time",
    level: "L6",
    postedDate: "Oct 24, 2024",
    status: "Open",
    applications: 38,
    hiringManager: "Alex Rivera",
    summary:
      "Build the next generation of candidate and recruiter experiences across RecruitPro's internal portal.",
    description:
      "You will partner with product, design, and backend teams to deliver polished internal workflows, improve accessibility, and keep the recruiter experience fast and reliable.",
    responsibilities: [
      "Own major frontend features from planning to release.",
      "Partner with designers to translate pixel-perfect mockups into responsive screens.",
      "Improve performance and accessibility across the internal hiring workflows.",
      "Mentor teammates through reviews and technical discussions.",
    ],
    requirements: [
      "5+ years of frontend experience with React and TypeScript.",
      "Strong grasp of component architecture and state management.",
      "Experience shipping enterprise dashboards or internal tools.",
      "Comfortable collaborating with cross-functional teams.",
    ],
    benefits: [
      "Competitive compensation",
      "Hybrid work model",
      "Annual learning budget",
      "Private health insurance",
    ],
  },
  "JB-9381": {
    id: "JB-9381",
    title: "Lead UX Researcher",
    department: "Design",
    location: "Remote • APAC",
    employmentType: "Full-time",
    level: "Lead",
    postedDate: "Oct 26, 2024",
    status: "Open",
    applications: 21,
    hiringManager: "Maya Chen",
    summary:
      "Define research strategy for the recruiter platform and keep product decisions grounded in evidence.",
    description:
      "This role leads discovery, interviews, and synthesis for internal hiring journeys. You will shape roadmap priorities and make complex processes feel simple.",
    responsibilities: [
      "Run interviews, usability studies, and competitive research.",
      "Turn findings into actionable product direction.",
      "Partner with design and engineering on high-impact flows.",
    ],
    requirements: [
      "Experience leading research for SaaS products.",
      "Strong storytelling and stakeholder management skills.",
      "Ability to translate insights into product direction.",
    ],
    benefits: ["Flexible schedule", "Learning stipend", "Remote-first team"],
  },
};

const fallbackJob: JobDetail = {
  id: "JB-0000",
  title: "Senior Frontend Engineer",
  department: "Engineering",
  location: "Ho Chi Minh City • Hybrid",
  employmentType: "Full-time",
  level: "L6",
  postedDate: "Oct 24, 2024",
  status: "Open",
  applications: 38,
  hiringManager: "Alex Rivera",
  summary:
    "Build the next generation of candidate and recruiter experiences across RecruitPro's internal portal.",
  description:
    "You will partner with product, design, and backend teams to deliver polished internal workflows, improve accessibility, and keep the recruiter experience fast and reliable.",
  responsibilities: [
    "Own major frontend features from planning to release.",
    "Partner with designers to translate pixel-perfect mockups into responsive screens.",
    "Improve performance and accessibility across the internal hiring workflows.",
    "Mentor teammates through reviews and technical discussions.",
  ],
  requirements: [
    "5+ years of frontend experience with React and TypeScript.",
    "Strong grasp of component architecture and state management.",
    "Experience shipping enterprise dashboards or internal tools.",
    "Comfortable collaborating with cross-functional teams.",
  ],
  benefits: [
    "Competitive compensation",
    "Hybrid work model",
    "Annual learning budget",
    "Private health insurance",
  ],
};

const recentApplications: RecentApplication[] = [
  {
    id: "APP-7101",
    candidateName: "Sarah Jenkins",
    title: "Senior UX Designer",
    stage: "Interviewing",
    appliedDate: "Oct 24, 2024",
    recruiter: "Alex Rivera",
  },
  {
    id: "APP-7102",
    candidateName: "David Chen",
    title: "Backend Engineer",
    stage: "Screening",
    appliedDate: "Oct 23, 2024",
    recruiter: "Maya Chen",
  },
  {
    id: "APP-7103",
    candidateName: "Maria Rodriguez",
    title: "HR Business Partner",
    stage: "Reviewing",
    appliedDate: "Oct 22, 2024",
    recruiter: "Alex Rivera",
  },
  {
    id: "APP-7104",
    candidateName: "Jameson Wright",
    title: "Solutions Architect",
    stage: "Offer",
    appliedDate: "Oct 22, 2024",
    recruiter: "Maya Chen",
  },
  {
    id: "APP-7105",
    candidateName: "Olivia Thorne",
    title: "Lead Copywriter",
    stage: "Applied",
    appliedDate: "Oct 21, 2024",
    recruiter: "Alex Rivera",
  },
];

const hiringFunnel: JobStage[] = [
  { label: "Applied", count: 84, colorClassName: "bg-[#005f93]" },
  { label: "Screening", count: 42, colorClassName: "bg-[#b90014]" },
  { label: "Interview", count: 18, colorClassName: "bg-[#926e6b]" },
  { label: "Offer", count: 7, colorClassName: "bg-[#1a1c1c]" },
  { label: "Hired", count: 3, colorClassName: "bg-[#5f5e5e]" },
];

function statusChip(status: string) {
  switch (status) {
    case "Interviewing":
      return "bg-[#005f93]/10 text-[#005f93]";
    case "Screening":
      return "bg-[#926e6b]/10 text-[#926e6b]";
    case "Reviewing":
      return "bg-[#5f5e5e]/10 text-[#5f5e5e]";
    case "Offer":
      return "bg-[#b90014]/10 text-[#b90014]";
    default:
      return "bg-[#e2dfde] text-[#636262]";
  }
}

function buildRecentApplicationColumns(
  onViewApplication: (item: RecentApplication) => void,
): TableColumn<RecentApplication>[] {
  return [
    {
      key: "candidateName",
      header: "Candidate",
      renderCell: (item) => (
        <div>
          <p className="font-semibold text-[#1a1c1c]">{item.candidateName}</p>
          <p className="text-[12px] text-[#5f5e5e]">{item.title}</p>
        </div>
      ),
    },
    {
      key: "stage",
      header: "Stage",
      renderCell: (item) => (
        <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${statusChip(item.stage)}`}>
          {item.stage}
        </span>
      ),
    },
    {
      key: "appliedDate",
      header: "Applied Date",
      renderCell: (item) => <span className="text-[#5f5e5e]">{item.appliedDate}</span>,
    },
    {
      key: "recruiter",
      header: "Recruiter",
      renderCell: (item) => <span className="text-[#5f5e5e]">{item.recruiter}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      alignRight: true,
      headerClassName: "text-right",
      renderCell: (item) => (
        <button
          type="button"
          className="text-[12px] font-semibold tracking-[0.05em] text-[#b90014] hover:underline"
          onClick={() => onViewApplication(item)}
        >
          View Application
        </button>
      ),
    },
  ];
}

function JobDetailScreen() {
  const navigate = useNavigate();
  const params = useParams();

  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const roles = useSelector((state: RootState) => state.auth.user?.roles ?? []);
  const jobId = params.jobId ?? "JB-9402";
  const job = jobDirectory[jobId] ?? fallbackJob;

  const canManagePosting = isAuthenticated && roles.some((role) => role === ROLES.ADMIN || role === ROLES.RECRUITER);
  const canEditJob = roles.includes(ROLES.ADMIN);
  const canViewApplications = canManagePosting;
  const canClosePosting = canManagePosting;

  const [closedJobs, setClosedJobs] = useState<Record<string, boolean>>({});
  const isClosed = closedJobs[jobId] ?? job.status === "Closed";

  const totalApplications = useMemo(
    () => hiringFunnel.reduce((sum, item) => sum + item.count, 0),
    [],
  );

  const maxFunnelValue = useMemo(
    () => Math.max(...hiringFunnel.map((item) => item.count)),
    [],
  );

  function handleEditJob() {
    navigate(`/hr/jobs/create?jobId=${job.id}`);
  }

  function handleViewApplications() {
    navigate(`/hr/applications?jobId=${job.id}`);
  }

  function handleViewApplication(item: RecentApplication) {
    toast.info(`Open application: ${item.id}`);
  }

  function handleClosePosting() {
    setClosedJobs((prev) => ({
      ...prev,
      [jobId]: !(prev[jobId] ?? job.status === "Closed"),
    }));
    toast.success(isClosed ? "Posting reopened." : "Posting closed.");
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-10">
      <div className="space-y-6">
        <section className="border border-[#e2dfde] bg-white px-6 py-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-[12px] font-semibold tracking-[0.18em] text-[#5f5e5e]">
                <button
                  type="button"
                  className="text-[#b90014] hover:underline"
                  onClick={() => navigate("/jobs")}
                >
                  Jobs
                </button>
                <span>/</span>
                <span>{job.id}</span>
              </div>

              <div>
                <h2 className="text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#1a1c1c]">
                  {job.title}
                </h2>
                <p className="mt-2 max-w-3xl text-[16px] leading-6 text-[#5f5e5e]">
                  {job.summary}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#f3f3f3] px-3 py-1 text-[12px] font-semibold text-[#1a1c1c]">
                  {job.department}
                </span>
                <span className="rounded-full bg-[#f3f3f3] px-3 py-1 text-[12px] font-semibold text-[#1a1c1c]">
                  {job.level}
                </span>
                <span className="rounded-full bg-[#f3f3f3] px-3 py-1 text-[12px] font-semibold text-[#1a1c1c]">
                  {job.employmentType}
                </span>
                <span className="rounded-full bg-[#f3f3f3] px-3 py-1 text-[12px] font-semibold text-[#1a1c1c]">
                  {job.location}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-[12px] font-semibold ${
                    isClosed ? "bg-[#b90014]/10 text-[#b90014]" : "bg-[#005f93]/10 text-[#005f93]"
                  }`}
                >
                  {isClosed ? "Closed" : "Open"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              {canEditJob ? (
                <button
                  type="button"
                  className="border border-[#1a1c1c] bg-white px-4 py-2 text-[12px] font-semibold tracking-[0.05em] text-[#1a1c1c] transition-colors hover:bg-[#f3f3f3]"
                  onClick={handleEditJob}
                >
                  Edit Job
                </button>
              ) : null}

              {canViewApplications ? (
                <button
                  type="button"
                  className="bg-[#b90014] px-4 py-2 text-[12px] font-semibold tracking-[0.05em] text-white transition-colors hover:brightness-110"
                  onClick={handleViewApplications}
                >
                  View Applications
                </button>
              ) : null}

              {canClosePosting ? (
                <button
                  type="button"
                  className="border border-[#b90014] px-4 py-2 text-[12px] font-semibold tracking-[0.05em] text-[#b90014] transition-colors hover:bg-[#b90014] hover:text-white"
                  onClick={handleClosePosting}
                >
                  {isClosed ? "Reopen Posting" : "Close Posting"}
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Applications", value: job.applications.toString(), helper: "+12 this week" },
            { label: "Interview Pipeline", value: "18", helper: "6 pending review" },
            { label: "Hiring Manager", value: job.hiringManager, helper: "Primary approver" },
            { label: "Posted Date", value: job.postedDate, helper: "Last updated today" },
          ].map((card) => (
            <div key={card.label} className="border border-[#e2dfde] bg-[#f9f9f9] p-5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">
                {card.label}
              </p>
              <p className="mt-2 text-[24px] font-semibold leading-8 text-[#1a1c1c]">
                {card.value}
              </p>
              <p className="mt-1 text-[12px] text-[#5f5e5e]">{card.helper}</p>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="border border-[#e2dfde] bg-white p-6">
              <h3 className="text-[20px] font-semibold leading-7 text-[#1a1c1c]">
                Job Overview
              </h3>
              <p className="mt-3 text-[14px] leading-6 text-[#5f5e5e]">{job.description}</p>

              <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h4 className="text-[14px] font-semibold uppercase tracking-[0.18em] text-[#1a1c1c]">
                    Responsibilities
                  </h4>
                  <ul className="mt-3 space-y-3 text-[14px] leading-6 text-[#5f5e5e]">
                    {job.responsibilities.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#b90014]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-[14px] font-semibold uppercase tracking-[0.18em] text-[#1a1c1c]">
                    Requirements
                  </h4>
                  <ul className="mt-3 space-y-3 text-[14px] leading-6 text-[#5f5e5e]">
                    {job.requirements.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#005f93]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {canManagePosting ? (
              <section className="overflow-hidden border border-[#e2dfde] bg-white">
                <div className="flex items-center justify-between border-b border-[#e2dfde] px-6 py-4">
                  <div>
                    <h3 className="text-[20px] font-semibold leading-7 text-[#1a1c1c]">
                      Recent Applications
                    </h3>
                    <p className="text-[12px] text-[#5f5e5e]">
                      Latest applicants for this posting
                    </p>
                  </div>
                  <span className="text-[12px] font-semibold tracking-[0.05em] text-[#5f5e5e]">
                    {recentApplications.length} records
                  </span>
                </div>

                <CommonTable
                  columns={buildRecentApplicationColumns(handleViewApplication)}
                  data={recentApplications}
                  keyExtractor={(item) => item.id}
                  loading={false}
                  emptyMessage="No recent applications."
                  zebra
                  hover
                  tableWrapperClassName="border-0 rounded-none bg-white"
                />
              </section>
            ) : null}
          </div>

          <aside className="space-y-6">
            {canManagePosting ? (
              <section className="border border-[#e2dfde] bg-white p-6">
                <h3 className="text-[20px] font-semibold leading-7 text-[#1a1c1c]">
                  Hiring Funnel
                </h3>
                <p className="mt-2 text-[12px] text-[#5f5e5e]">
                  Total tracked applications: {totalApplications}
                </p>

                <div className="mt-5 space-y-4">
                  {hiringFunnel.map((stage) => {
                    const width = `${Math.max(10, Math.round((stage.count / maxFunnelValue) * 100))}%`;

                    return (
                      <div key={stage.label}>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[12px] font-semibold tracking-[0.05em] text-[#1a1c1c]">
                            {stage.label}
                          </span>
                          <span className="text-[12px] text-[#5f5e5e]">{stage.count}</span>
                        </div>
                        <div className="h-2 w-full bg-[#e2dfde]">
                          <div className={`h-2 ${stage.colorClassName}`} style={{ width }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}

            <section className="border border-[#e2dfde] bg-[#f9f9f9] p-6">
              <h3 className="text-[20px] font-semibold leading-7 text-[#1a1c1c]">
                Posting Details
              </h3>
              <div className="mt-4 space-y-3 text-[14px] leading-6 text-[#5f5e5e]">
                <p>
                  <span className="font-semibold text-[#1a1c1c]">Department:</span> {job.department}
                </p>
                <p>
                  <span className="font-semibold text-[#1a1c1c]">Level:</span> {job.level}
                </p>
                <p>
                  <span className="font-semibold text-[#1a1c1c]">Owner:</span> {job.hiringManager}
                </p>
                <p>
                  <span className="font-semibold text-[#1a1c1c]">Status:</span>{" "}
                  {isClosed ? "Closed" : "Open"}
                </p>
              </div>
            </section>

            <section className="border border-[#e2dfde] bg-white p-6">
              <h3 className="text-[20px] font-semibold leading-7 text-[#1a1c1c]">
                Benefits
              </h3>
              <ul className="mt-4 space-y-3 text-[14px] leading-6 text-[#5f5e5e]">
                {job.benefits.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#926e6b]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </section>
      </div>
    </div>
  );
}

export default JobDetailScreen;
