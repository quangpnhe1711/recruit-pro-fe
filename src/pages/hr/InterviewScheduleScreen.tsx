import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { appToast, handleNonFormApiError } from "../../common/utils/appToast";
import { ERROR_CODES, normalizeApiError } from "../../common/utils/apiError";
import { applyApiFormError } from "../../common/utils/formErrors";
import {
  interviewScheduleSchema,
  validateWithSchema,
  type ValidationErrors,
} from "../../common/validation/formValidation";
import { InterviewStatus } from "../../common/status/interviewStatus";
import AsyncActionButton from "../../common/components/AsyncActionButton";
import CommonSelect from "../../common/components/CommonSelect";
import { Skeleton } from "../../common/components/Skeleton";
import PermissionGuard from "../../guards/PermissionGuard";
import { usePermissions } from "../../hooks/usePermissions";
import { getDateLocale, useI18n } from "../../i18n";
import { PERMISSIONS } from "../../permissions/permissions";
import { hrService, type HrInterviewScheduleDataDto } from "../../services/hr/hrService";

type InterviewMode = "video" | "inPerson";

type ScheduleRouteState = {
  applicationId?: string;
};

function pad2(value: number) {
  return value.toString().padStart(2, "0");
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function formatMonthYear(date: Date) {
  return new Intl.DateTimeFormat(getDateLocale(), {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat(getDateLocale(), {
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
  const { t } = useI18n();
  const routeState = location.state as ScheduleRouteState | null;
  const queryApplicationId = useMemo(
    () => new URLSearchParams(location.search).get("applicationId") ?? undefined,
    [location.search],
  );
  const requestedApplicationId = routeState?.applicationId ?? queryApplicationId;
  const { hasPermission } = usePermissions();
  const canViewScheduleData = hasPermission(PERMISSIONS.INTERVIEW_VIEW_SCHEDULE_DATA);
  // Scheduling an interview is an HR coordination action gated by INTERVIEW_CREATE only. It must NOT
  // also require INTERVIEW_APPROVE (a Manager-only permission) — that was the bug that left the confirm
  // button permanently disabled for HR, the role that actually schedules interviews.
  const canCreateInterview = hasPermission(PERMISSIONS.INTERVIEW_CREATE);

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
  const [formErrors, setFormErrors] = useState<ValidationErrors>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let mounted = true;

    if (!requestedApplicationId) {
      setScheduleData(null);
      setIsLoading(false);
      return () => {
        mounted = false;
      };
    }

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
          appToast.error(ERROR_CODES.EntityNotFound);
          return;
        }

        setScheduleData(data);

        const initialDate = resolveInitialDate();
        const nextDate = initialDate;
        const nextMonth = startOfMonth(nextDate);
        const nextInterviewerIndex = 0;

        setSelectedDate(nextDate);
        setViewMonth(nextMonth);
        setInterviewerIndex(nextInterviewerIndex);
        setMode("video");
        setDurationMinutes(60);
        setLocationOrLink("");

        const preferredSlot = null;
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
      .catch((error) => {
        if (!mounted) return;
        setScheduleData(null);
        handleNonFormApiError(error);
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
  const durationOptions = [
    { label: t("interviewSchedule.duration30"), value: "30" },
    { label: t("interviewSchedule.duration60"), value: "60" },
    { label: t("interviewSchedule.duration90"), value: "90" },
  ];
  const endMinutes = useMemo(
    () => (selectedSlot === null ? 0 : addMinutes(selectedSlot, durationMinutes)),
    [selectedSlot, durationMinutes],
  );

  // A single, visible reason the confirm button is disabled — no silent disabled button. Permission
  // is checked first, then the concrete form gaps (slot selection, interviewer availability, link).
  const confirmDisabledReason: string | null = !canCreateInterview
    ? t("interviewSchedule.noPermission")
    : selectedSlot === null
      ? t("interviewSchedule.selectSlotError")
      : !isInterviewerFree
        ? t("interviewSchedule.interviewerBusy")
        : !locationOrLink.trim()
          ? mode === "video"
            ? t("interviewSchedule.enterMeetingLink")
            : t("interviewSchedule.enterLocation")
          : null;

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

  async function saveSchedule() {
    if (!scheduleData || !currentInterviewer) {
      appToast.info(t("interviewSchedule.dataNotReady"));
      return;
    }

    setSubmitted(true);
    const schemaErrors = validateWithSchema(interviewScheduleSchema, {
      date: selectedDateKey,
      startMinutes: selectedSlot ?? -1,
      durationMinutes,
      mode,
      locationOrLink,
      interviewerId: currentInterviewer.id,
    });
    setFormErrors(schemaErrors);
    if (Object.keys(schemaErrors).length > 0) {
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
        // Persisted status is the canonical InterviewStatus.Scheduled, never the FE form token
        // "confirmed" (BR-APPLICATION-008 / STATE-MACHINE Interview).
        status: InterviewStatus.Scheduled,
      });
      appToast.success(t("interviewSchedule.saveSuccess"));
      navigate("/hr/interviews");
    } catch (error) {
      // Field-level errors (e.g. interviewDate → INTERVIEW_TIME_IN_PAST) render inline near the time
      // summary. Business/state errors (e.g. INTERVIEW_NOT_ACTIONABLE — BR-APPLICATION-008/INV-008)
      // and server/network errors fall back to a soft toast.
      const handled = applyApiFormError(error, {
        setFieldError: (field, message) =>
          setFormErrors((prev) => ({ ...prev, [field]: message })),
        fieldMap: { interviewDate: "startMinutes" },
      });
      if (handled) return;
      // Double-booking (409 CONFLICT): the interviewer already has an overlapping interview. Show it
      // inline on the time summary so HR can pick another slot/interviewer, not as a vague toast.
      if (normalizeApiError(error).code === ERROR_CODES.Conflict) {
        setFormErrors((prev) => ({ ...prev, startMinutes: t("interviewSchedule.slotConflict") }));
        return;
      }
      handleNonFormApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="app-container space-y-6 py-8">
        <Skeleton className="h-7 w-56" />
        <div className="surface-card p-6">
          <div className="flex items-center gap-5">
            <Skeleton className="h-16 w-16 rounded-[16px]" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-7 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 space-y-6 lg:col-span-8">
            <div className="surface-card h-80" />
            <div className="surface-card h-64" />
          </div>
          <div className="col-span-12 space-y-6 lg:col-span-4">
            <div className="surface-card h-48" />
            <div className="surface-card h-72" />
          </div>
        </div>
      </div>
    );
  }

  if (!scheduleData || !currentInterviewer) {
    const missingApplicationContext = !requestedApplicationId;

    return (
      <div className="app-container py-10">
        <div className="surface-card p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#fff1f0] to-[#ffe3e0] text-[#b90014]">
            <span className="material-symbols-outlined text-[32px]">event_busy</span>
          </div>
          <h2 className="mt-4 text-[20px] font-semibold text-[#1a1c1c]">
            {t("interviewSchedule.title")}
          </h2>
          <p className="mt-2 text-[14px] text-[#5f5e5e]">
            {missingApplicationContext
              ? t("interviewSchedule.missingApplicationContext")
              : t("interviewSchedule.noData")}
          </p>
          <button
            type="button"
            className="btn btn-secondary mt-6"
            onClick={() => navigate(missingApplicationContext ? "/hr/applications" : "/hr/interviews")}
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            {missingApplicationContext ? t("interviewSchedule.goToApplications") : t("interviewSchedule.backToInterviewList")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container animate-fade-in space-y-6 py-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#5f5e5e] transition-colors hover:bg-[#f7f6f5] hover:text-[#1a1c1c]"
          onClick={() => navigate(-1)}
          aria-label={t("common.back")}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <p className="eyebrow">{t("interviewSchedule.eyebrow")}</p>
          <h1 className="page-title">{t("interviewSchedule.title")}</h1>
        </div>
      </div>

      <section className="card flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[16px] bg-gradient-to-br from-[#fff1f0] to-[#ffdad6] text-[20px] font-bold text-[#b90014]">
            {scheduleData.candidate.avatarUrl ? (
              <img
                alt={scheduleData.candidate.name}
                className="h-16 w-16 rounded-[16px] object-cover"
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

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-[26px] font-semibold leading-8 tracking-[-0.01em] text-[#1a1c1c]">
                {scheduleData.candidate.name}
              </h2>
              <span className="badge bg-[#e6f1fb] text-[#005f93]">
                {scheduleData.candidate.roleLabel || t("roles.candidate")}
              </span>
            </div>
            <p className="mt-1 text-[14px] text-[#5f5e5e]">
              {t("interviewSchedule.appliedFor")}{" "}
              <span className="font-semibold text-[#1a1c1c]">
                {scheduleData.candidate.appliedFor}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <PermissionGuard permissions={PERMISSIONS.CANDIDATE_VIEW_DETAIL}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(`/hr/candidates/${scheduleData.candidate.id}`)}
            >
              <span className="material-symbols-outlined text-[18px]">
                account_circle
              </span>
              {t("candidateList.viewProfile")}
            </button>
          </PermissionGuard>
        </div>
      </section>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 space-y-6 lg:col-span-8">
          <section className="card grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="section-title">
                  {formatMonthYear(viewMonth)}
                </h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="text-[#5f5e5e] transition-transform active:scale-95"
                    onClick={() => setViewMonth((v) => addMonths(v, -1))}
                    aria-label={t("interviewSchedule.previousMonth")}
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button
                    type="button"
                    className="text-[#5f5e5e] transition-transform active:scale-95"
                    onClick={() => setViewMonth((v) => addMonths(v, 1))}
                    aria-label={t("interviewSchedule.nextMonth")}
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 border-b border-[#eeeeee] pb-2 text-center text-[12px] font-semibold tracking-[0.05em] text-[#5f5e5e]">
                {[t("interviewSchedule.weekdays.mon"), t("interviewSchedule.weekdays.tue"), t("interviewSchedule.weekdays.wed"), t("interviewSchedule.weekdays.thu"), t("interviewSchedule.weekdays.fri"), t("interviewSchedule.weekdays.sat"), t("interviewSchedule.weekdays.sun")].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[14px] font-semibold">
                {calendarDays.map(({ date, inMonth }) => {
                  const isSelected = toDateKey(date) === selectedDateKey;
                  const baseClass = "py-2 transition-colors active:scale-[0.98]";
                  const dim = inMonth ? "hover:bg-[#eeeeee]" : "text-[#c8c6c5]";
                  const selected = isSelected
                    ? "bg-gradient-to-br from-[#e8242c] to-[#c50f1b] text-white shadow-sm"
                    : dim;

                  return (
                    <button
                      key={toDateKey(date)}
                      type="button"
                      className={`${baseClass} rounded-[10px] ${selected}`}
                      onClick={() => onPickDay(date)}
                      aria-label={t("interviewSchedule.selectDate", { date: formatDayLabel(date) })}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="section-title">{t("interviewSchedule.availableSlots")}</h3>
              <div className="grid h-[260px] grid-cols-2 gap-2 overflow-y-auto pr-2">
                {slotMinutes.map((slot) => {
                  const selected = slot === selectedSlot;
                  const disabled = isSlotDisabled(slot);

                  const className = disabled
                    ? "cursor-not-allowed border border-[#ececec] text-[#a8a4a2] opacity-50"
                    : selected
                      ? "border border-[#b90014] bg-[#fff1f0] font-bold text-[#b90014] shadow-sm"
                      : "border border-[#ececec] text-[#5f5e5e] hover:border-[#b90014] hover:text-[#b90014]";

                  return (
                    <button
                      key={slot}
                      type="button"
                      className={`rounded-[10px] p-3 text-[12px] font-semibold tracking-[0.05em] transition-all active:scale-[0.98] ${className}`}
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

          <section className="card space-y-6 p-6">
            <h3 className="section-title">{t("interviewSchedule.configTitle")}</h3>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <label className="field-label">{t("interviewSchedule.mode")}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={`flex h-12 items-center justify-center gap-2 rounded-[10px] transition-colors active:scale-[0.98] ${
                      mode === "video"
                        ? "border border-[#b90014] bg-[#fff1f0] font-bold text-[#b90014] shadow-sm"
                        : "border border-[#ececec] font-semibold text-[#5f5e5e] hover:border-[#1a1c1c] hover:text-[#1a1c1c]"
                    }`}
                    onClick={() => setMode("video")}
                    >
                      <span className="material-symbols-outlined text-[20px]">videocam</span>
                    {t("interviewSchedule.videoMode")}
                  </button>

                  <button
                    type="button"
                    className={`flex h-12 items-center justify-center gap-2 rounded-[10px] transition-colors active:scale-[0.98] ${
                      mode === "inPerson"
                        ? "border border-[#b90014] bg-[#fff1f0] font-bold text-[#b90014] shadow-sm"
                        : "border border-[#ececec] font-semibold text-[#5f5e5e] hover:border-[#1a1c1c] hover:text-[#1a1c1c]"
                    }`}
                    onClick={() => setMode("inPerson")}
                    >
                      <span className="material-symbols-outlined text-[20px]">person</span>
                    {t("interviewSchedule.inPersonMode")}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="field-label">{t("interviewSchedule.duration")}</label>
                <CommonSelect
                  value={String(durationMinutes)}
                  options={durationOptions}
                  onValueChange={(value) => setDurationMinutes(Number(value))}
                  className="h-12 text-[14px] font-semibold"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="field-label">{t("interviewSchedule.locationOrLink")}</label>
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-[#a8a4a2]">
                  link
                </span>
                <input
                  className={`input-field pl-10 font-mono text-[13px] ${formErrors.locationOrLink ? "border-[#ba1a1a]" : ""}`}
                  value={locationOrLink}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setLocationOrLink(nextValue);
                    if (submitted) {
                      setFormErrors(
                        validateWithSchema(interviewScheduleSchema, {
                          date: selectedDateKey,
                          startMinutes: selectedSlot ?? -1,
                          durationMinutes,
                          mode,
                          locationOrLink: nextValue,
                          interviewerId: currentInterviewer.id,
                        }),
                      );
                    }
                  }}
                  placeholder={mode === "video" ? t("interviewSchedule.meetingLinkPlaceholder") : t("interviewSchedule.locationPlaceholder")}
                />
              </div>
              {formErrors.locationOrLink ? (
                <p className="text-[12px] text-[#ba1a1a]">{formErrors.locationOrLink}</p>
              ) : null}
            </div>
          </section>
        </div>

        <div className="col-span-12 space-y-6 lg:col-span-4">
          <section className="card p-6">
            <h3 className="section-title mb-5">{t("interviewSchedule.interviewerTitle")}</h3>
            <div className="mb-4 flex items-center gap-4 rounded-[14px] border border-[#ececec] bg-[#f7f6f5] p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-[14px] font-bold text-[#5f5e5e]">
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
                <p className="truncate font-bold text-[#1a1c1c]">{currentInterviewer.name}</p>
                <p className="text-[12px] text-[#5f5e5e]">{currentInterviewer.title}</p>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#b90014] transition-colors hover:bg-[#fff1f0] active:scale-95"
                onClick={onSwapInterviewer}
                aria-label={t("interviewSchedule.swapInterviewer")}
              >
                <span className="material-symbols-outlined">swap_horiz</span>
              </button>
            </div>

            <div className="space-y-2">
              <p className="field-label">{t("interviewSchedule.interviewerSchedule")}</p>
              <div
                className={`flex items-center gap-2 rounded-[10px] p-3 text-[13px] font-medium ${
                  isInterviewerFree
                    ? "bg-[#e6f1fb] text-[#005f93]"
                    : "bg-[#fff1f0] text-[#93000a]"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isInterviewerFree ? "check_circle" : "error"}
                </span>
                {isInterviewerFree ? t("interviewSchedule.interviewerFree") : t("interviewSchedule.interviewerBusyShort")}
              </div>
            </div>
          </section>

          <section className="card sticky top-6 p-6">
            <h3 className="section-title mb-5">{t("interviewSchedule.summaryTitle")}</h3>

            <div className="mb-6 space-y-3">
              <div className="flex justify-between border-b border-[#f0eceb] pb-3">
                <span className="text-[14px] text-[#5f5e5e]">{t("interviewSchedule.summaryDate")}</span>
                <span className="font-semibold text-[#1a1c1c]">
                  {new Intl.DateTimeFormat(getDateLocale(), {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }).format(selectedDate)}
                </span>
              </div>

              <div className="flex justify-between border-b border-[#f0eceb] pb-3">
                <span className="text-[14px] text-[#5f5e5e]">{t("interviewSchedule.summaryTime")}</span>
                <span className="font-semibold text-[#1a1c1c]">
                  {selectedSlot === null ? t("interviewSchedule.notSelected") : `${formatTime(selectedSlot)} - ${formatTime(endMinutes)}`}
                </span>
              </div>
              {formErrors.startMinutes ? (
                <p className="text-[12px] text-[#ba1a1a]">{formErrors.startMinutes}</p>
              ) : null}

              <div className="flex justify-between border-b border-[#f0eceb] pb-3">
                <span className="text-[14px] text-[#5f5e5e]">{t("interviewSchedule.summaryMode")}</span>
                <span className="font-semibold text-[#1a1c1c]">
                  {mode === "video" ? t("interviewSchedule.summaryVideoMode") : t("interviewSchedule.summaryInPersonMode")}
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              {confirmDisabledReason ? (
                <p className="flex items-center gap-1.5 rounded-[10px] bg-[#fff1f0] px-3 py-2 text-[12px] font-medium text-[#93000a]">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  {confirmDisabledReason}
                </p>
              ) : null}
              <AsyncActionButton
                type="button"
                className="btn btn-primary w-full justify-center py-3.5 text-[15px] disabled:cursor-not-allowed disabled:opacity-60"
                onClick={saveSchedule}
                disabled={confirmDisabledReason !== null || isSubmitting}
                loading={isSubmitting}
                loadingText={t("interviewSchedule.saving")}
              >
                <span className="material-symbols-outlined text-[18px]">event_available</span>
                {t("interviewSchedule.confirm")}
              </AsyncActionButton>
            </div>

            <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[12px] font-medium text-[#5f5e5e]">
              <span className="material-symbols-outlined text-[16px]">info</span>
              {t("interviewSchedule.notificationNote")}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default InterviewScheduleScreen;
