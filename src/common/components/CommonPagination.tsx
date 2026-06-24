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

  return (
    <div className="flex flex-col gap-3 border-t border-[#e2dfde] bg-white px-4 py-3 text-[12px] font-semibold text-[#5f5e5e] md:flex-row md:items-center md:justify-between">
      <span className="whitespace-nowrap">
        {totalItems > 0
          ? `${rangeStart}-${rangeEnd} / ${totalItems} mục`
          : "Chưa có dữ liệu"}
      </span>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e2dfde] transition-colors hover:bg-[#f3f3f3] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => goTo(currentPage - 1)}
          disabled={currentPage <= 1 || disabled}
          aria-label="Trang trước"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>

        {visiblePageNumbers[0] > 1 ? (
          <button
            type="button"
            className={`flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              currentPage === 1
                ? "border-[#1a1c1c] bg-[#1a1c1c] text-white"
                : "border-[#e2dfde] hover:bg-[#f3f3f3]"
            }`}
            onClick={() => goTo(1)}
            disabled={disabled}
          >
            1
          </button>
        ) : null}

        {showLeadingEllipsis ? (
          <span className="flex h-9 min-w-9 items-center justify-center px-1 text-[#5f5e5e]">
            ...
          </span>
        ) : null}

        {visiblePageNumbers.map((p) => (
          <button
            key={p}
            type="button"
            className={`flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              p === currentPage
                ? "border-[#1a1c1c] bg-[#1a1c1c] text-white"
                : "border-[#e2dfde] hover:bg-[#f3f3f3]"
            }`}
            onClick={() => goTo(p)}
            disabled={disabled}
          >
            {p}
          </button>
        ))}

        {showTrailingEllipsis ? (
          <span className="flex h-9 min-w-9 items-center justify-center px-1 text-[#5f5e5e]">
            ...
          </span>
        ) : null}

        {visiblePageNumbers[visiblePageNumbers.length - 1] < totalPages ? (
          <button
            type="button"
            className={`flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              currentPage === totalPages
                ? "border-[#1a1c1c] bg-[#1a1c1c] text-white"
                : "border-[#e2dfde] hover:bg-[#f3f3f3]"
            }`}
            onClick={() => goTo(totalPages)}
            disabled={disabled}
          >
            {totalPages}
          </button>
        ) : null}

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e2dfde] transition-colors hover:bg-[#f3f3f3] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => goTo(currentPage + 1)}
          disabled={currentPage >= totalPages || disabled}
          aria-label="Trang sau"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    </div>
  );
}

export default CommonPagination;
