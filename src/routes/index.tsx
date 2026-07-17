import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";

import publicRoutes from "./public.routes";
import candidateRoutes from "./candidate.routes";
import hrRoutes from "./hr.routes";
import systemAdminRoutes from "./system-admin.routes";
import { hydrateActivePortal } from "../store/slices/authSlice";
import { portalForPath } from "../services/auth/authSession";
import NotFoundScreen from "../pages/NotFoundScreen";

export default function AppRoutes() {
  const dispatch = useDispatch();
  const portal = portalForPath(useLocation().pathname);

  // Moving between portals in one tab re-syncs Redux to that portal's session (see authSlice).
  useEffect(() => {
    dispatch(hydrateActivePortal());
  }, [dispatch, portal]);

  return (
    <Routes>
      {publicRoutes}
      {candidateRoutes}
      {hrRoutes}
      {systemAdminRoutes}

      <Route
        path="/internal"
        element={<Navigate to="/internal/login" replace />}
      />

      <Route
        path="*"
        element={<NotFoundScreen />}
      />
    </Routes>
  );
}
