// src/components/ui/ManagementFrame.js
import React from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useLocation } from "react-router-dom";
import { isNativeRuntime } from "../../utils/runtime";

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
  hideHeaderOnMobile = true,
}) {
  const theme = useTheme();
  const location = useLocation();
  const isMobileViewport = useMediaQuery(theme.breakpoints.down("md"));
  const isMobileMode = isNativeRuntime() || isMobileViewport;
  const isManagerEmployeeRoute = /^\/(manager|employee|recruiter)(\/|$)/.test(
    location.pathname || ""
  );
  const shouldHideHeader =
    hideHeaderOnMobile && isMobileMode && isManagerEmployeeRoute;

  return (
    <Box sx={{ maxWidth: fullWidth ? "none" : maxWidth, mx: fullWidth ? 0 : "auto", width: "100%", ...sx }}>
      {(title || subtitle || headerActions) && !shouldHideHeader ? (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 2 }}>
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

      <Paper variant={contentVariant} sx={{ p: 2.5, borderRadius: 3, ...contentSx }}>
        {children}
      </Paper>
    </Box>
  );
}
