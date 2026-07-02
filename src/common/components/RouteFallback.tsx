import { SkeletonText } from "./Skeleton";

/** Suspense fallback for lazy routes — a quiet skeleton instead of raw text. */
function RouteFallback() {
  return (
    <div className="app-container animate-fade-in py-8">
      <div className="skeleton mb-6 h-8 w-64" />
      <SkeletonText lines={5} />
    </div>
  );
}

export default RouteFallback;
