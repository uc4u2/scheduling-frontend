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
            ? "linear-gradient(145deg, rgba(15,23,42,0.96), rgba(30,41,59,0.94))"
            : "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(248,250,252,0.96))",
        boxShadow: isFloating
          ? "0 18px 42px rgba(15,23,42,0.18)"
          : "0 20px 50px rgba(15,23,42,0.10)",
        p: isFloating ? 2 : { xs: 2.25, md: 3 },
        maxWidth: isFloating ? 360 : "100%",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          width: 4,
          background: accent,
        },
      }}
    >
      {isFloating && (
        <IconButton
          size="small"
          aria-label="Dismiss Google review prompt"
          onClick={handleDismiss}
          sx={{ position: "absolute", top: 8, right: 8, color: "text.secondary" }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
      <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ pl: 0.75, pr: isFloating ? 3.5 : 0 }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 1.5,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            color: accent,
            bgcolor: alpha(accent, 0.1),
            border: `1px solid ${alpha(accent, 0.22)}`,
          }}
        >
          <RateReviewIcon fontSize="small" />
        </Box>
        <Stack spacing={1} sx={{ minWidth: 0 }}>
          <Stack spacing={0.25}>
            <Typography
              variant="overline"
              sx={{
                color: "text.secondary",
                letterSpacing: "0.16em",
                lineHeight: 1.2,
                fontWeight: 800,
              }}
            >
              Google Reviews
            </Typography>
            <Typography variant={isFloating ? "subtitle1" : "h6"} fontWeight={850} sx={{ lineHeight: 1.25 }}>
              Loved your visit? Share your experience on Google.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Opens Google in a new tab.
            </Typography>
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
              borderRadius: 1.5,
              px: 2,
              textTransform: "none",
              fontWeight: 800,
              bgcolor: accent,
              "&:hover": { bgcolor: "#3367D6" },
            }}
          >
            {String(text || "Leave a Google review").trim() || "Leave a Google review"}
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
        width: { xs: "calc(100vw - 28px)", sm: 360 },
        pointerEvents: "auto",
      }}
    >
      {card}
    </Box>
  );
}
