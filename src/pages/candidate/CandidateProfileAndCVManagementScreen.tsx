import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import CommonSelect from "../../common/components/CommonSelect";
import LoadingIndicator from "../../common/components/LoadingIndicator";
import SkillPicker from "../../common/components/SkillPicker";
import PermissionGuard from "../../guards/PermissionGuard";
import { usePermissions } from "../../hooks/usePermissions";
import { jobsService } from "../../services/jobs/jobsService";
import { PERMISSIONS } from "../../permissions/permissions";
import {
  candidateService,
  type CandidateResumeParseResponseDto,
  type CandidateProfileResponseDto,
} from "../../services/candidate/candidateService";
import type { RootState } from "../../store";
import { updateUser } from "../../store/slices/authSlice";

type SkillItem = {
  id: string;
  label: string;
  active: boolean;
  yearsOfExperience: number | null;
};

type ExperienceEntry = CandidateProfileResponseDto["experienceEntries"][number];
type CandidateProjectItem = CandidateProfileResponseDto["projects"][number];
type CandidateEducationItem = CandidateProfileResponseDto["educations"][number];
type CandidateCertificationItem = CandidateProfileResponseDto["certifications"][number];
type CandidateLanguageItem = CandidateProfileResponseDto["languages"][number];

type ProfileState = {
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  memberSince: string;
  bio: string;
  github: string;
  linkedin: string;
};

type EntryDraft = {
  title: string;
  company: string;
  bullets: string;
  startMonth: number;
  startYear: number;
  endMonth: number;
  endYear: number;
  isCurrent: boolean;
};

type ProjectDraft = {
  name: string;
  role: string;
  description: string;
  technologies: string;
  startMonth: number;
  startYear: number;
  endMonth: number;
  endYear: number;
  isCurrent: boolean;
};

type EducationDraft = {
  school: string;
  degree: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
  description: string;
};

type CertificationDraft = {
  name: string;
  issuer: string;
  issuedOn: string;
  expiresOn: string;
  credentialId: string;
  credentialUrl: string;
};

type LanguageDraft = {
  name: string;
  proficiency: string;
};

const monthOptions = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const initialProfile: ProfileState = {
  name: "",
  headline: "",
  email: "",
  phone: "",
  location: "",
  memberSince: "",
  bio: "",
  github: "",
  linkedin: "",
};

const initialSkills: SkillItem[] = [];

const initialExperience: ExperienceEntry[] = [];
const initialProjects: CandidateProjectItem[] = [];
const initialEducations: CandidateEducationItem[] = [];
const initialCertifications: CandidateCertificationItem[] = [];
const initialLanguages: CandidateLanguageItem[] = [];

const emptyEntryDraft: EntryDraft = {
  title: "",
  company: "",
  bullets: "",
  startMonth: new Date().getMonth() + 1,
  startYear: new Date().getFullYear(),
  endMonth: new Date().getMonth() + 1,
  endYear: new Date().getFullYear(),
  isCurrent: false,
};

const emptyProjectDraft: ProjectDraft = {
  name: "",
  role: "",
  description: "",
  technologies: "",
  startMonth: new Date().getMonth() + 1,
  startYear: new Date().getFullYear(),
  endMonth: new Date().getMonth() + 1,
  endYear: new Date().getFullYear(),
  isCurrent: false,
};

const emptyEducationDraft: EducationDraft = {
  school: "",
  degree: "",
  fieldOfStudy: "",
  startYear: "",
  endYear: "",
  description: "",
};

const emptyCertificationDraft: CertificationDraft = {
  name: "",
  issuer: "",
  issuedOn: "",
  expiresOn: "",
  credentialId: "",
  credentialUrl: "",
};

const emptyLanguageDraft: LanguageDraft = {
  name: "",
  proficiency: "",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatPeriod(period: ExperienceEntry["period"]) {
  const startLabel = `${monthOptions[period.startMonth - 1]} ${period.startYear}`;

  if (period.isCurrent) return `${startLabel} - Present`;

  if (period.endMonth && period.endYear) {
    return `${startLabel} - ${monthOptions[period.endMonth - 1]} ${period.endYear}`;
  }

  return startLabel;
}

function formatMonthYear(month?: number | null, year?: number | null) {
  if (!year) {
    return "Chưa rõ";
  }

  if (!month) {
    return String(year);
  }

  return `${monthOptions[month - 1]} ${year}`;
}

function formatDateRange(
  period: {
    startMonth: number;
    startYear: number;
    endMonth: number | null;
    endYear: number | null;
    isCurrent: boolean;
  },
) {
  const startLabel = formatMonthYear(period.startMonth, period.startYear);

  if (period.isCurrent) {
    return `${startLabel} - Hiện tại`;
  }

  return `${startLabel} - ${formatMonthYear(period.endMonth, period.endYear)}`;
}

function formatSimpleDate(value: string | null | undefined) {
  if (!value) {
    return "Chưa rõ";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getCountLabel(count: number, label: string) {
  return `${count} ${label}`;
}

function renderHighlightedLine(line: string) {
  const trimmedLine = line.trim();
  if (!trimmedLine) {
    return null;
  }

  const colonMatch = trimmedLine.match(/^([A-Za-zÀ-ỹ0-9\s.+#&()/-]{2,40}:)\s*(.*)$/u);
  if (colonMatch) {
    return (
      <>
        <strong>{colonMatch[1]}</strong>{colonMatch[2] ? ` ${colonMatch[2]}` : ""}
      </>
    );
  }

  const emphasisTerms = ["GPA", "Honor", "Honors", "Award", "Awards", "Scholarship", "Dean", "Achievement"];
  const matchedTerm = emphasisTerms.find((term) =>
    trimmedLine.toLowerCase().includes(term.toLowerCase()),
  );

  if (!matchedTerm) {
    return trimmedLine;
  }

  const startIndex = trimmedLine.toLowerCase().indexOf(matchedTerm.toLowerCase());
  const endIndex = startIndex + matchedTerm.length;

  return (
    <>
      {trimmedLine.slice(0, startIndex)}
      <strong>{trimmedLine.slice(startIndex, endIndex)}</strong>
      {trimmedLine.slice(endIndex)}
    </>
  );
}

function renderRichBulletText(text: string | null | undefined) {
  if (!text?.trim()) {
    return null;
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s•\-*]+/u, "").trim())
    .filter(Boolean);

  if (!lines.length) {
    return null;
  }

  return (
    <ul className="mt-3 space-y-2 text-[14px] leading-7 text-[#314956]">
      {lines.map((line, index) => (
        <li key={`${line}-${index}`} className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#b90014]" />
          <span>{renderHighlightedLine(line)}</span>
        </li>
      ))}
    </ul>
  );
}

function CandidateProfileAndCVManagementScreen() {
  const dispatch = useDispatch();
  const authUser = useSelector((state: RootState) => state.auth.user);
  const { hasPermission } = usePermissions();
  const canEditProfile = hasPermission(PERMISSIONS.CANDIDATE_UPDATE_OWN_PROFILE);
  const canManageSkills = hasPermission(PERMISSIONS.CANDIDATE_UPDATE_OWN_SKILLS);
  const canManageExperience = hasPermission(PERMISSIONS.CANDIDATE_CREATE_OWN_EXPERIENCE);
  const canManageResume = hasPermission(PERMISSIONS.CANDIDATE_UPLOAD_OWN_RESUME);
  const [profile, setProfile] = useState(initialProfile);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(authUser?.avatarUrl ?? null);
  const [skills, setSkills] = useState(initialSkills);
  const [skillOptions, setSkillOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [experienceEntries, setExperienceEntries] = useState(initialExperience);
  const [projects, setProjects] = useState(initialProjects);
  const [educations, setEducations] = useState(initialEducations);
  const [certifications, setCertifications] = useState(initialCertifications);
  const [languages, setLanguages] = useState(initialLanguages);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [entryDraft, setEntryDraft] = useState<EntryDraft>(emptyEntryDraft);
  const [showEntryComposer, setShowEntryComposer] = useState(false);
  const [showProjectComposer, setShowProjectComposer] = useState(false);
  const [showEducationComposer, setShowEducationComposer] = useState(false);
  const [showCertificationComposer, setShowCertificationComposer] = useState(false);
  const [showLanguageComposer, setShowLanguageComposer] = useState(false);
  const [projectDraft, setProjectDraft] = useState<ProjectDraft>(emptyProjectDraft);
  const [educationDraft, setEducationDraft] = useState<EducationDraft>(emptyEducationDraft);
  const [certificationDraft, setCertificationDraft] = useState<CertificationDraft>(emptyCertificationDraft);
  const [languageDraft, setLanguageDraft] = useState<LanguageDraft>(emptyLanguageDraft);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [parsedResumePreview, setParsedResumePreview] = useState<CandidateResumeParseResponseDto | null>(null);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [resumeMeta, setResumeMeta] = useState<CandidateProfileResponseDto["resume"] | null>(null);
  const [resumeHistory, setResumeHistory] = useState<CandidateProfileResponseDto["resumeHistory"]>([]);
  const [completionScore, setCompletionScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const displayAvatarUrl = profileAvatarUrl ?? authUser?.avatarUrl ?? null;
  const profileInitials = getInitials(profile.name || authUser?.fullName || "Candidate");

  function syncAuthUser(profileData: CandidateProfileResponseDto["profile"]) {
    if (!authUser) {
      return;
    }

    dispatch(updateUser({
      ...authUser,
      fullName: profileData.name,
      email: profileData.email,
      phone: profileData.phone ?? authUser.phone ?? null,
      avatarUrl: profileData.avatarUrl ?? authUser.avatarUrl ?? null,
    }));
  }

  useEffect(() => {
    let mounted = true;

    Promise.all([candidateService.getProfile(), jobsService.listSkills()])
      .then(([profileResponse, skillsResponse]) => {
        if (!mounted || !profileResponse.data) {
          return;
        }

        setProfile({
          name: profileResponse.data.profile.name,
          headline: profileResponse.data.profile.headline,
          email: profileResponse.data.profile.email,
          phone: profileResponse.data.profile.phone ?? "",
          location: profileResponse.data.profile.location,
          memberSince: profileResponse.data.profile.memberSince,
          bio: profileResponse.data.profile.bio ?? "",
          github: profileResponse.data.profile.github ?? "",
          linkedin: profileResponse.data.profile.linkedin ?? "",
        });
        setProfileAvatarUrl(profileResponse.data.profile.avatarUrl ?? null);
        if (mounted) {
          syncAuthUser(profileResponse.data.profile);
        }
        setCompletionScore(profileResponse.data.profile.completionScore ?? 0);

        const selectedSkillIds = new Set(profileResponse.data.skills.map((skill) => skill.id));
        const allSkillOptions = (skillsResponse.data ?? []).map((skill) => ({
          label: skill.name,
          value: skill.id,
        }));

        setSkillOptions(allSkillOptions);
        setSkills(
          allSkillOptions.map((skill) => ({
            id: skill.value,
            label: skill.label,
            active: selectedSkillIds.has(skill.value),
            yearsOfExperience:
              profileResponse.data.skills.find((item) => item.id === skill.value)?.yearsOfExperience ?? null,
          })),
        );
        setResumeMeta(profileResponse.data.resume ?? null);
        setResumeHistory(profileResponse.data.resumeHistory ?? []);
        setExperienceEntries(profileResponse.data.experienceEntries ?? []);
        setProjects(profileResponse.data.projects ?? []);
        setEducations(profileResponse.data.educations ?? []);
        setCertifications(profileResponse.data.certifications ?? []);
        setLanguages(profileResponse.data.languages ?? []);
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
              yearsOfExperience: normalizedValue === "" ? null : Number(normalizedValue),
            }
          : skill,
      ),
    );
  }

  function applyParsedResumeToForm(preview: CandidateResumeParseResponseDto) {
    setProfile((prev) => ({
      ...prev,
      name: preview.profile.name || prev.name,
      headline: preview.profile.headline || prev.headline,
      email: preview.profile.email || prev.email,
      phone: preview.profile.phone || prev.phone,
      location: preview.profile.location || prev.location,
      bio: preview.profile.bio || prev.bio,
      github: preview.profile.github || prev.github,
      linkedin: preview.profile.linkedin || prev.linkedin,
    }));

    const parsedSkillById = new Map(
      preview.skills.map((skill) => [
        skill.id,
        {
          yearsOfExperience: skill.yearsOfExperience,
          label: skill.label,
        },
      ]),
    );

    setSkills((prev) => {
      const merged = prev.map((skill) => {
        const parsedSkill = parsedSkillById.get(skill.id);
        return parsedSkill
          ? {
              ...skill,
              active: true,
              yearsOfExperience: parsedSkill.yearsOfExperience,
            }
          : skill;
      });

      const existingIds = new Set(merged.map((skill) => skill.id));
      const missingParsedSkills = preview.skills
        .filter((skill) => !existingIds.has(skill.id))
        .map((skill) => ({
          id: skill.id,
          label: skill.label,
          active: true,
          yearsOfExperience: skill.yearsOfExperience,
        }));

      return [...merged, ...missingParsedSkills];
    });

    setExperienceEntries(preview.experienceEntries ?? []);
    setProjects(preview.projects ?? []);
    setEducations(preview.educations ?? []);
    setCertifications(preview.certifications ?? []);
    setLanguages(preview.languages ?? []);
    setIsEditingProfile(true);
    toast.success("Đã áp dụng dữ liệu phân tích CV vào biểu mẫu. Hãy kiểm tra lại trước khi lưu.");
  }

  async function handleSaveProfile() {
    setIsSavingProfile(true);
    try {
      const profileResult = await candidateService.updateProfile({
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
      });

      if (profileResult.data) {
        setProfile({
          name: profileResult.data.profile.name,
          headline: profileResult.data.profile.headline,
          email: profileResult.data.profile.email,
          phone: profileResult.data.profile.phone ?? "",
          location: profileResult.data.profile.location,
          memberSince: profileResult.data.profile.memberSince,
          bio: profileResult.data.profile.bio ?? "",
          github: profileResult.data.profile.github ?? "",
          linkedin: profileResult.data.profile.linkedin ?? "",
        });
        setProfileAvatarUrl(profileResult.data.profile.avatarUrl ?? null);
        syncAuthUser(profileResult.data.profile);
        setCompletionScore(profileResult.data.profile.completionScore ?? 0);
        setSkills((profileResult.data.skills ?? []).map((skill) => ({
          id: skill.id,
          label: skill.label,
          active: skill.active,
          yearsOfExperience: skill.yearsOfExperience,
        })));
        setExperienceEntries(profileResult.data.experienceEntries ?? []);
        setProjects(profileResult.data.projects ?? []);
        setEducations(profileResult.data.educations ?? []);
        setCertifications(profileResult.data.certifications ?? []);
        setLanguages(profileResult.data.languages ?? []);
      }

      if (resumeFile) {
        await candidateService.uploadResume(resumeFile);
        const refreshedProfile = await candidateService.getProfile();
        if (refreshedProfile.data) {
          syncAuthUser(refreshedProfile.data.profile);
          setResumeMeta(refreshedProfile.data.resume ?? null);
          setResumeHistory(refreshedProfile.data.resumeHistory ?? []);
          setCompletionScore(refreshedProfile.data.profile.completionScore ?? 0);
          setProjects(refreshedProfile.data.projects ?? []);
          setEducations(refreshedProfile.data.educations ?? []);
          setCertifications(refreshedProfile.data.certifications ?? []);
          setLanguages(refreshedProfile.data.languages ?? []);
          setResumeFile(null);
          setParsedResumePreview(null);
        }
      }

      setIsEditingProfile(false);
      toast.success("Cập nhật hồ sơ thành công");
    } catch (error) {
      console.error(error);
      toast.error("Không thể lưu hồ sơ");
    } finally {
      setIsSavingProfile(false);
    }
  }

  function handleResumeFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      toast.error("No file selected. Please choose a valid resume file.");
      return;
    }

    setResumeFile(file);
    setParsedResumePreview(null);
    toast.success("Resume file selected: " + file.name);
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

  async function handleAddEntry() {
    const title = entryDraft.title.trim();
    const company = entryDraft.company.trim();
    const bullets = entryDraft.bullets
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (!title || !company || bullets.length === 0) return;

    const newEntry: ExperienceEntry = {
      id: `${title.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      title,
      period: {
        startMonth: entryDraft.startMonth,
        startYear: entryDraft.startYear,
        endMonth: entryDraft.isCurrent ? undefined : entryDraft.endMonth,
        endYear: entryDraft.isCurrent ? undefined : entryDraft.endYear,
        isCurrent: entryDraft.isCurrent,
      },
      company,
      bullets,
    };

    try {
      const response = await candidateService.createExperience({
        title: newEntry.title,
        company: newEntry.company,
        period: {
          startMonth: newEntry.period.startMonth,
          startYear: newEntry.period.startYear,
          endMonth: newEntry.period.endMonth ?? null,
          endYear: newEntry.period.endYear ?? null,
          isCurrent: newEntry.period.isCurrent,
        },
        bullets: newEntry.bullets,
      });

      setExperienceEntries(response.data?.experienceEntries ?? []);
      setEntryDraft(emptyEntryDraft);
      setShowEntryComposer(false);
      toast.success("Đã thêm kinh nghiệm làm việc");
    } catch {
      toast.error("Không thể lưu kinh nghiệm làm việc");
    }
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
        startYear: educationDraft.startYear ? Number(educationDraft.startYear) : null,
        endYear: educationDraft.endYear ? Number(educationDraft.endYear) : null,
        description: educationDraft.description.trim() || null,
      },
      ...prev,
    ]);
    setEducationDraft(emptyEducationDraft);
    setShowEducationComposer(false);
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

  if (loading) {
    return (
      <main className="py-6">
        <div className="w-full px-4 md:px-10">
          <div className="rounded-xl border border-[#e2dfde] bg-white px-6 py-5">
            <LoadingIndicator label="Đang tải hồ sơ ứng viên..." />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="py-6">
      <div className="w-full px-4 md:px-10">
            <nav className="mb-6 flex items-center gap-2">
              <span className="text-[32px] font-bold text-[#1a1c1c]">
                Hồ sơ của tôi
              </span>
            </nav>
            <section
              id="profile"
              className="relative mb-6 overflow-hidden rounded-xl border border-[#e2dfde] bg-white p-6 md:p-8"
            >
              <div className="mb-6 flex flex-col gap-3 md:absolute md:right-6 md:top-6 md:flex-row">
                <PermissionGuard permissions={PERMISSIONS.CANDIDATE_UPDATE_OWN_PROFILE}>
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded bg-[#b90014] px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      save
                    </span>
                    {isSavingProfile ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </PermissionGuard>
                <PermissionGuard permissions={PERMISSIONS.CANDIDATE_UPDATE_OWN_PROFILE}>
                  <button
                    className="rounded border border-[#1a1c1c] bg-white px-4 py-2 text-[12px] font-semibold text-[#1a1c1c] transition-colors hover:bg-[#f3f3f3]"
                    type="button"
                    onClick={() => setIsEditingProfile((value) => !value)}
                  >
                    {isEditingProfile ? "Xong" : "Chỉnh sửa hồ sơ"}
                  </button>
                </PermissionGuard>
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
                        onChange={(e) =>
                          handleProfileChange("name", e.target.value)
                        }
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
                        onChange={(e) =>
                          handleProfileChange("headline", e.target.value)
                        }
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
                          className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                          value={profile.email}
                          onChange={(e) =>
                            handleProfileChange("email", e.target.value)
                          }
                        />
                        <input
                          className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                          value={profile.phone}
                          onChange={(e) =>
                            handleProfileChange("phone", e.target.value)
                          }
                        />
                        <input
                          className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                          value={profile.location}
                          onChange={(e) =>
                            handleProfileChange("location", e.target.value)
                          }
                        />
                        <input
                          className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                          value={profile.memberSince}
                          onChange={(e) =>
                            handleProfileChange("memberSince", e.target.value)
                          }
                        />
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-[#5f5e5e]">
                          <span className="material-symbols-outlined text-[20px]">
                            mail
                          </span>
                          <span className="text-[14px]">{profile.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#5f5e5e]">
                          <span className="material-symbols-outlined text-[20px]">
                            call
                          </span>
                          <span className="text-[14px]">{profile.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#5f5e5e]">
                          <span className="material-symbols-outlined text-[20px]">
                            location_on
                          </span>
                          <span className="text-[14px]">
                            {profile.location}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[#5f5e5e]">
                          <span className="material-symbols-outlined text-[20px]">
                            schedule
                          </span>
                          <span className="text-[14px]">
                            {profile.memberSince}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="space-y-6 lg:col-span-4">
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
                          onChange={(e) =>
                            handleProfileChange("bio", e.target.value)
                          }
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
                          <span className="material-symbols-outlined text-[#5f5e5e]">
                            link
                          </span>
                          <input
                            className="flex-1 border-none bg-transparent p-0 text-[14px] outline-none"
                          value={profile.github}
                          onChange={(e) =>
                            handleProfileChange("github", e.target.value)
                          }
                          type="text"
                          disabled={!canEditProfile}
                        />
                        </div>
                        <div className="flex items-center gap-3 rounded border border-[#e2dfde] bg-white px-3 py-2">
                          <span className="material-symbols-outlined text-[#5f5e5e]">
                            group
                          </span>
                          <input
                            className="flex-1 border-none bg-transparent p-0 text-[14px] outline-none"
                          value={profile.linkedin}
                          onChange={(e) =>
                            handleProfileChange("linkedin", e.target.value)
                          }
                          type="text"
                          disabled={!canEditProfile}
                        />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

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
                        selectedLabelByValue={skills.reduce<Record<string, string>>((acc, skill) => {
                          acc[skill.id] = skill.label;
                          return acc;
                        }, {})}
                        selectedValues={skills.filter((skill) => skill.active).map((skill) => skill.id)}
                        onAdd={handleAddSkill}
                        onRemove={handleRemoveSkill}
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
                                  <p className="text-[14px] font-semibold text-[#1a1c1c]">{skill.label}</p>
                                  <p className="text-[12px] text-[#5f5e5e]">Số năm kinh nghiệm cho kỹ năng này</p>
                                </div>
                                <input
                                  className="w-full rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c] md:w-[180px]"
                                  inputMode="decimal"
                                  placeholder="VD: 1.5"
                                  type="text"
                                  value={skill.yearsOfExperience ?? ""}
                                  onChange={(e) => handleSkillYearsChange(skill.id, e.target.value)}
                                />
                              </div>
                            ))}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {skills.filter((skill) => skill.active).map((skill) => (
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
              </div>

              <div className="space-y-6 lg:col-span-8">
                <section className="rounded-lg border border-[#e2dfde] bg-white p-6">
                  <div className="mb-6 flex items-center justify-between gap-3">
                    <h2 className="border-l-4 border-[#b90014] pl-4 text-[20px] font-semibold">
                      CV &amp; Phân tích hồ sơ
                    </h2>
                    {resumeFile ? (
                      <button
                        className="rounded-full border border-[#b90014]/20 bg-[#fff4f6] px-4 py-2 text-[12px] font-semibold text-[#b90014] transition-colors hover:bg-[#ffe7ec]"
                        type="button"
                        onClick={() => setResumeFile(null)}
                      >
                        Bỏ file đã chọn
                      </button>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                    <div className="rounded-[24px] border border-[#e2dfde] bg-[linear-gradient(135deg,#fffdfd_0%,#fff5f6_52%,#fdfdfd_100%)] p-5 shadow-[0_20px_45px_rgba(185,0,20,0.06)]">
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#b90014]/10">
                        <span className="material-symbols-outlined text-[32px] text-[#b90014]">
                          picture_as_pdf
                        </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-[18px] font-semibold text-[#1a1c1c]">
                              {resumeMeta?.fileName ?? "Chưa có CV chính thức"}
                            </p>
                            {resumeMeta?.isCurrent ? (
                              <span className="rounded-full bg-[#b90014] px-3 py-1 text-[11px] font-semibold text-white">
                                CV đang dùng
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-[13px] leading-6 text-[#5f5e5e]">
                            {resumeMeta?.uploadedAt
                              ? `Cập nhật lần cuối ngày ${formatSimpleDate(resumeMeta.uploadedAt)}. Đây là bản CV hệ thống sẽ ưu tiên khi bạn ứng tuyển.`
                              : "Tải CV mới nhất để hệ thống nhận diện đúng kinh nghiệm, kỹ năng và hỗ trợ điền hồ sơ nhanh hơn."}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2 text-[12px] font-semibold">
                            <span className="rounded-full border border-[#e8d7da] bg-white px-3 py-1 text-[#7b2130]">
                              {resumeMeta ? `Phiên bản v${resumeMeta.version}` : "PDF, DOC, DOCX"}
                            </span>
                            <span className="rounded-full border border-[#e8d7da] bg-white px-3 py-1 text-[#7b2130]">
                              Parse sang hồ sơ cấu trúc
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <button
                          className="inline-flex items-center gap-2 rounded-full border border-[#e2dfde] bg-white px-4 py-2 text-[13px] font-semibold text-[#1a1c1c] transition-colors hover:border-[#b90014] hover:text-[#b90014] disabled:cursor-not-allowed disabled:opacity-60"
                          type="button"
                          disabled={!resumeMeta?.fileUrl}
                          onClick={() => {
                            if (resumeMeta?.fileUrl) {
                              window.open(resumeMeta.fileUrl, "_blank", "noopener,noreferrer");
                            }
                          }}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            visibility
                          </span>
                          Xem CV
                        </button>
                        <PermissionGuard permissions={PERMISSIONS.CANDIDATE_UPLOAD_OWN_RESUME}>
                          <button
                            className="inline-flex items-center gap-2 rounded-full border border-[#e2dfde] bg-white px-4 py-2 text-[13px] font-semibold text-[#1a1c1c] transition-colors hover:border-[#b90014] hover:text-[#b90014] disabled:cursor-not-allowed disabled:opacity-60"
                            type="button"
                            disabled={!resumeMeta?.fileUrl}
                            onClick={() => {
                              if (resumeMeta?.fileUrl) {
                                window.open(resumeMeta.fileUrl, "_blank", "noopener,noreferrer");
                              }
                            }}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              download
                            </span>
                            Tải xuống
                          </button>
                        </PermissionGuard>
                      </div>
                    </div>

                    <div className={`relative ${canManageResume ? "" : "pointer-events-none opacity-60"}`}>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleResumeFileChange}
                        disabled={!canManageResume}
                      />

                      <button
                        className="flex min-h-[188px] w-full flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-[#d9d6d5] bg-[#faf7f7] px-6 text-center transition-colors hover:border-[#b90014] hover:bg-[#fff7f8]"
                        type="button"
                      >
                        <span className="material-symbols-outlined mb-3 text-[36px] text-[#b90014]">
                          cloud_upload
                        </span>
                        <span className="text-[15px] font-semibold text-[#1a1c1c]">
                          {resumeFile ? "Đã chọn CV mới" : "Kéo thả hoặc bấm để tải CV"}
                        </span>
                        <span className="mt-2 text-[13px] leading-6 text-[#5f5e5e]">
                          {resumeFile
                            ? resumeFile.name
                            : "Ưu tiên CV định dạng như ứng viên gửi thực tế để kết quả parse sát hơn."}
                        </span>
                        <span className="mt-4 rounded-full bg-white px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7b2130]">
                          PDF, DOC, DOCX
                        </span>
                      </button>
                    </div>
                  </div>

                  {resumeFile ? (
                    <div className="mt-5 rounded-[20px] border border-[#f1d7db] bg-[#fff8f8] p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="text-[15px] font-semibold text-[#b90014]">
                            Xem trước dữ liệu CV trước khi ghi vào hồ sơ
                          </p>
                          <p className="mt-1 text-[13px] leading-6 text-[#7a4b53]">
                            Hệ thống sẽ trích xuất nội dung theo cấu trúc CV thực tế để bạn rà soát, đối chiếu và chỉ áp dụng khi thấy hợp lý.
                          </p>
                        </div>
                        <button
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#b90014] px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                          type="button"
                          disabled={isParsingResume}
                          onClick={handleParseResume}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            psychiatry
                          </span>
                          {isParsingResume ? "Đang phân tích CV..." : "Phân tích CV"}
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {parsedResumePreview ? (
                    <div className="mt-6 rounded-[28px] border border-[#f1d7db] bg-[linear-gradient(180deg,#fff7f8_0%,#ffffff_100%)] p-4 shadow-[0_24px_60px_rgba(185,0,20,0.10)] md:p-6">
                      <div className="rounded-[24px] border border-[#f3e4e7] bg-white p-5 md:p-7">
                        <div className="flex flex-col gap-5 border-b border-[#f0e4e6] pb-6 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1 rounded-full border border-[#f1d7db] bg-[#fff7f8] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#b90014]">
                                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                                {parsedResumePreview.usedAi ? "AI Parsing" : parsedResumePreview.parsingMode}
                              </span>
                              {parsedResumePreview.modelName ? (
                                <span className="rounded-full bg-[#fff0f2] px-3 py-1 text-[11px] font-semibold text-[#7a4b53]">
                                  {parsedResumePreview.modelName}
                                </span>
                              ) : null}
                              <span className="rounded-full bg-[#ffe8ec] px-3 py-1 text-[11px] font-semibold text-[#8a1020]">
                                Bản nháp từ CV
                              </span>
                            </div>

                            <h3 className="text-[28px] font-semibold leading-9 tracking-[-0.02em] text-[#301419]">
                              {parsedResumePreview.profile.name || "Ứng viên chưa rõ tên"}
                            </h3>
                            <p className="mt-2 text-[17px] font-medium text-[#b90014]">
                              {parsedResumePreview.profile.headline || "Chưa nhận diện được headline nghề nghiệp"}
                            </p>

                            <div className="mt-4 flex flex-wrap gap-2 text-[12px] text-[#7a4b53]">
                              {parsedResumePreview.profile.email ? (
                                <span className="rounded-full border border-[#f0e4e6] bg-[#fff9fa] px-3 py-1">
                                  {parsedResumePreview.profile.email}
                                </span>
                              ) : null}
                              {parsedResumePreview.profile.phone ? (
                                <span className="rounded-full border border-[#f0e4e6] bg-[#fff9fa] px-3 py-1">
                                  {parsedResumePreview.profile.phone}
                                </span>
                              ) : null}
                              {parsedResumePreview.profile.location ? (
                                <span className="rounded-full border border-[#f0e4e6] bg-[#fff9fa] px-3 py-1">
                                  {parsedResumePreview.profile.location}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div className="w-full max-w-[320px] rounded-[20px] border border-[#f1d7db] bg-[#fff8f8] p-4">
                            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#7a4b53]">
                              Tình trạng parse
                            </p>
                            {!parsedResumePreview.usedAi && parsedResumePreview.aiFallbackReason ? (
                              <div className="mt-3 rounded-xl border border-[#ffd7dc] bg-[#fff4f6] px-4 py-3 text-[13px] leading-6 text-[#8a1020]">
                                AI chưa được áp dụng ở lượt này: {parsedResumePreview.aiFallbackReason}
                              </div>
                            ) : (
                              <p className="mt-3 text-[13px] leading-6 text-[#7a4b53]">
                                Dữ liệu đã được tách thành các khối giống CV tiêu chuẩn để bạn kiểm tra nhanh trước khi cập nhật hồ sơ chính thức.
                              </p>
                            )}

                            <div className="mt-4 space-y-2">
                              <button
                                className="w-full rounded-full bg-[#b90014] px-5 py-2.5 text-[12px] font-semibold text-white transition-colors hover:brightness-110"
                                type="button"
                                onClick={() => applyParsedResumeToForm(parsedResumePreview)}
                              >
                                Áp dụng vào biểu mẫu
                              </button>
                              <button
                                className="w-full rounded-full border border-[#e7c8cd] bg-white px-5 py-2.5 text-[12px] font-semibold text-[#8a1020] transition-colors hover:bg-[#fff4f6]"
                                type="button"
                                onClick={() => setParsedResumePreview(null)}
                              >
                                Đóng bản parse
                              </button>
                            </div>
                          </div>
                        </div>

                        {parsedResumePreview.notes.length ? (
                          <div className="mt-5 flex flex-wrap gap-2">
                            {parsedResumePreview.notes.map((note) => (
                              <span
                                key={note}
                                className="inline-flex rounded-full border border-[#f1d7db] bg-[#fff7f8] px-3 py-1 text-[12px] font-medium text-[#b90014]"
                              >
                                {note}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-2xl border border-[#e5edf3] bg-[#fbfdff] p-4">
                            <p className="text-[12px] uppercase tracking-[0.08em] text-[#6c8191]">Kỹ năng</p>
                            <p className="mt-2 text-[24px] font-semibold text-[#18364a]">
                              {parsedResumePreview.skills.length}
                            </p>
                            <p className="mt-1 text-[12px] text-[#5f7280]">
                              {getCountLabel(parsedResumePreview.skills.length, "mục được nhận diện")}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-[#e5edf3] bg-[#fbfdff] p-4">
                            <p className="text-[12px] uppercase tracking-[0.08em] text-[#6c8191]">Kinh nghiệm</p>
                            <p className="mt-2 text-[24px] font-semibold text-[#18364a]">
                              {parsedResumePreview.experienceEntries.length}
                            </p>
                            <p className="mt-1 text-[12px] text-[#5f7280]">
                              {getCountLabel(parsedResumePreview.experienceEntries.length, "vai trò công việc")}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-[#e5edf3] bg-[#fbfdff] p-4">
                            <p className="text-[12px] uppercase tracking-[0.08em] text-[#6c8191]">Dự án</p>
                            <p className="mt-2 text-[24px] font-semibold text-[#18364a]">
                              {parsedResumePreview.projects.length}
                            </p>
                            <p className="mt-1 text-[12px] text-[#5f7280]">
                              {getCountLabel(parsedResumePreview.projects.length, "dự án liên quan")}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-[#e5edf3] bg-[#fbfdff] p-4">
                            <p className="text-[12px] uppercase tracking-[0.08em] text-[#6c8191]">Học vấn</p>
                            <p className="mt-2 text-[24px] font-semibold text-[#18364a]">
                              {parsedResumePreview.educations.length}
                            </p>
                            <p className="mt-1 text-[12px] text-[#5f7280]">
                              {getCountLabel(parsedResumePreview.educations.length, "chương trình đào tạo")}
                            </p>
                          </div>
                        </div>

                        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.95fr)]">
                          <div className="space-y-7">
                            <section>
                              <div className="flex items-center gap-3">
                                <div className="h-[2px] flex-1 bg-[#dbe8f2]" />
                                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#6c8191]">
                                  Tóm tắt nghề nghiệp
                                </p>
                              </div>
                              <p className="mt-4 text-[14px] leading-7 text-[#314956]">
                                {parsedResumePreview.profile.bio ||
                                  "Chưa trích xuất được phần giới thiệu rõ ràng từ CV này. Bạn có thể áp dụng bản nháp rồi bổ sung thêm trong biểu mẫu."}
                              </p>
                            </section>

                            <section>
                              <div className="flex items-center gap-3">
                                <div className="h-[2px] flex-1 bg-[#dbe8f2]" />
                                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#6c8191]">
                                  Kinh nghiệm làm việc
                                </p>
                              </div>
                              <div className="mt-5 space-y-5">
                                {parsedResumePreview.experienceEntries.length ? (
                                  parsedResumePreview.experienceEntries.map((entry) => (
                                    <article
                                      key={entry.id}
                                      className="relative border-l-2 border-[#f1d7db] pl-5"
                                    >
                                      <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-[#b90014]" />
                                      <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
                                        <div>
                                          <h4 className="text-[17px] font-semibold text-[#18364a]">
                                            {entry.title}
                                          </h4>
                                          <p className="text-[14px] font-medium text-[#b90014]">
                                            {entry.company}
                                          </p>
                                        </div>
                                        <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#6c8191]">
                                          {formatDateRange(entry.period)}
                                        </p>
                                      </div>
                                      <div className="mt-3 space-y-2">
                                        {entry.bullets.map((bullet, index) => (
                                          <p
                                            key={`${entry.id}-${index}`}
                                            className="text-[14px] leading-7 text-[#314956]"
                                          >
                                            {bullet}
                                          </p>
                                        ))}
                                      </div>
                                    </article>
                                  ))
                                ) : (
                                  <p className="text-[14px] leading-6 text-[#6c8191]">
                                    Chưa nhận diện được kinh nghiệm làm việc từ CV này.
                                  </p>
                                )}
                              </div>
                            </section>

                            <section>
                              <div className="flex items-center gap-3">
                                <div className="h-[2px] flex-1 bg-[#dbe8f2]" />
                                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#6c8191]">
                                  Dự án nổi bật
                                </p>
                              </div>
                              <div className="mt-5 grid gap-4">
                                {parsedResumePreview.projects.length ? (
                                  parsedResumePreview.projects.map((project) => (
                                    <article
                                      key={project.id}
                                      className="rounded-2xl border border-[#e5edf3] bg-[#fbfdff] p-4"
                                    >
                                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                        <div>
                                          <h4 className="text-[16px] font-semibold text-[#18364a]">
                                            {project.name}
                                          </h4>
                                          <p className="text-[13px] font-medium text-[#b90014]">
                                            {project.role || "Vai trò chưa rõ"}
                                          </p>
                                        </div>
                                        <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#6c8191]">
                                          {formatDateRange(project.period)}
                                        </p>
                                      </div>
                                      {project.description ? (
                                        renderRichBulletText(project.description)
                                      ) : (
                                        <p className="mt-3 text-[14px] leading-7 text-[#314956]">
                                          Chưa có mô tả chi tiết dự án.
                                        </p>
                                      )}
                                      {project.technologies.length ? (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                          {project.technologies.map((technology) => (
                                            <span
                                              key={`${project.id}-${technology}`}
                                              className="rounded-full border border-[#dce9f2] bg-white px-3 py-1 text-[12px] font-medium text-[#47657a]"
                                            >
                                              {technology}
                                            </span>
                                          ))}
                                        </div>
                                      ) : null}
                                    </article>
                                  ))
                                ) : (
                                  <p className="text-[14px] leading-6 text-[#6c8191]">
                                    Chưa có dự án nào được nhận diện từ CV.
                                  </p>
                                )}
                              </div>
                            </section>

                            <section>
                              <div className="flex items-center gap-3">
                                <div className="h-[2px] flex-1 bg-[#dbe8f2]" />
                                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#6c8191]">
                                  Học vấn &amp; chứng chỉ
                                </p>
                              </div>
                              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                                <div className="space-y-4">
                                  {parsedResumePreview.educations.length ? (
                                    parsedResumePreview.educations.map((education) => (
                                      <article
                                        key={education.id}
                                        className="rounded-2xl border border-[#e5edf3] bg-[#fbfdff] p-4"
                                      >
                                        <p className="text-[16px] font-semibold text-[#18364a]">
                                          {education.school}
                                        </p>
                                        <p className="mt-1 text-[14px] font-medium text-[#b90014]">
                                          {education.degree}
                                          {education.fieldOfStudy ? ` • ${education.fieldOfStudy}` : ""}
                                        </p>
                                        <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#6c8191]">
                                          {formatMonthYear(null, education.startYear)} - {education.endYear ? formatMonthYear(null, education.endYear) : "Hiện tại"}
                                        </p>
                                        {renderRichBulletText(education.description)}
                                      </article>
                                    ))
                                  ) : (
                                    <p className="text-[14px] leading-6 text-[#6c8191]">
                                      Chưa trích xuất được phần học vấn.
                                    </p>
                                  )}
                                </div>

                                <div className="space-y-4">
                                  {parsedResumePreview.certifications.length ? (
                                    parsedResumePreview.certifications.map((certification) => (
                                      <article
                                        key={certification.id}
                                        className="rounded-2xl border border-[#e5edf3] bg-[#fbfdff] p-4"
                                      >
                                        <p className="text-[16px] font-semibold text-[#18364a]">
                                          {certification.name}
                                        </p>
                                        <p className="mt-1 text-[14px] font-medium text-[#b90014]">
                                          {certification.issuer || "Đơn vị cấp chưa rõ"}
                                        </p>
                                        <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#6c8191]">
                                          Cấp ngày {formatSimpleDate(certification.issuedOn)}
                                          {certification.expiresOn ? ` • Hết hạn ${formatSimpleDate(certification.expiresOn)}` : ""}
                                        </p>
                                        {certification.credentialId ? (
                                          <p className="mt-3 text-[13px] text-[#47657a]">
                                            Credential ID: {certification.credentialId}
                                          </p>
                                        ) : null}
                                      </article>
                                    ))
                                  ) : (
                                    <p className="text-[14px] leading-6 text-[#6c8191]">
                                      Chưa thấy chứng chỉ nào trong bản parse này.
                                    </p>
                                  )}
                                </div>
                              </div>
                            </section>
                          </div>

                          <aside className="space-y-5">
                            <section className="rounded-[22px] border border-[#e5edf3] bg-[#fbfdff] p-5">
                              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6c8191]">
                                Kỹ năng chính
                              </p>
                              <div className="mt-4 flex flex-wrap gap-2">
                                {parsedResumePreview.skills.length ? (
                                  parsedResumePreview.skills.map((skill) => (
                                    <span
                                      key={skill.id}
                                      className="rounded-full border border-[#dce9f2] bg-white px-3 py-1.5 text-[12px] font-medium text-[#18364a]"
                                    >
                                      {skill.label}
                                      {skill.yearsOfExperience != null ? ` • ${skill.yearsOfExperience} năm` : ""}
                                    </span>
                                  ))
                                ) : (
                                  <p className="text-[14px] leading-6 text-[#6c8191]">
                                    Chưa có kỹ năng nào được nhận diện.
                                  </p>
                                )}
                              </div>
                            </section>

                            <section className="rounded-[22px] border border-[#e5edf3] bg-[#fbfdff] p-5">
                              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6c8191]">
                                Ngoại ngữ
                              </p>
                              <div className="mt-4 space-y-3">
                                {parsedResumePreview.languages.length ? (
                                  parsedResumePreview.languages.map((language) => (
                                    <div
                                      key={language.id}
                                      className="rounded-2xl border border-[#dce9f2] bg-white px-4 py-3"
                                    >
                                      <p className="text-[14px] font-semibold text-[#18364a]">
                                        {language.name}
                                      </p>
                                      <p className="mt-1 text-[12px] font-medium uppercase tracking-[0.06em] text-[#47657a]">
                                        {language.proficiency}
                                      </p>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-[14px] leading-6 text-[#6c8191]">
                                    Chưa trích xuất được mục ngoại ngữ.
                                  </p>
                                )}
                              </div>
                            </section>

                            <section className="rounded-[22px] border border-[#e5edf3] bg-[#fbfdff] p-5">
                              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6c8191]">
                                Liên kết &amp; nguồn trích xuất
                              </p>
                              <div className="mt-4 space-y-3 text-[13px] leading-6 text-[#314956]">
                                <div className="rounded-2xl border border-[#dce9f2] bg-white px-4 py-3">
                                  <p className="font-semibold text-[#18364a]">GitHub</p>
                                  <p>{parsedResumePreview.profile.github || "Chưa nhận diện"}</p>
                                </div>
                                <div className="rounded-2xl border border-[#dce9f2] bg-white px-4 py-3">
                                  <p className="font-semibold text-[#18364a]">LinkedIn</p>
                                  <p>{parsedResumePreview.profile.linkedin || "Chưa nhận diện"}</p>
                                </div>
                              </div>
                            </section>

                          </aside>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {resumeHistory.length ? (
                    <div className="mt-6 space-y-3">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5f5e5e]">
                        Lịch sử CV
                      </p>
                      {resumeHistory.map((resume) => (
                        <a
                          key={resume.id}
                          className="flex items-center justify-between rounded border border-[#e2dfde] bg-white px-4 py-3 hover:border-[#b90014]"
                          href={resume.fileUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <div>
                            <p className="text-[14px] font-semibold text-[#1a1c1c]">
                              v{resume.version} • {resume.fileName}
                            </p>
                            <p className="text-[12px] text-[#5f5e5e]">
                              {new Date(resume.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="text-[12px] font-semibold text-[#b90014]">
                            {resume.isCurrent ? "Đang dùng" : "Mở"}
                          </span>
                        </a>
                      ))}
                    </div>
                  ) : null}
                </section>

                <section className="rounded-lg border border-[#e2dfde] bg-white p-6">
                  <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="border-l-4 border-[#b90014] pl-4 text-[20px] font-semibold">
                      Work Experience
                    </h2>
                    <PermissionGuard permissions={PERMISSIONS.CANDIDATE_CREATE_OWN_EXPERIENCE}>
                      <button
                        className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#b90014] hover:underline"
                        type="button"
                        onClick={() => setShowEntryComposer((value) => !value)}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          add_circle
                        </span>
                        Add Entry
                      </button>
                    </PermissionGuard>
                  </div>

                  {showEntryComposer && canManageExperience ? (
                    <div className="mb-8 space-y-3 rounded border border-[#e2dfde] bg-[#f3f3f3] p-4">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <input
                          className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                          placeholder="Title"
                          value={entryDraft.title}
                          onChange={(e) =>
                            setEntryDraft((prev) => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                        />
                        <input
                          className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                          placeholder="Company / School"
                          value={entryDraft.company}
                          onChange={(e) =>
                            setEntryDraft((prev) => ({
                              ...prev,
                              company: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <CommonSelect
                          value={String(entryDraft.startMonth)}
                          options={monthOptions.map((month, index) => ({
                            label: month,
                            value: String(index + 1),
                          }))}
                          onValueChange={(value) =>
                            setEntryDraft((prev) => ({
                              ...prev,
                              startMonth: Number(value),
                            }))
                          }
                          className="h-11 rounded-none border border-[#e2dfde] bg-white text-[14px] shadow-none focus:border-[#1a1c1c]"
                          menuClassName="border-[#e2dfde]"
                        />
                        <input
                          className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                          min={2000}
                          max={new Date().getFullYear() + 1}
                          placeholder="Start year"
                          type="number"
                          value={entryDraft.startYear}
                          onChange={(e) =>
                            setEntryDraft((prev) => ({
                              ...prev,
                              startYear: Number(e.target.value),
                            }))
                          }
                        />
                        <label className="col-span-2 flex items-center gap-2 rounded border border-[#e2dfde] bg-white px-3 py-2 text-[14px] font-semibold text-[#1a1c1c] md:col-span-1">
                          <input
                            checked={entryDraft.isCurrent}
                            className="h-4 w-4 accent-[#b90014]"
                            type="checkbox"
                            onChange={(e) =>
                              setEntryDraft((prev) => ({
                                ...prev,
                                isCurrent: e.target.checked,
                              }))
                            }
                          />
                          Present
                        </label>
                        {entryDraft.isCurrent ? null : (
                          <>
                            <CommonSelect
                              value={String(entryDraft.endMonth)}
                              options={monthOptions.map((month, index) => ({
                                label: month,
                                value: String(index + 1),
                              }))}
                              onValueChange={(value) =>
                                setEntryDraft((prev) => ({
                                  ...prev,
                                  endMonth: Number(value),
                                }))
                              }
                              className="h-11 rounded-none border border-[#e2dfde] bg-white text-[14px] shadow-none focus:border-[#1a1c1c]"
                              menuClassName="border-[#e2dfde]"
                            />
                            <input
                              className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                              min={2000}
                              max={new Date().getFullYear() + 1}
                              placeholder="End year"
                              type="number"
                              value={entryDraft.endYear}
                              onChange={(e) =>
                                setEntryDraft((prev) => ({
                                  ...prev,
                                  endYear: Number(e.target.value),
                                }))
                              }
                            />
                          </>
                        )}
                      </div>
                      <textarea
                        className="min-h-[96px] w-full rounded-none border border-[#e2dfde] bg-white p-3 text-[14px] outline-none focus:border-[#1a1c1c]"
                        placeholder="Write each bullet on a new line"
                        value={entryDraft.bullets}
                        onChange={(e) =>
                          setEntryDraft((prev) => ({
                            ...prev,
                            bullets: e.target.value,
                          }))
                        }
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          className="rounded border border-[#1a1c1c] px-4 py-2 text-[12px] font-semibold"
                          type="button"
                          onClick={() => setShowEntryComposer(false)}
                        >
                          Cancel
                        </button>
                        <button
                          className="rounded bg-[#b90014] px-4 py-2 text-[12px] font-semibold text-white"
                          type="button"
                          onClick={handleAddEntry}
                        >
                          Add Entry
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div className="relative space-y-12 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#e2dfde]">
                    {experienceEntries.map((entry, index) => (
                      <div key={entry.id} className="relative pl-10">
                        <div
                          className={`absolute left-0 top-1 z-10 h-6 w-6 rounded-full border-4 border-[#f9f9f9] ${
                            index === experienceEntries.length - 1
                              ? "bg-[#c8c6c5]"
                              : index === 1
                                ? "bg-[#1a1c1c]"
                                : "bg-[#b90014]"
                          }`}
                        />
                        <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <h3 className="text-[16px] font-bold text-[#1a1c1c]">
                            {entry.title}
                          </h3>
                          <span className="rounded bg-[#e2dfde] px-2 py-1 text-[12px] font-semibold text-[#636262]">
                            {formatPeriod(entry.period)}
                          </span>
                        </div>
                        <p className="mb-2 text-[14px] font-semibold text-[#b90014]">
                          {entry.company}
                        </p>
                        <ul className="list-inside list-disc space-y-1 text-[14px] text-[#5f5e5e]">
                          {entry.bullets.map((bullet) => (
                            <li key={bullet}>{bullet}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-[#e2dfde] bg-white p-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="border-l-4 border-[#b90014] pl-4 text-[20px] font-semibold">
                          Projects
                        </h2>
                        {canEditProfile ? (
                          <button
                            className="text-[12px] font-semibold text-[#b90014] hover:underline"
                            type="button"
                            onClick={() => setShowProjectComposer((value) => !value)}
                          >
                            {showProjectComposer ? "Đóng" : "Add Entry"}
                          </button>
                        ) : null}
                      </div>
                      {showProjectComposer && canEditProfile ? (
                        <div className="mt-4 space-y-3 rounded border border-[#e2dfde] bg-[#f9f4f4] p-4">
                          <input
                            className="w-full rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                            placeholder="Tên dự án"
                            value={projectDraft.name}
                            onChange={(e) => setProjectDraft((prev) => ({ ...prev, name: e.target.value }))}
                          />
                          <input
                            className="w-full rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                            placeholder="Vai trò"
                            value={projectDraft.role}
                            onChange={(e) => setProjectDraft((prev) => ({ ...prev, role: e.target.value }))}
                          />
                          <textarea
                            className="min-h-[90px] w-full rounded-none border border-[#e2dfde] bg-white p-3 text-[14px] outline-none focus:border-[#1a1c1c]"
                            placeholder="Mô tả dự án"
                            value={projectDraft.description}
                            onChange={(e) => setProjectDraft((prev) => ({ ...prev, description: e.target.value }))}
                          />
                          <input
                            className="w-full rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                            placeholder="Technologies, phân tách bằng dấu phẩy"
                            value={projectDraft.technologies}
                            onChange={(e) => setProjectDraft((prev) => ({ ...prev, technologies: e.target.value }))}
                          />
                          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                            <CommonSelect
                              value={String(projectDraft.startMonth)}
                              options={monthOptions.map((month, index) => ({ label: month, value: String(index + 1) }))}
                              onValueChange={(value) => setProjectDraft((prev) => ({ ...prev, startMonth: Number(value) }))}
                              className="h-11 rounded-none border border-[#e2dfde] bg-white text-[14px] shadow-none focus:border-[#1a1c1c]"
                              menuClassName="border-[#e2dfde]"
                            />
                            <input
                              className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                              type="number"
                              value={projectDraft.startYear}
                              onChange={(e) => setProjectDraft((prev) => ({ ...prev, startYear: Number(e.target.value) }))}
                            />
                            <label className="col-span-2 flex items-center gap-2 rounded border border-[#e2dfde] bg-white px-3 py-2 text-[14px] font-semibold text-[#1a1c1c] md:col-span-1">
                              <input
                                checked={projectDraft.isCurrent}
                                className="h-4 w-4 accent-[#b90014]"
                                type="checkbox"
                                onChange={(e) => setProjectDraft((prev) => ({ ...prev, isCurrent: e.target.checked }))}
                              />
                              Current
                            </label>
                            {projectDraft.isCurrent ? null : (
                              <>
                                <CommonSelect
                                  value={String(projectDraft.endMonth)}
                                  options={monthOptions.map((month, index) => ({ label: month, value: String(index + 1) }))}
                                  onValueChange={(value) => setProjectDraft((prev) => ({ ...prev, endMonth: Number(value) }))}
                                  className="h-11 rounded-none border border-[#e2dfde] bg-white text-[14px] shadow-none focus:border-[#1a1c1c]"
                                  menuClassName="border-[#e2dfde]"
                                />
                                <input
                                  className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                                  type="number"
                                  value={projectDraft.endYear}
                                  onChange={(e) => setProjectDraft((prev) => ({ ...prev, endYear: Number(e.target.value) }))}
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
                              Cancel
                            </button>
                            <button
                              className="rounded bg-[#b90014] px-4 py-2 text-[12px] font-semibold text-white"
                              type="button"
                              onClick={handleAddProject}
                            >
                              Add Entry
                            </button>
                          </div>
                        </div>
                      ) : null}
                      <div className="mt-4 space-y-3">
                        {projects.length ? projects.map((project) => (
                          <div key={project.id} className="rounded border border-[#e2dfde] bg-[#f9f9f9] p-4">
                            <p className="text-[15px] font-semibold text-[#1a1c1c]">{project.name}</p>
                            <p className="mt-1 text-[13px] font-medium text-[#b90014]">{project.role || "Project"}</p>
                            {project.description ? (
                              <p className="mt-2 text-[13px] leading-6 text-[#5f5e5e]">{project.description}</p>
                            ) : null}
                            {project.technologies.length ? (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {project.technologies.map((technology) => (
                                  <span key={technology} className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-[#1a1c1c]">
                                    {technology}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        )) : (
                          <p className="text-[14px] text-[#5f5e5e]">Chưa có project nào trong hồ sơ.</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="border-l-4 border-[#b90014] pl-4 text-[20px] font-semibold">
                          Education
                        </h2>
                        {canEditProfile ? (
                          <button
                            className="text-[12px] font-semibold text-[#b90014] hover:underline"
                            type="button"
                            onClick={() => setShowEducationComposer((value) => !value)}
                          >
                            {showEducationComposer ? "Đóng" : "Add Entry"}
                          </button>
                        ) : null}
                      </div>
                      {showEducationComposer && canEditProfile ? (
                        <div className="mt-4 space-y-3 rounded border border-[#e2dfde] bg-[#f9f4f4] p-4">
                          <input
                            className="w-full rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                            placeholder="Trường học"
                            value={educationDraft.school}
                            onChange={(e) => setEducationDraft((prev) => ({ ...prev, school: e.target.value }))}
                          />
                          <input
                            className="w-full rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                            placeholder="Bằng cấp"
                            value={educationDraft.degree}
                            onChange={(e) => setEducationDraft((prev) => ({ ...prev, degree: e.target.value }))}
                          />
                          <input
                            className="w-full rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                            placeholder="Chuyên ngành"
                            value={educationDraft.fieldOfStudy}
                            onChange={(e) => setEducationDraft((prev) => ({ ...prev, fieldOfStudy: e.target.value }))}
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                              placeholder="Năm bắt đầu"
                              value={educationDraft.startYear}
                              onChange={(e) => setEducationDraft((prev) => ({ ...prev, startYear: e.target.value }))}
                            />
                            <input
                              className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                              placeholder="Năm kết thúc"
                              value={educationDraft.endYear}
                              onChange={(e) => setEducationDraft((prev) => ({ ...prev, endYear: e.target.value }))}
                            />
                          </div>
                          <textarea
                            className="min-h-[90px] w-full rounded-none border border-[#e2dfde] bg-white p-3 text-[14px] outline-none focus:border-[#1a1c1c]"
                            placeholder="Mô tả thêm"
                            value={educationDraft.description}
                            onChange={(e) => setEducationDraft((prev) => ({ ...prev, description: e.target.value }))}
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              className="rounded border border-[#1a1c1c] px-4 py-2 text-[12px] font-semibold"
                              type="button"
                              onClick={() => setShowEducationComposer(false)}
                            >
                              Cancel
                            </button>
                            <button
                              className="rounded bg-[#b90014] px-4 py-2 text-[12px] font-semibold text-white"
                              type="button"
                              onClick={handleAddEducation}
                            >
                              Add Entry
                            </button>
                          </div>
                        </div>
                      ) : null}
                      <div className="mt-4 space-y-3">
                        {educations.length ? educations.map((education) => (
                          <div key={education.id} className="rounded  p-4">
                            <p className="text-[15px] font-semibold text-[#1a1c1c]">{education.school}</p>
                            <p className="mt-1 text-[13px] font-medium text-[#b90014]">
                              {education.degree}
                              {education.fieldOfStudy ? ` • ${education.fieldOfStudy}` : ""}
                            </p>
                            <p className=" text-[14px] text-[#5f5e5e]">
                              {[education.startYear, education.endYear].filter(Boolean).join(" - ") || "Chưa rõ mốc thời gian"}
                            </p>
                            {education.description ? (
                              <p className="mt-2 text-[14px] leading-6 text-[#5f5e5e]">{education.description}</p>
                            ) : null}
                          </div>
                        )) : (
                          <p className="text-[14px] text-[#5f5e5e]">Chưa có dữ liệu học vấn trong hồ sơ.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 grid gap-6 md:grid-cols-2">
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="border-l-4 border-[#b90014] pl-4 text-[20px] font-semibold">
                          Certifications
                        </h2>
                        {canEditProfile ? (
                          <button
                            className="text-[12px] font-semibold text-[#b90014] hover:underline"
                            type="button"
                            onClick={() => setShowCertificationComposer((value) => !value)}
                          >
                            {showCertificationComposer ? "Đóng" : "Add Entry"}
                          </button>
                        ) : null}
                      </div>
                      {showCertificationComposer && canEditProfile ? (
                        <div className="mt-4 space-y-3 rounded border border-[#e2dfde] bg-[#f9f4f4] p-4">
                          <input
                            className="w-full rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                            placeholder="Tên chứng chỉ"
                            value={certificationDraft.name}
                            onChange={(e) => setCertificationDraft((prev) => ({ ...prev, name: e.target.value }))}
                          />
                          <input
                            className="w-full rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                            placeholder="Đơn vị cấp"
                            value={certificationDraft.issuer}
                            onChange={(e) => setCertificationDraft((prev) => ({ ...prev, issuer: e.target.value }))}
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                              type="date"
                              value={certificationDraft.issuedOn}
                              onChange={(e) => setCertificationDraft((prev) => ({ ...prev, issuedOn: e.target.value }))}
                            />
                            <input
                              className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                              type="date"
                              value={certificationDraft.expiresOn}
                              onChange={(e) => setCertificationDraft((prev) => ({ ...prev, expiresOn: e.target.value }))}
                            />
                          </div>
                          <input
                            className="w-full rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                            placeholder="Credential ID"
                            value={certificationDraft.credentialId}
                            onChange={(e) => setCertificationDraft((prev) => ({ ...prev, credentialId: e.target.value }))}
                          />
                          <input
                            className="w-full rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                            placeholder="Credential URL"
                            value={certificationDraft.credentialUrl}
                            onChange={(e) => setCertificationDraft((prev) => ({ ...prev, credentialUrl: e.target.value }))}
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              className="rounded border border-[#1a1c1c] px-4 py-2 text-[12px] font-semibold"
                              type="button"
                              onClick={() => setShowCertificationComposer(false)}
                            >
                              Cancel
                            </button>
                            <button
                              className="rounded bg-[#b90014] px-4 py-2 text-[12px] font-semibold text-white"
                              type="button"
                              onClick={handleAddCertification}
                            >
                              Add Entry
                            </button>
                          </div>
                        </div>
                      ) : null}
                      <div className="mt-4 space-y-3">
                        {certifications.length ? certifications.map((certification) => (
                          <div key={certification.id} className="rounded border border-[#e2dfde] bg-[#f9f9f9] p-4">
                            <p className="text-[15px] font-semibold text-[#1a1c1c]">{certification.name}</p>
                            <p className="mt-1 text-[13px] text-[#5f5e5e]">{certification.issuer || "Chưa rõ đơn vị cấp"}</p>
                          </div>
                        )) : (
                          <p className="text-[14px] text-[#5f5e5e]">Chưa có chứng chỉ trong hồ sơ.</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="border-l-4 border-[#b90014] pl-4 text-[20px] font-semibold">
                          Languages
                        </h2>
                        {canEditProfile ? (
                          <button
                            className="text-[12px] font-semibold text-[#b90014] hover:underline"
                            type="button"
                            onClick={() => setShowLanguageComposer((value) => !value)}
                          >
                            {showLanguageComposer ? "Đóng" : "Add Entry"}
                          </button>
                        ) : null}
                      </div>
                      {showLanguageComposer && canEditProfile ? (
                        <div className="mt-4 space-y-3 rounded border border-[#e2dfde] bg-[#f9f4f4] p-4">
                          <input
                            className="w-full rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                            placeholder="Ngôn ngữ"
                            value={languageDraft.name}
                            onChange={(e) => setLanguageDraft((prev) => ({ ...prev, name: e.target.value }))}
                          />
                          <input
                            className="w-full rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                            placeholder="Trình độ"
                            value={languageDraft.proficiency}
                            onChange={(e) => setLanguageDraft((prev) => ({ ...prev, proficiency: e.target.value }))}
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              className="rounded border border-[#1a1c1c] px-4 py-2 text-[12px] font-semibold"
                              type="button"
                              onClick={() => setShowLanguageComposer(false)}
                            >
                              Cancel
                            </button>
                            <button
                              className="rounded bg-[#b90014] px-4 py-2 text-[12px] font-semibold text-white"
                              type="button"
                              onClick={handleAddLanguage}
                            >
                              Add Entry
                            </button>
                          </div>
                        </div>
                      ) : null}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {languages.length ? languages.map((language) => (
                          <span
                            key={language.id}
                            className="rounded-full border border-[#b90014]/20 bg-[#b90014]/10 px-3 py-1 text-[12px] font-semibold text-[#b90014]"
                          >
                            {language.name} • {language.proficiency}
                          </span>
                        )) : (
                          <p className="text-[14px] text-[#5f5e5e]">Chưa có ngôn ngữ nào trong hồ sơ.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
      </div>
    </main>
  );
}

export default CandidateProfileAndCVManagementScreen;
