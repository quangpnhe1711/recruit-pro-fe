import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import CommonSelect from "../../common/components/CommonSelect";
import LoadingIndicator from "../../common/components/LoadingIndicator";
import CommonTable, { TableColumn } from "../../common/components/CommonTable";
import PermissionGuard from "../../guards/PermissionGuard";
import { usePermissions } from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../permissions/permissions";
import { jobsService } from "../../services/jobs/jobsService";

type ApprovalStatus = "Đã duyệt" | "Chờ duyệt" | "Nháp" | "Từ chối" | "Đã đóng";

type Job = {
  id: string;
  title: string;
  department: string;
  createdDate: string; // e.g. "Oct 24, 2024"
  createdAt: number; // epoch ms for sorting
  approvalStatus: ApprovalStatus;
  applicationsCount: number;
  createdByUserId: string;
  createdByName: string;
};

const statusOptions: ("Tất cả trạng thái" | ApprovalStatus)[] = [
  "Tất cả trạng thái",
  "Nháp",
  "Chờ duyệt",
  "Đã duyệt",
  "Đã đóng",
  "Từ chối",
];

const creatorAllOption = "Tất cả người tạo";

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
  onOpenJobDetail: (job: Job) => void,
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
      header: "Tiêu đề công việc",
      renderCell: (job) => (
        <div>
          <button
            type="button"
            className="text-left text-[14px] font-bold text-[#1a1c1c] transition-colors hover:text-[#b90014]"
            onClick={() => onOpenJobDetail(job)}
          >
            {job.title}
          </button>
          <p className="font-mono text-[12px] text-[#5f5e5e]">Mã: {job.id}</p>
        </div>
      ),
    },
    {
      key: "department",
      header: "Phòng ban",
      renderCell: (job) => (
        <p className="text-[14px] text-[#5f5e5e]">{job.department}</p>
      ),
    },
    {
      key: "createdDate",
      header: "Ngày tạo",
      renderCell: (job) => (
        <p className="text-[14px] text-[#5f5e5e]">{job.createdDate}</p>
      ),
    },
    {
      key: "approvalStatus",
      header: "Trạng thái duyệt",
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
      header: "Thao tác",
      alignRight: true,
      headerClassName: "text-right",
      renderCell: (job) => (
        <div className="flex items-center justify-end gap-3">
          {options.canViewApplications ? (
            <button
              type="button"
              className="p-1.5 text-[#5f5e5e] transition-colors hover:text-[#1a1c1c]"
              title="Mở chi tiết công việc"
              onClick={() => onOpenJobDetail(job)}
            >
              <span className="material-symbols-outlined">visibility</span>
            </button>
          ) : null}
          {options.canEditJobs ? (
            <button
              type="button"
              className="p-1.5 text-[#5f5e5e] transition-colors hover:text-[#b90014]"
              title="Chỉnh sửa trong chi tiết công việc"
              onClick={() => onOpenEdit(job)}
            >
              <span className="material-symbols-outlined">edit</span>
            </button>
          ) : null}
          {options.canDeleteJobs ? (
            <button
              type="button"
              className="p-1.5 text-[#5f5e5e] transition-colors hover:text-[#ba1a1a]"
              title="Xóa"
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

function JobManagementScreen() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canCreateJobs = hasPermission(PERMISSIONS.JOB_CREATE);
  const canEditJobs = hasPermission(PERMISSIONS.JOB_UPDATE);
  const canDeleteJobs = hasPermission(PERMISSIONS.JOB_DELETE);
  const canViewApplications = hasPermission(PERMISSIONS.JOB_VIEW_APPLICATIONS);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState({
    activeJobs: 0,
    pendingApproval: 0,
    totalApplications: 0,
    timeToHireDays: 0,
  });
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] =
    useState<string>("Tất cả phòng ban");
  const [statusFilter, setStatusFilter] = useState<string>("Tất cả trạng thái");
  const [creatorFilter, setCreatorFilter] = useState<string>(creatorAllOption);
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    let mounted = true;

    jobsService
      .listHrJobs({ page: 1, pageSize: 1000 })
      .then((response) => {
        if (!mounted) return;

        const items = response.data?.items ?? [];
        setJobs(
          items.map((item) => ({
            id: item.id,
            title: item.title,
            department: item.department.name,
            createdDate: item.createdAt
              ? new Date(item.createdAt).toLocaleDateString()
              : "",
            createdAt: item.createdAt ? Date.parse(item.createdAt) : Date.now(),
            approvalStatus:
              item.status === "APPROVED"
                ? "Đã duyệt"
                : item.status === "CLOSED"
                  ? "Đã đóng"
                : item.status === "REJECTED"
                  ? "Từ chối"
                  : item.status === "DRAFT"
                    ? "Nháp"
                    : "Chờ duyệt",
            applicationsCount: item.applicationCount,
            createdByUserId: item.createdBy.id,
            createdByName: item.createdBy.fullName || "Không rõ",
          })),
        );
        setStats(
          response.data?.stats ?? {
            activeJobs: 0,
            pendingApproval: 0,
            totalApplications: 0,
            timeToHireDays: 0,
          },
        );
      })
      .catch(() => {
        if (mounted) {
          setJobs([]);
          toast.error("Không thể tải danh sách job");
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
        departmentFilter === "Tất cả phòng ban"
          ? true
          : j.department === departmentFilter,
      )
      .filter((j) =>
        statusFilter === "Tất cả trạng thái"
          ? true
          : j.approvalStatus === statusFilter,
      )
      .filter((j) =>
        creatorFilter === creatorAllOption
          ? true
          : j.createdByUserId === creatorFilter,
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [jobs, departmentFilter, statusFilter, creatorFilter]);

  const creatorOptions = useMemo(() => {
    const options = jobs
      .map((job) => ({
        label: job.createdByName,
        value: job.createdByUserId,
      }))
      .filter((option) => option.value)
      .filter(
        (option, index, array) =>
          array.findIndex((candidate) => candidate.value === option.value) ===
          index,
      )
      .sort((a, b) => a.label.localeCompare(b.label));

    return [{ label: creatorAllOption, value: creatorAllOption }, ...options];
  }, [jobs]);

  const departmentOptions = useMemo(() => {
    const options = jobs
      .map((job) => job.department)
      .filter(Boolean)
      .filter(
        (department, index, array) =>
          array.findIndex((candidate) => candidate === department) === index,
      )
      .sort((a, b) => a.localeCompare(b));

    return ["Tất cả phòng ban", ...options];
  }, [jobs]);

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
  }

  function openNewJobModal() {
    navigate("/hr/jobs/create");
  }

  function openEdit(job: Job) {
    navigate(`/jobs/${job.id}?mode=edit`);
  }

  async function deleteJob(job: Job) {
    const ok = window.confirm(`Xóa job ${job.title} (${job.id})?`);
    if (!ok) return;

    try {
      await jobsService.deleteJob(job.id);
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
      toast.info("Đã xóa job.");
    } catch {
      toast.error("Không thể xóa job.");
    }
  }

  function openJobDetail(job: Job) {
    navigate(`/jobs/${job.id}`);
  }

  function goToPage(next: number) {
    const safe = Math.max(1, Math.min(totalPages, next));
    setPage(safe);
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center px-4 py-6 md:px-10">
        <LoadingIndicator label="Loading jobs..." />
      </div>
    );
  }

  return (
    <div className="w-full flex-grow px-4 py-6 md:px-10">
      {/* Header section */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-[32px] font-semibold leading-10 tracking-[-0.01em]">
            Job Management
          </h2>
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
                options={departmentOptions.map((department) => ({
                  label: department,
                  value: department,
                }))}
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  resetToFirstPage();
                }}
              />
            </div>

            <div className="flex items-center gap-2 border border-[#e7bdb8] bg-[#f9f9f9] px-3 py-1">
              <span className="text-[12px] font-semibold tracking-[0.05em] text-[#5f5e5e]">
                Creator:
              </span>
              <CommonSelect
                className="h-9 min-w-[190px] border-none bg-transparent px-0 pr-8 text-[12px] font-semibold tracking-[0.05em] shadow-none focus:ring-0"
                wrapperClassName="min-w-[190px]"
                options={creatorOptions}
                value={creatorFilter}
                onChange={(e) => {
                  setCreatorFilter(e.target.value);
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
            Showing{" "}
            <span className="font-bold text-[#1a1c1c]">
              {rangeStart}-{rangeEnd}
            </span>{" "}
            of <span className="font-bold text-[#1a1c1c]">{totalItems}</span>
          </div>
        </div>

        <CommonTable
          columns={buildJobTableColumns(openJobDetail, openEdit, deleteJob, {
            canDeleteJobs,
            canEditJobs,
            canViewApplications,
          })}
          data={pageSlice}
          keyExtractor={(item) => item.id}
          loading={loading}
          emptyMessage="No jobs found for current filters."
          zebra
          hover
          tableWrapperClassName="border border-[#e7bdb8] bg-white"
          pagination={{
            enabled: true,
            currentPage,
            totalPages,
            totalItems,
            rangeStart,
            rangeEnd,
            onPageChange: goToPage,
          }}
          showPagination
        />
      </section>
    </div>
  );
}

export default JobManagementScreen;
