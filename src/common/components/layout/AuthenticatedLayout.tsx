import { Outlet, useLocation } from "react-router-dom";
import AppHeader from "./AppHeader";
import BottomNavBar from "./BottomNavBar";
import Footer from "./Footer";
import SideNavBar from "./SideNavBar";

function AuthenticatedLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#f7f6f5] text-[#1a1c1c]">
      <SideNavBar desktopOnly />

      <div className="flex min-h-screen flex-col lg:pl-[260px]">
        <AppHeader />

        <main
          key={location.pathname}
          className="animate-fade-in flex-1 pb-24 lg:pb-0"
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
