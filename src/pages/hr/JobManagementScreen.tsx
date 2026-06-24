import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AsyncActionButton from "../../common/components/AsyncActionButton";
import CommonSelect from "../../common/components/CommonSelect";
import CommonTable, { TableColumn } from "../../common/components/CommonTable";
import PageHeader from "../../common/components/PageHeader";
import { Skeleton, SkeletonCard } from "../../common/components/Skeleton";
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
    case "Đã duyệt":
      return {
        wrapper: "bg-[#005f93]/10 text-[#005f93]",
        dot: "bg-[#005f93]",
      };
    case "Chờ duyệt":
      return {
        wrapper: "bg-[#926e6b]/10 text-[#926e6b]",
        dot: "bg-[#926e6b]",
      };
    case "Nháp":
      return {
        wrapper: "bg-[#5f5e5e]/10 text-[#5f5e5e]",
        dot: "bg-[#5f5e5e]",
      };
    case "Từ chối":
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
      header: "Công việc",
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
          <span className={`badge ${chip.wrapper}`}>
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
            <AsyncActionButton
              type="button"
              className="p-1.5 text-[#5f5e5e] transition-colors hover:text-[#ba1a1a]"
              title="Xóa"
              loadingText=""
              onClick={() => onDeleteJob(job)}
              spinnerTone="brand"
            >
              <span className="material-symbols-outlined">delete</span>
            </AsyncActionButton>
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

  const statCards = [
    {
      label: "Job đang mở",
      value: String(stats.activeJobs),
      helper: "Đang mở trên hệ thống",
      icon: "work",
      iconWrap: "from-[#fff1f0] to-[#ffdad6] text-[#b90014]",
    },
    {
      label: "Chờ duyệt",
      value: String(stats.pendingApproval),
      helper: "Cần xử lý",
      icon: "pending_actions",
      iconWrap: "from-amber-50 to-amber-100 text-amber-600",
    },
    {
      label: "Tổng hồ sơ ứng tuyển",
      value: String(stats.totalApplications),
      helper: "Toàn bộ vị trí",
      icon: "description",
      iconWrap: "from-sky-50 to-sky-100 text-sky-600",
    },
    {
      label: "Thời gian tuyển",
      value: `${stats.timeToHireDays}d`,
      helper: "Trung bình",
      icon: "timelapse",
      iconWrap: "from-emerald-50 to-emerald-100 text-emerald-600",
    },
  ];

  if (loading) {
    return (
      <div className="app-container space-y-6 py-8">
        <div className="space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="surface-card h-96" />
      </div>
    );
  }

  return (
    <div className="app-container animate-fade-in flex-grow py-8">
      {/* Header section */}
      <PageHeader
        eyebrow="Tuyển dụng"
        icon="work"
        title="Quản lý job"
        subtitle="Quản lý tin tuyển dụng, theo dõi trạng thái duyệt và lượng hồ sơ ứng tuyển."
        className="mb-7"
        actions={
          <PermissionGuard permissions={PERMISSIONS.JOB_CREATE}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={openNewJobModal}
              disabled={!canCreateJobs}
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Đăng job mới</span>
            </button>
          </PermissionGuard>
        }
      />

      {/* Stats summary */}
      <div className="stagger mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card group">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br ${card.iconWrap} transition-transform duration-200 group-hover:scale-105`}
              >
                <span className="material-symbols-outlined text-[24px]">
                  {card.icon}
                </span>
              </div>
              <div className="min-w-0">
                <p className="eyebrow">{card.label}</p>
                <h3 className="mt-2 text-[30px] font-bold leading-none tracking-[-0.02em] text-[#1a1c1c]">
                  {card.value}
                </h3>
                <p className="mt-2 text-[13px] leading-5 text-[#5f5e5e]">
                  {card.helper}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter / toolbar row */}
      <div className="card mb-4 flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-1 lg:flex-row lg:items-center">
          <CommonSelect
            className="h-[42px] min-w-[180px] text-sm"
            wrapperClassName="w-full lg:w-auto"
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
          <CommonSelect
            className="h-[42px] min-w-[180px] text-sm"
            wrapperClassName="w-full lg:w-auto"
            options={creatorOptions}
            value={creatorFilter}
            onChange={(e) => {
              setCreatorFilter(e.target.value);
              resetToFirstPage();
            }}
          />
          <CommonSelect
            className="h-[42px] min-w-[170px] text-sm"
            wrapperClassName="w-full lg:w-auto"
            options={statusOptions.map((s) => ({ label: s, value: s }))}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              resetToFirstPage();
            }}
          />
        </div>

        <div className="shrink-0 text-[12px] font-semibold tracking-[0.04em] text-[#5f5e5e]">
          Hiển thị{" "}
          <span className="font-bold text-[#1a1c1c]">
            {rangeStart}-{rangeEnd}
          </span>{" "}
          trên tổng{" "}
          <span className="font-bold text-[#1a1c1c]">{totalItems}</span>
        </div>
      </div>

      {/* Job table */}
      <CommonTable
        columns={buildJobTableColumns(openJobDetail, openEdit, deleteJob, {
          canDeleteJobs,
          canEditJobs,
          canViewApplications,
        })}
        data={pageSlice}
        keyExtractor={(item) => item.id}
        loading={loading}
        emptyMessage="Không tìm thấy job phù hợp bộ lọc hiện tại."
        emptyIcon="work_off"
        hover
        onRowClick={(item) => openJobDetail(item)}
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
    </div>
  );
}

export default JobManagementScreen;
