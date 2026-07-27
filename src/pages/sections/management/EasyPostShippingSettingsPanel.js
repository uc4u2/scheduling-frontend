import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
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
  MenuItem,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import CloseIcon from "@mui/icons-material/Close";
import { api } from "../../../utils/api";
import CommerceCopilotDrawer from "../../../components/commerce-copilot/CommerceCopilotDrawer";

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
  address_verification_enabled: data?.address_verification_enabled !== false,
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
  default_package_profile_id: data?.default_package_profile_id || null,
  destination_policy_preset: data?.destination_policy_preset || "domestic_only",
  destination_policy_mode: data?.destination_policy_mode || data?.destination_policy_preset || "domestic_only",
  allowed_destination_countries: Array.isArray(data?.allowed_destination_countries) ? data.allowed_destination_countries : [],
  allowed_destination_country_options: Array.isArray(data?.allowed_destination_country_options) ? data.allowed_destination_country_options : [],
  country_catalog: Array.isArray(data?.country_catalog) ? data.country_catalog : [],
  international_address_verification_mode: data?.international_address_verification_mode || "best_effort",
  international_shipping_policy: data?.international_shipping_policy || "buyer_pays_on_import",
  international_shipping_note: data?.international_shipping_note || "",
  international_shipping_terms_url: data?.international_shipping_terms_url || "",
  require_import_charges_acknowledgement: data?.require_import_charges_acknowledgement !== false,
  email_customer_order_shipped: data?.email_customer_order_shipped !== false,
  email_customer_order_delivered: data?.email_customer_order_delivered !== false,
  email_customer_delivery_exception: data?.email_customer_delivery_exception !== false,
  email_manager_delivery_exception: data?.email_manager_delivery_exception !== false,
  email_customer_ready_for_pickup: data?.email_customer_ready_for_pickup !== false,
  customs_certify: data?.customs_certify !== false,
  customs_signer: data?.customs_signer || "",
  customs_contents_type: data?.customs_contents_type || "merchandise",
  customs_contents_explanation: data?.customs_contents_explanation || "",
  customs_non_delivery_option: data?.customs_non_delivery_option || "return",
  customs_restriction_type: data?.customs_restriction_type || "none",
  customs_restriction_comments: data?.customs_restriction_comments || "",
  us_export_filing_mode: data?.us_export_filing_mode || "not_configured",
  us_export_filing_citation: data?.us_export_filing_citation || "",
  us_noeei_eligibility_confirmed_at: data?.us_noeei_eligibility_confirmed_at || null,
  us_noeei_eligibility_confirmed_by: data?.us_noeei_eligibility_confirmed_by || "",
  package_profiles: Array.isArray(data?.package_profiles) ? data.package_profiles : [],
  readiness: data?.readiness || { ready: false, checklist: [] },
  shipping_label_pickup: data?.shipping_label_pickup || "",
  shipping_label_shipping: data?.shipping_label_shipping || "",
  shipping_label_local_delivery: data?.shipping_label_local_delivery || "",
});

const labelWithHint = (label, hint) => (
  <Stack direction="row" spacing={0.5} alignItems="center">
    <span>{label}</span>
    <Tooltip title={hint} arrow placement="top">
      <HelpOutlineIcon sx={{ fontSize: 14, color: "text.secondary", cursor: "help" }} />
    </Tooltip>
  </Stack>
);

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
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [packageProfileForm, setPackageProfileForm] = useState({
    name: "",
    length_mm: "",
    width_mm: "",
    height_mm: "",
    tare_weight_grams: "",
    packaging_type: "",
    is_default: false,
  });
  const [editingPackageProfileId, setEditingPackageProfileId] = useState(null);
  const isEasyPostMode = Boolean(settings?.easypost_enabled);
  const destinationPolicyMode = settings?.destination_policy_mode || settings?.destination_policy_preset || "domestic_only";
  const selectedCountryOptions = useMemo(() => {
    const selected = Array.isArray(settings?.allowed_destination_countries) ? settings.allowed_destination_countries : [];
    const catalog = Array.isArray(settings?.country_catalog) ? settings.country_catalog : [];
    return catalog.filter((row) => selected.includes(row.code));
  }, [settings?.allowed_destination_countries, settings?.country_catalog]);

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
        address_verification_enabled: settings.address_verification_enabled !== false,
        international_shipping_policy: settings.international_shipping_policy || "buyer_pays_on_import",
        international_shipping_note: settings.international_shipping_note || null,
        international_shipping_terms_url: settings.international_shipping_terms_url || null,
        require_import_charges_acknowledgement: settings.require_import_charges_acknowledgement !== false,
        email_customer_order_shipped: settings.email_customer_order_shipped !== false,
        email_customer_order_delivered: settings.email_customer_order_delivered !== false,
        email_customer_delivery_exception: settings.email_customer_delivery_exception !== false,
        email_manager_delivery_exception: settings.email_manager_delivery_exception !== false,
        email_customer_ready_for_pickup: settings.email_customer_ready_for_pickup !== false,
        customs_certify: settings.customs_certify !== false,
        customs_signer: settings.customs_signer || null,
        customs_contents_type: settings.customs_contents_type || "merchandise",
        customs_contents_explanation: settings.customs_contents_explanation || null,
        customs_non_delivery_option: settings.customs_non_delivery_option || "return",
        customs_restriction_type: settings.customs_restriction_type || "none",
        customs_restriction_comments: settings.customs_restriction_comments || null,
        us_export_filing_mode: settings.us_export_filing_mode || "not_configured",
        us_export_filing_citation: settings.us_export_filing_citation || null,
        us_noeei_eligibility_confirmed: Boolean(settings.us_noeei_eligibility_confirmed_at || settings.us_noeei_eligibility_confirmed_by),
        default_package_profile_id: settings.default_package_profile_id || null,
        destination_policy_preset: settings.destination_policy_mode || settings.destination_policy_preset || "domestic_only",
        destination_policy_mode: settings.destination_policy_mode || settings.destination_policy_preset || "domestic_only",
        destination_countries: Array.isArray(settings.allowed_destination_countries)
          ? settings.allowed_destination_countries
          : [],
        international_address_verification_mode: settings.international_address_verification_mode || "best_effort",
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

  const resetPackageProfileForm = useCallback(() => {
    setPackageProfileForm({
      name: "",
      length_mm: "",
      width_mm: "",
      height_mm: "",
      tare_weight_grams: "",
      packaging_type: "",
      is_default: false,
    });
    setEditingPackageProfileId(null);
  }, []);

  const savePackageProfile = useCallback(async () => {
    try {
      const payload = {
        ...packageProfileForm,
        length_mm: Number(packageProfileForm.length_mm || 0),
        width_mm: Number(packageProfileForm.width_mm || 0),
        height_mm: Number(packageProfileForm.height_mm || 0),
        tare_weight_grams: Number(packageProfileForm.tare_weight_grams || 0),
      };
      if (editingPackageProfileId) {
        await api.patch(`/inventory/shipping/package-profiles/${editingPackageProfileId}`, payload, { headers });
      } else {
        await api.post("/inventory/shipping/package-profiles", payload, { headers });
      }
      resetPackageProfileForm();
      await loadSettings();
      setMessage({ type: "success", text: editingPackageProfileId ? "Package profile updated." : "Package profile created." });
    } catch (error) {
      const text =
        error?.response?.data?.error ||
        error?.message ||
        (editingPackageProfileId ? "Unable to update package profile." : "Unable to create package profile.");
      setMessage({ type: "error", text });
    }
  }, [editingPackageProfileId, headers, loadSettings, packageProfileForm, resetPackageProfileForm]);

  const startEditPackageProfile = useCallback((profile) => {
    setEditingPackageProfileId(profile.id);
    setPackageProfileForm({
      name: profile.name || "",
      length_mm: String(profile.length_mm || ""),
      width_mm: String(profile.width_mm || ""),
      height_mm: String(profile.height_mm || ""),
      tare_weight_grams: String(profile.tare_weight_grams || 0),
      packaging_type: profile.packaging_type || "",
      is_default: Boolean(profile.is_default),
    });
  }, []);

  const deletePackageProfile = useCallback(async (profileId) => {
    try {
      await api.delete(`/inventory/shipping/package-profiles/${profileId}`, { headers });
      if (editingPackageProfileId === profileId) {
        resetPackageProfileForm();
      }
      await loadSettings();
      setMessage({ type: "success", text: "Package profile archived." });
    } catch (error) {
      const text = error?.response?.data?.error || error?.message || "Unable to archive package profile.";
      setMessage({ type: "error", text });
    }
  }, [editingPackageProfileId, headers, loadSettings, resetPackageProfileForm]);

  const setDefaultPackage = useCallback(async (profileId) => {
    try {
      await api.patch("/inventory/shipping-settings", { default_package_profile_id: profileId }, { headers });
      await loadSettings();
      setMessage({ type: "success", text: "Default package updated." });
    } catch (error) {
      const text = error?.response?.data?.error || error?.message || "Unable to update default package.";
      setMessage({ type: "error", text });
    }
  }, [headers, loadSettings]);

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
              onClick={() => setCopilotOpen(true)}
            >
              Configure shipping with AI
            </Button>
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
          Manage delivery policy and EasyPost automation settings here. This panel is opened from Products -> Delivery setup. Product Orders Actions tab remains unchanged.
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
                  <Chip
                    size="small"
                    color={settings.address_verification_enabled !== false ? "info" : "default"}
                    variant={settings.address_verification_enabled !== false ? "filled" : "outlined"}
                    label={settings.address_verification_enabled !== false ? "Address verification enabled" : "Address verification disabled"}
                  />
                  {settings.easypost_has_api_key && (
                    <Chip size="small" variant="outlined" label={`Key ••••${settings.easypost_api_key_last4 || ""}`} />
                  )}
                </Stack>
                <Alert severity={settings.address_verification_enabled !== false ? "info" : "warning"}>
                  {settings.address_verification_enabled !== false
                    ? "Customer shipping addresses are verified before live rates are shown. Pickup and local delivery are not affected."
                    : "Address verification is disabled. Live rates still work, but delivery and address errors are more likely."}
                </Alert>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={4}>
                    <FormControlLabel
                      control={<Switch checked={clearApiKey} onChange={(e) => setClearApiKey(e.target.checked)} disabled={!isEasyPostMode} />}
                      label={labelWithHint("Clear stored API key", "Enable this only when rotating/removing the saved EasyPost key for this company.")}
                    />
                  </Grid>
                </Grid>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={8}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(settings.address_verification_enabled !== false)}
                          onChange={(e) => updateField("address_verification_enabled", e.target.checked)}
                          disabled={!isEasyPostMode}
                        />
                      }
                      label={labelWithHint(
                        "Verify customer shipping addresses before showing live rates",
                        "Address verification checks deliverability and may suggest corrections before shipping rates are shown. Pickup and local delivery are not affected."
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <TextField
                      fullWidth
                      size="small"
                      label={labelWithHint("EasyPost API key", "Paste your EasyPost API key. It is stored encrypted. Enter a new key to rotate the existing one.")}
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
                  <Grid item xs={12} md={6}><TextField fullWidth size="small" label={labelWithHint("Origin name", "Sender/business name used as shipment origin. Example: your store name.")} value={settings.origin_name} onChange={(e) => updateField("origin_name", e.target.value)} disabled={!isEasyPostMode} /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth size="small" label={labelWithHint("Origin phone", "Contact phone for origin/sender address. Include country code where possible.")} value={settings.origin_phone} onChange={(e) => updateField("origin_phone", e.target.value)} disabled={!isEasyPostMode} /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth size="small" label={labelWithHint("Origin address 1", "Primary street address EasyPost uses as shipment origin.")} value={settings.origin_address1} onChange={(e) => updateField("origin_address1", e.target.value)} disabled={!isEasyPostMode} /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth size="small" label={labelWithHint("Origin address 2", "Optional apartment/suite/unit line for origin address.")} value={settings.origin_address2} onChange={(e) => updateField("origin_address2", e.target.value)} disabled={!isEasyPostMode} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth size="small" label={labelWithHint("Origin city", "City of the shipment origin address.")} value={settings.origin_city} onChange={(e) => updateField("origin_city", e.target.value)} disabled={!isEasyPostMode} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth size="small" label={labelWithHint("Origin region", "State/Province/Region code. Example: ON, CA, NY.")} value={settings.origin_region} onChange={(e) => updateField("origin_region", e.target.value)} disabled={!isEasyPostMode} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth size="small" label={labelWithHint("Origin postal code", "ZIP/Postal code for origin address.")} value={settings.origin_postal_code} onChange={(e) => updateField("origin_postal_code", e.target.value)} disabled={!isEasyPostMode} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth size="small" label={labelWithHint("Origin country", "2-letter country code (ISO-2). Example: US, CA.")} value={settings.origin_country} onChange={(e) => updateField("origin_country", e.target.value)} disabled={!isEasyPostMode} /></Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Destination policy"
                      value={destinationPolicyMode}
                      onChange={(e) => updateField("destination_policy_mode", e.target.value)}
                      disabled={!isEasyPostMode}
                    >
                      <MenuItem value="domestic_only">Domestic only</MenuItem>
                      <MenuItem value="ca_us">Canada and United States</MenuItem>
                      <MenuItem value="selected_countries">Selected countries</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <Autocomplete
                      multiple
                      options={Array.isArray(settings.country_catalog) ? settings.country_catalog : []}
                      value={selectedCountryOptions}
                      getOptionLabel={(option) => `${option.label} (${option.code})`}
                      disableCloseOnSelect
                      onChange={(_event, values) => {
                        const domestic = String(settings.origin_country || "").trim().toUpperCase();
                        const nextCodes = Array.from(new Set([
                          ...(domestic ? [domestic] : []),
                          ...values.map((row) => row.code),
                        ]));
                        updateField("allowed_destination_countries", nextCodes);
                        updateField("destination_policy_mode", "selected_countries");
                      }}
                      isOptionEqualToValue={(option, value) => option.code === value.code}
                      disabled={!isEasyPostMode || destinationPolicyMode !== "selected_countries"}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => {
                          const { key, ...tagProps } = getTagProps({ index });
                          return (
                            <Chip
                              key={key}
                              label={`${option.label} (${option.code})`}
                              size="small"
                              {...tagProps}
                            />
                          );
                        })
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          label="Selected destination countries"
                          helperText="The tenant's domestic origin country is always included."
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="International shipping policy"
                      value={destinationPolicyMode === "domestic_only" ? "domestic_only" : (settings.international_shipping_policy || "buyer_pays_on_import")}
                      onChange={(e) => {
                        const value = String(e.target.value || "domestic_only");
                        if (value === "domestic_only") {
                          updateField("destination_policy_mode", "domestic_only");
                          updateField("international_shipping_policy", "buyer_pays_on_import");
                        } else {
                          updateField(
                            "destination_policy_mode",
                            destinationPolicyMode === "domestic_only" ? "ca_us" : destinationPolicyMode
                          );
                          updateField("international_shipping_policy", "buyer_pays_on_import");
                        }
                      }}
                      disabled={!isEasyPostMode}
                      helperText="The standard Schedulaa import-charge notice remains visible whenever cross-border shipping is enabled."
                    >
                      <MenuItem value="domestic_only">Domestic shipping only</MenuItem>
                      <MenuItem value="buyer_pays_on_import">Sell to international customers — buyer may pay import charges</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="International address verification"
                      value={settings.international_address_verification_mode || "best_effort"}
                      onChange={(e) => updateField("international_address_verification_mode", e.target.value)}
                      disabled={!isEasyPostMode}
                      helperText={
                        settings.international_address_verification_mode === "required"
                          ? "The customer cannot continue unless the address is automatically verified."
                          : settings.international_address_verification_mode === "disabled"
                            ? "Schedulaa performs basic validation and requires the customer to confirm the international address."
                            : "Schedulaa attempts provider verification. If automatic verification is unavailable, the customer must confirm the address."
                      }
                    >
                      <MenuItem value="best_effort">Best effort — Recommended</MenuItem>
                      <MenuItem value="required">Required</MenuItem>
                      <MenuItem value="disabled">Disabled</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <Alert severity={settings.readiness?.ready ? "success" : "warning"}>
                      <Typography variant="body2" fontWeight={700}>
                        Shipping readiness: {settings.readiness?.ready ? "Ready" : "Setup incomplete"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        Enabled countries: {Array.isArray(settings.allowed_destination_countries) ? settings.allowed_destination_countries.length : 0}
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                        {(settings.readiness?.checklist || []).map((item) => (
                          <Chip
                            key={item.code}
                            size="small"
                            color={item.ready ? "success" : "warning"}
                            variant={item.ready ? "filled" : "outlined"}
                            label={item.label}
                          />
                        ))}
                      </Stack>
                    </Alert>
                  </Grid>
                </Grid>
                {destinationPolicyMode !== "domestic_only" && (
                  <>
                    <Divider />
                    <Stack spacing={1.5}>
                      <Typography variant="subtitle2" fontWeight={700}>International duties notice</Typography>
                      <Grid container spacing={1.5}>
                        <Grid item xs={12}>
                          <Alert severity="info">
                            The carrier or customs authority may collect import duties, taxes, brokerage charges, or other fees separately before or at delivery.
                          </Alert>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Additional international shipping note (optional)"
                            value={settings.international_shipping_note}
                            onChange={(e) => updateField("international_shipping_note", e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="International shipping terms URL (optional)"
                            value={settings.international_shipping_terms_url}
                            onChange={(e) => updateField("international_shipping_terms_url", e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={Boolean(settings.require_import_charges_acknowledgement !== false)}
                                onChange={(e) => updateField("require_import_charges_acknowledgement", e.target.checked)}
                              />
                            }
                            label="Require customer acknowledgement that import charges may be collected separately"
                          />
                        </Grid>
                      </Grid>
                      <Divider />
                      <Typography variant="subtitle2" fontWeight={700}>Cross-border customs setup</Typography>
                      <Grid container spacing={1.5}>
                        <Grid item xs={12} md={4}>
                          <FormControlLabel
                            control={<Switch checked={Boolean(settings.customs_certify)} onChange={(e) => updateField("customs_certify", e.target.checked)} />}
                            label="Certify customs"
                          />
                        </Grid>
                        <Grid item xs={12} md={8}>
                          <TextField fullWidth size="small" label="Customs signer" value={settings.customs_signer} onChange={(e) => updateField("customs_signer", e.target.value)} />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField select fullWidth size="small" label="Contents type" value={settings.customs_contents_type} onChange={(e) => updateField("customs_contents_type", e.target.value)}>
                            <MenuItem value="merchandise">Merchandise</MenuItem>
                            <MenuItem value="gift">Gift</MenuItem>
                            <MenuItem value="sample">Sample</MenuItem>
                            <MenuItem value="documents">Documents</MenuItem>
                            <MenuItem value="returned_goods">Returned goods</MenuItem>
                            <MenuItem value="other">Other</MenuItem>
                          </TextField>
                        </Grid>
                        {settings.customs_contents_type === "other" && (
                          <Grid item xs={12} md={8}>
                            <TextField fullWidth size="small" label="Contents explanation" value={settings.customs_contents_explanation} onChange={(e) => updateField("customs_contents_explanation", e.target.value)} />
                          </Grid>
                        )}
                        <Grid item xs={12} md={4}>
                          <TextField select fullWidth size="small" label="Non-delivery option" value={settings.customs_non_delivery_option} onChange={(e) => updateField("customs_non_delivery_option", e.target.value)}>
                            <MenuItem value="return">Return</MenuItem>
                            <MenuItem value="abandon">Abandon</MenuItem>
                          </TextField>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField select fullWidth size="small" label="Restriction type" value={settings.customs_restriction_type} onChange={(e) => updateField("customs_restriction_type", e.target.value)}>
                            <MenuItem value="none">None</MenuItem>
                            <MenuItem value="other">Other</MenuItem>
                            <MenuItem value="quarantine">Quarantine</MenuItem>
                            <MenuItem value="sanitary_phytosanitary_inspection">Sanitary / phytosanitary inspection</MenuItem>
                          </TextField>
                        </Grid>
                        {settings.customs_restriction_type !== "none" && (
                          <Grid item xs={12} md={4}>
                            <TextField fullWidth size="small" label="Restriction comments" value={settings.customs_restriction_comments} onChange={(e) => updateField("customs_restriction_comments", e.target.value)} />
                          </Grid>
                        )}
                        {(settings.origin_country || "").toUpperCase() === "US" && (
                          <>
                            <Grid item xs={12}>
                              <Typography variant="subtitle2" fontWeight={700}>US export filing</Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <TextField select fullWidth size="small" label="Filing mode" value={settings.us_export_filing_mode} onChange={(e) => updateField("us_export_filing_mode", e.target.value)}>
                                <MenuItem value="not_configured">Not configured</MenuItem>
                                <MenuItem value="noeei_30_37a">NOEEI 30.37(a)</MenuItem>
                                <MenuItem value="aes_itn">AES / ITN</MenuItem>
                                <MenuItem value="manual_citation">Manual citation</MenuItem>
                              </TextField>
                            </Grid>
                            {["aes_itn", "manual_citation"].includes(settings.us_export_filing_mode) && (
                              <Grid item xs={12} md={4}>
                                <TextField fullWidth size="small" label="Filing citation" value={settings.us_export_filing_citation} onChange={(e) => updateField("us_export_filing_citation", e.target.value)} />
                              </Grid>
                            )}
                            {settings.us_export_filing_mode === "noeei_30_37a" && (
                              <Grid item xs={12} md={4}>
                                <FormControlLabel
                                  control={<Switch checked={Boolean(settings.us_noeei_eligibility_confirmed_at || settings.us_noeei_eligibility_confirmed_by)} onChange={(e) => updateField("us_noeei_eligibility_confirmed_at", e.target.checked ? new Date().toISOString() : null)} />}
                                  label="NOEEI eligibility confirmed"
                                />
                              </Grid>
                            )}
                          </>
                        )}
                      </Grid>
                    </Stack>
                  </>
                )}
                <Divider />
                <Stack spacing={1.5}>
                  <Typography variant="subtitle2" fontWeight={700}>Customer shipping emails</Typography>
                  <Alert severity="info">
                    <Typography variant="body2">Shipping emails use the order&apos;s tracking information.</Typography>
                    <Typography variant="body2">A label purchase alone does not send a shipped email.</Typography>
                    <Typography variant="body2">Webhook and manual updates are automatically deduplicated.</Typography>
                    <Typography variant="body2">SMS is not currently supported.</Typography>
                  </Alert>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(settings.email_customer_order_shipped !== false)}
                            onChange={(e) => updateField("email_customer_order_shipped", e.target.checked)}
                          />
                        }
                        label="Email customer when order ships"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(settings.email_customer_order_delivered !== false)}
                            onChange={(e) => updateField("email_customer_order_delivered", e.target.checked)}
                          />
                        }
                        label="Email customer when order is delivered"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(settings.email_customer_delivery_exception !== false)}
                            onChange={(e) => updateField("email_customer_delivery_exception", e.target.checked)}
                          />
                        }
                        label="Email customer about delivery problems"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(settings.email_manager_delivery_exception !== false)}
                            onChange={(e) => updateField("email_manager_delivery_exception", e.target.checked)}
                          />
                        }
                        label="Email managers about delivery problems"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(settings.email_customer_ready_for_pickup !== false)}
                            onChange={(e) => updateField("email_customer_ready_for_pickup", e.target.checked)}
                          />
                        }
                        label="Email customer when pickup is ready"
                      />
                    </Grid>
                  </Grid>
                </Stack>
                <Divider />
                <Stack spacing={1.5}>
                  <Typography variant="subtitle2" fontWeight={700}>Package Profiles</Typography>
                  <Typography variant="body2" color="text.secondary">
                    The default package provides parcel dimensions and tare weight for live shipping rates.
                  </Typography>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} md={4}>
                      <TextField fullWidth size="small" label="Profile name" value={packageProfileForm.name} onChange={(e) => setPackageProfileForm((prev) => ({ ...prev, name: e.target.value }))} />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField fullWidth size="small" type="number" label="Length (mm)" value={packageProfileForm.length_mm} onChange={(e) => setPackageProfileForm((prev) => ({ ...prev, length_mm: e.target.value }))} />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField fullWidth size="small" type="number" label="Width (mm)" value={packageProfileForm.width_mm} onChange={(e) => setPackageProfileForm((prev) => ({ ...prev, width_mm: e.target.value }))} />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField fullWidth size="small" type="number" label="Height (mm)" value={packageProfileForm.height_mm} onChange={(e) => setPackageProfileForm((prev) => ({ ...prev, height_mm: e.target.value }))} />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField fullWidth size="small" type="number" label="Tare (g)" value={packageProfileForm.tare_weight_grams} onChange={(e) => setPackageProfileForm((prev) => ({ ...prev, tare_weight_grams: e.target.value }))} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField fullWidth size="small" label="Packaging type" value={packageProfileForm.packaging_type} onChange={(e) => setPackageProfileForm((prev) => ({ ...prev, packaging_type: e.target.value }))} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControlLabel
                        control={<Switch checked={Boolean(packageProfileForm.is_default)} onChange={(e) => setPackageProfileForm((prev) => ({ ...prev, is_default: e.target.checked }))} />}
                        label="Set as default package"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Stack direction="row" spacing={1}>
                        <Button variant="outlined" onClick={savePackageProfile}>
                          {editingPackageProfileId ? "Update package profile" : "Add package profile"}
                        </Button>
                        {editingPackageProfileId && (
                          <Button variant="text" onClick={resetPackageProfileForm}>
                            Cancel edit
                          </Button>
                        )}
                      </Stack>
                    </Grid>
                  </Grid>
                  <Stack spacing={1}>
                    {(settings.package_profiles || []).map((profile) => (
                      <Paper key={profile.id} variant="outlined" sx={{ p: 1.5 }}>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "flex-start", md: "center" }} justifyContent="space-between">
                          <Stack spacing={0.5}>
                            <Typography variant="body2" fontWeight={700}>
                              {profile.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {profile.length_mm} × {profile.width_mm} × {profile.height_mm} mm • tare {profile.tare_weight_grams} g
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={1} alignItems="center">
                            {profile.is_default && <Chip size="small" color="success" label="Default" />}
                            {!profile.is_default && (
                              <Button size="small" variant="outlined" onClick={() => setDefaultPackage(profile.id)}>
                                Set default
                              </Button>
                            )}
                            <Button size="small" variant="text" onClick={() => startEditPackageProfile(profile)}>
                              Edit
                            </Button>
                            <Button size="small" color="error" variant="text" onClick={() => deletePackageProfile(profile.id)}>
                              Archive
                            </Button>
                          </Stack>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </Stack>
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
              <Typography variant="body2">- Open from Products -> Delivery setup.</Typography>
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
      <CommerceCopilotDrawer
        open={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        token={token}
        initialWorkflow="review_shipping_setup"
      />
    </Box>
  );
};

export default EasyPostShippingSettingsPanel;
