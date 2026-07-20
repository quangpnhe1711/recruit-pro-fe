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
  neutral: "border-[#dde2dd] bg-[#f1f3f0] text-[#59615b]",
  brand: "border-[#f1ceca] bg-[#fff3f1] text-[#c91420]",
  success: "border-emerald-200/70 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200/70 bg-amber-50 text-amber-800",
  info: "border-sky-200/70 bg-sky-50 text-sky-800",
  danger: "border-rose-200/70 bg-rose-50 text-rose-800",
  purple: "border-stone-200 bg-stone-50 text-stone-700",
  violet: "border-stone-200 bg-stone-50 text-stone-700",
  sky: "border-sky-200/70 bg-sky-50 text-sky-800",
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
