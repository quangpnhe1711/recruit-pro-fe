import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Link, useNavigate, useParams } from "react-router-dom";
import LoadingIndicator from "../../common/components/LoadingIndicator";

import PermissionGuard from "../../guards/PermissionGuard";
import { usePermissions } from "../../hooks/usePermissions";
import type { ApplicationReviewDecision, ApplicationReviewDetailDto } from "../../modules/jobs/jobsSchema";
import { PERMISSIONS } from "../../permissions/permissions";
import { ROLE_NAMES } from "../../permissions/rolePermissions";
import { hrService } from "../../services/hr/hrService";

function formatDateLabel(value: string | null) {
  if (!value) return "Not available";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTimeLabel(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusTone(status: string) {
  switch (status.toLowerCase()) {
    case "managerreview":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "rejected":
      return "bg-red-50 text-red-700 border-red-200";
    case "accepted":
      return "bg-green-50 text-green-700 border-green-200";
    case "reviewing":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-sky-50 text-sky-700 border-sky-200";
  }
}

function decisionButtonClassName(decision: ApplicationReviewDecision) {
  switch (decision) {
    case "hire":
      return "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100";
    case "hold":
      return "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100";
    case "reject":
      return "border-red-200 bg-red-50 text-red-800 hover:bg-red-100";
  }
}

function decisionLabel(decision: ApplicationReviewDecision) {
  switch (decision) {
    case "hire":
      return "Hire Candidate";
    case "hold":
      return "Place On Hold";
    case "reject":
      return "Reject Application";
  }
}

function decisionIcon(decision: ApplicationReviewDecision) {
  switch (decision) {
    case "hire":
      return "check_circle";
    case "hold":
      return "pause_circle";
    case "reject":
      return "cancel";
  }
}

function CandidateReviewDetailScreen() {
  const navigate = useNavigate();
  const { applicationId = "" } = useParams();
  const { hasPermission, primaryRole } = usePermissions();
  const canApprove = hasPermission(PERMISSIONS.APPLICATION_APPROVE);
  const canReject = hasPermission(PERMISSIONS.APPLICATION_REJECT);
  const canViewCv = hasPermission(PERMISSIONS.APPLICATION_VIEW_CV);
  const canSendOffer = primaryRole === ROLE_NAMES.HR && hasPermission(PERMISSIONS.APPLICATION_SEND_EMAIL);
  const reviewRoutePrefix =
    primaryRole === ROLE_NAMES.MANAGER ? "/manager/applications" : "/hr/applications";
  const candidateRoutePrefix =
    primaryRole === ROLE_NAMES.MANAGER ? "/manager/candidates" : "/hr/candidates";

  const [detail, setDetail] = useState<ApplicationReviewDetailDto | null>(null);
  const [resumeFile, setResumeFile] = useState<{ fileName: string; fileUrl: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingDecision, setSubmittingDecision] = useState<ApplicationReviewDecision | null>(null);

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
                fileName: resumeResponse.data.fileName,
                fileUrl: resumeResponse.data.fileUrl,
              }
            : null,
        );
      } catch {
        if (!mounted) return;
        toast.error("Unable to load candidate review detail.");
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
      const response = await hrService.updateApplicationDecision(applicationId, decision);
      setDetail(response.data);
      toast.success(response.message || `${decisionLabel(decision)} completed.`);
    } catch {
      toast.error("Unable to update application decision.");
    } finally {
      setSubmittingDecision(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center px-4 py-10 md:px-10">
        <LoadingIndicator label="Loading candidate review..." />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="w-full px-4 py-10 md:px-10">
        <div className="border border-[#e7bdb8] bg-white p-8">
          <h1 className="text-[32px] font-semibold text-[#1a1c1c]">Candidate review not found</h1>
          <p className="mt-2 text-sm text-[#5f5e5e]">
            The application detail could not be loaded from the current workflow.
          </p>
          <button
            type="button"
            className="mt-6 inline-flex items-center gap-2 bg-[#1a1c1c] px-5 py-3 text-sm font-semibold text-white"
            onClick={() => navigate(reviewRoutePrefix)}
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to Applications
          </button>
        </div>
      </div>
    );
  }

  const interviewNotes = detail.interviews.filter((item) => item.notes);

  return (
    <div className="w-full px-4 py-8 md:px-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-[#cde5ff] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#004b74]">
              {detail.stageLabel}
            </span>
            <span className="text-sm text-[#5f5e5e]">{detail.referenceCode}</span>
            <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${statusTone(detail.status)}`}>
              {detail.status}
            </span>
          </div>
          <h1 className="text-[40px] font-bold leading-tight text-[#1a1c1c]">
            <Link className="hover:text-[#b90014]" to={`${candidateRoutePrefix}/${detail.candidate.id}`}>
              {detail.candidate.fullName}
            </Link>
          </h1>
          <p className="mt-2 text-lg text-[#5f5e5e]">
            Applying for{" "}
            <Link className="font-semibold text-[#b90014] hover:underline" to={`/jobs/${detail.job.id}`}>
              {detail.job.title}
            </Link>{" "}
            - {detail.job.departmentName}
          </p>
          <p className="mt-3 text-sm text-[#5f5e5e]">
            Applied {formatDateLabel(detail.appliedAt)}. Next step: {detail.nextStep}.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 border border-[#1a1c1c] bg-white px-5 py-3 text-sm font-semibold text-[#1a1c1c] transition-colors hover:bg-[#f3f3f3]"
            onClick={() => navigate(reviewRoutePrefix)}
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to Applications
          </button>
          {canSendOffer && detail.status.toLowerCase() === "managerreview" ? (
            <Link
              className="inline-flex items-center gap-2 bg-[#b90014] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#93000d]"
              to={`/hr/applications/${detail.applicationId}/send-offer`}
            >
              <span className="material-symbols-outlined text-base">
                {detail.offerStatus?.toLowerCase() === "sent" ? "edit_document" : "send"}
              </span>
              {detail.offerStatus ? "Manage Offer" : "Create Offer"}
            </Link>
          ) : null}
          {resumeFile ? (
            <a
              className="inline-flex items-center gap-2 bg-[#e2e2e2] px-5 py-3 text-sm font-semibold text-[#1a1c1c] transition-colors hover:bg-[#dadada]"
              href={resumeFile.fileUrl}
              rel="noreferrer"
              target="_blank"
            >
              <span className="material-symbols-outlined text-base">download</span>
              Download Resume
            </a>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <section className="border border-[#e7bdb8] bg-white p-6">
              <p className="text-center text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5f5e5e]">
                Skills Match
              </p>
              <div className="mt-5 flex justify-center">
                <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-[10px] border-[#b90014]">
                  <span className="text-[32px] font-bold text-[#1a1c1c]">
                    {detail.insights.skillsMatchPercent}%
                  </span>
                </div>
              </div>
              <p className="mt-5 text-center text-sm font-semibold text-[#005f93]">
                {detail.insights.matchedSkillCount}/{detail.insights.requiredSkillCount || detail.insights.matchedSkillCount} required skills matched
              </p>
            </section>

            <section className="border border-[#e7bdb8] bg-white p-6">
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5f5e5e]">
                Interview Timeline
              </h2>
              <div className="mt-5 space-y-4">
                {detail.interviews.length ? (
                  detail.interviews.map((interview) => (
                    <div key={interview.id} className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined mt-0.5 text-[#005f93]">
                          check_circle
                        </span>
                        <div>
                          <p className="font-semibold text-[#1a1c1c]">{interview.label}</p>
                          <p className="text-sm text-[#5f5e5e]">{interview.status}</p>
                        </div>
                      </div>
                      <span className="text-sm text-[#5f5e5e]">
                        {formatDateTimeLabel(interview.interviewDate)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[#5f5e5e]">No interviews have been scheduled yet.</p>
                )}
              </div>
            </section>
          </div>

          <section className="border border-[#e7bdb8] bg-white">
            <div className="flex items-center justify-between bg-[#1a1c1c] px-6 py-4 text-white">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">
                  {resumeFile?.fileName ?? "Candidate Resume"}
                </h2>
                <p className="mt-1 text-xs text-white/70">
                  FE/BE integration uses the stored resume URL for preview and download.
                </p>
              </div>
              {resumeFile && canViewCv ? (
                <div className="flex items-center gap-3">
                  <a href={resumeFile.fileUrl} rel="noreferrer" target="_blank" title="Open resume">
                    <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                  </a>
                  <a href={resumeFile.fileUrl} rel="noreferrer" target="_blank" title="Download resume">
                    <span className="material-symbols-outlined text-[20px]">download</span>
                  </a>
                </div>
              ) : null}
            </div>

            {resumeFile && canViewCv ? (
              <div className="h-[720px] bg-[#f3f3f3] p-4">
                <iframe
                  className="h-full w-full border border-[#e7bdb8] bg-white"
                  src={resumeFile.fileUrl}
                  title="Candidate resume preview"
                />
              </div>
            ) : (
              <div className="p-8">
                <p className="text-sm text-[#5f5e5e]">
                  Resume preview is unavailable.{" "}
                  {resumeFile ? (
                    <a className="font-semibold text-[#b90014] hover:underline" href={resumeFile.fileUrl} rel="noreferrer" target="_blank">
                      Open the stored file in a new tab
                    </a>
                  ) : (
                    "This application does not currently have a stored resume."
                  )}
                </p>
              </div>
            )}
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="border border-[#e7bdb8] bg-white p-6">
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5f5e5e]">
                Candidate Profile
              </h2>
              <div className="mt-4 space-y-3 text-sm text-[#1a1c1c]">
                <p><span className="font-semibold">Current Position:</span> {detail.candidate.currentPosition || "Not provided"}</p>
                <p><span className="font-semibold">Experience:</span> {detail.candidate.experienceYears != null ? `${detail.candidate.experienceYears} years` : "Not provided"}</p>
                <p><span className="font-semibold">Education:</span> {detail.candidate.education || "Not provided"}</p>
                <p><span className="font-semibold">Location:</span> {detail.candidate.address || "Not provided"}</p>
                <p><span className="font-semibold">Email:</span> {detail.candidate.email}</p>
                <p><span className="font-semibold">Phone:</span> {detail.candidate.phone || "Not provided"}</p>
                {detail.candidate.bio ? (
                  <p><span className="font-semibold">Bio:</span> {detail.candidate.bio}</p>
                ) : null}
                <div className="flex flex-wrap gap-2 pt-2">
                  {detail.candidate.linkedinUrl ? (
                    <a className="inline-flex items-center gap-2 rounded-full border border-[#e7bdb8] px-3 py-1.5 text-xs font-semibold text-[#1a1c1c] hover:bg-[#f9f9f9]" href={detail.candidate.linkedinUrl} rel="noreferrer" target="_blank">
                      <span className="material-symbols-outlined text-sm">link</span>
                      LinkedIn
                    </a>
                  ) : null}
                  {detail.candidate.githubUrl ? (
                    <a className="inline-flex items-center gap-2 rounded-full border border-[#e7bdb8] px-3 py-1.5 text-xs font-semibold text-[#1a1c1c] hover:bg-[#f9f9f9]" href={detail.candidate.githubUrl} rel="noreferrer" target="_blank">
                      <span className="material-symbols-outlined text-sm">code</span>
                      GitHub
                    </a>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="border border-[#e7bdb8] bg-white p-6">
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5f5e5e]">
                Skills Overview
              </h2>
              <div className="mt-4">
                <p className="text-sm font-semibold text-[#1a1c1c]">Required for {detail.job.title}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {detail.job.requiredSkills.length ? (
                    detail.job.requiredSkills.map((skill) => (
                      <span key={skill} className="rounded-full bg-[#b90014]/5 px-3 py-1.5 text-xs font-semibold text-[#b90014]">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-[#5f5e5e]">No required skills configured.</span>
                  )}
                </div>
              </div>
              <div className="mt-6 border-t border-[#e7bdb8] pt-4">
                <p className="text-sm font-semibold text-[#1a1c1c]">Candidate skills</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {detail.candidate.skills.length ? (
                    detail.candidate.skills.map((skill) => (
                      <span key={skill} className="rounded-full bg-[#005f93]/10 px-3 py-1.5 text-xs font-semibold text-[#005f93]">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-[#5f5e5e]">No candidate skills on profile yet.</span>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="border-2 border-[#5d3f3c] bg-white p-6 xl:sticky xl:top-24">
            <h2 className="text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#1a1c1c]">
              Final Recommendation
            </h2>

            <PermissionGuard permissions={PERMISSIONS.APPLICATION_APPROVE}>
              <div className="mt-6 space-y-3">
                {(["hire", "hold"] as ApplicationReviewDecision[]).map((decision) => (
                  <button
                    key={decision}
                    type="button"
                    className={`flex w-full items-center justify-between border px-5 py-4 text-left transition-colors ${decisionButtonClassName(decision)} disabled:cursor-not-allowed disabled:opacity-60`}
                    disabled={!canReview || submittingDecision !== null}
                    onClick={() => void handleDecision(decision)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined">{decisionIcon(decision)}</span>
                      <span className="text-base font-bold uppercase tracking-[0.05em]">
                        {decisionLabel(decision)}
                      </span>
                    </div>
                    {submittingDecision === decision ? (
                      <span className="text-xs font-semibold uppercase tracking-[0.14em]">Saving...</span>
                    ) : (
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    )}
                  </button>
                ))}
              </div>
            </PermissionGuard>

            <PermissionGuard permissions={PERMISSIONS.APPLICATION_REJECT}>
              <button
                type="button"
                className={`mt-3 flex w-full items-center justify-between border px-5 py-4 text-left transition-colors ${decisionButtonClassName("reject")} disabled:cursor-not-allowed disabled:opacity-60`}
                disabled={!canReject || submittingDecision !== null}
                onClick={() => void handleDecision("reject")}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined">{decisionIcon("reject")}</span>
                  <span className="text-base font-bold uppercase tracking-[0.05em]">
                    {decisionLabel("reject")}
                  </span>
                </div>
                {submittingDecision === "reject" ? (
                  <span className="text-xs font-semibold uppercase tracking-[0.14em]">Saving...</span>
                ) : (
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                )}
              </button>
            </PermissionGuard>

            <div className="mt-6 border-t border-[#e7bdb8] pt-6">
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5f5e5e]">
                Review Summary
              </h3>
              <div className="mt-4 space-y-3 text-sm text-[#1a1c1c]">
                <p><span className="font-semibold">Interview notes submitted:</span> {detail.insights.submittedInterviewNotes}/{detail.insights.totalInterviews}</p>
                <p><span className="font-semibold">Reviewed by:</span> {detail.reviewedBy?.fullName || "Not assigned yet"}</p>
                <p><span className="font-semibold">Offer state:</span> {detail.offerStatus || "Not created yet"}</p>
                <p><span className="font-semibold">Workflow state:</span> {detail.nextStep}</p>
              </div>
            </div>

            <div className="mt-6 border-t border-[#e7bdb8] pt-6">
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5f5e5e]">
                Interview Notes
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
                  <div className="border border-dashed border-[#e7bdb8] p-4 text-sm text-[#5f5e5e]">
                    Interview-specific notes are not stored for this application yet.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="bg-[#5f0007] p-6 text-[#ffdad6]">
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em]">
              Team Signal
            </h3>
            <p className="mt-3 text-sm leading-6">
              {detail.insights.submittedInterviewNotes} of {detail.insights.totalInterviews} interview rounds currently include written feedback in the system.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">
                Match {detail.insights.skillsMatchPercent}%
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">
                {detail.interviews.length} interview rounds
              </span>
              <Link
                className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#5f0007]"
                to={`${reviewRoutePrefix}/${detail.applicationId}`}
              >
                Refresh Context
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default CandidateReviewDetailScreen;
