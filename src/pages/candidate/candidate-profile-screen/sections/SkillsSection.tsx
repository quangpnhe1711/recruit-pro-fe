import SkillPicker from "../../../../common/components/SkillPicker";
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
  return (
    <section className="rounded-lg border border-[#e2dfde] bg-white p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="border-l-4 border-[#b90014] pl-4 text-[20px] font-semibold">
          Skills
        </h2>
      </div>

      {canManageSkills ? (
        <div className="space-y-4">
          <SkillPicker
            emptyLabel="Chọn kỹ năng từ hệ thống để thêm vào hồ sơ."
            options={skillOptions}
            placeholder="Chọn kỹ năng từ danh sách"
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
                    className="flex flex-col gap-3 rounded border border-[#e2dfde] bg-[#f9f9f9] px-4 py-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="text-[14px] font-semibold text-[#1a1c1c]">
                        {skill.label}
                      </p>
                      <p className="text-[12px] text-[#5f5e5e]">
                        Số năm kinh nghiệm cho kỹ năng này
                      </p>
                    </div>
                    <input
                      className="w-full rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c] md:w-[180px]"
                      inputMode="decimal"
                      placeholder="VD: 1.5"
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
              <span
                key={skill.id}
                className="inline-flex items-center gap-2 rounded-full border border-[#b90014]/20 bg-[#b90014]/10 px-3 py-1 text-[12px] font-semibold text-[#b90014]"
              >
                {skill.label}
                {skill.yearsOfExperience != null ? ` • ${skill.yearsOfExperience} năm` : ""}
              </span>
            ))}
        </div>
      )}
    </section>
  );
}

export default SkillsSection;
