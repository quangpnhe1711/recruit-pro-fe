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
    <section className="card p-5 md:p-6">
      <div className="mb-5 border-b border-[#f0eceb] pb-4">
        <h2 className="section-title">Skills</h2>
        <p className="page-subtitle">Kỹ năng và số năm kinh nghiệm tương ứng.</p>
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
                    className="flex flex-col gap-3 rounded-[12px] border border-[#ececec] bg-[#f7f6f5] px-4 py-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="text-[14px] font-semibold text-[#1a1c1c]">
                        {skill.label}
                      </p>
                      <p className="text-[12px] text-[#8a8786]">
                        Số năm kinh nghiệm cho kỹ năng này
                      </p>
                    </div>
                    <input
                      className="input-field h-11 md:w-[180px]"
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
              <span key={skill.id} className="badge bg-[#b90014]/10 text-[#b90014]">
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
