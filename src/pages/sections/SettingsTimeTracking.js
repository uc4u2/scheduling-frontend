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
import { timeTracking } from "../../utils/api";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useTranslation } from "react-i18next";

const numericFields = [
  { key: "allow_early_clock_in_minutes", label: "Early clock-in window (minutes)", helper: "How many minutes before a shift starts an employee can clock in." },
  { key: "allow_late_clock_in_minutes", label: "Grace period for clock-in (minutes)", helper: "How long after the scheduled start they can still clock in without a manager." },
  { key: "allow_late_clock_out_minutes", label: "Grace period for clock-out (minutes)", helper: "How long after the scheduled end they can clock out." },
  { key: "rounding_minutes", label: "Rounding interval (minutes)", helper: "Rounding applied to approved entries (e.g., 15 = quarter hour)." },
  { key: "unpaid_break_minutes_over_6h", label: "Automatic unpaid break (>6h)", helper: "Minutes deducted automatically when approved hours exceed 6h." },
];

const SettingsTimeTracking = () => {
  const { t } = useTranslation();
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const [error, setError] = useState("");

  const loadPolicy = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await timeTracking.getSettings();
      setPolicy({
        enable_time_tracking: data.enable_time_tracking ?? true,
        allow_early_clock_in_minutes: data.allow_early_clock_in_minutes ?? 15,
        allow_late_clock_in_minutes: data.allow_late_clock_in_minutes ?? 60,
        allow_late_clock_out_minutes: data.allow_late_clock_out_minutes ?? 60,
        rounding_minutes: data.rounding_minutes ?? 15,
        unpaid_break_minutes_over_6h: data.unpaid_break_minutes_over_6h ?? 30,
        require_manager_approval: data.require_manager_approval ?? true,
      });
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to load time-tracking settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicy();
  }, []);

  const handleToggle = (key) => (event) => {
    setPolicy((prev) => ({ ...prev, [key]: event.target.checked }));
  };

  const handleNumberChange = (key) => (event) => {
    const raw = Number(event.target.value || 0);
    setPolicy((prev) => ({ ...prev, [key]: Math.max(0, raw) }));
  };

  const save = async () => {
    if (!policy) return;
    setSaving(true);
    try {
      await timeTracking.saveSettings(policy);
      setSnackbar({
        open: true,
        severity: "success",
        message: t("settings.timeTracking.toastSaved", "Time tracking policy saved."),
      });
    } catch (err) {
      setSnackbar({
        open: true,
        severity: "error",
        message: err?.response?.data?.error || t("settings.timeTracking.toastError", "Failed to save settings."),
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
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(policy.enable_time_tracking)}
                onChange={handleToggle("enable_time_tracking")}
              />
            }
            label={t("settings.timeTracking.enableClock", "Enable employee clock-in/out")}
          />
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(policy.require_manager_approval)}
                onChange={handleToggle("require_manager_approval")}
              />
            }
            label={t("settings.timeTracking.requireApproval", "Require manager approval before payroll")}
          />
        </Stack>

        <Grid container spacing={2}>
          {numericFields.map((field) => (
            <Grid item xs={12} md={6} key={field.key}>
              <TextField
                type="number"
                label={t(`settings.timeTracking.fields.${field.key}.label`, field.label)}
                fullWidth
                value={policy[field.key]}
                onChange={handleNumberChange(field.key)}
                helperText={t(`settings.timeTracking.fields.${field.key}.helper`, field.helper)}
                inputProps={{ min: 0 }}
              />
            </Grid>
          ))}
        </Grid>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="flex-start">
          <Button variant="contained" onClick={save} disabled={saving}>
            {saving ? t("settings.common.saving", "Saving...") : t("settings.timeTracking.actions.save", "Save policy")}
          </Button>
          {error && (
            <Button variant="text" startIcon={<InfoOutlinedIcon />} onClick={loadPolicy}>
              {t("settings.common.retry", "Retry loading policy")}
            </Button>
          )}
        </Stack>
      </Stack>
    );
  };

  return (
    <>
      <SectionCard
        title={t("settings.timeTracking.title", "Time tracking")}
        description={t(
          "settings.timeTracking.description",
          "Control whether employees can clock in/out, define grace windows, and enforce approval rules."
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

export default SettingsTimeTracking;
