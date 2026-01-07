// src/components/website/RenderSections.js
import React, { useMemo, useState, useEffect, useRef, memo } from "react";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
  Box, Container, Stack, Typography, Button, Grid, Card, CardContent, CardMedia,
  Divider, Accordion, AccordionSummary, AccordionDetails, Chip, IconButton, Avatar,
  Dialog
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import SmartServiceGrid from "./SmartServiceGrid";
import { safeHtml } from "../../utils/safeHtml";
import { normalizeInlineHtml } from "../../utils/html";
import { toPlain } from "../../utils/html";
import ContactFormSection from "./ContactFormSection";
import buildImgixUrl from "../../utils/imgix";
// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

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
  return (
    <Typography
      variant={variant}
      sx={sx}
      {...rest}
      dangerouslySetInnerHTML={{ __html: safeHtml(html) }}
    />
  );
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
    "--page-card-radius":   ps.cardRadius != null ? `${ps.cardRadius}px` : undefined,
    "--page-card-shadow":   has(ps.cardShadow)   ? ps.cardShadow   : undefined,
    "--page-card-blur":     ps.cardBlur != null  ? `${ps.cardBlur}px` : undefined,

    // buttons
    "--page-btn-bg":        has(ps.btnBg)        ? ps.btnBg        : undefined,
    "--page-btn-color":     has(ps.btnColor)     ? ps.btnColor     : undefined,
    "--page-btn-radius":    ps.btnRadius != null ? `${ps.btnRadius}px` : undefined,

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

  const minH =
    typeof heroHeight === "number" && heroHeight > 0
      ? `${heroHeight}vh`
      : undefined;

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
        borderRadius: { xs: 0, md: 3 },
        overflow: "hidden",
        minHeight: minH || { xs: 380, md: 560 },
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color:
          "var(--page-hero-text-color, var(--page-body-color, inherit))",
        pt: safeTop ? "env(safe-area-inset-top)" : 0,
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
            backgroundPosition,
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
        </Box>
      ) : (
        <Container maxWidth={innerMax} sx={{ position: "relative", zIndex: 2 }}>
          <Box sx={{ px: gutterX != null ? `${gutterX}px` : 0 }}>
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
    <Box sx={{ position: "relative", borderRadius: { xs: 0, md: 3 }, overflow: "hidden", minHeight: minH || { xs: 380, md: 560 }, color: "var(--page-hero-text-color, var(--page-body-color, inherit))", pt: safeTop ? "env(safe-area-inset-top)" : 0 }}>
      {list.map((s, i) => (
        <Box key={i} aria-hidden={i !== index} sx={{ position: "absolute", inset: 0, opacity: i === index ? 1 : 0, transition: "opacity .6s ease", willChange: "opacity", backfaceVisibility: "hidden", transform: "translateZ(0)" }}>
          {!!s.image && (
            <Box aria-hidden sx={{ position: "absolute", inset: 0, backgroundImage: `url(${s.image})`, backgroundSize: "cover", backgroundPosition: s.backgroundPosition || "center", pointerEvents: "none", ...(brightness && brightness !== 1 ? { filter: `brightness(${brightness})` } : {}) }} />
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
          <HtmlTypo variant="h3" sx={{ fontWeight: 800, mb: 1, textAlign: titleAlign || "left" }}>
            {heading}
          </HtmlTypo>
        )}
        {subheading && (
          <HtmlTypo variant="body1" sx={{ mb: 2, color: "text.secondary", textAlign: titleAlign || "left" }}>
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
            borderRadius: 4,
            overflow: "hidden",
            boxShadow: (t) => t.shadows[4],
            lineHeight: 0
          }}
        >
          {!!image && (
            <img
              alt=""
              src={image}
              loading="lazy"
              style={{ display: "block", width: "100%", height: "auto" }}
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
const cardRadius = 8;
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
          maxWidth: { xs: "100%", md: 560 }
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
          borderRadius: cardRadius,
          overflow: "hidden",
          boxShadow: (t) => t.shadows[6],
          minHeight: { xs: 260, md: 360 },
          aspectRatio: { xs: "4 / 3", md: "16 / 9" },
          display: "flex"
        }}
      >
        {imageSrc && (
          <img
            src={imageSrc}
            alt={imageAlt}
            loading="lazy"
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: "cover"
            }}
          />
        )}
      </Box>
    );

    return (
      <Box key={idx} className={rowClass}>
        {textBlock}
        {imageBlock}
      </Box>
    );
  };

  return (
    <Container maxWidth={toContainerMax(maxWidth)}>
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

const ServiceGrid = ({ title, subtitle, items = [], ctaText, ctaLink, titleAlign, maxWidth, titleColor, subtitleColor }) => {
  const list = toArray(items);
  return (
    <Container maxWidth={toContainerMax(maxWidth)}>
      {title && (
        <Typography
          variant="h4"
          sx={{
            mb: 2,
            fontWeight: 800,
            textAlign: titleAlign || "left",
            ...(titleColor ? { color: titleColor } : {}),
          }}
        >
          {toPlain(title)}
        </Typography>
      )}
      {subtitle && (
        <HtmlTypo
          variant="body1"
          sx={{
            mb: 2,
            color: subtitleColor ? subtitleColor : "text.secondary",
            textAlign: titleAlign || "left",
          }}
        >
          {subtitle}
        </HtmlTypo>
      )}
      <Grid container spacing={2}>
        {list.map((s, i) => {
          const bullets = toArray(s.bullets);
          const chips = toArray(s.chips);
          return (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card sx={{ height: "100%" }}>
                {s.image && (
                  <CardMedia
                    component="img"
                    height="160"
                    image={s.image}
                    alt=""
                    loading="lazy"
                  />
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
    </Container>
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
  const reduced = usePrefersReducedMotion();
  const [index, setIndex, setPaused] = useAutoplay(
    imgs.length,
    4000,
    !autoplay || reduced
  );
  const go = (dir) => setIndex((i) => (i + dir + imgs.length) % imgs.length);

  return (
    <Container maxWidth={toContainerMax(maxWidth)}>
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
        sx={{ position: "relative", borderRadius: 3, overflow: "hidden" }}
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
        <HtmlTypo variant="h4" sx={{ mb: 2, fontWeight: 800, textAlign: titleAlign || "left" }}>
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
          <HtmlTypo variant="h4" sx={{ fontWeight: 800, textAlign: align }}>
            {title}
          </HtmlTypo>
        )}
        {intro && (
          <HtmlTypo
            variant="body1"
            sx={{ color: "text.secondary", textAlign: align }}
          >
            {intro}
          </HtmlTypo>
        )}
        {notes && (
          <HtmlTypo
            variant="body2"
            sx={{ color: "text.secondary", textAlign: align }}
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
          borderRadius: 3,
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
                  }}
                >
                  {toPlain(p.ribbon)}
                </Typography>
              )}
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {toPlain(p.name)}
              </Typography>
              <Typography className="price" variant="h3">
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
                      <CheckIcon fontSize="small" />
                      <Typography variant="body2">
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
                  color={p.featured ? "secondary" : "primary"}
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
                  borderRadius: 4,
                  p: 3,
                  background: "rgba(6,10,22,0.78)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#f5f7ff",
                  boxShadow: "0 30px 60px rgba(5,6,20,0.45)",
                }}
              >
                {p.ribbon && (
                  <Typography
                    variant="caption"
                    className="pricing-logo-ribbon"
                    sx={{
                      letterSpacing: ".18em",
                      textTransform: "uppercase",
                      color: "rgba(196,181,253,0.9)",
                    }}
                  >
                    {toPlain(p.ribbon)}
                  </Typography>
                )}
                <Typography
                  variant="h6"
                  className="pricing-logo-name"
                  sx={{ fontWeight: 800 }}
                >
                  {toPlain(p.name)}
                </Typography>
                <Typography
                  variant="h4"
                  className="pricing-logo-price"
                  sx={{ fontWeight: 800 }}
                >
                  {toPlain(p.price)}
                </Typography>
                <Stack
                  spacing={0.75}
                  className="pricing-logo-features"
                  sx={{
                    textAlign: "left",
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
                      <CheckIcon fontSize="small" />
                      <Typography variant="body2">{toPlain(f)}</Typography>
                    </Stack>
                  ))}
                </Stack>
                {p.ctaText && (
                  <Button
                    href={p.ctaLink || "#"}
                    className="pricing-logo-cta"
                    variant="contained"
                    sx={{ mt: "auto" }}
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
                borderColor: p.featured ? "primary.main" : "divider",
                boxShadow: p.featured ? 6 : 1,
              }}
            >
              <CardContent>
                {p.ribbon && (
                  <Chip
                    label={toPlain(p.ribbon)}
                    color="primary"
                    size="small"
                    sx={{ mb: 1, fontWeight: 700 }}
                  />
                )}
                <Typography variant="h6" fontWeight={800}>
                  {toPlain(p.name)}
                </Typography>
                <Typography variant="h4" sx={{ my: 1 }}>
                  {toPlain(p.price)}
                </Typography>
                <Stack spacing={0.75} sx={{ mb: 2 }}>
                  {toArray(p.features).map((f, idx) => (
                    <Stack direction="row" spacing={1} alignItems="center" key={idx}>
                      <CheckIcon fontSize="small" />{" "}
                      <Typography variant="body2">{toPlain(f)}</Typography>
                    </Stack>
                  ))}
                </Stack>
                {p.ctaText && (
                  <Button
                    href={p.ctaLink || "#"}
                    fullWidth
                    variant={p.featured ? "contained" : "outlined"}
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
        <HtmlTypo variant="h4" sx={{ mb: 2, fontWeight: 800, textAlign: titleAlign || "left" }}>
          {title}
        </HtmlTypo>
      )}
      {list.map((q, i) => (
        <Accordion key={i} disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={700}>{toPlain(q.question)}</Typography>
          </AccordionSummary>
          <AccordionDetails>
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

const CTA = ({ title, subtitle, buttonText, buttonLink, titleAlign, maxWidth }) => (
  <Container maxWidth={toContainerMax(maxWidth)}>
    <Card sx={{ p: { xs: 2, md: 3 }, textAlign: titleAlign || "center" }}>
      {title && (
        <HtmlTypo variant="h5" sx={{ fontWeight: 800 }}>
          {title}
        </HtmlTypo>
      )}
      {subtitle && (
        <HtmlTypo variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
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
  borderRadius = 8,
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
          borderRadius,
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
    <Box sx={{ borderRadius: 3, overflow: "hidden", boxShadow: 2, lineHeight: 0 }}>
      {url?.includes("youtube.com") || url?.includes("youtu.be") || url?.includes("vimeo.com") ? (
        <Box sx={{ position: "relative", pt: "56.25%" }}>
          <iframe
            src={url}
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

const normalizeLogoItem = (item) => {
  if (!item) return null;
  if (typeof item === "string") {
    return { label: item, src: null };
  }
  if (typeof item === "object") {
    const label = item.label ?? item.alt ?? item.name ?? item.title ?? "";
    return {
      src: item.src || null,
      label,
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
  cardRadius = 12,
}) => {
  const entries = toArray(logos)
    .map(normalizeLogoItem)
    .filter((item) => item && (item?.src || item?.label || item?.caption));

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
  const hasEntries = entries.length > 0;
  const resolvedTitleAlign = titleAlign || "left";
  const resolvedSupportingAlign = supportingTextAlign || resolvedTitleAlign;

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
      color: "#e0f2fe",
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
              background: "rgba(5,17,37,0.65)",
              border: "1px solid rgba(148,163,184,0.28)",
              boxShadow: "0 24px 44px rgba(8,23,53,0.32)",
              color: "#f8fafc",
              borderRadius: 14,
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
                sx={{ opacity: 0.85, letterSpacing: ".05em" }}
              >
                {item.caption || item.label}
              </Typography>
            )}
          </Card>
        ))}
      </Stack>
    );
  };

  const resolvedCardRadius = Number(cardRadius) || 12;

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
                },
                "& .logo-cloud-card-meta": {
                  fontSize: "2.5rem",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                },
                "& .logo-cloud-card-caption": {
                  fontSize: "1rem",
                  fontWeight: 600,
                },
              }}
            >
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
                  sx={{ color: "text.primary", opacity: 0.85 }}
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
                      <Typography variant="body2">{toPlain(f)}</Typography>
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
            color: "text.secondary",
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
            color: "text.secondary",
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
                borderRadius: 999,
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
}) => {
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
            color: "text.secondary",
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
            borderRadius: 4,
            backdropFilter: "blur(12px)",
            backgroundColor: "rgba(255,255,255,0.28)",
            border: "1px solid rgba(178,64,24,0.35)",
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
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: ".04em" }}>
              {label}
            </Typography>
          )}
          {active.src && label && (
            <Typography
              variant="subtitle2"
              color="text.secondary"
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
                      borderRadius: 2,
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
  const radius = Number(card?.radius ?? 24);
  const iconSize = Number(card?.iconSize ?? 48);
  const gridGapPx = Number(card?.gridGap ?? 32);
  const gridSpacing = Math.max(3, clamp(Math.round(gridGapPx / 8), 1, 6));

  const sectionBackground =
    background || card?.sectionBackground || "linear-gradient(90deg, #2DC8FF 0%, #2FE6C8 100%)";
  const cardSurface = card?.surface || "rgba(255,255,255,0.92)";
  const cardHoverSurface = card?.hoverSurface || "rgba(255,255,255,1)";
  const cardShadow = card?.shadow || "0 16px 40px rgba(15,23,42,0.18)";
  const ringColor = card?.ringColor || "rgba(15,23,42,0.08)";
  const chipBg = card?.chipBg || "rgba(191,219,254,0.45)";
  const chipColor = card?.chipColor || "#1d4ed8";
  const chipBorder = card?.chipBorder || "rgba(37,99,235,0.35)";
  const badgeSurface = card?.badgeSurface || "rgba(37,99,235,0.12)";
  const badgeText = card?.badgeText || "rgba(37,99,235,0.95)";
  const iconBg = card?.iconBg ?? card?.badgeBg ?? "rgba(37,99,235,0.12)";
  const iconColor = card?.iconColor ?? card?.badgeColor ?? "#1d4ed8";
  const headingColor = card?.headingColor || "#0f172a";
  const bodyColor = card?.bodyColor || "rgba(15,23,42,0.72)";

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
                  borderRadius: 999,
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
              borderRadius: 999,
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
  const rawRadius = card?.radius ?? 16;
  const radius = typeof rawRadius === "number" ? `${rawRadius}px` : rawRadius;
  const rawGap = card?.gap ?? 32;
  const gap = typeof rawGap === "number" ? Number(rawGap) : rawGap;
  const gapXs = card?.gapXs ?? (typeof gap === "number" ? Math.min(gap, 28) : gap);
  const rawMaxContainer = card?.maxWidth ?? 1160;
  const maxContainer = typeof rawMaxContainer === "number" ? `${rawMaxContainer}px` : rawMaxContainer;
  const sectionBackground = card?.sectionBackground || "linear-gradient(135deg, #1d4ed8 0%, #14b8a6 100%)";

  const cardSurface = card?.surface || "#ffffff";
  const cardBorder = card?.borderColor || "rgba(15,23,42,0.08)";
  const cardShadow = card?.shadow || "0 10px 24px rgba(15,23,42,0.12)";
  const cardShadowHover = card?.shadowHover || "0 20px 42px rgba(15,23,42,0.18)";
  const headingColor = card?.headingColor || "#0f172a";
  const bodyColor = card?.bodyColor || "rgba(51,65,85,0.88)";
  const badgeBg = card?.badgeBg || "rgba(37,99,235,0.16)";
  const badgeColor = card?.badgeColor || "#2563eb";
  const chipBgDefault = card?.chipBg || "rgba(226,232,240,0.9)";
  const chipColorDefault = card?.chipColor || "#1f2937";
  const chipBorderDefault = card?.chipBorder || "rgba(15,23,42,0.08)";
  const legendBg = card?.legendBg || "rgba(255,255,255,0.72)";
  const legendColor = card?.legendColor || "rgba(15,23,42,0.7)";
  const metricBg = card?.metricBg || "rgba(255,255,255,0.18)";
  const metricColor = card?.metricColor || "#0f172a";
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
              borderRadius: 999,
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
        px: { xs: 2, md: 4 },
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
              color: "#f8fafc",
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
              color: "rgba(248,250,252,0.85)",
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
                          borderRadius: 999,
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
                  borderRadius: 999,
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
  const radius = Number(card?.radius ?? 16);
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
        boxShadow: "0 16px 40px rgba(120,45,6,0.24)",
        background: "linear-gradient(155deg, rgba(255,199,171,0.24), rgba(120,45,6,0.82))",
        border: "1px solid rgba(178,64,24,0.32)",
        color: "#fff7ed",
        minHeight: 200,
      }}
    >
      <Stack direction="row" spacing={Math.max(4, gap - 6)} alignItems="center">
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#fff7ed", letterSpacing: ".04em", fontSize: 13 }}>
          {toPlain(item.brand)}
        </Typography>
        {item.badge && (
          <Box
            sx={{
              px: 1,
              py: 0.5,
              borderRadius: 999,
              backgroundColor: "rgba(255,220,200,0.3)",
              color: "#2b0a05",
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
      <Typography variant="body2" sx={{ color: "#fff4eb", lineHeight: 1.45 }}>
        {`“${toPlain(item.quote)}”`}
      </Typography>
      <Stack direction="row" spacing={Math.max(4, gap - 6)} alignItems="center" sx={{ mt: "auto" }}>
        <Box
          sx={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 3,
            background: "rgba(255,220,200,0.2)",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {item.avatar ? (
            <Box component="img" src={item.avatar} alt="" loading="lazy" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : null}
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#ffe7d6", fontSize: 12 }}>
            {toPlain(item.author)}
          </Typography>
          {item.role && (
            <Typography variant="caption" sx={{ color: "rgba(255,231,214,0.85)" }}>
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
        <HtmlTypo variant="h5" sx={{ mb: caption ? 0.5 : 2, fontWeight: 800, textAlign: titleAlign || "left" }}>
          {title}
        </HtmlTypo>
      )}
      {caption && (
        <HtmlTypo variant="body2" sx={{ mb: 2, color: "text.secondary", textAlign: titleAlign || "left" }}>
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
            display: "grid",
            gap,
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          }}
        >
          {entries.map((item, idx) => (
            <Tile key={idx} item={item} />
          ))}
        </Box>
      )}
    </Container>
  );
};

const Stats = ({
  title,
  subtitle,
  items = [],
  titleAlign,
  maxWidth,
  disclaimer,
  titleColor,
  subtitleColor,
}) => {
  const list = toArray(items);
  return (
    <Container maxWidth={toContainerMax(maxWidth)}>
      {title && (
        <HtmlTypo
          variant="h4"
          sx={{
            mb: subtitle ? 1 : 2,
            fontWeight: 800,
            textAlign: titleAlign || "left",
            ...(titleColor ? { color: titleColor } : {}),
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
            color: subtitleColor ? subtitleColor : "text.secondary",
            textAlign: titleAlign || "left",
          }}
        >
          {subtitle}
        </HtmlTypo>
      )}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
          gap: 3,
          maxWidth: 1200,
          mx: "auto",
        }}
      >
        {list.map((s, i) => (
          <Card key={i} sx={{ textAlign: "center", p: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 120 }}>
            <Typography variant="h4" fontWeight={900}>{toPlain(s.value)}</Typography>
            <Typography variant="body2" color="text.secondary">
              {toPlain(s.label)}
            </Typography>
          </Card>
        ))}
      </Box>
      {disclaimer && (
        <HtmlTypo variant="caption" sx={{ display: "block", mt: 1, color: "text.secondary" }}>
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
          <Box sx={{ borderRadius: 2, overflow: "hidden", height: 260 }}>
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

// Sticky conversion booster
const BookingCtaBar = ({
  text = "Ready to book?",
  buttonText = "See availability",
  buttonLink = "/services"
}) => (
  <Box sx={{ position: "sticky", bottom: 16, zIndex: 1200 }}>
    <Container maxWidth="lg">
      <Box
        sx={{
          p: 2,
          borderRadius: 3,
          boxShadow: 6,
          bgcolor: "background.paper",
          display: "flex",
          gap: 2,
          alignItems: "center",
          justifyContent: "space-between",
          border: (t) => `1px solid ${t.palette.divider}`
        }}
      >
        <HtmlTypo variant="subtitle1" sx={{ fontWeight: 700, m: 0 }}>
          {text}
        </HtmlTypo>
        <Button href={buttonLink} variant="contained" size="large">
          {toPlain(buttonText)}
        </Button>
      </Box>
    </Container>
  </Box>
);

const Gallery = ({
  title,
  images = [],
  columns = 3,
  titleAlign,
  maxWidth,
  layout = "grid",
  gap = 16,
  tile = {},
  lightbox = {}
}) => {
  const list = Array.isArray(images) ? images : [];
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
  const ratio = parseAspectRatio(tile?.aspectRatio);
  const thumbSize = ratio ? { w: 800, h: Math.round(800 / ratio), fit: "crop" } : { w: 800, fit: "crop" };
  const fullSize = { w: 2000, fit: "max" };
  const borderRadius = tile?.borderRadius ?? 16;
  const border = tile?.border || "1px solid rgba(148,163,184,0.25)";
  const hoverLift = tile?.hoverLift ?? false;
  const lightboxEnabled = lightbox?.enabled ?? false;
  const [activeIndex, setActiveIndex] = useState(null);

  const columnsConf = (() => {
    if (columns && typeof columns === "object") {
      return {
        xs: columns.xs || 2,
        sm: columns.sm || columns.xs || 2,
        md: columns.md || columns.sm || columns.xs || 3,
      };
    }
    const num = Number(columns) || 3;
    return { xs: 1, sm: Math.min(2, num), md: num };
  })();

  const gridTemplate = {
    xs: `repeat(${columnsConf.xs}, minmax(0, 1fr))`,
    sm: `repeat(${columnsConf.sm}, minmax(0, 1fr))`,
    md: `repeat(${columnsConf.md}, minmax(0, 1fr))`,
  };

  const handleOpen = (index) => {
    if (!lightboxEnabled) return;
    setActiveIndex(index);
  };
  const closeLightbox = () => setActiveIndex(null);
  const showArrows = lightbox?.showArrows ?? true;
  const loop = lightbox?.loop ?? true;

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
          display: "grid",
          gridTemplateColumns: gridTemplate,
          gap: typeof gap === "number" ? `${gap}px` : gap,
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
              role={lightboxEnabled ? "button" : undefined}
              onClick={() => handleOpen(i)}
              sx={{
                borderRadius,
                border,
                overflow: "hidden",
                lineHeight: 0,
                cursor: lightboxEnabled ? "pointer" : "default",
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
          if (reason === "backdropClick" && lightbox?.closeOnBackdrop === false) return;
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
                borderRadius: 3,
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
  testimonialCarousel: TestimonialCarousel,
  serviceGrid: ServiceGrid,
  serviceGridSmart: SmartServiceGrid,
  gallery: Gallery,
  galleryCarousel: GalleryCarousel,
  testimonials: Testimonials,
  featurePillars: FeaturePillars,
  featureStories: FeatureStories,
  testimonialTiles: TestimonialTiles,
  logoCarousel: LogoCarousel,
  pricingTable: PricingTable,
  faq: FAQ,
  cta: CTA,
  richText: RichText,
  textFree: FreeText,
  video: Video,
  logoCloud: LogoCloud,
  stats: Stats,
  contact: ContactBlock,
  contactForm: ContactFormSection,
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
}) {
  const safeSections = Array.isArray(sections) ? sections : [];
  const [pageStyle, contentSections] = useMemo(
    () => pickPageStyle(safeSections),
    [safeSections]
  );
  const defGX = defaultGutterX ?? pageStyle.gutterX;
  const bottomSpacing = clamp(
    Number(pageStyle.pageBottomSpacing) || 0,
    0,
    240
  );
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
    borderRadius: "var(--page-btn-radius, 10px)",
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
  "--page-card-bg":     colorWithOpacity(pageStyle.cardColor || "#ffffff", pageStyle.cardOpacity ?? 0.92),
  "--page-card-radius": pageStyle.cardRadius != null ? `${pageStyle.cardRadius}px` : undefined,
  "--page-card-shadow": pageStyle.cardShadow || undefined,
  "--page-card-blur":   pageStyle.cardBlur ? `${pageStyle.cardBlur}px` : undefined,

  // hero heading effect
  "--page-hero-heading-shadow": pageStyle.heroHeadingShadow ?? undefined,

  // BUTTONS (NEW)
  "--page-btn-bg":     pageStyle.btnBg     ?? undefined,
  "--page-btn-color":  pageStyle.btnColor  ?? undefined,
  "--page-btn-radius": pageStyle.btnRadius != null ? `${pageStyle.btnRadius}px` : undefined,

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
      {contentSections.map((s, i) => {
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
        const perSectionSx = {
          ...sectionBaseSx, // global defaults
          ...(s.sx || {}),  // any other local sx
          ...(hasPxPy ? { py: `${s.sx.py}px` } : {}), // override paddingY in px if provided
          ...(typeof s?.props?.spaceAbove === "number"
            ? { "& + &": { mt: s.props.spaceAbove } } // per-section gap ABOVE (theme units)
            : {}),
          ...(typeof s?.props?.spaceBelow === "number"
            ? { mb: s.props.spaceBelow } // optional gap BELOW (theme units)
            : {}),
        };
        if (i === contentSections.length - 1) {
          perSectionSx.pb = `${bottomSpacing}px`;
          perSectionSx.mb = 0;
        }

        return (
          <Section key={s?.id || i} id={s?.id} sx={perSectionSx}>
            {frame(<Cmp {...props} />, props)}
          </Section>
        );
      })}
    </Stack>
  </Box>
);
}

// Memoize to keep the canvas calm during inspector typing
export const RenderSections = memo(RenderSectionsInner);
