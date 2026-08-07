import React, { useEffect, useState } from "react";
import { alpha, Box, Chip, Container, Grid, Stack, Typography } from "@mui/material";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import corporateTokens from "../tokens";
import { useCorporateReveal, usePrefersReducedMotion } from "../motion";
import { FamilyLinkButton } from "../../hvac-shared/runtime";
import { getHeroData, getPerks } from "../../hvac-shared/canonicalHvacAdapter";

export function CorporateQuotePanel({ slide }) {
  return (
    <Stack
      spacing={1.4}
      sx={{
        p: { xs: 2.4, md: 3 },
        bgcolor: "#ffffff",
        borderRadius: 3,
        border: `1px solid ${alpha(corporateTokens.colors.navy, 0.1)}`,
        boxShadow: "0 30px 70px rgba(18,38,58,0.12)",
      }}
    >
      <Typography sx={{ color: corporateTokens.colors.textMuted, fontWeight: 700 }}>
        Request service
      </Typography>
      <Typography sx={{ fontFamily: corporateTokens.typography.headingFont, fontWeight: 800, fontSize: "1.5rem" }}>
        {slide.ctaText || "Book the next step"}
      </Typography>
      <Typography sx={{ color: corporateTokens.colors.textSoft, lineHeight: 1.75 }}>
        {slide.subheading}
      </Typography>
      <FamilyLinkButton
        href={slide.ctaLink}
        label={slide.ctaText || "Request service"}
        endIcon={<ArrowOutwardIcon />}
        sx={{
          minHeight: 48,
          borderRadius: 999,
          background: `linear-gradient(135deg, ${corporateTokens.colors.teal} 0%, ${corporateTokens.colors.sky} 100%)`,
          color: "#fff",
          fontFamily: corporateTokens.typography.headingFont,
          fontWeight: 800,
        }}
      />
      {slide.secondaryCtaText ? (
        <FamilyLinkButton
          href={slide.secondaryCtaLink}
          label={slide.secondaryCtaText}
          variant="text"
          sx={{ alignSelf: "flex-start", px: 0, color: corporateTokens.colors.navy }}
        />
      ) : null}
    </Stack>
  );
}

export function CorporateHero({ websiteSectionAdapter: adapter = {} }) {
  const hero = getHeroData(adapter);
  const perks = getPerks(adapter?.props || {});
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [ref, revealStyle] = useCorporateReveal();

  useEffect(() => {
    if (hero.mode !== "carousel" || reduced || hero.slides.length <= 1) return undefined;
    const id = window.setInterval(() => {
      setIndex((cur) => (cur + 1) % hero.slides.length);
    }, hero.intervalMs || 5800);
    return () => window.clearInterval(id);
  }, [hero.intervalMs, hero.mode, hero.slides.length, reduced]);

  const slide = hero.slides[index] || hero.slides[0] || {};

  return (
    <Box ref={ref} sx={{ ...revealStyle, position: "relative", overflow: "hidden" }}>
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 16% 18%, rgba(110,177,218,0.14), transparent 28%), radial-gradient(circle at 82% 14%, rgba(19,125,134,0.14), transparent 24%)",
        }}
      />
      <Container maxWidth={false} sx={{ maxWidth: `${corporateTokens.layout.shellMax}px`, px: { xs: 2, md: 4 }, py: { xs: 5, md: 7 }, position: "relative", zIndex: 1 }}>
        <Grid container spacing={{ xs: 3, md: 4 }} alignItems="center">
          <Grid item xs={12} lg={7}>
            <Stack spacing={2.2} sx={{ maxWidth: 760 }}>
              {slide.eyebrow ? (
                <Chip
                  label={slide.eyebrow}
                  sx={{
                    alignSelf: "flex-start",
                    bgcolor: corporateTokens.colors.accentSoft,
                    color: corporateTokens.colors.navy,
                    fontWeight: 700,
                  }}
                />
              ) : null}
              <Typography sx={{ fontFamily: corporateTokens.typography.headingFont, fontWeight: 800, fontSize: "clamp(2.8rem, 6vw, 5.8rem)", lineHeight: 0.94, letterSpacing: "-0.04em", color: corporateTokens.colors.text }}>
                {slide.heading}
              </Typography>
              {slide.subheading ? (
                <Typography sx={{ maxWidth: 640, color: corporateTokens.colors.textSoft, fontSize: { xs: "1rem", md: "1.12rem" }, lineHeight: 1.82 }}>
                  {slide.subheading}
                </Typography>
              ) : null}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                <FamilyLinkButton
                  href={slide.ctaLink}
                  label={slide.ctaText || "Request service"}
                  endIcon={<ArrowOutwardIcon />}
                  sx={{
                    minHeight: 50,
                    px: 2.8,
                    borderRadius: 999,
                    background: `linear-gradient(135deg, ${corporateTokens.colors.navy} 0%, ${corporateTokens.colors.teal} 100%)`,
                    color: "#fff",
                    fontFamily: corporateTokens.typography.headingFont,
                    fontWeight: 800,
                  }}
                />
                {slide.secondaryCtaText ? (
                  <FamilyLinkButton
                    href={slide.secondaryCtaLink}
                    label={slide.secondaryCtaText}
                    variant="outlined"
                    sx={{ minHeight: 50, px: 2.8, borderRadius: 999, borderColor: corporateTokens.colors.lineStrong, color: corporateTokens.colors.navy }}
                  />
                ) : null}
              </Stack>
              {perks.length ? (
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} flexWrap="wrap" useFlexGap sx={{ pt: 0.5 }}>
                  {perks.map((perk) => (
                    <Box key={perk.id} sx={{ px: 1.5, py: 1.1, borderRadius: 999, bgcolor: "#ffffff", border: `1px solid ${corporateTokens.colors.line}` }}>
                      <Typography sx={{ fontWeight: 700, color: corporateTokens.colors.navy }}>{perk.title}</Typography>
                      {perk.subtitle ? <Typography sx={{ color: corporateTokens.colors.textMuted, fontSize: "0.9rem" }}>{perk.subtitle}</Typography> : null}
                    </Box>
                  ))}
                </Stack>
              ) : null}
            </Stack>
          </Grid>
          <Grid item xs={12} lg={5}>
            <Stack spacing={2}>
              <Box
                sx={{
                  minHeight: { xs: 320, md: 440 },
                  borderRadius: 4,
                  overflow: "hidden",
                  background: slide.image
                    ? `linear-gradient(180deg, rgba(18,38,58,0.06), rgba(18,38,58,0.16)), url(${slide.image}) center / cover no-repeat`
                    : corporateTokens.colors.surfaceSoft,
                  boxShadow: "0 26px 60px rgba(18,38,58,0.14)",
                }}
              />
              <CorporateQuotePanel slide={slide} />
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export function CorporateTrustLogos({ websiteSectionAdapter: adapter = {} }) {
  const perks = getPerks(adapter?.props || {});
  const [ref, revealStyle] = useCorporateReveal({ delay: 20 });
  if (!perks.length) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container maxWidth={false} sx={{ maxWidth: `${corporateTokens.layout.shellMax}px`, px: { xs: 2, md: 4 } }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} sx={{ py: 1.6 }}>
          {perks.map((perk) => (
            <Box key={perk.id} sx={{ flex: 1, p: 1.8, bgcolor: "#ffffff", borderRadius: 2.5, border: `1px solid ${corporateTokens.colors.line}` }}>
              <Typography sx={{ fontWeight: 700, color: corporateTokens.colors.navy }}>{perk.title}</Typography>
              {perk.subtitle ? <Typography sx={{ color: corporateTokens.colors.textMuted }}>{perk.subtitle}</Typography> : null}
            </Box>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
