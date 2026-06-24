import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AsyncActionButton from "../../common/components/AsyncActionButton";
import CommonSelect from "../../common/components/CommonSelect";
import CommonTable, { TableColumn } from "../../common/components/CommonTable";
import LoadingIndicator from "../../common/components/LoadingIndicator";
import { getInterviewTimingStatus } from "../../common/utils/interviewPresentation";
import { usePermissions } from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../permissions/permissions";
import { hrService } from "../../services/hr/hrService";

/* eslint-disable react-hooks/refs */

type InterviewStatus = "Scheduled" | "Completed" | "Canceled";

type Interview = {
  id: string;
  candidateName: string;
  candidateEmail: string;
  initials: string;
  jobTitle: string;
  interviewer: string;
  dateLabel: string; // e.g. "Oct 24, 2024"
  timeLabel: string; // e.g. "10:30 AM - 11:30 AM"
  startAt: number; // epoch ms
  endAt: number; // epoch ms
  status: InterviewStatus;
};

type Timeframe = "Next 7 Days" | "Last 30 Days" | "Custom Range";

type Range = { start: string; end: string };

const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  "Next 7 Days": "7 ngày tới",
  "Last 30 Days": "30 ngày qua",
  "Custom Range": "Tùy chọn ngày",
};

const STATUS_FILTER_ALL = "ALL_STATUSES";

const interviewStatusOptions = [
  { label: "Tất cả", value: STATUS_FILTER_ALL },
  { label: "Confirmed", value: "Scheduled" },
  { label: "Completed", value: "Completed" },
  { label: "Canceled", value: "Canceled" },
];

const timeframeOptions = [
  { label: TIMEFRAME_LABELS["Next 7 Days"], value: "Next 7 Days" },
  { label: TIMEFRAME_LABELS["Last 30 Days"], value: "Last 30 Days" },
  { label: TIMEFRAME_LABELS["Custom Range"], value: "Custom Range" },
];

const anchorNow = new Date();

function normalizeInterviewStatus(status: string): InterviewStatus {
  switch (status.trim().toLowerCase()) {
    case "completed":
      return "Completed";
    case "canceled":
    case "cancelled":
      return "Canceled";
    default:
      return "Scheduled";
  }
}

function parseDateAndTime(dateLabel: string, timeLabel: string) {
  // dateLabel is "Oct 24, 2024"; timeLabel is "10:30 AM - 11:30 AM"
  const [startTimeRaw, endTimeRaw] = timeLabel.split("-").map((s) => s.trim());
  const start = Date.parse(`${dateLabel} ${startTimeRaw}`);
  const end = Date.parse(`${dateLabel} ${endTimeRaw}`);

  return {
    startAt: Number.isNaN(start) ? Date.now() : start,
    endAt: Number.isNaN(end) ? Date.now() : end,
  };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function statusChip(status: InterviewStatus) {
  switch (status) {
    case "Scheduled":
      return "bg-[#005f93]/10 text-[#005f93]";
    case "Completed":
      return "bg-[#b90014]/10 text-[#b90014]";
    case "Canceled":
      return "bg-[#e2dfde] text-[#5f5e5e]";
    default:
      return "bg-[#e2dfde] text-[#5f5e5e]";
  }
}

function downloadTextFile(fileName: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toCsvValue(value: string) {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

function buildInterviewTableColumns(
  statusChipFn: (status: InterviewStatus) => string,
  openMenuId: string | null,
  setOpenMenuId: (id: string | null) => void,
  onViewDetails: (it: Interview) => void,
  onMarkCompleted: (it: Interview) => void,
  onReschedule: (it: Interview) => void,
  onCancel: (it: Interview) => void,
  menuRef: React.RefObject<HTMLDivElement>,
  actions: {
    canViewInterviews: boolean;
    canUpdateInterviews: boolean;
    canApproveInterviews: boolean;
    canDeleteInterviews: boolean;
  },
): TableColumn<Interview>[] {
  return [
    {
      key: "candidateName",
      header: "Ứng viên",
      renderCell: (item) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e2dfde] text-[12px] font-bold text-[#5f5e5e]">
            {item.initials}
          </div>
          <div>
            <p className="font-bold">{item.candidateName}</p>
            <p className="text-[12px] text-[#5f5e5e]">{item.candidateEmail}</p>
          </div>
        </div>
      ),
    },
    {
      key: "jobTitle",
      header: "Vị trí tuyển dụng",
      renderCell: (item) => item.jobTitle,
    },
    {
      key: "interviewer",
      header: "Người phỏng vấn",
      renderCell: (item) => item.interviewer,
    },
    {
      key: "dateLabel",
      header: "Ngày & giờ",
      renderCell: (item) => (
        <div>
          <p className="font-bold">{item.dateLabel}</p>
          <p className="text-[12px] text-[#5f5e5e]">{item.timeLabel}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      renderCell: (item) => {
        const timingStatus = getInterviewTimingStatus(
          item.startAt,
          item.endAt,
          item.status,
        );

        return (
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${statusChipFn(
                item.status,
              )}`}
            >
              {item.status}
            </span>
            {timingStatus ? (
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${timingStatus.className}`}
              >
                {timingStatus.label}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Thao tác",
      headerClassName: "text-right",
      alignRight: true,
      renderCell: (item) => {
        const canOpenActionsMenu =
          actions.canViewInterviews ||
          actions.canUpdateInterviews ||
          actions.canApproveInterviews ||
          actions.canDeleteInterviews;

        return (
          <div className="relative text-right">
            {canOpenActionsMenu ? (
              <button
                type="button"
                className="p-1 text-[#5f5e5e] hover:text-[#b90014]"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === item.id ? null : item.id);
                }}
                aria-label="Thao tác"
              >
                <span className="material-symbols-outlined">more_vert</span>
              </button>
            ) : null}

            {canOpenActionsMenu && openMenuId === item.id ? (
              <div
                ref={menuRef}
                className="absolute right-6 top-12 z-10 w-44 overflow-hidden rounded border border-[#e2dfde] bg-white shadow"
                onClick={(e) => e.stopPropagation()}
              >
                {actions.canViewInterviews ? (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-[12px] font-semibold hover:bg-[#f3f3f3]"
                    onClick={() => {
                      onViewDetails(item);
                      setOpenMenuId(null);
                    }}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      visibility
                    </span>
                    Xem chi tiết
                  </button>
                ) : null}
                {actions.canUpdateInterviews ? (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-[12px] font-semibold hover:bg-[#f3f3f3]"
                    onClick={() => onReschedule(item)}
                    disabled={item.status === "Completed"}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      schedule
                    </span>
                    Đổi lịch
                  </button>
                ) : null}
                {actions.canApproveInterviews ? (
                  <AsyncActionButton
                    type="button"
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-[12px] font-semibold hover:bg-[#f3f3f3]"
                    onClick={() => onMarkCompleted(item)}
                    loadingText=""
                    spinnerTone="brand"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      check_circle
                    </span>
                    Đánh dấu hoàn tất
                  </AsyncActionButton>
                ) : null}
                {actions.canDeleteInterviews ? (
                  <AsyncActionButton
                    type="button"
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-[12px] font-semibold text-[#ba1a1a] hover:bg-[#ffdad6]"
                    onClick={() => onCancel(item)}
                    loadingText=""
                    spinnerTone="brand"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      close
                    </span>
                    Hủy lịch
                  </AsyncActionButton>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      },
    },
  ];
}

function JobInterviewListScreen() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canViewInterviews = hasPermission(PERMISSIONS.INTERVIEW_VIEW_ALL);
  const canExportInterviews = hasPermission(PERMISSIONS.INTERVIEW_EXPORT);
  const canCreateInterviews = hasPermission(PERMISSIONS.INTERVIEW_CREATE);
  const canUpdateInterviews = hasPermission(PERMISSIONS.INTERVIEW_UPDATE);
  const canApproveInterviews = hasPermission(PERMISSIONS.INTERVIEW_APPROVE);
  const canDeleteInterviews = hasPermission(PERMISSIONS.INTERVIEW_DELETE);

  const [items, setItems] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>(STATUS_FILTER_ALL);
  const [timeframe, setTimeframe] = useState<Timeframe>("Next 7 Days");
  const [customRange, setCustomRange] = useState<Range>(() => {
    const start = new Date(anchorNow);
    const end = new Date(anchorNow);
    end.setUTCDate(end.getUTCDate() + 7);

    const toIso = (d: Date) => d.toISOString().slice(0, 10);
    return { start: toIso(start), end: toIso(end) };
  });

  const [page, setPage] = useState<number>(1);
  const pageSize = 5;

  const [openMenuForId, setOpenMenuForId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;

    hrService
      .getInterviews({ page: 1, pageSize: 1000 })
      .then((res) => {
        if (!mounted) return;

        setItems(
          (res.data?.items ?? []).map((item: any) => {
            const parsed = parseDateAndTime(item.dateLabel, item.timeLabel);
            return {
              id: item.id,
              candidateName: item.candidateName,
              candidateEmail: item.candidateEmail,
              initials: getInitials(item.candidateName),
              jobTitle: item.jobTitle,
              interviewer: item.interviewer,
              dateLabel: item.dateLabel,
              timeLabel: item.timeLabel,
              startAt: item.startAt ? Date.parse(item.startAt) : parsed.startAt,
              endAt: item.endAt ? Date.parse(item.endAt) : parsed.endAt,
              status: normalizeInterviewStatus(item.status),
            };
          }),
        );
      })
      .catch(() => {
        if (!mounted) return;
        setItems([]);
        toast.error("Không thể tải danh sách lịch phỏng vấn");
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!openMenuForId) return;
      const target = e.target as Node | null;
      if (menuRef.current && target && menuRef.current.contains(target)) return;
      setOpenMenuForId(null);
    }

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [openMenuForId]);

  const withinTimeframe = useCallback(
    (it: Interview) => {
      const t = it.startAt;

      if (timeframe === "Next 7 Days") {
        const start = anchorNow.getTime();
        const end = new Date(anchorNow).getTime() + 7 * 24 * 60 * 60 * 1000;
        return t >= start && t <= end;
      }

      if (timeframe === "Last 30 Days") {
        const end = anchorNow.getTime();
        const start = end - 30 * 24 * 60 * 60 * 1000;
        return t >= start && t <= end;
      }

      // Custom Range
      const start = Date.parse(`${customRange.start}T00:00:00.000Z`);
      const end = Date.parse(`${customRange.end}T23:59:59.999Z`);
      if (Number.isNaN(start) || Number.isNaN(end)) return true;
      return t >= start && t <= end;
    },
    [timeframe, customRange],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items
      .filter(withinTimeframe)
      .filter((it) => {
        if (statusFilter === STATUS_FILTER_ALL) return true;
        return it.status === statusFilter;
      })
      .filter((it) => {
        if (!q) return true;
        return (
          it.candidateName.toLowerCase().includes(q) ||
          it.candidateEmail.toLowerCase().includes(q) ||
          it.jobTitle.toLowerCase().includes(q) ||
          it.interviewer.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.startAt - b.startAt);
  }, [items, query, statusFilter, withinTimeframe]);

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
    const base = items.filter(withinTimeframe);
    const total = base.length;
    const actionNeeded = base.filter((x) => x.status === "Scheduled").length;
    const completed = base.filter((x) => x.status === "Completed").length;

    const completionRate =
      total === 0 ? 0 : Math.round((completed / total) * 100);

    return {
      total,
      actionNeeded,
      completionRate,
    };
  }, [items, withinTimeframe]);

  function goTo(next: number) {
    const safe = Math.max(1, Math.min(totalPages, next));
    setPage(safe);
  }

  useEffect(() => {
    // Reset paging when filters/search change
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [query, statusFilter, timeframe, customRange.start, customRange.end]);

  function exportCsv() {
    const header = [
      "Ứng viên",
      "Email",
      "Vị trí tuyển dụng",
      "Người phỏng vấn",
      "Ngày",
      "Giờ",
      "Trạng thái",
    ];

    const rows = filtered.map((it) => [
      toCsvValue(it.candidateName),
      toCsvValue(it.candidateEmail),
      toCsvValue(it.jobTitle),
      toCsvValue(it.interviewer),
      toCsvValue(it.dateLabel),
      toCsvValue(it.timeLabel),
      toCsvValue(it.status),
    ]);

    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadTextFile("interview_schedule.csv", csv, "text/csv");
    toast.success("Đã xuất file CSV.");
  }

  function openDetails(it: Interview) {
    toast.info(
      `Đang mở chi tiết buổi phỏng vấn: ${it.candidateName} · ${it.jobTitle}`,
    );
  }

  const markCompleted = useCallback(async (it: Interview) => {
    if (it.status === "Completed") {
      toast.info("Buổi phỏng vấn này đã hoàn tất.");
      return;
    }

    try {
      await hrService.updateInterviewStatus(it.id, "Completed");
      setItems((prev) =>
        prev.map((x) => (x.id === it.id ? { ...x, status: "Completed" } : x)),
      );
      toast.success("Đã đánh dấu hoàn tất.");
      setOpenMenuForId(null);
    } catch {
      toast.error("Không thể cập nhật trạng thái phỏng vấn");
    }
  }, []);

  const reschedule = useCallback(
    (it: Interview) => {
      setOpenMenuForId(null);
      toast.info("Đang mở lịch phỏng vấn...");
      navigate("/hr/interviews/schedule", {
        state: {
          candidateName: it.candidateName,
          candidateEmail: it.candidateEmail,
          jobTitle: it.jobTitle,
          interviewer: it.interviewer,
        },
      });
    },
    [navigate],
  );

  const cancelInterview = useCallback(async (it: Interview) => {
    const ok = window.confirm(
      `Bạn có chắc muốn hủy lịch phỏng vấn của ${it.candidateName}?`,
    );
    if (!ok) return;

    try {
      await hrService.deleteInterview(it.id);
      setItems((prev) => prev.filter((x) => x.id !== it.id));
      toast.info("Đã hủy lịch phỏng vấn.");
      setOpenMenuForId(null);
    } catch {
      toast.error("Không thể hủy lịch phỏng vấn");
    }
  }, []);

  const columns = useMemo(
    () =>
      buildInterviewTableColumns(
        statusChip,
        openMenuForId,
        setOpenMenuForId,
        openDetails,
        markCompleted,
        reschedule,
        cancelInterview,
        menuRef,
        {
          canViewInterviews,
          canUpdateInterviews,
          canApproveInterviews,
          canDeleteInterviews,
        },
      ),
    [
      openMenuForId,
      markCompleted,
      reschedule,
      cancelInterview,
      canViewInterviews,
      canUpdateInterviews,
      canApproveInterviews,
      canDeleteInterviews,
    ],
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center px-4 py-6 md:px-10">
        <LoadingIndicator label="Đang tải lịch phỏng vấn..." />
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 md:px-10">
      {/* Page header (title + local search) */}
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-6">
          <h2 className="text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#1a1c1c]">
            Danh sách Lịch phỏng vấn
          </h2>
        </div>

        <div className="flex items-center gap-2" />
      </div>

      {/* Filters & Stats */}
      <div className="mb-10 flex flex-col gap-6 md:flex-row">
        {/* Stats bento */}
        <div className="grid flex-1 grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="flex flex-col justify-between rounded-lg border border-[#e2dfde] bg-white p-6">
            <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">
              Tổng trong kỳ
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-[32px] font-semibold leading-10 tracking-[-0.01em]">
                {stats.total}
              </span>
              <span className="text-[12px] font-bold text-[#b90014]">+12%</span>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-lg border border-[#e2dfde] bg-white p-6">
            <span className="text-[12px] font-semibold text-[#5f5e5e]">
              Chờ xác nhận
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#b90014]">
                {stats.actionNeeded.toString().padStart(2, "0")}
              </span>
              <span className="text-[12px] font-bold text-[#5f5e5e]">
                Cần xử lý
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-lg border border-[#e2dfde] bg-white p-6">
            <span className="text-[12px] font-semibold text-[#5f5e5e]">
              Tỷ lệ hoàn tất
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-[32px] font-semibold leading-10 tracking-[-0.01em]">
                {stats.completionRate}%
              </span>
              <span className="text-[12px] font-bold text-[#005f93]">Tốt</span>
            </div>
          </div>
        </div>

        {/* Quick filters */}
        <div className="w-full space-y-4 rounded-lg border border-[#e2dfde] bg-white p-6 md:w-80">
          <h3 className="border-b border-[#e2dfde] pb-2 text-[16px] font-bold">
            Bộ lọc nhanh
          </h3>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-[#5f5e5e]">
                Trạng thái
              </label>
              <CommonSelect
                value={statusFilter}
                options={interviewStatusOptions}
                onValueChange={setStatusFilter}
                className="h-10 rounded border border-[#e7bdb8] bg-[#f3f3f3] text-[14px] shadow-none focus:border-[#1a1c1c] focus:ring-0"
                menuClassName="border-[#e7bdb8]"
              />
            </div>

            <div>
              <label className="mb-1 block text-[12px] font-semibold text-[#5f5e5e]">
                Thời gian
              </label>
              <CommonSelect
                value={timeframe}
                options={timeframeOptions}
                onValueChange={(value) => setTimeframe(value as Timeframe)}
                className="h-10 rounded border border-[#e7bdb8] bg-[#f3f3f3] text-[14px] shadow-none focus:border-[#1a1c1c] focus:ring-0"
                menuClassName="border-[#e7bdb8]"
              />
            </div>

            {timeframe === "Custom Range" ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-[#5f5e5e]">
                    Từ ngày
                  </label>
                  <input
                    type="date"
                    value={customRange.start}
                    onChange={(e) =>
                      setCustomRange((prev) => ({
                        ...prev,
                        start: e.target.value,
                      }))
                    }
                    className="w-full rounded border border-[#e7bdb8] bg-[#f3f3f3] p-2 text-[14px] focus:border-[#1a1c1c] focus:ring-0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-[#5f5e5e]">
                    Đến ngày
                  </label>
                  <input
                    type="date"
                    value={customRange.end}
                    onChange={(e) =>
                      setCustomRange((prev) => ({
                        ...prev,
                        end: e.target.value,
                      }))
                    }
                    className="w-full rounded border border-[#e7bdb8] bg-[#f3f3f3] p-2 text-[14px] focus:border-[#1a1c1c] focus:ring-0"
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[20px] font-bold text-[#1a1c1c]">
            Lịch phỏng vấn
          </h3>
          <div className="flex items-center gap-3">
            {canCreateInterviews ? (
              <button
                type="button"
                className="rounded border border-[#b90014] bg-white px-4 py-2 text-[12px] font-semibold text-[#b90014] transition-colors hover:bg-[#fff3f2]"
                onClick={() => {
                  toast.info("Đang mở form tạo lịch phỏng vấn");
                  navigate("/hr/interviews/schedule");
                }}
              >
                Tạo lịch phỏng vấn
              </button>
            ) : null}
            <button
              type="button"
              className="rounded bg-[#b90014] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#93000d]"
              onClick={exportCsv}
              disabled={!canExportInterviews}
            >
              Xuất CSV
            </button>
          </div>
        </div>

        <CommonTable
          columns={columns}
          data={pageSlice}
          keyExtractor={(item) => item.id}
          loading={false}
          emptyMessage="Không có lịch phỏng vấn phù hợp."
          zebra
          hover
          onRowClick={openDetails}
          showPagination
          pagination={{
            enabled: true,
            currentPage,
            totalPages,
            totalItems,
            rangeStart,
            rangeEnd,
            onPageChange: goTo,
          }}
          tableWrapperClassName="overflow-hidden rounded-lg border border-[#e2dfde] bg-white"
        />
      </div>
    </div>
  );
}

export default JobInterviewListScreen;
