import React from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

const PredictionPromoBanner = ({ onEnterPredictions, onViewRules }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        mb: 2,
        p: { xs: 1.5, md: 2.5 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "warning.light",
        background: "linear-gradient(135deg, rgba(255,183,77,0.18) 0%, rgba(255,224,178,0.28) 100%)",
      }}
    >
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "flex-start", md: "center" }} justifyContent="space-between">
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
            <EmojiEventsIcon color="warning" />
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: "1.2rem", md: "1.25rem" } }}>
              World Cup 2026 Prediction Challenge
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Predict every matchday, climb the leaderboard, invite friends, and compete for daily, weekly, and sponsor-supported grand prizes.
          </Typography>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", md: "auto" } }}>
          <Button size="small" sx={{ minHeight: 36 }} variant="contained" fullWidth onClick={onEnterPredictions}>
            Enter Predictions
          </Button>
          <Button size="small" sx={{ minHeight: 36 }} variant="outlined" fullWidth onClick={onViewRules}>
            View Rules
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default PredictionPromoBanner;
