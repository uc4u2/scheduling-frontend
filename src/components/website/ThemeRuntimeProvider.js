// src/components/website/ThemeRuntimeProvider.js
import React, { useMemo } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline, GlobalStyles } from "@mui/material";
import { deepmerge } from "@mui/utils";

/** Basic color validator for MUI palette strings */
function isValidColor(c) {
  if (typeof c !== "string" || !c.trim()) return false;
  return /^(#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})|rgb\(|rgba\(|hsl\(|hsla\(|color\()/i.test(
    c.trim()
  );
}

/** Deep-clone a plain object via JSON, safe enough for override blobs */
function jclone(obj) {
  try {
    return JSON.parse(JSON.stringify(obj ?? {}));
  } catch {
    return {};
  }
}

/**
 * Remove invalid/empty values that would make MUI's createTheme() crash,
 * e.g. palette.primary.main: "".
 */
function sanitizeThemeOverrides(overrides) {
  const o = jclone(overrides);

  // Guard palette
  if (o.palette) {
    if (o.palette.primary && "main" in o.palette.primary && !isValidColor(o.palette.primary.main)) {
      delete o.palette.primary.main;
      if (!Object.keys(o.palette.primary).length) delete o.palette.primary;
    }
    if (o.palette.secondary && "main" in o.palette.secondary && !isValidColor(o.palette.secondary.main)) {
      delete o.palette.secondary.main;
      if (!Object.keys(o.palette.secondary).length) delete o.palette.secondary;
    }
    if (o.palette.background && "default" in o.palette.background && !isValidColor(o.palette.background.default)) {
      delete o.palette.background.default;
      if (!Object.keys(o.palette.background).length) delete o.palette.background;
    }
    if (!Object.keys(o.palette).length) delete o.palette;
  }

  // Guard shape
  if (o.shape && "borderRadius" in o.shape) {
    const br = o.shape.borderRadius;
    if (typeof br !== "number" || !Number.isFinite(br)) {
      delete o.shape.borderRadius;
    }
    if (!Object.keys(o.shape).length) delete o.shape;
  }

  // Typography
  if (o.typography && "fontFamily" in o.typography) {
    const ff = o.typography.fontFamily;
    if (typeof ff !== "string" || !ff.trim()) {
      delete o.typography.fontFamily;
    }
    if (!Object.keys(o.typography).length) delete o.typography;
  }

  return o;
}

export default function ThemeRuntimeProvider({ overrides, children }) {
  // Base theme (safe defaults)
  const base = useMemo(
    () => ({
      palette: {
        mode: "light",
        primary: { main: "#1976d2" },
        secondary: { main: "#9c27b0" },
        background: { default: "#ffffff" },
      },
      shape: { borderRadius: 10 },
      typography: {
        fontFamily:
          "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        h1: { fontWeight: 800, letterSpacing: "-0.02em" },
        h2: { fontWeight: 800, letterSpacing: "-0.02em" },
        h3: { fontWeight: 800, letterSpacing: "-0.01em" },
      },
      components: {
        // Make all Papers (Cards/Section containers) respect page-level CSS vars
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundColor: "var(--page-card-bg, rgba(255,255,255,0.92))",
              borderRadius: "var(--page-card-radius, 12px)",
              boxShadow: "var(--page-card-shadow, 0 8px 30px rgba(0,0,0,0.08))",
              backdropFilter: "var(--page-card-blur, none)",
            },
          },
        },
        // Ensure MUI Typography follows page variables by default
        MuiTypography: {
          styleOverrides: {
            root: {
              color: "var(--page-body-color)",
              fontFamily: "var(--page-body-font), inherit",
            },
          },
        },
        // Link color stays in sync with page link var
        MuiLink: {
          styleOverrides: {
            root: {
              color: "var(--page-link-color)",
              textUnderlineOffset: "2px",
            },
          },
        },
      },
    }),
    []
  );

  const theme = useMemo(() => {
    const safeOverrides = sanitizeThemeOverrides(overrides);
    const src = deepmerge(base, safeOverrides || {});
    try {
      return createTheme(src);
    } catch (e) {
      // Defensive fallback so the app never crashes from a bad override
      // eslint-disable-next-line no-console
      console.warn("[ThemeRuntimeProvider] createTheme failed, using base theme. Error:", e);
      return createTheme(base);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(overrides)]);

  // Global CSS vars (defaults). Page wrapper can override these via .page-scope { --var: ... }
  const cssVars = useMemo(() => {
    const p = theme.palette?.primary?.main || "#1976d2";
    const s = theme.palette?.secondary?.main || "#9c27b0";
    const r = String(theme.shape?.borderRadius ?? 10);
    const f =
      theme.typography?.fontFamily ||
      "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";

    return {
      ":root": {
        "--sched-primary": p,
        "--sched-secondary": s,
        "--sched-radius": `${r}px`,
        "--sched-font": f,

        // Page-scoped defaults (overridden by .page-scope inline vars from Page Style)
        "--page-body-color": "inherit",
        "--page-heading-color": "inherit",
        "--page-link-color": "var(--sched-primary)",
        "--page-card-bg": "rgba(255,255,255,0.92)",
        "--page-card-radius": "12px",
        "--page-card-shadow": "0 8px 30px rgba(0,0,0,0.08)",
        "--page-card-blur": "none",
        "--page-heading-font": "inherit",
        "--page-body-font": "inherit",

        // Hero-specific defaults (can be overridden by page vars)
        "--page-hero-text-color": "var(--page-body-color, inherit)",
        "--page-hero-heading-color": "var(--page-heading-color, inherit)",
        "--page-hero-heading-font": "var(--page-heading-font, inherit)",
        "--page-hero-body-font": "var(--page-body-font, inherit)",
        "--page-hero-heading-shadow": "0 2px 24px rgba(0,0,0,.25)",
      },

      body: {
        fontFamily: f,
        backgroundColor: theme.palette.background?.default || "#fff",
        color: "var(--page-body-color)",
      },

      "a:not(.MuiButton-root)": {
        color: "var(--page-link-color)",
      },

      // Page scope ensures all content inside adopts the variables
      ".page-scope": {
        color: "var(--page-body-color)",
        fontFamily: "var(--page-body-font), inherit",
      },

      // Plain HTML headings in page scope
      ".page-scope h1, .page-scope h2, .page-scope h3, .page-scope h4, .page-scope h5, .page-scope h6": {
        color: "var(--page-heading-color)",
        fontFamily: "var(--page-heading-font), inherit",
      },

      // MUI Typography heading variants inside page scope
      ".page-scope .MuiTypography-h1, .page-scope .MuiTypography-h2, .page-scope .MuiTypography-h3, .page-scope .MuiTypography-h4, .page-scope .MuiTypography-h5, .page-scope .MuiTypography-h6":
        {
          color: "var(--page-heading-color)",
          fontFamily: "var(--page-heading-font), inherit",
        },

      // Heuristic hero/title targets (covers richinline blocks and custom classes)
      // We add !important to beat legacy inline colors in older templates.
      ".page-scope .hero-title, .page-scope [data-hero-title], .page-scope [data-section-type='hero'] h1, .page-scope [class*='Hero'][class*='Title']":
        {
          color: "var(--page-hero-heading-color) !important",
          fontFamily: "var(--page-hero-heading-font), inherit",
          textShadow: "var(--page-hero-heading-shadow)",
        },

      // Typical hero subheading/eyebrow hooks
      ".page-scope .hero-subtitle, .page-scope [data-hero-subtitle], .page-scope [data-section-type='hero'] .subtitle, .page-scope .hero-eyebrow":
        {
          color: "var(--page-hero-text-color) !important",
          fontFamily: "var(--page-hero-body-font), inherit",
        },
    };
  }, [theme]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles styles={cssVars} />
      {children}
    </ThemeProvider>
  );
}
