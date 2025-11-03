// src/components/website/TemplatePreviewPane.js
import React, { useMemo, useState } from "react";
import {
  AppBar,
  Box,
  Container,
  Tab,
  Tabs,
  Toolbar,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { RenderSections } from "./RenderSections";

/** Simple per-theme styling (extend as you add themes) */
function getMuiThemeForKey(themeKey) {
  switch (String(themeKey || "").toLowerCase()) {
    case "modern":
      return createTheme({
        palette: {
          mode: "light",
          primary: { main: "#6C5CE7" }, // violet
          secondary: { main: "#00C2A8" }, // teal
        },
        shape: { borderRadius: 14 },
        typography: { fontWeightBold: 800 },
      });
    case "minimal":
      return createTheme({
        palette: {
          mode: "light",
          primary: { main: "#111827" }, // near-black
          secondary: { main: "#4B5563" },
          background: { default: "#F9FAFB", paper: "#FFFFFF" },
        },
        shape: { borderRadius: 10 },
      });
    case "starter":
    default:
      return createTheme({
        palette: { primary: { main: "#3f51b5" } },
        shape: { borderRadius: 12 },
      });
  }
}

export default function TemplatePreviewPane({ template }) {
  const pages = useMemo(
    () => (Array.isArray(template?.pages) ? template.pages : []),
    [template]
  );

  const theme = useMemo(
    () => getMuiThemeForKey(template?.theme_key || "starter"),
    [template]
  );

  const initialIdx = useMemo(() => {
    const homeIdx = pages.findIndex((p) => p.is_homepage);
    return homeIdx >= 0 ? homeIdx : 0;
  }, [pages]);

  const [tab, setTab] = useState(initialIdx);
  const [mode, setMode] = useState("render"); // 'render' | 'json'
  const currentPage = pages[tab];

  // Extract page-level layout/meta for accurate preview
  const layout = currentPage?.layout || currentPage?.content?.meta?.layout || "boxed";
  const sectionSpacing = currentPage?.content?.meta?.sectionSpacing ?? 6;
  const defaultGutterX = currentPage?.content?.meta?.defaultGutterX;

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
        {/* Top bar + mode toggle */}
        <AppBar position="static" color="primary" enableColorOnDark>
          <Toolbar variant="dense" sx={{ display: "flex", gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {template?.name || template?.key || "Template"}
            </Typography>
            <Box sx={{ flex: 1 }} />
            <ToggleButtonGroup
              size="small"
              exclusive
              value={mode}
              onChange={(_, v) => v && setMode(v)}
            >
              <ToggleButton value="render">Rendered</ToggleButton>
              <ToggleButton value="json">JSON</ToggleButton>
            </ToggleButtonGroup>
          </Toolbar>
        </AppBar>

        {/* Tabs over pages */}
        {pages.length > 0 && (
          <Box sx={{ px: 2, pt: 1, bgcolor: (t) => t.palette.background.paper }}>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant="scrollable"
              scrollButtons="auto"
            >
              {pages.map((p, i) => (
                <Tab
                  key={i}
                  label={p.menu_title || p.title || p.slug || `Page ${i + 1}`}
                />
              ))}
            </Tabs>
          </Box>
        )}

        {/* Page body */}
        <Box sx={{ bgcolor: (t) => t.palette.background.default, p: 2 }}>
          {mode === "json" ? (
            <Box sx={{ p: 2, bgcolor: "background.paper", borderRadius: 2 }}>
              <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                {JSON.stringify(template, null, 2)}
              </pre>
            </Box>
          ) : (
            <Container maxWidth="lg" sx={{ py: 3 }}>
              {currentPage ? (
                <>
                  <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>
                    {currentPage.title ||
                      currentPage.menu_title ||
                      currentPage.slug ||
                      "Page"}
                  </Typography>
                  <RenderSections
                    sections={currentPage?.content?.sections || []}
                    layout={layout}
                    sectionSpacing={sectionSpacing}
                    defaultGutterX={defaultGutterX}
                  />
                </>
              ) : (
                <Typography>No page selected.</Typography>
              )}
            </Container>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
