// ONE source of truth for colours, fonts, radii, etc.
import { createTheme } from "@mui/material/styles";

const schedulaaTheme = createTheme({
  palette: {
    primary: { main: "#0053A4" },
    success: { main: "#2E7D32" },
    error:   { main: "#C62828" },
    grey:    { 100: "#F5F7FA", 200: "#E8EAED" }
  },
  typography: {
    fontFamily: '"Inter","Roboto","Helvetica","Arial",sans-serif',
    h6:   { fontWeight: 600, letterSpacing: 0.1 },
    body2:{ fontSize: 12,  fontWeight: 500 }
  },
  shape: { borderRadius: 8 }
});

export default schedulaaTheme;
