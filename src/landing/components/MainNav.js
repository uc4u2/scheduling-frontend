import React, { useMemo, useRef, useState } from "react";
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
  Popover,
  Grid,
  useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import GroupsIcon from "@mui/icons-material/Groups";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import LanguageIcon from "@mui/icons-material/Language";
import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import BusinessIcon from "@mui/icons-material/Business";
import BoltIcon from "@mui/icons-material/Bolt";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AssessmentIcon from "@mui/icons-material/Assessment";
import CampaignIcon from "@mui/icons-material/Campaign";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme, alpha } from "@mui/material/styles";
import LanguageSelector from "../../components/LanguageSelector";
import LogoImage from "../../logo/logo.png";
import { buildMarketingUrl } from "../../config/origins";

const productLeftLinks = [
  { label: "Features", href: buildMarketingUrl("/en/features"), desc: "See everything included", icon: <AutoAwesomeIcon fontSize="small" /> },
  { label: "Workforce", href: buildMarketingUrl("/en/workforce"), desc: "Staff, scheduling, availability", icon: <GroupsIcon fontSize="small" /> },
  { label: "Booking", href: buildMarketingUrl("/en/booking"), desc: "Online booking flows & calendars", icon: <EventAvailableIcon fontSize="small" /> },
  { label: "Marketing", href: buildMarketingUrl("/en/marketing"), desc: "Campaigns, analytics, clients", icon: <CampaignIcon fontSize="small" /> },
  { label: "Payroll", href: buildMarketingUrl("/en/payroll"), desc: "Exports & payroll workflows", icon: <PaymentsOutlinedIcon fontSize="small" /> },
  { label: "Website Builder", href: buildMarketingUrl("/en/website-builder"), desc: "Branded site + custom domain", icon: <LanguageIcon fontSize="small" /> },
];

const productRightLinks = [
  { label: "Industries", href: buildMarketingUrl("/en/industries"), icon: <BusinessIcon fontSize="small" /> },
  { label: "Status", href: buildMarketingUrl("/en/status"), icon: <SignalCellularAltIcon fontSize="small" /> },
  { label: "Roadmap", href: "mailto:admin@schedulaa.com", icon: <MailOutlineIcon fontSize="small" /> },
];

const resourceLeftLinks = [
  { label: "Blog", href: buildMarketingUrl("/en/blog"), desc: "Updates and guides", icon: <ArticleOutlinedIcon fontSize="small" /> },
  { label: "Demo / Test Drive", href: buildMarketingUrl("/en/demo"), desc: "Try the product quickly", icon: <PlayCircleOutlineIcon fontSize="small" /> },
  { label: "FAQ", href: buildMarketingUrl("/en/faq"), desc: "Common questions", icon: <HelpOutlineIcon fontSize="small" /> },
  { label: "Help Center", href: buildMarketingUrl("/en/client/support"), desc: "Support for clients & teams", icon: <SupportAgentIcon fontSize="small" /> },
  { label: "Documentation", href: buildMarketingUrl("/en/docs"), desc: "Developer & product docs", icon: <DescriptionOutlinedIcon fontSize="small" /> },
];

const resourceRightLinks = [
  { label: "Zapier automation", href: buildMarketingUrl("/en/zapier"), icon: <BoltIcon fontSize="small" /> },
  { label: "QuickBooks onboarding", href: buildMarketingUrl("/en/docs?topic=quickbooks-onboarding"), icon: <AccountBalanceIcon fontSize="small" /> },
  { label: "Xero onboarding", href: buildMarketingUrl("/en/docs?topic=xero-onboarding"), icon: <AssessmentIcon fontSize="small" /> },
];

const loggedInLinks = [
  { label: "Employee Dashboard", to: "/employee?tab=availability", icon: <DashboardIcon fontSize="small" /> },
  { label: "Manager Dashboard", to: "/manager/dashboard", icon: <WorkspacesIcon fontSize="small" /> },
];

const loggedOutLinks = [
  { label: "Login", to: "/login" },
];

const MainNav = ({ token, setToken }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const isAuthenticated = Boolean(token);
  const isManagerArea = location.pathname.startsWith("/manager");
  const isEmployeeArea = location.pathname.startsWith("/employee");
  const isRecruiterArea = location.pathname.startsWith("/recruiter");
  const showOpsNav = isAuthenticated && (isManagerArea || isEmployeeArea || isRecruiterArea);
  const [productAnchor, setProductAnchor] = useState(null);
  const [resourcesAnchor, setResourcesAnchor] = useState(null);
  const [opsAnchor, setOpsAnchor] = useState(null);
  const productPaperRef = useRef(null);
  const resourcesPaperRef = useRef(null);

  const productOpen = Boolean(productAnchor);
  const resourcesOpen = Boolean(resourcesAnchor);
  const opsOpen = Boolean(opsAnchor);

  const openProductMenu = (event) => {
    if (productAnchor === event.currentTarget) return;
    setProductAnchor(event.currentTarget);
  };
  const openResourcesMenu = (event) => {
    if (resourcesAnchor === event.currentTarget) return;
    setResourcesAnchor(event.currentTarget);
  };
  const openOpsMenu = (event) => setOpsAnchor(event.currentTarget);

  const closeProductMenu = () => setProductAnchor(null);
  const closeResourcesMenu = () => setResourcesAnchor(null);
  const closeOpsMenu = () => setOpsAnchor(null);
  const toggleProductMenu = (event) => {
    if (productOpen) {
      closeProductMenu();
      return;
    }
    openProductMenu(event);
  };
  const toggleResourcesMenu = (event) => {
    if (resourcesOpen) {
      closeResourcesMenu();
      return;
    }
    openResourcesMenu(event);
  };

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

  const opsLinks = useMemo(() => ([
    { label: "Settings", to: "/manager/dashboard?view=settings", view: "settings" },
    { label: "Billing & Subscription", to: "/manager/dashboard?view=settings&tab=billing", view: "settings", tab: "billing" },
    { label: "Stripe Hub", to: "/manager/dashboard?view=settings&tab=stripe-hub", view: "settings", tab: "stripe-hub" },
    { label: "Checkout Pro & Payments", to: "/manager/dashboard?view=settings&tab=checkout", view: "settings", tab: "checkout" },
  ]), []);

  const isOpsActive = (link) => {
    if (!link) return false;
    if (location.pathname !== "/manager/dashboard") return false;
    const params = new URLSearchParams(location.search);
    const view = params.get("view");
    const tab = params.get("tab");
    if (view !== link.view) return false;
    if (!link.tab) return true;
    const normalizedTab = (tab || "").toLowerCase();
    if (link.tab === "billing") {
      return ["billing", "billing-subscription", "subscription"].includes(normalizedTab);
    }
    if (link.tab === "stripe-hub") {
      return ["stripe-hub", "stripe", "stripehub"].includes(normalizedTab);
    }
    if (link.tab === "checkout") {
      return ["checkout", "checkout-pro", "checkout-pro-payments", "payments"].includes(normalizedTab);
    }
    return normalizedTab === link.tab;
  };

  const opsButtonSx = (active) => ({
    textTransform: "none",
    fontWeight: active ? 700 : 600,
    borderRadius: 999,
    px: 2,
    minHeight: 38,
    border: "1px solid",
    borderColor: alpha(theme.palette.primary.main, active ? 0.4 : 0.0),
    backgroundColor: active
      ? alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.26 : 0.12)
      : "transparent",
    color: active ? theme.palette.primary.main : theme.palette.text.primary,
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.22 : 0.08),
    },
  });

  const marketingButtonSx = (active) => ({
    textTransform: "none",
    fontWeight: active ? 700 : 600,
    fontSize: 14,
    height: 40,
    borderRadius: 2,
    px: 2,
    minHeight: 40,
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
    display: "inline-flex",
    alignItems: "center",
    textDecoration: "none",
    position: "relative",
    height: "100%",
    pointerEvents: "all",
  };
  const logoImageSx = {
    height: { xs: 44, md: 56 },
    width: "auto",
    transform: { xs: "translateY(-8px)", md: "translateY(-10px)" },
    filter: theme.palette.mode === "dark"
      ? "drop-shadow(0 8px 12px rgba(0,0,0,0.45))"
      : "drop-shadow(0 6px 12px rgba(0,0,0,0.18))",
  };

  const megaPaperSx = {
    mt: 0.75,
    borderRadius: 4,
    border: `1px solid ${alpha(theme.palette.divider, 0.35)}`,
    boxShadow: `0 24px 60px ${alpha(theme.palette.common.black, 0.18)}`,
    width: "min(760px, calc(100vw - 48px))",
    maxHeight: "min(520px, calc(100vh - 140px))",
    overflow: "hidden",
    backgroundColor: theme.palette.background.paper,
  };

  const iconTileSx = {
    width: 44,
    height: 44,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.18 : 0.08),
    color: theme.palette.primary.main,
    flexShrink: 0,
  };

  const richRowSx = {
    py: 1,
    px: 1,
    borderRadius: 10,
    alignItems: "center",
    textAlign: "left",
    width: "100%",
    justifyContent: "flex-start",
    gap: 1.5,
    "&:hover": {
      backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.2 : 0.08),
    },
  };

  const simpleRowSx = {
    justifyContent: "flex-start",
    textTransform: "none",
    borderRadius: 10,
    py: 1,
    px: 1,
    width: "100%",
    gap: 1,
    "&:hover": {
      backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.2 : 0.08),
    },
  };

  const rightIconSx = {
    width: 28,
    height: 28,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.14 : 0.06),
    color: theme.palette.primary.main,
    flexShrink: 0,
  };

  const MegaMenuPopover = ({ open, anchorEl, onClose, leftItems, rightItems, leftTitle, rightTitle, onMenuEnter, onMenuLeave, paperRef }) => {
    const renderRichItem = (link) => (
      <Button
        key={link.href}
        component="a"
        href={link.href}
        onClick={onClose}
        sx={richRowSx}
      >
        <Box sx={iconTileSx}>{link.icon || <SignalCellularAltIcon fontSize="small" />}</Box>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: 14 }}>
            {link.label}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: 12.5 }}>
            {link.desc}
          </Typography>
        </Box>
      </Button>
    );

    const renderSimpleItem = (link) => (
      <Button
        key={link.href}
        component="a"
        href={link.href}
        onClick={onClose}
        sx={simpleRowSx}
      >
        {link.icon && <Box sx={rightIconSx}>{link.icon}</Box>}
        <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
          {link.label}
        </Typography>
      </Button>
    );

    return (
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        PaperProps={{
          ref: paperRef,
          sx: megaPaperSx,
          onMouseEnter: onMenuEnter,
          onMouseLeave: onMenuLeave,
          onMouseMove: onMenuEnter,
        }}
        disableAutoFocus
        disableEnforceFocus
        disableRestoreFocus
      >
        <Box sx={{ p: 2, pt: 2.25, maxHeight: "min(520px, calc(100vh - 140px))", overflowY: "auto" }}>
          <Grid container spacing={0}>
            <Grid item xs={12} md={6} sx={{ pr: 2 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: "text.secondary", mb: 1 }}>
                {leftTitle}
              </Typography>
              <Stack spacing={1}>
                {leftItems.map(renderRichItem)}
              </Stack>
            </Grid>
            <Grid item xs={12} md={6} sx={{ pl: 2, borderLeft: `1px solid ${alpha(theme.palette.divider, 0.35)}`, borderRadius: 0 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: "text.secondary", mb: 1 }}>
                {rightTitle}
              </Typography>
              <Stack spacing={0.5}>
                {rightItems.map(renderSimpleItem)}
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Popover>
    );
  };

  const renderLoggedOutCenter = () => (
    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ display: { xs: "none", md: "flex" } }}>
      <Button
        onClick={toggleProductMenu}
        startIcon={<AutoAwesomeIcon fontSize="small" />}
        endIcon={<ExpandMoreIcon fontSize="small" />}
        sx={marketingButtonSx(productOpen)}
      >
        {t("landing.nav.product")}
      </Button>
      <MegaMenuPopover
        open={productOpen}
        anchorEl={productAnchor}
        onClose={closeProductMenu}
        onMenuEnter={undefined}
        onMenuLeave={undefined}
        paperRef={productPaperRef}
        leftItems={productLeftLinks}
        rightItems={productRightLinks}
        leftTitle={t("landing.nav.product")}
        rightTitle="Platform"
      />

      <Button
        onClick={toggleResourcesMenu}
        startIcon={<MenuBookIcon fontSize="small" />}
        endIcon={<ExpandMoreIcon fontSize="small" />}
        sx={marketingButtonSx(resourcesOpen)}
      >
        {t("landing.nav.resources")}
      </Button>
      <MegaMenuPopover
        open={resourcesOpen}
        anchorEl={resourcesAnchor}
        onClose={closeResourcesMenu}
        onMenuEnter={undefined}
        onMenuLeave={undefined}
        paperRef={resourcesPaperRef}
        leftItems={resourceLeftLinks}
        rightItems={resourceRightLinks}
        leftTitle={t("landing.nav.resources")}
        rightTitle="Integrations"
      />

      <Button
        component="a"
        href={buildMarketingUrl("/en/pricing")}
        startIcon={<MonetizationOnIcon fontSize="small" />}
        sx={marketingButtonSx(false)}
      >
        {t("landing.nav.pricing")}
      </Button>
    </Stack>
  );

  const renderLoggedInCenter = () => (
    <>
      {!isMobile && (
        <Stack
          direction="row"
          spacing={0.75}
          alignItems="center"
          sx={{
            display: { xs: "none", md: "flex" },
            border: `1px solid ${alpha(theme.palette.divider, 0.55)}`,
            borderRadius: 999,
            backgroundColor: alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.35 : 0.7),
            p: 0.5,
          }}
        >
          {opsLinks.map((link) => {
            const active = isOpsActive(link);
            return (
              <Button
                key={link.to}
                component={Link}
                to={link.to}
                sx={opsButtonSx(active)}
              >
                {link.label}
              </Button>
            );
          })}
        </Stack>
      )}
    </>
  );

  const renderRightControls = () => (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ display: { xs: "none", md: "flex" } }}>
      {isAuthenticated && loggedInLinks.map((link) => (
        <Button
          key={link.to}
          component={Link}
          to={link.to}
          color="inherit"
          startIcon={link.icon}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          {link.label}
        </Button>
      ))}
      <LanguageSelector size="small" />
      {!isAuthenticated && (
        <Button component={Link} to="/login" sx={{ textTransform: "none", fontWeight: 600 }}>
          Login
        </Button>
      )}
      {!isAuthenticated && (
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
      {isAuthenticated && (
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
    const productMobileLinks = [...productLeftLinks, ...productRightLinks];
    const resourceMobileLinks = [...resourceLeftLinks, ...resourceRightLinks];
    const mobileLinks = showOpsNav
      ? opsLinks
      : [
          { label: t("landing.nav.product"), header: true },
          ...productMobileLinks,
          { label: t("landing.nav.resources"), header: true },
          ...resourceMobileLinks,
          { label: t("landing.nav.pricing"), href: buildMarketingUrl("/en/pricing") },
          ...loggedOutLinks,
        ];

    return (
      <Drawer anchor="right" open={mobileOpen} onClose={toggleMobile}>
        <Box sx={{ width: 280, p: 2, height: "100%", display: "flex", flexDirection: "column", gap: 2 }} role="presentation">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" component="a" href={buildMarketingUrl("/en")} sx={{ textDecoration: "none", color: "inherit" }} onClick={toggleMobile}>
              Schedulaa
            </Typography>
            <IconButton onClick={toggleMobile}>
              <CloseIcon />
            </IconButton>
          </Box>
          <List sx={{ flex: 1 }}>
            {mobileLinks.map((link) => {
              if (link.header) {
                return (
                  <ListItemText
                    key={link.label}
                    primary={link.label}
                    primaryTypographyProps={{ sx: { fontWeight: 700, mt: 1 } }}
                  />
                );
              }
              return (
                <ListItemButton
                  key={link.to || link.href}
                  component={link.to ? Link : "a"}
                  to={link.to}
                  href={link.href}
                  onClick={toggleMobile}
                  selected={link.to ? isActive(link.to) : false}
                >
                  <ListItemText primary={link.label} />
                </ListItemButton>
              );
            })}
          </List>
          <Box display="flex" flexDirection="column" gap={1}>
            <Box sx={{ alignSelf: "flex-start" }}>
              <LanguageSelector size="small" />
            </Box>
            {!isAuthenticated ? (
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
              </>
            ) : (
              <>
                {loggedInLinks.map((link) => (
                  <Button
                    key={link.to}
                    fullWidth
                    component={Link}
                    to={link.to}
                    onClick={toggleMobile}
                    sx={{ textTransform: "none", borderRadius: 999 }}
                  >
                    {link.label}
                  </Button>
                ))}
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
              </>
            )}
          </Box>
        </Box>
      </Drawer>
    );
  };

  return (
    <AppBar
      position="sticky"
      top={0}
      color="transparent"
      elevation={0}
      sx={{
        backgroundColor: chromeBg,
        borderBottom: `1px solid ${borderColor}`,
        boxShadow: theme.shadows[1],
        backdropFilter: "blur(12px)",
        overflow: "visible",
        borderRadius: 0,
        mb: 0,
      }}
    >
      <Toolbar sx={{ gap: 1, alignItems: "center", overflow: "visible", py: 0, minHeight: 56 }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Box
            component="a"
            href={buildMarketingUrl("/en")}
            sx={logoLinkSx}
          >
            <Box
              component="img"
              src={LogoImage}
              alt="Schedulaa"
              sx={logoImageSx}
            />
          </Box>
        </Box>

        <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
          {showOpsNav ? renderLoggedInCenter() : renderLoggedOutCenter()}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
          {renderRightControls()}
        </Box>

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
