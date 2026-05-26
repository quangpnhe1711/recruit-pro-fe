import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AppHeader from "../../common/components/layout/AppHeader";
import Footer from "../../common/components/layout/Footer";
import SideNavBar from "../../common/components/layout/SideNavBar";
import { setVariant } from "../../store/slices/authSlice";

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
  const parsed = safeJsonParse<unknown>(window.localStorage.getItem(interviewsStorageKey));
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((it) => {
      if (!it || typeof it !== "object") return null;
      const obj = it as Record<string, unknown>;

      const id = typeof obj.id === "string" ? obj.id : "";
      const candidateName = typeof obj.candidateName === "string" ? obj.candidateName : "";
      const candidateEmail = typeof obj.candidateEmail === "string" ? obj.candidateEmail : "";
      const initials = typeof obj.initials === "string" ? obj.initials : getInitials(candidateName);
      const jobTitle = typeof obj.jobTitle === "string" ? obj.jobTitle : "";
      const interviewer = typeof obj.interviewer === "string" ? obj.interviewer : "";
      const dateLabel = typeof obj.dateLabel === "string" ? obj.dateLabel : "";
      const timeLabel = typeof obj.timeLabel === "string" ? obj.timeLabel : "";
      const status =
        obj.status === "Confirmed" || obj.status === "Completed" || obj.status === "Rescheduled"
          ? (obj.status as InterviewStatus)
          : ("Confirmed" as const);

      if (!id || !candidateName || !candidateEmail || !jobTitle || !interviewer || !dateLabel || !timeLabel) {
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
  let seq = 1006;
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

    const startTime = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), startHour, startMin));
    const endTime = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), endHour, startMin));

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

function JobInterviewListScreen() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(setVariant("internal"));
  }, [dispatch]);

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
    function onDocClick(e: MouseEvent) {
      if (!openMenuForId) return;
      const target = e.target as Node | null;
      if (menuRef.current && target && menuRef.current.contains(target)) return;
      setOpenMenuForId(null);
    }

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [openMenuForId]);

  function withinTimeframe(it: Interview) {
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
  }

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
  }, [items, query, statusFilter, timeframe, customRange]);

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

    const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

    return {
      total,
      actionNeeded,
      completionRate,
    };
  }, [items, timeframe, customRange]);

  function goTo(next: number) {
    const safe = Math.max(1, Math.min(totalPages, next));
    setPage(safe);
  }

  useEffect(() => {
    // Reset paging when filters/search change
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
    toast.info(`Opening interview details: ${it.candidateName} · ${it.jobTitle}`);
  }

  function markCompleted(it: Interview) {
    if (it.status === "Completed") {
      toast.info("Already completed.");
      return;
    }

    setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, status: "Completed" } : x)));
    toast.success("Marked as completed.");
    setOpenMenuForId(null);
  }

  function reschedule(it: Interview) {
    setOpenMenuForId(null);
    toast.info("Rescheduling…");
    navigate("/internal/interviews/schedule", {
      state: {
        candidateName: it.candidateName,
        candidateEmail: it.candidateEmail,
        jobTitle: it.jobTitle,
        interviewer: it.interviewer,
      },
    });
  }

  function cancelInterview(it: Interview) {
    const ok = window.confirm(`Cancel interview for ${it.candidateName}?`);
    if (!ok) return;

    setItems((prev) => prev.filter((x) => x.id !== it.id));

    const stored = loadStoredInterviews();
    const remaining = stored.filter((x) => x.id !== it.id);
    writeStoredInterviews(remaining);

    toast.info("Interview cancelled.");
    setOpenMenuForId(null);
  }

  function saveLocalOverrides() {
    // Store only interviews that differ from the deterministic seed by id.
    // In practice: persist any interview currently visible in the list that is not a seed item.
    // To keep UX simple, we store all current items.
    writeStoredInterviews(items);
    toast.success("Changes saved locally.");
  }

  const visiblePageNumbers = useMemo(() => {
    const pages: number[] = [];
    const max = Math.min(totalPages, 3);
    const start = Math.max(1, Math.min(currentPage, totalPages - max + 1));
    for (let p = start; p < start + max; p += 1) pages.push(p);
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c]">
      <SideNavBar showUserCard={false} />

      <div className="flex min-h-screen flex-col lg:pl-64">
        {/* Header search removed by design; reuse common header */}
        <AppHeader userName="Alex Thompson" userRole="Senior HR Lead" />

        <main className="flex-1">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-10">
            {/* Page header (title + local search) */}
            <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-6">
                <h2 className="text-[20px] font-bold leading-7 text-[#b90014]">Interviews</h2>
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
                  <span className="text-[12px] font-semibold text-[#5f5e5e]">Total This Week</span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-[32px] font-semibold leading-10 tracking-[-0.01em]">
                      {stats.total}
                    </span>
                    <span className="text-[12px] font-bold text-[#b90014]">+12%</span>
                  </div>
                </div>

                <div className="flex flex-col justify-between rounded-lg border border-[#e2dfde] bg-white p-6">
                  <span className="text-[12px] font-semibold text-[#5f5e5e]">Awaiting Confirmation</span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#b90014]">
                      {stats.actionNeeded.toString().padStart(2, "0")}
                    </span>
                    <span className="text-[12px] font-bold text-[#5f5e5e]">Action Needed</span>
                  </div>
                </div>

                <div className="flex flex-col justify-between rounded-lg border border-[#e2dfde] bg-white p-6">
                  <span className="text-[12px] font-semibold text-[#5f5e5e]">Completion Rate</span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-[32px] font-semibold leading-10 tracking-[-0.01em]">
                      {stats.completionRate}%
                    </span>
                    <span className="text-[12px] font-bold text-[#005f93]">Excellent</span>
                  </div>
                </div>
              </div>

              {/* Quick filters */}
              <div className="w-full space-y-4 rounded-lg border border-[#e2dfde] bg-white p-6 md:w-80">
                <h3 className="border-b border-[#e2dfde] pb-2 text-[16px] font-bold">Quick Filters</h3>

                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[12px] font-semibold text-[#5f5e5e]">Status</label>
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
                    <label className="mb-1 block text-[12px] font-semibold text-[#5f5e5e]">Timeframe</label>
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
                        <label className="mb-1 block text-[12px] font-semibold text-[#5f5e5e]">Start</label>
                        <input
                          type="date"
                          value={customRange.start}
                          onChange={(e) => setCustomRange((prev) => ({ ...prev, start: e.target.value }))}
                          className="w-full rounded border border-[#e7bdb8] bg-[#f3f3f3] p-2 text-[14px] focus:border-[#1a1c1c] focus:ring-0"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[12px] font-semibold text-[#5f5e5e]">End</label>
                        <input
                          type="date"
                          value={customRange.end}
                          onChange={(e) => setCustomRange((prev) => ({ ...prev, end: e.target.value }))}
                          className="w-full rounded border border-[#e7bdb8] bg-[#f3f3f3] p-2 text-[14px] focus:border-[#1a1c1c] focus:ring-0"
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Table */}
            <section className="overflow-hidden rounded-lg border border-[#e2dfde] bg-white">
              <div className="flex items-center justify-between border-b border-[#e2dfde] bg-[#2f3131] p-6">
                <h3 className="font-bold text-white">Interview Schedule</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded bg-[#e2e2e2] px-3 py-1 text-[12px] font-semibold text-[#1a1c1c] hover:bg-white"
                    onClick={exportCsv}
                  >
                    Export CSV
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-[#1A1A1A] text-white">
                      <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.18em]">Candidate</th>
                      <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.18em]">Job Title</th>
                      <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.18em]">Interviewer</th>
                      <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.18em]">Date &amp; Time</th>
                      <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.18em]">Status</th>
                      <th className="px-6 py-4 text-right text-[12px] font-semibold uppercase tracking-[0.18em]">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="text-[14px]">
                    {pageSlice.map((it, idx) => {
                      const zebra = idx % 2 === 1 ? "bg-[#f9fafb]" : "bg-white";
                      return (
                        <tr
                          key={it.id}
                          className={`${zebra} border-b border-[#e2dfde] transition-colors hover:bg-[#b90014]/5`}
                          onClick={() => openDetails(it)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e2dfde] text-[12px] font-bold text-[#5f5e5e]">
                                {it.initials}
                              </div>
                              <div>
                                <p className="font-bold">{it.candidateName}</p>
                                <p className="text-[12px] text-[#5f5e5e]">{it.candidateEmail}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">{it.jobTitle}</td>
                          <td className="px-6 py-4">{it.interviewer}</td>
                          <td className="px-6 py-4">
                            <p className="font-bold">{it.dateLabel}</p>
                            <p className="text-[12px] text-[#5f5e5e]">{it.timeLabel}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${statusChip(
                                it.status
                              )}`}
                            >
                              {it.status}
                            </span>
                          </td>
                          <td className="relative px-6 py-4 text-right">
                            <button
                              type="button"
                              className="p-1 text-[#5f5e5e] hover:text-[#b90014]"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuForId((prev) => (prev === it.id ? null : it.id));
                              }}
                              aria-label="Actions"
                            >
                              <span className="material-symbols-outlined">more_vert</span>
                            </button>

                            {openMenuForId === it.id ? (
                              <div
                                ref={menuRef}
                                className="absolute right-6 top-12 z-10 w-44 overflow-hidden rounded border border-[#e2dfde] bg-white shadow"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-[12px] font-semibold hover:bg-[#f3f3f3]"
                                  onClick={() => {
                                    toast.info(`Interview: ${it.candidateName} · ${it.jobTitle}`);
                                    setOpenMenuForId(null);
                                  }}
                                >
                                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                                  View details
                                </button>
                                <button
                                  type="button"
                                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-[12px] font-semibold hover:bg-[#f3f3f3]"
                                  onClick={() => reschedule(it)}
                                  disabled={it.status === "Completed"}
                                >
                                  <span className="material-symbols-outlined text-[18px]">schedule</span>
                                  Reschedule
                                </button>
                                <button
                                  type="button"
                                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-[12px] font-semibold hover:bg-[#f3f3f3]"
                                  onClick={() => markCompleted(it)}
                                >
                                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                  Mark completed
                                </button>
                                <button
                                  type="button"
                                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-[12px] font-semibold text-[#ba1a1a] hover:bg-[#ffdad6]"
                                  onClick={() => cancelInterview(it)}
                                >
                                  <span className="material-symbols-outlined text-[18px]">close</span>
                                  Cancel
                                </button>
                              </div>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}

                    {pageSlice.length === 0 ? (
                      <tr>
                        <td className="px-6 py-10 text-center text-[14px] text-[#5f5e5e]" colSpan={6}>
                          No interviews found.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-[#e2dfde] p-4 text-[12px] font-semibold text-[#5f5e5e]">
                <span>
                  Showing {rangeStart}-{rangeEnd} of {totalItems} interviews
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded border border-[#e2dfde] p-2 hover:bg-[#f3f3f3]"
                    onClick={() => goTo(currentPage - 1)}
                    disabled={currentPage <= 1}
                    aria-label="Previous"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>

                  {visiblePageNumbers.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`rounded border border-[#e2dfde] p-2 ${
                        p === currentPage ? "bg-[#b90014] text-white" : "hover:bg-[#f3f3f3]"
                      }`}
                      onClick={() => goTo(p)}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    type="button"
                    className="rounded border border-[#e2dfde] p-2 hover:bg-[#f3f3f3]"
                    onClick={() => goTo(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    aria-label="Next"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>
              </div>
            </section>
          </div>
        </main>

        <Footer />

        {/* Floating action button */}
        <button
          type="button"
          className="fixed bottom-10 right-10 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#b90014] text-white shadow-lg transition-all hover:scale-105 active:scale-95"
          onClick={() => {
            toast.info("Create a new interview");
            navigate("/internal/interviews/schedule");
          }}
          aria-label="Add interview"
        >
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>
    </div>
  );
}

export default JobInterviewListScreen;
