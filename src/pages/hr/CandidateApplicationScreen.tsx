import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import AsyncActionButton from "../../common/components/AsyncActionButton";
import CommonSelect from "../../common/components/CommonSelect";
import CommonTable, { TableColumn } from "../../common/components/CommonTable";
import PageHeader from "../../common/components/PageHeader";
import { getDateLocale, useI18n } from "../../i18n";
import {
  applicationEmailSchema,
  validateWithSchema,
  type ValidationErrors,
} from "../../common/validation/formValidation";
import { usePermissions } from "../../hooks/usePermissions";
import {
  applicationStatusFilterOptions,
  formatApplicationStatus,
  getApplicationStatusBadgeClass,
  getDepartmentBadgeClass,
  normalizeApplicationStatusKey,
  type ApplicationStatusKey,
  type ApplicationStatusLabel,
} from "../../common/utils/applicationPresentation";
import { openProtectedFileInNewTab } from "../../common/utils/protectedFile";
import { PERMISSIONS } from "../../permissions/permissions";
import { ROLE_NAMES } from "../../permissions/rolePermissions";
import {
  hrService,
  type HrApplicationItemDto,
} from "../../services/hr/hrService";

type DateRange =
  | "Anytime"
  | "Last 7 Days"
  | "Last 30 Days"
  | "This Quarter"
  | "This Year";
type Department =
  | "allDepartments"
  | "Engineering"
  | "Data & Analytics"
  | "Marketing"
  | "Sales"
  | "Human Resources"
  | "Finance"
  | "Operations"
  | "Product";

type Application = {
  id: string;
  jobId: string;
  candidateFirstName: string;
  candidateLastName: string;
  candidateEmail: string;
  candidateAvatar: string;
  jobTitle: string;
  department: Department;
  appliedDate: string;
  appliedAt: number;
  status: ApplicationStatusLabel;
  statusKey: ApplicationStatusKey;
  recruiter: string;
  score: number | null;
};

type EmailTemplateType =
  | "interviewInvitation"
  | "jobOffer"
  | "rejectionMail"
  | "Custom";

type EmailComposerState = {
  application: Application;
  templateType: EmailTemplateType;
  subject: string;
  body: string;
};

const JOB_FILTER_ALL = "ALL_JOBS";

const departmentOptions: Department[] = [
  "allDepartments",
  "Engineering",
  "Data & Analytics",
  "Marketing",
  "Sales",
  "Human Resources",
  "Finance",
  "Operations",
  "Product",
];

const dateRanges: DateRange[] = [
  "Anytime",
  "Last 7 Days",
  "Last 30 Days",
  "This Quarter",
  "This Year",
];

function buildEmailDraft(
  t: (key: string, vars?: Record<string, string>) => string,
  application: Application,
  templateType: EmailTemplateType,
) {
  const candidateName =
    `${application.candidateFirstName} ${application.candidateLastName}`.trim();

  switch (templateType) {
    case "interviewInvitation":
      return {
        subject: t("candidateApplication.emailInterviewSubject", { jobTitle: application.jobTitle }),
        body: t("candidateApplication.emailInterviewBody", { candidateName, jobTitle: application.jobTitle }),
      };
    case "jobOffer":
      return {
        subject: t("candidateApplication.emailOfferSubject", { jobTitle: application.jobTitle }),
        body: t("candidateApplication.emailOfferBody", { candidateName, jobTitle: application.jobTitle }),
      };
    case "rejectionMail":
      return {
        subject: t("candidateApplication.emailRejectSubject", { jobTitle: application.jobTitle }),
        body: t("candidateApplication.emailRejectBody", { candidateName, jobTitle: application.jobTitle }),
      };
    default:
      return {
        subject: t("candidateApplication.emailCustomSubject", { jobTitle: application.jobTitle }),
        body: t("candidateApplication.emailCustomBody", { candidateName }),
      };
  }
}

function buildJobOptions(t: (key: string) => string, items: Application[]) {
  const unique = new Map<string, string>();

  items.forEach((item) => {
    if (!unique.has(item.jobId)) {
      unique.set(item.jobId, item.jobTitle);
    }
  });

  return [
    { label: t("candidateApplication.allJobs"), value: JOB_FILTER_ALL },
    ...Array.from(unique.entries())
      .map(([value, label]) => ({ label, value }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  ];
}

function buildApplicationTableColumns(
  t: (key: string) => string,
  onReviewApplication: (app: Application) => void,
  onOpenJobDetail: (app: Application) => void,
  onViewCV: (app: Application) => void,
  onOpenEmailComposer: (
    app: Application,
    templateType?: EmailTemplateType,
  ) => void,
  options: {
    canSendEmail: boolean;
    canViewCv: boolean;
    canReviewApplication: boolean;
  },
): TableColumn<Application>[] {
  return [
    {
      key: "candidate",
      header: t("candidateApplication.candidate"),
      renderCell: (app) => (
        <div className="flex items-center gap-4">
          <div>
            <p className="text-md font-bold text-[#1a1c1c]">
              {app.candidateFirstName} {app.candidateLastName}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "jobTitle",
      header: t("candidateApplication.jobTitle"),
      renderCell: (app) => (
        <a
          className="text-body-lg font-semibold text-[#b90014] transition-colors hover:text-[#e31b23] hover:underline"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            onOpenJobDetail(app);
          }}
        >
          {app.jobTitle}
        </a>
      ),
    },
    {
      key: "department",
      header: t("candidateApplication.department"),
      renderCell: (app) => (
        <span className={`badge ${getDepartmentBadgeClass(app.department)}`}>
          {app.department}
        </span>
      ),
    },
    {
      key: "score",
      header: t("candidateApplication.matchScore"),
      renderCell: (app) => (
        <p className="text-body-md font-semibold text-[#1a1c1c]">
          {app.score != null ? `${app.score.toFixed(1)}%` : "--"}
        </p>
      ),
    },
    {
      key: "recruiter",
      header: t("candidateApplication.recruiter"),
      renderCell: (app) => <p className="text-[#5f5e5e]">{app.recruiter}</p>,
    },
    {
      key: "appliedDate",
      header: t("candidateApplication.appliedDate"),
      renderCell: (app) => <p className=" text-[#5f5e5e]">{app.appliedDate}</p>,
    },
    {
      key: "status",
      header: t("common.status"),
      renderCell: (app) => (
        // Tone is derived from the canonical status key, never from the localized label
        // (INV-012). Passing the VI label would fall through to the rejected tone for every
        // non-rejected/withdrawn status.
        <span className={`badge ${getApplicationStatusBadgeClass(app.statusKey)}`}>
          {app.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: t("common.actions"),
      alignRight: true,
      headerClassName: "text-right",
      cellClassName: "whitespace-nowrap",
      renderCell: (app) => (
        <div className="flex flex-nowrap items-center justify-end gap-2 whitespace-nowrap">
          {options.canReviewApplication ? (
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] border border-[#ececec] bg-white text-[#5f5e5e] transition-colors hover:border-[#1a1c1c] hover:text-[#1a1c1c]"
              onClick={() => onReviewApplication(app)}
              title={t("candidateApplication.reviewApplication")}
            >
              <span className="material-symbols-outlined text-[20px]">
                rate_review
              </span>
            </button>
          ) : null}
          {options.canSendEmail ? (
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#e8242c] to-[#c50f1b] text-white shadow-sm transition-all hover:brightness-110 active:scale-95"
              onClick={() => onOpenEmailComposer(app, "interviewInvitation")}
              title={t("candidateApplication.composeEmail")}
            >
              <span className="material-symbols-outlined text-[20px]">mail</span>
            </button>
          ) : null}
        </div>
      ),
    },
  ];
}

function CandidateApplicationScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useI18n();
  const { hasPermission, primaryRole } = usePermissions();
  const canSendEmail = hasPermission(PERMISSIONS.APPLICATION_SEND_EMAIL);
  const canViewCv = hasPermission(PERMISSIONS.APPLICATION_VIEW_CV);
  const isManager = primaryRole === ROLE_NAMES.MANAGER;
  const filteredJobId = searchParams.get("jobId") ?? "";
  const filteredJobTitle = searchParams.get("jobTitle") ?? "";
  const [applications, setApplications] = useState<Application[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [jobFilter, setJobFilter] = useState<string>(
    filteredJobId || JOB_FILTER_ALL,
  );
  const [departmentFilter, setDepartmentFilter] =
    useState<Department>("allDepartments");
  const [statusFilter, setStatusFilter] = useState<"all" | ApplicationStatusKey>("all");
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange>("Anytime");
  const [page, setPage] = useState<number>(1);
  const [currentTime] = useState(() => Date.now());
  const [emailComposer, setEmailComposer] = useState<EmailComposerState | null>(
    null,
  );
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailComposerErrors, setEmailComposerErrors] = useState<ValidationErrors>({});
  const [emailComposerSubmitted, setEmailComposerSubmitted] = useState(false);

  useEffect(() => {
    let mounted = true;

    hrService
      .getApplications(filteredJobId ? { jobId: filteredJobId } : undefined)
      .then((res) => {
        if (!mounted) return;

        const items = Array.isArray(res.data) ? res.data : [];

        setApplications(
          items.map((item: HrApplicationItemDto) => ({
            id: item.id,
            jobId: item.job.id,
            candidateFirstName: item.candidate.firstName,
            candidateLastName: item.candidate.lastName,
            candidateEmail: item.candidate.email,
            candidateAvatar: item.candidate.avatarUrl,
            jobTitle: item.job.title,
            department: item.job.department as Department,
            appliedDate: item.appliedDate
              ? new Date(item.appliedDate).toLocaleDateString(getDateLocale())
              : "",
            appliedAt: item.appliedDate
              ? Date.parse(item.appliedDate)
              : Date.now(),
            status: formatApplicationStatus(item.status),
            statusKey: normalizeApplicationStatusKey(item.status),
            recruiter: item.recruiter,
            score: item.score,
          })),
        );
      })
      .catch(() => {
        if (mounted) setApplications([]);
      });

    return () => {
      mounted = false;
    };
  }, [filteredJobId]);

  const filtered = useMemo(() => {
    let result = applications;

    // Search filter
    if (searchTerm !== "") {
      const normalizedSearch = searchTerm.toLowerCase();
      result = result.filter(
        (a) =>
          `${a.candidateFirstName} ${a.candidateLastName}`
            .toLowerCase()
            .includes(normalizedSearch) ||
          a.candidateEmail.toLowerCase().includes(normalizedSearch) ||
          a.jobTitle.toLowerCase().includes(normalizedSearch) ||
          a.jobId.toLowerCase().includes(normalizedSearch) ||
          a.department.toLowerCase().includes(normalizedSearch) ||
          a.recruiter.toLowerCase().includes(normalizedSearch),
      );
    }

    if (jobFilter !== JOB_FILTER_ALL) {
      result = result.filter((a) => a.jobId === jobFilter);
    }

    // Department filter
    if (departmentFilter !== "allDepartments") {
      result = result.filter((a) => a.department === departmentFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((a) => a.statusKey === statusFilter);
    }

    // Date range filter
    if (dateRangeFilter !== "Anytime") {
      const now = currentTime;
      let cutoffDate = now;

      switch (dateRangeFilter) {
        case "Last 7 Days":
          cutoffDate = now - 7 * 24 * 60 * 60 * 1000;
          break;
        case "Last 30 Days":
          cutoffDate = now - 30 * 24 * 60 * 60 * 1000;
          break;
        case "This Quarter":
          cutoffDate = now - 90 * 24 * 60 * 60 * 1000;
          break;
        case "This Year":
          cutoffDate = now - 365 * 24 * 60 * 60 * 1000;
          break;
      }

      result = result.filter((a) => a.appliedAt >= cutoffDate);
    }

    return result.sort((a, b) => b.appliedAt - a.appliedAt);
  }, [
    applications,
    searchTerm,
    jobFilter,
    departmentFilter,
    statusFilter,
    dateRangeFilter,
    currentTime,
  ]);

  const pageSize = 5;
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);

  const pageSlice = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalItems);
  const jobOptions = useMemo(
    () => buildJobOptions(t, applications),
    [applications, t],
  );
  const dateRangeOptions = [
    { label: t("candidateApplication.anytime"), value: "Anytime" },
    { label: t("candidateApplication.last7Days"), value: "Last 7 Days" },
    { label: t("candidateApplication.last30Days"), value: "Last 30 Days" },
    { label: t("candidateApplication.thisQuarter"), value: "This Quarter" },
    { label: t("candidateApplication.thisYear"), value: "This Year" },
  ];
  const emailTemplateOptions = [
    { label: t("candidateApplication.interviewInvitation"), value: "interviewInvitation" },
    { label: t("candidateApplication.jobOffer"), value: "jobOffer" },
    { label: t("candidateApplication.rejectionMail"), value: "rejectionMail" },
    { label: t("candidateApplication.customEmail"), value: "Custom" },
  ];

  function resetToFirstPage() {
    setPage(1);
  }

  function viewCV(application: Application) {
    hrService
      .getApplicationCv(application.id)
      .then((res) => {
        const url = res.data?.fileUrl;
        if (url) {
          void openProtectedFileInNewTab(url).catch(() =>
            toast.error(t("candidateApplication.cvLoadFailed")),
          );
          return;
        }
        toast.info(t("candidateApplication.noCv"));
      })
      .catch(() => toast.error(t("candidateApplication.cvLoadFailed")));
  }

  function reviewApplication(application: Application) {
    navigate(
      isManager
        ? `/manager/applications/${application.id}`
        : `/hr/applications/${application.id}`,
    );
  }

  function openEmailComposer(
    application: Application,
    templateType: EmailTemplateType = "interviewInvitation",
  ) {
    const draft = buildEmailDraft(t, application, templateType);
    setEmailComposerSubmitted(false);
    setEmailComposerErrors({});
    setEmailComposer({
      application,
      templateType,
      subject: draft.subject,
      body: draft.body,
    });
  }

  function closeEmailComposer() {
    setEmailComposer(null);
    setEmailComposerSubmitted(false);
    setEmailComposerErrors({});
  }

  function updateEmailComposer(
    patch: Partial<
      Pick<EmailComposerState, "templateType" | "subject" | "body">
    >,
  ) {
    setEmailComposer((current) => {
      if (!current) return current;

      const nextTemplate = patch.templateType ?? current.templateType;
      const shouldRefreshDraft =
        patch.templateType && patch.templateType !== current.templateType;
      const nextDraft = shouldRefreshDraft
        ? buildEmailDraft(t, current.application, nextTemplate)
        : null;

      return {
        ...current,
        ...patch,
        subject: shouldRefreshDraft
          ? (nextDraft?.subject ?? current.subject)
          : (patch.subject ?? current.subject),
        body: shouldRefreshDraft
          ? (nextDraft?.body ?? current.body)
          : (patch.body ?? current.body),
      };
    });

    if (emailComposerSubmitted && emailComposer) {
      const nextSubject =
        patch.templateType && patch.templateType !== emailComposer.templateType
          ? buildEmailDraft(t, emailComposer.application, patch.templateType).subject
          : (patch.subject ?? emailComposer.subject);
      const nextBody =
        patch.templateType && patch.templateType !== emailComposer.templateType
          ? buildEmailDraft(t, emailComposer.application, patch.templateType).body
          : (patch.body ?? emailComposer.body);
      setEmailComposerErrors(
        validateWithSchema(applicationEmailSchema, {
          subject: nextSubject,
          body: nextBody,
        }),
      );
    }
  }

  async function submitEmailComposer() {
    if (!emailComposer) return;
    setEmailComposerSubmitted(true);
    const nextErrors = validateWithSchema(applicationEmailSchema, {
      subject: emailComposer.subject,
      body: emailComposer.body,
    });
    setEmailComposerErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSendingEmail(true);

    try {
      await hrService.sendApplicationEmail(emailComposer.application.id, {
        templateType: emailComposer.templateType,
        subject: emailComposer.subject.trim(),
        body: emailComposer.body.trim(),
      });

      toast.success(
        t("candidateApplication.emailSent", { candidateName: `${emailComposer.application.candidateFirstName} ${emailComposer.application.candidateLastName}` }),
      );
      closeEmailComposer();
    } catch {
      toast.error(t("candidateApplication.emailSendFailed"));
    } finally {
      setSendingEmail(false);
    }
  }

  function goToPage(next: number) {
    const safe = Math.max(1, Math.min(totalPages, next));
    setPage(safe);
  }

  function openJobDetail(application: Application) {
    navigate(`/jobs/${application.jobId}`);
  }

  return (
    <div className="app-container animate-fade-in flex-grow py-8">
      {/* Page Header */}
      <PageHeader
        eyebrow={t("candidateApplication.eyebrow")}
        icon="contact_page"
        title={
          filteredJobTitle
            ? t("candidateApplication.filteredTitle", { jobTitle: filteredJobTitle })
            : t("candidateApplication.title")
        }
        subtitle={
          filteredJobTitle
            ? t("candidateApplication.filteredSubtitle")
            : t("candidateApplication.subtitle")
        }
        className="mb-7"
      />

      {/* Filters Area */}
      <div className="card mb-4 flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-xs">
          <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-[#a8a4a2]">
            search
          </span>
          <input
            className="input-field pl-10"
            placeholder={t("candidateApplication.searchPlaceholder")}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              resetToFirstPage();
            }}
          />
        </div>

        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-1 lg:flex-row lg:items-center">
          <CommonSelect
            className="h-[42px] text-sm"
            wrapperClassName="w-full lg:flex-1 lg:min-w-[160px]"
            options={jobOptions}
            value={jobFilter}
            onChange={(event) => {
              setJobFilter(event.target.value);
              resetToFirstPage();
            }}
          />
          <CommonSelect
            className="h-[42px] text-sm"
            wrapperClassName="w-full lg:flex-1 lg:min-w-[150px]"
            options={departmentOptions.map((department) => ({
              label: department,
              label: department === "allDepartments" ? t("candidateApplication.allDepartments") : department,
              value: department,
            }))}
            value={departmentFilter}
            onChange={(event) => {
              setDepartmentFilter(event.target.value as Department);
              resetToFirstPage();
            }}
          />
          <CommonSelect
            className="h-[42px] text-sm"
            wrapperClassName="w-full lg:flex-1 lg:min-w-[150px]"
            options={applicationStatusFilterOptions}
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as "all" | ApplicationStatusKey);
              resetToFirstPage();
            }}
          />
          <CommonSelect
            className="h-[42px] text-sm"
            wrapperClassName="w-full lg:flex-1 lg:min-w-[150px]"
            options={dateRangeOptions}
            value={dateRangeFilter}
            onChange={(event) => {
              setDateRangeFilter(event.target.value as DateRange);
              resetToFirstPage();
            }}
          />
        </div>
      </div>

      {/* Data Table with Pagination */}
      <CommonTable
        columns={buildApplicationTableColumns(
          t,
          reviewApplication,
          openJobDetail,
          viewCV,
          openEmailComposer,
          {
            canSendEmail,
            canViewCv,
            canReviewApplication: true,
          },
        )}
        data={pageSlice}
        keyExtractor={(item) => item.id}
        loading={false}
        emptyMessage={t("common.noData")}
        emptyIcon="person_search"
        hover
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

      {emailComposer ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#1a1c1c]/45 px-4 py-8 backdrop-blur-sm">
          <div className="animate-scale-in w-full max-w-3xl overflow-hidden rounded-[18px] border border-[#ececec] bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#f0eceb] px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#fff1f0] to-[#ffdad6] text-[#b90014] sm:flex">
                  <span className="material-symbols-outlined">mail</span>
                </div>
                <div>
                  <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-[#1a1c1c]">
                    {t("candidateApplication.composeEmail")}
                  </h2>
                  <p className="mt-1 text-sm text-[#5f5e5e]">
                    {emailComposer.application.candidateFirstName}{" "}
                    {emailComposer.application.candidateLastName} ·{" "}
                    {emailComposer.application.jobTitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#5f5e5e] transition-colors hover:bg-[#f7f6f5] hover:text-[#1a1c1c]"
                onClick={closeEmailComposer}
                title={t("common.close")}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid gap-5 px-6 py-6">
              <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
                <div>
                  <label className="field-label">{t("candidateApplication.emailType")}</label>
                  <CommonSelect
                    className="h-[42px] text-sm"
                    options={emailTemplateOptions}
                    value={emailComposer.templateType}
                    onChange={(event) =>
                      updateEmailComposer({
                        templateType: event.target.value as EmailTemplateType,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="field-label">{t("candidateApplication.emailSubject")}</label>
                  <input
                    className={`input-field ${emailComposerErrors.subject ? "border-[#ba1a1a]" : ""}`}
                    value={emailComposer.subject}
                    onChange={(event) =>
                      updateEmailComposer({ subject: event.target.value })
                    }
                    placeholder={t("candidateApplication.emailSubjectPlaceholder")}
                  />
                  {emailComposerErrors.subject ? (
                    <p className="mt-1.5 text-[12px] text-[#ba1a1a]">{emailComposerErrors.subject}</p>
                  ) : null}
                </div>
              </div>

              <div>
                <label className="field-label">{t("candidateApplication.emailRecipient")}</label>
                <div className="rounded-[10px] border border-[#ececec] bg-[#f7f6f5] px-4 py-3 text-sm text-[#1a1c1c]">
                  {emailComposer.application.candidateEmail}
                </div>
              </div>

              <div>
                <label className="field-label">{t("candidateApplication.emailBody")}</label>
                <textarea
                  className={`input-field min-h-[260px] leading-6 ${emailComposerErrors.body ? "border-[#ba1a1a]" : ""}`}
                  value={emailComposer.body}
                  onChange={(event) =>
                    updateEmailComposer({ body: event.target.value })
                  }
                  placeholder={t("candidateApplication.emailBodyPlaceholder")}
                />
                {emailComposerErrors.body ? (
                  <p className="mt-1.5 text-[12px] text-[#ba1a1a]">{emailComposerErrors.body}</p>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#f0eceb] px-6 py-5">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeEmailComposer}
                disabled={sendingEmail}
              >
                {t("common.cancel")}
              </button>
              <AsyncActionButton
                type="button"
                className="btn btn-primary disabled:opacity-60"
                onClick={submitEmailComposer}
                disabled={sendingEmail}
                loading={sendingEmail}
                loadingText={t("candidateApplication.sendingEmail")}
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
                {t("candidateApplication.sendEmail")}
              </AsyncActionButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default CandidateApplicationScreen;
