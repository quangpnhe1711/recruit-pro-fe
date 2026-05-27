import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

import type { RootState } from "../../store";

function PublicOnly() {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );
  const variant =
    useSelector((state: RootState) => state.auth.variant) ?? "candidate";

  if (isAuthenticated) {
    return (
      <Navigate
        to={
          variant === "internal"
            ? "/internal/dashboard"
            : "/candidate/dashboard"
        }
        replace
      />
    );
  }

  return <Outlet />;
}

export default PublicOnly;
