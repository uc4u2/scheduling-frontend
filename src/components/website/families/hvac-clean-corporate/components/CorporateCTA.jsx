import React from "react";
import { Box, Container, Grid, Stack, Typography } from "@mui/material";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import corporateTokens from "../tokens";
import { useCorporateReveal } from "../motion";
import { FamilyLinkButton } from "../../hvac-shared/runtime";
import { getBookingBarData } from "../../hvac-shared/canonicalHvacAdapter";

export default function CorporateFinalCTA({ websiteSectionAdapter: adapter = {} }) {
  const data = getBookingBarData(adapter);
  const [ref, revealStyle] = useCorporateReveal({ delay: 18 });
  return (
    <Box ref={ref} sx={{ ...revealStyle }}>
      <Container maxWidth={false} sx={{ maxWidth: `${corporateTokens.layout.shellMax}px`, px: { xs: 2, md: 4 } }}>
        <Box sx={{ p: { xs: 3, md: 4 }, bgcolor: "#fff", borderRadius: 4, border: `1px solid ${corporateTokens.colors.line}`, boxShadow: "0 22px 54px rgba(18,38,58,0.1)" }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography sx={{ fontFamily: corporateTokens.typography.headingFont, fontWeight: 800, fontSize: "clamp(1.9rem, 4vw, 3.2rem)", lineHeight: 0.96 }}>
                {data.title || "Request the right next step"}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack alignItems={{ md: "flex-end" }}>
                <FamilyLinkButton
                  href={data.buttonLink}
                  label={data.buttonText || "Request service"}
                  endIcon={<ArrowOutwardIcon />}
                  sx={{
                    minHeight: 50,
                    px: 2.8,
                    borderRadius: 999,
                    background: `linear-gradient(135deg, ${corporateTokens.colors.navy} 0%, ${corporateTokens.colors.teal} 100%)`,
                    color: "#fff",
                    fontFamily: corporateTokens.typography.headingFont,
                    fontWeight: 800,
                  }}
                />
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}
