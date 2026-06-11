import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CommonPagination from "../../common/components/CommonPagination";
import CommonSelect from "../../common/components/CommonSelect";
import LoadingIndicator from "../../common/components/LoadingIndicator";
import SkillPicker from "../../common/components/SkillPicker";
import type { EmploymentType, JobListItemDto, JobSearchFilterOption, SkillDto } from "../../modules/jobs/jobsSchema";
import { employmentTypeLabels } from "../../modules/jobs/jobsSchema";
import { jobsService } from "../../services/jobs/jobsService";

type SalaryRangeOption = {
  id: string;
  label: string;
  min: number;
  max: number | null;
};

const pageSize = 5;

const salaryRanges: SalaryRangeOption[] = [
  { id: "50-80", label: "$50k - $80k", min: 50_000, max: 80_000 },
  { id: "80-120", label: "$80k - $120k", min: 80_000, max: 120_000 },
  { id: "120-180", label: "$120k - $180k", min: 120_000, max: 180_000 },
  { id: "180+", label: "$180k+", min: 180_000, max: null },
];

const employmentTypeOptionsFromEnum = (
  Object.entries(employmentTypeLabels) as Array<[EmploymentType, string]>
).map(([value, label]) => ({
  label,
  value,
}));

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatEmploymentType(value: string) {
  return employmentTypeLabels[value as EmploymentType] ?? value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function resolveLevel(minExperienceYears: number) {
  if (minExperienceYears <= 0) return "Intern";
  if (minExperienceYears <= 2) return "Junior";
  if (minExperienceYears <= 4) return "Middle";
  if (minExperienceYears <= 7) return "Senior";
  return "Lead";
}

function normalizeFilterOption(item: unknown): JobSearchFilterOption | null {
  if (typeof item === "string") {
    return { label: item, value: item };
  }

  if (!item || typeof item !== "object") {
    return null;
  }

  const option = item as Record<string, unknown>;
  const label =
    typeof option.label === "string"
      ? option.label
      : typeof option.name === "string"
        ? option.name
        : typeof option.title === "string"
          ? option.title
          : typeof option.value === "string"
            ? option.value
            : null;

  const value =
    typeof option.value === "string"
      ? option.value
      : typeof option.id === "string"
        ? option.id
        : typeof option.name === "string"
          ? option.name
          : label;

  if (!label || !value) {
    return null;
  }

  return { label, value };
}

function normalizeSkillOptions(raw: unknown): JobSearchFilterOption[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map(normalizeFilterOption)
    .filter((item): item is JobSearchFilterOption => Boolean(item));
}

function extractJobTags(job: JobListItemDto) {
  if (Array.isArray(job.tags) && job.tags.length > 0) {
    return job.tags;
  }

  if (!Array.isArray(job.skills)) {
    return [];
  }

  return job.skills
    .map((skill) => {
      const skillRecord = skill as SkillDto & { skill?: SkillDto };
      return skillRecord.skill?.name ?? skillRecord.name ?? null;
    })
    .filter((tag): tag is string => Boolean(tag));
}

function matchesSalaryFilters(job: JobListItemDto, selectedRanges: SalaryRangeOption[]) {
  if (selectedRanges.length === 0) {
    return true;
  }

  const salaryMin = job.salaryMin ?? job.salaryMax;
  const salaryMax = job.salaryMax ?? job.salaryMin;

  if (salaryMin == null && salaryMax == null) {
    return false;
  }

  return selectedRanges.some((range) => {
    const effectiveMin = salaryMin ?? 0;
    const effectiveMax = salaryMax ?? effectiveMin;
    const rangeMax = range.max ?? Number.POSITIVE_INFINITY;

    return effectiveMin < rangeMax && effectiveMax >= range.min;
  });
}

function matchesSearchQuery(job: JobListItemDto, keyword: string) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) {
    return true;
  }

  const searchableValues = [
    job.title,
    job.department?.name,
    job.location,
    job.workMode,
    job.employmentType,
    job.shortDescription,
    job.summary,
    ...extractJobTags(job),
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase());

  return searchableValues.some((value) => value.includes(normalizedKeyword));
}

function JobListingCandidateScreen() {
  const [page, setPage] = useState(1);
  const [jobs, setJobs] = useState<JobListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedSalaryRangeIds, setSelectedSalaryRangeIds] = useState<string[]>([]);
  const [selectedEmploymentTypes, setSelectedEmploymentTypes] = useState<EmploymentType[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [employmentTypeOptions] = useState<JobSearchFilterOption[]>(employmentTypeOptionsFromEnum);
  const [skillOptions, setSkillOptions] = useState<JobSearchFilterOption[]>([]);
  const [totalItems, setTotalItems] = useState(0);

  const selectedSalaryRanges = useMemo(
    () => salaryRanges.filter((range) => selectedSalaryRangeIds.includes(range.id)),
    [selectedSalaryRangeIds],
  );

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const rangeStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalItems);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let mounted = true;

    jobsService
      .listSkills()
      .then((res) => {
        if (!mounted) {
          return;
        }

        const data = res.data as SkillDto[] | null;
        setSkillOptions(
          normalizeSkillOptions(data),
        );
      })
      .catch(() => {
        if (!mounted) {
          return;
        }

        setSkillOptions([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const usesClientSalaryFiltering = selectedSalaryRangeIds.length > 0;
    const usesClientSearchFiltering = debouncedSearch.length > 0;
    const usesClientFiltering = usesClientSalaryFiltering || usesClientSearchFiltering;
    const requestPage = usesClientFiltering ? 1 : page;
    const requestPageSize = usesClientFiltering ? 200 : pageSize;

    jobsService
      .listPublicJobs({
        page: requestPage,
        pageSize: requestPageSize,
        keyword: debouncedSearch || null,
        employmentTypes: selectedEmploymentTypes,
        skills: selectedSkills,
        sortBy,
      })
      .then((res) => {
        if (!mounted) {
          return;
        }

        const payload = res.data as { items?: JobListItemDto[] } | JobListItemDto[] | null;
        const items = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : [];
        const meta = res.meta ?? (payload as { totalItems?: number } | null) ?? null;

        if (usesClientFiltering) {
          const filteredItems = items
            .filter((job) => matchesSearchQuery(job, debouncedSearch))
            .filter((job) => matchesSalaryFilters(job, selectedSalaryRanges));
          const pageSlice = filteredItems.slice((page - 1) * pageSize, page * pageSize);

          setJobs(pageSlice);
          setTotalItems(filteredItems.length);
          return;
        }

        setJobs(items);
        setTotalItems(meta?.totalItems ?? items.length);
      })
      .catch(() => {
        if (!mounted) {
          return;
        }

        setJobs([]);
        setTotalItems(0);
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [debouncedSearch, page, selectedEmploymentTypes, selectedSalaryRangeIds, selectedSkills, selectedSalaryRanges, sortBy]);

  function toggleSalaryRange(rangeId: string) {
    setLoading(true);
    setSelectedSalaryRangeIds((current) =>
      current.includes(rangeId)
        ? current.filter((item) => item !== rangeId)
        : [...current, rangeId],
    );
    setPage(1);
  }

  function toggleEmploymentType(value: string) {
    setLoading(true);
    setSelectedEmploymentTypes((current) =>
      current.includes(value as EmploymentType)
        ? current.filter((item) => item !== value)
        : [...current, value as EmploymentType],
    );
    setPage(1);
  }

  function addSkill(skill: string) {
    if (!skill) {
      return;
    }

    setLoading(true);
    setSelectedSkills((current) => {
      if (current.includes(skill)) {
        return current;
      }

      return [...current, skill];
    });
    setPage(1);
  }

  function removeSkill(skill: string) {
    setLoading(true);
    setSelectedSkills((current) => current.filter((item) => item !== skill));
    setPage(1);
  }

  function clearAllFilters() {
    setLoading(true);
    setSearch("");
    setDebouncedSearch("");
    setSortBy("newest");
    setSelectedSalaryRangeIds([]);
    setSelectedEmploymentTypes([]);
    setSelectedSkills([]);
    setPage(1);
  }

  function goTo(next: number) {
    const safe = Math.max(1, Math.min(totalPages, next));
    setLoading(true);
    setPage(safe);
  }

  return (
    <div className="mx-auto flex w-full max-w-[1440px] gap-6 px-4 py-6 md:px-10">
      <aside className="hidden w-72 flex-shrink-0 space-y-6 xl:block">
        <div className="border border-[#e2dfde] bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-[20px] font-semibold text-[#1a1c1c]">
              Filters
            </h3>
            <button
              className="text-[12px] font-semibold text-[#b90014] hover:underline"
              type="button"
              onClick={clearAllFilters}
            >
              Clear All
            </button>
          </div>

          <div className="space-y-8">
            <div>
              <label className="mb-4 block text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5d3f3c]">
                Salary Range
              </label>
              <div className="space-y-3">
                {salaryRanges.map((range) => {
                  const checked = selectedSalaryRangeIds.includes(range.id);

                  return (
                    <label
                      key={range.id}
                      className="flex cursor-pointer items-center gap-3 text-[14px] text-[#5f5e5e]"
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center border ${
                          checked ? "border-[#b90014] bg-[#b90014]" : "border-[#d4cecc] bg-white"
                        }`}
                      >
                        {checked ? (
                          <span className="block h-1.5 w-2.5 -translate-y-[1px] rotate-[-45deg] border-b-[1.5px] border-l-[1.5px] border-white" />
                        ) : null}
                      </span>
                      <input
                        checked={checked}
                        className="hidden"
                        type="checkbox"
                        onChange={() => toggleSalaryRange(range.id)}
                      />
                      <span>{range.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-4 block text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5d3f3c]">
                Employment Type
              </label>
              <div className="flex flex-wrap gap-2">
                {employmentTypeOptions.map((option) => {
                  const isActive = selectedEmploymentTypes.includes(option.value as EmploymentType);

                  return (
                    <button
                      key={option.value}
                      className={`min-w-[96px] px-4 py-2 text-[12px] font-semibold transition-colors ${
                        isActive
                          ? "bg-[#b90014] text-white"
                          : "bg-[#efedec] text-[#6a6868] hover:bg-[#e5dfdd]"
                      }`}
                      type="button"
                      onClick={() => toggleEmploymentType(option.value)}
                    >
                      {formatEmploymentType(option.value)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-4 block text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5d3f3c]">
                Required Skills
              </label>
              <SkillPicker
                emptyLabel="Select skills from the list to filter matching jobs."
                options={skillOptions.map((option) => ({ label: option.label, value: option.label }))}
                placeholder="Choose a required skill"
                selectedValues={selectedSkills}
                onAdd={addSkill}
                onRemove={removeSkill}
              />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden border border-[#e2dfde] bg-[#b90014] p-6 text-white">
          <div className="absolute -bottom-6 -right-6 opacity-10">
            <span className="material-symbols-outlined text-[120px]">
              rocket_launch
            </span>
          </div>
          <h4 className="mb-2 text-[20px] font-semibold">Job Alerts</h4>
          <p className="mb-4 text-[14px] leading-5 text-white/90">
            Get notified immediately when high-matching roles are posted.
          </p>
          <button
            className="w-full rounded-none bg-white py-2 text-[12px] font-bold uppercase tracking-[0.05em] text-[#b90014] transition-transform active:scale-[0.98]"
            type="button"
          >
            Enable Notifications
          </button>
        </div>
      </aside>

      <section className="flex-1 space-y-6">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="text-[24px] font-semibold leading-8 tracking-[-0.01em] md:text-[32px] md:leading-10">
              Your Opportunities
            </h2>
            <p className="text-[14px] text-[#5f5e5e]">
              Found {totalItems} relevant positions for your profile
            </p>
            <Link
              className="mt-2 inline-flex text-[12px] font-semibold tracking-[0.05em] text-[#b90014] hover:underline"
              to="/internal/candidate-profile"
            >
              Open Candidate Profile
            </Link>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative">
              <input
                className="w-[280px] border border-[#e2dfde] bg-white py-2 pl-10 pr-4 text-[14px] outline-none transition-colors focus:border-[#b90014]"
                placeholder="Search jobs..."
                type="text"
                value={search}
                onChange={(event) => {
                  setLoading(true);
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />

              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-[#5f5e5e]">
                search
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#5d3f3c]">
                Sort by:
              </span>

              <CommonSelect
                className="h-10 min-w-[180px] border-[#e7bdb8] bg-white text-[12px] font-semibold"
                options={[
                  { label: "Newest First", value: "newest" },
                  { label: "Salary High-Low", value: "salaryDesc" },
                  { label: "Most Relevant", value: "relevant" },
                ]}
                value={sortBy}
                onChange={(event) => {
                  setLoading(true);
                  setSortBy(event.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="border border-[#e2dfde] bg-white p-6">
              <LoadingIndicator label="Loading jobs..." />
            </div>
          ) : jobs.length === 0 ? (
            <div className="border border-[#e2dfde] bg-white p-6 text-[14px] text-[#5f5e5e]">
              No matching jobs found.
            </div>
          ) : jobs.map((job) => (
            <article
              key={job.id}
              className="group flex flex-col gap-4 border border-[#e2dfde] bg-white p-6 transition-all duration-200 hover:border-[#b90014] hover:shadow-sm md:flex-row md:items-start md:gap-6"
            >
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center bg-[#f3f3f3]">
                <span className="material-symbols-outlined text-[32px] text-[#b90014]">
                  work
                </span>
              </div>

              <div className="flex-1">
                <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <Link
                      className="text-[20px] font-semibold leading-7 transition-colors group-hover:text-[#b90014]"
                      to={`/jobs/${job.id}`}
                    >
                      {job.title}
                    </Link>
                    <p className="text-[14px] font-medium text-[#5f5e5e]">
                      {job.department?.name ?? "General"} • {job.location}
                      {job.workMode ? ` (${job.workMode})` : ""} • {resolveLevel(job.minExperienceYears)}
                    </p>
                    <p className="mt-1 text-[13px] text-[#7a7776]">
                      {formatEmploymentType(job.employmentType)}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-[20px] font-semibold text-[#1a1c1c]">
                      {job.salaryMin != null || job.salaryMax != null
                        ? `${formatCurrency(job.salaryMin ?? job.salaryMax ?? 0)} - ${formatCurrency(job.salaryMax ?? job.salaryMin ?? 0)}`
                        : "Negotiable"}
                    </p>
                    <p className="text-[12px] uppercase text-[#5f5e5e]">
                      {job.postedAt ?? job.createdAt
                        ? `Posted ${new Date(job.postedAt ?? job.createdAt).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  {extractJobTags(job).map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-[#eeeeee] px-2 py-1 text-[12px] font-semibold text-[#636262]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <p className="max-w-3xl text-[14px] leading-5 text-[#5f5e5e]">
                    {job.shortDescription ?? job.summary ?? "Explore this opportunity to learn more about the role and team."}
                  </p>
                  <Link
                    className="inline-flex items-center justify-center bg-[#1a1c1c] px-6 py-2 text-[12px] font-bold uppercase tracking-[0.05em] text-white transition-colors hover:bg-[#b90014]"
                    to={`/jobs/${job.id}`}
                  >
                    Apply Now
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <CommonPagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          onPageChange={goTo}
        />
      </section>
    </div>
  );
}

export default JobListingCandidateScreen;
