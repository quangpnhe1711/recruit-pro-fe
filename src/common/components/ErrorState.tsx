import { ReactNode } from "react";

import { useI18n } from "../../i18n";

type ErrorStateProps = {
  /** Specific error message; falls back to the generic load-failed copy. */
  message?: ReactNode;
  onRetry?: () => void;
  className?: string;
};

/**
 * Shared error state with retry — use in every data screen's failure path so
 * "load failed" is distinguishable from "no data".
 */
function ErrorState({ message, onRetry, className = "" }: ErrorStateProps) {
  const { t } = useI18n();

  return (
    <div
      role="alert"
      className={`card flex flex-col items-center justify-center px-6 py-12 text-center ${className}`.trim()}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fdeceb] text-[#b90014]">
        <span className="material-symbols-outlined text-[28px]">error</span>
      </div>
      <h3 className="mt-4 text-[16px] font-semibold text-[#1a1c1c]">
        {t("states.errorTitle")}
      </h3>
      <p className="mt-1.5 max-w-sm text-[13px] leading-6 text-[#5f5e5e]">
        {message ?? t("common.loadFailed")}
      </p>
      {onRetry ? (
        <button type="button" className="btn btn-secondary mt-5" onClick={onRetry}>
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          {t("states.tryAgain")}
        </button>
      ) : null}
    </div>
  );
}

export default ErrorState;
