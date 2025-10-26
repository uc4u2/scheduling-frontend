// src/NavBar.js
import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Button,
  Typography,
  Box,
  Stack,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ContactSupportIcon from "@mui/icons-material/ContactSupport";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonIcon from "@mui/icons-material/Person";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import LogoutIcon from "@mui/icons-material/Logout";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme, alpha } from "@mui/material/styles";
import LanguageSelector from "./components/LanguageSelector";
import LogoImage from "./logo/logo.png";

const marketingLinks = [
  { label: "Features", to: "/features", icon: <AutoAwesomeIcon fontSize="small" /> },
  { label: "Docs", to: "/docs", icon: <MenuBookIcon fontSize="small" /> },
  { label: "Pricing", to: "/pricing", icon: <MonetizationOnIcon fontSize="small" /> },
  { label: "About", to: "/about", icon: <InfoOutlinedIcon fontSize="small" /> },
  { label: "Contact", to: "/contact", icon: <ContactSupportIcon fontSize="small" /> },
];

const authenticatedLinks = [
  { label: "Employee Dashboard", translationKey: "nav.recruiterDashboard", to: "/recruiter?tab=calendar", icon: <DashboardIcon fontSize="small" /> },
  { label: "Management Dashboard", translationKey: "nav.managerDashboard", to: "/manager/dashboard", icon: <WorkspacesIcon fontSize="small" /> },
  { label: "Candidate Profile", translationKey: "nav.candidateProfile", to: "/client/profile", icon: <PersonIcon fontSize="small" /> },
];

const guestLinks = [
  { label: "Login", translationKey: "nav.login", to: "/login" },
  { label: "Register", translationKey: "nav.register", to: "/register" },
  { label: "Forgot Password", translationKey: "nav.forgotPassword", to: "/forgot-password" },
];

const NavBar = ({ token, setToken }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLoggedIn = Boolean(token);
  const translateNav = (key, fallback) => {
    if (!key) return fallback;
    const value = t(key);
    if (value && value !== key) {
      return value;
    }
    if (fallback) {
      return fallback;
    }
    const normalized = key.replace(/^nav\./, "").replace(/\./g, " ");
    return normalized
      .replace(/([A-Z])/g, " $1")
      .replace(/\s+/g, " ")
      .trim();
  };


  const handleLogout = () => {
    localStorage.removeItem("token");
    if (typeof setToken === "function") {
      setToken("");
    }
    navigate("/");
    setMobileOpen(false);
  };

  const toggleMobile = () => setMobileOpen((prev) => !prev);

  const isActive = (to) => {
    if (!to) return false;
    if (to.includes("#")) {
      const [path] = to.split("#");
      return location.pathname === path;
    }
    return location.pathname === to;
  };

  const marketingButtonSx = (active) => ({
    textTransform: "none",
    fontWeight: active ? 700 : 600,
    borderRadius: 999,
    px: 2,
    border: "1px solid",
    borderColor: active
      ? alpha(theme.palette.primary.main, 0.45)
      : alpha(theme.palette.text.primary, 0.2),
    backgroundColor: active
      ? alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.32 : 0.14)
      : "transparent",
    color: active ? theme.palette.primary.main : theme.palette.text.primary,
    transition: "all 0.2s ease",
    "&:hover": {
      borderColor: alpha(theme.palette.primary.main, 0.4),
      backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.28 : 0.12),
    },
  });

  const chromeBg = alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.9 : 0.93);
  const borderColor = alpha(theme.palette.divider, theme.palette.mode === "dark" ? 0.45 : 0.3);
  const logoLinkSx = {
    flexGrow: 1,
    display: "inline-flex",
    alignItems: "center",
    textDecoration: "none",
    position: "relative",
    height: "100%",
    pointerEvents: "all",
  };

  const logoImageSx = {
    height: { xs: 56, md: 72 },
    width: "auto",
    transform: { xs: "translateY(-12px)", md: "translateY(-16px)" },
    filter: theme.palette.mode === "dark" ? "drop-shadow(0 8px 12px rgba(0,0,0,0.45))" : "drop-shadow(0 6px 12px rgba(0,0,0,0.18))",
  };

  const logoDrawerImageSx = {
    height: 48,
    width: "auto",
  };

  const renderMarketingLinks = () => (
    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ display: { xs: "none", md: "flex" } }}>
      {marketingLinks.map((link) => {
        const active = isActive(link.to);
        return (
          <Button
            key={link.to}
            component={Link}
            to={link.to}
            startIcon={link.icon}
            sx={marketingButtonSx(active)}
          >
            {link.label}
          </Button>
        );
      })}
    </Stack>
  );

  const renderAuthLinks = () => (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ display: { xs: "none", md: "flex" } }}>
      {authenticatedLinks.map((link) => {
        const label = translateNav(link.translationKey, link.label);
        return (
          <Button
            key={link.to}
            component={Link}
            to={link.to}
            color="inherit"
            startIcon={link.icon}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            {label || link.label}
          </Button>
        );
      })}
      <Button
        color="inherit"
        onClick={handleLogout}
        startIcon={<LogoutIcon fontSize="small" />}
        sx={{ textTransform: "none", fontWeight: 600 }}
      >
        {translateNav("nav.logout", "Logout")}
      </Button>
    </Stack>
  );

  const renderGuestLinks = () => (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ display: { xs: "none", md: "flex" } }}>
      {guestLinks.map((link) => {
        const label = translateNav(link.translationKey, link.label);
        return (
          <Button
            key={link.to}
            component={Link}
            to={link.to}
            color="inherit"
            sx={{ textTransform: "none" }}
          >
            {label || link.label}
          </Button>
        );
      })}
    </Stack>
  );

  const renderMobileDrawer = () => {
    const appLinks = isLoggedIn ? authenticatedLinks : guestLinks;

    return (
      <Drawer anchor="right" open={mobileOpen} onClose={toggleMobile}>
        <Box sx={{ width: 290, p: 2, height: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box
              component={Link}
              to="/"
              onClick={toggleMobile}
              sx={{ display: "inline-flex", alignItems: "center" }}
            >
              <Box component="img" src={LogoImage} alt="Schedulaa" sx={logoDrawerImageSx} />
            </Box>
            <IconButton onClick={toggleMobile}>
              <CloseIcon />
            </IconButton>
          </Box>

          <List sx={{ flex: 1 }}>
            {marketingLinks.map((link) => (
              <ListItemButton
                key={link.to}
                component={Link}
                to={link.to}
                selected={isActive(link.to)}
                onClick={toggleMobile}
              >
                <ListItemIcon>{link.icon}</ListItemIcon>
                <ListItemText primary={link.label} />
              </ListItemButton>
            ))}

            <Divider sx={{ my: 1.5 }} />

            {appLinks.map((link) => {
              const label = translateNav(link.translationKey, link.label);
              return (
                <ListItemButton
                  key={link.to}
                  component={Link}
                  to={link.to}
                  onClick={toggleMobile}
                >
                  {link.icon && <ListItemIcon>{link.icon}</ListItemIcon>}
                  <ListItemText primary={label || link.label} />
                </ListItemButton>
              );
            })}

            {isLoggedIn && (
              <ListItemButton onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={translateNav("nav.logout", "Logout")} />
              </ListItemButton>
            )}
          </List>

          {!isLoggedIn && (
            <Stack spacing={1}>
              <Button component={Link} to="/register" variant="contained" color="primary" onClick={toggleMobile} sx={{ textTransform: "none", borderRadius: 999 }}>
                {translateNav("nav.startFreeTrial", "Start Free Trial")}
              </Button>
              <Button component={Link} to="/contact" variant="outlined" color="primary" onClick={toggleMobile} sx={{ textTransform: "none", borderRadius: 999 }}>
                {translateNav("nav.talkToSales", "Talk to Sales")}
              </Button>
            </Stack>
          )}
        </Box>
      </Drawer>
    );
  };

  return (
    <AppBar
      position="static"
      color="transparent"
      elevation={0}
      sx={{
        backgroundColor: chromeBg,
        borderBottom: `1px solid ${borderColor}`,
        boxShadow: theme.shadows[2],
        backdropFilter: "blur(12px)",
        overflow: "visible",
      }}
    >
      <Toolbar sx={{ gap: 1, alignItems: "center", overflow: "visible" }}>
        <Box component={Link} to="/" sx={logoLinkSx}>
          <Box component="img" src={LogoImage} alt="Schedulaa" sx={logoImageSx} />
        </Box>

        <Button color="inherit" component={Link} to="/" sx={{ textTransform: "none", fontWeight: 600 }}>
          {translateNav("nav.home", "Home")}
        </Button>

        {renderMarketingLinks()}

        {isLoggedIn ? renderAuthLinks() : renderGuestLinks()}

        {!isLoggedIn && (
          <Stack direction="row" spacing={1} sx={{ display: { xs: "none", md: "flex" }, ml: 2 }}>
            <Button component={Link} to="/register" variant="contained" color="primary" sx={{ textTransform: "none", borderRadius: 999 }}>
              {translateNav("nav.startFreeTrial", "Start Free Trial")}
            </Button>
            <Button component={Link} to="/contact" variant="outlined" color="primary" sx={{ textTransform: "none", borderRadius: 999 }}>
              {translateNav("nav.talkToSales", "Talk to Sales")}
            </Button>
          </Stack>
        )}

        <Box sx={{ ml: 2, display: { xs: "none", md: "block" } }}>
          <LanguageSelector size="small" />
        </Box>

        <IconButton sx={{ display: { xs: "inline-flex", md: "none" }, ml: 1 }} onClick={toggleMobile} aria-label="Toggle navigation">
          <MenuIcon />
        </IconButton>
      </Toolbar>
      {renderMobileDrawer()}
    </AppBar>
  );
};

export default NavBar;

