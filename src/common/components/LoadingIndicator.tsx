type LoadingIndicatorProps = {
  label?: string;
  className?: string;
  size?: "sm" | "md";
  tone?: "brand" | "light";
};

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-5 w-5 border-[3px]",
} as const;

function LoadingIndicator({
  label = "Đang tải...",
  className = "",
  size = "md",
  tone = "brand",
}: LoadingIndicatorProps) {
  const toneClass = tone === "light" ? "text-white" : "text-[#b90014]";
  const spinnerBorderClass = tone === "light" ? "border-white border-r-transparent" : "border-[#b90014] border-r-transparent";

  return (
    <div className={`flex items-center gap-3 ${toneClass} ${className}`.trim()}>
      <span
        className={`inline-block animate-spin rounded-full ${spinnerBorderClass} ${sizeClasses[size]}`}
        aria-hidden="true"
      />
      <span className="text-[14px] font-semibold tracking-[0.02em]">{label}</span>
    </div>
  );
}

export default LoadingIndicator;
