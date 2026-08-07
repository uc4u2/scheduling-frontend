import React from "react";
import { alpha, Box, Container, Grid, Stack, Typography } from "@mui/material";
import corporateTokens from "../tokens";
import { useCorporateReveal } from "../motion";
import { getTestimonials } from "../../hvac-shared/canonicalHvacAdapter";

export default function CorporateReviews({ websiteSectionAdapter: adapter = {}, invert = false }) {
  const items = getTestimonials(adapter);
  const title = adapter?.title || adapter?.props?.title || "Reviews";
  const subtitle = adapter?.subtitle || adapter?.props?.subtitle || "";
  const [ref, revealStyle] = useCorporateReveal({ delay: 18 });
  if (!items.length) return null;
  const lead = items[0];
  const rest = items.slice(1);
  const titleColor = invert ? "#f7fbff" : corporateTokens.colors.text;
  const bodyColor = invert ? "rgba(247,251,255,0.78)" : corporateTokens.colors.textSoft;
  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container maxWidth={false} sx={{ maxWidth: `${corporateTokens.layout.shellMax}px`, px: { xs: 2, md: 4 } }}>
        <Stack spacing={1.5} sx={{ mb: 2 }}>
          <Typography sx={{ color: titleColor, fontFamily: corporateTokens.typography.headingFont, fontWeight: 800, fontSize: "clamp(2rem, 4vw, 3.2rem)", lineHeight: 0.96 }}>{title}</Typography>
          {subtitle ? <Typography sx={{ maxWidth: 720, color: bodyColor, lineHeight: 1.75 }}>{subtitle}</Typography> : null}
        </Stack>
        <Grid container spacing={2}>
          {lead ? (
            <Grid item xs={12} lg={6}>
              <Box sx={{ height: "100%", p: { xs: 2.5, md: 3.2 }, bgcolor: invert ? alpha("#ffffff", 0.08) : "#fff", borderRadius: 4, border: `1px solid ${invert ? "rgba(255,255,255,0.12)" : corporateTokens.colors.line}`, boxShadow: invert ? "none" : "0 18px 42px rgba(18,38,58,0.08)" }}>
                <Typography sx={{ color: invert ? "rgba(255,255,255,0.68)" : corporateTokens.colors.teal, fontWeight: 700 }}>{lead.location || "Featured review"}</Typography>
                <Typography sx={{ mt: 1.4, color: titleColor, fontFamily: corporateTokens.typography.headingFont, fontWeight: 800, fontSize: "clamp(1.7rem, 2.8vw, 2.4rem)", lineHeight: 1.08 }}>
                  “{lead.quote}”
                </Typography>
                <Typography sx={{ mt: 2.2, color: bodyColor }}>{lead.author || "Client"}</Typography>
              </Box>
            </Grid>
          ) : null}
          <Grid item xs={12} lg={lead ? 6 : 12}>
            <Grid container spacing={2}>
              {(lead ? rest : items).map((item) => (
                <Grid item xs={12} md={6} key={item.id}>
                  <Box sx={{ height: "100%", p: 2.2, bgcolor: invert ? alpha("#ffffff", 0.08) : "#fff", borderRadius: 3, border: `1px solid ${invert ? "rgba(255,255,255,0.12)" : corporateTokens.colors.line}`, boxShadow: invert ? "none" : "0 18px 42px rgba(18,38,58,0.08)" }}>
                    <Typography sx={{ color: invert ? "rgba(255,255,255,0.62)" : corporateTokens.colors.teal, fontWeight: 700 }}>{item.location || "Client review"}</Typography>
                    <Typography sx={{ mt: 1.1, color: titleColor, lineHeight: 1.85 }}>
                      “{item.quote}”
                    </Typography>
                    <Typography sx={{ mt: 1.8, fontFamily: corporateTokens.typography.headingFont, fontWeight: 800, color: invert ? "#ffffff" : corporateTokens.colors.navy }}>
                      {item.author || "Client"}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
