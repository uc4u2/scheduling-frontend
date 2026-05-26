import React, { useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
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
  const [selectedTutorial, setSelectedTutorial] = useState(tutorialGroup?.featured || null);
  const featuredTutorial = tutorialGroup?.featured;
  const extraTutorials = (Array.isArray(tutorialGroup?.items) ? tutorialGroup.items : []).filter(
    (item) => item?.key && item.key !== featuredTutorial?.key
  );

  const openTutorial = (tutorial = featuredTutorial) => {
    if (!tutorial) return;
    setSelectedTutorial(tutorial);
    setOpen(true);
  };

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
            <Button variant="contained" onClick={() => openTutorial(featuredTutorial)}>
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
          {extraTutorials.length ? (
            <Accordion
              disableGutters
              elevation={0}
              sx={{
                mt: 0.5,
                border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                borderRadius: 1.25,
                backgroundColor: theme.palette.background.paper,
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="body2" fontWeight={700}>
                  {moreLabel}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Stack spacing={1}>
                  {extraTutorials.map((item) => (
                    <Paper
                      key={item.key}
                      variant="outlined"
                      sx={{
                        p: compact ? 1.1 : 1.25,
                        borderRadius: 1.25,
                        cursor: item.youtubeUrl ? "pointer" : "default",
                      }}
                      onClick={item.youtubeUrl ? () => openTutorial(item) : undefined}
                    >
                      <Stack spacing={0.5}>
                        <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
                          <Typography variant="body2" fontWeight={700}>
                            {item.title}
                          </Typography>
                          <Chip
                            size="small"
                            label={item.youtubeUrl ? "Available now" : "Coming soon"}
                            color={item.youtubeUrl ? "primary" : "default"}
                            variant={item.youtubeUrl ? "filled" : "outlined"}
                          />
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {item.purpose}
                        </Typography>
                        {item.youtubeUrl ? (
                          <Button
                            size="small"
                            variant="text"
                            sx={{ alignSelf: "flex-start", px: 0 }}
                            onClick={(event) => {
                              event.stopPropagation();
                              openTutorial(item);
                            }}
                          >
                            {watchLabel}
                          </Button>
                        ) : null}
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>
          ) : null}
        </Stack>
      </Paper>
      <InAppTutorialVideoDialog
        open={open}
        onClose={() => setOpen(false)}
        tutorial={selectedTutorial}
        moreTutorialsUrl={tutorialGroup?.moreTutorialsUrl}
        watchLabel={youtubeLabel}
        moreLabel={moreLabel}
        closeLabel={closeLabel}
      />
    </>
  );
}
