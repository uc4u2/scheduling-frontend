import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Tooltip,
  Stack,
  Chip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import api from "../../utils/api";

const HOOK_EVENT_OPTIONS = [
  { group: "Bookings", key: "booking.created", label: "When a new booking is created" },
  { group: "Bookings", key: "public_booking.created", label: 'When a public "book with me" link is used' },
  { group: "Bookings", key: "booking.cancelled", label: "When a booking is cancelled" },
  { group: "Bookings", key: "booking.updated", label: "When a booking is rescheduled/updated" },
  { group: "Bookings", key: "booking.no_show", label: "When a client does not show up" },
  { group: "Onboarding", key: "onboarding.started", label: "When onboarding is started for an employee (e-sign/contracts)" },
  { group: "Onboarding", key: "onboarding.document_signed", label: "When an onboarding document is attached/signed" },
  { group: "Leave", key: "leave.approved", label: "When a leave request is approved" },
  { group: "Shifts", key: "swap.requested", label: "When a shift swap is requested" },
  { group: "Time", key: "timeclock.clock_in", label: "When a staff member clocks in" },
  { group: "Time", key: "break.missed", label: "When a break is missed/short" },
  { group: "Time", key: "break.enforced", label: "When a break is auto-ended" },
  { group: "Shifts", key: "shift.published", label: "When a shift is published" },
  { group: "Payroll", key: "payroll.finalized", label: "When payroll is finalized" },
  { group: "Payroll", key: "payroll.details", label: "When payroll details are ready (one row per employee)" },
  { group: "Payments", key: "payroll.payment_requested", label: "When a payroll payment is requested" },
  { group: "Payments", key: "payroll.payment_status_updated", label: "When a payroll payment status changes" },
];

const PRESETS = {
  booking: ["booking.created", "booking.cancelled", "booking.no_show"],
  ops: ["timeclock.clock_in", "break.missed", "shift.published"],
  payroll: ["payroll.finalized", "payroll.details"],
  payments: ["payroll.payment_requested"],
};

const ZapierHooksPanel = () => {
  const [hooks, setHooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    event_type: HOOK_EVENT_OPTIONS[0].key,
    target_url: "",
    secret: "",
  });

  const loadHooks = async () => {
    setLoading(true);
    try {
      const res = await api.get("/integrations/zapier/hooks");
      setHooks(res?.data?.hooks || []);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to load Zapier hooks", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleCreate = async () => {
    if (!form.target_url.trim()) return;
    setSaving(true);
    try {
      await api.post("/integrations/zapier/hooks", {
        event_type: form.event_type,
        target_url: form.target_url.trim(),
        secret: form.secret.trim() || undefined,
      });
      setForm((prev) => ({ ...prev, target_url: "", secret: "" }));
      loadHooks();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to create Zapier hook", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this Zapier hook?")) return;
    try {
      await api.delete(`/integrations/zapier/hooks/${id}`);
      loadHooks();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to delete Zapier hook", err);
    }
  };

  const renderStatusChip = (hook) => {
    if (!hook.last_called_at) {
      return <Chip label="Never called" size="small" />;
    }
    if (hook.last_status_code && hook.last_status_code >= 200 && hook.last_status_code < 300) {
      return <Chip label={`Last: ${hook.last_status_code}`} size="small" color="success" />;
    }
    if (hook.last_status_code && hook.last_status_code >= 400 && hook.last_status_code < 500) {
      return <Chip label={`Last: ${hook.last_status_code}`} size="small" color="warning" />;
    }
    if (hook.last_status_code && hook.last_status_code >= 500) {
      return <Chip label={`Last: ${hook.last_status_code}`} size="small" color="error" />;
    }
    if (hook.last_error) {
      return <Chip label="Error" size="small" color="error" />;
    }
    return <Chip label="Called" size="small" />;
  };

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Event hooks
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Paste your Zapier Catch Hook URL and choose which Schedulaa event should trigger it. Optionally add a secret to
        sign payloads (HMAC). Only events listed here will be sent to your Zapier webhook URL. You can point multiple
        hooks to the same Catch Hook URL.
      </Typography>
      <Chip label="Trigger" size="small" color="primary" variant="outlined" sx={{ mb: 2 }} />

      <Stack spacing={1.5} sx={{ mb: 2 }}>
        <TextField
          select
          size="small"
          label="Event type"
          value={form.event_type}
          onChange={handleChange("event_type")}
          SelectProps={{ MenuProps: { disablePortal: true } }}
          sx={{ maxWidth: 320 }}
        >
          {["Bookings", "Onboarding", "Shifts", "Time", "Leave", "Payroll", "Payments"]
            .filter((group) => HOOK_EVENT_OPTIONS.some((opt) => opt.group === group))
            .map((group) => [
              <MenuItem key={`${group}-header`} disabled dense>
                <Typography variant="caption" color="primary">
                  {group}
                </Typography>
              </MenuItem>,
              ...HOOK_EVENT_OPTIONS.filter((opt) => opt.group === group).map((opt) => (
                <MenuItem key={opt.key} value={opt.key}>
                  <Box>
                    <Typography variant="body2">{opt.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {opt.key}
                    </Typography>
                  </Box>
                </MenuItem>
              )),
            ])}
          <MenuItem value="__more" disabled>
            More events coming soon
          </MenuItem>
        </TextField>

        <TextField
          size="small"
          label="Zapier hook URL"
          placeholder="https://hooks.zapier.com/hooks/..."
          value={form.target_url}
          onChange={handleChange("target_url")}
          fullWidth
        />

        <TextField
          size="small"
          label="Secret (optional)"
          placeholder="Used to sign payloads"
          helperText="Optional: used to sign requests for extra security. You'll also need this secret in Zapier if you verify signatures."
          value={form.secret}
          onChange={handleChange("secret")}
          fullWidth
        />

        <Button variant="contained" onClick={handleCreate} disabled={saving || !form.target_url.trim()}>
          {saving ? "Saving..." : "Add hook"}
        </Button>
      </Stack>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Event</TableCell>
            <TableCell>Target URL</TableCell>
            <TableCell>Created</TableCell>
            <TableCell>Last call</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {hooks.length === 0 && !loading && (
            <TableRow>
              <TableCell colSpan={6}>
                <Typography variant="body2" color="text.secondary">
                  No event hooks yet. Add a hook to trigger your Zapier workflow.
                </Typography>
              </TableCell>
            </TableRow>
          )}
          {hooks.map((hook) => (
            <TableRow key={hook.id}>
              <TableCell>{hook.event_type}</TableCell>
              <TableCell sx={{ maxWidth: 320, wordBreak: "break-all" }}>{hook.target_url}</TableCell>
              <TableCell>
                {hook.created_at ? new Date(hook.created_at).toLocaleString() : "—"}
              </TableCell>
              <TableCell>
                {hook.last_called_at ? new Date(hook.last_called_at).toLocaleString() : "Never"}
              </TableCell>
              <TableCell>{renderStatusChip(hook)}</TableCell>
              <TableCell align="right">
                <Tooltip title="Delete hook">
                  <IconButton size="small" onClick={() => handleDelete(hook.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

export default ZapierHooksPanel;
