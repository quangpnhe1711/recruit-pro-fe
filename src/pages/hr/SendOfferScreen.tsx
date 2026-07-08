import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { appToast, handleNonFormApiError } from "../../common/utils/appToast";
import { applyApiFormError } from "../../common/utils/formErrors";
import { isOfferActionableStatus } from "../../common/status/offerStatus";
import AsyncActionButton from "../../common/components/AsyncActionButton";
import Badge from "../../common/components/Badge";
import CommonSelect from "../../common/components/CommonSelect";
import { Skeleton, SkeletonText } from "../../common/components/Skeleton";
import {
  offerSchema,
  validateWithSchema,
  type ValidationErrors,
} from "../../common/validation/formValidation";
import { getDateLocale, useI18n } from "../../i18n";
import type { OfferEditorDto, UpsertOfferRequest } from "../../modules/jobs/jobsSchema";
import { hrService } from "../../services/hr/hrService";

type OfferFormState = {
  offerTemplateId: string;
  baseSalary: string;
  currencyCode: string;
  bonusDescription: string;
  equityNotes: string;
  employmentType: string;
  proposedStartDate: string;
  probationPeriod: string;
  reportingManagerId: string;
  personalMessage: string;
  benefitIds: string[];
};

function formatDateDisplay(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString(getDateLocale(), {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatCurrencyAmount(value: string, symbol: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return `0 ${symbol}`;

  return `${amount.toLocaleString("vi-VN")} ${symbol}`;
}

function normalizeEmploymentLabel(value: string) {
  switch (value) {
    case "FullTime":
      return "Full-time";
    case "PartTime":
      return "Part-time";
    default:
      return value;
  }
}

const emptyOption = [{ label: "Chọn", value: "" }];

const currencyOptions = (currencies: OfferEditorDto["masterData"]["currencies"]) => [
  ...emptyOption,
  ...currencies.map((currency) => ({
    label: `${currency.code} - ${currency.name}`,
    value: currency.code,
  })),
];

const employmentTypeOptions = (types: OfferEditorDto["masterData"]["employmentTypes"]) => [
  ...emptyOption,
  ...types.map((type) => ({
    label: normalizeEmploymentLabel(type),
    value: normalizeEmploymentLabel(type),
  })),
];

const reportingManagerOptions = (
  managers: OfferEditorDto["masterData"]["reportingManagers"],
) => [
  ...emptyOption,
  ...managers.map((manager) => ({
    label: `${manager.fullName} (${manager.title})`,
    value: manager.id,
  })),
];

const templateOptions = (templates: OfferEditorDto["masterData"]["templates"]) => [
  ...emptyOption,
  ...templates.map((template) => ({
    label: template.name,
    value: template.id,
  })),
];

function mapEditorToForm(editor: OfferEditorDto): OfferFormState {
  return {
    offerTemplateId: editor.offer.offerTemplateId ?? editor.masterData.templates[0]?.id ?? "",
    baseSalary: editor.offer.baseSalary ? String(editor.offer.baseSalary) : "",
    currencyCode: editor.offer.currencyCode ?? editor.masterData.currencies[0]?.code ?? "VND",
    bonusDescription: editor.offer.bonusDescription ?? "",
    equityNotes: editor.offer.equityNotes ?? "",
    employmentType: normalizeEmploymentLabel(
      editor.offer.employmentType || editor.masterData.employmentTypes[0] || "Full-time",
    ),
    proposedStartDate: editor.offer.proposedStartDate?.slice(0, 10) ?? "",
    probationPeriod: editor.offer.probationPeriod ?? "",
    reportingManagerId: editor.offer.reportingManagerId ?? editor.masterData.reportingManagers[0]?.id ?? "",
    personalMessage: editor.offer.personalMessage ?? "",
    benefitIds: editor.offer.benefitIds ?? [],
  };
}

function SendOfferScreen() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { applicationId = "" } = useParams();
  const [editor, setEditor] = useState<OfferEditorDto | null>(null);
  const [form, setForm] = useState<OfferFormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [formErrors, setFormErrors] = useState<ValidationErrors>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadOfferEditor() {
      setLoading(true);

      try {
        const response = await hrService.getOfferEditor(applicationId);
        if (!mounted) return;

        setEditor(response.data);
        setForm(mapEditorToForm(response.data));
      } catch (error) {
        if (!mounted) return;
        handleNonFormApiError(error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadOfferEditor();

    return () => {
      mounted = false;
    };
  }, [applicationId, t]);

  const selectedCurrency = useMemo(
    () => editor?.masterData.currencies.find((currency) => currency.code === form?.currencyCode),
    [editor, form?.currencyCode],
  );

  const selectedManager = useMemo(
    () => editor?.masterData.reportingManagers.find((manager) => manager.id === form?.reportingManagerId),
    [editor, form?.reportingManagerId],
  );

  const selectedTemplate = useMemo(
    () => editor?.masterData.templates.find((template) => template.id === form?.offerTemplateId),
    [editor, form?.offerTemplateId],
  );

  function updateForm<K extends keyof OfferFormState>(key: K, value: OfferFormState[K]) {
    setForm((current) => {
      if (!current) return current;
      const next = { ...current, [key]: value };
      if (submitted) {
        setFormErrors(validateWithSchema(offerSchema, next));
      }
      return next;
    });
  }

  function toggleBenefit(benefitId: string) {
    setForm((current) => {
      if (!current) return current;

      const exists = current.benefitIds.includes(benefitId);
      return {
        ...current,
        benefitIds: exists
          ? current.benefitIds.filter((id) => id !== benefitId)
          : [...current.benefitIds, benefitId],
      };
    });
  }

  function toPayload(): UpsertOfferRequest | null {
    if (!form) return null;

    return {
      offerTemplateId: form.offerTemplateId || null,
      baseSalary: Number(form.baseSalary || 0),
      currencyCode: form.currencyCode,
      bonusDescription: form.bonusDescription || null,
      equityNotes: form.equityNotes || null,
      employmentType: form.employmentType,
      proposedStartDate: form.proposedStartDate || null,
      probationPeriod: form.probationPeriod || null,
      reportingManagerId: form.reportingManagerId || null,
      personalMessage: form.personalMessage || null,
      benefitIds: form.benefitIds,
    };
  }

  async function handleSaveDraft() {
    const payload = toPayload();
    if (!payload) return;
    setSubmitted(true);
    const schemaErrors = validateWithSchema(offerSchema, form);
    setFormErrors(schemaErrors);
    if (Object.keys(schemaErrors).length > 0) return;

    setSaving(true);
    try {
      const response = await hrService.saveOfferDraft(applicationId, payload);
      setEditor(response.data);
      setForm(mapEditorToForm(response.data));
      appToast.success(t("sendOffer.draftSaved"));
    } catch (error) {
      const handled = applyApiFormError(error, {
        setFieldError: (field, message) =>
          setFormErrors((prev) => ({ ...prev, [field]: message })),
      });
      if (!handled) handleNonFormApiError(error);
    } finally {
      setSaving(false);
    }
  }

  async function handleSendOffer() {
    const payload = toPayload();
    if (!payload) return;
    setSubmitted(true);
    const schemaErrors = validateWithSchema(offerSchema, form);
    setFormErrors(schemaErrors);
    if (Object.keys(schemaErrors).length > 0) return;

    setSending(true);
    try {
      const response = await hrService.sendOffer(applicationId, payload);
      setEditor(response.data);
      setForm(mapEditorToForm(response.data));
      appToast.success(t("sendOffer.sendSuccess"));
    } catch (error) {
      // Field-level errors (e.g. baseSalary → SALARY_RANGE_INVALID) render inline; business/state
      // errors (e.g. OFFER_NOT_ACTIONABLE — BR-APPLICATION-009/INV-009) and server/network errors
      // fall back to a soft toast.
      const handled = applyApiFormError(error, {
        setFieldError: (field, message) =>
          setFormErrors((prev) => ({ ...prev, [field]: message })),
      });
      if (!handled) handleNonFormApiError(error);
    } finally {
      setSending(false);
    }
  }

  if (loading || !editor || !form) {
    return (
      <div className="app-container space-y-6 py-8">
        <Skeleton className="h-4 w-64" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-8 w-80" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-11 w-48 rounded-[10px]" />
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_420px]">
          <div className="card p-8">
            <SkeletonText lines={10} />
          </div>
          <div className="card p-6">
            <SkeletonText lines={8} />
          </div>
        </div>
      </div>
    );
  }

  const offerStatusTone = isOfferActionableStatus(editor.offer.status)
    ? "info"
    : "brand";

  return (
    <div className="app-container animate-fade-in space-y-6 py-8">
      <div>
        <nav className="mb-3 flex flex-wrap items-center gap-2 text-[12px] font-semibold text-[#8a8786]">
          <Link className="hover:text-[#b90014]" to="/hr/applications">
            {t("sendOffer.breadcrumbApplications")}
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <Link className="hover:text-[#b90014]" to={`/hr/applications/${applicationId}`}>
            {editor.application.candidateName}
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-[#1a1c1c]">{t("sendOffer.breadcrumbCurrent")}</span>
        </nav>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <Badge tone={offerStatusTone}>Offer {editor.offer.status}</Badge>
              <span className="text-[13px] font-semibold text-[#8a8786]">{editor.application.referenceCode}</span>
            </div>
            <h1 className="page-title">{t("sendOffer.title")}</h1>
            <p className="page-subtitle">
              {t("sendOffer.subtitle", { candidateName: editor.application.candidateName })}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(`/hr/applications/${applicationId}`)}
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              {t("sendOffer.backToReview")}
            </button>
            <AsyncActionButton
              type="button"
              className="btn btn-secondary disabled:opacity-60"
              disabled={saving || sending}
              loading={saving}
              loadingText={t("sendOffer.savingDraft")}
              onClick={handleSaveDraft}
              spinnerTone="brand"
            >
              {t("sendOffer.saveDraft")}
            </AsyncActionButton>
            <AsyncActionButton
              type="button"
              className="btn btn-primary disabled:opacity-60"
              disabled={sending || saving}
              loading={sending}
              loadingText={t("sendOffer.sendingOffer")}
              onClick={handleSendOffer}
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
              {t("sendOffer.sendOffer")}
            </AsyncActionButton>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_420px]">
        <div className="space-y-6">
          {/* HERO SUMMARY */}
          <section className="card flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#fff1f0] to-[#ffdad6] text-[#b90014]">
                {editor.application.candidateAvatarUrl ? (
                  <img
                    alt={editor.application.candidateName}
                    className="h-full w-full object-cover"
                    src={editor.application.candidateAvatarUrl}
                  />
                ) : (
                  <span className="material-symbols-outlined text-[28px]">person</span>
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-[22px] font-semibold tracking-[-0.01em] text-[#1a1c1c]">
                  {editor.application.candidateName}
                </h2>
                <p className="text-[13px] text-[#5f5e5e]">
                  {editor.application.jobTitle} • {editor.application.departmentName}
                </p>
                <p className="mt-1 text-[13px] text-[#8a8786]">{editor.application.candidateEmail}</p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <Badge tone="info">{t("sendOffer.stage", { stage: editor.application.stageLabel })}</Badge>
              <p className="mt-2 text-[11px] text-[#8a8786]">
                {t("sendOffer.lastUpdated", {
                  date: formatDateDisplay(editor.offer.updatedAt, t("sendOffer.toBeConfirmed")),
                })}
              </p>
            </div>
          </section>

          <section className="card space-y-8 p-6 md:p-8">
            <div>
              <h3 className="section-title mb-6 border-b border-[#f0eceb] pb-4">
                {t("sendOffer.compensation")}
              </h3>
              <div className="grid gap-6 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8786]">{t("sendOffer.baseSalary")}</span>
                  <input
                    className={`input-field font-medium ${formErrors.baseSalary ? "border-[#ba1a1a]" : ""}`}
                    type="number"
                    value={form.baseSalary}
                    onChange={(event) => updateForm("baseSalary", event.target.value)}
                  />
                  {formErrors.baseSalary ? (
                    <p className="text-[12px] text-[#ba1a1a]">{formErrors.baseSalary}</p>
                  ) : null}
                </label>

                <label className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8786]">{t("sendOffer.currency")}</span>
                  <CommonSelect
                    value={form.currencyCode}
                    options={currencyOptions(editor.masterData.currencies)}
                    onValueChange={(value) => updateForm("currencyCode", value)}
                    className="input-field h-11 font-medium"
                    menuClassName="border-[#ececec]"
                  />
                  {formErrors.currencyCode ? (
                    <p className="text-[12px] text-[#ba1a1a]">{formErrors.currencyCode}</p>
                  ) : null}
                </label>

                <label className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8786]">{t("sendOffer.bonus")}</span>
                  <input
                    className={`input-field font-medium ${formErrors.bonusDescription ? "border-[#ba1a1a]" : ""}`}
                    type="text"
                    value={form.bonusDescription}
                    onChange={(event) => updateForm("bonusDescription", event.target.value)}
                  />
                  {formErrors.bonusDescription ? (
                    <p className="text-[12px] text-[#ba1a1a]">{formErrors.bonusDescription}</p>
                  ) : null}
                </label>

                <label className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8786]">{t("sendOffer.equity")}</span>
                  <input
                    className={`input-field font-medium ${formErrors.equityNotes ? "border-[#ba1a1a]" : ""}`}
                    type="text"
                    value={form.equityNotes}
                    onChange={(event) => updateForm("equityNotes", event.target.value)}
                  />
                  {formErrors.equityNotes ? (
                    <p className="text-[12px] text-[#ba1a1a]">{formErrors.equityNotes}</p>
                  ) : null}
                </label>
              </div>
            </div>

            <div>
              <h3 className="section-title mb-6 border-b border-[#f0eceb] pb-4">
                {t("sendOffer.terms")}
              </h3>
              <div className="grid gap-6 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8786]">{t("sendOffer.employmentType")}</span>
                  <CommonSelect
                    value={form.employmentType}
                    options={employmentTypeOptions(editor.masterData.employmentTypes)}
                    onValueChange={(value) => updateForm("employmentType", value)}
                    className="input-field h-11 font-medium"
                    menuClassName="border-[#ececec]"
                  />
                  {formErrors.employmentType ? (
                    <p className="text-[12px] text-[#ba1a1a]">{formErrors.employmentType}</p>
                  ) : null}
                </label>

                <label className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8786]">{t("sendOffer.proposedStartDate")}</span>
                  <input
                    className="input-field font-medium"
                    type="date"
                    value={form.proposedStartDate}
                    onChange={(event) => updateForm("proposedStartDate", event.target.value)}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8786]">{t("sendOffer.probationPeriod")}</span>
                  <input
                    className={`input-field font-medium ${formErrors.probationPeriod ? "border-[#ba1a1a]" : ""}`}
                    type="text"
                    value={form.probationPeriod}
                    onChange={(event) => updateForm("probationPeriod", event.target.value)}
                  />
                  {formErrors.probationPeriod ? (
                    <p className="text-[12px] text-[#ba1a1a]">{formErrors.probationPeriod}</p>
                  ) : null}
                </label>

                <label className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8786]">{t("sendOffer.reportingManager")}</span>
                  <CommonSelect
                    value={form.reportingManagerId}
                    options={reportingManagerOptions(editor.masterData.reportingManagers)}
                    onValueChange={(value) => updateForm("reportingManagerId", value)}
                    className="input-field h-11 font-medium"
                    menuClassName="border-[#ececec]"
                  />
                </label>
              </div>
            </div>

            <div>
              <h3 className="section-title mb-6 border-b border-[#f0eceb] pb-4">
                {t("sendOffer.benefits")}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {editor.masterData.benefits.map((benefit) => {
                  const selected = form.benefitIds.includes(benefit.id);
                  return (
                    <label
                      key={benefit.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-[12px] border p-3.5 transition-all ${selected ? "border-[#b90014] bg-[#fff1f0]" : "border-[#ececec] bg-white hover:border-[#e0d4d2] hover:bg-[#faf9f8]"}`}
                    >
                      <input
                        checked={selected}
                        className="h-4 w-4 accent-[#b90014]"
                        type="checkbox"
                        onChange={() => toggleBenefit(benefit.id)}
                      />
                      <div>
                        <p className="text-sm font-semibold text-[#1a1c1c]">{benefit.name}</p>
                        {benefit.description ? (
                          <p className="text-xs text-[#5f5e5e]">{benefit.description}</p>
                        ) : null}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-6 xl:sticky xl:top-24">
            <label className="mb-5 block space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8786]">{t("sendOffer.offerTemplate")}</span>
              <CommonSelect
                value={form.offerTemplateId}
                options={templateOptions(editor.masterData.templates)}
                onValueChange={(value) => updateForm("offerTemplateId", value)}
                className="input-field h-11 font-medium"
                menuClassName="border-[#ececec]"
              />
              {selectedTemplate?.description ? (
                <span className="block text-xs text-[#5f5e5e]">{selectedTemplate.description}</span>
              ) : null}
            </label>

            <label className="mb-6 block space-y-2 border-t border-[#f0eceb] pt-6">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8786]">{t("sendOffer.personalMessage")}</span>
              <textarea
                className="input-field min-h-28"
                placeholder={t("sendOffer.personalMessagePlaceholder", {
                  candidateName: editor.application.candidateName,
                })}
                value={form.personalMessage}
                onChange={(event) => updateForm("personalMessage", event.target.value)}
              />
              {formErrors.personalMessage ? (
                <span className="block text-xs text-[#ba1a1a]">{formErrors.personalMessage}</span>
              ) : null}
            </label>

            <div className="rounded-[12px] bg-[#faf9f8] p-2">
              <div className="mb-3 flex items-center justify-between px-2 pt-1">
                <span className="eyebrow">{t("sendOffer.previewDocument")}</span>
                <button
                  type="button"
                  className="text-sm font-semibold text-[#1a1c1c] hover:text-[#b90014]"
                  onClick={() => window.print()}
                >
                  {t("sendOffer.print")}
                </button>
              </div>

              <div className="max-h-[680px] overflow-y-auto rounded-[10px] border border-[#ececec] bg-white p-8">
                <div className="mb-8 h-1 w-14 bg-[#b90014]" />
                <div className="mb-8 text-right text-[11px] leading-5 text-[#5f5e5e]">
                  RecruitPro Internal
                  <br />
                  123 Innovation District
                  <br />
                  {t("sendOffer.dateLabel")}: {formatDateDisplay(new Date().toISOString(), t("sendOffer.toBeConfirmed"))}
                </div>

                <h2 className="mb-4 text-[24px] font-bold text-[#1a1c1c]">{t("sendOffer.letterTitle")}</h2>
                <p className="mb-4 text-sm leading-6 text-[#1a1c1c]">
                  {t("sendOffer.greeting", { candidateName: editor.application.candidateName })}
                </p>
                <p className="mb-5 text-sm leading-6 text-[#1a1c1c]">
                  {t("sendOffer.letterIntro", {
                    jobTitle: editor.application.jobTitle,
                    departmentName: editor.application.departmentName,
                  })}
                </p>

                <table className="mb-6 w-full text-sm">
                  <tbody>
                    <tr className="border-b border-[#e7bdb8]">
                      <td className="py-3 text-[#5f5e5e]">{t("sendOffer.baseSalary")}</td>
                      <td className="py-3 text-right font-bold text-[#1a1c1c]">
                        {t("sendOffer.salaryPerMonth", {
                          amount: formatCurrencyAmount(form.baseSalary, selectedCurrency?.symbol ?? "₫"),
                        })}
                      </td>
                    </tr>
                    <tr className="border-b border-[#e7bdb8]">
                      <td className="py-3 text-[#5f5e5e]">{t("sendOffer.startDate")}</td>
                      <td className="py-3 text-right font-bold text-[#1a1c1c]">
                        {formatDateDisplay(form.proposedStartDate, t("sendOffer.toBeConfirmed"))}
                      </td>
                    </tr>
                    <tr className="border-b border-[#e7bdb8]">
                      <td className="py-3 text-[#5f5e5e]">{t("sendOffer.employmentType")}</td>
                      <td className="py-3 text-right font-bold text-[#1a1c1c]">{form.employmentType}</td>
                    </tr>
                    <tr className="border-b border-[#e7bdb8]">
                      <td className="py-3 text-[#5f5e5e]">{t("sendOffer.reportingTo")}</td>
                      <td className="py-3 text-right font-bold text-[#1a1c1c]">
                        {selectedManager?.fullName ?? t("sendOffer.toBeUpdated")}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 text-[#5f5e5e]">{t("sendOffer.benefits")}</td>
                      <td className="py-3 text-right font-bold text-[#1a1c1c]">
                        {editor.masterData.benefits
                          .filter((benefit) => form.benefitIds.includes(benefit.id))
                          .map((benefit) => benefit.name)
                          .join(", ") || t("sendOffer.noBenefitsSelected")}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {form.personalMessage ? (
                  <p className="mb-5 whitespace-pre-line text-sm leading-6 text-[#1a1c1c]">
                    {form.personalMessage}
                  </p>
                ) : null}

                <p className="text-sm leading-6 text-[#5f5e5e]">
                  {t("sendOffer.letterFooter")}
                </p>

                <div className="mt-10">
                  <div className="mb-2 flex h-10 w-40 items-center justify-center border border-dashed border-[#e7bdb8] text-[11px] italic text-[#5f5e5e]">
                    {t("sendOffer.signaturePlaceholder")}
                  </div>
                  <p className="text-sm font-bold text-[#1a1c1c]">{t("sendOffer.signatureTitle")}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default SendOfferScreen;
