import { useState } from "react";
import { Link } from "react-router-dom";

import { useI18n } from "../../../i18n";
import LanguageSwitcher from "./LanguageSwitcher";
import BrandLogo from "./BrandLogo";

const navLinks = [
  { label: "landing.navCandidates", href: "#careers", active: true },
  { label: "landing.navCompanies", href: "#mobility", active: false },
  { label: "landing.navPricing", href: "#cta", active: false },
  { label: "landing.navAbout", href: "#footer", active: false },
];

function PublicHeader() {
  const { t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#e1e5e1] bg-[#f8f9f6]/90 backdrop-blur-xl">
      <nav className="mx-auto flex h-[76px] w-full max-w-[1480px] items-center justify-between px-4 sm:px-6 lg:px-10">
        <div className="flex items-center gap-8">
          <Link to="/" aria-label="RecruitPro" className="shrink-0">
            <BrandLogo compact size="sm" />
          </Link>
          <div className="hidden items-center gap-1 rounded-[14px] border border-[#e1e5e1] bg-white/70 p-1 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                className={`rounded-[10px] px-4 py-2 text-[13px] font-bold transition-all duration-200 ${
                  link.active
                    ? "bg-[#171b18] text-white shadow-[var(--shadow-sm)]"
                    : "text-[#626a64] hover:bg-[#f0f2ee] hover:text-[#171b18]"
                }`}
                href={link.href}
              >
                {t(link.label)}
              </a>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <LanguageSwitcher />
          <Link
            to="/login"
            className="rounded-[10px] px-3 py-2 text-[13px] font-bold text-[#4f574f] transition-colors hover:bg-white hover:text-[#cf1823]"
          >
            {t("auth.login")}
          </Link>
          <Link
            to="/register"
            className="btn btn-primary hidden px-5 sm:inline-flex"
          >
            {t("landing.getStarted")}
          </Link>
          <button
            type="button"
            className="p-1 text-[#5f5e5e] transition-colors hover:text-[#b90014] md:hidden"
            aria-label={t("nav.openMenu")}
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            <span className="material-symbols-outlined text-[26px]">
              {mobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </nav>

      {mobileMenuOpen ? (
        <div className="animate-fade-in border-t border-[#e1e5e1] bg-[#f8f9f6] px-4 pb-4 md:hidden">
          <div className="flex flex-col gap-1 pt-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                className={`py-3 text-[15px] font-semibold transition-colors ${
                  link.active ? "text-[#b90014]" : "text-[#5f5e5e] hover:text-[#b90014]"
                }`}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t(link.label)}
              </a>
            ))}
            <Link
              to="/register"
              className="btn btn-primary mt-2 w-full"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("landing.getStarted")}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}

export default PublicHeader;
