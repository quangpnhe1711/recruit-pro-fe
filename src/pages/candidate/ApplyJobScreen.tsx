import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import LoadingIndicator from "../../common/components/LoadingIndicator";
import type { ApplyJobResponseDto, ApplyJobScreenDto } from "../../modules/jobs/jobsSchema";
import { jobsService } from "../../services/jobs/jobsService";

function Icon({ name }: { name: string }) {
  return <span className="material-symbols-outlined">{name}</span>;
}

function formatUploadedAt(value?: string | null) {
  if (!value) return "Upload your latest resume";

  return `Uploaded ${new Date(value).toLocaleDateString()}`;
}

function formatDeadline(value?: string | null) {
  if (!value) return "Open until filled";
  return new Date(value).toLocaleDateString();
}

function ApplyJobScreen() {
  const navigate = useNavigate();
  const { jobId = "" } = useParams();
  const [screenData, setScreenData] = useState<ApplyJobScreenDto | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<ApplyJobResponseDto | null>(null);

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
          toast.error("Unable to load application screen");
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
  }, [jobId]);

  async function handleSubmit() {
    if (!screenData?.eligibility.canApply) {
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
                  blockers: ["You have already applied for this job."],
                  guidanceMessage: "Track the latest status of this application from My Applications.",
                },
              }
            : prev,
        );
      }

      toast.success(response.message || "Application submitted successfully");
    } catch {
      toast.error("Unable to submit your application");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center px-4 py-10 md:px-10">
        <LoadingIndicator label="Loading application form..." />
      </div>
    );
  }

  if (!screenData) {
    return (
      <section className="w-full px-4 py-10 md:px-10">
        <div className="border border-[#e2dfde] bg-white p-8 text-center">
          <h1 className="text-[24px] font-semibold text-[#1a1c1c]">Application Unavailable</h1>
          <p className="mt-3 text-[14px] text-[#5f5e5e]">
            We could not load this application screen right now.
          </p>
          <button
            type="button"
            className="mt-6 bg-[#b90014] px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-white"
            onClick={() => navigate(`/jobs/${jobId}`)}
          >
            Back to Job
          </button>
        </div>
      </section>
    );
  }

  const { candidateProfile, eligibility, job, resume } = screenData;

  return (
    <>
      <section className="w-full px-4 py-8 md:px-10">
        <button
          type="button"
          className="mb-6 inline-flex items-center gap-2 text-[14px] text-[#5d3f3c] transition-colors hover:text-[#b90014]"
          onClick={() => navigate(`/jobs/${jobId}`)}
        >
          <Icon name="arrow_back" />
          Back to Job
        </button>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <section className="border border-[#e7bdb8] bg-white p-8">
              <h1 className="text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#1a1c1c]">
                Apply for {job.title}
              </h1>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-[#5d3f3c]">
                <div className="flex items-center gap-2">
                  <Icon name="corporate_fare" />
                  <span>{job.departmentName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="location_on" />
                  <span>{job.location} ({job.workMode})</span>
                </div>
              </div>
            </section>

            {!eligibility.canApply ? (
              <section className="border border-[#ffdad6] bg-[#fff5f4] p-6">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#ba1a1a]">error</span>
                  <div>
                    <h2 className="text-[20px] font-semibold text-[#1a1c1c]">Application blocked</h2>
                    <p className="mt-2 text-[14px] text-[#5d3f3c]">{eligibility.guidanceMessage}</p>
                    <ul className="mt-4 space-y-2 text-[14px] text-[#5d3f3c]">
                      {eligibility.blockers.map((blocker) => (
                        <li key={blocker} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#b90014]" />
                          <span>{blocker}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link
                        to={candidateProfile.editProfilePath}
                        className="bg-[#b90014] px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-white"
                      >
                        Update Profile
                      </Link>
                      {eligibility.alreadyApplied ? (
                        <button
                          type="button"
                          className="border border-[#1a1c1c] bg-white px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#1a1c1c]"
                          onClick={() => navigate("/candidate/my-applications")}
                        >
                          View My Applications
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            <section className="border border-[#e7bdb8] bg-white p-6">
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="text-[20px] font-semibold text-[#1a1c1c]">Your Profile</h2>
                <Link
                  to={candidateProfile.editProfilePath}
                  className="text-[14px] font-semibold text-[#b90014] hover:underline"
                >
                  Edit Global Profile
                </Link>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5d3f3c]">
                    Full Name
                  </label>
                  <div className="mt-2 border border-[#e7bdb8] px-4 py-3 text-[14px] font-medium text-[#1a1c1c]">
                    {candidateProfile.fullName}
                  </div>
                </div>
                <div>
                  <label className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5d3f3c]">
                    Email Address
                  </label>
                  <div className="mt-2 border border-[#e7bdb8] px-4 py-3 text-[14px] font-medium text-[#1a1c1c]">
                    {candidateProfile.email}
                  </div>
                </div>
                <div>
                  <label className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5d3f3c]">
                    Phone Number
                  </label>
                  <div className="mt-2 border border-[#e7bdb8] px-4 py-3 text-[14px] font-medium text-[#1a1c1c]">
                    {candidateProfile.phone || "Add your phone number"}
                  </div>
                </div>
                <div>
                  <label className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5d3f3c]">
                    Current Position
                  </label>
                  <div className="mt-2 border border-[#e7bdb8] px-4 py-3 text-[14px] font-medium text-[#1a1c1c]">
                    {candidateProfile.currentPosition || "Update your professional headline"}
                  </div>
                </div>
              </div>
            </section>

            <section className="border border-[#e7bdb8] bg-white p-6">
              <h2 className="text-[20px] font-semibold text-[#1a1c1c]">CV / Resume</h2>
              {resume ? (
                <div className="mt-4 flex flex-col gap-4 border border-dashed border-[#926e6b] bg-[#f9f9f9] p-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="rounded bg-[#ffdad6] p-2 text-[#b90014]">
                      <Icon name="description" />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-[#1a1c1c]">{resume.fileName}</p>
                      <p className="text-[12px] text-[#5f5e5e]">{formatUploadedAt(resume.uploadedAt)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={resume.fileUrl}
                      rel="noreferrer"
                      target="_blank"
                      className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#1a1c1c] hover:text-[#b90014]"
                    >
                      Preview
                    </a>
                    <Link
                      to={candidateProfile.editProfilePath}
                      className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#b90014] hover:underline"
                    >
                      Change File
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="mt-4 border border-dashed border-[#ba1a1a] bg-[#fff5f4] p-4 text-[14px] text-[#5d3f3c]">
                  No resume uploaded yet. Please update your candidate profile before applying.
                </div>
              )}
            </section>

            <section className="border border-[#e7bdb8] bg-white p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-[20px] font-semibold text-[#1a1c1c]">Cover Letter / Note to Recruiter</h2>
                <span className="text-[12px] text-[#5f5e5e]">Optional</span>
              </div>
              <textarea
                value={coverLetter}
                onChange={(event) => setCoverLetter(event.target.value)}
                rows={5}
                maxLength={2000}
                placeholder="Tell us why you're a great fit for this role..."
                className="w-full resize-none border border-[#926e6b] bg-white px-4 py-3 text-[14px] text-[#1a1c1c] outline-none transition-colors placeholder:text-[#926e6b] focus:border-[#1a1c1c]"
              />
              <p className="mt-2 text-[12px] text-[#5f5e5e]">
                Optional note. Current database schema does not persist cover letters yet.
              </p>
              <p className="mt-2 text-right text-[12px] text-[#5f5e5e]">{coverLetter.length}/2000</p>
            </section>
          </div>

          <div className="space-y-6 lg:col-span-4">
            <section className="overflow-hidden border border-[#e7bdb8] bg-white">
              <div className="flex h-32 items-center justify-center bg-[#b90014] text-white">
                <span className="material-symbols-outlined text-[56px]">terminal</span>
              </div>

              <div className="p-6">
                <h2 className="text-[20px] font-semibold text-[#1a1c1c]">Job Summary</h2>
                <div className="mt-6 space-y-5">
                  <div className="flex items-start gap-4">
                    <Icon name="payments" />
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5d3f3c]">Salary Range</p>
                      <p className="text-[14px] font-semibold text-[#1a1c1c]">{job.salaryLabel}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Icon name="schedule" />
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5d3f3c]">Employment Type</p>
                      <p className="text-[14px] font-semibold text-[#1a1c1c]">{job.employmentType}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Icon name="groups" />
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5d3f3c]">Open Slots</p>
                      <p className="text-[14px] font-semibold text-[#1a1c1c]">{job.vacancyCount} positions</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Icon name="event" />
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5d3f3c]">Deadline</p>
                      <p className="text-[14px] font-semibold text-[#1a1c1c]">{formatDeadline(job.deadline)}</p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!eligibility.canApply || submitting}
                  className="mt-8 w-full bg-[#b90014] px-4 py-4 text-[16px] font-bold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={handleSubmit}
                >
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
                <button
                  type="button"
                  className="mt-4 w-full text-center text-[14px] font-semibold text-[#5f5e5e] transition-colors hover:text-[#1a1c1c]"
                  onClick={() => navigate(`/jobs/${jobId}`)}
                >
                  Cancel
                </button>
              </div>
            </section>

            <section className="flex items-start gap-4 border border-[#e2dfde] bg-[#cde5ff] p-5">
              <span className="material-symbols-outlined text-[#005f93]">info</span>
              <div>
                <p className="text-[14px] font-semibold text-[#001d32]">Need help?</p>
                <p className="mt-1 text-[12px] leading-5 text-[#004b74]">
                  {eligibility.guidanceMessage || "Our hiring team usually reviews applications within 3-5 business days."}
                </p>
              </div>
            </section>
          </div>
        </div>
      </section>

      {successResult ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm">
          <div className="w-full max-w-md border border-[#e2dfde] bg-white p-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
              <span className="material-symbols-outlined text-[40px]">check_circle</span>
            </div>
            <h2 className="mt-6 text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#1a1c1c]">
              Application Submitted!
            </h2>
            <p className="mt-4 text-[14px] leading-6 text-[#5d3f3c]">
              Your application for {job.title} has been sent successfully.
            </p>
            <div className="mt-8 space-y-3">
              <button
                type="button"
                className="w-full bg-[#1a1c1c] px-4 py-3 text-[14px] font-semibold text-white"
                onClick={() => navigate("/candidate/my-applications")}
              >
                View My Applications
              </button>
              <button
                type="button"
                className="w-full border border-[#1a1c1c] bg-white px-4 py-3 text-[14px] font-semibold text-[#1a1c1c]"
                onClick={() => navigate("/jobs")}
              >
                Browse More Jobs
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default ApplyJobScreen;
