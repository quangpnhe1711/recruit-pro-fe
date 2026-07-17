import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import type { RootState } from "../store";
import { logout } from "../store/slices/authSlice";
import { clearProfile } from "../store/slices/userSlice";
import { resolvePortalVariantFromUser } from "../permissions/rolePermissions";
import { authService } from "../services/auth/authService";

function LogoutScreen() {
  const dispatch = useDispatch();
  const authState = useSelector((state: RootState) => state.auth);
  const variant = resolvePortalVariantFromUser(
    authState.user,
    authState.currentVariant ?? "candidate",
  );
  const redirectTo = variant === "internal" ? "/internal/login" : "/login";

  useEffect(() => {
    void authService.logout()
      .catch(() => undefined)
      .finally(() => {
        dispatch(logout());
        dispatch(clearProfile());
      });
  }, [dispatch]);

  return <Navigate to={redirectTo} replace />;
}

export default LogoutScreen;
