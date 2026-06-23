import type { ProfileState } from "../types";

type PersonalInfoSectionProps = {
  profile: ProfileState;
  isEditingProfile: boolean;
  canEditProfile: boolean;
  onProfileChange: (field: keyof ProfileState, value: string) => void;
};

function PersonalInfoSection({
  profile,
  isEditingProfile,
  canEditProfile,
  onProfileChange,
}: PersonalInfoSectionProps) {
  return (
    <section
      id="resume"
      className="rounded-lg border border-[#e2dfde] bg-white p-6"
    >
      <h2 className="border-l-4 border-[#b90014] pl-4 text-[20px] font-semibold">
        Thông tin cá nhân
      </h2>

      <div className="mt-6 space-y-4">
        <div>
          <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5f5e5e]">
            Giới thiệu
          </label>
          {isEditingProfile && canEditProfile ? (
            <textarea
              className="min-h-[120px] w-full resize-none rounded-none border border-[#e2dfde] bg-[#f3f3f3] p-3 text-[14px] outline-none transition-colors focus:border-[#1a1c1c]"
              value={profile.bio}
              onChange={(e) => onProfileChange("bio", e.target.value)}
            />
          ) : (
            <p className="rounded border border-[#e2dfde] bg-[#f3f3f3] p-3 text-[14px] leading-6 text-[#5f5e5e]">
              {profile.bio}
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5f5e5e]">
            Liên kết
          </label>
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded border border-[#e2dfde] bg-white px-3 py-2">
              <span className="material-symbols-outlined text-[#5f5e5e]">link</span>
              <input
                className="flex-1 border-none bg-transparent p-0 text-[14px] outline-none"
                value={profile.github}
                onChange={(e) => onProfileChange("github", e.target.value)}
                type="text"
                disabled={!canEditProfile}
              />
            </div>
            <div className="flex items-center gap-3 rounded border border-[#e2dfde] bg-white px-3 py-2">
              <span className="material-symbols-outlined text-[#5f5e5e]">group</span>
              <input
                className="flex-1 border-none bg-transparent p-0 text-[14px] outline-none"
                value={profile.linkedin}
                onChange={(e) => onProfileChange("linkedin", e.target.value)}
                type="text"
                disabled={!canEditProfile}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PersonalInfoSection;
