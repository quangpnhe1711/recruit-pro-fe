import type { Dispatch, SetStateAction } from "react";
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
}: ProfileHeaderSectionProps) {
  return (
    <section
      id="profile"
      className="relative mb-6 overflow-hidden rounded-xl border border-[#e2dfde] bg-white p-6 md:p-8"
    >
      <div className="mb-6 flex flex-col gap-3 md:absolute md:right-6 md:top-6 md:flex-row">
        {canEditProfile ? (
          <button
            className="inline-flex items-center justify-center gap-2 rounded bg-[#b90014] px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={onSave}
            disabled={isSavingProfile || (!isProfileDirty && !hasPendingResumeUpload)}
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            {isSavingProfile ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        ) : null}
        {canEditProfile ? (
          <button
            className="rounded border border-[#1a1c1c] bg-white px-4 py-2 text-[12px] font-semibold text-[#1a1c1c] transition-colors hover:bg-[#f3f3f3]"
            type="button"
            onClick={() => setIsEditingProfile((value) => !value)}
          >
            {isEditingProfile ? "Xong" : "Chỉnh sửa hồ sơ"}
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-8 md:flex-row md:items-start">
        <div className="relative">
          {displayAvatarUrl ? (
            <img
              alt={profile.name}
              className="h-32 w-32 rounded-lg border-2 border-[#b90014] object-cover"
              src={displayAvatarUrl}
            />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-lg border-2 border-[#b90014] bg-[#b90014]/10 text-[32px] font-bold text-[#b90014]">
              {profileInitials}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            {isEditingProfile && canEditProfile ? (
              <input
                className="w-full max-w-2xl rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[32px] font-semibold leading-10 tracking-[-0.01em] outline-none focus:border-[#1a1c1c]"
                value={profile.name}
                onChange={(e) => onProfileChange("name", e.target.value)}
              />
            ) : (
              <h1 className="text-[32px] font-semibold leading-10 tracking-[-0.01em]">
                {profile.name}
              </h1>
            )}
            <div className="mt-2 inline-flex rounded-full bg-[#b90014]/10 px-3 py-1 text-[12px] font-semibold text-[#b90014]">
              Hoàn thiện hồ sơ {completionScore}%
            </div>
            {isEditingProfile && canEditProfile ? (
              <input
                className="mt-1 w-full max-w-2xl rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[20px] font-semibold text-[#b90014] outline-none focus:border-[#1a1c1c]"
                value={profile.headline}
                onChange={(e) => onProfileChange("headline", e.target.value)}
              />
            ) : (
              <p className="mt-1 text-[20px] font-semibold text-[#b90014]">
                {profile.headline}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {isEditingProfile && canEditProfile ? (
              <>
                <input
                  className="rounded-none border border-[#e2dfde] bg-[#f3f3f3] px-3 py-2 text-[14px] text-[#5f5e5e] outline-none"
                  value={profile.username}
                  readOnly
                  disabled
                />
                <input
                  className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                  value={profile.email}
                  onChange={(e) => onProfileChange("email", e.target.value)}
                />
                <input
                  className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                  value={profile.phone}
                  onChange={(e) => onProfileChange("phone", e.target.value)}
                />
                <input
                  className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                  value={profile.location}
                  onChange={(e) => onProfileChange("location", e.target.value)}
                />
                <input
                  className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                  value={profile.memberSince}
                  onChange={(e) => onProfileChange("memberSince", e.target.value)}
                />
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-[#5f5e5e]">
                  <span className="material-symbols-outlined text-[20px]">alternate_email</span>
                  <span className="text-[14px]">{profile.username}</span>
                </div>
                <div className="flex items-center gap-2 text-[#5f5e5e]">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                  <span className="text-[14px]">{profile.email}</span>
                </div>
                <div className="flex items-center gap-2 text-[#5f5e5e]">
                  <span className="material-symbols-outlined text-[20px]">call</span>
                  <span className="text-[14px]">{profile.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-[#5f5e5e]">
                  <span className="material-symbols-outlined text-[20px]">location_on</span>
                  <span className="text-[14px]">{profile.location}</span>
                </div>
                <div className="flex items-center gap-2 text-[#5f5e5e]">
                  <span className="material-symbols-outlined text-[20px]">schedule</span>
                  <span className="text-[14px]">{profile.memberSince}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProfileHeaderSection;
