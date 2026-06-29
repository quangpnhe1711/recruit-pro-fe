import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AsyncActionButton from "../../common/components/AsyncActionButton";
import Badge from "../../common/components/Badge";
import PageHeader from "../../common/components/PageHeader";
import type { CandidateImportPreviewRowDto } from "../../services/hr/hrService";
import { hrService } from "../../services/hr/hrService";

function CandidateImportScreen() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{
    totalRows: number;
    validRows: number;
    invalidRows: number;
    rows: CandidateImportPreviewRowDto[];
  } | null>(null);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    file?: string;
    selectedRows?: string;
  }>({});

  const validRows = useMemo(
    () => preview?.rows.filter((row) => row.isValid) ?? [],
    [preview],
  );

  const selectedValidRows = useMemo(
    () => validRows.filter((row) => selectedRows.includes(row.rowNumber)),
    [selectedRows, validRows],
  );

  function handleFileChange(file: File | null) {
    setSelectedFile(file);
    setPreview(null);
    setSelectedRows([]);
    setFormErrors((current) => ({
      ...current,
      file: undefined,
      selectedRows: undefined,
    }));
  }

  async function handleDownloadTemplate() {
    try {
      const blob = await hrService.downloadCandidateImportTemplate();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "candidate-import-template.xlsx";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Không tải được file mẫu.");
    }
  }

  async function handlePreview() {
    if (!selectedFile) {
      setFormErrors((current) => ({
        ...current,
        file: "Vui lòng chọn file Excel trước khi xem trước dữ liệu.",
      }));
      return;
    }

    setFormErrors((current) => ({ ...current, file: undefined }));
    setPreviewLoading(true);
    try {
      const response = await hrService.previewCandidateImport(selectedFile);
      const payload = response.data;
      setPreview(payload);
      setSelectedRows((payload?.rows ?? []).filter((row) => row.isValid).map((row) => row.rowNumber));
    } catch {
      toast.error("Không xem trước được file import.");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleImportSelected() {
    if (!selectedValidRows.length) {
      setFormErrors((current) => ({
        ...current,
        selectedRows: "Vui lòng chọn ít nhất 1 dòng hợp lệ để import.",
      }));
      return;
    }

    setFormErrors((current) => ({ ...current, selectedRows: undefined }));
    setImportLoading(true);
    try {
      const response = await hrService.importCandidates(
        selectedValidRows.map((row) => ({
          rowNumber: row.rowNumber,
          fullName: row.fullName,
          email: row.email,
          phoneNumber: row.phoneNumber,
          source: row.source,
          positionApplied: row.positionApplied,
          notes: row.notes,
        })),
      );

      toast.success(response.message || "Import ứng viên thành công.");
      navigate("/hr/candidates");
    } catch {
      toast.error("Không xác nhận được import.");
    } finally {
      setImportLoading(false);
    }
  }

  function toggleRow(rowNumber: number) {
    setSelectedRows((current) =>
      current.includes(rowNumber)
        ? current.filter((value) => value !== rowNumber)
        : [...current, rowNumber],
    );
    setFormErrors((current) => ({ ...current, selectedRows: undefined }));
  }

  function toggleAllValidRows() {
    if (!validRows.length) return;

    const allSelected = validRows.every((row) => selectedRows.includes(row.rowNumber));
    setSelectedRows(allSelected ? [] : validRows.map((row) => row.rowNumber));
    setFormErrors((current) => ({ ...current, selectedRows: undefined }));
  }

  const importStats = [
    { label: "Tổng dòng", value: preview?.totalRows ?? 0, icon: "table_rows", valueClass: "text-[#1a1c1c]", iconWrap: "from-[#f2efed] to-[#e7e3e1] text-[#5f5e5e]" },
    { label: "Hợp lệ", value: preview?.validRows ?? 0, icon: "check_circle", valueClass: "text-emerald-600", iconWrap: "from-emerald-50 to-emerald-100 text-emerald-600" },
    { label: "Lỗi", value: preview?.invalidRows ?? 0, icon: "error", valueClass: "text-[#ba1a1a]", iconWrap: "from-rose-50 to-rose-100 text-rose-600" },
  ];

  return (
    <div className="app-container animate-fade-in space-y-6 py-8">
      <PageHeader
        eyebrow="Ứng viên · Import hàng loạt"
        icon="upload_file"
        title="Xem trước import"
        subtitle="Tải file Excel, kiểm tra dữ liệu và chỉ import các dòng hợp lệ."
        actions={
          <>
            <button type="button" className="btn btn-secondary" onClick={handleDownloadTemplate}>
              <span className="material-symbols-outlined text-[18px]">download</span>
              Tải file mẫu
            </button>
            <button
              type="button"
              className="btn btn-dark disabled:opacity-60"
              onClick={handlePreview}
              disabled={previewLoading}
            >
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
              {previewLoading ? "Đang đọc..." : "Tải lên & xem trước"}
            </button>
            <AsyncActionButton
              type="button"
              className="btn btn-primary disabled:opacity-60"
              onClick={handleImportSelected}
              disabled={importLoading || !selectedValidRows.length}
              loading={importLoading}
              loadingText="Đang import..."
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              Xác nhận
            </AsyncActionButton>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <label className={`card-interactive flex cursor-pointer flex-col justify-center border-2 border-dashed bg-[#faf9f8] p-6 ${formErrors.file ? "border-[#dc2626]" : "border-[#e0d4d2]"}`}>
          <input
            className="hidden"
            type="file"
            accept=".xlsx"
            onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
          />
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#fff1f0] to-[#ffdad6] text-[#b90014]">
              <span className="material-symbols-outlined text-[26px]">cloud_upload</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold text-[#1a1c1c]">
                {selectedFile ? selectedFile.name : "Chọn file import ứng viên"}
              </p>
              <p className="mt-1 text-[12px] leading-5 text-[#8a8786]">
                Hỗ trợ `.xlsx` gồm các cột FullName, Email, PhoneNumber, Source, PositionApplied, Notes
              </p>
            </div>
          </div>
        </label>
        {formErrors.file ? (
          <p className="text-sm text-[#dc2626] lg:col-span-2">{formErrors.file}</p>
        ) : null}

        <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-3">
          {importStats.map((card) => (
            <div key={card.label} className="stat-card group">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="eyebrow">{card.label}</p>
                  <h3 className={`mt-2 text-[28px] font-bold leading-none tracking-[-0.02em] ${card.valueClass}`}>
                    {card.value}
                  </h3>
                </div>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-br ${card.iconWrap} transition-transform duration-200 group-hover:scale-105`}>
                  <span className="material-symbols-outlined text-[20px]">{card.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-[#f0eceb] px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="section-title">Bảng xem trước</h2>
            <p className="mt-1 text-[13px] text-[#5f5e5e]">
              Dòng lỗi sẽ không được import. Bạn có thể chọn tất cả hoặc chọn từng dòng hợp lệ.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary shrink-0 disabled:opacity-60"
            onClick={toggleAllValidRows}
            disabled={!validRows.length}
          >
            <span className="material-symbols-outlined text-[18px]">checklist</span>
            Chọn tất cả dòng hợp lệ
          </button>
        </div>
        {formErrors.selectedRows ? (
          <div className="border-b border-[#f0eceb] px-5 py-3">
            <p className="text-sm text-[#dc2626]">{formErrors.selectedRows}</p>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#f0eceb] bg-[#faf9f8] text-[#5f5e5e]">
                <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em]">Chọn</th>
                <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em]">Trạng thái</th>
                <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em]">Họ tên</th>
                <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em]">Email</th>
                <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em]">SĐT</th>
                <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em]">Nguồn</th>
                <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em]">Vị trí</th>
                <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em]">Ghi chú</th>
                <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em]">Lỗi kiểm tra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0eceb]">
              {preview?.rows.length ? (
                preview.rows.map((row) => (
                  <tr key={row.rowNumber} className="transition-colors hover:bg-[#faf9f8]">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[#b90014]"
                        checked={selectedRows.includes(row.rowNumber)}
                        disabled={!row.isValid}
                        onChange={() => toggleRow(row.rowNumber)}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <Badge tone={row.isValid ? "success" : "danger"} dot>
                        {row.isValid ? "Hợp lệ" : "Lỗi"}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-[13px] font-semibold text-[#1a1c1c]">{row.fullName || "—"}</td>
                    <td className={`px-4 py-4 text-[13px] ${row.isValid ? "text-[#5f5e5e]" : "font-medium text-[#ba1a1a]"}`}>{row.email || "—"}</td>
                    <td className="px-4 py-4 text-[13px] text-[#5f5e5e]">{row.phoneNumber || "—"}</td>
                    <td className="px-4 py-4 text-[13px] text-[#5f5e5e]">{row.source || "—"}</td>
                    <td className="px-4 py-4 text-[13px] text-[#5f5e5e]">{row.positionApplied || "—"}</td>
                    <td className="px-4 py-4 text-[13px] text-[#5f5e5e]">{row.notes || "—"}</td>
                    <td className="px-4 py-4 text-[12px] leading-5 text-[#8a8786]">
                      {row.errors.length ? row.errors.join(" ") : "Không có lỗi."}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-sm text-[#8a8786]">
                    Tải file Excel lên để xem trước dữ liệu trước khi import.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CandidateImportScreen;
