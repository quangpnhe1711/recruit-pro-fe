import { ReactNode } from "react";

type Breadcrumb = {
  label: string;
  to?: string;
};

type PageHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  eyebrow?: string;
  icon?: string;
  actions?: ReactNode;
  breadcrumbs?: Breadcrumb[];
  className?: string;
};

/**
 * Consistent page header used across screens: optional eyebrow/icon,
 * a strong title, supporting subtitle, and a right-aligned action area
 * that wraps gracefully on mobile.
 */
function PageHeader({
  title,
  subtitle,
  eyebrow,
  icon,
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <div
      className={`flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between ${className}`.trim()}
    >
      <div className="flex items-start gap-4">
        {icon ? (
          <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#fff1f0] to-[#ffdad6] text-[#b90014] sm:flex">
            <span className="material-symbols-outlined text-[26px]">{icon}</span>
          </div>
        ) : null}
        <div className="min-w-0">
          {eyebrow ? <p className="eyebrow mb-1.5">{eyebrow}</p> : null}
          <h1 className="page-title">{title}</h1>
          {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
        </div>
      </div>

      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>
      ) : null}
    </div>
  );
}

export default PageHeader;
