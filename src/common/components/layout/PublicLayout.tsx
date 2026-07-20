import { Outlet } from "react-router-dom";
import Footer from "./Footer";
import PublicHeader from "./PublicHeader";

function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f7f8f5]">
      <a
        href="#public-content"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-[10px] bg-[#171b18] px-4 py-3 text-sm font-bold text-white transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>
      <PublicHeader />

      <main id="public-content" className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default PublicLayout;
