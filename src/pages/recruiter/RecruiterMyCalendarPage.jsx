import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import RefreshIcon from "@mui/icons-material/Refresh";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import { useLocation, useNavigate } from "react-router-dom";
import RecruiterTabs from "../../components/recruiter/RecruiterTabs";
import useRecruiterTabsAccess from "../../components/recruiter/useRecruiterTabsAccess";
import ManagementFrame from "../../components/ui/ManagementFrame";
import { employeeGoogleCalendarIntegration } from "../../utils/api";

const fmt = (value) => {
  if (!value) return "Never";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

const connectedChipSx = {
  bgcolor: "#15803d",
  color: "#ffffff",
  borderColor: "#166534",
  fontWeight: 800,
  "& .MuiChip-label": { px: 1 },
};

export default function RecruiterMyCalendarPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { allowHrAccess, isLoading } = useRecruiterTabsAccess();
  const [status, setStatus] = useState(null);
  const [calendars, setCalendars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const connected = Boolean(status?.connected);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await employeeGoogleCalendarIntegration.status();
      setStatus(payload);
      if (payload?.connected) {
        const cals = await employeeGoogleCalendarIntegration.calendars().catch(() => ({ calendars: [] }));
        setCalendars(cals.calendars || []);
      } else {
        setCalendars([]);
      }
    } catch (error) {
      setMessage({ severity: "error", text: error?.response?.data?.error || "Unable to load Google Calendar status." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleLocalTabChange = (value) => {
    const basePath = location.pathname.startsWith("/recruiter") ? "/recruiter/dashboard" : "/employee/dashboard";
    navigate(`${basePath}?tab=${value}`);
  };

  const handleConnect = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await employeeGoogleCalendarIntegration.connect();
      if (res?.url) window.location.href = res.url;
    } catch (error) {
      setMessage({ severity: "error", text: error?.response?.data?.error || "Unable to start Google Calendar connection." });
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await employeeGoogleCalendarIntegration.disconnect();
      setMessage({ severity: "success", text: "Google Calendar disconnected." });
      await load();
    } catch (error) {
      setMessage({ severity: "error", text: error?.response?.data?.error || "Unable to disconnect Google Calendar." });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await employeeGoogleCalendarIntegration.testConnection();
      setMessage({ severity: "success", text: res?.message || "Google Calendar access verified." });
      await load();
    } catch (error) {
      setMessage({ severity: "error", text: error?.response?.data?.error || "Unable to verify Google Calendar access." });
    } finally {
      setSaving(false);
    }
  };

  const handleCalendarChange = async (calendarId) => {
    const cal = calendars.find((item) => item.id === calendarId);
    setSaving(true);
    setMessage(null);
    try {
      await employeeGoogleCalendarIntegration.saveSettings({
        selected_calendar_id: calendarId,
        selected_calendar_name: cal?.summary || calendarId,
      });
      setMessage({ severity: "success", text: "Selected calendar updated." });
      await load();
    } catch (error) {
      setMessage({ severity: "error", text: error?.response?.data?.error || "Unable to update selected calendar." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ManagementFrame
      title="My Calendar"
      subtitle="Connect your own Google Calendar for Schedulaa bookings assigned to you."
      fullWidth
      sx={{ minHeight: "100vh", px: { xs: 1, md: 2 } }}
      disableContentCard
      contentSx={{ p: 0 }}
    >
      <RecruiterTabs
        localTab="my-calendar"
        onLocalTabChange={handleLocalTabChange}
        allowHrAccess={allowHrAccess}
        isLoading={isLoading}
      />
      <Stack spacing={2} sx={{ mt: 2 }}>
        {loading && <LinearProgress />}
        {message && <Alert severity={message.severity} onClose={() => setMessage(null)}>{message.text}</Alert>}
        {!status?.configured && (
          <Alert severity="warning">Google Calendar is not configured yet. Please contact your manager.</Alert>
        )}

        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CalendarMonthIcon color="primary" />
                    <Typography variant="h6" fontWeight={900}>Google Calendar</Typography>
                    <Chip
                      size="small"
                      color={connected ? "success" : "default"}
                      label={connected ? "Connected" : "Not connected"}
                      sx={connected ? connectedChipSx : undefined}
                    />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Authorize your own Google account so Schedulaa bookings assigned to you can be added to your selected calendar.
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Button startIcon={<RefreshIcon />} onClick={load} disabled={loading || saving}>Refresh</Button>
                  {connected ? (
                    <>
                      <Button variant="outlined" onClick={handleTest} disabled={saving}>Test access</Button>
                      <Button color="error" variant="outlined" startIcon={<LinkOffIcon />} onClick={handleDisconnect} disabled={saving}>Disconnect</Button>
                    </>
                  ) : (
                    <Button variant="contained" onClick={handleConnect} disabled={saving || !status?.configured}>Connect Google Calendar</Button>
                  )}
                </Stack>
              </Stack>

              <Alert severity="info" variant="outlined">
                Your manager controls whether Schedulaa uses this connection for booking sync and Google busy-time blocking. Schedulaa does not import your Google events.
              </Alert>

              {connected && (
                <>
                  <Divider />
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Connected account</Typography>
                      <Typography variant="body2" fontWeight={800}>{status?.provider_email || "Google account"}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Last sync</Typography>
                      <Typography variant="body2" fontWeight={800}>{fmt(status?.last_synced_at)}</Typography>
                    </Box>
                  </Box>

                  <FormControl size="small" fullWidth>
                    <InputLabel>Selected calendar</InputLabel>
                    <Select
                      label="Selected calendar"
                      value={status?.selected_calendar_id || ""}
                      onChange={(e) => handleCalendarChange(e.target.value)}
                      disabled={saving}
                    >
                      {calendars.map((calendar) => (
                        <MenuItem key={calendar.id} value={calendar.id}>{calendar.summary || calendar.id}{calendar.primary ? " · Primary" : ""}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {status?.last_error && <Alert severity="warning">{status.last_error}</Alert>}
                </>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </ManagementFrame>
  );
}
