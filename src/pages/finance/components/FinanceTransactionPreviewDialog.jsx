import React, { useMemo } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTheme } from "@mui/material/styles";
import { formatCurrency } from "../../../utils/formatters";

const formatMoney = (value, currency) => formatCurrency(Number(value || 0), currency);

export const buildFinancePreviewSummary = (preview) => {
  if (!preview) return "";
  const taxLine = preview?.tax?.label
    ? `${preview.tax.label}${preview.tax.default_rate ? ` ${preview.tax.default_rate}%` : ""}`
    : "Tax";
  return [
    "Business Finance preview",
    "",
    `Currency: ${preview.currency || "USD"}`,
    `Subtotal: ${formatMoney(preview?.customer_view?.subtotal, preview.currency)}`,
    `Tax: ${taxLine} — ${formatMoney(preview?.customer_view?.tax_total, preview.currency)}`,
    `Total customer pays: ${formatMoney(preview?.customer_view?.total, preview.currency)}`,
    "",
    "Payment link:",
    `Stripe would collect ${formatMoney(preview?.payment_link_preview?.amount_to_collect, preview.currency)}.`,
    `Stripe Automatic Tax is ${preview?.payment_link_preview?.stripe_automatic_tax_applied ? "applied" : "not applied"} because Schedulaa already calculated the Finance tax.`,
    "",
    "Preview only. No document, payment link, or charge was created.",
  ].join("\n");
};

export default function FinanceTransactionPreviewDialog({
  open,
  onClose,
  title = "Preview customer total",
  preview,
  loading = false,
  error = "",
  stale = false,
  onRefresh,
  onCopySummary,
  children = null,
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const lineItems = Array.isArray(preview?.line_items) ? preview.line_items : [];
  const taxComponents = Array.isArray(preview?.tax?.components) ? preview.tax.components : [];
  const source = preview?.source || {};
  const paymentPreview = preview?.payment_link_preview || {};
  const customerView = preview?.customer_view || {};
  const copyDisabled = !preview || loading;

  const sourceStatus = useMemo(() => {
    if (!source?.status) return "";
    return String(source.status).replace(/_/g, " ");
  }, [source?.status]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" fullScreen={fullScreen}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Stack spacing={0.25}>
          <Typography variant="h6" fontWeight={800}>{title}</Typography>
          {sourceStatus ? (
            <Typography variant="body2" color="text.secondary">
              {source.type === "invoice" ? "Invoice" : source.type === "estimate" ? "Estimate" : "Draft"} status: {sourceStatus}
            </Typography>
          ) : null}
        </Stack>
        <IconButton onClick={onClose} aria-label="Close preview">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <Stack spacing={2} sx={{ p: 2 }}>
          <Alert severity="info">
            Preview only — no document, payment link, or Stripe charge will be created.
          </Alert>
          {stale ? (
            <Alert severity="warning">
              The document changed after this preview. Refresh to see current totals.
            </Alert>
          ) : null}
          {error ? <Alert severity="error">{error}</Alert> : null}

          {children}

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
                  {lineItems.map((line, index) => (
                    <Stack key={`${line.description}-${index}`} direction="row" justifyContent="space-between" spacing={2}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{line.description || "Line item"}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Qty {line.quantity} • {formatMoney(line.unit_price, preview.currency)}
                          {line.taxable ? " • Taxable" : " • Non-taxable"}
                        </Typography>
                      </Box>
                      <Typography variant="body2">{formatMoney(line.gross || line.base || 0, preview.currency)}</Typography>
                    </Stack>
                  ))}
                  <Divider flexItem sx={{ my: 0.5 }} />
                  <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Subtotal</Typography><Typography variant="body2">{formatMoney(customerView.subtotal, preview.currency)}</Typography></Stack>
                  {Number(customerView.discount_total || 0) > 0 ? (
                    <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Discount</Typography><Typography variant="body2">-{formatMoney(customerView.discount_total, preview.currency)}</Typography></Stack>
                  ) : null}
                  <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Tax</Typography><Typography variant="body2">{formatMoney(customerView.tax_total, preview.currency)}</Typography></Stack>
                  <Stack direction="row" justifyContent="space-between"><Typography variant="subtitle2" fontWeight={800}>Total customer pays</Typography><Typography variant="subtitle2" fontWeight={800}>{formatMoney(customerView.total, preview.currency)}</Typography></Stack>
                  {source.type === "invoice" ? (
                    <>
                      <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Already paid</Typography><Typography variant="body2">{formatMoney(customerView.amount_paid, preview.currency)}</Typography></Stack>
                      <Stack direction="row" justifyContent="space-between"><Typography variant="subtitle2" fontWeight={800}>Balance due</Typography><Typography variant="subtitle2" fontWeight={800}>{formatMoney(customerView.balance_due, preview.currency)}</Typography></Stack>
                    </>
                  ) : null}
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>
                  Payment view
                </Typography>
                <Stack spacing={0.75}>
                  <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Stripe would collect</Typography><Typography variant="body2">{formatMoney(paymentPreview.amount_to_collect, preview.currency)}</Typography></Stack>
                  <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Currency</Typography><Typography variant="body2">{String(paymentPreview.stripe_currency || preview.currency || "USD").toUpperCase()}</Typography></Stack>
                  <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Stripe Automatic Tax</Typography><Typography variant="body2">{paymentPreview.stripe_automatic_tax_applied ? "Applied" : "Not applied"}</Typography></Stack>
                  <Typography variant="body2" color="text.secondary">{paymentPreview.message}</Typography>
                </Stack>
              </Box>

              <Accordion disableGutters sx={{ boxShadow: "none", border: 1, borderColor: "divider", borderRadius: 1.5, overflow: "hidden" }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2" fontWeight={700}>Calculation details</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={0.75}>
                    <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Jurisdiction</Typography><Typography variant="body2">{preview?.tax?.jurisdiction?.country || "—"} / {preview?.tax?.jurisdiction?.region || "—"}</Typography></Stack>
                    <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Tax profile</Typography><Typography variant="body2">{preview?.tax?.label || "—"}</Typography></Stack>
                    <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Combined rate used</Typography><Typography variant="body2">{preview?.tax?.default_rate ? `${preview.tax.default_rate}%` : "—"}</Typography></Stack>
                    <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Prices include tax</Typography><Typography variant="body2">{preview?.tax?.prices_include_tax ? "Yes" : "No"}</Typography></Stack>
                    <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Tax profile source</Typography><Typography variant="body2">{preview?.tax?.source || "—"}</Typography></Stack>
                    {taxComponents.length ? (
                      <Box>
                        <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>Component rates</Typography>
                        <Stack spacing={0.5}>
                          {taxComponents.map((component) => (
                            <Typography key={`${component.code}-${component.rate}`} variant="body2" color="text.secondary">
                              {component.code} rate: {component.rate}%
                            </Typography>
                          ))}
                        </Stack>
                      </Box>
                    ) : null}
                    <Typography variant="caption" color="text.secondary">
                      Rounding follows the current Business Finance document calculation rules.
                    </Typography>
                  </Stack>
                </AccordionDetails>
              </Accordion>
            </>
          ) : null}
        </Stack>
      </DialogContent>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, p: 2, flexWrap: "wrap" }}>
        <Button
          variant="outlined"
          startIcon={<ContentCopyOutlinedIcon />}
          onClick={onCopySummary}
          disabled={copyDisabled}
        >
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
