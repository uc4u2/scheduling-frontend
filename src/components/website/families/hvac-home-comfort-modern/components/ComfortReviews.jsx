import React from "react";
import { Box, Container, Grid, Typography } from "@mui/material";
import comfortTokens from "../tokens";
import { useComfortReveal } from "../motion";
import { getTestimonials } from "../../hvac-shared/canonicalHvacAdapter";

export default function ComfortReviews({ websiteSectionAdapter: adapter = {} }) {
  const items = getTestimonials(adapter?.props || adapter || {});
  const [ref, revealStyle] = useComfortReveal({ delay: 16 });
  if (!items.length) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle, bgcolor: comfortTokens.colors.cream }}>
      <Container maxWidth={false} sx={{ maxWidth: `${comfortTokens.layout.shellMax}px`, px: { xs: 2, md: 4 }, py: 4 }}>
        <Typography sx={{ color: comfortTokens.colors.text, fontFamily: comfortTokens.typography.headingFont, fontWeight: 700, fontSize: "clamp(2rem, 4vw, 3rem)", mb: 2 }}>Client stories</Typography>
        <Grid container spacing={2}>
          {items.slice(0, 6).map((item, idx) => (
            <Grid item xs={12} md={idx === 0 ? 6 : 3} key={item.id}>
              <Box sx={{ p: 2.2, height: "100%", borderRadius: "24px 24px 64px 24px", bgcolor: "#fff", border: `1px solid ${comfortTokens.colors.line}` }}>
                <Typography sx={{ color: comfortTokens.colors.text, lineHeight: 1.78 }}>"{item.quote}"</Typography>
                <Typography sx={{ mt: 1.25, color: comfortTokens.colors.navy, fontWeight: 700 }}>{item.author}</Typography>
                {item.location ? <Typography sx={{ color: comfortTokens.colors.textMuted }}>{item.location}</Typography> : null}
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
