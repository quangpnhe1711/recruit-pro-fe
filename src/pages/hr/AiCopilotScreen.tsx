import { type ReactNode, Fragment, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import AsyncActionButton from "../../common/components/AsyncActionButton";
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
    return `- **${result.fullName}**: ${result.summary.trim()}`;
  }

  const strengths = result.strengths.slice(0, 2).join(", ");
  const weaknesses = result.weaknesses.slice(0, 2).join(", ");

  if (result.isAutoRejected) {
    return `- **${result.fullName}**: ${result.rejectReason || weaknesses || "không đạt tiêu chí hiện tại"}.`;
  }

  const parts = [
    strengths ? `phù hợp ở ${strengths}` : "",
    weaknesses ? `lưu ý ${weaknesses}` : "",
  ].filter(Boolean);

  return `- **${result.fullName}**: ${parts.join("; ") || "đã được AI phân tích."}`;
}

function buildAssistantSummaryFromResults(results: CopilotRankingResultDto[]) {
  const shortlisted = results.filter((item) => !item.isAutoRejected).slice(0, 3);
  const rejected = results.filter((item) => item.isAutoRejected).slice(0, 2);
  const lines = [
    ...shortlisted.length > 0 ? ["Ứng viên nổi bật:"] : [],
    ...shortlisted.map((item) => buildCandidateAnalysisLine(item)),
    ...rejected.length > 0 ? ["", "Ứng viên cần lưu ý:"] : [],
    ...rejected.map((item) => buildCandidateAnalysisLine(item)),
  ];

  return lines.join("\n");
}

function buildDefaultAssistantContext(pool: CopilotCandidatePoolDto | null) {
  if (!pool) {
    return "Chọn một job để tôi nạp JD và danh sách ứng viên cho cuộc trao đổi này.";
  }

  const requiredSkills = pool.job.requiredSkills.slice(0, 5).join(", ");
  const skillsLine = requiredSkills
    ? `Kỹ năng chính: ${requiredSkills}.`
    : "JD hiện chưa có kỹ năng bắt buộc được cấu hình.";

  return `Bắt đầu trao đổi với AI Copilot để đánh giá ứng viên cho job "${pool.job.title}". ${skillsLine} Bạn có thể yêu cầu tôi phân tích từng ứng viên hoặc đưa ra hướng dẫn sàng lọc tổng quát cho cả nguồn ứng viên.`;
}

function renderInlineRichText(text: string) {
  const normalized = text.replace(/\*\*(.+?)\*\*/g, "%%B%%$1%%/B%%");
  const segments = normalized.split(/(%%B%%.*?%%\/B%%)/g).filter(Boolean);

  return segments.map((segment, index) => {
    const boldMatch = segment.match(/^%%B%%(.*?)%%\/B%%$/);
    if (boldMatch) {
      return (
        <strong key={`bold-${index.toString()}`} className="font-semibold text-[#111827]">
          {boldMatch[1]}
        </strong>
      );
    }

    return <Fragment key={`text-${index.toString()}`}>{segment}</Fragment>;
  });
}

function renderAssistantContent(content: string): ReactNode {
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <div className="space-y-4">
      {paragraphs.map((paragraph, index) => {
        const lines = paragraph
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);
        const isBulletList = lines.every((line) => /^[-*]\s+/.test(line));
        const isNumberList = lines.every((line) => /^\d+\.\s+/.test(line));

        if (isBulletList || isNumberList) {
          return (
            <ul
              key={`list-${index.toString()}`}
              className="space-y-2 pl-5 text-[14px] leading-7 text-[#1f2937]"
            >
              {lines.map((line, lineIndex) => (
                <li
                  key={`line-${lineIndex.toString()}`}
                  className="marker:text-[#b90014]"
                >
                  {renderInlineRichText(line.replace(/^([-*]|\d+\.)\s+/, ""))}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p
            key={`paragraph-${index.toString()}`}
            className="text-[14px] leading-7 text-[#1f2937]"
          >
            {renderInlineRichText(paragraph)}
          </p>
        );
      })}
    </div>
  );
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
      .catch(() => toast.error("Không tải được danh sách job cho AI Copilot."))
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
        if (mounted) toast.error("Không tải được danh sách ứng viên.");
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
        ? "AI đang đánh giá ứng viên và tạo phần giải thích..."
        : "AI đang đọc ngữ cảnh job và chuẩn bị phản hồi...",
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
        toast.error("AI Copilot chưa trả về bảng xếp hạng.");
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
      toast.error("Không thể xếp hạng ứng viên.");
    } finally {
      setRankingLoading(false);
      setLoadingStatus("");
    }
  }

  function addPriorityCriterion() {
    const normalized = normalizeCriterion(priorityDraft);
    if (!normalized.value) {
      toast.info("Hãy nhập tiêu chí ưu tiên.");
      return;
    }

    setPriorityCriteria((current) => [...current, normalized]);
    setPriorityDraft(EMPTY_PRIORITY_CRITERION);
  }

  function addNegativeCriterion() {
    const normalized = normalizeCriterion(negativeDraft);
    if (!normalized.value) {
      toast.info("Hãy nhập tiêu chí loại trừ.");
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
      toast.info("Hãy thêm tiêu chí trước khi lưu.");
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
        toast.success("Đã lưu mẫu.");
      }
    } catch {
      toast.error("Không lưu được quy tắc.");
    } finally {
      setSavingRule(false);
    }
  }

  async function deleteSavedRule(ruleId: string) {
    setDeletingRuleId(ruleId);
    try {
      await copilotService.deleteSavedRule(ruleId);
      setSavedRules((current) => current.filter((rule) => rule.ruleId !== ruleId));
      toast.success("Đã xóa mẫu.");
    } catch {
      toast.error("Không thể xóa mẫu.");
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
      toast.error("Không cập nhật được trạng thái quy tắc.");
    }
  }

  if (loadingJobs) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center px-4 py-6 md:px-10">
        <LoadingIndicator label="Đang tải AI Copilot..." />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-88px)] w-full max-w-[100vw] flex-col overflow-hidden border border-[#e2dfde] bg-white xl:flex-row">
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f9f9f9]">
        <header className="border-b border-[#e2dfde] bg-white px-6 py-5">
          <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#b90014]">
                AI Recruitment Copilot
              </p>
              <h1 className="page-title mt-2">
                {pool?.job.title ?? "Chọn một job"}
              </h1>
            </div>

            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <CommonSelect
                className="w-full min-w-0 border-[#e7bdb8] bg-white sm:min-w-[280px]"
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
                Xuất CSV
              </button>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-auto">
          {loadingPool ? (
            <div className="flex min-h-[420px] items-center justify-center">
              <LoadingIndicator label="Đang tải ứng viên..." />
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-hide">
              <table className="min-w-[1100px] w-full border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-[#1a1c1c] text-white">
                <tr>
                  <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.08em]">
                    Ứng viên
                  </th>
                  <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.08em]">
                    Học vấn
                  </th>
                  <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.08em]">
                    Kỹ năng
                  </th>
                  <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.08em]">
                    Lý do phù hợp
                  </th>
                  <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.08em]">
                    Điểm AI
                  </th>
                  <th className="px-6 py-4 text-right text-[12px] font-semibold uppercase tracking-[0.08em]">
                    Trạng thái
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
                              {candidate.experienceYears} năm kinh nghiệm
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                          <p className="text-[#1a1c1c]">
                          {candidate.education ?? "Chưa cập nhật"}
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
            </div>
          )}
        </div>
      </section>

      <aside className="flex w-full min-w-0 flex-col border-t border-[#e2dfde] bg-white xl:w-[440px] xl:max-w-[440px] xl:border-l xl:border-t-0">
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
            <div className="rounded-2xl border border-dashed border-[#e2dfde] bg-[#f9f9f9] p-4 text-[14px] text-[#5f5e5e]">
              Bắt đầu chat hoặc áp dụng bộ tiêu chí để xếp hạng ứng viên.
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
                className={`max-w-[92%] ${
                  message.role === "user"
                    ? "rounded-2xl bg-[#1a1c1c] px-4 py-3 text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)]"
                    : "rounded-3xl border border-[#ffdad6] bg-[#fffaf9] px-4 py-4 text-[#1a1c1c] shadow-[0_10px_24px_rgba(185,0,20,0.05)]"
                }`}
              >
                {message.content ? (
                  message.role === "assistant" ? (
                    renderAssistantContent(message.content)
                  ) : (
                    <div className="max-w-[70ch] whitespace-pre-wrap text-[14px] leading-6">
                      {message.content}
                    </div>
                  )
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
            <div className="rounded-3xl bg-[#1a1c1c] p-4 text-white shadow-[0_16px_32px_rgba(0,0,0,0.22)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">
                Tác động lọc
              </p>
              <div className="mt-4 grid grid-cols-3 divide-x divide-white/20 text-center">
                <div>
                  <p className="text-[28px] font-bold">
                    {
                      ranking.results.filter((item) => !item.isAutoRejected)
                        .length
                    }
                  </p>
                  <p className="text-[10px] text-white/60">Giữ lại</p>
                </div>
                <div>
                  <p className="text-[28px] font-bold text-[#ffb4ac]">
                    {
                      ranking.results.filter((item) => item.isAutoRejected)
                        .length
                    }
                  </p>
                  <p className="text-[10px] text-white/60">Loại</p>
                </div>
                <div>
                  <p className="text-[28px] font-bold">
                    {ranking.normalizedRules.requiredSkills.length}
                  </p>
                  <p className="text-[10px] text-white/60">Bắt buộc</p>
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
                  {rankingEnabled ? "Bật chế độ xếp hạng" : "Tắt chế độ xếp hạng"}
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
                  {showCriteriaBuilder ? "Ẩn tiêu chí" : "Thêm tiêu chí"}
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
                    ? "Tùy chọn"
                    : ""}
                </span>
              )}
            </div>

            {rankingLoading ? (
              <div className="mb-3 flex items-center gap-2 border border-[#ffdad6] bg-[#fff8f7] px-3 py-2 text-[12px] text-[#8a2d1d]">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#e7bdb8] border-t-[#b90014]" />
                <span>{loadingStatus || "AI đang đánh giá ứng viên..."}</span>
              </div>
            ) : null}

            <textarea
              className="h-24 w-full resize-none rounded-2xl border border-[#e2dfde] bg-[#f3f3f3] p-4 pr-12 text-[14px] outline-none focus:border-[#1a1c1c]"
              placeholder={
                rankingEnabled
                  ? "Yêu cầu xếp hạng, hoặc để trống để xếp hạng theo tiêu chí đang bật..."
                  : "Hỏi về JD, danh sách ứng viên, cách lọc hoặc chiến lược sàng lọc..."
              }
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
            />
            <button
              type="button"
              className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#b90014] text-white shadow-[0_8px_20px_rgba(185,0,20,0.24)] disabled:opacity-50"
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
          <div className="max-h-[85vh] w-full max-w-[760px] overflow-auto rounded-[28px] border border-[#e2dfde] bg-white p-6 shadow-[0_30px_80px_rgba(0,0,0,0.22)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1a1c1c]">
                  Trình tạo tiêu chí
                </p>
                <h3 className="mt-2 text-[24px] font-semibold text-[#1a1c1c]">
                  Tinh chỉnh tiêu chí đánh giá AI
                </h3>
              </div>
              <button
                type="button"
                className="border border-[#1a1c1c] px-3 py-2 text-[12px] font-semibold text-[#1a1c1c]"
                onClick={() => setShowCriteriaBuilder(false)}
              >
                Đóng
              </button>
            </div>

            <div className="mt-4 border border-[#e2dfde] bg-[#faf7f6] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1a1c1c]">
                  Tiêu chí hiện tại
                </p>
                <div className="flex items-center gap-3">
                  {hasStructuredCriteria ? (
                    <AsyncActionButton
                      type="button"
                      className="text-[11px] font-semibold text-[#005f93] disabled:opacity-50"
                      disabled={savingRule}
                      loading={savingRule}
                      loadingText="Đang lưu..."
                      onClick={saveCurrentRule}
                      spinnerTone="brand"
                    >
                      Lưu preset
                    </AsyncActionButton>
                  ) : null}
                  {hasStructuredCriteria ? (
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-[#ba1a1a]"
                      onClick={clearCurrentCriteria}
                    >
                      Xóa tất cả
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
                  Chưa có tiêu chí tùy chỉnh.
                </p>
              )}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="border border-[#e2dfde] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1a1c1c]">
                  Tiêu chí ưu tiên
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <CommonSelect
                    options={[
                      { label: "Kỹ năng", value: "skill" },
                      { label: "Kinh nghiệm", value: "experienceYears" },
                      { label: "Học vấn", value: "education" },
                      { label: "Tóm tắt CV", value: "cvSummary" },
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
                      { label: "Cao", value: "high" },
                      { label: "Trung bình", value: "medium" },
                      { label: "Thấp", value: "low" },
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
                    placeholder="Nhãn, ví dụ: Nền tảng .NET vững"
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
                    placeholder="Giá trị, ví dụ: .NET hoặc 3"
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
                  Thêm tiêu chí ưu tiên
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
                  Tiêu chí loại trừ
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <CommonSelect
                    options={[
                      { label: "Học vấn", value: "education" },
                      { label: "Kinh nghiệm", value: "experienceYears" },
                      { label: "Tóm tắt CV", value: "cvSummary" },
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
                      { label: "Tự động loại", value: "true" },
                      { label: "Chỉ trừ điểm", value: "false" },
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
                    placeholder="Nhãn, ví dụ: Loại ứng viên thiếu bằng cấp"
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
                    placeholder="Giá trị, ví dụ: FPT"
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
                  Thêm tiêu chí loại trừ
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
                        {criterion.autoReject ? " (Tự động loại)" : " (Trừ điểm)"} x
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-6 border border-[#e2dfde] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8a2d1d]">
                  Preset đã lưu
                </p>
                <span className="text-[11px] text-[#5f5e5e]">Áp dụng hoặc xóa</span>
              </div>
              {savedRules.length === 0 ? (
                <p className="mt-3 text-[12px] text-[#5f5e5e]">
                  Chưa có preset nào được lưu.
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
                        <AsyncActionButton
                          type="button"
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                            rule.isActive
                              ? "bg-slate-100 text-slate-500"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                          loadingText=""
                          onClick={() => toggleSavedRule(rule)}
                          spinnerTone="brand"
                        >
                          {rule.isActive ? "Ngừng áp dụng" : "Áp dụng"}
                        </AsyncActionButton>
                        <AsyncActionButton
                          type="button"
                          className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-semibold text-rose-700 disabled:opacity-50"
                          disabled={deletingRuleId === rule.ruleId}
                          loading={deletingRuleId === rule.ruleId}
                          loadingText="Đang xóa..."
                          onClick={() => deleteSavedRule(rule.ruleId)}
                          spinnerTone="brand"
                        >
                          Xóa
                        </AsyncActionButton>
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
