import { Outlet } from "react-router-dom";
import Footer from "./Footer";
import PublicHeader from "./PublicHeader";

function PublicLayout() {
  return (
    <div className="app-shell flex min-h-screen flex-col">
      <PublicHeader />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default PublicLayout;
