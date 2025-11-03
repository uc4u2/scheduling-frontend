import React, { useMemo } from "react";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { deepmerge } from "@mui/utils";
// Your app’s base theme (already exists in your repo)
import baseTheme from "../../theme";

/**
 * Merge saved theme_overrides into the app theme.
 * Pass the object you saved in /admin/website/settings as `overrides`.
 */
export default function ThemeRuntimeProvider({ overrides, children }) {
  const theme = useMemo(() => {
    const base = typeof baseTheme?.palette === "object" ? baseTheme : createTheme();
    const merged = deepmerge(base, overrides || {});
    return createTheme(merged);
  }, [overrides]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
