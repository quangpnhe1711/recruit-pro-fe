import { Component, type ErrorInfo, type ReactNode } from "react";

import { translate } from "../../i18n";

type Props = { children: ReactNode };
type State = { hasError: boolean };

/**
 * Last-resort boundary so an unhandled render error shows a recoverable
 * screen instead of a white page.
 */
class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled render error:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#f7f6f5] px-4">
        <div className="card flex max-w-md flex-col items-center px-8 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fdeceb] text-[#b90014]">
            <span className="material-symbols-outlined text-[28px]">error</span>
          </div>
          <h1 className="mt-4 text-[18px] font-semibold text-[#1a1c1c]">
            {translate("states.errorTitle")}
          </h1>
          <p className="mt-1.5 text-[13px] leading-6 text-[#5f5e5e]">
            {translate("common.actionFailed")}
          </p>
          <button
            type="button"
            className="btn btn-primary mt-6"
            onClick={() => window.location.reload()}
          >
            {translate("states.tryAgain")}
          </button>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;
