import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import LoadingIndicator from "../../common/components/LoadingIndicator";
import SkillPicker from "../../common/components/SkillPicker";
import PermissionGuard from "../../guards/PermissionGuard";
import { usePermissions } from "../../hooks/usePermissions";
import { jobsService } from "../../services/jobs/jobsService";
import { PERMISSIONS } from "../../permissions/permissions";
import {
  candidateService,
  type CandidateProfileResponseDto,
} from "../../services/candidate/candidateService";
import type { RootState } from "../../store";
import { updateUser } from "../../store/slices/authSlice";

type SkillItem = {
  id: string;
  label: string;
  active: boolean;
};

type ExperienceEntry = {
  id: string;
  title: string;
  period: {
    startMonth: number;
    startYear: number;
    endMonth?: number;
    endYear?: number;
    isCurrent: boolean;
  };
  company: string;
  bullets: string[];
};

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
  name: "Alex Thompson",
  headline: "Senior Candidate / Full-Stack Engineer",
  email: "alex.thompson@recruitment.internal",
  phone: "+1 (555) 0123 4567",
  location: "Chicago, IL • Remote Friendly",
  memberSince: "Member since Jan 2024",
  bio: "Senior Full-Stack Engineer with 8+ years of experience building scalable web applications. Passionate about architecture, clean code, and mentoring junior developers.",
  github: "github.com/athompson-dev",
  linkedin: "linkedin.com/in/alexthompson",
};

const initialSkills: SkillItem[] = [];

const initialExperience: ExperienceEntry[] = [
  {
    id: "senior",
    title: "Senior Software Engineer",
    period: {
      startMonth: 1,
      startYear: 2020,
      isCurrent: true,
    },
    company: "TechFlow Solutions Inc.",
    bullets: [
      "Architected and led the migration of legacy monolith to microservices using .NET 8.",
      "Improved system performance by 40% through SQL optimization and caching strategies.",
      "Mentored a team of 5 junior and mid-level developers.",
    ],
  },
  {
    id: "developer",
    title: "Software Developer",
    period: {
      startMonth: 1,
      startYear: 2017,
      endMonth: 12,
      endYear: 2020,
      isCurrent: false,
    },
    company: "Innovate Web Corp",
    bullets: [
      "Developed responsive user interfaces using React and Redux.",
      "Collaborated with design teams to implement pixel-perfect enterprise dashboards.",
    ],
  },
  {
    id: "education",
    title: "B.Sc. in Computer Science",
    period: {
      startMonth: 1,
      startYear: 2013,
      endMonth: 12,
      endYear: 2017,
      isCurrent: false,
    },
    company: "University of Illinois at Chicago",
    bullets: ["Major in Software Engineering, Graduated with Honors."],
  },
];

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
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [entryDraft, setEntryDraft] = useState<EntryDraft>(emptyEntryDraft);
  const [showEntryComposer, setShowEntryComposer] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeMeta, setResumeMeta] = useState<CandidateProfileResponseDto["resume"] | null>(null);
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
          })),
        );
        setResumeMeta(profileResponse.data.resume ?? null);
        setExperienceEntries(profileResponse.data.experienceEntries ?? []);
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

  async function handleSaveProfile() {
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
      }

      const selectedSkillIds = skills
        .filter((skill) => skill.active)
        .map((skill) => skill.id);

      const updatedSkills = await candidateService.updateSkills(selectedSkillIds);
      if (updatedSkills.data) {
        const activeIds = new Set(updatedSkills.data.skills.filter((skill) => skill.active).map((skill) => skill.id));
        setSkills((prev) =>
          prev.map((skill) => ({
            ...skill,
            active: activeIds.has(skill.id),
          })),
        );
      }

      if (resumeFile) {
        const uploadResult = await candidateService.uploadResume(resumeFile);
        if (uploadResult.data) {
          setResumeMeta({
            id: uploadResult.data.resumeId,
            fileName: uploadResult.data.fileName,
            fileUrl: resumeMeta?.fileUrl ?? "",
            uploadedAt: uploadResult.data.uploadedAt,
          });
          setResumeFile(null);
        }
      }

      setIsEditingProfile(false);
      toast.success("Cập nhật hồ sơ thành công");
    } catch (error) {
      console.error(error);
      toast.error("Không thể lưu hồ sơ");
    }
  }

  function handleResumeFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      toast.error("No file selected. Please choose a valid resume file.");
      return;
    }

    setResumeFile(file);
    toast.success("Resume file selected: " + file.name);
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
      toast.success("Experience entry added");
    } catch {
      toast.error("Unable to save experience entry");
    }
  }

  if (loading) {
    return (
      <main className="py-6">
        <div className="mx-auto w-full max-w-[1440px] px-4 md:px-10">
          <div className="rounded-xl border border-[#e2dfde] bg-white px-6 py-5">
            <LoadingIndicator label="Loading candidate profile..." />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="py-6">
      <div className="mx-auto w-full max-w-[1440px] px-4 md:px-10">
            <nav className="mb-6 flex items-center gap-2">
              <span className="text-[32px] font-bold text-[#1a1c1c]">
                My Profile
              </span>
            </nav>
            <section
              id="profile"
              className="relative mb-6 overflow-hidden rounded-xl border border-[#e2dfde] bg-white p-6 md:p-8"
            >
              <div className="mb-6 flex flex-col gap-3 md:absolute md:right-6 md:top-6 md:flex-row">
                <PermissionGuard permissions={PERMISSIONS.CANDIDATE_UPDATE_OWN_PROFILE}>
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded bg-[#b90014] px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:brightness-110"
                    type="button"
                    onClick={handleSaveProfile}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      save
                    </span>
                    Save Changes
                  </button>
                </PermissionGuard>
                <PermissionGuard permissions={PERMISSIONS.CANDIDATE_UPDATE_OWN_PROFILE}>
                  <button
                    className="rounded border border-[#1a1c1c] bg-white px-4 py-2 text-[12px] font-semibold text-[#1a1c1c] transition-colors hover:bg-[#f3f3f3]"
                    type="button"
                    onClick={() => setIsEditingProfile((value) => !value)}
                  >
                    {isEditingProfile ? "Done Editing" : "Edit Profile"}
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
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-[#e2dfde] bg-white px-3 py-1 text-[11px] font-semibold text-[#5f5e5e] shadow-sm whitespace-nowrap">
                    Avatar sync from account
                  </div>
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
                    Personal Information
                  </h2>

                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5f5e5e]">
                        Bio
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
                        Links
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
                    <SkillPicker
                      emptyLabel="Select skills from the database to add them to your profile."
                      options={skillOptions}
                      placeholder="Choose a skill from database"
                      selectedLabelByValue={skills.reduce<Record<string, string>>((acc, skill) => {
                        acc[skill.id] = skill.label;
                        return acc;
                      }, {})}
                      selectedValues={skills.filter((skill) => skill.active).map((skill) => skill.id)}
                      onAdd={handleAddSkill}
                      onRemove={handleRemoveSkill}
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {skills.filter((skill) => skill.active).map((skill) => (
                        <span
                          key={skill.id}
                          className="inline-flex items-center gap-2 rounded-full border border-[#b90014]/20 bg-[#b90014]/10 px-3 py-1 text-[12px] font-semibold text-[#b90014]"
                        >
                          {skill.label}
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
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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
                          placeholder="Period"
                          value={entryDraft.period}
                          onChange={(e) =>
                            setEntryDraft((prev) => ({
                              ...prev,
                              period: e.target.value,
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
                        <select
                          className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                          value={entryDraft.startMonth}
                          onChange={(e) =>
                            setEntryDraft((prev) => ({
                              ...prev,
                              startMonth: Number(e.target.value),
                            }))
                          }
                        >
                          {monthOptions.map((month, index) => (
                            <option key={month} value={index + 1}>
                              {month}
                            </option>
                          ))}
                        </select>
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
                            <select
                              className="rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1a1c1c]"
                              value={entryDraft.endMonth}
                              onChange={(e) =>
                                setEntryDraft((prev) => ({
                                  ...prev,
                                  endMonth: Number(e.target.value),
                                }))
                              }
                            >
                              {monthOptions.map((month, index) => (
                                <option key={month} value={index + 1}>
                                  {month}
                                </option>
                              ))}
                            </select>
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
              </div>
            </div>
      </div>
    </main>
  );
}

export default CandidateProfileAndCVManagementScreen;
