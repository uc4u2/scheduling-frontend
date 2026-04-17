// src/components/ui/ManagementFrame.js
import React from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

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
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const headerBg = `linear-gradient(135deg, ${alpha(theme.palette.primary.main, isDark ? 0.18 : 0.1)} 0%, ${alpha(
    theme.palette.secondary?.main || theme.palette.primary.main,
    isDark ? 0.14 : 0.06
  )} 48%, ${alpha(theme.palette.background.paper, isDark ? 0.92 : 0.96)} 100%)`;

  return (
    <Box sx={{ maxWidth: fullWidth ? "none" : maxWidth, mx: fullWidth ? 0 : "auto", width: "100%", ...sx }}>
      {(title || subtitle || headerActions) ? (
        <Paper
          variant="outlined"
          sx={{
            position: "relative",
            overflow: "hidden",
            p: { xs: 2.25, sm: 2.75 },
            borderRadius: "6px",
            mb: 3,
            borderColor: alpha(theme.palette.primary.main, isDark ? 0.2 : 0.12),
            background: headerBg,
            boxShadow: `0 14px 38px ${alpha(theme.palette.common.black, isDark ? 0.24 : 0.06)}`,
            "&:before": {
              content: '""',
              position: "absolute",
              insetBlock: 16,
              left: 0,
              width: 4,
              borderRadius: "0 8px 8px 0",
              background: `linear-gradient(180deg, ${theme.palette.primary.main}, ${theme.palette.secondary?.main || theme.palette.primary.main})`,
            },
            "&:after": {
              content: '""',
              position: "absolute",
              width: 160,
              height: 160,
              right: -64,
              top: -90,
              borderRadius: "50%",
              background: alpha(theme.palette.primary.main, isDark ? 0.16 : 0.08),
              pointerEvents: "none",
            },
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ position: "relative", zIndex: 1 }}>
            <Box sx={{ minWidth: 0, overflow: "hidden" }}>
              {title && (
                <Typography component="h1" variant="h5" fontWeight={900} gutterBottom noWrap sx={{ letterSpacing: "-0.02em" }}>
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 860 }}>
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
            borderRadius: "6px",
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
