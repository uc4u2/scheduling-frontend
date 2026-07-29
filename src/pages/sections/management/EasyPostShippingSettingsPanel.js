import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
      <IconButton
        size="small"
        aria-label={`${label} help`}
        sx={{ p: 0, color: "text.secondary" }}
      >
        <HelpOutlineIcon sx={{ fontSize: 14 }} />
      </IconButton>
    </Tooltip>
  </Stack>
);

const hintedTextField = ({ label, hint, inputProps, ...props }) => (
  <Stack spacing={0.5}>
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        {label}
      </Typography>
      <Tooltip title={hint} arrow placement="top">
        <IconButton
          size="small"
          aria-label={`${label} help`}
          sx={{ p: 0, color: "text.secondary" }}
        >
          <HelpOutlineIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Tooltip>
    </Stack>
    <TextField
      {...props}
      label={undefined}
      inputProps={{
        ...(inputProps || {}),
        "aria-label": label,
      }}
    />
  </Stack>
);

const HELP_TAB_OPTIONS = [
  { value: "schedulaa_setup", label: "Schedulaa setup" },
  { value: "easypost_website", label: "EasyPost website setup" },
  { value: "test_go_live", label: "Test and go live" },
  { value: "troubleshooting", label: "Troubleshooting" },
];

const EASYPOST_SUPPORT_URL = "https://support.easypost.com/hc/en-us/requests/new";

const SUPPORT_REQUEST_SUBJECT = "Security verification required for API access and shipping features";

const SUPPORT_REQUEST_TEMPLATE = `Hello EasyPost Support,

My EasyPost dashboard displays "Security Verification Required" and says that some shipping features may be limited.

We are preparing this account to connect with Schedulaa through the EasyPost API for carrier rates, shipping labels, and tracking.

Please review the account and let us know what business, identity, billing, ship-from address, or carrier information is required to complete verification.

EasyPost account email:
[ACCOUNT EMAIL]

Business country:
[COUNTRY]

Thank you.`;

const STATUS_CHIP_CONTRACT = {
  ready: {
    variant: "filled",
    sx: {
      bgcolor: "#dff3e4",
      border: "1px solid #a8cfb3",
      color: "#175c2e",
      fontWeight: 700,
    },
  },
  needsSetup: {
    variant: "filled",
    sx: {
      bgcolor: "#fff1d6",
      border: "1px solid #f0c98b",
      color: "#8a5400",
      fontWeight: 700,
    },
  },
  available: {
    variant: "filled",
    sx: {
      bgcolor: "#e3efff",
      border: "1px solid #b7cff5",
      color: "#1b4f9c",
      fontWeight: 700,
    },
  },
  info: {
    variant: "outlined",
    sx: {
      bgcolor: "#f5f8fc",
      borderColor: "#c7d3e0",
      color: "#2f415e",
      fontWeight: 700,
    },
  },
};

const DELIVERY_METHOD_META = {
  pickup: {
    label: "Pickup",
    description: "Customer collects the order from your location.",
    field: "allow_pickup",
    customLabelField: "shipping_label_pickup",
    customerLabel: "Customer-facing pickup name - optional",
  },
  shipping: {
    label: "Ship the order",
    description: "Send the order to the customer's shipping address.",
    field: "allow_shipping",
    customLabelField: "shipping_label_shipping",
    customerLabel: "Customer-facing shipping name - optional",
  },
  local_delivery: {
    label: "Local delivery",
    description: "Your business or local courier delivers within your service area.",
    field: "allow_local_delivery",
    customLabelField: "shipping_label_local_delivery",
    customerLabel: "Customer-facing local-delivery name - optional",
  },
};

const DELIVERY_METHOD_DEFAULT_LABELS = {
  pickup: "Pickup",
  shipping: "Shipping",
  local_delivery: "Local delivery",
};

const getChecklistStatusChipProps = (status) => {
  switch (status) {
    case "Ready":
      return STATUS_CHIP_CONTRACT.ready;
    case "Available":
      return STATUS_CHIP_CONTRACT.available;
    case "Confirm in EasyPost":
      return STATUS_CHIP_CONTRACT.info;
    default:
      return STATUS_CHIP_CONTRACT.needsSetup;
  }
};

const getReadinessChipProps = (ready) => (
  ready ? STATUS_CHIP_CONTRACT.ready : STATUS_CHIP_CONTRACT.needsSetup
);

const focusHighlightSx = (active) => ({
  borderRadius: 1.5,
  outline: active ? "2px solid rgba(59, 130, 246, 0.45)" : "none",
  backgroundColor: active ? "rgba(59, 130, 246, 0.08)" : "transparent",
  transition: "background-color 0.25s ease, outline-color 0.25s ease",
  scrollMarginTop: 96,
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
  const [helpTab, setHelpTab] = useState("schedulaa_setup");
  const [helpCopyMessage, setHelpCopyMessage] = useState("");
  const [activeTab, setActiveTab] = useState("delivery_methods");
  const [focusedSection, setFocusedSection] = useState("");
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [copilotWorkflow, setCopilotWorkflow] = useState("review_shipping_setup");
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
  const apiKeySectionRef = useRef(null);
  const originSectionRef = useRef(null);
  const destinationSectionRef = useRef(null);
  const packageProfilesSectionRef = useRef(null);
  const isEasyPostMode = Boolean(settings?.easypost_enabled);
  const deliveryEnabled = Boolean(settings?.enabled);
  const savedMethodCodes = useMemo(
    () => Object.entries(DELIVERY_METHOD_META)
      .filter(([, meta]) => Boolean(settings?.[meta.field]))
      .map(([code]) => code),
    [settings]
  );
  const effectiveMethodCodes = useMemo(
    () => (deliveryEnabled ? savedMethodCodes : []),
    [deliveryEnabled, savedMethodCodes]
  );
  const deliveryMethodsError = useMemo(() => {
    if (!deliveryEnabled) return "";
    if (savedMethodCodes.length > 0) return "";
    return "Choose at least one delivery method or turn off Product delivery.";
  }, [deliveryEnabled, savedMethodCodes.length]);
  const previewMethodLabels = useMemo(
    () => effectiveMethodCodes.map((code) => {
      const meta = DELIVERY_METHOD_META[code];
      const custom = String(settings?.[meta?.customLabelField] || "").trim();
      return custom || DELIVERY_METHOD_DEFAULT_LABELS[code] || meta?.label || code;
    }),
    [effectiveMethodCodes, settings]
  );
  const showManualShippingWarning = Boolean(
    deliveryEnabled && Boolean(settings?.allow_shipping) && !isEasyPostMode
  );
  const destinationPolicyMode = settings?.destination_policy_mode || settings?.destination_policy_preset || "domestic_only";
  const selectedCountryOptions = useMemo(() => {
    const selected = Array.isArray(settings?.allowed_destination_countries) ? settings.allowed_destination_countries : [];
    const catalog = Array.isArray(settings?.country_catalog) ? settings.country_catalog : [];
    return catalog.filter((row) => selected.includes(row.code));
  }, [settings?.allowed_destination_countries, settings?.country_catalog]);
  const originComplete = useMemo(() => (
    Boolean(
      settings?.origin_name
      && settings?.origin_phone
      && settings?.origin_address1
      && settings?.origin_city
      && settings?.origin_region
      && settings?.origin_postal_code
      && settings?.origin_country
    )
  ), [
    settings?.origin_address1,
    settings?.origin_city,
    settings?.origin_country,
    settings?.origin_name,
    settings?.origin_phone,
    settings?.origin_postal_code,
    settings?.origin_region,
  ]);
  const destinationConfigured = useMemo(() => {
    if (!settings) return false;
    const mode = settings.destination_policy_mode || settings.destination_policy_preset || "domestic_only";
    if (mode === "domestic_only") {
      return Boolean(settings.origin_country);
    }
    return Array.isArray(settings.allowed_destination_countries) && settings.allowed_destination_countries.length > 0;
  }, [settings]);
  const helpChecklistItems = useMemo(() => ([
    { label: "Shipping enabled", status: settings?.enabled ? "Ready" : "Needs setup" },
    { label: "Allow shipping enabled", status: settings?.allow_shipping ? "Ready" : "Needs setup" },
    { label: "EasyPost automation enabled", status: settings?.easypost_enabled ? "Ready" : "Needs setup" },
    { label: "API key saved", status: settings?.easypost_has_api_key ? "Ready" : "Needs setup" },
    { label: "Connection tested", status: settings?.easypost_connected ? "Ready" : "Needs setup" },
    { label: "Origin complete", status: originComplete ? "Ready" : "Needs setup" },
    { label: "Default Package Profile present", status: settings?.default_package_profile_id ? "Ready" : "Needs setup" },
    { label: "Destination policy configured", status: destinationConfigured ? "Ready" : "Needs setup" },
    { label: "Test shipping setup available", status: settings?.allow_shipping ? "Available" : "Enable shipping first" },
    { label: "EasyPost account verification", status: "Confirm in EasyPost" },
    { label: "EasyPost Wallet or carrier billing", status: "Confirm in EasyPost" },
    { label: "Carrier activated in EasyPost", status: "Confirm in EasyPost" },
  ]), [
    destinationConfigured,
    originComplete,
    settings?.allow_shipping,
    settings?.default_package_profile_id,
    settings?.easypost_connected,
    settings?.easypost_enabled,
    settings?.easypost_has_api_key,
    settings?.enabled,
  ]);

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

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const search = new URLSearchParams(window.location.search);
    const requestedTab = String(search.get("tab") || "").trim().toLowerCase();
    const requestedFocus = String(search.get("focus") || "").trim().toLowerCase();
    if (requestedTab === "easypost_automation" && activeTab !== "easypost") {
      setActiveTab("easypost");
      return undefined;
    }
    const focusMap = {
      api_key: apiKeySectionRef,
      origin: originSectionRef,
      destinations: destinationSectionRef,
      package_profiles: packageProfilesSectionRef,
    };
    const targetRef = focusMap[requestedFocus];
    if (!targetRef?.current) return undefined;
    const timer = window.setTimeout(() => {
      targetRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setFocusedSection(requestedFocus);
      window.setTimeout(() => {
        setFocusedSection((prev) => (prev === requestedFocus ? "" : prev));
      }, 1800);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [activeTab, settings]);

  const updateField = useCallback((field, value) => {
    setSettings((prev) => ({ ...(prev || {}), [field]: value }));
  }, []);

  const openHelp = useCallback((tab = "schedulaa_setup") => {
    setHelpTab(tab);
    setHelpCopyMessage("");
    setHelpOpen(true);
  }, []);

  const copyHelpText = useCallback(async (text, successMessage) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const temp = document.createElement("textarea");
        temp.value = text;
        temp.setAttribute("readonly", "true");
        temp.style.position = "absolute";
        temp.style.left = "-9999px";
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        document.body.removeChild(temp);
      }
      setHelpCopyMessage(successMessage);
    } catch (_error) {
      setHelpCopyMessage("Unable to copy automatically. Select the text and copy it manually.");
    }
  }, []);

  const saveSettings = useCallback(async () => {
    if (!settings) return;
    if (deliveryEnabled && !savedMethodCodes.length) {
      setMessage({ type: "error", text: "Choose at least one delivery method or turn off Product delivery." });
      return;
    }
    setSaving(true);
    setMessage({ type: "", text: "" });
    try {
      const payload = {
        enabled: Boolean(settings.enabled),
        easypost_enabled: Boolean(settings.easypost_enabled),
        allow_pickup: Boolean(settings.allow_pickup),
        allow_shipping: Boolean(settings.allow_shipping),
        allow_local_delivery: Boolean(settings.allow_local_delivery),
        email_customer_order_shipped: settings.email_customer_order_shipped !== false,
        email_customer_order_delivered: settings.email_customer_order_delivered !== false,
        email_customer_delivery_exception: settings.email_customer_delivery_exception !== false,
        email_manager_delivery_exception: settings.email_manager_delivery_exception !== false,
        email_customer_ready_for_pickup: settings.email_customer_ready_for_pickup !== false,
        shipping_label_pickup: settings.shipping_label_pickup || null,
        shipping_label_shipping: settings.shipping_label_shipping || null,
        shipping_label_local_delivery: settings.shipping_label_local_delivery || null,
      };
      if (settings.easypost_enabled) {
        Object.assign(payload, {
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
        });
      }
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
  }, [settings, deliveryEnabled, savedMethodCodes.length, apiKeyInput, clearApiKey, headers]);

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
              onClick={() => {
                setCopilotWorkflow("review_shipping_setup");
                setCopilotOpen(true);
              }}
            >
              Configure shipping with AI
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setCopilotWorkflow("test_shipping_setup");
                setCopilotOpen(true);
              }}
            >
              Test shipping setup
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setCopilotWorkflow("international_expansion_assistant");
                setCopilotOpen(true);
              }}
            >
              Review international readiness
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<HelpOutlineIcon />}
              onClick={() => openHelp("schedulaa_setup")}
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
                How parcel shipping is handled
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant={isEasyPostMode ? "outlined" : "contained"}
                  onClick={() => updateField("easypost_enabled", false)}
                >
                  Manual fulfillment
                </Button>
                <Button
                  size="small"
                  variant={isEasyPostMode ? "contained" : "outlined"}
                  onClick={() => updateField("easypost_enabled", true)}
                >
                  EasyPost rates and labels
                </Button>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Manual fulfillment means you arrange parcel shipping yourself. EasyPost rates and labels means Schedulaa can request carrier rates and purchase labels through the connected EasyPost account.
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
                  Delivery Methods control what customers see. Automation mode controls how parcel shipping rates and labels are handled.
                </Alert>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Stack spacing={1.5}>
                    <Stack spacing={0.5}>
                      <FormControlLabel
                        control={(
                          <Switch
                            checked={deliveryEnabled}
                            onChange={(e) => updateField("enabled", e.target.checked)}
                          />
                        )}
                        label="Offer delivery options at checkout"
                      />
                      <Typography variant="body2" color="text.secondary">
                        {deliveryEnabled
                          ? "Choose at least one way customers can receive their orders."
                          : "Product delivery is paused. Customers will not see any delivery choices at checkout."}
                      </Typography>
                    </Stack>
                    <Divider />
                    <Stack spacing={1}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        How customers can receive orders
                      </Typography>
                      {!deliveryEnabled && savedMethodCodes.length > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          Saved method choices are preserved but currently inactive.
                        </Typography>
                      )}
                      <Grid container spacing={1.5}>
                        {Object.entries(DELIVERY_METHOD_META).map(([code, meta]) => {
                          const checked = Boolean(settings?.[meta.field]);
                          const customLabel = settings?.[meta.customLabelField] || "";
                          return (
                            <Grid key={code} item xs={12}>
                              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, opacity: deliveryEnabled ? 1 : 0.78 }}>
                                <Stack spacing={1}>
                                  <FormControlLabel
                                    control={(
                                      <Switch
                                        checked={checked}
                                        onChange={(e) => updateField(meta.field, e.target.checked)}
                                        disabled={!deliveryEnabled}
                                      />
                                    )}
                                    label={meta.label}
                                  />
                                  <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                                    {meta.description}
                                  </Typography>
                                  {checked && (
                                    <TextField
                                      fullWidth
                                      size="small"
                                      label={meta.customerLabel}
                                      helperText="This is the name customers see at checkout. Leave blank to use the default."
                                      value={customLabel}
                                      onChange={(e) => updateField(meta.customLabelField, e.target.value)}
                                    />
                                  )}
                                </Stack>
                              </Paper>
                            </Grid>
                          );
                        })}
                      </Grid>
                      {deliveryMethodsError && (
                        <Alert severity="error">{deliveryMethodsError}</Alert>
                      )}
                    </Stack>
                  </Stack>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      Customer checkout preview
                    </Typography>
                    {!deliveryEnabled || previewMethodLabels.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No delivery options will be shown.
                      </Typography>
                    ) : (
                      <>
                        <Typography variant="body2" color="text.secondary">
                          How would you like to receive your order?
                        </Typography>
                        <Stack spacing={0.5}>
                          {previewMethodLabels.map((label) => (
                            <Typography key={label} variant="body2">
                              ○ {label}
                            </Typography>
                          ))}
                        </Stack>
                      </>
                    )}
                  </Stack>
                </Paper>
                {showManualShippingWarning && (
                  <Alert severity="warning">
                    Manual fulfillment does not calculate carrier rates. Confirm that shipping is included in your Product price, or use EasyPost rates and labels.
                  </Alert>
                )}
                <Alert severity="info">
                  Local delivery currently acts as a fulfillment choice only. Customers may select Local Delivery, and your business arranges it manually.
                </Alert>
              </Stack>
            )}

            {activeTab === "easypost" && (
              <Stack spacing={2}>
                <Alert severity="info">
                  EasyPost automates shipping rates and label purchase only. It does not decide which delivery method choices appear at checkout.
                </Alert>
                {!isEasyPostMode && (
                  <Alert severity="info">
                    EasyPost settings stay available here even while Manual fulfillment is selected. Turn on EasyPost rates and labels when you want live carrier rates or label purchase.
                  </Alert>
                )}
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Chip
                    size="small"
                    color={settings.easypost_connected ? "success" : "default"}
                    label={settings.easypost_connected ? "Connected" : "Not connected"}
                    sx={
                      settings.easypost_connected
                        ? {
                            fontWeight: 700,
                            color: "#ffffff",
                          }
                        : {
                            fontWeight: 700,
                            color: "text.primary",
                            bgcolor: "grey.100",
                          }
                    }
                  />
                  <Chip
                    size="small"
                    color={settings.address_verification_enabled !== false ? "info" : "default"}
                    variant={settings.address_verification_enabled !== false ? "filled" : "outlined"}
                    label={settings.address_verification_enabled !== false ? "Address verification enabled" : "Address verification disabled"}
                    sx={
                      settings.address_verification_enabled !== false
                        ? {
                            bgcolor: "info.main",
                            color: "#ffffff",
                            fontWeight: 700,
                          }
                        : {
                            fontWeight: 700,
                            color: "text.primary",
                            borderColor: "divider",
                          }
                    }
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
                {(!settings.easypost_has_api_key || !settings.easypost_connected) && (
                  <Alert
                    severity="warning"
                    action={(
                      <Button color="inherit" size="small" onClick={() => openHelp("easypost_website")}>
                        EasyPost account setup guide
                      </Button>
                    )}
                  >
                    Finish the EasyPost website account steps before expecting live rates or label purchase to work in Schedulaa.
                  </Alert>
                )}
                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={4}>
                    <FormControlLabel
                      control={<Switch checked={clearApiKey} onChange={(e) => setClearApiKey(e.target.checked)} disabled={!isEasyPostMode} />}
                      label={labelWithHint("Clear stored API key", "Enable this only when rotating/removing the saved EasyPost key for this company.")}
                    />
                  </Grid>
                </Grid>
                <Box ref={apiKeySectionRef} sx={focusHighlightSx(focusedSection === "api_key")}>
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
                    {hintedTextField({
                      fullWidth: true,
                      size: "small",
                      label: "EasyPost API key",
                      hint: "Paste your EasyPost API key. It is stored encrypted. Enter a new key to rotate the existing one.",
                      placeholder: settings.easypost_has_api_key ? "Stored key exists (enter new key to rotate)" : "Enter EasyPost API key",
                      value: apiKeyInput,
                      onChange: (e) => setApiKeyInput(e.target.value),
                      disabled: !isEasyPostMode,
                    })}
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Button fullWidth variant="outlined" onClick={testConnection} disabled={testing || !isEasyPostMode}>
                      {testing ? <CircularProgress size={18} /> : "Test connection"}
                    </Button>
                  </Grid>
                </Grid>
                </Box>
                <Box ref={originSectionRef} sx={focusHighlightSx(focusedSection === "origin")}>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={6}>{hintedTextField({ fullWidth: true, size: "small", label: "Origin name", hint: "Sender/business name used as shipment origin. Example: your store name.", value: settings.origin_name, onChange: (e) => updateField("origin_name", e.target.value), disabled: !isEasyPostMode })}</Grid>
                  <Grid item xs={12} md={6}>{hintedTextField({ fullWidth: true, size: "small", label: "Origin phone", hint: "Contact phone for origin/sender address. Include country code where possible.", value: settings.origin_phone, onChange: (e) => updateField("origin_phone", e.target.value), disabled: !isEasyPostMode })}</Grid>
                  <Grid item xs={12} md={6}>{hintedTextField({ fullWidth: true, size: "small", label: "Origin address 1", hint: "Primary street address EasyPost uses as shipment origin.", value: settings.origin_address1, onChange: (e) => updateField("origin_address1", e.target.value), disabled: !isEasyPostMode })}</Grid>
                  <Grid item xs={12} md={6}>{hintedTextField({ fullWidth: true, size: "small", label: "Origin address 2", hint: "Optional apartment/suite/unit line for origin address.", value: settings.origin_address2, onChange: (e) => updateField("origin_address2", e.target.value), disabled: !isEasyPostMode })}</Grid>
                  <Grid item xs={12} md={4}>{hintedTextField({ fullWidth: true, size: "small", label: "Origin city", hint: "City of the shipment origin address.", value: settings.origin_city, onChange: (e) => updateField("origin_city", e.target.value), disabled: !isEasyPostMode })}</Grid>
                  <Grid item xs={12} md={4}>{hintedTextField({ fullWidth: true, size: "small", label: "Origin region", hint: "State/Province/Region code. Example: ON, CA, NY.", value: settings.origin_region, onChange: (e) => updateField("origin_region", e.target.value), disabled: !isEasyPostMode })}</Grid>
                  <Grid item xs={12} md={4}>{hintedTextField({ fullWidth: true, size: "small", label: "Origin postal code", hint: "ZIP/Postal code for origin address.", value: settings.origin_postal_code, onChange: (e) => updateField("origin_postal_code", e.target.value), disabled: !isEasyPostMode })}</Grid>
                  <Grid item xs={12} md={4}>{hintedTextField({ fullWidth: true, size: "small", label: "Origin country", hint: "2-letter country code (ISO-2). Example: US, CA.", value: settings.origin_country, onChange: (e) => updateField("origin_country", e.target.value), disabled: !isEasyPostMode })}</Grid>
                </Grid>
                </Box>
                <Box ref={destinationSectionRef} sx={focusHighlightSx(focusedSection === "destinations")}>
                <Grid container spacing={1.5}>
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
                        {(settings.readiness?.checklist || []).map((item) => {
                          const chipProps = getReadinessChipProps(item.ready);
                          return (
                            <Chip
                              key={item.code}
                              size="small"
                              variant={chipProps.variant}
                              label={item.label}
                              sx={{
                                ...chipProps.sx,
                                height: "auto",
                                "& .MuiChip-label": {
                                  display: "block",
                                  whiteSpace: "normal",
                                  lineHeight: 1.2,
                                  py: 0.5,
                                },
                              }}
                            />
                          );
                        })}
                      </Stack>
                    </Alert>
                  </Grid>
                </Grid>
                </Box>
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
                <Stack spacing={1.5} ref={packageProfilesSectionRef} sx={focusHighlightSx(focusedSection === "package_profiles")}>
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
        <DialogTitle sx={{ pr: 7, fontWeight: 700 }}>
          EasyPost Shipping Help
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
              Use this guide to finish both the Schedulaa-side setup and the EasyPost-account steps on the EasyPost website. Manual shipping remains available if EasyPost is disabled or unavailable.
            </Typography>

            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Stack spacing={1}>
                <Typography variant="subtitle2" fontWeight={700}>Current Schedulaa checklist</Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    gap: 1,
                  }}
                >
                  {helpChecklistItems.map((item) => {
                    const chipProps = getChecklistStatusChipProps(item.status);
                    return (
                      <Stack
                        key={item.label}
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, px: 1, py: 0.75 }}
                      >
                        <Typography variant="body2">{item.label}</Typography>
                        <Chip
                          size="small"
                          label={item.status}
                          variant={chipProps.variant}
                          sx={chipProps.sx}
                        />
                      </Stack>
                    );
                  })}
                </Box>
              </Stack>
            </Paper>

            <Tabs
              value={helpTab}
              onChange={(_event, next) => setHelpTab(next)}
              variant="scrollable"
              allowScrollButtonsMobile
              aria-label="EasyPost shipping help sections"
            >
              {HELP_TAB_OPTIONS.map((tab) => (
                <Tab key={tab.value} value={tab.value} label={tab.label} />
              ))}
            </Tabs>

            {helpCopyMessage ? (
              <Alert severity="success" role="status" aria-live="polite">
                {helpCopyMessage}
              </Alert>
            ) : null}

            {helpTab === "schedulaa_setup" && (
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>Schedulaa setup</Typography>
                  <Typography variant="body2">1. Enable <strong>Shipping settings</strong>.</Typography>
                  <Typography variant="body2">2. Enable <strong>Allow shipping</strong>.</Typography>
                  <Typography variant="body2">3. Select <strong>EasyPost automation</strong>.</Typography>
                  <Typography variant="body2">4. Add the EasyPost API key.</Typography>
                  <Typography variant="body2">5. Enter the shipping origin.</Typography>
                  <Typography variant="body2">6. Choose destination countries.</Typography>
                  <Typography variant="body2">7. Create or select a Package Profile.</Typography>
                  <Typography variant="body2">8. Click <strong>Test connection</strong>.</Typography>
                  <Typography variant="body2">9. Run <strong>Test shipping setup</strong>.</Typography>
                  <Typography variant="body2">10. Product Order label actions happen only after a real order.</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>Neutral shipping example</Typography>
                  <Typography variant="body2">Physical Product: Product weight 250 g.</Typography>
                  <Typography variant="body2">Reusable Package Profile: box 20 x 15 x 8 cm, empty-package weight 80 g.</Typography>
                  <Typography variant="body2">Domestic setup: domestic destination policy, one active/default Package Profile, and a valid test destination.</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>Product weight versus package weight</Typography>
                  <Typography variant="body2">- Product weight is the item without packaging.</Typography>
                  <Typography variant="body2">- Package weight is the empty box, mailer, and packing material.</Typography>
                  <Typography variant="body2">- Schedulaa combines them when requesting shipping rates.</Typography>
                </Box>
              </Stack>
            )}

            {helpTab === "easypost_website" && (
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>Create or verify the EasyPost account</Typography>
                  <Typography variant="body2">1. Sign in to EasyPost.</Typography>
                  <Typography variant="body2">2. Review any yellow <strong>Security Verification Required</strong> banner.</Typography>
                  <Typography variant="body2">3. Follow the support or verification instructions shown by EasyPost.</Typography>
                  <Typography variant="body2">4. Complete requested business or account information.</Typography>
                  <Typography variant="body2">5. Add the real ship-from address.</Typography>
                  <Typography variant="body2">6. Add or configure the EasyPost Wallet payment method where required.</Typography>
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    EasyPost may restrict Production features until account verification is complete. Schedulaa cannot remove or bypass an EasyPost restriction.
                  </Alert>
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>Security verification support request</Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>Use this template when the EasyPost dashboard says security verification is required.</Typography>
                  <Paper variant="outlined" sx={{ p: 1.5 }}>
                    <Stack spacing={1}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>Subject</Typography>
                      <Typography variant="body2">{SUPPORT_REQUEST_SUBJECT}</Typography>
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <Button size="small" variant="outlined" onClick={() => copyHelpText(SUPPORT_REQUEST_SUBJECT, "Copied support request subject.")}>
                          Copy subject
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          component="a"
                          href={EASYPOST_SUPPORT_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open EasyPost Support
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                  <Paper variant="outlined" sx={{ p: 1.5, mt: 1 }}>
                    <Stack spacing={1}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>Description template</Typography>
                      <Typography variant="body2" component="pre" sx={{ m: 0, whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
                        {SUPPORT_REQUEST_TEMPLATE}
                      </Typography>
                      <Button size="small" variant="outlined" onClick={() => copyHelpText(SUPPORT_REQUEST_TEMPLATE, "Copied support request message.")} sx={{ alignSelf: "flex-start" }}>
                        Copy request message
                      </Button>
                    </Stack>
                  </Paper>
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    Never paste your EasyPost API key, password, payment details, or other secret credentials into a support request.
                  </Alert>
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>EasyPost Wallet and billing</Typography>
                  <Typography variant="body2">- EasyPost Wallet is used for EasyPost Wallet carrier postage.</Typography>
                  <Typography variant="body2">- The Wallet may require a payment method or Wallet funding.</Typography>
                  <Typography variant="body2">- The tenant is responsible for EasyPost or carrier shipping charges.</Typography>
                  <Typography variant="body2">- Bring Your Own Carrier Account is for tenants who already have a direct carrier account.</Typography>
                  <Typography variant="body2">- The carrier may bill the tenant directly.</Typography>
                  <Typography variant="body2">- Negotiated carrier rates generally require Production mode.</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>Carrier setup</Typography>
                  <Typography variant="body2">At least one usable carrier account should be active before expecting meaningful Production rates or label purchase.</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}><strong>EasyPost Wallet carrier</strong></Typography>
                  <Typography variant="body2">1. Open EasyPost.</Typography>
                  <Typography variant="body2">2. Go to Account Settings.</Typography>
                  <Typography variant="body2">3. Open Carriers.</Typography>
                  <Typography variant="body2">4. Open EasyPost Wallet Carriers.</Typography>
                  <Typography variant="body2">5. Select an available carrier.</Typography>
                  <Typography variant="body2">6. Complete its activation steps.</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}><strong>Existing carrier account</strong></Typography>
                  <Typography variant="body2">1. Open Account Settings.</Typography>
                  <Typography variant="body2">2. Open Carriers.</Typography>
                  <Typography variant="body2">3. Select Add Carrier.</Typography>
                  <Typography variant="body2">4. Choose the carrier.</Typography>
                  <Typography variant="body2">5. Authenticate or enter the carrier credentials requested by EasyPost.</Typography>
                  <Typography variant="body2">6. Confirm the carrier account is active.</Typography>
                  <Alert severity="info" sx={{ mt: 1 }}>
                    Example only — available carriers depend on the EasyPost account, country, plan, and carrier agreements.
                  </Alert>
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>API key guide</Typography>
                  <Typography variant="body2">- Test API key: use while configuring and testing.</Typography>
                  <Typography variant="body2">- Production API key: use for live rates and real label operations after the EasyPost account is ready for Production use.</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>1. Open EasyPost Account Settings.</Typography>
                  <Typography variant="body2">2. Open API Keys.</Typography>
                  <Typography variant="body2">3. Locate the Test or Production key.</Typography>
                  <Typography variant="body2">4. Copy the selected key.</Typography>
                  <Typography variant="body2">5. Return to Schedulaa.</Typography>
                  <Typography variant="body2">6. Open Products -> Delivery setup -> EasyPost Automation.</Typography>
                  <Typography variant="body2">7. Paste the key into the EasyPost API key field.</Typography>
                  <Typography variant="body2">8. Save.</Typography>
                  <Typography variant="body2">9. Click Test connection.</Typography>
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    Never place the API key in Product descriptions, email, public documentation, or Commerce Copilot chat. After saving, Schedulaa should show only connection status and the last four characters.
                  </Alert>
                </Box>
              </Stack>
            )}

            {helpTab === "test_go_live" && (
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>Stage 1 - Configure</Typography>
                  <Typography variant="body2">- complete the EasyPost account</Typography>
                  <Typography variant="body2">- add a carrier</Typography>
                  <Typography variant="body2">- obtain a Test key</Typography>
                  <Typography variant="body2">- configure Schedulaa</Typography>
                  <Typography variant="body2">- add the origin</Typography>
                  <Typography variant="body2">- create a Package Profile</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>Stage 2 - Test</Typography>
                  <Typography variant="body2">- Test connection</Typography>
                  <Typography variant="body2">- run Test shipping setup</Typography>
                  <Typography variant="body2">- confirm Product and package data</Typography>
                  <Typography variant="body2">- confirm carrier services are returned</Typography>
                  <Typography variant="body2">- no label is purchased by the setup test</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>Stage 3 - Go live</Typography>
                  <Typography variant="body2">- finish EasyPost Production verification</Typography>
                  <Typography variant="body2">- confirm billing, Wallet, or carrier readiness</Typography>
                  <Typography variant="body2">- replace the Test key with the Production key</Typography>
                  <Typography variant="body2">- Test connection again</Typography>
                  <Typography variant="body2">- run a final setup test</Typography>
                  <Typography variant="body2">- place one controlled real order</Typography>
                  <Typography variant="body2">- purchase the first label from Schedulaa Product Orders</Typography>
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    Changing from a Test key to a Production key changes the EasyPost environment. Test data and Production data are separate.
                  </Alert>
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>What the shipping test does</Typography>
                  <Typography variant="body2">- Uses the current Product, quantity, selected Package Profile, shipping origin, and test destination.</Typography>
                  <Typography variant="body2">- Requests rates.</Typography>
                  <Typography variant="body2">- Buys no label.</Typography>
                  <Typography variant="body2">- Creates no order.</Typography>
                  <Typography variant="body2">- Charges no customer.</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>Webhook and tracking responsibility</Typography>
                  <Typography variant="body2">
                    Tracking integration is managed by Schedulaa. You do not need to manually create an EasyPost webhook unless Schedulaa Support specifically instructs you.
                  </Typography>
                </Box>
              </Stack>
            )}

            {helpTab === "troubleshooting" && (
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>Security Verification Required</Typography>
                  <Typography variant="body2">- submit the EasyPost support request</Typography>
                  <Typography variant="body2">- do not repeatedly replace API keys</Typography>
                  <Typography variant="body2">- wait for EasyPost instructions</Typography>
                  <Typography variant="body2">- Schedulaa cannot override the restriction</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>No API Keys page or key unavailable</Typography>
                  <Typography variant="body2">- confirm Wallet and ship-from address are configured</Typography>
                  <Typography variant="body2">- confirm account verification</Typography>
                  <Typography variant="body2">- contact EasyPost Support</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>Test connection failed</Typography>
                  <Typography variant="body2">- confirm the correct key environment</Typography>
                  <Typography variant="body2">- remove spaces before or after the key</Typography>
                  <Typography variant="body2">- confirm the key is active</Typography>
                  <Typography variant="body2">- confirm account restrictions in EasyPost</Typography>
                  <Typography variant="body2">- save and test again</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>No rates</Typography>
                  <Typography variant="body2">- verify carrier setup</Typography>
                  <Typography variant="body2">- verify origin</Typography>
                  <Typography variant="body2">- verify Product weight</Typography>
                  <Typography variant="body2">- verify Package Profile</Typography>
                  <Typography variant="body2">- verify destination policy</Typography>
                  <Typography variant="body2">- test a valid destination</Typography>
                  <Typography variant="body2">- check EasyPost account limitations</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>Test works but Production fails</Typography>
                  <Typography variant="body2">- confirm the Production API key</Typography>
                  <Typography variant="body2">- confirm Production carrier or billing state</Typography>
                  <Typography variant="body2">- confirm EasyPost account verification</Typography>
                  <Typography variant="body2">- test the Production connection again</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>Label purchase blocked</Typography>
                  <Typography variant="body2">- verify the EasyPost Production account</Typography>
                  <Typography variant="body2">- verify carrier billing or Wallet state</Typography>
                  <Typography variant="body2">- verify order address and shipment readiness</Typography>
                  <Typography variant="body2">- review the Schedulaa error shown in Product Orders</Typography>
                </Box>
              </Stack>
            )}
          </Stack>
        </DialogContent>
      </Dialog>
      <CommerceCopilotDrawer
        open={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        token={token}
        initialWorkflow={copilotWorkflow}
      />
    </Box>
  );
};

export default EasyPostShippingSettingsPanel;
