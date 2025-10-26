import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AppBar, Toolbar, Button, Container, Box, Typography, Stack, CircularProgress, IconButton
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { alpha, useTheme } from "@mui/material/styles";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import ThemeRuntimeProvider from "./ThemeRuntimeProvider"; // you already have this
// ^ this should apply site.theme_overrides into MUI theme

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function SiteFrame({ slug, activeKey, children }) {
  const theme = useTheme(); // will be overridden by ThemeRuntimeProvider below
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const nav = useMemo(() => site?.nav_overrides || {}, [site]);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // auth state for showing login / my bookings / logout
  const token = (typeof localStorage !== "undefined" && localStorage.getItem("token")) || "";
  const role  = (typeof localStorage !== "undefined" && localStorage.getItem("role")) || "";
  const clientLoggedIn = Boolean(token && role === "client");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr("");
    axios.get(`${API}/public/${encodeURIComponent(slug)}/site`)
      .then(({ data }) => !cancelled && setSite(data))
      .catch(() => !cancelled && setErr("Failed to load site"))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [slug]);

  const pages = useMemo(() => {
    const list = Array.isArray(site?.pages) ? site.pages : [];
    return list
      .filter(p => p.show_in_menu)
      .sort((a,b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [site]);

  // Helpers to build hrefs (match your previous logic)
  const servicesHref = () => `/${slug}/services`;
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

  const header = (
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
          <Button component={RouterLink} to={servicesHref()} color={pathname.includes("/services") ? "primary" : "inherit"}>
            {nav.services_tab_label || "Services"}
          </Button>
          <Button component={RouterLink} to={reviewsHref()} color={pathname.includes("/reviews") ? "primary" : "inherit"}>
            {nav.reviews_tab_label || "Reviews"}
          </Button>

          {/* auth-aware */}
          {clientLoggedIn ? (
            <>
              <Button component={RouterLink} to={myBookingsHref()} color={pathname.startsWith("/dashboard") ? "primary" : "inherit"}>
                {nav.mybookings_tab_label || "My Bookings"}
              </Button>
              <Button onClick={doLogout} color="inherit">
                {nav.logout_tab_label || "Log out"}
              </Button>
            </>
          ) : (
            <Button component={RouterLink} to={loginHref()} color={pathname === "/login" ? "primary" : "inherit"}>
              {nav.login_tab_label || "Login"}
            </Button>
          )}
        </Stack>

        <Box sx={{ ml: "auto" }} />
      </Toolbar>
    </AppBar>
  );

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

  return (
    <ThemeRuntimeProvider themeOverrides={site?.theme_overrides || {}}>
      {header}
      <Container sx={{ py: { xs: 3, md: 5 } }}>
        {children}
      </Container>
    </ThemeRuntimeProvider>
  );
}
