// src/pages/client/Checkout.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { formatCurrency } from "../../utils/formatters";
import { setActiveCurrency, normalizeCurrency, resolveCurrencyForCountry, getActiveCurrency } from "../../utils/currency";
import { api as apiClient, API_BASE_URL } from "../../utils/api";
import { CLIENT_BOOKING_BLOCKED_PUBLIC_MESSAGE } from "../../utils/bookingErrors";
import { buildHostedCheckoutPayload, startHostedCheckout, releasePendingCheckout } from "../../utils/hostedCheckout";
import { CartTypes, loadCart, saveCart, clearCart } from "../../utils/cart";
import { getTenantHostMode } from "../../utils/tenant";

import {
  Autocomplete,
  Box,
  Typography,
  Alert,
  TextField,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Link,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  ListItemButton,
  Checkbox,
  FormControlLabel,
  FormControl,
  Select,
  ListItemIcon,
  Chip,
  Paper,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { useTheme } from "@mui/material/styles";
import api from "../../utils/api";
import PublicBookingUnavailableDialog from "../../components/billing/PublicBookingUnavailableDialog";
import SiteFrame from "../../components/website/SiteFrame";
import { publicSite } from "../../utils/api";
import TimezoneSelect from "../../components/TimezoneSelect";
import { getUserTimezone, formatTimezoneLabel } from "../../utils/timezone";

const stashProductOrder = (order, sessionId) => {
  if (!order) return;
  const normalized = { ...order };
  if (sessionId && !normalized.stripe_session_id) {
    normalized.stripe_session_id = sessionId;
  }
  try {
    sessionStorage.setItem("checkout_products", JSON.stringify({ order: normalized, at: Date.now() }));
    if (sessionId) {
      sessionStorage.setItem("checkout_stripe_session_id", sessionId);
    } else if (!normalized.stripe_session_id) {
      sessionStorage.removeItem("checkout_stripe_session_id");
    }
  } catch (err) {
    // best effort only
  }
};

const clearProductOrderStash = () => {
  try {
    sessionStorage.removeItem("checkout_products");
    sessionStorage.removeItem("checkout_stripe_session_id");
  } catch (err) {
    // ignore storage failures
  }
};

const normalizeProductOrder = (payload) => {
  if (!payload) return null;
  if (payload.order && typeof payload.order === 'object') return payload.order;
  if (payload.product_order && typeof payload.product_order === 'object') return payload.product_order;
  return payload;
};

const FALLBACK_COUNTRY_LABELS = {
  CA: "Canada",
  US: "United States",
};

const CHECKOUT_SELECT_MENU_PROPS = {
  PaperProps: {
    sx: {
      backgroundColor: "var(--checkout-card-bg, var(--page-card-bg, #ffffff))",
      backgroundImage: "none",
      opacity: 1,
      backdropFilter: "none",
      boxShadow: "0 12px 30px rgba(15, 23, 42, 0.18)",
      border: "1px solid var(--page-border, rgba(2, 6, 23, 0.08))",
    },
  },
};

const normalizeDeliveryCountryCode = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const token = raw.toUpperCase();
  if (token === "CA" || token === "CANADA") return "CA";
  if (token === "US" || token === "USA" || token === "UNITED STATES" || token === "UNITED STATES OF AMERICA") return "US";
  if (token.length === 2 && /^[A-Z]{2}$/.test(token)) return token;
  return "";
};

const EMPTY_SHIPPING_RATES = {
  loading: false,
  available: false,
  fallbackManual: false,
  message: "",
  rates: [],
  selectedRateId: "",
  quoteToken: "",
  quoteExpiresAt: "",
  dutiesIncluded: false,
  importChargesNoticeVersion: "",
  importChargesNoticeSnapshot: null,
  requireImportChargesAcknowledgement: false,
  incompatibleItems: [],
};

const EMPTY_ADDRESS_VERIFICATION = {
  loading: false,
  status: "idle",
  token: "",
  acceptedAddress: null,
  originalAddress: null,
  suggestedAddress: null,
  differences: [],
  messages: [],
  retryable: false,
  residential: null,
  verificationLevel: "",
};

const emptyImportNoticeConfig = {
  internationalDutiesPolicy: "",
  dutiesIncluded: false,
  importChargesNoticeVersion: "",
  importChargesNoticeSnapshot: null,
  requireImportChargesAcknowledgement: false,
};


const renderDetectedTimezoneNotice = (timezone, showManual, onToggle) => (
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


/* ------------------------------------------------------------------ */
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

function ForgotPasswordDialog({ open, onClose, companySlug }) {
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

/* ------------------------------------------------------------------ */
/* RegisterDialog component (unchanged) */
function RegisterDialog({ open, onClose, onRegisterSuccess, onOpenLogin, onOpenForgot, companySlug }) {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const dialogPaperSx = {
    backgroundColor: "var(--checkout-card-bg, var(--page-card-bg, var(--page-body-bg, #ffffff)))",
    backgroundImage: "none",
    color: "var(--page-body-color, #111827)",
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
        Client Sign Up
      </DialogTitle>
      <DialogContent sx={{ backgroundColor: "var(--checkout-card-bg, var(--page-card-bg, var(--page-body-bg, #ffffff)))" }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} id="register-dialog-form">
          <TextField
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            fullWidth
            required
            margin="normal"
          />
          <TextField
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            fullWidth
            required
            margin="normal"
          />
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
            label="Phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
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
          <FormControlLabel
            control={
              <Checkbox
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
              />
            }
            label={
              <span>
                I agree to the{" "}
                <Link
                  href={`${(typeof window !== "undefined" && window.location.origin) || "https://www.schedulaa.com"}/terms`}
                  target="_blank"
                  rel="noopener"
                >
                  Schedulaa User Agreement
                </Link>
                .
              </span>
            }
            sx={{ mt: 1 }}
          />
        </form>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="register-dialog-form"
          variant="contained"
          disabled={loading}
        >
          {loading ? "Registering..." : "Sign Up"}
        </Button>
      </DialogActions>
      <DialogContent sx={{ pt: 0 }}>
        <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
          <Button size="small" onClick={onOpenLogin}>
            Already have an account? Log in
          </Button>
          <Button size="small" onClick={onOpenForgot}>
            Forgot password?
          </Button>
        </Stack>
        {accountExists && (
          <Alert severity="info" sx={{ mt: 1 }}>
            Please log in to continue. If you don’t remember your password, use “Forgot password”.
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
export function CheckoutFormCore({
  companySlug,
  slugOverride,
  onRequestAddService,
  service,
  artist,
  slot,
  onSuccess,
  onBack,
  paymentsEnabled,
  tipEnabled,
  cardOnFileEnabled,
  displayCurrency,
  policy,
  holdMinutes,
  contactEmail,
  contactPhone,
}) {
  const theme = useTheme();
  const accentColor = "var(--page-btn-bg, var(--sched-primary))";
  const accentContrast = "var(--page-btn-color, #ffffff)";
  const borderColor = "var(--page-border-color, rgba(15,23,42,0.12))";
  const checkoutTextColor = "var(--checkout-text-color, var(--page-content-color, #5f4a56))";
  const checkoutHeadingColor = "var(--checkout-heading-color, #5f4a56)";
  const checkoutSectionColor = "var(--checkout-section-color, #5f4a56)";
  const softBg = "var(--page-btn-bg-soft, rgba(15,23,42,0.12))";
  const buttonShadow = "var(--page-btn-shadow, 0 16px 32px rgba(15,23,42,0.16))";
  const buttonShadowHover = "var(--page-btn-shadow-hover, 0 20px 40px rgba(15,23,42,0.2))";
  const focusRingColor = "var(--page-focus-ring, var(--page-btn-bg, var(--sched-primary)))";
  const focusRing = {
    outline: `2px solid ${focusRingColor}`,
    outlineOffset: 2,
  };
  const primaryButtonSx = {
    backgroundColor: accentColor,
    color: accentContrast,
    textTransform: "none",
    fontWeight: 700,
    borderRadius: "var(--page-btn-radius, 12px)",
    boxShadow: buttonShadow,
    "&:hover": {
      backgroundColor: `var(--page-btn-bg-hover, ${accentColor})`,
      color: accentContrast,
      boxShadow: buttonShadowHover,
    },
    "&:focus-visible": focusRing,
  };
  const outlineButtonSx = {
    borderColor: accentColor,
    color: accentColor,
    textTransform: "none",
    fontWeight: 600,
    borderRadius: "var(--page-btn-radius, 12px)",
    "&:hover": {
      backgroundColor: softBg,
      borderColor: accentColor,
      color: accentColor,
    },
    "&:focus-visible": focusRing,
  };
  const textButtonSx = {
    color: accentColor,
    textTransform: "none",
    fontWeight: 600,
    "&:focus-visible": focusRing,
  };
  const infoAlertSx = {
    backgroundColor: softBg,
    color: checkoutTextColor,
    border: `1px solid ${borderColor}`,
    "& .MuiAlert-icon": { color: accentColor },
  };
  const navigate = useNavigate();
  const location = useLocation();

  const basePaymentMode = useMemo(() => {
    const mode = (policy?.mode || "").toLowerCase();
    if (paymentsEnabled) {
      if (mode === "deposit") return "deposit";
      return "pay";
    }
    if (cardOnFileEnabled) return "capture";
    return "off";
  }, [paymentsEnabled, cardOnFileEnabled, policy?.mode]);
  const tipAllowedNow = paymentsEnabled && tipEnabled;

  // Resolve a reliable slug for API calls, even if props/params are missing
  const slugLocal = useMemo(() => {
    const pick = (...cands) => {
      for (const c of cands) {
        if (!c) continue;
        const s = String(c).trim();
        if (!s || s === 'undefined' || s === 'null' || s === '(unknown)') continue;
        return s;
      }
      return null;
    };
    let qsSlug = null;
    try { qsSlug = new URLSearchParams(window.location.search || '').get('site'); } catch {}
    let pathSlug = null;
    try { pathSlug = (window.location.pathname || '').split('/').filter(Boolean)[0] || null; } catch {}
    return pick(slugOverride, companySlug, qsSlug, pathSlug);
  }, [companySlug, slugOverride]);
  const isCustomDomain = getTenantHostMode() === "custom";
  const basePath = isCustomDomain ? "" : `/${slugLocal || ""}`;
  const currencyCode = useMemo(() => (displayCurrency || "USD").toUpperCase(), [displayCurrency]);
  const embedSuffix = useMemo(() => {
    try {
      const qs = new URLSearchParams(location.search || "");
      const keys = ["embed", "mode", "dialog", "primary", "text"];
      const entries = keys
        .map((key) => {
          const val = qs.get(key);
          return val ? [key, val] : null;
        })
        .filter(Boolean);
      if (!entries.length) return "";
      const next = new URLSearchParams();
      entries.forEach(([key, val]) => next.set(key, val));
      const query = next.toString();
      return query ? `?${query}` : "";
    } catch {
      return "";
    }
  }, [location.search]);

  const [client, setClient] = useState(null);
  const [guest, setGuest] = useState({ name: "", email: "" });
  const [productDelivery, setProductDelivery] = useState({
    delivery_method: "",
    pickup_instructions: "",
    shipping: {
      name: "",
      phone: "",
      address1: "",
      address2: "",
      city: "",
      region: "",
      postal_code: "",
      country: "",
      instructions: "",
    },
  });
  const [shippingRates, setShippingRates] = useState({ ...EMPTY_SHIPPING_RATES });
  const [addressVerification, setAddressVerification] = useState({ ...EMPTY_ADDRESS_VERIFICATION });
  const [addressConfirmationChecked, setAddressConfirmationChecked] = useState(false);
  const [deliveryMethodPolicy, setDeliveryMethodPolicy] = useState({
    loading: false,
    source: "default",
    deliveryEnabled: false,
    automationMode: "manual",
    methods: [],
    allowedMethods: [],
    allowedDestinationCountries: [],
    allowedDestinationCountryOptions: [],
    countryCatalog: [],
    addressVerificationEnabled: false,
    internationalAddressVerificationMode: "best_effort",
    originCountry: "",
    ...emptyImportNoticeConfig,
  });
  const [importChargesAcknowledged, setImportChargesAcknowledged] = useState(false);
  const [cart, setCart] = useState([]);
  const [clientPackages, setClientPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [packagesError, setPackagesError] = useState("");

  const [dlgSvcOpen, setDlgSvcOpen] = useState(false);
  const [dlgAddonOpen, setDlgAddonOpen] = useState(false);
  const [activeItemId, setActiveItemId] = useState(null);
  const [addonOpts, setAddonOpts] = useState({});

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(null);

  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [publicUpgradeOpen, setPublicUpgradeOpen] = useState(false);
  const [publicUpgradeMessage, setPublicUpgradeMessage] = useState("");
  const [cardOnFileConsentAccepted, setCardOnFileConsentAccepted] = useState(false);
  const [cardOnFileConsentError, setCardOnFileConsentError] = useState("");
  const lastAckDependencyRef = useRef("");

  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [forgotDialogOpen, setForgotDialogOpen] = useState(false);
  const companyContactEmail = contactEmail || "";
  const companyContactPhone = contactPhone || "";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    (async () => {
      try {
        const { data } = await apiClient.get("/me", { headers: { Authorization: `Bearer ${token}` } });
        if (!data?.email) return;
        setClient(data);
        const full = data.full_name || `${data.first_name || ""} ${data.last_name || ""}`.trim();
        setGuest({ name: full, email: data.email });
      } catch {
        setClient(null);
      }
    })();
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("checkout_product_delivery_prefill");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;
      const parsedShipping = parsed.shipping && typeof parsed.shipping === "object" ? parsed.shipping : {};
      const normalizedPrefillCountry = normalizeDeliveryCountryCode(
        parsedShipping.country || parsed.shipping_country || parsed.country
      );
      setProductDelivery((prev) => ({
        delivery_method: ["pickup", "shipping", "local_delivery"].includes(parsed.delivery_method)
          ? parsed.delivery_method
          : prev.delivery_method,
        pickup_instructions: parsed.pickup_instructions || prev.pickup_instructions || "",
        shipping: {
          ...prev.shipping,
          ...parsedShipping,
          country: normalizedPrefillCountry || prev.shipping.country || "",
        },
      }));
    } catch {
      // ignore parse/storage errors
    }
  }, []);

  useEffect(() => {
    setProductDelivery((prev) => {
      const next = {
        ...prev,
        shipping: {
          ...prev.shipping,
          name: prev.shipping.name || client?.full_name || `${client?.first_name || ""} ${client?.last_name || ""}`.trim(),
          phone: prev.shipping.phone || client?.phone || "",
        },
      };
      return next;
    });
  }, [client?.id, client?.full_name, client?.first_name, client?.last_name, client?.phone]);

  useEffect(() => {
    if (!client?.id) {
      setClientPackages([]);
      setPackagesLoading(false);
      setPackagesError("");
      return;
    }
    let active = true;
    setPackagesLoading(true);
    setPackagesError("");
    apiClient
      .get("/me/packages")
      .then(({ data }) => {
        if (!active) return;
        setClientPackages(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!active) return;
        setPackagesError("Unable to load packages.");
        setClientPackages([]);
      })
      .finally(() => {
        if (!active) return;
        setPackagesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [client?.id]);

  useEffect(() => {
    const saved = loadCart();
    let mutated = false;
    const normalized = saved.map((item) => {
      if (isProduct(item) || isPackage(item) || item?.hold_started_at) return item;
      mutated = true;
      return { ...item, hold_started_at: new Date().toISOString() };
    });
    if (mutated) {
      saveCart(normalized);
    }
    setCart(normalized);
  }, []);

  useEffect(() => {
    if (!service || !slot) return;
    const saved = loadCart();
    const hasProducts = saved.some((item) => (item?.type || CartTypes.SERVICE) === CartTypes.PRODUCT);
    if (hasProducts) {
      setErr("Please complete or clear your product purchase before booking a service.");
      setCart(saved);
      return;
    }

    const newItem = {
      id: `${service.id}-${slot.date}-${slot.start_time}`,
      type: CartTypes.SERVICE,
      service_id: service.id,
      service_name: service.name,
      price: Number(service.base_price ?? 0),
      allow_packages: Boolean(service.allow_packages),
      artist_name: artist?.full_name || artist?.name || "Provider",
      artist_id: artist?.id,
      date: slot.date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      addon_ids: slot.addon_ids || [],
      addons: slot.addons || [],
      couponApplied: false,
      coupon: null,
      tip_mode: "percent",
      tip_value: 0,
      tip_amount: 0,
      quantity: 1,
      hold_started_at: new Date().toISOString(),
    };

    const merged = [...saved.filter((i) => i.id !== newItem.id), newItem];
    saveCart(merged);
    setCart(merged);
  }, [service, artist, slot]);

  useEffect(() => {
    const svcIds = [...new Set(cart.map((c) => c.service_id))];
    const base =
      !API_BASE_URL || API_BASE_URL === "/"
        ? ""
        : String(API_BASE_URL).replace(/\/$/, "");
    const buildAddonImageUrl = (img) => {
      if (!img || typeof img !== "object") return null;
      if (img.url_public) return img.url_public;
      if (img.external_url) return img.external_url;
      if (img.id == null) return null;
      return `${base}/public/addon-images/${img.id}`;
    };

    svcIds.forEach(async (sid) => {
      if (addonOpts[sid]) return;
      try {
        if (!slugLocal) return;
        const { data } = await apiClient.get(`/public/${slugLocal}/service/${sid}/addons`);
        const normalized = Array.isArray(data)
          ? data.map((addon) => ({
              ...addon,
              images: Array.isArray(addon?.images)
                ? addon.images.map((img) => ({
                    ...img,
                    url_public: buildAddonImageUrl(img),
                  }))
                : [],
            }))
          : [];
        setAddonOpts((prev) => ({ ...prev, [sid]: normalized }));
      } catch { /* ignore */ }
    });
  }, [cart, slugLocal, addonOpts]);

  const ensureArray = (value) => (Array.isArray(value) ? value : []);
  const getAddons = (item) => ensureArray(item?.addons);
  const getAddonIds = (item) => ensureArray(item?.addon_ids);

  const getQuantity = (item) => Math.max(1, Number(item?.quantity || 1));
  const isProduct = (item) => (item?.type || CartTypes.SERVICE) === CartTypes.PRODUCT;
  const isPackage = (item) => (item?.type || CartTypes.SERVICE) === CartTypes.PACKAGE;
  const isPackageActive = (pkg) => {
    const remaining = Number(pkg?.remaining ?? 0);
    if (!Number.isFinite(remaining) || remaining <= 0) return false;
    const expiresAt = pkg?.expires_at || pkg?.expiresAt;
    if (!expiresAt) return true;
    const ts = Date.parse(expiresAt);
    if (!Number.isFinite(ts)) return true;
    return ts > Date.now();
  };
  const packagesForService = (serviceId) =>
    clientPackages.filter((pkg) => {
      const svcId =
        pkg?.template?.service_id ??
        pkg?.package_template?.service_id ??
        pkg?.service_id;
      return Number(svcId) === Number(serviceId) && isPackageActive(pkg);
    });

  const lineSubtotal = (item) => {
    if (isProduct(item)) {
      return Number(item.price || 0) * getQuantity(item);
    }
    if (isPackage(item)) {
      return Number(item.price || 0) * getQuantity(item);
    }
    const base = item.client_package_id ? 0 : Number(item.price || 0);
    return base + getAddons(item).reduce((s, a) => s + Number(a.base_price || 0), 0);
  };

  const lineDiscount = (item) => {
    if (isProduct(item) || isPackage(item)) return 0;
    if (item.client_package_id) return 0;
    if (!item.couponApplied || !item.coupon) return 0;
    const base = lineSubtotal(item);
    if (item.coupon.discount_percent != null && Number(item.coupon.discount_percent) > 0) {
      return (Number(item.coupon.discount_percent) / 100) * base;
    }
    if (item.coupon.discount_fixed != null && Number(item.coupon.discount_fixed) > 0) {
      return Math.min(Number(item.coupon.discount_fixed), base);
    }
    return 0;
  };

  const recomputeTip = (item) => {
    if (isProduct(item) || isPackage(item)) return { ...item };
    const i = { ...item };
    if (i.tip_mode === "percent") {
      i.tip_amount = Math.max(0, (Number(i.tip_value || 0) / 100) * lineSubtotal(i));
    }
    return i;
  };

  const serviceItems = useMemo(
    () => cart.filter((item) => !isProduct(item) && !isPackage(item)),
    [cart]
  );
  const productItems = useMemo(
    () => cart.filter((item) => isProduct(item)),
    [cart]
  );
  const packageItems = useMemo(
    () => cart.filter((item) => isPackage(item)),
    [cart]
  );
  const selectedShippingRateSnapshot = useMemo(() => {
    if (!shippingRates?.selectedRateId) return null;
    const selected = (shippingRates?.rates || []).find(
      (rate) => String(rate?.rate_id || rate?.id || "") === String(shippingRates.selectedRateId)
    );
    return selected || null;
  }, [shippingRates]);
  useEffect(() => {
    if (!slugLocal || productItems.length === 0) {
      setDeliveryMethodPolicy({
        loading: false,
        source: "default",
        deliveryEnabled: false,
        automationMode: "manual",
        methods: [],
        allowedMethods: [],
        allowedDestinationCountries: [],
        allowedDestinationCountryOptions: [],
        countryCatalog: [],
        addressVerificationEnabled: false,
        internationalAddressVerificationMode: "best_effort",
        originCountry: "",
        ...emptyImportNoticeConfig,
      });
      return;
    }
    let cancelled = false;
    setDeliveryMethodPolicy((prev) => ({ ...prev, loading: true }));
    apiClient
      .get(`/public/${slugLocal}/delivery-methods`)
      .then(({ data }) => {
        if (cancelled) return;
        const methods = Array.isArray(data?.methods)
          ? data.methods
              .filter((row) => row && ["pickup", "shipping", "local_delivery"].includes(String(row.code)))
              .map((row) => ({
                code: String(row.code),
                label: String(row.label || row.code),
                enabled: row.enabled !== false,
              }))
          : [];
        const allowedMethods = Array.isArray(data?.effective_method_codes)
          ? data.effective_method_codes.filter((m) => ["pickup", "shipping", "local_delivery"].includes(String(m)))
          : Array.isArray(data?.allowed_methods)
            ? data.allowed_methods.filter((m) => ["pickup", "shipping", "local_delivery"].includes(String(m)))
            : [];
        const normalizedMethods = methods.length > 0
          ? methods
          : allowedMethods.map((code) => ({
              code,
              label: code === "pickup" ? "Pickup" : code === "shipping" ? "Shipping" : "Local delivery",
              enabled: true,
            }));
        const allowedDestinationCountries = Array.isArray(data?.allowed_destination_countries)
          ? data.allowed_destination_countries
              .map((country) => normalizeDeliveryCountryCode(country))
              .filter(Boolean)
          : [];
        const allowedDestinationCountryOptions = Array.isArray(data?.allowed_destination_country_options)
          ? data.allowed_destination_country_options
              .filter((row) => row && row.code)
              .map((row) => ({
                code: normalizeDeliveryCountryCode(row.code),
                label: row.label || normalizeDeliveryCountryCode(row.code),
              }))
              .filter((row) => row.code)
          : [];
        const countryCatalog = Array.isArray(data?.country_catalog)
          ? data.country_catalog
              .filter((row) => row && row.code)
              .map((row) => ({
                code: normalizeDeliveryCountryCode(row.code),
                label: row.label || normalizeDeliveryCountryCode(row.code),
              }))
              .filter((row) => row.code)
          : [];
        setDeliveryMethodPolicy({
          loading: false,
          source: "api",
          deliveryEnabled: Boolean(data?.delivery_enabled),
          automationMode: String(data?.automation_mode || "manual"),
          methods: normalizedMethods,
          allowedMethods,
          allowedDestinationCountries,
          allowedDestinationCountryOptions,
          countryCatalog,
          addressVerificationEnabled: Boolean(data?.address_verification_enabled),
          internationalAddressVerificationMode: String(data?.international_address_verification_mode || "best_effort"),
          originCountry: normalizeDeliveryCountryCode(data?.origin_country || ""),
          internationalDutiesPolicy: String(data?.international_duties_policy || "").trim(),
          dutiesIncluded: Boolean(data?.duties_included),
          importChargesNoticeVersion: String(data?.import_charges_notice_version || "").trim(),
          importChargesNoticeSnapshot:
            data?.import_charges_notice_snapshot && typeof data.import_charges_notice_snapshot === "object"
              ? data.import_charges_notice_snapshot
              : null,
          requireImportChargesAcknowledgement: Boolean(data?.require_import_charges_acknowledgement),
        });
      })
      .catch(() => {
        if (cancelled) return;
        setDeliveryMethodPolicy({
          loading: false,
          source: "fallback",
          deliveryEnabled: false,
          automationMode: "manual",
          methods: [],
          allowedMethods: [],
          allowedDestinationCountries: [],
          allowedDestinationCountryOptions: [],
          countryCatalog: [],
          addressVerificationEnabled: false,
          internationalAddressVerificationMode: "best_effort",
          originCountry: "",
          ...emptyImportNoticeConfig,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [slugLocal, productItems.length]);

  const serviceSubtotal = serviceItems.reduce((sum, item) => sum + lineSubtotal(item), 0);
  const productSubtotal = productItems.reduce((sum, item) => sum + lineSubtotal(item), 0);
  const packageSubtotal = packageItems.reduce((sum, item) => sum + lineSubtotal(item), 0);
  const totalDiscount = serviceItems.reduce((sum, item) => sum + lineDiscount(item), 0);

  const totalTip = tipAllowedNow
    ? serviceItems.reduce((sum, item) => sum + Number(item.tip_amount || 0), 0)
    : 0;
  const shippingRateTotal =
    productItems.length > 0 && selectedShippingRateSnapshot?.amount != null
      ? Number(selectedShippingRateSnapshot.amount || 0)
      : 0;

  const totalBeforeDiscount = serviceSubtotal + productSubtotal + packageSubtotal;
  const finalTotal =
    Math.max(0, serviceSubtotal - totalDiscount) +
    totalTip +
    productSubtotal +
    packageSubtotal +
    shippingRateTotal;
  const hasPackageRedemptions = serviceItems.some((item) => Boolean(item.client_package_id));
  const packageOnlyTotal = hasPackageRedemptions && productItems.length === 0 && finalTotal <= 0;
  const hasPackagePurchase = packageItems.length > 0;
  const effectivePaymentMode = useMemo(() => {
    if (productItems.length > 0 || packageItems.length > 0) {
      return paymentsEnabled ? "pay" : "off";
    }
    return basePaymentMode;
  }, [productItems.length, packageItems.length, paymentsEnabled, basePaymentMode]);
  const showCaptureOption = effectivePaymentMode === "capture";
  const showPayOption = effectivePaymentMode === "pay" || effectivePaymentMode === "deposit";
  const showOnlinePayment = effectivePaymentMode !== "off";
  const payButtonLabel = (() => {
    if (productItems.length > 0 || packageItems.length > 0) return "Pay now";
    if (effectivePaymentMode === "deposit") return "Pay Deposit & Book";
    return "Pay & Book";
  })();
  const bookButtonLabel = productItems.length > 0 && serviceItems.length === 0
    ? "Place order"
    : "Book";

  const [holdState, setHoldState] = useState({ overall: null, perItem: {} });

  useEffect(() => {
    if (!holdMinutes || holdMinutes <= 0 || serviceItems.length === 0) {
      setHoldState({ overall: null, perItem: {} });
      return;
    }

    let cancelled = false;

    const runTick = () => {
      const now = Date.now();
      const perItem = {};
      const expiredIds = [];
      let minPositive = null;

      serviceItems.forEach((item) => {
        const started = Date.parse(item?.hold_started_at);
        if (!Number.isFinite(started)) return;
        const remaining = started + holdMinutes * 60 * 1000 - now;
        perItem[item.id] = remaining;
        if (remaining <= 0) {
          expiredIds.push(item.id);
        } else {
          minPositive = minPositive === null ? remaining : Math.min(minPositive, remaining);
        }
      });

      if (expiredIds.length && !cancelled) {
        const filtered = cart.filter((item) => !expiredIds.includes(item.id));
        if (filtered.length !== cart.length) {
          persist(filtered);
          setErr("The hold window expired. Please reselect your service time before checking out.");
          const hasRemainingServices = filtered.some((item) => !isProduct(item));
          if (!hasRemainingServices && slugLocal) {
            releasePendingCheckout({ slug: slugLocal }).catch(() => {});
          }
        }
      }

      if (!cancelled) {
        const overall =
          minPositive !== null
            ? Math.max(0, minPositive)
            : Object.keys(perItem).length
            ? 0
            : null;
        setHoldState({ overall, perItem });
      }

      return expiredIds.length === 0 && minPositive !== null;
    };

    const keepRunning = runTick();
    if (!keepRunning) {
      return;
    }

    const timer = setInterval(() => {
      const active = runTick();
      if (!active) {
        clearInterval(timer);
      }
    }, 1000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [holdMinutes, serviceItems, cart, slugLocal]);

  const formatHoldCountdown = (ms) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const persist = (newCart) => {
    saveCart(newCart);
    setCart(newCart);
  };

  const resetShippingVerificationState = () => {
    setAddressVerification({ ...EMPTY_ADDRESS_VERIFICATION });
    setAddressConfirmationChecked(false);
  };

  const clearShippingRatesState = () => {
    setShippingRates({ ...EMPTY_SHIPPING_RATES });
  };

  const removeItem = (id) => {
    const newCart = cart.filter((c) => c.id !== id);
    const hasRemainingServices = newCart.some((item) => !isProduct(item) && !isPackage(item));
    setLoading(false);
    setErr("");
    persist(newCart);
    if (!hasRemainingServices && slugLocal) {
      releasePendingCheckout({ slug: slugLocal }).catch(() => {});
    }
    if (newCart.length === 0) {
      onRequestAddService?.();
    }
  };

  const updatePackageQuantity = (id, nextQuantity) => {
    const quantity = Math.max(1, Number(nextQuantity || 1));
    const newCart = cart.map((item) =>
      item.id === id && isPackage(item) ? { ...item, quantity } : item
    );
    persist(newCart);
  };

  const guestOk =
    guest.name.trim() && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(guest.email.trim());
  const allowedDeliveryMethods = useMemo(() => {
    if (productItems.length === 0) return [];
    let allowed = Array.isArray(deliveryMethodPolicy.allowedMethods)
      ? [...deliveryMethodPolicy.allowedMethods]
      : [];
    allowed = allowed.filter((m) => ["pickup", "shipping", "local_delivery"].includes(m));
    for (const item of productItems) {
      if (!item?.delivery_methods_override_enabled) continue;
      const itemAllowed = [];
      if (item.delivery_allow_pickup) itemAllowed.push("pickup");
      if (item.delivery_allow_shipping) itemAllowed.push("shipping");
      if (item.delivery_allow_local_delivery) itemAllowed.push("local_delivery");
      allowed = allowed.filter((method) => itemAllowed.includes(method));
    }
    return Array.from(new Set(allowed));
  }, [productItems, deliveryMethodPolicy.allowedMethods, deliveryMethodPolicy.source]);
  const deliveryMethodOptions = useMemo(() => {
    const labelsFromApi = new Map(
      (Array.isArray(deliveryMethodPolicy.methods) ? deliveryMethodPolicy.methods : []).map((row) => [
        row.code,
        row.label || row.code,
      ])
    );
    return allowedDeliveryMethods.map((value) => [
      value,
      labelsFromApi.get(value) || (
        value === "pickup"
          ? "Pickup"
          : value === "shipping"
            ? "Shipping"
            : "Local delivery"
      ),
    ]);
  }, [allowedDeliveryMethods, deliveryMethodPolicy.methods]);
  const policyIsApiLoadedEmpty =
    productItems.length > 0 &&
    deliveryMethodPolicy.source === "api" &&
    allowedDeliveryMethods.length === 0;
  const safeDeliveryMethodValue = allowedDeliveryMethods.includes(String(productDelivery.delivery_method || "").toLowerCase())
    ? productDelivery.delivery_method || ""
    : "";
  useEffect(() => {
    if (productItems.length === 0) return;
    if (allowedDeliveryMethods.length === 0) return;
    const current = String(productDelivery.delivery_method || "").toLowerCase();
    if (allowedDeliveryMethods.includes(current)) return;
    const fallback = allowedDeliveryMethods.length === 1 ? (deliveryMethodOptions[0]?.[0] || "") : "";
    setProductDelivery((prev) => ({ ...prev, delivery_method: fallback }));
  }, [productItems.length, productDelivery.delivery_method, allowedDeliveryMethods, deliveryMethodOptions]);

  const requiresShippingAddress =
    productItems.length > 0 &&
    allowedDeliveryMethods.length > 0 &&
    ["shipping", "local_delivery"].includes((productDelivery.delivery_method || "").toLowerCase());
  const currentShippingCountry = normalizeDeliveryCountryCode(productDelivery.shipping?.country || "");
  const isDomesticVerificationCountry = ["CA", "US"].includes(currentShippingCountry);
  const shippingRegionRequired = currentShippingCountry === "CA" || currentShippingCountry === "US";
  const shippingPostalRequired = currentShippingCountry === "CA" || currentShippingCountry === "US";
  const verificationEnabled =
    requiresShippingAddress &&
    (productDelivery.delivery_method || "").toLowerCase() === "shipping" &&
    (
      (isDomesticVerificationCountry && Boolean(deliveryMethodPolicy.addressVerificationEnabled)) ||
      (!isDomesticVerificationCountry && ["best_effort", "required", "disabled"].includes(String(deliveryMethodPolicy.internationalAddressVerificationMode || "")))
    );
  const hasAcceptedShippingVerification = !verificationEnabled || addressVerification.status === "verified";
  const deliveryErrors = useMemo(() => {
    if (productItems.length === 0) return [];
    const errors = [];
    if (!allowedDeliveryMethods.length) {
      errors.push("This Product is not currently available for delivery or pickup.");
      return errors;
    }
    if (allowedDeliveryMethods.length > 1 && !String(productDelivery.delivery_method || "").trim()) {
      errors.push("Choose how you would like to receive your order.");
      return errors;
    }
    const shipping = productDelivery.shipping || {};
    if (requiresShippingAddress) {
      const countryCode = normalizeDeliveryCountryCode(shipping.country);
      const required = [
        ["name", "Full name"],
        ["phone", "Phone"],
        ["address1", "Address line 1"],
        ["city", "City"],
        ["country", "Country"],
      ];
      if (countryCode === "CA" || countryCode === "US") {
        required.push(["region", "State/Province/Region"]);
        required.push(["postal_code", "Postal/ZIP code"]);
      }
      required.forEach(([field, label]) => {
        if (!String(shipping[field] || "").trim()) errors.push(`${label} is required for shipping.`);
      });
      const postalCode = String(shipping.postal_code || "").trim();
      const allowedDestinationCountries = Array.isArray(deliveryMethodPolicy.allowedDestinationCountries)
        ? deliveryMethodPolicy.allowedDestinationCountries
        : [];
      if (countryCode && allowedDestinationCountries.length > 0 && !allowedDestinationCountries.includes(countryCode)) {
        errors.push("Shipping is not currently available to this destination.");
      }
      if (countryCode === "CA" && postalCode && !/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(postalCode)) {
        errors.push("Enter a valid Canadian postal code.");
      }
      if (countryCode === "US" && postalCode && !/^\d{5}(-\d{4})?$/.test(postalCode)) {
        errors.push("Enter a valid US ZIP code.");
      }
    }
    return errors;
  }, [productItems.length, productDelivery, requiresShippingAddress, allowedDeliveryMethods, deliveryMethodPolicy.allowedDestinationCountries]);

  const deliveryCountryOptions = useMemo(() => {
    const countries = Array.isArray(deliveryMethodPolicy.allowedDestinationCountryOptions) &&
      deliveryMethodPolicy.allowedDestinationCountryOptions.length > 0
      ? deliveryMethodPolicy.allowedDestinationCountryOptions
      : Array.isArray(deliveryMethodPolicy.allowedDestinationCountries)
        ? deliveryMethodPolicy.allowedDestinationCountries.map((code) => ({
            code,
            label: FALLBACK_COUNTRY_LABELS[code] || code,
          }))
        : [];
    return countries.map((country) => ({
      code: normalizeDeliveryCountryCode(country.code),
      label: country.label || FALLBACK_COUNTRY_LABELS[country.code] || country.code,
    })).filter((country) => country.code);
  }, [deliveryMethodPolicy.allowedDestinationCountries, deliveryMethodPolicy.allowedDestinationCountryOptions]);
  const isCrossBorderShipping = useMemo(() => {
    if (!requiresShippingAddress) return false;
    const origin = normalizeDeliveryCountryCode(deliveryMethodPolicy.originCountry || "");
    const destination = currentShippingCountry;
    if (!origin || !destination) return false;
    return origin !== destination;
  }, [requiresShippingAddress, deliveryMethodPolicy.originCountry, currentShippingCountry]);
  const currentImportChargesNotice = useMemo(
    () => shippingRates.importChargesNoticeSnapshot || deliveryMethodPolicy.importChargesNoticeSnapshot || null,
    [shippingRates.importChargesNoticeSnapshot, deliveryMethodPolicy.importChargesNoticeSnapshot]
  );
  const requireImportChargesAcknowledgement = Boolean(
    isCrossBorderShipping &&
      (shippingRates.requireImportChargesAcknowledgement ||
        deliveryMethodPolicy.requireImportChargesAcknowledgement)
  );
  const importChargesNoticeVersion = String(
    shippingRates.importChargesNoticeVersion ||
      deliveryMethodPolicy.importChargesNoticeVersion ||
      currentImportChargesNotice?.version ||
      ""
  ).trim();
  const importChargesAcknowledgementQuotePublicId = String(
    selectedShippingRateSnapshot?.quote_public_id || ""
  ).trim();
  const importChargesAcknowledgementCustomsHash = String(
    selectedShippingRateSnapshot?.customs_snapshot_hash || ""
  ).trim();
  const productCartFingerprintValue = useMemo(() => {
    const rows = productItems
      .map((item) => ({
        product_id: Number(item.product_id ?? String(item.id).replace(/^product-/, "")),
        quantity: getQuantity(item),
      }))
      .filter((row) => Number.isFinite(row.product_id) && row.product_id > 0 && row.quantity > 0)
      .sort((a, b) => (a.product_id - b.product_id) || (a.quantity - b.quantity));
    return JSON.stringify(rows);
  }, [productItems]);
  const currentDeliveryCountryValue = useMemo(() => {
    const current = normalizeDeliveryCountryCode(productDelivery.shipping?.country);
    if (!current) return "";
    if (!deliveryCountryOptions.length) return "";
    return deliveryCountryOptions.some((country) => country.code === current) ? current : "";
  }, [deliveryCountryOptions, productDelivery.shipping?.country]);
  useEffect(() => {
    if (!requiresShippingAddress) return;
    if (!deliveryCountryOptions.length) return;
    const current = normalizeDeliveryCountryCode(productDelivery.shipping?.country);
    if (current && deliveryCountryOptions.some((country) => country.code === current)) return;
    const fallback = deliveryCountryOptions[0]?.code || "";
    if (!fallback) return;
    setProductDelivery((prev) => ({
      ...prev,
      shipping: {
        ...(prev.shipping || {}),
        country: fallback,
      },
    }));
  }, [requiresShippingAddress, deliveryCountryOptions, productDelivery.shipping?.country]);
  const deliveryOk = deliveryErrors.length === 0;

  useEffect(() => {
    const dependency = [
      currentShippingCountry,
      productCartFingerprintValue,
      shippingRates.quoteToken || "",
      importChargesAcknowledgementCustomsHash,
    ].join("|");
    if (!lastAckDependencyRef.current) {
      lastAckDependencyRef.current = dependency;
      return;
    }
    if (lastAckDependencyRef.current !== dependency) {
      lastAckDependencyRef.current = dependency;
      setImportChargesAcknowledged(false);
    }
  }, [
    currentShippingCountry,
    productCartFingerprintValue,
    shippingRates.quoteToken,
    importChargesAcknowledgementCustomsHash,
  ]);

  useEffect(() => {
    if (
      productItems.length === 0 ||
      deliveryMethodPolicy.loading ||
      deliveryMethodPolicy.source === "default" ||
      !requiresShippingAddress ||
      !deliveryOk ||
      !slugLocal ||
      (verificationEnabled && !hasAcceptedShippingVerification)
    ) {
      setShippingRates((prev) => ({ ...EMPTY_SHIPPING_RATES, selectedRateId: prev?.selectedRateId || "" }));
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setShippingRates((prev) => ({ ...prev, loading: true, message: "" }));
        const selectedDeliveryMethod = productDelivery.delivery_method || deliveryMethodOptions[0]?.[0] || "";
        const payload = {
          delivery_method: selectedDeliveryMethod,
          shipping: {
            name: productDelivery.shipping?.name || "",
            phone: productDelivery.shipping?.phone || "",
            address1: productDelivery.shipping?.address1 || "",
            address2: productDelivery.shipping?.address2 || "",
            city: productDelivery.shipping?.city || "",
            region: productDelivery.shipping?.region || "",
            postal_code: productDelivery.shipping?.postal_code || "",
            country: normalizeDeliveryCountryCode(productDelivery.shipping?.country || ""),
            instructions: productDelivery.shipping?.instructions || "",
          },
          items: productItems.map((item) => ({
            product_id: Number(item.product_id ?? String(item.id).replace(/^product-/, "")),
            quantity: getQuantity(item),
          })),
        };
        if (verificationEnabled && hasAcceptedShippingVerification && addressVerification.token) {
          payload.shipping_address_verification_token = addressVerification.token;
        }
        const { data } = await apiClient.post(`/public/${slugLocal}/shipping/rates`, payload);
        if (cancelled) return;
        const rates = Array.isArray(data?.rates) ? data.rates : [];
        const defaultRateId =
          data?.default_rate_id || (rates[0] && (rates[0].rate_id || rates[0].id)) || "";
        setShippingRates((prev) => {
          const priorSelected = prev?.selectedRateId || "";
          const stillExists = rates.some((rate) => String(rate?.rate_id || rate?.id || "") === String(priorSelected));
          return {
            loading: false,
            available: Boolean(data?.available) && rates.length > 0,
            fallbackManual: Boolean(data?.fallback_manual),
            message: data?.message || "",
            rates,
            selectedRateId: stillExists ? priorSelected : String(defaultRateId || ""),
            quoteToken: data?.shipping_rate_quote_token || "",
            quoteExpiresAt: data?.quote_expires_at || "",
            dutiesIncluded: Boolean(data?.duties_included),
            importChargesNoticeVersion: String(data?.import_charges_notice_version || "").trim(),
            importChargesNoticeSnapshot:
              data?.import_charges_notice_snapshot && typeof data.import_charges_notice_snapshot === "object"
                ? data.import_charges_notice_snapshot
                : null,
            requireImportChargesAcknowledgement: Boolean(data?.require_import_charges_acknowledgement),
            incompatibleItems: Array.isArray(data?.incompatible_items) ? data.incompatible_items : [],
          };
        });
      } catch (error) {
        if (cancelled) return;
        const message = error?.response?.data?.message || error?.response?.data?.error || "Live rates unavailable. You can continue with manual shipping.";
        setShippingRates({
          loading: false,
          available: false,
          fallbackManual: Boolean(error?.response?.data?.fallback_manual),
          message,
          rates: [],
          selectedRateId: "",
          quoteToken: "",
          quoteExpiresAt: "",
          dutiesIncluded: false,
          importChargesNoticeVersion: "",
          importChargesNoticeSnapshot: null,
          requireImportChargesAcknowledgement: false,
          incompatibleItems: Array.isArray(error?.response?.data?.incompatible_items)
            ? error.response.data.incompatible_items
            : [],
        });
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    productItems,
    deliveryMethodPolicy.loading,
    deliveryMethodPolicy.source,
    requiresShippingAddress,
    deliveryOk,
    slugLocal,
    productDelivery.delivery_method,
    deliveryMethodOptions,
    productDelivery.shipping?.name,
    productDelivery.shipping?.phone,
    productDelivery.shipping?.address1,
    productDelivery.shipping?.address2,
    productDelivery.shipping?.city,
    productDelivery.shipping?.region,
    productDelivery.shipping?.postal_code,
    productDelivery.shipping?.country,
    productDelivery.shipping?.instructions,
    verificationEnabled,
    hasAcceptedShippingVerification,
    addressVerification.token,
  ]);

  const persistDeliveryPrefill = () => {
    try {
      localStorage.setItem(
        "checkout_product_delivery_prefill",
        JSON.stringify({
          delivery_method: productDelivery.delivery_method || "",
          pickup_instructions: productDelivery.pickup_instructions || "",
          shipping: productDelivery.shipping || {},
        })
      );
    } catch {
      // ignore
    }
  };

  const ensureProductDeliveryValid = () => {
    if (productItems.length === 0) return true;
    if (!deliveryOk) {
      setErr(deliveryErrors[0] || "Please complete delivery details.");
      return false;
    }
    if (
      requiresShippingAddress &&
      verificationEnabled &&
      !hasAcceptedShippingVerification
    ) {
      setErr("Verify the delivery address before continuing.");
      return false;
    }
    if (
      requiresShippingAddress &&
      shippingRates.available &&
      Array.isArray(shippingRates.rates) &&
      shippingRates.rates.length > 0 &&
      !shippingRates.selectedRateId
    ) {
      setErr("Please select a shipping option.");
      return false;
    }
    if (
      requiresShippingAddress &&
      shippingRates.quoteExpiresAt &&
      new Date(shippingRates.quoteExpiresAt).getTime() <= Date.now()
    ) {
      setErr("Your shipping quote expired. Refresh rates and select a current shipping option.");
      return false;
    }
    if (
      requiresShippingAddress &&
      isCrossBorderShipping &&
      requireImportChargesAcknowledgement &&
      !importChargesAcknowledged
    ) {
      setErr("Please acknowledge that import charges may be collected separately before continuing.");
      return false;
    }
    return true;
  };

  const handleDeliveryMethod = (event) => {
    const value = String(event.target.value || "pickup").toLowerCase();
    setProductDelivery((prev) => ({
      ...prev,
      delivery_method: allowedDeliveryMethods.includes(value)
        ? value
        : (allowedDeliveryMethods.length === 1 ? (deliveryMethodOptions[0]?.[0] || "") : ""),
    }));
    clearShippingRatesState();
    resetShippingVerificationState();
    setImportChargesAcknowledged(false);
  };

  const handleShippingField = (field) => (event) => {
    const value = field === "country"
      ? normalizeDeliveryCountryCode(event.target.value)
      : event.target.value;
    setProductDelivery((prev) => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        [field]: value,
      },
    }));
    clearShippingRatesState();
    resetShippingVerificationState();
    setImportChargesAcknowledged(false);
  };

  const verifyAddressForShipping = async () => {
    if (!slugLocal || !verificationEnabled || addressVerification.loading) return;
    const shippingPayload = {
      address1: productDelivery.shipping?.address1 || "",
      address2: productDelivery.shipping?.address2 || "",
      city: productDelivery.shipping?.city || "",
      region: productDelivery.shipping?.region || "",
      postal_code: productDelivery.shipping?.postal_code || "",
      country: normalizeDeliveryCountryCode(productDelivery.shipping?.country || ""),
    };
    setErr("");
    clearShippingRatesState();
    setAddressVerification((prev) => ({ ...prev, loading: true, messages: [] }));
    try {
      const { data } = await apiClient.post(`/public/${slugLocal}/shipping/verify-address`, {
        shipping: shippingPayload,
      });
      const status = String(data?.status || "idle");
      if (status === "verified") {
        const acceptedAddress = data?.accepted_address || shippingPayload;
        setProductDelivery((prev) => ({
          ...prev,
          shipping: {
            ...prev.shipping,
            ...acceptedAddress,
          },
        }));
        setAddressVerification({
          loading: false,
          status,
          token: data?.verification_token || "",
          acceptedAddress,
          originalAddress: null,
          suggestedAddress: null,
          differences: [],
          messages: Array.isArray(data?.messages) ? data.messages : [],
          retryable: false,
          residential: data?.residential ?? null,
          verificationLevel: String(data?.verification_level || "provider_verified"),
        });
        return;
      }
      if (status === "corrected") {
        setAddressVerification({
          loading: false,
          status,
          token: data?.verification_token || "",
          acceptedAddress: null,
          originalAddress: data?.original_address || shippingPayload,
          suggestedAddress: data?.suggested_address || null,
          differences: Array.isArray(data?.differences) ? data.differences : [],
          messages: Array.isArray(data?.messages) ? data.messages : [],
          retryable: false,
          residential: data?.residential ?? null,
          verificationLevel: String(data?.verification_level || "provider_corrected"),
        });
        return;
      }
      if (status === "customer_confirmation_required") {
        const acceptedAddress = data?.accepted_address || shippingPayload;
        setAddressVerification({
          loading: false,
          status,
          token: data?.verification_token || "",
          acceptedAddress,
          originalAddress: acceptedAddress,
          suggestedAddress: null,
          differences: [],
          messages: Array.isArray(data?.messages) ? data.messages : [],
          retryable: false,
          residential: data?.residential ?? null,
          verificationLevel: String(data?.verification_level || ""),
        });
        return;
      }
      setAddressVerification({
        loading: false,
        status,
        token: "",
        acceptedAddress: null,
        originalAddress: data?.original_address || null,
        suggestedAddress: data?.suggested_address || null,
        differences: [],
        messages: Array.isArray(data?.messages) ? data.messages : [],
        retryable: Boolean(data?.retryable),
        residential: data?.residential ?? null,
        verificationLevel: "",
      });
    } catch (error) {
      const message = error?.response?.data?.message || error?.response?.data?.error || "Address verification is temporarily unavailable. Please try again.";
      setAddressVerification({
        loading: false,
        status: "provider_unavailable",
        token: "",
        acceptedAddress: null,
        originalAddress: null,
        suggestedAddress: null,
        differences: [],
        messages: [message],
        retryable: true,
        residential: null,
        verificationLevel: "",
      });
    }
  };

  const acceptVerifiedAddress = async (choice) => {
    if (!slugLocal || !addressVerification.token || addressVerification.loading) return;
    setErr("");
    clearShippingRatesState();
    setAddressVerification((prev) => ({ ...prev, loading: true }));
    try {
      const { data } = await apiClient.post(`/public/${slugLocal}/shipping/accept-address`, {
        verification_token: addressVerification.token,
        choice,
      });
      const acceptedAddress = data?.accepted_address || {};
      setProductDelivery((prev) => ({
        ...prev,
        shipping: {
          ...prev.shipping,
          ...acceptedAddress,
        },
      }));
      setAddressVerification({
        loading: false,
        status: "verified",
        token: data?.verification_token || "",
        acceptedAddress,
        originalAddress: null,
        suggestedAddress: null,
        differences: [],
        messages: Array.isArray(data?.messages) ? data.messages : [],
        retryable: false,
        residential: data?.residential ?? null,
        verificationLevel: String(data?.verification_level || addressVerification.verificationLevel || ""),
      });
    } catch (error) {
      const message = error?.response?.data?.message || error?.response?.data?.error || "Unable to accept the verified address.";
      setAddressVerification((prev) => ({
        ...prev,
        loading: false,
        messages: [message],
      }));
    }
  };

  const handleGuest = (e) => setGuest({ ...guest, [e.target.name]: e.target.value });

  const openAddons = () => {
    if (serviceItems.length === 0) return;
    if (serviceItems.length === 1) {
      setActiveItemId(serviceItems[0].id);
      setDlgAddonOpen(true);
    } else {
      setDlgSvcOpen(true);
    }
  };

  const pickService = (id) => {
    setActiveItemId(id);
    setDlgSvcOpen(false);
    setDlgAddonOpen(true);
  };

  const activeItem = serviceItems.find((c) => c.id === activeItemId);

  const toggleAddon = (addon) => {
    if (!activeItem) return;
    const updatedCart = cart.map((c) => {
      if (c.id !== activeItem.id) return c;
      const existingIds = getAddonIds(c);
      const existingAddons = getAddons(c);
      const has = existingIds.includes(addon.id);
      const updated = {
        ...c,
        addon_ids: has ? existingIds.filter((a) => a !== addon.id) : [...existingIds, addon.id],
        addons: has ? existingAddons.filter((a) => a.id !== addon.id) : [...existingAddons, addon],
      };
      return updated.tip_mode === "percent" ? recomputeTip(updated) : updated;
    });
    persist(updatedCart);
    setActiveItemId(activeItem.id);
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }
    setCouponError("");
    try {
      const updatedCart = await Promise.all(
        cart.map(async (item) => {
          if (isProduct(item) || isPackage(item) || item.client_package_id) return item;
          try {
            const { data } = await apiClient.post(`/booking/coupons/validate`, {
              code: couponCode.trim(),
              service_id: item.service_id,
            });
            if (data.valid) {
              const withCoupon = { ...item, couponApplied: true, coupon: data.coupon };
              return withCoupon.tip_mode === "percent" ? recomputeTip(withCoupon) : withCoupon;
            } else {
              const cleared = { ...item, couponApplied: false, coupon: null };
              return cleared.tip_mode === "percent" ? recomputeTip(cleared) : cleared;
            }
          } catch {
            const cleared = { ...item, couponApplied: false, coupon: null };
            return cleared.tip_mode === "percent" ? recomputeTip(cleared) : cleared;
          }
        })
      );

      const anyValid = updatedCart.some((item) => !isProduct(item) && !isPackage(item) && item.couponApplied);
      if (!anyValid) {
        setCouponError("Coupon does not apply to any services");
        persist(updatedCart.map(({ couponApplied, coupon, ...rest }) => rest));
        return;
      }

      persist(updatedCart);
      setCouponError("");
      setCouponCode("");
    } catch {
      setCouponError("Failed to validate coupon");
    }
  };

  const removeCouponFromItem = (id) => {
    const updatedCart = cart.map((c) => {
      if (c.id !== id) return c;
      const cleared = { ...c, couponApplied: false, coupon: null };
      return cleared.tip_mode === "percent" ? recomputeTip(cleared) : cleared;
    });
    persist(updatedCart);
  };

  const setTipPercent = (id, pct) => {
    const updated = cart.map((i) =>
      i.id === id ? recomputeTip({ ...i, tip_mode: "percent", tip_value: Number(pct || 0) }) : i
    );
    persist(updated);
  };
  const setTipCustomPercent = (id, pct) => setTipPercent(id, pct);

  const setTipAmount = (id, amt) => {
    const updated = cart.map((i) =>
      i.id === id ? { ...i, tip_mode: "amount", tip_amount: Math.max(0, Number(amt || 0)) } : i
    );
    persist(updated);
  };

  const setPackageForItem = (id, packageId) => {
    const normalizedId = packageId ? Number(packageId) : null;
    const updated = cart.map((i) => {
      if (i.id !== id) return i;
      const next = {
        ...i,
        client_package_id: normalizedId,
        package_auto_opt_out: normalizedId ? false : true,
        couponApplied: normalizedId ? false : i.couponApplied,
        coupon: normalizedId ? null : i.coupon,
      };
      return next.tip_mode === "percent" ? recomputeTip(next) : next;
    });
    persist(updated);
  };

  useEffect(() => {
    if (!client || serviceItems.length === 0 || clientPackages.length === 0) return;

    const remainingByPackage = new Map();
    clientPackages.forEach((pkg) => {
      const pkgId = Number(pkg?.id || 0);
      const remaining = Number(pkg?.remaining ?? 0);
      if (pkgId > 0 && remaining > 0) remainingByPackage.set(pkgId, remaining);
    });

    let changed = false;
    const updated = cart.map((item) => {
      if (isProduct(item) || isPackage(item) || !item?.allow_packages) return item;

      const eligible = packagesForService(item.service_id).filter((pkg) => {
        const pkgId = Number(pkg?.id || 0);
        return pkgId > 0 && Number(remainingByPackage.get(pkgId) || 0) > 0;
      });

      if (eligible.length === 0) {
        if (item.client_package_id) {
          changed = true;
          return { ...item, client_package_id: null };
        }
        return item;
      }

      const selectedId = Number(item.client_package_id || 0);
      if (selectedId > 0 && Number(remainingByPackage.get(selectedId) || 0) > 0) {
        remainingByPackage.set(selectedId, Number(remainingByPackage.get(selectedId) || 0) - 1);
        return item;
      }

      if (item.package_auto_opt_out) {
        return { ...item, client_package_id: null };
      }

      const autoPkg = eligible[0];
      const autoPkgId = Number(autoPkg?.id || 0);
      if (autoPkgId > 0) {
        remainingByPackage.set(autoPkgId, Number(remainingByPackage.get(autoPkgId) || 0) - 1);
        changed = true;
        const next = {
          ...item,
          client_package_id: autoPkgId,
          package_auto_opt_out: false,
          couponApplied: false,
          coupon: null,
        };
        return next.tip_mode === "percent" ? recomputeTip(next) : next;
      }

      return item;
    });

    if (changed) {
      persist(updated);
    }
  }, [cart, client, clientPackages]);

  // UPDATED: accept optional setupIntentId too
  const bookServiceLines = async (
    paymentIntentId = null,
    setupIntentId = null,
    { shouldRethrow = false } = {}
  ) => {
    if (serviceItems.length === 0) return [];

    const useBatchBooking = serviceItems.length > 1;

    const compactCart = serviceItems.map(
      ({ service_id, artist_id, date, start_time, addon_ids, client_package_id }) => ({
        service_id,
        artist_id,
        date,
        start_time,
        addon_ids,
        client_package_id: client_package_id ?? null,
      })
    );

    const headers = {
      "Idempotency-Key": window.crypto?.randomUUID?.() ?? String(Date.now()),
    };

    if (useBatchBooking) {
      const payload = {
        client_name: client?.full_name || guest.name,
        client_email: client?.email || guest.email,
        ...(paymentIntentId ? { payment_intent_id: paymentIntentId } : {}),
        ...(setupIntentId ? { setup_intent_id: setupIntentId } : {}),
        ...(finalTotal <= 0 ? { allow_unpaid: true } : {}),
        send_email: true,
        items: serviceItems.map((it) => ({
          artist_id: it.artist_id,
          service_id: it.service_id,
          date: it.date,
          start_time: it.start_time,
          addon_ids: getAddonIds(it),
          ...(it.client_package_id ? { client_package_id: it.client_package_id } : {}),
          ...(it.couponApplied && it.coupon ? { coupon_code: it.coupon.code } : {}),
          tip_amount: tipAllowedNow ? Number((it.tip_amount || 0).toFixed(2)) : 0,
        })),
      };

      try {
        const { data: res } = await apiClient.post(
          `/public/${slugLocal}/book-batch`,
          payload,
          { headers }
        );
        const appointmentIds = Array.isArray(res?.appointment_ids) ? res.appointment_ids : [];
        return serviceItems.map((it, idx) => ({
          appointment_id: appointmentIds[idx] || null,
          service_name: it.service_name || it.name || "Service",
          artist_name: it.artist_name || "Provider",
          date: it.date,
          start_time: it.start_time,
          tip_amount: tipAllowedNow ? Number((it.tip_amount || 0).toFixed(2)) : 0,
          payment_status: res?.payment_status || null,
          paid_via: it.client_package_id ? "package" : null,
        }));
      } catch (err) {
        const data = err?.response?.data;
        if (data?.error_code === "CLIENT_BOOKING_BLOCKED") {
          setErr(CLIENT_BOOKING_BLOCKED_PUBLIC_MESSAGE);
        } else if (err?.response?.status === 409 && data) {
          const conflicts = Array.isArray(data.conflicts)
            ? data.conflicts
                .map((c) => `  ${c.source || "busy"}: ${c.busy_start_local} ? ${c.busy_end_local}`)
                .join("\n")
            : "";
          const parts = [
            data.error || "Selected time is no longer available.",
            conflicts ? `Conflicts:\n${conflicts}` : null,
          ].filter(Boolean);
          setErr(parts.join("\n\n"));
        } else {
          setErr(data?.error || err.message || "Booking failed");
        }
        if (shouldRethrow) throw err;
        return [];
      }
    }

    const results = [];
    for (const it of serviceItems) {
      const payload = {
        service_id: it.service_id,
        artist_id: it.artist_id,
        date: it.date,
        start_time: it.start_time,
        addon_ids: getAddonIds(it),
        client_name: client?.full_name || guest.name,
        client_email: client?.email || guest.email,
        ...(it.client_package_id ? { client_package_id: it.client_package_id } : {}),
        ...(paymentIntentId ? { payment_intent_id: paymentIntentId } : {}),
        ...(setupIntentId ? { setup_intent_id: setupIntentId } : {}),
        ...(it.couponApplied && it.coupon ? { coupon_code: it.coupon.code } : {}),
        tip_amount: tipAllowedNow ? Number((it.tip_amount || 0).toFixed(2)) : 0,
        cart: compactCart,
      };
      try {
        const { data: res } = await apiClient.post(
          `/public/${slugLocal}/book`,
          payload,
          { headers }
        );
        results.push(res);
      } catch (err) {
        const data = err?.response?.data;
        if (data?.error_code === "CLIENT_BOOKING_BLOCKED") {
          setErr(CLIENT_BOOKING_BLOCKED_PUBLIC_MESSAGE);
        } else if (err?.response?.status === 409 && data) {
          const conflicts = Array.isArray(data.conflicts)
            ? data.conflicts
                .map((c) => `  ${c.source || "busy"}: ${c.busy_start_local} ? ${c.busy_end_local}`)
                .join('\n')
            : '';
          const parts = [
            data.error || 'Selected time is no longer available.',
            data.requested_start_local && data.requested_end_local
              ? `Requested: ${data.requested_start_local} ? ${data.requested_end_local}`
              : null,
            data.cooling_minutes_applied
              ? `Includes ${data.cooling_minutes_applied} min cooling`
              : null,
            conflicts ? `Conflicts:\n${conflicts}` : null,
          ].filter(Boolean);
          setErr(parts.join('\n\n'));
        } else {
          setErr(data?.error || err.message || "Booking failed");
        }
        if (shouldRethrow) throw err;
        return [];
      }
    }
    return results;
  };

  const submitProductOrder = async ({
    paymentIntentId = null,
    setupIntentId = null,
    allowUnpaid = false,
  } = {}) => {
    if (productItems.length === 0) return null;
    if (!ensureProductDeliveryValid()) {
      throw new Error("Delivery details are incomplete.");
    }
    const shippingPayload = {
      name: productDelivery.shipping?.name || "",
      phone: productDelivery.shipping?.phone || "",
      address1: productDelivery.shipping?.address1 || "",
      address2: productDelivery.shipping?.address2 || "",
      city: productDelivery.shipping?.city || "",
      region: productDelivery.shipping?.region || "",
      postal_code: productDelivery.shipping?.postal_code || "",
      country: normalizeDeliveryCountryCode(productDelivery.shipping?.country || ""),
      instructions: productDelivery.shipping?.instructions || "",
    };
    const payload = {
      items: productItems.map((item) => ({
        product_id: Number(item.product_id ?? String(item.id).replace(/^product-/, "")),
        quantity: getQuantity(item),
      })),
      client_name: client?.full_name || guest.name,
      client_email: client?.email || guest.email,
      client_phone: client?.phone || productDelivery.shipping?.phone || "",
      payment_intent_id: paymentIntentId,
      setup_intent_id: setupIntentId,
      allow_unpaid: allowUnpaid,
      currency: (normalizeCurrency(displayCurrency) || "USD").toLowerCase(),
      delivery_method: productDelivery.delivery_method || deliveryMethodOptions[0]?.[0] || "",
      pickup_instructions: productDelivery.pickup_instructions || "",
      shipping: shippingPayload,
      selected_rate_id: shippingRates.selectedRateId || undefined,
      shipping_rate_quote_token: shippingRates.quoteToken || undefined,
      selected_shipping_rate_snapshot: selectedShippingRateSnapshot || undefined,
      shipping_address_verification_token: addressVerification.token || undefined,
      import_charges_acknowledged:
        requireImportChargesAcknowledgement && isCrossBorderShipping
          ? importChargesAcknowledged
          : undefined,
      import_charges_notice_version:
        requireImportChargesAcknowledgement && isCrossBorderShipping
          ? importChargesNoticeVersion || undefined
          : undefined,
      import_charges_acknowledgement_quote_public_id:
        requireImportChargesAcknowledgement && isCrossBorderShipping
          ? importChargesAcknowledgementQuotePublicId || undefined
          : undefined,
      import_charges_acknowledgement_destination_country:
        requireImportChargesAcknowledgement && isCrossBorderShipping
          ? currentShippingCountry || undefined
          : undefined,
      import_charges_acknowledgement_customs_hash:
        requireImportChargesAcknowledgement && isCrossBorderShipping
          ? importChargesAcknowledgementCustomsHash || undefined
          : undefined,
    };

    try {
      persistDeliveryPrefill();
      const { data } = await apiClient.post(
        `/public/${slugLocal}/buy-products`,
        payload
      );
      return data;
    } catch (error) {
      const msg = error?.response?.data?.message || error?.response?.data?.error || error.message || "Product order failed";
      setErr(msg);
      throw error;
    }
  };

  const finalizeSuccess = ({ serviceResults = [], productOrder = null }) => {
    const name = client?.full_name || guest.name;
    const email = client?.email || guest.email;
    try {
      if (productOrder) {
        stashProductOrder(productOrder, productOrder.stripe_session_id);
      } else {
        clearProductOrderStash();
      }
    } catch {}
    clearCart();
    setCart([]);
    setErr("");
    setDone({
      customer: { name, email },
      serviceResults,
      productOrder,
    });
    try {
      window.dispatchEvent(new Event("booking:changed"));
    } catch {}
    const primaryResult =
      serviceResults.length === 1 && serviceResults[0]?.success
        ? serviceResults[0]
        : null;
    if (primaryResult) {
      onSuccess?.(primaryResult);
    }
  };
  const bookWithoutPayment = async (e) => {
    e?.preventDefault?.();
    if (loading) return;
    if (!slugLocal) {
      setErr("Unable to determine company. Please reload the page or navigate from the site home.");
      return;
    }
    if (serviceItems.length === 0 && productItems.length === 0 && packageItems.length === 0) {
      setErr("Your cart is empty.");
      return;
    }
    if (productItems.length > 0 && !paymentsEnabled) {
      setErr("Online payments are disabled for this company. Products require online payment.");
      return;
    }
    if (packageItems.length > 0) {
      setErr("Package purchases require online payment.");
      return;
    }
    if (finalTotal <= 0 && !packageOnlyTotal) {
      setErr("Cart total must be greater than zero.");
      return;
    }
    if ((serviceItems.length > 0 && productItems.length > 0) || (packageItems.length > 0 && (serviceItems.length > 0 || productItems.length > 0))) {
      setErr("Services and retail products must be checked out separately. Please complete one checkout before starting another.");
      return;
    }
    if (!ensureProductDeliveryValid()) {
      return;
    }
    setErr("");
    setLoading(true);
    try {
      const serviceResults = serviceItems.length > 0 ? await bookServiceLines() : [];
      if (serviceItems.length > 0 && !serviceResults.length) {
        return;
      }

      const productOrder =
        productItems.length > 0
          ? normalizeProductOrder(await submitProductOrder({ allowUnpaid: true }))
          : null;
      finalizeSuccess({ serviceResults, productOrder });
    } catch (ex) {
      const data = ex?.response?.data || {};
      if (ex?.response?.status === 402 && data?.error === "subscription_required") {
        setPublicUpgradeMessage(data?.message || "");
        setPublicUpgradeOpen(true);
        return;
      }
      setErr(ex.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  const payAndBook = async (e) => {
    e.preventDefault();
    if (loading) return;

    const slug = slugLocal || companySlug;
    if (!slug) {
      setErr("Unable to determine company. Please reload the page or navigate from the site home.");
      return;
    }

    if (!showPayOption) {
      setErr("Immediate payment is not enabled for this company.");
      return;
    }

    if (serviceItems.length === 0 && productItems.length === 0 && packageItems.length === 0) {
      setErr("Your cart is empty.");
      return;
    }
    if (finalTotal <= 0) {
      setErr("No payment is due. Use Confirm booking to apply your package credits.");
      return;
    }
    if ((serviceItems.length > 0 && productItems.length > 0) || (packageItems.length > 0 && (serviceItems.length > 0 || productItems.length > 0))) {
      setErr("Services and retail products must be checked out separately. Please complete one checkout before starting another.");
      return;
    }
    if (!ensureProductDeliveryValid()) {
      return;
    }

    setErr("");
    setLoading(true);

    try {
      const policyMode = effectivePaymentMode === "deposit" ? "deposit" : "pay";

      const payload = buildHostedCheckoutPayload({
        cartItems: cart,
        policyMode,
        currency: displayCurrency,
        clientName: client?.full_name || guest.name,
        clientEmail: client?.email || guest.email,
        clientPhone: client?.phone || productDelivery.shipping?.phone || "",
        productDelivery,
        selectedShippingRateSnapshot,
        selectedRateId: shippingRates.selectedRateId || undefined,
        shippingRateQuoteToken: shippingRates.quoteToken || undefined,
        shippingAddressVerificationToken: addressVerification.token || undefined,
        importChargesAcknowledged:
          requireImportChargesAcknowledgement && isCrossBorderShipping
            ? importChargesAcknowledged
            : undefined,
        importChargesNoticeVersion:
          requireImportChargesAcknowledgement && isCrossBorderShipping
            ? importChargesNoticeVersion || undefined
            : undefined,
        importChargesAcknowledgementQuotePublicId:
          requireImportChargesAcknowledgement && isCrossBorderShipping
            ? importChargesAcknowledgementQuotePublicId || undefined
            : undefined,
        importChargesAcknowledgementDestinationCountry:
          requireImportChargesAcknowledgement && isCrossBorderShipping
            ? currentShippingCountry || undefined
            : undefined,
        importChargesAcknowledgementCustomsHash:
          requireImportChargesAcknowledgement && isCrossBorderShipping
            ? importChargesAcknowledgementCustomsHash || undefined
            : undefined,
        metadata: { source: "checkout", flow: policyMode },
      });

      persistDeliveryPrefill();
      await startHostedCheckout({
        slug,
        payload,
      });
    } catch (ex) {
      const data = ex?.response?.data || {};
      if (ex?.response?.status === 402 && data?.error === "subscription_required") {
        setPublicUpgradeMessage(data?.message || "");
        setPublicUpgradeOpen(true);
        setLoading(false);
        return;
      }
      const message = data?.message || data?.error || ex?.message || "Unable to start Stripe Checkout.";
      setErr(message);
      setLoading(false);
    }
  };

  const saveCardAndBook = async (e) => {
    e.preventDefault();
    if (loading) return;

    const slug = slugLocal || companySlug;
    if (!slug) {
      setErr("Unable to determine company. Please reload the page or navigate from the site home.");
      return;
    }
    if (!showCaptureOption) {
      setErr("Saving a card on file is not enabled for this company.");
      return;
    }
    if (!cardOnFileEnabled) {
      setErr("Card on file is not available for this company.");
      return;
    }
    if (serviceItems.length === 0) {
      setErr("Save card is only available for service bookings. Please add a service to continue.");
      return;
    }
    if (productItems.length > 0 || packageItems.length > 0) {
      setErr("Save card is only available for service bookings. Please remove products or packages to continue.");
      return;
    }
    if (finalTotal <= 0) {
      setErr("No payment is due. Use Confirm booking to apply your package credits.");
      return;
    }
    if (!cardOnFileConsentAccepted) {
      setCardOnFileConsentError("Please accept the card-saving authorization to continue.");
      return;
    }

    setErr("");
    setCardOnFileConsentError("");
    setLoading(true);

    try {
      const payload = buildHostedCheckoutPayload({
        cartItems: cart,
        policyMode: "capture",
        currency: displayCurrency,
        clientName: client?.full_name || guest.name,
        clientEmail: client?.email || guest.email,
        clientPhone: client?.phone || productDelivery.shipping?.phone || "",
        productDelivery,
        selectedShippingRateSnapshot,
        selectedRateId: shippingRates.selectedRateId || undefined,
        shippingRateQuoteToken: shippingRates.quoteToken || undefined,
        shippingAddressVerificationToken: addressVerification.token || undefined,
        importChargesAcknowledged:
          requireImportChargesAcknowledgement && isCrossBorderShipping
            ? importChargesAcknowledged
            : undefined,
        importChargesNoticeVersion:
          requireImportChargesAcknowledgement && isCrossBorderShipping
            ? importChargesNoticeVersion || undefined
            : undefined,
        importChargesAcknowledgementQuotePublicId:
          requireImportChargesAcknowledgement && isCrossBorderShipping
            ? importChargesAcknowledgementQuotePublicId || undefined
            : undefined,
        importChargesAcknowledgementDestinationCountry:
          requireImportChargesAcknowledgement && isCrossBorderShipping
            ? currentShippingCountry || undefined
            : undefined,
        importChargesAcknowledgementCustomsHash:
          requireImportChargesAcknowledgement && isCrossBorderShipping
            ? importChargesAcknowledgementCustomsHash || undefined
            : undefined,
        cardOnFileConsent: {
          accepted: true,
          policy_version: policy?.policy_version || undefined,
          policy_text_hash: policy?.policy_text_hash || undefined,
        },
        metadata: { source: "checkout", flow: "capture" },
      });

      await startHostedCheckout({
        slug,
        payload,
      });
    } catch (ex) {
      const data = ex?.response?.data || {};
      if (ex?.response?.status === 402 && data?.error === "subscription_required") {
        setPublicUpgradeMessage(data?.message || "");
        setPublicUpgradeOpen(true);
        setLoading(false);
        return;
      }
      const message = data?.message || data?.error || ex?.message || "Unable to start Stripe Checkout.";
      setErr(message);
      setLoading(false);
    }
  };

  const syncClientFromToken = (token) => {
    apiClient
      .get("/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        if (!data) {
          setClient(null);
          setGuest({ name: "", email: "" });
          return;
        }
        setClient(data);
        const fullName = data.full_name || `${data.first_name || ""} ${data.last_name || ""}`.trim();
        setGuest({ name: fullName, email: data.email });
      })
      .catch(() => {
        setClient(null);
        setGuest({ name: "", email: "" });
      });
  };

  const handleLoginSuccess = (token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", "client");
    localStorage.setItem("clientToken", token);
    if (slugLocal || companySlug) localStorage.setItem("site", slugLocal || companySlug);
    syncClientFromToken(token);
  };

  const handleRegisterSuccess = (token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", "client");
    localStorage.setItem("clientToken", token);
    if (slugLocal || companySlug) localStorage.setItem("site", slugLocal || companySlug);
    syncClientFromToken(token);
  };

  if (done) {
    const { customer, serviceResults = [], productOrder } = done;
    const productItems = Array.isArray(productOrder?.items) ? productOrder.items : [];
    const stripeCurrency = (productOrder?.stripe_currency || productOrder?.currency || productOrder?.currency_code || "USD").toUpperCase();
    const stripeSubtotal = productOrder?.stripe_subtotal_cents != null ? productOrder.stripe_subtotal_cents / 100 : null;
    const stripeTax = productOrder?.stripe_tax_cents != null ? productOrder.stripe_tax_cents / 100 : null;
    const productTotal = productOrder?.stripe_total_cents != null
      ? productOrder.stripe_total_cents / 100
      : Number(productOrder?.total_amount || productOrder?.total || 0);
    const displayCurrency = stripeCurrency;
    const buildSearch = (extra = {}) => {
      const qs = new URLSearchParams();
      if (embedSuffix) {
        const existing = new URLSearchParams(embedSuffix.slice(1));
        existing.forEach((value, key) => qs.set(key, value));
      }
      Object.entries(extra).forEach(([key, value]) => {
        if (value == null || value === '') return;
        qs.set(key, String(value));
      });
      const str = qs.toString();
      return str ? `?${str}` : '';
    };
    const goProducts = () => {
      if (!slugLocal) return;
      const search = buildSearch();
      navigate({ pathname: `${basePath}/products`, search });
    };
    const goBookings = () => {
      if (!slugLocal) return;
      const search = buildSearch({ page: 'my-bookings' });
      navigate({ pathname: basePath || "/", search });
    };
    const goHome = () => {
      if (!slugLocal) return;
      const search = buildSearch();
      navigate({ pathname: basePath || "/", search });
    };
    const disableNav = !slugLocal;

    return (
      <Box py={{ xs: 6, md: 8 }} px={{ xs: 2, md: 0 }} maxWidth={720} mx="auto">
        <Paper
          elevation={4}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            backgroundColor: "var(--checkout-card-bg, var(--page-card-bg, var(--page-body-bg, #ffffff)))",
            color: "var(--page-body-color, inherit)",
          }}
        >
          <Stack spacing={4}>
            <Stack spacing={1}>
              <Typography variant="h3" fontWeight={800}>
                Order confirmed
              </Typography>
              <Typography color="text.secondary">
                We sent a confirmation to {customer?.email || 'your inbox'}.
              </Typography>
              {productOrder?.id && (
                <Typography variant="body2" color="text.secondary">
                  Order #{productOrder.id}
                </Typography>
              )}
            </Stack>

            {serviceResults.length > 0 && (
              <Stack spacing={2}>
                <Typography variant="h5" fontWeight={700}>Appointments</Typography>
                <List disablePadding>
                  {serviceResults.map((res, idx) => {
                    const subtitle = res?.start_local && res?.end_local
                      ? `${res.start_local} - ${res.end_local}`
                      : res?.date
                      ? `${res.date} ${res.start_time || ''}`.trim()
                      : undefined;
                    return (
                      <React.Fragment key={res?.appointment_id || res?.id || idx}>
                        <ListItem disableGutters sx={{ alignItems: 'flex-start', py: 1 }}>
                          <ListItemText
                            primaryTypographyProps={{ fontWeight: 600 }}
                            primary={
                              res?.service_name
                                ? `${res.service_name}${res?.artist_name ? ` with ${res.artist_name}` : ''}`
                                : 'Appointment'
                            }
                            secondary={subtitle}
                          />
                        </ListItem>
                        {idx !== serviceResults.length - 1 && <Divider component="li" />}
                      </React.Fragment>
                    );
                  })}
                </List>
              </Stack>
            )}

            {productItems.length > 0 && (
              <Stack spacing={2}>
                <Typography variant="h5" fontWeight={700}>Products</Typography>
                <List disablePadding>
                  {productItems.map((item, idx) => {
                    const total = Number(item.total_price ?? (item.unit_price || 0) * (item.quantity || 1));
                    return (
                      <React.Fragment key={item.id || idx}>
                        <ListItem disableGutters sx={{ py: 1 }}>
                          <ListItemText
                            primaryTypographyProps={{ fontWeight: 600 }}
                            primary={`${item.name} x ${item.quantity || 1}`}
                            secondary={item.sku ? `SKU: ${item.sku}` : undefined}
                          />
                          <Typography fontWeight={600}>
                            {formatCurrency(total, displayCurrency)}
                          </Typography>
                        </ListItem>
                        {idx !== productItems.length - 1 && <Divider component="li" />}
                      </React.Fragment>
                    );
                  })}
                </List>
                {stripeSubtotal != null && (
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography color="text.secondary">Subtotal</Typography>
                    <Typography fontWeight={600}>
                      {formatCurrency(stripeSubtotal, displayCurrency)}
                    </Typography>
                  </Stack>
                )}
                {stripeTax != null && stripeTax > 0 && (
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography color="text.secondary">Tax</Typography>
                    <Typography fontWeight={600}>
                      {formatCurrency(stripeTax, displayCurrency)}
                    </Typography>
                  </Stack>
                )}
                {Boolean(productOrder?.is_cross_border) && (
                  <>
                    {productOrder?.customer_shipping_amount_cents != null ? (
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography color="text.secondary">Shipping paid</Typography>
                        <Typography fontWeight={600}>
                          {formatCurrency(
                            Number(productOrder.customer_shipping_amount_cents || 0) / 100,
                            (productOrder.customer_shipping_currency || displayCurrency || "USD").toUpperCase()
                          )}
                        </Typography>
                      </Stack>
                    ) : null}
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography color="text.secondary">Duties included</Typography>
                      <Typography fontWeight={600}>No</Typography>
                    </Stack>
                    <Typography color="text.secondary">
                      Import charges may be collected separately.
                    </Typography>
                    {productOrder?.import_charges_notice_snapshot?.standard_notice ? (
                      <Typography color="text.secondary">
                        {productOrder.import_charges_notice_snapshot.standard_notice}
                      </Typography>
                    ) : null}
                  </>
                )}
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography color="text.secondary">
                    {productOrder?.is_cross_border ? "Total charged now" : "Total"}
                  </Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {formatCurrency(productTotal, displayCurrency)}
                  </Typography>
                </Stack>
              </Stack>
            )}

            <Typography color="text.secondary">
              Need to make a change? Reply to the confirmation email and our team will help.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                variant="contained"
                onClick={goProducts}
                disabled={disableNav}
                sx={primaryButtonSx}
              >
                Continue shopping
              </Button>
              {serviceResults.length > 0 && (
                <Button
                  variant="outlined"
                  onClick={goBookings}
                  disabled={disableNav}
                  sx={outlineButtonSx}
                >
                  View my bookings
                </Button>
              )}
              <Button
                variant="text"
                onClick={goHome}
                disabled={disableNav}
                sx={textButtonSx}
              >
                Back to home
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        px: { xs: 2, md: 0 },
        py: { xs: 3, md: 4 },
        maxWidth: 760,
        mx: "auto",
      }}
    >
      <Paper
        sx={{
          p: { xs: 2.5, md: 4 },
          borderRadius: 4,
          border: `1px solid ${borderColor}`,
          backgroundColor: "var(--checkout-card-bg, var(--page-card-bg, var(--page-body-bg, #ffffff)))",
          backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 100%)",
          color: checkoutTextColor,
          boxShadow: "var(--page-card-shadow, 0 18px 45px rgba(15,23,42,0.12))",
        }}
      >
        <Stack spacing={3}>
        <Typography
          variant="h5"
          gutterBottom
          fontWeight={800}
          sx={{ color: checkoutHeadingColor, typography: { xs: "h5", md: "h4" } }}
        >
          Checkout
        </Typography>

      {typeof holdMinutes === "number" && holdMinutes > 0 && serviceItems.length > 0 && holdState.overall !== null && (
        <Alert
          severity={holdState.overall > 0 ? "info" : "warning"}
          sx={{
            mb: 2,
            ...(holdState.overall > 0 ? infoAlertSx : {}),
          }}
        >
          {holdState.overall > 0
            ? `We're holding your selected times for ${formatHoldCountdown(holdState.overall)}. Complete checkout before the timer runs out or the slots will be released.`
            : "The hold window has expired. If you continue, the selected times may no longer be available."}
        </Alert>
      )}

      {/* Cart */}
      <List
        sx={{
          mb: 2,
          border: 1,
          borderColor: "divider",
          borderRadius: 3,
          overflow: "hidden",
          color: checkoutSectionColor,
          "& .MuiTypography-root": { color: checkoutSectionColor },
          "& .MuiListItemText-primary": { color: checkoutSectionColor },
          "& .MuiListItemText-secondary": { color: checkoutSectionColor },
        }}
      >
        {cart.map((it) => {
          const subtotal = lineSubtotal(it);
          const packageOptions =
            client && it.allow_packages ? packagesForService(it.service_id) : [];
          const remainingCredits = packageOptions.reduce((sum, pkg) => {
            const remaining = Number(pkg?.remaining ?? 0);
            return sum + (Number.isFinite(remaining) ? remaining : 0);
          }, 0);
          const selectedPackageId = Number(it.client_package_id || 0);
          const selectedPackage = packageOptions.find(
            (pkg) => Number(pkg?.id || 0) === selectedPackageId
          );
          const selectedPackageLabel = selectedPackage
            ? `${selectedPackage?.template?.name || selectedPackage?.name || "Package"} (${Number(selectedPackage?.remaining ?? 0)} left)`
            : "Pay normally";

          if (isProduct(it)) {
            const quantity = getQuantity(it);
            return (
              <ListItem
                key={it.id}
                divider
                alignItems="flex-start"
                secondaryAction={
                  <IconButton color="error" onClick={() => removeItem(it.id)}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={it.name}
                  secondaryTypographyProps={{ component: "div" }}
                  secondary={
                    <Box>
                      <Typography variant="body2">
                        Quantity: {quantity}
                      </Typography>
                      <Typography variant="body2">
                        Unit price {formatCurrency(Number(it.price || 0), currencyCode)}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>
                        Line total {formatCurrency(subtotal, currencyCode)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            );
          }

          if (isPackage(it)) {
            const quantity = getQuantity(it);
            const sessions = Number(it.session_qty || 0);
            const displayName = it.package_name || `${sessions}-Session ${it.service_name || "Package"}`;
            const expiresIn = Number(it.expires_in || 0);
            return (
              <ListItem
                key={it.id}
                divider
                alignItems="flex-start"
                secondaryAction={
                  <IconButton color="error" onClick={() => removeItem(it.id)}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={displayName}
                  secondaryTypographyProps={{ component: "div" }}
                  secondary={
                    <Box>
                      {it.service_name && (
                        <Typography variant="body2">
                          For {it.service_name}
                        </Typography>
                      )}
                      {Number.isFinite(sessions) && sessions > 0 && (
                        <Typography variant="body2">
                          {sessions} sessions
                        </Typography>
                      )}
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                        <Typography variant="body2">Quantity</Typography>
                        <IconButton
                          size="small"
                          onClick={() => updatePackageQuantity(it.id, quantity - 1)}
                          disabled={quantity <= 1}
                          aria-label="Decrease package quantity"
                        >
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="body2" sx={{ minWidth: 20, textAlign: "center" }}>
                          {quantity}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => updatePackageQuantity(it.id, quantity + 1)}
                          aria-label="Increase package quantity"
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                      <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>
                        Line total {formatCurrency(subtotal, currencyCode)}
                      </Typography>
                      {Number.isFinite(expiresIn) && expiresIn > 0 ? (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                          Expires in {expiresIn} days
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                          No expiration
                        </Typography>
                      )}
                      {quantity > 1 && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                          Quantity {quantity}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            );
          }

          const discount = lineDiscount(it);
          const tip = tipAllowedNow ? Number(it.tip_amount || 0) : 0;
          const lineTotal = Math.max(0, subtotal - discount) + tip;

          return (
            <ListItem
              key={it.id}
              divider
              alignItems="flex-start"
              secondaryAction={
                <IconButton color="error" onClick={() => removeItem(it.id)}>
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText
                primary={`${it.service_name}   ${it.artist_name}`}
                secondaryTypographyProps={{ component: "div" }}
                secondary={
                  <Box>
                    <Typography variant="body2">
                      {it.date}&nbsp; &nbsp;{it.start_time}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      Subtotal&nbsp;${subtotal.toFixed(2)}
                    </Typography>

                    {getAddons(it).map((ad) => (
                      <Typography key={ad.id} variant="body2" sx={{ pl: 2 }}>
                        - {ad.name}&nbsp;
                        <Chip
                          size="small"
                          label={`$${Number(ad.base_price).toFixed(2)}`}
                          sx={{ ml: 0.5 }}
                        />
                      </Typography>
                    ))}

                    {it.couponApplied && it.coupon && (
                      <Chip
                        label={`Coupon: ${it.coupon.code}`}
                        color="success"
                        onDelete={() => removeCouponFromItem(it.id)}
                        sx={{ mt: 1 }}
                      />
                    )}

                    {client && it.allow_packages && (
                      <Box sx={{ mt: 1.5 }}>
                        {packagesLoading ? (
                          <Typography variant="caption" color="text.secondary">
                            Loading packages…
                          </Typography>
                        ) : packagesError ? (
                          <Typography variant="caption" color="error">
                            {packagesError}
                          </Typography>
                        ) : packageOptions.length === 0 ? (
                          <Typography variant="caption" color="text.secondary">
                            No active packages available for this service.
                          </Typography>
                        ) : (
                          <>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                              You have {remainingCredits} credit{remainingCredits === 1 ? "" : "s"} for this service.
                            </Typography>
                            <TextField
                              select
                              label="Use package"
                              size="small"
                              value={it.client_package_id ?? ""}
                              onChange={(e) => setPackageForItem(it.id, e.target.value)}
                              sx={{ minWidth: { xs: "100%", sm: 260 } }}
                              SelectProps={{
                                displayEmpty: true,
                                renderValue: (value) => {
                                  if (value === "" || value === null || value === undefined) {
                                    return "Pay normally";
                                  }
                                  return selectedPackageLabel;
                                },
                              }}
                            >
                              <MenuItem value="">Pay normally</MenuItem>
                              {packageOptions.map((pkg) => {
                                const pkgName =
                                  pkg?.template?.name ||
                                  pkg?.name ||
                                  "Package";
                                const remaining = Number(pkg?.remaining ?? 0);
                                return (
                                  <MenuItem key={pkg.id} value={pkg.id}>
                                    {pkgName} ({remaining} left)
                                  </MenuItem>
                                );
                              })}
                            </TextField>
                          </>
                        )}
                        {it.client_package_id && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block", mt: 0.5 }}
                          >
                            Package applied. Service price covered.
                          </Typography>
                        )}
                      </Box>
                    )}

                    <Box sx={{ mt: 1.5 }}>
                      {tipAllowedNow && (
                        <>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            Tip for {it.artist_name}
                          </Typography>

                          <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap" }}>
                            {[0, 10, 15, 20].map((pct) => (
                              <Chip
                                key={pct}
                                label={`${pct}%`}
                                clickable
                                onClick={() => setTipPercent(it.id, pct)}
                                variant={
                                  it.tip_mode === "percent" && Number(it.tip_value) === pct
                                    ? "filled"
                                    : "outlined"
                                }
                              />
                            ))}
                            <Chip
                              label="Custom %"
                              clickable
                              onClick={() => setTipPercent(it.id, it.tip_value || 0)}
                              variant={it.tip_mode === "percent" ? "filled" : "outlined"}
                            />
                            <Chip
                              label="Custom $"
                              clickable
                              onClick={() => setTipAmount(it.id, it.tip_amount || 0)}
                              variant={it.tip_mode === "amount" ? "filled" : "outlined"}
                            />
                          </Stack>

                          {it.tip_mode === "percent" ? (
                          <TextField
                            label="Custom %"
                            type="number"
                            size="small"
                            value={it.tip_value || ""}
                            onChange={(e) => setTipCustomPercent(it.id, Number(e.target.value || 0))}
                            inputProps={{ min: 0, max: 100 }}
                            sx={{
                              width: { xs: "100%", sm: 140 },
                              mr: { sm: 2 },
                              mb: { xs: 1, sm: 0 },
                            }}
                          />
                        ) : (
                          <TextField
                            label="Custom tip ($)"
                            type="number"
                            size="small"
                            value={it.tip_amount || ""}
                            onChange={(e) => setTipAmount(it.id, Number(e.target.value || 0))}
                            inputProps={{ min: 0, step: "0.01" }}
                            sx={{
                              width: { xs: "100%", sm: 160 },
                              mr: { sm: 2 },
                              mb: { xs: 1, sm: 0 },
                            }}
                          />
                        )}
                        </>
                      )}

                      {!!discount && (
                        <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
                          Discount&nbsp;-${discount.toFixed(2)}
                        </Typography>
                      )}
                      {tipAllowedNow && !!tip && (
                        <Typography variant="caption" sx={{ display: "block" }}>
                          Tip&nbsp;+${tip.toFixed(2)}
                        </Typography>
                      )}

                      <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>
                        Line total&nbsp;{formatCurrency(lineTotal, currencyCode)}
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </ListItem>
          );
        })}

        <Divider />
        <ListItem>
          <Typography variant="h6">
            Subtotal: {formatCurrency(totalBeforeDiscount, currencyCode)}
          </Typography>
        </ListItem>

        {/* Coupon input */}
        <ListItem
          sx={{
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            gap: { xs: 1, sm: 2 },
          }}
        >
          <TextField
            label="Coupon code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            size="small"
            fullWidth
            error={!!couponError}
            helperText={couponError}
          />
      <Button
        variant="outlined"
        onClick={applyCoupon}
        disabled={loading || !couponCode.trim()}
        sx={{ ...outlineButtonSx, width: { xs: "100%", sm: "auto" } }}
      >
        Apply
      </Button>
        </ListItem>

        <Divider />
        {totalDiscount > 0 && (
          <ListItem>
            <Typography variant="h6">
              Discount: -${totalDiscount.toFixed(2)}
            </Typography>
          </ListItem>
        )}
        {totalTip > 0 && (
          <ListItem>
            <Typography variant="h6">Tip: +{formatCurrency(totalTip, currencyCode)}</Typography>
          </ListItem>
        )}
        {shippingRateTotal > 0 && (
          <ListItem>
            <Typography variant="h6">Shipping: {formatCurrency(shippingRateTotal, currencyCode)}</Typography>
          </ListItem>
        )}
        {isCrossBorderShipping && shippingRateTotal > 0 && (
          <ListItem>
            <Typography variant="h6">Import duties and taxes: Not included</Typography>
          </ListItem>
        )}
        {paymentsEnabled && (
          <ListItem>
            <Typography variant="body2" color="text.secondary">
              Tax is calculated during Stripe checkout and itemized on your receipt.
            </Typography>
          </ListItem>
        )}
      <ListItem>
          <Typography variant="h6">
            {isCrossBorderShipping && shippingRateTotal > 0 ? "Total charged now" : "Total"}: {formatCurrency(finalTotal, currencyCode)}
          </Typography>
        </ListItem>
      </List>

      {isCrossBorderShipping && shippingRateTotal > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Stack spacing={1.25}>
            <Typography variant="body2">
              The carrier or customs authority may collect import duties, taxes, brokerage charges, or other fees separately before or at delivery.
            </Typography>
            {requireImportChargesAcknowledgement && (
              <FormControlLabel
                control={(
                  <Checkbox
                    checked={importChargesAcknowledged}
                    onChange={(event) => setImportChargesAcknowledged(Boolean(event.target.checked))}
                  />
                )}
                label="I understand that import duties, taxes, brokerage charges, or carrier fees may be collected separately."
              />
            )}
          </Stack>
        </Paper>
      )}

      {productItems.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: checkoutSectionColor }}>
            Delivery details
          </Typography>
          <TextField
            select
            fullWidth
            label="Delivery method"
            value={safeDeliveryMethodValue}
            onChange={handleDeliveryMethod}
            SelectProps={{ MenuProps: CHECKOUT_SELECT_MENU_PROPS }}
            sx={{ mb: 2 }}
            disabled={deliveryMethodPolicy.loading || deliveryMethodOptions.length === 0}
          >
            {deliveryMethodOptions.length > 1 && (
              <MenuItem value="">
                Choose a delivery method
              </MenuItem>
            )}
            {deliveryMethodOptions.map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </TextField>
          {deliveryMethodPolicy.loading && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: -1, mb: 1 }}>
              Loading available delivery methods...
            </Typography>
          )}
          {!deliveryMethodPolicy.loading && deliveryMethodOptions.length === 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {policyIsApiLoadedEmpty
                ? "This Product is not currently available for delivery or pickup."
                : "Delivery methods are temporarily unavailable. Please try again."}
            </Alert>
          )}

          {requiresShippingAddress ? (
            <Stack spacing={1.5}>
              <TextField
                fullWidth
                required
                label="Full name"
                value={productDelivery.shipping?.name || ""}
                onChange={handleShippingField("name")}
              />
              <TextField
                fullWidth
                required
                label="Phone"
                value={productDelivery.shipping?.phone || ""}
                onChange={handleShippingField("phone")}
              />
              <TextField
                fullWidth
                required
                label="Address line 1"
                value={productDelivery.shipping?.address1 || ""}
                onChange={handleShippingField("address1")}
              />
              <TextField
                fullWidth
                label="Address line 2 (optional)"
                value={productDelivery.shipping?.address2 || ""}
                onChange={handleShippingField("address2")}
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField
                  fullWidth
                  required
                  label="City"
                  value={productDelivery.shipping?.city || ""}
                  onChange={handleShippingField("city")}
                />
                <TextField
                  fullWidth
                  required={shippingRegionRequired}
                  label="State / Province / Region"
                  value={productDelivery.shipping?.region || ""}
                  onChange={handleShippingField("region")}
                />
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField
                  fullWidth
                  required={shippingPostalRequired}
                  label="Postal / ZIP code"
                  value={productDelivery.shipping?.postal_code || ""}
                  onChange={handleShippingField("postal_code")}
                  helperText={
                    normalizeDeliveryCountryCode(productDelivery.shipping?.country) === "CA"
                      ? "Format: A1A 1A1"
                      : normalizeDeliveryCountryCode(productDelivery.shipping?.country) === "US"
                        ? "Format: 12345 or 12345-6789"
                        : ""
                  }
                />
                <Autocomplete
                  options={deliveryCountryOptions}
                  value={deliveryCountryOptions.find((country) => country.code === currentDeliveryCountryValue) || null}
                  onChange={(_event, value) =>
                    handleShippingField("country")({ target: { value: value?.code || "" } })
                  }
                  isOptionEqualToValue={(option, value) => option.code === value.code}
                  getOptionLabel={(option) => option?.label || option?.code || ""}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      required
                      label="Country"
                      helperText="Available destinations are shown here based on the business shipping policy."
                    />
                  )}
                />
              </Stack>
              {verificationEnabled && (
                <Stack spacing={1}>
                  <Button
                    variant="contained"
                    onClick={verifyAddressForShipping}
                    disabled={addressVerification.loading || !deliveryOk}
                  >
                    {addressVerification.loading ? "Verifying address..." : "Verify address & view shipping options"}
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    Address verification checks deliverability and may suggest corrections before shipping rates are shown.
                  </Typography>
                </Stack>
              )}
              {verificationEnabled && addressVerification.status === "verified" && (
                <Alert severity="success">
                  {addressVerification.messages[0] || "Address verified. Shipping options are ready."}
                </Alert>
              )}
              {verificationEnabled && addressVerification.status === "corrected" && (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Stack spacing={1.5}>
                    <Alert severity="info">
                      {addressVerification.messages[0] || "We found a suggested version of your address."}
                    </Alert>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                      <Box flex={1}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                          Suggested address
                        </Typography>
                        <Typography variant="body2">{addressVerification.suggestedAddress?.address1}</Typography>
                        {addressVerification.suggestedAddress?.address2 ? (
                          <Typography variant="body2">{addressVerification.suggestedAddress.address2}</Typography>
                        ) : null}
                        <Typography variant="body2">
                          {[addressVerification.suggestedAddress?.city, addressVerification.suggestedAddress?.region, addressVerification.suggestedAddress?.postal_code].filter(Boolean).join(", ")}
                        </Typography>
                        <Typography variant="body2">{addressVerification.suggestedAddress?.country}</Typography>
                      </Box>
                      <Box flex={1}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                          Original address
                        </Typography>
                        <Typography variant="body2">{addressVerification.originalAddress?.address1}</Typography>
                        {addressVerification.originalAddress?.address2 ? (
                          <Typography variant="body2">{addressVerification.originalAddress.address2}</Typography>
                        ) : null}
                        <Typography variant="body2">
                          {[addressVerification.originalAddress?.city, addressVerification.originalAddress?.region, addressVerification.originalAddress?.postal_code].filter(Boolean).join(", ")}
                        </Typography>
                        <Typography variant="body2">{addressVerification.originalAddress?.country}</Typography>
                      </Box>
                    </Stack>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                      <Button variant="contained" onClick={() => acceptVerifiedAddress("suggested")} disabled={addressVerification.loading}>
                        Use suggested address
                      </Button>
                      <Button variant="outlined" onClick={() => acceptVerifiedAddress("original")} disabled={addressVerification.loading}>
                        Use original address
                      </Button>
                      <Button
                        variant="text"
                        onClick={() => {
                          resetShippingVerificationState();
                          clearShippingRatesState();
                        }}
                        disabled={addressVerification.loading}
                      >
                        Edit address
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              )}
              {verificationEnabled && addressVerification.status === "customer_confirmation_required" && (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Stack spacing={1.5}>
                    <Alert severity="warning">
                      {addressVerification.messages[0] ||
                        "We could not automatically verify this international address. Please check it carefully before continuing."}
                    </Alert>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                        Address to confirm
                      </Typography>
                      <Typography variant="body2">{addressVerification.acceptedAddress?.address1}</Typography>
                      {addressVerification.acceptedAddress?.address2 ? (
                        <Typography variant="body2">{addressVerification.acceptedAddress.address2}</Typography>
                      ) : null}
                      <Typography variant="body2">
                        {[addressVerification.acceptedAddress?.city, addressVerification.acceptedAddress?.region, addressVerification.acceptedAddress?.postal_code].filter(Boolean).join(", ")}
                      </Typography>
                      <Typography variant="body2">{addressVerification.acceptedAddress?.country}</Typography>
                    </Box>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={addressConfirmationChecked}
                          onChange={(event) => setAddressConfirmationChecked(event.target.checked)}
                        />
                      }
                      label="I confirm that this international delivery address is complete and correct."
                    />
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                      <Button
                        variant="contained"
                        onClick={() => acceptVerifiedAddress("confirm")}
                        disabled={addressVerification.loading || !addressConfirmationChecked}
                      >
                        Confirm address & view shipping options
                      </Button>
                      <Button
                        variant="text"
                        onClick={() => {
                          resetShippingVerificationState();
                          clearShippingRatesState();
                        }}
                        disabled={addressVerification.loading}
                      >
                        Edit address
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              )}
              {verificationEnabled && ["undeliverable", "provider_unavailable"].includes(addressVerification.status) && addressVerification.messages.length > 0 && (
                <Alert severity={addressVerification.status === "provider_unavailable" ? "warning" : "error"}>
                  {addressVerification.messages[0]}
                </Alert>
              )}
              {isCrossBorderShipping && (
                <Alert severity="info">
                  {currentImportChargesNotice?.standard_notice ||
                    "International shipping may be subject to import duties, taxes, brokerage charges, or other fees collected separately by the carrier or destination authorities."}
                  {currentImportChargesNotice?.additional_note ? ` ${currentImportChargesNotice.additional_note}` : ""}
                </Alert>
              )}
              {!verificationEnabled && (productDelivery.delivery_method || "").toLowerCase() === "shipping" && deliveryMethodPolicy.automationMode === "manual" && (
                <Alert severity="warning">
                  Shipping is arranged manually by the business. The order total shown now does not include a live carrier rate.
                </Alert>
              )}
              {shippingRates.loading && (
                <Alert severity="info">Fetching live shipping rates...</Alert>
              )}
              {shippingRates.available && shippingRates.rates.length > 0 && (
                <FormControl fullWidth>
                  <Typography
                    component="div"
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 0.75, fontWeight: 600 }}
                  >
                    Shipping option
                  </Typography>
                  <Select
                    value={shippingRates.selectedRateId || ""}
                    onChange={(event) =>
                      setShippingRates((prev) => ({ ...prev, selectedRateId: String(event.target.value || "") }))
                    }
                    displayEmpty
                    MenuProps={CHECKOUT_SELECT_MENU_PROPS}
                  >
                    <MenuItem value="" disabled>Select a shipping option</MenuItem>
                    {shippingRates.rates.map((rate) => {
                      const rateId = String(rate?.rate_id || rate?.id || "");
                      const amount = Number(rate?.amount || 0);
                      const currency = String(rate?.currency || currencyCode || "USD").toUpperCase();
                      const eta = rate?.delivery_days != null ? ` · ${rate.delivery_days} day(s) transit estimate` : "";
                      return (
                        <MenuItem key={rateId} value={rateId}>
                          {(rate?.carrier || "Carrier")} {(rate?.service || "Service")} · {formatCurrency(amount, currency)}
                          {isCrossBorderShipping ? " · Import charges not included" : ""}
                          {eta}
                        </MenuItem>
                      );
                    })}
                  </Select>
                  {isCrossBorderShipping ? (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75 }}>
                      {currentImportChargesNotice?.transit_estimate_note ||
                        "Estimated carrier transit time does not include possible customs-processing delays."}
                    </Typography>
                  ) : null}
                </FormControl>
              )}
              {!shippingRates.available && shippingRates.message && (
                <Alert severity={shippingRates.fallbackManual ? "info" : "warning"}>
                  {shippingRates.message}
                  {Array.isArray(shippingRates.incompatibleItems) && shippingRates.incompatibleItems.length > 0 ? (
                    <>
                      {" "}
                      {shippingRates.incompatibleItems
                        .map((item) => item?.name)
                        .filter(Boolean)
                        .join(", ")}
                    </>
                  ) : null}
                </Alert>
              )}
              <TextField
                fullWidth
                label="Delivery instructions (optional)"
                value={productDelivery.shipping?.instructions || ""}
                onChange={handleShippingField("instructions")}
              />
            </Stack>
          ) : (
            <TextField
              fullWidth
              label="Pickup instructions (optional)"
              value={productDelivery.pickup_instructions || ""}
              onChange={(event) =>
                setProductDelivery((prev) => ({ ...prev, pickup_instructions: event.target.value }))
              }
            />
          )}
        </Paper>
      )}

      {err && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {err}
        </Alert>
      )}

      {/* Card   show when either pay-now or card-on-file is enabled */}
      {packageOnlyTotal ? (
        <Alert severity="success" sx={{ mb: 2, ...infoAlertSx }}>
          This booking is fully covered by your package credits. No Stripe payment is required.
        </Alert>
      ) : effectivePaymentMode !== "off" ? (
        <Alert severity="info" sx={{ mb: 2, ...infoAlertSx }}>
          {hasPackagePurchase && !paymentsEnabled
            ? "Online payments are disabled for this company. Package purchases require online payment."
            : effectivePaymentMode === "capture"
              ? "We'll save your card securely with Stripe. You'll be charged later by the manager."
              : "You'll enter your payment details on Stripe's secure checkout page."}
        </Alert>
      ) : (
        <Alert severity="info" sx={{ mb: 2, ...infoAlertSx }}>
          {hasPackagePurchase
            ? "Online payments are disabled for this company. Package purchases require online payment."
            : <>Online payments are currently disabled for this company. Your booking will be created as <strong>unpaid</strong>.</>}
        </Alert>
      )}

      {/* Auth section with login & sign up buttons */}
      {showCaptureOption &&
        serviceItems.length > 0 &&
        productItems.length === 0 &&
        packageItems.length === 0 && (
          <Paper sx={{ mb: 2, p: 2, borderRadius: 2 }}>
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={cardOnFileConsentAccepted}
                    onChange={(event) => {
                      setCardOnFileConsentAccepted(event.target.checked);
                      if (event.target.checked) {
                        setCardOnFileConsentError("");
                      }
                    }}
                  />
                }
                label={`I agree that ${sitePayload?.name || "this business"} may securely save my card with Stripe and use it for future charges that I authorize under the cancellation and no-show policy shown here.`}
              />
              <Typography variant="body2" color="text.secondary">
                {policy?.cancellation_policy || "The current cancellation and no-show policy will apply to future authorized charges."}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                No payment is collected now. Saving a card does not guarantee that a future charge will be approved.
              </Typography>
              {cardOnFileConsentError ? (
                <Typography variant="body2" color="error">
                  {cardOnFileConsentError}
                </Typography>
              ) : null}
            </Stack>
          </Paper>
        )}
      {client ? (
        <>
          <TextField
            fullWidth
            disabled
            sx={{ mb: 2 }}
            label="Full name"
            value={client.full_name || `${client.first_name} ${client.last_name}`.trim()}
          />
          <TextField fullWidth disabled sx={{ mb: 2 }} label="Email" value={client.email} />

          {/* If Stripe on ? show Pay & Book, and if allowed ? Save Card & Book */}
          {packageOnlyTotal ? (
            <Button
              fullWidth
              variant="contained"
              disabled={loading}
              onClick={bookWithoutPayment}
              sx={primaryButtonSx}
            >
              {loading ? <CircularProgress size={24} /> : "Confirm booking"}
            </Button>
          ) : showOnlinePayment ? (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 1 }}>
              {(showPayOption || hasPackagePurchase) && (
                <Button
                  fullWidth
                  variant="contained"
                  disabled={loading || (!showPayOption && hasPackagePurchase) || !deliveryOk}
                  onClick={payAndBook}
                  sx={primaryButtonSx}
                >
                  {loading ? <CircularProgress size={24} /> : payButtonLabel}
                </Button>
              )}
              {showCaptureOption &&
                serviceItems.length > 0 &&
                productItems.length === 0 &&
                packageItems.length === 0 && (
                <Button
                  fullWidth
                  variant="outlined"
                  disabled={loading}
                  onClick={saveCardAndBook}
                  sx={outlineButtonSx}
                >
                  {loading ? <CircularProgress size={24} /> : "Save Card & Book"}
                </Button>
              )}
            </Stack>
          ) : (
            <Button
              fullWidth
              variant="contained"
              disabled={loading || !deliveryOk}
              onClick={bookWithoutPayment}
              sx={primaryButtonSx}
            >
              {loading ? <CircularProgress size={24} /> : bookButtonLabel}
            </Button>
          )}
        </>
      ) : (
        <>
          <form onSubmit={(e) => e.preventDefault()}>
            <TextField
              name="name"
              label="Your name"
              fullWidth
              required
              sx={{ mb: 2 }}
              value={guest.name}
              onChange={handleGuest}
            />
            <TextField
              name="email"
              type="email"
              label="Your email"
              fullWidth
              required
              sx={{ mb: 1 }}
              value={guest.email}
              onChange={handleGuest}
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setLoginDialogOpen(true)}
                sx={{ ...outlineButtonSx, width: { xs: "100%", sm: "auto" } }}
              >
                Already have an account? Log in
              </Button>

              <Button
                variant="text"
                size="small"
                onClick={() => setRegisterDialogOpen(true)}
                sx={{ ...textButtonSx, width: { xs: "100%", sm: "auto" } }}
              >
                Don't have an account? Sign up
              </Button>
            </Stack>

            {/* Guest buttons mirror the client section */}
            {showOnlinePayment ? (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                {(showPayOption || hasPackagePurchase) && (
                  <Button
                    fullWidth
                    variant="contained"
                    type="button"
                    disabled={loading || !guestOk || !deliveryOk || (!showPayOption && hasPackagePurchase)}
                    onClick={payAndBook}
                    sx={primaryButtonSx}
                  >
                    {loading ? <CircularProgress size={24} /> : payButtonLabel}
                  </Button>
                )}
                {showCaptureOption &&
                  serviceItems.length > 0 &&
                  productItems.length === 0 &&
                  packageItems.length === 0 && (
                  <Button
                    fullWidth
                    variant="outlined"
                    type="button"
                    disabled={loading || !guestOk}
                    onClick={saveCardAndBook}
                    sx={outlineButtonSx}
                  >
                    {loading ? <CircularProgress size={24} /> : "Save Card & Book"}
                  </Button>
                )}
              </Stack>
            ) : (
              <Button
                fullWidth
                variant="contained"
                type="button"
                disabled={loading || !guestOk || !deliveryOk}
                onClick={bookWithoutPayment}
                sx={primaryButtonSx}
              >
                {loading ? <CircularProgress size={24} /> : bookButtonLabel}
              </Button>
            )}
            {hasPackagePurchase && !showPayOption && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                Package purchases require online payment. Enable checkout to sell packages.
              </Typography>
            )}
          </form>
        </>
      )}

      {/* Footer actions */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} mt={2}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => {
            onRequestAddService?.();
            const target = slugLocal || companySlug;
            if (!target) return;
            const params = new URLSearchParams();
            params.set('page', 'services-classic');
            if (embedSuffix) {
              try {
                const extra = new URLSearchParams(embedSuffix.slice(1));
                extra.forEach((value, key) => params.set(key, value));
              } catch {}
            }
            const path = isCustomDomain ? "/" : `/${target}`;
            navigate({ pathname: path, search: `?${params.toString()}` });
          }}
          sx={outlineButtonSx}
        >
          Add Another Service
        </Button>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={openAddons}
          sx={outlineButtonSx}
        >
          Add-on(s)
        </Button>
        <Button fullWidth variant="text" onClick={onBack} sx={textButtonSx}>
          Back
        </Button>
      </Stack>
        </Stack>
      </Paper>

      {/* Dialog ?   choose service when multiple */}
      <Dialog open={dlgSvcOpen} onClose={() => setDlgSvcOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Select a service to add add-ons</DialogTitle>
        <DialogContent dividers>
          {cart.map((it) => (
            <ListItemButton key={it.id} onClick={() => pickService(it.id)}>
              {it.service_name}   {it.artist_name} ({it.date}   {it.start_time})
            </ListItemButton>
          ))}
        </DialogContent>
      </Dialog>

      {/* Dialog ?   add-on checklist */}
      <Dialog open={dlgAddonOpen} onClose={() => setDlgAddonOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{activeItem ? `Add-ons for ${activeItem.service_name}` : "Add-ons"}</DialogTitle>
        <DialogContent dividers sx={{ pt: 1 }}>
          {!activeItem ? (
            <CircularProgress />
          ) : addonOpts[activeItem.service_id]?.length ? (
            addonOpts[activeItem.service_id].map((ad, idx) => {
              const img = Array.isArray(ad.images) && ad.images.length > 0
                ? ad.images[0]?.url_public || ad.images[0]?.url || ad.images[0]?.source
                : null;
              return (
                <ListItem key={`${ad.id ?? 'addon'}-${idx}`} disablePadding sx={{ alignItems: "flex-start", py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                    <Checkbox
                      edge="start"
                      checked={getAddonIds(activeItem).includes(ad.id)}
                      onChange={() => toggleAddon(ad)}
                    />
                  </ListItemIcon>
                  {img && (
                    <Box
                      component="img"
                      src={img}
                      alt={ad.name || "Add-on"}
                      loading="lazy"
                      sx={{
                        width: 72,
                        height: 72,
                        objectFit: "cover",
                        borderRadius: 1.5,
                        mr: 2,
                        mt: 0.5,
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <ListItemText
                    primary={`${ad.name}     $${Number(ad.base_price).toFixed(2)}`}
                    secondary={ad.description || undefined}
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                </ListItem>
              );
            })
          ) : (
            <Typography>No add-ons available for this service.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlgAddonOpen(false)} sx={primaryButtonSx}>
            Done
          </Button>
        </DialogActions>
      </Dialog>

      <LoginDialog
        open={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        companySlug={companySlug}
      />
      <RegisterDialog
        open={registerDialogOpen}
        onClose={() => setRegisterDialogOpen(false)}
        onRegisterSuccess={handleRegisterSuccess}
        onOpenLogin={() => {
          setRegisterDialogOpen(false);
          setLoginDialogOpen(true);
        }}
        onOpenForgot={() => {
          setRegisterDialogOpen(false);
          setForgotDialogOpen(true);
        }}
        companySlug={companySlug}
      />
      <ForgotPasswordDialog
        open={forgotDialogOpen}
        onClose={() => setForgotDialogOpen(false)}
        companySlug={companySlug}
      />
      <PublicBookingUnavailableDialog
        open={publicUpgradeOpen}
        message={publicUpgradeMessage}
        contactEmail={companyContactEmail}
        contactPhone={companyContactPhone}
        onClose={() => setPublicUpgradeOpen(false)}
        onBack={() => {
          setPublicUpgradeOpen(false);
          onBack?.();
        }}
      />
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* Wrapper: initialize Stripe for pay-now OR card-on-file */
export default function Checkout(props) {
  const { disableShell = false, slugOverride } = props;
  const params = useParams();
  const urlPathFirst = (() => {
    try {
      const seg = (window.location.pathname || '').split('/').filter(Boolean)[0];
      return seg || null;
    } catch { return null; }
  })();
  const lsSite = (() => { try { return localStorage.getItem('site'); } catch { return null; } })();
  const pickSlug = (...cands) => {
    for (const c of cands) {
      if (!c) continue;
      return c;
    }
    return null;
  };
  const companySlug = pickSlug(props.companySlug, params.slug, lsSite, urlPathFirst);

  const [ready, setReady] = useState(false);
  const [sitePayload, setSitePayload] = useState(null);
  const [siteLoading, setSiteLoading] = useState(false);
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [cardOnFileEnabled, setCardOnFileEnabled] = useState(false);
  const [tipEnabled, setTipEnabled] = useState(true);
  const [displayCurrency, setDisplayCurrency] = useState(() => getActiveCurrency());
  const [policy, setPolicy] = useState(null);
  const [holdMinutes, setHoldMinutes] = useState(null);
  const [companyContactEmail, setCompanyContactEmail] = useState("");
  const [companyContactPhone, setCompanyContactPhone] = useState("");

  useEffect(() => {
    let mounted = true;

    if (!companySlug) {
      setReady(true);
      return () => { mounted = false; };
    }

    (async () => {
      try {
        const [infoRes, policyRes, reviewsRes] = await Promise.all([
          apiClient.get(`/public/${companySlug}/company-info`),
          apiClient.get(`/public/${companySlug}/payments-policy`).catch(() => ({ data: null })),
          apiClient.get(`/public/${companySlug}/reviews-settings`).catch(() => ({ data: null })),
        ]);
        if (!mounted) return;

        const info = infoRes?.data || {};
        const policyData = policyRes?.data || null;
        const reviewsData = reviewsRes?.data || null;

        const payNow = !!info?.enable_stripe_payments;
        const hasPublishable = Boolean(info?.stripe_publishable_key);
        const policyMode = (policyData?.mode || '').toLowerCase();
        const allowCardFlag = Boolean(info?.allow_card_on_file);
        const cardOnFile = Boolean(hasPublishable && !payNow && (allowCardFlag || policyMode === 'capture'));
        const hold = Number(info?.booking_hold_minutes ?? 0);

        setPaymentsEnabled(payNow);
        setCardOnFileEnabled(cardOnFile);
        setPolicy(policyData);
        setHoldMinutes(Number.isFinite(hold) && hold > 0 ? hold : null);
        setCompanyContactEmail(String(info?.contact_email || info?.email || "").trim());
        setCompanyContactPhone(String(info?.phone || "").trim());
        setTipEnabled(reviewsData?.include_tip_checkout !== false);

        const rawCurrency = normalizeCurrency(info?.display_currency);
        const inferredCurrency = resolveCurrencyForCountry(info?.country_code || info?.tax_country_code || '');
        const effectiveCurrency = rawCurrency || inferredCurrency || 'USD';
        setDisplayCurrency(effectiveCurrency);
        setActiveCurrency(effectiveCurrency);
      } catch {
        if (!mounted) return;
        setPaymentsEnabled(false);
        setCardOnFileEnabled(false);
        setPolicy(null);
        setHoldMinutes(null);
        setTipEnabled(true);
      } finally {
        if (mounted) setReady(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [companySlug]);

  useEffect(() => {
    let mounted = true;
    if (!companySlug) {
      setSitePayload(null);
      setSiteLoading(false);
      return () => {
        mounted = false;
      };
    }
    setSiteLoading(true);
    publicSite
      .getWebsiteShell(companySlug)
      .then((data) => {
        if (!mounted) return;
        setSitePayload(data || null);
      })
      .catch(() => {
        if (!mounted) return;
        setSitePayload(null);
      })
      .finally(() => {
        if (!mounted) return;
        setSiteLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [companySlug]);

  const renderShell = (node) => {
    if (disableShell) {
      return node;
    }
    if (!companySlug) {
      return node;
    }
    return (
      <SiteFrame
        slug={companySlug}
        activeKey="__basket"
        initialSite={sitePayload || undefined}
        disableFetch={Boolean(sitePayload)}
        wrapChildrenInContainer={false}
      >
        {node}
      </SiteFrame>
    );
  };

  if (!ready || (siteLoading && !sitePayload)) {
    return renderShell(
      <Box p={3} maxWidth={600} mx="auto">
        <CircularProgress />
      </Box>
    );
  }

  return renderShell(
    <CheckoutFormCore
      {...props}
      companySlug={companySlug}
      slugOverride={slugOverride}
      paymentsEnabled={paymentsEnabled}
      tipEnabled={tipEnabled}
      cardOnFileEnabled={cardOnFileEnabled}
      displayCurrency={displayCurrency}
      policy={policy}
      holdMinutes={holdMinutes}
      contactEmail={companyContactEmail}
      contactPhone={companyContactPhone}
    />
  );
}
