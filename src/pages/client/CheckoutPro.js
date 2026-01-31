// src/pages/client/CheckoutPro.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box, Paper, Typography, Tabs, Tab, Stack, Chip, Divider, List, ListItem,
  ListItemText, Button, Alert, CircularProgress, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  ListItemButton, Checkbox, ListItemIcon
} from "@mui/material";
import { api } from "../../utils/api";
import { buildHostedCheckoutPayload, startHostedCheckout } from "../../utils/hostedCheckout";
import { CartTypes } from "../../utils/cart";
import { formatCurrency } from "../../utils/formatters";
import { setActiveCurrency, normalizeCurrency, resolveCurrencyForCountry, resolveActiveCurrencyFromCompany, getActiveCurrency } from "../../utils/currency";
import PublicBookingUnavailableDialog from "../../components/billing/PublicBookingUnavailableDialog";

// ---------- tiny helpers ----------
const useQuery = () => new URLSearchParams(useLocation().search);

function readCartFromSession() {
  try {
    const raw = sessionStorage.getItem("booking_cart");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function computeCartTotals(cart) {
  const lineSubtotal = (i) =>
    Number(i.price || 0) + (i.addons || []).reduce((s, a) => s + Number(a.base_price || 0), 0);
  const lineDiscount = (i) => {
    if (!i.couponApplied || !i.coupon) return 0;
    const base = lineSubtotal(i);
    if (i.coupon.discount_percent != null) {
      const pct = Number(i.coupon.discount_percent || 0);
      if (pct > 0) return (pct / 100) * base;
    }
    if (i.coupon.discount_fixed != null) {
      return Math.min(Number(i.coupon.discount_fixed || 0), base);
    }
    return 0;
  };
  const subtotal = cart.reduce((s, i) => s + lineSubtotal(i), 0);
  const discount = cart.reduce((s, i) => s + lineDiscount(i), 0);
  const tip = cart.reduce((s, i) => s + Number(i.tip_amount || 0), 0);
  const total = Math.max(0, subtotal - discount) + tip;
  return { subtotal, discount, tip, total };
}

// ---------- CheckoutShell (no Stripe hooks here) ----------
function CheckoutShell({
  slug,
  paymentsEnabled,
  cardOnFileEnabled,
  policy,
  contactEmail,
  contactPhone,
  onBooked,
}) {
  const nav = useNavigate();
  const [cart, setCart] = useState(readCartFromSession());
  const [totals, setTotals] = useState(computeCartTotals(cart));
  const hasServiceItems = useMemo(() => cart.some((item) => (item?.type || CartTypes.SERVICE) === CartTypes.SERVICE), [cart]);
  const hasProductItems = useMemo(() => cart.some((item) => (item?.type || CartTypes.SERVICE) === CartTypes.PRODUCT), [cart]);
  const mixedCart = hasServiceItems && hasProductItems;

  const [displayCurrency, setDisplayCurrency] = useState(() => getActiveCurrency());
  const [publicUpgradeOpen, setPublicUpgradeOpen] = useState(false);
  const [publicUpgradeMessage, setPublicUpgradeMessage] = useState("");
  const formatMoney = useCallback((value, currencyCode) => formatCurrency(value, currencyCode || displayCurrency), [displayCurrency]);
  const currencyFmt = useCallback((value, currencyCode) => formatMoney(value, currencyCode), [formatMoney]);
  const accentColor = "var(--page-btn-bg, var(--sched-primary))";
  const accentContrast = "var(--page-btn-color, #ffffff)";
  const softBg = "var(--page-btn-bg-soft, rgba(15,23,42,0.12))";
  const borderColor = "var(--page-border-color, rgba(15,23,42,0.12))";
  const surfaceColor = "var(--page-card-bg, var(--page-secondary-bg, var(--page-surface-bg, #ffffff)))";
  const bodyColor = "var(--page-body-color, inherit)";
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
    borderRadius: "var(--page-btn-radius, 12px)",
    textTransform: "none",
    fontWeight: 600,
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
  const tabsSx = {
    minHeight: 48,
    borderRadius: 3,
    backgroundColor: "var(--page-btn-bg-soft, rgba(15,23,42,0.08))",
    px: 1,
    "& .MuiTabs-indicator": { display: "none" },
    "& .MuiTab-root": {
      minHeight: 40,
      textTransform: "none",
      fontWeight: 600,
      borderRadius: 999,
      mr: 1,
      color: bodyColor,
      opacity: 1,
      border: `1px solid ${borderColor}`,
      transition: "all .2s ease",
      "&.Mui-selected": {
        backgroundColor: accentColor,
        color: accentContrast,
        borderColor: accentColor,
        boxShadow: buttonShadow,
      },
      "&.Mui-focusVisible": focusRing,
      "&:focus-visible": focusRing,
    },
  };
  const infoBannerSx = {
    backgroundColor: softBg,
    color: bodyColor,
    border: `1px solid ${borderColor}`,
    "& .MuiAlert-icon": { color: accentColor },
  };

  const defaultActive = useMemo(() => {
    const mode = (policy?.mode || "pay").toLowerCase();
    if (mode === "off") return cardOnFileEnabled ? "capture" : "off";
    if (mode === "capture" && cardOnFileEnabled) return "capture";
    if (mode === "deposit" && paymentsEnabled) return "deposit";
    if (mode === "pay" && paymentsEnabled) return "pay";
    if (paymentsEnabled) return "pay";
    if (cardOnFileEnabled) return "capture";
    return "off";
  }, [paymentsEnabled, cardOnFileEnabled, policy?.mode]);

  const [active, setActive] = useState(defaultActive);

  const [client, setClient] = useState(null);
  const [guest, setGuest] = useState({ name: "", email: "" });

  const [quote, setQuote] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  // UI state: Add-ons dialog & coupon entry
  const [addonsOpen, setAddonsOpen] = useState(false);
  const [addonsFor, setAddonsFor] = useState(null); // item object
  const [addonOptions, setAddonOptions] = useState([]); // fetched options for the service
  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState("");

  // hydrate client
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    api.get("/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        if (!data?.email) return;
        setClient(data);
        const full = data.full_name || `${data.first_name || ""} ${data.last_name || ""}`.trim();
        setGuest({ name: full, email: data.email });
      })
      .catch(() => setClient(null));
  }, []);

  // recompute totals on cart change
  useEffect(() => {
    setTotals(computeCartTotals(cart));
  }, [cart]);

  // ask server for a quote (single source of truth for money)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setError("");
        const payload = {
          items: cart.map(i => ({
            service_id: i.service_id,
            artist_id: i.artist_id,
            date: i.date,
            start_time: i.start_time,
            addon_ids: i.addon_ids || [],
            coupon_code: i.couponApplied && i.coupon ? i.coupon.code : null,
            tip_amount: Number(i.tip_amount || 0),
            line_price: Number(i.price || 0),
          })),
          policy_override: null,
        };
        const { data } = await api.post(`/public/${slug}/checkout/quote`, payload);
        if (mounted) setQuote(data);
      } catch {
        if (mounted) setQuote(null);
      }
    })();
    return () => { mounted = false; };
  }, [slug, cart, policy?.mode]);

  useEffect(() => {
    const quoteCurrency = normalizeCurrency(
      quote?.currency ||
      quote?.stripe_currency ||
      quote?.cart_currency ||
      (Array.isArray(quote?.line_items) && quote.line_items[0]?.currency)
    );
    const policyCurrency = normalizeCurrency(policy?.currency);
    const companyCurrency = resolveActiveCurrencyFromCompany(quote?.company);
    const inferredCurrency = resolveCurrencyForCountry(
      quote?.company?.country_code ||
      quote?.company?.tax_country_code ||
      policy?.country_code ||
      ""
    );
    const effectiveCurrency =
      quoteCurrency ||
      policyCurrency ||
      companyCurrency ||
      inferredCurrency ||
      displayCurrency ||
      "USD";
    const normalizedCurrency = normalizeCurrency(effectiveCurrency) || "USD";
    if (normalizedCurrency !== displayCurrency) {
      setDisplayCurrency(normalizedCurrency);
      setActiveCurrency(normalizedCurrency);
    }
  }, [quote, policy, displayCurrency]);

  // ---- values used during render (must be declared BEFORE any early return) ----
  const { subtotal, discount, tip, total } = totals;

  // Prefer server numbers when available
  const grandTotalCents = useMemo(() => {
    // The quote may have total_cents (balance + tip) or a grand_total — account for both.
    if (quote?.total_cents != null) return Number(quote.total_cents);
    if (quote?.grand_total_cents != null) return Number(quote.grand_total_cents);
    // fallback to client calc
    return Math.round(Number(total || 0) * 100);
  }, [quote, total]);

  const depositDueCents = Number(quote?.deposit_due_cents || 0);
  const depositDue = depositDueCents / 100;

  const tabs = useMemo(() => ([
    paymentsEnabled && { key: "pay", label: "Pay Now" },
    paymentsEnabled && policy?.mode === "deposit" && { key: "deposit", label: "Deposit" },
    cardOnFileEnabled && { key: "capture", label: "Capture Card" },
    { key: "off", label: "No Online Payment" },
  ].filter(Boolean)), [paymentsEnabled, cardOnFileEnabled, policy?.mode]);

  const userSelectedRef = useRef(false);

  // guard: if selected tab disappears, snap to a valid tab
  useEffect(() => {
    if (!tabs.length) return;
    if (!tabs.some((t) => t.key === active)) {
      userSelectedRef.current = false;
      setActive(tabs[0].key);
    }
  }, [active, tabs]);

  // align initial selection with policy when the user hasn't chosen yet
  useEffect(() => {
    if (!tabs.length) return;
    if (userSelectedRef.current) return;
    const desired = defaultActive;
    if (!tabs.some((t) => t.key === desired)) return;
    if (desired === active) return;
    userSelectedRef.current = false;
    setActive(desired);
  }, [active, defaultActive, tabs]);

  // ----- Add-ons helpers -----
  const openAddons = async (item) => {
    try {
      const { data } = await api.get(`/public/${slug}/service/${item.service_id}/addons`);
      setAddonOptions(Array.isArray(data?.addons) ? data.addons : []);
      setAddonsFor(item);
      setAddonsOpen(true);
    } catch {
      setAddonOptions([]);
      setAddonsFor(item);
      setAddonsOpen(true);
    }
  };

  const toggleAddon = (aid) => {
    if (!addonsFor) return;
    setCart(prev => prev.map(i => {
      if (i.id !== addonsFor.id) return i;
      const has = (i.addon_ids || []).includes(aid);
      const nextIds = has ? i.addon_ids.filter(x => x !== aid) : [...(i.addon_ids || []), aid];
      // keep a light copy of selected add-on details for display
      const detail = addonOptions.find(a => a.id === aid);
      const nextAdds = has
        ? (i.addons || []).filter(a => a.id !== aid)
        : [...(i.addons || []), { id: detail.id, name: detail.name, base_price: Number(detail.base_price || detail.price || 0), duration: detail.duration }];
      return { ...i, addon_ids: nextIds, addons: nextAdds };
    }));
  };

  // ----- Tip helpers -----
  const setTip = (itemId, dollars) => {
    setCart(prev => prev.map(i => i.id === itemId ? { ...i, tip_amount: Math.max(0, Number(dollars || 0)) } : i));
  };

  // ----- Coupon helpers -----
  const applyCouponAll = async () => {
    const code = (couponInput || "").trim().toUpperCase();
    if (!code) {
      setCouponMsg("Enter a code first.");
      return;
    }
    // We trust the quote API to accept/deny per line; no hard fail here.
    setCart(prev => prev.map(i => ({ ...i, couponApplied: true, coupon: { code } })));
    setCouponMsg("Coupon applied (subject to service rules).");
  };

  const clearCouponAll = () => {
    setCart(prev => prev.map(i => ({ ...i, couponApplied: false, coupon: null })));
    setCouponMsg("Coupon cleared.");
  };

  // Hosted checkout & fallback flows
  const bookEachLine = async (extraPayload = {}) => {
    let first = null;
    for (const it of cart) {
      const payload = {
        service_id: it.service_id,
        artist_id: it.artist_id,
        date: it.date,
        start_time: it.start_time,
        addon_ids: it.addon_ids || [],
        client_name: client?.full_name || guest.name,
        client_email: client?.email || guest.email,
        tip_amount: Number((it.tip_amount || 0).toFixed(2)),
        ...(it.couponApplied && it.coupon ? { coupon_code: it.coupon.code } : {}),
        ...extraPayload,
      };
      const { data: res } = await api.post(`/public/${slug}/book`, payload);
      if (!first && res?.appointment_id) first = res;
    }
    sessionStorage.removeItem("booking_cart");
    // Persist confirmation payload for the BookingConfirmation page to read
    if (first) {
      try { sessionStorage.setItem("booking_confirmation", JSON.stringify(first)); } catch { /* noop */ }
    }
    setDone(true);
    onBooked?.(first);
  };

  const launchHostedCheckout = async (mode) => {
    if (!cart.length) {
      throw new Error("Your cart is empty.");
    }
    if (mixedCart) {
      const err = new Error("Services and retail products must be checked out separately. Please complete one checkout before starting another.");
      setError(err.message);
      throw err;
    }

    const payload = buildHostedCheckoutPayload({
      cartItems: cart,
      policyMode: mode,
      currency: displayCurrency,
      clientName: client?.full_name || guest.name,
      clientEmail: client?.email || guest.email,
      clientPhone: client?.phone || guest.phone,
      metadata: { source: "checkout-pro", mode },
    });

    await startHostedCheckout({
      slug,
      payload,
    });
  };


  const confirmPayNow = async () => {
    setBusy(true);
    setError("");
    try {
      await launchHostedCheckout("pay");
    } catch (ex) {
      const data = ex?.response?.data || {};
      if (ex?.response?.status === 402 && data?.error === "subscription_required") {
        setPublicUpgradeMessage(data?.message || "");
        setPublicUpgradeOpen(true);
        return;
      }
      const message = data?.error || ex?.message || "Checkout failed";
      setError(message);
      throw ex;
    } finally {
      setBusy(false);
    }
  };

  const confirmDeposit = async () => {
    setBusy(true);
    setError("");
    try {
      const dueCents = depositDueCents;
      if (dueCents <= 0) {
        await launchHostedCheckout("pay");
      } else {
        await launchHostedCheckout("deposit");
      }
    } catch (ex) {
      const data = ex?.response?.data || {};
      if (ex?.response?.status === 402 && data?.error === "subscription_required") {
        setPublicUpgradeMessage(data?.message || "");
        setPublicUpgradeOpen(true);
        return;
      }
      const message = data?.error || ex?.message || "Deposit not captured";
      setError(message);
      throw ex;
    } finally {
      setBusy(false);
    }
  };

  const confirmCaptureCard = async () => {
    setBusy(true);
    setError("");
    try {
      await launchHostedCheckout("capture");
    } catch (ex) {
      const data = ex?.response?.data || {};
      if (ex?.response?.status === 402 && data?.error === "subscription_required") {
        setPublicUpgradeMessage(data?.message || "");
        setPublicUpgradeOpen(true);
        return;
      }
      const message = data?.error || ex?.message || "Card authorization failed";
      setError(message);
      throw ex;
    } finally {
      setBusy(false);
    }
  };

  const confirmUnpaid = async () => {
    await bookEachLine({});
  };

  const onSubmit = async () => {
    setError("");
    setBusy(true);
    try {
      if (active === "pay") {
        if (!paymentsEnabled) return confirmUnpaid();
        await confirmPayNow();
      } else if (active === "deposit") {
        if (!paymentsEnabled) return confirmUnpaid();
        await confirmDeposit();
      } else if (active === "capture") {
        if (!cardOnFileEnabled) return confirmUnpaid();
        await confirmCaptureCard();
      } else {
        await confirmUnpaid();
      }
    } catch (e) {
      setError(e?.message || "Checkout failed");
    } finally {
      setBusy(false);
    }
  };

  // success view (AFTER all hooks)
  if (done) {
    return (
      <Box p={3} maxWidth={720} mx="auto">
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="h5" sx={{ mb: 1 }}>Booking confirmed 🎉</Typography>
          <Typography>We’ve sent you a confirmation email.</Typography>
        </Alert>
        <Button
          variant="contained"
          onClick={() => nav({ pathname: `/${slug}`, search: '?page=services-classic' })}
          sx={primaryButtonSx}
        >
          Book Another
        </Button>
      </Box>
    );
  }

  const policyBadge =
    policy?.mode === "deposit" ? <Chip size="small" label="Deposit required" color="warning" /> :
    policy?.mode === "capture" ? <Chip size="small" label="Card on file required" color="info" /> :
    policy?.mode === "off"     ? <Chip size="small" label="Online payment optional" color="default" /> :
                                 null;

  const activeUsesStripe = (
    (active === "capture" && cardOnFileEnabled) ||
    ((active === "pay" || active === "deposit") && paymentsEnabled)
  );

  const stripeAlertCopy = active === "capture"
    ? "We'll save your card securely with Stripe. You'll be charged later by the manager."
    : "You'll enter your payment details on Stripe's secure checkout page.";

  // UI helpers (tip chips)
  const TipChips = ({ item }) => {
    const base = (Number(item.price || 0) + (item.addons || []).reduce((s,a)=>s+Number(a.base_price||0),0));
    const setPct = (p) => setTip(item.id, (base * p / 100).toFixed(2));
    return (
      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
        <Chip label="No tip" onClick={() => setTip(item.id, 0)} />
        <Chip label="10%" onClick={() => setPct(10)} />
        <Chip label="15%" onClick={() => setPct(15)} />
        <Chip label="20%" onClick={() => setPct(20)} />
        <TextField
          size="small"
          type="number"
          inputProps={{ min: 0, step: "0.01" }}
          value={Number(item.tip_amount || 0)}
          onChange={(e) => setTip(item.id, e.target.value)}
          label={`Custom tip (${displayCurrency})`}
          sx={{ width: 140 }}
        />
      </Stack>
    );
  };

  return (
    <Box p={2}>
      <Box maxWidth={980} mx="auto">
        <Typography variant="h4" gutterBottom>Checkout (Pro)</Typography>
        {policyBadge}

        <Paper
          sx={{
            mt: 2,
            p: { xs: 2, md: 3 },
            borderRadius: 3,
            border: `1px solid ${borderColor}`,
            backgroundColor: surfaceColor,
            boxShadow: "var(--page-card-shadow, 0 18px 45px rgba(15,23,42,0.08))",
          }}
        >
          <Tabs
            value={active}
            onChange={(_, v) => {
              userSelectedRef.current = true;
              setActive(v);
            }}
            variant="scrollable"
            scrollButtons="auto"
            sx={tabsSx}
            TabIndicatorProps={{ sx: { display: "none" } }}
          >
            {tabs.map(t => <Tab key={t.key} value={t.key} label={t.label} />)}
          </Tabs>

          <Divider sx={{ my: 2 }} />

          {/* Cart summary with editors */}
          <List dense>
            {cart.map((it) => {
              const addons = it.addons || [];
              const line = Number(it.price || 0) + addons.reduce((s, a) => s + Number(a.base_price || 0), 0);
              const disc = it.couponApplied && it.coupon
                ? (it.coupon.discount_percent ? (Number(it.coupon.discount_percent)/100)*line
                   : Math.min(Number(it.coupon.discount_fixed||0), line))
                : 0;
              const tipLine = Number(it.tip_amount || 0);
              const lineTotal = Math.max(0, line - disc) + tipLine;
              return (
                <ListItem key={it.id} divider alignItems="flex-start" sx={{ flexDirection: "column", alignItems: "stretch" }}>
                  <Stack direction="row" sx={{ width: "100%" }} spacing={2} justifyContent="space-between">
                    <ListItemText
                      primary={`${it.service_name} — ${it.artist_name}`}
                      secondary={
                        <span>
                          {it.date} • {it.start_time}
                          {addons.length ? (
                            <>
                              <br />
                              {addons.map(a => `+ ${a.name} (${currencyFmt(a.base_price)})`).join("  ")}
                            </>
                          ) : null}
                          {it.couponApplied && it.coupon ? (
                            <>
                              <br />
                              Coupon: <b>{it.coupon.code}</b>
                            </>
                          ) : null}
                        </span>
                      }
                    />
                    <Stack alignItems="flex-end" minWidth={160}>
                      <Typography variant="body2">{currencyFmt(line)}</Typography>
                      {!!disc && <Typography variant="caption">−{currencyFmt(disc)}</Typography>}
                      {!!tipLine && <Typography variant="caption">+{currencyFmt(tipLine)} tip</Typography>}
                      <Typography variant="subtitle2">{currencyFmt(lineTotal)}</Typography>
                    </Stack>
                  </Stack>

                  {/* Row actions: Add-ons + Tip */}
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => openAddons(it)}
                      sx={{ ...outlineButtonSx, px: 1.5, py: 0.5 }}
                    >
                      Edit add-ons
                    </Button>
                    <TipChips item={it} />
                  </Stack>
                </ListItem>
              );
            })}
          </List>

          {/* Coupon row */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
            <TextField
              label="Coupon code"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              sx={{ maxWidth: 260 }}
            />
            <Button variant="outlined" onClick={applyCouponAll} sx={outlineButtonSx}>
              Apply to all lines
            </Button>
            <Button variant="text" onClick={clearCouponAll} sx={textButtonSx}>
              Clear coupon
            </Button>
            {couponMsg && <Typography variant="body2" sx={{ alignSelf: "center" }}>{couponMsg}</Typography>}
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* Totals (client calc shown; charge will use server quote) */}
          <Stack direction="row" spacing={2} justifyContent="flex-end" flexWrap="wrap">
            <Typography>Subtotal: <b>{currencyFmt(subtotal)}</b></Typography>
            <Typography>Discount: <b>−{currencyFmt(discount)}</b></Typography>
            <Typography>Tip: <b>+{currencyFmt(tip)}</b></Typography>
            <Typography>Total: <b>{currencyFmt(grandTotalCents / 100)}</b></Typography>
          </Stack>

          {mixedCart && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Services and retail products must be checked out separately. Please finish one checkout before starting another.
            </Alert>
          )}

          {/* payment area */}
          <Box sx={{ mt: 2 }}>
            {activeUsesStripe ? (
              <Alert severity="info" sx={{ mb: 2, ...infoBannerSx }}>
                {stripeAlertCopy}
              </Alert>
            ) : (
              <Alert sx={{ my: 1, ...infoBannerSx }} severity="info">
                No online payment&mdash;your booking will be created as <b>unpaid</b>.
              </Alert>
            )}

            {active === "deposit" && (
              <Alert sx={{ my: 1 }} severity="warning">
                Deposit due now: <b>{currencyFmt(depositDue)}</b>
                {quote?.threshold_cents ? <> (applies for totals ≥ {currencyFmt(quote.threshold_cents / 100)})</> : null}
              </Alert>
            )}

            {error && <Alert sx={{ my: 1 }} severity="error">{error}</Alert>}

            {/* Guest identity */}
            {!client && (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 1 }}>
                <TextField
                  label="Your name"
                  fullWidth
                  value={guest.name}
                  onChange={(e) => setGuest(prev => ({ ...prev, name: e.target.value }))}
                />
                <TextField
                  label="Your email"
                  type="email"
                  fullWidth
                  value={guest.email}
                  onChange={(e) => setGuest(prev => ({ ...prev, email: e.target.value }))}
                />
              </Stack>
            )}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
              <Button
                variant="contained"
                onClick={onSubmit}
                disabled={busy || mixedCart}
                sx={primaryButtonSx}
              >
                {busy ? <CircularProgress size={22} /> :
                  active === "pay" ? `Pay Now & Book (${currencyFmt(grandTotalCents/100)})` :
                  active === "deposit" ? `Pay Deposit & Book (${currencyFmt(depositDue)})` :
                  active === "capture" ? "Save Card & Book" :
                  "Book"}
              </Button>
              <Button
                variant="text"
                onClick={() => nav({ pathname: `/${slug}`, search: '?page=services-classic' })}
                sx={textButtonSx}
              >
                Add Another Service
              </Button>
            </Stack>
          </Box>
        </Paper>

        {policy?.cancellation_policy && (
          <Paper
            sx={{
              mt: 2,
              p: { xs: 2, md: 3 },
              borderRadius: 3,
              border: `1px solid ${borderColor}`,
              backgroundColor: surfaceColor,
              boxShadow: "var(--page-card-shadow, 0 12px 32px rgba(15,23,42,0.05))",
            }}
          >
            <Typography variant="subtitle2">Cancellation policy</Typography>
            <Typography variant="body2" color="text.secondary">{policy.cancellation_policy}</Typography>
          </Paper>
        )}
      </Box>

      {/* Add-ons dialog */}
      <Dialog open={addonsOpen} onClose={() => setAddonsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Select add-ons</DialogTitle>
        <DialogContent dividers>
          {(addonOptions || []).map(opt => {
            const selected = (addonsFor?.addon_ids || []).includes(opt.id);
            return (
              <ListItemButton key={opt.id} onClick={() => toggleAddon(opt.id)}>
                <ListItemIcon>
                  <Checkbox edge="start" checked={selected} tabIndex={-1} disableRipple />
                </ListItemIcon>
                <ListItemText
                  primary={`${opt.name} — ${currencyFmt(opt.base_price ?? opt.price)}`}
                  secondary={opt.description}
                />
              </ListItemButton>
            );
          })}
          {!addonOptions?.length && <Typography variant="body2">No add-ons for this service.</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddonsOpen(false)} sx={primaryButtonSx}>
            Done
          </Button>
        </DialogActions>
      </Dialog>
      <PublicBookingUnavailableDialog
        open={publicUpgradeOpen}
        message={publicUpgradeMessage}
        contactEmail={contactEmail}
        contactPhone={contactPhone}
        onClose={() => setPublicUpgradeOpen(false)}
        onBack={() => {
          setPublicUpgradeOpen(false);
          nav({ pathname: `/${slug}`, search: '?page=services-classic' });
        }}
      />
    </Box>
  );
}

// ---------- Top-level ----------
export default function CheckoutPro({ companySlug: slug }) {
  const [ready, setReady] = useState(false);
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [cardOnFileEnabled, setCardOnFileEnabled] = useState(false);
  const [policy, setPolicy] = useState(null);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [cinfoRes, policyRes] = await Promise.all([
          api.get(`/public/${slug}/company-info`),
          api.get(`/public/${slug}/payments-policy`),
        ]);
        if (!mounted) return;
        const cinfo = cinfoRes.data || {};
        const policyData = policyRes.data || null;
        const payNow = Boolean(cinfo.enable_stripe_payments);
        const policyMode = (policyData?.mode || "").toLowerCase();
        const allowCardFlag = Boolean(cinfo.allow_card_on_file);
        const hasPublishable = Boolean(cinfo.stripe_publishable_key);
        const cardOnly = !payNow && (allowCardFlag || policyMode === "capture");
        setPaymentsEnabled(payNow);
        setCardOnFileEnabled(cardOnly && hasPublishable);
        setPolicy(policyData);
        setContactEmail(String(cinfo?.contact_email || cinfo?.email || "").trim());
        setContactPhone(String(cinfo?.phone || "").trim());
      } catch {
        if (!mounted) return;
        setPaymentsEnabled(false);
        setCardOnFileEnabled(false);
        setPolicy(null);
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => { mounted = false; };
  }, [slug]);

  if (!ready) {
    return (
      <Box p={3} maxWidth={720} mx="auto">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <CheckoutShell
      slug={slug}
      paymentsEnabled={paymentsEnabled}
      cardOnFileEnabled={cardOnFileEnabled}
      policy={policy}
      contactEmail={contactEmail}
      contactPhone={contactPhone}
      onBooked={() => {}}
    />
  );
}
