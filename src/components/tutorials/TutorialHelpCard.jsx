import React, { useState } from "react";
import { Button, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import InAppTutorialVideoDialog from "./InAppTutorialVideoDialog";

export default function TutorialHelpCard({
  tutorialGroup,
  title = "Quick tutorial",
  body = "",
  watchLabel = "Watch tutorial",
  moreLabel = "More walkthroughs",
  youtubeLabel = "Watch on YouTube",
  closeLabel = "Close",
  compact = false,
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const featuredTutorial = tutorialGroup?.featured;

  return (
    <>
      <Paper
        variant="outlined"
        sx={{
          p: compact ? 1.5 : 1.75,
          borderRadius: 1.5,
          borderColor: alpha(theme.palette.primary.main, 0.22),
          backgroundColor: alpha(theme.palette.primary.main, 0.04),
        }}
      >
        <Stack spacing={1}>
          <Typography variant={compact ? "subtitle2" : "subtitle1"} fontWeight={800}>
            {title}
          </Typography>
          {featuredTutorial?.title ? (
            <Typography variant="body2" color="text.secondary">
              {featuredTutorial.title}
            </Typography>
          ) : null}
          {body ? (
            <Typography variant="body2" color="text.secondary">
              {body}
            </Typography>
          ) : null}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button variant="contained" onClick={() => setOpen(true)}>
              {watchLabel}
            </Button>
            <Button
              variant="text"
              onClick={() => {
                if (tutorialGroup?.moreTutorialsUrl) {
                  window.open(tutorialGroup.moreTutorialsUrl, "_blank", "noopener,noreferrer");
                }
              }}
            >
              {moreLabel}
            </Button>
          </Stack>
        </Stack>
      </Paper>
      <InAppTutorialVideoDialog
        open={open}
        onClose={() => setOpen(false)}
        tutorial={featuredTutorial}
        moreTutorialsUrl={tutorialGroup?.moreTutorialsUrl}
        watchLabel={youtubeLabel}
        moreLabel={moreLabel}
        closeLabel={closeLabel}
      />
    </>
  );
}
