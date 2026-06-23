import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  downloadProtectedFile,
  openProtectedFileInNewTab,
} from "../../../common/utils/protectedFile";
import {
  buildResumeDownloadPath,
  buildResumePreviewPath,
} from "../../../common/utils/resumeLinks";
import { usePermissions } from "../../../hooks/usePermissions";
import { PERMISSIONS } from "../../../permissions/permissions";
import {
  candidateService,
  type CandidateProfileResponseDto,
  type CandidateResumeParseResponseDto,
} from "../../../services/candidate/candidateService";
import { jobsService } from "../../../services/jobs/jobsService";
import type { RootState } from "../../../store";
import { updateUser } from "../../../store/slices/authSlice";
import type {
  CandidateSection,
  CustomSectionItemDraft,
  EducationDraft,
  EntryDraft,
  ProfileState,
  ProjectDraft,
  SkillItem,
  SkillOption,
} from "./types";
import {
  buildManagedSectionsFromLegacy,
  buildProfileSnapshot,
  emptyCertificationDraft,
  emptyCustomSectionDraft,
  emptyCustomSectionItemDraft,
  emptyEducationDraft,
  emptyEntryDraft,
  emptyLanguageDraft,
  emptyProjectDraft,
  getInitials,
  initialCertifications,
  initialEducations,
  initialExperience,
  initialLanguages,
  initialProfile,
  initialProjects,
  initialSkills,
  isManagedSection,
} from "./utils";

export function useCandidateProfileScreen() {
  const dispatch = useDispatch();
  const authUser = useSelector((state: RootState) => state.auth.user);
  const { hasPermission } = usePermissions();
  const canEditProfile = hasPermission(
    PERMISSIONS.CANDIDATE_UPDATE_OWN_PROFILE,
  );
  const canManageSkills = hasPermission(
    PERMISSIONS.CANDIDATE_UPDATE_OWN_SKILLS,
  );
  const canManageExperience = hasPermission(
    PERMISSIONS.CANDIDATE_CREATE_OWN_EXPERIENCE,
  );
  const canManageResume = hasPermission(
    PERMISSIONS.CANDIDATE_UPLOAD_OWN_RESUME,
  );

  const [profile, setProfile] = useState(initialProfile);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(
    authUser?.avatarUrl ?? null,
  );
  const [skills, setSkills] = useState(initialSkills);
  const [skillOptions, setSkillOptions] = useState<SkillOption[]>([]);
  const [experienceEntries, setExperienceEntries] = useState(initialExperience);
  const [projects, setProjects] = useState(initialProjects);
  const [educations, setEducations] = useState(initialEducations);
  const [certifications, setCertifications] = useState(initialCertifications);
  const [languages, setLanguages] = useState(initialLanguages);
  const [sections, setSections] = useState<CandidateSection[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [entryDraft, setEntryDraft] = useState<EntryDraft>(emptyEntryDraft);
  const [showEntryComposer, setShowEntryComposer] = useState(false);
  const [showProjectComposer, setShowProjectComposer] = useState(false);
  const [showEducationComposer, setShowEducationComposer] = useState(false);
  const [showCertificationComposer, setShowCertificationComposer] =
    useState(false);
  const [showLanguageComposer, setShowLanguageComposer] = useState(false);
  const [showCustomSectionComposer, setShowCustomSectionComposer] =
    useState(false);
  const [projectDraft, setProjectDraft] =
    useState<ProjectDraft>(emptyProjectDraft);
  const [educationDraft, setEducationDraft] =
    useState<EducationDraft>(emptyEducationDraft);
  const [certificationDraft, setCertificationDraft] = useState(
    emptyCertificationDraft,
  );
  const [languageDraft, setLanguageDraft] = useState(emptyLanguageDraft);
  const [customSectionDraft, setCustomSectionDraft] = useState(
    emptyCustomSectionDraft,
  );
  const [customSectionItemDrafts, setCustomSectionItemDrafts] = useState<
    Record<string, CustomSectionItemDraft>
  >({});
  const [openCustomSectionItemComposerId, setOpenCustomSectionItemComposerId] =
    useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [parsedResumePreview, setParsedResumePreview] =
    useState<CandidateResumeParseResponseDto | null>(null);
  const [hasAppliedParsedResume, setHasAppliedParsedResume] = useState(false);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [resumeMeta, setResumeMeta] = useState<
    CandidateProfileResponseDto["resume"] | null
  >(null);
  const [resumeHistory, setResumeHistory] = useState<
    CandidateProfileResponseDto["resumeHistory"]
  >([]);
  const [resumeParsing, setResumeParsing] = useState<
    CandidateProfileResponseDto["resumeParsing"] | null
  >(null);
  const [completionScore, setCompletionScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [initialSnapshot, setInitialSnapshot] = useState("");

  const displayAvatarUrl = profileAvatarUrl ?? authUser?.avatarUrl ?? null;
  const profileInitials = getInitials(
    profile.name || authUser?.fullName || "Candidate",
  );
  const customSections = sections.filter(
    (section) => !isManagedSection(section),
  );
  const isProfileDirty =
    initialSnapshot !== "" &&
    buildProfileSnapshot({
      profile,
      skills,
      experienceEntries,
      projects,
      educations,
      certifications,
      languages,
      sections,
    }) !== initialSnapshot;
  const hasPendingResumeUpload = resumeFile !== null;
  const resumePreviewPath = resumeMeta
    ? buildResumePreviewPath(resumeMeta.id, resumeMeta.fileUrl)
    : "";
  const resumeDownloadPath = resumeMeta
    ? buildResumeDownloadPath(resumeMeta.id, resumeMeta.fileUrl)
    : "";

  function syncAuthUser(profileData: CandidateProfileResponseDto["profile"]) {
    if (!authUser) {
      return;
    }

    dispatch(
      updateUser({
        ...authUser,
        username: authUser.username,
        fullName: profileData.name,
        email: profileData.email,
        phone: profileData.phone ?? authUser.phone ?? null,
        avatarUrl: profileData.avatarUrl ?? authUser.avatarUrl ?? null,
      }),
    );
  }

  function applyProfileResponse(
    profileData: CandidateProfileResponseDto,
    allSkillOptions: SkillOption[],
  ) {
    const nextProfileState: ProfileState = {
      username: profileData.profile.username,
      name: profileData.profile.name,
      headline: profileData.profile.headline,
      email: profileData.profile.email,
      phone: profileData.profile.phone ?? "",
      location: profileData.profile.location,
      memberSince: profileData.profile.memberSince,
      bio: profileData.profile.bio ?? "",
      github: profileData.profile.github ?? "",
      linkedin: profileData.profile.linkedin ?? "",
    };

    const selectedSkillIds = new Set(
      profileData.skills.map((skill) => skill.id),
    );

    const mappedSkills: SkillItem[] = allSkillOptions.map((skill) => ({
      id: skill.value,
      label: skill.label,
      active: selectedSkillIds.has(skill.value),
      yearsOfExperience:
        profileData.skills.find((item) => item.id === skill.value)
          ?.yearsOfExperience ?? null,
    }));

    setProfile(nextProfileState);
    setProfileAvatarUrl(profileData.profile.avatarUrl ?? null);
    syncAuthUser(profileData.profile);
    setCompletionScore(profileData.profile.completionScore ?? 0);
    setSkillOptions(allSkillOptions);
    setSkills(mappedSkills);
    setExperienceEntries(profileData.experienceEntries ?? []);
    setProjects(profileData.projects ?? []);
    setEducations(profileData.educations ?? []);
    setCertifications(profileData.certifications ?? []);
    setLanguages(profileData.languages ?? []);
    setSections(profileData.sections ?? []);
    setResumeMeta(profileData.resume ?? null);
    setResumeHistory(profileData.resumeHistory ?? []);
    setResumeParsing(profileData.resumeParsing ?? null);
    setHasAppliedParsedResume(false);
    setInitialSnapshot(
      buildProfileSnapshot({
        profile: nextProfileState,
        skills: mappedSkills,
        experienceEntries: profileData.experienceEntries ?? [],
        projects: profileData.projects ?? [],
        educations: profileData.educations ?? [],
        certifications: profileData.certifications ?? [],
        languages: profileData.languages ?? [],
        sections: profileData.sections ?? [],
      }),
    );
  }

  async function reloadProfileData() {
    const [profileResponse, skillsResponse] = await Promise.all([
      candidateService.getProfile(),
      jobsService.listSkills(),
    ]);

    if (!profileResponse.data) {
      throw new Error("Profile reload failed.");
    }

    const allSkillOptions = (skillsResponse.data ?? []).map((skill) => ({
      label: skill.name,
      value: skill.id,
    }));

    applyProfileResponse(profileResponse.data, allSkillOptions);
  }

  useEffect(() => {
    let mounted = true;

    Promise.all([candidateService.getProfile(), jobsService.listSkills()])
      .then(([profileResponse, skillsResponse]) => {
        if (!mounted || !profileResponse.data) {
          return;
        }

        const allSkillOptions = (skillsResponse.data ?? []).map((skill) => ({
          label: skill.name,
          value: skill.id,
        }));

        applyProfileResponse(profileResponse.data, allSkillOptions);
      })
      .catch(() => {
        if (mounted) {
          toast.error("Không thể tải hồ sơ ứng viên");
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
    // Intentionally run once on mount to avoid refetch loops after auth store updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleProfileChange(field: keyof ProfileState, value: string) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  function handleSkillYearsChange(skillId: string, value: string) {
    const normalizedValue = value.trim();
    if (normalizedValue && !/^\d*\.?\d*$/.test(normalizedValue)) {
      return;
    }

    setSkills((prev) =>
      prev.map((skill) =>
        skill.id === skillId
          ? {
              ...skill,
              yearsOfExperience:
                normalizedValue === "" ? null : Number(normalizedValue),
            }
          : skill,
      ),
    );
  }

  function applyParsedResumeToForm(preview: CandidateResumeParseResponseDto) {
    setProfile((prev) => ({
      ...prev,
      name: preview.profile.name ?? "",
      headline: preview.profile.headline ?? "",
      email: preview.profile.email ?? "",
      phone: preview.profile.phone ?? "",
      location: preview.profile.location ?? "",
      bio: preview.profile.bio ?? "",
      github: preview.profile.github ?? "",
      linkedin: preview.profile.linkedin ?? "",
    }));

    const uniqueParsedSkills = Array.from(
      preview.skills
        .filter((skill) => skill.label.trim().length > 0)
        .reduce((map, skill) => {
          const normalizedLabel = skill.label.trim().toLowerCase();
          if (!map.has(normalizedLabel)) {
            map.set(normalizedLabel, {
              ...skill,
              label: skill.label.trim(),
            });
          }

          return map;
        }, new Map<string, (typeof preview.skills)[number]>())
        .values(),
    );

    const parsedSkillById = new Map(
      uniqueParsedSkills.map((skill) => [
        skill.id,
        {
          yearsOfExperience: skill.yearsOfExperience,
          label: skill.label,
        },
      ]),
    );

    setSkills(() => {
      const overwritten = skillOptions.map((skill) => {
        const parsedSkill = parsedSkillById.get(skill.value);
        return parsedSkill
          ? {
              id: skill.value,
              label: skill.label,
              active: true,
              yearsOfExperience: parsedSkill.yearsOfExperience,
            }
          : {
              id: skill.value,
              label: skill.label,
              active: false,
              yearsOfExperience: null,
            };
      });

      const existingIds = new Set(overwritten.map((skill) => skill.id));
      const existingLabels = new Set(
        overwritten.map((skill) => skill.label.trim().toLowerCase()),
      );
      const missingParsedSkills = uniqueParsedSkills
        .filter((skill) => !existingIds.has(skill.id))
        .filter(
          (skill) => !existingLabels.has(skill.label.trim().toLowerCase()),
        )
        .map((skill) => ({
          id: skill.id,
          label: skill.label,
          active: true,
          yearsOfExperience: skill.yearsOfExperience,
        }));

      return [...overwritten, ...missingParsedSkills];
    });

    setExperienceEntries(preview.experienceEntries ?? []);
    setProjects(preview.projects ?? []);
    setEducations(preview.educations ?? []);
    setCertifications(preview.certifications ?? []);
    setLanguages(preview.languages ?? []);
    setSections([]);
    setCustomSectionDraft(emptyCustomSectionDraft);
    setCustomSectionItemDrafts({});
    setOpenCustomSectionItemComposerId(null);
    setShowCustomSectionComposer(false);
    setShowProjectComposer(false);
    setShowEducationComposer(false);
    setShowCertificationComposer(false);
    setShowLanguageComposer(false);
    setShowEntryComposer(false);
    setHasAppliedParsedResume(true);
    setIsEditingProfile(true);
    toast.success(
      "Đã áp dữ liệu parse từ CV vào biểu mẫu theo chế độ ghi đè. Nếu bạn lưu, hệ thống sẽ coi profile này là CV chính thức.",
    );
  }

  async function handleSaveProfile() {
    setIsSavingProfile(true);
    try {
      const savePayload = {
        name: profile.name,
        headline: profile.headline,
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        bio: profile.bio,
        github: profile.github,
        linkedin: profile.linkedin,
        skills: skills
          .filter((skill) => skill.active)
          .map((skill) => ({
            skillId: skill.id,
            yearsOfExperience: skill.yearsOfExperience,
          })),
        experienceEntries: experienceEntries.map((entry) => ({
          id: entry.id,
          title: entry.title,
          company: entry.company,
          period: {
            startMonth: entry.period.startMonth,
            startYear: entry.period.startYear,
            endMonth: entry.period.endMonth ?? null,
            endYear: entry.period.endYear ?? null,
            isCurrent: entry.period.isCurrent,
          },
          bullets: entry.bullets,
        })),
        projects: projects.map((project) => ({
          id: project.id,
          name: project.name,
          role: project.role,
          description: project.description,
          technologies: project.technologies,
          period: {
            startMonth: project.period.startMonth,
            startYear: project.period.startYear,
            endMonth: project.period.endMonth ?? null,
            endYear: project.period.endYear ?? null,
            isCurrent: project.period.isCurrent,
          },
        })),
        educations: educations.map((education) => ({
          id: education.id,
          school: education.school,
          degree: education.degree,
          fieldOfStudy: education.fieldOfStudy,
          startYear: education.startYear,
          endYear: education.endYear,
          description: education.description,
        })),
        certifications: certifications.map((certification) => ({
          id: certification.id,
          name: certification.name,
          issuer: certification.issuer,
          issuedOn: certification.issuedOn,
          expiresOn: certification.expiresOn,
          credentialId: certification.credentialId,
          credentialUrl: certification.credentialUrl,
        })),
        languages: languages.map((language) => ({
          id: language.id,
          name: language.name,
          proficiency: language.proficiency,
        })),
        sections: [
          ...buildManagedSectionsFromLegacy(
            experienceEntries,
            projects,
            educations,
            certifications,
            languages,
          ),
          ...(hasAppliedParsedResume
            ? []
            : sections.filter((section) => !isManagedSection(section))),
        ].map((section, sectionIndex) => ({
          id: section.id || undefined,
          sectionKey: section.sectionKey,
          title: section.title,
          sectionType: section.sectionType,
          source: section.source,
          displayOrder: section.displayOrder || (sectionIndex + 1) * 100,
          schema: section.schema,
          items: section.items.map((item, itemIndex) => ({
            id: item.id || undefined,
            itemType: item.itemType,
            title: item.title,
            subtitle: item.subtitle,
            organization: item.organization,
            location: item.location,
            description: item.description,
            dateLabel: item.dateLabel,
            startMonth: item.startMonth,
            startYear: item.startYear,
            endMonth: item.endMonth,
            endYear: item.endYear,
            isCurrent: item.isCurrent,
            displayOrder: item.displayOrder || itemIndex,
            tags: item.tags,
            attributes: item.attributes,
          })),
        })),
      };
      const profileResult = await candidateService.saveProfile(
        savePayload,
        resumeFile,
      );

      if (profileResult.data) {
        await reloadProfileData();
      }

      if (resumeFile) {
        setResumeFile(null);
        setParsedResumePreview(null);
      }

      setIsEditingProfile(false);
      toast.success("Cập nhật thông tin thành công");
    } catch (error) {
      console.error(error);
      toast.error("Không thể lưu hồ sơ");
    } finally {
      setIsSavingProfile(false);
    }
  }

  function handleResumeFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      toast.error("Chưa chọn file CV hợp lệ.");
      return;
    }

    setResumeFile(file);
    setParsedResumePreview(null);
    toast.success("Đã chọn file CV: " + file.name);
  }

  function clearSelectedResumeFile() {
    setResumeFile(null);
    setParsedResumePreview(null);
  }

  async function handleParseResume() {
    if (!resumeFile) {
      toast.error("Hãy chọn CV trước khi phân tích.");
      return;
    }

    setIsParsingResume(true);
    try {
      const response = await candidateService.parseResume(resumeFile);
      if (!response.data) {
        toast.error(response.message || "Không thể phân tích CV.");
        return;
      }

      setParsedResumePreview(response.data);
      toast.success(
        response.data.usedAi
          ? "Đã phân tích CV bằng AI. Hãy kiểm tra dữ liệu trước khi áp dụng."
          : "Đã phân tích CV bằng chế độ dự phòng. Hãy kiểm tra lại kỹ dữ liệu trước khi áp dụng.",
      );
    } catch (error) {
      console.error(error);
      toast.error("Không thể phân tích CV hiện tại.");
    } finally {
      setIsParsingResume(false);
    }
  }

  function dismissParsedResumePreview() {
    setParsedResumePreview(null);
  }

  function handleAddSkill(skillId: string) {
    setSkills((prev) =>
      prev.map((skill) =>
        skill.id === skillId
          ? {
              ...skill,
              active: true,
            }
          : skill,
      ),
    );
  }

  function handleRemoveSkill(skillId: string) {
    setSkills((prev) =>
      prev.map((skill) =>
        skill.id === skillId
          ? {
              ...skill,
              active: false,
            }
          : skill,
      ),
    );
  }

  function handleAddEntry() {
    const title = entryDraft.title.trim();
    const company = entryDraft.company.trim();
    const bullets = entryDraft.bullets
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (!title || !company || bullets.length === 0) {
      toast.error("Hãy nhập chức danh, công ty và ít nhất một gạch đầu dòng.");
      return;
    }

    const newEntry = {
      id: `${title.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      title,
      period: {
        startMonth: entryDraft.startMonth,
        startYear: entryDraft.startYear,
        endMonth: entryDraft.isCurrent ? null : entryDraft.endMonth,
        endYear: entryDraft.isCurrent ? null : entryDraft.endYear,
        isCurrent: entryDraft.isCurrent,
      },
      company,
      bullets,
    };

    setExperienceEntries((prev) => [newEntry, ...prev]);
    setEntryDraft(emptyEntryDraft);
    setShowEntryComposer(false);
    setIsEditingProfile(true);
  }

  function handleRemoveEntry(entryId: string) {
    setExperienceEntries((prev) => prev.filter((entry) => entry.id !== entryId));
    setIsEditingProfile(true);
  }

  function handleAddProject() {
    const name = projectDraft.name.trim();
    if (!name) {
      toast.error("Hãy nhập tên dự án.");
      return;
    }

    setProjects((prev) => [
      {
        id: `project-${Date.now()}`,
        name,
        role: projectDraft.role.trim() || null,
        description: projectDraft.description.trim() || null,
        technologies: projectDraft.technologies
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        period: {
          startMonth: projectDraft.startMonth,
          startYear: projectDraft.startYear,
          endMonth: projectDraft.isCurrent ? null : projectDraft.endMonth,
          endYear: projectDraft.isCurrent ? null : projectDraft.endYear,
          isCurrent: projectDraft.isCurrent,
        },
      },
      ...prev,
    ]);
    setProjectDraft(emptyProjectDraft);
    setShowProjectComposer(false);
    setIsEditingProfile(true);
  }

  function handleRemoveProject(projectId: string) {
    setProjects((prev) => prev.filter((project) => project.id !== projectId));
    setIsEditingProfile(true);
  }

  function handleAddEducation() {
    const school = educationDraft.school.trim();
    const degree = educationDraft.degree.trim();
    if (!school || !degree) {
      toast.error("Hãy nhập trường học và bằng cấp.");
      return;
    }

    setEducations((prev) => [
      {
        id: `education-${Date.now()}`,
        school,
        degree,
        fieldOfStudy: educationDraft.fieldOfStudy.trim() || null,
        startYear: educationDraft.startYear
          ? Number(educationDraft.startYear)
          : null,
        endYear: educationDraft.endYear ? Number(educationDraft.endYear) : null,
        description: educationDraft.description.trim() || null,
      },
      ...prev,
    ]);
    setEducationDraft(emptyEducationDraft);
    setShowEducationComposer(false);
    setIsEditingProfile(true);
  }

  function handleRemoveEducation(educationId: string) {
    setEducations((prev) =>
      prev.filter((education) => education.id !== educationId),
    );
    setIsEditingProfile(true);
  }

  function handleAddCertification() {
    const name = certificationDraft.name.trim();
    if (!name) {
      toast.error("Hãy nhập tên chứng chỉ.");
      return;
    }

    setCertifications((prev) => [
      {
        id: `certification-${Date.now()}`,
        name,
        issuer: certificationDraft.issuer.trim() || null,
        issuedOn: certificationDraft.issuedOn || null,
        expiresOn: certificationDraft.expiresOn || null,
        credentialId: certificationDraft.credentialId.trim() || null,
        credentialUrl: certificationDraft.credentialUrl.trim() || null,
      },
      ...prev,
    ]);
    setCertificationDraft(emptyCertificationDraft);
    setShowCertificationComposer(false);
    setIsEditingProfile(true);
  }

  function handleRemoveCertification(certificationId: string) {
    setCertifications((prev) =>
      prev.filter((certification) => certification.id !== certificationId),
    );
    setIsEditingProfile(true);
  }

  function handleAddLanguage() {
    const name = languageDraft.name.trim();
    const proficiency = languageDraft.proficiency.trim();
    if (!name || !proficiency) {
      toast.error("Hãy nhập ngôn ngữ và trình độ.");
      return;
    }

    setLanguages((prev) => [
      {
        id: `language-${Date.now()}`,
        name,
        proficiency,
      },
      ...prev,
    ]);
    setLanguageDraft(emptyLanguageDraft);
    setShowLanguageComposer(false);
    setIsEditingProfile(true);
  }

  function handleRemoveLanguage(languageId: string) {
    setLanguages((prev) =>
      prev.filter((language) => language.id !== languageId),
    );
    setIsEditingProfile(true);
  }

  function handleAddCustomSection() {
    const title = customSectionDraft.title.trim();
    if (!title) {
      toast.error("Hãy nhập tên đầu mục lớn.");
      return;
    }

    const sectionId = `custom-section-${Date.now()}`;
    setSections((prev) => [
      ...prev,
      {
        id: sectionId,
        sectionKey: null,
        title,
        sectionType: customSectionDraft.sectionType.trim() || "Custom",
        source: "User",
        displayOrder:
          800 +
          prev.filter((section) => !isManagedSection(section)).length * 100,
        schema: {},
        items: [],
      },
    ]);
    setCustomSectionDraft(emptyCustomSectionDraft);
    setShowCustomSectionComposer(false);
    setOpenCustomSectionItemComposerId(sectionId);
    setIsEditingProfile(true);
  }

  function handleRemoveCustomSection(sectionId: string) {
    setSections((prev) => prev.filter((section) => section.id !== sectionId));
    setOpenCustomSectionItemComposerId((prev) =>
      prev === sectionId ? null : prev,
    );
    setIsEditingProfile(true);
  }

  function handleCustomSectionItemDraftChange(
    sectionId: string,
    field: keyof CustomSectionItemDraft,
    value: string,
  ) {
    setCustomSectionItemDrafts((prev) => ({
      ...prev,
      [sectionId]: {
        ...(prev[sectionId] ?? emptyCustomSectionItemDraft),
        [field]: value,
      },
    }));
  }

  function handleAddCustomSectionItem(sectionId: string) {
    const draft =
      customSectionItemDrafts[sectionId] ?? emptyCustomSectionItemDraft;
    const title = draft.title.trim();
    if (!title) {
      toast.error("Hãy nhập tiêu đề cho mục con.");
      return;
    }

    setSections((prev) =>
      prev.map((section) =>
        section.id !== sectionId
          ? section
          : {
              ...section,
              items: [
                ...section.items,
                {
                  id: `custom-item-${Date.now()}`,
                  itemType: "Entry",
                  title,
                  subtitle: draft.subtitle.trim() || null,
                  organization: draft.organization.trim() || null,
                  location: draft.location.trim() || null,
                  description: draft.description.trim() || null,
                  dateLabel: draft.dateLabel.trim() || null,
                  startMonth: null,
                  startYear: null,
                  endMonth: null,
                  endYear: null,
                  isCurrent: false,
                  displayOrder: section.items.length,
                  tags: draft.tags
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                  attributes: {},
                },
              ],
            },
      ),
    );

    setCustomSectionItemDrafts((prev) => ({
      ...prev,
      [sectionId]: emptyCustomSectionItemDraft,
    }));
    setOpenCustomSectionItemComposerId(null);
    setIsEditingProfile(true);
  }

  function handleRemoveCustomSectionItem(sectionId: string, itemId: string) {
    setSections((prev) =>
      prev.map((section) =>
        section.id !== sectionId
          ? section
          : {
              ...section,
              items: section.items
                .filter((item) => item.id !== itemId)
                .map((item, index) => ({ ...item, displayOrder: index })),
            },
      ),
    );
    setIsEditingProfile(true);
  }

  async function openCurrentResume() {
    if (resumePreviewPath && resumeMeta) {
      await openProtectedFileInNewTab(resumePreviewPath);
    }
  }

  async function downloadCurrentResume() {
    if (resumeDownloadPath && resumeMeta) {
      await downloadProtectedFile(resumeDownloadPath, resumeMeta.fileName);
    }
  }

  async function openResumeHistoryItem(resumeId: string, fileUrl: string) {
    await openProtectedFileInNewTab(buildResumePreviewPath(resumeId, fileUrl));
  }

  return {
    permissions: {
      canEditProfile,
      canManageSkills,
      canManageExperience,
      canManageResume,
    },
    state: {
      profile,
      displayAvatarUrl,
      profileInitials,
      completionScore,
      isEditingProfile,
      skills,
      skillOptions,
      experienceEntries,
      projects,
      educations,
      certifications,
      languages,
      sections,
      customSections,
      resumeMeta,
      resumeHistory,
      resumeParsing,
      resumeFile,
      parsedResumePreview,
      entryDraft,
      showEntryComposer,
      projectDraft,
      showProjectComposer,
      educationDraft,
      showEducationComposer,
      certificationDraft,
      showCertificationComposer,
      languageDraft,
      showLanguageComposer,
      customSectionDraft,
      showCustomSectionComposer,
      customSectionItemDrafts,
      openCustomSectionItemComposerId,
      loading,
      isSavingProfile,
      isParsingResume,
      isProfileDirty,
      hasPendingResumeUpload,
      hasAppliedParsedResume,
    },
    setters: {
      setIsEditingProfile,
      setEntryDraft,
      setShowEntryComposer,
      setProjectDraft,
      setShowProjectComposer,
      setEducationDraft,
      setShowEducationComposer,
      setCertificationDraft,
      setShowCertificationComposer,
      setLanguageDraft,
      setShowLanguageComposer,
      setCustomSectionDraft,
      setShowCustomSectionComposer,
      setOpenCustomSectionItemComposerId,
    },
    actions: {
      handleProfileChange,
      handleSkillYearsChange,
      handleSaveProfile,
      handleResumeFileChange,
      clearSelectedResumeFile,
      handleParseResume,
      dismissParsedResumePreview,
      applyParsedResumeToForm: () => {
        if (parsedResumePreview) {
          applyParsedResumeToForm(parsedResumePreview);
        }
      },
      handleAddSkill,
      handleRemoveSkill,
      handleAddEntry,
      handleRemoveEntry,
      handleAddProject,
      handleRemoveProject,
      handleAddEducation,
      handleRemoveEducation,
      handleAddCertification,
      handleRemoveCertification,
      handleAddLanguage,
      handleRemoveLanguage,
      handleAddCustomSection,
      handleRemoveCustomSection,
      handleCustomSectionItemDraftChange,
      handleAddCustomSectionItem,
      handleRemoveCustomSectionItem,
      openCurrentResume,
      downloadCurrentResume,
      openResumeHistoryItem,
    },
  };
}
