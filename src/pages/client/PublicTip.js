// src/pages/client/PublicTip.js
import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Paper,
  Box,
  Typography,
  Button,
  Alert,
  TextField,
  Chip,
  Stack,
  CircularProgress,
} from "@mui/material";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { formatCurrency } from "../../utils/formatters";
import { setActiveCurrency, normalizeCurrency, resolveCurrencyForCountry, resolveActiveCurrencyFromCompany, getActiveCurrency } from "../../utils/currency";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { api } from "../../utils/api";

/* ----------------------------- Tip Form ----------------------------- */
const TipForm = ({ onRecorded }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  const handleConfirm = async () => {
    if (!stripe || !elements) {
      setError("Payment form is still loading. Please wait a moment and try again.");
      return;
    }

    const paymentElement = elements.getElement(PaymentElement);
    if (!paymentElement) {
      setError("Payment form is still loading. Please wait a moment and try again.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || "Please check the form and try again.");
        return;
      }

      const { error: confirmErr, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (confirmErr) {
        setError(confirmErr.message || "Payment confirmation failed.");
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        await onRecorded(paymentIntent.id);
      } else {
        setError(`Payment status: ${paymentIntent?.status || "unknown"}`);
      }
    } catch (err) {
      setError(err?.message || "Payment confirmation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PaymentElement
        onReady={() => {
          setReady(true);
          setError("");
        }}
      />
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      <Button
        fullWidth
        variant="contained"
        onClick={handleConfirm}
        disabled={submitting || !ready}
        sx={{ mt: 2 }}
      >
        {submitting ? "Processing..." : "Pay Tip"}
      </Button>
    </>
  );
};



/* ----------------------------- Page ----------------------------- */
export default function PublicTip() {
  const { slug, appointmentId } = useParams();
  const [search] = useSearchParams();
  // accept either ?t= or ?token=
  const token = search.get("token") || search.get("t") || "";
  const navigate = useNavigate();

  const STRIPE_PK = process.env.REACT_APP_STRIPE_PUBLIC_KEY || "";

  const stripePromise = useMemo(() => loadStripe(STRIPE_PK), [STRIPE_PK]);

  const [amt, setAmt] = useState(5); // dollars
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState("");
  const [resolved, setResolved] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [done, setDone] = useState(false);

  const [displayCurrency, setDisplayCurrency] = useState(() => getActiveCurrency());
  const money = (value, currencyCode) => formatCurrency(value, currencyCode || displayCurrency);

  // NEW: external review URL from settings
  const [extUrl, setExtUrl] = useState("");

  const labelFor = (url) => {
    try {
      const u = new URL(url);
      const host = (u.hostname || "").replace(/^www\./i, "");
      return `Review on ${host}`;
    } catch {
      return "External Review";
    }
  };

  // Verify token first, then resolve appointment + read public settings
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");

        // 0) Verify link via new endpoint
        const verify = await api.get(`/api/public/postservice/verify`, {
          params: { t: token, action: "tip", appointment_id: Number(appointmentId) },
          noCompanyHeader: true,
          noAuth: true,
        });
        if (!verify?.data?.ok) {
          setError(verify?.data?.error || "Expired or invalid link.");
          setResolved(null);
          setLoading(false);
          return;
        }

        // 1) Resolve + 2) Get external review URL
        const [{ data: resv }, { data: cfg }] = await Promise.all([
          api.get(`/public/${slug}/feedback/resolve`, {
            params: { appointment_id: appointmentId, token },
            noCompanyHeader: true,
            noAuth: true,
          }),
          api.get(`/public/${slug}/reviews-settings`, {
            noCompanyHeader: true,
            noAuth: true,
          }),
        ]);
        setResolved(resv);
        setExtUrl(cfg?.review_redirect_url || "");

        const appointmentCurrency = normalizeCurrency(
          resv?.appointment?.stripe_currency || resv?.appointment?.currency || resv?.currency
        );
        const companyCurrency = resolveActiveCurrencyFromCompany(resv?.company);
        const inferredCurrency = resolveCurrencyForCountry(
          resv?.company?.country_code || resv?.company?.tax_country_code || ""
        );
        const effectiveCurrency =
          appointmentCurrency ||
          companyCurrency ||
          inferredCurrency ||
          displayCurrency ||
          "USD";
        const normalizedCurrency = normalizeCurrency(effectiveCurrency) || "USD";
        setDisplayCurrency(normalizedCurrency);
        setActiveCurrency(normalizedCurrency);
      } catch (e) {
        setError(e?.response?.data?.error || "Unable to load appointment.");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, appointmentId, token]);

  const presets = [5, 10, 20];

  const createIntent = async () => {
    try {
      setCreating(true);
      setError("");
      const cents = Math.round(Number(amt || 0) * 100);
      if (!cents || cents <= 0) {
        setError("Tip must be greater than 0.");
        setCreating(false);
        return;
      }
      const { data } = await api.post(
        `/public/${slug}/feedback/tip-intent`,
        {
          appointment_id: Number(appointmentId),
          token,
          amount_cents: cents,
          currency: (normalizeCurrency(displayCurrency) || "USD").toLowerCase(),
        },
        { noCompanyHeader: true, noAuth: true }
      );
      setClientSecret(data.client_secret);
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to create payment intent.");
    } finally {
      setCreating(false);
    }
  };

  const callRecord = async (payment_intent_id) => {
    try {
      await api.post(
        `/public/${slug}/feedback/tip-record`,
        { payment_intent_id },
        { noCompanyHeader: true, noAuth: true }
      );
      setDone(true);
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to record tip.");
    }
  };

  /* ----------------------------- Render ----------------------------- */
  if (!STRIPE_PK) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="error">
          Missing <code>REACT_APP_STRIPE_PUBLIC_KEY</code>. Set it in your
          .env and restart the dev server.
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading…</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!resolved) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="error">Appointment not found.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Tip your artist
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {resolved.provider} • {resolved.service}
        </Typography>

        {done ? (
          <>
            <Alert severity="success" sx={{ my: 2 }}>
              Thanks! Your tip was recorded.
            </Alert>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
              <Button variant="contained" onClick={() => navigate(`/${slug}`)}>
                Back to {slug}
              </Button>
              <Button
                variant="outlined"
                onClick={() =>
                  navigate(
                    `/${slug}/review/${appointmentId}?token=${encodeURIComponent(token)}`
                  )
                }
              >
                Leave/Update a Review
              </Button>
              {!!extUrl && (
                <Button
                  variant="outlined"
                  component="a"
                  href={extUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {labelFor(extUrl)}
                </Button>
              )}
            </Stack>
          </>
        ) : (
          <>
            {!clientSecret && (
              <>
                <Typography sx={{ mt: 1, mb: 1 }}>
                  Choose an amount
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
                  {presets.map((p) => (
                    <Chip
                      key={p}
                      label={money(p)}
                      onClick={() => setAmt(p)}
                      variant={amt === p ? "filled" : "outlined"}
                    />
                  ))}
                </Stack>
                <TextField
                  label={`Custom amount (${displayCurrency})`}
                  type="number"
                  value={amt}
                  onChange={(e) => setAmt(e.target.value)}
                  fullWidth
                />
                {error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                )}
                <Button
                  fullWidth
                  variant="contained"
                  onClick={createIntent}
                  disabled={creating}
                  sx={{ mt: 2 }}
                >
                  {creating ? "Preparing…" : "Continue to Payment"}
                </Button>
              </>
            )}

            {clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <TipForm onRecorded={callRecord} />
              </Elements>
            )}
          </>
        )}
      </Paper>

      <Box sx={{ mt: 2 }} />
    </Container>
  );
}
