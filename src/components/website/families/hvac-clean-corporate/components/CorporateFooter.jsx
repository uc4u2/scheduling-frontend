import React from "react";
import { Box, Container, Grid, IconButton, Link as MuiLink, Stack, Typography } from "@mui/material";
import { SOCIAL_ICON_MAP, DEFAULT_SOCIAL_ICON } from "../../../../../utils/socialIcons";
import corporateTokens from "../tokens";

export default function CorporateFooter({ shell = {}, tokens = corporateTokens }) {
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

  return (
    <Box component="footer" sx={{ mt: 6, pt: 5, pb: 4, bgcolor: "#ffffff", borderTop: `1px solid ${tokens.colors.line}` }}>
      <Container maxWidth={false} sx={{ maxWidth: `${tokens.layout.shellMax}px`, px: { xs: 2, md: 4 } }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Stack spacing={1.5}>
              {logo ? <Box component="img" src={logo} alt={brand} sx={{ width: "auto", maxWidth: 180, maxHeight: 48, objectFit: "contain" }} /> : null}
              <Typography sx={{ fontFamily: tokens.typography.headingFont, fontWeight: 800, fontSize: "1.15rem", color: tokens.colors.navy }}>{brand}</Typography>
              {footerConfig?.text ? <Typography sx={{ color: tokens.colors.textSoft, lineHeight: 1.75 }}>{footerConfig.text}</Typography> : null}
              {social.length ? (
                <Stack direction="row" spacing={1}>
                  {social.map((item, idx) => {
                    const Icon = SOCIAL_ICON_MAP[item?.icon?.toLowerCase()] || DEFAULT_SOCIAL_ICON;
                    return (
                      <IconButton key={idx} component="a" href={item?.href || "#"} target="_blank" rel="noreferrer noopener" sx={{ border: `1px solid ${tokens.colors.line}` }}>
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
                    {column?.title ? <Typography sx={{ fontFamily: tokens.typography.headingFont, fontWeight: 800, color: tokens.colors.navy }}>{column.title}</Typography> : null}
                    {(column?.links || []).map((link, linkIdx) => {
                      const props = resolveLinkProps(link?.href || "");
                      const { component, ...rest } = props;
                      return (
                        <MuiLink key={linkIdx} component={component || "a"} {...rest} underline="hover" sx={{ color: tokens.colors.textSoft }}>
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
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mt: 3, pt: 2.4, borderTop: `1px solid ${tokens.colors.line}` }}>
            {legal.map((link, idx) => {
              const props = resolveLinkProps(link?.href || "");
              const { component, ...rest } = props;
              return (
                <MuiLink key={idx} component={component || "a"} {...rest} underline="hover" sx={{ color: tokens.colors.textMuted, fontSize: "0.9rem" }}>
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
