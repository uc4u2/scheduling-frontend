import React, { useEffect, useMemo, useState } from "react";
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
  Drawer,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { alpha, useTheme } from "@mui/material/styles";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import ThemeRuntimeProvider from "./ThemeRuntimeProvider";
import { SOCIAL_ICON_MAP, DEFAULT_SOCIAL_ICON } from "../../utils/socialIcons";
import {
  cloneFooterColumns,
  cloneLegalLinks,
  formatCopyrightText,
} from "../../utils/footerDefaults";
import { api, publicSite } from "../../utils/api";
import { createNavButtonStyles, normalizeNavStyle } from "../../utils/navStyle";
import { getLuminance, pickTextColorForBg } from "../../utils/color";

const clampNumber = (value, min, max, fallback) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  let clamped = num;
  if (typeof min === "number") clamped = Math.max(min, clamped);
  if (typeof max === "number") clamped = Math.min(max, clamped);
  return clamped;
};

const DEFAULT_SOCIAL_LINKS = [
  { icon: "instagram", href: "https://instagram.com/schedulaa" },
  { icon: "linkedin", href: "https://linkedin.com/company/schedulaa" },
];

const alignToFlex = (value, fallback = "flex-start") => {
  switch ((value || "").toLowerCase()) {
    case "center":
      return "center";
    case "right":
    case "far-right":
      return "flex-end";
    case "space-between":
      return "space-between";
    case "space-around":
      return "space-around";
    default:
      return fallback;
  }
};

const inlinePlacementFromAlign = (value, forced) => {
  if (forced) return forced;
  const raw = (value || "").toLowerCase();
  if (raw === "far-left" || raw === "left") return "before";
  if (raw === "center") return "center";
  return "after";
};

const edgePlacement = (value) => {
  const raw = (value || "").toLowerCase();
  if (raw === "center") return { marginLeft: "auto", marginRight: "auto" };
  if (raw === "right" || raw === "far-right") return { marginLeft: "auto" };
  if (raw === "far-left") return { marginRight: "auto" };
  return {};
};

export default function SiteFrame({
  slug,
  activeKey,
  children,
  initialSite = null,
  disableFetch = false,
  wrapChildrenInContainer = true,
  onTogglePageMenu,
}) {
  const theme = useTheme(); // will be overridden by ThemeRuntimeProvider below
  const isPreview = disableFetch && Boolean(initialSite);
  const [site, setSite] = useState(initialSite);
  const [loading, setLoading] = useState(!initialSite && !disableFetch);
  const [err, setErr] = useState("");
  const themeOverrides = site?.theme_overrides || {};
  const nav = useMemo(() => site?.nav_overrides || {}, [site]);
  const menuSource = nav?.menu_source || "pages";
  const [mobileOpen, setMobileOpen] = useState(false);
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
  const linkColor =
    headerConfig?.link_color ||
    footerConfig?.link_color ||
    themeOverrides?.footer?.text ||
    theme.palette.primary.main;
  const rawNavStyle =
    site?.nav_style ||
    site?.settings?.nav_style ||
    site?.website?.nav_style ||
    site?.website_setting?.settings?.nav_style ||
    {};
  const navStyle = useMemo(() => normalizeNavStyle(rawNavStyle), [rawNavStyle]);
  const navButtonSx = useMemo(() => createNavButtonStyles(navStyle), [navStyle]);
  const headerBg = headerConfig?.bg || themeOverrides?.header?.background || "transparent";
  const headerTextColor = headerConfig?.text || themeOverrides?.header?.text || theme.palette.text.primary;
  const navButtonStyling = useMemo(() => {
    const useReadableText = ["ghost", "underline", "overline", "doubleline", "sideline", "sideline-all", "link", "text"].includes(navStyle?.variant);
    const fallbackText = pickTextColorForBg(headerBg);
    const preferred = navStyle?.text || headerTextColor;
    const bgLum = getLuminance(headerBg);
    const prefLum = getLuminance(preferred);
    const readableText =
      bgLum != null && prefLum != null && Math.abs(bgLum - prefLum) < 0.45
        ? fallbackText
        : preferred || fallbackText;
    return (active) => {
      const base = navButtonSx(active);
      if (useReadableText) {
        base.color = readableText;
        if (base["&:hover"]) {
          base["&:hover"] = { ...base["&:hover"], color: readableText };
        }
        if (navStyle?.variant === "ghost") {
          base.border = `1px solid ${readableText}`;
          if (base["&:hover"]) {
            base["&:hover"] = { ...base["&:hover"], border: `1px solid ${readableText}` };
          }
        }
        return base;
      }
      return { ...base, color: active ? base.color : headerTextColor };
    };
  }, [navButtonSx, headerTextColor, headerBg, navStyle?.variant, navStyle?.text, theme.palette.text.primary]);

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
    publicSite
      .getWebsiteShell(slug)
      .then((data) => !cancelled && setSite(data))
      .catch(() => !cancelled && setErr("Failed to load site"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [slug, initialSite, disableFetch]);

  const pages = useMemo(() => {
    const list = Array.isArray(site?.pages)
      ? site.pages
      : Array.isArray(site?.pages_meta)
      ? site.pages_meta
      : [];
    return list
      .filter(p => p.show_in_menu)
      .sort((a,b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [site]);

  // Helpers to build hrefs (match your previous logic)
  const reviewsHref  = () => `/${slug}?page=reviews`;
  const loginHref    = () => `/login`;
  const myBookingsHref = () => `/dashboard`;

  const doLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
    } catch {}
    setMobileOpen(false);
    navigate("/login");
  };

  const handleMobileToggle = () => {
    setMobileOpen(prev => !prev);
  };

  const handleMobileClose = () => {
    setMobileOpen(false);
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

  const pageNavLinks = useMemo(
    () =>
      pages
        .filter((p) => !(p.slug === "login" && clientLoggedIn))
        .filter((p) => !(p.slug === "my-bookings" && !clientLoggedIn))
        .map((p) => ({
          id: p.id,
          label: p.menu_title || p.title || p.slug,
          href: `?page=${encodeURIComponent(p.slug)}`,
        })),
    [pages, slug, clientLoggedIn]
  );

  const navLinks = useMemo(() => {
    const custom = Array.isArray(headerConfig?.nav_items)
      ? headerConfig.nav_items
      : [];
    if (menuSource === "manual" && custom.length) {
      return custom;
    }
    return pageNavLinks;
  }, [headerConfig, pageNavLinks, menuSource]);

  const hasReviewsLink = useMemo(
    () =>
      navLinks.some((item) => {
        const label = (item?.label || "").toLowerCase();
        const href = String(item?.href || "").toLowerCase();
        return label.includes("review") || href.includes("review");
      }),
    [navLinks]
  );

  const deslug = (value) =>
    (value || "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const headerLogo =
    headerConfig?.logo_asset?.url || site?.company?.logo_url || null;
  const headerSocial =
    (Array.isArray(headerConfig?.social_links) && headerConfig.social_links.length
      ? headerConfig.social_links
      : Array.isArray(site?.header?.social_links) && site.header.social_links.length
        ? site.header.social_links
        : DEFAULT_SOCIAL_LINKS) || [];
  const showBrandText = headerConfig?.show_brand_text !== false;
  const headerTextRaw = headerConfig?.text && headerConfig.text.trim();
  const headerText =
    headerTextRaw && /schedulaa/i.test(headerTextRaw) ? null : headerTextRaw;
  const brandName =
    headerText ||
    site?.company?.name ||
    deslug(site?.company?.slug) ||
    deslug(slug) ||
    "Brand";
  const headerPadding = clampNumber(headerConfig?.padding_y ?? 20, 4, 160, 20);
  const logoWidth = clampNumber(headerConfig?.logo_width ?? 140, 40, 360, 140);
  const logoHeight = headerConfig?.logo_height
    ? clampNumber(headerConfig.logo_height, 24, 200, null)
    : null;
  const logoAlign = alignToFlex(headerConfig?.logo_alignment, "flex-start");
  const layoutKey = (headerConfig?.layout || "simple").toLowerCase();
  const isCenterLayout = layoutKey === "center";
  const isSplitLayout = layoutKey === "split";
  const isInlineLayout = !isCenterLayout && !isSplitLayout;
  const navAlignRaw = (headerConfig?.nav_alignment || "right").toLowerCase();
  const navFullWidthCenter = isInlineLayout && navAlignRaw === "center";
  const navAlign = alignToFlex(
    navAlignRaw,
    isCenterLayout ? "center" : "flex-end"
  );
  const socialAlignRaw = (headerConfig?.social_alignment || "right").toLowerCase();
  const socialAlign = alignToFlex(socialAlignRaw, "flex-end");
  const socialPosition = (headerConfig?.social_position || "inline").toLowerCase();
  const socialInline = ["inline", "after"].includes(socialPosition);
  const socialInlinePlacement = socialInline
    ? inlinePlacementFromAlign(
        socialAlignRaw,
        socialPosition === "after" ? "after" : null
      )
    : null;
  const headerFullWidth = headerConfig?.full_width !== false;
  const headerGridColumns = isCenterLayout
    ? "1fr"
    : isSplitLayout
      ? { xs: "1fr", md: "auto 1fr" }
      : navFullWidthCenter
        ? { xs: "1fr", md: "auto minmax(0, 1fr) auto" }
        : { xs: "1fr", md: "auto 1fr" };
  const alignToGridSelf = (value, fallback = "start") => {
    const raw = (value || "").toLowerCase();
    if (raw === "center") return "center";
    if (raw === "right" || raw === "far-right") return "end";
    if (raw === "far-left") return "start";
    return fallback;
  };
  const logoSelf = alignToGridSelf(headerConfig?.logo_alignment, "start");
  const navSelf = alignToGridSelf(
    headerConfig?.nav_alignment,
    isCenterLayout ? "center" : "end"
  );
  const logoEdgePlacement = edgePlacement(headerConfig?.logo_alignment);
  const navEdgePlacement = navFullWidthCenter ? {} : edgePlacement(headerConfig?.nav_alignment);
  const brandGridColumn = isCenterLayout
    ? "1 / -1"
    : navFullWidthCenter
      ? { xs: "1 / -1", md: "1 / 2" }
      : {
          xs: "1 / -1",
          md: isSplitLayout ? "auto" : "auto",
        };
  const navGridColumn = isCenterLayout
    ? "1 / -1"
    : navFullWidthCenter
      ? { xs: "1 / -1", md: "2 / 3" }
      : {
          xs: "1 / -1",
          md: isSplitLayout ? "auto" : "auto",
        };

  const renderBrandContent = (showEmptyHint = false, hideText = false) => (
    <>
      {headerLogo && (
        <Box
          component="img"
          src={headerLogo}
          alt={brandName}
          sx={{
            width: `${logoWidth}px`,
            height: logoHeight ? `${logoHeight}px` : "auto",
            objectFit: "contain",
          }}
        />
      )}
      {showBrandText && !hideText && (
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {brandName}
        </Typography>
      )}
      {showEmptyHint && !headerHasContent && isPreview && (
        <Typography
          variant="caption"
          sx={{ opacity: 0.7, fontWeight: 500 }}
        >
          Add header text/logo in Branding → Header
        </Typography>
      )}
    </>
  );

  const renderSessionButtons = (onItemClick) =>
    clientLoggedIn ? (
      <>
        <Button
          component={RouterLink}
          to={myBookingsHref()}
          color="inherit"
          onClick={onItemClick}
          sx={navButtonStyling(pathname.startsWith("/dashboard"))}
        >
          {nav.mybookings_tab_label || "My Bookings"}
        </Button>
        <Button onClick={doLogout} color="inherit" sx={navButtonStyling(false)}>
          {nav.logout_tab_label || "Log out"}
        </Button>
      </>
    ) : (
      <Button
        component={RouterLink}
        to={loginHref()}
        color="inherit"
        onClick={onItemClick}
        sx={navButtonStyling(pathname === "/login")}
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
        <IconButton
          edge="start"
          sx={{ display: { xs: "inline-flex", md: "none" } }}
          onClick={handleMobileToggle}
        >
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
          {!hasReviewsLink && nav.show_reviews_tab !== false && (
            <Button component={RouterLink} to={reviewsHref()} color={pathname.includes("/reviews") ? "primary" : "inherit"}>
              {nav.reviews_tab_label || "Reviews"}
            </Button>
          )}

          {/* auth-aware */}
          {renderSessionButtons()}
        </Stack>

        <Box sx={{ ml: "auto" }} />
      </Toolbar>
    </AppBar>
  );

  const headerHasContent = Boolean(
    headerConfig &&
      (headerLogo ||
        headerConfig.text ||
        (Array.isArray(headerConfig?.nav_items) &&
          headerConfig.nav_items.length) ||
        headerSocial.length)
  );

  const renderSocialIcons = ({ inline = false, placement = "after" } = {}) => {
    if (!headerSocial.length) return null;
    return (
      <Stack
        direction="row"
        spacing={0.5}
        flexWrap={inline ? "nowrap" : "wrap"}
        alignItems="center"
        justifyContent={inline ? "flex-start" : socialAlign}
        sx={{
          width: inline ? "auto" : "100%",
          flexShrink: inline ? 0 : undefined,
          mt: inline ? 0 : 1,
          ml: inline && placement === "after" ? 1.5 : 0,
          mr: inline && placement === "before" ? 1.5 : 0,
          ...(inline && placement === "center"
            ? { marginLeft: "auto", marginRight: "auto" }
            : {}),
        }}
      >
        {headerSocial.map((item, idx) => {
          const Icon =
            SOCIAL_ICON_MAP[item?.icon?.toLowerCase()] || DEFAULT_SOCIAL_ICON;
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
    );
  };

  const navButtons = (
    <>
      {navLinks.map((item, idx) => {
        const props = resolveLinkProps(item.href);
        const active = Boolean(props?.to && pathname.includes(String(props.to).split("?")[0]));
        return (
          <Box
            key={`${item.label}-${idx}`}
            sx={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              "&:hover .nav-remove": { opacity: 1, pointerEvents: "auto" },
            }}
          >
            <Button
              {...props}
              color="inherit"
              size="small"
              sx={navButtonStyling(active)}
            >
              {item.label || "Link"}
            </Button>
            {isPreview && onTogglePageMenu && item.id ? (
              <IconButton
                size="small"
                className="nav-remove"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onTogglePageMenu(item.id);
                }}
                sx={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                  boxShadow: 1,
                  opacity: 0,
                  pointerEvents: "none",
                  "&:hover": { bgcolor: "background.default" },
                }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            ) : null}
          </Box>
        );
      })}
      {!hasReviewsLink && nav.show_reviews_tab !== false && (
        <Button
          component={RouterLink}
          to={reviewsHref()}
          color={pathname.includes("/reviews") ? "primary" : "inherit"}
          size="small"
          sx={navButtonStyling(pathname.includes("/reviews"))}
        >
          {nav.reviews_tab_label || "Reviews"}
        </Button>
      )}
      {renderSessionButtons()}
    </>
  );

  const mobileNavButtons = (
    <Stack spacing={1} alignItems="stretch">
      {navLinks.map((item, idx) => {
        const props = resolveLinkProps(item.href);
        const active = Boolean(props?.to && pathname.includes(String(props.to).split("?")[0]));
        return (
          <Button
            key={`${item.label}-${idx}`}
            {...props}
            color="inherit"
            fullWidth
            sx={{ ...navButtonStyling(active), justifyContent: "flex-start" }}
            onClick={handleMobileClose}
          >
            {item.label || "Link"}
          </Button>
        );
      })}
      {!hasReviewsLink && nav.show_reviews_tab !== false && (
        <Button
          component={RouterLink}
          to={reviewsHref()}
          color={pathname.includes("/reviews") ? "primary" : "inherit"}
          fullWidth
          sx={{ ...navButtonStyling(pathname.includes("/reviews")), justifyContent: "flex-start" }}
          onClick={handleMobileClose}
        >
          {nav.reviews_tab_label || "Reviews"}
        </Button>
      )}
      {renderSessionButtons(handleMobileClose)}
    </Stack>
  );

  const headerNode = headerConfig ? (
    <Box
      component="header"
      sx={{
        "--page-link-color": linkColor,
        position: headerConfig.sticky === false ? "relative" : "sticky",
        top: 0,
        zIndex: 30,
        borderBottom: (theme) => `1px solid ${alpha(theme.palette.divider, 0.4)}`,
        backgroundColor: headerConfig.bg || theme.palette.background.paper,
        color: headerConfig.text || theme.palette.text.primary,
      }}
    >
      <Container
        sx={{ py: `${headerPadding}px` }}
        maxWidth={headerFullWidth ? false : "lg"}
        disableGutters={headerFullWidth}
      >
        {socialPosition === "above" && renderSocialIcons()}
        <Box
          sx={{
            display: "grid",
            gap: { xs: 1.5, md: 3 },
            gridTemplateColumns: headerGridColumns,
            alignItems: "center",
          }}
        >
          <Stack
            direction="row"
            spacing={1.25}
            alignItems="center"
            justifyContent={{ xs: "space-between", md: logoAlign }}
            sx={{
              width: "100%",
              maxWidth:
                headerConfig.layout === "split" && !headerFullWidth
                  ? { md: 420 }
                  : "100%",
              justifySelf: { xs: "stretch", md: logoSelf },
              gridColumn: brandGridColumn,
              ...logoEdgePlacement,
            }}
          >
            <Stack direction="row" spacing={1.25} alignItems="center">
              {renderBrandContent(true)}
            </Stack>
            <IconButton
              onClick={handleMobileToggle}
              sx={{ display: { xs: "inline-flex", md: "none" } }}
            >
              <MenuIcon />
            </IconButton>
          </Stack>
          <Box
            sx={{
              flex: 1,
              width: "100%",
              display: "flex",
              justifySelf: { xs: "stretch", md: navSelf },
              gridColumn: navGridColumn,
              ...navEdgePlacement,
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              justifyContent={navAlign}
              sx={{ flex: 1, display: { xs: "none", md: "flex" } }}
            >
              {socialInline && socialInlinePlacement === "before" &&
                renderSocialIcons({ inline: true, placement: "before" })}
              {navButtons}
              {socialInline && socialInlinePlacement !== "before" &&
                renderSocialIcons({
                  inline: true,
                  placement: socialInlinePlacement || "after",
                })}
            </Stack>
          </Box>
          {navFullWidthCenter && (
            <Stack
              aria-hidden
              direction="row"
              spacing={1.25}
              alignItems="center"
              sx={{
                display: { xs: "none", md: "flex" },
                visibility: "hidden",
                pointerEvents: "none",
                gridColumn: { md: "3 / 4" },
              }}
            >
              {renderBrandContent(false)}
            </Stack>
          )}
        </Box>
        {socialPosition === "below" && renderSocialIcons()}
      </Container>
    </Box>
  ) : (
    defaultHeader
  );

  const footerLogo =
    footerConfig?.logo_asset?.url || site?.company?.logo_url || null;
  const footerColumns =
    (Array.isArray(footerConfig?.columns) && footerConfig.columns.length
      ? footerConfig.columns
      : cloneFooterColumns()) || [];
  const footerSocial =
    (Array.isArray(footerConfig?.social_links) && footerConfig.social_links.length
      ? footerConfig.social_links
      : Array.isArray(site?.footer?.social_links) && site.footer.social_links.length
        ? site.footer.social_links
        : DEFAULT_SOCIAL_LINKS) || [];
  const footerLegal =
    (Array.isArray(footerConfig?.legal_links) && footerConfig.legal_links.length
      ? footerConfig.legal_links
      : cloneLegalLinks()) || [];
  const showCopyright = footerConfig?.show_copyright !== false;
  const copyrightText = formatCopyrightText(footerConfig?.copyright_text, {
    company: site?.company?.name,
    slug,
  });
  const footerTextRaw = footerConfig?.text && footerConfig.text.trim();
  const footerText =
    footerTextRaw && /schedulaa/i.test(footerTextRaw) ? null : footerTextRaw;
  const footerHasContent =
    footerConfig &&
    (footerText ||
      footerColumns.length ||
      footerSocial.length ||
      footerLegal.length);

  const footerTextColor =
    footerConfig?.text_color ||
    themeOverrides?.footer?.text ||
    theme.palette.text.primary;
  const footerLinkColor =
    footerConfig?.link_color ||
    footerTextColor ||
    linkColor;
  const footerHeadingColor = footerLinkColor;

  const footerNode = footerConfig ? (
    <Box
      component="footer"
      sx={{
        "--page-link-color": footerLinkColor,
        backgroundColor:
          footerConfig.bg || alpha(theme.palette.text.primary, 0.04),
        color: footerTextColor,
        mt: 8,
      }}
    >
      <Container sx={{ py: 6 }}>
        {footerLogo && (
          <Box
            component="img"
            src={footerLogo}
            alt={site?.company?.name || slug}
            sx={{ height: 48, width: "auto", maxWidth: 200, objectFit: "contain", mb: 2 }}
          />
        )}
        {(footerText || (isPreview && !footerHasContent)) && (
          <Typography
            variant="body1"
            sx={{ mb: 3, maxWidth: 640, color: footerHeadingColor }}
          >
            {footerText || "Add footer copy in Branding → Footer"}
          </Typography>
        )}
        {footerColumns.length > 0 && (
          <Grid container spacing={4} sx={{ mb: 3 }}>
            {footerColumns.map((col, idx) => (
              <Grid item xs={12} md={Math.max(3, Math.floor(12 / footerColumns.length))} key={`footer-col-${idx}`}>
                {col.title && (
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    sx={{ mb: 1, color: footerHeadingColor }}
                  >
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
                        color="var(--page-link-color)"
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
                SOCIAL_ICON_MAP[item?.icon?.toLowerCase()] || DEFAULT_SOCIAL_ICON;
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
                    color="var(--page-link-color)"
                    underline="hover"
                    sx={{ fontSize: "0.875rem" }}
                  >
                    {link.label || link.href}
                  </MuiLink>
                );
              })}
            </Stack>
            {showCopyright && (
              <Typography
                variant="caption"
                sx={{ mt: 2, display: "block", opacity: 0.8 }}
              >
                {copyrightText}
              </Typography>
            )}
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
      <Drawer
        anchor="top"
        open={mobileOpen}
        onClose={handleMobileClose}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            pt: 2,
            pb: 3,
            px: 2.5,
            backgroundColor: theme.palette.background.paper,
          },
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            {site?.company?.name || slug}
          </Typography>
          <IconButton onClick={handleMobileClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        {mobileNavButtons}
      </Drawer>
      {wrapChildrenInContainer ? (
        <Container sx={{ py: { xs: 3, md: 5 } }}>{children}</Container>
      ) : (
        children
      )}
      {footerNode}
    </ThemeRuntimeProvider>
  );
}
