import AuthenticatedLayout from "../common/components/layout/AuthenticatedLayout";
import { usePermissions } from "../hooks/usePermissions";
import PublicLayout from "../common/components/layout/PublicLayout";

export default function AdaptiveLayout() {
  const { isAuthenticated } = usePermissions();

  return isAuthenticated
    ? <AuthenticatedLayout />
    : <PublicLayout />;
}
