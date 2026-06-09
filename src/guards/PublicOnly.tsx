import { Navigate, Outlet } from "react-router-dom";
import { usePermissions } from "../hooks/usePermissions";

function PublicOnly() {
  const { defaultPath, isAuthenticated } = usePermissions();

  if (isAuthenticated) {
    return <Navigate to={defaultPath} replace />;
  }

  return <Outlet />;
}

export default PublicOnly;
