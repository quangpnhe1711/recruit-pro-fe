import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import CommonTable, { type TableColumn } from "../../common/components/CommonTable";
import LoadingIndicator from "../../common/components/LoadingIndicator";
import type { ManagerJobApprovalQueueItemDto } from "../../modules/jobs/jobsSchema";
import { jobsService } from "../../services/jobs/jobsService";

function formatDateLabel(value: string | null) {
  if (!value) return "Unknown";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusBadge(status: string) {
  switch (status.toLowerCase()) {
    case "pendingapproval":
      return "bg-[#cde5ff] text-[#004b74]";
    case "approved":
      return "bg-emerald-50 text-emerald-700";
    case "rejected":
      return "bg-red-50 text-red-700";
    default:
      return "bg-[#f3f3f3] text-[#5f5e5e]";
  }
}

function buildColumns(onOpen: (item: ManagerJobApprovalQueueItemDto) => void): TableColumn<ManagerJobApprovalQueueItemDto>[] {
  return [
    {
      key: "title",
      header: "Approval Queue",
      renderCell: (item) => (
        <div>
          <p className="text-[14px] font-bold text-[#1a1c1c]">{item.title}</p>
          <p className="mt-1 font-mono text-[12px] text-[#5f5e5e]">{item.referenceCode}</p>
        </div>
      ),
    },
    {
      key: "departmentName",
      header: "Department",
      renderCell: (item) => (
        <div>
          <p className="text-[14px] font-semibold text-[#1a1c1c]">{item.departmentName}</p>
          <p className="text-[12px] text-[#5f5e5e]">{item.hiringTeamLabel}</p>
        </div>
      ),
    },
    {
      key: "hrOwnerName",
      header: "Created By HR",
      renderCell: (item) => (
        <div>
          <p className="text-[14px] font-semibold text-[#1a1c1c]">{item.hrOwnerName}</p>
          <p className="text-[12px] text-[#5f5e5e]">{formatDateLabel(item.submittedAt)}</p>
        </div>
      ),
    },
    {
      key: "vacancyCount",
      header: "Scope",
      renderCell: (item) => (
        <div className="space-y-1 text-[12px] text-[#5f5e5e]">
          <p><span className="font-semibold text-[#1a1c1c]">{item.vacancyCount}</span> openings</p>
          <p><span className="font-semibold text-[#1a1c1c]">{item.requiredSkillsCount}</span> required skills</p>
          <p><span className="font-semibold text-[#1a1c1c]">{item.applicationsCount}</span> applications</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      renderCell: (item) => (
        <div className="space-y-2">
          <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${statusBadge(item.status)}`}>
            {item.status === "PendingApproval" ? "Pending Approval" : item.status}
          </span>
          <p className={`text-[12px] font-semibold ${item.isOverdue ? "text-[#ba1a1a]" : "text-[#5f5e5e]"}`}>
            {item.isOverdue ? "Needs review attention" : "Within review window"}
          </p>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      alignRight: true,
      headerClassName: "text-right",
      renderCell: (item) => (
        <button
          type="button"
          className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#b90014] transition-colors hover:text-[#93000d]"
          onClick={(event) => {
            event.stopPropagation();
            onOpen(item);
          }}
        >
          Review Draft
        </button>
      ),
    },
  ];
}

function ManagerJobApprovalListScreen() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ManagerJobApprovalQueueItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [summary, setSummary] = useState({
    pendingApprovals: 0,
    submittedToday: 0,
    overdueReviews: 0,
    departmentsWaiting: 0,
  });

  useEffect(() => {
    let mounted = true;

    async function loadQueue() {
      setLoading(true);

      try {
        const response = await jobsService.getManagerApprovalQueue({
          keyword,
          page,
          pageSize: 8,
        });

        if (!mounted) return;

        setItems(response.data?.items ?? []);
        setSummary(response.data?.summary ?? {
          pendingApprovals: 0,
          submittedToday: 0,
          overdueReviews: 0,
          departmentsWaiting: 0,
        });
        setTotalPages(response.data?.meta?.totalPages ?? 1);
        setTotalItems(response.data?.meta?.totalItems ?? 0);
      } catch {
        if (!mounted) return;

        setItems([]);
        setSummary({
          pendingApprovals: 0,
          submittedToday: 0,
          overdueReviews: 0,
          departmentsWaiting: 0,
        });
        setTotalPages(1);
        setTotalItems(0);
        toast.error("Unable to load job approval queue.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadQueue();

    return () => {
      mounted = false;
    };
  }, [keyword, page]);

  const rangeStart = totalItems === 0 ? 0 : (page - 1) * 8 + 1;
  const rangeEnd = Math.min(page * 8, totalItems);

  const columns = useMemo(
    () => buildColumns((item) => navigate(`/manager/jobs/${item.jobId}/approval`)),
    [navigate],
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center px-4 py-8 md:px-10">
        <LoadingIndicator label="Loading job approval queue..." />
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8 md:px-10">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">
            Job Approval Workflow
          </p>
          <h1 className="mt-2 text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#1a1c1c]">
            Job Posting Approval
          </h1>
          <p className="mt-2 max-w-3xl text-[16px] leading-6 text-[#5f5e5e]">
            Review jobs submitted by HR, validate department scope and skills, then approve, reject, or send them back for revision.
          </p>
        </div>

        <div className="relative w-full max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#5f5e5e]">
            search
          </span>
          <input
            className="h-12 w-full rounded-lg border border-[#e7bdb8] bg-white pl-10 pr-4 text-sm outline-none transition-colors focus:border-[#1a1c1c]"
            placeholder="Search title, department, skill, HR owner..."
            type="text"
            value={keyword}
            onChange={(event) => {
              setPage(1);
              setKeyword(event.target.value);
            }}
          />
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="border border-[#e7bdb8] bg-[#f3f3f3] p-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">Pending Approval Jobs</p>
          <p className="mt-3 text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#1a1c1c]">{summary.pendingApprovals}</p>
          <p className="mt-2 text-[12px] font-semibold tracking-[0.05em] text-[#005f93]">Queue size awaiting manager decision</p>
        </div>
        <div className="border border-[#e7bdb8] bg-[#f3f3f3] p-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">Submitted Today</p>
          <p className="mt-3 text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#1a1c1c]">{summary.submittedToday}</p>
          <p className="mt-2 text-[12px] font-semibold tracking-[0.05em] text-[#5f5e5e]">New HR job drafts entering approval flow</p>
        </div>
        <div className="border border-[#e7bdb8] bg-[#f3f3f3] p-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">Overdue Reviews</p>
          <p className="mt-3 text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#ba1a1a]">{summary.overdueReviews}</p>
          <p className="mt-2 text-[12px] font-semibold tracking-[0.05em] text-[#ba1a1a]">Pending more than 3 days</p>
        </div>
        <div className="border border-[#e7bdb8] bg-[#1a1a1a] p-5 text-white">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/70">Departments Waiting</p>
          <p className="mt-3 text-[32px] font-semibold leading-10 tracking-[-0.01em]">{summary.departmentsWaiting}</p>
          <p className="mt-2 text-[12px] font-semibold tracking-[0.05em] text-white/70">Business units with pending staffing requests</p>
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border border-[#e7bdb8] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#e7bdb8] bg-[#f9f9f9] px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5f5e5e]">
              Approval Queue
            </p>
            <p className="mt-1 text-sm text-[#5d3f3c]">
              Open a draft to inspect department context, skills, and workflow impact before publishing.
            </p>
          </div>
          <p className="text-[12px] font-semibold tracking-[0.05em] text-[#5f5e5e]">
            Showing <span className="text-[#1a1c1c]">{rangeStart}-{rangeEnd}</span> of <span className="text-[#1a1c1c]">{totalItems}</span>
          </p>
        </div>

        <CommonTable
          columns={columns}
          data={items}
          keyExtractor={(item) => item.jobId}
          loading={loading}
          emptyMessage="No jobs are waiting for manager approval."
          hover
          zebra
          onRowClick={(item) => navigate(`/manager/jobs/${item.jobId}/approval`)}
          tableWrapperClassName="border-0 bg-white"
          pagination={{
            enabled: true,
            currentPage: page,
            totalPages,
            totalItems,
            rangeStart,
            rangeEnd,
            onPageChange: setPage,
          }}
          showPagination
        />
      </section>
    </div>
  );
}

export default ManagerJobApprovalListScreen;
