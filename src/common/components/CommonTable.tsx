import { ReactNode } from "react";
import CommonPagination from "./CommonPagination";
import EmptyState from "./EmptyState";
import { SkeletonRows } from "./Skeleton";

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
  emptyMessage = "Không có dữ liệu",
  emptyIcon = "inbox",
  headerClassName = "",
  zebra = false,
  hover = true,
  onRowClick,
  pagination,
  showPagination = false,
  tableHeaderBg = "",
  tableWrapperClassName = "card overflow-hidden",
}: CommonTableProps<T>) {
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
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr
              className={
                headerClassName
                  ? `${headerClassName} ${tableHeaderBg}`
                  : "border-b border-[#ececec] bg-[#faf9f8]"
              }
            >
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8a8786] ${
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
                  <EmptyState
                    icon={emptyIcon}
                    title={emptyMessage || "Chưa có dữ liệu"}
                  />
                </td>
              </tr>
            ) : (
              data.map((item, idx) => {
                const rowBg =
                  zebra && idx % 2 === 1 ? "bg-[#faf9f8]" : "bg-white";
                const rowHover = hover ? "hover:bg-[#fdf6f6]" : "";
                const rowCursor = onRowClick ? "cursor-pointer" : "";

                return (
                  <tr
                    key={keyExtractor(item, idx)}
                    className={`${rowBg} border-b border-[#f0eceb] transition-colors last:border-0 ${rowHover} ${rowCursor}`}
                    onClick={() => onRowClick?.(item, idx)}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-5 py-4 align-middle text-[#3a3a3a] ${
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
      <div className="md:hidden">
        {loading ? (
          <SkeletonRows rows={5} />
        ) : data.length === 0 ? (
          <EmptyState icon={emptyIcon} title={emptyMessage || "Chưa có dữ liệu"} />
        ) : (
          <ul className="divide-y divide-[#f0eceb]">
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
                  className={`px-4 py-4 transition-colors ${
                    onRowClick ? "cursor-pointer active:bg-[#faf9f8]" : ""
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
                    <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
                      {detailCols.map((col) => (
                        <div key={col.key} className="min-w-0">
                          <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#a8a4a2]">
                            {col.header}
                          </dt>
                          <dd className="mt-1 truncate text-[13px] text-[#3a3a3a]">
                            {col.renderCell
                              ? col.renderCell(item, idx)
                              : String(item[col.key as keyof T] || "—")}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}

                  {actionColumns.length ? (
                    <div className="mt-3 flex items-center justify-end gap-3 border-t border-[#f0eceb] pt-3">
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
