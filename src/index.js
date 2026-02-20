import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n";
import "./utils/resizeObserverErrorGuard";
import { initGA } from "./analytics/ga";

import { ThemeProvider, CssBaseline } from "@mui/material";
import { coolTheme } from "./theme"; // existing theme
import themeV2 from "./themeV2"; // enterprise variant

const useV2 =
  process.env.REACT_APP_SCHEDULAA_THEME_V2 === "true" ||
  (typeof window !== "undefined" &&
    window.localStorage &&
    window.localStorage.getItem("schedulaa_theme_version") === "v2");

const activeTheme = useV2 ? themeV2 : coolTheme;

initGA();

if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const reason = String(event?.reason?.message || event?.reason || "");
    if (reason.includes("Failed to load Stripe.js")) {
      event.preventDefault();
    }
  });
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={activeTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
