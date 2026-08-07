import React, { useState } from "react";
import { alpha, Box, Container, Grid, Stack, Typography } from "@mui/material";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { IconButton } from "@mui/material";
import dispatchTokens from "../tokens";
import { useDispatchReveal } from "../motion";
import { FamilyLinkButton, useCountUp, useRailSlider } from "../../hvac-shared/runtime";
import { getFeatureShowcaseSliderData, getPricingPlans, getServiceCards, getShowcaseItems } from "../../hvac-shared/canonicalHvacAdapter";
import {
  sanitizeDispatchCta,
  sanitizeDispatchFeatures,
  sanitizeDispatchServices,
  sanitizeDispatchText,
} from "./contentSanitizer";

export function DispatchProblemSelector({ websiteSectionAdapter: adapter = {} }) {
  const cards = sanitizeDispatchServices(getServiceCards(adapter));
  const [selected, setSelected] = useState(0);
  const [ref, revealStyle] = useDispatchReveal({ delay: 18 });
  const active = cards[selected] || cards[0];
  if (!active) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle, bgcolor: dispatchTokens.colors.bg }}>
      <Container maxWidth={false} sx={{ maxWidth: `${dispatchTokens.layout.shellMax}px`, px: { xs: 2, md: 4 }, py: { xs: 3, md: 4 } }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Typography sx={{ color: dispatchTokens.colors.gold, fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900, textTransform: "uppercase", mb: 1.2 }}>Common HVAC problems</Typography>
            <Stack spacing={1}>
              {cards.slice(0, 6).map((item, idx) => (
                <Box key={item.id} onClick={() => setSelected(idx)} sx={{ p: 1.5, cursor: "pointer", bgcolor: idx === selected ? dispatchTokens.colors.orange : alpha(dispatchTokens.colors.surface, 0.94), color: idx === selected ? "#1a130e" : dispatchTokens.colors.text, borderLeft: `6px solid ${idx === selected ? dispatchTokens.colors.red : "transparent"}` }}>
                  <Typography sx={{ fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900, textTransform: "uppercase" }}>{item.title}</Typography>
                  {item.meta ? <Typography sx={{ mt: 0.4, fontSize: "0.92rem" }}>{item.meta}</Typography> : null}
                </Box>
              ))}
            </Stack>
          </Grid>
          <Grid item xs={12} md={8}>
            <Box sx={{ minHeight: 360, p: { xs: 2.4, md: 3.2 }, background: active.image ? `linear-gradient(180deg, rgba(24,21,18,0.2), rgba(24,21,18,0.86)), url(${active.image}) center / cover no-repeat` : dispatchTokens.colors.bgAlt, border: `1px solid ${dispatchTokens.colors.lineStrong}` }}>
              {active.badge ? <Typography sx={{ color: dispatchTokens.colors.gold, fontWeight: 800 }}>{active.badge}</Typography> : null}
              <Typography sx={{ mt: 1.2, fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900, textTransform: "uppercase", fontSize: "clamp(2rem, 4vw, 3.3rem)", lineHeight: 0.92 }}>{active.title}</Typography>
              {active.description ? <Typography sx={{ mt: 1.2, maxWidth: 520, color: dispatchTokens.colors.textSoft, lineHeight: 1.74 }}>{active.description}</Typography> : null}
              <FamilyLinkButton href={active.link} label={sanitizeDispatchCta(active.ctaText, "Request service")} endIcon={<ArrowOutwardIcon />} sx={{ mt: 2, minHeight: 50, px: 2.8, borderRadius: 0, bgcolor: dispatchTokens.colors.orange, color: "#1a130e", fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900 }} />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export function DispatchFeatureSlider({ websiteSectionAdapter: adapter = {} }) {
  const rawData = getFeatureShowcaseSliderData(adapter?.props || {});
  const data = {
    ...rawData,
    eyebrow: sanitizeDispatchText(rawData.eyebrow, "Service pathways"),
    title: sanitizeDispatchText(rawData.title, "Compare the service paths clients ask for most"),
    subtitle: sanitizeDispatchText(
      rawData.subtitle,
      "Use this slider for problem types, seasonal priorities, or the services that deserve a clearer next step before someone books."
    ),
    items: sanitizeDispatchFeatures(rawData.items),
  };
  const [ref, revealStyle] = useDispatchReveal({ delay: 20 });
  const { active, setActive, next, prev, interactionProps } = useRailSlider({ itemCount: data.items.length, autoplay: data.autoplay, intervalMs: data.intervalMs });
  if (!data.items.length) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle, bgcolor: dispatchTokens.colors.cream, color: dispatchTokens.colors.ink }}>
      <Container maxWidth={false} sx={{ maxWidth: `${dispatchTokens.layout.shellMax}px`, px: { xs: 2, md: 4 }, py: { xs: 3, md: 4 } }}>
        <Stack spacing={2}>
          {data.eyebrow ? <Typography sx={{ color: dispatchTokens.colors.red, fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900, textTransform: "uppercase" }}>{data.eyebrow}</Typography> : null}
          {data.title ? <Typography sx={{ fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900, textTransform: "uppercase", fontSize: "clamp(2rem, 4vw, 3.1rem)", lineHeight: 0.94 }}>{data.title}</Typography> : null}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            {data.subtitle ? <Typography sx={{ maxWidth: 760, color: alpha(dispatchTokens.colors.ink, 0.76), lineHeight: 1.7 }}>{data.subtitle}</Typography> : <Box />}
            {data.showArrows ? <Stack direction="row" spacing={0.8}><IconButton onClick={prev} aria-label="Previous slide"><ChevronLeftIcon /></IconButton><IconButton onClick={next} aria-label="Next slide"><ChevronRightIcon /></IconButton></Stack> : null}
          </Stack>
          <Box tabIndex={0} role="region" aria-label={data.title || "Feature showcase"} {...interactionProps} sx={{ display: "grid", gridAutoFlow: "column", gridAutoColumns: { xs: "92%", md: "34%" }, gap: 2, overflowX: "auto", pb: 1, scrollSnapType: "x mandatory" }}>
            {data.items.map((item, idx) => (
              <Box key={item.id} onFocus={() => setActive(idx)} onMouseEnter={() => setActive(idx)} sx={{ scrollSnapAlign: "start", minHeight: 340, p: 2.4, bgcolor: idx === active ? "#fff" : alpha("#fff", 0.68), borderTop: `6px solid ${idx === active ? dispatchTokens.colors.red : dispatchTokens.colors.orange}`, boxShadow: idx === active ? "0 20px 40px rgba(24,21,18,0.14)" : "none", display: "flex", flexDirection: "column" }}>
                {item.image ? <Box sx={{ minHeight: 160, mb: 1.2, background: `url(${item.image}) center / cover no-repeat` }} /> : null}
                {item.badge ? <Typography sx={{ color: dispatchTokens.colors.red, fontWeight: 800 }}>{item.badge}</Typography> : null}
                <Typography sx={{ mt: 0.8, fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900, textTransform: "uppercase", fontSize: "1.5rem", lineHeight: 0.98 }}>{item.title}</Typography>
                {item.description ? <Typography sx={{ mt: 1, color: alpha(dispatchTokens.colors.ink, 0.76), lineHeight: 1.72 }}>{item.description}</Typography> : null}
                <FamilyLinkButton href={item.ctaLink} label={sanitizeDispatchCta(item.ctaText, "View service")} endIcon={<ArrowOutwardIcon />} sx={{ mt: "auto", alignSelf: "flex-start", borderRadius: 0, bgcolor: dispatchTokens.colors.orange, color: "#1a130e", fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900 }} />
              </Box>
            ))}
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}

export function DispatchServices({ websiteSectionAdapter: adapter = {} }) {
  const items = sanitizeDispatchServices(getShowcaseItems(adapter?.props || {}));
  const title = sanitizeDispatchText(adapter?.props?.title, "Signature HVAC services");
  const subtitle = sanitizeDispatchText(
    adapter?.props?.subtitle,
    "Start with the system, comfort issue, or service path that matches what you need most."
  );
  const [ref, revealStyle] = useDispatchReveal({ delay: 18 });
  if (!items.length) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle, bgcolor: dispatchTokens.colors.bg }}>
      <Container maxWidth={false} sx={{ maxWidth: `${dispatchTokens.layout.shellMax}px`, px: { xs: 2, md: 4 }, py: { xs: 3, md: 4 } }}>
        <Typography sx={{ color: dispatchTokens.colors.orange, fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900, textTransform: "uppercase" }}>{title}</Typography>
        {subtitle ? <Typography sx={{ mt: 1, maxWidth: 760, color: dispatchTokens.colors.textSoft, lineHeight: 1.72 }}>{subtitle}</Typography> : null}
        <Grid container spacing={2} sx={{ mt: 0.2 }}>
          {items.slice(0, 6).map((item, idx) => (
            <Grid item xs={12} md={idx === 0 ? 6 : 3} key={item.id}>
              <Box sx={{ height: "100%", minHeight: idx === 0 ? 320 : 280, p: 2.2, border: `1px solid ${dispatchTokens.colors.lineStrong}`, background: item.image ? `linear-gradient(180deg, rgba(24,21,18,0.2), rgba(24,21,18,0.84)), url(${item.image}) center / cover no-repeat` : dispatchTokens.colors.bgAlt, display: "flex", flexDirection: "column" }}>
                <Typography sx={{ color: alpha(dispatchTokens.colors.text, 0.54), fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900 }}>{String(idx + 1).padStart(2, "0")}</Typography>
                <Typography sx={{ mt: 1, fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900, textTransform: "uppercase", fontSize: idx === 0 ? "2rem" : "1.35rem", lineHeight: 0.96 }}>{item.title}</Typography>
                {item.description ? <Typography sx={{ mt: 1.1, color: dispatchTokens.colors.textSoft, lineHeight: 1.72 }}>{item.description}</Typography> : null}
                <FamilyLinkButton href={item.link} label={sanitizeDispatchCta(item.linkText, "View service")} endIcon={<ArrowOutwardIcon />} sx={{ mt: "auto", alignSelf: "flex-start", borderRadius: 0, bgcolor: dispatchTokens.colors.cream, color: dispatchTokens.colors.ink, fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900 }} />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

export function DispatchBenefits({ websiteSectionAdapter: adapter = {} }) {
  return <DispatchServices websiteSectionAdapter={adapter} />;
}

export function DispatchStats({ websiteSectionAdapter: adapter = {} }) {
  const plans = getPricingPlans(adapter?.props || {});
  const [ref, revealStyle] = useDispatchReveal({ delay: 16 });
  if (!plans.length) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle, bgcolor: dispatchTokens.colors.cream }}>
      <Container maxWidth={false} sx={{ maxWidth: `${dispatchTokens.layout.shellMax}px`, px: { xs: 2, md: 4 }, py: 3 }}>
        <Grid container spacing={2}>
          {plans.slice(0, 4).map((plan) => (
            <Grid item xs={12} sm={6} md={3} key={plan.id}>
              <DispatchStatCard plan={plan} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

function DispatchStatCard({ plan }) {
  const value = useCountUp(plan.price, true, 1000);
  return (
    <Box sx={{ p: 2.2, bgcolor: "#fff", borderTop: `6px solid ${dispatchTokens.colors.orange}` }}>
      <Typography sx={{ fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900, fontSize: "2.4rem", lineHeight: 0.94, color: dispatchTokens.colors.ink }}>
        {value}
      </Typography>
      <Typography sx={{ mt: 0.8, color: alpha(dispatchTokens.colors.ink, 0.72) }}>{plan.name}</Typography>
    </Box>
  );
}

export function DispatchPlans({ websiteSectionAdapter: adapter = {} }) {
  return <DispatchStats websiteSectionAdapter={adapter} />;
}

export function DispatchServiceArea({ websiteSectionAdapter: adapter = {} }) {
  const title = sanitizeDispatchText(adapter?.props?.title, "Service area");
  const body = sanitizeDispatchText(adapter?.props?.body, "Use this section for the neighborhoods, cities, or property coverage areas the team actively serves.");
  const details = [adapter?.props?.detailOneText, adapter?.props?.detailTwoText, adapter?.props?.detailThreeText]
    .map((line) => sanitizeDispatchText(line, ""))
    .filter(Boolean);
  const [ref, revealStyle] = useDispatchReveal({ delay: 12 });
  if (!title && !body && !details.length) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle, bgcolor: dispatchTokens.colors.cream }}>
      <Container maxWidth={false} sx={{ maxWidth: `${dispatchTokens.layout.contentMax}px`, px: { xs: 2, md: 4 }, py: 3 }}>
        <Typography sx={{ fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900, textTransform: "uppercase", fontSize: "2rem", color: dispatchTokens.colors.ink }}>{title}</Typography>
        {body ? <Typography sx={{ mt: 1, color: alpha(dispatchTokens.colors.ink, 0.74), lineHeight: 1.72 }}>{body}</Typography> : null}
        <Stack spacing={1} sx={{ mt: 2 }}>
          {details.map((line, idx) => (
            <Box key={idx} sx={{ p: 1.2, bgcolor: "#fff", borderLeft: `5px solid ${dispatchTokens.colors.red}` }}>
              <Typography sx={{ color: dispatchTokens.colors.ink }}>{line}</Typography>
            </Box>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
