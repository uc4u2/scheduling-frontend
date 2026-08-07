import React from "react";
import { alpha, Box, Container, Grid, IconButton, Link as MuiLink, Stack, Typography } from "@mui/material";
import { SOCIAL_ICON_MAP, DEFAULT_SOCIAL_ICON } from "../../../../../utils/socialIcons";
import cinematicTokens from "../tokens";

export default function CinematicFooter({ shell = {}, tokens = cinematicTokens }) {
  const { site, footerConfig, resolveLinkProps } = shell;
  const logo =
    footerConfig?.logo_asset?.url ||
    footerConfig?.logo_url ||
    site?.company?.logo_url ||
    "";
  const brand = site?.company?.name || site?.slug || "Schedulaa";
  const columns = Array.isArray(footerConfig?.columns) ? footerConfig.columns : [];
  const legal = Array.isArray(footerConfig?.legal_links) ? footerConfig.legal_links : [];
  const social = Array.isArray(footerConfig?.social_links) ? footerConfig.social_links : [];
  const footerText = footerConfig?.text || "";

  return (
    <Box
      component="footer"
      sx={{
        mt: 6,
        pt: 5,
        pb: 4,
        background:
          "linear-gradient(180deg, rgba(4,8,13,0.98) 0%, rgba(7,12,19,1) 100%)",
        borderTop: `1px solid ${tokens.colors.lineStrong}`,
        color: tokens.colors.text,
      }}
    >
      <Container maxWidth={false} sx={{ maxWidth: `${tokens.layout.shellMax}px`, px: { xs: 2, md: 4 } }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    border: `1px solid ${alpha(tokens.colors.accent, 0.38)}`,
                    display: "grid",
                    placeItems: "center",
                    overflow: "hidden",
                    bgcolor: alpha(tokens.colors.accent, 0.08),
                  }}
                >
                  {logo ? (
                    <Box component="img" src={logo} alt={brand} sx={{ width: "78%", height: "78%", objectFit: "contain" }} />
                  ) : (
                    <Typography sx={{ fontFamily: tokens.typography.headingFont, fontWeight: 900, color: tokens.colors.accent }}>
                      {String(brand).slice(0, 1)}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography sx={{ fontFamily: tokens.typography.headingFont, fontWeight: 900, fontSize: "1.2rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {brand}
                  </Typography>
                  <Typography sx={{ color: tokens.colors.textMuted }}>
                    {footerText || "Heating, cooling, ductless, and field-service support."}
                  </Typography>
                </Box>
              </Stack>
              {social.length ? (
                <Stack direction="row" spacing={1}>
                  {social.map((item, idx) => {
                    const Icon = SOCIAL_ICON_MAP[item?.icon?.toLowerCase()] || DEFAULT_SOCIAL_ICON;
                    return (
                      <IconButton
                        key={idx}
                        component="a"
                        href={item?.href || "#"}
                        target="_blank"
                        rel="noreferrer noopener"
                        sx={{
                          color: tokens.colors.text,
                          bgcolor: alpha(tokens.colors.text, 0.04),
                          border: `1px solid ${tokens.colors.line}`,
                        }}
                      >
                        <Icon fontSize="small" />
                      </IconButton>
                    );
                  })}
                </Stack>
              ) : null}
            </Stack>
          </Grid>
          <Grid item xs={12} md={8}>
            <Grid container spacing={2.5}>
              {columns.map((column, idx) => (
                <Grid item xs={12} sm={6} md={Math.max(3, Math.floor(12 / Math.max(1, columns.length)))} key={idx}>
                  <Stack spacing={1}>
                    {column?.title ? (
                      <Typography sx={{ fontFamily: tokens.typography.headingFont, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        {column.title}
                      </Typography>
                    ) : null}
                    {(column?.links || []).map((link, linkIdx) => {
                      const props = resolveLinkProps(link?.href || "");
                      const { component, ...rest } = props;
                      return (
                        <MuiLink
                          key={linkIdx}
                          component={component || "a"}
                          {...rest}
                          underline="hover"
                          sx={{ color: tokens.colors.textSoft, fontSize: "0.96rem" }}
                        >
                          {link?.label || link?.href}
                        </MuiLink>
                      );
                    })}
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
        {legal.length ? (
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            sx={{
              mt: 3.5,
              pt: 2.5,
              borderTop: `1px solid ${tokens.colors.line}`,
            }}
          >
            {legal.map((link, idx) => {
              const props = resolveLinkProps(link?.href || "");
              const { component, ...rest } = props;
              return (
                <MuiLink
                  key={idx}
                  component={component || "a"}
                  {...rest}
                  underline="hover"
                  sx={{ color: tokens.colors.textMuted, fontSize: "0.9rem" }}
                >
                  {link?.label || link?.href}
                </MuiLink>
              );
            })}
          </Stack>
        ) : null}
      </Container>
    </Box>
  );
}
