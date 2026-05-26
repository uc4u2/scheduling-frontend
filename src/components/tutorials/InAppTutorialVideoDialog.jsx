import React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import LaunchIcon from "@mui/icons-material/Launch";
import { toYouTubeEmbedUrl } from "../../tutorials/appTutorialCatalog";

export default function InAppTutorialVideoDialog({
  open,
  onClose,
  tutorial,
  moreTutorialsUrl,
  watchLabel = "Watch on YouTube",
  moreLabel = "More walkthroughs",
  closeLabel = "Close",
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const embedUrl = toYouTubeEmbedUrl(tutorial?.youtubeUrl);

  const openOnYoutube = () => {
    if (tutorial?.youtubeUrl) {
      window.open(tutorial.youtubeUrl, "_blank", "noopener,noreferrer");
    }
  };

  const openMoreWalkthroughs = () => {
    if (moreTutorialsUrl) {
      window.open(moreTutorialsUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="md">
      <DialogTitle sx={{ pb: 1.25 }}>{tutorial?.title || "Tutorial"}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {tutorial?.purpose ? (
            <Typography variant="body2" color="text.secondary">
              {tutorial.purpose}
            </Typography>
          ) : null}
          {embedUrl ? (
            <Box
              sx={{
                position: "relative",
                width: "100%",
                pt: "56.25%",
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: "common.black",
              }}
            >
              <iframe
                src={embedUrl}
                title={tutorial?.title || "Schedulaa tutorial"}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
              />
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Video link is not available yet.
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Stack
          direction={{ xs: "column-reverse", sm: "row" }}
          spacing={1}
          sx={{ width: "100%", justifyContent: "space-between" }}
        >
          <Button onClick={onClose}>{closeLabel}</Button>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button variant="text" onClick={openMoreWalkthroughs} disabled={!moreTutorialsUrl}>
              {moreLabel}
            </Button>
            <Button variant="contained" startIcon={<LaunchIcon />} onClick={openOnYoutube} disabled={!tutorial?.youtubeUrl}>
              {watchLabel}
            </Button>
          </Stack>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
