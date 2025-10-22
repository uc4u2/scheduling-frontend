import React, { useState, useMemo, useEffect } from "react";
import { alpha } from "@mui/material/styles";
import {
  Box,
  Grid,
  Stack,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/CheckCircleOutline";
import FloatingBlob from "../../components/ui/FloatingBlob";

const FeatureShowcase = ({ title, subtitle, features = [], eyebrow = "Why Schedulaa", onActiveChange }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const safeFeatures = Array.isArray(features) ? features : [];
  const activeFeature = useMemo(
    () => safeFeatures[Math.min(activeIndex, safeFeatures.length - 1)] || null,
    [safeFeatures, activeIndex]
  );

  const accentPalette = useMemo(() => [
    "#0ea5e9",
    "#34d399",
    "#6366f1",
    "#f97316",
    "#facc15",
    "#a855f7",
    "#14b8a6",
  ], []);
  const accent = accentPalette[activeIndex % accentPalette.length];

  useEffect(() => {
    if (typeof onActiveChange === "function" && activeFeature) {
      onActiveChange(activeFeature, activeIndex, accent);
    }
  }, [activeFeature, activeIndex, accent, onActiveChange]);

  if (!safeFeatures.length) return null;

  const handleKeySelect = (event, index) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setActiveIndex(index);
    }
  };

  return (
    <Box
      component="section"
      id="features"
      sx={{
        position: "relative",
        px: { xs: 2, md: 6 },
        py: { xs: 10, md: 14 },
        overflow: "hidden",
        background: (theme) => (
          theme.palette.mode === "dark"
            ? `radial-gradient(circle at top left, ${alpha(accent, 0.28)}, transparent 55%), radial-gradient(circle at bottom right, ${alpha(accent, 0.22)}, transparent 45%)`
            : `radial-gradient(circle at top left, ${alpha(accent, 0.18)}, transparent 55%), radial-gradient(circle at bottom right, ${alpha(accent, 0.12)}, transparent 45%)`
        ),
        transition: "background 0.4s ease",
      }}
    >
      <FloatingBlob enableMotion color={alpha(accent, 0.6)} size={960} opacity={0.14} duration={28} sx={{ top: -220, left: -180, pointerEvents: "none" }} />
      <FloatingBlob enableMotion color={alpha(accent, 0.45)} size={1120} opacity={0.12} duration={32} sx={{ bottom: -240, right: -220, pointerEvents: "none" }} />

      <Stack spacing={2} textAlign="center" zIndex={1} position="relative" mb={{ xs: 6, md: 8 }}>
        <Chip label={eyebrow}
          color="primary"
          variant="outlined"
          sx={{ alignSelf: "center", fontWeight: 600, letterSpacing: 0.5 }}
        />
        <Typography variant="h3" component="h2" fontWeight={800}>
          {title || "Features That Work Together"}
        </Typography>
        {subtitle && (
          <Typography variant="subtitle1" color="text.secondary" maxWidth={720} mx="auto">
            {subtitle}
          </Typography>
        )}
      </Stack>

      <Grid container spacing={{ xs: 4, md: 6 }} alignItems="stretch" position="relative" zIndex={1}>
        <Grid item xs={12} md={4}>
          <Stack
            spacing={2}
            sx={{ position: { md: "sticky" }, top: { md: 120 }, maxHeight: { md: "70vh" }, overflowY: { md: "auto" }, pr: { md: 1 } }}
          >
            {safeFeatures.map((feature, index) => {
              const isActive = index === activeIndex;
              return (
                <Paper
                  key={feature.title}
                  onMouseEnter={() => setActiveIndex(index)}
                  onFocus={() => setActiveIndex(index)}
                  onClick={() => setActiveIndex(index)}
                  onKeyDown={(event) => handleKeySelect(event, index)}
                  role="button"
                  tabIndex={0}
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    cursor: "pointer",
                    border: (theme) =>
                      `1px solid ${isActive ? theme.palette.primary.main : alpha(theme.palette.divider, 0.9)}`,
                    backgroundColor: (theme) =>
                      isActive
                        ? alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.25 : 0.1)
                        : theme.palette.background.paper,
                    color: "text.primary",
                    transition: "all 0.2s ease",
                    '&:hover': {
                      borderColor: (theme) => theme.palette.primary.main,
                    },
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        backgroundColor: (theme) => (isActive ? accent : theme.palette.primary.main),
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 18,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: (theme) => (isActive ? `0 12px 24px ${alpha(accent, 0.25)}` : theme.shadows[3]),
                        transition: "background-color 0.3s ease, box-shadow 0.3s ease",
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Stack spacing={1}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {feature.title}
                      </Typography>
                      {Array.isArray(feature.description) ? (
                        <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", md: "block" } }}>
                          {feature.description[0]}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {feature.description}
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            sx={{
              position: "relative",
              borderRadius: 5,
              height: "100%",
              p: { xs: 3, md: 5 },
              display: "flex",
              flexDirection: "column",
              gap: { xs: 2.5, md: 3.5 },
              border: `1px solid ${alpha(accent, 0.32)}`,
              background: (theme) =>
                theme.palette.mode === "dark"
                  ? `linear-gradient(135deg, rgba(15,23,42,0.9), ${alpha(accent, 0.22)})`
                  : `linear-gradient(135deg, rgba(255,255,255,0.95), ${alpha(accent, 0.14)})`,
              boxShadow: (theme) => theme.shadows[10],
              transition: "border 0.3s ease, background 0.4s ease",
              overflow: "hidden",
            }}
          >
            <FloatingBlob enableMotion color={alpha(accent, 0.45)} size={560} opacity={0.16} duration={26} sx={{ top: -180, right: -160, pointerEvents: "none" }} />
            <FloatingBlob enableMotion color={alpha(accent, 0.35)} size={520} opacity={0.12} duration={24} sx={{ bottom: -160, left: -140, pointerEvents: "none" }} />
            <Stack direction="row" spacing={2} alignItems="center" sx={{ position: "relative", zIndex: 1 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  backgroundColor: accent,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 18px 36px ${alpha(accent, 0.28)}`
                }}
              >
                {activeFeature?.icon}
              </Box>
              <Stack spacing={1}>
                <Typography variant="overline" color="text.secondary" fontWeight={600}>
                  {`Capability 0${activeIndex + 1}`}
                </Typography>
                <Typography variant="h4" component="h3" fontWeight={700}>
                  {activeFeature?.title}
                </Typography>
              </Stack>
            </Stack>

            <Divider flexItem sx={{ opacity: 0.25, borderColor: alpha("#fff", 0.2) }} />

            <List dense disablePadding sx={{ display: "grid", rowGap: 1.5 }}>
              {Array.isArray(activeFeature?.description)
                ? activeFeature.description.map((item) => (
                    <ListItem key={item} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36, color: accent }}>
                        <CheckIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={item}
                        primaryTypographyProps={{ variant: "body1", color: "text.secondary" }}
                      />
                    </ListItem>
                  ))
                : activeFeature?.description && (
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36, color: accent }}>
                        <CheckIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={activeFeature.description}
                        primaryTypographyProps={{ variant: "body1", color: "text.secondary" }}
                      />
                    </ListItem>
                  )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FeatureShowcase;





