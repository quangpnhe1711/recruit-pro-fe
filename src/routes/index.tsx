import { Routes, Route, Navigate } from "react-router-dom";

import publicRoutes from "./public.routes";
import candidateRoutes from "./candidate.routes";
import hrRoutes from "./hr.routes";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />

      {publicRoutes}
      {candidateRoutes}
      {hrRoutes}

      <Route
        path="/internal"
        element={<Navigate to="/internal/login" replace />}
      />

      <Route
        path="*"
        element={<Navigate to="/home" replace />}
      />
    </Routes>
  );
}