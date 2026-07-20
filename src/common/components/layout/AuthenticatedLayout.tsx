import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AppHeader from "./AppHeader";
import Footer from "./Footer";
import Seo from "../Seo";
import SideNavBar from "./SideNavBar";
import { usePermissions } from "../../../hooks/usePermissions";
import { ROLE_NAMES } from "../../../permissions/rolePermissions";

function AuthenticatedLayout() {
  const location = useLocation();
  const { primaryRole } = usePermissions();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const isSystemAdmin = primaryRole === ROLE_NAMES.SYSTEM_ADMIN;

  // Close the drawer whenever the route changes (also covered by nav item onClose).
  useEffect(() => {
    const frame = requestAnimationFrame(() => setDrawerOpen(false));
    return () => cancelAnimationFrame(frame);
  }, [location.pathname]);

  // While the drawer is open on mobile: lock body scroll + close on Escape.
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [drawerOpen]);

  return (
    <div
      className={`min-h-screen overflow-x-hidden text-[#171b18] ${
        isSystemAdmin ? "sysadmin-canvas" : "bg-[#f3f5f1]"
      }`}
    >
      <a
        href="#app-content"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-[10px] bg-[#171b18] px-4 py-3 text-sm font-bold text-white transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>
      {/* Default for authenticated pages: private, not indexable. Rendered
          before the Outlet so a page-level <Seo> (e.g. public job pages in
          AdaptiveLayout) runs later and overrides it. */}
      <Seo title="RecruitPro" noindex />

      {/* Desktop: fixed sidebar. */}
      <SideNavBar desktopOnly />

      {/* Mobile/tablet: left drawer + backdrop (hidden on desktop). */}
      <div className="lg:hidden">
        {drawerOpen ? (
          <div
            className="animate-fade-in fixed inset-0 z-[60] bg-[#1a1c1c]/50 backdrop-blur-[2px]"
            aria-hidden="true"
            data-testid="mobile-drawer-backdrop"
            onClick={closeDrawer}
          />
        ) : null}
        <SideNavBar isOpen={drawerOpen} onClose={closeDrawer} />
      </div>

      <div
        className={`flex min-h-screen flex-col ${
          isSystemAdmin ? "lg:pl-[286px]" : "lg:pl-[260px]"
        }`}
      >
        <AppHeader onMenuToggle={() => setDrawerOpen(true)} />

        <main
          id="app-content"
          key={location.pathname}
          className="animate-fade-in relative flex-1 overflow-x-hidden pb-0"
        >
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default AuthenticatedLayout;
