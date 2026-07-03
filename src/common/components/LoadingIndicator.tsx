import { translate } from "../../i18n";

type LoadingIndicatorProps = {
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  tone?: "brand" | "light";
};

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-5 w-5 border-[2.5px]",
  lg: "h-7 w-7 border-[3px]",
} as const;

function LoadingIndicator({
  label = translate("common.loading"),
  className = "",
  size = "md",
  tone = "brand",
}: LoadingIndicatorProps) {
  const toneClass = tone === "light" ? "text-white" : "text-[#b90014]";
  const spinnerBorderClass =
    tone === "light"
      ? "border-white/30 border-t-white"
      : "border-[#b90014]/20 border-t-[#b90014]";

  return (
    <div className={`flex items-center gap-3 ${toneClass} ${className}`.trim()}>
      <span
        className={`inline-block animate-spin rounded-full ${spinnerBorderClass} ${sizeClasses[size]}`}
        aria-hidden="true"
      />
      {label ? (
        <span className="text-[14px] font-semibold tracking-[0.01em]">{label}</span>
      ) : null}
    </div>
  );
}

export default LoadingIndicator;
