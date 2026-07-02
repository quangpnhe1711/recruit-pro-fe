import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AppHeader from "./AppHeader";
import BottomNavBar from "./BottomNavBar";
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
    setDrawerOpen(false);
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
      className={`min-h-screen overflow-x-hidden text-[#1a1c1c] ${
        isSystemAdmin ? "sysadmin-canvas" : "bg-[#f7f6f5]"
      }`}
    >
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
          key={location.pathname}
          className="animate-fade-in flex-1 overflow-x-hidden pb-24 lg:pb-0"
        >
          <Outlet />
        </main>

        <Footer />
      </div>

      <BottomNavBar />
    </div>
  );
}

export default AuthenticatedLayout;
