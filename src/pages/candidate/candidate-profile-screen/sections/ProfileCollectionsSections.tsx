import CommonSelect from "../../../../common/components/CommonSelect";
import type { Dispatch, SetStateAction } from "react";
import type { ValidationErrors } from "../../../../common/validation/formValidation";
import type {
  CandidateSection,
  CertificationDraft,
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

function fieldClassName(hasError: boolean) {
  return `input-field h-11 ${hasError ? "border-[#dc2626]" : ""}`;
}

type ProjectsSectionProps = SharedEditProps & {
  showProjectComposer: boolean;
  setShowProjectComposer: Dispatch<SetStateAction<boolean>>;
  projectDraft: ProjectDraft;
  onProjectDraftChange: (
    field: keyof ProjectDraft,
    value: string | number | boolean,
  ) => void;
  projects: CandidateProjectItem[];
  onAddProject: () => void;
  onRemoveProject: (projectId: string) => void;
  errors: ValidationErrors;
};

export function ProjectsSection({
  canEditProfile,
  showProjectComposer,
  setShowProjectComposer,
  projectDraft,
  onProjectDraftChange,
  projects,
  onAddProject,
  onRemoveProject,
  errors,
}: ProjectsSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b border-[#f0eceb] pb-3">
        <h2 className="section-title">Dự án</h2>
        {canEditProfile ? (
          <button
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#b90014] hover:underline"
            type="button"
            onClick={() => setShowProjectComposer((value) => !value)}
          >
            <span className="material-symbols-outlined text-[16px]">
              {showProjectComposer ? "close" : "add"}
            </span>
            {showProjectComposer ? "Đóng" : "Thêm mục"}
          </button>
        ) : null}
      </div>
      {showProjectComposer && canEditProfile ? (
        <div className="animate-scale-in mt-4 space-y-3 rounded-[12px] border border-[#ececec] bg-[#f7f6f5] p-4">
          <input
            className={fieldClassName(Boolean(errors.name))}
            placeholder="Tên dự án"
            value={projectDraft.name}
            onChange={(e) => onProjectDraftChange("name", e.target.value)}
          />
          {errors.name ? <p className="text-sm text-[#dc2626]">{errors.name}</p> : null}
          <input
            className={fieldClassName(Boolean(errors.role))}
            placeholder="Vai trò"
            value={projectDraft.role}
            onChange={(e) => onProjectDraftChange("role", e.target.value)}
          />
          {errors.role ? <p className="text-sm text-[#dc2626]">{errors.role}</p> : null}
          <textarea
            className={`input-field min-h-[90px] resize-none ${errors.description ? "border-[#dc2626]" : ""}`}
            placeholder="Mô tả dự án"
            value={projectDraft.description}
            onChange={(e) => onProjectDraftChange("description", e.target.value)}
          />
          {errors.description ? (
            <p className="text-sm text-[#dc2626]">{errors.description}</p>
          ) : null}
          <input
            className={fieldClassName(Boolean(errors.technologies))}
            placeholder="Công nghệ, phân tách bằng dấu phẩy"
            value={projectDraft.technologies}
            onChange={(e) => onProjectDraftChange("technologies", e.target.value)}
          />
          {errors.technologies ? (
            <p className="text-sm text-[#dc2626]">{errors.technologies}</p>
          ) : null}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <CommonSelect
              value={String(projectDraft.startMonth)}
              options={monthOptions.map((month, index) => ({
                label: month,
                value: String(index + 1),
              }))}
              onValueChange={(value) =>
                onProjectDraftChange("startMonth", Number(value))
              }
              className="h-11 rounded-[10px] border border-[#dcd7d5] bg-white text-[14px] shadow-none focus:border-[#b90014]"
              menuClassName="border-[#ececec]"
            />
            <input
              className="input-field h-11"
              type="number"
              value={projectDraft.startYear}
              onChange={(e) =>
                onProjectDraftChange("startYear", Number(e.target.value))
              }
            />
            <label className="col-span-2 flex h-11 items-center gap-2 rounded-[10px] border border-[#dcd7d5] bg-white px-3 text-[14px] font-semibold text-[#1a1c1c] md:col-span-1">
              <input
                checked={projectDraft.isCurrent}
                className="h-4 w-4 accent-[#b90014]"
                type="checkbox"
                onChange={(e) =>
                  onProjectDraftChange("isCurrent", e.target.checked)
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
                    onProjectDraftChange("endMonth", Number(value))
                  }
                  className="h-11 rounded-[10px] border border-[#dcd7d5] bg-white text-[14px] shadow-none focus:border-[#b90014]"
                  menuClassName="border-[#ececec]"
                />
                <input
                  className="input-field h-11"
                  type="number"
                  value={projectDraft.endYear}
                  onChange={(e) =>
                    onProjectDraftChange("endYear", Number(e.target.value))
                  }
                />
              </>
            )}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              className="btn btn-secondary h-11"
              type="button"
              onClick={() => setShowProjectComposer(false)}
            >
              Hủy
            </button>
            <button
              className="btn btn-primary h-11"
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
            <div key={project.id} className="rounded-[12px] border border-[#ececec] bg-[#fbfafa] p-4 transition-all hover:border-[#e0d4d2]">
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
                      className="badge border border-[#ececec] bg-white text-[#5f5e5e]"
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
  onEducationDraftChange: (field: keyof EducationDraft, value: string) => void;
  educations: CandidateEducationItem[];
  onAddEducation: () => void;
  onRemoveEducation: (educationId: string) => void;
  errors: ValidationErrors;
};

export function EducationSection({
  canEditProfile,
  showEducationComposer,
  setShowEducationComposer,
  educationDraft,
  onEducationDraftChange,
  educations,
  onAddEducation,
  onRemoveEducation,
  errors,
}: EducationSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b border-[#f0eceb] pb-3">
        <h2 className="section-title">Học vấn</h2>
        {canEditProfile ? (
          <button
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#b90014] hover:underline"
            type="button"
            onClick={() => setShowEducationComposer((value) => !value)}
          >
            <span className="material-symbols-outlined text-[16px]">
              {showEducationComposer ? "close" : "add"}
            </span>
            {showEducationComposer ? "Đóng" : "Thêm mục"}
          </button>
        ) : null}
      </div>
      {showEducationComposer && canEditProfile ? (
        <div className="animate-scale-in mt-4 space-y-3 rounded-[12px] border border-[#ececec] bg-[#f7f6f5] p-4">
          <input
            className={fieldClassName(Boolean(errors.school))}
            placeholder="Trường học"
            value={educationDraft.school}
            onChange={(e) => onEducationDraftChange("school", e.target.value)}
          />
          {errors.school ? <p className="text-sm text-[#dc2626]">{errors.school}</p> : null}
          <input
            className={fieldClassName(Boolean(errors.degree))}
            placeholder="Bằng cấp"
            value={educationDraft.degree}
            onChange={(e) => onEducationDraftChange("degree", e.target.value)}
          />
          {errors.degree ? <p className="text-sm text-[#dc2626]">{errors.degree}</p> : null}
          <input
            className={fieldClassName(Boolean(errors.fieldOfStudy))}
            placeholder="Chuyên ngành"
            value={educationDraft.fieldOfStudy}
            onChange={(e) => onEducationDraftChange("fieldOfStudy", e.target.value)}
          />
          {errors.fieldOfStudy ? (
            <p className="text-sm text-[#dc2626]">{errors.fieldOfStudy}</p>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <input
              className={fieldClassName(Boolean(errors.startYear))}
              placeholder="Năm bắt đầu"
              value={educationDraft.startYear}
              onChange={(e) => onEducationDraftChange("startYear", e.target.value)}
            />
            <input
              className={fieldClassName(Boolean(errors.endYear))}
              placeholder="Năm kết thúc"
              value={educationDraft.endYear}
              onChange={(e) => onEducationDraftChange("endYear", e.target.value)}
            />
          </div>
          {errors.startYear || errors.endYear ? (
            <div className="grid grid-cols-2 gap-3">
              <p className="text-sm text-[#dc2626]">{errors.startYear || " "}</p>
              <p className="text-sm text-[#dc2626]">{errors.endYear || " "}</p>
            </div>
          ) : null}
          <textarea
            className={`input-field min-h-[90px] resize-none ${errors.description ? "border-[#dc2626]" : ""}`}
            placeholder="Mô tả thêm"
            value={educationDraft.description}
            onChange={(e) => onEducationDraftChange("description", e.target.value)}
          />
          {errors.description ? (
            <p className="text-sm text-[#dc2626]">{errors.description}</p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <button
              className="btn btn-secondary h-11"
              type="button"
              onClick={() => setShowEducationComposer(false)}
            >
              Hủy
            </button>
            <button
              className="btn btn-primary h-11"
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
            <div key={education.id} className="rounded-[12px] border border-[#ececec] bg-[#fbfafa] p-4 transition-all hover:border-[#e0d4d2]">
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
  certificationDraft: CertificationDraft;
  onCertificationDraftChange: (field: keyof CertificationDraft, value: string) => void;
  certifications: CandidateCertificationItem[];
  onAddCertification: () => void;
  onRemoveCertification: (certificationId: string) => void;
  errors: ValidationErrors;
};

export function CertificationsSection({
  canEditProfile,
  showCertificationComposer,
  setShowCertificationComposer,
  certificationDraft,
  onCertificationDraftChange,
  certifications,
  onAddCertification,
  onRemoveCertification,
  errors,
}: CertificationsSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b border-[#f0eceb] pb-3">
        <h2 className="section-title">Chứng chỉ</h2>
        {canEditProfile ? (
          <button
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#b90014] hover:underline"
            type="button"
            onClick={() => setShowCertificationComposer((value) => !value)}
          >
            <span className="material-symbols-outlined text-[16px]">
              {showCertificationComposer ? "close" : "add"}
            </span>
            {showCertificationComposer ? "Đóng" : "Thêm mục"}
          </button>
        ) : null}
      </div>
      {showCertificationComposer && canEditProfile ? (
        <div className="animate-scale-in mt-4 space-y-3 rounded-[12px] border border-[#ececec] bg-[#f7f6f5] p-4">
          <input
            className={fieldClassName(Boolean(errors.name))}
            placeholder="Tên chứng chỉ"
            value={certificationDraft.name}
            onChange={(e) => onCertificationDraftChange("name", e.target.value)}
          />
          {errors.name ? <p className="text-sm text-[#dc2626]">{errors.name}</p> : null}
          <input
            className={fieldClassName(Boolean(errors.issuer))}
            placeholder="Đơn vị cấp"
            value={certificationDraft.issuer}
            onChange={(e) => onCertificationDraftChange("issuer", e.target.value)}
          />
          {errors.issuer ? <p className="text-sm text-[#dc2626]">{errors.issuer}</p> : null}
          <div className="grid grid-cols-2 gap-3">
            <input
              className={fieldClassName(Boolean(errors.issuedOn))}
              type="date"
              value={certificationDraft.issuedOn}
              onChange={(e) => onCertificationDraftChange("issuedOn", e.target.value)}
            />
            <input
              className={fieldClassName(Boolean(errors.expiresOn))}
              type="date"
              value={certificationDraft.expiresOn}
              onChange={(e) => onCertificationDraftChange("expiresOn", e.target.value)}
            />
          </div>
          {errors.issuedOn || errors.expiresOn ? (
            <div className="grid grid-cols-2 gap-3">
              <p className="text-sm text-[#dc2626]">{errors.issuedOn || " "}</p>
              <p className="text-sm text-[#dc2626]">{errors.expiresOn || " "}</p>
            </div>
          ) : null}
          <input
            className={fieldClassName(Boolean(errors.credentialId))}
            placeholder="Mã chứng chỉ"
            value={certificationDraft.credentialId}
            onChange={(e) => onCertificationDraftChange("credentialId", e.target.value)}
          />
          {errors.credentialId ? (
            <p className="text-sm text-[#dc2626]">{errors.credentialId}</p>
          ) : null}
          <input
            className={fieldClassName(Boolean(errors.credentialUrl))}
            placeholder="Liên kết chứng chỉ"
            value={certificationDraft.credentialUrl}
            onChange={(e) => onCertificationDraftChange("credentialUrl", e.target.value)}
          />
          {errors.credentialUrl ? (
            <p className="text-sm text-[#dc2626]">{errors.credentialUrl}</p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <button
              className="btn btn-secondary h-11"
              type="button"
              onClick={() => setShowCertificationComposer(false)}
            >
              Hủy
            </button>
            <button
              className="btn btn-primary h-11"
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
            <div key={certification.id} className="rounded-[12px] border border-[#ececec] bg-[#fbfafa] p-4 transition-all hover:border-[#e0d4d2]">
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
  onLanguageDraftChange: (field: keyof LanguageDraft, value: string) => void;
  languages: CandidateLanguageItem[];
  onAddLanguage: () => void;
  onRemoveLanguage: (languageId: string) => void;
  errors: ValidationErrors;
};

export function LanguagesSection({
  canEditProfile,
  showLanguageComposer,
  setShowLanguageComposer,
  languageDraft,
  onLanguageDraftChange,
  languages,
  onAddLanguage,
  onRemoveLanguage,
  errors,
}: LanguagesSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b border-[#f0eceb] pb-3">
        <h2 className="section-title">Ngoại ngữ</h2>
        {canEditProfile ? (
          <button
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#b90014] hover:underline"
            type="button"
            onClick={() => setShowLanguageComposer((value) => !value)}
          >
            <span className="material-symbols-outlined text-[16px]">
              {showLanguageComposer ? "close" : "add"}
            </span>
            {showLanguageComposer ? "Đóng" : "Thêm mục"}
          </button>
        ) : null}
      </div>
      {showLanguageComposer && canEditProfile ? (
        <div className="animate-scale-in mt-4 space-y-3 rounded-[12px] border border-[#ececec] bg-[#f7f6f5] p-4">
          <input
            className={fieldClassName(Boolean(errors.name))}
            placeholder="Ngôn ngữ"
            value={languageDraft.name}
            onChange={(e) => onLanguageDraftChange("name", e.target.value)}
          />
          {errors.name ? <p className="text-sm text-[#dc2626]">{errors.name}</p> : null}
          <input
            className={fieldClassName(Boolean(errors.proficiency))}
            placeholder="Trình độ"
            value={languageDraft.proficiency}
            onChange={(e) => onLanguageDraftChange("proficiency", e.target.value)}
          />
          {errors.proficiency ? (
            <p className="text-sm text-[#dc2626]">{errors.proficiency}</p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <button
              className="btn btn-secondary h-11"
              type="button"
              onClick={() => setShowLanguageComposer(false)}
            >
              Hủy
            </button>
            <button
              className="btn btn-primary h-11"
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
            <div key={language.id} className="badge bg-[#b90014]/10 text-[#b90014]">
              <span>
                {language.name} • {language.proficiency}
              </span>
              {canEditProfile ? (
                <button
                  className="material-symbols-outlined text-[14px] text-[#b90014] hover:text-[#8a1020]"
                  type="button"
                  aria-label="Xóa"
                  onClick={() => onRemoveLanguage(language.id)}
                >
                  close
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
  onCustomSectionDraftChange: (
    field: keyof CustomSectionDraft,
    value: string,
  ) => void;
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
  sectionErrors: ValidationErrors;
  itemErrorsBySection: Record<string, ValidationErrors>;
};

export function CustomSectionsSection({
  canEditProfile,
  customSections,
  showCustomSectionComposer,
  setShowCustomSectionComposer,
  customSectionDraft,
  onCustomSectionDraftChange,
  customSectionItemDrafts,
  openCustomSectionItemComposerId,
  setOpenCustomSectionItemComposerId,
  onCustomSectionItemDraftChange,
  onAddCustomSection,
  onRemoveCustomSection,
  onAddCustomSectionItem,
  onRemoveCustomSectionItem,
  sectionErrors,
  itemErrorsBySection,
}: CustomSectionsSectionProps) {
  return (
    <div className="mt-8 border-t border-[#f0eceb] pt-8">
      <div className="flex items-center justify-between gap-3 border-b border-[#f0eceb] pb-3">
        <h2 className="section-title">Mục linh hoạt</h2>
        {canEditProfile ? (
          <button
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#b90014] hover:underline"
            type="button"
            onClick={() => setShowCustomSectionComposer((value) => !value)}
          >
            <span className="material-symbols-outlined text-[16px]">
              {showCustomSectionComposer ? "close" : "add"}
            </span>
            {showCustomSectionComposer ? "Đóng" : "Thêm đầu mục lớn"}
          </button>
        ) : null}
      </div>

      {showCustomSectionComposer && canEditProfile ? (
        <div className="animate-scale-in mt-4 grid gap-3 rounded-[12px] border border-[#ececec] bg-[#f7f6f5] p-4 md:grid-cols-2">
          <input
            className={fieldClassName(Boolean(sectionErrors.title))}
            placeholder="Ví dụ: Vinh danh"
            value={customSectionDraft.title}
            onChange={(e) => onCustomSectionDraftChange("title", e.target.value)}
          />
          <input
            className={fieldClassName(Boolean(sectionErrors.sectionType))}
            placeholder="Ví dụ: Thành tích"
            value={customSectionDraft.sectionType}
            onChange={(e) =>
              onCustomSectionDraftChange("sectionType", e.target.value)
            }
          />
          {sectionErrors.title || sectionErrors.sectionType ? (
            <>
              <p className="text-sm text-[#dc2626]">{sectionErrors.title || " "}</p>
              <p className="text-sm text-[#dc2626]">{sectionErrors.sectionType || " "}</p>
            </>
          ) : null}
          <div className="md:col-span-2 flex justify-end gap-2">
            <button
              className="btn btn-secondary h-11"
              type="button"
              onClick={() => setShowCustomSectionComposer(false)}
            >
              Hủy
            </button>
            <button
              className="btn btn-primary h-11"
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
            const itemErrors = itemErrorsBySection[section.id] ?? {};

            return (
              <div key={section.id} className="rounded-[12px] border border-[#ececec] bg-[#fcfcfc] p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-[16px] font-semibold text-[#1a1c1c]">{section.title}</p>
                    <p className="eyebrow mt-1">{section.sectionType}</p>
                  </div>
                  {canEditProfile ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="btn btn-secondary h-9 px-3 py-0 text-[12px]"
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
                        className="btn h-9 border border-[#f0c9cf] bg-[#fff5f6] px-3 py-0 text-[12px] text-[#b90014] hover:bg-[#ffe7ec]"
                        type="button"
                        onClick={() => onRemoveCustomSection(section.id)}
                      >
                        Xóa đầu mục
                      </button>
                    </div>
                  ) : null}
                </div>

                {composerOpen && canEditProfile ? (
                  <div className="animate-scale-in mt-4 grid gap-3 rounded-[12px] border border-[#ececec] bg-white p-4 md:grid-cols-2">
                    <input
                      className={fieldClassName(Boolean(itemErrors.title))}
                      placeholder="Tiêu đề"
                      value={itemDraft.title}
                      onChange={(e) => onCustomSectionItemDraftChange(section.id, "title", e.target.value)}
                    />
                    <input
                      className={fieldClassName(Boolean(itemErrors.subtitle))}
                      placeholder="Phụ đề / vai trò"
                      value={itemDraft.subtitle}
                      onChange={(e) => onCustomSectionItemDraftChange(section.id, "subtitle", e.target.value)}
                    />
                    <input
                      className={fieldClassName(Boolean(itemErrors.organization))}
                      placeholder="Tổ chức"
                      value={itemDraft.organization}
                      onChange={(e) => onCustomSectionItemDraftChange(section.id, "organization", e.target.value)}
                    />
                    <input
                      className={fieldClassName(Boolean(itemErrors.dateLabel))}
                      placeholder="Mốc thời gian hiển thị"
                      value={itemDraft.dateLabel}
                      onChange={(e) => onCustomSectionItemDraftChange(section.id, "dateLabel", e.target.value)}
                    />
                    <input
                      className={fieldClassName(Boolean(itemErrors.location))}
                      placeholder="Địa điểm"
                      value={itemDraft.location}
                      onChange={(e) => onCustomSectionItemDraftChange(section.id, "location", e.target.value)}
                    />
                    <input
                      className={fieldClassName(Boolean(itemErrors.tags))}
                      placeholder="Tags, phân tách bằng dấu phẩy"
                      value={itemDraft.tags}
                      onChange={(e) => onCustomSectionItemDraftChange(section.id, "tags", e.target.value)}
                    />
                    {itemErrors.title ||
                    itemErrors.subtitle ||
                    itemErrors.organization ||
                    itemErrors.dateLabel ||
                    itemErrors.location ||
                    itemErrors.tags ? (
                      <>
                        <p className="text-sm text-[#dc2626]">{itemErrors.title || " "}</p>
                        <p className="text-sm text-[#dc2626]">{itemErrors.subtitle || " "}</p>
                        <p className="text-sm text-[#dc2626]">{itemErrors.organization || " "}</p>
                        <p className="text-sm text-[#dc2626]">{itemErrors.dateLabel || " "}</p>
                        <p className="text-sm text-[#dc2626]">{itemErrors.location || " "}</p>
                        <p className="text-sm text-[#dc2626] md:col-span-2">{itemErrors.tags || " "}</p>
                      </>
                    ) : null}
                    <textarea
                      className={`input-field min-h-[100px] resize-none md:col-span-2 ${itemErrors.description ? "border-[#dc2626]" : ""}`}
                      placeholder="Mô tả"
                      value={itemDraft.description}
                      onChange={(e) => onCustomSectionItemDraftChange(section.id, "description", e.target.value)}
                    />
                    {itemErrors.description ? (
                      <p className="text-sm text-[#dc2626] md:col-span-2">{itemErrors.description}</p>
                    ) : null}
                    <div className="md:col-span-2 flex flex-wrap justify-end gap-2">
                      <button
                        className="btn btn-secondary h-11"
                        type="button"
                        onClick={() => setOpenCustomSectionItemComposerId(null)}
                      >
                        Hủy
                      </button>
                      <button
                        className="btn btn-primary h-11"
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
                      <div key={item.id} className="rounded-[12px] border border-[#ececec] bg-white p-4">
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
                                className="badge bg-[#f7f1f2] text-[#7a4b53]"
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
