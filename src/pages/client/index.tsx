// index.tsx
import { ThemeProvider } from "@mui/material";
import { schedulaaTheme } from "./ui/theme";
…
<ThemeProvider theme={schedulaaTheme}>
  <CssBaseline enableColorScheme />   {/* dark‑mode ready */}
  <App />
</ThemeProvider>
