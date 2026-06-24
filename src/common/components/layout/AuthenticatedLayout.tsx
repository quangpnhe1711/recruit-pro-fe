import { useState } from "react";
import { Outlet } from "react-router-dom";
import { usePermissions } from "../../../hooks/usePermissions";
import AppHeader from "./AppHeader";
import BottomNavBar from "./BottomNavBar";
import Footer from "./Footer";
import SideNavBar from "./SideNavBar";

function AuthenticatedLayout() {
  const { portalVariant } = usePermissions();
  const isCandidate = portalVariant === "candidate";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-visible bg-[#f7f6f5] text-[#1a1c1c]">
      <SideNavBar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {sidebarOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity lg:hidden"
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div className="flex min-h-screen flex-col overflow-visible lg:pl-64">
        <AppHeader onMenuToggle={() => setSidebarOpen((v) => !v)} />

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
