import React from "react";
import { alpha, Box, Container, Grid, Stack, Typography } from "@mui/material";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import corporateTokens from "../tokens";
import { useCorporateReveal } from "../motion";
import { FamilyLinkButton, useCountUp } from "../../hvac-shared/runtime";
import {
  getPricingPlans,
  getServiceCards,
  getShowcaseItems,
} from "../../hvac-shared/canonicalHvacAdapter";

export function CorporateServices({ websiteSectionAdapter: adapter = {} }) {
  const items = getShowcaseItems(adapter?.props || {});
  const title = adapter?.props?.title || "Core services";
  const subtitle = adapter?.props?.subtitle || "";
  const [ref, revealStyle] = useCorporateReveal({ delay: 24 });
  if (!items.length) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container maxWidth={false} sx={{ maxWidth: `${corporateTokens.layout.shellMax}px`, px: { xs: 2, md: 4 } }}>
        <Stack spacing={1.8} sx={{ mb: 2.5 }}>
          <Typography sx={{ fontFamily: corporateTokens.typography.headingFont, fontWeight: 800, fontSize: "clamp(2rem, 4vw, 3.6rem)", lineHeight: 0.95 }}>
            {title}
          </Typography>
          {subtitle ? <Typography sx={{ maxWidth: 720, color: corporateTokens.colors.textSoft, lineHeight: 1.8 }}>{subtitle}</Typography> : null}
        </Stack>
        <Grid container spacing={2}>
          {items.slice(0, 6).map((item, idx) => (
            <Grid item xs={12} md={idx === 0 ? 6 : 3} key={item.id}>
              <Box sx={{ height: "100%", bgcolor: "#fff", borderRadius: 3, overflow: "hidden", border: `1px solid ${corporateTokens.colors.line}`, boxShadow: "0 18px 50px rgba(18,38,58,0.08)" }}>
                <Box sx={{ minHeight: idx === 0 ? 250 : 180, background: item.image ? `url(${item.image}) center / cover no-repeat` : corporateTokens.colors.surfaceSoft }} />
                <Stack spacing={1.1} sx={{ p: 2.2 }}>
                  <Typography sx={{ color: alpha(corporateTokens.colors.navy, 0.35), fontWeight: 800 }}>{String(idx + 1).padStart(2, "0")}</Typography>
                  <Typography sx={{ fontFamily: corporateTokens.typography.headingFont, fontWeight: 800, fontSize: idx === 0 ? "1.7rem" : "1.15rem", lineHeight: 1.05, color: corporateTokens.colors.text }}>
                    {item.title}
                  </Typography>
                  {item.description ? <Typography sx={{ color: corporateTokens.colors.textSoft, lineHeight: 1.75 }}>{item.description}</Typography> : null}
                  <FamilyLinkButton href={item.link} label={item.linkText || "Explore"} variant="text" endIcon={<ArrowOutwardIcon />} sx={{ alignSelf: "flex-start", px: 0, color: corporateTokens.colors.teal, fontWeight: 700 }} />
                </Stack>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

export function CorporateBenefits({ websiteSectionAdapter: adapter = {} }) {
  const cards = getServiceCards(adapter);
  const [ref, revealStyle] = useCorporateReveal({ delay: 24 });
  if (!cards.length) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container maxWidth={false} sx={{ maxWidth: `${corporateTokens.layout.shellMax}px`, px: { xs: 2, md: 4 } }}>
        <Grid container spacing={2}>
          {cards.slice(0, 6).map((item) => (
            <Grid item xs={12} md={6} lg={4} key={item.id}>
              <Box sx={{ p: 2.4, height: "100%", bgcolor: "#ffffff", borderRadius: 3, border: `1px solid ${corporateTokens.colors.line}` }}>
                {item.badge ? <Typography sx={{ color: corporateTokens.colors.teal, fontWeight: 700 }}>{item.badge}</Typography> : null}
                <Typography sx={{ mt: 1, fontFamily: corporateTokens.typography.headingFont, fontWeight: 800, fontSize: "1.3rem", color: corporateTokens.colors.navy }}>
                  {item.title}
                </Typography>
                {item.description ? <Typography sx={{ mt: 1, color: corporateTokens.colors.textSoft, lineHeight: 1.72 }}>{item.description}</Typography> : null}
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

export function CorporateStats({ websiteSectionAdapter: adapter = {} }) {
  const plans = getPricingPlans(adapter?.props || {});
  const [ref, revealStyle] = useCorporateReveal({ delay: 16 });
  if (!plans.length) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container maxWidth={false} sx={{ maxWidth: `${corporateTokens.layout.shellMax}px`, px: { xs: 2, md: 4 } }}>
        <Grid container spacing={2}>
          {plans.slice(0, 4).map((plan) => (
            <Grid item xs={12} sm={6} md={3} key={plan.id}>
              <CorporateStatCard plan={plan} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

function CorporateStatCard({ plan }) {
  const value = useCountUp(plan.price, true, 1000);
  return (
    <Box sx={{ p: 2.4, bgcolor: "#fff", borderRadius: 3, border: `1px solid ${corporateTokens.colors.line}` }}>
      <Typography sx={{ fontFamily: corporateTokens.typography.headingFont, fontWeight: 800, fontSize: "2.2rem", color: corporateTokens.colors.navy }}>
        {value}
      </Typography>
      <Typography sx={{ mt: 0.8, color: corporateTokens.colors.textSoft }}>{plan.name}</Typography>
    </Box>
  );
}
