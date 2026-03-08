import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import CloseIcon from "@mui/icons-material/Close";
import { api } from "../../../utils/api";

const normalizeSettings = (data = {}) => ({
  enabled: Boolean(data?.enabled),
  easypost_enabled: Boolean(data?.easypost_enabled),
  easypost_has_api_key: Boolean(data?.easypost_has_api_key),
  easypost_api_key_last4: data?.easypost_api_key_last4 || "",
  easypost_connected: Boolean(data?.easypost_connected),
  easypost_connected_at: data?.easypost_connected_at || null,
  easypost_last_tested_at: data?.easypost_last_tested_at || null,
  easypost_last_test_status: data?.easypost_last_test_status || "",
  easypost_last_test_message: data?.easypost_last_test_message || "",
  allow_pickup: Boolean(data?.allow_pickup),
  allow_shipping: data?.allow_shipping !== false,
  allow_local_delivery: Boolean(data?.allow_local_delivery),
  origin_name: data?.origin_name || "",
  origin_phone: data?.origin_phone || "",
  origin_country: data?.origin_country || "",
  origin_address1: data?.origin_address1 || "",
  origin_address2: data?.origin_address2 || "",
  origin_city: data?.origin_city || "",
  origin_region: data?.origin_region || "",
  origin_postal_code: data?.origin_postal_code || "",
  shipping_label_pickup: data?.shipping_label_pickup || "",
  shipping_label_shipping: data?.shipping_label_shipping || "",
  shipping_label_local_delivery: data?.shipping_label_local_delivery || "",
});

const EasyPostShippingSettingsPanel = ({ token: tokenProp = "", compact = false }) => {
  const token = tokenProp || localStorage.getItem("token") || "";
  const headers = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [clearApiKey, setClearApiKey] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [helpOpen, setHelpOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("delivery_methods");
  const isEasyPostMode = Boolean(settings?.easypost_enabled);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const res = await api.get("/inventory/shipping-settings", { headers });
      setSettings(normalizeSettings(res?.data));
    } catch (error) {
      const text = error?.response?.data?.error || error?.message || "Unable to load shipping settings.";
      setMessage({ type: "error", text });
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateField = useCallback((field, value) => {
    setSettings((prev) => ({ ...(prev || {}), [field]: value }));
  }, []);

  const saveSettings = useCallback(async () => {
    if (!settings) return;
    setSaving(true);
    setMessage({ type: "", text: "" });
    try {
      const payload = {
        enabled: Boolean(settings.enabled),
        easypost_enabled: Boolean(settings.easypost_enabled),
        allow_pickup: Boolean(settings.allow_pickup),
        allow_shipping: Boolean(settings.allow_shipping),
        allow_local_delivery: Boolean(settings.allow_local_delivery),
        origin_name: settings.origin_name || null,
        origin_phone: settings.origin_phone || null,
        origin_address1: settings.origin_address1 || null,
        origin_address2: settings.origin_address2 || null,
        origin_city: settings.origin_city || null,
        origin_region: settings.origin_region || null,
        origin_postal_code: settings.origin_postal_code || null,
        origin_country: settings.origin_country || null,
        shipping_label_pickup: settings.shipping_label_pickup || null,
        shipping_label_shipping: settings.shipping_label_shipping || null,
        shipping_label_local_delivery: settings.shipping_label_local_delivery || null,
      };
      const key = apiKeyInput.trim();
      if (key) payload.easypost_api_key = key;
      if (clearApiKey) payload.clear_easypost_api_key = true;

      const res = await api.post("/inventory/shipping-settings", payload, { headers });
      setSettings(normalizeSettings(res?.data));
      setApiKeyInput("");
      setClearApiKey(false);
      setMessage({ type: "success", text: "Shipping settings saved." });
    } catch (error) {
      const text = error?.response?.data?.error || error?.message || "Unable to save shipping settings.";
      setMessage({ type: "error", text });
    } finally {
      setSaving(false);
    }
  }, [settings, apiKeyInput, clearApiKey, headers]);

  const testConnection = useCallback(async () => {
    if (!settings) return;
    setTesting(true);
    setMessage({ type: "", text: "" });
    try {
      const payload = {};
      const key = apiKeyInput.trim();
      if (key) payload.easypost_api_key = key;
      const res = await api.post("/inventory/shipping-settings/test-connection", payload, { headers });
      const normalized = normalizeSettings(res?.data?.settings || settings);
      setSettings(normalized);
      setMessage({ type: "success", text: res?.data?.message || "EasyPost connection test completed." });
    } catch (error) {
      const text = error?.response?.data?.error || error?.message || "EasyPost connection test failed.";
      setMessage({ type: "error", text });
    } finally {
      setTesting(false);
    }
  }, [settings, apiKeyInput, headers]);

  const denseSx = compact ? { p: 0, border: 0, boxShadow: "none", backgroundColor: "transparent" } : {};

  return (
    <Box sx={denseSx}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight={700}>EasyPost shipping automation</Typography>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<HelpOutlineIcon />}
              onClick={() => setHelpOpen(true)}
            >
              Help
            </Button>
            <Button size="small" variant="text" onClick={loadSettings} disabled={loading}>
              {loading ? <CircularProgress size={16} /> : "Refresh"}
            </Button>
          </Stack>
        </Stack>

        <Typography variant="body2" color="text.secondary">
          Manage delivery policy and EasyPost automation settings here. Product Orders Actions tab remains unchanged.
        </Typography>

        {!settings && !loading && (
          <Button variant="outlined" onClick={loadSettings}>Load shipping settings</Button>
        )}

        {loading && (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">Loading shipping settings...</Typography>
          </Stack>
        )}

        {settings && (
          <Stack spacing={2}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" fontWeight={700}>
                Default shipping mode
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant={isEasyPostMode ? "outlined" : "contained"}
                  onClick={() => updateField("easypost_enabled", false)}
                >
                  Manual shipping
                </Button>
                <Button
                  size="small"
                  variant={isEasyPostMode ? "contained" : "outlined"}
                  onClick={() => updateField("easypost_enabled", true)}
                >
                  EasyPost automation
                </Button>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                The non-selected mode is read-only. Switch mode here anytime.
              </Typography>
            </Stack>

            <Tabs
              value={activeTab}
              onChange={(_, value) => setActiveTab(value)}
              variant="scrollable"
              allowScrollButtonsMobile
            >
              <Tab value="delivery_methods" label="Delivery Methods" />
              <Tab value="easypost" label="EasyPost Automation" />
            </Tabs>

            {activeTab === "delivery_methods" && (
              <Stack spacing={2}>
                <Alert severity="info">
                  These controls decide checkout delivery choices for clients (pickup, shipping, local delivery), independent of EasyPost.
                </Alert>
                {isEasyPostMode && (
                  <Alert severity="warning">
                    Delivery Methods controls are read-only while EasyPost automation is selected as default mode.
                  </Alert>
                )}
                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(settings.enabled)}
                          onChange={(e) => updateField("enabled", e.target.checked)}
                          disabled={isEasyPostMode}
                        />
                      }
                      label="Shipping settings enabled"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControlLabel control={<Switch checked={Boolean(settings.allow_pickup)} onChange={(e) => updateField("allow_pickup", e.target.checked)} disabled={isEasyPostMode} />} label="Allow pickup" />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControlLabel control={<Switch checked={Boolean(settings.allow_shipping)} onChange={(e) => updateField("allow_shipping", e.target.checked)} disabled={isEasyPostMode} />} label="Allow shipping" />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControlLabel control={<Switch checked={Boolean(settings.allow_local_delivery)} onChange={(e) => updateField("allow_local_delivery", e.target.checked)} disabled={isEasyPostMode} />} label="Allow local delivery" />
                  </Grid>
                </Grid>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Pickup label" value={settings.shipping_label_pickup} onChange={(e) => updateField("shipping_label_pickup", e.target.value)} disabled={isEasyPostMode} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Shipping label" value={settings.shipping_label_shipping} onChange={(e) => updateField("shipping_label_shipping", e.target.value)} disabled={isEasyPostMode} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Local delivery label" value={settings.shipping_label_local_delivery} onChange={(e) => updateField("shipping_label_local_delivery", e.target.value)} disabled={isEasyPostMode} /></Grid>
                </Grid>
              </Stack>
            )}

            {activeTab === "easypost" && (
              <Stack spacing={2}>
                <Alert severity="info">
                  EasyPost automates shipping rates and label purchase only. It does not decide which delivery method choices appear at checkout.
                </Alert>
                {!isEasyPostMode && (
                  <Alert severity="warning">
                    EasyPost controls are read-only while Manual shipping is selected as default mode.
                  </Alert>
                )}
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Chip
                    size="small"
                    color={settings.easypost_connected ? "success" : "default"}
                    label={settings.easypost_connected ? "Connected" : "Not connected"}
                  />
                  {settings.easypost_has_api_key && (
                    <Chip size="small" variant="outlined" label={`Key ••••${settings.easypost_api_key_last4 || ""}`} />
                  )}
                </Stack>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={4}>
                    <FormControlLabel
                      control={<Switch checked={clearApiKey} onChange={(e) => setClearApiKey(e.target.checked)} disabled={!isEasyPostMode} />}
                      label="Clear stored API key"
                    />
                  </Grid>
                </Grid>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={8}>
                    <TextField
                      fullWidth
                      size="small"
                      label="EasyPost API key"
                      placeholder={settings.easypost_has_api_key ? "Stored key exists (enter new key to rotate)" : "Enter EasyPost API key"}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      disabled={!isEasyPostMode}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Button fullWidth variant="outlined" onClick={testConnection} disabled={testing || !isEasyPostMode}>
                      {testing ? <CircularProgress size={18} /> : "Test connection"}
                    </Button>
                  </Grid>
                </Grid>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Origin name" value={settings.origin_name} onChange={(e) => updateField("origin_name", e.target.value)} disabled={!isEasyPostMode} /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Origin phone" value={settings.origin_phone} onChange={(e) => updateField("origin_phone", e.target.value)} disabled={!isEasyPostMode} /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Origin address 1" value={settings.origin_address1} onChange={(e) => updateField("origin_address1", e.target.value)} disabled={!isEasyPostMode} /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Origin address 2" value={settings.origin_address2} onChange={(e) => updateField("origin_address2", e.target.value)} disabled={!isEasyPostMode} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Origin city" value={settings.origin_city} onChange={(e) => updateField("origin_city", e.target.value)} disabled={!isEasyPostMode} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Origin region" value={settings.origin_region} onChange={(e) => updateField("origin_region", e.target.value)} disabled={!isEasyPostMode} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Origin postal code" value={settings.origin_postal_code} onChange={(e) => updateField("origin_postal_code", e.target.value)} disabled={!isEasyPostMode} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Origin country" value={settings.origin_country} onChange={(e) => updateField("origin_country", e.target.value)} disabled={!isEasyPostMode} /></Grid>
                </Grid>
              </Stack>
            )}

            <Stack direction="row" justifyContent="flex-end">
              <Button variant="contained" onClick={saveSettings} disabled={saving}>
                {saving ? <CircularProgress size={18} /> : "Save shipping settings"}
              </Button>
            </Stack>
          </Stack>
        )}

        {message.text && (
          <Alert severity={message.type === "error" ? "error" : "success"}>{message.text}</Alert>
        )}
      </Stack>

      <Dialog
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        fullWidth
        maxWidth="md"
        scroll="paper"
        sx={{ zIndex: (theme) => theme.zIndex.modal + 3000 }}
      >
        <DialogTitle sx={{ pr: 7 }}>
          <Typography variant="h6" fontWeight={700}>EasyPost Shipping Help</Typography>
          <IconButton
            size="small"
            onClick={() => setHelpOpen(false)}
            sx={{ position: "absolute", right: 16, top: 14 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 2.5 }}>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              This panel controls EasyPost connection and shipping defaults. Manual shipping remains available if EasyPost is disabled or unavailable.
            </Typography>

            <Box>
              <Typography variant="subtitle2" fontWeight={700}>1) Settings Panel (this page)</Typography>
              <Typography variant="body2">- Delivery Methods tab: controls checkout delivery choices and labels.</Typography>
              <Typography variant="body2">- EasyPost Automation tab: connection and shipping automation configuration.</Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" fontWeight={700}>2) Advanced Management</Typography>
              <Typography variant="body2">
                Use Advanced Management as the control entry point. If there are no product orders yet, order-level EasyPost actions will not appear.
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" fontWeight={700}>3) Product Orders (order-level actions)</Typography>
              <Typography variant="body2">- Open order detail -> Actions tab</Typography>
              <Typography variant="body2">- Refresh rates</Typography>
              <Typography variant="body2">- Select rate</Typography>
              <Typography variant="body2">- Buy label</Typography>
              <Typography variant="body2">- Open/print purchased label</Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" fontWeight={700}>Troubleshooting</Typography>
              <Typography variant="body2">- No rates: check EasyPost toggle, API key, origin address, and shipping destination completeness.</Typography>
              <Typography variant="body2">- Stale rate: refresh rates and reselect.</Typography>
              <Typography variant="body2">- Pickup/local delivery: manual flow can still be used.</Typography>
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default EasyPostShippingSettingsPanel;
