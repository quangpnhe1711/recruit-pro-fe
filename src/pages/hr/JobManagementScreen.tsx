import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import CommonSelect from "../../common/components/CommonSelect";
import CommonTable, { TableColumn } from "../../common/components/CommonTable";
import PageHeader from "../../common/components/PageHeader";
import { Skeleton, SkeletonCard } from "../../common/components/Skeleton";
import PermissionGuard from "../../guards/PermissionGuard";
import { usePermissions } from "../../hooks/usePermissions";
import { useI18n } from "../../i18n";
import { PERMISSIONS } from "../../permissions/permissions";
import { jobsService } from "../../services/jobs/jobsService";
import {
  JobStatus,
  normalizeJobStatus,
  getJobStatusPresentation,
  jobStatusFilterOptions,
} from "../../common/status/jobStatus";
import { toneBadgeClassName } from "../../common/status/statusPresentation";
import { describeDeadline } from "../../common/utils/jobPresentation";
// ConfirmModal is the shared design-system dialog (lives with the sysadmin UI helpers).
import { ConfirmModal } from "../system-admin/automationUi";

type Job = {
  id: string;
  title: string;
  department: string;
  createdDate: string; // e.g. "Oct 24, 2024"
  createdAt: number; // epoch ms for sorting
  deadline: string | null;
  status: JobStatus;
  applicationsCount: number;
  createdByUserId: string;
  createdByName: string;
  // Ownership snapshot (Phase 2/3) — display-only, optional. recruiter = business owner;
  // departmentHead = effective head (falls back to the approver on the backend). Both may be null.
  recruiterName: string | null;
  departmentHeadName: string | null;
};

const creatorAllOption = "allCreators";
const departmentAllOption = "allDepartments";

function buildJobTableColumns(
  t: (key: string, vars?: Record<string, string | number>) => string,
  onOpenJobDetail: (job: Job) => void,
  onOpenApplications: (job: Job) => void,
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
      header: t("jobManagement.job"),
      renderCell: (job) => (
        <div>
          <button
            type="button"
            className="text-left text-[14px] font-bold text-[#1a1c1c] transition-colors hover:text-[#b90014]"
            onClick={() => onOpenJobDetail(job)}
          >
            {job.title}
          </button>
          <p className="font-mono text-[12px] text-[#5f5e5e]">{t("jobManagement.code")}: {job.id}</p>
        </div>
      ),
    },
    {
      key: "department",
      header: t("jobManagement.department"),
      renderCell: (job) => (
        <p className="text-[14px] text-[#5f5e5e]">{job.department}</p>
      ),
    },
    {
      key: "owner",
      header: t("jobManagement.owners"),
      renderCell: (job) => (
        <div className="space-y-0.5 text-[12px] leading-5">
          <p className="text-[#1a1c1c]">
            <span className="text-[#8a8786]">{t("jobManagement.recruiter")}: </span>
            {job.recruiterName || job.createdByName || t("jobManagement.unassigned")}
          </p>
          <p className="text-[#5f5e5e]">
            <span className="text-[#8a8786]">{t("jobManagement.departmentHead")}: </span>
            {job.departmentHeadName || t("jobManagement.noDepartmentHead")}
          </p>
        </div>
      ),
    },
    {
      key: "createdDate",
      header: t("common.createdAt"),
      renderCell: (job) => (
        <p className="text-[14px] text-[#5f5e5e]">{job.createdDate}</p>
      ),
    },
    {
      key: "deadline",
      header: t("jobManagement.deadline"),
      renderCell: (job) => {
        const { state, date, daysLeft } = describeDeadline(job.deadline);
        if (state === "none" || !date) {
          return <p className="text-[13px] text-[#8a8786]">{t("jobManagement.noDeadline")}</p>;
        }
        const dateText = date.toLocaleDateString();
        if (state === "expired") {
          return (
            <div className="space-y-0.5">
              <p className="text-[14px] text-[#5f5e5e]">{dateText}</p>
              <span className="badge border border-rose-200 bg-rose-50 text-rose-700">
                {t("jobManagement.deadlineExpired")}
              </span>
            </div>
          );
        }
        if (state === "closingSoon") {
          return (
            <div className="space-y-0.5">
              <p className="text-[14px] text-[#5f5e5e]">{dateText}</p>
              <span className="badge border border-amber-200 bg-amber-50 text-amber-700">
                {t("jobManagement.closingSoon", { days: String(daysLeft ?? 0) })}
              </span>
            </div>
          );
        }
        return <p className="text-[14px] text-[#5f5e5e]">{dateText}</p>;
      },
    },
    {
      key: "status",
      header: t("jobManagement.approvalStatus"),
      renderCell: (job) => {
        const presentation = getJobStatusPresentation(job.status);
        return (
          <span className={`badge ${toneBadgeClassName(presentation.tone)}`}>
            {presentation.label}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: t("common.actions"),
      alignRight: true,
      headerClassName: "text-right",
      renderCell: (job) => (
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            className="p-1.5 text-[#5f5e5e] transition-colors hover:text-[#1a1c1c]"
            title={t("common.viewDetail")}
            onClick={() => onOpenJobDetail(job)}
          >
            <span className="material-symbols-outlined">visibility</span>
          </button>
          {options.canDeleteJobs ? (
            <button
              type="button"
              className="p-1.5 text-[#5f5e5e] transition-colors hover:text-[#ba1a1a]"
              title={t("common.delete")}
              aria-label={t("common.delete")}
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
  const { t } = useI18n();
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
    useState<string>(departmentAllOption);
  const [statusFilter, setStatusFilter] = useState<"all" | JobStatus>("all");
  const [creatorFilter, setCreatorFilter] = useState<string>(creatorAllOption);
  const [page, setPage] = useState<number>(1);
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);
  const [deleting, setDeleting] = useState(false);

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
            deadline: item.deadline ?? null,
            status: normalizeJobStatus(item.status) ?? JobStatus.PendingApproval,
            applicationsCount: item.applicationCount,
            createdByUserId: item.createdBy.id,
            createdByName: item.createdBy.fullName || t("jobManagement.unknown"),
            recruiterName: item.recruiterName ?? null,
            departmentHeadName:
              item.effectiveDepartmentHeadName ?? item.departmentHeadName ?? null,
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
          toast.error(t("jobManagement.loadFailed"));
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
        departmentFilter === departmentAllOption
          ? true
          : j.department === departmentFilter,
      )
      .filter((j) =>
        statusFilter === "all" ? true : j.status === statusFilter,
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

    return [{ label: t("jobManagement.allCreators"), value: creatorAllOption }, ...options];
  }, [jobs, t]);

  const departmentOptions = useMemo(() => {
    const options = jobs
      .map((job) => job.department)
      .filter(Boolean)
      .filter(
        (department, index, array) =>
          array.findIndex((candidate) => candidate === department) === index,
      )
      .sort((a, b) => a.localeCompare(b));

    return [departmentAllOption, ...options];
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

  async function confirmDeleteJob() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await jobsService.deleteJob(deleteTarget.id);
      setJobs((prev) => prev.filter((j) => j.id !== deleteTarget.id));
      toast.info(t("jobManagement.deleted"));
      setDeleteTarget(null);
    } catch {
      toast.error(t("jobManagement.deleteFailed"));
    } finally {
      setDeleting(false);
    }
  }

  function openJobDetail(job: Job) {
    navigate(`/jobs/${job.id}`);
  }

  function openApplications(job: Job) {
    navigate(
      `/hr/applications?jobId=${job.id}&jobTitle=${encodeURIComponent(job.title)}`,
    );
  }

  function goToPage(next: number) {
    const safe = Math.max(1, Math.min(totalPages, next));
    setPage(safe);
  }

  const statCards = [
    {
      label: t("jobManagement.statActiveJobs"),
      value: String(stats.activeJobs),
      helper: t("jobManagement.statActiveJobsHelper"),
      icon: "work",
      iconWrap: "from-[#fff1f0] to-[#ffdad6] text-[#b90014]",
    },
    {
      label: t("jobManagement.statPendingApproval"),
      value: String(stats.pendingApproval),
      helper: t("jobManagement.statPendingApprovalHelper"),
      icon: "pending_actions",
      iconWrap: "from-amber-50 to-amber-100 text-amber-600",
    },
    {
      label: t("jobManagement.statTotalApplications"),
      value: String(stats.totalApplications),
      helper: t("jobManagement.statTotalApplicationsHelper"),
      icon: "description",
      iconWrap: "from-sky-50 to-sky-100 text-sky-600",
    },
    {
      label: t("jobManagement.statTimeToHire"),
      value: `${stats.timeToHireDays}d`,
      helper: t("jobManagement.statTimeToHireHelper"),
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
        eyebrow={t("jobManagement.eyebrow")}
        icon="work"
        title={t("jobManagement.title")}
        subtitle={t("jobManagement.subtitle")}
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
              <span>{t("jobManagement.postJob")}</span>
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
              label: department === departmentAllOption ? t("jobManagement.allDepartments") : department,
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
            options={jobStatusFilterOptions}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as "all" | JobStatus);
              resetToFirstPage();
            }}
          />
        </div>

        <div className="shrink-0 text-[12px] font-semibold tracking-[0.04em] text-[#5f5e5e]">
          {t("jobManagement.showing")}{" "}
          <span className="font-bold text-[#1a1c1c]">
            {rangeStart}-{rangeEnd}
          </span>{" "}
          {t("common.of")}{" "}
          <span className="font-bold text-[#1a1c1c]">{totalItems}</span>
        </div>
      </div>

      {/* Job table */}
      <CommonTable
        columns={buildJobTableColumns(
          t,
          openJobDetail,
          openApplications,
          openEdit,
          (job) => setDeleteTarget(job),
          {
            canDeleteJobs,
            canEditJobs,
            canViewApplications,
          },
        )}
        data={pageSlice}
        keyExtractor={(item) => item.id}
        loading={loading}
        emptyMessage={t("jobManagement.empty")}
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

      <ConfirmModal
        open={deleteTarget != null}
        title={t("jobManagement.deleteConfirmTitle")}
        danger
        busy={deleting}
        confirmLabel={t("common.delete")}
        onConfirm={confirmDeleteJob}
        onClose={() => setDeleteTarget(null)}
      >
        {deleteTarget
          ? t("jobManagement.deleteConfirm", { title: deleteTarget.title, id: deleteTarget.id })
          : null}
      </ConfirmModal>
    </div>
  );
}

export default JobManagementScreen;
