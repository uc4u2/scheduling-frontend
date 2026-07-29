import React from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import { useTheme } from "@mui/material/styles";
import { formatCurrency } from "../../utils/formatters";

const money = (value, currency) => {
  if (value == null || value === "") return "—";
  return formatCurrency(Number(value || 0), currency || "USD");
};

const paymentModeLabel = (mode) => {
  switch (mode) {
    case "pay_now":
      return "Pay during checkout";
    case "card_on_file":
      return "Card on file";
    default:
      return "Offline payment";
  }
};

export const buildBookingPreviewSummary = (preview) => {
  if (!preview) return "";
  const currency = preview.currency || "USD";
  const customerView = preview.customer_view || {};
  const lines = [
    "Booking payment preview",
    "",
    `Payment mode: ${paymentModeLabel(preview.payment_mode)}`,
    `Currency: ${currency}`,
  ];

  if (customerView.subtotal_before_tax != null) {
    lines.push(`Subtotal before tax: ${money(customerView.subtotal_before_tax, currency)}`);
  }

  if (preview.payment_mode === "offline") {
    lines.push(`Charged online: ${money(customerView.amount_due_now || 0, currency)}`);
    lines.push(`Collected by business: ${money(customerView.amount_due_later || customerView.total_expected || 0, currency)}${preview.tax?.prices_include_tax ? "" : " before any manually added tax"}`);
  } else if (preview.payment_mode === "card_on_file") {
    lines.push(`Charged during booking: ${money(customerView.amount_due_now || 0, currency)}`);
    lines.push(`Card saved for later: ${preview.payment?.card_saved ? "Yes" : "Expected during real booking"}`);
    lines.push("Later charge amount: Selected by the Manager");
  } else {
    lines.push(`Tax: ${preview.tax?.message || "Calculated during Stripe Checkout"}`);
    lines.push("Final customer total: Finalized during checkout");
  }

  lines.push("");
  lines.push(`Tax handling: ${preview.tax?.message || "Current checkout settings apply."}`);
  lines.push("");
  lines.push("Preview only. No Booking, saved card, Stripe object, or payment was created.");
  return lines.join("\n");
};

export default function BookingPaymentPreviewDialog({
  open,
  onClose,
  preview,
  loading = false,
  error = "",
  stale = false,
  staleMessage = "Booking payment settings changed after this preview. Refresh to see current behavior.",
  onRefresh,
  onCopySummary,
  children = null,
  title = "Preview customer payment",
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const lineItems = Array.isArray(preview?.line_items) ? preview.line_items : [];
  const warnings = Array.isArray(preview?.warnings) ? preview.warnings : [];
  const customerView = preview?.customer_view || {};
  const payment = preview?.payment || {};
  const tax = preview?.tax || {};

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" fullScreen={fullScreen}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Typography component="span" variant="h6" fontWeight={800}>{title}</Typography>
        <IconButton onClick={onClose} aria-label="Close booking preview">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <Stack spacing={2} sx={{ p: 2 }}>
          <Alert severity="info">
            Preview only — no Booking, time-slot hold, saved card, payment, Stripe object, or email will be created.
          </Alert>
          {stale ? (
            <Alert severity="warning">
              {staleMessage}
            </Alert>
          ) : null}
          {error ? <Alert severity="error">{error}</Alert> : null}
          {children}
          {warnings.length ? warnings.map((warning, index) => (
            <Alert severity="warning" key={`${warning}-${index}`}>{warning}</Alert>
          )) : null}

          {loading ? (
            <Stack alignItems="center" sx={{ py: 6 }}>
              <CircularProgress size={28} />
            </Stack>
          ) : preview ? (
            <>
              <Box>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>
                  Customer view
                </Typography>
                <Stack spacing={0.75}>
                  {lineItems.map((line) => (
                    <Stack key={`${line.code}-${line.label}`} direction="row" justifyContent="space-between" spacing={2}>
                      <Typography variant="body2">{line.label}</Typography>
                      <Typography variant="body2">{money(line.amount, preview.currency)}</Typography>
                    </Stack>
                  ))}
                  <Divider flexItem sx={{ my: 0.5 }} />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Subtotal before tax</Typography>
                    <Typography variant="body2">{money(customerView.subtotal_before_tax, preview.currency)}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Tax</Typography>
                    <Typography variant="body2">
                      {customerView.tax_amount != null
                        ? money(customerView.tax_amount, preview.currency)
                        : customerView.tax_amount_status === "calculated_at_checkout"
                          ? "Calculated by Stripe"
                          : customerView.tax_amount_status === "included"
                            ? "Included in listed price"
                            : customerView.tax_amount_status === "manual"
                              ? "Manual"
                              : "Not applied automatically"}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Customer pays now</Typography>
                    <Typography variant="body2">
                      {customerView.amount_due_now != null
                        ? money(customerView.amount_due_now, preview.currency)
                        : customerView.amount_due_now_status === "provider_calculated"
                          ? "Finalized at checkout"
                          : "0.00"}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Customer pays later</Typography>
                    <Typography variant="body2">
                      {customerView.amount_due_later != null ? money(customerView.amount_due_later, preview.currency) : "Selected later by the Manager"}
                    </Typography>
                  </Stack>
                  {customerView.amount_paid != null ? (
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Already paid</Typography>
                      <Typography variant="body2">{money(customerView.amount_paid, preview.currency)}</Typography>
                    </Stack>
                  ) : null}
                  {customerView.balance_due != null ? (
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="subtitle2" fontWeight={800}>Balance due</Typography>
                      <Typography variant="subtitle2" fontWeight={800}>{money(customerView.balance_due, preview.currency)}</Typography>
                    </Stack>
                  ) : null}
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="subtitle2" fontWeight={800}>Final total status</Typography>
                    <Typography variant="subtitle2" fontWeight={800}>
                      {customerView.total_expected != null ? money(customerView.total_expected, preview.currency) : "Finalized during checkout"}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>
                  Payment flow
                </Typography>
                <Stack spacing={0.75}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Payment mode</Typography>
                    <Typography variant="body2">{paymentModeLabel(preview.payment_mode)}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Card saved for later</Typography>
                    <Typography variant="body2">{payment.card_saved ? "Yes" : "No"}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Online charge created during real flow</Typography>
                    <Typography variant="body2">{payment.online_charge_created ? "Yes" : "No"}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Stripe Automatic Tax</Typography>
                    <Typography variant="body2">{payment.stripe_automatic_tax ? "Enabled" : "Not applied"}</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {tax.message}
                  </Typography>
                </Stack>
              </Box>

              <Accordion disableGutters sx={{ boxShadow: "none", border: 1, borderColor: "divider", borderRadius: 1.5, overflow: "hidden" }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2" fontWeight={700}>Tax and currency details</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={0.75}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Business currency</Typography>
                      <Typography variant="body2">{preview.currency}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Payment mode source</Typography>
                      <Typography variant="body2">{preview.settings_source?.payment_mode || "Checkout Pro & Payments"}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Prices include tax</Typography>
                      <Typography variant="body2">{tax.prices_include_tax ? "Yes" : "No"}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Tax handling</Typography>
                      <Typography variant="body2">
                        {tax.handling_mode === "stripe_checkout_automatic_tax"
                          ? "Stripe Automatic Tax"
                          : tax.handling_mode === "included_in_entered_amount"
                            ? "Included in entered amount"
                            : "Manual"}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      This preview uses the tenant’s current Booking payment settings and company currency context without creating any Stripe or Booking objects.
                    </Typography>
                  </Stack>
                </AccordionDetails>
              </Accordion>
            </>
          ) : null}
        </Stack>
      </DialogContent>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, p: 2, flexWrap: "wrap" }}>
        <Button variant="outlined" startIcon={<ContentCopyOutlinedIcon />} onClick={onCopySummary} disabled={!preview || loading}>
          Copy summary
        </Button>
        <Stack direction="row" spacing={1} sx={{ ml: "auto" }}>
          <Button variant="outlined" startIcon={<RefreshOutlinedIcon />} onClick={onRefresh} disabled={loading}>
            Refresh preview
          </Button>
          <Button onClick={onClose}>Close</Button>
        </Stack>
      </Box>
    </Dialog>
  );
}
