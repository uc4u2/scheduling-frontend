import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import api from "../../utils/api";
import { openBillingPortal } from "./billingHelpers";
import { formatBillingNextDateLabel } from "./billingLabels";
import { isMobileComplianceMode } from "../../utils/mobileCompliance";
import MobileWebOnlyNotice from "../mobile/MobileWebOnlyNotice";

const PREVIEW_ERROR_COPY = {
  subscription_missing: "No active subscription. Start a plan before activating Field Photos.",
  field_photos_price_missing: "Field Photos billing is not configured yet. Contact support.",
  field_photos_storage_price_missing: "Field Photos storage billing is not configured yet. Contact support.",
  preview_failed: "Estimate unavailable. You can still continue.",
};

const ACTION_ERROR_COPY = {
  subscription_missing: "No active subscription. Start a plan before changing Field Photos.",
  field_photos_price_missing: "Field Photos billing is not configured yet. Contact support.",
  field_photos_storage_price_missing: "Field Photos storage billing is not configured yet. Contact support.",
  field_photos_activation_failed: "Unable to activate Field Photos. Please try again or contact support.",
  field_photos_storage_update_failed: "Unable to update Field Photos storage. Please try again or contact support.",
};

const apiMessage = (err, fallback, map = ACTION_ERROR_COPY) => {
  const code = err?.response?.data?.error;
  return map[code] || err?.response?.data?.message || fallback;
};

const FieldPhotosBillingModal = ({
  open,
  mode = "activate",
  currentStorageQty = 0,
  onClose,
  onSuccess,
}) => {
  const mobileComplianceMode = isMobileComplianceMode();
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isStorage = mode === "storage";
  const targetStorageQty = Math.max(0, Number(currentStorageQty || 0)) + 1;
  const title = isStorage ? "Add Field Photos storage" : "Activate Field Photos";
  const itemLabel = isStorage ? "Field Photos Storage Expansion" : "Field Photos Add-on";
  const monthlyLabel = isStorage ? "+10 GB · $10/month" : "$29/month";
  const nextBillingLabel = formatBillingNextDateLabel({
    nextBillingDate: preview?.next_billing_date,
  });

  const blocksConfirm = useMemo(() => {
    const code = preview?.error || "";
    const text = String(previewError || "").toLowerCase();
    return code.includes("price_missing") || text.includes("not configured");
  }, [preview, previewError]);

  useEffect(() => {
    if (!open) {
      setPreview(null);
      setPreviewError("");
      setError("");
      setSuccess("");
      setSubmitting(false);
      return undefined;
    }
    if (mobileComplianceMode) return undefined;
    let active = true;
    setLoadingPreview(true);
    setPreview(null);
    setPreviewError("");
    setError("");
    const url = isStorage
      ? `/billing/field-photos/storage/preview?addon_qty=${targetStorageQty}`
      : "/billing/field-photos/preview";
    api
      .get(url)
      .then((res) => {
        if (!active) return;
        setPreview(res?.data || null);
      })
      .catch((err) => {
        if (!active) return;
        setPreview(null);
        setPreviewError(apiMessage(err, "Estimate unavailable. You can still continue.", PREVIEW_ERROR_COPY));
      })
      .finally(() => {
        if (!active) return;
        setLoadingPreview(false);
      });
    return () => {
      active = false;
    };
  }, [open, isStorage, targetStorageQty, mobileComplianceMode]);

  const handleConfirm = async () => {
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const res = isStorage
        ? await api.post("/billing/field-photos/storage/set", { addon_qty: targetStorageQty })
        : await api.post("/billing/field-photos/activate", {});
      setSuccess(isStorage ? "Field Photos storage updated." : "Field Photos activated.");
      if (onSuccess) onSuccess(res?.data || null);
    } catch (err) {
      setError(apiMessage(err, isStorage ? "Unable to update Field Photos storage." : "Unable to activate Field Photos."));
    } finally {
      setSubmitting(false);
    }
  };

  if (mobileComplianceMode) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <MobileWebOnlyNotice
            title="Field Photos billing is web-only in mobile app mode"
            webPath="/manager/dashboard?view=settings&tab=billing"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={1.4}>
          <Typography variant="body2" color="text.secondary">
            Review the billing change before continuing.
          </Typography>
          <Stack spacing={0.4}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>{itemLabel}</Typography>
            <Typography variant="body2">{monthlyLabel}</Typography>
            {isStorage && (
              <Typography variant="caption" color="text.secondary">
                New storage expansion total: {targetStorageQty} pack{targetStorageQty === 1 ? "" : "s"}.
              </Typography>
            )}
          </Stack>
          {loadingPreview && (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={16} />
              <Typography variant="caption">Fetching estimate...</Typography>
            </Stack>
          )}
          {preview && (
            <Stack spacing={0.4}>
              <Typography variant="caption">
                Estimated charge today: {preview.amount_due_today_formatted || "—"}
              </Typography>
              {preview.next_billing_date && <Typography variant="caption">{nextBillingLabel}</Typography>}
            </Stack>
          )}
          {!loadingPreview && !preview && (
            <Typography variant="caption" color={blocksConfirm ? "error" : "text.secondary"}>
              {previewError || "Estimate unavailable. You can still continue."}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary">
            Changes are applied to the company subscription.
          </Typography>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting}>{success ? "Close" : "Cancel"}</Button>
        <Button variant="outlined" onClick={() => openBillingPortal()} disabled={submitting}>
          Billing portal
        </Button>
        {!success && (
          <Button variant="contained" onClick={handleConfirm} disabled={submitting || blocksConfirm}>
            {submitting ? "Saving..." : "Confirm"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default FieldPhotosBillingModal;
