import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Snackbar,
  Stack,
  Switch,
  TextField,
  FormControlLabel,
} from "@mui/material";
import SectionCard from "../../components/ui/SectionCard";
import api from "../../utils/api";
import { useTranslation } from "react-i18next";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const SettingsBookingReminders = () => {
  const { t } = useTranslation();
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  const loadPolicy = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/admin/booking-reminder-policy");
      const policyData = data?.policy || {};
      setPolicy({
        enabled: policyData.enabled ?? true,
        minutes_before_start: policyData.minutes_before_start ?? 60,
        window_minutes: policyData.window_minutes ?? 5,
      });
    } catch (err) {
      setError(err?.response?.data?.error || t("settings.reminders.loadError", "Unable to load reminder settings."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicy();
  }, []);

  const handleToggle = (event) => {
    setPolicy((prev) => ({ ...prev, enabled: event.target.checked }));
  };

  const handleNumberChange = (key) => (event) => {
    const raw = Number(event.target.value || 0);
    setPolicy((prev) => ({ ...prev, [key]: raw }));
  };

  const savePolicy = async () => {
    if (!policy) return;
    setSaving(true);
    try {
      const payload = {
        enabled: Boolean(policy.enabled),
        minutes_before_start: clamp(Number(policy.minutes_before_start || 0), 1, 1440),
      };
      const { data } = await api.put("/admin/booking-reminder-policy", payload);
      const nextPolicy = data?.policy || payload;
      setPolicy(nextPolicy);
      setSnackbar({
        open: true,
        severity: "success",
        message: t("settings.reminders.saved", "Reminder settings saved."),
      });
    } catch (err) {
      setSnackbar({
        open: true,
        severity: "error",
        message: err?.response?.data?.error || t("settings.reminders.saveError", "Failed to save reminder settings."),
      });
    } finally {
      setSaving(false);
    }
  };

  const renderBody = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={24} />
        </Box>
      );
    }
    if (error && !policy) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      );
    }
    if (!policy) return null;

    return (
      <Stack spacing={3}>
        <FormControlLabel
          control={<Switch checked={Boolean(policy.enabled)} onChange={handleToggle} />}
          label={t("settings.reminders.enabled", "Enable interview reminders")}
        />

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              type="number"
              label={t("settings.reminders.minutesBefore", "Minutes before start")}
              helperText={t(
                "settings.reminders.minutesBeforeHelper",
                "How long before the booking start time the reminder should be sent."
              )}
              value={policy.minutes_before_start}
              onChange={handleNumberChange("minutes_before_start")}
              fullWidth
              inputProps={{ min: 1, max: 1440 }}
            />
          </Grid>
        </Grid>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="flex-start">
          <Button variant="contained" onClick={savePolicy} disabled={saving}>
            {saving ? t("settings.common.saving", "Saving...") : t("settings.reminders.save", "Save reminders")}
          </Button>
          {error && (
            <Button variant="text" onClick={loadPolicy}>
              {t("settings.common.retry", "Retry loading settings")}
            </Button>
          )}
        </Stack>
      </Stack>
    );
  };

  return (
    <>
      <SectionCard
        title={t("settings.reminders.title", "Interview reminders")}
        description={t(
          "settings.reminders.description",
          "Control whether candidates receive interview reminders and how far ahead they are sent."
        )}
      >
        {renderBody()}
      </SectionCard>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SettingsBookingReminders;
