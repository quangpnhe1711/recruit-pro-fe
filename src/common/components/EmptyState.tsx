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
      className={`flex flex-col items-center justify-center px-6 py-14 text-center ${className}`.trim()}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#fff1f0] to-[#ffe3e0] text-[#b90014]">
        <span className="material-symbols-outlined text-[32px]">{icon}</span>
      </div>
      <h3 className="mt-4 text-[16px] font-semibold text-[#1a1c1c]">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-[13px] leading-6 text-[#5f5e5e]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export default EmptyState;
