import React from "react";
import { Alert, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { formatDateTimeInTz } from "../../utils/datetime";
import { getUserTimezone } from "../../utils/timezone";

function formatDateTime(value) {
  if (!value) return "—";
  return formatDateTimeInTz(value, getUserTimezone()) || value;
}

function Row({ label, value }) {
  return (
    <Stack spacing={0.25}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2">{value || "—"}</Typography>
    </Stack>
  );
}

export default function LeadCurrentCard({
  lead,
  loading,
  onNext,
  onSkip,
  skipDisabled,
  onCall,
  callLoading,
  callUiMode = "bridge",
}) {
  const protectedMode = lead?.lead_access_mode === "protected_twilio";
  const phoneValue = protectedMode ? lead?.phone_masked || "No phone available" : lead?.phone;
  const callReason = getCallDisabledReasonCopy(lead?.call_disabled_reason);

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
        <Stack spacing={1.5}>
          {protectedMode ? (
            <Alert severity="info" variant="outlined">
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "flex-start", sm: "center" }}>
                <Chip size="small" color="primary" label="Twilio-protected" />
                <Typography variant="body2">
                  Phone number is protected. Use the approved Twilio calling workflow for this lead when the call controls are available.
                </Typography>
              </Stack>
            </Alert>
          ) : null}
          <Row label="Company" value={lead.company_name} />
          <Row label="Contact" value={lead.contact_name} />
          <Row label="Phone" value={phoneValue} />
          <Row label="Email" value={lead.email} />
          <Row label="Website" value={lead.website} />
          <Row label="City / Country" value={[lead.city, lead.country].filter(Boolean).join(", ")} />
          <Row label="Source" value={lead.source} />
          <Row label="Last outcome" value={lead.last_outcome} />
          <Row label="Callback at" value={formatDateTime(lead.callback_at)} />
          <Row label="Linked sales deal" value={lead.sales_deal_id ? `Deal #${lead.sales_deal_id}` : null} />
          {protectedMode && callUiMode === "bridge" ? (
            <Stack spacing={1}>
              <Button variant="contained" onClick={onCall} disabled={!lead.can_call_via_twilio || callLoading}>
                {callLoading ? "Starting call…" : "Call via Twilio"}
              </Button>
              {!lead.can_call_via_twilio ? (
                <Typography variant="caption" color="text.secondary">
                  {callReason}
                </Typography>
              ) : null}
            </Stack>
          ) : null}
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

function getCallDisabledReasonCopy(reason) {
  const messages = {
    protected_twilio_mode_required: "Protected Twilio mode must be enabled before you can call through the system.",
    twilio_browser_not_configured: "Browser softphone setup is incomplete. Contact a platform admin.",
    twilio_not_configured: "Twilio is not configured yet. Contact a platform admin.",
    sales_rep_phone_missing: "Your rep phone number is missing. Ask an admin to update your profile.",
    lead_phone_missing: "This lead does not have a callable phone number.",
    locked_lead_required: "Only your current locked lead can be called through Twilio.",
    lead_attempt_limit_reached: "This lead reached the daily call-attempt limit. Try again later or ask an admin to review it.",
    lead_retry_cooldown_active: "This lead is currently in a retry cooldown window. Wait before calling again.",
    company_contact_throttle_active: "Another related lead for this company was contacted recently. Wait for the throttle window to expire or ask an admin to review.",
  };
  return messages[reason] || "Calling is not available for this lead right now.";
}
