import React from "react";
import { alpha, Accordion, AccordionDetails, AccordionSummary, Box, Container, Grid, Stack, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { motion } from "framer-motion";
import { IconButton } from "@mui/material";
import ContactFormSection from "../../../ContactFormSection";
import { safeHtml } from "../../../../../utils/safeHtml";
import { normalizeBlockHtml } from "../../../../../utils/html";
import cinematicTokens from "../tokens";
import { useCinematicReveal } from "../motion";
import { FamilyLinkButton, useRailSlider } from "../../hvac-shared/runtime";
import {
  getBookingBarData,
  getContactData,
  getFaqItems,
  getFeatureShowcaseSliderData,
  getGalleryItems,
  getLogoCloudData,
  getMapDetails,
  getMetricItems,
  getRichTextBody,
} from "../../hvac-shared/canonicalHvacAdapter";

export function CinematicFAQ({ websiteSectionAdapter: adapter = {} }) {
  const items = getFaqItems(adapter?.props || {});
  const title = adapter?.props?.title || "Questions";
  const [ref, revealStyle] = useCinematicReveal({ delay: 28 });
  if (!items.length) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container maxWidth={false} sx={{ maxWidth: `${cinematicTokens.layout.contentMax}px`, px: { xs: 2, md: 4 } }}>
        <Stack spacing={2}>
          <Typography sx={{ fontFamily: cinematicTokens.typography.headingFont, fontWeight: 900, fontSize: "clamp(2rem, 4vw, 3.2rem)", textTransform: "uppercase", lineHeight: 0.95 }}>
            {title}
          </Typography>
          {items.map((item) => (
            <Accordion
              key={item.id}
              disableGutters
              elevation={0}
              sx={{
                bgcolor: alpha(cinematicTokens.colors.surfaceSoft, 0.88),
                color: cinematicTokens.colors.text,
                border: `1px solid ${cinematicTokens.colors.line}`,
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: cinematicTokens.colors.text }} />}>
                <Typography sx={{ fontFamily: cinematicTokens.typography.headingFont, fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  {item.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography sx={{ color: cinematicTokens.colors.textSoft, lineHeight: 1.8 }}>{item.answer}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}

export function CinematicGallery({ websiteSectionAdapter: adapter = {} }) {
  const { imageItems, videoItems } = getGalleryItems(adapter?.props || {});
  const title = adapter?.props?.title || "Project gallery";
  const [ref, revealStyle] = useCinematicReveal({ delay: 24 });
  const cards = imageItems.length ? imageItems : videoItems.map((item) => ({ ...item, url: item.poster || "" }));
  if (!cards.length) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container maxWidth={false} sx={{ maxWidth: `${cinematicTokens.layout.shellMax}px`, px: { xs: 2, md: 4 } }}>
        <Stack spacing={2}>
          <Typography sx={{ fontFamily: cinematicTokens.typography.headingFont, fontWeight: 900, fontSize: "clamp(2rem, 4vw, 3.2rem)", lineHeight: 0.95, textTransform: "uppercase" }}>
            {title}
          </Typography>
          <Grid container spacing={2}>
            {cards.slice(0, 8).map((item, idx) => (
              <Grid item xs={12} sm={6} md={idx % 3 === 0 ? 6 : 3} key={item.id}>
                <Box
                  sx={{
                    minHeight: idx % 3 === 0 ? 360 : 280,
                    clipPath: idx % 2 === 0 ? cinematicTokens.graphics.clipA : cinematicTokens.graphics.clipB,
                    border: `1px solid ${cinematicTokens.colors.line}`,
                    background: item.url
                      ? `linear-gradient(180deg, rgba(5,8,13,0.08), rgba(5,8,13,0.55)), url(${item.url}) center / cover no-repeat`
                      : `linear-gradient(135deg, ${cinematicTokens.colors.bgAlt}, ${cinematicTokens.colors.bg})`,
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}

export function CinematicRichText({ websiteSectionAdapter: adapter = {} }) {
  const body = getRichTextBody(adapter?.props || {});
  const [ref, revealStyle] = useCinematicReveal({ delay: 20 });
  if (!body.title && !body.bodyHtml) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container maxWidth={false} sx={{ maxWidth: `${cinematicTokens.layout.contentMax}px`, px: { xs: 2, md: 4 } }}>
        <Box
          sx={{
            p: { xs: 2.4, md: 3.4 },
            border: `1px solid ${cinematicTokens.colors.line}`,
            bgcolor: alpha(cinematicTokens.colors.surfaceSoft, 0.9),
            "& iframe": { width: "100%", minHeight: 420, border: 0 },
            "& p": { color: cinematicTokens.colors.textSoft, lineHeight: 1.9 },
            "& h2, & h3, & h4": {
              fontFamily: cinematicTokens.typography.headingFont,
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            },
            "& ul, & ol": { color: cinematicTokens.colors.textSoft, lineHeight: 1.8 },
          }}
        >
          {body.title ? (
            <Typography sx={{ mb: 2, fontFamily: cinematicTokens.typography.headingFont, fontWeight: 900, fontSize: "clamp(2rem, 4vw, 3.1rem)", lineHeight: 0.95, textTransform: "uppercase" }}>
              {body.title}
            </Typography>
          ) : null}
          <Box dangerouslySetInnerHTML={{ __html: safeHtml(normalizeBlockHtml(body.bodyHtml || "")) }} />
        </Box>
      </Container>
    </Box>
  );
}

export function CinematicLogoCloud({ websiteSectionAdapter: adapter = {} }) {
  const data = getLogoCloudData(adapter?.props || {});
  const [ref, revealStyle] = useCinematicReveal({ delay: 18 });
  if (!data.title && !data.logos.length) return null;
  const rows = [...data.logos, ...data.logos];
  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container maxWidth={false} sx={{ maxWidth: `${cinematicTokens.layout.shellMax}px`, px: { xs: 2, md: 4 } }}>
        <Stack spacing={2.5}>
          {data.title ? (
            <Typography sx={{ fontFamily: cinematicTokens.typography.headingFont, fontWeight: 900, fontSize: "clamp(1.8rem, 4vw, 3rem)", lineHeight: 0.95, textTransform: "uppercase" }}>
              {data.title}
            </Typography>
          ) : null}
          {data.caption ? (
            <Typography sx={{ maxWidth: 720, color: cinematicTokens.colors.textSoft, lineHeight: 1.75 }}>
              {data.caption}
            </Typography>
          ) : null}
          <Box sx={{ overflow: "hidden", borderTop: `1px solid ${cinematicTokens.colors.line}`, borderBottom: `1px solid ${cinematicTokens.colors.line}`, py: 1.2 }}>
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: "-50%" }}
              transition={{ repeat: Infinity, duration: 24, ease: "linear" }}
              style={{ display: "flex", width: "max-content" }}
            >
              {rows.map((item, idx) => (
                <Stack
                  key={`${item.id}-${idx}`}
                  direction="row"
                  spacing={1.25}
                  alignItems="center"
                  sx={{
                    px: { xs: 1.5, md: 2.2 },
                    py: 1.1,
                    mr: 1.5,
                    minWidth: { xs: 180, md: 220 },
                    borderRadius: 999,
                    bgcolor: alpha(cinematicTokens.colors.surfaceSoft, item.highlight ? 0.94 : 0.78),
                    border: `1px solid ${item.highlight ? alpha(cinematicTokens.colors.accent, 0.4) : cinematicTokens.colors.line}`,
                    flex: "0 0 auto",
                  }}
                >
                  {item.src ? (
                    <Box component="img" src={item.src} alt={item.alt} sx={{ width: 42, height: 42, borderRadius: 999, objectFit: "contain", bgcolor: "#fff", p: 0.4 }} />
                  ) : (
                    <Box sx={{ width: 42, height: 42, borderRadius: 999, bgcolor: alpha(cinematicTokens.colors.accent, 0.18), border: `1px solid ${alpha(cinematicTokens.colors.accent, 0.34)}`, display: "grid", placeItems: "center", fontFamily: cinematicTokens.typography.headingFont, fontWeight: 900, color: cinematicTokens.colors.accent }}>
                      {String(item.label || item.alt || "L").slice(0, 1)}
                    </Box>
                  )}
                  <Box>
                    <Typography sx={{ fontFamily: cinematicTokens.typography.headingFont, fontWeight: 800, fontSize: "0.88rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      {item.label || item.alt}
                    </Typography>
                    {item.caption ? (
                      <Typography sx={{ color: cinematicTokens.colors.textSoft, fontSize: "0.86rem" }}>
                        {item.caption}
                      </Typography>
                    ) : null}
                  </Box>
                </Stack>
              ))}
            </motion.div>
          </Box>
          {data.supportingText ? (
            <Typography sx={{ color: cinematicTokens.colors.textMuted, fontSize: "0.92rem", letterSpacing: "0.03em", textTransform: "uppercase" }}>
              {data.supportingText}
            </Typography>
          ) : null}
        </Stack>
      </Container>
    </Box>
  );
}

export function CinematicFeatureShowcaseSlider({ websiteSectionAdapter: adapter = {} }) {
  const data = getFeatureShowcaseSliderData(adapter?.props || {});
  const [ref, revealStyle] = useCinematicReveal({ delay: 18 });
  const { active, setActive, next, prev, interactionProps } = useRailSlider({
    itemCount: data.items.length,
    autoplay: data.autoplay,
    intervalMs: data.intervalMs,
  });
  if (!data.items.length) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container maxWidth={false} sx={{ maxWidth: `${cinematicTokens.layout.shellMax}px`, px: { xs: 2, md: 4 } }}>
        <Stack spacing={2.4}>
          {data.eyebrow ? (
            <Typography sx={{ color: cinematicTokens.colors.accent, fontFamily: cinematicTokens.typography.headingFont, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase" }}>
              {data.eyebrow}
            </Typography>
          ) : null}
          {data.title ? (
            <Typography sx={{ fontFamily: cinematicTokens.typography.headingFont, fontWeight: 900, fontSize: "clamp(2rem, 4vw, 3.2rem)", lineHeight: 0.92, textTransform: "uppercase" }}>
              {data.title}
            </Typography>
          ) : null}
          {data.subtitle ? (
            <Typography sx={{ maxWidth: 760, color: cinematicTokens.colors.textSoft, lineHeight: 1.8 }}>
              {data.subtitle}
            </Typography>
          ) : null}
          <Box tabIndex={0} role="region" aria-label={data.title || "Feature showcase"} {...interactionProps}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
              <Typography sx={{ color: cinematicTokens.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.12em", fontSize: "0.76rem" }}>
                {String(active + 1).padStart(2, "0")} / {String(data.items.length).padStart(2, "0")}
              </Typography>
              {data.showArrows ? (
                <Stack direction="row" spacing={0.8}>
                  <IconButton onClick={prev} aria-label="Previous slide" sx={{ color: cinematicTokens.colors.text, border: `1px solid ${cinematicTokens.colors.line}` }}>
                    <ChevronLeftIcon />
                  </IconButton>
                  <IconButton onClick={next} aria-label="Next slide" sx={{ color: cinematicTokens.colors.text, border: `1px solid ${cinematicTokens.colors.line}` }}>
                    <ChevronRightIcon />
                  </IconButton>
                </Stack>
              ) : null}
            </Stack>
            <Box sx={{ display: "grid", gridAutoFlow: "column", gridAutoColumns: { xs: "92%", md: "36%" }, gap: 2, overflowX: "auto", pb: 1, scrollSnapType: "x mandatory" }}>
              {data.items.map((item, idx) => (
                <Box
                  key={item.id}
                  onFocus={() => setActive(idx)}
                  onMouseEnter={() => setActive(idx)}
                  sx={{
                    scrollSnapAlign: "start",
                    minHeight: 420,
                    border: `1px solid ${idx === active ? alpha(cinematicTokens.colors.accent, 0.5) : cinematicTokens.colors.line}`,
                    background: item.image
                      ? `linear-gradient(180deg, rgba(5,8,13,0.18), rgba(5,8,13,0.82)), url(${item.image}) center / cover no-repeat`
                      : `linear-gradient(135deg, ${cinematicTokens.colors.bgAlt}, ${cinematicTokens.colors.bg})`,
                    clipPath: idx % 2 === 0 ? cinematicTokens.graphics.clipA : cinematicTokens.graphics.clipB,
                    p: { xs: 2.4, md: 3 },
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {item.badge ? (
                    <Typography sx={{ color: cinematicTokens.colors.accent, fontFamily: cinematicTokens.typography.headingFont, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", fontSize: "0.76rem" }}>
                      {item.badge}
                    </Typography>
                  ) : null}
                  <Typography sx={{ mt: 1.4, fontFamily: cinematicTokens.typography.headingFont, fontWeight: 900, fontSize: "clamp(1.6rem, 3vw, 2.4rem)", lineHeight: 0.94, textTransform: "uppercase" }}>
                    {item.title}
                  </Typography>
                  {item.description ? (
                    <Typography sx={{ mt: 1.2, color: cinematicTokens.colors.textSoft, lineHeight: 1.76 }}>
                      {item.description}
                    </Typography>
                  ) : null}
                  <FamilyLinkButton
                    href={item.ctaLink}
                    label={item.ctaText || "View service"}
                    endIcon={<ArrowOutwardIcon />}
                    sx={{
                      mt: "auto",
                      alignSelf: "flex-start",
                      minHeight: 46,
                      px: 2.4,
                      borderRadius: 999,
                      minWidth: "max-content",
                      whiteSpace: "nowrap",
                      background: `linear-gradient(135deg, ${cinematicTokens.colors.accent} 0%, #ffb65c 100%)`,
                      color: "#071019",
                      fontFamily: cinematicTokens.typography.headingFont,
                      fontWeight: 900,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  />
                </Box>
              ))}
            </Box>
            {data.showDots ? (
              <Stack direction="row" spacing={0.75} justifyContent="center" sx={{ mt: 1.5 }}>
                {data.items.map((item, idx) => (
                  <Box
                    key={item.id}
                    component="button"
                    type="button"
                    aria-label={`Go to slide ${idx + 1}`}
                    onClick={() => setActive(idx)}
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      border: 0,
                      p: 0,
                      bgcolor: idx === active ? cinematicTokens.colors.accent : alpha(cinematicTokens.colors.text, 0.24),
                      cursor: "pointer",
                    }}
                  />
                ))}
              </Stack>
            ) : null}
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}

export function CinematicMetricShowcase({ websiteSectionAdapter: adapter = {} }) {
  const data = getMetricItems(adapter?.props || {});
  const [ref, revealStyle] = useCinematicReveal({ delay: 18 });
  if (!data.items.length) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container maxWidth={false} sx={{ maxWidth: `${cinematicTokens.layout.shellMax}px`, px: { xs: 2, md: 4 } }}>
        <Stack spacing={2.2}>
          {data.title ? (
            <Typography sx={{ fontFamily: cinematicTokens.typography.headingFont, fontWeight: 900, fontSize: "clamp(1.9rem, 4vw, 3rem)", lineHeight: 0.95, textTransform: "uppercase" }}>
              {data.title}
            </Typography>
          ) : null}
          {data.subtitle ? (
            <Typography sx={{ maxWidth: 760, color: cinematicTokens.colors.textSoft, lineHeight: 1.8 }}>
              {data.subtitle}
            </Typography>
          ) : null}
          <Box sx={{ display: "grid", gridAutoFlow: "column", gridAutoColumns: { xs: "82%", md: "32%" }, gap: 2, overflowX: "auto", pb: 1, scrollSnapType: "x mandatory" }}>
            {data.items.map((item, idx) => (
              <Box
                key={item.id}
                sx={{
                  scrollSnapAlign: "start",
                  minHeight: 250,
                  p: { xs: 2.4, md: 3 },
                  clipPath: idx % 2 === 0 ? cinematicTokens.graphics.clipA : cinematicTokens.graphics.clipB,
                  border: `1px solid ${cinematicTokens.colors.lineStrong}`,
                  background:
                    idx % 2 === 0
                      ? "linear-gradient(120deg, rgba(22,24,29,0.96) 0%, rgba(38,68,142,0.92) 70%, rgba(214,221,245,0.88) 100%)"
                      : "linear-gradient(120deg, rgba(20,20,22,0.96) 0%, rgba(27,78,181,0.88) 56%, rgba(232,236,247,0.92) 100%)",
                }}
              >
                <Typography sx={{ color: alpha(cinematicTokens.colors.text, 0.78), fontSize: "1rem" }}>
                  {item.label}
                </Typography>
                <Typography sx={{ mt: 1, fontFamily: cinematicTokens.typography.headingFont, fontWeight: 900, fontSize: "clamp(2rem, 4vw, 3.3rem)", lineHeight: 0.92, color: "#f6eb57" }}>
                  {item.value}
                </Typography>
                {item.caption ? (
                  <Typography sx={{ mt: "auto", pt: 7, color: alpha(cinematicTokens.colors.text, 0.82), lineHeight: 1.7 }}>
                    {item.caption}
                  </Typography>
                ) : null}
              </Box>
            ))}
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}

export function CinematicBookingBar({ websiteSectionAdapter: adapter = {} }) {
  const data = getBookingBarData(adapter);
  const [ref, revealStyle] = useCinematicReveal({ delay: 18 });
  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container maxWidth={false} sx={{ maxWidth: `${cinematicTokens.layout.contentMax}px`, px: { xs: 2, md: 4 } }}>
        <Box
          sx={{
            p: { xs: 2.2, md: 2.8 },
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
            alignItems: { md: "center" },
            justifyContent: "space-between",
            border: `1px solid ${cinematicTokens.colors.lineStrong}`,
            background: alpha(cinematicTokens.colors.surfaceSoft, 0.96),
          }}
        >
          <Typography sx={{ fontFamily: cinematicTokens.typography.headingFont, fontWeight: 900, fontSize: "clamp(1.4rem, 3vw, 2rem)", textTransform: "uppercase", lineHeight: 0.98 }}>
            {data.title || "Request the next step"}
          </Typography>
          <FamilyLinkButton
            href={data.buttonLink}
            label={data.buttonText || "Book now"}
            endIcon={<ArrowOutwardIcon />}
            sx={{
              minHeight: 50,
              px: 2.8,
              borderRadius: 999,
              minWidth: "max-content",
              whiteSpace: "nowrap",
              background: `linear-gradient(135deg, ${cinematicTokens.colors.accent} 0%, #ffb65c 100%)`,
              color: "#071019",
              fontFamily: cinematicTokens.typography.headingFont,
              fontWeight: 900,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              flexShrink: 0,
            }}
          />
        </Box>
      </Container>
    </Box>
  );
}

export function CinematicContact({ websiteSectionAdapter: adapter = {} }) {
  const data = getContactData(adapter?.props || {});
  const [ref, revealStyle] = useCinematicReveal({ delay: 22 });
  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container maxWidth={false} sx={{ maxWidth: `${cinematicTokens.layout.shellMax}px`, px: { xs: 2, md: 4 } }}>
        <Box
          sx={{
            p: { xs: 1.2, md: 1.6 },
            border: `1px solid ${cinematicTokens.colors.line}`,
            bgcolor: alpha(cinematicTokens.colors.surfaceSoft, 0.88),
          }}
        >
          <ContactFormSection
            title={data.title || "Request service"}
            eyebrow={data.eyebrow}
            intro={data.intro.join("</p><p>")}
            submitLabel={data.submitLabel}
            mediaImage={data.mediaImage}
            mediaTitle={data.mediaTitle}
            mediaBody={data.mediaBody.join("</p><p>")}
            fields={data.fields}
            layoutVariant="editorialSplit"
            maxWidth="full"
          />
        </Box>
      </Container>
    </Box>
  );
}

export function CinematicMap({ websiteSectionAdapter: adapter = {} }) {
  const data = getMapDetails(adapter?.props || {});
  const props = adapter?.props || {};
  const src =
    props.embedUrl ||
    (props.query
      ? `https://maps.google.com/maps?q=${encodeURIComponent(props.query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
      : "");
  const [ref, revealStyle] = useCinematicReveal({ delay: 18 });
  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container maxWidth={false} sx={{ maxWidth: `${cinematicTokens.layout.shellMax}px`, px: { xs: 2, md: 4 } }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <Stack spacing={1.3} sx={{ pr: { md: 2 } }}>
              <Typography sx={{ color: cinematicTokens.colors.textMuted, fontFamily: cinematicTokens.typography.headingFont, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", fontSize: "0.76rem" }}>
                {data.eyebrow || "Coverage"}
              </Typography>
              <Typography sx={{ fontFamily: cinematicTokens.typography.headingFont, fontWeight: 900, fontSize: "clamp(2rem, 4vw, 3.2rem)", lineHeight: 0.95, textTransform: "uppercase" }}>
                {data.title || "Find the right response area"}
              </Typography>
              {data.body ? <Typography sx={{ color: cinematicTokens.colors.textSoft, lineHeight: 1.8 }}>{data.body}</Typography> : null}
              {data.details.map((detail, idx) => (
                <Box key={idx} sx={{ pt: 1.2, borderTop: `1px solid ${cinematicTokens.colors.line}` }}>
                  {detail.title ? (
                    <Typography sx={{ fontFamily: cinematicTokens.typography.headingFont, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {detail.title}
                    </Typography>
                  ) : null}
                  {detail.text ? <Typography sx={{ mt: 0.4, color: cinematicTokens.colors.textSoft }}>{detail.text}</Typography> : null}
                </Box>
              ))}
            </Stack>
          </Grid>
          <Grid item xs={12} md={7}>
            <Box
              sx={{
                overflow: "hidden",
                minHeight: 420,
                border: `1px solid ${cinematicTokens.colors.lineStrong}`,
                clipPath: cinematicTokens.graphics.clipA,
                "& iframe": { width: "100%", height: 420, border: 0, display: "block" },
              }}
            >
              {src ? <iframe title={data.title || "Map"} src={src} loading="lazy" /> : null}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
