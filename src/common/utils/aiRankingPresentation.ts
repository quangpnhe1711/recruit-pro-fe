// Safe presentation helpers for the AI Copilot ranking table.
//
// API quirk (documented): GET /api/copilot/jobs/{id}/candidates returns `education` as the candidate's
// raw `EducationRecordsJson` string (a JSON array of objects) — or a legacy plain string, or null. The
// UI must NEVER render that raw JSON, and parsing must never throw. Skills arrive as `string[]` but we
// defend against objects / comma strings / null too. AI score is `result.totalScore` (number) and is
// absent when the candidate has not been ranked yet.

export type EducationEntry = {
  school?: string;
  degree?: string;
  fieldOfStudy?: string;
  startYear?: number | null;
  endYear?: number | null;
  // Plain-text fallback for legacy `Education` values that are not structured JSON.
  text?: string;
};

export const AI_RANKING_COPY = {
  noEducation: "Chưa có thông tin học vấn",
  noSkills: "Chưa có kỹ năng",
  notRanked: "Chưa chấm",
  runReview: "Chạy AI review để tạo lý do phù hợp",
} as const;

function readString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  if (typeof value === "string" && value.trim()) return value.trim();
  return undefined;
}

function readYear(record: Record<string, unknown>, key: string): number | null {
  const value = record[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function toEducationEntry(record: Record<string, unknown>): EducationEntry {
  return {
    school: readString(record, "school"),
    degree: readString(record, "degree"),
    fieldOfStudy: readString(record, "fieldOfStudy"),
    startYear: readYear(record, "startYear"),
    endYear: readYear(record, "endYear"),
  };
}

function entryHasContent(entry: EducationEntry): boolean {
  return Boolean(
    entry.school ||
      entry.degree ||
      entry.fieldOfStudy ||
      entry.text ||
      entry.startYear != null ||
      entry.endYear != null,
  );
}

/**
 * Normalize a candidate's `education` into structured entries. Accepts a JSON-array string, a JSON
 * object string, a legacy plain string, null/undefined, or malformed JSON. NEVER throws and NEVER
 * yields raw JSON — malformed JSON returns `[]` so the caller shows the friendly fallback.
 */
export function normalizeEducation(raw: unknown): EducationEntry[] {
  if (raw == null) return [];

  if (Array.isArray(raw)) {
    return raw
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
      .map(toEducationEntry)
      .filter(entryHasContent);
  }

  if (typeof raw !== "string") return [];

  const trimmed = raw.trim();
  if (!trimmed) return [];

  const looksLikeJson = trimmed.startsWith("[") || trimmed.startsWith("{");
  if (looksLikeJson) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      return items
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
        .map(toEducationEntry)
        .filter(entryHasContent);
    } catch {
      // Malformed JSON — show the friendly fallback, never the raw string.
      return [];
    }
  }

  // Legacy plain-text education (e.g. "Bachelor of Computer Science").
  return [{ text: trimmed }];
}

/** A one-line label for an education entry: "School — Degree, Field (2018–2022)". */
export function formatEducationEntry(entry: EducationEntry): string {
  if (entry.text) return entry.text;

  const headline = [entry.school, entry.degree].filter(Boolean).join(" — ");
  const field = entry.fieldOfStudy && !headline.includes(entry.fieldOfStudy) ? entry.fieldOfStudy : "";
  const main = [headline, field].filter(Boolean).join(", ");

  const years =
    entry.startYear != null || entry.endYear != null
      ? `${entry.startYear ?? "?"}–${entry.endYear ?? "nay"}`
      : "";

  return [main, years && `(${years})`].filter(Boolean).join(" ");
}

/**
 * Normalize a candidate's `skills` into a clean string array. Accepts `string[]`, an array of objects
 * with a `name`, a comma-separated string, a JSON-array string, or null/undefined. Never throws.
 */
export function normalizeSkills(raw: unknown): string[] {
  if (raw == null) return [];

  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && typeof (item as { name?: unknown }).name === "string") {
          return (item as { name: string }).name;
        }
        return "";
      })
      .map((value) => value.trim())
      .filter(Boolean);
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return normalizeSkills(parsed);
      } catch {
        // fall through to comma-split
      }
    }
    return trimmed
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  return [];
}

/** Normalize an AI score to a finite number, or null ("Not ranked"). Accepts number or numeric string. */
export function normalizeAiScore(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

export type ScoreBand = "high" | "medium" | "low" | "unknown";

/** Bucket a score for color/tone: high ≥80, medium ≥60, low <60, unknown when null. */
export function scoreBand(score: number | null): ScoreBand {
  if (score == null) return "unknown";
  if (score >= 80) return "high";
  if (score >= 60) return "medium";
  return "low";
}
