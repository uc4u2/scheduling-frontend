import React from "react";
import { alpha, Box, Container, Grid, Stack, Typography } from "@mui/material";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import cinematicTokens from "../tokens";
import { useCinematicReveal } from "../motion";
import { getTestimonials } from "../../hvac-shared/canonicalHvacAdapter";

export default function CinematicReviews({ websiteSectionAdapter: adapter = {} }) {
  const items = getTestimonials(adapter);
  const title = adapter?.title || adapter?.props?.title || "Client proof";
  const subtitle = adapter?.subtitle || adapter?.props?.subtitle || "";
  const [ref, revealStyle] = useCinematicReveal({ delay: 35 });

  if (!items.length) return null;

  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container
        maxWidth={false}
        sx={{ maxWidth: `${cinematicTokens.layout.shellMax}px`, px: { xs: 2, md: 4 } }}
      >
        <Stack spacing={1.6} sx={{ mb: 3 }}>
          <Typography
            sx={{
              fontFamily: cinematicTokens.typography.headingFont,
              fontWeight: 900,
              fontSize: "clamp(2rem, 4vw, 3.6rem)",
              lineHeight: 0.95,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
            }}
          >
            {title}
          </Typography>
          {subtitle ? (
            <Typography sx={{ maxWidth: 720, color: cinematicTokens.colors.textSoft, lineHeight: 1.75 }}>
              {subtitle}
            </Typography>
          ) : null}
        </Stack>
        <Grid container spacing={2.2}>
          {items.map((item, idx) => (
            <Grid item xs={12} md={idx === 0 ? 6 : 3} key={item.id}>
              <Box
                sx={{
                  height: "100%",
                  minHeight: idx === 0 ? 320 : 260,
                  display: "grid",
                  alignContent: "space-between",
                  gap: 2,
                  p: { xs: 2.4, md: 2.8 },
                  border: `1px solid ${cinematicTokens.colors.line}`,
                  clipPath:
                    idx % 2 === 0
                      ? cinematicTokens.graphics.clipA
                      : cinematicTokens.graphics.clipB,
                  bgcolor:
                    idx === 0
                      ? alpha(cinematicTokens.colors.steel, 0.16)
                      : alpha(cinematicTokens.colors.surfaceSoft, 0.92),
                }}
              >
                <Stack direction="row" spacing={0.35}>
                  {Array.from({ length: Math.max(1, item.rating || 5) }).map((_, starIdx) => (
                    <StarRoundedIcon
                      key={starIdx}
                      sx={{ color: cinematicTokens.colors.accent, fontSize: 18 }}
                    />
                  ))}
                </Stack>
                <Typography
                  sx={{
                    fontSize: idx === 0 ? "1.15rem" : "1rem",
                    lineHeight: 1.8,
                    color: cinematicTokens.colors.text,
                  }}
                >
                  “{item.quote}”
                </Typography>
                <Box>
                  <Typography
                    sx={{
                      fontFamily: cinematicTokens.typography.headingFont,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {item.author || "Client"}
                  </Typography>
                  {item.location ? (
                    <Typography sx={{ color: cinematicTokens.colors.textMuted, fontSize: "0.92rem" }}>
                      {item.location}
                    </Typography>
                  ) : null}
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
