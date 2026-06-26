import { usePermissions } from "../hooks/usePermissions";
import { ROLE_NAMES } from "../permissions/rolePermissions";
import JobManagementScreen from "./hr/JobManagementScreen";
import ManagerJobApprovalListScreen from "./manager/ManagerJobApprovalListScreen";
import JobListingCandidateScreen from "./public/JobListingCandidateScreen";

function JobsRouteScreen() {
  const { portalVariant, primaryRole } = usePermissions();

  if (portalVariant === "internal") {
    // The DepartmentHead and Manager land on the approval queue (their workflow surface); HR/admin land
    // on full job management. The HeadDepartment lacks the HR job-management permissions, so routing it
    // here also keeps it off the HR-only /hr/jobs list (BR-OWN-003).
    if (
      primaryRole === ROLE_NAMES.MANAGER ||
      primaryRole === ROLE_NAMES.HEAD_DEPARTMENT
    ) {
      return <ManagerJobApprovalListScreen />;
    }

    return <JobManagementScreen />;
  }

  return <JobListingCandidateScreen />;
}

export default JobsRouteScreen;
