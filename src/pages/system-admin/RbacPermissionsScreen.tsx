import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../../common/components/PageHeader";
import Badge from "../../common/components/Badge";
import CommonSelect from "../../common/components/CommonSelect";
import { SkeletonGrid } from "../../common/components/Skeleton";
import {
  getRolePermissions,
  listModules,
  listRoles,
  updateRolePermissions,
} from "../../services/system-admin/adminService";
import type {
  RbacActionDto,
  RbacModuleDto,
  RbacRoleDto,
} from "../../modules/system-admin/adminSchema";
import { appToast, handleNonFormApiError } from "../../common/utils/appToast";
import { useI18n } from "../../i18n";
import { ConfirmModal, ErrorState } from "./automationUi";

const CRUD_ORDER = ["Read", "Create", "Update", "Delete"] as const;
const GROUP_ORDER = ["recruitment", "candidate", "notifications", "system"] as const;

function sameSet(a: Set<string>, b: Set<string>) {
  if (a.size !== b.size) return false;
  for (const item of a) if (!b.has(item)) return false;
  return true;
}

/** One toggle in the matrix. Critical grants get an extra warning treatment. */
function PermissionToggle({
  action,
  checked,
  disabled,
  onToggle,
  label,
}: {
  action: RbacActionDto;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onToggle}
      className={`premium-action inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-[9px] border px-2 text-[12px] font-medium transition-colors ${
        checked
          ? action.isCritical
            ? "border-[#b90014] bg-[#b90014] text-white"
            : "border-[#1a1c1c] bg-[#1a1c1c] text-white"
          : "border-[#e7ded9] bg-white text-[#8a8786] hover:border-[#b9b4b0]"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <span className="material-symbols-outlined text-[16px]">
        {checked ? "check" : "remove"}
      </span>
      {action.isCritical ? (
        <span className="material-symbols-outlined text-[14px]">warning</span>
      ) : null}
    </button>
  );
}

/**
 * System Admin → RBAC Permissions: pick a role on the left, edit its module × action grants on the
 * right. The backend is the security boundary (403 without PERMISSION_MANAGE, 409 on admin lockout);
 * this screen's job is to make "who can do what" readable and every change deliberate.
 */
function RbacPermissionsScreen() {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();

  const [roles, setRoles] = useState<RbacRoleDto[]>([]);
  const [modules, setModules] = useState<RbacModuleDto[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>(searchParams.get("role") ?? "");
  const [granted, setGranted] = useState<Set<string>>(new Set());
  const [savedGranted, setSavedGranted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<
    | { kind: "critical-grant"; action: RbacActionDto }
    | { kind: "grant-all" }
    | { kind: "discard-switch"; roleId: string }
    | null
  >(null);

  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? null;
  const dirty = !sameSet(granted, savedGranted);
  const allCodes = useMemo(
    () => modules.flatMap((module) => module.actions.map((action) => action.code)),
    [modules],
  );

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([listRoles(), listModules()])
      .then(([rolesData, modulesData]) => {
        setRoles(rolesData);
        setModules(modulesData);
        setSelectedRoleId((current) => current || rolesData[0]?.id || "");
      })
      .catch(() => setError(t("common.loadFailed")))
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => load(), [load]);

  const loadRoleGrants = useCallback(
    (roleId: string) => {
      if (!roleId) return;
      setRoleLoading(true);
      getRolePermissions(roleId)
        .then((rolePermissions) => {
          const set = new Set(rolePermissions.grantedCodes);
          setGranted(set);
          setSavedGranted(new Set(set));
        })
        .catch(() => setError(t("common.loadFailed")))
        .finally(() => setRoleLoading(false));
    },
    [t],
  );

  useEffect(() => {
    loadRoleGrants(selectedRoleId);
  }, [selectedRoleId, loadRoleGrants]);

  // Switching roles with unsaved edits silently dropping them would be hostile; gate it behind the
  // app confirm dialog (transient navigation guard, not a business action).
  const switchRole = (roleId: string) => {
    setSelectedRoleId(roleId);
    setSearchParams(roleId ? { role: roleId } : {}, { replace: true });
  };

  const selectRole = (roleId: string) => {
    if (roleId === selectedRoleId) return;
    if (dirty) {
      setConfirm({ kind: "discard-switch", roleId });
      return;
    }
    switchRole(roleId);
  };

  const applyDiscardSwitch = () => {
    if (confirm?.kind !== "discard-switch") return;
    switchRole(confirm.roleId);
    setConfirm(null);
  };

  const toggleCode = (action: RbacActionDto) => {
    if (granted.has(action.code)) {
      setGranted((current) => {
        const next = new Set(current);
        next.delete(action.code);
        return next;
      });
      return;
    }

    if (action.isCritical) {
      setConfirm({ kind: "critical-grant", action });
      return;
    }

    setGranted((current) => new Set(current).add(action.code));
  };

  const applyCriticalGrant = () => {
    if (confirm?.kind !== "critical-grant") return;
    setGranted((current) => new Set(current).add(confirm.action.code));
    setConfirm(null);
  };

  const selectAllRead = () => {
    setGranted((current) => {
      const next = new Set(current);
      modules.forEach((module) =>
        module.actions
          .filter((action) => action.action === "Read")
          .forEach((action) => next.add(action.code)),
      );
      return next;
    });
  };

  const applyGrantAll = () => {
    setGranted(new Set(allCodes));
    setConfirm(null);
  };

  const save = async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    try {
      const updated = await updateRolePermissions(selectedRoleId, Array.from(granted));
      const set = new Set(updated.grantedCodes);
      setGranted(set);
      setSavedGranted(new Set(set));
      setRoles((current) =>
        current.map((role) =>
          role.id === selectedRoleId ? { ...role, permissionCount: set.size } : role,
        ),
      );
      appToast.success(t("admin.saveSuccess", { role: updated.roleName }));
    } catch (err) {
      handleNonFormApiError(err);
    } finally {
      setSaving(false);
    }
  };

  const actionHeader = (action: string) => t(`admin.actions.${action}` as never) || action;

  return (
    <div className="sysadmin-page animate-fade-in pb-28">
      <PageHeader
        icon="lock_person"
        eyebrow={t("admin.consoleEyebrow")}
        title={t("admin.rbacTitle")}
        subtitle={t("admin.rbacSubtitle")}
      />

      {loading ? (
        <div className="mt-6">
          <SkeletonGrid count={6} />
        </div>
      ) : error ? (
        <div className="mt-6">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Role selector rail */}
          <aside>
            <div className="lg:hidden">
              <label className="field-label" htmlFor="rbac-role-select">
                {t("admin.selectRole")}
              </label>
              <CommonSelect
                value={selectedRoleId}
                onValueChange={selectRole}
                options={roles.map((role) => ({ label: role.name, value: role.id }))}
              />
            </div>
            <ul className="hidden flex-col gap-2 lg:flex" role="listbox" aria-label={t("admin.selectRole")}>
              {roles.map((role) => {
                const active = role.id === selectedRoleId;
                return (
                  <li key={role.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => selectRole(role.id)}
                      className={`w-full rounded-[14px] border px-4 py-3 text-left transition-colors ${
                        active
                          ? "border-[#b90014] bg-[#fdf6f4] shadow-sm"
                          : "border-[#e7ded9] bg-white hover:border-[#c9c2bd]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[14px] font-semibold text-[#1a1c1c]">{role.name}</span>
                        {role.isSystemAdmin ? (
                          <Badge tone="brand" icon="shield_person">
                            {t("admin.adminRole")}
                          </Badge>
                        ) : null}
                      </div>
                      {role.description ? (
                        <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-[#8a8786]">
                          {role.description}
                        </p>
                      ) : null}
                      <div className="mt-1.5 text-[12px] text-[#8a8786]">
                        {t("admin.roleCounts", {
                          users: String(role.userCount),
                          permissions: String(role.permissionCount),
                        })}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* Matrix */}
          <section aria-busy={roleLoading}>
            {selectedRole ? (
              <div className="executive-panel p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[18px] font-semibold text-[#1a1c1c]">
                      {t("admin.matrixFor", { role: selectedRole.name })}
                    </h2>
                    <p className="mt-1 max-w-xl text-[13px] leading-5 text-[#8a8786]">
                      {selectedRole.description || t("admin.rbacHelp")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={selectAllRead} disabled={roleLoading}>
                      <span className="material-symbols-outlined text-[18px]">visibility</span>
                      {t("admin.selectAllRead")}
                    </button>
                    <button
                      type="button"
                      className="btn btn-dark btn-sm"
                      onClick={() => setConfirm({ kind: "grant-all" })}
                      disabled={roleLoading}
                    >
                      <span className="material-symbols-outlined text-[18px]">key</span>
                      {t("admin.grantAll")}
                    </button>
                  </div>
                </div>

                {selectedRole.isSystemAdmin ? (
                  <div className="mt-4 flex items-start gap-2.5 rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] leading-5 text-amber-800">
                    <span className="material-symbols-outlined text-[18px]">warning</span>
                    {t("admin.systemAdminWarning")}
                  </div>
                ) : null}

                <div className="mt-5 flex flex-col gap-6">
                  {GROUP_ORDER.map((group) => {
                    const groupModules = modules.filter((module) => module.group === group);
                    if (groupModules.length === 0) return null;
                    return (
                      <div key={group}>
                        <h3 className="eyebrow mb-2">{t(`admin.groups.${group}` as never)}</h3>
                        <div className="overflow-x-auto rounded-[14px] border border-[#e7ded9]">
                          <table className="w-full min-w-[560px] border-collapse text-left">
                            <thead>
                              <tr className="bg-[#faf6f3] text-[12px] uppercase tracking-wide text-[#8a8786]">
                                <th className="px-4 py-2.5 font-medium">{t("admin.module")}</th>
                                {CRUD_ORDER.map((action) => (
                                  <th key={action} className="w-20 px-2 py-2.5 text-center font-medium">
                                    {actionHeader(action)}
                                  </th>
                                ))}
                                <th className="px-4 py-2.5 font-medium">{t("admin.specialActions")}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {groupModules.map((module) => {
                                const crudActions = new Map(
                                  module.actions
                                    .filter((action) => (CRUD_ORDER as readonly string[]).includes(action.action))
                                    .map((action) => [action.action, action] as const),
                                );
                                const specialActions = module.actions.filter(
                                  (action) => !(CRUD_ORDER as readonly string[]).includes(action.action),
                                );
                                return (
                                  <tr key={module.key} className="border-t border-[#efe8e3]">
                                    <td className="px-4 py-3">
                                      <div className="text-[14px] font-medium text-[#1a1c1c]">
                                        {t(`admin.modules.${module.key}` as never)}
                                      </div>
                                    </td>
                                    {CRUD_ORDER.map((crud) => {
                                      const action = crudActions.get(crud);
                                      return (
                                        <td key={crud} className="px-2 py-3 text-center">
                                          {action ? (
                                            <PermissionToggle
                                              action={action}
                                              checked={granted.has(action.code)}
                                              disabled={roleLoading || saving}
                                              onToggle={() => toggleCode(action)}
                                              label={`${t(`admin.modules.${module.key}` as never)} — ${actionHeader(crud)}`}
                                            />
                                          ) : (
                                            <span className="text-[#d5cdc7]">—</span>
                                          )}
                                        </td>
                                      );
                                    })}
                                    <td className="px-4 py-3">
                                      {specialActions.length === 0 ? (
                                        <span className="text-[#d5cdc7]">—</span>
                                      ) : (
                                        <div className="flex flex-wrap gap-2">
                                          {specialActions.map((action) => (
                                            <label
                                              key={action.code}
                                              className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] text-[#3a3a3a]"
                                            >
                                              <PermissionToggle
                                                action={action}
                                                checked={granted.has(action.code)}
                                                disabled={roleLoading || saving}
                                                onToggle={() => toggleCode(action)}
                                                label={`${t(`admin.modules.${module.key}` as never)} — ${actionHeader(action.action)}`}
                                              />
                                              {actionHeader(action.action)}
                                            </label>
                                          ))}
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="mt-4 flex items-start gap-2 text-[12px] leading-5 text-[#8a8786]">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  {t("admin.rbacFootnote")}
                </p>
              </div>
            ) : (
              <ErrorState message={t("admin.noRoleSelected")} />
            )}
          </section>
        </div>
      )}

      {/* Dirty-state action bar */}
      {dirty ? (
        <div className="animate-fade-in-up fixed inset-x-0 bottom-0 z-40 border-t border-[#e7ded9] bg-white/95 px-4 py-3 backdrop-blur">
          <div className="app-container flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-[14px] font-medium text-[#1a1c1c]">
              <span className="material-symbols-outlined text-[20px] text-amber-500">edit_note</span>
              {t("admin.unsavedChanges")}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setGranted(new Set(savedGranted))}
                disabled={saving}
              >
                {t("admin.resetChanges")}
              </button>
              <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? t("common.processing") : t("admin.savePermissions")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={confirm?.kind === "critical-grant"}
        title={t("admin.criticalGrantTitle")}
        danger
        confirmLabel={t("admin.criticalGrantConfirm")}
        onConfirm={applyCriticalGrant}
        onClose={() => setConfirm(null)}
      >
        {confirm?.kind === "critical-grant"
          ? t("admin.criticalGrantBody", {
              permission: confirm.action.name,
              role: selectedRole?.name ?? "",
            })
          : null}
      </ConfirmModal>

      <ConfirmModal
        open={confirm?.kind === "grant-all"}
        title={t("admin.grantAllTitle")}
        danger
        confirmLabel={t("admin.grantAllConfirm")}
        onConfirm={applyGrantAll}
        onClose={() => setConfirm(null)}
      >
        {t("admin.grantAllBody", { role: selectedRole?.name ?? "" })}
      </ConfirmModal>

      <ConfirmModal
        open={confirm?.kind === "discard-switch"}
        title={t("admin.discardChangesTitle")}
        danger
        confirmLabel={t("admin.discardChangesConfirm")}
        onConfirm={applyDiscardSwitch}
        onClose={() => setConfirm(null)}
      >
        {t("admin.discardChangesPrompt")}
      </ConfirmModal>
    </div>
  );
}

export default RbacPermissionsScreen;
