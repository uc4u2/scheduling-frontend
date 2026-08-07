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
import MenuIcon from "@mui/icons-material/Menu";
import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalk";
import NorthEastIcon from "@mui/icons-material/NorthEast";
import { Link as RouterLink } from "react-router-dom";
import CinematicMobileMenu from "./CinematicMobileMenu";
import { FamilyLinkButton } from "../../hvac-shared/runtime";

export default function CinematicHeader({ shell = {}, tokens }) {
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
  } = shell;
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerLogo =
    headerConfig?.logo_asset?.url ||
    headerConfig?.logo_url ||
    site?.company?.logo_url ||
    null;
  const brandName = site?.company?.name || slug || "Schedulaa";
  const utilityText = headerConfig?.text || site?.company?.contact_email || "Trusted HVAC support";
  const ctaLabel = headerConfig?.scroll_cta_label || "Request Service";
  const ctaHref = headerConfig?.scroll_cta_href || `/${slug}?page=contact`;

  const navEntries = useMemo(
    () => [
      ...navLinks.map((item) => ({
        key: `${item.id || item.label}-${item.href}`,
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
      <Box
        sx={{
          display: { xs: "none", md: "block" },
          bgcolor: "rgba(4,8,13,0.92)",
          borderBottom: `1px solid ${tokens.colors.line}`,
          color: tokens.colors.textSoft,
        }}
      >
        <Container maxWidth={false} sx={{ maxWidth: `${tokens.layout.shellMax}px`, px: { md: 4 } }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ minHeight: 42 }}>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <PhoneInTalkIcon sx={{ fontSize: 16, color: tokens.colors.accent }} />
              <Typography sx={{ fontSize: "0.76rem", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                {utilityText}
              </Typography>
            </Stack>
            <Typography sx={{ fontSize: "0.76rem", letterSpacing: "0.14em", textTransform: "uppercase" }}>
              {site?.company?.contact_email || "Heating · Cooling · Service"}
            </Typography>
          </Stack>
        </Container>
      </Box>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: "rgba(6, 10, 15, 0.82)",
          backdropFilter: "blur(14px)",
          borderBottom: `1px solid ${tokens.colors.line}`,
          color: tokens.colors.text,
        }}
      >
        <Container maxWidth={false} sx={{ maxWidth: `${tokens.layout.shellMax}px`, px: { xs: 2, md: 4 } }}>
          <Toolbar disableGutters sx={{ minHeight: { xs: 74, md: 88 }, gap: 2 }}>
            <Stack direction="row" spacing={1.8} alignItems="center" sx={{ flex: { xs: 1, md: "0 0 auto" } }}>
              <Box
                sx={{
                  width: { xs: 44, md: 54 },
                  height: { xs: 44, md: 54 },
                  borderRadius: "50%",
                  border: `1px solid ${alpha(tokens.colors.accent, 0.38)}`,
                  bgcolor: alpha(tokens.colors.accent, 0.08),
                  display: "grid",
                  placeItems: "center",
                  overflow: "hidden",
                }}
              >
                {headerLogo ? (
                  <Box component="img" src={headerLogo} alt={brandName} sx={{ width: "78%", height: "78%", objectFit: "contain" }} />
                ) : (
                  <Typography sx={{ fontFamily: tokens.typography.headingFont, fontWeight: 900, color: tokens.colors.accent }}>
                    {String(brandName || "S").slice(0, 1)}
                  </Typography>
                )}
              </Box>
              <Box>
                <Typography sx={{ fontFamily: tokens.typography.headingFont, fontWeight: 900, fontSize: { xs: "1rem", md: "1.2rem" }, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {brandName}
                </Typography>
                <Typography sx={{ display: { xs: "none", md: "block" }, color: tokens.colors.textSoft, fontSize: "0.78rem", letterSpacing: "0.16em", textTransform: "uppercase" }}>
                  HVAC / Field Service
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1.2} alignItems="center" sx={{ display: { xs: "none", md: "flex" }, ml: "auto", mr: 2 }}>
              {navEntries.map((entry) => (
                <Button
                  key={entry.key}
                  {...(entry.linkProps || {})}
                  onClick={entry.onClick}
                  sx={{
                    color: entry.active ? tokens.colors.text : tokens.colors.textSoft,
                    px: 1.35,
                    py: 0.9,
                    fontFamily: tokens.typography.headingFont,
                    fontWeight: 800,
                    fontSize: "0.86rem",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    position: "relative",
                    "&::after": entry.active
                      ? {
                          content: '""',
                          position: "absolute",
                          left: 12,
                          right: 12,
                          bottom: 4,
                          height: 2,
                          background: `linear-gradient(90deg, ${tokens.colors.accent}, transparent)`,
                        }
                      : undefined,
                  }}
                >
                  {entry.label}
                </Button>
              ))}
            </Stack>

            <FamilyLinkButton
              href={ctaHref}
              label={ctaLabel}
              endIcon={<NorthEastIcon />}
              sx={{
                display: { xs: "none", md: "inline-flex" },
                minHeight: 52,
                px: 2.5,
                borderRadius: 999,
                background: `linear-gradient(135deg, ${tokens.colors.accent} 0%, #ffb65c 100%)`,
                color: "#061019",
                fontFamily: tokens.typography.headingFont,
                fontWeight: 900,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                boxShadow: "0 20px 40px rgba(245,138,31,0.22)",
                "&:hover": {
                  background: `linear-gradient(135deg, ${tokens.colors.accent} 0%, #ffb65c 100%)`,
                  filter: "brightness(1.04)",
                },
              }}
            />

            <IconButton onClick={() => setMobileOpen(true)} sx={{ display: { xs: "inline-flex", md: "none" }, color: tokens.colors.text }}>
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>
      <CinematicMobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} navEntries={navEntries} tokens={tokens} />
    </>
  );
}
