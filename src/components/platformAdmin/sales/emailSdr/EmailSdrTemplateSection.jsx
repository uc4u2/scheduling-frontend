import React from "react";
import { Paper, Stack, Typography } from "@mui/material";

export default function EmailSdrTemplateSection({ children, sectionRef }) {
  return (
    <Paper sx={{ p: 2.5 }} ref={sectionRef}>
      <Stack spacing={2}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Email Templates</Typography>
        {children}
      </Stack>
    </Paper>
  );
}
