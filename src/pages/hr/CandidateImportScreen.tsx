import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AsyncActionButton from "../../common/components/AsyncActionButton";
import type { CandidateImportPreviewRowDto } from "../../services/hr/hrService";
import { hrService } from "../../services/hr/hrService";

function statusChip(row: CandidateImportPreviewRowDto) {
  return row.isValid
    ? "bg-[#1a8a2a]/10 text-[#1a8a2a]"
    : "bg-[#ba1a1a]/10 text-[#ba1a1a]";
}

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
      toast.error("Unable to download candidate import template.");
    }
  }

  async function handlePreview() {
    if (!selectedFile) {
      toast.error("Please choose an Excel file before previewing.");
      return;
    }

    setPreviewLoading(true);
    try {
      const response = await hrService.previewCandidateImport(selectedFile);
      const payload = response.data;
      setPreview(payload);
      setSelectedRows((payload?.rows ?? []).filter((row) => row.isValid).map((row) => row.rowNumber));
    } catch {
      toast.error("Unable to parse and preview the import file.");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleImportSelected() {
    if (!selectedValidRows.length) {
      toast.error("Select at least one valid row to import.");
      return;
    }

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

      toast.success(response.message || "Candidates imported successfully.");
      navigate("/hr/candidates");
    } catch {
      toast.error("Unable to confirm candidate import.");
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
  }

  function toggleAllValidRows() {
    if (!validRows.length) return;

    const allSelected = validRows.every((row) => selectedRows.includes(row.rowNumber));
    setSelectedRows(allSelected ? [] : validRows.map((row) => row.rowNumber));
  }

  return (
    <div className="relative w-full flex-grow bg-white px-4 py-10 md:px-10">
      <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <nav className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5d3f3c]">
            <span>Candidates</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-[#b90014]">Bulk Import</span>
          </nav>
          <h1 className="text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#1a1c1c]">
            Bulk Import Preview
          </h1>
          <p className="mt-1 text-[16px] leading-6 text-[#5f5e5e]">
            Upload an Excel file, validate candidate data, preview rows, then confirm only valid records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-2 border border-[#1a1c1c] bg-white px-6 py-2.5 text-[14px] font-bold text-[#1a1c1c] transition-colors hover:bg-[#f3f3f3]"
            onClick={handleDownloadTemplate}
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            Download Template
          </button>
          <button
            type="button"
            className="flex items-center gap-2 bg-[#1a1c1c] px-6 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-[#2f3131] disabled:opacity-60"
            onClick={handlePreview}
            disabled={previewLoading}
          >
            <span className="material-symbols-outlined text-[20px]">upload_file</span>
            {previewLoading ? "Parsing..." : "Upload & Preview"}
          </button>
          <AsyncActionButton
            type="button"
            className="flex items-center gap-2 bg-[#e31b23] px-6 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-[#b90014] disabled:opacity-60"
            onClick={handleImportSelected}
            disabled={importLoading || !selectedValidRows.length}
            loading={importLoading}
            loadingText="Đang import..."
          >
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            Xác nhận import
          </AsyncActionButton>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <label className="col-span-1 flex cursor-pointer flex-col justify-center rounded-lg border-2 border-dashed border-[#e7bdb8] bg-[#f9f9f9] p-6 md:col-span-2">
          <input
            className="hidden"
            type="file"
            accept=".xlsx"
            onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
          />
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-[36px] text-[#b90014]">cloud_upload</span>
            <div>
              <p className="text-[14px] font-bold text-[#1a1c1c]">
                {selectedFile ? selectedFile.name : "Choose candidate import file"}
              </p>
              <p className="mt-1 text-[12px] text-[#5f5e5e]">
                Supported format: `.xlsx` with columns FullName, Email, PhoneNumber, Source, PositionApplied, Notes
              </p>
            </div>
          </div>
        </label>

        <div className="rounded-lg border border-[#e7bdb8] bg-white p-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">Total Rows</p>
          <p className="mt-3 text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#1a1c1c]">{preview?.totalRows ?? 0}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-[#e7bdb8] bg-white p-5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">Valid</p>
            <p className="mt-3 text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#1a8a2a]">{preview?.validRows ?? 0}</p>
          </div>
          <div className="rounded-lg border border-[#e7bdb8] bg-white p-5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">Invalid</p>
            <p className="mt-3 text-[32px] font-semibold leading-10 tracking-[-0.01em] text-[#ba1a1a]">{preview?.invalidRows ?? 0}</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#e7bdb8] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#e7bdb8] bg-[#f3f3f3] px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[20px] font-semibold text-[#1a1c1c]">Preview Table</p>
            <p className="mt-1 text-[14px] text-[#5f5e5e]">
              Invalid rows cannot be imported. You can import all valid rows or choose specific ones.
            </p>
          </div>
          <button
            type="button"
            className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#1a1c1c] hover:underline disabled:opacity-60"
            onClick={toggleAllValidRows}
            disabled={!validRows.length}
          >
            Select All Valid Rows
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#1a1a1a] text-white">
                <th className="px-4 py-4 text-[12px] font-semibold uppercase tracking-[0.05em]">Pick</th>
                <th className="px-4 py-4 text-[12px] font-semibold uppercase tracking-[0.05em]">Status</th>
                <th className="px-4 py-4 text-[12px] font-semibold uppercase tracking-[0.05em]">Full Name</th>
                <th className="px-4 py-4 text-[12px] font-semibold uppercase tracking-[0.05em]">Email</th>
                <th className="px-4 py-4 text-[12px] font-semibold uppercase tracking-[0.05em]">Phone</th>
                <th className="px-4 py-4 text-[12px] font-semibold uppercase tracking-[0.05em]">Source</th>
                <th className="px-4 py-4 text-[12px] font-semibold uppercase tracking-[0.05em]">Position Applied</th>
                <th className="px-4 py-4 text-[12px] font-semibold uppercase tracking-[0.05em]">Notes</th>
                <th className="px-4 py-4 text-[12px] font-semibold uppercase tracking-[0.05em]">Validation Errors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7bdb8]/40">
              {preview?.rows.length ? (
                preview.rows.map((row, index) => (
                  <tr key={row.rowNumber} className={index % 2 === 1 ? "bg-[#f9fafb]" : "bg-white"}>
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        className="h-4 w-4 border-[#926e6b] text-[#b90014] focus:ring-[#b90014]"
                        checked={selectedRows.includes(row.rowNumber)}
                        disabled={!row.isValid}
                        onChange={() => toggleRow(row.rowNumber)}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded px-2 py-1 text-[11px] font-bold uppercase ${statusChip(row)}`}>
                        {row.isValid ? "Valid" : "Invalid"}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-semibold text-[#1a1c1c]">{row.fullName || "—"}</td>
                    <td className={`px-4 py-4 ${row.isValid ? "text-[#5f5e5e]" : "font-medium text-[#ba1a1a]"}`}>{row.email || "—"}</td>
                    <td className="px-4 py-4 text-[#5f5e5e]">{row.phoneNumber || "—"}</td>
                    <td className="px-4 py-4 text-[#5f5e5e]">{row.source || "—"}</td>
                    <td className="px-4 py-4 text-[#5f5e5e]">{row.positionApplied || "—"}</td>
                    <td className="px-4 py-4 text-[#5f5e5e]">{row.notes || "—"}</td>
                    <td className="px-4 py-4 text-[12px] leading-5 text-[#5d3f3c]">
                      {row.errors.length ? row.errors.join(" ") : "No validation errors."}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-sm text-[#5f5e5e]">
                    Upload an Excel template to preview candidate data before import.
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
