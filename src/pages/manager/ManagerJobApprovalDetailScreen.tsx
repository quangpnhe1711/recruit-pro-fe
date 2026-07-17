import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AsyncActionButton from "../../common/components/AsyncActionButton";
import EmptyState from "../../common/components/EmptyState";
import { Skeleton } from "../../common/components/Skeleton";
import {
  getEmploymentTypeBadgeClass,
  getSkillChipClass,
} from "../../common/utils/jobPresentation";

import type { JobStatus, ManagerJobApprovalDetailDto } from "../../modules/jobs/jobsSchema";
import { jobsService } from "../../services/jobs/jobsService";
import { getJobStatusPresentation } from "../../common/status/jobStatus";
import { getJobStatusErrorMessage } from "../../common/utils/apiError";
import { appToast, handleNonFormApiError } from "../../common/utils/appToast";
import { usePermissions } from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../permissions/permissions";
import { getDateLocale, useI18n } from "../../i18n";

function formatDateLabel(value: string | null) {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString(getDateLocale(), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMoneyRange(min: number | null, max: number | null) {
  if (min == null && max == null) return "Chưa xác định";

  const formatter = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  });

  if (min != null && max != null) {
    return `${formatter.format(min)} - ${formatter.format(max)} VNĐ / tháng`;
  }

  if (min != null) {
    return `${formatter.format(min)}+ VNĐ / tháng`;
  }

  return `Tối đa ${formatter.format(max ?? 0)} VNĐ / tháng`;
}

function actionStyles(action: "approve" | "changes" | "reject") {
  switch (action) {
    case "approve":
      return "bg-[#1a1c1c] text-white hover:bg-[#2f3131]";
    case "changes":
      return "border border-[#ececec] bg-white text-[#1a1c1c] hover:bg-[#faf9f8]";
    case "reject":
      return "bg-gradient-to-r from-[#e8242c] to-[#b90014] text-white hover:brightness-105";
  }
}

function ManagerJobApprovalDetailScreen() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { jobId = "" } = useParams();
  const { hasPermission } = usePermissions();
  // The route is already guarded by JOB_APPROVE; this keeps the action buttons honest even if a stale
  // UI reaches the screen. The backend remains the source of truth (BR-OWN-003): only the job's
  // department head or a SystemAdmin can actually approve/reject — surfaced as a friendly 403 below.
  const canApprove = hasPermission(PERMISSIONS.JOB_APPROVE);
  const [detail, setDetail] = useState<ManagerJobApprovalDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<JobStatus | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadDetail() {
      setLoading(true);

      try {
        const response = await jobsService.getManagerApprovalDetail(jobId);

        if (!mounted) return;
        setDetail(response.data ?? null);
        setLoadError(null);
      } catch (error) {
        if (!mounted) return;
        setDetail(null);
        // A DepartmentHead opening another department's job gets 403; a department with no head gets
        // 422. Surface the structured reason instead of a generic "couldn't load" toast.
        const message = getJobStatusErrorMessage(
          error,
          t("managerJobApprovalDetail.loadFailed"),
        );
        setLoadError(message);
        handleNonFormApiError(error);
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
  }, [jobId, t]);

  const statusText = useMemo(() => {
    if (!detail) return "";
    return getJobStatusPresentation(detail.status).label;
  }, [detail]);

  async function submitDecision(nextStatus: JobStatus, successMessage: string) {
    if (!detail) return;

    setSubmitting(nextStatus);
    setActionError(null);

    try {
      // Guarded HR status endpoint (PATCH /api/hr/jobs/{id}/status). We only navigate AFTER the
      // backend confirms — no optimistic "approved" flip (BR-OWN-003).
      await jobsService.updateJobStatus(detail.jobId, { status: nextStatus });
      appToast.success(successMessage);
      navigate("/internal/jobs");
    } catch (error) {
      // errorCode → HTTP status → backend message → fallback. Surfaces the actionable 403 (not the
      // department head / SystemAdmin) and 422 (department has no head) cases explicitly.
      const message = getJobStatusErrorMessage(
        error,
        t("managerJobApprovalDetail.updateFailed"),
      );
      setActionError(message);
      handleNonFormApiError(error);
    } finally {
      setSubmitting(null);
    }
  }

  if (loading) {
    return (
      <div className="app-container space-y-6 py-8">
        <div className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-9 w-96" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="surface-card h-[480px] lg:col-span-8" />
          <div className="surface-card h-[480px] lg:col-span-4" />
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="app-container py-10">
        <div className="surface-card p-10">
          <EmptyState
            icon="search_off"
            title="Không thể mở chi tiết phê duyệt"
            description={loadError ?? t("managerJobApprovalDetail.emptyDescription")}
            action={
              <button type="button" className="btn btn-dark" onClick={() => navigate("/internal/jobs")}>
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                {t("managerJobApprovalDetail.backToQueue")}
              </button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="app-container animate-fade-in py-8">
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2.5">
            <span className="badge bg-sky-50 text-sky-700">{detail.referenceCode}</span>
            <span className="text-[12px] font-semibold text-[#5f5e5e]">{detail.submittedAgoLabel}</span>
            <span className="badge bg-[#f2efed] text-[#5f5e5e]">{statusText}</span>
          </div>
          <h1 className="page-title">{detail.title}</h1>
          <p className="page-subtitle">
            {t("managerJobApprovalDetail.submittedBy", {
              name: detail.hrOwner.fullName,
              department: detail.department.name,
            })}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary shrink-0"
          onClick={() => navigate("/internal/jobs")}
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          {t("managerJobApprovalDetail.backToQueue")}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="grid grid-cols-1 gap-6 lg:col-span-8 md:grid-cols-2">
          <section className="card col-span-1 p-6 md:col-span-2">
            <div className="mb-5 flex items-center gap-2 border-b border-[#f0eceb] pb-4">
              <span className="material-symbols-outlined text-[#b90014]">info</span>
              <h2 className="section-title">{t("managerJobApprovalDetail.keyMetrics")}</h2>
            </div>
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
              <div>
                <p className="eyebrow">{t("jobManagement.department")}</p>
                <p className="mt-1.5 text-[15px] font-semibold text-[#1a1c1c]">{detail.department.name}</p>
              </div>
              <div>
                <p className="eyebrow">{t("managerJobApprovalDetail.location")}</p>
                <p className="mt-1.5 text-[15px] font-semibold text-[#1a1c1c]">{detail.location} ({detail.workMode})</p>
              </div>
              <div>
                <p className="eyebrow">{t("managerJobApprovalDetail.salary")}</p>
                <p className="mt-1.5 text-[15px] font-semibold text-[#1a1c1c]">{formatMoneyRange(detail.salaryMin, detail.salaryMax)}</p>
              </div>
              <div>
                <p className="eyebrow">{t("managerJobApprovalDetail.employmentType")}</p>
                <span className={`mt-1.5 ${getEmploymentTypeBadgeClass(detail.employmentType)}`}>
                  {detail.employmentType}
                </span>
              </div>
              <div>
                <p className="eyebrow">{t("managerJobApprovalDetail.vacancyCount")}</p>
                <p className="mt-1.5 text-[15px] font-semibold text-[#1a1c1c]">{detail.vacancyCount}</p>
              </div>
              <div>
                <p className="eyebrow">{t("managerJobApprovalDetail.deadline")}</p>
                <p className="mt-1.5 text-[15px] font-semibold text-[#1a1c1c]">{formatDateLabel(detail.deadline) || t("managerJobApprovalDetail.notProvided")}</p>
              </div>
            </div>
          </section>

          <section className="card p-6">
            <div className="mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#b90014]">terminal</span>
              <h2 className="section-title">{t("managerJobApprovalDetail.skills")}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {detail.skills.length ? detail.skills.map((skill, index) => (
                <span
                  key={skill.skillId}
                  className={getSkillChipClass(skill.name, index)}
                >
                  {skill.isRequired ? <span className="material-symbols-outlined text-[14px] leading-none">star</span> : null}
                  {skill.name}
                </span>
              )) : (
                <p className="text-[13px] text-[#5f5e5e]">{t("managerJobApprovalDetail.noSkills")}</p>
              )}
            </div>
          </section>

          <section className="card p-6">
            <div className="mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#b90014]">schema</span>
              <h2 className="section-title">{t("managerJobApprovalDetail.interviewFlow")}</h2>
            </div>
            <ol className="space-y-4">
              {detail.interviewFlow.map((step) => (
                <li key={step.order} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1a1c1c] text-[12px] font-bold text-white">
                    {step.order}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-[#1a1c1c]">{step.label}</p>
                    <p className="text-[12px] leading-5 text-[#5f5e5e]">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="card col-span-1 p-6 md:col-span-2">
            <div className="mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#b90014]">description</span>
              <h2 className="section-title">{t("managerJobApprovalDetail.positionOverview")}</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="eyebrow mb-3">{t("managerJobApprovalDetail.description")}</p>
                <ul className="space-y-2.5 text-[14px] leading-6 text-[#1a1c1c]">
                  {detail.description.length ? detail.description.map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <span className="material-symbols-outlined mt-0.5 text-[18px] text-[#b90014]">chevron_right</span>
                      <span>{item}</span>
                    </li>
                  )) : <li>{t("managerJobApprovalDetail.noDescription")}</li>}
                </ul>
              </div>
              <div>
                <p className="eyebrow mb-3">{t("managerJobApprovalDetail.requirements")}</p>
                <ul className="space-y-2.5 text-[14px] leading-6 text-[#1a1c1c]">
                  {detail.requirements.length ? detail.requirements.map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <span className="material-symbols-outlined mt-0.5 text-[18px] text-[#b90014]">check_circle</span>
                      <span>{item}</span>
                    </li>
                  )) : <li>{t("managerJobApprovalDetail.noRequirements")}</li>}
                </ul>
              </div>
            </div>
            <div className="mt-6 border-t border-[#f0eceb] pt-6">
              <p className="eyebrow mb-3">{t("managerJobApprovalDetail.benefits")}</p>
              <div className="flex flex-wrap gap-2">
                {detail.benefits.length ? detail.benefits.map((item) => (
                  <span key={item} className="badge bg-[#f2efed] text-[#5f5e5e]">
                    {item}
                  </span>
                )) : (
                  <span className="text-[13px] text-[#5f5e5e]">{t("managerJobApprovalDetail.noBenefits")}</span>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <section className="card border-[#e7bdb8] p-6 lg:sticky lg:top-6">
            <h2 className="section-title text-[20px]">{t("managerJobApprovalDetail.actionsTitle")}</h2>
            <p className="mt-2 text-[13px] leading-6 text-[#5f5e5e]">
              {t("managerJobApprovalDetail.actionsDescription")}
            </p>

            <p className="mt-3 flex items-start gap-2 rounded-[10px] bg-[#f7f4f2] px-3 py-2.5 text-[12px] leading-5 text-[#5f5e5e]">
              <span className="material-symbols-outlined mt-px text-[16px] text-[#8a8786]">info</span>
              {t("managerJobApprovalDetail.permissionsHint")}
            </p>

            {actionError ? (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2 rounded-[10px] border border-rose-100 bg-rose-50 px-3 py-2.5 text-[13px] leading-5 text-rose-700"
              >
                <span className="material-symbols-outlined mt-px text-[18px]">error</span>
                <span>{actionError}</span>
              </div>
            ) : null}

            {canApprove ? (
              <div className="mt-6 space-y-3">
                <AsyncActionButton
                  type="button"
                  className={`flex w-full items-center justify-between px-5 py-4 text-left text-sm font-bold uppercase tracking-[0.08em] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${actionStyles("approve")}`}
                  disabled={submitting !== null}
                  loading={submitting === "APPROVED"}
                  loadingText={t("managerJobApprovalDetail.approving")}
                  onClick={() => submitDecision("APPROVED", t("managerJobApprovalDetail.approvedSuccess"))}
                >
                  <span className="flex items-center gap-3">
                    <span className="material-symbols-outlined">check_circle</span>
                    {t("managerJobApprovalDetail.approve")}
                  </span>
                  <span>{t("managerJobApprovalDetail.moveToPosting")}</span>
                </AsyncActionButton>
                <AsyncActionButton
                  type="button"
                  className={`flex w-full items-center justify-between px-5 py-4 text-left text-sm font-bold uppercase tracking-[0.08em] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${actionStyles("changes")}`}
                  disabled={submitting !== null}
                  loading={submitting === "DRAFT"}
                  loadingText={t("managerJobApprovalDetail.returningDraft")}
                  onClick={() => submitDecision("DRAFT", t("managerJobApprovalDetail.returnedSuccess"))}
                  spinnerTone="brand"
                >
                  <span className="flex items-center gap-3">
                    <span className="material-symbols-outlined">edit_note</span>
                    {t("managerJobApprovalDetail.requestChanges")}
                  </span>
                  <span>{t("managerJobApprovalDetail.returnToDraft")}</span>
                </AsyncActionButton>
                <AsyncActionButton
                  type="button"
                  className={`flex w-full items-center justify-between px-5 py-4 text-left text-sm font-bold uppercase tracking-[0.08em] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${actionStyles("reject")}`}
                  disabled={submitting !== null}
                  loading={submitting === "REJECTED"}
                  loadingText={t("managerJobApprovalDetail.rejecting")}
                  onClick={() => submitDecision("REJECTED", t("managerJobApprovalDetail.rejectedSuccess"))}
                >
                  <span className="flex items-center gap-3">
                    <span className="material-symbols-outlined">cancel</span>
                    {t("managerJobApprovalDetail.reject")}
                  </span>
                  <span>{t("managerJobApprovalDetail.endApproval")}</span>
                </AsyncActionButton>
              </div>
            ) : (
              <div className="mt-6 rounded-[10px] border border-dashed border-[#d6d1cf] px-4 py-5 text-[13px] leading-6 text-[#5f5e5e]">
                {t("managerJobApprovalDetail.noPermission")}
              </div>
            )}

            <div className="mt-6 border-t border-[#f0eceb] pt-6">
              <p className="eyebrow">{t("managerJobApprovalDetail.approvalSummary")}</p>
              <p className="mt-3 text-[13px] leading-6 text-[#1a1c1c]">{detail.approvalSnapshot?.summary ?? t("managerJobApprovalDetail.noApprovalSummary")}</p>
              {detail.approvalSnapshot?.approvedByName ? (
                <p className="mt-2 text-[12px] font-semibold text-[#5f5e5e]">
                  {t("managerJobApprovalDetail.latestApprover", { name: detail.approvalSnapshot.approvedByName })}
                </p>
              ) : null}
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[16px] bg-gradient-to-br from-[#232525] to-[#161718] p-6 text-white">
            <p className="eyebrow text-white/60">{t("managerJobApprovalDetail.approvalContext")}</p>
            <div className="relative z-10 mt-5 grid grid-cols-2 gap-5">
              <div>
                <p className="text-[28px] font-bold leading-8">{detail.insights.applicationsCount}</p>
                <p className="mt-1 text-[12px] text-white/70">{t("managerJobApprovalDetail.applications")}</p>
              </div>
              <div>
                <p className="text-[28px] font-bold leading-8">{detail.insights.activePipelineCount}</p>
                <p className="mt-1 text-[12px] text-white/70">{t("managerJobApprovalDetail.activePipelines")}</p>
              </div>
              <div>
                <p className="text-[28px] font-bold leading-8">{detail.insights.requiredSkillsCount}</p>
                <p className="mt-1 text-[12px] text-white/70">{t("managerJobApprovalDetail.requiredSkills")}</p>
              </div>
              <div>
                <p className="text-[28px] font-bold leading-8">{detail.minExperienceYears ?? 0}y</p>
                <p className="mt-1 text-[12px] text-white/70">{t("managerJobApprovalDetail.minimumExperience")}</p>
              </div>
            </div>
            <div className="absolute bottom-[-24px] right-[-24px] opacity-[0.06]">
              <span className="material-symbols-outlined text-[140px] text-white">insights</span>
            </div>
          </section>

          <section className="card p-6">
            <p className="eyebrow">{t("managerJobApprovalDetail.hrOwner")}</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#fff1f0] to-[#ffdad6] text-[14px] font-bold text-[#b90014]">
                {detail.hrOwner.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[16px] font-semibold text-[#1a1c1c]">{detail.hrOwner.fullName}</p>
                <p className="truncate text-[13px] text-[#5f5e5e]">{detail.hrOwner.email}</p>
              </div>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[13px] text-[#5f5e5e]">
              <span className="material-symbols-outlined text-[16px]">call</span>
              {detail.hrOwner.phone || t("managerJobApprovalDetail.noPhone")}
            </p>
            <div className="mt-6 border-t border-[#f0eceb] pt-4">
              <p className="eyebrow">{t("managerJobApprovalDetail.departmentContext")}</p>
              <p className="mt-2 text-[13px] leading-6 text-[#1a1c1c]">{detail.department.description || t("managerJobApprovalDetail.noDepartmentDescription")}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ManagerJobApprovalDetailScreen;
