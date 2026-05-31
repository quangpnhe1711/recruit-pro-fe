import { useSelector } from "react-redux";
import { RootState } from "../store";
import JobManagementScreen from "./hr/JobManagementScreen";
import JobListingCandidateScreen from "./public/JobListingCandidateScreen";

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
