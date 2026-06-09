import { useMemo, useState, useEffect } from "react";
import { toast } from "react-toastify";
import CommonTable, { TableColumn } from "../../common/components/CommonTable";
import PermissionGuard from "../../guards/PermissionGuard";
import { usePermissions } from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../permissions/permissions";
import { hrService } from "../../services/hr/hrService";

type CandidateStatus = "New" | "Under Review" | "Interviewed" | "Rejected";
type CandidateSource = "Portal" | "LinkedIn" | "Bulk Import";

type Candidate = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
  source: CandidateSource;
  appliedDate: string;
  appliedAt: number;
  status: CandidateStatus;
};

const statuses: CandidateStatus[] = ["New", "Under Review", "Interviewed", "Rejected"];
const sources: CandidateSource[] = ["Portal", "LinkedIn", "Bulk Import"];

const statusOptions: ("All Statuses" | CandidateStatus)[] = [
  "All Statuses",
  "New",
  "Under Review",
  "Interviewed",
  "Rejected",
];

const sourceOptions: ("All Sources" | CandidateSource)[] = [
  "All Sources",
  "Portal",
  "LinkedIn",
  "Bulk Import",
];

function parseDateLabelToEpoch(label: string) {
  const parsed = Date.parse(label);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function statusChip(status: CandidateStatus) {
  switch (status) {
    case "Interviewed":
      return {
        wrapper: "bg-green-100 text-green-800",
        icon: "check_circle",
      };
    case "Under Review":
      return {
        wrapper: "bg-blue-100 text-blue-800",
        icon: "schedule",
      };
    case "New":
      return {
        wrapper: "bg-amber-100 text-amber-800",
        icon: "new_releases",
      };
    case "Rejected":
      return {
        wrapper: "bg-red-100 text-red-800",
        icon: "cancel",
      };
    default:
      return { wrapper: "bg-gray-100 text-gray-800", icon: "help" };
  }
}

function sourceChip(source: CandidateSource) {
  switch (source) {
    case "Portal":
      return {
        wrapper: "bg-blue-50 text-blue-700",
        icon: "language",
      };
    case "LinkedIn":
      return {
        wrapper: "bg-indigo-50 text-indigo-700",
        icon: "hub",
      };
    case "Bulk Import":
      return {
        wrapper: "bg-amber-50 text-amber-700",
        icon: "data_usage",
      };
    default:
      return { wrapper: "bg-gray-50 text-gray-700", icon: "help" };
  }
}

function buildCandidateTableColumns(
  onViewProfile: (candidate: Candidate) => void,
  onEditProfile: (candidate: Candidate) => void,
  canEditCandidate: boolean,
): TableColumn<Candidate>[] {
  return [
    {
      key: "name",
      header: "Full Name",
      renderCell: (candidate) => (
        <div className="flex items-center gap-3">
          <img
            alt={`${candidate.firstName} ${candidate.lastName}`}
            className="h-10 w-10 rounded-full border border-[#e7bdb8] object-cover"
            src={candidate.avatar}
          />
          <div>
            <p className="text-sm font-semibold text-[#1a1c1c]">
              {candidate.firstName} {candidate.lastName}
            </p>
            <p className="text-xs text-[#5f5e5e]">{candidate.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "source",
      header: "Source",
      renderCell: (candidate) => {
        const chip = sourceChip(candidate.source);
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${chip.wrapper}`}
          >
            <span className="material-symbols-outlined text-sm">{chip.icon}</span>
            {candidate.source}
          </span>
        );
      },
    },
    {
      key: "appliedDate",
      header: "Applied Date",
      renderCell: (candidate) => (
        <p className="text-sm text-[#5f5e5e]">{candidate.appliedDate}</p>
      ),
    },
    {
      key: "status",
      header: "Status",
      renderCell: (candidate) => {
        const chip = statusChip(candidate.status);
        return (
          <span
            className={`rounded px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${chip.wrapper}`}
          >
            {candidate.status}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      alignRight: true,
      headerClassName: "text-right",
      renderCell: (candidate) => (
        <div className="flex items-center justify-end gap-4">
          <PermissionGuard permissions={PERMISSIONS.CANDIDATE_VIEW_DETAIL}>
            <button
              type="button"
              className="text-sm font-bold text-[#b90014] transition-colors hover:underline"
              onClick={() => onViewProfile(candidate)}
            >
              View Profile
            </button>
          </PermissionGuard>
          {canEditCandidate ? (
            <button
              type="button"
              className="p-1.5 text-[#5f5e5e] transition-colors hover:text-[#1a1c1c]"
              title="Edit"
              onClick={() => onEditProfile(candidate)}
            >
              <span className="material-symbols-outlined">edit</span>
            </button>
          ) : null}
        </div>
      ),
    },
  ];
}

function CandidateListScreen() {
  const { hasPermission } = usePermissions();
  const canImportCandidates = hasPermission(PERMISSIONS.CANDIDATE_IMPORT);
  const canCreateCandidates = hasPermission(PERMISSIONS.CANDIDATE_CREATE);
  const canEditCandidates = hasPermission(PERMISSIONS.CANDIDATE_UPDATE);

  useEffect(() => {
    let mounted = true;

    hrService
      .getCandidates()
      .then((res) => {
        if (!mounted) return;

        const items = Array.isArray(res.data) ? res.data : [];

        setCandidates(
          items.map((item: any) => ({
            id: item.id,
            firstName: item.firstName,
            lastName: item.lastName,
            email: item.email,
            avatar: item.avatarUrl,
            source: item.source === "BulkImport" ? "Bulk Import" : item.source,
            appliedDate: item.appliedDate ? new Date(item.appliedDate).toLocaleDateString() : "",
            appliedAt: item.appliedDate ? Date.parse(item.appliedDate) : Date.now(),
            status: item.status,
          })),
        );
      })
      .catch(() => {
        if (mounted) setCandidates([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All Statuses");
  const [sourceFilter, setSourceFilter] = useState<string>("All Sources");
  const [page, setPage] = useState<number>(1);

  const filtered = useMemo(() => {
    return candidates
      .filter((c) =>
        searchTerm === ""
          ? true
          : `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter((c) => (statusFilter === "All Statuses" ? true : c.status === statusFilter))
      .filter((c) => (sourceFilter === "All Sources" ? true : c.source === sourceFilter))
      .sort((a, b) => b.appliedAt - a.appliedAt);
  }, [candidates, searchTerm, statusFilter, sourceFilter]);

  const pageSize = 10;
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);

  const pageSlice = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalItems);

  const stats = useMemo(() => {
    const totalCandidates = candidates.length;
    const recentlyAdded = candidates.filter((c) => {
      const daysOld = (Date.now() - c.appliedAt) / (1000 * 60 * 60 * 24);
      return daysOld <= 7;
    }).length;
    const pendingReviews = candidates.filter((c) => c.status === "Under Review").length;

    return {
      totalCandidates,
      recentlyAdded,
      pendingReviews,
    };
  }, [candidates]);

  function resetToFirstPage() {
    setPage(1);
  }

  function viewProfile(candidate: Candidate) {
    toast.info(`Viewing profile for ${candidate.firstName} ${candidate.lastName}`);
  }

  function editProfile(candidate: Candidate) {
    toast.info(`Editing ${candidate.firstName} ${candidate.lastName}`);
  }

  function goToPage(next: number) {
    const safe = Math.max(1, Math.min(totalPages, next));
    setPage(safe);
  }

  function handleImport() {
    toast.info("Import candidates functionality");
  }

  function handleAddCandidate() {
    toast.info("Add new candidate functionality");
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] flex-grow px-4 py-6 md:px-10">
      {/* Header section */}
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#1a1c1c]">
            Candidate Management
          </h2>
          <p className="mt-1 text-[14px] text-[#5f5e5e]">
            Efficiently manage and track your internal recruitment pipeline.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <PermissionGuard permissions={PERMISSIONS.CANDIDATE_IMPORT}>
            <button
              type="button"
              className="flex items-center gap-2 border border-[#1a1c1c] bg-white px-6 py-3 text-[14px] font-semibold text-[#1a1c1c] transition-colors hover:bg-[#f3f3f3]"
              onClick={handleImport}
            >
              <span className="material-symbols-outlined text-xl">upload_file</span>
              <span>Import Candidates</span>
            </button>
          </PermissionGuard>
          <PermissionGuard permissions={PERMISSIONS.CANDIDATE_CREATE}>
            <button
              type="button"
              className="flex items-center gap-2 bg-[#e31b23] px-6 py-3 text-[14px] font-semibold text-white transition-all hover:opacity-90"
              onClick={handleAddCandidate}
            >
              <span className="material-symbols-outlined text-xl">person_add</span>
              <span>Add Candidate</span>
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* Stats summary */}
      <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="border border-[#e7bdb8] bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#b90014]/5 text-[#b90014]">
              <span className="material-symbols-outlined text-3xl">group</span>
            </div>
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">
                Total Candidates
              </p>
              <h3 className="mt-2 text-3xl font-bold leading-10 tracking-[-0.01em]">
                {stats.totalCandidates.toLocaleString()}
              </h3>
            </div>
          </div>
        </div>
        <div className="border border-[#e7bdb8] bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#005f93]/5 text-[#005f93]">
              <span className="material-symbols-outlined text-3xl">recent_actors</span>
            </div>
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">
                Recently Added
              </p>
              <h3 className="mt-2 text-3xl font-bold leading-10 tracking-[-0.01em]">
                {stats.recentlyAdded}
              </h3>
            </div>
          </div>
        </div>
        <div className="border border-[#e7bdb8] bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-orange-500/5 text-orange-500">
              <span className="material-symbols-outlined text-3xl">pending_actions</span>
            </div>
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">
                Pending Reviews
              </p>
              <h3 className="mt-2 text-3xl font-bold leading-10 tracking-[-0.01em]">
                {stats.pendingReviews}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Table Controls */}
      <div className="flex flex-col gap-4 border-x border-t border-[#e7bdb8] bg-[#f3f3f3] px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4">
          <div className="relative w-full md:w-80">
            <input
              className="w-full border border-[#e7bdb8] bg-white px-4 py-2.5 text-sm focus:border-[#1a1c1c] focus:outline-none focus:ring-0"
              placeholder="Search by name or email..."
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                resetToFirstPage();
              }}
            />
            <span className="material-symbols-outlined absolute right-3 top-2.5 text-[#5f5e5e]">
              search
            </span>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="min-w-[140px] border border-[#e7bdb8] bg-white px-4 py-2.5 text-sm focus:border-[#1a1c1c] focus:outline-none focus:ring-0"
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
            <select
              className="min-w-[140px] border border-[#e7bdb8] bg-white px-4 py-2.5 text-sm focus:border-[#1a1c1c] focus:outline-none focus:ring-0"
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                resetToFirstPage();
              }}
            >
              {sourceOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button className="flex items-center gap-2 text-sm font-semibold text-[#1a1c1c] transition-colors hover:underline">
          <span className="material-symbols-outlined text-lg">filter_list</span>
          Advanced Filters
        </button>
      </div>

      {/* Candidate Table */}
      <CommonTable
        columns={buildCandidateTableColumns(viewProfile, editProfile, canEditCandidates)}
        data={pageSlice}
        keyExtractor={(item) => item.id}
        loading={false}
        emptyMessage="Không có dữ liệu"
        zebra
        hover
        tableWrapperClassName="border-x border-b border-[#e7bdb8] bg-white"
      />

      {/* Pagination */}
      <div className="flex flex-col gap-4 border-x border-b border-t border-[#e7bdb8] bg-[#f3f3f3] px-6 py-4 md:flex-row md:items-center md:justify-between">
        <span className="text-xs font-medium text-[#5f5e5e]">
          Showing <span className="font-bold text-[#1a1c1c]">{rangeStart}</span> to
          <span className="font-bold text-[#1a1c1c]"> {rangeEnd}</span> of
          <span className="font-bold text-[#1a1c1c]"> {totalItems}</span> entries
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center border border-[#e7bdb8] transition-colors hover:bg-[#f9f9f9] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Previous page"
          >
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </button>

          {Array.from({ length: Math.min(3, totalPages) }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              className={`flex h-8 w-8 items-center justify-center border text-xs font-bold transition-colors ${
                n === currentPage
                  ? "border-[#1a1c1c] bg-[#b90014] text-white"
                  : "border-[#e7bdb8] hover:bg-[#f9f9f9]"
              }`}
              onClick={() => goToPage(n)}
            >
              {n}
            </button>
          ))}

          {totalPages > 4 ? (
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center border border-[#e7bdb8] text-xs font-bold transition-colors hover:bg-[#f9f9f9]"
              onClick={() => toast.info("Jump using pagination")}
              aria-label="More pages"
            >
              ...
            </button>
          ) : null}

          {totalPages > 3 ? (
            <button
              type="button"
              className={`flex h-8 w-8 items-center justify-center border text-xs font-bold transition-colors ${
                totalPages === currentPage
                  ? "border-[#1a1c1c] bg-[#b90014] text-white"
                  : "border-[#e7bdb8] hover:bg-[#f9f9f9]"
              }`}
              onClick={() => goToPage(totalPages)}
            >
              {totalPages}
            </button>
          ) : null}

          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center border border-[#e7bdb8] transition-colors hover:bg-[#f9f9f9] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
          >
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default CandidateListScreen;
