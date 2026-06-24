import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import type { RootState } from "../store";
import { hasStoredToken, hasValidStoredSession } from "../services/auth/authToken";
import { logout } from "../store/slices/authSlice";
import { clearProfile } from "../store/slices/userSlice";

function RequireAuth() {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );
  const location = useLocation();
  const dispatch = useDispatch();

  if (hasStoredToken() && !hasValidStoredSession()) {
    dispatch(logout());
    dispatch(clearProfile());
    return <Navigate to="/home" replace />;
  }

  if (!isAuthenticated) {
    const to = location.pathname.startsWith("/internal") || location.pathname.startsWith("/hr")
      ? "/internal/login"
      : "/login";

    return <Navigate to={to} replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export default RequireAuth;
