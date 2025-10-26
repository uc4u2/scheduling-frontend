// src/pages/client/WebsiteViewer.js
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Tabs,
  Tab,
  Paper,
  AppBar,
  Toolbar,
  Stack,
} from "@mui/material";
import { wb } from "../../utils/api";
import { RenderSections } from "../../components/website/RenderSections";
import ThemeRuntimeProvider from "../../components/website/ThemeRuntimeProvider";
import PublicClientAuth from "./PublicClientAuth";
import PublicMyBookings from "./PublicMyBookings";
import { resolveSiteHref, transformLinksDeep } from "../../components/website/linking";
import { useNavigate } from "react-router-dom";
// Replace hrefs inside HTML strings (RichText bodies) using our resolver
function rewriteAnchorsHTML(html, resolver) {
  if (!html || typeof html !== "string") return html;
  try {
    return html.replace(/href="([^"]+)"/g, (_, href) => `href="${resolver(href)}"`);
  } catch {
    return html;
  }
}

export default function WebsiteViewer() {
  const { slug, pageSlug } = useParams();
  // Redirect "login" and "my-bookings" to canonical routes
  React.useEffect(() => {
    if (active?.slug === "login") {
      navigate("/login", { replace: true });
    } else if (active?.slug === "my-bookings") {
   navigate(`/dashboard?site=${encodeURIComponent(slug)}`, { replace: true });
   return null;
 }
  }, [active?.slug, navigate]);
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [site, setSite] = useState(null);
  const [error, setError] = useState("");

  const go = (to) =>
    navigate(
      typeof to === "string"
        ? { pathname: to, search: location.search }
        : { ...to, search: location.search }
    );

  // Load public site payload by slug (no auth, no editor)
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await wb.publicBySlug(slug);
        if (!live) return;
        setSite(data);
      } catch {
        if (!live) return;
        setSite(null);
        setError("Failed to load website.");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [slug]);

  const pages = useMemo(() => {
    const arr = Array.isArray(site?.pages) ? site.pages : [];
    return arr
      .filter((p) => p.published !== false)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [site]);

  const active = useMemo(() => {
    if (!pages.length) return null;
    if (pageSlug) return pages.find((p) => p.slug === pageSlug) || pages[0];
    const home =
      pages.find((p) => p.is_homepage) ||
      pages.find((p) => (p.slug || "").toLowerCase() === "home");
    return home || pages[0];
  }, [pages, pageSlug]);

  const pageLayout = useMemo(
    () => active?.layout ?? active?.content?.meta?.layout ?? "boxed",
    [active]
  );

  // Set <title> and scroll on page change
  useEffect(() => {
    if (active) {
      const siteTitle = site?.title || site?.name || site?.company_name || slug || "Site";
      const pageTitle = active?.title || active?.menu_title || active?.slug || "Page";
      document.title = `${pageTitle} — ${siteTitle}`;
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [active, site, slug]);

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

   const overrides = site?.theme_overrides || {};

  // 🔐 Built-in pages: login & my-bookings
  if (active?.slug === "login") {
    return <PublicClientAuth slug={slug} />;
  }
  if (active?.slug === "my-bookings") {
    return <PublicMyBookings slug={slug} />;
  }

  // Link rewriting (hrefs in props + richText body HTML)
  const sectionsPatched = useMemo(() => {
    const secs = active?.content?.sections || [];
    const resolver = (href) => resolveSiteHref(slug, href, pages);
    return secs.map((s) => {
      if (!s?.props) return s;
      let nextProps = transformLinksDeep(s.props, resolver);
      if (s.type === "richText" && typeof nextProps.body === "string") {
        nextProps = { ...nextProps, body: rewriteAnchorsHTML(nextProps.body, resolver) };
      }
      return { ...s, props: nextProps };
    });
  }, [active, slug, pages]);

  return (
    <ThemeRuntimeProvider overrides={overrides}>
      {/* Public-only top bar — no “Edit” controls here */}
      <AppBar
        position="sticky"
        color="default"
        elevation={0}
        sx={{ borderBottom: (t) => `1px solid ${t.palette.divider}` }}
      >
        <Toolbar>
          <Container maxWidth="lg" sx={{ display: "flex", alignItems: "center" }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h6"
                noWrap
                sx={{ fontWeight: 800, letterSpacing: "-0.01em" }}
                title={site?.title || site?.name || slug}
              >
                {site?.title || site?.name || slug}
              </Typography>
            </Stack>
          </Container>
        </Toolbar>

        {pages.length > 0 && (
          <Container maxWidth="lg" sx={{ px: 2, pb: 1 }}>
            <Tabs
              value={active ? active.slug : false}
              variant="scrollable"
              onChange={(_, v) => go(`/${slug}/site/${v}`)}
              aria-label="Website pages"
            >
              {pages
                .filter((p) => p.show_in_menu !== false)
                .map((p) => (
                  <Tab key={p.id ?? p.slug} value={p.slug} label={p.menu_title || p.title || p.slug} />
                ))}
            </Tabs>
          </Container>
        )}
      </AppBar>

      {/* Page body */}
      {sectionsPatched.length ? (
        <RenderSections sections={sectionsPatched} layout={pageLayout} />
      ) : (
        <Container maxWidth="lg" sx={{ my: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight={700}>
              {active?.title || "Page"}
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
