import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import CommonTable, { TableColumn } from "../../common/components/CommonTable";
import { usePermissions } from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../permissions/permissions";
import { hrService } from "../../services/hr/hrService";

/* eslint-disable react-hooks/refs */

type InterviewStatus = "Confirmed" | "Completed" | "Rescheduled";

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

const anchorNow = new Date("2024-10-21T00:00:00.000Z");

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
    case "Confirmed":
      return "bg-[#005f93]/10 text-[#005f93]";
    case "Completed":
      return "bg-[#b90014]/10 text-[#b90014]";
    case "Rescheduled":
      return "bg-[#e2dfde] text-[#5f5e5e]";
    default:
      return "bg-[#e2dfde] text-[#5f5e5e]";
  }
}

const interviewsStorageKey = "rp_internal_interviews_v1";

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function loadStoredInterviews(): Interview[] {
  const parsed = safeJsonParse<unknown>(
    window.localStorage.getItem(interviewsStorageKey),
  );
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((it) => {
      if (!it || typeof it !== "object") return null;
      const obj = it as Record<string, unknown>;

      const id = typeof obj.id === "string" ? obj.id : "";
      const candidateName =
        typeof obj.candidateName === "string" ? obj.candidateName : "";
      const candidateEmail =
        typeof obj.candidateEmail === "string" ? obj.candidateEmail : "";
      const initials =
        typeof obj.initials === "string"
          ? obj.initials
          : getInitials(candidateName);
      const jobTitle = typeof obj.jobTitle === "string" ? obj.jobTitle : "";
      const interviewer =
        typeof obj.interviewer === "string" ? obj.interviewer : "";
      const dateLabel = typeof obj.dateLabel === "string" ? obj.dateLabel : "";
      const timeLabel = typeof obj.timeLabel === "string" ? obj.timeLabel : "";
      const status =
        obj.status === "Confirmed" ||
        obj.status === "Completed" ||
        obj.status === "Rescheduled"
          ? (obj.status as InterviewStatus)
          : ("Confirmed" as const);

      if (
        !id ||
        !candidateName ||
        !candidateEmail ||
        !jobTitle ||
        !interviewer ||
        !dateLabel ||
        !timeLabel
      ) {
        return null;
      }

      const { startAt, endAt } = parseDateAndTime(dateLabel, timeLabel);

      return {
        id,
        candidateName,
        candidateEmail,
        initials,
        jobTitle,
        interviewer,
        dateLabel,
        timeLabel,
        startAt: typeof obj.startAt === "number" ? obj.startAt : startAt,
        endAt: typeof obj.endAt === "number" ? obj.endAt : endAt,
        status,
      } satisfies Interview;
    })
    .filter(Boolean) as Interview[];
}

function writeStoredInterviews(items: Interview[]) {
  window.localStorage.setItem(interviewsStorageKey, JSON.stringify(items));
}

function buildSeedInterviews(): Interview[] {
  const fixedRaw: Omit<Interview, "startAt" | "endAt">[] = [
    {
      id: "IV-1001",
      candidateName: "Jane Doe",
      candidateEmail: "jane.doe@example.com",
      initials: "JD",
      jobTitle: "Senior UX Designer",
      interviewer: "Marcus Sterling",
      dateLabel: "Oct 24, 2024",
      timeLabel: "10:30 AM - 11:30 AM",
      status: "Confirmed",
    },
    {
      id: "IV-1002",
      candidateName: "Robert King",
      candidateEmail: "robert.k@startup.io",
      initials: "RK",
      jobTitle: "Lead Developer",
      interviewer: "Sarah Jenkins",
      dateLabel: "Oct 23, 2024",
      timeLabel: "02:00 PM - 03:00 PM",
      status: "Completed",
    },
    {
      id: "IV-1003",
      candidateName: "Alice Miller",
      candidateEmail: "alice.m@web.com",
      initials: "AM",
      jobTitle: "Product Manager",
      interviewer: "David Chen",
      dateLabel: "Oct 25, 2024",
      timeLabel: "11:00 AM - 12:00 PM",
      status: "Rescheduled",
    },
    {
      id: "IV-1004",
      candidateName: "Samuel Wright",
      candidateEmail: "s.wright@gmail.com",
      initials: "SW",
      jobTitle: "Marketing Specialist",
      interviewer: "Elena Rossi",
      dateLabel: "Oct 26, 2024",
      timeLabel: "09:00 AM - 10:00 AM",
      status: "Confirmed",
    },
    {
      id: "IV-1005",
      candidateName: "Peter Lawson",
      candidateEmail: "p.lawson@talent.net",
      initials: "PL",
      jobTitle: "Backend Developer",
      interviewer: "Marcus Sterling",
      dateLabel: "Oct 22, 2024",
      timeLabel: "03:30 PM - 04:30 PM",
      status: "Completed",
    },
  ];

  const names = [
    "Hannah Lee",
    "Noah Carter",
    "Sophia Nguyen",
    "Ethan Brooks",
    "Mia Patel",
    "Liam Turner",
    "Olivia Chen",
    "Ava Rodriguez",
    "Lucas Martin",
    "Isabella Clark",
  ];

  const jobs = [
    "Senior Frontend Engineer",
    "QA Automation Engineer",
    "Data Scientist - AI Focus",
    "Customer Success Lead",
    "Technical Writer",
    "Platform Engineer",
    "Product Designer",
    "DevOps Specialist",
  ];

  const interviewers = [
    "Marcus Sterling",
    "Sarah Jenkins",
    "David Chen",
    "Elena Rossi",
    "Priya Singh",
    "Omar Hassan",
  ];

  const statuses: InterviewStatus[] = ["Confirmed", "Completed", "Rescheduled"];

  const fillers: Interview[] = [];

  // Create up to 42 interviews total, distributed across the anchor week.
  const seq = 1006;
  for (let i = 0; i < 37; i += 1) {
    const candidateName = names[i % names.length];
    const jobTitle = jobs[i % jobs.length];
    const interviewer = interviewers[(i * 3) % interviewers.length];
    const status = statuses[i % statuses.length];

    const dayOffset = i % 7; // within 7 days
    const date = new Date(anchorNow);
    date.setUTCDate(date.getUTCDate() + dayOffset);

    const dateLabel = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);

    const startHour = 9 + ((i * 2) % 8); // 9..16
    const startMin = i % 2 === 0 ? 0 : 30;
    const endHour = startMin === 30 ? startHour + 1 : startHour + 1;

    const startTime = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        startHour,
        startMin,
      ),
    );
    const endTime = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        endHour,
        startMin,
      ),
    );

    const fmt = (d: Date) =>
      new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "UTC",
      }).format(d);

    const timeLabel = `${fmt(startTime)} - ${fmt(endTime)}`;

    const { startAt, endAt } = parseDateAndTime(dateLabel, timeLabel);

    const email = `${candidateName.toLowerCase().replace(/\s+/g, ".")}${i}@example.com`;

    fillers.push({
      id: `IV-${seq + i}`,
      candidateName,
      candidateEmail: email,
      initials: getInitials(candidateName),
      jobTitle,
      interviewer,
      dateLabel,
      timeLabel,
      startAt,
      endAt,
      status,
    });
  }

  const fixed: Interview[] = fixedRaw.map((r) => {
    const { startAt, endAt } = parseDateAndTime(r.dateLabel, r.timeLabel);
    return { ...r, startAt, endAt };
  });

  return [...fixed, ...fillers];
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
      header: "Candidate",
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
      header: "Job Title",
      renderCell: (item) => item.jobTitle,
    },
    {
      key: "interviewer",
      header: "Interviewer",
      renderCell: (item) => item.interviewer,
    },
    {
      key: "dateLabel",
      header: "Date & Time",
      renderCell: (item) => (
        <div>
          <p className="font-bold">{item.dateLabel}</p>
          <p className="text-[12px] text-[#5f5e5e]">{item.timeLabel}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      renderCell: (item) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${statusChipFn(
            item.status,
          )}`}
        >
          {item.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
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
                aria-label="Actions"
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
                    View details
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
                    Reschedule
                  </button>
                ) : null}
                {actions.canApproveInterviews ? (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-[12px] font-semibold hover:bg-[#f3f3f3]"
                    onClick={() => onMarkCompleted(item)}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      check_circle
                    </span>
                    Mark completed
                  </button>
                ) : null}
                {actions.canDeleteInterviews ? (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-[12px] font-semibold text-[#ba1a1a] hover:bg-[#ffdad6]"
                    onClick={() => onCancel(item)}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      close
                    </span>
                    Cancel
                  </button>
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

  const [items, setItems] = useState<Interview[]>(() => {
    const stored = loadStoredInterviews();
    const seed = buildSeedInterviews();
    const storedIds = new Set(stored.map((s) => s.id));
    return [...stored, ...seed.filter((s) => !storedIds.has(s.id))];
  });

  const [query, setQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All Statuses");
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
      .getInterviews()
      .then((res) => {
        if (!mounted || !res.data?.length) return;

        setItems(
          res.data.map((item: any) => {
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
              status: item.status,
            };
          }),
        );
      })
      .catch(() => undefined);

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

  const withinTimeframe = useCallback((it: Interview) => {
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
  }, [timeframe, customRange]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items
      .filter(withinTimeframe)
      .filter((it) => {
        if (statusFilter === "All Statuses") return true;
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
    const actionNeeded = base.filter((x) => x.status === "Rescheduled").length;
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
      "Candidate",
      "Email",
      "Job Title",
      "Interviewer",
      "Date",
      "Time",
      "Status",
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
    toast.success("Exported CSV.");
  }

  function openDetails(it: Interview) {
    toast.info(
      `Opening interview details: ${it.candidateName} · ${it.jobTitle}`,
    );
  }

  const markCompleted = useCallback((it: Interview) => {
    if (it.status === "Completed") {
      toast.info("Already completed.");
      return;
    }

    hrService
      .updateInterviewStatus(it.id, "Completed")
      .then(() => {
        setItems((prev) =>
          prev.map((x) => (x.id === it.id ? { ...x, status: "Completed" } : x)),
        );
        toast.success("Marked as completed.");
        setOpenMenuForId(null);
      })
      .catch(() => toast.error("Unable to update interview"));
  }, []);

  const reschedule = useCallback((it: Interview) => {
    setOpenMenuForId(null);
    toast.info("Rescheduling…");
    navigate("/hr/interviews/schedule", {
      state: {
        candidateName: it.candidateName,
        candidateEmail: it.candidateEmail,
        jobTitle: it.jobTitle,
        interviewer: it.interviewer,
      },
    });
  }, [navigate]);

  const cancelInterview = useCallback((it: Interview) => {
    const ok = window.confirm(`Cancel interview for ${it.candidateName}?`);
    if (!ok) return;

    hrService
      .deleteInterview(it.id)
      .then(() => {
        setItems((prev) => prev.filter((x) => x.id !== it.id));
        const stored = loadStoredInterviews();
        const remaining = stored.filter((x) => x.id !== it.id);
        writeStoredInterviews(remaining);
        toast.info("Interview cancelled.");
        setOpenMenuForId(null);
      })
      .catch(() => toast.error("Unable to cancel interview"));
  }, []);

  function saveLocalOverrides() {
    // Store only interviews that differ from the deterministic seed by id.
    // In practice: persist any interview currently visible in the list that is not a seed item.
    // To keep UX simple, we store all current items.
    writeStoredInterviews(items);
    toast.success("Changes saved locally.");
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-10">
      {/* Page header (title + local search) */}
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-6">
          <h2 className="text-[20px] font-bold leading-7 text-[#b90014]">
            Interviews
          </h2>
          <div className="relative transition-transform focus-within:scale-[1.02]">
            <span className="material-symbols-outlined absolute inset-y-0 left-3 flex items-center text-[#5f5e5e]">
              search
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search candidate or job..."
              className="w-64 rounded-lg bg-[#f3f3f3] py-2 pl-10 pr-4 text-[14px] outline-none transition-all focus:ring-2 focus:ring-[#b90014]"
              type="text"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded border border-[#e2dfde] bg-white px-4 py-2 text-[12px] font-semibold text-[#5f5e5e] hover:bg-[#f3f3f3]"
            onClick={saveLocalOverrides}
            disabled={!canUpdateInterviews}
          >
            Save
          </button>
        </div>
      </div>

      {/* Filters & Stats */}
      <div className="mb-10 flex flex-col gap-6 md:flex-row">
        {/* Stats bento */}
        <div className="grid flex-1 grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="flex flex-col justify-between rounded-lg border border-[#e2dfde] bg-white p-6">
            <span className="text-[12px] font-semibold text-[#5f5e5e]">
              Total This Week
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
              Awaiting Confirmation
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#b90014]">
                {stats.actionNeeded.toString().padStart(2, "0")}
              </span>
              <span className="text-[12px] font-bold text-[#5f5e5e]">
                Action Needed
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-lg border border-[#e2dfde] bg-white p-6">
            <span className="text-[12px] font-semibold text-[#5f5e5e]">
              Completion Rate
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-[32px] font-semibold leading-10 tracking-[-0.01em]">
                {stats.completionRate}%
              </span>
              <span className="text-[12px] font-bold text-[#005f93]">
                Excellent
              </span>
            </div>
          </div>
        </div>

        {/* Quick filters */}
        <div className="w-full space-y-4 rounded-lg border border-[#e2dfde] bg-white p-6 md:w-80">
          <h3 className="border-b border-[#e2dfde] pb-2 text-[16px] font-bold">
            Quick Filters
          </h3>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-[#5f5e5e]">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded border border-[#e7bdb8] bg-[#f3f3f3] p-2 text-[14px] focus:border-[#1a1c1c] focus:ring-0"
              >
                <option>All Statuses</option>
                <option>Confirmed</option>
                <option>Completed</option>
                <option>Rescheduled</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[12px] font-semibold text-[#5f5e5e]">
                Timeframe
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as Timeframe)}
                className="w-full rounded border border-[#e7bdb8] bg-[#f3f3f3] p-2 text-[14px] focus:border-[#1a1c1c] focus:ring-0"
              >
                <option>Next 7 Days</option>
                <option>Last 30 Days</option>
                <option>Custom Range</option>
              </select>
            </div>

            {timeframe === "Custom Range" ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-[#5f5e5e]">
                    Start
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
                    End
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
            Interview Schedule
          </h3>
          <div className="flex items-center gap-3">
            {canCreateInterviews ? (
              <button
                type="button"
                className="rounded border border-[#b90014] bg-white px-4 py-2 text-[12px] font-semibold text-[#b90014] transition-colors hover:bg-[#fff3f2]"
                onClick={() => {
                  toast.info("Create a new interview");
                  navigate("/hr/interviews/schedule");
                }}
              >
                Schedule Interview
              </button>
            ) : null}
            <button
              type="button"
              className="rounded bg-[#b90014] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#93000d]"
              onClick={exportCsv}
              disabled={!canExportInterviews}
            >
              Export CSV
            </button>
          </div>
        </div>

        <CommonTable
          columns={useMemo(
            () => {
                return buildInterviewTableColumns(
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
                );
              },
              [
                openDetails,
                openMenuForId,
                setOpenMenuForId,
                markCompleted,
                reschedule,
                cancelInterview,
                canViewInterviews,
                canUpdateInterviews,
                canApproveInterviews,
                canDeleteInterviews,
              ],
            )}
          data={pageSlice}
          keyExtractor={(item) => item.id}
          loading={false}
          emptyMessage="No interviews found."
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
