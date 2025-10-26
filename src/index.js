import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n";
import "./utils/resizeObserverErrorGuard";

import { ThemeProvider, CssBaseline } from "@mui/material";
import { coolTheme } from "./theme"; // Use the updated theme

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={coolTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);


