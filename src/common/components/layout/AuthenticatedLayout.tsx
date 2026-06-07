import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

import type { RootState } from "../../../store";
import AppHeader from "./AppHeader";
import BottomNavBar from "./BottomNavBar";
import Footer from "./Footer";
import SideNavBar from "./SideNavBar";

function AuthenticatedLayout() {
  const variant =
    useSelector((state: RootState) => state.auth.currentVariant) ?? "candidate";
  const isCandidate = variant === "candidate";

  return (
    <div className="app-shell min-h-screen text-[#1a1c1c]">
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <SideNavBar />

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
