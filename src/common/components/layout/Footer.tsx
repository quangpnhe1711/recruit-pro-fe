import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { RootState } from "../../../store";
import { useI18n } from "../../../i18n";

function Footer() {
  const authState = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  const { t } = useI18n();
  const year = new Date().getFullYear();

  // Public / landing: dark footer matching the marketing sections.
  if (!authState.isAuthenticated || location.pathname === "/") {
    return (
      <footer id="footer" className="border-t border-white/10 bg-[#171818]">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-10">
          <p className="text-[20px] font-bold tracking-[-0.03em] text-white">
            RecruitPro
          </p>
          <p className="text-[13px] text-white/55">
            {t("footer.copyright", { year })}
          </p>
        </div>
      </footer>
    );
  }

  // Authenticated app: quiet, single-line footer.
  return (
    <footer className="mt-12 border-t border-[#e2dfde] bg-white">
      <div className="flex w-full flex-col gap-1.5 px-4 py-6 md:flex-row md:items-center md:justify-between md:px-10">
        <p className="text-[13px] font-semibold text-[#1a1c1c]">RecruitPro</p>
        <p className="text-[12px] text-[#8a8786]">
          {t("footer.copyright", { year })}
        </p>
      </div>
    </footer>
  );
}

export default Footer;
