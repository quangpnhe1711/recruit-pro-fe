import { useState } from "react";

type MockJsonButtonProps = {
  className?: string;
  label?: string;
  payload: unknown;
};

function MockJsonButton({
  className = "",
  label = "View Mock JSON",
  payload,
}: MockJsonButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`relative ${className}`.trim()}>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-lg border border-[#e7bdb8] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#5d3f3c] transition-colors hover:bg-[#f9f9f9]"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="material-symbols-outlined text-sm">data_object</span>
        {label}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[320px] max-w-[80vw] rounded-lg border border-[#e7bdb8] bg-[#1a1c1c] p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/80">
              Mock Payload
            </p>
            <button
              type="button"
              className="text-xs font-semibold uppercase tracking-[0.08em] text-white/70 hover:text-white"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-white/90">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

export default MockJsonButton;
