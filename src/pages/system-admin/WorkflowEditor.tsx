import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import CommonSelect from "../../common/components/CommonSelect";
import {
  ACTION_TYPES,
  CONDITION_OPERATORS,
  RECIPIENT_SELECTORS,
  TRIGGER_EVENT_TYPES,
  type WorkflowDetailDto,
  type WorkflowMode,
} from "../../modules/system-admin/automationSchema";
import { createWorkflow, updateWorkflow } from "../../services/system-admin/automationService";
import { useI18n } from "../../i18n";
import { actionLabel, eventLabel, operatorLabel, recipientLabel } from "./automationUi";

type EditableCondition = { field: string; operator: string; value: string };
type EditableAction = {
  type: string;
  recipients: string[];
  roles: string;
  title: string;
  body: string;
  cooldownHours: string;
};

function actionToEditable(type: string, configJson: string): EditableAction {
  let cfg: Record<string, unknown> = {};
  try {
    cfg = JSON.parse(configJson || "{}");
  } catch {
    /* ignore */
  }
  return {
    type,
    recipients: Array.isArray(cfg.recipients) ? (cfg.recipients as string[]) : [],
    roles: Array.isArray(cfg.roles) ? (cfg.roles as string[]).join(", ") : "",
    title: typeof cfg.title === "string" ? cfg.title : "",
    body: typeof cfg.body === "string" ? cfg.body : "",
    cooldownHours: cfg.cooldownHours != null ? String(cfg.cooldownHours) : "",
  };
}

function editableToConfigJson(a: EditableAction): string {
  const cfg: Record<string, unknown> = {};
  if (a.recipients.length) cfg.recipients = a.recipients;
  if (a.roles.trim()) cfg.roles = a.roles.split(",").map((r) => r.trim()).filter(Boolean);
  if (a.title.trim()) cfg.title = a.title.trim();
  if (a.body.trim()) cfg.body = a.body.trim();
  if (a.cooldownHours.trim()) cfg.cooldownHours = Number(a.cooldownHours) || 0;
  return JSON.stringify(cfg);
}

export default function WorkflowEditor({
  mode,
  workflow,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  workflow?: WorkflowDetailDto;
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const { t } = useI18n();
  const source = workflow?.activeVersion ?? workflow?.versions?.[0] ?? null;
  const [name, setName] = useState(workflow?.name ?? "");
  const [description, setDescription] = useState(workflow?.description ?? "");
  const [trigger, setTrigger] = useState(source?.triggerEventType ?? TRIGGER_EVENT_TYPES[0]);
  const [runMode, setRunMode] = useState<WorkflowMode>(source?.mode ?? "Shadow");
  const [conditions, setConditions] = useState<EditableCondition[]>(
    (source?.conditions ?? []).map((c) => ({ field: c.field, operator: c.operator, value: c.value ?? "" })),
  );
  const [actions, setActions] = useState<EditableAction[]>(
    (source?.actions ?? [{ type: "notify_user", configJson: "{}" }]).map((a) => actionToEditable(a.type, a.configJson)),
  );
  const [busy, setBusy] = useState(false);

  const errors = useMemo(() => {
    const e: string[] = [];
    if (!name.trim()) e.push(t("automation.validationNameRequired"));
    if (!TRIGGER_EVENT_TYPES.includes(trigger as (typeof TRIGGER_EVENT_TYPES)[number]))
      e.push(t("automation.validationTriggerRequired"));
    if (actions.length === 0) e.push(t("automation.validationActionRequired"));
    conditions.forEach((c, i) => {
      if (!c.field.trim())
        e.push(t("automation.validationConditionField", { index: i + 1 }));
    });
    return e;
  }, [name, trigger, actions, conditions, t]);

  const valid = errors.length === 0;

  const save = async () => {
    if (!valid || busy) return;
    setBusy(true);
    const payload = {
      name: name.trim(),
      description: description.trim(),
      triggerEventType: trigger,
      mode: runMode,
      conditions: conditions.map((c) => ({ field: c.field.trim(), operator: c.operator, value: c.value })),
      actions: actions.map((a) => ({ type: a.type, configJson: editableToConfigJson(a) })),
    };
    try {
      const result = mode === "create" ? await createWorkflow(payload) : await updateWorkflow(workflow!.id, payload);
      toast.success(mode === "create" ? t("automation.workflowCreated") : t("automation.draftSaved"));
      onSaved(result.id);
    } catch {
      toast.error(t("automation.saveFailed"));
    } finally {
      setBusy(false);
    }
  };

  const conditionsPart = conditions.length
    ? t("automation.previewIf", {
        list: conditions
          .map((c) => `${c.field} ${operatorLabel(c.operator)} ${c.value}`.trim())
          .join(` ${t("automation.previewAnd")} `),
      })
    : "";
  const preview = t("automation.previewTemplate", {
    event: eventLabel(trigger),
    conditions: conditionsPart,
    actions: actions.map((a) => actionLabel(a.type)).join(", ") || t("automation.previewNoActions"),
  });

  return (
    <div className="animate-fade-in fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-[#1a1c1c]/58 p-4 backdrop-blur-[3px]">
      <div
        role="dialog"
        aria-modal="true"
        className="animate-scale-in executive-panel my-6 w-full max-w-4xl p-0"
      >
        <div className="border-b border-[#eadfdb] px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow text-[#b90014]">{t("automation.workflowActions")}</p>
            <h3 className="mt-1 text-[20px] font-semibold tracking-[-0.02em] text-[#1a1c1c]">
              {mode === "create" ? t("automation.createWorkflow") : t("automation.editDraft")}
            </h3>
          </div>
          <button
            type="button"
            className="premium-action text-[#8a8786]"
            onClick={onClose}
            aria-label={t("common.close")}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4 px-5 py-5 sm:px-6">
          <section className="executive-section p-4">
            <label className="field-label">{t("automation.workflowName")}</label>
            <input
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("automation.namePlaceholder")}
            />
          </section>
          <section className="executive-section p-4">
            <label className="field-label">{t("automation.workflowDescription")}</label>
            <textarea className="input-field" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </section>

          <section className="executive-section grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
            <div>
              <label className="field-label">{t("automation.triggerEvent")}</label>
              <CommonSelect
                value={trigger}
                onValueChange={setTrigger}
                options={TRIGGER_EVENT_TYPES.map((tr) => ({ label: eventLabel(tr), value: tr }))}
              />
            </div>
            <div>
              <label className="field-label">{t("automation.mode")}</label>
              <CommonSelect
                value={runMode}
                onValueChange={(v) => setRunMode(v as WorkflowMode)}
                options={[
                  { label: t("automation.modeShadowOption"), value: "Shadow" },
                  { label: t("automation.modeLiveOption"), value: "Live" },
                  { label: t("automation.modeDisabledOption"), value: "Disabled" },
                ]}
              />
            </div>
          </section>

          {runMode === "Live" ? (
            <p className="rounded-[10px] bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
              {t("automation.liveWarning")}
            </p>
          ) : null}

          {/* Conditions */}
          <section className="executive-section p-4">
            <div className="mb-2 flex items-center justify-between">
              <label className="field-label mb-0">{t("automation.conditions")}</label>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setConditions((c) => [...c, { field: "", operator: "exists", value: "" }])}
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                {t("automation.addCondition")}
              </button>
            </div>
            {conditions.length === 0 ? (
              <p className="text-[13px] text-[#8a8786]">{t("automation.noConditionsEditor")}</p>
            ) : (
              <div className="space-y-2">
                {conditions.map((c, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-1 items-center gap-2 rounded-[12px] border border-[#eee9e7] p-2 sm:grid-cols-[1fr_1fr_1fr_auto] sm:rounded-none sm:border-0 sm:p-0"
                  >
                    <input className="input-field" placeholder={t("automation.fieldPlaceholder")} value={c.field} onChange={(e) => setConditions((arr) => arr.map((x, j) => (j === i ? { ...x, field: e.target.value } : x)))} />
                    <CommonSelect value={c.operator} onValueChange={(v) => setConditions((arr) => arr.map((x, j) => (j === i ? { ...x, operator: v } : x)))} options={CONDITION_OPERATORS.map((o) => ({ label: operatorLabel(o), value: o }))} />
                    <input className="input-field" placeholder={t("automation.valuePlaceholder")} value={c.value} onChange={(e) => setConditions((arr) => arr.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                    <button
                      type="button"
                      className="premium-action justify-self-end text-[#b90014]"
                      aria-label={t("automation.removeCondition")}
                      onClick={() => setConditions((arr) => arr.filter((_, j) => j !== i))}
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Actions */}
          <section className="executive-section p-4">
            <div className="mb-2 flex items-center justify-between">
              <label className="field-label mb-0">{t("automation.workflowActions")}</label>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setActions((a) => [...a, actionToEditable("notify_user", "{}")])}
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                {t("automation.addAction")}
              </button>
            </div>
            <div className="space-y-3">
              {actions.map((a, i) => (
                <div key={i} className="rounded-[14px] border border-[#e6ddd8] bg-[#fffdfc] p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <CommonSelect
                      wrapperClassName="flex-1"
                      value={a.type}
                      onValueChange={(v) => setActions((arr) => arr.map((x, j) => (j === i ? { ...x, type: v } : x)))}
                      options={ACTION_TYPES.map((ty) => ({ label: actionLabel(ty), value: ty }))}
                    />
                    <button
                      type="button"
                      className="premium-action text-[#b90014]"
                      aria-label={t("automation.removeAction")}
                      onClick={() => setActions((arr) => arr.filter((_, j) => j !== i))}
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>

                  {a.type === "notify_role" ? (
                    <input className="input-field mb-2" placeholder={t("automation.rolesPlaceholder")} value={a.roles} onChange={(e) => setActions((arr) => arr.map((x, j) => (j === i ? { ...x, roles: e.target.value } : x)))} />
                  ) : (
                    <div className="mb-2 flex flex-wrap gap-3">
                      {RECIPIENT_SELECTORS.map((sel) => (
                        <label key={sel} className="flex items-center gap-1.5 text-[13px] text-[#3a3a3a]">
                          <input
                            type="checkbox"
                            checked={a.recipients.includes(sel)}
                            onChange={(e) =>
                              setActions((arr) =>
                                arr.map((x, j) =>
                                  j === i
                                    ? { ...x, recipients: e.target.checked ? [...x.recipients, sel] : x.recipients.filter((r) => r !== sel) }
                                    : x,
                                ),
                              )
                            }
                          />
                          {recipientLabel(sel)}
                        </label>
                      ))}
                    </div>
                  )}

                  <input className="input-field mb-2" placeholder={t("automation.titlePlaceholder")} value={a.title} onChange={(e) => setActions((arr) => arr.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                  <input className="input-field" placeholder={t("automation.bodyPlaceholder")} value={a.body} onChange={(e) => setActions((arr) => arr.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))} />
                  {a.type === "send_reminder" ? (
                    <input className="input-field mt-2" type="number" placeholder={t("automation.cooldownPlaceholder")} value={a.cooldownHours} onChange={(e) => setActions((arr) => arr.map((x, j) => (j === i ? { ...x, cooldownHours: e.target.value } : x)))} />
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          {!valid ? (
            <ul className="rounded-[12px] border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-700">
              {errors.map((e, i) => (
                <li key={i}>• {e}</li>
              ))}
            </ul>
          ) : null}
        </div>
        <aside className="border-t border-[#eadfdb] bg-[#fbf7f5] p-5 lg:border-l lg:border-t-0">
          <div className="sticky top-5">
            <p className="eyebrow text-[#b90014]">{t("automation.previewLabel")}</p>
            <div className="mt-3 rounded-[16px] border border-[#e3dad6] bg-white p-4 text-[13px] leading-6 text-[#3a3a3a] shadow-[var(--shadow-xs)]">
              {preview}
            </div>
            <div className="mt-4 rounded-[16px] border border-[#e3dad6] bg-white p-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#8a8786]">
                {t("automation.mode")}
              </p>
              <p className="mt-2 text-[15px] font-semibold text-[#1a1c1c]">{runMode}</p>
            </div>
          </div>
        </aside>
        </div>

        <div className="flex flex-col-reverse gap-2.5 border-t border-[#eadfdb] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
            {t("common.cancel")}
          </button>
          <button type="button" className="btn btn-primary" onClick={save} disabled={busy || !valid} data-testid="save-workflow">
            {busy ? t("automation.savingWorkflow") : t("automation.saveDraft")}
          </button>
        </div>
      </div>
    </div>
  );
}
