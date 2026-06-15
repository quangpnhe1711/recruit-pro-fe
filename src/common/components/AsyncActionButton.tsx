import { type ButtonHTMLAttributes, type MouseEvent, useState } from "react";
import LoadingIndicator from "./LoadingIndicator";

type AsyncActionButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick"
> & {
  loading?: boolean;
  loadingText?: string;
  spinnerTone?: "brand" | "light";
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void | Promise<unknown>;
};

function AsyncActionButton({
  children,
  className = "",
  disabled = false,
  loading = false,
  loadingText,
  onClick,
  spinnerTone = "light",
  ...props
}: AsyncActionButtonProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = loading || internalLoading;

  async function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (disabled || isLoading || !onClick) {
      return;
    }

    const result = onClick(event);
    if (!(result instanceof Promise)) {
      return;
    }

    setInternalLoading(true);
    try {
      await result;
    } finally {
      setInternalLoading(false);
    }
  }

  return (
    <button
      {...props}
      className={className}
      disabled={disabled || isLoading}
      onClick={(event) => {
        void handleClick(event);
      }}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <LoadingIndicator
            className="gap-2"
            label={loadingText ?? "Đang xử lý..."}
            size="sm"
            tone={spinnerTone}
          />
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export default AsyncActionButton;
