import { FormEvent, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../../common/components/PageHeader";
import CommonTable from "../../common/components/CommonTable";
import CommonSelect from "../../common/components/CommonSelect";
import Badge, { type BadgeTone } from "../../common/components/Badge";
import {
  listRoles,
  listUsers,
  updateUserRoles,
  updateUserStatus,
} from "../../services/system-admin/adminService";
import type { Paginated } from "../../modules/system-admin/automationSchema";
import type { RbacRoleDto, SysAdminUserDto } from "../../modules/system-admin/adminSchema";
import { appToast, handleNonFormApiError } from "../../common/utils/appToast";
import { useI18n } from "../../i18n";
import { ConfirmModal, ErrorState, formatDateTime } from "./automationUi";

const STATUS_TONES: Record<string, BadgeTone> = {
  Active: "success",
  Inactive: "neutral",
  Blocked: "danger",
};

function statusToneOf(status: string): BadgeTone {
  return STATUS_TONES[status] ?? "neutral";
}

/**
 * System Admin → Users: search the directory, see each account's roles and status at a glance,
 * deactivate/reactivate accounts, and reassign roles. Backend guards (403/409) are surfaced verbatim.
 */
function UserManagementScreen() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<Paginated<SysAdminUserDto> | null>(null);
  const [roles, setRoles] = useState<RbacRoleDto[]>([]);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState(searchParams.get("roleId") ?? "");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [statusTarget, setStatusTarget] = useState<SysAdminUserDto | null>(null);
  const [rolesTarget, setRolesTarget] = useState<SysAdminUserDto | null>(null);
  const [roleDraft, setRoleDraft] = useState<Set<string>>(new Set());

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listUsers({
      q: search || undefined,
      roleId: roleFilter || undefined,
      status: statusFilter || undefined,
      page,
      pageSize: 20,
    })
      .then(setData)
      .catch(() => setError(t("common.loadFailed")))
      .finally(() => setLoading(false));
  }, [search, roleFilter, statusFilter, page, t]);

  useEffect(() => load(), [load]);

  useEffect(() => {
    listRoles()
      .then(setRoles)
      .catch(() => {
        /* role filter degrades gracefully; the table still loads */
      });
  }, []);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const confirmStatusChange = async () => {
    if (!statusTarget) return;
    const deactivating = statusTarget.status === "Active";
    setBusy(true);
    try {
      await updateUserStatus(statusTarget.id, deactivating ? "Inactive" : "Active");
      appToast.success(
        deactivating
          ? t("admin.userDeactivated", { name: statusTarget.fullName })
          : t("admin.userActivated", { name: statusTarget.fullName }),
      );
      setStatusTarget(null);
      load();
    } catch (err) {
      handleNonFormApiError(err);
    } finally {
      setBusy(false);
    }
  };

  const openRolesEditor = (user: SysAdminUserDto) => {
    setRolesTarget(user);
    setRoleDraft(new Set(user.roles.map((role) => role.id)));
  };

  const confirmRolesChange = async () => {
    if (!rolesTarget) return;
    if (roleDraft.size === 0) {
      appToast.info(t("admin.errorNoRoles"));
      return;
    }
    setBusy(true);
    try {
      await updateUserRoles(rolesTarget.id, Array.from(roleDraft));
      appToast.success(t("admin.userRolesUpdated", { name: rolesTarget.fullName }));
      setRolesTarget(null);
      load();
    } catch (err) {
      handleNonFormApiError(err);
    } finally {
      setBusy(false);
    }
  };

  const total = data?.totalItems ?? 0;
  const pageSize = data?.pageSize ?? 20;
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  const grantingAdminRole =
    rolesTarget != null &&
    roles.some(
      (role) =>
        role.isSystemAdmin &&
        roleDraft.has(role.id) &&
        !rolesTarget.roles.some((existing) => existing.id === role.id),
    );

  return (
    <div className="sysadmin-page animate-fade-in">
      <PageHeader
        icon="group"
        eyebrow={t("admin.consoleEyebrow")}
        title={t("admin.usersTitle")}
        subtitle={t("admin.usersSubtitle")}
      />

      <form className="executive-filter-bar mt-5 flex flex-wrap items-end gap-3" onSubmit={submitSearch}>
        <div className="min-w-56 flex-1">
          <label className="field-label" htmlFor="admin-user-search">
            {t("common.search")}
          </label>
          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-[#a8a4a2]">
              search
            </span>
            <input
              id="admin-user-search"
              type="search"
              className="input-field pl-10"
              placeholder={t("admin.searchPlaceholder")}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
        </div>
        <div className="w-44">
          <label className="field-label">{t("admin.roleFilter")}</label>
          <CommonSelect
            value={roleFilter}
            onValueChange={(value) => {
              setRoleFilter(value);
              setPage(1);
            }}
            options={[
              { label: t("common.all"), value: "" },
              ...roles.map((role) => ({ label: role.name, value: role.id })),
            ]}
          />
        </div>
        <div className="w-40">
          <label className="field-label">{t("admin.statusFilter")}</label>
          <CommonSelect
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
            options={[
              { label: t("common.all"), value: "" },
              { label: t("admin.statusActive"), value: "Active" },
              { label: t("admin.statusInactive"), value: "Inactive" },
              { label: t("admin.statusBlocked"), value: "Blocked" },
            ]}
          />
        </div>
        <button type="submit" className="btn btn-primary h-11">
          {t("common.search")}
        </button>
      </form>

      {error ? (
        <div className="mt-6">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : (
        <div className="mt-4">
          <CommonTable<SysAdminUserDto>
            variant="executive"
            data={data?.items ?? []}
            loading={loading}
            keyExtractor={(user) => user.id}
            emptyMessage={t("admin.emptyUsers")}
            emptyIcon="group_off"
            showPagination
            pagination={{
              enabled: true,
              currentPage: page,
              totalPages: data?.totalPages ?? 1,
              totalItems: total,
              rangeStart,
              rangeEnd,
              onPageChange: setPage,
            }}
            columns={[
              {
                key: "user",
                header: t("admin.userColumn"),
                primary: true,
                renderCell: (user) => (
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f4e8e4] text-[13px] font-semibold text-[#b90014]">
                      {user.fullName.trim().charAt(0).toUpperCase() || "?"}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-medium text-[#1a1c1c]">{user.fullName}</div>
                      <div className="truncate text-[12px] text-[#8a8786]">{user.email}</div>
                    </div>
                  </div>
                ),
              },
              {
                key: "roles",
                header: t("admin.rolesColumn"),
                renderCell: (user) => (
                  <div className="flex flex-wrap gap-1.5">
                    {user.roles.map((role) => (
                      <Badge key={role.id} tone={role.name === "SystemAdmin" ? "brand" : "neutral"}>
                        {role.name}
                      </Badge>
                    ))}
                  </div>
                ),
              },
              {
                key: "status",
                header: t("admin.statusColumn"),
                renderCell: (user) => (
                  <Badge tone={statusToneOf(user.status)} dot>
                    {t(`admin.status${user.status}` as never) || user.status}
                  </Badge>
                ),
              },
              {
                key: "createdAt",
                header: t("admin.createdColumn"),
                hideOnMobile: true,
                renderCell: (user) => (
                  <span className="text-[13px] text-[#8a8786]">{formatDateTime(user.createdAt)}</span>
                ),
              },
              {
                key: "actions",
                header: t("common.actions"),
                isAction: true,
                renderCell: (user) => (
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => openRolesEditor(user)}
                      title={t("admin.editRoles")}
                      aria-label={t("admin.editRoles")}
                    >
                      <span className="material-symbols-outlined text-[19px]">badge</span>
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${user.status === "Active" ? "btn-ghost text-[#b90014]" : "btn-secondary"}`}
                      onClick={() => setStatusTarget(user)}
                      title={user.status === "Active" ? t("admin.deactivate") : t("admin.activate")}
                      aria-label={user.status === "Active" ? t("admin.deactivate") : t("admin.activate")}
                    >
                      <span className="material-symbols-outlined text-[19px]">
                        {user.status === "Active" ? "person_off" : "how_to_reg"}
                      </span>
                    </button>
                  </div>
                ),
              },
            ]}
          />
        </div>
      )}

      {/* Status change confirmation */}
      <ConfirmModal
        open={statusTarget != null}
        title={
          statusTarget?.status === "Active"
            ? t("admin.deactivateTitle")
            : t("admin.activateTitle")
        }
        danger={statusTarget?.status === "Active"}
        busy={busy}
        confirmLabel={statusTarget?.status === "Active" ? t("admin.deactivate") : t("admin.activate")}
        onConfirm={confirmStatusChange}
        onClose={() => setStatusTarget(null)}
      >
        {statusTarget?.status === "Active"
          ? t("admin.deactivateBody", { name: statusTarget?.fullName ?? "" })
          : t("admin.activateBody", { name: statusTarget?.fullName ?? "" })}
      </ConfirmModal>

      {/* Role assignment editor */}
      <ConfirmModal
        open={rolesTarget != null}
        title={t("admin.editRolesTitle", { name: rolesTarget?.fullName ?? "" })}
        busy={busy}
        confirmLabel={t("common.save")}
        onConfirm={confirmRolesChange}
        onClose={() => setRolesTarget(null)}
      >
        <p className="mb-3 text-[13px] text-[#8a8786]">{t("admin.editRolesHelp")}</p>
        <div className="flex flex-col gap-2">
          {roles.map((role) => (
            <label
              key={role.id}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-[10px] border border-[#e7ded9] px-3 py-2.5"
            >
              <span className="flex items-center gap-2 text-[14px] text-[#1a1c1c]">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#b90014]"
                  checked={roleDraft.has(role.id)}
                  onChange={() =>
                    setRoleDraft((current) => {
                      const next = new Set(current);
                      if (next.has(role.id)) next.delete(role.id);
                      else next.add(role.id);
                      return next;
                    })
                  }
                />
                {role.name}
              </span>
              {role.isSystemAdmin ? (
                <Badge tone="brand" icon="shield_person">
                  {t("admin.adminRole")}
                </Badge>
              ) : null}
            </label>
          ))}
        </div>
        {grantingAdminRole ? (
          <p className="mt-3 flex items-start gap-2 rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] leading-5 text-amber-800">
            <span className="material-symbols-outlined text-[18px]">warning</span>
            {t("admin.grantAdminRoleWarning")}
          </p>
        ) : null}
      </ConfirmModal>
    </div>
  );
}

export default UserManagementScreen;
