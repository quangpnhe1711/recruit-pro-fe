/* eslint-disable react-refresh/only-export-components */
/**
 * RecruitPro i18n — minimal, dependency-free.
 *
 * - Two locales: "vi" (default) and "en".
 * - Nested dot-path keys ("nav.dashboard"), "{var}" interpolation.
 * - Fallback: chosen locale → other locale → the key itself.
 * - `translate()` is usable outside React (services, toasts) — it reads the
 *   module-level current locale that the provider keeps in sync.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { translations, type Lang } from "./translations";

const STORAGE_KEY = "rp.lang";

function detectLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "vi" || stored === "en") return stored;
  } catch {
    /* storage unavailable (private mode) — fall through to navigator */
  }
  return typeof navigator !== "undefined" &&
    navigator.language?.toLowerCase().startsWith("en")
    ? "en"
    : "vi";
}

let currentLang: Lang = detectLang();

/** Current locale for non-React code (date formatting, toasts). */
export function getLang(): Lang {
  return currentLang;
}

/** Locale string for Date.toLocaleString and friends. */
export function getDateLocale(): string {
  return currentLang === "vi" ? "vi-VN" : "en-US";
}

function lookup(lang: Lang, key: string): string | undefined {
  let node: unknown = translations[lang];
  for (const part of key.split(".")) {
    if (node == null || typeof node !== "object") return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : undefined;
}

export type TranslateVars = Record<string, string | number>;

/** Translate a key in the current locale. Safe outside React. */
export function translate(key: string, vars?: TranslateVars): string {
  const raw =
    lookup(currentLang, key) ??
    lookup(currentLang === "vi" ? "en" : "vi", key) ??
    key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

type I18nContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: TranslateVars) => string;
};

const I18nContext = createContext<I18nContextValue>({
  lang: currentLang,
  setLang: () => {},
  t: translate,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(currentLang);

  const setLang = useCallback((next: Lang) => {
    currentLang = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* non-fatal */
    }
    document.documentElement.lang = next;
    setLangState(next);
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({ lang, setLang, t: translate }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}

export type { Lang };
