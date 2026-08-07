import React from "react";
import { Box, Container, Grid, Stack, Typography } from "@mui/material";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import corporateTokens from "../tokens";
import { useCorporateReveal } from "../motion";
import { FamilyLinkButton } from "../../hvac-shared/runtime";
import { getStoryData } from "../../hvac-shared/canonicalHvacAdapter";

export default function CorporateProjectCaseStudy({ websiteSectionAdapter: adapter = {} }) {
  const story = getStoryData(adapter?.props || {});
  const [ref, revealStyle] = useCorporateReveal({ delay: 26 });
  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container maxWidth={false} sx={{ maxWidth: `${corporateTokens.layout.shellMax}px`, px: { xs: 2, md: 4 } }}>
        <Grid container spacing={2.5} alignItems="stretch">
          <Grid item xs={12} lg={6}>
            <Box sx={{ minHeight: { xs: 320, md: 460 }, borderRadius: 4, background: story.mediaImage ? `url(${story.mediaImage}) center / cover no-repeat` : corporateTokens.colors.surfaceSoft }} />
          </Grid>
          <Grid item xs={12} lg={6}>
            <Stack spacing={1.5} sx={{ p: { xs: 2, md: 3 }, height: "100%", bgcolor: "#fff", borderRadius: 4, border: `1px solid ${corporateTokens.colors.line}` }}>
              {story.eyebrow ? <Typography sx={{ color: corporateTokens.colors.teal, fontWeight: 700 }}>{story.eyebrow}</Typography> : null}
              <Typography sx={{ fontFamily: corporateTokens.typography.headingFont, fontWeight: 800, fontSize: "clamp(2rem, 4vw, 3.2rem)", lineHeight: 0.96, color: corporateTokens.colors.text }}>
                {story.title}
              </Typography>
              {story.body.map((paragraph, idx) => (
                <Typography key={idx} sx={{ color: corporateTokens.colors.textSoft, lineHeight: 1.8 }}>
                  {paragraph}
                </Typography>
              ))}
              {story.mediaTitle ? (
                <Box sx={{ mt: 1, p: 2, bgcolor: corporateTokens.colors.surfaceSoft, borderRadius: 3 }}>
                  <Typography sx={{ fontFamily: corporateTokens.typography.headingFont, fontWeight: 800, color: corporateTokens.colors.navy }}>
                    {story.mediaTitle}
                  </Typography>
                  {story.mediaBody.map((paragraph, idx) => (
                    <Typography key={idx} sx={{ mt: 0.7, color: corporateTokens.colors.textSoft, lineHeight: 1.75 }}>
                      {paragraph}
                    </Typography>
                  ))}
                </Box>
              ) : null}
              {story.ctaText ? <FamilyLinkButton href={story.ctaLink} label={story.ctaText} variant="text" endIcon={<ArrowOutwardIcon />} sx={{ alignSelf: "flex-start", px: 0, color: corporateTokens.colors.teal, fontWeight: 700 }} /> : null}
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
