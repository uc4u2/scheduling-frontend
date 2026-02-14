// src/components/website/SchemaInspector.js
import * as React from "react";
import { useTranslation } from "react-i18next";

import {
  Box,
  Stack,
  TextField,
  Switch,
  FormControlLabel,
  MenuItem,
  Button,
  Typography,
  IconButton,
  Divider,
  Select,
  Slider,
  InputLabel,
  InputAdornment,
  FormControl,
  ToggleButton,
  ToggleButtonGroup,
  FormHelperText,
  ButtonBase,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import FormatAlignCenterIcon from "@mui/icons-material/FormatAlignCenter";
import FormatAlignRightIcon from "@mui/icons-material/FormatAlignRight";
import FormatAlignJustifyIcon from "@mui/icons-material/FormatAlignJustify";
import { ImageField, VideoField } from "./BuilderInspectorParts";
import EnterpriseRichTextEditor from "./EnterpriseRichTextEditor";

// Normalizers: prevent <p style="..."> and raw tags from landing in data
import {
  stripHtml,
  normalizeInlineHtml,
  normalizeBlockHtml,
} from "../../utils/html";

/* -----------------------------------------------------------
 * Utilities
 * --------------------------------------------------------- */
const stopBubble = (e) => {
  e.stopPropagation?.();
};

const clampNum = (n, f) => {
  if (typeof n !== "number" || Number.isNaN(n)) return n;
  if (typeof f?.min === "number") n = Math.max(f.min, n);
  if (typeof f?.max === "number") n = Math.min(f.max, n);
  return n;
};

const extractTextAlign = (html = "", fallback = "left") => {
  const match = /text-align\s*:\s*(left|center|right|justify)/i.exec(html || "");
  return match ? match[1].toLowerCase() : fallback;
};

const INLINE_ALIGN_SPAN_RE =
  /^\s*<span\b[^>]*text-align\s*:\s*(left|center|right|justify)[^>]*>([\s\S]*?)<\/span>\s*$/i;

const stripInlineAlignWrapper = (html = "") =>
  String(html || "").replace(INLINE_ALIGN_SPAN_RE, (_, __, inner) => inner);

const applyInlineAlignWrapper = (html = "", align = "left") => {
  const trimmed = stripInlineAlignWrapper(html);
  const effective = (align || "left").toLowerCase();
  if (!trimmed.trim() || effective === "left") {
    return trimmed.trim() ? trimmed : "";
  }
  return `<span style="display:block;text-align:${effective};">${trimmed}</span>`;
};

/** Heuristic: does this field represent an array of images? */
const looksLikeImageArray = (f) =>
  f?.render === "imageArray" ||
  f?.type === "imageArray" ||
  /images?|photos?|gallery/i.test(String(f?.name || "")) ||
  /images?|photos?|gallery/i.test(String(f?.label || ""));

/** Heuristic: treat string fields that look like colors as color pickers */
const looksLikeColor = (f, v) => {
  const n = String(f?.name || "").toLowerCase();
  const l = String(f?.label || "").toLowerCase();
  if (n.includes("color") || l.includes("color")) return true;
  const val = String(v || "");
  return (
    /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(val) ||
    /^rgba?\(/i.test(val) ||
    /^hsla?\(/i.test(val)
  );
};

const clamp01 = (n) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(1, num));
};
const toHexByte = (n) =>
  Math.max(0, Math.min(255, Math.round(Number(n) || 0)))
    .toString(16)
    .padStart(2, "0");
const normalizeHexColor = (hex) => {
  if (typeof hex !== "string") return "";
  let s = hex.trim();
  if (!s) return "";
  if (!s.startsWith("#")) return s;
  let h = s.slice(1);
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  } else if (h.length === 4) {
    h = h
      .slice(0, 3)
      .split("")
      .map((c) => c + c)
      .join("");
  } else if (h.length === 8) {
    h = h.slice(0, 6);
  }
  if (h.length < 6) h = h.padEnd(6, "0");
  return `#${h.toLowerCase()}`;
};
const hexToRgba = (hex, opacity = 1) => {
  const norm = normalizeHexColor(hex);
  if (!norm || !norm.startsWith("#")) return norm || "";
  const h = norm.slice(1);
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${clamp01(opacity)})`;
};
const parseCssColor = (css, fallbackOpacity = 1) => {
  const base = { hex: "#ffffff", opacity: clamp01(fallbackOpacity) };
  if (!css || typeof css !== "string") return base;
  const str = css.trim();
  if (!str) return base;
  if (str.toLowerCase() === "transparent") {
    return { hex: "#000000", opacity: 0 };
  }
  const rgba = /^rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9.]+))?\)$/i.exec(str);
  if (rgba) {
    const r = Number(rgba[1]);
    const g = Number(rgba[2]);
    const b = Number(rgba[3]);
    const a = rgba[4] != null ? parseFloat(rgba[4]) : base.opacity;
    return {
      hex: `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`,
      opacity: clamp01(a),
    };
  }
  if (str.startsWith("#")) {
    const raw = str.slice(1);
    let alpha = base.opacity;
    if (raw.length === 4) {
      alpha = parseInt(raw[3] + raw[3], 16) / 255;
    } else if (raw.length === 8) {
      alpha = parseInt(raw.slice(6, 8), 16) / 255;
    }
    return { hex: normalizeHexColor(str), opacity: clamp01(alpha) };
  }
  return base;
};
const parseBoxShadow = (val) => {
  const fallback = { x: 0, y: 12, blur: 32, spread: 0, color: "#000000", opacity: 0.18 };
  if (!val || typeof val !== "string") return fallback;
  const match =
    /(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+(\d+(?:\.\d+)?)px(?:\s+(-?\d+(?:\.\d+)?)px)?\s+(.+)/.exec(
      val.trim()
    );
  if (!match) return fallback;
  const parsedColor = parseCssColor(match[5], fallback.opacity);
  return {
    x: Number(match[1]),
    y: Number(match[2]),
    blur: Number(match[3]),
    spread: Number(match[4] || 0),
    color: parsedColor.hex || fallback.color,
    opacity: parsedColor.opacity,
  };
};
const parseTextShadow = (val) => {
  const fallback = { x: 0, y: 6, blur: 18, color: "#000000", opacity: 0.25 };
  if (!val || typeof val !== "string") return fallback;
  const match =
    /(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+(\d+(?:\.\d+)?)px\s+(.+)/.exec(
      val.trim()
    );
  if (!match) return fallback;
  const parsedColor = parseCssColor(match[4], fallback.opacity);
  return {
    x: Number(match[1]),
    y: Number(match[2]),
    blur: Number(match[3]),
    color: parsedColor.hex || fallback.color,
    opacity: parsedColor.opacity,
  };
};
const buildBoxShadow = ({ x, y, blur, spread, color, opacity }) =>
  `${x}px ${y}px ${blur}px ${spread}px ${hexToRgba(color, opacity)}`;
const buildTextShadow = ({ x, y, blur, color, opacity }) =>
  `${x}px ${y}px ${blur}px ${hexToRgba(color, opacity)}`;
const isShadowValid = (val) =>
  !val ||
  /-?\d+px\s+-?\d+px/.test(val) ||
  /rgba?\(/i.test(val) ||
  /#/.test(val);
const shadowPresets = [
  { key: "none", label: "None", value: "" },
  { key: "soft", label: "Soft", value: "0 8px 24px rgba(0,0,0,0.12)" },
  { key: "medium", label: "Medium", value: "0 12px 32px rgba(0,0,0,0.18)" },
  { key: "strong", label: "Strong", value: "0 18px 48px rgba(0,0,0,0.24)" },
  { key: "glass", label: "Glass", value: "0 12px 32px rgba(15,23,42,0.28)" },
];
const matchShadowPreset = (val) =>
  shadowPresets.find((preset) => (val || "").trim() === preset.value) || null;
const overlayGradientPresets = [
  { key: "none", label: "None", value: "" },
  {
    key: "subtle-dark",
    label: "Subtle Dark",
    value: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.45) 100%)",
  },
  {
    key: "strong-dark",
    label: "Strong Dark",
    value: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.75) 100%)",
  },
  {
    key: "soft-light",
    label: "Soft Light",
    value: "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 100%)",
  },
  {
    key: "brand-tint",
    label: "Brand Tint",
    value: "linear-gradient(180deg, rgba(59,130,246,0.25) 0%, rgba(37,99,235,0.05) 100%)",
  },
];
const isGradientValid = (val) => !val || /^linear-gradient\(/i.test(val.trim());
const parseGradient = (val) => {
  const fallback = {
    angle: 180,
    stops: [
      { color: "#000000", stop: 15, opacity: 0.35 },
      { color: "#000000", stop: 100, opacity: 0.6 },
    ],
  };
  if (!val || typeof val !== "string") return fallback;
  const match = /linear-gradient\(([^,]+),(.+)\)/i.exec(val);
  if (!match) return fallback;
  const angle = Number(String(match[1]).replace("deg", "").trim());
  const parts = match[2]
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const stops = parts.slice(0, 3).map((p, idx) => {
    const seg = p.split(/\s+/);
    const colorStr = seg[0];
    const stop = seg[1] ? Number(seg[1].replace("%", "")) : idx === 0 ? 0 : 100;
    const parsed = parseCssColor(colorStr, 0.35);
    return {
      color: parsed.hex || "#000000",
      opacity: parsed.opacity,
      stop: Number.isFinite(stop) ? stop : idx === 0 ? 0 : 100,
    };
  });
  return {
    angle: Number.isFinite(angle) ? angle : fallback.angle,
    stops: stops.length >= 2 ? stops : fallback.stops,
  };
};
const buildGradient = (angle, stops) => {
  const parts = stops
    .filter((s) => s.color)
    .map((s) => `${hexToRgba(s.color, s.opacity)} ${s.stop}%`);
  return `linear-gradient(${angle}deg, ${parts.join(", ")})`;
};

/** Debounced local state for a single field (keeps typing snappy). */
function useDebouncedField(externalValue, onCommit, delay = 350) {
  const [local, setLocal] = React.useState(externalValue ?? "");
  const timerRef = React.useRef(null);

  React.useEffect(() => {
    setLocal(externalValue ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalValue]);

  const commit = React.useCallback((v) => onCommit?.(v), [onCommit]);

  const setDebounced = React.useCallback(
    (next) => {
      setLocal(next);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => commit(next), delay);
    },
    [commit, delay]
  );

  const onBlur = React.useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    commit(local);
  }, [commit, local]);

  React.useEffect(() => () => clearTimeout(timerRef.current), []);

  return { local, setLocal, setDebounced, onBlur };
}

/* -----------------------------------------------------------
 * Field subcomponents (safe for hooks)
 * --------------------------------------------------------- */
const FieldSelect = ({ label, value, onCommit, options = [] }) => {
  const { local, setLocal, onBlur } = useDebouncedField(value, onCommit);
  return (
    <FormControl size="small" fullWidth>
      {label && <InputLabel>{label}</InputLabel>}
      <Select
        label={label}
        value={local}
        onChange={(e) => {
          stopBubble(e);
          setLocal(e.target.value);
          onCommit(e.target.value); // immediate commit for selects
        }}
        onClose={onBlur}
        onKeyDown={stopBubble}
      >
        {options.map((opt) => (
          <MenuItem key={String(opt)} value={opt}>
            {String(opt)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

const FieldNumber = ({ label, value, onCommit, field }) => {
  const { local, setLocal, setDebounced, onBlur } = useDebouncedField(
    Number(value ?? 0),
    (nv) => onCommit(clampNum(Number(nv), field))
  );

  const showSlider =
    field.slider ||
    field.render === "slider" ||
    (typeof field.min === "number" && typeof field.max === "number");

  return (
    <Stack spacing={0.75}>
      <TextField
        type="number"
        size="small"
        fullWidth
        helperText={field.help || ""}
        label={label}
        value={local}
        onChange={(e) => {
          const next = e.target.value === "" ? "" : Number(e.target.value);
          setLocal(next);
          setDebounced(clampNum(Number(next), field));
        }}
        onBlur={onBlur}
        onKeyDown={stopBubble}
      />
      {showSlider && typeof local === "number" && (
        <Slider
          value={Number(local) || 0}
          min={typeof field.min === "number" ? field.min : 0}
          max={typeof field.max === "number" ? field.max : 100}
          step={field.step ?? 1}
          valueLabelDisplay="auto"
          onChange={(_, next) => setLocal(next)}
          onChangeCommitted={(_, next) =>
            onCommit(clampNum(Number(next), field))
          }
          onKeyDown={stopBubble}
        />
      )}
    </Stack>
  );
};

const FieldBoolean = ({ label, value, onCommit }) => (
  <FormControlLabel
    control={
      <Switch
        checked={Boolean(value)}
        onChange={(_, chk) => onCommit(chk)}
        onKeyDown={stopBubble}
      />
    }
    label={label}
  />
);

const FieldColor = ({ label, value, onCommit }) => {
  const normalized = normalizeHexColor(value) || "#000000";
  return (
    <TextField
      size="small"
      label={label}
      value={value || ""}
      onChange={(e) => onCommit(e.target.value)}
      fullWidth
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <ButtonBase
              component="label"
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: normalized,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Box
                component="input"
                type="color"
                value={normalized}
                onChange={(e) => onCommit(e.target.value)}
                sx={{ opacity: 0, position: "absolute", width: "100%", height: "100%" }}
              />
            </ButtonBase>
          </InputAdornment>
        ),
      }}
    />
  );
};

const FieldShadow = ({ label, value, onCommit, shadowType = "box" }) => {
  const [builderOpen, setBuilderOpen] = React.useState(false);
  const preset = matchShadowPreset(value)?.key || "custom";
  const parsed =
    shadowType === "text" ? parseTextShadow(value) : parseBoxShadow(value);
  const updateShadow = (patch) => {
    const next = { ...parsed, ...patch };
    const built =
      shadowType === "text" ? buildTextShadow(next) : buildBoxShadow(next);
    onCommit(built);
  };
  return (
    <Stack spacing={1}>
      <FormControl size="small" fullWidth>
        <InputLabel>{label} preset</InputLabel>
        <Select
          label={`${label} preset`}
          value={preset}
          onChange={(e) => {
            const key = e.target.value;
            if (key === "custom") return;
            const presetItem = shadowPresets.find((p) => p.key === key);
            onCommit(presetItem ? presetItem.value : "");
          }}
        >
          {shadowPresets.map((presetItem) => (
            <MenuItem key={presetItem.key} value={presetItem.key}>
              {presetItem.label}
            </MenuItem>
          ))}
          <MenuItem value="custom">Custom</MenuItem>
        </Select>
        <FormHelperText>Pick a preset or customize with the builder.</FormHelperText>
      </FormControl>

      <Button
        size="small"
        variant="outlined"
        onClick={() => setBuilderOpen((prev) => !prev)}
      >
        {builderOpen ? "Hide builder" : "Shadow builder"}
      </Button>

      {builderOpen && (
        <Stack spacing={1}>
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              label="X"
              type="number"
              value={parsed.x}
              onChange={(e) => updateShadow({ x: Number(e.target.value || 0) })}
            />
            <TextField
              size="small"
              label="Y"
              type="number"
              value={parsed.y}
              onChange={(e) => updateShadow({ y: Number(e.target.value || 0) })}
            />
            <TextField
              size="small"
              label="Blur"
              type="number"
              value={parsed.blur}
              onChange={(e) => updateShadow({ blur: Number(e.target.value || 0) })}
            />
            {shadowType === "box" && (
              <TextField
                size="small"
                label="Spread"
                type="number"
                value={parsed.spread}
                onChange={(e) => updateShadow({ spread: Number(e.target.value || 0) })}
              />
            )}
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              label="Shadow color"
              value={parsed.color}
              onChange={(e) => updateShadow({ color: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ButtonBase
                      component="label"
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "divider",
                        bgcolor: normalizeHexColor(parsed.color) || "#000000",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Box
                        component="input"
                        type="color"
                        value={normalizeHexColor(parsed.color) || "#000000"}
                        onChange={(e) => updateShadow({ color: e.target.value })}
                        sx={{ opacity: 0, position: "absolute", width: "100%", height: "100%" }}
                      />
                    </ButtonBase>
                  </InputAdornment>
                ),
              }}
            />
            <Stack spacing={0.5} sx={{ minWidth: 140 }}>
              <Typography variant="caption">Opacity</Typography>
              <Slider
                size="small"
                min={0}
                max={1}
                step={0.05}
                value={parsed.opacity}
                valueLabelDisplay="auto"
                onChange={(_, val) =>
                  typeof val === "number" && updateShadow({ opacity: val })
                }
              />
            </Stack>
          </Stack>
        </Stack>
      )}

      {preset === "custom" && (
        <TextField
          size="small"
          label={`${label} (CSS)`}
          value={value || ""}
          onChange={(e) => onCommit(e.target.value)}
          error={!isShadowValid(value)}
          helperText={
            isShadowValid(value)
              ? "Example: 0 8px 24px rgba(0,0,0,0.12)"
              : "Enter a valid CSS shadow."
          }
          fullWidth
        />
      )}
    </Stack>
  );
};

const FieldGradient = ({ label, value, onCommit }) => {
  const preset =
    overlayGradientPresets.find((p) => p.value === value)?.key || "custom";
  const parsed = parseGradient(value);
  const [angle, setAngle] = React.useState(parsed.angle);
  const [stops, setStops] = React.useState(parsed.stops);
  const isSolid = /^#|^rgba?\(/i.test(String(value || "").trim());
  const [solidMode, setSolidMode] = React.useState(isSolid);

  React.useEffect(() => {
    const next = parseGradient(value);
    setAngle(next.angle);
    setStops(next.stops);
    setSolidMode(/^#|^rgba?\(/i.test(String(value || "").trim()));
  }, [value]);

  const updateStop = (idx, patch) => {
    const next = stops.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    setStops(next);
    onCommit(buildGradient(angle, next));
  };
  const updateAngle = (nextAngle) => {
    setAngle(nextAngle);
    onCommit(buildGradient(nextAngle, stops));
  };

  return (
    <Stack spacing={1}>
      <FormControlLabel
        control={
          <Switch
            checked={solidMode}
            onChange={(_, checked) => {
              setSolidMode(checked);
              if (checked) {
                onCommit(normalizeHexColor(value) || "#000000");
              } else {
                onCommit(buildGradient(angle, stops));
              }
            }}
          />
        }
        label="Solid color"
      />
      {solidMode && (
        <FieldColor
          label={`${label} color`}
          value={normalizeHexColor(value) || "#000000"}
          onCommit={(nv) => onCommit(nv)}
        />
      )}
      {!solidMode && (
        <>
      <FormControl size="small" fullWidth>
        <InputLabel>{label} preset</InputLabel>
        <Select
          label={`${label} preset`}
          value={preset}
          onChange={(e) => {
            const key = e.target.value;
            if (key === "custom") return;
            const presetItem = overlayGradientPresets.find((p) => p.key === key);
            onCommit(presetItem ? presetItem.value : "");
          }}
        >
          {overlayGradientPresets.map((presetItem) => (
            <MenuItem key={presetItem.key} value={presetItem.key}>
              {presetItem.label}
            </MenuItem>
          ))}
          <MenuItem value="custom">Custom</MenuItem>
        </Select>
        <FormHelperText>Choose a preset or build your own gradient.</FormHelperText>
      </FormControl>

      <Stack spacing={1}>
        <Typography variant="caption">Angle</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Slider
            size="small"
            min={0}
            max={360}
            value={angle}
            valueLabelDisplay="auto"
            onChange={(_, val) =>
              typeof val === "number" && updateAngle(val)
            }
            sx={{ flex: 1 }}
          />
          <TextField
            size="small"
            value={angle}
            onChange={(e) => {
              const num = Number(e.target.value);
              if (Number.isFinite(num)) updateAngle(Math.max(0, Math.min(360, num)));
            }}
            sx={{ width: 90 }}
          />
        </Stack>
      </Stack>

      {stops.map((stop, idx) => (
        <Stack key={idx} direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            label={`Stop ${idx + 1}`}
            value={stop.color}
            onChange={(e) => updateStop(idx, { color: e.target.value })}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <ButtonBase
                    component="label"
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "divider",
                      bgcolor: normalizeHexColor(stop.color) || "#000000",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Box
                      component="input"
                      type="color"
                      value={normalizeHexColor(stop.color) || "#000000"}
                      onChange={(e) => updateStop(idx, { color: e.target.value })}
                      sx={{ opacity: 0, position: "absolute", width: "100%", height: "100%" }}
                    />
                  </ButtonBase>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            size="small"
            label="%"
            value={stop.stop}
            onChange={(e) =>
              updateStop(idx, {
                stop: Math.max(0, Math.min(100, Number(e.target.value || 0))),
              })
            }
            sx={{ width: 80 }}
          />
          <Stack spacing={0.5} sx={{ minWidth: 120 }}>
            <Typography variant="caption">Opacity</Typography>
            <Slider
              size="small"
              min={0}
              max={1}
              step={0.05}
              value={stop.opacity}
              valueLabelDisplay="auto"
              onChange={(_, val) =>
                typeof val === "number" && updateStop(idx, { opacity: val })
              }
            />
          </Stack>
        </Stack>
      ))}

      {preset === "custom" && (
        <TextField
          size="small"
          label={`${label} (CSS)`}
          value={value || ""}
          onChange={(e) => onCommit(e.target.value)}
          error={!isGradientValid(value)}
          helperText={
            isGradientValid(value)
              ? "Example: linear-gradient(180deg, rgba(0,0,0,.15), rgba(0,0,0,.6))"
              : "Enter a valid linear-gradient(...) string."
          }
          fullWidth
        />
      )}
        </>
      )}
    </Stack>
  );
};

const FieldBorder = ({ label, value, onCommit }) => {
  const parsed = React.useMemo(() => {
    if (!value || typeof value !== "string") {
      return { width: 1, style: "solid", color: "#ffffff" };
    }
    const parts = value.trim().split(/\s+/);
    const width = Number(String(parts[0] || "").replace("px", "")) || 1;
    const style = parts[1] || "solid";
    const color = parts.slice(2).join(" ") || "#ffffff";
    return {
      width,
      style,
      color: normalizeHexColor(color) || color || "#ffffff",
    };
  }, [value]);

  const updateBorder = (patch) => {
    const next = { ...parsed, ...patch };
    const css = `${next.width}px ${next.style} ${next.color}`;
    onCommit(css);
  };

  return (
    <Stack spacing={1}>
      <Typography variant="caption">{label}</Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <TextField
          size="small"
          label="Width"
          type="number"
          value={parsed.width}
          onChange={(e) => updateBorder({ width: Number(e.target.value || 1) })}
          sx={{ width: 90 }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Style</InputLabel>
          <Select
            label="Style"
            value={parsed.style}
            onChange={(e) => updateBorder({ style: e.target.value })}
          >
            {["solid", "dashed", "dotted", "double"].map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          size="small"
          label="Color"
          value={parsed.color}
          onChange={(e) => updateBorder({ color: e.target.value })}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <ButtonBase
                  component="label"
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: normalizeHexColor(parsed.color) || "#000000",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Box
                    component="input"
                    type="color"
                    value={normalizeHexColor(parsed.color) || "#000000"}
                    onChange={(e) => updateBorder({ color: e.target.value })}
                    sx={{ opacity: 0, position: "absolute", width: "100%", height: "100%" }}
                  />
                </ButtonBase>
              </InputAdornment>
            ),
          }}
        />
      </Stack>
      <TextField
        size="small"
        label={`${label} (CSS)`}
        value={value || ""}
        onChange={(e) => onCommit(e.target.value)}
        helperText="Example: 1px solid rgba(255,255,255,0.35)"
        fullWidth
      />
    </Stack>
  );
};

const FieldImage = ({ label, value, onCommit, companyId }) => (
  <ImageField
    label={label}
    value={value || ""}
    onChange={(url) => onCommit(url)}
    companyId={companyId}
  />
);

const FieldVideo = ({ label, value, onCommit, companyId }) => (
  <VideoField
    label={label}
    value={value || ""}
    onChange={(url) => onCommit(url)}
    companyId={companyId}
  />
);

/** Array of images that reuses ImageField for uploads */
const FieldImageArray = ({ label, value = [], onCommit, companyId }) => {
  const list = Array.isArray(value) ? value : [];
  return (
    <Stack spacing={1}>
      {label && (
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {label}
        </Typography>
      )}

      <Stack spacing={1}>
        {list.map((url, idx) => (
          <Box
            key={idx}
            sx={{ p: 1, border: "1px solid", borderColor: "divider", borderRadius: 1 }}
          >
            <ImageField
              label={`Image ${idx + 1}`}
              value={url || ""}
              onChange={(newUrl) => {
                const next = [...list];
                if (newUrl) next[idx] = newUrl;
                else next.splice(idx, 1);
                onCommit(next);
              }}
              companyId={companyId}
            />
            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
              <Button
                size="small"
                onClick={() => {
                  const next = [...list];
                  next.splice(idx, 1);
                  onCommit(next);
                }}
              >
                Remove
              </Button>
            </Stack>
          </Box>
        ))}
      </Stack>

      <Button
        size="small"
        variant="outlined"
        onClick={() => onCommit([...list, ""])}
      >
        Add image
      </Button>
    </Stack>
  );
};

// Rich editor wrapper: inline vs block, with HTML normalization on save
const FieldRich = ({ label, value, onCommit, inline, align }) => {
  const editorRef = React.useRef(null);

  const initialAlign = React.useMemo(
    () => extractTextAlign(value, align || "left"),
    [value, align]
  );

  const [currentAlign, setCurrentAlign] = React.useState(initialAlign);

  const commitRichHtml = React.useCallback(
    (html) => {
      if (inline) {
        const normalized = normalizeInlineHtml(html);
        onCommit(applyInlineAlignWrapper(normalized, currentAlign || align || "left"));
      } else {
        onCommit(normalizeBlockHtml(html));
      }
    },
    [inline, currentAlign, align, onCommit]
  );

  const { local, setLocal, setDebounced, onBlur } = useDebouncedField(
    String(value || ""),
    commitRichHtml,
    500
  );

  React.useEffect(() => {
    setCurrentAlign(extractTextAlign(local, align || "left"));
  }, [local, align]);

  React.useEffect(() => {
    setCurrentAlign(extractTextAlign(value, align || "left"));
  }, [value, align]);

  const handleEditorReady = React.useCallback((instance) => {
    editorRef.current = instance;
  }, []);

  const applyAlign = React.useCallback(
    (nextAlign) => {
      setCurrentAlign(nextAlign);
      const editor = editorRef.current;
      if (!editor) return;
      editor.chain().focus().setTextAlign(nextAlign).run();
      const html = editor.getHTML();
      setLocal(html);
      setDebounced(html);
    },
    [setLocal, setDebounced]
  );

  const handleAlignChange = (_, next) => {
    if (!next) return;
    applyAlign(next);
  };

  return (
    <Stack spacing={0.5}>
      {label && (
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          {label}
        </Typography>
      )}
      <EnterpriseRichTextEditor
        value={local || ""}
        align={currentAlign}
        onReady={handleEditorReady}
        onChange={(html) => {
          setLocal(html);
          setDebounced(html);
        }}
        alignEnabled
        onBlur={() => {
          onBlur();
        }}
        onKeyDown={stopBubble}
      />
      <ToggleButtonGroup
        size="small"
        exclusive
        value={currentAlign}
        onChange={handleAlignChange}
        sx={{ alignSelf: "flex-start", mt: 1 }}
      >
        <ToggleButton value="left">
          <FormatAlignLeftIcon fontSize="small" />
        </ToggleButton>
        <ToggleButton value="center">
          <FormatAlignCenterIcon fontSize="small" />
        </ToggleButton>
        <ToggleButton value="right">
          <FormatAlignRightIcon fontSize="small" />
        </ToggleButton>
        <ToggleButton value="justify">
          <FormatAlignJustifyIcon fontSize="small" />
        </ToggleButton>
      </ToggleButtonGroup>
    </Stack>
  );
};

const FieldArrayOfStrings = ({ label, value, onCommit }) => {
  const { t } = useTranslation();
  const arr = Array.isArray(value) ? value : [];
  return (
    <Stack spacing={1}>
      <Typography variant="caption">{label}</Typography>
      {arr.map((item, idx) => (
        <Stack key={idx} direction="row" spacing={1}>
          <TextField
            size="small"
            fullWidth
            value={item}
            onChange={(e) => {
              const next = [...arr];
              next[idx] = e.target.value;
              onCommit(next);
            }}
            onKeyDown={stopBubble}
          />
          <IconButton
            onClick={() => {
              const next = [...arr];
              next.splice(idx, 1);
              onCommit(next);
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      ))}
      <Button
        size="small"
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={() => onCommit([...arr, ""])}
      >
        {t("manager.visualBuilder.schemas.array.addValue")}
      </Button>
    </Stack>
  );
};

const FieldObjectArray = ({ label, value, onCommit, fields = [], companyId }) => {
  const { t } = useTranslation();
  const arr = Array.isArray(value) ? value : [];
  return (
    <Stack spacing={1}>
      <Typography variant="caption">{label}</Typography>
      {arr.map((row, i) => (
        <Box
          key={i}
          sx={{ p: 1, border: "1px solid", borderColor: "divider", borderRadius: 1 }}
        >
          <Stack spacing={1}>
            {fields.map((sub) => {
              const rk = sub.name;
              const subVal = row?.[rk];

              const updateRow = (nv) => {
                const next = [...arr];
                next[i] = { ...(next[i] || {}), [rk]: nv };
                onCommit(next);
              };

              if (sub.type === "boolean") {
                return (
                  <FormControlLabel
                    key={rk}
                    control={
                      <Switch
                        checked={Boolean(subVal)}
                        onChange={(_, chk) => updateRow(chk)}
                        onKeyDown={stopBubble}
                      />
                    }
                    label={sub.label || rk}
                  />
                );
              }

              if (sub.type === "number") {
                return (
                  <TextField
                    key={rk}
                    size="small"
                    type="number"
                    label={sub.label || rk}
                    value={subVal ?? ""}
                    onChange={(e) => {
                      const raw = Number(e.target.value);
                      updateRow(clampNum(raw, sub));
                    }}
                    fullWidth
                    onKeyDown={stopBubble}
                  />
                );
              }

              if (sub.type === "image") {
                return (
                  <ImageField
                    key={rk}
                    label={sub.label || rk}
                    value={subVal || ""}
                    onChange={(url) => updateRow(url)}
                    companyId={companyId}
                  />
                );
              }

              if (sub.type === "video") {
                return (
                  <VideoField
                    key={rk}
                    label={sub.label || rk}
                    value={subVal || ""}
                    onChange={(url) => updateRow(url)}
                    companyId={companyId}
                  />
                );
              }

              return (
                <TextField
                  key={rk}
                  size="small"
                  type="text"
                  label={sub.label || rk}
                  value={subVal ?? ""}
                  onChange={(e) => updateRow(e.target.value)}
                  fullWidth
                  onKeyDown={stopBubble}
                />
              );
            })}
            <Stack direction="row" spacing={1}>
              <IconButton
                onClick={() => {
                  const next = [...arr];
                  next.splice(i, 1);
                  onCommit(next);
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
        </Box>
      ))}
      <Button
        size="small"
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={() => onCommit([...arr, {}])}
      >
        {t("manager.visualBuilder.schemas.array.addItem")}
      </Button>
    </Stack>
  );
};

const FieldMultiline = ({ label, value, onCommit, minRows = 3, help }) => {
  const { local, setLocal, setDebounced, onBlur } = useDebouncedField(
    String(value || ""),
    onCommit
  );
  return (
    <TextField
      label={label}
      value={local}
      onChange={(e) => {
        setLocal(e.target.value);
        setDebounced(e.target.value);
      }}
      onBlur={onBlur}
      multiline
      minRows={minRows}
      size="small"
      fullWidth
      helperText={help || ""}
      onKeyDown={stopBubble}
    />
  );
};

// Plain string field that strips any pasted HTML globally
const FieldString = ({ label, value, onCommit, help }) => {
  const { local, setLocal, setDebounced, onBlur } = useDebouncedField(
    stripHtml(String(value ?? "")),
    (nv) => onCommit(stripHtml(nv))
  );
  return (
    <TextField
      label={label}
      value={local}
      onChange={(e) => {
        const cleaned = stripHtml(e.target.value);
        setLocal(cleaned);
        setDebounced(cleaned);
      }}
      onBlur={onBlur}
      size="small"
      fullWidth
      helperText={help || ""}
      onKeyDown={stopBubble}
    />
  );
};

/* -----------------------------------------------------------
 * SchemaInspector
 * --------------------------------------------------------- */
export default function SchemaInspector({ schema, value = {}, onChange, companyId }) {
  const { t } = useTranslation();
  const v = value || {};
  const setWhole = (k, val) => onChange({ ...v, [k]: val });

  return (
    <Box>
      <Stack spacing={1.25}>
        {(schema?.fields || []).map((f) => {
          const key = f.name;
          const label = f.labelKey ? t(f.labelKey) : (f.label || key);
          const val = v[key] ?? f.default ?? "";

          // SELECT (enum/options)
          if (
            f.type === "select" ||
            (f.type === "string" && (f.enum?.length || f.options?.length))
          ) {
            const options = f.options || f.enum || [];
            return (
              <FieldSelect
                key={key}
                label={label}
                value={val}
                options={options}
                onCommit={(nv) => setWhole(key, nv)}
              />
            );
          }

          // SLIDER (explicit)
          if (f.type === "slider") {
            const valNum =
              typeof val === "number"
                ? val
                : typeof f.min === "number"
                ? f.min
                : 0;
            return (
              <Box key={key} sx={{ px: 0.5, py: 1 }}>
                <Typography variant="caption" sx={{ display: "block", mb: 0.5 }}>
                  {label} — {Number(valNum).toFixed(2)}
                </Typography>
                <Slider
                  size="small"
                  value={valNum}
                  min={typeof f.min === "number" ? f.min : 0}
                  max={typeof f.max === "number" ? f.max : 1}
                  step={typeof f.step === "number" ? f.step : 0.01}
                  onChange={(_, vNew) => setWhole(key, Number(vNew))}
                  valueLabelDisplay="auto"
                />
                {f.help && (
                  <Typography
                    variant="caption"
                    sx={{ display: "block", mt: 0.5, color: "text.secondary" }}
                  >
                    {f.help}
                  </Typography>
                )}
              </Box>
            );
          }

          // NUMBER (+ slider if min/max or slider:true)
          if (f.type === "number") {
            return (
              <FieldNumber
                key={key}
                label={label}
                value={val}
                onCommit={(nv) => setWhole(key, nv)}
                field={f}
              />
            );
          }

          // BOOLEAN
          if (f.type === "boolean") {
            return (
              <FieldBoolean
                key={key}
                label={label}
                value={val}
                onCommit={(nv) => setWhole(key, nv)}
              />
            );
          }

          // COLOR (explicit)
          if (f.type === "color") {
            return (
              <FieldColor
                key={key}
                label={label}
                value={val}
                onCommit={(nv) => setWhole(key, nv)}
              />
            );
          }

          // IMAGE
          if (f.type === "image") {
            return (
              <FieldImage
                key={key}
                label={label}
                value={val}
                onCommit={(nv) => setWhole(key, nv)}
                companyId={companyId}
              />
            );
          }

          if (f.type === "video") {
            return (
              <FieldVideo
                key={key}
                label={label}
                value={val}
                onCommit={(nv) => setWhole(key, nv)}
                companyId={companyId}
              />
            );
          }

          // IMAGE ARRAY (string[] but rendered with uploader)
          if (
            (f.type === "arrayOfStrings" && looksLikeImageArray(f)) ||
            f.type === "imageArray"
          ) {
            return (
              <FieldImageArray
                key={key}
                label={label}
                value={val}
                onCommit={(nv) => setWhole(key, nv)}
                companyId={companyId}
              />
            );
          }

          // RICH (inline vs block)
          if (f.type === "richtext" || f.type === "richinline") {
            return (
              <FieldRich
                key={key}
                label={label}
                value={val}
                onCommit={(nv) => setWhole(key, nv)}
                inline={f.type === "richinline"}
                align={v.align || "left"}
              />
            );
          }

          // ARRAY OF STRINGS (generic text array)
          if (f.type === "arrayOfStrings") {
            return (
              <FieldArrayOfStrings
                key={key}
                label={label}
                value={val}
                onCommit={(nv) => setWhole(key, nv)}
              />
            );
          }

          // OBJECT ARRAY
          if (f.type === "objectArray") {
            return (
              <FieldObjectArray
                key={key}
                label={label}
                value={val}
                fields={f.fields || []}
                onCommit={(nv) => setWhole(key, nv)}
                companyId={companyId}
              />
            );
          }

          // MULTILINE
          if (f.type === "text") {
            if (f.ui === "gradient") {
              return (
                <FieldGradient
                  key={key}
                  label={label}
                  value={val}
                  onCommit={(nv) => setWhole(key, nv)}
                />
              );
            }
            return (
              <FieldMultiline
                key={key}
                label={label}
                value={val}
                minRows={f.minRows || 3}
                help={f.help}
                onCommit={(nv) => setWhole(key, nv)}
              />
            );
          }

          // STRING (default) — strips HTML globally, but auto-detect colors
          if (f.type === "string") {
            if (f.ui === "border") {
              return (
                <FieldBorder
                  key={key}
                  label={label}
                  value={val}
                  onCommit={(nv) => setWhole(key, nv)}
                />
              );
            }
            if (f.ui === "color") {
              return (
                <FieldColor
                  key={key}
                  label={label}
                  value={val}
                  onCommit={(nv) => setWhole(key, nv)}
                />
              );
            }
            if (f.ui === "shadow") {
              return (
                <FieldShadow
                  key={key}
                  label={label}
                  value={val}
                  onCommit={(nv) => setWhole(key, nv)}
                  shadowType={f.shadowType || "box"}
                />
              );
            }
            if (f.ui === "gradient") {
              return (
                <FieldGradient
                  key={key}
                  label={label}
                  value={val}
                  onCommit={(nv) => setWhole(key, nv)}
                />
              );
            }
            if (looksLikeColor(f, val)) {
              return (
                <FieldColor
                  key={key}
                  label={label}
                  value={val}
                  onCommit={(nv) => setWhole(key, nv)}
                />
              );
            }
            return (
              <FieldString
                key={key}
                label={label}
                value={val}
                help={f.help}
                onCommit={(nv) => setWhole(key, nv)}
              />
            );
          }

          // STRING (fallback when type is omitted) — strips HTML globally
          return (
            <FieldString
              key={key}
              label={label}
              value={val}
              help={f.help}
              onCommit={(nv) => setWhole(key, nv)}
            />
          );
        })}
      </Stack>

      {schema?.note && (
        <>
          <Divider sx={{ my: 1.5 }} />
          <Typography color="text.secondary" variant="caption">
            {schema.noteKey ? t(schema.noteKey) : t(schema.note || "", { defaultValue: schema.note || "" })}
          </Typography>
        </>
      )}
    </Box>
  );
}
