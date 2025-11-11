import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AppBar,
  Toolbar,
  Button,
  Container,
  Box,
  Typography,
  Stack,
  CircularProgress,
  IconButton,
  Divider,
  Grid,
  Link as MuiLink,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookIcon from "@mui/icons-material/Facebook";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import YouTubeIcon from "@mui/icons-material/YouTube";
import TwitterIcon from "@mui/icons-material/Twitter";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import AllInclusiveIcon from "@mui/icons-material/AllInclusive";
import PinterestIcon from "@mui/icons-material/Pinterest";
import LinkIcon from "@mui/icons-material/Link";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { alpha, useTheme } from "@mui/material/styles";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import ThemeRuntimeProvider from "./ThemeRuntimeProvider";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const SOCIAL_ICON_MAP = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  linkedin: LinkedInIcon,
  youtube: YouTubeIcon,
  twitter: TwitterIcon,
  x: TwitterIcon,
  tiktok: MusicNoteIcon,
  threads: AllInclusiveIcon,
  pinterest: PinterestIcon,
  whatsapp: WhatsAppIcon,
  snapchat: LinkIcon,
};

export default function SiteFrame({
  slug,
  activeKey,
  children,
  initialSite = null,
  disableFetch = false,
  wrapChildrenInContainer = true,
}) {
  const theme = useTheme(); // will be overridden by ThemeRuntimeProvider below
  const isPreview = disableFetch && Boolean(initialSite);
  const [site, setSite] = useState(initialSite);
  const [loading, setLoading] = useState(!initialSite && !disableFetch);
  const [err, setErr] = useState("");
  const nav = useMemo(() => site?.nav_overrides || {}, [site]);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const headerConfig = useMemo(
    () => site?.header || site?.settings?.header || null,
    [site]
  );
  const footerConfig = useMemo(
    () => site?.footer || site?.settings?.footer || null,
    [site]
  );

  // auth state for showing login / my bookings / logout
  const token = (typeof localStorage !== "undefined" && localStorage.getItem("token")) || "";
  const role  = (typeof localStorage !== "undefined" && localStorage.getItem("role")) || "";
  const clientLoggedIn = Boolean(token && role === "client");

  useEffect(() => {
    if (initialSite) {
      setSite(initialSite);
      setLoading(false);
      setErr("");
      return;
    }
    if (disableFetch) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setErr("");
    axios
      .get(`${API}/public/${encodeURIComponent(slug)}/site`)
      .then(({ data }) => !cancelled && setSite(data))
      .catch(() => !cancelled && setErr("Failed to load site"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [slug, initialSite, disableFetch]);

  const pages = useMemo(() => {
    const list = Array.isArray(site?.pages) ? site.pages : [];
    return list
      .filter(p => p.show_in_menu)
      .sort((a,b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [site]);

  // Helpers to build hrefs (match your previous logic)
  const reviewsHref  = () => `/${slug}/reviews`;
  const loginHref    = () => `/login`;
  const myBookingsHref = () => `/dashboard`;

  const doLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
    } catch {}
    navigate("/login");
  };

  const resolveLinkProps = (href) => {
    const trimmed = (href || "").trim();
    if (!trimmed) {
      return { component: RouterLink, to: `/${slug}` };
    }
    if (/^https?:\/\//i.test(trimmed)) {
      return { component: "a", href: trimmed, target: "_blank", rel: "noreferrer noopener" };
    }
    if (trimmed.startsWith("/")) {
      return { component: RouterLink, to: trimmed };
    }
    if (trimmed.startsWith("?")) {
      return { component: RouterLink, to: `/${slug}${trimmed}` };
    }
    if (trimmed.startsWith("#")) {
      return { component: RouterLink, to: `/${slug}${trimmed}` };
    }
    return {
      component: RouterLink,
      to: `/${slug}?page=${encodeURIComponent(trimmed)}`,
    };
  };

  const defaultNavLinks = useMemo(
    () =>
      pages
        .filter((p) => !(p.slug === "login" && clientLoggedIn))
        .filter((p) => !(p.slug === "my-bookings" && !clientLoggedIn))
        .map((p) => ({
          label: p.menu_title || p.title || p.slug,
          href: `/${slug}?page=${encodeURIComponent(p.slug)}`,
        })),
    [pages, slug, clientLoggedIn]
  );

  const navLinks = useMemo(() => {
    const custom = Array.isArray(headerConfig?.nav_items)
      ? headerConfig.nav_items
      : [];
    return custom.length ? custom : defaultNavLinks;
  }, [headerConfig, defaultNavLinks]);

  const headerLogo =
    headerConfig?.logo_asset?.url || site?.company?.logo_url || null;
  const headerSocial = Array.isArray(headerConfig?.social_links)
    ? headerConfig.social_links
    : [];
  const brandName = headerConfig?.text || site?.company?.name || slug;

  const renderSessionButtons = (color = "inherit") =>
    clientLoggedIn ? (
      <>
        <Button
          component={RouterLink}
          to={myBookingsHref()}
          color={pathname.startsWith("/dashboard") ? "primary" : color}
        >
          {nav.mybookings_tab_label || "My Bookings"}
        </Button>
        <Button onClick={doLogout} color={color}>
          {nav.logout_tab_label || "Log out"}
        </Button>
      </>
    ) : (
      <Button
        component={RouterLink}
        to={loginHref()}
        color={pathname === "/login" ? "primary" : color}
      >
        {nav.login_tab_label || "Login"}
      </Button>
    );

  const defaultHeader = (
    <AppBar
      elevation={0}
      position="sticky"
      sx={{
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
      }}
    >
      <Toolbar sx={{ gap: 1 }}>
        <IconButton edge="start" sx={{ display: { xs: "inline-flex", md: "none" } }}>
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          component={RouterLink}
          to={`/${slug}`}
          sx={{
            textDecoration: "none",
            color: theme.palette.text.primary,
            fontWeight: 800,
            flexShrink: 0
          }}
        >
          {site?.company?.name || slug}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ ml: 2, display: { xs: "none", md: "flex" } }}>
          {/* site-defined pages */}
          {pages
            .filter(p => !(p.slug === "login" && clientLoggedIn))
            .filter(p => !(p.slug === "my-bookings" && !clientLoggedIn))
            .map((p) => {
              let href = `/${slug}?page=${encodeURIComponent(p.slug)}`;
              if (p.slug === "login") href = loginHref();
              if (p.slug === "my-bookings") href = myBookingsHref();
              const active = activeKey ? (activeKey === p.slug) : (pathname.includes(`/page/${p.slug}`));
              return (
                <Button
                  key={p.slug}
                  component={RouterLink}
                  to={href}
                  color={active ? "primary" : "inherit"}
                >
                  {p.menu_title || p.title || p.slug}
                </Button>
              );
            })}

          {/* fixed “extra” tabs that every site has */}
          <Button component={RouterLink} to={reviewsHref()} color={pathname.includes("/reviews") ? "primary" : "inherit"}>
            {nav.reviews_tab_label || "Reviews"}
          </Button>

          {/* auth-aware */}
          {renderSessionButtons("inherit")}
        </Stack>

        <Box sx={{ ml: "auto" }} />
      </Toolbar>
    </AppBar>
  );

  const headerHasContent = Boolean(
    headerConfig && (
      headerLogo ||
      headerConfig.text ||
      (Array.isArray(headerConfig?.nav_items) && headerConfig.nav_items.length) ||
      headerSocial.length
    )
  );

  const headerNode = headerConfig ? (
    <Box
      component="header"
      sx={{
        position: headerConfig.sticky === false ? "relative" : "sticky",
        top: 0,
        zIndex: 30,
        borderBottom: (theme) => `1px solid ${alpha(theme.palette.divider, 0.4)}`,
        backgroundColor: headerConfig.bg || theme.palette.background.paper,
        color: headerConfig.text || theme.palette.text.primary,
      }}
    >
      <Container sx={{ py: { xs: 1.5, md: 2 } }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={2}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            {headerLogo && (
              <Box
                component="img"
                src={headerLogo}
                alt={brandName}
                sx={{ height: 42, width: "auto" }}
              />
            )}
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {brandName}
            </Typography>
            {!headerHasContent && isPreview && (
              <Typography
                variant="caption"
                sx={{ ml: 1, opacity: 0.7, fontWeight: 500 }}
              >
                Add header text/logo in Branding → Header
              </Typography>
            )}
          </Stack>
          <Box sx={{ flexGrow: 1 }} />
          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            alignItems="center"
            justifyContent={
              headerConfig.layout === "center" ? "center" : "flex-end"
            }
          >
            {navLinks.map((item, idx) => {
              const props = resolveLinkProps(item.href);
              return (
                <Button
                  key={`${item.label}-${idx}`}
                  {...props}
                  color="inherit"
                  size="small"
                >
                  {item.label || "Link"}
                </Button>
              );
            })}
            <Button
              component={RouterLink}
              to={reviewsHref()}
              color={pathname.includes("/reviews") ? "primary" : "inherit"}
              size="small"
            >
              {nav.reviews_tab_label || "Reviews"}
            </Button>
            {renderSessionButtons("inherit")}
          </Stack>
          {headerSocial.length > 0 && (
            <Stack direction="row" spacing={0.5}>
              {headerSocial.map((item, idx) => {
                const Icon =
                  SOCIAL_ICON_MAP[item?.icon?.toLowerCase()] || LinkIcon;
                return (
                  <IconButton
                    key={`social-${idx}`}
                    component="a"
                    href={item?.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    size="small"
                  >
                    <Icon fontSize="small" />
                  </IconButton>
                );
              })}
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  ) : (
    defaultHeader
  );

  const footerLogo =
    footerConfig?.logo_asset?.url || site?.company?.logo_url || null;
  const footerColumns = Array.isArray(footerConfig?.columns)
    ? footerConfig.columns
    : [];
  const footerSocial = Array.isArray(footerConfig?.social_links)
    ? footerConfig.social_links
    : [];
  const footerLegal = Array.isArray(footerConfig?.legal_links)
    ? footerConfig.legal_links
    : [];
  const footerHasContent =
    footerConfig &&
    (footerConfig.text ||
      footerColumns.length ||
      footerSocial.length ||
      footerLegal.length);

  const footerNode = footerConfig ? (
    <Box
      component="footer"
      sx={{
        backgroundColor:
          footerConfig.bg || alpha(theme.palette.text.primary, 0.04),
        color: footerConfig.text ? "inherit" : theme.palette.text.primary,
        mt: 8,
      }}
    >
      <Container sx={{ py: 6 }}>
        {footerLogo && (
          <Box
            component="img"
            src={footerLogo}
            alt={site?.company?.name || slug}
            sx={{ height: 48, mb: 2 }}
          />
        )}
        {(footerConfig.text || (isPreview && !footerHasContent)) && (
          <Typography variant="body1" sx={{ mb: 3, maxWidth: 640 }}>
            {footerConfig.text || "Add footer copy in Branding → Footer"}
          </Typography>
        )}
        {footerColumns.length > 0 && (
          <Grid container spacing={4} sx={{ mb: 3 }}>
            {footerColumns.map((col, idx) => (
              <Grid item xs={12} md={Math.max(3, Math.floor(12 / footerColumns.length))} key={`footer-col-${idx}`}>
                {col.title && (
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                    {col.title}
                  </Typography>
                )}
                <Stack spacing={0.75}>
                  {(col.links || []).map((link, linkIdx) => {
                    const props = resolveLinkProps(link.href || "");
                    const { component, ...rest } = props;
                    return (
                      <MuiLink
                        key={`footer-col-${idx}-link-${linkIdx}`}
                        component={component || RouterLink}
                        {...rest}
                        color="inherit"
                        underline="hover"
                        sx={{ fontSize: "0.95rem" }}
                      >
                        {link.label || link.href}
                      </MuiLink>
                    );
                  })}
                </Stack>
              </Grid>
            ))}
          </Grid>
        )}
        {footerSocial.length > 0 && (
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            {footerSocial.map((item, idx) => {
              const Icon =
                SOCIAL_ICON_MAP[item?.icon?.toLowerCase()] || LinkIcon;
              return (
                <IconButton
                  key={`footer-social-${idx}`}
                  component="a"
                  href={item?.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  size="small"
                  sx={{
                    backgroundColor: alpha("#fff", 0.08),
                    color: "inherit",
                  }}
                >
                  <Icon fontSize="small" />
                </IconButton>
              );
            })}
          </Stack>
        )}
        {footerLegal.length > 0 && (
          <>
            <Divider sx={{ my: 3, opacity: 0.2 }} />
            <Stack
              direction="row"
              spacing={2}
              flexWrap="wrap"
              alignItems="center"
            >
              {footerLegal.map((link, idx) => {
                const props = resolveLinkProps(link.href || "");
                const { component, ...rest } = props;
                return (
                  <MuiLink
                    key={`footer-legal-${idx}`}
                    component={component || RouterLink}
                    {...rest}
                    color="inherit"
                    underline="hover"
                    sx={{ fontSize: "0.875rem" }}
                  >
                    {link.label || link.href}
                  </MuiLink>
                );
              })}
            </Stack>
          </>
        )}
      </Container>
    </Box>
  ) : null;

  if (loading) {
    return (
      <Box sx={{ mt: 8, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading theme…</Typography>
      </Box>
    );
  }
  if (err) {
    return (
      <Box sx={{ mt: 8, textAlign: "center" }}>
        <Typography color="error">{err}</Typography>
      </Box>
    );
  }
  if (!site) {
    return (
      <Box sx={{ mt: 8, textAlign: "center" }}>
        <Typography color="text.secondary">No site data.</Typography>
      </Box>
    );
  }

  return (
    <ThemeRuntimeProvider themeOverrides={site?.theme_overrides || {}}>
      {headerNode}
      {wrapChildrenInContainer ? (
        <Container sx={{ py: { xs: 3, md: 5 } }}>{children}</Container>
      ) : (
        children
      )}
      {footerNode}
    </ThemeRuntimeProvider>
  );
}
