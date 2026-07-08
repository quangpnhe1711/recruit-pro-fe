import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import { getErrorMessage, normalizeApiError } from "./apiError";

type FieldErrorSetter = (field: string, message: string) => void;

export interface ApiFormErrorOptions {
  /** Set an error on one field. RHF: (f,m)=>setError(f,{type:'server',message:m}); manual: merge into useState. */
  setFieldError: FieldErrorSetter;
  /** Optional inline form-level banner setter (for global/non-field business errors). */
  setFormError?: (message: string) => void;
  /** Map backend field names → form field names when they differ. */
  fieldMap?: Record<string, string>;
  /**
   * Form field keys the UI can actually render an inline error for. When provided, a field error whose
   * key can't be matched to one of these (after fieldMap + DTO-prefix/camelCase normalization) is NOT
   * written to a dead key — it falls through to setFormError / a caller toast instead of vanishing.
   * Pass this for forms that only render a subset of fields (e.g. scalar-only profile forms).
   */
  knownFields?: string[];
  locale?: string;
}

/**
 * Resolve a backend field key to a form field the UI can render, or null if it can't.
 * Handles bare camelCase (`email`), DTO-prefixed / ASP.NET ProblemDetails PascalCase (`UserInfo.Email`),
 * and nested-collection keys (`experienceEntries[0].bullets`).
 */
function resolveFormField(
  rawField: string,
  fieldMap?: Record<string, string>,
  knownFields?: string[],
): string | null {
  if (fieldMap?.[rawField]) return fieldMap[rawField];
  if (!knownFields) return rawField; // no allow-list → keep prior behavior (write as-is)
  if (knownFields.includes(rawField)) return rawField;
  const leaf = (rawField.split(".").pop() ?? rawField).replace(/\[\d+\]$/, "");
  const camel = leaf.charAt(0).toLowerCase() + leaf.slice(1);
  const mapped = camel === "passwordHash" ? "password" : camel;
  return knownFields.includes(mapped) ? mapped : null;
}

/**
 * Map a backend error onto form fields (red field + message under input, Yup/Zod-style) or a form-level
 * banner — never a toast. Returns:
 *   true  → a form-context error was applied (validation/business/auth-in-form). Caller must NOT toast.
 *   false → server/network/timeout/unexpected. Caller should toast via handleNonFormApiError.
 * Copy is resolved from the FE i18n `errors.*` map by CODE (never the backend message).
 */
export function applyApiFormError(error: unknown, options: ApiFormErrorOptions): boolean {
  const normalized = normalizeApiError(error);
  if (normalized.isServerLike) {
    return false;
  }

  let applied = false;
  for (const fieldError of normalized.fieldErrors) {
    if (!fieldError.field) continue;
    const field = resolveFormField(fieldError.field, options.fieldMap, options.knownFields);
    if (field === null) continue; // unrenderable on this form → let it fall through to banner/toast
    options.setFieldError(field, getErrorMessage(fieldError.code, fieldError.params, options.locale));
    applied = true;
  }

  if (!applied && options.setFormError) {
    const global = normalized.globalErrors[0];
    options.setFormError(getErrorMessage(global?.code ?? normalized.code, global?.params, options.locale));
    applied = true;
  }

  return applied;
}

/**
 * react-hook-form adapter over {@link applyApiFormError}. Sets `type: 'server'` field errors so they
 * render like client-side Yup errors and clear on the next change/submit.
 */
export function handleApiFormError<TFieldValues extends FieldValues>(
  error: unknown,
  options: {
    setError: UseFormSetError<TFieldValues>;
    setFormError?: (message: string) => void;
    fieldMap?: Record<string, Path<TFieldValues>>;
    knownFields?: string[];
    locale?: string;
  },
): boolean {
  return applyApiFormError(error, {
    setFieldError: (field, message) =>
      options.setError(field as Path<TFieldValues>, { type: "server", message }),
    setFormError: options.setFormError,
    fieldMap: options.fieldMap as Record<string, string> | undefined,
    knownFields: options.knownFields,
    locale: options.locale,
  });
}
