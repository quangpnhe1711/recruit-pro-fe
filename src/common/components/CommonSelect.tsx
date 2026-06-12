import {
  type ChangeEvent,
  type FocusEvent,
  type FocusEventHandler,
  type KeyboardEvent,
  type SelectHTMLAttributes,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

export type CommonSelectOption = {
  label: string;
  value: string;
};

type CommonSelectChangeEvent = {
  target: { name?: string; value: string };
  currentTarget: { name?: string; value: string };
};

type CommonSelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "children" | "size"
> & {
  options: CommonSelectOption[];
  placeholder?: string;
  wrapperClassName?: string;
  menuClassName?: string;
  onValueChange?: (value: string) => void;
};

function CommonSelect({
  options,
  placeholder,
  className = "",
  wrapperClassName = "",
  menuClassName = "",
  value,
  defaultValue,
  disabled,
  name,
  onBlur,
  onChange,
  onFocus,
  onValueChange,
  ...props
}: CommonSelectProps) {
  const fallbackId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const selectedValue = useMemo(() => {
    if (typeof value === "string") return value;
    if (typeof defaultValue === "string") return defaultValue;
    return "";
  }, [defaultValue, value]);

  const normalizedOptions = useMemo(() => {
    const baseOptions = options ?? [];

    if (placeholder) {
      return [{ label: placeholder, value: "" }, ...baseOptions];
    }

    return baseOptions;
  }, [options, placeholder]);

  const selectedOption =
    normalizedOptions.find((option) => option.value === selectedValue) ??
    normalizedOptions[0] ??
    null;

  useEffect(() => {
    const nextIndex = Math.max(
      normalizedOptions.findIndex((option) => option.value === selectedValue),
      0,
    );
    setHighlightedIndex(nextIndex);
  }, [normalizedOptions, selectedValue]);

  useEffect(() => {
    if (!open) return;

    function handleOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const activeOption = menuRef.current?.querySelector<HTMLButtonElement>(
      `[data-option-index="${highlightedIndex}"]`,
    );
    activeOption?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex, open]);

  function emitChange(nextValue: string) {
    onValueChange?.(nextValue);

    if (onChange) {
      const syntheticEvent: CommonSelectChangeEvent = {
        target: { name, value: nextValue },
        currentTarget: { name, value: nextValue },
      };

      onChange(
        syntheticEvent as unknown as ChangeEvent<HTMLSelectElement>,
      );
    }
  }

  function handleSelect(nextValue: string) {
    emitChange(nextValue);
    setOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled || normalizedOptions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }

      setHighlightedIndex((current) =>
        Math.min(current + 1, normalizedOptions.length - 1),
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }

      setHighlightedIndex((current) => Math.max(current - 1, 0));
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }

      const option = normalizedOptions[highlightedIndex];
      if (option) {
        handleSelect(option.value);
      }
    }
  }

  function handleBlur(event: FocusEvent<HTMLButtonElement>) {
    onBlur?.(event as unknown as FocusEvent<HTMLSelectElement>);
  }

  return (
    <div
      ref={rootRef}
      className={`relative ${wrapperClassName}`.trim()}
      data-common-select=""
    >
      <button
        {...props}
        aria-controls={`${fallbackId}-menu`}
        aria-expanded={open}
        className={`group flex h-11 w-full items-center rounded-xl border border-[#e7bdb8] bg-[linear-gradient(180deg,#fffaf9_0%,#ffffff_100%)] px-4 pr-11 text-left text-[14px] text-[#1a1c1c] shadow-[0_12px_30px_rgba(185,0,20,0.08)] outline-none transition-all hover:border-[#d7a8a2] hover:shadow-[0_16px_34px_rgba(185,0,20,0.12)] focus:border-[#b90014] focus:ring-2 focus:ring-[#b90014]/15 disabled:cursor-not-allowed disabled:border-[#ece7e5] disabled:bg-[#f6f3f2] disabled:text-[#8f8a88] ${open ? "border-[#b90014] ring-2 ring-[#b90014]/15" : ""} ${className}`.trim()}
        disabled={disabled}
        name={name}
        type="button"
        onBlur={handleBlur}
        onClick={() => setOpen((current) => !current)}
        onFocus={onFocus as unknown as FocusEventHandler<HTMLButtonElement>}
        onKeyDown={handleKeyDown}
      >
        <span className="min-w-0 flex-1 truncate font-medium">
          {selectedOption?.label ?? placeholder ?? "Select"}
        </span>
        <span className="pointer-events-none absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-[#fff1ef] text-[#b90014] transition-transform duration-200 group-hover:bg-[#ffe4e0]">
          <span
            className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          >
            expand_more
          </span>
        </span>
      </button>

      <input name={name} type="hidden" value={selectedValue} />

      {open ? (
        <div
          ref={menuRef}
          className={`absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-[#d7a8a2] bg-white shadow-[0_24px_60px_rgba(26,28,28,0.18)] ${menuClassName}`.trim()}
          id={`${fallbackId}-menu`}
          role="listbox"
        >
          <div className="max-h-72 overflow-y-auto py-2">
            {normalizedOptions.map((option, index) => {
              const isActive = option.value === selectedValue;
              const isHighlighted = index === highlightedIndex;

              return (
                <button
                  key={`${option.value}-${index}`}
                  className={`flex w-full items-center justify-between px-4 py-3 text-left text-[14px] transition-colors ${
                    isActive
                      ? "bg-[#b90014] font-semibold text-white"
                      : isHighlighted
                        ? "bg-[#fff1ef] text-[#1a1c1c]"
                        : "text-[#3f4141] hover:bg-[#fff6f4]"
                  }`}
                  data-option-index={index}
                  role="option"
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <span className="truncate">{option.label}</span>
                  {isActive ? (
                    <span className="material-symbols-outlined text-[18px]">
                      check
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default CommonSelect;
