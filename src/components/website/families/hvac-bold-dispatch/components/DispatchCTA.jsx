import React from "react";
import { Box, Container, Stack, Typography } from "@mui/material";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import dispatchTokens from "../tokens";
import { useDispatchReveal } from "../motion";
import { FamilyLinkButton } from "../../hvac-shared/runtime";
import { getBookingBarData } from "../../hvac-shared/canonicalHvacAdapter";
import { sanitizeDispatchCta, sanitizeDispatchText } from "./contentSanitizer";

export function DispatchEmergencyCTA({ websiteSectionAdapter: adapter = {} }) {
  const data = getBookingBarData(adapter);
  const [ref, revealStyle] = useDispatchReveal({ delay: 12 });
  return (
    <Box ref={ref} sx={{ ...revealStyle, bgcolor: dispatchTokens.colors.red }}>
      <Container maxWidth={false} sx={{ maxWidth: `${dispatchTokens.layout.contentMax}px`, px: { xs: 2, md: 4 }, py: 2.6 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ md: "center" }}>
          <Typography sx={{ color: "#fff7ef", fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900, textTransform: "uppercase", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", lineHeight: 0.98 }}>
            {sanitizeDispatchText(data.title, "Need the next step fast?")}
          </Typography>
          <FamilyLinkButton href={data.buttonLink} label={sanitizeDispatchCta(data.buttonText, "Request estimate")} endIcon={<ArrowOutwardIcon />} sx={{ minHeight: 50, px: 2.8, borderRadius: 0, bgcolor: dispatchTokens.colors.cream, color: dispatchTokens.colors.ink, fontFamily: dispatchTokens.typography.headingFont, fontWeight: 900 }} />
        </Stack>
      </Container>
    </Box>
  );
}

export function DispatchFinalCTA({ websiteSectionAdapter: adapter = {} }) {
  return <DispatchEmergencyCTA websiteSectionAdapter={adapter} />;
}
