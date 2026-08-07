import React, { useState } from "react";
import { alpha, Box, Container, Grid, Stack, Typography } from "@mui/material";
import cinematicTokens from "../tokens";
import { useCinematicReveal } from "../motion";
import { FamilyLinkButton, useCountUp } from "../../hvac-shared/runtime";
import { getPricingPlans, getServiceCards } from "../../hvac-shared/canonicalHvacAdapter";
import { CinematicServices as ServicesOverview } from "./CinematicHero";

export { ServicesOverview as CinematicServices };

export function CinematicServiceSelector({ websiteSectionAdapter: adapter = {} }) {
  const cards = getServiceCards(adapter);
  const [selected, setSelected] = useState(0);
  const [ref, revealStyle] = useCinematicReveal({ delay: 40 });
  const active = cards[selected] || cards[0] || null;
  if (!active) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container maxWidth={false} sx={{ maxWidth: `${cinematicTokens.layout.shellMax}px`, px: { xs: 2, md: 4 } }}>
        <Grid container spacing={2.5}>
          <Grid item xs={12} lg={4}>
            <Stack spacing={1.1}>
              {cards.slice(0, 6).map((item, idx) => (
                <Box
                  key={item.id}
                  onClick={() => setSelected(idx)}
                  sx={{
                    cursor: "pointer",
                    p: 2,
                    border: `1px solid ${idx === selected ? alpha(cinematicTokens.colors.accent, 0.5) : cinematicTokens.colors.line}`,
                    bgcolor: idx === selected ? alpha(cinematicTokens.colors.accent, 0.08) : alpha(cinematicTokens.colors.surfaceSoft, 0.88),
                    clipPath: idx % 2 === 0 ? cinematicTokens.graphics.clipA : cinematicTokens.graphics.clipB,
                  }}
                >
                  <Typography sx={{ fontFamily: cinematicTokens.typography.headingFont, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {item.title}
                  </Typography>
                  {item.meta ? <Typography sx={{ mt: 0.6, color: cinematicTokens.colors.textSoft }}>{item.meta}</Typography> : null}
                </Box>
              ))}
            </Stack>
          </Grid>
          <Grid item xs={12} lg={8}>
            <Box sx={{ minHeight: 420, p: { xs: 3, md: 4 }, border: `1px solid ${cinematicTokens.colors.line}`, background: active.image ? `linear-gradient(180deg, rgba(5,8,13,0.14), rgba(5,8,13,0.72)), url(${active.image}) center / cover no-repeat` : alpha(cinematicTokens.colors.surface, 0.96), clipPath: cinematicTokens.graphics.clipA }}>
              <Stack spacing={1.5} sx={{ maxWidth: 420 }}>
                {active.badge ? <Typography sx={{ color: cinematicTokens.colors.accent, fontFamily: cinematicTokens.typography.headingFont, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", fontSize: "0.78rem" }}>{active.badge}</Typography> : null}
                <Typography sx={{ fontFamily: cinematicTokens.typography.headingFont, fontWeight: 900, fontSize: "clamp(2rem, 4vw, 3.4rem)", lineHeight: 0.92, letterSpacing: "-0.03em", textTransform: "uppercase" }}>
                  {active.title}
                </Typography>
                {active.description ? <Typography sx={{ color: cinematicTokens.colors.textSoft, lineHeight: 1.8 }}>{active.description}</Typography> : null}
                <FamilyLinkButton href={active.link} label="Explore service" sx={{ alignSelf: "flex-start", mt: 1, minHeight: 50, px: 3, borderRadius: 999, background: `linear-gradient(135deg, ${cinematicTokens.colors.accent} 0%, #ffb65c 100%)`, color: "#071019", fontFamily: cinematicTokens.typography.headingFont, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase" }} />
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

function StatBox({ value, label }) {
  const rendered = useCountUp(value, true, 1100);
  return (
    <Box sx={{ p: 2.2, border: `1px solid ${cinematicTokens.colors.line}`, background: alpha(cinematicTokens.colors.surfaceSoft, 0.92), minHeight: 144 }}>
      <Typography sx={{ fontFamily: cinematicTokens.typography.headingFont, fontWeight: 900, fontSize: "clamp(2rem, 4vw, 3.2rem)", lineHeight: 0.9, letterSpacing: "-0.03em" }}>
        {rendered}
      </Typography>
      <Typography sx={{ mt: 1, color: cinematicTokens.colors.textSoft, lineHeight: 1.6 }}>{label}</Typography>
    </Box>
  );
}

export function CinematicStats({ websiteSectionAdapter: adapter = {} }) {
  const plans = getPricingPlans(adapter.props || adapter?.props || {});
  const [ref, revealStyle] = useCinematicReveal({ delay: 50 });
  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container maxWidth={false} sx={{ maxWidth: `${cinematicTokens.layout.shellMax}px`, px: { xs: 2, md: 4 } }}>
        <Grid container spacing={2}>
          {plans.slice(0, 4).map((plan) => (
            <Grid item xs={12} md={6} lg={3} key={plan.id}>
              <StatBox value={plan.price} label={plan.name} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
