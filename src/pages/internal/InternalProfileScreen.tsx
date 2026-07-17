import { useEffect, useState } from "react";
import { appToast, handleNonFormApiError } from "../../common/utils/appToast";
import { applyApiFormError } from "../../common/utils/formErrors";
import { Skeleton } from "../../common/components/Skeleton";
import { useI18n } from "../../i18n";
import { useAppDispatch, useAppSelector } from "../../store/hook";
import { updateUser } from "../../store/slices/authSlice";
import {
  internalProfileService,
  type InternalProfileDto,
} from "../../services/internal/internalProfileService";

function InternalProfileScreen() {
  const { t } = useI18n();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);

  const [profile, setProfile] = useState<InternalProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [fullNameError, setFullNameError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setLoadFailed(false);
      try {
        const res = await internalProfileService.getProfile();
        if (!active) return;
        if (res.data) {
          setProfile(res.data);
          setFullName(res.data.fullName);
          setPhone(res.data.phone ?? "");
        } else {
          setLoadFailed(true);
        }
      } catch (error) {
        if (!active) return;
        setLoadFailed(true);
        handleNonFormApiError(error);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  function startEdit() {
    if (!profile) return;
    setFullName(profile.fullName);
    setPhone(profile.phone ?? "");
    setFullNameError("");
    setEditing(true);
  }

  function cancelEdit() {
    if (!profile) return;
    setFullName(profile.fullName);
    setPhone(profile.phone ?? "");
    setFullNameError("");
    setEditing(false);
  }

  async function handleSave() {
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setFullNameError(t("internalProfile.fullNameRequired"));
      return;
    }
    setFullNameError("");
    setSaving(true);
    try {
      const res = await internalProfileService.updateProfile({
        fullName: trimmedName,
        phone: phone.trim() ? phone.trim() : null,
      });
      const updated = res.data;
      if (updated) {
        setProfile(updated);
        setFullName(updated.fullName);
        setPhone(updated.phone ?? "");
        // Keep the cached identity (nav name, avatar menu) in sync — spread the existing user so
        // permissions/roles are preserved, override only what changed.
        if (currentUser) {
          dispatch(
            updateUser({
              ...currentUser,
              fullName: updated.fullName,
              phone: updated.phone,
            }),
          );
        }
      }
      setEditing(false);
      appToast.success(t("internalProfile.saved"));
    } catch (error) {
      const handled = applyApiFormError(error, {
        setFieldError: (field, message) => {
          if (field === "fullName") setFullNameError(message);
        },
        knownFields: ["fullName", "phone"],
      });
      if (!handled) handleNonFormApiError(error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="app-container space-y-6 py-8">
        <Skeleton className="h-8 w-64" />
        <div className="surface-card space-y-4 p-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
        </div>
      </div>
    );
  }

  if (loadFailed || !profile) {
    return (
      <div className="app-container py-10">
        <div className="surface-card p-8 text-center">
          <span className="material-symbols-outlined mb-3 text-[32px] text-[#b90014]">
            error
          </span>
          <p className="text-[15px] text-[#5f5e5e]">{t("internalProfile.loadFailed")}</p>
        </div>
      </div>
    );
  }

  const joined = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString()
    : "—";
  const roleLabel =
    profile.roles.map((role) => role.name).join(", ") || "—";

  return (
    <div className="app-container space-y-6 py-8">
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#b90014]">
          {t("internalProfile.eyebrow")}
        </p>
        <h1 className="page-title mt-1">{t("internalProfile.title")}</h1>
      </div>

      {/* Account info (read-only) */}
      <section className="surface-card p-6">
        <h2 className="section-title mb-4">{t("internalProfile.accountInfo")}</h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="field-label">{t("internalProfile.username")}</dt>
            <dd className="mt-1 text-[14px] text-[#1a1c1c]">{profile.username}</dd>
          </div>
          <div>
            <dt className="field-label">{t("internalProfile.email")}</dt>
            <dd className="mt-1 text-[14px] text-[#1a1c1c]">{profile.email}</dd>
          </div>
          <div>
            <dt className="field-label">{t("internalProfile.role")}</dt>
            <dd className="mt-1 text-[14px] text-[#1a1c1c]">{roleLabel}</dd>
          </div>
          <div>
            <dt className="field-label">{t("internalProfile.status")}</dt>
            <dd className="mt-1 text-[14px] text-[#1a1c1c]">{profile.status}</dd>
          </div>
          <div>
            <dt className="field-label">{t("internalProfile.joined")}</dt>
            <dd className="mt-1 text-[14px] text-[#1a1c1c]">{joined}</dd>
          </div>
        </dl>
      </section>

      {/* Editable info */}
      <section className="surface-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-title">{t("internalProfile.editableInfo")}</h2>
          {!editing ? (
            <button type="button" className="btn btn-secondary" onClick={startEdit}>
              {t("internalProfile.edit")}
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="internal-fullName">
              {t("internalProfile.fullName")}
            </label>
            <input
              id="internal-fullName"
              type="text"
              value={fullName}
              disabled={!editing || saving}
              onChange={(event) => {
                setFullName(event.target.value);
                if (fullNameError) setFullNameError("");
              }}
              className={`input-field h-12 ${fullNameError ? "border-[#ba1a1a]" : ""}`}
            />
            {fullNameError ? (
              <p className="mt-1.5 text-[12px] text-[#ba1a1a]">{fullNameError}</p>
            ) : null}
          </div>
          <div>
            <label className="field-label" htmlFor="internal-phone">
              {t("internalProfile.phone")}
            </label>
            <input
              id="internal-phone"
              type="tel"
              value={phone}
              disabled={!editing || saving}
              onChange={(event) => setPhone(event.target.value)}
              className="input-field h-12"
            />
          </div>
        </div>

        {editing ? (
          <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={cancelEdit}
              disabled={saving}
            >
              {t("internalProfile.cancel")}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? t("common.processing") : t("internalProfile.save")}
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default InternalProfileScreen;
