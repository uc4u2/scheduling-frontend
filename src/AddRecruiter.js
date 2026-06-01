import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import Snackbar from "@mui/material/Snackbar";
import api, { payrollSetupApi } from "./utils/api";
import { COMPANY_COUNTRY_OPTIONS, formatPostalInput, getAddressWarnings, getPostalHelper, getPostalLabel, getRegionLabel, getRegionOptions, normalizeDisplayCountry, suggestTimezoneForRegion } from "./utils/locationProfile";
import { getUserTimezone, normalizeTimezoneValue } from "./utils/timezone";
import { useNavigate } from "react-router-dom";
import { useDepartments } from "./pages/sections/hooks/useRecruiterDepartments";
import TimezoneSelect from "./components/TimezoneSelect";
import useBillingStatus from "./components/billing/useBillingStatus";
import { formatBillingNextDateLabel } from "./components/billing/billingLabels";
import AddMemberHelpDrawer from "./pages/sections/management/components/AddMemberHelpDrawer";
import TeamMemberImportDialog from "./pages/sections/management/components/TeamMemberImportDialog";
import {
  commitTeamMemberImport,
  downloadTeamMemberImportTemplate,
  listTeamMemberImportHistory,
  previewTeamMemberImport,
} from "./api/teamMembers";
import { isMobileComplianceMode, MOBILE_PAYMENTS_MESSAGE } from "./utils/mobileCompliance";

const ROLE_OPTIONS = [
  { value: "recruiter", label: "Employee" },
  { value: "manager", label: "Manager" },
];

const AddRecruiter = () => {
  const mobileComplianceMode = isMobileComplianceMode();
  const navigate = useNavigate();
  const employeeManagementUrl = "/manager/employee-management?focus=employees";
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "recruiter",
    departmentId: "",
    timezone: getUserTimezone(),
    city: "",
    street: "",
    state: "",
    country: "",
    postalCode: "",
    primaryWorkLocationId: "",
    confirmAuthority: false,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitState, setSubmitState] = useState({ status: "idle", message: "" });
  const [seatDialogOpen, setSeatDialogOpen] = useState(false);
  const [seatInput, setSeatInput] = useState("");
  const [seatNeeded, setSeatNeeded] = useState(0);
  const [seatsAllowed, setSeatsAllowed] = useState(0);
  const [seatAttemptTotal, setSeatAttemptTotal] = useState(0);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [seatPreview, setSeatPreview] = useState(null);
  const [seatPreviewLoading, setSeatPreviewLoading] = useState(false);
  const [seatDialogError, setSeatDialogError] = useState("");
  const [seatNotice, setSeatNotice] = useState("");
  const [seatInvoiceUrl, setSeatInvoiceUrl] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [payrollLocations, setPayrollLocations] = useState([]);
  const [payrollSetupProfile, setPayrollSetupProfile] = useState({ payroll_intent: "none" });
  const departments = useDepartments();
  const { status: billingStatus } = useBillingStatus();
  const seatNextBillingLabel = formatBillingNextDateLabel({
    nextBillingDate: seatPreview?.next_billing_date,
    trialEnd: billingStatus?.trial_end,
  });

  const [companyProfile, setCompanyProfile] = useState(null);

  const regionOptions = useMemo(() => getRegionOptions(form.country), [form.country]);
  const activePayrollLocations = useMemo(
    () => payrollLocations.filter((row) => row.is_active !== false),
    [payrollLocations]
  );
  const selectedPayrollLocation = useMemo(
    () =>
      activePayrollLocations.find((row) => String(row.id) === String(form.primaryWorkLocationId || "")) || null,
    [activePayrollLocations, form.primaryWorkLocationId]
  );
  const addressWarnings = useMemo(() => getAddressWarnings({
    country: form.country,
    region: form.state,
    postalCode: form.postalCode,
    city: form.city,
    timezone: form.timezone,
  }), [form.city, form.country, form.postalCode, form.state, form.timezone]);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get("/admin/company-profile"),
      payrollSetupApi.listWorkLocations().catch(() => ({ items: [] })),
      payrollSetupApi.getPayrollSetupProfile().catch(() => ({ profile: { payroll_intent: "none" } })),
    ])
      .then(([companyRes, workLocationRes, setupProfileRes]) => {
        if (!active) return;
        const profile = companyRes?.data || {};
        const items = Array.isArray(workLocationRes?.items) ? workLocationRes.items : [];
        const activeItems = items.filter((row) => row.is_active !== false);
        setCompanyProfile(profile);
        setPayrollLocations(items);
        setPayrollSetupProfile(setupProfileRes?.profile || { payroll_intent: "none" });
        const nextCountry = normalizeDisplayCountry(profile.country_code) || 'US';
        const nextRegion = String(profile.province_code || profile.address_state || '').trim().toUpperCase();
        const suggestedTimezone =
          normalizeTimezoneValue(activeItems[0]?.timezone || "") ||
          normalizeTimezoneValue(profile.timezone || '') ||
          suggestTimezoneForRegion(nextCountry, nextRegion) ||
          getUserTimezone();
        setForm((prev) => ({
          ...prev,
          country: prev.country ? normalizeDisplayCountry(prev.country) : nextCountry,
          state: prev.state || nextRegion,
          city: prev.city || profile.address_city || '',
          street: prev.street || profile.address_street || profile.address || '',
          postalCode: prev.postalCode || formatPostalInput(nextCountry, profile.address_zip || ''),
          timezone: normalizeTimezoneValue(prev.timezone || '') || suggestedTimezone,
          primaryWorkLocationId: prev.primaryWorkLocationId || (activeItems.length === 1 ? String(activeItems[0].id) : ""),
        }));
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    setForm((prev) => {
      const normalizedCountry = prev.country ? normalizeDisplayCountry(prev.country) : "";
      const options = getRegionOptions(normalizedCountry);
      const next = { ...prev, country: normalizedCountry || prev.country };
      if (options.length && next.state && !options.includes(String(next.state).trim().toUpperCase())) {
        next.state = '';
      }
      const suggestedTimezone = suggestTimezoneForRegion(normalizedCountry, next.state);
      if (suggestedTimezone && (!normalizeTimezoneValue(next.timezone || '') || normalizeTimezoneValue(next.timezone || '') === normalizeTimezoneValue(companyProfile?.timezone || '') || normalizeTimezoneValue(next.timezone || '') === getUserTimezone())) {
        next.timezone = suggestedTimezone;
      }
      return next;
    });
  }, [form.country, form.state, companyProfile]);

  useEffect(() => {
    if (activePayrollLocations.length === 1 && !form.primaryWorkLocationId) {
      setForm((prev) => ({ ...prev, primaryWorkLocationId: String(activePayrollLocations[0].id) }));
    }
  }, [activePayrollLocations, form.primaryWorkLocationId]);

  useEffect(() => {
    if (!selectedPayrollLocation) return;
    const locationCountry = normalizeDisplayCountry(selectedPayrollLocation.country) || form.country || "US";
    const locationRegion = String(selectedPayrollLocation.state || "").trim().toUpperCase();
    const locationTimezone =
      normalizeTimezoneValue(selectedPayrollLocation.timezone || "") ||
      suggestTimezoneForRegion(locationCountry, locationRegion);
    setForm((prev) => ({
      ...prev,
      country: prev.country || locationCountry,
      state: prev.state || locationRegion,
      timezone:
        normalizeTimezoneValue(prev.timezone || "") ||
        locationTimezone ||
        normalizeTimezoneValue(companyProfile?.timezone || "") ||
        getUserTimezone(),
    }));
  }, [companyProfile?.timezone, form.country, selectedPayrollLocation]);

  const handleChange = (key) => (event) => {
    const rawValue = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    const value = key === "country" ? normalizeDisplayCountry(rawValue) : key === "postalCode" ? formatPostalInput(form.country, rawValue) : rawValue;
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const errors = {};
    if (!form.firstName.trim()) errors.firstName = "Required";
    if (!form.lastName.trim()) errors.lastName = "Required";
    if (!form.email.trim()) errors.email = "Email required";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) errors.email = "Invalid email";
    if (!form.confirmAuthority) errors.confirmAuthority = "Confirmation required";
    if (
      payrollSetupProfile?.payroll_intent === "check_embedded_us" &&
      activePayrollLocations.length > 1 &&
      !form.primaryWorkLocationId
    ) {
      errors.primaryWorkLocationId = "Select a primary payroll location.";
    }
    return errors;
  };

  const createRecruiter = async (payload, token) => {
    const response = await api.post(`/manager/recruiters`, payload, {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
        "Content-Type": "application/json",
      },
      skipBillingModal: true,
    });
    return response;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setSubmitState({ status: "error", message: "Please fix the highlighted fields." });
      return;
    }
    const token = localStorage.getItem("token");
    const payload = {
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim().slice(0, 20),
      role: form.role,
      department_id: form.departmentId ? Number(form.departmentId) : null,
      timezone: form.timezone.trim() || getUserTimezone(),
      address_city: form.city.trim() || null,
      address_street: form.street.trim() || null,
      province: form.state.trim() || null,
      country: normalizeDisplayCountry(form.country),
      address_state: form.state.trim() || null,
      address_zip: form.postalCode.trim() || null,
      primary_work_location_id: form.primaryWorkLocationId ? Number(form.primaryWorkLocationId) : null,
      confirm_authority: form.confirmAuthority,
    };
    try {
      setSubmitState({ status: "loading", message: "" });
      const response = await createRecruiter(payload, token);

      setSubmitState({ status: "success", message: response.data?.message || "Recruiter added." });
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        role: form.role,
        departmentId: "",
        timezone: getUserTimezone(),
        city: "",
        street: "",
        state: "",
        country: normalizeDisplayCountry(companyProfile?.country_code) || "US",
        postalCode: "",
        primaryWorkLocationId: activePayrollLocations.length === 1 ? String(activePayrollLocations[0].id) : "",
        confirmAuthority: false,
      });
      setFieldErrors({});
    } catch (error) {
      const apiData = error?.response?.data;
      if (error?.response?.status === 409 && apiData?.error === "limit_exceeded" && apiData?.limit === "seats") {
        if (mobileComplianceMode) {
          setSubmitState({ status: "error", message: MOBILE_PAYMENTS_MESSAGE });
          return;
        }
        const allowed = Number(apiData?.allowed || 0);
        const current = Number(apiData?.current || 0);
        const needed = Math.max(1, current - allowed);
        setSeatsAllowed(allowed);
        setSeatAttemptTotal(current);
        setSeatNeeded(needed);
        setSeatInput(String(needed));
        setPendingPayload(payload);
        setSeatDialogError("");
        setSeatDialogOpen(true);
        setSubmitState({ status: "error", message: "Seat limit reached. Add seats to continue." });
        return;
      }
      if (apiData?.field_errors) {
        const mapped = {};
        Object.entries(apiData.field_errors).forEach(([key, value]) => {
          const mapKey = {
            first_name: "firstName",
            last_name: "lastName",
            department_id: "departmentId",
            address_street: "street",
            address_city: "city",
            address_state: "state",
            address_zip: "postalCode",
            primary_work_location_id: "primaryWorkLocationId",
            confirm_authority: "confirmAuthority",
          }[key] || key;
          mapped[mapKey] = value;
        });
        setFieldErrors((prev) => ({ ...prev, ...mapped }));
        setSubmitState({ status: "error", message: apiData.error === "validation_error" ? "Please review the highlighted items." : apiData?.error || "Failed to add recruiter." });
      } else {
        setSubmitState({ status: "error", message: apiData?.error || "Failed to add recruiter." });
      }
    }
  };

  const handleSeatPurchase = async () => {
    if (mobileComplianceMode) {
      setSubmitState({ status: "error", message: MOBILE_PAYMENTS_MESSAGE });
      return;
    }
    const token = localStorage.getItem("token");
    const additional = Math.max(0, parseInt(seatInput, 10) || 0);
    if (!additional) {
      setSubmitState({ status: "error", message: "Enter at least 1 seat." });
      return;
    }
    try {
      setSeatDialogError("");
      setSubmitState({ status: "loading", message: "" });
      const targetTotal = seatsAllowed + additional;
      const response = await api.post(
        "/billing/seats/set",
        { target_total_seats: targetTotal },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            "Content-Type": "application/json",
          },
        }
      );
      setSeatInvoiceUrl(response?.data?.latest_invoice_url || "");
      setSeatDialogOpen(false);
      setSeatNotice("Seats updated. View invoice in Billing Portal.");
      if (pendingPayload) {
        const response = await createRecruiter(pendingPayload, token);
        setSubmitState({ status: "success", message: response.data?.message || "Recruiter added." });
        setPendingPayload(null);
      }
    } catch (error) {
      const apiError = error?.response?.data?.error;
      if (apiError === "subscription_missing") {
        setSeatDialogError("No active subscription. Start a plan to purchase seats.");
        setSubmitState({ status: "error", message: "Active subscription required to add seats." });
        return;
      }
      setSeatDialogError(error?.response?.data?.message || "Unable to purchase seats.");
      setSubmitState({ status: "error", message: apiError || "Unable to purchase seats." });
    }
  };

  React.useEffect(() => {
    if (!seatDialogOpen) return;
    const value = Math.max(0, parseInt(seatInput, 10) || 0);
    if (!value) {
      setSeatPreview(null);
      setSeatDialogError("");
      return;
    }
    let active = true;
    setSeatPreviewLoading(true);
    api
      .get(`/billing/seats/preview?addon_qty=${value}`)
      .then((res) => {
        if (!active) return;
        setSeatDialogError("");
        setSeatPreview(res?.data || null);
      })
      .catch((error) => {
        if (!active) return;
        const apiError = error?.response?.data?.error;
        if (apiError === "subscription_missing") {
          setSeatDialogError("No active subscription. Start a plan to purchase seats.");
        } else if (apiError === "seat_addon_price_missing") {
          setSeatDialogError("Seat add-on price is not configured yet.");
        } else {
          setSeatDialogError("");
        }
        setSeatPreview(null);
      })
      .finally(() => {
        if (!active) return;
        setSeatPreviewLoading(false);
      });
    return () => {
      active = false;
    };
  }, [seatDialogOpen, seatInput]);

  return (
    <Box sx={{ maxWidth: 1300, mx: "auto", my: 4, px: { xs: 1, sm: 2 } }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 3,
          border: (t) => `1px solid ${t.palette.divider}`,
          backgroundColor: (t) => t.palette.background.paper,
          boxShadow: (t) => t.shadows[1],
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          spacing={1}
          sx={{ mb: 2 }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h5" fontWeight={700}>
              Add Team Member
            </Typography>
            <Tooltip
              title={
                "After creating a team member, open Employee Management to grant access. " +
                "Step 1: Find the employee. Step 2: Toggle Supervisor/Payroll/HR/Payments as needed. " +
                "Examples: Team lead = Employee + Supervisor access. " +
                "HR coordinator = Employee + HR onboarding access. " +
                "Payroll admin = Employee + Payroll access."
              }
              placement="top"
            >
              <Button
                size="small"
                variant="text"
                startIcon={<InfoOutlinedIcon fontSize="small" />}
                sx={{ textTransform: "none", fontWeight: 600 }}
                component="a"
                href={employeeManagementUrl}
              >
                How to set permissions
              </Button>
            </Tooltip>
            <Button
              size="small"
              variant="outlined"
              sx={{ textTransform: "none", fontWeight: 600 }}
              onClick={() => navigate(employeeManagementUrl)}
            >
              Go to Employee Management
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<DownloadOutlinedIcon fontSize="small" />}
              sx={{ textTransform: "none", fontWeight: 600 }}
              onClick={async () => {
                try {
                  const response = await downloadTeamMemberImportTemplate();
                  const blob = response?.data;
                  if (!(blob instanceof Blob)) throw new Error("Template download failed.");
                  const url = URL.createObjectURL(blob);
                  const anchor = document.createElement("a");
                  anchor.href = url;
                  anchor.download = "schedulaa-team-members-template.csv";
                  document.body.appendChild(anchor);
                  anchor.click();
                  anchor.remove();
                  URL.revokeObjectURL(url);
                } catch (err) {
                  setSubmitState({ status: "error", message: err?.response?.data?.error || err?.message || "Unable to download the team member template." });
                }
              }}
            >
              Download template
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<UploadFileOutlinedIcon fontSize="small" />}
              sx={{ textTransform: "none", fontWeight: 600 }}
              onClick={() => setImportOpen(true)}
            >
              Import team members
            </Button>
          </Stack>
          <Button
            variant="outlined"
            size="small"
            startIcon={<HelpOutlineIcon />}
            onClick={() => setHelpOpen(true)}
          >
            Help
          </Button>
        </Stack>

        {submitState.status === "success" && (
          <Snackbar
            open
            autoHideDuration={4000}
            onClose={() => setSubmitState({ status: "idle", message: "" })}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          >
            <Alert
              onClose={() => setSubmitState({ status: "idle", message: "" })}
              severity="success"
              icon={<CheckCircleIcon fontSize="inherit" />}
              sx={{ width: "100%" }}
            >
              {submitState.message}
            </Alert>
          </Snackbar>
        )}
        {submitState.status === "error" && submitState.message && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitState.message}
          </Alert>
        )}
        {seatNotice && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            action={
              <Stack direction="row" spacing={1}>
                {seatInvoiceUrl && (
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.open(seatInvoiceUrl, "_blank", "noopener");
                      }
                    }}
                  >
                    View invoice
                  </Button>
                )}
                <Button
                  color="inherit"
                  size="small"
                  onClick={async () => {
                    if (mobileComplianceMode) {
                      setSubmitState({ status: "error", message: MOBILE_PAYMENTS_MESSAGE });
                      return;
                    }
                    try {
                      const res = await api.post("/billing/portal");
                      const url = res?.data?.url;
                      if (url && typeof window !== "undefined") {
                        window.location.href = url;
                      }
                    } catch {
                      setSubmitState({ status: "error", message: "Unable to open billing portal." });
                    }
                  }}
                >
                  Manage Billing
                </Button>
              </Stack>
            }
          >
            {seatNotice}
          </Alert>
        )}

        <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
          Team members set their own password through a secure setup invitation. Existing team members stay unchanged in the import flow.
        </Alert>

        <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
          <strong>Department</strong> is the team this person belongs to, such as Operations, Field Team, or Sales.
          {" "}
          <strong>Primary payroll location</strong> is the physical work location used for payroll and compliance, such as Main Work Location, Toronto Office, or Austin Warehouse.
          {" "}
          Import rows must match existing department and payroll location names in this company.
        </Alert>

        <form onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="First name"
                fullWidth
                value={form.firstName}
                onChange={handleChange("firstName")}
                error={Boolean(fieldErrors.firstName)}
                helperText={fieldErrors.firstName}
                autoComplete="given-name"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last name"
                fullWidth
                value={form.lastName}
                onChange={handleChange("lastName")}
                error={Boolean(fieldErrors.lastName)}
                helperText={fieldErrors.lastName}
                autoComplete="family-name"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Work email"
                type="email"
                fullWidth
                value={form.email}
                onChange={handleChange("email")}
                error={Boolean(fieldErrors.email)}
                helperText={fieldErrors.email || "Used for login + OTP"}
                autoComplete="email"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Department"
                fullWidth
                value={form.departmentId}
                onChange={handleChange("departmentId")}
                error={Boolean(fieldErrors.departmentId)}
                helperText={
                  fieldErrors.departmentId ||
                  (departments.length
                    ? "(Optional) Assign this member to an existing team, such as Operations or Field Team."
                    : "No departments yet? Add them under Settings → Departments.")
                }
              >
                <MenuItem value="">
                  <em>Choose department</em>
                </MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Role"
                fullWidth
                value={form.role}
                onChange={handleChange("role")}
              >
                {ROLE_OPTIONS.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                  </MenuItem>
                  ))}
                </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              {activePayrollLocations.length === 0 ? (
                <Alert severity="info" variant="outlined">
                  Create a payroll location in Company Profile first.
                </Alert>
              ) : activePayrollLocations.length === 1 ? (
                <TextField
                  label="Primary Payroll Location"
                  fullWidth
                  value={activePayrollLocations[0].name}
                  helperText="Departments are for teams or services. Payroll Location is the physical work location used for payroll setup."
                  InputProps={{ readOnly: true }}
                />
              ) : (
                <TextField
                  select
                  label="Primary Payroll Location"
                  fullWidth
                  value={form.primaryWorkLocationId || ""}
                  onChange={handleChange("primaryWorkLocationId")}
                  error={Boolean(fieldErrors.primaryWorkLocationId)}
                  helperText={
                    fieldErrors.primaryWorkLocationId ||
                    "The physical work location used for payroll and compliance, such as Main Work Location or a branch office."
                  }
                >
                  <MenuItem value="">
                    <em>Select payroll location</em>
                  </MenuItem>
                  {activePayrollLocations.map((location) => (
                    <MenuItem key={location.id} value={String(location.id)}>
                      {location.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <TimezoneSelect
                label="Timezone"
                value={form.timezone}
                onChange={(val) => handleChange("timezone")({ target: { value: val } })}
                helperText={fieldErrors.timezone || "IANA format (e.g., America/Toronto). Type to search or detect."}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Location & contact details
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Street address"
                fullWidth
                value={form.street}
                onChange={handleChange("street")}
                error={Boolean(fieldErrors.street)}
                helperText={fieldErrors.street}
                autoComplete="address-line1"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                label="Country"
                fullWidth
                value={form.country || "US"}
                onChange={handleChange("country")}
                helperText="Defaults from company profile when available."
              >
                {COMPANY_COUNTRY_OPTIONS.map((option) => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="City"
                fullWidth
                value={form.city}
                onChange={handleChange("city")}
                error={Boolean(fieldErrors.city)}
                helperText={fieldErrors.city}
                autoComplete="address-level2"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              {regionOptions.length ? (
                <TextField
                  select
                  label={getRegionLabel(form.country)}
                  fullWidth
                  value={form.state}
                  onChange={handleChange("state")}
                  error={Boolean(fieldErrors.state)}
                  helperText={fieldErrors.state}
                  autoComplete="address-level1"
                >
                  <MenuItem value="">
                    <em>Select {getRegionLabel(form.country).toLowerCase()}</em>
                  </MenuItem>
                  {regionOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              ) : (
                <TextField
                  label={getRegionLabel(form.country)}
                  fullWidth
                  value={form.state}
                  onChange={handleChange("state")}
                  error={Boolean(fieldErrors.state)}
                  helperText={fieldErrors.state || "Enter the region used for this address."}
                  autoComplete="address-level1"
                />
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label={getPostalLabel(form.country)}
                fullWidth
                value={form.postalCode}
                onChange={handleChange("postalCode")}
                error={Boolean(fieldErrors.postalCode)}
                helperText={fieldErrors.postalCode || getPostalHelper(form.country)}
                autoComplete="postal-code"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone"
                fullWidth
                value={form.phone}
                onChange={handleChange("phone")}
                autoComplete="tel"
              />
            </Grid>
          </Grid>

          {addressWarnings.length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {addressWarnings.join(" ")}
            </Alert>
          )}

          <Divider sx={{ my: 3 }} />

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "grey.50" }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" fontWeight={700}>
                Account setup
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Schedulaa creates the account and sends a secure setup invitation. Passwords are not entered by managers on this page.
              </Typography>
              <FormControlLabel
                control={<Checkbox checked={form.confirmAuthority} onChange={handleChange("confirmAuthority")} />}
                label="I confirm I am authorized to create this account and send a setup invitation for this team member."
              />
              {fieldErrors.confirmAuthority ? (
                <Typography variant="caption" color="error">
                  {fieldErrors.confirmAuthority}
                </Typography>
              ) : null}
            </Stack>
          </Paper>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={submitState.status === "loading"}
            >
              {submitState.status === "loading" ? "Adding…" : "Add team member"}
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              fullWidth
              onClick={() =>
                setForm({
                  firstName: "",
                  lastName: "",
                  email: "",
                  phone: "",
                  role: form.role,
                  departmentId: "",
                  timezone: getUserTimezone(),
                  city: "",
                  street: "",
                  state: "",
                  country: normalizeDisplayCountry(companyProfile?.country_code) || "US",
                  postalCode: "",
                  primaryWorkLocationId: activePayrollLocations.length === 1 ? String(activePayrollLocations[0].id) : "",
                  confirmAuthority: false,
                })
              }
            >
              Reset form
            </Button>
          </Stack>
        </form>
        <Dialog open={seatDialogOpen} onClose={() => setSeatDialogOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Add seats</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={1.5}>
              {seatsAllowed > 0 ? (
                <Typography variant="body2" color="text.secondary">
                  You’re {seatNeeded} seat{seatNeeded === 1 ? "" : "s"} over your limit. Attempted total: {seatAttemptTotal} ·
                  Allowed: {seatsAllowed}.
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No active subscription. Your plan allows 0 seats, and you currently have {seatAttemptTotal} active staff.
                </Typography>
              )}
              {seatDialogError && <Alert severity="warning">{seatDialogError}</Alert>}
              <TextField
                label="Additional seats"
                type="number"
                inputProps={{ min: 1 }}
                value={seatInput}
                onChange={(e) => setSeatInput(e.target.value)}
                fullWidth
                disabled={Boolean(seatDialogError)}
              />
              {seatPreviewLoading && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={16} />
                  <Typography variant="caption">Fetching estimate…</Typography>
                </Stack>
              )}
              {seatPreview && (
                <Stack spacing={0.5}>
                  <Typography variant="caption">
                    Estimated charge today: {seatPreview.amount_due_today_formatted || "—"}
                  </Typography>
                  <Typography variant="caption">
                    {seatNextBillingLabel}
                  </Typography>
                </Stack>
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setSeatDialogOpen(false)}>Cancel</Button>
            {seatDialogError ? (
              <Button
                variant="contained"
                onClick={() => {
                  if (mobileComplianceMode) {
                    setSubmitState({ status: "error", message: MOBILE_PAYMENTS_MESSAGE });
                    setSeatDialogOpen(false);
                    return;
                  }
                  if (typeof window !== "undefined") {
                    window.location.href = "/pricing";
                  }
                }}
              >
                View plans
              </Button>
            ) : (
              <Button variant="contained" onClick={handleSeatPurchase} disabled={submitState.status === "loading"}>
                Confirm purchase
              </Button>
            )}
          </DialogActions>
        </Dialog>
        <AddMemberHelpDrawer open={helpOpen} onClose={() => setHelpOpen(false)} />
        <TeamMemberImportDialog
          open={importOpen}
          onClose={() => setImportOpen(false)}
          downloadTemplate={downloadTeamMemberImportTemplate}
          previewImport={previewTeamMemberImport}
          commitImport={commitTeamMemberImport}
          listHistory={listTeamMemberImportHistory}
          onImported={async () => {
            setImportOpen(false);
            setSubmitState({ status: "success", message: "Team member import completed." });
          }}
        />
      </Paper>
    </Box>
  );
};

export default AddRecruiter;
