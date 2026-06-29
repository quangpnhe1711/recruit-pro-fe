import LoadingIndicator from "../../../common/components/LoadingIndicator";
import type { ValidationErrors } from "../../../common/validation/formValidation";
import { useCandidateProfileScreen } from "./useCandidateProfileScreen";
import ExperienceSection from "./sections/ExperienceSection";
import ParsedResumePreviewSection from "./sections/ParsedResumePreviewSection";
import PersonalInfoSection from "./sections/PersonalInfoSection";
import ProfileHeaderSection from "./sections/ProfileHeaderSection";
import {
  CertificationsSection,
  CustomSectionsSection,
  EducationSection,
  LanguagesSection,
  ProjectsSection,
} from "./sections/ProfileCollectionsSections";
import ResumeSection from "./sections/ResumeSection";
import SkillsSection from "./sections/SkillsSection";

function CandidateProfileAndCVManagementScreen() {
  const { permissions, state, setters, actions } = useCandidateProfileScreen();

  if (state.loading) {
    return (
      <main className="py-6 md:py-8">
        <div className="app-container">
          <div className="card px-6 py-5">
            <LoadingIndicator label="Đang tải hồ sơ ứng viên..." />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="animate-fade-in py-6 md:py-8">
      <div className="app-container">
        <nav className="mb-6">
          <p className="eyebrow">Hồ sơ ứng viên</p>
          <h1 className="page-title mt-1">Hồ sơ của tôi</h1>
        </nav>

        <ProfileHeaderSection
          profile={state.profile}
          displayAvatarUrl={state.displayAvatarUrl}
          profileInitials={state.profileInitials}
          completionScore={state.completionScore}
          isEditingProfile={state.isEditingProfile}
          canEditProfile={permissions.canEditProfile}
          isSavingProfile={state.isSavingProfile}
          isProfileDirty={state.isProfileDirty}
          hasPendingResumeUpload={state.hasPendingResumeUpload}
          onSave={actions.handleSaveProfile}
          setIsEditingProfile={setters.setIsEditingProfile}
          onProfileChange={actions.handleProfileChange}
          errors={state.profileErrors as ValidationErrors}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="stagger space-y-6 lg:col-span-4">
            <PersonalInfoSection
              profile={state.profile}
              isEditingProfile={state.isEditingProfile}
              canEditProfile={permissions.canEditProfile}
              onProfileChange={actions.handleProfileChange}
              errors={state.profileErrors as ValidationErrors}
            />

            <SkillsSection
              canManageSkills={permissions.canManageSkills}
              skills={state.skills}
              skillOptions={state.skillOptions}
              onAddSkill={actions.handleAddSkill}
              onRemoveSkill={actions.handleRemoveSkill}
              onSkillYearsChange={actions.handleSkillYearsChange}
            />
          </div>

          <div className="stagger space-y-6 lg:col-span-8">
            <ResumeSection
              canManageResume={permissions.canManageResume}
              resumeMeta={state.resumeMeta}
              resumeHistory={state.resumeHistory}
              resumeFile={state.resumeFile}
              isParsingResume={state.isParsingResume}
              onResumeFileChange={actions.handleResumeFileChange}
              onClearSelectedResumeFile={actions.clearSelectedResumeFile}
              onParseResume={actions.handleParseResume}
              onOpenCurrentResume={() => void actions.openCurrentResume()}
              onDownloadCurrentResume={() =>
                void actions.downloadCurrentResume()
              }
              onOpenResumeHistoryItem={(resumeId, fileUrl) =>
                void actions.openResumeHistoryItem(resumeId, fileUrl)
              }
            />

            {state.parsedResumePreview ? (
              <ParsedResumePreviewSection
                parsedResumePreview={state.parsedResumePreview}
                onApply={actions.applyParsedResumeToForm}
                onDismiss={actions.dismissParsedResumePreview}
              />
            ) : null}

            <ExperienceSection
              canManageExperience={permissions.canManageExperience}
              showEntryComposer={state.showEntryComposer}
              setShowEntryComposer={setters.setShowEntryComposer}
              entryDraft={state.entryDraft}
              onEntryDraftChange={actions.handleEntryDraftChange}
              experienceEntries={state.experienceEntries}
              onAddEntry={actions.handleAddEntry}
              onRemoveEntry={actions.handleRemoveEntry}
              errors={state.entryDraftErrors as ValidationErrors}
            />

            <section className="card animate-fade-in-up p-5 md:p-6">
              <div className="grid gap-6 md:grid-cols-2">
                <ProjectsSection
                  canEditProfile={permissions.canEditProfile}
                  showProjectComposer={state.showProjectComposer}
                  setShowProjectComposer={setters.setShowProjectComposer}
                  projectDraft={state.projectDraft}
                  onProjectDraftChange={actions.handleProjectDraftChange}
                  projects={state.projects}
                  onAddProject={actions.handleAddProject}
                  onRemoveProject={actions.handleRemoveProject}
                  errors={state.projectDraftErrors as ValidationErrors}
                />

                <EducationSection
                  canEditProfile={permissions.canEditProfile}
                  showEducationComposer={state.showEducationComposer}
                  setShowEducationComposer={setters.setShowEducationComposer}
                  educationDraft={state.educationDraft}
                  onEducationDraftChange={actions.handleEducationDraftChange}
                  educations={state.educations}
                  onAddEducation={actions.handleAddEducation}
                  onRemoveEducation={actions.handleRemoveEducation}
                  errors={state.educationDraftErrors as ValidationErrors}
                />
              </div>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <CertificationsSection
                  canEditProfile={permissions.canEditProfile}
                  showCertificationComposer={state.showCertificationComposer}
                  setShowCertificationComposer={
                    setters.setShowCertificationComposer
                  }
                  certificationDraft={state.certificationDraft}
                  onCertificationDraftChange={
                    actions.handleCertificationDraftChange
                  }
                  certifications={state.certifications}
                  onAddCertification={actions.handleAddCertification}
                  onRemoveCertification={actions.handleRemoveCertification}
                  errors={state.certificationDraftErrors as ValidationErrors}
                />

                <LanguagesSection
                  canEditProfile={permissions.canEditProfile}
                  showLanguageComposer={state.showLanguageComposer}
                  setShowLanguageComposer={setters.setShowLanguageComposer}
                  languageDraft={state.languageDraft}
                  onLanguageDraftChange={actions.handleLanguageDraftChange}
                  languages={state.languages}
                  onAddLanguage={actions.handleAddLanguage}
                  onRemoveLanguage={actions.handleRemoveLanguage}
                  errors={state.languageDraftErrors as ValidationErrors}
                />
              </div>

              <CustomSectionsSection
                canEditProfile={permissions.canEditProfile}
                customSections={state.customSections}
                showCustomSectionComposer={state.showCustomSectionComposer}
                setShowCustomSectionComposer={
                  setters.setShowCustomSectionComposer
                }
                customSectionDraft={state.customSectionDraft}
                onCustomSectionDraftChange={
                  actions.handleCustomSectionDraftChange
                }
                customSectionItemDrafts={state.customSectionItemDrafts}
                openCustomSectionItemComposerId={
                  state.openCustomSectionItemComposerId
                }
                setOpenCustomSectionItemComposerId={
                  setters.setOpenCustomSectionItemComposerId
                }
                onCustomSectionItemDraftChange={
                  actions.handleCustomSectionItemDraftChange
                }
                onAddCustomSection={actions.handleAddCustomSection}
                onRemoveCustomSection={actions.handleRemoveCustomSection}
                onAddCustomSectionItem={actions.handleAddCustomSectionItem}
                onRemoveCustomSectionItem={
                  actions.handleRemoveCustomSectionItem
                }
                sectionErrors={state.customSectionDraftErrors as ValidationErrors}
                itemErrorsBySection={state.customSectionItemDraftErrors}
              />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

export default CandidateProfileAndCVManagementScreen;
