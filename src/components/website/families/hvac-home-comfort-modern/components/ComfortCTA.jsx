import React from "react";
import { Box, Container, Stack, Typography } from "@mui/material";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import comfortTokens from "../tokens";
import { useComfortReveal } from "../motion";
import { FamilyLinkButton } from "../../hvac-shared/runtime";
import { getBookingBarData } from "../../hvac-shared/canonicalHvacAdapter";

export default function ComfortFinalCTA({ websiteSectionAdapter: adapter = {} }) {
  const data = getBookingBarData(adapter);
  const [ref, revealStyle] = useComfortReveal({ delay: 12 });
  return (
    <Box ref={ref} sx={{ ...revealStyle, bgcolor: comfortTokens.colors.bgAlt }}>
      <Container maxWidth={false} sx={{ maxWidth: `${comfortTokens.layout.contentMax}px`, px: { xs: 2, md: 4 }, py: 4 }}>
        <Stack spacing={1.5} alignItems={{ xs: "flex-start", md: "center" }}>
          <Typography sx={{ color: comfortTokens.colors.text, fontFamily: comfortTokens.typography.headingFont, fontWeight: 700, fontSize: "clamp(2rem, 4vw, 3rem)", textAlign: { md: "center" } }}>
            {data.title || "Ready for a calmer, more comfortable home?"}
          </Typography>
          <FamilyLinkButton href={data.buttonLink} label={data.buttonText || "Request service"} endIcon={<ArrowOutwardIcon />} sx={{ minHeight: 52, px: 2.8, borderRadius: 999, background: `linear-gradient(135deg, ${comfortTokens.colors.navy} 0%, ${comfortTokens.colors.teal} 100%)`, color: "#fff", fontWeight: 800 }} />
        </Stack>
      </Container>
    </Box>
  );
}
