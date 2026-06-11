import { useEffect, useMemo, useState } from "react";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import CommonSelect from "../../common/components/CommonSelect";
import LoadingIndicator from "../../common/components/LoadingIndicator";
import SkillPicker from "../../common/components/SkillPicker";
import { usePermissions } from "../../hooks/usePermissions";
import { employmentTypeLabels, workModeLabels, type EmploymentType, type SkillDto, type WorkMode } from "../../modules/jobs/jobsSchema";
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

  skills: string[];
  salaryMin: string;
  salaryMax: string;
  currency: string;
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
const currencies = ["USD", "EUR", "GBP", "JPY", "VND"];
const employmentTypeOptions = Object.entries(employmentTypeLabels).map(([value, label]) => ({ value, label }));
const workModeOptions = Object.entries(workModeLabels).map(([value, label]) => ({ value, label }));

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

function loadDraft(): DraftState | null {
  const parsed = safeJsonParse<Partial<DraftState>>(
    window.localStorage.getItem(draftStorageKey)
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
      parsed.employmentType === "Full-time" || parsed.employmentType === "Part-time" || parsed.employmentType === "Internship" || parsed.employmentType === "Contract"
        ? parsed.employmentType
        : "",
    workMode: parsed.workMode === "Remote" || parsed.workMode === "Hybrid" || parsed.workMode === "Onsite" ? parsed.workMode : "",
    shortPitch: typeof parsed.shortPitch === "string" ? parsed.shortPitch : "",

    description: typeof parsed.description === "string" ? parsed.description : "",
    responsibilities: normalizeList(parsed.responsibilities),
    requirements: normalizeList(parsed.requirements),

    skills: normalizeList(parsed.skills),
    salaryMin: typeof parsed.salaryMin === "string" ? parsed.salaryMin : "",
    salaryMax: typeof parsed.salaryMax === "string" ? parsed.salaryMax : "",
    currency: typeof parsed.currency === "string" && parsed.currency ? parsed.currency : "USD",
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
  const [department, setDepartment] = useState<string>(() => initialDraft?.department ?? "Engineering");
  const [location, setLocation] = useState<string>(() => initialDraft?.location ?? "");
  const [employmentType, setEmploymentType] = useState<EmploymentType | "">(
    () => initialDraft?.employmentType ?? ""
  );
  const [workMode, setWorkMode] = useState<WorkMode | "">(() => initialDraft?.workMode ?? "");
  const [shortPitch, setShortPitch] = useState<string>(() => initialDraft?.shortPitch ?? "");

  // Step 2
  const [description, setDescription] = useState<string>(() => initialDraft?.description ?? "");
  const [responsibilities, setResponsibilities] = useState<string[]>(
    () => initialDraft?.responsibilities ?? []
  );
  const [requirements, setRequirements] = useState<string[]>(() => initialDraft?.requirements ?? []);
  const [responsibilityInput, setResponsibilityInput] = useState<string>("");
  const [requirementInput, setRequirementInput] = useState<string>("");

  // Step 3
  const [skills, setSkills] = useState<string[]>(() => initialDraft?.skills ?? []);
  const [skillOptions, setSkillOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [salaryMin, setSalaryMin] = useState<string>(() => initialDraft?.salaryMin ?? "");
  const [salaryMax, setSalaryMax] = useState<string>(() => initialDraft?.salaryMax ?? "");
  const [currency, setCurrency] = useState<string>(() => initialDraft?.currency ?? "USD");

  useEffect(() => {
    let mounted = true;

    jobsService
      .listSkills()
      .then((response) => {
        if (!mounted) {
          return;
        }

        const data = response.data as SkillDto[] | null;
        setSkillOptions((data ?? []).map((skill) => ({
          label: skill.name,
          value: skill.name,
        })));
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
      salaryMin,
      salaryMax,
      currency,
    };

    window.localStorage.setItem(draftStorageKey, JSON.stringify(payload));
    toast.success("Draft saved.");
  }

  function applyEngineeringTemplate() {
    setTitle("Senior Software Engineer");
    setDepartment("Engineering");
    setLocation("Ho Chi Minh City");
    setEmploymentType("Full-time");
    setWorkMode("Hybrid");
    setShortPitch("Build high-performance internal recruiting workflows for enterprise teams.");
    toast.info("Template applied.");
  }

  function validateStep1() {
    const schema = yup.object({
      title: yup.string().trim().required('Job title is required.'),
      department: yup.string().trim().required('Department is required.'),
      location: yup.string().trim().required('Location is required.'),
      employmentType: yup.string().required('Select an employment type.'),
      workMode: yup.string().required('Select a work mode.'),
      shortPitch: yup.string().trim().required('Short pitch is required.'),
    });

    try {
      schema.validateSync(
        { title, department, location, employmentType, workMode, shortPitch },
        { abortEarly: false }
      );
      return true;
    } catch (err) {
      if (err instanceof yup.ValidationError) toast.error(err.errors?.[0] || 'Validation error');
      return false;
    }
  }

  function validateStep2() {
    const schema = yup.object({
      description: yup.string().trim().required('Job description is required.'),
      requirements: yup.array().of(yup.string()).min(1, 'Add at least one requirement.'),
    });

    try {
      schema.validateSync({ description, requirements }, { abortEarly: false });
      return true;
    } catch (err) {
      if (err instanceof yup.ValidationError) toast.error(err.errors?.[0] || 'Validation error');
      return false;
    }
  }

  function validateStep3() {
    const schema = yup.object({
      skills: yup.array().of(yup.string()).min(1, 'Add at least one skill.'),
      salaryMin: yup.number().typeError('Enter a valid salary range.').positive().required(),
      salaryMax: yup.number().typeError('Enter a valid salary range.').positive().required(),
      currency: yup.string().trim().required('Select a currency.'),
    }).test('min<=max', 'Salary min must be less than or equal to max.', (val) => {
      if (!val) return false;
      return Number(val.salaryMin) <= Number(val.salaryMax);
    });

    try {
      schema.validateSync({ skills, salaryMin, salaryMax, currency }, { abortEarly: false });
      return true;
    } catch (err) {
      if (err instanceof yup.ValidationError) toast.error(err.errors?.[0] || 'Validation error');
      return false;
    }
  }

  function addListItem(value: string, setter: (updater: (prev: string[]) => string[]) => void) {
    const next = value.trim();
    if (!next) return;
    setter((prev) => {
      const exists = prev.some((p) => p.toLowerCase() === next.toLowerCase());
      return exists ? prev : [...prev, next];
    });
  }

  function removeListItem(index: number, setter: (updater: (prev: string[]) => string[]) => void) {
    setter((prev) => prev.filter((_, i) => i !== index));
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
        salaryMin,
        salaryMax,
        currency,
      } satisfies DraftState)
    );

    toast.info(
      next === 2
        ? "Basic info saved. Continue with description."
        : next === 3
          ? "Description saved. Continue with skills & pay."
          : "Almost done. Review your posting."
    );
  }

  function goBack() {
    setStep((prev) => Math.max(1, prev - 1));
  }

  async function publishJob() {
    if (!validateStep1() || !validateStep2() || !validateStep3()) return;

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
        skills,
        salaryMin: salaryMin ? Number(salaryMin) : null,
        salaryMax: salaryMax ? Number(salaryMax) : null,
        currency,
        vacancyCount: 1,
        benefits: [],
        deadline: null,
        departmentId: null,
        skillIds: [],
        minExperienceYears: 0,
      });

      window.localStorage.removeItem(draftStorageKey);
      toast.success("Job submitted for approval.");
      navigate("/jobs");
    } catch {
      toast.error("Unable to submit job");
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
          <div key={s.n} className="relative z-10 flex flex-col items-center gap-2 bg-[#f9f9f9] px-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-4 border-[#f9f9f9] text-[14px] font-bold ${circleClass}`}
            >
              {s.n}
            </div>
            <span className={`text-[12px] font-bold ${labelClass}`}>{s.label}</span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 md:px-10">
            {stepper}

            {/* Content Card */}
            <section className="rounded-lg border border-[#e2dfde] bg-white p-8 shadow-sm">
              <div className="mb-8">
                <h2 className="text-[32px] font-semibold leading-10 tracking-[-0.01em]">
                  Create New Job Posting
                </h2>
                <p className="mt-2 text-[16px] leading-6 text-[#5f5e5e]">
                  Fill in the primary details to start building your internal recruitment campaign.
                </p>
              </div>

              {step === 1 ? (
                <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="block text-[12px] font-semibold uppercase tracking-[0.18em]">
                        Job Title
                      </label>
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full rounded-none border border-[#e2dfde] px-4 py-3 text-[14px] focus:border-[#1a1c1c] focus:ring-0"
                        placeholder="e.g. Senior Software Engineer"
                        type="text"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[12px] font-semibold uppercase tracking-[0.18em]">
                        Department
                      </label>
                      <CommonSelect
                        options={departments.map((d) => ({ label: d, value: d }))}
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[12px] font-semibold uppercase tracking-[0.18em]">
                        Employment Type
                      </label>
                      <CommonSelect
                        options={employmentTypeOptions}
                        placeholder="Select employment type"
                        value={employmentType}
                        onChange={(e) => setEmploymentType(e.target.value as EmploymentType | "")}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[12px] font-semibold uppercase tracking-[0.18em]">
                        Location
                      </label>
                      <input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full rounded-none border border-[#e2dfde] px-4 py-3 text-[14px] focus:border-[#1a1c1c] focus:ring-0"
                        placeholder="e.g. Ho Chi Minh City"
                        type="text"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[12px] font-semibold uppercase tracking-[0.18em]">
                        Work Mode
                      </label>
                      <CommonSelect
                        options={workModeOptions}
                        placeholder="Select work mode"
                        value={workMode}
                        onChange={(e) => setWorkMode(e.target.value as WorkMode | "")}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[12px] font-semibold uppercase tracking-[0.18em]">
                      Short Pitch
                    </label>
                    <textarea
                      value={shortPitch}
                      onChange={(e) => setShortPitch(e.target.value)}
                      className="w-full rounded-none border border-[#e2dfde] px-4 py-3 text-[14px] focus:border-[#1a1c1c] focus:ring-0"
                      placeholder="A one-sentence summary for job boards..."
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-[#e2dfde] pt-8">
                    <button
                      type="button"
                      className="rounded-none border border-[#e2dfde] px-6 py-2 text-[12px] font-bold text-[#5f5e5e] transition-colors hover:bg-[#f3f3f3]"
                      onClick={() => persistDraft(1)}
                      disabled={!canCreateJob}
                    >
                      Save Draft
                    </button>

                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-none bg-[#b90014] px-8 py-3 text-[12px] font-bold text-white transition-transform active:scale-95"
                      onClick={continueNext}
                      disabled={!canCreateJob}
                    >
                      Continue to Description
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
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
                              <span className="material-symbols-outlined text-[20px]">close</span>
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
                              <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#e2dfde] pt-8">
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
                        Save Draft
                      </button>
                    </div>

                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-none bg-[#b90014] px-8 py-3 text-[12px] font-bold text-white transition-transform active:scale-95"
                      onClick={continueNext}
                      disabled={!canCreateJob}
                    >
                      Continue to Skills & Pay
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="block text-[12px] font-semibold uppercase tracking-[0.18em]">
                      Skills
                    </label>
                    {skillsLoading ? (
                      <div className="rounded-xl border border-[#e2dfde] bg-white px-4 py-3">
                        <LoadingIndicator label="Loading skills..." size="sm" />
                      </div>
                    ) : (
                      <SkillPicker
                        emptyLabel="Select required skills from the existing database."
                        options={skillOptions}
                        placeholder="Choose a required skill"
                        selectedValues={skills}
                        onAdd={(value) => setSkills((prev) => (prev.includes(value) ? prev : [...prev, value]))}
                        onRemove={(value) => setSkills((prev) => prev.filter((item) => item !== value))}
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    <div className="space-y-2">
                      <label className="block text-[12px] font-semibold uppercase tracking-[0.18em]">
                        Salary Min
                      </label>
                      <input
                        value={salaryMin}
                        onChange={(e) => setSalaryMin(e.target.value)}
                        className="w-full rounded-none border border-[#e2dfde] px-4 py-3 text-[14px] focus:border-[#1a1c1c] focus:ring-0"
                        placeholder="e.g. 120000"
                        inputMode="numeric"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[12px] font-semibold uppercase tracking-[0.18em]">
                        Salary Max
                      </label>
                      <input
                        value={salaryMax}
                        onChange={(e) => setSalaryMax(e.target.value)}
                        className="w-full rounded-none border border-[#e2dfde] px-4 py-3 text-[14px] focus:border-[#1a1c1c] focus:ring-0"
                        placeholder="e.g. 160000"
                        inputMode="numeric"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[12px] font-semibold uppercase tracking-[0.18em]">
                        Currency
                      </label>
                      <CommonSelect
                        options={currencies.map((c) => ({ label: c, value: c }))}
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#e2dfde] pt-8">
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
                        Save Draft
                      </button>
                    </div>

                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-none bg-[#b90014] px-8 py-3 text-[12px] font-bold text-white transition-transform active:scale-95"
                      onClick={continueNext}
                      disabled={!canCreateJob}
                    >
                      Continue to Review
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
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
                        {department} · {location || "—"} · {employmentType || "—"} · {workMode || "—"}
                      </p>
                      <p className="mt-4 text-[14px] text-[#1a1c1c]">{shortPitch || "—"}</p>
                    </div>

                    <div className="border border-[#e2dfde] bg-[#f9f9f9] p-6">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">
                        Skills & Pay
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {skills.length ? (
                          skills.map((s) => (
                            <span key={s} className="border border-[#e2dfde] bg-white px-3 py-1 text-[12px] font-semibold">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-[14px] text-[#5f5e5e]">—</span>
                        )}
                      </div>
                      <p className="mt-4 text-[14px] text-[#1a1c1c]">
                        {salaryMin && salaryMax ? `${currency} ${salaryMin} – ${currency} ${salaryMax}` : "—"}
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
                          {responsibilities.length ? responsibilities.map((r, i) => <li key={`${r}-${i.toString()}`}>{r}</li>) : <li>—</li>}
                        </ul>
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">
                          Requirements
                        </p>
                        <ul className="mt-3 list-disc space-y-2 pl-5 text-[14px] text-[#1a1c1c]">
                          {requirements.length ? requirements.map((r, i) => <li key={`${r}-${i.toString()}`}>{r}</li>) : <li>—</li>}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#e2dfde] pt-8">
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
                        Save Draft
                      </button>
                    </div>

                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-none bg-[#b90014] px-8 py-3 text-[12px] font-bold text-white transition-transform active:scale-95"
                      onClick={publishJob}
                      disabled={!canCreateJob || !canApproveJob}
                    >
                      Publish Job
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
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
                    Detailed job descriptions with clear salary ranges see 30% higher application quality
                    within the first 48 hours of posting.
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
                <span className="material-symbols-outlined mb-2 text-[32px] text-[#b90014]">history</span>
                <p className="text-[12px] font-bold uppercase tracking-[0.05em]">Recent Templates</p>
                <p className="mt-1 text-[14px] text-[#5f5e5e]">Use Engineering L4 Template</p>
              </button>
            </div>

    </div>
  );
}

export default JobCreatingScreen;
