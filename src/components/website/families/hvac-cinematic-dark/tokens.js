const cinematicTokens = Object.freeze({
  typography: {
    headingFont: '"Barlow Condensed", "Oswald", "Inter", sans-serif',
    bodyFont:
      '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  colors: {
    bg: "#05080d",
    bgAlt: "#0b1119",
    surface: "rgba(11, 17, 25, 0.88)",
    surfaceSoft: "rgba(17, 26, 38, 0.9)",
    line: "rgba(119, 151, 184, 0.18)",
    lineStrong: "rgba(119, 151, 184, 0.28)",
    text: "#eef3f7",
    textSoft: "rgba(238,243,247,0.74)",
    textMuted: "rgba(189,205,221,0.72)",
    accent: "#f58a1f",
    accentSoft: "rgba(245,138,31,0.15)",
    steel: "#2f6e99",
    tealGlow: "rgba(47,110,153,0.22)",
  },
  layout: {
    shellMax: 1480,
    contentMax: 1260,
    heroMinHeight: 780,
    radius: 28,
    panelRadius: 22,
  },
  graphics: {
    grid:
      "linear-gradient(rgba(95,126,156,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(95,126,156,0.12) 1px, transparent 1px)",
    gridSize: "30px 30px",
    clipA: "polygon(0 0, 100% 0, 100% 88%, 90% 100%, 0 100%)",
    clipB: "polygon(0 0, 100% 0, 100% 100%, 7% 100%, 0 84%)",
    noise:
      "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.04) 0 1px, transparent 1px), radial-gradient(circle at 80% 40%, rgba(255,255,255,0.03) 0 1px, transparent 1px)",
  },
});

export default cinematicTokens;
