import React, { useEffect, useMemo, useState } from "react";
import {
  alpha,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Drawer,
  Grid,
  IconButton,
  Link as MuiLink,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import NorthEastIcon from "@mui/icons-material/NorthEast";
import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalk";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import TrendingFlatRoundedIcon from "@mui/icons-material/TrendingFlatRounded";
import { Link as RouterLink } from "react-router-dom";
import { SOCIAL_ICON_MAP, DEFAULT_SOCIAL_ICON } from "../../../../utils/socialIcons";
import { formatCopyrightText } from "../../../../utils/footerDefaults";

const TOKENS = Object.freeze({
  typography: {
    headingFont: '"Barlow Condensed", "Oswald", "Inter", sans-serif',
    bodyFont:
      '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    displayWeight: 800,
    sectionWeight: 700,
    labelWeight: 700,
    displayTracking: "-0.03em",
    labelTracking: "0.16em",
  },
  colors: {
    background: "#08111f",
    backgroundRaised: "#0f1d31",
    surface: "rgba(13, 26, 45, 0.92)",
    surfaceAlt: "rgba(8, 18, 34, 0.92)",
    line: "rgba(129, 169, 204, 0.26)",
    lineStrong: "rgba(129, 169, 204, 0.4)",
    text: "#edf4fb",
    textMuted: "rgba(237, 244, 251, 0.72)",
    textSoft: "rgba(171, 193, 215, 0.74)",
    steel: "#225b8f",
    accent: "#ff8a1f",
    accentText: "#07111f",
    accentSoft: "rgba(255, 138, 31, 0.18)",
    glow: "rgba(61, 134, 199, 0.18)",
  },
  layout: {
    shellMax: 1440,
    contentMax: 1280,
    heroMinHeight: 720,
    radius: 18,
    panelRadius: 16,
    sectionSpacing: { xs: 8, md: 12 },
  },
  buttons: {
    primaryRadius: 999,
    secondaryRadius: 999,
  },
  decorations: {
    blueprintGrid:
      "linear-gradient(rgba(120,164,201,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(120,164,201,0.14) 1px, transparent 1px)",
    blueprintGridSize: "26px 26px",
    diagonalClip: "polygon(0 0, 100% 0, 100% 84%, 92% 100%, 0 100%)",
    diagonalClipAlt: "polygon(0 0, 100% 0, 100% 100%, 8% 100%, 0 84%)",
  },
  motion: {
    duration: 220,
    easing: "cubic-bezier(0.2, 0.7, 0.2, 1)",
    hoverLift: "translateY(-4px)",
  },
});

const TECH_LABELS = ["Dispatch Ready", "Licensed & Insured", "Priority Response"];

const isExternalHref = (href = "") => /^https?:\/\//i.test(String(href || "").trim());

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(Boolean(mq.matches));
    onChange();
    mq.addEventListener?.("change", onChange);
    mq.addListener?.(onChange);
    return () => {
      mq.removeEventListener?.("change", onChange);
      mq.removeListener?.(onChange);
    };
  }, []);
  return reduced;
}

function useInViewOnce(options = {}) {
  const [node, setNode] = useState(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (!node || seen || typeof IntersectionObserver !== "function") return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setSeen(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.22, rootMargin: "0px 0px -8% 0px", ...options }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, options, seen]);
  return [setNode, seen];
}

function useMotionStyle({ delay = 0 } = {}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [ref, seen] = useInViewOnce();
  if (prefersReducedMotion) {
    return [{ opacity: 1, transform: "none" }, ref];
  }
  return [
    {
      opacity: seen ? 1 : 0.01,
      transform: seen ? "translate3d(0,0,0)" : "translate3d(0,18px,0)",
      transition: `opacity ${TOKENS.motion.duration + delay}ms ${TOKENS.motion.easing}, transform ${
        TOKENS.motion.duration + delay
      }ms ${TOKENS.motion.easing}`,
    },
    ref,
  ];
}

function toPlain(value) {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function getHeroStats(adapter, props) {
  const raw = props.trustStats || props.stats || [];
  if (Array.isArray(raw) && raw.length) {
    return raw
      .map((item) => ({
        value: item?.value || item?.number || "",
        label: item?.label || item?.text || "",
      }))
      .filter((item) => item.value || item.label)
      .slice(0, 4);
  }
  return [
    { value: "24/7", label: "Emergency response" },
    { value: "4.9", label: "Average review score" },
    { value: "Same day", label: "Dispatch available" },
  ].filter((item) => item.value || item.label);
}

function getServiceItems(adapter) {
  return (Array.isArray(adapter?.items) ? adapter.items : [])
    .map((item, idx) => ({
      index: idx + 1,
      title: item?.title || item?.name || `Service ${idx + 1}`,
      description: item?.description || item?.body || "",
      badge: item?.badge || item?.price || "",
      link: item?.link || item?.href || "",
      meta: item?.meta || item?.subtitle || "",
    }))
    .slice(0, 6);
}

function getSocialItems(adapter) {
  return (Array.isArray(adapter?.items) ? adapter.items : [])
    .map((item, idx) => ({
      quote: item?.quote || item?.text || item?.body || "",
      author: item?.author || item?.name || `Client ${idx + 1}`,
      meta: item?.role || item?.subtitle || item?.location || "",
      rating: Number(item?.rating || item?.stars || 5),
    }))
    .filter((item) => item.quote || item.author)
    .slice(0, 4);
}

function getArray(input) {
  return Array.isArray(input) ? input : [];
}

function getRichItems(input = [], max = 8) {
  return getArray(input)
    .map((item, idx) => ({
      id: item?.id || `item-${idx}`,
      title: item?.title || item?.name || `Item ${idx + 1}`,
      description: item?.description || item?.body || item?.text || "",
      label: item?.label || item?.eyebrow || item?.badge || "",
      value: item?.value || item?.stat || "",
      image: item?.image || item?.imageUrl || item?.url || "",
      link: item?.link || item?.href || "",
      bullets: getArray(item?.bullets || item?.points || item?.features),
      meta: item?.meta || item?.subtitle || "",
    }))
    .slice(0, max);
}

function parseMetric(raw) {
  const text = String(raw || "").trim();
  const match = text.match(/^([^0-9-]*)(-?\d+(?:\.\d+)?)(.*)$/);
  if (!match) return null;
  const [, prefix = "", valueText = "", suffix = ""] = match;
  const value = Number(valueText);
  if (!Number.isFinite(value)) return null;
  const decimals = (valueText.split(".")[1] || "").length;
  return { prefix, value, suffix, decimals };
}

function useCountUp(text, active = true, duration = 1200) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const parsed = useMemo(() => parseMetric(text), [text]);
  const [display, setDisplay] = useState(String(text || ""));

  useEffect(() => {
    const finalText = String(text || "");
    if (!active || prefersReducedMotion || !parsed || typeof window === "undefined") {
      setDisplay(finalText);
      return undefined;
    }
    let frame = 0;
    let start = 0;
    const tick = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const current = parsed.value * progress;
      const rendered =
        parsed.decimals > 0 ? current.toFixed(parsed.decimals) : String(Math.round(current));
      setDisplay(`${parsed.prefix}${rendered}${parsed.suffix}`);
      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      } else {
        setDisplay(finalText);
      }
    };
    frame = window.requestAnimationFrame(tick);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [active, duration, parsed, prefersReducedMotion, text]);

  return display;
}

function BlueprintBackdrop({ inset = false }) {
  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        inset: inset ? 12 : 0,
        backgroundImage: TOKENS.decorations.blueprintGrid,
        backgroundSize: TOKENS.decorations.blueprintGridSize,
        opacity: inset ? 0.16 : 0.11,
        pointerEvents: "none",
        maskImage:
          "linear-gradient(180deg, rgba(0,0,0,0.85), rgba(0,0,0,0.05) 84%, transparent 100%)",
      }}
    />
  );
}

function TechLabel({ children }) {
  return (
    <Typography
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        fontFamily: TOKENS.typography.headingFont,
        fontWeight: TOKENS.typography.labelWeight,
        letterSpacing: TOKENS.typography.labelTracking,
        textTransform: "uppercase",
        fontSize: "0.72rem",
        color: "var(--page-body-color, rgba(237,244,251,0.72))",
      }}
    >
      <Box
        component="span"
        sx={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          bgcolor: TOKENS.colors.accent,
          boxShadow: `0 0 0 6px ${alpha(TOKENS.colors.accent, 0.12)}`,
        }}
      />
      {children}
    </Typography>
  );
}

function ActionButton({ href, label, variant = "contained", sx = {}, onClick, ...rest }) {
  if (!label) return null;
  const linkProps = isExternalHref(href)
    ? {
        component: "a",
        href,
        target: "_blank",
        rel: "noreferrer noopener",
      }
    : href
    ? { component: RouterLink, to: href }
    : {};
  return (
    <Button
      {...linkProps}
      {...rest}
      onClick={onClick}
      variant={variant}
      endIcon={variant === "contained" ? <NorthEastIcon /> : undefined}
      sx={{
        borderRadius: variant === "contained" ? TOKENS.buttons.primaryRadius : TOKENS.buttons.secondaryRadius,
        px: 3,
        py: 1.45,
        minHeight: 52,
        fontFamily: TOKENS.typography.headingFont,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        ...(variant === "contained"
          ? {
              background: "var(--industrial-cta-bg, linear-gradient(135deg, #ff8a1f 0%, #ffb14d 100%))",
              color: "var(--industrial-cta-text, #07111f)",
              boxShadow: "0 16px 42px rgba(255,138,31,0.24)",
              "&:hover": {
                background: "var(--industrial-cta-bg, linear-gradient(135deg, #ff8a1f 0%, #ffb14d 100%))",
                filter: "brightness(1.02)",
                transform: TOKENS.motion.hoverLift,
              },
            }
          : {
              color: "var(--page-heading-color, #edf4fb)",
              borderColor: "rgba(171, 193, 215, 0.38)",
              backgroundColor: "rgba(255,255,255,0.03)",
              "&:hover": {
                borderColor: "rgba(255, 138, 31, 0.58)",
                backgroundColor: "rgba(255, 138, 31, 0.08)",
              },
            }),
        transition: `transform ${TOKENS.motion.duration}ms ${TOKENS.motion.easing}, filter ${TOKENS.motion.duration}ms ${TOKENS.motion.easing}, border-color ${TOKENS.motion.duration}ms ${TOKENS.motion.easing}, background-color ${TOKENS.motion.duration}ms ${TOKENS.motion.easing}`,
        ...sx,
      }}
    >
      {label}
    </Button>
  );
}

export function IndustrialHero({
  websiteSectionAdapter: adapter = {},
}) {
  const props = adapter?.props || {};
  const [motionSx, motionRef] = useMotionStyle();
  const heading = adapter.heading || "Field-ready service when the system matters most.";
  const subheading =
    adapter.subheading ||
    "Operationally clear service websites for high-trust home service teams.";
  const stats = getHeroStats(adapter, props);
  const trustBadges = Array.isArray(props.serviceBadges) && props.serviceBadges.length
    ? props.serviceBadges.slice(0, 4)
    : TECH_LABELS;
  const imageUrl = adapter?.media?.image || props.image || props.backgroundUrl || "";
  const emergencyLine = props.emergencyLabel || props.eyebrow || "Emergency service dispatch";
  const diagnostics = Array.isArray(props.panelSpecs) ? props.panelSpecs : [
    { label: "Coverage", value: props.serviceArea || "Residential + commercial" },
    { label: "Response", value: props.responseWindow || "Same-day scheduling" },
    { label: "Support", value: props.supportWindow || "Priority maintenance plans" },
  ];

  return (
    <Box
      ref={motionRef}
      sx={{
        ...motionSx,
        position: "relative",
        overflow: "hidden",
        borderRadius: { xs: 3, md: 4 },
        background:
          "linear-gradient(180deg, rgba(7,17,31,0.98) 0%, rgba(11,24,43,0.98) 100%)",
        color: "var(--page-heading-color, #edf4fb)",
        border: `1px solid ${TOKENS.colors.line}`,
        boxShadow: "0 42px 120px rgba(2, 8, 23, 0.42)",
      }}
    >
      <BlueprintBackdrop />
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 18% 22%, rgba(34,91,143,0.28), transparent 34%), radial-gradient(circle at 88% 18%, rgba(255,138,31,0.14), transparent 30%)",
          pointerEvents: "none",
        }}
      />
      <Container maxWidth={false} sx={{ maxWidth: `${TOKENS.layout.shellMax}px`, px: { xs: 2.5, md: 4 } }}>
        <Grid
          container
          spacing={{ xs: 4, md: 5 }}
          sx={{
            minHeight: { xs: "auto", md: TOKENS.layout.heroMinHeight },
            alignItems: "stretch",
            py: { xs: 6, md: 8 },
          }}
        >
          <Grid item xs={12} lg={7}>
            <Stack spacing={3.2} sx={{ position: "relative", zIndex: 2, maxWidth: 720 }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignItems={{ xs: "flex-start", sm: "center" }}>
                <TechLabel>{emergencyLine}</TechLabel>
                <Chip
                  icon={<PhoneInTalkIcon sx={{ color: `${TOKENS.colors.accentText} !important` }} />}
                  label={props.utilityChip || "Priority response"}
                  sx={{
                    borderRadius: 999,
                    bgcolor: TOKENS.colors.accentSoft,
                    color: TOKENS.colors.text,
                    border: `1px solid ${alpha(TOKENS.colors.accent, 0.36)}`,
                    "& .MuiChip-label": {
                      fontFamily: TOKENS.typography.headingFont,
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    },
                  }}
                />
              </Stack>
              <Typography
                variant="h1"
                sx={{
                  fontFamily: TOKENS.typography.headingFont,
                  fontWeight: TOKENS.typography.displayWeight,
                  letterSpacing: TOKENS.typography.displayTracking,
                  lineHeight: 0.96,
                  fontSize: "clamp(3rem, 7vw, 6rem)",
                  textTransform: "uppercase",
                  textWrap: "balance",
                  color: "var(--page-heading-color, #edf4fb)",
                  maxWidth: 680,
                }}
              >
                {heading}
              </Typography>
              <Typography
                sx={{
                  maxWidth: 620,
                  fontSize: { xs: "1.02rem", md: "1.12rem" },
                  lineHeight: 1.8,
                  color: "var(--page-body-color, rgba(237,244,251,0.76))",
                }}
              >
                {subheading}
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <ActionButton href={adapter?.primaryCta?.href} label={adapter?.primaryCta?.label || "Book service"} />
                <ActionButton
                  href={adapter?.secondaryCta?.href}
                  label={adapter?.secondaryCta?.label || props.quoteCtaLabel || "Request estimate"}
                  variant="outlined"
                />
              </Stack>
              <Stack direction="row" spacing={1.2} flexWrap="wrap" useFlexGap>
                {trustBadges.map((item, idx) => (
                  <Box
                    key={`${item}-${idx}`}
                    sx={{
                      px: 1.6,
                      py: 1.15,
                      borderRadius: 999,
                      border: `1px solid ${TOKENS.colors.line}`,
                      backgroundColor: "rgba(255,255,255,0.04)",
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: TOKENS.typography.headingFont,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        color: "var(--page-body-color, rgba(237,244,251,0.76))",
                      }}
                    >
                      {toPlain(item)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
              <Grid container spacing={1.4}>
                {stats.map((item, idx) => (
                  <Grid item xs={12} sm={4} key={`${item.label}-${idx}`}>
                    <Box
                      sx={{
                        p: 2.25,
                        minHeight: 116,
                        borderRadius: 3,
                        border: `1px solid ${TOKENS.colors.line}`,
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(7,17,31,0.3) 100%)",
                        clipPath: TOKENS.decorations.diagonalClipAlt,
                      }}
                    >
                      <Typography
                        sx={{
                          fontFamily: TOKENS.typography.headingFont,
                          fontWeight: 800,
                          fontSize: "clamp(1.8rem, 3vw, 2.5rem)",
                          lineHeight: 1,
                          letterSpacing: "-0.03em",
                        }}
                      >
                        {item.value}
                      </Typography>
                      <Typography sx={{ mt: 1, color: TOKENS.colors.textSoft, lineHeight: 1.55 }}>
                        {item.label}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </Grid>
          <Grid item xs={12} lg={5}>
            <Box
              sx={{
                position: "relative",
                minHeight: { xs: 360, md: 560 },
                height: "100%",
                borderRadius: 4,
                overflow: "hidden",
                clipPath: TOKENS.decorations.diagonalClip,
                border: `1px solid ${TOKENS.colors.lineStrong}`,
                background:
                  imageUrl
                    ? `linear-gradient(180deg, rgba(7,17,31,0.08), rgba(7,17,31,0.6)), url(${imageUrl}) center / cover no-repeat`
                    : "linear-gradient(180deg, rgba(24,63,97,0.84) 0%, rgba(7,17,31,0.94) 100%)",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
              }}
            >
              <BlueprintBackdrop inset />
              <Box
                sx={{
                  position: "absolute",
                  top: { xs: 18, md: 24 },
                  left: { xs: 18, md: 24 },
                  right: { xs: 18, md: 24 },
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    px: 1.25,
                    py: 0.9,
                    bgcolor: "rgba(7,17,31,0.76)",
                    border: `1px solid ${TOKENS.colors.line}`,
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: TOKENS.typography.headingFont,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      fontSize: "0.7rem",
                      color: TOKENS.colors.textMuted,
                    }}
                  >
                    Service map / blueprint chamber
                  </Typography>
                </Box>
                <Stack spacing={0.75}>
                  {diagnostics.map((item, idx) => (
                    <Box
                      key={`${item.label}-${idx}`}
                      sx={{
                        px: 1.2,
                        py: 0.9,
                        bgcolor: "rgba(7,17,31,0.78)",
                        border: `1px solid ${TOKENS.colors.line}`,
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      <Typography sx={{ fontSize: "0.68rem", color: TOKENS.colors.textSoft, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                        {item.label}
                      </Typography>
                      <Typography sx={{ mt: 0.35, fontWeight: 700, color: TOKENS.colors.text }}>
                        {item.value}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
              <Box
                aria-hidden
                sx={{
                  position: "absolute",
                  left: 0,
                  bottom: 52,
                  width: "58%",
                  borderTop: `1px solid ${alpha("#fff", 0.18)}`,
                  transform: "skewX(-28deg)",
                  transformOrigin: "left center",
                }}
              />
              <Box
                aria-hidden
                sx={{
                  position: "absolute",
                  right: 32,
                  bottom: 32,
                  width: 160,
                  height: 160,
                  border: `1px solid ${alpha(TOKENS.colors.accent, 0.4)}`,
                  borderRadius: "50%",
                  boxShadow: `0 0 0 18px ${alpha(TOKENS.colors.accent, 0.06)}`,
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export function IndustrialServices({
  websiteSectionAdapter: adapter = {},
}) {
  const props = adapter?.props || {};
  const [motionSx, motionRef] = useMotionStyle({ delay: 30 });
  const items = getServiceItems(adapter);
  const asidePoints =
    Array.isArray(props.asidePoints) && props.asidePoints.length
      ? props.asidePoints
      : ["Residential + light commercial", "Maintenance plans supported", "Online booking and quote routing"];

  return (
    <Box
      ref={motionRef}
      sx={{
        ...motionSx,
        position: "relative",
        px: { xs: 0, md: 0.5 },
      }}
    >
      <Container maxWidth={false} sx={{ maxWidth: `${TOKENS.layout.contentMax}px`, px: { xs: 0.5, md: 1.5 } }}>
        <Grid container spacing={{ xs: 3, md: 4 }}>
          <Grid item xs={12} lg={4}>
            <Box
              sx={{
                position: "sticky",
                top: { md: 108 },
                p: { xs: 3, md: 4 },
                borderRadius: 4,
                bgcolor: "rgba(8,17,31,0.86)",
                border: `1px solid ${TOKENS.colors.line}`,
                overflow: "hidden",
              }}
            >
              <BlueprintBackdrop inset />
              <Stack spacing={2.25} sx={{ position: "relative", zIndex: 1 }}>
                <TechLabel>{props.eyebrow || "Service board"}</TechLabel>
                <Typography
                  sx={{
                    fontFamily: TOKENS.typography.headingFont,
                    fontWeight: TOKENS.typography.sectionWeight,
                    fontSize: "clamp(2rem, 4vw, 3.4rem)",
                    lineHeight: 0.95,
                    textTransform: "uppercase",
                    letterSpacing: "-0.03em",
                  }}
                >
                  {adapter.title || "Service lines built for dispatch clarity."}
                </Typography>
                <Typography sx={{ color: TOKENS.colors.textMuted, lineHeight: 1.8 }}>
                  {adapter.subtitle || "Highlight key service paths without forcing customers through a generic brochure grid."}
                </Typography>
                <Divider sx={{ borderColor: TOKENS.colors.line }} />
                <Stack spacing={1.1}>
                  {asidePoints.map((item, idx) => (
                    <Stack key={`${item}-${idx}`} direction="row" spacing={1.2} alignItems="flex-start">
                      <VerifiedUserOutlinedIcon sx={{ mt: "2px", fontSize: 18, color: TOKENS.colors.accent }} />
                      <Typography sx={{ color: TOKENS.colors.textSoft, lineHeight: 1.7 }}>{toPlain(item)}</Typography>
                    </Stack>
                  ))}
                </Stack>
                <ActionButton
                  href={adapter?.cta?.href || props.secondaryCtaLink}
                  label={adapter?.cta?.label || props.secondaryCtaText || "See all services"}
                  variant="outlined"
                  sx={{ justifyContent: "flex-start" }}
                />
              </Stack>
            </Box>
          </Grid>
          <Grid item xs={12} lg={8}>
            <Stack spacing={2.2}>
              {items.map((item, idx) => (
                <Box
                  key={`${item.title}-${idx}`}
                  sx={{
                    position: "relative",
                    overflow: "hidden",
                    p: { xs: 2.6, md: 3.2 },
                    borderRadius: 4,
                    clipPath: idx % 2 === 0 ? TOKENS.decorations.diagonalClip : TOKENS.decorations.diagonalClipAlt,
                    border: `1px solid ${TOKENS.colors.line}`,
                    background:
                      "linear-gradient(180deg, rgba(14,27,45,0.94) 0%, rgba(8,17,31,0.92) 100%)",
                    boxShadow: "0 18px 44px rgba(2, 8, 23, 0.26)",
                    transition: `transform ${TOKENS.motion.duration}ms ${TOKENS.motion.easing}, border-color ${TOKENS.motion.duration}ms ${TOKENS.motion.easing}, box-shadow ${TOKENS.motion.duration}ms ${TOKENS.motion.easing}`,
                    "&:hover": {
                      transform: TOKENS.motion.hoverLift,
                      borderColor: alpha(TOKENS.colors.accent, 0.48),
                      boxShadow: "0 24px 54px rgba(2, 8, 23, 0.34)",
                    },
                  }}
                >
                  <Box
                    aria-hidden
                    sx={{
                      position: "absolute",
                      inset: 0,
                      background:
                        idx % 2 === 0
                          ? "linear-gradient(110deg, rgba(255,138,31,0.08), transparent 38%)"
                          : "linear-gradient(250deg, rgba(34,91,143,0.12), transparent 42%)",
                    }}
                  />
                  <Grid container spacing={2.4} sx={{ position: "relative", zIndex: 1 }}>
                    <Grid item xs={12} md={2.5}>
                      <Stack spacing={1}>
                        <Typography
                          sx={{
                            fontFamily: TOKENS.typography.headingFont,
                            fontWeight: 800,
                            letterSpacing: "-0.03em",
                            fontSize: "clamp(2rem, 4vw, 3rem)",
                            color: alpha("#fff", 0.22),
                          }}
                        >
                          {String(item.index).padStart(2, "0")}
                        </Typography>
                        {item.badge ? (
                          <Chip
                            label={item.badge}
                            sx={{
                              alignSelf: "flex-start",
                              bgcolor: "rgba(255,255,255,0.05)",
                              border: `1px solid ${TOKENS.colors.line}`,
                              color: TOKENS.colors.textMuted,
                              "& .MuiChip-label": {
                                fontFamily: TOKENS.typography.headingFont,
                                fontWeight: 700,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                              },
                            }}
                          />
                        ) : null}
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={9.5}>
                      <Stack spacing={1.35}>
                        <Typography
                          sx={{
                            fontFamily: TOKENS.typography.headingFont,
                            fontWeight: 800,
                            textTransform: "uppercase",
                            letterSpacing: "-0.02em",
                            fontSize: "clamp(1.5rem, 3vw, 2.1rem)",
                            lineHeight: 1,
                          }}
                        >
                          {item.title}
                        </Typography>
                        <Typography sx={{ color: TOKENS.colors.textMuted, lineHeight: 1.8 }}>
                          {item.description}
                        </Typography>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.4} alignItems={{ xs: "flex-start", sm: "center" }}>
                          {item.meta ? (
                            <Stack direction="row" spacing={1} alignItems="center">
                              <BoltOutlinedIcon sx={{ fontSize: 18, color: TOKENS.colors.accent }} />
                              <Typography sx={{ color: TOKENS.colors.textSoft }}>{item.meta}</Typography>
                            </Stack>
                          ) : null}
                          {item.link ? (
                            <MuiLink
                              component={RouterLink}
                              to={item.link}
                              underline="none"
                              sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 0.75,
                                color: TOKENS.colors.text,
                                fontFamily: TOKENS.typography.headingFont,
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                                fontWeight: 700,
                              }}
                            >
                              Explore service
                              <TrendingFlatRoundedIcon fontSize="small" />
                            </MuiLink>
                          ) : null}
                        </Stack>
                      </Stack>
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export function IndustrialSocialProof({
  websiteSectionAdapter: adapter = {},
}) {
  const items = getSocialItems(adapter);
  const props = adapter?.props || {};
  const summary = Array.isArray(props.summaryStats) && props.summaryStats.length
    ? props.summaryStats
    : [
        { label: "Response trust", value: "4.9/5" },
        { label: "Repeat clients", value: "72%" },
        { label: "Booked online", value: "Same-day" },
      ];
  const [motionSx, motionRef] = useMotionStyle({ delay: 60 });

  return (
    <Box
      ref={motionRef}
      sx={{
        ...motionSx,
        position: "relative",
        overflow: "hidden",
        borderRadius: 4,
        border: `1px solid ${TOKENS.colors.line}`,
        background: "linear-gradient(180deg, rgba(8,17,31,0.98), rgba(13,26,45,0.96))",
      }}
    >
      <BlueprintBackdrop />
      <Container maxWidth={false} sx={{ maxWidth: `${TOKENS.layout.contentMax}px`, px: { xs: 2.5, md: 4 }, py: { xs: 5, md: 7 } }}>
        <Grid container spacing={{ xs: 3, md: 4 }}>
          <Grid item xs={12} lg={4}>
            <Stack spacing={2}>
              <TechLabel>{adapter.kind === "reviews" ? "Review confidence" : "Trusted by service clients"}</TechLabel>
              <Typography
                sx={{
                  fontFamily: TOKENS.typography.headingFont,
                  fontWeight: TOKENS.typography.sectionWeight,
                  fontSize: "clamp(2rem, 4vw, 3.25rem)",
                  lineHeight: 0.95,
                  letterSpacing: "-0.03em",
                  textTransform: "uppercase",
                }}
              >
                {adapter.title || "Proof that the first impression matches the field work."}
              </Typography>
              <Typography sx={{ color: TOKENS.colors.textMuted, lineHeight: 1.75 }}>
                {adapter.subtitle || "Use reviews and testimonials as operational trust signals, not generic soft quotes."}
              </Typography>
              <Stack spacing={1.25} sx={{ pt: 1 }}>
                {summary.map((item, idx) => (
                  <Box
                    key={`${item.label}-${idx}`}
                    sx={{
                      px: 2,
                      py: 1.5,
                      border: `1px solid ${TOKENS.colors.line}`,
                      backgroundColor: "rgba(255,255,255,0.04)",
                    }}
                  >
                    <Typography sx={{ color: TOKENS.colors.textSoft, textTransform: "uppercase", letterSpacing: "0.12em", fontSize: "0.7rem" }}>
                      {item.label}
                    </Typography>
                    <Typography sx={{ mt: 0.45, fontFamily: TOKENS.typography.headingFont, fontWeight: 800, fontSize: "1.3rem" }}>
                      {item.value}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Stack>
          </Grid>
          <Grid item xs={12} lg={8}>
            <Grid container spacing={2}>
              {items.map((item, idx) => (
                <Grid item xs={12} md={6} key={`${item.author}-${idx}`}>
                  <Box
                    sx={{
                      height: "100%",
                      p: 2.4,
                      borderRadius: 3,
                      border: `1px solid ${TOKENS.colors.line}`,
                      background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.5,
                    }}
                  >
                    <Stack direction="row" spacing={0.35}>
                      {Array.from({ length: Math.max(1, Math.min(5, item.rating || 5)) }).map((_, starIdx) => (
                        <StarRoundedIcon key={starIdx} sx={{ fontSize: 18, color: TOKENS.colors.accent }} />
                      ))}
                    </Stack>
                    <Typography sx={{ color: TOKENS.colors.text, lineHeight: 1.8 }}>
                      {item.quote}
                    </Typography>
                    <Box sx={{ mt: "auto", pt: 1 }}>
                      <Typography sx={{ fontFamily: TOKENS.typography.headingFont, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        {item.author}
                      </Typography>
                      {item.meta ? (
                        <Typography sx={{ mt: 0.4, color: TOKENS.colors.textSoft }}>
                          {item.meta}
                        </Typography>
                      ) : null}
                    </Box>
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

export function IndustrialCTA({
  websiteSectionAdapter: adapter = {},
}) {
  const props = adapter?.props || {};
  const [motionSx, motionRef] = useMotionStyle({ delay: 80 });
  const bullets =
    Array.isArray(props.supportBullets) && props.supportBullets.length
      ? props.supportBullets
      : ["Fast quote review", "Clear next-step guidance", "Booking and estimate paths"];

  return (
    <Box
      ref={motionRef}
      sx={{
        ...motionSx,
        position: "relative",
        overflow: "hidden",
        borderRadius: 4,
        background: "linear-gradient(135deg, rgba(255,138,31,0.94) 0%, rgba(255,177,77,0.96) 48%, rgba(255,138,31,0.92) 100%)",
        color: TOKENS.colors.accentText,
        boxShadow: "0 28px 68px rgba(255,138,31,0.26)",
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(120deg, rgba(7,17,31,0.08) 0%, transparent 35%, rgba(7,17,31,0.18) 100%)",
        }}
      />
      <Container maxWidth={false} sx={{ maxWidth: `${TOKENS.layout.contentMax}px`, px: { xs: 2.5, md: 4 }, py: { xs: 4.5, md: 5 } }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} lg={8}>
            <Stack spacing={1.4}>
              <Typography
                sx={{
                  fontFamily: TOKENS.typography.headingFont,
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  fontSize: "0.78rem",
                  color: alpha(TOKENS.colors.accentText, 0.72),
                }}
              >
                {props.eyebrow || "Emergency / estimate / service"}
              </Typography>
              <Typography
                sx={{
                  fontFamily: TOKENS.typography.headingFont,
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  textTransform: "uppercase",
                  lineHeight: 0.95,
                  fontSize: "clamp(2rem, 4vw, 3.4rem)",
                  maxWidth: 780,
                }}
              >
                {adapter.title || "Need dispatch clarity and a faster next step?"}
              </Typography>
              <Typography sx={{ maxWidth: 760, lineHeight: 1.75, color: alpha(TOKENS.colors.accentText, 0.84) }}>
                {adapter.body || "Guide clients toward booking, estimates, or urgent service without making the site feel generic or soft."}
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} lg={4}>
            <Box
              sx={{
                position: "relative",
                overflow: "hidden",
                p: 2.4,
                borderRadius: 3,
                clipPath: TOKENS.decorations.diagonalClip,
                border: `1px solid ${alpha(TOKENS.colors.accentText, 0.16)}`,
                background: "rgba(7,17,31,0.16)",
                backdropFilter: "blur(8px)",
              }}
            >
              <Stack spacing={1.35}>
                {bullets.map((item, idx) => (
                  <Stack key={`${item}-${idx}`} direction="row" spacing={1.1} alignItems="center">
                    <BuildOutlinedIcon sx={{ fontSize: 18, color: TOKENS.colors.accentText }} />
                    <Typography sx={{ color: alpha(TOKENS.colors.accentText, 0.86) }}>
                      {toPlain(item)}
                    </Typography>
                  </Stack>
                ))}
                <Stack direction={{ xs: "column", sm: "row", lg: "column" }} spacing={1.2} sx={{ pt: 1 }}>
                  <ActionButton
                    href={adapter?.button?.href}
                    label={adapter?.button?.label || props.ctaText || "Request estimate"}
                    sx={{
                      width: "100%",
                      background: "rgba(7,17,31,0.92)",
                      color: "#f8fbff",
                      "&:hover": {
                        background: "rgba(7,17,31,0.92)",
                        filter: "brightness(1.08)",
                        transform: TOKENS.motion.hoverLift,
                      },
                    }}
                  />
                  {props.secondaryCtaText ? (
                    <ActionButton
                      href={props.secondaryCtaLink}
                      label={props.secondaryCtaText}
                      variant="outlined"
                      sx={{
                        width: "100%",
                        borderColor: alpha(TOKENS.colors.accentText, 0.22),
                        color: alpha(TOKENS.colors.accentText, 0.88),
                        "&:hover": {
                          borderColor: alpha(TOKENS.colors.accentText, 0.42),
                          backgroundColor: "rgba(7,17,31,0.08)",
                        },
                      }}
                    />
                  ) : null}
                </Stack>
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

function IndustrialMetricCard({ value, label, eyebrow, active = true }) {
  const renderedValue = useCountUp(value, active);
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        p: 2.2,
        minHeight: 136,
        borderRadius: 3,
        border: `1px solid ${TOKENS.colors.line}`,
        background: "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(7,17,31,0.3))",
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          right: -18,
          top: -18,
          width: 110,
          height: 110,
          borderRadius: "50%",
          border: `1px solid ${alpha(TOKENS.colors.accent, 0.18)}`,
        }}
      />
      {eyebrow ? (
        <Typography sx={{ fontSize: "0.68rem", letterSpacing: "0.16em", textTransform: "uppercase", color: TOKENS.colors.textSoft }}>
          {eyebrow}
        </Typography>
      ) : null}
      <Typography
        sx={{
          mt: eyebrow ? 1.1 : 0,
          fontFamily: TOKENS.typography.headingFont,
          fontWeight: 900,
          letterSpacing: "-0.03em",
          lineHeight: 0.9,
          fontSize: "clamp(2.2rem, 5vw, 4rem)",
          color: TOKENS.colors.text,
        }}
      >
        {renderedValue}
      </Typography>
      {label ? (
        <Typography sx={{ mt: 1.1, maxWidth: 220, color: TOKENS.colors.textSoft, lineHeight: 1.65 }}>
          {label}
        </Typography>
      ) : null}
    </Box>
  );
}

export function IndustrialTrustMarquee({ websiteSectionAdapter: adapter = {} }) {
  const props = adapter?.props || {};
  const prefersReducedMotion = usePrefersReducedMotion();
  const [motionSx, motionRef] = useMotionStyle({ delay: 20 });
  const items = getArray(props.items).length
    ? getArray(props.items)
    : [
        "TSSA-aware workflow",
        "WSIB / insured crews",
        "HomeStars-style social proof",
        "Priority maintenance members",
        "Residential + commercial",
        "Emergency-ready dispatch",
      ];
  const loops = [...items, ...items];
  return (
    <Box ref={motionRef} sx={{ ...motionSx, position: "relative", overflow: "hidden" }}>
      <Container maxWidth={false} sx={{ maxWidth: `${TOKENS.layout.shellMax}px`, px: { xs: 1.5, md: 4 } }}>
        <Box
          sx={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 3,
            border: `1px solid ${TOKENS.colors.line}`,
            background: "linear-gradient(180deg, rgba(9,19,35,0.95), rgba(12,26,43,0.95))",
            py: 1.4,
            px: 1,
            "&::before, &::after": {
              content: '""',
              position: "absolute",
              top: 0,
              bottom: 0,
              width: 72,
              zIndex: 2,
              pointerEvents: "none",
            },
            "&::before": {
              left: 0,
              background: "linear-gradient(90deg, rgba(8,17,31,1), rgba(8,17,31,0))",
            },
            "&::after": {
              right: 0,
              background: "linear-gradient(270deg, rgba(8,17,31,1), rgba(8,17,31,0))",
            },
          }}
        >
          <Stack
            direction="row"
            spacing={1.4}
            sx={{
              width: "max-content",
              minWidth: "100%",
              animation: prefersReducedMotion ? "none" : "industrialMarquee 24s linear infinite",
              "@keyframes industrialMarquee": {
                "0%": { transform: "translateX(0)" },
                "100%": { transform: "translateX(-50%)" },
              },
            }}
          >
            {loops.map((item, idx) => (
              <Chip
                key={`${toPlain(item)}-${idx}`}
                icon={<VerifiedUserOutlinedIcon sx={{ color: `${TOKENS.colors.accent} !important` }} />}
                label={typeof item === "string" ? item : item?.label || item?.title || "Certified"}
                sx={{
                  bgcolor: "rgba(255,255,255,0.04)",
                  border: `1px solid ${TOKENS.colors.line}`,
                  color: TOKENS.colors.text,
                  "& .MuiChip-label": {
                    fontFamily: TOKENS.typography.headingFont,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  },
                }}
              />
            ))}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}

export function IndustrialStatsRail({ websiteSectionAdapter: adapter = {} }) {
  const props = adapter?.props || {};
  const [motionSx, motionRef] = useMotionStyle({ delay: 20 });
  const stats = getRichItems(props.items || props.stats || [], 4).length
    ? getRichItems(props.items || props.stats || [], 4)
    : [
        { value: "24/7", label: "Emergency dispatch triage", label2: "Response" },
        { value: "4.9", label: "Average review score", label2: "Trust" },
        { value: "18+", label: "Years in field operations", label2: "Experience" },
        { value: "6", label: "Core GTA coverage zones", label2: "Coverage" },
      ];
  return (
    <Box ref={motionRef} sx={{ ...motionSx }}>
      <Container maxWidth={false} sx={{ maxWidth: `${TOKENS.layout.contentMax}px`, px: { xs: 0.5, md: 1.5 } }}>
        <Grid container spacing={2}>
          {stats.map((item, idx) => (
            <Grid item xs={12} sm={6} lg={3} key={`${item.title || item.label}-${idx}`}>
              <IndustrialMetricCard
                value={item.value || item.title}
                label={item.description || item.label}
                eyebrow={item.meta || item.label2 || item.label}
                active
              />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

export function IndustrialFeatureSplit({ websiteSectionAdapter: adapter = {} }) {
  const props = adapter?.props || {};
  const [motionSx, motionRef] = useMotionStyle({ delay: 40 });
  const features = getRichItems(props.items || props.points || props.features || [], 6);
  const imageUrl = props.image || props.imageUrl || props.mediaImage || "";
  return (
    <Box ref={motionRef} sx={{ ...motionSx, position: "relative" }}>
      <Container maxWidth={false} sx={{ maxWidth: `${TOKENS.layout.contentMax}px`, px: { xs: 1, md: 2 } }}>
        <Grid container spacing={{ xs: 3, md: 4 }} alignItems="stretch">
          <Grid item xs={12} lg={5}>
            <Box
              sx={{
                position: "relative",
                height: "100%",
                minHeight: { xs: 300, md: 520 },
                borderRadius: 4,
                overflow: "hidden",
                clipPath: TOKENS.decorations.diagonalClip,
                background:
                  imageUrl
                    ? `linear-gradient(180deg, rgba(7,17,31,0.1), rgba(7,17,31,0.58)), url(${imageUrl}) center / cover no-repeat`
                    : "linear-gradient(180deg, rgba(24,63,97,0.86), rgba(7,17,31,0.94))",
                border: `1px solid ${TOKENS.colors.line}`,
              }}
            >
              <BlueprintBackdrop inset />
              {props.imageLabel ? (
                <Box sx={{ position: "absolute", left: 20, bottom: 20, p: 1.2, bgcolor: "rgba(7,17,31,0.7)", border: `1px solid ${TOKENS.colors.line}` }}>
                  <Typography sx={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.12em", color: TOKENS.colors.textMuted }}>
                    {props.imageLabel}
                  </Typography>
                </Box>
              ) : null}
            </Box>
          </Grid>
          <Grid item xs={12} lg={7}>
            <Box
              sx={{
                position: "relative",
                height: "100%",
                p: { xs: 3, md: 4 },
                borderRadius: 4,
                border: `1px solid ${TOKENS.colors.line}`,
                background: "linear-gradient(180deg, rgba(11,24,43,0.94), rgba(8,17,31,0.92))",
                overflow: "hidden",
              }}
            >
              <BlueprintBackdrop inset />
              <Stack spacing={2.2} sx={{ position: "relative", zIndex: 1 }}>
                <TechLabel>{props.eyebrow || "Field notes"}</TechLabel>
                <Typography sx={{ fontFamily: TOKENS.typography.headingFont, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 0.95, fontSize: "clamp(2rem, 4vw, 3.25rem)" }}>
                  {props.title || adapter.title || "Explain the decision, not just the service name."}
                </Typography>
                {(props.description || adapter.subtitle) ? (
                  <Typography sx={{ color: TOKENS.colors.textMuted, lineHeight: 1.8 }}>
                    {props.description || adapter.subtitle}
                  </Typography>
                ) : null}
                <Grid container spacing={1.6}>
                  {features.map((item, idx) => (
                    <Grid item xs={12} sm={6} key={`${item.title}-${idx}`}>
                      <Box sx={{ p: 2, border: `1px solid ${TOKENS.colors.line}`, bgcolor: "rgba(255,255,255,0.03)", minHeight: 144 }}>
                        <Typography sx={{ fontFamily: TOKENS.typography.headingFont, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.02em", fontSize: "1.16rem" }}>
                          {item.title}
                        </Typography>
                        {item.description ? (
                          <Typography sx={{ mt: 1, color: TOKENS.colors.textSoft, lineHeight: 1.7 }}>
                            {item.description}
                          </Typography>
                        ) : null}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
                {(props.ctaText || props.ctaLink) ? (
                  <ActionButton
                    href={props.ctaLink}
                    label={props.ctaText}
                    variant="outlined"
                    sx={{ alignSelf: "flex-start", mt: 1 }}
                  />
                ) : null}
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export function IndustrialImageStory({ websiteSectionAdapter: adapter = {} }) {
  const props = adapter?.props || {};
  const [motionSx, motionRef] = useMotionStyle({ delay: 40 });
  const chapters = getRichItems(props.items || props.chapters || [], 4);
  const imageUrl = props.image || props.imageUrl || "";
  return (
    <Box ref={motionRef} sx={{ ...motionSx }}>
      <Container maxWidth={false} sx={{ maxWidth: `${TOKENS.layout.contentMax}px`, px: { xs: 1, md: 2 } }}>
        <Grid container spacing={{ xs: 3, md: 4 }}>
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <TechLabel>{props.eyebrow || "Project story"}</TechLabel>
              <Typography sx={{ fontFamily: TOKENS.typography.headingFont, fontWeight: 800, fontSize: "clamp(2rem, 4vw, 3rem)", textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 0.95 }}>
                {props.title || adapter.title || "A stronger narrative than generic marketing copy."}
              </Typography>
              {props.description ? (
                <Typography sx={{ color: TOKENS.colors.textMuted, lineHeight: 1.8 }}>{props.description}</Typography>
              ) : null}
              <Stack spacing={1.35}>
                {chapters.map((item, idx) => (
                  <Stack key={`${item.title}-${idx}`} direction="row" spacing={1.6} alignItems="flex-start">
                    <Box sx={{ mt: 0.2, minWidth: 38, height: 38, borderRadius: "50%", display: "grid", placeItems: "center", border: `1px solid ${TOKENS.colors.line}`, color: TOKENS.colors.accent, fontFamily: TOKENS.typography.headingFont, fontWeight: 800 }}>
                      {String(idx + 1).padStart(2, "0")}
                    </Box>
                    <Box>
                      <Typography sx={{ fontFamily: TOKENS.typography.headingFont, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        {item.title}
                      </Typography>
                      {item.description ? (
                        <Typography sx={{ mt: 0.65, color: TOKENS.colors.textSoft, lineHeight: 1.7 }}>
                          {item.description}
                        </Typography>
                      ) : null}
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                height: "100%",
                minHeight: { xs: 320, md: 560 },
                borderRadius: 4,
                overflow: "hidden",
                border: `1px solid ${TOKENS.colors.line}`,
                background:
                  imageUrl
                    ? `linear-gradient(180deg, rgba(7,17,31,0.06), rgba(7,17,31,0.64)), url(${imageUrl}) center / cover no-repeat`
                    : "linear-gradient(180deg, rgba(24,63,97,0.82), rgba(7,17,31,0.95))",
                clipPath: TOKENS.decorations.diagonalClipAlt,
              }}
            >
              <BlueprintBackdrop inset />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export function IndustrialServiceSelector({ websiteSectionAdapter: adapter = {} }) {
  const props = adapter?.props || {};
  const [selected, setSelected] = useState(0);
  const [motionSx, motionRef] = useMotionStyle({ delay: 50 });
  const systems = getRichItems(props.items || props.systems || [], 6);
  const active = systems[selected] || systems[0] || null;

  if (!active) return null;

  return (
    <Box ref={motionRef} sx={{ ...motionSx }}>
      <Container maxWidth={false} sx={{ maxWidth: `${TOKENS.layout.contentMax}px`, px: { xs: 1, md: 2 } }}>
        <Stack spacing={2.5}>
          <Stack spacing={1.1} sx={{ maxWidth: 820 }}>
            <TechLabel>{props.eyebrow || "System selector"}</TechLabel>
            <Typography sx={{ fontFamily: TOKENS.typography.headingFont, fontWeight: 800, fontSize: "clamp(2rem, 4vw, 3.1rem)", lineHeight: 0.95, textTransform: "uppercase", letterSpacing: "-0.03em" }}>
              {props.title || adapter.title || "Let customers self-sort into the right service line."}
            </Typography>
            {props.description ? (
              <Typography sx={{ color: TOKENS.colors.textMuted, lineHeight: 1.8 }}>{props.description}</Typography>
            ) : null}
          </Stack>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={4}>
              <Stack spacing={1.2}>
                {systems.map((item, idx) => {
                  const isActive = idx === selected;
                  return (
                    <Button
                      key={item.id}
                      onClick={() => setSelected(idx)}
                      variant="text"
                      sx={{
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        textAlign: "left",
                        p: 2.2,
                        borderRadius: 3,
                        border: `1px solid ${isActive ? alpha(TOKENS.colors.accent, 0.45) : TOKENS.colors.line}`,
                        background: isActive ? "rgba(255,138,31,0.08)" : "rgba(255,255,255,0.03)",
                        color: TOKENS.colors.text,
                      }}
                    >
                      <Stack spacing={0.8} alignItems="flex-start">
                        <Typography sx={{ fontFamily: TOKENS.typography.headingFont, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          {item.title}
                        </Typography>
                        {item.meta ? (
                          <Typography sx={{ color: TOKENS.colors.textSoft, lineHeight: 1.6 }}>
                            {item.meta}
                          </Typography>
                        ) : null}
                      </Stack>
                      <NorthEastIcon sx={{ color: isActive ? TOKENS.colors.accent : TOKENS.colors.textSoft }} />
                    </Button>
                  );
                })}
              </Stack>
            </Grid>
            <Grid item xs={12} lg={8}>
              <Box sx={{ position: "relative", overflow: "hidden", p: { xs: 3, md: 4 }, borderRadius: 4, border: `1px solid ${TOKENS.colors.line}`, background: "linear-gradient(180deg, rgba(13,26,45,0.96), rgba(8,17,31,0.94))" }}>
                <BlueprintBackdrop inset />
                <Grid container spacing={3} sx={{ position: "relative", zIndex: 1 }}>
                  <Grid item xs={12} md={7}>
                    <Stack spacing={1.5}>
                      {active.label ? <TechLabel>{active.label}</TechLabel> : null}
                      <Typography sx={{ fontFamily: TOKENS.typography.headingFont, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.02em", fontSize: "clamp(1.7rem, 3vw, 2.5rem)", lineHeight: 0.97 }}>
                        {active.title}
                      </Typography>
                      {active.description ? (
                        <Typography sx={{ color: TOKENS.colors.textMuted, lineHeight: 1.8 }}>{active.description}</Typography>
                      ) : null}
                      <Stack spacing={1}>
                        {active.bullets.map((bullet, idx) => (
                          <Stack key={`${bullet}-${idx}`} direction="row" spacing={1.1} alignItems="flex-start">
                            <BoltOutlinedIcon sx={{ mt: "2px", fontSize: 18, color: TOKENS.colors.accent }} />
                            <Typography sx={{ color: TOKENS.colors.textSoft, lineHeight: 1.7 }}>{toPlain(bullet)}</Typography>
                          </Stack>
                        ))}
                      </Stack>
                      {active.link ? (
                        <ActionButton href={active.link} label={props.ctaText || "Explore service path"} sx={{ alignSelf: "flex-start", mt: 0.5 }} />
                      ) : null}
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <Box
                      sx={{
                        minHeight: 280,
                        height: "100%",
                        borderRadius: 4,
                        clipPath: TOKENS.decorations.diagonalClip,
                        background: active.image
                          ? `linear-gradient(180deg, rgba(7,17,31,0.12), rgba(7,17,31,0.56)), url(${active.image}) center / cover no-repeat`
                          : "linear-gradient(180deg, rgba(34,91,143,0.82), rgba(7,17,31,0.94))",
                        border: `1px solid ${TOKENS.colors.line}`,
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}

export function IndustrialProjectShowcase({ websiteSectionAdapter: adapter = {} }) {
  const props = adapter?.props || {};
  const [motionSx, motionRef] = useMotionStyle({ delay: 60 });
  const metrics = getRichItems(props.metrics || [], 3);
  const bullets = getArray(props.bullets || props.points || []);
  const imageUrl = props.image || props.imageUrl || "";
  return (
    <Box ref={motionRef} sx={{ ...motionSx }}>
      <Container maxWidth={false} sx={{ maxWidth: `${TOKENS.layout.shellMax}px`, px: { xs: 1.5, md: 4 } }}>
        <Box sx={{ position: "relative", overflow: "hidden", borderRadius: 4, border: `1px solid ${TOKENS.colors.line}`, background: "linear-gradient(180deg, rgba(11,24,43,0.98), rgba(8,17,31,0.95))" }}>
          <BlueprintBackdrop />
          <Grid container spacing={0}>
            <Grid item xs={12} lg={6}>
              <Box
                sx={{
                  minHeight: { xs: 300, lg: 620 },
                  height: "100%",
                  background: imageUrl
                    ? `linear-gradient(180deg, rgba(7,17,31,0.12), rgba(7,17,31,0.42)), url(${imageUrl}) center / cover no-repeat`
                    : "linear-gradient(180deg, rgba(34,91,143,0.82), rgba(7,17,31,0.94))",
                  clipPath: { lg: TOKENS.decorations.diagonalClipAlt },
                }}
              />
            </Grid>
            <Grid item xs={12} lg={6}>
              <Stack spacing={2.4} sx={{ p: { xs: 3, md: 5 }, position: "relative", zIndex: 1 }}>
                <TechLabel>{props.eyebrow || "Featured project / field report"}</TechLabel>
                <Typography sx={{ fontFamily: TOKENS.typography.headingFont, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 0.94, fontSize: "clamp(2rem, 4vw, 3.4rem)" }}>
                  {props.title || adapter.title || "Show an actual system story, not stock marketing."}
                </Typography>
                {props.description ? (
                  <Typography sx={{ color: TOKENS.colors.textMuted, lineHeight: 1.85 }}>{props.description}</Typography>
                ) : null}
                <Grid container spacing={1.5}>
                  {metrics.map((item, idx) => (
                    <Grid item xs={12} sm={4} key={`${item.title}-${idx}`}>
                      <IndustrialMetricCard value={item.value || item.title} label={item.description || item.label} eyebrow={item.meta || item.label} />
                    </Grid>
                  ))}
                </Grid>
                <Stack spacing={1.15}>
                  {bullets.map((item, idx) => (
                    <Stack key={`${item}-${idx}`} direction="row" spacing={1.2} alignItems="flex-start">
                      <VerifiedUserOutlinedIcon sx={{ mt: "2px", fontSize: 18, color: TOKENS.colors.accent }} />
                      <Typography sx={{ color: TOKENS.colors.textSoft, lineHeight: 1.7 }}>{toPlain(item)}</Typography>
                    </Stack>
                  ))}
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.3} sx={{ pt: 1 }}>
                  <ActionButton href={props.ctaLink} label={props.ctaText || "Request similar scope"} />
                  {props.secondaryCtaText ? (
                    <ActionButton href={props.secondaryCtaLink} label={props.secondaryCtaText} variant="outlined" />
                  ) : null}
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}

export function IndustrialProcessTimeline({ websiteSectionAdapter: adapter = {} }) {
  const props = adapter?.props || {};
  const [motionSx, motionRef] = useMotionStyle({ delay: 70 });
  const steps = getRichItems(props.items || props.steps || [], 6);
  if (!steps.length) return null;
  return (
    <Box ref={motionRef} sx={{ ...motionSx }}>
      <Container maxWidth={false} sx={{ maxWidth: `${TOKENS.layout.contentMax}px`, px: { xs: 1, md: 2 } }}>
        <Stack spacing={2.4}>
          <Stack spacing={1.1} sx={{ maxWidth: 780 }}>
            <TechLabel>{props.eyebrow || "Response workflow"}</TechLabel>
            <Typography sx={{ fontFamily: TOKENS.typography.headingFont, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 0.95, fontSize: "clamp(2rem, 4vw, 3.1rem)" }}>
              {props.title || adapter.title || "The process should feel disciplined before the truck arrives."}
            </Typography>
            {props.description ? <Typography sx={{ color: TOKENS.colors.textMuted, lineHeight: 1.8 }}>{props.description}</Typography> : null}
          </Stack>
          <Grid container spacing={2}>
            {steps.map((step, idx) => (
              <Grid item xs={12} md={6} lg={4} key={`${step.title}-${idx}`}>
                <Box
                  sx={{
                    position: "relative",
                    height: "100%",
                    p: 2.5,
                    borderRadius: 3,
                    border: `1px solid ${TOKENS.colors.line}`,
                    background: "linear-gradient(180deg, rgba(13,26,45,0.95), rgba(8,17,31,0.92))",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: `linear-gradient(90deg, ${TOKENS.colors.accent}, rgba(255,255,255,0))`,
                    },
                  }}
                >
                  <Typography sx={{ color: alpha(TOKENS.colors.text, 0.22), fontFamily: TOKENS.typography.headingFont, fontWeight: 900, fontSize: "2.4rem", lineHeight: 0.9 }}>
                    {String(idx + 1).padStart(2, "0")}
                  </Typography>
                  <Typography sx={{ mt: 1.2, fontFamily: TOKENS.typography.headingFont, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", fontSize: "1.24rem" }}>
                    {step.title}
                  </Typography>
                  {step.description ? (
                    <Typography sx={{ mt: 1, color: TOKENS.colors.textSoft, lineHeight: 1.75 }}>
                      {step.description}
                    </Typography>
                  ) : null}
                </Box>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}

export function IndustrialEmergencyBand({ websiteSectionAdapter: adapter = {} }) {
  const props = adapter?.props || {};
  const [motionSx, motionRef] = useMotionStyle({ delay: 80 });
  const bullets = getArray(props.bullets || props.points || []);
  return (
    <Box ref={motionRef} sx={{ ...motionSx }}>
      <Container maxWidth={false} sx={{ maxWidth: `${TOKENS.layout.shellMax}px`, px: { xs: 1.5, md: 4 } }}>
        <Box sx={{ position: "relative", overflow: "hidden", borderRadius: 4, border: `1px solid ${alpha(TOKENS.colors.accent, 0.34)}`, background: "linear-gradient(135deg, rgba(255,138,31,0.94), rgba(255,177,77,0.94))", color: TOKENS.colors.accentText, p: { xs: 3, md: 4 } }}>
          <Grid container spacing={2.5} alignItems="center">
            <Grid item xs={12} md={7}>
              <Stack spacing={1.1}>
                <Typography sx={{ fontFamily: TOKENS.typography.headingFont, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", fontSize: "0.78rem", color: alpha(TOKENS.colors.accentText, 0.72) }}>
                  {props.eyebrow || "Emergency service window"}
                </Typography>
                <Typography sx={{ fontFamily: TOKENS.typography.headingFont, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 0.94, fontSize: "clamp(2rem, 4vw, 3.1rem)" }}>
                  {props.title || adapter.title || "When the system is failing now, make the next click obvious."}
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={12} md={5}>
              <Stack spacing={1.1}>
                {props.description ? (
                  <Typography sx={{ color: alpha(TOKENS.colors.accentText, 0.82), lineHeight: 1.7 }}>{props.description}</Typography>
                ) : null}
                {bullets.map((item, idx) => (
                  <Typography key={`${item}-${idx}`} sx={{ color: alpha(TOKENS.colors.accentText, 0.84), lineHeight: 1.6 }}>
                    {toPlain(item)}
                  </Typography>
                ))}
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ pt: 1 }}>
                  <ActionButton href={props.ctaLink} label={props.ctaText || "Request urgent service"} sx={{ background: "rgba(7,17,31,0.94)", color: "#fff", "&:hover": { background: "rgba(7,17,31,0.94)", filter: "brightness(1.05)", transform: TOKENS.motion.hoverLift } }} />
                  {props.secondaryCtaText ? <ActionButton href={props.secondaryCtaLink} label={props.secondaryCtaText} variant="outlined" sx={{ borderColor: alpha(TOKENS.colors.accentText, 0.24), color: TOKENS.colors.accentText }} /> : null}
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}

export function IndustrialServiceArea({ websiteSectionAdapter: adapter = {} }) {
  const props = adapter?.props || {};
  const [motionSx, motionRef] = useMotionStyle({ delay: 60 });
  const areas = getArray(props.areas || props.items || []);
  const policies = getArray(props.policies || props.points || []);
  return (
    <Box ref={motionRef} sx={{ ...motionSx }}>
      <Container maxWidth={false} sx={{ maxWidth: `${TOKENS.layout.contentMax}px`, px: { xs: 1, md: 2 } }}>
        <Grid container spacing={{ xs: 3, md: 4 }}>
          <Grid item xs={12} lg={5}>
            <Stack spacing={1.3}>
              <TechLabel>{props.eyebrow || "Coverage footprint"}</TechLabel>
              <Typography sx={{ fontFamily: TOKENS.typography.headingFont, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 0.95, fontSize: "clamp(2rem, 4vw, 3rem)" }}>
                {props.title || adapter.title || "Show where dispatch is straightforward."}
              </Typography>
              {props.description ? <Typography sx={{ color: TOKENS.colors.textMuted, lineHeight: 1.8 }}>{props.description}</Typography> : null}
              <Stack spacing={1.05} sx={{ pt: 1 }}>
                {policies.map((item, idx) => (
                  <Stack key={`${item}-${idx}`} direction="row" spacing={1.2} alignItems="flex-start">
                    <LocalShippingIcon sx={{ mt: "2px", fontSize: 18, color: TOKENS.colors.accent }} />
                    <Typography sx={{ color: TOKENS.colors.textSoft, lineHeight: 1.7 }}>{toPlain(item)}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </Grid>
          <Grid item xs={12} lg={7}>
            <Box sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: `1px solid ${TOKENS.colors.line}`, background: "linear-gradient(180deg, rgba(11,24,43,0.94), rgba(8,17,31,0.92))" }}>
              <Grid container spacing={1.2}>
                {areas.map((item, idx) => (
                  <Grid item xs={6} sm={4} key={`${item}-${idx}`}>
                    <Box sx={{ p: 1.4, minHeight: 84, border: `1px solid ${TOKENS.colors.line}`, bgcolor: "rgba(255,255,255,0.03)" }}>
                      <Typography sx={{ fontFamily: TOKENS.typography.headingFont, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {typeof item === "string" ? item : item?.name || item?.title || `Area ${idx + 1}`}
                      </Typography>
                      {typeof item === "object" && (item?.note || item?.meta) ? (
                        <Typography sx={{ mt: 0.7, color: TOKENS.colors.textSoft, lineHeight: 1.6 }}>
                          {item.note || item.meta}
                        </Typography>
                      ) : null}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export function IndustrialMembershipPlans({ websiteSectionAdapter: adapter = {} }) {
  const props = adapter?.props || {};
  const [motionSx, motionRef] = useMotionStyle({ delay: 70 });
  const plans = getRichItems(props.items || props.plans || [], 4);
  if (!plans.length) return null;
  return (
    <Box ref={motionRef} sx={{ ...motionSx }}>
      <Container maxWidth={false} sx={{ maxWidth: `${TOKENS.layout.contentMax}px`, px: { xs: 1, md: 2 } }}>
        <Stack spacing={2.25}>
          <Stack spacing={1.1} sx={{ maxWidth: 760 }}>
            <TechLabel>{props.eyebrow || "Membership / maintenance"}</TechLabel>
            <Typography sx={{ fontFamily: TOKENS.typography.headingFont, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 0.95, fontSize: "clamp(2rem, 4vw, 3rem)" }}>
              {props.title || adapter.title || "Turn one-off service into planned retention."}
            </Typography>
            {props.description ? <Typography sx={{ color: TOKENS.colors.textMuted, lineHeight: 1.8 }}>{props.description}</Typography> : null}
          </Stack>
          <Grid container spacing={2}>
            {plans.map((plan, idx) => (
              <Grid item xs={12} md={4} key={`${plan.title}-${idx}`}>
                <Box sx={{ position: "relative", height: "100%", p: 2.5, borderRadius: 4, border: `1px solid ${idx === 1 ? alpha(TOKENS.colors.accent, 0.48) : TOKENS.colors.line}`, background: idx === 1 ? "linear-gradient(180deg, rgba(255,138,31,0.12), rgba(8,17,31,0.9))" : "linear-gradient(180deg, rgba(13,26,45,0.94), rgba(8,17,31,0.92))" }}>
                  {plan.label ? (
                    <Chip label={plan.label} sx={{ mb: 1.4, bgcolor: idx === 1 ? TOKENS.colors.accent : "rgba(255,255,255,0.08)", color: idx === 1 ? TOKENS.colors.accentText : TOKENS.colors.text, "& .MuiChip-label": { fontFamily: TOKENS.typography.headingFont, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" } }} />
                  ) : null}
                  <Typography sx={{ fontFamily: TOKENS.typography.headingFont, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.02em", fontSize: "1.5rem" }}>
                    {plan.title}
                  </Typography>
                  {plan.value ? (
                    <Typography sx={{ mt: 1, fontFamily: TOKENS.typography.headingFont, fontWeight: 900, fontSize: "2.3rem", letterSpacing: "-0.03em" }}>
                      {plan.value}
                    </Typography>
                  ) : null}
                  {plan.description ? (
                    <Typography sx={{ mt: 1.1, color: TOKENS.colors.textSoft, lineHeight: 1.7 }}>{plan.description}</Typography>
                  ) : null}
                  <Stack spacing={1} sx={{ mt: 2 }}>
                    {plan.bullets.map((bullet, bulletIdx) => (
                      <Stack key={`${bullet}-${bulletIdx}`} direction="row" spacing={1.1} alignItems="flex-start">
                        <CheckIcon sx={{ mt: "2px", fontSize: 18, color: TOKENS.colors.accent }} />
                        <Typography sx={{ color: TOKENS.colors.textMuted, lineHeight: 1.6 }}>{toPlain(bullet)}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                  {plan.link ? <ActionButton href={plan.link} label={props.ctaText || "Choose plan"} sx={{ mt: 2.2, width: "100%" }} /> : null}
                </Box>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}

export function IndustrialGalleryWall({ websiteSectionAdapter: adapter = {} }) {
  const props = adapter?.props || {};
  const [motionSx, motionRef] = useMotionStyle({ delay: 90 });
  const images = getRichItems(props.items || props.images || [], 8);
  if (!images.length) return null;
  return (
    <Box ref={motionRef} sx={{ ...motionSx }}>
      <Container maxWidth={false} sx={{ maxWidth: `${TOKENS.layout.shellMax}px`, px: { xs: 1.5, md: 4 } }}>
        <Stack spacing={2.2}>
          <Stack spacing={1.1} sx={{ maxWidth: 760 }}>
            <TechLabel>{props.eyebrow || "Project wall"}</TechLabel>
            <Typography sx={{ fontFamily: TOKENS.typography.headingFont, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 0.95, fontSize: "clamp(2rem, 4vw, 3rem)" }}>
              {props.title || adapter.title || "Give the site visual proof beyond one hero image."}
            </Typography>
            {props.description ? <Typography sx={{ color: TOKENS.colors.textMuted, lineHeight: 1.8 }}>{props.description}</Typography> : null}
          </Stack>
          <Grid container spacing={1.5}>
            {images.map((item, idx) => (
              <Grid item xs={12} sm={6} md={idx % 4 === 0 ? 6 : 3} key={`${item.title}-${idx}`}>
                <Box sx={{ position: "relative", minHeight: idx % 4 === 0 ? 340 : 240, borderRadius: 4, overflow: "hidden", border: `1px solid ${TOKENS.colors.line}`, background: item.image ? `linear-gradient(180deg, rgba(7,17,31,0.1), rgba(7,17,31,0.52)), url(${item.image}) center / cover no-repeat` : "linear-gradient(180deg, rgba(34,91,143,0.82), rgba(7,17,31,0.94))" }}>
                  <Box sx={{ position: "absolute", left: 18, right: 18, bottom: 18, p: 1.35, bgcolor: "rgba(7,17,31,0.7)", border: `1px solid ${TOKENS.colors.line}` }}>
                    <Typography sx={{ fontFamily: TOKENS.typography.headingFont, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {item.title}
                    </Typography>
                    {item.description ? <Typography sx={{ mt: 0.55, color: TOKENS.colors.textSoft, lineHeight: 1.6 }}>{item.description}</Typography> : null}
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}

export function IndustrialBeforeAfter({ websiteSectionAdapter: adapter = {} }) {
  const props = adapter?.props || {};
  const [motionSx, motionRef] = useMotionStyle({ delay: 90 });
  const columns = getRichItems(props.items || props.columns || [], 2);
  if (!columns.length) return null;
  return (
    <Box ref={motionRef} sx={{ ...motionSx }}>
      <Container maxWidth={false} sx={{ maxWidth: `${TOKENS.layout.contentMax}px`, px: { xs: 1, md: 2 } }}>
        <Stack spacing={2}>
          <Stack spacing={1.1} sx={{ maxWidth: 760 }}>
            <TechLabel>{props.eyebrow || "Decision framing"}</TechLabel>
            <Typography sx={{ fontFamily: TOKENS.typography.headingFont, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 0.95, fontSize: "clamp(2rem, 4vw, 3rem)" }}>
              {props.title || adapter.title || "Help visitors compare paths without sounding salesy."}
            </Typography>
          </Stack>
          <Grid container spacing={2}>
            {columns.map((item, idx) => (
              <Grid item xs={12} md={6} key={`${item.title}-${idx}`}>
                <Box sx={{ height: "100%", p: 2.5, borderRadius: 4, border: `1px solid ${TOKENS.colors.line}`, background: idx === 0 ? "linear-gradient(180deg, rgba(13,26,45,0.94), rgba(8,17,31,0.92))" : "linear-gradient(180deg, rgba(255,138,31,0.08), rgba(8,17,31,0.92))" }}>
                  <Typography sx={{ fontFamily: TOKENS.typography.headingFont, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "1.4rem" }}>
                    {item.title}
                  </Typography>
                  {item.description ? <Typography sx={{ mt: 1, color: TOKENS.colors.textSoft, lineHeight: 1.7 }}>{item.description}</Typography> : null}
                  <Stack spacing={1} sx={{ mt: 2 }}>
                    {item.bullets.map((bullet, bulletIdx) => (
                      <Stack key={`${bullet}-${bulletIdx}`} direction="row" spacing={1.1} alignItems="flex-start">
                        <DiamondOutlinedIcon sx={{ mt: "2px", fontSize: 18, color: TOKENS.colors.accent }} />
                        <Typography sx={{ color: TOKENS.colors.textMuted, lineHeight: 1.65 }}>{toPlain(bullet)}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}

export function IndustrialHeader({
  shell = {},
}) {
  const theme = useTheme();
  const {
    slug,
    site,
    headerConfig,
    nav,
    navLinks = [],
    pathname,
    isPreview,
    resolveLinkProps,
    reviewsHref,
    loginHref,
    myBookingsHref,
    clientLoggedIn,
    hasReviewsLink,
    hasLoginLink,
    hasMyBookingsLink,
    isReviewsActive,
    doLogout,
  } = shell;
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerLogo =
    headerConfig?.logo_asset?.url ||
    headerConfig?.logo_url ||
    site?.company?.logo_url ||
    null;
  const brandName = headerConfig?.text || site?.company?.name || slug || "Brand";
  const utilityLeft = headerConfig?.text || "Emergency-ready service coverage";
  const utilityRight = headerConfig?.scroll_cta_label || site?.company?.phone || "Same-day dispatch";
  const ctaLabel = headerConfig?.scroll_cta_label || "Request service";
  const ctaHref = headerConfig?.scroll_cta_href || `/${slug}?page=contact`;

  const navEntries = [
    ...navLinks.map((item) => ({
      key: `${item.id || item.label}-${item.href}`,
      label: item.label || "Link",
      linkProps: resolveLinkProps(item.href),
      active:
        Boolean(item?.href && String(item.href).startsWith("?page=") && pathname.includes(String(item.href).replace("?", ""))) ||
        Boolean(item?.href && String(item.href).startsWith("/") && pathname === String(item.href)),
    })),
    ...(!isPreview && !hasReviewsLink && nav.show_reviews_tab !== false
      ? [
          {
            key: "reviews",
            label: nav.reviews_tab_label || "Reviews",
            linkProps: { component: RouterLink, to: reviewsHref() },
            active: isReviewsActive,
          },
        ]
      : []),
    ...(clientLoggedIn
      ? [
          ...(!hasMyBookingsLink && nav.show_my_bookings_tab !== false
            ? [
                {
                  key: "my-bookings",
                  label: nav.my_bookings_tab_label || "My Bookings",
                  linkProps: { component: RouterLink, to: myBookingsHref() },
                  active: pathname.startsWith("/dashboard"),
                },
              ]
            : []),
          { key: "logout", label: nav.logout_tab_label || "Log out", onClick: doLogout },
        ]
      : !hasLoginLink && nav.show_login_tab !== false
      ? [
          {
            key: "login",
            label: nav.login_tab_label || "Login",
            linkProps: { component: RouterLink, to: loginHref() },
            active: pathname === "/login",
          },
        ]
      : []),
  ];

  const renderNavButton = (item, mobile = false) => (
    <Button
      key={item.key}
      {...(item.linkProps || {})}
      onClick={(event) => {
        item.onClick?.(event);
        if (mobile) setMobileOpen(false);
      }}
      variant="text"
      sx={{
        justifyContent: mobile ? "flex-start" : "center",
        borderRadius: mobile ? 2 : 0,
        px: mobile ? 0 : 1.5,
        py: mobile ? 1.1 : 0.8,
        minHeight: mobile ? 48 : "auto",
        fontFamily: TOKENS.typography.headingFont,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: item.active ? TOKENS.colors.text : TOKENS.colors.textMuted,
        borderBottom: mobile ? "none" : item.active ? `2px solid ${TOKENS.colors.accent}` : "2px solid transparent",
        "&:hover": {
          backgroundColor: mobile ? alpha("#fff", 0.06) : "transparent",
          color: TOKENS.colors.text,
          borderBottomColor: mobile ? "transparent" : alpha(TOKENS.colors.accent, 0.54),
        },
      }}
    >
      {item.label}
    </Button>
  );

  return (
    <>
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          borderBottom: `1px solid ${TOKENS.colors.line}`,
          background: "linear-gradient(180deg, rgba(8,17,31,0.98), rgba(8,17,31,0.94))",
          backdropFilter: "blur(12px)",
        }}
      >
        <Box
          sx={{
            borderBottom: `1px solid ${alpha(TOKENS.colors.lineStrong, 0.8)}`,
            backgroundColor: "rgba(255,255,255,0.03)",
          }}
        >
          <Container maxWidth={false} sx={{ maxWidth: `${TOKENS.layout.shellMax}px`, px: { xs: 2.25, md: 4 }, py: 1.1 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={0.8} justifyContent="space-between">
              <TechLabel>{utilityLeft}</TechLabel>
              <Typography
                sx={{
                  color: TOKENS.colors.textSoft,
                  fontFamily: TOKENS.typography.headingFont,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  fontSize: "0.74rem",
                }}
              >
                {utilityRight}
              </Typography>
            </Stack>
          </Container>
        </Box>
        <Container maxWidth={false} sx={{ maxWidth: `${TOKENS.layout.shellMax}px`, px: { xs: 2.25, md: 4 } }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
            sx={{ py: { xs: 1.5, md: 2 } }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              {headerLogo ? (
                <Box
                  component="img"
                  src={headerLogo}
                  alt={site?.company?.name || slug}
                  sx={{ width: "auto", height: 44, maxWidth: 180, objectFit: "contain" }}
                />
              ) : null}
              <Box>
                <Typography
                  component={RouterLink}
                  to={`/${slug}`}
                  sx={{
                    textDecoration: "none",
                    fontFamily: TOKENS.typography.headingFont,
                    color: TOKENS.colors.text,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontSize: { xs: "1.15rem", md: "1.35rem" },
                  }}
                >
                  {brandName}
                </Typography>
                <Typography sx={{ color: TOKENS.colors.textSoft, fontSize: "0.82rem" }}>
                  {headerConfig?.tagline || "Operational service website"}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1.2} alignItems="center" sx={{ display: { xs: "none", lg: "flex" } }}>
              {navEntries.map((item) => renderNavButton(item))}
            </Stack>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <ActionButton href={ctaHref} label={ctaLabel} sx={{ display: { xs: "none", md: "inline-flex" } }} />
              <IconButton
                onClick={() => setMobileOpen(true)}
                sx={{
                  display: { xs: "inline-flex", lg: "none" },
                  borderRadius: 2,
                  border: `1px solid ${TOKENS.colors.line}`,
                  color: TOKENS.colors.text,
                }}
              >
                <MenuIcon />
              </IconButton>
            </Stack>
          </Stack>
        </Container>
      </Box>
      <Drawer
        anchor="top"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            background: "linear-gradient(180deg, rgba(8,17,31,0.99), rgba(13,26,45,0.98))",
            color: TOKENS.colors.text,
            borderBottom: `1px solid ${TOKENS.colors.line}`,
            px: 2.4,
            pt: 2,
            pb: 3,
          },
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography sx={{ fontFamily: TOKENS.typography.headingFont, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {brandName}
          </Typography>
          <IconButton onClick={() => setMobileOpen(false)} sx={{ color: TOKENS.colors.text }}>
            <CloseIcon />
          </IconButton>
        </Stack>
        <Stack spacing={0.5}>
          {navEntries.map((item) => renderNavButton(item, true))}
        </Stack>
        <ActionButton href={ctaHref} label={ctaLabel} sx={{ mt: 2.2, width: "100%" }} />
      </Drawer>
    </>
  );
}

export function IndustrialFooter({
  shell = {},
}) {
  const {
    slug,
    site,
    footerConfig,
    resolveLinkProps,
  } = shell;
  const footerLogo = footerConfig?.logo_asset?.url || site?.company?.logo_url || null;
  const footerLogoWidth = Math.max(40, Math.min(360, Number(footerConfig?.logo_width || 160) || 160));
  const footerColumns = Array.isArray(footerConfig?.columns) ? footerConfig.columns : [];
  const footerSocial = Array.isArray(footerConfig?.social_links) ? footerConfig.social_links : [];
  const footerLegal = Array.isArray(footerConfig?.legal_links) ? footerConfig.legal_links : [];
  const footerText = (footerConfig?.text || "").trim();
  const copyrightText = formatCopyrightText(footerConfig?.copyright_text, {
    company: site?.company?.name,
    slug,
  });

  return (
    <Box
      component="footer"
      sx={{
        mt: 8,
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(180deg, rgba(7,17,31,1) 0%, rgba(10,20,36,1) 100%)",
        color: TOKENS.colors.text,
        borderTop: `1px solid ${TOKENS.colors.line}`,
      }}
    >
      <BlueprintBackdrop />
      <Container maxWidth={false} sx={{ maxWidth: `${TOKENS.layout.shellMax}px`, px: { xs: 2.25, md: 4 }, py: { xs: 5, md: 6 } }}>
        <Grid container spacing={{ xs: 3, md: 4 }}>
          <Grid item xs={12} lg={4}>
            <Stack spacing={1.4}>
              {footerLogo ? (
                <Box
                  component="img"
                  src={footerLogo}
                  alt={site?.company?.name || slug}
                  sx={{
                    width: `${footerLogoWidth}px`,
                    height: "auto",
                    maxWidth: "100%",
                    maxHeight: 72,
                    objectFit: "contain",
                  }}
                />
              ) : null}
              <Typography
                sx={{
                  fontFamily: TOKENS.typography.headingFont,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontSize: "1.1rem",
                }}
              >
                {site?.company?.name || slug}
              </Typography>
              {footerText ? (
                <Typography sx={{ color: TOKENS.colors.textMuted, lineHeight: 1.8, maxWidth: 460 }}>
                  {footerText}
                </Typography>
              ) : null}
              {footerSocial.length ? (
                <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
                  {footerSocial.map((item, idx) => {
                    const Icon = SOCIAL_ICON_MAP[item?.icon?.toLowerCase()] || DEFAULT_SOCIAL_ICON;
                    return (
                      <IconButton
                        key={`${item.icon}-${idx}`}
                        component="a"
                        href={item?.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        sx={{
                          color: TOKENS.colors.text,
                          border: `1px solid ${TOKENS.colors.line}`,
                          backgroundColor: "rgba(255,255,255,0.03)",
                        }}
                      >
                        <Icon fontSize="small" />
                      </IconButton>
                    );
                  })}
                </Stack>
              ) : null}
            </Stack>
          </Grid>
          <Grid item xs={12} lg={8}>
            <Grid container spacing={3}>
              {footerColumns.map((col, idx) => (
                <Grid item xs={12} sm={6} md={Math.max(3, Math.floor(12 / Math.max(1, footerColumns.length)))} key={`footer-col-${idx}`}>
                  <Stack spacing={1.1}>
                    {col.title ? (
                      <Typography
                        sx={{
                          fontFamily: TOKENS.typography.headingFont,
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          color: TOKENS.colors.text,
                        }}
                      >
                        {col.title}
                      </Typography>
                    ) : null}
                    {(col.links || []).map((link, linkIdx) => {
                      const props = resolveLinkProps(link.href || "");
                      const { component, ...rest } = props;
                      return (
                        <MuiLink
                          key={`footer-link-${idx}-${linkIdx}`}
                          component={component || RouterLink}
                          {...rest}
                          underline="hover"
                          sx={{ color: TOKENS.colors.textMuted, textUnderlineOffset: "3px" }}
                        >
                          {link.label || link.href}
                        </MuiLink>
                      );
                    })}
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
        {footerLegal.length ? (
          <>
            <Divider sx={{ my: 3.5, borderColor: TOKENS.colors.line }} />
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }}>
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                {footerLegal.map((link, idx) => {
                  const props = resolveLinkProps(link.href || "");
                  const { component, ...rest } = props;
                  return (
                    <MuiLink
                      key={`legal-${idx}`}
                      component={component || RouterLink}
                      {...rest}
                      underline="hover"
                      sx={{ color: TOKENS.colors.textSoft, fontSize: "0.92rem" }}
                    >
                      {link.label || link.href}
                    </MuiLink>
                  );
                })}
              </Stack>
              {footerConfig?.show_copyright !== false ? (
                <Typography sx={{ color: TOKENS.colors.textSoft, fontSize: "0.88rem" }}>
                  {copyrightText}
                </Typography>
              ) : null}
            </Stack>
          </>
        ) : null}
      </Container>
    </Box>
  );
}

const IndustrialBlueprintModule = {
  family: "industrial-blueprint",
  familyVersion: 1,
  defaultMotionProfile: "mechanical",
  tokens: TOKENS,
  roleRenderers: {
    "hero.primary": IndustrialHero,
    "services.grid": IndustrialServices,
    "social_proof.testimonials": IndustrialSocialProof,
    "social_proof.reviews": IndustrialSocialProof,
    "cta.inline": IndustrialCTA,
  },
  typeRenderers: {
    industrialTrustMarquee: IndustrialTrustMarquee,
    industrialStatsRail: IndustrialStatsRail,
    industrialFeatureSplit: IndustrialFeatureSplit,
    industrialImageStory: IndustrialImageStory,
    industrialServiceSelector: IndustrialServiceSelector,
    industrialProjectShowcase: IndustrialProjectShowcase,
    industrialProcessTimeline: IndustrialProcessTimeline,
    industrialEmergencyBand: IndustrialEmergencyBand,
    industrialServiceArea: IndustrialServiceArea,
    industrialMembershipPlans: IndustrialMembershipPlans,
    industrialGalleryWall: IndustrialGalleryWall,
    industrialBeforeAfter: IndustrialBeforeAfter,
  },
  frame: {
    roleLayoutOverrides: {
      "hero.primary": "full",
      "social_proof.testimonials": "full",
      "social_proof.reviews": "full",
      "cta.inline": "full",
    },
    roleGutterOverrides: {
      "hero.primary": 0,
      "social_proof.testimonials": 0,
      "social_proof.reviews": 0,
      "cta.inline": 0,
    },
  },
  shell: {
    HeaderComponent: IndustrialHeader,
    FooterComponent: IndustrialFooter,
  },
};

export default IndustrialBlueprintModule;
