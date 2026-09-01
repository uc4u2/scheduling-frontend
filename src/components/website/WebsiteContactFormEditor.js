import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import { api } from "../../utils/api";
import {
  WEBSITE_FORM_FIELD_TYPES,
  normalizeWebsiteFormDraft,
  normalizeWebsiteFormFieldName,
} from "../../utils/websiteFormDefinition";

export default function WebsiteContactFormEditor({ companyId, formKey = "contact", onSaved }) {
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const headers = companyId ? { "X-Company-Id": String(companyId) } : {};

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setMessage(null);
    try {
      const response = await api.get("/api/website/forms", { headers });
      const forms = Array.isArray(response?.data) ? response.data : [];
      const resolvedKey = String(formKey || "contact").trim().toLowerCase() || "contact";
      const form = forms.find((item) => String(item?.key || "").trim().toLowerCase() === resolvedKey) || null;
      setDraft(normalizeWebsiteFormDraft(form, resolvedKey));
    } catch (error) {
      setMessage({ severity: "error", text: error?.response?.data?.error || "Could not load the website form definition." });
    } finally {
      setLoading(false);
    }
  }, [companyId, formKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  const updateField = (index, patch) => {
    setDraft((current) => ({
      ...current,
      fields: current.fields.map((field, fieldIndex) => fieldIndex === index ? { ...field, ...patch } : field),
    }));
  };

  const moveField = (index, direction) => {
    setDraft((current) => {
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= current.fields.length) return current;
      const fields = [...current.fields];
      const [moved] = fields.splice(index, 1);
      fields.splice(target, 0, moved);
      return { ...current, fields };
    });
  };

  const save = async () => {
    if (!draft || !companyId) return;
    const fields = draft.fields.map((field, index) => ({
      name: normalizeWebsiteFormFieldName(field.name, `field_${index + 1}`),
      label: String(field.label || "").trim() || `Field ${index + 1}`,
      type: WEBSITE_FORM_FIELD_TYPES.includes(field.type) ? field.type : "text",
      required: field.required !== false,
      options: {
        ...(field.options || {}),
        placeholder: String(field.options?.placeholder || "").trim(),
        ...(field.type === "select"
          ? {
              choices: String(
                field.options?.choicesText ??
                (Array.isArray(field.options?.choices) ? field.options.choices.join("\n") : "")
              )
                .split("\n")
                .map((value) => value.trim())
                .filter(Boolean),
            }
          : {}),
      },
      sort_order: index,
    }));
    if (!fields.length) {
      setMessage({ severity: "warning", text: "Keep at least one field in the contact form." });
      return;
    }
    if (new Set(fields.map((field) => field.name)).size !== fields.length) {
      setMessage({ severity: "warning", text: "Each form field needs a unique field name." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        name: String(draft.name || "Contact").trim() || "Contact",
        key: String(draft.key || formKey || "contact").trim() || "contact",
        success_msg: String(draft.success_msg || "").trim(),
        fields,
      };
      const response = draft.id
        ? await api.put(`/api/website/forms/${draft.id}`, payload, { headers })
        : await api.post("/api/website/forms", payload, { headers });
      setDraft(normalizeWebsiteFormDraft(response?.data, payload.key));
      setMessage({ severity: "success", text: "Contact form definition saved. The preview is refreshing." });
      onSaved?.();
    } catch (error) {
      setMessage({ severity: "error", text: error?.response?.data?.error || "Could not save the website form definition." });
    } finally {
      setSaving(false);
    }
  };

  if (loading && !draft) return <Typography color="text.secondary">Loading contact form fields…</Typography>;
  if (!draft) return message ? <Alert severity={message.severity}>{message.text}</Alert> : null;

  return (
    <Stack spacing={1.5} data-testid="website-contact-form-definition-editor">
      <Typography variant="overline" color="text.secondary">Form fields &amp; response</Typography>
      <Alert severity="info" variant="outlined">
        These fields use the existing Website Form definition and submission flow. Section heading, intro, and button text remain page-module content.
      </Alert>
      {message ? <Alert severity={message.severity}>{message.text}</Alert> : null}
      <TextField size="small" label="Form name" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} fullWidth />
      <TextField size="small" label="Success message" value={draft.success_msg} onChange={(event) => setDraft((current) => ({ ...current, success_msg: event.target.value }))} fullWidth multiline minRows={2} />
      {draft.fields.map((field, index) => (
        <Paper key={field.id || `${field.name}-${index}`} variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
          <Stack spacing={1}>
            <TextField size="small" label="Label" value={field.label} onChange={(event) => updateField(index, { label: event.target.value })} fullWidth />
            <TextField size="small" label="Field name" value={field.name} onChange={(event) => updateField(index, { name: event.target.value })} helperText="Stable submission key, for example email or message." fullWidth />
            <TextField select size="small" label="Field type" value={field.type} onChange={(event) => updateField(index, { type: event.target.value })} fullWidth>
              {WEBSITE_FORM_FIELD_TYPES.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
            </TextField>
            <TextField size="small" label="Placeholder" value={field.options?.placeholder || ""} onChange={(event) => updateField(index, { options: { ...(field.options || {}), placeholder: event.target.value } })} fullWidth />
            {field.type === "select" ? <TextField size="small" label="Choices" helperText="One option per line." value={field.options?.choicesText ?? (Array.isArray(field.options?.choices) ? field.options.choices.join("\n") : "")} onChange={(event) => updateField(index, { options: { ...(field.options || {}), choicesText: event.target.value } })} fullWidth multiline minRows={3} /> : null}
            <FormControlLabel control={<Checkbox checked={field.required !== false} onChange={(event) => updateField(index, { required: event.target.checked })} />} label="Required" />
            <Stack direction="row" justifyContent="space-between" gap={1}>
              <Stack direction="row" gap={1}>
                <Button size="small" variant="outlined" disabled={index === 0} onClick={() => moveField(index, "up")}>Move up</Button>
                <Button size="small" variant="outlined" disabled={index === draft.fields.length - 1} onClick={() => moveField(index, "down")}>Move down</Button>
              </Stack>
              <Button size="small" color="error" onClick={() => setDraft((current) => ({ ...current, fields: current.fields.filter((_, fieldIndex) => fieldIndex !== index) }))}>Remove</Button>
            </Stack>
          </Stack>
        </Paper>
      ))}
      <Box>
        <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => setDraft((current) => ({ ...current, fields: [...current.fields, { id: `draft-field-${Date.now()}`, name: `field_${current.fields.length + 1}`, label: "New field", type: "text", required: false, options: {}, sort_order: current.fields.length }] }))}>Add field</Button>
      </Box>
      <Button variant="contained" onClick={save} disabled={saving}>{saving ? "Saving form…" : "Save contact form"}</Button>
    </Stack>
  );
}
