import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import CommonTable, { TableColumn } from "../../common/components/CommonTable";
import { setVariant } from "../../store/slices/authSlice";
import { hrService } from "../../services/hr/hrService";

type ApplicationStatus = "New" | "Under Review" | "Interviewing" | "Rejected";
type DateRange =
  | "Anytime"
  | "Last 7 Days"
  | "Last 30 Days"
  | "This Quarter"
  | "This Year";
type Department =
  | "All Departments"
  | "Engineering"
  | "Marketing"
  | "Sales"
  | "HR"
  | "Design";

type Application = {
  id: string;
  candidateFirstName: string;
  candidateLastName: string;
  candidateEmail: string;
  candidateAvatar: string;
  jobTitle: string;
  department: Department;
  appliedDate: string;
  appliedAt: number;
  status: ApplicationStatus;
};

const applicationStatuses: ApplicationStatus[] = [
  "New",
  "Under Review",
  "Interviewing",
  "Rejected",
];
const departments: Department[] = [
  "Engineering",
  "Marketing",
  "Sales",
  "HR",
  "Design",
];
const dateRanges: DateRange[] = [
  "Anytime",
  "Last 7 Days",
  "Last 30 Days",
  "This Quarter",
  "This Year",
];

const statusOptions: ("All Statuses" | ApplicationStatus)[] = [
  "All Statuses",
  "New",
  "Under Review",
  "Interviewing",
  "Rejected",
];

const departmentOptions: Department[] = [
  "All Departments",
  "Engineering",
  "Marketing",
  "Sales",
  "HR",
  "Design",
];

function parseDateLabelToEpoch(label: string) {
  const parsed = Date.parse(label);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function statusBadgeColors(status: ApplicationStatus) {
  switch (status) {
    case "New":
      return "bg-primary/10 text-primary border-primary/20";
    case "Under Review":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "Interviewing":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Rejected":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-gray-100 text-gray-800";
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
    case "HR":
      return "bg-purple-100 text-purple-700";
    case "Design":
      return "bg-indigo-100 text-indigo-700";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function buildApplicationTableColumns(
  onViewCV: (app: Application) => void,
  onSendEmail: (app: Application, emailType: string) => void,
): TableColumn<Application>[] {
  return [
    {
      key: "candidate",
      header: "Candidate",
      renderCell: (app) => (
        <div className="flex items-center gap-4">
          <img
            alt={`${app.candidateFirstName} ${app.candidateLastName}`}
            className="h-12 w-12 rounded-full border-2 border-[#e7bdb8]/20 object-cover"
            src={app.candidateAvatar}
          />
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
      renderCell: (app) => (
        <div className="flex items-center justify-end gap-2">
          <div className="group relative">
            <button
              type="button"
              className="flex items-center gap-1 rounded-lg bg-[#e31b23] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#b90014]"
              onClick={() => onSendEmail(app, "default")}
            >
              Send Email{" "}
              <span className="material-symbols-outlined text-sm">
                expand_more
              </span>
            </button>
            <div className="absolute right-0 z-50 mt-1 hidden w-48 rounded-lg border border-[#e7bdb8] bg-white shadow-xl group-hover:block">
              <a
                className="block px-4 py-2 text-sm text-[#1a1c1c] transition-colors hover:bg-[#b90014]/5 hover:text-[#b90014]"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onSendEmail(app, "Interview Invitation");
                }}
              >
                Interview Invitation
              </a>
              <a
                className="block px-4 py-2 text-sm text-[#1a1c1c] transition-colors hover:bg-[#b90014]/5 hover:text-[#b90014]"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onSendEmail(app, "Job Offer");
                }}
              >
                Job Offer
              </a>
              <a
                className="block px-4 py-2 text-sm text-[#1a1c1c] transition-colors hover:bg-[#b90014]/5 hover:text-[#b90014]"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onSendEmail(app, "Rejection Mail");
                }}
              >
                Rejection Mail
              </a>
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg bg-[#e31b23] px-6 py-2 text-sm font-bold text-white shadow-md shadow-[#b90014]/10 transition-all hover:bg-[#b90014]"
            onClick={() => onViewCV(app)}
          >
            View CV
          </button>
          <button
            type="button"
            className="rounded-full p-2 text-[#5f5e5e] transition-colors hover:bg-[#f3f3f3] hover:text-[#1a1c1c]"
            title="More options"
          >
            <span className="material-symbols-outlined text-[24px]">
              more_vert
            </span>
          </button>
        </div>
      ),
    },
  ];
}

function CandidateApplicationScreen() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(setVariant("internal"));
  }, [dispatch]);

  useEffect(() => {
    let mounted = true;

    hrService
      .getApplications()
      .then((res) => {
        if (!mounted) return;

        const items = Array.isArray(res.data) ? res.data : [];

        setApplications(
          items.map((item: any) => ({
            id: item.id,
            candidateFirstName: item.candidate.firstName,
            candidateLastName: item.candidate.lastName,
            candidateEmail: item.candidate.email,
            candidateAvatar: item.candidate.avatarUrl,
            jobTitle: item.job.title,
            department: item.job.department,
            appliedDate: item.appliedDate ? new Date(item.appliedDate).toLocaleDateString() : "",
            appliedAt: item.appliedDate ? Date.parse(item.appliedDate) : Date.now(),
            status: item.status,
          })),
        );
      })
      .catch(() => {
        if (mounted) setApplications([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const [applications, setApplications] = useState<Application[]>(
    [],
  );
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] =
    useState<Department>("All Departments");
  const [statusFilter, setStatusFilter] = useState<string>("All Statuses");
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange>("Anytime");
  const [page, setPage] = useState<number>(1);
  const [currentTime] = useState(() => Date.now());


  const filtered = useMemo(() => {
    let result = applications;

    // Search filter
    if (searchTerm !== "") {
      result = result.filter(
        (a) =>
          `${a.candidateFirstName} ${a.candidateLastName}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          a.candidateEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()),
      );
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
    departmentFilter,
    statusFilter,
    dateRangeFilter,
    currentTime
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

  function sendEmail(application: Application, emailType: string) {
    hrService
      .sendApplicationEmail(application.id, {
        templateType: emailType,
        subject: emailType,
      })
      .then(() =>
        toast.success(
          `Sent "${emailType}" email to ${application.candidateFirstName} ${application.candidateLastName}`,
        ),
      )
      .catch(() => toast.error("Unable to send email"));
  }

  function goToPage(next: number) {
    const safe = Math.max(1, Math.min(totalPages, next));
    setPage(safe);
  }

  return (
    <div className="w-full flex-grow px-4 py-10 md:px-10">
      {/* Page Header */}
      <div className="mb-12">
        <h1 className="mb-2 text-[40px] font-bold leading-tight text-[#1a1c1c]">
          Job Applications
        </h1>
        <p className="text-xl text-[#5f5e5e]">
          Review and manage candidate applications across all departments.
        </p>
      </div>

      {/* Filters Area */}
      <div className="mb-10 rounded-xl border border-[#e7bdb8] bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end">
          <div className="w-full space-y-2 xl:flex-1">
            <label className="text-xs font-bold uppercase tracking-[0.1em] text-[#5f5e5e]">
              Search
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#5f5e5e]">
                search
              </span>
              <input
                className="w-full rounded-lg border border-[#e7bdb8] py-3 pl-10 pr-4 text-body-md outline-none transition-all focus:border-[#b90014] focus:ring-2 focus:ring-[#b90014]/10"
                placeholder="Search candidate or job role..."
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
              Department
            </label>
            <select
              className="w-full appearance-none rounded-lg border border-[#e7bdb8] bg-white px-4 py-3 text-body-md outline-none transition-all focus:border-[#b90014] focus:ring-2 focus:ring-[#b90014]/10"
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value as Department);
                resetToFirstPage();
              }}
            >
              {departmentOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full space-y-2 xl:w-64">
            <label className="text-xs font-bold uppercase tracking-[0.1em] text-[#5f5e5e]">
              Status
            </label>
            <select
              className="w-full appearance-none rounded-lg border border-[#e7bdb8] bg-white px-4 py-3 text-body-md outline-none transition-all focus:border-[#b90014] focus:ring-2 focus:ring-[#b90014]/10"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                resetToFirstPage();
              }}
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full space-y-2 xl:w-64">
            <label className="text-xs font-bold uppercase tracking-[0.1em] text-[#5f5e5e]">
              Date Range
            </label>
            <select
              className="w-full appearance-none rounded-lg border border-[#e7bdb8] bg-white px-4 py-3 text-body-md outline-none transition-all focus:border-[#b90014] focus:ring-2 focus:ring-[#b90014]/10"
              value={dateRangeFilter}
              onChange={(e) => {
                setDateRangeFilter(e.target.value as DateRange);
                resetToFirstPage();
              }}
            >
              {dateRanges.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="h-[52px] w-full rounded-lg bg-[#1a1c1c] px-10 py-3 text-body-md font-bold text-white transition-all hover:bg-[#5f5e5e] xl:w-auto"
            onClick={resetToFirstPage}
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Data Table with Pagination */}
      <CommonTable
        columns={buildApplicationTableColumns(viewCV, sendEmail)}
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
    </div>
  );
}

export default CandidateApplicationScreen;
