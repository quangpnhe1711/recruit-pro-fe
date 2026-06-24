import { useState } from "react";
import { Link } from "react-router-dom";

const navLinks = [
  { label: "Trang chủ", href: "#home", active: true },
  { label: "Nền tảng", href: "#platform", active: false },
  { label: "Việc làm", href: "#careers", active: false },
  { label: "Câu chuyện", href: "#stories", active: false },
];

function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#e2dfde] bg-white">
      <nav className="flex h-16 w-full items-center justify-between px-4 md:px-[40px]">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-[24px] font-extrabold tracking-tighter text-[#b90014] md:text-[30px]">
            RecruitPro
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                className={`text-[12px] tracking-[0.05em] transition-colors duration-200 ${
                  link.active
                    ? "border-b-2 border-[#b90014] pb-1 font-bold text-[#b90014]"
                    : "font-medium text-[#5f5e5e] hover:text-[#b90014]"
                }`}
                href={link.href}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <Link
            to="/login"
            className="border-2 border-transparent bg-[#1A1A1A] px-4 py-2 text-[12px] font-semibold text-white transition-all duration-300 hover:border-[#1A1A1A] hover:bg-transparent hover:text-[#1A1A1A] md:px-6"
          >
            Đăng nhập
          </Link>
          <Link
            to="/register"
            className="hidden border-2 border-[#b90014] bg-white px-6 py-2 text-[12px] font-semibold text-[#b90014] transition-all duration-300 hover:border-[#1A1A1A] hover:text-[#1A1A1A] sm:inline-block"
          >
            Đăng ký
          </Link>
          <button
            type="button"
            className="p-1 text-[#5f5e5e] transition-colors hover:text-[#b90014] md:hidden"
            aria-label="Mở menu"
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
                className={`py-3 text-[14px] font-semibold tracking-[0.05em] transition-colors ${
                  link.active ? "text-[#b90014]" : "text-[#5f5e5e] hover:text-[#b90014]"
                }`}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/register"
              className="mt-2 block border-2 border-[#b90014] py-3 text-center text-[12px] font-semibold text-[#b90014]"
              onClick={() => setMobileMenuOpen(false)}
            >
              Đăng ký
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}

export default PublicHeader;
