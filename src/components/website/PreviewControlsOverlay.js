// src/components/website/PreviewControlsOverlay.js
import React from "react";
import {
  Box,
  Paper,
  Stack,
  IconButton,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  Slider,
  Typography,
} from "@mui/material";
import GridOnIcon from "@mui/icons-material/GridOn";
import BorderVerticalIcon from "@mui/icons-material/BorderVertical";
import BorderOuterIcon from "@mui/icons-material/BorderOuter";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";
import BuildIcon from "@mui/icons-material/Build";
export default function PreviewControlsOverlay({
  overlays,
  onOverlaysChange,
  zoom = 1,
  onZoomChange,
  device = "responsive", // 'responsive' | 'mobile' | 'tablet' | 'desktop'
  onDeviceChange,
  onOpenPanel, // NEW
}) {
  const set = (patch) => onOverlaysChange?.({ ...(overlays || {}), ...patch });

  return (
    <Box
      sx={{
        position: "absolute",
        right: 16,
        top: 16,
        zIndex: (t) => t.zIndex.tooltip + 5,
      }}
    >
      <Paper elevation={6} sx={{ p: 1, borderRadius: 2 }}>
        <Stack spacing={1}>
          {/* Quick open panel */}
          <Tooltip title="Open tuning panel">
            <IconButton size="small" onClick={() => onOpenPanel?.()}>
              <BuildIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Stack direction="row" spacing={1} alignItems="center">
            <ZoomOutMapIcon fontSize="small" />
            <Box sx={{ width: 140, px: 1 }}>
              <Slider
                size="small"
                min={0.75}
                max={1.5}
                step={0.05}
                value={zoom}
                onChange={(_, v) => onZoomChange?.(Number(v))}
              />
            </Box>
            <Typography variant="caption">{Math.round(zoom * 100)}%</Typography>
          </Stack>

          <ToggleButtonGroup
            exclusive
            size="small"
            value={device}
            onChange={(_, v) => v && onDeviceChange?.(v)}
          >
            <ToggleButton value="responsive">Auto</ToggleButton>
            <ToggleButton value="mobile">375</ToggleButton>
            <ToggleButton value="tablet">768</ToggleButton>
            <ToggleButton value="desktop">1280</ToggleButton>
          </ToggleButtonGroup>

          <Stack direction="row" spacing={1}>
            <Tooltip title="Baseline grid">
              <IconButton
                size="small"
                onClick={() => set({ showGrid: !overlays?.showGrid })}
                color={overlays?.showGrid ? "primary" : "default"}
              >
                <GridOnIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Show gutters">
              <IconButton
                size="small"
                onClick={() => set({ showGutters: !overlays?.showGutters })}
                color={overlays?.showGutters ? "primary" : "default"}
              >
                <BorderVerticalIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Show bleeds">
              <IconButton
                size="small"
                onClick={() => set({ showBleeds: !overlays?.showBleeds })}
                color={overlays?.showBleeds ? "primary" : "default"}
              >
                <BorderOuterIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
