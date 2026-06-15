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

function compareStartDate(
  left: ExperienceEntry["period"],
  right: ExperienceEntry["period"],
) {
  if (left.startYear !== right.startYear) {
    return left.startYear - right.startYear;
  }

  return left.startMonth - right.startMonth;
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
        syncAuthUser(profileResponse.data.profile);
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
                    <div className="mt-2 inline-flex rounded-full bg-[#005f93]/10 px-3 py-1 text-[12px] font-semibold text-[#005f93]">
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
                  <div className="flex items-center justify-between gap-3 mb-6">
                    <h2 className="mb-6 border-l-4 border-[#b90014] pl-4 text-[20px] font-semibold">
                      Resume Management
                    </h2>
                    <div
                      className={`${resumeFile ? "text-white py-1 px-4 bg-[#b90014] cursor-pointer" : "hidden"} text-[12px] font-semibold `}
                      onClick={() => setResumeFile(null)}
                    >
                      Clear
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="flex items-center gap-4 rounded border border-[#e2dfde] bg-[#f3f3f3] p-4 transition-colors hover:border-[#b90014]">
                      <div className="flex h-12 w-12 items-center justify-center rounded bg-[#b90014]/10">
                        <span className="material-symbols-outlined text-[32px] text-[#b90014]">
                          picture_as_pdf
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[16px] font-semibold">
                          {resumeMeta?.fileName ?? "No resume uploaded"}
                        </p>
                        <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5f5e5e]">
                          {resumeMeta?.uploadedAt
                            ? `Uploaded on ${new Date(resumeMeta.uploadedAt).toLocaleDateString()}`
                            : "Upload your latest resume"}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          className="p-2 text-[#5f5e5e] transition-colors hover:text-[#b90014]"
                          type="button"
                          disabled={!resumeMeta?.fileUrl}
                          onClick={() => {
                            if (resumeMeta?.fileUrl) {
                              window.open(resumeMeta.fileUrl, "_blank", "noopener,noreferrer");
                            }
                          }}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            visibility
                          </span>
                        </button>
                        <PermissionGuard permissions={PERMISSIONS.CANDIDATE_UPLOAD_OWN_RESUME}>
                          <button
                            className="p-2 text-[#5f5e5e] transition-colors hover:text-[#b90014]"
                            type="button"
                            disabled={!resumeMeta?.fileUrl}
                            onClick={() => {
                              if (resumeMeta?.fileUrl) {
                                window.open(resumeMeta.fileUrl, "_blank", "noopener,noreferrer");
                              }
                            }}
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              download
                            </span>
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
                        className="flex min-h-[104px] w-full flex-col items-center justify-center rounded border-2 border-dashed border-[#e2dfde] bg-[#f3f3f3]"
                        type="button"
                      >
                        <span className="material-symbols-outlined mb-2">
                          cloud_upload
                        </span>

                        <span className="text-[12px] font-semibold uppercase">
                          {resumeFile
                            ? resumeFile.name
                            : "Click or Drag to Replace CV"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {resumeFile ? (
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button
                        className="inline-flex items-center justify-center gap-2 rounded bg-[#005f93] px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                        type="button"
                        disabled={isParsingResume}
                        onClick={handleParseResume}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          psychiatry
                        </span>
                        {isParsingResume ? "Đang phân tích CV..." : "Phân tích CV"}
                      </button>
                      <p className="text-[12px] text-[#5f5e5e]">
                        Phân tích CV trước để xem dữ liệu gợi ý, sau đó xác nhận rồi mới lưu hồ sơ chính thức.
                      </p>
                    </div>
                  ) : null}

                  {parsedResumePreview ? (
                    <div className="mt-6 rounded-[20px] border border-[#cde5ff] bg-[linear-gradient(180deg,#f7fbff_0%,#ffffff_100%)] p-5 shadow-[0_18px_50px_rgba(0,95,147,0.08)]">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#cde5ff] bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#005f93]">
                              <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                            {parsedResumePreview.usedAi ? "AI Parsing" : parsedResumePreview.parsingMode}
                          </span>
                          {parsedResumePreview.modelName ? (
                            <span className="rounded-full bg-[#edf6fd] px-3 py-1 text-[11px] font-semibold text-[#47657a]">
                              {parsedResumePreview.modelName}
                            </span>
                          ) : null}
                        </div>
                        {!parsedResumePreview.usedAi && parsedResumePreview.aiFallbackReason ? (
                          <div className="rounded-xl border border-[#ffd7dc] bg-[#fff4f6] px-4 py-3 text-[13px] leading-6 text-[#8a1020]">
                            AI chưa được áp dụng ở lượt phân tích này: {parsedResumePreview.aiFallbackReason}
                          </div>
                        ) : null}
                        <h3 className="text-[20px] font-semibold text-[#005f93]">
                          Bản nháp hồ sơ từ CV
                        </h3>
                          <p className="mt-1 text-[13px] leading-6 text-[#47657a]">
                            CV đã được phân tích thành dữ liệu có cấu trúc. Rà soát nhanh rồi áp dụng vào biểu mẫu để chỉnh tay trước khi lưu chính thức.
                          </p>
                        </div>

                        <button
                          className="rounded-full bg-[#005f93] px-5 py-2.5 text-[12px] font-semibold text-white transition-colors hover:brightness-110"
                          type="button"
                          onClick={() => applyParsedResumeToForm(parsedResumePreview)}
                        >
                          Áp dụng vào biểu mẫu
                        </button>
                      </div>

                      {parsedResumePreview.notes.length ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {parsedResumePreview.notes.map((note) => (
                            <span
                              key={note}
                              className="inline-flex rounded-full border border-[#cde5ff] bg-white px-3 py-1 text-[12px] font-medium text-[#005f93]"
                            >
                              {note}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-[#d7e8f7] bg-white p-4">
                          <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5f5e5e]">
                            Thông tin cá nhân
                          </p>
                          <div className="mt-3 space-y-2 text-[14px] text-[#1a1c1c]">
                            <p><strong>Họ tên:</strong> {parsedResumePreview.profile.name || "Chưa rõ"}</p>
                            <p><strong>Headline:</strong> {parsedResumePreview.profile.headline || "Chưa rõ"}</p>
                            <p><strong>Email:</strong> {parsedResumePreview.profile.email || "Chưa rõ"}</p>
                            <p><strong>Điện thoại:</strong> {parsedResumePreview.profile.phone || "Chưa rõ"}</p>
                            <p><strong>Địa điểm:</strong> {parsedResumePreview.profile.location || "Chưa rõ"}</p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-[#d7e8f7] bg-white p-4">
                          <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5f5e5e]">
                            Dữ liệu phát hiện
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-[#edf6fd] px-3 py-1 text-[12px] font-semibold text-[#005f93]">
                              {parsedResumePreview.skills.length} ky nang
                            </span>
                            <span className="rounded-full bg-[#edf6fd] px-3 py-1 text-[12px] font-semibold text-[#005f93]">
                              {parsedResumePreview.experienceEntries.length} kinh nghiem
                            </span>
                            <span className="rounded-full bg-[#edf6fd] px-3 py-1 text-[12px] font-semibold text-[#005f93]">
                              {parsedResumePreview.projects.length} du an
                            </span>
                            <span className="rounded-full bg-[#edf6fd] px-3 py-1 text-[12px] font-semibold text-[#005f93]">
                              {parsedResumePreview.educations.length} hoc van
                            </span>
                            <span className="rounded-full bg-[#edf6fd] px-3 py-1 text-[12px] font-semibold text-[#005f93]">
                              {parsedResumePreview.certifications.length} chung chi
                            </span>
                            <span className="rounded-full bg-[#edf6fd] px-3 py-1 text-[12px] font-semibold text-[#005f93]">
                              {parsedResumePreview.languages.length} ngon ngu
                            </span>
                          </div>
                          <pre className="mt-4 max-h-48 overflow-auto whitespace-pre-wrap rounded border border-[#e2dfde] bg-[#f9f9f9] p-3 text-[12px] leading-5 text-[#4e5f6a]">
                            {parsedResumePreview.extractedTextPreview}
                          </pre>
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
                      Experience &amp; Education
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
                      <h2 className="border-l-4 border-[#005f93] pl-4 text-[20px] font-semibold">
                        Projects
                      </h2>
                      <div className="mt-4 space-y-3">
                        {projects.length ? projects.map((project) => (
                          <div key={project.id} className="rounded border border-[#e2dfde] bg-[#f9f9f9] p-4">
                            <p className="text-[15px] font-semibold text-[#1a1c1c]">{project.name}</p>
                            <p className="mt-1 text-[13px] font-medium text-[#005f93]">{project.role || "Project"}</p>
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
                      <h2 className="border-l-4 border-[#005f93] pl-4 text-[20px] font-semibold">
                        Education
                      </h2>
                      <div className="mt-4 space-y-3">
                        {educations.length ? educations.map((education) => (
                          <div key={education.id} className="rounded border border-[#e2dfde] bg-[#f9f9f9] p-4">
                            <p className="text-[15px] font-semibold text-[#1a1c1c]">{education.school}</p>
                            <p className="mt-1 text-[13px] font-medium text-[#005f93]">
                              {education.degree}
                              {education.fieldOfStudy ? ` • ${education.fieldOfStudy}` : ""}
                            </p>
                            <p className="mt-2 text-[12px] text-[#5f5e5e]">
                              {[education.startYear, education.endYear].filter(Boolean).join(" - ") || "Chưa rõ mốc thời gian"}
                            </p>
                            {education.description ? (
                              <p className="mt-2 text-[13px] leading-6 text-[#5f5e5e]">{education.description}</p>
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
                      <h2 className="border-l-4 border-[#005f93] pl-4 text-[20px] font-semibold">
                        Certifications
                      </h2>
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
                      <h2 className="border-l-4 border-[#005f93] pl-4 text-[20px] font-semibold">
                        Languages
                      </h2>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {languages.length ? languages.map((language) => (
                          <span
                            key={language.id}
                            className="rounded-full border border-[#005f93]/20 bg-[#005f93]/10 px-3 py-1 text-[12px] font-semibold text-[#005f93]"
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
