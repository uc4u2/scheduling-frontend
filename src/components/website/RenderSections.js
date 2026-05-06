// src/components/website/RenderSections.js
import React, { useMemo, useState, useEffect, useRef, memo } from "react";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
  Box, Container, Stack, Typography, Button, Grid, Card, CardContent, CardMedia,
  Divider, Accordion, AccordionSummary, AccordionDetails, Chip, IconButton, Avatar,
  Dialog, Paper
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import EmailIcon from "@mui/icons-material/Email";
import LanguageIcon from "@mui/icons-material/Language";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import VerifiedIcon from "@mui/icons-material/Verified";
import ReplayIcon from "@mui/icons-material/Replay";
import DiamondOutlinedIcon from "@mui/icons-material/DiamondOutlined";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import SpeedIcon from "@mui/icons-material/Speed";
import TuneIcon from "@mui/icons-material/Tune";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import SmartServiceGrid from "./SmartServiceGrid";
import { normalizeInlineHtml } from "../../utils/html";
import { toPlain } from "../../utils/html";
import ContactFormSection from "./ContactFormSection";
import buildImgixUrl from "../../utils/imgix";
import { safeHtml } from "../../utils/safeHtml";
import { clampWebsiteRadius, toWebsiteRadiusPx } from "../../utils/websiteRadius";
// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const WEBSITE_RADIUS_MIN = 2;
const WEBSITE_RADIUS_MAX = 4;
const WEBSITE_RADIUS_FALLBACK = 4;

const websiteRadius = (value, fallback = WEBSITE_RADIUS_FALLBACK) =>
  clampWebsiteRadius(value, {
    min: WEBSITE_RADIUS_MIN,
    max: WEBSITE_RADIUS_MAX,
    fallback,
  });

/** Safely coerce JSON-string or non-array values into arrays */
function toArray(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Render sanitized (inline) HTML in Typography */
function HtmlTypo({ variant = "body1", sx, children, ...rest }) {
  const html = normalizeInlineHtml(String(children ?? ""));
  const alignMatch = /text-align\s*:\s*(left|center|right|justify)/i.exec(html);
  const inferredAlign = alignMatch ? alignMatch[1].toLowerCase() : null;
  const mergedSx =
    inferredAlign && (!sx || sx.textAlign == null)
      ? { ...(sx || {}), textAlign: inferredAlign }
      : sx;
  return (
    <Typography
      variant={variant}
      sx={mergedSx}
      {...rest}
      dangerouslySetInnerHTML={{ __html: safeHtml(html) }}
    />
  );
}

function parseAnimatedStatValue(raw) {
  const text = toPlain(raw ?? "").trim();
  if (!text) return null;
  const match = text.match(/^([^0-9]*)(\d+(?:\.\d+)?)(.*)$/);
  if (!match) return null;
  const [, prefix = "", numText = "", suffix = ""] = match;
  const target = Number(numText);
  if (!Number.isFinite(target)) return null;
  const decimals = (numText.split(".")[1] || "").length;
  return { prefix, suffix, target, decimals };
}

function useInViewOnce() {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    if (seen || typeof window === "undefined") return undefined;
    const node = ref.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [seen]);

  return [ref, seen];
}

function CountUpValue({ value, active, durationMs = 1400 }) {
  const parsed = useMemo(() => parseAnimatedStatValue(value), [value]);
  const [displayValue, setDisplayValue] = useState(() => toPlain(value ?? ""));

  useEffect(() => {
    const finalText = toPlain(value ?? "");
    if (!parsed || !active) {
      setDisplayValue(finalText);
      return undefined;
    }

    let frame = 0;
    let start = 0;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / durationMs, 1);
      const current = parsed.target * progress;
      const formatted =
        parsed.decimals > 0 ? current.toFixed(parsed.decimals) : String(Math.round(current));
      setDisplayValue(`${parsed.prefix}${formatted}${parsed.suffix}`);
      if (progress < 1) {
        frame = window.requestAnimationFrame(step);
      } else {
        setDisplayValue(finalText);
      }
    };

    frame = window.requestAnimationFrame(step);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [active, durationMs, parsed, value]);

  return displayValue;
}

/** Convert schema maxWidth ("full" => false) to MUI Container prop */
function toContainerMax(maxWidth) {
  if (maxWidth === "full" || maxWidth === false) return false;
  if (["xs","sm","md","lg","xl"].includes(maxWidth)) return maxWidth;
  return "lg";
}

/** Page/frame wrapper: boxed vs full-bleed + gutters */
function useSectionFrame({ layout = "boxed", sectionSpacing = 6, defaultGutterX } = {}) {
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up("md"));
  const lgUp = useMediaQuery(theme.breakpoints.up("lg"));
  const resolve = (val) => {
    if (typeof val === "number" || val == null) return val;
    // object form: { xs?, md?, lg? }
    const xs = val.xs ?? 0;
    const md = val.md ?? xs;
    const lg = val.lg ?? md;
    return lgUp ? lg : mdUp ? md : xs;
  };

  const sectionBaseSx = {
    py: { xs: 4, md: 6 },
    '& + &' : {
      mt: { xs: 4, md: 6 },
    },
  };

  const frame = (children, { bleedLeft, bleedRight, gutterX, layoutOverride } = {}) => {
    const gx = typeof gutterX === "number" ? gutterX : resolve(defaultGutterX);
    const effLayout = layoutOverride ?? layout;

    if (effLayout === "full") {
      return (
        <Box
          sx={{
            px: gx != null ? `${gx}px` : 0,
            ...(bleedLeft ? { pl: 0 } : {}),
            ...(bleedRight ? { pr: 0 } : {}),
          }}
        >
          {children}
        </Box>
      );
    }

    return (
      <Container maxWidth="lg" disableGutters={gx === 0}>
        <Box sx={{ px: gx != null ? `${gx}px` : 0 }}>{children}</Box>
      </Container>
    );
  };

  return { sectionBaseSx, frame };
}


// ---------- Page style -> CSS variables ----------
function pageStyleToVars(ps = {}) {
  const has = (v) => v !== undefined && v !== null && v !== "";
  return {
    // text + fonts
    "--page-heading-color": has(ps.headingColor) ? ps.headingColor : undefined,
    "--page-body-color":    has(ps.bodyColor)    ? ps.bodyColor    : undefined,
    "--page-link-color":    has(ps.linkColor)    ? ps.linkColor    : undefined,
    "--page-heading-font":  has(ps.headingFont)  ? ps.headingFont  : undefined,
    "--page-body-font":     has(ps.bodyFont)     ? ps.bodyFont     : undefined,

    // hero heading effect
    "--page-hero-heading-shadow":
      has(ps.heroHeadingShadow) ? ps.heroHeadingShadow : undefined,

    // cards
    "--page-card-bg":       has(ps.cardBg)       ? ps.cardBg       : undefined, // rgba(...) supported
    "--page-card-radius":   ps.cardRadius != null ? toWebsiteRadiusPx(ps.cardRadius) : undefined,
    "--page-card-shadow":   has(ps.cardShadow)   ? ps.cardShadow   : undefined,
    "--page-card-blur":     ps.cardBlur != null  ? `${ps.cardBlur}px` : undefined,

    // buttons
    "--page-btn-bg":        has(ps.btnBg)        ? ps.btnBg        : undefined,
    "--page-btn-color":     has(ps.btnColor)     ? ps.btnColor     : undefined,
    "--page-btn-radius":    ps.btnRadius != null ? toWebsiteRadiusPx(ps.btnRadius) : undefined,

    // secondary background (accent band)
    "--page-secondary-bg":  has(ps.secondaryBackground) ? ps.secondaryBackground : undefined,
  };
}

// ------- Page background helpers -------
function hexToRgba(hex, alpha = 1) {
  if (!hex) return undefined;
  const h = String(hex).replace("#", "");
  if (![3, 4, 6, 8].includes(h.length)) return hex; // pass through non-hex values
  const expand = (c) => (c.length === 1 ? c + c : c);
  const r = parseInt(expand(h.slice(0, h.length >= 6 ? 2 : 1)), 16);
  const g = parseInt(expand(h.slice(h.length >= 6 ? 2 : 1, h.length >= 6 ? 4 : 2)), 16);
  const b = parseInt(expand(h.slice(h.length >= 6 ? 4 : 2, h.length >= 6 ? 6 : 3)), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Extract first pageStyle section (if any) and return [styleProps, filteredSections] */
function pickPageStyle(sections) {
  let style = null;
  const filtered = [];
  for (const s of (Array.isArray(sections) ? sections : [])) {
    if (!style && s?.type === "pageStyle") {
      style = s.props || {};
      continue; // do NOT render this section
    }
    filtered.push(s);
  }
  return [style || {}, filtered];
}

/** Helper: return rgba string from a HEX or CSS color + opacity */
function colorWithOpacity(base, op) {
  if (!base) return undefined;
  const o = typeof op === "number" ? Math.max(0, Math.min(1, op)) : 1;
  const hexMatch = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(base).trim());
  if (hexMatch) {
    const h = hexMatch[1].length === 3
      ? hexMatch[1].split("").map((c) => c + c).join("")
      : hexMatch[1];
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${o})`;
  }
  // For non-hex (e.g., rgb/hsl), if opacity is 1, return as-is.
  if (o === 1) return base;
  // Otherwise best-effort fallback.
  return base;
}

const CTA_STYLE_SELECTORS = [
  "pricing-logo-cta",
  "logo-cloud-card-cta",
  "zig-cta",
  ".cta",
];

function normalizeCtaColorToken(prop, value) {
  if (typeof value !== "string" || !value.includes("var(--page-heading-color")) {
    return value;
  }
  if (prop === "color") {
    return "var(--page-btn-color, #fff)";
  }
  return value.replace(
    /var\(--page-heading-color[^)]*\)/g,
    "var(--page-btn-bg, var(--sched-primary))"
  );
}

function isRadiusKey(key) {
  return (
    key === "borderRadius" ||
    key === "borderTopLeftRadius" ||
    key === "borderTopRightRadius" ||
    key === "borderBottomLeftRadius" ||
    key === "borderBottomRightRadius"
  );
}

function normalizeRadiusToken(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return toWebsiteRadiusPx(value);
  }
  return value;
}

function normalizeSectionSxForButtons(input, inCtaSelector = false) {
  if (Array.isArray(input)) {
    return input.map((entry) => normalizeSectionSxForButtons(entry, inCtaSelector));
  }
  if (!input || typeof input !== "object") return input;

  const out = {};
  Object.entries(input).forEach(([key, value]) => {
    const keyIsSelector =
      typeof key === "string" &&
      CTA_STYLE_SELECTORS.some((needle) => key.includes(needle));
    const nextInCtaSelector = inCtaSelector || keyIsSelector;

    if (nextInCtaSelector && typeof value === "string") {
      out[key] = normalizeCtaColorToken(key, value);
      return;
    }
    if (isRadiusKey(key)) {
      out[key] = normalizeRadiusToken(value);
      return;
    }
    out[key] = normalizeSectionSxForButtons(value, nextInCtaSelector);
  });
  return out;
}

// -----------------------------------------------------------------------------
// Motion helpers
// -----------------------------------------------------------------------------
function usePrefersReducedMotion() {
  const [prefers, setPrefers] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const onChange = () => setPrefers(!!mq?.matches);
    onChange();
    mq?.addEventListener?.("change", onChange);
    return () => mq?.removeEventListener?.("change", onChange);
  }, []);
  return prefers;
}

function useAutoplay(len, interval = 4500, disabled = false) {
  const [index, setIndex] = React.useState(0);
  const pauseRef = React.useRef(false);
  React.useEffect(() => {
    if (disabled || len <= 1 || pauseRef.current) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % len), interval);
    return () => clearInterval(id);
  }, [len, interval, disabled, index]);
  const setPaused = (v) => { pauseRef.current = v; };
  return [index, setIndex, setPaused];
}

const InteractiveTiltMedia = ({ src, alt, sx }) => {
  const ref = React.useRef(null);
  const prefersReduced = usePrefersReducedMotion();
  const rafRef = React.useRef(null);
  const hoverableRef = React.useRef(true);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia?.("(hover: none)");
    const update = () => {
      hoverableRef.current = !(mq?.matches);
    };
    update();
    mq?.addEventListener?.("change", update);
    return () => mq?.removeEventListener?.("change", update);
  }, []);

  const applyTransform = (rx, ry, scale, xPct, yPct) => {
    if (!ref.current) return;
    const el = ref.current;
    el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px) scale(${scale})`;
    if (xPct != null && yPct != null) {
      el.style.setProperty("--shine-x", `${xPct}%`);
      el.style.setProperty("--shine-y", `${yPct}%`);
    }
  };

  const handlePointerMove = (event) => {
    if (prefersReduced || !hoverableRef.current) return;
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const xPct = (x / rect.width) * 100;
    const yPct = (y / rect.height) * 100;
    const dx = x - rect.width / 2;
    const dy = y - rect.height / 2;
    const ry = clamp((dx / rect.width) * 8, -6, 6);
    const rx = clamp((dy / rect.height) * -8, -6, 6);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      applyTransform(rx, ry, 1.02, xPct, yPct);
    });
  };

  const handlePointerLeave = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    applyTransform(0, 0, 1, 50, 50);
  };

  const handlePointerEnter = () => {
    if (prefersReduced || !hoverableRef.current) {
      applyTransform(0, 0, 1.02, 50, 50);
    }
  };

  return (
    <Box
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerEnter={handlePointerEnter}
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: websiteRadius(2),
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.28)",
        boxShadow: "0 18px 40px rgba(17,24,39,0.18)",
        transformStyle: "preserve-3d",
        willChange: "transform",
        transition: prefersReduced ? "transform 180ms ease" : "transform 80ms ease",
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 0,
          opacity: 0,
          background:
            "radial-gradient(320px circle at var(--shine-x, 50%) var(--shine-y, 50%), rgba(255,255,255,0.35), rgba(255,255,255,0) 60%)",
          transition: "opacity 120ms ease",
          pointerEvents: "none",
        },
        "&:hover::after": {
          opacity: prefersReduced ? 0.12 : 0.22,
        },
        ...(sx || {}),
      }}
    >
      {src && (
        <Box
          component="img"
          src={src}
          alt={alt || ""}
          loading="lazy"
          sx={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "translateZ(0)",
          }}
        />
      )}
    </Box>
  );
};

const Section = ({ children, sx, id }) => (
  <Box component="section" id={id} sx={{ ...(sx || {}) }}>
    {children}
  </Box>
);

// -----------------------------------------------------------------------------
// Blocks
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Blocks
// -----------------------------------------------------------------------------
// --- drop-in replacement (RenderSections.js) ---

// RenderSections.js
// ...
const Hero = ({
  eyebrow,
  heading,
  subheading,
  ctaText,
  ctaLink,
  secondaryCtaText,
  secondaryCtaLink,
  backgroundUrl,
  image,                     // back-compat
  backgroundVideo,
  overlay = 0.35,
  overlayGradient,
  overlayColor = "#000000",  // NEW: allow white or any tint
  backgroundPosition = "center",
  backgroundPositionY,
  align = "center",
  heroHeight = 0,
  safeTop = true,
  contentMaxWidth = "lg",
  gutterX,
  brightness = 1.0,          // NEW: 1.0 = original, >1 = brighter, <1 = darker
}) => {
  const bgUrl = backgroundUrl || image;
  const textAlign =
    align === "right" ? "right" : align === "left" ? "left" : "center";
  const normalizedFocusY = Number.isFinite(Number(backgroundPositionY))
    ? Math.max(0, Math.min(100, Number(backgroundPositionY)))
    : null;
  const resolvedBackgroundPosition = (() => {
    if (normalizedFocusY == null) return backgroundPosition;
    const raw = String(backgroundPosition || "center").toLowerCase();
    const horizontal =
      raw === "left" || raw === "right" ? raw : "center";
    return `${horizontal} ${normalizedFocusY}%`;
  })();

  const minH =
    typeof heroHeight === "number" && heroHeight > 0
      ? `${heroHeight}vh`
      : undefined;

  const heroContent = (
    <HeroInner
      textAlign={textAlign}
      eyebrow={eyebrow}
      heading={heading}
      subheading={subheading}
      ctaText={ctaText}
      ctaLink={ctaLink}
      secondaryCtaText={secondaryCtaText}
      secondaryCtaLink={secondaryCtaLink}
    />
  );

  const innerMax =
    typeof contentMaxWidth === "number"
      ? contentMaxWidth
      : contentMaxWidth === false || contentMaxWidth === "full"
      ? false
      : contentMaxWidth || "lg";

  return (
    <Box
      sx={{
        position: "relative",
        borderRadius: { xs: 0, md: `${websiteRadius(3)}px` },
        overflow: "hidden",
        minHeight: minH || { xs: 380, md: 560 },
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color:
          "var(--page-hero-text-color, var(--page-body-color, inherit))",
        pt: safeTop
          ? "calc(env(safe-area-inset-top) + var(--site-header-overlap, 0px))"
          : 0,
      }}
    >
      {!!bgUrl && (
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${bgUrl})`,
            backgroundSize: "cover",
            backgroundPosition: resolvedBackgroundPosition,
            // REMOVED the hidden darkening; use explicit brightness instead
            ...(brightness && brightness !== 1
              ? { filter: `brightness(${brightness})` }
              : {}),
          }}
        />
      )}

      {!!backgroundVideo && (
        <Box aria-hidden sx={{ position: "absolute", inset: 0, lineHeight: 0 }}>
          <video
            src={backgroundVideo}
            autoPlay
            muted
            loop
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Box>
      )}

      {/* Overlay tint (can be white to lighten) */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: colorWithOpacity(overlayColor, clamp(overlay, 0, 1)),
          pointerEvents: "none",
        }}
      />

      {/* Optional gradient polish */}
      {overlayGradient && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: overlayGradient,
            pointerEvents: "none",
          }}
        />
      )}

      {innerMax === false ? (
        <Box sx={{ position: "relative", zIndex: 2, width: "100%", px: gutterX != null ? `${gutterX}px` : 2 }}>
          {heroContent}
        </Box>
      ) : (
        <Container maxWidth={innerMax} sx={{ position: "relative", zIndex: 2 }}>
          <Box sx={{ px: gutterX != null ? `${gutterX}px` : 0 }}>
            {heroContent}
          </Box>
        </Container>
      )}
    </Box>
  );
};


const HeroInner = ({
  textAlign,
  eyebrow,
  heading,
  subheading,
  ctaText,
  ctaLink,
  secondaryCtaText,
  secondaryCtaLink,
}) => (
  <Stack
    spacing={2}
    alignItems={
      textAlign === "center" ? "center" : textAlign === "right" ? "flex-end" : "flex-start"
    }
    sx={{ textAlign }}
  >
    {eyebrow && (
      <HtmlTypo
        variant="overline"
        sx={{
          letterSpacing: ".12em",
          opacity: 0.9,
          // eyebrow inherits the hero text color by default
          color:
            "var(--page-hero-eyebrow-color, var(--page-hero-text-color, inherit))",
          fontFamily:
            "var(--page-hero-heading-font, var(--page-heading-font, inherit))",
        }}
      >
        {eyebrow}
      </HtmlTypo>
    )}

    {heading && (
      <HtmlTypo
        variant="h2"
        sx={{
          // let managers control heading color/font via Page Style
          color:
            "var(--page-hero-heading-color, var(--page-heading-color, inherit))",
          fontFamily:
            "var(--page-hero-heading-font, var(--page-heading-font, inherit))",
          fontWeight: 800,
          letterSpacing: "-0.01em",
          textShadow: "var(--page-hero-heading-shadow, 0 2px 24px rgba(0,0,0,.25))",
        }}
      >
        {heading}
      </HtmlTypo>
    )}

    {subheading && (
      <HtmlTypo
        variant="h6"
        sx={{
          // previously hard-coded grey; now inherit hero text color
          color:
            "var(--page-hero-text-color, var(--page-body-color, inherit))",
          maxWidth: 900,
          fontFamily:
            "var(--page-hero-body-font, var(--page-body-font, inherit))",
        }}
      >
        {subheading}
      </HtmlTypo>
    )}

    {(ctaText || secondaryCtaText) && (
      <Stack
        direction="row"
        spacing={1}
        sx={{ width: textAlign === "center" ? "auto" : "fit-content", ml: textAlign === "right" ? "auto" : 0 }}
      >
        {ctaText && (
          <Button aria-label={toPlain(ctaText)} href={ctaLink || "#"} size="large" variant="contained">
            {toPlain(ctaText)}
          </Button>
        )}
        {secondaryCtaText && (
          <Button aria-label={toPlain(secondaryCtaText)} href={secondaryCtaLink || "#"} size="large" variant="outlined">
            {toPlain(secondaryCtaText)}
          </Button>
        )}
      </Stack>
    )}
  </Stack>
);

function useTimedIndex(length, intervalMs = 5000, autoplay = true) {
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    if (!autoplay || !length) return;
    const id = setInterval(() => setI((x) => (x + 1) % length), Math.max(1000, intervalMs));
    return () => clearInterval(id);
  }, [length, intervalMs, autoplay]);
  return [i, setI];
}

const HeroCarousel = ({
  slides = [],
  autoplay = true,
  intervalMs = 5000,
  align = "center",
  contentMaxWidth = "lg",
  heroHeight = 0,
  safeTop = true,
  overlay = 0.35,
  overlayGradient,
  overlayColor = "#000000",
  brightness = 1.0,
}) => {
  const list = toArray(slides);
  const [index, setIndex] = useTimedIndex(list.length, intervalMs, autoplay);
  const textAlign = align === "right" ? "right" : align === "left" ? "left" : "center";
  const minH = typeof heroHeight === "number" && heroHeight > 0 ? `${heroHeight}vh` : undefined;
  const innerMax = typeof contentMaxWidth === "number" ? contentMaxWidth : (contentMaxWidth === false || contentMaxWidth === "full" ? false : contentMaxWidth || "lg");

  const current = list[index] || {};
  return (
    <Box
      sx={{
        position: "relative",
        borderRadius: { xs: 0, md: `${websiteRadius(3)}px` },
        overflow: "hidden",
        minHeight: minH || { xs: 380, md: 560 },
        color: "var(--page-hero-text-color, var(--page-body-color, inherit))",
        pt: safeTop
          ? "calc(env(safe-area-inset-top) + var(--site-header-overlap, 0px))"
          : 0,
      }}
    >
      {list.map((s, i) => (
        <Box key={i} aria-hidden={i !== index} sx={{ position: "absolute", inset: 0, opacity: i === index ? 1 : 0, transition: "opacity .6s ease", willChange: "opacity", backfaceVisibility: "hidden", transform: "translateZ(0)" }}>
          {!!s.image && (
            <Box aria-hidden sx={{ position: "absolute", inset: 0, backgroundImage: `url(${s.image})`, backgroundSize: "cover", backgroundPosition: s.backgroundPosition || "center", pointerEvents: "none", ...(brightness && brightness !== 1 ? { filter: `brightness(${brightness})` } : {}) }} />
          )}
          {!!s.backgroundVideo && (
            <Box aria-hidden sx={{ position: "absolute", inset: 0, lineHeight: 0 }}>
              <video
                src={s.backgroundVideo}
                autoPlay
                muted
                loop
                playsInline
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Box>
          )}
          <Box sx={{ position: "absolute", inset: 0, background: colorWithOpacity(overlayColor, clamp(overlay, 0, 1)), pointerEvents: "none" }} />
          {overlayGradient && <Box sx={{ position: "absolute", inset: 0, background: overlayGradient, pointerEvents: "none" }} />}
        </Box>
      ))}

      {innerMax === false ? (
        <Box sx={{ position: "absolute", inset: 0, zIndex: 2, width: "100%", px: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <HeroInner textAlign={textAlign} eyebrow={current.eyebrow} heading={current.heading} subheading={current.subheading} ctaText={current.ctaText} ctaLink={current.ctaLink} secondaryCtaText={current.secondaryCtaText} secondaryCtaLink={current.secondaryCtaLink} />
        </Box>
      ) : (
        <Container maxWidth={innerMax} sx={{ position: "absolute", inset: 0, zIndex: 2, display: "flex", alignItems: "center" }}>
          <HeroInner textAlign={textAlign} eyebrow={current.eyebrow} heading={current.heading} subheading={current.subheading} ctaText={current.ctaText} ctaLink={current.ctaLink} secondaryCtaText={current.secondaryCtaText} secondaryCtaLink={current.secondaryCtaLink} />
        </Container>
      )}

      {list.length > 1 && (
        <Stack direction="row" spacing={1} justifyContent="center" sx={{ position: "absolute", bottom: 16, left: 0, right: 0, zIndex: 3 }}>
          {list.map((_, i) => (
            <Box key={i} role="button" aria-label={`Go to slide ${i + 1}`} aria-current={i === index} tabIndex={0} onClick={() => setIndex(i)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setIndex(i)} sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: i === index ? "text.primary" : "divider", cursor: "pointer", outlineOffset: 2 }} />
          ))}
        </Stack>
      )}
    </Box>
  );
};

const HeroSplit = ({ heading, subheading, ctaText, ctaLink, image, titleAlign, maxWidth }) => (
  <Container maxWidth={toContainerMax(maxWidth)}>
    <Grid container spacing={4} alignItems="center">
      <Grid item xs={12} md={6}>
        {heading && (
          <HtmlTypo
            variant="h3"
            sx={{
              fontWeight: 800,
              mb: 1,
              textAlign: titleAlign || "left",
              color: "var(--page-heading-color, currentColor)"
            }}
          >
            {heading}
          </HtmlTypo>
        )}
        {subheading && (
          <HtmlTypo
            variant="body1"
            sx={{
              mb: 2,
              color: "var(--page-body-color, text.secondary)",
              textAlign: titleAlign || "left"
            }}
          >
            {subheading}
          </HtmlTypo>
        )}
        {ctaText && (
          <Button aria-label={toPlain(ctaText)} href={ctaLink || "#"} variant="contained">
            {toPlain(ctaText)}
          </Button>
        )}
      </Grid>
      <Grid item xs={12} md={6}>
        <Box
          className="split-image"
          sx={{
            borderRadius: websiteRadius(4),
            overflow: "hidden",
            boxShadow: (t) => t.shadows[4],
            lineHeight: 0
          }}
        >
          {!!image && (
            <InteractiveTiltMedia
              src={image}
              alt=""
              sx={{
                borderRadius: "inherit",
                border: "none",
                boxShadow: "none"
              }}
            />
          )}
        </Box>
      </Grid>
    </Grid>
  </Container>
);

const FeatureZigzag = ({
  eyebrow,
  title,
  supportingText,
  titleAlign = "left",
  maxWidth,
  items = []
}) => {
  const list = toArray(items);
  const resolvedMax = toContainerMax(maxWidth);
  const cardRadius = 0;
  const hasHeader = eyebrow || title || supportingText;
  if (!hasHeader && list.length === 0) return null;

  const renderRow = (item, idx) => {
    if (!item) return null;
    const align = item.align === "right" ? "right" : "left";
    const rowClass = `zig-row${align === "right" ? " right" : ""}`;
    const imageSrc = item.imageUrl || item.image;
    const imageAlt = item.imageAlt || "";

    const textBlock = (
      <Box
        key="text"
        className="zig-text"
        sx={{
          flex: "1 1 0%",
          minWidth: 0,
          width: { xs: "100%", md: "50%" },
          maxWidth: "none",
          mx: 0
        }}
      >
        {item.eyebrow && (
          <HtmlTypo
            variant="overline"
            sx={{
              letterSpacing: ".2em",
              textTransform: "uppercase",
              mb: 1,
              fontWeight: 600,
              color: "var(--page-body-color, currentColor)"
            }}
          >
            {item.eyebrow}
          </HtmlTypo>
        )}
        {item.title && (
          <HtmlTypo
            variant="h4"
            sx={{ fontWeight: 800, mb: 1, color: "var(--page-heading-color, currentColor)" }}
          >
            {item.title}
          </HtmlTypo>
        )}
        {item.body && (
          <HtmlTypo variant="body1" sx={{ color: "var(--page-body-color, text.secondary)" }}>
            {item.body}
          </HtmlTypo>
        )}
        {item.ctaText && (
          <Button
            className="zig-cta"
            href={item.ctaLink || "#"}
            variant="contained"
            size="large"
            sx={{ mt: 2 }}
          >
            {toPlain(item.ctaText)}
          </Button>
        )}
      </Box>
    );

    const imageBlock = (
      <Box
        key="image"
        className="zig-img"
        sx={{
          flex: "1 1 0%",
          width: { xs: "100%", md: "50%" },
          maxWidth: "none",
          mx: 0,
          borderRadius: cardRadius,
          overflow: "hidden",
          boxShadow: "none",
          minHeight: { xs: 260, md: 360 },
          aspectRatio: { xs: "4 / 3", md: "16 / 9" },
          display: "flex"
        }}
      >
        {imageSrc && (
          <InteractiveTiltMedia
            src={imageSrc}
            alt={imageAlt}
            sx={{
              borderRadius: websiteRadius(2),
              border: "1px solid rgba(255,255,255,0.24)",
              boxShadow: "0 16px 32px rgba(17,24,39,0.16)"
            }}
          />
        )}
      </Box>
    );

    return (
      <Box
        key={idx}
        className={rowClass}
        sx={{
          display: "flex",
          width: "100%",
          maxWidth: { xs: "100%", md: 980 },
          mx: "auto",
          flexDirection: {
            xs: "column",
            md: align === "right" ? "row-reverse" : "row"
          },
          alignItems: "center",
          justifyContent: "center",
          gap: { xs: 1, md: 1.5 },
        }}
      >
        {textBlock}
        {imageBlock}
      </Box>
    );
  };

  return (
    <Container maxWidth={resolvedMax} disableGutters={resolvedMax === false}>
      <Stack spacing={{ xs: 4, md: 5 }}>
        {hasHeader && (
          <Stack spacing={1} sx={{ textAlign: titleAlign }}>
            {eyebrow && (
              <HtmlTypo
                variant="overline"
                sx={{
                  letterSpacing: ".25em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  color: "var(--page-body-color, currentColor)"
                }}
              >
                {eyebrow}
              </HtmlTypo>
            )}
            {title && (
              <HtmlTypo
                variant="h3"
                sx={{ fontWeight: 800, color: "var(--page-heading-color, currentColor)" }}
              >
                {title}
              </HtmlTypo>
            )}
            {supportingText && (
              <HtmlTypo
                variant="body1"
                sx={{ color: "var(--page-body-color, text.secondary)" }}
              >
                {supportingText}
              </HtmlTypo>
            )}
          </Stack>
        )}
        {list.map((item, idx) => renderRow(item, idx))}
      </Stack>
    </Container>
  );
};

const FeatureZigzagModern = ({
  eyebrow,
  title,
  supportingText,
  titleAlign = "left",
  maxWidth,
  items = []
}) => {
  const list = toArray(items);
  const resolvedMax = toContainerMax(maxWidth);
  const hasHeader = eyebrow || title || supportingText;
  if (!hasHeader && list.length === 0) return null;

  const renderRow = (item, idx) => {
    if (!item) return null;
    const align = item.align === "right" ? "right" : "left";
    const imageSrc = item.imageUrl || item.image;
    const imageAlt = item.imageAlt || "";

    const textBlock = (
      <Box
        key="text"
        sx={{
          order: { xs: 2, md: align === "right" ? 2 : 1 },
          justifySelf: "center",
          width: "100%",
          maxWidth: { xs: "100%", md: 640 },
          backgroundColor: "transparent",
          border: "none",
          borderRadius: 0,
          p: { xs: 2.5, md: 3.5 },
          boxShadow: "none"
        }}
      >
        {item.eyebrow && (
          <HtmlTypo
            variant="overline"
            sx={{ letterSpacing: ".2em", textTransform: "uppercase", mb: 1, fontWeight: 600 }}
          >
            {item.eyebrow}
          </HtmlTypo>
        )}
        {item.title && (
          <HtmlTypo variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            {item.title}
          </HtmlTypo>
        )}
        {item.body && (
          <HtmlTypo variant="body1" sx={{ color: "var(--page-body-color, text.secondary)" }}>
            {item.body}
          </HtmlTypo>
        )}
        {item.ctaText && (
          <Button
            href={item.ctaLink || "#"}
            variant="contained"
            size="large"
            sx={{ mt: 2 }}
          >
            {toPlain(item.ctaText)}
          </Button>
        )}
      </Box>
    );

    const imageBlock = (
      <Box
        key="image"
        sx={{
          order: { xs: 1, md: align === "right" ? 1 : 2 },
          justifySelf: "center",
          width: "100%",
          maxWidth: { xs: "100%", md: 700 },
          borderRadius: 0,
          overflow: "hidden",
          aspectRatio: { xs: "4 / 3", md: "5 / 4" },
          boxShadow: "none",
          backgroundColor: "transparent"
        }}
      >
        {imageSrc && (
          <InteractiveTiltMedia
            src={imageSrc}
            alt={imageAlt}
            sx={{
              borderRadius: websiteRadius(2),
              border: "1px solid rgba(255,255,255,0.24)",
              boxShadow: "0 16px 32px rgba(17,24,39,0.16)"
            }}
          />
        )}
      </Box>
    );

    return (
      <Box
        key={idx}
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(2, minmax(0, 1fr))"
          },
          gap: { xs: 2.5, md: 8 },
          alignItems: "center"
        }}
      >
        {textBlock}
        {imageBlock}
      </Box>
    );
  };

  return (
    <Container maxWidth={resolvedMax} disableGutters={resolvedMax === false}>
      <Stack spacing={{ xs: 4, md: 5 }}>
        {hasHeader && (
          <Stack spacing={1} sx={{ textAlign: titleAlign }}>
            {eyebrow && (
              <HtmlTypo
                variant="overline"
                sx={{
                  letterSpacing: ".25em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  color: "var(--page-body-color, currentColor)"
                }}
              >
                {eyebrow}
              </HtmlTypo>
            )}
            {title && (
              <HtmlTypo variant="h3" sx={{ fontWeight: 800 }}>
                {title}
              </HtmlTypo>
            )}
            {supportingText && (
              <HtmlTypo
                variant="body1"
                sx={{ color: "var(--page-body-color, text.secondary)" }}
              >
                {supportingText}
              </HtmlTypo>
            )}
          </Stack>
        )}
        {list.map((item, idx) => renderRow(item, idx))}
      </Stack>
    </Container>
  );
};

const ServiceGrid = ({
  title,
  subtitle,
  items = [],
  ctaText,
  ctaLink,
  titleAlign,
  maxWidth,
  titleColor,
  subtitleColor,
  hoverLift,
  imageHoverScale,
  lightboxEnabled = true,
  followSiteTheme = true,
}) => {
  const align = titleAlign || "center";
  const themeDriven = followSiteTheme !== false;
  const resolvedTitleColor = themeDriven
    ? "var(--page-heading-color, currentColor)"
    : titleColor;
  const resolvedSubtitleColor = themeDriven
    ? "var(--page-body-color, text.secondary)"
    : subtitleColor;
  const list = toArray(items);
  const imageItems = [];
  const imageIndexMap = {};
  list.forEach((item, idx) => {
    if (!item || !item.image) return;
    imageIndexMap[idx] = imageItems.length;
    imageItems.push({
      src: item.image,
      alt: item.imageAlt || item.name || ""
    });
  });
  const [activeIndex, setActiveIndex] = useState(null);
  const lightboxOn = !!lightboxEnabled && imageItems.length > 0;
  const openLightbox = (idx) => {
    if (!lightboxOn) return;
    const mapped = imageIndexMap[idx];
    if (mapped === undefined) return;
    setActiveIndex(mapped);
  };
  const closeLightbox = () => setActiveIndex(null);
  const currentItem = activeIndex != null ? imageItems[activeIndex] : null;
  const currentFull = currentItem?.src ? buildImgixUrl(currentItem.src, { w: 2000, fit: "max" }) : "";
  const goPrev = () => {
    if (activeIndex == null) return;
    if (activeIndex === 0) {
      setActiveIndex(imageItems.length - 1);
    } else {
      setActiveIndex(activeIndex - 1);
    }
  };
  const goNext = () => {
    if (activeIndex == null) return;
    if (activeIndex === imageItems.length - 1) {
      setActiveIndex(0);
    } else {
      setActiveIndex(activeIndex + 1);
    }
  };
  return (
    <Container maxWidth={toContainerMax(maxWidth)}>
      {title && (
        <HtmlTypo
          variant="h4"
          sx={{
            mb: 2,
            fontWeight: 800,
            textAlign: align,
            ...(resolvedTitleColor ? { color: resolvedTitleColor } : {}),
          }}
        >
          {title}
        </HtmlTypo>
      )}
      {subtitle && (
        <HtmlTypo
          variant="body1"
          sx={{
            mb: 2,
            color: resolvedSubtitleColor || "text.secondary",
            textAlign: align,
          }}
        >
          {subtitle}
        </HtmlTypo>
      )}
      <Grid container spacing={2} justifyContent="center">
        {list.map((s, i) => {
          const bullets = toArray(s.bullets);
          const chips = toArray(s.chips);
          const cardHref = s.link || s.href || s.ctaLink;
          const CardWrapper = cardHref ? Box : React.Fragment;
          const cardWrapperProps = cardHref
            ? {
                component: "a",
                href: cardHref,
                sx: { textDecoration: "none", color: "inherit", display: "block", height: "100%" }
              }
            : {};
          return (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <CardWrapper {...cardWrapperProps}>
                <Card
                  sx={{
                    height: "100%",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    ...(hoverLift
                      ? {
                          "&:hover": {
                            transform: "translateY(-4px)",
                            boxShadow: "0 18px 36px rgba(15,23,42,0.18)",
                          },
                          "&:hover .service-grid-image": {
                            transform: `scale(${Number(imageHoverScale) > 0 ? imageHoverScale : 1.04})`,
                          },
                        }
                      : {}),
                  }}
                >
                  {s.image && (
                    <Box
                      role={lightboxOn ? "button" : undefined}
                      onClick={(event) => {
                        if (!lightboxOn) return;
                        event.preventDefault();
                        event.stopPropagation();
                        openLightbox(i);
                      }}
                      sx={{
                        overflow: "hidden",
                        cursor: lightboxOn ? "pointer" : "default"
                      }}
                    >
                      <CardMedia
                        component="img"
                        height="160"
                        image={buildImgixUrl(s.image, { w: 900, fit: "crop" })}
                        alt=""
                        loading="lazy"
                        className="service-grid-image"
                        sx={{
                          transition: "transform 0.25s ease",
                          transform: "scale(1)",
                        }}
                      />
                    </Box>
                  )}
                  <CardContent sx={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <Typography fontWeight={700} sx={{ width: "100%", textAlign: "center" }}>{toPlain(s.name)}</Typography>
                    {s.description && (
                      <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-line", width: "100%", textAlign: "center" }}>
                        {toPlain(s.description)}
                      </Typography>
                    )}
                    {(s.price || s.meta) && (
                      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", justifyContent: "center" }}>
                        {s.price && <Chip label={toPlain(s.price)} />}
                        {s.meta && <Chip variant="outlined" label={toPlain(s.meta)} />}
                      </Stack>
                    )}
                    {!!bullets.length && (
                      <Box
                        component="ul"
                        sx={{
                          m: 0,
                          mt: 2,
                          p: 0,
                          listStyle: "none",
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                          color: "text.secondary",
                          fontSize: "0.95rem",
                          alignItems: "center",
                          textAlign: "center",
                        }}
                      >
                        {bullets.map((bullet, idx) => (
                          <Typography
                            component="li"
                            key={idx}
                            sx={{
                              position: "relative",
                              pl: 2,
                              '&::before': {
                                content: '""',
                                position: "absolute",
                                left: 0,
                                top: "0.65em",
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                backgroundColor: "primary.main",
                                opacity: 0.8,
                                transform: "translateY(-50%)",
                              },
                            }}
                          >
                            {toPlain(bullet)}
                          </Typography>
                        ))}
                      </Box>
                    )}
                    {!!chips.length && (
                      <Stack direction="row" spacing={0.75} flexWrap="wrap" rowGap={1} sx={{ mt: 2, justifyContent: "center" }}>
                        {chips.map((chip, idx) => (
                          <Chip key={idx} variant="outlined" size="small" label={toPlain(chip)} />
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </CardWrapper>
            </Grid>
          );
        })}
      </Grid>
      {ctaText && (
        <Stack alignItems="center" sx={{ mt: 3 }}>
          <Button href={ctaLink || "#"} variant="contained">
            {toPlain(ctaText)}
          </Button>
        </Stack>
      )}
      <Dialog
        open={activeIndex != null}
        onClose={(event, reason) => {
          if (reason === "backdropClick") return;
          closeLightbox();
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "transparent",
            boxShadow: "none",
            overflow: "visible",
          },
        }}
      >
        {currentFull && (
          <Box sx={{ position: "relative", display: "flex", justifyContent: "center" }}>
            <IconButton
              onClick={closeLightbox}
              sx={{
                position: "absolute",
                top: -48,
                right: 0,
                color: "#fff",
                backgroundColor: "rgba(0,0,0,0.5)",
                "&:hover": { backgroundColor: "rgba(0,0,0,0.65)" },
              }}
            >
              <CloseIcon />
            </IconButton>
            {imageItems.length > 1 && (
              <>
                <IconButton
                  onClick={goPrev}
                  sx={{
                    position: "absolute",
                    left: -56,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#fff",
                    backgroundColor: "rgba(0,0,0,0.5)",
                    "&:hover": { backgroundColor: "rgba(0,0,0,0.65)" },
                  }}
                >
                  <ArrowBackIosNewIcon />
                </IconButton>
                <IconButton
                  onClick={goNext}
                  sx={{
                    position: "absolute",
                    right: -56,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#fff",
                    backgroundColor: "rgba(0,0,0,0.5)",
                    "&:hover": { backgroundColor: "rgba(0,0,0,0.65)" },
                  }}
                >
                  <ArrowForwardIosIcon />
                </IconButton>
              </>
            )}
            <Box
              component="img"
              src={currentFull}
              alt={currentItem?.alt || ""}
              sx={{
                maxWidth: "100%",
                maxHeight: "80vh",
                borderRadius: websiteRadius(2),
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            />
          </Box>
        )}
      </Dialog>
    </Container>
  );
};

const ServiceHoverSlider = ({
  title,
  subtitle,
  items = [],
  titleAlign = "center",
  maxWidth = "full",
  cardsDesktop = 4,
  cardsTablet = 2,
  cardsMobile = 1,
  gap = 12,
  imageHeight = 392,
  zoomScale = 1.08,
  showArrows = true,
  showDots = true,
}) => {
  const entries = toArray(items)
    .map((item) => ({
      title: toPlain(item?.title ?? item?.name ?? ""),
      image: item?.image || item?.imageUrl || "",
      link: item?.link || item?.href || item?.ctaLink || "",
    }))
    .filter((item) => item.title || item.image);

  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up("md"));
  const smUp = useMediaQuery(theme.breakpoints.up("sm"));
  const reduced = usePrefersReducedMotion();

  const perDesktop = clamp(Number(cardsDesktop) || 4, 1, 6);
  const perTablet = clamp(Number(cardsTablet) || 2, 1, perDesktop);
  const perMobile = clamp(Number(cardsMobile) || 1, 1, perTablet);
  const cardsPerView = mdUp ? perDesktop : smUp ? perTablet : perMobile;
  const safeGap = clamp(Number(gap) || 12, 0, 40);
  const safeHeight = clamp(Number(imageHeight) || 392, 220, 620);
  const safeScale = clamp(Number(zoomScale) || 1.08, 1, 1.3);
  const pageCount = Math.max(1, entries.length - cardsPerView + 1);

  const [index, setIndex, setPaused] = useAutoplay(pageCount, 4800, reduced || pageCount <= 1);

  useEffect(() => {
    setIndex((prev) => {
      if (prev >= pageCount) return Math.max(0, pageCount - 1);
      return prev;
    });
  }, [pageCount, setIndex]);

  if (!entries.length) return null;

  const trackWidth = `${(entries.length / cardsPerView) * 100}%`;
  const slideWidth = `${100 / entries.length}%`;
  const translate = `-${(100 / entries.length) * index}%`;

  return (
    <Container maxWidth={toContainerMax(maxWidth)} disableGutters={maxWidth === "full"}>
      {title && (
        <HtmlTypo
          variant="h3"
          sx={{
            mb: subtitle ? 1.5 : 3,
            fontWeight: 400,
            textAlign: titleAlign,
            color: "var(--page-heading-color, currentColor)",
          }}
        >
          {title}
        </HtmlTypo>
      )}
      {subtitle && (
        <HtmlTypo
          variant="body1"
          sx={{
            mb: 4,
            textAlign: titleAlign,
            color: "var(--page-body-color, text.secondary)",
          }}
        >
          {subtitle}
        </HtmlTypo>
      )}
      <Box
        sx={{ position: "relative" }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <Box sx={{ overflow: "hidden", px: 0 }}>
          <Box
            sx={{
              display: "flex",
              width: trackWidth,
              transform: `translateX(${translate})`,
              transition: "transform 420ms cubic-bezier(.2,.8,.2,1)",
            }}
          >
            {entries.map((item, idx) => {
              const content = (
                <Box
                  sx={{
                    position: "relative",
                    height: safeHeight,
                    borderRadius: websiteRadius(4),
                    overflow: "hidden",
                    backgroundColor: "#f4f4f4",
                    boxShadow: "0 12px 26px rgba(15,23,42,0.08)",
                    "& img": {
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                      filter: "grayscale(1)",
                      transform: "scale(1)",
                      transition: "transform 360ms ease, filter 360ms ease",
                    },
                    "&:hover img": {
                      filter: "grayscale(0)",
                      transform: `scale(${safeScale})`,
                    },
                    "&:hover .service-hover-slider-label": {
                      transform: "translate(-50%, -50%) scale(1.04)",
                    },
                  }}
                >
                  {item.image ? (
                    <Box
                      component="img"
                      src={buildImgixUrl(item.image, { w: 1400, fit: "crop" })}
                      alt={item.title || ""}
                      loading="lazy"
                    />
                  ) : null}
                  <Box
                    className="service-hover-slider-label"
                    sx={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                      transition: "transform 320ms ease",
                      px: 2,
                      width: "100%",
                    }}
                  >
                    <Typography
                      sx={{
                        textAlign: "center",
                        color: "#121212",
                        fontSize: { xs: "1.5rem", md: "1.8rem" },
                        lineHeight: 1.1,
                        textShadow: "0 1px 1px rgba(255,255,255,0.4)",
                      }}
                    >
                      {item.title}
                    </Typography>
                  </Box>
                </Box>
              );

              return (
                <Box
                  key={idx}
                  sx={{
                    width: slideWidth,
                    flex: `0 0 ${slideWidth}`,
                    px: `${safeGap / 2}px`,
                    boxSizing: "border-box",
                  }}
                >
                  {item.link ? (
                    <Box component="a" href={item.link} sx={{ display: "block", textDecoration: "none", color: "inherit" }}>
                      {content}
                    </Box>
                  ) : (
                    content
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
        {showArrows && pageCount > 1 && (
          <>
            <IconButton
              onClick={() => setIndex((prev) => (prev === 0 ? pageCount - 1 : prev - 1))}
              sx={{
                position: "absolute",
                left: 4,
                top: "50%",
                transform: "translateY(-50%)",
                width: 48,
                height: 48,
                borderRadius: websiteRadius(2),
                bgcolor: "rgba(255,255,255,0.78)",
                border: "1px solid rgba(15,23,42,0.14)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.95)" },
              }}
            >
              <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>
            <IconButton
              onClick={() => setIndex((prev) => (prev === pageCount - 1 ? 0 : prev + 1))}
              sx={{
                position: "absolute",
                right: 4,
                top: "50%",
                transform: "translateY(-50%)",
                width: 48,
                height: 48,
                borderRadius: websiteRadius(2),
                bgcolor: "rgba(255,255,255,0.78)",
                border: "1px solid rgba(15,23,42,0.14)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.95)" },
              }}
            >
              <ArrowForwardIosIcon fontSize="small" />
            </IconButton>
          </>
        )}
      </Box>
      {showDots && pageCount > 1 && (
        <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2.5 }}>
          {Array.from({ length: pageCount }).map((_, dotIdx) => (
            <Box
              key={dotIdx}
              onClick={() => setIndex(dotIdx)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setIndex(dotIdx)}
              sx={{
                width: dotIdx === index ? 20 : 12,
                height: 4,
                borderRadius: 999,
                bgcolor:
                  dotIdx === index
                    ? "var(--page-link-color, rgba(15,23,42,0.82))"
                    : "rgba(15,23,42,0.28)",
                cursor: "pointer",
                transition: "all 180ms ease",
              }}
            />
          ))}
        </Stack>
      )}
    </Container>
  );
};

const CollectionShowcase = ({
  title,
  subtitle,
  items = [],
  perks = [],
  copyTitle,
  copyBody,
  ctaTitle,
  ctaSubtitle,
  ctaButtonText,
  ctaButtonLink,
  maxWidth = "lg",
  perView = {},
  showArrows = true,
  showDots = false,
  autoplay = true,
  intervalMs = 4200,
  imageMaxWidth = 260
}) => {
  const entries = toArray(items)
    .map((item) => ({
      title: toPlain(item?.title ?? ""),
      linkText: toPlain(item?.linkText ?? item?.ctaText ?? "Shop now"),
      link: item?.link || item?.ctaLink || "#",
      image: item?.image || item?.imageUrl || "",
      imageAlt: item?.imageAlt || item?.title || "",
    }))
    .filter((item) => item.title || item.image);

  const perkList = toArray(perks)
    .map((item) => ({
      icon: toPlain(item?.icon ?? ""),
      title: toPlain(item?.title ?? ""),
      subtitle: toPlain(item?.subtitle ?? item?.body ?? ""),
    }))
    .filter((item) => item.title || item.subtitle);

  const hasCarousel = entries.length > 0;
  const hasPerks = perkList.length > 0;
  const normalizedCopyBody = copyBody ? safeHtml(String(copyBody)).trim() : "";
  const strippedCopyBody = normalizedCopyBody.replace(/<[^>]*>/g, "").trim();
  const hasCopyBody = Boolean(strippedCopyBody);
  const hasCopy = Boolean(copyTitle) || hasCopyBody;
  const normalizedCtaSubtitle = ctaSubtitle ? safeHtml(String(ctaSubtitle)).trim() : "";
  const strippedCtaSubtitle = normalizedCtaSubtitle.replace(/<[^>]*>/g, "").trim();
  const hasCtaSubtitle = Boolean(strippedCtaSubtitle);
  const hasCta = Boolean(ctaTitle) || hasCtaSubtitle || Boolean(ctaButtonText);

  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up("md"));
  const smUp = useMediaQuery(theme.breakpoints.up("sm"));

  const perDesktop = clamp(Number(perView?.desktop) || 3, 1, 4);
  const imageWidth = clamp(Number(imageMaxWidth) || 260, 180, 420);
  const perTablet = clamp(Number(perView?.tablet) || 2, 1, perDesktop);
  const perMobile = clamp(Number(perView?.mobile) || 1, 1, perTablet);
  const cardsPerView = mdUp ? perDesktop : smUp ? perTablet : perMobile;

  const slideCount = Math.max(1, entries.length - cardsPerView + 1);
  const reduced = usePrefersReducedMotion();
  const autoplayDisabled = reduced || !autoplay || slideCount <= 1;
  const interval = clamp(intervalMs || 4200, 1500, 12000);
  const [index, setIndex, setPaused] = useAutoplay(slideCount, interval, autoplayDisabled);

  React.useEffect(() => {
    setIndex((prev) => {
      if (prev >= slideCount) return Math.max(0, slideCount - 1);
      return prev;
    });
  }, [slideCount, setIndex]);

  if (!hasCarousel && !hasPerks && !hasCopy && !hasCta) return null;

  const translate = `translate3d(-${(index * 100) / cardsPerView}%, 0, 0)`;
  const cardWidth = {
    xs: `${100 / perMobile}%`,
    sm: `${100 / perTablet}%`,
    md: `${100 / perDesktop}%`,
  };

  const goTo = (next) => {
    if (slideCount <= 1) return;
    setIndex(next);
  };
  const handlePrev = () => goTo((index - 1 + slideCount) % slideCount);
  const handleNext = () => goTo((index + 1) % slideCount);

  const perkIcon = (label) => {
    const key = String(label || "").toLowerCase();
    if (!key) return null;
    if (key.includes("fast") || key.includes("speed")) return <SpeedIcon />;
    if (key.includes("flex")) return <TuneIcon />;
    if (key.includes("support") || key.includes("help")) return <SupportAgentIcon />;
    if (key.includes("ship") || key.includes("delivery")) return <LocalShippingIcon />;
    if (key.includes("warranty") || key.includes("guarantee")) return <VerifiedIcon />;
    if (key.includes("return") || key.includes("exchange")) return <ReplayIcon />;
    if (key.includes("secure") || key.includes("diamond") || key.includes("quality")) return <DiamondOutlinedIcon />;
    return null;
  };

  return (
    <Box>
      <Container maxWidth={toContainerMax(maxWidth)}>
        <Stack spacing={3} alignItems="center" textAlign="center">
          {(title || subtitle) && (
            <Stack spacing={1} alignItems="center">
              {title && (
                <HtmlTypo
                  variant="h4"
                  sx={{ fontWeight: 800, color: "var(--page-heading-color, text.primary)" }}
                >
                  {title}
                </HtmlTypo>
              )}
              {subtitle && (
                <HtmlTypo
                  variant="body1"
                  sx={{ color: "var(--page-body-color, text.secondary)" }}
                >
                  {subtitle}
                </HtmlTypo>
              )}
            </Stack>
          )}

          {hasCarousel && (
            <Stack spacing={2} sx={{ width: "100%" }}>
              <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                {showArrows && slideCount > 1 && (
                  <IconButton aria-label="Show previous" onClick={handlePrev}>
                    <ArrowBackIosNewIcon fontSize="small" />
                  </IconButton>
                )}
                <Box
                  sx={{ overflow: "hidden", width: "100%" }}
                  onMouseEnter={() => !autoplayDisabled && setPaused(true)}
                  onMouseLeave={() => !autoplayDisabled && setPaused(false)}
                >
                  <Box
                    sx={{
                      display: "flex",
                      transition: "transform .6s ease",
                      transform: translate,
                      gap: { xs: 2, md: 3 },
                    }}
                  >
                    {entries.map((item, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          flex: {
                            xs: `0 0 ${cardWidth.xs}`,
                            sm: `0 0 ${cardWidth.sm}`,
                            md: `0 0 ${cardWidth.md}`,
                          },
                          minWidth: { xs: cardWidth.xs, sm: cardWidth.sm, md: cardWidth.md },
                          boxSizing: "border-box",
                        }}
                      >
                        <Box
                          sx={{
                            display: "grid",
                            justifyItems: "center",
                            textAlign: "center",
                            rowGap: 1,
                          }}
                        >
                          {item.image && (
                            <Box
                              component="img"
                              src={buildImgixUrl(item.image, { w: 900, fit: "crop" })}
                              alt={item.imageAlt}
                              loading="lazy"
                              sx={{
                                width: "100%",
                                maxWidth: imageWidth,
                                aspectRatio: "1 / 1",
                                objectFit: "cover",
                                borderRadius: websiteRadius(3),
                                border: "1px solid rgba(148,163,184,0.24)",
                                boxShadow: "0 16px 32px rgba(15,23,42,0.12)",
                              }}
                            />
                          )}
                          {item.title && (
                            <Typography
                              sx={{ fontWeight: 700, color: "var(--page-heading-color, text.primary)" }}
                            >
                              {item.title}
                            </Typography>
                          )}
                          {item.linkText && (
                            <Button
                              href={item.link || "#"}
                              variant="text"
                              size="small"
                              sx={{
                                textTransform: "none",
                                fontWeight: 600,
                                color: "var(--page-link-color, inherit)",
                              }}
                            >
                              {item.linkText}
                            </Button>
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
                {showArrows && slideCount > 1 && (
                  <IconButton aria-label="Show next" onClick={handleNext}>
                    <ArrowForwardIosIcon fontSize="small" />
                  </IconButton>
                )}
              </Stack>
              {showDots && slideCount > 1 && (
                <Stack direction="row" spacing={1} justifyContent="center">
                  {Array.from({ length: slideCount }).map((_, dotIdx) => (
                    <Box
                      key={dotIdx}
                      component="button"
                      role="button"
                      tabIndex={0}
                      aria-label={`Go to slide ${dotIdx + 1}`}
                      aria-current={dotIdx === index}
                      onClick={() => goTo(dotIdx)}
                      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && goTo(dotIdx)}
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: dotIdx === index ? "text.primary" : "divider",
                        cursor: "pointer",
                        outlineOffset: 2,
                        border: 0,
                        padding: 0,
                      }}
                    />
                  ))}
                </Stack>
              )}
            </Stack>
          )}

          {hasPerks && (
            <>
              <Divider sx={{ width: "100%", maxWidth: 860 }} />
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={{ xs: 2, sm: 3 }}
                justifyContent="center"
                alignItems="center"
                sx={{ width: "100%" }}
              >
                {perkList.map((perk, idx) => (
                  <Stack key={idx} spacing={0.5} alignItems="center" textAlign="center" sx={{ maxWidth: 180 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--page-heading-color, #0f172a)",
                        fontSize: 28,
                      }}
                    >
                      {perkIcon(perk.icon) || <LocalOfferIcon />}
                    </Box>
                    {perk.title && (
                      <Typography sx={{ fontWeight: 600, color: "var(--page-heading-color, text.primary)" }}>
                        {perk.title}
                      </Typography>
                    )}
                    {perk.subtitle && (
                      <Typography
                        variant="body2"
                        sx={{ color: "var(--page-body-color, text.secondary)" }}
                      >
                        {perk.subtitle}
                      </Typography>
                    )}
                  </Stack>
                ))}
              </Stack>
            </>
          )}

          {hasCopy && (
            <Box sx={{ maxWidth: 900, textAlign: "left", width: "100%" }}>
              {copyTitle && (
                <HtmlTypo
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    mb: 1,
                    textAlign: "center",
                    color: "var(--page-heading-color, text.primary)",
                  }}
                >
                  {copyTitle}
                </HtmlTypo>
              )}
              {hasCopyBody && (
                <Typography
                  sx={{ color: "var(--page-body-color, text.secondary)" }}
                  component="div"
                  dangerouslySetInnerHTML={{ __html: normalizedCopyBody }}
                />
              )}
            </Box>
          )}
        </Stack>
      </Container>

      {hasCta && (
        <Box
          sx={{
            mt: { xs: 6, md: 8 },
            py: { xs: 5, md: 6 },
            background: "var(--page-secondary-bg, #1f2937)",
            color: "var(--page-heading-color, #f8fafc)",
          }}
        >
          <Container maxWidth={toContainerMax(maxWidth)}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={3}
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
            >
              <Stack spacing={0.5}>
                {ctaTitle && (
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>
                    {ctaTitle}
                  </Typography>
                )}
                {hasCtaSubtitle && (
                  <Typography
                    component="div"
                    variant="body1"
                    sx={{ opacity: 0.85 }}
                    dangerouslySetInnerHTML={{ __html: normalizedCtaSubtitle }}
                  />
                )}
              </Stack>
              {ctaButtonText && (
                <Button
                  href={ctaButtonLink || "#"}
                  variant="contained"
                  size="large"
                  sx={{
                    backgroundColor: "var(--page-btn-bg, #2563eb)",
                    color: "var(--page-btn-color, #fff)",
                  }}
                >
                  {toPlain(ctaButtonText)}
                </Button>
              )}
            </Stack>
          </Container>
        </Box>
      )}
    </Box>
  );
};

const GalleryCarousel = ({
  title,
  caption,
  images = [],
  autoplay = true,
  titleAlign,
  maxWidth,
  aspectRatio = "4 / 3" // enforce a consistent frame so mixed sizes look uniform
}) => {
  const imgs = toArray(images);
  const resolvedMax = toContainerMax(maxWidth);
  const reduced = usePrefersReducedMotion();
  const [index, setIndex, setPaused] = useAutoplay(
    imgs.length,
    4000,
    !autoplay || reduced
  );
  const go = (dir) => setIndex((i) => (i + dir + imgs.length) % imgs.length);

  return (
    <Container maxWidth={resolvedMax} disableGutters={resolvedMax === false}>
      {title && (
        <HtmlTypo variant="h4" sx={{ mb: 0.5, fontWeight: 800, textAlign: titleAlign || "left" }}>
          {title}
        </HtmlTypo>
      )}
      {caption && (
        <HtmlTypo variant="body2" sx={{ mb: 2, color: "text.secondary", textAlign: titleAlign || "left" }}>
          {caption}
        </HtmlTypo>
      )}
      <Box
        sx={{ position: "relative", borderRadius: websiteRadius(3), overflow: "hidden" }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {imgs.map((src, i) => (
          <Box
            key={i}
            sx={{
              display: i === index ? "block" : "none",
              lineHeight: 0
            }}
            aria-hidden={i !== index}
          >
            <Box
              sx={{
                position: "relative",
                width: "100%",
                aspectRatio,
                overflow: "hidden"
              }}
            >
              <img
                src={src}
                alt=""
                loading="lazy"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  position: "absolute",
                  inset: 0
                }}
              />
            </Box>
          </Box>
        ))}
        {imgs.length > 1 && (
          <>
            <IconButton
              aria-label="Previous slide"
              onClick={() => go(-1)}
              sx={{
                position: "absolute",
                top: "50%",
                left: 12,
                transform: "translateY(-50%)",
                bgcolor: "background.paper"
              }}
              size="small"
            >
              <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>
            <IconButton
              aria-label="Next slide"
              onClick={() => go(1)}
              sx={{
                position: "absolute",
                top: "50%",
                right: 12,
                transform: "translateY(-50%)",
                bgcolor: "background.paper"
              }}
              size="small"
            >
              <ArrowForwardIosIcon fontSize="small" />
            </IconButton>
          </>
        )}
      </Box>
      {imgs.length > 1 && (
        <Stack
          role="tablist"
          direction="row"
          spacing={1}
          justifyContent="center"
          sx={{ mt: 1 }}
        >
          {imgs.map((_, i) => (
            <Box
              key={i}
              role="tab"
              aria-selected={i === index}
              tabIndex={0}
              onClick={() => setIndex(i)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setIndex(i)}
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: i === index ? "text.primary" : "divider",
                cursor: "pointer",
                outlineOffset: 2
              }}
            />
          ))}
        </Stack>
      )}
    </Container>
  );
};

const Testimonials = ({ title, items = [], titleAlign, maxWidth }) => {
  const list = toArray(items);
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useAutoplay(list.length, 6000, reduced);
  if (!list.length) return null;

  const t = list[index] || {};
  return (
    <Container maxWidth={toContainerMax(maxWidth)}>
      {title && (
        <HtmlTypo variant="h4" sx={{ mb: 2, fontWeight: 800, textAlign: "center" }}>
          {title}
        </HtmlTypo>
      )}
      <Card sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction="row" spacing={2} alignItems="center">
          {t.avatar && <Avatar src={t.avatar} alt="" />}
          {t.quote && (
            <HtmlTypo variant="h6" sx={{ fontWeight: 700 }}>
              {`“${t.quote}”`}
            </HtmlTypo>
          )}
        </Stack>
        {t.author && (
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            — {toPlain(t.author)}
          </Typography>
        )}
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          {list.map((_, i) => (
            <Box
              key={i}
              onClick={() => setIndex(i)}
              tabIndex={0}
              role="button"
              aria-label={`Go to testimonial ${i + 1}`}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setIndex(i)}
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: i === index ? "text.primary" : "divider",
                cursor: "pointer",
                outlineOffset: 2
              }}
            />
          ))}
        </Stack>
      </Card>
    </Container>
  );
};

const PricingTable = ({
  title,
  intro,
  plans = [],
  titleAlign,
  maxWidth,
  layout,
  notes,
  sideImage,
  sideImageAlt,
  sideImagePosition = "right",
  ctaStyle,
}) => {
  const list = toArray(plans);
  const align = titleAlign || "left";
  const normalizedLayout =
    typeof layout === "string" ? layout.toLowerCase() : "grid";

  const header =
    title || intro || notes ? (
      <Stack spacing={1.5} sx={{ mb: 4, textAlign: align }}>
        {title && (
          <HtmlTypo
            variant="h4"
            sx={{
              fontWeight: 800,
              textAlign: align,
              color: "var(--page-heading-color, currentColor)",
            }}
          >
            {title}
          </HtmlTypo>
        )}
        {intro && (
          <HtmlTypo
            variant="body1"
            sx={{
              color: "var(--page-body-color, text.secondary)",
              textAlign: align,
            }}
          >
            {intro}
          </HtmlTypo>
        )}
        {notes && (
          <HtmlTypo
            variant="body2"
            sx={{
              color: "var(--page-body-color, text.secondary)",
              textAlign: align,
            }}
          >
            {notes}
          </HtmlTypo>
        )}
      </Stack>
    ) : null;

  if (normalizedLayout === "frost-grid") {
    const hasImage = Boolean(sideImage);
    const placement = (sideImagePosition || "right").toLowerCase();
    const showLeftImage = hasImage && placement === "left";
    const showRightImage = hasImage && !showLeftImage;

    const sideImg = hasImage ? (
      <Box
        className="pricing-side"
        sx={{
          borderRadius: websiteRadius(3),
          overflow: "hidden",
          height: "100%",
          position: "relative",
        }}
      >
        <Box
          component="img"
          src={sideImage}
          alt={toPlain(sideImageAlt) || ""}
          loading="lazy"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </Box>
    ) : null;

    const plansGrid = (
      <Box className="pricing-frost">
        {list.map((p, i) => {
          const features = toArray(p.features);
          return (
            <Box
              key={i}
              className={`plan${p.featured ? " featured" : ""}`}
            >
              {p.ribbon && (
                <Typography
                  className="ribbon"
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                    color: "var(--page-body-color, currentColor)",
                  }}
                >
                  {toPlain(p.ribbon)}
                </Typography>
              )}
              <Typography
                variant="h6"
                sx={{ fontWeight: 800, color: "var(--page-heading-color, currentColor)" }}
              >
                {toPlain(p.name)}
              </Typography>
              <Typography
                className="price"
                variant="h3"
                sx={{ color: "var(--page-heading-color, currentColor)" }}
              >
                {toPlain(p.price)}
              </Typography>
              {features.length > 0 && (
                <Box className="features">
                  {features.map((f, idx) => (
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="flex-start"
                      key={idx}
                    >
                      <CheckIcon fontSize="small" sx={{ color: "var(--page-body-color, currentColor)" }} />
                      <Typography
                        variant="body2"
                        sx={{ color: "var(--page-body-color, text.secondary)" }}
                      >
                        {toPlain(f)}
                      </Typography>
                    </Stack>
                  ))}
                </Box>
              )}
              {p.ctaText && (
                <Button
                  href={p.ctaLink || "#"}
                  className="cta"
                  variant={
                    ctaStyle === "pill" || p.featured ? "contained" : "outlined"
                  }
                  sx={
                    ctaStyle === "pill" || p.featured
                      ? {
                          backgroundColor: "var(--page-btn-bg, var(--sched-primary))",
                          color: "var(--page-btn-color, #fff)",
                          "&:hover": {
                            backgroundColor: "var(--page-btn-bg, var(--sched-primary))",
                            filter: "brightness(0.95)",
                          },
                        }
                      : {
                          borderColor: "var(--page-btn-bg, var(--sched-primary))",
                          color: "var(--page-btn-bg, var(--sched-primary))",
                          "&:hover": {
                            borderColor: "var(--page-btn-bg, var(--sched-primary))",
                            color: "var(--page-btn-bg, var(--sched-primary))",
                            backgroundColor: "rgba(0,0,0,0.03)",
                          },
                        }
                  }
                >
                  {toPlain(p.ctaText)}
                </Button>
              )}
            </Box>
          );
        })}
      </Box>
    );

    return (
      <Container maxWidth={toContainerMax(maxWidth)}>
        {header}
        {hasImage ? (
          <Grid container spacing={4} alignItems="stretch">
            {showLeftImage && (
              <Grid item xs={12} md={4}>
                {sideImg}
              </Grid>
            )}
            <Grid item xs={12} md={hasImage ? 8 : 12}>
              {plansGrid}
            </Grid>
            {showRightImage && (
              <Grid item xs={12} md={4}>
                {sideImg}
              </Grid>
            )}
          </Grid>
        ) : (
          plansGrid
        )}
      </Container>
    );
  }

  if (normalizedLayout === "logo-cards") {
    return (
      <Container maxWidth={toContainerMax(maxWidth)}>
        {header}
        <Grid
          container
          spacing={3}
          className="pricing-logo-grid"
          alignItems="stretch"
          justifyContent="center"
        >
          {list.map((p, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card
                className={`pricing-logo-card${
                  p.featured ? " featured" : ""
                }`}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  textAlign: "center",
                  borderRadius: websiteRadius(4),
                  p: 3,
                  background: "var(--page-card-bg, rgba(6,10,22,0.78))",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "var(--page-heading-color, #f5f7ff)",
                  boxShadow: "var(--page-card-shadow, 0 30px 60px rgba(5,6,20,0.45))",
                  backdropFilter: "blur(var(--page-card-blur, 0px))",
                }}
              >
                {p.ribbon && (
                  <Typography
                    variant="caption"
                    className="pricing-logo-ribbon"
                    sx={{
                      letterSpacing: ".18em",
                      textTransform: "uppercase",
                      color: "var(--page-body-color, rgba(196,181,253,0.9))",
                    }}
                  >
                    {toPlain(p.ribbon)}
                  </Typography>
                )}
                <Typography
                  variant="h6"
                  className="pricing-logo-name"
                  sx={{
                    fontWeight: 800,
                    color: "var(--page-heading-color, currentColor)",
                  }}
                >
                  {toPlain(p.name)}
                </Typography>
                <Typography
                  variant="h4"
                  className="pricing-logo-price"
                  sx={{
                    fontWeight: 800,
                    color: "var(--page-heading-color, currentColor)",
                  }}
                >
                  {toPlain(p.price)}
                </Typography>
                <Stack
                  spacing={0.75}
                  className="pricing-logo-features"
                  sx={{
                    textAlign: align,
                    alignItems: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
                    mx: "auto",
                    width: "100%",
                  }}
                >
                  {toArray(p.features).map((f, idx) => (
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      key={idx}
                    >
                      <CheckIcon fontSize="small" sx={{ color: "var(--page-body-color, currentColor)" }} />
                      <Typography
                        variant="body2"
                        sx={{ color: "var(--page-body-color, text.secondary)" }}
                      >
                        {toPlain(f)}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
                {p.ctaText && (
                  <Button
                    href={p.ctaLink || "#"}
                    className="pricing-logo-cta"
                    variant="contained"
                    sx={{
                      mt: "auto",
                      backgroundColor: "var(--page-btn-bg, var(--sched-primary))",
                      color: "var(--page-btn-color, #fff)",
                      "&:hover": {
                        backgroundColor: "var(--page-btn-bg, var(--sched-primary))",
                        filter: "brightness(0.95)",
                      },
                    }}
                  >
                    {toPlain(p.ctaText)}
                  </Button>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxWidth={toContainerMax(maxWidth)}>
      {header}
      <Grid container spacing={2}>
        {list.map((p, i) => (
          <Grid item xs={12} md={4} key={i}>
            <Card
              sx={{
                height: "100%",
                borderWidth: p.featured ? 2 : 1,
                borderStyle: "solid",
                borderColor: p.featured ? "var(--page-btn-bg, var(--sched-primary))" : "divider",
                boxShadow: p.featured ? 6 : 1,
              }}
            >
              <CardContent>
                {p.ribbon && (
                  <Chip
                    label={toPlain(p.ribbon)}
                    size="small"
                    sx={{
                      mb: 1,
                      fontWeight: 700,
                      backgroundColor: "var(--page-btn-bg, var(--sched-primary))",
                      color: "var(--page-btn-color, #fff)",
                    }}
                  />
                )}
                <Typography variant="h6" fontWeight={800} sx={{ color: "var(--page-heading-color, currentColor)" }}>
                  {toPlain(p.name)}
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ my: 1, color: "var(--page-heading-color, currentColor)" }}
                >
                  {toPlain(p.price)}
                </Typography>
                <Stack spacing={0.75} sx={{ mb: 2 }}>
                  {toArray(p.features).map((f, idx) => (
                    <Stack direction="row" spacing={1} alignItems="center" key={idx}>
                      <CheckIcon fontSize="small" sx={{ color: "var(--page-body-color, currentColor)" }} />{" "}
                      <Typography
                        variant="body2"
                        sx={{ color: "var(--page-body-color, text.secondary)" }}
                      >
                        {toPlain(f)}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
                {p.ctaText && (
                  <Button
                    href={p.ctaLink || "#"}
                    fullWidth
                    variant={p.featured ? "contained" : "outlined"}
                    sx={
                      p.featured
                        ? {
                            backgroundColor: "var(--page-btn-bg, var(--sched-primary))",
                            color: "var(--page-btn-color, #fff)",
                            "&:hover": {
                              backgroundColor: "var(--page-btn-bg, var(--sched-primary))",
                              filter: "brightness(0.95)",
                            },
                          }
                        : {
                            borderColor: "var(--page-btn-bg, var(--sched-primary))",
                            color: "var(--page-btn-bg, var(--sched-primary))",
                            "&:hover": {
                              borderColor: "var(--page-btn-bg, var(--sched-primary))",
                              color: "var(--page-btn-bg, var(--sched-primary))",
                              backgroundColor: "rgba(0,0,0,0.03)",
                            },
                          }
                    }
                  >
                    {toPlain(p.ctaText)}
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

const FAQ = ({ title, items = [], titleAlign, maxWidth }) => {
  const list = toArray(items);
  return (
    <Container maxWidth={toContainerMax(maxWidth)}>
      {title && (
        <HtmlTypo variant="h4" sx={{ mb: 2, fontWeight: 800, textAlign: titleAlign || "center" }}>
          {title}
        </HtmlTypo>
      )}
      {list.map((q, i) => (
        <Accordion
          key={i}
          disableGutters
          elevation={0}
          sx={{
            background: "var(--page-card-bg, rgba(255,255,255,0.92))",
            color: "var(--page-heading-color, inherit)",
              borderRadius: "var(--page-card-radius, 4px)",
            boxShadow: "var(--page-card-shadow, 0 18px 48px rgba(15,23,42,0.08))",
            border: "1px solid color-mix(in srgb, var(--page-body-color, rgba(15,23,42,0.2)) 12%, transparent)",
            overflow: "hidden",
            mb: 1.25,
            "&:before": { display: "none" },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={700} sx={{ color: "var(--page-heading-color, inherit)" }}>
              {toPlain(q.question)}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ color: "var(--page-body-color, inherit)" }}>
            {q.answer ? (
              <HtmlTypo variant="body2" sx={{ color: "inherit" }}>
                {q.answer}
              </HtmlTypo>
            ) : null}
          </AccordionDetails>
       </Accordion>
     ))}
   </Container>
  );
};

const TeamGrid = ({
  title,
  subtitle,
  items = [],
  columnsXs = 1,
  columnsSm = 2,
  columnsMd = 3,
  gap = 18,
  titleAlign = "center",
  maxWidth,
}) => {
  const list = toArray(items);
  const align = titleAlign || "center";
  const gapValue = typeof gap === "number" ? gap : 0;
  const columnsConf = {
    xs: columnsXs || 1,
    sm: columnsSm || columnsXs || 1,
    md: columnsMd || columnsSm || columnsXs || 1,
  };
  const calcBasis = (count) => `calc(${(100 / count).toFixed(4)}% - ${gapValue}px)`;
  const itemBasis = {
    xs: calcBasis(columnsConf.xs),
    sm: calcBasis(columnsConf.sm),
    md: calcBasis(columnsConf.md),
  };

  const resolveImage = (it) => {
    if (!it) return "";
    if (typeof it === "string") return it;
    return it.image || it.photo || it.avatar || it.url || it.assetKey || "";
  };

  return (
    <Container maxWidth={toContainerMax(maxWidth)}>
      {title && (
        <HtmlTypo variant="h4" sx={{ mb: 1.5, fontWeight: 800, textAlign: align }}>
          {title}
        </HtmlTypo>
      )}
      {subtitle && (
        <HtmlTypo variant="body2" sx={{ mb: 4, textAlign: align }}>
          {subtitle}
        </HtmlTypo>
      )}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: typeof gap === "number" ? `${gap}px` : gap,
        }}
      >
        {list.map((member, i) => {
          const imgPath = resolveImage(member);
          const imgUrl = imgPath ? buildImgixUrl(imgPath, { w: 1200, fit: "crop" }) : "";
          return (
            <Box
              key={i}
              sx={{
                display: "flex",
                flexDirection: "column",
                flex: "0 0 auto",
                flexBasis: itemBasis,
                maxWidth: itemBasis,
                width: "100%",
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: "var(--page-card-radius, 0px)",
                  border: "1px solid rgba(148,163,184,0.25)",
                  backgroundColor: "rgba(15,23,42,0.35)",
                  lineHeight: 0,
                }}
              >
                {imgUrl ? (
                  <Box
                    component="img"
                    src={imgUrl}
                    alt={toPlain(member?.name || "")}
                    loading="lazy"
                    sx={{
                      width: "100%",
                      height: "100%",
                      aspectRatio: "4/5",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  <Box sx={{ aspectRatio: "4/5", bgcolor: "rgba(148,163,184,0.12)" }} />
                )}
              </Box>
              <Box sx={{ pt: 1.5, textAlign: "left" }}>
                {member?.name && (
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: "var(--page-link-color, inherit)" }}
                  >
                    {toPlain(member.name)}
                  </Typography>
                )}
                {member?.role && (
                  <Typography variant="body2" sx={{ color: "var(--page-body-color, inherit)" }}>
                    {toPlain(member.role)}
                  </Typography>
                )}
                {(member?.email || member?.linkedin || member?.website) && (
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    {member?.email && (
                      <IconButton
                        size="small"
                        component="a"
                        href={`mailto:${member.email}`}
                        aria-label="Email"
                        sx={{ color: "var(--page-link-color, inherit)" }}
                      >
                        <EmailIcon fontSize="small" />
                      </IconButton>
                    )}
                    {member?.linkedin && (
                      <IconButton
                        size="small"
                        component="a"
                        href={member.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="LinkedIn"
                        sx={{ color: "var(--page-link-color, inherit)" }}
                      >
                        <LinkedInIcon fontSize="small" />
                      </IconButton>
                    )}
                    {member?.website && (
                      <IconButton
                        size="small"
                        component="a"
                        href={member.website}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Website"
                        sx={{ color: "var(--page-link-color, inherit)" }}
                      >
                        <LanguageIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Stack>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Container>
  );
};

const BlogList = ({
  title,
  subtitle,
  posts = [],
  columnsXs = 1,
  columnsSm = 2,
  columnsMd = 3,
  gap = 18,
  titleAlign = "center",
  maxWidth,
  siteSlug,
}) => {
  const list = toArray(posts);
  const align = titleAlign || "center";
  const gridTemplate = {
    xs: `repeat(${columnsXs || 1}, minmax(0, 1fr))`,
    sm: `repeat(${columnsSm || columnsXs || 1}, minmax(0, 1fr))`,
    md: `repeat(${columnsMd || columnsSm || columnsXs || 1}, minmax(0, 1fr))`,
  };

  const slugify = (value) =>
    String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  const resolveSlug = (post) => post?.slug || slugify(post?.title);

  const resolveSiteSlug = () => {
    if (siteSlug) return siteSlug;
    if (typeof window === "undefined") return "";
    const parts = window.location.pathname.split("/").filter(Boolean);
    if (!parts.length) return "";
    if (parts[0] === "public") return parts[1] || "";
    return parts[0];
  };

  const buildPostHref = (post) => {
    const postSlug = resolveSlug(post);
    if (!postSlug) return "#";
    const baseSlug = resolveSiteSlug();
    const query = `?page=blog&post=${encodeURIComponent(postSlug)}`;
    return baseSlug ? `/${baseSlug}${query}` : query;
  };

  const formatDate = (val) => {
    if (!val) return "";
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return String(val);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <Container maxWidth={toContainerMax(maxWidth)}>
      {title && (
        <HtmlTypo variant="h4" sx={{ mb: 1.5, fontWeight: 800, textAlign: align }}>
          {title}
        </HtmlTypo>
      )}
      {subtitle && (
        <HtmlTypo variant="body2" sx={{ mb: 4, textAlign: align }}>
          {subtitle}
        </HtmlTypo>
      )}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: gridTemplate,
          gap: typeof gap === "number" ? `${gap}px` : gap,
        }}
      >
        {list.map((post, i) => {
          const cover = post?.coverImage || post?.image || "";
          const coverUrl = cover ? buildImgixUrl(cover, { w: 1200, fit: "crop" }) : "";
          const href = buildPostHref(post);
          return (
            <Box
              key={i}
              sx={{
                borderRadius: "var(--page-card-radius, 0px)",
                backgroundColor: "var(--page-card-bg, rgba(255,255,255,0.08))",
                border: "1px solid rgba(148,163,184,0.25)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              {coverUrl && (
                <Box
                  component="img"
                  src={coverUrl}
                  alt={toPlain(post?.title || "")}
                  loading="lazy"
                  sx={{ width: "100%", aspectRatio: "16/9", objectFit: "cover" }}
                />
              )}
              <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
                {post?.date && (
                  <Typography variant="caption" sx={{ color: "var(--page-body-color, inherit)" }}>
                    {formatDate(post.date)}
                  </Typography>
                )}
                {post?.title && (
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {toPlain(post.title)}
                  </Typography>
                )}
                {post?.excerpt && (
                  <HtmlTypo variant="body2" sx={{ color: "var(--page-body-color, inherit)" }}>
                    {post.excerpt}
                  </HtmlTypo>
                )}
                <Button
                  href={href}
                  variant="text"
                  sx={{ alignSelf: "flex-start", px: 0, color: "var(--page-link-color, inherit)" }}
                >
                  Read more
                </Button>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Container>
  );
};

const TeamMetrics = ({
  title,
  subtitle,
  items = [],
  titleAlign = "center",
  maxWidth,
}) => {
  const list = toArray(items);
  const align = titleAlign || "center";
  return (
    <Container maxWidth={toContainerMax(maxWidth)}>
      {title && (
        <HtmlTypo variant="h4" sx={{ mb: 1.5, fontWeight: 800, textAlign: align }}>
          {title}
        </HtmlTypo>
      )}
      {subtitle && (
        <HtmlTypo variant="body2" sx={{ mb: 4, textAlign: align }}>
          {subtitle}
        </HtmlTypo>
      )}
      <Grid container spacing={3}>
        {list.map((m, i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Box
              sx={{
                p: 3,
                borderRadius: "var(--page-card-radius, 0px)",
                backgroundColor: "var(--page-card-bg, rgba(255,255,255,0.08))",
                border: "1px solid rgba(148,163,184,0.25)",
                height: "100%",
              }}
            >
              {m?.value && (
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                  {toPlain(m.value)}
                </Typography>
              )}
              {m?.label && (
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {toPlain(m.label)}
                </Typography>
              )}
              {m?.caption && (
                <HtmlTypo variant="body2" sx={{ mt: 1, color: "var(--page-body-color, inherit)" }}>
                  {m.caption}
                </HtmlTypo>
              )}
            </Box>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

const CultureValues = ({
  title,
  subtitle,
  items = [],
  columnsXs = 1,
  columnsSm = 2,
  columnsMd = 3,
  gap = 18,
  titleAlign = "center",
  maxWidth,
}) => {
  const list = toArray(items);
  const align = titleAlign || "center";
  const gridTemplate = {
    xs: `repeat(${columnsXs || 1}, minmax(0, 1fr))`,
    sm: `repeat(${columnsSm || columnsXs || 1}, minmax(0, 1fr))`,
    md: `repeat(${columnsMd || columnsSm || columnsXs || 1}, minmax(0, 1fr))`,
  };
  return (
    <Container maxWidth={toContainerMax(maxWidth)}>
      {title && (
        <HtmlTypo variant="h4" sx={{ mb: 1.5, fontWeight: 800, textAlign: align }}>
          {title}
        </HtmlTypo>
      )}
      {subtitle && (
        <HtmlTypo variant="body2" sx={{ mb: 4, textAlign: align }}>
          {subtitle}
        </HtmlTypo>
      )}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: gridTemplate,
          gap: typeof gap === "number" ? `${gap}px` : gap,
        }}
      >
        {list.map((v, i) => (
          <Box
            key={i}
            sx={{
              p: 3,
              borderRadius: "var(--page-card-radius, 0px)",
              backgroundColor: "var(--page-card-bg, rgba(255,255,255,0.08))",
              border: "1px solid rgba(148,163,184,0.25)",
            }}
          >
            {v?.icon && (
              <Typography variant="h5" sx={{ mb: 1 }}>
                {toPlain(v.icon)}
              </Typography>
            )}
            {v?.title && (
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                {toPlain(v.title)}
              </Typography>
            )}
            {v?.text && (
              <HtmlTypo variant="body2" sx={{ color: "var(--page-body-color, inherit)" }}>
                {v.text}
              </HtmlTypo>
            )}
          </Box>
        ))}
      </Box>
    </Container>
  );
};

const ProcessSteps = ({
  title,
  subtitle,
  steps = [],
  columnsXs = 1,
  columnsSm = 2,
  columnsMd = 3,
  gap = 18,
  titleAlign = "center",
  maxWidth,
}) => {
  const list = toArray(steps);
  const align = titleAlign || "center";
  const gridTemplate = {
    xs: `repeat(${columnsXs || 1}, minmax(0, 1fr))`,
    sm: `repeat(${columnsSm || columnsXs || 1}, minmax(0, 1fr))`,
    md: `repeat(${columnsMd || columnsSm || columnsXs || 1}, minmax(0, 1fr))`,
  };
  return (
    <Container maxWidth={toContainerMax(maxWidth)}>
      {title && (
        <HtmlTypo variant="h4" sx={{ mb: 1.5, fontWeight: 800, textAlign: align }}>
          {title}
        </HtmlTypo>
      )}
      {subtitle && (
        <HtmlTypo variant="body2" sx={{ mb: 4, textAlign: align }}>
          {subtitle}
        </HtmlTypo>
      )}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: gridTemplate,
          gap: typeof gap === "number" ? `${gap}px` : gap,
        }}
      >
        {list.map((s, i) => (
          <Box
            key={i}
            sx={{
              p: 3,
              borderRadius: "var(--page-card-radius, 0px)",
              backgroundColor: "var(--page-card-bg, rgba(255,255,255,0.08))",
              border: "1px solid rgba(148,163,184,0.25)",
            }}
          >
            {s?.title && (
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                {toPlain(s.title)}
              </Typography>
            )}
            {s?.description && (
              <HtmlTypo variant="body2" sx={{ color: "var(--page-body-color, inherit)" }}>
                {s.description}
              </HtmlTypo>
            )}
            {s?.meta && (
              <HtmlTypo variant="caption" sx={{ display: "block", mt: 1 }}>
                {s.meta}
              </HtmlTypo>
            )}
          </Box>
        ))}
      </Box>
    </Container>
  );
};

const CTA = ({ title, subtitle, buttonText, buttonLink, titleAlign, maxWidth }) => (
  <Container maxWidth={toContainerMax(maxWidth)}>
    <Card
      sx={{
        p: { xs: 2, md: 3 },
        textAlign: titleAlign || "center",
        background: "var(--page-card-bg, rgba(255,255,255,0.92))",
        color: "var(--page-heading-color, inherit)",
        borderRadius: "var(--page-card-radius, 4px)",
        boxShadow: "var(--page-card-shadow, 0 18px 48px rgba(15,23,42,0.08))",
        border: "1px solid color-mix(in srgb, var(--page-body-color, rgba(15,23,42,0.2)) 12%, transparent)",
      }}
    >
      {title && (
        <HtmlTypo variant="h5" sx={{ fontWeight: 800 }}>
          {title}
        </HtmlTypo>
      )}
      {subtitle && (
        <HtmlTypo variant="body2" sx={{ mt: 0.5, color: "var(--page-body-color, inherit)" }}>
          {subtitle}
        </HtmlTypo>
      )}
      {buttonText && (
        <Button href={buttonLink || "#"} variant="contained" sx={{ mt: 2 }}>
          {toPlain(buttonText)}
        </Button>
      )}
    </Card>
  </Container>
);

const RichText = ({ title, body, align = "left", maxWidth }) => (
  <Container maxWidth={toContainerMax(maxWidth)}>
    {title && (
      <HtmlTypo variant="h4" sx={{ mb: 2, fontWeight: 800, textAlign: align }}>
        {title}
      </HtmlTypo>
    )}
    {body && (
      <Typography
        color="text.secondary"
        component="div"
        sx={{ textAlign: align }}
        dangerouslySetInnerHTML={{ __html: safeHtml(body).replace(/\n/g, "<br/>") }}
      />
    )}
  </Container>
);

/** Draggable Free Text block — managers can drag and nudge with arrows */
const FreeText = ({
  text = "Double-click to edit text. Drag to move. Use arrow keys to nudge.",
  x = 0, y = 0,
  width = 480,
  align = "left",
  fontSize = 24,
  fontWeight = 700,
  color = "inherit",
  background = "transparent",
  padding = 8,
  borderRadius = 4,
  editable = true,
}) => {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x, y });
  useEffect(() => { setPos({ x, y }); }, [x, y]);

  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = { ...pos };
    const onMove = (ev) => setPos({ x: startPos.x + (ev.clientX - startX), y: startPos.y + (ev.clientY - startY) });
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const onKeyDown = (e) => {
    let dx = 0, dy = 0;
    if (e.key === "ArrowLeft") dx = -1;
    if (e.key === "ArrowRight") dx = 1;
    if (e.key === "ArrowUp") dy = -1;
    if (e.key === "ArrowDown") dy = 1;
    if (dx || dy) {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      setPos((p) => ({ x: p.x + dx * step, y: p.y + dy * step }));
    }
  };

  return (
    <Box sx={{ position: "relative", height: 0 }}>
      <Box
        tabIndex={0}
        ref={ref}
        onMouseDown={onMouseDown}
        onKeyDown={onKeyDown}
        contentEditable={editable}
        suppressContentEditableWarning
        style={{
          position: "relative",
          transform: `translate(${pos.x}px, ${pos.y}px)`,
          width,
          textAlign: align,
          fontSize,
          fontWeight,
          color,
          background,
          padding,
          borderRadius: websiteRadius(borderRadius),
          outline: "1px dashed rgba(0,0,0,0.2)",
          cursor: "move",
          userSelect: "text",
          whiteSpace: "pre-wrap",
        }}
      >
        {text}
      </Box>
    </Box>
  );
};

const toEmbedUrl = (url = "") => {
  const value = String(url || "").trim();
  if (!value) return "";
  const shortMatch = value.match(/youtu\.be\/([^?&/]+)/i);
  if (shortMatch?.[1]) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  const watchMatch = value.match(/[?&]v=([^?&/]+)/i);
  if (watchMatch?.[1]) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  return value;
};

const Video = ({ title, description, url, poster, titleAlign, maxWidth }) => (
  <Container maxWidth={toContainerMax(maxWidth)}>
    {title && (
      <HtmlTypo variant="h4" sx={{ mb: 1, fontWeight: 800, textAlign: titleAlign || "left" }}>
        {title}
      </HtmlTypo>
    )}
    {description && (
      <HtmlTypo variant="body2" sx={{ mb: 2, color: "text.secondary", textAlign: titleAlign || "left" }}>
        {description}
      </HtmlTypo>
    )}
    <Box sx={{ borderRadius: websiteRadius(3), overflow: "hidden", boxShadow: 2, lineHeight: 0 }}>
      {toEmbedUrl(url)?.includes("youtube.com") || toEmbedUrl(url)?.includes("youtu.be") || toEmbedUrl(url)?.includes("vimeo.com") ? (
        <Box sx={{ position: "relative", pt: "56.25%" }}>
          <iframe
            src={toEmbedUrl(url)}
            title={toPlain(title) || "video"}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
          />
        </Box>
      ) : (
        <video
          src={url}
          controls
          preload="metadata"
          poster={poster}
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      )}
    </Box>
  </Container>
);

const VideoStorySplit = ({
  followSiteTheme = true,
  eyebrow,
  title,
  body,
  ctaText,
  ctaLink,
  videoUrl,
  poster,
  videoPosition = "left",
  mediaAspectRatio = "16 / 9",
  contentBackground = "var(--page-secondary-bg, var(--page-card-bg, rgba(255,255,255,0.92)))",
  contentColor = "var(--page-body-color, inherit)",
  titleColor = "var(--page-heading-color, currentColor)",
  contentPadding = 48,
  maxWidth = "full",
  borderRadius = 4,
}) => {
  const themeDriven = followSiteTheme !== false;
  const resolvedUrl = toEmbedUrl(videoUrl);
  const isEmbed =
    resolvedUrl?.includes("youtube.com") ||
    resolvedUrl?.includes("youtu.be") ||
    resolvedUrl?.includes("vimeo.com");
  const videoFirst = String(videoPosition || "left").toLowerCase() !== "right";
  const resolvedMax = toContainerMax(maxWidth);
  const paddingValue = typeof contentPadding === "number" ? `${contentPadding}px` : contentPadding;
  const radiusValue = typeof borderRadius === "number" ? websiteRadius(borderRadius) : websiteRadius(4);
  const resolvedContentBackground = themeDriven
    ? "var(--page-secondary-bg, var(--page-card-bg, rgba(255,255,255,0.92)))"
    : contentBackground;
  const resolvedContentColor = themeDriven
    ? "var(--page-body-color, inherit)"
    : contentColor;
  const resolvedTitleColor = themeDriven
    ? "var(--page-heading-color, currentColor)"
    : titleColor;

  return (
    <Container maxWidth={resolvedMax} disableGutters={resolvedMax === false} sx={{ px: resolvedMax === false ? 0 : undefined }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.02fr) minmax(0, 0.98fr)" },
          alignItems: "stretch",
          width: "100%",
          overflow: "hidden",
          borderRadius: `${radiusValue}px`,
          border: "1px solid color-mix(in srgb, var(--page-heading-color, rgba(0,0,0,0.16)) 12%, rgba(255,255,255,0.12))",
          boxShadow: "var(--page-card-shadow, 0 24px 64px rgba(0,0,0,0.18))",
          backgroundColor: "var(--page-card-bg, rgba(255,255,255,0.92))",
        }}
      >
        <Box
          sx={{
            order: { xs: 1, md: videoFirst ? 1 : 2 },
            minHeight: { xs: 320, md: 560 },
            backgroundColor: "color-mix(in srgb, var(--page-secondary-bg, #f7d7df) 68%, rgba(255,255,255,0.22))",
            lineHeight: 0,
          }}
        >
          {isEmbed ? (
            <Box sx={{ position: "relative", width: "100%", height: "100%", minHeight: { xs: 320, md: 560 } }}>
              <iframe
                src={resolvedUrl}
                title={toPlain(title) || "video story"}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
              />
            </Box>
          ) : (
            <video
              src={resolvedUrl}
              controls
              preload="metadata"
              poster={poster}
              style={{
                width: "100%",
                height: "100%",
                minHeight: "100%",
                display: "block",
                objectFit: "cover",
                aspectRatio: mediaAspectRatio || "16 / 9",
              }}
            />
          )}
        </Box>

        <Box
          sx={{
            order: { xs: 2, md: videoFirst ? 2 : 1 },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: resolvedContentBackground,
            color: resolvedContentColor,
            minHeight: { xs: "auto", md: 560 },
          }}
        >
          <Stack
            spacing={3}
            sx={{
              width: "100%",
              maxWidth: 620,
              px: { xs: 3, md: paddingValue },
              py: { xs: 4, md: 5 },
              textAlign: "center",
            }}
          >
            {eyebrow && (
              <HtmlTypo
                variant="overline"
                sx={{
                  letterSpacing: ".2em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  color: resolvedContentColor,
                  opacity: 0.86,
                }}
              >
                {eyebrow}
              </HtmlTypo>
            )}
            {title && (
              <HtmlTypo
                variant="h3"
                sx={{
                  fontWeight: 300,
                  letterSpacing: "-0.01em",
                  color: resolvedTitleColor,
                  fontSize: { xs: "2rem", md: "3rem" },
                }}
              >
                {title}
              </HtmlTypo>
            )}
            {body && (
              <HtmlTypo
                variant="body1"
                sx={{
                  color: resolvedContentColor,
                  opacity: 0.92,
                  lineHeight: 1.8,
                  maxWidth: 560,
                  mx: "auto",
                }}
              >
                {body}
              </HtmlTypo>
            )}
            {ctaText && (
              <Box>
                <Button
                  variant="contained"
                  href={ctaLink || "#"}
                  sx={{
                    px: 3.25,
                    py: 1.3,
                    textTransform: "uppercase",
                    letterSpacing: ".18em",
                    fontWeight: 700,
                  }}
                >
                  {toPlain(ctaText)}
                </Button>
              </Box>
            )}
          </Stack>
        </Box>
      </Box>
    </Container>
  );
};

const normalizeLogoItem = (item) => {
  if (!item) return null;
  if (typeof item === "string") {
    return { label: item, src: null };
  }
  if (typeof item === "object") {
    const label = item.label ?? item.alt ?? item.name ?? item.title ?? "";
    return {
      src: item.src || item.image || item.logo || item.logoUrl || null,
      label,
      imageShape: item.imageShape || item.shape || "",
      caption: item.caption ?? item.subtitle ?? "",
      meta: item.meta ?? item.price ?? "",
      description: item.description ?? "",
      ctaText: item.ctaText ?? item.cta ?? "",
      ctaLink: item.ctaLink ?? item.href ?? "",
      highlight: Boolean(item.highlight ?? item.featured),
      features: toArray(item.features),
    };
  }
  return null;
};

const LogoCloud = ({
  followSiteTheme = true,
  title,
  caption,
  logos = [],
  showLabels = false,
  monochrome = false,
  maxWidth,
  titleAlign,
  supportingText,
  supportingTextAlign,
  variant = "grid",
  badgeStyle = {},
  tabs = [],
  tabsAlign = "center",
  cardRadius = 4,
  imageShape = "rounded",
}) => {
  const entries = toArray(logos)
    .map(normalizeLogoItem)
    .filter((item) => item && (item?.src || item?.label || item?.caption));
  const themeDriven = followSiteTheme !== false;

  const tabEntries = toArray(tabs)
    .map((tab) => {
      if (!tab) return null;
      if (typeof tab === "string") return { label: tab, href: "#" };
      if (typeof tab === "object") {
        return {
          label: tab.label || tab.name || tab.title || "",
          href: tab.href || tab.link || tab.to || "#",
        };
      }
      return null;
    })
    .filter((tab) => tab && tab.label);

  const normalizedVariant = typeof variant === "string" ? variant.toLowerCase() : "grid";
  const normalizedImageShape =
    typeof imageShape === "string" ? imageShape.toLowerCase() : "rounded";
  const hasEntries = entries.length > 0;
  const resolvedTitleAlign = titleAlign || "left";
  const resolvedSupportingAlign = supportingTextAlign || resolvedTitleAlign;
  const shapeMetrics = (shape) => {
    const normalized = typeof shape === "string" ? shape.toLowerCase() : "rounded";
    if (normalized === "rectangle") return { width: 248, height: 160, radius: websiteRadius(4) };
    if (normalized === "circle") return { width: 224, height: 224, radius: "50%" };
    if (normalized === "square") return { width: 224, height: 224, radius: 0 };
    return { width: 224, height: 224, radius: websiteRadius(4) };
  };

  const renderGrid = () => (
    <Grid container spacing={3} alignItems="center" justifyContent="center">
      {entries.map((item, idx) => (
        <Grid item xs={6} sm={4} md={2} key={idx}>
          <Box
            sx={{
              opacity: 0.9,
              "&:hover": { opacity: 1 },
              textAlign: "center",
              minHeight: 48,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {item?.src ? (
              <img
                src={item.src}
                alt={item.alt || item.label || ""}
                loading="lazy"
                style={{
                  maxWidth: "100%",
                  height: 36,
                  objectFit: "contain",
                  filter: monochrome ? "grayscale(1)" : "none",
                }}
              />
            ) : (
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                }}
              >
                {item.label}
              </Typography>
            )}
            {showLabels && item.label && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.5 }}
              >
                {item.label}
              </Typography>
            )}
          </Box>
        </Grid>
      ))}
    </Grid>
  );

  const alignSx = (align) => {
    switch (align) {
      case "center":
        return { textAlign: "center", mx: "auto" };
      case "right":
        return { textAlign: "right", ml: "auto" };
      default:
        return { textAlign: "left" };
    }
  };

  const justifyFromAlign = (align) => {
    switch (align) {
      case "center":
        return "center";
      case "right":
        return "flex-end";
      default:
        return "flex-start";
    }
  };

  const renderBadges = () => {
    const labelStyle = {
      fontWeight: 700,
      letterSpacing: ".12em",
      textTransform: "uppercase",
      color: themeDriven
        ? "var(--page-heading-color, currentColor)"
        : "#e0f2fe",
      ...badgeStyle,
    };

    return (
      <Stack
        direction="row"
        spacing={2}
        flexWrap="wrap"
        justifyContent="center"
        rowGap={2}
      >
        {entries.map((item, idx) => (
          <Card
            key={idx}
            elevation={0}
            sx={{
              background: themeDriven
                ? "var(--page-card-bg, rgba(255,255,255,0.92))"
                : "rgba(5,17,37,0.65)",
              border: themeDriven
                ? "1px solid color-mix(in srgb, var(--page-heading-color, rgba(0,0,0,0.18)) 10%, rgba(255,255,255,0.15))"
                : "1px solid rgba(148,163,184,0.28)",
              boxShadow: themeDriven
                ? "var(--page-card-shadow, 0 24px 44px rgba(8,23,53,0.14))"
                : "0 24px 44px rgba(8,23,53,0.32)",
              color: themeDriven
                ? "var(--page-heading-color, currentColor)"
                : "#f8fafc",
              borderRadius: "var(--page-card-radius, 4px)",
              px: 3,
              py: 3,
              minWidth: 220,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1.25,
              textAlign: "center",
            }}
          >
            <Typography variant="subtitle2" sx={labelStyle}>
              {item.label}
            </Typography>
            {(showLabels || item.caption) && (
              <Typography
                variant="caption"
                sx={{
                  opacity: 0.85,
                  letterSpacing: ".05em",
                  color: themeDriven
                    ? "var(--page-body-color, inherit)"
                    : undefined,
                }}
              >
                {item.caption || item.label}
              </Typography>
            )}
          </Card>
        ))}
      </Stack>
    );
  };

  const resolvedCardRadius = websiteRadius(Number(cardRadius) || 4);

  const renderCards = () => (
    <Grid
      container
      spacing={3}
      className="logo-cloud-card-grid"
      alignItems="stretch"
    >
      {entries.map((item, idx) => {
        const features = toArray(item.features);
        return (
          <Grid item xs={12} sm={6} md={3} key={idx}>
          <Card
            elevation={0}
            className={`logo-cloud-card${item.highlight ? " featured" : ""}`}
              sx={{
              height: "100%",
              borderRadius: resolvedCardRadius,
              p: 3,
              display: "flex",
                flexDirection: "column",
                gap: 2,
                textAlign: "center",
                "& .logo-cloud-card-label": {
                  fontSize: ".95rem",
                  fontWeight: 800,
                  letterSpacing: ".22em",
                  color: themeDriven
                    ? "var(--page-heading-color, currentColor)"
                    : undefined,
                },
                "& .logo-cloud-card-meta": {
                  fontSize: "2.5rem",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  color: themeDriven
                    ? "var(--page-heading-color, currentColor)"
                    : undefined,
                },
                "& .logo-cloud-card-caption": {
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: themeDriven
                    ? "var(--page-body-color, inherit)"
                    : undefined,
                },
                "& .logo-cloud-card-image-wrap": {
                  width: "100%",
                  minHeight: 232,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginInline: "auto",
                  marginBottom: 4,
                },
                "& .logo-cloud-card-image": {
                  width: 224,
                  height: 224,
                  objectFit: "cover",
                  objectPosition: "center",
                  display: "block",
                  borderRadius: websiteRadius(4),
                  border: themeDriven
                    ? "1px solid color-mix(in srgb, var(--page-heading-color, rgba(0,0,0,0.18)) 10%, rgba(255,255,255,0.15))"
                    : "1px solid rgba(203,255,247,0.55)",
                  background: themeDriven
                    ? "color-mix(in srgb, var(--page-secondary-bg, rgba(255,255,255,0.92)) 72%, rgba(255,255,255,0.38))"
                    : "radial-gradient(circle at 30% 20%, rgba(170,255,245,0.38), rgba(255,255,255,0.05))",
                  boxShadow: themeDriven
                    ? "var(--page-card-shadow, 0 20px 42px rgba(6,10,22,0.14))"
                    : "0 20px 42px rgba(6,10,22,0.38), 0 0 36px rgba(143,255,237,0.42)",
                },
              }}
            >
              {item.src && (
                <Box
                  className="logo-cloud-card-image-wrap"
                  sx={{
                    minHeight:
                      shapeMetrics(item.imageShape || normalizedImageShape).height + 8,
                  }}
                >
                  <Box
                    component="img"
                    src={item.src}
                    alt={toPlain(item.label || item.caption || "")}
                    loading="lazy"
                    className="logo-cloud-card-image"
                    sx={{
                      width: shapeMetrics(item.imageShape || normalizedImageShape).width,
                      height: shapeMetrics(item.imageShape || normalizedImageShape).height,
                      borderRadius:
                        shapeMetrics(item.imageShape || normalizedImageShape).radius,
                    }}
                  />
                </Box>
              )}
              {item.label && (
                <Typography
                  variant="subtitle2"
                  className="logo-cloud-card-label"
                  sx={{ letterSpacing: ".12em", textTransform: "uppercase" }}
                >
                  {item.label}
                </Typography>
              )}
              {item.meta && (
                <Typography
                  variant="h4"
                  className="logo-cloud-card-meta"
                  sx={{ fontWeight: 800 }}
                >
                  {item.meta}
                </Typography>
              )}
              {item.caption && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  className="logo-cloud-card-caption"
                >
                  {item.caption}
                </Typography>
              )}
              {item.description && (
                <Typography
                  variant="body2"
                  className="logo-cloud-card-description"
                  sx={{
                    color: themeDriven
                      ? "var(--page-body-color, inherit)"
                      : "text.primary",
                    opacity: 0.85,
                  }}
                >
                  {item.description}
                </Typography>
              )}
              {features.length > 0 && (
                <Stack
                  spacing={0.75}
                  className="logo-cloud-card-features"
                  sx={{ textAlign: "left", mx: "auto" }}
                >
                  {features.map((f, i) => (
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      key={i}
                    >
                      <CheckIcon fontSize="small" />
                      <Typography
                        variant="body2"
                        sx={{
                          color: themeDriven
                            ? "var(--page-body-color, inherit)"
                            : undefined,
                        }}
                      >
                        {toPlain(f)}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              )}
              {item.ctaText && (
                <Button
                  href={item.ctaLink || "#"}
                  className="logo-cloud-card-cta"
                  variant="contained"
                  sx={{ mt: "auto" }}
                >
                  {item.ctaText}
                </Button>
              )}
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );

  return (
    <Container maxWidth={toContainerMax(maxWidth)}>
      {title && (
        <HtmlTypo
          variant="h6"
          sx={{
            mb: caption || supportingText ? 0.5 : 2,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: ".06em",
            color: themeDriven ? "var(--page-heading-color, currentColor)" : undefined,
            ...alignSx(resolvedTitleAlign),
          }}
        >
          {title}
        </HtmlTypo>
      )}
      {caption && (
        <HtmlTypo
          variant="body2"
          sx={{
            mb: supportingText ? 1 : 2,
            color: themeDriven
              ? "var(--page-body-color, text.secondary)"
              : "text.secondary",
            ...alignSx(resolvedTitleAlign),
          }}
        >
          {caption}
        </HtmlTypo>
      )}
      {supportingText && (
        <HtmlTypo
          variant="body1"
          sx={{
            mb: 3,
            color: themeDriven
              ? "var(--page-body-color, text.secondary)"
              : "text.secondary",
            maxWidth: 720,
            ...alignSx(resolvedSupportingAlign),
          }}
        >
          {supportingText}
        </HtmlTypo>
      )}
      {tabEntries.length > 0 && (
        <Stack
          direction="row"
          spacing={1.5}
          flexWrap="wrap"
          justifyContent={justifyFromAlign(tabsAlign || resolvedTitleAlign)}
          sx={{ mb: 3 }}
        >
          {tabEntries.map((tab, idx) => (
            <Button
              key={idx}
              href={tab.href || "#"}
              variant="outlined"
              className="logo-cloud-tabs-button"
              size="small"
              sx={{
                textTransform: "uppercase",
                letterSpacing: ".2em",
                fontWeight: 700,
                borderRadius: websiteRadius(4),
              }}
            >
              {tab.label}
            </Button>
          ))}
        </Stack>
      )}
      {hasEntries &&
        (normalizedVariant === "badges"
          ? renderBadges()
          : normalizedVariant === "cards"
          ? renderCards()
          : renderGrid())}
    </Container>
  );
};

const LogoCarousel = ({
  title,
  caption,
  logos = [],
  maxWidth,
  titleAlign,
  intervalMs = 4000,
  showDots = true,
  followSiteTheme = true,
}) => {
  const themeDriven = followSiteTheme !== false;
  const entries = toArray(logos)
    .map(normalizeLogoItem)
    .filter((it) => it && (it.src || it.label));

  const interval = clamp(intervalMs || 4000, 1500, 12000);
  const reduced = usePrefersReducedMotion();
  const autoplayDisabled = reduced || entries.length <= 1;
  const [index, setIndex, setPaused] = useAutoplay(
    entries.length || 1,
    interval,
    autoplayDisabled
  );

  if (!entries.length) return null;

  const safeIndex = index % entries.length;
  const active = entries[safeIndex] || {};
  const label = toPlain(active.label || "");

  return (
    <Container maxWidth={toContainerMax(maxWidth)}>
      {title && (
        <HtmlTypo
          variant="h6"
          sx={{
            mb: caption ? 0.5 : 2,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: ".06em",
            textAlign: titleAlign || "center",
            color: themeDriven ? "var(--page-heading-color, currentColor)" : undefined,
          }}
        >
          {title}
        </HtmlTypo>
      )}
      {caption && (
        <HtmlTypo
          variant="body2"
          sx={{
            mb: 2,
            color: themeDriven ? "var(--page-body-color, text.secondary)" : "text.secondary",
            textAlign: titleAlign || "center",
          }}
        >
          {caption}
        </HtmlTypo>
      )}
      <Stack
        spacing={2}
        alignItems="center"
        onMouseEnter={() => !autoplayDisabled && setPaused(true)}
        onMouseLeave={() => !autoplayDisabled && setPaused(false)}
      >
        <Card
          elevation={6}
          sx={{
            px: 4,
            py: 3,
            minWidth: { xs: "100%", sm: 280 },
            maxWidth: 320,
            textAlign: "center",
            borderRadius: "var(--page-card-radius, 4px)",
            backdropFilter: themeDriven ? "var(--page-card-blur, none)" : "blur(12px)",
            backgroundColor: themeDriven
              ? "var(--page-card-bg, rgba(255,255,255,0.92))"
              : "rgba(255,255,255,0.28)",
            border: themeDriven
              ? "1px solid color-mix(in srgb, var(--page-heading-color, rgba(0,0,0,0.18)) 10%, rgba(255,255,255,0.15))"
              : "1px solid rgba(178,64,24,0.35)",
            boxShadow: themeDriven
              ? "var(--page-card-shadow, 0 8px 30px rgba(0,0,0,0.08))"
              : undefined,
          }}
        >
          {active.src ? (
            <Box
              component="img"
              src={active.src}
              alt={label}
              loading="lazy"
              sx={{
                maxWidth: "100%",
                height: 56,
                objectFit: "contain",
                display: "block",
                mx: "auto",
              }}
            />
          ) : (
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                letterSpacing: ".04em",
                color: themeDriven ? "var(--page-heading-color, currentColor)" : undefined,
              }}
            >
              {label}
            </Typography>
          )}
          {active.src && label && (
            <Typography
              variant="subtitle2"
              color={themeDriven ? "var(--page-body-color, text.secondary)" : "text.secondary"}
              sx={{ mt: 1, textTransform: "uppercase", letterSpacing: ".12em" }}
            >
              {label}
            </Typography>
          )}
        </Card>
        {showDots && entries.length > 1 && (
          <Stack direction="row" spacing={1}>
            {entries.map((_, i) => (
              <Box
                key={i}
                onClick={() => setIndex(i)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setIndex(i)}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: i === index ? "text.primary" : "divider",
                  cursor: "pointer",
                  outlineOffset: 2,
                }}
              />
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  );
};

const TestimonialCarousel = ({
  title,
  reviews = [],
  autoplay = true,
  intervalMs = 4000,
  showDots = true,
  showArrows = true,
  perView = {},
  maxWidth = "lg",
}) => {
  const entries = toArray(reviews)
    .map((item) => ({
      name: item?.name ?? "",
      rating: Number(item?.rating ?? 0),
      source: item?.source ?? "",
      ago: item?.ago ?? "",
      text: item?.text ?? "",
    }))
    .filter((item) => item.text);

  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up("md"));
  const smUp = useMediaQuery(theme.breakpoints.up("sm"));

  const perDesktop = clamp(Number(perView?.desktop) || 3, 1, 5);
  const perTablet = clamp(Number(perView?.tablet) || 2, 1, perDesktop);
  const perMobile = clamp(Number(perView?.mobile) || 1, 1, perTablet);
  const cardsPerView = mdUp ? perDesktop : smUp ? perTablet : perMobile;

  const slideCount = Math.max(1, entries.length - cardsPerView + 1);
  const reduced = usePrefersReducedMotion();
  const autoplayDisabled = reduced || !autoplay || slideCount <= 1;
  const interval = clamp(intervalMs || 4000, 1500, 15000);
  const [index, setIndex, setPaused] = useAutoplay(slideCount, interval, autoplayDisabled);

  React.useEffect(() => {
    setIndex((prev) => {
      if (prev >= slideCount) return Math.max(0, slideCount - 1);
      return prev;
    });
  }, [slideCount, setIndex]);

  if (!entries.length) return null;

  const translate = `translate3d(-${(index * 100) / cardsPerView}%, 0, 0)`;
  const cardWidth = {
    xs: `${100 / perMobile}%`,
    sm: `${100 / perTablet}%`,
    md: `${100 / perDesktop}%`,
  };

  const goTo = (next) => {
    if (slideCount <= 1) return;
    setIndex(next);
  };
  const handlePrev = () => goTo((index - 1 + slideCount) % slideCount);
  const handleNext = () => goTo((index + 1) % slideCount);

  return (
    <Container maxWidth={toContainerMax(maxWidth)}>
      {title && (
        <HtmlTypo variant="h4" sx={{ textAlign: "left", fontWeight: 800, mb: 3 }}>
          {title}
        </HtmlTypo>
      )}
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          {showArrows && slideCount > 1 && (
            <IconButton
              aria-label="Show previous testimonials"
              onClick={handlePrev}
              className="carousel-arrow carousel-arrow-prev"
            >
              <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>
          )}
          <Box
            sx={{ overflow: "hidden", width: "100%" }}
            onMouseEnter={() => !autoplayDisabled && setPaused(true)}
            onMouseLeave={() => !autoplayDisabled && setPaused(false)}
          >
            <Box
              sx={{
                display: "flex",
                transition: "transform .6s ease",
                transform: translate,
                gap: { xs: 2, md: 3 },
              }}
              className="testimonial-carousel-track"
            >
              {entries.map((item, idx) => (
                <Box
                  key={idx}
                  sx={{
                    flex: {
                      xs: `0 0 ${cardWidth.xs}`,
                      sm: `0 0 ${cardWidth.sm}`,
                      md: `0 0 ${cardWidth.md}`,
                    },
                    minWidth: { xs: cardWidth.xs, sm: cardWidth.sm, md: cardWidth.md },
                    boxSizing: "border-box",
                  }}
                >
                  <Box
                    className="testimonial-card"
                    sx={{
                      backgroundColor: "background.paper",
                      borderRadius: websiteRadius(2),
                      border: "1px solid",
                      borderColor: "divider",
                      boxShadow: "0 10px 24px rgba(15,23,42,0.08)",
                      p: { xs: 2.5, md: 3 },
                      display: "grid",
                      gridTemplateRows: "auto 1fr auto",
                      rowGap: 1.5,
                      minHeight: 220,
                    }}
                  >
                    <Box className="testimonial-card-top" sx={{ display: "grid", rowGap: 0.5 }}>
                      <Box
                        className="stars"
                        aria-label={`${Math.round(clamp(item.rating, 0, 5)) || 5} out of 5 stars`}
                        sx={{ fontSize: 18, color: "#f59e0b", letterSpacing: "2px" }}
                      >
                        {"★".repeat(Math.round(clamp(item.rating, 0, 5)) || 5)}
                      </Box>
                      <Typography className="testimonial-name" variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {toPlain(item.name) || "Client"}
                      </Typography>
                    </Box>
                    <Typography className="testimonial-text" variant="body2" sx={{ color: "text.primary", lineHeight: 1.5 }}>
                      {toPlain(item.text)}
                    </Typography>
                    <Typography className="testimonial-meta" variant="body2" sx={{ color: "text.secondary" }}>
                      {[item.source, item.ago].filter(Boolean).join(" • ")}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
          {showArrows && slideCount > 1 && (
            <IconButton
              aria-label="Show next testimonials"
              onClick={handleNext}
              className="carousel-arrow carousel-arrow-next"
            >
              <ArrowForwardIosIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
        {showDots && slideCount > 1 && (
          <Stack direction="row" spacing={1} justifyContent="center" className="carousel-dots">
            {Array.from({ length: slideCount }).map((_, dotIdx) => (
              <Box
                key={dotIdx}
                component="button"
                role="button"
                tabIndex={0}
                aria-label={`Go to testimonials slide ${dotIdx + 1}`}
                aria-current={dotIdx === index}
                onClick={() => goTo(dotIdx)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && goTo(dotIdx)}
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  bgcolor: dotIdx === index ? "text.primary" : "divider",
                  cursor: "pointer",
                  outlineOffset: 2,
                  border: 0,
                  padding: 0,
                }}
              />
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  );
};



const FeaturePillars = ({
  followSiteTheme = true,
  title,
  caption,
  badge,
  pillars = [],
  layout = "dense",
  card = {},
  maxWidth,
  titleAlign = "center",
  intervalMs = 4000,
  background,
}) => {
  const themeDriven = followSiteTheme !== false;
  const entries = toArray(pillars)
    .map((item) => ({
      icon: toPlain(item?.icon ?? "") || (item?.label ?? "").toString().charAt(0),
      label: item?.label ?? "",
      heading: item?.heading ?? "",
      summary: item?.summary ?? "",
      bullets: toArray(item?.bullets),
      metrics: toArray(item?.metrics),
    }))
    .filter((it) => it.heading || it.summary || it.bullets.length);

  const count = entries.length;

  const cardPadding = Number(card?.padding ?? 24);
  const contentGap = Number(card?.gap ?? 12);
  const radius = websiteRadius(Number(card?.radius ?? 4));
  const iconSize = Number(card?.iconSize ?? 48);
  const gridGapPx = Number(card?.gridGap ?? 32);
  const gridSpacing = Math.max(3, clamp(Math.round(gridGapPx / 8), 1, 6));

  const sectionBackground =
    themeDriven
      ? "var(--page-secondary-bg, linear-gradient(135deg, #fff1f4 0%, #f7d7df 52%, #e9b7c6 100%))"
      : background || card?.sectionBackground || "linear-gradient(90deg, #2DC8FF 0%, #2FE6C8 100%)";
  const cardSurface = themeDriven
    ? "var(--page-card-bg, rgba(255,255,255,0.92))"
    : card?.surface || "rgba(255,255,255,0.92)";
  const cardHoverSurface = themeDriven
    ? "var(--page-card-bg, rgba(255,255,255,0.98))"
    : card?.hoverSurface || "rgba(255,255,255,1)";
  const cardShadow = themeDriven
    ? "var(--page-card-shadow, 0 16px 40px rgba(15,23,42,0.18))"
    : card?.shadow || "0 16px 40px rgba(15,23,42,0.18)";
  const ringColor = themeDriven
    ? "color-mix(in srgb, var(--page-heading-color, rgba(15,23,42,0.12)) 10%, rgba(255,255,255,0.15))"
    : card?.ringColor || "rgba(15,23,42,0.08)";
  const chipBg = themeDriven
    ? "color-mix(in srgb, var(--page-link-color, #2563eb) 12%, rgba(255,255,255,0.88))"
    : card?.chipBg || "rgba(191,219,254,0.45)";
  const chipColor = themeDriven
    ? "var(--page-link-color, #1d4ed8)"
    : card?.chipColor || "#1d4ed8";
  const chipBorder = themeDriven
    ? "color-mix(in srgb, var(--page-link-color, #2563eb) 24%, rgba(255,255,255,0.18))"
    : card?.chipBorder || "rgba(37,99,235,0.35)";
  const badgeSurface = themeDriven
    ? "color-mix(in srgb, var(--page-link-color, #2563eb) 12%, rgba(255,255,255,0.88))"
    : card?.badgeSurface || "rgba(37,99,235,0.12)";
  const badgeText = themeDriven
    ? "var(--page-link-color, rgba(37,99,235,0.95))"
    : card?.badgeText || "rgba(37,99,235,0.95)";
  const iconBg = themeDriven
    ? "color-mix(in srgb, var(--page-link-color, #2563eb) 12%, rgba(255,255,255,0.88))"
    : card?.iconBg ?? card?.badgeBg ?? "rgba(37,99,235,0.12)";
  const iconColor = themeDriven
    ? "var(--page-link-color, #1d4ed8)"
    : card?.iconColor ?? card?.badgeColor ?? "#1d4ed8";
  const headingColor = themeDriven
    ? "var(--page-heading-color, #0f172a)"
    : card?.headingColor || "#0f172a";
  const bodyColor = themeDriven
    ? "var(--page-body-color, rgba(15,23,42,0.72))"
    : card?.bodyColor || "rgba(15,23,42,0.72)";

  const interval = clamp(intervalMs || 4000, 1500, 12000);
  const reduced = usePrefersReducedMotion();
  const autoplayDisabled = reduced || count <= 1;
  const [index, setIndex, setPaused] = useAutoplay(Math.max(count, 1), interval, autoplayDisabled);
  const safeIndex = count ? index % count : 0;
  const active = count ? entries[safeIndex] || {} : {};

  if (!count) return null;

  const resolvedMax = toContainerMax(maxWidth || "xl");

  const PillarCard = ({ pillar }) => (
    <Card
      elevation={0}
      sx={{
        p: cardPadding,
        borderRadius: radius,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        textAlign: "left",
        gap: contentGap,
        backgroundColor: cardSurface,
        border: `1px solid ${ringColor}`,
        color: headingColor,
        boxShadow: cardShadow,
        backdropFilter: "blur(8px)",
        transition: "transform 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease",
        minHeight: 0,
        width: "100%",
        maxWidth: 400,
        mx: "auto",
        '&:hover': {
          transform: "translateY(-4px)",
          backgroundColor: cardHoverSurface,
          boxShadow: "0 28px 60px rgba(15,23,42,0.24)",
        },
      }}
    >
      <Box
        sx={{
          width: iconSize,
          height: iconSize,
          borderRadius: "50%",
          backgroundColor: iconBg,
          color: iconColor,
          fontWeight: 600,
          fontSize: Math.max(18, iconSize * 0.36),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textTransform: "uppercase",
          letterSpacing: ".06em",
        }}
      >
        {toPlain(pillar.icon || pillar.label?.charAt(0) || "")}
      </Box>
      {pillar.label && (
        <Typography variant="caption" sx={{ textTransform: "uppercase", letterSpacing: ".16em", color: "rgba(37,99,235,0.9)", fontWeight: 600 }}>
          {toPlain(pillar.label)}
        </Typography>
      )}
      {pillar.heading && (
        <Typography variant="h5" sx={{ fontSize: "1.4rem", fontWeight: 700, color: headingColor, lineHeight: 1.3 }}>
          {toPlain(pillar.heading)}
        </Typography>
      )}
      {pillar.summary && (
        <Typography
          variant="body1"
          sx={{ color: bodyColor, mt: 1, maxWidth: 380, lineHeight: 1.6, fontSize: "1.03rem", letterSpacing: "-0.01em" }}
        >
          {toPlain(pillar.summary)}
        </Typography>
      )}
      {!!pillar.bullets.length && (
        <Box
          component="ul"
          sx={{
            listStyle: "none",
            m: 0,
            mt: 2,
            p: 0,
            display: "flex",
            flexDirection: "column",
            gap: Math.max(10, contentGap + 2),
            fontSize: "0.98rem",
            lineHeight: 1.62,
            color: "rgba(30,41,59,0.86)",
            width: "100%",
          }}
        >
          {pillar.bullets.map((bullet, idx) => (
            <Box
              component="li"
              key={idx}
              sx={{
                position: "relative",
                pl: 2.4,
                '&::before': {
                  content: '""',
                  position: "absolute",
                  left: 0,
                  top: "0.8em",
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  backgroundColor: "rgba(37,99,235,0.35)",
                  transform: "translateY(-50%)",
                },
              }}
            >
              {toPlain(bullet)}
            </Box>
          ))}
        </Box>
      )}
      {!!pillar.metrics.length && (
        <Stack direction="row" flexWrap="wrap" justifyContent="flex-start" spacing={1.2} rowGap={1.2} sx={{ mt: "auto", pt: 2 }}>
          {pillar.metrics.map((metric, idx) => {
            const label = toPlain(metric?.label ?? "");
            const value = toPlain(metric?.value ?? "");
            const text = label ? `${label} · ${value}` : value;
            if (!text) return null;
            return (
              <Box
                key={idx}
                sx={{
                  px: 1.2,
                  py: 0.5,
                  borderRadius: websiteRadius(4),
                  backgroundColor: chipBg,
                  color: chipColor,
                  border: `1px solid ${chipBorder}`,
                  fontSize: "0.88rem",
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                }}
              >
                {text}
              </Box>
            );
          })}
        </Stack>
      )}
    </Card>
  );

  return (
    <Box sx={{ position: "relative", overflow: "hidden", py: { xs: 10, md: 14 } }}>
      <Box sx={{ position: "absolute", inset: 0, zIndex: 0, background: sectionBackground }} />
      <Container maxWidth={resolvedMax} sx={{ position: "relative", zIndex: 1, textAlign: titleAlign }}>
        {badge && (
          <Box
            sx={{
              display: "inline-flex",
              px: 2.4,
              py: 0.75,
              borderRadius: websiteRadius(4),
              backgroundColor: badgeSurface,
              color: badgeText,
              fontSize: 12,
              letterSpacing: ".24em",
              fontWeight: 600,
              textTransform: "uppercase",
              mx: titleAlign === "center" ? "auto" : 0,
              mb: 3,
            }}
          >
            {toPlain(badge)}
          </Box>
        )}
        {title && (
          <HtmlTypo
            variant="h3"
            sx={{
              mb: caption ? 2 : 5,
              fontWeight: 700,
              fontSize: { xs: "2rem", md: "2.75rem" },
              letterSpacing: "-0.015em",
              color: "#fff",
            }}
          >
            {title}
          </HtmlTypo>
        )}
        {caption && (
          <HtmlTypo
            variant="body1"
            sx={{
              mb: 5,
              color: "rgba(255,255,255,0.85)",
              fontSize: { xs: "1rem", md: "1.1rem" },
              maxWidth: 760,
              mx: titleAlign === "center" ? "auto" : 0,
            }}
          >
            {caption}
          </HtmlTypo>
        )}
        {layout === "carousel" ? (
          <Stack
            spacing={3}
            alignItems="center"
            onMouseEnter={() => !autoplayDisabled && setPaused(true)}
            onMouseLeave={() => !autoplayDisabled && setPaused(false)}
          >
            <Box sx={{ width: "100%", maxWidth: 420 }}>
              <PillarCard pillar={active} />
            </Box>
            {entries.length > 1 && (
              <Stack direction="row" spacing={1}>
                {entries.map((_, i) => (
                  <Box
                    key={i}
                    onClick={() => setIndex(i)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setIndex(i)}
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: i === safeIndex ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.35)",
                      cursor: "pointer",
                      outlineOffset: 2,
                    }}
                  />
                ))}
              </Stack>
            )}
          </Stack>
        ) : (
          <Box
            sx={{
              display: "grid",
              gap: gridGapPx,
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            }}
          >
            {entries.map((pillar, idx) => (
              <PillarCard key={idx} pillar={pillar} />
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
};


const FeatureStories = ({
  followSiteTheme = true,
  title,
  caption,
  legend = [],
  stories = [],
  metrics = [],
  maxWidth,
  titleAlign = "left",
  legendAlign = "center",
  card = {},
}) => {
  const themeDriven = followSiteTheme !== false;
  const entries = toArray(stories)
    .map((item) => ({
      icon: toPlain(item?.icon ?? ""),
      title: item?.title ?? "",
      subtitle: item?.subtitle ?? "",
      statLabel: item?.statLabel ?? "",
      statValue: item?.statValue ?? "",
      description: item?.description ?? "",
      feature: item?.feature ?? "",
      bullets: toArray(item?.bullets).slice(0, 3),
      chips: toArray(item?.chips),
      ctaText: item?.ctaText ?? "",
      ctaLink: item?.ctaLink ?? "",
      background: item?.background ?? "",
    }))
    .filter((story) => story.title || story.description || story.statValue);

  if (!entries.length) return null;

  const rawPadding = card?.padding ?? 26;
  const padding = typeof rawPadding === "number" ? `${rawPadding}px` : rawPadding;
  const rawRadius = card?.radius ?? 4;
  const radius = typeof rawRadius === "number" ? toWebsiteRadiusPx(rawRadius) : toWebsiteRadiusPx(4);
  const rawGap = card?.gap ?? 32;
  const gap = typeof rawGap === "number" ? Number(rawGap) : rawGap;
  const gapXs = card?.gapXs ?? (typeof gap === "number" ? Math.min(gap, 28) : gap);
  const rawMaxContainer = card?.maxWidth ?? 1440;
  const maxContainer = typeof rawMaxContainer === "number" ? `${rawMaxContainer}px` : rawMaxContainer;
  const sectionBackground = themeDriven
    ? "var(--page-secondary-bg, linear-gradient(135deg, #fff1f4 0%, #f7d7df 52%, #e9b7c6 100%))"
    : card?.sectionBackground || "linear-gradient(135deg, #1d4ed8 0%, #14b8a6 100%)";

  const cardSurface = themeDriven ? "var(--page-card-bg, #ffffff)" : card?.surface || "#ffffff";
  const cardBorder = themeDriven
    ? "color-mix(in srgb, var(--page-heading-color, rgba(15,23,42,0.08)) 10%, rgba(255,255,255,0.15))"
    : card?.borderColor || "rgba(15,23,42,0.08)";
  const cardShadow = themeDriven
    ? "var(--page-card-shadow, 0 10px 24px rgba(15,23,42,0.12))"
    : card?.shadow || "0 10px 24px rgba(15,23,42,0.12)";
  const cardShadowHover = themeDriven
    ? "var(--page-card-shadow, 0 20px 42px rgba(15,23,42,0.18))"
    : card?.shadowHover || "0 20px 42px rgba(15,23,42,0.18)";
  const headingColor = themeDriven ? "var(--page-heading-color, #0f172a)" : card?.headingColor || "#0f172a";
  const bodyColor = themeDriven ? "var(--page-body-color, rgba(51,65,85,0.88))" : card?.bodyColor || "rgba(51,65,85,0.88)";
  const badgeBg = themeDriven
    ? "color-mix(in srgb, var(--page-link-color, #2563eb) 14%, rgba(255,255,255,0.85))"
    : card?.badgeBg || "rgba(37,99,235,0.16)";
  const badgeColor = themeDriven ? "var(--page-link-color, #2563eb)" : card?.badgeColor || "#2563eb";
  const chipBgDefault = themeDriven
    ? "color-mix(in srgb, var(--page-link-color, #2563eb) 10%, rgba(255,255,255,0.92))"
    : card?.chipBg || "rgba(226,232,240,0.9)";
  const chipColorDefault = themeDriven ? "var(--page-heading-color, #1f2937)" : card?.chipColor || "#1f2937";
  const chipBorderDefault = themeDriven
    ? "color-mix(in srgb, var(--page-heading-color, rgba(15,23,42,0.08)) 10%, rgba(255,255,255,0.18))"
    : card?.chipBorder || "rgba(15,23,42,0.08)";
  const legendBg = themeDriven
    ? "color-mix(in srgb, var(--page-card-bg, rgba(255,255,255,0.92)) 80%, rgba(255,255,255,0.12))"
    : card?.legendBg || "rgba(255,255,255,0.72)";
  const legendColor = themeDriven ? "var(--page-body-color, rgba(15,23,42,0.7))" : card?.legendColor || "rgba(15,23,42,0.7)";
  const metricBg = themeDriven
    ? "color-mix(in srgb, var(--page-link-color, #2563eb) 12%, rgba(255,255,255,0.86))"
    : card?.metricBg || "rgba(255,255,255,0.18)";
  const metricColor = themeDriven ? "var(--page-heading-color, #0f172a)" : card?.metricColor || "#0f172a";
  const blur = Number(card?.blur ?? 0);
  const columnMinWidth = Number(card?.columnMinWidth ?? 320);
  const columnCount = Number.isFinite(Number(card?.columns)) && Number(card?.columns) > 0 ? Number(card?.columns) : 3;
  const gridTemplateMd = card?.gridTemplateMd || `repeat(auto-fit, minmax(${columnMinWidth}px, 1fr))`;
  const gridTemplateLg =
    card?.gridTemplateLg || (Number.isFinite(columnCount) && columnCount > 0 ? `repeat(${columnCount}, minmax(${columnMinWidth}px, 1fr))` : `repeat(auto-fit, minmax(${columnMinWidth}px, 1fr))`);
  const headingSize = card?.headingSize || "1.25rem";
  const bodyFontSize = card?.bodyFontSize || "1rem";
  const bodyLineHeight = Number(card?.bodyLineHeight ?? 1.6);
  const bulletFontSize = card?.bulletFontSize || bodyFontSize;
  const bulletLineHeight = Number(card?.bulletLineHeight ?? 1.6);
  const bulletGap = Number(card?.bulletGap ?? 10);
  const chipFontSize = card?.chipFontSize || 12;

  const Legend = () =>
    legend.length ? (
      <Stack
        direction="row"
        spacing={1}
        justifyContent={legendAlign === "center" ? "center" : legendAlign === "right" ? "flex-end" : "flex-start"}
        sx={{ mb: 3, flexWrap: "wrap", rowGap: 1.2 }}
      >
        {legend.map((item, idx) => (
          <Box
            key={idx}
            sx={{
              px: 1.75,
              py: 0.65,
              borderRadius: websiteRadius(4),
              backgroundColor: legendBg,
              color: legendColor,
              fontSize: 12,
              letterSpacing: ".18em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            {toPlain(item)}
          </Box>
        ))}
      </Stack>
    ) : null;

  const renderBadge = (story) => {
    const icon = story.icon;
    if (icon && icon.length === 1 && /[a-z0-9]/i.test(icon)) {
      return icon.toUpperCase();
    }
    if (story.feature) {
      return story.feature.toString().charAt(0).toUpperCase();
    }
    return "";
  };

  return (
    <Box sx={{ position: "relative", background: sectionBackground }}>
      <Container
        maxWidth={false}
        sx={{
          maxWidth: maxContainer,
          mx: "auto",
          px: { xs: 2, md: 6, lg: 8 },
          py: { xs: 8, md: 12 },
        }}
      >
        {title && (
          <HtmlTypo
            variant="h3"
            sx={{
              mb: caption ? 2 : 5,
              fontWeight: 700,
              fontSize: { xs: "2rem", md: "2.6rem" },
              letterSpacing: "-0.015em",
              color: themeDriven ? "var(--page-heading-color, #0f172a)" : "#f8fafc",
              textAlign: titleAlign,
            }}
          >
            {title}
          </HtmlTypo>
        )}
        {caption && (
          <HtmlTypo
            variant="body1"
            sx={{
              mb: 4,
              color: themeDriven ? "var(--page-body-color, rgba(51,65,85,0.88))" : "rgba(248,250,252,0.85)",
              fontSize: { xs: "1rem", md: "1.1rem" },
              maxWidth: 720,
              mx: titleAlign === "center" ? "auto" : 0,
              textAlign: titleAlign,
            }}
          >
            {caption}
          </HtmlTypo>
        )}
        <Legend />
        <Box
          sx={{
            display: "grid",
            gap: {
              xs: typeof gapXs === "number" ? `${gapXs}px` : gapXs,
              md: typeof gap === "number" ? `${gap}px` : gap,
            },
            gridTemplateColumns: {
              xs: "repeat(1, minmax(0, 1fr))",
              md: gridTemplateMd,
              lg: gridTemplateLg,
            },
          }}
        >
          {entries.map((story, idx) => {
            const chips = story.chips.length
              ? story.chips
              : story.statLabel && story.statValue
              ? [`${story.statLabel} · ${story.statValue}`]
              : [];
            const ctaColor = story.ctaColor || card?.ctaColor || "#2563eb";
            const letter = renderBadge(story);
            return (
              <Card
                key={idx}
                sx={{
                  p: padding,
                  borderRadius: radius,
                  border: `1px solid ${cardBorder}`,
                  boxShadow: cardShadow,
                  backgroundColor: cardSurface,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  minHeight: 0,
                  transition: "transform 0.25s ease, box-shadow 0.25s ease",
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: cardShadowHover,
                  },
                  ...(blur
                    ? {
                        backdropFilter: `blur(${blur}px)`,
                        WebkitBackdropFilter: `blur(${blur}px)`,
                      }
                    : {}),
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      backgroundColor: badgeBg,
                      color: badgeColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 600,
                      fontSize: 16,
                      letterSpacing: ".06em",
                    }}
                  >
                    {toPlain(letter)}
                  </Box>
                  <Typography variant="caption" sx={{ textTransform: "uppercase", letterSpacing: ".16em", color: badgeColor, fontWeight: 600 }}>
                    {toPlain(story.feature || story.statLabel)}
                  </Typography>
                </Stack>
                {story.title && (
                  <Typography variant="h5" sx={{ fontSize: headingSize, fontWeight: 700, color: headingColor, letterSpacing: "-0.01em" }}>
                    {toPlain(story.title)}
                  </Typography>
                )}
                {story.description && (
                  <Typography variant="body1" sx={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                    {toPlain(story.description)}
                  </Typography>
                )}
                {!!story.bullets.length && (
                  <Box
                    component="ul"
                    sx={{
                      m: 0,
                      mt: "16px",
                      p: 0,
                      listStyle: "none",
                      display: "flex",
                      flexDirection: "column",
                      gap: `${bulletGap}px`,
                      color: bodyColor,
                      fontSize: bulletFontSize,
                    }}
                  >
                    {story.bullets.map((bullet, bulletIdx) => (
                      <Typography
                        component="li"
                        key={bulletIdx}
                        sx={{
                          position: "relative",
                          pl: 2,
                          lineHeight: bulletLineHeight,
                          '&::before': {
                            content: '""',
                            position: "absolute",
                            left: 0,
                            top: "0.65em",
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            backgroundColor: badgeColor,
                            opacity: 0.75,
                            transform: "translateY(-50%)",
                          },
                        }}
                      >
                        {toPlain(bullet)}
                      </Typography>
                    ))}
                  </Box>
                )}
                <Box sx={{ flexGrow: 1 }} />
                {!!chips.length && (
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" rowGap={1} sx={{ mt: 2 }}>
                    {chips.map((chip, chipIdx) => (
                      <Box
                        key={chipIdx}
                        sx={{
                          px: 1.2,
                          py: 0.45,
                          borderRadius: websiteRadius(4),
                          backgroundColor: chipBgDefault,
                          color: chipColorDefault,
                          border: `1px solid ${chipBorderDefault}`,
                          fontSize: chipFontSize,
                          fontWeight: 600,
                        }}
                      >
                        {toPlain(chip)}
                      </Box>
                    ))}
                  </Stack>
                )}
                {story.ctaText && (
                  <Button
                    variant="outlined"
                    href={story.ctaLink || "#"}
                    sx={{
                      alignSelf: "flex-start",
                      mt: 2.5,
                      fontWeight: 600,
                      textTransform: "none",
                      color: ctaColor,
                      borderColor: `${ctaColor}55`,
                      '&:hover': {
                        borderColor: ctaColor,
                        backgroundColor: `${ctaColor}14`,
                      },
                    }}
                  >
                    {toPlain(story.ctaText)}
                  </Button>
                )}
              </Card>
            );
          })}
        </Box>
        {!!metrics.length && (
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ mt: 4, flexWrap: "wrap", rowGap: 1.5 }}
            justifyContent={titleAlign === "center" ? "center" : titleAlign === "right" ? "flex-end" : "flex-start"}
          >
            {metrics.map((metric, idx) => (
              <Box
                key={idx}
                sx={{
                  px: 1.75,
                  py: 0.7,
                  borderRadius: websiteRadius(4),
                  backgroundColor: metricBg,
                  color: metricColor,
                  fontWeight: 600,
                  fontSize: 13,
                  letterSpacing: ".02em",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                {toPlain(metric)}
              </Box>
            ))}
          </Stack>
        )}
      </Container>
    </Box>
  );
};
const TestimonialTiles = ({
  followSiteTheme = true,
  title,
  caption,
  testimonials = [],
  style = "grid",
  card = {},
  maxWidth,
  titleAlign,
  intervalMs = 4000,
  showDots = true,
}) => {
  const themeDriven = followSiteTheme !== false;
  const entries = toArray(testimonials)
    .map((item) => ({
      brand: item?.brand ?? "",
      badge: item?.badge ?? "",
      quote: item?.quote ?? "",
      author: item?.author ?? "",
      role: item?.role ?? "",
      avatar: item?.avatar ?? "",
    }))
    .filter((item) => item.quote);

  const count = entries.length;

  const padding = Number(card?.padding ?? 16);
  const gap = Number(card?.gap ?? 10);
  const radius = websiteRadius(Number(card?.radius ?? 4));
  const avatarSize = Number(card?.avatarSize ?? 30);

  const interval = clamp(intervalMs || 4000, 1500, 12000);
  const reduced = usePrefersReducedMotion();
  const autoplayDisabled = reduced || count <= 1 || style !== "slider";
  const [index, setIndex, setPaused] = useAutoplay(Math.max(count, 1), interval, autoplayDisabled);
  const safeIndex = count ? index % count : 0;
  const active = count ? entries[safeIndex] || {} : {};

  if (!count) return null;

  const Tile = ({ item }) => (
    <Card
      elevation={6}
      sx={{
        p: padding,
        borderRadius: radius,
        display: "flex",
        flexDirection: "column",
        gap: Math.max(4, gap - 4),
        boxShadow: themeDriven
          ? "var(--page-card-shadow, 0 16px 40px rgba(120,45,6,0.24))"
          : "0 16px 40px rgba(120,45,6,0.24)",
        background: themeDriven
          ? "var(--page-card-bg, rgba(255,255,255,0.92))"
          : "linear-gradient(155deg, rgba(255,199,171,0.24), rgba(120,45,6,0.82))",
        border: themeDriven
          ? "1px solid color-mix(in srgb, var(--page-heading-color, rgba(15,23,42,0.1)) 10%, rgba(255,255,255,0.18))"
          : "1px solid rgba(178,64,24,0.32)",
        color: themeDriven ? "var(--page-heading-color, #0f172a)" : "#fff7ed",
        minHeight: 200,
      }}
    >
      <Stack direction="row" spacing={Math.max(4, gap - 6)} alignItems="center">
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: themeDriven ? "var(--page-heading-color, #0f172a)" : "#fff7ed", letterSpacing: ".04em", fontSize: 13 }}>
          {toPlain(item.brand)}
        </Typography>
        {item.badge && (
          <Box
            sx={{
              px: 1,
              py: 0.5,
              borderRadius: websiteRadius(4),
              backgroundColor: themeDriven
                ? "color-mix(in srgb, var(--page-link-color, #2563eb) 12%, rgba(255,255,255,0.88))"
                : "rgba(255,220,200,0.3)",
              color: themeDriven ? "var(--page-link-color, #2b0a05)" : "#2b0a05",
              fontSize: 10,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              ml: "auto",
            }}
          >
            {toPlain(item.badge)}
          </Box>
        )}
      </Stack>
      <Typography variant="body2" sx={{ color: themeDriven ? "var(--page-body-color, rgba(15,23,42,0.78))" : "#fff4eb", lineHeight: 1.45 }}>
        {`“${toPlain(item.quote)}”`}
      </Typography>
      <Stack direction="row" spacing={Math.max(4, gap - 6)} alignItems="center" sx={{ mt: "auto" }}>
        <Box
          sx={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: websiteRadius(4),
            background: themeDriven
              ? "color-mix(in srgb, var(--page-link-color, #2563eb) 8%, rgba(255,255,255,0.86))"
              : "rgba(255,220,200,0.2)",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {item.avatar ? (
            <Box component="img" src={item.avatar} alt="" loading="lazy" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : null}
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: themeDriven ? "var(--page-heading-color, #0f172a)" : "#ffe7d6", fontSize: 12 }}>
            {toPlain(item.author)}
          </Typography>
          {item.role && (
            <Typography variant="caption" sx={{ color: themeDriven ? "var(--page-body-color, rgba(15,23,42,0.72))" : "rgba(255,231,214,0.85)" }}>
              {toPlain(item.role)}
            </Typography>
          )}
        </Box>
      </Stack>
    </Card>
  );

  return (
    <Container maxWidth={toContainerMax(maxWidth)}>
      {title && (
        <HtmlTypo
          variant="h5"
          sx={{
            mb: caption ? 0.5 : 2,
            fontWeight: 800,
            textAlign: titleAlign || "left",
            color: themeDriven ? "var(--page-heading-color, currentColor)" : undefined,
          }}
        >
          {title}
        </HtmlTypo>
      )}
      {caption && (
        <HtmlTypo
          variant="body2"
          sx={{
            mb: 2,
            color: themeDriven ? "var(--page-body-color, text.secondary)" : "text.secondary",
            textAlign: titleAlign || "left",
          }}
        >
          {caption}
        </HtmlTypo>
      )}
      {style === "slider" ? (
        <Stack
          spacing={2}
          alignItems="center"
          onMouseEnter={() => !autoplayDisabled && setPaused(true)}
          onMouseLeave={() => !autoplayDisabled && setPaused(false)}
        >
          <Tile item={active} />
          {showDots && entries.length > 1 && (
            <Stack direction="row" spacing={1}>
              {entries.map((_, i) => (
                <Box
                  key={i}
                  onClick={() => setIndex(i)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setIndex(i)}
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: i === safeIndex ? "text.primary" : "divider",
                    cursor: "pointer",
                    outlineOffset: 2,
                  }}
                />
              ))}
            </Stack>
          )}
        </Stack>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap,
          }}
        >
          {entries.map((item, idx) => (
            <Box key={idx} sx={{ flex: "1 1 240px", maxWidth: 360 }}>
              <Tile item={item} />
            </Box>
          ))}
        </Box>
      )}
    </Container>
  );
};

const ReviewEditorialGrid = ({
  followSiteTheme = true,
  title = "",
  subtitle = "",
  reviewCountLabel = "",
  platformLabel = "",
  entries = [],
  buttonText = "",
  buttonLink = "",
  maxWidth = "xl",
  titleAlign = "center",
}) => {
  const themeDriven = followSiteTheme !== false;
  const items = toArray(entries)
    .map((item) => ({
      name: item?.name ?? "",
      badge: item?.badge ?? "",
      ratingLabel: item?.ratingLabel ?? "",
      text: item?.text ?? "",
      image: item?.image ?? "",
      imageAlt: item?.imageAlt ?? "",
    }))
    .filter((item) => item.name || item.text || item.image);

  if (!items.length) return null;

  const headingColor = themeDriven ? "var(--page-heading-color, #2b2119)" : "#2b2119";
  const bodyColor = themeDriven ? "var(--page-body-color, rgba(43,33,25,0.82))" : "rgba(43,33,25,0.82)";
  const dividerColor = themeDriven
    ? "color-mix(in srgb, var(--page-heading-color, #2b2119) 18%, rgba(255,255,255,0.24))"
    : "rgba(43,33,25,0.18)";
  const softBadgeColor = themeDriven
    ? "color-mix(in srgb, var(--page-link-color, #3b2416) 70%, #16a34a 30%)"
    : "#2f6f3e";
  const starColor = "#1f2937";

  return (
    <Container maxWidth={toContainerMax(maxWidth)}>
      <Stack spacing={3.5}>
        {(title || subtitle) && (
          <Stack spacing={0.8} sx={{ textAlign: titleAlign }}>
            {title ? (
              <HtmlTypo
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: headingColor,
                  textAlign: titleAlign,
                }}
              >
                {title}
              </HtmlTypo>
            ) : null}
            {subtitle ? (
              <HtmlTypo
                variant="body1"
                sx={{
                  color: bodyColor,
                  textAlign: titleAlign,
                }}
              >
                {subtitle}
              </HtmlTypo>
            ) : null}
          </Stack>
        )}

        {(reviewCountLabel || platformLabel) && (
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={1.5}
          >
            <Stack spacing={0.5}>
              <Box sx={{ color: starColor, letterSpacing: "0.18em", fontSize: 20, lineHeight: 1 }}>
                ★★★★★
              </Box>
              {reviewCountLabel ? (
                <HtmlTypo variant="subtitle2" sx={{ fontWeight: 700, color: headingColor }}>
                  {reviewCountLabel}
                </HtmlTypo>
              ) : null}
            </Stack>
            {platformLabel ? (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ color: headingColor }}>
                <Box component="span" sx={{ color: "#10b981", fontSize: 18, lineHeight: 1 }}>★</Box>
                <HtmlTypo variant="subtitle1" sx={{ fontWeight: 800 }}>
                  {platformLabel}
                </HtmlTypo>
              </Stack>
            ) : null}
          </Stack>
        )}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: { xs: 3, md: 0 },
          }}
        >
          {items.map((item, idx) => {
            return (
              <Box
                key={`${item.name || "review"}-${idx}`}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 196px" },
                  alignItems: "stretch",
                  borderTop: `1px solid ${dividerColor}`,
                  borderRight: {
                    xs: "none",
                    md: idx % 2 === 0 ? `1px solid ${dividerColor}` : "none",
                  },
                  pt: 2,
                  pb: 2,
                  pr: { xs: 0, md: idx % 2 === 0 ? 2 : 0 },
                  pl: { xs: 0, md: idx % 2 === 1 ? 2 : 0 },
                  columnGap: 2,
                }}
              >
                <Stack
                  spacing={1.1}
                  sx={{
                    order: 0,
                    minWidth: 0,
                  }}
                >
                  <Stack direction="row" spacing={0.8} alignItems="center" flexWrap="wrap">
                    {item.name ? (
                      <HtmlTypo variant="subtitle1" sx={{ fontWeight: 800, color: headingColor }}>
                        {item.name}
                      </HtmlTypo>
                    ) : null}
                    {item.badge ? (
                      <HtmlTypo
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          color: softBadgeColor,
                        }}
                      >
                        {item.badge}
                      </HtmlTypo>
                    ) : null}
                  </Stack>
                  <Box sx={{ color: starColor, letterSpacing: "0.12em", fontSize: 16, lineHeight: 1 }}>
                    ★★★★★
                  </Box>
                  {item.text ? (
                    <HtmlTypo variant="body2" sx={{ color: bodyColor, lineHeight: 1.65 }}>
                      {item.text}
                    </HtmlTypo>
                  ) : null}
                </Stack>
                {item.image ? (
                  <Box
                    component="img"
                    src={item.image}
                    alt={toPlain(item.imageAlt) || ""}
                    loading="lazy"
                    sx={{
                      order: 1,
                      width: "100%",
                      height: { xs: 220, md: 236 },
                      objectFit: "cover",
                      borderRadius: websiteRadius(2),
                      mt: { xs: 1.5, md: 0 },
                    }}
                  />
                ) : null}
              </Box>
            );
          })}
        </Box>

        {buttonText ? (
          <Stack direction="row" justifyContent="center" sx={{ pt: 0.5 }}>
            <Button
              component="a"
              href={buttonLink || "#"}
              variant="contained"
              sx={{
                borderRadius: "var(--page-btn-radius, 4px)",
                px: 2.8,
                py: 1.05,
                textTransform: "none",
                fontWeight: 800,
              }}
            >
              {toPlain(buttonText)}
            </Button>
          </Stack>
        ) : null}
      </Stack>
    </Container>
  );
};

const Stats = ({
  title,
  subtitle,
  items = [],
  columns,
  titleAlign,
  maxWidth,
  disclaimer,
  titleColor,
  subtitleColor,
  followSiteTheme = true,
  style = "cards",
  animateValues = false,
  countDurationMs = 1400,
}) => {
  const themeDriven = followSiteTheme !== false;
  const list = toArray(items);
  const [sectionRef, sectionSeen] = useInViewOnce();
  const resolvedStyle = String(style || "cards").toLowerCase() === "band" ? "band" : "cards";
  const columnCount = Math.max(1, Math.min(6, Number(columns) || Math.min(Math.max(list.length, 1), 4)));
  return (
    <Container maxWidth={toContainerMax(maxWidth)} ref={sectionRef}>
      {title && (
        <HtmlTypo
          variant="h4"
          sx={{
            mb: subtitle ? 1 : 2,
            fontWeight: 800,
            textAlign: titleAlign || "left",
            ...((themeDriven
              ? "var(--page-heading-color, currentColor)"
              : titleColor)
              ? { color: themeDriven ? "var(--page-heading-color, currentColor)" : titleColor }
              : {}),
          }}
        >
          {title}
        </HtmlTypo>
      )}
      {subtitle && (
        <HtmlTypo
          variant="body1"
          sx={{
            mb: 3,
            color: themeDriven
              ? "var(--page-body-color, text.secondary)"
              : subtitleColor
                ? subtitleColor
                : "var(--page-body-color, text.secondary)",
            textAlign: titleAlign || "left",
          }}
        >
          {subtitle}
        </HtmlTypo>
      )}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns:
            resolvedStyle === "band"
              ? {
                  xs: "repeat(2, minmax(0, 1fr))",
                  sm: `repeat(${Math.min(columnCount, 2)}, minmax(0, 1fr))`,
                  md: `repeat(${columnCount}, minmax(0, 1fr))`,
                }
              : { xs: "1fr", sm: "repeat(2, 1fr)", md: `repeat(${Math.min(columnCount, 4)}, 1fr)` },
          gap: resolvedStyle === "band" ? { xs: 3, md: 4 } : 3,
          maxWidth: 1200,
          mx: "auto",
          alignItems: "stretch",
        }}
      >
        {list.map((s, i) => (
          resolvedStyle === "band" ? (
            <Box
              key={i}
              sx={{
                textAlign: "center",
                py: { xs: 1.5, md: 2.5 },
                px: { xs: 1, md: 1.5 },
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: { xs: 90, md: 120 },
              }}
            >
              <Typography
                component="div"
                sx={{
                  color: "var(--page-heading-color, currentColor)",
                  fontWeight: 700,
                  fontSize: { xs: "2.35rem", md: "3.2rem" },
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                  mb: 1.25,
                }}
              >
                <CountUpValue
                  value={s.value}
                  active={animateValues && sectionSeen}
                  durationMs={countDurationMs}
                />
              </Typography>
              <Typography
                variant="overline"
                sx={{
                  color: "var(--page-body-color, text.secondary)",
                  letterSpacing: "0.18em",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  fontSize: "0.9rem",
                }}
              >
                {toPlain(s.label)}
              </Typography>
            </Box>
          ) : (
            <Card key={i} sx={{ textAlign: "center", p: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 120 }}>
              <Typography
                variant="h4"
                fontWeight={900}
                sx={{ color: "var(--page-heading-color, currentColor)" }}
              >
                <CountUpValue
                  value={s.value}
                  active={animateValues && sectionSeen}
                  durationMs={countDurationMs}
                />
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "var(--page-body-color, text.secondary)" }}
              >
                {toPlain(s.label)}
              </Typography>
            </Card>
          )
        ))}
      </Box>
      {disclaimer && (
        <HtmlTypo
          variant="caption"
          sx={{
            display: "block",
            mt: 1,
            color: "var(--page-body-color, text.secondary)",
          }}
        >
          {disclaimer}
        </HtmlTypo>
      )}
    </Container>
  );
};

const ContactBlock = ({ title, intro, email, phone, address, mapEmbedUrl, titleAlign, maxWidth }) => (
  <Container maxWidth={toContainerMax(maxWidth)}>
    {title && (
      <HtmlTypo variant="h5" sx={{ mb: 1.5, fontWeight: 800, textAlign: titleAlign || "left" }}>
        {title}
      </HtmlTypo>
    )}
    {intro && (
      <HtmlTypo variant="body2" sx={{ mb: 2, color: "text.secondary", textAlign: titleAlign || "left" }}>
        {intro}
      </HtmlTypo>
    )}
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
              Contact us
            </Typography>
            {email && (
              <Typography sx={{ mt: 1 }}>
                <strong>Email:</strong> {toPlain(email)}
              </Typography>
            )}
            {phone && (
              <Typography>
                <strong>Phone:</strong> {toPlain(phone)}
              </Typography>
            )}
            {address && (
              <Typography>
                <strong>Address:</strong> {toPlain(address)}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        {mapEmbedUrl ? (
          <Box sx={{ borderRadius: websiteRadius(2), overflow: "hidden", height: 260 }}>
            <iframe
              src={mapEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              title="map"
            />
          </Box>
        ) : (
          <Card>
            <CardContent>
              <Typography color="text.secondary">Map unavailable</Typography>
            </CardContent>
          </Card>
        )}
      </Grid>
    </Grid>
  </Container>
);

const MapEmbed = ({
  provider = "google",
  query = "",
  embedUrl = "",
  height = 320,
  borderRadius = 4,
  maxWidth = "lg",
  title = "",
  titleAlign = "left",
  eyebrow = "",
  body = "",
  ctaText = "",
  ctaHref = "",
  detailOneTitle = "",
  detailOneText = "",
  detailTwoTitle = "",
  detailTwoText = "",
  detailThreeTitle = "",
  detailThreeText = "",
  matchHeight = true,
}) => {
  const resolvedUrl = (() => {
    if (embedUrl) return embedUrl;
    if (!query) return "";
    if (provider && String(provider).toLowerCase() !== "google") return "";
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  })();

  const detailBlocks = [
    { title: detailOneTitle, text: detailOneText },
    { title: detailTwoTitle, text: detailTwoText },
    { title: detailThreeTitle, text: detailThreeText },
  ].filter((item) => toPlain(item.title) || toPlain(item.text));

  const useSplitLayout =
    Boolean(toPlain(body)) ||
    Boolean(toPlain(eyebrow)) ||
    Boolean(toPlain(ctaText)) ||
    Boolean(toPlain(ctaHref)) ||
    detailBlocks.length > 0;

  const mapCard = (
    <Box
      sx={{
        width: "100%",
        height: matchHeight ? "100%" : "auto",
        minHeight: typeof height === "number" ? `${height}px` : height,
        display: "flex",
        flexDirection: "column",
        borderRadius: websiteRadius(borderRadius ?? 4),
        overflow: "hidden",
        boxShadow: "var(--page-card-shadow, 0 8px 30px rgba(0,0,0,0.08))",
        border: "1px solid rgba(148,163,184,0.18)",
        backgroundColor: "var(--page-card-bg, rgba(255,255,255,0.92))",
      }}
    >
      {resolvedUrl ? (
        <Box
          component="iframe"
          title={query || "Map"}
          src={resolvedUrl}
          loading="lazy"
          style={{ border: 0 }}
          sx={{ width: "100%", height: "100%", minHeight: typeof height === "number" ? `${height}px` : height, flex: 1 }}
          allowFullScreen
        />
      ) : (
        <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
          Map unavailable
        </Box>
      )}
    </Box>
  );

  if (useSplitLayout) {
    const containerMax = toContainerMax(maxWidth);
    const contentStack = (
      <Stack spacing={2.25}>
        {eyebrow ? (
          <HtmlTypo
            variant="overline"
            sx={{
              letterSpacing: "0.18em",
              color: "var(--page-body-color, rgba(15,23,42,0.72))",
            }}
          >
            {eyebrow}
          </HtmlTypo>
        ) : null}
        {title ? (
          <HtmlTypo
            variant="h2"
            sx={{
              fontWeight: 700,
              lineHeight: 1.12,
              letterSpacing: "-0.03em",
              fontSize: "clamp(2.1rem, 4.4vw, 4rem)",
              color: "var(--page-heading-color, #1f2937)",
              maxWidth: 440,
            }}
          >
            {title}
          </HtmlTypo>
        ) : null}
        {body ? (
          <HtmlTypo
            variant="body1"
            sx={{
              color: "var(--page-body-color, text.secondary)",
              maxWidth: 500,
              fontSize: "1.02rem",
              lineHeight: 1.65,
            }}
          >
            {body}
          </HtmlTypo>
        ) : null}
        {ctaText && ctaHref ? (
          <Box>
            <Button
              component="a"
              href={ctaHref}
              variant="contained"
              sx={{
                borderRadius: "var(--page-btn-radius, 4px)",
                textTransform: "none",
                px: 2.75,
                py: 1.15,
              }}
            >
              {ctaText}
            </Button>
          </Box>
        ) : null}
        {detailBlocks.length ? (
          <Grid container spacing={{ xs: 2, md: 2.5 }} sx={{ pt: 1 }}>
            {detailBlocks.map((item, idx) => (
              <Grid item xs={12} sm={detailBlocks.length === 1 ? 12 : 6} key={`${item.title || "detail"}-${idx}`}>
                <Box
                  sx={{
                    height: "100%",
                    borderTop: "1px solid rgba(148,163,184,0.16)",
                    pt: 1.75,
                  }}
                >
                  {item.title ? (
                    <HtmlTypo
                      variant="overline"
                      sx={{
                        letterSpacing: "0.16em",
                        fontWeight: 700,
                        color: "var(--page-heading-color, #1f2937)",
                        fontSize: "0.72rem",
                      }}
                    >
                      {item.title}
                    </HtmlTypo>
                  ) : null}
                  {item.text ? (
                    <HtmlTypo
                      variant="body2"
                      sx={{
                        mt: 1,
                        color: "var(--page-body-color, text.secondary)",
                        whiteSpace: "pre-line",
                        lineHeight: 1.6,
                        fontSize: "0.98rem",
                      }}
                    >
                      {item.text}
                    </HtmlTypo>
                  ) : null}
                </Box>
              </Grid>
            ))}
          </Grid>
        ) : null}
      </Stack>
    );

    if (!matchHeight) {
      return (
        <Container maxWidth={containerMax} disableGutters={containerMax === false}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "minmax(320px, 0.9fr) minmax(640px, 1.45fr)",
                lg: "minmax(340px, 0.85fr) minmax(760px, 1.55fr)",
              },
              columnGap: { xs: 0, md: 4, lg: 5 },
              rowGap: { xs: 3, md: 0 },
              alignItems: "start",
            }}
          >
            <Box>{contentStack}</Box>
            <Box sx={{ display: "flex", alignItems: "flex-start" }}>{mapCard}</Box>
          </Box>
        </Container>
      );
    }

    return (
      <Container maxWidth={containerMax} disableGutters={containerMax === false}>
        <Grid container spacing={{ xs: 3, md: 5 }} alignItems="stretch">
          <Grid item xs={12} md={5} lg={4}>
            {contentStack}
          </Grid>
          <Grid item xs={12} md={7} lg={8} sx={{ display: "flex", alignItems: "stretch" }}>
            {mapCard}
          </Grid>
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxWidth={toContainerMax(maxWidth)}>
      {title && (
        <HtmlTypo variant="h4" sx={{ mb: 2, fontWeight: 800, textAlign: titleAlign || "left" }}>
          {title}
        </HtmlTypo>
      )}
      {mapCard}
    </Container>
  );
};

const Footer = ({ text, maxWidth }) => (
  <Container maxWidth={toContainerMax(maxWidth)}>
    <Divider sx={{ my: 2 }} />
    {text ? (
      <HtmlTypo variant="body2" sx={{ color: "text.secondary", textAlign: "center" }}>
        {text}
      </HtmlTypo>
    ) : (
      <Typography variant="body2" color="text.secondary" align="center">
        © Your business
      </Typography>
    )}
  </Container>
);

const POPUP_MAX_WIDTH = {
  xs: 380,
  sm: 460,
  md: 560,
  lg: 680,
};

const PopupCta = ({
  enabled = false,
  triggerMode = "delay",
  delaySeconds = 8,
  scrollPercent = 45,
  showOncePerSession = true,
  dismissDays = 7,
  showCloseButton = true,
  showOnMobile = true,
  showOnDesktop = true,
  themeVariant = "light",
  eyebrow = "",
  title = "",
  body = "",
  ctaText = "Learn more",
  ctaLink = "#",
  image = "",
  imageAlt = "",
  imagePosition = "top",
  imageHeight = 220,
  overlayOpacity = 0.18,
  maxWidth = "sm",
  popupId = "popup",
  editorPreview = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [open, setOpen] = useState(Boolean(editorPreview));
  const storageKey = useMemo(() => {
    if (typeof window === "undefined") return `popup-cta:${popupId}`;
    return `popup-cta:${window.location.pathname}${window.location.search}:${popupId}`;
  }, [popupId]);

  useEffect(() => {
    if (editorPreview) {
      setOpen(true);
      return undefined;
    }
    if (!enabled) {
      setOpen(false);
      return undefined;
    }
    if ((isMobile && !showOnMobile) || (!isMobile && !showOnDesktop)) {
      setOpen(false);
      return undefined;
    }
    if (typeof window === "undefined") return undefined;

    const now = Date.now();
    const dismissedUntil = Number(window.localStorage.getItem(`${storageKey}:until`) || 0);
    const sessionDismissed = window.sessionStorage.getItem(`${storageKey}:session`);
    if (dismissedUntil > now) return undefined;
    if (showOncePerSession && sessionDismissed === "1") return undefined;

    let timer = 0;
    let detached = false;
    const openPopup = () => {
      if (!detached) setOpen(true);
    };

    if (triggerMode === "immediate") {
      openPopup();
      return undefined;
    }

    if (triggerMode === "scroll") {
      const threshold = Math.max(1, Math.min(100, Number(scrollPercent) || 45));
      const onScroll = () => {
        const doc = document.documentElement;
        const maxScroll = (doc.scrollHeight - window.innerHeight) || 1;
        const progress = (window.scrollY / maxScroll) * 100;
        if (progress >= threshold) {
          window.removeEventListener("scroll", onScroll);
          openPopup();
        }
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      return () => {
        detached = true;
        window.removeEventListener("scroll", onScroll);
      };
    }

    timer = window.setTimeout(openPopup, Math.max(0, Number(delaySeconds) || 0) * 1000);
    return () => {
      detached = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [
    delaySeconds,
    dismissDays,
    editorPreview,
    enabled,
    isMobile,
    scrollPercent,
    showOnDesktop,
    showOnMobile,
    showOncePerSession,
    storageKey,
    triggerMode,
  ]);

  const dismiss = () => {
    setOpen(false);
    if (typeof window === "undefined" || editorPreview) return;
    if (showOncePerSession) {
      window.sessionStorage.setItem(`${storageKey}:session`, "1");
    }
    const days = Math.max(0, Number(dismissDays) || 0);
    if (days > 0) {
      window.localStorage.setItem(
        `${storageKey}:until`,
        String(Date.now() + days * 24 * 60 * 60 * 1000)
      );
    }
  };

  if (!open) return null;

  const widthPx = POPUP_MAX_WIDTH[maxWidth] || POPUP_MAX_WIDTH.sm;
  const usesBackground = imagePosition === "background";
  const usesSideImage = image && (imagePosition === "left" || imagePosition === "right");
  const usesTopImage = image && !usesBackground && !usesSideImage;
  const darkVariant = themeVariant === "dark";
  const popupCard = (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        zIndex: 1,
        width: "100%",
        maxWidth: `${widthPx}px`,
        overflow: "hidden",
        borderRadius: websiteRadius(4),
        border: "1px solid rgba(148,163,184,0.18)",
        boxShadow: "0 32px 100px rgba(15,23,42,0.28)",
        bgcolor: darkVariant ? "#111827" : "var(--page-card-bg, rgba(255,255,255,0.98))",
        color: darkVariant ? "#f8fafc" : "var(--page-heading-color, #1f2937)",
      }}
    >
      {showCloseButton && (
        <IconButton
          size="small"
          aria-label="Close popup"
          onClick={dismiss}
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 2,
            bgcolor: "rgba(255,255,255,0.76)",
            border: "1px solid rgba(148,163,184,0.2)",
            "&:hover": { bgcolor: "rgba(255,255,255,0.92)" },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
      {usesBackground && image ? (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(180deg, rgba(15,23,42,${overlayOpacity}), rgba(15,23,42,${overlayOpacity * 1.5})), url(${image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.22,
          }}
        />
      ) : null}
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          gridTemplateColumns: usesSideImage
            ? { xs: "1fr", md: imagePosition === "left" ? "0.92fr 1.08fr" : "1.08fr 0.92fr" }
            : "1fr",
        }}
      >
        {usesSideImage && image ? (
          <Box
            component="img"
            src={image}
            alt={toPlain(imageAlt) || ""}
            loading="lazy"
            sx={{
              width: "100%",
              height: "100%",
              minHeight: { xs: 180, md: `${Math.max(240, Number(imageHeight) || 220)}px` },
              objectFit: "cover",
              order: imagePosition === "left" ? 0 : 1,
            }}
          />
        ) : null}
        <Box
          sx={{
            order: usesSideImage && imagePosition === "left" ? 1 : 0,
            p: { xs: 2.25, md: 3.25 },
          }}
        >
          {usesTopImage && image ? (
            <Box
              component="img"
              src={image}
              alt={toPlain(imageAlt) || ""}
              loading="lazy"
              sx={{
                width: "100%",
                height: `${Math.max(160, Number(imageHeight) || 220)}px`,
                objectFit: "cover",
                borderRadius: websiteRadius(3),
                mb: 2,
              }}
            />
          ) : null}
          <Stack spacing={1.6} sx={{ textAlign: "center", alignItems: "center" }}>
            {eyebrow ? (
              <HtmlTypo
                variant="overline"
                sx={{
                  letterSpacing: "0.16em",
                  textAlign: "center",
                  color: darkVariant ? "rgba(248,250,252,0.72)" : "var(--page-body-color, rgba(15,23,42,0.72))",
                }}
              >
                {eyebrow}
              </HtmlTypo>
            ) : null}
            {title ? (
              <HtmlTypo
                variant="h3"
                sx={{
                  fontWeight: 800,
                  lineHeight: 1.08,
                  fontSize: { xs: "2rem", md: "2.6rem" },
                  textAlign: "center",
                  color: darkVariant ? "#f8fafc" : "var(--page-heading-color, #1f2937)",
                }}
              >
                {title}
              </HtmlTypo>
            ) : null}
            {body ? (
              <HtmlTypo
                variant="body1"
                sx={{
                  textAlign: "center",
                  color: darkVariant ? "rgba(248,250,252,0.82)" : "var(--page-body-color, rgba(15,23,42,0.82))",
                  lineHeight: 1.65,
                }}
              >
                {body}
              </HtmlTypo>
            ) : null}
            {ctaText ? (
              <Box sx={{ pt: 0.6, display: "flex", justifyContent: "center", width: "100%" }}>
                <Button
                  component="a"
                  href={ctaLink || "#"}
                  variant="contained"
                  onClick={dismiss}
                  sx={{
                    borderRadius: "var(--page-btn-radius, 4px)",
                    px: 2.4,
                    py: 1.05,
                    textTransform: "none",
                    fontWeight: 800,
                  }}
                >
                  {toPlain(ctaText)}
                </Button>
              </Box>
            ) : null}
          </Stack>
        </Box>
      </Box>
    </Paper>
  );

  if (editorPreview) {
    return (
      <Container maxWidth={false} disableGutters>
        <Box sx={{ display: "flex", justifyContent: "center", px: { xs: 1, md: 2 }, py: 2 }}>
          {popupCard}
        </Box>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: (t) => t.zIndex.modal + 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 2, md: 3 },
      }}
    >
      <Box
        onClick={dismiss}
        sx={{
          position: "absolute",
          inset: 0,
          background: "rgba(15,23,42,0.44)",
          backdropFilter: "blur(4px)",
        }}
      />
      {popupCard}
    </Box>
  );
};

// Sticky conversion booster
const BookingCtaBar = ({
  text = "Ready to book?",
  buttonText = "See availability",
  buttonLink = "/services",
  titleAlign
}) => {
  const inlineAlignMatch = /text-align\s*:\s*(left|center|right|justify)/i.exec(String(text || ""));
  const inlineAlign = inlineAlignMatch ? inlineAlignMatch[1].toLowerCase() : null;
  const align = ((titleAlign || inlineAlign || "left") + "").toLowerCase();
  const isCenter = align === "center";
  const isRight = align === "right";
  return (
    <Box sx={{ position: "sticky", bottom: 16, zIndex: 1200 }}>
      <Container maxWidth="lg">
        <Box
          className="booking-cta-card"
          sx={{
            p: 2,
            borderRadius: websiteRadius(3),
            boxShadow: 6,
            bgcolor: "var(--page-card-bg, rgba(255,255,255,0.12))",
            display: "flex",
            gap: 2,
            alignItems: "center",
            justifyContent: isCenter ? "center" : "space-between",
            flexDirection: isCenter ? "column" : isRight ? "row-reverse" : "row",
            textAlign: align,
            border: (t) => `1px solid ${t.palette.divider}`
          }}
        >
          <HtmlTypo
            variant="subtitle1"
            className="booking-cta-text"
            sx={{ fontWeight: 700, m: 0, textAlign: titleAlign ? align : undefined }}
          >
            {text}
          </HtmlTypo>
          <Button href={buttonLink} variant="contained" size="large">
            {toPlain(buttonText)}
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

const Gallery = ({
  title,
  images = [],
  columns,
  columnsXs,
  columnsSm,
  columnsMd,
  titleAlign,
  maxWidth,
  layout = "grid",
  gap,
  tile,
  tileAspectRatio,
  tileBorderRadius,
  tileBorder,
  tileHoverLift,
  lightbox,
  lightboxEnabled,
  lightboxLoop,
  lightboxShowArrows,
  lightboxCloseOnBackdrop
}) => {
  const list = Array.isArray(images) ? images : [];
  const resolvedTile = tile || {
    aspectRatio: tileAspectRatio,
    borderRadius: tileBorderRadius,
    border: tileBorder,
    hoverLift: tileHoverLift
  };
  const resolvedLightbox = lightbox || {
    enabled: lightboxEnabled,
    loop: lightboxLoop,
    showArrows: lightboxShowArrows,
    closeOnBackdrop: lightboxCloseOnBackdrop
  };
  const resolvedGap = gap ?? 16;
  const resolvedColumns =
    columns ||
    (columnsXs || columnsSm || columnsMd
      ? { xs: columnsXs, sm: columnsSm, md: columnsMd }
      : 3);
  const normalizeItem = (it) => {
    if (typeof it === "string") return { url: it };
    return it || {};
  };
  const toAlt = (it) => (typeof it === "string" ? "" : (it?.alt || ""));
  const toPath = (it) => {
    if (typeof it === "string") return it;
    return it?.assetKey || it?.url || it?.src || "";
  };
  const parseAspectRatio = (value) => {
    if (!value) return null;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const raw = String(value);
    if (raw.includes("/")) {
      const [a, b] = raw.split("/").map((v) => Number(v));
      if (Number.isFinite(a) && Number.isFinite(b) && b !== 0) return a / b;
    }
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };
  const ratio = parseAspectRatio(resolvedTile?.aspectRatio);
  const thumbSize = ratio ? { w: 800, h: Math.round(800 / ratio), fit: "crop" } : { w: 800, fit: "crop" };
  const fullSize = { w: 2000, fit: "max" };
  const borderRadius = websiteRadius(resolvedTile?.borderRadius ?? 3);
  const border = resolvedTile?.border || "1px solid rgba(148,163,184,0.25)";
  const hoverLift = resolvedTile?.hoverLift ?? false;
  const lightboxOn = resolvedLightbox?.enabled ?? false;
  const [activeIndex, setActiveIndex] = useState(null);

  const columnsConf = (() => {
    if (resolvedColumns && typeof resolvedColumns === "object") {
      return {
        xs: resolvedColumns.xs || 2,
        sm: resolvedColumns.sm || resolvedColumns.xs || 2,
        md: resolvedColumns.md || resolvedColumns.sm || resolvedColumns.xs || 3,
      };
    }
    const num = Number(resolvedColumns) || 3;
    return { xs: 1, sm: Math.min(2, num), md: num };
  })();

  const gapValue = typeof resolvedGap === "number" ? resolvedGap : 0;
  const calcBasis = (count) => `calc(${(100 / count).toFixed(4)}% - ${gapValue}px)`;
  const itemBasis = {
    xs: calcBasis(columnsConf.xs),
    sm: calcBasis(columnsConf.sm),
    md: calcBasis(columnsConf.md),
  };

  const handleOpen = (index) => {
    if (!lightboxOn) return;
    setActiveIndex(index);
  };
  const closeLightbox = () => setActiveIndex(null);
  const showArrows = resolvedLightbox?.showArrows ?? true;
  const loop = resolvedLightbox?.loop ?? true;

  const currentItem = activeIndex != null ? normalizeItem(list[activeIndex]) : null;
  const currentPath = currentItem ? toPath(currentItem) : "";
  const currentFull = currentPath ? buildImgixUrl(currentPath, fullSize) : "";

  const goPrev = () => {
    if (activeIndex == null) return;
    if (activeIndex === 0) {
      if (loop) setActiveIndex(list.length - 1);
    } else {
      setActiveIndex(activeIndex - 1);
    }
  };
  const goNext = () => {
    if (activeIndex == null) return;
    if (activeIndex === list.length - 1) {
      if (loop) setActiveIndex(0);
    } else {
      setActiveIndex(activeIndex + 1);
    }
  };

  return (
    <Container maxWidth={toContainerMax(maxWidth)}>
      {title && (
        <HtmlTypo variant="h4" sx={{ mb: 2, fontWeight: 800, textAlign: titleAlign || "left" }}>
          {title}
        </HtmlTypo>
      )}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: typeof resolvedGap === "number" ? `${resolvedGap}px` : resolvedGap,
        }}
      >
        {list.map((item, i) => {
          const normalized = normalizeItem(item);
          const path = toPath(normalized);
          if (!path) return null;
          const thumb = buildImgixUrl(path, thumbSize);
          return (
            <Box
              key={i}
              role={lightboxOn ? "button" : undefined}
              onClick={() => handleOpen(i)}
              sx={{
                flex: "0 0 auto",
                flexBasis: itemBasis,
                maxWidth: itemBasis,
                width: "100%",
                borderRadius,
                border,
                overflow: "hidden",
                lineHeight: 0,
                cursor: lightboxOn ? "pointer" : "default",
                boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                ...(hoverLift
                  ? {
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 16px 32px rgba(15,23,42,0.18)",
                      },
                    }
                  : {}),
              }}
            >
              <Box
                component="img"
                src={thumb}
                alt={toAlt(normalized)}
                loading="lazy"
                sx={{
                  display: "block",
                  width: "100%",
                  height: "auto",
                  aspectRatio: ratio ? `${ratio}` : "auto",
                  objectFit: "cover",
                }}
              />
            </Box>
          );
        })}
      </Box>

      <Dialog
        open={activeIndex != null}
        onClose={(event, reason) => {
          if (reason === "backdropClick" && resolvedLightbox?.closeOnBackdrop === false) return;
          closeLightbox();
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "transparent",
            boxShadow: "none",
            overflow: "visible",
          },
        }}
      >
        {currentFull && (
          <Box sx={{ position: "relative", display: "flex", justifyContent: "center" }}>
            <IconButton
              onClick={closeLightbox}
              sx={{
                position: "absolute",
                top: -48,
                right: 0,
                color: "#fff",
                backgroundColor: "rgba(0,0,0,0.5)",
                "&:hover": { backgroundColor: "rgba(0,0,0,0.65)" },
              }}
            >
              <CloseIcon />
            </IconButton>
            {showArrows && list.length > 1 && (
              <>
                <IconButton
                  onClick={goPrev}
                  sx={{
                    position: "absolute",
                    left: -56,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#fff",
                    backgroundColor: "rgba(0,0,0,0.5)",
                    "&:hover": { backgroundColor: "rgba(0,0,0,0.65)" },
                  }}
                >
                  <ArrowBackIosNewIcon />
                </IconButton>
                <IconButton
                  onClick={goNext}
                  sx={{
                    position: "absolute",
                    right: -56,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#fff",
                    backgroundColor: "rgba(0,0,0,0.5)",
                    "&:hover": { backgroundColor: "rgba(0,0,0,0.65)" },
                  }}
                >
                  <ArrowForwardIosIcon />
                </IconButton>
              </>
            )}
            <Box
              component="img"
              src={currentFull}
              alt={toAlt(currentItem)}
              sx={{
                maxWidth: "100%",
                maxHeight: "80vh",
                borderRadius: websiteRadius(3),
                border: "1px solid rgba(255,255,255,0.15)",
                backgroundColor: "#111827",
              }}
            />
          </Box>
        )}
      </Dialog>
    </Container>
  );
};

const VideoGallery = ({
  title,
  videos = [],
  columns,
  columnsXs,
  columnsSm,
  columnsMd,
  titleAlign,
  maxWidth,
  layout = "grid",
  gap,
  tile,
  tileAspectRatio,
  tileBorderRadius,
  tileBorder,
  tileHoverLift,
  lightbox,
  lightboxEnabled,
  lightboxLoop,
  lightboxShowArrows,
  lightboxCloseOnBackdrop,
  ctaText,
  ctaLink,
}) => {
  const list = Array.isArray(videos) ? videos : [];
  const resolvedMax = toContainerMax(maxWidth);
  const resolvedTile = tile || {
    aspectRatio: tileAspectRatio,
    borderRadius: tileBorderRadius,
    border: tileBorder,
    hoverLift: tileHoverLift
  };
  const resolvedLightbox = lightbox || {
    enabled: lightboxEnabled,
    loop: lightboxLoop,
    showArrows: lightboxShowArrows,
    closeOnBackdrop: lightboxCloseOnBackdrop
  };
  const resolvedGap = gap ?? 16;
  const resolvedColumns =
    columns ||
    (columnsXs || columnsSm || columnsMd
      ? { xs: columnsXs, sm: columnsSm, md: columnsMd }
      : 3);

  const normalizeItem = (it) => (typeof it === "string" ? { video: it } : it || {});
  const toVideo = (it) => it?.video || it?.url || it?.src || it?.assetKey || it?.videoUrl || "";
  const toPoster = (it) => it?.poster || it?.posterUrl || it?.posterAssetKey || "";
  const toCaption = (it) => it?.caption || "";

  const parseAspectRatio = (value) => {
    if (!value) return null;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const raw = String(value);
    if (raw.includes("/")) {
      const [a, b] = raw.split("/").map((v) => Number(v));
      if (Number.isFinite(a) && Number.isFinite(b) && b !== 0) return a / b;
    }
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };
  const ratio = parseAspectRatio(resolvedTile?.aspectRatio);
  const borderRadius = websiteRadius(resolvedTile?.borderRadius ?? 3);
  const border = resolvedTile?.border || "1px solid rgba(148,163,184,0.25)";
  const hoverLift = resolvedTile?.hoverLift ?? false;
  const lightboxOn = resolvedLightbox?.enabled ?? false;
  const [activeIndex, setActiveIndex] = useState(null);

  const columnsConf = (() => {
    if (resolvedColumns && typeof resolvedColumns === "object") {
      return {
        xs: resolvedColumns.xs || 2,
        sm: resolvedColumns.sm || resolvedColumns.xs || 2,
        md: resolvedColumns.md || resolvedColumns.sm || resolvedColumns.xs || 3,
      };
    }
    const num = Number(resolvedColumns) || 3;
    return { xs: 1, sm: Math.min(2, num), md: num };
  })();

  const gapValue = typeof resolvedGap === "number" ? resolvedGap : 0;
  const calcBasis = (count) => `calc(${(100 / count).toFixed(4)}% - ${gapValue}px)`;
  const itemBasis = {
    xs: calcBasis(columnsConf.xs),
    sm: calcBasis(columnsConf.sm),
    md: calcBasis(columnsConf.md),
  };

  const handleOpen = (index) => {
    if (!lightboxOn) return;
    setActiveIndex(index);
  };
  const closeLightbox = () => setActiveIndex(null);
  const showArrows = resolvedLightbox?.showArrows ?? true;
  const loop = resolvedLightbox?.loop ?? true;

  const currentItem = activeIndex != null ? normalizeItem(list[activeIndex]) : null;
  const currentVideo = currentItem ? toVideo(currentItem) : "";
  const currentPoster = currentItem ? toPoster(currentItem) : "";
  const posterUrl = currentPoster ? buildImgixUrl(currentPoster, { w: 1400, fit: "crop" }) : "";

  const goPrev = () => {
    if (activeIndex == null) return;
    if (activeIndex === 0) {
      if (loop) setActiveIndex(list.length - 1);
    } else {
      setActiveIndex(activeIndex - 1);
    }
  };
  const goNext = () => {
    if (activeIndex == null) return;
    if (activeIndex === list.length - 1) {
      if (loop) setActiveIndex(0);
    } else {
      setActiveIndex(activeIndex + 1);
    }
  };

  const theme = useTheme();
  const smDown = useMediaQuery(theme.breakpoints.down("sm"));
  const prefersReducedMotion = typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveData = typeof navigator !== "undefined" &&
    navigator.connection &&
    navigator.connection.saveData;
  const effectiveType = typeof navigator !== "undefined" &&
    navigator.connection &&
    navigator.connection.effectiveType;
  const lowData =
    saveData ||
    (typeof effectiveType === "string" && /(^|\\b)(2g|slow-2g)\\b/i.test(effectiveType));
  const allowAutoplay = !(smDown || lowData || prefersReducedMotion);

  return (
    <Container maxWidth={resolvedMax} disableGutters={resolvedMax === false}>
      {title && (
        <HtmlTypo variant="h4" sx={{ mb: 2, fontWeight: 800, textAlign: titleAlign || "left" }}>
          {title}
        </HtmlTypo>
      )}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: typeof resolvedGap === "number" ? `${resolvedGap}px` : resolvedGap,
        }}
      >
        {list.map((item, i) => {
          const normalized = normalizeItem(item);
          const videoUrl = toVideo(normalized);
          if (!videoUrl) return null;
          const poster = toPoster(normalized);
          const thumb = poster ? buildImgixUrl(poster, { w: 900, fit: "crop" }) : "";
          return (
            <Box
              key={i}
              role={lightboxOn ? "button" : undefined}
              onClick={() => handleOpen(i)}
              sx={{
                flex: "0 0 auto",
                flexBasis: itemBasis,
                maxWidth: itemBasis,
                width: "100%",
                borderRadius,
                border,
                overflow: "hidden",
                lineHeight: 0,
                cursor: lightboxOn ? "pointer" : "default",
                boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                ...(hoverLift
                  ? {
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 16px 32px rgba(15,23,42,0.18)",
                      },
                    }
                  : {}),
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: ratio ? `${ratio}` : "16/9",
                  backgroundColor: "#0f172a",
                }}
              >
                <video
                  src={videoUrl}
                  poster={thumb || undefined}
                  muted
                  loop
                  playsInline
                  autoPlay={allowAutoplay}
                  preload="metadata"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </Box>
              {toCaption(normalized) && (
                <Box sx={{ px: 1.5, py: 1, backgroundColor: "rgba(15,23,42,0.06)" }}>
                  <HtmlTypo variant="subtitle2" sx={{ m: 0 }}>
                    {toCaption(normalized)}
                  </HtmlTypo>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      {ctaText && (
        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Button href={ctaLink || "#"} variant="contained">
            {toPlain(ctaText)}
          </Button>
        </Box>
      )}

      <Dialog
        open={activeIndex != null}
        onClose={(event, reason) => {
          if (reason === "backdropClick" && resolvedLightbox?.closeOnBackdrop === false) return;
          closeLightbox();
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "transparent",
            boxShadow: "none",
            overflow: "visible",
          },
        }}
      >
        {currentVideo && (
          <Box sx={{ position: "relative", display: "flex", justifyContent: "center" }}>
            <IconButton
              onClick={closeLightbox}
              sx={{
                position: "absolute",
                top: -48,
                right: 0,
                color: "#fff",
                backgroundColor: "rgba(0,0,0,0.5)",
                "&:hover": { backgroundColor: "rgba(0,0,0,0.65)" },
              }}
            >
              <CloseIcon />
            </IconButton>
            {showArrows && list.length > 1 && (
              <>
                <IconButton
                  onClick={goPrev}
                  sx={{
                    position: "absolute",
                    left: -56,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#fff",
                    backgroundColor: "rgba(0,0,0,0.5)",
                    "&:hover": { backgroundColor: "rgba(0,0,0,0.65)" },
                  }}
                >
                  <ArrowBackIosNewIcon />
                </IconButton>
                <IconButton
                  onClick={goNext}
                  sx={{
                    position: "absolute",
                    right: -56,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#fff",
                    backgroundColor: "rgba(0,0,0,0.5)",
                    "&:hover": { backgroundColor: "rgba(0,0,0,0.65)" },
                  }}
                >
                  <ArrowForwardIosIcon />
                </IconButton>
              </>
            )}
            <Box
              sx={{
                maxWidth: "100%",
                maxHeight: "80vh",
                borderRadius: websiteRadius(3),
                border: "1px solid rgba(255,255,255,0.15)",
                backgroundColor: "#111827",
                overflow: "hidden",
              }}
            >
              <video
                src={currentVideo}
                poster={posterUrl || undefined}
                controls
                playsInline
                style={{ width: "100%", height: "100%", display: "block" }}
              />
            </Box>
          </Box>
        )}
      </Dialog>
    </Container>
  );
};

// -----------------------------------------------------------------------------
// Registry
// -----------------------------------------------------------------------------
const PageStyle = () => null;

const registry = {
  pageStyle: PageStyle,
  hero: Hero,
  heroCarousel: HeroCarousel,
  heroSplit: HeroSplit,
  featureZigzag: FeatureZigzag,
  featureZigzagModern: FeatureZigzagModern,
  testimonialCarousel: TestimonialCarousel,
  serviceGrid: ServiceGrid,
  serviceHoverSlider: ServiceHoverSlider,
  collectionShowcase: CollectionShowcase,
  serviceGridSmart: SmartServiceGrid,
  gallery: Gallery,
  videoStorySplit: VideoStorySplit,
  videoGallery: VideoGallery,
  galleryCarousel: GalleryCarousel,
  testimonials: Testimonials,
  featurePillars: FeaturePillars,
  featureStories: FeatureStories,
  reviewEditorialGrid: ReviewEditorialGrid,
  testimonialTiles: TestimonialTiles,
  logoCarousel: LogoCarousel,
  pricingTable: PricingTable,
  faq: FAQ,
  teamGrid: TeamGrid,
  blogList: BlogList,
  teamMetrics: TeamMetrics,
  cultureValues: CultureValues,
  processSteps: ProcessSteps,
  cta: CTA,
  richText: RichText,
  textFree: FreeText,
  video: Video,
  logoCloud: LogoCloud,
  stats: Stats,
  contact: ContactBlock,
  mapEmbed: MapEmbed,
  contactForm: ContactFormSection,
  popupCta: PopupCta,
  footer: Footer,
  bookingCtaBar: BookingCtaBar
};

// -----------------------------------------------------------------------------
// Render
// -----------------------------------------------------------------------------
function RenderSectionsInner({
  sections = [],
  layout = "boxed",
  sectionSpacing = 6,
  defaultGutterX,
  editorPreview = false,
}) {
  const safeSections = Array.isArray(sections) ? sections : [];
  const [pageStyle, contentSections] = useMemo(
    () => pickPageStyle(safeSections),
    [safeSections]
  );
  const popupSections = contentSections.filter((section) => section?.type === "popupCta");
  const flowSections = contentSections.filter((section) => section?.type !== "popupCta");
  const defGX = defaultGutterX ?? pageStyle.gutterX;
  const bottomSpacing = clamp(
    Number(pageStyle.pageBottomSpacing) || 0,
    0,
    240
  );
  const fullBleedFrameTypes = new Set([
    "heroCarousel",
    "hero",
    "videoEmbed",
    "galleryCarousel",
    "featureZigzag",
    "featureZigzagModern",
    "videoGallery",
  ]);
  const { sectionBaseSx, frame } = useSectionFrame({ layout, sectionSpacing, defaultGutterX: defGX });

  // Build page-level background CSS (sx) + CSS variables (style)
  // Build page-level background CSS (sx) + CSS variables (style)
const pageWrapSx = {
  position: "relative",
  ...(pageStyle.backgroundColor ? { backgroundColor: pageStyle.backgroundColor } : {}),
  ...(pageStyle.backgroundImage ? { backgroundImage: `url(${pageStyle.backgroundImage})` } : {}),
  backgroundRepeat: pageStyle.backgroundRepeat || "no-repeat",
  backgroundSize: pageStyle.backgroundSize || "cover",
  backgroundPosition: pageStyle.backgroundPosition || "center",
  backgroundAttachment: pageStyle.backgroundAttachment || "fixed",

  /* NEW — Button styling that reads our CSS vars (with safe fallbacks) */
  "& .MuiButton-root": {
    borderRadius: "var(--page-btn-radius, 4px)",
    textTransform: "none",
  },
  "& .MuiButton-contained": {
    backgroundColor: "var(--page-btn-bg, var(--sched-primary))",
    color: "var(--page-btn-color, #fff)",
    "&:hover": { filter: "brightness(0.95)" },
  },
  "& .MuiButton-outlined": {
    borderColor: "var(--page-btn-bg, var(--sched-primary))",
    color: "var(--page-btn-bg, var(--sched-primary))",
    backgroundColor: "transparent",
    "&:hover": {
      backgroundColor: "rgba(0,0,0,0.03)",
      borderColor: "var(--page-btn-bg, var(--sched-primary))",
      color: "var(--page-btn-bg, var(--sched-primary))",
    },
  },
  "& .MuiButton-text": {
    color: "var(--page-btn-bg, var(--sched-primary))",
  },
};


  // Page-scope CSS variables (picked up by theme/Paper via var() in styles)
    // Page-scope CSS variables (picked up by theme/Paper via var() in styles)
  const pageVars = {
    // text + fonts (support both old and new keys)
  "--page-body-color":    pageStyle.bodyColor    ?? pageStyle.textBodyColor    ?? undefined,
  "--page-heading-color": pageStyle.headingColor ?? pageStyle.textHeadingColor ?? undefined,
  "--page-link-color":    pageStyle.linkColor    ?? pageStyle.textLinkColor    ?? undefined,
  "--page-heading-font":  pageStyle.headingFont  ?? undefined,
  "--page-body-font":     pageStyle.bodyFont     ?? undefined,

  // cards
  "--page-card-bg":     pageStyle.cardBg || colorWithOpacity(pageStyle.cardColor || "#ffffff", pageStyle.cardOpacity ?? 0.92),
  "--page-card-radius": pageStyle.cardRadius != null ? toWebsiteRadiusPx(pageStyle.cardRadius) : undefined,
  "--page-card-shadow": pageStyle.cardShadow || undefined,
  "--page-card-blur":   pageStyle.cardBlur ? `${pageStyle.cardBlur}px` : undefined,

  // hero heading effect
  "--page-hero-heading-shadow": pageStyle.heroHeadingShadow ?? undefined,

  // BUTTONS (NEW)
  "--page-btn-bg":     pageStyle.btnBg     ?? undefined,
  "--page-btn-color":  pageStyle.btnColor  ?? undefined,
  "--page-btn-radius": pageStyle.btnRadius != null ? toWebsiteRadiusPx(pageStyle.btnRadius) : undefined,

  // Secondary background (accent band)
  "--page-secondary-bg":
    pageStyle.secondaryBackground ??
    pageStyle.secondaryBackgroundColor ??
    undefined,
  };

  const overlay =
  pageStyle.overlayColor && (pageStyle.overlayOpacity ?? 0) > 0
    ? hexToRgba(
        pageStyle.overlayColor,
        clamp(Number(pageStyle.overlayOpacity) || 0, 0, 1)
      )
    : null;

return (
  <Box className="page-scope" sx={pageWrapSx} style={pageVars}>
    {overlay && (
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          background: overlay,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
    )}
    <Stack spacing={{ xs: 2.5, md: 4 }} sx={{ position: "relative", zIndex: 1 }}>
      {flowSections.map((s, i) => {
        const Cmp = registry[s?.type];
        if (!Cmp) return null;
        const props = s.props || {};

         // Let page style provide fallbacks for width and gutter
     if (props.maxWidth == null && pageStyle.contentMaxWidth != null) {
   props.maxWidth = pageStyle.contentMaxWidth;
 }
 if (props.gutterX == null && pageStyle.gutterX != null) {
   props.gutterX = pageStyle.gutterX;
 }


        // NEW: per-section spacing overrides from the builder
        const hasPxPy = Number.isFinite(s?.sx?.py); // we store py in *pixels* in the builder
        const normalizedSectionSx = normalizeSectionSxForButtons(s.sx || {});
        const perSectionSx = {
          ...sectionBaseSx, // global defaults
          ...normalizedSectionSx, // local sx (with CTA token safety remap)
          ...(hasPxPy ? { py: `${s.sx.py}px` } : {}), // override paddingY in px if provided
          ...(typeof s?.props?.spaceAbove === "number"
            ? { "& + &": { mt: s.props.spaceAbove } } // per-section gap ABOVE (theme units)
            : {}),
          ...(typeof s?.props?.spaceBelow === "number"
            ? { mb: s.props.spaceBelow } // optional gap BELOW (theme units)
            : {}),
        };
        if (i === flowSections.length - 1) {
          perSectionSx.pb = `${bottomSpacing}px`;
          perSectionSx.mb = 0;
        }

        const effectiveProps = fullBleedFrameTypes.has(s?.type)
          ? { ...props, maxWidth: false }
          : props;

        return (
          <Section key={s?.id || i} id={s?.id} sx={perSectionSx}>
            {frame(
              <Cmp {...effectiveProps} />,
              fullBleedFrameTypes.has(s?.type)
                ? { ...effectiveProps, layoutOverride: "full", gutterX: 0 }
                : effectiveProps
            )}
          </Section>
        );
      })}
    </Stack>
    {popupSections.map((s, i) => (
      <PopupCta
        key={s?.id || `popup-${i}`}
        {...(s?.props || {})}
        popupId={s?.id || `popup-${i}`}
        editorPreview={editorPreview}
      />
    ))}
  </Box>
);
}

// Memoize to keep the canvas calm during inspector typing
export const RenderSections = memo(RenderSectionsInner);
