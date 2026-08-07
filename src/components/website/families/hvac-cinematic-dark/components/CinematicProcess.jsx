import React from "react";
import { alpha, Box, Container, Grid, Stack, Typography } from "@mui/material";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import cinematicTokens from "../tokens";
import { useCinematicReveal } from "../motion";
import { FamilyLinkButton } from "../../hvac-shared/runtime";
import {
  getStoryData,
  getZigzagItems,
} from "../../hvac-shared/canonicalHvacAdapter";

export default function CinematicProcess({ websiteSectionAdapter: adapter = {} }) {
  const props = adapter?.props || {};
  const story = getStoryData(props);
  const steps = getZigzagItems(props);
  const items = steps.length
    ? steps
    : story.body.map((paragraph, idx) => ({
        id: `story-step-${idx}`,
        title: idx === 0 ? story.title || "Project brief" : `Step ${idx + 1}`,
        body: paragraph,
        image: story.mediaImage,
        ctaText: idx === story.body.length - 1 ? story.ctaText : "",
        ctaLink: idx === story.body.length - 1 ? story.ctaLink : "",
      }));
  const [ref, revealStyle] = useCinematicReveal({ delay: 40 });

  if (!items.length) return null;

  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container
        maxWidth={false}
        sx={{ maxWidth: `${cinematicTokens.layout.shellMax}px`, px: { xs: 2, md: 4 } }}
      >
        <Stack spacing={2.5} sx={{ mb: 2 }}>
          {story.eyebrow ? (
            <Typography
              sx={{
                color: cinematicTokens.colors.textMuted,
                fontFamily: cinematicTokens.typography.headingFont,
                fontWeight: 800,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                fontSize: "0.76rem",
              }}
            >
              {story.eyebrow}
            </Typography>
          ) : null}
          {story.title ? (
            <Typography
              sx={{
                fontFamily: cinematicTokens.typography.headingFont,
                fontWeight: 900,
                fontSize: "clamp(2.1rem, 4vw, 3.8rem)",
                lineHeight: 0.94,
                letterSpacing: "-0.03em",
                textTransform: "uppercase",
                maxWidth: 760,
              }}
            >
              {story.title}
            </Typography>
          ) : null}
        </Stack>

        <Grid container spacing={2.25}>
          {items.map((item, idx) => (
            <Grid item xs={12} md={6} key={item.id}>
              <Box
                sx={{
                  position: "relative",
                  overflow: "hidden",
                  minHeight: 360,
                  border: `1px solid ${cinematicTokens.colors.line}`,
                  clipPath:
                    idx % 2 === 0
                      ? cinematicTokens.graphics.clipA
                      : cinematicTokens.graphics.clipB,
                  background: item.image
                    ? `linear-gradient(180deg, rgba(5,8,13,0.2), rgba(5,8,13,0.84)), url(${item.image}) center / cover no-repeat`
                    : `linear-gradient(135deg, ${cinematicTokens.colors.bgAlt}, ${cinematicTokens.colors.bg})`,
                }}
              >
                <Box
                  aria-hidden
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(90deg, transparent, rgba(245,138,31,0.08), transparent)",
                    transform: "translateX(-100%)",
                    animation: "cinematic-line-sweep 5.5s linear infinite",
                    "@media (prefers-reduced-motion: reduce)": {
                      animation: "none",
                    },
                    "@keyframes cinematic-line-sweep": {
                      "100%": { transform: "translateX(100%)" },
                    },
                  }}
                />
                <Stack
                  spacing={1.4}
                  sx={{
                    position: "absolute",
                    inset: "auto 0 0 0",
                    p: { xs: 2.4, md: 3 },
                    background:
                      "linear-gradient(180deg, rgba(5,8,13,0.04), rgba(5,8,13,0.9) 72%)",
                  }}
                >
                  <Typography
                    sx={{
                      color: alpha(cinematicTokens.colors.text, 0.24),
                      fontFamily: cinematicTokens.typography.headingFont,
                      fontWeight: 900,
                      fontSize: "3rem",
                      lineHeight: 0.9,
                    }}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: cinematicTokens.typography.headingFont,
                      fontWeight: 900,
                      fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                      lineHeight: 0.96,
                      textTransform: "uppercase",
                    }}
                  >
                    {item.title}
                  </Typography>
                  {item.body ? (
                    <Typography
                      sx={{
                        color: cinematicTokens.colors.textSoft,
                        lineHeight: 1.78,
                      }}
                    >
                      {item.body}
                    </Typography>
                  ) : null}
                  {item.ctaText ? (
                    <FamilyLinkButton
                      href={item.ctaLink}
                      label={item.ctaText}
                      variant="text"
                      endIcon={<ArrowOutwardIcon />}
                      sx={{
                        alignSelf: "flex-start",
                        px: 0,
                        color: cinematicTokens.colors.text,
                        fontFamily: cinematicTokens.typography.headingFont,
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    />
                  ) : null}
                </Stack>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
