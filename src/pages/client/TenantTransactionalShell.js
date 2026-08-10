import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  Typography,
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

  if (!brandingContract?.isNextJsTenant) {
    return typeof legacyShell === "function" ? legacyShell(children, shellPayload) : <>{children}</>;
  }

  const backHref = resolveTransactionalReturnTo({
    brandingContract,
    returnTo,
    fallbackPagePath: pagePath,
  });

  return (
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
          minHeight: "100vh",
          bgcolor: brandingContract.tokens.background,
          color: brandingContract.tokens.text,
          backgroundImage:
            brandingContract.visualThemeKey === "modern-gradient"
              ? `radial-gradient(circle at top right, ${brandingContract.tokens.accent}22, transparent 28%), linear-gradient(180deg, ${brandingContract.tokens.background} 0%, ${brandingContract.tokens.surfaceAlt} 100%)`
              : "none",
        }}
      >
        <Box
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
        </Box>

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
            "& .MuiPaper-root": {
              borderRadius: "var(--tenant-shell-radius)",
            },
            "& .MuiButton-containedPrimary, & .MuiButton-contained": {
              borderRadius: "var(--tenant-shell-radius)",
            },
          }}
        >
          {children}
        </Box>
      </Box>
    </TenantTransactionalContext.Provider>
  );
}
