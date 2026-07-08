import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../common/components/PageHeader";
import { SkeletonText } from "../../common/components/Skeleton";
import CommonTable from "../../common/components/CommonTable";
import {
  getWorkflow,
  publishWorkflow,
  setWorkflowEnabled,
} from "../../services/system-admin/automationService";
import type { ExecutionSummaryDto, WorkflowDetailDto, WorkflowVersionDto } from "../../modules/system-admin/automationSchema";
import { useI18n } from "../../i18n";
import { appToast, handleNonFormApiError } from "../../common/utils/appToast";
import WorkflowEditor from "./WorkflowEditor";
import {
  actionLabel,
  ConfirmModal,
  enabledBadge,
  ErrorState,
  eventLabel,
  formatDateTime,
  JsonDetails,
  modeBadge,
  operatorLabel,
  statusBadge,
} from "./automationUi";

function VersionCard({ version, title }: { version: WorkflowVersionDto; title: string }) {
  const { t } = useI18n();
  return (
    <div className="executive-section p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-[#1a1c1c]">
          {title} (v{version.versionNo})
        </h3>
        {modeBadge(version.mode)}
      </div>
      <dl className="mt-4 space-y-3 text-[14px]">
        <div>
          <dt className="text-[12px] font-semibold uppercase tracking-wide text-[#a8a4a2]">
            {t("automation.triggerEvent")}
          </dt>
          <dd className="mt-1 text-[#1a1c1c]">{eventLabel(version.triggerEventType)}</dd>
        </div>
        <div>
          <dt className="text-[12px] font-semibold uppercase tracking-wide text-[#a8a4a2]">
            {t("automation.conditions")}
          </dt>
          <dd className="mt-1">
            {version.conditions.length === 0 ? (
              <span className="text-[#8a8786]">{t("automation.noConditions")}</span>
            ) : (
              <ul className="space-y-1">
                {version.conditions.map((c, i) => (
                  <li key={i} className="text-[#3a3a3a]">
                    <code className="text-[13px]">{c.field}</code> {operatorLabel(c.operator)}{" "}
                    <code className="text-[13px]">{c.value ?? ""}</code>
                  </li>
                ))}
              </ul>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-[12px] font-semibold uppercase tracking-wide text-[#a8a4a2]">
            {t("automation.workflowActions")}
          </dt>
          <dd className="mt-1 space-y-2">
            {version.actions.map((a, i) => (
              <div key={i} className="rounded-[12px] border border-[#eee5e1] bg-[#fbf7f5] px-3 py-2">
                <span className="font-medium text-[#1a1c1c]">{actionLabel(a.type)}</span>
                <JsonDetails label={t("automation.configJson")} json={a.configJson} />
              </div>
            ))}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function WorkflowDetailScreen() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [wf, setWf] = useState<WorkflowDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState<null | "publish" | "toggle">(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getWorkflow(id)
      .then(setWf)
      .catch(() => setError(t("common.loadFailed")))
      .finally(() => setLoading(false));
  }, [id, t]);

  useEffect(() => load(), [load]);

  const doPublish = async () => {
    setBusy(true);
    try {
      await publishWorkflow(id);
      appToast.success(t("automation.published"));
      setConfirm(null);
      load();
    } catch (err) {
      handleNonFormApiError(err);
    } finally {
      setBusy(false);
    }
  };

  const doToggle = async () => {
    if (!wf) return;
    setBusy(true);
    try {
      await setWorkflowEnabled(id, !wf.isEnabled);
      appToast.success(
        wf.isEnabled ? t("automation.workflowDisabled") : t("automation.workflowEnabled"),
      );
      setConfirm(null);
      load();
    } catch (err) {
      handleNonFormApiError(err);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="sysadmin-page">
        <SkeletonText lines={6} />
      </div>
    );
  }
  if (error || !wf) {
    return (
      <div className="sysadmin-page">
        <ErrorState message={error ?? t("automation.workflowNotFound")} onRetry={load} />
      </div>
    );
  }

  const liveMode = (wf.activeVersion?.mode ?? "Shadow") === "Live";
  // A draft is any version that has never been published.
  const hasDraft = wf.versions.some((v) => !v.publishedAt);

  return (
    <div className="sysadmin-page animate-fade-in">
      <PageHeader
        icon="account_tree"
        title={wf.name}
        subtitle={wf.description ?? undefined}
        actions={
          <>
            {enabledBadge(wf.isEnabled)}
            <button type="button" className="btn btn-secondary" onClick={() => setEditing(true)}>
              {t("automation.editDraft")}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setConfirm("toggle")}>
              {wf.isEnabled ? t("automation.disable") : t("automation.enable")}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!hasDraft}
              title={hasDraft ? undefined : t("automation.noDraftHint")}
              onClick={() => setConfirm("publish")}
            >
              {t("automation.publishVersion")}
            </button>
          </>
        }
      />

      {liveMode ? (
        <p className="mt-4 rounded-[10px] bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
          {t("automation.liveBanner")}
        </p>
      ) : (
        <p className="mt-4 rounded-[10px] bg-sky-50 px-3 py-2 text-[13px] text-sky-700">
          {t("automation.shadowBanner")}
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {wf.activeVersion ? (
          <VersionCard version={wf.activeVersion} title={t("automation.activeVersion")} />
        ) : (
          <div className="executive-section p-5 text-[14px] text-[#8a8786]">
            {t("automation.noActiveVersion")}
          </div>
        )}

        <div className="executive-section p-5">
          <h3 className="text-[15px] font-semibold text-[#1a1c1c]">
            {t("automation.versionHistory")}
          </h3>
          <ul className="mt-3 space-y-2 text-[14px]">
            {wf.versions.map((v) => (
              <li key={v.id} className="flex items-center justify-between rounded-[12px] border border-[#eee5e1] bg-[#fbf7f5] px-3 py-2">
                <span>
                  v{v.versionNo} ·{" "}
                  {v.publishedAt
                    ? t("automation.publishedOn", { time: formatDateTime(v.publishedAt) })
                    : t("automation.statusDraft")}
                </span>
                <span className="flex items-center gap-2">
                  {v.isActive ? (
                    <span className="text-[12px] font-semibold text-emerald-600">
                      {t("automation.inUse")}
                    </span>
                  ) : null}
                  {modeBadge(v.mode)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-[#1a1c1c]">
          {t("automation.recentExecutions")}
        </h2>
        <Link to={`/system-admin/automation/executions?workflowId=${wf.id}`} className="btn btn-ghost">
          {t("automation.viewAll")}
        </Link>
      </div>
      <div className="mt-3">
        <CommonTable<ExecutionSummaryDto>
          variant="executive"
          data={wf.recentExecutions}
          keyExtractor={(e) => e.id}
          emptyMessage={t("automation.emptyExecutions")}
          onRowClick={(e) => navigate(`/system-admin/automation/executions/${e.id}`)}
          columns={[
            {
              key: "eventType",
              header: t("automation.eventType"),
              primary: true,
              renderCell: (e) => eventLabel(e.eventType),
            },
            { key: "mode", header: t("automation.mode"), renderCell: (e) => modeBadge(e.mode) },
            { key: "status", header: t("common.status"), renderCell: (e) => statusBadge(e.status) },
            {
              key: "createdAt",
              header: t("common.time"),
              renderCell: (e) => formatDateTime(e.createdAt),
            },
          ]}
        />
      </div>

      {editing ? (
        <WorkflowEditor
          mode="edit"
          workflow={wf}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            load();
          }}
        />
      ) : null}

      <ConfirmModal
        open={confirm === "publish"}
        title={t("automation.publishVersion")}
        confirmLabel={t("automation.publish")}
        danger={liveMode}
        busy={busy}
        onConfirm={doPublish}
        onClose={() => setConfirm(null)}
      >
        <p>{t("automation.publishBody")}</p>
        {liveMode ? (
          <p className="mt-3 rounded-[10px] bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
            {t("automation.liveWarning")}
          </p>
        ) : null}
      </ConfirmModal>

      <ConfirmModal
        open={confirm === "toggle"}
        title={wf.isEnabled ? t("automation.disableConfirmTitle") : t("automation.enableConfirmTitle")}
        confirmLabel={wf.isEnabled ? t("automation.disable") : t("automation.enable")}
        busy={busy}
        onConfirm={doToggle}
        onClose={() => setConfirm(null)}
      >
        <p>{wf.isEnabled ? t("automation.disableBody") : t("automation.enableBody")}</p>
      </ConfirmModal>
    </div>
  );
}

export default WorkflowDetailScreen;
