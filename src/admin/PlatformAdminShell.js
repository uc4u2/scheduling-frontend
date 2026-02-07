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
import HelpDialog from "../components/HelpDialog";
import { ADMIN_GUIDE_EN } from "../help/salesSystemGuide.en";

const drawerWidth = 240;

const navItems = [
  { label: "Search", to: "/admin/search" },
  { label: "Tickets", to: "/admin/tickets" },
  { label: "Sales Reps", to: "/admin/sales/reps" },
  { label: "Sales Deals", to: "/admin/sales/deals" },
  { label: "Commission Rules", to: "/admin/sales/commission-rules" },
  { label: "Sales Ledger", to: "/admin/sales/ledger" },
  { label: "Sales Payouts", to: "/admin/sales/payouts" },
  { label: "Team", to: "/admin/team" },
  { label: "Audit Logs", to: "/admin/audit-logs" },
];

export default function PlatformAdminShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);

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

  useEffect(() => {
    const openHelp = () => setHelpOpen(true);
    window.addEventListener("admin:help", openHelp);
    return () => window.removeEventListener("admin:help", openHelp);
  }, []);

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
          <Button color="inherit" onClick={() => setHelpOpen(true)}>Help</Button>
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
          {navItems
            .filter((item) => {
              if (item.to !== "/admin/team") return true;
              return admin?.role === "platform_owner" || admin?.role === "platform_admin";
            })
            .map((item) => (
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
      <HelpDialog
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Schedulaa Sales System — Admin Guide"
        content={ADMIN_GUIDE_EN}
      />
    </Box>
  );
}
