// src/pages/sections/SettingsCheckoutPro.js
import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Divider,
  Grid,
  Stack,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Box,
  RadioGroup,
  FormLabel,
  Radio,
  Drawer,            // 👈 added
  IconButton,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import api, { isStripeOnboardingIncomplete, stripeConnect } from "../../utils/api";
import {
  getCurrencyOptions,
  resolveCurrencyForCountry,
  normalizeCurrency,
  setActiveCurrency,
} from "../../utils/currency";

// 👇 added (same folder as this file)
import TaxSetupCard from "./TaxSetupCard";
import TaxHelpGuide from "./TaxHelpGuide";
import { useTranslation } from "react-i18next";
import { isMobileComplianceMode } from "../../utils/mobileCompliance";
import MobileWebOnlyNotice from "../../components/mobile/MobileWebOnlyNotice";
import BookingPaymentPreviewDialog, { buildBookingPreviewSummary } from "../../components/booking/BookingPaymentPreviewDialog";

const CANADA_PROVINCES = [
  "AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","SK","YT",
];
const QUEBEC_ONLY = ["QC"];
const US_STATES = [
  "AL","AZ","AR","CA","CO","CT","DE","DC","FL","GA","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE",
  "NV","NH","NJ","NM","NC","ND","OH","OK","OR","PA","SC","SD","TN",
  "TX","UT","VT","VA","WA","WV","WI","WY",
];
const TAX_COUNTRY_CODES = ["US", "CA", "QC"];
const CHARGE_CURRENCY_CODES = ["PLATFORM_FIXED", "LOCALIZED"];
const CURRENCY_OPTIONS = getCurrencyOptions();

export default function SettingsCheckoutPro() {
  const { t } = useTranslation();
  const mobileComplianceMode = isMobileComplianceMode();
  const token = useMemo(() => localStorage.getItem("token") || "", []);
  const cardOnFileTaxTooltip = (
    <Box sx={{ maxWidth: 360, whiteSpace: "normal" }}>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        Tax on Card-on-file charges
      </Typography>
      <Typography variant="body2" sx={{ mb: 0.75 }}>
        Tax is not calculated automatically when charging a saved card.
        If you charge tax (GST/HST/Sales tax), add it to the amount manually.
        For automatic tax calculation, use Payment link / Invoice or Pay during checkout.
      </Typography>
      <Typography variant="body2">
        Example: Service $50 + 13% tax ($6.50) → Charge $56.50.
      </Typography>
    </Box>
  );
  const offlineTaxTooltip = (
    <Box sx={{ maxWidth: 340, whiteSpace: "normal" }}>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        Offline booking (manual payment)
      </Typography>
      <Typography variant="body2">
        Payments are collected later, outside of Stripe. If you charge tax,
        include it in the amount you collect.
      </Typography>
    </Box>
  );
  const payNowTaxTooltip = (
    <Box sx={{ maxWidth: 340, whiteSpace: "normal" }}>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        Pay during checkout (Stripe)
      </Typography>
      <Typography variant="body2">
        Stripe can calculate tax automatically during checkout when Automatic
        Tax is enabled in your Stripe dashboard.
      </Typography>
    </Box>
  );
  const pricesIncludeTaxTooltip = (
    <Box sx={{ maxWidth: 360, whiteSpace: "normal" }}>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        Prices include tax
      </Typography>
      <Typography variant="body2">
        If enabled, displayed prices already include tax. Stripe will back the
        tax out during checkout when Automatic Tax is on. Saved-card charges are
        still amount-only, so include tax in the amount you charge.
      </Typography>
    </Box>
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [msgSeverity, setMsgSeverity] = useState("info");

  const [appointmentPaymentMode, setAppointmentPaymentMode] = useState("offline");
  const [productPaymentsEnabled, setProductPaymentsEnabled] = useState(false);
  const [publishableKey, setPublishableKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [bookingHoldMinutes, setBookingHoldMinutes] = useState(3);
  const [pricesIncludeTax, setPricesIncludeTax] = useState(false);
  const [chargeCurrencyMode, setChargeCurrencyMode] = useState("PLATFORM_FIXED");
  const [taxCountry, setTaxCountry] = useState("");
  const [taxRegion, setTaxRegion] = useState("");
  const [displayCurrency, setDisplayCurrency] = useState("USD");
  const [logoUrl, setLogoUrl] = useState("");
  const [companyCountry, setCompanyCountry] = useState("");
  const [companySlug, setCompanySlug] = useState("");
  const [savedBusinessCurrency, setSavedBusinessCurrency] = useState("USD");
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewServices, setPreviewServices] = useState([]);
  const [previewServicesLoading, setPreviewServicesLoading] = useState(false);
  const [previewServicesLoaded, setPreviewServicesLoaded] = useState(false);
  const [previewServiceId, setPreviewServiceId] = useState("");
  const [previewAddons, setPreviewAddons] = useState([]);
  const [previewAddonIds, setPreviewAddonIds] = useState([]);
  const [previewSampleAmount, setPreviewSampleAmount] = useState("100.00");
  const [bookingPreview, setBookingPreview] = useState(null);
  const [bookingPreviewLoading, setBookingPreviewLoading] = useState(false);
  const [bookingPreviewError, setBookingPreviewError] = useState("");
  const [bookingPreviewStale, setBookingPreviewStale] = useState(false);

  // 👇 Help drawer state
  const [guideOpen, setGuideOpen] = useState(false);

  const appointmentNeedsCheckoutPayment =
    appointmentPaymentMode === "pay_now" || appointmentPaymentMode === "deposit";
  const allowCardOnFile = appointmentPaymentMode === "card_on_file";
  const stripeNeeded =
    productPaymentsEnabled || appointmentNeedsCheckoutPayment || allowCardOnFile;
  const isProdEnv = process.env.NODE_ENV === "production";

  const trimmedKey = (publishableKey || "").trim();
  const pkRegex = /^pk_(test|live)_[A-Za-z0-9]+/i;
  const secretLike = /^sk_|^whsec_/i.test(trimmedKey);
  let keyError = "";
  const stripeKeyRequired = stripeNeeded;
  if (stripeKeyRequired) {
    if (!trimmedKey) {
      keyError = "Publishable key is required when Stripe payments are enabled.";
    } else if (secretLike) {
      keyError = "Use your Stripe publishable key (pk_test_ or pk_live_), not a secret or webhook key.";
    } else if (!pkRegex.test(trimmedKey)) {
      keyError = "Invalid publishable key format. Expected pk_test_… or pk_live_…";
    }
  } else if (trimmedKey && secretLike) {
    keyError = "Use your Stripe publishable key (pk_test_ or pk_live_), not a secret or webhook key.";
  }
  const keyWarning = stripeKeyRequired && isProdEnv && trimmedKey.startsWith("pk_test_")
    ? "Production requires a pk_live_ publishable key."
    : "";
  const disableSave = saving || (!!keyError && stripeKeyRequired);

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        const [companyRes, policyRes] = await Promise.all([
          api.get(`/admin/company-profile`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get(`/admin/payments-policy`, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => ({ data: null })),
        ]);
        if (ignore) return;
        const data = companyRes?.data || {};
        const policyData = policyRes?.data || {};

        const enable = !!data.enable_stripe_payments;
        const allow = !!data.allow_card_on_file;
        const productEnabled =
          data.enable_product_payments == null
            ? enable
            : !!data.enable_product_payments;
        const rawMode = String(policyData?.mode || "").toLowerCase();
        let mode = "offline";
        if (rawMode === "capture" && allow) {
          mode = "card_on_file";
        } else if (rawMode === "deposit" && enable) {
          mode = "deposit";
        } else if (rawMode === "pay" && enable) {
          mode = "pay_now";
        } else if (allow) {
          mode = "card_on_file";
        } else if (enable) {
          mode = "pay_now";
        }
        setAppointmentPaymentMode(mode);
        setProductPaymentsEnabled(productEnabled);

        const envPublishable = process.env.REACT_APP_STRIPE_PUBLIC_KEY || "";
        setPublishableKey(data.stripe_publishable_key || envPublishable);
        setBookingHoldMinutes(data.booking_hold_minutes ?? 3);
        setPricesIncludeTax(!!data.prices_include_tax);
        setChargeCurrencyMode((data.charge_currency_mode || "PLATFORM_FIXED").toUpperCase());
        setTaxCountry((data.tax_country_code || "").toUpperCase());
        setTaxRegion((data.tax_region_code || "").toUpperCase());
        const normalizedDisplay = normalizeCurrency(data.display_currency || "") || "USD";
        setDisplayCurrency(normalizedDisplay);
        setActiveCurrency(normalizedDisplay);
        setLogoUrl(data.logo_url || "");
        setCompanySlug(data.slug || "");
        setCompanyCountry((data.country_code || "").toUpperCase());
        const resolvedCurrency =
          normalizeCurrency(
            data?.currency_context?.business_selling_currency ||
            data?.display_currency
          ) ||
          normalizeCurrency(resolveCurrencyForCountry((data.tax_country_code || data.country_code || "").toUpperCase())) ||
          "USD";
        setSavedBusinessCurrency(resolvedCurrency);
      } catch (error) {
        setMsg(t("settings.checkout.loadError"));
        setMsgSeverity("error");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    load();
    return () => { ignore = true; };
  }, [token]);

  const localizedCurrency = chargeCurrencyMode === "LOCALIZED";
  const resolvedBusinessCurrency = useMemo(() => {
    if (localizedCurrency) {
      return normalizeCurrency(resolveCurrencyForCountry((taxCountry || companyCountry || "").toUpperCase())) || "USD";
    }
    return normalizeCurrency(displayCurrency) || "USD";
  }, [localizedCurrency, taxCountry, companyCountry, displayCurrency]);

  useEffect(() => {
    const targetCountry = (taxCountry || companyCountry || "").toUpperCase();
    if (!targetCountry) return;

    if (localizedCurrency) {
      const desired = resolveCurrencyForCountry(targetCountry);
      const normalizedDesired = normalizeCurrency(desired);
      if (normalizedDesired && normalizedDesired !== normalizeCurrency(displayCurrency)) {
        setDisplayCurrency(normalizedDesired);
      }
    } else if (!displayCurrency) {
      const fallback = resolveCurrencyForCountry(targetCountry);
      if (fallback) setDisplayCurrency(normalizeCurrency(fallback) || "USD");
    }
  }, [localizedCurrency, taxCountry, companyCountry, displayCurrency]);

  useEffect(() => {
    const normalized = normalizeCurrency(displayCurrency);
    if (normalized) setActiveCurrency(normalized);
  }, [displayCurrency]);

  useEffect(() => {
    if (!previewDialogOpen || !bookingPreview) return;
    setBookingPreviewStale(true);
  }, [
    previewServiceId,
    previewAddonIds,
    previewSampleAmount,
    appointmentPaymentMode,
    pricesIncludeTax,
    resolvedBusinessCurrency,
    previewDialogOpen,
  ]);

  useEffect(() => {
    if (!previewDialogOpen) return;
    let ignore = false;
    const loadServices = async () => {
      setPreviewServicesLoading(true);
      setPreviewServicesLoaded(false);
      try {
        const { data } = await api.get("/booking/services?active=true", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (ignore) return;
        const rows = Array.isArray(data) ? data : [];
        setPreviewServices(rows);
        if (!previewServiceId && rows.length) {
          setPreviewServiceId(String(rows[0].id));
        }
      } catch (error) {
        if (!ignore) {
          setPreviewServices([]);
          setBookingPreviewError(error?.response?.data?.error || "Unable to load services for preview.");
        }
      } finally {
        if (!ignore) {
          setPreviewServicesLoading(false);
          setPreviewServicesLoaded(true);
        }
      }
    };
    loadServices();
    return () => {
      ignore = true;
    };
  }, [previewDialogOpen, previewServiceId, token]);

  useEffect(() => {
    if (!previewDialogOpen || !companySlug || !previewServiceId) {
      setPreviewAddons([]);
      setPreviewAddonIds([]);
      return;
    }
    let ignore = false;
    const loadAddons = async () => {
      try {
        const { data } = await api.get(`/public/${companySlug}/service/${previewServiceId}/addons`);
        if (ignore) return;
        const rows = Array.isArray(data) ? data : [];
        setPreviewAddons(rows);
        setPreviewAddonIds((prev) =>
          prev.filter((id) => rows.some((row) => String(row.id) === String(id)))
        );
      } catch {
        if (!ignore) {
          setPreviewAddons([]);
          setPreviewAddonIds([]);
        }
      }
    };
    loadAddons();
    return () => {
      ignore = true;
    };
  }, [previewDialogOpen, companySlug, previewServiceId]);

  const taxRegionList = React.useMemo(() => {
    const code = (taxCountry || "").toUpperCase();
    if (code === "CA") return Array.from(new Set([...CANADA_PROVINCES, ...QUEBEC_ONLY]));
    if (code === "QC") return QUEBEC_ONLY;
    if (code === "US") return US_STATES;
    return [];
  }, [taxCountry]);

  useEffect(() => {
    if (!taxRegionList.length) return;
    if (taxRegion && !taxRegionList.includes(taxRegion)) setTaxRegion("");
  }, [taxRegionList, taxRegion]);

  const handleSaveSuccess = (data, policyData) => {
    const enable = !!data.enable_stripe_payments;
    const allow = !!data.allow_card_on_file;
    const productEnabled =
      data.enable_product_payments == null
        ? enable
        : !!data.enable_product_payments;
    const rawMode = String(policyData?.mode || "").toLowerCase();
    let mode = "offline";
    if (rawMode === "capture" && allow) {
      mode = "card_on_file";
    } else if (rawMode === "deposit" && enable) {
      mode = "deposit";
    } else if (rawMode === "pay" && enable) {
      mode = "pay_now";
    } else if (allow) {
      mode = "card_on_file";
    } else if (enable) {
      mode = "pay_now";
    }
    setAppointmentPaymentMode(mode);
    setProductPaymentsEnabled(productEnabled);
    setPricesIncludeTax(!!data.prices_include_tax);
    setChargeCurrencyMode((data.charge_currency_mode || "PLATFORM_FIXED").toUpperCase());
    setTaxCountry((data.tax_country_code || "").toUpperCase());
    setTaxRegion((data.tax_region_code || "").toUpperCase());
    const normalizedDisplay = normalizeCurrency(data.display_currency || "") || "USD";
    setDisplayCurrency(normalizedDisplay);
    setActiveCurrency(normalizedDisplay);
    setLogoUrl(data.logo_url || "");
    setCompanySlug(data.slug || "");
    setCompanyCountry((data.country_code || "").toUpperCase());
    setBookingHoldMinutes(data.booking_hold_minutes ?? 3);
    const resolvedCurrency =
      normalizeCurrency(
        data?.currency_context?.business_selling_currency ||
        data?.display_currency
      ) ||
      normalizeCurrency(resolveCurrencyForCountry((data.tax_country_code || data.country_code || "").toUpperCase())) ||
      "USD";
    setSavedBusinessCurrency(resolvedCurrency);
  };

  const runBookingPreview = async () => {
    setBookingPreviewLoading(true);
    setBookingPreviewError("");
    try {
      const payload = previewServiceId
        ? {
            source_type: "draft",
            service_id: Number(previewServiceId),
            addon_ids: previewAddonIds.map((id) => Number(id)),
          }
        : {
            source_type: "draft",
            sample_amount: Number(previewSampleAmount || 0),
          };
      const { data } = await api.post("/api/manager/booking-payment-preview", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookingPreview(data);
      setBookingPreviewStale(false);
    } catch (error) {
      setBookingPreviewError(error?.response?.data?.error || "Unable to preview booking payment.");
    } finally {
      setBookingPreviewLoading(false);
    }
  };

  const openBookingPreview = () => {
    setPreviewDialogOpen(true);
    setBookingPreview(null);
    setBookingPreviewError("");
    setBookingPreviewStale(false);
  };

  const handleCopyBookingPreview = async () => {
    if (!bookingPreview) return;
    try {
      await navigator.clipboard.writeText(buildBookingPreviewSummary(bookingPreview));
      setMsg("Booking payment preview copied.");
      setMsgSeverity("success");
    } catch {
      setMsg("Unable to copy the booking preview.");
      setMsgSeverity("error");
    }
  };

  useEffect(() => {
    if (!previewDialogOpen || bookingPreview || bookingPreviewLoading || previewServicesLoading || !previewServicesLoaded) return;
    if (previewServiceId || previewServices.length === 0) {
      runBookingPreview();
    }
  }, [
    previewDialogOpen,
    bookingPreview,
    bookingPreviewLoading,
    previewServicesLoading,
    previewServicesLoaded,
    previewServiceId,
    previewServices.length,
  ]);

  const onSave = async () => {
    const currentSavedCurrency = normalizeCurrency(savedBusinessCurrency) || "USD";
    const nextResolvedCurrency = resolvedBusinessCurrency;
    if (
      currentSavedCurrency &&
      nextResolvedCurrency &&
      currentSavedCurrency !== nextResolvedCurrency &&
      !window.confirm(
        `Changing ${currentSavedCurrency} to ${nextResolvedCurrency} does not convert existing numeric prices. A product priced at ${currentSavedCurrency} 50 will become ${nextResolvedCurrency} 50 under the new business currency.`
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      const appointmentPolicyMode =
        appointmentPaymentMode === "card_on_file"
          ? "capture"
          : appointmentPaymentMode === "deposit"
            ? "deposit"
            : appointmentPaymentMode === "pay_now"
              ? "pay"
              : "off";
      const payload = {
        enable_stripe_payments: appointmentNeedsCheckoutPayment,
        enable_product_payments: productPaymentsEnabled,
        allow_card_on_file: allowCardOnFile,
        stripe_publishable_key: publishableKey.trim(),
        booking_hold_minutes: Number(bookingHoldMinutes) || 0,
        prices_include_tax: pricesIncludeTax,
        charge_currency_mode: chargeCurrencyMode,
        tax_country_code: taxCountry,
        tax_region_code: taxRegion,
        display_currency: normalizeCurrency(displayCurrency) || "",
        logo_url: logoUrl.trim(),
      };

      const [companySaveRes, policySaveRes] = await Promise.all([
        api.post(`/admin/company-profile`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.post(
          `/admin/payments-policy`,
          { appointment_payment_mode: appointmentPolicyMode },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ),
      ]);

      const data = companySaveRes?.data;
      const savedPolicy = policySaveRes?.data?.policy || { mode: appointmentPolicyMode };
      if (data && typeof data === "object") handleSaveSuccess(data, savedPolicy);

      setMsg(t("settings.checkout.saveSuccess"));
      setMsgSeverity("success");
    } catch (error) {
      setMsg(error?.response?.data?.error || t("settings.common.saveError"));
      setMsgSeverity("error");
    } finally {
      setSaving(false);
    }
  };

  // 👇 helper to open Stripe dashboard from this page too (same as TaxSetupCard)
  const openStripeDashboard = async () => {
    try {
      const data = await stripeConnect.dashboardLogin({}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data?.url) {
        window.open(data.url, "_blank", "noopener");
      }
    } catch (e) {
      if (isStripeOnboardingIncomplete(e)) {
        try {
          const onboardingUrl = e?.response?.data?.onboarding_url;
          if (onboardingUrl) {
            window.open(onboardingUrl, "_blank", "noopener");
            setMsg(t("settings.checkout.onboardingContinue", "Complete Stripe onboarding to access the dashboard."));
            setMsgSeverity("info");
            return;
          }
          const data = await stripeConnect.refreshOnboardingLink({}, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (data?.url) {
            window.open(data.url, "_blank", "noopener");
            setMsg(t("settings.checkout.onboardingContinue", "Complete Stripe onboarding to access the dashboard."));
            setMsgSeverity("info");
            return;
          }
        } catch (linkErr) {
          setMsg(linkErr?.response?.data?.error || linkErr?.message || t("settings.checkout.openDashboardError"));
          setMsgSeverity("error");
          return;
        }
      }
      setMsg(e?.response?.data?.error || t("settings.checkout.openDashboardError"));
      setMsgSeverity("error");
    }
  };

  if (mobileComplianceMode) {
    return (
      <Card variant="outlined">
        <CardHeader
          title={t("settings.tabs.checkout", "Checkout Pro & Payments")}
          subheader={t("settings.checkout.subtitle", "Configure checkout and payment collection rules.")}
        />
        <CardContent>
          <MobileWebOnlyNotice
            title="Checkout Pro settings are web-only in mobile app mode"
            webPath="/manager/dashboard?view=settings&tab=checkout"
          />
        </CardContent>
      </Card>
    );
  }

  const appointmentSummaryLabel =
    appointmentPaymentMode === "card_on_file"
      ? "Card on file"
      : appointmentPaymentMode === "deposit"
        ? "Deposit during Checkout"
        : appointmentPaymentMode === "pay_now"
          ? "Pay during booking Checkout"
          : "No online payment";
  const productSummaryLabel = productPaymentsEnabled ? "Paid during Checkout" : "Online Product payments are off";

  if (loading) {
    return (
      <Card variant="outlined">
        <CardHeader title={t("settings.checkout.title")} />
        <Divider />
        <CardContent><Typography>{t("settings.common.loading")}</Typography></CardContent>
      </Card>
    );
  }

  const taxRegionOptions = taxRegionList.length ? (
    <FormControl fullWidth>
      <InputLabel id="tax-region-label">{t("settings.checkout.taxRegion.selectLabel")}</InputLabel>
      <Select
        labelId="tax-region-label"
        value={taxRegion}
        label={t("settings.checkout.taxRegion.selectLabel")}
        onChange={(event) => setTaxRegion((event.target.value || "").toUpperCase())}
      >
        {taxRegionList.map((code) => (
          <MenuItem key={code} value={code}>
            {code}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  ) : (
    <TextField
      fullWidth
      label={t("settings.checkout.taxRegion.overrideLabel")}
      value={taxRegion}
      onChange={(event) => setTaxRegion((event.target.value || "").toUpperCase())}
      helperText={t("settings.checkout.taxRegion.overrideHelper")}
    />
  );

  return (
    <>
      <Card variant="outlined">
        <CardHeader
          title={t("settings.checkout.title")}
          subheader={t("settings.checkout.subheader")}
        />
        <Divider />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl component="fieldset" fullWidth>
                <FormLabel component="legend">Appointment payment policy</FormLabel>
                <RadioGroup value={appointmentPaymentMode} onChange={(e) => setAppointmentPaymentMode(e.target.value)}>
                  <FormControlLabel
                    value="offline"
                    control={<Radio />}
                    label={
                      <Stack spacing={0.5} alignItems="flex-start">
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Typography variant="body2">{t("settings.checkout.modes.offline.title")}</Typography>
                          <Tooltip title={offlineTaxTooltip}>
                            <IconButton size="small" aria-label="tax info">
                              <InfoOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {t("settings.checkout.modes.offline.description")}
                        </Typography>
                      </Stack>
                    }
                  />
                  <FormControlLabel
                    value="card_on_file"
                    control={<Radio />}
                    label={
                      <Stack spacing={0.5} alignItems="flex-start">
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Typography variant="body2">{t("settings.checkout.modes.cardOnFile.title")}</Typography>
                          <Tooltip title={cardOnFileTaxTooltip}>
                            <IconButton size="small" aria-label="tax info">
                              <InfoOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {t("settings.checkout.modes.cardOnFile.description")}
                        </Typography>
                      </Stack>
                    }
                  />
                  <FormControlLabel
                    value="deposit"
                    control={<Radio />}
                    label={
                      <Stack spacing={0.5} alignItems="flex-start">
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Typography variant="body2">Deposit during Checkout</Typography>
                          <Tooltip title={payNowTaxTooltip}>
                            <IconButton size="small" aria-label="tax info">
                              <InfoOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          Controls how customers pay when booking appointments.
                        </Typography>
                      </Stack>
                    }
                  />
                  <FormControlLabel
                    value="pay_now"
                    control={<Radio />}
                    label={
                      <Stack spacing={0.5} alignItems="flex-start">
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Typography variant="body2">{t("settings.checkout.modes.payNow.title")}</Typography>
                          <Tooltip title={payNowTaxTooltip}>
                            <IconButton size="small" aria-label="tax info">
                              <InfoOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {t("settings.checkout.modes.payNow.description")}
                        </Typography>
                      </Stack>
                    }
                  />
                </RadioGroup>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={productPaymentsEnabled}
                    onChange={(event) => setProductPaymentsEnabled(event.target.checked)}
                  />
                }
                label={
                  <Stack spacing={0.5} alignItems="flex-start">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Product payment settings
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Products are always paid during Checkout. This setting does not change your appointment payment policy.
                    </Typography>
                  </Stack>
                }
              />
            </Grid>

            <Grid item xs={12}>
              <Alert severity="info">
                Appointments: <strong>{appointmentSummaryLabel}</strong>
                {" · "}
                Products: <strong>{productSummaryLabel}</strong>
              </Alert>
            </Grid>

            {productPaymentsEnabled && !trimmedKey && (
              <Grid item xs={12}>
                <Alert severity="warning">Connect Stripe before accepting Product payments.</Alert>
              </Grid>
            )}

            {allowCardOnFile && !trimmedKey && (
              <Grid item xs={12}>
                <Alert severity="warning">Connect Stripe before saving cards on file for appointment bookings.</Alert>
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                label={t("settings.checkout.publishableKey.label")}
                fullWidth
                value={publishableKey}
                onChange={(e) => setPublishableKey(e.target.value)}
                placeholder={t("settings.checkout.publishableKey.placeholder")}
                type={showKey ? "text" : "password"}
                error={!!keyError}
                helperText={
                  keyError ||
                  keyWarning ||
                  "Managed by Schedulaa (Stripe Connect). This public key is used for checkout."
                }
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle publishable key visibility"
                        onClick={() => setShowKey((prev) => !prev)}
                        edge="end"
                      >
                        {showKey ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              {keyWarning && (
                <Alert sx={{ mt: 1 }} severity="warning">
                  {keyWarning}
                </Alert>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label={
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <span>{t("settings.checkout.bookingHold.label")}</span>
                    <Tooltip title={t("settings.checkout.bookingHold.tooltip")}>
                      <InfoOutlined fontSize="small" />
                    </Tooltip>
                  </Stack>
                }
                fullWidth
                type="number"
                inputProps={{ min: 1, step: 1 }}
                value={bookingHoldMinutes}
                onChange={(e) => setBookingHoldMinutes(e.target.value)}
                helperText={t("settings.checkout.bookingHold.helper")}
                InputProps={{
                  endAdornment: <InputAdornment position="end">min</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider />
              <Typography variant="subtitle2" sx={{ mt: 2 }}>
                {t("settings.checkout.section.taxLocalization")}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={<Switch checked={pricesIncludeTax} onChange={(e) => setPricesIncludeTax(e.target.checked)} />}
                label={
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <span>{t("settings.checkout.pricesIncludeTax.label")}</span>
                    <Tooltip title={pricesIncludeTaxTooltip}>
                      <IconButton size="small" aria-label="tax info">
                        <InfoOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                }
              />
              <Typography variant="caption" color="text.secondary" display="block">
                {t("settings.checkout.pricesIncludeTax.helper")}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="charge-currency-mode-label">Currency rule</InputLabel>
                <Select
                  labelId="charge-currency-mode-label"
                  value={chargeCurrencyMode}
                  label="Currency rule"
                  onChange={(e) => setChargeCurrencyMode(e.target.value)}
                >
                  {CHARGE_CURRENCY_CODES.map((code) => (
                    <MenuItem key={code} value={code}>
                      {code === "PLATFORM_FIXED" ? "Fixed business currency" : "Business-country currency"}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75 }}>
                {localizedCurrency
                  ? "Uses the standard currency for your business tax country. Canadian businesses use CAD; U.S. businesses use USD."
                  : "Use one fixed business currency for Products, checkout, and Finance defaults."}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="tax-country-label">{t("settings.checkout.taxCountry.label")}</InputLabel>
                <Select
                  labelId="tax-country-label"
                  value={taxCountry}
                  label={t("settings.checkout.taxCountry.label")}
                  onChange={(e) => {
                    const value = (e.target.value || "").toUpperCase();
                    setTaxCountry(value);
                    setTaxRegion("");
                  }}
                >
                  <MenuItem value=""><em>{t("settings.checkout.taxCountry.placeholder")}</em></MenuItem>
                  {TAX_COUNTRY_CODES.map((code) => (
                    <MenuItem key={code} value={code}>
                      {t(`settings.checkout.taxCountry.options.${code.toLowerCase()}`)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>{taxRegionOptions}</Grid>

            <Grid item xs={12}>
              <Alert severity="info">
                Current Product and Finance currency: <strong>{resolvedBusinessCurrency}</strong>
              </Alert>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="display-currency-label">Business selling currency</InputLabel>
                <Select
                  labelId="display-currency-label"
                  value={(displayCurrency || "USD").toUpperCase()}
                  label="Business selling currency"
                  onChange={(e) => setDisplayCurrency((e.target.value || "USD").toUpperCase())}
                  disabled={localizedCurrency}
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <MenuItem key={c.code} value={c.code}>{c.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary" display="block">
                {localizedCurrency
                  ? "Derived from your business tax country. Customer-location conversion is not enabled."
                  : "Used for Products, Services, checkout, and Finance defaults."}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t("settings.checkout.logo.label")}
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                helperText={t("settings.checkout.logo.helper")}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              {logoUrl ? (
                <Box sx={{ p: 1, border: "1px solid #ccc", textAlign: "center", height: 100, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:1, backgroundColor:"background.paper" }}>
                  <img
                    src={logoUrl}
                    alt={t("settings.checkout.logo.previewAlt")}
                    style={{ maxHeight: "80px", maxWidth: "100%" }}
                    onError={(e) => { e.target.onerror = null; e.target.src="https://via.placeholder.com/150x50?text=Logo"; }}
                  />
                </Box>
              ) : (
                <Typography variant="caption" color="text.secondary">{t("settings.checkout.logo.empty")}</Typography>
              )}
            </Grid>
          </Grid>

          <Stack direction="row" spacing={2} sx={{ mt: 3, flexWrap: "wrap" }}>
            <Button variant="contained" disabled={disableSave} onClick={onSave}>
              {saving ? t("settings.common.saving") : t("settings.checkout.buttons.save")}
            </Button>
            <Button variant="outlined" onClick={openBookingPreview}>
              Preview booking payment
            </Button>
            <Button variant="outlined" onClick={() => setGuideOpen(true)}>{t("settings.checkout.buttons.openTaxHelp")}</Button>
            <Button variant="text" onClick={openStripeDashboard}>{t("settings.checkout.buttons.openStripeDashboard")}</Button>
          </Stack>
        </CardContent>

        <Snackbar open={!!msg} autoHideDuration={3500} onClose={() => setMsg(null)}>
          <Alert onClose={() => setMsg(null)} severity={msgSeverity} sx={{ width: "100%" }}>
            {msg}
          </Alert>
        </Snackbar>
      </Card>

      {/* 👇 Your new “Tax setup” card (status + quick actions) */}
      <TaxSetupCard />

      {/* 👇 Guide Drawer (like your payroll guide) */}
      <Drawer anchor="right" open={guideOpen} onClose={() => setGuideOpen(false)}>
        <Box sx={{ width: 600, p: 3 }}>
          <TaxHelpGuide
            onClose={() => setGuideOpen(false)}
            onOpenStripe={openStripeDashboard}
            pricesIncludeTax={pricesIncludeTax}
          />
        </Box>
      </Drawer>

      <BookingPaymentPreviewDialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        preview={bookingPreview}
        loading={bookingPreviewLoading || previewServicesLoading}
        error={bookingPreviewError}
        stale={bookingPreviewStale}
        onRefresh={runBookingPreview}
        onCopySummary={handleCopyBookingPreview}
      >
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Preview the current booking payment behavior using a saved Service or a sample amount. This does not change Checkout Pro settings.
          </Typography>
          {previewServices.length ? (
            <>
              <FormControl fullWidth>
                <InputLabel id="booking-preview-service-label">Select a Service</InputLabel>
                <Select
                  labelId="booking-preview-service-label"
                  value={previewServiceId}
                  label="Select a Service"
                  onChange={(event) => {
                    setPreviewServiceId(String(event.target.value || ""));
                    setBookingPreviewStale(Boolean(bookingPreview));
                  }}
                >
                  {previewServices.map((service) => (
                    <MenuItem key={service.id} value={String(service.id)}>
                      {service.name} — {resolvedBusinessCurrency} {Number(service.base_price || 0).toFixed(2)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {previewAddons.length ? (
                <FormControl fullWidth>
                  <InputLabel id="booking-preview-addon-label">Optional add-ons</InputLabel>
                  <Select
                    multiple
                    labelId="booking-preview-addon-label"
                    value={previewAddonIds}
                    label="Optional add-ons"
                    onChange={(event) => {
                      setPreviewAddonIds(event.target.value);
                      setBookingPreviewStale(Boolean(bookingPreview));
                    }}
                    renderValue={(selected) =>
                      previewAddons
                        .filter((addon) => selected.includes(String(addon.id)) || selected.includes(addon.id))
                        .map((addon) => addon.name)
                        .join(", ")
                    }
                  >
                    {previewAddons.map((addon) => (
                      <MenuItem key={addon.id} value={String(addon.id)}>
                        <Checkbox checked={previewAddonIds.includes(String(addon.id)) || previewAddonIds.includes(addon.id)} />
                        <ListItemText primary={`${addon.name} — ${Number(addon.base_price || 0).toFixed(2)}`} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : null}
            </>
          ) : (
            <TextField
              label="Sample Service price"
              type="number"
              value={previewSampleAmount}
              onChange={(event) => {
                setPreviewSampleAmount(event.target.value);
                setBookingPreviewStale(Boolean(bookingPreview));
              }}
              inputProps={{ min: 0, step: "0.01" }}
              fullWidth
              helperText="This sample is not saved."
            />
          )}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Typography variant="body2">
              Appointment mode: <strong>{appointmentSummaryLabel}</strong>
            </Typography>
            <Typography variant="body2">
              Product payments: <strong>{productPaymentsEnabled ? "Paid during Checkout" : "Off"}</strong>
            </Typography>
            <Typography variant="body2">
              Currency: <strong>{resolvedBusinessCurrency}</strong>
            </Typography>
            <Typography variant="body2">
              Prices include tax: <strong>{pricesIncludeTax ? "Yes" : "No"}</strong>
            </Typography>
          </Stack>
        </Stack>
      </BookingPaymentPreviewDialog>
    </>
  );
}
