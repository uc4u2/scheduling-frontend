import React from "react";
import { AppBar, Toolbar, Typography, IconButton, Box } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

const MobileHeader = ({
  title,
  onMenuClick,
  rightAction = null,
}) => (
  <AppBar
    position="sticky"
    color="inherit"
    elevation={1}
    sx={{ top: 0, zIndex: (theme) => theme.zIndex.drawer + 1 }}
  >
    <Toolbar sx={{ minHeight: "56px !important", px: 1.5, pt: "env(safe-area-inset-top)" }}>
      <IconButton edge="start" onClick={onMenuClick} aria-label="Open menu">
        <MenuIcon />
      </IconButton>
      <Typography variant="h6" sx={{ ml: 0.5, flexGrow: 1, fontSize: 18, fontWeight: 700 }}>
        {title}
      </Typography>
      <Box sx={{ minWidth: 40, display: "flex", justifyContent: "flex-end" }}>
        {rightAction}
      </Box>
    </Toolbar>
  </AppBar>
);

export default MobileHeader;
