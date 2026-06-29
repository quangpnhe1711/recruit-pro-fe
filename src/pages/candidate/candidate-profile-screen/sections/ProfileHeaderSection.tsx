import type { Dispatch, SetStateAction } from "react";
import type { ValidationErrors } from "../../../../common/validation/formValidation";
import type { ProfileState } from "../types";

type ProfileHeaderSectionProps = {
  profile: ProfileState;
  displayAvatarUrl: string | null;
  profileInitials: string;
  completionScore: number;
  isEditingProfile: boolean;
  canEditProfile: boolean;
  isSavingProfile: boolean;
  isProfileDirty: boolean;
  hasPendingResumeUpload: boolean;
  onSave: () => void;
  setIsEditingProfile: Dispatch<SetStateAction<boolean>>;
  onProfileChange: (field: keyof ProfileState, value: string) => void;
  errors: ValidationErrors;
};

function ProfileHeaderSection({
  profile,
  displayAvatarUrl,
  profileInitials,
  completionScore,
  isEditingProfile,
  canEditProfile,
  isSavingProfile,
  isProfileDirty,
  hasPendingResumeUpload,
  onSave,
  setIsEditingProfile,
  onProfileChange,
  errors,
}: ProfileHeaderSectionProps) {
  return (
    <section
      id="profile"
      className="card animate-fade-in-up relative mb-6 overflow-hidden p-5 md:p-8"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(232,36,44,0.10),transparent_70%)]"
      />

      <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="relative shrink-0">
            {displayAvatarUrl ? (
              <img
                alt={profile.name}
                className="h-24 w-24 rounded-[20px] object-cover ring-2 ring-white shadow-[0_10px_30px_-10px_rgba(185,0,20,0.35)] md:h-28 md:w-28"
                src={displayAvatarUrl}
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,#e8242c_0%,#c50f1b_100%)] text-[30px] font-bold text-white shadow-[0_10px_30px_-10px_rgba(185,0,20,0.45)] md:h-28 md:w-28 md:text-[34px]">
                {profileInitials}
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-3">
            <div className="space-y-2">
              {isEditingProfile && canEditProfile ? (
                <input
                  className={`input-field max-w-xl text-[24px] font-semibold leading-tight tracking-[-0.01em] md:text-[28px] ${errors.name ? "border-[#ba1a1a]" : ""}`}
                  value={profile.name}
                  onChange={(e) => onProfileChange("name", e.target.value)}
                />
              ) : (
                <h2 className="text-[24px] font-semibold leading-tight tracking-[-0.02em] text-[#1a1c1c] md:text-[30px]">
                  {profile.name}
                </h2>
              )}
              {errors.name ? (
                <p className="text-[12px] text-[#ba1a1a]">{errors.name}</p>
              ) : null}
              {isEditingProfile && canEditProfile ? (
                <input
                  className={`input-field max-w-xl text-[16px] font-semibold text-[#b90014] ${errors.headline ? "border-[#ba1a1a]" : ""}`}
                  value={profile.headline}
                  onChange={(e) => onProfileChange("headline", e.target.value)}
                />
              ) : (
                <p className="text-[16px] font-semibold text-[#b90014] md:text-[18px]">
                  {profile.headline}
                </p>
              )}
              {errors.headline ? (
                <p className="text-[12px] text-[#ba1a1a]">{errors.headline}</p>
              ) : null}
              <span className="badge bg-[#b90014]/10 text-[#b90014]">
                <span className="badge-dot bg-[#b90014]" />
                Hoàn thiện hồ sơ {completionScore}%
              </span>
            </div>

            {isEditingProfile && canEditProfile ? (
              <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
                <div>
                  <label className="field-label">Tên đăng nhập</label>
                  <input
                    className="input-field bg-[#f7f6f5] text-[#5f5e5e]"
                    value={profile.username}
                    readOnly
                    disabled
                  />
                </div>
                <div>
                  <label className="field-label">Email</label>
                  <input
                    className={`input-field ${errors.email ? "border-[#ba1a1a]" : ""}`}
                    value={profile.email}
                    onChange={(e) => onProfileChange("email", e.target.value)}
                  />
                  {errors.email ? (
                    <p className="mt-1.5 text-[12px] text-[#ba1a1a]">{errors.email}</p>
                  ) : null}
                </div>
                <div>
                  <label className="field-label">Số điện thoại</label>
                  <input
                    className={`input-field ${errors.phone ? "border-[#ba1a1a]" : ""}`}
                    value={profile.phone}
                    onChange={(e) => onProfileChange("phone", e.target.value)}
                  />
                  {errors.phone ? (
                    <p className="mt-1.5 text-[12px] text-[#ba1a1a]">{errors.phone}</p>
                  ) : null}
                </div>
                <div>
                  <label className="field-label">Địa điểm</label>
                  <input
                    className={`input-field ${errors.location ? "border-[#ba1a1a]" : ""}`}
                    value={profile.location}
                    onChange={(e) => onProfileChange("location", e.target.value)}
                  />
                  {errors.location ? (
                    <p className="mt-1.5 text-[12px] text-[#ba1a1a]">{errors.location}</p>
                  ) : null}
                </div>
                <div>
                  <label className="field-label">Thành viên từ</label>
                  <input
                    className="input-field"
                    value={profile.memberSince}
                    onChange={(e) => onProfileChange("memberSince", e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] text-[#5f5e5e]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-[#8a8786]">alternate_email</span>
                  {profile.username}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-[#8a8786]">mail</span>
                  {profile.email}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-[#8a8786]">call</span>
                  {profile.phone}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-[#8a8786]">location_on</span>
                  {profile.location}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-[#8a8786]">schedule</span>
                  {profile.memberSince}
                </span>
              </div>
            )}
          </div>
        </div>

        {canEditProfile ? (
          <div className="flex shrink-0 flex-col gap-2.5 sm:flex-row md:flex-col lg:flex-row">
            <button
              className="btn btn-primary h-11"
              type="button"
              onClick={onSave}
              disabled={isSavingProfile || (!isProfileDirty && !hasPendingResumeUpload)}
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              {isSavingProfile ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
            <button
              className="btn btn-secondary h-11"
              type="button"
              onClick={() => setIsEditingProfile((value) => !value)}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isEditingProfile ? "check" : "edit"}
              </span>
              {isEditingProfile ? "Xong" : "Chỉnh sửa hồ sơ"}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default ProfileHeaderSection;
              {errors.headline ? (
                <p className="text-[12px] text-[#ba1a1a]">{errors.headline}</p>
              ) : null}
