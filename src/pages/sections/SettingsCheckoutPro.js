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
  Box,
  RadioGroup,
  FormLabel,
  Radio,
  Drawer,            // 👈 added
} from "@mui/material";
import axios from "axios";
import {
  getCurrencyOptions,
  resolveCurrencyForCountry,
  normalizeCurrency,
  setActiveCurrency,
} from "../../utils/currency";
import { wb } from "../../utils/api";
import useCompanyId from "../../hooks/useCompanyId";

// 👇 added (same folder as this file)
import TaxSetupCard from "./TaxSetupCard";
import TaxHelpGuide from "./TaxHelpGuide";
import { useTranslation } from "react-i18next";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const clampHoldMinutes = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 3;
  return Math.max(1, Math.min(120, Math.round(num)));
};

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
  const token = useMemo(() => localStorage.getItem("token") || "", []);
  const companyId = useCompanyId();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [msgSeverity, setMsgSeverity] = useState("info");

  const [paymentMode, setPaymentMode] = useState("offline");
  const [publishableKey, setPublishableKey] = useState("");
  const [pricesIncludeTax, setPricesIncludeTax] = useState(false);
  const [chargeCurrencyMode, setChargeCurrencyMode] = useState("PLATFORM_FIXED");
  const [taxCountry, setTaxCountry] = useState("");
  const [taxRegion, setTaxRegion] = useState("");
  const [displayCurrency, setDisplayCurrency] = useState("USD");
  const [logoUrl, setLogoUrl] = useState("");
  const [companyCountry, setCompanyCountry] = useState("");
  const [bookingHoldMinutes, setBookingHoldMinutes] = useState(3);
  const [holdLoading, setHoldLoading] = useState(true);
  const [holdSaving, setHoldSaving] = useState(false);

  // 👇 Help drawer state
  const [guideOpen, setGuideOpen] = useState(false);

  const enableStripe = paymentMode === "pay_now";
  const allowCardOnFile = paymentMode !== "offline";

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/admin/company-profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (ignore) return;

        const enable = !!data.enable_stripe_payments;
        const allow = !!data.allow_card_on_file;
        const mode = enable ? "pay_now" : allow ? "card_on_file" : "offline";
        setPaymentMode(mode);

        const envPublishable = process.env.REACT_APP_STRIPE_PUBLIC_KEY || "";
        setPublishableKey(data.stripe_publishable_key || envPublishable);
        setPricesIncludeTax(!!data.prices_include_tax);
        setChargeCurrencyMode((data.charge_currency_mode || "PLATFORM_FIXED").toUpperCase());
        setTaxCountry((data.tax_country_code || "").toUpperCase());
        setTaxRegion((data.tax_region_code || "").toUpperCase());
        const normalizedDisplay = normalizeCurrency(data.display_currency || "") || "USD";
        setDisplayCurrency(normalizedDisplay);
        setLogoUrl(data.logo_url || "");
        setCompanyCountry((data.country_code || "").toUpperCase());
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

  useEffect(() => {
    if (!companyId) {
      setHoldLoading(false);
      return;
    }
    let ignore = false;
    setHoldLoading(true);
    const loadHoldWindow = async () => {
      try {
        const res = await wb.getSettings(companyId);
        if (ignore) return;
        const minutes =
          res?.data?.booking_hold_minutes ??
          res?.data?.settings?.booking_hold_minutes ??
          3;
        setBookingHoldMinutes(clampHoldMinutes(minutes));
      } catch (err) {
        if (!ignore) {
          console.warn("settings: failed to load hold window", err);
        }
      } finally {
        if (!ignore) setHoldLoading(false);
      }
    };
    loadHoldWindow();
    return () => {
      ignore = true;
    };
  }, [companyId]);

  const localizedCurrency = chargeCurrencyMode === "LOCALIZED";

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

  const handleSaveSuccess = (data) => {
    const enable = !!data.enable_stripe_payments;
    const allow = !!data.allow_card_on_file;
    const mode = enable ? "pay_now" : allow ? "card_on_file" : "offline";
    setPaymentMode(mode);
    setPricesIncludeTax(!!data.prices_include_tax);
    setChargeCurrencyMode((data.charge_currency_mode || "PLATFORM_FIXED").toUpperCase());
    setTaxCountry((data.tax_country_code || "").toUpperCase());
    setTaxRegion((data.tax_region_code || "").toUpperCase());
    const normalizedDisplay = normalizeCurrency(data.display_currency || "") || "USD";
    setDisplayCurrency(normalizedDisplay);
    setLogoUrl(data.logo_url || "");
    setCompanyCountry((data.country_code || "").toUpperCase());
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const payload = {
        enable_stripe_payments: enableStripe,
        allow_card_on_file: allowCardOnFile,
        stripe_publishable_key: publishableKey.trim(),
        prices_include_tax: pricesIncludeTax,
        charge_currency_mode: chargeCurrencyMode,
        tax_country_code: taxCountry,
        tax_region_code: taxRegion,
        display_currency: normalizeCurrency(displayCurrency) || "",
        logo_url: logoUrl.trim(),
      };

      const { data } = await axios.post(`${API_URL}/admin/company-profile`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data && typeof data === "object") handleSaveSuccess(data);

      setMsg(t("settings.checkout.saveSuccess"));
      setMsgSeverity("success");
    } catch (error) {
      setMsg(error?.response?.data?.error || t("settings.common.saveError"));
      setMsgSeverity("error");
    } finally {
      setSaving(false);
    }
  };

  const saveHoldWindow = async () => {
    if (!companyId) {
      setMsg(t("settings.checkout.holdWindow.missingCompany", "Select a company before saving."));
      setMsgSeverity("error");
      return;
    }
    const minutes = clampHoldMinutes(bookingHoldMinutes);
    setBookingHoldMinutes(minutes);
    setHoldSaving(true);
    try {
      await wb.saveSettings(companyId, { booking_hold_minutes: minutes });
      setMsg(t("settings.checkout.holdWindow.saveSuccess", "Hold window updated."));
      setMsgSeverity("success");
    } catch (error) {
      setMsg(
        error?.response?.data?.error ||
          t("settings.checkout.holdWindow.saveError", "Unable to update the hold window.")
      );
      setMsgSeverity("error");
    } finally {
      setHoldSaving(false);
    }
  };

  // 👇 helper to open Stripe dashboard from this page too (same as TaxSetupCard)
  const openStripeDashboard = async () => {
    try {
      const { data } = await axios.post(`${API_URL}/connect/dashboard-login`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data?.url) window.open(data.url, "_blank", "noopener");
    } catch (e) {
      setMsg(e?.response?.data?.error || t("settings.checkout.openDashboardError"));
      setMsgSeverity("error");
    }
  };

  const alertMessage = enableStripe
    ? t("settings.checkout.alerts.payNow")
    : allowCardOnFile
    ? t("settings.checkout.alerts.cardOnFile")
    : t("settings.checkout.alerts.offline");

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
                <FormLabel component="legend">{t("settings.checkout.modes.legend")}</FormLabel>
                <RadioGroup value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                  <FormControlLabel
                    value="offline"
                    control={<Radio />}
                    label={
                      <Stack spacing={0.5} alignItems="flex-start">
                        <Typography variant="body2">{t("settings.checkout.modes.offline.title")}</Typography>
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
                        <Typography variant="body2">{t("settings.checkout.modes.cardOnFile.title")}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t("settings.checkout.modes.cardOnFile.description")}
                        </Typography>
                      </Stack>
                    }
                  />
                  <FormControlLabel
                    value="pay_now"
                    control={<Radio />}
                    label={
                      <Stack spacing={0.5} alignItems="flex-start">
                        <Typography variant="body2">{t("settings.checkout.modes.payNow.title")}</Typography>
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
              <Alert severity={enableStripe ? "info" : allowCardOnFile ? "warning" : "warning"}>
                {alertMessage}
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label={t("settings.checkout.publishableKey.label")}
                fullWidth
                value={publishableKey}
                onChange={(e) => setPublishableKey(e.target.value)}
                placeholder={t("settings.checkout.publishableKey.placeholder")}
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
                label={t("settings.checkout.pricesIncludeTax.label")}
              />
              <Typography variant="caption" color="text.secondary" display="block">
                {t("settings.checkout.pricesIncludeTax.helper")}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="charge-currency-mode-label">{t("settings.checkout.chargeCurrencyMode.label")}</InputLabel>
                <Select
                  labelId="charge-currency-mode-label"
                  value={chargeCurrencyMode}
                  label={t("settings.checkout.chargeCurrencyMode.label")}
                  onChange={(e) => setChargeCurrencyMode(e.target.value)}
                >
                  {CHARGE_CURRENCY_CODES.map((code) => (
                    <MenuItem key={code} value={code}>
                      {t(code === "PLATFORM_FIXED" ? "settings.checkout.chargeModes.platformFixed" : "settings.checkout.chargeModes.localized")}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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

            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={chargeCurrencyMode === "LOCALIZED"}>
                <InputLabel id="display-currency-label">{t("settings.checkout.displayCurrency.label")}</InputLabel>
                <Select
                  labelId="display-currency-label"
                  value={(displayCurrency || "USD").toUpperCase()}
                  label={t("settings.checkout.displayCurrency.label")}
                  onChange={(e) => setDisplayCurrency((e.target.value || "USD").toUpperCase())}
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <MenuItem key={c.code} value={c.code}>{c.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {chargeCurrencyMode === "LOCALIZED" && (
                <Typography variant="caption" color="text.secondary" display="block">
                  {t("settings.checkout.displayCurrency.helper")}
                </Typography>
              )}
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

          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button variant="contained" disabled={saving} onClick={onSave}>
              {saving ? t("settings.common.saving") : t("settings.checkout.buttons.save")}
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

      <Card variant="outlined" sx={{ mt: 3 }}>
        <CardHeader
          title={t("settings.checkout.holdWindow.title", "Booking Hold Window")}
          subheader={t(
            "settings.checkout.holdWindow.subheader",
            "Reserve selected service slots for a short window so other clients can't grab them while a checkout is in progress."
          )}
        />
        <Divider />
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "center" }}>
            <TextField
              type="number"
              label={t("settings.checkout.holdWindow.label", "Hold duration (minutes)")}
              value={bookingHoldMinutes}
              onChange={(e) => setBookingHoldMinutes(clampHoldMinutes(e.target.value))}
              inputProps={{ min: 1, max: 120 }}
              helperText={t(
                "settings.checkout.holdWindow.helper",
                "How long a client's selected slot stays locked before it is released back to the calendar."
              )}
              sx={{ maxWidth: 220 }}
              disabled={holdLoading || holdSaving}
            />
            <Button
              variant="contained"
              onClick={saveHoldWindow}
              disabled={holdLoading || holdSaving}
            >
              {holdSaving
                ? t("settings.common.saving")
                : t("settings.checkout.holdWindow.save", "Save Hold Window")}
            </Button>
          </Stack>
        </CardContent>
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
    </>
  );
}
