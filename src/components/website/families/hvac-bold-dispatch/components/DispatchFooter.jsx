import React from "react";
import { alpha, Box, Container, Grid, Stack, Typography } from "@mui/material";
import { FamilyLinkButton } from "../../hvac-shared/runtime";
import { sanitizeDispatchText } from "./contentSanitizer";

export default function DispatchFooter({ shell = {}, tokens }) {
  const { site, footerConfig, navLinks = [], resolveLinkProps } = shell;
  const logo = footerConfig?.logo_asset?.url || footerConfig?.logo_url || site?.company?.logo_url || "";
  const name = footerConfig?.brand_text || site?.company?.name || shell.slug || "Schedulaa";
  const links = navLinks.slice(0, 6);
  return (
    <Box sx={{ bgcolor: tokens.colors.bg, color: tokens.colors.text, borderTop: `1px solid ${tokens.colors.lineStrong}` }}>
      <Container maxWidth={false} sx={{ maxWidth: `${tokens.layout.shellMax}px`, px: { xs: 2, md: 4 }, py: { xs: 4, md: 5 } }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Stack spacing={1.25}>
              <Box sx={{ width: 74, height: 74, bgcolor: tokens.colors.cream, display: "grid", placeItems: "center" }}>
                {logo ? <Box component="img" src={logo} alt={name} sx={{ width: "78%", height: "78%", objectFit: "contain" }} /> : <Typography sx={{ color: tokens.colors.ink, fontFamily: tokens.typography.headingFont }}>{String(name).slice(0, 1)}</Typography>}
              </Box>
              <Typography sx={{ fontFamily: tokens.typography.headingFont, fontWeight: 900, textTransform: "uppercase" }}>{name}</Typography>
              {footerConfig?.text ? <Typography sx={{ color: tokens.colors.textSoft, lineHeight: 1.7 }}>{sanitizeDispatchText(footerConfig.text, "Use the footer for service-area notes, scheduling guidance, or the quickest path to request HVAC support.")}</Typography> : null}
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography sx={{ fontFamily: tokens.typography.headingFont, fontWeight: 900, textTransform: "uppercase", mb: 1.2 }}>Quick links</Typography>
            <Stack spacing={1}>
              {links.map((item) => (
                <FamilyLinkButton key={item.id || item.href} href={item.href} label={item.label} variant="text" {...(resolveLinkProps ? {} : {})} sx={{ justifyContent: "flex-start", px: 0, color: tokens.colors.textSoft, fontWeight: 700 }} />
              ))}
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography sx={{ fontFamily: tokens.typography.headingFont, fontWeight: 900, textTransform: "uppercase", mb: 1.2 }}>Ready to book</Typography>
            <FamilyLinkButton href={`/${shell.slug}?page=contact`} label="Request service" sx={{ minHeight: 48, borderRadius: 0, bgcolor: tokens.colors.orange, color: "#1a130e", fontFamily: tokens.typography.headingFont, fontWeight: 900 }} />
            {site?.company?.contact_email ? <Typography sx={{ mt: 1.5, color: alpha(tokens.colors.text, 0.72) }}>{site.company.contact_email}</Typography> : null}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
