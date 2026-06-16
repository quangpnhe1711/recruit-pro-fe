import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import AsyncActionButton from "../../common/components/AsyncActionButton";
import CommonSelect from "../../common/components/CommonSelect";
import LoadingIndicator from "../../common/components/LoadingIndicator";
import type {
  DepartmentDto,
  EmploymentType,
  JobDetailDto,
  JobStatus,
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
      statusLabel:
        detail.status === "CLOSED"
          ? "Đã đóng"
          : detail.status === "PENDING_APPROVAL"
            ? "Chờ duyệt"
            : detail.status === "DRAFT"
              ? "Nháp"
              : detail.status === "REJECTED"
                ? "Từ chối"
                : "Đang tuyển",
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
        status: "CLOSED" as JobStatus,
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
        status: "APPROVED" as JobStatus,
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
        className={`${isInternalPortal ? "w-full" : "mx-auto w-full max-w-[1440px]"} flex min-h-[60vh] items-center justify-center px-4 py-10 md:px-10`}
      >
        <LoadingIndicator label="Đang tải chi tiết công việc..." />
      </div>
    );
  }

  if (!detail || !jobSummary) {
    return (
      <section
        className={`${isInternalPortal ? "w-full" : "mx-auto w-full max-w-[1440px]"} px-4 py-10 md:px-10`}
      >
        <div className="border border-[#e2dfde] bg-white p-8 text-center">
          <h2 className="text-[24px] font-semibold text-[#1a1c1c]">
            Chi tiết công việc
          </h2>
          <p className="mt-3 text-[14px] text-[#5f5e5e]">
            Hiện chưa thể tải công việc này. Vui lòng thử lại sau.
          </p>
        </div>
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c]">
      <main className="flex min-h-screen flex-col">
        <div
          className={`${isInternalPortal ? "w-full" : "mx-auto w-full max-w-[1440px]"} flex flex-1 flex-col px-6 py-6 md:px-10`}
        >
          <nav className="mb-6 flex items-center gap-2 text-[12px] font-semibold tracking-[0.05em] text-[#5f5e5e]">
            <button
              type="button"
              className="hover:text-[#b90014]"
              onClick={() => navigate("/jobs")}
            >
              Việc làm
            </button>
            <span className="material-symbols-outlined text-[16px]">
              chevron_right
            </span>
            <span className="text-[#1a1c1c]">{jobSummary.title}</span>
          </nav>

          <section className="mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <h2 className="text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#1a1c1c]">
                  {jobSummary.title}
                </h2>
                <span className="rounded-full border border-green-200 bg-green-100 px-3 py-1 text-[12px] font-semibold text-green-800">
                  {jobSummary.statusLabel}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px] text-[#5f5e5e]">
                <div className="flex items-center gap-2">
                  <Icon name="location_on" />
                  <span>{jobSummary.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="schedule" />
                  <span>{jobSummary.posted}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="group" />
                  <span>Số lượng tuyển: {jobSummary.vacancyCount}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {showCandidateActions ? (
                <button
                  type="button"
                  className="bg-[#b90014] px-5 py-2.5 text-[12px] font-semibold tracking-[0.05em] text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isAuthenticated && !canApplyJob}
                  onClick={handleApplyClick}
                >
                  Ứng tuyển ngay
                </button>
              ) : null}
              <PermissionGuard permissions={PERMISSIONS.JOB_UPDATE}>
                <button
                  type="button"
                  className="flex items-center gap-2 border border-black bg-white px-5 py-2.5 text-[12px] font-semibold tracking-[0.05em] text-[#1a1c1c] transition-colors hover:bg-[#f3f3f3]"
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
                  className="flex items-center gap-2 bg-[#b90014] px-5 py-2.5 text-[12px] font-semibold tracking-[0.05em] text-white transition-all hover:brightness-110"
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
                    className="flex items-center gap-2 border border-[#5f5e5e] bg-white px-5 py-2.5 text-[12px] font-semibold tracking-[0.05em] text-[#ba1a1a] transition-colors hover:bg-[#ba1a1a]/5 disabled:opacity-60"
                    disabled={closing}
                    loading={closing}
                    loadingText={
                      detail.status === "CLOSED" ? "Đang mở lại..." : "Đang đóng..."
                    }
                    onClick={() =>
                      detail.status === "CLOSED"
                        ? handleReopenPosting()
                        : handleClosePosting()
                    }
                    spinnerTone="brand"
                  >
                    <Icon name={detail.status === "CLOSED" ? "refresh" : "close"} />
                    {detail.status === "CLOSED" ? "Mở lại tin" : "Đóng tin"}
                  </AsyncActionButton>
                </PermissionGuard>
              ) : null}
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
                    placeholder="Comma separated or one skill per line"
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
              <section className="border border-[#e2dfde] bg-white p-8">
                <h3 className="mb-6 flex items-center gap-2 text-[20px] font-semibold leading-7 text-[#1a1c1c]">
                  <span className="material-symbols-outlined text-[#b90014]">
                    description
                  </span>
                  Mô tả công việc
                </h3>

                <div className="space-y-4 text-[14px] leading-6 text-[#5d3f3c]">
                  {detail.description}
                </div>

                <h3 className="mb-6 mt-10 flex items-center gap-2 text-[20px] font-semibold leading-7 text-[#1a1c1c]">
                  <span className="material-symbols-outlined text-[#b90014]">
                    checklist
                  </span>
                  Yêu cầu
                </h3>

                <ul className="space-y-3 text-[14px] leading-6 text-[#5d3f3c]">
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
                    <h3 className="mb-6 mt-10 flex items-center gap-2 text-[20px] font-semibold leading-7 text-[#1a1c1c]">
                      <span className="material-symbols-outlined text-[#b90014]">
                        redeem
                      </span>
                      Quyền lợi
                    </h3>

                    <div className="flex flex-wrap gap-2">
                      {detail.benefits.map((benefit) => (
                        <span
                          key={benefit}
                          className="rounded-full bg-[#f3f3f3] px-3 py-1.5 text-[12px] font-semibold text-[#1a1c1c]"
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
                <section className="overflow-hidden border border-[#e2dfde] bg-white">
                  <div className="flex items-center justify-between border-b border-[#e2dfde] bg-white px-6 py-4">
                    <h3 className="flex items-center gap-2 text-[20px] font-semibold leading-7 text-[#1a1c1c]">
                      <span className="material-symbols-outlined text-[#b90014]">
                        group
                      </span>
                      Hồ sơ gần đây
                    </h3>
                    <button
                      type="button"
                      className="text-[12px] font-bold tracking-[0.05em] text-[#b90014] hover:underline"
                  disabled={!canViewApplications}
                      onClick={() =>
                        navigate(
                          `${applicationListPath}?jobId=${detail.id}&jobTitle=${encodeURIComponent(detail.title)}`,
                        )
                      }
                    >
                      Xem tất cả {totalApplications}
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead className="bg-[#1A1A1A] text-white">
                        <tr>
                          <th className="px-6 py-4 text-[12px] font-semibold">
                            Ứng viên
                          </th>
                          <th className="px-6 py-4 text-[12px] font-semibold">
                            Applied
                          </th>
                          <th className="px-6 py-4 text-[12px] font-semibold">
                            Status
                          </th>
                          <th className="px-6 py-4 text-[12px] font-semibold">
                            Score
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e2dfde]">
                        {recentApplications.map((item, index) => (
                          <tr
                            key={item.id}
                            className={
                              index % 2 === 1
                                ? "bg-[#f9f9f9] hover:bg-[#eeeeee]"
                                : "hover:bg-[#f9f9f9]"
                            }
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
                                className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getApplicationStatusBadgeClass(item.status)}`}
                              >
                                {item.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
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
                          <div
                            className="h-full bg-[#b90014]"
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

              <section className="border border-[#e2dfde] bg-[#f3f3f3] p-6">
                <h3 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">
                  Thông tin đăng tuyển
                </h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-[#c8c6c5]">
                      Mức lương
                    </p>
                    <p className="text-[14px] font-semibold text-[#1a1c1c]">
                      {jobSummary.salaryRange}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-[#c8c6c5]">
                      Department
                    </p>
                    <p className="text-[14px] font-semibold text-[#1a1c1c]">
                      {jobSummary.department}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-[#c8c6c5]">
                      Loại hình
                    </p>
                    <p className="text-[14px] font-semibold text-[#1a1c1c]">
                      {jobSummary.jobType}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-[#c8c6c5]">
                      Kỹ năng
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(detail.skills ?? []).map((skill) => (
                        <span
                          key={skill.skill.id}
                          className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[#5f5e5e]"
                        >
                          {skill.skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <PermissionGuard permissions={PERMISSIONS.JOB_SHARE}>
                  <div className="mt-8 border-t border-[#e2dfde] pt-6">
                    <button
                      type="button"
                      className="w-full border border-black bg-white py-3 text-[12px] font-bold tracking-[0.05em] text-[#1a1c1c] transition-all hover:bg-black hover:text-white"
                      disabled={!canShareJob}
                      onClick={() => void handleCopyShareLink()}
                    >
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
