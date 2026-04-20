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
    borderRadius: 6,
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
        'input[type="date"], input[type="time"], input[type="datetime-local"]': {
          colorScheme: "light",
          accentColor: "#FF7A3C",
        },
        'input[type="date"]::-webkit-calendar-picker-indicator, input[type="time"]::-webkit-calendar-picker-indicator, input[type="datetime-local"]::-webkit-calendar-picker-indicator': {
          borderRadius: 6,
          cursor: "pointer",
          opacity: 0.8,
          padding: 4,
        },
        'input[type="date"]::-webkit-calendar-picker-indicator:hover, input[type="time"]::-webkit-calendar-picker-indicator:hover, input[type="datetime-local"]::-webkit-calendar-picker-indicator:hover': {
          backgroundColor: "rgba(255, 122, 60, 0.12)",
          opacity: 1,
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        rounded: {
          borderRadius: 6,
        },
        root: ({ theme }) => ({
          borderRadius: 6,
          backgroundColor: alpha(theme.palette.primary.main, 0.018),
          backgroundImage: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.07)}, ${alpha(theme.palette.background.paper, 0.93)} 190px)`,
          boxShadow: `0 10px 30px ${alpha(theme.palette.common.black, 0.05)}`,
        }),
        outlined: ({ theme }) => ({
          borderColor: alpha(theme.palette.primary.main, 0.08),
        }),
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 6,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
          backgroundColor: alpha(theme.palette.primary.main, 0.018),
          backgroundImage: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.065)}, ${alpha(theme.palette.background.paper, 0.93)} 180px)`,
          boxShadow: `0 10px 30px ${alpha(theme.palette.common.black, 0.045)}`,
        }),
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 6,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
          backgroundColor: alpha(theme.palette.primary.main, 0.018),
          backgroundImage: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.055)}, ${alpha(theme.palette.background.paper, 0.94)} 150px)`,
          boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.04)}`,
          "&:before": { display: "none" },
        }),
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 6,
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
          borderRadius: 6,
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
          borderRadius: 6,
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
          borderRadius: 6,
          backgroundColor: alpha(theme.palette.primary.main, 0.055),
          backgroundImage: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.72)}, ${alpha(theme.palette.primary.main, 0.035)})`,
          boxShadow: `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.72)}, 0 1px 2px ${alpha(theme.palette.common.black, 0.025)}`,
          "& .MuiInputBase-input, & .MuiSelect-select": {
            backgroundColor: "transparent !important",
          },
          "& fieldset": {
            borderColor: alpha(theme.palette.primary.main, 0.13),
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
        paper: ({ theme }) => ({
          backgroundColor: theme.palette.background.paper,
          backgroundImage: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.065)}, ${theme.palette.background.paper} 260px)`,
          borderRight: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
        }),
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme }) => ({
          backgroundColor: theme.palette.background.paper,
          backgroundImage: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.08)}, ${theme.palette.background.paper} 220px)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
          boxShadow: `0 28px 72px ${alpha(theme.palette.common.black, 0.24)}`,
        }),
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: ({ theme }) => ({
          backgroundColor: `${theme.palette.background.paper} !important`,
          backgroundImage: "none !important",
          color: theme.palette.text.primary,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
          boxShadow: `0 18px 44px ${alpha(theme.palette.common.black, 0.14)}`,
          opacity: 1,
        }),
        list: ({ theme }) => ({
          backgroundColor: `${theme.palette.background.paper} !important`,
          color: theme.palette.text.primary,
        }),
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          "&.Mui-selected": {
            backgroundColor: `${theme.palette.action.selected} !important`,
          },
          "&.Mui-focusVisible, &:hover": {
            backgroundColor: `${theme.palette.action.hover} !important`,
          },
        }),
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: ({ theme }) => ({
          backgroundColor: `${theme.palette.background.paper} !important`,
          backgroundImage: "none !important",
          color: theme.palette.text.primary,
          opacity: 1,
        }),
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: ({ theme }) => ({
          backgroundColor: `${theme.palette.background.paper} !important`,
          backgroundImage: "none !important",
          color: theme.palette.text.primary,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
          boxShadow: `0 18px 44px ${alpha(theme.palette.common.black, 0.14)}`,
          opacity: 1,
        }),
        listbox: ({ theme }) => ({
          backgroundColor: `${theme.palette.background.paper} !important`,
          color: theme.palette.text.primary,
          "& .MuiAutocomplete-option": {
            backgroundColor: theme.palette.background.paper,
          },
          "& .MuiAutocomplete-option.Mui-focused": {
            backgroundColor: `${theme.palette.action.hover} !important`,
          },
          "& .MuiAutocomplete-option[aria-selected='true']": {
            backgroundColor: `${theme.palette.action.selected} !important`,
          },
        }),
      },
    },
    MuiPickersPopper: {
      styleOverrides: {
        paper: ({ theme }) => ({
          backgroundColor: theme.palette.background.paper,
          backgroundImage: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.08)}, ${theme.palette.background.paper} 190px)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
          boxShadow: `0 22px 56px ${alpha(theme.palette.common.black, 0.2)}`,
        }),
      },
    },
    MuiCalendarPicker: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: "transparent",
          color: theme.palette.text.primary,
        }),
      },
    },
    MuiPickersDay: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 6,
          fontWeight: 600,
          "&.Mui-selected": {
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
          },
          "&.MuiPickersDay-today": {
            borderColor: alpha(theme.palette.primary.main, 0.5),
          },
        }),
      },
    },
  },
});

export default themeV2;
