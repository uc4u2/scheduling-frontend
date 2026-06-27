import React from "react";
import { Button, Paper, Stack, Typography } from "@mui/material";

export default function EmailSdrStartChecklist({ onAddProvider, onAddAgent, onTemplates, onLaunch, onReplies }) {
  return (
    <Paper sx={{ p: 2.5 }}>
      <Stack spacing={1.5}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Start Here</Typography>
        <Typography variant="body2" color="text.secondary">
          First-time setup for Email SDR. Complete these steps in order so the first campaign can launch cleanly.
        </Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1} useFlexGap>
          <Button variant="outlined" onClick={onAddProvider}>1. Add Provider</Button>
          <Button variant="outlined" onClick={onAddAgent}>2. Add Email Agent</Button>
          <Button variant="outlined" onClick={onTemplates}>3. Choose Template Pack</Button>
          <Button variant="contained" onClick={onLaunch}>4. Launch Campaign</Button>
          <Button variant="outlined" onClick={onReplies}>5. Review Replies</Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
