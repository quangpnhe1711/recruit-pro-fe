import { Link, useLocation } from "react-router-dom";

import Seo from "../common/components/Seo";
import { useI18n } from "../i18n";

function NotFoundScreen() {
  const { t } = useI18n();
  const location = useLocation();
  const isInternalPath = ["/hr", "/manager", "/internal", "/system-admin"].some(
    (prefix) => location.pathname === prefix || location.pathname.startsWith(`${prefix}/`),
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f6f5] px-4 py-10">
      <Seo title={t("common.notFoundTitle")} noindex />
      <div className="card w-full max-w-xl p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff1ef] text-[#b90014]">
          <span className="material-symbols-outlined text-[32px]">search_off</span>
        </div>
        <p className="eyebrow mt-5">404</p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.02em] text-[#1a1c1c]">
          {t("common.notFoundTitle")}
        </h1>
        <p className="mt-3 text-[15px] leading-6 text-[#5f5e5e]">
          {t("common.notFoundBody")}
        </p>
        <p className="mt-2 text-[12px] text-[#8a8786]">{location.pathname}</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link className="btn btn-primary h-11" to={isInternalPath ? "/hr/dashboard" : "/"}>
            {isInternalPath ? "Về trang nội bộ" : t("common.goHome")}
          </Link>
          <button className="btn btn-secondary h-11" type="button" onClick={() => window.history.back()}>
            {t("common.back")}
          </button>
        </div>
      </div>
    </main>
  );
}

export default NotFoundScreen;
