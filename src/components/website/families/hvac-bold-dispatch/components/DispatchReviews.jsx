import React from "react";
import { alpha, Box, Container, Grid, Stack, Typography } from "@mui/material";
import dispatchTokens from "../tokens";
import { useDispatchReveal } from "../motion";
import { getTestimonials } from "../../hvac-shared/canonicalHvacAdapter";
import { sanitizeDispatchReview } from "./contentSanitizer";

export default function DispatchReviewsTicker({ websiteSectionAdapter: adapter = {} }) {
  const items = getTestimonials(adapter?.props || adapter || {}).map((item, idx) =>
    sanitizeDispatchReview(item, idx)
  );
  const [ref, revealStyle] = useDispatchReveal({ delay: 18 });
  if (!items.length) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle, bgcolor: dispatchTokens.colors.bg }}>
      <Container maxWidth={false} sx={{ maxWidth: `${dispatchTokens.layout.shellMax}px`, px: { xs: 2, md: 4 }, py: 4 }}>
        <Typography sx={{ color: dispatchTokens.colors.orange, fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900, textTransform: "uppercase", fontSize: "2rem", mb: 2 }}>
          What clients say
        </Typography>
        <Grid container spacing={2}>
          {items.slice(0, 6).map((item, idx) => (
            <Grid item xs={12} md={idx === 0 ? 6 : 3} key={item.id}>
              <Box sx={{ p: 2.2, height: "100%", bgcolor: alpha(dispatchTokens.colors.surface, 0.96), borderTop: `6px solid ${idx === 0 ? dispatchTokens.colors.orange : dispatchTokens.colors.red}` }}>
                <Typography sx={{ color: dispatchTokens.colors.text, fontSize: idx === 0 ? "1.22rem" : "1rem", lineHeight: 1.75 }}>"{item.quote}"</Typography>
                <Typography sx={{ mt: 1.5, fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900, textTransform: "uppercase" }}>{item.author}</Typography>
                {item.location ? <Typography sx={{ color: dispatchTokens.colors.textMuted }}>{item.location}</Typography> : null}
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
