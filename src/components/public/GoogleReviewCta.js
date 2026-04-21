import React, { useState } from "react";
import { Box, Button, IconButton, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import CloseIcon from "@mui/icons-material/Close";
import LaunchIcon from "@mui/icons-material/Launch";

const isSafeReviewUrl = (url) => {
  try {
    const parsed = new URL(String(url || ""));
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

export default function GoogleReviewCta({
  reviewUrl,
  text = "Leave a Google review",
  variant = "static",
  onDismiss,
}) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const safeUrl = isSafeReviewUrl(reviewUrl) ? String(reviewUrl).trim() : "";
  const [dismissed, setDismissed] = useState(false);

  if (!safeUrl || (variant === "floating" && dismissed)) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const isFloating = variant === "floating";
  const tenantAccent = "var(--page-link-color, var(--page-accent-color, #4285F4))";
  const tenantAccentSoft = "color-mix(in srgb, var(--page-link-color, #4285F4) 18%, transparent)";
  const tenantText = "var(--page-text-color, var(--page-body-color, inherit))";
  const tenantMuted = "var(--page-muted-color, rgba(71,85,105,0.82))";
  const tenantCardBg = "var(--page-card-bg, rgba(255,255,255,0.98))";
  const googleColors = ["#4285F4", "#DB4437", "#F4B400", "#4285F4", "#0F9D58", "#DB4437"];
  const buttonLabel = isFloating
    ? "Leave a review"
    : (String(text || "Leave a Google review").trim() || "Leave a Google review");

  const GoogleMark = (
    <Box
      aria-hidden
      sx={{
        width: isFloating ? { xs: 22, sm: 32 } : 42,
        height: isFloating ? { xs: 22, sm: 32 } : 42,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        background:
          "conic-gradient(from -35deg, #4285F4 0 24%, #0F9D58 24% 44%, #F4B400 44% 68%, #DB4437 68% 86%, #4285F4 86% 100%)",
        p: "2px",
        boxShadow: "0 8px 18px rgba(15,23,42,0.10)",
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          bgcolor: "#fff",
          color: "#4285F4",
          fontWeight: 900,
          fontSize: isFloating ? { xs: 10.5, sm: 15 } : 19,
          lineHeight: 1,
          fontFamily: "Arial, sans-serif",
          letterSpacing: "-0.08em",
        }}
      >
        G
      </Box>
    </Box>
  );

  const starRow = (
    <Stack direction="row" spacing={0.2} aria-label="Five star visual" sx={{ color: "#F4B400", lineHeight: 1 }}>
      {[0, 1, 2, 3, 4].map((item) => (
        <Box
          key={item}
          component="span"
          sx={{ fontSize: isFloating ? { xs: 9.8, sm: 13 } : 15, letterSpacing: "-0.04em" }}
        >
          ★
        </Box>
      ))}
    </Stack>
  );

  const card = (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: isFloating ? 2 : 3,
        border: "1px solid",
        borderColor: isFloating ? tenantAccentSoft : alpha(theme.palette.common.black, 0.1),
        color: tenantText,
        bgcolor: tenantCardBg,
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(145deg, rgba(15,23,42,0.98), rgba(30,41,59,0.95))"
            : "linear-gradient(145deg, var(--page-card-bg, rgba(255,255,255,0.99)), rgba(248,250,252,0.96))",
        boxShadow: isFloating
          ? `0 16px 36px rgba(15,23,42,0.16), 0 0 0 4px ${tenantAccentSoft}`
          : "0 20px 50px rgba(15,23,42,0.10)",
        p: isFloating ? { xs: 0.78, sm: 1.5 } : { xs: 2.25, md: 3 },
        maxWidth: isFloating ? { xs: 214, sm: 318 } : "100%",
        transform: "translateY(0)",
        transition: isFloating
          ? "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease"
          : "box-shadow 180ms ease, border-color 180ms ease",
        animation: isFloating ? "googleReviewCtaIn 320ms ease-out both" : "none",
        "&::before": {
          content: '""',
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: isFloating ? 3 : 4,
          background: `linear-gradient(90deg, ${googleColors.join(", ")})`,
        },
        ...(isFloating
          ? {
              "&::after": {
                content: '""',
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                background:
                  "radial-gradient(circle at 18% 18%, rgba(66,133,244,0.10), transparent 34%), radial-gradient(circle at 92% 8%, rgba(244,180,0,0.12), transparent 30%), radial-gradient(circle at 80% 86%, var(--page-link-color, rgba(66,133,244,0.10)), transparent 34%)",
                opacity: 0.42,
                transition: "opacity 180ms ease",
              },
              "&:hover, &:focus-within": {
                transform: "translateY(-2px)",
                boxShadow: `0 20px 44px rgba(15,23,42,0.20), 0 0 0 4px ${tenantAccentSoft}`,
              },
              "&:hover::after, &:focus-within::after": {
                opacity: 0.62,
              },
              "@keyframes googleReviewCtaIn": {
                "0%": { opacity: 0, transform: "translateY(10px) scale(0.985)" },
                "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
              },
            }
          : {}),
      }}
    >
      {isFloating && (
        <IconButton
          size="small"
          aria-label="Dismiss Google review prompt"
          onClick={handleDismiss}
          sx={{
            position: "absolute",
            top: { xs: 4, sm: 7 },
            right: { xs: 4, sm: 7 },
            zIndex: 2,
            width: { xs: 17, sm: 24 },
            height: { xs: 17, sm: 24 },
            opacity: { xs: 0.64, md: 0 },
            transform: { xs: "scale(1)", md: "scale(0.88)" },
            color: tenantMuted,
            bgcolor: "rgba(255,255,255,0.62)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(148,163,184,0.26)",
            transition: "opacity 160ms ease, transform 160ms ease, background-color 160ms ease, color 160ms ease",
            ".MuiPaper-root:hover &, .MuiPaper-root:focus-within &": {
              opacity: 1,
              transform: "scale(1)",
            },
            "&:hover": {
              bgcolor: tenantAccentSoft,
              color: tenantText,
              borderColor: tenantAccentSoft,
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
      <Stack
        direction="row"
        spacing={isFloating ? { xs: 0.55, sm: 1.2 } : 1.6}
        alignItems="flex-start"
        sx={{
          pr: isFloating ? { xs: 1.45, sm: 3 } : 0,
          position: "relative",
          zIndex: 1,
        }}
      >
        {GoogleMark}
        <Stack spacing={isFloating ? { xs: 0.28, sm: 0.75 } : 1} sx={{ minWidth: 0 }}>
          <Stack spacing={isFloating ? { xs: 0.08, sm: 0.35 } : 0.5}>
            <Stack direction="row" spacing={{ xs: 0.32, sm: 1 }} alignItems="center" flexWrap="wrap">
              <Typography
                variant="overline"
                sx={{
                  color: tenantMuted,
                  letterSpacing: { xs: "0.08em", sm: "0.15em" },
                  lineHeight: 1.1,
                  fontWeight: 850,
                  fontSize: isFloating ? { xs: "0.42rem", sm: "0.63rem" } : "0.72rem",
                }}
              >
                Google Reviews
              </Typography>
              {starRow}
            </Stack>
            <Typography
              variant={isFloating ? "body1" : "h6"}
              fontWeight={850}
              sx={{
                lineHeight: 1.18,
                color: tenantText,
                fontSize: isFloating ? { xs: "0.78rem", sm: "1rem" } : undefined,
              }}
            >
              {isFloating ? "Share your experience" : "Loved your visit? Share your experience on Google."}
            </Typography>
            {!isFloating && (
              <Typography variant="body2" sx={{ color: tenantMuted }}>
                Your public review helps future clients choose with confidence. Opens Google in a new tab.
              </Typography>
            )}
          </Stack>
          <Button
            component="a"
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="contained"
            size={isFloating ? "small" : "medium"}
            endIcon={isFloating && isXs ? null : <LaunchIcon fontSize="small" />}
            sx={{
              alignSelf: "flex-start",
              borderRadius: 1.25,
              minHeight: isFloating ? { xs: 22, sm: 30 } : 36,
              px: isFloating ? { xs: 0.72, sm: 1.5 } : 2,
              py: isFloating ? { xs: 0.18, sm: 0.45 } : 0.75,
              textTransform: "none",
              fontWeight: 800,
              fontSize: isFloating ? { xs: "0.6rem", sm: "0.78rem" } : undefined,
              bgcolor: tenantAccent,
              boxShadow: `0 10px 22px ${tenantAccentSoft}`,
              "& .MuiButton-endIcon": {
                ml: { xs: 0.35, sm: 0.65 },
                "& svg": { fontSize: { xs: "0.82rem", sm: "1rem" } },
              },
              "&:hover": {
                bgcolor: tenantAccent,
                filter: "brightness(0.93)",
                boxShadow: `0 12px 26px ${tenantAccentSoft}`,
              },
            }}
          >
            {buttonLabel}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );

  if (!isFloating) return card;

  return (
    <Box
      sx={{
        position: "fixed",
        left: { xs: 8, sm: 14, md: 24 },
        bottom: { xs: 14, sm: 82, md: 24 },
        zIndex: 25,
        width: { xs: "min(214px, calc(100vw - 154px))", sm: 318 },
        pointerEvents: "auto",
      }}
    >
      {card}
    </Box>
  );
}
