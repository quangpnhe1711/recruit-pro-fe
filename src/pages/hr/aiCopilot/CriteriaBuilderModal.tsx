import { createPortal } from "react-dom";
import AsyncActionButton from "../../../common/components/AsyncActionButton";
import CommonSelect from "../../../common/components/CommonSelect";
import EmptyState from "../../../common/components/EmptyState";
import { useI18n } from "../../../i18n";
import type {
  CopilotRuleCriterionDto,
  CopilotSavedRuleDto,
} from "../../../services/copilot/copilotService";
import { countRuleCriteria, describeCriterion } from "./copilotUi";

type CriteriaBuilderModalProps = {
  open: boolean;
  onClose: () => void;
  priorityCriteria: CopilotRuleCriterionDto[];
  negativeCriteria: CopilotRuleCriterionDto[];
  priorityDraft: CopilotRuleCriterionDto;
  negativeDraft: CopilotRuleCriterionDto;
  setPriorityDraft: (updater: (current: CopilotRuleCriterionDto) => CopilotRuleCriterionDto) => void;
  setNegativeDraft: (updater: (current: CopilotRuleCriterionDto) => CopilotRuleCriterionDto) => void;
  onAddPriority: () => void;
  onAddNegative: () => void;
  onRemovePriority: (index: number) => void;
  onRemoveNegative: (index: number) => void;
  onClearAll: () => void;
  savedRules: CopilotSavedRuleDto[];
  savingRule: boolean;
  onSavePreset: () => Promise<void> | void;
  onToggleRule: (rule: CopilotSavedRuleDto) => Promise<void> | void;
  onDeleteRule: (ruleId: string) => Promise<void> | void;
  deletingRuleId: string | null;
  applying: boolean;
  onApplyAndRank: () => Promise<void> | void;
};

function CriteriaBuilderModal(props: CriteriaBuilderModalProps) {
  const { t } = useI18n();
  const {
    open,
    onClose,
    priorityCriteria,
    negativeCriteria,
    priorityDraft,
    negativeDraft,
    setPriorityDraft,
    setNegativeDraft,
    onAddPriority,
    onAddNegative,
    onRemovePriority,
    onRemoveNegative,
    onClearAll,
    savedRules,
    savingRule,
    onSavePreset,
    onToggleRule,
    onDeleteRule,
    deletingRuleId,
    applying,
    onApplyAndRank,
  } = props;

  if (!open) return null;

  const hasCriteria = priorityCriteria.length > 0 || negativeCriteria.length > 0;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1a1c1c]/45 px-4 py-6 backdrop-blur-sm">
      <div className="animate-scale-in flex max-h-full w-full max-w-[820px] flex-col overflow-hidden rounded-[20px] border border-[#ececec] bg-white shadow-[0_30px_80px_rgba(0,0,0,0.24)]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#eee9e7] px-6 py-5">
          <div>
            <p className="eyebrow text-[#b90014]">{t("aiCopilot.criteria.eyebrow")}</p>
            <h3 className="mt-1.5 text-[20px] font-semibold tracking-[-0.01em] text-[#1a1c1c]">
              {t("aiCopilot.criteria.title")}
            </h3>
            <p className="mt-1 text-[13px] text-[#5f5e5e]">
              {t("aiCopilot.criteria.subtitle")}
            </p>
          </div>
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#5f5e5e] transition-colors hover:bg-[#f2efed]"
            onClick={onClose}
            aria-label={t("common.close")}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 space-y-5 overflow-auto px-6 py-5">
          {/* Current criteria summary */}
          <div className="rounded-[14px] border border-[#eee9e7] bg-[#faf9f8] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#1a1c1c]">
                {t("aiCopilot.criteria.current")}
              </p>
              {hasCriteria ? (
                <div className="flex items-center gap-3">
                  <AsyncActionButton
                    type="button"
                    className="text-[12px] font-semibold text-[#005f93] disabled:opacity-50"
                    disabled={savingRule}
                    loading={savingRule}
                    loadingText={t("aiCopilot.criteria.saving")}
                    onClick={onSavePreset}
                    spinnerTone="brand"
                  >
                    {t("aiCopilot.criteria.savePreset")}
                  </AsyncActionButton>
                  <button
                    type="button"
                    className="text-[12px] font-semibold text-[#ba1a1a]"
                    onClick={onClearAll}
                  >
                    {t("aiCopilot.criteria.clearAll")}
                  </button>
                </div>
              ) : null}
            </div>
            {hasCriteria ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {priorityCriteria.map((criterion, index) => (
                  <button
                    key={`cur-p-${criterion.field}-${criterion.value}-${index}`}
                    type="button"
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[12px] font-semibold text-emerald-800 transition-colors hover:bg-emerald-200"
                    onClick={() => onRemovePriority(index)}
                  >
                    {describeCriterion(criterion)}
                    <span className="material-symbols-outlined text-[15px]">close</span>
                  </button>
                ))}
                {negativeCriteria.map((criterion, index) => (
                  <button
                    key={`cur-n-${criterion.field}-${criterion.value}-${index}`}
                    type="button"
                    className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-[12px] font-semibold text-rose-700 transition-colors hover:bg-rose-200"
                    onClick={() => onRemoveNegative(index)}
                  >
                    {describeCriterion(criterion)}
                    {criterion.autoReject ? ` (${t("aiCopilot.criteria.rejectTag")})` : ` (${t("aiCopilot.criteria.penalizeTag")})`}
                    <span className="material-symbols-outlined text-[15px]">close</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-[13px] text-[#5f5e5e]">
                {t("aiCopilot.criteria.empty")}
              </p>
            )}
          </div>

          {/* Two builders */}
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Priority */}
            <div className="rounded-[14px] border border-[#eee9e7] p-4">
              <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.1em] text-emerald-700">
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                {t("aiCopilot.criteria.priority")}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <CommonSelect
                  options={[
                    { label: t("aiCopilot.criteria.fields.skill"), value: "skill" },
                    { label: t("aiCopilot.criteria.fields.experienceYears"), value: "experienceYears" },
                    { label: t("aiCopilot.criteria.fields.education"), value: "education" },
                    { label: t("aiCopilot.criteria.fields.cvSummary"), value: "cvSummary" },
                  ]}
                  value={priorityDraft.field}
                  onChange={(event) =>
                    setPriorityDraft((current) => ({ ...current, field: event.target.value }))
                  }
                />
                <CommonSelect
                  options={[
                    { label: t("aiCopilot.criteria.weights.high"), value: "high" },
                    { label: t("aiCopilot.criteria.weights.medium"), value: "medium" },
                    { label: t("aiCopilot.criteria.weights.low"), value: "low" },
                  ]}
                  value={priorityDraft.weight}
                  onChange={(event) =>
                    setPriorityDraft((current) => ({ ...current, weight: event.target.value }))
                  }
                />
                <input
                  className="input-field col-span-2 h-10 py-2 text-[13px]"
                  placeholder={t("aiCopilot.criteria.priorityLabelPlaceholder")}
                  value={priorityDraft.label}
                  onChange={(event) =>
                    setPriorityDraft((current) => ({ ...current, label: event.target.value }))
                  }
                />
                <input
                  className="input-field col-span-2 h-10 py-2 text-[13px]"
                  placeholder={t("aiCopilot.criteria.priorityValuePlaceholder")}
                  value={priorityDraft.value}
                  onChange={(event) =>
                    setPriorityDraft((current) => ({ ...current, value: event.target.value }))
                  }
                />
              </div>
              <button type="button" className="btn btn-secondary mt-3 h-10 w-full" onClick={onAddPriority}>
                <span className="material-symbols-outlined text-[16px]">add</span>
                {t("aiCopilot.criteria.addPriority")}
              </button>
            </div>

            {/* Negative */}
            <div className="rounded-[14px] border border-[#eee9e7] p-4">
              <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.1em] text-[#ba1a1a]">
                <span className="material-symbols-outlined text-[16px]">remove_circle</span>
                {t("aiCopilot.criteria.negative")}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <CommonSelect
                  options={[
                    { label: t("aiCopilot.criteria.fields.education"), value: "education" },
                    { label: t("aiCopilot.criteria.fields.experienceYears"), value: "experienceYears" },
                    { label: t("aiCopilot.criteria.fields.cvSummary"), value: "cvSummary" },
                  ]}
                  value={negativeDraft.field}
                  onChange={(event) =>
                    setNegativeDraft((current) => ({ ...current, field: event.target.value }))
                  }
                />
                <CommonSelect
                  options={[
                    { label: t("aiCopilot.criteria.autoReject"), value: "true" },
                    { label: t("aiCopilot.criteria.onlyPenalize"), value: "false" },
                  ]}
                  value={negativeDraft.autoReject ? "true" : "false"}
                  onChange={(event) =>
                    setNegativeDraft((current) => ({
                      ...current,
                      autoReject: event.target.value === "true",
                    }))
                  }
                />
                <input
                  className="input-field col-span-2 h-10 py-2 text-[13px]"
                  placeholder={t("aiCopilot.criteria.negativeLabelPlaceholder")}
                  value={negativeDraft.label}
                  onChange={(event) =>
                    setNegativeDraft((current) => ({ ...current, label: event.target.value }))
                  }
                />
                <input
                  className="input-field col-span-2 h-10 py-2 text-[13px]"
                  placeholder={t("aiCopilot.criteria.negativeValuePlaceholder")}
                  value={negativeDraft.value}
                  onChange={(event) =>
                    setNegativeDraft((current) => ({ ...current, value: event.target.value }))
                  }
                />
              </div>
              <button type="button" className="btn btn-secondary mt-3 h-10 w-full" onClick={onAddNegative}>
                <span className="material-symbols-outlined text-[16px]">add</span>
                {t("aiCopilot.criteria.addNegative")}
              </button>
            </div>
          </div>

          {/* Saved presets */}
          <div className="rounded-[14px] border border-[#eee9e7] p-4">
            <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#1a1c1c]">
              {t("aiCopilot.criteria.savedPresets")}
            </p>
            {savedRules.length === 0 ? (
              <p className="mt-2 text-[13px] text-[#5f5e5e]">
                {t("aiCopilot.criteria.noPresets")}
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {savedRules.map((rule) => (
                  <div
                    key={`saved-${rule.ruleId}`}
                    className="flex items-center justify-between gap-3 rounded-[12px] border border-[#e8e2df] px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 truncate text-[13px] font-semibold text-[#1a1c1c]">
                        {rule.name}
                        {rule.isActive ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                            {t("aiCopilot.criteria.active")}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-[12px] text-[#5f5e5e]">
                        {t("aiCopilot.criteria.presetCounts", {
                          priority: countRuleCriteria(rule).priorityCount,
                          negative: countRuleCriteria(rule).negativeCount,
                        })}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <AsyncActionButton
                        type="button"
                        className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                          rule.isActive
                            ? "bg-[#f2efed] text-[#5f5e5e]"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                        loadingText=""
                        onClick={() => onToggleRule(rule)}
                        spinnerTone="brand"
                      >
                        {rule.isActive ? t("aiCopilot.criteria.stop") : t("aiCopilot.criteria.apply")}
                      </AsyncActionButton>
                      <AsyncActionButton
                        type="button"
                        className="rounded-full bg-rose-50 px-3 py-1.5 text-[12px] font-semibold text-rose-700 disabled:opacity-50"
                        disabled={deletingRuleId === rule.ruleId}
                        loading={deletingRuleId === rule.ruleId}
                        loadingText=""
                        onClick={() => onDeleteRule(rule.ruleId)}
                        spinnerTone="brand"
                      >
                        {t("common.delete")}
                      </AsyncActionButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {savedRules.length === 0 && !hasCriteria ? (
            <EmptyState
              className="!py-6"
              icon="tune"
              title={t("aiCopilot.criteria.emptyStateTitle")}
              description={t("aiCopilot.criteria.emptyStateDescription")}
            />
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-[#eee9e7] bg-[#faf9f8] px-6 py-4">
          <button type="button" className="btn btn-ghost h-11" onClick={onClose}>
            {t("common.close")}
          </button>
          <AsyncActionButton
            type="button"
            className="btn btn-primary h-11 px-6 disabled:opacity-50"
            disabled={applying || !hasCriteria}
            loading={applying}
            loadingText={t("aiCopilot.criteria.ranking")}
            onClick={onApplyAndRank}
          >
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            {t("aiCopilot.criteria.applyAndRank")}
          </AsyncActionButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default CriteriaBuilderModal;
