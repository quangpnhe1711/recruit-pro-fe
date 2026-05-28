import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import type { RootState } from "../store";
import { logout } from "../store/slices/authSlice";
import { clearProfile } from "../store/slices/userSlice";

function LogoutScreen() {
  const dispatch = useDispatch();
  const variant = useSelector((state: RootState) => state.auth.currentVariant);
  const redirectTo = variant === "internal" ? "/internal/login" : "/login";

  useEffect(() => {
    dispatch(logout());
    dispatch(clearProfile());
  }, [dispatch]);

  return <Navigate to={redirectTo} replace />;
}

export default LogoutScreen;
