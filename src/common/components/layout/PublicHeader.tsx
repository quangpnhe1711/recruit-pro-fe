import { Link } from "react-router-dom";

function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/40 bg-[rgba(247,242,234,0.72)] backdrop-blur-xl">
      <nav className="page-shell-wide flex h-20 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-[30px] font-extrabold tracking-[-0.08em] text-[var(--rp-text)]">
            RecruitPro
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <a
              className="border-b-2 border-[var(--rp-primary)] pb-1 text-[12px] font-bold tracking-[0.12em] text-[var(--rp-primary)]"
              href="#home"
            >
              Home
            </a>
            <a
              className="text-[12px] font-semibold tracking-[0.12em] text-[var(--rp-muted)] hover:text-[var(--rp-primary)]"
              href="#careers"
            >
              Careers
            </a>
            <a
              className="text-[12px] font-semibold tracking-[0.12em] text-[var(--rp-muted)] hover:text-[var(--rp-primary)]"
              href="#about"
            >
              About Us
            </a>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="btn-secondary px-5 py-3 text-[12px] font-bold tracking-[0.12em]"
          >
            Log in
          </Link>
          <Link
            to="/candidate/register"
            className="btn-primary px-5 py-3 text-[12px] font-bold tracking-[0.12em]"
          >
            Sign up
          </Link>
        </div>
      </nav>
    </header>
  );
}

export default PublicHeader;
