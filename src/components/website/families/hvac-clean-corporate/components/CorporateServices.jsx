import React from "react";
import { alpha, Box, Button, Container, Grid, Stack, Typography } from "@mui/material";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import corporateTokens from "../tokens";
import { useCorporateReveal } from "../motion";
import { FamilyLinkButton, useCountUp } from "../../hvac-shared/runtime";
import {
  getPricingPlans,
  getServiceCards,
  getShowcaseItems,
} from "../../hvac-shared/canonicalHvacAdapter";

export function CorporateProblemSelector({ websiteSectionAdapter: adapter = {} }) {
  const items = getServiceCards(adapter);
  const [active, setActive] = React.useState(0);
  const [ref, revealStyle] = useCorporateReveal({ delay: 20 });
  const current = items[active] || items[0];
  if (!current) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container maxWidth={false} sx={{ maxWidth: `${corporateTokens.layout.shellMax}px`, px: { xs: 2, md: 4 } }}>
        <Grid container spacing={{ xs: 2, md: 3 }}>
          <Grid item xs={12} lg={4}>
            <Stack spacing={1}>
              {items.slice(0, 6).map((item, idx) => {
                const selected = idx === active;
                return (
                  <Button
                    key={item.id}
                    onClick={() => setActive(idx)}
                    sx={{
                      justifyContent: "flex-start",
                      alignItems: "stretch",
                      flexDirection: "column",
                      px: 2,
                      py: 1.8,
                      textAlign: "left",
                      borderRadius: 3,
                      border: `1px solid ${selected ? alpha(corporateTokens.colors.teal, 0.36) : corporateTokens.colors.line}`,
                      backgroundColor: selected ? "#ffffff" : alpha("#ffffff", 0.64),
                      boxShadow: selected ? "0 18px 40px rgba(16,43,67,0.08)" : "none",
                      color: corporateTokens.colors.text,
                    }}
                  >
                    <Typography sx={{ fontFamily: corporateTokens.typography.headingFont, fontWeight: 800, color: corporateTokens.colors.navy }}>
                      {item.title}
                    </Typography>
                    {item.meta ? <Typography sx={{ mt: 0.4, color: corporateTokens.colors.textMuted, fontSize: "0.9rem" }}>{item.meta}</Typography> : null}
                  </Button>
                );
              })}
            </Stack>
          </Grid>
          <Grid item xs={12} lg={8}>
            <Grid container spacing={2.5} alignItems="stretch">
              <Grid item xs={12} md={7}>
                <Box
                  sx={{
                    minHeight: { xs: 260, md: 420 },
                    borderRadius: 4,
                    overflow: "hidden",
                    background: current.image
                      ? `linear-gradient(180deg, rgba(16,43,67,0.05), rgba(16,43,67,0.18)), url(${current.image}) center / cover no-repeat`
                      : `linear-gradient(135deg, ${corporateTokens.colors.surfaceSoft} 0%, #ffffff 100%)`,
                    boxShadow: "0 24px 56px rgba(16,43,67,0.12)",
                  }}
                />
              </Grid>
              <Grid item xs={12} md={5}>
                <Stack
                  spacing={1.3}
                  sx={{
                    height: "100%",
                    p: { xs: 2.3, md: 2.8 },
                    borderRadius: 4,
                    backgroundColor: "#ffffff",
                    border: `1px solid ${corporateTokens.colors.line}`,
                    boxShadow: "0 20px 52px rgba(16,43,67,0.08)",
                  }}
                >
                  {current.badge ? <Typography sx={{ color: corporateTokens.colors.teal, fontWeight: 700 }}>{current.badge}</Typography> : null}
                  <Typography sx={{ fontFamily: corporateTokens.typography.headingFont, fontWeight: 800, fontSize: "clamp(1.8rem, 3vw, 2.6rem)", lineHeight: 0.96, color: corporateTokens.colors.text }}>
                    {current.title}
                  </Typography>
                  {current.description ? <Typography sx={{ color: corporateTokens.colors.textSoft, lineHeight: 1.8 }}>{current.description}</Typography> : null}
                  <FamilyLinkButton
                    href={current.link}
                    label={current.ctaText || "View service"}
                    endIcon={<ArrowOutwardIcon />}
                    sx={{
                      mt: "auto",
                      alignSelf: "flex-start",
                      minHeight: 48,
                      px: 2.4,
                      borderRadius: 999,
                      background: `linear-gradient(135deg, ${corporateTokens.colors.navy} 0%, ${corporateTokens.colors.teal} 100%)`,
                      color: "#fff",
                      fontFamily: corporateTokens.typography.headingFont,
                      fontWeight: 800,
                    }}
                  />
                </Stack>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

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

export function CorporatePlans({ websiteSectionAdapter: adapter = {} }) {
  const plans = getPricingPlans(adapter?.props || {});
  const [ref, revealStyle] = useCorporateReveal({ delay: 16 });
  if (!plans.length) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container maxWidth={false} sx={{ maxWidth: `${corporateTokens.layout.shellMax}px`, px: { xs: 2, md: 4 } }}>
        <Grid container spacing={2}>
          {plans.slice(0, 3).map((plan) => (
            <Grid item xs={12} md={4} key={plan.id}>
              <Box
                sx={{
                  p: { xs: 2.5, md: 3 },
                  height: "100%",
                  borderRadius: 4,
                  backgroundColor: "#ffffff",
                  border: `1px solid ${plan.featured ? alpha(corporateTokens.colors.teal, 0.3) : corporateTokens.colors.line}`,
                  boxShadow: plan.featured ? "0 24px 56px rgba(16,43,67,0.12)" : "0 18px 44px rgba(16,43,67,0.06)",
                }}
              >
                {plan.ribbon ? <Typography sx={{ color: corporateTokens.colors.teal, fontWeight: 700 }}>{plan.ribbon}</Typography> : null}
                <Typography sx={{ mt: 0.6, fontFamily: corporateTokens.typography.headingFont, fontWeight: 800, fontSize: "1.8rem", color: corporateTokens.colors.navy }}>{plan.name}</Typography>
                {plan.price ? <Typography sx={{ mt: 1.1, fontFamily: corporateTokens.typography.headingFont, fontWeight: 800, fontSize: "2.4rem", color: corporateTokens.colors.text }}>{plan.price}</Typography> : null}
                <Stack spacing={1} sx={{ mt: 2.2, mb: 2.5 }}>
                  {plan.features.slice(0, 6).map((feature, idx) => (
                    <Typography key={idx} sx={{ color: corporateTokens.colors.textSoft, lineHeight: 1.7 }}>
                      {feature}
                    </Typography>
                  ))}
                </Stack>
                <FamilyLinkButton
                  href={plan.ctaLink}
                  label={plan.ctaText || "Request plan details"}
                  endIcon={<ArrowOutwardIcon />}
                  sx={{
                    minHeight: 48,
                    px: 2.4,
                    borderRadius: 999,
                    background: plan.featured
                      ? `linear-gradient(135deg, ${corporateTokens.colors.navy} 0%, ${corporateTokens.colors.teal} 100%)`
                      : "transparent",
                    border: plan.featured ? "none" : `1px solid ${corporateTokens.colors.lineStrong}`,
                    color: plan.featured ? "#fff" : corporateTokens.colors.navy,
                    fontFamily: corporateTokens.typography.headingFont,
                    fontWeight: 800,
                  }}
                />
              </Box>
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
