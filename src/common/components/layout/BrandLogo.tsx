type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  titleClassName?: string;
  textClassName?: string;
  subtitleClassName?: string;
  showText?: boolean;
  subtitle?: string;
  compact?: boolean;
};

function BrandLogo({
  className = "",
  imageClassName = "",
  titleClassName = "",
  textClassName = "",
  subtitleClassName = "",
  showText = true,
  subtitle,
  compact = false,
}: BrandLogoProps) {
  const sizeClass = compact ? "h-8 w-8" : "h-10 w-10";

  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <img
        alt="RecruitPro logo"
        className={`${sizeClass} rounded-[10px] object-cover ${imageClassName}`.trim()}
        src="/logo.jpg"
      />
      {showText ? (
        <div className={`min-w-0 leading-tight ${textClassName}`.trim()}>
          <p
            className={`truncate font-bold tracking-[-0.01em] ${compact ? "text-[16px]" : "text-[17px]"} ${titleClassName}`.trim()}
          >
            RecruitPro
          </p>
          {subtitle ? (
            <p className={`truncate text-[11px] font-medium ${subtitleClassName}`.trim()}>
              {subtitle}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default BrandLogo;
