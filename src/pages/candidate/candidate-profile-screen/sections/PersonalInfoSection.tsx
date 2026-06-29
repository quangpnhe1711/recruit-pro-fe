import type { ValidationErrors } from "../../../../common/validation/formValidation";
import type { ProfileState } from "../types";

type PersonalInfoSectionProps = {
  profile: ProfileState;
  isEditingProfile: boolean;
  canEditProfile: boolean;
  onProfileChange: (field: keyof ProfileState, value: string) => void;
  errors: ValidationErrors;
};

function PersonalInfoSection({
  profile,
  isEditingProfile,
  canEditProfile,
  onProfileChange,
  errors,
}: PersonalInfoSectionProps) {
  return (
    <section id="resume" className="card p-5 md:p-6">
      <div className="border-b border-[#f0eceb] pb-4">
        <h2 className="section-title">Thông tin cá nhân</h2>
        <p className="page-subtitle">Giới thiệu và các liên kết nghề nghiệp của bạn.</p>
      </div>

      <div className="mt-5 space-y-5">
        <div>
          <label className="field-label">Giới thiệu</label>
          {isEditingProfile && canEditProfile ? (
            <textarea
              className={`input-field min-h-[120px] resize-none ${errors.bio ? "border-[#ba1a1a]" : ""}`}
              value={profile.bio}
              onChange={(e) => onProfileChange("bio", e.target.value)}
            />
          ) : (
            <p className="rounded-[12px] bg-[#f7f6f5] p-4 text-[14px] leading-6 text-[#5f5e5e]">
              {profile.bio}
            </p>
          )}
          {errors.bio ? (
            <p className="mt-1.5 text-[12px] text-[#ba1a1a]">{errors.bio}</p>
          ) : null}
        </div>

        <div>
          <label className="field-label">Liên kết</label>
          <div className="space-y-3">
            <div className="flex h-11 items-center gap-3 rounded-[10px] border border-[#dcd7d5] bg-white px-3.5 transition-all focus-within:border-[#b90014] focus-within:ring-4 focus-within:ring-[#b90014]/10">
              <span className="material-symbols-outlined text-[20px] text-[#8a8786]">link</span>
              <input
                className="flex-1 border-none bg-transparent p-0 text-[14px] text-[#1a1c1c] outline-none placeholder:text-[#a8a4a2]"
                value={profile.github}
                onChange={(e) => onProfileChange("github", e.target.value)}
                type="text"
                disabled={!canEditProfile}
              />
            </div>
            {errors.github ? (
              <p className="text-[12px] text-[#ba1a1a]">{errors.github}</p>
            ) : null}
            <div className="flex h-11 items-center gap-3 rounded-[10px] border border-[#dcd7d5] bg-white px-3.5 transition-all focus-within:border-[#b90014] focus-within:ring-4 focus-within:ring-[#b90014]/10">
              <span className="material-symbols-outlined text-[20px] text-[#8a8786]">group</span>
              <input
                className="flex-1 border-none bg-transparent p-0 text-[14px] text-[#1a1c1c] outline-none placeholder:text-[#a8a4a2]"
                value={profile.linkedin}
                onChange={(e) => onProfileChange("linkedin", e.target.value)}
                type="text"
                disabled={!canEditProfile}
              />
            </div>
            {errors.linkedin ? (
              <p className="text-[12px] text-[#ba1a1a]">{errors.linkedin}</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export default PersonalInfoSection;
