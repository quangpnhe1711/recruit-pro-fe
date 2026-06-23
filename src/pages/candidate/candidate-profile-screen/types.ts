import type {
  CandidateProfileResponseDto,
  CandidateProfileSectionDto,
  CandidateProfileSectionItemDto,
  CandidateResumeParseResponseDto,
} from "../../../services/candidate/candidateService";

export type SkillItem = {
  id: string;
  label: string;
  active: boolean;
  yearsOfExperience: number | null;
};

export type SkillOption = {
  label: string;
  value: string;
};

export type ExperienceEntry = CandidateProfileResponseDto["experienceEntries"][number];
export type CandidateProjectItem = CandidateProfileResponseDto["projects"][number];
export type CandidateEducationItem = CandidateProfileResponseDto["educations"][number];
export type CandidateCertificationItem = CandidateProfileResponseDto["certifications"][number];
export type CandidateLanguageItem = CandidateProfileResponseDto["languages"][number];
export type CandidateSectionItem = CandidateProfileSectionItemDto;
export type CandidateSection = CandidateProfileSectionDto;

export type ProfileState = {
  username: string;
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

export type EntryDraft = {
  title: string;
  company: string;
  bullets: string;
  startMonth: number;
  startYear: number;
  endMonth: number;
  endYear: number;
  isCurrent: boolean;
};

export type ProjectDraft = {
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

export type EducationDraft = {
  school: string;
  degree: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
  description: string;
};

export type CertificationDraft = {
  name: string;
  issuer: string;
  issuedOn: string;
  expiresOn: string;
  credentialId: string;
  credentialUrl: string;
};

export type LanguageDraft = {
  name: string;
  proficiency: string;
};

export type CustomSectionDraft = {
  title: string;
  sectionType: string;
};

export type CustomSectionItemDraft = {
  title: string;
  subtitle: string;
  organization: string;
  location: string;
  description: string;
  dateLabel: string;
  tags: string;
};

export type ParsedResumePreview = CandidateResumeParseResponseDto | null;
