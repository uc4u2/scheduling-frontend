import React from "react";
import { Box, Container, Grid, Typography } from "@mui/material";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import dispatchTokens from "../tokens";
import { useDispatchReveal } from "../motion";
import { FamilyLinkButton } from "../../hvac-shared/runtime";
import { getStoryData } from "../../hvac-shared/canonicalHvacAdapter";
import {
  sanitizeDispatchCta,
  sanitizeDispatchProject,
} from "./contentSanitizer";

export default function DispatchProject({ websiteSectionAdapter: adapter = {} }) {
  const data = sanitizeDispatchProject(getStoryData(adapter?.props || {}));
  const [ref, revealStyle] = useDispatchReveal({ delay: 16 });
  if (!data.title && !data.mediaImage && !data.mediaUrl) return null;
  return (
    <Box ref={ref} sx={{ ...revealStyle, bgcolor: dispatchTokens.colors.bg }}>
      <Container maxWidth={false} sx={{ maxWidth: `${dispatchTokens.layout.shellMax}px`, px: { xs: 2, md: 4 }, py: { xs: 3, md: 4 } }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={7}>
            <Box sx={{ minHeight: 420, background: data.mediaImage ? `url(${data.mediaImage}) center / cover no-repeat` : dispatchTokens.colors.bgAlt, border: `1px solid ${dispatchTokens.colors.lineStrong}` }} />
          </Grid>
          <Grid item xs={12} md={5}>
            <Box sx={{ p: { xs: 2.2, md: 3 }, bgcolor: dispatchTokens.colors.surface, borderTop: `6px solid ${dispatchTokens.colors.orange}`, height: "100%" }}>
              {data.eyebrow ? <Typography sx={{ color: dispatchTokens.colors.gold, fontWeight: 800 }}>{data.eyebrow}</Typography> : null}
              <Typography sx={{ mt: 1, fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900, textTransform: "uppercase", fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 0.94 }}>{data.title}</Typography>
              {data.body.map((paragraph, idx) => <Typography key={idx} sx={{ mt: 1.2, color: dispatchTokens.colors.textSoft, lineHeight: 1.74 }}>{paragraph}</Typography>)}
              {data.ctaText ? <FamilyLinkButton href={data.ctaLink} label={sanitizeDispatchCta(data.ctaText, "View project")} endIcon={<ArrowOutwardIcon />} sx={{ mt: 2, borderRadius: 0, bgcolor: dispatchTokens.colors.orange, color: "#1a130e", fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900 }} /> : null}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
