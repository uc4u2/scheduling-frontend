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
  FormControl,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import FormatAlignCenterIcon from "@mui/icons-material/FormatAlignCenter";
import FormatAlignRightIcon from "@mui/icons-material/FormatAlignRight";
import FormatAlignJustifyIcon from "@mui/icons-material/FormatAlignJustify";
import { ImageField } from "./BuilderInspectorParts";
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

const FieldColor = ({ label, value, onCommit }) => (
  <Stack spacing={0.5}>
    <Typography variant="caption">{label}</Typography>
    <input
      type="color"
      value={value || "#000000"}
      onChange={(e) => onCommit(e.target.value)}
      onKeyDown={stopBubble}
      style={{
        width: 48,
        height: 32,
        border: "1px solid #ddd",
        borderRadius: 6,
      }}
    />
  </Stack>
);

const FieldImage = ({ label, value, onCommit, companyId }) => (
  <ImageField
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
  const { local, setLocal, setDebounced, onBlur } = useDebouncedField(
    String(value || ""),
    (html) => onCommit(inline ? normalizeInlineHtml(html) : normalizeBlockHtml(html)),
    500
  );

  const [currentAlign, setCurrentAlign] = React.useState(() =>
    extractTextAlign(value, align || "left")
  );

  React.useEffect(() => {
    setCurrentAlign(extractTextAlign(local, align || "left"));
  }, [local, align]);

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
        alignEnabled={!inline}
        onBlur={() => {
          const normalized = inline
            ? normalizeInlineHtml(local)
            : normalizeBlockHtml(local);
          onCommit(normalized);
          onBlur();
        }}
        onKeyDown={stopBubble}
      />
      {!inline && (
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
      )}
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
