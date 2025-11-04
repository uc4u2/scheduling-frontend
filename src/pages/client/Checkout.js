// src/pages/client/Checkout.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { formatCurrency } from "../../utils/formatters";
import { setActiveCurrency, normalizeCurrency, resolveCurrencyForCountry, getActiveCurrency } from "../../utils/currency";
import { api as apiClient, API_BASE_URL } from "../../utils/api";
import { buildHostedCheckoutPayload, startHostedCheckout, releasePendingCheckout } from "../../utils/hostedCheckout";
import { CartTypes, loadCart, saveCart, clearCart } from "../../utils/cart";

import {
  Box,
  Typography,
  Alert,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  ListItemButton,
  Checkbox,
  ListItemIcon,
  Chip,
  MenuItem,
  Paper,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useTheme } from "@mui/material/styles";
import axios from "axios";
import PublicPageShell from "./PublicPageShell";

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

/* ------------------------------------------------------------------ */
/* LoginDialog component (unchanged) */
function LoginDialog({ open, onClose, onLoginSuccess }) {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const timezones = [
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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const selectedRole = "client";
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/login`, {
        email,
        password,
        role: selectedRole,
        timezone,
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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Client Login</DialogTitle>
      <DialogContent>
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

          <TextField
            select
            label="Timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            fullWidth
            margin="normal"
          >
            {timezones.map((tz) => (
              <MenuItem key={tz} value={tz}>
                {tz}
              </MenuItem>
            ))}
          </TextField>
        </form>
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
  );
}

/* ------------------------------------------------------------------ */
/* RegisterDialog component (unchanged) */
function RegisterDialog({ open, onClose, onRegisterSuccess }) {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const timezones = [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Berlin",
    "Europe/Paris",
    "Asia/Kolkla",
    "Asia/Tokyo",
    "Asia/Dubai",
    "Australia/Sydney",
  ];

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [timezone, setTimezone] = React.useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!firstName || !lastName || !email || !password) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${API_URL}/register`, {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        timezone,
        role: "client",
      });
      const loginRes = await axios.post(`${API_URL}/login`, {
        email,
        password,
        role: "client",
        timezone,
      });
      if (loginRes.data.access_token) {
        onRegisterSuccess(loginRes.data.access_token);
        onClose();
      } else {
        setError("Registration succeeded but login failed.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Client Sign Up</DialogTitle>
      <DialogContent>
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
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            margin="normal"
          />
          <TextField
            select
            label="Timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            fullWidth
            margin="normal"
          >
            {timezones.map((tz) => (
              <MenuItem key={tz} value={tz}>
                {tz}
              </MenuItem>
            ))}
          </TextField>
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
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
function CheckoutFormCore({
  companySlug,
  service,
  artist,
  slot,
  onSuccess,
  onBack,
  paymentsEnabled,
  cardOnFileEnabled,
  displayCurrency,
  policy,
  holdMinutes,
}) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const activePaymentMode = useMemo(() => {
    const mode = (policy?.mode || "").toLowerCase();
    if (paymentsEnabled) {
      if (mode === "deposit") return "deposit";
      return "pay";
    }
    if (cardOnFileEnabled) return "capture";
    return "off";
  }, [paymentsEnabled, cardOnFileEnabled, policy?.mode]);
  const showCaptureOption = activePaymentMode === "capture";
  const showPayOption = activePaymentMode === "pay" || activePaymentMode === "deposit";
  const showOnlinePayment = activePaymentMode !== "off";
  const payButtonLabel = activePaymentMode === "deposit" ? "Pay Deposit & Book" : "Pay & Book";

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
    return pick(companySlug, qsSlug, pathSlug);
  }, [companySlug]);
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
  const [cart, setCart] = useState([]);

  const [dlgSvcOpen, setDlgSvcOpen] = useState(false);
  const [dlgAddonOpen, setDlgAddonOpen] = useState(false);
  const [activeItemId, setActiveItemId] = useState(null);
  const [addonOpts, setAddonOpts] = useState({});

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(null);

  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");

  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);

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
    const saved = loadCart();
    let mutated = false;
    const normalized = saved.map((item) => {
      if (isProduct(item) || item?.hold_started_at) return item;
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

  const lineSubtotal = (item) => {
    if (isProduct(item)) {
      return Number(item.price || 0) * getQuantity(item);
    }
    return Number(item.price || 0) + getAddons(item).reduce((s, a) => s + Number(a.base_price || 0), 0);
  };

  const lineDiscount = (item) => {
    if (isProduct(item)) return 0;
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
    if (isProduct(item)) return { ...item };
    const i = { ...item };
    if (i.tip_mode === "percent") {
      i.tip_amount = Math.max(0, (Number(i.tip_value || 0) / 100) * lineSubtotal(i));
    }
    return i;
  };

  const serviceItems = useMemo(
    () => cart.filter((item) => !isProduct(item)),
    [cart]
  );
  const productItems = useMemo(
    () => cart.filter((item) => isProduct(item)),
    [cart]
  );

  const serviceSubtotal = serviceItems.reduce((sum, item) => sum + lineSubtotal(item), 0);
  const productSubtotal = productItems.reduce((sum, item) => sum + lineSubtotal(item), 0);
  const totalDiscount = serviceItems.reduce((sum, item) => sum + lineDiscount(item), 0);

  const tipAllowedNow = paymentsEnabled;
  const totalTip = tipAllowedNow
    ? serviceItems.reduce((sum, item) => sum + Number(item.tip_amount || 0), 0)
    : 0;

  const totalBeforeDiscount = serviceSubtotal + productSubtotal;
  const finalTotal = Math.max(0, serviceSubtotal - totalDiscount) + totalTip + productSubtotal;

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

  const removeItem = (id) => {
    const newCart = cart.filter((c) => c.id !== id);
    persist(newCart);
  };

  const guestOk =
    guest.name.trim() && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(guest.email.trim());

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
          if (isProduct(item)) return item;
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

      const anyValid = updatedCart.some((item) => !isProduct(item) && item.couponApplied);
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

  // UPDATED: accept optional setupIntentId too
  const bookServiceLines = async (
    paymentIntentId = null,
    setupIntentId = null,
    { shouldRethrow = false } = {}
  ) => {
    if (serviceItems.length === 0) return [];

    const compactCart = serviceItems.map(({ service_id, artist_id, date, start_time, addon_ids }) => ({
      service_id,
      artist_id,
      date,
      start_time,
      addon_ids,
    }));

    const headers = {
      "Idempotency-Key": window.crypto?.randomUUID?.() ?? String(Date.now()),
    };

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
        ...(paymentIntentId ? { payment_intent_id: paymentIntentId } : {}),
        ...(setupIntentId ? { setup_intent_id: setupIntentId } : {}),
        ...(it.couponApplied && it.coupon ? { coupon_code: it.coupon.code } : {}),
        tip_amount: paymentsEnabled ? Number((it.tip_amount || 0).toFixed(2)) : 0,
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
        if (err?.response?.status === 409 && data) {
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
    const payload = {
      items: productItems.map((item) => ({
        product_id: Number(item.product_id ?? String(item.id).replace(/^product-/, "")),
        quantity: getQuantity(item),
      })),
      client_name: client?.full_name || guest.name,
      client_email: client?.email || guest.email,
      payment_intent_id: paymentIntentId,
      setup_intent_id: setupIntentId,
      allow_unpaid: allowUnpaid,
      currency: (normalizeCurrency(displayCurrency) || "USD").toLowerCase(),
    };

    try {
      const { data } = await apiClient.post(
        `/public/${slugLocal}/buy-products`,
        payload
      );
      return data;
    } catch (error) {
      const msg = error?.response?.data?.error || error.message || "Product order failed";
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
    onSuccess?.(serviceResults[0] || null);
  };
  const bookWithoutPayment = async (e) => {
    e?.preventDefault?.();
    if (loading) return;
    if (!slugLocal) {
      setErr("Unable to determine company. Please reload the page or navigate from the site home.");
      return;
    }
    if (serviceItems.length === 0 && productItems.length === 0) {
      setErr("Your cart is empty.");
      return;
    }
    if (finalTotal <= 0) {
      setErr("Cart total must be greater than zero.");
      return;
    }
    if (serviceItems.length > 0 && productItems.length > 0) {
      setErr("Services and retail products must be checked out separately. Please complete one checkout before starting another.");
      return;
    }
    setErr("");
    setLoading(true);
    try {
      const serviceResults = await bookServiceLines();
      if (!serviceResults.length) {
        return;
      }

      const productOrder = normalizeProductOrder(await submitProductOrder({ allowUnpaid: true }));
      finalizeSuccess({ serviceResults, productOrder });
    } catch (ex) {
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

    if (serviceItems.length === 0 && productItems.length === 0) {
      setErr("Your cart is empty.");
      return;
    }
    if (finalTotal <= 0) {
      setErr("Cart total must be greater than zero.");
      return;
    }
    if (serviceItems.length > 0 && productItems.length > 0) {
      setErr("Services and retail products must be checked out separately. Please complete one checkout before starting another.");
      return;
    }

    setErr("");
    setLoading(true);

    try {
      const policyMode = activePaymentMode === "deposit" ? "deposit" : "pay";

      const payload = buildHostedCheckoutPayload({
        cartItems: cart,
        policyMode,
        currency: displayCurrency,
        clientName: client?.full_name || guest.name,
        clientEmail: client?.email || guest.email,
        metadata: { source: "checkout", flow: policyMode },
      });

      await startHostedCheckout({
        slug,
        payload,
      });
    } catch (ex) {
      const message = ex?.response?.data?.error || ex?.message || "Unable to start Stripe Checkout.";
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
      setErr("Please add at least one service to continue.");
      return;
    }
    if (productItems.length > 0) {
      setErr("Saving a card on file is only available for service bookings. Please remove products to continue.");
      return;
    }

    setErr("");
    setLoading(true);

    try {
      const payload = buildHostedCheckoutPayload({
        cartItems: cart,
        policyMode: "capture",
        currency: displayCurrency,
        clientName: client?.full_name || guest.name,
        clientEmail: client?.email || guest.email,
        metadata: { source: "checkout", flow: "capture" },
      });

      await startHostedCheckout({
        slug,
        payload,
      });
    } catch (ex) {
      const message = ex?.response?.data?.error || ex?.message || "Unable to start Stripe Checkout.";
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
    syncClientFromToken(token);
  };

  const handleRegisterSuccess = (token) => {
    localStorage.setItem("token", token);
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
      navigate({ pathname: `/${slugLocal}/products`, search });
    };
    const goBookings = () => {
      if (!slugLocal) return;
      const search = buildSearch({ page: 'my-bookings' });
      navigate({ pathname: `/${slugLocal}`, search });
    };
    const goHome = () => {
      if (!slugLocal) return;
      const search = buildSearch();
      navigate({ pathname: `/${slugLocal}`, search });
    };
    const disableNav = !slugLocal;

    return (
      <Box py={{ xs: 6, md: 8 }} px={{ xs: 2, md: 0 }} maxWidth={720} mx="auto">
        <Paper elevation={4} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4 }}>
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
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography color="text.secondary">Total</Typography>
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
              <Button variant="contained" onClick={goProducts} disabled={disableNav}>
                Continue shopping
              </Button>
              {serviceResults.length > 0 && (
                <Button variant="outlined" onClick={goBookings} disabled={disableNav}>
                  View my bookings
                </Button>
              )}
              <Button variant="text" onClick={goHome} disabled={disableNav}>
                Back to home
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Box>
    );
  }

  return (
    <Box p={3} maxWidth={600} mx="auto">
      <Typography variant="h4" gutterBottom>
        Checkout
      </Typography>

      {typeof holdMinutes === "number" && holdMinutes > 0 && serviceItems.length > 0 && holdState.overall !== null && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="body2" sx={{ mt: 1.5 }}>
            {holdState.overall > 0
              ? `We're holding your selected times for ${formatHoldCountdown(holdState.overall)}. Complete checkout before the timer runs out or the slots will be released.`
              : "The hold window has expired. If you continue, the selected times may no longer be available."}
          </Typography>
        </Paper>
      )}

      {/* Cart */}
      <List
        sx={{
          mb: 2,
          border: 1,
          borderColor: "divider",
          borderRadius: theme.shape.borderRadius,
        }}
      >
        {cart.map((it) => {
          const subtotal = lineSubtotal(it);

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
                              sx={{ width: 140, mr: 2 }}
                            />
                          ) : (
                            <TextField
                              label="Custom tip ($)"
                              type="number"
                              size="small"
                              value={it.tip_amount || ""}
                              onChange={(e) => setTipAmount(it.id, Number(e.target.value || 0))}
                              inputProps={{ min: 0, step: "0.01" }}
                              sx={{ width: 160, mr: 2 }}
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
        <ListItem>
          <TextField
            label="Coupon code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            size="small"
            sx={{ mr: 1, maxWidth: 220 }}
            error={!!couponError}
            helperText={couponError}
          />
          <Button variant="outlined" onClick={applyCoupon} disabled={loading || !couponCode.trim()}>
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
        {paymentsEnabled && (
          <ListItem>
            <Typography variant="body2" color="text.secondary">
              Tax is calculated during Stripe checkout and itemized on your receipt.
            </Typography>
          </ListItem>
        )}
        <ListItem>
          <Typography variant="h6">Total: {formatCurrency(finalTotal, currencyCode)}</Typography>
        </ListItem>
      </List>

      {err && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {err}
        </Alert>
      )}

      {/* Card   show when either pay-now or card-on-file is enabled */}
      {activePaymentMode !== "off" ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          {activePaymentMode === "capture"
            ? "We'll save your card securely with Stripe. You'll be charged later by the manager."
            : "You'll enter your payment details on Stripe's secure checkout page."}
        </Alert>
      ) : (
        <Alert severity="info" sx={{ mb: 2 }}>
          Online payments are currently disabled for this company. Your booking will be created as <strong>unpaid</strong>.
        </Alert>
      )}

      {/* Auth section with login & sign up buttons */}
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
          {showOnlinePayment ? (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 1 }}>
              {showPayOption && (
                <Button fullWidth variant="contained" disabled={loading} onClick={payAndBook}>
                  {loading ? <CircularProgress size={24} /> : payButtonLabel}
                </Button>
              )}
              {showCaptureOption && (
                <Button fullWidth variant="outlined" disabled={loading} onClick={saveCardAndBook}>
                  {loading ? <CircularProgress size={24} /> : "Save Card & Book"}
                </Button>
              )}
            </Stack>
          ) : (
            <Button fullWidth variant="contained" disabled={loading} onClick={bookWithoutPayment}>
              {loading ? <CircularProgress size={24} /> : "Book"}
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

            <Button
              variant="text"
              size="small"
              onClick={() => setLoginDialogOpen(true)}
              sx={{ mb: 1, textTransform: "none" }}
            >
              Already have an account? Log in
            </Button>

            <Button
              variant="text"
              size="small"
              onClick={() => setRegisterDialogOpen(true)}
              sx={{ mb: 2, textTransform: "none" }}
            >
              Don't have an account? Sign up
            </Button>

            {/* Guest buttons mirror the client section */}
            {showOnlinePayment ? (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                {showPayOption && (
                  <Button
                    fullWidth
                    variant="contained"
                    type="button"
                    disabled={loading || !guestOk}
                    onClick={payAndBook}
                  >
                    {loading ? <CircularProgress size={24} /> : payButtonLabel}
                  </Button>
                )}
                {showCaptureOption && (
                  <Button
                    fullWidth
                    variant="outlined"
                    type="button"
                    disabled={loading || !guestOk}
                    onClick={saveCardAndBook}
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
                disabled={loading || !guestOk}
                onClick={bookWithoutPayment}
              >
                {loading ? <CircularProgress size={24} /> : "Book"}
              </Button>
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
            navigate({ pathname: `/${target}`, search: `?${params.toString()}` });
          }}
        >
          Add Another Service
        </Button>
        <Button fullWidth variant="outlined" startIcon={<AddIcon />} onClick={openAddons}>
          Add-on(s)
        </Button>
        <Button fullWidth variant="text" onClick={onBack}>
          Back
        </Button>
      </Stack>

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
          <Button onClick={() => setDlgAddonOpen(false)}>Done</Button>
        </DialogActions>
      </Dialog>

      <LoginDialog
        open={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
      <RegisterDialog
        open={registerDialogOpen}
        onClose={() => setRegisterDialogOpen(false)}
        onRegisterSuccess={handleRegisterSuccess}
      />
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* Wrapper: initialize Stripe for pay-now OR card-on-file */
export default function Checkout(props) {
  const { disableShell = false } = props;
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
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [cardOnFileEnabled, setCardOnFileEnabled] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState(() => getActiveCurrency());
  const [policy, setPolicy] = useState(null);
  const [holdMinutes, setHoldMinutes] = useState(null);

  useEffect(() => {
    let mounted = true;

    if (!companySlug) {
      setReady(true);
      return () => { mounted = false; };
    }

    (async () => {
      try {
        const [infoRes, policyRes] = await Promise.all([
          apiClient.get(`/public/${companySlug}/company-info`),
          apiClient.get(`/public/${companySlug}/payments-policy`).catch(() => ({ data: null })),
        ]);
        if (!mounted) return;

        const info = infoRes?.data || {};
        const policyData = policyRes?.data || null;

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
      } finally {
        if (mounted) setReady(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [companySlug]);

  const renderShell = (node) => {
    if (disableShell) {
      return node;
    }
    return (
      <PublicPageShell activeKey="__basket" slugOverride={companySlug || undefined}>
        {node}
      </PublicPageShell>
    );
  };

  if (!ready) {
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
      paymentsEnabled={paymentsEnabled}
      cardOnFileEnabled={cardOnFileEnabled}
      displayCurrency={displayCurrency}
      policy={policy}
      holdMinutes={holdMinutes}
    />
  );
}
