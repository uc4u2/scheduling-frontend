import React from "react";
import { alpha, Box, Container, Grid, Stack, Typography } from "@mui/material";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import cinematicTokens from "../tokens";
import { useCinematicReveal } from "../motion";
import { FamilyLinkButton } from "../../hvac-shared/runtime";
import { getStoryData } from "../../hvac-shared/canonicalHvacAdapter";

export default function CinematicProjectShowcase({ websiteSectionAdapter: adapter = {} }) {
  const props = adapter?.props || {};
  const story = getStoryData(props);
  const [ref, revealStyle] = useCinematicReveal({ delay: 30 });

  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container maxWidth={false} sx={{ maxWidth: `${cinematicTokens.layout.shellMax}px`, px: { xs: 2, md: 4 } }}>
        <Box sx={{ position: "relative", overflow: "hidden", borderRadius: 4, border: `1px solid ${cinematicTokens.colors.lineStrong}`, bgcolor: cinematicTokens.colors.surface }}>
          <Grid container spacing={0}>
            <Grid item xs={12} lg={6}>
              <Box
                sx={{
                  minHeight: { xs: 320, lg: 640 },
                  height: "100%",
                  position: "relative",
                  clipPath: { lg: cinematicTokens.graphics.clipA },
                  background: story.mediaImage
                    ? `linear-gradient(180deg, rgba(5,8,13,0.14), rgba(5,8,13,0.6)), url(${story.mediaImage}) center / cover no-repeat`
                    : `linear-gradient(135deg, ${cinematicTokens.colors.bgAlt}, ${cinematicTokens.colors.bg})`,
                }}
              >
                <Box
                  aria-hidden
                  sx={{
                    position: "absolute",
                    left: 22,
                    top: 24,
                    width: 140,
                    height: 140,
                    border: `1px solid ${alpha(cinematicTokens.colors.accent, 0.28)}`,
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} lg={6}>
              <Stack spacing={2.2} sx={{ p: { xs: 3, md: 5 } }}>
                {story.eyebrow ? (
                  <Typography sx={{ color: cinematicTokens.colors.textMuted, fontFamily: cinematicTokens.typography.headingFont, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", fontSize: "0.76rem" }}>
                    {story.eyebrow}
                  </Typography>
                ) : null}
                <Typography sx={{ fontFamily: cinematicTokens.typography.headingFont, fontWeight: 900, fontSize: "clamp(2.1rem, 4vw, 4rem)", lineHeight: 0.92, letterSpacing: "-0.03em", textTransform: "uppercase" }}>
                  {story.title}
                </Typography>
                {story.body.map((paragraph, idx) => (
                  <Typography key={idx} sx={{ color: cinematicTokens.colors.textSoft, lineHeight: 1.85 }}>
                    {paragraph}
                  </Typography>
                ))}
                {story.mediaTitle ? (
                  <Box sx={{ mt: 1, p: 2.4, border: `1px solid ${cinematicTokens.colors.line}`, bgcolor: alpha(cinematicTokens.colors.steel, 0.12), clipPath: cinematicTokens.graphics.clipB }}>
                    <Typography sx={{ fontFamily: cinematicTokens.typography.headingFont, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "1rem" }}>
                      {story.mediaTitle}
                    </Typography>
                    {story.mediaBody.map((paragraph, idx) => (
                      <Typography key={idx} sx={{ mt: 0.9, color: cinematicTokens.colors.textSoft, lineHeight: 1.75 }}>
                        {paragraph}
                      </Typography>
                    ))}
                  </Box>
                ) : null}
                {story.ctaText ? (
                  <FamilyLinkButton
                    href={story.ctaLink}
                    label={story.ctaText}
                    endIcon={<ArrowOutwardIcon />}
                    sx={{
                      alignSelf: "flex-start",
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
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}
