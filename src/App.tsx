import { Provider } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { store } from "./store";
import AppRoutes from "./routes";

function App() {
  return (
    <Provider store={store}>
      <AppRoutes />

      <ToastContainer
        position="top-right"
        autoClose={3000}
        style={{ top: "88px" }}
        toastClassName={() =>
          "glass-surface rounded-[20px] !min-h-0 !p-4 !text-[14px] !text-[#182126]"
        }
        bodyClassName={() => "!p-0 !m-0"}
      />
    </Provider>
  );
}

export default App;
