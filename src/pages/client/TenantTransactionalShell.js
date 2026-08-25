import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  CssBaseline,
  Stack,
  ThemeProvider,
  Typography,
  createTheme,
} from "@mui/material";
import { useLocation, useParams } from "react-router-dom";

import Meta from "../../components/Meta";
import { publicSite } from "../../utils/api";
import {
  buildTenantTransactionalBrandingContract,
  resolveTransactionalReturnTo,
} from "../../utils/tenantTransactionalBranding";
import { getTenantHostMode } from "../../utils/tenant";
import { persistTenantSlug, resolveTenantSlug } from "../../utils/clientTenant";

const TenantTransactionalContext = createContext(null);

export function useTenantTransactionalShell() {
  return useContext(TenantTransactionalContext);
}

const shellButtonSx = (contract) => ({
  borderRadius: `${contract?.tokens?.radius || 12}px`,
  textTransform: "none",
  fontWeight: 700,
});

export default function TenantTransactionalShell({
  slugOverride = "",
  legacyShell = null,
  activeKey = "__services",
  pagePath = "",
  returnTo = "",
  children,
}) {
  const { slug: routeSlug } = useParams();
  const location = useLocation();
  const hostMode = getTenantHostMode();
  const slug = useMemo(
    () =>
      resolveTenantSlug({
        explicitSlug: slugOverride,
        routeSlug,
        search: location.search,
      }),
    [location.search, routeSlug, slugOverride]
  );
  const [shellPayload, setShellPayload] = useState(null);
  const [loading, setLoading] = useState(Boolean(slug || hostMode === "custom"));
  const [error, setError] = useState("");
  const isEmbedded = useMemo(
    () => new URLSearchParams(location.search || "").get("embed") === "1",
    [location.search]
  );

  useEffect(() => {
    if (slug) persistTenantSlug(slug);
  }, [slug]);

  useEffect(() => {
    let mounted = true;
    if (!slug && hostMode !== "custom") {
      setLoading(false);
      setShellPayload(null);
      return () => {
        mounted = false;
      };
    }
    setLoading(true);
    setError("");
    const request =
      hostMode === "custom"
        ? publicSite.getWebsiteShellByHost().catch(() => (slug ? publicSite.getWebsiteShell(slug) : null))
        : publicSite.getWebsiteShell(slug);
    Promise.resolve(request)
      .then((data) => {
        if (!mounted) return;
        setShellPayload(data || null);
      })
      .catch((err) => {
        if (!mounted) return;
        setShellPayload(null);
        setError(err?.response?.data?.error || err?.message || "Unable to load tenant branding.");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [hostMode, slug]);

  const brandingContract = useMemo(
    () =>
      buildTenantTransactionalBrandingContract(shellPayload, {
        pagePath,
        currentOrigin:
          typeof window !== "undefined" ? window.location.origin : "",
      }),
    [pagePath, shellPayload]
  );

  useEffect(() => {
    if (!isEmbedded || !brandingContract?.isNextJsTenant || typeof window === "undefined") return;
    // The Next bridge keeps its themed loading cover in place until this
    // legacy-owned transactional content has its renderer-aware shell.
    window.parent?.postMessage({ type: "schedulaa:transactional-ready" }, "*");
  }, [brandingContract?.isNextJsTenant, isEmbedded]);

  // Do not briefly render the legacy public shell while the published
  // renderer decision is still loading. That produced a white/light flash
  // inside Next-hosted transactional frames before their Next theme arrived.
  if (loading && !shellPayload) {
    return (
      <Box
        sx={{
          minHeight: isEmbedded ? "100%" : "100vh",
          display: "grid",
          placeItems: "center",
          bgcolor: "#120d0b",
          color: "#f5ead8",
        }}
      >
        <CircularProgress size={28} sx={{ color: "#b77947" }} />
      </Box>
    );
  }

  if (!brandingContract?.isNextJsTenant) {
    return typeof legacyShell === "function" ? legacyShell(children, shellPayload) : <>{children}</>;
  }

  const transactionalTheme = createTheme({
    palette: {
      mode: brandingContract.visualThemeKey === "iron-ember" || brandingContract.visualThemeKey === "eldora-dark" || brandingContract.visualThemeKey === "harbor-line" ? "dark" : "light",
      primary: { main: brandingContract.tokens.primary, contrastText: brandingContract.tokens.buttonText },
      secondary: { main: brandingContract.tokens.accent },
      background: { default: brandingContract.tokens.background, paper: brandingContract.tokens.surface },
      text: { primary: brandingContract.tokens.text, secondary: brandingContract.tokens.textMuted },
    },
    shape: { borderRadius: brandingContract.tokens.radius || 12 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: brandingContract.tokens.background,
            color: brandingContract.tokens.text,
            "--page-surface-bg": brandingContract.tokens.surface,
            "--page-calendar-surface": brandingContract.tokens.surface,
            "--page-card-bg": brandingContract.tokens.surface,
            "--page-secondary-bg": brandingContract.tokens.surfaceAlt,
            "--page-body-color": brandingContract.tokens.text,
            "--page-heading-color": brandingContract.tokens.text,
            "--page-border-color": brandingContract.tokens.border,
            "--page-btn-bg": brandingContract.tokens.primary,
            "--page-btn-bg-hover": brandingContract.tokens.accent,
            "--page-btn-color": brandingContract.tokens.buttonText,
            "--page-btn-bg-soft": brandingContract.tokens.surfaceAlt,
            "--page-calendar-accent": brandingContract.tokens.primary,
            "--page-calendar-accent-contrast": brandingContract.tokens.buttonText,
            "--sched-primary": brandingContract.tokens.primary,
          },
        },
      },
      MuiPaper: { styleOverrides: { root: { backgroundColor: `${brandingContract.tokens.surface} !important`, backgroundImage: "none !important", color: `${brandingContract.tokens.text} !important`, borderColor: `${brandingContract.tokens.border} !important` } } },
      MuiTypography: { styleOverrides: { root: { color: `${brandingContract.tokens.text} !important` } } },
      MuiButton: { styleOverrides: { containedPrimary: { backgroundColor: `${brandingContract.tokens.primary} !important`, color: `${brandingContract.tokens.buttonText} !important` }, outlined: { borderColor: `${brandingContract.tokens.primary} !important`, color: `${brandingContract.tokens.accent} !important` } } },
      MuiChip: { styleOverrides: { root: { backgroundColor: `${brandingContract.tokens.surfaceAlt} !important`, color: `${brandingContract.tokens.text} !important` } } },
    },
  });

  const backHref = resolveTransactionalReturnTo({
    brandingContract,
    returnTo,
    fallbackPagePath: pagePath,
  });

  return (
    <ThemeProvider theme={transactionalTheme}>
      <CssBaseline />
      <TenantTransactionalContext.Provider
      value={{
        shellPayload,
        brandingContract,
        activeKey,
      }}
    >
      <Meta title={`${brandingContract.companyName} | Secure client flow`} robots="noindex, nofollow" />
      <Box
        sx={{
          minHeight: isEmbedded ? "100%" : "100vh",
          bgcolor: brandingContract.tokens.background,
          color: brandingContract.tokens.text,
          backgroundImage:
            brandingContract.visualThemeKey === "modern-gradient"
              ? `radial-gradient(circle at top right, ${brandingContract.tokens.accent}22, transparent 28%), linear-gradient(180deg, ${brandingContract.tokens.background} 0%, ${brandingContract.tokens.surfaceAlt} 100%)`
              : "none",
        }}
      >
        {!isEmbedded ? <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            borderBottom: `1px solid ${brandingContract.tokens.border}`,
            bgcolor: `${brandingContract.tokens.surface}ee`,
            backdropFilter: "blur(14px)",
          }}
        >
          <Container maxWidth="lg">
            <Stack
              direction={{ xs: "column", md: "row" }}
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
              spacing={2}
              sx={{ py: 2.25 }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                {brandingContract.logoUrl ? (
                  <Box
                    component="img"
                    src={brandingContract.logoUrl}
                    alt={brandingContract.companyName}
                    sx={{ width: 40, height: 40, borderRadius: 2, objectFit: "cover" }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: brandingContract.tokens.primary,
                      color: brandingContract.tokens.buttonText,
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 800,
                    }}
                  >
                    {String(brandingContract.companyName || "S").charAt(0).toUpperCase()}
                  </Box>
                )}
                <Box>
                  <Typography sx={{ fontWeight: 800 }}>{brandingContract.companyName}</Typography>
                  <Typography variant="body2" sx={{ color: brandingContract.tokens.textMuted }}>
                    Secure client flow
                  </Typography>
                </Box>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignItems={{ xs: "stretch", sm: "center" }}>
                {brandingContract.contactPhone ? (
                  <Typography variant="body2" sx={{ color: brandingContract.tokens.textMuted }}>
                    {brandingContract.contactPhone}
                  </Typography>
                ) : null}
                {brandingContract.contactEmail ? (
                  <Typography variant="body2" sx={{ color: brandingContract.tokens.textMuted }}>
                    {brandingContract.contactEmail}
                  </Typography>
                ) : null}
                <Button
                  component="a"
                  href={backHref}
                  variant="outlined"
                  sx={{
                    ...shellButtonSx(brandingContract),
                    borderColor: brandingContract.tokens.border,
                    color: brandingContract.tokens.text,
                  }}
                >
                  Back to website
                </Button>
              </Stack>
            </Stack>
          </Container>
        </Box> : null}

        {loading && !shellPayload ? (
          <Container maxWidth="lg" sx={{ py: 6 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CircularProgress size={28} />
              <Typography>Loading tenant branding…</Typography>
            </Stack>
          </Container>
        ) : null}

        {error ? (
          <Container maxWidth="lg" sx={{ pt: 3 }}>
            <Alert severity="warning">{error}</Alert>
          </Container>
        ) : null}

        <Box
          sx={{
            "--tenant-shell-primary": brandingContract.tokens.primary,
            "--tenant-shell-accent": brandingContract.tokens.accent,
            "--tenant-shell-surface": brandingContract.tokens.surface,
            "--tenant-shell-surface-alt": brandingContract.tokens.surfaceAlt,
            "--tenant-shell-text": brandingContract.tokens.text,
            "--tenant-shell-muted": brandingContract.tokens.textMuted,
            "--tenant-shell-border": brandingContract.tokens.border,
            "--tenant-shell-radius": `${brandingContract.tokens.radius || 12}px`,
            "--tenant-shell-button-text": brandingContract.tokens.buttonText,
            // Legacy transactional components already consume these CSS
            // variables. Bind them to the published Next theme instead of
            // allowing their white/blue fallback values to leak through.
            "--page-surface-bg": brandingContract.tokens.surface,
            "--page-calendar-surface": brandingContract.tokens.surface,
            "--page-card-bg": brandingContract.tokens.surface,
            "--page-secondary-bg": brandingContract.tokens.surfaceAlt,
            "--page-body-color": brandingContract.tokens.text,
            "--page-heading-color": brandingContract.tokens.text,
            "--page-border-color": brandingContract.tokens.border,
            "--page-btn-bg": brandingContract.tokens.primary,
            "--page-btn-bg-hover": brandingContract.tokens.accent,
            "--page-btn-color": brandingContract.tokens.buttonText,
            "--page-btn-bg-soft": brandingContract.tokens.surfaceAlt,
            "--page-calendar-accent": brandingContract.tokens.primary,
            "--page-calendar-accent-contrast": brandingContract.tokens.buttonText,
            "--sched-primary": brandingContract.tokens.primary,
            "& .MuiPaper-root": {
              borderRadius: "var(--tenant-shell-radius)",
              backgroundColor: `${brandingContract.tokens.surface} !important`,
              color: `${brandingContract.tokens.text} !important`,
              borderColor: `${brandingContract.tokens.border} !important`,
            },
            "& .MuiTypography-root, & .MuiFormLabel-root": {
              color: `${brandingContract.tokens.text} !important`,
            },
            "& .MuiDivider-root": { borderColor: brandingContract.tokens.border },
            "& .MuiChip-root": {
              backgroundColor: brandingContract.tokens.surfaceAlt,
              color: brandingContract.tokens.text,
            },
            "& .MuiButton-containedPrimary, & .MuiButton-contained": {
              borderRadius: "var(--tenant-shell-radius)",
              backgroundColor: brandingContract.tokens.primary,
              color: brandingContract.tokens.buttonText,
              "&:hover": { backgroundColor: brandingContract.tokens.accent },
            },
            "& .MuiButton-outlined": {
              borderColor: brandingContract.tokens.primary,
              color: brandingContract.tokens.accent,
            },
          }}
        >
          {children}
        </Box>
      </Box>
      </TenantTransactionalContext.Provider>
    </ThemeProvider>
  );
}
