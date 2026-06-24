import type {
  CandidateCertificationItem,
  CandidateEducationItem,
  CandidateLanguageItem,
  CandidateProjectItem,
  CandidateSection,
  CustomSectionDraft,
  CustomSectionItemDraft,
  EducationDraft,
  EntryDraft,
  ExperienceEntry,
  LanguageDraft,
  ProfileState,
  ProjectDraft,
  SkillItem,
  CertificationDraft,
} from "./types";

export const monthOptions = [
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

export const initialProfile: ProfileState = {
  username: "",
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

export const initialSkills: SkillItem[] = [];
export const initialExperience: ExperienceEntry[] = [];
export const initialProjects: CandidateProjectItem[] = [];
export const initialEducations: CandidateEducationItem[] = [];
export const initialCertifications: CandidateCertificationItem[] = [];
export const initialLanguages: CandidateLanguageItem[] = [];

export const emptyEntryDraft: EntryDraft = {
  title: "",
  company: "",
  bullets: "",
  startMonth: new Date().getMonth() + 1,
  startYear: new Date().getFullYear(),
  endMonth: new Date().getMonth() + 1,
  endYear: new Date().getFullYear(),
  isCurrent: false,
};

export const emptyProjectDraft: ProjectDraft = {
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

export const emptyEducationDraft: EducationDraft = {
  school: "",
  degree: "",
  fieldOfStudy: "",
  startYear: "",
  endYear: "",
  description: "",
};

export const emptyCertificationDraft: CertificationDraft = {
  name: "",
  issuer: "",
  issuedOn: "",
  expiresOn: "",
  credentialId: "",
  credentialUrl: "",
};

export const emptyLanguageDraft: LanguageDraft = {
  name: "",
  proficiency: "",
};

export const emptyCustomSectionDraft: CustomSectionDraft = {
  title: "",
  sectionType: "Custom",
};

export const emptyCustomSectionItemDraft: CustomSectionItemDraft = {
  title: "",
  subtitle: "",
  organization: "",
  location: "",
  description: "",
  dateLabel: "",
  tags: "",
};

const managedSectionKeys = new Set([
  "experience",
  "projects",
  "education",
  "certifications",
  "languages",
]);

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function formatPeriod(period: ExperienceEntry["period"]) {
  const startLabel = `${monthOptions[period.startMonth - 1]} ${period.startYear}`;

  if (period.isCurrent) return `${startLabel} - Hiện tại`;

  if (period.endMonth && period.endYear) {
    return `${startLabel} - ${monthOptions[period.endMonth - 1]} ${period.endYear}`;
  }

  return startLabel;
}

export function formatMonthYear(month?: number | null, year?: number | null) {
  if (!year) {
    return "Chưa rõ";
  }

  if (!month) {
    return String(year);
  }

  return `${monthOptions[month - 1]} ${year}`;
}

export function formatDateRange(period: {
  startMonth: number;
  startYear: number;
  endMonth: number | null;
  endYear: number | null;
  isCurrent: boolean;
}) {
  const startLabel = formatMonthYear(period.startMonth, period.startYear);

  if (period.isCurrent) {
    return `${startLabel} - Hiện tại`;
  }

  return `${startLabel} - ${formatMonthYear(period.endMonth, period.endYear)}`;
}

export function formatSimpleDate(value: string | null | undefined) {
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

export function getCountLabel(count: number, label: string) {
  return `${count} ${label}`;
}

export function buildProfileSnapshot(data: {
  profile: ProfileState;
  skills: SkillItem[];
  experienceEntries: ExperienceEntry[];
  projects: CandidateProjectItem[];
  educations: CandidateEducationItem[];
  certifications: CandidateCertificationItem[];
  languages: CandidateLanguageItem[];
  sections: CandidateSection[];
}) {
  return JSON.stringify({
    profile: data.profile,
    skills: data.skills
      .map((skill) => ({
        id: skill.id,
        active: skill.active,
        yearsOfExperience: skill.yearsOfExperience,
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    experienceEntries: data.experienceEntries,
    projects: data.projects,
    educations: data.educations,
    certifications: data.certifications,
    languages: data.languages,
    sections: data.sections,
  });
}

export function isManagedSection(section: CandidateSection) {
  return (
    !!section.sectionKey &&
    managedSectionKeys.has(section.sectionKey.toLowerCase())
  );
}

export function buildManagedSectionsFromLegacy(
  experienceEntries: ExperienceEntry[],
  projects: CandidateProjectItem[],
  educations: CandidateEducationItem[],
  certifications: CandidateCertificationItem[],
  languages: CandidateLanguageItem[],
): CandidateSection[] {
  const sections: CandidateSection[] = [];

  if (experienceEntries.length) {
    sections.push({
      id: "",
      sectionKey: "experience",
      title: "Experience",
      sectionType: "Timeline",
      source: "System",
      displayOrder: 100,
      schema: {},
      items: experienceEntries.map((entry, index) => ({
        id: entry.id,
        itemType: "Experience",
        title: entry.title,
        subtitle: null,
        organization: entry.company,
        location: null,
        description: entry.bullets.join("\n"),
        dateLabel: null,
        startMonth: entry.period.startMonth,
        startYear: entry.period.startYear,
        endMonth: entry.period.endMonth ?? null,
        endYear: entry.period.endYear ?? null,
        isCurrent: entry.period.isCurrent,
        displayOrder: index,
        tags: [],
        attributes: {},
      })),
    });
  }

  if (projects.length) {
    sections.push({
      id: "",
      sectionKey: "projects",
      title: "Projects",
      sectionType: "Portfolio",
      source: "System",
      displayOrder: 200,
      schema: {},
      items: projects.map((project, index) => ({
        id: project.id,
        itemType: "Project",
        title: project.name,
        subtitle: project.role,
        organization: null,
        location: null,
        description: project.description,
        dateLabel: null,
        startMonth: project.period.startMonth,
        startYear: project.period.startYear,
        endMonth: project.period.endMonth ?? null,
        endYear: project.period.endYear ?? null,
        isCurrent: project.period.isCurrent,
        displayOrder: index,
        tags: project.technologies,
        attributes: {},
      })),
    });
  }

  if (educations.length) {
    sections.push({
      id: "",
      sectionKey: "education",
      title: "Education",
      sectionType: "Education",
      source: "System",
      displayOrder: 300,
      schema: {},
      items: educations.map((education, index) => ({
        id: education.id,
        itemType: "Education",
        title: education.school,
        subtitle: education.degree,
        organization: null,
        location: null,
        description: education.description,
        dateLabel: null,
        startMonth: null,
        startYear: education.startYear,
        endMonth: null,
        endYear: education.endYear,
        isCurrent: false,
        displayOrder: index,
        tags: [],
        attributes: {
          fieldOfStudy: education.fieldOfStudy ?? "",
        },
      })),
    });
  }

  if (certifications.length) {
    sections.push({
      id: "",
      sectionKey: "certifications",
      title: "Certifications",
      sectionType: "Achievements",
      source: "System",
      displayOrder: 400,
      schema: {},
      items: certifications.map((certification, index) => ({
        id: certification.id,
        itemType: "Certification",
        title: certification.name,
        subtitle: null,
        organization: certification.issuer,
        location: null,
        description: null,
        dateLabel: certification.issuedOn,
        startMonth: null,
        startYear: null,
        endMonth: null,
        endYear: null,
        isCurrent: false,
        displayOrder: index,
        tags: [],
        attributes: {
          expiresOn: certification.expiresOn ?? "",
          credentialId: certification.credentialId ?? "",
          credentialUrl: certification.credentialUrl ?? "",
        },
      })),
    });
  }

  if (languages.length) {
    sections.push({
      id: "",
      sectionKey: "languages",
      title: "Languages",
      sectionType: "Attributes",
      source: "System",
      displayOrder: 500,
      schema: {},
      items: languages.map((language, index) => ({
        id: language.id,
        itemType: "Language",
        title: language.name,
        subtitle: language.proficiency,
        organization: null,
        location: null,
        description: null,
        dateLabel: null,
        startMonth: null,
        startYear: null,
        endMonth: null,
        endYear: null,
        isCurrent: false,
        displayOrder: index,
        tags: [],
        attributes: {},
      })),
    });
  }

  return sections;
}

function renderHighlightedLine(line: string) {
  const trimmedLine = line.trim();
  if (!trimmedLine) {
    return null;
  }

  const colonMatch = trimmedLine.match(
    /^([A-Za-zÀ-ỹ0-9\s.+#&()/-]{2,40}:)\s*(.*)$/u,
  );
  if (colonMatch) {
    return (
      <>
        <strong>{colonMatch[1]}</strong>
        {colonMatch[2] ? ` ${colonMatch[2]}` : ""}
      </>
    );
  }

  const emphasisTerms = [
    "GPA",
    "Honor",
    "Honors",
    "Award",
    "Awards",
    "Scholarship",
    "Dean",
    "Achievement",
  ];
  const matchedTerm = emphasisTerms.find((term) =>
    trimmedLine.toLowerCase().includes(term.toLowerCase()),
  );

  if (!matchedTerm) {
    return trimmedLine;
  }

  const startIndex = trimmedLine
    .toLowerCase()
    .indexOf(matchedTerm.toLowerCase());
  const endIndex = startIndex + matchedTerm.length;

  return (
    <>
      {trimmedLine.slice(0, startIndex)}
      <strong>{trimmedLine.slice(startIndex, endIndex)}</strong>
      {trimmedLine.slice(endIndex)}
    </>
  );
}

export function renderRichBulletText(text: string | null | undefined) {
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
