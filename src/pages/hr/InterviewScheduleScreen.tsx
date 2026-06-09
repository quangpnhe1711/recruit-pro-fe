import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PermissionGuard from "../../guards/PermissionGuard";
import { usePermissions } from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../permissions/permissions";
import { hrService, type HrInterviewScheduleDataDto } from "../../services/hr/hrService";

type InterviewMode = "video" | "inPerson";

type ScheduleRouteState = {
  applicationId?: string;
};

type DraftInterviewSchedule = {
  applicationId: string;
  candidateId: string;
  jobId: string;
  date: string;
  startMinutes: number | null;
  durationMinutes: number;
  mode: InterviewMode;
  locationOrLink: string;
  interviewerId: string | null;
  savedAt: string;
};

const draftStorageKey = "rp_hr_interview_schedule_draft_v1";

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

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function loadDraft() {
  return safeJsonParse<DraftInterviewSchedule>(window.localStorage.getItem(draftStorageKey));
}

function isSameMonth(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

function resolveInitialDate() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function InterviewScheduleScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as ScheduleRouteState | null;
  const queryApplicationId = useMemo(
    () => new URLSearchParams(location.search).get("applicationId") ?? undefined,
    [location.search],
  );
  const requestedApplicationId = routeState?.applicationId ?? queryApplicationId;
  const { hasPermission } = usePermissions();
  const canViewScheduleData = hasPermission(PERMISSIONS.INTERVIEW_VIEW_SCHEDULE_DATA);
  const canCreateInterview = hasPermission(PERMISSIONS.INTERVIEW_CREATE);
  const canConfirmSchedule = hasPermission(PERMISSIONS.INTERVIEW_APPROVE);

  const [scheduleData, setScheduleData] = useState<HrInterviewScheduleDataDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [viewMonth, setViewMonth] = useState<Date>(() => startOfMonth(resolveInitialDate()));
  const [selectedDate, setSelectedDate] = useState<Date>(() => resolveInitialDate());
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [mode, setMode] = useState<InterviewMode>("video");
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [locationOrLink, setLocationOrLink] = useState<string>("");
  const [interviewerIndex, setInterviewerIndex] = useState<number>(0);

  useEffect(() => {
    let mounted = true;

    setIsLoading(true);
    hrService
      .getInterviewScheduleData(
        requestedApplicationId ? { applicationId: requestedApplicationId } : undefined,
      )
      .then((response) => {
        if (!mounted) return;

        const data = response.data;
        if (!data) {
          setScheduleData(null);
          toast.error("Unable to load interview schedule data.");
          return;
        }

        setScheduleData(data);

        const initialDate = resolveInitialDate();
        const draft = loadDraft();
        const draftMatchesApplication =
          draft?.applicationId === data.candidate.applicationId;

        const nextDate = draftMatchesApplication && draft?.date
          ? new Date(`${draft.date}T00:00:00`)
          : initialDate;
        const nextMonth = startOfMonth(nextDate);
        const nextInterviewerIndex = draftMatchesApplication && draft?.interviewerId
          ? Math.max(
              data.interviewers.findIndex((item) => item.id === draft.interviewerId),
              0,
            )
          : 0;

        setSelectedDate(nextDate);
        setViewMonth(nextMonth);
        setInterviewerIndex(nextInterviewerIndex);
        setMode(draftMatchesApplication ? draft.mode : "video");
        setDurationMinutes(draftMatchesApplication ? draft.durationMinutes : 60);
        setLocationOrLink(draftMatchesApplication ? draft.locationOrLink : "");

        const preferredSlot = draftMatchesApplication ? draft.startMinutes : null;
        const availableSlots = data.slotMinutes.filter((slot) => {
          const interviewer = data.interviewers[nextInterviewerIndex];
          const busy = interviewer?.busySlotsByDate[toDateKey(nextDate)] ?? [];
          return !busy.includes(slot);
        });
        setSelectedSlot(
          preferredSlot !== null && availableSlots.includes(preferredSlot)
            ? preferredSlot
            : availableSlots[0] ?? data.slotMinutes[0] ?? null,
        );
      })
      .catch(() => {
        if (!mounted) return;
        setScheduleData(null);
        toast.error("Unable to load interview schedule data.");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [requestedApplicationId]);

  const currentInterviewer = scheduleData?.interviewers[interviewerIndex] ?? null;
  const selectedDateKey = useMemo(() => toDateKey(selectedDate), [selectedDate]);
  const busySlots = useMemo(
    () => currentInterviewer?.busySlotsByDate[selectedDateKey] ?? [],
    [currentInterviewer, selectedDateKey],
  );
  const calendarDays = useMemo(() => buildCalendarGrid(viewMonth), [viewMonth]);
  const slotMinutes = scheduleData?.slotMinutes ?? [];
  const isSlotDisabled = (slot: number) => busySlots.includes(slot);
  const isInterviewerFree = selectedSlot !== null && !isSlotDisabled(selectedSlot);
  const endMinutes = useMemo(
    () => (selectedSlot === null ? 0 : addMinutes(selectedSlot, durationMinutes)),
    [selectedSlot, durationMinutes],
  );

  useEffect(() => {
    if (!slotMinutes.length) {
      setSelectedSlot(null);
      return;
    }

    if (selectedSlot !== null && !isSlotDisabled(selectedSlot)) return;

    const firstAvailable = slotMinutes.find((slot) => !isSlotDisabled(slot));
    setSelectedSlot(firstAvailable ?? slotMinutes[0] ?? null);
  }, [busySlots, selectedSlot, slotMinutes]);

  function onPickDay(date: Date) {
    setSelectedDate(date);
    if (!isSameMonth(date, viewMonth)) {
      setViewMonth(startOfMonth(date));
    }
  }

  function onSelectSlot(slot: number) {
    if (isSlotDisabled(slot)) return;
    setSelectedSlot(slot);
  }

  function onSwapInterviewer() {
    if (!scheduleData?.interviewers.length) return;
    setInterviewerIndex((prev) => (prev + 1) % scheduleData.interviewers.length);
  }

  function saveDraftLocally() {
    if (!scheduleData) return;

    const payload: DraftInterviewSchedule = {
      applicationId: scheduleData.candidate.applicationId,
      candidateId: scheduleData.candidate.id,
      jobId: scheduleData.candidate.jobId,
      date: selectedDateKey,
      startMinutes: selectedSlot,
      durationMinutes,
      mode,
      locationOrLink,
      interviewerId: currentInterviewer?.id ?? null,
      savedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(draftStorageKey, JSON.stringify(payload));
    toast.info("Draft saved locally.");
  }

  async function saveSchedule() {
    if (!scheduleData || !currentInterviewer) {
      toast.error("Schedule data is not ready yet.");
      return;
    }

    if (selectedSlot === null) {
      toast.error("Please select a time slot.");
      return;
    }

    if (!locationOrLink.trim()) {
      toast.error(mode === "video" ? "Please enter a conference link." : "Please enter a location.");
      return;
    }

    setIsSubmitting(true);
    try {
      await hrService.createInterview({
        candidateId: scheduleData.candidate.id,
        applicationId: scheduleData.candidate.applicationId,
        jobId: scheduleData.candidate.jobId,
        date: selectedDateKey,
        startMinutes: selectedSlot,
        durationMinutes,
        mode,
        locationOrLink: locationOrLink.trim(),
        interviewerId: currentInterviewer.id,
        status: "confirmed",
      });

      window.localStorage.removeItem(draftStorageKey);
      toast.success("Interview scheduled.");
      navigate("/hr/interviews");
    } catch {
      toast.error("Unable to schedule interview.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-10">
        <div className="rounded-lg border border-[#e2e2e2] bg-white p-6">
          <h1 className="text-[20px] font-semibold leading-7 text-[#b90014]">Schedule Interview</h1>
          <p className="mt-2 text-[14px] text-[#5f5e5e]">Loading schedule data...</p>
        </div>
      </div>
    );
  }

  if (!scheduleData || !currentInterviewer) {
    return (
      <div className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-10">
        <div className="rounded-lg border border-[#e2e2e2] bg-white p-6">
          <h1 className="text-[20px] font-semibold leading-7 text-[#b90014]">Schedule Interview</h1>
          <p className="mt-2 text-[14px] text-[#5f5e5e]">
            No scheduling context is available right now.
          </p>
          <button
            type="button"
            className="mt-6 rounded border border-[#1a1c1c] px-4 py-2 text-[14px] font-semibold text-[#1a1c1c] transition-colors hover:bg-[#eeeeee]"
            onClick={() => navigate("/hr/interviews")}
          >
            Back to Interviews
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-6 md:px-10">
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

      <section className="flex flex-col gap-6 border border-[#e2e2e2] bg-white p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#f3f3f3] text-[20px] font-bold text-[#5f5e5e]">
            {scheduleData.candidate.avatarUrl ? (
              <img
                alt={scheduleData.candidate.name}
                className="h-16 w-16 rounded-lg object-cover"
                src={scheduleData.candidate.avatarUrl}
              />
            ) : (
              scheduleData.candidate.name
                .split(" ")
                .filter(Boolean)
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-[32px] font-semibold leading-10 tracking-[-0.01em]">
                {scheduleData.candidate.name}
              </h2>
              <span className="rounded-sm bg-[#cde5ff] px-2 py-0.5 text-[12px] font-semibold tracking-[0.05em] text-[#004b74]">
                {scheduleData.candidate.roleLabel || "Candidate"}
              </span>
            </div>
            <p className="mt-1 text-[14px] text-[#5f5e5e]">
              Applied for:{" "}
              <span className="font-semibold text-[#1a1c1c]">
                {scheduleData.candidate.appliedFor}
              </span>
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <PermissionGuard permissions={PERMISSIONS.CANDIDATE_VIEW_DETAIL}>
            <button
              type="button"
              className="flex items-center gap-2 border border-[#1a1c1c] px-4 py-2 text-[14px] font-semibold text-[#1a1c1c] transition-colors hover:bg-[#eeeeee] active:scale-[0.98]"
              onClick={() => toast.info("Candidate detail route is not available yet.")}
            >
              <span className="material-symbols-outlined text-[20px]">
                account_circle
              </span>
              View Profile
            </button>
          </PermissionGuard>
        </div>
      </section>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 space-y-6 lg:col-span-8">
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
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button
                    type="button"
                    className="text-[#5f5e5e] transition-transform active:scale-95"
                    onClick={() => setViewMonth((v) => addMonths(v, 1))}
                    aria-label="Next month"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 border-b border-[#eeeeee] pb-2 text-center text-[12px] font-semibold tracking-[0.05em] text-[#5f5e5e]">
                {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[14px] font-semibold">
                {calendarDays.map(({ date, inMonth }) => {
                  const isSelected = toDateKey(date) === selectedDateKey;
                  const baseClass = "py-2 transition-colors active:scale-[0.98]";
                  const dim = inMonth ? "hover:bg-[#eeeeee]" : "text-[#c8c6c5]";
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
              <h3 className="text-[20px] font-semibold leading-7">Available Slots</h3>
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

          <section className="space-y-6 border border-[#e2e2e2] bg-white p-6">
            <h3 className="text-[20px] font-semibold leading-7">Interview Configuration</h3>

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
                    <span className="material-symbols-outlined">videocam</span>
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
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
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
                  <span className="material-symbols-outlined text-[#5f5e5e]">link</span>
                </div>
                <input
                  className="w-full border border-[#e2e2e2] bg-white px-4 py-3 font-mono text-[12px] text-[#1a1c1c] outline-none transition-colors focus:border-[#1a1c1c]"
                  value={locationOrLink}
                  onChange={(e) => setLocationOrLink(e.target.value)}
                  placeholder={mode === "video" ? "Paste conference link" : "Enter office location"}
                />
              </div>
            </div>
          </section>
        </div>

        <div className="col-span-12 space-y-6 lg:col-span-4">
          <section className="border border-[#e2e2e2] bg-white p-6">
            <h3 className="mb-6 text-[20px] font-semibold leading-7">Assigned Interviewer</h3>
            <div className="mb-4 flex items-center gap-4 border border-[#e2e2e2] bg-[#f3f3f3] p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[14px] font-bold text-[#5f5e5e]">
                {currentInterviewer.avatarUrl ? (
                  <img
                    alt={currentInterviewer.name}
                    className="h-12 w-12 rounded-full object-cover"
                    src={currentInterviewer.avatarUrl}
                  />
                ) : (
                  currentInterviewer.name
                    .split(" ")
                    .filter(Boolean)
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{currentInterviewer.name}</p>
                <p className="text-[12px] text-[#5f5e5e]">{currentInterviewer.title}</p>
              </div>
              <button
                type="button"
                className="text-[#b90014] transition-transform active:scale-95"
                onClick={onSwapInterviewer}
                aria-label="Swap interviewer"
              >
                <span className="material-symbols-outlined">swap_horiz</span>
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
                {isInterviewerFree ? "Free for selected time" : "Busy for selected time"}
              </div>
            </div>
          </section>

          <section className="sticky top-6 border border-[#e2e2e2] bg-white p-6">
            <h3 className="mb-6 text-[20px] font-semibold leading-7">Session Summary</h3>

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
                  {selectedSlot === null ? "Select a slot" : `${formatTime(selectedSlot)} - ${formatTime(endMinutes)}`}
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
                onClick={saveSchedule}
                disabled={
                  !canCreateInterview
                  || !canConfirmSchedule
                  || !isInterviewerFree
                  || selectedSlot === null
                  || isSubmitting
                }
              >
                {isSubmitting ? "Scheduling..." : "Confirm Schedule"}
              </button>

              <PermissionGuard permissions={PERMISSIONS.INTERVIEW_UPDATE}>
                <button
                  type="button"
                  className="w-full border-2 border-[#1a1c1c] bg-transparent py-3 text-[14px] font-bold text-[#1a1c1c] transition-colors hover:bg-[#eeeeee] active:scale-95"
                  onClick={saveDraftLocally}
                  disabled={!canViewScheduleData || isSubmitting}
                >
                  Save as Draft
                </button>
              </PermissionGuard>
            </div>

            <p className="mt-6 text-center text-[12px] font-semibold tracking-[0.05em] text-[#5f5e5e]">
              <span className="material-symbols-outlined mr-1 text-[14px]">info</span>
              Notification will be sent to both parties.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default InterviewScheduleScreen;
