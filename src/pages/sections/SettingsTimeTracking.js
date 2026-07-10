import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  Grid,
  MenuItem,
  Snackbar,
  Stack,
  Switch,
  TextField,
  FormControlLabel,
  Typography,
} from "@mui/material";
import SectionCard from "../../components/ui/SectionCard";
import { timeTracking } from "../../utils/api";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import { useTranslation } from "react-i18next";

const numericFields = [
  { key: "allow_early_clock_in_minutes", label: "Early clock-in window (minutes)", helper: "How many minutes before a shift starts an employee can clock in." },
  { key: "allow_late_clock_in_minutes", label: "Grace period for clock-in (minutes)", helper: "How long after the scheduled start they can still clock in without a manager." },
  { key: "allow_late_clock_out_minutes", label: "Grace period for clock-out (minutes)", helper: "How long after the scheduled end they can clock out." },
  { key: "attestation_early_clock_out_threshold_minutes", label: "Early clock-out attestation threshold (minutes)", helper: "Only ask for an early clock-out reason when the employee clocks out earlier than this threshold." },
  { key: "rounding_minutes", label: "Rounding interval (minutes)", helper: "Rounding applied to approved entries (e.g., 15 = quarter hour)." },
  { key: "unpaid_break_minutes_over_6h", label: "Automatic unpaid break (>6h)", helper: "Minutes deducted automatically when approved hours exceed 6h." },
];

const formatRecordedAt = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString();
};

const SettingsTimeTracking = () => {
  const { t } = useTranslation();
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const [error, setError] = useState("");
  const [dispatchEmployerAck, setDispatchEmployerAck] = useState(false);
  const [dispatchClientShareAck, setDispatchClientShareAck] = useState(false);
  const [policyTemplateOpen, setPolicyTemplateOpen] = useState(false);
  const [policyTemplateLoading, setPolicyTemplateLoading] = useState(false);
  const [policyTemplate, setPolicyTemplate] = useState({ content: "", filename: "" });

  const loadPolicy = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await timeTracking.getSettings();
      setPolicy({
        enable_time_tracking: data.enable_time_tracking ?? true,
        enable_shift_attestations: data.enable_shift_attestations ?? false,
        require_injury_free_attestation: data.require_injury_free_attestation ?? false,
        allow_early_clock_in_minutes: data.allow_early_clock_in_minutes ?? 15,
        allow_late_clock_in_minutes: data.allow_late_clock_in_minutes ?? 60,
        allow_late_clock_out_minutes: data.allow_late_clock_out_minutes ?? 60,
        attestation_early_clock_out_threshold_minutes: data.attestation_early_clock_out_threshold_minutes ?? 5,
        rounding_minutes: data.rounding_minutes ?? 15,
        unpaid_break_minutes_over_6h: data.unpaid_break_minutes_over_6h ?? 30,
        require_manager_approval: data.require_manager_approval ?? true,
        punch_location_mode: data.punch_location_mode || "off",
        enable_dispatch_tracking: data.enable_dispatch_tracking ?? false,
        auto_send_dispatch_link_to_client: data.auto_send_dispatch_link_to_client ?? false,
        dispatch_tracking_policy_version: data.dispatch_tracking_policy_version || "v1",
        dispatch_tracking_ack_required: data.dispatch_tracking_ack_required ?? true,
        dispatch_tracking_employer_acknowledged_at: data.dispatch_tracking_employer_acknowledged_at || "",
        dispatch_tracking_employer_acknowledged_by: data.dispatch_tracking_employer_acknowledged_by || "",
        dispatch_tracking_client_share_acknowledged_at: data.dispatch_tracking_client_share_acknowledged_at || "",
        dispatch_tracking_client_share_acknowledged_by: data.dispatch_tracking_client_share_acknowledged_by || "",
        dispatch_tracking_retention_days: data.dispatch_tracking_retention_days ?? 30,
        dispatch_tracking_link_expiry_mode: data.dispatch_tracking_link_expiry_mode || "arrived",
        dispatch_tracking_auto_stop_on_arrived: data.dispatch_tracking_auto_stop_on_arrived ?? true,
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

  const handleSelectChange = (key) => (event) => {
    setPolicy((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const save = async () => {
    if (!policy) return;
    const requiresEmployerAck = policy.enable_dispatch_tracking && !policy.dispatch_tracking_employer_acknowledged_at;
    const requiresClientAck = policy.auto_send_dispatch_link_to_client && !policy.dispatch_tracking_client_share_acknowledged_at;
    if (requiresEmployerAck && !dispatchEmployerAck) {
      setSnackbar({
        open: true,
        severity: "error",
        message: "You must confirm the employer dispatch-tracking acknowledgment before enabling this feature.",
      });
      return;
    }
    if (requiresClientAck && !dispatchClientShareAck) {
      setSnackbar({
        open: true,
        severity: "error",
        message: "You must confirm the client-share acknowledgment before auto-sending tracking links.",
      });
      return;
    }
    setSaving(true);
    try {
      await timeTracking.saveSettings({
        ...policy,
        dispatch_tracking_employer_ack: dispatchEmployerAck ? { accepted: true, policy_version: policy.dispatch_tracking_policy_version || "v1" } : undefined,
        dispatch_tracking_client_share_ack: dispatchClientShareAck ? { accepted: true, policy_version: policy.dispatch_tracking_policy_version || "v1" } : undefined,
      });
      setDispatchEmployerAck(false);
      setDispatchClientShareAck(false);
      await loadPolicy();
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

  const downloadDispatchTemplate = async () => {
    try {
      const payload = await timeTracking.getDispatchPolicyTemplate();
      const blob = new Blob([payload?.content || ""], { type: "text/plain;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = payload?.filename || "schedulaa-dispatch-policy-template.txt";
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setSnackbar({
        open: true,
        severity: "error",
        message: err?.response?.data?.error || "Unable to download the policy template.",
      });
    }
  };

  const loadDispatchTemplate = async () => {
    setPolicyTemplateLoading(true);
    try {
      const payload = await timeTracking.getDispatchPolicyTemplate();
      setPolicyTemplate({
        content: payload?.content || "",
        filename: payload?.filename || "schedulaa-dispatch-policy-template.txt",
      });
      return payload;
    } catch (err) {
      setSnackbar({
        open: true,
        severity: "error",
        message: err?.response?.data?.error || "Unable to load the policy template.",
      });
      return null;
    } finally {
      setPolicyTemplateLoading(false);
    }
  };

  const openPolicyTemplate = async () => {
    setPolicyTemplateOpen(true);
    if (!policyTemplate.content) {
      await loadDispatchTemplate();
    }
  };

  const copyDispatchTemplate = async () => {
    const content = policyTemplate.content || (await loadDispatchTemplate())?.content || "";
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setSnackbar({
        open: true,
        severity: "success",
        message: "Employee policy template copied.",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        severity: "error",
        message: "Unable to copy the policy template.",
      });
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
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(policy.enable_shift_attestations)}
                onChange={handleToggle("enable_shift_attestations")}
              />
            }
            label={t("settings.timeTracking.enableAttestations", "Enable shift attestations")}
          />
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(policy.require_injury_free_attestation)}
                onChange={handleToggle("require_injury_free_attestation")}
                disabled={!policy.enable_shift_attestations}
              />
            }
            label={t("settings.timeTracking.injuryFreeAttestation", "Ask injury-free confirmation on clock out")}
          />
        </Stack>

        {policy.enable_shift_attestations && (
          <Alert severity="info" sx={{ py: 0.5 }}>
            Employees only see attestation prompts after clock out or end break when a configured exception is detected.
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              select
              label={t("settings.timeTracking.fields.punch_location_mode.label", "Punch location evidence")}
              fullWidth
              value={policy.punch_location_mode || "off"}
              onChange={handleSelectChange("punch_location_mode")}
              helperText={t(
                "settings.timeTracking.fields.punch_location_mode.helper",
                "Optional mode attempts one foreground location capture during clock in/out. It never blocks punching."
              )}
            >
              <MenuItem value="off">{t("settings.timeTracking.locationMode.off", "Off")}</MenuItem>
              <MenuItem value="optional">{t("settings.timeTracking.locationMode.optional", "Optional evidence")}</MenuItem>
            </TextField>
          </Grid>
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

        <SectionCard
          title="Dispatch tracking"
          description="Trip-only location sharing for On my way, manager dispatch visibility, and optional client tracking links."
        >
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip size="small" label={`Policy ${policy.dispatch_tracking_policy_version || "v1"}`} color="primary" variant="outlined" />
              <Chip size="small" label="Trip-only tracking" variant="outlined" />
              {policy.dispatch_tracking_ack_required ? <Chip size="small" label="Employee acknowledgment required" variant="outlined" /> : null}
            </Stack>
            <FormControlLabel
              control={(
                <Switch
                  checked={Boolean(policy.enable_dispatch_tracking)}
                  onChange={handleToggle("enable_dispatch_tracking")}
                />
              )}
              label="Enable On my way trip tracking"
            />
            <FormControlLabel
              control={(
                <Switch
                  checked={Boolean(policy.auto_send_dispatch_link_to_client)}
                  onChange={handleToggle("auto_send_dispatch_link_to_client")}
                  disabled={!policy.enable_dispatch_tracking}
                />
              )}
              label="Auto-send tracking link to client when employee taps On my way"
            />
            <FormControlLabel
              control={(
                <Switch
                  checked={Boolean(policy.dispatch_tracking_auto_stop_on_arrived)}
                  onChange={handleToggle("dispatch_tracking_auto_stop_on_arrived")}
                  disabled={!policy.enable_dispatch_tracking}
                />
              )}
              label="Stop tracking automatically when employee marks Arrived"
            />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Trip location retention"
                  value={policy.dispatch_tracking_retention_days}
                  onChange={handleNumberChange("dispatch_tracking_retention_days")}
                  disabled={!policy.enable_dispatch_tracking}
                  helperText="How long trip logs and trip-location records stay available by default."
                >
                  <MenuItem value={7}>7 days</MenuItem>
                  <MenuItem value={30}>30 days</MenuItem>
                  <MenuItem value={90}>90 days</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Client link expiry rule"
                  value={policy.dispatch_tracking_link_expiry_mode || "arrived"}
                  onChange={handleSelectChange("dispatch_tracking_link_expiry_mode")}
                  disabled={!policy.enable_dispatch_tracking}
                  helperText="Default rule for client trip links. Managers can still revoke any link manually."
                >
                  <MenuItem value="arrived">When employee arrives</MenuItem>
                  <MenuItem value="two_hours">2 hours after link creation</MenuItem>
                  <MenuItem value="manual">Only when manually revoked</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            <Alert severity="warning" sx={{ py: 0.5 }}>
              Use this only for active assigned trips after employees have been informed.
            </Alert>
            <Stack spacing={1} sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "background.paper" }}>
              <Typography variant="subtitle2">Recorded acknowledgment status</Typography>
              <Stack spacing={0.75}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>Employer dispatch tracking</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {policy.dispatch_tracking_employer_acknowledged_at
                      ? `Recorded ${formatRecordedAt(policy.dispatch_tracking_employer_acknowledged_at)}${policy.dispatch_tracking_employer_acknowledged_by ? ` by ${policy.dispatch_tracking_employer_acknowledged_by}` : ""}.`
                      : "Required before dispatch tracking can be enabled."}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={600}>Client link sharing</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {policy.dispatch_tracking_client_share_acknowledged_at
                      ? `Recorded ${formatRecordedAt(policy.dispatch_tracking_client_share_acknowledged_at)}${policy.dispatch_tracking_client_share_acknowledged_by ? ` by ${policy.dispatch_tracking_client_share_acknowledged_by}` : ""}.`
                      : "Required before tracking links can be auto-sent to clients."}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
            {!policy.dispatch_tracking_employer_acknowledged_at ? (
              <Stack spacing={0.5}>
                <FormControlLabel
                  control={<Checkbox checked={dispatchEmployerAck} onChange={(event) => setDispatchEmployerAck(event.target.checked)} />}
                  label="I confirm this business is authorized to use trip-only employee location tracking and will give written notice before use."
                />
              </Stack>
            ) : null}
            {!policy.dispatch_tracking_client_share_acknowledged_at ? (
              <FormControlLabel
                control={<Checkbox checked={dispatchClientShareAck} onChange={(event) => setDispatchClientShareAck(event.target.checked)} />}
                label="I confirm clients may receive temporary live trip links only for active assigned visits."
              />
            ) : null}
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
              <Button
                variant="outlined"
                startIcon={<DescriptionOutlinedIcon />}
                onClick={openPolicyTemplate}
              >
                View employee policy template
              </Button>
              <Button
                variant="outlined"
                startIcon={<ContentCopyOutlinedIcon />}
                onClick={copyDispatchTemplate}
              >
                Copy template
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadOutlinedIcon />}
                onClick={downloadDispatchTemplate}
              >
                Download employee policy template
              </Button>
            </Stack>
            <Alert severity="info" sx={{ py: 0.5 }}>
              Separate from punch-location evidence. This only applies while the employee is On my way for an assigned work order.
            </Alert>
          </Stack>
        </SectionCard>

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
      <Drawer
        anchor="right"
        open={policyTemplateOpen}
        onClose={() => setPolicyTemplateOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 520 },
            p: 0,
          },
        }}
      >
        <Stack spacing={0} sx={{ height: "100%" }}>
          <Box sx={{ p: 3, pb: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Employee policy template
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                  Review and adapt this template for your company before asking employees to sign it.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="outlined" startIcon={<ContentCopyOutlinedIcon />} onClick={copyDispatchTemplate}>
                  Copy
                </Button>
                <Button size="small" variant="outlined" startIcon={<DownloadOutlinedIcon />} onClick={downloadDispatchTemplate}>
                  Download
                </Button>
              </Stack>
            </Stack>
            <Alert severity="info" sx={{ mt: 2 }}>
              This template is provided for operational convenience only and should be reviewed and adapted for your company, workforce, and jurisdiction.
            </Alert>
          </Box>
          <Divider />
          <Box sx={{ flex: 1, overflow: "auto", p: 3, bgcolor: "background.default" }}>
            {policyTemplateLoading ? (
              <Box display="flex" justifyContent="center" py={6}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Box
                component="pre"
                sx={{
                  m: 0,
                  p: 2,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                  fontFamily: "Monaco, Menlo, Consolas, monospace",
                  fontSize: 13,
                  lineHeight: 1.55,
                }}
              >
                {policyTemplate.content || "No template content is available yet."}
              </Box>
            )}
          </Box>
        </Stack>
      </Drawer>
    </>
  );
};

export default SettingsTimeTracking;
