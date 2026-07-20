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
    <header
      className={`relative flex flex-col gap-5 border-b border-[#dfe4df] pb-6 sm:flex-row sm:items-end sm:justify-between ${className}`.trim()}
    >
      <div className="flex items-start gap-4">
        {icon ? (
          <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border border-[#f0c9c6] bg-[#fff5f3] text-[#cf1823] sm:flex">
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
      <span className="absolute -bottom-px left-0 h-[3px] w-12 bg-[#e5232d]" aria-hidden="true" />
    </header>
  );
}

export default PageHeader;
