import SkillPicker from "../../../../common/components/SkillPicker";
import { useI18n } from "../../../../i18n";
import type { SkillItem, SkillOption } from "../types";

type SkillsSectionProps = {
  canManageSkills: boolean;
  skills: SkillItem[];
  skillOptions: SkillOption[];
  onAddSkill: (skillId: string) => void;
  onRemoveSkill: (skillId: string) => void;
  onSkillYearsChange: (skillId: string, value: string) => void;
};

function SkillsSection({
  canManageSkills,
  skills,
  skillOptions,
  onAddSkill,
  onRemoveSkill,
  onSkillYearsChange,
}: SkillsSectionProps) {
  const { t } = useI18n();
  return (
    <section className="card p-5 md:p-6">
      <div className="mb-5 border-b border-[#f0eceb] pb-4">
        <h2 className="section-title">{t("candidateProfileView.skills")}</h2>
        <p className="page-subtitle">{t("candidateProfile.skills.yearsHelp")}</p>
      </div>

      {canManageSkills ? (
        <div className="space-y-4">
          <SkillPicker
            emptyLabel={t("candidateProfile.skills.emptyLabel")}
            options={skillOptions}
            placeholder={t("candidateProfile.skills.placeholder")}
            selectedLabelByValue={skills.reduce<Record<string, string>>(
              (acc, skill) => {
                acc[skill.id] = skill.label;
                return acc;
              },
              {},
            )}
            selectedValues={skills.filter((skill) => skill.active).map((skill) => skill.id)}
            onAdd={onAddSkill}
            onRemove={onRemoveSkill}
          />

          {skills.filter((skill) => skill.active).length ? (
            <div className="space-y-3">
              {skills
                .filter((skill) => skill.active)
                .map((skill) => (
                  <div
                    key={skill.id}
                    className="flex flex-col gap-3 rounded-[12px] border border-[#ececec] bg-[#f7f6f5] px-4 py-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="text-[14px] font-semibold text-[#1a1c1c]">
                        {skill.label}
                      </p>
                      <p className="text-[12px] text-[#8a8786]">
                        {t("candidateProfile.skills.yearsLabel")}
                      </p>
                    </div>
                    <input
                      className="input-field h-11 md:w-[180px]"
                      inputMode="decimal"
                      placeholder={t("candidateProfile.skills.exampleYears")}
                      type="text"
                      value={skill.yearsOfExperience ?? ""}
                      onChange={(e) => onSkillYearsChange(skill.id, e.target.value)}
                    />
                  </div>
                ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {skills
            .filter((skill) => skill.active)
            .map((skill) => (
              <span key={skill.id} className="badge bg-[#b90014]/10 text-[#b90014]">
                {skill.label}
                {skill.yearsOfExperience != null
                  ? ` • ${t("candidateProfile.parsePreview.years", { count: skill.yearsOfExperience })}`
                  : ""}
              </span>
            ))}
        </div>
      )}
    </section>
  );
}

export default SkillsSection;
