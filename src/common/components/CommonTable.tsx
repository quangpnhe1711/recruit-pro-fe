import { ReactNode } from "react";
import CommonPagination from "./CommonPagination";
import LoadingIndicator from "./LoadingIndicator";

export type TableColumn<T> = {
  key: string;
  header: string;
  headerClassName?: string;
  cellClassName?: string;
  renderCell?: (item: T, index: number) => ReactNode;
  alignRight?: boolean;
};

export type CommonTableProps<T> = {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  loading?: boolean;
  emptyMessage?: string;
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
  headerClassName = "bg-[#1A1A1A] text-white",
  zebra = true,
  hover = true,
  onRowClick,
  pagination,
  showPagination = false,
  tableHeaderBg = "bg-[#1A1A1A]",
  tableWrapperClassName = "overflow-hidden rounded-lg border border-[#e2dfde] bg-white",
}: CommonTableProps<T>) {
  const shouldShowPagination = showPagination && pagination?.enabled;

  return (
    <section className={tableWrapperClassName}>
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className={`${headerClassName} ${tableHeaderBg}`}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.18em] ${
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
                <td colSpan={columns.length} className="px-6 py-10 text-center">
                  <LoadingIndicator className="justify-center" label="Đang tải..." />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-10 text-center text-[14px] text-[#5f5e5e]"
                >
                  {emptyMessage || "Không có dữ liệu"}
                </td>
              </tr>
            ) : (
              data.map((item, idx) => {
                const rowBg =
                  zebra && idx % 2 === 1 ? "bg-[#f9fafb]" : "bg-white";
                const rowHover = hover ? "hover:bg-[#b90014]/5" : "";
                const rowCursor = onRowClick ? "cursor-pointer" : "";

                return (
                  <tr
                    key={keyExtractor(item, idx)}
                    className={`${rowBg} border-b border-[#e2dfde] transition-colors ${rowHover} ${rowCursor}`}
                    onClick={() => onRowClick?.(item, idx)}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-6 py-4 ${
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
