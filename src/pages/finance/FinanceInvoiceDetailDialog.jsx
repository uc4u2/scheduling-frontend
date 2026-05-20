import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LaunchIcon from "@mui/icons-material/Launch";
import LocalPrintshopOutlinedIcon from "@mui/icons-material/LocalPrintshopOutlined";
import PaymentOutlinedIcon from "@mui/icons-material/PaymentOutlined";
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined";
import { useSnackbar } from "notistack";
import FinanceStatusChip from "./components/FinanceStatusChip";
import FinanceInvoiceOfflinePaymentDialog from "./FinanceInvoiceOfflinePaymentDialog";
import FinanceInvoiceRefundDialog from "./FinanceInvoiceRefundDialog";
import {
  createBillingRecipient,
  createSimilarFinanceInvoice,
  createFinanceInvoicePaymentLink,
  getFinanceInvoice,
  getFinanceInvoicePrintHtml,
  listBillingRecipients,
  updateFinanceInvoice,
} from "./financeApi";
import { formatCurrency } from "../../utils/formatters";

const blankBillingRecipient = {
  company_name: "",
  contact_name: "",
  email: "",
  phone: "",
  address_street: "",
  address_city: "",
  address_state: "",
  address_province: "",
  address_zip: "",
  address_country: "",
  tax_id: "",
};

const blankForm = {
  issue_date: "",
  due_date: "",
  description: "",
  notes: "",
  terms: "",
  po_number: "",
  payment_terms: "",
  payment_instructions: "",
  billing_notes_internal: "",
  billing_recipient: blankBillingRecipient,
};

const coalesceText = (value) => (value == null ? "" : String(value));
const formatStatusLabel = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "Pending";
  if (normalized === "partial_refund") return "Partial refund";
  if (normalized === "partial_payment") return "Partially paid";
  if (normalized === "payment_failed") return "Payment failed";
  return normalized
    .split("_")
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : ""))
    .join(" ");
};

const formatPaymentOriginLabel = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized || normalized === "unpaid") return "Pending";
  if (normalized === "online") return "Paid online";
  if (normalized === "offline") return "Paid offline";
  if (normalized === "mixed") return "Mixed online and offline";
  if (normalized === "partially_paid_offline") return "Partially paid offline";
  return formatStatusLabel(normalized);
};

const buildFormFromInvoice = (invoice) => ({
  issue_date: invoice?.issue_date || "",
  due_date: invoice?.due_date || "",
  description: invoice?.description || "",
  notes: invoice?.notes || "",
  terms: invoice?.terms || "",
  po_number: invoice?.custom_fields_json?.po_number || "",
  payment_terms: invoice?.custom_fields_json?.payment_terms || "",
  payment_instructions: invoice?.custom_fields_json?.payment_instructions || "",
  billing_notes_internal: invoice?.custom_fields_json?.billing_notes_internal || "",
  billing_recipient: {
    ...blankBillingRecipient,
    ...(invoice?.billing_recipient || invoice?.billing_address_json || {}),
  },
});

export default function FinanceInvoiceDetailDialog({
  open,
  invoiceId,
  onClose,
  onSaved,
  onOpenInvoice,
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [invoice, setInvoice] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [billingRecipients, setBillingRecipients] = useState([]);
  const [billingRecipientsLoading, setBillingRecipientsLoading] = useState(false);
  const [billingRecipientsError, setBillingRecipientsError] = useState("");
  const [selectedBillingRecipientId, setSelectedBillingRecipientId] = useState("");
  const [savingBillingRecipient, setSavingBillingRecipient] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [offlinePaymentDialogOpen, setOfflinePaymentDialogOpen] = useState(false);
  const [printOpening, setPrintOpening] = useState(false);
  const [creatingSimilar, setCreatingSimilar] = useState(false);

  useEffect(() => {
    if (!open || !invoiceId) return;
    let active = true;
    setLoading(true);
    setError("");
    setWarning("");
    getFinanceInvoice(invoiceId)
      .then((payload) => {
        if (!active) return;
        const nextInvoice = payload?.invoice || null;
        setInvoice(nextInvoice);
        setForm(buildFormFromInvoice(nextInvoice));
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.response?.data?.error || err?.message || "Unable to load invoice.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [invoiceId, open]);

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    const loadBillingRecipients = async () => {
      if (active) {
        setBillingRecipientsLoading(true);
        setBillingRecipientsError("");
      }
      try {
        const items = await listBillingRecipients();
        if (!active) return;
        setBillingRecipients(Array.isArray(items) ? items : []);
      } catch (err) {
        if (active) {
          setBillingRecipients([]);
          setBillingRecipientsError(
            err?.response?.data?.error ||
              err?.message ||
              "Unable to load saved billing recipients."
          );
        }
      } finally {
        if (active) setBillingRecipientsLoading(false);
      }
    };
    loadBillingRecipients();
    return () => {
      active = false;
    };
  }, [open]);

  const totalLabel = useMemo(
    () => formatCurrency(invoice?.total, invoice?.currency),
    [invoice?.currency, invoice?.total]
  );

  const refundSummary = invoice?.refund_summary || {};
  const paymentSummary = invoice?.payment_summary || {};
  const refundHistory = refundSummary?.refunds || [];
  const remainingRefundable = Number(refundSummary?.remaining_refundable_amount || 0);
  const remainingBalance = Number(paymentSummary?.remaining_balance || 0);
  const canIssueRefund =
    Boolean(invoice?.refund_eligible) &&
    remainingRefundable > 0 &&
    ["paid", "partial_refund"].includes(String(invoice?.status || "").toLowerCase());
  const canRecordOfflinePayment =
    remainingBalance > 0 &&
    !["refunded", "void"].includes(String(invoice?.status || "").toLowerCase()) &&
    !paymentSummary?.online_payment_present;
  const hasHostedLink = Boolean(invoice?.hosted_invoice_url);
  const relatedWorkOrders = invoice?.related_work_orders || [];

  const setField = (field, value) =>
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

  const setBillingField = (field, value) =>
    setForm((prev) => ({
      ...prev,
      billing_recipient: {
        ...prev.billing_recipient,
        [field]: value,
      },
    }));

  const applySavedBillingRecipient = () => {
    const recipient = billingRecipients.find((row) => String(row.id) === String(selectedBillingRecipientId));
    if (!recipient) return;
    setForm((prev) => ({
      ...prev,
      billing_recipient: {
        ...blankBillingRecipient,
        company_name: recipient.company_name || "",
        contact_name: recipient.contact_name || "",
        email: recipient.email || "",
        phone: recipient.phone || "",
        address_street: recipient.address_street || "",
        address_city: recipient.address_city || "",
        address_state: recipient.address_state || "",
        address_province: recipient.address_province || "",
        address_zip: recipient.address_zip || "",
        address_country: recipient.address_country || "",
        tax_id: recipient.tax_id || "",
      },
    }));
    enqueueSnackbar("Saved billing recipient copied into this invoice.", { variant: "success" });
  };

  const handleSaveBillingRecipient = async () => {
    const companyName = String(form.billing_recipient.company_name || "").trim();
    if (!companyName) {
      enqueueSnackbar("Enter a company or recipient name before saving billing details.", {
        variant: "warning",
      });
      return;
    }
    setSavingBillingRecipient(true);
    setError("");
    try {
      const recipient = await createBillingRecipient({
        company_name: companyName,
        contact_name: form.billing_recipient.contact_name || "",
        email: form.billing_recipient.email || "",
        phone: form.billing_recipient.phone || "",
        address_street: form.billing_recipient.address_street || "",
        address_city: form.billing_recipient.address_city || "",
        address_state: form.billing_recipient.address_state || "",
        address_province: form.billing_recipient.address_province || "",
        address_zip: form.billing_recipient.address_zip || "",
        address_country: form.billing_recipient.address_country || "",
        tax_id: form.billing_recipient.tax_id || "",
      });
      if (recipient?.id != null) {
        setBillingRecipients((prev) => {
          const next = Array.isArray(prev) ? [...prev] : [];
          const existingIndex = next.findIndex((row) => String(row.id) === String(recipient.id));
          if (existingIndex >= 0) next[existingIndex] = recipient;
          else next.unshift(recipient);
          return next;
        });
        setSelectedBillingRecipientId(String(recipient.id));
      }
      enqueueSnackbar("Billing details saved for next time.", { variant: "success" });
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Unable to save billing details for later reuse."
      );
    } finally {
      setSavingBillingRecipient(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setWarning("");
    try {
      const payload = await updateFinanceInvoice(invoiceId, {
        issue_date: form.issue_date || null,
        due_date: form.due_date || null,
        description: form.description,
        notes: form.notes,
        terms: form.terms,
        billing_recipient: form.billing_recipient,
        po_number: form.po_number,
        payment_terms: form.payment_terms,
        payment_instructions: form.payment_instructions,
        billing_notes_internal: form.billing_notes_internal,
      });
      const nextInvoice = payload?.invoice || null;
      setInvoice(nextInvoice);
      setForm(buildFormFromInvoice(nextInvoice));
      setWarning(payload?.warning || "");
      enqueueSnackbar("Invoice document details saved.", { variant: "success" });
      onSaved?.(nextInvoice);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to save invoice.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyPaymentLink = async () => {
    if (!invoiceId) return;
    try {
      const payload = await createFinanceInvoicePaymentLink(invoiceId);
      const checkoutUrl = payload?.checkout_url || payload?.invoice?.hosted_invoice_url || "";
      if (!checkoutUrl) {
        throw new Error("Payment link is not available yet.");
      }
      await navigator.clipboard.writeText(checkoutUrl);
      enqueueSnackbar("Payment link copied.", { variant: "success" });
      const nextInvoice = payload?.invoice || null;
      if (nextInvoice) {
        setInvoice((prev) => ({ ...(prev || {}), ...nextInvoice }));
      }
      onSaved?.(nextInvoice || invoice);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to create payment link.");
    }
  };

  const handleOpenPaymentLink = async () => {
    const hostedUrl = invoice?.hosted_invoice_url;
    if (!hostedUrl) {
      await handleCopyPaymentLink();
      return;
    }
    window.open(hostedUrl, "_blank", "noopener,noreferrer");
  };

  const handleOpenPrintView = async () => {
    if (!invoice?.id || printOpening) return;
    setPrintOpening(true);
    setError("");
    try {
      const html = await getFinanceInvoicePrintHtml(invoice.id);
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const blobUrl = URL.createObjectURL(blob);
      const printWindow = window.open(blobUrl, "_blank", "noopener,noreferrer");
      if (!printWindow) {
        URL.revokeObjectURL(blobUrl);
        enqueueSnackbar("Print window was blocked. Please allow popups and try again.", {
          variant: "warning",
        });
        return;
      }
      window.setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 60_000);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to open the print view.");
    } finally {
      setPrintOpening(false);
    }
  };

  const handleRefunded = (payload) => {
    const nextInvoice = payload?.invoice || null;
    if (nextInvoice) {
      setInvoice(nextInvoice);
      setForm(buildFormFromInvoice(nextInvoice));
      setWarning("");
      onSaved?.(nextInvoice);
    }
    setRefundDialogOpen(false);
  };

  const handleCreateSimilarInvoice = async () => {
    if (!invoice?.id) return;
    setCreatingSimilar(true);
    setError("");
    try {
      const payload = await createSimilarFinanceInvoice(invoice.id);
      const nextInvoice = payload?.invoice || null;
      if (!nextInvoice?.id) {
        throw new Error("New invoice was not returned.");
      }
      enqueueSnackbar(`Similar invoice created: ${nextInvoice.invoice_number || `#${nextInvoice.id}`}.`, {
        variant: "success",
      });
      onSaved?.(nextInvoice);
      if (onOpenInvoice) {
        onOpenInvoice(nextInvoice.id);
      } else {
        onClose?.();
      }
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to create similar invoice.");
    } finally {
      setCreatingSimilar(false);
    }
  };

  const handleOfflinePaymentSaved = (payload) => {
    const nextInvoice = payload?.invoice || null;
    if (nextInvoice) {
      setInvoice(nextInvoice);
      setForm(buildFormFromInvoice(nextInvoice));
      setWarning("");
      onSaved?.(nextInvoice);
    }
    setOfflinePaymentDialogOpen(false);
  };

  return (
    <>
      <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="lg">
        <DialogTitle>Finance Invoice Detail</DialogTitle>
        <DialogContent dividers sx={{ maxHeight: "72vh" }}>
          {loading ? (
            <Stack alignItems="center" sx={{ py: 6 }}>
              <CircularProgress />
            </Stack>
          ) : (
            <Stack spacing={2.5}>
              {error ? <Alert severity="error">{error}</Alert> : null}
              {warning ? <Alert severity="warning">{warning}</Alert> : null}
              {hasHostedLink ? (
                <Alert severity="warning">
                  Payment link already exists. Billing/document edits update Schedulaa records but may not change the already-created Stripe hosted invoice.
                </Alert>
              ) : null}

              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={1.5}
                  justifyContent="space-between"
                  alignItems={{ md: "center" }}
                >
                  <Stack spacing={1}>
                    <Typography variant="h6" fontWeight={700}>
                      {invoice?.invoice_number || "Invoice"}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <FinanceStatusChip status={invoice?.status} />
                      <Typography variant="body2" color="text.secondary">
                        {invoice?.currency || "USD"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {invoice?.payment_link_exists
                          ? "Payment link ready"
                          : invoice?.payment_link_ready
                            ? "Payment link can be created"
                            : "Payment link unavailable"}
                      </Typography>
                    </Stack>
                  </Stack>
                  <Stack spacing={0.5} alignItems={{ xs: "flex-start", md: "flex-end" }}>
                    <Typography variant="body2" color="text.secondary">
                      Total
                    </Typography>
                    <Typography variant="h5" fontWeight={700}>
                      {totalLabel}
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Invoice payment summary
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    See the current balance, payment link state, and the next billing actions without leaving the invoice.
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
                      gap: 1.25,
                    }}
                  >
                    {[
                      {
                        label: "Invoice total",
                        value: formatCurrency(invoice?.total, invoice?.currency),
                        helper: `Status: ${formatStatusLabel(invoice?.payment_status || invoice?.status || "pending")}`,
                      },
                      {
                        label: "Paid so far",
                        value: formatCurrency(paymentSummary?.total_recorded_paid_amount, invoice?.currency),
                        helper: `Online ${formatCurrency(paymentSummary?.online_paid_amount, invoice?.currency)} • Offline ${formatCurrency(paymentSummary?.offline_paid_amount, invoice?.currency)}`,
                      },
                      {
                        label: "Balance due",
                        value: formatCurrency(paymentSummary?.remaining_balance, invoice?.currency),
                        helper:
                          remainingBalance > 0
                            ? "Action needed"
                            : "Nothing left to collect",
                      },
                      {
                        label: "Payment link",
                        value: invoice?.payment_link_exists
                          ? "Ready"
                          : invoice?.payment_link_ready
                            ? "Can create"
                            : "Unavailable",
                        helper: formatPaymentOriginLabel(paymentSummary?.payment_origin),
                      },
                    ].map((row) => (
                      <Paper
                        key={row.label}
                        variant="outlined"
                        sx={{ p: 1.5, borderRadius: 2, backgroundColor: "background.default" }}
                      >
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.4 }}>
                          {row.label}
                        </Typography>
                        <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>
                          {row.value}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {row.helper}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
                    <Button
                      variant="contained"
                      startIcon={<PaymentOutlinedIcon />}
                      onClick={handleCopyPaymentLink}
                      disabled={loading || saving || !invoice?.payment_link_ready}
                    >
                      {invoice?.hosted_invoice_url ? "Copy payment link" : "Create payment link"}
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<LaunchIcon />}
                      onClick={handleOpenPaymentLink}
                      disabled={loading || saving || (!invoice?.hosted_invoice_url && !invoice?.payment_link_ready)}
                    >
                      Open payment page
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<LocalPrintshopOutlinedIcon />}
                      onClick={handleOpenPrintView}
                      disabled={!invoice?.id || printOpening}
                    >
                      Print / Save PDF
                    </Button>
                    {canRecordOfflinePayment ? (
                      <Button
                        variant="outlined"
                        startIcon={<PaymentOutlinedIcon />}
                        onClick={() => setOfflinePaymentDialogOpen(true)}
                      >
                        Record offline payment
                      </Button>
                    ) : null}
                    {canIssueRefund ? (
                      <Button
                        variant="outlined"
                        startIcon={<ReplayOutlinedIcon />}
                        onClick={() => setRefundDialogOpen(true)}
                      >
                        Issue refund
                      </Button>
                    ) : null}
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {paymentSummary?.online_payment_present
                      ? "A Stripe payment has already been captured for this invoice."
                      : invoice?.payment_link_ready
                        ? "A hosted payment page can be created for this invoice."
                        : "A payment link is unavailable until the invoice has a client and a positive total."}
                  </Typography>
                  {paymentSummary?.payment_method_summary ? (
                    <Typography variant="body2" color="text.secondary">
                      Offline payment methods: {paymentSummary.payment_method_summary}
                    </Typography>
                  ) : null}
                  <Typography variant="body2" color="text.secondary">
                    Refunded amount: {formatCurrency(refundSummary?.refunded_amount, invoice?.currency)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Remaining refundable: {formatCurrency(refundSummary?.remaining_refundable_amount, invoice?.currency)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Refund eligibility: {invoice?.refund_eligible ? "Eligible for Stripe refund" : "Stripe refund not available"}
                  </Typography>
                  {(paymentSummary?.offline_payments || []).length ? (
                    <Stack spacing={0.5} sx={{ pt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        Offline payment history
                      </Typography>
                      {(paymentSummary.offline_payments || []).map((row) => (
                        <Typography key={row.id} variant="body2" color="text.secondary">
                          {formatCurrency(row.amount, row.currency || invoice?.currency)} • {row.payment_method_label || formatStatusLabel(row.payment_method)} • {row.paid_at ? new Date(row.paid_at).toLocaleString() : "No date"}
                          {row.reference_note ? ` • ${row.reference_note}` : ""}
                        </Typography>
                      ))}
                    </Stack>
                  ) : null}
                  {refundHistory.length ? (
                    <Stack spacing={0.5} sx={{ pt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        Refund history
                      </Typography>
                      {refundHistory.map((row) => (
                        <Typography key={row.id} variant="body2" color="text.secondary">
                          {formatCurrency(row.amount, invoice?.currency)} • {formatStatusLabel(row.status || "pending")}
                          {row.reason ? ` • ${row.reason}` : ""}
                          {row.created_at ? ` • ${new Date(row.created_at).toLocaleString()}` : ""}
                        </Typography>
                      ))}
                    </Stack>
                  ) : null}
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1.25}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Client Summary
                  </Typography>
                  <Typography variant="body2">
                    {invoice?.client?.name || "No client"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {invoice?.client?.email || "No email"}
                    {invoice?.client?.phone ? ` • ${invoice.client.phone}` : ""}
                  </Typography>
                  {invoice?.related_estimate ? (
                    <Typography variant="body2" color="text.secondary">
                      Estimate: {invoice.related_estimate.estimate_number} • {invoice.related_estimate.title || "Estimate"} • {invoice.related_estimate.status || "unknown"}
                    </Typography>
                  ) : null}
                  {relatedWorkOrders.length ? (
                    <Stack spacing={0.5}>
                      <Typography variant="body2" color="text.secondary">
                        Related work orders
                      </Typography>
                      {relatedWorkOrders.map((row) => (
                        <Typography key={row.id} variant="body2" color="text.secondary">
                          {row.work_order_number} • {row.title || "Work order"} • {row.status || "unknown"}
                        </Typography>
                      ))}
                    </Stack>
                  ) : null}
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Billing details
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      This invoice keeps its own billing snapshot. You can copy a saved billing recipient into the invoice, then save it without changing older invoices.
                    </Typography>
                  </Box>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "flex-start" }}>
                    <FormControl fullWidth>
                      <InputLabel shrink>Saved billing recipient</InputLabel>
                      <Select
                        label="Saved billing recipient"
                        displayEmpty
                        notched
                        value={selectedBillingRecipientId}
                        onChange={(event) => setSelectedBillingRecipientId(event.target.value)}
                        renderValue={(value) => {
                          if (!value) {
                            if (billingRecipientsLoading) return "Loading saved billing recipients...";
                            if (billingRecipients.length === 0) return "No saved billing recipients yet";
                            return "Choose a saved billing recipient";
                          }
                          const recipient = billingRecipients.find(
                            (row) => String(row.id) === String(value)
                          );
                          return (
                            recipient?.company_name ||
                            recipient?.contact_name ||
                            recipient?.email ||
                            `Recipient #${value}`
                          );
                        }}
                      >
                        <MenuItem value="">
                          <em>
                            {billingRecipientsLoading
                              ? "Loading saved billing recipients..."
                              : billingRecipients.length === 0
                                ? "No saved billing recipients yet"
                                : "Choose a saved billing recipient"}
                          </em>
                        </MenuItem>
                        {billingRecipients.map((recipient) => (
                          <MenuItem key={recipient.id} value={String(recipient.id)}>
                            {recipient.company_name || recipient.contact_name || recipient.email || `Recipient #${recipient.id}`}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>
                        {billingRecipientsError ||
                          (billingRecipients.length
                            ? `${billingRecipients.length} saved recipient${
                                billingRecipients.length === 1 ? "" : "s"
                              } available`
                            : "Save the current billing details, then reuse them here later.")}
                      </FormHelperText>
                    </FormControl>
                    <Button
                      variant="outlined"
                      onClick={applySavedBillingRecipient}
                      disabled={!selectedBillingRecipientId}
                      sx={{ minWidth: { md: 180 } }}
                    >
                      Apply saved recipient
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleSaveBillingRecipient}
                      disabled={savingBillingRecipient}
                      sx={{ minWidth: { md: 180 } }}
                    >
                      {savingBillingRecipient ? "Saving..." : "Save for next time"}
                    </Button>
                  </Stack>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      fullWidth
                      label="Company / Recipient name"
                      value={coalesceText(form.billing_recipient.company_name)}
                      onChange={(event) => setBillingField("company_name", event.target.value)}
                    />
                    <TextField
                      fullWidth
                      label="Contact name"
                      value={coalesceText(form.billing_recipient.contact_name)}
                      onChange={(event) => setBillingField("contact_name", event.target.value)}
                    />
                  </Stack>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      fullWidth
                      label="Billing email"
                      value={coalesceText(form.billing_recipient.email)}
                      onChange={(event) => setBillingField("email", event.target.value)}
                    />
                    <TextField
                      fullWidth
                      label="Billing phone"
                      value={coalesceText(form.billing_recipient.phone)}
                      onChange={(event) => setBillingField("phone", event.target.value)}
                    />
                  </Stack>
                  <TextField
                    fullWidth
                    label="Address street"
                    value={coalesceText(form.billing_recipient.address_street)}
                    onChange={(event) => setBillingField("address_street", event.target.value)}
                  />
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      fullWidth
                      label="City"
                      value={coalesceText(form.billing_recipient.address_city)}
                      onChange={(event) => setBillingField("address_city", event.target.value)}
                    />
                    <TextField
                      fullWidth
                      label="State / Province"
                      value={coalesceText(form.billing_recipient.address_province || form.billing_recipient.address_state)}
                      onChange={(event) => {
                        setBillingField("address_province", event.target.value);
                        setBillingField("address_state", event.target.value);
                      }}
                    />
                  </Stack>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      fullWidth
                      label="Postal / ZIP"
                      value={coalesceText(form.billing_recipient.address_zip)}
                      onChange={(event) => setBillingField("address_zip", event.target.value)}
                    />
                    <TextField
                      fullWidth
                      label="Country"
                      value={coalesceText(form.billing_recipient.address_country)}
                      onChange={(event) => setBillingField("address_country", event.target.value)}
                    />
                  </Stack>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      fullWidth
                      label="Tax ID"
                      value={coalesceText(form.billing_recipient.tax_id)}
                      onChange={(event) => setBillingField("tax_id", event.target.value)}
                    />
                  </Stack>
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={2}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Invoice document
                  </Typography>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      label="Issue date"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={form.issue_date}
                      onChange={(event) => setField("issue_date", event.target.value)}
                    />
                    <TextField
                      label="Due date"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={form.due_date}
                      onChange={(event) => setField("due_date", event.target.value)}
                    />
                  </Stack>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      fullWidth
                      label="PO number"
                      value={form.po_number}
                      onChange={(event) => setField("po_number", event.target.value)}
                    />
                    <TextField
                      fullWidth
                      label="Payment terms"
                      value={form.payment_terms}
                      onChange={(event) => setField("payment_terms", event.target.value)}
                    />
                  </Stack>
                  <TextField
                    fullWidth
                    label="Customer message"
                    helperText="Use this for a short invoice summary or what the client is being billed for."
                    value={form.description}
                    onChange={(event) => setField("description", event.target.value)}
                  />
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    label="Customer notes"
                    helperText="Visible on the invoice. Good for thank-you notes, job context, or what happens next."
                    value={form.notes}
                    onChange={(event) => setField("notes", event.target.value)}
                  />
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    label="Payment terms"
                    helperText="Visible on the invoice. Example: due on receipt, net 7, or payment due before delivery."
                    value={form.terms}
                    onChange={(event) => setField("terms", event.target.value)}
                  />
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    label="Payment instructions"
                    helperText="Visible on the invoice and print view. Example: e-transfer email, bank transfer details, cheque payee, or cash instructions."
                    value={form.payment_instructions}
                    onChange={(event) => setField("payment_instructions", event.target.value)}
                  />
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    label="Internal notes"
                    helperText="Internal only. Not intended for the client-facing invoice."
                    value={coalesceText(form.billing_notes_internal)}
                    onChange={(event) => setField("billing_notes_internal", event.target.value)}
                  />
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1.5}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Line Items and Totals
                  </Typography>
                  {invoice?.tax_context?.prices_include_tax ? (
                    <Alert severity="info">
                      Tax-inclusive estimates may show entered line prices separately from taxable base. Totals remain the source of truth.
                    </Alert>
                  ) : null}
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Description</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Unit price</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell align="right">Taxable</TableCell>
                        <TableCell align="right">Tax rate</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(invoice?.line_items || []).map((line) => (
                        <TableRow key={line.id}>
                          <TableCell>{line.description}</TableCell>
                          <TableCell align="right">{line.quantity}</TableCell>
                          <TableCell align="right">{formatCurrency(line.unit_price, invoice?.currency)}</TableCell>
                          <TableCell align="right">{formatCurrency(line.amount, invoice?.currency)}</TableCell>
                          <TableCell align="right">{line.taxable ? "Yes" : "No"}</TableCell>
                          <TableCell align="right">{line.tax_rate != null ? `${line.tax_rate}%` : "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Divider />
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="flex-end">
                    <Typography variant="body2">Subtotal: {formatCurrency(invoice?.subtotal, invoice?.currency)}</Typography>
                    <Typography variant="body2">Tax: {formatCurrency(invoice?.tax_total, invoice?.currency)}</Typography>
                    <Typography variant="body2">Discount: {formatCurrency(invoice?.discount_total, invoice?.currency)}</Typography>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Total: {formatCurrency(invoice?.total, invoice?.currency)}
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>
            Close
          </Button>
          <Button
            variant="outlined"
            onClick={handleCreateSimilarInvoice}
            disabled={loading || saving || creatingSimilar || !invoice?.id}
          >
            {creatingSimilar ? "Creating..." : "Create similar invoice"}
          </Button>
          <Button
            variant="outlined"
            startIcon={<ContentCopyIcon />}
            onClick={async () => {
              if (!invoice?.hosted_invoice_url) return;
              await navigator.clipboard.writeText(invoice.hosted_invoice_url);
              enqueueSnackbar("Payment link copied.", { variant: "success" });
            }}
            disabled={!invoice?.hosted_invoice_url}
          >
            Copy Existing Link
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={loading || saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </DialogActions>
      </Dialog>

      <FinanceInvoiceRefundDialog
        open={refundDialogOpen}
        invoice={invoice}
        onClose={() => setRefundDialogOpen(false)}
        onRefunded={handleRefunded}
      />
      <FinanceInvoiceOfflinePaymentDialog
        open={offlinePaymentDialogOpen}
        invoice={invoice}
        onClose={() => setOfflinePaymentDialogOpen(false)}
        onSaved={handleOfflinePaymentSaved}
      />
    </>
  );
}
