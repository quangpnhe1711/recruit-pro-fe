import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AppHeader from "./AppHeader";
import BottomNavBar from "./BottomNavBar";
import Footer from "./Footer";
import SideNavBar from "./SideNavBar";

function AuthenticatedLayout() {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

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
    <div className="min-h-screen overflow-x-hidden bg-[#f7f6f5] text-[#1a1c1c]">
      {/* Desktop: fixed sidebar. */}
      <SideNavBar desktopOnly />

      {/* Mobile/tablet: left drawer + backdrop (hidden on desktop). */}
      <div className="lg:hidden">
        {drawerOpen ? (
          <div
            className="animate-fade-in fixed inset-0 z-40 bg-[#1a1c1c]/50 backdrop-blur-[2px]"
            aria-hidden="true"
            data-testid="mobile-drawer-backdrop"
            onClick={closeDrawer}
          />
        ) : null}
        <SideNavBar isOpen={drawerOpen} onClose={closeDrawer} />
      </div>

      <div className="flex min-h-screen flex-col lg:pl-[260px]">
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
