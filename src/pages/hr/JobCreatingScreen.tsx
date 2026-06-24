import { useEffect, useMemo, useState } from "react";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AsyncActionButton from "../../common/components/AsyncActionButton";
import CommonSelect from "../../common/components/CommonSelect";
import LoadingIndicator from "../../common/components/LoadingIndicator";
import SkillPicker from "../../common/components/SkillPicker";
import { usePermissions } from "../../hooks/usePermissions";
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

type CreatedJob = {
  id: string;
  title: string;
  department: string;
  createdDate: string;
  createdAt: number;
  approvalStatus: "Pending";
  applicationsCount: number;
};

const departments = ["Engineering", "Product", "Design", "Marketing", "Sales"];
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
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canCreateJob = hasPermission(PERMISSIONS.JOB_CREATE);
  const canApproveJob = hasPermission(PERMISSIONS.JOB_APPROVE);
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
  const [currency, setCurrency] = useState<string>(
    () => "VND",
  );
  const [publishing, setPublishing] = useState(false);

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

  function persistDraft(nextStep = step) {
    const payload: DraftState = {
      step: nextStep,
      title,
      department,
      location,
      employmentType,
      workMode,
      shortPitch,
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
    toast.success("Đã lưu nháp.");
  }

  function applyEngineeringTemplate() {
    setTitle("Senior Software Engineer");
    setDepartment("Engineering");
    setLocation("Ho Chi Minh City");
    setEmploymentType("Full-time");
    setWorkMode("Hybrid");
    setShortPitch(
      "Build high-performance internal recruiting workflows for enterprise teams.",
    );
    toast.info("Đã áp dụng mẫu.");
  }

  function validateStep1() {
    const schema = yup.object({
      title: yup.string().trim().required("Vui lòng nhập tiêu đề tuyển dụng."),
      department: yup.string().trim().required("Vui lòng chọn phòng ban."),
      location: yup.string().trim().required("Vui lòng nhập địa điểm làm việc."),
      employmentType: yup.string().required("Vui lòng chọn loại hình làm việc."),
      workMode: yup.string().required("Vui lòng chọn hình thức làm việc."),
      shortPitch: yup.string().trim().required("Vui lòng nhập mô tả ngắn."),
    });

    try {
      schema.validateSync(
        { title, department, location, employmentType, workMode, shortPitch },
        { abortEarly: false },
      );
      return true;
    } catch (err) {
      if (err instanceof yup.ValidationError)
        toast.error(err.errors?.[0] || "Dữ liệu chưa hợp lệ");
      return false;
    }
  }

  function validateStep2() {
    const schema = yup.object({
      description: yup.string().trim().required("Job description is required."),
      requirements: yup
        .array()
        .of(yup.string())
        .min(1, "Add at least one requirement."),
    });

    try {
      schema.validateSync({ description, requirements }, { abortEarly: false });
      return true;
    } catch (err) {
      if (err instanceof yup.ValidationError)
        toast.error(err.errors?.[0] || "Dữ liệu chưa hợp lệ");
      return false;
    }
  }

  function validateStep3() {
    const schema = yup
      .object({
        skills: yup
          .array()
          .of(
            yup.object({
              skillName: yup.string().trim().required(),
              minimumYearsOfExperience: yup
                .string()
                .test(
                  "valid-minimum-years",
                  "Years of experience must be 0.5-step values such as 0.5, 1, 1.5.",
                  (value) => {
                    if (!value) return true;
                    const parsedValue = Number(value);
                    return Number.isFinite(parsedValue) && parsedValue >= 0 && (parsedValue * 2) % 1 === 0;
                  },
                ),
            }),
          )
          .min(1, "Add at least one required skill."),
        salaryMin: yup.number().nullable().transform((value, originalValue) =>
          originalValue === "" || originalValue == null ? null : value,
        ),
        salaryMax: yup.number().nullable().transform((value, originalValue) =>
          originalValue === "" || originalValue == null ? null : value,
        ),
      })
      .test(
        "min<=max",
        "Salary min must be less than or equal to max.",
        (val) => {
          if (!val) return false;
          if (val.salaryMin == null || val.salaryMax == null) return true;
          return Number(val.salaryMin) <= Number(val.salaryMax);
        },
      );

    try {
      schema.validateSync(
        { skills, salaryMin, salaryMax },
        { abortEarly: false },
      );
      return true;
    } catch (err) {
      if (err instanceof yup.ValidationError)
        toast.error(err.errors?.[0] || "Dữ liệu chưa hợp lệ");
      return false;
    }
  }

  function addListItem(
    value: string,
    setter: (updater: (prev: string[]) => string[]) => void,
  ) {
    const next = value.trim();
    if (!next) return;
    setter((prev) => {
      const exists = prev.some((p) => p.toLowerCase() === next.toLowerCase());
      return exists ? prev : [...prev, next];
    });
  }

  function removeListItem(
    index: number,
    setter: (updater: (prev: string[]) => string[]) => void,
  ) {
    setter((prev) => prev.filter((_, i) => i !== index));
  }

  function addSkillRequirement(
    skillName: string,
    setter: (updater: (prev: SkillRequirementDraft[]) => SkillRequirementDraft[]) => void,
  ) {
    const next = skillName.trim();
    if (!next) return;

    setter((prev) => {
      const exists = prev.some((item) => item.skillName.toLowerCase() === next.toLowerCase());
      return exists
        ? prev
        : [
            ...prev,
            {
              skillName: next,
              minimumYearsOfExperience: "",
            },
          ];
    });
  }

  function removeSkillRequirement(
    skillName: string,
    setter: (updater: (prev: SkillRequirementDraft[]) => SkillRequirementDraft[]) => void,
  ) {
    setter((prev) => prev.filter((item) => item.skillName !== skillName));
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
      prev.map((item) =>
        item.skillName === skillName
          ? {
              ...item,
              minimumYearsOfExperience: normalizedValue,
            }
          : item,
      ),
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

    toast.info(
      next === 2
        ? "Basic info saved. Continue with description."
        : next === 3
          ? "Description saved. Continue with skills & pay."
          : "Almost done. Review your posting.",
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
        deadline: null,
        departmentId: null,
        skillIds: skillRequirements
          .map((item) => item.skillId)
          .filter((value): value is string => Boolean(value)),
        minExperienceYears: 0,
      });

      window.localStorage.removeItem(draftStorageKey);
      toast.success("Đã gửi tin tuyển dụng để duyệt.");
      navigate("/jobs");
    } catch {
      toast.error("Không thể gửi tin tuyển dụng.");
    } finally {
      setPublishing(false);
    }
  }

  const stepper = (
    <div className="relative mb-12 flex items-center justify-between">
      <div className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-[#e2dfde]" />

      {(
        [
          { n: 1, label: "Basic Info" },
          { n: 2, label: "Description" },
          { n: 3, label: "Skills & Pay" },
          { n: 4, label: "Review" },
        ] as const
      ).map((s) => {
        const active = step === s.n;
        const completed = step > s.n;

        const circleClass = completed
          ? "bg-[#0079b9] text-white"
          : active
            ? "bg-[#b90014] text-white"
            : "bg-[#eeeeee] text-[#5f5e5e]";

        const labelClass = completed
          ? "text-[#0079b9]"
          : active
            ? "text-[#b90014]"
            : "text-[#5f5e5e]";

        return (
          <div
            key={s.n}
            className="relative z-10 flex flex-col items-center gap-2 bg-[#f9f9f9] px-4"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-4 border-[#f9f9f9] text-[14px] font-bold ${circleClass}`}
            >
              {s.n}
            </div>
            <span className={`text-[12px] font-bold ${labelClass}`}>
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="w-full px-4 py-12 md:px-10">
      {stepper}

      {/* Content Card */}
      <section className="rounded-lg border border-[#e2dfde] bg-white p-4 shadow-sm md:p-8">
        <div className="mb-8">
          <h2 className="text-[32px] font-semibold leading-10 tracking-[-0.01em]">
            Tạo tin tuyển dụng mới
          </h2>
          <p className="mt-2 text-[16px] leading-6 text-[#5f5e5e]">
            Điền các thông tin chính để bắt đầu tạo chiến dịch tuyển dụng nội
            bộ.
          </p>
        </div>

        {step === 1 ? (
          <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-[12px] font-semibold uppercase tracking-[0.18em]">
                  Chức danh công việc
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-none border border-[#e2dfde] px-4 py-3 text-[14px] focus:border-[#1a1c1c] focus:ring-0"
                  placeholder="Ví dụ: Kỹ sư phần mềm cấp cao"
                  type="text"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[12px] font-semibold uppercase tracking-[0.18em]">
                  Phòng ban
                </label>
                <CommonSelect
                  options={departments.map((d) => ({ label: d, value: d }))}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[12px] font-semibold uppercase tracking-[0.18em]">
                  Loại hình công việc
                </label>
                <CommonSelect
                  options={employmentTypeOptions}
                  placeholder="Chọn loại hình công việc"
                  value={employmentType}
                  onChange={(e) =>
                    setEmploymentType(e.target.value as EmploymentType | "")
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[12px] font-semibold uppercase tracking-[0.18em]">
                  Địa điểm
                </label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-none border border-[#e2dfde] px-4 py-3 text-[14px] focus:border-[#1a1c1c] focus:ring-0"
                  placeholder="Ví dụ: TP. Ho Chi Minh"
                  type="text"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[12px] font-semibold uppercase tracking-[0.18em]">
                  Hình thức làm việc
                </label>
                <CommonSelect
                  options={workModeOptions}
                  placeholder="Chọn hình thức làm việc"
                  value={workMode}
                  onChange={(e) => setWorkMode(e.target.value as WorkMode | "")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[12px] font-semibold uppercase tracking-[0.18em]">
                Mô tả ngắn
              </label>
              <textarea
                value={shortPitch}
                onChange={(e) => setShortPitch(e.target.value)}
                className="w-full rounded-none border border-[#e2dfde] px-4 py-3 text-[14px] focus:border-[#1a1c1c] focus:ring-0"
                placeholder="A one-sentence summary for job boards..."
                rows={3}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e2dfde] pt-8">
              <button
                type="button"
                className="rounded-none border border-[#e2dfde] px-6 py-2 text-[12px] font-bold text-[#5f5e5e] transition-colors hover:bg-[#f3f3f3]"
                onClick={() => persistDraft(1)}
                disabled={!canCreateJob}
              >
                Lưu nháp
              </button>

              <button
                type="button"
                className="flex items-center gap-2 rounded-none bg-[#b90014] px-8 py-3 text-[12px] font-bold text-white transition-transform active:scale-95"
                onClick={continueNext}
                disabled={!canCreateJob}
              >
                Tiếp tục tới phần mô tả
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </button>
            </div>
          </form>
        ) : null}

        {step === 2 ? (
          <div className="space-y-8">
            <div className="space-y-2">
              <label className="block text-[12px] font-semibold uppercase tracking-[0.18em]">
                Job Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-none border border-[#e2dfde] px-4 py-3 text-[14px] focus:border-[#1a1c1c] focus:ring-0"
                placeholder="Describe the role, impact, and expectations..."
                rows={6}
              />
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-3">
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em]">
                  Responsibilities
                </p>
                <div className="flex gap-2">
                  <input
                    value={responsibilityInput}
                    onChange={(e) => setResponsibilityInput(e.target.value)}
                    className="w-full rounded-none border border-[#e2dfde] px-4 py-3 text-[14px] focus:border-[#1a1c1c] focus:ring-0"
                    placeholder="Add a responsibility"
                  />
                  <button
                    type="button"
                    className="rounded-none bg-[#f3f3f3] px-4 py-3 text-[12px] font-bold text-[#1a1c1c] transition-colors hover:bg-[#e8e8e8]"
                    onClick={() => {
                      addListItem(responsibilityInput, setResponsibilities);
                      setResponsibilityInput("");
                    }}
                  >
                    Add
                  </button>
                </div>
                <ul className="space-y-2">
                  {responsibilities.map((r, idx) => (
                    <li
                      key={`${r}-${idx.toString()}`}
                      className="flex items-start justify-between gap-3 border border-[#e2dfde] bg-[#f9f9f9] px-4 py-3"
                    >
                      <span className="text-[14px] text-[#1a1c1c]">{r}</span>
                      <button
                        type="button"
                        className="text-[#5f5e5e] transition-colors hover:text-[#b90014]"
                        onClick={() => removeListItem(idx, setResponsibilities)}
                        aria-label="Remove responsibility"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          close
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em]">
                  Requirements
                </p>
                <div className="flex gap-2">
                  <input
                    value={requirementInput}
                    onChange={(e) => setRequirementInput(e.target.value)}
                    className="w-full rounded-none border border-[#e2dfde] px-4 py-3 text-[14px] focus:border-[#1a1c1c] focus:ring-0"
                    placeholder="Add a requirement"
                  />
                  <button
                    type="button"
                    className="rounded-none bg-[#f3f3f3] px-4 py-3 text-[12px] font-bold text-[#1a1c1c] transition-colors hover:bg-[#e8e8e8]"
                    onClick={() => {
                      addListItem(requirementInput, setRequirements);
                      setRequirementInput("");
                    }}
                  >
                    Add
                  </button>
                </div>
                <ul className="space-y-2">
                  {requirements.map((r, idx) => (
                    <li
                      key={`${r}-${idx.toString()}`}
                      className="flex items-start justify-between gap-3 border border-[#e2dfde] bg-[#f9f9f9] px-4 py-3"
                    >
                      <span className="text-[14px] text-[#1a1c1c]">{r}</span>
                      <button
                        type="button"
                        className="text-[#5f5e5e] transition-colors hover:text-[#b90014]"
                        onClick={() => removeListItem(idx, setRequirements)}
                        aria-label="Remove requirement"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          close
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e2dfde] pt-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-none border border-[#e2dfde] px-6 py-2 text-[12px] font-bold text-[#5f5e5e] transition-colors hover:bg-[#f3f3f3]"
                  onClick={goBack}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="rounded-none border border-[#e2dfde] px-6 py-2 text-[12px] font-bold text-[#5f5e5e] transition-colors hover:bg-[#f3f3f3]"
                  onClick={() => persistDraft(2)}
                  disabled={!canCreateJob}
                >
                  Lưu nháp
                </button>
              </div>

              <button
                type="button"
                className="flex items-center gap-2 rounded-none bg-[#b90014] px-8 py-3 text-[12px] font-bold text-white transition-transform active:scale-95"
                onClick={continueNext}
                disabled={!canCreateJob}
              >
                Tiếp tục tới kỹ năng và lương
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-8">
            <div className="space-y-2">
              <label className="block text-[12px] font-semibold uppercase tracking-[0.18em]">
                Required Skills
              </label>
              {skillsLoading ? (
                <div className="rounded-xl border border-[#e2dfde] bg-white px-4 py-3">
                  <LoadingIndicator label="Loading skills..." size="sm" />
                </div>
              ) : (
                <div className="space-y-4">
                  <SkillPicker
                    emptyLabel="Chọn kỹ năng yêu cầu từ danh sách kỹ năng hiện có."
                    options={skillOptions}
                    placeholder="Choose a required skill"
                    selectedValues={skills.map((skill) => skill.skillName)}
                    onAdd={(value) => addSkillRequirement(value, setSkills)}
                    onRemove={(value) => removeSkillRequirement(value, setSkills)}
                  />

                  {skills.length ? (
                    <div className="space-y-3">
                      {skills.map((skill) => (
                        <div
                          key={skill.skillName}
                          className="grid gap-3 border border-[#e2dfde] bg-[#f9f9f9] px-4 py-3 md:grid-cols-[minmax(0,1fr)_200px]"
                        >
                          <div>
                            <p className="text-[14px] font-semibold text-[#1a1c1c]">
                              {skill.skillName}
                            </p>
                            <p className="mt-1 text-[12px] text-[#5f5e5e]">
                              Optional minimum experience. Leave blank if the role only needs this skill to be present.
                            </p>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f5e5e]">
                              Minimum years
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
                              className="w-full rounded-none border border-[#e2dfde] bg-white px-3 py-2 text-[14px] focus:border-[#1a1c1c] focus:ring-0"
                              inputMode="decimal"
                              placeholder="e.g. 1.5"
                              type="text"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <label className="block text-[12px] font-semibold uppercase tracking-[0.18em]">
                      Nice To Have Skills
                    </label>
                    <SkillPicker
                      emptyLabel="Optional skills that improve candidate ranking."
                      options={skillOptions}
                      placeholder="Choose an optional skill"
                      selectedValues={niceToHaveSkills.map((skill) => skill.skillName)}
                      onAdd={(value) => addSkillRequirement(value, setNiceToHaveSkills)}
                      onRemove={(value) => removeSkillRequirement(value, setNiceToHaveSkills)}
                    />

                    {niceToHaveSkills.length ? (
                      <div className="space-y-3">
                        {niceToHaveSkills.map((skill) => (
                          <div
                            key={skill.skillName}
                            className="grid gap-3 border border-[#cfe1eb] bg-[#f7fbfd] px-4 py-3 md:grid-cols-[minmax(0,1fr)_200px]"
                          >
                            <div>
                              <p className="text-[14px] font-semibold text-[#005f93]">
                                {skill.skillName}
                              </p>
                              <p className="mt-1 text-[12px] text-[#5f5e5e]">
                                Optional experience threshold used for bonus matching.
                              </p>
                            </div>

                            <div className="space-y-2">
                              <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f5e5e]">
                                Minimum years
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
                                className="w-full rounded-none border border-[#cfe1eb] bg-white px-3 py-2 text-[14px] focus:border-[#005f93] focus:ring-0"
                                inputMode="decimal"
                                placeholder="e.g. 0.5"
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

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="space-y-2">
                <label className="block text-[12px] font-semibold uppercase tracking-[0.18em]">
                  Lương tối thiểu (VND/tháng)
                </label>
                <input
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  className="w-full rounded-none border border-[#e2dfde] px-4 py-3 text-[14px] focus:border-[#1a1c1c] focus:ring-0"
                  placeholder="Ví dụ: 20000000"
                  inputMode="numeric"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[12px] font-semibold uppercase tracking-[0.18em]">
                  Lương tối đa (VND/tháng)
                </label>
                <input
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                  className="w-full rounded-none border border-[#e2dfde] px-4 py-3 text-[14px] focus:border-[#1a1c1c] focus:ring-0"
                  placeholder="Ví dụ: 35000000"
                  inputMode="numeric"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[12px] font-semibold uppercase tracking-[0.18em]">
                  Tiền tệ
                </label>
                <input
                  value="VND"
                  readOnly
                  className="w-full rounded-none border border-[#e2dfde] bg-[#f3f3f3] px-4 py-3 text-[14px] text-[#5f5e5e]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e2dfde] pt-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-none border border-[#e2dfde] px-6 py-2 text-[12px] font-bold text-[#5f5e5e] transition-colors hover:bg-[#f3f3f3]"
                  onClick={goBack}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="rounded-none border border-[#e2dfde] px-6 py-2 text-[12px] font-bold text-[#5f5e5e] transition-colors hover:bg-[#f3f3f3]"
                  onClick={() => persistDraft(3)}
                  disabled={!canCreateJob}
                >
                  Lưu nháp
                </button>
              </div>

              <button
                type="button"
                className="flex items-center gap-2 rounded-none bg-[#b90014] px-8 py-3 text-[12px] font-bold text-white transition-transform active:scale-95"
                onClick={continueNext}
                disabled={!canCreateJob}
              >
                Tiếp tục tới bước rà soát
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="border border-[#e2dfde] bg-[#f9f9f9] p-6">
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">
                  Basic Info
                </p>
                <p className="mt-3 text-[16px] font-semibold">{title || "—"}</p>
                <p className="mt-1 text-[14px] text-[#5f5e5e]">
                  {department} · {location || "—"} · {employmentType || "—"} ·{" "}
                  {workMode || "—"}
                </p>
                <p className="mt-4 text-[14px] text-[#1a1c1c]">
                  {shortPitch || "—"}
                </p>
              </div>

              <div className="border border-[#e2dfde] bg-[#f9f9f9] p-6">
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">
                  Skills & Pay
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {skills.length ? (
                    skills.map((skill) => (
                      <span
                        key={skill.skillName}
                        className="border border-[#e2dfde] bg-white px-3 py-1 text-[12px] font-semibold"
                      >
                        {skill.skillName}
                        {skill.minimumYearsOfExperience
                          ? ` (${skill.minimumYearsOfExperience} yrs)`
                          : ""}
                      </span>
                    ))
                  ) : (
                    <span className="text-[14px] text-[#5f5e5e]">—</span>
                  )}
                </div>
                {niceToHaveSkills.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {niceToHaveSkills.map((skill) => (
                      <span
                        key={skill.skillName}
                        className="border border-[#005f93]/20 bg-[#005f93]/10 px-3 py-1 text-[12px] font-semibold text-[#005f93]"
                      >
                        {skill.skillName}
                        {skill.minimumYearsOfExperience
                          ? ` (${skill.minimumYearsOfExperience} yrs)`
                          : ""}
                      </span>
                    ))}
                  </div>
                ) : null}
                <p className="mt-4 text-[14px] text-[#1a1c1c]">
                  {salaryMin && salaryMax
                    ? `${Number(salaryMin).toLocaleString("vi-VN")} - ${Number(salaryMax).toLocaleString("vi-VN")} VNĐ`
                    : salaryMin
                      ? `${Number(salaryMin).toLocaleString("vi-VN")}+ VNĐ`
                      : salaryMax
                        ? `Tối đa ${Number(salaryMax).toLocaleString("vi-VN")} VNĐ`
                        : "Thương lượng"}
                </p>
              </div>
            </div>

            <div className="border border-[#e2dfde] bg-[#f9f9f9] p-6">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">
                Description
              </p>
              <p className="mt-3 whitespace-pre-wrap text-[14px] text-[#1a1c1c]">
                {description || "—"}
              </p>

              <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">
                    Responsibilities
                  </p>
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
                  <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">
                    Requirements
                  </p>
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

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e2dfde] pt-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-none border border-[#e2dfde] px-6 py-2 text-[12px] font-bold text-[#5f5e5e] transition-colors hover:bg-[#f3f3f3]"
                  onClick={goBack}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="rounded-none border border-[#e2dfde] px-6 py-2 text-[12px] font-bold text-[#5f5e5e] transition-colors hover:bg-[#f3f3f3]"
                  onClick={() => persistDraft(4)}
                  disabled={!canCreateJob}
                >
                  Lưu nháp
                </button>
              </div>

              <AsyncActionButton
                type="button"
                className="flex items-center gap-2 rounded-none bg-[#b90014] px-8 py-3 text-[12px] font-bold text-white transition-transform active:scale-95"
                onClick={publishJob}
                disabled={!canCreateJob || publishing}
                loading={publishing}
                loadingText="Đang gửi phê duyệt..."
              >
                Gửi job chờ duyệt
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </AsyncActionButton>
            </div>
          </div>
        ) : null}
      </section>

      {/* Tip Bento Grid */}
      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="relative overflow-hidden rounded-lg bg-[#0079b9] p-6 text-white md:col-span-2">
          <div className="relative z-10">
            <h4 className="text-[20px] font-bold">Recruitment Tip</h4>
            <p className="mt-2 text-[14px] opacity-90">
              Detailed job descriptions with clear salary ranges see 30% higher
              application quality within the first 48 hours of posting.
            </p>
          </div>
          <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-[120px] opacity-10">
            lightbulb
          </span>
        </div>

        <button
          type="button"
          className="flex flex-col items-center justify-center rounded-lg bg-[#e8e8e8] p-6 text-center transition-colors hover:bg-[#e2e2e2]"
          onClick={applyEngineeringTemplate}
          disabled={!canUseTemplate}
        >
          <span className="material-symbols-outlined mb-2 text-[32px] text-[#b90014]">
            history
          </span>
          <p className="text-[12px] font-bold uppercase tracking-[0.05em]">
            Recent Templates
          </p>
          <p className="mt-1 text-[14px] text-[#5f5e5e]">
            Dùng mẫu Engineering L4
          </p>
        </button>
      </div>
    </div>
  );
}

export default JobCreatingScreen;
