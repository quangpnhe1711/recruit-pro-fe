import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Link, useNavigate, useParams } from "react-router-dom";
import AsyncActionButton from "../../common/components/AsyncActionButton";
import LoadingIndicator from "../../common/components/LoadingIndicator";
import {
  buildPdfViewerUrl,
  buildResumeDownloadPath,
  buildResumePreviewPath,
} from "../../common/utils/resumeLinks";
import { formatApplicationStatus } from "../../common/utils/applicationPresentation";
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
  switch (formatApplicationStatus(status)) {
    case "Applied":
      return "Đã nộp";
    case "Screening":
      return "Sàng lọc";
    case "Manager Review":
      return "Quản lý đánh giá";
    case "Interview":
      return "Phỏng vấn";
    case "Offer":
      return "Đề nghị nhận việc";
    case "Hired":
      return "Đã nhận việc";
    case "Rejected":
      return "Từ chối";
    case "Offer Declined":
      return "Từ chối offer";
    default:
      return status;
  }
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
      return "Chuyển screening";
    case "ManagerReview":
      return "Chuyển manager review";
    case "Interview":
      return "Chuyển sang phỏng vấn";
    case "Offer":
      return "Chuyển sang offer";
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
      toast.success(
        response.message || `${decisionLabel(decision)} thành công.`,
      );
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
  const resumePreviewUrl = resumeFile
    ? buildPdfViewerUrl(resumePreviewPath ?? resumeFile.fileUrl)
    : null;

  return (
    <div className="min-h-screen w-full bg-[#f9f9f9] px-4 py-8 md:px-10">
      <div className="mb-8 rounded-[32px] border border-[#e2dfde] bg-white p-6 shadow-[0_30px_90px_rgba(26,28,28,0.08)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8c6a66]">
              Hồ sơ ứng tuyển
            </p>
            <h1 className="page-title">
              <Link
                className="transition-colors hover:text-[#b90014]"
                to={`${candidateRoutePrefix}/${detail.candidate.id}`}
              >
                {detail.candidate.fullName}
              </Link>
            </h1>
            <p className="page-subtitle">
              Ứng tuyển vị trí{" "}
              <Link
                className="font-semibold text-[#b90014] hover:underline"
                to={`/jobs/${detail.job.id}`}
              >
                {detail.job.title}
              </Link>{" "}
              <span className="font-semibold text-[#1a1c1c]">
                - {detail.job.departmentName}
              </span>
            </p>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[#cde5ff] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#004b74]">
                {detail.stageLabel}
              </span>
              <span className="text-sm text-[#5f5e5e]">
                {detail.referenceCode}
              </span>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="border border-[#e2dfde] bg-[#f3f3f3] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8c6a66]">
                  Ngày nộp
                </p>
                <p className="mt-2 text-base font-bold text-[#1a1c1c]">
                  {formatDateLabel(detail.appliedAt)}
                </p>
              </div>
              <div className="border border-[#e2dfde] bg-white px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8c6a66]">
                  Trạng thái
                </p>
                <p className="mt-2 text-base font-bold text-[#1a1c1c]">
                  {formatStatusDescriptionVi(detail.status)}
                </p>
              </div>
              <div className="border border-[#e2dfde] bg-white px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8c6a66]">
                  Bước hiện tại
                </p>
                <p className="mt-2 text-base font-bold text-[#1a1c1c]">
                  {formatApplicationStatusVi(detail.status)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 border border-[#1a1c1c] bg-white px-5 py-3 text-sm font-semibold text-[#1a1c1c] transition-colors hover:bg-[#f3f3f3]"
              onClick={() => navigate(reviewRoutePrefix)}
            >
              <span className="material-symbols-outlined text-base">
                arrow_back
              </span>
              Quay lại danh sách hồ sơ
            </button>
            {canSendOffer && ["offer"].includes(detail.status.toLowerCase()) ? (
              <Link
                className="inline-flex items-center gap-2 bg-[#b90014] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#93000d]"
                to={`/hr/applications/${detail.applicationId}/send-offer`}
              >
                <span className="material-symbols-outlined text-base">
                  {detail.offerStatus?.toLowerCase() === "sent"
                    ? "edit_document"
                    : "send"}
                </span>
                {detail.offerStatus ? "Quản lý offer" : "Tạo offer"}
              </Link>
            ) : null}
            {resumeFile ? (
              <a
                className="inline-flex items-center gap-2 bg-[#e2e2e2] px-5 py-3 text-sm font-semibold text-[#1a1c1c] transition-colors hover:bg-[#dadada]"
                href={resumeDownloadPath ?? resumeFile.fileUrl}
                rel="noreferrer"
                target="_blank"
              >
                <span className="material-symbols-outlined text-base">
                  download
                </span>
                Tải CV
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <section className="rounded-[28px] border border-[#e2dfde] bg-white p-6 shadow-[0_18px_50px_rgba(26,28,28,0.05)]">
              <p className="text-center text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5f5e5e]">
                Kỹ năng phù hợp
              </p>
              <div className="mt-5 flex justify-center">
                <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-[10px] border-[#b90014]">
                  <span className="text-[32px] font-bold text-[#1a1c1c]">
                    {detail.insights.skillsMatchPercent}%
                  </span>
                </div>
              </div>
              <p className="mt-5 text-center text-sm font-semibold text-[#005f93]">
                {detail.insights.matchedSkillCount}/
                {detail.insights.requiredSkillCount ||
                  detail.insights.matchedSkillCount}{" "}
                Kỹ năng yêu cầu khớp
              </p>
            </section>

            <section className="rounded-[28px] border border-[#e2dfde] bg-white p-6 shadow-[0_18px_50px_rgba(26,28,28,0.05)]">
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5f5e5e]">
                Tiến trình phỏng vấn{" "}
              </h2>
              <div className="mt-5 space-y-4">
                {detail.interviews.length ? (
                  detail.interviews.map((interview) => (
                    <div
                      key={interview.id}
                      className="flex items-start justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined mt-0.5 text-[#005f93]">
                          check_circle
                        </span>
                        <div>
                          <p className="font-semibold text-[#1a1c1c]">
                            {interview.label}
                          </p>
                          <p className="text-sm text-[#5f5e5e]">
                            {interview.status}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-[#5f5e5e]">
                        {formatDateTimeLabel(interview.interviewDate)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[#5f5e5e]">
                    Chưa có lịch phỏng vấn nào được tạo
                  </p>
                )}
              </div>
            </section>
          </div>

          <section className="overflow-hidden rounded-[28px] border border-[#e2dfde] bg-white shadow-[0_24px_60px_rgba(26,28,28,0.06)]">
            <div className="flex items-center justify-between bg-[#1a1c1c] px-6 py-4 text-white">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">
                  {resumeFile?.fileName ?? "CV ứng viên"}
                </h2>
                <p className="mt-1 text-xs text-white/70">
                  Xem nhanh hồ sơ trực tiếp trong trình duyệt
                </p>
              </div>
              {resumeFile && canViewCv ? (
                <div className="flex items-center gap-3">
                  <a
                    href={resumePreviewPath ?? resumeFile.fileUrl}
                    rel="noreferrer"
                    target="_blank"
                    title="Mở CV"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      open_in_new
                    </span>
                  </a>
                  <a
                    href={resumeDownloadPath ?? resumeFile.fileUrl}
                    rel="noreferrer"
                    target="_blank"
                    title="Tải CV"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      download
                    </span>
                  </a>
                </div>
              ) : null}
            </div>

            {resumeFile && canViewCv ? (
              resumePreviewError ? (
                <div className="p-8">
                  <p className="text-sm text-[#5f5e5e]">
                    Không thể hiển thị xem trước CV trong trình duyệt.{" "}
                    <a
                      className="font-semibold text-[#b90014] hover:underline"
                      href={resumePreviewPath ?? resumeFile.fileUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Mở file CV ở tab mới
                    </a>
                  </p>
                </div>
              ) : (
                <div className="bg-[#f3f3f3] p-4 md:p-5">
                  <div className="overflow-hidden rounded-[24px] border border-[#e2dfde] bg-white shadow-[0_20px_40px_rgba(26,28,28,0.08)]">
                    <iframe
                      className="h-[720px] w-full bg-white"
                      onError={() => setResumePreviewError(true)}
                      src={resumePreviewUrl ?? undefined}
                      title={`CV ${detail.candidate.fullName}`}
                    />
                  </div>
                </div>
              )
            ) : (
              <div className="p-8">
                <p className="text-sm text-[#5f5e5e]">
                  Không thể hiển thị xem trước CV.{" "}
                  {resumeFile ? (
                    <a
                      className="font-semibold text-[#b90014] hover:underline"
                      href={resumePreviewPath ?? resumeFile.fileUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Mở file CV ở tab mới
                    </a>
                  ) : (
                    "Hồ sơ này hiện chưa có file CV được lưu."
                  )}
                </p>
              </div>
            )}
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[28px] border border-[#e2dfde] bg-white p-6 shadow-[0_18px_50px_rgba(26,28,28,0.05)]">
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5f5e5e]">
                Hồ sơ ứng viên
              </h2>
              <div className="mt-4 space-y-3 text-sm text-[#1a1c1c]">
                <p>
                  <span className="font-semibold">Vị trí hiện tại:</span>{" "}
                  {detail.candidate.currentPosition || "Chưa cập nhật"}
                </p>
                <p>
                  <span className="font-semibold">Kinh nghiệm:</span>{" "}
                  {detail.candidate.experienceYears != null
                    ? `${detail.candidate.experienceYears} năm`
                    : "Chưa cập nhật"}
                </p>
                <p>
                  <span className="font-semibold">Học vấn:</span>{" "}
                  {detail.candidate.education || "Chưa cập nhật"}
                </p>
                <p>
                  <span className="font-semibold">Địa điểm:</span>{" "}
                  {detail.candidate.address || "Chưa cập nhật"}
                </p>
                <p>
                  <span className="font-semibold">Email:</span>{" "}
                  {detail.candidate.email}
                </p>
                <p>
                  <span className="font-semibold">Số điện thoại:</span>{" "}
                  {detail.candidate.phone || "Chưa cập nhật"}
                </p>
                {detail.candidate.bio ? (
                  <p>
                    <span className="font-semibold">Giới thiệu:</span>{" "}
                    {detail.candidate.bio}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2 pt-2">
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
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-[#e2dfde] bg-white p-6 shadow-[0_18px_50px_rgba(26,28,28,0.05)]">
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5f5e5e]">
                Tổng quan kỹ năng
              </h2>
              <div className="mt-4">
                <p className="text-sm font-semibold text-[#1a1c1c]">
                  Kỹ năng yêu cầu cho {detail.job.title}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {detail.job.requiredSkills.length ? (
                    detail.job.requiredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-[#b90014]/5 px-3 py-1.5 text-xs font-semibold text-[#b90014]"
                      >
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
              <div className="mt-6 border-t border-[#e2dfde] pt-4">
                <p className="text-sm font-semibold text-[#1a1c1c]">
                  Kỹ năng của ứng viên
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {detail.candidate.skills.length ? (
                    detail.candidate.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-[#005f93]/10 px-3 py-1.5 text-xs font-semibold text-[#005f93]"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-[#5f5e5e]">
                      Hồ sơ ứng viên chưa có kỹ năng nào.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[28px] border border-[#e2dfde] bg-white p-6 shadow-[0_24px_60px_rgba(26,28,28,0.08)] xl:sticky xl:top-24">
            <h2 className="page-title">
              Chuyển trạng thái hồ sơ
            </h2>

            <PermissionGuard permissions={PERMISSIONS.APPLICATION_APPROVE}>
              <div className="mt-6 space-y-3">
                {availableDecisions
                  .filter((decision) => decision !== "Rejected")
                  .map((decision) => (
                    <AsyncActionButton
                      key={decision}
                      type="button"
                      className={`flex w-full items-center justify-between border px-5 py-4 text-left transition-colors ${decisionButtonClassName(decision)} disabled:cursor-not-allowed disabled:opacity-60`}
                      disabled={!canReview || submittingDecision !== null}
                      loading={submittingDecision === decision}
                      loadingText="Đang cập nhật..."
                      onClick={() => handleDecision(decision)}
                      spinnerTone="brand"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined">
                          {decisionIcon(decision)}
                        </span>
                        <span className="text-base font-bold uppercase tracking-[0.05em]">
                          {decisionLabel(decision)}
                        </span>
                      </div>
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
                  className={`mt-3 flex w-full items-center justify-between border px-5 py-4 text-left transition-colors ${decisionButtonClassName("Rejected")} disabled:cursor-not-allowed disabled:opacity-60`}
                  disabled={!canReject || submittingDecision !== null}
                  loading={submittingDecision === "Rejected"}
                  loadingText="Đang cập nhật..."
                  onClick={() => handleDecision("Rejected")}
                  spinnerTone="brand"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined">
                      {decisionIcon("Rejected")}
                    </span>
                    <span className="text-base font-bold uppercase tracking-[0.05em]">
                      {decisionLabel("Rejected")}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[18px]">
                    chevron_right
                  </span>
                </AsyncActionButton>
              ) : null}
            </PermissionGuard>

            <div className="mt-6 border-t border-[#e2dfde] pt-6">
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5f5e5e]">
                Tổng kết đánh giá
              </h3>
              <div className="mt-4 space-y-3 text-sm text-[#1a1c1c]">
                <p>
                  <span className="font-semibold">Ghi chú phỏng vấn:</span>{" "}
                  {detail.insights.submittedInterviewNotes}/
                  {detail.insights.totalInterviews}
                </p>
                <p>
                  <span className="font-semibold">Người phụ trách:</span>{" "}
                  {detail.reviewedBy?.fullName || "Chưa phân công"}
                </p>
                <p>
                  <span className="font-semibold">Trạng thái offer:</span>{" "}
                  {formatOfferStatusVi(detail.offerStatus)}
                </p>
                <p>
                  <span className="font-semibold">Trạng thái:</span>{" "}
                  {formatStatusDescriptionVi(detail.status)}
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-[#e2dfde] pt-6">
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5f5e5e]">
                Ghi chú phỏng vấn
              </h3>
              <div className="mt-4 space-y-4">
                {interviewNotes.length ? (
                  interviewNotes.map((item) => (
                    <div key={item.id} className="bg-[#f3f3f3] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#1a1c1c]">
                          {item.label}
                        </p>
                        <span className="text-xs text-[#5f5e5e]">
                          {formatDateLabel(item.interviewDate)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm italic leading-6 text-[#5d3f3c]">
                        {item.notes}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="border border-dashed border-[#e2dfde] p-4 text-sm text-[#5f5e5e]">
                    Chưa có
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default CandidateReviewDetailScreen;
