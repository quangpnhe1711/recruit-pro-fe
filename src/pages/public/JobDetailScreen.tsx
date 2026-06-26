import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import {
  JobStatus,
  normalizeJobStatus,
  isOpenForApplicationJobStatus,
  getJobStatusPresentation,
} from "../../common/status/jobStatus";
import AsyncActionButton from "../../common/components/AsyncActionButton";
import CommonSelect from "../../common/components/CommonSelect";
import EmptyState from "../../common/components/EmptyState";
import { Skeleton } from "../../common/components/Skeleton";
import type {
  DepartmentDto,
  EmploymentType,
  JobDetailDto,
  JobStatus as JobStatusApi,
  SkillDto,
  WorkMode,
} from "../../modules/jobs/jobsSchema";
import {
  employmentTypeLabels,
  workModeLabels,
} from "../../modules/jobs/jobsSchema";
import {
  formatApplicationStatus,
  getApplicationStatusBadgeClass,
  type ApplicationStatusLabel,
} from "../../common/utils/applicationPresentation";
import {
  getEmploymentTypeBadgeClass,
  getSkillChipClass,
  getWorkModeChipClass,
  quickApplyCardClass,
} from "../../common/utils/jobPresentation";
import PermissionGuard from "../../guards/PermissionGuard";
import { usePermissions } from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../permissions/permissions";
import { ROLE_NAMES } from "../../permissions/rolePermissions";
import { jobsService } from "../../services/jobs/jobsService";

type RecentApplication = {
  id: string;
  candidateName: string;
  applied: string;
  status: ApplicationStatusLabel;
  score: string;
  avatarUrl?: string;
  initials?: string;
};

type FunnelStage = {
  label: string;
  count: number;
};

type JobEditForm = {
  title: string;
  departmentId: string;
  location: string;
  employmentType: EmploymentType | "";
  workMode: WorkMode | "";
  vacancyCount: string;
  minExperienceYears: string;
  salaryMin: string;
  salaryMax: string;
  deadline: string;
  description: string;
  requirements: string;
  benefits: string;
  skills: string;
};

function Icon({ name }: { name: string }) {
  return <span className="material-symbols-outlined">{name}</span>;
}

function formatCurrency(amount: number | null) {
  if (amount == null) return null;

  return `${amount.toLocaleString("vi-VN")} VNĐ`;
}

function toTextBlock(values: string[]) {
  return values.join("\n");
}

function toList(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toEditForm(detail: JobDetailDto): JobEditForm {
  return {
    title: detail.title,
    departmentId: detail.department?.id ?? detail.department?.name ?? "",
    location: detail.location,
    employmentType: detail.employmentType,
    workMode: detail.workMode,
    vacancyCount: String(detail.vacancyCount ?? 1),
    minExperienceYears: String(detail.minExperienceYears ?? 0),
    salaryMin: detail.salaryMin != null ? String(detail.salaryMin) : "",
    salaryMax: detail.salaryMax != null ? String(detail.salaryMax) : "",
    deadline: detail.deadline?.slice(0, 10) ?? "",
    description: detail.description ?? "",
    requirements: toTextBlock(detail.requirements ?? []),
    benefits: toTextBlock(detail.benefits ?? []),
    skills: (detail.skills ?? [])
      .map((skill) => skill.skill?.name ?? "")
      .filter(Boolean)
      .join(", "),
  };
}

function JobDetailScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission, isAuthenticated, portalVariant, primaryRole } =
    usePermissions();
  const { jobId = "" } = useParams();

  const isInternalPortal = isAuthenticated && portalVariant === "internal";
  const isEditRequested =
    new URLSearchParams(location.search).get("mode") === "edit";
  const canEditJob = hasPermission(PERMISSIONS.JOB_UPDATE);
  const canApproveJob = hasPermission(PERMISSIONS.JOB_APPROVE);
  const canViewApplications = hasPermission(PERMISSIONS.JOB_VIEW_APPLICATIONS);
  const canViewRecentApplications = hasPermission(
    PERMISSIONS.JOB_VIEW_RECENT_APPLICATIONS,
  );
  const canViewStatistics = hasPermission(PERMISSIONS.JOB_VIEW_STATISTICS);
  const canShareJob = hasPermission(PERMISSIONS.JOB_SHARE);
  const canApplyJob = hasPermission(PERMISSIONS.JOB_APPLY);
  const showCandidateActions = !isInternalPortal;
  const applicationListPath =
    primaryRole === ROLE_NAMES.MANAGER
      ? "/manager/applications"
      : "/hr/applications";

  const [detail, setDetail] = useState<JobDetailDto | null>(null);

  // UI-005 / INV-001: only an Approved, non-expired job accepts applications. The backend remains the
  // source of truth (422 on submit); this just makes the Apply CTA reflect job status + deadline.
  const jobApplyState = useMemo(() => {
    const status = normalizeJobStatus(detail?.status);
    const open = status !== null && isOpenForApplicationJobStatus(status);
    const deadlinePassed = detail?.deadline
      ? new Date(detail.deadline).getTime() < Date.now()
      : false;
    let reason: string | null = null;
    if (!open) {
      reason = status
        ? `Tin tuyển dụng đang ở trạng thái "${getJobStatusPresentation(status).label}" — không nhận hồ sơ mới.`
        : "Tin tuyển dụng này hiện không nhận hồ sơ mới.";
    } else if (deadlinePassed) {
      reason = "Đã hết hạn nộp hồ sơ cho vị trí này.";
    }
    return { canApply: open && !deadlinePassed, reason };
  }, [detail?.status, detail?.deadline]);
  const [recentApplications, setRecentApplications] = useState<
    RecentApplication[]
  >([]);
  const [hiringFunnel, setHiringFunnel] = useState<FunnelStage[]>([]);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [skills, setSkills] = useState<SkillDto[]>([]);
  const [editForm, setEditForm] = useState<JobEditForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(false);
  const [editing, setEditing] = useState(false);

  const loadDetail = useCallback(async () => {
    setLoading(true);

    try {
      const [response, statisticsResponse, recentApplicationsResponse] =
        await Promise.all([
          isInternalPortal
            ? jobsService.getHrJobDetail(jobId)
            : jobsService.getJobDetail(jobId),
          isInternalPortal
            ? jobsService.getJobStatistics(jobId).catch(() => null)
            : Promise.resolve(null),
          isInternalPortal
            ? jobsService.getRecentJobApplications(jobId).catch(() => null)
            : Promise.resolve(null),
        ]);

      if (!response.data) {
        setDetail(null);
        setRecentApplications([]);
        setHiringFunnel([]);
        return;
      }

      setDetail(response.data);
      setEditForm(toEditForm(response.data));
      setHiringFunnel(
        (statisticsResponse?.data?.hiringFunnel ?? response.data.hiringFunnel ?? []).map((item) => ({
          label: item.label,
          count: item.count,
        })),
      );
      setRecentApplications(
        (recentApplicationsResponse?.data ?? response.data.recentApplications ?? []).slice(0, 5).map((item) => ({
          id: item.id,
          candidateName: item.candidate?.fullName ?? "Unknown candidate",
          applied: item.appliedAt
            ? new Date(item.appliedAt).toLocaleDateString()
            : "",
          status: formatApplicationStatus(item.status),
          score: "0",
          avatarUrl: item.candidate?.avatarUrl ?? undefined,
          initials:
            item.candidate?.fullName
              ?.split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2) ?? undefined,
        })),
      );
    } catch {
      setDetail(null);
      setRecentApplications([]);
      setHiringFunnel([]);
    } finally {
      setLoading(false);
    }
  }, [isInternalPortal, jobId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    if (!isInternalPortal || !canEditJob) {
      setEditing(false);
      return;
    }

    setEditing(isEditRequested);
  }, [canEditJob, isEditRequested, isInternalPortal]);

  useEffect(() => {
    if (!isInternalPortal || !canEditJob) return;

    let mounted = true;

    Promise.all([jobsService.listDepartments(), jobsService.listSkills()])
      .then(([departmentsResponse, skillsResponse]) => {
        if (!mounted) return;
        setDepartments(departmentsResponse.data ?? []);
        setSkills(skillsResponse.data ?? []);
      })
      .catch(() => {
        if (!mounted) return;
        setDepartments([]);
        setSkills([]);
      });

    return () => {
      mounted = false;
    };
  }, [canEditJob, isInternalPortal]);

  const jobSummary = useMemo(() => {
    if (!detail) return null;

    return {
      title: detail.title,
      location: detail.location,
      posted: detail.createdAt
        ? `Đăng ngày ${new Date(detail.createdAt).toLocaleDateString()}`
        : "",
      statusLabel: getJobStatusPresentation(detail.status).label,
      salaryRange:
        detail.salaryLabel ||
        (detail.salaryMin != null || detail.salaryMax != null
          ? `${formatCurrency(detail.salaryMin ?? detail.salaryMax) ?? "0 VNĐ"} — ${formatCurrency(detail.salaryMax ?? detail.salaryMin) ?? "0 VNĐ"}`
          : "Thỏa thuận"),
      department: detail.department?.name ?? "",
      jobType: `${detail.employmentType}${detail.workMode ? `, ${detail.workMode}` : ""}`,
      vacancyCount: detail.vacancyCount ?? 0,
    };
  }, [detail]);

  const totalApplications = useMemo(() => {
    if (detail?.applicationCount) {
      return detail.applicationCount;
    }

    return hiringFunnel.find((item) => item.label.toLowerCase() === "applied")
      ?.count ?? recentApplications.length;
  }, [detail?.applicationCount, hiringFunnel, recentApplications.length]);

  function handleApplyClick() {
    if (!jobId) {
      return;
    }

    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: {
            pathname: `/jobs/${jobId}/apply`,
          },
        },
      });
      return;
    }

    navigate(`/jobs/${jobId}/apply`);
  }

  function updateEditForm<K extends keyof JobEditForm>(
    key: K,
    value: JobEditForm[K],
  ) {
    setEditForm((current) =>
      current ? { ...current, [key]: value } : current,
    );
  }

  async function handleSaveJob() {
    if (!detail || !editForm) return;

    if (!editForm.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề công việc.");
      return;
    }

    setSaving(true);
    try {
      const selectedDepartment = departments.find(
        (department) => department.id === editForm.departmentId,
      );
      await jobsService.updateJob(detail.id, {
        title: editForm.title.trim(),
        departmentId: selectedDepartment?.id ?? null,
        department: selectedDepartment?.name ?? editForm.departmentId,
        location: editForm.location.trim(),
        employmentType: editForm.employmentType || null,
        workMode: editForm.workMode || null,
        vacancyCount: Math.max(Number(editForm.vacancyCount || 1), 1),
        minExperienceYears: Math.max(
          Number(editForm.minExperienceYears || 0),
          0,
        ),
        salaryMin: editForm.salaryMin ? Number(editForm.salaryMin) : null,
        salaryMax: editForm.salaryMax ? Number(editForm.salaryMax) : null,
        deadline: editForm.deadline || null,
        description: editForm.description.trim(),
        requirements: toList(editForm.requirements),
        benefits: toList(editForm.benefits),
        skills: toList(editForm.skills),
      });

      toast.success("Cập nhật tin tuyển dụng thành công.");
      setEditing(false);
      navigate(`/jobs/${detail.id}`, { replace: true });
      await loadDetail();
    } catch {
      toast.error("Hiện chưa thể cập nhật tin tuyển dụng này.");
    } finally {
      setSaving(false);
    }
  }

  async function handleClosePosting() {
    if (!detail) return;

    const confirmed = window.confirm(`Đóng tin tuyển dụng ${detail.title}?`);
    if (!confirmed) return;

    setClosing(true);
    try {
      await jobsService.updateJobStatus(detail.id, {
        status: "CLOSED" as JobStatusApi,
      });
      toast.success("Đã đóng tin tuyển dụng.");
      await loadDetail();
    } catch {
      toast.error("Không thể đóng tin tuyển dụng.");
    } finally {
      setClosing(false);
    }
  }

  async function handleReopenPosting() {
    if (!detail) return;

    const confirmed = window.confirm(`Mở lại tin tuyển dụng ${detail.title}?`);
    if (!confirmed) return;

    setClosing(true);
    try {
      await jobsService.updateJobStatus(detail.id, {
        status: "APPROVED" as JobStatusApi,
      });
      toast.success("Đã mở lại tin tuyển dụng.");
      await loadDetail();
    } catch {
      toast.error("Không thể mở lại tin tuyển dụng.");
    } finally {
      setClosing(false);
    }
  }

  async function handleCopyShareLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Đã sao chép liên kết chia sẻ.");
    } catch {
      toast.error("Không thể sao chép liên kết chia sẻ.");
    }
  }

  if (loading) {
    return (
      <div
        className={`${isInternalPortal ? "w-full" : "mx-auto w-full max-w-[1440px]"} space-y-6 px-4 py-8 md:px-10`}
      >
        <div className="space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="surface-card h-[420px] lg:col-span-8" />
          <div className="surface-card h-[420px] lg:col-span-4" />
        </div>
      </div>
    );
  }

  if (!detail || !jobSummary) {
    return (
      <section
        className={`${isInternalPortal ? "w-full" : "mx-auto w-full max-w-[1440px]"} px-4 py-10 md:px-10`}
      >
        <div className="surface-card p-10">
          <EmptyState
            icon="work_off"
            title="Chi tiết công việc"
            description="Hiện chưa thể tải công việc này. Vui lòng thử lại sau."
          />
        </div>
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c]">
      <main className="flex min-h-screen flex-col">
        <div
          className={`${isInternalPortal ? "w-full" : "mx-auto w-full max-w-[1440px]"} animate-fade-in flex flex-1 flex-col px-4 py-8 md:px-10`}
        >
          <nav className="mb-5 flex items-center gap-1.5 text-[12px] font-semibold text-[#5f5e5e]">
            <button
              type="button"
              className="transition-colors hover:text-[#b90014]"
              onClick={() => navigate("/jobs")}
            >
              Việc làm
            </button>
            <span className="material-symbols-outlined text-[16px] text-[#c8c6c5]">
              chevron_right
            </span>
            <span className="truncate text-[#1a1c1c]">{jobSummary.title}</span>
          </nav>

          <section className="relative mb-6 overflow-hidden rounded-[20px] bg-gradient-to-br from-[#232525] to-[#161718] p-6 text-white md:p-8">
            <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <span className="badge bg-white/10 text-white">{jobSummary.statusLabel}</span>
                  {jobSummary.department ? (
                    <span className="inline-flex items-center gap-1 text-[13px] text-white/70">
                      <span className="material-symbols-outlined text-[16px]">apartment</span>
                      {jobSummary.department}
                    </span>
                  ) : null}
                </div>
                <h2 className="text-[28px] font-bold leading-tight tracking-[-0.02em] md:text-[36px]">
                  {jobSummary.title}
                </h2>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] text-white/80">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-[#ffb3ac]">location_on</span>
                    <span>{jobSummary.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-[#ffb3ac]">payments</span>
                    <span>{jobSummary.salaryRange}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-[#ffb3ac]">group</span>
                    <span>Số lượng tuyển: {jobSummary.vacancyCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-[#ffb3ac]">schedule</span>
                    <span>{jobSummary.posted}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {showCandidateActions ? (
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-white px-5 text-[13px] font-bold text-[#b90014] transition-all hover:bg-[#fff1f0] disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={(isAuthenticated && !canApplyJob) || !jobApplyState.canApply}
                      onClick={handleApplyClick}
                    >
                      <Icon name="send" />
                      Ứng tuyển ngay
                    </button>
                    {!jobApplyState.canApply && jobApplyState.reason ? (
                      <p className="text-[12px] font-medium text-white/80">{jobApplyState.reason}</p>
                    ) : null}
                  </div>
                ) : null}
                <PermissionGuard permissions={PERMISSIONS.JOB_UPDATE}>
                  <button
                    type="button"
                    className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-white/25 bg-white/5 px-5 text-[13px] font-semibold text-white transition-colors hover:bg-white/10"
                    disabled={!canEditJob}
                    onClick={() => {
                      setEditing(true);
                      navigate(`/jobs/${detail.id}?mode=edit`, { replace: true });
                    }}
                  >
                    <Icon name="edit" />
                    Chỉnh sửa
                  </button>
                </PermissionGuard>
                <PermissionGuard permissions={PERMISSIONS.JOB_VIEW_APPLICATIONS}>
                  <button
                    type="button"
                    className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-gradient-to-r from-[#e8242c] to-[#b90014] px-5 text-[13px] font-semibold text-white transition-all hover:brightness-105"
                    disabled={!canViewApplications}
                    onClick={() =>
                      navigate(
                        `${applicationListPath}?jobId=${detail.id}&jobTitle=${encodeURIComponent(detail.title)}`,
                      )
                    }
                  >
                    <Icon name="visibility" />
                    Xem hồ sơ ứng tuyển
                  </button>
                </PermissionGuard>
                {isInternalPortal ? (
                  <PermissionGuard permissions={PERMISSIONS.JOB_UPDATE}>
                    <AsyncActionButton
                      type="button"
                      className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-white/25 bg-white/5 px-5 text-[13px] font-semibold text-[#ffb3ac] transition-colors hover:bg-white/10 disabled:opacity-60"
                      disabled={closing}
                      loading={closing}
                      loadingText={
                        normalizeJobStatus(detail.status) === JobStatus.Closed ? "Đang mở lại..." : "Đang đóng..."
                      }
                      onClick={() =>
                        normalizeJobStatus(detail.status) === JobStatus.Closed
                          ? handleReopenPosting()
                          : handleClosePosting()
                      }
                      spinnerTone="brand"
                    >
                      <Icon name={normalizeJobStatus(detail.status) === JobStatus.Closed ? "refresh" : "close"} />
                      {normalizeJobStatus(detail.status) === JobStatus.Closed ? "Mở lại tin" : "Đóng tin"}
                    </AsyncActionButton>
                  </PermissionGuard>
                ) : null}
              </div>
            </div>
            <div className="absolute bottom-[-30px] right-[-20px] opacity-[0.05]">
              <span className="material-symbols-outlined text-[180px] text-white">work</span>
            </div>
          </section>

          {isInternalPortal && editing && editForm ? (
            <section className="mb-6 border border-[#e7bdb8] bg-white p-8">
              <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h3 className="text-[24px] font-semibold leading-8 text-[#1a1c1c]">
                    Chỉnh sửa chi tiết công việc
                  </h3>
                  <p className="mt-1 text-[14px] text-[#5f5e5e]">
                    HR hiện chỉnh sửa trực tiếp trên màn hình chi tiết công việc
                    thay vì qua popup.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="border border-[#1a1c1c] bg-white px-4 py-2 text-[12px] font-semibold tracking-[0.05em] text-[#1a1c1c] transition-colors hover:bg-[#f3f3f3]"
                    onClick={() => {
                      setEditForm(toEditForm(detail));
                      setEditing(false);
                      navigate(`/jobs/${detail.id}`, { replace: true });
                    }}
                  >
                    Hủy
                  </button>
                  <AsyncActionButton
                    type="button"
                    className="bg-[#b90014] px-4 py-2 text-[12px] font-semibold tracking-[0.05em] text-white transition-colors hover:brightness-110 disabled:opacity-60"
                    disabled={saving}
                    loading={saving}
                    loadingText="Đang lưu..."
                    onClick={handleSaveJob}
                  >
                    Lưu thay đổi
                  </AsyncActionButton>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5f5e5e]">
                    Tiêu đề công việc
                  </span>
                  <input
                    className="h-12 w-full border border-[#e7bdb8] px-4 text-[14px] outline-none transition-colors focus:border-[#1a1c1c]"
                    value={editForm.title}
                    onChange={(event) =>
                      updateEditForm("title", event.target.value)
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5f5e5e]">
                    Phòng ban
                  </span>
                  <CommonSelect
                    className="h-12"
                    options={departments.map((department) => ({
                      label: department.name,
                      value: department.id,
                    }))}
                    value={editForm.departmentId}
                    onChange={(event) =>
                      updateEditForm("departmentId", event.target.value)
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5f5e5e]">
                    Địa điểm
                  </span>
                  <input
                    className="h-12 w-full border border-[#e7bdb8] px-4 text-[14px] outline-none transition-colors focus:border-[#1a1c1c]"
                    value={editForm.location}
                    onChange={(event) =>
                      updateEditForm("location", event.target.value)
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5f5e5e]">
                    Loại hình làm việc
                  </span>
                  <CommonSelect
                    className="h-12"
                    options={Object.entries(employmentTypeLabels).map(
                      ([value, label]) => ({
                        label,
                        value,
                      }),
                    )}
                    value={editForm.employmentType}
                    onChange={(event) =>
                      updateEditForm(
                        "employmentType",
                        event.target.value as EmploymentType,
                      )
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5f5e5e]">
                    Hình thức làm việc
                  </span>
                  <CommonSelect
                    className="h-12"
                    options={Object.entries(workModeLabels).map(
                      ([value, label]) => ({
                        label,
                        value,
                      }),
                    )}
                    value={editForm.workMode}
                    onChange={(event) =>
                      updateEditForm("workMode", event.target.value as WorkMode)
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5f5e5e]">
                    Hạn nộp
                  </span>
                  <input
                    className="h-12 w-full border border-[#e7bdb8] px-4 text-[14px] outline-none transition-colors focus:border-[#1a1c1c]"
                    type="date"
                    value={editForm.deadline}
                    onChange={(event) =>
                      updateEditForm("deadline", event.target.value)
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5f5e5e]">
                    Số lượng tuyển
                  </span>
                  <input
                    className="h-12 w-full border border-[#e7bdb8] px-4 text-[14px] outline-none transition-colors focus:border-[#1a1c1c]"
                    type="number"
                    min={1}
                    value={editForm.vacancyCount}
                    onChange={(event) =>
                      updateEditForm("vacancyCount", event.target.value)
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5f5e5e]">
                    Kinh nghiệm tối thiểu
                  </span>
                  <input
                    className="h-12 w-full border border-[#e7bdb8] px-4 text-[14px] outline-none transition-colors focus:border-[#1a1c1c]"
                    type="number"
                    min={0}
                    value={editForm.minExperienceYears}
                    onChange={(event) =>
                      updateEditForm("minExperienceYears", event.target.value)
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5f5e5e]">
                    Lương tối thiểu
                  </span>
                  <input
                    className="h-12 w-full border border-[#e7bdb8] px-4 text-[14px] outline-none transition-colors focus:border-[#1a1c1c]"
                    type="number"
                    min={0}
                    value={editForm.salaryMin}
                    onChange={(event) =>
                      updateEditForm("salaryMin", event.target.value)
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5f5e5e]">
                    Lương tối đa
                  </span>
                  <input
                    className="h-12 w-full border border-[#e7bdb8] px-4 text-[14px] outline-none transition-colors focus:border-[#1a1c1c]"
                    type="number"
                    min={0}
                    value={editForm.salaryMax}
                    onChange={(event) =>
                      updateEditForm("salaryMax", event.target.value)
                    }
                  />
                </label>
              </div>

              <div className="mt-6 grid gap-6">
                <label className="space-y-2">
                  <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5f5e5e]">
                    Mô tả
                  </span>
                  <textarea
                    className="min-h-36 w-full border border-[#e7bdb8] px-4 py-3 text-[14px] outline-none transition-colors focus:border-[#1a1c1c]"
                    value={editForm.description}
                    onChange={(event) =>
                      updateEditForm("description", event.target.value)
                    }
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5f5e5e]">
                    Yêu cầu
                  </span>
                  <textarea
                    className="min-h-28 w-full border border-[#e7bdb8] px-4 py-3 text-[14px] outline-none transition-colors focus:border-[#1a1c1c]"
                    value={editForm.requirements}
                    onChange={(event) =>
                      updateEditForm("requirements", event.target.value)
                    }
                    placeholder="Mỗi dòng một yêu cầu"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5f5e5e]">
                    Quyền lợi
                  </span>
                  <textarea
                    className="min-h-28 w-full border border-[#e7bdb8] px-4 py-3 text-[14px] outline-none transition-colors focus:border-[#1a1c1c]"
                    value={editForm.benefits}
                    onChange={(event) =>
                      updateEditForm("benefits", event.target.value)
                    }
                    placeholder="Mỗi dòng một quyền lợi"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5f5e5e]">
                    Kỹ năng
                  </span>
                  <textarea
                    className="min-h-24 w-full border border-[#e7bdb8] px-4 py-3 text-[14px] outline-none transition-colors focus:border-[#1a1c1c]"
                    value={editForm.skills}
                    onChange={(event) =>
                      updateEditForm("skills", event.target.value)
                    }
                    placeholder="Phân tách bằng dấu phẩy hoặc mỗi dòng một kỹ năng"
                  />
                  {skills.length ? (
                    <p className="text-[12px] text-[#5f5e5e]">
                      Available skills:{" "}
                      {skills
                        .slice(0, 12)
                        .map((skill) => skill.name)
                        .join(", ")}
                    </p>
                  ) : null}
                </label>
              </div>
            </section>
          ) : null}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="flex flex-col gap-6 lg:col-span-8">
              <section className="card p-6 md:p-8">
                <h3 className="section-title mb-5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#b90014]">
                    description
                  </span>
                  Mô tả công việc
                </h3>

                <div className="space-y-4 whitespace-pre-line text-[14px] leading-7 text-[#5f5e5e]">
                  {detail.description}
                </div>

                <h3 className="section-title mb-5 mt-10 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#b90014]">
                    checklist
                  </span>
                  Yêu cầu
                </h3>

                <ul className="space-y-3 text-[14px] leading-6 text-[#1a1c1c]">
                  {detail.requirements.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="material-symbols-outlined mt-0.5 text-[20px] text-[#b90014]">
                        check_circle
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                {detail.benefits?.length ? (
                  <>
                    <h3 className="section-title mb-5 mt-10 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#b90014]">
                        redeem
                      </span>
                      Quyền lợi
                    </h3>

                    <div className="flex flex-wrap gap-2">
                      {detail.benefits.map((benefit) => (
                        <span
                          key={benefit}
                          className="badge bg-[#f2efed] text-[#5f5e5e]"
                        >
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </>
                ) : null}
              </section>

              <PermissionGuard
                permissions={PERMISSIONS.JOB_VIEW_RECENT_APPLICATIONS}
              >
                <section className="card overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[#f0eceb] px-5 py-4">
                    <h3 className="section-title flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#b90014]">
                        group
                      </span>
                      Hồ sơ gần đây
                    </h3>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#b90014] transition-colors hover:gap-1.5 disabled:opacity-60"
                      disabled={!canViewApplications}
                      onClick={() =>
                        navigate(
                          `${applicationListPath}?jobId=${detail.id}&jobTitle=${encodeURIComponent(detail.title)}`,
                        )
                      }
                    >
                      Xem tất cả {totalApplications}
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px] border-collapse text-left">
                      <thead>
                        <tr className="border-b border-[#ececec]">
                          <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#8a8786]">
                            Ứng viên
                          </th>
                          <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#8a8786]">
                            Applied
                          </th>
                          <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#8a8786]">
                            Status
                          </th>
                          <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#8a8786]">
                            Score
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentApplications.map((item) => (
                          <tr
                            key={item.id}
                            className="border-b border-[#f0eceb] last:border-0 transition-colors hover:bg-[#faf9f8]"
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                {item.avatarUrl ? (
                                  <img
                                    alt="Candidate"
                                    className="h-9 w-9 rounded-full object-cover"
                                    src={item.avatarUrl}
                                  />
                                ) : (
                                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#fff1f0] to-[#ffdad6] text-[12px] font-bold text-[#b90014]">
                                    {item.initials}
                                  </div>
                                )}
                                <p className="text-[14px] font-semibold text-[#1a1c1c]">
                                  {item.candidateName}
                                </p>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-[14px] text-[#5f5e5e]">
                              {item.applied}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`badge ${getApplicationStatusBadgeClass(item.status)}`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-1">
                                <span className="text-[14px] font-bold text-[#1a1c1c]">
                                  {item.score}
                                </span>
                                <span className="text-[12px] text-[#5f5e5e]">
                                  /10
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </PermissionGuard>
            </div>

            <div className="flex flex-col gap-6 lg:col-span-4">
              <PermissionGuard permissions={PERMISSIONS.JOB_VIEW_STATISTICS}>
                <section className="card p-6">
                  <h3 className="section-title mb-5">
                    Hiring Funnel
                  </h3>

                  <div className="space-y-5">
                    {hiringFunnel.map((stage) => (
                      <div key={stage.label}>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="eyebrow">
                            {stage.label}
                          </span>
                          <span className="text-[14px] font-bold text-[#1a1c1c]">
                            {stage.count}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[#f0eceb]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#e8242c] to-[#b90014]"
                            style={{
                              width: `${Math.max(
                                5,
                                Math.round(
                                  (stage.count /
                                    Math.max(
                                      ...hiringFunnel.map((item) => item.count),
                                      1,
                                    )) *
                                    100,
                                ),
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </PermissionGuard>

              <section className={`${quickApplyCardClass} p-6 lg:sticky lg:top-6`}>
                <h3 className="eyebrow mb-5">
                  Thông tin đăng tuyển
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined mt-0.5 text-[20px] text-[#b90014]">payments</span>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#8a8786]">Mức lương</p>
                      <p className="text-[14px] font-semibold text-[#1a1c1c]">{jobSummary.salaryRange}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined mt-0.5 text-[20px] text-[#b90014]">apartment</span>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#8a8786]">Department</p>
                      <p className="text-[14px] font-semibold text-[#1a1c1c]">{jobSummary.department}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined mt-0.5 text-[20px] text-[#b90014]">work</span>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#8a8786]">Loại hình</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className={getEmploymentTypeBadgeClass(detail.employmentType)}>
                          {detail.employmentType}
                        </span>
                        {detail.workMode ? (
                          <span className={getWorkModeChipClass()}>
                            {detail.workMode}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-[#f0eceb] pt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#8a8786]">Kỹ năng</p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {(detail.skills ?? []).map((skill, index) => (
                        <span
                          key={skill.skill.id}
                          className={getSkillChipClass(skill.skill.name, index)}
                        >
                          {skill.skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <PermissionGuard permissions={PERMISSIONS.JOB_SHARE}>
                  <div className="mt-6 border-t border-[#f0eceb] pt-5">
                    <button
                      type="button"
                      className="btn btn-secondary w-full"
                      disabled={!canShareJob}
                      onClick={() => void handleCopyShareLink()}
                    >
                      <span className="material-symbols-outlined text-[18px]">link</span>
                      Copy Shareable Link
                    </button>
                  </div>
                </PermissionGuard>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default JobDetailScreen;
