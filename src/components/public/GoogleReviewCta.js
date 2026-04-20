import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, IconButton, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import LaunchIcon from "@mui/icons-material/Launch";
import RateReviewIcon from "@mui/icons-material/RateReview";

const DISMISS_PREFIX = "schedulaa_google_review_cta_dismissed";

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
  storageKey = "default",
  onDismiss,
}) {
  const theme = useTheme();
  const safeUrl = isSafeReviewUrl(reviewUrl) ? String(reviewUrl).trim() : "";
  const dismissKey = useMemo(() => `${DISMISS_PREFIX}:${storageKey || "default"}`, [storageKey]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (variant !== "floating") return;
    try {
      setDismissed(sessionStorage.getItem(dismissKey) === "1");
    } catch {
      setDismissed(false);
    }
  }, [dismissKey, variant]);

  if (!safeUrl || (variant === "floating" && dismissed)) return null;

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(dismissKey, "1");
    } catch {
      /* noop */
    }
    setDismissed(true);
    onDismiss?.();
  };

  const isFloating = variant === "floating";
  const accent = "#4285F4";
  const googleColors = ["#4285F4", "#DB4437", "#F4B400", "#4285F4", "#0F9D58", "#DB4437"];
  const buttonLabel = isFloating
    ? "Leave a review"
    : (String(text || "Leave a Google review").trim() || "Leave a Google review");

  const GoogleMark = (
    <Box
      aria-hidden
      sx={{
        width: isFloating ? 30 : 38,
        height: isFloating ? 30 : 38,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        bgcolor: "#fff",
        border: "1px solid",
        borderColor: alpha(theme.palette.common.black, 0.1),
        boxShadow: "0 8px 18px rgba(15,23,42,0.10)",
        fontWeight: 900,
        fontSize: isFloating ? 16 : 20,
        lineHeight: 1,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <Box component="span" sx={{ color: "#4285F4" }}>G</Box>
    </Box>
  );

  const starRow = (
    <Stack direction="row" spacing={0.2} aria-label="Five star visual" sx={{ color: "#F4B400", lineHeight: 1 }}>
      {[0, 1, 2, 3, 4].map((item) => (
        <Box key={item} component="span" sx={{ fontSize: isFloating ? 13 : 15, letterSpacing: "-0.04em" }}>
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
        borderColor: alpha(theme.palette.common.black, 0.1),
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(145deg, rgba(15,23,42,0.98), rgba(30,41,59,0.95))"
            : "linear-gradient(145deg, rgba(255,255,255,0.99), rgba(248,250,252,0.98))",
        boxShadow: isFloating
          ? "0 16px 36px rgba(15,23,42,0.16)"
          : "0 20px 50px rgba(15,23,42,0.10)",
        p: isFloating ? 1.5 : { xs: 2.25, md: 3 },
        maxWidth: isFloating ? 318 : "100%",
        "&::before": {
          content: '""',
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: isFloating ? 3 : 4,
          background: `linear-gradient(90deg, ${googleColors.join(", ")})`,
        },
      }}
    >
      {isFloating && (
        <IconButton
          size="small"
          aria-label="Dismiss Google review prompt"
          onClick={handleDismiss}
          sx={{ position: "absolute", top: 7, right: 7, color: "text.secondary" }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
      <Stack direction="row" spacing={isFloating ? 1.2 : 1.6} alignItems="flex-start" sx={{ pr: isFloating ? 3 : 0 }}>
        {GoogleMark}
        <Stack spacing={isFloating ? 0.75 : 1} sx={{ minWidth: 0 }}>
          <Stack spacing={isFloating ? 0.35 : 0.5}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography
                variant="overline"
                sx={{
                  color: "text.secondary",
                  letterSpacing: "0.15em",
                  lineHeight: 1.1,
                  fontWeight: 850,
                  fontSize: isFloating ? "0.63rem" : "0.72rem",
                }}
              >
                Google Reviews
              </Typography>
              {starRow}
            </Stack>
            <Typography variant={isFloating ? "body1" : "h6"} fontWeight={850} sx={{ lineHeight: 1.18 }}>
              {isFloating ? "Share your experience" : "Loved your visit? Share your experience on Google."}
            </Typography>
            {!isFloating && (
              <Typography variant="body2" color="text.secondary">
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
            endIcon={<LaunchIcon fontSize="small" />}
            sx={{
              alignSelf: "flex-start",
              borderRadius: 1.25,
              minHeight: isFloating ? 30 : 36,
              px: isFloating ? 1.5 : 2,
              py: isFloating ? 0.45 : 0.75,
              textTransform: "none",
              fontWeight: 800,
              fontSize: isFloating ? "0.78rem" : undefined,
              bgcolor: accent,
              "&:hover": { bgcolor: "#3367D6" },
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
        left: { xs: 14, md: 24 },
        bottom: { xs: 82, md: 24 },
        zIndex: 25,
        width: { xs: "calc(100vw - 28px)", sm: 318 },
        pointerEvents: "auto",
      }}
    >
      {card}
    </Box>
  );
}
