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
    if (totalPages <= 1) {
      return [1];
    }

    const windowSize = 5;
    const pages: number[] = [];
    const half = Math.floor(windowSize / 2);
    let start = Math.max(1, currentPage - half);
    const end = Math.min(totalPages, start + windowSize - 1);

    if (end - start + 1 < windowSize) {
      start = Math.max(1, end - windowSize + 1);
    }

    for (let p = start; p <= end; p += 1) {
      pages.push(p);
    }

    return pages;
  }, [currentPage, totalPages]);

  const showLeadingEllipsis = visiblePageNumbers[0] > 2;
  const showTrailingEllipsis =
    visiblePageNumbers[visiblePageNumbers.length - 1] < totalPages - 1;

  function goTo(next: number) {
    if (disabled) return;
    const safe = Math.max(1, Math.min(totalPages, next));
    onPageChange(safe);
  }

  const pageButtonClass = (isActive: boolean) =>
    `flex h-10 min-w-10 items-center justify-center rounded-[10px] border px-3 text-[13px] font-bold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${
      isActive
        ? "border-[#1a1c1c] bg-[#1a1c1c] text-white shadow-[0_10px_22px_-14px_rgba(26,28,28,0.9)]"
        : "border-[#ded8d6] bg-white text-[#3a3a3a] hover:-translate-y-0.5 hover:border-[#c8c2c0] hover:bg-[#faf9f8] hover:text-[#1a1c1c] hover:shadow-[var(--shadow-xs)]"
    }`;

  return (
    <div className="border-t border-[#ded8d6] bg-[#f7f4f2] px-4 py-4 text-[12px] font-semibold text-[#5f5e5e]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-[#e4dedc] bg-white text-[#b90014] shadow-[var(--shadow-xs)]">
            <span className="material-symbols-outlined text-[20px]">view_list</span>
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8a8786]">
              Phân trang
            </p>
            <p className="mt-0.5 text-[13px] font-bold text-[#1a1c1c]">
              {totalItems > 0
                ? `${rangeStart}-${rangeEnd} trong ${totalItems} mục`
                : "Chưa có dữ liệu"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#ded8d6] bg-white text-[#3a3a3a] transition-all duration-150 hover:-translate-y-0.5 hover:border-[#c8c2c0] hover:bg-[#faf9f8] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => goTo(currentPage - 1)}
          disabled={currentPage <= 1 || disabled}
          aria-label="Trang trước"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>

        {visiblePageNumbers[0] > 1 ? (
          <button
            type="button"
            className={pageButtonClass(currentPage === 1)}
            onClick={() => goTo(1)}
            disabled={disabled}
          >
            1
          </button>
        ) : null}

        {showLeadingEllipsis ? (
          <span className="flex h-10 min-w-8 items-center justify-center px-1 text-[#8a8786]">
            ...
          </span>
        ) : null}

        {visiblePageNumbers.map((p) => (
          <button
            key={p}
            type="button"
            className={pageButtonClass(p === currentPage)}
            onClick={() => goTo(p)}
            disabled={disabled}
          >
            {p}
          </button>
        ))}

        {showTrailingEllipsis ? (
          <span className="flex h-10 min-w-8 items-center justify-center px-1 text-[#8a8786]">
            ...
          </span>
        ) : null}

        {visiblePageNumbers[visiblePageNumbers.length - 1] < totalPages ? (
          <button
            type="button"
            className={pageButtonClass(currentPage === totalPages)}
            onClick={() => goTo(totalPages)}
            disabled={disabled}
          >
            {totalPages}
          </button>
        ) : null}

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#ded8d6] bg-white text-[#3a3a3a] transition-all duration-150 hover:-translate-y-0.5 hover:border-[#c8c2c0] hover:bg-[#faf9f8] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => goTo(currentPage + 1)}
          disabled={currentPage >= totalPages || disabled}
          aria-label="Trang sau"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
        </div>
      </div>
    </div>
  );
}

export default CommonPagination;
