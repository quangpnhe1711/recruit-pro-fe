import { Provider } from "react-redux";
import { ToastContainer } from "react-toastify";

import { store } from "./store";
import AppRoutes from "./routes";

function App() {
  return (
    <Provider store={store}>
      <AppRoutes />

      <ToastContainer
        position="top-right"
        autoClose={3000}
        style={{ top: "70px" }}
      />
    </Provider>
  );
}

export default App;