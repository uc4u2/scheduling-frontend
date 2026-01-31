import React from "react";
import { Box, Drawer, List, ListItemButton, ListItemText, Toolbar, AppBar, Typography } from "@mui/material";
import { Link, Outlet, useNavigate } from "react-router-dom";

const drawerWidth = 220;

const links = [
  { label: "Summary", to: "/sales/summary" },
  { label: "Deals", to: "/sales/deals" },
  { label: "Ledger", to: "/sales/ledger" },
];

export default function SalesShell() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("salesRepToken");
    navigate("/sales/login");
  };

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6">Sales Rep Portal</Typography>
          <Typography variant="body2" sx={{ cursor: "pointer" }} onClick={logout}>
            Logout
          </Typography>
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
          {links.map((item) => (
            <ListItemButton key={item.to} component={Link} to={item.to}>
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
