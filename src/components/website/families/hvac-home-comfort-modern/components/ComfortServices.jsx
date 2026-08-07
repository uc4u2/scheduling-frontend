import React, { useState } from "react";
import { alpha, Box, Container, Grid, Stack, Typography } from "@mui/material";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { IconButton } from "@mui/material";
import comfortTokens from "../tokens";
import { useComfortReveal } from "../motion";
import { FamilyLinkButton, useCountUp, useRailSlider } from "../../hvac-shared/runtime";
import { getFeatureShowcaseSliderData, getPricingPlans, getServiceCards, getShowcaseItems } from "../../hvac-shared/canonicalHvacAdapter";

export function ComfortProblemSelector({ websiteSectionAdapter: adapter = {} }) {
  const cards = getServiceCards(adapter);
  const [selected, setSelected] = useState(0);
  const [ref, revealStyle] = useComfortReveal({ delay: 16 });
  const active = cards[selected] || cards[0];
  if (!active) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle, bgcolor: comfortTokens.colors.bg }}>
      <Container maxWidth={false} sx={{ maxWidth: `${comfortTokens.layout.shellMax}px`, px: { xs: 2, md: 4 }, py: 4 }}>
        <Grid container spacing={2.4}>
          <Grid item xs={12} md={4}>
            <Stack spacing={1.1}>
              {cards.slice(0, 6).map((item, idx) => (
                <Box key={item.id} onClick={() => setSelected(idx)} sx={{ p: 1.5, cursor: "pointer", borderRadius: 4, bgcolor: idx === selected ? "#fff" : alpha("#fff", 0.72), border: `1px solid ${idx === selected ? alpha(comfortTokens.colors.teal, 0.36) : comfortTokens.colors.line}` }}>
                  <Typography sx={{ fontWeight: 700, color: comfortTokens.colors.text }}>{item.title}</Typography>
                  {item.meta ? <Typography sx={{ mt: 0.4, color: comfortTokens.colors.textMuted, fontSize: "0.88rem" }}>{item.meta}</Typography> : null}
                </Box>
              ))}
            </Stack>
          </Grid>
          <Grid item xs={12} md={8}>
            <Box sx={{ minHeight: 360, p: { xs: 2.4, md: 3 }, borderRadius: "28px 28px 88px 28px", background: active.image ? `linear-gradient(180deg, rgba(255,255,255,0.04), rgba(24,52,74,0.12)), url(${active.image}) center / cover no-repeat` : comfortTokens.colors.surfaceSoft, border: `1px solid ${comfortTokens.colors.line}` }}>
              {active.badge ? <Typography sx={{ color: comfortTokens.colors.teal, fontWeight: 700 }}>{active.badge}</Typography> : null}
              <Typography sx={{ mt: 1, color: comfortTokens.colors.text, fontFamily: comfortTokens.typography.headingFont, fontWeight: 700, fontSize: "clamp(1.9rem, 4vw, 3rem)", lineHeight: 0.96 }}>{active.title}</Typography>
              {active.description ? <Typography sx={{ mt: 1.1, maxWidth: 520, color: comfortTokens.colors.textSoft, lineHeight: 1.78 }}>{active.description}</Typography> : null}
              <FamilyLinkButton href={active.link} label={active.ctaText || "Learn more"} endIcon={<ArrowOutwardIcon />} sx={{ mt: 2, borderRadius: 999, background: `linear-gradient(135deg, ${comfortTokens.colors.navy} 0%, ${comfortTokens.colors.teal} 100%)`, color: "#fff", fontWeight: 800 }} />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export function ComfortFeatureSlider({ websiteSectionAdapter: adapter = {} }) {
  const data = getFeatureShowcaseSliderData(adapter?.props || {});
  const [ref, revealStyle] = useComfortReveal({ delay: 16 });
  const { active, setActive, next, prev, interactionProps } = useRailSlider({ itemCount: data.items.length, autoplay: data.autoplay, intervalMs: data.intervalMs });
  if (!data.items.length) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle, bgcolor: "#fff" }}>
      <Container maxWidth={false} sx={{ maxWidth: `${comfortTokens.layout.shellMax}px`, px: { xs: 2, md: 4 }, py: 4 }}>
        {data.eyebrow ? <Typography sx={{ color: comfortTokens.colors.teal, fontWeight: 700 }}>{data.eyebrow}</Typography> : null}
        {data.title ? <Typography sx={{ mt: 0.8, fontFamily: comfortTokens.typography.headingFont, fontWeight: 700, fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 0.96, color: comfortTokens.colors.text }}>{data.title}</Typography> : null}
        {data.subtitle ? <Typography sx={{ mt: 1, maxWidth: 760, color: comfortTokens.colors.textSoft, lineHeight: 1.75 }}>{data.subtitle}</Typography> : null}
        <Stack direction="row" justifyContent="flex-end" spacing={0.8} sx={{ mt: 1.3, mb: 1.5 }}>
          {data.showArrows ? <><IconButton onClick={prev} aria-label="Previous slide" sx={{ border: `1px solid ${comfortTokens.colors.line}` }}><ChevronLeftIcon /></IconButton><IconButton onClick={next} aria-label="Next slide" sx={{ border: `1px solid ${comfortTokens.colors.line}` }}><ChevronRightIcon /></IconButton></> : null}
        </Stack>
        <Box tabIndex={0} role="region" aria-label={data.title || "Feature showcase"} {...interactionProps} sx={{ display: "grid", gridAutoFlow: "column", gridAutoColumns: { xs: "92%", md: "34%" }, gap: 2, overflowX: "auto", pb: 1, scrollSnapType: "x mandatory" }}>
          {data.items.map((item, idx) => (
            <Box key={item.id} onFocus={() => setActive(idx)} onMouseEnter={() => setActive(idx)} sx={{ scrollSnapAlign: "start", minHeight: 360, p: 2.2, bgcolor: idx === active ? "#fff" : comfortTokens.colors.surfaceSoft, borderRadius: "24px 24px 72px 24px", border: `1px solid ${idx === active ? alpha(comfortTokens.colors.teal, 0.35) : comfortTokens.colors.line}`, boxShadow: idx === active ? "0 18px 42px rgba(24,52,74,0.10)" : "none", display: "flex", flexDirection: "column" }}>
              {item.image ? <Box sx={{ minHeight: 180, borderRadius: 4, background: `url(${item.image}) center / cover no-repeat` }} /> : null}
              {item.badge ? <Typography sx={{ mt: 1.2, color: comfortTokens.colors.teal, fontWeight: 700 }}>{item.badge}</Typography> : null}
              <Typography sx={{ mt: 0.6, color: comfortTokens.colors.text, fontFamily: comfortTokens.typography.headingFont, fontWeight: 700, fontSize: "1.45rem", lineHeight: 1 }}>{item.title}</Typography>
              {item.description ? <Typography sx={{ mt: 0.9, color: comfortTokens.colors.textSoft, lineHeight: 1.75 }}>{item.description}</Typography> : null}
              <FamilyLinkButton href={item.ctaLink} label={item.ctaText || "View service"} endIcon={<ArrowOutwardIcon />} sx={{ mt: "auto", alignSelf: "flex-start", borderRadius: 999, bgcolor: alpha(comfortTokens.colors.sky, 0.22), color: comfortTokens.colors.navy, fontWeight: 700 }} />
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}

export function ComfortServices({ websiteSectionAdapter: adapter = {} }) {
  const items = getShowcaseItems(adapter?.props || {});
  const [ref, revealStyle] = useComfortReveal({ delay: 16 });
  if (!items.length) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle, bgcolor: comfortTokens.colors.bg }}>
      <Container maxWidth={false} sx={{ maxWidth: `${comfortTokens.layout.shellMax}px`, px: { xs: 2, md: 4 }, py: 4 }}>
        <Grid container spacing={2}>
          {items.slice(0, 6).map((item, idx) => (
            <Grid item xs={12} md={idx === 0 ? 6 : 3} key={item.id}>
              <Box sx={{ height: "100%", bgcolor: "#fff", borderRadius: "24px 24px 72px 24px", overflow: "hidden", border: `1px solid ${comfortTokens.colors.line}` }}>
                <Box sx={{ minHeight: idx === 0 ? 220 : 170, background: item.image ? `url(${item.image}) center / cover no-repeat` : comfortTokens.colors.surfaceSoft }} />
                <Stack spacing={1} sx={{ p: 2.2 }}>
                  {item.badge ? <Typography sx={{ color: comfortTokens.colors.teal, fontWeight: 700 }}>{item.badge}</Typography> : null}
                  <Typography sx={{ color: comfortTokens.colors.text, fontFamily: comfortTokens.typography.headingFont, fontWeight: 700, fontSize: idx === 0 ? "1.7rem" : "1.2rem", lineHeight: 1.02 }}>{item.title}</Typography>
                  {item.description ? <Typography sx={{ color: comfortTokens.colors.textSoft, lineHeight: 1.75 }}>{item.description}</Typography> : null}
                  <FamilyLinkButton href={item.link} label={item.linkText || "View service"} variant="text" endIcon={<ArrowOutwardIcon />} sx={{ alignSelf: "flex-start", px: 0, color: comfortTokens.colors.navy, fontWeight: 700 }} />
                </Stack>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

export function ComfortBenefits({ websiteSectionAdapter: adapter = {} }) {
  return <ComfortServices websiteSectionAdapter={adapter} />;
}

export function ComfortStats({ websiteSectionAdapter: adapter = {} }) {
  const plans = getPricingPlans(adapter?.props || {});
  const [ref, revealStyle] = useComfortReveal({ delay: 14 });
  if (!plans.length) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle, bgcolor: "#fff" }}>
      <Container maxWidth={false} sx={{ maxWidth: `${comfortTokens.layout.shellMax}px`, px: { xs: 2, md: 4 }, py: 4 }}>
        <Grid container spacing={2}>
          {plans.slice(0, 4).map((plan) => (
            <Grid item xs={12} sm={6} md={3} key={plan.id}>
              <ComfortStatCard plan={plan} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

function ComfortStatCard({ plan }) {
  const value = useCountUp(plan.price, true, 1000);
  return (
    <Box sx={{ p: 2.2, borderRadius: "22px 22px 50px 22px", bgcolor: comfortTokens.colors.surfaceSoft, border: `1px solid ${comfortTokens.colors.line}` }}>
      <Typography sx={{ color: comfortTokens.colors.text, fontFamily: comfortTokens.typography.headingFont, fontWeight: 700, fontSize: "2.2rem", lineHeight: 0.95 }}>{value}</Typography>
      <Typography sx={{ mt: 0.8, color: comfortTokens.colors.textSoft }}>{plan.name}</Typography>
    </Box>
  );
}

export function ComfortPlans({ websiteSectionAdapter: adapter = {} }) {
  return <ComfortStats websiteSectionAdapter={adapter} />;
}

export function ComfortServiceArea({ websiteSectionAdapter: adapter = {} }) {
  const title = adapter?.props?.title || "Service area";
  const body = adapter?.props?.body || "";
  const [ref, revealStyle] = useComfortReveal({ delay: 12 });
  if (!title && !body) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle, bgcolor: comfortTokens.colors.cream }}>
      <Container maxWidth={false} sx={{ maxWidth: `${comfortTokens.layout.contentMax}px`, px: { xs: 2, md: 4 }, py: 3.5 }}>
        <Typography sx={{ color: comfortTokens.colors.text, fontFamily: comfortTokens.typography.headingFont, fontWeight: 700, fontSize: "2rem" }}>{title}</Typography>
        {body ? <Typography sx={{ mt: 1, color: comfortTokens.colors.textSoft, lineHeight: 1.75 }}>{body}</Typography> : null}
      </Container>
    </Box>
  );
}
