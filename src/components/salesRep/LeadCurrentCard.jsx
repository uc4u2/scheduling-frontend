import React from "react";
import { Alert, Button, Paper, Stack, Typography } from "@mui/material";

function formatDateTime(value) {
  if (!value) return "—";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleString();
}

function Row({ label, value }) {
  return (
    <Stack spacing={0.25}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2">{value || "—"}</Typography>
    </Stack>
  );
}

export default function LeadCurrentCard({ lead, loading, onNext, onSkip, skipDisabled }) {
  return (
    <Paper sx={{ p: 3 }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <BoxTitle title="Current Lead" subtitle="One lead at a time. Move forward only after you submit or skip the current lead." />
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={onSkip} disabled={skipDisabled}>Skip</Button>
          <Button variant="contained" onClick={onNext} disabled={loading}>{loading ? "Loading…" : "Next Lead"}</Button>
        </Stack>
      </Stack>
      {!lead ? (
        <Stack spacing={1}>
          <Alert severity="info" variant="outlined">
            No lead is currently locked for you. Take the next available lead when you are ready.
          </Alert>
        </Stack>
      ) : (
        <Stack spacing={1.25}>
          <Row label="Company" value={lead.company_name} />
          <Row label="Contact" value={lead.contact_name} />
          <Row label="Phone" value={lead.phone} />
          <Row label="Email" value={lead.email} />
          <Row label="Website" value={lead.website} />
          <Row label="City / Country" value={[lead.city, lead.country].filter(Boolean).join(", ")} />
          <Row label="Source" value={lead.source} />
          <Row label="Last outcome" value={lead.last_outcome} />
          <Row label="Callback at" value={formatDateTime(lead.callback_at)} />
          <Row label="Linked sales deal" value={lead.sales_deal_id ? `Deal #${lead.sales_deal_id}` : null} />
        </Stack>
      )}
    </Paper>
  );
}

function BoxTitle({ title, subtitle }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="h6">{title}</Typography>
      <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
    </Stack>
  );
}
