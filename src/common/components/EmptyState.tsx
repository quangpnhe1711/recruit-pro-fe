import { ReactNode } from "react";

type EmptyStateProps = {
  icon?: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

/**
 * A calm, centered empty state with a soft icon medallion, used whenever a
 * list, table, or panel has no data to show.
 */
function EmptyState({
  icon = "inbox",
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center overflow-hidden px-6 py-16 text-center ${className}`.trim()}
    >
      <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#e5c8c5] opacity-55" />
      <div className="relative flex h-16 w-16 items-center justify-center rounded-[18px] border border-[#efcfcb] bg-[#fff5f3] text-[#cf1823] shadow-[var(--shadow-sm)]">
        <span className="material-symbols-outlined text-[32px]">{icon}</span>
      </div>
      <h3 className="relative mt-5 text-[16px] font-bold text-[#171b18]">{title}</h3>
      {description ? (
        <p className="relative mt-1.5 max-w-sm text-[13px] leading-6 text-[#626a64]">
          {description}
        </p>
      ) : null}
      {action ? <div className="relative mt-5">{action}</div> : null}
    </div>
  );
}

export default EmptyState;
