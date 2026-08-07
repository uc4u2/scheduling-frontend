import React from "react";
import { Box, Container, Grid, Stack, Typography } from "@mui/material";
import corporateTokens from "../tokens";
import { useCorporateReveal } from "../motion";
import { getTestimonials } from "../../hvac-shared/canonicalHvacAdapter";

export default function CorporateReviews({ websiteSectionAdapter: adapter = {} }) {
  const items = getTestimonials(adapter);
  const title = adapter?.title || adapter?.props?.title || "Reviews";
  const subtitle = adapter?.subtitle || adapter?.props?.subtitle || "";
  const [ref, revealStyle] = useCorporateReveal({ delay: 18 });
  if (!items.length) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container maxWidth={false} sx={{ maxWidth: `${corporateTokens.layout.shellMax}px`, px: { xs: 2, md: 4 } }}>
        <Stack spacing={1.5} sx={{ mb: 2 }}>
          <Typography sx={{ fontFamily: corporateTokens.typography.headingFont, fontWeight: 800, fontSize: "clamp(2rem, 4vw, 3.2rem)", lineHeight: 0.96 }}>{title}</Typography>
          {subtitle ? <Typography sx={{ maxWidth: 720, color: corporateTokens.colors.textSoft, lineHeight: 1.75 }}>{subtitle}</Typography> : null}
        </Stack>
        <Grid container spacing={2}>
          {items.map((item) => (
            <Grid item xs={12} md={4} key={item.id}>
              <Box sx={{ height: "100%", p: 2.4, bgcolor: "#fff", borderRadius: 3, border: `1px solid ${corporateTokens.colors.line}`, boxShadow: "0 18px 42px rgba(18,38,58,0.08)" }}>
                <Typography sx={{ color: corporateTokens.colors.teal, fontWeight: 700 }}>{item.location || "Client review"}</Typography>
                <Typography sx={{ mt: 1.1, color: corporateTokens.colors.text, lineHeight: 1.85 }}>
                  “{item.quote}”
                </Typography>
                <Typography sx={{ mt: 2, fontFamily: corporateTokens.typography.headingFont, fontWeight: 800, color: corporateTokens.colors.navy }}>
                  {item.author || "Client"}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
