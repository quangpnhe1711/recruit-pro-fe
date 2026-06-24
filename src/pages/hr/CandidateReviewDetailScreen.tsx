import { type ReactNode, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Link, useNavigate, useParams } from "react-router-dom";
import AsyncActionButton from "../../common/components/AsyncActionButton";
import LoadingIndicator from "../../common/components/LoadingIndicator";
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
    <section className="rounded-lg border border-[#e2dfde] bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-[#e2dfde] px-5 py-4">
        <h2 className="text-[14px] font-semibold uppercase tracking-[0.12em] text-[#5f5e5e]">
          {title}
        </h2>
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
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7a7472]">
        {label}
      </p>
      <div className="mt-1 break-words text-[14px] font-semibold text-[#1a1c1c]">
        {value || "Chưa cập nhật"}
      </div>
    </div>
  );
}

function SkillPill({
  children,
  tone = "brand",
}: {
  children: ReactNode;
  tone?: "brand" | "blue";
}) {
  return (
    <span
      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
        tone === "brand"
          ? "bg-[#b90014]/5 text-[#b90014]"
          : "bg-[#005f93]/10 text-[#005f93]"
      }`}
    >
      {children}
    </span>
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
    } catch {
      toast.error("Không thể cập nhật trạng thái hồ sơ.");
    } finally {
      setSubmittingDecision(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center px-4 py-10 md:px-10">
        <LoadingIndicator label="Đang tải chi tiết hồ sơ..." />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="w-full px-4 py-10 md:px-10">
        <div className="rounded-[28px] border border-[#e2dfde] bg-white p-8 shadow-[0_24px_80px_rgba(26,28,28,0.08)]">
          <h1 className="page-title">
            Không tìm thấy chi tiết hồ sơ
          </h1>
          <p className="mt-2 text-sm text-[#5f5e5e]">
            Không thể tải dữ liệu chi tiết tuyển dụng ở thời điểm hiện tại.
          </p>
          <button
            type="button"
            className="mt-6 inline-flex items-center gap-2 bg-[#1a1c1c] px-5 py-3 text-sm font-semibold text-white"
            onClick={() => navigate(reviewRoutePrefix)}
          >
            <span className="material-symbols-outlined text-base">
              arrow_back
            </span>
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

  return (
    <div className="min-h-screen w-full bg-[#f9f9f9] px-4 py-8 md:px-10">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <button
          type="button"
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#d6d1cf] bg-white px-4 py-2 text-sm font-semibold text-[#1a1c1c] transition-colors hover:bg-[#f3f3f3]"
          onClick={() => navigate(reviewRoutePrefix)}
        >
          <span className="material-symbols-outlined text-[18px]">
            arrow_back
          </span>
          Danh sách hồ sơ
        </button>
        <div className="flex flex-wrap gap-2">
          {canViewCv && resumeFile ? (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-[#d6d1cf] bg-white px-4 py-2 text-sm font-semibold text-[#1a1c1c] transition-colors hover:bg-[#f3f3f3]"
              onClick={() => {
                if (!resumeDownloadPath) return;
                void downloadProtectedFile(
                  resumeDownloadPath,
                  resumeFile.fileName,
                ).catch(() => toast.error("Không thể tải CV."));
              }}
            >
              <span className="material-symbols-outlined text-[18px]">
                download
              </span>
              Tải CV
            </button>
          ) : null}
          {canSendOffer && detail.status.toLowerCase() === "offer" ? (
            <Link
              className="inline-flex items-center gap-2 rounded-lg bg-[#b90014] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#93000d]"
              to={`/hr/applications/${detail.applicationId}/send-offer`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {detail.offerStatus?.toLowerCase() === "sent"
                  ? "edit_document"
                  : "send"}
              </span>
              {detail.offerStatus ? "Quản lý offer" : "Tạo offer"}
            </Link>
          ) : null}
        </div>
      </div>

      <section className="mb-6 rounded-lg border border-[#e2dfde] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-[12px] font-semibold ${getApplicationStatusBadgeClass(detail.status, "detail")}`}
              >
                {formatApplicationStatusVi(detail.status)}
              </span>
              <span className="rounded-full bg-[#005f93]/10 px-3 py-1 text-[12px] font-semibold text-[#005f93]">
                {detail.stageLabel}
              </span>
              <span className="text-[13px] font-semibold text-[#5f5e5e]">
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

          <div className="grid gap-3 sm:grid-cols-3 xl:w-[520px]">
            <div className="rounded-lg bg-[#f3f3f3] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7a7472]">
                Ngày nộp
              </p>
              <p className="mt-1 text-[15px] font-bold text-[#1a1c1c]">
                {formatDateLabel(detail.appliedAt)}
              </p>
            </div>
            <div className="rounded-lg bg-[#f3f3f3] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7a7472]">
                Match
              </p>
              <p className="mt-1 text-[15px] font-bold text-[#1a1c1c]">
                {detail.insights.skillsMatchPercent}%
              </p>
            </div>
            <div className="rounded-lg bg-[#f3f3f3] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7a7472]">
                Offer
              </p>
              <p className="mt-1 text-[15px] font-bold text-[#1a1c1c]">
                {formatOfferStatusVi(detail.offerStatus)}
              </p>
            </div>
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
                    detail.job.requiredSkills.map((skill) => (
                      <SkillPill key={skill}>{skill}</SkillPill>
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
                    detail.candidate.skills.map((skill) => (
                      <SkillPill key={skill} tone="blue">
                        {skill}
                      </SkillPill>
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
          <section className="rounded-lg border border-[#e2dfde] bg-white p-5 shadow-sm xl:sticky xl:top-24">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5f5e5e]">
                Trạng thái hiện tại
              </p>
              <h2 className="mt-2 text-[22px] font-semibold text-[#1a1c1c]">
                {formatApplicationStatusVi(detail.status)}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#5f5e5e]">
                {formatStatusDescriptionVi(detail.status)}
              </p>
            </div>

            <div className="mt-5 border-t border-[#e2dfde] pt-5">
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5f5e5e]">
                Hành động
              </h3>
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

            <div className="mt-5 border-t border-[#e2dfde] pt-5">
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5f5e5e]">
                Tóm tắt xử lý
              </h3>
              <div className="mt-4 space-y-4">
                <InfoItem
                  label="Người phụ trách"
                  value={detail.reviewedBy?.fullName || "Chưa phân công"}
                />
                <InfoItem
                  label="Trạng thái offer"
                  value={formatOfferStatusVi(detail.offerStatus)}
                />
                <InfoItem label="Bước tiếp theo" value={detail.nextStep} />
              </div>
            </div>

            <div className="mt-5 border-t border-[#e2dfde] pt-5">
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5f5e5e]">
                Ghi chú gần đây
              </h3>
              <div className="mt-4 space-y-3">
                {interviewNotes.length ? (
                  interviewNotes.slice(0, 2).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg bg-[#f3f3f3] p-4 text-sm"
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
