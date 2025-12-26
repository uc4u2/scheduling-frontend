import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
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
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import Snackbar from "@mui/material/Snackbar";
import api from "./utils/api";
import { getUserTimezone } from "./utils/timezone";
import { Link as RouterLink } from "react-router-dom";
import { useDepartments } from "./pages/sections/hooks/useRecruiterDepartments";
import TimezoneSelect from "./components/TimezoneSelect";

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
  const departments = useDepartments();

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setSubmitState({ status: "error", message: "Please fix the highlighted fields." });
      return;
    }
    try {
      setSubmitState({ status: "loading", message: "" });
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

      const response = await api.post(`/manager/recruiters`, payload, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          "Content-Type": "application/json",
        },
      });

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
      </Paper>
    </Box>
  );
};

export default AddRecruiter;
