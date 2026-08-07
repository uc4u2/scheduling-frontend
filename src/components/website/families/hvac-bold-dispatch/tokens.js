const dispatchTokens = Object.freeze({
  typography: {
    headingFont: '"Archivo Black", "Barlow Condensed", "Inter", sans-serif',
    bodyFont:
      '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  colors: {
    bg: "#1a1714",
    bgAlt: "#25211d",
    surface: "#2d2721",
    surfaceSoft: "#f4eee4",
    line: "rgba(255,245,231,0.12)",
    lineStrong: "rgba(255,112,45,0.42)",
    text: "#f7f0e6",
    textSoft: "rgba(247,240,230,0.76)",
    textMuted: "rgba(247,240,230,0.58)",
    ink: "#181512",
    cream: "#f6eee2",
    orange: "#ef6b2e",
    red: "#cf402d",
    gold: "#ffb253",
  },
  layout: {
    shellMax: 1460,
    contentMax: 1220,
    heroMinHeight: 760,
    radius: 10,
    panelRadius: 8,
  },
});

export default dispatchTokens;
