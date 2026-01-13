/* eslint-disable react-hooks/exhaustive-deps */

import React, { useEffect, useState, useMemo, useRef } from "react";

import {
  Box,
  Paper,
  Typography,
  Alert,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";

import { useParams, useNavigate, useSearchParams } from "react-router-dom";

import { api } from "../../utils/api";

import { clearCart } from "../../utils/cart";

import { formatCurrency } from "../../utils/formatters";

import {
  CHECKOUT_SESSION_STORAGE_KEY,
  PENDING_CHECKOUT_STORAGE_KEY,
} from "../../utils/hostedCheckout";

import {
  setActiveCurrency,
  normalizeCurrency,
  resolveCurrencyForCountry,
  resolveActiveCurrencyFromCompany,
  getActiveCurrency,
} from "../../utils/currency";

import { getUserTimezone } from "../../utils/timezone";
import { getTenantHostMode } from "../../utils/tenant";

import { isoFromParts, formatDate, formatTime } from "../../utils/datetime";

import PublicPageShell from "./PublicPageShell";

/* ---------- helpers ---------- */

const buildDisplayDateTime = (slot, fallbackTz) => {
  if (slot?.local_date && slot?.local_time) {
    return {
      date: slot.local_date,
      time: slot.local_time,
      tz: slot.timezone || fallbackTz,
    };
  }

  const iso = isoFromParts(
    slot.date,
    slot.start_time,
    slot.timezone || fallbackTz,
  );

  const dt = new Date(iso);

  return {
    date: formatDate(dt),
    time: formatTime(dt),
    tz: slot.timezone || fallbackTz,
  };
};

const getAppointmentPayload = (raw) =>
  raw?.appointment ? raw.appointment : raw;

// Normalize a *single-line* service object from appointment payload

const normalizeSingleService = (appt, tzFallback) => {
  const svc = appt?.service || {};

  return {
    appointment_id: appt?.id,

    name: svc.name,

    provider_name:
      svc?.recruiter?.full_name || svc?.recruiter?.name || "Provider",

    date: svc.date || appt?.date,

    start_time: svc.start_time || appt?.start_time,

    timezone: svc.timezone || appt?.timezone || tzFallback,

    local_date: svc.local_date || appt?.local_date,

    local_time: svc.local_time || appt?.local_time,

    base_price: Number(svc.base_price ?? svc.price ?? 0),

    coupon_code: appt?.coupon?.code || null,

    discount_amount: Number(appt?.discount_amount || 0),

    tip_amount: Number(appt?.tip_amount || 0),

    addons: (svc.addons || []).map((ad) => ({
      id: ad.id,

      name: ad.name,

      base_price: Number(ad.price ?? ad.base_price ?? 0),

      description: ad.description,
    })),
  };
};

// Try to compute single-line tip from payments list (fallback)

const deriveSingleLineTipFromPayments = (payments) =>
  (Array.isArray(payments) ? payments : [])

    .filter(
      (p) =>
        String(p.type).toLowerCase() === "tip" &&
        String(p.status).toLowerCase() !== "refunded",
    )

    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

const PAID_STATUS_SET = new Set([
  "paid",
  "succeeded",
  "completed",
  "complete",
  "captured",
  "settled",
]);

const CARD_ON_FILE_STATUS_SET = new Set([
  "card_on_file",
  "card stored",
  "card_saved",
  "authorized",
  "setup_succeeded",
  "setup_complete",
]);

export default function BookingConfirmation() {
  const { slug, bookingId } = useParams();

  const [searchParams] = useSearchParams();

  const slugOverride =
    slug ||
    searchParams.get("site") ||
    (typeof localStorage !== "undefined" ? localStorage.getItem("site") : null);

  const qsToken = searchParams.get("token");

  const navigate = useNavigate();

  const userTz = getUserTimezone();

  const [loading, setLoading] = useState(true);

  const [err, setErr] = useState("");

  const [raw, setRaw] = useState(null);

  const [payments, setPayments] = useState([]);

  const [productOrder, setProductOrder] = useState(null);

  const sessionIdParam =
    searchParams.get("session_id") || searchParams.get("sid");

  const [stripeSessionId, setStripeSessionId] = useState(() => {
    if (sessionIdParam) return sessionIdParam;

    try {
      const stored = sessionStorage.getItem(CHECKOUT_SESSION_STORAGE_KEY);

      if (stored) {
        sessionStorage.removeItem(CHECKOUT_SESSION_STORAGE_KEY);

        return stored;
      }
    } catch {}

    return null;
  });

  const [pendingCheckoutId, setPendingCheckoutId] = useState(() => {
    try {
      const stored = sessionStorage.getItem(PENDING_CHECKOUT_STORAGE_KEY);

      if (stored) {
        sessionStorage.removeItem(PENDING_CHECKOUT_STORAGE_KEY);

        return stored;
      }
    } catch {}

    return null;
  });

  const [stripeSession, setStripeSession] = useState(null);

  const [stripeSessionStatus, setStripeSessionStatus] = useState("idle");

  const [stripeSessionError, setStripeSessionError] = useState("");

  const [stripeSessionFetchNonce, setStripeSessionFetchNonce] = useState(0);

  const stripeRetryRef = useRef(0);

  const stripePollTimerRef = useRef(null);

  const MAX_STRIPE_SESSION_POLLS = 4;

  const cartClearedRef = useRef(false);

  const [displayCurrency, setDisplayCurrency] = useState(() =>
    getActiveCurrency(),
  );

  const bookingFinalized = useMemo(() => {
    const apptPaid = Boolean(raw?.appointment);

    const orderPaid = PAID_STATUS_SET.has(
      String(productOrder?.payment_status || "").toLowerCase(),
    );

    const sessionPaid =
      Boolean(stripeSession?.paid) ||
      PAID_STATUS_SET.has(
        String(stripeSession?.payment_status || "").toLowerCase(),
      ) ||
      PAID_STATUS_SET.has(String(stripeSession?.status || "").toLowerCase());

    return (
      apptPaid || orderPaid || sessionPaid || stripeSessionStatus === "success"
    );
  }, [raw, productOrder, stripeSession, stripeSessionStatus]);

  const awaitingStripe = ["pending", "loading"].includes(stripeSessionStatus);

  useEffect(() => {
    if (pendingCheckoutId && stripeSessionStatus === "success") {
      setPendingCheckoutId(null);
    }
  }, [pendingCheckoutId, stripeSessionStatus]);

  useEffect(() => {
    try {
      sessionStorage.removeItem(CHECKOUT_SESSION_STORAGE_KEY);

      sessionStorage.removeItem(PENDING_CHECKOUT_STORAGE_KEY);
    } catch {}
  }, []);

  const money = (value, currencyCode) =>
    formatCurrency(value, currencyCode || displayCurrency);

  const centsToCurrency = (cents, currencyCode) => {
    if (cents == null) return null;

    const code = (
      normalizeCurrency(currencyCode) ||
      displayCurrency ||
      "USD"
    ).toUpperCase();

    return { amount: Number(cents) / 100, currency: code };
  };

  const formatCurrencyValue = (value, fallbackAmount, fallbackCurrency) => {
    if (value && value.currency) {
      return money(value.amount, value.currency);
    }

    return money(fallbackAmount, fallbackCurrency);
  };

  useEffect(() => {
    if (sessionIdParam && sessionIdParam !== stripeSessionId) {
      setStripeSessionId(sessionIdParam);
    }
  }, [sessionIdParam, stripeSessionId]);

  useEffect(
    () => () => {
      if (stripePollTimerRef.current) {
        clearTimeout(stripePollTimerRef.current);

        stripePollTimerRef.current = null;
      }
    },
    [],
  );

  useEffect(() => {
    if (!cartClearedRef.current && bookingFinalized) {
      try {
        clearCart();
      } catch (err) {
        console.warn("booking confirmation: failed to clear cart", err);
      } finally {
        cartClearedRef.current = true;
      }
    }
  }, [bookingFinalized]);

  const productSummary = useMemo(() => {
    if (!productOrder && !stripeSession) return null;

    const baseCurrency =
      normalizeCurrency(
        stripeSession?.currency ||
          productOrder?.stripe_currency ||
          productOrder?.currency ||
          displayCurrency,
      ) || "USD";

    const currency = baseCurrency.toUpperCase();

    const subtotal =
      stripeSession?.amount_subtotal != null
        ? { amount: stripeSession.amount_subtotal / 100, currency }
        : centsToCurrency(productOrder?.stripe_subtotal_cents, currency);

    const tax =
      stripeSession?.amount_tax != null
        ? { amount: stripeSession.amount_tax / 100, currency }
        : centsToCurrency(productOrder?.stripe_tax_cents, currency);

    const total =
      stripeSession?.amount_total != null
        ? { amount: stripeSession.amount_total / 100, currency }
        : centsToCurrency(productOrder?.stripe_total_cents, currency) || {
            amount: Number(
              productOrder?.total_amount || productOrder?.total || 0,
            ),

            currency,
          };

    let items = [];

    if (Array.isArray(productOrder?.items) && productOrder.items.length) {
      items = productOrder.items.map((it, idx) => ({
        id: it.id || `${it.product_id || idx}-${idx}`,

        name: it.name,

        quantity: it.quantity || 1,

        description: it.description,

        total: Number(
          it.total_price ?? (it.unit_price || 0) * (it.quantity || 1),
        ),

        unit: Number(it.unit_price || 0),
      }));
    } else if (
      Array.isArray(stripeSession?.line_items) &&
      stripeSession.line_items.length
    ) {
      items = stripeSession.line_items.map((it, idx) => ({
        id: it.description || idx,

        name: it.description || `Item ${idx + 1}`,

        quantity: it.quantity || 1,

        total: it.amount_total != null ? it.amount_total / 100 : null,

        unit:
          it.amount_subtotal != null && it.quantity
            ? it.amount_subtotal / 100 / it.quantity
            : null,
      }));
    }

    return {
      currency,
      subtotal,
      tax,
      total,
      items,
      stripeSource: Boolean(stripeSession),
    };
  }, [productOrder, stripeSession]);

  const renderProductSummary = () => {
    const hasSummary = Boolean(productSummary);

    const showLoading = stripeSessionStatus === "loading";

    const showPending = stripeSessionStatus === "pending";

    const showError =
      stripeSessionStatus === "error" && Boolean(stripeSessionError);

    if (!hasSummary && !showLoading && !showPending && !showError) {
      return null;
    }

    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Products
        </Typography>

        {(showLoading || showPending) && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            We're confirming your payment with Stripe. This usually takes just a
            moment.
          </Typography>
        )}

        {showError && (
          <Alert severity="warning" sx={{ mb: 1 }}>
            {stripeSessionError}
          </Alert>
        )}

        {hasSummary ? (
          <List sx={{ border: 1, borderColor: "#ddd", borderRadius: 2 }}>
            {productSummary.items.length > 0 ? (
              productSummary.items.map((it, idx) => (
                <ListItem key={it.id || idx} divider>
                  <ListItemText
                    primary={`${it.name || "Item"} x${it.quantity || 1}`}
                    secondary={
                      it.description ||
                      (it.unit != null
                        ? `Unit: ${formatCurrency(it.unit, productSummary.currency)}`
                        : undefined)
                    }
                  />

                  <Typography>
                    {it.total != null
                      ? formatCurrency(it.total, productSummary.currency)
                      : "—"}
                  </Typography>
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText
                  primary={
                    awaitingStripe
                      ? "We're confirming your payment with Stripe. This usually takes just a moment."
                      : "No product line items recorded."
                  }
                />
              </ListItem>
            )}

            <ListItem>
              <Box ml="auto" textAlign="right">
                {productSummary.subtotal && (
                  <Typography>
                    Subtotal{" "}
                    {formatCurrencyValue(
                      productSummary.subtotal,
                      productOrder?.total_amount || productOrder?.total || 0,
                      productSummary.currency,
                    )}
                  </Typography>
                )}

                {productSummary.tax && productSummary.tax.amount !== 0 && (
                  <Typography>
                    Tax{" "}
                    {formatCurrencyValue(
                      productSummary.tax,
                      0,
                      productSummary.currency,
                    )}
                  </Typography>
                )}

                <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 1 }}>
                  Products total{" "}
                  {formatCurrencyValue(
                    productSummary.total,
                    productOrder?.total_amount || productOrder?.total || 0,
                    productSummary.currency,
                  )}
                </Typography>

                {productSummary.stripeSource && (
                  <Typography variant="caption" color="text.secondary">
                    Totals reflect Stripe Checkout.
                  </Typography>
                )}
              </Box>
            </ListItem>
          </List>
        ) : (
          <List sx={{ border: 1, borderColor: "#ddd", borderRadius: 2 }}>
            <ListItem>
              <ListItemText
                primary={
                  showError
                    ? "We couldn't load the receipt details from Stripe yet."
                    : awaitingStripe
                      ? "We're confirming your payment with Stripe. This usually takes just a moment."
                      : "No product line items recorded."
                }
                secondary={
                  showError
                    ? "Payment succeeded, but Stripe has not returned the line items. We will retry automatically."
                    : awaitingStripe
                      ? "This can take a couple of seconds while Stripe finalizes the charge."
                      : undefined
                }
              />
            </ListItem>
          </List>
        )}
      </Box>
    );
  };

  // Preserve embed styling params on navigation

  const go = (to) => {
    const keep = new URLSearchParams();

    ["embed", "primary", "text"].forEach(
      (k) => searchParams.get(k) && keep.set(k, searchParams.get(k)),
    );

    if (typeof to === "string") {
      const [pathname, rawSearch = ""] = to.split("?");

      const final = [rawSearch, keep.toString()].filter(Boolean).join("&");

      navigate({ pathname, search: final ? `?${final}` : "" });
    } else {
      const final = [to.search?.replace(/^\?/, ""), keep.toString()]
        .filter(Boolean)
        .join("&");

      navigate({ ...to, search: final ? `?${final}` : "" });
    }
  };

  useEffect(() => {
    (async () => {
      // Read any product order cached by Checkout to show alongside services

      let cachedProductOrder = null;

      let sessionContextId = sessionIdParam || stripeSessionId || null;

      try {
        const prod = sessionStorage.getItem("checkout_products");

        if (prod) {
          const parsed = JSON.parse(prod);

          const normalizedOrder = parsed?.order || null;

          if (normalizedOrder) {
            cachedProductOrder = normalizedOrder;

            setProductOrder(normalizedOrder);

            if (
              !sessionIdParam &&
              normalizedOrder.stripe_session_id &&
              !stripeSessionId
            ) {
              setStripeSessionId(normalizedOrder.stripe_session_id);

              sessionContextId = normalizedOrder.stripe_session_id;
            }
          }

          // keep it for one view only

          sessionStorage.removeItem("checkout_products");
        }
      } catch {}

      // 1) Try cached confirmation from checkout

      const cached = sessionStorage.getItem("booking_confirmation");

      if (cached) {
        setRaw(JSON.parse(cached));

        sessionStorage.removeItem("booking_confirmation");

        setLoading(false);

        return;
      }

      const hasProductContext = !!(sessionContextId || cachedProductOrder);

      // 2) Load by appointment/token (e.g., from email)

      if (!bookingId || !qsToken || !slugOverride) {
        if (slugOverride && hasProductContext) {
          setLoading(false);

          return;
        }

        setErr("Invalid confirmation link.");

        setLoading(false);

        return;
      }

      try {
        const { data } = await api.get(
          `/public/${slugOverride}/appointment/${bookingId}`,
          {
            params: { token: qsToken },
          },
        );

        setRaw(data);

        const appointmentCurrency = normalizeCurrency(
          data?.appointment?.stripe_currency ||
            data?.appointment?.currency ||
            data?.appointment?.display_currency,
        );

        const productCurrency = normalizeCurrency(
          data?.product_order?.stripe_currency || data?.product_order?.currency,
        );

        const companyCurrency = resolveActiveCurrencyFromCompany(data?.company);

        const inferredCurrency = resolveCurrencyForCountry(
          data?.company?.country_code || data?.company?.tax_country_code || "",
        );

        const effectiveCurrency =
          appointmentCurrency ||
          productCurrency ||
          companyCurrency ||
          inferredCurrency ||
          displayCurrency ||
          getActiveCurrency() ||
          "USD";

        const normalizedCurrency =
          normalizeCurrency(effectiveCurrency) || "USD";

        if (normalizedCurrency !== displayCurrency) {
          setDisplayCurrency(normalizedCurrency);

          setActiveCurrency(normalizedCurrency);
        }

        if (data?.product_order) {
          setProductOrder(data.product_order);

          if (
            !sessionIdParam &&
            data.product_order.stripe_session_id &&
            !stripeSessionId
          ) {
            setStripeSessionId(data.product_order.stripe_session_id);
          }
        }

        // For single-line fallback, also pull payments to detect tips added later

        try {
          const pr = await api.get(`/api/payments/list/${bookingId}`);

          const txns = pr.data.transactions || [];

          setPayments(txns);

          const txnCurrency = normalizeCurrency(
            txns.find((t) => t && t.currency)?.currency,
          );

          if (txnCurrency) {
            const normalizedTxnCurrency =
              normalizeCurrency(txnCurrency) || "USD";

            if (normalizedTxnCurrency !== displayCurrency) {
              setDisplayCurrency(normalizedTxnCurrency);

              setActiveCurrency(normalizedTxnCurrency);
            }
          }
        } catch {
          /* no-op */
        }
      } catch {
        setErr("Could not load booking details.");
      } finally {
        setLoading(false);
      }
    })();
  }, [slugOverride, bookingId, qsToken, sessionIdParam, stripeSessionId]);

  useEffect(() => {
    if (!stripeSessionId || !slugOverride) {
      setStripeSession(null);

      setStripeSessionStatus("idle");

      setStripeSessionError("");

      stripeRetryRef.current = 0;

      if (stripePollTimerRef.current) {
        clearTimeout(stripePollTimerRef.current);

        stripePollTimerRef.current = null;
      }

      return;
    }

    let cancelled = false;

    const run = async () => {
      if (stripePollTimerRef.current) {
        clearTimeout(stripePollTimerRef.current);

        stripePollTimerRef.current = null;
      }

      setStripeSessionStatus("loading");

      setStripeSessionError("");

      try {
        const { data } = await api.get(
          `/public/${slugOverride}/checkout-session/${stripeSessionId}`,
        );

        if (cancelled) return;

        setStripeSession(data || null);

        if (data?.pending_checkout_id) {
          setPendingCheckoutId(String(data.pending_checkout_id));
        }

        if (data?.product_order) {
          setProductOrder(data.product_order);

          if (
            !sessionIdParam &&
            data.product_order.stripe_session_id &&
            data.product_order.stripe_session_id !== stripeSessionId
          ) {
            setStripeSessionId(data.product_order.stripe_session_id);
          }
        }

        const sessionCurrency = normalizeCurrency(data?.currency);

        if (sessionCurrency) {
          setDisplayCurrency(sessionCurrency);

          setActiveCurrency(sessionCurrency);
        }

        const paymentStatus = String(data?.payment_status || "").toLowerCase();

        const sessionStatus = String(data?.status || "").toLowerCase();

        const orderPaymentStatus = String(
          data?.product_order?.payment_status || "",
        ).toLowerCase();

        const paidish =
          Boolean(data?.paid) ||
          [paymentStatus, sessionStatus, orderPaymentStatus].some((s) =>
            ["paid", "complete", "succeeded"].includes(s),
          );

        if (paidish) {
          stripeRetryRef.current = 0;

          setStripeSessionStatus("success");
        } else if (stripeRetryRef.current >= MAX_STRIPE_SESSION_POLLS) {
          stripeRetryRef.current = 0;

          setStripeSessionStatus("error");

          setStripeSessionError(
            "We could not confirm a payment for this session yet. If you cancelled at Stripe, you can return to your basket and try again.",
          );

          setPendingCheckoutId(null);

          try {
            sessionStorage.removeItem(PENDING_CHECKOUT_STORAGE_KEY);
          } catch {}
        } else {
          stripeRetryRef.current += 1;

          setStripeSessionStatus("pending");

          stripePollTimerRef.current = setTimeout(() => {
            if (!cancelled) {
              setStripeSessionFetchNonce((n) => n + 1);
            }
          }, 1500 * stripeRetryRef.current);
        }
      } catch (error) {
        if (cancelled) return;

        const message =
          error?.response?.data?.error ||
          error?.message ||
          "Unable to load Stripe session totals";

        setStripeSessionError(message);

        if (stripeRetryRef.current >= MAX_STRIPE_SESSION_POLLS) {
          stripeRetryRef.current = 0;

          setStripeSessionStatus("error");
        } else {
          stripeRetryRef.current += 1;

          setStripeSessionStatus("pending");

          stripePollTimerRef.current = setTimeout(() => {
            if (!cancelled) {
              setStripeSessionFetchNonce((n) => n + 1);
            }
          }, 1500 * stripeRetryRef.current);
        }
      }
    };

    run();

    return () => {
      cancelled = true;

      if (stripePollTimerRef.current) {
        clearTimeout(stripePollTimerRef.current);

        stripePollTimerRef.current = null;
      }
    };
  }, [stripeSessionId, slugOverride, sessionIdParam, stripeSessionFetchNonce]);

  let content;

  const hasProductContext = Boolean(
    productOrder || stripeSession || stripeSessionId,
  );

  const canRenderProductOnly = !raw && !!slugOverride && hasProductContext;

  const slugForNav = slugOverride || "";
  const isCustomDomain = getTenantHostMode() === "custom";
  const basePath = isCustomDomain ? "" : `/${slugForNav}`;
  const rootPath = basePath || "/";

  if (loading) {
    content = (
      <Box p={3} textAlign="center">
        <CircularProgress />

        <Typography sx={{ mt: 2 }}>Loading details...</Typography>
      </Box>
    );
  } else if (canRenderProductOnly) {
    const receiptEmail =
      stripeSession?.customer_details?.email ||
      productOrder?.customer_email ||
      productOrder?.email ||
      "your inbox";

    const rawPaymentStatus = String(
      stripeSession?.payment_status ||
        stripeSession?.status ||
        productOrder?.payment_status ||
        productOrder?.status ||
        "PAID",
    );

    const paymentStatus = rawPaymentStatus.toUpperCase();
    const normalizedPaymentStatus = paymentStatus.toLowerCase();

    const isFinalizing = awaitingStripe;
    const isPaid = PAID_STATUS_SET.has(normalizedPaymentStatus);
    const isCardOnFile = CARD_ON_FILE_STATUS_SET.has(normalizedPaymentStatus);

    const summaryNode = renderProductSummary();

    const fallbackAmount =
      productOrder?.total_amount ??
      productOrder?.total ??
      (stripeSession?.amount_total != null
        ? stripeSession.amount_total / 100
        : null);

    const fallbackCurrency = (
      normalizeCurrency(
        productSummary?.currency ||
          productOrder?.stripe_currency ||
          productOrder?.currency ||
          stripeSession?.currency ||
          displayCurrency ||
          "USD",
      ) || "USD"
    ).toUpperCase();

    const amountPaidDisplay = productSummary
      ? formatCurrencyValue(
          productSummary.total,

          fallbackAmount ?? 0,

          productSummary.currency,
        )
      : money(fallbackAmount ?? 0, fallbackCurrency);

    const amountDisplay = isPaid ? amountPaidDisplay : money(fallbackAmount ?? 0, fallbackCurrency);
    const amountLabel = isPaid ? "Amount paid" : "Amount due";
    const displayPaymentStatus = isFinalizing
      ? "Pending confirmation"
      : paymentStatus || (isCardOnFile ? "CARD_ON_FILE" : isPaid ? "PAID" : "UNPAID");
    const paymentNote = isFinalizing
      ? ""
      : isCardOnFile
        ? "A card has been stored securely with Stripe. The business may charge it later."
        : !isPaid
          ? "No online payment was collected. Please pay at the appointment."
          : "";

    content = (
      <Box
        sx={{
          px: { xs: 2, md: 4 },
          py: { xs: 4, md: 6 },
          width: "100%",
          maxWidth: 900,
          mx: "auto",
        }}
      >
        <Paper
          sx={{
            p: { xs: 3, md: 5 },

            borderRadius: "var(--page-card-radius, 18px)",

            backgroundColor: "var(--page-card-bg, rgba(255,255,255,0.95))",

            boxShadow:
              "var(--page-card-shadow, 0 18px 45px rgba(15,23,42,0.08))",

            color: "var(--page-body-color, inherit)",
          }}
          elevation={0}
        >
          <Typography variant="h3" fontWeight={800} gutterBottom>
            Order confirmed
          </Typography>

          <Typography color="text.secondary">
            We sent a confirmation to {receiptEmail}.
          </Typography>

          {productOrder?.id && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Order #{productOrder.id}
            </Typography>
          )}

          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" fontWeight={600}>
              {amountLabel} {amountDisplay}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Payment status: {displayPaymentStatus}
            </Typography>

            {paymentNote && (
              <Typography variant="body2" color="text.secondary">
                {paymentNote}
              </Typography>
            )}
          </Box>

          {isFinalizing && (
            <Alert severity="info" sx={{ mt: 2 }}>
              We're confirming your payment with Stripe. This usually takes just
              a moment.
            </Alert>
          )}

          {summaryNode || (
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                {isFinalizing
                  ? "We're confirming your payment with Stripe. This usually takes just a moment."
                  : "No product line items recorded."}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mt: 3 }}>
            <Button variant="contained" onClick={() => go(rootPath)}>
              Back to site
            </Button>

            <Button
              variant="outlined"
              onClick={() => go(`${basePath}/products`)}
            >
              Continue shopping
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  } else if (err || !raw || !slugOverride) {
    content = (
      <Box p={3}>
        <Alert severity="error">{err || "Unknown error"}</Alert>
      </Box>
    );
  } else {
    const hasGroup = Array.isArray(raw?.services) && raw.services.length > 0;

    const cancelLink =
      raw?.cancel_link || raw?.appointment?.cancel_link || null;

    const rescheduleLink =
      raw?.reschedule_link || raw?.appointment?.reschedule_link || null;

    const handleCancel = () => {
      if (cancelLink) {
        window.location.href = cancelLink;
      } else if (slugForNav && bookingId && qsToken) {
        go(`${basePath}/cancel-booking/${bookingId}?token=${qsToken}`);
      }
    };

    const handleReschedule = () => {
      if (rescheduleLink) {
        window.location.href = rescheduleLink;
      }
    };

    if (hasGroup) {
      const order = raw;

      const orderPaymentStatus = String(
        order.payment_status || "PAID",
      ).toUpperCase();
      const orderNormalizedStatus = orderPaymentStatus.toLowerCase();
      const orderPaid = PAID_STATUS_SET.has(orderNormalizedStatus);
      const orderCardOnFile = CARD_ON_FILE_STATUS_SET.has(orderNormalizedStatus);
      const orderAmountLabel = orderPaid ? "Amount paid" : "Amount due";
      const orderStatusLabel = awaitingStripe
        ? "Pending confirmation"
        : orderPaymentStatus || (orderCardOnFile ? "CARD_ON_FILE" : orderPaid ? "PAID" : "UNPAID");
      const orderNote = awaitingStripe
        ? ""
        : orderCardOnFile
          ? "A card has been stored securely with Stripe. The business may charge it later."
          : !orderPaid
            ? "No online payment was collected. Please pay at the appointment."
            : "";

      content = (
        <Box p={3} maxWidth="820px" mx="auto">
          <Paper
            sx={{
              p: 3,

              borderRadius: "var(--page-card-radius, 18px)",

              backgroundColor: "var(--page-card-bg, rgba(255,255,255,0.95))",

              boxShadow:
                "var(--page-card-shadow, 0 18px 45px rgba(15,23,42,0.08))",

              color: "var(--page-body-color, inherit)",
            }}
            elevation={0}
          >
            <Typography variant="h5" gutterBottom>
              Booking Confirmed
            </Typography>

            <Typography sx={{ mb: 2 }}>
              We have itemized your booking below.
            </Typography>

            {awaitingStripe && (
              <Alert severity="info" sx={{ mb: 2 }}>
                We're confirming your payment with Stripe. This usually takes
                just a moment.
              </Alert>
            )}

            <List
              sx={{ border: 1, borderColor: "#ddd", borderRadius: 2, mb: 2 }}
            >
              {order.services.map((s) => {
                const dt = { date: s.date, time: s.time, tz: s.tz };

                const subtotal = Number(s.pricing?.subtotal ?? s.subtotal ?? 0);

                const discount = Number(s.pricing?.discount ?? s.discount ?? 0);

                const tip = Number(s.tip_amount ?? 0);

                const lineTotal = Number(
                  s.pricing?.total ??
                    s.total ??
                    Math.max(0, subtotal - discount) + tip,
                );

                return (
                  <React.Fragment
                    key={
                      s.appointment_id ||
                      `${s.service_name}-${dt.date}-${dt.time}`
                    }
                  >
                    <ListItem alignItems="flex-start" divider>
                      <ListItemText
                        primary={`${s.service_name} - ${s.provider_name}`}
                        secondary={`${dt.date} - ${dt.time} (${dt.tz})`}
                      />

                      <Box textAlign="right">
                        <Typography variant="body2">
                          Subtotal {awaitingStripe ? "—" : money(subtotal)}
                        </Typography>

                        {discount > 0 && (
                          <Typography variant="body2">
                            Discount{" "}
                            {awaitingStripe ? "—" : `-${money(discount)}`}
                          </Typography>
                        )}

                        {tip > 0 && (
                          <Typography variant="body2">
                            Tip {awaitingStripe ? "—" : money(tip)}
                          </Typography>
                        )}

                        <Typography
                          variant="subtitle1"
                          sx={{ mt: 0.5, fontWeight: 600 }}
                        >
                          Line total {awaitingStripe ? "—" : money(lineTotal)}
                        </Typography>
                      </Box>
                    </ListItem>

                    {(s.addons || []).map((ad) => (
                      <ListItem key={ad.id} sx={{ pl: 4 }} divider>
                        <ListItemText primary={`Add-on: ${ad.name}`} />

                        <Typography>{money(ad.price)}</Typography>
                      </ListItem>
                    ))}
                  </React.Fragment>
                );
              })}

              <Divider />

              <ListItem>
                <Box ml="auto" textAlign="right">
                  <Typography>
                    Subtotal {awaitingStripe ? "—" : money(order.subtotal)}
                  </Typography>

                  {Number(order.discount_total) > 0 && (
                    <Typography>
                      Discount{" "}
                      {awaitingStripe ? "—" : `-${money(order.discount_total)}`}
                    </Typography>
                  )}

                  {Number(order.tip_total) > 0 && (
                    <Typography>
                      Tip {awaitingStripe ? "—" : money(order.tip_total)}
                    </Typography>
                  )}

                  <Typography variant="h6" sx={{ mt: 0.5 }}>
                    {awaitingStripe
                      ? "Amount pending"
                      : `${orderAmountLabel} ${money(order.total)}`}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Payment status: {orderStatusLabel}
                  </Typography>

                  {orderNote && (
                    <Typography variant="body2" color="text.secondary">
                      {orderNote}
                    </Typography>
                  )}
                </Box>
              </ListItem>
            </List>

            {renderProductSummary()}

            <Button variant="contained" onClick={() => go(rootPath)}>
              Back to site
            </Button>
          </Paper>
        </Box>
      );
    } else {
      const appt = getAppointmentPayload(raw);

      const svc = normalizeSingleService(appt, userTz);

      const singleTip =
        svc.tip_amount ?? deriveSingleLineTipFromPayments(payments);

      const lineTotal =
        Math.max(0, svc.base_price - (svc.discount_amount || 0)) +
        (singleTip || 0);

      const when = buildDisplayDateTime(svc, userTz);

      content = (
        <Box
          sx={{
            px: { xs: 2, md: 4 },
            py: { xs: 4, md: 6 },
            width: "100%",
            maxWidth: 900,
            mx: "auto",
          }}
        >
          <Paper
            sx={{
              p: { xs: 3, md: 5 },

              borderRadius: "var(--page-card-radius, 18px)",

              backgroundColor: "var(--page-card-bg, rgba(255,255,255,0.95))",

              boxShadow:
                "var(--page-card-shadow, 0 18px 45px rgba(15,23,42,0.08))",

              color: "var(--page-body-color, inherit)",
            }}
            elevation={0}
          >
            <Typography variant="h4" fontWeight={800} gutterBottom>
              Booking Confirmed
            </Typography>

            <Typography sx={{ mb: 1 }}>
              {svc.name} with {svc.provider_name}
            </Typography>

            <Typography sx={{ mb: 2 }}>
              {when.date} - {when.time} ({when.tz})
            </Typography>

            <Alert severity="success" sx={{ mb: 3 }}>
              Confirmation #{svc.appointment_id}
            </Alert>

            <Typography variant="h6" gutterBottom>
              Charges
            </Typography>

            <Typography>Service: {money(svc.base_price)}</Typography>

            {svc.discount_amount > 0 && (
              <Typography>Discount: -{money(svc.discount_amount)}</Typography>
            )}

            {singleTip > 0 && <Typography>Tip: {money(singleTip)}</Typography>}

            <Typography variant="h5" sx={{ mt: 1, fontWeight: 700 }}>
              Total Paid: {money(lineTotal)}
            </Typography>

            {renderProductSummary()}

            <Box sx={{ display: "flex", gap: 1.5, mt: 3, flexWrap: "wrap" }}>
              <Button variant="outlined" color="error" onClick={handleCancel}>
                Cancel
              </Button>

              {rescheduleLink && (
                <Button variant="outlined" onClick={handleReschedule}>
                  Reschedule
                </Button>
              )}

              <Button variant="contained" onClick={() => go(rootPath)}>
                Done
              </Button>
            </Box>

            {payments.length > 0 && (
              <Box mt={3}>
                <Typography variant="h6">Payment History</Typography>

                {payments.map((p) => (
                  <Alert
                    key={p.id}
                    severity={
                      String(p.status).toLowerCase() === "refunded"
                        ? "warning"
                        : "success"
                    }
                    sx={{ my: 1 }}
                  >
                    {p.type} Ã¢â‚¬â€ {money(p.amount, p.currency)} ({p.status})
                  </Alert>
                ))}
              </Box>
            )}
          </Paper>
        </Box>
      );
    }
  }

  if (!slugOverride) {
    return content;
  }

  return (
    <PublicPageShell activeKey="__services" slugOverride={slugOverride}>
      {content}
    </PublicPageShell>
  );
}
