import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../../i18n";
import { appToast, handleNonFormApiError } from "../../common/utils/appToast";
import Badge from "../../common/components/Badge";
import CommonSelect from "../../common/components/CommonSelect";
import CommonTable, { TableColumn } from "../../common/components/CommonTable";
import CommonPagination from "../../common/components/CommonPagination";
import { Skeleton, SkeletonRows } from "../../common/components/Skeleton";
import { getInterviewTimingStatus } from "../../common/utils/interviewPresentation";
import { usePermissions } from "../../hooks/usePermissions";
import {
  getApplicationStatusFilterOptions,
} from "../../common/utils/applicationPresentation";
import { getApplicationStatusPresentation } from "../../common/status/statusPresentation";
import { normalizeApplicationStatus } from "../../common/status/applicationStatus";
import { PERMISSIONS } from "../../permissions/permissions";
import {
  candidateService,
  type CandidateApplicationItemDto,
  type CandidateInterviewItemDto,
} from "../../services/candidate/candidateService";

type ApplicationItem = {
  id: string;
  jobId: string;
  icon: string;
  title: string;
  department: string;
  appliedDate: string;
  appliedDateValue: string;
  status: string;
  statusKey: string;
  statusClass: string;
  nextStep: string;
  availableActions: string[];
  relatedInterviewCount: number;
};

function buildEmptySummaryCards(t: (key: string) => string) {
  return [
    { label: t("candidateApplications.summary.total"), value: 0 },
    { label: t("candidateApplications.summary.active"), value: 0 },
    { label: t("candidateApplications.summary.closed"), value: 0 },
  ];
}

function toJobKey(value: string) {
  return value.trim().toLowerCase();
}

function mapApplicationItem(
  item: CandidateApplicationItemDto,
  index: number,
  interviews: CandidateInterviewItemDto[],
) {
  // Drive presentation + logic off the canonical status key only — never the localized API text.
  // `getApplicationStatusPresentation` returns an English label (ManagerReview → "Head Review") and a
  // neutral "Unknown" for unrecognized values (never Rejected). `statusKey` is the lowercased canonical
  // value used for filtering / the interview check; unknown statuses key to "unknown".
  const presentation = getApplicationStatusPresentation(item.status);
  const canonicalStatus = normalizeApplicationStatus(item.status);
  const statusKey = canonicalStatus ? canonicalStatus.toLowerCase() : "unknown";
  const relatedInterviewCount = interviews.filter(
    (interview) => toJobKey(interview.jobTitle) === toJobKey(item.jobTitle),
  ).length;

  return {
    id: item.id,
    jobId: item.jobId,
    icon: ["work", "terminal", "star"][index % 3],
    title: item.jobTitle,
    department: item.companyOrDepartment,
    appliedDate: item.appliedDate
      ? new Date(item.appliedDate).toLocaleDateString("vi-VN")
      : "",
    appliedDateValue: item.appliedDate ?? "",
    status: presentation.label,
    statusKey,
    statusClass: presentation.badgeClassName,
    nextStep: item.nextStep,
    availableActions: item.availableActions ?? [],
    relatedInterviewCount,
  } satisfies ApplicationItem;
}

function buildApplicationTableColumns(
  t: (key: string, vars?: Record<string, string | number>) => string,
  canViewApplications: boolean,
  canWithdrawApplications: boolean,
  canAcceptOffer: boolean,
  canDeclineOffer: boolean,
  onViewDetail: (item: ApplicationItem) => void,
  onViewInterviews: (item: ApplicationItem) => void,
  onWithdraw: (item: ApplicationItem) => void,
  onAcceptOffer: (item: ApplicationItem) => void,
  onDeclineOffer: (item: ApplicationItem) => void,
  actionLoadingId: string | null,
): TableColumn<ApplicationItem>[] {
  return [
    {
      key: "title",
      header: t("candidateApplications.columns.jobAndDepartment"),
      renderCell: (item) => (
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#fff1f0] to-[#ffdad6] text-[#b90014]">
            <span className="material-symbols-outlined text-[24px]">
              {item.icon}
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold leading-6 text-[#1a1c1c]">
              {item.title}
            </h3>
            <p className="text-[14px] leading-5 text-[#5f5e5e]">
              {item.department}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "appliedDate",
      header: t("candidateApplications.columns.appliedDate"),
      renderCell: (item) => (
        <span className="text-[14px] text-[#5f5e5e]">{item.appliedDate}</span>
      ),
    },
    {
      key: "status",
      header: t("candidateApplications.columns.status"),
      renderCell: (item) => (
        <span className={`badge ${item.statusClass}`}>{item.status}</span>
      ),
    },
    {
      key: "nextStep",
      header: t("candidateApplications.columns.nextStep"),
      renderCell: (item) => (
        <span className="text-[14px] text-[#5f5e5e]">{item.nextStep}</span>
      ),
    },
    {
      key: "actions",
      header: t("common.actions"),
      headerClassName: "text-right",
      alignRight: true,
      renderCell: (item) => {
        const canAcceptThisApplication =
          item.availableActions.includes("acceptOffer") && canAcceptOffer;
        const canDeclineThisApplication =
          item.availableActions.includes("declineOffer") && canDeclineOffer;
        const canWithdrawThisApplication =
          item.availableActions.includes("withdraw") && canWithdrawApplications;
        const canViewInterviewSchedule =
          item.relatedInterviewCount > 0 || item.statusKey === "interview";
        const isLoading = actionLoadingId === item.id;

        return (
          <div className="flex flex-wrap justify-end gap-2">
            <button
              className="btn btn-ghost px-3 py-2 text-[13px]"
              type="button"
              disabled={!canViewApplications}
              onClick={(event) => {
                event.stopPropagation();
                onViewDetail(item);
              }}
            >
              {t("common.viewDetail")}
            </button>

            <button
              className="btn btn-ghost px-3 py-2 text-[13px] text-[#005f93]"
              type="button"
              disabled={!canViewInterviewSchedule}
              onClick={(event) => {
                event.stopPropagation();
                onViewInterviews(item);
              }}
            >
              {t("candidateApplications.viewInterviewSchedule")}
            </button>

            {item.availableActions.includes("acceptOffer") ? (
              <button
                className="btn btn-primary px-3 py-2 text-[13px]"
                type="button"
                disabled={!canAcceptThisApplication || isLoading}
                onClick={(event) => {
                  event.stopPropagation();
                  onAcceptOffer(item);
                }}
              >
                {t("candidateApplications.acceptOffer")}
              </button>
            ) : null}

            {item.availableActions.includes("declineOffer") ? (
              <button
                className="btn btn-secondary px-3 py-2 text-[13px] !text-[#ba1a1a]"
                type="button"
                disabled={!canDeclineThisApplication || isLoading}
                onClick={(event) => {
                  event.stopPropagation();
                  onDeclineOffer(item);
                }}
              >
                {t("candidateApplications.declineOffer")}
              </button>
            ) : null}

            {item.availableActions.includes("withdraw") ? (
              <button
                className="btn btn-ghost px-3 py-2 text-[13px] !text-[#ba1a1a]"
                type="button"
                disabled={!canWithdrawThisApplication || isLoading}
                onClick={(event) => {
                  event.stopPropagation();
                  onWithdraw(item);
                }}
              >
                {t("candidateApplications.withdraw")}
              </button>
            ) : null}
          </div>
        );
      },
    },
  ];
}

function MyApplicationScreen() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canViewApplications = hasPermission(PERMISSIONS.APPLICATION_VIEW_OWN);
  const canWithdrawApplications = hasPermission(
    PERMISSIONS.APPLICATION_WITHDRAW_OWN,
  );
  const canAcceptOffer = hasPermission(
    PERMISSIONS.APPLICATION_ACCEPT_OFFER_OWN,
  );
  const canDeclineOffer = canAcceptOffer;

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [interviews, setInterviews] = useState<CandidateInterviewItemDto[]>([]);
  const [summary, setSummary] = useState(() => buildEmptySummaryCards(t));
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("applied-date");
  const [keyword, setKeyword] = useState("");
  const [selectedApplicationId, setSelectedApplicationId] = useState<
    string | null
  >(null);

  const pageSize = 3;

  async function loadData() {
    setLoading(true);

    try {
      const [applicationsResponse, interviewsResponse] = await Promise.all([
        candidateService.getApplications(),
        candidateService.getInterviews(),
      ]);

      const nextInterviews = interviewsResponse.data ?? [];
      const nextApplications = (applicationsResponse.data?.items ?? []).map(
        (item, index) => mapApplicationItem(item, index, nextInterviews),
      );

      setApplications(nextApplications);
      setInterviews(nextInterviews);

      const nextSummary = applicationsResponse.data?.summary;
      if (nextSummary) {
        setSummary([
          { label: t("candidateApplications.summary.total"), value: nextSummary.total },
          { label: t("candidateApplications.summary.active"), value: nextSummary.active },
          { label: t("candidateApplications.summary.closed"), value: nextSummary.closed },
        ]);
      } else {
        setSummary(buildEmptySummaryCards(t));
      }
    } catch (error) {
      setApplications([]);
      setInterviews([]);
      setSummary(buildEmptySummaryCards(t));
      handleNonFormApiError(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [lang, t]);

  const filteredApplications = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    const nextItems = applications.filter((item) => {
      const matchesStatus =
        statusFilter === "all" || item.statusKey === statusFilter;
      const matchesKeyword =
        !normalizedKeyword ||
        item.title.toLowerCase().includes(normalizedKeyword) ||
        item.department.toLowerCase().includes(normalizedKeyword) ||
        item.nextStep.toLowerCase().includes(normalizedKeyword);

      return matchesStatus && matchesKeyword;
    });

    nextItems.sort((left, right) => {
      switch (sortBy) {
        case "job-title":
          return left.title.localeCompare(right.title, "vi");
        case "company":
          return left.department.localeCompare(right.department, "vi");
        case "status":
          return left.status.localeCompare(right.status, "vi");
        case "applied-date":
        default:
          return (
            new Date(right.appliedDateValue).getTime() -
            new Date(left.appliedDateValue).getTime()
          );
      }
    });

    return nextItems;
  }, [applications, keyword, sortBy, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [keyword, sortBy, statusFilter]);

  const totalItems = filteredApplications.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const pageSlice = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredApplications.slice(start, start + pageSize);
  }, [filteredApplications, page]);

  const rangeStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalItems);

  const selectedApplication = useMemo(
    () =>
      applications.find(
        (application) => application.id === selectedApplicationId,
      ) ?? null,
    [applications, selectedApplicationId],
  );

  const selectedApplicationInterviews = useMemo(() => {
    if (!selectedApplication) {
      return [];
    }

    return interviews.filter(
      (item) => toJobKey(item.jobTitle) === toJobKey(selectedApplication.title),
    );
  }, [interviews, selectedApplication]);

  async function handleWithdraw(item: ApplicationItem) {
    const confirmed = window.confirm(
      t("candidateApplications.confirmWithdraw", { title: item.title }),
    );
    if (!confirmed) {
      return;
    }

    try {
      setActionLoadingId(item.id);
      await candidateService.withdrawApplication(item.id);
      appToast.success(t("candidateApplications.withdrawSuccess"));
      await loadData();
      setSelectedApplicationId((current) =>
        current === item.id ? null : current,
      );
    } catch (error) {
      handleNonFormApiError(error);
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleAcceptOffer(item: ApplicationItem) {
    const confirmed = window.confirm(
      t("candidateApplications.confirmAcceptOffer", { title: item.title }),
    );
    if (!confirmed) {
      return;
    }

    try {
      setActionLoadingId(item.id);
      await candidateService.acceptOffer(item.id);
      appToast.success(t("candidateApplications.acceptOfferSuccess"));
      await loadData();
    } catch (error) {
      handleNonFormApiError(error);
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleDeclineOffer(item: ApplicationItem) {
    const confirmed = window.confirm(
      t("candidateApplications.confirmDeclineOffer", { title: item.title }),
    );
    if (!confirmed) {
      return;
    }

    try {
      setActionLoadingId(item.id);
      await candidateService.declineOffer(item.id);
      appToast.success(t("candidateApplications.declineOfferSuccess"));
      await loadData();
    } catch (error) {
      handleNonFormApiError(error);
    } finally {
      setActionLoadingId(null);
    }
  }

  function handleViewInterviews(item: ApplicationItem) {
    const search = new URLSearchParams();
    search.set("jobTitle", item.title);
    navigate(`/candidate/interviews?${search.toString()}`);
  }

  function goTo(next: number) {
    const safe = Math.max(1, Math.min(totalPages, next));
    setPage(safe);
  }

  if (loading) {
    return (
      <div className="app-container animate-fade-in py-8">
        <div className="space-y-3">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <div className="mt-6 card overflow-hidden">
          <SkeletonRows rows={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="app-container animate-fade-in py-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="eyebrow mb-1.5">{t("candidateApplications.eyebrow")}</p>
          <h1 className="page-title">{t("candidateApplications.title")}</h1>
          <p className="page-subtitle">{t("candidateApplications.subtitle")}</p>
        </div>

        <div className="grid w-full grid-cols-3 gap-3 sm:w-auto">
          {summary.map((card) => (
            <div key={card.label} className="surface-card px-4 py-3 text-center sm:min-w-[110px]">
              <span className="block text-[28px] font-bold leading-none text-[#b90014]">
                {card.value}
              </span>
              <span className="mt-1.5 block text-[12px] font-semibold text-[#5f5e5e]">
                {card.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 rounded-[16px] border border-[#ececec] bg-white p-4 shadow-[var(--shadow-sm)] xl:flex-row xl:items-center">
        <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-auto">
          <CommonSelect
            className="h-11 min-w-[200px]"
            options={getApplicationStatusFilterOptions()}
            value={statusFilter}
            onValueChange={setStatusFilter}
          />
          <CommonSelect
            className="h-11 min-w-[200px]"
            options={[
              { label: t("candidateApplications.sort.appliedDate"), value: "applied-date" },
              { label: t("candidateApplications.sort.jobTitle"), value: "job-title" },
              { label: t("candidateApplications.sort.department"), value: "company" },
              { label: t("candidateApplications.sort.status"), value: "status" },
            ]}
            value={sortBy}
            onValueChange={setSortBy}
          />
        </div>
        <div className="hidden flex-1 xl:block" />
        <div className="relative w-full xl:w-72">
          <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-[#a8a4a2]">
            search
          </span>
          <input
            className="input-field h-11 pl-10"
            placeholder={t("candidateApplications.searchPlaceholder")}
            type="text"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
      </div>

      <section className="card overflow-hidden">
        <CommonTable
          columns={buildApplicationTableColumns(
            t,
            canViewApplications,
            canWithdrawApplications,
            canAcceptOffer,
            canDeclineOffer,
            (item) => setSelectedApplicationId(item.id),
            handleViewInterviews,
            handleWithdraw,
            handleAcceptOffer,
            handleDeclineOffer,
            actionLoadingId,
          )}
          data={pageSlice}
          keyExtractor={(item) => item.id}
          loading={loading}
          emptyMessage={t("candidateApplications.emptyTable")}
          zebra
          hover
        />
      </section>

      <CommonPagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        onPageChange={goTo}
      />

      {selectedApplication ? (
        <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-[#1a1c1c]/40 backdrop-blur-sm animate-fade-in">
          <div className="animate-slide-in-right h-full w-full max-w-2xl overflow-y-auto bg-[#f7f6f5] p-5 shadow-[var(--shadow-lg)] md:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="eyebrow mb-1.5">{t("candidateApplications.detailTitle")}</p>
                <h2 className="text-[24px] font-semibold leading-8 tracking-[-0.01em] text-[#1a1c1c]">
                  {selectedApplication.title}
                </h2>
                <p className="mt-1.5 text-[14px] text-[#5f5e5e]">
                  {selectedApplication.department}
                </p>
                <span className={`badge mt-3 ${selectedApplication.statusClass}`}>
                  {selectedApplication.status}
                </span>
              </div>

              <button
                className="btn btn-secondary h-10 w-10 shrink-0 !px-0"
                type="button"
                onClick={() => setSelectedApplicationId(null)}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="card flex items-center gap-3 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#fff1f0] to-[#ffdad6] text-[#b90014]">
                  <span className="material-symbols-outlined text-[24px]">event_available</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-[#8a8786]">{t("candidateApplications.columns.appliedDate")}</p>
                  <p className="mt-0.5 text-[16px] font-semibold text-[#1a1c1c]">
                    {selectedApplication.appliedDate}
                  </p>
                </div>
              </div>
              <div className="card flex items-center gap-3 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#fff1f0] to-[#ffdad6] text-[#b90014]">
                  <span className="material-symbols-outlined text-[24px]">event</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-[#8a8786]">{t("candidateApplications.interviewCount")}</p>
                  <p className="mt-0.5 text-[16px] font-semibold text-[#1a1c1c]">
                    {selectedApplication.relatedInterviewCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="card mt-4 p-5">
              <p className="eyebrow">{t("candidateApplications.columns.nextStep")}</p>
              <p className="mt-2 text-[15px] leading-7 text-[#1a1c1c]">
                {selectedApplication.nextStep}
              </p>
            </div>

            <div className="card mt-4 p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="section-title">{t("candidateApplications.relatedInterviews")}</p>
                <button
                  className="btn btn-secondary px-3 py-2 text-[13px]"
                  type="button"
                  onClick={() => handleViewInterviews(selectedApplication)}
                >
                  <span className="material-symbols-outlined text-[18px]">event</span>
                  {t("candidateApplications.viewInterviewSchedule")}
                </button>
              </div>

              {selectedApplicationInterviews.length === 0 ? (
                <p className="text-[14px] text-[#5f5e5e]">
                  {t("candidateApplications.noInterviewSchedule")}
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedApplicationInterviews.map((interview) =>
                    (() => {
                      const timingStatus = getInterviewTimingStatus(
                        interview.startAt,
                        interview.endAt,
                        interview.status,
                      );

                      return (
                        <div
                          key={interview.id}
                          className="flex flex-col gap-2 rounded-[12px] border border-[#ececec] bg-[#faf8f8] p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="font-semibold text-[#1a1c1c]">
                              {interview.dateLabel} · {interview.timeLabel}
                            </p>
                            <p className="mt-1 text-[14px] text-[#5f5e5e]">
                              {t("candidateApplications.interviewerLabel", { interviewer: interview.interviewer })}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone="info">{interview.status}</Badge>
                            {timingStatus ? (
                              <span
                                className={`badge ${timingStatus.className}`}
                              >
                                {timingStatus.label}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })(),
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2.5">
              {selectedApplication.availableActions.includes("acceptOffer") ? (
                <button
                  className="btn btn-primary"
                  type="button"
                  disabled={
                    !canAcceptOffer ||
                    actionLoadingId === selectedApplication.id
                  }
                  onClick={() => handleAcceptOffer(selectedApplication)}
                >
                  {t("candidateApplications.acceptOffer")}
                </button>
              ) : null}

              {selectedApplication.availableActions.includes("declineOffer") ? (
                <button
                  className="btn btn-secondary text-[#ba1a1a]!"
                  type="button"
                  disabled={
                    !canDeclineOffer ||
                    actionLoadingId === selectedApplication.id
                  }
                  onClick={() => handleDeclineOffer(selectedApplication)}
                >
                  {t("candidateApplications.declineOffer")}
                </button>
              ) : null}

              {selectedApplication.availableActions.includes("withdraw") ? (
                <button
                  className="btn btn-ghost text-[#ba1a1a]!"
                  type="button"
                  disabled={
                    !canWithdrawApplications ||
                    actionLoadingId === selectedApplication.id
                  }
                  onClick={() => handleWithdraw(selectedApplication)}
                >
                  {t("candidateApplications.withdraw")}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default MyApplicationScreen;
