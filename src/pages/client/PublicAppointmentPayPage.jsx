import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { api } from "../../utils/api";
import { formatCurrency } from "../../utils/formatters";

const PaymentForm = ({ onPaid }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  const handleConfirm = async () => {
    if (!stripe || !elements) {
      setError("Payment form is still loading.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || "Please check the payment form.");
        return;
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (confirmError) {
        setError(confirmError.message || "Payment confirmation failed.");
        return;
      }

      if ((paymentIntent?.status || "").toLowerCase() === "succeeded") {
        await onPaid(paymentIntent.id);
        return;
      }

      setError(`Payment status: ${paymentIntent?.status || "unknown"}`);
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
      {error ? <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert> : null}
      <Button
        fullWidth
        variant="contained"
        sx={{ mt: 2 }}
        disabled={!ready || submitting}
        onClick={handleConfirm}
      >
        {submitting ? "Processing..." : "Pay now"}
      </Button>
    </>
  );
};

export default function PublicAppointmentPayPage({ slugOverride }) {
  const { slug: routeSlug, appointmentId } = useParams();
  const slug = slugOverride || routeSlug;
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const paymentIntentId = (search.get("pi") || "").trim();

  const stripePublicKey = process.env.REACT_APP_STRIPE_PUBLIC_KEY || "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [details, setDetails] = useState(null);

  const stripePromise = useMemo(() => {
    if (!stripePublicKey || !details?.stripe_account_id) return null;
    return loadStripe(stripePublicKey, { stripeAccount: details.stripe_account_id });
  }, [stripePublicKey, details?.stripe_account_id]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await api.get(
          `/public/${slug}/payment-link/${appointmentId}`,
          {
            params: paymentIntentId ? { pi: paymentIntentId } : {},
            noAuth: true,
            noCompanyHeader: true,
          }
        );
        if (!active) return;
        setDetails(data || null);
        const paid = ["paid", "succeeded"].includes(String(data?.payment_status || data?.status || "").toLowerCase());
        setSuccess(paid);
      } catch (err) {
        if (!active) return;
        setError(err?.response?.data?.error || "Unable to load payment page.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug, appointmentId, paymentIntentId]);

  const handlePaid = async (confirmedPaymentIntentId) => {
    try {
      const amount = Number(details?.amount_cents || 0) / 100;
      await api.post(
        "/api/payments/confirm",
        {
          appointment_id: Number(appointmentId),
          payment_intent_id: confirmedPaymentIntentId,
          amount,
        },
        { noAuth: true, noCompanyHeader: true }
      );
      setSuccess(true);
      setDetails((prev) => ({
        ...(prev || {}),
        payment_status: "paid",
        status: "succeeded",
      }));
    } catch (err) {
      setError(err?.response?.data?.error || "Payment succeeded but booking confirmation failed.");
    }
  };

  if (!stripePublicKey) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="error">Stripe public key is not configured.</Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading payment page...</Typography>
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

  if (!details) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="error">Payment details not found.</Alert>
      </Container>
    );
  }

  const amountLabel = formatCurrency(Number(details.amount_cents || 0) / 100, details.currency || "USD");

  return (
    <Container maxWidth="sm" sx={{ mt: 6, mb: 8 }}>
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Complete your payment
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {details.company_name || "Schedulaa"}
        </Typography>
        <Stack spacing={1} sx={{ mt: 2, mb: 3 }}>
          <Typography><strong>Service:</strong> {details.service_name || "Appointment"}</Typography>
          <Typography><strong>Provider:</strong> {details.provider_name || "-"}</Typography>
          <Typography><strong>Amount due:</strong> {amountLabel}</Typography>
        </Stack>

        {success ? (
          <>
            <Alert severity="success" sx={{ mb: 2 }}>
              Payment received. Your appointment is confirmed.
            </Alert>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button
                variant="contained"
                onClick={() => navigate(`/${slug}/booking-confirmation/${appointmentId}`)}
              >
                View booking
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate(`/${slug}?page=my-bookings`)}
              >
                My bookings
              </Button>
            </Box>
          </>
        ) : details.client_secret && stripePromise ? (
          <Elements stripe={stripePromise} options={{ clientSecret: details.client_secret }}>
            <PaymentForm onPaid={handlePaid} />
          </Elements>
        ) : (
          <Alert severity="warning">
            Payment is not available for this appointment right now.
          </Alert>
        )}
      </Paper>
    </Container>
  );
}
