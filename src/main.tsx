import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/500.css";
import "@fontsource/be-vietnam-pro/600.css";
import "@fontsource/be-vietnam-pro/700.css";
import "./styles.css";
import "./delight.css";
import "./study-themes.css";
import "./typography-polish.css";
import "./foundation/foundation.css";
import Boundary from "./foundation/Boundary";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <Boundary>
        <App />
      </Boundary>
    </HashRouter>
  </React.StrictMode>,
);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker
      .register(import.meta.env.BASE_URL + "offline.js")
      .catch(() => {});
  });
}
