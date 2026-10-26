// Client login, registration, and password dialogs used by checkout.
import React, { useState } from "react";
import { buildMarketingLegalUrl } from "../../config/origins";
import { Stack, Alert, Box, Button, Dialog, DialogTitle, DialogContent, TextField, Link, DialogActions, useMediaQuery, Typography, IconButton, FormControlLabel, Checkbox, CircularProgress } from "@mui/material";
import { formatTimezoneLabel, getUserTimezone } from "../../utils/timezone";
import api, { api as apiClient } from "../../utils/api";
import TimezoneSelect from "../../components/TimezoneSelect";
import { useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";

export const USER_AGREEMENT_URL = buildMarketingLegalUrl("/user-agreement");

export const renderDetectedTimezoneNotice = (timezone, showManual, onToggle) => (
  <Stack spacing={1} sx={{ mt: 1 }}>
    <Alert severity="info" sx={{ mb: showManual ? 1 : 0 }}>
      Timezone detected automatically: <strong>{formatTimezoneLabel(timezone) || timezone || "UTC"}</strong>
    </Alert>
    <Box>
      <Button size="small" onClick={onToggle}>
        {showManual ? "Hide timezone change" : "Change timezone"}
      </Button>
    </Box>
  </Stack>
);

export /* ------------------------------------------------------------------ */
/* LoginDialog component (unchanged) */
function LoginDialog({ open, onClose, onLoginSuccess, companySlug }) {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const dialogPaperSx = {
    backgroundColor: "var(--checkout-card-bg, var(--page-card-bg, var(--page-body-bg, #ffffff)))",
    backgroundImage: "none",
    color: "var(--page-body-color, #111827)",
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const selectedRole = "client";
  const [timezone, setTimezone] = useState(getUserTimezone());
  const [showTimezoneSelect, setShowTimezoneSelect] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post(`/login`, {
        email,
        password,
        role: selectedRole,
        timezone,
        company_slug: companySlug || undefined,
      });

      if (selectedRole === "client" && res.data.access_token) {
        onLoginSuccess(res.data.access_token);
        onClose();
      } else {
        setError("Login flow for this role not supported here.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            ...dialogPaperSx,
          },
        }}
        sx={{
          "& .MuiDialog-paper": dialogPaperSx,
          "& .MuiDialogContent-root": { backgroundColor: "var(--checkout-card-bg, var(--page-card-bg, var(--page-body-bg, #ffffff)))" },
          "& .MuiDialogTitle-root": { backgroundColor: "var(--checkout-card-bg, var(--page-card-bg, var(--page-body-bg, #ffffff)))" },
        }}
      >
        <DialogTitle sx={{ backgroundColor: "var(--checkout-card-bg, var(--page-card-bg, var(--page-body-bg, #ffffff)))" }}>
          Client Login
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: "var(--checkout-card-bg, var(--page-card-bg, var(--page-body-bg, #ffffff)))" }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} id="login-dialog-form">
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              margin="normal"
            />

            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              margin="normal"
            />

            {renderDetectedTimezoneNotice(timezone, showTimezoneSelect, () => setShowTimezoneSelect((prev) => !prev))}
            {showTimezoneSelect ? (
              <TimezoneSelect
                label="Timezone"
                value={timezone}
                onChange={setTimezone}
              />
            ) : null}
          </form>
          <Box sx={{ mt: 1 }}>
            <Link component="button" variant="body2" onClick={() => setForgotOpen(true)}>
              Forgot password?
            </Link>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="login-dialog-form"
            variant="contained"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </DialogActions>
      </Dialog>
      <ForgotPasswordDialog open={forgotOpen} onClose={() => setForgotOpen(false)} companySlug={companySlug} />
    </>
  );
}

export function ForgotPasswordDialog({ open, onClose, companySlug }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!email) {
      setError("Email is required.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post(
        "/forgot-password",
        { email, company_slug: companySlug || undefined },
        { noAuth: true, noCompanyHeader: true }
      );
      setMessage(res.data?.message || "Reset email sent.");
    } catch (err) {
      setError(err.response?.data?.error || "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Reset Password</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {message && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}
        <form onSubmit={handleSubmit} id="forgot-password-form">
          <TextField
            label="Email"
            type="email"
            fullWidth
            required
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Close
        </Button>
        <Button type="submit" form="forgot-password-form" variant="contained" disabled={loading}>
          {loading ? "Sending..." : "Send reset email"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function RegisterDialog({ open, onClose, onRegisterSuccess, onOpenLogin, onOpenForgot, companySlug }) {
  const theme = useTheme();
  const compactLayout = useMediaQuery(theme.breakpoints.down("sm"));
  const dialogPaperSx = {
    backgroundColor: "var(--checkout-card-bg, var(--page-card-bg, var(--page-body-bg, #ffffff)))",
    backgroundImage: "none",
    color: "var(--page-body-color, #111827)",
    borderRadius: { xs: 0, sm: 3 },
    maxHeight: { xs: "100dvh", sm: "min(90dvh, 760px)" },
  };

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [agreedToTerms, setAgreedToTerms] = React.useState(false);
  const [timezone, setTimezone] = React.useState(getUserTimezone());
  const [showTimezoneSelect, setShowTimezoneSelect] = React.useState(false);
  const [error, setError] = React.useState("");
  const [accountExists, setAccountExists] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setAccountExists(false);
    setLoading(true);

    if (!firstName || !lastName || !email || !phone || !password) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }
    if (!agreedToTerms) {
      setError("You must accept the Schedulaa User Agreement to create an account.");
      setLoading(false);
      return;
    }

    try {
      await api.post(`/register`, {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        password,
        password_confirm: password,
        timezone,
        role: "client",
        company_slug: companySlug || undefined,
        agreed_to_terms: true,
      });
      const loginRes = await api.post(`/login`, {
        email,
        password,
        role: "client",
        timezone,
        company_slug: companySlug || undefined,
      });
      if (loginRes.data.access_token) {
        onRegisterSuccess(loginRes.data.access_token);
        onClose();
      } else {
        setError("Registration succeeded but login failed.");
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.error === "account_exists") {
        setAccountExists(true);
        setError(
          data?.message ||
            "You already have an account on the Schedulaa platform used by this business. Please log in to continue, or use Forgot password."
        );
      } else {
        setError(data?.error || "Registration failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      fullScreen={compactLayout}
      maxWidth="sm"
      PaperProps={{
        sx: {
          ...dialogPaperSx,
        },
      }}
      sx={{
        "& .MuiDialog-paper": dialogPaperSx,
        "& .MuiDialogContent-root": { backgroundColor: "var(--checkout-card-bg, var(--page-card-bg, var(--page-body-bg, #ffffff)))" },
        "& .MuiDialogTitle-root": { backgroundColor: "var(--checkout-card-bg, var(--page-card-bg, var(--page-body-bg, #ffffff)))" },
        "& .MuiDialogActions-root": { backgroundColor: "var(--checkout-card-bg, var(--page-card-bg, var(--page-body-bg, #ffffff)))" },
      }}
    >
      <DialogTitle
        component="div"
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
          px: { xs: 2, sm: 3 },
          pt: { xs: 2, sm: 2.5 },
          pb: 1.5,
        }}
      >
        <Box>
          <Typography component="h2" variant="h6" sx={{ fontWeight: 700 }}>
            Create your client account
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Save your details and manage your bookings in one place.
          </Typography>
        </Box>
        <IconButton
          aria-label="Close sign up"
          onClick={onClose}
          disabled={loading}
          size="small"
          sx={{ mt: -0.5, mr: -0.5, flexShrink: 0 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          px: { xs: 2, sm: 3 },
          py: 2,
          overscrollBehavior: "contain",
        }}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit}
          id="register-dialog-form"
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
            gap: 2,
          }}
        >
          <TextField
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            fullWidth
            required
            size="small"
            autoComplete="given-name"
          />
          <TextField
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            fullWidth
            required
            size="small"
            autoComplete="family-name"
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            size="small"
            autoComplete="email"
          />
          <TextField
            label="Phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            fullWidth
            required
            size="small"
            autoComplete="tel"
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            size="small"
            autoComplete="new-password"
            helperText="Use a strong password you do not use elsewhere."
            sx={{ gridColumn: "1 / -1" }}
          />
          <Box sx={{ gridColumn: "1 / -1", "& .MuiButton-root": { textTransform: "none" } }}>
            {renderDetectedTimezoneNotice(timezone, showTimezoneSelect, () => setShowTimezoneSelect((prev) => !prev))}
            {showTimezoneSelect ? (
              <TimezoneSelect
                label="Timezone"
                value={timezone}
                onChange={setTimezone}
              />
            ) : null}
          </Box>
          <Box
            sx={{
              gridColumn: "1 / -1",
              border: "1px solid var(--page-border-color, rgba(15,23,42,0.12))",
              borderRadius: 2,
              px: 1.5,
              py: 0.5,
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                />
              }
              label={
                <Typography variant="body2">
                  I agree to the{" "}
                  <Link href={USER_AGREEMENT_URL} target="_blank" rel="noopener">
                    Schedulaa User Agreement
                  </Link>
                  .
                </Typography>
              }
              sx={{ alignItems: "center", m: 0 }}
            />
          </Box>
        </Box>

        {accountExists && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Please log in to continue. If you don’t remember your password, use “Forgot password”.
          </Alert>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2, sm: 3 },
          py: 2,
          display: "flex",
          flexDirection: { xs: "column-reverse", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          gap: 1.5,
          "& > :not(style) ~ :not(style)": { ml: 0 },
          "& .MuiButton-root": { textTransform: "none" },
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 0.5, sm: 1 }}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <Button size="small" onClick={onOpenLogin} disabled={loading}>
            Already have an account? Log in
          </Button>
          <Button size="small" onClick={onOpenForgot} disabled={loading}>
            Forgot password?
          </Button>
        </Stack>
        <Stack direction="row" spacing={1} justifyContent={{ xs: "stretch", sm: "flex-end" }}>
          <Button onClick={onClose} disabled={loading} sx={{ flex: { xs: 1, sm: "initial" } }}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="register-dialog-form"
            variant="contained"
            disabled={loading}
            sx={{ flex: { xs: 1, sm: "initial" }, minWidth: { sm: 150 } }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : "Create account"}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
