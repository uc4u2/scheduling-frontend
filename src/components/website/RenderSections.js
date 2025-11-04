// src/components/website/RenderSections.js
import React, { useMemo, useState, useEffect, useRef, memo } from "react";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
  Box, Container, Stack, Typography, Button, Grid, Card, CardContent, CardMedia,
  Divider, Accordion, AccordionSummary, AccordionDetails, Chip, IconButton, Avatar
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CheckIcon from "@mui/icons-material/Check";
import SmartServiceGrid from "./SmartServiceGrid";
import { safeHtml } from "../../utils/safeHtml";
import { normalizeInlineHtml } from "../../utils/html";
import { toPlain } from "../../utils/html";
import ContactFormSection from "./ContactFormSection";
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
    py: { xs: 5, md: 8 },
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
          sx={{
            borderRadius: 3,
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

const ServiceGrid = ({ title, subtitle, items = [], ctaText, ctaLink, titleAlign, maxWidth }) => {
  const list = toArray(items);
  return (
    <Container maxWidth={toContainerMax(maxWidth)}>
      {title && (
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 800, textAlign: titleAlign || "left" }}>
     {toPlain(title)}
   </Typography>
 )}
      {subtitle && (
        <HtmlTypo variant="body1" sx={{ mb: 2, color: "text.secondary", textAlign: titleAlign || "left" }}>
          {subtitle}
        </HtmlTypo>
      )}
      <Grid container spacing={2}>
        {list.map((s, i) => (
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
              <CardContent>
                <Typography fontWeight={700}>{toPlain(s.name)}</Typography>
                {s.description && (
                  <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
                    {toPlain(s.description)}
                  </Typography>
                )}
                {(s.price || s.meta) && (
                  <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
                    {s.price && <Chip label={toPlain(s.price)} />}
                    {s.meta && <Chip variant="outlined" label={toPlain(s.meta)} />}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
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

const GalleryCarousel = ({ title, caption, images = [], autoplay = true, titleAlign, maxWidth }) => {
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
            <img
              src={src}
              alt=""
              loading="lazy"
              style={{ width: "100%", display: "block" }}
            />
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

const PricingTable = ({ title, intro, plans = [], titleAlign, maxWidth }) => {
  const list = toArray(plans);
  return (
    <Container maxWidth={toContainerMax(maxWidth)}>
      {title && (
        <HtmlTypo variant="h4" sx={{ mb: 1, fontWeight: 800, textAlign: titleAlign || "left" }}>
          {title}
        </HtmlTypo>
      )}
      {intro && (
        <HtmlTypo variant="body1" sx={{ mb: 2, color: "text.secondary", textAlign: titleAlign || "left" }}>
          {intro}
        </HtmlTypo>
      )}
      <Grid container spacing={2}>
        {list.map((p, i) => (
          <Grid item xs={12} md={4} key={i}>
            <Card
              sx={{
                height: "100%",
                borderWidth: p.featured ? 2 : 1,
                borderStyle: "solid",
                borderColor: p.featured ? "primary.main" : "divider",
                boxShadow: p.featured ? 6 : 1
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
              <HtmlTypo variant="body2" sx={{ color: "text.secondary" }}>
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

const LogoCloud = ({
  title,
  caption,
  logos = [],
  showLabels = false,
  monochrome = false,
  maxWidth,
  titleAlign
}) => {
  const list = toArray(logos);
  return (
    <Container maxWidth={toContainerMax(maxWidth)}>
      {title && (
        <HtmlTypo
          variant="h6"
          sx={{ mb: 0.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", textAlign: titleAlign || "left" }}
        >
          {title}
        </HtmlTypo>
      )}
      {caption && (
        <HtmlTypo variant="body2" sx={{ mb: 2, color: "text.secondary", textAlign: titleAlign || "left" }}>
          {caption}
        </HtmlTypo>
      )}
      <Grid container spacing={3} alignItems="center" justifyContent="center">
        {list.map((l, i) => (
          <Grid item xs={6} sm={4} md={2} key={i}>
            <Box sx={{ opacity: 0.9, "&:hover": { opacity: 1 }, textAlign: "center" }}>
              <img
                src={l.src}
                alt={toPlain(l.alt || "")}
                loading="lazy"
                style={{
                  maxWidth: "100%",
                  height: 36,
                  objectFit: "contain",
                  filter: monochrome ? "grayscale(1)" : "none"
                }}
              />
              {showLabels && l.alt && (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                  {toPlain(l.alt)}
                </Typography>
              )}
            </Box>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

const Stats = ({ title, items = [], titleAlign, maxWidth, disclaimer }) => {
  const list = toArray(items);
  return (
    <Container maxWidth={toContainerMax(maxWidth)}>
      {title && (
        <HtmlTypo variant="h4" sx={{ mb: 2, fontWeight: 800, textAlign: titleAlign || "left" }}>
          {title}
        </HtmlTypo>
      )}
      <Grid container spacing={2}>
        {list.map((s, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ textAlign: "center", p: 2 }}>
              <Typography variant="h4" fontWeight={900}>{toPlain(s.value)}</Typography>
              <Typography color="text.secondary">{toPlain(s.label)}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>
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
  buttonLink = "?page=services-classic"
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

const Gallery = ({ title, images = [], columns = 3, titleAlign, maxWidth }) => {
  const list = Array.isArray(images) ? images : [];
  const toSrc = (it) => (typeof it === "string" ? it : it?.src || "");
  const toAlt = (it) => (typeof it === "string" ? "" : (it?.alt || ""));

  const colConf = { 1: 12, 2: 6, 3: 4, 4: 3, 6: 2 }[columns] || 4;

  return (
    <Container maxWidth={toContainerMax(maxWidth)}>
      {title && (
        <HtmlTypo variant="h4" sx={{ mb: 2, fontWeight: 800, textAlign: titleAlign || "left" }}>
          {title}
        </HtmlTypo>
      )}
      <Grid container spacing={2}>
        {list.map((item, i) => {
          const src = toSrc(item);
          if (!src) return null;
          return (
            <Grid key={i} item xs={12} sm={6} md={colConf}>
              <Box sx={{ borderRadius: 2, overflow: "hidden", lineHeight: 0, boxShadow: 1 }}>
                <img
                  src={src}
                  alt={toAlt(item)}
                  loading="lazy"
                  style={{ display: "block", width: "100%", height: "auto" }}
                />
              </Box>
            </Grid>
          );
        })}
      </Grid>
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
  heroSplit: HeroSplit,
  serviceGrid: ServiceGrid,
  serviceGridSmart: SmartServiceGrid,
  gallery: Gallery,
  galleryCarousel: GalleryCarousel,
  testimonials: Testimonials,
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
  const { sectionBaseSx, frame } = useSectionFrame({ layout, sectionSpacing, defaultGutterX: defGX });

  // Build page-level background CSS (sx) + CSS variables (style)
  // Build page-level background CSS (sx) + CSS variables (style)
const pageWrapSx = {
  position: "relative",
  minHeight: "100vh",
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
    <Stack spacing={{ xs: 0, md: 0 }} sx={{ position: "relative", zIndex: 1 }}>
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
