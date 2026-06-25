import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AsyncActionButton from "../../common/components/AsyncActionButton";
import CommonSelect from "../../common/components/CommonSelect";
import CommonTable, { TableColumn } from "../../common/components/CommonTable";
import PageHeader from "../../common/components/PageHeader";
import { Skeleton, SkeletonCard } from "../../common/components/Skeleton";
import { getInterviewTimingStatus } from "../../common/utils/interviewPresentation";
import { usePermissions } from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../permissions/permissions";
import { hrService } from "../../services/hr/hrService";

/* eslint-disable react-hooks/refs */

type InterviewStatus = "Scheduled" | "Completed" | "Canceled";

type Interview = {
  id: string;
  applicationId: string;
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
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#fff1f0] to-[#ffdad6] text-[12px] font-bold text-[#b90014]">
            {item.initials}
          </div>
          <div>
            <p className="font-semibold text-[#1a1c1c]">{item.candidateName}</p>
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
            <span className={`badge ${statusChipFn(item.status)}`}>
              {item.status}
            </span>
            {timingStatus ? (
              <span className={`badge ${timingStatus.className}`}>
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
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#5f5e5e] transition-colors hover:bg-[#f7f6f5] hover:text-[#b90014]"
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
                className="absolute right-6 top-12 z-10 w-44 overflow-hidden rounded-[12px] border border-[#ececec] bg-white shadow-lg"
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
              applicationId: item.applicationId,
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
          applicationId: it.applicationId,
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

  const statCards = [
    {
      label: "Tổng trong kỳ",
      value: String(stats.total),
      helper: "Buổi phỏng vấn",
      icon: "event",
      iconWrap: "from-[#fff1f0] to-[#ffdad6] text-[#b90014]",
    },
    {
      label: "Chờ xác nhận",
      value: stats.actionNeeded.toString().padStart(2, "0"),
      helper: "Cần xử lý",
      icon: "pending_actions",
      iconWrap: "from-amber-50 to-amber-100 text-amber-600",
    },
    {
      label: "Tỷ lệ hoàn tất",
      value: `${stats.completionRate}%`,
      helper: "Đã hoàn tất",
      icon: "task_alt",
      iconWrap: "from-emerald-50 to-emerald-100 text-emerald-600",
    },
  ];

  if (loading) {
    return (
      <div className="app-container space-y-6 py-8">
        <div className="space-y-3">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="surface-card h-96" />
      </div>
    );
  }

  return (
    <div className="app-container animate-fade-in py-8">
      {/* Page header */}
      <PageHeader
        eyebrow="Phỏng vấn"
        icon="event"
        title="Danh sách lịch phỏng vấn"
        subtitle="Theo dõi, cập nhật và xuất lịch phỏng vấn trên toàn hệ thống."
        className="mb-7"
        actions={
          <>
            {canCreateInterviews ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  toast.info("Hãy chọn hồ sơ ứng tuyển để lên lịch phỏng vấn.");
                  navigate("/hr/applications");
                }}
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Tạo lịch phỏng vấn</span>
              </button>
            ) : null}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={exportCsv}
              disabled={!canExportInterviews}
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Xuất CSV</span>
            </button>
          </>
        }
      />

      {/* Stats */}
      <div className="stagger mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card group">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br ${card.iconWrap} transition-transform duration-200 group-hover:scale-105`}
              >
                <span className="material-symbols-outlined text-[24px]">
                  {card.icon}
                </span>
              </div>
              <div className="min-w-0">
                <p className="eyebrow">{card.label}</p>
                <h3 className="mt-2 text-[30px] font-bold leading-none tracking-[-0.02em] text-[#1a1c1c]">
                  {card.value}
                </h3>
                <p className="mt-2 text-[13px] leading-5 text-[#5f5e5e]">
                  {card.helper}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter / toolbar row */}
      <div className="card mb-4 flex flex-col gap-3 p-4 lg:flex-row lg:items-end">
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-1 lg:flex-row lg:items-end">
          <div className="w-full lg:w-56">
            <label className="field-label">Trạng thái</label>
            <CommonSelect
              value={statusFilter}
              options={interviewStatusOptions}
              onValueChange={setStatusFilter}
              className="h-[42px] text-sm"
            />
          </div>

          <div className="w-full lg:w-56">
            <label className="field-label">Thời gian</label>
            <CommonSelect
              value={timeframe}
              options={timeframeOptions}
              onValueChange={(value) => setTimeframe(value as Timeframe)}
              className="h-[42px] text-sm"
            />
          </div>

          {timeframe === "Custom Range" ? (
            <div className="grid w-full grid-cols-2 gap-3 lg:w-auto">
              <div>
                <label className="field-label">Từ ngày</label>
                <input
                  type="date"
                  value={customRange.start}
                  onChange={(e) =>
                    setCustomRange((prev) => ({
                      ...prev,
                      start: e.target.value,
                    }))
                  }
                  className="input-field"
                />
              </div>
              <div>
                <label className="field-label">Đến ngày</label>
                <input
                  type="date"
                  value={customRange.end}
                  onChange={(e) =>
                    setCustomRange((prev) => ({
                      ...prev,
                      end: e.target.value,
                    }))
                  }
                  className="input-field"
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Table */}
      <CommonTable
        columns={columns}
        data={pageSlice}
        keyExtractor={(item) => item.id}
        loading={false}
        emptyMessage="Không có lịch phỏng vấn phù hợp."
        emptyIcon="event_busy"
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
      />
    </div>
  );
}

export default JobInterviewListScreen;
