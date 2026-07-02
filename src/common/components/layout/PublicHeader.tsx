import { useState } from "react";
import { Link } from "react-router-dom";

import { useI18n } from "../../../i18n";
import LanguageSwitcher from "./LanguageSwitcher";

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
    <header className="sticky top-0 z-50 border-b border-[#edd8d4] bg-white/95 backdrop-blur-sm">
      <nav className="mx-auto flex h-20 w-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-10">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-[28px] font-extrabold tracking-[-0.04em] text-[#b90014] md:text-[34px]">
            RecruitPro
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                className={`text-[16px] transition-colors duration-200 ${
                  link.active
                    ? "border-b-2 border-[#b90014] pb-1 font-bold text-[#b90014]"
                    : "font-medium text-[#6e6c6b] hover:text-[#b90014]"
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
            className="px-4 py-2 text-[15px] font-medium text-[#4f4d4c] transition-colors hover:text-[#b90014] md:px-2"
          >
            {t("auth.login")}
          </Link>
          <Link
            to="/register"
            className="hidden rounded-[8px] bg-[#b90014] px-6 py-3 text-[15px] font-bold text-white transition-all duration-200 hover:opacity-90 sm:inline-block"
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
        <div className="border-t border-[#e2dfde] bg-white px-4 pb-4 md:hidden">
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
              className="mt-2 block rounded-[8px] bg-[#b90014] py-3 text-center text-[14px] font-semibold text-white"
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
