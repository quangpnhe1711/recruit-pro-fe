import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import CommonSelect from "../../common/components/CommonSelect";
import LoadingIndicator from "../../common/components/LoadingIndicator";
import {
  copilotService,
  type CopilotCandidateDto,
  type CopilotCandidatePoolDto,
  type CopilotConversationDto,
  type CopilotJobOptionDto,
  type CopilotPromptResponseDto,
  type CopilotRankingResultDto,
} from "../../services/copilot/copilotService";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

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

function AiCopilotScreen() {
  const [jobs, setJobs] = useState<CopilotJobOptionDto[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [conversation, setConversation] = useState<CopilotConversationDto | null>(null);
  const [pool, setPool] = useState<CopilotCandidatePoolDto | null>(null);
  const [ranking, setRanking] = useState<CopilotPromptResponseDto | null>(null);
  const [prompt, setPrompt] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingPool, setLoadingPool] = useState(false);
  const [rankingLoading, setRankingLoading] = useState(false);

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

    Promise.all([
      copilotService.createConversation(selectedJobId),
      copilotService.getCandidatePool(selectedJobId),
    ])
      .then(([conversationResponse, poolResponse]) => {
        if (!mounted) return;
        setConversation(conversationResponse.data);
        setPool(poolResponse.data);
      })
      .catch(() => toast.error("Unable to load candidate pool."))
      .finally(() => {
        if (mounted) setLoadingPool(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedJobId]);

  const rankedByCandidateId = useMemo(() => {
    return new Map((ranking?.results ?? []).map((result) => [result.candidateUserId, result]));
  }, [ranking]);

  const visibleCandidates = useMemo(() => {
    if (!pool) return [];
    if (!ranking) return pool.candidates;

    const candidateById = new Map(pool.candidates.map((candidate) => [candidate.candidateUserId, candidate]));
    return ranking.results
      .map((result) => candidateById.get(result.candidateUserId))
      .filter((candidate): candidate is CopilotCandidateDto => Boolean(candidate));
  }, [pool, ranking]);

  async function submitPrompt(nextPrompt = prompt) {
    if (!conversation || !selectedJobId || !nextPrompt.trim()) {
      return;
    }

    const trimmedPrompt = nextPrompt.trim();
    setPrompt("");
    setRankingLoading(true);
    setChat((current) => [...current, { role: "user", content: trimmedPrompt }]);

    try {
      const response = await copilotService.createRanking(conversation.conversationId, {
        jobId: selectedJobId,
        prompt: trimmedPrompt,
      });
      if (!response.data) {
        toast.error("AI Copilot did not return a ranking.");
        return;
      }

      setRanking(response.data);
      const rejected = response.data.results.filter((item) => item.isAutoRejected).length;
      setChat((current) => [
        ...current,
        {
          role: "assistant",
          content: `Ranked ${response.data?.results.length ?? 0} candidates. ${rejected} auto rejected.`,
        },
      ]);
    } catch {
      toast.error("Unable to rank candidates.");
    } finally {
      setRankingLoading(false);
    }
  }

  if (loadingJobs) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-[1440px] items-center justify-center px-4 py-6 md:px-10">
        <LoadingIndicator label="Loading AI Copilot..." />
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-88px)] w-full max-w-[1440px] gap-0 overflow-hidden border border-[#e2dfde] bg-white">
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
                {pool ? `${pool.candidates.length} applications loaded from backend` : "Choose an active job to load candidates"}
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
                <span className="material-symbols-outlined text-[18px]">download</span>
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
                  <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.08em]">Candidate</th>
                  <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.08em]">Education</th>
                  <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.08em]">Skills</th>
                  <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.08em]">AI Score</th>
                  <th className="px-6 py-4 text-right text-[12px] font-semibold uppercase tracking-[0.08em]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2dfde] bg-white text-[14px]">
                {visibleCandidates.map((candidate, index) => {
                  const result = rankedByCandidateId.get(candidate.candidateUserId);
                  return (
                    <tr
                      key={candidate.candidateUserId}
                      className={`${index % 2 === 1 ? "bg-[#f9fafb]" : "bg-white"} ${result?.isAutoRejected ? "opacity-70" : ""}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center bg-[#ffdad6] text-[12px] font-bold text-[#b90014]">
                            {candidate.fullName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-[#1a1c1c]">{candidate.fullName}</p>
                            <p className="text-[12px] text-[#5f5e5e]">{candidate.experienceYears} years exp</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[#1a1c1c]">{candidate.education ?? "N/A"}</p>
                        <p className="line-clamp-1 text-[12px] text-[#5f5e5e]">{candidate.cvSummary || "No CV summary"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex max-w-[280px] flex-wrap gap-1.5">
                          {candidate.skills.slice(0, 4).map((skill) => (
                            <span key={skill} className="bg-[#eeeeee] px-2 py-1 text-[11px] font-semibold text-[#5f5e5e]">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {result ? (
                          <span className={`inline-flex border px-3 py-1 text-[12px] font-bold ${scoreTone(result.totalScore)}`}>
                            {result.isAutoRejected ? "Rejected" : `${Math.round(result.totalScore)}/100`}
                          </span>
                        ) : (
                          <span className="text-[12px] text-[#5f5e5e]">Not ranked</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-[12px] font-semibold text-[#1a1c1c]">
                          {statusLabel(result)}
                        </span>
                        {result?.rejectReason ? (
                          <p className="mt-1 text-[11px] text-[#ba1a1a]">{result.rejectReason}</p>
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

      <aside className="flex w-full max-w-[420px] flex-col border-l border-[#e2dfde] bg-white">
        <div className="flex items-center justify-between border-b border-[#e2dfde] px-6 py-5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <h2 className="text-[16px] font-semibold text-[#1a1c1c]">AI Copilot</h2>
          </div>
          <span className="material-symbols-outlined text-[#5f5e5e]">smart_toy</span>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-auto p-6">
          {chat.length === 0 ? (
            <div className="border border-dashed border-[#e2dfde] bg-[#f9f9f9] p-4 text-[14px] text-[#5f5e5e]">
              Select a job, then ask the copilot to rank candidates by skills, education, or experience.
            </div>
          ) : null}

          {chat.map((message, index) => (
            <div key={`${message.role}-${index}`} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div className={`${message.role === "user" ? "bg-[#f3f3f3]" : "border border-[#ffdad6] bg-[#b90014]/5"} max-w-[88%] p-4 text-[14px] leading-5 text-[#1a1c1c]`}>
                {message.content}
              </div>
            </div>
          ))}

          {ranking ? (
            <div className="bg-[#1a1c1c] p-4 text-white">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">Filtering Impact</p>
              <div className="mt-4 grid grid-cols-3 divide-x divide-white/20 text-center">
                <div>
                  <p className="text-[28px] font-bold">{ranking.results.filter((item) => !item.isAutoRejected).length}</p>
                  <p className="text-[10px] text-white/60">Retained</p>
                </div>
                <div>
                  <p className="text-[28px] font-bold text-[#ffb4ac]">{ranking.results.filter((item) => item.isAutoRejected).length}</p>
                  <p className="text-[10px] text-white/60">Rejected</p>
                </div>
                <div>
                  <p className="text-[28px] font-bold">{ranking.normalizedRules.requiredSkills.length}</p>
                  <p className="text-[10px] text-white/60">Rules</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-[#e2dfde] p-4">
          <div className="relative">
            <textarea
              className="h-24 w-full resize-none border border-[#e2dfde] bg-[#f3f3f3] p-3 pr-12 text-[14px] outline-none focus:border-[#1a1c1c]"
              placeholder="Tiep tuc hoi AI..."
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
            />
            <button
              type="button"
              className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center bg-[#b90014] text-white disabled:opacity-50"
              disabled={rankingLoading || !prompt.trim() || !conversation}
              onClick={() => void submitPrompt()}
            >
              {rankingLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <span className="material-symbols-outlined text-[18px]">send</span>
              )}
            </button>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {["Tim ung vien biet Java Spring Boot", "Loai toan bo sinh vien FPT", "Uu tien ung vien tren 2 nam kinh nghiem"].map((item) => (
              <button
                key={item}
                type="button"
                className="shrink-0 bg-[#eeeeee] px-3 py-1 text-[12px] text-[#1a1c1c] hover:bg-[#e2dfde]"
                onClick={() => void submitPrompt(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

export default AiCopilotScreen;
