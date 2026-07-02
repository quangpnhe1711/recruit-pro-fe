import { useI18n, type Lang } from "../../../i18n";

const LANGS: { value: Lang; label: string }[] = [
  { value: "vi", label: "VI" },
  { value: "en", label: "EN" },
];

/** Compact VI/EN segmented control used in the app header. */
function LanguageSwitcher({ dark = false }: { dark?: boolean }) {
  const { lang, setLang, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t("common.language")}
      className={`flex items-center gap-0.5 rounded-full p-0.5 ${
        dark ? "border border-white/15 bg-white/10" : "border border-[#e2dfde] bg-[#f1eeed]"
      }`}
    >
      {LANGS.map(({ value, label }) => {
        const active = lang === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            className={`premium-action rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[0.04em] transition-colors ${
              active
                ? dark
                  ? "bg-white text-[#1a1c1c]"
                  : "bg-white text-[#b90014] shadow-[var(--shadow-xs)]"
                : dark
                  ? "text-white/70 hover:text-white"
                  : "text-[#8a8786] hover:text-[#1a1c1c]"
            }`}
            onClick={() => setLang(value)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default LanguageSwitcher;
