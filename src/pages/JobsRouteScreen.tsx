import { useSelector } from "react-redux";
import { RootState } from "../store";
import JobListingCandidateScreen from "./internal/JobListingCandidateScreen";
import JobManagementScreen from "./hr/JobManagementScreen";

function JobsRouteScreen() {
  const variant = useSelector((state: RootState) => state.auth.currentVariant);

  // If user is in internal portal, show Job Management at /jobs.
  // Otherwise keep existing candidate-facing job listing.
  if (variant === "internal") {
    return <JobManagementScreen />;
  }

  return <JobListingCandidateScreen />;
}

export default JobsRouteScreen;
