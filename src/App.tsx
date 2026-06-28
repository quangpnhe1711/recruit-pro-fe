import { Provider } from "react-redux";
import { ToastContainer } from "react-toastify";
// react-toastify ships no styles by default; without this the toast body collapses and the
// message text renders invisible/empty. Importing it is what makes toasts actually show copy.
import "react-toastify/dist/ReactToastify.css";

import { NotificationProvider } from "./common/components/layout/NotificationProvider";
import { store } from "./store";
import AppRoutes from "./routes";

function App() {
  return (
    <Provider store={store}>
      <NotificationProvider>
        <AppRoutes />
        {/* Single global container. `theme="colored"` gives distinct success/error/warning/info
            styling + icons. pauseOnFocusLoss/pauseOnHover are disabled so the auto-close timer
            keeps running when the tab loses focus (toast still closes while you're on another tab). */}
        <ToastContainer
          position="top-right"
          autoClose={3500}
          limit={3}
          newestOnTop
          closeOnClick
          pauseOnFocusLoss={false}
          pauseOnHover={false}
          draggable={false}
          theme="colored"
          style={{ top: "70px" }}
        />
      </NotificationProvider>
    </Provider>
  );
}

export default App;
