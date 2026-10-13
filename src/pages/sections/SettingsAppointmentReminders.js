import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  Paper,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import SectionCard from "../../components/ui/SectionCard";
import api from "../../utils/api";

const DEFAULTS = {
  email_enabled: false,
  first_enabled: true,
  first_hours_before: 24,
  second_enabled: true,
  second_hours_before: 2,
};

const normalize = (value = {}) => ({
  ...DEFAULTS,
  ...value,
  email_enabled: Boolean(value.email_enabled),
  first_enabled: Boolean(value.first_enabled),
  second_enabled: Boolean(value.second_enabled),
  first_hours_before: Number(value.first_hours_before ?? DEFAULTS.first_hours_before),
  second_hours_before: Number(value.second_hours_before ?? DEFAULTS.second_hours_before),
});

const sameSettings = (left, right) =>
  Object.keys(DEFAULTS).every((key) => left?.[key] === right?.[key]);

const errorText = (error, fallback) =>
  error?.response?.data?.error || error?.message || fallback;

const currentAccountScope = () => [
  window.localStorage.getItem("company_id") || "",
  window.localStorage.getItem("token") || "",
].join(":");

const STATUS_LABELS = {
  scheduled: "Scheduled",
  queued: "Queued",
  provider_accepted: "Provider accepted",
  delivered: "Delivered",
  failed: "Failed",
  suppressed: "Suppressed",
  skipped: "Skipped",
  cancelled: "Cancelled",
  expired: "Expired",
  needs_reconciliation: "Needs review",
};

const statusColor = (status) => {
  if (status === "delivered") return "success";
  if (["failed", "suppressed", "needs_reconciliation"].includes(status)) return "error";
  if (["cancelled", "expired", "skipped"].includes(status)) return "default";
  return "info";
};

export default function SettingsAppointmentReminders() {
  const mounted = useRef(true);
  const requestGeneration = useRef(0);
  const [settings, setSettings] = useState(DEFAULTS);
  const [saved, setSaved] = useState(DEFAULTS);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [history, setHistory] = useState([]);
  const [bounds, setBounds] = useState({ minimum_hours: 1, maximum_hours: 336 });
  const [timezone, setTimezone] = useState("UTC");
  const [timezoneBehavior, setTimezoneBehavior] = useState("");
  const [runtimeEnabled, setRuntimeEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [notice, setNotice] = useState(null);

  const dirty = useMemo(() => !sameSettings(settings, saved), [saved, settings]);

  const applyResponse = useCallback((data) => {
    const next = normalize(data?.settings);
    setSettings(next);
    setSaved(next);
    setUpdatedAt(data?.updated_at || null);
    setHistory(Array.isArray(data?.history) ? data.history : []);
    setBounds((current) => ({ ...current, ...(data?.bounds || {}) }));
    setTimezone(data?.company_timezone || "UTC");
    setTimezoneBehavior(data?.timezone_behavior || "");
    setRuntimeEnabled(Boolean(data?.runtime_enabled));
  }, []);

  const load = useCallback(async () => {
    const generation = ++requestGeneration.current;
    const accountScope = currentAccountScope();
    setLoading(true);
    try {
      const { data } = await api.get("/api/manager/appointment-reminder-settings");
      if (
        mounted.current
        && requestGeneration.current === generation
        && currentAccountScope() === accountScope
      ) applyResponse(data);
    } catch (error) {
      if (
        mounted.current
        && requestGeneration.current === generation
        && currentAccountScope() === accountScope
      ) {
        setNotice({ severity: "error", text: errorText(error, "Could not load appointment reminder settings.") });
      }
    } finally {
      if (
        mounted.current
        && requestGeneration.current === generation
        && currentAccountScope() === accountScope
      ) setLoading(false);
    }
  }, [applyResponse]);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
      requestGeneration.current += 1;
    };
  }, [load]);

  const update = (key, value) => setSettings((current) => ({ ...current, [key]: value }));

  const save = async () => {
    const submitted = normalize(settings);
    const generation = requestGeneration.current;
    const accountScope = currentAccountScope();
    setSaving(true);
    try {
      const { data } = await api.put("/api/manager/appointment-reminder-settings", {
        ...submitted,
        expected_updated_at: updatedAt,
      });
      if (
        !mounted.current
        || requestGeneration.current !== generation
        || currentAccountScope() !== accountScope
      ) return;
      const serverSettings = normalize(data?.settings);
      setSaved(serverSettings);
      setSettings((current) => (sameSettings(current, submitted) ? serverSettings : current));
      setUpdatedAt(data?.updated_at || null);
      setHistory(Array.isArray(data?.history) ? data.history : []);
      setRuntimeEnabled(Boolean(data?.runtime_enabled));
      setNotice({ severity: "success", text: "Appointment reminder settings saved." });
    } catch (error) {
      if (
        mounted.current
        && requestGeneration.current === generation
        && currentAccountScope() === accountScope
      ) {
        const stale = error?.response?.data?.code === "stale_settings";
        setNotice({
          severity: "error",
          text: errorText(error, "Could not save appointment reminder settings."),
          action: stale ? "reload" : null,
        });
      }
    } finally {
      if (
        mounted.current
        && requestGeneration.current === generation
        && currentAccountScope() === accountScope
      ) setSaving(false);
    }
  };

  const renderPreview = async () => {
    const submitted = normalize(settings);
    const generation = requestGeneration.current;
    const accountScope = currentAccountScope();
    setPreviewing(true);
    try {
      const { data } = await api.post(
        "/api/manager/appointment-reminder-settings/preview",
        submitted
      );
      if (
        mounted.current
        && requestGeneration.current === generation
        && currentAccountScope() === accountScope
      ) setPreview(data);
    } catch (error) {
      if (
        mounted.current
        && requestGeneration.current === generation
        && currentAccountScope() === accountScope
      ) {
        setNotice({ severity: "error", text: errorText(error, "Could not render the reminder preview.") });
      }
    } finally {
      if (
        mounted.current
        && requestGeneration.current === generation
        && currentAccountScope() === accountScope
      ) setPreviewing(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}><CircularProgress /></Box>;
  }

  const timingField = (stage, label) => {
    const enabledKey = `${stage}_enabled`;
    const hoursKey = `${stage}_hours_before`;
    return (
      <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
        <Stack spacing={1.5}>
          <FormControlLabel
            control={<Switch checked={settings[enabledKey]} onChange={(event) => update(enabledKey, event.target.checked)} />}
            label={label}
          />
          <TextField
            label="Hours before appointment"
            type="number"
            value={settings[hoursKey]}
            onChange={(event) => update(hoursKey, Number(event.target.value))}
            disabled={!settings[enabledKey]}
            inputProps={{ min: bounds.minimum_hours, max: bounds.maximum_hours, step: 1 }}
            helperText={`${bounds.minimum_hours}-${bounds.maximum_hours} whole hours`}
            fullWidth
          />
        </Stack>
      </Paper>
    );
  };

  return (
    <>
      <SectionCard
        title="Appointment reminders"
        description="Email customers before confirmed service appointments. Interview reminders remain separate in Workspace settings."
      >
        <Stack spacing={2.5}>
          {!runtimeEnabled && (
            <Alert severity="info">
              Settings can be prepared now. Scheduled delivery is not active until the reminder Worker/Beat feature is enabled.
            </Alert>
          )}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2}>
              <Box>
                <Typography fontWeight={700}>Email reminders</Typography>
                <Typography variant="body2" color="text.secondary">
                  Existing companies start with reminders off. Only confirmed future appointments are eligible.
                </Typography>
              </Box>
              <Switch
                checked={settings.email_enabled}
                onChange={(event) => update("email_enabled", event.target.checked)}
                inputProps={{ "aria-label": "Enable appointment email reminders" }}
              />
            </Stack>
          </Paper>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>{timingField("first", "First reminder")}</Grid>
            <Grid item xs={12} md={6}>{timingField("second", "Second reminder")}</Grid>
          </Grid>

          <Alert severity="info" icon={false}>
            <Typography variant="body2" fontWeight={700}>Timezone: {timezone}</Typography>
            <Typography variant="caption">{timezoneBehavior}</Typography>
          </Alert>

          <Paper variant="outlined" sx={{ p: 2, opacity: 0.72 }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
              <Box>
                <Typography fontWeight={700}>SMS reminders</Typography>
                <Typography variant="body2" color="text.secondary">Not configured / Coming soon</Typography>
              </Box>
              <Switch disabled checked={false} inputProps={{ "aria-label": "SMS reminders coming soon" }} />
            </Stack>
          </Paper>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
            <Button variant="contained" onClick={save} disabled={saving || !dirty}>
              {saving ? "Saving…" : "Save reminder settings"}
            </Button>
            <Button variant="outlined" onClick={renderPreview} disabled={previewing}>
              {previewing ? "Preparing…" : "Preview email"}
            </Button>
            <Typography variant="caption" color={dirty ? "warning.main" : "success.main"} fontWeight={700}>
              {dirty ? "Unsaved changes" : "Saved"}
            </Typography>
          </Stack>

          {preview && (
            <Paper variant="outlined" sx={{ p: 2 }} aria-label="Appointment reminder preview">
              <Typography variant="overline" color="text.secondary">Preview — no email sent</Typography>
              <Typography fontWeight={700} sx={{ mb: 1 }}>{preview.subject}</Typography>
              <Box sx={{ color: "text.secondary", fontSize: 14, whiteSpace: "pre-wrap" }}>{preview.text}</Box>
            </Paper>
          )}

          <Divider />
          <Box>
            <Typography fontWeight={700}>Recent reminder activity</Typography>
            <Typography variant="caption" color="text.secondary">
              “Provider accepted” is not the same as confirmed delivery.
            </Typography>
          </Box>
          {history.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No appointment reminder activity yet.</Typography>
          ) : (
            <Stack spacing={1}>
              {history.map((item) => (
                <Paper key={item.id} variant="outlined" sx={{ p: 1.5 }}>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>Appointment #{item.appointment_id} · {item.stage} reminder</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Scheduled {new Date(item.scheduled_for).toLocaleString()}
                      </Typography>
                    </Box>
                    <Chip size="small" color={statusColor(item.status)} label={STATUS_LABELS[item.status] || "Unavailable"} />
                  </Stack>
                  {item.reason_code && <Typography variant="caption" color="text.secondary">Reason: {item.reason_code.replaceAll("_", " ")}</Typography>}
                </Paper>
              ))}
            </Stack>
          )}
        </Stack>
      </SectionCard>

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={notice?.action ? null : 5000}
        onClose={() => setNotice(null)}
      >
        <Alert
          severity={notice?.severity || "info"}
          onClose={() => setNotice(null)}
          action={notice?.action === "reload" ? <Button color="inherit" size="small" onClick={load}>Reload</Button> : null}
          sx={{ width: "100%" }}
        >
          {notice?.text}
        </Alert>
      </Snackbar>
    </>
  );
}
