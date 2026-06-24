const employmentTypeClasses = {
  fullTime:
    "border border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-300 hover:bg-indigo-100",
  partTime:
    "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100",
  internship:
    "border border-purple-200 bg-purple-50 text-purple-700 hover:border-purple-300 hover:bg-purple-100",
  contract:
    "border border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-300 hover:bg-amber-100",
  default:
    "border border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100",
};

const skillChipPalettes = [
  "border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-300 hover:bg-sky-100",
  "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100",
  "border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100",
  "border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-300 hover:bg-amber-100",
  "border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-300 hover:bg-violet-100",
  "border-cyan-200 bg-cyan-50 text-cyan-700 hover:border-cyan-300 hover:bg-cyan-100",
];

const chipBaseClass =
  "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none transition-colors";

export const quickApplyCardClass =
  "relative overflow-hidden rounded-[16px] border border-rose-200/80 bg-gradient-to-br from-[#fff9f8] via-[#fff1f0] to-[#ffe8e4] shadow-[0_14px_34px_-24px_rgba(185,0,20,0.55)] transition-all duration-200 hover:-translate-y-0.5 hover:border-rose-300 hover:shadow-[0_18px_42px_-24px_rgba(185,0,20,0.68)]";

export const quickApplyIconClass =
  "flex shrink-0 items-center justify-center rounded-[14px] border border-rose-200 bg-white/80 text-[#b90014] shadow-[0_10px_24px_-18px_rgba(185,0,20,0.7)]";

function normalizeTagValue(value?: string | null) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\s-]+/g, "");
}

function hashText(value: string) {
  return Array.from(value).reduce(
    (hash, char) => hash + char.charCodeAt(0),
    0,
  );
}

export function getEmploymentTypeBadgeClass(value?: string | null) {
  const normalized = normalizeTagValue(value);

  if (normalized.includes("part") || normalized.includes("banthoigian")) {
    return `${chipBaseClass} ${employmentTypeClasses.partTime}`;
  }

  if (normalized.includes("intern") || normalized.includes("thuctap")) {
    return `${chipBaseClass} ${employmentTypeClasses.internship}`;
  }

  if (
    normalized.includes("contract") ||
    normalized.includes("freelance") ||
    normalized.includes("hopdong")
  ) {
    return `${chipBaseClass} ${employmentTypeClasses.contract}`;
  }

  if (normalized.includes("full") || normalized.includes("toanthoigian")) {
    return `${chipBaseClass} ${employmentTypeClasses.fullTime}`;
  }

  return `${chipBaseClass} ${employmentTypeClasses.default}`;
}

export function getSkillChipClass(value?: string | null, index = 0) {
  const normalized = value?.trim() ?? "";
  const key = normalized ? hashText(normalized) : index;
  const palette = skillChipPalettes[Math.abs(key) % skillChipPalettes.length];

  return `${chipBaseClass} border ${palette}`;
}

export function getWorkModeChipClass() {
  return `${chipBaseClass} border border-rose-200 bg-white/80 text-rose-700 hover:border-rose-300 hover:bg-rose-50`;
}
