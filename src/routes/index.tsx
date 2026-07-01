import { Routes, Route, Navigate } from "react-router-dom";

import publicRoutes from "./public.routes";
import candidateRoutes from "./candidate.routes";
import hrRoutes from "./hr.routes";
import systemAdminRoutes from "./system-admin.routes";

export default function AppRoutes() {
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
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}
