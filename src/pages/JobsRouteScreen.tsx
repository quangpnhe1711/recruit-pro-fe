import { usePermissions } from "../hooks/usePermissions";
import { ROLE_NAMES } from "../permissions/rolePermissions";
import JobManagementScreen from "./hr/JobManagementScreen";
import ManagerJobApprovalListScreen from "./manager/ManagerJobApprovalListScreen";
import JobListingCandidateScreen from "./public/JobListingCandidateScreen";

function JobsRouteScreen() {
  const { portalVariant, primaryRole } = usePermissions();

  if (portalVariant === "internal") {
    if (primaryRole === ROLE_NAMES.MANAGER) {
      return <ManagerJobApprovalListScreen />;
    }

    return <JobManagementScreen />;
  }

  return <JobListingCandidateScreen />;
}

export default JobsRouteScreen;
