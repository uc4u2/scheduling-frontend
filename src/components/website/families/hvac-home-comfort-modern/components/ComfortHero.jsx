import React from "react";
import { alpha, Box, Container, Grid, Stack, Typography } from "@mui/material";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import comfortTokens from "../tokens";
import { useComfortReveal } from "../motion";
import { FamilyLinkButton } from "../../hvac-shared/runtime";
import { getHeroData, getLogoCloudData } from "../../hvac-shared/canonicalHvacAdapter";

export function ComfortHero({ websiteSectionAdapter: adapter = {} }) {
  const hero = getHeroData(adapter);
  const slide = hero.slides?.[0];
  const [ref, revealStyle] = useComfortReveal({ delay: 10 });
  if (!slide) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle, background: `linear-gradient(180deg, ${comfortTokens.colors.bg} 0%, ${comfortTokens.colors.bgAlt} 100%)` }}>
      <Container maxWidth={false} sx={{ maxWidth: `${comfortTokens.layout.shellMax}px`, px: { xs: 2, md: 4 }, py: { xs: 4, md: 5 } }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} lg={6}>
            {slide.eyebrow ? <Typography sx={{ color: comfortTokens.colors.teal, fontWeight: 700 }}>{slide.eyebrow}</Typography> : null}
            <Typography sx={{ mt: 1.2, color: comfortTokens.colors.text, fontFamily: comfortTokens.typography.headingFont, fontWeight: 700, fontSize: "clamp(2.4rem, 6vw, 4.7rem)", lineHeight: 0.94 }}>
              {slide.heading}
            </Typography>
            {slide.subheading ? <Typography sx={{ mt: 2, maxWidth: 560, color: comfortTokens.colors.textSoft, lineHeight: 1.8, fontSize: "1.05rem" }}>{slide.subheading}</Typography> : null}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ mt: 3 }}>
              <FamilyLinkButton href={slide.ctaLink} label={slide.ctaText || "Request service"} endIcon={<ArrowOutwardIcon />} sx={{ minHeight: 52, px: 2.7, borderRadius: 999, background: `linear-gradient(135deg, ${comfortTokens.colors.navy} 0%, ${comfortTokens.colors.teal} 100%)`, color: "#fff", fontWeight: 800 }} />
              {slide.secondaryCtaText ? <FamilyLinkButton href={slide.secondaryCtaLink} label={slide.secondaryCtaText} variant="outlined" sx={{ minHeight: 52, px: 2.7, borderRadius: 999, borderColor: comfortTokens.colors.lineStrong, color: comfortTokens.colors.text, fontWeight: 700 }} /> : null}
            </Stack>
            {(slide.supportCardTitle || slide.supportCardBody) ? (
              <Box sx={{ mt: 2.4, p: 2, borderRadius: 4, bgcolor: "#fff", border: `1px solid ${comfortTokens.colors.line}` }}>
                {slide.supportCardTitle ? <Typography sx={{ color: comfortTokens.colors.teal, fontWeight: 700 }}>{slide.supportCardTitle}</Typography> : null}
                {slide.supportCardBody ? <Typography sx={{ mt: 0.8, color: comfortTokens.colors.textSoft, lineHeight: 1.72 }}>{slide.supportCardBody}</Typography> : null}
              </Box>
            ) : null}
          </Grid>
          <Grid item xs={12} lg={6}>
            <Box sx={{ minHeight: { xs: 360, md: 560 }, borderRadius: "40px 40px 120px 40px", background: slide.image ? `linear-gradient(180deg, rgba(255,255,255,0.02), rgba(24,52,74,0.2)), url(${slide.image}) center / cover no-repeat` : comfortTokens.colors.surfaceSoft, boxShadow: "0 30px 70px rgba(24,52,74,0.12)" }} />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export function ComfortTrustRail({ websiteSectionAdapter: adapter = {} }) {
  const data = getLogoCloudData(adapter?.props || {});
  const [ref, revealStyle] = useComfortReveal({ delay: 12 });
  if (!data.logos.length && !data.title) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle, bgcolor: "#fff" }}>
      <Container maxWidth={false} sx={{ maxWidth: `${comfortTokens.layout.shellMax}px`, px: { xs: 2, md: 4 }, py: 3 }}>
        <Stack spacing={1.5}>
          {data.title ? <Typography sx={{ fontFamily: comfortTokens.typography.headingFont, fontWeight: 700, fontSize: "clamp(1.8rem, 4vw, 2.8rem)", color: comfortTokens.colors.text }}>{data.title}</Typography> : null}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" }, gap: 1.4 }}>
            {data.logos.map((item) => (
              <Stack key={item.id} direction="row" spacing={1.1} alignItems="center" sx={{ p: 1.4, bgcolor: comfortTokens.colors.surfaceSoft, borderRadius: 999, border: `1px solid ${item.highlight ? alpha(comfortTokens.colors.teal, 0.3) : comfortTokens.colors.line}` }}>
                {item.src ? <Box component="img" src={item.src} alt={item.alt} sx={{ width: 42, height: 42, objectFit: "contain", borderRadius: "50%", bgcolor: "#fff", p: 0.3 }} /> : null}
                <Box>
                  <Typography sx={{ color: comfortTokens.colors.text, fontWeight: 700 }}>{item.label || item.alt}</Typography>
                  {item.caption ? <Typography sx={{ color: comfortTokens.colors.textMuted, fontSize: "0.85rem" }}>{item.caption}</Typography> : null}
                </Box>
              </Stack>
            ))}
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
