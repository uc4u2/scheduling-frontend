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
import corporateTokens from "../tokens";
import { useCorporateReveal } from "../motion";
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

export function CorporateFAQ({ websiteSectionAdapter: adapter = {} }) {
  const items = getFaqItems(adapter?.props || {});
  const title = adapter?.props?.title || "Questions";
  const [ref, revealStyle] = useCorporateReveal({ delay: 16 });
  if (!items.length) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container maxWidth={false} sx={{ maxWidth: `${corporateTokens.layout.contentMax}px`, px: { xs: 2, md: 4 } }}>
        <Stack spacing={2}>
          <Typography sx={{ fontFamily: corporateTokens.typography.headingFont, fontWeight: 800, fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 0.96 }}>{title}</Typography>
          {items.map((item) => (
            <Accordion key={item.id} disableGutters elevation={0} sx={{ bgcolor: "#fff", borderRadius: "16px !important", border: `1px solid ${corporateTokens.colors.line}`, "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontFamily: corporateTokens.typography.headingFont, fontWeight: 700, color: corporateTokens.colors.navy }}>{item.question}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography sx={{ color: corporateTokens.colors.textSoft, lineHeight: 1.75 }}>{item.answer}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}

export function CorporateGallery({ websiteSectionAdapter: adapter = {} }) {
  const { imageItems, videoItems } = getGalleryItems(adapter?.props || {});
  const cards = imageItems.length ? imageItems : videoItems.map((item) => ({ ...item, url: item.poster || "" }));
  const title = adapter?.props?.title || "Projects";
  const [ref, revealStyle] = useCorporateReveal({ delay: 16 });
  if (!cards.length) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container maxWidth={false} sx={{ maxWidth: `${corporateTokens.layout.shellMax}px`, px: { xs: 2, md: 4 } }}>
        <Stack spacing={2}>
          <Typography sx={{ fontFamily: corporateTokens.typography.headingFont, fontWeight: 800, fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 0.96 }}>{title}</Typography>
          <Grid container spacing={2}>
            {cards.slice(0, 8).map((item, idx) => (
              <Grid item xs={12} sm={6} md={idx % 4 === 0 ? 6 : 3} key={item.id}>
                <Box sx={{ minHeight: idx % 4 === 0 ? 320 : 240, borderRadius: 3, background: item.url ? `url(${item.url}) center / cover no-repeat` : corporateTokens.colors.surfaceSoft }} />
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}

export function CorporateRichText({ websiteSectionAdapter: adapter = {} }) {
  const body = getRichTextBody(adapter?.props || {});
  const [ref, revealStyle] = useCorporateReveal({ delay: 14 });
  if (!body.title && !body.bodyHtml) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container maxWidth={false} sx={{ maxWidth: `${corporateTokens.layout.contentMax}px`, px: { xs: 2, md: 4 } }}>
        <Box sx={{ p: { xs: 2.4, md: 3 }, bgcolor: "#fff", borderRadius: 3, border: `1px solid ${corporateTokens.colors.line}`, "& iframe": { width: "100%", minHeight: 420, border: 0 }, "& p": { color: corporateTokens.colors.textSoft, lineHeight: 1.85 }, "& h2, & h3, & h4": { fontFamily: corporateTokens.typography.headingFont, color: corporateTokens.colors.text } }}>
          {body.title ? <Typography sx={{ mb: 2, fontFamily: corporateTokens.typography.headingFont, fontWeight: 800, fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 0.96 }}>{body.title}</Typography> : null}
          <Box dangerouslySetInnerHTML={{ __html: safeHtml(normalizeBlockHtml(body.bodyHtml || "")) }} />
        </Box>
      </Container>
    </Box>
  );
}

export function CorporateLogoCloud({ websiteSectionAdapter: adapter = {} }) {
  const data = getLogoCloudData(adapter?.props || {});
  const [ref, revealStyle] = useCorporateReveal({ delay: 12 });
  if (!data.title && !data.logos.length) return null;
  const rows = [...data.logos, ...data.logos];
  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container maxWidth={false} sx={{ maxWidth: `${corporateTokens.layout.shellMax}px`, px: { xs: 2, md: 4 } }}>
        <Stack spacing={2.2}>
          {data.title ? (
            <Typography sx={{ fontFamily: corporateTokens.typography.headingFont, fontWeight: 800, fontSize: "clamp(1.8rem, 4vw, 2.8rem)", lineHeight: 0.98 }}>
              {data.title}
            </Typography>
          ) : null}
          {data.caption ? (
            <Typography sx={{ maxWidth: 760, color: corporateTokens.colors.textSoft, lineHeight: 1.75 }}>
              {data.caption}
            </Typography>
          ) : null}
          <Box sx={{ overflow: "hidden", py: 1 }}>
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
                    px: { xs: 1.4, md: 2 },
                    py: 1.15,
                    mr: 1.4,
                    minWidth: { xs: 180, md: 220 },
                    borderRadius: 999,
                    bgcolor: "#fff",
                    border: `1px solid ${item.highlight ? alpha(corporateTokens.colors.teal, 0.45) : corporateTokens.colors.line}`,
                    boxShadow: item.highlight ? "0 12px 30px rgba(19,125,134,0.12)" : "none",
                    flex: "0 0 auto",
                  }}
                >
                  {item.src ? (
                    <Box component="img" src={item.src} alt={item.alt} sx={{ width: 44, height: 44, borderRadius: 2, objectFit: "contain", p: 0.35, bgcolor: "#f8fbfd" }} />
                  ) : (
                    <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: alpha(corporateTokens.colors.sky, 0.18), display: "grid", placeItems: "center", color: corporateTokens.colors.navy, fontFamily: corporateTokens.typography.headingFont, fontWeight: 800 }}>
                      {String(item.label || item.alt || "L").slice(0, 1)}
                    </Box>
                  )}
                  <Box>
                    <Typography sx={{ fontFamily: corporateTokens.typography.headingFont, fontWeight: 700, color: corporateTokens.colors.navy }}>
                      {item.label || item.alt}
                    </Typography>
                    {item.caption ? <Typography sx={{ color: corporateTokens.colors.textMuted, fontSize: "0.86rem" }}>{item.caption}</Typography> : null}
                  </Box>
                </Stack>
              ))}
            </motion.div>
          </Box>
          {data.supportingText ? (
            <Typography sx={{ color: corporateTokens.colors.textMuted, fontSize: "0.92rem" }}>
              {data.supportingText}
            </Typography>
          ) : null}
        </Stack>
      </Container>
    </Box>
  );
}

export function CorporateFeatureShowcaseSlider({ websiteSectionAdapter: adapter = {} }) {
  const data = getFeatureShowcaseSliderData(adapter?.props || {});
  const [ref, revealStyle] = useCorporateReveal({ delay: 12 });
  const { active, setActive, next, prev, interactionProps } = useRailSlider({
    itemCount: data.items.length,
    autoplay: data.autoplay,
    intervalMs: data.intervalMs,
  });
  if (!data.items.length) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container maxWidth={false} sx={{ maxWidth: `${corporateTokens.layout.shellMax}px`, px: { xs: 2, md: 4 } }}>
        <Stack spacing={2.2}>
          {data.eyebrow ? (
            <Typography sx={{ color: corporateTokens.colors.teal, fontWeight: 700 }}>
              {data.eyebrow}
            </Typography>
          ) : null}
          {data.title ? (
            <Typography sx={{ fontFamily: corporateTokens.typography.headingFont, fontWeight: 800, fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 0.96 }}>
              {data.title}
            </Typography>
          ) : null}
          {data.subtitle ? (
            <Typography sx={{ maxWidth: 760, color: corporateTokens.colors.textSoft, lineHeight: 1.75 }}>
              {data.subtitle}
            </Typography>
          ) : null}
          <Box tabIndex={0} role="region" aria-label={data.title || "Feature showcase"} {...interactionProps}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
              <Typography sx={{ color: corporateTokens.colors.textMuted, fontSize: "0.85rem" }}>
                {String(active + 1).padStart(2, "0")} / {String(data.items.length).padStart(2, "0")}
              </Typography>
              {data.showArrows ? (
                <Stack direction="row" spacing={0.8}>
                  <IconButton onClick={prev} aria-label="Previous slide" sx={{ border: `1px solid ${corporateTokens.colors.line}` }}>
                    <ChevronLeftIcon />
                  </IconButton>
                  <IconButton onClick={next} aria-label="Next slide" sx={{ border: `1px solid ${corporateTokens.colors.line}` }}>
                    <ChevronRightIcon />
                  </IconButton>
                </Stack>
              ) : null}
            </Stack>
            <Box sx={{ display: "grid", gridAutoFlow: "column", gridAutoColumns: { xs: "92%", md: "38%" }, gap: 2, overflowX: "auto", pb: 1, scrollSnapType: "x mandatory" }}>
              {data.items.map((item, idx) => (
                <Box
                  key={item.id}
                  onFocus={() => setActive(idx)}
                  onMouseEnter={() => setActive(idx)}
                  sx={{
                    scrollSnapAlign: "start",
                    minHeight: 380,
                    p: { xs: 2.4, md: 2.8 },
                    bgcolor: idx === active ? "#ffffff" : alpha("#ffffff", 0.9),
                    borderRadius: 4,
                    border: `1px solid ${idx === active ? alpha(corporateTokens.colors.teal, 0.4) : corporateTokens.colors.line}`,
                    boxShadow: idx === active ? "0 24px 54px rgba(16,55,83,0.12)" : "0 14px 30px rgba(16,55,83,0.06)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Box sx={{ minHeight: 190, borderRadius: 3, background: item.image ? `url(${item.image}) center / cover no-repeat` : `linear-gradient(135deg, ${corporateTokens.colors.surfaceSoft} 0%, #ffffff 100%)` }} />
                  {item.badge ? (
                    <Typography sx={{ mt: 1.5, color: corporateTokens.colors.teal, fontWeight: 700 }}>
                      {item.badge}
                    </Typography>
                  ) : null}
                  <Typography sx={{ mt: 0.6, fontFamily: corporateTokens.typography.headingFont, fontWeight: 800, fontSize: "1.5rem", lineHeight: 1.02, color: corporateTokens.colors.navy }}>
                    {item.title}
                  </Typography>
                  {item.description ? (
                    <Typography sx={{ mt: 1, color: corporateTokens.colors.textSoft, lineHeight: 1.75 }}>
                      {item.description}
                    </Typography>
                  ) : null}
                  <FamilyLinkButton
                    href={item.ctaLink}
                    label={item.ctaText || "Learn more"}
                    endIcon={<ArrowOutwardIcon />}
                    variant="text"
                    sx={{
                      mt: "auto",
                      alignSelf: "flex-start",
                      px: 0,
                      color: corporateTokens.colors.teal,
                      fontWeight: 700,
                    }}
                  />
                </Box>
              ))}
            </Box>
            {data.showDots ? (
              <Stack direction="row" spacing={0.75} justifyContent="center" sx={{ mt: 1.4 }}>
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
                      bgcolor: idx === active ? corporateTokens.colors.teal : alpha(corporateTokens.colors.navy, 0.18),
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

export function CorporateMetricShowcase({ websiteSectionAdapter: adapter = {} }) {
  const data = getMetricItems(adapter?.props || {});
  const [ref, revealStyle] = useCorporateReveal({ delay: 12 });
  if (!data.items.length) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container maxWidth={false} sx={{ maxWidth: `${corporateTokens.layout.shellMax}px`, px: { xs: 2, md: 4 } }}>
        <Stack spacing={2.2}>
          {data.title ? (
            <Typography sx={{ fontFamily: corporateTokens.typography.headingFont, fontWeight: 800, fontSize: "clamp(1.9rem, 4vw, 3rem)", lineHeight: 0.98 }}>
              {data.title}
            </Typography>
          ) : null}
          {data.subtitle ? (
            <Typography sx={{ maxWidth: 760, color: corporateTokens.colors.textSoft, lineHeight: 1.75 }}>
              {data.subtitle}
            </Typography>
          ) : null}
          <Box sx={{ display: "grid", gridAutoFlow: "column", gridAutoColumns: { xs: "82%", md: "31%" }, gap: 2, overflowX: "auto", pb: 1, scrollSnapType: "x mandatory" }}>
            {data.items.map((item) => (
              <Box
                key={item.id}
                sx={{
                  scrollSnapAlign: "start",
                  minHeight: 240,
                  p: { xs: 2.4, md: 3 },
                  borderRadius: 4,
                  bgcolor: "#fff",
                  border: `1px solid ${corporateTokens.colors.line}`,
                  boxShadow: "0 16px 42px rgba(15,23,42,0.08)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <CheckCircleOutlineIcon sx={{ color: corporateTokens.colors.teal }} />
                  <Typography sx={{ color: corporateTokens.colors.textMuted }}>{item.label}</Typography>
                </Stack>
                <Typography sx={{ mt: 2, fontFamily: corporateTokens.typography.headingFont, fontWeight: 800, fontSize: "clamp(2rem, 4vw, 3.2rem)", lineHeight: 0.94, color: corporateTokens.colors.navy }}>
                  {item.value}
                </Typography>
                {item.caption ? (
                  <Typography sx={{ mt: "auto", pt: 6, color: corporateTokens.colors.textSoft, lineHeight: 1.7 }}>
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

export function CorporateBookingBar({ websiteSectionAdapter: adapter = {} }) {
  const data = getBookingBarData(adapter);
  const [ref, revealStyle] = useCorporateReveal({ delay: 14 });
  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container maxWidth={false} sx={{ maxWidth: `${corporateTokens.layout.contentMax}px`, px: { xs: 2, md: 4 } }}>
        <Box sx={{ p: { xs: 2.2, md: 2.6 }, display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 1.5, alignItems: { md: "center" }, justifyContent: "space-between", bgcolor: "#fff", borderRadius: 3, border: `1px solid ${corporateTokens.colors.line}` }}>
          <Typography sx={{ fontFamily: corporateTokens.typography.headingFont, fontWeight: 800, fontSize: "clamp(1.35rem, 3vw, 1.9rem)", lineHeight: 1 }}>
            {data.title || "Request the next step"}
          </Typography>
          <FamilyLinkButton href={data.buttonLink} label={data.buttonText || "Book now"} endIcon={<ArrowOutwardIcon />} sx={{ minHeight: 48, px: 2.6, borderRadius: 999, background: `linear-gradient(135deg, ${corporateTokens.colors.navy} 0%, ${corporateTokens.colors.teal} 100%)`, color: "#fff", fontFamily: corporateTokens.typography.headingFont, fontWeight: 800 }} />
        </Box>
      </Container>
    </Box>
  );
}

export function CorporateContact({ websiteSectionAdapter: adapter = {} }) {
  const data = getContactData(adapter?.props || {});
  const [ref, revealStyle] = useCorporateReveal({ delay: 16 });
  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container maxWidth={false} sx={{ maxWidth: `${corporateTokens.layout.shellMax}px`, px: { xs: 2, md: 4 } }}>
        <Box sx={{ p: { xs: 1.2, md: 1.6 }, bgcolor: "#fff", borderRadius: 4, border: `1px solid ${corporateTokens.colors.line}` }}>
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

export function CorporateMap({ websiteSectionAdapter: adapter = {} }) {
  const data = getMapDetails(adapter?.props || {});
  const props = adapter?.props || {};
  const src =
    props.embedUrl ||
    (props.query
      ? `https://maps.google.com/maps?q=${encodeURIComponent(props.query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
      : "");
  const [ref, revealStyle] = useCorporateReveal({ delay: 16 });
  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container maxWidth={false} sx={{ maxWidth: `${corporateTokens.layout.shellMax}px`, px: { xs: 2, md: 4 } }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <Stack spacing={1.2}>
              <Typography sx={{ color: corporateTokens.colors.teal, fontWeight: 700 }}>{data.eyebrow || "Coverage"}</Typography>
              <Typography sx={{ fontFamily: corporateTokens.typography.headingFont, fontWeight: 800, fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 0.96 }}>{data.title || "Service area"}</Typography>
              {data.body ? <Typography sx={{ color: corporateTokens.colors.textSoft, lineHeight: 1.75 }}>{data.body}</Typography> : null}
              {data.details.map((detail, idx) => (
                <Box key={idx} sx={{ pt: 1.1, borderTop: `1px solid ${corporateTokens.colors.line}` }}>
                  {detail.title ? <Typography sx={{ fontFamily: corporateTokens.typography.headingFont, fontWeight: 700, color: corporateTokens.colors.navy }}>{detail.title}</Typography> : null}
                  {detail.text ? <Typography sx={{ mt: 0.3, color: corporateTokens.colors.textSoft }}>{detail.text}</Typography> : null}
                </Box>
              ))}
            </Stack>
          </Grid>
          <Grid item xs={12} md={7}>
            <Box sx={{ overflow: "hidden", borderRadius: 4, border: `1px solid ${corporateTokens.colors.line}`, "& iframe": { width: "100%", height: 420, border: 0, display: "block" } }}>
              {src ? <iframe title={data.title || "Map"} src={src} loading="lazy" /> : null}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
