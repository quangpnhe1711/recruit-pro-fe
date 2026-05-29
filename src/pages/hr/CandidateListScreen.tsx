import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import CommonTable, { TableColumn } from "../../common/components/CommonTable";
import { setVariant } from "../../store/slices/authSlice";

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
          <button
            type="button"
            className="text-sm font-bold text-[#b90014] transition-colors hover:underline"
            onClick={() => onViewProfile(candidate)}
          >
            View Profile
          </button>
          <button
            type="button"
            className="p-1.5 text-[#5f5e5e] transition-colors hover:text-[#1a1c1c]"
            title="Edit"
            onClick={() => onEditProfile(candidate)}
          >
            <span className="material-symbols-outlined">edit</span>
          </button>
        </div>
      ),
    },
  ];
}

function buildSeedCandidates(): Candidate[] {
  const fixed: Candidate[] = [
    {
      id: "CD-2401",
      firstName: "Sarah",
      lastName: "Jenkins",
      email: "sarah.j@enterprise.com",
      avatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuC24_HK8aNVUAq6s0OxsgMzvJ-jprMFwtIjOOYHT5lPZ3GdL1F7z02HxMEqJEiDKH1Sih3Z2eaP92V6xzpQJ_8AvUMJQZbjlVp0X4GnZJUVylO7pgdiuN4sKwB8ZWY7UOocmtQD0aIQASBu8uQnNGLYLdNWBuJBDk13P2ueWg7emO6g-d-bd6811CP5qqy-QSPi6JjzBj5dCnw4iiMxP0Hnbz83w6F6SnEtp2T1rKHD6OYO0mWeUkds2GwYw-wqm9e7EP12hAd99A",
      source: "Portal",
      appliedDate: "Oct 24, 2023",
      appliedAt: parseDateLabelToEpoch("Oct 24, 2023"),
      status: "Interviewed",
    },
    {
      id: "CD-2402",
      firstName: "Marcus",
      lastName: "Thorne",
      email: "m.thorne@network.org",
      avatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCGByYoMQt2IEUHEgFPt39zD9YFEgAoN6DKN8NAd0OMJTu1faXjISCjbRFJgESuoTuffCihFRjI_JzJjZ7GFKl00U6M-I1LTX2POERqBNgQhYq8fFo39r5RO6OltIj8XE5JRqa2GSqOyGDwSzb7ksNSY-FHhro0Swf8ouNguRRSGKri6Zy0EgZtyKFgljCauJpaPoAtCY1CX0_bdMxZrN6M6C_sJrSDRlk7ZWjvDbyrIDJoHYBlk2rL8qGjAJgivuRcqnnemFTTfQ",
      source: "LinkedIn",
      appliedDate: "Oct 26, 2023",
      appliedAt: parseDateLabelToEpoch("Oct 26, 2023"),
      status: "Under Review",
    },
    {
      id: "CD-2403",
      firstName: "Elena",
      lastName: "Rodriguez",
      email: "erod@internal.com",
      avatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuC4i_chCt1JqQL_To1I-EDXzpjjmtaJah1WBSQLeNU6eg5IovTbk0IgU3r0GpdB9m7tE4cDmZmn1hDsHkNJg2lvj08B3XeolsZNxLxGw2jYDnkCv83CrTJDbA0lBPPaVXvvT3BzqkOEXxjHYVWj9NiikIwVISbYz6Dsb6xlFrzjTX3OgBPuQI-EHjc7UFbIPC31MCD1mIsvC4uka1UF4cKePPT558V7od55EUklJKeM_V3Wl814pyzWWWrfG6WTnXjkxUqL9GR_hA",
      source: "Bulk Import",
      appliedDate: "Oct 28, 2023",
      appliedAt: parseDateLabelToEpoch("Oct 28, 2023"),
      status: "New",
    },
    {
      id: "CD-2404",
      firstName: "Julian",
      lastName: "Vane",
      email: "j.vane@consulting.com",
      avatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCVUMH6aEyla10hY0XLW1DM_K2lS8YoKDQcRmFXO7qhviFJkfGtX0cSZn05vVERei6yGWn-51gZLCYX3p8eR88rZQq_i8nkF4KKf0nhT4Y2zSIshaS5P9mJiOxG5xugu2KHhDeHWirYN-_tTGCLFXb-vUFg2S_FSXvMYXDg43lczj8gjhKj0lzm7g_AiX2MWiAFaBSdij21gSlMl7vtuRtie1heTk2HT4_13Sk7vcYWf8S4wNbVrW0uOqRNedCL_SxjGSF7FGwtUA",
      source: "Portal",
      appliedDate: "Oct 29, 2023",
      appliedAt: parseDateLabelToEpoch("Oct 29, 2023"),
      status: "Rejected",
    },
  ];

  const fillers: Candidate[] = [];
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

  const idNum = 2405;
  for (let i = 0; i < 36; i += 1) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    const source = sources[i % sources.length];
    const status = statuses[i % statuses.length];

    const day = 1 + ((i * 3) % 28);
    const month = i % 2 === 0 ? "Sep" : "Oct";
    const label = `${month} ${day.toString().padStart(2, "0")}, 2023`;

    fillers.push({
      id: `CD-${idNum + i}`,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`,
      avatar: `https://i.pravatar.cc/150?img=${i}`,
      source,
      appliedDate: label,
      appliedAt: parseDateLabelToEpoch(label),
      status,
    });
  }

  return [...fixed, ...fillers];
}

function CandidateListScreen() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(setVariant("internal"));
  }, [dispatch]);

  const [candidates, setCandidates] = useState<Candidate[]>(buildSeedCandidates());
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
          <button
            type="button"
            className="flex items-center gap-2 border border-[#1a1c1c] bg-white px-6 py-3 text-[14px] font-semibold text-[#1a1c1c] transition-colors hover:bg-[#f3f3f3]"
            onClick={handleImport}
          >
            <span className="material-symbols-outlined text-xl">upload_file</span>
            <span>Import Candidates</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-2 bg-[#e31b23] px-6 py-3 text-[14px] font-semibold text-white transition-all hover:opacity-90"
            onClick={handleAddCandidate}
          >
            <span className="material-symbols-outlined text-xl">person_add</span>
            <span>Add Candidate</span>
          </button>
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
        columns={buildCandidateTableColumns(viewProfile, editProfile)}
        data={pageSlice}
        keyExtractor={(item) => item.id}
        loading={false}
        emptyMessage="No candidates found for current filters."
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
