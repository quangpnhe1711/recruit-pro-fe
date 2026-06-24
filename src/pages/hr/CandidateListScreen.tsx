import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import CommonTable, { TableColumn } from "../../common/components/CommonTable";
import CommonSelect from "../../common/components/CommonSelect";
import PermissionGuard from "../../guards/PermissionGuard";
import { usePermissions } from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../permissions/permissions";
import { hrService } from "../../services/hr/hrService";

type CandidateStatus = "Mới" | "Đang xem xét" | "Đã phỏng vấn" | "Từ chối";
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
  status: CandidateStatus;
};

const statuses: CandidateStatus[] = [
  "Mới",
  "Đang xem xét",
  "Đã phỏng vấn",
  "Từ chối",
];
const sources: CandidateSource[] = ["Portal", "LinkedIn", "Import hàng loạt"];

const statusOptions: ("Tất cả trạng thái" | CandidateStatus)[] = [
  "Tất cả trạng thái",
  "Mới",
  "Đang xem xét",
  "Đã phỏng vấn",
  "Từ chối",
];

const sourceOptions: ("Tất cả nguồn" | CandidateSource)[] = [
  "Tất cả nguồn",
  "Portal",
  "LinkedIn",
  "Import hàng loạt",
];

function parseDateLabelToEpoch(label: string) {
  const parsed = Date.parse(label);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function normalizeCandidateStatus(status: string): CandidateStatus {
  switch (status.trim().toLowerCase()) {
    case "reviewing":
    case "under review":
    case "managerreview":
      return "Đang xem xét";
    case "interviewing":
    case "accepted":
      return "Đã phỏng vấn";
    case "rejected":
      return "Từ chối";
    default:
      return "Mới";
  }
}

function statusChip(status: CandidateStatus) {
  switch (status) {
    case "Đã phỏng vấn":
      return {
        wrapper: "bg-green-100 text-green-800",
        icon: "check_circle",
      };
    case "Đang xem xét":
      return {
        wrapper: "bg-blue-100 text-blue-800",
        icon: "schedule",
      };
    case "Mới":
      return {
        wrapper: "bg-amber-100 text-amber-800",
        icon: "new_releases",
      };
    case "Từ chối":
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
    case "Import hàng loạt":
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
  const canImportCandidates = hasPermission(PERMISSIONS.CANDIDATE_IMPORT);
  const canCreateCandidates = hasPermission(PERMISSIONS.CANDIDATE_CREATE);
  const canEditCandidates = hasPermission(PERMISSIONS.CANDIDATE_UPDATE);

  useEffect(() => {
    let mounted = true;

    hrService
      .getCandidates({ page: 1, pageSize: 1000 })
      .then((res) => {
        if (!mounted) return;

        const items = Array.isArray(res.data?.items) ? res.data.items : [];

        setCandidates(
          items.map((item: any) => ({
            id: item.id,
            firstName: item.firstName,
            lastName: item.lastName,
            email: item.email,
            avatar: item.avatarUrl,
            source: item.source === "BulkImport" ? "Import hàng loạt" : item.source,
            appliedDate: item.appliedDate
              ? new Date(item.appliedDate).toLocaleDateString()
              : "",
            appliedAt: item.appliedDate
              ? Date.parse(item.appliedDate)
              : Date.now(),
            status: normalizeCandidateStatus(item.status),
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
  const [statusFilter, setStatusFilter] = useState<string>("Tất cả trạng thái");
  const [sourceFilter, setSourceFilter] = useState<string>("Tất cả nguồn");
  const [page, setPage] = useState<number>(1);

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
        statusFilter === "Tất cả trạng thái" ? true : c.status === statusFilter,
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
      const daysOld = (Date.now() - c.appliedAt) / (1000 * 60 * 60 * 24);
      return daysOld <= 7;
    }).length;
    const pendingReviews = candidates.filter(
      (c) => c.status === "Đang xem xét",
    ).length;

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

  return (
    <div className="w-full flex-grow px-4 py-6 md:px-10">
      {/* Header section */}
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#1a1c1c]">
            Quản lý ứng viên
          </h2>
          <p className="mt-1 text-[14px] text-[#5f5e5e]">
            Theo dõi và quản lý toàn bộ nguồn ứng viên trong hệ thống tuyển dụng.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <PermissionGuard permissions={PERMISSIONS.CANDIDATE_IMPORT}>
            <button
              type="button"
              className="flex items-center gap-2 border border-[#1a1c1c] bg-white px-6 py-3 text-[14px] font-semibold text-[#1a1c1c] transition-colors hover:bg-[#f3f3f3]"
              onClick={handleImport}
            >
              <span className="material-symbols-outlined text-xl">
                upload_file
              </span>
              <span>Import ứng viên</span>
            </button>
          </PermissionGuard>
          <PermissionGuard permissions={PERMISSIONS.CANDIDATE_CREATE}>
            <button
              type="button"
              className="flex items-center gap-2 bg-[#e31b23] px-6 py-3 text-[14px] font-semibold text-white transition-all hover:opacity-90"
              onClick={handleAddCandidate}
            >
              <span className="material-symbols-outlined text-xl">
                person_add
              </span>
              <span>Thêm ứng viên</span>
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
                Tổng ứng viên
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
              <span className="material-symbols-outlined text-3xl">
                recent_actors
              </span>
            </div>
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">
                Mới thêm gần đây
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
              <span className="material-symbols-outlined text-3xl">
                pending_actions
              </span>
            </div>
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">
                Chờ xem xét
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
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:gap-4">
          <div className="relative w-full md:w-80">
            <input
              className="w-full border border-[#e7bdb8] bg-white px-4 py-2.5 text-sm focus:border-[#1a1c1c] focus:outline-none focus:ring-0"
              placeholder="Tìm theo tên hoặc email..."
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
          <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-auto">
            <CommonSelect
              className="h-[42px] min-w-[220px] text-sm"
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
            <CommonSelect
              className="h-[42px] min-w-[220px] text-sm"
              options={sourceOptions.map((source) => ({
                label: source,
                value: source,
              }))}
              value={sourceFilter}
              onChange={(event) => {
                setSourceFilter(event.target.value);
                resetToFirstPage();
              }}
            />
          </div>
        </div>
        <button className="flex items-center gap-2 text-sm font-semibold text-[#1a1c1c] transition-colors hover:underline">
          <span className="material-symbols-outlined text-lg">filter_list</span>
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
        emptyMessage="Không có dữ liệu"
        zebra
        hover
        tableWrapperClassName="border-x border-b border-[#e7bdb8] bg-white"
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
