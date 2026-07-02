import { ReactNode } from "react";
import CommonPagination from "./CommonPagination";
import EmptyState from "./EmptyState";
import { SkeletonRows } from "./Skeleton";
import { useI18n } from "../../i18n";

export type TableColumn<T> = {
  key: string;
  header: string;
  headerClassName?: string;
  cellClassName?: string;
  renderCell?: (item: T, index: number) => ReactNode;
  alignRight?: boolean;
  /** Marks the column shown as the card title on mobile. Defaults to the first column. */
  primary?: boolean;
  /** Hide this column on the mobile card layout. */
  hideOnMobile?: boolean;
  /** Treat this column as the action area (rendered in the card footer on mobile). */
  isAction?: boolean;
};

export type CommonTableProps<T> = {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: string;
  headerClassName?: string;
  zebra?: boolean;
  hover?: boolean;
  onRowClick?: (item: T, index: number) => void;
  pagination?: {
    enabled: boolean;
    currentPage: number;
    totalPages: number;
    totalItems: number;
    rangeStart: number;
    rangeEnd: number;
    onPageChange: (page: number) => void;
  };
  showPagination?: boolean;
  tableHeaderBg?: string;
  tableWrapperClassName?: string;
};

function CommonTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyMessage,
  emptyIcon = "inbox",
  headerClassName = "",
  zebra = false,
  hover = true,
  onRowClick,
  pagination,
  showPagination = false,
  tableHeaderBg = "",
  tableWrapperClassName = "card overflow-hidden ring-1 ring-black/[0.02]",
}: CommonTableProps<T>) {
  const { t } = useI18n();
  const resolvedEmptyMessage = emptyMessage || t("common.noData");
  const shouldShowPagination = showPagination && pagination?.enabled;

  // Resolve which column is primary (card title) and which are actions on mobile.
  const primaryIndex = (() => {
    const explicit = columns.findIndex((c) => c.primary);
    if (explicit >= 0) return explicit;
    const firstNonAction = columns.findIndex(
      (c) => !c.isAction && c.key !== "actions",
    );
    return firstNonAction >= 0 ? firstNonAction : 0;
  })();

  const actionColumns = columns.filter(
    (c) => c.isAction || c.key === "actions",
  );

  return (
    <section className={tableWrapperClassName}>
      {/* -------- Desktop / tablet: table -------- */}
      <div className="hidden overflow-x-auto bg-[#fbfaf9] md:block">
        <table className="w-full min-w-[860px] border-separate border-spacing-0 text-left">
          <thead>
            <tr
              className={
                headerClassName
                  ? `${headerClassName} ${tableHeaderBg}`
                  : "bg-[#f0eceb]"
              }
            >
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`border-b border-[#ddd7d5] px-5 py-4 text-[11px] font-bold uppercase tracking-[0.11em] text-[#5f5e5e] first:pl-6 last:pr-6 ${
                    col.alignRight ? "text-right" : ""
                  } ${col.headerClassName || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="text-[14px]">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  <SkeletonRows rows={6} />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  <EmptyState icon={emptyIcon} title={resolvedEmptyMessage} />
                </td>
              </tr>
            ) : (
              data.map((item, idx) => {
                const rowBg =
                  zebra && idx % 2 === 1 ? "bg-[#f8f6f5]" : "bg-white";
                const rowHover = hover
                  ? "hover:relative hover:z-[1] hover:bg-[#fffafa] hover:shadow-[0_10px_24px_-18px_rgba(26,28,28,0.45)]"
                  : "";
                const rowCursor = onRowClick ? "cursor-pointer" : "";

                return (
                  <tr
                    key={keyExtractor(item, idx)}
                    className={`${rowBg} transition-all duration-150 ${rowHover} ${rowCursor}`}
                    onClick={() => onRowClick?.(item, idx)}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`border-b border-[#eee9e7] px-5 py-[18px] align-middle text-[#3a3a3a] first:pl-6 last:pr-6 ${
                          col.alignRight ? "text-right" : ""
                        } ${col.cellClassName || ""}`}
                      >
                        {col.renderCell
                          ? col.renderCell(item, idx)
                          : String(item[col.key as keyof T] || "")}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* -------- Mobile: stacked cards -------- */}
      <div className="bg-[#fbfaf9] p-3 md:hidden">
        {loading ? (
          <SkeletonRows rows={5} />
        ) : data.length === 0 ? (
          <EmptyState icon={emptyIcon} title={resolvedEmptyMessage} />
        ) : (
          <ul className="space-y-3">
            {data.map((item, idx) => {
              const primaryCol = columns[primaryIndex];
              const detailCols = columns.filter(
                (c, i) =>
                  i !== primaryIndex &&
                  !c.hideOnMobile &&
                  !c.isAction &&
                  c.key !== "actions",
              );

              return (
                <li
                  key={keyExtractor(item, idx)}
                  className={`rounded-[14px] border border-[#e8e2df] bg-white px-4 py-4 shadow-[var(--shadow-xs)] transition-all duration-150 ${
                    onRowClick ? "cursor-pointer active:scale-[0.99] active:bg-[#fffafa]" : ""
                  }`}
                  onClick={() => onRowClick?.(item, idx)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 text-[14px] font-semibold text-[#1a1c1c]">
                      {primaryCol?.renderCell
                        ? primaryCol.renderCell(item, idx)
                        : String(item[primaryCol?.key as keyof T] || "")}
                    </div>
                  </div>

                  {detailCols.length ? (
                    <dl className="mt-3 grid grid-cols-1 gap-x-3 gap-y-2.5 min-[420px]:grid-cols-2">
                      {detailCols.map((col) => (
                        <div key={col.key} className="min-w-0">
                          <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#a8a4a2]">
                            {col.header}
                          </dt>
                          <dd className="mt-1 min-w-0 break-words text-[13px] text-[#3a3a3a]">
                            {col.renderCell
                              ? col.renderCell(item, idx)
                              : String(item[col.key as keyof T] || "—")}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}

                  {actionColumns.length ? (
                    <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-[#f0eceb] pt-3">
                      {actionColumns.map((col) => (
                        <div key={col.key}>
                          {col.renderCell ? col.renderCell(item, idx) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {shouldShowPagination && pagination && (
        <CommonPagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          rangeStart={pagination.rangeStart}
          rangeEnd={pagination.rangeEnd}
          onPageChange={pagination.onPageChange}
          disabled={loading}
        />
      )}
    </section>
  );
}

export default CommonTable;
