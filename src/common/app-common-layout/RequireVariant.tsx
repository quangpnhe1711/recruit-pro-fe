import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

import type { RootState } from "../../store";

type RequireVariantProps = {
  variant: "candidate" | "internal";
};

function RequireVariant({ variant }: RequireVariantProps) {
  const currentVariant =
    useSelector((state: RootState) => state.auth.variant) ?? "candidate";

  if (currentVariant !== variant) {
    return (
      <Navigate
        to={
          currentVariant === "internal"
            ? "/internal/dashboard"
            : "/candidate/dashboard"
        }
        replace
      />
    );
  }

  return <Outlet />;
}

export default RequireVariant;
