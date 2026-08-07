import React from "react";
import { alpha, Box, Container, Grid, Stack, Typography } from "@mui/material";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import dispatchTokens from "../tokens";
import { useDispatchReveal } from "../motion";
import { FamilyLinkButton } from "../../hvac-shared/runtime";
import { getHeroData, getLogoCloudData } from "../../hvac-shared/canonicalHvacAdapter";
import {
  sanitizeDispatchCta,
  sanitizeDispatchHero,
  sanitizeDispatchTrustRail,
} from "./contentSanitizer";

export function DispatchHeroWithQuotePanel({ websiteSectionAdapter: adapter = {} }) {
  const hero = getHeroData(adapter);
  const slide = sanitizeDispatchHero(hero.slides?.[0] || {});
  const [ref, revealStyle] = useDispatchReveal({ delay: 10 });
  if (!hero.slides?.length) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle, background: dispatchTokens.colors.bg }}>
      <Container maxWidth={false} sx={{ maxWidth: `${dispatchTokens.layout.shellMax}px`, px: { xs: 2, md: 4 }, py: { xs: 4, md: 5 } }}>
        <Grid container spacing={2}>
          <Grid item xs={12} lg={8}>
            <Box sx={{ minHeight: { xs: 520, md: dispatchTokens.layout.heroMinHeight }, p: { xs: 3, md: 5 }, background: slide.image ? `linear-gradient(180deg, rgba(20,18,16,0.18), rgba(20,18,16,0.76)), url(${slide.image}) center / cover no-repeat` : dispatchTokens.colors.bgAlt, border: `1px solid ${dispatchTokens.colors.lineStrong}` }}>
              {slide.eyebrow ? <Typography sx={{ color: dispatchTokens.colors.orange, fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.14em" }}>{slide.eyebrow}</Typography> : null}
              <Typography sx={{ mt: 1.2, maxWidth: 760, fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900, textTransform: "uppercase", fontSize: "clamp(2.4rem, 7vw, 6rem)", lineHeight: 0.9 }}>
                {slide.heading}
              </Typography>
              {slide.subheading ? <Typography sx={{ mt: 2, maxWidth: 560, color: dispatchTokens.colors.textSoft, lineHeight: 1.8, fontSize: "1.02rem" }}>{slide.subheading}</Typography> : null}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ mt: 3 }}>
                <FamilyLinkButton href={slide.ctaLink} label={sanitizeDispatchCta(slide.ctaText, "Request service")} endIcon={<ArrowOutwardIcon />} sx={{ minHeight: 54, px: 3, borderRadius: 0, bgcolor: dispatchTokens.colors.orange, color: "#1b130c", fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900 }} />
                {slide.secondaryCtaText ? <FamilyLinkButton href={slide.secondaryCtaLink} label={sanitizeDispatchCta(slide.secondaryCtaText, "Request estimate")} variant="outlined" sx={{ minHeight: 54, px: 3, borderRadius: 0, borderColor: alpha(dispatchTokens.colors.text, 0.36), color: dispatchTokens.colors.text, fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900 }} /> : null}
              </Stack>
            </Box>
          </Grid>
          <Grid item xs={12} lg={4}>
            <Stack spacing={2}>
              <Box sx={{ p: { xs: 2.2, md: 2.6 }, bgcolor: dispatchTokens.colors.cream, color: dispatchTokens.colors.ink, borderTop: `6px solid ${dispatchTokens.colors.orange}` }}>
                <Typography sx={{ fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900, textTransform: "uppercase", fontSize: "1.8rem", lineHeight: 0.94 }}>
                  Fast quote request
                </Typography>
                <Typography sx={{ mt: 1.2, lineHeight: 1.72 }}>
                  Use this panel for an estimate request, service visit, or comfort check.
                </Typography>
                <Stack spacing={1.1} sx={{ mt: 2 }}>
                  {["Tell us the problem", "Choose the system type", "Pick the next step"].map((line) => (
                    <Box key={line} sx={{ p: 1.2, border: "1px solid rgba(24,21,18,0.16)", bgcolor: "#fff" }}>
                      <Typography sx={{ fontWeight: 700 }}>{line}</Typography>
                    </Box>
                  ))}
                </Stack>
                <FamilyLinkButton href={slide.ctaLink} label={sanitizeDispatchCta(slide.ctaText, "Request service")} sx={{ mt: 2, width: "100%", minHeight: 52, borderRadius: 0, bgcolor: dispatchTokens.colors.red, color: "#fff", fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900 }} />
              </Box>
              {(slide.supportCardTitle || slide.supportCardBody) ? (
                <Box sx={{ p: 2.2, bgcolor: alpha(dispatchTokens.colors.surface, 0.96), border: `1px solid ${dispatchTokens.colors.line}` }}>
                  {slide.supportCardTitle ? <Typography sx={{ color: dispatchTokens.colors.gold, fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900, textTransform: "uppercase" }}>{slide.supportCardTitle}</Typography> : null}
                  {slide.supportCardBody ? <Typography sx={{ mt: 1, color: dispatchTokens.colors.textSoft, lineHeight: 1.7 }}>{slide.supportCardBody}</Typography> : null}
                </Box>
              ) : null}
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export function DispatchTrustRail({ websiteSectionAdapter: adapter = {} }) {
  const data = sanitizeDispatchTrustRail(getLogoCloudData(adapter?.props || {}));
  const [ref, revealStyle] = useDispatchReveal({ delay: 14 });
  if (!data.logos.length && !data.title) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle, bgcolor: dispatchTokens.colors.cream }}>
      <Container maxWidth={false} sx={{ maxWidth: `${dispatchTokens.layout.shellMax}px`, px: { xs: 2, md: 4 }, py: 3 }}>
        <Stack spacing={1.4}>
          {data.title ? <Typography sx={{ color: dispatchTokens.colors.ink, fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900, textTransform: "uppercase", fontSize: "1.8rem" }}>{data.title}</Typography> : null}
          {data.caption ? <Typography sx={{ maxWidth: 760, color: alpha(dispatchTokens.colors.ink, 0.74), lineHeight: 1.7 }}>{data.caption}</Typography> : null}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" }, gap: 1.5 }}>
            {data.logos.map((item) => (
              <Stack key={item.id} direction="row" spacing={1.2} alignItems="center" sx={{ p: 1.4, bgcolor: "#fff", borderLeft: `5px solid ${item.highlight ? dispatchTokens.colors.red : dispatchTokens.colors.orange}` }}>
                {item.src ? <Box component="img" src={item.src} alt={item.alt} sx={{ width: 42, height: 42, objectFit: "contain" }} /> : <Box sx={{ width: 42, height: 42, display: "grid", placeItems: "center", borderRadius: "999px", border: `1px solid ${alpha(dispatchTokens.colors.ink, 0.18)}`, color: dispatchTokens.colors.orange, fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900 }}>{String(item.label || item.alt || "?").slice(0, 1)}</Box>}
                <Box>
                  <Typography sx={{ fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900, textTransform: "uppercase", color: dispatchTokens.colors.ink }}>
                    {item.label || item.alt}
                  </Typography>
                  {item.caption ? <Typography sx={{ color: alpha(dispatchTokens.colors.ink, 0.72), fontSize: "0.88rem" }}>{item.caption}</Typography> : null}
                </Box>
              </Stack>
            ))}
          </Box>
          {data.supportingText ? <Typography sx={{ color: alpha(dispatchTokens.colors.ink, 0.6), lineHeight: 1.65 }}>{data.supportingText}</Typography> : null}
        </Stack>
      </Container>
    </Box>
  );
}
