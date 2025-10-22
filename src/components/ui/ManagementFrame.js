// src/components/ui/ManagementFrame.js
import React from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";

export default function ManagementFrame({
  title,
  subtitle,
  headerActions = null,
  children,
  sx = {},
  fullWidth = false,
  maxWidth = 1400,
  contentSx = {},
  contentVariant = "outlined",
}) {
  return (
    <Box sx={{ maxWidth: fullWidth ? "none" : maxWidth, mx: fullWidth ? 0 : "auto", width: "100%", ...sx }}>
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Box sx={{ minWidth: 0, overflow: "hidden" }}>
            {title && (
              <Typography variant="h5" fontWeight={800} gutterBottom noWrap>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="body2" color="text.secondary" noWrap>
                {subtitle}
              </Typography>
            )}
          </Box>
          {headerActions}
        </Stack>
      </Paper>

      <Paper variant={contentVariant} sx={{ p: 2.5, borderRadius: 3, ...contentSx }}>
        {children}
      </Paper>
    </Box>
  );
}
