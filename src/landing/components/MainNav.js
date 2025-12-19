import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Button,
  Typography,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Stack,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import { Link, useLocation } from "react-router-dom";
import { useTheme, alpha } from "@mui/material/styles";

const marketingLinks = [
  { label: "Features", to: "/features" },
  { label: "Workforce", to: "/workforce" },
  { label: "Marketing", to: "/marketing" },
  { label: "Industries", to: "/industries" },
  { label: "Docs", to: "/docs" },
  { label: "Compare", to: "/compare" },
  { label: "Alternatives", to: "/alternatives" },
  { label: "Pricing", to: "/pricing" },
  { label: "Contact", to: "/contact" },
  { label: "About", to: "/about" },
];

const loggedInLinks = [
  { label: "Employee Dashboard", to: "/employee?tab=availability", icon: <DashboardIcon fontSize="small" /> },
  { label: "Management Dashboard", to: "/manager/dashboard", icon: <WorkspacesIcon fontSize="small" /> },
];

const loggedOutLinks = [
  { label: "Login", to: "/login" },
];

const MainNav = ({ token, setToken }) => {
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const toggleMobile = () => setMobileOpen((prev) => !prev);

  const handleLogout = () => {
    localStorage.removeItem("token");
    if (typeof setToken === "function") setToken("");
    setMobileOpen(false);
  };

  const isActive = (to) => {
    if (!to) return false;
    if (to.includes("#")) {
      const [path] = to.split("#");
      return location.pathname === path;
    }
    return location.pathname === to;
  };

  const renderDesktopLinks = () => (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ display: { xs: "none", md: "flex" } }}>
      {marketingLinks.map((link) => (
        <Button
          key={link.to}
          component={Link}
          to={link.to}
          color={isActive(link.to) ? "primary" : "inherit"}
          sx={{ textTransform: "none", fontWeight: isActive(link.to) ? 700 : 500 }}
        >
          {link.label}
        </Button>
      ))}
      {(token ? loggedInLinks : loggedOutLinks).map((link) => (
        <Button
          key={link.to}
          component={Link}
          to={link.to}
          color="inherit"
          startIcon={link.icon}
          sx={{ textTransform: "none" }}
        >
          {link.label}
        </Button>
      ))}
      {!token && (
        <Button
          component={Link}
          to="/register"
          variant="contained"
          color="primary"
          sx={{ textTransform: "none", borderRadius: 999, px: 3 }}
        >
          Start Free Trial
        </Button>
      )}
      {!token && (
        <Button
          component={Link}
          to="/contact"
          variant="outlined"
          color="primary"
          sx={{ textTransform: "none", borderRadius: 999 }}
        >
          Talk to Sales
        </Button>
      )}
      {token && (
        <Button
          onClick={handleLogout}
          variant="outlined"
          color="inherit"
          startIcon={<LogoutIcon fontSize="small" />}
          sx={{ textTransform: "none", borderRadius: 999 }}
        >
          Logout
        </Button>
      )}
    </Stack>
  );

  const renderMobileDrawer = () => {
    const mobileLinks = [...marketingLinks, ...(token ? loggedInLinks : loggedOutLinks)];
    return (
      <Drawer anchor="right" open={mobileOpen} onClose={toggleMobile}>
        <Box sx={{ width: 280, p: 2, height: "100%", display: "flex", flexDirection: "column", gap: 2 }} role="presentation">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" component={Link} to="/" sx={{ textDecoration: "none", color: "inherit" }} onClick={toggleMobile}>
              Schedulaa
            </Typography>
            <IconButton onClick={toggleMobile}>
              <CloseIcon />
            </IconButton>
          </Box>
          <List sx={{ flex: 1 }}>
            {mobileLinks.map((link) => (
              <ListItemButton
                key={link.to}
                component={Link}
                to={link.to}
                onClick={toggleMobile}
                selected={isActive(link.to)}
              >
                <ListItemText primary={link.label} />
              </ListItemButton>
            ))}
          </List>
          <Box display="flex" flexDirection="column" gap={1}>
            {!token ? (
              <>
                <Button
                  fullWidth
                  component={Link}
                  to="/register"
                  variant="contained"
                  color="primary"
                  onClick={toggleMobile}
                  sx={{ textTransform: "none", borderRadius: 999 }}
                >
                  Start Free Trial
                </Button>
                <Button
                  fullWidth
                  component={Link}
                  to="/contact"
                  variant="outlined"
                  color="primary"
                  onClick={toggleMobile}
                  sx={{ textTransform: "none", borderRadius: 999 }}
                >
                  Talk to Sales
                </Button>
              </>
            ) : (
              <Button
                fullWidth
                onClick={handleLogout}
                variant="outlined"
                color="inherit"
                startIcon={<LogoutIcon fontSize="small" />}
                sx={{ textTransform: "none", borderRadius: 999 }}
              >
                Logout
              </Button>
            )}
          </Box>
        </Box>
      </Drawer>
    );
  };

  return (
    <AppBar
      position="sticky"
      color="transparent"
      elevation={0}
      sx={{
        backdropFilter: "blur(18px)",
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
        backgroundColor: alpha(theme.palette.background.paper, 0.85),
        boxShadow: `0 12px 32px ${alpha(theme.palette.common.black, 0.12)}`,
      }}
    >
      <Toolbar sx={{ py: 1.5 }}>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{ flexGrow: 1, textDecoration: "none", fontWeight: 700, color: "inherit" }}
        >
          Schedulaa
        </Typography>

        {renderDesktopLinks()}

        <IconButton
          sx={{ display: { xs: "flex", md: "none" } }}
          onClick={toggleMobile}
          aria-label="Toggle navigation"
        >
          <MenuIcon />
        </IconButton>
      </Toolbar>
      {renderMobileDrawer()}
    </AppBar>
  );
};

export default MainNav;
