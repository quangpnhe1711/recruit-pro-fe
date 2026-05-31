import { useSelector } from "react-redux";

import { RootState } from "../store";
import AuthenticatedLayout from "../common/components/layout/AuthenticatedLayout";
import PublicLayout from "../common/components/layout/PublicLayout";

export default function AdaptiveLayout() {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );

  return isAuthenticated
    ? <AuthenticatedLayout />
    : <PublicLayout />;
}