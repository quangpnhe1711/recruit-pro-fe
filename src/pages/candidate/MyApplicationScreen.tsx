import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import CommonSelect from "../../common/components/CommonSelect";
import CommonTable, { TableColumn } from "../../common/components/CommonTable";
import CommonPagination from "../../common/components/CommonPagination";
import LoadingIndicator from "../../common/components/LoadingIndicator";
import { usePermissions } from "../../hooks/usePermissions";
import {
  applicationStatusFilterOptions,
  getApplicationStatusMeta,
} from "../../common/utils/applicationPresentation";
import { PERMISSIONS } from "../../permissions/permissions";
import {
  candidateService,
  type CandidateApplicationItemDto,
  type CandidateInterviewItemDto,
} from "../../services/candidate/candidateService";

type ApplicationItem = {
  id: string;
  jobId: string;
  icon: string;
  title: string;
  department: string;
  appliedDate: string;
  appliedDateValue: string;
  status: string;
  statusKey: string;
  statusClass: string;
  nextStep: string;
  availableActions: string[];
  relatedInterviewCount: number;
};

const emptySummaryCards = [
  { label: "Tổng", value: 0 },
  { label: "Đang xử lý", value: 0 },
  { label: "Đã đóng", value: 0 },
];

function toJobKey(value: string) {
  return value.trim().toLowerCase();
}

function mapApplicationItem(
  item: CandidateApplicationItemDto,
  index: number,
  interviews: CandidateInterviewItemDto[],
) {
  const status = getApplicationStatusMeta(item.status, "candidate");
  const relatedInterviewCount = interviews.filter(
    (interview) => toJobKey(interview.jobTitle) === toJobKey(item.jobTitle),
  ).length;

  return {
    id: item.id,
    jobId: item.jobId,
    icon: ["work", "terminal", "star"][index % 3],
    title: item.jobTitle,
    department: item.companyOrDepartment,
    appliedDate: item.appliedDate
      ? new Date(item.appliedDate).toLocaleDateString("vi-VN")
      : "",
    appliedDateValue: item.appliedDate ?? "",
    status: status.label,
    statusKey: status.key,
    statusClass: status.className,
    nextStep: item.nextStep,
    availableActions: item.availableActions ?? [],
    relatedInterviewCount,
  } satisfies ApplicationItem;
}

function buildApplicationTableColumns(
  canViewApplications: boolean,
  canWithdrawApplications: boolean,
  canAcceptOffer: boolean,
  canDeclineOffer: boolean,
  onViewDetail: (item: ApplicationItem) => void,
  onViewInterviews: (item: ApplicationItem) => void,
  onWithdraw: (item: ApplicationItem) => void,
  onAcceptOffer: (item: ApplicationItem) => void,
  onDeclineOffer: (item: ApplicationItem) => void,
  actionLoadingId: string | null,
): TableColumn<ApplicationItem>[] {
  return [
    {
      key: "title",
      header: "Vị trí & phòng ban",
      renderCell: (item) => (
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#e2dfde] bg-white">
            <span className="material-symbols-outlined text-[#b90014]">
              {item.icon}
            </span>
          </div>
          <div>
            <h3 className="text-[20px] font-semibold leading-7 hover:text-[#b90014]">
              {item.title}
            </h3>
            <p className="text-[14px] leading-5 text-[#5f5e5e]">
              {item.department}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "appliedDate",
      header: "Ngày ứng tuyển",
      renderCell: (item) => (
        <span className="text-[14px] text-[#5f5e5e]">{item.appliedDate}</span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      renderCell: (item) => (
        <span
          className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-[0.05em] ${item.statusClass}`}
        >
          {item.status}
        </span>
      ),
    },
    {
      key: "nextStep",
      header: "Bước tiếp theo",
      renderCell: (item) => (
        <span className="text-[14px] italic text-[#5f5e5e]">
          {item.nextStep}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Thao tác",
      headerClassName: "text-right",
      alignRight: true,
      renderCell: (item) => {
        const canAcceptThisApplication =
          item.availableActions.includes("acceptOffer") && canAcceptOffer;
        const canDeclineThisApplication =
          item.availableActions.includes("declineOffer") && canDeclineOffer;
        const canWithdrawThisApplication =
          item.availableActions.includes("withdraw") && canWithdrawApplications;
        const canViewInterviewSchedule =
          item.relatedInterviewCount > 0 || item.statusKey === "interview";
        const isLoading = actionLoadingId === item.id;

        return (
          <div className="flex flex-wrap justify-end gap-3">
            <button
              className="border-b-2 border-transparent text-[12px] font-bold text-[#1a1c1c] transition-colors hover:border-[#b90014] disabled:cursor-not-allowed disabled:text-[#8f8a88]"
              type="button"
              disabled={!canViewApplications}
              onClick={(event) => {
                event.stopPropagation();
                onViewDetail(item);
              }}
            >
              Xem chi tiết
            </button>

            <button
              className="border-b-2 border-transparent text-[12px] font-bold text-[#005f93] transition-colors hover:border-[#005f93] disabled:cursor-not-allowed disabled:text-[#8f8a88]"
              type="button"
              disabled={!canViewInterviewSchedule}
              onClick={(event) => {
                event.stopPropagation();
                onViewInterviews(item);
              }}
            >
              Xem lịch phỏng vấn
            </button>

            {item.availableActions.includes("acceptOffer") ? (
              <button
                className="bg-[#b90014] px-4 py-2 text-[12px] font-bold uppercase tracking-[0.05em] text-white transition-colors hover:bg-[#93000d] disabled:cursor-not-allowed disabled:bg-[#d8b4b7]"
                type="button"
                disabled={!canAcceptThisApplication || isLoading}
                onClick={(event) => {
                  event.stopPropagation();
                  onAcceptOffer(item);
                }}
              >
                Nhận offer
              </button>
            ) : null}

            {item.availableActions.includes("declineOffer") ? (
              <button
                className="border border-[#ba1a1a] px-4 py-2 text-[12px] font-bold uppercase tracking-[0.05em] text-[#ba1a1a] transition-colors hover:bg-[#fff1ef] disabled:cursor-not-allowed disabled:border-[#d8b4b7] disabled:text-[#c59b9b]"
                type="button"
                disabled={!canDeclineThisApplication || isLoading}
                onClick={(event) => {
                  event.stopPropagation();
                  onDeclineOffer(item);
                }}
              >
                Từ chối offer
              </button>
            ) : null}

            {item.availableActions.includes("withdraw") ? (
              <button
                className="text-[12px] font-bold text-[#ba1a1a] transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:text-[#c59b9b]"
                type="button"
                disabled={!canWithdrawThisApplication || isLoading}
                onClick={(event) => {
                  event.stopPropagation();
                  onWithdraw(item);
                }}
              >
                Rút đơn
              </button>
            ) : null}
          </div>
        );
      },
    },
  ];
}

function MyApplicationScreen() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canViewApplications = hasPermission(PERMISSIONS.APPLICATION_VIEW_OWN);
  const canWithdrawApplications = hasPermission(
    PERMISSIONS.APPLICATION_WITHDRAW_OWN,
  );
  const canAcceptOffer = hasPermission(
    PERMISSIONS.APPLICATION_ACCEPT_OFFER_OWN,
  );
  const canDeclineOffer = canAcceptOffer;

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [interviews, setInterviews] = useState<CandidateInterviewItemDto[]>([]);
  const [summary, setSummary] = useState(emptySummaryCards);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("applied-date");
  const [keyword, setKeyword] = useState("");
  const [selectedApplicationId, setSelectedApplicationId] = useState<
    string | null
  >(null);

  const pageSize = 3;

  async function loadData() {
    setLoading(true);

    try {
      const [applicationsResponse, interviewsResponse] = await Promise.all([
        candidateService.getApplications(),
        candidateService.getInterviews(),
      ]);

      const nextInterviews = interviewsResponse.data ?? [];
      const nextApplications = (applicationsResponse.data?.items ?? []).map(
        (item, index) => mapApplicationItem(item, index, nextInterviews),
      );

      setApplications(nextApplications);
      setInterviews(nextInterviews);

      const nextSummary = applicationsResponse.data?.summary;
      if (nextSummary) {
        setSummary([
          { label: "Tổng", value: nextSummary.total },
          { label: "Đang xử lý", value: nextSummary.active },
          { label: "Đã đóng", value: nextSummary.closed },
        ]);
      } else {
        setSummary(emptySummaryCards);
      }
    } catch {
      setApplications([]);
      setInterviews([]);
      setSummary(emptySummaryCards);
      toast.error("Không thể tải danh sách đơn ứng tuyển.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const filteredApplications = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    const nextItems = applications.filter((item) => {
      const matchesStatus =
        statusFilter === "all" || item.statusKey === statusFilter;
      const matchesKeyword =
        !normalizedKeyword ||
        item.title.toLowerCase().includes(normalizedKeyword) ||
        item.department.toLowerCase().includes(normalizedKeyword) ||
        item.nextStep.toLowerCase().includes(normalizedKeyword);

      return matchesStatus && matchesKeyword;
    });

    nextItems.sort((left, right) => {
      switch (sortBy) {
        case "job-title":
          return left.title.localeCompare(right.title, "vi");
        case "company":
          return left.department.localeCompare(right.department, "vi");
        case "status":
          return left.status.localeCompare(right.status, "vi");
        case "applied-date":
        default:
          return (
            new Date(right.appliedDateValue).getTime() -
            new Date(left.appliedDateValue).getTime()
          );
      }
    });

    return nextItems;
  }, [applications, keyword, sortBy, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [keyword, sortBy, statusFilter]);

  const totalItems = filteredApplications.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const pageSlice = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredApplications.slice(start, start + pageSize);
  }, [filteredApplications, page]);

  const rangeStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalItems);

  const selectedApplication = useMemo(
    () =>
      applications.find((application) => application.id === selectedApplicationId) ??
      null,
    [applications, selectedApplicationId],
  );

  const selectedApplicationInterviews = useMemo(() => {
    if (!selectedApplication) {
      return [];
    }

    return interviews.filter(
      (item) => toJobKey(item.jobTitle) === toJobKey(selectedApplication.title),
    );
  }, [interviews, selectedApplication]);

  async function handleWithdraw(item: ApplicationItem) {
    const confirmed = window.confirm(
      `Bạn có chắc muốn rút đơn ứng tuyển cho vị trí "${item.title}" không?`,
    );
    if (!confirmed) {
      return;
    }

    try {
      setActionLoadingId(item.id);
      await candidateService.withdrawApplication(item.id);
      toast.success("Đã rút đơn ứng tuyển.");
      await loadData();
      setSelectedApplicationId((current) =>
        current === item.id ? null : current,
      );
    } catch {
      toast.error("Không thể rút đơn ứng tuyển lúc này.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleAcceptOffer(item: ApplicationItem) {
    const confirmed = window.confirm(
      `Xác nhận nhận offer cho vị trí "${item.title}"?`,
    );
    if (!confirmed) {
      return;
    }

    try {
      setActionLoadingId(item.id);
      await candidateService.acceptOffer(item.id);
      toast.success("Bạn đã xác nhận nhận offer.");
      await loadData();
    } catch {
      toast.error("Không thể xác nhận offer lúc này.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleDeclineOffer(item: ApplicationItem) {
    const confirmed = window.confirm(
      `Xác nhận từ chối offer cho vị trí "${item.title}"?`,
    );
    if (!confirmed) {
      return;
    }

    try {
      setActionLoadingId(item.id);
      await candidateService.declineOffer(item.id);
      toast.success("Bạn đã từ chối offer.");
      await loadData();
    } catch {
      toast.error("Không thể từ chối offer lúc này.");
    } finally {
      setActionLoadingId(null);
    }
  }

  function handleViewInterviews(item: ApplicationItem) {
    const search = new URLSearchParams();
    search.set("jobTitle", item.title);
    navigate(`/candidate/interviews?${search.toString()}`);
  }

  function goTo(next: number) {
    const safe = Math.max(1, Math.min(totalPages, next));
    setPage(safe);
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center px-4 py-6 md:px-10">
        <LoadingIndicator label="Đang tải đơn ứng tuyển..." />
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 md:px-10 md:py-10">
      <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="page-title">
            Đơn ứng tuyển của tôi
          </h1>
          <p className="text-[14px] leading-5 text-[#5f5e5e]">
            Theo dõi, xem chi tiết và quản lý toàn bộ quá trình ứng tuyển của
            bạn.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {summary.map((card) => (
            <div
              key={card.label}
              className="min-w-[120px] border border-[#e2dfde] bg-white p-4 text-center"
            >
              <span className="block text-[32px] font-bold text-[#b90014]">
                {card.value}
              </span>
              <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5f5e5e]">
                {card.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-4 bg-[#f3f3f3] p-4">
        <div className="flex w-full flex-col gap-4 xl:flex-row xl:items-center">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#1a1c1c]">
              Lọc theo:
            </span>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-auto">
            <CommonSelect
              className="h-11 min-w-[220px]"
              options={applicationStatusFilterOptions}
              value={statusFilter}
              onValueChange={setStatusFilter}
            />
            <CommonSelect
              className="h-11 min-w-[220px]"
              options={[
                { label: "Sắp xếp: ngày ứng tuyển", value: "applied-date" },
                { label: "Sắp xếp: tên vị trí", value: "job-title" },
                { label: "Sắp xếp: phòng ban", value: "company" },
                { label: "Sắp xếp: trạng thái", value: "status" },
              ]}
              value={sortBy}
              onValueChange={setSortBy}
            />
          </div>
        </div>
        <div className="flex-1" />
        <div className="relative w-full md:w-72">
          <input
            className="w-full border border-[#e2dfde] bg-white px-4 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
            placeholder="Tìm kiếm đơn ứng tuyển..."
            type="text"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
      </div>

      <section className="overflow-hidden border border-[#e2dfde] bg-white">
        <CommonTable
          columns={buildApplicationTableColumns(
            canViewApplications,
            canWithdrawApplications,
            canAcceptOffer,
            canDeclineOffer,
            (item) => setSelectedApplicationId(item.id),
            handleViewInterviews,
            handleWithdraw,
            handleAcceptOffer,
            handleDeclineOffer,
            actionLoadingId,
          )}
          data={pageSlice}
          keyExtractor={(item) => item.id}
          loading={loading}
          emptyMessage="Chưa có đơn ứng tuyển nào."
          zebra
          hover
        />
      </section>

      <CommonPagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        onPageChange={goTo}
      />

      {selectedApplication ? (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-[#1a1c1c]/35">
          <div className="h-full w-full max-w-2xl overflow-y-auto bg-white p-6 shadow-2xl md:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#b90014]">
                  Chi tiết đơn ứng tuyển
                </p>
                <h2 className="mt-2 text-[28px] font-semibold leading-9 text-[#1a1c1c]">
                  {selectedApplication.title}
                </h2>
                <p className="mt-2 text-[14px] text-[#5f5e5e]">
                  {selectedApplication.department}
                </p>
              </div>

              <button
                className="flex h-10 w-10 items-center justify-center border border-[#e2dfde] text-[#1a1c1c] transition-colors hover:bg-[#f3f3f3]"
                type="button"
                onClick={() => setSelectedApplicationId(null)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="border border-[#e2dfde] bg-[#faf8f8] p-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5f5e5e]">
                  Trạng thái
                </p>
                <span
                  className={`mt-3 inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-[0.05em] ${selectedApplication.statusClass}`}
                >
                  {selectedApplication.status}
                </span>
              </div>
              <div className="border border-[#e2dfde] bg-[#faf8f8] p-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5f5e5e]">
                  Ngày ứng tuyển
                </p>
                <p className="mt-3 text-[18px] font-semibold text-[#1a1c1c]">
                  {selectedApplication.appliedDate}
                </p>
              </div>
              <div className="border border-[#e2dfde] bg-[#faf8f8] p-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5f5e5e]">
                  Lịch phỏng vấn
                </p>
                <p className="mt-3 text-[18px] font-semibold text-[#1a1c1c]">
                  {selectedApplication.relatedInterviewCount}
                </p>
              </div>
            </div>

            <div className="mt-6 border border-[#e2dfde] p-5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5f5e5e]">
                Bước tiếp theo
              </p>
              <p className="mt-3 text-[16px] leading-7 text-[#1a1c1c]">
                {selectedApplication.nextStep}
              </p>
            </div>

            <div className="mt-6 border border-[#e2dfde] p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5f5e5e]">
                    Lịch phỏng vấn liên quan
                  </p>
                  <p className="mt-1 text-[14px] text-[#5f5e5e]">
                    Xem nhanh các buổi phỏng vấn hiện có cho vị trí này.
                  </p>
                </div>

                <button
                  className="border border-[#1a1c1c] px-4 py-2 text-[12px] font-bold uppercase tracking-[0.05em] text-[#1a1c1c] transition-colors hover:bg-[#1a1c1c] hover:text-white"
                  type="button"
                  onClick={() => handleViewInterviews(selectedApplication)}
                >
                  Xem lịch phỏng vấn
                </button>
              </div>

              {selectedApplicationInterviews.length === 0 ? (
                <p className="text-[14px] text-[#5f5e5e]">
                  Chưa có lịch phỏng vấn nào được lên cho đơn ứng tuyển này.
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedApplicationInterviews.map((interview) => (
                    <div
                      key={interview.id}
                      className="flex flex-col gap-2 border border-[#efe9e8] bg-[#faf8f8] p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-[#1a1c1c]">
                          {interview.dateLabel} · {interview.timeLabel}
                        </p>
                        <p className="mt-1 text-[14px] text-[#5f5e5e]">
                          Người phỏng vấn: {interview.interviewer}
                        </p>
                      </div>
                      <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#005f93]">
                        {interview.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-wrap justify-end gap-3">
              {selectedApplication.availableActions.includes("acceptOffer") ? (
                <button
                  className="bg-[#b90014] px-5 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#93000d] disabled:cursor-not-allowed disabled:bg-[#d8b4b7]"
                  type="button"
                  disabled={
                    !canAcceptOffer || actionLoadingId === selectedApplication.id
                  }
                  onClick={() => handleAcceptOffer(selectedApplication)}
                >
                  Nhận offer
                </button>
              ) : null}

              {selectedApplication.availableActions.includes("declineOffer") ? (
                <button
                  className="border border-[#ba1a1a] px-5 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-[#ba1a1a] transition-colors hover:bg-[#fff1ef] disabled:cursor-not-allowed disabled:border-[#d8b4b7] disabled:text-[#d8b4b7]"
                  type="button"
                  disabled={
                    !canDeclineOffer ||
                    actionLoadingId === selectedApplication.id
                  }
                  onClick={() => handleDeclineOffer(selectedApplication)}
                >
                  Từ chối offer
                </button>
              ) : null}

              {selectedApplication.availableActions.includes("withdraw") ? (
                <button
                  className="border border-[#ba1a1a] px-5 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-[#ba1a1a] transition-colors hover:bg-[#fff1ef] disabled:cursor-not-allowed disabled:border-[#d8b4b7] disabled:text-[#d8b4b7]"
                  type="button"
                  disabled={
                    !canWithdrawApplications ||
                    actionLoadingId === selectedApplication.id
                  }
                  onClick={() => handleWithdraw(selectedApplication)}
                >
                  Rút đơn
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default MyApplicationScreen;
