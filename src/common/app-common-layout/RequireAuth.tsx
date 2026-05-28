import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

import type { RootState } from "../../store";

function RequireAuth() {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );
  const location = useLocation();

  // if (!isAuthenticated) {
  //   const to = location.pathname.startsWith("/internal")
  //     ? "/internal/login"
  //     : "/login";

  //   return <Navigate to={to} replace state={{ from: location }} />;
  // }

  return <Outlet />;
}

export default RequireAuth;
