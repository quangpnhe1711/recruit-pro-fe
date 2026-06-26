import { type ReactNode, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ApplicationStatus,
  normalizeApplicationStatus,
} from "../../common/status/applicationStatus";
import { isOfferActionableStatus } from "../../common/status/offerStatus";
import { getApplicationErrorMessage } from "../../common/utils/apiError";
import AsyncActionButton from "../../common/components/AsyncActionButton";
import Badge from "../../common/components/Badge";
import { Skeleton, SkeletonText } from "../../common/components/Skeleton";
import {
  downloadProtectedFile,
  fetchProtectedFileBlob,
  openProtectedFileInNewTab,
} from "../../common/utils/protectedFile";
import {
  buildPdfViewerUrl,
  buildResumeDownloadPath,
  buildResumePreviewPath,
} from "../../common/utils/resumeLinks";
import {
  formatApplicationStatus,
  getApplicationStatusBadgeClass,
} from "../../common/utils/applicationPresentation";
import { getSkillChipClass } from "../../common/utils/jobPresentation";
import PermissionGuard from "../../guards/PermissionGuard";
import { usePermissions } from "../../hooks/usePermissions";
import type {
  ApplicationReviewDecision,
  ApplicationReviewDetailDto,
} from "../../modules/jobs/jobsSchema";
import { PERMISSIONS } from "../../permissions/permissions";
import { ROLE_NAMES } from "../../permissions/rolePermissions";
import { hrService } from "../../services/hr/hrService";

function formatDateLabel(value: string | null) {
  if (!value) return "Chưa có";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTimeLabel(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatApplicationStatusVi(status: string) {
  return formatApplicationStatus(status);
}

function formatStatusDescriptionVi(status: string) {
  switch (
    status
      .trim()
      .toLowerCase()
      .replace(/[_\s-]+/g, "")
  ) {
    case "applied":
      return "Hồ sơ đã được tiếp nhận và đang chờ bộ phận Nhân sự bắt đầu sàng lọc.";

    case "screening":
      return "Bộ phận Nhân sự đang tiến hành sàng lọc hồ sơ.";

    case "managerreview":
      return "Hồ sơ đang chờ Quản lý tuyển dụng đánh giá.";

    case "interview":
      return "Ứng viên đang trong giai đoạn phỏng vấn.";

    case "offer":
      return "Ứng viên đã vượt qua các vòng đánh giá và đang trong quá trình xử lý thư mời nhận việc.";

    case "hired":
      return "Ứng viên đã nhận việc.";

    case "rejected":
      return "Hồ sơ đã kết thúc quy trình tuyển dụng.";

    case "offerdeclined":
      return "Ứng viên đã từ chối thư mời nhận việc.";

    default:
      return "Đang theo dõi trạng thái hồ sơ.";
  }
}

function formatOfferStatusVi(status: string | null) {
  switch (status?.trim().toLowerCase()) {
    case "draft":
      return "Bản nháp";
    case "sent":
      return "Đã gửi";
    case "accepted":
      return "Đã chấp nhận";
    case "declined":
      return "Đã từ chối";
    default:
      return status ?? "Chưa tạo";
  }
}

function decisionButtonClassName(decision: ApplicationReviewDecision) {
  switch (decision) {
    case "Screening":
      return "border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100";
    case "ManagerReview":
      return "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100";
    case "Interview":
      return "border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100";
    case "Offer":
      return "border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100";
    case "Rejected":
      return "border-red-200 bg-red-50 text-red-800 hover:bg-red-100";
  }
}

function decisionLabel(decision: ApplicationReviewDecision) {
  switch (decision) {
    case "Screening":
      return "Chuyển sàng lọc";
    case "ManagerReview":
      return "Gửi quản lý duyệt";
    case "Interview":
      return "Chuyển phỏng vấn";
    case "Offer":
      return "Chuyển offer";
    case "Rejected":
      return "Từ chối hồ sơ";
  }
}

function decisionIcon(decision: ApplicationReviewDecision) {
  switch (decision) {
    case "Screening":
      return "manage_search";
    case "ManagerReview":
      return "check_circle";
    case "Interview":
      return "event";
    case "Offer":
      return "approval";
    case "Rejected":
      return "cancel";
  }
}

function SectionCard({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b border-[#f0eceb] px-5 py-4">
        <h2 className="section-title">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8786]">
        {label}
      </p>
      <div className="mt-1 break-words text-[14px] font-medium text-[#1a1c1c]">
        {value || "Chưa cập nhật"}
      </div>
    </div>
  );
}

function getAvailableDecisions(
  status: string,
  role: string | null,
): ApplicationReviewDecision[] {
  switch (status.toLowerCase()) {
    case "applied":
      return role === ROLE_NAMES.HR ? ["Screening"] : [];
    case "screening":
      return role === ROLE_NAMES.HR ? ["ManagerReview", "Rejected"] : [];
    case "managerreview":
      return role === ROLE_NAMES.MANAGER ? ["Interview", "Rejected"] : [];
    case "interview":
      return role === ROLE_NAMES.HR ? ["Offer", "Rejected"] : [];
    default:
      return [];
  }
}

function CandidateReviewDetailScreen() {
  const navigate = useNavigate();
  const { applicationId = "" } = useParams();
  const { hasPermission, primaryRole } = usePermissions();
  const canApprove = hasPermission(PERMISSIONS.APPLICATION_APPROVE);
  const canReject = hasPermission(PERMISSIONS.APPLICATION_REJECT);
  const canViewCv = hasPermission(PERMISSIONS.APPLICATION_VIEW_CV);
  const canSendOffer =
    primaryRole === ROLE_NAMES.HR &&
    hasPermission(PERMISSIONS.APPLICATION_SEND_EMAIL);
  const canScheduleInterview =
    hasPermission(PERMISSIONS.INTERVIEW_VIEW_SCHEDULE_DATA) &&
    hasPermission(PERMISSIONS.INTERVIEW_CREATE);
  const reviewRoutePrefix =
    primaryRole === ROLE_NAMES.MANAGER
      ? "/manager/applications"
      : "/hr/applications";
  const candidateRoutePrefix =
    primaryRole === ROLE_NAMES.MANAGER
      ? "/manager/candidates"
      : "/hr/candidates";

  const [detail, setDetail] = useState<ApplicationReviewDetailDto | null>(null);
  const [resumeFile, setResumeFile] = useState<{
    resumeId: string;
    fileName: string;
    fileUrl: string;
  } | null>(null);
  const [resumePreviewError, setResumePreviewError] = useState(false);
  const [resumePreviewBlobUrl, setResumePreviewBlobUrl] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [submittingDecision, setSubmittingDecision] =
    useState<ApplicationReviewDecision | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadDetail() {
      setLoading(true);

      try {
        const [detailResponse, resumeResponse] = await Promise.all([
          hrService.getApplicationDetail(applicationId),
          hrService.getApplicationCv(applicationId).catch(() => null),
        ]);

        if (!mounted) return;

        setDetail(detailResponse.data);
        setResumeFile(
          resumeResponse?.data
            ? {
                resumeId: resumeResponse.data.resumeId,
                fileName: resumeResponse.data.fileName,
                fileUrl: resumeResponse.data.fileUrl,
              }
            : null,
        );
        setResumePreviewBlobUrl(null);
        setResumePreviewError(false);
      } catch {
        if (!mounted) return;
        toast.error("Không thể tải chi tiết hồ sơ ứng tuyển.");
        setDetail(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      mounted = false;
    };
  }, [applicationId]);

  useEffect(() => {
    if (!resumeFile) {
      return;
    }

    const previewPath = buildResumePreviewPath(
      resumeFile.resumeId,
      resumeFile.fileUrl,
    );
    let active = true;
    let objectUrl: string | null = null;

    void fetchProtectedFileBlob(previewPath)
      .then((blob) => {
        if (!active) {
          return;
        }

        objectUrl = URL.createObjectURL(blob);
        setResumePreviewBlobUrl(objectUrl);
        setResumePreviewError(false);
      })
      .catch(() => {
        if (active) {
          setResumePreviewBlobUrl(null);
          setResumePreviewError(true);
        }
      });

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [resumeFile]);

  const canReview = useMemo(
    () => canApprove || canReject,
    [canApprove, canReject],
  );

  async function handleDecision(decision: ApplicationReviewDecision) {
    if (!applicationId) return;

    setSubmittingDecision(decision);

    try {
      const response = await hrService.updateApplicationDecision(
        applicationId,
        decision,
      );
      setDetail(response.data);
      toast.success("Đã cập nhật trạng thái hồ sơ.");
    } catch (error) {
      // errorCode first (e.g. INVALID_APPLICATION_TRANSITION when the workflow rejects the move —
      // BR-APPLICATION-006), then HTTP status, then message.
      toast.error(getApplicationErrorMessage(error, "Không thể cập nhật trạng thái hồ sơ."));
    } finally {
      setSubmittingDecision(null);
    }
  }

  if (loading) {
    return (
      <div className="app-container space-y-6 py-8">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-10 w-40 rounded-[10px]" />
          <Skeleton className="h-10 w-32 rounded-[10px]" />
        </div>
        <div className="card space-y-4 p-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="card p-6">
            <SkeletonText lines={8} />
          </div>
          <div className="card p-6">
            <SkeletonText lines={6} />
          </div>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="app-container py-10">
        <div className="surface-card p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#fff1f0] to-[#ffe3e0] text-[#b90014]">
            <span className="material-symbols-outlined text-[32px]">folder_off</span>
          </div>
          <h1 className="mt-4 text-[20px] font-semibold text-[#1a1c1c]">
            Không tìm thấy chi tiết hồ sơ
          </h1>
          <p className="mt-2 text-sm text-[#5f5e5e]">
            Không thể tải dữ liệu chi tiết tuyển dụng ở thời điểm hiện tại.
          </p>
          <button
            type="button"
            className="btn btn-dark mt-6"
            onClick={() => navigate(reviewRoutePrefix)}
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Quay lại danh sách hồ sơ
          </button>
        </div>
      </div>
    );
  }

  const interviewNotes = detail.interviews.filter((item) => item.notes);
  const availableDecisions = getAvailableDecisions(detail.status, primaryRole);
  const resumePreviewPath = resumeFile
    ? buildResumePreviewPath(resumeFile.resumeId, resumeFile.fileUrl)
    : null;
  const resumeDownloadPath = resumeFile
    ? buildResumeDownloadPath(resumeFile.resumeId, resumeFile.fileUrl)
    : null;
  const resumePreviewUrl = resumePreviewBlobUrl
    ? buildPdfViewerUrl(resumePreviewBlobUrl)
    : null;

  const candidateInitials = detail.candidate.fullName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="app-container animate-fade-in space-y-6 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          className="btn btn-secondary w-fit"
          onClick={() => navigate(reviewRoutePrefix)}
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Danh sách hồ sơ
        </button>
      </div>

      {/* HERO SUMMARY */}
      <section className="card animate-fade-in-up p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#fff1f0] to-[#ffdad6] text-[22px] font-bold text-[#b90014]">
              {candidateInitials}
            </div>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className={`badge border ${getApplicationStatusBadgeClass(detail.status, "detail")}`}
                >
                  {formatApplicationStatusVi(detail.status)}
                </span>
                <Badge tone="info">{detail.stageLabel}</Badge>
                <span className="text-[12px] font-semibold text-[#8a8786]">
                  {detail.referenceCode}
                </span>
              </div>
              <h1 className="page-title">
                <Link
                  className="transition-colors hover:text-[#b90014]"
                  to={`${candidateRoutePrefix}/${detail.candidate.id}`}
                >
                  {detail.candidate.fullName}
                </Link>
              </h1>
              <p className="page-subtitle">
                <Link
                  className="font-semibold text-[#b90014] hover:underline"
                  to={`/jobs/${detail.job.id}`}
                >
                  {detail.job.title}
                </Link>{" "}
                tại {detail.job.departmentName}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 xl:shrink-0">
            {canViewCv && resumeFile ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  if (!resumeDownloadPath) return;
                  void downloadProtectedFile(
                    resumeDownloadPath,
                    resumeFile.fileName,
                  ).catch(() => toast.error("Không thể tải CV."));
                }}
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Tải CV
              </button>
            ) : null}
            {canSendOffer &&
            normalizeApplicationStatus(detail.status) === ApplicationStatus.Offer ? (
              <Link
                className="btn btn-primary"
                to={`/hr/applications/${detail.applicationId}/send-offer`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isOfferActionableStatus(detail.offerStatus)
                    ? "edit_document"
                    : "send"}
                </span>
                {detail.offerStatus ? "Quản lý offer" : "Tạo offer"}
              </Link>
            ) : null}
            {canScheduleInterview &&
            (normalizeApplicationStatus(detail.status) === ApplicationStatus.ManagerReview ||
              normalizeApplicationStatus(detail.status) === ApplicationStatus.Interview) ? (
              <Link
                className="btn btn-secondary"
                to={`/hr/interviews/schedule?applicationId=${detail.applicationId}`}
              >
                <span className="material-symbols-outlined text-[18px]">event</span>
                Lên lịch phỏng vấn
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-3 border-t border-[#f0eceb] pt-6 sm:grid-cols-3">
          <div className="rounded-[12px] bg-[#faf9f8] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8786]">
              Ngày nộp
            </p>
            <p className="mt-1 text-[15px] font-bold text-[#1a1c1c]">
              {formatDateLabel(detail.appliedAt)}
            </p>
          </div>
          <div className="rounded-[12px] bg-[#faf9f8] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8786]">
              Match
            </p>
            <p className="mt-1 text-[15px] font-bold text-[#1a1c1c]">
              {detail.insights.skillsMatchPercent}%
            </p>
          </div>
          <div className="rounded-[12px] bg-[#faf9f8] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8786]">
              Offer
            </p>
            <p className="mt-1 text-[15px] font-bold text-[#1a1c1c]">
              {formatOfferStatusVi(detail.offerStatus)}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard title="Thông tin ứng viên">
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoItem
                  label="Vị trí hiện tại"
                  value={detail.candidate.currentPosition || "Chưa cập nhật"}
                />
                <InfoItem
                  label="Kinh nghiệm"
                  value={
                    detail.candidate.experienceYears != null
                      ? `${detail.candidate.experienceYears} năm`
                      : "Chưa cập nhật"
                  }
                />
                <InfoItem
                  label="Email"
                  value={
                    <a
                      className="text-[#005f93] hover:underline"
                      href={`mailto:${detail.candidate.email}`}
                    >
                      {detail.candidate.email}
                    </a>
                  }
                />
                <InfoItem
                  label="Số điện thoại"
                  value={detail.candidate.phone || "Chưa cập nhật"}
                />
                <InfoItem
                  label="Học vấn"
                  value={detail.candidate.education || "Chưa cập nhật"}
                />
                <InfoItem
                  label="Địa điểm"
                  value={detail.candidate.address || "Chưa cập nhật"}
                />
              </div>
              {detail.candidate.bio ? (
                <p className="mt-5 border-t border-[#e2dfde] pt-4 text-sm leading-6 text-[#1a1c1c]">
                  {detail.candidate.bio}
                </p>
              ) : null}
              <div className="mt-5 flex flex-wrap gap-2">
                {detail.candidate.linkedinUrl ? (
                  <a
                    className="inline-flex items-center gap-2 rounded-full border border-[#e2dfde] px-3 py-1.5 text-xs font-semibold text-[#1a1c1c] hover:bg-[#f9f9f9]"
                    href={detail.candidate.linkedinUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <span className="material-symbols-outlined text-sm">
                      link
                    </span>
                    LinkedIn
                  </a>
                ) : null}
                {detail.candidate.githubUrl ? (
                  <a
                    className="inline-flex items-center gap-2 rounded-full border border-[#e2dfde] px-3 py-1.5 text-xs font-semibold text-[#1a1c1c] hover:bg-[#f9f9f9]"
                    href={detail.candidate.githubUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <span className="material-symbols-outlined text-sm">
                      code
                    </span>
                    GitHub
                  </a>
                ) : null}
                {!detail.candidate.linkedinUrl && !detail.candidate.githubUrl ? (
                  <span className="text-sm text-[#5f5e5e]">
                    Chưa có liên kết hồ sơ ngoài.
                  </span>
                ) : null}
              </div>
            </SectionCard>

            <SectionCard title="Công việc & kỹ năng">
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoItem label="Vị trí" value={detail.job.title} />
                <InfoItem label="Phòng ban" value={detail.job.departmentName} />
                <InfoItem
                  label="Kỹ năng khớp"
                  value={`${detail.insights.matchedSkillCount}/${
                    detail.insights.requiredSkillCount ||
                    detail.insights.matchedSkillCount
                  }`}
                />
                <InfoItem
                  label="Ghi chú phỏng vấn"
                  value={`${detail.insights.submittedInterviewNotes}/${detail.insights.totalInterviews}`}
                />
              </div>
              <div className="mt-5 border-t border-[#e2dfde] pt-4">
                <p className="text-sm font-semibold text-[#1a1c1c]">
                  Kỹ năng yêu cầu
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {detail.job.requiredSkills.length ? (
                    detail.job.requiredSkills.map((skill, index) => (
                      <span key={skill} className={getSkillChipClass(skill, index)}>
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-[#5f5e5e]">
                      Chưa cấu hình kỹ năng yêu cầu.
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-5 border-t border-[#e2dfde] pt-4">
                <p className="text-sm font-semibold text-[#1a1c1c]">
                  Kỹ năng ứng viên
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {detail.candidate.skills.length ? (
                    detail.candidate.skills.map((skill, index) => (
                      <span key={skill} className={getSkillChipClass(skill, index)}>
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-[#5f5e5e]">
                      Chưa có kỹ năng trong hồ sơ.
                    </span>
                  )}
                </div>
              </div>
            </SectionCard>
          </div>

          <SectionCard
            title={resumeFile?.fileName ?? "CV ứng viên"}
            action={
              resumeFile && canViewCv ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#5f5e5e] hover:bg-[#f3f3f3] hover:text-[#1a1c1c]"
                    title="Mở CV"
                    onClick={() => {
                      if (!resumePreviewPath) return;
                      void openProtectedFileInNewTab(resumePreviewPath).catch(() =>
                        toast.error("Không thể mở CV."),
                      );
                    }}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      open_in_new
                    </span>
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#5f5e5e] hover:bg-[#f3f3f3] hover:text-[#1a1c1c]"
                    title="Tải CV"
                    onClick={() => {
                      if (!resumeDownloadPath) return;
                      void downloadProtectedFile(
                        resumeDownloadPath,
                        resumeFile.fileName,
                      ).catch(() => toast.error("Không thể tải CV."));
                    }}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      download
                    </span>
                  </button>
                </div>
              ) : null
            }
          >
            {resumeFile && canViewCv ? (
              resumePreviewError ? (
                <div className="rounded-lg border border-dashed border-[#d6d1cf] p-6 text-sm text-[#5f5e5e]">
                  Không thể xem trước CV.{" "}
                  <button
                    type="button"
                    className="font-semibold text-[#b90014] hover:underline"
                    onClick={() => {
                      if (!resumePreviewPath) return;
                      void openProtectedFileInNewTab(resumePreviewPath).catch(() =>
                        toast.error("Không thể mở CV."),
                      );
                    }}
                  >
                    Mở ở tab mới
                  </button>
                </div>
              ) : (
                <iframe
                  className="h-[680px] w-full rounded-lg border border-[#e2dfde] bg-white"
                  onError={() => setResumePreviewError(true)}
                  src={resumePreviewUrl ?? undefined}
                  title={`CV ${detail.candidate.fullName}`}
                />
              )
            ) : (
              <div className="rounded-lg border border-dashed border-[#d6d1cf] p-6 text-sm text-[#5f5e5e]">
                {resumeFile
                  ? "Bạn không có quyền xem trước CV."
                  : "Hồ sơ này chưa có file CV."}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Lịch sử phỏng vấn">
            {detail.interviews.length ? (
              <div className="space-y-3">
                {detail.interviews.map((interview) => (
                  <div
                    key={interview.id}
                    className="grid gap-3 rounded-lg border border-[#e2dfde] px-4 py-3 md:grid-cols-[minmax(0,1fr)_170px]"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-[#1a1c1c]">
                        {interview.label}
                      </p>
                      <p className="mt-1 text-sm text-[#5f5e5e]">
                        {interview.status}
                      </p>
                      {interview.notes ? (
                        <p className="mt-3 text-sm leading-6 text-[#5d3f3c]">
                          {interview.notes}
                        </p>
                      ) : null}
                    </div>
                    <span className="text-sm font-semibold text-[#5f5e5e] md:text-right">
                      {formatDateTimeLabel(interview.interviewDate)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[#d6d1cf] p-6 text-sm text-[#5f5e5e]">
                Chưa có lịch phỏng vấn.
              </div>
            )}
          </SectionCard>
        </div>

        <aside className="space-y-6">
          <section className="card p-5 xl:sticky xl:top-24">
            <div>
              <p className="eyebrow">Trạng thái hiện tại</p>
              <h2 className="mt-2 text-[22px] font-semibold text-[#1a1c1c]">
                {formatApplicationStatusVi(detail.status)}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#5f5e5e]">
                {formatStatusDescriptionVi(detail.status)}
              </p>
            </div>

            <div className="mt-5 border-t border-[#f0eceb] pt-5">
              <h3 className="eyebrow">Hành động</h3>
              {availableDecisions.length ? (
                <>
                  <PermissionGuard permissions={PERMISSIONS.APPLICATION_APPROVE}>
                    <div className="mt-4 space-y-3">
                      {availableDecisions
                        .filter((decision) => decision !== "Rejected")
                        .map((decision) => (
                          <AsyncActionButton
                            key={decision}
                            type="button"
                            className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${decisionButtonClassName(decision)} disabled:cursor-not-allowed disabled:opacity-60`}
                            disabled={!canReview || submittingDecision !== null}
                            loading={submittingDecision === decision}
                            loadingText="Đang cập nhật..."
                            onClick={() => handleDecision(decision)}
                            spinnerTone="brand"
                          >
                            <span className="flex items-center gap-3 text-sm font-bold">
                              <span className="material-symbols-outlined">
                                {decisionIcon(decision)}
                              </span>
                              {decisionLabel(decision)}
                            </span>
                            <span className="material-symbols-outlined text-[18px]">
                              chevron_right
                            </span>
                          </AsyncActionButton>
                        ))}
                    </div>
                  </PermissionGuard>

                  <PermissionGuard permissions={PERMISSIONS.APPLICATION_REJECT}>
                    {availableDecisions.includes("Rejected") ? (
                      <AsyncActionButton
                        type="button"
                        className={`mt-3 flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${decisionButtonClassName("Rejected")} disabled:cursor-not-allowed disabled:opacity-60`}
                        disabled={!canReject || submittingDecision !== null}
                        loading={submittingDecision === "Rejected"}
                        loadingText="Đang cập nhật..."
                        onClick={() => handleDecision("Rejected")}
                        spinnerTone="brand"
                      >
                        <span className="flex items-center gap-3 text-sm font-bold">
                          <span className="material-symbols-outlined">
                            {decisionIcon("Rejected")}
                          </span>
                          {decisionLabel("Rejected")}
                        </span>
                        <span className="material-symbols-outlined text-[18px]">
                          chevron_right
                        </span>
                      </AsyncActionButton>
                    ) : null}
                  </PermissionGuard>
                </>
              ) : (
                <p className="mt-4 rounded-lg border border-dashed border-[#d6d1cf] p-4 text-sm text-[#5f5e5e]">
                  Không có hành động khả dụng ở bước này.
                </p>
              )}
            </div>

            <div className="mt-5 border-t border-[#f0eceb] pt-5">
              <h3 className="eyebrow">Tóm tắt xử lý</h3>
              <div className="mt-4 space-y-4">
                <InfoItem
                  label="Người phụ trách"
                  value={detail.reviewedBy?.fullName || "Chưa phân công"}
                />
                {/* Ownership snapshot (Phase 2/3, BR-OWN-005) — optional, null-safe. */}
                <InfoItem
                  label="Recruiter phụ trách"
                  value={detail.assignedRecruiterName || "Chưa phân công"}
                />
                <InfoItem
                  label="Trưởng bộ phận phê duyệt"
                  value={detail.assignedDepartmentHeadName || "Chưa có trưởng bộ phận"}
                />
                <InfoItem
                  label="Trạng thái offer"
                  value={formatOfferStatusVi(detail.offerStatus)}
                />
                <InfoItem label="Bước tiếp theo" value={detail.nextStep} />
              </div>
            </div>

            <div className="mt-5 border-t border-[#f0eceb] pt-5">
              <h3 className="eyebrow">Ghi chú gần đây</h3>
              <div className="mt-4 space-y-3">
                {interviewNotes.length ? (
                  interviewNotes.slice(0, 2).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[12px] bg-[#faf9f8] p-4 text-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-[#1a1c1c]">
                          {item.label}
                        </p>
                        <span className="text-xs text-[#5f5e5e]">
                          {formatDateLabel(item.interviewDate)}
                        </span>
                      </div>
                      <p className="mt-2 leading-6 text-[#5d3f3c]">
                        {item.notes}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-lg border border-dashed border-[#d6d1cf] p-4 text-sm text-[#5f5e5e]">
                    Chưa có ghi chú.
                  </p>
                )}
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default CandidateReviewDetailScreen;
