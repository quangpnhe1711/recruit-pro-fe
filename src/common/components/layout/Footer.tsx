import { useSelector } from "react-redux";
import { RootState } from "../../../store";

function Footer() {
  const authState = useSelector((state: RootState) => state.auth);

  return (
    <footer className={`border-t border-white/40 bg-[rgba(17,36,43,0.92)] text-white ${authState.isAuthenticated ? "mt-12" : ""}`}>
      <div className="page-shell-wide flex flex-col gap-4 py-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[16px] font-semibold text-white">RecruitPro</p>
          <p className="text-[12px] text-white/65">
            © 2024 RecruitPro Internal. All rights reserved.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <a
            className="text-[12px] font-semibold tracking-[0.12em] text-white/65 hover:text-white"
            href="#"
          >
            Security Disclosure
          </a>
          <a
            className="text-[12px] font-semibold tracking-[0.12em] text-white/65 hover:text-white"
            href="#"
          >
            Privacy Policy
          </a>
          <span className="inline-flex items-center gap-2 text-[12px] font-semibold tracking-[0.12em] text-white/70">
            <span className="h-2 w-2 rounded-full bg-[var(--rp-accent)] shadow-[0_0_14px_rgba(29,125,116,0.9)]" />
            System Status: Operational
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
