import React, { useContext } from "react";
import { Box, Button } from "@mui/material";
import { ThemeModeContext } from "../../App";

const ThemeSwitcher = () => {
  const { themeName, setThemeName } = useContext(ThemeModeContext);

  const toggleTheme = () => {
    setThemeName(themeName === "cool" ? "dark" : "cool");
  };

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 16,
        left: 16, // Change to right: 16 for bottom right positioning
        zIndex: 1000,
      }}
    >
      <Button variant="contained" onClick={toggleTheme}>
        Switch Theme
      </Button>
    </Box>
  );
};

export default ThemeSwitcher;
