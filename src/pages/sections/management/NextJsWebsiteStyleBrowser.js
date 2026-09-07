import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import DesktopWindowsIcon from "@mui/icons-material/DesktopWindows";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import TabletMacIcon from "@mui/icons-material/TabletMac";

import { buildWebsiteStylePreviewPages } from "./websiteCatalogUi";

const viewportWidths = {
  desktop: 1280,
  tablet: 834,
  mobile: 390,
};

const viewportHeights = {
  desktop: 760,
  tablet: 780,
  mobile: 860,
};

function ThemePreviewImage({ style }) {
  const source =
    style.previewAssets?.card ||
    style.previewAssets?.desktop ||
    style.previewAssets?.mobile ||
    "";

  if (!source) {
    return (
      <Box
        sx={{
          height: 168,
          display: "grid",
          placeItems: "center",
          bgcolor: "action.hover",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Live preview available
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={source}
      alt={`${style.name} website preview`}
      loading="lazy"
      decoding="async"
      onError={(event) => {
        const fallback = style.previewAssets?.desktop || "";
        if (fallback && event.currentTarget.dataset.fallback !== "true") {
          event.currentTarget.dataset.fallback = "true";
          event.currentTarget.src = fallback;
          return;
        }
        event.currentTarget.style.visibility = "hidden";
      }}
      sx={{
        width: "100%",
        height: 168,
        objectFit: "cover",
        objectPosition: "top center",
        display: "block",
        bgcolor: "background.default",
      }}
    />
  );
}

function ThemeCard({
  style,
  currentStyleKey,
  currentStyleVersion,
  liveStyleKey,
  liveStyleVersion,
  saving,
  onOpenPreview,
  onApply,
}) {
  const isCurrentDraft =
    style.key === currentStyleKey &&
    Number(style.version) === Number(currentStyleVersion);
  const isCurrentLive =
    style.key === liveStyleKey &&
    Number(style.version) === Number(liveStyleVersion);

  return (
    <Paper
      component="article"
      variant="outlined"
      sx={{
        minWidth: 0,
        overflow: "hidden",
        borderRadius: 1.5,
        borderColor: isCurrentDraft ? "success.main" : "divider",
        boxShadow: isCurrentDraft ? 2 : 0,
      }}
    >
      <ButtonBase
        aria-label={`Preview ${style.name}`}
        onClick={() => onOpenPreview(style)}
        sx={{
          width: "100%",
          display: "block",
          position: "relative",
          borderBottom: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
          "& .theme-preview-overlay": { opacity: 0 },
          "&:hover .theme-preview-overlay, &:focus-visible .theme-preview-overlay": {
            opacity: 1,
          },
        }}
      >
        <ThemePreviewImage style={style} />
        <Box
          className="theme-preview-overlay"
          sx={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            bgcolor: "rgba(0, 0, 0, 0.42)",
            color: "common.white",
            transition: "opacity 160ms ease",
          }}
        >
          <Stack direction="row" spacing={0.75} alignItems="center">
            <PlayArrowIcon fontSize="small" />
            <Typography variant="button">Preview</Typography>
          </Stack>
        </Box>
      </ButtonBase>

      <Stack spacing={1} sx={{ p: 1.5 }}>
        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mr: 0.25 }}>
            {style.name}
          </Typography>
          <Chip size="small" label="Next.js" variant="outlined" />
          {style.badgeLabel ? <Chip size="small" label={style.badgeLabel} variant="outlined" /> : null}
          {style.recommended ? <Chip size="small" label="Recommended" color="primary" variant="outlined" /> : null}
          {isCurrentDraft ? <Chip size="small" label="Draft" color="success" /> : null}
          {isCurrentLive ? <Chip size="small" label="Live" color="info" /> : null}
        </Stack>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "2.86em",
          }}
        >
          {style.description}
        </Typography>

        {style.recommendedProfessionLabels?.length ? (
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            title={style.recommendedProfessionLabels.join(", ")}
          >
            Recommended for {style.recommendedProfessionLabels.join(", ")}
          </Typography>
        ) : null}

        <Stack direction="row" spacing={1} sx={{ pt: 0.25 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<PlayArrowIcon />}
            onClick={() => onOpenPreview(style)}
            disabled={saving}
          >
            Preview
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<CheckIcon />}
            onClick={() => onApply(style)}
            disabled={saving || isCurrentDraft}
          >
            {isCurrentDraft ? "Applied" : "Apply Theme"}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

export default function NextJsWebsiteStyleBrowser({
  styles,
  currentStyleKey,
  currentStyleVersion,
  liveStyleKey,
  liveStyleVersion,
  saving,
  previewUrl,
  previewError,
  onPreview,
  onApply,
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewStyle, setPreviewStyle] = useState(null);
  const [previewPageKey, setPreviewPageKey] = useState("home");
  const [device, setDevice] = useState("desktop");
  const [fullScreen, setFullScreen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const recommendedStyles = useMemo(
    () => styles.filter((style) => style.recommended),
    [styles]
  );
  const recommendedKeys = useMemo(
    () => new Set(recommendedStyles.map((style) => style.key)),
    [recommendedStyles]
  );
  const remainingStyles = useMemo(
    () => styles.filter((style) => !recommendedKeys.has(style.key)),
    [styles, recommendedKeys]
  );
  const previewPages = useMemo(
    () => buildWebsiteStylePreviewPages(previewStyle?.supportedPages),
    [previewStyle]
  );
  const previewIsCurrentDraft =
    previewStyle?.key === currentStyleKey &&
    Number(previewStyle?.version) === Number(currentStyleVersion);

  const requestPreview = async (style, page) => {
    setPreviewLoading(true);
    try {
      await onPreview(style, page?.path || []);
    } finally {
      setPreviewLoading(false);
    }
  };

  const openPreview = async (style) => {
    const home = buildWebsiteStylePreviewPages(style.supportedPages)[0];
    setPreviewStyle(style);
    setPreviewPageKey(home?.key || "home");
    setPreviewOpen(true);
    await requestPreview(style, home);
  };

  const selectPreviewPage = async (page) => {
    if (!previewStyle || page.key === previewPageKey) return;
    setPreviewPageKey(page.key);
    await requestPreview(previewStyle, page);
  };

  const renderGrid = (items) => (
    <Box
      sx={{
        display: "grid",
        gap: 1.5,
        gridTemplateColumns: {
          xs: "minmax(0, 1fr)",
          md: "repeat(2, minmax(0, 1fr))",
          lg: "repeat(3, minmax(0, 1fr))",
        },
      }}
    >
      {items.map((style) => (
        <ThemeCard
          key={style.key}
          style={style}
          currentStyleKey={currentStyleKey}
          currentStyleVersion={currentStyleVersion}
          liveStyleKey={liveStyleKey}
          liveStyleVersion={liveStyleVersion}
          saving={saving}
          onOpenPreview={openPreview}
          onApply={onApply}
        />
      ))}
    </Box>
  );

  return (
    <>
      <Stack spacing={1.5}>
        {recommendedStyles.length ? (
          <>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.18em" }}>
              Recommended for your business
            </Typography>
            {renderGrid(recommendedStyles)}
          </>
        ) : (
          <Alert severity="info" variant="outlined">
            No profession-specific recommendation is active for this business yet. All approved Modern themes remain available below.
          </Alert>
        )}

        {remainingStyles.length ? (
          <>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.18em", pt: 1 }}>
              {recommendedStyles.length ? "More Modern Themes" : "All Modern Themes"}
            </Typography>
            {renderGrid(remainingStyles)}
          </>
        ) : null}
      </Stack>

      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        fullScreen={fullScreen}
        fullWidth
        maxWidth={false}
        PaperProps={{
          sx: {
            width: fullScreen ? "100%" : "min(1500px, calc(100vw - 48px))",
            height: fullScreen ? "100%" : "min(900px, calc(100vh - 48px))",
            m: fullScreen ? 0 : 3,
          },
        }}
      >
        <DialogTitle sx={{ pr: 12, py: 1.5 }}>
          <Typography component="span" variant="subtitle1" sx={{ fontWeight: 700 }}>
            {previewStyle?.name || "Modern theme"}
          </Typography>
          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            Live draft preview
          </Typography>
          <Tooltip title={fullScreen ? "Exit full screen" : "Full screen"}>
            <IconButton
              aria-label={fullScreen ? "Exit full screen preview" : "Open full screen preview"}
              onClick={() => setFullScreen((value) => !value)}
              sx={{ position: "absolute", right: 52, top: 8 }}
            >
              {fullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Tooltip>
          <IconButton
            aria-label="Close preview"
            onClick={() => setPreviewOpen(false)}
            sx={{ position: "absolute", right: 12, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0, overflow: "hidden" }}>
          <Box
            sx={{
              height: "100%",
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "240px minmax(0, 1fr)" },
              gridTemplateRows: { xs: "auto minmax(0, 1fr)", md: "1fr" },
            }}
          >
            <Stack
              spacing={1.5}
              sx={{
                p: 2,
                overflowY: "auto",
                borderRight: { md: "1px solid" },
                borderBottom: { xs: "1px solid", md: 0 },
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            >
              <Typography variant="subtitle2" color="text.secondary">
                Pages
              </Typography>
              <Box
                sx={{
                  display: { xs: "flex", md: "grid" },
                  gap: 0.75,
                  overflowX: { xs: "auto", md: "visible" },
                  pb: { xs: 0.5, md: 0 },
                }}
              >
                {previewPages.map((page) => (
                  <Button
                    key={page.key}
                    size="small"
                    variant={page.key === previewPageKey ? "contained" : "outlined"}
                    onClick={() => selectPreviewPage(page)}
                    sx={{ justifyContent: "flex-start", whiteSpace: "nowrap" }}
                  >
                    {page.label}
                  </Button>
                ))}
              </Box>

              <Divider />

              <Typography variant="subtitle2" color="text.secondary">
                Device
              </Typography>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={device}
                onChange={(_, value) => value && setDevice(value)}
                aria-label="Preview device"
              >
                <ToggleButton value="mobile" aria-label="Mobile preview">
                  <PhoneIphoneIcon fontSize="small" />
                </ToggleButton>
                <ToggleButton value="tablet" aria-label="Tablet preview">
                  <TabletMacIcon fontSize="small" />
                </ToggleButton>
                <ToggleButton value="desktop" aria-label="Desktop preview">
                  <DesktopWindowsIcon fontSize="small" />
                </ToggleButton>
              </ToggleButtonGroup>

              <Divider />

              <Stack spacing={1}>
                <Button
                  variant="contained"
                  startIcon={<CheckIcon />}
                  disabled={saving || !previewStyle || previewIsCurrentDraft}
                  onClick={() => previewStyle && onApply(previewStyle)}
                >
                  {previewIsCurrentDraft ? "Applied to draft" : "Apply this theme"}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<OpenInNewIcon />}
                  component="a"
                  href={previewUrl || undefined}
                  target="_blank"
                  rel="noreferrer"
                  disabled={!previewUrl}
                >
                  Open in new tab
                </Button>
                <Button variant="text" onClick={() => setPreviewOpen(false)}>
                  Close
                </Button>
              </Stack>
            </Stack>

            <Box sx={{ position: "relative", overflow: "auto", bgcolor: "grey.900", p: { xs: 1, md: 2 } }}>
              {previewLoading ? (
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 2,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "rgba(17, 24, 39, 0.66)",
                  }}
                >
                  <CircularProgress color="inherit" />
                </Box>
              ) : null}

              {previewError && !previewLoading ? (
                <Alert severity="error" sx={{ mb: 1 }}>
                  {previewError}
                </Alert>
              ) : null}

              {previewUrl ? (
                <Box
                  sx={{
                    width: viewportWidths[device],
                    maxWidth: "100%",
                    minHeight: viewportHeights[device],
                    mx: "auto",
                    bgcolor: "common.white",
                    boxShadow: 8,
                  }}
                >
                  <Box
                    component="iframe"
                    title={`${previewStyle?.name || "Website"} ${device} preview`}
                    src={previewUrl}
                    loading="lazy"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                    sx={{
                      width: "100%",
                      height: viewportHeights[device],
                      border: 0,
                      display: "block",
                    }}
                  />
                </Box>
              ) : !previewLoading ? (
                <Box sx={{ minHeight: 360, display: "grid", placeItems: "center" }}>
                  <Typography color="common.white">Preview is not available.</Typography>
                </Box>
              ) : null}
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
