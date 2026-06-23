import { Provider } from "react-redux";
import { ToastContainer } from "react-toastify";

import { NotificationProvider } from "./common/components/layout/NotificationProvider";
import { store } from "./store";
import AppRoutes from "./routes";

function App() {
  return (
    <Provider store={store}>
      <NotificationProvider>
        <AppRoutes />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          style={{ top: "70px" }}
        />
      </NotificationProvider>
    </Provider>
  );
}

export default App;
