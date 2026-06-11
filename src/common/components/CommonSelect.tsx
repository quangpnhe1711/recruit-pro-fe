import type { SelectHTMLAttributes } from "react";

export type CommonSelectOption = {
  label: string;
  value: string;
};

type CommonSelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  options: CommonSelectOption[];
  placeholder?: string;
  wrapperClassName?: string;
};

function CommonSelect({
  options,
  placeholder,
  className = "",
  wrapperClassName = "",
  ...props
}: CommonSelectProps) {
  return (
    <div className={`relative ${wrapperClassName}`.trim()}>
      <select
        {...props}
        className={`h-11 w-full appearance-none rounded-xl border border-[#e7bdb8] bg-white px-4 pr-10 text-[14px] text-[#1a1c1c] shadow-[0_1px_0_rgba(185,0,20,0.04)] outline-none transition-all focus:border-[#b90014] focus:ring-2 focus:ring-[#b90014]/15 disabled:cursor-not-allowed disabled:bg-[#f6f3f2] disabled:text-[#8f8a88] ${className}`.trim()}
      >
        {placeholder ? (
          <option value="">{placeholder}</option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[20px] text-[#b90014]">
        expand_more
      </span>
    </div>
  );
}

export default CommonSelect;
