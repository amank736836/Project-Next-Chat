"use client";

import { Provider } from "react-redux";
import store from "../redux/store";
import { Toaster } from "react-hot-toast";
import { SocketProvider } from "../providers/SocketProvider";

export function Providers({ children }) {
  return (
    <Provider store={store}>
      <SocketProvider>
        {children}
        <Toaster position="bottom-center" />
      </SocketProvider>
    </Provider>
  );
}
