import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import CommonTable, { TableColumn } from "../../common/components/CommonTable";
import CommonSelect from "../../common/components/CommonSelect";
import PermissionGuard from "../../guards/PermissionGuard";
import { usePermissions } from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../permissions/permissions";
import { hrService } from "../../services/hr/hrService";

// Candidate-list review state is a DERIVED DISPLAY GROUP (not the ApplicationStatus workflow). It
// summarizes where a candidate sits across their applications. Logic/filtering keys off these stable
// keys; the Vietnamese text lives only in CANDIDATE_REVIEW_STATE_META for display (INV-012).
type CandidateReviewState = "new" | "reviewing" | "interviewed" | "rejected";
type CandidateSource = "Portal" | "LinkedIn" | "Import hàng loạt";

type Candidate = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
  source: CandidateSource;
  appliedDate: string;
  appliedAt: number;
  status: CandidateReviewState;
};

type CandidateListItemDto = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  source: string;
  appliedDate?: string;
  status: string;
};

const CANDIDATE_REVIEW_STATE_META: Record<
  CandidateReviewState,
  { label: string; wrapper: string; icon: string }
> = {
  new: { label: "New", wrapper: "bg-amber-100 text-amber-800", icon: "new_releases" },
  reviewing: { label: "Reviewing", wrapper: "bg-blue-100 text-blue-800", icon: "schedule" },
  interviewed: { label: "Interviewed", wrapper: "bg-green-100 text-green-800", icon: "check_circle" },
  rejected: { label: "Rejected", wrapper: "bg-red-100 text-red-800", icon: "cancel" },
};

const sourceOptions: ("Tất cả nguồn" | CandidateSource)[] = [
  "Tất cả nguồn",
  "Portal",
  "LinkedIn",
  "Import hàng loạt",
];

// Stable filter keys: "all" + the derived review states. Labels resolved from the meta map.
const candidateStatusFilterOptions: { label: string; value: "all" | CandidateReviewState }[] = [
  { label: "Tất cả trạng thái", value: "all" },
  { label: CANDIDATE_REVIEW_STATE_META.new.label, value: "new" },
  { label: CANDIDATE_REVIEW_STATE_META.reviewing.label, value: "reviewing" },
  { label: CANDIDATE_REVIEW_STATE_META.interviewed.label, value: "interviewed" },
  { label: CANDIDATE_REVIEW_STATE_META.rejected.label, value: "rejected" },
];

// Map raw backend candidate/application status strings → stable derived key (done once here).
function normalizeCandidateReviewState(status: string): CandidateReviewState {
  switch (status.trim().toLowerCase().replace(/[_\s-]+/g, "")) {
    case "reviewing":
    case "underreview":
    case "screening":
    case "managerreview":
      return "reviewing";
    case "interviewing":
    case "interview":
    case "offer":
    case "hired":
    case "accepted":
      return "interviewed";
    case "rejected":
    case "offerdeclined":
      return "rejected";
    default:
      return "new";
  }
}

function statusChip(status: CandidateReviewState) {
  return CANDIDATE_REVIEW_STATE_META[status];
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
    case "Import hàng loạt":
      return {
        wrapper: "bg-amber-50 text-amber-700",
        icon: "data_usage",
      };
    default:
      return { wrapper: "bg-gray-50 text-gray-700", icon: "help" };
  }
}

function normalizeCandidateSource(source: string): CandidateSource {
  if (source === "BulkImport" || source === "Import hàng loạt") {
    return "Import hàng loạt";
  }

  if (source === "LinkedIn") {
    return "LinkedIn";
  }

  return "Portal";
}

function buildCandidateTableColumns(
  onViewProfile: (candidate: Candidate) => void,
  onEditProfile: (candidate: Candidate) => void,
  canEditCandidate: boolean,
): TableColumn<Candidate>[] {
  return [
    {
      key: "name",
      header: "Họ và tên",
      renderCell: (candidate) => (
        <div className="flex items-center gap-3">
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
      header: "Nguồn",
      renderCell: (candidate) => {
        const chip = sourceChip(candidate.source);
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${chip.wrapper}`}
          >
            <span className="material-symbols-outlined text-sm">
              {chip.icon}
            </span>
            {candidate.source}
          </span>
        );
      },
    },
    {
      key: "appliedDate",
      header: "Ngày ứng tuyển",
      renderCell: (candidate) => (
        <p className="text-sm text-[#5f5e5e]">{candidate.appliedDate}</p>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      renderCell: (candidate) => {
        const chip = statusChip(candidate.status);
        return (
          <span className={`badge ${chip.wrapper}`}>
            <span className="material-symbols-outlined text-[14px] leading-none">{chip.icon}</span>
            {chip.label}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Thao tác",
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
              Xem hồ sơ
            </button>
          </PermissionGuard>
          {canEditCandidate ? (
            <button
              type="button"
              className="p-1.5 text-[#5f5e5e] transition-colors hover:text-[#1a1c1c]"
              title="Chỉnh sửa"
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
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canEditCandidates = hasPermission(PERMISSIONS.CANDIDATE_UPDATE);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | CandidateReviewState>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("Tất cả nguồn");
  const [page, setPage] = useState<number>(1);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let mounted = true;

    hrService
      .getCandidates({ page: 1, pageSize: 1000 })
      .then((res) => {
        if (!mounted) return;

        const items = Array.isArray(res.data?.items) ? res.data.items : [];

        setCandidates(
          (items as CandidateListItemDto[]).map((item) => ({
            id: item.id,
            firstName: item.firstName,
            lastName: item.lastName,
            email: item.email,
            avatar: item.avatarUrl,
            source: normalizeCandidateSource(item.source),
            appliedDate: item.appliedDate
              ? new Date(item.appliedDate).toLocaleDateString()
              : "",
            appliedAt: item.appliedDate
              ? Date.parse(item.appliedDate)
              : Date.now(),
            status: normalizeCandidateReviewState(item.status),
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

  const filtered = useMemo(() => {
    return candidates
      .filter((c) =>
        searchTerm === ""
          ? true
          : `${c.firstName} ${c.lastName}`
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            c.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      .filter((c) =>
        statusFilter === "all" ? true : c.status === statusFilter,
      )
      .filter((c) =>
        sourceFilter === "Tất cả nguồn" ? true : c.source === sourceFilter,
      )
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
      const daysOld = (now - c.appliedAt) / (1000 * 60 * 60 * 24);
      return daysOld <= 7;
    }).length;
    const pendingReviews = candidates.filter(
      (c) => c.status === "reviewing",
    ).length;

    return {
      totalCandidates,
      recentlyAdded,
      pendingReviews,
    };
  }, [candidates, now]);

  function resetToFirstPage() {
    setPage(1);
  }

  function viewProfile(candidate: Candidate) {
    navigate(`/hr/candidates/${candidate.id}`);
  }

  function editProfile(candidate: Candidate) {
    navigate(`/hr/candidates/${candidate.id}`);
  }

  function goToPage(next: number) {
    const safe = Math.max(1, Math.min(totalPages, next));
    setPage(safe);
  }

  function handleImport() {
    navigate("/hr/candidates/import");
  }

  function handleAddCandidate() {
    toast.info("Chức năng thêm ứng viên sẽ sớm được hỗ trợ.");
  }

  const statCards = [
    { label: "Tổng ứng viên", value: stats.totalCandidates.toLocaleString(), icon: "group", iconWrap: "from-[#fff1f0] to-[#ffdad6] text-[#b90014]" },
    { label: "Mới thêm gần đây", value: String(stats.recentlyAdded), icon: "recent_actors", iconWrap: "from-sky-50 to-sky-100 text-sky-600" },
    { label: "Chờ xem xét", value: String(stats.pendingReviews), icon: "pending_actions", iconWrap: "from-amber-50 to-amber-100 text-amber-600" },
  ];

  return (
    <div className="app-container animate-fade-in flex-grow py-8">
      {/* Header section */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#fff1f0] to-[#ffdad6] text-[#b90014] sm:flex">
            <span className="material-symbols-outlined text-[26px]">group</span>
          </div>
          <div>
            <p className="eyebrow mb-1.5">Tuyển dụng</p>
            <h1 className="page-title">Quản lý ứng viên</h1>
            <p className="page-subtitle">
              Theo dõi và quản lý toàn bộ nguồn ứng viên trong hệ thống tuyển dụng.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <PermissionGuard permissions={PERMISSIONS.CANDIDATE_IMPORT}>
            <button type="button" className="btn btn-secondary" onClick={handleImport}>
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
              <span>Import</span>
            </button>
          </PermissionGuard>
          <PermissionGuard permissions={PERMISSIONS.CANDIDATE_CREATE}>
            <button type="button" className="btn btn-primary" onClick={handleAddCandidate}>
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Thêm ứng viên</span>
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* Stats summary */}
      <div className="stagger mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card group">
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br ${card.iconWrap} transition-transform duration-200 group-hover:scale-105`}>
                <span className="material-symbols-outlined text-[24px]">{card.icon}</span>
              </div>
              <div>
                <p className="eyebrow">{card.label}</p>
                <h3 className="mt-2 text-[30px] font-bold leading-none tracking-[-0.02em] text-[#1a1c1c]">
                  {card.value}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table Controls */}
      <div className="card mb-4 flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 lg:flex-1 lg:flex-row lg:items-center">
          <div className="relative w-full lg:max-w-xs">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-[#a8a4a2]">
              search
            </span>
            <input
              className="input-field pl-10"
              placeholder="Tìm theo tên hoặc email..."
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                resetToFirstPage();
              }}
            />
          </div>
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto">
            <CommonSelect
              className="h-[42px] min-w-[200px] text-sm"
              options={candidateStatusFilterOptions}
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as "all" | CandidateReviewState);
                resetToFirstPage();
              }}
            />
            <CommonSelect
              className="h-[42px] min-w-[200px] text-sm"
              options={sourceOptions.map((source) => ({ label: source, value: source }))}
              value={sourceFilter}
              onChange={(event) => {
                setSourceFilter(event.target.value);
                resetToFirstPage();
              }}
            />
          </div>
        </div>
        <button className="btn btn-ghost shrink-0">
          <span className="material-symbols-outlined text-[18px]">tune</span>
          Bộ lọc nâng cao
        </button>
      </div>

      {/* Candidate Table */}
      <CommonTable
        columns={buildCandidateTableColumns(
          viewProfile,
          editProfile,
          canEditCandidates,
        )}
        data={pageSlice}
        keyExtractor={(item) => item.id}
        loading={false}
        emptyMessage="Không tìm thấy ứng viên nào"
        emptyIcon="person_search"
        hover
        onRowClick={(item) => viewProfile(item)}
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

export default CandidateListScreen;
