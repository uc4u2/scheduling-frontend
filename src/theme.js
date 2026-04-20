// src/theme.js
import { createTheme, alpha } from "@mui/material/styles";

const marketingTokens = {
  radius: {
    md: 20,
    lg: 24,
    xl: 32,
  },
  shadows: {
    sm: '0 12px 32px rgba(15, 23, 42, 0.08)',
    md: '0 18px 44px rgba(15, 23, 42, 0.12)',
    lg: '0 24px 64px rgba(15, 23, 42, 0.16)',
    xl: '0 28px 72px rgba(15, 23, 42, 0.18)',
  },
  gradients: {
    primary: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 45%, #34d399 100%)',
    secondary: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
    surface: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(241,245,249,0.92) 100%)',
  },
  typography: {
    heroTitle: {
      fontSize: 'clamp(3rem, 2.5rem + 1.4vw, 3.5rem)',
      fontWeight: 800,
      lineHeight: 1.05,
      letterSpacing: '-0.02em',
    },
    sectionTitle: {
      fontSize: 'clamp(2.25rem, 1.6rem + 1vw, 2.75rem)',
      fontWeight: 700,
      lineHeight: 1.12,
      letterSpacing: '-0.015em',
    },
    body: {
      fontSize: '1.125rem',
      lineHeight: 1.7,
    },
  },
};

const commonSettings = {
  typography: {
    fontFamily: '"Inter", "Plus Jakarta Sans", "Poppins", "Roboto", sans-serif',
    h1: {
      fontWeight: 800,
      fontSize: 'clamp(3rem, 2.4rem + 1.6vw, 3.5rem)',
      lineHeight: 1.05,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      fontSize: 'clamp(2.25rem, 1.8rem + 0.8vw, 2.75rem)',
      lineHeight: 1.12,
      letterSpacing: '-0.015em',
    },
    h3: {
      fontWeight: 700,
      fontSize: 'clamp(1.75rem, 1.5rem + 0.6vw, 2.25rem)',
      lineHeight: 1.18,
    },
    subtitle1: {
      fontSize: '1.25rem',
      lineHeight: 1.65,
      fontWeight: 500,
    },
    subtitle2: {
      fontSize: '1.125rem',
      lineHeight: 1.6,
      fontWeight: 500,
    },
    body1: {
      fontSize: '1.0625rem',
      lineHeight: 1.72,
    },
    body2: {
      fontSize: '0.95rem',
      lineHeight: 1.65,
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 600,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.01em',
    },
    eyebrow: {
      fontSize: '0.875rem',
      fontWeight: 600,
      letterSpacing: '0.24em',
      textTransform: 'uppercase',
    },
    heroSubtitle: {
      fontSize: '1.25rem',
      lineHeight: 1.7,
      maxWidth: '46rem',
    },
  },
  shape: {
    borderRadius: 6,
  },
  marketing: marketingTokens,
  customShadows: marketingTokens.shadows,
  components: {
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        'input[type="date"], input[type="time"], input[type="datetime-local"]': {
          colorScheme: theme.palette.mode,
          accentColor: theme.palette.primary.main,
        },
        'input[type="date"]::-webkit-calendar-picker-indicator, input[type="time"]::-webkit-calendar-picker-indicator, input[type="datetime-local"]::-webkit-calendar-picker-indicator': {
          borderRadius: 6,
          cursor: "pointer",
          opacity: 0.8,
          padding: 4,
          filter: theme.palette.mode === "dark" ? "invert(1)" : "none",
        },
        'input[type="date"]::-webkit-calendar-picker-indicator:hover, input[type="time"]::-webkit-calendar-picker-indicator:hover, input[type="datetime-local"]::-webkit-calendar-picker-indicator:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.12),
          opacity: 1,
        },
      }),
    },
    MuiButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 6,
          paddingLeft: 18,
          paddingRight: 18,
          minHeight: 40,
          transition: 'transform 0.1s ease, box-shadow 0.2s ease, background-color 0.2s',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: `0 10px 24px ${alpha(theme.palette.primary.main, 0.16)}`,
          },
          '&:focus-visible': {
            boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.24)}`,
            outline: 'none',
          },
        }),
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 6,
          border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.14 : 0.07)}`,
          backgroundColor:
            theme.palette.mode === "dark"
              ? alpha(theme.palette.primary.main, 0.08)
              : alpha(theme.palette.primary.main, 0.018),
          backgroundImage:
            theme.palette.mode === "dark"
              ? `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.12)}, ${alpha(theme.palette.background.paper, 0.86)} 190px)`
              : `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.07)}, ${alpha(theme.palette.background.paper, 0.93)} 190px)`,
          boxShadow: `0 10px 30px ${alpha(theme.palette.common.black, theme.palette.mode === "dark" ? 0.26 : 0.055)}`,
        }),
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 6,
          border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.14 : 0.08)}`,
          backgroundColor:
            theme.palette.mode === "dark"
              ? alpha(theme.palette.primary.main, 0.08)
              : alpha(theme.palette.primary.main, 0.018),
          backgroundImage:
            theme.palette.mode === "dark"
              ? `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.12)}, ${alpha(theme.palette.background.paper, 0.86)} 180px)`
              : `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.065)}, ${alpha(theme.palette.background.paper, 0.93)} 180px)`,
          boxShadow: `0 10px 30px ${alpha(theme.palette.common.black, theme.palette.mode === "dark" ? 0.24 : 0.05)}`,
        }),
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 6,
          border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.14 : 0.07)}`,
          backgroundColor:
            theme.palette.mode === "dark"
              ? alpha(theme.palette.primary.main, 0.08)
              : alpha(theme.palette.primary.main, 0.018),
          backgroundImage:
            theme.palette.mode === "dark"
              ? `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.background.paper, 0.88)} 150px)`
              : `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.055)}, ${alpha(theme.palette.background.paper, 0.94)} 150px)`,
          boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, theme.palette.mode === "dark" ? 0.22 : 0.045)}`,
          "&:before": { display: "none" },
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 6,
          fontWeight: 600,
          border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.2 : 0.11)}`,
          backgroundColor:
            theme.palette.mode === "dark"
              ? alpha(theme.palette.primary.main, 0.14)
              : alpha(theme.palette.primary.main, 0.07),
        }),
        label: {
          paddingLeft: 10,
          paddingRight: 10,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
        standardInfo: {
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
        },
        standardWarning: {
          backgroundColor: 'rgba(245, 158, 11, 0.10)',
        },
        standardSuccess: {
          backgroundColor: 'rgba(34, 197, 94, 0.10)',
        },
        standardError: {
          backgroundColor: 'rgba(239, 68, 68, 0.10)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 6,
          textTransform: 'none',
          fontWeight: 600,
          '&.Mui-selected': {
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
          },
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.07),
          },
        }),
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 6,
          backgroundColor:
            theme.palette.mode === "dark"
              ? alpha(theme.palette.primary.main, 0.12)
              : alpha(theme.palette.primary.main, 0.055),
          backgroundImage: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.08 : 0.72)}, ${alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.08 : 0.035)})`,
          boxShadow: `inset 0 1px 0 ${alpha(theme.palette.common.white, theme.palette.mode === "dark" ? 0.04 : 0.7)}, 0 1px 2px ${alpha(theme.palette.common.black, 0.025)}`,
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease, background-color 0.2s ease',
          '& .MuiInputBase-input, & .MuiSelect-select': {
            backgroundColor: 'transparent !important',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main,
            boxShadow: 'none',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main,
            borderWidth: 1,
          },
        }),
        notchedOutline: ({ theme }) => ({
          borderColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.18 : 0.13),
          borderWidth: 1,
        }),
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: ({ theme }) => ({
          fontWeight: 600,
          color: theme.palette.text.primary,
          '&.Mui-focused': {
            color: theme.palette.primary.main,
          },
        }),
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: ({ theme }) => ({
          borderRadius: 6,
          backgroundColor: 'transparent',
          boxShadow: '0 1px 2px rgba(15,23,42,0.02)',
        }),
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme }) => ({
          backgroundColor: theme.palette.background.paper,
          backgroundImage:
            theme.palette.mode === "dark"
              ? `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.16)}, ${theme.palette.background.paper} 220px)`
              : `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.08)}, ${theme.palette.background.paper} 220px)`,
          border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.2 : 0.12)}`,
          boxShadow: `0 28px 72px ${alpha(theme.palette.common.black, theme.palette.mode === "dark" ? 0.55 : 0.24)}`,
        }),
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: ({ theme }) => ({
          backgroundColor: theme.palette.background.paper,
          backgroundImage:
            theme.palette.mode === "dark"
              ? `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.12)}, ${theme.palette.background.paper} 260px)`
              : `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.065)}, ${theme.palette.background.paper} 260px)`,
          borderColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.2 : 0.12),
        }),
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: ({ theme }) => ({
          backgroundColor: `${theme.palette.background.paper} !important`,
          backgroundImage: "none !important",
          color: theme.palette.text.primary,
          border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.18 : 0.12)}`,
          boxShadow: `0 18px 44px ${alpha(theme.palette.common.black, theme.palette.mode === "dark" ? 0.36 : 0.14)}`,
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
          border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.18 : 0.12)}`,
          boxShadow: `0 18px 44px ${alpha(theme.palette.common.black, theme.palette.mode === "dark" ? 0.36 : 0.14)}`,
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
          backgroundImage:
            theme.palette.mode === "dark"
              ? `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.16)}, ${theme.palette.background.paper} 190px)`
              : `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.08)}, ${theme.palette.background.paper} 190px)`,
          border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.22 : 0.14)}`,
          boxShadow: `0 22px 56px ${alpha(theme.palette.common.black, theme.palette.mode === "dark" ? 0.48 : 0.2)}`,
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
};

// --------------- BASE THEMES ---------------

export const coolTheme = createTheme({
  ...commonSettings,
  palette: {
    mode: "light",
    primary: { main: "#3F6FF3", dark: "#274EA8", light: "#7EA2FF", contrastText: "#FFFFFF" },
    secondary: { main: "#22B8A7", dark: "#0F766E", light: "#8CE6DB", contrastText: "#062A2A" },
    divider: "rgba(63, 111, 243, 0.14)",
    background: { default: "#EAF2FF", paper: "#F1F6FF" },
    text: { primary: "#12213F", secondary: "#40516F" },
    action: {
      hover: "rgba(63, 111, 243, 0.07)",
      selected: "rgba(63, 111, 243, 0.12)",
      focus: "rgba(63, 111, 243, 0.16)",
    },
  },
});

export const darkTheme = createTheme({
  ...commonSettings,
  palette: {
    mode: "dark",
    primary: { main: "#90caf9" },
    secondary: { main: "#f48fb1" },
    background: { default: "#121212", paper: "#1e1e1e" },
    text: { primary: "#ffffff", secondary: "#aaaaaa" },
  },
  components: {
    ...commonSettings.components,
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#1e1e1e",
          color: "#ffffff",
          boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
          border: "1px solid rgba(255,255,255,0.07)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#1e1e1e",
          color: "#ffffff",
          boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
          border: "1px solid rgba(255,255,255,0.07)",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#1e1e1e",
          boxShadow: "none",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255,255,255,0.18)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255,255,255,0.35)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#90caf9",
            boxShadow: "0 0 0 1px rgba(144,202,249,0.35)",
          },
        },
        input: { color: "#ffffff" },
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: {
          backgroundColor: "#1e1e1e",
          boxShadow: "none",
        },
      },
    },
  },
});

export const navyTheme = createTheme({
  ...commonSettings,
  palette: {
    mode: "dark",
    primary: { main: "#0a192f" },
    secondary: { main: "#64ffda" },
    background: { default: "#0a192f", paper: "#112240" },
    text: { primary: "#ccd6f6", secondary: "#8892b0" },
  },
  components: {
    ...commonSettings.components,
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#112240",
          color: "#ccd6f6",
          boxShadow: "0 8px 20px rgba(0,0,0,0.45)",
          border: "1px solid rgba(100,255,218,0.15)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#112240",
          color: "#ccd6f6",
          boxShadow: "0 8px 20px rgba(0,0,0,0.45)",
          border: "1px solid rgba(100,255,218,0.15)",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#0a192f",
          boxShadow: "none",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(204,214,246,0.25)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(100,255,218,0.45)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#64ffda",
            boxShadow: "0 0 0 1px rgba(100,255,218,0.35)",
          },
        },
        input: { color: "#ccd6f6" },
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: {
          backgroundColor: "#0a192f",
          boxShadow: "none",
        },
      },
    },
  },
});

export const sunsetTheme = createTheme({
  ...commonSettings,
  palette: {
    mode: "light",
    primary: { main: "#E85D35", dark: "#A5371E", light: "#FF9A73", contrastText: "#FFFFFF" },
    secondary: { main: "#F4A261", dark: "#B85F14", light: "#FFD0A3", contrastText: "#3A1D0C" },
    divider: "rgba(232, 93, 53, 0.15)",
    background: { default: "#FFF0E6", paper: "#FFF2EA" },
    text: { primary: "#3F241C", secondary: "#76503F" },
    action: {
      hover: "rgba(232, 93, 53, 0.07)",
      selected: "rgba(232, 93, 53, 0.12)",
      focus: "rgba(232, 93, 53, 0.16)",
    },
  },
});

export const aquaTheme = createTheme({
  ...commonSettings,
  palette: {
    mode: "light",
    primary: { main: "#00bcd4" },
    secondary: { main: "#4dd0e1" },
    background: { default: "#e0f7fa", paper: "#ffffff" },
    text: { primary: "#004d40", secondary: "#00796b" },
  },
});

export const forestTheme = createTheme({
  ...commonSettings,
  palette: {
    mode: "light",
    primary: { main: "#2e7d32" },
    secondary: { main: "#a5d6a7" },
    background: { default: "#e8f5e9", paper: "#ffffff" },
    text: { primary: "#1b5e20", secondary: "#4caf50" },
  },
});

export const roseTheme = createTheme({
  ...commonSettings,
  palette: {
    mode: "light",
    primary: { main: "#e91e63" },
    secondary: { main: "#f8bbd0" },
    background: { default: "#fce4ec", paper: "#ffffff" },
    text: { primary: "#880e4f", secondary: "#ad1457" },
  },
});

export const slateTheme = createTheme({
  ...commonSettings,
  palette: {
    mode: "light",
    primary: { main: "#607d8b" },
    secondary: { main: "#cfd8dc" },
    background: { default: "#eceff1", paper: "#ffffff" },
    text: { primary: "#263238", secondary: "#455a64" },
  },
});

// --------------- NEW THEMES ---------------

export const emeraldNightTheme = createTheme({
  ...commonSettings,
  palette: {
    mode: "dark",
    primary: { main: "#00bfa5" },
    secondary: { main: "#1de9b6" },
    background: { default: "#071312", paper: "#0d1c1a" },
    text: { primary: "#e6fff7", secondary: "#8fdace" },
  },
  components: {
    ...commonSettings.components,
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#0d1c1a",
          color: "#e6fff7",
          boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
          border: "1px solid rgba(230,255,247,0.07)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#0d1c1a",
          color: "#e6fff7",
          boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
          border: "1px solid rgba(230,255,247,0.07)",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#0d1c1a",
          boxShadow: "none",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(230,255,247,0.18)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(230,255,247,0.35)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#1de9b6",
            boxShadow: "0 0 0 1px rgba(29,233,182,0.35)",
          },
        },
        input: { color: "#e6fff7" },
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: {
          backgroundColor: "#0d1c1a",
          boxShadow: "none",
        },
      },
    },
  },
});
export const goldTheme = createTheme({
  ...commonSettings,
  palette: {
    mode: "light",
    primary: { main: "#FFD700" },
    secondary: { main: "#FFC107" },
    background: { default: "#FFFBEA", paper: "#FFF8E1" },
    text: { primary: "#6C5200", secondary: "#A68B00" },
  },
});

export const skyTheme = createTheme({
  ...commonSettings,
  palette: {
    mode: "light",
    primary: { main: "#38BDF8" },
    secondary: { main: "#0EA5E9" },
    background: { default: "#E0F7FA", paper: "#B3E5FC" },
    text: { primary: "#134e6f", secondary: "#468faf" },
  },
});

export const lavenderTheme = createTheme({
  ...commonSettings,
  palette: {
    mode: "light",
    primary: { main: "#B39DDB" },
    secondary: { main: "#9575CD" },
    background: { default: "#F3E8FF", paper: "#EDE7F6" },
    text: { primary: "#5E35B1", secondary: "#8e24aa" },
  },
});

export const mintTheme = createTheme({
  ...commonSettings,
  palette: {
    mode: "light",
    primary: { main: "#4DD0E1" },
    secondary: { main: "#00BFAE" },
    background: { default: "#E0FFF3", paper: "#B2F4DE" },
    text: { primary: "#10574B", secondary: "#009688" },
  },
});

export const coralTheme = createTheme({
  ...commonSettings,
  palette: {
    mode: "light",
    primary: { main: "#FF7043" },
    secondary: { main: "#FFAB91" },
    background: { default: "#FFF3ED", paper: "#FFE0B2" },
    text: { primary: "#D84315", secondary: "#FF5722" },
  },
});

export const crimsonTheme = createTheme({
  ...commonSettings,
  palette: {
    mode: "light",
    primary: { main: "#D32F2F" },
    secondary: { main: "#FFCDD2" },
    background: { default: "#FFF0F3", paper: "#FFEBEE" },
    text: { primary: "#8A1B1B", secondary: "#B71C1C" },
  },
});

export const charcoalTheme = createTheme({
  ...commonSettings,
  palette: {
    mode: "dark",
    primary: { main: "#212121" },
    secondary: { main: "#616161" },
    background: { default: "#181818", paper: "#222" },
    text: { primary: "#F5F5F5", secondary: "#BDBDBD" },
  },
  components: {
    ...commonSettings.components,
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#222",
          color: "#F5F5F5",
          boxShadow: "0 8px 20px rgba(0,0,0,0.45)",
          border: "1px solid rgba(245,245,245,0.08)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#222",
          color: "#F5F5F5",
          boxShadow: "0 8px 20px rgba(0,0,0,0.45)",
          border: "1px solid rgba(245,245,245,0.08)",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#181818",
          boxShadow: "none",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(245,245,245,0.18)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(245,245,245,0.35)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#616161",
            boxShadow: "0 0 0 1px rgba(97,97,97,0.35)",
          },
        },
        input: { color: "#F5F5F5" },
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: {
          backgroundColor: "#181818",
          boxShadow: "none",
        },
      },
    },
  },
});

export const coffeeTheme = createTheme({
  ...commonSettings,
  palette: {
    mode: "light",
    primary: { main: "#6F4E37" },
    secondary: { main: "#BCAAA4" },
    background: { default: "#FFF7ED", paper: "#ECE0D1" },
    text: { primary: "#3E2723", secondary: "#8D6E63" },
  },
});

export const sunflowerTheme = createTheme({
  ...commonSettings,
  palette: {
    mode: "light",
    primary: { main: "#FFEB3B" },
    secondary: { main: "#FFD600" },
    background: { default: "#FFFDE7", paper: "#FFF9C4" },
    text: { primary: "#BFA100", secondary: "#FFB300" },
  },
});

export const eggplantTheme = createTheme({
  ...commonSettings,
  palette: {
    mode: "dark",
    primary: { main: "#6D357A" },
    secondary: { main: "#9B59B6" },
    background: { default: "#2D1538", paper: "#3D2460" },
    text: { primary: "#F3E5F5", secondary: "#B388FF" },
  },
  components: {
    ...commonSettings.components,
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#3D2460",
          color: "#F3E5F5",
          boxShadow: "0 8px 20px rgba(0,0,0,0.45)",
          border: "1px solid rgba(243,229,245,0.12)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#3D2460",
          color: "#F3E5F5",
          boxShadow: "0 8px 20px rgba(0,0,0,0.45)",
          border: "1px solid rgba(243,229,245,0.12)",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#2D1538",
          boxShadow: "none",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(243,229,245,0.25)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(155,89,182,0.45)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#9B59B6",
            boxShadow: "0 0 0 1px rgba(155,89,182,0.35)",
          },
        },
        input: { color: "#F3E5F5" },
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: {
          backgroundColor: "#2D1538",
          boxShadow: "none",
        },
      },
    },
  },
});

// -------- Semi-dark palettes --------
export const slateDuskTheme = createTheme({
  ...commonSettings,
  palette: {
    mode: "dark",
    primary: { main: "#5C6B7A" },
    secondary: { main: "#A7B6C7" },
    background: { default: "#161C22", paper: "#1F262E" },
    text: { primary: "#E4E9EF", secondary: "#9FA9B5" },
  },
  components: {
    ...commonSettings.components,
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#1F262E",
          color: "#E4E9EF",
          boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
          border: "1px solid rgba(228,233,239,0.08)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#1F262E",
          color: "#E4E9EF",
          boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
          border: "1px solid rgba(228,233,239,0.08)",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#161C22",
          boxShadow: "none",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(228,233,239,0.18)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(228,233,239,0.35)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#A7B6C7",
            boxShadow: "0 0 0 1px rgba(167,182,199,0.35)",
          },
        },
        input: { color: "#E4E9EF" },
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: { backgroundColor: "#161C22", boxShadow: "none" },
      },
    },
  },
});

export const tealTwilightTheme = createTheme({
  ...commonSettings,
  palette: {
    mode: "dark",
    primary: { main: "#2A9D8F" },
    secondary: { main: "#56C2B7" },
    background: { default: "#10201F", paper: "#152A29" },
    text: { primary: "#E6F4F2", secondary: "#99C8C2" },
  },
  components: {
    ...commonSettings.components,
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#152A29",
          color: "#E6F4F2",
          boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
          border: "1px solid rgba(230,244,242,0.08)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#152A29",
          color: "#E6F4F2",
          boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
          border: "1px solid rgba(230,244,242,0.08)",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#10201F",
          boxShadow: "none",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(230,244,242,0.18)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(86,194,183,0.45)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#56C2B7",
            boxShadow: "0 0 0 1px rgba(86,194,183,0.35)",
          },
        },
        input: { color: "#E6F4F2" },
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: { backgroundColor: "#10201F", boxShadow: "none" },
      },
    },
  },
});

export const cinderBlueTheme = createTheme({
  ...commonSettings,
  palette: {
    mode: "dark",
    primary: { main: "#4A6FA5" },
    secondary: { main: "#91B4F2" },
    background: { default: "#131926", paper: "#1A2131" },
    text: { primary: "#E7ECF8", secondary: "#A8B5D1" },
  },
  components: {
    ...commonSettings.components,
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#1A2131",
          color: "#E7ECF8",
          boxShadow: "0 8px 20px rgba(0,0,0,0.40)",
          border: "1px solid rgba(231,236,248,0.10)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#1A2131",
          color: "#E7ECF8",
          boxShadow: "0 8px 20px rgba(0,0,0,0.40)",
          border: "1px solid rgba(231,236,248,0.10)",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#131926",
          boxShadow: "none",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(231,236,248,0.18)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(145,180,242,0.45)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#91B4F2",
            boxShadow: "0 0 0 1px rgba(145,180,242,0.35)",
          },
        },
        input: { color: "#E7ECF8" },
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: { backgroundColor: "#131926", boxShadow: "none" },
      },
    },
  },
});

export const amberSmokeTheme = createTheme({
  ...commonSettings,
  palette: {
    mode: "dark",
    primary: { main: "#D48C2E" },
    secondary: { main: "#F2BD6D" },
    background: { default: "#1C1812", paper: "#231F18" },
    text: { primary: "#F6E9D8", secondary: "#C2AE8A" },
  },
  components: {
    ...commonSettings.components,
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#231F18",
          color: "#F6E9D8",
          boxShadow: "0 8px 20px rgba(0,0,0,0.40)",
          border: "1px solid rgba(246,233,216,0.10)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#231F18",
          color: "#F6E9D8",
          boxShadow: "0 8px 20px rgba(0,0,0,0.40)",
          border: "1px solid rgba(246,233,216,0.10)",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#1C1812",
          boxShadow: "none",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(246,233,216,0.18)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(212,140,46,0.45)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#D48C2E",
            boxShadow: "0 0 0 1px rgba(212,140,46,0.35)",
          },
        },
        input: { color: "#F6E9D8" },
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: { backgroundColor: "#1C1812", boxShadow: "none" },
      },
    },
  },
});

export const plumMistTheme = createTheme({
  ...commonSettings,
  palette: {
    mode: "dark",
    primary: { main: "#9B6BB3" },
    secondary: { main: "#C3A2DA" },
    background: { default: "#1A1320", paper: "#21162B" },
    text: { primary: "#F1E6F7", secondary: "#BDA6CC" },
  },
  components: {
    ...commonSettings.components,
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#21162B",
          color: "#F1E6F7",
          boxShadow: "0 8px 20px rgba(0,0,0,0.40)",
          border: "1px solid rgba(241,230,247,0.10)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#21162B",
          color: "#F1E6F7",
          boxShadow: "0 8px 20px rgba(0,0,0,0.40)",
          border: "1px solid rgba(241,230,247,0.10)",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#1A1320",
          boxShadow: "none",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(241,230,247,0.18)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(155,107,179,0.45)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#9B6BB3",
            boxShadow: "0 0 0 1px rgba(155,107,179,0.35)",
          },
        },
        input: { color: "#F1E6F7" },
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: { backgroundColor: "#1A1320", boxShadow: "none" },
      },
    },
  },
});
