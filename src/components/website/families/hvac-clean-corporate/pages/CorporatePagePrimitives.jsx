import React from "react";
import { alpha, Box, Container, Stack, Typography } from "@mui/material";
import { useCorporateReveal } from "../motion";
import corporateTokens from "../tokens";

const TONE_MAP = {
  clear: {
    bg: "#ffffff",
  },
  warm: {
    bg: corporateTokens.colors.bg,
  },
  mist: {
    bg: corporateTokens.colors.surfaceSoft,
  },
  navy: {
    bg: corporateTokens.colors.navy,
    color: "#f9fcff",
  },
};

export function CorporatePageBand({
  children,
  tone = "clear",
  py = { xs: 6, md: 9 },
  withDivider = false,
  bleed = false,
  sx = {},
}) {
  const [ref, revealStyle] = useCorporateReveal();
  const toneConfig = TONE_MAP[tone] || TONE_MAP.clear;
  return (
    <Box
      ref={ref}
      sx={{
        ...revealStyle,
        position: "relative",
        py,
        bgcolor: toneConfig.bg,
        color: toneConfig.color || corporateTokens.colors.text,
        borderTop: withDivider ? `1px solid ${alpha(corporateTokens.colors.navy, 0.08)}` : "none",
        ...sx,
      }}
    >
      {bleed ? (
        children
      ) : (
        <Container
          maxWidth={false}
          sx={{
            maxWidth: `${corporateTokens.layout.shellMax}px`,
            px: { xs: 2, md: 4 },
          }}
        >
          {children}
        </Container>
      )}
    </Box>
  );
}

export function CorporatePageIntro({
  eyebrow,
  title,
  body,
  align = "left",
  maxWidth = 760,
  invert = false,
}) {
  const color = invert ? "#f9fcff" : corporateTokens.colors.text;
  const soft = invert ? "rgba(249,252,255,0.72)" : corporateTokens.colors.textSoft;
  return (
    <Stack
      spacing={1.5}
      sx={{
        maxWidth,
        textAlign: align,
        alignItems: align === "center" ? "center" : "flex-start",
      }}
    >
      {eyebrow ? (
        <Typography
          sx={{
            color: invert ? "rgba(249,252,255,0.76)" : corporateTokens.colors.teal,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontSize: "0.82rem",
          }}
        >
          {eyebrow}
        </Typography>
      ) : null}
      {title ? (
        <Typography
          sx={{
            color,
            fontFamily: corporateTokens.typography.headingFont,
            fontWeight: 800,
            fontSize: "clamp(2rem, 4vw, 3.4rem)",
            lineHeight: 0.96,
            letterSpacing: "-0.03em",
          }}
        >
          {title}
        </Typography>
      ) : null}
      {body ? (
        <Typography
          sx={{
            color: soft,
            lineHeight: 1.8,
            fontSize: { xs: "1rem", md: "1.06rem" },
          }}
        >
          {body}
        </Typography>
      ) : null}
    </Stack>
  );
}

export function CorporateDividerLine({ invert = false, sx = {} }) {
  return (
    <Box
      sx={{
        width: "100%",
        height: 1,
        bgcolor: invert ? "rgba(255,255,255,0.12)" : alpha(corporateTokens.colors.navy, 0.08),
        ...sx,
      }}
    />
  );
}

