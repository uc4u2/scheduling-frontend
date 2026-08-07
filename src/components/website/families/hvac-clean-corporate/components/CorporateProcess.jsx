import React from "react";
import { alpha, Box, Container, Grid, Stack, Typography } from "@mui/material";
import corporateTokens from "../tokens";
import { useCorporateReveal } from "../motion";
import { getStoryData, getZigzagItems } from "../../hvac-shared/canonicalHvacAdapter";

export default function CorporateProcess({ websiteSectionAdapter: adapter = {}, sticky = false }) {
  const story = getStoryData(adapter?.props || {});
  const steps = getZigzagItems(adapter?.props || {});
  const items = steps.length
    ? steps
    : story.body.map((paragraph, idx) => ({
        id: `corp-step-${idx}`,
        title: idx === 0 ? story.title || "Step one" : `Step ${idx + 1}`,
        body: paragraph,
      }));
  const [ref, revealStyle] = useCorporateReveal({ delay: 18 });
  if (!items.length) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container maxWidth={false} sx={{ maxWidth: `${corporateTokens.layout.shellMax}px`, px: { xs: 2, md: 4 } }}>
        {sticky ? (
          <Grid container spacing={{ xs: 2.5, md: 3 }}>
            <Grid item xs={12} lg={4}>
              <Stack spacing={1.5} sx={{ position: { lg: "sticky" }, top: { lg: 110 } }}>
                {story.eyebrow ? <Typography sx={{ color: corporateTokens.colors.teal, fontWeight: 700 }}>{story.eyebrow}</Typography> : null}
                {story.title ? <Typography sx={{ fontFamily: corporateTokens.typography.headingFont, fontWeight: 800, fontSize: "clamp(2rem, 4vw, 3.3rem)", lineHeight: 0.96 }}>{story.title}</Typography> : null}
                {story.body?.[0] ? <Typography sx={{ color: corporateTokens.colors.textSoft, lineHeight: 1.8 }}>{story.body[0]}</Typography> : null}
              </Stack>
            </Grid>
            <Grid item xs={12} lg={8}>
              <Stack spacing={2}>
                {items.map((item, idx) => (
                  <Box key={item.id} sx={{ p: { xs: 2.2, md: 2.8 }, bgcolor: "#fff", borderRadius: 4, border: `1px solid ${corporateTokens.colors.line}`, boxShadow: "0 16px 42px rgba(16,43,67,0.06)" }}>
                    <Typography sx={{ color: alpha(corporateTokens.colors.navy, 0.24), fontFamily: corporateTokens.typography.headingFont, fontWeight: 800, fontSize: "2.2rem" }}>{String(idx + 1).padStart(2, "0")}</Typography>
                    <Typography sx={{ mt: 1, fontFamily: corporateTokens.typography.headingFont, fontWeight: 800, fontSize: "1.35rem", color: corporateTokens.colors.navy }}>{item.title}</Typography>
                    {item.body ? <Typography sx={{ mt: 1, color: corporateTokens.colors.textSoft, lineHeight: 1.8 }}>{item.body}</Typography> : null}
                  </Box>
                ))}
              </Stack>
            </Grid>
          </Grid>
        ) : (
          <>
            <Stack spacing={1.5} sx={{ mb: 2 }}>
              {story.eyebrow ? <Typography sx={{ color: corporateTokens.colors.teal, fontWeight: 700 }}>{story.eyebrow}</Typography> : null}
              {story.title ? <Typography sx={{ fontFamily: corporateTokens.typography.headingFont, fontWeight: 800, fontSize: "clamp(2rem, 4vw, 3.3rem)", lineHeight: 0.96 }}>{story.title}</Typography> : null}
            </Stack>
            <Grid container spacing={2}>
              {items.map((item, idx) => (
                <Grid item xs={12} md={6} lg={3} key={item.id}>
                  <Box sx={{ p: 2.2, height: "100%", bgcolor: "#fff", borderRadius: 3, border: `1px solid ${corporateTokens.colors.line}`, position: "relative" }}>
                    <Typography sx={{ color: alpha(corporateTokens.colors.navy, 0.22), fontFamily: corporateTokens.typography.headingFont, fontWeight: 800, fontSize: "2rem" }}>{String(idx + 1).padStart(2, "0")}</Typography>
                    <Typography sx={{ mt: 1, fontFamily: corporateTokens.typography.headingFont, fontWeight: 800, fontSize: "1.25rem", color: corporateTokens.colors.navy }}>{item.title}</Typography>
                    {item.body ? <Typography sx={{ mt: 1, color: corporateTokens.colors.textSoft, lineHeight: 1.75 }}>{item.body}</Typography> : null}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Container>
    </Box>
  );
}
