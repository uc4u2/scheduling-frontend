import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import RefreshIcon from "@mui/icons-material/Refresh";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import { googleCalendarIntegration } from "../../utils/api";

const fmt = (value) => {
  if (!value) return "Never";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

const statusColor = (status) => {
  if (status === "success") return "success";
  if (status === "failed" || status === "error") return "error";
  if (status === "skipped") return "default";
  return "info";
};

const connectedChipSx = {
  bgcolor: "#15803d",
  color: "#ffffff",
  borderColor: "#166534",
  fontWeight: 800,
  "& .MuiChip-label": { px: 1 },
};

const statusChipSx = (tone) => {
  if (tone === "success") return connectedChipSx;
  if (tone === "warning") {
    return {
      bgcolor: "#b45309",
      color: "#ffffff",
      borderColor: "#92400e",
      fontWeight: 800,
      "& .MuiChip-label": { px: 1 },
    };
  }
  if (tone === "error") {
    return {
      bgcolor: "#b91c1c",
      color: "#ffffff",
      borderColor: "#991b1b",
      fontWeight: 800,
      "& .MuiChip-label": { px: 1 },
    };
  }
  return { fontWeight: 800, "& .MuiChip-label": { px: 1 } };
};

export default function SettingsGoogleCalendar() {
  const [status, setStatus] = useState(null);
  const [calendars, setCalendars] = useState([]);
  const [activity, setActivity] = useState([]);
  const [selectedRecruiterId, setSelectedRecruiterId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const employees = status?.employees || [];
  const activeRecruiterId = selectedRecruiterId || status?.recruiter_id || employees[0]?.id || "";
  const activeConnection = useMemo(() => {
    const rows = status?.connections || [];
    return rows.find((row) => String(row.recruiter_id) === String(activeRecruiterId)) || (String(status?.recruiter_id) === String(activeRecruiterId) ? status : null);
  }, [status, activeRecruiterId]);
  const connected = Boolean(activeConnection?.connected);
  const canManage = status?.permissions?.can_manage_integrations !== false;
  const isSelf = String(activeRecruiterId || "") === String(status?.current_user_id || "");

  const load = useCallback(async (recruiterId = activeRecruiterId) => {
    setLoading(true);
    try {
      const payload = await googleCalendarIntegration.status(recruiterId ? { recruiter_id: recruiterId } : {});
      setStatus(payload);
      if (!selectedRecruiterId && payload?.recruiter_id) setSelectedRecruiterId(String(payload.recruiter_id));
      if (payload?.connected) {
        const cals = await googleCalendarIntegration.calendars({ recruiter_id: recruiterId || payload.recruiter_id }).catch(() => ({ calendars: [] }));
        setCalendars(cals.calendars || []);
      } else {
        setCalendars([]);
      }
      const activityPayload = await googleCalendarIntegration.activity({ limit: 8 }).catch(() => ({ items: [] }));
      setActivity(activityPayload.items || []);
    } catch (error) {
      setMessage({ severity: "error", text: error?.response?.data?.error || "Unable to load Google Calendar status." });
    } finally {
      setLoading(false);
    }
  }, [activeRecruiterId, selectedRecruiterId]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeRecruiterId) load(activeRecruiterId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRecruiterId]);

  const handleConnect = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await googleCalendarIntegration.connect({ recruiter_id: Number(activeRecruiterId) || undefined });
      if (res?.url) window.location.href = res.url;
    } catch (error) {
      setMessage({ severity: "error", text: error?.response?.data?.error || "Unable to start Google Calendar connection." });
    } finally {
      setSaving(false);
    }
  };

  const saveSetting = async (patch) => {
    if (!connected) return;
    setSaving(true);
    setMessage(null);
    try {
      await googleCalendarIntegration.saveSettings({ recruiter_id: Number(activeRecruiterId), ...patch });
      setMessage({ severity: "success", text: "Google Calendar settings updated." });
      await load(activeRecruiterId);
    } catch (error) {
      setMessage({ severity: "error", text: error?.response?.data?.error || "Unable to update Google Calendar settings." });
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    setSaving(true);
    try {
      await googleCalendarIntegration.disconnect({ recruiter_id: Number(activeRecruiterId) });
      setMessage({ severity: "success", text: "Google Calendar disconnected." });
      await load(activeRecruiterId);
    } catch (error) {
      setMessage({ severity: "error", text: error?.response?.data?.error || "Unable to disconnect Google Calendar." });
    } finally {
      setSaving(false);
    }
  };

  const handleRetry = async () => {
    setSaving(true);
    try {
      const res = await googleCalendarIntegration.retryFailed();
      const s = res?.summary || {};
      setMessage({ severity: "success", text: `Retry complete: ${s.synced || 0} synced, ${s.failed || 0} still failed.` });
      await load(activeRecruiterId);
    } catch (error) {
      setMessage({ severity: "error", text: error?.response?.data?.error || "Unable to retry failed syncs." });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!connected) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await googleCalendarIntegration.testConnection({ recruiter_id: Number(activeRecruiterId) });
      setMessage({
        severity: "success",
        text: res?.message || `Google Calendar access verified for ${res?.selected_calendar_name || "the selected calendar"}.`,
      });
      await load(activeRecruiterId);
    } catch (error) {
      setMessage({ severity: "error", text: error?.response?.data?.error || "Unable to verify Google Calendar access." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={2}>
      {loading && <LinearProgress />}
      {message && <Alert severity={message.severity} onClose={() => setMessage(null)}>{message.text}</Alert>}
      {!status?.configured && (
        <Alert severity="warning">
          Google Calendar is not configured on the server. Add Google OAuth credentials before connecting calendars.
        </Alert>
      )}

      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarMonthIcon color="primary" />
                <Typography variant="h6">Staff Calendar Connections</Typography>
                <Chip
                  size="small"
                  color={connected ? "success" : "default"}
                  label={connected ? "Connected" : "Not connected"}
                  sx={connected ? connectedChipSx : undefined}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Staff authorize their own Google accounts. Managers control how Schedulaa uses connected calendars for booking sync and optional busy-time blocking.
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Button startIcon={<RefreshIcon />} onClick={() => load(activeRecruiterId)} disabled={loading || saving}>Refresh</Button>
              {connected ? (
                <>
                  <Button variant="outlined" disabled={!canManage || saving} onClick={handleTestConnection}>Test access</Button>
                  <Button color="error" variant="outlined" startIcon={<LinkOffIcon />} disabled={!canManage || saving} onClick={handleDisconnect}>Disconnect</Button>
                </>
              ) : (
                <Button
                  variant="contained"
                  disabled={!canManage || saving || !status?.configured || !activeRecruiterId || !isSelf}
                  onClick={handleConnect}
                >
                  Connect my Google Calendar
                </Button>
              )}
            </Stack>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Staff calendar owner</InputLabel>
              <Select label="Staff calendar owner" value={String(activeRecruiterId || "")} onChange={(e) => setSelectedRecruiterId(e.target.value)}>
                {employees.map((employee) => (
                  <MenuItem key={employee.id} value={String(employee.id)}>{employee.name} · {employee.email}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Alert severity="info" variant="outlined">
              For staff-owned personal Google accounts, the staff member should connect from Employee Dashboard → My Calendar. The manager connection button is only for your own calendar or owner-operator setups.
            </Alert>

            {connected ? (
              <>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Connected account</Typography>
                    <Typography variant="body2" fontWeight={700}>{activeConnection?.provider_email || "Google account"}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Last sync</Typography>
                    <Typography variant="body2" fontWeight={700}>{fmt(activeConnection?.last_synced_at)}</Typography>
                  </Box>
                </Box>

                <FormControl size="small" fullWidth>
                  <InputLabel>Selected calendar</InputLabel>
                  <Select
                    label="Selected calendar"
                    value={activeConnection?.selected_calendar_id || ""}
                    onChange={(e) => {
                      const cal = calendars.find((item) => item.id === e.target.value);
                      saveSetting({ selected_calendar_id: e.target.value, selected_calendar_name: cal?.summary || e.target.value });
                    }}
                    disabled={!canManage || saving}
                  >
                    {calendars.map((calendar) => (
                      <MenuItem key={calendar.id} value={calendar.id}>{calendar.summary || calendar.id}{calendar.primary ? " · Primary" : ""}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Stack spacing={1}>
                  <FormControlLabel
                    control={<Switch checked={Boolean(activeConnection?.sync_enabled)} onChange={(e) => saveSetting({ sync_enabled: e.target.checked })} disabled={!canManage || saving} />}
                    label="Sync new and updated Schedulaa bookings to Google Calendar"
                  />
                  <Alert severity="info" sx={{ alignItems: "flex-start" }}>
                    Rollout order: test outbound booking sync first. Enable busy-time blocking only if this staff member wants Google “busy” events, including personal busy blocks, to reduce their public Schedulaa availability.
                  </Alert>
                  <FormControlLabel
                    control={<Switch checked={Boolean(activeConnection?.busy_blocking_enabled)} onChange={(e) => saveSetting({ busy_blocking_enabled: e.target.checked })} disabled={!canManage || saving} />}
                    label="Hide Google-busy times from public booking availability"
                  />
                </Stack>

                {activeConnection?.last_error && <Alert severity="warning">{activeConnection.last_error}</Alert>}
                {(activeConnection?.failed_sync_count || 0) > 0 && (
                  <Alert
                    severity="warning"
                    action={<Button color="inherit" size="small" onClick={handleRetry} disabled={!canManage || saving}>Retry</Button>}
                  >
                    {activeConnection.failed_sync_count} Google Calendar sync item{activeConnection.failed_sync_count === 1 ? "" : "s"} need attention.
                  </Alert>
                )}
              </>
            ) : (
              <Alert severity={isSelf ? "info" : "warning"}>
                {isSelf
                  ? "Connect your own Google Calendar here, or use Employee Dashboard → My Calendar. Bookings continue to work even if Google is not connected."
                  : "This staff member has not connected Google Calendar yet. Ask them to connect from Employee Dashboard → My Calendar; managers should not sign into an employee’s personal Google account."}
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={800} gutterBottom>Staff connection status</Typography>
          <Stack spacing={1}>
            {employees.map((employee) => {
              const row = (status?.connections || []).find((item) => String(item.recruiter_id) === String(employee.id));
              const rowConnected = Boolean(row?.connected);
              return (
                <Stack
                  key={employee.id}
                  direction={{ xs: "column", md: "row" }}
                  spacing={1}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", md: "center" }}
                  sx={{ p: 1.25, border: "1px solid", borderColor: "divider", borderRadius: 2 }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={800}>{employee.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{employee.email}</Typography>
                  </Box>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip
                      size="small"
                      color={rowConnected ? "success" : "default"}
                      label={rowConnected ? "Connected" : "Not connected"}
                      sx={rowConnected ? connectedChipSx : undefined}
                    />
                    {rowConnected && <Chip size="small" variant="outlined" label={row.provider_email || "Google account"} />}
                    {rowConnected && <Chip size="small" variant="outlined" label={row.selected_calendar_name || row.selected_calendar_id || "Calendar selected"} />}
                    {rowConnected && (
                      <Chip
                        size="small"
                        color={row.sync_enabled ? "success" : "default"}
                        label={row.sync_enabled ? "Sync on" : "Sync off"}
                        sx={row.sync_enabled ? statusChipSx("success") : statusChipSx("default")}
                      />
                    )}
                    {rowConnected && (
                      <Chip
                        size="small"
                        color={row.busy_blocking_enabled ? "warning" : "default"}
                        label={row.busy_blocking_enabled ? "Busy blocking on" : "Busy blocking off"}
                        sx={row.busy_blocking_enabled ? statusChipSx("warning") : statusChipSx("default")}
                      />
                    )}
                  </Stack>
                  <Box sx={{ minWidth: { md: 160 } }}>
                    <Typography variant="caption" color="text.secondary">Last sync</Typography>
                    <Typography variant="body2">{fmt(row?.last_synced_at)}</Typography>
                    {row?.last_error && <Typography variant="caption" color="warning.main">{row.last_error}</Typography>}
                    {!rowConnected && <Typography variant="caption" color="text.secondary">Employee must connect their own Google account.</Typography>}
                  </Box>
                </Stack>
              );
            })}
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={800} gutterBottom>Recent Google Calendar activity</Typography>
          <Stack spacing={1}>
            {activity.length === 0 && <Typography variant="body2" color="text.secondary">No Google Calendar activity yet.</Typography>}
            {activity.map((row) => (
              <Stack key={row.id} direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    size="small"
                    color={statusColor(row.status)}
                    label={row.status}
                    sx={statusChipSx(statusColor(row.status))}
                  />
                  <Box>
                    <Typography variant="body2">{row.operation} · {row.object_type} #{row.object_id || "-"}</Typography>
                    {row.message && <Typography variant="caption" color="text.secondary">{row.message}</Typography>}
                  </Box>
                </Stack>
                <Typography variant="caption" color="text.secondary">{fmt(row.created_at)}</Typography>
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
