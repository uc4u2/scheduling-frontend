// src/components/website/WebsiteBrandingCard.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Portal,
  Select,
  Stack,
  Slider,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { website } from "../../utils/api";
import {
  SOCIAL_ICON_OPTIONS,
  defaultFooterConfig,
  defaultHeaderConfig,
  normalizeFooterConfig,
  normalizeHeaderConfig,
} from "../../utils/headerFooter";
import {
  cloneFooterColumns,
  cloneLegalLinks,
  DEFAULT_COPYRIGHT_TEXT,
  formatCopyrightText,
} from "../../utils/footerDefaults";
import { colorToPickerValue } from "../../utils/color";

const THEME_PRESETS = [
  {
    key: "classic",
    label: "Classic",
    overrides: {
      brandColor: "#6366F1",
      surface: "light",
      header: { background: "#0f172a", text: "#ffffff" },
      footer: { background: "#0b1120", text: "#e2e8f0" },
      radius: 20,
      shadow: "md",
    },
  },
  {
    key: "noir",
    label: "Noir",
    overrides: {
      brandColor: "#F472B6",
      surface: "dark",
      header: { background: "#050505", text: "#fefefe" },
      footer: { background: "#111111", text: "#e5e7eb" },
      radius: 12,
      shadow: "lg",
    },
  },
  {
    key: "sunset",
    label: "Sunset",
    overrides: {
      brandColor: "#F97316",
      surface: "light",
      header: { background: "linear-gradient(120deg,#F97316,#FDE68A)", text: "#111827" },
      footer: { background: "#1f2937", text: "#fef3c7" },
      radius: 28,
      shadow: "md",
    },
  },
  {
    key: "minimal",
    label: "Minimal",
    overrides: {
      brandColor: "#0ea5e9",
      surface: "light",
      header: { background: "#ffffff", text: "#111827" },
      footer: { background: "#f1f5f9", text: "#0f172a" },
      radius: 8,
      shadow: "sm",
    },
  },
];

const COLOR_PRESETS = [
  { label: "Brand", value: "var(--brand-color)" },
  { label: "Surface", value: "var(--page-secondary-bg, #0f172a)" },
  { label: "White", value: "#ffffff" },
  { label: "Black", value: "#000000" },
];

const ALIGN_OPTIONS = [
  { value: "far-left", label: "Far left" },
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
  { value: "far-right", label: "Far right" },
];

const SOCIAL_POSITION_OPTIONS = [
  { value: "above", label: "Above menu" },
  { value: "inline", label: "Inline with menu" },
  { value: "after", label: "After menu tabs" },
  { value: "below", label: "Below menu" },
];

const LOGO_WIDTH_MIN = 48;
const LOGO_WIDTH_MAX = 320;
const HEADER_PADDING_MIN = 8;
const HEADER_PADDING_MAX = 160;

const LAYOUT_PRESETS = [
  { value: "simple", label: "Logo + nav inline" },
  { value: "center", label: "Centered stack" },
  { value: "split", label: "Logo left, nav right" },
];

const clampValue = (val, min, max) => {
  const num = Number(val);
  if (!Number.isFinite(num)) return min;
  return Math.min(max, Math.max(min, num));
};

const MAX_NAV_ITEMS = 10;
const MAX_LEGAL_LINKS = 6;
const isValidHref = (href = "") => {
  const trimmed = href.trim();
  if (!trimmed) return false;
  if (/^https?:\/\//i.test(trimmed)) return true;
  if (trimmed.startsWith("mailto:") || trimmed.startsWith("tel:")) return true;
  if (trimmed.startsWith("/")) return true;
  if (trimmed.startsWith("?page=")) return true;
  return false;
};

const ErrorHelper = ({ message }) =>
  message ? (
    <Alert severity="error" sx={{ mt: 1 }}>
      {message}
    </Alert>
  ) : null;

function LogoPicker({ label, asset, onUpload, onClear, uploading, disabled }) {
  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2">{label}</Typography>
      {asset?.url ? (
        <Box
          component="img"
          src={asset.url}
          alt=""
          sx={{
            width: 160,
            height: "auto",
            borderRadius: 1,
            border: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        />
      ) : (
        <Typography variant="body2" color="text.secondary">
          No logo selected.
        </Typography>
      )}
      <Stack direction="row" spacing={1}>
        <Button
          component="label"
          variant="outlined"
          startIcon={<UploadIcon />}
          disabled={disabled || uploading}
        >
          {uploading ? "Uploading…" : "Upload logo"}
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload?.(file);
              e.target.value = "";
            }}
          />
        </Button>
        {asset?.url && (
          <Button
            variant="text"
            color="inherit"
            onClick={onClear}
            startIcon={<DeleteOutlineIcon fontSize="small" />}
          >
            Remove
          </Button>
        )}
      </Stack>
    </Stack>
  );
}

function ColorTokenInput({
  label,
  value,
  onChange,
  helperText,
  presets = COLOR_PRESETS,
}) {
  const handleToken = (token) => {
    onChange?.(token);
  };
  const handleColorInput = (evt) => {
    onChange?.(evt.target.value || "");
  };
  return (
    <Stack spacing={0.5}>
      <Typography variant="subtitle2">{label}</Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <TextField
          size="small"
          fullWidth
          value={value || ""}
          onChange={handleColorInput}
          placeholder="CSS color or token"
          helperText={helperText}
        />
        <input
          type="color"
          value={colorToPickerValue(value)}
          onChange={(e) => onChange?.(e.target.value)}
          style={{ width: 36, height: 36, border: "none", background: "transparent" }}
        />
      </Stack>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {presets.map((preset) => (
          <Chip
            key={preset.value}
            label={preset.label}
            size="small"
            onClick={() => handleToken(preset.value)}
            sx={{ color: "inherit" }}
          />
        ))}
      </Stack>
    </Stack>
  );
}

function LayoutPresetSelector({ value, onChange }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="subtitle2">Layout</Typography>
      <ToggleButtonGroup
        size="small"
        color="primary"
        exclusive
        value={value || "simple"}
        onChange={(_, val) => val && onChange?.(val)}
      >
        {LAYOUT_PRESETS.map((preset) => (
          <ToggleButton key={preset.value} value={preset.value}>
            {preset.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Stack>
  );
}

function AlignmentSelector({ label, value, onChange }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="subtitle2">{label}</Typography>
      <ToggleButtonGroup
        size="small"
        exclusive
        value={value || "left"}
        onChange={(_, val) => val && onChange?.(val)}
      >
        {ALIGN_OPTIONS.map((opt) => (
          <ToggleButton key={opt.value} value={opt.value}>
            {opt.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Stack>
  );
}

function LinkListEditor({
  title,
  items,
  onChange,
  addLabel = "Add link",
  max = 6,
  helperText,
  disabled = false,
}) {
  const list = Array.isArray(items) ? items : [];
  const handleChange = (idx, field, value) => {
    if (disabled) return;
    const next = list.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    onChange?.(next);
  };
  const handleAdd = () => {
    if (disabled) return;
    if (list.length >= max) return;
    onChange?.([...list, { label: "", href: "" }]);
  };
  const handleRemove = (idx) => {
    if (disabled) return;
    const next = list.filter((_, i) => i !== idx);
    onChange?.(next);
  };
  const move = (idx, dir) => {
    if (disabled) return;
    const target = idx + dir;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange?.(next);
  };
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="subtitle2">{title}</Typography>
        <Button
          size="small"
          startIcon={<AddCircleOutlineIcon fontSize="small" />}
          onClick={handleAdd}
          disabled={disabled || list.length >= max}
        >
          {addLabel}
        </Button>
      </Stack>
      {helperText && (
        <Typography variant="caption" color="text.secondary">
          {helperText}
        </Typography>
      )}
      {list.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No links yet.
        </Typography>
      )}
      {list.map((item, idx) => (
        <Grid key={`link-${idx}`} container spacing={1} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              size="small"
              fullWidth
              label="Label"
              value={item.label || ""}
              onChange={(e) => handleChange(idx, "label", e.target.value)}
              inputProps={{ maxLength: 32 }}
              disabled={disabled}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              size="small"
              fullWidth
              label="Href"
              value={item.href || ""}
              onChange={(e) => handleChange(idx, "href", e.target.value)}
              placeholder="/pricing or https://example.com"
              disabled={disabled}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Stack direction="row" spacing={0.5}>
              <IconButton size="small" onClick={() => move(idx, -1)} disabled={disabled}>
                <ArrowUpwardIcon fontSize="inherit" />
              </IconButton>
              <IconButton size="small" onClick={() => move(idx, 1)} disabled={disabled}>
                <ArrowDownwardIcon fontSize="inherit" />
              </IconButton>
              <IconButton size="small" onClick={() => handleRemove(idx)} disabled={disabled}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Grid>
        </Grid>
      ))}
    </Stack>
  );
}

function PageDrivenMenuPreview({
  items,
  onEditPages,
  manualCount = 0,
  onClearManual,
}) {
  const list = Array.isArray(items) ? items : [];
  return (
    <Box
      sx={{
        borderRadius: 1,
        border: (theme) => `1px dashed ${theme.palette.divider}`,
        p: 2,
        backgroundColor: (theme) =>
          theme.palette.mode === "dark"
            ? "rgba(148,163,184,0.08)"
            : "rgba(148,163,184,0.08)",
      }}
    >
      <Stack spacing={1.25}>
        {list.length ? (
          list.map((item, idx) => (
            <Stack key={`${item.slug || item.href}-${idx}`} spacing={0.25}>
              <Typography variant="body2" fontWeight={600}>
                {item.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {item.href}
              </Typography>
            </Stack>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">
            Mark pages as “Show in menu” to populate the navigation automatically.
          </Typography>
        )}
        {manualCount > 0 && (
          <Alert severity="info" variant="outlined" sx={{ mt: 1 }}>
            Manual navigation currently stores {manualCount} link
            {manualCount === 1 ? "" : "s"}. They’re ignored while Page-driven
            mode is active.
            <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button
                size="small"
                variant="outlined"
                onClick={onClearManual}
                disabled={!onClearManual}
              >
                Clear manual list
              </Button>
            </Box>
          </Alert>
        )}
        <Box>
          <Button
            size="small"
            variant="outlined"
            onClick={onEditPages}
            disabled={!onEditPages}
          >
            Edit in Pages
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}

function SocialLinksEditor({ title, items, onChange }) {
  const list = Array.isArray(items) ? items : [];
  const isDisabled = !onChange;
  const handleAdd = () => {
    if (isDisabled) return;
    // Seed with a non-empty href so normalization doesn't drop the row.
    onChange([...list, { icon: "instagram", href: "https://" }]);
  };
  const handleRemove = (idx) => {
    if (isDisabled) return;
    onChange(list.filter((_, i) => i !== idx));
  };
  const handleChange = (idx, patch) => {
    if (isDisabled) return;
    onChange(list.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  };
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="subtitle2">{title}</Typography>
        <Button
          size="small"
          startIcon={<AddCircleOutlineIcon fontSize="small" />}
          onClick={handleAdd}
          disabled={isDisabled || list.length >= 6}
        >
          Add social link
        </Button>
      </Stack>
      {list.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No social links configured.
        </Typography>
      )}
      {list.map((item, idx) => (
        <Grid key={`social-${idx}`} container spacing={1} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Icon</InputLabel>
              <Select
                label="Icon"
                value={item.icon || "instagram"}
                onChange={(e) => handleChange(idx, { icon: e.target.value })}
              >
                {SOCIAL_ICON_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={7}>
            <TextField
              size="small"
              fullWidth
              label="URL"
              value={item.href || ""}
              onChange={(e) => handleChange(idx, { href: e.target.value })}
              placeholder="https://instagram.com/acme"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <IconButton size="small" onClick={() => handleRemove(idx)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Grid>
        </Grid>
      ))}
    </Stack>
  );
}

function ColumnsEditor({ columns, onChange }) {
  const list = Array.isArray(columns) ? columns : [];
  const handleAdd = () => {
    if (list.length >= 4) return;
    onChange?.([...list, { title: "", links: [] }]);
  };
  const handleRemove = (idx) => {
    onChange?.(list.filter((_, i) => i !== idx));
  };
  const updateColumn = (idx, patch) => {
    onChange?.(
      list.map((col, i) => (i === idx ? { ...col, ...patch } : col))
    );
  };
  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="subtitle2">Footer Columns</Typography>
        <Button
          size="small"
          startIcon={<AddCircleOutlineIcon fontSize="small" />}
          onClick={handleAdd}
          disabled={list.length >= 4}
        >
          Add column
        </Button>
      </Stack>
      {list.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No columns yet.
        </Typography>
      )}
      {list.map((col, idx) => (
        <Box
          key={`column-${idx}`}
          sx={{
            border: (theme) => `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            p: 2,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              label="Column title"
              size="small"
              fullWidth
              value={col.title || ""}
              onChange={(e) => updateColumn(idx, { title: e.target.value })}
            />
            <IconButton onClick={() => handleRemove(idx)} size="small">
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Stack>
          <Box sx={{ mt: 1.5 }}>
            <LinkListEditor
              title="Links"
              items={col.links || []}
              onChange={(links) => updateColumn(idx, { links })}
              addLabel="Add link"
              max={6}
            />
          </Box>
        </Box>
      ))}
    </Stack>
  );
}

function deslug(value) {
  return (value || "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function HeaderPreview({ header, theme, onLogoDragStart, companySlug = "Preview brand" }) {
  const bg = header.bg || theme.header?.background || "#0f172a";
  const textColor = header.text || theme.header?.text || "#ffffff";
  const logoWidth = clampValue(header.logo_width ?? 140, LOGO_WIDTH_MIN, LOGO_WIDTH_MAX);
  const paddingY = clampValue(header.padding_y ?? 20, HEADER_PADDING_MIN, HEADER_PADDING_MAX);
  const alignToFlex = (val) => {
    switch ((val || "").toLowerCase()) {
      case "center":
        return "center";
      case "right":
      case "far-right":
        return "flex-end";
      default:
        return "flex-start";
    }
  };
  const inlinePlacementFromAlign = (val, forced) => {
    if (forced) return forced;
    const raw = (val || "").toLowerCase();
    switch (raw) {
      case "far-left":
      case "left":
        return "before";
      case "center":
        return "center";
      default:
        return "after";
    }
  };
  const inlineSocial = ["inline", "after"].includes(
    (header.social_position || "inline").toLowerCase()
  );
  const showBrandText = header.show_brand_text !== false;
  const brandLabel = showBrandText
    ? header.text || deslug(companySlug) || "Brand headline"
    : "";
  const forcedInlinePlacement = header.social_position === "after" ? "after" : null;
  const inlinePlacement = inlineSocial
    ? inlinePlacementFromAlign(header.social_alignment, forcedInlinePlacement)
    : null;
  const renderSocialStack = (inline = false, placement = "after") => (
    <Stack
      direction="row"
      spacing={0.75}
      justifyContent={inline ? "flex-start" : alignToFlex(header.social_alignment)}
      flexWrap={inline ? "nowrap" : "wrap"}
      sx={{
        width: inline ? "auto" : "100%",
        mt: inline ? 0 : 1,
        flexShrink: inline ? 0 : undefined,
        ml: inline && placement === "after" ? 1.5 : 0,
        mr: inline && placement === "before" ? 1.5 : 0,
        ...(inline && placement === "center"
          ? { marginLeft: "auto", marginRight: "auto" }
          : {}),
      }}
    >
      {[0, 1, 2].map((idx) => (
        <Box
          key={`preview-social-${idx}`}
          sx={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.35)",
          }}
        />
      ))}
    </Stack>
  );
  const inlineSocialNode = inlineSocial
    ? renderSocialStack(true, inlinePlacement || "after")
    : null;

  return (
    <Box
      sx={{
        borderRadius: 1,
        border: (t) => `1px solid ${t.palette.divider}`,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          background: bg,
          color: textColor,
          px: header.full_width ? 0 : 3,
          py: `${paddingY}px`,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        {header.social_position === "above" && renderSocialStack(false)}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", md: "center" }}
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent={alignToFlex(header.logo_alignment)}
            sx={{ flexBasis: { md: "30%" }, width: "100%" }}
          >
            <Box
              sx={{
                width: `${logoWidth}px`,
                height: 46,
                background: "rgba(255,255,255,0.18)",
                borderRadius: 1,
                position: "relative",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  right: -6,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 10,
                  height: 30,
                  borderRadius: 1,
                  backgroundColor: "rgba(255,255,255,0.65)",
                  cursor: "ew-resize",
                  border: "1px solid rgba(15,23,42,0.4)",
                }}
                onMouseDown={onLogoDragStart}
                onTouchStart={onLogoDragStart}
              />
            </Box>
            {showBrandText && (
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {brandLabel}
              </Typography>
            )}
          </Stack>
          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            justifyContent={alignToFlex(header.nav_alignment)}
            sx={{ flex: 1 }}
          >
            {inlineSocial && inlinePlacement === "before" && inlineSocialNode}
            {["Home", "Services", "Pricing", "Contact"].map((label) => (
              <Box
                key={label}
                sx={{
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 999,
                  backgroundColor: "rgba(255,255,255,0.18)",
                  fontSize: 12,
                }}
              >
                {label}
              </Box>
            ))}
            {inlineSocial && inlinePlacement !== "before" && inlineSocialNode}
          </Stack>
        </Stack>
        {header.social_position === "below" && renderSocialStack(false)}
      </Box>
    </Box>
  );
}

function FooterPreview({ footer, theme, companySlug }) {
  const bg = footer.bg || theme.footer?.background || "#0b1120";
  const textColor = footer.text || theme.footer?.text || "#e2e8f0";
  const showCopyright = footer.show_copyright !== false;
  const copyrightSample = formatCopyrightText(footer.copyright_text, {
    company: companySlug,
  });
  return (
    <Box
      sx={{
        borderRadius: 1,
        border: (t) => `1px solid ${t.palette.divider}`,
        overflow: "hidden",
      }}
    >
      <Box sx={{ background: bg, color: textColor, px: 3, py: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Footer preview
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          {footer.text || "Add a concise description or CTA for your footer."}
        </Typography>
        {showCopyright && (
          <Typography variant="caption" sx={{ mt: 2, display: "block", opacity: 0.8 }}>
            {copyrightSample}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function validateConfig(header, footer, { menuSource = "pages" } = {}) {
  const errors = [];
  if ((header.text || "").length > 140) {
    errors.push("Header tagline must be 140 characters or less.");
  }
  if (menuSource === "manual" && (header.nav_items || []).length > MAX_NAV_ITEMS) {
    errors.push("Limit header navigation to 10 items.");
  }
  if ((footer.legal_links || []).length > MAX_LEGAL_LINKS) {
    errors.push("Legal links should be 6 or fewer.");
  }
  if (menuSource === "manual") {
    (header.nav_items || []).forEach((item, idx) => {
      if (!isValidHref(item.href || "")) {
        errors.push(`Nav item ${idx + 1} must have a valid link.`);
      }
      if ((item.label || "").length > 32) {
        errors.push(`Nav item ${idx + 1} label should be 32 characters or less.`);
      }
    });
  }
  (footer.legal_links || []).forEach((item, idx) => {
    if (!isValidHref(item.href || "")) {
      errors.push(`Legal link ${idx + 1} needs a valid URL.`);
    }
  });
  (footer.social_links || []).forEach((item, idx) => {
    if (!isValidHref(item.href || "")) {
      errors.push(`Footer social link ${idx + 1} needs a valid URL.`);
    }
  });
  (header.social_links || []).forEach((item, idx) => {
    if (!isValidHref(item.href || "")) {
      errors.push(`Header social link ${idx + 1} needs a valid URL.`);
    }
  });
  return errors;
}

export default function WebsiteBrandingCard({
  companyId,
  companySlug = "Preview Co.",
  headerValue,
  footerValue,
  themeOverridesValue,
  defaultThemeOverrides = THEME_PRESETS[0].overrides,
  onChangeHeader,
  onChangeFooter,
  onChangeThemeOverrides,
  onSave,
  saving = false,
  message = "",
  error = "",
  navOverridesValue,
  onChangeNavOverrides,
  pagesMeta = [],
  onRequestPagesJump,
  floatingSaveVisible = true,
  floatingSavePlacement = "bottom-right",
}) {
  const header = useMemo(
    () => normalizeHeaderConfig(headerValue || defaultHeaderConfig()),
    [headerValue]
  );
  const footer = useMemo(
    () => normalizeFooterConfig(footerValue || defaultFooterConfig()),
    [footerValue]
  );
  const themeOverrides = useMemo(() => {
    const base = {
      ...defaultThemeOverrides,
      ...(themeOverridesValue || {}),
    };
    return {
      ...base,
      header: { ...(defaultThemeOverrides.header || {}), ...(themeOverridesValue?.header || {}) },
      footer: { ...(defaultThemeOverrides.footer || {}), ...(themeOverridesValue?.footer || {}) },
    };
  }, [themeOverridesValue, defaultThemeOverrides]);
  const navOverrides = useMemo(() => {
    const base = { ...(navOverridesValue || {}) };
    if (!base.menu_source) {
      base.menu_source = "pages";
    }
    return base;
  }, [navOverridesValue]);
  const menuSource = navOverrides.menu_source || "pages";
  const derivedPageNav = useMemo(() => {
    const list = Array.isArray(pagesMeta) ? pagesMeta : [];
    return list
      .filter((p) => p && p.show_in_menu !== false)
      .sort((a, b) => {
        const orderA = Number.isFinite(a?.sort_order) ? a.sort_order : 0;
        const orderB = Number.isFinite(b?.sort_order) ? b.sort_order : 0;
        if (orderA !== orderB) return orderA - orderB;
        const slugA = (a?.slug || "").toString();
        const slugB = (b?.slug || "").toString();
        return slugA.localeCompare(slugB);
      })
      .map((p) => ({
        label: p.menu_title || p.title || p.slug,
        href: p.slug ? `?page=${p.slug}` : "#",
        slug: p.slug || p.menu_title || p.title || "",
      }));
  }, [pagesMeta]);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);
  const manualNavCount = Array.isArray(header.nav_items)
    ? header.nav_items.length
    : 0;
  const previewBrandSlug = companySlug || "Preview Co.";
  const [selectedThemePreset, setSelectedThemePreset] = useState(() => {
    const preset = THEME_PRESETS.find((preset) =>
      JSON.stringify(preset.overrides) === JSON.stringify(themeOverrides)
    );
    return preset?.key || "custom";
  });

  const updateHeader = useCallback(
    (patch) => {
      const next = normalizeHeaderConfig({ ...header, ...patch });
      onChangeHeader?.(next);
    },
    [header, onChangeHeader]
  );

  const handleClearManualNav = useCallback(() => {
    if (!manualNavCount) return;
    onChangeHeader?.(
      normalizeHeaderConfig({
        ...header,
        nav_items: [],
      })
    );
  }, [manualNavCount, header, onChangeHeader]);

  const logoDragStateRef = useRef(null);

  const handleLogoDragMove = useCallback(
    (event) => {
      if (!logoDragStateRef.current) return;
      const point = event.touches ? event.touches[0] : event;
      if (!point) return;
      const delta = point.clientX - logoDragStateRef.current.startX;
      const nextWidth = clampValue(
        logoDragStateRef.current.base + delta,
        LOGO_WIDTH_MIN,
        LOGO_WIDTH_MAX
      );
      updateHeader({ logo_width: nextWidth });
      if (event.cancelable) {
        event.preventDefault();
      }
    },
    [updateHeader]
  );

  const stopLogoDrag = useCallback(() => {
    logoDragStateRef.current = null;
    window.removeEventListener("mousemove", handleLogoDragMove);
    window.removeEventListener("mouseup", stopLogoDrag);
    window.removeEventListener("touchmove", handleLogoDragMove);
    window.removeEventListener("touchend", stopLogoDrag);
  }, [handleLogoDragMove]);

  const startLogoDrag = useCallback(
    (event) => {
      const point = event.touches ? event.touches[0] : event;
      if (!point) return;
      if (event.cancelable) {
        event.preventDefault();
      }
      logoDragStateRef.current = {
        startX: point.clientX,
        base: Number(header.logo_width ?? 140),
      };
      window.addEventListener("mousemove", handleLogoDragMove);
      window.addEventListener("mouseup", stopLogoDrag);
      window.addEventListener("touchmove", handleLogoDragMove, { passive: false });
      window.addEventListener("touchend", stopLogoDrag);
    },
    [header.logo_width, handleLogoDragMove, stopLogoDrag]
  );

  useEffect(() => () => stopLogoDrag(), [stopLogoDrag]);

  const updateFooter = (patch) => {
    const next = normalizeFooterConfig({ ...footer, ...patch });
    onChangeFooter?.(next);
  };

  const updateThemeOverrides = (patch) => {
    const next = {
      ...themeOverrides,
      ...patch,
    };
    onChangeThemeOverrides?.(next);
    setSelectedThemePreset("custom");
  };

  const updateNavOverrides = (patch) => {
    if (!onChangeNavOverrides) return;
    const next = {
      ...(navOverridesValue || {}),
      ...patch,
    };
    if (!next.menu_source) {
      next.menu_source = "pages";
    }
    onChangeNavOverrides(next);
  };

  const handleThemePreset = (presetKey) => {
    const preset = THEME_PRESETS.find((p) => p.key === presetKey);
    if (!preset) return;
    setSelectedThemePreset(presetKey);
    onChangeThemeOverrides?.(preset.overrides);
  };

  const uploadLogo = async (file, target) => {
    if (!file || !companyId) return;
    // Client-side guard to avoid server 413s
    const MAX_LOGO_BYTES = 5 * 1024 * 1024; // 5MB budget to stay under backend limits
    if (file.size > MAX_LOGO_BYTES) {
      setUploadErr("Image is too large. Max size 5MB. Please upload a smaller JPG/PNG/WebP.");
      return;
    }
    setUploading(true);
    setUploadErr("");
    try {
      const res = await website.uploadMedia(file, { companyId });
      const asset = res?.items?.[0];
      if (!asset) throw new Error("Upload failed");
      if (target === "header") {
        updateHeader({ logo_asset_id: asset.id, logo_asset: asset });
      } else {
        updateFooter({ logo_asset_id: asset.id, logo_asset: asset });
      }
    } catch (e) {
      const status = e?.response?.status;
      if (status === 413) {
        setUploadErr("Image is too large. Max size 5MB. Please upload a smaller JPG/PNG/WebP.");
      } else {
        setUploadErr(
          e?.response?.data?.error ||
            e?.message ||
            "Upload failed. Try a smaller image or check your connection."
        );
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    const issues = validateConfig(header, footer, { menuSource });
    setValidationErrors(issues);
    if (issues.length) return;
    onSave?.({
      header,
      footer,
      theme_overrides: themeOverrides,
      nav_overrides: navOverrides,
    });
  };

  return (
    <Stack spacing={3}>
      <Card variant="outlined">
        <CardHeader
          title="Header"
          subheader="Choose layout, logo, and navigation style."
          action={
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Theme preset</InputLabel>
              <Select
                label="Theme preset"
                value={selectedThemePreset}
                onChange={(e) => handleThemePreset(e.target.value)}
              >
                {THEME_PRESETS.map((preset) => (
                  <MenuItem key={preset.key} value={preset.key}>
                    {preset.label}
                  </MenuItem>
                ))}
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>
          }
        />
        <CardContent sx={{ display: "grid", gap: 3 }}>
          <LayoutPresetSelector
            value={header.layout}
            onChange={(val) => updateHeader({ layout: val })}
          />
          <Stack spacing={1}>
            <Typography variant="subtitle2">Logo size</Typography>
            <Slider
              size="small"
              min={LOGO_WIDTH_MIN}
              max={LOGO_WIDTH_MAX}
              value={header.logo_width ?? 140}
              valueLabelDisplay="auto"
              onChange={(_, val) =>
                typeof val === "number" &&
                updateHeader({
                  logo_width: clampValue(val, LOGO_WIDTH_MIN, LOGO_WIDTH_MAX),
                })
              }
            />
            <TextField
              size="small"
              type="number"
              label="Logo width (px)"
              value={Math.round(header.logo_width ?? 140)}
              onChange={(e) =>
                updateHeader({
                  logo_width: clampValue(
                    e.target.value,
                    LOGO_WIDTH_MIN,
                    LOGO_WIDTH_MAX
                  ),
                })
              }
            />
          </Stack>
          <Stack spacing={1}>
            <Typography variant="subtitle2">Header height</Typography>
            <Slider
              size="small"
              min={HEADER_PADDING_MIN}
              max={HEADER_PADDING_MAX}
              value={header.padding_y ?? 20}
              valueLabelDisplay="auto"
              onChange={(_, val) =>
                typeof val === "number" &&
                updateHeader({
                  padding_y: clampValue(
                    val,
                    HEADER_PADDING_MIN,
                    HEADER_PADDING_MAX
                  ),
                })
              }
            />
          </Stack>
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(header.sticky)}
                onChange={(_, v) => updateHeader({ sticky: v })}
              />
            }
            label="Sticky header"
          />
          <LogoPicker
            label="Header logo"
            asset={header.logo_asset}
            onUpload={(file) => uploadLogo(file, "header")}
            onClear={() =>
              updateHeader({ logo_asset_id: null, logo_asset: null })
            }
            uploading={uploading}
            disabled={!companyId}
          />
          <ColorTokenInput
            label="Header background"
            value={header.bg || themeOverrides.header?.background}
            onChange={(val) => updateHeader({ bg: val })}
          />
          <ColorTokenInput
            label="Header text"
            value={header.text || themeOverrides.header?.text}
            onChange={(val) => updateHeader({ text: val })}
            helperText="Used for brand headline."
          />
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <FormControlLabel
              control={
                <Switch
                  checked={header.show_brand_text !== false}
                  onChange={(_, checked) =>
                    updateHeader({ show_brand_text: checked })
                  }
                />
              }
              label="Show brand text"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(header.full_width)}
                  onChange={(_, checked) =>
                    updateHeader({ full_width: checked })
                  }
                />
              }
              label="Edge-to-edge header"
            />
            <Button
              size="small"
              onClick={() => updateHeader({ text: "" })}
              disabled={!header.text}
            >
              Clear text
            </Button>
          </Stack>
          <Stack spacing={1}>
            <Typography variant="subtitle2">Navigation source</Typography>
            <ToggleButtonGroup
              size="small"
              exclusive
              color="primary"
              value={menuSource}
              onChange={(_, val) => val && updateNavOverrides({ menu_source: val })}
            >
              <ToggleButton value="pages">Page-driven</ToggleButton>
              <ToggleButton value="manual">Manual list</ToggleButton>
            </ToggleButtonGroup>
            <Typography variant="body2" color="text.secondary">
              {menuSource === "pages"
                ? "Menu follows Pages (show in menu + order)."
                : "Use a custom list when you need external or special links."}
            </Typography>
          </Stack>
          {menuSource === "pages" ? (
            <PageDrivenMenuPreview
              items={derivedPageNav}
              onEditPages={onRequestPagesJump}
              manualCount={manualNavCount}
              onClearManual={manualNavCount ? handleClearManualNav : undefined}
            />
          ) : (
            <LinkListEditor
              title="Navigation links"
              items={header.nav_items}
              onChange={(items) => updateHeader({ nav_items: items })}
              addLabel="Add nav item"
              max={MAX_NAV_ITEMS}
              helperText="Supports up to 10 items."
            />
          )}
          <AlignmentSelector
            label="Logo alignment"
            value={header.logo_alignment}
            onChange={(val) => updateHeader({ logo_alignment: val })}
          />
          <AlignmentSelector
            label="Navigation alignment"
            value={header.nav_alignment}
            onChange={(val) => updateHeader({ nav_alignment: val })}
          />
          <SocialLinksEditor
            title="Header social links"
            items={header.social_links}
            onChange={(items) => updateHeader({ social_links: items })}
          />
          <AlignmentSelector
            label="Social icon alignment"
            value={header.social_alignment}
            onChange={(val) => updateHeader({ social_alignment: val })}
          />
          <Stack spacing={0.5}>
            <Typography variant="subtitle2">Social icon position</Typography>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={header.social_position || "inline"}
              onChange={(_, val) => val && updateHeader({ social_position: val })}
            >
              {SOCIAL_POSITION_OPTIONS.map((opt) => (
                <ToggleButton key={opt.value} value={opt.value}>
                  {opt.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Stack>
          <HeaderPreview
            header={header}
            theme={themeOverrides}
            onLogoDragStart={startLogoDrag}
            companySlug={previewBrandSlug}
          />
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader
          title="Theme tokens"
          subheader="Tune brand color, radius, and header/footer palettes."
        />
        <CardContent sx={{ display: "grid", gap: 3 }}>
          <ColorTokenInput
            label="Brand color"
            value={themeOverrides.brandColor || defaultThemeOverrides.brandColor || "#6366f1"}
            onChange={(val) => updateThemeOverrides({ brandColor: val })}
          />
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <ColorTokenInput
              label="Header background token"
              value={themeOverrides.header?.background || ""}
              onChange={(val) =>
                updateThemeOverrides({
                  header: { ...(themeOverrides.header || {}), background: val },
                })
              }
            />
            <ColorTokenInput
              label="Header text token"
              value={themeOverrides.header?.text || ""}
              onChange={(val) =>
                updateThemeOverrides({
                  header: { ...(themeOverrides.header || {}), text: val },
                })
              }
            />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <ColorTokenInput
              label="Footer background token"
              value={themeOverrides.footer?.background || ""}
              onChange={(val) =>
                updateThemeOverrides({
                  footer: { ...(themeOverrides.footer || {}), background: val },
                })
              }
            />
            <ColorTokenInput
              label="Footer text token"
              value={themeOverrides.footer?.text || ""}
              onChange={(val) =>
                updateThemeOverrides({
                  footer: { ...(themeOverrides.footer || {}), text: val },
                })
              }
            />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              size="small"
              type="number"
              label="Border radius"
              value={themeOverrides.radius ?? 20}
              onChange={(e) =>
                updateThemeOverrides({
                  radius: Number(e.target.value || 0),
                })
              }
            />
            <FormControl size="small">
              <InputLabel>Shadow</InputLabel>
              <Select
                label="Shadow"
                value={themeOverrides.shadow || "md"}
                onChange={(e) =>
                  updateThemeOverrides({
                    shadow: e.target.value,
                  })
                }
              >
                <MenuItem value="none">None</MenuItem>
                <MenuItem value="sm">Small</MenuItem>
                <MenuItem value="md">Medium</MenuItem>
                <MenuItem value="lg">Large</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader
          title="Footer"
          subheader="Columns, legal links, and social profiles."
        />
        <CardContent sx={{ display: "grid", gap: 3 }}>
          <LogoPicker
            label="Footer logo"
            asset={footer.logo_asset}
            onUpload={(file) => uploadLogo(file, "footer")}
            onClear={() =>
              updateFooter({ logo_asset_id: null, logo_asset: null })
            }
            uploading={uploading}
            disabled={!companyId}
          />
          <ColorTokenInput
            label="Footer background"
            value={footer.bg || themeOverrides.footer?.background}
            onChange={(val) => updateFooter({ bg: val })}
          />
          <TextField
            size="small"
            multiline
            minRows={2}
            fullWidth
            label="Footer summary"
            value={footer.text || ""}
            onChange={(e) => updateFooter({ text: e.target.value })}
          />
          <ColumnsEditor
            columns={footer.columns}
            onChange={(cols) => updateFooter({ columns: cols })}
          />
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button
              size="small"
              onClick={() => updateFooter({ columns: cloneFooterColumns() })}
            >
              Insert default columns
            </Button>
            <Button
              size="small"
              onClick={() => updateFooter({ legal_links: cloneLegalLinks() })}
            >
              Insert legal links
            </Button>
          </Stack>
          <LinkListEditor
            title="Legal links"
            items={footer.legal_links}
            onChange={(links) => updateFooter({ legal_links: links })}
            addLabel="Add legal link"
            max={MAX_LEGAL_LINKS}
          />
          <Stack spacing={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={footer.show_copyright !== false}
                  onChange={(_, val) => updateFooter({ show_copyright: val })}
                />
              }
              label="Show copyright line"
            />
            {footer.show_copyright !== false && (
              <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems="center">
                <TextField
                  size="small"
                  fullWidth
                  label="Copyright text"
                  helperText="Use {{year}} and {{company}} tokens"
                  value={footer.copyright_text || ""}
                  onChange={(e) => updateFooter({ copyright_text: e.target.value })}
                />
                <Button
                  size="small"
                  onClick={() => updateFooter({ copyright_text: DEFAULT_COPYRIGHT_TEXT })}
                >
                  Reset
                </Button>
              </Stack>
            )}
          </Stack>
          <SocialLinksEditor
            title="Footer social links"
            items={footer.social_links}
            onChange={(items) => updateFooter({ social_links: items })}
          />
          <FooterPreview footer={footer} theme={themeOverrides} companySlug={companySlug} />
        </CardContent>
      </Card>

      {uploadErr && <ErrorHelper message={uploadErr} />}
      {error && <ErrorHelper message={error} />}
      {message && (
        <Alert severity="success" sx={{ mt: 1 }}>
          {message}
        </Alert>
      )}
      {validationErrors.length > 0 && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          {validationErrors.map((msg) => (
            <div key={msg}>{msg}</div>
          ))}
        </Alert>
      )}
      <Box sx={{ height: 80 }} />

      {floatingSaveVisible && (
        <Portal>
          <Box
            sx={{
              position: "fixed",
              zIndex: (theme) => theme.zIndex.tooltip + 1,
              pointerEvents: "none",
              ...(floatingSavePlacement === "top-left"
                ? {
                    top: { xs: 96, md: 104 },
                    left: { xs: 16, md: 32 },
                  }
                : floatingSavePlacement === "top-right"
                ? {
                    top: { xs: 96, md: 104 },
                    right: { xs: 16, md: 32 },
                  }
                : floatingSavePlacement === "bottom-left"
                ? {
                    bottom: { xs: 88, md: 48 },
                    left: { xs: 16, md: 32 },
                  }
                : {
                    bottom: { xs: 88, md: 48 },
                    right: { xs: 16, md: 40 },
                  }),
            }}
          >
            <Paper
              elevation={6}
              sx={{
                px: 2,
                py: 1,
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                pointerEvents: "auto",
                boxShadow: "0 10px 25px rgba(15,23,42,0.2)",
                backdropFilter: "blur(12px)",
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark"
                    ? theme.palette.background.paper
                    : theme.palette.background.default,
              }}
            >
              <Typography
                variant="body2"
                sx={{ display: { xs: "none", md: "block" }, fontWeight: 600 }}
              >
                {saving ? "Saving…" : "Save branding draft"}
              </Typography>
              <Button
                variant="contained"
                disabled={saving || uploading}
                onClick={handleSave}
              >
                {saving ? "Saving…" : "Save now"}
              </Button>
            </Paper>
          </Box>
        </Portal>
      )}
    </Stack>
  );
}
