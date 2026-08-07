import React from "react";
import { Box, Container, Grid, Typography } from "@mui/material";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import comfortTokens from "../tokens";
import { useComfortReveal } from "../motion";
import { FamilyLinkButton } from "../../hvac-shared/runtime";
import { getStoryData } from "../../hvac-shared/canonicalHvacAdapter";

export default function ComfortProjectBeforeAfter({ websiteSectionAdapter: adapter = {} }) {
  const data = getStoryData(adapter?.props || {});
  const [ref, revealStyle] = useComfortReveal({ delay: 14 });
  if (!data.title && !data.mediaImage) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle, bgcolor: "#fff" }}>
      <Container maxWidth={false} sx={{ maxWidth: `${comfortTokens.layout.shellMax}px`, px: { xs: 2, md: 4 }, py: 4 }}>
        <Grid container spacing={2.4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ minHeight: 400, borderRadius: "40px 40px 120px 40px", background: data.mediaImage ? `url(${data.mediaImage}) center / cover no-repeat` : comfortTokens.colors.surfaceSoft }} />
          </Grid>
          <Grid item xs={12} md={6}>
            {data.eyebrow ? <Typography sx={{ color: comfortTokens.colors.teal, fontWeight: 700 }}>{data.eyebrow}</Typography> : null}
            <Typography sx={{ mt: 1, color: comfortTokens.colors.text, fontFamily: comfortTokens.typography.headingFont, fontWeight: 700, fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 0.96 }}>{data.title}</Typography>
            {data.body.map((paragraph, idx) => <Typography key={idx} sx={{ mt: 1.1, color: comfortTokens.colors.textSoft, lineHeight: 1.8 }}>{paragraph}</Typography>)}
            {data.ctaText ? <FamilyLinkButton href={data.ctaLink} label={data.ctaText} endIcon={<ArrowOutwardIcon />} sx={{ mt: 2, borderRadius: 999, background: `linear-gradient(135deg, ${comfortTokens.colors.navy} 0%, ${comfortTokens.colors.teal} 100%)`, color: "#fff", fontWeight: 800 }} /> : null}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
