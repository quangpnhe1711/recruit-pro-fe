import { Provider } from "react-redux";
import { ToastContainer } from "react-toastify";
// react-toastify ships no styles by default; without this the toast body collapses and the
// message text renders invisible/empty. Importing it is what makes toasts actually show copy.
import "react-toastify/dist/ReactToastify.css";

import AppErrorBoundary from "./common/components/AppErrorBoundary";
import { NotificationProvider } from "./common/components/layout/NotificationProvider";
import { I18nProvider } from "./i18n";
import { store } from "./store";
import AppRoutes from "./routes";

function App() {
  return (
    <Provider store={store}>
      <I18nProvider>
      <NotificationProvider>
        <AppErrorBoundary>
          <AppRoutes />
        </AppErrorBoundary>
        {/* Single global container. Soft "light" theme (see index.css): gentle tinted cards, colored
            icon/accent — not saturated solid fills. `limit` + appToast's dedupe (toastId) prevent
            double-click spam. pauseOnHover so a user can read/act; the timer still runs off-tab. */}
        <ToastContainer
          position="top-right"
          autoClose={3800}
          limit={3}
          newestOnTop
          closeOnClick
          closeButton
          pauseOnFocusLoss={false}
          pauseOnHover
          draggable={false}
          theme="light"
          style={{ top: "70px" }}
        />
        {/* Separate container for system / real-time notifications: bottom-right custom cards.
            Untargeted toast.* calls stay in the default (top-right) container; only
            showSystemNotificationToast targets containerId="system". */}
        <ToastContainer
          containerId="system"
          position="bottom-right"
          className="rp-system-container"
          toastClassName="rp-system-toast"
          autoClose={6000}
          limit={4}
          newestOnTop
          closeButton={false}
          hideProgressBar
          icon={false}
          closeOnClick={false}
          pauseOnFocusLoss={false}
          pauseOnHover
          draggable
        />
      </NotificationProvider>
      </I18nProvider>
    </Provider>
  );
}

export default App;
