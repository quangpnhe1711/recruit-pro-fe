import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getDateLocale, useI18n } from "../../i18n";
import { getApplicationErrorMessage } from "../../common/utils/apiError";
import AsyncActionButton from "../../common/components/AsyncActionButton";
import { Skeleton } from "../../common/components/Skeleton";
import EmptyState from "../../common/components/EmptyState";
import { applyJobSchema, validateWithSchema } from "../../common/validation/formValidation";
import {
  getEmploymentTypeBadgeClass,
  quickApplyCardClass,
} from "../../common/utils/jobPresentation";
import { openProtectedFileInNewTab } from "../../common/utils/protectedFile";
import { buildResumePreviewPath } from "../../common/utils/resumeLinks";
import type { ApplyJobResponseDto, ApplyJobScreenDto } from "../../modules/jobs/jobsSchema";
import { jobsService } from "../../services/jobs/jobsService";

function formatUploadedAt(
  value: string | null | undefined,
  t: (key: string) => string,
) {
  if (!value) return t("applyJob.resumeUploadEmpty");

  return t("applyJob.resumeUploadedAt", {
    date: new Date(value).toLocaleDateString(getDateLocale()),
  });
}

function formatDeadline(value: string | null | undefined, t: (key: string) => string) {
  if (!value) return t("applyJob.deadlineOpenUntilFilled");
  return new Date(value).toLocaleDateString(getDateLocale());
}

function ApplyJobScreen() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { jobId = "" } = useParams();
  const [screenData, setScreenData] = useState<ApplyJobScreenDto | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [coverLetterError, setCoverLetterError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<ApplyJobResponseDto | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    jobsService
      .getApplyContext(jobId)
      .then((response) => {
        if (!mounted) {
          return;
        }

        setScreenData(response.data ?? null);
      })
      .catch(() => {
        if (mounted) {
          setScreenData(null);
          toast.error(t("applyJob.loadFailed"));
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
  }, [jobId, t]);

  async function handleSubmit() {
    if (!screenData?.eligibility.canApply) {
      return;
    }

    setSubmitted(true);
    const schemaErrors = validateWithSchema(applyJobSchema, { coverLetter });
    const nextError = schemaErrors.coverLetter ?? null;
    setCoverLetterError(nextError);
    if (nextError) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await jobsService.applyToJob(jobId, {
        coverLetter: coverLetter.trim() || null,
      });

      if (response.data) {
        setSuccessResult(response.data);
        setScreenData((prev) =>
          prev
            ? {
                ...prev,
                eligibility: {
                  ...prev.eligibility,
                  canApply: false,
                  alreadyApplied: true,
                  existingApplicationId: response.data.applicationId,
                  existingApplicationStatus: response.data.status,
                  blockers: [t("applyJob.alreadyAppliedBlocker")],
                  guidanceMessage: t("applyJob.alreadyAppliedGuidance"),
                },
              }
            : prev,
        );
      }

      toast.success(response.message || t("applyJob.submitSuccess"));
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, t("applyJob.submitFailed")));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <section className="app-container animate-fade-in py-8">
        <Skeleton className="h-5 w-44" />
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <Skeleton className="h-32 w-full rounded-[16px]" />
            <Skeleton className="h-56 w-full rounded-[16px]" />
            <Skeleton className="h-40 w-full rounded-[16px]" />
          </div>
          <div className="space-y-6 lg:col-span-4">
            <Skeleton className="h-96 w-full rounded-[16px]" />
          </div>
        </div>
      </section>
    );
  }

  if (!screenData) {
    return (
      <section className="app-container animate-fade-in py-8">
        <div className="card">
          <EmptyState
            icon="error"
            title={t("applyJob.unavailableTitle")}
            description={t("applyJob.unavailableDescription")}
            action={
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate(`/jobs/${jobId}`)}
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                {t("applyJob.backToJob")}
              </button>
            }
          />
        </div>
      </section>
    );
  }

  const { candidateProfile, eligibility, job, resume } = screenData;

  return (
    <>
      <section className="app-container animate-fade-in py-8">
        <button
          type="button"
          className="btn btn-ghost mb-5 px-3 py-2"
          onClick={() => navigate(`/jobs/${jobId}`)}
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          {t("applyJob.backToJob")}
        </button>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <section className="card overflow-hidden">
              <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-7">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[16px] bg-gradient-to-br from-[#e8242c] to-[#c50f1b] text-white shadow-[var(--shadow-brand)]">
                  <span className="material-symbols-outlined text-[34px]">work</span>
                </div>
                <div className="min-w-0">
                  <p className="eyebrow mb-1.5">{t("applyJob.eyebrow")}</p>
                  <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.01em] text-[#1a1c1c] md:text-[28px]">
                    {t("applyJob.title", { title: job.title })}
                  </h1>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[14px] text-[#5f5e5e]">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-[#b90014]">corporate_fare</span>
                      <span>{job.departmentName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-[#b90014]">location_on</span>
                      <span>{job.location} ({job.workMode})</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {!eligibility.canApply ? (
              <section className="rounded-[16px] border border-[#ffdad6] bg-[#fff1f0] p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white text-[#ba1a1a]">
                    <span className="material-symbols-outlined">error</span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-[18px] font-semibold text-[#1a1c1c]">{t("applyJob.unavailableTitle")}</h2>
                    <p className="mt-1.5 text-[14px] text-[#5f5e5e]">{eligibility.guidanceMessage}</p>
                    <ul className="mt-4 space-y-2 text-[14px] text-[#1a1c1c]">
                      {eligibility.blockers.map((blocker) => (
                        <li key={blocker} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#b90014]" />
                          <span>{blocker}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-5 flex flex-wrap gap-2.5">
                      <Link
                        to={candidateProfile.editProfilePath}
                        className="btn btn-primary"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                        {t("applyJob.updateProfile")}
                      </Link>
                      {eligibility.alreadyApplied ? (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => navigate("/candidate/my-applications")}
                        >
                          {t("applyJob.viewApplications")}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            <section className="card p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="section-title">{t("applyJob.profileTitle")}</h2>
                <Link
                  to={candidateProfile.editProfilePath}
                  className="text-[14px] font-semibold text-[#b90014] hover:underline"
                >
                  {t("applyJob.editProfile")}
                </Link>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="field-label">{t("auth.fullName")}</label>
                  <div className="rounded-[10px] border border-[#ececec] bg-[#faf8f8] px-4 py-3 text-[14px] font-medium text-[#1a1c1c]">
                    {candidateProfile.fullName}
                  </div>
                </div>
                <div>
                  <label className="field-label">{t("auth.email")}</label>
                  <div className="rounded-[10px] border border-[#ececec] bg-[#faf8f8] px-4 py-3 text-[14px] font-medium text-[#1a1c1c]">
                    {candidateProfile.email}
                  </div>
                </div>
                <div>
                  <label className="field-label">{t("auth.phone")}</label>
                  <div className="rounded-[10px] border border-[#ececec] bg-[#faf8f8] px-4 py-3 text-[14px] font-medium text-[#1a1c1c]">
                    {candidateProfile.phone || t("applyJob.addPhone")}
                  </div>
                </div>
                <div>
                  <label className="field-label">{t("applyJob.currentPosition")}</label>
                  <div className="rounded-[10px] border border-[#ececec] bg-[#faf8f8] px-4 py-3 text-[14px] font-medium text-[#1a1c1c]">
                    {candidateProfile.currentPosition || t("applyJob.updateHeadline")}
                  </div>
                </div>
              </div>
            </section>

            <section className="card p-5 sm:p-6">
              <h2 className="section-title">{t("applyJob.resumeTitle")}</h2>
              {resume ? (
                <div className="mt-4 flex flex-col gap-4 rounded-[12px] border border-[#ececec] bg-[#faf8f8] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#fff1f0] to-[#ffdad6] text-[#b90014]">
                      <span className="material-symbols-outlined text-[24px]">description</span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold text-[#1a1c1c]">{resume.fileName}</p>
                      <p className="text-[12px] text-[#8a8786]">{formatUploadedAt(resume.uploadedAt, t)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary px-3 py-2 text-[13px]"
                      onClick={() => {
                        void openProtectedFileInNewTab(
                          buildResumePreviewPath(resume.resumeId, resume.fileUrl),
                        ).catch(() => toast.error(t("applyJob.openResumeFailed")));
                      }}
                    >
                      <span className="material-symbols-outlined text-[18px]">visibility</span>
                      {t("applyJob.previewResume")}
                    </button>
                    <Link
                      to={candidateProfile.editProfilePath}
                      className="btn btn-ghost px-3 py-2 text-[13px]"
                    >
                      {t("applyJob.changeResume")}
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex items-start gap-3 rounded-[12px] border border-dashed border-[#ffb3ac] bg-[#fff1f0] p-4 text-[14px] text-[#1a1c1c]">
                  <span className="material-symbols-outlined text-[20px] text-[#ba1a1a]">upload_file</span>
                  <span>{t("applyJob.resumeMissing")}</span>
                </div>
              )}
            </section>

            <section className="card p-5 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="section-title">{t("applyJob.coverLetterTitle")}</h2>
                <span className="badge bg-[#f2efed] text-[#8a8786]">{t("common.optional")}</span>
              </div>
                <textarea
                  value={coverLetter}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setCoverLetter(nextValue);
                    if (submitted) {
                      const schemaErrors = validateWithSchema(applyJobSchema, { coverLetter: nextValue });
                      setCoverLetterError(schemaErrors.coverLetter ?? null);
                    }
                  }}
                rows={5}
                maxLength={2000}
                placeholder={t("applyJob.coverLetterPlaceholder")}
                className={`input-field resize-none ${coverLetterError ? "border-[#ba1a1a]" : ""}`}
              />
              {coverLetterError ? (
                <p className="mt-2 text-[12px] text-[#ba1a1a]">{coverLetterError}</p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[12px] text-[#8a8786]">
                  {t("applyJob.coverLetterHint")}
                </p>
                <p className="text-[12px] text-[#8a8786]">{coverLetter.length}/2000</p>
              </div>
            </section>
          </div>

          <div className="space-y-6 lg:col-span-4">
            <section className={`${quickApplyCardClass} overflow-hidden lg:sticky lg:top-24`}>
              <div className="flex h-28 items-center justify-center bg-gradient-to-br from-[#e8242c] to-[#c50f1b] text-white">
                <span className="material-symbols-outlined text-[52px]">terminal</span>
              </div>

              <div className="p-6">
                <h2 className="section-title">{t("applyJob.jobSummaryTitle")}</h2>
                <div className="mt-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[20px] text-[#b90014]">payments</span>
                    <div>
                      <p className="text-[12px] font-semibold text-[#8a8786]">{t("applyJob.salaryLabel")}</p>
                      <p className="text-[14px] font-semibold text-[#1a1c1c]">{job.salaryLabel}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[20px] text-[#b90014]">schedule</span>
                    <div>
                      <p className="text-[12px] font-semibold text-[#8a8786]">{t("applyJob.employmentTypeLabel")}</p>
                      <span className={`mt-1.5 ${getEmploymentTypeBadgeClass(job.employmentType)}`}>
                        {job.employmentType}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[20px] text-[#b90014]">groups</span>
                    <div>
                      <p className="text-[12px] font-semibold text-[#8a8786]">{t("applyJob.vacancyLabel")}</p>
                      <p className="text-[14px] font-semibold text-[#1a1c1c]">{t("applyJob.vacancyCount", { count: job.vacancyCount })}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[20px] text-[#b90014]">event</span>
                    <div>
                      <p className="text-[12px] font-semibold text-[#8a8786]">{t("applyJob.deadlineLabel")}</p>
                      <p className="text-[14px] font-semibold text-[#1a1c1c]">{formatDeadline(job.deadline, t)}</p>
                    </div>
                  </div>
                </div>

                <AsyncActionButton
                  type="button"
                  disabled={!eligibility.canApply || submitting}
                  className="btn btn-primary mt-6 w-full py-3.5 text-[15px]"
                  onClick={handleSubmit}
                  loading={submitting}
                  loadingText={t("applyJob.submitting")}
                >
                  {t("applyJob.submit")}
                </AsyncActionButton>
                <button
                  type="button"
                  className="btn btn-ghost mt-2 w-full"
                  onClick={() => navigate(`/jobs/${jobId}`)}
                >
                  {t("common.cancel")}
                </button>
              </div>
            </section>
          </div>
        </div>
      </section>

      {successResult ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1a1c1c]/40 p-6 backdrop-blur-sm animate-fade-in">
          <div className="animate-scale-in w-full max-w-md rounded-[16px] border border-[#ececec] bg-white p-8 text-center shadow-[var(--shadow-lg)]">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <span className="material-symbols-outlined text-[40px]">check_circle</span>
            </div>
            <h2 className="mt-6 text-[26px] font-semibold leading-9 tracking-[-0.01em] text-[#1a1c1c]">
              {t("applyJob.successTitle")}
            </h2>
            <p className="mt-3 text-[14px] leading-6 text-[#5f5e5e]">
              {t("applyJob.successDescription", { title: job.title })}
            </p>
            <div className="mt-7 space-y-2.5">
              <button
                type="button"
                className="btn btn-dark w-full py-3"
                onClick={() => navigate("/candidate/my-applications")}
              >
                {t("applyJob.viewApplications")}
              </button>
              <button
                type="button"
                className="btn btn-secondary w-full py-3"
                onClick={() => navigate("/jobs")}
              >
                {t("applyJob.viewMoreJobs")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default ApplyJobScreen;
