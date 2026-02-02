import React, { useState } from "react";
import { Box, Drawer, List, ListItemButton, ListItemText, Toolbar, AppBar, Typography, Button } from "@mui/material";
import { Link, Outlet, useNavigate } from "react-router-dom";
import HelpDialog from "../components/HelpDialog";
import { SALES_REP_GUIDE_EN } from "../help/salesSystemGuide.en";

const drawerWidth = 220;

const links = [
  { label: "Summary", to: "/sales/summary" },
  { label: "Deals", to: "/sales/deals" },
  { label: "Customers", to: "/sales/customers" },
  { label: "Ledger", to: "/sales/ledger" },
  { label: "Payouts", to: "/sales/payouts" },
];

export default function SalesShell() {
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem("salesRepToken");
    navigate("/sales/login");
  };

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6">Sales Rep Portal</Typography>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Button color="inherit" onClick={() => setHelpOpen(true)}>Help</Button>
            <Typography variant="body2" sx={{ cursor: "pointer" }} onClick={logout}>
              Logout
            </Typography>
          </Box>
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
      <HelpDialog
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Schedulaa Sales System — Sales Rep Guide"
        content={SALES_REP_GUIDE_EN}
      />
    </Box>
  );
}
