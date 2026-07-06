import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../common/components/PageHeader";
import Badge from "../../common/components/Badge";
import { SkeletonGrid } from "../../common/components/Skeleton";
import { listRoles } from "../../services/system-admin/adminService";
import type { RbacRoleDto } from "../../modules/system-admin/adminSchema";
import { useI18n } from "../../i18n";
import { ErrorState } from "./automationUi";

/**
 * System Admin → Roles: a readable catalog of the five system roles. Role NAMES are part of the
 * auth contract (JWT role claims + [Authorize] attributes), so they are fixed by the system —
 * what each role can DO is managed in the RBAC permission matrix, linked from every card.
 */
function RoleManagementScreen() {
  const { t } = useI18n();
  const [roles, setRoles] = useState<RbacRoleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listRoles()
      .then(setRoles)
      .catch(() => setError(t("common.loadFailed")))
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => load(), [load]);

  return (
    <div className="sysadmin-page animate-fade-in">
      <PageHeader
        icon="verified_user"
        eyebrow={t("admin.consoleEyebrow")}
        title={t("admin.rolesTitle")}
        subtitle={t("admin.rolesSubtitle")}
        actions={
          <Link to="/system-admin/permissions" className="btn btn-primary">
            {t("admin.openRbac")}
          </Link>
        }
      />

      <div className="mt-5 flex items-start gap-2.5 rounded-[12px] border border-[#e7ded9] bg-[#faf6f3] px-4 py-3 text-[13px] leading-5 text-[#3a3a3a]">
        <span className="material-symbols-outlined text-[18px] text-[#b90014]">info</span>
        {t("admin.rolesFixedNote")}
      </div>

      {loading ? (
        <div className="mt-6">
          <SkeletonGrid count={5} />
        </div>
      ) : error ? (
        <div className="mt-6">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {roles.map((role) => (
            <article key={role.id} className="card flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-[16px] font-semibold text-[#1a1c1c]">{role.name}</h2>
                {role.isSystemAdmin ? (
                  <Badge tone="brand" icon="shield_person">
                    {t("admin.adminRole")}
                  </Badge>
                ) : null}
              </div>
              <p className="min-h-10 text-[13px] leading-5 text-[#8a8786]">
                {role.description || t("admin.noRoleDescription")}
              </p>
              <div className="flex items-center gap-4 text-[13px] text-[#3a3a3a]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-[#a8a4a2]">group</span>
                  {t("admin.roleUserCount", { count: String(role.userCount) })}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-[#a8a4a2]">key</span>
                  {t("admin.rolePermissionCount", { count: String(role.permissionCount) })}
                </span>
              </div>
              <div className="mt-auto flex gap-2 pt-1">
                <Link
                  to={`/system-admin/permissions?role=${role.id}`}
                  className="btn btn-secondary btn-sm flex-1 justify-center"
                >
                  <span className="material-symbols-outlined text-[18px]">lock_person</span>
                  {t("admin.editPermissions")}
                </Link>
                <Link
                  to={`/system-admin/users?roleId=${role.id}`}
                  className="btn btn-ghost btn-sm"
                  title={t("admin.viewMembers")}
                  aria-label={t("admin.viewMembers")}
                >
                  <span className="material-symbols-outlined text-[18px]">group</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default RoleManagementScreen;
