import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import CommonTable, { type TableColumn } from "../../common/components/CommonTable";
import PageHeader from "../../common/components/PageHeader";
import { Skeleton, SkeletonCard } from "../../common/components/Skeleton";
import type { ManagerJobApprovalQueueItemDto } from "../../modules/jobs/jobsSchema";
import { jobsService } from "../../services/jobs/jobsService";

function formatDateLabel(value: string | null) {
  if (!value) return "Không rõ";

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
      return "bg-sky-50 text-sky-700";
    case "approved":
      return "bg-emerald-50 text-emerald-700";
    case "rejected":
      return "bg-rose-50 text-rose-700";
    default:
      return "bg-[#f2efed] text-[#5f5e5e]";
  }
}

function buildColumns(onOpen: (item: ManagerJobApprovalQueueItemDto) => void): TableColumn<ManagerJobApprovalQueueItemDto>[] {
  return [
    {
      key: "title",
      header: "Hàng chờ duyệt",
      renderCell: (item) => (
        <div>
          <p className="text-[14px] font-bold text-[#1a1c1c]">{item.title}</p>
          <p className="mt-1 font-mono text-[12px] text-[#5f5e5e]">{item.referenceCode}</p>
        </div>
      ),
    },
    {
      key: "departmentName",
      header: "Phòng ban",
      renderCell: (item) => (
        <div>
          <p className="text-[14px] font-semibold text-[#1a1c1c]">{item.departmentName}</p>
          <p className="text-[12px] text-[#5f5e5e]">{item.hiringTeamLabel}</p>
        </div>
      ),
    },
    {
      key: "hrOwnerName",
      header: "Người tạo",
      renderCell: (item) => (
        <div>
          <p className="text-[14px] font-semibold text-[#1a1c1c]">{item.hrOwnerName}</p>
          <p className="text-[12px] text-[#5f5e5e]">{formatDateLabel(item.submittedAt)}</p>
        </div>
      ),
    },
    {
      key: "vacancyCount",
      header: "Phạm vi",
      renderCell: (item) => (
        <div className="space-y-1 text-[12px] text-[#5f5e5e]">
          <p><span className="font-semibold text-[#1a1c1c]">{item.vacancyCount}</span> vị trí tuyển</p>
          <p><span className="font-semibold text-[#1a1c1c]">{item.requiredSkillsCount}</span> kỹ năng yêu cầu</p>
          <p><span className="font-semibold text-[#1a1c1c]">{item.applicationsCount}</span> hồ sơ ứng tuyển</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      renderCell: (item) => (
        <div className="space-y-2">
          <span className={`badge ${statusBadge(item.status)}`}>
            {item.status === "PendingApproval" ? "Chờ duyệt" : item.status === "Approved" ? "Đã duyệt" : item.status === "Rejected" ? "Từ chối" : item.status}
          </span>
          <p className={`flex items-center gap-1 text-[12px] font-semibold ${item.isOverdue ? "text-[#ba1a1a]" : "text-[#5f5e5e]"}`}>
            <span className="material-symbols-outlined text-[15px]">{item.isOverdue ? "priority_high" : "schedule"}</span>
            {item.isOverdue ? "Cần ưu tiên xử lý" : "Trong thời hạn duyệt"}
          </p>
        </div>
      ),
    },
    {
      key: "action",
      header: "Thao tác",
      alignRight: true,
      headerClassName: "text-right",
      renderCell: (item) => (
        <button
          type="button"
          className="inline-flex items-center gap-1 text-[12px] font-bold text-[#b90014] transition-colors hover:underline"
          onClick={(event) => {
            event.stopPropagation();
            onOpen(item);
          }}
        >
          Xem bản nháp
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
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
        toast.error("Không thể tải hàng chờ duyệt.");
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
      <div className="app-container space-y-6 py-8">
        <div className="space-y-3">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="surface-card h-96" />
      </div>
    );
  }

  const summaryCards = [
    { label: "Job chờ duyệt", value: summary.pendingApprovals, helper: "Số lượng đang chờ quản lý quyết định", icon: "pending_actions", wrap: "from-sky-50 to-sky-100 text-sky-600", helperTone: "text-sky-700" },
    { label: "Gửi hôm nay", value: summary.submittedToday, helper: "Bản nháp mới của HR đi vào luồng duyệt", icon: "outbox", wrap: "from-[#f2efed] to-[#e8e4e1] text-[#5f5e5e]", helperTone: "text-[#5f5e5e]" },
    { label: "Quá hạn duyệt", value: summary.overdueReviews, helper: "Chờ quá 3 ngày", icon: "schedule", wrap: "from-rose-50 to-rose-100 text-rose-600", helperTone: "text-[#ba1a1a]", valueTone: "text-[#ba1a1a]" },
    { label: "Phòng ban đang chờ", value: summary.departmentsWaiting, helper: "Đơn vị đang có yêu cầu nhân sự chờ duyệt", icon: "domain", wrap: "from-[#fff1f0] to-[#ffdad6] text-[#b90014]", helperTone: "text-[#5f5e5e]" },
  ];

  return (
    <div className="app-container animate-fade-in py-8">
      <PageHeader
        className="mb-7"
        eyebrow="Quy trình duyệt tuyển dụng"
        icon="approval"
        title="Duyệt tin tuyển dụng"
        subtitle="Xem lại các job HR đã gửi lên, kiểm tra phạm vi tuyển dụng và kỹ năng, sau đó duyệt, từ chối hoặc trả lại để chỉnh sửa."
        actions={
          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-[#a8a4a2]">
              search
            </span>
            <input
              className="input-field pl-10"
              placeholder="Tìm theo tiêu đề, phòng ban, kỹ năng..."
              type="text"
              value={keyword}
              onChange={(event) => {
                setPage(1);
                setKeyword(event.target.value);
              }}
            />
          </div>
        }
      />

      <div className="stagger mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="stat-card group">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="eyebrow">{card.label}</p>
                <h3 className={`mt-3 text-[34px] font-bold leading-none tracking-[-0.02em] ${card.valueTone ?? "text-[#1a1c1c]"}`}>
                  {card.value}
                </h3>
                <p className={`mt-2.5 text-[12px] leading-5 ${card.helperTone}`}>{card.helper}</p>
              </div>
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br ${card.wrap} transition-transform duration-200 group-hover:scale-105`}>
                <span className="material-symbols-outlined">{card.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#f0eceb] px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h4 className="section-title">Hàng chờ duyệt</h4>
            <p className="mt-1 text-[13px] text-[#5f5e5e]">
              Mở bản nháp để kiểm tra bối cảnh phòng ban, kỹ năng và tác động luồng tuyển trước khi đăng.
            </p>
          </div>
          <p className="shrink-0 text-[12px] font-semibold text-[#5f5e5e]">
            Hiển thị <span className="text-[#1a1c1c]">{rangeStart}-{rangeEnd}</span> trên tổng <span className="text-[#1a1c1c]">{totalItems}</span>
          </p>
        </div>

        <CommonTable
          columns={columns}
          data={items}
          keyExtractor={(item) => item.jobId}
          loading={loading}
          emptyMessage="Không có job nào đang chờ quản lý duyệt."
          emptyIcon="approval"
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
