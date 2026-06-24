import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { usePermissions } from "../../../hooks/usePermissions";
import AppHeader from "./AppHeader";
import BottomNavBar from "./BottomNavBar";
import Footer from "./Footer";
import SideNavBar from "./SideNavBar";

function AuthenticatedLayout() {
  const { portalVariant } = usePermissions();
  const isCandidate = portalVariant === "candidate";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close the mobile drawer on navigation.
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
    return undefined;
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-[#f7f6f5] text-[#1a1c1c]">
      {/*
        Mobile navigation:
        - Candidate portal uses ONLY the bottom navigation bar on mobile;
          the sidebar is desktop-only (no drawer, no hamburger) to avoid duplicate nav.
        - Internal portal keeps the sidebar (its single nav), available as a drawer on mobile.
      */}
      <SideNavBar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        desktopOnly={isCandidate}
      />

      {!isCandidate && sidebarOpen ? (
        <div
          className="animate-fade-in fixed inset-0 z-40 bg-[#1a1c1c]/45 backdrop-blur-[2px] lg:hidden"
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div className="flex min-h-screen flex-col lg:pl-[260px]">
        <AppHeader
          onMenuToggle={
            isCandidate ? undefined : () => setSidebarOpen((v) => !v)
          }
        />

        <main className={`flex-1 ${isCandidate ? "pb-24 lg:pb-0" : ""}`}>
          <Outlet />
        </main>

        <Footer />
      </div>

      {isCandidate ? <BottomNavBar /> : null}
    </div>
  );
}

export default AuthenticatedLayout;
