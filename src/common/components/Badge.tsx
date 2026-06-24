import { ReactNode } from "react";

export type BadgeTone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "info"
  | "danger"
  | "purple"
  | "violet"
  | "sky";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-[#f2efed] text-[#5f5e5e]",
  brand: "bg-[#fff1f0] text-[#b90014]",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  info: "bg-sky-50 text-sky-700",
  danger: "bg-rose-50 text-rose-700",
  purple: "bg-purple-50 text-purple-700",
  violet: "bg-violet-50 text-violet-700",
  sky: "bg-sky-50 text-sky-700",
};

const dotClasses: Record<BadgeTone, string> = {
  neutral: "bg-[#a8a4a2]",
  brand: "bg-[#b90014]",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  info: "bg-sky-500",
  danger: "bg-rose-500",
  purple: "bg-purple-500",
  violet: "bg-violet-500",
  sky: "bg-sky-500",
};

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
  icon?: string;
  className?: string;
};

function Badge({ children, tone = "neutral", dot = false, icon, className = "" }: BadgeProps) {
  return (
    <span className={`badge ${toneClasses[tone]} ${className}`.trim()}>
      {dot ? <span className={`badge-dot ${dotClasses[tone]}`} /> : null}
      {icon ? <span className="material-symbols-outlined text-[14px] leading-none">{icon}</span> : null}
      {children}
    </span>
  );
}

export default Badge;
