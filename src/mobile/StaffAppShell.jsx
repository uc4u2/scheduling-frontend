import React, { useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import { Outlet, useNavigate } from "react-router-dom";
import BottomTabs from "./BottomTabs";
import MoreDrawer from "./MoreDrawer";

export default function StaffAppShell({ role }) {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleNavigate = (to) => {
    if (!to) return;
    navigate(to);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("company_id");
    navigate("/login", { replace: true });
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "background.default" }}>
      <AppBar position="fixed" color="inherit" elevation={1}>
        <Toolbar>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexGrow: 1 }}>
            <PhoneIphoneIcon fontSize="small" color="primary" />
            <Typography variant="h6" fontWeight={700}>Schedulaa Staff</Typography>
            <Chip
              size="small"
              label={role === "manager" ? "Manager" : "Employee"}
              color="primary"
              variant="outlined"
            />
          </Stack>
          <Button
            size="small"
            onClick={() => navigate(role === "manager" ? "/manager/dashboard" : "/employee/my-time")}
          >
            Desktop
          </Button>
          <IconButton aria-label="logout" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box
        component="main"
        sx={{
          px: 1.5,
          pt: "calc(64px + env(safe-area-inset-top))",
          pb: "calc(76px + env(safe-area-inset-bottom))",
          maxWidth: 900,
          mx: "auto",
        }}
      >
        <Outlet />
      </Box>

      <BottomTabs role={role} onNavigate={handleNavigate} onMore={() => setDrawerOpen(true)} />
      <MoreDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        role={role}
        onNavigate={handleNavigate}
      />
    </Box>
  );
}
