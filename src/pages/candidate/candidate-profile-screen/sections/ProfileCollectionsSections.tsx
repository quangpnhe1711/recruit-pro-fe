import CommonSelect from "../../../../common/components/CommonSelect";
import type { Dispatch, SetStateAction } from "react";
import type {
  CandidateSection,
  CustomSectionDraft,
  CustomSectionItemDraft,
  EducationDraft,
  LanguageDraft,
  ProjectDraft,
  CandidateProjectItem,
  CandidateEducationItem,
  CandidateCertificationItem,
  CandidateLanguageItem,
} from "../types";
import { emptyCustomSectionItemDraft, monthOptions } from "../utils";

type SharedEditProps = {
  canEditProfile: boolean;
};

type ProjectsSectionProps = SharedEditProps & {
  showProjectComposer: boolean;
  setShowProjectComposer: Dispatch<SetStateAction<boolean>>;
  projectDraft: ProjectDraft;
  setProjectDraft: Dispatch<SetStateAction<ProjectDraft>>;
  projects: CandidateProjectItem[];
  onAddProject: () => void;
  onRemoveProject: (projectId: string) => void;
};

export function ProjectsSection({
  canEditProfile,
  showProjectComposer,
  setShowProjectComposer,
  projectDraft,
  setProjectDraft,
  projects,
  onAddProject,
  onRemoveProject,
}: ProjectsSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="border-l-4 border-[#b90014] pl-4 text-[20px] font-semibold">
          Dự án
        </h2>
        {canEditProfile ? (
          <button
            className="text-[12px] font-semibold text-[#b90014] hover:underline"
            type="button"
            onClick={() => setShowProjectComposer((value) => !value)}
          >
            {showProjectComposer ? "Đóng" : "Thêm mục"}
          </button>
        ) : null}
      </div>
      {showProjectComposer && canEditProfile ? (
        <div className="mt-4 space-y-3 rounded border border-[#e2dfde] bg-[#f9f4f4] p-4">
          <input
            className="w-full rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
            placeholder="Tên dự án"
            value={projectDraft.name}
            onChange={(e) =>
              setProjectDraft((prev) => ({ ...prev, name: e.target.value }))
            }
          />
          <input
            className="w-full rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
            placeholder="Vai trò"
            value={projectDraft.role}
            onChange={(e) =>
              setProjectDraft((prev) => ({ ...prev, role: e.target.value }))
            }
          />
          <textarea
            className="min-h-[90px] w-full rounded-none border border-[#e2dfde] bg-white p-3 text-[14px] outline-none focus:border-[#1a1c1c]"
            placeholder="Mô tả dự án"
            value={projectDraft.description}
            onChange={(e) =>
              setProjectDraft((prev) => ({ ...prev, description: e.target.value }))
            }
          />
          <input
            className="w-full rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
            placeholder="Công nghệ, phân tách bằng dấu phẩy"
            value={projectDraft.technologies}
            onChange={(e) =>
              setProjectDraft((prev) => ({ ...prev, technologies: e.target.value }))
            }
          />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <CommonSelect
              value={String(projectDraft.startMonth)}
              options={monthOptions.map((month, index) => ({
                label: month,
                value: String(index + 1),
              }))}
              onValueChange={(value) =>
                setProjectDraft((prev) => ({ ...prev, startMonth: Number(value) }))
              }
              className="h-11 rounded-none border border-[#e2dfde] bg-white text-[14px] shadow-none focus:border-[#1a1c1c]"
              menuClassName="border-[#e2dfde]"
            />
            <input
              className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
              type="number"
              value={projectDraft.startYear}
              onChange={(e) =>
                setProjectDraft((prev) => ({ ...prev, startYear: Number(e.target.value) }))
              }
            />
            <label className="col-span-2 flex items-center gap-2 rounded border border-[#e2dfde] bg-white px-3 py-2 text-[14px] font-semibold text-[#1a1c1c] md:col-span-1">
              <input
                checked={projectDraft.isCurrent}
                className="h-4 w-4 accent-[#b90014]"
                type="checkbox"
                onChange={(e) =>
                  setProjectDraft((prev) => ({ ...prev, isCurrent: e.target.checked }))
                }
              />
              Hiện tại
            </label>
            {projectDraft.isCurrent ? null : (
              <>
                <CommonSelect
                  value={String(projectDraft.endMonth)}
                  options={monthOptions.map((month, index) => ({
                    label: month,
                    value: String(index + 1),
                  }))}
                  onValueChange={(value) =>
                    setProjectDraft((prev) => ({ ...prev, endMonth: Number(value) }))
                  }
                  className="h-11 rounded-none border border-[#e2dfde] bg-white text-[14px] shadow-none focus:border-[#1a1c1c]"
                  menuClassName="border-[#e2dfde]"
                />
                <input
                  className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                  type="number"
                  value={projectDraft.endYear}
                  onChange={(e) =>
                    setProjectDraft((prev) => ({ ...prev, endYear: Number(e.target.value) }))
                  }
                />
              </>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button
              className="rounded border border-[#1a1c1c] px-4 py-2 text-[12px] font-semibold"
              type="button"
              onClick={() => setShowProjectComposer(false)}
            >
              Hủy
            </button>
            <button
              className="rounded bg-[#b90014] px-4 py-2 text-[12px] font-semibold text-white"
              type="button"
              onClick={onAddProject}
            >
              Thêm mục
            </button>
          </div>
        </div>
      ) : null}
      <div className="mt-4 space-y-3">
        {projects.length ? (
          projects.map((project) => (
            <div key={project.id} className="rounded border border-[#e2dfde] bg-[#f9f9f9] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[15px] font-semibold text-[#1a1c1c]">{project.name}</p>
                  <p className="mt-1 text-[13px] font-medium text-[#b90014]">
                    {project.role || "Dự án"}
                  </p>
                </div>
                {canEditProfile ? (
                  <button
                    className="text-[12px] font-semibold text-[#b90014] hover:underline"
                    type="button"
                    onClick={() => onRemoveProject(project.id)}
                  >
                    Xóa mục
                  </button>
                ) : null}
              </div>
              {project.description ? (
                <p className="mt-2 text-[13px] leading-6 text-[#5f5e5e]">{project.description}</p>
              ) : null}
              {project.technologies.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {project.technologies.map((technology) => (
                    <span
                      key={technology}
                      className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-[#1a1c1c]"
                    >
                      {technology}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <p className="text-[14px] text-[#5f5e5e]">Chưa có project nào trong hồ sơ.</p>
        )}
      </div>
    </div>
  );
}

type EducationSectionProps = SharedEditProps & {
  showEducationComposer: boolean;
  setShowEducationComposer: Dispatch<SetStateAction<boolean>>;
  educationDraft: EducationDraft;
  setEducationDraft: Dispatch<SetStateAction<EducationDraft>>;
  educations: CandidateEducationItem[];
  onAddEducation: () => void;
  onRemoveEducation: (educationId: string) => void;
};

export function EducationSection({
  canEditProfile,
  showEducationComposer,
  setShowEducationComposer,
  educationDraft,
  setEducationDraft,
  educations,
  onAddEducation,
  onRemoveEducation,
}: EducationSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="border-l-4 border-[#b90014] pl-4 text-[20px] font-semibold">
          Học vấn
        </h2>
        {canEditProfile ? (
          <button
            className="text-[12px] font-semibold text-[#b90014] hover:underline"
            type="button"
            onClick={() => setShowEducationComposer((value) => !value)}
          >
            {showEducationComposer ? "Đóng" : "Thêm mục"}
          </button>
        ) : null}
      </div>
      {showEducationComposer && canEditProfile ? (
        <div className="mt-4 space-y-3 rounded border border-[#e2dfde] bg-[#f9f4f4] p-4">
          <input
            className="w-full rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
            placeholder="Trường học"
            value={educationDraft.school}
            onChange={(e) =>
              setEducationDraft((prev) => ({ ...prev, school: e.target.value }))
            }
          />
          <input
            className="w-full rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
            placeholder="Bằng cấp"
            value={educationDraft.degree}
            onChange={(e) =>
              setEducationDraft((prev) => ({ ...prev, degree: e.target.value }))
            }
          />
          <input
            className="w-full rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
            placeholder="Chuyên ngành"
            value={educationDraft.fieldOfStudy}
            onChange={(e) =>
              setEducationDraft((prev) => ({ ...prev, fieldOfStudy: e.target.value }))
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
              placeholder="Năm bắt đầu"
              value={educationDraft.startYear}
              onChange={(e) =>
                setEducationDraft((prev) => ({ ...prev, startYear: e.target.value }))
              }
            />
            <input
              className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
              placeholder="Năm kết thúc"
              value={educationDraft.endYear}
              onChange={(e) =>
                setEducationDraft((prev) => ({ ...prev, endYear: e.target.value }))
              }
            />
          </div>
          <textarea
            className="min-h-[90px] w-full rounded-none border border-[#e2dfde] bg-white p-3 text-[14px] outline-none focus:border-[#1a1c1c]"
            placeholder="Mô tả thêm"
            value={educationDraft.description}
            onChange={(e) =>
              setEducationDraft((prev) => ({ ...prev, description: e.target.value }))
            }
          />
          <div className="flex justify-end gap-2">
            <button
              className="rounded border border-[#1a1c1c] px-4 py-2 text-[12px] font-semibold"
              type="button"
              onClick={() => setShowEducationComposer(false)}
            >
              Hủy
            </button>
            <button
              className="rounded bg-[#b90014] px-4 py-2 text-[12px] font-semibold text-white"
              type="button"
              onClick={onAddEducation}
            >
              Thêm mục
            </button>
          </div>
        </div>
      ) : null}
      <div className="mt-4 space-y-3">
        {educations.length ? (
          educations.map((education) => (
            <div key={education.id} className="rounded p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[15px] font-semibold text-[#1a1c1c]">{education.school}</p>
                  <p className="mt-1 text-[13px] font-medium text-[#b90014]">
                    {education.degree}
                    {education.fieldOfStudy ? ` • ${education.fieldOfStudy}` : ""}
                  </p>
                </div>
                {canEditProfile ? (
                  <button
                    className="text-[12px] font-semibold text-[#b90014] hover:underline"
                    type="button"
                    onClick={() => onRemoveEducation(education.id)}
                  >
                    Xóa mục
                  </button>
                ) : null}
              </div>
              <p className="text-[14px] text-[#5f5e5e]">
                {[education.startYear, education.endYear].filter(Boolean).join(" - ") ||
                  "Chưa rõ mốc thời gian"}
              </p>
              {education.description ? (
                <p className="mt-2 text-[14px] leading-6 text-[#5f5e5e]">{education.description}</p>
              ) : null}
            </div>
          ))
        ) : (
          <p className="text-[14px] text-[#5f5e5e]">Chưa có dữ liệu học vấn trong hồ sơ.</p>
        )}
      </div>
    </div>
  );
}

type CertificationsSectionProps = SharedEditProps & {
  showCertificationComposer: boolean;
  setShowCertificationComposer: Dispatch<SetStateAction<boolean>>;
  certificationDraft: {
    name: string;
    issuer: string;
    issuedOn: string;
    expiresOn: string;
    credentialId: string;
    credentialUrl: string;
  };
  setCertificationDraft: Dispatch<
    SetStateAction<{
      name: string;
      issuer: string;
      issuedOn: string;
      expiresOn: string;
      credentialId: string;
      credentialUrl: string;
    }>
  >;
  certifications: CandidateCertificationItem[];
  onAddCertification: () => void;
  onRemoveCertification: (certificationId: string) => void;
};

export function CertificationsSection({
  canEditProfile,
  showCertificationComposer,
  setShowCertificationComposer,
  certificationDraft,
  setCertificationDraft,
  certifications,
  onAddCertification,
  onRemoveCertification,
}: CertificationsSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="border-l-4 border-[#b90014] pl-4 text-[20px] font-semibold">
          Chứng chỉ
        </h2>
        {canEditProfile ? (
          <button
            className="text-[12px] font-semibold text-[#b90014] hover:underline"
            type="button"
            onClick={() => setShowCertificationComposer((value) => !value)}
          >
            {showCertificationComposer ? "Đóng" : "Thêm mục"}
          </button>
        ) : null}
      </div>
      {showCertificationComposer && canEditProfile ? (
        <div className="mt-4 space-y-3 rounded border border-[#e2dfde] bg-[#f9f4f4] p-4">
          <input
            className="w-full rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
            placeholder="Tên chứng chỉ"
            value={certificationDraft.name}
            onChange={(e) =>
              setCertificationDraft((prev) => ({ ...prev, name: e.target.value }))
            }
          />
          <input
            className="w-full rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
            placeholder="Đơn vị cấp"
            value={certificationDraft.issuer}
            onChange={(e) =>
              setCertificationDraft((prev) => ({ ...prev, issuer: e.target.value }))
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
              type="date"
              value={certificationDraft.issuedOn}
              onChange={(e) =>
                setCertificationDraft((prev) => ({ ...prev, issuedOn: e.target.value }))
              }
            />
            <input
              className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
              type="date"
              value={certificationDraft.expiresOn}
              onChange={(e) =>
                setCertificationDraft((prev) => ({ ...prev, expiresOn: e.target.value }))
              }
            />
          </div>
          <input
            className="w-full rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
            placeholder="Mã chứng chỉ"
            value={certificationDraft.credentialId}
            onChange={(e) =>
              setCertificationDraft((prev) => ({ ...prev, credentialId: e.target.value }))
            }
          />
          <input
            className="w-full rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
            placeholder="Liên kết chứng chỉ"
            value={certificationDraft.credentialUrl}
            onChange={(e) =>
              setCertificationDraft((prev) => ({ ...prev, credentialUrl: e.target.value }))
            }
          />
          <div className="flex justify-end gap-2">
            <button
              className="rounded border border-[#1a1c1c] px-4 py-2 text-[12px] font-semibold"
              type="button"
              onClick={() => setShowCertificationComposer(false)}
            >
              Hủy
            </button>
            <button
              className="rounded bg-[#b90014] px-4 py-2 text-[12px] font-semibold text-white"
              type="button"
              onClick={onAddCertification}
            >
              Thêm mục
            </button>
          </div>
        </div>
      ) : null}
      <div className="mt-4 space-y-3">
        {certifications.length ? (
          certifications.map((certification) => (
            <div key={certification.id} className="rounded border border-[#e2dfde] bg-[#f9f9f9] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[15px] font-semibold text-[#1a1c1c]">{certification.name}</p>
                  <p className="mt-1 text-[13px] text-[#5f5e5e]">
                    {certification.issuer || "Chưa rõ đơn vị cấp"}
                  </p>
                </div>
                {canEditProfile ? (
                  <button
                    className="text-[12px] font-semibold text-[#b90014] hover:underline"
                    type="button"
                    onClick={() => onRemoveCertification(certification.id)}
                  >
                    Xóa mục
                  </button>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <p className="text-[14px] text-[#5f5e5e]">Chưa có chứng chỉ trong hồ sơ.</p>
        )}
      </div>
    </div>
  );
}

type LanguagesSectionProps = SharedEditProps & {
  showLanguageComposer: boolean;
  setShowLanguageComposer: Dispatch<SetStateAction<boolean>>;
  languageDraft: LanguageDraft;
  setLanguageDraft: Dispatch<SetStateAction<LanguageDraft>>;
  languages: CandidateLanguageItem[];
  onAddLanguage: () => void;
  onRemoveLanguage: (languageId: string) => void;
};

export function LanguagesSection({
  canEditProfile,
  showLanguageComposer,
  setShowLanguageComposer,
  languageDraft,
  setLanguageDraft,
  languages,
  onAddLanguage,
  onRemoveLanguage,
}: LanguagesSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="border-l-4 border-[#b90014] pl-4 text-[20px] font-semibold">
          Ngoại ngữ
        </h2>
        {canEditProfile ? (
          <button
            className="text-[12px] font-semibold text-[#b90014] hover:underline"
            type="button"
            onClick={() => setShowLanguageComposer((value) => !value)}
          >
            {showLanguageComposer ? "Đóng" : "Thêm mục"}
          </button>
        ) : null}
      </div>
      {showLanguageComposer && canEditProfile ? (
        <div className="mt-4 space-y-3 rounded border border-[#e2dfde] bg-[#f9f4f4] p-4">
          <input
            className="w-full rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
            placeholder="Ngôn ngữ"
            value={languageDraft.name}
            onChange={(e) =>
              setLanguageDraft((prev) => ({ ...prev, name: e.target.value }))
            }
          />
          <input
            className="w-full rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
            placeholder="Trình độ"
            value={languageDraft.proficiency}
            onChange={(e) =>
              setLanguageDraft((prev) => ({ ...prev, proficiency: e.target.value }))
            }
          />
          <div className="flex justify-end gap-2">
            <button
              className="rounded border border-[#1a1c1c] px-4 py-2 text-[12px] font-semibold"
              type="button"
              onClick={() => setShowLanguageComposer(false)}
            >
              Hủy
            </button>
            <button
              className="rounded bg-[#b90014] px-4 py-2 text-[12px] font-semibold text-white"
              type="button"
              onClick={onAddLanguage}
            >
              Thêm mục
            </button>
          </div>
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {languages.length ? (
          languages.map((language) => (
            <div
              key={language.id}
              className="flex items-center gap-2 rounded-full border border-[#b90014]/20 bg-[#b90014]/10 px-3 py-1 text-[12px] font-semibold text-[#b90014]"
            >
              <span>
                {language.name} • {language.proficiency}
              </span>
              {canEditProfile ? (
                <button
                  className="text-[#b90014] hover:underline"
                  type="button"
                  onClick={() => onRemoveLanguage(language.id)}
                >
                  Xóa
                </button>
              ) : null}
            </div>
          ))
        ) : (
          <p className="text-[14px] text-[#5f5e5e]">Chưa có ngôn ngữ nào trong hồ sơ.</p>
        )}
      </div>
    </div>
  );
}

type CustomSectionsSectionProps = SharedEditProps & {
  customSections: CandidateSection[];
  showCustomSectionComposer: boolean;
  setShowCustomSectionComposer: Dispatch<SetStateAction<boolean>>;
  customSectionDraft: CustomSectionDraft;
  setCustomSectionDraft: Dispatch<SetStateAction<CustomSectionDraft>>;
  customSectionItemDrafts: Record<string, CustomSectionItemDraft>;
  openCustomSectionItemComposerId: string | null;
  setOpenCustomSectionItemComposerId: Dispatch<SetStateAction<string | null>>;
  onCustomSectionItemDraftChange: (
    sectionId: string,
    field: keyof CustomSectionItemDraft,
    value: string,
  ) => void;
  onAddCustomSection: () => void;
  onRemoveCustomSection: (sectionId: string) => void;
  onAddCustomSectionItem: (sectionId: string) => void;
  onRemoveCustomSectionItem: (sectionId: string, itemId: string) => void;
};

export function CustomSectionsSection({
  canEditProfile,
  customSections,
  showCustomSectionComposer,
  setShowCustomSectionComposer,
  customSectionDraft,
  setCustomSectionDraft,
  customSectionItemDrafts,
  openCustomSectionItemComposerId,
  setOpenCustomSectionItemComposerId,
  onCustomSectionItemDraftChange,
  onAddCustomSection,
  onRemoveCustomSection,
  onAddCustomSectionItem,
  onRemoveCustomSectionItem,
}: CustomSectionsSectionProps) {
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-3">
        <h2 className="border-l-4 border-[#b90014] pl-4 text-[20px] font-semibold">
          Mục linh hoạt
        </h2>
        {canEditProfile ? (
          <button
            className="text-[12px] font-semibold text-[#b90014] hover:underline"
            type="button"
            onClick={() => setShowCustomSectionComposer((value) => !value)}
          >
            {showCustomSectionComposer ? "Đóng" : "Thêm đầu mục lớn"}
          </button>
        ) : null}
      </div>

      {showCustomSectionComposer && canEditProfile ? (
        <div className="mt-4 grid gap-3 rounded border border-[#e2dfde] bg-[#f9f4f4] p-4 md:grid-cols-2">
          <input
            className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
            placeholder="Ví dụ: Vinh danh"
            value={customSectionDraft.title}
            onChange={(e) =>
              setCustomSectionDraft((prev) => ({ ...prev, title: e.target.value }))
            }
          />
          <input
            className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
            placeholder="Ví dụ: Thành tích"
            value={customSectionDraft.sectionType}
            onChange={(e) =>
              setCustomSectionDraft((prev) => ({ ...prev, sectionType: e.target.value }))
            }
          />
          <div className="md:col-span-2 flex justify-end gap-2">
            <button
              className="rounded border border-[#1a1c1c] px-4 py-2 text-[12px] font-semibold"
              type="button"
              onClick={() => setShowCustomSectionComposer(false)}
            >
              Hủy
            </button>
            <button
              className="rounded bg-[#b90014] px-4 py-2 text-[12px] font-semibold text-white"
              type="button"
              onClick={onAddCustomSection}
            >
              Tạo đầu mục
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-4 space-y-4">
        {customSections.length ? (
          customSections.map((section) => {
            const itemDraft = customSectionItemDrafts[section.id] ?? emptyCustomSectionItemDraft;
            const composerOpen = openCustomSectionItemComposerId === section.id;

            return (
              <div key={section.id} className="rounded border border-[#e2dfde] bg-[#fcfcfc] p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-[18px] font-semibold text-[#1a1c1c]">{section.title}</p>
                    <p className="mt-1 text-[12px] uppercase tracking-[0.06em] text-[#7a4b53]">
                      {section.sectionType}
                    </p>
                  </div>
                  {canEditProfile ? (
                    <div className="flex gap-2">
                      <button
                        className="rounded border border-[#e2dfde] px-3 py-2 text-[12px] font-semibold text-[#1a1c1c]"
                        type="button"
                        onClick={() =>
                          setOpenCustomSectionItemComposerId((prev) =>
                            prev === section.id ? null : section.id,
                          )
                        }
                      >
                        {composerOpen ? "Đóng mục con" : "Thêm mục con"}
                      </button>
                      <button
                        className="rounded border border-[#f0c9cf] bg-[#fff5f6] px-3 py-2 text-[12px] font-semibold text-[#b90014]"
                        type="button"
                        onClick={() => onRemoveCustomSection(section.id)}
                      >
                        Xóa đầu mục
                      </button>
                    </div>
                  ) : null}
                </div>

                {composerOpen && canEditProfile ? (
                  <div className="mt-4 grid gap-3 rounded border border-[#efe3e5] bg-white p-4 md:grid-cols-2">
                    <input
                      className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                      placeholder="Tiêu đề"
                      value={itemDraft.title}
                      onChange={(e) => onCustomSectionItemDraftChange(section.id, "title", e.target.value)}
                    />
                    <input
                      className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                      placeholder="Phụ đề / vai trò"
                      value={itemDraft.subtitle}
                      onChange={(e) => onCustomSectionItemDraftChange(section.id, "subtitle", e.target.value)}
                    />
                    <input
                      className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                      placeholder="Tổ chức"
                      value={itemDraft.organization}
                      onChange={(e) => onCustomSectionItemDraftChange(section.id, "organization", e.target.value)}
                    />
                    <input
                      className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                      placeholder="Mốc thời gian hiển thị"
                      value={itemDraft.dateLabel}
                      onChange={(e) => onCustomSectionItemDraftChange(section.id, "dateLabel", e.target.value)}
                    />
                    <input
                      className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                      placeholder="Địa điểm"
                      value={itemDraft.location}
                      onChange={(e) => onCustomSectionItemDraftChange(section.id, "location", e.target.value)}
                    />
                    <input
                      className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                      placeholder="Tags, phân tách bằng dấu phẩy"
                      value={itemDraft.tags}
                      onChange={(e) => onCustomSectionItemDraftChange(section.id, "tags", e.target.value)}
                    />
                    <textarea
                      className="min-h-[100px] rounded-none border border-[#e2dfde] bg-white p-3 text-[14px] outline-none focus:border-[#1a1c1c] md:col-span-2"
                      placeholder="Mô tả"
                      value={itemDraft.description}
                      onChange={(e) => onCustomSectionItemDraftChange(section.id, "description", e.target.value)}
                    />
                    <div className="md:col-span-2 flex justify-end gap-2">
                      <button
                        className="rounded border border-[#1a1c1c] px-4 py-2 text-[12px] font-semibold"
                        type="button"
                        onClick={() => setOpenCustomSectionItemComposerId(null)}
                      >
                        Hủy
                      </button>
                      <button
                        className="rounded bg-[#b90014] px-4 py-2 text-[12px] font-semibold text-white"
                        type="button"
                        onClick={() => onAddCustomSectionItem(section.id)}
                      >
                        Thêm mục
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 space-y-3">
                  {section.items.length ? (
                    section.items.map((item) => (
                      <div key={item.id} className="rounded border border-[#e2dfde] bg-white p-4">
                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-[15px] font-semibold text-[#1a1c1c]">{item.title}</p>
                            {item.subtitle ? (
                              <p className="mt-1 text-[13px] font-medium text-[#b90014]">{item.subtitle}</p>
                            ) : null}
                            {item.organization || item.dateLabel ? (
                              <p className="mt-1 text-[13px] text-[#5f5e5e]">
                                {[item.organization, item.dateLabel].filter(Boolean).join(" • ")}
                              </p>
                            ) : null}
                          </div>
                          {canEditProfile ? (
                            <button
                              className="text-[12px] font-semibold text-[#b90014]"
                              type="button"
                              onClick={() => onRemoveCustomSectionItem(section.id, item.id)}
                            >
                              Xóa mục con
                            </button>
                          ) : null}
                        </div>
                        {item.description ? (
                          <p className="mt-2 text-[14px] leading-6 text-[#5f5e5e]">{item.description}</p>
                        ) : null}
                        {item.tags.length ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {item.tags.map((tag) => (
                              <span
                                key={`${item.id}-${tag}`}
                                className="rounded-full bg-[#f7f1f2] px-3 py-1 text-[12px] font-semibold text-[#7a4b53]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-[14px] text-[#5f5e5e]">Đầu mục này chưa có mục con nào.</p>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-[14px] text-[#5f5e5e]">
            Chưa có đầu mục linh hoạt nào. Bạn có thể thêm các nhóm như Vinh danh,
            Hoạt động, Ấn phẩm, Diễn thuyết, Tình nguyện...
          </p>
        )}
      </div>
    </div>
  );
}
