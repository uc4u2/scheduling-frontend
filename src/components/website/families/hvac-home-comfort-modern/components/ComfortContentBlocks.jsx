import React from "react";
import { Accordion, AccordionDetails, AccordionSummary, Box, Container, Grid, Stack, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ContactFormSection from "../../../ContactFormSection";
import { safeHtml } from "../../../../../utils/safeHtml";
import { normalizeBlockHtml } from "../../../../../utils/html";
import comfortTokens from "../tokens";
import { useComfortReveal } from "../motion";
import { FamilyLinkButton } from "../../hvac-shared/runtime";
import { getBookingBarData, getContactData, getFaqItems, getGalleryItems, getMapDetails, getRichTextBody } from "../../hvac-shared/canonicalHvacAdapter";

export function ComfortFAQ({ websiteSectionAdapter: adapter = {} }) {
  const items = getFaqItems(adapter?.props || {});
  const title = adapter?.props?.title || "Questions";
  const [ref, revealStyle] = useComfortReveal({ delay: 14 });
  if (!items.length) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle, bgcolor: "#fff" }}>
      <Container maxWidth={false} sx={{ maxWidth: `${comfortTokens.layout.contentMax}px`, px: { xs: 2, md: 4 }, py: 4 }}>
        <Typography sx={{ color: comfortTokens.colors.text, fontFamily: comfortTokens.typography.headingFont, fontWeight: 700, fontSize: "clamp(2rem, 4vw, 3rem)", mb: 2 }}>{title}</Typography>
        {items.map((item) => (
          <Accordion key={item.id} disableGutters elevation={0} sx={{ mb: 1, bgcolor: comfortTokens.colors.surfaceSoft, borderRadius: "18px !important", border: `1px solid ${comfortTokens.colors.line}`, "&:before": { display: "none" } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ color: comfortTokens.colors.navy, fontWeight: 700 }}>{item.question}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography sx={{ color: comfortTokens.colors.textSoft, lineHeight: 1.75 }}>{item.answer}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Container>
    </Box>
  );
}

export function ComfortGallery({ websiteSectionAdapter: adapter = {} }) {
  const { imageItems } = getGalleryItems(adapter?.props || {});
  const [ref, revealStyle] = useComfortReveal({ delay: 14 });
  if (!imageItems.length) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle, bgcolor: comfortTokens.colors.bg }}>
      <Container maxWidth={false} sx={{ maxWidth: `${comfortTokens.layout.shellMax}px`, px: { xs: 2, md: 4 }, py: 4 }}>
        <Grid container spacing={2}>
          {imageItems.slice(0, 6).map((item, idx) => (
            <Grid item xs={12} sm={6} md={idx === 0 ? 6 : 3} key={item.id}>
              <Box sx={{ minHeight: idx === 0 ? 320 : 240, borderRadius: idx % 2 === 0 ? "30px 30px 90px 30px" : "90px 30px 30px 30px", background: `url(${item.url}) center / cover no-repeat` }} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

export function ComfortRichText({ websiteSectionAdapter: adapter = {} }) {
  const body = getRichTextBody(adapter?.props || {});
  const [ref, revealStyle] = useComfortReveal({ delay: 12 });
  if (!body.title && !body.bodyHtml) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle, bgcolor: "#fff" }}>
      <Container maxWidth={false} sx={{ maxWidth: `${comfortTokens.layout.contentMax}px`, px: { xs: 2, md: 4 }, py: 4 }}>
        <Box sx={{ p: { xs: 2.2, md: 3 }, bgcolor: comfortTokens.colors.surfaceSoft, borderRadius: "28px 28px 84px 28px", border: `1px solid ${comfortTokens.colors.line}` }}>
          {body.title ? <Typography sx={{ color: comfortTokens.colors.text, fontFamily: comfortTokens.typography.headingFont, fontWeight: 700, fontSize: "2rem", mb: 1.5 }}>{body.title}</Typography> : null}
          <Box dangerouslySetInnerHTML={{ __html: safeHtml(normalizeBlockHtml(body.bodyHtml || "")) }} />
        </Box>
      </Container>
    </Box>
  );
}

export function ComfortBookingBar({ websiteSectionAdapter: adapter = {} }) {
  const data = getBookingBarData(adapter);
  const [ref, revealStyle] = useComfortReveal({ delay: 10 });
  return (
    <Box ref={ref} sx={{ ...revealStyle, bgcolor: comfortTokens.colors.bgAlt }}>
      <Container maxWidth={false} sx={{ maxWidth: `${comfortTokens.layout.contentMax}px`, px: { xs: 2, md: 4 }, py: 2.5 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} justifyContent="space-between" alignItems={{ md: "center" }}>
          <Typography sx={{ color: comfortTokens.colors.text, fontFamily: comfortTokens.typography.headingFont, fontWeight: 700 }}>{data.title || "Book the next step"}</Typography>
          <FamilyLinkButton href={data.buttonLink} label={data.buttonText || "Book service"} sx={{ borderRadius: 999, background: `linear-gradient(135deg, ${comfortTokens.colors.navy} 0%, ${comfortTokens.colors.teal} 100%)`, color: "#fff", fontWeight: 800 }} />
        </Stack>
      </Container>
    </Box>
  );
}

export function ComfortContact({ websiteSectionAdapter: adapter = {} }) {
  const data = getContactData(adapter?.props || {});
  const [ref, revealStyle] = useComfortReveal({ delay: 12 });
  return (
    <Box ref={ref} sx={{ ...revealStyle, bgcolor: comfortTokens.colors.cream }}>
      <Container maxWidth={false} sx={{ maxWidth: `${comfortTokens.layout.shellMax}px`, px: { xs: 2, md: 4 }, py: 4 }}>
        <ContactFormSection title={data.title || "Request service"} intro={data.intro.join("</p><p>")} submitLabel={data.submitLabel} mediaImage={data.mediaImage} mediaTitle={data.mediaTitle} mediaBody={data.mediaBody.join("</p><p>")} fields={data.fields} layoutVariant="editorialSplit" maxWidth="full" />
      </Container>
    </Box>
  );
}

export function ComfortMap({ websiteSectionAdapter: adapter = {} }) {
  const data = getMapDetails(adapter?.props || {});
  const props = adapter?.props || {};
  const src = props.embedUrl || (props.query ? `https://maps.google.com/maps?q=${encodeURIComponent(props.query)}&t=&z=15&ie=UTF8&iwloc=&output=embed` : "");
  const [ref, revealStyle] = useComfortReveal({ delay: 12 });
  return (
    <Box ref={ref} sx={{ ...revealStyle, bgcolor: "#fff" }}>
      <Container maxWidth={false} sx={{ maxWidth: `${comfortTokens.layout.shellMax}px`, px: { xs: 2, md: 4 }, py: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <Typography sx={{ color: comfortTokens.colors.text, fontFamily: comfortTokens.typography.headingFont, fontWeight: 700, fontSize: "2rem" }}>{data.title || "Service area"}</Typography>
            {data.body ? <Typography sx={{ mt: 1, color: comfortTokens.colors.textSoft, lineHeight: 1.75 }}>{data.body}</Typography> : null}
          </Grid>
          <Grid item xs={12} md={7}>
            {src ? <Box sx={{ borderRadius: "28px 28px 84px 28px", overflow: "hidden", border: `1px solid ${comfortTokens.colors.line}`, "& iframe": { width: "100%", height: 380, border: 0, display: "block" } }}><iframe title={data.title || "Map"} src={src} loading="lazy" /></Box> : null}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
