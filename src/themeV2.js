// Lightweight “enterprise” theme variant that can be toggled on/off.
// Keeps your dynamic primary colour logic intact by allowing the ThemeProvider
// to override palette.primary.main at runtime if you already do so.
import { createTheme, alpha } from "@mui/material/styles";

const baseFontStack =
  '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif';

const themeV2 = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#FF7A3C" }, // fallback; replace at runtime if you map to company theme
    secondary: { main: "#4F46E5" },
    text: {
      primary: "#0F172A",
      secondary: "#6B7280",
    },
    divider: "#E5E7EB",
    background: {
      default: "#F9FAFB",
      paper: "#FFFFFF",
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: baseFontStack,
    h1: { fontSize: 32, fontWeight: 700 },
    h2: { fontSize: 26, fontWeight: 600 },
    h3: { fontSize: 22, fontWeight: 600 },
    h4: { fontSize: 20, fontWeight: 600 },
    h5: { fontSize: 18, fontWeight: 600 },
    subtitle1: { fontSize: 16, fontWeight: 600 },
    subtitle2: { fontSize: 14, fontWeight: 600 },
    body1: { fontSize: 14, lineHeight: 1.5 },
    body2: { fontSize: 13, lineHeight: 1.5 },
    button: { textTransform: "none", fontWeight: 500 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "html, body, #root": {
          height: "100%",
          backgroundColor: "#F9FAFB",
        },
        body: {
          fontFamily: baseFontStack,
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        rounded: {
          borderRadius: 16,
        },
        outlined: ({ theme }) => ({
          borderColor: alpha(theme.palette.common.black, 0.06),
        }),
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 16,
          border: `1px solid ${alpha(theme.palette.common.black, 0.06)}`,
        }),
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 999,
          textTransform: "none",
          fontWeight: 500,
          minHeight: 40,
          paddingInline: 16,
        },
        sizeSmall: {
          minHeight: 32,
          paddingInline: 12,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 42 },
        indicator: ({ theme }) => ({
          height: 2,
          borderRadius: 999,
          backgroundColor: theme.palette.primary.main,
        }),
      },
    },
    MuiTab: {
      styleOverrides: {
        root: ({ theme }) => ({
          textTransform: "none",
          fontWeight: 500,
          minHeight: 42,
          paddingInline: 16,
          color: theme.palette.text.secondary,
          "&.Mui-selected": {
            color: theme.palette.text.primary,
            fontWeight: 600,
          },
        }),
      },
    },
    MuiChip: {
      defaultProps: { size: "small" },
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontSize: 11,
          height: 24,
        },
        label: {
          paddingInline: 8,
          fontWeight: 500,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: "#F9FAFB",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: 0.08,
          color: "#6B7280",
        },
        body: {
          fontSize: 13,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 999,
          backgroundColor: "#FFFFFF",
          "& fieldset": {
            borderColor: alpha(theme.palette.common.black, 0.06),
          },
          "&:hover fieldset": {
            borderColor: alpha(theme.palette.common.black, 0.18),
          },
          "&.Mui-focused fieldset": {
            borderWidth: 1,
          },
        }),
        input: {
          paddingBlock: 10,
          paddingInline: 14,
          fontSize: 13,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: "1px solid #E5E7EB",
        },
      },
    },
  },
});

export default themeV2;
