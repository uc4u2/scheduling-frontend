import React, { useMemo, useState } from "react";
import {
  alpha,
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MenuIcon from "@mui/icons-material/Menu";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import { Link as RouterLink } from "react-router-dom";
import CorporateMobileMenu from "./CorporateMobileMenu";
import { FamilyLinkButton } from "../../hvac-shared/runtime";

export default function CorporateHeader({ shell = {}, tokens }) {
  const {
    slug,
    site,
    headerConfig,
    nav,
    navLinks = [],
    pathname,
    isPreview,
    resolveLinkProps,
    reviewsHref,
    loginHref,
    myBookingsHref,
    clientLoggedIn,
    hasReviewsLink,
    hasLoginLink,
    hasMyBookingsLink,
    isReviewsActive,
    doLogout,
    onTogglePageMenu,
    onPreviewOpenPage,
  } = shell;
  const [mobileOpen, setMobileOpen] = useState(false);
  const showBrandText = headerConfig?.show_brand_text !== false;
  const brandName =
    (headerConfig?.text || "").trim() ||
    site?.company?.name ||
    slug ||
    "Schedulaa";
  const brandTagline = (headerConfig?.tagline || "").trim();
  const logo =
    headerConfig?.logo_asset?.url ||
    headerConfig?.logo_url ||
    site?.company?.logo_url ||
    "";
  const logoWidth = Math.max(
    68,
    Math.min(220, Number(headerConfig?.logo_width || 140) || 140)
  );
  const ctaLabel = headerConfig?.scroll_cta_label || "Request Service";
  const ctaHref = headerConfig?.scroll_cta_href || `/${slug}?page=contact`;

  const navEntries = useMemo(
    () => [
      ...navLinks.map((item) => ({
        key: `${item.id || item.label}-${item.href}`,
        id: item.id,
        rawItem: item,
        label: item.label || "Link",
        linkProps: resolveLinkProps(item.href),
        active:
          Boolean(item?.href && String(item.href).startsWith("?page=") && pathname.includes(String(item.href).replace("?", ""))) ||
          Boolean(item?.href && String(item.href).startsWith("/") && pathname === String(item.href)),
      })),
      ...(!isPreview && !hasReviewsLink && nav.show_reviews_tab !== false
        ? [
            {
              key: "reviews",
              label: nav.reviews_tab_label || "Reviews",
              linkProps: { component: RouterLink, to: reviewsHref() },
              active: isReviewsActive,
            },
          ]
        : []),
      ...(clientLoggedIn
        ? [
            ...(!hasMyBookingsLink && nav.show_my_bookings_tab !== false
              ? [
                  {
                    key: "my-bookings",
                    label: nav.my_bookings_tab_label || "My Bookings",
                    linkProps: { component: RouterLink, to: myBookingsHref() },
                    active: pathname.startsWith("/dashboard"),
                  },
                ]
              : []),
            { key: "logout", label: nav.logout_tab_label || "Log out", onClick: doLogout },
          ]
        : !hasLoginLink && nav.show_login_tab !== false
        ? [
            {
              key: "login",
              label: nav.login_tab_label || "Login",
              linkProps: { component: RouterLink, to: loginHref() },
              active: pathname === "/login",
            },
          ]
        : []),
    ],
    [
      clientLoggedIn,
      doLogout,
      hasLoginLink,
      hasMyBookingsLink,
      hasReviewsLink,
      isPreview,
      isReviewsActive,
      loginHref,
      myBookingsHref,
      nav,
      navLinks,
      pathname,
      resolveLinkProps,
      reviewsHref,
    ]
  );

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: alpha("#ffffff", 0.92),
          backdropFilter: "blur(12px)",
          color: tokens.colors.text,
          borderBottom: `1px solid ${tokens.colors.line}`,
        }}
      >
        <Container maxWidth={false} sx={{ maxWidth: `${tokens.layout.shellMax}px`, px: { xs: 2, md: 4 } }}>
          <Toolbar disableGutters sx={{ minHeight: { xs: 76, md: 94 }, gap: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: { xs: 1, md: "0 0 auto" } }}>
              <Box
                sx={{
                  px: 1.5,
                  py: 1,
                  minWidth: Math.max(68, Math.min(160, logoWidth)),
                  borderRadius: 2,
                  background: "linear-gradient(135deg, #ffffff 0%, #eaf2f8 100%)",
                  border: `1px solid ${tokens.colors.line}`,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {logo ? (
                  <Box component="img" src={logo} alt={brandName} sx={{ maxWidth: logoWidth, width: "100%", maxHeight: 56, objectFit: "contain" }} />
                ) : (
                  <Typography sx={{ fontFamily: tokens.typography.headingFont, fontWeight: 800, color: tokens.colors.navy }}>
                    {brandName}
                  </Typography>
                )}
              </Box>
              {showBrandText ? (
                <Box sx={{ display: { xs: "none", md: "block" } }}>
                  <Typography sx={{ fontFamily: tokens.typography.headingFont, fontWeight: 800, fontSize: "1.05rem" }}>
                    {brandName}
                  </Typography>
                  {brandTagline ? (
                    <Typography sx={{ color: tokens.colors.textMuted, fontSize: "0.88rem" }}>
                      {brandTagline}
                    </Typography>
                  ) : null}
                </Box>
              ) : null}
            </Stack>

            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              sx={{ display: { xs: "none", md: "flex" }, ml: "auto" }}
            >
              {navEntries.map((entry) => (
                <Box
                  key={entry.key}
                  sx={{
                    position: "relative",
                    "&:hover .nav-remove": isPreview ? { opacity: 1, pointerEvents: "auto" } : undefined,
                  }}
                >
                  <Button
                    {...(entry.linkProps || {})}
                    onClick={
                      isPreview && entry.id && onPreviewOpenPage
                        ? (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onPreviewOpenPage(entry.rawItem || { id: entry.id, label: entry.label });
                          }
                        : entry.onClick
                    }
                    sx={{
                      px: 1.5,
                      py: 0.8,
                      color: entry.active ? tokens.colors.navy : tokens.colors.textSoft,
                      fontFamily: tokens.typography.headingFont,
                      fontWeight: entry.active ? 800 : 700,
                      borderBottom: entry.active ? `2px solid ${tokens.colors.teal}` : "2px solid transparent",
                      borderRadius: 0,
                    }}
                  >
                    {entry.label}
                  </Button>
                  {isPreview && onTogglePageMenu && entry.id ? (
                    <IconButton
                      size="small"
                      className="nav-remove"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onTogglePageMenu(entry.id);
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
              ))}
            </Stack>

            <FamilyLinkButton
              href={ctaHref}
              label={ctaLabel}
              endIcon={<ArrowOutwardIcon />}
              sx={{
                display: { xs: "none", md: "inline-flex" },
                ml: 1.5,
                minHeight: 48,
                px: 2.5,
                borderRadius: 999,
                minWidth: "max-content",
                whiteSpace: "nowrap",
                background: `linear-gradient(135deg, ${tokens.colors.teal} 0%, ${tokens.colors.sky} 100%)`,
                color: "#ffffff",
                fontFamily: tokens.typography.headingFont,
                fontWeight: 800,
                flexShrink: 0,
                boxShadow: "0 18px 36px rgba(19,125,134,0.18)",
              }}
            />

            <IconButton sx={{ display: { xs: "inline-flex", md: "none" } }} onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>
      <CorporateMobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} navEntries={navEntries} tokens={tokens} />
    </>
  );
}
