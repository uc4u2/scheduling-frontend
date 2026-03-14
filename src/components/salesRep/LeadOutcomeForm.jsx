import React from "react";
import {
  Alert,
  Button,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
  FormControlLabel,
} from "@mui/material";

const OUTCOMES = [
  "no_answer",
  "busy",
  "voicemail",
  "wrong_number",
  "interested",
  "call_back_later",
  "booked_demo",
  "not_interested",
  "do_not_call",
  "already_subscribed",
  "duplicate",
];

const CALLBACK_OUTCOMES = new Set(["no_answer", "busy", "voicemail", "call_back_later"]);

export default function LeadOutcomeForm({ lead, form, onChange, onSubmit, submitting }) {
  const needsCallback = CALLBACK_OUTCOMES.has(form.outcome);

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h6">Submit Outcome</Typography>
          <Typography variant="body2" color="text.secondary">
            Record the call result and optionally schedule the callback in UTC-safe form.
          </Typography>
        </Stack>
        {!lead ? (
          <Alert severity="info" variant="outlined">
            Load a lead first. Outcome submission stays disabled until a lead is locked to you.
          </Alert>
        ) : null}
        <TextField
          select
          fullWidth
          label="Outcome"
          value={form.outcome}
          onChange={(e) => onChange("outcome", e.target.value)}
          disabled={!lead || submitting}
        >
          {OUTCOMES.map((outcome) => (
            <MenuItem key={outcome} value={outcome}>{outcome}</MenuItem>
          ))}
        </TextField>
        <TextField
          fullWidth
          multiline
          minRows={3}
          label="Note (optional)"
          value={form.note}
          onChange={(e) => onChange("note", e.target.value)}
          disabled={!lead || submitting}
        />
        {needsCallback ? (
          <Stack spacing={1}>
            <Alert severity="warning" variant="outlined">
              This outcome should schedule a callback. Choose the callback time before submitting.
            </Alert>
            <TextField
              fullWidth
              type="datetime-local"
              label="Callback time"
              InputLabelProps={{ shrink: true }}
              value={form.callback_at}
              onChange={(e) => onChange("callback_at", e.target.value)}
              disabled={!lead || submitting}
            />
          </Stack>
        ) : null}
        <FormControlLabel
          control={<Switch checked={form.registration_link_sent} onChange={(e) => onChange("registration_link_sent", e.target.checked)} disabled={!lead || submitting} />}
          label="Registration link already sent"
        />
        <TextField
          fullWidth
          label="Existing deal ID (optional)"
          value={form.deal_id}
          onChange={(e) => onChange("deal_id", e.target.value)}
          disabled={!lead || submitting}
        />
        <Button variant="contained" onClick={onSubmit} disabled={!lead || submitting || !form.outcome}>
          {submitting ? "Submitting…" : "Submit Outcome"}
        </Button>
      </Stack>
    </Paper>
  );
}
