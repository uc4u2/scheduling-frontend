// src/components/website/WebsiteBrandingCard.js
import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { website } from "../../utils/api";
import {
  SOCIAL_ICON_OPTIONS,
  defaultFooterConfig,
  defaultHeaderConfig,
  normalizeFooterConfig,
  normalizeHeaderConfig,
} from "../../utils/headerFooter";

const HeaderLayoutOptions = [
  { value: "simple", label: "Simple" },
  { value: "center", label: "Centered" },
  { value: "split", label: "Split (nav left/right)" },
];

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

function LinkListEditor({ title, items, onChange, addLabel = "Add link", max = 6 }) {
  const list = Array.isArray(items) ? items : [];
  const handleChange = (idx, field, value) => {
    const next = list.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    onChange?.(next);
  };
  const handleAdd = () => {
    if (list.length >= max) return;
    onChange?.([...list, { label: "", href: "" }]);
  };
  const handleRemove = (idx) => {
    const next = list.filter((_, i) => i !== idx);
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
          disabled={list.length >= max}
        >
          {addLabel}
        </Button>
      </Stack>
      {list.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No links yet.
        </Typography>
      )}
      {list.map((item, idx) => (
        <Grid container spacing={1} key={`${title}-${idx}`}>
          <Grid item xs={12} md={5}>
            <TextField
              size="small"
              fullWidth
              label="Label"
              value={item.label || ""}
              onChange={(e) => handleChange(idx, "label", e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              size="small"
              fullWidth
              label="Link / URL"
              value={item.href || ""}
              onChange={(e) => handleChange(idx, "href", e.target.value)}
              placeholder="https:// or /page"
            />
          </Grid>
          <Grid item xs={12} md={1}>
            <IconButton
              aria-label="Remove"
              onClick={() => handleRemove(idx)}
              size="small"
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Grid>
        </Grid>
      ))}
    </Stack>
  );
}

function SocialLinksEditor({ title, items, onChange, max = 6 }) {
  const list = Array.isArray(items) ? items : [];
  const handleChange = (idx, field, value) => {
    const next = list.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    onChange?.(next);
  };
  const handleAdd = () => {
    if (list.length >= max) return;
    onChange?.([...list, { icon: "instagram", href: "", label: "" }]);
  };
  const handleRemove = (idx) => {
    onChange?.(list.filter((_, i) => i !== idx));
  };
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="subtitle2">{title}</Typography>
        <Button
          size="small"
          startIcon={<AddCircleOutlineIcon fontSize="small" />}
          onClick={handleAdd}
          disabled={list.length >= max}
        >
          Add social link
        </Button>
      </Stack>
      {list.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No social links yet.
        </Typography>
      )}
      {list.map((item, idx) => (
        <Grid container spacing={1} alignItems="center" key={`social-${idx}`}>
          <Grid item xs={12} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Icon</InputLabel>
              <Select
                label="Icon"
                value={item.icon || "instagram"}
                onChange={(e) => handleChange(idx, "icon", e.target.value)}
              >
                {SOCIAL_ICON_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={5}>
            <TextField
              size="small"
              fullWidth
              label="Link"
              value={item.href || ""}
              onChange={(e) => handleChange(idx, "href", e.target.value)}
              placeholder="https://…"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              size="small"
              fullWidth
              label="Label (optional)"
              value={item.label || ""}
              onChange={(e) => handleChange(idx, "label", e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={1}>
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

export default function WebsiteBrandingCard({
  companyId,
  headerValue,
  footerValue,
  onChangeHeader,
  onChangeFooter,
  onSave,
  saving = false,
  message = "",
  error = "",
}) {
  const header = useMemo(
    () => normalizeHeaderConfig(headerValue || defaultHeaderConfig()),
    [headerValue]
  );
  const footer = useMemo(
    () => normalizeFooterConfig(footerValue || defaultFooterConfig()),
    [footerValue]
  );
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");

  const updateHeader = (patch) => {
    const next = normalizeHeaderConfig({ ...header, ...patch });
    onChangeHeader?.(next);
  };

  const updateFooter = (patch) => {
    const next = normalizeFooterConfig({ ...footer, ...patch });
    onChangeFooter?.(next);
  };

  const uploadLogo = async (file, target) => {
    if (!file || !companyId) return;
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
      setUploadErr(e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Card variant="outlined">
        <CardHeader title="Header" subheader="Logo, sticky bar, quick links" />
        <CardContent sx={{ display: "grid", gap: 3 }}>
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
          <Stack spacing={1.5} direction={{ xs: "column", md: "row" }}>
            <TextField
              size="small"
              select
              fullWidth
              label="Layout"
              value={header.layout || "simple"}
              onChange={(e) => updateHeader({ layout: e.target.value })}
            >
              {HeaderLayoutOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(header.sticky)}
                  onChange={(_, v) => updateHeader({ sticky: v })}
                />
              }
              label="Sticky"
            />
          </Stack>
          <Stack spacing={1.5} direction={{ xs: "column", md: "row" }}>
            <TextField
              size="small"
              fullWidth
              label="Background color"
              value={header.bg || ""}
              onChange={(e) => updateHeader({ bg: e.target.value })}
              placeholder="#ffffff or rgba(...)"
            />
            <TextField
              size="small"
              fullWidth
              label="Heading / tagline"
              value={header.text || ""}
              onChange={(e) => updateHeader({ text: e.target.value })}
            />
          </Stack>
          <Divider />
          <LinkListEditor
            title="Navigation links"
            items={header.nav_items}
            onChange={(items) => updateHeader({ nav_items: items })}
            addLabel="Add nav item"
          />
          <Divider />
          <SocialLinksEditor
            title="Header social links"
            items={header.social_links}
            onChange={(items) => updateHeader({ social_links: items })}
          />
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader title="Footer" subheader="Contact info, columns, social" />
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
          <Stack spacing={1.5} direction={{ xs: "column", md: "row" }}>
            <TextField
              size="small"
              fullWidth
              label="Background color"
              value={footer.bg || ""}
              onChange={(e) => updateFooter({ bg: e.target.value })}
              placeholder="#120a0b"
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
          </Stack>
          <ColumnsEditor
            columns={footer.columns}
            onChange={(columns) => updateFooter({ columns })}
          />
          <Divider />
          <LinkListEditor
            title="Legal links"
            items={footer.legal_links}
            onChange={(items) => updateFooter({ legal_links: items })}
            addLabel="Add legal link"
            max={4}
          />
          <Divider />
          <SocialLinksEditor
            title="Footer social links"
            items={footer.social_links}
            onChange={(items) => updateFooter({ social_links: items })}
          />
        </CardContent>
      </Card>

      {uploadErr && <ErrorHelper message={uploadErr} />}
      {error && <ErrorHelper message={error} />}
      {message && (
        <Alert severity="success" sx={{ mt: 1 }}>
          {message}
        </Alert>
      )}
      <Box>
        <Button
          variant="contained"
          disabled={saving || uploading}
          onClick={() =>
            onSave?.({
              header,
              footer,
            })
          }
        >
          {saving ? "Saving…" : "Save header & footer"}
        </Button>
      </Box>
    </Stack>
  );
}
