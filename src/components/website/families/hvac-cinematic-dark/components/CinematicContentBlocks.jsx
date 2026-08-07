import React from "react";
import { alpha, Accordion, AccordionDetails, AccordionSummary, Box, Container, Grid, Stack, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import ContactFormSection from "../../../ContactFormSection";
import { safeHtml } from "../../../../../utils/safeHtml";
import { normalizeBlockHtml } from "../../../../../utils/html";
import cinematicTokens from "../tokens";
import { useCinematicReveal } from "../motion";
import { FamilyLinkButton } from "../../hvac-shared/runtime";
import {
  getBookingBarData,
  getContactData,
  getFaqItems,
  getGalleryItems,
  getMapDetails,
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
              background: `linear-gradient(135deg, ${cinematicTokens.colors.accent} 0%, #ffb65c 100%)`,
              color: "#071019",
              fontFamily: cinematicTokens.typography.headingFont,
              fontWeight: 900,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
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
