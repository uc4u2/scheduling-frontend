import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import api from "../../utils/api";
import { openBillingPortal } from "./billingHelpers";
import { formatBillingNextDateLabel } from "./billingLabels";
import { isMobileComplianceMode } from "../../utils/mobileCompliance";
import MobileWebOnlyNotice from "../mobile/MobileWebOnlyNotice";

const PREVIEW_ERROR_COPY = {
  subscription_missing: "An active company subscription is required before Field Photos can be activated.",
  field_photos_price_missing: "Field Photos billing is not configured yet. Contact support.",
  field_photos_storage_price_missing: "Field Photos storage billing is not configured yet. Contact support.",
  preview_failed: "We could not load an estimate right now. You can still continue.",
};

const ACTION_ERROR_COPY = {
  subscription_missing: "An active company subscription is required before Field Photos can be changed.",
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
  const theme = useTheme();
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
  const monthlyLabel = isStorage ? "$10/month" : "$29/month";
  const modalSubtitle = isStorage
    ? "Expand storage for shift-linked proof photos."
    : "Enable secure, shift-linked proof photos for your team.";
  const itemDescription = isStorage ? "+10 GB" : "Secure proof-of-work photo uploads";
  const billingNotice = isStorage
    ? "Confirming will add 10 GB of Field Photos storage to your company subscription. Your saved payment method may be charged today based on Stripe’s billing estimate."
    : "Confirming will add this add-on to your company subscription. Your saved payment method may be charged today based on Stripe’s billing estimate.";
  const Icon = isStorage ? StorageOutlinedIcon : PhotoCameraIcon;
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
        setPreviewError(apiMessage(err, "We could not load an estimate right now. You can still continue.", PREVIEW_ERROR_COPY));
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
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1.25 }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 1.5,
              display: "grid",
              placeItems: "center",
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
            }}
          >
            <Icon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 950 }}>{title}</Typography>
            <Typography variant="body2" color="text.secondary">{modalSubtitle}</Typography>
          </Box>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ pt: 1.5 }}>
        <Stack spacing={1.75}>
          <Box
            sx={{
              border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
              borderRadius: 1.5,
              p: 1.75,
              bgcolor: alpha(theme.palette.primary.main, 0.035),
            }}
          >
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between">
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>{itemLabel}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {itemDescription}
                </Typography>
              </Box>
              <Chip label={monthlyLabel} color="primary" variant="outlined" sx={{ fontWeight: 900 }} />
            </Stack>
            {isStorage && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                Storage expansion total after this change: {targetStorageQty} pack{targetStorageQty === 1 ? "" : "s"}.
              </Typography>
            )}
          </Box>
          {loadingPreview && (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">Loading billing estimate...</Typography>
            </Stack>
          )}
          {preview && (
            <Stack spacing={0.5}>
              <Typography variant="body2" sx={{ fontWeight: 850 }}>
                Estimated charge today: {preview.amount_due_today_formatted || "—"}
              </Typography>
              {preview.next_billing_date && <Typography variant="caption" color="text.secondary">{nextBillingLabel}</Typography>}
            </Stack>
          )}
          {!loadingPreview && !preview && (
            <Typography variant="body2" color={blocksConfirm ? "error" : "text.secondary"}>
              {previewError || "We could not load an estimate right now. You can still continue."}
            </Typography>
          )}
          <Box
            sx={{
              border: `1px solid ${alpha(theme.palette.info.main, 0.22)}`,
              borderRadius: 1.25,
              bgcolor: alpha(theme.palette.info.main, 0.07),
              px: 1.4,
              py: 1.1,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <InfoOutlinedIcon fontSize="small" sx={{ color: theme.palette.info.main, mt: 0.15 }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 850, color: theme.palette.text.primary }}>
                  Billing confirmation
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.6, mt: 0.25 }}>
                  {billingNotice}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.6, mt: 0.5 }}>
                  This add-on is billed through your company subscription. You can review subscription details in Billing Settings.
                </Typography>
              </Box>
            </Stack>
          </Box>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, flexWrap: "wrap" }}>
        <Button onClick={onClose} disabled={submitting}>{success ? "Close" : "Cancel"}</Button>
        <Button variant="outlined" onClick={() => openBillingPortal()} disabled={submitting} sx={{ ml: { xs: 0, sm: "auto" } }}>
          Billing portal
        </Button>
        {!success && (
          <Button variant="contained" onClick={handleConfirm} disabled={submitting || blocksConfirm}>
            {submitting ? "Saving..." : isStorage ? "Confirm storage" : "Confirm activation"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default FieldPhotosBillingModal;
