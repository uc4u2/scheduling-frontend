import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import api from "../../utils/api";

const EMPTY_SETTINGS = {
  customer_opening_message: "",
  customer_preparation_instructions: "",
  customer_closing_message: "",
  operational_opening_message: "",
  operational_closing_message: "",
};

const DEFAULT_LIMITS = {
  customer_opening_message: 600,
  customer_preparation_instructions: 1200,
  customer_closing_message: 600,
  operational_opening_message: 600,
  operational_closing_message: 600,
};

const FIELDS = [
  {
    key: "customer_opening_message",
    label: "Customer opening message",
    help: "A short welcome shown before the appointment details.",
    rows: 3,
  },
  {
    key: "customer_preparation_instructions",
    label: "Preparation / arrival instructions",
    help: "Share what the client should bring, do, or know before arriving.",
    rows: 4,
  },
  {
    key: "customer_closing_message",
    label: "Customer closing message / signature",
    help: "A friendly sign-off shown near the end of the confirmation.",
    rows: 3,
  },
  {
    key: "operational_opening_message",
    label: "Artist/manager opening message",
    help: "Shared introduction for provider and permitted team-booking copies.",
    rows: 3,
  },
  {
    key: "operational_closing_message",
    label: "Artist/manager closing message",
    help: "Shared sign-off for provider and permitted manager copies.",
    rows: 3,
  },
];

const errorMessage = (error, fallback) =>
  error?.response?.data?.error || error?.message || fallback;

export default function SettingsBookingEmails() {
  const token = useMemo(() => localStorage.getItem("token") || "", []);
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const [settings, setSettings] = useState(EMPTY_SETTINGS);
  const [limits, setLimits] = useState(DEFAULT_LIMITS);
  const [editable, setEditable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [audience, setAudience] = useState("customer");
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  const applyResponse = (data) => {
    setSettings({ ...EMPTY_SETTINGS, ...(data?.settings || {}) });
    setLimits({ ...DEFAULT_LIMITS, ...(data?.limits || {}) });
    setEditable(Boolean(data?.editable));
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/api/manager/booking-email-settings", { headers });
        if (!cancelled) applyResponse(data);
      } catch (error) {
        if (!cancelled) setNotice({ severity: "error", text: errorMessage(error, "Could not load booking email settings.") });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [headers]);

  useEffect(() => {
    if (loading) return undefined;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const { data } = await api.post(
          "/api/manager/booking-email-settings/preview",
          { audience, settings },
          { headers }
        );
        if (!cancelled) setPreview(data);
      } catch (error) {
        if (!cancelled) {
          setPreview(null);
          setNotice({ severity: "error", text: errorMessage(error, "Could not render the preview.") });
        }
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [audience, headers, loading, settings]);

  const updateField = (key, value) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(
        "/api/manager/booking-email-settings",
        settings,
        { headers }
      );
      applyResponse(data);
      setNotice({ severity: "success", text: "Booking email content saved." });
    } catch (error) {
      setNotice({ severity: "error", text: errorMessage(error, "Could not save booking email content.") });
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    setSaving(true);
    try {
      const { data } = await api.delete("/api/manager/booking-email-settings", { headers });
      applyResponse(data);
      setResetOpen(false);
      setNotice({ severity: "success", text: "Booking emails reset to Schedulaa defaults." });
    } catch (error) {
      setNotice({ severity: "error", text: errorMessage(error, "Could not reset booking email content.") });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>;
  }

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h6">Booking Emails</Typography>
        <Typography variant="body2" color="text.secondary">
          Personalize the shared booking confirmations for this company. Branding and appointment details continue to use your existing company settings.
        </Typography>
      </Box>

      {!editable && (
        <Alert severity="info">
          You can edit fields and preview unsaved changes. Only the current primary owner can save or reset this shared content.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} lg={5}>
          <Stack spacing={2}>
            {FIELDS.map((field) => {
              const limit = limits[field.key] || DEFAULT_LIMITS[field.key];
              const value = settings[field.key] || "";
              return (
                <TextField
                  key={field.key}
                  label={field.label}
                  value={value}
                  onChange={(event) => updateField(field.key, event.target.value)}
                  multiline
                  minRows={field.rows}
                  fullWidth
                  inputProps={{ maxLength: limit }}
                  helperText={`${field.help} ${value.length}/${limit}`}
                />
              );
            })}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button variant="contained" onClick={save} disabled={!editable || saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
              <Button variant="outlined" color="inherit" onClick={() => setResetOpen(true)} disabled={!editable || saving}>
                Reset to Schedulaa defaults
              </Button>
            </Stack>
          </Stack>
        </Grid>

        <Grid item xs={12} lg={7}>
          <Paper variant="outlined" sx={{ overflow: "hidden" }}>
            <Box sx={{ px: 2, pt: 1.5 }}>
              <Typography variant="subtitle1">Preview</Typography>
              <Typography variant="caption" color="text.secondary">
                Uses fictional sample data and reflects unsaved changes. No booking or email is created.
              </Typography>
              <Tabs value={audience} onChange={(_, value) => setAudience(value)} variant="scrollable" scrollButtons="auto">
                <Tab value="customer" label="Customer confirmation" />
                <Tab value="operational" label="Artist/manager notification" />
              </Tabs>
            </Box>
            <Divider />
            <Box sx={{ p: 2 }}>
              {previewLoading && !preview ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress size={28} /></Box>
              ) : (
                <>
                  <Typography variant="caption" color="text.secondary">Subject</Typography>
                  <Typography variant="body2" sx={{ mb: 1.5 }}>{preview?.subject || "Rendering preview…"}</Typography>
                  <Box sx={{ position: "relative" }}>
                    {previewLoading && <CircularProgress size={20} sx={{ position: "absolute", right: 12, top: 12, zIndex: 1 }} />}
                    <Box
                      component="iframe"
                      title={`${audience} booking email preview`}
                      sandbox=""
                      srcDoc={preview?.html || ""}
                      sx={{ width: "100%", minHeight: 680, border: "1px solid", borderColor: "divider", bgcolor: "common.white" }}
                    />
                  </Box>
                </>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={resetOpen} onClose={() => !saving && setResetOpen(false)}>
        <DialogTitle>Reset booking email content?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This clears only these five shared messages. Company branding, notification preferences, booking settings, and tenant data will not change.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetOpen(false)} disabled={saving}>Cancel</Button>
          <Button color="error" variant="contained" onClick={reset} disabled={saving}>Reset</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(notice)} autoHideDuration={4000} onClose={() => setNotice(null)}>
        <Alert severity={notice?.severity || "info"} onClose={() => setNotice(null)} sx={{ width: "100%" }}>
          {notice?.text}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
