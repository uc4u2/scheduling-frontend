import React from "react";
import { Accordion, AccordionDetails, AccordionSummary, Box, Container, Grid, Stack, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import ContactFormSection from "../../../ContactFormSection";
import { safeHtml } from "../../../../../utils/safeHtml";
import { normalizeBlockHtml } from "../../../../../utils/html";
import corporateTokens from "../tokens";
import { useCorporateReveal } from "../motion";
import { FamilyLinkButton } from "../../hvac-shared/runtime";
import {
  getBookingBarData,
  getContactData,
  getFaqItems,
  getGalleryItems,
  getMapDetails,
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
