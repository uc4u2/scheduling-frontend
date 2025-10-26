// src/pages/client/PublicPageShell.js
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AppBar, Toolbar, Button, Container, Box, Stack, Typography,
  IconButton, CircularProgress, Alert, CssBaseline, GlobalStyles, useTheme
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Link as RouterLink, useParams, useNavigate, useLocation } from "react-router-dom";
import ThemeRuntimeProvider from "../../components/website/ThemeRuntimeProvider";
import { publicSite } from "../../utils/api"; // added for edit guard

const API = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";

function useClientAuthed() {
  const [authed, setAuthed] = useState(() => !!localStorage.getItem("token"));
  useEffect(() => {
    const t = setInterval(() => {
      const now = !!localStorage.getItem("token");
      if (now !== authed) setAuthed(now);
    }, 800);
    return () => clearInterval(t);
  }, [authed]);
  return authed;
}

// --- Edit mode guard hook ---
function useEditGuard() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const isEdit = url.searchParams.get("edit") === "1";

    if (!isEdit) return;

    // Derive slug from first path segment: /<slug>/...
    const [, slug] = window.location.pathname.split("/");

    if (!slug) return;

    (async () => {
      try {
        // 1) Resolve company id from public site payload
        const pub = await publicSite.getBySlug(slug);
        const cid = pub?.company_id || pub?.company?.id;
        if (cid) {
          localStorage.setItem("company_id", String(cid));
        }

        // 2) If not logged in, go to login and bounce back here
        const token = localStorage.getItem("token");
        if (!token) {
          const next = `/${slug}?edit=1&site=${encodeURIComponent(slug)}`;
          window.location.href = `/login?next=${encodeURIComponent(next)}`;
          return;
        }
      } catch (e) {
        // Non-fatal; the Builder will still show a helpful message if we hit 401/403
        console.warn("[PublicPageShell] edit guard failed to resolve company", e);
      }
    })();
  }, []);
}

// Inner shell that runs *inside* ThemeRuntimeProvider so useTheme() sees the site theme
function ShellInner({ children, slug, pages, navCfg, activeKey }) {
  const theme = useTheme();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();

  const authed = useClientAuthed();
  
  const { embedMode, hideChrome } = useMemo(() => {
    try {
      const qs = new URLSearchParams(search || "");
      const embedParam = (qs.get('embed') || '').toLowerCase();
      const inIframe = typeof window !== 'undefined' && window.self !== window.top;
      let embed = false;
      if (embedParam === '1' || embedParam === 'true') {
        embed = true;
      } else if (embedParam === '0' || embedParam === 'false') {
        embed = false;
      } else {
        embed = inIframe;
      }
      return { embedMode: embed, hideChrome: embed && inIframe };
    } catch {
      return { embedMode: false, hideChrome: false };
    }
  }, [search]);

  const servicesHref = useMemo(() => {
    if (navCfg?.services_tab_target === "page" && navCfg?.services_page_slug) {
      return `/${slug}?page=${encodeURIComponent(navCfg.services_page_slug)}`;
    }
    return `/${slug}/services`;
  }, [slug, navCfg]);

  const reviewsHref = useMemo(() => {
    if (navCfg?.reviews_tab_target === "page" && navCfg?.reviews_page_slug) {
      return `/${slug}?page=${encodeURIComponent(navCfg.reviews_page_slug)}`;
    }
    return `/${slug}/reviews`;
  }, [slug, navCfg]);

  const productsHref = useMemo(() => {
    const target = String(navCfg?.products_page_slug || 'products');
    const hasPage = (pages || []).some((p) => String(p.slug || '').toLowerCase() === target.toLowerCase());
    if (navCfg?.products_tab_target === 'page' && hasPage) {
      return `/${slug}?page=${encodeURIComponent(target)}`;
    }
    return `/${slug}/products`;
  }, [slug, navCfg, pages]);

  const basketHref = useMemo(() => {
    const target = String(navCfg?.basket_page_slug || 'basket');
    const hasPage = (pages || []).some((p) => String(p.slug || '').toLowerCase() === target.toLowerCase());
    if (navCfg?.basket_tab_target === 'page' && hasPage) {
      return `/${slug}?page=${encodeURIComponent(target)}`;
    }
    return `/${slug}/basket`;
  }, [slug, navCfg, pages]);

  const hasMyBookingsPage = useMemo(
    () => (pages || []).some((p) => (p.slug || "").toLowerCase() === "my-bookings"),
    [pages]
  );

  // Map site-defined pages -> menu (login/dashboard-aware)
  const mappedMenu = useMemo(() => {
    return (pages || [])
      .filter((p) => p?.show_in_menu)
      .filter((p) => !(p.slug === "login" && authed))
      .filter((p) => !(p.slug === "my-bookings" && !authed))
      .map((p) => {
        let to = `/${slug}?page=${encodeURIComponent(p.slug)}`;
        if (p.slug === "login") to = `/login?site=${encodeURIComponent(slug)}`;
        if (p.slug === "my-bookings") to = `/dashboard?site=${encodeURIComponent(slug)}`;
        const isActive =
          activeKey === p.slug ||
          pathname === to ||
          pathname.includes(`page=${encodeURIComponent(p.slug)}`);
        return {
          key: p.slug,
          label: p.menu_title || p.title || p.slug,
          to,
          active: isActive,
        };
      });
  }, [pages, slug, authed, pathname, activeKey]);

  // Extra tabs (avoid duplicates)
  const extraTabs = useMemo(() => {
    const items = [];
    const hasServicesPage = (pages || []).some(
      (p) => String(p.slug || '').toLowerCase() === 'services' && p.show_in_menu !== false
    );
    const hasReviewsPage = (pages || []).some(
      (p) => String(p.slug || '').toLowerCase() === 'reviews' && p.show_in_menu !== false
    );
    const productsSlug = String(navCfg?.products_page_slug || 'products').toLowerCase();
    const basketSlug = String(navCfg?.basket_page_slug || 'basket').toLowerCase();
    const hasProductsPage = (pages || []).some(
      (p) => String(p.slug || '').toLowerCase() === productsSlug && p.show_in_menu !== false
    );
    const hasBasketPage = (pages || []).some(
      (p) => String(p.slug || '').toLowerCase() === basketSlug && p.show_in_menu !== false
    );
    const servicesTarget = String(navCfg?.services_tab_target || 'builtin').toLowerCase();
    const reviewsTarget = String(navCfg?.reviews_tab_target || 'builtin').toLowerCase();
    const productsTarget = String(navCfg?.products_tab_target || 'builtin').toLowerCase();
    const basketTarget = String(navCfg?.basket_tab_target || 'builtin').toLowerCase();

    if (navCfg?.show_services_tab !== false && servicesTarget === 'builtin' && !hasServicesPage) {
      items.push({
        key: "__services",
        label: navCfg?.services_tab_label || "Services",
        to: servicesHref,
        active: pathname.startsWith(`/${slug}/services`) || activeKey === "__services",
      });
    }
    if (navCfg?.show_reviews_tab !== false && reviewsTarget === 'builtin' && !hasReviewsPage) {
      items.push({
        key: "__reviews",
        label: navCfg?.reviews_tab_label || "Reviews",
        to: reviewsHref,
        active: pathname.startsWith(`/${slug}/reviews`) || activeKey === "__reviews",
      });
    }
    if (navCfg?.show_products_tab !== false && productsTarget === 'builtin' && !hasProductsPage) {
      items.push({
        key: "__products",
        label: navCfg?.products_tab_label || "Products",
        to: productsHref,
        active: pathname.startsWith(`/${slug}/products`) || activeKey === "__products",
      });
    }
    if (navCfg?.show_basket_tab !== false && basketTarget === 'builtin' && !hasBasketPage) {
      items.push({
        key: "__basket",
        label: navCfg?.basket_tab_label || "My Basket",
        to: basketHref,
        active: pathname.startsWith(`/${slug}/basket`) || activeKey === "__basket",
      });
    }
    return items;
  }, [navCfg, servicesHref, reviewsHref, productsHref, basketHref, pathname, slug, authed, pages]);

  const title = (pages?.company?.name) || slug;
  // Basic role detection to show manager-only controls
  const roleStored = (typeof localStorage !== 'undefined' && localStorage.getItem('role')) || '';
  const isManager = String(roleStored).toLowerCase() === 'manager';

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
    } catch {}
    navigate(`/${slug}`);
  };

  // ---- CSS Variable bridge (for any legacy CSS reading --sched-*) ----
  const cssVars = {
    "--sched-primary": theme.palette.primary.main,
    "--sched-secondary": theme.palette.secondary.main,
    "--sched-bg": theme.palette.background.default,
    "--sched-paper": theme.palette.background.paper,
    "--sched-text": theme.palette.text.primary,
  };

  // Derive homepage Page Style to drive background for builtin pages
  const homePageStyle = useMemo(() => {
    try {
      const home = (pages || []).find((p) => p.is_homepage) || (pages || [])[0] || null;
      const secs = Array.isArray(home?.content?.sections) ? home.content.sections : [];
      const ps = secs.find((s) => s?.type === 'pageStyle');
      return (ps && ps.props) ? ps.props : (home?.content?.meta?.pageStyle || {});
    } catch { return {}; }
  }, [pages]);

  const bgSx = useMemo(() => {
    const ps = homePageStyle || {};
    const out = {};
    if (ps.backgroundColor) out.backgroundColor = ps.backgroundColor;
    if (ps.backgroundImage) out.backgroundImage = `url(${ps.backgroundImage})`;
    if (ps.backgroundRepeat) out.backgroundRepeat = ps.backgroundRepeat;
    if (ps.backgroundSize) out.backgroundSize = ps.backgroundSize;
    if (ps.backgroundPosition) out.backgroundPosition = ps.backgroundPosition;
    if (ps.backgroundAttachment) out.backgroundAttachment = ps.backgroundAttachment;
    if (ps.overlayColor && (ps.overlayOpacity ?? 0) > 0) {
      const alpha = Math.max(0, Math.min(1, Number(ps.overlayOpacity) || 0));
      const overlay = `${ps.overlayColor}`;
      // layer overlay over background image if any
      out.backgroundImage = ps.backgroundImage
        ? `linear-gradient(${overlay} ${alpha*100}%, ${overlay} ${alpha*100}%), url(${ps.backgroundImage})`
        : `linear-gradient(${overlay} ${alpha*100}%, ${overlay} ${alpha*100}%)`;
    }
    return out;
  }, [homePageStyle]);

  return (
    <>
      {/* Override global body colors for company sites */}
      <GlobalStyles
        styles={{
          body: {
            backgroundColor: bgSx.backgroundColor || theme.palette.background.default,
            color: theme.palette.text.primary,
            backgroundImage: bgSx.backgroundImage,
            backgroundRepeat: bgSx.backgroundRepeat,
            backgroundSize: bgSx.backgroundSize,
            backgroundPosition: bgSx.backgroundPosition,
            backgroundAttachment: bgSx.backgroundAttachment,
          },
          a: { color: cssVars['--page-link-color'] || theme.palette.primary.main },
        }}
      />
      <CssBaseline />

      <Box
        className="page-scope"
        sx={() => {
          const qs = new URLSearchParams(search || "");
          const embedVars = embedMode
            ? {
                ...(qs.get('h') ? { '--page-heading-color': qs.get('h') } : {}),
                ...(qs.get('b') ? { '--page-body-color': qs.get('b') } : {}),
                ...(qs.get('link') ? { '--page-link-color': qs.get('link') } : {}),
                ...(qs.get('hfont') ? { '--page-heading-font': qs.get('hfont') } : {}),
                ...(qs.get('bfont') ? { '--page-body-font': qs.get('bfont') } : {}),
                ...(qs.get('cardbg') ? { '--page-card-bg': qs.get('cardbg') } : {}),
              }
            : {};
          const baseStyles = {
            minHeight: hideChrome ? '100%' : '100vh',
            color: 'text.primary',
            ...bgSx,
            ...cssVars,
            ...embedVars,
          };
          if (!baseStyles.backgroundColor) {
            baseStyles.backgroundColor = theme.palette.background.default;
          }
          return baseStyles;
        }}
      >
        {!hideChrome && (
          <AppBar position="sticky" color="default" enableColorOnDark>
            <Toolbar sx={{ gap: 1 }}>
              <IconButton edge="start" size="small" sx={{ display: { xs: "inline-flex", md: "none" } }}>
              <MenuIcon />
            </IconButton>

            <Typography
              variant="h6"
              noWrap
              component={RouterLink}
              to={`/${slug}`}
              sx={{ textDecoration: "none", color: "inherit", mr: 2 }}
            >
              {title}
            </Typography>

            <Stack direction="row" spacing={1} sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
              {[...mappedMenu, ...extraTabs].map((item) => (
                <Button
                  key={item.key}
                  component={RouterLink}
                  to={item.to}
                  color={item.active ? "primary" : "inherit"}
                  sx={{ fontWeight: item.active ? 700 : 500 }}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>

            {!authed ? (
              <Button variant="contained" component={RouterLink} to={`/login?site=${encodeURIComponent(slug)}`}>
                Login
              </Button>
            ) : (
              <Stack direction="row" spacing={1}>
                {isManager && (
                  <Button
                    component={RouterLink}
                    to={`/manage/website/builder?site=${encodeURIComponent(slug)}`}
                    variant="outlined"
                  >
                    Manage Site
                  </Button>
                )}
                <Button component={RouterLink} to={`/dashboard?site=${encodeURIComponent(slug)}`}>
                  Dashboard
                </Button>
                <Button variant="outlined" onClick={handleLogout}>Logout</Button>
              </Stack>
            )}
          </Toolbar>
        </AppBar>
        )}

        <Container
          maxWidth={hideChrome ? false : undefined}
          disableGutters={hideChrome}
          sx={{
            py: { xs: 3, md: 5 },
            px: hideChrome ? 0 : undefined,
          }}
        >
          {children}
        </Container>
      </Box>
    </>
  );
}

export default function PublicPageShell({ children, activeKey, slugOverride }) {
  const { slug: routeSlug } = useParams();
  const slug = slugOverride || routeSlug;
  const { search } = useLocation();

  // Persist the site slug so Login can find it even if opened without ?site=
  useEditGuard(); // <-- added call
  useEffect(() => {
    if (slug) {
      try { localStorage.setItem("site", slug); } catch {}
    }
  }, [slug]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [site, setSite] = useState(null);

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    setLoading(true);
    setErr("");

    const enc = encodeURIComponent(slug);
    (async () => {
      const tries = [
        `${API}/api/public/${enc}/website`,
        `${API}/public/${enc}/website`,
        `${API}/api/public/${enc}/site`,
        `${API}/public/${enc}/site`,
        `${API}/public/site/${enc}`,
      ];
      let ok = null, lastError = null;
      for (const url of tries) {
        try {
          const { data } = await axios.get(url);
          ok = data;
          break;
        } catch (e) {
          lastError = e;
        }
      }
      if (!alive) return;
      if (ok) setSite(ok);
      else setErr(lastError?.response?.data?.error || "Failed to load site.");
      setLoading(false);
    })();

    return () => { alive = false; };
  }, [slug]);

  // Prepare content; avoid early returns to keep hooks order stable
  let innerContent = null;
  if (!slug) {
    innerContent = (
      <Container sx={{ py: 6 }}>
        <Alert severity="warning">Missing company slug.</Alert>
      </Container>
    );
  } else if (loading) {
    innerContent = (
      <Box sx={{ p: 6, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  } else if (err) {
    innerContent = (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="error">{err}</Alert>
      </Container>
    );
  }

  // Prefer nav + theme overrides from the site payload
  const pages = Array.isArray(site?.pages) ? site.pages : [];
  const navCfg =
    site?.settings?.nav_overrides ||
    site?.nav_overrides ||
    site?.settings?.nav ||
    {};

  const themeOverrides =
    site?.theme_overrides ||
    site?.settings?.theme_overrides ||
    site?.company?.theme_overrides ||
    site?.company?.theme ||
    site?.theme ||
    {};

  const adjustedOverrides = useMemo(() => {
    try {
      const qs = new URLSearchParams(search || "");
      const isEmbed = qs.get("embed") === "1" || qs.get("embed") === "true";
      const inIframe = typeof window !== 'undefined' && window.self !== window.top;
      if (!(isEmbed && inIframe)) return themeOverrides;
      const primary = (qs.get("primary") || "").trim();
      const o = JSON.parse(JSON.stringify(themeOverrides || {}));
      if (primary) {
        o.palette = o.palette || {};
        o.palette.primary = { ...(o.palette?.primary || {}), main: primary };
      }
      return o;
    } catch { return themeOverrides; }
  }, [search, themeOverrides]);

  return (
    <ThemeRuntimeProvider overrides={adjustedOverrides}>
      {innerContent || (
        <ShellInner slug={slug} pages={pages} navCfg={navCfg} activeKey={activeKey}>
          {children}
        </ShellInner>
      )}
    </ThemeRuntimeProvider>
  );
}


