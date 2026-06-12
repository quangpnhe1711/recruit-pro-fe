import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import LoadingIndicator from "../../common/components/LoadingIndicator";
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

function formatDateDisplay(value: string | null | undefined) {
  if (!value) return "To be confirmed";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatCurrencyAmount(value: string, symbol: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return `${symbol}0`;

  return `${symbol}${amount.toLocaleString()}`;
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

function mapEditorToForm(editor: OfferEditorDto): OfferFormState {
  return {
    offerTemplateId: editor.offer.offerTemplateId ?? editor.masterData.templates[0]?.id ?? "",
    baseSalary: editor.offer.baseSalary ? String(editor.offer.baseSalary) : "",
    currencyCode: editor.offer.currencyCode ?? editor.masterData.currencies[0]?.code ?? "USD",
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
  const navigate = useNavigate();
  const { applicationId = "" } = useParams();
  const [editor, setEditor] = useState<OfferEditorDto | null>(null);
  const [form, setForm] = useState<OfferFormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadOfferEditor() {
      setLoading(true);

      try {
        const response = await hrService.getOfferEditor(applicationId);
        if (!mounted) return;

        setEditor(response.data);
        setForm(mapEditorToForm(response.data));
      } catch {
        if (!mounted) return;
        toast.error("Unable to load offer editor.");
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
  }, [applicationId]);

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
    setForm((current) => (current ? { ...current, [key]: value } : current));
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

    setSaving(true);
    try {
      const response = await hrService.saveOfferDraft(applicationId, payload);
      setEditor(response.data);
      setForm(mapEditorToForm(response.data));
      toast.success(response.message || "Offer draft saved.");
    } catch {
      toast.error("Unable to save offer draft.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendOffer() {
    const payload = toPayload();
    if (!payload) return;

    setSending(true);
    try {
      const response = await hrService.sendOffer(applicationId, payload);
      setEditor(response.data);
      setForm(mapEditorToForm(response.data));
      toast.success(response.message || "Offer sent successfully.");
    } catch {
      toast.error("Unable to send offer.");
    } finally {
      setSending(false);
    }
  }

  if (loading || !editor || !form) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-[1440px] items-center justify-center px-4 py-10 md:px-10">
        <LoadingIndicator label="Loading offer editor..." />
      </div>
    );
  }

  const offerStatusTone =
    editor.offer.status.toLowerCase() === "sent"
      ? "bg-[#cde5ff] text-[#004b74]"
      : "bg-[#ffdad6] text-[#93000d]";

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-10">
      <div className="mb-8">
        <nav className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#5f5e5e]">
          <Link className="hover:text-[#b90014]" to="/hr/applications">
            Applications
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <Link className="hover:text-[#b90014]" to={`/hr/applications/${applicationId}`}>
            {editor.application.candidateName}
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-[#1a1c1c]">Send Offer</span>
        </nav>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${offerStatusTone}`}>
                Offer {editor.offer.status}
              </span>
              <span className="text-sm text-[#5f5e5e]">{editor.application.referenceCode}</span>
            </div>
            <h1 className="text-[40px] font-bold leading-tight text-[#1a1c1c]">
              Create & Send Offer Letter
            </h1>
            <p className="mt-2 text-lg text-[#5f5e5e]">
              Finalize the recruitment journey for {editor.application.candidateName}.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 border border-[#1a1c1c] bg-white px-5 py-3 text-sm font-semibold text-[#1a1c1c] transition-colors hover:bg-[#f3f3f3]"
              onClick={() => navigate(`/hr/applications/${applicationId}`)}
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Back to Review
            </button>
            <button
              type="button"
              className="border border-[#1a1c1c] bg-white px-5 py-3 text-sm font-semibold text-[#1a1c1c] transition-colors hover:bg-[#f3f3f3] disabled:opacity-60"
              disabled={saving || sending}
              onClick={() => void handleSaveDraft()}
            >
              {saving ? "Saving..." : "Save Draft"}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 bg-[#b90014] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#93000d] disabled:opacity-60"
              disabled={sending || saving}
              onClick={() => void handleSendOffer()}
            >
              <span className="material-symbols-outlined text-base">send</span>
              {sending ? "Sending..." : "Send Offer via Email"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_420px]">
        <div className="space-y-6">
          <section className="flex items-center justify-between border border-[#e7bdb8] bg-white p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[#f3f3f3]">
                {editor.application.candidateAvatarUrl ? (
                  <img
                    alt={editor.application.candidateName}
                    className="h-full w-full object-cover"
                    src={editor.application.candidateAvatarUrl}
                  />
                ) : (
                  <span className="material-symbols-outlined text-[28px] text-[#5f5e5e]">person</span>
                )}
              </div>
              <div>
                <h2 className="text-[24px] font-semibold text-[#1a1c1c]">
                  {editor.application.candidateName}
                </h2>
                <p className="text-sm text-[#5f5e5e]">
                  {editor.application.jobTitle} • {editor.application.departmentName}
                </p>
                <p className="mt-1 text-sm text-[#5f5e5e]">{editor.application.candidateEmail}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="rounded-full bg-[#cde5ff] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#004b74]">
                Stage: {editor.application.stageLabel}
              </span>
              <p className="mt-2 text-[11px] text-[#5f5e5e]">
                Last updated {formatDateDisplay(editor.offer.updatedAt)}
              </p>
            </div>
          </section>

          <section className="space-y-8 border border-[#e7bdb8] bg-white p-8">
            <div>
              <h3 className="mb-6 text-sm font-bold uppercase tracking-[0.12em] text-[#1a1c1c]">
                Financial Package
              </h3>
              <div className="grid gap-6 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#5f5e5e]">Base Salary</span>
                  <input
                    className="w-full border border-[#e7bdb8] px-4 py-3 text-sm font-semibold outline-none transition-all focus:border-[#1a1c1c]"
                    type="number"
                    value={form.baseSalary}
                    onChange={(event) => updateForm("baseSalary", event.target.value)}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#5f5e5e]">Currency</span>
                  <select
                    className="w-full border border-[#e7bdb8] bg-white px-4 py-3 text-sm font-semibold outline-none transition-all focus:border-[#1a1c1c]"
                    value={form.currencyCode}
                    onChange={(event) => updateForm("currencyCode", event.target.value)}
                  >
                    {editor.masterData.currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#5f5e5e]">Bonus Structure</span>
                  <input
                    className="w-full border border-[#e7bdb8] px-4 py-3 text-sm font-semibold outline-none transition-all focus:border-[#1a1c1c]"
                    type="text"
                    value={form.bonusDescription}
                    onChange={(event) => updateForm("bonusDescription", event.target.value)}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#5f5e5e]">Equity / Stock Options</span>
                  <input
                    className="w-full border border-[#e7bdb8] px-4 py-3 text-sm font-semibold outline-none transition-all focus:border-[#1a1c1c]"
                    type="text"
                    value={form.equityNotes}
                    onChange={(event) => updateForm("equityNotes", event.target.value)}
                  />
                </label>
              </div>
            </div>

            <div>
              <h3 className="mb-6 text-sm font-bold uppercase tracking-[0.12em] text-[#1a1c1c]">
                Employment Terms
              </h3>
              <div className="grid gap-6 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#5f5e5e]">Employment Type</span>
                  <select
                    className="w-full border border-[#e7bdb8] bg-white px-4 py-3 text-sm font-semibold outline-none transition-all focus:border-[#1a1c1c]"
                    value={form.employmentType}
                    onChange={(event) => updateForm("employmentType", event.target.value)}
                  >
                    {editor.masterData.employmentTypes.map((type) => (
                      <option key={type} value={normalizeEmploymentLabel(type)}>
                        {normalizeEmploymentLabel(type)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#5f5e5e]">Proposed Start Date</span>
                  <input
                    className="w-full border border-[#e7bdb8] px-4 py-3 text-sm font-semibold outline-none transition-all focus:border-[#1a1c1c]"
                    type="date"
                    value={form.proposedStartDate}
                    onChange={(event) => updateForm("proposedStartDate", event.target.value)}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#5f5e5e]">Probation Period</span>
                  <input
                    className="w-full border border-[#e7bdb8] px-4 py-3 text-sm font-semibold outline-none transition-all focus:border-[#1a1c1c]"
                    type="text"
                    value={form.probationPeriod}
                    onChange={(event) => updateForm("probationPeriod", event.target.value)}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#5f5e5e]">Reporting Manager</span>
                  <select
                    className="w-full border border-[#e7bdb8] bg-white px-4 py-3 text-sm font-semibold outline-none transition-all focus:border-[#1a1c1c]"
                    value={form.reportingManagerId}
                    onChange={(event) => updateForm("reportingManagerId", event.target.value)}
                  >
                    {editor.masterData.reportingManagers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.fullName} ({manager.title})
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div>
              <h3 className="mb-6 text-sm font-bold uppercase tracking-[0.12em] text-[#1a1c1c]">
                Benefits Package
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {editor.masterData.benefits.map((benefit) => {
                  const selected = form.benefitIds.includes(benefit.id);
                  return (
                    <label
                      key={benefit.id}
                      className={`flex cursor-pointer items-center gap-3 border p-3 transition-colors ${selected ? "border-[#1a1c1c] bg-[#f3f3f3]" : "border-[#e7bdb8] bg-white hover:bg-[#f9f9f9]"}`}
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
          <section className="border border-[#e7bdb8] bg-white p-6 xl:sticky xl:top-24">
            <label className="mb-5 block space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#5f5e5e]">Select Template</span>
              <select
                className="w-full border border-[#e7bdb8] bg-white px-4 py-3 text-sm font-semibold outline-none transition-all focus:border-[#1a1c1c]"
                value={form.offerTemplateId}
                onChange={(event) => updateForm("offerTemplateId", event.target.value)}
              >
                {editor.masterData.templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              {selectedTemplate?.description ? (
                <span className="block text-xs text-[#5f5e5e]">{selectedTemplate.description}</span>
              ) : null}
            </label>

            <label className="mb-6 block space-y-2 border-t border-[#e7bdb8] pt-6">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#5f5e5e]">Personal Message</span>
              <textarea
                className="min-h-28 w-full border border-[#e7bdb8] px-4 py-3 text-sm outline-none transition-all focus:border-[#1a1c1c]"
                placeholder={`Add a personal note to ${editor.application.candidateName}...`}
                value={form.personalMessage}
                onChange={(event) => updateForm("personalMessage", event.target.value)}
              />
            </label>

            <div className="bg-[#f3f3f3] p-2">
              <div className="mb-3 flex items-center justify-between px-2 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#5f5e5e]">Document Preview</span>
                <button
                  type="button"
                  className="text-sm font-semibold text-[#1a1c1c] hover:text-[#b90014]"
                  onClick={() => window.print()}
                >
                  Print
                </button>
              </div>

              <div className="max-h-[680px] overflow-y-auto border border-[#e7bdb8] bg-white p-8">
                <div className="mb-8 h-1 w-14 bg-[#b90014]" />
                <div className="mb-8 text-right text-[11px] leading-5 text-[#5f5e5e]">
                  RecruitPro Internal
                  <br />
                  123 Innovation District
                  <br />
                  Date: {formatDateDisplay(new Date().toISOString())}
                </div>

                <h2 className="mb-4 text-[24px] font-bold text-[#1a1c1c]">Letter of Offer</h2>
                <p className="mb-4 text-sm leading-6 text-[#1a1c1c]">
                  Dear {editor.application.candidateName},
                </p>
                <p className="mb-5 text-sm leading-6 text-[#1a1c1c]">
                  We are delighted to offer you the position of <strong>{editor.application.jobTitle}</strong> at RecruitPro Internal. Your experience will be a strong addition to the {editor.application.departmentName} team.
                </p>

                <table className="mb-6 w-full text-sm">
                  <tbody>
                    <tr className="border-b border-[#e7bdb8]">
                      <td className="py-3 text-[#5f5e5e]">Base Salary</td>
                      <td className="py-3 text-right font-bold text-[#1a1c1c]">
                        {formatCurrencyAmount(form.baseSalary, selectedCurrency?.symbol ?? "$")} {form.currencyCode} / Year
                      </td>
                    </tr>
                    <tr className="border-b border-[#e7bdb8]">
                      <td className="py-3 text-[#5f5e5e]">Start Date</td>
                      <td className="py-3 text-right font-bold text-[#1a1c1c]">
                        {formatDateDisplay(form.proposedStartDate)}
                      </td>
                    </tr>
                    <tr className="border-b border-[#e7bdb8]">
                      <td className="py-3 text-[#5f5e5e]">Employment Type</td>
                      <td className="py-3 text-right font-bold text-[#1a1c1c]">{form.employmentType}</td>
                    </tr>
                    <tr className="border-b border-[#e7bdb8]">
                      <td className="py-3 text-[#5f5e5e]">Reporting To</td>
                      <td className="py-3 text-right font-bold text-[#1a1c1c]">
                        {selectedManager?.fullName ?? "To be assigned"}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 text-[#5f5e5e]">Benefits</td>
                      <td className="py-3 text-right font-bold text-[#1a1c1c]">
                        {editor.masterData.benefits
                          .filter((benefit) => form.benefitIds.includes(benefit.id))
                          .map((benefit) => benefit.name)
                          .join(", ") || "No benefits selected"}
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
                  This offer is contingent upon the successful completion of our standard checks. We look forward to welcoming you to the team.
                </p>

                <div className="mt-10">
                  <div className="mb-2 flex h-10 w-40 items-center justify-center border border-dashed border-[#e7bdb8] text-[11px] italic text-[#5f5e5e]">
                    Signature placeholder
                  </div>
                  <p className="text-sm font-bold text-[#1a1c1c]">HR Director, RecruitPro</p>
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
