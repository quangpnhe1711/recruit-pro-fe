import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import CommonTable, { TableColumn } from "../../common/components/CommonTable";
import LoadingIndicator from "../../common/components/LoadingIndicator";
import {
  formatApplicationStatus,
  getApplicationStatusBadgeClass,
} from "../../common/utils/applicationPresentation";
import type { ManagerReviewQueueItemDto } from "../../modules/jobs/jobsSchema";
import { hrService } from "../../services/hr/hrService";

function recommendationTone(recommendation: string) {
  switch (recommendation.toLowerCase()) {
    case "strong hire":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "hire":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "hold":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-red-50 text-red-700 border-red-200";
  }
}

function formatDate(value: string | null) {
  if (!value) return "Không có";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function buildColumns(onViewDetails: (item: ManagerReviewQueueItemDto) => void): TableColumn<ManagerReviewQueueItemDto>[] {
  return [
    {
      key: "candidateName",
      header: "Tên ứng viên",
      renderCell: (item) => (
        <div className="flex items-center gap-3">
          {item.candidateAvatarUrl ? (
            <img
              alt={item.candidateName}
              className="h-10 w-10 rounded-lg border border-[#e7bdb8] object-cover"
              src={item.candidateAvatarUrl}
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ffdad6] text-sm font-bold text-[#410002]">
              {item.candidateInitials}
            </div>
          )}
          <div>
            <p className="font-bold text-[#1a1c1c]">{item.candidateName}</p>
            <p className="text-[12px] text-[#5f5e5e]">{item.candidateLocation}</p>
          </div>
        </div>
      ),
    },
    {
      key: "jobTitle",
      header: "Vị trí tuyển dụng",
      renderCell: (item) => (
        <div>
          <p className="font-semibold text-[#1a1c1c]">{item.jobTitle}</p>
          <p className="text-[12px] text-[#5f5e5e]">Ứng tuyển {formatDate(item.appliedAt)}</p>
        </div>
      ),
    },
    {
      key: "score",
      header: "Điểm phù hợp",
      renderCell: (item) => (
        <div className="flex items-center gap-1">
          <span className="font-bold text-[#005f93]">{item.score.toFixed(1)}%</span>
          <span
            className="material-symbols-outlined text-[16px] text-[#005f93]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            star
          </span>
        </div>
      ),
    },
    {
      key: "recommendation",
      header: "Đề xuất đánh giá",
      renderCell: (item) => (
        <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${recommendationTone(item.recommendation)}`}>
          {item.recommendation}
        </span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái quy trình",
      renderCell: (item) => (
        <div className="space-y-1">
          <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${getApplicationStatusBadgeClass(item.status, "candidate")}`}>
            {formatApplicationStatus(item.status)}
          </span>
          <p className="text-[12px] text-[#5f5e5e]">
            {item.completedInterviews}/{item.totalInterviews} vòng phỏng vấn đã hoàn tất
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
          className="font-bold text-[#b90014] transition-colors hover:text-[#93000d] hover:underline"
          onClick={(event) => {
            event.stopPropagation();
            onViewDetails(item);
          }}
        >
          Xem chi tiết
        </button>
      ),
    },
  ];
}

function ManagerCandidateReviewListScreen() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ManagerReviewQueueItemDto[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [summary, setSummary] = useState({
    pendingFinalApprovals: 0,
    recommendedCount: 0,
    flaggedCount: 0,
    averageScore: 0,
  });

  useEffect(() => {
    let mounted = true;

    async function loadQueue() {
      setLoading(true);

      try {
        const response = await hrService.getManagerReviewQueue({
          page,
          pageSize: 8,
          keyword,
        });

        if (!mounted) return;

        const payload = response.data;
        setItems(payload?.items ?? []);
        setSummary(payload?.summary ?? {
          pendingFinalApprovals: 0,
          recommendedCount: 0,
          flaggedCount: 0,
          averageScore: 0,
        });
        setTotalPages(payload?.meta?.totalPages ?? 1);
        setTotalItems(payload?.meta?.totalItems ?? 0);
      } catch {
        if (!mounted) return;

        setItems([]);
        setSummary({
          pendingFinalApprovals: 0,
          recommendedCount: 0,
          flaggedCount: 0,
          averageScore: 0,
        });
        setTotalPages(1);
        setTotalItems(0);
        toast.error("Không thể tải hàng chờ đánh giá.");
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
    () => buildColumns((item) => navigate(`/manager/applications/${item.applicationId}`)),
    [navigate],
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center px-4 py-10 md:px-10">
        <LoadingIndicator label="Đang tải hàng chờ review..." />
      </div>
    );
  }

  function exportCurrentPage() {
    if (!items.length) {
      toast.info("Chưa có hồ sơ để xuất.");
      return;
    }

    const header = ["Candidate Name", "Job Title", "Score", "Recommendation", "Status"];
    const rows = items.map((item) => [
      item.candidateName,
      item.jobTitle,
      item.score.toFixed(1),
      item.recommendation,
      item.status,
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "manager-review-queue.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="w-full px-4 py-10 md:px-10">
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#1a1c1c]">
            Hàng chờ review cuối
          </h1>
          <p className="mt-1 text-[16px] leading-6 text-[#5f5e5e]">
            Các ứng viên đã đủ ngữ cảnh phỏng vấn và sẵn sàng cho bước review cuối của quản lý.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#5f5e5e]">
              search
            </span>
            <input
              className="w-full min-w-[280px] rounded-lg border border-[#e2dfde] bg-white py-3 pl-10 pr-4 text-sm outline-none transition-colors focus:border-[#1a1c1c]"
              placeholder="Tìm theo ứng viên hoặc tiêu đề job..."
              type="text"
              value={keyword}
              onChange={(event) => {
                setPage(1);
                setKeyword(event.target.value);
              }}
            />
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-[#e2dfde] bg-white px-4 py-3 text-sm font-semibold text-[#1a1c1c] transition-colors hover:bg-[#f3f3f3]"
            onClick={exportCurrentPage}
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Xuất CSV
          </button>
        </div>
      </div>

      <div className="mb-10 grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="flex items-center justify-between rounded-xl border border-[#e2dfde] bg-white p-6">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">
              Trạng thái xử lý
            </p>
            <p className="mt-3 text-[48px] font-bold leading-[56px] tracking-[-0.02em] text-[#b90014]">
              {summary.pendingFinalApprovals}
            </p>
            <p className="mt-2 text-sm text-[#5d3f3c]">
              Số hồ sơ đang chờ quyết định cuối trong hàng chờ hiện tại.
            </p>
          </div>

          <div className="flex gap-8 border-l border-[#e2dfde] pl-8">
            <div className="text-center">
              <p className="text-[20px] font-semibold text-[#005f93]">{summary.recommendedCount}</p>
              <p className="mt-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#5f5e5e]">
                Đề xuất
              </p>
            </div>
            <div className="text-center">
              <p className="text-[20px] font-semibold text-[#ba1a1a]">{summary.flaggedCount}</p>
              <p className="mt-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#5f5e5e]">
                Cần lưu ý
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-[#1a1a1a] p-6 text-white">
          <div className="flex items-start justify-between">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/70">
              Điểm trung bình
            </p>
            <span className="material-symbols-outlined text-[#b90014]">trending_up</span>
          </div>
          <p className="mt-8 text-[32px] font-semibold leading-10 tracking-[-0.01em]">
            {summary.averageScore.toFixed(1)} / 5.0
          </p>
          <p className="mt-2 text-sm text-white/70">
            Tính từ mức độ phù hợp kỹ năng, số vòng đã hoàn tất và độ đầy đủ ghi chú.
          </p>
        </div>
      </div>

      <CommonTable
        columns={columns}
        data={items}
        keyExtractor={(item) => item.applicationId}
        loading={loading}
        emptyMessage="Hiện chưa có ứng viên chờ quản lý review."
        zebra
        hover
        onRowClick={(item) => navigate(`/manager/applications/${item.applicationId}`)}
        tableWrapperClassName="overflow-hidden rounded-xl border border-[#e2dfde] bg-white"
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
    </div>
  );
}

export default ManagerCandidateReviewListScreen;
