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
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c]">
      <SideNavBar />

      <div className="flex min-h-screen flex-col lg:pl-64">
        <AppHeader
          userName={isCandidate ? "Alex Thompson" : "Alex Rivera"}
          userRole={isCandidate ? "Senior Candidate" : "Senior Recruiter"}
          logoutTo="/logout"
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
