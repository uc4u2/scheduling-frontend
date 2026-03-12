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
      {(title || subtitle || headerActions) ? (
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2.5, sm: 3 },
            borderRadius: 4,
            mb: 3,
            boxShadow: "0 2px 10px rgba(15, 23, 42, 0.05)",
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Box sx={{ minWidth: 0, overflow: "hidden" }}>
              {title && (
                <Typography component="h1" variant="h5" fontWeight={800} gutterBottom noWrap>
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
      ) : null}

      {contentVariant === false ? (
        <Box sx={contentSx}>{children}</Box>
      ) : (
        <Paper
          variant={contentVariant}
          sx={{
            p: { xs: 2.5, sm: 3 },
            borderRadius: 4,
            boxShadow: "0 2px 10px rgba(15, 23, 42, 0.05)",
            ...contentSx,
          }}
        >
          {children}
        </Paper>
      )}
    </Box>
  );
}
