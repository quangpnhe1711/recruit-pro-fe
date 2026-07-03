import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useI18n } from "../../i18n";
import Badge from "../../common/components/Badge";
import EmptyState from "../../common/components/EmptyState";
import { Skeleton } from "../../common/components/Skeleton";
import { getInterviewTimingStatus } from "../../common/utils/interviewPresentation";
import {
  candidateService,
  type CandidateInterviewItemDto,
} from "../../services/candidate/candidateService";

function normalizeStatus(status: string, t: (key: string) => string) {
  switch (status.trim().toLowerCase()) {
    case "scheduled":
      return t("candidateInterviews.status.scheduled");
    case "completed":
      return t("candidateInterviews.status.completed");
    case "canceled":
    case "cancelled":
      return t("candidateInterviews.status.cancelled");
    default:
      return status || t("candidateInterviews.status.pending");
  }
}

function statusChip(status: string) {
  switch (status) {
    case "Đã lên lịch":
      return "border-sky-100 bg-sky-50 text-sky-700";
    case "Hoàn tất":
      return "border-green-100 bg-green-50 text-green-700";
    case "Đã hủy":
      return "border-stone-200 bg-stone-100 text-stone-700";
    default:
      return "border-[#e2dfde] bg-[#f3f3f3] text-[#5f5e5e]";
  }
}

function DetailTile({
  icon,
  label,
  value,
  helper,
  emptyValue,
}: {
  icon: string;
  label: string;
  value: string;
  helper?: string;
  emptyValue: string;
}) {
  return (
    <div className="rounded-[14px] border border-[#ececec] bg-[#faf8f8] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#fff1f0] to-[#ffdad6] text-[#b90014]">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <div className="min-w-0">
          <p className="eyebrow">{label}</p>
          <p className="mt-1 break-words text-[15px] font-semibold text-[#1a1c1c]">
            {value || emptyValue}
          </p>
          {helper ? (
            <p className="mt-1 text-[13px] leading-5 text-[#5f5e5e]">
              {helper}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CandidateInterviewScreen() {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState<CandidateInterviewItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(
    null,
  );
  const [currentTime] = useState(() => Date.now());

  const spotlightJobTitle = useMemo(
    () => new URLSearchParams(location.search).get("jobTitle")?.trim() ?? "",
    [location.search],
  );

  useEffect(() => {
    let mounted = true;

    candidateService
      .getInterviews()
      .then((response) => {
        if (!mounted) return;

        const nextItems = response.data ?? [];
        setItems(nextItems);

        const spotlightInterview = spotlightJobTitle
          ? nextItems.find(
              (item) =>
                item.jobTitle.trim().toLowerCase() ===
                spotlightJobTitle.toLowerCase(),
            ) ?? null
          : null;

        setSelectedInterviewId(
          spotlightInterview?.id ?? nextItems[0]?.id ?? null,
        );
      })
      .catch(() => {
        if (mounted) {
          toast.error(t("candidateInterviews.loadFailed"));
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [spotlightJobTitle, t]);

  const stats = useMemo(() => {
    const scheduled = items.filter(
      (item) => item.status.toLowerCase() === "scheduled",
    ).length;
    const completed = items.filter(
      (item) => item.status.toLowerCase() === "completed",
    ).length;
    const nextInterview = items
      .filter((item) => new Date(item.startAt).getTime() >= currentTime)
      .sort(
        (left, right) =>
          new Date(left.startAt).getTime() - new Date(right.startAt).getTime(),
      )[0];

    return { scheduled, completed, nextInterview };
  }, [currentTime, items]);

  const selectedInterview = useMemo(
    () => items.find((item) => item.id === selectedInterviewId) ?? null,
    [items, selectedInterviewId],
  );
  const selectedInterviewTimingStatus = useMemo(
    () =>
      selectedInterview
        ? getInterviewTimingStatus(
            selectedInterview.startAt,
            selectedInterview.endAt,
            selectedInterview.status,
          )
        : null,
    [selectedInterview],
  );

  if (loading) {
    return (
      <div className="app-container animate-fade-in py-8">
        <div className="space-y-3">
          <Skeleton className="h-9 w-60" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Skeleton className="h-24 w-full rounded-[16px]" />
          <Skeleton className="h-24 w-full rounded-[16px]" />
          <Skeleton className="h-24 w-full rounded-[16px]" />
        </div>
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
          <Skeleton className="h-80 w-full rounded-[16px]" />
          <Skeleton className="h-80 w-full rounded-[16px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="app-container animate-fade-in py-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow mb-1.5">{t("candidateInterviews.eyebrow")}</p>
          <h1 className="page-title">{t("candidateInterviews.title")}</h1>
          <p className="page-subtitle">{t("candidateInterviews.subtitle")}</p>
        </div>
        {spotlightJobTitle ? (
          <button
            className="btn btn-secondary w-fit"
            type="button"
            onClick={() => navigate("/candidate/my-applications")}
          >
            <span className="material-symbols-outlined text-[18px] text-[#b90014]">
              arrow_back
            </span>
            {t("candidateInterviews.backToApplications")}
          </button>
        ) : null}
      </div>

      {spotlightJobTitle ? (
        <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-[#ffdad6] bg-[#fff1f0] px-4 py-2 text-[13px] text-[#1a1c1c]">
          <span className="material-symbols-outlined text-[18px] text-[#b90014]">
            target
          </span>
          <span className="min-w-0 truncate">
            {t("candidateInterviews.filteredByJob", { jobTitle: spotlightJobTitle })}
          </span>
        </div>
      ) : null}

      <div className="stagger mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="stat-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[13px] font-semibold text-[#5f5e5e]">
                {t("candidateInterviews.stats.scheduled")}
              </p>
              <p className="mt-2 text-[36px] font-bold leading-none text-[#1a1c1c]">
                {stats.scheduled}
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#fff1f0] to-[#ffdad6] text-[#b90014]">
              <span className="material-symbols-outlined text-[24px]">
                event_upcoming
              </span>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[13px] font-semibold text-[#5f5e5e]">
                {t("candidateInterviews.stats.completed")}
              </p>
              <p className="mt-2 text-[36px] font-bold leading-none text-[#1a1c1c]">
                {stats.completed}
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#fff1f0] to-[#ffdad6] text-[#b90014]">
              <span className="material-symbols-outlined text-[24px]">
                task_alt
              </span>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-[#5f5e5e]">
                {t("candidateInterviews.stats.nearest")}
              </p>
              <p className="mt-2 truncate text-[17px] font-semibold text-[#1a1c1c]">
                {stats.nextInterview?.dateLabel ?? t("candidateInterviews.stats.nearestEmpty")}
              </p>
              <p className="mt-1 truncate text-[13px] text-[#8a8786]">
                {stats.nextInterview
                  ? `${stats.nextInterview.jobTitle} - ${stats.nextInterview.timeLabel}`
                  : t("candidateInterviews.stats.nearestHintEmpty")}
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#fff1f0] to-[#ffdad6] text-[#b90014]">
              <span className="material-symbols-outlined text-[24px]">
                schedule
              </span>
            </div>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="event_busy"
            title={t("candidateInterviews.emptyTitle")}
            description={t("candidateInterviews.emptyDescription")}
          />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#f0eceb] px-5 py-4">
              <h2 className="section-title">{t("candidateInterviews.listTitle")}</h2>
              <Badge tone="neutral">{t("candidateInterviews.scheduleCount", { count: items.length })}</Badge>
            </div>

            <div className="divide-y divide-[#f0eceb]">
              {items.map((item) => {
                const normalizedStatus = normalizeStatus(item.status, t);
                const timingStatus = getInterviewTimingStatus(
                  item.startAt,
                  item.endAt,
                  item.status,
                );
                const isSelected = item.id === selectedInterviewId;
                const isSpotlighted =
                  spotlightJobTitle &&
                  item.jobTitle.trim().toLowerCase() ===
                    spotlightJobTitle.toLowerCase();

                return (
                  <button
                    key={item.id}
                    className={`grid w-full gap-4 px-5 py-4 text-left transition-colors md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-center ${
                      isSelected
                        ? "bg-[#fff8f7] ring-1 ring-inset ring-[#ffdad6]"
                        : isSpotlighted
                          ? "bg-[#f4f9fd]"
                          : "bg-white hover:bg-[#faf8f8]"
                    }`}
                    type="button"
                    onClick={() => setSelectedInterviewId(item.id)}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[16px] font-semibold text-[#1a1c1c]">
                        {item.jobTitle}
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-[14px] text-[#5f5e5e]">
                        <span className="material-symbols-outlined text-[17px]">
                          schedule
                        </span>
                        {item.dateLabel} - {item.timeLabel}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="eyebrow">{t("candidateInterviews.detailInterviewer")}</p>
                      <p className="mt-1 truncate text-[14px] font-semibold text-[#1a1c1c]">
                        {item.interviewer || t("candidateInterviews.status.pending")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <span className={`badge ${statusChip(normalizedStatus)}`}>
                        {normalizedStatus}
                      </span>
                      {timingStatus ? (
                        <span className={`badge ${timingStatus.className}`}>
                          {timingStatus.label}
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="card p-5 xl:sticky xl:top-24 xl:self-start">
            <div className="mb-5">
              <p className="eyebrow mb-1.5">{t("candidateInterviews.detailEyebrow")}</p>
              <h3 className="text-[20px] font-semibold leading-7 tracking-[-0.01em] text-[#1a1c1c]">
                {selectedInterview?.jobTitle ?? t("candidateInterviews.selectPrompt")}
              </h3>
            </div>

            {selectedInterview ? (
              <div className="space-y-4">
                <DetailTile
                  icon="calendar_month"
                  label={t("candidateInterviews.detailDate")}
                  value={selectedInterview.dateLabel}
                  helper={selectedInterview.timeLabel}
                  emptyValue={t("candidateInterviews.status.pending")}
                />
                <DetailTile
                  icon="person"
                  label={t("candidateInterviews.detailInterviewer")}
                  value={selectedInterview.interviewer}
                  emptyValue={t("candidateInterviews.status.pending")}
                />
                <DetailTile
                  icon="work"
                  label={t("candidateInterviews.detailJob")}
                  value={selectedInterview.jobTitle}
                  emptyValue={t("candidateInterviews.status.pending")}
                />

                <div className="rounded-[14px] border border-[#ececec] bg-white p-4">
                  <p className="eyebrow">{t("common.status")}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`badge ${statusChip(normalizeStatus(selectedInterview.status, t))}`}
                    >
                      {normalizeStatus(selectedInterview.status, t)}
                    </span>
                    {selectedInterviewTimingStatus ? (
                      <span className={`badge ${selectedInterviewTimingStatus.className}`}>
                        {selectedInterviewTimingStatus.label}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-[14px] border border-[#ffdad6] bg-[#fff1f0] p-4">
                  <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-[#b90014]">
                    <span className="material-symbols-outlined text-[18px]">tips_and_updates</span>
                    {t("candidateInterviews.prepTitle")}
                  </p>
                  <ul className="mt-3 space-y-2 text-[14px] leading-6 text-[#1a1c1c]">
                    <li>{t("candidateInterviews.prep1")}</li>
                    <li>{t("candidateInterviews.prep2")}</li>
                    <li>{t("candidateInterviews.prep3")}</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="rounded-[14px] border border-dashed border-[#d6d1cf] p-5 text-[14px] text-[#5f5e5e]">
                {t("candidateInterviews.selectHint")}
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

export default CandidateInterviewScreen;
