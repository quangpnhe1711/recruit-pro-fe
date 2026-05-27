import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

type InterviewMode = "video" | "inPerson";

type CandidateSummary = {
  name: string;
  roleLabel: string;
  appliedFor: string;
  avatarSrc: string;
};

type Interviewer = {
  id: string;
  name: string;
  title: string;
  avatarSrc: string;
  busySlotsByDate: Record<string, number[]>; // key: YYYY-MM-DD, value: slot minutes
};

type DraftSchedule = {
  id: string;
  status: "draft" | "confirmed";
  dateKey: string;
  startMinutes: number;
  durationMinutes: number;
  mode: InterviewMode;
  locationOrLink: string;
  interviewerId: string;
};

const DEFAULT_DATE = new Date(2024, 7, 6); // Aug 6, 2024

const candidate: CandidateSummary = {
  name: "Alexander Pierce",
  roleLabel: "Sr. DevOps Engineer",
  appliedFor: "Infrastructure Lead (ID: #4421)",
  avatarSrc:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBpE2poTJDVUYbdptk6qxqKk8D8FiXoX6dRc1qU-QaLoDtk265xfOYPFFI7EKhHytxFmqOL3ecSc27QcaggdA8xhi52u8Uhzb7DXjS4X4O_z2H5BBg5KQgIO_KMpn9dpxqTMYPEyHHKXJZfsZ_2P1Y34RfiSNH0-zufaNh2hF5Di5ep3AX_lQLepUbUCJNbIHcBpG2GwlXhm8Aqx-Yl455csnFdeqBoCnESjzp7leiifsrgyaUlUb6rgDhsdD-yVXJEuV7c9VBLLg",
};

const interviewers: Interviewer[] = [
  {
    id: "jenkins",
    name: "Sarah Jenkins",
    title: "Director of Engineering",
    avatarSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA2FCe2T-_Pl7y3ZICmK32o1HD7q6UkG0d_eV5tA-JBAtZnr_MsrzX-KwHr8FiPxOMVbMO7EHfVo3PSO_DvbrWyc_hQeZ0C5onrz_2q7wCuvgodIb-sNDOE1Id7Ks9myzteKUVscQIC4_wl0zzYgwlZTqaNnf5fBVAg_vKbdD1jcNgN2aFEOF6IrECEXGcJeedVUfHjjlpLuUKTbBKdsiMdLtTNowFslf5eLAicqRJ3Ue6PJvA7X0KcmFLsCsdxl3rxFHIOmpfuIw",
    busySlotsByDate: {
      "2024-08-06": [17 * 60], // 05:00 PM
    },
  },
  {
    id: "patel",
    name: "Ravi Patel",
    title: "Engineering Manager",
    avatarSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDgWXtaTN_CmW7ZGNOmJSx-bOFYyJp-ptms89pPgELQ5cEHsjTdEKG0A2MhF5SwP02Pl7syVDCaqFHQOpZ3FS-0R4h7DXIuotWAaD0X04zfgTi4K_wBGznSSPc810CXG7ZRSL9n7ts_i8PSmaD9HrrevzLPle7UDLrm0lTsjx1Cb6XsCrATNNWvBzY1J-Z8A9jpATG301RmcrqVCgDp2QaOdjD2lIDdovsCc4YWuWbQ7JFpbdt9o2sYYWA7pkWX1G68n-U2-_qZ9w",
    busySlotsByDate: {
      "2024-08-06": [10 * 60, 14 * 60 + 30], // 10:00 AM, 02:30 PM
    },
  },
];

const slotMinutes: number[] = [
  9 * 60,
  10 * 60,
  11 * 60,
  11 * 60 + 30,
  13 * 60,
  14 * 60 + 30,
  16 * 60,
  17 * 60,
];

function pad2(value: number) {
  return value.toString().padStart(2, "0");
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function formatMonthYear(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatTime(minutes: number) {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h24 >= 12 ? "PM" : "AM";
  const h12Raw = h24 % 12;
  const h12 = h12Raw === 0 ? 12 : h12Raw;
  return `${pad2(h12)}:${pad2(m)} ${suffix}`;
}

function addMinutes(minutes: number, add: number) {
  return minutes + add;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function dayOfWeekMondayFirst(date: Date) {
  // JS: 0=Sun..6=Sat → want 0=Mon..6=Sun
  const js = date.getDay();
  return (js + 6) % 7;
}

function buildCalendarGrid(viewMonth: Date) {
  const first = startOfMonth(viewMonth);
  const offset = dayOfWeekMondayFirst(first);
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - offset);

  const days: { date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push({ date: d, inMonth: d.getMonth() === viewMonth.getMonth() });
  }
  return days;
}

function InterviewScheduleScreen() {
  const navigate = useNavigate();

  const [viewMonth, setViewMonth] = useState<Date>(
    new Date(DEFAULT_DATE.getFullYear(), DEFAULT_DATE.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState<Date>(DEFAULT_DATE);
  const [selectedSlot, setSelectedSlot] = useState<number>(10 * 60);
  const [mode, setMode] = useState<InterviewMode>("video");
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [locationOrLink, setLocationOrLink] = useState<string>(
    "https://meet.recruitpro.int/x-abc-123"
  );
  const [interviewerIndex, setInterviewerIndex] = useState<number>(0);
  const [, setSavedSchedules] = useState<DraftSchedule[]>([]);

  const currentInterviewer = interviewers[interviewerIndex];
  const selectedDateKey = useMemo(() => toDateKey(selectedDate), [selectedDate]);

  const busySlots = useMemo(() => {
    return currentInterviewer.busySlotsByDate[selectedDateKey] ?? [];
  }, [currentInterviewer, selectedDateKey]);

  const isSlotDisabled = (slot: number) => busySlots.includes(slot);

  const isInterviewerFree = useMemo(() => {
    return !isSlotDisabled(selectedSlot);
  }, [busySlots, selectedSlot]);

  const calendarDays = useMemo(() => buildCalendarGrid(viewMonth), [viewMonth]);

  const endMinutes = useMemo(
    () => addMinutes(selectedSlot, durationMinutes),
    [selectedSlot, durationMinutes]
  );

  function onPickDay(date: Date) {
    setSelectedDate(date);

    const dateMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    if (
      dateMonth.getFullYear() !== viewMonth.getFullYear() ||
      dateMonth.getMonth() !== viewMonth.getMonth()
    ) {
      setViewMonth(dateMonth);
    }

    const nextDateKey = toDateKey(date);
    const nextBusy = currentInterviewer.busySlotsByDate[nextDateKey] ?? [];

    // If current slot becomes disabled for the new day, move to first available.
    if (nextBusy.includes(selectedSlot)) {
      const firstAvailable = slotMinutes.find((slot) => !nextBusy.includes(slot));
      if (firstAvailable !== undefined) setSelectedSlot(firstAvailable);
    }
  }

  function onSelectSlot(slot: number) {
    if (isSlotDisabled(slot)) return;
    setSelectedSlot(slot);
  }

  function onSwapInterviewer() {
    const next = (interviewerIndex + 1) % interviewers.length;
    setInterviewerIndex(next);

    const nextInterviewer = interviewers[next];
    const nextBusy = nextInterviewer.busySlotsByDate[selectedDateKey] ?? [];
    if (nextBusy.includes(selectedSlot)) {
      const firstAvailable = slotMinutes.find((slot) => !nextBusy.includes(slot));
      if (firstAvailable !== undefined) setSelectedSlot(firstAvailable);
    }
  }

  function saveSchedule(status: DraftSchedule["status"]) {
    if (!selectedSlot && selectedSlot !== 0) {
      toast.error("Please select a time slot.");
      return;
    }

    const schedule: DraftSchedule = {
      id: `${selectedDateKey}-${selectedSlot}-${Date.now()}`,
      status,
      dateKey: selectedDateKey,
      startMinutes: selectedSlot,
      durationMinutes,
      mode,
      locationOrLink,
      interviewerId: currentInterviewer.id,
    };

    setSavedSchedules((prev) => [schedule, ...prev]);

    if (status === "confirmed") {
      toast.success("Interview scheduled.");
    } else {
      toast.info("Draft saved.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-6 md:px-10">
            {/* Page toolbar (search removed) */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="text-[#b90014] transition-transform active:scale-95"
                onClick={() => navigate(-1)}
                aria-label="Go back"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <h1 className="text-[20px] font-semibold leading-7 text-[#b90014]">
                Schedule Interview
              </h1>
            </div>

            {/* Candidate summary */}
            <section className="flex flex-col gap-6 border border-[#e2e2e2] bg-white p-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-6">
                <img
                  alt={candidate.name}
                  className="h-16 w-16 rounded-lg object-cover"
                  src={candidate.avatarSrc}
                />

                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-[32px] font-semibold leading-10 tracking-[-0.01em]">
                      {candidate.name}
                    </h2>
                    <span className="rounded-sm bg-[#cde5ff] px-2 py-0.5 text-[12px] font-semibold tracking-[0.05em] text-[#004b74]">
                      {candidate.roleLabel}
                    </span>
                  </div>
                  <p className="mt-1 text-[14px] text-[#5f5e5e]">
                    Applied for:{" "}
                    <span className="font-semibold text-[#1a1c1c]">
                      {candidate.appliedFor}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  className="flex items-center gap-2 border border-[#1a1c1c] px-4 py-2 text-[14px] font-semibold text-[#1a1c1c] transition-colors hover:bg-[#eeeeee] active:scale-[0.98]"
                  onClick={() => navigate("/candidate/profile")}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    account_circle
                  </span>
                  View Profile
                </button>
              </div>
            </section>

            <div className="grid grid-cols-12 gap-6">
              {/* Left column */}
              <div className="col-span-12 space-y-6 lg:col-span-8">
                {/* Calendar + slots */}
                <section className="grid grid-cols-1 gap-6 border border-[#e2e2e2] bg-white p-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <h3 className="text-[20px] font-semibold leading-7">
                        {formatMonthYear(viewMonth)}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="text-[#5f5e5e] transition-transform active:scale-95"
                          onClick={() => setViewMonth((v) => addMonths(v, -1))}
                          aria-label="Previous month"
                        >
                          <span className="material-symbols-outlined">
                            chevron_left
                          </span>
                        </button>
                        <button
                          type="button"
                          className="text-[#5f5e5e] transition-transform active:scale-95"
                          onClick={() => setViewMonth((v) => addMonths(v, 1))}
                          aria-label="Next month"
                        >
                          <span className="material-symbols-outlined">
                            chevron_right
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 border-b border-[#eeeeee] pb-2 text-center text-[12px] font-semibold tracking-[0.05em] text-[#5f5e5e]">
                      {[
                        "Mo",
                        "Tu",
                        "We",
                        "Th",
                        "Fr",
                        "Sa",
                        "Su",
                      ].map((d) => (
                        <span key={d}>{d}</span>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-[14px] font-semibold">
                      {calendarDays.map(({ date, inMonth }) => {
                        const isSelected =
                          toDateKey(date) === toDateKey(selectedDate);
                        const baseClass =
                          "py-2 transition-colors active:scale-[0.98]";
                        const dim = inMonth
                          ? "hover:bg-[#eeeeee]"
                          : "text-[#c8c6c5]";
                        const selected = isSelected
                          ? "bg-[#b90014] text-white ring-2 ring-[#ffdad6]"
                          : dim;

                        return (
                          <button
                            key={toDateKey(date)}
                            type="button"
                            className={`${baseClass} ${selected}`}
                            onClick={() => onPickDay(date)}
                            aria-label={`Select ${formatDayLabel(date)}`}
                          >
                            {date.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[20px] font-semibold leading-7">
                      Available Slots
                    </h3>
                    <div className="grid h-[260px] grid-cols-2 gap-2 overflow-y-auto pr-2">
                      {slotMinutes.map((slot) => {
                        const selected = slot === selectedSlot;
                        const disabled = isSlotDisabled(slot);

                        const className = disabled
                          ? "cursor-not-allowed border border-[#e2e2e2] opacity-40"
                          : selected
                            ? "border-2 border-[#b90014] bg-[#ffdad6] font-bold text-[#b90014]"
                            : "border border-[#e2e2e2] text-[#5f5e5e] hover:border-[#b90014] hover:text-[#b90014]";

                        return (
                          <button
                            key={slot}
                            type="button"
                            className={`p-3 text-[12px] font-semibold tracking-[0.05em] transition-all active:scale-[0.98] ${className}`}
                            disabled={disabled}
                            onClick={() => onSelectSlot(slot)}
                          >
                            {formatTime(slot)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </section>

                {/* Interview configuration */}
                <section className="space-y-6 border border-[#e2e2e2] bg-white p-6">
                  <h3 className="text-[20px] font-semibold leading-7">
                    Interview Configuration
                  </h3>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                      <label className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5f5e5e]">
                        Interview Type
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          className={`flex items-center justify-center gap-2 py-3 transition-colors active:scale-[0.98] ${
                            mode === "video"
                              ? "border-2 border-[#b90014] bg-[#ffdad6] font-bold text-[#b90014]"
                              : "border border-[#e2e2e2] font-semibold text-[#5f5e5e] hover:border-[#1a1c1c] hover:text-[#1a1c1c]"
                          }`}
                          onClick={() => setMode("video")}
                        >
                          <span className="material-symbols-outlined">
                            videocam
                          </span>
                          Video
                        </button>

                        <button
                          type="button"
                          className={`flex items-center justify-center gap-2 py-3 transition-colors active:scale-[0.98] ${
                            mode === "inPerson"
                              ? "border-2 border-[#b90014] bg-[#ffdad6] font-bold text-[#b90014]"
                              : "border border-[#e2e2e2] font-semibold text-[#5f5e5e] hover:border-[#1a1c1c] hover:text-[#1a1c1c]"
                          }`}
                          onClick={() => setMode("inPerson")}
                        >
                          <span className="material-symbols-outlined">person</span>
                          In-person
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5f5e5e]">
                        Duration
                      </label>
                      <select
                        className="w-full border-2 border-[#e2e2e2] p-3 text-[14px] font-semibold outline-none focus:border-[#1a1c1c]"
                        value={durationMinutes}
                        onChange={(e) =>
                          setDurationMinutes(Number(e.target.value))
                        }
                      >
                        <option value={30}>30 Minutes</option>
                        <option value={60}>60 Minutes</option>
                        <option value={90}>90 Minutes</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5f5e5e]">
                      Conference Link / Location
                    </label>
                    <div className="flex">
                      <div className="flex items-center border border-[#e2e2e2] border-r-0 bg-[#f3f3f3] px-4">
                        <span className="material-symbols-outlined text-[#5f5e5e]">
                          link
                        </span>
                      </div>
                      <input
                        className="w-full border border-[#e2e2e2] bg-white px-4 py-3 font-mono text-[12px] text-[#1a1c1c] outline-none transition-colors focus:border-[#1a1c1c]"
                        value={locationOrLink}
                        onChange={(e) => setLocationOrLink(e.target.value)}
                        placeholder={
                          mode === "video"
                            ? "Paste conference link"
                            : "Enter office location"
                        }
                      />
                    </div>
                  </div>
                </section>
              </div>

              {/* Right column */}
              <div className="col-span-12 space-y-6 lg:col-span-4">
                <section className="border border-[#e2e2e2] bg-white p-6">
                  <h3 className="mb-6 text-[20px] font-semibold leading-7">
                    Assigned Interviewer
                  </h3>
                  <div className="mb-4 flex items-center gap-4 border border-[#e2e2e2] bg-[#f3f3f3] p-4">
                    <img
                      alt={currentInterviewer.name}
                      className="h-12 w-12 rounded-full object-cover"
                      src={currentInterviewer.avatarSrc}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">
                        {currentInterviewer.name}
                      </p>
                      <p className="text-[12px] text-[#5f5e5e]">
                        {currentInterviewer.title}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-[#b90014] transition-transform active:scale-95"
                      onClick={onSwapInterviewer}
                      aria-label="Swap interviewer"
                    >
                      <span className="material-symbols-outlined">
                        swap_horiz
                      </span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5f5e5e]">
                      Interviewer Availability
                    </p>
                    <div
                      className={`flex items-center gap-2 rounded-sm p-2 text-[14px] ${
                        isInterviewerFree
                          ? "bg-[#0079b9]/10 text-[#004b74]"
                          : "bg-[#ffdad6]/40 text-[#93000a]"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {isInterviewerFree ? "check_circle" : "error"}
                      </span>
                      {isInterviewerFree
                        ? "Free for selected time"
                        : "Busy for selected time"}
                    </div>
                  </div>
                </section>

                <section className="sticky top-6 border border-[#e2e2e2] bg-white p-6">
                  <h3 className="mb-6 text-[20px] font-semibold leading-7">
                    Session Summary
                  </h3>

                  <div className="mb-8 space-y-4">
                    <div className="flex justify-between border-b border-[#eeeeee] pb-2">
                      <span className="text-[14px] text-[#5f5e5e]">Date</span>
                      <span className="font-semibold">
                        {new Intl.DateTimeFormat("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }).format(selectedDate)}
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-[#eeeeee] pb-2">
                      <span className="text-[14px] text-[#5f5e5e]">Time</span>
                      <span className="font-semibold">
                        {formatTime(selectedSlot)} - {formatTime(endMinutes)}
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-[#eeeeee] pb-2">
                      <span className="text-[14px] text-[#5f5e5e]">Mode</span>
                      <span className="font-semibold">
                        {mode === "video" ? "Video Conference" : "In-person"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      type="button"
                      className="w-full bg-[#b90014] py-4 text-[20px] font-bold text-white shadow-lg transition-all hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => saveSchedule("confirmed")}
                      disabled={!isInterviewerFree}
                    >
                      Confirm Schedule
                    </button>

                    <button
                      type="button"
                      className="w-full border-2 border-[#1a1c1c] bg-transparent py-3 text-[14px] font-bold text-[#1a1c1c] transition-colors hover:bg-[#eeeeee] active:scale-95"
                      onClick={() => saveSchedule("draft")}
                    >
                      Save as Draft
                    </button>
                  </div>

                  <p className="mt-6 text-center text-[12px] font-semibold tracking-[0.05em] text-[#5f5e5e]">
                    <span className="material-symbols-outlined mr-1 text-[14px]">
                      info
                    </span>
                    Notification will be sent to both parties.
                  </p>

                </section>
              </div>
            </div>
    </div>
  );
}

export default InterviewScheduleScreen;
