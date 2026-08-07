import React, { useEffect, useMemo, useState } from "react";
import { alpha, Box, Chip, Container, Grid, Stack, Typography } from "@mui/material";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import BoltIcon from "@mui/icons-material/Bolt";
import VerifiedIcon from "@mui/icons-material/Verified";
import cinematicTokens from "../tokens";
import { useCinematicParallax, useCinematicReveal, usePrefersReducedMotion } from "../motion";
import {
  FamilyLinkButton,
  stripHtml,
} from "../../hvac-shared/runtime";
import {
  getHeroData,
  getPerks,
  getShowcaseItems,
} from "../../hvac-shared/canonicalHvacAdapter";

function GridBackdrop() {
  return (
    <>
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: cinematicTokens.graphics.grid,
          backgroundSize: cinematicTokens.graphics.gridSize,
          opacity: 0.16,
          pointerEvents: "none",
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 18% 18%, rgba(47,110,153,0.22), transparent 30%), radial-gradient(circle at 84% 22%, rgba(245,138,31,0.16), transparent 24%), linear-gradient(180deg, rgba(5,8,13,0.28), rgba(5,8,13,0.72))",
          pointerEvents: "none",
        }}
      />
    </>
  );
}

export function CinematicHero({ websiteSectionAdapter: adapter = {} }) {
  const hero = getHeroData(adapter);
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [ref, revealStyle] = useCinematicReveal();
  const parallax = useCinematicParallax(0.035);

  useEffect(() => {
    if (hero.mode !== "carousel" || reduced || hero.slides.length <= 1) return undefined;
    const id = window.setInterval(() => {
      setIndex((cur) => (cur + 1) % hero.slides.length);
    }, hero.intervalMs || 5600);
    return () => window.clearInterval(id);
  }, [hero.intervalMs, hero.mode, hero.slides.length, reduced]);

  const slide = hero.slides[index] || hero.slides[0] || {};
  const slides = hero.slides;

  return (
    <Box
      ref={ref}
      sx={{
        ...revealStyle,
        position: "relative",
        overflow: "hidden",
        borderRadius: { xs: 0, md: 4 },
        minHeight: { xs: 640, md: cinematicTokens.layout.heroMinHeight },
        color: cinematicTokens.colors.text,
        backgroundColor: cinematicTokens.colors.bg,
        border: { md: `1px solid ${cinematicTokens.colors.line}` },
        boxShadow: { md: "0 46px 120px rgba(0,0,0,0.4)" },
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          background: slide.image
            ? `linear-gradient(90deg, rgba(5,8,13,0.88) 0%, rgba(5,8,13,0.55) 42%, rgba(5,8,13,0.2) 100%), url(${slide.image}) center / cover no-repeat`
            : `linear-gradient(135deg, ${cinematicTokens.colors.bgAlt}, ${cinematicTokens.colors.bg})`,
          transform: reduced ? "none" : `translate3d(0, ${parallax * -1}px, 0) scale(1.03)`,
          transition: "transform 180ms linear",
        }}
      />
      <GridBackdrop />
      <Container maxWidth={false} sx={{ maxWidth: `${cinematicTokens.layout.shellMax}px`, px: { xs: 2, md: 4 }, position: "relative", zIndex: 1 }}>
        <Grid container spacing={{ xs: 4, md: 5 }} alignItems="stretch" sx={{ minHeight: { xs: 640, md: cinematicTokens.layout.heroMinHeight }, py: { xs: 7, md: 9 } }}>
          <Grid item xs={12} lg={7}>
            <Stack spacing={3} sx={{ maxWidth: 780 }}>
              {slide.eyebrow ? (
                <Stack direction="row" spacing={1.2} flexWrap="wrap" useFlexGap>
                  <Chip
                    icon={<BoltIcon sx={{ color: `${cinematicTokens.colors.accent} !important` }} />}
                    label={slide.eyebrow}
                    sx={{
                      bgcolor: "rgba(255,255,255,0.04)",
                      border: `1px solid ${cinematicTokens.colors.line}`,
                      color: cinematicTokens.colors.textSoft,
                      "& .MuiChip-label": {
                        fontFamily: cinematicTokens.typography.headingFont,
                        fontWeight: 800,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                      },
                    }}
                  />
                  {slides.length > 1 ? (
                    <Chip
                      label={`${String(index + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`}
                      sx={{
                        bgcolor: cinematicTokens.colors.accentSoft,
                        border: `1px solid ${alpha(cinematicTokens.colors.accent, 0.35)}`,
                        color: cinematicTokens.colors.text,
                        "& .MuiChip-label": {
                          fontFamily: cinematicTokens.typography.headingFont,
                          fontWeight: 800,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                        },
                      }}
                    />
                  ) : null}
                </Stack>
              ) : null}
              <Typography
                sx={{
                  fontFamily: cinematicTokens.typography.headingFont,
                  fontWeight: 900,
                  fontSize: "clamp(3.2rem, 8vw, 6.5rem)",
                  lineHeight: 0.9,
                  letterSpacing: "-0.04em",
                  textTransform: "uppercase",
                  maxWidth: 820,
                  textWrap: "balance",
                }}
              >
                {slide.heading}
              </Typography>
              {slide.subheading ? (
                <Typography sx={{ maxWidth: 640, fontSize: { xs: "1.02rem", md: "1.15rem" }, lineHeight: 1.85, color: cinematicTokens.colors.textSoft }}>
                  {slide.subheading}
                </Typography>
              ) : null}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <FamilyLinkButton
                  href={slide.ctaLink}
                  label={slide.ctaText || "Request service"}
                  endIcon={<ArrowOutwardIcon />}
                  sx={{
                    minHeight: 56,
                    px: 3,
                    borderRadius: 999,
                    background: `linear-gradient(135deg, ${cinematicTokens.colors.accent} 0%, #ffb65c 100%)`,
                    color: "#071019",
                    fontFamily: cinematicTokens.typography.headingFont,
                    fontWeight: 900,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                />
                <FamilyLinkButton
                  href={slide.secondaryCtaLink}
                  label={slide.secondaryCtaText || "Learn more"}
                  variant="outlined"
                  sx={{
                    minHeight: 56,
                    px: 3,
                    borderRadius: 999,
                    borderColor: alpha(cinematicTokens.colors.text, 0.22),
                    color: cinematicTokens.colors.text,
                    fontFamily: cinematicTokens.typography.headingFont,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                />
              </Stack>
            </Stack>
          </Grid>
          <Grid item xs={12} lg={5}>
            <Box
              sx={{
                height: "100%",
                minHeight: { xs: 300, md: 560 },
                position: "relative",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  inset: { xs: 0, md: "12% 0 0 8%" },
                  clipPath: cinematicTokens.graphics.clipA,
                  border: `1px solid ${cinematicTokens.colors.lineStrong}`,
                  background: slide.image
                    ? `linear-gradient(180deg, rgba(5,8,13,0.06), rgba(5,8,13,0.44)), url(${slide.image}) center / cover no-repeat`
                    : `linear-gradient(135deg, ${cinematicTokens.colors.steel}, ${cinematicTokens.colors.bg})`,
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  right: { xs: 18, md: -8 },
                  bottom: { xs: 18, md: 46 },
                  width: { xs: 220, md: 260 },
                  p: 2.2,
                  clipPath: cinematicTokens.graphics.clipB,
                  bgcolor: alpha("#08111f", 0.88),
                  border: `1px solid ${cinematicTokens.colors.lineStrong}`,
                  backdropFilter: "blur(10px)",
                }}
              >
                <Typography sx={{ fontFamily: cinematicTokens.typography.headingFont, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", fontSize: "0.74rem", color: cinematicTokens.colors.textMuted }}>
                  {slide.supportCardTitle || "Field story"}
                </Typography>
                {slide.supportCardBody ? (
                  <Typography sx={{ mt: 1, color: cinematicTokens.colors.textSoft, lineHeight: 1.7 }}>
                    {slide.supportCardBody.slice(0, 120)}
                  </Typography>
                ) : null}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export function CinematicTrustStrip({ websiteSectionAdapter: adapter = {} }) {
  const props = adapter?.props || {};
  const perks = getPerks(props);
  const [ref, revealStyle] = useCinematicReveal({ delay: 20 });
  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container maxWidth={false} sx={{ maxWidth: `${cinematicTokens.layout.shellMax}px`, px: { xs: 2, md: 4 } }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          sx={{
            p: 1.5,
            borderRadius: 999,
            border: `1px solid ${cinematicTokens.colors.line}`,
            bgcolor: alpha(cinematicTokens.colors.surfaceSoft, 0.88),
            backdropFilter: "blur(12px)",
          }}
        >
          {perks.map((perk) => (
            <Stack
              key={perk.id}
              direction="row"
              spacing={1.2}
              alignItems="center"
              sx={{
                flex: 1,
                px: 1.25,
                py: 1.1,
                borderRadius: 999,
                bgcolor: "rgba(255,255,255,0.03)",
              }}
            >
              <VerifiedIcon sx={{ color: cinematicTokens.colors.accent }} />
              <Box>
                <Typography sx={{ fontFamily: cinematicTokens.typography.headingFont, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "0.86rem" }}>
                  {perk.title}
                </Typography>
                {perk.subtitle ? (
                  <Typography sx={{ color: cinematicTokens.colors.textSoft, fontSize: "0.88rem" }}>
                    {perk.subtitle}
                  </Typography>
                ) : null}
              </Box>
            </Stack>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}

export function CinematicServices({ websiteSectionAdapter: adapter = {} }) {
  const props = adapter?.props || {};
  const items = getShowcaseItems(props);
  const [ref, revealStyle] = useCinematicReveal({ delay: 30 });
  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container maxWidth={false} sx={{ maxWidth: `${cinematicTokens.layout.shellMax}px`, px: { xs: 2, md: 4 } }}>
        <Stack spacing={2.5}>
          <Typography sx={{ fontFamily: cinematicTokens.typography.headingFont, fontWeight: 900, fontSize: "clamp(2.2rem, 4vw, 4rem)", letterSpacing: "-0.03em", textTransform: "uppercase" }}>
            {props.title || "Services"}
          </Typography>
          {props.subtitle ? (
            <Typography sx={{ maxWidth: 720, color: cinematicTokens.colors.textSoft, lineHeight: 1.8 }}>
              {props.subtitle}
            </Typography>
          ) : null}
          <Grid container spacing={2}>
            {items.slice(0, 6).map((item, idx) => (
              <Grid item xs={12} md={idx === 0 ? 6 : 3} key={item.id}>
                <Box
                  sx={{
                    position: "relative",
                    minHeight: idx === 0 ? 380 : 280,
                    clipPath: idx % 2 === 0 ? cinematicTokens.graphics.clipA : cinematicTokens.graphics.clipB,
                    overflow: "hidden",
                    border: `1px solid ${cinematicTokens.colors.line}`,
                    background: item.image
                      ? `linear-gradient(180deg, rgba(5,8,13,0.08), rgba(5,8,13,0.58)), url(${item.image}) center / cover no-repeat`
                      : `linear-gradient(135deg, ${cinematicTokens.colors.bgAlt}, ${cinematicTokens.colors.bg})`,
                  }}
                >
                  <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 25%, rgba(5,8,13,0.82) 100%)" }} />
                  <Box sx={{ position: "absolute", left: 20, right: 20, bottom: 20 }}>
                    <Typography sx={{ color: alpha(cinematicTokens.colors.text, 0.24), fontFamily: cinematicTokens.typography.headingFont, fontWeight: 900, fontSize: idx === 0 ? "4rem" : "2.4rem", lineHeight: 0.9 }}>
                      {String(idx + 1).padStart(2, "0")}
                    </Typography>
                    <Typography sx={{ mt: 1, fontFamily: cinematicTokens.typography.headingFont, fontWeight: 900, fontSize: idx === 0 ? "2rem" : "1.35rem", letterSpacing: "-0.02em", textTransform: "uppercase" }}>
                      {item.title}
                    </Typography>
                    {item.description ? (
                      <Typography sx={{ mt: 0.8, color: cinematicTokens.colors.textSoft, lineHeight: 1.65 }}>
                        {item.description}
                      </Typography>
                    ) : null}
                    <FamilyLinkButton
                      href={item.link}
                      label={item.linkText || "Explore"}
                      endIcon={<ArrowOutwardIcon />}
                      sx={{
                        mt: 1.6,
                        px: 0,
                        minHeight: "auto",
                        color: cinematicTokens.colors.text,
                        fontFamily: cinematicTokens.typography.headingFont,
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    />
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}
