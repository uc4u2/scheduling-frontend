import React from "react";
import { Box, Container, Grid, Stack, Typography } from "@mui/material";
import { FamilyLinkButton } from "../../hvac-shared/runtime";

export default function ComfortFooter({ shell = {}, tokens }) {
  const { site, footerConfig, navLinks = [] } = shell;
  const logo = footerConfig?.logo_asset?.url || footerConfig?.logo_url || site?.company?.logo_url || "";
  const name = footerConfig?.brand_text || footerConfig?.text || site?.company?.name || shell.slug || "Schedulaa";
  return (
    <Box sx={{ bgcolor: "#fff", color: tokens.colors.text, borderTop: `1px solid ${tokens.colors.line}` }}>
      <Container maxWidth={false} sx={{ maxWidth: `${tokens.layout.shellMax}px`, px: { xs: 2, md: 4 }, py: 5 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Stack spacing={1.2}>
              <Box sx={{ width: 74, height: 74, borderRadius: "50%", bgcolor: tokens.colors.surfaceSoft, border: `1px solid ${tokens.colors.line}`, display: "grid", placeItems: "center", overflow: "hidden" }}>
                {logo ? <Box component="img" src={logo} alt={name} sx={{ width: "78%", height: "78%", objectFit: "contain" }} /> : <Typography sx={{ fontFamily: tokens.typography.headingFont }}>{String(name).slice(0, 1)}</Typography>}
              </Box>
              <Typography sx={{ fontFamily: tokens.typography.headingFont, fontWeight: 700, fontSize: "1.25rem" }}>{name}</Typography>
              {footerConfig?.text ? <Typography sx={{ color: tokens.colors.textSoft, lineHeight: 1.72 }}>{footerConfig.text}</Typography> : null}
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography sx={{ color: tokens.colors.navy, fontWeight: 700, mb: 1.1 }}>Quick links</Typography>
            <Stack spacing={0.8}>
              {navLinks.slice(0, 6).map((item) => (
                <FamilyLinkButton key={item.id || item.href} href={item.href} label={item.label} variant="text" sx={{ justifyContent: "flex-start", px: 0, color: tokens.colors.textSoft, fontWeight: 700 }} />
              ))}
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography sx={{ color: tokens.colors.navy, fontWeight: 700, mb: 1.1 }}>Need help choosing the right service?</Typography>
            <FamilyLinkButton href={`/${shell.slug}?page=contact`} label="Request service" sx={{ minHeight: 48, borderRadius: 999, background: `linear-gradient(135deg, ${tokens.colors.navy} 0%, ${tokens.colors.teal} 100%)`, color: "#fff", fontWeight: 800 }} />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
