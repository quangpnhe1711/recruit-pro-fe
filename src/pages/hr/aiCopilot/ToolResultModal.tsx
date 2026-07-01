import { toast } from "react-toastify";
import LoadingIndicator from "../../../common/components/LoadingIndicator";
import { scoreTone, TOOL_META, type ToolName, type ToolResult } from "./copilotUi";

type ToolResultModalProps = {
  open: boolean;
  loading: boolean;
  tool: ToolName | null;
  result: ToolResult | null;
  onClose: () => void;
};

function FallbackNote({ fallbackUsed }: { fallbackUsed: boolean }) {
  return (
    <p className="mt-4 flex items-center gap-1.5 text-[11px] text-[#8a8786]">
      <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
      Nội dung được tạo bởi AI — hãy kiểm tra trước khi sử dụng.
      {fallbackUsed ? (
        <span className="ml-1 rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
          Dùng phương án dự phòng
        </span>
      ) : null}
    </p>
  );
}

function ResultBody({ result }: { result: ToolResult }) {
  if (result.kind === "fit") {
    return (
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-[13px] font-bold ${scoreTone(result.totalScore)}`}
          >
            {Math.round(result.totalScore)}/100
          </span>
          <span className="rounded-full bg-[#fff1f0] px-3 py-1 text-[12px] font-semibold text-[#b90014]">
            {result.fitLabel}
          </span>
          <span className="text-[12px] text-[#5f5e5e]">
            Độ tin cậy {Math.round(result.confidenceScore)}%
          </span>
        </div>
        {result.summary ? (
          <p className="mt-4 text-[14px] leading-6 text-[#1f2937]">{result.summary}</p>
        ) : null}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {result.strengths.length ? (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-emerald-700">
                Điểm mạnh
              </p>
              <ul className="mt-2 space-y-1.5 text-[13px] text-[#1a1c1c]">
                {result.strengths.map((item, index) => (
                  <li key={`st-${index.toString()}`} className="flex gap-2">
                    <span className="text-emerald-600">+</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {result.gaps.length ? (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#ba1a1a]">
                Điểm cần lưu ý
              </p>
              <ul className="mt-2 space-y-1.5 text-[13px] text-[#1a1c1c]">
                {result.gaps.map((item, index) => (
                  <li key={`gp-${index.toString()}`} className="flex gap-2">
                    <span className="text-[#ba1a1a]">!</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        {result.evidence.length ? (
          <div className="mt-4 rounded-[12px] bg-[#faf9f8] p-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8a8786]">
              Dẫn chứng từ hồ sơ
            </p>
            <ul className="mt-2 space-y-1 text-[12px] text-[#5f5e5e]">
              {result.evidence.map((item, index) => (
                <li key={`ev-${index.toString()}`}>• {item}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <FallbackNote fallbackUsed={result.fallbackUsed} />
      </div>
    );
  }

  if (result.kind === "questions") {
    return (
      <div>
        <ol className="space-y-3">
          {result.questions.map((item, index) => (
            <li
              key={`q-${index.toString()}`}
              className="rounded-[12px] border border-[#eee9e7] bg-white p-3.5"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#fff1f0] text-[12px] font-bold text-[#b90014]">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  {item.category ? (
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#8a8786]">
                      {item.category}
                    </p>
                  ) : null}
                  <p className="text-[14px] leading-6 text-[#1a1c1c]">{item.question}</p>
                  {item.evidence ? (
                    <p className="mt-1 text-[12px] italic text-[#5f5e5e]">{item.evidence}</p>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ol>
        <FallbackNote fallbackUsed={result.fallbackUsed} />
      </div>
    );
  }

  if (result.kind === "email") {
    return (
      <div>
        <div className="rounded-[12px] border border-[#eee9e7]">
          <div className="flex items-center justify-between gap-3 border-b border-[#eee9e7] px-4 py-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8a8786]">
                Tiêu đề
              </p>
              <p className="truncate text-[14px] font-semibold text-[#1a1c1c]">{result.subject}</p>
            </div>
            <button
              type="button"
              className="btn btn-secondary h-9 shrink-0 px-3 text-[12px]"
              onClick={() => {
                void navigator.clipboard
                  ?.writeText(`${result.subject}\n\n${result.body}`)
                  .then(() => toast.success("Đã sao chép email."))
                  .catch(() => toast.error("Không sao chép được."));
              }}
            >
              <span className="material-symbols-outlined text-[16px]">content_copy</span>
              Sao chép
            </button>
          </div>
          <div className="whitespace-pre-wrap px-4 py-3.5 text-[14px] leading-6 text-[#1f2937]">
            {result.body}
          </div>
        </div>
        <FallbackNote fallbackUsed={result.fallbackUsed} />
      </div>
    );
  }

  if (result.kind === "search") {
    if (!result.results.length) {
      return <p className="text-[14px] text-[#5f5e5e]">Không tìm thấy ứng viên phù hợp.</p>;
    }
    return (
      <div>
        <ul className="space-y-2.5">
          {result.results.map((item, index) => (
            <li
              key={`sr-${index.toString()}`}
              className="rounded-[12px] border border-[#eee9e7] bg-white p-3.5"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[14px] font-semibold text-[#1a1c1c]">{item.fullName}</p>
                <span
                  className={`inline-flex rounded-full border px-2.5 py-0.5 text-[12px] font-bold ${scoreTone(item.matchScore)}`}
                >
                  {Math.round(item.matchScore)}
                </span>
              </div>
              {item.evidence ? (
                <p className="mt-1 text-[13px] leading-5 text-[#5f5e5e]">{item.evidence}</p>
              ) : null}
              {item.matchedSkills.length ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.matchedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
                    >
                      {skill}
                    </span>
                  ))}
                  {item.missingSkills.map((skill) => (
                    <span
                      key={`m-${skill}`}
                      className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600 line-through"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
        <FallbackNote fallbackUsed={result.fallbackUsed} />
      </div>
    );
  }

  // shortlist
  if (!result.suggestions.length) {
    return <p className="text-[14px] text-[#5f5e5e]">AI chưa đề xuất được shortlist.</p>;
  }
  return (
    <div>
      <ul className="space-y-2.5">
        {result.suggestions.map((item, index) => (
          <li
            key={`sl-${index.toString()}`}
            className="flex gap-3 rounded-[12px] border border-[#eee9e7] bg-white p-3.5"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1a1c1c] text-[12px] font-bold text-white">
              {item.rankPosition}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-semibold text-[#1a1c1c]">{item.fullName}</p>
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold ${scoreTone(item.score)}`}
                >
                  {Math.round(item.score)}
                </span>
              </div>
              <p className="mt-0.5 text-[12px] font-medium text-[#b90014]">{item.recommendation}</p>
              {item.rationale.length ? (
                <ul className="mt-1.5 space-y-1 text-[13px] text-[#5f5e5e]">
                  {item.rationale.map((line, lineIndex) => (
                    <li key={`rt-${lineIndex.toString()}`}>• {line}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      <FallbackNote fallbackUsed={result.fallbackUsed} />
    </div>
  );
}

function ToolResultModal({ open, loading, tool, result, onClose }: ToolResultModalProps) {
  if (!open) return null;

  const meta = tool ? TOOL_META[tool] : null;
  const subtitle =
    result && "candidateName" in result && result.candidateName
      ? result.candidateName
      : result?.kind === "search"
        ? `“${result.query}”`
        : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1a1c1c]/45 px-4 py-6 backdrop-blur-sm">
      <div className="animate-scale-in flex max-h-full w-full max-w-[640px] flex-col overflow-hidden rounded-[20px] border border-[#ececec] bg-white shadow-[0_30px_80px_rgba(0,0,0,0.24)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#eee9e7] px-6 py-5">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#fff1f0] to-[#ffdad6] text-[#b90014]">
              <span className="material-symbols-outlined text-[22px]">
                {meta?.icon ?? "auto_awesome"}
              </span>
            </span>
            <div>
              <h3 className="text-[18px] font-semibold tracking-[-0.01em] text-[#1a1c1c]">
                {meta?.label ?? "Kết quả AI"}
              </h3>
              {subtitle ? <p className="mt-0.5 text-[13px] text-[#5f5e5e]">{subtitle}</p> : null}
            </div>
          </div>
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#5f5e5e] transition-colors hover:bg-[#f2efed]"
            onClick={onClose}
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
          {loading ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-3">
              <LoadingIndicator label="AI đang xử lý..." />
              <p className="max-w-xs text-center text-[12px] text-[#8a8786]">
                Quá trình này có thể mất vài giây tùy độ dài hồ sơ.
              </p>
            </div>
          ) : result ? (
            <ResultBody result={result} />
          ) : (
            <p className="text-[14px] text-[#5f5e5e]">Không có kết quả.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ToolResultModal;
