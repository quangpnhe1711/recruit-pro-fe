import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { getToastErrorMessage } from "../../common/utils/apiError";
import CommonSelect from "../../common/components/CommonSelect";
import EmptyState from "../../common/components/EmptyState";
import LoadingIndicator from "../../common/components/LoadingIndicator";
import PageHeader from "../../common/components/PageHeader";
import { useI18n } from "../../i18n";
import {
  copilotService,
  type CopilotCandidateDto,
  type CopilotCandidatePoolDto,
  type CopilotConversationDto,
  type CopilotJobOptionDto,
  type CopilotPromptResponseDto,
  type CopilotRuleCriterionDto,
  type CopilotSavedRuleDto,
} from "../../services/copilot/copilotService";
import AssistantDrawer from "./aiCopilot/AssistantDrawer";
import CriteriaBuilderModal from "./aiCopilot/CriteriaBuilderModal";
import ToolResultModal from "./aiCopilot/ToolResultModal";
import {
  AI_RANKING_COPY,
  buildAssistantSummaryFromResults,
  buildCriteriaPrompt,
  buildDefaultAssistantContext,
  buildPresetSuggestion,
  CandidateAvatar,
  EMPTY_NEGATIVE_CRITERION,
  EMPTY_PRIORITY_CRITERION,
  EducationCell,
  mapConversationToChat,
  mapRankingSessionToPromptResponse,
  matchReasonText,
  normalizeCriterion,
  rowStatus,
  ScorePill,
  SkillTags,
  StatusPill,
  TOOL_META,
  type ChatMessage,
  type ToolName,
  type ToolResult,
} from "./aiCopilot/copilotUi";

// v2: candidate search and AI email draft are removed from the active Copilot flow. Only fit and
// interview-question tools remain as per-candidate actions.
const CANDIDATE_TOOLS: ToolName[] = ["fit", "questions"];

const SCREENING_STATUS = "Screening";

function AiCopilotScreen() {
  const { t } = useI18n();

  // --- Core data -----------------------------------------------------------
  const [jobs, setJobs] = useState<CopilotJobOptionDto[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [conversation, setConversation] = useState<CopilotConversationDto | null>(null);
  const [pool, setPool] = useState<CopilotCandidatePoolDto | null>(null);
  const [ranking, setRanking] = useState<CopilotPromptResponseDto | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [savedRules, setSavedRules] = useState<CopilotSavedRuleDto[]>([]);

  // --- Criteria ------------------------------------------------------------
  const [priorityCriteria, setPriorityCriteria] = useState<CopilotRuleCriterionDto[]>([]);
  const [negativeCriteria, setNegativeCriteria] = useState<CopilotRuleCriterionDto[]>([]);
  const [priorityDraft, setPriorityDraft] = useState<CopilotRuleCriterionDto>(EMPTY_PRIORITY_CRITERION);
  const [negativeDraft, setNegativeDraft] = useState<CopilotRuleCriterionDto>(EMPTY_NEGATIVE_CRITERION);

  // --- Loading / status ----------------------------------------------------
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingPool, setLoadingPool] = useState(false);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [savingRule, setSavingRule] = useState(false);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);

  // --- UI toggles ----------------------------------------------------------
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [criteriaOpen, setCriteriaOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [expandedCandidateId, setExpandedCandidateId] = useState<string | null>(null);

  // --- Tool modal ----------------------------------------------------------
  const [toolOpen, setToolOpen] = useState(false);
  const [toolLoading, setToolLoading] = useState(false);
  const [toolName, setToolName] = useState<ToolName | null>(null);
  const [toolResult, setToolResult] = useState<ToolResult | null>(null);
  const [runningToolKey, setRunningToolKey] = useState<string | null>(null);

  // --- Pass CV / Head Review -----------------------------------------------
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<string[]>([]);
  const [passingCv, setPassingCv] = useState(false);

  /* ----------------------------------------------------------------------- */
  /* Load jobs                                                               */
  /* ----------------------------------------------------------------------- */
  useEffect(() => {
    let mounted = true;
    copilotService
      .getJobs()
      .then((response) => {
        if (!mounted) return;
        const items = response.data ?? [];
        setJobs(items);
        setSelectedJobId(items[0]?.jobId ?? "");
      })
      .catch(() => toast.error(t("aiCopilot.loadJobsFailed")))
      .finally(() => {
        if (mounted) setLoadingJobs(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  /* ----------------------------------------------------------------------- */
  /* Load job context on selection                                          */
  /* ----------------------------------------------------------------------- */
  useEffect(() => {
    if (!selectedJobId) return;
    let mounted = true;

    setLoadingPool(true);
    setConversation(null);
    setPool(null);
    setRanking(null);
    setChat([]);
    setSavedRules([]);
    setPriorityCriteria([]);
    setNegativeCriteria([]);
    setExpandedCandidateId(null);
    setSelectedApplicationIds([]);

    async function loadJobContext() {
      try {
        const [conversationResponse, poolResponse, rulesResponse] = await Promise.all([
          copilotService.createConversation(selectedJobId),
          copilotService.getCandidatePool(selectedJobId),
          copilotService.getSavedRules(selectedJobId),
        ]);
        if (!mounted) return;

        const nextConversation = conversationResponse.data;
        setConversation(nextConversation);
        setPool(poolResponse.data);
        setSavedRules(rulesResponse.data ?? []);

        if (!nextConversation) return;

        const [conversationDetailResponse, rankingSessionResponse] = await Promise.all([
          copilotService.getConversation(nextConversation.conversationId),
          nextConversation.latestRankingSessionId
            ? copilotService.getRankingSession(nextConversation.latestRankingSessionId)
            : Promise.resolve(null),
        ]);
        if (!mounted) return;

        const nextChat = mapConversationToChat(conversationDetailResponse.data);
        setChat(
          nextChat.length > 0
            ? nextChat
            : [{ role: "assistant", content: buildDefaultAssistantContext(poolResponse.data ?? null) }],
        );

        if (rankingSessionResponse?.data) {
          setRanking(mapRankingSessionToPromptResponse(rankingSessionResponse.data));
        }
      } catch {
        if (mounted) toast.error(t("aiCopilot.loadCandidatesFailed"));
      } finally {
        if (mounted) setLoadingPool(false);
      }
    }

    void loadJobContext();
    return () => {
      mounted = false;
    };
  }, [selectedJobId, t]);

  /* ----------------------------------------------------------------------- */
  /* Derived data                                                           */
  /* ----------------------------------------------------------------------- */
  const rankedByCandidateId = useMemo(
    () => new Map((ranking?.results ?? []).map((result) => [result.candidateUserId, result])),
    [ranking],
  );

  const visibleCandidates = useMemo(() => {
    if (!pool) return [];
    if (!ranking || !ranking.didRank) return pool.candidates;
    const candidateById = new Map(pool.candidates.map((c) => [c.candidateUserId, c]));
    return ranking.results
      .map((result) => candidateById.get(result.candidateUserId))
      .filter((c): c is CopilotCandidateDto => Boolean(c));
  }, [pool, ranking]);

  const hasCriteria = priorityCriteria.length > 0 || negativeCriteria.length > 0;
  const selectedJob = jobs.find((job) => job.jobId === selectedJobId) ?? null;
  const keptCount = ranking?.results.filter((r) => !r.isAutoRejected).length ?? 0;
  const rejectedCount = ranking?.results.filter((r) => r.isAutoRejected).length ?? 0;
  const requiredSkillCount = ranking?.normalizedRules.requiredSkills.length ?? 0;

  /* ----------------------------------------------------------------------- */
  /* Copilot calls                                                          */
  /* ----------------------------------------------------------------------- */
  const callCopilot = useCallback(
    async (opts: { promptText: string; forceRanking: boolean }) => {
      if (!conversation || !selectedJobId) return null;
      return copilotService.createRanking(conversation.conversationId, {
        jobId: selectedJobId,
        prompt: opts.promptText,
        forceRanking: opts.forceRanking,
        priorityCriteria: opts.forceRanking ? priorityCriteria.map(normalizeCriterion) : [],
        negativeCriteria: opts.forceRanking ? negativeCriteria.map(normalizeCriterion) : [],
      });
    },
    [conversation, selectedJobId, priorityCriteria, negativeCriteria],
  );

  const runRanking = useCallback(async () => {
    if (!conversation || !selectedJobId) return;
    const promptText = hasCriteria
      ? buildCriteriaPrompt(priorityCriteria.map(normalizeCriterion), negativeCriteria.map(normalizeCriterion))
      : t("aiCopilot.defaultRankingPrompt");

    setRankingLoading(true);
    setLoadingStatus(t("aiCopilot.rankingInProgress"));
    try {
      const response = await callCopilot({ promptText, forceRanking: true });
      if (!response?.data?.didRank) {
        toast.info(t("aiCopilot.noRankingGenerated"));
        return;
      }
      setRanking(response.data);
      setSelectedApplicationIds([]);
      setCriteriaOpen(false);
      if (response.data.reusedRankingSession) {
        // v2 §8 — unchanged effective input returns the latest matching session.
        toast.info(t("aiCopilot.reusedRanking"));
      } else {
        toast.success(t("aiCopilot.rankedCount", { count: response.data.results.length }));
      }
    } catch (error) {
      toast.error(getToastErrorMessage(error, t("aiCopilot.rankFailed")));
    } finally {
      setRankingLoading(false);
      setLoadingStatus("");
    }
  }, [callCopilot, conversation, hasCriteria, negativeCriteria, priorityCriteria, selectedJobId, t]);

  /* ----------------------------------------------------------------------- */
  /* Pass CV / Send to Head Review (v2 §7)                                  */
  /* ----------------------------------------------------------------------- */
  const reloadCandidatePool = useCallback(async () => {
    if (!selectedJobId) return;
    try {
      const poolResponse = await copilotService.getCandidatePool(selectedJobId);
      setPool(poolResponse.data);
    } catch {
      // Best-effort refresh; the transition already succeeded.
    }
  }, [selectedJobId]);

  const toggleCandidateSelection = useCallback((applicationId: string) => {
    setSelectedApplicationIds((current) =>
      current.includes(applicationId)
        ? current.filter((id) => id !== applicationId)
        : [...current, applicationId],
    );
  }, []);

  const passSelectedToHeadReview = useCallback(async () => {
    if (!ranking?.rankingSessionId || selectedApplicationIds.length === 0) return;
    setPassingCv(true);
    try {
      const response = await copilotService.passCvToHeadReview(ranking.rankingSessionId, {
        applicationIds: selectedApplicationIds,
      });
      const updated = response.data?.updated ?? [];
      const skipped = response.data?.skipped ?? [];
      if (updated.length > 0) {
        toast.success(t("aiCopilot.passedToHeadReview", { count: updated.length }));
      }
      if (skipped.length > 0) {
        toast.info(
          t("aiCopilot.skippedApplications", {
            count: skipped.length,
            reasons: skipped.map((item) => item.reason).join("; "),
          }),
        );
      }
      setSelectedApplicationIds([]);
      // Refresh the pool + ranking so moved candidates leave the default screening list.
      await reloadCandidatePool();
      await runRanking();
    } catch (error) {
      toast.error(getToastErrorMessage(error, t("aiCopilot.passFailed")));
    } finally {
      setPassingCv(false);
    }
  }, [ranking, reloadCandidatePool, runRanking, selectedApplicationIds, t]);

  const submitChat = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed || !conversation || !selectedJobId) return;

    setPrompt("");
    setChatSending(true);
    setLoadingStatus(t("aiCopilot.replyInProgress"));
    setChat((current) => [...current, { role: "user", content: trimmed }, { role: "assistant", content: "" }]);

    try {
      const response = await callCopilot({ promptText: trimmed, forceRanking: false });
      const data = response?.data;
      if (!data) {
        setChat((current) => current.slice(0, -1));
        toast.error(t("aiCopilot.noAssistantReply"));
        return;
      }
      const message =
        (data.didRank
          ? data.assistantMessage || buildAssistantSummaryFromResults(data.results)
          : data.assistantMessage) ||
        t("aiCopilot.defaultAssistantReply");
      setChat((current) => {
        const next = [...current];
        next[next.length - 1] = { role: "assistant", content: message };
        return next;
      });
      if (data.didRank) setRanking(data);
    } catch (error) {
      setChat((current) => current.slice(0, -1));
      toast.error(getToastErrorMessage(error, t("aiCopilot.assistantFailed")));
    } finally {
      setChatSending(false);
      setLoadingStatus("");
    }
  }, [callCopilot, conversation, prompt, selectedJobId, t]);

  /* ----------------------------------------------------------------------- */
  /* Criteria handlers                                                      */
  /* ----------------------------------------------------------------------- */
  function addPriorityCriterion() {
    const normalized = normalizeCriterion(priorityDraft);
    if (!normalized.value) {
      toast.info(t("aiCopilot.enterPriorityValue"));
      return;
    }
    setPriorityCriteria((current) => [...current, normalized]);
    setPriorityDraft(EMPTY_PRIORITY_CRITERION);
  }

  function addNegativeCriterion() {
    const normalized = normalizeCriterion(negativeDraft);
    if (!normalized.value) {
      toast.info(t("aiCopilot.enterNegativeValue"));
      return;
    }
    setNegativeCriteria((current) => [...current, normalized]);
    setNegativeDraft(EMPTY_NEGATIVE_CRITERION);
  }

  function clearCurrentCriteria() {
    setPriorityCriteria([]);
    setNegativeCriteria([]);
  }

  async function saveCurrentRule() {
    if (!selectedJobId || !hasCriteria) {
      toast.info(t("aiCopilot.addCriteriaBeforeSave"));
      return;
    }
    setSavingRule(true);
    try {
      const response = await copilotService.createSavedRule(selectedJobId, {
        name: buildPresetSuggestion(priorityCriteria, negativeCriteria),
        priorityCriteria,
        negativeCriteria,
        isActive: true,
      });
      if (response.data) {
        setSavedRules((current) => [response.data!, ...current]);
        toast.success(t("aiCopilot.presetSaved"));
      }
    } catch {
      toast.error(t("aiCopilot.presetSaveFailed"));
    } finally {
      setSavingRule(false);
    }
  }

  async function toggleSavedRule(rule: CopilotSavedRuleDto) {
    try {
      const response = await copilotService.updateSavedRuleStatus(rule.ruleId, !rule.isActive);
      if (!response.data) return;
      setSavedRules((current) => current.map((item) => (item.ruleId === rule.ruleId ? response.data! : item)));
      // Applying a preset loads its criteria into the current builder.
      if (!rule.isActive && response.data.isActive) {
        setPriorityCriteria(response.data.rule.priorityCriteria);
        setNegativeCriteria(response.data.rule.negativeCriteria);
      }
    } catch {
      toast.error(t("aiCopilot.presetUpdateFailed"));
    }
  }

  async function deleteSavedRule(ruleId: string) {
    setDeletingRuleId(ruleId);
    try {
      await copilotService.deleteSavedRule(ruleId);
      setSavedRules((current) => current.filter((rule) => rule.ruleId !== ruleId));
      toast.success(t("aiCopilot.presetDeleted"));
    } catch {
      toast.error(t("aiCopilot.presetDeleteFailed"));
    } finally {
      setDeletingRuleId(null);
    }
  }

  /* ----------------------------------------------------------------------- */
  /* AI tools                                                               */
  /* ----------------------------------------------------------------------- */
  const runCandidateTool = useCallback(
    async (candidate: CopilotCandidateDto, tool: ToolName) => {
      if (!selectedJobId) return;
      const runKey = `${candidate.candidateUserId}:${tool}`;
      setRunningToolKey(runKey);
      setToolName(tool);
      setToolResult(null);
      setToolLoading(true);
      setToolOpen(true);
      try {
        if (tool === "fit") {
          const response = await copilotService.analyzeFit(selectedJobId, {
            applicationIds: [candidate.applicationId],
          });
          const first = response.data?.analyses[0];
          if (!first) {
            toast.info(t("aiCopilot.noCandidateAnalysis"));
            setToolOpen(false);
            return;
          }
          setToolResult({
            kind: "fit",
            candidateName: first.fullName,
            fitLabel: first.fitLabel,
            confidenceScore: first.confidenceScore,
            totalScore: first.totalScore,
            summary: first.summary,
            strengths: first.strengths,
            gaps: first.gaps,
            evidence: first.evidence,
            fallbackUsed: response.data?.ai.fallbackUsed ?? false,
          });
        } else if (tool === "questions") {
          const response = await copilotService.generateInterviewQuestions(selectedJobId, {
            applicationId: candidate.applicationId,
            focus: "job-fit",
            questionCount: 5,
          });
          setToolResult({
            kind: "questions",
            candidateName: candidate.fullName,
            focus: response.data?.focus ?? "job-fit",
            questions: response.data?.questions ?? [],
            fallbackUsed: response.data?.ai.fallbackUsed ?? false,
          });
        } else if (tool === "email") {
          const response = await copilotService.draftEmail(candidate.applicationId, {
            templateType: "interview_invite",
            tone: "warm",
          });
          if (!response.data) {
            toast.info(t("aiCopilot.noEmailDraft"));
            setToolOpen(false);
            return;
          }
          setToolResult({
            kind: "email",
            candidateName: candidate.fullName,
            subject: response.data.subject,
            body: response.data.body,
            fallbackUsed: response.data.ai.fallbackUsed,
          });
        }
      } catch (error) {
        setToolOpen(false);
        toast.error(getToastErrorMessage(error, t("aiCopilot.toolRunFailed", { tool: TOOL_META[tool].label })));
      } finally {
        setToolLoading(false);
        setRunningToolKey(null);
      }
    },
    [selectedJobId, t],
  );

  /* ----------------------------------------------------------------------- */
  /* Render                                                                 */
  /* ----------------------------------------------------------------------- */
  if (loadingJobs) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingIndicator label={t("common.loading")} />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow={t("aiCopilot.eyebrow")}
          icon="auto_awesome"
          title={t("aiCopilot.title")}
          subtitle={t("aiCopilot.subtitle")}
        />
        <div className="card">
          <EmptyState
            icon="work_off"
            title={t("aiCopilot.noJobsTitle")}
            description={t("aiCopilot.noJobsDescription")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-4">
      {/* Header */}
      <PageHeader
        eyebrow={t("aiCopilot.eyebrow")}
        icon="auto_awesome"
        title={selectedJob?.title ?? t("aiCopilot.title")}
        subtitle={
          pool
            ? t("aiCopilot.selectedJobSummary", {
                candidates: pool.candidates.length,
                skills: pool.job.requiredSkills.length,
              })
            : t("aiCopilot.selectJobHint")
        }
        actions={
          <>
            <CommonSelect
              className="min-w-[240px]"
              options={jobs.map((job) => ({
                label: `${job.title} (${job.applicationCount})`,
                value: job.jobId,
              }))}
              value={selectedJobId}
              onChange={(event) => setSelectedJobId(event.target.value)}
            />
            <button
              type="button"
              className="btn btn-secondary h-11"
              onClick={() => setAssistantOpen(true)}
            >
              <span className="material-symbols-outlined text-[18px]">smart_toy</span>
              {t("aiCopilot.assistantButton")}
            </button>
          </>
        }
      />

      {/* Ranking toolbar */}
      <div className="card p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            {ranking ? (
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[13px] font-semibold text-emerald-700">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  {t("aiCopilot.keptCount", { count: keptCount })}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-[13px] font-semibold text-rose-700">
                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                  {t("aiCopilot.rejectedCount", { count: rejectedCount })}
                </span>
                {requiredSkillCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f2efed] px-3 py-1 text-[13px] font-semibold text-[#5f5e5e]">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    {t("aiCopilot.requiredSkillsCount", { count: requiredSkillCount })}
                  </span>
                ) : null}
              </div>
            ) : (
              <div>
                <p className="text-[15px] font-semibold text-[#1a1c1c]">{t("aiCopilot.screenTitle")}</p>
                <p className="mt-0.5 text-[13px] text-[#5f5e5e]">{t("aiCopilot.screenDescription")}</p>
              </div>
            )}
            {hasCriteria ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {priorityCriteria.map((criterion, index) => (
                  <span
                    key={`tp-${index.toString()}`}
                    className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-800"
                  >
                    {criterion.label || criterion.value}
                  </span>
                ))}
                {negativeCriteria.map((criterion, index) => (
                  <span
                    key={`tn-${index.toString()}`}
                    className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-700"
                  >
                    {criterion.label || criterion.value}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            <button
              type="button"
              className="btn btn-secondary h-11"
              disabled={loadingPool || !pool}
              onClick={() => setCriteriaOpen(true)}
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
              {t("aiCopilot.criteriaButton")}
              {hasCriteria ? (
                <span className="ml-0.5 rounded-full bg-[#b90014] px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {priorityCriteria.length + negativeCriteria.length}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              className="btn btn-primary h-11 px-5"
              disabled={rankingLoading || loadingPool || !pool || visibleCandidates.length === 0}
              onClick={() => void runRanking()}
            >
              {rankingLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              )}
              {ranking ? t("aiCopilot.rerank") : t("aiCopilot.rank")}
            </button>
            {ranking ? (
              <button
                type="button"
                className="btn btn-secondary h-11"
                disabled={passingCv || selectedApplicationIds.length === 0}
                onClick={() => void passSelectedToHeadReview()}
                title={t("aiCopilot.passToHeadReviewTitle")}
              >
                {passingCv ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#f0c8c4] border-t-[#b90014]" />
                ) : (
                  <span className="material-symbols-outlined text-[18px]">forward_to_inbox</span>
                )}
                {t("aiCopilot.passToHeadReview")}
                {selectedApplicationIds.length > 0 ? (
                  <span className="ml-0.5 rounded-full bg-[#b90014] px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {selectedApplicationIds.length}
                  </span>
                ) : null}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Candidate table */}
      <div className="card overflow-hidden ring-1 ring-black/[0.02]">
        {loadingPool ? (
          <div className="flex min-h-[360px] items-center justify-center">
            <LoadingIndicator label={t("aiCopilot.loadingCandidates")} />
          </div>
        ) : visibleCandidates.length === 0 ? (
          <EmptyState
            icon="group_off"
            title={t("aiCopilot.emptyTitle")}
            description={t("aiCopilot.emptyDescription")}
          />
        ) : (
          <div className="overflow-x-auto bg-[#fbfaf9]">
            <table className="w-full min-w-[1080px] border-separate border-spacing-0 text-left">
              <thead>
                <tr className="bg-[#f0eceb]">
                  <th className="w-10 border-b border-[#ddd7d5] px-3 py-4 pl-6 text-[11px] font-bold uppercase tracking-[0.11em] text-[#5f5e5e]">
                    <span className="sr-only">{t("aiCopilot.selectColumn")}</span>
                  </th>
                  {[
                    t("aiCopilot.candidateColumn"),
                    t("aiCopilot.educationColumn"),
                    t("aiCopilot.skillsColumn"),
                    t("aiCopilot.aiReviewColumn"),
                    t("aiCopilot.scoreColumn"),
                    t("aiCopilot.statusColumn"),
                    t("aiCopilot.toolsColumn"),
                  ].map((header, index) => (
                      <th
                        key={header}
                        className={`border-b border-[#ddd7d5] px-5 py-4 text-[11px] font-bold uppercase tracking-[0.11em] text-[#5f5e5e] first:pl-6 last:pr-6 ${
                          index === 6 ? "text-right" : ""
                        }`}
                      >
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="text-[14px]">
                {visibleCandidates.map((candidate, index) => {
                  const result = rankedByCandidateId.get(candidate.candidateUserId);
                  const reason = matchReasonText(result);
                  const status = rowStatus(result, rankingLoading && !result);
                  const isExpanded = expandedCandidateId === candidate.candidateUserId;
                  const hasDetail = Boolean(
                    result && (result.summary?.trim() || result.strengths.length || result.weaknesses.length),
                  );
                  const rowBg = index % 2 === 1 ? "bg-[#f8f6f5]" : "bg-white";
                  // v2 §7: only Screening candidates that are not auto-rejected can be passed to Head Review.
                  const canSelect = candidate.status === SCREENING_STATUS && !result?.isAutoRejected;
                  const isSelected = selectedApplicationIds.includes(candidate.applicationId);

                  return (
                    <Fragment key={candidate.candidateUserId}>
                      <tr className={`${rowBg} ${result?.isAutoRejected ? "opacity-70" : ""}`}>
                        {/* Select for Pass CV */}
                        <td className="border-b border-[#eee9e7] px-3 py-4 pl-6 align-top">
                          <input
                            type="checkbox"
                            className="h-4 w-4 cursor-pointer accent-[#b90014] disabled:cursor-not-allowed disabled:opacity-40"
                            checked={isSelected}
                            disabled={!canSelect || passingCv}
                            onChange={() => toggleCandidateSelection(candidate.applicationId)}
                            title={
                              canSelect
                                ? t("aiCopilot.selectForHeadReview")
                                : t("aiCopilot.onlyScreeningSelectable")
                            }
                            aria-label={t("aiCopilot.selectCandidateForHeadReview", {
                              name: candidate.fullName,
                            })}
                          />
                        </td>
                        {/* Candidate */}
                        <td className="border-b border-[#eee9e7] px-5 py-4 align-top first:pl-6">
                          <div className="flex items-center gap-3">
                            <CandidateAvatar name={candidate.fullName} />
                            <div className="min-w-0">
                              <p className="font-semibold text-[#1a1c1c]">{candidate.fullName}</p>
                              <p className="text-[12px] text-[#5f5e5e]">
                                {t("aiCopilot.yearsExperience", { count: candidate.experienceYears })}
                              </p>
                            </div>
                          </div>
                        </td>
                        {/* Education */}
                        <td className="border-b border-[#eee9e7] px-5 py-4 align-top">
                          <EducationCell education={candidate.education} />
                        </td>
                        {/* Skills */}
                        <td className="border-b border-[#eee9e7] px-5 py-4 align-top">
                          <SkillTags skills={candidate.skills} />
                        </td>
                        {/* AI reason */}
                        <td className="border-b border-[#eee9e7] px-5 py-4 align-top">
                          <div className="max-w-[240px]">
                            {reason ? (
                              <>
                                <p className="line-clamp-2 text-[13px] leading-5 text-[#1a1c1c]">{reason}</p>
                                {hasDetail ? (
                                  <button
                                    type="button"
                                    className="mt-1 inline-flex items-center gap-0.5 text-[12px] font-semibold text-[#b90014] hover:text-[#93000d]"
                                    onClick={() =>
                                      setExpandedCandidateId((current) =>
                                        current === candidate.candidateUserId
                                          ? null
                                          : candidate.candidateUserId,
                                      )
                                    }
                                  >
                                    {isExpanded ? t("aiCopilot.collapse") : t("aiCopilot.viewDetails")}
                                    <span className="material-symbols-outlined text-[16px]">
                                      {isExpanded ? "expand_less" : "expand_more"}
                                    </span>
                                  </button>
                                ) : null}
                              </>
                            ) : (
                              <p className="flex items-center gap-1.5 text-[12px] italic text-[#a8a4a2]">
                                <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                                {AI_RANKING_COPY.runReview}
                              </p>
                            )}
                            {result?.rejectReason ? (
                              <p className="mt-1 text-[11px] font-medium text-[#ba1a1a]">{result.rejectReason}</p>
                            ) : null}
                          </div>
                        </td>
                        {/* Score */}
                        <td className="border-b border-[#eee9e7] px-5 py-4 align-top">
                          {result && !result.isAutoRejected ? (
                            <ScorePill score={result.totalScore} />
                          ) : (
                            <span className="inline-flex rounded-full border border-[#e2dfde] bg-[#f2efed] px-3 py-1 text-[12px] font-semibold text-[#5f5e5e]">
                              {AI_RANKING_COPY.notRanked}
                            </span>
                          )}
                        </td>
                        {/* Status */}
                        <td className="border-b border-[#eee9e7] px-5 py-4 align-top">
                          <StatusPill status={status} />
                        </td>
                        {/* Tools */}
                        <td className="border-b border-[#eee9e7] px-5 py-4 align-top last:pr-6">
                          <div className="flex items-center justify-end gap-1">
                            {CANDIDATE_TOOLS.map((tool) => {
                              const running = runningToolKey === `${candidate.candidateUserId}:${tool}`;
                              return (
                                <button
                                  key={tool}
                                  type="button"
                                  className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#e8e2df] bg-white text-[#5f5e5e] transition-colors hover:border-[#b90014] hover:text-[#b90014] disabled:opacity-40"
                                  disabled={toolLoading}
                                  title={TOOL_META[tool].label}
                                  aria-label={`${TOOL_META[tool].label} — ${candidate.fullName}`}
                                  onClick={() => void runCandidateTool(candidate, tool)}
                                >
                                  {running ? (
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#f0c8c4] border-t-[#b90014]" />
                                  ) : (
                                    <span className="material-symbols-outlined text-[18px]">
                                      {TOOL_META[tool].icon}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>

                      {isExpanded && result ? (
                        <tr className={rowBg}>
                          <td colSpan={8} className="border-b border-[#eee9e7] px-5 pb-5 pt-0 first:pl-6 last:pr-6">
                            <div className="rounded-xl border border-[#eee9e7] bg-[#faf9f8] p-4">
                              {/* v2 §4: fit label + confidence generated at ranking time */}
                              {result.fitLabel || result.confidenceScore ? (
                                <div className="mb-3 flex flex-wrap items-center gap-2">
                                  {result.fitLabel ? (
                                    <span className="inline-flex items-center rounded-full bg-[#e2f0ff] px-2.5 py-1 text-[11px] font-bold text-[#005f93]">
                                      {result.fitLabel}
                                    </span>
                                  ) : null}
                                  {result.confidenceScore ? (
                                    <span className="inline-flex items-center rounded-full bg-[#f2efed] px-2.5 py-1 text-[11px] font-semibold text-[#5f5e5e]">
                                      {t("aiCopilot.confidence", {
                                        score: Math.round(result.confidenceScore),
                                      })}
                                    </span>
                                  ) : null}
                                </div>
                              ) : null}
                              {result.summary?.trim() ? (
                                <p className="text-[13px] leading-6 text-[#1a1c1c]">{result.summary.trim()}</p>
                              ) : null}
                              {result.evidence?.length ? (
                                <ul className="mt-2 space-y-1 text-[12px] text-[#5f5e5e]">
                                  {result.evidence.map((item, i) => (
                                    <li key={`ev-${i.toString()}`} className="flex gap-1.5">
                                      <span className="text-[#8a8785]">•</span>
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                                {result.strengths.length ? (
                                  <div>
                                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-emerald-700">
                                      {t("candidateReviewDetail.strengths")}
                                    </p>
                                    <ul className="mt-1.5 space-y-1 text-[12px] text-[#1a1c1c]">
                                      {result.strengths.map((s, i) => (
                                        <li key={`s-${i.toString()}`} className="flex gap-1.5">
                                          <span className="text-emerald-600">+</span>
                                          {s}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : null}
                                {result.weaknesses.length ? (
                                  <div>
                                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#ba1a1a]">
                                      {t("aiCopilot.watchouts")}
                                    </p>
                                    <ul className="mt-1.5 space-y-1 text-[12px] text-[#1a1c1c]">
                                      {result.weaknesses.map((w, i) => (
                                        <li key={`w-${i.toString()}`} className="flex gap-1.5">
                                          <span className="text-[#ba1a1a]">!</span>
                                          {w}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals & drawer */}
      <CriteriaBuilderModal
        open={criteriaOpen}
        onClose={() => setCriteriaOpen(false)}
        priorityCriteria={priorityCriteria}
        negativeCriteria={negativeCriteria}
        priorityDraft={priorityDraft}
        negativeDraft={negativeDraft}
        setPriorityDraft={setPriorityDraft}
        setNegativeDraft={setNegativeDraft}
        onAddPriority={addPriorityCriterion}
        onAddNegative={addNegativeCriterion}
        onRemovePriority={(idx) => setPriorityCriteria((c) => c.filter((_, i) => i !== idx))}
        onRemoveNegative={(idx) => setNegativeCriteria((c) => c.filter((_, i) => i !== idx))}
        onClearAll={clearCurrentCriteria}
        savedRules={savedRules}
        savingRule={savingRule}
        onSavePreset={saveCurrentRule}
        onToggleRule={toggleSavedRule}
        onDeleteRule={deleteSavedRule}
        deletingRuleId={deletingRuleId}
        applying={rankingLoading}
        onApplyAndRank={runRanking}
      />

      <ToolResultModal
        open={toolOpen}
        loading={toolLoading}
        tool={toolName}
        result={toolResult}
        onClose={() => setToolOpen(false)}
      />

      <AssistantDrawer
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        jobTitle={selectedJob?.title ?? null}
        chat={chat}
        prompt={prompt}
        setPrompt={setPrompt}
        sending={chatSending}
        loadingStatus={loadingStatus}
        canSend={!chatSending && !!conversation && !!prompt.trim()}
        onSend={() => void submitChat()}
      />
    </div>
  );
}

export default AiCopilotScreen;
