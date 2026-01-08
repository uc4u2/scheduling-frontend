// src/components/website/WebsiteNavSettingsCard.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Grid,
  MenuItem,
  Slider,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  NAV_STYLE_DEFAULT,
  normalizeNavStyle,
  navStyleToCssVars,
  createNavButtonStyles,
} from "../../utils/navStyle";
import {
  NAV_STYLE_PRESETS,
  NAV_COLOR_PRESETS,
  NAV_SHADOW_PRESETS,
  getPresetStyle,
} from "../../constants/navPresets";

const VARIANT_OPTIONS = [
  { value: "pill", label: "Pill / Filled" },
  { value: "button", label: "Solid Button" },
  { value: "underline", label: "Underline" },
  { value: "overline", label: "Overline" },
  { value: "doubleline", label: "Double Line" },
  { value: "sideline", label: "Side Lines (Active)" },
  { value: "sideline-all", label: "Side Lines (All)" },
  { value: "ghost", label: "Outline / Ghost" },
  { value: "link", label: "Link" },
  { value: "text", label: "Plain text" },
];

const TEXT_TRANSFORM_OPTIONS = [
  { value: "none", label: "None" },
  { value: "uppercase", label: "Uppercase" },
  { value: "capitalize", label: "Capitalize" },
  { value: "lowercase", label: "Lowercase" },
];

const NAV_BUTTON_LABELS = ["Home", "Services", "Reviews"];
const NAV_KEYS = Object.keys(NAV_STYLE_DEFAULT);

const BRAND_FONT_OPTIONS = [
  { value: "inherit", label: "Theme default" },
  { value: "'Helvetica Neue', Arial, sans-serif", label: "Helvetica / Arial" },
  { value: "'Poppins', 'Helvetica Neue', sans-serif", label: "Poppins" },
  { value: "'Playfair Display', Georgia, serif", label: "Playfair Display" },
  { value: "'Georgia', serif", label: "Georgia" },
  { value: "'Courier New', monospace", label: "Courier" },
];

const stylesEqual = (a, b) =>
  NAV_KEYS.every((key) => (a[key] ?? null) === (b[key] ?? null));

const NavPreview = ({ tokens, highlightActive = true }) => {
  const theme = useTheme();
  const buttonStyles = useMemo(
    () => createNavButtonStyles(tokens),
    [tokens]
  );
  const cssVars = useMemo(() => {
    const vars = navStyleToCssVars(tokens);
    if (!vars["--sched-primary"]) {
      vars["--sched-primary"] = theme.palette.primary.main;
    }
    if (!vars["--sched-text"]) {
      vars["--sched-text"] = theme.palette.text.primary;
    }
    return vars;
  }, [tokens, theme]);

  return (
    <Box
      sx={{
        borderRadius: 2,
        border: (muiTheme) => `1px solid ${muiTheme.palette.divider}`,
        p: 2,
        backgroundColor:
          tokens.variant === "underline"
            ? "transparent"
            : "rgba(148,163,184,0.08)",
        ...cssVars,
      }}
    >
      <Stack spacing={1}>
        <Typography
          variant="subtitle2"
          sx={{
            color: "var(--nav-btn-text, inherit)",
            fontWeight: tokens.font_weight || 600,
            textTransform: tokens.text_transform || "none",
            fontFamily: "var(--nav-brand-font-family, inherit)",
            fontSize: "var(--nav-brand-font-size, 20px)",
          }}
        >
          Brand / Company
        </Typography>
        <Stack
          direction="row"
          spacing={0}
          sx={{
            gap: `${tokens.item_spacing}px`,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {NAV_BUTTON_LABELS.map((label, idx) => (
            <Box
              key={label}
              sx={buttonStyles(highlightActive ? idx === 1 : false)}
            >
              {label}
            </Box>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
};

const ColorField = ({ label, value, onChange, placeholder }) => {
  const inputRef = useRef(null);
  const effectiveValue = value || "";
  const isHex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(effectiveValue);
  const pickerValue = isHex ? effectiveValue : "#000000";

  const triggerPicker = () => {
    inputRef.current?.click();
  };

  return (
    <Stack spacing={0.75}>
      <Typography variant="body2">{label}</Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <Box
          onClick={triggerPicker}
          sx={{
            width: 36,
            height: 32,
            borderRadius: 1,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            background: effectiveValue || "transparent",
            cursor: "pointer",
            position: "relative",
          }}
        />
        <input
          type="color"
          ref={inputRef}
          value={pickerValue}
          onChange={(e) => onChange(e.target.value)}
          style={{ display: "none" }}
        />
        <TextField
          size="small"
          value={effectiveValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          sx={{ flex: 1 }}
        />
        <Button size="small" onClick={() => onChange(null)} disabled={!effectiveValue}>
          Clear
        </Button>
      </Stack>
    </Stack>
  );
};

export default function WebsiteNavSettingsCard({
  companyId,
  value,
  onChange,
  onSave,
  saving = false,
  message = "",
  error = "",
}) {
  const theme = useTheme();
  const normalizedCompanyId = Number(companyId || 0);

  const [navStyle, setNavStyle] = useState(() =>
    normalizeNavStyle(
      value?.nav_style ?? value?.settings?.nav_style ?? NAV_STYLE_DEFAULT
    )
  );

  const lastStyleHashRef = useRef("");

  const emitChange = (nextStyle) => {
    if (!onChange) return;
    onChange({
      nav_style: normalizeNavStyle(nextStyle || NAV_STYLE_DEFAULT),
    });
  };

  useEffect(() => {
    const incomingStyle = normalizeNavStyle(
      value?.nav_style ?? value?.settings?.nav_style ?? NAV_STYLE_DEFAULT
    );
    const hash = JSON.stringify(incomingStyle);
    if (hash !== lastStyleHashRef.current) {
      setNavStyle(incomingStyle);
      lastStyleHashRef.current = hash;
    }
  }, [value]);

  const updateNavStyleField = (key, input) => {
    const next =
      typeof input === "string" && !input.trim()
        ? null
        : input;
    setNavStyle((prev) => {
      const merged = normalizeNavStyle({ ...(prev || {}), [key]: next });
      emitChange(merged);
      return merged;
    });
  };

  const applyPreset = (preset) => {
    const style = normalizeNavStyle(getPresetStyle(preset));
    setNavStyle(style);
    emitChange(style);
  };

  const applyColorPreset = (preset) => {
    const style = normalizeNavStyle({ ...navStyle, ...(preset?.colors || {}) });
    setNavStyle(style);
    emitChange(style);
  };

  const applyShadowPreset = (preset) => {
    const value = !preset || preset.value === "none" ? "none" : preset.value;
    updateNavStyleField("shadow", value);
  };

  const resetNavStyle = () => {
    const reset = normalizeNavStyle(NAV_STYLE_DEFAULT);
    setNavStyle(reset);
    emitChange(reset);
  };

const handleSave = () => {
  if (!onSave) return;
  const full = normalizeNavStyle(navStyle);
  onSave({ settings: { nav_style: full } });
};

  const previewStyle = useMemo(() => normalizeNavStyle(navStyle), [navStyle]);
  const navCssVars = useMemo(
    () => ({
      "--sched-primary": theme.palette.primary.main,
      "--sched-text": theme.palette.text.primary,
      ...navStyleToCssVars(previewStyle),
    }),
    [previewStyle, theme]
  );

  const activePresetId = useMemo(() => {
    const match = NAV_STYLE_PRESETS.find((preset) =>
      stylesEqual(previewStyle, getPresetStyle(preset))
    );
    return match?.id || null;
  }, [previewStyle]);

  const activeColorPresetId = useMemo(() => {
    const match = NAV_COLOR_PRESETS.find((preset) =>
      Object.entries(preset.colors).every(
        ([key, value]) => (previewStyle[key] ?? null) === (value ?? null)
      )
    );
    return match?.id || null;
  }, [previewStyle]);

  const activeShadowPresetId = useMemo(() => {
    if (!previewStyle.shadow || previewStyle.shadow === "none") {
      return NAV_SHADOW_PRESETS[0]?.id || "none";
    }
    const match = NAV_SHADOW_PRESETS.find(
      (preset) => preset.value === previewStyle.shadow
    );
    return match?.id || null;
  }, [previewStyle]);

  if (!value) {
    return (
      <Card variant="outlined">
        <CardHeader title="Website Navigation & Menu" />
        <Divider />
        <CardContent>
          <Alert severity="info">Loading navigation settings…</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined">
      <CardHeader
        title="Website Navigation & Menu"
        subheader={
          <Typography variant="caption" color="text.secondary">
            {normalizedCompanyId
              ? `company_id=${normalizedCompanyId}`
              : "Company id missing"}
          </Typography>
        }
      />
      <Divider />
      <CardContent sx={{ position: "relative" }}>
        <Stack spacing={2} sx={{ mb: 2 }}>
          {message && <Alert severity="success">{message}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>

        <Box
          sx={{
            position: "sticky",
            top: (theme) => theme.spacing(2),
            zIndex: 5,
            backgroundColor: (theme) => theme.palette.background.paper,
            borderRadius: 2,
            border: 1,
            borderColor: "divider",
            boxShadow: (theme) => theme.shadows[1],
            p: 2,
            mb: 3,
          }}
        >
          <Stack spacing={1}>
            <Typography variant="subtitle2">Live preview</Typography>
            <Box sx={navCssVars}>
              <NavPreview tokens={previewStyle} />
            </Box>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Tooltip title="Reset navigation style to defaults">
                <span>
                  <Button
                    size="small"
                    onClick={resetNavStyle}
                    disabled={saving}
                    variant="outlined"
                    color="inherit"
                  >
                    Reset style
                  </Button>
                </span>
              </Tooltip>
              <Button variant="contained" disabled={saving} onClick={handleSave}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </Stack>
          </Stack>
        </Box>

        <Stack spacing={3}>
          <Stack spacing={1}>
            <Typography variant="subtitle2">Quick presets</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {NAV_STYLE_PRESETS.map((preset) => {
                const active = activePresetId === preset.id;
                return (
                  <Chip
                    key={preset.id}
                    label={preset.name}
                    clickable
                    color={active ? "primary" : "default"}
                    variant={active ? "filled" : "outlined"}
                    onClick={() => applyPreset(preset)}
                  />
                );
              })}
            </Stack>
            <Typography variant="subtitle2" sx={{ pt: 1 }}>
              Colour palettes
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {NAV_COLOR_PRESETS.map((preset) => {
                const active = activeColorPresetId === preset.id;
                return (
                  <Chip
                    key={preset.id}
                    label={preset.name}
                    clickable
                    color={active ? "primary" : "default"}
                    variant={active ? "filled" : "outlined"}
                    onClick={() => applyColorPreset(preset)}
                    sx={{
                      "& .MuiChip-label": {
                        display: "flex",
                        alignItems: "center",
                        gap: 0.75,
                      },
                    }}
                  />
                );
              })}
            </Stack>
          </Stack>

          <Divider />

          <Stack spacing={1}>
            <Typography variant="subtitle2">Menu colours</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <ColorField
                  label="Background color"
                  value={previewStyle.bg}
                  onChange={(val) => updateNavStyleField("bg", val)}
                  placeholder="#6366F1"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <ColorField
                  label="Hover background"
                  value={previewStyle.bg_hover}
                  onChange={(val) => updateNavStyleField("bg_hover", val)}
                  placeholder="#5A4AD1"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <ColorField
                  label="Text color"
                  value={previewStyle.text}
                  onChange={(val) => updateNavStyleField("text", val)}
                  placeholder="#ffffff"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <ColorField
                  label="Hover text color"
                  value={previewStyle.text_hover}
                  onChange={(val) => updateNavStyleField("text_hover", val)}
                  placeholder="#ffffff"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <ColorField
                  label="Active background"
                  value={previewStyle.active_bg}
                  onChange={(val) => updateNavStyleField("active_bg", val)}
                  placeholder="rgba(255,255,255,0.18)"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <ColorField
                  label="Active text color"
                  value={previewStyle.active_text}
                  onChange={(val) => updateNavStyleField("active_text", val)}
                  placeholder="#6366F1"
                />
              </Grid>
            </Grid>
          </Stack>

          <Divider />

          <Stack spacing={1}>
            <Typography variant="subtitle2">Shadow</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {NAV_SHADOW_PRESETS.map((preset) => {
                const active = activeShadowPresetId === preset.id;
                return (
                  <Chip
                    key={preset.id}
                    label={preset.name}
                    clickable
                    color={active ? "primary" : "default"}
                    variant={active ? "filled" : "outlined"}
                    onClick={() => applyShadowPreset(preset)}
                  />
                );
              })}
            </Stack>
            <TextField
              size="small"
              label="Custom shadow"
              value={previewStyle.shadow || ""}
              onChange={(e) => updateNavStyleField("shadow", e.target.value)}
              placeholder="e.g. 0 18px 36px rgba(15,23,42,0.16)"
            />
          </Stack>

          <Divider />

          <Stack spacing={1}>
            <Typography variant="subtitle2">Variants & typography</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {VARIANT_OPTIONS.map((opt) => {
                const active = previewStyle.variant === opt.value;
                return (
                  <Chip
                    key={opt.value}
                    label={opt.label}
                    clickable
                    color={active ? "primary" : "default"}
                    variant={active ? "filled" : "outlined"}
                    onClick={() => updateNavStyleField("variant", opt.value)}
                  />
                );
              })}
            </Stack>
            <TextField
              select
              size="small"
              label="Text transform"
              value={previewStyle.text_transform}
              onChange={(e) => updateNavStyleField("text_transform", e.target.value)}
            >
              {TEXT_TRANSFORM_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Divider />

          <Stack spacing={1}>
            <Typography variant="subtitle2">Brand text</Typography>
            <TextField
              select
              size="small"
              label="Font family"
              value={previewStyle.brand_font_family || "inherit"}
              onChange={(e) => updateNavStyleField("brand_font_family", e.target.value)}
            >
              {BRAND_FONT_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
            <Typography variant="body2" gutterBottom>
              Font size ({previewStyle.brand_font_size}px)
            </Typography>
            <Slider
              min={10}
              max={48}
              value={previewStyle.brand_font_size || 20}
              onChange={(_, v) => updateNavStyleField("brand_font_size", v)}
            />
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Typography variant="subtitle2">Spacing & layout</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" gutterBottom>
                  Border radius ({previewStyle.border_radius}px)
                </Typography>
                <Slider
                  min={0}
                  max={200}
                  value={previewStyle.border_radius}
                  onChange={(_, v) => updateNavStyleField("border_radius", v)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" gutterBottom>
                  Font weight ({previewStyle.font_weight})
                </Typography>
                <Slider
                  min={200}
                  max={800}
                  step={50}
                  value={previewStyle.font_weight}
                  onChange={(_, v) => updateNavStyleField("font_weight", v)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" gutterBottom>
                  Horizontal padding ({previewStyle.padding_x}px)
                </Typography>
                <Slider
                  min={0}
                  max={80}
                  value={previewStyle.padding_x}
                  onChange={(_, v) => updateNavStyleField("padding_x", v)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" gutterBottom>
                  Vertical padding ({previewStyle.padding_y}px)
                </Typography>
                <Slider
                  min={0}
                  max={48}
                  value={previewStyle.padding_y}
                  onChange={(_, v) => updateNavStyleField("padding_y", v)}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" gutterBottom>
                  Gap between buttons ({previewStyle.item_spacing}px)
                </Typography>
                <Slider
                  min={0}
                  max={40}
                  value={previewStyle.item_spacing}
                  onChange={(_, v) => updateNavStyleField("item_spacing", v)}
                />
              </Grid>
            </Grid>
          </Stack>

        </Stack>
      </CardContent>
    </Card>
  );
}
