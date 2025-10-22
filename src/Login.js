// src/Login.js
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  TextField,
  MenuItem,
  Button,
  Box,
  Alert,
  Stack,
} from "@mui/material";
import PasswordField from "./PasswordField";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

const STATIC_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Asia/Dubai",
  "Australia/Sydney",
];

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

const API_URL =
  (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.trim()) ||
  "http://localhost:5000";

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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState("employee");
  const [timezone, setTimezone] = useState(detectedTz);
  const [forceChange, setForceChange] = useState(false);

  const selectedRoleMeta = getRoleMeta(selectedRole);

  // Read optional redirect + site from query
  const qs = new URLSearchParams(location.search);
  const nextParam = qs.get("next") || "";
  const siteParam = qs.get("site") || "";

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

    const authed = axios.create({
      baseURL: API_URL,
      headers: { Authorization: `Bearer ${token}` },
    });

    // 2) Try manager endpoints if available
    try {
      const r1 = await authed.get("/manager/profile");
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
      const r2 = await authed.get("/api/company/me");
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
        const r3 = await axios.get(`${API_URL}/api/public/${site}/website`);
        const id = r3?.data?.company_id || r3?.data?.company?.id;
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
      const res = await axios.post(`${API_URL}/login`, {
        email,
        password,
        role: targetRole,
        timezone,
      });

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
        navigate(next);
        return;
      }

      setMessage(res.data?.message || "Check your email for the OTP.");
      setStep(2);
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
      const res = await axios.post(`${API_URL}/verify-otp`, {
        email,
        otp,
      });

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

      if (targetRole === "manager") {
        const url = appendQuery("/manage/website/builder", {
          company_id: cid || undefined,
          site: site || undefined,
        });
        navigate(url);
      } else if (targetRole === "recruiter") {
        navigate("/recruiter");
      } else {
        navigate(site ? `/dashboard?site=${encodeURIComponent(site)}` : "/dashboard");
      }
    } catch (err) {
      setError(err?.response?.data?.error || "OTP verification failed.");
    }
  };

  const tzOptions = STATIC_TIMEZONES.includes(timezone)
    ? STATIC_TIMEZONES
    : [timezone, ...STATIC_TIMEZONES];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        py: { xs: 8, md: 12 },
        px: 2,
        background: "linear-gradient(135deg, rgba(255,112,51,0.08) 0%, rgba(56,189,248,0.08) 100%)",
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 3,
            boxShadow: "0 4px 20px rgba(15, 23, 42, 0.05)",
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ height: 4, width: "100%", bgcolor: "#FF7033", borderRadius: 1, mb: 3 }} />

          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Welcome Back to Schedulaa
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select your role to log into the right dashboard.
          </Typography>

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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                  required
                  autoComplete="email"
                />

                <PasswordField
                  label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  fullWidth
                  required
                  autoComplete="current-password"
                />

                <Box textAlign="right">
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => navigate("/forgot-password")}
                  >
                    Forgot password?
                  </Button>
                </Box>

                <TextField
                  select
                  label="Role"
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

                <TextField
                  select
                  label="Timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  fullWidth
                  helperText="We store an IANA timezone (e.g. America/New_York)."
                >
                  {!STATIC_TIMEZONES.includes(timezone) && (
                    <MenuItem value={timezone}>{timezone} (detected)</MenuItem>
                  )}
                  {tzOptions.map((tz) => (
                    <MenuItem key={tz} value={tz}>
                      {tz}
                    </MenuItem>
                  ))}
                </TextField>

                <Button type="submit" variant="contained" fullWidth sx={{ py: 1.25 }}>
                  Sign In
                </Button>
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
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  fullWidth
                  required
                />
                <Button type="submit" variant="contained" fullWidth sx={{ py: 1.25 }}>
                  Verify OTP
                </Button>
              </Stack>
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default Login;
