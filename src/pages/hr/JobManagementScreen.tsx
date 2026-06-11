import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import CommonSelect from "../../common/components/CommonSelect";
import CommonTable, { TableColumn } from "../../common/components/CommonTable";
import PermissionGuard from "../../guards/PermissionGuard";
import { usePermissions } from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../permissions/permissions";
import { jobsService } from "../../services/jobs/jobsService";

type ApprovalStatus = "Approved" | "Pending" | "Draft" | "Rejected";

type Job = {
  id: string;
  title: string;
  department: string;
  createdDate: string; // e.g. "Oct 24, 2024"
  createdAt: number; // epoch ms for sorting
  approvalStatus: ApprovalStatus;
  applicationsCount: number;
};

type JobDraft = {
  title: string;
  department: string;
  approvalStatus: ApprovalStatus;
};

const createdJobsStorageKey = "rp_internal_created_jobs_v1";

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readCreatedJobsFromStorage(): Job[] {
  const parsed = safeJsonParse<unknown>(window.localStorage.getItem(createdJobsStorageKey));
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((j) => {
      if (!j || typeof j !== "object") return null;
      const obj = j as Record<string, unknown>;

      const id = typeof obj.id === "string" ? obj.id : "";
      const title = typeof obj.title === "string" ? obj.title : "";
      const department = typeof obj.department === "string" ? obj.department : "";
      const createdDate = typeof obj.createdDate === "string" ? obj.createdDate : "";
      const createdAt = typeof obj.createdAt === "number" ? obj.createdAt : Date.now();

      if (!id || !title || !department || !createdDate) return null;

      return {
        id,
        title,
        department,
        createdDate,
        createdAt,
        approvalStatus: "Pending" as ApprovalStatus,
        applicationsCount: 0,
      };
    })
    .filter(Boolean) as Job[];
}

function writeCreatedJobsToStorage(created: Job[]) {
  window.localStorage.setItem(createdJobsStorageKey, JSON.stringify(created));
}

const departments = [
  "All Departments",
  "Engineering",
  "Product",
  "Design",
  "Marketing",
  "Operations",
];

const statusOptions: ("All Statuses" | ApprovalStatus)[] = [
  "All Statuses",
  "Draft",
  "Pending",
  "Approved",
  "Rejected",
];

function parseDateLabelToEpoch(label: string) {
  const parsed = Date.parse(label);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function approvalChip(status: ApprovalStatus) {
  switch (status) {
    case "Approved":
      return {
        wrapper: "bg-[#005f93]/10 text-[#005f93]",
        dot: "bg-[#005f93]",
      };
    case "Pending":
      return {
        wrapper: "bg-[#926e6b]/10 text-[#926e6b]",
        dot: "bg-[#926e6b]",
      };
    case "Draft":
      return {
        wrapper: "bg-[#5f5e5e]/10 text-[#5f5e5e]",
        dot: "bg-[#5f5e5e]",
      };
    case "Rejected":
      return {
        wrapper: "bg-[#ba1a1a]/10 text-[#ba1a1a]",
        dot: "bg-[#ba1a1a]",
      };
    default:
      return { wrapper: "bg-[#eeeeee] text-[#5f5e5e]", dot: "bg-[#5f5e5e]" };
  }
}

function buildJobTableColumns(
  onViewApplications: (job: Job) => void,
  onOpenEdit: (job: Job) => void,
  onDeleteJob: (job: Job) => void,
  options: {
    canDeleteJobs: boolean;
    canEditJobs: boolean;
    canViewApplications: boolean;
  },
): TableColumn<Job>[] {
  return [
    {
      key: "title",
      header: "Job Title",
      renderCell: (job) => (
        <div>
          <p className="text-[14px] font-bold text-[#1a1c1c]">{job.title}</p>
          <p className="font-mono text-[12px] text-[#5f5e5e]">ID: {job.id}</p>
        </div>
      ),
    },
    {
      key: "department",
      header: "Department",
      renderCell: (job) => (
        <p className="text-[14px] text-[#5f5e5e]">{job.department}</p>
      ),
    },
    {
      key: "createdDate",
      header: "Created Date",
      renderCell: (job) => (
        <p className="text-[14px] text-[#5f5e5e]">{job.createdDate}</p>
      ),
    },
    {
      key: "approvalStatus",
      header: "Approval Status",
      renderCell: (job) => {
        const chip = approvalChip(job.approvalStatus);
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold tracking-[0.05em] ${chip.wrapper}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${chip.dot}`} />
            {job.approvalStatus}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      alignRight: true,
      headerClassName: "text-right",
      renderCell: (job) => (
        <div className="flex items-center justify-end gap-3">
          {options.canViewApplications ? (
            <button
              type="button"
              className="p-1.5 text-[#5f5e5e] transition-colors hover:text-[#1a1c1c]"
              title="View Applications"
              onClick={() => onViewApplications(job)}
            >
              <span className="material-symbols-outlined">group</span>
            </button>
          ) : null}
          {options.canEditJobs ? (
            <button
              type="button"
              className="p-1.5 text-[#5f5e5e] transition-colors hover:text-[#b90014]"
              title="Edit"
              onClick={() => onOpenEdit(job)}
            >
              <span className="material-symbols-outlined">edit</span>
            </button>
          ) : null}
          {options.canDeleteJobs ? (
            <button
              type="button"
              className="p-1.5 text-[#5f5e5e] transition-colors hover:text-[#ba1a1a]"
              title="Delete"
              onClick={() => onDeleteJob(job)}
            >
              <span className="material-symbols-outlined">delete</span>
            </button>
          ) : null}
        </div>
      ),
    },
  ];
}

function buildSeedJobs(): Job[] {
  const fixed: Job[] = [
    {
      id: "JB-9402",
      title: "Senior Frontend Engineer",
      department: "Engineering",
      createdDate: "Oct 24, 2024",
      createdAt: parseDateLabelToEpoch("Oct 24, 2024"),
      approvalStatus: "Approved",
      applicationsCount: 38,
    },
    {
      id: "JB-9381",
      title: "Lead UX Researcher",
      department: "Design",
      createdDate: "Oct 26, 2024",
      createdAt: parseDateLabelToEpoch("Oct 26, 2024"),
      approvalStatus: "Pending",
      applicationsCount: 21,
    },
    {
      id: "JB-9214",
      title: "Content Marketing Manager",
      department: "Marketing",
      createdDate: "Oct 12, 2024",
      createdAt: parseDateLabelToEpoch("Oct 12, 2024"),
      approvalStatus: "Draft",
      applicationsCount: 12,
    },
    {
      id: "JB-9105",
      title: "Data Scientist - AI Focus",
      department: "Engineering",
      createdDate: "Sep 28, 2024",
      createdAt: parseDateLabelToEpoch("Sep 28, 2024"),
      approvalStatus: "Rejected",
      applicationsCount: 7,
    },
    {
      id: "JB-8942",
      title: "Customer Success Lead",
      department: "Operations",
      createdDate: "Sep 20, 2024",
      createdAt: parseDateLabelToEpoch("Sep 20, 2024"),
      approvalStatus: "Approved",
      applicationsCount: 29,
    },
  ];

  const fillers: Job[] = [];
  const fillerTitles = [
    "Platform Engineer",
    "Product Manager",
    "QA Automation Engineer",
    "UX Designer",
    "Recruiting Coordinator",
    "Sales Ops Analyst",
    "Data Engineer",
    "DevOps Specialist",
    "Technical Writer",
    "Growth Marketer",
  ];
  const fillerDepartments = ["Engineering", "Product", "Design", "Marketing", "Operations"];
  const fillerStatuses: ApprovalStatus[] = ["Approved", "Pending", "Draft", "Rejected"];

  const idNum = 8900;
  for (let i = 0; i < 37; i += 1) {
    const dep = fillerDepartments[i % fillerDepartments.length];
    const status = fillerStatuses[i % fillerStatuses.length];

    // Deterministic rolling dates in Sep/Oct 2024.
    const day = 1 + ((i * 3) % 28);
    const month = i % 2 === 0 ? "Sep" : "Oct";
    const label = `${month} ${day.toString().padStart(2, "0")}, 2024`;

    fillers.push({
      id: `JB-${idNum + i}`,
      title: fillerTitles[i % fillerTitles.length],
      department: dep,
      createdDate: label,
      createdAt: parseDateLabelToEpoch(label),
      approvalStatus: status,
      applicationsCount: 10 + ((i * 7) % 40),
    });
  }

  const all = [...fixed, ...fillers];

  // Make total applications match the design snapshot (847) deterministically.
  const sum = all.reduce((acc, j) => acc + j.applicationsCount, 0);
  const target = 847;
  const delta = target - sum;
  all[all.length - 1] = {
    ...all[all.length - 1],
    applicationsCount: Math.max(0, all[all.length - 1].applicationsCount + delta),
  };

  return all;
}

function JobManagementScreen() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canCreateJobs = hasPermission(PERMISSIONS.JOB_CREATE);
  const canEditJobs = hasPermission(PERMISSIONS.JOB_UPDATE);
  const canDeleteJobs = hasPermission(PERMISSIONS.JOB_DELETE);
  const canViewApplications = hasPermission(PERMISSIONS.JOB_VIEW_APPLICATIONS);

  const [createdJobIds, setCreatedJobIds] = useState<Set<string>>(() => {
    const created = readCreatedJobsFromStorage();
    return new Set(created.map((j) => j.id));
  });

  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState({
    activeJobs: 0,
    pendingApproval: 0,
    totalApplications: 0,
    timeToHireDays: 0,
  });
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState<string>("All Departments");
  const [statusFilter, setStatusFilter] = useState<string>("All Statuses");
  const [page, setPage] = useState<number>(1);
  const [pageInput, setPageInput] = useState<string>("1");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<JobDraft>({
    title: "",
    department: "Engineering",
    approvalStatus: "Draft",
  });

  useEffect(() => {
    let mounted = true;

    jobsService
      .listHrJobs()
      .then((response) => {
        if (!mounted) return;

        const items = response.data?.items ?? [];
        setJobs(
          items.map((item) => ({
            id: item.id,
            title: item.title,
            department: item.department.name,
            createdDate: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "",
            createdAt: item.createdAt ? Date.parse(item.createdAt) : Date.now(),
            approvalStatus:
              item.status === "APPROVED"
                ? "Approved"
                : item.status === "REJECTED"
                  ? "Rejected"
                  : item.status === "DRAFT"
                    ? "Draft"
                    : "Pending",
            applicationsCount: item.applicationCount,
          })),
        );
        setStats(response.data?.stats ?? {
          activeJobs: 0,
          pendingApproval: 0,
          totalApplications: 0,
          timeToHireDays: 0,
        });
      })
      .catch(() => {
        if (mounted) {
          setJobs([]);
          toast.error("Unable to load jobs");
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return jobs
      .filter((j) =>
        departmentFilter === "All Departments" ? true : j.department === departmentFilter
      )
      .filter((j) =>
        statusFilter === "All Statuses" ? true : j.approvalStatus === statusFilter
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [jobs, departmentFilter, statusFilter]);

  const pageSize = 10;
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);

  const pageSlice = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalItems);

  function resetToFirstPage() {
    setPage(1);
    setPageInput("1");
  }

  function openNewJobModal() {
    navigate("/hr/jobs/create");
  }

  function openEdit(job: Job) {
    setEditingId(job.id);
    setDraft({
      title: job.title,
      department: job.department,
      approvalStatus: job.approvalStatus,
    });
    setModalOpen(true);
  }

  async function saveModal() {
    if (!draft.title.trim()) {
      toast.error("Job title is required.");
      return;
    }

    if (editingId) {
      const nextTitle = draft.title.trim();
      const nextDepartment = draft.department;
      const nextStatus = draft.approvalStatus;

      try {
        await jobsService.updateJob(editingId, {
          title: nextTitle,
          department: nextDepartment,
          status:
            nextStatus === "Approved"
              ? "APPROVED"
              : nextStatus === "Rejected"
                ? "REJECTED"
                : nextStatus === "Draft"
                  ? "DRAFT"
                  : "PENDING_APPROVAL",
        });

        setJobs((prev) =>
          prev.map((j) =>
            j.id === editingId
              ? {
                  ...j,
                  title: nextTitle,
                  department: nextDepartment,
                  approvalStatus: nextStatus,
                }
              : j,
          ),
        );

        toast.success("Job updated.");
      } catch {
        toast.error("Unable to update job.");
        return;
      }
    } else {
      // Creating new jobs is handled via /hr/jobs/create.
      openNewJobModal();
      return;
    }

    setModalOpen(false);
  }

  async function deleteJob(job: Job) {
    const ok = window.confirm(`Delete ${job.title} (${job.id})?`);
    if (!ok) return;

    try {
      await jobsService.deleteJob(job.id);
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
      toast.info("Job deleted.");
    } catch {
      toast.error("Unable to delete job.");
    }
  }

  function viewApplications(job: Job) {
    navigate(`/jobs/${job.id}`);
  }

  function goToPage(next: number) {
    const safe = Math.max(1, Math.min(totalPages, next));
    setPage(safe);
    setPageInput(String(safe));
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] flex-grow px-4 py-6 md:px-10">
            {/* Header section */}
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-[32px] font-semibold leading-10 tracking-[-0.01em]">
                  Job Management
                </h2>
                <p className="mt-1 text-[14px] text-[#5f5e5e]">
                  Manage, track, and review the recruitment vacancies you created.
                </p>
              </div>

              <button
                type="button"
                className="flex items-center gap-2 bg-[#b90014] px-6 py-3 text-[14px] font-semibold text-white shadow-sm transition-all hover:brightness-110 active:scale-95"
                onClick={openNewJobModal}
                disabled={!canCreateJobs}
              >
                <span className="material-symbols-outlined">add</span>
                Post New Job
              </button>
            </div>

            {/* Stats summary */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
              <div className="border border-[#e7bdb8] bg-[#f3f3f3] p-5">
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">
                  Active Jobs
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-[32px] font-semibold leading-10 tracking-[-0.01em]">
                    {stats.activeJobs}
                  </span>
                  <span className="text-[12px] font-semibold tracking-[0.05em] text-[#b90014]">
                    +3 this week
                  </span>
                </div>
              </div>
              <div className="border border-[#e7bdb8] bg-[#f3f3f3] p-5">
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">
                  Pending Approval
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-[32px] font-semibold leading-10 tracking-[-0.01em]">
                    {stats.pendingApproval}
                  </span>
                  <span className="text-[12px] font-semibold tracking-[0.05em] text-[#005f93]">
                    Review needed
                  </span>
                </div>
              </div>
              <div className="border border-[#e7bdb8] bg-[#f3f3f3] p-5">
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">
                  Total Applications
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-[32px] font-semibold leading-10 tracking-[-0.01em]">
                    {stats.totalApplications}
                  </span>
                  <span className="text-[12px] font-semibold tracking-[0.05em] text-[#5f5e5e]">
                    Across all roles
                  </span>
                </div>
              </div>
              <div className="border border-[#e7bdb8] bg-[#f3f3f3] p-5">
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">
                  Time to Hire
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-[32px] font-semibold leading-10 tracking-[-0.01em]">
                    {stats.timeToHireDays}d
                  </span>
                  <span className="text-[12px] font-semibold tracking-[0.05em] text-[#004b74]">
                    Avg. Efficiency
                  </span>
                </div>
              </div>
            </div>

            {/* Table container */}
            <section className="overflow-hidden border border-[#e7bdb8] bg-[#f9f9f9]">
              <div className="flex flex-col gap-4 border-b border-[#e7bdb8] bg-white px-6 py-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 border border-[#e7bdb8] bg-[#f9f9f9] px-3 py-1">
                    <span className="text-[12px] font-semibold tracking-[0.05em] text-[#5f5e5e]">
                      Filter by:
                    </span>
                    <CommonSelect
                      className="h-9 min-w-[190px] border-none bg-transparent px-0 pr-8 text-[12px] font-semibold tracking-[0.05em] shadow-none focus:ring-0"
                      wrapperClassName="min-w-[190px]"
                      options={departments.map((d) => ({ label: d, value: d }))}
                      value={departmentFilter}
                      onChange={(e) => {
                        setDepartmentFilter(e.target.value);
                        resetToFirstPage();
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-2 border border-[#e7bdb8] bg-[#f9f9f9] px-3 py-1">
                    <span className="text-[12px] font-semibold tracking-[0.05em] text-[#5f5e5e]">
                      Status:
                    </span>
                    <CommonSelect
                      className="h-9 min-w-[170px] border-none bg-transparent px-0 pr-8 text-[12px] font-semibold tracking-[0.05em] shadow-none focus:ring-0"
                      wrapperClassName="min-w-[170px]"
                      options={statusOptions.map((s) => ({ label: s, value: s }))}
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        resetToFirstPage();
                      }}
                    />
                  </div>
                </div>

                <div className="text-[12px] font-semibold tracking-[0.05em] text-[#5f5e5e]">
                  Showing <span className="font-bold text-[#1a1c1c]">{rangeStart}-{rangeEnd}</span> of{" "}
                  <span className="font-bold text-[#1a1c1c]">{totalItems}</span>
                </div>
              </div>

              <CommonTable
                columns={buildJobTableColumns(
                  viewApplications,
                  openEdit,
                  deleteJob,
                  {
                    canDeleteJobs,
                    canEditJobs,
                    canViewApplications,
                  },
                )}
                data={pageSlice}
                keyExtractor={(item) => item.id}
                loading={loading}
                emptyMessage="No jobs found for current filters."
                zebra
                hover
                tableWrapperClassName="border border-[#e7bdb8] bg-white"
              />

              {/* Pagination */}
              <div className="flex flex-col gap-4 border-t border-[#e7bdb8] bg-white px-6 py-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center border border-[#e7bdb8] transition-colors hover:bg-[#f3f3f3] disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                    aria-label="Previous page"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      chevron_left
                    </span>
                  </button>

                  {/* Render: 1 2 3 ... last */}
                  {Array.from({ length: Math.min(3, totalPages) }, (_, i) => i + 1).map(
                    (n) => (
                      <button
                        key={n}
                        type="button"
                        className={`flex h-8 w-8 items-center justify-center border text-[12px] font-semibold tracking-[0.05em] transition-colors ${
                          n === currentPage
                            ? "border-[#1a1c1c] bg-[#1a1c1c] text-white"
                            : "border-[#e7bdb8] hover:bg-[#f3f3f3]"
                        }`}
                        onClick={() => goToPage(n)}
                      >
                        {n}
                      </button>
                    )
                  )}

                  {totalPages > 4 ? (
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center border border-[#e7bdb8] text-[12px] font-semibold tracking-[0.05em] transition-colors hover:bg-[#f3f3f3]"
                      onClick={() => toast.info("Jump using Go to page")}
                      aria-label="More pages"
                    >
                      ...
                    </button>
                  ) : null}

                  {totalPages > 3 ? (
                    <button
                      type="button"
                      className={`flex h-8 w-8 items-center justify-center border text-[12px] font-semibold tracking-[0.05em] transition-colors ${
                        totalPages === currentPage
                          ? "border-[#1a1c1c] bg-[#1a1c1c] text-white"
                          : "border-[#e7bdb8] hover:bg-[#f3f3f3]"
                      }`}
                      onClick={() => goToPage(totalPages)}
                    >
                      {totalPages}
                    </button>
                  ) : null}

                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center border border-[#e7bdb8] transition-colors hover:bg-[#f3f3f3] disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    aria-label="Next page"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      chevron_right
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-4 text-[12px] font-semibold tracking-[0.05em] text-[#5f5e5e]">
                  <span>Go to page:</span>
                  <input
                    className="h-8 w-12 border border-[#e7bdb8] text-center outline-none transition-colors focus:border-[#1a1c1c]"
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value.replace(/[^0-9]/g, ""))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const next = Number(pageInput);
                        if (!next) {
                          toast.error("Invalid page");
                          return;
                        }
                        goToPage(next);
                      }
                    }}
                  />
                </div>
              </div>
            </section>

          {/* Modal */}
        {modalOpen && canEditJobs ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-xl border border-[#e7bdb8] bg-white">
              <div className="flex items-center justify-between border-b border-[#e7bdb8] px-6 py-4">
                <h3 className="text-[20px] font-semibold text-[#1a1c1c]">
                  {editingId ? "Edit Job" : "Post New Job"}
                </h3>
                <button
                  type="button"
                  className="text-[#5f5e5e] hover:text-[#1a1c1c]"
                  onClick={() => setModalOpen(false)}
                  aria-label="Close"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-6 px-6 py-6">
                <div className="space-y-2">
                  <label className="block text-[12px] font-semibold tracking-[0.05em] text-[#5f5e5e]">
                    Job Title
                  </label>
                  <input
                    className="h-12 w-full border border-[#e7bdb8] px-4 outline-none transition-colors focus:border-[#1a1c1c]"
                    value={draft.title}
                    onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                    placeholder="e.g. Senior Backend Engineer"
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-[12px] font-semibold tracking-[0.05em] text-[#5f5e5e]">
                      Department
                    </label>
                    <CommonSelect
                      className="h-12"
                      options={departments
                        .filter((d) => d !== "All Departments")
                        .map((d) => ({ label: d, value: d }))}
                      value={draft.department}
                      onChange={(e) => setDraft((d) => ({ ...d, department: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[12px] font-semibold tracking-[0.05em] text-[#5f5e5e]">
                      Approval Status
                    </label>
                    <CommonSelect
                      className="h-12"
                      options={["Draft", "Pending", "Approved", "Rejected"].map((s) => ({ label: s, value: s }))}
                      value={draft.approvalStatus}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          approvalStatus: e.target.value as ApprovalStatus,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-[#e7bdb8] bg-[#f3f3f3] px-6 py-4">
                <button
                  type="button"
                  className="border border-[#1a1c1c] bg-white px-4 py-2 text-[12px] font-semibold tracking-[0.05em] text-[#1a1c1c] transition-colors hover:bg-[#f3f3f3]"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="bg-[#b90014] px-4 py-2 text-[12px] font-semibold tracking-[0.05em] text-white transition-colors hover:brightness-110 active:scale-[0.98]"
                  onClick={saveModal}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : null}
    </div>
  );
}

export default JobManagementScreen;
