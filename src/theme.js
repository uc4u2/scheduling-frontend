// src/theme.js
import { createTheme } from "@mui/material/styles";

const PRIMARY_COLOR = "#4f7dff";
const PRIMARY_TEXT_DARK = "#2a3c68";


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
    fontFamily: '"Poppins", "Roboto", sans-serif',
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
      fontSize: '1.125rem',
      lineHeight: 1.75,
    },
    body2: {
      fontSize: '1rem',
      lineHeight: 1.7,
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
    borderRadius: 12,
  },
  marketing: marketingTokens,
  customShadows: marketingTokens.shadows,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          paddingLeft: 20,
          paddingRight: 20,
          transition: 'transform 0.1s ease, box-shadow 0.2s ease, background-color 0.2s',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 8px 20px rgba(79,125,255,0.15)',
          },
          '&:focus-visible': {
            boxShadow: '0 0 0 3px rgba(79,125,255,0.25)',
            outline: 'none',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 6px 24px rgba(0,0,0,0.04)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 600,
          '&.Mui-selected': {
            backgroundColor: 'rgba(79,125,255,0.08)',
            color: PRIMARY_COLOR,
          },
          '&:hover': {
            backgroundColor: 'rgba(79,125,255,0.05)',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: 'white',
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
          transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: PRIMARY_COLOR,
            boxShadow: '0 4px 12px rgba(79,125,255,0.2)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: PRIMARY_COLOR,
            boxShadow: '0 6px 20px rgba(79,125,255,0.3)',
          },
        },
        notchedOutline: {
          borderColor: '#ccc',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          color: PRIMARY_TEXT_DARK,
          '&.Mui-focused': {
            color: PRIMARY_COLOR,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: {
          borderRadius: 12,
          backgroundColor: 'white',
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(79,125,255,0.2)',
          },
          '&.Mui-focused': {
            boxShadow: '0 6px 20px rgba(79,125,255,0.3)',
          },
        },
      },
    },
  },
};

// --------------- BASE THEMES ---------------

export const coolTheme = createTheme({
  ...commonSettings,
  palette: {
    mode: "light",
    primary: { main: PRIMARY_COLOR },
    secondary: { main: "#34d0b5" },
    background: { default: "#f5f7ff", paper: "#ffffff" },
    text: { primary: "#1f2d47", secondary: "#4f5d77" },
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
    primary: { main: "#ff7043" },
    secondary: { main: "#ffccbc" },
    background: { default: "#fff3e0", paper: "#ffffff" },
    text: { primary: "#4e342e", secondary: "#6d4c41" },
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








