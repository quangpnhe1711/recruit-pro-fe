import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { appToast, handleNonFormApiError } from "../../common/utils/appToast";
import AsyncActionButton from "../../common/components/AsyncActionButton";
import CommonSelect from "../../common/components/CommonSelect";
import CommonTable, { TableColumn } from "../../common/components/CommonTable";
import PageHeader from "../../common/components/PageHeader";
import { Skeleton, SkeletonCard } from "../../common/components/Skeleton";
import {
  getInterviewTimingStatus,
  recommendationChipClass,
} from "../../common/utils/interviewPresentation";
import { usePermissions } from "../../hooks/usePermissions";
import { useI18n } from "../../i18n";
import { PERMISSIONS } from "../../permissions/permissions";
import { hrService } from "../../services/hr/hrService";
// ConfirmModal is the shared design-system dialog (lives with the sysadmin UI helpers).
import { ConfirmModal } from "../system-admin/automationUi";
import InterviewEvaluationModal, {
  type EvaluationSavedSummary,
} from "./InterviewEvaluationModal";

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
  candidateConfirmed: boolean; // candidate confirmed attendance (candidate_confirmed_at set)
  evaluationOverallScore: number | null; // post-interview scorecard summary
  evaluationRecommendation: string | null;
};

type Timeframe = "Next 7 Days" | "Last 30 Days" | "Custom Range";

type Range = { start: string; end: string };

const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  "Next 7 Days": "7 ngày tới",
  "Last 30 Days": "30 ngày qua",
  "Custom Range": "Tùy chọn ngày",
};

const STATUS_FILTER_ALL = "ALL_STATUSES";

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

// Single options object (not positional args): 10 positional params previously let two of
// them get swapped silently, which broke every column header.
function buildInterviewTableColumns({
  t,
  statusChipFn,
  openMenuId,
  setOpenMenuId,
  onViewDetails,
  onMarkCompleted,
  onReschedule,
  onCancel,
  onEvaluate,
  menuRef,
  actions,
}: {
  t: (key: string, vars?: Record<string, string | number>) => string;
  statusChipFn: (status: InterviewStatus) => string;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  onViewDetails: (it: Interview) => void;
  onMarkCompleted: (it: Interview) => void;
  onReschedule: (it: Interview) => void;
  onCancel: (it: Interview) => void;
  onEvaluate: (it: Interview) => void;
  menuRef: React.RefObject<HTMLDivElement>;
  actions: {
    canViewInterviews: boolean;
    canUpdateInterviews: boolean;
    canApproveInterviews: boolean;
    canDeleteInterviews: boolean;
  };
}): TableColumn<Interview>[] {
  return [
    {
      key: "candidateName",
      header: t("jobInterviewList.candidate"),
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
      header: t("jobInterviewList.jobTitle"),
      renderCell: (item) => item.jobTitle,
    },
    {
      key: "interviewer",
      header: t("jobInterviewList.interviewer"),
      renderCell: (item) => item.interviewer,
    },
    {
      key: "dateLabel",
      header: t("jobInterviewList.dateTime"),
      renderCell: (item) => (
        <div>
          <p className="font-bold">{item.dateLabel}</p>
          <p className="text-[12px] text-[#5f5e5e]">{item.timeLabel}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: t("common.status"),
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
            {item.status === "Scheduled" && item.candidateConfirmed ? (
              <span className="badge bg-emerald-50 text-emerald-700">
                {t("jobInterviewList.candidateConfirmed")}
              </span>
            ) : null}
            {item.evaluationOverallScore != null ? (
              <span
                className={`badge ${recommendationChipClass(item.evaluationRecommendation ?? "")}`}
              >
                {t("jobInterviewList.evaluationScore", {
                  score: item.evaluationOverallScore,
                })}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: t("common.actions"),
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
                aria-label={t("common.actions")}
              >
                <span className="material-symbols-outlined">more_vert</span>
              </button>
            ) : null}

            {canOpenActionsMenu && openMenuId === item.id ? (
              <div
                ref={menuRef}
                data-interview-actions-menu
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
                    {t("common.viewDetail")}
                  </button>
                ) : null}
                {actions.canUpdateInterviews ? (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-[12px] font-semibold hover:bg-[#f3f3f3]"
                    onClick={() => onReschedule(item)}
                    disabled={normalizeInterviewStatus(item.status) === "Completed"}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      schedule
                    </span>
                    {t("jobInterviewList.reschedule")}
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
                    {t("jobInterviewList.markCompleted")}
                  </AsyncActionButton>
                ) : null}
                {normalizeInterviewStatus(item.status) === "Completed" &&
                actions.canViewInterviews ? (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-[12px] font-semibold hover:bg-[#f3f3f3]"
                    onClick={() => {
                      onEvaluate(item);
                      setOpenMenuId(null);
                    }}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      rate_review
                    </span>
                    {t("jobInterviewList.evaluate")}
                  </button>
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
                    {t("jobInterviewList.cancelInterview")}
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
  const { t } = useI18n();
  const { hasPermission } = usePermissions();
  const canViewInterviews = hasPermission(PERMISSIONS.INTERVIEW_VIEW_ALL);
  const canExportInterviews = hasPermission(PERMISSIONS.INTERVIEW_EXPORT);
  const canCreateInterviews = hasPermission(PERMISSIONS.INTERVIEW_CREATE);
  const canUpdateInterviews = hasPermission(PERMISSIONS.INTERVIEW_UPDATE);
  const canApproveInterviews = hasPermission(PERMISSIONS.INTERVIEW_APPROVE);
  const canDeleteInterviews = hasPermission(PERMISSIONS.INTERVIEW_DELETE);
  const interviewStatusOptions = [
    { label: t("common.all"), value: STATUS_FILTER_ALL },
    { label: t("jobInterviewList.statusScheduled"), value: "Scheduled" },
    { label: t("jobInterviewList.statusCompleted"), value: "Completed" },
    { label: t("jobInterviewList.statusCanceled"), value: "Canceled" },
  ];
  const timeframeOptions = [
    { label: t("jobInterviewList.next7Days"), value: "Next 7 Days" },
    { label: t("jobInterviewList.last30Days"), value: "Last 30 Days" },
    { label: t("jobInterviewList.customRange"), value: "Custom Range" },
  ];

  const [items, setItems] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>(STATUS_FILTER_ALL);
  const [timeframe, setTimeframe] = useState<Timeframe>("Next 7 Days");
  const [customRange, setCustomRange] = useState<Range>(() => {
    const start = new Date(anchorNow);
    const end = new Date(anchorNow);
    end.setDate(end.getDate() + 7);

    // Use local date components to avoid UTC midnight shifting the date by ±1 day.
    const toLocalIso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { start: toLocalIso(start), end: toLocalIso(end) };
  });

  const [page, setPage] = useState<number>(1);
  const pageSize = 5;

  const [openMenuForId, setOpenMenuForId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Interview | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [evaluationTarget, setEvaluationTarget] = useState<Interview | null>(null);
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
              candidateConfirmed: Boolean(item.candidateConfirmedAt),
              evaluationOverallScore: item.evaluationOverallScore ?? null,
              evaluationRecommendation: item.evaluationRecommendation ?? null,
            };
          }),
        );
      })
      .catch((err) => {
        if (!mounted) return;
        setItems([]);
        handleNonFormApiError(err);
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
      // CommonTable renders the desktop table AND the mobile card list at the same time, so the
      // open menu exists TWICE and the shared menuRef only points at the copy mounted last (the
      // hidden one). A ref-containment check therefore treated clicks inside the visible menu as
      // "outside" and closed it on mousedown — before the item's click could ever fire. Checking
      // the event target's ancestry covers both copies.
      const target = e.target as Element | null;
      if (target && target.closest("[data-interview-actions-menu]")) return;
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
    const actionNeeded = base.filter((x) => normalizeInterviewStatus(x.status) === "Scheduled").length;
    const completed = base.filter((x) => normalizeInterviewStatus(x.status) === "Completed").length;

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
      t("jobInterviewList.candidate"),
      t("common.email"),
      t("jobInterviewList.jobTitle"),
      t("jobInterviewList.interviewer"),
      t("jobInterviewList.date"),
      t("jobInterviewList.time"),
      t("common.status"),
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
    appToast.success(t("jobInterviewList.exported"));
  }

  function openDetails(it: Interview) {
    // An interview always belongs to an application (required FK), so its meaningful "detail" is the
    // candidate's application review (CV, AI fit, decision, offer). Navigate straight there — no dead-end.
    navigate(`/hr/applications/${it.applicationId}`);
  }

  const markCompleted = useCallback(async (it: Interview) => {
    if (normalizeInterviewStatus(it.status) === "Completed") {
      appToast.info(t("jobInterviewList.alreadyCompleted"));
      return;
    }

    try {
      await hrService.updateInterviewStatus(it.id, "Completed");
      setItems((prev) =>
        prev.map((x) => (x.id === it.id ? { ...x, status: "Completed" } : x)),
      );
      appToast.success(t("jobInterviewList.completedSuccess"));
      setOpenMenuForId(null);
    } catch (err) {
      handleNonFormApiError(err);
    }
  }, []);

  const reschedule = useCallback(
    (it: Interview) => {
      setOpenMenuForId(null);
      appToast.info(t("jobInterviewList.openingSchedule"));
      navigate("/hr/interviews/schedule", {
        state: {
          applicationId: it.applicationId,
        },
      });
    },
    [navigate],
  );

  // Stage the target; the app ConfirmModal (bottom of the screen) runs the delete.
  const cancelInterview = useCallback((it: Interview) => {
    setCancelTarget(it);
    setOpenMenuForId(null);
  }, []);

  // Post-interview scorecard: opened from the actions menu for Completed interviews.
  const openEvaluation = useCallback((it: Interview) => {
    setEvaluationTarget(it);
    setOpenMenuForId(null);
  }, []);

  const handleEvaluationSaved = useCallback((summary: EvaluationSavedSummary) => {
    setItems((prev) =>
      prev.map((x) =>
        x.id === summary.interviewId
          ? {
              ...x,
              evaluationOverallScore: summary.overallScore,
              evaluationRecommendation: summary.recommendation,
            }
          : x,
      ),
    );
  }, []);

  const confirmCancelInterview = useCallback(async () => {
    if (!cancelTarget) return;
    setCanceling(true);
    try {
      await hrService.deleteInterview(cancelTarget.id);
      setItems((prev) => prev.filter((x) => x.id !== cancelTarget.id));
      appToast.success(t("jobInterviewList.canceled"));
      setCancelTarget(null);
    } catch (err) {
      handleNonFormApiError(err);
    } finally {
      setCanceling(false);
    }
  }, [cancelTarget, t]);

  const columns = useMemo(
    () =>
      buildInterviewTableColumns({
        t,
        statusChipFn: statusChip,
        openMenuId: openMenuForId,
        setOpenMenuId: setOpenMenuForId,
        onViewDetails: openDetails,
        onMarkCompleted: markCompleted,
        onReschedule: reschedule,
        onCancel: cancelInterview,
        onEvaluate: openEvaluation,
        menuRef,
        actions: {
          canViewInterviews,
          canUpdateInterviews,
          canApproveInterviews,
          canDeleteInterviews,
        },
      }),
    [
      openMenuForId,
      t,
      markCompleted,
      reschedule,
      cancelInterview,
      openEvaluation,
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
        eyebrow={t("jobInterviewList.eyebrow")}
        icon="event"
        title={t("jobInterviewList.title")}
        subtitle={t("jobInterviewList.subtitle")}
        className="mb-7"
        actions={
          <>
            {canCreateInterviews ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  appToast.info(t("jobInterviewList.selectApplicationFirst"));
                  navigate("/hr/applications");
                }}
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>{t("jobInterviewList.createSchedule")}</span>
              </button>
            ) : null}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={exportCsv}
              disabled={!canExportInterviews}
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>{t("jobInterviewList.exportCsv")}</span>
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
            <label className="field-label">{t("common.status")}</label>
            <CommonSelect
              value={statusFilter}
              options={interviewStatusOptions}
              onValueChange={setStatusFilter}
              className="h-[42px] text-sm"
            />
          </div>

          <div className="w-full lg:w-56">
            <label className="field-label">{t("common.time")}</label>
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
                <label className="field-label">{t("jobInterviewList.fromDate")}</label>
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
                <label className="field-label">{t("jobInterviewList.toDate")}</label>
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
        emptyMessage={t("jobInterviewList.empty")}
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

      <ConfirmModal
        open={cancelTarget != null}
        title={t("jobInterviewList.cancelInterview")}
        danger
        busy={canceling}
        confirmLabel={t("jobInterviewList.cancelInterview")}
        onConfirm={confirmCancelInterview}
        onClose={() => setCancelTarget(null)}
      >
        {cancelTarget
          ? t("jobInterviewList.cancelConfirm", { candidate: cancelTarget.candidateName })
          : null}
      </ConfirmModal>

      <InterviewEvaluationModal
        open={evaluationTarget != null}
        interview={
          evaluationTarget
            ? {
                id: evaluationTarget.id,
                candidateName: evaluationTarget.candidateName,
                jobTitle: evaluationTarget.jobTitle,
              }
            : null
        }
        canEdit={canUpdateInterviews || canApproveInterviews}
        onClose={() => setEvaluationTarget(null)}
        onSaved={handleEvaluationSaved}
      />
    </div>
  );
}

export default JobInterviewListScreen;
