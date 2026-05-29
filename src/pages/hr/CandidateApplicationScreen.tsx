import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import CommonTable, { TableColumn } from "../../common/components/CommonTable";
import { setVariant } from "../../store/slices/authSlice";

type ApplicationStatus = "New" | "Under Review" | "Interviewing" | "Rejected";
type DateRange = "Anytime" | "Last 7 Days" | "Last 30 Days" | "This Quarter" | "This Year";
type Department = "All Departments" | "Engineering" | "Marketing" | "Sales" | "HR" | "Design";

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

const applicationStatuses: ApplicationStatus[] = ["New", "Under Review", "Interviewing", "Rejected"];
const departments: Department[] = ["Engineering", "Marketing", "Sales", "HR", "Design"];
const dateRanges: DateRange[] = ["Anytime", "Last 7 Days", "Last 30 Days", "This Quarter", "This Year"];

const statusOptions: ("All Statuses" | ApplicationStatus)[] = [
  "All Statuses",
  "New",
  "Under Review",
  "Interviewing",
  "Rejected",
];

const departmentOptions: Department[] = ["All Departments", "Engineering", "Marketing", "Sales", "HR", "Design"];

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
      renderCell: (app) => <p className="text-body-lg text-[#5f5e5e]">{app.appliedDate}</p>,
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
              Send Email <span className="material-symbols-outlined text-sm">expand_more</span>
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
            <span className="material-symbols-outlined text-[24px]">more_vert</span>
          </button>
        </div>
      ),
    },
  ];
}

function buildSeedApplications(): Application[] {
  const fixed: Application[] = [
    {
      id: "APP-5001",
      candidateFirstName: "Marcus",
      candidateLastName: "Thorne",
      candidateEmail: "m.thorne@example.com",
      candidateAvatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBSEdv-aX2NipNHgHi_a1wsfzaRx_Hd_CeSSFiZK821CNqiU0sILyshIU22KEVUVC1QnOYpcqstBdvseabbkghRjJrX7-Tl9dWrA7dfVMV0UFk2xRL-YiFwbdpIlhMcp0Nlyx8WTAtL3HUK9lCLdsBfQPbSxpv458RW0IozKCtAvcVd5Qg-ETJUu9E7vgqwhRF-VJWql7VXiHaEsEoUQNuLxWWft0CnNVSEBYQ0kBhmfrhgm3nYpAjkyu3HAoFr-kzAmvseYx361g",
      jobTitle: "Senior Frontend Engineer",
      department: "Engineering",
      appliedDate: "Oct 12, 2024",
      appliedAt: parseDateLabelToEpoch("Oct 12, 2024"),
      status: "New",
    },
    {
      id: "APP-5002",
      candidateFirstName: "Elena",
      candidateLastName: "Rodriguez",
      candidateEmail: "e.rod@digitalmkt.com",
      candidateAvatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBe5f_mZMAWtsgG2WMbe2Xrx_xuDzZVr4ic6kxWZUXZohkOPmqphV_cBYT3BBCE0vxx0unufTcpxuKmJ6krDe7r3DUDayDFbLU0GaETRwzZImdif64CnlsUTpShYjQ161gsmXEunkSXkHjRtFPUUgg3ILIsVrkvYF9oJ0b3rEpQuHg8VHg-LDCXaQdC0pXF4DB_FRqoAIcGz3AfkNrPXzTi2t-ZfTiRR7JRQTT1c7ImkxIVRiMdnlJNK42N9LCtxs_p_m8onLNUeA",
      jobTitle: "Creative Director",
      department: "Marketing",
      appliedDate: "Oct 10, 2024",
      appliedAt: parseDateLabelToEpoch("Oct 10, 2024"),
      status: "Interviewing",
    },
    {
      id: "APP-5003",
      candidateFirstName: "David",
      candidateLastName: "Chen",
      candidateEmail: "d.chen@globaltech.io",
      candidateAvatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBX2jyIkAkG6u6ZOPE_9445HtJ6NLr83DHpcd6Jfc5ZYG_ojYGz9vgcWT6dY0wouMumaDuFYNIBxEE10uuxl04EH98BVOOQzOhVD-G9fKDQKySbI-wYTGNEEi3m2UQTwhip8eAAewb-QCmDQTK2nynTpzv0oyCnDybLglGoPbrfsPLNYWZ80QN1Whc9OXhAj5E3RPUvJmypSxX4bnyCmrbT-VX_CdOtiwqWke7Y3_M7d2l7-21dQi6S_XSSEoEY3HLr5HN_xNon_g",
      jobTitle: "Sales Operations Lead",
      department: "Sales",
      appliedDate: "Oct 08, 2024",
      appliedAt: parseDateLabelToEpoch("Oct 08, 2024"),
      status: "Under Review",
    },
    {
      id: "APP-5004",
      candidateFirstName: "Sarah",
      candidateLastName: "Jenkins",
      candidateEmail: "sarah.j@hr-solutions.com",
      candidateAvatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDFfVFf_uXP9FttxcNIUYCKruhgyy3AMcqceLY5rZZbbG-CUGyw3U2DPjNh8ig5tzo7OzRrHoDzL4z14ElS0-mJh6GiDTENsoyCUHQnPu7H49rvKpalj6hGVSNqRaQHNkeGI-87zF87-lPPRHItteSVuTGN9WC7eq2I9aCrKYlAYWG91hyCZjMe9M8nAtugWriQwdFtjRZX_qivpSzY7yo-hd9gyiQpZ2xW_Vb3FoYtHrUB2nwy9IGekCgaDBK_FcTSEadFcQAynQ",
      jobTitle: "HR Specialist",
      department: "HR",
      appliedDate: "Oct 05, 2024",
      appliedAt: parseDateLabelToEpoch("Oct 05, 2024"),
      status: "Rejected",
    },
    {
      id: "APP-5005",
      candidateFirstName: "Jordan",
      candidateLastName: "Lee",
      candidateEmail: "jordan.lee@devops.net",
      candidateAvatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuB4Epl0dLZXceU407-_2vn_mUmcy0tt1oNaHGUdgVjtCbfMYaGni6oR5pRJqimnOH3zaIFdkeuQ_rFSNp04HQczPmv6N4Oge6Su2Asp6v9YTYjEoi9PJxH6y5CWXchn88dmiSPFfis88TohC2GbsR2bopITd2-047F5amjuOTJf44dv2WmzDcMskqgocD7XYgmsR9p1c_gPfe2TPbszlbc9buSrOTUNz6z5W7J7gv6HL8mgW1mUdDVMFyTx3fyTQbp4LJitSWa0sA",
      jobTitle: "Cloud Architect",
      department: "Engineering",
      appliedDate: "Oct 02, 2024",
      appliedAt: parseDateLabelToEpoch("Oct 02, 2024"),
      status: "New",
    },
  ];

  const fillers: Application[] = [];
  const firstNames = [
    "Alice",
    "Bob",
    "Charlotte",
    "David",
    "Emma",
    "Frank",
    "Grace",
    "Henry",
    "Ivy",
    "Jack",
  ];
  const lastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
    "Garcia",
  ];
  const jobTitles = [
    "Backend Engineer",
    "Product Manager",
    "Data Analyst",
    "UX Designer",
    "DevOps Engineer",
    "Marketing Manager",
    "Sales Executive",
    "HR Coordinator",
    "QA Engineer",
    "Solutions Architect",
  ];

  const idNum = 5006;
  for (let i = 0; i < 53; i += 1) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    const dept = departments[i % departments.length];
    const status = applicationStatuses[i % applicationStatuses.length];
    const jobTitle = jobTitles[i % jobTitles.length];

    const day = 1 + ((i * 2) % 28);
    const month = i % 3 === 0 ? "Sep" : i % 3 === 1 ? "Oct" : "Nov";
    const label = `${month} ${day.toString().padStart(2, "0")}, 2024`;

    fillers.push({
      id: `APP-${idNum + i}`,
      candidateFirstName: firstName,
      candidateLastName: lastName,
      candidateEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`,
      candidateAvatar: `https://i.pravatar.cc/150?img=${i + 100}`,
      jobTitle,
      department: dept,
      appliedDate: label,
      appliedAt: parseDateLabelToEpoch(label),
      status,
    });
  }

  return [...fixed, ...fillers];
}

function CandidateApplicationScreen() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(setVariant("internal"));
  }, [dispatch]);

  const [applications, setApplications] = useState<Application[]>(buildSeedApplications());
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<Department>("All Departments");
  const [statusFilter, setStatusFilter] = useState<string>("All Statuses");
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange>("Anytime");
  const [page, setPage] = useState<number>(1);

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
          a.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
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
      const now = Date.now();
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
  }, [applications, searchTerm, departmentFilter, statusFilter, dateRangeFilter]);

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
    toast.info(`Viewing CV for ${application.candidateFirstName} ${application.candidateLastName}`);
  }

  function sendEmail(application: Application, emailType: string) {
    toast.info(
      `Sending "${emailType}" email to ${application.candidateFirstName} ${application.candidateLastName}`
    );
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
        emptyMessage="No applications found for current filters."
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
