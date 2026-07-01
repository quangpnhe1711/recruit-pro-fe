// Shared presentation atoms, formatting helpers, and types for the AI Copilot screen.
// Extracted so the screen orchestrator stays readable and each piece is reusable.

import { type ReactNode, Fragment } from "react";
import {
  AI_RANKING_COPY,
  normalizeEducation,
  normalizeSkills,
  scoreBand,
  type ScoreBand,
} from "../../../common/utils/aiRankingPresentation";
import type {
  CopilotCandidatePoolDto,
  CopilotConversationDetailDto,
  CopilotPromptResponseDto,
  CopilotRankingResultDto,
  CopilotRankingSessionDetailDto,
  CopilotRuleCriterionDto,
  CopilotSavedRuleDto,
} from "../../../services/copilot/copilotService";

/* -------------------------------------------------------------------------- */
/* Chat + tool result types                                                   */
/* -------------------------------------------------------------------------- */

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ToolName = "fit" | "questions" | "email" | "search" | "shortlist";

export type ToolResult =
  | {
      kind: "fit";
      candidateName: string;
      fitLabel: string;
      confidenceScore: number;
      totalScore: number;
      summary: string;
      strengths: string[];
      gaps: string[];
      evidence: string[];
      fallbackUsed: boolean;
    }
  | {
      kind: "questions";
      candidateName: string | null;
      focus: string;
      questions: { category: string; question: string; evidence: string }[];
      fallbackUsed: boolean;
    }
  | {
      kind: "email";
      candidateName: string;
      subject: string;
      body: string;
      fallbackUsed: boolean;
    }
  | {
      kind: "search";
      query: string;
      results: {
        fullName: string;
        matchScore: number;
        matchedSkills: string[];
        missingSkills: string[];
        evidence: string;
      }[];
      fallbackUsed: boolean;
    }
  | {
      kind: "shortlist";
      suggestions: {
        rankPosition: number;
        fullName: string;
        score: number;
        recommendation: string;
        rationale: string[];
      }[];
      fallbackUsed: boolean;
    };

export const TOOL_META: Record<
  ToolName,
  { label: string; icon: string; hint: string }
> = {
  fit: {
    label: "Phân tích độ phù hợp",
    icon: "insights",
    hint: "AI chấm điểm mức phù hợp của ứng viên với JD",
  },
  questions: {
    label: "Câu hỏi phỏng vấn",
    icon: "quiz",
    hint: "Gợi ý bộ câu hỏi phỏng vấn theo hồ sơ",
  },
  email: {
    label: "Soạn email",
    icon: "mail",
    hint: "Viết nháp email mời phỏng vấn cho ứng viên",
  },
  search: {
    label: "Tìm ứng viên",
    icon: "person_search",
    hint: "Tìm ứng viên phù hợp bằng ngôn ngữ tự nhiên",
  },
  shortlist: {
    label: "Gợi ý shortlist",
    icon: "workspace_premium",
    hint: "AI đề xuất danh sách rút gọn tốt nhất",
  },
};

/* -------------------------------------------------------------------------- */
/* Criteria helpers                                                           */
/* -------------------------------------------------------------------------- */

export const EMPTY_PRIORITY_CRITERION: CopilotRuleCriterionDto = {
  label: "",
  field: "skill",
  operator: "contains",
  value: "",
  weight: "high",
  autoReject: false,
};

export const EMPTY_NEGATIVE_CRITERION: CopilotRuleCriterionDto = {
  label: "",
  field: "education",
  operator: "contains",
  value: "",
  weight: "medium",
  autoReject: true,
};

export function normalizeCriterion(
  criterion: CopilotRuleCriterionDto,
): CopilotRuleCriterionDto {
  return {
    ...criterion,
    label: criterion.label.trim(),
    value: criterion.value.trim(),
  };
}

export function describeCriterion(criterion: CopilotRuleCriterionDto) {
  return criterion.label || criterion.value;
}

export function buildCriteriaPrompt(
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

export function buildPresetSuggestion(
  priorityCriteria: CopilotRuleCriterionDto[],
  negativeCriteria: CopilotRuleCriterionDto[],
) {
  const labels = [...priorityCriteria, ...negativeCriteria]
    .map((criterion) => describeCriterion(criterion).trim())
    .filter(Boolean);
  if (labels.length === 0) return "Bộ tiêu chí đã lưu";
  return labels.length === 1 ? labels[0] : `${labels[0]} +${labels.length - 1}`;
}

export function countRuleCriteria(rule: CopilotSavedRuleDto) {
  const priorityCount = rule.rule.priorityCriteria.length;
  const negativeCount = rule.rule.negativeCriteria.length;
  return { priorityCount, negativeCount, total: priorityCount + negativeCount };
}

/* -------------------------------------------------------------------------- */
/* Ranking / status helpers                                                   */
/* -------------------------------------------------------------------------- */

export function matchReasonText(result?: CopilotRankingResultDto): string | null {
  if (!result) return null;
  if (result.isAiGenerated && result.summary?.trim()) return result.summary.trim();
  return null;
}

const SCORE_BAND_TONE: Record<ScoreBand, string> = {
  high: "text-emerald-700 bg-emerald-50 border-emerald-200",
  medium: "text-[#005f93] bg-[#e2f0ff] border-[#b9dbff]",
  low: "text-[#9a4a00] bg-[#fff1e2] border-[#fed7aa]",
  unknown: "text-[#5f5e5e] bg-[#f2efed] border-[#e2dfde]",
};

export function scoreTone(score: number | null) {
  return SCORE_BAND_TONE[scoreBand(score)];
}

export function scoreBarColor(score: number) {
  const band = scoreBand(score);
  if (band === "high") return "bg-emerald-500";
  if (band === "medium") return "bg-[#2f80c2]";
  return "bg-[#e8843c]";
}

export type RankingRowStatus = "ready" | "reviewing" | "ranked" | "rejected";

export function rowStatus(
  result: CopilotRankingResultDto | undefined,
  reviewing: boolean,
): RankingRowStatus {
  if (reviewing) return "reviewing";
  if (!result) return "ready";
  if (result.isAutoRejected) return "rejected";
  return "ranked";
}

export const ROW_STATUS_LABEL: Record<RankingRowStatus, string> = {
  ready: "Chưa chấm",
  reviewing: "Đang chấm",
  ranked: "Đã chấm",
  rejected: "Đã loại",
};

export const ROW_STATUS_TONE: Record<RankingRowStatus, string> = {
  ready: "bg-[#f2efed] text-[#5f5e5e]",
  reviewing: "bg-[#e2f0ff] text-[#005f93]",
  ranked: "bg-emerald-50 text-emerald-700",
  rejected: "bg-rose-50 text-rose-700",
};

/* -------------------------------------------------------------------------- */
/* Conversation / ranking mappers                                             */
/* -------------------------------------------------------------------------- */

export function mapConversationToChat(
  conversationDetail: CopilotConversationDetailDto | null,
): ChatMessage[] {
  if (!conversationDetail) return [];
  return conversationDetail.messages
    .filter((message) => message.role === "User" || message.role === "Assistant")
    .map((message) => ({
      role: message.role === "User" ? "user" : "assistant",
      content: message.content,
    }));
}

export function mapRankingSessionToPromptResponse(
  session: CopilotRankingSessionDetailDto,
): CopilotPromptResponseDto {
  return {
    conversationId: session.conversationId,
    rankingSessionId: session.rankingSessionId,
    didRank: true,
    assistantMessage: "",
    normalizedRules: session.normalizedRules,
    results: session.results,
  };
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

export function buildAssistantSummaryFromResults(results: CopilotRankingResultDto[]) {
  const shortlisted = results.filter((item) => !item.isAutoRejected).slice(0, 3);
  const rejected = results.filter((item) => item.isAutoRejected).slice(0, 2);
  const lines = [
    ...(shortlisted.length > 0 ? ["Ứng viên nổi bật:"] : []),
    ...shortlisted.map((item) => buildCandidateAnalysisLine(item)),
    ...(rejected.length > 0 ? ["", "Ứng viên cần lưu ý:"] : []),
    ...rejected.map((item) => buildCandidateAnalysisLine(item)),
  ];
  return lines.join("\n");
}

export function buildDefaultAssistantContext(pool: CopilotCandidatePoolDto | null) {
  if (!pool) {
    return "Chọn một vị trí để tôi nạp mô tả công việc và danh sách ứng viên cho cuộc trao đổi này.";
  }
  const requiredSkills = pool.job.requiredSkills.slice(0, 5).join(", ");
  const skillsLine = requiredSkills
    ? `Kỹ năng chính: ${requiredSkills}.`
    : "Vị trí này chưa cấu hình kỹ năng bắt buộc.";
  return `Xin chào! Tôi là trợ lý tuyển dụng AI cho vị trí "${pool.job.title}". ${skillsLine} Bạn có thể hỏi tôi về ứng viên, cách sàng lọc, hoặc yêu cầu tôi xếp hạng theo tiêu chí.`;
}

/* -------------------------------------------------------------------------- */
/* Rich text renderer for assistant messages                                  */
/* -------------------------------------------------------------------------- */

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

export function renderAssistantContent(content: string): ReactNode {
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <div className="space-y-3">
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
              className="space-y-1.5 pl-5 text-[13.5px] leading-6 text-[#1f2937]"
            >
              {lines.map((line, lineIndex) => (
                <li key={`line-${lineIndex.toString()}`} className="marker:text-[#b90014]">
                  {renderInlineRichText(line.replace(/^([-*]|\d+\.)\s+/, ""))}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`paragraph-${index.toString()}`} className="text-[13.5px] leading-6 text-[#1f2937]">
            {renderInlineRichText(paragraph)}
          </p>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Presentational atoms                                                       */
/* -------------------------------------------------------------------------- */

export function CandidateAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#fff1f0] to-[#ffdad6] text-[12px] font-bold text-[#b90014]">
      {initials || "?"}
    </span>
  );
}

export function ScorePill({ score }: { score: number }) {
  const rounded = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <div className="w-[132px]">
      <span
        className={`inline-flex rounded-full border px-3 py-1 text-[12px] font-bold ${scoreTone(score)}`}
      >
        {rounded}/100
      </span>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#f1eeed]">
        <div
          className={`h-full rounded-full ${scoreBarColor(score)}`}
          style={{ width: `${rounded}%` }}
        />
      </div>
    </div>
  );
}

export function StatusPill({ status }: { status: RankingRowStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.05em] ${ROW_STATUS_TONE[status]}`}
    >
      {status === "reviewing" ? (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
      ) : null}
      {ROW_STATUS_LABEL[status]}
    </span>
  );
}

export function SkillTags({ skills }: { skills: string[] }) {
  const normalized = normalizeSkills(skills);
  if (!normalized.length) {
    return <p className="text-[13px] italic text-[#a8a4a2]">{AI_RANKING_COPY.noSkills}</p>;
  }
  const visible = normalized.slice(0, 5);
  const extra = normalized.length - visible.length;
  return (
    <div className="flex max-w-[240px] flex-wrap gap-1.5">
      {visible.map((skill) => (
        <span
          key={skill}
          className="rounded-full bg-[#eef2ff] px-2.5 py-1 text-[11px] font-semibold text-[#3730a3]"
        >
          {skill}
        </span>
      ))}
      {extra > 0 ? (
        <span className="rounded-full bg-[#f2efed] px-2.5 py-1 text-[11px] font-semibold text-[#5f5e5e]">
          +{extra}
        </span>
      ) : null}
    </div>
  );
}

export function EducationCell({ education }: { education: string | null }) {
  const entries = normalizeEducation(education);
  if (!entries.length) {
    return <p className="text-[13px] italic text-[#a8a4a2]">{AI_RANKING_COPY.noEducation}</p>;
  }
  return (
    <div className="max-w-[220px] space-y-1">
      {entries.slice(0, 2).map((entry, index) => (
        <div key={`edu-${index.toString()}`}>
          <p className="text-[13px] font-medium text-[#1a1c1c]">
            {entry.school ?? entry.degree ?? entry.text ?? "—"}
          </p>
          {(entry.degree || entry.fieldOfStudy) && !entry.text ? (
            <p className="text-[12px] text-[#5f5e5e]">
              {[entry.degree, entry.fieldOfStudy].filter(Boolean).join(", ")}
            </p>
          ) : null}
        </div>
      ))}
      {entries.length > 2 ? (
        <p className="text-[12px] font-medium text-[#8a8786]">+{entries.length - 2} mục khác</p>
      ) : null}
    </div>
  );
}

export { AI_RANKING_COPY };
