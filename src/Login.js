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
  Paper,
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

// FE/BE both use IANA TZ names; we detect the browser's and pass it through.
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

const Login = ({ setToken }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState("recruiter");
  const [timezone, setTimezone] = useState(detectedTz);
  const [forceChange, setForceChange] = useState(false);

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

    // As a last resort, infer from same-origin referrer path (/slug or /slug/…)
    try {
      const ref = document.referrer ? new URL(document.referrer) : null;
      if (ref && ref.origin === window.location.origin) {
        const seg = ref.pathname.split("/").filter(Boolean)[0];
        if (
          seg &&
          !["login", "dashboard", "manager", "recruiter"].includes(seg)
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

  // Step 1 — initial login submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const res = await axios.post(`${API_URL}/login`, {
        email,
        password,
        role: selectedRole,
        timezone, // IANA TZ; backend should accept this string as-is
      });

      // Client: direct login (token returned immediately)
      if (selectedRole === "client" && res.data?.access_token) {
        const token = res.data.access_token;
        localStorage.setItem("token", token);
        localStorage.setItem("role", selectedRole);
        localStorage.setItem("timezone", timezone);
        setToken(token);

        // Try to set company id for client flows too (harmless if unused)
        await resolveAndStoreCompanyId(token, res.data?.company_id);

        const site = siteForRedirect();
        const next =
          nextParam ||
          (site ? `/dashboard?site=${encodeURIComponent(site)}` : "/dashboard");
        navigate(next);
        return;
      }

      // Recruiter/Manager proceed to OTP
      setMessage(res.data?.message || "Check your email for the OTP.");
      setStep(2);
      if (res.data?.force_password_change) setForceChange(true);
    } catch (err) {
      setError(err?.response?.data?.error || "Login failed.");
    }
  };

  // Step 2 — OTP verification
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

      // Persist auth/session
      localStorage.setItem("token", token);
      localStorage.setItem("role", selectedRole);
      localStorage.setItem("timezone", timezone);
      setToken(token);

      // Persist site (if known)
      const site = siteForRedirect();
      if (site) localStorage.setItem("site", site);

      // Resolve/store company_id so builder requests include X-Company-Id
      const cid = await resolveAndStoreCompanyId(token, res.data?.company_id);

      if (forceChange) {
        navigate("/reset-password/temp", {
          state: { email, currentPassword: password },
        });
        return;
      }

      // If a specific "next" is provided, append cid/site if it points to builder
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

      // Default redirects by role
      if (selectedRole === "manager") {
        // Send managers to builder with explicit company_id (& site) for belt & suspenders
        const url = appendQuery("/manage/website/builder", {
          company_id: cid || undefined,
          site: site || undefined,
        });
        navigate(url);
      } else if (selectedRole === "recruiter") {
        navigate("/recruiter");
      } else {
        navigate(site ? `/dashboard?site=${encodeURIComponent(site)}` : "/dashboard");
      }
    } catch (err) {
      setError(err?.response?.data?.error || "OTP verification failed.");
    }
  };

  // Build the TZ options, ensuring we include the detected timezone even if not in the static list
  const tzOptions = STATIC_TIMEZONES.includes(timezone)
    ? STATIC_TIMEZONES
    : [timezone, ...STATIC_TIMEZONES];

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={4} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          {selectedRole === "manager"
            ? "Manager Login"
            : selectedRole === "client"
            ? "Client Login"
            : "Recruiter Login"}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {message && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        {step === 1 ? (
          <form onSubmit={handleLoginSubmit}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              autoComplete="email"
              margin="normal"
            />

            <PasswordField
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              autoComplete="current-password"
              margin="normal"
            />

            <Box textAlign="right" mt={1}>
              <Button
                size="small"
                variant="text"
                onClick={() => navigate("/forgot-password")}
              >
                Forgot Password?
              </Button>
            </Box>

            <TextField
              select
              label="Role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              fullWidth
              margin="normal"
            >
              <MenuItem value="client">Client</MenuItem>
              <MenuItem value="recruiter">Recruiter</MenuItem>
              <MenuItem value="manager">Manager</MenuItem>
            </TextField>

            <TextField
              select
              label="Timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              fullWidth
              margin="normal"
              helperText="We store an IANA timezone (e.g. America/New_York)."
            >
              {/* If the detected TZ isn't in our curated list, show it as an option */}
              {!STATIC_TIMEZONES.includes(timezone) && (
                <MenuItem value={timezone}>{timezone} (detected)</MenuItem>
              )}
              {STATIC_TIMEZONES.map((tz) => (
                <MenuItem key={tz} value={tz}>
                  {tz}
                </MenuItem>
              ))}
            </TextField>

            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
              Login
            </Button>
          </form>
        ) : (
          <form onSubmit={handleOTPSubmit}>
            <TextField
              label="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              fullWidth
              required
              margin="normal"
            />
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
              Verify OTP
            </Button>
          </form>
        )}
      </Paper>
    </Container>
  );
};

export default Login;
