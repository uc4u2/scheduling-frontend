import React from "react";
import { alpha, Box, Container, Grid, Stack, Typography } from "@mui/material";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalk";
import cinematicTokens from "../tokens";
import { useCinematicReveal } from "../motion";
import { FamilyLinkButton } from "../../hvac-shared/runtime";
import { getBookingBarData, getMapDetails } from "../../hvac-shared/canonicalHvacAdapter";

export function CinematicEmergencyCTA({ websiteSectionAdapter: adapter = {} }) {
  const data = getMapDetails(adapter?.props || {});
  const title = data.title || adapter?.title || "Service area response";
  const body = data.body || "Reach the team, describe the issue, and move into the right next step fast.";
  const [ref, revealStyle] = useCinematicReveal({ delay: 30 });
  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container maxWidth={false} sx={{ maxWidth: `${cinematicTokens.layout.shellMax}px`, px: { xs: 2, md: 4 } }}>
        <Box
          sx={{
            p: { xs: 3, md: 4 },
            border: `1px solid ${alpha(cinematicTokens.colors.accent, 0.28)}`,
            background: `linear-gradient(135deg, ${alpha(cinematicTokens.colors.accent, 0.16)} 0%, ${alpha(
              cinematicTokens.colors.steel,
              0.18
            )} 100%)`,
            clipPath: cinematicTokens.graphics.clipA,
          }}
        >
          <Grid container spacing={2.2} alignItems="center">
            <Grid item xs={12} md={7}>
              <Stack spacing={1.2}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <PhoneInTalkIcon sx={{ color: cinematicTokens.colors.accent }} />
                  <Typography
                    sx={{
                      fontFamily: cinematicTokens.typography.headingFont,
                      fontWeight: 800,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: cinematicTokens.colors.textMuted,
                    }}
                  >
                    {data.eyebrow || "Priority response"}
                  </Typography>
                </Stack>
                <Typography
                  sx={{
                    fontFamily: cinematicTokens.typography.headingFont,
                    fontWeight: 900,
                    fontSize: "clamp(2rem, 4vw, 3.4rem)",
                    lineHeight: 0.95,
                    textTransform: "uppercase",
                  }}
                >
                  {title}
                </Typography>
                <Typography sx={{ maxWidth: 620, color: cinematicTokens.colors.textSoft, lineHeight: 1.8 }}>
                  {body}
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={12} md={5}>
              <Stack direction={{ xs: "column", sm: "row", md: "column" }} spacing={1.1} alignItems={{ md: "flex-end" }}>
                {data.ctaText ? (
                  <FamilyLinkButton
                    href={data.ctaHref}
                    label={data.ctaText}
                    endIcon={<ArrowOutwardIcon />}
                    sx={{
                      minHeight: 52,
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
                ) : null}
                {data.details.slice(0, 2).map((detail, idx) => (
                  <Typography key={idx} sx={{ color: cinematicTokens.colors.textMuted, textAlign: { md: "right" } }}>
                    <strong>{detail.title}</strong>
                    {detail.title && detail.text ? " · " : ""}
                    {detail.text}
                  </Typography>
                ))}
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}

export function CinematicFinalCTA({ websiteSectionAdapter: adapter = {} }) {
  const data = getBookingBarData(adapter);
  const [ref, revealStyle] = useCinematicReveal({ delay: 25 });
  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container maxWidth={false} sx={{ maxWidth: `${cinematicTokens.layout.shellMax}px`, px: { xs: 2, md: 4 } }}>
        <Box
          sx={{
            p: { xs: 3, md: 4 },
            background:
              "linear-gradient(135deg, rgba(7,14,23,0.98) 0%, rgba(12,22,36,0.98) 55%, rgba(21,48,71,0.98) 100%)",
            border: `1px solid ${cinematicTokens.colors.lineStrong}`,
            clipPath: cinematicTokens.graphics.clipB,
          }}
        >
          <Grid container spacing={2.2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography
                sx={{
                  fontFamily: cinematicTokens.typography.headingFont,
                  fontWeight: 900,
                  fontSize: "clamp(2rem, 4vw, 3.6rem)",
                  lineHeight: 0.95,
                  textTransform: "uppercase",
                }}
              >
                {data.title || "Ready for the next service step?"}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack alignItems={{ md: "flex-end" }}>
                <FamilyLinkButton
                  href={data.buttonLink}
                  label={data.buttonText || "Request service"}
                  endIcon={<ArrowOutwardIcon />}
                  sx={{
                    minHeight: 54,
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
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}

export function CinematicBookingBar({ websiteSectionAdapter: adapter = {} }) {
  return <CinematicFinalCTA websiteSectionAdapter={adapter} />;
}
