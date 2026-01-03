import React, { useEffect, useState } from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import api from "../../utils/api";
import { openBillingPortal } from "./billingHelpers";

const SeatsRequiredModal = ({ open, allowed, current, onClose }) => {
  const needed = Math.max(1, (current || 0) - (allowed || 0));
  const [seatInput, setSeatInput] = useState(String(needed));
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [invoiceUrl, setInvoiceUrl] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setSeatInput(String(needed));
  }, [needed]);

  useEffect(() => {
    if (!open) return;
    const value = Math.max(0, parseInt(seatInput, 10) || 0);
    if (!value) {
      setPreview(null);
      setPreviewError("");
      return;
    }
    let active = true;
    setLoadingPreview(true);
    api
      .get(`/billing/seats/preview?addon_qty=${value}`)
      .then((res) => {
        if (!active) return;
        setPreview(res?.data || null);
        setPreviewError("");
      })
      .catch((err) => {
        if (!active) return;
        setPreview(null);
        const apiError = err?.response?.data?.error;
        const apiMessage = err?.response?.data?.message;
        if (apiError === "subscription_missing") {
          setPreviewError("No active subscription. Start a plan to purchase seats.");
        } else if (apiError === "seat_addon_price_missing") {
          setPreviewError("Seat add-on price is not configured yet.");
        } else if (apiMessage) {
          setPreviewError(apiMessage);
        } else {
          setPreviewError("Estimate unavailable. You can still continue.");
        }
      })
      .finally(() => {
        if (!active) return;
        setLoadingPreview(false);
      });
    return () => {
      active = false;
    };
  }, [open, seatInput]);

  const handlePurchase = async () => {
    setError("");
    setSuccessMessage("");
    const additional = Math.max(0, parseInt(seatInput, 10) || 0);
    if (!additional) {
      setError("Enter at least 1 seat.");
      return;
    }
    setLoading(true);
    try {
      const targetTotal = (allowed || 0) + additional;
      const res = await api.post("/billing/seats/set", { target_total_seats: targetTotal });
      setInvoiceUrl(res?.data?.latest_invoice_url || "");
      setSuccessMessage("Seats updated. You can view the invoice or manage billing.");
    } catch (err) {
      const apiError = err?.response?.data?.error;
      if (apiError === "subscription_missing") {
        setError("No active subscription. Start a plan to purchase seats.");
      } else {
        setError(apiError || "Unable to purchase seats.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add seats</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={1.5}>
          <Typography variant="body2" color="text.secondary">
            You need more seats to continue. Add seats below.
          </Typography>
          <TextField
            label="Additional seats"
            type="number"
            inputProps={{ min: 1 }}
            value={seatInput}
            onChange={(e) => setSeatInput(e.target.value)}
            fullWidth
          />
          {loadingPreview && (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={16} />
              <Typography variant="caption">Fetching estimate…</Typography>
            </Stack>
          )}
          {preview && (
            <Stack spacing={0.5}>
              <Typography variant="caption">
                Estimated charge today: {preview.amount_due_today_formatted || "—"}
              </Typography>
              <Typography variant="caption">
                Next billing date: {preview.next_billing_date ? new Date(preview.next_billing_date).toLocaleDateString() : "—"}
              </Typography>
            </Stack>
          )}
          {!loadingPreview && !preview && (
            <Typography variant="caption" color="text.secondary">
              {previewError || "Estimate unavailable. You can still continue."}
            </Typography>
          )}
          {error && <Typography color="error" variant="caption">{error}</Typography>}
          {invoiceUrl && (
            <Typography variant="caption">
              Invoice ready. Use the buttons below to view it.
            </Typography>
          )}
          {successMessage && (
            <Typography variant="caption" color="text.secondary">
              {successMessage}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Close</Button>
        {invoiceUrl && (
          <Button
            variant="outlined"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.open(invoiceUrl, "_blank", "noopener");
              }
            }}
          >
            View invoice
          </Button>
        )}
        <Button variant="outlined" onClick={() => openBillingPortal()}>
          Open billing portal
        </Button>
        {!successMessage && (
          <Button variant="contained" onClick={handlePurchase} disabled={loading}>
            Confirm purchase
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default SeatsRequiredModal;
