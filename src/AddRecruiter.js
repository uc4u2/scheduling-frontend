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
import axios from "axios";
import { getUserTimezone } from "./utils/timezone";

const API_BASE =
  (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/$/, "");

const PASSWORD_HELP =
  "8+ chars, uppercase, lowercase, number, and symbol required.";

const ROLE_OPTIONS = [
  { value: "recruiter", label: "Recruiter" },
  { value: "manager", label: "Manager" },
];

const AddRecruiter = () => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "recruiter",
    department: "",
    timezone: getUserTimezone(),
    password: "",
    confirmPassword: "",
    agreedToTerms: false,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitState, setSubmitState] = useState({ status: "idle", message: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
    if (!form.department.trim()) errors.department = "Required";
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
        phone: form.phone.trim(),
        role: form.role,
        department: form.department.trim() || "General",
        timezone: form.timezone.trim() || getUserTimezone(),
        password: form.password,
        password_confirm: form.confirmPassword,
        agreed_to_terms: form.agreedToTerms,
        terms_version: "2025-11",
      };
      const response = await axios.post(`${API_BASE}/register`, payload, {
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
        department: "",
        timezone: getUserTimezone(),
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
    <Box sx={{ maxWidth: 720, mx: "auto", my: 4, px: 2 }}>
      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: (t) => `1px solid ${t.palette.divider}` }}>
        <Stack spacing={2} sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <PersonAddAltIcon color="primary" />
            <Typography variant="h5" fontWeight={700}>
              Add new team member
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Create recruiter or manager profiles with immediate portal access. Strong passwords and consent are required for enterprise compliance.
          </Typography>
        </Stack>

        {submitState.status === "success" && (
          <Alert icon={<CheckCircleIcon fontSize="inherit" />} severity="success" sx={{ mb: 2 }}>
            {submitState.message}
          </Alert>
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
            <Grid item xs={12} sm={6}>
              <TextField
                label="Department"
                fullWidth
                value={form.department}
                onChange={handleChange("department")}
                error={Boolean(fieldErrors.department)}
                helperText={fieldErrors.department || "e.g., Sales, Ops"}
              />
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
              <TextField
                label="Timezone"
                fullWidth
                value={form.timezone}
                onChange={handleChange("timezone")}
                error={Boolean(fieldErrors.timezone)}
                helperText={fieldErrors.timezone || "IANA format (e.g., America/Toronto)"}
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
                control={<Checkbox checked={form.agreedToTerms} onChange={handleChange("agreedToTerms")} />}
                label="I confirm that this user agrees to the Schedulaa User Agreement."
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
              onClick={() => setForm({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                role: form.role,
                department: "",
                timezone: getUserTimezone(),
                password: "",
                confirmPassword: "",
                agreedToTerms: false,
              })}
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
