import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import AsyncActionButton from "../../common/components/AsyncActionButton";
import CommonSelect from "../../common/components/CommonSelect";
import CommonTable, { TableColumn } from "../../common/components/CommonTable";
import { usePermissions } from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../permissions/permissions";
import { ROLE_NAMES } from "../../permissions/rolePermissions";
import { hrService } from "../../services/hr/hrService";

type ApplicationStatus =
  | "New"
  | "Under Review"
  | "Interviewing"
  | "Final Review"
  | "Offered"
  | "Accepted"
  | "Rejected";
type DateRange =
  | "Anytime"
  | "Last 7 Days"
  | "Last 30 Days"
  | "This Quarter"
  | "This Year";
type Department =
  | "All Departments"
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
  status: ApplicationStatus;
  recruiter: string;
  score: number | null;
};

type EmailTemplateType =
  | "Interview Invitation"
  | "Job Offer"
  | "Rejection Mail"
  | "Custom";

type EmailComposerState = {
  application: Application;
  templateType: EmailTemplateType;
  subject: string;
  body: string;
};

const applicationStatuses: ApplicationStatus[] = [
  "New",
  "Under Review",
  "Interviewing",
  "Final Review",
  "Offered",
  "Accepted",
  "Rejected",
];
const departments: Department[] = [
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

const emailTemplateOptions: Array<{
  label: EmailTemplateType;
  value: EmailTemplateType;
}> = [
  { label: "Interview Invitation", value: "Interview Invitation" },
  { label: "Job Offer", value: "Job Offer" },
  { label: "Rejection Mail", value: "Rejection Mail" },
  { label: "Custom", value: "Custom" },
];

const statusOptions: ("All Statuses" | ApplicationStatus)[] = [
  "All Statuses",
  "New",
  "Under Review",
  "Interviewing",
  "Final Review",
  "Offered",
  "Accepted",
  "Rejected",
];

const departmentOptions: Department[] = [
  "All Departments",
  "Engineering",
  "Data & Analytics",
  "Marketing",
  "Sales",
  "Human Resources",
  "Finance",
  "Operations",
  "Product",
];

function parseDateLabelToEpoch(label: string) {
  const parsed = Date.parse(label);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function normalizeApplicationStatus(status: string): ApplicationStatus {
  switch (status.trim().toLowerCase()) {
    case "reviewing":
    case "under review":
      return "Under Review";
    case "interviewing":
      return "Interviewing";
    case "managerreview":
    case "manager_review":
    case "final review":
      return "Final Review";
    case "offered":
      return "Offered";
    case "accepted":
      return "Accepted";
    case "rejected":
      return "Rejected";
    default:
      return "New";
  }
}

function statusBadgeColors(status: ApplicationStatus) {
  switch (status) {
    case "New":
      return "bg-primary/10 text-primary border-primary/20";
    case "Under Review":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "Interviewing":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Final Review":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Offered":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "Accepted":
      return "bg-green-100 text-green-700 border-green-200";
    case "Rejected":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function buildEmailDraft(
  application: Application,
  templateType: EmailTemplateType,
) {
  const candidateName =
    `${application.candidateFirstName} ${application.candidateLastName}`.trim();

  switch (templateType) {
    case "Interview Invitation":
      return {
        subject: `Interview Invitation - ${application.jobTitle}`,
        body: `Hi ${candidateName},\n\nWe would like to invite you to the next interview round for the ${application.jobTitle} position.\n\nPlease reply to this email so we can confirm the schedule.\n\nBest regards,\nRecruitPro HR Team`,
      };
    case "Job Offer":
      return {
        subject: `Job Offer - ${application.jobTitle}`,
        body: `Hi ${candidateName},\n\nWe are pleased to move forward with your application for the ${application.jobTitle} position.\n\nPlease review the offer details and let us know if you have any questions.\n\nBest regards,\nRecruitPro HR Team`,
      };
    case "Rejection Mail":
      return {
        subject: `Application Update - ${application.jobTitle}`,
        body: `Hi ${candidateName},\n\nThank you for your interest in the ${application.jobTitle} position.\n\nAfter careful consideration, we will not be moving forward with your application at this time.\n\nWe appreciate your time and wish you the best.\n\nBest regards,\nRecruitPro HR Team`,
      };
    default:
      return {
        subject: `${application.jobTitle} - Application Update`,
        body: `Hi ${candidateName},\n\n\n\nBest regards,\nRecruitPro HR Team`,
      };
  }
}

function departmentBadgeColors(dept: Department) {
  switch (dept) {
    case "Engineering":
      return "bg-[#005f93]/10 text-[#005f93]";
    case "Marketing":
      return "bg-secondary-container/50 text-secondary";
    case "Sales":
      return "bg-green-100 text-green-700";
    case "Human Resources":
      return "bg-purple-100 text-purple-700";
    case "Operations":
      return "bg-indigo-100 text-indigo-700";
    case "Product":
      return "bg-indigo-100 text-indigo-700";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function buildJobOptions(items: Application[]) {
  const unique = new Map<string, string>();

  items.forEach((item) => {
    if (!unique.has(item.jobId)) {
      unique.set(item.jobId, item.jobTitle);
    }
  });

  return [
    { label: "All Jobs", value: "All Jobs" },
    ...Array.from(unique.entries())
      .map(([value, label]) => ({ label, value }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  ];
}

function buildApplicationTableColumns(
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
      header: "Candidate",
      renderCell: (app) => (
        <div className="flex items-center gap-4">
          <div>
            <p className="text-lg font-bold text-[#1a1c1c]">
              {app.candidateFirstName} {app.candidateLastName}
            </p>
            <p className="text-sm text-[#5f5e5e]">{app.candidateEmail}</p>
          </div>
        </div>
      ),
    },
    {
      key: "jobTitle",
      header: "Job Title",
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
      header: "Department",
      renderCell: (app) => (
        <span
          className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${departmentBadgeColors(app.department)}`}
        >
          {app.department}
        </span>
      ),
    },
    {
      key: "score",
      header: "Match Score",
      renderCell: (app) => (
        <p className="text-body-lg font-semibold text-[#1a1c1c]">
          {app.score != null ? `${app.score.toFixed(1)}%` : "--"}
        </p>
      ),
    },
    {
      key: "recruiter",
      header: "Recruiter",
      renderCell: (app) => (
        <p className="text-body-lg text-[#5f5e5e]">{app.recruiter}</p>
      ),
    },
    {
      key: "appliedDate",
      header: "Applied Date",
      renderCell: (app) => (
        <p className="text-body-lg text-[#5f5e5e]">{app.appliedDate}</p>
      ),
    },
    {
      key: "status",
      header: "Status",
      renderCell: (app) => (
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-black uppercase border ${statusBadgeColors(app.status)}`}
        >
          {app.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      alignRight: true,
      headerClassName: "text-right",
      cellClassName: "whitespace-nowrap",
      renderCell: (app) => (
        <div className="flex flex-nowrap items-center justify-end gap-2 whitespace-nowrap">
          {options.canReviewApplication ? (
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#1a1c1c] bg-white text-[#1a1c1c] transition-colors hover:bg-[#f3f3f3]"
              onClick={() => onReviewApplication(app)}
              title="Review application"
            >
              <span className="material-symbols-outlined text-[20px]">
                rate_review
              </span>
            </button>
          ) : null}
          {options.canSendEmail ? (
            <div className="group relative shrink-0">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#e31b23] text-white transition-all hover:bg-[#b90014]"
                onClick={() => onOpenEmailComposer(app, "Interview Invitation")}
                title="Compose email"
              >
                <span className="material-symbols-outlined text-[20px]">
                  mail
                </span>
              </button>
            </div>
          ) : null}
          {options.canViewCv ? (
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#8a1538] text-white shadow-md shadow-[#b90014]/10 transition-all hover:bg-[#70112d]"
              onClick={() => onViewCV(app)}
              title="View CV"
            >
              <span className="material-symbols-outlined text-[20px]">
                description
              </span>
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
  const { hasPermission, primaryRole } = usePermissions();
  const canSendEmail = hasPermission(PERMISSIONS.APPLICATION_SEND_EMAIL);
  const canViewCv = hasPermission(PERMISSIONS.APPLICATION_VIEW_CV);
  const isManager = primaryRole === ROLE_NAMES.MANAGER;
  const filteredJobId = searchParams.get("jobId") ?? "";
  const filteredJobTitle = searchParams.get("jobTitle") ?? "";

  useEffect(() => {
    let mounted = true;

    hrService
      .getApplications(filteredJobId ? { jobId: filteredJobId } : undefined)
      .then((res) => {
        if (!mounted) return;

        const items = Array.isArray(res.data) ? res.data : [];

        setApplications(
          items.map((item: any) => ({
            id: item.id,
            jobId: item.job.id,
            candidateFirstName: item.candidate.firstName,
            candidateLastName: item.candidate.lastName,
            candidateEmail: item.candidate.email,
            candidateAvatar: item.candidate.avatarUrl,
            jobTitle: item.job.title,
            department: item.job.department,
            appliedDate: item.appliedDate
              ? new Date(item.appliedDate).toLocaleDateString()
              : "",
            appliedAt: item.appliedDate
              ? Date.parse(item.appliedDate)
              : Date.now(),
            status: normalizeApplicationStatus(item.status),
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

  const [applications, setApplications] = useState<Application[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [jobFilter, setJobFilter] = useState<string>(filteredJobId || "All Jobs");
  const [departmentFilter, setDepartmentFilter] =
    useState<Department>("All Departments");
  const [statusFilter, setStatusFilter] = useState<string>("All Statuses");
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange>("Anytime");
  const [page, setPage] = useState<number>(1);
  const [currentTime] = useState(() => Date.now());
  const [emailComposer, setEmailComposer] = useState<EmailComposerState | null>(
    null,
  );
  const [sendingEmail, setSendingEmail] = useState(false);

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

    if (jobFilter !== "All Jobs") {
      result = result.filter((a) => a.jobId === jobFilter);
    }

    // Department filter
    if (departmentFilter !== "All Departments") {
      result = result.filter((a) => a.department === departmentFilter);
    }

    // Status filter
    if (statusFilter !== "All Statuses") {
      result = result.filter((a) => a.status === statusFilter);
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
  const jobOptions = useMemo(() => buildJobOptions(applications), [applications]);

  function resetToFirstPage() {
    setPage(1);
  }

  function viewCV(application: Application) {
    hrService
      .getApplicationCv(application.id)
      .then((res) => {
        const url = res.data?.fileUrl;
        if (url) {
          window.open(url, "_blank", "noopener,noreferrer");
          return;
        }
        toast.info("CV not available");
      })
      .catch(() => toast.error("Unable to load CV"));
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
    templateType: EmailTemplateType = "Interview Invitation",
  ) {
    const draft = buildEmailDraft(application, templateType);
    setEmailComposer({
      application,
      templateType,
      subject: draft.subject,
      body: draft.body,
    });
  }

  function closeEmailComposer() {
    setEmailComposer(null);
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
        ? buildEmailDraft(current.application, nextTemplate)
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
  }

  async function submitEmailComposer() {
    if (!emailComposer) return;

    setSendingEmail(true);

    try {
      await hrService.sendApplicationEmail(emailComposer.application.id, {
        templateType: emailComposer.templateType,
        subject: emailComposer.subject.trim(),
        body: emailComposer.body.trim(),
      });

      toast.success(
        `Email sent to ${emailComposer.application.candidateFirstName} ${emailComposer.application.candidateLastName}`,
      );
      closeEmailComposer();
    } catch {
      toast.error("Unable to send email");
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
    <div className="w-full flex-grow px-4 py-10 md:px-10">
      {/* Page Header */}
      <div className="mb-12">
        <h1 className="mb-2 text-[40px] font-bold leading-tight text-[#1a1c1c]">
          {filteredJobTitle
            ? `Hồ sơ ứng tuyển - ${filteredJobTitle}`
            : "Danh sách hồ sơ ứng tuyển"}
        </h1>
        <p className="text-xl text-[#5f5e5e]">
          {filteredJobTitle
            ? "Theo dõi các hồ sơ ứng tuyển cho job đang chọn."
            : "Theo dõi và xử lý hồ sơ ứng tuyển trên toàn bộ phòng ban."}
        </p>
      </div>

      {/* Filters Area */}
      <div className="mb-10 rounded-xl border border-[#e7bdb8] bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end">
          <div className="w-full space-y-2 xl:flex-1">
            <label className="text-xs font-bold uppercase tracking-[0.1em] text-[#5f5e5e]">
              Tìm kiếm
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#5f5e5e]">
                search
              </span>
              <input
                className="w-full rounded-lg border border-[#e7bdb8] py-3 pl-10 pr-4 text-body-md outline-none transition-all focus:border-[#b90014] focus:ring-2 focus:ring-[#b90014]/10"
                placeholder="Tìm ứng viên, tiêu đề job, mã job hoặc recruiter..."
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  resetToFirstPage();
                }}
              />
            </div>
          </div>

          <div className="w-full space-y-2 xl:w-64">
            <label className="text-xs font-bold uppercase tracking-[0.1em] text-[#5f5e5e]">
              Job
            </label>
            <CommonSelect
              className="h-[52px] text-body-md"
              options={jobOptions}
              value={jobFilter}
              onChange={(event) => {
                setJobFilter(event.target.value);
                resetToFirstPage();
              }}
            />
          </div>

          <div className="w-full space-y-2 xl:w-64">
            <label className="text-xs font-bold uppercase tracking-[0.1em] text-[#5f5e5e]">
              Phòng ban
            </label>
            <CommonSelect
              className="h-[52px] text-body-md"
              options={departmentOptions.map((department) => ({
                label: department,
                value: department,
              }))}
              value={departmentFilter}
              onChange={(event) => {
                setDepartmentFilter(event.target.value as Department);
                resetToFirstPage();
              }}
            />
          </div>

          <div className="w-full space-y-2 xl:w-64">
            <label className="text-xs font-bold uppercase tracking-[0.1em] text-[#5f5e5e]">
              Trạng thái
            </label>
            <CommonSelect
              className="h-[52px] text-body-md"
              options={statusOptions.map((status) => ({
                label: status,
                value: status,
              }))}
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                resetToFirstPage();
              }}
            />
          </div>

          <div className="w-full space-y-2 xl:w-64">
            <label className="text-xs font-bold uppercase tracking-[0.1em] text-[#5f5e5e]">
              Khoảng thời gian
            </label>
            <CommonSelect
              className="h-[52px] text-body-md"
              options={dateRanges.map((range) => ({
                label: range,
                value: range,
              }))}
              value={dateRangeFilter}
              onChange={(event) => {
                setDateRangeFilter(event.target.value as DateRange);
                resetToFirstPage();
              }}
            />
          </div>
        </div>
      </div>

      {/* Data Table with Pagination */}
      <CommonTable
        columns={buildApplicationTableColumns(
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
        emptyMessage="Không có dữ liệu"
        zebra
        hover
        tableWrapperClassName="border border-[#e7bdb8] bg-white rounded-xl overflow-hidden shadow-sm"
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
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4 py-8">
          <div className="w-full max-w-3xl rounded-2xl border border-[#e7bdb8] bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#e7bdb8] px-6 py-5">
              <div>
                <h2 className="text-[24px] font-bold text-[#1a1c1c]">
                  Soạn email
                </h2>
                <p className="mt-1 text-sm text-[#5f5e5e]">
                  {emailComposer.application.candidateFirstName}{" "}
                  {emailComposer.application.candidateLastName} ·{" "}
                  {emailComposer.application.jobTitle}
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#5f5e5e] hover:bg-[#f3f3f3] hover:text-[#1a1c1c]"
                onClick={closeEmailComposer}
                title="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid gap-5 px-6 py-6">
              <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.1em] text-[#5f5e5e]">
                    Loại email
                  </label>
                  <CommonSelect
                    className="h-12 text-sm"
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
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.1em] text-[#5f5e5e]">
                    Tiêu đề
                  </label>
                  <input
                    className="h-12 w-full rounded-lg border border-[#e7bdb8] px-4 text-sm outline-none transition-all focus:border-[#b90014] focus:ring-2 focus:ring-[#b90014]/10"
                    value={emailComposer.subject}
                    onChange={(event) =>
                      updateEmailComposer({ subject: event.target.value })
                    }
                    placeholder="Nhập tiêu đề email"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.1em] text-[#5f5e5e]">
                  Người nhận
                </label>
                <div className="rounded-lg border border-[#e7bdb8] bg-[#f9f9f9] px-4 py-3 text-sm text-[#1a1c1c]">
                  {emailComposer.application.candidateEmail}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.1em] text-[#5f5e5e]">
                  Nội dung
                </label>
                <textarea
                  className="min-h-[260px] w-full rounded-lg border border-[#e7bdb8] px-4 py-3 text-sm leading-6 outline-none transition-all focus:border-[#b90014] focus:ring-2 focus:ring-[#b90014]/10"
                  value={emailComposer.body}
                  onChange={(event) =>
                    updateEmailComposer({ body: event.target.value })
                  }
                  placeholder="Nhập nội dung email..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#e7bdb8] px-6 py-5">
              <button
                type="button"
                className="rounded-lg border border-[#1a1c1c] bg-white px-5 py-3 text-sm font-semibold text-[#1a1c1c] hover:bg-[#f3f3f3]"
                onClick={closeEmailComposer}
                disabled={sendingEmail}
              >
                Hủy
              </button>
              <AsyncActionButton
                type="button"
                className="rounded-lg bg-[#b90014] px-5 py-3 text-sm font-semibold text-white hover:bg-[#93000d] disabled:opacity-60"
                onClick={submitEmailComposer}
                disabled={
                  sendingEmail ||
                  !emailComposer.subject.trim() ||
                  !emailComposer.body.trim()
                }
                loading={sendingEmail}
                loadingText="Đang gửi email..."
              >
                Gửi email
              </AsyncActionButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default CandidateApplicationScreen;
