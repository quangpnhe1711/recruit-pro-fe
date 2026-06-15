import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import CommonSelect from "../../common/components/CommonSelect";
import LoadingIndicator from "../../common/components/LoadingIndicator";
import {
  copilotService,
  type CopilotCandidateDto,
  type CopilotCandidatePoolDto,
  type CopilotConversationDetailDto,
  type CopilotConversationDto,
  type CopilotJobOptionDto,
  type CopilotPromptResponseDto,
  type CopilotRankingResultDto,
  type CopilotRankingSessionDetailDto,
  type CopilotRuleCriterionDto,
  type CopilotSavedRuleDto,
} from "../../services/copilot/copilotService";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const EMPTY_PRIORITY_CRITERION: CopilotRuleCriterionDto = {
  label: "",
  field: "skill",
  operator: "contains",
  value: "",
  weight: "high",
  autoReject: false,
};

const EMPTY_NEGATIVE_CRITERION: CopilotRuleCriterionDto = {
  label: "",
  field: "education",
  operator: "contains",
  value: "",
  weight: "medium",
  autoReject: true,
};

function matchReasonText(result?: CopilotRankingResultDto) {
  if (!result) {
    return "Run AI review to generate match reasoning.";
  }

  if (result.isAiGenerated && result.summary) {
    return result.summary;
  }

  return "AI match reason unavailable for this run.";
}

function scoreTone(score: number) {
  if (score >= 80) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (score >= 60) return "text-[#005f93] bg-[#cde5ff] border-[#94ccff]";
  return "text-[#ba1a1a] bg-[#ffdad6] border-[#ffb4ac]";
}

function statusLabel(result?: CopilotRankingResultDto) {
  if (!result) return "Loaded";
  if (result.isAutoRejected) return "Auto Rejected";
  return result.recommendation;
}

function mapConversationToChat(
  conversationDetail: CopilotConversationDetailDto | null,
): ChatMessage[] {
  if (!conversationDetail) return [];

  return conversationDetail.messages
    .filter(
      (message) => message.role === "User" || message.role === "Assistant",
    )
    .map((message) => ({
      role: message.role === "User" ? "user" : "assistant",
      content: message.content,
    }));
}

function mapRankingSessionToPromptResponse(
  session: CopilotRankingSessionDetailDto,
): CopilotPromptResponseDto {
  return {
    conversationId: session.conversationId,
    rankingSessionId: session.rankingSessionId,
    normalizedRules: session.normalizedRules,
    results: session.results,
  };
}

function buildCriteriaPrompt(
  priorityCriteria: CopilotRuleCriterionDto[],
  negativeCriteria: CopilotRuleCriterionDto[],
) {
  const priorityText = priorityCriteria.map((criterion) => {
    const label = criterion.label || criterion.value;
    return `Priority ${criterion.field}: ${label}`;
  });
  const negativeText = negativeCriteria.map((criterion) => {
    const label = criterion.label || criterion.value;
    return `${criterion.autoReject ? "Reject" : "Penalize"} ${criterion.field}: ${label}`;
  });

  return [...priorityText, ...negativeText].join(". ");
}

function describeCriterion(criterion: CopilotRuleCriterionDto) {
  return criterion.label || criterion.value;
}

function countRuleCriteria(rule: CopilotSavedRuleDto) {
  const priorityCount = rule.rule.priorityCriteria.length;
  const negativeCount = rule.rule.negativeCriteria.length;
  return { priorityCount, negativeCount, total: priorityCount + negativeCount };
}

function buildPresetSuggestion(
  priorityCriteria: CopilotRuleCriterionDto[],
  negativeCriteria: CopilotRuleCriterionDto[],
) {
  const labels = [...priorityCriteria, ...negativeCriteria]
    .map((criterion) => describeCriterion(criterion).trim())
    .filter(Boolean);

  if (labels.length === 0) {
    return "Saved criteria";
  }

  return labels.length === 1 ? labels[0] : `${labels[0]} +${labels.length - 1}`;
}

function buildCandidateAnalysisLine(result: CopilotRankingResultDto) {
  if (result.summary?.trim()) {
    return `${result.fullName}: ${result.summary.trim()}`;
  }

  const strengths = result.strengths.slice(0, 2).join(", ");
  const weaknesses = result.weaknesses.slice(0, 2).join(", ");

  if (result.isAutoRejected) {
    return `${result.fullName}: rejected because ${result.rejectReason || weaknesses || "the candidate did not meet the active criteria"}.`;
  }

  const parts = [
    strengths ? `matched ${strengths}` : "",
    weaknesses ? `watch-outs: ${weaknesses}` : "",
  ].filter(Boolean);

  return `${result.fullName}: ${parts.join("; ") || "candidate analyzed against the active criteria."}`;
}

function buildAssistantSummaryFromResults(results: CopilotRankingResultDto[]) {
  const shortlisted = results.filter((item) => !item.isAutoRejected).slice(0, 3);
  const rejected = results.filter((item) => item.isAutoRejected).slice(0, 2);
  const lines = [
    ...shortlisted.map((item, index) => `${index + 1}. ${buildCandidateAnalysisLine(item)}`),
    ...rejected.map((item) => `Rejected: ${buildCandidateAnalysisLine(item)}`),
  ];

  return lines.join("\n");
}

function buildDefaultAssistantContext(pool: CopilotCandidatePoolDto | null) {
  if (!pool) {
    return "Chon mot job de toi nap context JD va ung vien cho cuoc trao doi nay.";
  }

  const requiredSkills = pool.job.requiredSkills.slice(0, 5).join(", ");
  const skillsLine = requiredSkills
    ? `Ky nang chinh: ${requiredSkills}.`
    : "JD hien chua co ky nang bat buoc duoc cau hinh.";

  return `Toi da nap context mac dinh cho job "${pool.job.title}" voi ${pool.candidates.length} ho so. ${skillsLine} Ban co the hoi cach loc, sap xep, so sanh ung vien, hoac bat Ranking mode khi can cham diem va xep hang.`;
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function normalizeCriterion(
  criterion: CopilotRuleCriterionDto,
): CopilotRuleCriterionDto {
  return {
    ...criterion,
    label: criterion.label.trim(),
    value: criterion.value.trim(),
  };
}

function AiCopilotScreen() {
  const [jobs, setJobs] = useState<CopilotJobOptionDto[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [conversation, setConversation] =
    useState<CopilotConversationDto | null>(null);
  const [pool, setPool] = useState<CopilotCandidatePoolDto | null>(null);
  const [ranking, setRanking] = useState<CopilotPromptResponseDto | null>(null);
  const [prompt, setPrompt] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [savedRules, setSavedRules] = useState<CopilotSavedRuleDto[]>([]);
  const [showCriteriaBuilder, setShowCriteriaBuilder] = useState(false);
  const [priorityDraft, setPriorityDraft] = useState<CopilotRuleCriterionDto>(
    EMPTY_PRIORITY_CRITERION,
  );
  const [negativeDraft, setNegativeDraft] = useState<CopilotRuleCriterionDto>(
    EMPTY_NEGATIVE_CRITERION,
  );
  const [priorityCriteria, setPriorityCriteria] = useState<
    CopilotRuleCriterionDto[]
  >([]);
  const [negativeCriteria, setNegativeCriteria] = useState<
    CopilotRuleCriterionDto[]
  >([]);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingPool, setLoadingPool] = useState(false);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [savingRule, setSavingRule] = useState(false);
  const [rankingEnabled, setRankingEnabled] = useState(false);

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
      .catch(() => toast.error("Unable to load jobs for AI Copilot."))
      .finally(() => {
        if (mounted) setLoadingJobs(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

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
    setLoadingStatus("");
    setRankingEnabled(false);

    async function loadJobContext() {
      try {
        const [conversationResponse, poolResponse, rulesResponse] =
          await Promise.all([
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

        const [conversationDetailResponse, rankingSessionResponse] =
          await Promise.all([
            copilotService.getConversation(nextConversation.conversationId),
            nextConversation.latestRankingSessionId
              ? copilotService.getRankingSession(
                  nextConversation.latestRankingSessionId,
                )
              : Promise.resolve(null),
          ]);

        if (!mounted) return;

        const nextChat = mapConversationToChat(conversationDetailResponse.data);
        setChat(
          nextChat.length > 0
            ? nextChat
            : [
                {
                  role: "assistant",
                  content: buildDefaultAssistantContext(poolResponse.data ?? null),
                },
              ],
        );

        if (rankingSessionResponse?.data) {
          setRanking(mapRankingSessionToPromptResponse(rankingSessionResponse.data));
        }
      } catch {
        if (mounted) toast.error("Unable to load candidate pool.");
      } finally {
        if (mounted) setLoadingPool(false);
      }
    }

    void loadJobContext();

    return () => {
      mounted = false;
    };
  }, [selectedJobId]);

  const rankedByCandidateId = useMemo(() => {
    return new Map(
      (ranking?.results ?? []).map((result) => [
        result.candidateUserId,
        result,
      ]),
    );
  }, [ranking]);

  const visibleCandidates = useMemo(() => {
    if (!pool) return [];
    if (!ranking || !ranking.didRank) return pool.candidates;

    const candidateById = new Map(
      pool.candidates.map((candidate) => [
        candidate.candidateUserId,
        candidate,
      ]),
    );
    return ranking.results
      .map((result) => candidateById.get(result.candidateUserId))
      .filter((candidate): candidate is CopilotCandidateDto =>
        Boolean(candidate),
      );
  }, [pool, ranking]);

  const hasStructuredCriteria =
    priorityCriteria.length > 0 || negativeCriteria.length > 0;
  const activeSavedRules = savedRules.filter((rule) => rule.isActive);

  async function submitPrompt(nextPrompt = prompt) {
    if (!conversation || !selectedJobId) {
      return;
    }

    const trimmedPrompt = nextPrompt.trim();
    const normalizedPriorityCriteria = rankingEnabled
      ? priorityCriteria.map(normalizeCriterion)
      : [];
    const normalizedNegativeCriteria = rankingEnabled
      ? negativeCriteria.map(normalizeCriterion)
      : [];
    const generatedPrompt = rankingEnabled
      ? buildCriteriaPrompt(
          normalizedPriorityCriteria,
          normalizedNegativeCriteria,
        )
      : "";
    const effectivePrompt = trimmedPrompt || generatedPrompt;

    if (!effectivePrompt) {
      return;
    }

    setPrompt("");
    setRankingLoading(true);
    setLoadingStatus(
      rankingEnabled
        ? "AI is reviewing candidates and generating reasoning..."
        : "AI is reading the job context and preparing a response...",
    );
    setChat((current) => [
      ...current,
      { role: "user", content: effectivePrompt },
      { role: "assistant", content: "" },
    ]);

    try {
      const response = await copilotService.createRanking(
        conversation.conversationId,
        {
          jobId: selectedJobId,
          prompt: effectivePrompt,
          forceRanking: rankingEnabled,
          priorityCriteria: normalizedPriorityCriteria,
          negativeCriteria: normalizedNegativeCriteria,
        },
      );
      if (!response.data) {
        setChat((current) => current.slice(0, -1));
        toast.error("AI Copilot did not return a ranking.");
        return;
      }

      setRanking(response.data.didRank ? response.data : null);
      const finalAssistantMessage =
        response.data.didRank
          ? response.data.assistantMessage ||
            buildAssistantSummaryFromResults(response.data.results)
          : response.data.assistantMessage ||
            "Toi da doc context hien tai. Ban co the hoi tiep de toi phan tich them, hoac bat Ranking mode khi muon cham diem ung vien.";

      const words = finalAssistantMessage.split(" ");
      let streamedMessage = "";
      for (let index = 0; index < words.length; index += 3) {
        streamedMessage = `${streamedMessage} ${words.slice(index, index + 3).join(" ")}`.trim();
        setChat((current) => {
          const next = [...current];
          next[next.length - 1] = {
            role: "assistant",
            content: streamedMessage,
          };
          return next;
        });
        await sleep(45);
      }
    } catch {
      setChat((current) => current.slice(0, -1));
      toast.error("Unable to rank candidates.");
    } finally {
      setRankingLoading(false);
      setLoadingStatus("");
    }
  }

  function addPriorityCriterion() {
    const normalized = normalizeCriterion(priorityDraft);
    if (!normalized.value) {
      toast.info("Enter a priority criterion first.");
      return;
    }

    setPriorityCriteria((current) => [...current, normalized]);
    setPriorityDraft(EMPTY_PRIORITY_CRITERION);
  }

  function addNegativeCriterion() {
    const normalized = normalizeCriterion(negativeDraft);
    if (!normalized.value) {
      toast.info("Enter a negative criterion first.");
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
    if (!selectedJobId || !hasStructuredCriteria) {
      toast.info("Add criteria before saving a rule.");
      return;
    }

    setSavingRule(true);
    try {
      const suggestedName = buildPresetSuggestion(
        priorityCriteria,
        negativeCriteria,
      );
      const response = await copilotService.createSavedRule(selectedJobId, {
        name: suggestedName,
        priorityCriteria,
        negativeCriteria,
        isActive: true,
      });

      if (response.data) {
        setSavedRules((current) => [response.data!, ...current]);
        toast.success("Preset saved.");
      }
    } catch {
      toast.error("Unable to save rule.");
    } finally {
      setSavingRule(false);
    }
  }

  async function deleteSavedRule(ruleId: string) {
    setDeletingRuleId(ruleId);
    try {
      await copilotService.deleteSavedRule(ruleId);
      setSavedRules((current) => current.filter((rule) => rule.ruleId !== ruleId));
      toast.success("Preset deleted.");
    } catch {
      toast.error("Unable to delete preset.");
    } finally {
      setDeletingRuleId(null);
    }
  }

  async function toggleSavedRule(rule: CopilotSavedRuleDto) {
    try {
      const response = await copilotService.updateSavedRuleStatus(
        rule.ruleId,
        !rule.isActive,
      );
      if (!response.data) return;

      setSavedRules((current) =>
        current.map((item) =>
          item.ruleId === rule.ruleId ? response.data! : item,
        ),
      );
    } catch {
      toast.error("Unable to update rule status.");
    }
  }

  if (loadingJobs) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center px-4 py-6 md:px-10">
        <LoadingIndicator label="Loading AI Copilot..." />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-88px)] w-full gap-0 overflow-hidden border border-[#e2dfde] bg-white">
      <section className="flex min-w-0 flex-1 flex-col bg-[#f9f9f9]">
        <header className="border-b border-[#e2dfde] bg-white px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#b90014]">
                AI Recruitment Copilot
              </p>
              <h1 className="mt-2 text-[32px] font-semibold leading-10 text-[#1a1c1c]">
                {pool?.job.title ?? "Select a job"}
              </h1>
              <p className="mt-1 text-[14px] text-[#5f5e5e]">
                {pool
                  ? `${pool.candidates.length} applications loaded from backend`
                  : "Choose an active job to load candidates"}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <CommonSelect
                className="min-w-[280px] border-[#e7bdb8] bg-white"
                options={jobs.map((job) => ({
                  label: `${job.title} (${job.applicationCount})`,
                  value: job.jobId,
                }))}
                value={selectedJobId}
                onChange={(event) => setSelectedJobId(event.target.value)}
              />
              <button
                type="button"
                className="inline-flex items-center gap-2 border border-[#1a1c1c] bg-white px-4 py-2 text-[12px] font-semibold text-[#1a1c1c] hover:bg-[#f3f3f3]"
              >
                <span className="material-symbols-outlined text-[18px]">
                  download
                </span>
                Export CSV
              </button>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-auto">
          {loadingPool ? (
            <div className="flex min-h-[420px] items-center justify-center">
              <LoadingIndicator label="Loading candidates..." />
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-[#1a1c1c] text-white">
                <tr>
                  <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.08em]">
                    Candidate
                  </th>
                  <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.08em]">
                    Education
                  </th>
                  <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.08em]">
                    Skills
                  </th>
                  <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.08em]">
                    Match Reason
                  </th>
                  <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.08em]">
                    AI Score
                  </th>
                  <th className="px-6 py-4 text-right text-[12px] font-semibold uppercase tracking-[0.08em]">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2dfde] bg-white text-[14px]">
                {visibleCandidates.map((candidate, index) => {
                  const result = rankedByCandidateId.get(
                    candidate.candidateUserId,
                  );
                  return (
                    <tr
                      key={candidate.candidateUserId}
                      className={`${index % 2 === 1 ? "bg-[#f9fafb]" : "bg-white"} ${result?.isAutoRejected ? "opacity-70" : ""}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-semibold text-[#1a1c1c]">
                              {candidate.fullName}
                            </p>
                            <p className="text-[12px] text-[#5f5e5e]">
                              {candidate.experienceYears} years exp
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[#1a1c1c]">
                          {candidate.education ?? "N/A"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex max-w-[280px] flex-wrap gap-1.5">
                          {candidate.skills.slice(0, 4).map((skill) => (
                            <span
                              key={skill}
                              className="bg-[#eeeeee] px-2 py-1 text-[11px] font-semibold text-[#5f5e5e]"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-[200px]">
                          <p className="line-clamp-2 text-[13px] leading-5 text-[#1a1c1c] text-wrap">
                            {matchReasonText(result)}
                          </p>
                          {result?.strengths.length ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {result.strengths.slice(0, 2).map((strength) => (
                                <span
                                  key={strength}
                                  className="bg-[#f3f3f3] px-2 py-1 text-[10px] font-semibold text-[#5f5e5e]"
                                >
                                  {strength}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {result ? (
                          <span
                            className={`inline-flex border px-3 py-1 text-[12px] font-bold ${scoreTone(result.totalScore)}`}
                          >
                            {result.isAutoRejected
                              ? "Rejected"
                              : `${Math.round(result.totalScore)}/100`}
                          </span>
                        ) : (
                          <span className="text-[12px] text-[#5f5e5e]">
                            Not ranked
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-[12px] font-semibold text-[#1a1c1c]">
                          {statusLabel(result)}
                        </span>
                        {result?.rejectReason ? (
                          <p className="mt-1 text-[11px] text-[#ba1a1a]">
                            {result.rejectReason}
                          </p>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <aside className="flex w-full max-w-[440px] flex-col border-l border-[#e2dfde] bg-white">
        <div className="flex items-center justify-between border-b border-[#e2dfde] px-6 py-5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <h2 className="text-[16px] font-semibold text-[#1a1c1c]">
              AI Copilot
            </h2>
          </div>
          <span className="material-symbols-outlined text-[#5f5e5e]">
            smart_toy
          </span>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-auto p-6">
          {chat.length === 0 ? (
            <div className="border border-dashed border-[#e2dfde] bg-[#f9f9f9] p-4 text-[14px] text-[#5f5e5e]">
              Start chat or apply structured criteria to rank candidates.
            </div>
          ) : null}

          {chat.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={
                message.role === "user"
                  ? "flex justify-end"
                  : "flex justify-start"
              }
            >
              <div
                className={`${message.role === "user" ? "bg-[#f3f3f3]" : "border border-[#ffdad6] bg-[#b90014]/5"} max-w-[88%] p-4 text-[14px] leading-5 text-[#1a1c1c]`}
              >
                {message.content ? (
                  message.content
                ) : (
                  <div className="flex items-center gap-2 text-[#5f5e5e]">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#b90014]" />
                    <span>AI is thinking...</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {ranking ? (
            <div className="bg-[#1a1c1c] p-4 text-white">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">
                Filtering Impact
              </p>
              <div className="mt-4 grid grid-cols-3 divide-x divide-white/20 text-center">
                <div>
                  <p className="text-[28px] font-bold">
                    {
                      ranking.results.filter((item) => !item.isAutoRejected)
                        .length
                    }
                  </p>
                  <p className="text-[10px] text-white/60">Retained</p>
                </div>
                <div>
                  <p className="text-[28px] font-bold text-[#ffb4ac]">
                    {
                      ranking.results.filter((item) => item.isAutoRejected)
                        .length
                    }
                  </p>
                  <p className="text-[10px] text-white/60">Rejected</p>
                </div>
                <div>
                  <p className="text-[28px] font-bold">
                    {ranking.normalizedRules.requiredSkills.length}
                  </p>
                  <p className="text-[10px] text-white/60">Required</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-[#e2dfde] p-4">
          <div className="relative">
            {hasStructuredCriteria ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {priorityCriteria.map((criterion, index) => (
                  <button
                    key={`priority-${criterion.field}-${criterion.value}-${index}`}
                    type="button"
                    className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-800"
                    onClick={() =>
                      setPriorityCriteria((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                  >
                    {criterion.label || criterion.value} x
                  </button>
                ))}
                {negativeCriteria.map((criterion, index) => (
                  <button
                    key={`negative-${criterion.field}-${criterion.value}-${index}`}
                    type="button"
                    className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-semibold text-rose-700"
                    onClick={() =>
                      setNegativeCriteria((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                  >
                    {criterion.label || criterion.value} x
                  </button>
                ))}
                {activeSavedRules.map((rule) => (
                  <button
                    key={`active-saved-${rule.ruleId}`}
                    type="button"
                    className="rounded-full bg-sky-100 px-3 py-1 text-[11px] font-semibold text-sky-800"
                    onClick={() => void toggleSavedRule(rule)}
                  >
                    {rule.name} x
                  </button>
                ))}
              </div>
            ) : activeSavedRules.length > 0 ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {activeSavedRules.map((rule) => (
                  <button
                    key={`active-saved-${rule.ruleId}`}
                    type="button"
                    className="rounded-full bg-sky-100 px-3 py-1 text-[11px] font-semibold text-sky-800"
                    onClick={() => void toggleSavedRule(rule)}
                  >
                    {rule.name} x
                  </button>
                ))}
              </div>
            ) : null}

            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className={`inline-flex items-center gap-2 border px-3 py-2 text-[12px] font-semibold ${
                    rankingEnabled
                      ? "border-[#b90014] bg-[#fff1ef] text-[#b90014]"
                      : "border-[#1a1c1c] bg-white text-[#1a1c1c]"
                  }`}
                  onClick={() => setRankingEnabled((current) => !current)}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {rankingEnabled ? "toggle_on" : "toggle_off"}
                  </span>
                  {rankingEnabled ? "Ranking Mode On" : "Ranking Mode Off"}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 border border-[#1a1c1c] px-3 py-2 text-[12px] font-semibold text-[#1a1c1c] disabled:opacity-50"
                  disabled={!rankingEnabled}
                  onClick={() => setShowCriteriaBuilder((current) => !current)}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    tune
                  </span>
                  {showCriteriaBuilder ? "Hide Criteria" : "Add Criteria"}
                </button>
              </div>
              {rankingEnabled && hasStructuredCriteria ? (
                <button
                  type="button"
                  className="text-[11px] font-semibold text-[#ba1a1a]"
                  onClick={clearCurrentCriteria}
                >
                  Clear
                </button>
              ) : (
                <span className="text-right text-[11px] text-[#5f5e5e]">
                  {rankingEnabled
                    ? "Optional"
                    : "Chat mode uses JD and application context only"}
                </span>
              )}
            </div>

            {rankingLoading ? (
              <div className="mb-3 flex items-center gap-2 border border-[#ffdad6] bg-[#fff8f7] px-3 py-2 text-[12px] text-[#8a2d1d]">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#e7bdb8] border-t-[#b90014]" />
                <span>{loadingStatus || "AI is reviewing candidates..."}</span>
              </div>
            ) : null}

            <textarea
              className="h-24 w-full resize-none border border-[#e2dfde] bg-[#f3f3f3] p-3 pr-12 text-[14px] outline-none focus:border-[#1a1c1c]"
              placeholder={
                rankingEnabled
                  ? "Ask for ranking, or leave blank and rank with active criteria..."
                  : "Ask about the JD, candidate pool, filtering approach, or screening strategy..."
              }
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
            />
            <button
              type="button"
              className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center bg-[#b90014] text-white disabled:opacity-50"
              disabled={
                rankingLoading ||
                !conversation ||
                (!prompt.trim() && !(rankingEnabled && hasStructuredCriteria))
              }
              onClick={() => void submitPrompt()}
            >
              {rankingLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <span className="material-symbols-outlined text-[18px]">
                  send
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {showCriteriaBuilder ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#1a1c1c]/35 px-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-[720px] overflow-auto border border-[#e2dfde] bg-white p-6 shadow-[0_30px_80px_rgba(0,0,0,0.22)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1a1c1c]">
                  Criteria Builder
                </p>
                <h3 className="mt-2 text-[24px] font-semibold text-[#1a1c1c]">
                  Tune AI evaluation rules
                </h3>
              </div>
              <button
                type="button"
                className="border border-[#1a1c1c] px-3 py-2 text-[12px] font-semibold text-[#1a1c1c]"
                onClick={() => setShowCriteriaBuilder(false)}
              >
                Close
              </button>
            </div>

            <div className="mt-4 border border-[#e2dfde] bg-[#faf7f6] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1a1c1c]">
                  Current Criteria
                </p>
                <div className="flex items-center gap-3">
                  {hasStructuredCriteria ? (
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-[#005f93] disabled:opacity-50"
                      disabled={savingRule}
                      onClick={() => void saveCurrentRule()}
                    >
                      {savingRule ? "Saving..." : "Save preset"}
                    </button>
                  ) : null}
                  {hasStructuredCriteria ? (
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-[#ba1a1a]"
                      onClick={clearCurrentCriteria}
                    >
                      Clear All
                    </button>
                  ) : null}
                </div>
              </div>
              {hasStructuredCriteria ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {priorityCriteria.map((criterion, index) => (
                    <button
                      key={`current-priority-${criterion.field}-${criterion.value}-${index}`}
                      type="button"
                      className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-800"
                      onClick={() =>
                        setPriorityCriteria((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                    >
                      {describeCriterion(criterion)} x
                    </button>
                  ))}
                  {negativeCriteria.map((criterion, index) => (
                    <button
                      key={`current-negative-${criterion.field}-${criterion.value}-${index}`}
                      type="button"
                      className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-semibold text-rose-700"
                      onClick={() =>
                        setNegativeCriteria((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                    >
                      {describeCriterion(criterion)} x
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-[12px] text-[#5f5e5e]">
                  No custom criteria.
                </p>
              )}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="border border-[#e2dfde] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1a1c1c]">
                  Priority Criteria
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <CommonSelect
                    options={[
                      { label: "Skill", value: "skill" },
                      { label: "Experience", value: "experienceYears" },
                      { label: "Education", value: "education" },
                      { label: "CV Summary", value: "cvSummary" },
                    ]}
                    value={priorityDraft.field}
                    onChange={(event) =>
                      setPriorityDraft((current) => ({
                        ...current,
                        field: event.target.value,
                      }))
                    }
                  />
                  <CommonSelect
                    options={[
                      { label: "High", value: "high" },
                      { label: "Medium", value: "medium" },
                      { label: "Low", value: "low" },
                    ]}
                    value={priorityDraft.weight}
                    onChange={(event) =>
                      setPriorityDraft((current) => ({
                        ...current,
                        weight: event.target.value,
                      }))
                    }
                  />
                  <input
                    className="col-span-2 border border-[#e2dfde] px-3 py-2 text-[13px] outline-none focus:border-[#1a1c1c]"
                    placeholder="Label, eg. Strong .NET background"
                    value={priorityDraft.label}
                    onChange={(event) =>
                      setPriorityDraft((current) => ({
                        ...current,
                        label: event.target.value,
                      }))
                    }
                  />
                  <input
                    className="col-span-2 border border-[#e2dfde] px-3 py-2 text-[13px] outline-none focus:border-[#1a1c1c]"
                    placeholder="Value, eg. .NET or 3"
                    value={priorityDraft.value}
                    onChange={(event) =>
                      setPriorityDraft((current) => ({
                        ...current,
                        value: event.target.value,
                      }))
                    }
                  />
                </div>
                <button
                  type="button"
                  className="mt-3 border border-[#1a1c1c] px-3 py-2 text-[12px] font-semibold text-[#1a1c1c]"
                  onClick={addPriorityCriterion}
                >
                  Add Priority
                </button>

                {priorityCriteria.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {priorityCriteria.map((criterion, index) => (
                      <button
                        key={`modal-priority-${criterion.field}-${criterion.value}-${index}`}
                        type="button"
                        className="bg-[#f3f3f3] px-2 py-1 text-[11px] text-[#1a1c1c]"
                        onClick={() =>
                          setPriorityCriteria((current) =>
                            current.filter((_, itemIndex) => itemIndex !== index),
                          )
                        }
                      >
                        {describeCriterion(criterion)} x
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="border border-[#e2dfde] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1a1c1c]">
                  Negative Criteria
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <CommonSelect
                    options={[
                      { label: "Education", value: "education" },
                      { label: "Experience", value: "experienceYears" },
                      { label: "CV Summary", value: "cvSummary" },
                    ]}
                    value={negativeDraft.field}
                    onChange={(event) =>
                      setNegativeDraft((current) => ({
                        ...current,
                        field: event.target.value,
                      }))
                    }
                  />
                  <CommonSelect
                    options={[
                      { label: "Auto Reject", value: "true" },
                      { label: "Penalty Only", value: "false" },
                    ]}
                    value={negativeDraft.autoReject ? "true" : "false"}
                    onChange={(event) =>
                      setNegativeDraft((current) => ({
                        ...current,
                        autoReject: event.target.value === "true",
                      }))
                    }
                  />
                  <input
                    className="col-span-2 border border-[#e2dfde] px-3 py-2 text-[13px] outline-none focus:border-[#1a1c1c]"
                    placeholder="Label, eg. Reject FPT Student"
                    value={negativeDraft.label}
                    onChange={(event) =>
                      setNegativeDraft((current) => ({
                        ...current,
                        label: event.target.value,
                      }))
                    }
                  />
                  <input
                    className="col-span-2 border border-[#e2dfde] px-3 py-2 text-[13px] outline-none focus:border-[#1a1c1c]"
                    placeholder="Value, eg. FPT"
                    value={negativeDraft.value}
                    onChange={(event) =>
                      setNegativeDraft((current) => ({
                        ...current,
                        value: event.target.value,
                      }))
                    }
                  />
                </div>
                <button
                  type="button"
                  className="mt-3 border border-[#1a1c1c] px-3 py-2 text-[12px] font-semibold text-[#1a1c1c]"
                  onClick={addNegativeCriterion}
                >
                  Add Negative
                </button>

                {negativeCriteria.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {negativeCriteria.map((criterion, index) => (
                      <button
                        key={`modal-negative-${criterion.field}-${criterion.value}-${index}`}
                        type="button"
                        className="bg-[#ffedea] px-2 py-1 text-[11px] text-[#8a2d1d]"
                        onClick={() =>
                          setNegativeCriteria((current) =>
                            current.filter((_, itemIndex) => itemIndex !== index),
                          )
                        }
                      >
                        {describeCriterion(criterion)}
                        {criterion.autoReject ? " (Auto Reject)" : " (Penalty)"} x
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-6 border border-[#e2dfde] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8a2d1d]">
                  Saved Presets
                </p>
                <span className="text-[11px] text-[#5f5e5e]">Apply or delete</span>
              </div>
              {savedRules.length === 0 ? (
                <p className="mt-3 text-[12px] text-[#5f5e5e]">
                  No presets saved.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {savedRules.map((rule) => (
                    <div
                      key={`modal-saved-${rule.ruleId}`}
                      className="flex items-center justify-between gap-3 rounded-[20px] border border-[#e2dfde] px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-semibold text-[#1a1c1c]">
                          {rule.name}
                        </p>
                        <p className="text-[11px] text-[#5f5e5e]">
                          {countRuleCriteria(rule).priorityCount} priority •{" "}
                          {countRuleCriteria(rule).negativeCount} negative
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                            rule.isActive
                              ? "bg-slate-100 text-slate-500"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                          onClick={() => void toggleSavedRule(rule)}
                        >
                          {rule.isActive ? "Not apply" : "Apply"}
                        </button>
                        <button
                          type="button"
                          className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-semibold text-rose-700 disabled:opacity-50"
                          disabled={deletingRuleId === rule.ruleId}
                          onClick={() => void deleteSavedRule(rule.ruleId)}
                        >
                          {deletingRuleId === rule.ruleId ? "Deleting" : "Delete"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default AiCopilotScreen;
