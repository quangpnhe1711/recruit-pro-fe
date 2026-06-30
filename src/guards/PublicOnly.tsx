import { Navigate, Outlet } from "react-router-dom";
import { useDispatch } from "react-redux";
import { usePermissions } from "../hooks/usePermissions";
import { logout } from "../store/slices/authSlice";
import { clearProfile } from "../store/slices/userSlice";
import { hasStoredToken, hasValidStoredSession } from "../services/auth/authToken";

function PublicOnly() {
  const { defaultPath, isAuthenticated } = usePermissions();
  const dispatch = useDispatch();

  if (hasStoredToken() && !hasValidStoredSession()) {
    dispatch(logout());
    dispatch(clearProfile());
    return <Navigate to="/" replace />;
  }

  if (isAuthenticated) {
    return <Navigate to={defaultPath} replace />;
  }

  return <Outlet />;
}

export default PublicOnly;
