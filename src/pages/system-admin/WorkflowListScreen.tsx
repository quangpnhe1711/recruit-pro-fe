import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../common/components/PageHeader";
import CommonTable from "../../common/components/CommonTable";
import CommonSelect from "../../common/components/CommonSelect";
import { toast } from "react-toastify";
import { listWorkflows, setWorkflowEnabled } from "../../services/system-admin/automationService";
import type { WorkflowSummaryDto } from "../../modules/system-admin/automationSchema";
import { TRIGGER_EVENT_TYPES } from "../../modules/system-admin/automationSchema";
import { useI18n } from "../../i18n";
import WorkflowEditor from "./WorkflowEditor";
import {
  ConfirmModal,
  enabledBadge,
  ErrorState,
  eventLabel,
  formatDateTime,
  modeBadge,
  statusBadge,
} from "./automationUi";

function WorkflowListScreen() {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const [rows, setRows] = useState<WorkflowSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enabledFilter, setEnabledFilter] = useState("");
  const [triggerFilter, setTriggerFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [toggleTarget, setToggleTarget] = useState<WorkflowSummaryDto | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listWorkflows({
      isEnabled: enabledFilter === "" ? undefined : enabledFilter === "true",
      trigger: triggerFilter || undefined,
      mode: modeFilter || undefined,
    })
      .then(setRows)
      .catch(() => setError(t("common.loadFailed")))
      .finally(() => setLoading(false));
  }, [enabledFilter, triggerFilter, modeFilter, t]);

  useEffect(() => load(), [load]);

  const confirmToggle = async () => {
    if (!toggleTarget) return;
    setBusy(true);
    try {
      await setWorkflowEnabled(toggleTarget.id, !toggleTarget.isEnabled);
      toast.success(
        toggleTarget.isEnabled
          ? t("automation.workflowDisabled")
          : t("automation.workflowEnabled"),
      );
      setToggleTarget(null);
      load();
    } catch {
      toast.error(t("automation.toggleFailed"));
    } finally {
      setBusy(false);
    }
  };

  const triggerOptions = useMemo(
    () => [
      { label: t("automation.filterAllTriggers"), value: "" },
      ...TRIGGER_EVENT_TYPES.map((tr) => ({ label: eventLabel(tr), value: tr })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- eventLabel output depends on lang
    [t, lang],
  );

  return (
    <div className="sysadmin-page animate-fade-in">
      <PageHeader
        icon="account_tree"
        title={t("automation.workflowsTitle")}
        subtitle={t("automation.workflowsSubtitle")}
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
            <span className="material-symbols-outlined text-[18px]">add</span>
            {t("automation.createWorkflow")}
          </button>
        }
      />

      <div className="executive-filter-bar mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <CommonSelect
          value={enabledFilter}
          onValueChange={setEnabledFilter}
          options={[
            { label: t("automation.filterAllStatuses"), value: "" },
            { label: t("automation.enabled"), value: "true" },
            { label: t("automation.disabled"), value: "false" },
          ]}
        />
        <CommonSelect value={triggerFilter} onValueChange={setTriggerFilter} options={triggerOptions} />
        <CommonSelect
          value={modeFilter}
          onValueChange={setModeFilter}
          options={[
            { label: t("automation.filterAllModes"), value: "" },
            { label: "Shadow", value: "Shadow" },
            { label: "Live", value: "Live" },
            { label: t("automation.disabled"), value: "Disabled" },
          ]}
        />
      </div>

      {error ? (
        <div className="mt-6">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : (
        <div className="mt-4">
          <CommonTable<WorkflowSummaryDto>
            variant="executive"
            data={rows}
            loading={loading}
            keyExtractor={(w) => w.id}
            emptyMessage={t("automation.emptyWorkflows")}
            emptyIcon="account_tree"
            onRowClick={(w) => navigate(`/system-admin/automation/workflows/${w.id}`)}
            columns={[
              {
                key: "name",
                header: t("automation.workflowName"),
                primary: true,
                renderCell: (w) => <strong>{w.name}</strong>,
              },
              {
                key: "isEnabled",
                header: t("common.status"),
                renderCell: (w) => enabledBadge(w.isEnabled),
              },
              {
                key: "activeVersionNo",
                header: t("automation.version"),
                hideOnMobile: true,
                renderCell: (w) => (w.activeVersionNo ? `v${w.activeVersionNo}` : "-"),
              },
              {
                key: "triggerEventType",
                header: t("automation.triggerEvent"),
                renderCell: (w) => eventLabel(w.triggerEventType),
              },
              { key: "mode", header: t("automation.mode"), renderCell: (w) => modeBadge(w.mode) },
              {
                key: "lastRunAt",
                header: t("automation.lastRun"),
                hideOnMobile: true,
                renderCell: (w) => formatDateTime(w.lastRunAt),
              },
              {
                key: "lastStatus",
                header: t("automation.lastResult"),
                renderCell: (w) => statusBadge(w.lastStatus),
              },
              {
                key: "actions",
                header: t("common.actions"),
                isAction: true,
                renderCell: (w) => (
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/system-admin/automation/workflows/${w.id}`);
                      }}
                    >
                      {t("common.view")}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={busy}
                      onClick={(e) => {
                        e.stopPropagation();
                        setToggleTarget(w);
                      }}
                    >
                      {w.isEnabled ? t("automation.disable") : t("automation.enable")}
                    </button>
                  </div>
                ),
              },
            ]}
          />
        </div>
      )}

      {creating ? (
        <WorkflowEditor
          mode="create"
          onClose={() => setCreating(false)}
          onSaved={(newId) => {
            setCreating(false);
            navigate(`/system-admin/automation/workflows/${newId}`);
          }}
        />
      ) : null}

      {/* Enable/disable always goes through an explicit confirm — same safety
          level as the detail screen, and the modal's busy state prevents
          double submits. Publishing lives on the detail screen, where the
          draft state is actually known. */}
      <ConfirmModal
        open={!!toggleTarget}
        title={
          toggleTarget?.isEnabled
            ? t("automation.disableConfirmTitle")
            : t("automation.enableConfirmTitle")
        }
        confirmLabel={toggleTarget?.isEnabled ? t("automation.disable") : t("automation.enable")}
        danger={toggleTarget?.mode === "Live"}
        busy={busy}
        onConfirm={confirmToggle}
        onClose={() => setToggleTarget(null)}
      >
        <p>
          <strong>{toggleTarget?.name}</strong>
        </p>
        {toggleTarget?.mode === "Live" && !toggleTarget?.isEnabled ? (
          <p className="mt-3 rounded-[10px] bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
            {t("automation.liveWarning")}
          </p>
        ) : null}
      </ConfirmModal>
    </div>
  );
}

export default WorkflowListScreen;
