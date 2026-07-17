import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { appToast, handleNonFormApiError } from "../../common/utils/appToast";
import { applyApiFormError } from "../../common/utils/formErrors";
import AsyncActionButton from "../../common/components/AsyncActionButton";
import CommonSelect from "../../common/components/CommonSelect";
import LoadingIndicator from "../../common/components/LoadingIndicator";
import SkillPicker from "../../common/components/SkillPicker";
import {
  jobCreateStep1Schema,
  jobCreateStep2Schema,
  jobCreateStep3Schema,
  validateWithSchema,
  type ValidationErrors,
} from "../../common/validation/formValidation";
import {
  getEmploymentTypeBadgeClass,
  getSkillChipClass,
  getWorkModeChipClass,
} from "../../common/utils/jobPresentation";
import { usePermissions } from "../../hooks/usePermissions";
import { getDateLocale, useI18n } from "../../i18n";
import {
  employmentTypeLabels,
  workModeLabels,
  type EmploymentType,
  type SkillDto,
  type WorkMode,
} from "../../modules/jobs/jobsSchema";
import { PERMISSIONS } from "../../permissions/permissions";
import { jobsService } from "../../services/jobs/jobsService";

type DraftState = {
  step: number;
  title: string;
  department: string;
  location: string;
  employmentType: EmploymentType | "";
  workMode: WorkMode | "";
  shortPitch: string;
  deadline: string;

  description: string;
  responsibilities: string[];
  requirements: string[];

  skills: SkillRequirementDraft[];
  niceToHaveSkills: SkillRequirementDraft[];
  salaryMin: string;
  salaryMax: string;
  currency: string;
};

type SkillRequirementDraft = {
  skillName: string;
  minimumYearsOfExperience: string;
};

// Fallback list when the department lookup has not loaded (or fails) — the live list comes from the API.
const fallbackDepartments = ["Engineering", "Product", "Design", "Marketing", "Human Resources"];
const employmentTypeOptions = Object.entries(employmentTypeLabels).map(
  ([value, label]) => ({ value, label }),
);
const workModeOptions = Object.entries(workModeLabels).map(
  ([value, label]) => ({ value, label }),
);

const draftStorageKey = "rp_internal_jobcreating_draft_v1";
function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function normalizeList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter((v) => v.length > 0);
}

function normalizeSkillRequirements(values: unknown): SkillRequirementDraft[] {
  if (!Array.isArray(values)) return [];

  return values
    .map((value) => {
      if (typeof value === "string") {
        const skillName = value.trim();
        return skillName
          ? {
              skillName,
              minimumYearsOfExperience: "",
            }
          : null;
      }

      if (value && typeof value === "object") {
        const rawSkillName = "skillName" in value ? value.skillName : "";
        const rawMinimumYears = "minimumYearsOfExperience" in value
          ? value.minimumYearsOfExperience
          : "";
        const skillName = typeof rawSkillName === "string" ? rawSkillName.trim() : "";
        if (!skillName) {
          return null;
        }

        return {
          skillName,
          minimumYearsOfExperience:
            typeof rawMinimumYears === "number"
              ? String(rawMinimumYears)
              : typeof rawMinimumYears === "string"
                ? rawMinimumYears.trim()
                : "",
        };
      }

      return null;
    })
    .filter((value): value is SkillRequirementDraft => Boolean(value));
}

function loadDraft(): DraftState | null {
  const parsed = safeJsonParse<Partial<DraftState>>(
    window.localStorage.getItem(draftStorageKey),
  );
  if (!parsed) return null;

  return {
    step: typeof parsed.step === "number" ? parsed.step : 1,
    title: typeof parsed.title === "string" ? parsed.title : "",
    department:
      typeof parsed.department === "string" && parsed.department
        ? parsed.department
        : "Engineering",
    location: typeof parsed.location === "string" ? parsed.location : "",
    employmentType:
      parsed.employmentType === "Full-time" ||
      parsed.employmentType === "Part-time" ||
      parsed.employmentType === "Internship" ||
      parsed.employmentType === "Contract"
        ? parsed.employmentType
        : "",
    workMode:
      parsed.workMode === "Remote" ||
      parsed.workMode === "Hybrid" ||
      parsed.workMode === "Onsite"
        ? parsed.workMode
        : "",
    shortPitch: typeof parsed.shortPitch === "string" ? parsed.shortPitch : "",
    deadline: typeof parsed.deadline === "string" ? parsed.deadline : "",

    description:
      typeof parsed.description === "string" ? parsed.description : "",
    responsibilities: normalizeList(parsed.responsibilities),
    requirements: normalizeList(parsed.requirements),

    skills: normalizeSkillRequirements(parsed.skills),
    niceToHaveSkills: normalizeSkillRequirements(parsed.niceToHaveSkills),
    salaryMin: typeof parsed.salaryMin === "string" ? parsed.salaryMin : "",
    salaryMax: typeof parsed.salaryMax === "string" ? parsed.salaryMax : "",
    currency: "VND",
  };
}

function JobCreatingScreen() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canCreateJob = hasPermission(PERMISSIONS.JOB_CREATE);
  const canUseTemplate = hasPermission(PERMISSIONS.JOB_USE_TEMPLATE);

  const initialDraft = useMemo(() => loadDraft(), []);

  const [step, setStep] = useState<number>(() => initialDraft?.step ?? 1);

  // Step 1
  const [title, setTitle] = useState<string>(() => initialDraft?.title ?? "");
  const [department, setDepartment] = useState<string>(
    () => initialDraft?.department ?? "Engineering",
  );
  const [location, setLocation] = useState<string>(
    () => initialDraft?.location ?? "",
  );
  const [employmentType, setEmploymentType] = useState<EmploymentType | "">(
    () => initialDraft?.employmentType ?? "",
  );
  const [workMode, setWorkMode] = useState<WorkMode | "">(
    () => initialDraft?.workMode ?? "",
  );
  const [shortPitch, setShortPitch] = useState<string>(
    () => initialDraft?.shortPitch ?? "",
  );
  const [deadline, setDeadline] = useState<string>(
    () => initialDraft?.deadline ?? "",
  );
  const [departmentOptions, setDepartmentOptions] = useState<string[]>(fallbackDepartments);

  // Step 2
  const [description, setDescription] = useState<string>(
    () => initialDraft?.description ?? "",
  );
  const [responsibilities, setResponsibilities] = useState<string[]>(
    () => initialDraft?.responsibilities ?? [],
  );
  const [requirements, setRequirements] = useState<string[]>(
    () => initialDraft?.requirements ?? [],
  );
  const [responsibilityInput, setResponsibilityInput] = useState<string>("");
  const [requirementInput, setRequirementInput] = useState<string>("");

  // Step 3
  const [skills, setSkills] = useState<SkillRequirementDraft[]>(
    () => initialDraft?.skills ?? [],
  );
  const [niceToHaveSkills, setNiceToHaveSkills] = useState<SkillRequirementDraft[]>(
    () => initialDraft?.niceToHaveSkills ?? [],
  );
  const [availableSkills, setAvailableSkills] = useState<SkillDto[]>([]);
  const [skillOptions, setSkillOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [salaryMin, setSalaryMin] = useState<string>(
    () => initialDraft?.salaryMin ?? "",
  );
  const [salaryMax, setSalaryMax] = useState<string>(
    () => initialDraft?.salaryMax ?? "",
  );
  const [currency] = useState<string>(
    () => "VND",
  );
  const [publishing, setPublishing] = useState(false);
  const [step1Errors, setStep1Errors] = useState<ValidationErrors>({});
  const [step2Errors, setStep2Errors] = useState<ValidationErrors>({});
  const [step3Errors, setStep3Errors] = useState<ValidationErrors>({});
  const [step1Submitted, setStep1Submitted] = useState(false);
  const [step2Submitted, setStep2Submitted] = useState(false);
  const [step3Submitted, setStep3Submitted] = useState(false);

  useEffect(() => {
    let mounted = true;

    jobsService
      .listSkills()
      .then((response) => {
        if (!mounted) {
          return;
        }

        const data = response.data as SkillDto[] | null;
        setAvailableSkills(data ?? []);
        setSkillOptions(
          (data ?? []).map((skill) => ({
            label: skill.name,
            value: skill.name,
          })),
        );
      })
      .catch(() => {
        if (mounted) {
          setSkillOptions([]);
        }
      })
      .finally(() => {
        if (mounted) {
          setSkillsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    jobsService
      .listDepartments()
      .then((response) => {
        if (!mounted) return;
        const names = (response.data ?? [])
          .map((departmentItem) => departmentItem.name)
          .filter((name): name is string => Boolean(name));
        if (names.length > 0) setDepartmentOptions(names);
      })
      .catch(() => {
        /* keep the fallback list; the backend resolves department by name on submit */
      });
    return () => {
      mounted = false;
    };
  }, []);

  /** Current step-1 values — single source for validation calls so no field is forgotten. */
  const step1Values = () => ({
    title,
    department,
    location,
    employmentType,
    workMode,
    shortPitch,
    deadline,
  });

  function persistDraft(nextStep = step) {
    const payload: DraftState = {
      step: nextStep,
      title,
      department,
      location,
      employmentType,
      workMode,
      shortPitch,
      deadline,
      description,
      responsibilities,
      requirements,
      skills,
      niceToHaveSkills,
      salaryMin,
      salaryMax,
      currency,
    };

    window.localStorage.setItem(draftStorageKey, JSON.stringify(payload));
    appToast.success(t("jobCreating.draftSaved"));
  }

  function applyEngineeringTemplate() {
    setTitle(t("jobCreating.template.title"));
    setDepartment("Engineering");
    setLocation(t("jobCreating.template.location"));
    setEmploymentType("Full-time");
    setWorkMode("Hybrid");
    setShortPitch(
      t("jobCreating.template.shortPitch"),
    );
    appToast.info(t("jobCreating.template.applied"));
  }

  function validateStep1() {
    setStep1Submitted(true);
    const errors = validateWithSchema(jobCreateStep1Schema, step1Values());
    setStep1Errors(errors);
    return Object.keys(errors).length === 0;
  }

  function validateStep2() {
    setStep2Submitted(true);
    const errors = validateWithSchema(jobCreateStep2Schema, {
      description,
      requirements,
    });
    setStep2Errors(errors);
    return Object.keys(errors).length === 0;
  }

  function validateStep3() {
    setStep3Submitted(true);
    const errors = validateWithSchema(jobCreateStep3Schema, {
      skills,
      salaryMin,
      salaryMax,
    });
    setStep3Errors(errors);
    return Object.keys(errors).length === 0;
  }

  function addListItem(
    value: string,
    setter: (updater: (prev: string[]) => string[]) => void,
  ) {
    const next = value.trim();
    if (!next) return;
    setter((prev) => {
      const exists = prev.some((p) => p.toLowerCase() === next.toLowerCase());
      const nextValues = exists ? prev : [...prev, next];
      if (setter === setRequirements && step2Submitted) {
        setStep2Errors(
          validateWithSchema(jobCreateStep2Schema, {
            description,
            requirements: nextValues,
          }),
        );
      }
      return nextValues;
    });
  }

  function removeListItem(
    index: number,
    setter: (updater: (prev: string[]) => string[]) => void,
  ) {
    setter((prev) => {
      const nextValues = prev.filter((_, i) => i !== index);
      if (setter === setRequirements && step2Submitted) {
        setStep2Errors(
          validateWithSchema(jobCreateStep2Schema, {
            description,
            requirements: nextValues,
          }),
        );
      }
      return nextValues;
    });
  }

  function addSkillRequirement(
    skillName: string,
    setter: (updater: (prev: SkillRequirementDraft[]) => SkillRequirementDraft[]) => void,
  ) {
    const next = skillName.trim();
    if (!next) return;

    setter((prev) => {
      const exists = prev.some((item) => item.skillName.toLowerCase() === next.toLowerCase());
      const nextValues = exists
        ? prev
        : [
            ...prev,
            {
              skillName: next,
              minimumYearsOfExperience: "",
            },
          ];
      if (setter === setSkills && step3Submitted) {
        setStep3Errors(
          validateWithSchema(jobCreateStep3Schema, {
            skills: nextValues,
            salaryMin,
            salaryMax,
          }),
        );
      }
      return nextValues;
    });
  }

  function removeSkillRequirement(
    skillName: string,
    setter: (updater: (prev: SkillRequirementDraft[]) => SkillRequirementDraft[]) => void,
  ) {
    setter((prev) => {
      const nextValues = prev.filter((item) => item.skillName !== skillName);
      if (setter === setSkills && step3Submitted) {
        setStep3Errors(
          validateWithSchema(jobCreateStep3Schema, {
            skills: nextValues,
            salaryMin,
            salaryMax,
          }),
        );
      }
      return nextValues;
    });
  }

  function updateSkillRequirementYears(
    skillName: string,
    value: string,
    setter: (updater: (prev: SkillRequirementDraft[]) => SkillRequirementDraft[]) => void,
  ) {
    const normalizedValue = value.trim();
    if (normalizedValue && !/^\d*\.?\d*$/.test(normalizedValue)) {
      return;
    }

    setter((prev) =>
      {
        const nextValues = prev.map((item) =>
        item.skillName === skillName
          ? {
              ...item,
              minimumYearsOfExperience: normalizedValue,
            }
          : item,
        );
        if (setter === setSkills && step3Submitted) {
          setStep3Errors(
            validateWithSchema(jobCreateStep3Schema, {
              skills: nextValues,
              salaryMin,
              salaryMax,
            }),
          );
        }
        return nextValues;
      },
    );
  }

  function continueNext() {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;

    const next = Math.min(4, step + 1);
    setStep(next);

    // Keep progress recoverable without forcing any backend.
    window.localStorage.setItem(
      draftStorageKey,
      JSON.stringify({
        step: next,
        title,
        department,
        location,
        employmentType,
        workMode,
        shortPitch,
        deadline,
        description,
        responsibilities,
        requirements,
        skills,
        niceToHaveSkills,
        salaryMin,
        salaryMax,
        currency,
      } satisfies DraftState),
    );

    appToast.info(
      next === 2
        ? t("jobCreating.progress.step1")
        : next === 3
          ? t("jobCreating.progress.step2")
          : t("jobCreating.progress.step3"),
    );
  }

  function goBack() {
    setStep((prev) => Math.max(1, prev - 1));
  }

  async function publishJob() {
    if (!validateStep1() || !validateStep2() || !validateStep3()) return;

    const findSkillIdByName = (name: string) =>
      availableSkills.find(
        (skill) =>
          skill.name.trim().toLowerCase() === name.trim().toLowerCase(),
      )?.id;

    const skillRequirements = [
      ...skills.map((skill) => ({
        skillId: findSkillIdByName(skill.skillName) ?? null,
        skillName: skill.skillName,
        skillType: "Required" as const,
        minimumYearsOfExperience: skill.minimumYearsOfExperience
          ? Number(skill.minimumYearsOfExperience)
          : null,
      })),
      ...niceToHaveSkills.map((skill) => ({
        skillId: findSkillIdByName(skill.skillName) ?? null,
        skillName: skill.skillName,
        skillType: "NiceToHave" as const,
        minimumYearsOfExperience: skill.minimumYearsOfExperience
          ? Number(skill.minimumYearsOfExperience)
          : null,
      })),
    ];

    setPublishing(true);
    try {
      await jobsService.createJob({
        title: title.trim(),
        department,
        location: location.trim(),
        employmentType,
        workMode,
        shortPitch,
        description,
        responsibilities,
        requirements,
        skills: skills.map((skill) => skill.skillName),
        skillRequirements,
        salaryMin: salaryMin ? Number(salaryMin) : null,
        salaryMax: salaryMax ? Number(salaryMax) : null,
        currency: "VND",
        vacancyCount: 1,
        benefits: [],
        // End-of-day so the deadline stays valid through its final day (backend stores a timestamp).
        deadline: deadline ? `${deadline}T23:59:59` : null,
        departmentId: null,
        skillIds: skillRequirements
          .map((item) => item.skillId)
          .filter((value): value is string => Boolean(value)),
        minExperienceYears: 0,
      });

      window.localStorage.removeItem(draftStorageKey);
      appToast.success(t("jobCreating.submitSuccess"));
      navigate("/internal/jobs");
    } catch (err) {
      // Backend field errors route to the step that owns the field so they render inline (red field +
      // message) instead of a toast; server/network/business errors fall back to a soft toast.
      const handled = applyApiFormError(err, {
        setFieldError: (field, message) => {
          if (["description", "responsibilities", "requirements"].includes(field)) {
            setStep2Errors((prev) => ({ ...prev, [field]: message }));
          } else if (["skills", "salaryMin", "salaryMax", "currency"].includes(field)) {
            setStep3Errors((prev) => ({ ...prev, [field]: message }));
          } else {
            setStep1Errors((prev) => ({ ...prev, [field]: message }));
          }
        },
      });
      if (!handled) handleNonFormApiError(err);
    } finally {
      setPublishing(false);
    }
  }

  const stepper = (
    <div className="relative flex items-center justify-between">
      <div className="absolute left-5 right-5 top-5 h-[2px] bg-[#ececec]" />

      {(
        [
          { n: 1, label: t("jobCreating.steps.basicInfo") },
          { n: 2, label: t("jobCreating.steps.description") },
          { n: 3, label: t("jobCreating.steps.skillsSalary") },
          { n: 4, label: t("jobCreating.steps.review") },
        ] as const
      ).map((s) => {
        const active = step === s.n;
        const completed = step > s.n;

        const circleClass = completed
          ? "bg-[#1a1c1c] text-white"
          : active
            ? "bg-gradient-to-br from-[#e8242c] to-[#c50f1b] text-white shadow-[0_8px_18px_rgba(185,0,20,0.28)]"
            : "bg-white text-[#8a8786] border border-[#ececec]";

        const labelClass = active
          ? "text-[#1a1c1c]"
          : completed
            ? "text-[#1a1c1c]"
            : "text-[#8a8786]";

        return (
          <div
            key={s.n}
            className="relative z-10 flex flex-1 flex-col items-center gap-2 px-1 text-center"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-semibold transition-all ${circleClass}`}
            >
              {completed ? (
                <span className="material-symbols-outlined text-[20px]">check</span>
              ) : (
                s.n
              )}
            </div>
            <span className={`text-[11px] font-semibold leading-tight md:text-[12px] ${labelClass}`}>
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="app-container animate-fade-in py-8 md:py-10">
      <div className="mb-8">
        <p className="eyebrow">{t("jobCreating.eyebrow")}</p>
        <h1 className="page-title mt-1.5">{t("jobCreating.title")}</h1>
        <p className="page-subtitle">
          {t("jobCreating.subtitle")}
        </p>
      </div>

      <div className="card mb-6 p-5 md:p-6">{stepper}</div>

      {/* Content Card */}
      <section className="card p-5 md:p-7">

        {step === 1 ? (
          <form className="animate-fade-in space-y-7" onSubmit={(e) => e.preventDefault()}>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff1ef] text-[#b90014]">
                <span className="material-symbols-outlined text-[20px]">info</span>
              </span>
              <div>
                <h2 className="section-title">{t("jobCreating.steps.basicInfo")}</h2>
                <p className="text-[12px] text-[#8a8786]">
                  {t("jobCreating.basicInfoHelp")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="field-label">{t("jobCreating.jobTitle")}</label>
                <input
                  value={title}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setTitle(nextValue);
                    if (step1Submitted) {
                      setStep1Errors(
                        validateWithSchema(jobCreateStep1Schema, { ...step1Values(), title: nextValue }),
                      );
                    }
                  }}
                  className={`input-field h-11 ${step1Errors.title ? "border-[#ba1a1a]" : ""}`}
                  placeholder={t("jobCreating.placeholders.jobTitle")}
                  type="text"
                />
                {step1Errors.title ? (
                  <p className="mt-1.5 text-[12px] text-[#ba1a1a]">{step1Errors.title}</p>
                ) : null}
              </div>

              <div>
                <label className="field-label">{t("jobManagement.department")}</label>
                <CommonSelect
                  options={departmentOptions.map((d) => ({ label: d, value: d }))}
                  value={department}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setDepartment(nextValue);
                    if (step1Submitted) {
                      setStep1Errors(
                        validateWithSchema(jobCreateStep1Schema, { ...step1Values(), department: nextValue }),
                      );
                    }
                  }}
                />
                {step1Errors.department ? (
                  <p className="mt-1.5 text-[12px] text-[#ba1a1a]">{step1Errors.department}</p>
                ) : null}
              </div>

              <div>
                <label className="field-label">{t("jobCreating.jobType")}</label>
                <CommonSelect
                  options={employmentTypeOptions}
                  placeholder={t("jobCreating.placeholders.jobType")}
                  value={employmentType}
                  onChange={(e) => {
                    const nextValue = e.target.value as EmploymentType | "";
                    setEmploymentType(nextValue);
                    if (step1Submitted) {
                      setStep1Errors(
                        validateWithSchema(jobCreateStep1Schema, { ...step1Values(), employmentType: nextValue }),
                      );
                    }
                  }}
                />
                {step1Errors.employmentType ? (
                  <p className="mt-1.5 text-[12px] text-[#ba1a1a]">{step1Errors.employmentType}</p>
                ) : null}
              </div>

              <div>
                <label className="field-label">{t("jobCreating.location")}</label>
                <input
                  value={location}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setLocation(nextValue);
                    if (step1Submitted) {
                      setStep1Errors(
                        validateWithSchema(jobCreateStep1Schema, { ...step1Values(), location: nextValue }),
                      );
                    }
                  }}
                  className={`input-field h-11 ${step1Errors.location ? "border-[#ba1a1a]" : ""}`}
                  placeholder={t("jobCreating.placeholders.location")}
                  type="text"
                />
                {step1Errors.location ? (
                  <p className="mt-1.5 text-[12px] text-[#ba1a1a]">{step1Errors.location}</p>
                ) : null}
              </div>

              <div>
                <label className="field-label">{t("jobCreating.workMode")}</label>
                <CommonSelect
                  options={workModeOptions}
                  placeholder={t("jobCreating.placeholders.workMode")}
                  value={workMode}
                  onChange={(e) => {
                    const nextValue = e.target.value as WorkMode | "";
                    setWorkMode(nextValue);
                    if (step1Submitted) {
                      setStep1Errors(
                        validateWithSchema(jobCreateStep1Schema, { ...step1Values(), workMode: nextValue }),
                      );
                    }
                  }}
                />
                {step1Errors.workMode ? (
                  <p className="mt-1.5 text-[12px] text-[#ba1a1a]">{step1Errors.workMode}</p>
                ) : null}
              </div>

              <div>
                <label className="field-label" htmlFor="job-deadline">
                  {t("jobCreating.deadline")}
                </label>
                <input
                  id="job-deadline"
                  value={deadline}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setDeadline(nextValue);
                    if (step1Submitted) {
                      setStep1Errors(
                        validateWithSchema(jobCreateStep1Schema, { ...step1Values(), deadline: nextValue }),
                      );
                    }
                  }}
                  className={`input-field h-11 ${step1Errors.deadline ? "border-[#ba1a1a]" : ""}`}
                  type="date"
                />
                {step1Errors.deadline ? (
                  <p className="mt-1.5 text-[12px] text-[#ba1a1a]">{step1Errors.deadline}</p>
                ) : (
                  <p className="mt-1.5 text-[12px] text-[#8a8786]">{t("jobCreating.deadlineHint")}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="field-label">{t("jobCreating.shortPitch")}</label>
                <textarea
                  value={shortPitch}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setShortPitch(nextValue);
                    if (step1Submitted) {
                      setStep1Errors(
                        validateWithSchema(jobCreateStep1Schema, { ...step1Values(), shortPitch: nextValue }),
                      );
                    }
                  }}
                  className={`input-field min-h-[88px] resize-y ${step1Errors.shortPitch ? "border-[#ba1a1a]" : ""}`}
                  placeholder={t("jobCreating.placeholders.shortPitch")}
                  rows={3}
                />
                {step1Errors.shortPitch ? (
                  <p className="mt-1.5 text-[12px] text-[#ba1a1a]">{step1Errors.shortPitch}</p>
                ) : null}
                <p className="mt-1.5 text-[12px] text-[#8a8786]">
                  {t("jobCreating.shortPitchHint")}
                </p>
              </div>
            </div>

            <div className="-mx-5 flex flex-col-reverse gap-3 border-t border-[#ececec] px-5 pt-5 sm:flex-row sm:items-center sm:justify-between md:-mx-7 md:px-7">
              <button
                type="button"
                className="btn btn-secondary h-11 w-full sm:w-auto"
                onClick={() => persistDraft(1)}
                disabled={!canCreateJob}
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                {t("common.save")}
              </button>

              <button
                type="button"
                className="btn btn-primary h-11 w-full sm:w-auto"
                onClick={continueNext}
                disabled={!canCreateJob}
              >
                {t("jobCreating.nextToDescription")}
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </button>
            </div>
          </form>
        ) : null}

        {step === 2 ? (
          <div className="animate-fade-in space-y-7">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff1ef] text-[#b90014]">
                <span className="material-symbols-outlined text-[20px]">description</span>
              </span>
              <div>
                <h2 className="section-title">{t("jobCreating.steps.description")}</h2>
                <p className="text-[12px] text-[#8a8786]">
                  {t("jobCreating.descriptionHelp")}
                </p>
              </div>
            </div>

            <div>
              <label className="field-label">{t("jobCreating.jobDescription")}</label>
              <textarea
                value={description}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setDescription(nextValue);
                  if (step2Submitted) {
                    setStep2Errors(
                      validateWithSchema(jobCreateStep2Schema, {
                        description: nextValue,
                        requirements,
                      }),
                    );
                  }
                }}
                className={`input-field min-h-[160px] resize-y ${step2Errors.description ? "border-[#ba1a1a]" : ""}`}
                placeholder={t("jobCreating.placeholders.description")}
                rows={6}
              />
              {step2Errors.description ? (
                <p className="mt-1.5 text-[12px] text-[#ba1a1a]">{step2Errors.description}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-3 rounded-[14px] border border-[#ececec] bg-[#faf9f8] p-4">
                <p className="field-label mb-0">{t("jobCreating.responsibilities")}</p>
                <div className="flex gap-2">
                  <input
                    value={responsibilityInput}
                    onChange={(e) => setResponsibilityInput(e.target.value)}
                    className="input-field h-11"
                    placeholder={t("jobCreating.placeholders.addResponsibility")}
                  />
                  <button
                    type="button"
                    className="btn btn-dark h-11 shrink-0"
                    onClick={() => {
                      addListItem(responsibilityInput, setResponsibilities);
                      setResponsibilityInput("");
                    }}
                  >
                    {t("jobCreating.add")}
                  </button>
                </div>
                <ul className="space-y-2">
                  {responsibilities.map((r, idx) => (
                    <li
                      key={`${r}-${idx.toString()}`}
                      className="flex items-start justify-between gap-3 rounded-[10px] border border-[#ececec] bg-white px-3.5 py-2.5"
                    >
                      <span className="text-[14px] text-[#1a1c1c]">{r}</span>
                      <button
                        type="button"
                        className="text-[#8a8786] transition-colors hover:text-[#b90014]"
                        onClick={() => removeListItem(idx, setResponsibilities)}
                        aria-label={t("jobCreating.removeResponsibility")}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          close
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3 rounded-[14px] border border-[#ececec] bg-[#faf9f8] p-4">
                <p className="field-label mb-0">{t("jobCreating.requirements")}</p>
                <div className="flex gap-2">
                  <input
                    value={requirementInput}
                    onChange={(e) => setRequirementInput(e.target.value)}
                    className="input-field h-11"
                    placeholder={t("jobCreating.placeholders.addRequirement")}
                  />
                  <button
                    type="button"
                    className="btn btn-dark h-11 shrink-0"
                    onClick={() => {
                      addListItem(requirementInput, setRequirements);
                      setRequirementInput("");
                    }}
                  >
                    {t("jobCreating.add")}
                  </button>
                </div>
                <ul className="space-y-2">
                  {requirements.map((r, idx) => (
                    <li
                      key={`${r}-${idx.toString()}`}
                      className="flex items-start justify-between gap-3 rounded-[10px] border border-[#ececec] bg-white px-3.5 py-2.5"
                    >
                      <span className="text-[14px] text-[#1a1c1c]">{r}</span>
                      <button
                        type="button"
                        className="text-[#8a8786] transition-colors hover:text-[#b90014]"
                        onClick={() => removeListItem(idx, setRequirements)}
                        aria-label={t("jobCreating.removeRequirement")}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          close
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                {step2Errors.requirements ? (
                  <p className="text-[12px] text-[#ba1a1a]">{step2Errors.requirements}</p>
                ) : null}
              </div>
            </div>

            <div className="-mx-5 flex flex-col-reverse gap-3 border-t border-[#ececec] px-5 pt-5 sm:flex-row sm:items-center sm:justify-between md:-mx-7 md:px-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  className="btn btn-secondary h-11 w-full sm:w-auto"
                  onClick={goBack}
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  {t("common.back")}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost h-11 w-full sm:w-auto"
                  onClick={() => persistDraft(2)}
                  disabled={!canCreateJob}
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  {t("common.save")}
                </button>
              </div>

              <button
                type="button"
                className="btn btn-primary h-11 w-full sm:w-auto"
                onClick={continueNext}
                disabled={!canCreateJob}
              >
                {t("jobCreating.nextToSkills")}
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="animate-fade-in space-y-7">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff1ef] text-[#b90014]">
                <span className="material-symbols-outlined text-[20px]">workspace_premium</span>
              </span>
              <div>
                <h2 className="section-title">{t("jobCreating.steps.skillsSalary")}</h2>
                <p className="text-[12px] text-[#8a8786]">
                  {t("jobCreating.skillsSalaryHelp")}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="field-label">{t("jobCreating.requiredSkills")}</label>
              {skillsLoading ? (
                <div className="rounded-[10px] border border-[#ececec] bg-white px-4 py-3">
                  <LoadingIndicator label={t("jobCreating.loadingSkills")} size="sm" />
                </div>
              ) : (
                <div className="space-y-4">
                  <SkillPicker
                    emptyLabel={t("jobCreating.requiredSkillsEmpty")}
                    options={skillOptions}
                    placeholder={t("jobCreating.requiredSkillsPlaceholder")}
                    selectedValues={skills.map((skill) => skill.skillName)}
                    onAdd={(value) => addSkillRequirement(value, setSkills)}
                    onRemove={(value) => removeSkillRequirement(value, setSkills)}
                  />
                  {step3Errors.skills ? (
                    <p className="text-[12px] text-[#ba1a1a]">{step3Errors.skills}</p>
                  ) : null}

                  {skills.length ? (
                    <div className="space-y-3">
                      {skills.map((skill) => (
                        <div
                          key={skill.skillName}
                          className="grid items-center gap-3 rounded-[12px] border border-[#ececec] bg-[#faf9f8] px-4 py-3 md:grid-cols-[minmax(0,1fr)_200px]"
                        >
                          <div>
                            <p className="text-[14px] font-semibold text-[#1a1c1c]">
                              {skill.skillName}
                            </p>
                            <p className="mt-1 text-[12px] text-[#8a8786]">
                              {t("jobCreating.requiredSkillYearsHint")}
                            </p>
                          </div>

                          <div>
                            <label className="mb-1 block text-[11px] font-semibold text-[#8a8786]">
                              {t("jobCreating.minimumYears")}
                            </label>
                            <input
                              value={skill.minimumYearsOfExperience}
                              onChange={(e) =>
                                updateSkillRequirementYears(
                                  skill.skillName,
                                  e.target.value,
                                  setSkills,
                                )
                              }
                              className="input-field h-10 py-2"
                              inputMode="decimal"
                              placeholder={t("jobCreating.placeholders.yearsExample")}
                              type="text"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="space-y-2 border-t border-[#ececec] pt-4">
                    <label className="field-label">{t("jobCreating.niceToHaveSkills")}</label>
                    <SkillPicker
                      emptyLabel={t("jobCreating.niceToHaveEmpty")}
                      options={skillOptions}
                      placeholder={t("jobCreating.niceToHavePlaceholder")}
                      selectedValues={niceToHaveSkills.map((skill) => skill.skillName)}
                      onAdd={(value) => addSkillRequirement(value, setNiceToHaveSkills)}
                      onRemove={(value) => removeSkillRequirement(value, setNiceToHaveSkills)}
                    />

                    {niceToHaveSkills.length ? (
                      <div className="space-y-3">
                        {niceToHaveSkills.map((skill) => (
                          <div
                            key={skill.skillName}
                            className="grid items-center gap-3 rounded-[12px] border border-[#cfe1eb] bg-[#f7fbfd] px-4 py-3 md:grid-cols-[minmax(0,1fr)_200px]"
                          >
                            <div>
                              <p className="text-[14px] font-semibold text-[#005f93]">
                                {skill.skillName}
                              </p>
                              <p className="mt-1 text-[12px] text-[#5f5e5e]">
                                {t("jobCreating.niceToHaveYearsHint")}
                              </p>
                            </div>

                            <div>
                              <label className="mb-1 block text-[11px] font-semibold text-[#5f5e5e]">
                                {t("jobCreating.minimumYears")}
                              </label>
                              <input
                                value={skill.minimumYearsOfExperience}
                                onChange={(e) =>
                                  updateSkillRequirementYears(
                                    skill.skillName,
                                    e.target.value,
                                    setNiceToHaveSkills,
                                  )
                                }
                                className="h-10 w-full rounded-[10px] border border-[#cfe1eb] bg-white px-3 py-2 text-[14px] transition-all focus:border-[#005f93] focus:outline-none focus:ring-4 focus:ring-[#005f93]/10"
                                inputMode="decimal"
                                placeholder={t("jobCreating.placeholders.niceToHaveYearsExample")}
                                type="text"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-x-5 gap-y-4 border-t border-[#ececec] pt-6 md:grid-cols-3">
              <div>
                <label className="field-label">{t("jobCreating.minSalary")}</label>
                <input
                  value={salaryMin}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setSalaryMin(nextValue);
                    if (step3Submitted) {
                      setStep3Errors(
                        validateWithSchema(jobCreateStep3Schema, {
                          skills,
                          salaryMin: nextValue,
                          salaryMax,
                        }),
                      );
                    }
                  }}
                  className={`input-field h-11 ${step3Errors.salaryMin ? "border-[#ba1a1a]" : ""}`}
                  placeholder={t("jobCreating.placeholders.minSalary")}
                  inputMode="numeric"
                />
                {step3Errors.salaryMin ? (
                  <p className="mt-1.5 text-[12px] text-[#ba1a1a]">{step3Errors.salaryMin}</p>
                ) : null}
              </div>

              <div>
                <label className="field-label">{t("jobCreating.maxSalary")}</label>
                <input
                  value={salaryMax}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setSalaryMax(nextValue);
                    if (step3Submitted) {
                      setStep3Errors(
                        validateWithSchema(jobCreateStep3Schema, {
                          skills,
                          salaryMin,
                          salaryMax: nextValue,
                        }),
                      );
                    }
                  }}
                  className={`input-field h-11 ${step3Errors.salaryMax ? "border-[#ba1a1a]" : ""}`}
                  placeholder={t("jobCreating.placeholders.maxSalary")}
                  inputMode="numeric"
                />
                {step3Errors.salaryMax ? (
                  <p className="mt-1.5 text-[12px] text-[#ba1a1a]">{step3Errors.salaryMax}</p>
                ) : null}
              </div>

              <div>
                <label className="field-label">{t("sendOffer.currency")}</label>
                <input
                  value="VND"
                  readOnly
                  className="input-field h-11 cursor-not-allowed bg-[#f6f3f2] text-[#8a8786]"
                />
              </div>
            </div>

            <div className="-mx-5 flex flex-col-reverse gap-3 border-t border-[#ececec] px-5 pt-5 sm:flex-row sm:items-center sm:justify-between md:-mx-7 md:px-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  className="btn btn-secondary h-11 w-full sm:w-auto"
                  onClick={goBack}
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  {t("common.back")}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost h-11 w-full sm:w-auto"
                  onClick={() => persistDraft(3)}
                  disabled={!canCreateJob}
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  {t("common.save")}
                </button>
              </div>

              <button
                type="button"
                className="btn btn-primary h-11 w-full sm:w-auto"
                onClick={continueNext}
                disabled={!canCreateJob}
              >
                {t("jobCreating.nextToReview")}
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="animate-fade-in space-y-7">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff1ef] text-[#b90014]">
                <span className="material-symbols-outlined text-[20px]">fact_check</span>
              </span>
              <div>
                <h2 className="section-title">{t("jobCreating.steps.review")}</h2>
                <p className="text-[12px] text-[#8a8786]">
                  {t("jobCreating.reviewHelp")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="rounded-[14px] border border-[#ececec] bg-[#faf9f8] p-5">
                <p className="eyebrow">{t("jobCreating.steps.basicInfo")}</p>
                <p className="mt-3 text-[16px] font-semibold text-[#1a1c1c]">
                  {title || "—"}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[14px] text-[#5f5e5e]">
                  <span>{department}</span>
                  <span className="text-[#d6d2cf]">•</span>
                  <span>{location || "—"}</span>
                  {employmentType ? (
                    <span className={getEmploymentTypeBadgeClass(employmentType)}>
                      {employmentType}
                    </span>
                  ) : null}
                  {workMode ? (
                    <span className={getWorkModeChipClass()}>{workMode}</span>
                  ) : null}
                </div>
                <p className="mt-4 text-[14px] text-[#1a1c1c]">
                  {shortPitch || "—"}
                </p>
                <p className="mt-3 flex items-center gap-1.5 text-[13px] text-[#5f5e5e]">
                  <span className="material-symbols-outlined text-[17px]">event</span>
                  {deadline
                    ? t("jobCreating.reviewDeadline", {
                        date: new Date(`${deadline}T00:00:00`).toLocaleDateString(getDateLocale()),
                      })
                    : t("jobCreating.reviewNoDeadline")}
                </p>
              </div>

              <div className="rounded-[14px] border border-[#ececec] bg-[#faf9f8] p-5">
                <p className="eyebrow">{t("jobCreating.steps.skillsSalary")}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {skills.length ? (
                    skills.map((skill, index) => (
                      <span
                        key={skill.skillName}
                        className={getSkillChipClass(skill.skillName, index)}
                      >
                        {skill.skillName}
                        {skill.minimumYearsOfExperience
                          ? ` (${skill.minimumYearsOfExperience} ${t("jobCreating.yearsShort")})`
                          : ""}
                      </span>
                    ))
                  ) : (
                    <span className="text-[14px] text-[#5f5e5e]">—</span>
                  )}
                </div>
                {niceToHaveSkills.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {niceToHaveSkills.map((skill, index) => (
                      <span
                        key={skill.skillName}
                        className={getSkillChipClass(skill.skillName, index + skills.length)}
                      >
                        {skill.skillName}
                        {skill.minimumYearsOfExperience
                          ? ` (${skill.minimumYearsOfExperience} ${t("jobCreating.yearsShort")})`
                          : ""}
                      </span>
                    ))}
                  </div>
                ) : null}
                <p className="mt-4 text-[14px] font-semibold text-[#1a1c1c]">
                  {salaryMin && salaryMax
                    ? `${Number(salaryMin).toLocaleString(getDateLocale())} - ${Number(salaryMax).toLocaleString(getDateLocale())} VNĐ`
                    : salaryMin
                      ? `${Number(salaryMin).toLocaleString(getDateLocale())}+ VNĐ`
                      : salaryMax
                        ? t("jobCreating.maxSalaryOnly", { amount: Number(salaryMax).toLocaleString(getDateLocale()) })
                        : t("jobDetail.negotiable")}
                </p>
              </div>
            </div>

            <div className="rounded-[14px] border border-[#ececec] bg-[#faf9f8] p-5">
              <p className="eyebrow">{t("jobCreating.steps.description")}</p>
              <p className="mt-3 whitespace-pre-wrap text-[14px] leading-6 text-[#1a1c1c]">
                {description || "—"}
              </p>

              <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <p className="eyebrow">{t("jobCreating.responsibilities")}</p>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-[14px] text-[#1a1c1c]">
                    {responsibilities.length ? (
                      responsibilities.map((r, i) => (
                        <li key={`${r}-${i.toString()}`}>{r}</li>
                      ))
                    ) : (
                      <li>—</li>
                    )}
                  </ul>
                </div>
                <div>
                  <p className="eyebrow">{t("jobCreating.requirements")}</p>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-[14px] text-[#1a1c1c]">
                    {requirements.length ? (
                      requirements.map((r, i) => (
                        <li key={`${r}-${i.toString()}`}>{r}</li>
                      ))
                    ) : (
                      <li>—</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            <div className="-mx-5 flex flex-col-reverse gap-3 border-t border-[#ececec] px-5 pt-5 sm:flex-row sm:items-center sm:justify-between md:-mx-7 md:px-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  className="btn btn-secondary h-11 w-full sm:w-auto"
                  onClick={goBack}
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  {t("common.back")}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost h-11 w-full sm:w-auto"
                  onClick={() => persistDraft(4)}
                  disabled={!canCreateJob}
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  {t("common.save")}
                </button>
              </div>

              <AsyncActionButton
                type="button"
                className="btn btn-primary h-11 w-full sm:w-auto"
                onClick={publishJob}
                disabled={!canCreateJob || publishing}
                loading={publishing}
                loadingText={t("jobCreating.submitting")}
              >
                {t("jobCreating.submit")}
                <span className="material-symbols-outlined text-[18px]">
                  send
                </span>
              </AsyncActionButton>
            </div>
          </div>
        ) : null}
      </section>

      {/* Tip Bento Grid */}
      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="relative overflow-hidden rounded-[16px] bg-[#1a1c1c] p-6 text-white md:col-span-2">
          <div className="relative z-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
              {t("jobCreating.tipTitle")}
            </p>
            <h4 className="mt-2 text-[18px] font-semibold">
              {t("jobCreating.tipHeadline")}
            </h4>
            <p className="mt-2 max-w-xl text-[14px] leading-6 text-white/75">
              {t("jobCreating.tipBody")}
            </p>
          </div>
          <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-[120px] text-white/5">
            lightbulb
          </span>
        </div>

        <button
          type="button"
          className="card-interactive flex flex-col items-center justify-center p-6 text-center disabled:pointer-events-none disabled:opacity-50"
          onClick={applyEngineeringTemplate}
          disabled={!canUseTemplate}
        >
          <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff1ef] text-[#b90014]">
            <span className="material-symbols-outlined text-[24px]">history</span>
          </span>
          <p className="eyebrow">{t("jobCreating.recentTemplate")}</p>
          <p className="mt-1 text-[14px] font-medium text-[#1a1c1c]">
            {t("jobCreating.template.cta")}
          </p>
        </button>
      </div>
    </div>
  );
}

export default JobCreatingScreen;
