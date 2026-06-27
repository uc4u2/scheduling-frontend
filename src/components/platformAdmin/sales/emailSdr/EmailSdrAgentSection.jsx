import React from "react";
import { Paper, Stack, Typography } from "@mui/material";

export default function EmailSdrAgentSection({ children, sectionRef, title = "Email Agents" }) {
  return (
    <Paper sx={{ p: 2.5 }} ref={sectionRef}>
      <Stack spacing={2}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{title}</Typography>
        {children}
      </Stack>
    </Paper>
  );
}
