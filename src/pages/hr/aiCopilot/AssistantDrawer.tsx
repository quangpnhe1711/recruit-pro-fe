import { useEffect, useRef } from "react";
import {
  renderAssistantContent,
  TOOL_META,
  type ChatMessage,
} from "./copilotUi";

type AssistantDrawerProps = {
  open: boolean;
  onClose: () => void;
  jobTitle: string | null;
  chat: ChatMessage[];
  prompt: string;
  setPrompt: (value: string) => void;
  sending: boolean;
  loadingStatus: string;
  canSend: boolean;
  onSend: () => void;
  onRunJobTool: (tool: "search" | "shortlist") => void;
  toolsDisabled: boolean;
};

function AssistantDrawer(props: AssistantDrawerProps) {
  const {
    open,
    onClose,
    jobTitle,
    chat,
    prompt,
    setPrompt,
    sending,
    loadingStatus,
    canSend,
    onSend,
    onRunJobTool,
    toolsDisabled,
  } = props;

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [chat, open, sending]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-[#1a1c1c]/35 backdrop-blur-[2px] transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <aside
        className={`fixed inset-y-0 right-0 z-40 flex w-full max-w-[440px] flex-col bg-white shadow-[0_0_60px_rgba(0,0,0,0.22)] transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[#eee9e7] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#e8242c] to-[#c50f1b] text-white">
              <span className="material-symbols-outlined text-[19px]">smart_toy</span>
            </span>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold leading-tight text-[#1a1c1c]">Trợ lý AI</h2>
              <p className="truncate text-[12px] text-[#8a8786]">{jobTitle ?? "Chưa chọn vị trí"}</p>
            </div>
          </div>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#5f5e5e] transition-colors hover:bg-[#f2efed]"
            onClick={onClose}
            aria-label="Đóng trợ lý"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Job-level quick tools */}
        <div className="flex gap-2 border-b border-[#eee9e7] px-5 py-3">
          {(["search", "shortlist"] as const).map((tool) => (
            <button
              key={tool}
              type="button"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-[#e2dfde] bg-[#faf9f8] px-3 py-2 text-[12.5px] font-semibold text-[#1a1c1c] transition-colors hover:border-[#b90014] hover:text-[#b90014] disabled:opacity-50"
              disabled={toolsDisabled}
              onClick={() => onRunJobTool(tool)}
              title={TOOL_META[tool].hint}
            >
              <span className="material-symbols-outlined text-[17px]">{TOOL_META[tool].icon}</span>
              {TOOL_META[tool].label}
            </button>
          ))}
        </div>

        {/* Transcript */}
        <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-auto px-5 py-5">
          {chat.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#e2dfde] bg-[#faf9f8] p-4 text-[13.5px] leading-6 text-[#5f5e5e]">
              Hỏi tôi bất cứ điều gì về vị trí hoặc ứng viên — ví dụ “Ai phù hợp nhất cho vị trí này?”.
            </div>
          ) : null}

          {chat.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex items-end gap-2 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" ? (
                <span className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#fff1ef] text-[#b90014]">
                  <span className="material-symbols-outlined text-[15px]">smart_toy</span>
                </span>
              ) : null}
              <div
                className={`max-w-[85%] ${
                  message.role === "user"
                    ? "rounded-[16px] rounded-br-[5px] bg-[#1a1c1c] px-3.5 py-2.5 text-white"
                    : "rounded-[16px] rounded-bl-[5px] border border-[#eee9e7] bg-[#faf9f8] px-3.5 py-3 text-[#1a1c1c]"
                }`}
              >
                {message.content ? (
                  message.role === "assistant" ? (
                    renderAssistantContent(message.content)
                  ) : (
                    <div className="whitespace-pre-wrap text-[13.5px] leading-6">
                      {message.content}
                    </div>
                  )
                ) : (
                  <div className="flex items-center gap-1.5 py-0.5">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#b90014] [animation-delay:-0.2s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#b90014] [animation-delay:-0.1s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#b90014]" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Composer */}
        <div className="border-t border-[#eee9e7] p-4">
          {sending && loadingStatus ? (
            <div className="mb-2.5 flex items-center gap-2 rounded-[10px] border border-[#ffdad6] bg-[#fff8f7] px-3 py-2 text-[12px] text-[#8a2d1d]">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#e7bdb8] border-t-[#b90014]" />
              <span>{loadingStatus}</span>
            </div>
          ) : null}
          <div className="relative">
            <textarea
              className="h-[76px] w-full resize-none rounded-2xl border border-[#dcd7d5] bg-[#faf9f8] p-3.5 pr-12 text-[14px] outline-none transition-all focus:border-[#b90014] focus:bg-white focus:ring-4 focus:ring-[#b90014]/10"
              aria-label="Tin nhắn cho trợ lý AI"
              placeholder="Hỏi về ứng viên, JD, cách sàng lọc..."
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  if (canSend) onSend();
                }
              }}
            />
            <button
              type="button"
              aria-label="Gửi"
              className="absolute bottom-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#e8242c] to-[#c50f1b] text-white shadow-[0_8px_20px_rgba(185,0,20,0.24)] transition-all hover:brightness-105 active:scale-95 disabled:opacity-50"
              disabled={!canSend}
              onClick={onSend}
            >
              {sending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <span className="material-symbols-outlined text-[18px]">send</span>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default AssistantDrawer;
