// src/Login.js
import React, { useState, useEffect, useRef } from "react";
import {
  Typography,
  TextField,
  MenuItem,
  Button,
  Box,
  Alert,
  Stack,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import PasswordField from "./PasswordField";
import TimezoneSelect from "./components/TimezoneSelect";
import { useNavigate, useLocation } from "react-router-dom";
import { api, publicSite } from "./utils/api";
import AuthCardShell, { authButtonSx, authInputSx } from "./components/auth/AuthCardShell";

const ROLE_OPTIONS = [
  {
    value: "customer",
    label: "Customer",
    description: "Book services or shop with your business",
    apiValue: "client",
  },
  {
    value: "employee",
    label: "Employee",
    description: "Access your schedule, shifts, or payroll",
    apiValue: "recruiter",
  },
  {
    value: "owner",
    label: "Business Owner",
    description: "Manage your company, team, and online bookings",
    apiValue: "manager",
  },
];

const detectedTz =
  (typeof Intl !== "undefined" &&
    Intl.DateTimeFormat().resolvedOptions().timeZone) ||
  "America/New_York";

// Helper: append query params to a URL safely
function appendQuery(url, paramsObj = {}) {
  const hasQ = url.includes("?");
  const qs = new URLSearchParams();
  Object.entries(paramsObj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      qs.set(k, String(v));
    }
  });
  const tail = qs.toString();
  if (!tail) return url;
  return url + (hasQ ? "&" : "?") + tail;
}

const getRoleMeta = (value) =>
  ROLE_OPTIONS.find((option) => option.value === value) || ROLE_OPTIONS[1];

const Login = ({ setToken }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasSession = Boolean(localStorage.getItem("token"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState("employee");
  const [timezone, setTimezone] = useState(detectedTz);
  const [forceChange, setForceChange] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const resendTimerRef = useRef(null);

  // Read optional redirect + site from query
  const qs = new URLSearchParams(location.search);
  const nextParam = qs.get("next") || "";
  const siteParam = qs.get("site") || "";
  const planParam = (qs.get("plan") || "").toLowerCase();
  const intervalParam = (qs.get("interval") || "").toLowerCase();
  const returnToParam = (qs.get("returnTo") || "").trim();
  const tabParam = (qs.get("tab") || "").toLowerCase();

  useEffect(() => {
    if (!hasSession) return;
    if (tabParam === "billing") {
      navigate("/manager/settings?tab=billing", { replace: true });
      return;
    }
    navigate("/manager/dashboard", { replace: true });
  }, [hasSession, navigate, tabParam]);

  // Persist site from query once present
  useEffect(() => {
    if (siteParam) localStorage.setItem("site", siteParam);
  }, [siteParam]);

  // Consistent way to figure out the site slug
  const siteForRedirect = () => {
    if (siteParam) return siteParam;

    const stored = localStorage.getItem("site");
    if (stored) return stored;

    // As a last resort, infer from same-origin referrer path (/slug or /slug/*)
    try {
      const ref = document.referrer ? new URL(document.referrer) : null;
      if (ref && ref.origin === window.location.origin) {
        const seg = ref.pathname.split("/").filter(Boolean)[0];
        if (
          seg &&
          ![
            "login",
            "dashboard",
            "manager",
            "recruiter",
            "employee",
            "owner",
            "customer",
          ].includes(seg)
        ) {
          return seg;
        }
      }
    } catch {}
    return "";
  };

  // Resolve and persist company id so builder requests include X-Company-Id
  const resolveAndStoreCompanyId = async (token, hintedCompanyId) => {
    // 1) If backend returned a company id, use it
    if (hintedCompanyId) {
      localStorage.setItem("company_id", String(hintedCompanyId));
      return String(hintedCompanyId);
    }

    // 2) Try manager endpoints if available
    try {
      const r1 = await api.get("/manager/profile");
      const id =
        r1?.data?.company_id ||
        r1?.data?.company?.id ||
        r1?.data?.profile?.company_id;
      if (id) {
        localStorage.setItem("company_id", String(id));
        return String(id);
      }
    } catch {}

    try {
      const r2 = await api.get("/api/company/me");
      const id =
        r2?.data?.company_id ||
        r2?.data?.company?.id ||
        r2?.data?.profile?.company_id;
      if (id) {
        localStorage.setItem("company_id", String(id));
        return String(id);
      }
    } catch {}

    // 3) Fall back to resolving by site slug (public endpoint)
    const site = siteForRedirect();
    if (site) {
      try {
        const r3 = await publicSite.getWebsiteShell(site);
        const id = r3?.company_id || r3?.company?.id;
        if (id) {
          localStorage.setItem("company_id", String(id));
          return String(id);
        }
      } catch {}
    }

    return null;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const targetRole = getRoleMeta(selectedRole).apiValue;

    try {
      const res = await api.post(
        `/login`,
        {
        email,
        password,
        role: targetRole,
        timezone,
        remember_device: rememberDevice,
        },
        { noAuth: true, noCompanyHeader: true }
      );

      if (targetRole === "client" && res.data?.access_token) {
        const token = res.data.access_token;
        localStorage.setItem("token", token);
        localStorage.setItem("role", targetRole);
        localStorage.setItem("timezone", timezone);
        setToken(token);

        await resolveAndStoreCompanyId(token, res.data?.company_id);

        const site = siteForRedirect();
        const next =
          nextParam ||
          (site ? `/dashboard?site=${encodeURIComponent(site)}` : "/dashboard");
        if (planParam) {
          localStorage.setItem("pending_plan_key", planParam);
          navigate(`/pricing?plan=${encodeURIComponent(planParam)}`);
        } else {
          navigate(next);
        }
        return;
      }

      setMessage(res.data?.message || "Check your email for the OTP.");
      setStep(2);
      setResendCooldown(45);
      if (res.data?.force_password_change) setForceChange(true);
    } catch (err) {
      setError(err?.response?.data?.error || "Login failed.");
    }
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const res = await api.post(
        `/verify-otp`,
        { email, otp },
        { noAuth: true, noCompanyHeader: true }
      );

      const token = res.data?.access_token;
      if (!token) throw new Error("No access token returned.");

      const targetRole = getRoleMeta(selectedRole).apiValue;

      localStorage.setItem("token", token);
      localStorage.setItem("role", targetRole);
      localStorage.setItem("timezone", timezone);
      setToken(token);

      const site = siteForRedirect();
      if (site) localStorage.setItem("site", site);

      const cid = await resolveAndStoreCompanyId(token, res.data?.company_id);

      if (forceChange) {
        navigate("/reset-password/temp", {
          state: { email, currentPassword: password },
        });
        return;
      }

      if (nextParam) {
        const isBuilder = nextParam.startsWith("/manage/website/builder");
        const url = isBuilder
          ? appendQuery(nextParam, {
              company_id: cid || undefined,
              site: site || undefined,
            })
          : nextParam;
        navigate(url);
        return;
      }

      if (planParam) {
        localStorage.setItem("pending_plan_key", planParam);
        navigate(`/pricing?plan=${encodeURIComponent(planParam)}`);
        return;
      }

      if (targetRole === "manager") {
        const url = appendQuery("/manager/dashboard", {
          view: "CompanyProfile",
          company_id: cid || undefined,
        });
        navigate(url);
      } else if (targetRole === "recruiter") {
        navigate("/employee");
      } else {
        navigate(site ? `/dashboard?site=${encodeURIComponent(site)}` : "/dashboard");
      }
    } catch (err) {
      setError(err?.response?.data?.error || "OTP verification failed.");
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || !email) return;
    setError("");
    setMessage("Sending a new code...");
    try {
      await api.post(
        `/login/resend-otp`,
        { email },
        { noAuth: true, noCompanyHeader: true }
      );
      setMessage("We just sent a new code. It may take a moment to arrive.");
      setResendCooldown(45);
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to resend the code right now.");
    }
  };

  useEffect(() => {
    if (resendCooldown <= 0) {
      if (resendTimerRef.current) {
        clearTimeout(resendTimerRef.current);
        resendTimerRef.current = null;
      }
      return;
    }

    resendTimerRef.current = setTimeout(() => {
      setResendCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => {
      if (resendTimerRef.current) {
        clearTimeout(resendTimerRef.current);
        resendTimerRef.current = null;
      }
    };
  }, [resendCooldown]);

  if (hasSession) return null;

  return (
    <AuthCardShell
      title="Welcome back to Schedulaa"
      subtitle="Sign in to manage bookings, staffing, payroll, and operations from one workspace."
    >

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {message && (
            <Alert severity={step === 1 ? "info" : "success"} sx={{ mb: 2 }}>
              {message}
            </Alert>
          )}

          {step === 1 ? (
            <Box component="form" onSubmit={handleLoginSubmit} noValidate>
              <Stack spacing={2.5}>
                <TextField
                  label="Email"
                  type="email"
                  sx={authInputSx}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                  required
                  autoComplete="email"
                  autoFocus
                  inputProps={{ inputMode: "email", autoCapitalize: "none" }}
                />

                <PasswordField
                  label="Password"
                  sx={authInputSx}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  fullWidth
                  required
                  autoComplete="current-password"
                />

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={rememberDevice}
                        onChange={(e) => setRememberDevice(e.target.checked)}
                      />
                    }
                    label="Remember this device for 30 days"
                  />
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => navigate("/forgot-password")}
                  >
                    Forgot password?
                  </Button>
                </Stack>

                <TextField
                  select
                  label="Role"
                  sx={authInputSx}
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  fullWidth
                  helperText="Select your account type to ensure the right dashboard experience."
                >
                  {ROLE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {option.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>

                <TimezoneSelect
                  label="Timezone"
                  value={timezone}
                  onChange={setTimezone}
                  textFieldSx={authInputSx}
                  helperText="We store an IANA timezone (e.g., America/New_York). Type to search."
                />

                <Button type="submit" variant="contained" fullWidth sx={authButtonSx}>
                  Sign In
                </Button>

                <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    New to Schedulaa?
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => {
                      const registerQs = new URLSearchParams();
                      if (planParam) registerQs.set("plan", planParam);
                      if (intervalParam) registerQs.set("interval", intervalParam);
                      if (returnToParam) registerQs.set("returnTo", returnToParam);
                      const suffix = registerQs.toString();
                      navigate(suffix ? `/register?${suffix}` : "/register");
                    }}
                  >
                    Create an account
                  </Button>
                </Stack>

              </Stack>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleOTPSubmit} noValidate>
              <Stack spacing={2.5}>
                <Typography variant="body2" color="text.secondary">
                  Enter the one-time code we emailed you to continue.
                </Typography>
                <TextField
                  label="One-time Passcode"
                  sx={authInputSx}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  fullWidth
                  required
                  inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                />
                <Button type="submit" variant="contained" fullWidth sx={authButtonSx}>
                  Verify OTP
                </Button>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    Didn't get a code?
                  </Typography>
                  <Button
                    size="small"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0}
                  >
                    {resendCooldown > 0
                      ? `Resend available in ${resendCooldown}s`
                      : "Resend code"}
                  </Button>
                </Stack>
              </Stack>
            </Box>
          )}
    </AuthCardShell>
  );
};

export default Login;
