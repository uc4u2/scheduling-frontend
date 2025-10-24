// src/pages/sections/CompanyProfile.js
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import CompanySlugManager from "./CompanySlugManager";
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  Snackbar,
  TextField,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListSubheader,
  Stack,
  Alert,
  FormControlLabel,
  Switch,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import ManagementFrame from "../../components/ui/ManagementFrame";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { wb } from "../../utils/api"; // <-- add to verify public viewer
import {
  getCurrencyOptions,
  resolveCurrencyForCountry,
  normalizeCurrency,
  setActiveCurrency,
  isSupportedCurrency
} from "../../utils/currency";

/* ──────────────────────────────────────────────
   CONSTANTS – option lists declared once
   ────────────────────────────────────────────── */
const CANADA_PROVINCES = [
  "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "SK", "YT",
];
const QUEBEC_ONLY = ["QC"];
const US_STATES = [
  "AL","AZ","AR","CA","CO","CT","DE","DC","FL","GA","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE",
  "NV","NH","NJ","NM","NC","ND","OH","OK","OR","PA","SC","SD","TN",
  "TX","UT","VT","VA","WA","WV","WI","WY",
];
const TAX_COUNTRIES = [
  { code: "US", labelKey: "manager.companyProfile.payments.taxCountries.us" },
  { code: "CA", labelKey: "manager.companyProfile.payments.taxCountries.ca" },
  { code: "QC", labelKey: "manager.companyProfile.payments.taxCountries.qc" },
];

const CURRENCY_OPTIONS = getCurrencyOptions();

const UPPERCASE_FIELDS = new Set([
  "country_code",
  "province_code",
  "tax_country_code",
  "tax_region_code",
]);

const CHARGE_CURRENCY_MODES = [
  { code: "PLATFORM_FIXED", labelKey: "manager.companyProfile.payments.chargeModes.platformFixed" },
  { code: "LOCALIZED", labelKey: "manager.companyProfile.payments.chargeModes.localized" },
];

const STRIPE_TAX_DASHBOARD_URL = "https://dashboard.stripe.com/tax/registrations";


export default function CompanyProfile({ token }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const language = i18n.language;
  /* ---------- state ---------- */
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    logo_url: "",
    business_number: "",
    employer_number: "",
    federal_employer_id: "",
    payroll_program: "",
    contact_person: "",
    contact_phone: "",
    naics_code: "",
    contact_email: "",
    province_code: "",
    country_code: "",
    slug: "", // include slug in form state
    enable_stripe_payments: false,
    allow_card_on_file: false,
    prices_include_tax: false,
    tax_country_code: "",
    tax_region_code: "",
    charge_currency_mode: "PLATFORM_FIXED",
    display_currency: "USD",
  });

  // Departments
  const [departments, setDepartments] = useState([]);
  const [newDepartment, setNewDepartment] = useState({ name: "", description: "" });
  const [editingDepartmentId, setEditingDepartmentId] = useState(null);
  const [departmentDraft, setDepartmentDraft] = useState({ name: "", description: "" });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, messageKey: "", fallback: "", severity: "info" });

  // Public viewer check
  const [viewerCheckMsg, setViewerCheckMsg] = useState("");
  const [viewerCheckSeverity, setViewerCheckSeverity] = useState("info");
  const [viewerCheckBusy, setViewerCheckBusy] = useState(false);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  /* ---------- config ---------- */
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const endpoint = `${API_URL}/admin/company-profile`;

  /* ---------- helpers ---------- */
  const showMessage = (messageKey, severity = "info", fallback = "") =>
    setSnackbar({ open: true, messageKey, fallback, severity });

  /* ────────────────────────────────────────────────────────────────
     Departments – load list & add new one
     ──────────────────────────────────────────────────────────────── */
  const loadDepartments = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDepartments(data);
    } catch (err) {
      console.error("Failed to load departments", err);
      showMessage("manager.companyProfile.messages.departmentsLoadFailed", "error");
    }
  };

  const handleAddDepartment = async () => {
    const { name, description } = newDepartment;
    if (!name.trim()) {
      showMessage("manager.companyProfile.messages.departmentNameRequired", "warning");
      return;
    }
    try {
      const { data } = await axios.post(
        `${API_URL}/api/departments`,
        { name, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showMessage("manager.companyProfile.messages.departmentCreated", "success", data.message);
      setNewDepartment({ name: "", description: "" });
      loadDepartments();
    } catch (err) {
      console.error("Error creating department", err);
      showMessage("manager.companyProfile.messages.departmentCreateFailed", "error");
    }
  };

  useEffect(() => {
    loadDepartments();
  }, [token]);

  const startEditDepartment = (dept) => {
    setEditingDepartmentId(dept.id);
    setDepartmentDraft({ name: dept.name || '', description: dept.description || '' });
  };

  const handleDepartmentDraftChange = (field) => (event) => {
    const value = event.target.value;
    setDepartmentDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancelEditDepartment = () => {
    setEditingDepartmentId(null);
    setDepartmentDraft({ name: '', description: '' });
  };

  const handleUpdateDepartment = async () => {
    if (!editingDepartmentId) {
      return;
    }
    const { name, description } = departmentDraft;
    if (!name.trim()) {
      showMessage('manager.companyProfile.messages.departmentNameRequired', 'warning');
      return;
    }
    try {
      await axios.put(`${API_URL}/api/departments/${editingDepartmentId}`, { name, description }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showMessage('', 'success', 'Department updated.');
      handleCancelEditDepartment();
      loadDepartments();
    } catch (err) {
      console.error('Failed to update department', err);
      showMessage('', 'error', 'Failed to update department.');
    }
  };

  const handleDeleteDepartment = async (deptId) => {
    try {
      await axios.delete(`${API_URL}/api/departments/${deptId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (editingDepartmentId === deptId) {
        handleCancelEditDepartment();
      }
      showMessage('', 'success', 'Department removed.');
      loadDepartments();
    } catch (err) {
      console.error('Failed to delete department', err);
      showMessage('', 'error', 'Failed to delete department.');
    }
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!ignore && data && typeof data === 'object') {
          setForm((prev) => ({ ...prev, ...data }));
        }
        if (!ignore) {
          setProfileLoaded(true);
        }
      } catch (err) {
        console.error('Failed to load company profile', err);
        showMessage('manager.companyProfile.messages.profileLoadFailed', 'error');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [endpoint, token]);

  /* ---------- load profile ---------- */
  useEffect(() => {
    if (form.charge_currency_mode === 'LOCALIZED') {
      const targetCountry = (form.tax_country_code || form.country_code || '').toUpperCase();
      const desiredCurrency = resolveCurrencyForCountry(targetCountry);
      if (desiredCurrency && form.display_currency !== desiredCurrency) {
        setForm((prev) => ({ ...prev, display_currency: desiredCurrency }));
        setActiveCurrency(desiredCurrency);
      }
    } else if (!form.display_currency) {
      const fallbackCurrency = resolveCurrencyForCountry(form.country_code || form.tax_country_code || '');
      if (fallbackCurrency) {
        setForm((prev) => ({ ...prev, display_currency: fallbackCurrency }));
        setActiveCurrency(fallbackCurrency);
      }
    }
  }, [form.charge_currency_mode, form.tax_country_code, form.country_code, form.display_currency]);

  useEffect(() => {
    const norm = normalizeCurrency(form.display_currency);
    if (isSupportedCurrency(norm)) {
      setActiveCurrency(norm);
    }
  }, [form.display_currency]);

  useEffect(() => {
    if (!profileLoaded) return;
    const dismissed = localStorage.getItem("company_profile_prompt_dismissed");
    const needsProfile = !(form.name && form.slug);
    if (needsProfile && dismissed !== "true") {
      setShowProfilePrompt(true);
    }
  }, [profileLoaded, form.name, form.slug]);


  /* ---------- handle slug change ---------- */
  const handleSlugChange = async (newSlug) => {
    if (!newSlug) return;
    try {
      setSaving(true);
      await axios.patch(endpoint, { slug: newSlug }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setForm((f) => ({ ...f, slug: newSlug }));
      showMessage("manager.companyProfile.messages.slugUpdated", "success");
    } catch (err) {
      console.error("Failed to update slug", err);
      showMessage("manager.companyProfile.messages.slugUpdateFailed", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- submit ---------- */
  const handleSubmit = async () => {
    const { name, email } = form;
    if (!name || !email) {
      showMessage("manager.companyProfile.messages.nameEmailRequired", "warning");
      return;
    }
    try {
      setSaving(true);
      const method = form.id ? "put" : "post";
      const { data: updated } = await axios[method](endpoint, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (updated && typeof updated === "object") {
        setForm((prev) => ({ ...prev, ...updated }));
      }
      showMessage("manager.companyProfile.messages.saveSuccess", "success");
    } catch (err) {
      const serverMessage = err?.response?.data?.error || "";
      console.error("Save failed", err);
      if (serverMessage) {
        showMessage("", "error", serverMessage);
      } else {
        showMessage("manager.companyProfile.messages.saveFailed", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field) => (event) => {
    const rawValue = event && Object.prototype.hasOwnProperty.call(event, 'target') ? event.target.value : event;
    const value =
      UPPERCASE_FIELDS.has(field) && typeof rawValue === 'string'
        ? rawValue.toUpperCase()
        : rawValue;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleBoolean = (field) => (_, checked) => {
    setForm((prev) => ({ ...prev, [field]: Boolean(checked) }));
  };

  const provinceList = useMemo(() => {
    switch ((form.country_code || '').toUpperCase()) {
      case 'CA':
        return CANADA_PROVINCES;
      case 'QC':
        return QUEBEC_ONLY;
      case 'US':
        return US_STATES;
      default:
        return [];
    }
  }, [form.country_code]);

  const stripePaymentsEnabled = Boolean(form.enable_stripe_payments);
  const allowCardOnFileEnabled = Boolean(form.allow_card_on_file);

  const taxCountryCode = useMemo(() => (form.tax_country_code || form.country_code || '').toUpperCase(), [form.tax_country_code, form.country_code]);
  const taxCountryLabel = useMemo(() => {
    if (!taxCountryCode) return t("manager.companyProfile.payments.notSet");
    const match = TAX_COUNTRIES.find((option) => option.code === taxCountryCode);
    return match ? t(match.labelKey) : taxCountryCode;
  }, [taxCountryCode, language, t]);
  const chargeCurrencyLabel = useMemo(() => {
    const code = (form.charge_currency_mode || 'PLATFORM_FIXED').toUpperCase();
    const match = CHARGE_CURRENCY_MODES.find((mode) => mode.code === code);
    return match ? t(match.labelKey) : code;
  }, [form.charge_currency_mode, language, t]);
  const displayCurrencyLabel = useMemo(() => {
    const code = (form.display_currency || 'USD').toUpperCase();
    const match = CURRENCY_OPTIONS.find((currency) => currency.code === code);
    return match ? match.label : code;
  }, [form.display_currency]);
  /* ---------- viewer helpers ---------- */
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const viewerUrl = form.slug ? `${origin}/${form.slug}` : "";
  const snackbarMessage = snackbar.messageKey ? t(snackbar.messageKey) : snackbar.fallback || '';

  const checkPublicViewer = async () => {
    if (!form.slug) {
      setViewerCheckSeverity("info");
      setViewerCheckMsg(t("manager.companyProfile.public.setSlugFirst"));
      return;
    }
    try {
      setViewerCheckBusy(true);
      setViewerCheckMsg("");
      setViewerCheckSeverity("info");
      await wb.publicBySlug(form.slug); // GET /public/site/:slug
    } catch {
    } finally {
      setViewerCheckBusy(false);
    }
  };

/* ---------- render ---------- */
return (
    <>
      <Dialog
        open={showProfilePrompt}
        onClose={() => setShowProfilePrompt(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Complete Your Company Profile</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Add your company name and details so we can publish your starter site at
            <strong> https://schedulaa.com/&lt;your-slug&gt;</strong>.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You can always edit these details later, but finishing this step now helps your team launch faster.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={() => {
              setShowProfilePrompt(false);
              localStorage.setItem("company_profile_prompt_dismissed", "true");
            }}
          >
            Let’s do it
          </Button>
        </DialogActions>
      </Dialog>

      <ManagementFrame
        title={t("manager.companyProfile.title")}
        subtitle={t("manager.companyProfile.subtitle")}
      >

      

      <Paper sx={{ p: 3, mt: 2 }}>
        {loading ? (
          <CircularProgress />
        ) : (
          <>
            <Grid container spacing={2}>
              {t("manager.companyProfile.sections.locationSettings")}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mt: 1, mb: -1 }}>
                  {t("manager.companyProfile.sections.locationSettings")}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="country-label">Country Code</InputLabel>
                  <Select
                    labelId="country-label"
                    value={form.country_code}
                    label={t("manager.companyProfile.location.country.label")}
                    onChange={handleChange("country_code")}
                  >
                    <MenuItem value="CA">{t("manager.companyProfile.location.country.options.ca")}</MenuItem>
                    <MenuItem value="QC">{t("manager.companyProfile.location.country.options.qc")}</MenuItem>
                    <MenuItem value="US">{t("manager.companyProfile.location.country.options.us")}</MenuItem>
                    <MenuItem value="OTHER">{t("manager.companyProfile.location.country.options.other")}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="province-label">{t("manager.companyProfile.location.province.label")}</InputLabel>
                  <Select
                    labelId="province-label"
                    value={form.province_code}
                    label={t("manager.companyProfile.location.province.label")}
                    onChange={handleChange("province_code")}
                    disabled={!provinceList.length}
                  >
                    {provinceList.length > 0 && (
                    <ListSubheader disableSticky>
                      {form.country_code === "US"
                        ? t("manager.companyProfile.location.provinceGroup.us")
                        : form.country_code === "CA"
                        ? t("manager.companyProfile.location.provinceGroup.ca")
                        : form.country_code === "QC"
                        ? t("manager.companyProfile.location.provinceGroup.qc")
                        : t("manager.companyProfile.location.provinceGroup.other")}
                    </ListSubheader>
                    )}
                    {provinceList.map((code) => (
                      <MenuItem key={code} value={code}>
                        {code}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Basic Info */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t("manager.companyProfile.form.fields.companyName")}
                  value={form.name}
                  onChange={handleChange("name")}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t("manager.companyProfile.form.fields.businessNumber")}
                  value={form.business_number || ""}
                  onChange={(event) => {
                    const cleaned = (event.target.value || "").replace(/\D/g, "");
                    setForm((prev) => ({ ...prev, business_number: cleaned }));
                  }}
                  inputProps={{ inputMode: "numeric", pattern: "\\d+" }}
                  helperText={t("manager.companyProfile.form.hints.businessNumberDigits")}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t("manager.companyProfile.form.fields.employerNumber")}
                  value={form.employer_number || ""}
                  onChange={(event) => {
                    const cleaned = (event.target.value || "").replace(/\D/g, "");
                    setForm((prev) => ({ ...prev, employer_number: cleaned }));
                  }}
                  inputProps={{ inputMode: "numeric", pattern: "\\d+" }}
                  helperText={t("manager.companyProfile.form.hints.employerNumberDigits")}
                />
              </Grid>
              {form.country_code === "US" && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={t("manager.companyProfile.form.fields.federalEmployerId")}
                    value={form.federal_employer_id || ""}
                    onChange={handleChange("federal_employer_id")}
                    required
                  />
                </Grid>
              )}

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t("manager.companyProfile.form.fields.payrollProgram")}
                  value={form.payroll_program || ""}
                  onChange={handleChange("payroll_program")}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t("manager.companyProfile.form.fields.craContactPerson")}
                  value={form.contact_person || ""}
                  onChange={handleChange("contact_person")}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t("manager.companyProfile.form.fields.craContactPhone")}
                  value={form.contact_phone || ""}
                  onChange={handleChange("contact_phone")}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t("manager.companyProfile.form.fields.naicsCode")}
                  value={form.naics_code || ""}
                  onChange={handleChange("naics_code")}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t("manager.companyProfile.form.fields.craContactEmail")}
                  value={form.contact_email || ""}
                  onChange={handleChange("contact_email")}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t("manager.companyProfile.form.fields.email")}
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t("manager.companyProfile.form.fields.phone")}
                  value={form.phone}
                  onChange={handleChange("phone")}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t("manager.companyProfile.form.fields.website")}
                  value={form.website}
                  onChange={handleChange("website")}
                />
              </Grid>

              {/* Address */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t("manager.companyProfile.form.fields.streetAddress")}
                  value={form.address_street || ""}
                  onChange={(e) =>
                    setForm({ ...form, address_street: e.target.value })
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t("manager.companyProfile.form.fields.city")}
                  value={form.address_city || ""}
                  onChange={(e) =>
                    setForm({ ...form, address_city: e.target.value })
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label={
                    form.country_code === "CA"
                      ? t("manager.companyProfile.form.fields.postalCodeCa")
                      : t("manager.companyProfile.form.fields.postalCodeUs")
                  }
                  value={form.address_zip || ""}
                  onChange={(e) => {
                    let value = e.target.value.toUpperCase();
                    if (form.country_code === "CA") {
                      value = value
                        .replace(/[^A-Z0-9]/g, "")
                        .replace(/^(.{3})(.{0,3})$/, "$1 $2")
                        .trim();
                    } else if (form.country_code === "US") {
                      value = value.replace(/[^\d\-]/g, "");
                      if (value.length > 5 && !value.includes("-")) {
                        value = value.slice(0, 5) + "-" + value.slice(5);
                      }
                    }
                    setForm({ ...form, address_zip: value });
                  }}
                  inputProps={{
                    maxLength: form.country_code === "CA" ? 7 : 10,
                    pattern:
                      form.country_code === "CA"
                        ? "[A-Z][0-9][A-Z] [0-9][A-Z][0-9]"
                        : "\\d{5}(-\\d{4})?",
                    title:
                      form.country_code === "CA"
                        ? t("manager.companyProfile.form.hints.postalTitleCa")
                        : t("manager.companyProfile.form.hints.postalTitleUs")
                  }}
                  helperText={
                    form.country_code === "CA"
                      ? t("manager.companyProfile.form.hints.postalHelperCa")
                        : t("manager.companyProfile.form.hints.postalTitleUs")
                  }
                />
              </Grid>

              {/* Payments & Tax */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mt: 3 }}>
                  Payments & Tax
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Alert
                  severity={stripePaymentsEnabled ? "info" : "warning"}
                  sx={{ mt: 1 }}
                >
                  {stripePaymentsEnabled ? (
                    <>
                      {t("manager.companyProfile.payments.stripeTax.enabledIntro")} {'{'}' '{'}'}
                      <Link
                        href={STRIPE_TAX_DASHBOARD_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t("manager.companyProfile.payments.stripeTax.dashboardLink")}
                      </Link>
                      .
                    </>
                  ) : (
                    <>{t("manager.companyProfile.payments.stripeTax.enablePrompt")}</>
                  )}
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <Stack spacing={2}>
                  <Typography variant="subtitle2">{t("manager.companyProfile.sections.paymentsTax")}</Typography>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                  >
                    <Stack spacing={0.5}>
                      <Typography variant="body2">
                        {t("manager.companyProfile.payments.stripePayments")}: <strong>{stripePaymentsEnabled ? t("common.enabled") : t("common.disabled")}</strong>
                      </Typography>
                      <Typography variant="body2">
                        {t("manager.companyProfile.payments.cardsOnFile")}: <strong>{allowCardOnFileEnabled ? t("manager.companyProfile.payments.allowed") : t("common.disabled")}</strong>
                      </Typography>
                      <Typography variant="body2">
                        {t("manager.companyProfile.payments.pricesIncludeTax")}: <strong>{form.prices_include_tax ? t("common.yes") : t("common.no")}</strong>
                      </Typography>
                      <Typography variant="body2">
                        {t("manager.companyProfile.payments.chargeCurrencyMode")}: <strong>{chargeCurrencyLabel}</strong>
                      </Typography>
                      <Typography variant="body2">
                        {t("manager.companyProfile.payments.taxCountry")}: <strong>{taxCountryLabel}</strong>
                      </Typography>
                      <Typography variant="body2">
                        {t("manager.companyProfile.payments.taxRegion")}: <strong>{form.tax_region_code || t("manager.companyProfile.payments.notSet")}</strong>
                      </Typography>
                      <Typography variant="body2">
                        {t("manager.companyProfile.payments.displayCurrency")}: <strong>{displayCurrencyLabel}</strong>
                      </Typography>
                    </Stack>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/settings?tab=checkout')}
                    >
                      {t("manager.companyProfile.actions.manageStripeSettings")}
                    </Button>
                  </Stack>
                  {form.logo_url ? (
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {t("manager.companyProfile.branding.currentLogo")}
                      </Typography>
                      <Box
                        sx={{
                          p: 1,
                          border: '1px solid #ccc',
                          textAlign: 'center',
                          height: 80,
                          width: { xs: '100%', sm: 240 },
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 1,
                          backgroundColor: 'background.paper',
                        }}
                      >
                        <img
                          src={form.logo_url}
                          alt="Logo preview"
                          style={{ maxHeight: '60px', maxWidth: '100%' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/150x50?text=Logo'
                          }}
                        />
                      </Box>
                    </Box>
                  ) : null}
                  <Typography variant="caption" color="text.secondary">
                    {t("manager.companyProfile.payments.manageHint")}
                  </Typography>
                </Stack>
              </Grid>
              {/* Save Button */}
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={saving}
                >
                  {saving ? <CircularProgress size={24} /> : t("manager.companyProfile.actions.save")}
                </Button>
              </Grid>
            </Grid>
          </>
        )}
      </Paper>

      {/* Public site / slug controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <CompanySlugManager slug={form.slug} onSlugChange={handleSlugChange} token={token} />

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Public Site
          </Typography>
          {form.slug ? (
            <>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                <TextField
                  size="small"
                  fullWidth
                  value={viewerUrl}
                  InputProps={{ readOnly: true }}
                />
                <Button
                  variant="outlined"
                  onClick={() => navigator.clipboard.writeText(viewerUrl)}
                >
                  {t("manager.companyProfile.public.copyUrl")}
                </Button>
                <Button
                  variant="contained"
                  href={`/${form.slug}`}
                >
                  {t("manager.companyProfile.public.openViewer")}
                </Button>
                <Button
                  variant="outlined"
                  href={`/${form.slug}?edit=1`}
                >
                  {t("manager.companyProfile.public.openEditor")}
                </Button>
                <Button
                  variant="text"
                  href={`/${form.slug}/services`}
                >
                  {t("manager.companyProfile.public.services")}
                </Button>
                <Button
                  variant="text"
                  href={`/${form.slug}/reviews`}
                >
                  {t("manager.companyProfile.public.reviews")}
                </Button>
              </Stack>

              <Stack direction="row" spacing={1} sx={{ mt: 1 }} alignItems="center">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={checkPublicViewer}
                  disabled={viewerCheckBusy}
                >
                    {viewerCheckBusy ? t("manager.companyProfile.public.checking") : t("manager.companyProfile.public.checkPage")}
                </Button>
                {viewerCheckMsg && <Alert severity={viewerCheckSeverity}>{viewerCheckMsg}</Alert>}
              </Stack>
            </>
          ) : (
            <Alert severity="info">
              {t("manager.companyProfile.public.setSlugHint.prefix")} <code>photo-artisto-corp</code>{t("manager.companyProfile.public.setSlugHint.suffix")}
            </Alert>
          )}
        </Box>
      </Paper>

      {/* Departments */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          {t("manager.companyProfile.departments.title")}
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              label={t("manager.companyProfile.departments.fields.name")}
              value={newDepartment.name}
              onChange={(e) =>
                setNewDepartment((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </Grid>
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              label={t("manager.companyProfile.departments.fields.description")}
              value={newDepartment.description}
              onChange={(e) =>
                setNewDepartment((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button fullWidth variant="contained" onClick={handleAddDepartment}>
              {t("manager.companyProfile.departments.actions.add")}
            </Button>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          {departments.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {t("manager.companyProfile.departments.empty")}
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {departments.map((dept) => {
                const isEditing = editingDepartmentId === dept.id;
                return (
                  <Paper key={dept.id} variant="outlined" sx={{ p: 2 }}>
                    {isEditing ? (
                      <Stack spacing={1.5}>
                        <TextField
                          label={t("manager.companyProfile.departments.fields.name")}
                          value={departmentDraft.name}
                          onChange={handleDepartmentDraftChange('name')}
                          fullWidth
                        />
                        <TextField
                          label={t("manager.companyProfile.departments.fields.description")}
                          value={departmentDraft.description}
                          onChange={handleDepartmentDraftChange('description')}
                          fullWidth
                        />
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button size="small" onClick={handleCancelEditDepartment}>Cancel</Button>
                          <Button size="small" variant="contained" onClick={handleUpdateDepartment}>Save</Button>
                        </Stack>
                      </Stack>
                    ) : (
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: 'center' }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{dept.name}</Typography>
                          {dept.description && (
                            <Typography variant="body2" color="text.secondary">{dept.description}</Typography>
                          )}
                        </Box>
                        <Stack direction="row" spacing={1}>
                          <Button size="small" variant="outlined" onClick={() => startEditDepartment(dept)}>Edit</Button>
                          <Button size="small" color="error" onClick={() => handleDeleteDepartment(dept.id)}>Delete</Button>
                        </Stack>
                      </Stack>
                    )}
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        autoHideDuration={3000}
        message={snackbarMessage}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      />
      </ManagementFrame>
    </>
  );
}



