import React, { useMemo, useState } from "react";
import { alpha, AppBar, Box, Button, Container, IconButton, Stack, Toolbar, Typography } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import { Link as RouterLink } from "react-router-dom";
import ComfortMobileMenu from "./ComfortMobileMenu";
import { FamilyLinkButton } from "../../hvac-shared/runtime";

export default function ComfortHeader({ shell = {}, tokens }) {
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
  const brandName = (headerConfig?.text || "").trim() || site?.company?.name || slug || "Schedulaa";
  const brandTagline = (headerConfig?.tagline || "").trim();
  const logo = headerConfig?.logo_asset?.url || headerConfig?.logo_url || site?.company?.logo_url || "";
  const ctaLabel = headerConfig?.scroll_cta_label || "Request service";
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
        ? [{ key: "reviews", label: nav.reviews_tab_label || "Reviews", linkProps: { component: RouterLink, to: reviewsHref() }, active: isReviewsActive }]
        : []),
      ...(clientLoggedIn
        ? [
            ...(!hasMyBookingsLink && nav.show_my_bookings_tab !== false
              ? [{ key: "my-bookings", label: nav.my_bookings_tab_label || "My Bookings", linkProps: { component: RouterLink, to: myBookingsHref() }, active: pathname.startsWith("/dashboard") }]
              : []),
            { key: "logout", label: nav.logout_tab_label || "Log out", onClick: doLogout },
          ]
        : !hasLoginLink && nav.show_login_tab !== false
        ? [{ key: "login", label: nav.login_tab_label || "Login", linkProps: { component: RouterLink, to: loginHref() }, active: pathname === "/login" }]
        : []),
    ],
    [clientLoggedIn, doLogout, hasLoginLink, hasMyBookingsLink, hasReviewsLink, isPreview, isReviewsActive, loginHref, myBookingsHref, nav, navLinks, pathname, resolveLinkProps, reviewsHref]
  );

  return (
    <>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: alpha("#fffdf9", 0.92), backdropFilter: "blur(12px)", color: tokens.colors.text, borderBottom: `1px solid ${tokens.colors.line}` }}>
        <Container maxWidth={false} sx={{ maxWidth: `${tokens.layout.shellMax}px`, px: { xs: 2, md: 4 } }}>
          <Toolbar disableGutters sx={{ minHeight: { xs: 78, md: 96 }, gap: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
              <Box sx={{ width: 70, height: 70, borderRadius: "50%", bgcolor: "#fff", border: `1px solid ${tokens.colors.line}`, display: "grid", placeItems: "center", overflow: "hidden" }}>
                {logo ? <Box component="img" src={logo} alt={brandName} sx={{ width: "78%", height: "78%", objectFit: "contain" }} /> : <Typography sx={{ fontFamily: tokens.typography.headingFont, fontWeight: 700 }}>{String(brandName).slice(0, 1)}</Typography>}
              </Box>
              <Box>
                <Typography sx={{ fontFamily: tokens.typography.headingFont, fontWeight: 700, fontSize: { xs: "1.05rem", md: "1.3rem" } }}>{brandName}</Typography>
                {brandTagline ? <Typography sx={{ color: tokens.colors.textMuted, fontSize: "0.88rem" }}>{brandTagline}</Typography> : null}
              </Box>
            </Stack>
            <Stack direction="row" spacing={0.6} alignItems="center" sx={{ display: { xs: "none", lg: "flex" }, mr: 1.5 }}>
              {navEntries.map((entry) => (
                <Box key={entry.key} sx={{ position: "relative", "&:hover .nav-remove": isPreview ? { opacity: 1, pointerEvents: "auto" } : undefined }}>
                  <Button
                    {...(entry.linkProps || {})}
                    onClick={isPreview && entry.id && onPreviewOpenPage ? (e) => { e.preventDefault(); e.stopPropagation(); onPreviewOpenPage(entry.rawItem || { id: entry.id, label: entry.label }); } : entry.onClick}
                    sx={{
                      px: 1.45,
                      py: 0.8,
                      borderRadius: 999,
                      color: entry.active ? tokens.colors.navy : tokens.colors.textSoft,
                      bgcolor: entry.active ? alpha(tokens.colors.sky, 0.2) : "transparent",
                      fontWeight: entry.active ? 800 : 700,
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
                      sx={{ position: "absolute", top: -6, right: -6, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", opacity: 0, pointerEvents: "none" }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  ) : null}
                </Box>
              ))}
            </Stack>
            <FamilyLinkButton href={ctaHref} label={ctaLabel} endIcon={<ArrowOutwardIcon />} sx={{ display: { xs: "none", md: "inline-flex" }, minHeight: 50, px: 2.4, borderRadius: 999, background: `linear-gradient(135deg, ${tokens.colors.navy} 0%, ${tokens.colors.teal} 100%)`, color: "#fff", fontWeight: 800, whiteSpace: "nowrap" }} />
            <IconButton sx={{ display: { lg: "none" }, color: tokens.colors.text }} onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>
      <ComfortMobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} entries={navEntries} brandName={brandName} ctaHref={ctaHref} ctaLabel={ctaLabel} tokens={tokens} />
    </>
  );
}
