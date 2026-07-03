import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AsyncActionButton from "../../common/components/AsyncActionButton";
import Badge from "../../common/components/Badge";
import PageHeader from "../../common/components/PageHeader";
import { useI18n } from "../../i18n";
import type { CandidateImportPreviewRowDto } from "../../services/hr/hrService";
import { hrService } from "../../services/hr/hrService";

function CandidateImportScreen() {
  const navigate = useNavigate();
  const { t } = useI18n();
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
      link.download = t("candidateImport.templateFileName");
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t("candidateImport.templateDownloadFailed"));
    }
  }

  async function handlePreview() {
    if (!selectedFile) {
      setFormErrors((current) => ({
        ...current,
        file: t("candidateImport.selectFileError"),
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
      toast.error(t("candidateImport.previewFailed"));
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleImportSelected() {
    if (!selectedValidRows.length) {
      setFormErrors((current) => ({
        ...current,
        selectedRows: t("candidateImport.selectRowsError"),
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

      toast.success(response.message || t("candidateImport.importSuccess"));
      navigate("/hr/candidates");
    } catch {
      toast.error(t("candidateImport.importFailed"));
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
    { label: t("candidateImport.totalRows"), value: preview?.totalRows ?? 0, icon: "table_rows", valueClass: "text-[#1a1c1c]", iconWrap: "from-[#f2efed] to-[#e7e3e1] text-[#5f5e5e]" },
    { label: t("candidateImport.validRows"), value: preview?.validRows ?? 0, icon: "check_circle", valueClass: "text-emerald-600", iconWrap: "from-emerald-50 to-emerald-100 text-emerald-600" },
    { label: t("candidateImport.invalidRows"), value: preview?.invalidRows ?? 0, icon: "error", valueClass: "text-[#ba1a1a]", iconWrap: "from-rose-50 to-rose-100 text-rose-600" },
  ];

  return (
    <div className="app-container animate-fade-in space-y-6 py-8">
      <PageHeader
        eyebrow={t("candidateImport.eyebrow")}
        icon="upload_file"
        title={t("candidateImport.title")}
        subtitle={t("candidateImport.subtitle")}
        actions={
          <>
            <button type="button" className="btn btn-secondary" onClick={handleDownloadTemplate}>
              <span className="material-symbols-outlined text-[18px]">download</span>
              {t("candidateImport.downloadTemplate")}
            </button>
            <button
              type="button"
              className="btn btn-dark disabled:opacity-60"
              onClick={handlePreview}
              disabled={previewLoading}
            >
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
              {previewLoading ? t("candidateImport.previewLoading") : t("candidateImport.previewAction")}
            </button>
            <AsyncActionButton
              type="button"
              className="btn btn-primary disabled:opacity-60"
              onClick={handleImportSelected}
              disabled={importLoading || !selectedValidRows.length}
              loading={importLoading}
              loadingText={t("candidateImport.importLoading")}
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              {t("common.confirm")}
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
                {selectedFile ? selectedFile.name : t("candidateImport.selectFile")}
                </p>
                <p className="mt-1 text-[12px] leading-5 text-[#8a8786]">
                {t("candidateImport.supportedFormat")}
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
            <h2 className="section-title">{t("candidateImport.previewTable")}</h2>
            <p className="mt-1 text-[13px] text-[#5f5e5e]">
              {t("candidateImport.previewHint")}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary shrink-0 disabled:opacity-60"
            onClick={toggleAllValidRows}
            disabled={!validRows.length}
          >
            <span className="material-symbols-outlined text-[18px]">checklist</span>
            {t("candidateImport.selectAllValid")}
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
                <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em]">{t("candidateImport.colSelect")}</th>
                <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em]">{t("candidateImport.colStatus")}</th>
                <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em]">{t("candidateImport.colFullName")}</th>
                <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em]">{t("candidateImport.colEmail")}</th>
                <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em]">{t("candidateImport.colPhone")}</th>
                <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em]">{t("candidateImport.colSource")}</th>
                <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em]">{t("candidateImport.colPosition")}</th>
                <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em]">{t("candidateImport.colNotes")}</th>
                <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em]">{t("candidateImport.colValidationErrors")}</th>
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
                        {row.isValid ? t("candidateImport.validRows") : t("candidateImport.invalidRows")}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-[13px] font-semibold text-[#1a1c1c]">{row.fullName || "—"}</td>
                    <td className={`px-4 py-4 text-[13px] ${row.isValid ? "text-[#5f5e5e]" : "font-medium text-[#ba1a1a]"}`}>{row.email || "—"}</td>
                    <td className="px-4 py-4 text-[13px] text-[#5f5e5e]">{row.phoneNumber || "—"}</td>
                    <td className="px-4 py-4 text-[13px] text-[#5f5e5e]">{row.source || "—"}</td>
                    <td className="px-4 py-4 text-[13px] text-[#5f5e5e]">{row.positionApplied || "—"}</td>
                    <td className="px-4 py-4 text-[13px] text-[#5f5e5e]">{row.notes || "—"}</td>
                    <td className="px-4 py-4 text-[12px] leading-5 text-[#8a8786]">
                      {row.errors.length ? row.errors.join(" ") : t("candidateImport.noErrors")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-sm text-[#8a8786]">
                    {t("candidateImport.emptyPreview")}
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
