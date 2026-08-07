import React from "react";
import { Accordion, AccordionDetails, AccordionSummary, Box, Container, Grid, Stack, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import dispatchTokens from "../tokens";
import { useDispatchReveal } from "../motion";
import { FamilyLinkButton } from "../../hvac-shared/runtime";
import { getBookingBarData, getContactData, getFaqItems, getGalleryItems, getMapDetails, getRichTextBody } from "../../hvac-shared/canonicalHvacAdapter";
import ContactFormSection from "../../../ContactFormSection";
import { normalizeBlockHtml } from "../../../../../utils/html";
import { safeHtml } from "../../../../../utils/safeHtml";
import {
  sanitizeDispatchCta,
  sanitizeDispatchImage,
  sanitizeDispatchText,
} from "./contentSanitizer";

export function DispatchFAQ({ websiteSectionAdapter: adapter = {} }) {
  const items = getFaqItems(adapter?.props || {});
  const title = sanitizeDispatchText(adapter?.props?.title, "Questions clients ask before booking");
  const [ref, revealStyle] = useDispatchReveal({ delay: 14 });
  if (!items.length) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle, bgcolor: dispatchTokens.colors.cream }}>
      <Container maxWidth={false} sx={{ maxWidth: `${dispatchTokens.layout.contentMax}px`, px: { xs: 2, md: 4 }, py: 3.5 }}>
        <Typography sx={{ fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900, textTransform: "uppercase", fontSize: "2rem", mb: 2 }}>{title}</Typography>
        {items.map((item) => (
          <Accordion key={item.id} disableGutters elevation={0} sx={{ mb: 1, bgcolor: "#fff", "&:before": { display: "none" } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900, textTransform: "uppercase" }}>{item.question}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography sx={{ color: "rgba(24,21,18,0.78)", lineHeight: 1.75 }}>{item.answer}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Container>
    </Box>
  );
}

export function DispatchGallery({ websiteSectionAdapter: adapter = {} }) {
  const { imageItems } = getGalleryItems(adapter?.props || {});
  const [ref, revealStyle] = useDispatchReveal({ delay: 14 });
  if (!imageItems.length) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle, bgcolor: dispatchTokens.colors.bg }}>
      <Container maxWidth={false} sx={{ maxWidth: `${dispatchTokens.layout.shellMax}px`, px: { xs: 2, md: 4 }, py: 4 }}>
        <Grid container spacing={2}>
          {imageItems.slice(0, 6).map((item, idx) => (
            <Grid item xs={12} sm={6} md={idx === 0 ? 6 : 3} key={item.id}>
              <Box sx={{ minHeight: idx === 0 ? 320 : 240, background: `url(${sanitizeDispatchImage(item.url, "project", idx)}) center / cover no-repeat`, border: `1px solid ${dispatchTokens.colors.lineStrong}` }} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

export function DispatchRichText({ websiteSectionAdapter: adapter = {} }) {
  const body = getRichTextBody(adapter?.props || {});
  const [ref, revealStyle] = useDispatchReveal({ delay: 12 });
  if (!body.title && !body.bodyHtml) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle, bgcolor: dispatchTokens.colors.cream }}>
      <Container maxWidth={false} sx={{ maxWidth: `${dispatchTokens.layout.contentMax}px`, px: { xs: 2, md: 4 }, py: 3.5 }}>
        {body.title ? <Typography sx={{ fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900, textTransform: "uppercase", fontSize: "2rem", mb: 1.5 }}>{sanitizeDispatchText(body.title, "Service details")}</Typography> : null}
        <Box dangerouslySetInnerHTML={{ __html: safeHtml(normalizeBlockHtml(body.bodyHtml || "")) }} />
      </Container>
    </Box>
  );
}

export function DispatchBookingBar({ websiteSectionAdapter: adapter = {} }) {
  const data = getBookingBarData(adapter);
  const [ref, revealStyle] = useDispatchReveal({ delay: 10 });
  return (
    <Box ref={ref} sx={{ ...revealStyle, bgcolor: dispatchTokens.colors.red }}>
      <Container maxWidth={false} sx={{ maxWidth: `${dispatchTokens.layout.contentMax}px`, px: { xs: 2, md: 4 }, py: 2.2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} justifyContent="space-between" alignItems={{ md: "center" }}>
          <Typography sx={{ color: "#fff7ef", fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900, textTransform: "uppercase" }}>{sanitizeDispatchText(data.title, "Ready to book the next visit?")}</Typography>
          <FamilyLinkButton href={data.buttonLink} label={sanitizeDispatchCta(data.buttonText, "Book service")} sx={{ borderRadius: 0, bgcolor: dispatchTokens.colors.cream, color: dispatchTokens.colors.ink, fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900 }} />
        </Stack>
      </Container>
    </Box>
  );
}

export function DispatchContact({ websiteSectionAdapter: adapter = {} }) {
  const data = getContactData(adapter?.props || {});
  const [ref, revealStyle] = useDispatchReveal({ delay: 14 });
  return (
    <Box ref={ref} sx={{ ...revealStyle, bgcolor: dispatchTokens.colors.cream }}>
      <Container maxWidth={false} sx={{ maxWidth: `${dispatchTokens.layout.shellMax}px`, px: { xs: 2, md: 4 }, py: 3.5 }}>
        <ContactFormSection title={sanitizeDispatchText(data.title, "Request service")} intro={data.intro.join("</p><p>")} submitLabel={sanitizeDispatchCta(data.submitLabel, "Send request")} mediaImage={sanitizeDispatchImage(data.mediaImage, "hero", 1)} mediaTitle={sanitizeDispatchText(data.mediaTitle, "Dispatch-ready service request")} mediaBody={data.mediaBody.join("</p><p>")} fields={data.fields} layoutVariant="editorialSplit" maxWidth="full" />
      </Container>
    </Box>
  );
}

export function DispatchMap({ websiteSectionAdapter: adapter = {} }) {
  const data = getMapDetails(adapter?.props || {});
  const props = adapter?.props || {};
  const src = props.embedUrl || (props.query ? `https://maps.google.com/maps?q=${encodeURIComponent(props.query)}&t=&z=15&ie=UTF8&iwloc=&output=embed` : "");
  const [ref, revealStyle] = useDispatchReveal({ delay: 14 });
  return (
    <Box ref={ref} sx={{ ...revealStyle, bgcolor: dispatchTokens.colors.bg }}>
      <Container maxWidth={false} sx={{ maxWidth: `${dispatchTokens.layout.shellMax}px`, px: { xs: 2, md: 4 }, py: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <Typography sx={{ color: dispatchTokens.colors.orange, fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900, textTransform: "uppercase", fontSize: "2rem" }}>{sanitizeDispatchText(data.title, "Service coverage")}</Typography>
            {data.body ? <Typography sx={{ mt: 1, color: dispatchTokens.colors.textSoft, lineHeight: 1.72 }}>{sanitizeDispatchText(data.body, "Show the coverage area, office details, and the fastest way to request service or ask for an estimate.")}</Typography> : null}
          </Grid>
          <Grid item xs={12} md={7}>
            {src ? <Box sx={{ "& iframe": { width: "100%", height: 360, border: 0, display: "block" }, border: `1px solid ${dispatchTokens.colors.lineStrong}` }}><iframe title={data.title || "Map"} src={src} loading="lazy" /></Box> : null}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
