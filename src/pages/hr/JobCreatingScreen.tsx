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
  const [currency] = useState<string>(
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
        .min(1, "Hãy thêm ít nhất một yêu cầu."),
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
          .min(1, "Hãy chọn ít nhất một kỹ năng bắt buộc."),
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
    <div className="relative flex items-center justify-between">
      <div className="absolute left-5 right-5 top-5 h-[2px] bg-[#ececec]" />

      {(
        [
          { n: 1, label: "Thông tin cơ bản" },
          { n: 2, label: "Mô tả" },
          { n: 3, label: "Kỹ năng & Lương" },
          { n: 4, label: "Rà soát" },
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
        <p className="eyebrow">Tuyển dụng</p>
        <h1 className="page-title mt-1.5">Tạo tin tuyển dụng mới</h1>
        <p className="page-subtitle">
          Điền các thông tin chính để bắt đầu tạo chiến dịch tuyển dụng nội bộ.
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
                <h2 className="section-title">Thông tin cơ bản</h2>
                <p className="text-[12px] text-[#8a8786]">
                  Tiêu đề, phòng ban và hình thức làm việc của vị trí.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="field-label">Chức danh công việc</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field h-11"
                  placeholder="Ví dụ: Kỹ sư phần mềm cấp cao"
                  type="text"
                />
              </div>

              <div>
                <label className="field-label">Phòng ban</label>
                <CommonSelect
                  options={departments.map((d) => ({ label: d, value: d }))}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>

              <div>
                <label className="field-label">Loại hình công việc</label>
                <CommonSelect
                  options={employmentTypeOptions}
                  placeholder="Chọn loại hình công việc"
                  value={employmentType}
                  onChange={(e) =>
                    setEmploymentType(e.target.value as EmploymentType | "")
                  }
                />
              </div>

              <div>
                <label className="field-label">Địa điểm</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="input-field h-11"
                  placeholder="Ví dụ: TP. Ho Chi Minh"
                  type="text"
                />
              </div>

              <div>
                <label className="field-label">Hình thức làm việc</label>
                <CommonSelect
                  options={workModeOptions}
                  placeholder="Chọn hình thức làm việc"
                  value={workMode}
                  onChange={(e) => setWorkMode(e.target.value as WorkMode | "")}
                />
              </div>

              <div className="md:col-span-2">
                <label className="field-label">Mô tả ngắn</label>
                <textarea
                  value={shortPitch}
                  onChange={(e) => setShortPitch(e.target.value)}
                  className="input-field min-h-[88px] resize-y"
                  placeholder="Tóm tắt ngắn để hiển thị trên trang việc làm..."
                  rows={3}
                />
                <p className="mt-1.5 text-[12px] text-[#8a8786]">
                  Một câu súc tích thu hút ứng viên ngay từ danh sách việc làm.
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
                Lưu nháp
              </button>

              <button
                type="button"
                className="btn btn-primary h-11 w-full sm:w-auto"
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
          <div className="animate-fade-in space-y-7">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff1ef] text-[#b90014]">
                <span className="material-symbols-outlined text-[20px]">description</span>
              </span>
              <div>
                <h2 className="section-title">Mô tả công việc</h2>
                <p className="text-[12px] text-[#8a8786]">
                  Mô tả chi tiết, trách nhiệm và yêu cầu của vị trí.
                </p>
              </div>
            </div>

            <div>
              <label className="field-label">Mô tả công việc</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field min-h-[160px] resize-y"
                placeholder="Mô tả vai trò, phạm vi công việc và kỳ vọng..."
                rows={6}
              />
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-3 rounded-[14px] border border-[#ececec] bg-[#faf9f8] p-4">
                <p className="field-label mb-0">Trách nhiệm</p>
                <div className="flex gap-2">
                  <input
                    value={responsibilityInput}
                    onChange={(e) => setResponsibilityInput(e.target.value)}
                    className="input-field h-11"
                    placeholder="Thêm một trách nhiệm"
                  />
                  <button
                    type="button"
                    className="btn btn-dark h-11 shrink-0"
                    onClick={() => {
                      addListItem(responsibilityInput, setResponsibilities);
                      setResponsibilityInput("");
                    }}
                  >
                    Thêm
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
                        aria-label="Xóa trách nhiệm"
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
                <p className="field-label mb-0">Yêu cầu</p>
                <div className="flex gap-2">
                  <input
                    value={requirementInput}
                    onChange={(e) => setRequirementInput(e.target.value)}
                    className="input-field h-11"
                    placeholder="Thêm một yêu cầu"
                  />
                  <button
                    type="button"
                    className="btn btn-dark h-11 shrink-0"
                    onClick={() => {
                      addListItem(requirementInput, setRequirements);
                      setRequirementInput("");
                    }}
                  >
                    Thêm
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
                        aria-label="Xóa yêu cầu"
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

            <div className="-mx-5 flex flex-col-reverse gap-3 border-t border-[#ececec] px-5 pt-5 sm:flex-row sm:items-center sm:justify-between md:-mx-7 md:px-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  className="btn btn-secondary h-11 w-full sm:w-auto"
                  onClick={goBack}
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  Quay lại
                </button>
                <button
                  type="button"
                  className="btn btn-ghost h-11 w-full sm:w-auto"
                  onClick={() => persistDraft(2)}
                  disabled={!canCreateJob}
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  Lưu nháp
                </button>
              </div>

              <button
                type="button"
                className="btn btn-primary h-11 w-full sm:w-auto"
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
          <div className="animate-fade-in space-y-7">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff1ef] text-[#b90014]">
                <span className="material-symbols-outlined text-[20px]">workspace_premium</span>
              </span>
              <div>
                <h2 className="section-title">Kỹ năng &amp; Lương</h2>
                <p className="text-[12px] text-[#8a8786]">
                  Kỹ năng yêu cầu và khoảng lương cho vị trí này.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="field-label">Kỹ năng bắt buộc</label>
              {skillsLoading ? (
                <div className="rounded-[10px] border border-[#ececec] bg-white px-4 py-3">
                  <LoadingIndicator label="Đang tải kỹ năng..." size="sm" />
                </div>
              ) : (
                <div className="space-y-4">
                  <SkillPicker
                    emptyLabel="Chọn kỹ năng yêu cầu từ danh sách kỹ năng hiện có."
                    options={skillOptions}
                    placeholder="Chọn kỹ năng bắt buộc"
                    selectedValues={skills.map((skill) => skill.skillName)}
                    onAdd={(value) => addSkillRequirement(value, setSkills)}
                    onRemove={(value) => removeSkillRequirement(value, setSkills)}
                  />

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
                              Có thể để trống nếu chỉ cần ứng viên có kỹ năng này.
                            </p>
                          </div>

                          <div>
                            <label className="mb-1 block text-[11px] font-semibold text-[#8a8786]">
                              Số năm tối thiểu
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
                              placeholder="VD: 1.5"
                              type="text"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="space-y-2 border-t border-[#ececec] pt-4">
                    <label className="field-label">Kỹ năng cộng điểm</label>
                    <SkillPicker
                      emptyLabel="Kỹ năng không bắt buộc nhưng giúp ứng viên được đánh giá tốt hơn."
                      options={skillOptions}
                      placeholder="Chọn kỹ năng cộng điểm"
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
                                Ngưỡng kinh nghiệm dùng để cộng điểm phù hợp.
                              </p>
                            </div>

                            <div>
                              <label className="mb-1 block text-[11px] font-semibold text-[#5f5e5e]">
                                Số năm tối thiểu
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
                                placeholder="VD: 0.5"
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
                <label className="field-label">Lương tối thiểu (VND/tháng)</label>
                <input
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  className="input-field h-11"
                  placeholder="Ví dụ: 20000000"
                  inputMode="numeric"
                />
              </div>

              <div>
                <label className="field-label">Lương tối đa (VND/tháng)</label>
                <input
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                  className="input-field h-11"
                  placeholder="Ví dụ: 35000000"
                  inputMode="numeric"
                />
              </div>

              <div>
                <label className="field-label">Tiền tệ</label>
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
                  Quay lại
                </button>
                <button
                  type="button"
                  className="btn btn-ghost h-11 w-full sm:w-auto"
                  onClick={() => persistDraft(3)}
                  disabled={!canCreateJob}
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  Lưu nháp
                </button>
              </div>

              <button
                type="button"
                className="btn btn-primary h-11 w-full sm:w-auto"
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
          <div className="animate-fade-in space-y-7">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff1ef] text-[#b90014]">
                <span className="material-symbols-outlined text-[20px]">fact_check</span>
              </span>
              <div>
                <h2 className="section-title">Rà soát tin tuyển dụng</h2>
                <p className="text-[12px] text-[#8a8786]">
                  Kiểm tra lại thông tin trước khi gửi phê duyệt.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="rounded-[14px] border border-[#ececec] bg-[#faf9f8] p-5">
                <p className="eyebrow">Thông tin cơ bản</p>
                <p className="mt-3 text-[16px] font-semibold text-[#1a1c1c]">
                  {title || "—"}
                </p>
                <p className="mt-1 text-[14px] text-[#5f5e5e]">
                  {department} · {location || "—"} · {employmentType || "—"} ·{" "}
                  {workMode || "—"}
                </p>
                <p className="mt-4 text-[14px] text-[#1a1c1c]">
                  {shortPitch || "—"}
                </p>
              </div>

              <div className="rounded-[14px] border border-[#ececec] bg-[#faf9f8] p-5">
                <p className="eyebrow">Kỹ năng &amp; Lương</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {skills.length ? (
                    skills.map((skill) => (
                      <span
                        key={skill.skillName}
                        className="badge bg-white text-[#1a1c1c] ring-1 ring-inset ring-[#ececec]"
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
                        className="badge bg-[#005f93]/10 text-[#005f93]"
                      >
                        {skill.skillName}
                        {skill.minimumYearsOfExperience
                          ? ` (${skill.minimumYearsOfExperience} yrs)`
                          : ""}
                      </span>
                    ))}
                  </div>
                ) : null}
                <p className="mt-4 text-[14px] font-semibold text-[#1a1c1c]">
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

            <div className="rounded-[14px] border border-[#ececec] bg-[#faf9f8] p-5">
              <p className="eyebrow">Mô tả</p>
              <p className="mt-3 whitespace-pre-wrap text-[14px] leading-6 text-[#1a1c1c]">
                {description || "—"}
              </p>

              <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <p className="eyebrow">Trách nhiệm</p>
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
                  <p className="eyebrow">Yêu cầu</p>
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
                  Quay lại
                </button>
                <button
                  type="button"
                  className="btn btn-ghost h-11 w-full sm:w-auto"
                  onClick={() => persistDraft(4)}
                  disabled={!canCreateJob}
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  Lưu nháp
                </button>
              </div>

              <AsyncActionButton
                type="button"
                className="btn btn-primary h-11 w-full sm:w-auto"
                onClick={publishJob}
                disabled={!canCreateJob || publishing}
                loading={publishing}
                loadingText="Đang gửi phê duyệt..."
              >
                Gửi job chờ duyệt
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
              Mẹo tuyển dụng
            </p>
            <h4 className="mt-2 text-[18px] font-semibold">
              Mô tả rõ ràng thu hút ứng viên tốt hơn
            </h4>
            <p className="mt-2 max-w-xl text-[14px] leading-6 text-white/75">
              Tin tuyển dụng có mô tả chi tiết kèm khoảng lương rõ ràng nhận được
              chất lượng ứng tuyển cao hơn 30% trong 48 giờ đầu đăng tin.
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
          <p className="eyebrow">Mẫu gần đây</p>
          <p className="mt-1 text-[14px] font-medium text-[#1a1c1c]">
            Dùng mẫu Engineering L4
          </p>
        </button>
      </div>
    </div>
  );
}

export default JobCreatingScreen;
