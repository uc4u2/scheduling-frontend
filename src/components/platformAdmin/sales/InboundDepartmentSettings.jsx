import React, { useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

function toJsonText(value) {
  try {
    return JSON.stringify(value || {}, null, 2);
  } catch (error) {
    return "{}";
  }
}

export default function InboundDepartmentSettings({ departments, reps, onSave, savingDepartmentId }) {
  const [drafts, setDrafts] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const next = {};
    (departments || []).forEach((row) => {
      next[row.id] = {
        label: row.label || "",
        ivr_digit: row.ivr_digit || "",
        is_active: Boolean(row.is_active),
        greeting_text: row.greeting_text || "",
        queue_enabled: Boolean(row.queue_enabled),
        queue_timeout_seconds: row.queue_timeout_seconds ?? 25,
        ring_strategy: row.ring_strategy || "first_available",
        fixed_rep_id: row.fixed_rep_id ? String(row.fixed_rep_id) : "",
        fallback_department_key: row.fallback_department_key || "",
        fallback_to_voicemail: Boolean(row.fallback_to_voicemail),
        voicemail_enabled: Boolean(row.voicemail_enabled),
        voicemail_text: row.voicemail_text || "",
        after_hours_text: row.after_hours_text || "",
        business_hours_json_text: toJsonText(row.business_hours_json),
        sort_order: row.sort_order ?? 0,
      };
    });
    setDrafts(next);
    setErrors({});
  }, [departments]);

  const departmentKeys = useMemo(() => (departments || []).map((row) => row.department_key), [departments]);

  const handleDraftChange = (departmentId, field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [departmentId]: { ...prev[departmentId], [field]: value },
    }));
  };

  const handleSave = async (department) => {
    const draft = drafts[department.id];
    if (!draft) return;
    let businessHoursJson = {};
    if ((draft.business_hours_json_text || "").trim()) {
      try {
        businessHoursJson = JSON.parse(draft.business_hours_json_text);
      } catch (error) {
        setErrors((prev) => ({ ...prev, [department.id]: "Business hours JSON must be valid JSON." }));
        return;
      }
    }
    setErrors((prev) => ({ ...prev, [department.id]: "" }));
    await onSave?.(department.id, {
      label: draft.label,
      ivr_digit: draft.ivr_digit,
      is_active: draft.is_active,
      greeting_text: draft.greeting_text,
      queue_enabled: draft.queue_enabled,
      queue_timeout_seconds: Number(draft.queue_timeout_seconds || 0),
      ring_strategy: draft.ring_strategy,
      fixed_rep_id: draft.fixed_rep_id ? Number(draft.fixed_rep_id) : null,
      fallback_department_key: draft.fallback_department_key || null,
      fallback_to_voicemail: draft.fallback_to_voicemail,
      voicemail_enabled: draft.voicemail_enabled,
      voicemail_text: draft.voicemail_text,
      after_hours_text: draft.after_hours_text,
      business_hours_json: businessHoursJson,
      sort_order: Number(draft.sort_order || 0),
    });
  };

  return (
    <Paper sx={{ p: 2.5 }}>
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Department Settings</Typography>
          <Typography variant="body2" color="text.secondary">
            Edit IVR labels, prompt text, routing strategy, and fallback behavior for the seeded inbound departments.
          </Typography>
        </Stack>

        {(departments || []).map((department) => {
          const draft = drafts[department.id] || {};
          return (
            <Accordion key={department.id} disableGutters defaultExpanded sx={{ borderRadius: 1.5, "&:before": { display: "none" }, border: "1px solid", borderColor: "divider" }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "flex-start", md: "center" }} justifyContent="space-between" sx={{ width: "100%", pr: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {department.department_key} · {draft.label || department.label}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Typography variant="caption" color="text.secondary">Digit {draft.ivr_digit || department.ivr_digit}</Typography>
                    <Typography variant="caption" color="text.secondary">{draft.ring_strategy || department.ring_strategy}</Typography>
                  </Stack>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  {errors[department.id] ? <Alert severity="warning" variant="outlined">{errors[department.id]}</Alert> : null}
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField size="small" label="Label" value={draft.label || ""} onChange={(e) => handleDraftChange(department.id, "label", e.target.value)} fullWidth />
                    <TextField size="small" label="IVR digit" value={draft.ivr_digit || ""} onChange={(e) => handleDraftChange(department.id, "ivr_digit", e.target.value)} sx={{ minWidth: 120 }} />
                    <TextField size="small" label="Sort order" type="number" value={draft.sort_order ?? 0} onChange={(e) => handleDraftChange(department.id, "sort_order", e.target.value)} sx={{ minWidth: 140 }} />
                  </Stack>

                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      size="small"
                      select
                      label="Ring strategy"
                      value={draft.ring_strategy || "first_available"}
                      onChange={(e) => handleDraftChange(department.id, "ring_strategy", e.target.value)}
                      sx={{ minWidth: 220 }}
                    >
                      <MenuItem value="first_available">First available</MenuItem>
                      <MenuItem value="ordered_list">Ordered list</MenuItem>
                      <MenuItem value="fixed_rep">Fixed rep</MenuItem>
                    </TextField>
                    <TextField
                      size="small"
                      select
                      label="Fixed rep"
                      value={draft.fixed_rep_id || ""}
                      onChange={(e) => handleDraftChange(department.id, "fixed_rep_id", e.target.value)}
                      sx={{ minWidth: 220 }}
                      disabled={draft.ring_strategy !== "fixed_rep"}
                    >
                      <MenuItem value="">None</MenuItem>
                      {(reps || []).map((rep) => (
                        <MenuItem key={rep.id} value={String(rep.id)}>{rep.full_name}</MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      size="small"
                      select
                      label="Fallback department"
                      value={draft.fallback_department_key || ""}
                      onChange={(e) => handleDraftChange(department.id, "fallback_department_key", e.target.value)}
                      sx={{ minWidth: 220 }}
                    >
                      <MenuItem value="">None</MenuItem>
                      {departmentKeys.filter((key) => key !== department.department_key).map((key) => (
                        <MenuItem key={key} value={key}>{key}</MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      size="small"
                      label="Queue timeout (s)"
                      type="number"
                      value={draft.queue_timeout_seconds ?? 25}
                      onChange={(e) => handleDraftChange(department.id, "queue_timeout_seconds", e.target.value)}
                      sx={{ minWidth: 170 }}
                    />
                  </Stack>

                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <FormControlLabel control={<Switch checked={Boolean(draft.is_active)} onChange={(e) => handleDraftChange(department.id, "is_active", e.target.checked)} />} label="Active" />
                    <FormControlLabel control={<Switch checked={Boolean(draft.queue_enabled)} onChange={(e) => handleDraftChange(department.id, "queue_enabled", e.target.checked)} />} label="Queue enabled" />
                    <FormControlLabel control={<Switch checked={Boolean(draft.fallback_to_voicemail)} onChange={(e) => handleDraftChange(department.id, "fallback_to_voicemail", e.target.checked)} />} label="Fallback to voicemail" />
                    <FormControlLabel control={<Switch checked={Boolean(draft.voicemail_enabled)} onChange={(e) => handleDraftChange(department.id, "voicemail_enabled", e.target.checked)} />} label="Voicemail enabled" />
                  </Stack>

                  <TextField
                    label="Greeting text"
                    value={draft.greeting_text || ""}
                    onChange={(e) => handleDraftChange(department.id, "greeting_text", e.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                  />
                  <TextField
                    label="Voicemail text"
                    value={draft.voicemail_text || ""}
                    onChange={(e) => handleDraftChange(department.id, "voicemail_text", e.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                  />
                  <TextField
                    label="After-hours text"
                    value={draft.after_hours_text || ""}
                    onChange={(e) => handleDraftChange(department.id, "after_hours_text", e.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                  />
                  <TextField
                    label="Business hours JSON"
                    value={draft.business_hours_json_text || "{}"}
                    onChange={(e) => handleDraftChange(department.id, "business_hours_json_text", e.target.value)}
                    fullWidth
                    multiline
                    minRows={4}
                  />

                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                      variant="contained"
                      onClick={() => handleSave(department)}
                      disabled={savingDepartmentId === department.id}
                    >
                      {savingDepartmentId === department.id ? "Saving…" : "Save department"}
                    </Button>
                  </Stack>
                </Stack>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Stack>
    </Paper>
  );
}
