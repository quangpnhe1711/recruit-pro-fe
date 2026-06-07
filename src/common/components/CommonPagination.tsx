import { useMemo } from "react";

export type CommonPaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  rangeStart: number;
  rangeEnd: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
};

function CommonPagination({
  currentPage,
  totalPages,
  totalItems,
  rangeStart,
  rangeEnd,
  onPageChange,
  disabled = false,
}: CommonPaginationProps) {
  const visiblePageNumbers = useMemo(() => {
    const pages: number[] = [];
    const max = Math.min(totalPages, 3);
    const start = Math.max(1, Math.min(currentPage, totalPages - max + 1));
    for (let p = start; p < start + max; p += 1) pages.push(p);
    return pages;
  }, [currentPage, totalPages]);

  function goTo(next: number) {
    if (disabled) return;
    const safe = Math.max(1, Math.min(totalPages, next));
    onPageChange(safe);
  }

  return (
    <div className="flex items-center justify-between border-t border-[rgba(24,33,38,0.08)] p-4 text-[12px] font-semibold text-[var(--rp-muted)]">
      <span>
        Showing {rangeStart} to {rangeEnd} of {totalItems} applications
      </span>

      <div className="flex gap-2">
        <button
          type="button"
          className="input-shell flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => goTo(currentPage - 1)}
          disabled={currentPage <= 1 || disabled}
          aria-label="Previous"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>

        {visiblePageNumbers.map((p) => (
          <button
            key={p}
            type="button"
            className={`flex h-10 w-10 items-center justify-center rounded-full cursor-pointer font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              p === currentPage
                ? "bg-[var(--rp-text)] text-white shadow-[0_10px_24px_rgba(17,36,43,0.18)]"
                : "input-shell hover:bg-white"
            }`}
            onClick={() => goTo(p)}
            disabled={disabled}
          >
            {p}
          </button>
        ))}

        <button
          type="button"
          className="input-shell flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => goTo(currentPage + 1)}
          disabled={currentPage >= totalPages || disabled}
          aria-label="Next"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    </div>
  );
}

export default CommonPagination;
