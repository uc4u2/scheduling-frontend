// src/pages/sections/CompanyProfile.js
import React, { useEffect, useState, useMemo, useRef } from "react";
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
  DialogActions,
  Divider,
  Tooltip,
  IconButton,
  Chip,
  Collapse,
} from "@mui/material";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { alpha } from "@mui/material/styles";
import ManagementFrame from "../../components/ui/ManagementFrame";
import api, { payrollSetupApi } from "../../utils/api";
import { useTranslation } from "react-i18next";
import { wb } from "../../utils/api"; // <-- add to verify public viewer
import UpgradeNoticeBanner from "../../components/billing/UpgradeNoticeBanner";
import TimezoneSelect from "../../components/TimezoneSelect";
import { getUserTimezone, normalizeTimezoneValue } from "../../utils/timezone";
import { PAYROLL_PROVIDER_OPTIONS } from "../../utils/locationProfile";
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
  "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT",
];
const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE",
  "NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN",
  "TX","UT","VT","VA","WA","WV","WI","WY",
];
const TAX_COUNTRIES = [
  { code: "US", labelKey: "manager.companyProfile.payments.taxCountries.us" },
  { code: "CA", labelKey: "manager.companyProfile.payments.taxCountries.ca" },
];
const COMPANY_COUNTRY_OPTIONS = [
  { code: "US", label: "United States" },
  { code: "CA", label: "Canada" },
  { code: "OTHER", label: "Other" },
];
const WORK_LOCATION_TYPE_OPTIONS = [
  { value: "main", label: "Main" },
  { value: "branch", label: "Branch" },
  { value: "remote", label: "Remote" },
  { value: "job_site", label: "Job site" },
  { value: "other", label: "Other" },
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

const normalizeDisplayCountry = (value) => {
  const code = String(value || "").trim().toUpperCase();
  if (code === "QC") return "CA";
  if (code === "US" || code === "CA" || code === "OTHER") return code;
  return code || "US";
};

const postalLooksCanadian = (value) => /^[A-Z]\d[A-Z][ -]?\d[A-Z]\d$/i.test(String(value || "").trim());
const postalLooksUS = (value) => /^\d{5}(-\d{4})?$/.test(String(value || "").trim());
const getRegionOptions = (country) => {
  const code = normalizeDisplayCountry(country);
  if (code === "US") return US_STATES;
  if (code === "CA") return CANADA_PROVINCES;
  return [];
};
const getRegionLabel = (country) => (normalizeDisplayCountry(country) === "US" ? "State" : normalizeDisplayCountry(country) === "CA" ? "Province" : "State / Province");
const getPostalLabel = (country) => (normalizeDisplayCountry(country) === "US" ? "ZIP Code" : normalizeDisplayCountry(country) === "CA" ? "Postal Code" : "Postal / ZIP");
const getPostalHelper = (country) => (normalizeDisplayCountry(country) === "US" ? "Use 12345 or 12345-6789." : normalizeDisplayCountry(country) === "CA" ? "Use A1A 1A1." : "Use the postal or ZIP format used in this country.");
const formatPostalInput = (country, raw) => {
  let value = String(raw || "").toUpperCase();
  const code = normalizeDisplayCountry(country);
  if (code === "CA") {
    return value.replace(/[^A-Z0-9]/g, "").replace(/^(.{3})(.{0,3})$/, "$1 $2").trim();
  }
  if (code === "US") {
    value = value.replace(/[^\d-]/g, "");
    if (value.length > 5 && !value.includes("-")) value = `${value.slice(0, 5)}-${value.slice(5)}`;
    return value;
  }
  return value;
};
const getAddressWarnings = ({ country, region, postalCode }) => {
  const code = normalizeDisplayCountry(country);
  const warnings = [];
  const normalizedRegion = String(region || "").trim().toUpperCase();
  const regionOptions = getRegionOptions(code);
  if (code === "US") {
    if (postalCode && postalLooksCanadian(postalCode)) warnings.push("This looks like a Canadian postal code.");
    if (normalizedRegion && !US_STATES.includes(normalizedRegion)) warnings.push("Select a valid U.S. state for a United States address.");
  } else if (code === "CA") {
    if (postalCode && postalLooksUS(postalCode)) warnings.push("This looks like a U.S. ZIP code.");
    if (normalizedRegion && !CANADA_PROVINCES.includes(normalizedRegion)) warnings.push("Select a valid Canadian province for a Canada address.");
  } else if (!regionOptions.length && normalizedRegion) {
    warnings.push("State or province can stay as free text for other countries.");
  }
  return warnings;
};
const summarizeLocationAddress = (location) =>
  [location.address_line1, location.city, location.state, location.postal_code, normalizeDisplayCountry(location.country)]
    .filter(Boolean)
    .join(", ");


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
    country_code: "US",
    slug: "", // include slug in form state
    enable_stripe_payments: false,
    allow_card_on_file: false,
    prices_include_tax: false,
    tax_country_code: "",
    tax_region_code: "",
    charge_currency_mode: "PLATFORM_FIXED",
    display_currency: "USD",
    trusted_ips: [],
    default_pay_frequency: "",
    retirement_engine_mode: "enterprise",
    payroll_pay_date_rule: "end_date",
    payroll_pay_date_offset_days: 0,
  });

  // Departments
  const [departments, setDepartments] = useState([]);
  const [newDepartment, setNewDepartment] = useState({ name: "", description: "" });
  const [editingDepartmentId, setEditingDepartmentId] = useState(null);
  const [departmentDraft, setDepartmentDraft] = useState({ name: "", description: "" });

  const [payrollSetupProfile, setPayrollSetupProfile] = useState({
    payroll_intent: "none",
    payroll_country: "US",
    average_employee_count: "",
    current_payroll_provider: "",
    expected_first_payroll_date: "",
    has_tipped_employees: false,
    has_tip_credit: false,
    has_contractors: false,
    has_overnight_shifts_override: false,
  });
  const [payrollSetupLoading, setPayrollSetupLoading] = useState(false);
  const [payrollSetupSaving, setPayrollSetupSaving] = useState(false);
  const [workLocations, setWorkLocations] = useState([]);
  const [workLocationsLoading, setWorkLocationsLoading] = useState(false);
  const [workLocationSaving, setWorkLocationSaving] = useState(false);
  const [editingWorkLocationId, setEditingWorkLocationId] = useState(null);
  const [newWorkLocation, setNewWorkLocation] = useState({
    name: "Main Work Location",
    location_type: "main",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "US",
    timezone: getUserTimezone(),
    is_default: false,
    source_type: "manual",
  });
  const [workLocationDraft, setWorkLocationDraft] = useState({
    name: "",
    location_type: "main",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "US",
    timezone: getUserTimezone(),
    is_default: false,
    source_type: "manual",
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, messageKey: "", fallback: "", severity: "info" });
  const companyCountry = normalizeDisplayCountry(form.country_code);
  const isUS = companyCountry === "US";
  const isCA = companyCountry === "CA";

  // Public viewer check
  const [viewerCheckMsg, setViewerCheckMsg] = useState("");
  const [viewerCheckSeverity, setViewerCheckSeverity] = useState("info");
  const [viewerCheckBusy, setViewerCheckBusy] = useState(false);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [contactFormId, setContactFormId] = useState(null);
  const [contactNotifyEmails, setContactNotifyEmails] = useState("");
  const [contactFormLoading, setContactFormLoading] = useState(false);
  const [contactFormSaving, setContactFormSaving] = useState(false);
  const [showAddWorkLocationForm, setShowAddWorkLocationForm] = useState(false);
  const previousDisplayCountryRef = useRef(normalizeDisplayCountry(form.country_code));
  const PAY_FREQUENCY_OPTIONS = useMemo(
    () => [
      { value: "weekly", label: "Weekly" },
      { value: "biweekly", label: "Bi-weekly" },
      { value: "semi-monthly", label: "Semi-monthly" },
      { value: "monthly", label: "Monthly" },
    ],
    []
  );

  /* ---------- config ---------- */
  const endpoint = `/admin/company-profile`;

  /* ---------- helpers ---------- */
  const showMessage = (messageKey, severity = "info", fallback = "") =>
    setSnackbar({ open: true, messageKey, fallback, severity });

  const buildSuggestedWorkLocation = (base = form) => ({
    name: "Main Work Location",
    location_type: "main",
    address_line1: base.address_street || base.address || "",
    address_line2: "",
    city: base.address_city || "",
    state: base.address_state || base.province_code || "",
    postal_code: base.address_zip || "",
    country: normalizeDisplayCountry(base.country_code) || "US",
    timezone: normalizeTimezoneValue(base.timezone || "") || getUserTimezone(base.timezone) || "UTC",
    is_default: false,
    source_type: "manual",
  });

  /* ────────────────────────────────────────────────────────────────
     Departments – load list & add new one
     ──────────────────────────────────────────────────────────────── */
  const loadDepartments = async () => {
    try {
      const { data } = await api.get(`/api/departments`, {
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
      const { data } = await api.post(
        `/api/departments`,
        { name, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showMessage("manager.companyProfile.messages.departmentCreated", "success", data.message);
      setNewDepartment({ name: "", description: "" });
      loadDepartments();
    } catch (err) {
      const payload = err?.response?.data;
      if (payload?.error === "subscription_required") {
        showMessage("", "error", payload?.message || "Upgrade required to add more locations.");
        return;
      }
      if (payload?.error === "limit_exceeded" && payload?.limit === "locations") {
        showMessage("", "error", payload?.message || "Location limit reached. Upgrade to add more locations.");
        return;
      }
      console.error("Error creating department", err);
      showMessage("manager.companyProfile.messages.departmentCreateFailed", "error");
    }
  };

  useEffect(() => {
    loadDepartments();
  }, [token]);

  const loadPayrollSetupProfile = async () => {
    try {
      setPayrollSetupLoading(true);
      const data = await payrollSetupApi.getPayrollSetupProfile({
        headers: { Authorization: `Bearer ${token}` },
      });
      const profile = data?.profile || {};
      const inferredPayrollCountry = (profile.payroll_country || normalizeDisplayCountry(form.country_code) || "US").toUpperCase();
      setPayrollSetupProfile((prev) => ({
        ...prev,
        ...profile,
        payroll_country: inferredPayrollCountry,
        average_employee_count:
          profile.average_employee_count === null || profile.average_employee_count === undefined
            ? ""
            : profile.average_employee_count,
        expected_first_payroll_date: profile.expected_first_payroll_date || "",
        has_overnight_shifts_override: Boolean(profile.has_overnight_shifts_override),
      }));
    } catch (err) {
      console.error("Failed to load payroll setup profile", err);
    } finally {
      setPayrollSetupLoading(false);
    }
  };

  const loadWorkLocations = async () => {
    try {
      setWorkLocationsLoading(true);
      const data = await payrollSetupApi.listWorkLocations({
        headers: { Authorization: `Bearer ${token}` },
      });
      setWorkLocations(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      console.error("Failed to load payroll work locations", err);
    } finally {
      setWorkLocationsLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadPayrollSetupProfile();
    loadWorkLocations();
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
      await api.put(`/api/departments/${editingDepartmentId}`, { name, description }, {
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
      await api.delete(`/api/departments/${deptId}`, {
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
        const { data } = await api.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!ignore && data && typeof data === 'object') {
          const normalizedDisplay = normalizeCurrency(data.display_currency || "");
          if (isSupportedCurrency(normalizedDisplay)) {
            setActiveCurrency(normalizedDisplay);
          }
          setForm((prev) => ({
            ...prev,
            ...data,
            country_code: data.country_code || "US",
            retirement_engine_mode: "enterprise",
          }));
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

  useEffect(() => {
    if (!profileLoaded) return;
    const previousCountry = previousDisplayCountryRef.current;
    const nextCountry = normalizeDisplayCountry(form.country_code);
    if (!nextCountry || previousCountry === nextCountry) return;
    previousDisplayCountryRef.current = nextCountry;
    setForm((prev) => {
      const next = { ...prev };
      const nextProvinceOptions = getRegionOptions(nextCountry);
      if (nextProvinceOptions.length && next.province_code && !nextProvinceOptions.includes(String(next.province_code).toUpperCase())) {
        next.province_code = "";
      }
      if (nextCountry === "US") {
        ["business_number", "payroll_program", "employer_number", "contact_person", "contact_phone", "contact_email"].forEach((key) => {
          if (next[key]) next[key] = "";
        });
      } else if (nextCountry === "CA" && next.federal_employer_id) {
        next.federal_employer_id = "";
      }
      return next;
    });
  }, [form.country_code, profileLoaded]);

  useEffect(() => {
    if (!profileLoaded) return;
    const companyCountryCode = normalizeDisplayCountry(form.country_code) || "US";
    setPayrollSetupProfile((prev) => {
      const next = { ...prev };
      if (!next.payroll_country) next.payroll_country = companyCountryCode;
      if (next.payroll_intent === "check_embedded_us") next.payroll_country = "US";
      return next;
    });
  }, [form.country_code, profileLoaded]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    (async () => {
      try {
        setContactFormLoading(true);
        const { data } = await api.get("/api/website/forms", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!active) return;
        const forms = Array.isArray(data) ? data : [];
        let contactForm = forms.find((f) => (f.key || "").toLowerCase() === "contact");
        if (!contactForm) {
          const created = await api.post(
            "/api/website/forms",
            { name: "Contact", key: "contact" },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          contactForm = created.data;
        }
        if (!active || !contactForm) return;
        setContactFormId(contactForm.id);
        setContactNotifyEmails(contactForm.notify_emails || "");
      } catch (err) {
        console.error("Failed to load website forms", err);
      } finally {
        if (active) setContactFormLoading(false);
      }
    })();
    return () => { active = false; };
  }, [token]);

  const handleSaveContactNotifyEmails = async () => {
    if (!contactFormId) return;
    try {
      setContactFormSaving(true);
      await api.put(
        `/api/website/forms/${contactFormId}`,
        { notify_emails: contactNotifyEmails },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showMessage("", "success", "Contact form recipients updated.");
    } catch (err) {
      console.error("Failed to save contact notify emails", err);
      showMessage("", "error", "Failed to update contact form recipients.");
    } finally {
      setContactFormSaving(false);
    }
  };


  /* ---------- handle slug change ---------- */
  const handleSlugChange = async (newSlug) => {
    if (!newSlug) return;
    try {
      setSaving(true);
      await api.patch(endpoint, { slug: newSlug }, {
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
	      const payload = { ...form, retirement_engine_mode: "enterprise" };
	      const payRule = String(payload.payroll_pay_date_rule || "end_date");
	      if (payRule !== "offset_days") {
	        payload.payroll_pay_date_offset_days = null;
	      } else {
	        const raw = payload.payroll_pay_date_offset_days;
	        const num = raw === "" || raw === null || raw === undefined ? null : Number(raw);
	        payload.payroll_pay_date_offset_days = Number.isFinite(num)
	          ? Math.max(0, Math.min(14, Math.trunc(num)))
	          : null;
	      }
      const { data: updated } = await api[method](endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (updated && typeof updated === "object") {
        const normalizedDisplay = normalizeCurrency(updated.display_currency || "");
        if (isSupportedCurrency(normalizedDisplay)) {
          setActiveCurrency(normalizedDisplay);
        }
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

  const handlePayrollSetupField = (field) => (event) => {
    const value = event?.target ? event.target.value : event;
    setPayrollSetupProfile((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "payroll_intent" && value === "check_embedded_us") {
        next.payroll_country = "US";
      }
      if (field === "payroll_country") {
        next.payroll_country = String(value || "").toUpperCase();
      }
      return next;
    });
  };

  const handlePayrollSetupBoolean = (field) => (_, checked) => {
    setPayrollSetupProfile((prev) => ({ ...prev, [field]: Boolean(checked) }));
  };

  const savePayrollSetupProfile = async () => {
    try {
      setPayrollSetupSaving(true);
      const payload = {
        ...payrollSetupProfile,
        average_employee_count:
          payrollSetupProfile.average_employee_count === ""
            ? null
            : Number(payrollSetupProfile.average_employee_count),
        expected_first_payroll_date: payrollSetupProfile.expected_first_payroll_date || null,
      };
      const data = await payrollSetupApi.updatePayrollSetupProfile(payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profile = data?.profile || {};
      setPayrollSetupProfile((prev) => ({
        ...prev,
        ...profile,
        average_employee_count:
          profile.average_employee_count === null || profile.average_employee_count === undefined
            ? ""
            : profile.average_employee_count,
        expected_first_payroll_date: profile.expected_first_payroll_date || "",
        has_overnight_shifts_override: Boolean(profile.has_overnight_shifts_override),
      }));
      showMessage("", "success", "Payroll setup saved.");
    } catch (err) {
      console.error("Failed to save payroll setup profile", err);
      showMessage("", "error", "Failed to save payroll setup.");
    } finally {
      setPayrollSetupSaving(false);
    }
  };

  const handleWorkLocationDraftChange = (setter, field) => (event) => {
    const value = event?.target ? event.target.value : event;
    setter((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "country") {
        next.country = normalizeDisplayCountry(value);
        const regionOptions = getRegionOptions(next.country);
        if (regionOptions.length && next.state && !regionOptions.includes(String(next.state).toUpperCase())) {
          next.state = "";
        }
      }
      if (field === "state") {
        next.state = String(value || "").toUpperCase();
      }
      if (field === "timezone") {
        next.timezone = normalizeTimezoneValue(value || "") || "UTC";
      }
      if (field === "postal_code") {
        next.postal_code = formatPostalInput(prev.country, value);
      }
      return next;
    });
  };

  const handleWorkLocationDraftBoolean = (setter, field) => (_, checked) => {
    setter((prev) => ({ ...prev, [field]: Boolean(checked) }));
  };

  const startEditWorkLocation = (location) => {
    setEditingWorkLocationId(location.id);
    setWorkLocationDraft({
      name: location.name || "",
      location_type: location.location_type || "main",
      address_line1: location.address_line1 || "",
      address_line2: location.address_line2 || "",
      city: location.city || "",
      state: location.state || "",
      postal_code: location.postal_code || "",
      country: location.country || "",
      timezone: location.timezone || "UTC",
      is_default: Boolean(location.is_default),
      source_type: location.source_type || "manual",
    });
  };

  const cancelEditWorkLocation = () => {
    setEditingWorkLocationId(null);
    setWorkLocationDraft(buildSuggestedWorkLocation());
  };

  const saveNewWorkLocation = async () => {
    try {
      setWorkLocationSaving(true);
      await payrollSetupApi.createWorkLocation(newWorkLocation, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNewWorkLocation(buildSuggestedWorkLocation());
      setShowAddWorkLocationForm(false);
      await loadWorkLocations();
      showMessage("", "success", "Payroll location added.");
    } catch (err) {
      console.error("Failed to create payroll work location", err);
      showMessage("", "error", err?.response?.data?.error || "Failed to add payroll location.");
    } finally {
      setWorkLocationSaving(false);
    }
  };

  const saveEditedWorkLocation = async () => {
    if (!editingWorkLocationId) return;
    try {
      setWorkLocationSaving(true);
      await payrollSetupApi.updateWorkLocation(editingWorkLocationId, workLocationDraft, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadWorkLocations();
      cancelEditWorkLocation();
      showMessage("", "success", "Payroll location updated.");
    } catch (err) {
      console.error("Failed to update payroll work location", err);
      showMessage("", "error", err?.response?.data?.error || "Failed to update payroll location.");
    } finally {
      setWorkLocationSaving(false);
    }
  };

  const setDefaultWorkLocation = async (locationId) => {
    try {
      setWorkLocationSaving(true);
      await payrollSetupApi.updateWorkLocation(
        locationId,
        { is_default: true, is_active: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await loadWorkLocations();
      showMessage("", "success", "Default payroll location updated.");
    } catch (err) {
      console.error("Failed to set default payroll work location", err);
      showMessage("", "error", "Failed to update default payroll location.");
    } finally {
      setWorkLocationSaving(false);
    }
  };

  const deactivateWorkLocation = async (locationId) => {
    try {
      setWorkLocationSaving(true);
      await payrollSetupApi.deactivateWorkLocation(locationId, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadWorkLocations();
      showMessage("", "success", "Payroll location deactivated.");
    } catch (err) {
      console.error("Failed to deactivate payroll work location", err);
      const serverCode = err?.response?.data?.error;
      showMessage("", "error", serverCode === "cannot_deactivate_only_active_work_location" ? "CANNOT_DEACTIVATE_ONLY_ACTIVE_WORK_LOCATION" : serverCode || "Failed to deactivate payroll location.");
    } finally {
      setWorkLocationSaving(false);
    }
  };

  const backfillDefaultWorkLocation = async () => {
    try {
      setWorkLocationSaving(true);
      await payrollSetupApi.backfillDefaultWorkLocation({
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadWorkLocations();
      showMessage("", "success", "Main payroll location ensured.");
    } catch (err) {
      console.error("Failed to backfill default payroll work location", err);
      showMessage("", "error", "Failed to ensure a default payroll location.");
    } finally {
      setWorkLocationSaving(false);
    }
  };

  const handleTrustedIpsChange = (event) => {
    const raw = event.target.value || "";
    const parsed = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setForm((prev) => ({ ...prev, trusted_ips: parsed }));
  };

  const provinceList = useMemo(() => {
    return getRegionOptions(form.country_code);
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
  const activeWorkLocations = useMemo(
    () => workLocations.filter((row) => row.is_active !== false),
    [workLocations]
  );
  const defaultWorkLocation = useMemo(
    () => activeWorkLocations.find((row) => row.is_default) || activeWorkLocations[0] || null,
    [activeWorkLocations]
  );
  const showPayrollAdvanced = payrollSetupProfile.payroll_intent !== "none";

  useEffect(() => {
    if (!profileLoaded) return;
    if (activeWorkLocations.length === 0) {
      setNewWorkLocation(buildSuggestedWorkLocation(form));
      setWorkLocationDraft(buildSuggestedWorkLocation(form));
    } else if (activeWorkLocations.some((row) => row.name === "Main Work Location")) {
      setNewWorkLocation((prev) => ({
        ...prev,
        name: prev.name === "Main Work Location" ? "" : prev.name,
        country: prev.country || normalizeDisplayCountry(form.country_code) || "US",
        timezone: normalizeTimezoneValue(prev.timezone || "") || getUserTimezone(form.timezone),
      }));
    }
  }, [activeWorkLocations, form, profileLoaded]);

  useEffect(() => {
    if (!profileLoaded) return;
    if (!newWorkLocation.country) {
      setNewWorkLocation((prev) => ({ ...prev, country: normalizeDisplayCountry(form.country_code) || "US" }));
    }
  }, [form.country_code, newWorkLocation.country, profileLoaded]);
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
            <UpgradeNoticeBanner
              requiredPlan="business"
              message="Multi-location (branches) requires the Business plan. Upgrade to add and manage additional locations."
            />
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
                    value={companyCountry}
                    label={t("manager.companyProfile.location.country.label")}
                    onChange={handleChange("country_code")}
                  >
                    {COMPANY_COUNTRY_OPTIONS.map((option) => (
                      <MenuItem key={option.code} value={option.code}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                {provinceList.length ? (
                  <FormControl fullWidth>
                    <InputLabel id="province-label">{getRegionLabel(form.country_code)}</InputLabel>
                    <Select
                      labelId="province-label"
                      value={form.province_code}
                      label={getRegionLabel(form.country_code)}
                      onChange={handleChange("province_code")}
                    >
                      <ListSubheader disableSticky>
                        {companyCountry === "US"
                          ? t("manager.companyProfile.location.provinceGroup.us")
                          : companyCountry === "CA"
                          ? t("manager.companyProfile.location.provinceGroup.ca")
                          : t("manager.companyProfile.location.provinceGroup.other")}
                      </ListSubheader>
                      {provinceList.map((code) => (
                        <MenuItem key={code} value={code}>
                          {code}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <TextField
                    fullWidth
                    label={getRegionLabel(form.country_code)}
                    value={form.province_code || ""}
                    onChange={handleChange("province_code")}
                  />
                )}
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
                  label={t("manager.companyProfile.form.fields.naicsCode")}
                  value={form.naics_code || ""}
                  onChange={handleChange("naics_code")}
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
                  label={getPostalLabel(form.country_code)}
                  value={form.address_zip || ""}
                  onChange={(e) => {
                    setForm({ ...form, address_zip: formatPostalInput(form.country_code, e.target.value) });
                  }}
                  inputProps={{
                    maxLength: companyCountry === "CA" ? 7 : companyCountry === "US" ? 10 : 16,
                    pattern: companyCountry === "CA" ? "[A-Z][0-9][A-Z] [0-9][A-Z][0-9]" : companyCountry === "US" ? "\\d{5}(-\\d{4})?" : undefined,
                    title: companyCountry === "CA" ? t("manager.companyProfile.form.hints.postalTitleCa") : companyCountry === "US" ? t("manager.companyProfile.form.hints.postalTitleUs") : "Use the postal or ZIP format used in this country."
                  }}
                  helperText={getPostalHelper(form.country_code)}
                />
              </Grid>
              {getAddressWarnings({ country: form.country_code, region: form.province_code, postalCode: form.address_zip }).length > 0 && (
                <Grid item xs={12}>
                  <Alert severity="warning" variant="outlined">
                    {getAddressWarnings({ country: form.country_code, region: form.province_code, postalCode: form.address_zip }).join(" ")}
                  </Alert>
                </Grid>
              )}

              {/* Payroll Settings accordion */}
              <Grid item xs={12}>
                <Accordion defaultExpanded={false}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        Payroll Settings (optional)
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Only needed if you run payroll. These fields seed payroll preview, exports, and year-end forms.
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Fields shown here depend on your company country.
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {/* US payroll */}
                      {isUS && (
                        <>
                          <Grid item xs={12}>
                            <Divider textAlign="left">United States payroll identifiers</Divider>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label={t("manager.companyProfile.form.fields.federalEmployerId")}
                              value={form.federal_employer_id || ""}
                              onChange={handleChange("federal_employer_id")}
                              helperText="Used for W-2 and payroll exports."
                            />
                          </Grid>
                        </>
                      )}
	                      <Grid item xs={12} md={6}>
	                        <FormControl fullWidth>
	                          <InputLabel>Default Pay Frequency</InputLabel>
	                          <Select
	                            label="Default Pay Frequency"
	                            value={form.default_pay_frequency || ""}
	                            onChange={handleChange("default_pay_frequency")}
	                          >
	                      <MenuItem value="">Bi-weekly (default)</MenuItem>
	                      {PAY_FREQUENCY_OPTIONS.map((opt) => (
	                        <MenuItem key={opt.value} value={opt.value}>
	                          {opt.label}
	                        </MenuItem>
	                      ))}
	                    </Select>
	                    <Typography variant="caption" color="text.secondary">
	                      Seeds Payroll Preview. Managers can override per run.
	                    </Typography>
	                  </FormControl>
	                </Grid>
	                      <Grid item xs={12} md={6}>
	                        <FormControl fullWidth>
	                          <InputLabel>Default Pay Date</InputLabel>
	                          <Select
	                            label="Default Pay Date"
	                            value={form.payroll_pay_date_rule || "end_date"}
	                            onChange={handleChange("payroll_pay_date_rule")}
	                          >
	                            <MenuItem value="end_date">Same as period end</MenuItem>
	                            <MenuItem value="offset_days">Days after period end</MenuItem>
	                          </Select>
	                          <Typography variant="caption" color="text.secondary">
	                            Used for exports and workflow events. Finalized runs store the pay date for audit.
	                          </Typography>
	                        </FormControl>
	                      </Grid>
	                      {String(form.payroll_pay_date_rule || "end_date") === "offset_days" && (
	                        <Grid item xs={12} md={6}>
	                          <TextField
	                            fullWidth
	                            type="number"
	                            label="Pay date offset (days)"
	                            value={
	                              form.payroll_pay_date_offset_days === null ||
	                              form.payroll_pay_date_offset_days === undefined
	                                ? ""
	                                : form.payroll_pay_date_offset_days
	                            }
	                            onChange={(e) => {
	                              const raw = e.target.value;
	                              const num = raw === "" ? "" : Number(raw);
	                              setForm((prev) => ({
	                                ...prev,
	                                payroll_pay_date_offset_days: num,
	                              }));
	                            }}
	                            inputProps={{ min: 0, max: 14, step: 1 }}
	                            helperText="0–14 days after period end (example: 3)."
	                          />
	                        </Grid>
	                      )}
	                <Grid item xs={12} md={6}>
	                  <Paper variant="outlined" sx={{ p: 2 }}>
	                    <Typography variant="subtitle2" fontWeight={700}>
	                      Retirement calculation
                    </Typography>
                    <Typography variant="body2">
                      United States: Enterprise 401(k) is applied automatically (plan defaults + elections, caps, correct wage bases/W-2 Box 12D).<br />
                      Canada: Standard RRSP is used (enterprise 401(k) does not apply).
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Schedulaa picks the right engine by country; no toggle needed. Configure U.S. plans at{" "}
                      <Link component="button" variant="caption" onClick={() => navigate("/manager/payroll/retirement")}>
                        Payroll → Retirement Plans
                      </Link>. Learn more:{" "}
                      <Link href="/help/enterprise-retirement" target="_blank" rel="noopener">
                        Enterprise Retirement help
                      </Link>.
                    </Typography>
                          </Paper>
                        </Grid>

                      {/* Canada payroll */}
                      {isCA && (
                        <>
                          <Grid item xs={12}>
                            <Divider textAlign="left">Canada payroll identifiers</Divider>
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
                              helperText="Used for T4/ROE exports and CRA payroll setup."
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label={t("manager.companyProfile.form.fields.payrollProgram")}
                              value={form.payroll_program || ""}
                              onChange={handleChange("payroll_program")}
                              helperText="CRA payroll program/account (e.g., RP0001)."
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
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label={t("manager.companyProfile.form.fields.craContactPerson")}
                              value={form.contact_person || ""}
                              onChange={handleChange("contact_person")}
                              helperText="CRA payroll contact."
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
                              label={t("manager.companyProfile.form.fields.craContactEmail")}
                              value={form.contact_email || ""}
                              onChange={handleChange("contact_email")}
                            />
                          </Grid>
                        </>
                      )}

                      <Grid item xs={12}>
                        <Divider textAlign="left">Payroll Setup</Divider>
                      </Grid>
                      <Grid item xs={12}>
                        <Alert severity="info" sx={{ mb: 1 }}>
                          Schedulaa stores only local payroll setup preferences and payroll location structure here. Sensitive payroll onboarding, such as SSN, bank details, and tax forms, will be handled through the payroll provider flow later.
                        </Alert>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Payroll intent</InputLabel>
                          <Select
                            label="Payroll intent"
                            value={payrollSetupProfile.payroll_intent || "none"}
                            onChange={handlePayrollSetupField("payroll_intent")}
                          >
                            <MenuItem value="none">No</MenuItem>
                            <MenuItem value="csv_handoff">Payroll-ready exports only</MenuItem>
                            <MenuItem value="check_embedded_us">Embedded U.S. payroll with Check</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Payroll country</InputLabel>
                          <Select
                            label="Payroll country"
                            value={payrollSetupProfile.payroll_country || ""}
                            onChange={handlePayrollSetupField("payroll_country")}
                            disabled={payrollSetupProfile.payroll_intent === "check_embedded_us"}
                          >
                            {COMPANY_COUNTRY_OPTIONS.map((option) => (
                              <MenuItem key={option.code} value={option.code}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      {!showPayrollAdvanced && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            Leave payroll intent as <strong>No</strong> if you only want to keep Company Profile simple for now. You can come back later to enable exports or prepare for embedded U.S. payroll.
                          </Typography>
                        </Grid>
                      )}
                      {showPayrollAdvanced && (
                        <>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              type="number"
                              label="Average employee count"
                              value={payrollSetupProfile.average_employee_count}
                              onChange={handlePayrollSetupField("average_employee_count")}
                              inputProps={{ min: 0 }}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                              <InputLabel>Current payroll provider</InputLabel>
                              <Select
                                label="Current payroll provider"
                                value={PAYROLL_PROVIDER_OPTIONS.some((option) => option.value === (payrollSetupProfile.current_payroll_provider || "")) ? (payrollSetupProfile.current_payroll_provider || "") : (payrollSetupProfile.current_payroll_provider ? "Other" : "")}
                                onChange={(event) => {
                                  const nextValue = event.target.value;
                                  if (nextValue === 'Other') {
                                    setPayrollSetupProfile((prev) => ({ ...prev, current_payroll_provider: 'Other' }));
                                    return;
                                  }
                                  handlePayrollSetupField("current_payroll_provider")(event);
                                }}
                              >
                                {PAYROLL_PROVIDER_OPTIONS.map((option) => (
                                  <MenuItem key={option.value || 'none'} value={option.value}>
                                    {option.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          {payrollSetupProfile.current_payroll_provider === "Other" && (
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                label="Other payroll provider"
                                value={payrollSetupProfile.current_payroll_provider === 'Other' ? '' : payrollSetupProfile.current_payroll_provider || ''}
                                onChange={(event) => setPayrollSetupProfile((prev) => ({ ...prev, current_payroll_provider: event.target.value || 'Other' }))}
                                helperText="Enter the provider name if it is not listed above."
                              />
                            </Grid>
                          )}
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              type="date"
                              label="Expected first payroll date"
                              value={payrollSetupProfile.expected_first_payroll_date || ""}
                              onChange={handlePayrollSetupField("expected_first_payroll_date")}
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                          {payrollSetupProfile.payroll_intent === "check_embedded_us" && (
                            <Grid item xs={12}>
                              <Alert severity="info" variant="outlined">
                                Check-powered payroll is planned for U.S. payroll only. This readiness setup does not connect to Check yet.
                              </Alert>
                            </Grid>
                          )}
                          <Grid item xs={12} md={6}>
                            <Stack spacing={0.5}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={Boolean(payrollSetupProfile.has_tipped_employees)}
                                    onChange={handlePayrollSetupBoolean("has_tipped_employees")}
                                  />
                                }
                                label="Tipped employees"
                              />
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={Boolean(payrollSetupProfile.has_tip_credit)}
                                    onChange={handlePayrollSetupBoolean("has_tip_credit")}
                                  />
                                }
                                label="Tip credit"
                              />
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={Boolean(payrollSetupProfile.has_contractors)}
                                    onChange={handlePayrollSetupBoolean("has_contractors")}
                                  />
                                }
                                label="Contractors"
                              />
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={Boolean(payrollSetupProfile.has_overnight_shifts_override)}
                                    onChange={handlePayrollSetupBoolean("has_overnight_shifts_override")}
                                  />
                                }
                                label="Overnight shifts"
                              />
                            </Stack>
                          </Grid>
                        </>
                      )}
                      {payrollSetupProfile.payroll_intent === "csv_handoff" && (
                        <Grid item xs={12}>
                          <Alert severity="warning" variant="outlined">
                            Overnight shifts can still be handled through payroll-ready exports, but Schedulaa Payroll v1 will block them for future Check-powered payroll.
                          </Alert>
                        </Grid>
                      )}
                      <Grid item xs={12}>
                        <Button
                          variant="outlined"
                          onClick={savePayrollSetupProfile}
                          disabled={payrollSetupLoading || payrollSetupSaving}
                        >
                          {payrollSetupSaving ? <CircularProgress size={18} /> : "Save payroll setup"}
                        </Button>
                      </Grid>

                      <Grid item xs={12}>
                        <Divider textAlign="left">Payroll Locations</Divider>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Payroll Locations are physical work locations used for payroll setup. Departments remain for teams, services, or internal reporting.
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                          {!defaultWorkLocation ? (
                            <Button
                              variant="outlined"
                              onClick={backfillDefaultWorkLocation}
                              disabled={workLocationsLoading || workLocationSaving}
                            >
                              Ensure main payroll location
                            </Button>
                          ) : (
                            <Button
                              variant="outlined"
                              onClick={backfillDefaultWorkLocation}
                              disabled={workLocationsLoading || workLocationSaving}
                            >
                              Refresh from company address
                            </Button>
                          )}
                          <Button
                            variant="contained"
                            onClick={() => setShowAddWorkLocationForm((prev) => !prev)}
                            disabled={workLocationsLoading || workLocationSaving}
                          >
                            {showAddWorkLocationForm ? "Hide add location form" : "Add another payroll location"}
                          </Button>
                        </Stack>
                      </Grid>
                      <Grid item xs={12}>
                        {workLocationsLoading ? (
                          <CircularProgress size={20} />
                        ) : (
                          <Stack spacing={2}>
                            {activeWorkLocations.map((location) => (
                              <Paper key={location.id} variant="outlined" sx={{ p: 2 }}>
                                {editingWorkLocationId === location.id ? (
                                  <Grid container spacing={2}>
                                    <Grid item xs={12} md={4}>
                                      <TextField fullWidth label="Name" value={workLocationDraft.name} onChange={handleWorkLocationDraftChange(setWorkLocationDraft, "name")} />
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                      <FormControl fullWidth>
                                        <InputLabel>Type</InputLabel>
                                        <Select label="Type" value={workLocationDraft.location_type} onChange={handleWorkLocationDraftChange(setWorkLocationDraft, "location_type")}>
                                          {WORK_LOCATION_TYPE_OPTIONS.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                                          ))}
                                        </Select>
                                      </FormControl>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                      <TimezoneSelect value={workLocationDraft.timezone} onChange={handleWorkLocationDraftChange(setWorkLocationDraft, "timezone")} />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                      <TextField fullWidth label="Address line 1" value={workLocationDraft.address_line1} onChange={handleWorkLocationDraftChange(setWorkLocationDraft, "address_line1")} />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                      <TextField fullWidth label="Address line 2" value={workLocationDraft.address_line2} onChange={handleWorkLocationDraftChange(setWorkLocationDraft, "address_line2")} />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                      <TextField fullWidth label="City" value={workLocationDraft.city} onChange={handleWorkLocationDraftChange(setWorkLocationDraft, "city")} />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                      {getRegionOptions(workLocationDraft.country).length ? (
                                        <FormControl fullWidth>
                                          <InputLabel>{getRegionLabel(workLocationDraft.country)}</InputLabel>
                                          <Select label={getRegionLabel(workLocationDraft.country)} value={workLocationDraft.state || ""} onChange={handleWorkLocationDraftChange(setWorkLocationDraft, "state")}>
                                            {getRegionOptions(workLocationDraft.country).map((option) => (
                                              <MenuItem key={option} value={option}>{option}</MenuItem>
                                            ))}
                                          </Select>
                                        </FormControl>
                                      ) : (
                                        <TextField fullWidth label={getRegionLabel(workLocationDraft.country)} value={workLocationDraft.state} onChange={handleWorkLocationDraftChange(setWorkLocationDraft, "state")} />
                                      )}
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                      <TextField fullWidth label={getPostalLabel(workLocationDraft.country)} value={workLocationDraft.postal_code} onChange={handleWorkLocationDraftChange(setWorkLocationDraft, "postal_code")} helperText={getPostalHelper(workLocationDraft.country)} />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                      <FormControl fullWidth>
                                        <InputLabel>Country</InputLabel>
                                        <Select label="Country" value={normalizeDisplayCountry(workLocationDraft.country)} onChange={handleWorkLocationDraftChange(setWorkLocationDraft, "country")}>
                                          {COMPANY_COUNTRY_OPTIONS.map((option) => (
                                            <MenuItem key={option.code} value={option.code}>{option.label}</MenuItem>
                                          ))}
                                        </Select>
                                      </FormControl>
                                    </Grid>
                                    {getAddressWarnings({ country: workLocationDraft.country, region: workLocationDraft.state, postalCode: workLocationDraft.postal_code }).length > 0 && (
                                      <Grid item xs={12}>
                                        <Alert severity="warning" variant="outlined">
                                          {getAddressWarnings({ country: workLocationDraft.country, region: workLocationDraft.state, postalCode: workLocationDraft.postal_code }).join(" ")}
                                        </Alert>
                                      </Grid>
                                    )}
                                    <Grid item xs={12}>
                                      <FormControlLabel
                                        control={<Switch checked={Boolean(workLocationDraft.is_default)} onChange={handleWorkLocationDraftBoolean(setWorkLocationDraft, "is_default")} />}
                                        label="Default payroll location"
                                      />
                                    </Grid>
                                    <Grid item xs={12}>
                                      <Stack direction="row" spacing={1}>
                                        <Button variant="contained" onClick={saveEditedWorkLocation} disabled={workLocationSaving}>
                                          {workLocationSaving ? <CircularProgress size={18} /> : "Save location"}
                                        </Button>
                                        <Button variant="text" onClick={cancelEditWorkLocation} disabled={workLocationSaving}>
                                          Cancel
                                        </Button>
                                      </Stack>
                                    </Grid>
                                  </Grid>
                                ) : (
                                  <Stack spacing={1}>
                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between">
                                      <Box>
                                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 0.5 }}>
                                          <Typography variant="subtitle2" fontWeight={700}>
                                            {location.name}
                                          </Typography>
                                          {location.is_default ? <Chip size="small" label="Default" color="primary" variant="outlined" /> : null}
                                          {location.is_active ? <Chip size="small" label="Active" variant="outlined" /> : null}
                                          {Array.isArray(location.address_missing_fields) && location.address_missing_fields.length ? (
                                            <Chip size="small" label="Address incomplete" color="warning" variant="outlined" />
                                          ) : null}
                                        </Stack>
                                        <Typography variant="body2" color="text.secondary">
                                          {summarizeLocationAddress(location) || "Address still needs to be completed."}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          Timezone: {location.timezone || "UTC"}
                                        </Typography>
                                      </Box>
                                      <Stack direction="row" spacing={1}>
                                        {!location.is_default && (
                                          <Button variant="text" onClick={() => setDefaultWorkLocation(location.id)} disabled={workLocationSaving}>
                                            Set default
                                          </Button>
                                        )}
                                        <Button variant="text" onClick={() => startEditWorkLocation(location)} disabled={workLocationSaving}>
                                          Edit
                                        </Button>
                                        <Button variant="text" color="error" onClick={() => deactivateWorkLocation(location.id)} disabled={workLocationSaving}>
                                          Deactivate
                                        </Button>
                                      </Stack>
                                    </Stack>
                                  </Stack>
                                )}
                              </Paper>
                            ))}

                            <Collapse in={showAddWorkLocationForm}>
                              <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
                                  Add payroll location
                                </Typography>
                                <Grid container spacing={2}>
                                  <Grid item xs={12} md={4}>
                                    <TextField fullWidth label="Name" placeholder="e.g., Dallas Office, Austin Branch, Main Studio" value={newWorkLocation.name} onChange={handleWorkLocationDraftChange(setNewWorkLocation, "name")} />
                                  </Grid>
                                  <Grid item xs={12} md={4}>
                                    <FormControl fullWidth>
                                      <InputLabel>Type</InputLabel>
                                      <Select label="Type" value={newWorkLocation.location_type} onChange={handleWorkLocationDraftChange(setNewWorkLocation, "location_type")}>
                                        {WORK_LOCATION_TYPE_OPTIONS.map((option) => (
                                          <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                  </Grid>
                                  <Grid item xs={12} md={4}>
                                    <TimezoneSelect value={newWorkLocation.timezone} onChange={handleWorkLocationDraftChange(setNewWorkLocation, "timezone")} />
                                  </Grid>
                                  <Grid item xs={12} md={6}>
                                    <TextField fullWidth label="Address line 1" value={newWorkLocation.address_line1} onChange={handleWorkLocationDraftChange(setNewWorkLocation, "address_line1")} />
                                  </Grid>
                                  <Grid item xs={12} md={6}>
                                    <TextField fullWidth label="Address line 2" value={newWorkLocation.address_line2} onChange={handleWorkLocationDraftChange(setNewWorkLocation, "address_line2")} />
                                  </Grid>
                                  <Grid item xs={12} md={3}>
                                    <TextField fullWidth label="City" value={newWorkLocation.city} onChange={handleWorkLocationDraftChange(setNewWorkLocation, "city")} />
                                  </Grid>
                                  <Grid item xs={12} md={3}>
                                    {getRegionOptions(newWorkLocation.country).length ? (
                                      <FormControl fullWidth>
                                        <InputLabel>{getRegionLabel(newWorkLocation.country)}</InputLabel>
                                        <Select label={getRegionLabel(newWorkLocation.country)} value={newWorkLocation.state || ""} onChange={handleWorkLocationDraftChange(setNewWorkLocation, "state")}>
                                          {getRegionOptions(newWorkLocation.country).map((option) => (
                                            <MenuItem key={option} value={option}>{option}</MenuItem>
                                          ))}
                                        </Select>
                                      </FormControl>
                                    ) : (
                                      <TextField fullWidth label={getRegionLabel(newWorkLocation.country)} value={newWorkLocation.state} onChange={handleWorkLocationDraftChange(setNewWorkLocation, "state")} />
                                    )}
                                  </Grid>
                                  <Grid item xs={12} md={3}>
                                    <TextField fullWidth label={getPostalLabel(newWorkLocation.country)} value={newWorkLocation.postal_code} onChange={handleWorkLocationDraftChange(setNewWorkLocation, "postal_code")} helperText={getPostalHelper(newWorkLocation.country)} />
                                  </Grid>
                                  <Grid item xs={12} md={3}>
                                    <FormControl fullWidth>
                                      <InputLabel>Country</InputLabel>
                                      <Select label="Country" value={normalizeDisplayCountry(newWorkLocation.country)} onChange={handleWorkLocationDraftChange(setNewWorkLocation, "country")}>
                                        {COMPANY_COUNTRY_OPTIONS.map((option) => (
                                          <MenuItem key={option.code} value={option.code}>{option.label}</MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                  </Grid>
                                  {getAddressWarnings({ country: newWorkLocation.country, region: newWorkLocation.state, postalCode: newWorkLocation.postal_code }).length > 0 && (
                                    <Grid item xs={12}>
                                      <Alert severity="warning" variant="outlined">
                                        {getAddressWarnings({ country: newWorkLocation.country, region: newWorkLocation.state, postalCode: newWorkLocation.postal_code }).join(" ")}
                                      </Alert>
                                    </Grid>
                                  )}
                                  <Grid item xs={12}>
                                    <FormControlLabel
                                      control={<Switch checked={Boolean(newWorkLocation.is_default)} onChange={handleWorkLocationDraftBoolean(setNewWorkLocation, "is_default")} />}
                                      label="Default payroll location"
                                    />
                                  </Grid>
                                  <Grid item xs={12}>
                                    <Button variant="contained" onClick={saveNewWorkLocation} disabled={workLocationSaving}>
                                      {workLocationSaving ? <CircularProgress size={18} /> : "Add payroll location"}
                                    </Button>
                                  </Grid>
                                </Grid>
                              </Paper>
                            </Collapse>
                          </Stack>
                        )}
                      </Grid>

                      {/* Timeclock audit */}
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Trusted IPs (comma-separated)"
                          value={
                            Array.isArray(form.trusted_ips)
                              ? form.trusted_ips.join(", ")
                              : form.trusted_ips || ""
                          }
                          onChange={handleTrustedIpsChange}
                          helperText="Used for timeclock anomaly checks and audit logs."
                        />
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {/* Payments & Tax (accordion) */}
              <Grid item xs={12}>
                <Accordion defaultExpanded={false}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        Payments & Tax
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Manage Stripe payments, tax settings, display currency, and brand logo from the Checkout Pro & Payments settings tab.
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={2}>
                      <Alert
                        severity={stripePaymentsEnabled ? "info" : "warning"}
                        sx={{ mt: 1 }}
                      >
                        {stripePaymentsEnabled ? (
                          <>
                            {t("manager.companyProfile.payments.stripeTax.enabledIntro")}{" "}
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

                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        alignItems={{ xs: "flex-start", sm: "center" }}
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
                          onClick={() => navigate("/settings?tab=checkout")}
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
                              border: "1px solid #ccc",
                              textAlign: "center",
                              height: 80,
                              width: { xs: "100%", sm: 240 },
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: 1,
                              backgroundColor: "background.paper",
                            }}
                          >
                            <img
                              src={form.logo_url}
                              alt="Logo preview"
                              style={{ maxHeight: "60px", maxWidth: "100%" }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://via.placeholder.com/150x50?text=Logo";
                              }}
                            />
                          </Box>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {t("manager.companyProfile.branding.noLogo")}
                        </Typography>
                      )}

                      <Typography variant="caption" color="text.secondary">
                        {t("manager.companyProfile.payments.manageHint")}
                      </Typography>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
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
      <Paper
        sx={(theme) => ({
          p: 2,
          mb: 3,
          borderColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.18 : 0.12),
          backgroundColor: theme.palette.background.paper,
          backgroundImage:
            theme.palette.mode === "dark"
              ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)}, ${alpha(theme.palette.background.paper, 0.9)} 72%)`
              : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.065)}, ${alpha(theme.palette.background.paper, 0.96)} 72%)`,
        })}
      >
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
                  href={`/${form.slug}?page=services-classic`}
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

      {/* Website contact form recipients */}
      <Paper
        sx={(theme) => ({
          p: 2,
          mb: 3,
          borderColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.18 : 0.12),
          backgroundColor: theme.palette.background.paper,
          backgroundImage:
            theme.palette.mode === "dark"
              ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)}, ${alpha(theme.palette.background.paper, 0.9)} 72%)`
              : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.065)}, ${alpha(theme.palette.background.paper, 0.96)} 72%)`,
        })}
      >
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle1" fontWeight={600}>
              Website Contact Form Recipients
            </Typography>
            <Tooltip title="If empty, submissions go to Company Profile Email, then all managers.">
              <IconButton size="small">
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Set the email addresses that should receive contact form submissions.
          </Typography>
          <TextField
            fullWidth
            label="Notify emails (comma-separated)"
            value={contactNotifyEmails}
            onChange={(e) => setContactNotifyEmails(e.target.value)}
            helperText="Leave blank to use Company Profile Email, then manager emails."
            disabled={contactFormLoading}
          />
          <Box>
            <Button
              variant="contained"
              onClick={handleSaveContactNotifyEmails}
              disabled={contactFormLoading || contactFormSaving || !contactFormId}
            >
              {contactFormSaving ? <CircularProgress size={20} /> : "Save contact recipients"}
            </Button>
          </Box>
        </Stack>
      </Paper>

      {/* Departments */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Typography variant="h6">
            {t("manager.companyProfile.departments.title")}
          </Typography>
          <Tooltip title={t("manager.companyProfile.departments.locationHint")}>
            <IconButton size="small" aria-label="Departments as locations info">
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

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
