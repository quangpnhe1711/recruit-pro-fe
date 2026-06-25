import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import AsyncActionButton from "../../common/components/AsyncActionButton";
import CommonSelect from "../../common/components/CommonSelect";
import CommonTable, { TableColumn } from "../../common/components/CommonTable";
import PageHeader from "../../common/components/PageHeader";
import { usePermissions } from "../../hooks/usePermissions";
import {
  applicationStatusOptions,
  formatApplicationStatus,
  getApplicationStatusBadgeClass,
  getDepartmentBadgeClass,
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
  | "Tất cả phòng ban"
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

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  Anytime: "Mọi thời gian",
  "Last 7 Days": "7 ngày gần đây",
  "Last 30 Days": "30 ngày gần đây",
  "This Quarter": "Quý này",
  "This Year": "Năm nay",
};

const EMAIL_TEMPLATE_LABELS: Record<EmailTemplateType, string> = {
  "Interview Invitation": "Thư mời phỏng vấn",
  "Job Offer": "Thư mời nhận việc",
  "Rejection Mail": "Thư từ chối",
  Custom: "Tùy chỉnh",
};

const JOB_FILTER_ALL = "ALL_JOBS";
const STATUS_FILTER_ALL = "ALL_STATUSES";

const emailTemplateOptions: Array<{
  label: string;
  value: EmailTemplateType;
}> = [
  {
    label: EMAIL_TEMPLATE_LABELS["Interview Invitation"],
    value: "Interview Invitation",
  },
  { label: EMAIL_TEMPLATE_LABELS["Job Offer"], value: "Job Offer" },
  { label: EMAIL_TEMPLATE_LABELS["Rejection Mail"], value: "Rejection Mail" },
  { label: EMAIL_TEMPLATE_LABELS.Custom, value: "Custom" },
];

const statusOptions: ("Tất cả trạng thái" | ApplicationStatusLabel)[] = [
  "Tất cả trạng thái",
  ...applicationStatusOptions,
];

const departmentOptions: Department[] = [
  "Tất cả phòng ban",
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
  application: Application,
  templateType: EmailTemplateType,
) {
  const candidateName =
    `${application.candidateFirstName} ${application.candidateLastName}`.trim();

  switch (templateType) {
    case "Interview Invitation":
      return {
        subject: `Thư mời phỏng vấn - ${application.jobTitle}`,
        body: `Chào ${candidateName},\n\nRecruitPro muốn mời bạn tham gia vòng phỏng vấn tiếp theo cho vị trí ${application.jobTitle}.\n\nBạn vui lòng phản hồi email này để chúng tôi xác nhận lịch phù hợp.\n\nTrân trọng,\nĐội ngũ HR RecruitPro`,
      };
    case "Job Offer":
      return {
        subject: `Thư mời nhận việc - ${application.jobTitle}`,
        body: `Chào ${candidateName},\n\nRecruitPro rất vui được gửi đến bạn đề nghị nhận việc cho vị trí ${application.jobTitle}.\n\nBạn vui lòng xem thông tin offer và phản hồi nếu cần trao đổi thêm.\n\nTrân trọng,\nĐội ngũ HR RecruitPro`,
      };
    case "Rejection Mail":
      return {
        subject: `Cập nhật hồ sơ ứng tuyển - ${application.jobTitle}`,
        body: `Chào ${candidateName},\n\nCảm ơn bạn đã quan tâm đến vị trí ${application.jobTitle}.\n\nSau khi xem xét, RecruitPro rất tiếc chưa thể tiếp tục với hồ sơ của bạn ở thời điểm này.\n\nChúc bạn nhiều thành công trong hành trình sắp tới.\n\nTrân trọng,\nĐội ngũ HR RecruitPro`,
      };
    default:
      return {
        subject: `${application.jobTitle} - Cập nhật hồ sơ`,
        body: `Chào ${candidateName},\n\n\n\nTrân trọng,\nĐội ngũ HR RecruitPro`,
      };
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
    { label: "Tất cả công việc", value: JOB_FILTER_ALL },
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
      header: "Ứng viên",
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
      header: "Vị trí tuyển dụng",
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
      header: "Phòng ban",
      renderCell: (app) => (
        <span className={`badge ${getDepartmentBadgeClass(app.department)}`}>
          {app.department}
        </span>
      ),
    },
    {
      key: "score",
      header: "Điểm phù hợp",
      renderCell: (app) => (
        <p className="text-body-md font-semibold text-[#1a1c1c]">
          {app.score != null ? `${app.score.toFixed(1)}%` : "--"}
        </p>
      ),
    },
    {
      key: "recruiter",
      header: "Người phụ trách",
      renderCell: (app) => <p className="text-[#5f5e5e]">{app.recruiter}</p>,
    },
    {
      key: "appliedDate",
      header: "Ngày ứng tuyển",
      renderCell: (app) => <p className=" text-[#5f5e5e]">{app.appliedDate}</p>,
    },
    {
      key: "status",
      header: "Trạng thái",
      renderCell: (app) => (
        <span className={`badge ${getApplicationStatusBadgeClass(app.status)}`}>
          {app.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Thao tác",
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
              title="Đánh giá hồ sơ"
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
              onClick={() => onOpenEmailComposer(app, "Interview Invitation")}
              title="Soạn email"
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
    useState<Department>("Tất cả phòng ban");
  const [statusFilter, setStatusFilter] = useState<string>(STATUS_FILTER_ALL);
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange>("Anytime");
  const [page, setPage] = useState<number>(1);
  const [currentTime] = useState(() => Date.now());
  const [emailComposer, setEmailComposer] = useState<EmailComposerState | null>(
    null,
  );
  const [sendingEmail, setSendingEmail] = useState(false);

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
              ? new Date(item.appliedDate).toLocaleDateString()
              : "",
            appliedAt: item.appliedDate
              ? Date.parse(item.appliedDate)
              : Date.now(),
            status: formatApplicationStatus(item.status),
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
    if (departmentFilter !== "Tất cả phòng ban") {
      result = result.filter((a) => a.department === departmentFilter);
    }

    // Status filter
    if (statusFilter !== STATUS_FILTER_ALL) {
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
  const jobOptions = useMemo(
    () => buildJobOptions(applications),
    [applications],
  );

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
            toast.error("Không thể tải CV"),
          );
          return;
        }
        toast.info("Ứng viên chưa có CV.");
      })
      .catch(() => toast.error("Không thể tải CV"));
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
        `Đã gửi email cho ${emailComposer.application.candidateFirstName} ${emailComposer.application.candidateLastName}`,
      );
      closeEmailComposer();
    } catch {
      toast.error("Không thể gửi email");
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
        eyebrow="Tuyển dụng"
        icon="contact_page"
        title={
          filteredJobTitle
            ? `Hồ sơ ứng tuyển - ${filteredJobTitle}`
            : "Danh sách hồ sơ ứng tuyển"
        }
        subtitle={
          filteredJobTitle
            ? "Theo dõi các hồ sơ ứng tuyển cho job đang chọn."
            : "Theo dõi và xử lý hồ sơ ứng tuyển trên toàn bộ phòng ban."
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
            placeholder="Tìm ứng viên, tiêu đề job, mã job hoặc người phụ trách..."
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
            options={statusOptions.map((status) => ({
              label: status,
              value:
                status === "Tất cả trạng thái" ? STATUS_FILTER_ALL : status,
            }))}
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              resetToFirstPage();
            }}
          />
          <CommonSelect
            className="h-[42px] text-sm"
            wrapperClassName="w-full lg:flex-1 lg:min-w-[150px]"
            options={dateRanges.map((range) => ({
              label: DATE_RANGE_LABELS[range],
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
                    Soạn email
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
                title="Đóng"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid gap-5 px-6 py-6">
              <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
                <div>
                  <label className="field-label">Loại email</label>
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
                  <label className="field-label">Tiêu đề</label>
                  <input
                    className="input-field"
                    value={emailComposer.subject}
                    onChange={(event) =>
                      updateEmailComposer({ subject: event.target.value })
                    }
                    placeholder="Nhập tiêu đề email"
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Người nhận</label>
                <div className="rounded-[10px] border border-[#ececec] bg-[#f7f6f5] px-4 py-3 text-sm text-[#1a1c1c]">
                  {emailComposer.application.candidateEmail}
                </div>
              </div>

              <div>
                <label className="field-label">Nội dung</label>
                <textarea
                  className="input-field min-h-[260px] leading-6"
                  value={emailComposer.body}
                  onChange={(event) =>
                    updateEmailComposer({ body: event.target.value })
                  }
                  placeholder="Nhập nội dung email..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#f0eceb] px-6 py-5">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeEmailComposer}
                disabled={sendingEmail}
              >
                Hủy
              </button>
              <AsyncActionButton
                type="button"
                className="btn btn-primary disabled:opacity-60"
                onClick={submitEmailComposer}
                disabled={
                  sendingEmail ||
                  !emailComposer.subject.trim() ||
                  !emailComposer.body.trim()
                }
                loading={sendingEmail}
                loadingText="Đang gửi email..."
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
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
