import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import Snackbar from "@mui/material/Snackbar";
import api from "./utils/api";
import { getUserTimezone } from "./utils/timezone";
import { Link as RouterLink } from "react-router-dom";
import { useDepartments } from "./pages/sections/hooks/useRecruiterDepartments";
import TimezoneSelect from "./components/TimezoneSelect";
import useBillingStatus from "./components/billing/useBillingStatus";
import { formatBillingNextDateLabel } from "./components/billing/billingLabels";
import AddMemberHelpDrawer from "./pages/sections/management/components/AddMemberHelpDrawer";

const PASSWORD_HELP =
  "8+ chars, uppercase, lowercase, number, and symbol required.";

const ROLE_OPTIONS = [
  { value: "recruiter", label: "Employee" },
  { value: "manager", label: "Manager" },
];

const AddRecruiter = () => {
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
    postalCode: "",
    password: "",
    confirmPassword: "",
    agreedToTerms: false,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitState, setSubmitState] = useState({ status: "idle", message: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
  const departments = useDepartments();
  const { status: billingStatus } = useBillingStatus();
  const seatNextBillingLabel = formatBillingNextDateLabel({
    nextBillingDate: seatPreview?.next_billing_date,
    trialEnd: billingStatus?.trial_end,
  });

const passwordStrength = useMemo(() => {
  if (!form.password) return "";
  const score = [
    /[A-Z]/.test(form.password),
    /[a-z]/.test(form.password),
    /[0-9]/.test(form.password),
    /[^A-Za-z0-9]/.test(form.password),
    form.password.length >= 12,
  ].filter(Boolean).length;
  if (score >= 4) return "Strong";
  if (score >= 3) return "Medium";
  return "Weak";
}, [form.password]);

  const handleChange = (key) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const errors = {};
    if (!form.firstName.trim()) errors.firstName = "Required";
    if (!form.lastName.trim()) errors.lastName = "Required";
    if (!form.email.trim()) errors.email = "Email required";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) errors.email = "Invalid email";
    if (!form.password) errors.password = "Password required";
    else if (!/[A-Z]/.test(form.password) ||
      !/[a-z]/.test(form.password) ||
      !/[0-9]/.test(form.password) ||
      !/[^A-Za-z0-9]/.test(form.password) ||
      form.password.length < 8) {
      errors.password = PASSWORD_HELP;
    }
    if (form.password !== form.confirmPassword) errors.confirmPassword = "Passwords must match";
    if (!form.agreedToTerms) errors.agreedToTerms = "You must accept the terms";
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
      address_state: form.state.trim() || null,
      address_zip: form.postalCode.trim() || null,
      password: form.password,
      password_confirm: form.confirmPassword,
      agreed_to_terms: form.agreedToTerms,
      terms_version: "2025-11",
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
        postalCode: "",
        password: "",
        confirmPassword: "",
        agreedToTerms: false,
      });
      setFieldErrors({});
    } catch (error) {
      const apiData = error?.response?.data;
      if (error?.response?.status === 409 && apiData?.error === "limit_exceeded" && apiData?.limit === "seats") {
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
            password_confirm: "confirmPassword",
            agreed_to_terms: "agreedToTerms",
            department_id: "departmentId",
            address_street: "street",
            address_city: "city",
            address_state: "state",
            address_zip: "postalCode",
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
          <Typography variant="h5" fontWeight={700}>
            Add Team Member
          </Typography>
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
                    ? "(Optional) Assign this member to a department."
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
            <Grid item xs={12} sm={6}>
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
            <Grid item xs={12} sm={6}>
              <TextField
                label="State / Province"
                fullWidth
                value={form.state}
                onChange={handleChange("state")}
                error={Boolean(fieldErrors.state)}
                helperText={fieldErrors.state}
                autoComplete="address-level1"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Postal / ZIP code"
                fullWidth
                value={form.postalCode}
                onChange={handleChange("postalCode")}
                error={Boolean(fieldErrors.postalCode)}
                helperText={fieldErrors.postalCode || "CA: A1A 1A1 · US: 12345-6789"}
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

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Password"
                type={showPassword ? "text" : "password"}
                fullWidth
                value={form.password}
                onChange={handleChange("password")}
                error={Boolean(fieldErrors.password)}
                helperText={fieldErrors.password || PASSWORD_HELP}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword((prev) => !prev)} edge="end" size="small">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                autoComplete="new-password"
              />
              {passwordStrength && (
                <Typography variant="caption" color="text.secondary">
                  Strength: {passwordStrength}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Confirm password"
                type={showConfirm ? "text" : "password"}
                fullWidth
                value={form.confirmPassword}
                onChange={handleChange("confirmPassword")}
                error={Boolean(fieldErrors.confirmPassword)}
                helperText={fieldErrors.confirmPassword}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirm((prev) => !prev)} edge="end" size="small">
                        {showConfirm ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                autoComplete="new-password"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Checkbox required checked={form.agreedToTerms} onChange={handleChange("agreedToTerms")} />}
                label={
                  <Typography variant="body2">
                    I confirm this user agrees to the{" "}
                    <Button
                      component={RouterLink}
                      to="/user-agreement"
                      target="_blank"
                      rel="noopener noreferrer"
                      size="small"
                    >
                      Schedulaa User Agreement
                    </Button>
                    .
                  </Typography>
                }
              />
              {fieldErrors.agreedToTerms && (
                <Typography variant="caption" color="error">
                  {fieldErrors.agreedToTerms}
                </Typography>
              )}
            </Grid>
          </Grid>

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
                  postalCode: "",
                  password: "",
                  confirmPassword: "",
                  agreedToTerms: false,
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
      </Paper>
    </Box>
  );
};

export default AddRecruiter;
