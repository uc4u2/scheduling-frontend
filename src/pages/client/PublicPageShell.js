// src/pages/client/PublicPageShell.js
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  AppBar, Toolbar, Button, Container, Box, Stack, Typography,
  IconButton, CircularProgress, Alert, CssBaseline, GlobalStyles, useTheme
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Link as RouterLink, useParams, useNavigate, useLocation } from "react-router-dom";
import ThemeRuntimeProvider from "../../components/website/ThemeRuntimeProvider";
import { publicSite } from "../../utils/api"; // added for edit guard + data fetch
import { normalizeNavStyle, navStyleToCssVars, createNavButtonStyles } from "../../utils/navStyle";
import NavStyleHydrator from "../../components/website/NavStyleHydrator";

const PublicSiteContext = createContext(null);

export function usePublicSite() {
  return useContext(PublicSiteContext);
}

const isPlainObject = (val) => !!val && typeof val === "object" && !Array.isArray(val);

const cloneStyle = (val) => {
  if (!isPlainObject(val)) return null;
  try {
    return JSON.parse(JSON.stringify(val));
  } catch {
    return { ...val };
  }
};

const extractPageStyleProps = (page) => {
  if (!page) return null;
  const sections = Array.isArray(page?.content?.sections) ? page.content.sections : [];
  const section = sections.find((s) => s?.type === "pageStyle");
  if (section?.props && isPlainObject(section.props)) {
    const copy = cloneStyle(section.props);
    if (copy && Object.keys(copy).length) return copy;
  }
  const meta = cloneStyle(page?.content?.meta?.pageStyle);
  if (meta && Object.keys(meta).length) return meta;
  return null;
};

const clamp01 = (n) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(1, num));
};

const hexToRgba = (hex, alpha = 1) => {
  if (!hex) return undefined;
  let h = String(hex).replace("#", "").trim();
  if (!h) return undefined;
  if (h.length === 3) {
    h = h.split("").map((c) => c + c).join("");
  } else if (h.length === 4) {
    alpha = parseInt(h[3] + h[3], 16) / 255;
    h = h.slice(0, 3).split("").map((c) => c + c).join("");
  } else if (h.length === 8) {
    alpha = parseInt(h.slice(6, 8), 16) / 255;
    h = h.slice(0, 6);
  }
  if (h.length !== 6) return undefined;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${clamp01(alpha)})`;
};

const overlayColor = (color, opacity) => {
  if (!color) return null;
  const alpha = clamp01(opacity ?? 0);
  if (alpha <= 0) return null;
  const trimmed = String(color).trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("#")) {
    return hexToRgba(trimmed, alpha);
  }
  return trimmed;
};

const toPx = (val) => (val === 0 || Number.isFinite(val) ? `${val}px` : undefined);

const pageStyleToCssVars = (style) => {
  if (!style) return null;
  const vars = {};
  const assign = (key, value) => {
    if (value !== undefined && value !== null && value !== "") {
      vars[key] = value;
    }
  };
  assign("--page-heading-color", style.headingColor);
  assign("--page-body-color", style.bodyColor);
  assign("--page-link-color", style.linkColor);
  assign("--page-heading-font", style.headingFont);
  assign("--page-body-font", style.bodyFont);
  assign("--page-hero-heading-shadow", style.heroHeadingShadow);
  assign("--page-card-bg", style.cardBg || style.cardColor);
  assign("--page-card-radius", toPx(style.cardRadius));
  assign("--page-card-shadow", style.cardShadow);
  assign("--page-card-blur", toPx(style.cardBlur));
  assign("--page-btn-bg", style.btnBg);
  assign("--page-btn-color", style.btnColor);
  assign("--page-btn-radius", toPx(style.btnRadius));
  return Object.keys(vars).length ? vars : null;
};

const pageStyleToBackgroundSx = (style) => {
  if (!style) return null;
  const sx = {};
  if (style.backgroundColor) sx.backgroundColor = style.backgroundColor;
  if (style.bodyColor) sx.color = style.bodyColor;
  const overlay = overlayColor(style.overlayColor, style.overlayOpacity);
  if (style.backgroundImage) {
    const layers = [];
    if (overlay) layers.push(`linear-gradient(${overlay}, ${overlay})`);
    layers.push(`url(${style.backgroundImage})`);
    sx.backgroundImage = layers.join(", ");
  } else if (overlay) {
    sx.backgroundImage = `linear-gradient(${overlay}, ${overlay})`;
  }
  if (style.backgroundRepeat) sx.backgroundRepeat = style.backgroundRepeat;
  if (style.backgroundSize) sx.backgroundSize = style.backgroundSize;
  if (style.backgroundPosition) sx.backgroundPosition = style.backgroundPosition;
  if (style.backgroundAttachment) sx.backgroundAttachment = style.backgroundAttachment;
  return Object.keys(sx).length ? sx : null;
};

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
function ShellInner({
  children,
  slug,
  pages,
  navCfg,
  activeKey,
  pageStyleOverride,
  pageCssVars,
  navStyle,
}) {
  const theme = useTheme();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();

  const navTokens = useMemo(() => normalizeNavStyle(navStyle), [navStyle]);

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

  const servicesPageSlug = useMemo(() => {
    const overrideSlug = String(navCfg?.services_page_slug || "").trim();
    if (overrideSlug) {
      if (overrideSlug.toLowerCase() === "services") return "services-classic";
      return overrideSlug;
    }
    const classicPage =
      (pages || []).find(
        (p) => String(p.slug || "").toLowerCase() === "services-classic"
      ) || null;
    if (classicPage?.slug) return classicPage.slug;
    return "services-classic";
  }, [navCfg, pages]);


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

  const jobsHref = useMemo(() => {
    const target = String(navCfg?.jobs_page_slug || "jobs");
    const hasPage = (pages || []).some((p) => String(p.slug || "").toLowerCase() === target.toLowerCase());
    if (navCfg?.jobs_tab_target === "page" && hasPage) {
      return `/${slug}?page=${encodeURIComponent(target)}`;
    }
    return `/${slug}/jobs`;
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
        if (p.slug === "jobs") to = `/${slug}/jobs`;
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
    const hasReviewsMenuItem = mappedMenu.some((item) => {
      const key = String(item?.key || "").toLowerCase();
      const label = String(item?.label || "").toLowerCase();
      return key === "reviews" || key === "__reviews" || label === "reviews";
    });
    const hasReviewsPage = (pages || []).some(
      (p) => String(p.slug || '').toLowerCase() === 'reviews' && p.show_in_menu !== false
    );
    const productsSlug = String(navCfg?.products_page_slug || 'products').toLowerCase();
    const basketSlug = String(navCfg?.basket_page_slug || 'basket').toLowerCase();
    const jobsSlug = String(navCfg?.jobs_page_slug || 'jobs').toLowerCase();
    const hasProductsPage = (pages || []).some(
      (p) => String(p.slug || '').toLowerCase() === productsSlug && p.show_in_menu !== false
    );
    const hasBasketPage = (pages || []).some(
      (p) => String(p.slug || '').toLowerCase() === basketSlug && p.show_in_menu !== false
    );
    const hasJobsPage = (pages || []).some(
      (p) => String(p.slug || '').toLowerCase() === jobsSlug && p.show_in_menu !== false
    );
    const reviewsTarget = String(navCfg?.reviews_tab_target || 'builtin').toLowerCase();
    const productsTarget = String(navCfg?.products_tab_target || 'builtin').toLowerCase();
    const basketTarget = String(navCfg?.basket_tab_target || 'builtin').toLowerCase();
    const jobsTarget = String(navCfg?.jobs_tab_target || 'builtin').toLowerCase();

    // Reviews are already defined as a page in most templates; avoid duplicates here.
    if (navCfg?.show_products_tab !== false && productsTarget === 'builtin' && !hasProductsPage) {
      items.push({
        key: "__products",
        label: navCfg?.products_tab_label || "Products",
        to: productsHref,
        active: pathname.startsWith(`/${slug}/products`) || activeKey === "__products",
      });
    }
    if (navCfg?.show_jobs_tab !== false && jobsTarget === 'builtin' && !hasJobsPage) {
      items.push({
        key: "__jobs",
        label: navCfg?.jobs_tab_label || "Jobs",
        to: jobsHref,
        active: pathname.startsWith(`/${slug}/jobs`) || activeKey === "__jobs",
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
  }, [navCfg, reviewsHref, productsHref, jobsHref, basketHref, pathname, slug, authed, pages, mappedMenu]);

  const allNavItems = useMemo(
    () => [...mappedMenu, ...extraTabs],
    [mappedMenu, extraTabs]
  );

  const navButtonSx = useMemo(
    () => createNavButtonStyles(navTokens),
    [navTokens]
  );

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
  if (pageCssVars) {
    Object.entries(pageCssVars).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        cssVars[key] = value;
      }
    });
  }
  const navCssVars = useMemo(() => navStyleToCssVars(navTokens), [navTokens]);
  Object.entries(navCssVars).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      cssVars[key] = value;
    }
  });
  // If no explicit link colour was provided by the page style,
  // align link colour with the nav accent so header/footer links
  // don't stay stuck on the default blue.
  if (!cssVars["--page-link-color"]) {
    const navAccent = navTokens?.active_text || navTokens?.text;
    if (navAccent) {
      cssVars["--page-link-color"] = navAccent;
    }
  }

  // Derive homepage Page Style to drive background for builtin pages
  const homePageStyle = useMemo(() => {
    try {
      const home = (pages || []).find((p) => p.is_homepage) || (pages || [])[0] || null;
      const secs = Array.isArray(home?.content?.sections) ? home.content.sections : [];
      const ps = secs.find((s) => s?.type === 'pageStyle');
      return (ps && ps.props) ? ps.props : (home?.content?.meta?.pageStyle || {});
    } catch { return {}; }
  }, [pages]);

  const homeCssVars = useMemo(
    () => (homePageStyle ? pageStyleToCssVars(homePageStyle) : null),
    [homePageStyle]
  );

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

  const mergedBackground = useMemo(() => {
    if (!pageStyleOverride) return bgSx;
    return { ...bgSx, ...pageStyleOverride };
  }, [bgSx, pageStyleOverride]);

  return (
    <>
      {/* Override global body colors for company sites */}
      <GlobalStyles
        styles={(muiTheme) => {
          const bodyStyles = {
            backgroundColor:
              (pageStyleOverride?.backgroundColor ??
                mergedBackground.backgroundColor ??
                cssVars["--sched-bg"]) ||
              muiTheme.palette.background.default,
            color:
              cssVars["--page-body-color"] ||
              mergedBackground.color ||
              muiTheme.palette.text.primary,
          };
          const bgImg =
            pageStyleOverride?.backgroundImage || mergedBackground.backgroundImage;
          if (bgImg) bodyStyles.backgroundImage = bgImg;
          const bgRepeat =
            pageStyleOverride?.backgroundRepeat || mergedBackground.backgroundRepeat;
          if (bgRepeat) bodyStyles.backgroundRepeat = bgRepeat;
          const bgSize =
            pageStyleOverride?.backgroundSize || mergedBackground.backgroundSize;
          if (bgSize) bodyStyles.backgroundSize = bgSize;
          const bgPos =
            pageStyleOverride?.backgroundPosition ||
            mergedBackground.backgroundPosition;
          if (bgPos) bodyStyles.backgroundPosition = bgPos;
          const bgAttach =
            pageStyleOverride?.backgroundAttachment ||
            mergedBackground.backgroundAttachment;
          if (bgAttach) bodyStyles.backgroundAttachment = bgAttach;

          const accentBg = "var(--page-btn-bg, var(--sched-primary))";
          const accentText = "var(--page-btn-color, #ffffff)";
          const accentHover = "var(--page-btn-bg-hover, var(--page-btn-bg, var(--sched-primary)))";
          const focusRing = `2px solid var(--page-focus-ring, var(--page-btn-bg, var(--sched-primary)))`;
          const accentBorder = "var(--page-border-color, rgba(15,23,42,0.16))";
          const softBg = "var(--page-btn-bg-soft, rgba(15,23,42,0.12))";
          const infoBg = "var(--page-alert-info-bg, rgba(15,23,42,0.04))";
          const warnBg = "var(--page-alert-warn-bg, rgba(255,193,7,0.12))";
          const infoColor = "var(--page-body-color, inherit)";
          const warnColor = "var(--page-body-color, inherit)";

          const surfaceColor =
            bodyStyles.backgroundColor ||
            mergedBackground.backgroundColor ||
            cssVars["--sched-bg"] ||
            muiTheme.palette.background.default;
          const rootVars = {
            ...cssVars,
            "--page-surface-bg": surfaceColor,
          };

          return {
            body: bodyStyles,
            ":root": rootVars,
            a: {
              color:
                cssVars["--page-link-color"] || muiTheme.palette.primary.main,
            },
            ".MuiButton-containedPrimary": {
              backgroundColor: accentBg,
              color: accentText,
              borderRadius: "var(--page-btn-radius, 12px)",
              boxShadow: "var(--page-btn-shadow, 0 16px 32px rgba(15,23,42,0.16))",
              textTransform: "none",
              fontWeight: 600,
            },
            ".MuiButton-containedPrimary:hover": {
              backgroundColor: accentHover,
            },
            ".MuiButton-containedPrimary.Mui-disabled": {
              opacity: 0.6,
              color: accentText,
              backgroundColor: accentBg,
            },
            ".MuiButton-containedPrimary:focus-visible": {
              outline: focusRing,
              outlineOffset: 2,
            },
            ".MuiButton-outlinedPrimary": {
              borderColor: accentBg,
              color: accentBg,
              borderRadius: "var(--page-btn-radius, 12px)",
              textTransform: "none",
              fontWeight: 600,
            },
            ".MuiButton-outlinedPrimary:hover": {
              borderColor: accentHover,
              backgroundColor: softBg,
            },
            ".MuiButton-outlinedPrimary:focus-visible": {
              outline: focusRing,
              outlineOffset: 2,
            },
            ".MuiButton-textPrimary": {
              color: accentBg,
              textTransform: "none",
              fontWeight: 600,
            },
            ".MuiButton-textPrimary:focus-visible": {
              outline: focusRing,
              outlineOffset: 2,
            },
            ".MuiChip-root.MuiChip-colorPrimary": {
              backgroundColor: accentBg,
              color: accentText,
            },
            ".MuiChip-root.MuiChip-outlinedPrimary": {
              borderColor: accentBg,
              color: accentBg,
            },
            ".MuiChip-root": {
              borderRadius: 999,
            },
            ".MuiChip-root.MuiChip-outlined": {
              borderColor: accentBorder,
              color: "var(--page-body-color, inherit)",
            },
            ".MuiTabs-indicator": {
              backgroundColor: accentBg,
            },
            ".MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              color: "var(--page-body-color, inherit)",
            },
            ".MuiTab-root.Mui-selected": {
              color: accentBg,
            },
            ".MuiTab-root:focus-visible": {
              outline: focusRing,
              outlineOffset: 2,
            },
            ".MuiAlert-standardInfo": {
              backgroundColor: infoBg,
              color: infoColor,
              borderRadius: "var(--page-card-radius, 12px)",
              border: `1px solid ${accentBorder}`,
            },
            ".MuiAlert-standardInfo .MuiAlert-icon": {
              color: accentBg,
            },
            ".MuiAlert-standardWarning": {
              backgroundColor: warnBg,
              color: warnColor,
              borderRadius: "var(--page-card-radius, 12px)",
              border: `1px solid ${accentBorder}`,
            },
            ".MuiAlert-standardWarning .MuiAlert-icon": {
              color: accentBg,
            },
            ".MuiAlert-standardInfo a, .MuiAlert-standardWarning a": {
              color: accentBg,
              textDecoration: "underline",
            },
          };
        }}
      />
      <CssBaseline />

      <NavStyleHydrator website={{ nav_style: navStyle }} scopeSelector=".page-scope .site-nav" />

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
            ...mergedBackground,
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
          <AppBar className="site-nav" position="sticky" color="default" enableColorOnDark>
            <Toolbar sx={{ gap: 1 }}>
              <IconButton edge="start" size="small" sx={{ display: { xs: "inline-flex", md: "none" } }}>
              <MenuIcon />
            </IconButton>

            <Typography
              variant="h6"
              noWrap
              component={RouterLink}
              to={`/${slug}`}
              sx={{
                textDecoration: "none",
                color: "var(--nav-btn-text, inherit)",
                mr: 2,
                fontWeight: navStyle.font_weight ?? 600,
                textTransform: navStyle.text_transform ?? "none",
                fontFamily: "var(--nav-brand-font-family, inherit)",
                fontSize: `var(--nav-brand-font-size, ${navStyle.brand_font_size || 20}px)`
              }}
            >
              {title}
            </Typography>

            <Stack
              direction="row"
              spacing={0}
              sx={{
                flexGrow: 1,
                display: { xs: "none", md: "flex" },
                justifyContent: "center",
                gap: `${navTokens.item_spacing}px`,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {allNavItems.map((item) => (
                <Button
                  key={item.key}
                  component={RouterLink}
                  to={item.to}
                  className="nav-btn"
                  variant="text"
                  color="inherit"
                  disableElevation
                  sx={navButtonSx(item.active)}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>

            {!authed ? (
              <Button className="nav-btn" variant="contained" component={RouterLink} to={`/login?site=${encodeURIComponent(slug)}`}>
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
                <Button className="nav-btn" component={RouterLink} to={`/dashboard?site=${encodeURIComponent(slug)}`}>
                  Dashboard
                </Button>
                <Button className="nav-btn" variant="outlined" onClick={handleLogout}>Logout</Button>
              </Stack>
            )}
          </Toolbar>
        </AppBar>
        )}

        <Container
          maxWidth={hideChrome ? false : undefined}
          disableGutters={hideChrome}
          sx={{
            pt: hideChrome ? 0 : { xs: 0.5, md: 1 },
            pb: hideChrome ? { xs: 2, md: 3 } : { xs: 1.25, md: 2 },
            px: hideChrome ? 0 : undefined,
          }}
        >
          {children}
        </Container>
      </Box>
    </>
  );
}

export default function PublicPageShell({
  children,
  activeKey,
  slugOverride,
  pageStyleOverride,
  pageCssVars,
}) {
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

    (async () => {
      try {
        const ok = await publicSite.getBySlug(slug);
        if (!alive) return;
        setSite(ok || null);
      } catch (e) {
        if (!alive) return;
        setErr(e?.response?.data?.error || "Failed to load site.");
      } finally {
        if (alive) setLoading(false);
      }
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

  const navStyleSource = useMemo(
    () =>
      site?.nav_style ||
      site?.settings?.nav_style ||
      site?.website_setting?.settings?.nav_style ||
      {},
    [site]
  );
  const navStyle = useMemo(
    () => normalizeNavStyle(navStyleSource),
    [navStyleSource]
  );

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

  const servicesPageSlug = useMemo(() => {
    const overrideSlug = String(navCfg?.services_page_slug || "").trim();
    if (overrideSlug) {
      if (overrideSlug.toLowerCase() === "services") return "services-classic";
      return overrideSlug;
    }
    const classicPage =
      pages.find(
        (p) => String(p?.slug || "").toLowerCase() === "services-classic"
      ) || null;
    if (classicPage?.slug) return classicPage.slug;
    return "services-classic";
  }, [navCfg, pages]);

  const servicesSlugCandidates = useMemo(() => {
    const set = new Set([
      String(servicesPageSlug || "").toLowerCase(),
      "services-classic",
      "services",
    ]);
    set.delete("");
    return Array.from(set);
  }, [servicesPageSlug]);

  const jobsPageSlug = useMemo(() => {
    const overrideSlug = String(navCfg?.jobs_page_slug || "").trim();
    if (overrideSlug) return overrideSlug;
    return "jobs";
  }, [navCfg]);

  const jobsSlugCandidates = useMemo(() => {
    const set = new Set([
      String(jobsPageSlug || "").toLowerCase(),
      "jobs",
      "careers",
      "career",
    ]);
    set.delete("");
    return Array.from(set);
  }, [jobsPageSlug]);

  const servicesPageStyle = useMemo(() => {
    for (const slugCandidate of servicesSlugCandidates) {
      const match = pages.find(
        (p) => String(p?.slug || "").toLowerCase() === slugCandidate
      );
      const style = extractPageStyleProps(match);
      if (style && Object.keys(style).length) return style;
    }
    return null;
  }, [pages, servicesSlugCandidates]);

  const jobsPageStyle = useMemo(() => {
    for (const slugCandidate of jobsSlugCandidates) {
      const match = pages.find(
        (p) => String(p?.slug || "").toLowerCase() === slugCandidate
      );
      const style = extractPageStyleProps(match);
      if (style && Object.keys(style).length) return style;
    }
    return null;
  }, [pages, jobsSlugCandidates]);

  const homePageStyle = useMemo(() => {
    const home = (pages || []).find((p) => p?.is_homepage) || (pages || [])[0] || null;
    const style = extractPageStyleProps(home);
    if (style && Object.keys(style).length) return style;
    return null;
  }, [pages]);

  const homeCssVars = useMemo(
    () => (homePageStyle ? pageStyleToCssVars(homePageStyle) : null),
    [homePageStyle]
  );

  const derivedServiceCssVars = useMemo(
    () => (servicesPageStyle ? pageStyleToCssVars(servicesPageStyle) : null),
    [servicesPageStyle]
  );
  const derivedServiceBackground = useMemo(
    () => (servicesPageStyle ? pageStyleToBackgroundSx(servicesPageStyle) : null),
    [servicesPageStyle]
  );
  const derivedJobsCssVars = useMemo(
    () => (jobsPageStyle ? pageStyleToCssVars(jobsPageStyle) : null),
    [jobsPageStyle]
  );
  const derivedJobsBackground = useMemo(
    () => (jobsPageStyle ? pageStyleToBackgroundSx(jobsPageStyle) : null),
    [jobsPageStyle]
  );

  const isServicesActive = useMemo(() => {
    const activeLower = String(activeKey || "").toLowerCase();
    if (activeLower === "__services") return true;
    return servicesSlugCandidates.includes(activeLower);
  }, [activeKey, servicesSlugCandidates]);

  const isJobsActive = useMemo(() => {
    const activeLower = String(activeKey || "").toLowerCase();
    if (activeLower === "__jobs") return true;
    return jobsSlugCandidates.includes(activeLower);
  }, [activeKey, jobsSlugCandidates]);

  const finalPageStyleOverride =
    pageStyleOverride ||
    (isJobsActive ? derivedJobsBackground : (isServicesActive ? derivedServiceBackground : null));
  const finalPageCssVars =
    pageCssVars ||
    (isJobsActive
      ? (derivedJobsCssVars || homeCssVars)
      : (isServicesActive ? (derivedServiceCssVars || homeCssVars) : null));

  const shellChildren = innerContent || children;

  return (
    <ThemeRuntimeProvider overrides={adjustedOverrides}>
      <PublicSiteContext.Provider
        value={{
          site,
          slug,
          pages,
          navCfg,
          navStyle,
          themeOverrides: adjustedOverrides,
        }}
      >
        {slug ? (
          <ShellInner
            slug={slug}
            pages={pages}
            navCfg={navCfg}
            activeKey={activeKey}
            pageStyleOverride={finalPageStyleOverride}
            pageCssVars={finalPageCssVars}
            navStyle={navStyle}
          >
            {shellChildren}
          </ShellInner>
        ) : (
          innerContent
        )}
      </PublicSiteContext.Provider>
    </ThemeRuntimeProvider>
  );
}
