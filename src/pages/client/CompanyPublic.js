// src/pages/client/CompanyPublic.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppBar, Box, Button, Chip, Container, Dialog, DialogContent, IconButton,
  Menu, MenuItem, Stack, Toolbar, Tooltip, Typography, Alert, CircularProgress, Divider, GlobalStyles,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import BrushIcon from "@mui/icons-material/Brush";
import PublishIcon from "@mui/icons-material/Publish";
import CloseIcon from "@mui/icons-material/Close";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { useParams, useSearchParams, Link as RouterLink, useNavigate } from "react-router-dom";

import { wb } from "../../utils/api";
import { RenderSections } from "../../components/website/RenderSections";
import VisualSiteBuilder from "../sections/management/VisualSiteBuilder";
import ThemeRuntimeProvider from "../../components/website/ThemeRuntimeProvider";
import PublicReviewList from "./PublicReviewList";
import { resolveSiteHref, transformLinksDeep } from "../../components/website/linking";
import { normalizeNavStyle, navStyleToCssVars, createNavButtonStyles } from "../../utils/navStyle";
import { navSettings } from "../../utils/api";
import NavStyleHydrator from "../../components/website/NavStyleHydrator";
import { ServiceListEmbedded } from "./ServiceList";
import { ProductListEmbedded } from "./ProductList";
import { MyBasketEmbedded } from "./MyBasket";

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
  const metaStyle = cloneStyle(page?.content?.meta?.pageStyle);
  if (metaStyle && Object.keys(metaStyle).length) return metaStyle;
  return null;
};
const clamp01 = (n) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(1, num));
};
const toHexByte = (n) => Math.max(0, Math.min(255, Math.round(Number(n) || 0))).toString(16).padStart(2, '0');
const normalizeHexColor = (hex) => {
  if (typeof hex !== 'string') return '';
  let s = hex.trim();
  if (!s) return '';
  if (!s.startsWith('#')) return s;
  let h = s.slice(1);
  if (h.length === 3) {
    h = h.split('').map((c) => c + c).join('');
  } else if (h.length === 4) {
    h = h.slice(0, 3).split('').map((c) => c + c).join('');
  } else if (h.length === 8) {
    h = h.slice(0, 6);
  }
  if (h.length < 6) h = h.padEnd(6, '0');
  return `#${h.toLowerCase()}`;
};
const hexToRgba = (hex, opacity = 1) => {
  const norm = normalizeHexColor(hex);
  if (!norm || !norm.startsWith('#')) return norm || '';
  const h = norm.slice(1);
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${clamp01(opacity)})`;
};
const parseCssColor = (css, fallbackOpacity = 1) => {
  const base = { hex: '#ffffff', opacity: clamp01(fallbackOpacity) };
  if (!css || typeof css !== 'string') return base;
  const str = css.trim();
  if (!str) return base;
  if (str.toLowerCase() === 'transparent') {
    return { hex: '#000000', opacity: 0 };
  }
  const rgba = /^rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9.]+))?\)$/i.exec(str);
  if (rgba) {
    const r = Number(rgba[1]);
    const g = Number(rgba[2]);
    const b = Number(rgba[3]);
    const a = rgba[4] != null ? parseFloat(rgba[4]) : base.opacity;
    return {
      hex: `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`,
      opacity: clamp01(a),
    };
  }
  if (str.startsWith('#')) {
    const raw = str.slice(1);
    let alpha = base.opacity;
    if (raw.length === 4) {
      alpha = parseInt(raw[3] + raw[3], 16) / 255;
    } else if (raw.length === 8) {
      alpha = parseInt(raw.slice(6, 8), 16) / 255;
    }
    return { hex: normalizeHexColor(str), opacity: clamp01(alpha) };
  }
  return base;
};
const cssColorWithOpacity = (color, overrideOpacity) => {
  const str = typeof color === 'string' ? color.trim() : '';
  if (!str) return null;
  const isSpecial = str.startsWith('#') || /^rgba?/i.test(str) || str.toLowerCase() === 'transparent';
  if (!isSpecial) {
    return str;
  }
  const parsed = parseCssColor(str, overrideOpacity ?? 1);
  const finalOpacity = overrideOpacity != null ? clamp01(overrideOpacity) : parsed.opacity;
  return hexToRgba(parsed.hex, finalOpacity);
};

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
  assign("--page-card-radius", style.cardRadius != null ? `${style.cardRadius}px` : undefined);
  assign("--page-card-shadow", style.cardShadow);
  assign("--page-card-blur", style.cardBlur != null ? `${style.cardBlur}px` : undefined);
  assign("--page-btn-bg", style.btnBg);
  assign("--page-btn-color", style.btnColor);
  assign("--page-btn-radius", style.btnRadius != null ? `${style.btnRadius}px` : undefined);
  return Object.keys(vars).length ? vars : null;
};

const pageStyleToBackgroundSx = (style) => {
  if (!style) return null;
  const sx = {};
  if (style.backgroundColor) sx.backgroundColor = style.backgroundColor;
  if (style.bodyColor) sx.color = style.bodyColor;
  const overlay = cssColorWithOpacity(
    style.overlayColor,
    Number.isFinite(style.overlayOpacity) ? style.overlayOpacity : undefined
  );
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

const PLACEHOLDER_SITE_TITLES = new Set([
  "FE Save Test",
  "FE Preview",
  "FE Test Site",
]);

export default function CompanyPublic() {
  const { slug } = useParams();
  const navigate = useNavigate();
  // Persist slug for later redirects (login → dashboard)
  useEffect(() => {
    if (slug) {
      try { localStorage.setItem("site", slug); } catch {}
    }
  }, [slug]);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const sessionId = searchParams.get("session_id") || searchParams.get("sid");
    try {
      sessionStorage.removeItem("checkout_stripe_session_id");
    } catch {}
    if (sessionId && slug) {
      navigate({
        pathname: `/${slug}/checkout/return`,
        search: `?session_id=${encodeURIComponent(sessionId)}`
      }, { replace: true });
    }
  }, [searchParams, slug, navigate]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [company, setCompany] = useState(null);
  const [sitePayload, setSitePayload] = useState(null);
  const [pages, setPages] = useState([]);

  const pageFromQuery = (searchParams.get("page") || "").trim();

  const currentPage = useMemo(() => {
    if (!pages.length) return null;
    if (pageFromQuery) {
      const qRaw = String(pageFromQuery).toLowerCase();
      const q = qRaw === "services" ? "services-classic" : qRaw;
      if (q === "reviews") return { slug: "reviews", title: "Reviews", content: { sections: [] } };
      if (q === "services-classic") {
        const existing = pages.find(
          (p) => String(p.slug || "").toLowerCase() === "services-classic"
        );
        if (existing) return existing;
        return { slug: "services-classic", title: "Services", content: { sections: [] } };
      }
      if (q === "my-bookings" || q === "mybookings") return { slug: "my-bookings", title: "My Bookings", content: { sections: [] } };
      const byQuery = pages.find((p) => String(p.slug || '').toLowerCase() === q || String(p.menu_title || '').toLowerCase() === q || String(p.title || '').toLowerCase() === q);
      if (byQuery) return byQuery;
    }
    return pages.find((p) => p.is_homepage) || pages[0];
  }, [pages, pageFromQuery]);

  // ✅ Gate by existing auth info (no new concepts)
  const role = (typeof localStorage !== "undefined" && localStorage.getItem("role")) || "client";
  const authedCompanyId = typeof localStorage !== "undefined" ? localStorage.getItem("company_id") : null;
  const isManagerForCompany = useMemo(() => {
    if (role !== "manager") return false;                        // only managers
    if (!company?.id || !authedCompanyId) return true;          // if either side missing, allow managers
    return String(authedCompanyId) === String(company.id);       // if present, require match
  }, [role, authedCompanyId, company]);

  const [themeAnchor, setThemeAnchor] = useState(null);
  const [themes, setThemes] = useState([]);
  const [settings, setSettings] = useState(null);
  const themeMenuOpen = Boolean(themeAnchor);

  const [editorOpen, setEditorOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [toolbarMsg, setToolbarMsg] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true); setErr("");
        const { data } = await wb.publicBySlug(slug);
        if (!alive) return;
        setSitePayload(data || null);
        setCompany(data?.company || null);
        const normalized = Array.isArray(data?.pages)
          ? data.pages.map((p) => ({ ...p, content: Array.isArray(p?.content?.sections) ? p.content : { sections: [] } }))
          : [];
        const cleaned = normalized.filter(
          (p) => String(p.slug || "").toLowerCase() !== "services"
        );
        setPages(cleaned);
      } catch {
        setErr("Failed to load the public website for this company.");
        setCompany(null); setPages([]); setSitePayload(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [slug]);

  useEffect(() => {
    if (isManagerForCompany && searchParams.get("edit") === "1") setEditorOpen(true);
  }, [isManagerForCompany, searchParams]);

  // Only managers fetch manager-only settings
  useEffect(() => {
    if (!isManagerForCompany || !company?.id) return;
    let ok = true;
    (async () => {
      try {
        const [themesRes, settingsRes] = await Promise.all([
          wb.listThemes(company.id),              // pass company id
          wb.getSettings(company.id),
        ]);
        if (!ok) return;
        const baseSettings = settingsRes.data || {};
        try {
          const styleRes = await navSettings.getStyle(company.id);
          if (styleRes) {
            const normalizedStyle = normalizeNavStyle(styleRes);
            baseSettings.nav_style = normalizedStyle;
            baseSettings.settings = {
              ...(baseSettings.settings || {}),
              nav_style: normalizedStyle,
            };
          }
        } catch (styleErr) {
          console.warn("Failed to load navigation style", styleErr?.response?.data || styleErr);
        }
        setThemes(Array.isArray(themesRes.data) ? themesRes.data : []);
        setSettings(baseSettings);
      } catch {
        /* non-fatal */
      }
    })();
    return () => { ok = false; };
  }, [isManagerForCompany, company]);

  const chooseTheme = async (themeId) => {
    if (!isManagerForCompany || !company?.id) return;
    try {
      const payload = { theme_id: themeId, is_live: settings?.is_live ?? false };
      const { data } = await wb.saveSettings(company.id, payload);
      setSettings(data); setToolbarMsg("Theme saved");
    } catch {
      setToolbarMsg("Failed to save theme");
    } finally {
      setThemeAnchor(null);
      setTimeout(() => setToolbarMsg(""), 2000);
    }
  };

  const publish = async () => {
    if (!isManagerForCompany || !company?.id) return;
    setPublishing(true);
    try {
      await wb.publish(company.id, true);
      setToolbarMsg("Published");
    } catch {
      setToolbarMsg("Publish failed");
    } finally {
      setPublishing(false);
      setTimeout(() => setToolbarMsg(""), 2000);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // MENU PAGES + NAV ITEMS (auth-aware + canonical links)
  const menuPages = useMemo(
    () =>
      pages
        .filter((p) => p.show_in_menu)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [pages]
  );
  const hasReviewsPage = useMemo(
    () => (menuPages || []).some((p) => String(p.slug || '').toLowerCase() === 'reviews'),
    [menuPages]
  );

  const reviewsHref = useCallback(() => {
    if (hasReviewsPage) {
      return `/${slug}?page=reviews`;
    }
    return `/${slug}/reviews`;
  }, [hasReviewsPage, slug]);

  const runtimeOverrides = settings?.theme_overrides
    || sitePayload?.theme_overrides
    || company?.theme_overrides
    || {};

  const siteDefaultPageStyle = useMemo(() => {
    const fromSettings = cloneStyle(settings?.settings?.page_style_default);
    if (fromSettings && Object.keys(fromSettings).length) return fromSettings;
    const fromPayload = cloneStyle(sitePayload?.website_setting?.settings?.page_style_default);
    if (fromPayload && Object.keys(fromPayload).length) return fromPayload;
    return null;
  }, [settings, sitePayload]);

  // Prefer live manager settings when available to reflect changes immediately.
  const nav = (settings?.nav_overrides || sitePayload?.nav_overrides || {});
  const isOn = (v) => (v === false || v === 0) ? false : (typeof v === "string" ? !/^(0|false|no|off)$/i.test(v.trim()) : Boolean(v ?? true));
  // Auth state — client
  const token = (typeof localStorage !== "undefined" && localStorage.getItem("token")) || "";
  const roleStored  = (typeof localStorage !== "undefined" && localStorage.getItem("role")) || "";
  const clientLoggedIn = Boolean(token && roleStored === "client");
  const doLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      // localStorage.removeItem("company_id"); // optional
    } catch {}
    window.location.assign("/login");
  };

  const servicesPageSlug = useMemo(() => {
    const overrideSlug = String(nav?.services_page_slug || "").trim();
    if (overrideSlug) {
      // Treat legacy "services" override as classic
      if (overrideSlug.toLowerCase() === "services") return "services-classic";
      return overrideSlug;
    }
    const classicPage =
      (pages || []).find(
        (p) => String(p.slug || "").toLowerCase() === "services-classic"
      ) || null;
    if (classicPage?.slug) return classicPage.slug;
    return "services-classic";
  }, [nav, pages]);

  const hasServicesClassicPage = useMemo(
    () =>
      (pages || []).some(
        (p) =>
          String(p.slug || "").toLowerCase() ===
          servicesPageSlug.toLowerCase()
      ),
    [pages, servicesPageSlug]
  );

  const servicesHref = useCallback(
    () => `/${slug}?page=${encodeURIComponent(servicesPageSlug)}`,
    [slug, servicesPageSlug]
  );

  // ---- nav builder: respects manager settings or public payload ----
  function buildNavItems(sitePayloadArg, settingsArg) {
    const navOvr = (settingsArg && settingsArg.nav_overrides)
      || (sitePayloadArg && sitePayloadArg.nav_overrides)
      || {};

    const showReviews  = navOvr.show_reviews_tab  !== false; // default true

    const items = [
      { key: "home",     label: "Home",     href: `/${sitePayloadArg?.slug || slug || ""}` },
      showReviews  && { key: "reviews",  label: "Reviews",  href: reviewsHref()  },
    ].filter(Boolean);

    return items;
  }

  const navItems = useMemo(() => {
    const core = buildNavItems(sitePayload, settings);
    // Keep other template pages in the nav as well, respecting auth rules and hiding duplicates
    const others = menuPages
      .filter((p) => !(p.slug === "login" && clientLoggedIn))
      .filter((p) => !(p.slug === "my-bookings" && !clientLoggedIn))
      .filter((p) => !["home", "reviews"].includes(p.slug))
      .map((p) => {
        let href = `/${slug}?page=${encodeURIComponent(p.slug)}`;
        if (p.slug === "login") href = `/login?site=${encodeURIComponent(slug)}`;
        if (p.slug === "my-bookings") href = `/dashboard?site=${encodeURIComponent(slug)}`;
        return { key: p.slug, label: p.menu_title || p.title || p.slug, href };
      });

    // Optional Logout shortcut
    const shortcuts = [];
    if (clientLoggedIn && isOn(nav.show_logout_tab ?? true)) {
      shortcuts.push({ key: "__logout", label: nav.logout_tab_label || "Log out", onClick: doLogout });
    }

    return [...core, ...others, ...shortcuts];
  }, [sitePayload, settings, menuPages, nav, slug, reviewsHref, clientLoggedIn]);
  // ─────────────────────────────────────────────────────────────────────────────

  const rawNavStyle =
    settings?.nav_style ||
    sitePayload?.nav_style ||
    sitePayload?.settings?.nav_style ||
    {};
  const navStyle = useMemo(
    () => normalizeNavStyle(rawNavStyle),
    [rawNavStyle]
  );
  const navCssVars = useMemo(
    () => navStyleToCssVars(navStyle),
    [navStyle]
  );

  const navItemsWithActive = useMemo(() => {
    const currentSlug = String(currentPage?.slug || "").toLowerCase();
    return navItems.map((item) => {
      const keyLower = String(item.key || "").toLowerCase();
      const active =
        keyLower === "home"
          ? !currentSlug || currentSlug === "home"
          : keyLower === currentSlug;
      return { ...item, active };
    });
  }, [navItems, currentPage]);

  const navButtonSx = useMemo(
    () => createNavButtonStyles(navStyle),
    [navStyle]
  );

  const { sections: patchedSections, styleProps: specialPageStyle, renderOverride } = useMemo(() => {
    if (!currentPage) {
      return { sections: [], styleProps: null, renderOverride: null };
    }

    const slugLower = String(currentPage?.slug || "").toLowerCase();
    const currentSections = Array.isArray(currentPage?.content?.sections) ? currentPage.content.sections : [];
    const home = (pages || []).find((p) => p.is_homepage) || (pages || [])[0];
    const homeSections = Array.isArray(home?.content?.sections) ? home.content.sections : [];
    const homePageStyleSection = homeSections.find((s) => s?.type === "pageStyle");

    const pickStyle = (...candidates) => {
      for (const cand of candidates) {
        const next = cloneStyle(cand);
        if (next && Object.keys(next).length) return next;
      }
      return {};
    };

    if (["services", "services-classic", "products", "basket"].includes(slugLower)) {
      const existingPageStyleSection = currentSections.find((s) => s?.type === "pageStyle");
      const styleProps = pickStyle(
        existingPageStyleSection?.props,
        currentPage?.content?.meta?.pageStyle,
        homePageStyleSection?.props,
        home?.content?.meta?.pageStyle,
        siteDefaultPageStyle
      );
      const overrideType = slugLower === "services" ? "services-classic" : slugLower;
      return { sections: [], styleProps, renderOverride: { type: overrideType, styleProps } };
    }

    if (["reviews", "my-bookings", "checkout"].includes(slugLower)) {
      const existingPageStyleSection = currentSections.find((s) => s?.type === "pageStyle");
      const styleProps = pickStyle(
        existingPageStyleSection?.props,
        currentPage?.content?.meta?.pageStyle,
        homePageStyleSection?.props,
        home?.content?.meta?.pageStyle,
        siteDefaultPageStyle
      );

      const primary = styleProps.linkColor || styleProps.primaryColor || styleProps.brandColor || "";
      const bg = styleProps.backgroundColor || "";
      const head = styleProps.headingColor || "";
      const body = styleProps.bodyColor || "";
      const toRGB = (hex) => {
        const s = String(hex || "").trim();
        if (!s.startsWith("#")) return null;
        const h = s.length === 4 ? `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}` : s;
        const r = parseInt(h.slice(1, 3), 16);
        const g = parseInt(h.slice(3, 5), 16);
        const b = parseInt(h.slice(5, 7), 16);
        return [r, g, b];
      };
      const lum = (rgb) => !rgb ? 1 : (0.2126 * rgb[0] / 255 + 0.7152 * rgb[1] / 255 + 0.0722 * rgb[2] / 255);
      let tone = "dark";
      const Lbg = lum(toRGB(bg)), Lh = lum(toRGB(head)), Lb = lum(toRGB(body));
      if (Lbg < 0.4) tone = "light";
      if (Lh !== 1) tone = Lh < 0.5 ? "light" : "dark"; else if (Lb !== 1) tone = Lb < 0.5 ? "light" : "dark";

      const qp = new URLSearchParams();
      qp.set("embed", "1");
      qp.set("site", slug);
      if (primary) qp.set("primary", primary);
      if (tone) qp.set("text", tone);
      if (head) qp.set("h", head);
      if (body) qp.set("b", body);
      if (styleProps.linkColor) qp.set("link", styleProps.linkColor);
      if (styleProps.headingFont) qp.set("hfont", styleProps.headingFont);
      if (styleProps.bodyFont) qp.set("bfont", styleProps.bodyFont);
      const embedCardBg = cssColorWithOpacity(
        styleProps.cardBg || styleProps.cardColor,
        Number.isFinite(styleProps.cardOpacity) ? styleProps.cardOpacity : undefined
      );
      if (embedCardBg) qp.set("cardbg", embedCardBg);
      const targetPath = slugLower === "my-bookings" ? "my-bookings" : slugLower;
      const basePath = targetPath ? `/${slug}/${targetPath}` : `/${slug}`;
      const src = `${basePath}?${qp.toString()}`;

      const basePageStyleSection = existingPageStyleSection || homePageStyleSection || null;
      let pageStyleBlock = null;
      if (Object.keys(styleProps).length) {
        pageStyleBlock = {
          id: basePageStyleSection?.id || `page-style-${slugLower}`,
          type: "pageStyle",
          props: styleProps,
          ...(basePageStyleSection?.sx ? { sx: basePageStyleSection.sx } : {}),
        };
      }

      const embedBlock = {
        id: `embed-${slugLower}`,
        type: "richText",
        props: {
          title: "",
          body: `<iframe src="${src}" style="width:100%;min-height:900px;border:none;display:block;"></iframe>`
        }
      };

      const sections = pageStyleBlock ? [pageStyleBlock, embedBlock] : [embedBlock];
      return { sections, styleProps, renderOverride: null };
    }

    const sections = currentPage?.content?.sections || [];
    const servicesLink = servicesHref();
    const reviewsLink = `/${slug}?page=reviews`;
    const servicesAliases = [
      "services",
      "/services",
      "services-classic",
      "/services-classic",
      "?page=services",
      "/?page=services",
      "?page=services-classic",
      "/?page=services-classic",
      "book",
      "/book",
    ];
    const resolver = (href) => {
      const base = resolveSiteHref(slug, href, pages);
      const clean = String(href || "").trim().toLowerCase();
      if (servicesAliases.includes(clean)) return servicesLink;
      if (["reviews", "/reviews"].includes(clean)) return reviewsLink;
      return base;
    };
    const fixIframeBody = (html) => {
      try {
        let out = String(html || "");
        out = out.replace(/\{\{\s*slug\s*\}\}/gi, slug);
        out = out.replace(/%7b%7b\s*slug\s*%7d%7d/gi, slug);
        out = out.replace(new RegExp(`/${'{'}{'}'}slug${'{'}{'}'}/`, 'gi'), `/${slug}/`);
        out = out.replace(/(<iframe[^>]*src=")(.*?)("[^>]*>)/gi, (m, p1, url, p3) => {
          try {
            const u = new URL(url, window.location.origin);
            if (u.pathname.startsWith('/dashboard')) {
              u.pathname = `/${slug}/my-bookings`;
              if (!u.searchParams.get('embed')) u.searchParams.set('embed', '1');
            }
            if (!u.searchParams.get('embed')) u.searchParams.set('embed', '1');
            if (!u.searchParams.get('site')) u.searchParams.set('site', slug);
            return `${p1}${u.pathname}${u.search}${p3}`;
          } catch {
            const join = url.includes('?') ? '&' : '?';
            let final = `${url}${join}embed=1&site=${encodeURIComponent(slug)}`;
            final = final.replace(/^\/?dashboard/i, `/${slug}/my-bookings`);
            return `${p1}${final}${p3}`;
          }
        });
        return out;
      } catch {
        return html;
      }
    };

    const mapped = sections.map((s) => {
      if (!s?.props) return s;
      const props = transformLinksDeep(s.props, resolver);
      if (s.type === 'richText' && typeof props.body === 'string') {
        return { ...s, props: { ...props, body: fixIframeBody(props.body) } };
      }
      return { ...s, props };
    });

    return { sections: mapped, styleProps: extractPageStyleProps(currentPage), renderOverride: null };
  }, [currentPage, slug, pages, nav, siteDefaultPageStyle, servicesHref]);

  const pageLayout = useMemo(() => {
    if (renderOverride?.type === "services-classic" || renderOverride?.type === "products" || renderOverride?.type === "basket") {
      return "full";
    }
    return currentPage?.layout ?? currentPage?.content?.meta?.layout ?? "boxed";
  }, [currentPage, renderOverride]);
  const isReviewsPage = currentPage && String(currentPage.slug || '').toLowerCase() === 'reviews';
  const reviewPageStyle = isReviewsPage
    ? (specialPageStyle || extractPageStyleProps(currentPage) || siteDefaultPageStyle || null)
    : null;
  const reviewCardBg = reviewPageStyle
    ? cssColorWithOpacity(
        reviewPageStyle.cardBg || reviewPageStyle.cardColor,
        Number.isFinite(reviewPageStyle?.cardOpacity) ? reviewPageStyle.cardOpacity : undefined
      )
    : null;

  const activePageStyle = useMemo(() => {
    if (isReviewsPage && reviewPageStyle) return reviewPageStyle;
    return specialPageStyle || extractPageStyleProps(currentPage) || siteDefaultPageStyle || null;
  }, [isReviewsPage, reviewPageStyle, specialPageStyle, currentPage, siteDefaultPageStyle]);

  const activePageCssVars = useMemo(
    () => pageStyleToCssVars(activePageStyle),
    [activePageStyle]
  );
  const activePageSurface = useMemo(
    () => pageStyleToBackgroundSx(activePageStyle),
    [activePageStyle]
  );

  const rawSiteTitle =
    settings?.site_title ??
    sitePayload?.settings?.site_title ??
    sitePayload?.site_title ??
    company?.name ??
    slug ??
    "";

  const siteTitle = useMemo(() => {
    const candidate = String(rawSiteTitle || "").trim();
    if (!candidate || PLACEHOLDER_SITE_TITLES.has(candidate)) {
      return company?.name || slug || "Our Business";
    }
    return candidate;
  }, [rawSiteTitle, company?.name, slug]);

  const overrideContent = useMemo(() => {
    if (!renderOverride) return null;
    const styleProps = renderOverride.styleProps || null;
    switch (renderOverride.type) {
      case "services-classic":
        return <ServiceListEmbedded slug={slug} pageStyle={styleProps} />;
      case "products":
        return <ProductListEmbedded slug={slug} pageStyle={styleProps} />;
      case "basket":
        return <MyBasketEmbedded slug={slug} pageStyle={styleProps} />;
      default:
        return null;
    }
  }, [renderOverride, slug]);

  if (loading) {
    return <Box sx={{ p: 6, textAlign: "center" }}><CircularProgress /></Box>;
  }
  if (err) {
    return <Container maxWidth="md" sx={{ py: 6 }}><Alert severity="error">{err}</Alert></Container>;
  }

  return (
    <ThemeRuntimeProvider overrides={runtimeOverrides}>
      <GlobalStyles
        styles={(theme) => {
          const bodyStyles = {
            backgroundColor: activePageSurface?.backgroundColor || theme.palette.background.default,
            color:
              activePageCssVars?.["--page-body-color"] ||
              theme.palette.text.primary,
          };
          if (activePageSurface?.backgroundImage) {
            bodyStyles.backgroundImage = activePageSurface.backgroundImage;
          }
          if (activePageSurface?.backgroundRepeat) {
            bodyStyles.backgroundRepeat = activePageSurface.backgroundRepeat;
          }
          if (activePageSurface?.backgroundSize) {
            bodyStyles.backgroundSize = activePageSurface.backgroundSize;
          }
          if (activePageSurface?.backgroundPosition) {
            bodyStyles.backgroundPosition = activePageSurface.backgroundPosition;
          }
          if (activePageSurface?.backgroundAttachment) {
            bodyStyles.backgroundAttachment = activePageSurface.backgroundAttachment;
          }
          const rootVars = { ...(activePageCssVars || {}) };
          Object.entries(navCssVars).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
              rootVars[key] = value;
            }
          });
          return {
            body: bodyStyles,
            ":root": rootVars,
            a: {
              color:
                activePageCssVars?.["--page-link-color"] ||
                theme.palette.primary.main,
            },
          };
        }}
      />
      <NavStyleHydrator website={sitePayload || settings || {}} scopeSelector=".site-nav" />
      {/* Manager toolbar — only if role === 'manager' (and matches company if both ids exist) */}
      {isManagerForCompany && (
        <AppBar position="sticky" color="transparent" elevation={0} sx={{ borderBottom: "1px solid rgba(0,0,0,0.08)", backdropFilter: "blur(6px)" }}>
          <Toolbar>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexGrow: 1, minWidth: 0 }}>
              <Chip label={`Editing: ${company?.name ?? "Company"}`} size="small" />
              {toolbarMsg && <Chip label={toolbarMsg} color="success" size="small" />}
            </Stack>

            <Tooltip title="Pick theme">
              <IconButton onClick={(e) => setThemeAnchor(e.currentTarget)}><BrushIcon /></IconButton>
            </Tooltip>
            <Menu anchorEl={themeAnchor} open={Boolean(themeAnchor)} onClose={() => setThemeAnchor(null)}>
              {themes.map((t) => (
                <MenuItem key={t.id} selected={Number(settings?.theme?.id) === Number(t.id)} onClick={() => chooseTheme(t.id)}>
                  {t.name}
                </MenuItem>
              ))}
            </Menu>

            {hasServicesClassicPage && (
              <Button
                variant="outlined"
                startIcon={<StorefrontIcon />}
                component={RouterLink}
                to={servicesHref()}
                sx={{ ml: 1 }}
              >
                View Services
              </Button>
            )}

           

            <Button variant="contained" startIcon={<PublishIcon />} onClick={publish} disabled={publishing} sx={{ ml: 1 }}>
              {publishing ? "Publishing…" : "Publish"}
            </Button>

            <Button color="primary" variant="contained" startIcon={<EditIcon />} sx={{ ml: 1 }} onClick={() => setEditorOpen(true)}>
              Edit Site
            </Button>
          </Toolbar>
        </AppBar>
      )}

      {/* PUBLIC NAV */}
      <Box className="site-nav" sx={{ py: 1.25 }}>
        <Container maxWidth="lg">
          <Stack
            direction="row"
            spacing={0}
            alignItems="center"
            sx={{
              gap: `${navStyle.item_spacing}px`,
              flexWrap: "wrap",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                mr: 1.5,
                color: "var(--nav-btn-text, inherit)",
                fontWeight: navStyle.font_weight ?? 600,
                textTransform: navStyle.text_transform ?? "none",
                fontFamily: "var(--nav-brand-font-family, inherit)",
                fontSize: `var(--nav-brand-font-size, ${navStyle.brand_font_size || 20}px)`
              }}
            >
              {siteTitle}
            </Typography>
            <Divider flexItem orientation="vertical" />
            <Stack
              direction="row"
              spacing={0}
              flexWrap="wrap"
              sx={{
                gap: `${navStyle.item_spacing}px`,
                alignItems: "center",
              }}
            >
              {navItemsWithActive.map((item) =>
                item.onClick ? (
                  <Button
                    key={item.key}
                    size="small"
                    className="nav-btn"
                    variant="text"
                    color="inherit"
                    disableElevation
                    onClick={item.onClick}
                    sx={navButtonSx(item.active)}
                  >
                    {item.label}
                  </Button>
                ) : (
                  <Button
                    key={item.key}
                    size="small"
                    variant="text"
                    color="inherit"
                    disableElevation
                    component={RouterLink}
                    to={item.href}
                    sx={navButtonSx(item.active)}
                  >
                    {item.label}
                  </Button>
                )
              )}
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* PAGE CONTENT */}
      <Box sx={{ py: 2 }}>
        {overrideContent ? (
          overrideContent
        ) : (
          <Container maxWidth={pageLayout === "full" ? false : "lg"}>
            {isReviewsPage ? (
              <Box
                sx={{
                  p: { xs: 3, md: 6 },
                  borderRadius: 2,
                  position: "relative",
                  ...(reviewPageStyle?.backgroundColor
                    ? { backgroundColor: reviewPageStyle.backgroundColor }
                    : { bgcolor: "background.paper" }),
                  ...(reviewPageStyle?.backgroundImage
                    ? {
                        backgroundImage: `url(${reviewPageStyle.backgroundImage})`,
                        backgroundSize: reviewPageStyle.backgroundSize || "cover",
                        backgroundPosition: reviewPageStyle.backgroundPosition || "center",
                        backgroundRepeat: reviewPageStyle.backgroundRepeat || "no-repeat",
                        backgroundAttachment: reviewPageStyle.backgroundAttachment || "scroll",
                      }
                    : {}),
                  color: reviewPageStyle?.bodyColor || undefined,
                  '--page-heading-color': reviewPageStyle?.headingColor,
                  '--page-body-color': reviewPageStyle?.bodyColor,
                  '--page-link-color': reviewPageStyle?.linkColor,
                  '--page-heading-font': reviewPageStyle?.headingFont,
                  '--page-body-font': reviewPageStyle?.bodyFont,
                  '--page-card-bg': reviewCardBg || undefined,
                  '--page-card-radius': reviewPageStyle?.cardRadius != null ? `${reviewPageStyle.cardRadius}px` : undefined,
                  '--page-card-shadow': reviewPageStyle?.cardShadow,
                  '--page-card-blur': reviewPageStyle?.cardBlur ? `${reviewPageStyle.cardBlur}px` : undefined,
                  boxShadow: reviewPageStyle?.cardShadow || undefined,
                  backdropFilter: reviewPageStyle?.cardBlur ? `blur(${reviewPageStyle.cardBlur}px)` : undefined,
                }}
              >
                <Typography
                  variant="h5"
                  fontWeight={700}
                  gutterBottom
                  sx={{
                    color: reviewPageStyle?.headingColor || undefined,
                    fontFamily: reviewPageStyle?.headingFont || undefined,
                  }}
                >
                  What clients are saying
                </Typography>
                <PublicReviewList slug={slug} disableShell />
              </Box>
            ) : currentPage ? (
              <RenderSections sections={patchedSections} layout={pageLayout} />
            ) : (
              <Box sx={{ p: { xs: 3, md: 6 }, borderRadius: 2, bgcolor: "background.paper", border: "1px solid rgba(0,0,0,0.06)", textAlign: "center" }}>
                <Typography variant="h3" fontWeight={800} gutterBottom>Welcome to {company?.name ?? "our business"}</Typography>
                <Typography variant="body1" color="text.secondary">We’re getting our site ready. In the meantime, you can browse and book services.</Typography>
                <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
                  <Button size="large" variant="contained" component={RouterLink} to={servicesHref()}>Book now</Button>
                </Stack>
              </Box>
            )}
          </Container>
        )}
      </Box>

      {/* Full-screen editor (still rendered only for managers) */}
      {isManagerForCompany && (
        <Dialog fullScreen open={!!editorOpen} onClose={() => setEditorOpen(false)}>
          <Toolbar sx={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
            <Typography sx={{ flexGrow: 1 }} variant="h6" fontWeight={700}>Visual Site Builder — {company?.name}</Typography>
            <IconButton onClick={() => setEditorOpen(false)}><CloseIcon /></IconButton>
          </Toolbar>
          <DialogContent sx={{ p: 0 }}>
            <VisualSiteBuilder />
          </DialogContent>
        </Dialog>
      )}
    </ThemeRuntimeProvider>
  );
}
