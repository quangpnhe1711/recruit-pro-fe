import { usePermissions } from "../hooks/usePermissions";
import JobManagementScreen from "./hr/JobManagementScreen";
import JobListingCandidateScreen from "./public/JobListingCandidateScreen";

function JobsRouteScreen() {
  const { portalVariant } = usePermissions();

  if (portalVariant === "internal") {
    return <JobManagementScreen />;
  }

  return <JobListingCandidateScreen />;
}

export default JobsRouteScreen;
