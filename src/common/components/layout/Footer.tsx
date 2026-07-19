import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { RootState } from "../../../store";
import { useI18n } from "../../../i18n";
import BrandLogo from "./BrandLogo";

function Footer() {
  const authState = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  const { t } = useI18n();
  const year = new Date().getFullYear();

  // Public / landing: dark footer matching the marketing sections.
  if (!authState.isAuthenticated || location.pathname === "/") {
    return (
      <footer id="footer" className="border-t border-white/10 bg-[#151916]">
        <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-10">
          <BrandLogo
            compact
            subtitle={t("footer.copyright", { year })}
            subtitleClassName="text-white/55"
            titleClassName="text-white"
          />
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12px] font-semibold text-white/55">
            <span>{t("footer.privacy")}</span>
            <span>{t("footer.terms")}</span>
            <span>{t("footer.support")}</span>
          </div>
        </div>
      </footer>
    );
  }

  // Authenticated app: quiet, single-line footer.
  return (
    <footer className="mx-4 mt-12 border-t border-[#dde2dd] bg-transparent sm:mx-6 lg:mx-8">
      <div className="flex w-full flex-col gap-1.5 py-6 md:flex-row md:items-center md:justify-between">
        <BrandLogo
          compact
          subtitle={t("footer.copyright", { year })}
          subtitleClassName="text-[#8a8786]"
          titleClassName="text-[#1a1c1c]"
        />
      </div>
    </footer>
  );
}

export default Footer;
