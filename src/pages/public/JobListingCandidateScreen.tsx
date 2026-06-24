import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CommonPagination from "../../common/components/CommonPagination";
import CommonSelect from "../../common/components/CommonSelect";
import EmptyState from "../../common/components/EmptyState";
import { SkeletonCard } from "../../common/components/Skeleton";
import SkillPicker from "../../common/components/SkillPicker";
import {
  getEmploymentTypeBadgeClass,
  getSkillChipClass,
  quickApplyCardClass,
  quickApplyIconClass,
} from "../../common/utils/jobPresentation";
import type { EmploymentType, JobListItemDto, JobSearchFilterOption, SkillDto } from "../../modules/jobs/jobsSchema";
import { employmentTypeLabels } from "../../modules/jobs/jobsSchema";
import { jobsService } from "../../services/jobs/jobsService";

const pageSize = 5;
const SALARY_FILTER_MIN = 5_000_000;
const SALARY_FILTER_MAX = 60_000_000;
const SALARY_FILTER_STEP = 1_000_000;

const employmentTypeOptionsFromEnum = (
  Object.entries(employmentTypeLabels) as Array<[EmploymentType, string]>
).map(([value, label]) => ({
  label,
  value,
}));

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatSalaryInMillions(amount: number) {
  return `${Math.round(amount / 1_000_000)} triệu`;
}

function formatEmploymentType(value: string) {
  return employmentTypeLabels[value as EmploymentType] ?? value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function resolveLevel(minExperienceYears: number) {
  if (minExperienceYears <= 0) return "Thực tập";
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

function matchesSalaryFilters(
  job: JobListItemDto,
  selectedMin: number,
  selectedMax: number,
) {
  if (
    selectedMin === SALARY_FILTER_MIN &&
    selectedMax === SALARY_FILTER_MAX
  ) {
    return true;
  }

  const salaryMin = job.salaryMin ?? job.salaryMax;
  const salaryMax = job.salaryMax ?? job.salaryMin;

  if (salaryMin == null && salaryMax == null) {
    return false;
  }

  const effectiveMin = salaryMin ?? 0;
  const effectiveMax = salaryMax ?? effectiveMin;

  return effectiveMin <= selectedMax && effectiveMax >= selectedMin;
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
  const [salaryFilterMin, setSalaryFilterMin] = useState(SALARY_FILTER_MIN);
  const [salaryFilterMax, setSalaryFilterMax] = useState(SALARY_FILTER_MAX);
  const [selectedEmploymentTypes, setSelectedEmploymentTypes] = useState<EmploymentType[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [employmentTypeOptions] = useState<JobSearchFilterOption[]>(employmentTypeOptionsFromEnum);
  const [skillOptions, setSkillOptions] = useState<JobSearchFilterOption[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const hasCustomSalaryFilter = useMemo(
    () =>
      salaryFilterMin !== SALARY_FILTER_MIN ||
      salaryFilterMax !== SALARY_FILTER_MAX,
    [salaryFilterMax, salaryFilterMin],
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

    const usesClientSalaryFiltering = hasCustomSalaryFilter;
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
            .filter((job) =>
              matchesSalaryFilters(job, salaryFilterMin, salaryFilterMax),
            );
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
  }, [debouncedSearch, hasCustomSalaryFilter, page, salaryFilterMax, salaryFilterMin, selectedEmploymentTypes, selectedSkills, sortBy]);

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
    setSalaryFilterMin(SALARY_FILTER_MIN);
    setSalaryFilterMax(SALARY_FILTER_MAX);
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
    <div className="mx-auto flex w-full max-w-[1440px] gap-6 px-4 py-8 md:px-10">
      <aside className="hidden w-72 flex-shrink-0 space-y-6 xl:block">
        <div className="card p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="section-title">Bộ lọc</h3>
            <button
              className="text-[12px] font-semibold text-[#b90014] hover:underline"
              type="button"
              onClick={clearAllFilters}
            >
              Xóa tất cả
            </button>
          </div>

          <div className="space-y-8">
            <div>
              <label className="field-label mb-4 block">
                Mức lương
              </label>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-[13px] font-semibold text-[#5f5e5e]">
                  <span>{formatSalaryInMillions(salaryFilterMin)}</span>
                  <span>{formatSalaryInMillions(salaryFilterMax)}</span>
                </div>
                <div className="relative h-10">
                  <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#e7d8d5]" />
                  <div
                    className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#b90014]"
                    style={{
                      left: `${((salaryFilterMin - SALARY_FILTER_MIN) / (SALARY_FILTER_MAX - SALARY_FILTER_MIN)) * 100}%`,
                      right: `${100 - ((salaryFilterMax - SALARY_FILTER_MIN) / (SALARY_FILTER_MAX - SALARY_FILTER_MIN)) * 100}%`,
                    }}
                  />
                  <input
                    className="pointer-events-none absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#b90014] [&::-webkit-slider-thumb]:bg-white"
                    max={salaryFilterMax - SALARY_FILTER_STEP}
                    min={SALARY_FILTER_MIN}
                    step={SALARY_FILTER_STEP}
                    type="range"
                    value={salaryFilterMin}
                    onChange={(event) => {
                      setLoading(true);
                      setSalaryFilterMin(Number(event.target.value));
                      setPage(1);
                    }}
                  />
                  <input
                    className="pointer-events-none absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#b90014] [&::-webkit-slider-thumb]:bg-white"
                    max={SALARY_FILTER_MAX}
                    min={salaryFilterMin + SALARY_FILTER_STEP}
                    step={SALARY_FILTER_STEP}
                    type="range"
                    value={salaryFilterMax}
                    onChange={(event) => {
                      setLoading(true);
                      setSalaryFilterMax(Number(event.target.value));
                      setPage(1);
                    }}
                  />
                </div>
                <p className="text-[12px] text-[#7a7776]">
                  Lọc theo khoảng lương tháng từ {formatCurrency(salaryFilterMin)} đến {formatCurrency(salaryFilterMax)}.
                </p>
              </div>
            </div>

            <div>
              <label className="field-label mb-4 block">
                Loại hình làm việc
              </label>
              <div className="flex flex-wrap gap-2">
                {employmentTypeOptions.map((option) => {
                  const isActive = selectedEmploymentTypes.includes(option.value as EmploymentType);

                  return (
                    <button
                      key={option.value}
                      className={`min-w-[96px] rounded-full px-4 py-2 text-[12px] font-semibold transition-colors ${
                        isActive
                          ? "bg-gradient-to-r from-[#e8242c] to-[#b90014] text-white shadow-sm"
                          : "bg-[#f2efed] text-[#5f5e5e] hover:bg-[#e8e4e1]"
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
              <label className="field-label mb-4 block">
                Kỹ năng yêu cầu
              </label>
              <SkillPicker
                emptyLabel="Chọn kỹ năng từ danh sách để lọc việc làm phù hợp."
                options={skillOptions.map((option) => ({ label: option.label, value: option.label }))}
                placeholder="Chọn kỹ năng yêu cầu"
                selectedValues={selectedSkills}
                onAdd={addSkill}
                onRemove={removeSkill}
              />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[16px] bg-gradient-to-br from-[#e8242c] to-[#b90014] p-6 text-white">
          <div className="absolute -bottom-6 -right-6 opacity-10">
            <span className="material-symbols-outlined text-[120px]">
              rocket_launch
            </span>
          </div>
          <h4 className="relative z-10 mb-2 text-[18px] font-semibold">Thông báo việc làm</h4>
          <p className="relative z-10 mb-4 text-[14px] leading-5 text-white/90">
            Nhận thông báo ngay khi có vị trí phù hợp cao được đăng.
          </p>
          <button
            className="relative z-10 h-10 w-full rounded-[10px] bg-white text-[12px] font-bold text-[#b90014] transition-transform active:scale-[0.98]"
            type="button"
          >
            Bật thông báo
          </button>
        </div>
      </aside>

      <section className="flex-1 space-y-6">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="eyebrow mb-1.5">Việc làm nội bộ</p>
            <h2 className="page-title">Cơ hội dành cho bạn</h2>
            <p className="page-subtitle">
              Tìm thấy {totalItems} vị trí phù hợp với hồ sơ của bạn
            </p>
            <Link
              className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-[#b90014] hover:underline"
              to="/internal/candidate-profile"
            >
              <span className="material-symbols-outlined text-[16px]">badge</span>
              Mở hồ sơ ứng viên
            </Link>
          </div>

          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
            <div className="relative w-full md:w-[280px]">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-[#a8a4a2]">
                search
              </span>
              <input
                className="input-field pl-10"
                placeholder="Tìm kiếm việc làm..."
                type="text"
                value={search}
                onChange={(event) => {
                  setLoading(true);
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="flex items-center gap-2.5">
              <span className="hidden text-[12px] font-semibold text-[#5f5e5e] sm:inline">
                Sắp xếp:
              </span>
              <CommonSelect
                className="h-[42px] min-w-[180px] text-[13px] font-semibold"
                options={[
                  { label: "Mới nhất", value: "newest" },
                  { label: "Lương cao đến thấp", value: "salaryDesc" },
                  { label: "Phù hợp nhất", value: "relevant" },
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
            <div className="space-y-4">
              {[0, 1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="card">
              <EmptyState
                icon="work_off"
                title="Không tìm thấy việc làm phù hợp"
                description="Hãy thử điều chỉnh từ khóa hoặc bộ lọc để xem thêm cơ hội."
                action={
                  <button type="button" className="btn btn-secondary" onClick={clearAllFilters}>
                    Xóa bộ lọc
                  </button>
                }
              />
            </div>
          ) : jobs.map((job) => (
            <article
              key={job.id}
              className={`${quickApplyCardClass} group flex flex-col gap-4 p-5 md:flex-row md:items-start md:gap-5`}
            >
              <div className={`${quickApplyIconClass} h-14 w-14`}>
                <span className="material-symbols-outlined text-[28px]">work</span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <Link
                      className="text-[18px] font-semibold leading-6 text-[#1a1c1c] transition-colors group-hover:text-[#b90014]"
                      to={`/jobs/${job.id}`}
                    >
                      {job.title}
                    </Link>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-[#5f5e5e]">
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">apartment</span>
                        {job.department?.name ?? "Chung"}
                      </span>
                      <span className="text-[#d6d2cf]">•</span>
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">location_on</span>
                        {job.location}{job.workMode ? ` (${job.workMode})` : ""}
                      </span>
                      <span className="text-[#d6d2cf]">•</span>
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">trending_up</span>
                        {resolveLevel(job.minExperienceYears)}
                      </span>
                    </p>
                  </div>
                  <div className="shrink-0 text-left md:text-right">
                    <p className="text-[18px] font-bold text-[#1a1c1c]">
                      {job.salaryMin != null || job.salaryMax != null
                        ? `${formatCurrency(job.salaryMin ?? job.salaryMax ?? 0)} - ${formatCurrency(job.salaryMax ?? job.salaryMin ?? 0)}`
                        : "Thỏa thuận"}
                    </p>
                    <p className="text-[12px] text-[#8a8786]">
                      {job.postedAt ?? job.createdAt
                        ? `Đăng ngày ${new Date(job.postedAt ?? job.createdAt).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  <span className={getEmploymentTypeBadgeClass(job.employmentType)}>
                    {formatEmploymentType(job.employmentType)}
                  </span>
                  {extractJobTags(job).map((tag) => (
                    <span
                      key={tag}
                      className={getSkillChipClass(tag)}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <p className="max-w-3xl text-[13px] leading-5 text-[#5f5e5e]">
                    {job.shortDescription ?? job.summary ?? "Khám phá thêm về công việc này để hiểu rõ vai trò và đội ngũ phù hợp với bạn."}
                  </p>
                  <Link
                    className="btn btn-primary h-10 shrink-0"
                    to={`/jobs/${job.id}`}
                  >
                    Ứng tuyển ngay
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
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
