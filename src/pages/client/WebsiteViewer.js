// src/pages/client/WebsiteViewer.js
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Alert,
  AppBar,
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  Toolbar,
  Typography,
  Paper,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { wb } from "../../utils/api";
import { RenderSections } from "../../components/website/RenderSections";
import ThemeRuntimeProvider from "../../components/website/ThemeRuntimeProvider";
import PublicClientAuth from "./PublicClientAuth";
import PublicMyBookings from "./PublicMyBookings";
import { resolveSiteHref, transformLinksDeep } from "../../components/website/linking";
import {
  normalizeNavStyle,
  navStyleToCssVars,
  createNavButtonStyles,
} from "../../utils/navStyle";

const rewriteAnchorsHTML = (html, resolver) => {
  if (!html || typeof html !== "string") return html;
  try {
    return html.replace(/href="([^"]+)"/g, (_, href) => `href="${resolver(href)}"`);
  } catch {
    return html;
  }
};

export default function WebsiteViewer() {
  const { slug, pageSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [site, setSite] = useState(null);
  const [error, setError] = useState("");

  const go = (to) =>
    navigate(
      typeof to === "string"
        ? { pathname: to, search: location.search }
        : { ...to, search: location.search }
    );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await wb.publicBySlug(slug);
        if (!alive) return;
        setSite(data);
      } catch {
        if (!alive) return;
        setSite(null);
        setError("Failed to load website.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  const pages = useMemo(() => {
    const arr = Array.isArray(site?.pages) ? site.pages : [];
    return arr
      .filter((p) => p.published !== false)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [site]);

  const activePage = useMemo(() => {
    if (!pages.length) return null;
    if (pageSlug) return pages.find((p) => p.slug === pageSlug) || pages[0];
    const home =
      pages.find((p) => p.is_homepage) ||
      pages.find((p) => (p.slug || "").toLowerCase() === "home");
    return home || pages[0];
  }, [pages, pageSlug]);

  const pageLayout = useMemo(
    () => activePage?.layout ?? activePage?.content?.meta?.layout ?? "boxed",
    [activePage]
  );

  useEffect(() => {
    if (!activePage) return;
    if (activePage.slug === "login") {
      navigate("/login", { replace: true });
    } else if (activePage.slug === "my-bookings") {
      navigate(`/dashboard?site=${encodeURIComponent(slug)}`, { replace: true });
    }
  }, [activePage, navigate, slug]);

  useEffect(() => {
    if (!activePage) return;
    const siteTitle =
      site?.title || site?.name || site?.company_name || slug || "Site";
    const pageTitle =
      activePage?.title || activePage?.menu_title || activePage?.slug || "Page";
    document.title = `${pageTitle} — ${siteTitle}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activePage, site, slug]);

  const navStyleTokens = useMemo(() => {
    const source =
      site?.nav_style ||
      site?.settings?.nav_style ||
      site?.website_setting?.settings?.nav_style ||
      {};
    return normalizeNavStyle(source);
  }, [site]);

  const navCssVars = useMemo(
    () => ({
      "--sched-primary": theme.palette.primary.main,
      "--sched-text": theme.palette.text.primary,
      ...navStyleToCssVars(navStyleTokens),
    }),
    [navStyleTokens, theme]
  );

  const navButtonSx = useMemo(
    () => createNavButtonStyles(navStyleTokens),
    [navStyleTokens]
  );

  const navItems = useMemo(() => {
    const slugLower = String(activePage?.slug || "").toLowerCase();
    return pages
      .filter((p) => p.show_in_menu !== false)
      .map((p) => ({
        key: p.slug,
        label: p.menu_title || p.title || p.slug,
        to: `/${slug}/site/${p.slug}`,
        active: String(p.slug || "").toLowerCase() === slugLower,
      }));
  }, [pages, slug, activePage]);

  const sectionsPatched = useMemo(() => {
    const secs = activePage?.content?.sections || [];
    const resolver = (href) => resolveSiteHref(slug, href, pages);
    return secs.map((s) => {
      if (!s?.props) return s;
      let nextProps = transformLinksDeep(s.props, resolver);
      if (s.type === "richText" && typeof nextProps.body === "string") {
        nextProps = { ...nextProps, body: rewriteAnchorsHTML(nextProps.body, resolver) };
      }
      return { ...s, props: nextProps };
    });
  }, [activePage, slug, pages]);

  const themeOverrides = site?.theme_overrides || {};

  if (loading) {
    return (
      <Box mt={8} textAlign="center" role="alert" aria-busy="true">
        <CircularProgress />
        <Typography mt={2}>Loading website…</Typography>
      </Box>
    );
  }

  if (error || !site) {
    return (
      <Box mt={8} textAlign="center" role="alert">
        <Alert severity="error">{error || "Website not found."}</Alert>
        <Button sx={{ mt: 2 }} onClick={() => go(`/${slug}`)}>
          Back to company
        </Button>
      </Box>
    );
  }

  if (activePage?.slug === "login") {
    return <PublicClientAuth slug={slug} />;
  }
  if (activePage?.slug === "my-bookings") {
    return <PublicMyBookings slug={slug} />;
  }

  return (
    <ThemeRuntimeProvider overrides={themeOverrides}>
      <AppBar
        position="sticky"
        color="default"
        elevation={0}
        sx={{ borderBottom: (t) => `1px solid ${t.palette.divider}` }}
      >
        <Toolbar>
          <Container maxWidth="lg" sx={{ display: "flex", alignItems: "center" }}>
            <Typography
              variant="h6"
              noWrap
              sx={{ fontWeight: 800, letterSpacing: "-0.01em" }}
              title={site?.title || site?.name || slug}
            >
              {site?.title || site?.name || slug}
            </Typography>
          </Container>
        </Toolbar>

        {navItems.length > 0 && (
          <Container
            maxWidth="lg"
            sx={{
              px: 2,
              pb: 1.5,
              "--sched-primary": theme.palette.primary.main,
              "--sched-text": theme.palette.text.primary,
              ...navCssVars,
            }}
          >
            <Stack
              direction="row"
              spacing={0}
              sx={{
                gap: `${navStyleTokens.item_spacing}px`,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {navItems.map((item) => (
                <Button
                  key={item.key}
                  variant="text"
                  color="inherit"
                  disableElevation
                  sx={navButtonSx(item.active)}
                  onClick={() => go(item.to)}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>
          </Container>
        )}
      </AppBar>

      {sectionsPatched.length ? (
        <RenderSections sections={sectionsPatched} layout={pageLayout} />
      ) : (
        <Container maxWidth="lg" sx={{ my: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight={700}>
              {activePage?.title || "Page"}
            </Typography>
            <Typography sx={{ mt: 1.5 }} color="text.secondary">
              This page doesn’t have any content yet.
            </Typography>
          </Paper>
        </Container>
      )}
    </ThemeRuntimeProvider>
  );
}
