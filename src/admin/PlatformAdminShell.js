import React, { useEffect, useState } from "react";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  AppBar,
  Typography,
  Button,
} from "@mui/material";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import platformAdminApi from "../api/platformAdminApi";

const drawerWidth = 240;

const navItems = [
  { label: "Search", to: "/admin/search" },
  { label: "Audit Logs", to: "/admin/audit-logs" },
  { label: "Sales Reps", to: "/admin/sales/reps" },
  { label: "Sales Deals", to: "/admin/sales/deals" },
  { label: "Sales Ledger", to: "/admin/sales/ledger" },
];

export default function PlatformAdminShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await platformAdminApi.get("/auth/me");
        setAdmin(data || null);
      } catch {
        localStorage.removeItem("platformAdminToken");
        navigate("/admin/login");
      }
    };
    load();
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("platformAdminToken");
    navigate("/admin/login");
  };

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Platform Command Center
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {admin?.email || ""}
          </Typography>
          <Button color="inherit" onClick={logout}>Logout</Button>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box" },
        }}
      >
        <Toolbar />
        <List>
          {navItems.map((item) => (
            <ListItemButton
              key={item.to}
              selected={location.pathname === item.to}
              onClick={() => navigate(item.to)}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
