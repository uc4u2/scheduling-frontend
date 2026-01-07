// src/components/website/BuilderInspectorParts.js
import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { website } from "../../utils/api";
import { useTranslation } from "react-i18next";

/* ---------- NEW: Raw JSON props editor that actually writes back ---------- */
// A tiny editor that writes back into section.props
function RawPropsEditor({ section, onChangeProps }) {
  const { t } = useTranslation();
  const initial = JSON.stringify(section?.props ?? {}, null, 2);
  const [text, setText] = useState(initial);
  const [error, setError] = useState("");

  // If the selection changes, reset the text
  useEffect(() => {
    setText(JSON.stringify(section?.props ?? {}, null, 2));
    setError("");
  }, [section?.type, section?.id]);

  const apply = () => {
    try {
      const parsed = JSON.parse(text || "{}");
      setError("");
      onChangeProps?.(parsed); // â† writes into the builder state
    } catch (e) {
      setError(e.message || t("manager.visualBuilder.inspector.rawProps.invalid"));
    }
  };

  return (
    <Stack spacing={1.25}>
      <TextField
        label={t("manager.visualBuilder.inspector.rawProps.label")}
        value={text}
        onChange={(e) => setText(e.target.value)}
        multiline
        minRows={8}
        fullWidth
        size="small"
        sx={{
          mt: 0.5,
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        }}
      />
      {error && <Alert severity="error">{error}</Alert>}
      <Stack direction="row" spacing={1}>
        <Button variant="contained" onClick={apply}>{t("manager.visualBuilder.inspector.rawProps.apply")}</Button>
        <Button
          variant="outlined"
          onClick={() => setText(JSON.stringify(section?.props ?? {}, null, 2))}
        >
          {t("manager.visualBuilder.inspector.rawProps.reset")}
        </Button>
      </Stack>
    </Stack>
  );
}

/* -------------------- Common section-level fields (id, bg, padding, width) -------------------- */
function CommonFields({ block, onChangeRoot }) {
  const { t } = useTranslation();
  const sx = block.sx || {};
  return (
    <Stack spacing={1.25} sx={{ p: 2, pt: 0 }}>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {t("manager.visualBuilder.inspector.common.title")}
      </Typography>

      <TextField
        size="small"
        label={t("manager.visualBuilder.inspector.common.sectionId")}
        value={block.id || ""}
        onChange={(e) =>
          onChangeRoot({ ...block, id: e.target.value || undefined })
        }
        helperText={t("manager.visualBuilder.inspector.common.sectionIdHint")}
      />

      <TextField
        size="small"
        type="color"
        label={t("manager.visualBuilder.inspector.common.backgroundColor")}
        value={sx.bgcolor || sx.backgroundColor || "#ffffff"}
        onChange={(e) => onChangeRoot({ ...block, sx: { ...sx, bgcolor: e.target.value } })}
      />

      <Stack direction="row" spacing={1}>
        <TextField
          size="small"
          label={t("manager.visualBuilder.inspector.common.paddingY")}
          type="number"
          value={sx.py ?? 40}
          onChange={(e) =>
            onChangeRoot({
              ...block,
              sx: { ...sx, py: Number(e.target.value || 0) },
            })
          }
        />
        <TextField
          size="small"
          label={t("manager.visualBuilder.inspector.common.maxWidth")}
          value={sx.maxWidth || "lg"}
          onChange={(e) =>
            onChangeRoot({
              ...block,
              sx: { ...sx, maxWidth: e.target.value },
            })
          }
          helperText={t("manager.visualBuilder.inspector.common.maxWidthHint")}
        />
      </Stack>
    </Stack>
  );
}

/* -------------------- Reusable media field -------------------- */
// ...imports stay the same

/* -------------------- Reusable media field -------------------- */
export function ImageField({ label, value, onChange, companyId }) {
  const { t } = useTranslation();
  const [dragOver, setDragOver] = useState(false);
  const [inputUrl, setInputUrl] = useState(value || "");
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setInputUrl(value || "");
    setBroken(false);
  }, [value]);

  // Ensure we always return an absolute URL for previews & CSS backgrounds
  const toAbsoluteUrl = (maybeUrl) => {
    if (!maybeUrl) return "";
    try {
      // Already absolute?
      // eslint-disable-next-line no-new
      new URL(maybeUrl);
      return maybeUrl;
    } catch {
      // Make absolute against API base (if exposed) or window origin
      const base = website?.baseUrl || window.location.origin;
      return new URL(maybeUrl.replace(/^\/+/, "/"), base).href;
    }
  };

  const applyUrl = (u) => {
    const abs = toAbsoluteUrl((u || "").trim());
    setInputUrl(abs);
    setBroken(false);
    onChange?.(abs);
  };

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    const MAX_BYTES = 5 * 1024 * 1024; // 5MB guard to avoid backend 413
    if (files[0].size > MAX_BYTES) {
      alert("Image is too large. Max size 5MB. Please upload a smaller JPG/PNG/WebP.");
      return;
    }
    try {
      const res = await website.uploadMedia(files[0], { companyId });
      const item = res?.items?.[0];

      // Prefer a CDN/variant URL, then item.url, then build from stored_name
      const raw =
        item?.url ||
        item?.url_public ||
        (item?.variants?.find((v) => v?.url)?.url) ||
        (item?.stored_name
          ? website.mediaFileUrl(companyId, item.stored_name)
          : "");

      applyUrl(raw);
    } catch (e) {
      console.error("upload failed", e);
      if (e?.response?.status === 413) {
        alert("Image is too large. Max size 5MB. Please upload a smaller JPG/PNG/WebP.");
      } else {
        alert(t("manager.visualBuilder.inspector.imageField.uploadFailed"));
      }
    }
  };

  return (
    <Box
      sx={{
        border: "1px dashed",
        borderColor: dragOver ? "primary.main" : "divider",
        borderRadius: 1,
        p: 1.25,
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <Typography variant="caption" sx={{ display: "block", mb: 0.75 }}>
        {label}
      </Typography>

      {/* URL input so you can paste external images too */}
      <TextField
        size="small"
        placeholder={t("manager.visualBuilder.inspector.imageField.placeholder")}
        value={inputUrl}
        onChange={(e) => setInputUrl(e.target.value)}
        onBlur={() => applyUrl(inputUrl)}
        fullWidth
        sx={{ mb: 1 }}
      />

      {inputUrl ? (
        <img
          src={inputUrl}
          alt="selected"
          onError={() => setBroken(true)}
          onLoad={() => setBroken(false)}
          style={{
            width: "100%",
            maxHeight: 160,
            objectFit: "cover",
            borderRadius: 6,
          }}
        />
      ) : (
        <Box
          sx={{
            height: 120,
            bgcolor: "background.default",
            borderRadius: 1,
            display: "grid",
            placeItems: "center",
            color: "text.secondary",
            fontSize: 13,
          }}
        >
          {t("manager.visualBuilder.inspector.imageField.drop")}
        </Box>
      )}

      {broken && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
          {t("manager.visualBuilder.inspector.imageField.error")}
        </Typography>
      )}

      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
        <Button size="small" variant="outlined" component="label">
          {t("manager.visualBuilder.inspector.imageField.upload")}
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => handleFiles(e.target.files)}
          />
        </Button>
        {inputUrl && (
          <Button size="small" onClick={() => applyUrl("")}>
            {t("manager.visualBuilder.inspector.imageField.clear")}
          </Button>
        )}
      </Stack>
    </Box>
  );
}

/* -------------------- (Legacy) Generic JSON editor fallback -------------------- */
/* Kept for reference; RawPropsEditor is used instead in all call sites. */
export function JsonPropsEditor({ value, onChange }) {
  const { t } = useTranslation();
  const [text, setText] = useState(() => JSON.stringify(value ?? {}, null, 2));
  useEffect(() => {
    setText(JSON.stringify(value ?? {}, null, 2));
  }, [value]);
  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {t("manager.visualBuilder.inspector.rawProps.label")}
      </Typography>
      <TextField
        fullWidth
        multiline
        minRows={8}
        value={text}
        onChange={(e) => setText(e.target.value)}
        sx={{
          mt: 0.5,
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        }}
      />
      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
        <Button
          size="small"
          variant="outlined"
          onClick={() => setText(JSON.stringify(value ?? {}, null, 2))}
        >
          {t("manager.visualBuilder.inspector.rawProps.reset")}
        </Button>
        <Button
          size="small"
          variant="contained"
          onClick={() => {
            try {
              const parsed = JSON.parse(text);
              onChange(parsed);
            } catch {
              alert(t("manager.visualBuilder.inspector.rawProps.invalid"));
            }
          }}
        >{t("manager.visualBuilder.inspector.rawProps.apply")}
        </Button>
      </Stack>
    </Box>
  );
}

/* -------------------- Section inspector (advanced controls) -------------------- */
export default function SectionInspector({
  block,
  onChangeProps,
  onChangeProp,
  onChangeRoot, // NEW: for root-level fields (id, sx, etc.)
  companyId,
}) {
  const { t } = useTranslation();
  if (!block) {
    return (
      <Box sx={{ p: 2, color: "text.secondary" }}>
        <Typography variant="subtitle2">{t("manager.visualBuilder.inspector.emptySelection")}</Typography>
      </Box>
    );
  }
  const type = block.type;
  const p = block.props || {};

  // Fallback for onChangeRoot if not provided (preserves backwards compatibility)
  const applyRoot = (nb) => {
    if (onChangeRoot) return onChangeRoot(nb);
    // Back-compat shim: if caller didn't provide onChangeRoot, try to stuff full block back.
    // If nb includes props, forward just props; else pass the whole block-ish object.
    return onChangeProps(nb?.props ? nb.props : { ...block, ...nb });
  };

  const Header = ({ title }) => (
    <Typography variant="subtitle2" sx={{ p: 2, pb: 1, fontWeight: 700 }}>
      {title}
    </Typography>
  );

  switch (type) {
    case "hero":
      return (
        <Stack spacing={1.25} sx={{ p: 2 }}>
          <Header title="Hero" />
          <TextField
            label="Heading"
            size="small"
            value={p.heading || ""}
            onChange={(e) => onChangeProp("heading", e.target.value)}
            fullWidth
          />
          <TextField
            label="Subheading"
            size="small"
            value={p.subheading || ""}
            onChange={(e) => onChangeProp("subheading", e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
          <TextField
            label="Button Text"
            size="small"
            value={p.ctaText || ""}
            onChange={(e) => onChangeProp("ctaText", e.target.value)}
            fullWidth
          />
          <TextField
            label="Button Link"
            size="small"
            value={p.ctaLink || ""}
            onChange={(e) => onChangeProp("ctaLink", e.target.value)}
            fullWidth
            helperText="Use ?page=services-classic, /reviews or full https:// link"
          />
          
           
   // inside case "hero" in SectionInspector (unchanged around it)
<ImageField
  label="Background image"
  value={p.backgroundUrl || p.image || ""} // reads either for back-compat
  onChange={(url) =>
    onChangeProps({ backgroundUrl: url, image: undefined }) // write backgroundUrl only
  }
  companyId={companyId}
/>

          <Divider sx={{ my: 1 }} />
          <RawPropsEditor section={block} onChangeProps={(np) => onChangeProps(np)} />

          {/* Common section-level layout controls */}
          <Divider sx={{ my: 1 }} />
          <CommonFields block={block} onChangeRoot={applyRoot} />
        </Stack>
      );

    case "text":
      return (
        <Stack spacing={1.25} sx={{ p: 2 }}>
          <Header title="Text" />
          <TextField
            label="Title"
            size="small"
            value={p.title || ""}
            onChange={(e) => onChangeProp("title", e.target.value)}
            fullWidth
          />
          <TextField
            label="Body"
            size="small"
            value={p.body || ""}
            onChange={(e) => onChangeProp("body", e.target.value)}
            fullWidth
            multiline
            minRows={4}
          />
          <Divider sx={{ my: 1 }} />
          <RawPropsEditor section={block} onChangeProps={(np) => onChangeProps(np)} />

          <Divider sx={{ my: 1 }} />
          <CommonFields block={block} onChangeRoot={applyRoot} />
        </Stack>
      );

    case "gallery":
      {
        const normalizeItem = (item) => {
          if (typeof item === "string") return { url: item, alt: "" };
          return item || {};
        };
        const toValue = (item) => item?.assetKey || item?.url || item?.src || "";
        return (
          <Stack spacing={1.25} sx={{ p: 2 }}>
            <Header title="Gallery" />
            <TextField
              label="Title"
              size="small"
              value={p.title || ""}
              onChange={(e) => onChangeProp("title", e.target.value)}
              fullWidth
            />
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2">Layout</Typography>
            <Stack direction="row" spacing={1}>
              <TextField
                label="Columns (xs)"
                size="small"
                type="number"
                value={p.columnsXs ?? 2}
                onChange={(e) => onChangeProp("columnsXs", Number(e.target.value))}
                inputProps={{ min: 1, max: 6 }}
                fullWidth
              />
              <TextField
                label="Columns (sm)"
                size="small"
                type="number"
                value={p.columnsSm ?? 2}
                onChange={(e) => onChangeProp("columnsSm", Number(e.target.value))}
                inputProps={{ min: 1, max: 6 }}
                fullWidth
              />
              <TextField
                label="Columns (md)"
                size="small"
                type="number"
                value={p.columnsMd ?? 3}
                onChange={(e) => onChangeProp("columnsMd", Number(e.target.value))}
                inputProps={{ min: 1, max: 6 }}
                fullWidth
              />
            </Stack>
            <TextField
              label="Tile gap (px)"
              size="small"
              type="number"
              value={p.gap ?? 18}
              onChange={(e) => onChangeProp("gap", Number(e.target.value))}
              inputProps={{ min: 0, max: 64 }}
              fullWidth
            />
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2">Tile</Typography>
            <TextField
              label="Aspect ratio"
              size="small"
              value={p.tileAspectRatio || "4/5"}
              onChange={(e) => onChangeProp("tileAspectRatio", e.target.value)}
              fullWidth
            />
            <Stack direction="row" spacing={1}>
              <TextField
                label="Border radius (px)"
                size="small"
                type="number"
                value={p.tileBorderRadius ?? 4}
                onChange={(e) => onChangeProp("tileBorderRadius", Number(e.target.value))}
                inputProps={{ min: 0, max: 64 }}
                fullWidth
              />
              <TextField
                label="Border (CSS)"
                size="small"
                value={p.tileBorder || "1px solid rgba(255,255,255,0.35)"}
                onChange={(e) => onChangeProp("tileBorder", e.target.value)}
                fullWidth
              />
            </Stack>
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(p.tileHoverLift ?? true)}
                  onChange={(_, chk) => onChangeProp("tileHoverLift", chk)}
                />
              }
              label="Hover lift"
            />
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2">Lightbox</Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(p.lightboxEnabled ?? true)}
                  onChange={(_, chk) => onChangeProp("lightboxEnabled", chk)}
                />
              }
              label="Enable lightbox"
            />
            <Stack direction="row" spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(p.lightboxLoop ?? true)}
                    onChange={(_, chk) => onChangeProp("lightboxLoop", chk)}
                  />
                }
                label="Loop"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(p.lightboxShowArrows ?? true)}
                    onChange={(_, chk) => onChangeProp("lightboxShowArrows", chk)}
                  />
                }
                label="Arrows"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(p.lightboxCloseOnBackdrop ?? true)}
                    onChange={(_, chk) => onChangeProp("lightboxCloseOnBackdrop", chk)}
                  />
                }
                label="Close on backdrop"
              />
            </Stack>
            <Typography variant="caption">Images</Typography>
            <Stack spacing={1}>
              {(p.images || []).map((raw, idx) => {
                const item = normalizeItem(raw);
              return (
              <Stack key={idx} spacing={0.5} sx={{ p: 1, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                <ImageField
                  label={`Image ${idx + 1}`}
                  value={toValue(item)}
                  onChange={(newUrl) => {
                    const next = [...(p.images || [])];
                    if (newUrl) {
                      next[idx] = { ...item, url: newUrl, assetKey: item?.assetKey && !String(newUrl || "").startsWith("http") ? newUrl : item?.assetKey };
                    } else {
                      next.splice(idx, 1);
                    }
                    onChangeProp("images", next);
                  }}
                  companyId={companyId}
                />
                <TextField
                  label="Alt text"
                  size="small"
                  value={item?.alt || ""}
                  onChange={(e) => {
                    const next = [...(p.images || [])];
                    next[idx] = { ...item, alt: e.target.value };
                    onChangeProp("images", next);
                  }}
                  fullWidth
                />
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    onClick={() => {
                      const next = [...(p.images || [])];
                      next.splice(idx, 1);
                      onChangeProp("images", next);
                    }}
                  >
                    Remove
                  </Button>
                </Stack>
              </Stack>
              );
            })}
            <Button
              size="small"
              variant="outlined"
              onClick={() => onChangeProp("images", [...(p.images || []), { url: "", alt: "" }])}
            >
              Add image
            </Button>
          </Stack>
          <Divider sx={{ my: 1 }} />
          <RawPropsEditor section={block} onChangeProps={(np) => onChangeProps(np)} />

          <Divider sx={{ my: 1 }} />
          <CommonFields block={block} onChangeRoot={applyRoot} />
        </Stack>
      );
      }

    case "galleryCarousel":
      return (
        <Stack spacing={1.25} sx={{ p: 2 }}>
          <Header title="Gallery (carousel)" />
          <TextField
            label="Title"
            size="small"
            value={p.title || ""}
            onChange={(e) => onChangeProp("title", e.target.value)}
            fullWidth
          />
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(p.autoplay)}
                onChange={(_, v) => onChangeProp("autoplay", v)}
              />
            }
            label="Autoplay"
          />
          <TextField
            label="Interval (ms)"
            size="small"
            type="number"
            value={p.intervalMs ?? 3500}
            onChange={(e) => onChangeProp("intervalMs", Number(e.target.value || 0))}
            fullWidth
          />
          <Typography variant="caption">Images</Typography>
          <Stack spacing={1}>
            {(p.images || []).map((url, idx) => (
              <Stack key={idx} spacing={0.5} sx={{ p: 1, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                <ImageField
                  label={`Image ${idx + 1}`}
                  value={url}
                  onChange={(newUrl) => {
                    const next = [...(p.images || [])];
                    if (newUrl) next[idx] = newUrl;
                    else next.splice(idx, 1);
                    onChangeProp("images", next);
                  }}
                  companyId={companyId}
                />
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    onClick={() => {
                      const next = [...(p.images || [])];
                      next.splice(idx, 1);
                      onChangeProp("images", next);
                    }}
                  >
                    Remove
                  </Button>
                </Stack>
              </Stack>
            ))}
            <Button
              size="small"
              variant="outlined"
              onClick={() => onChangeProp("images", [...(p.images || []), ""])}
            >
              Add image
            </Button>
          </Stack>
          <Divider sx={{ my: 1 }} />
          <RawPropsEditor section={block} onChangeProps={(np) => onChangeProps(np)} />

          <Divider sx={{ my: 1 }} />
          <CommonFields block={block} onChangeRoot={applyRoot} />
        </Stack>
      );

    case "faq":
      return (
        <Stack spacing={1.25} sx={{ p: 2 }}>
          <Header title="FAQ" />
          <TextField
            label="Title"
            size="small"
            value={p.title || ""}
            onChange={(e) => onChangeProp("title", e.target.value)}
            fullWidth
          />
          <Typography variant="caption">Items</Typography>
          <Stack spacing={1}>
            {(p.items || []).map((it, idx) => (
              <Box key={idx} sx={{ p: 1, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                <TextField
                  label="Question"
                  size="small"
                  value={it?.question || ""}
                  onChange={(e) => {
                    const next = [...(p.items || [])];
                    next[idx] = { ...(next[idx] || {}), question: e.target.value };
                    onChangeProp("items", next);
                  }}
                  fullWidth
                  sx={{ mb: 0.5 }}
                />
                <TextField
                  label="Answer"
                  size="small"
                  value={it?.answer || ""}
                  onChange={(e) => {
                    const next = [...(p.items || [])];
                    next[idx] = { ...(next[idx] || {}), answer: e.target.value };
                    onChangeProp("items", next);
                  }}
                  fullWidth
                  multiline
                  minRows={2}
                />
                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                  <Button
                    size="small"
                    onClick={() => {
                      const next = [...(p.items || [])];
                      next.splice(idx, 1);
                      onChangeProp("items", next);
                    }}
                  >
                    Remove
                  </Button>
                </Stack>
              </Box>
            ))}
            <Button
              size="small"
              variant="outlined"
              onClick={() =>
                onChangeProp("items", [...(p.items || []), { question: "", answer: "" }])
              }
            >
              Add item
            </Button>
          </Stack>
          <Divider sx={{ my: 1 }} />
          <RawPropsEditor section={block} onChangeProps={(np) => onChangeProps(np)} />

          <Divider sx={{ my: 1 }} />
          <CommonFields block={block} onChangeRoot={applyRoot} />
        </Stack>
      );

    case "serviceGrid":
      return (
        <Stack spacing={1.25} sx={{ p: 2 }}>
          <Header title="Service grid" />
          <TextField
            label="Title"
            size="small"
            value={p.title || ""}
            onChange={(e) => onChangeProp("title", e.target.value)}
            fullWidth
          />
          <TextField
            label="Subtitle"
            size="small"
            value={p.subtitle || ""}
            onChange={(e) => onChangeProp("subtitle", e.target.value)}
            fullWidth
          />
          <Typography variant="caption">Services</Typography>
          <Stack spacing={1}>
            {(p.services || []).map((sv, idx) => (
              <Box key={idx} sx={{ p: 1, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                <TextField
                  size="small"
                  label="Name"
                  value={sv?.name || ""}
                  onChange={(e) => {
                    const next = [...(p.services || [])];
                    next[idx] = { ...(next[idx] || {}), name: e.target.value };
                    onChangeProp("services", next);
                  }}
                  fullWidth
                  sx={{ mb: 0.5 }}
                />
                <Stack direction="row" spacing={1}>
                  <TextField
                    size="small"
                    label="Price"
                    value={sv?.price || ""}
                    onChange={(e) => {
                      const next = [...(p.services || [])];
                      next[idx] = { ...(next[idx] || {}), price: e.target.value };
                      onChangeProp("services", next);
                    }}
                    fullWidth
                  />
                  <TextField
                    size="small"
                    label="Duration"
                    value={sv?.duration || ""}
                    onChange={(e) => {
                      const next = [...(p.services || [])];
                      next[idx] = { ...(next[idx] || {}), duration: e.target.value };
                      onChangeProp("services", next);
                    }}
                    fullWidth
                  />
                </Stack>
                <TextField
                  size="small"
                  label="Description"
                  value={sv?.description || ""}
                  onChange={(e) => {
                    const next = [...(p.services || [])];
                    next[idx] = { ...(next[idx] || {}), description: e.target.value };
                    onChangeProp("services", next);
                  }}
                  fullWidth
                  multiline
                  minRows={2}
                  sx={{ mt: 0.5 }}
                />
                <ImageField
                  label="Image (optional)"
                  value={sv?.image || ""}
                  onChange={(url) => {
                    const next = [...(p.services || [])];
                    next[idx] = { ...(next[idx] || {}), image: url };
                    onChangeProp("services", next);
                  }}
                  companyId={companyId}
                />
                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                  <Button
                    size="small"
                    onClick={() => {
                      const next = [...(p.services || [])];
                      next.splice(idx, 1);
                      onChangeProp("services", next);
                    }}
                  >
                    Remove
                  </Button>
                </Stack>
              </Box>
            ))}
            <Button
              size="small"
              variant="outlined"
              onClick={() =>
                onChangeProp("services", [
                  ...(p.services || []),
                  { name: "", price: "", duration: "", description: "", image: "" },
                ])
              }
            >
              Add service
            </Button>
          </Stack>
          <Divider sx={{ my: 1 }} />
          <RawPropsEditor section={block} onChangeProps={(np) => onChangeProps(np)} />

          <Divider sx={{ my: 1 }} />
          <CommonFields block={block} onChangeRoot={applyRoot} />
        </Stack>
      );

    case "contact":
      return (
        <Stack spacing={1.25} sx={{ p: 2 }}>
          <Header title="Contact" />
          <TextField
            size="small"
            label="Title"
            value={p.title || ""}
            onChange={(e) => onChangeProp("title", e.target.value)}
            fullWidth
          />
          <TextField
            size="small"
            label="Intro"
            value={p.intro || ""}
            onChange={(e) => onChangeProp("intro", e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
          <TextField
            size="small"
            label="Address"
            value={p.address || ""}
            onChange={(e) => onChangeProp("address", e.target.value)}
            fullWidth
          />
          <TextField
            size="small"
            label="Phone"
            value={p.phone || ""}
            onChange={(e) => onChangeProp("phone", e.target.value)}
            fullWidth
          />
          <TextField
            size="small"
            label="Email"
            value={p.email || ""}
            onChange={(e) => onChangeProp("email", e.target.value)}
            fullWidth
          />
          <TextField
            size="small"
            label="Map Embed URL"
            value={p.mapEmbedUrl || ""}
            onChange={(e) => onChangeProp("mapEmbedUrl", e.target.value)}
            fullWidth
          />
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(p.showForm)}
                onChange={(_, v) => onChangeProp("showForm", v)}
              />
            }
            label="Show contact form (static UI)"
          />
          <Divider sx={{ my: 1 }} />
          <RawPropsEditor section={block} onChangeProps={(np) => onChangeProps(np)} />

          <Divider sx={{ my: 1 }} />
          <CommonFields block={block} onChangeRoot={applyRoot} />
        </Stack>
      );

    case "footer":
      return (
        <Stack spacing={1.25} sx={{ p: 2 }}>
          <Header title="Footer" />
          <TextField
            size="small"
            label="Text"
            value={p.text || ""}
            onChange={(e) => onChangeProp("text", e.target.value)}
            fullWidth
          />
          <Typography variant="caption">Links</Typography>
          <Stack spacing={1}>
            {(p.links || []).map((lnk, idx) => (
              <Stack
                key={idx}
                spacing={0.5}
                sx={{ p: 1, border: "1px solid", borderColor: "divider", borderRadius: 1 }}
              >
                <TextField
                  size="small"
                  label="Label"
                  value={lnk?.label || ""}
                  onChange={(e) => {
                    const next = [...(p.links || [])];
                    next[idx] = { ...(next[idx] || {}), label: e.target.value };
                    onChangeProp("links", next);
                  }}
                />
                <TextField
                  size="small"
                  label="Href"
                  value={lnk?.href || ""}
                  onChange={(e) => {
                    const next = [...(p.links || [])];
                    next[idx] = { ...(next[idx] || {}), href: e.target.value };
                    onChangeProp("links", next);
                  }}
                />
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    onClick={() => {
                      const next = [...(p.links || [])];
                      next.splice(idx, 1);
                      onChangeProp("links", next);
                    }}
                  >
                    Remove
                  </Button>
                </Stack>
              </Stack>
            ))}
            <Button
              size="small"
              variant="outlined"
              onClick={() => onChangeProp("links", [...(p.links || []), { label: "", href: "" }])}
            >
              Add link
            </Button>
          </Stack>

          <Typography variant="caption" sx={{ mt: 1 }}>
            Social
          </Typography>
          <Stack spacing={1}>
            {(p.social || []).map((lnk, idx) => (
              <Stack
                key={idx}
                spacing={0.5}
                sx={{ p: 1, border: "1px solid", borderColor: "divider", borderRadius: 1 }}
              >
                <TextField
                  size="small"
                  label="Label"
                  value={lnk?.label || ""}
                  onChange={(e) => {
                    const next = [...(p.social || [])];
                    next[idx] = { ...(next[idx] || {}), label: e.target.value };
                    onChangeProp("social", next);
                  }}
                />
                <TextField
                  size="small"
                  label="Href"
                  value={lnk?.href || ""}
                  onChange={(e) => {
                    const next = [...(p.social || [])];
                    next[idx] = { ...(next[idx] || {}), href: e.target.value };
                    onChangeProp("social", next);
                  }}
                />
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    onClick={() => {
                      const next = [...(p.social || [])];
                      next.splice(idx, 1);
                      onChangeProp("social", next);
                    }}
                  >
                    Remove
                  </Button>
                </Stack>
              </Stack>
            ))}
            <Button
              size="small"
              variant="outlined"
              onClick={() => onChangeProp("social", [...(p.social || []), { label: "", href: "" }])}
            >
              Add social link
            </Button>
          </Stack>

          <Divider sx={{ my: 1 }} />
          <RawPropsEditor section={block} onChangeProps={(np) => onChangeProps(np)} />

          <Divider sx={{ my: 1 }} />
          <CommonFields block={block} onChangeRoot={applyRoot} />
        </Stack>
      );

    default:
      // Unknown block types: always editable via JSON
      return (
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            {type}
          </Typography>
          <Alert severity="info" sx={{ mb: 1 }}>
            This section type isnâ€™t mapped to a visual inspector yet. You can still edit its props below.
          </Alert>

          {/* Common controls appear above JSON on unknown types too */}
          <CommonFields block={block} onChangeRoot={applyRoot} />

          <Divider sx={{ my: 1 }} />
          <RawPropsEditor section={block} onChangeProps={(np) => onChangeProps(np)} />
        </Box>
      );
  }
}
