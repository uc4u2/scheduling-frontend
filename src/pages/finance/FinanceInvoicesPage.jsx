import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  Drawer,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import LaunchIcon from "@mui/icons-material/Launch";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LocalPrintshopOutlinedIcon from "@mui/icons-material/LocalPrintshopOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import LibraryAddOutlinedIcon from "@mui/icons-material/LibraryAddOutlined";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseIcon from "@mui/icons-material/Close";
import AddTaskIcon from "@mui/icons-material/AddTask";
import FinanceStatusChip from "./components/FinanceStatusChip";
import FinanceEmptyState from "./components/FinanceEmptyState";
import FinancePagination from "./components/FinancePagination";
import FinanceAuditTimeline from "./components/FinanceAuditTimeline";
import FinanceInvoiceDetailDialog from "./FinanceInvoiceDetailDialog";
import { extractApiErrorMessage, isLikelyDownloadHandoffError } from "../../utils/apiError";
import {
  createFinanceInvoicePaymentLink,
  createSimilarFinanceInvoice,
  downloadFinanceInvoicePdf,
  getFinanceInvoicePrintHtml,
  listFinanceInvoices,
} from "./financeApi";
import { formatCurrency } from "../../utils/formatters";

const downloadBlob = (response, fallbackName) => {
  const blob =
    response?.data instanceof Blob
      ? response.data
      : new Blob([response?.data], {
          type: response?.headers?.["content-type"] || "application/pdf",
        });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fallbackName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
};

const isOverdue = (invoice) => {
  const dueDate = invoice?.due_date;
  if (!dueDate) return false;
  const remaining = Number(invoice?.remaining_balance || 0);
  if (!(remaining > 0)) return false;
  const due = new Date(`${dueDate}T23:59:59`);
  const now = new Date();
  return Number.isFinite(due.getTime()) && due < now;
};

function InvoiceWorkflowHelpDrawer({ open, onClose, tInvoice }) {
  const sections = tInvoice("help.sections", [], { returnObjects: true });

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: "100%", sm: 560 }, maxWidth: "100%" } }}
    >
      <Stack sx={{ height: "100%" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2.5, borderBottom: 1, borderColor: "divider" }}>
          <Box>
            <Typography variant="h6" fontWeight={800}>{tInvoice("help.title", "How invoices work")}</Typography>
            <Typography variant="body2" color="text.secondary">
              {tInvoice(
                "help.subtitle",
                "Start with an estimate for new work. Use Create similar invoice for repeat billing."
              )}
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label={tInvoice("help.closeAria", "Close invoice help")}>
            <CloseIcon />
          </IconButton>
        </Stack>
        <Stack spacing={2} sx={{ p: 2.5, overflowY: "auto" }}>
          {sections.map((section) => (
            <Paper key={section.title} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>
                {section.title}
              </Typography>
              <Stack spacing={0.75}>
                {section.bullets.map((bullet) => (
                  <Typography key={bullet} variant="body2" color="text.secondary">
                    - {bullet}
                  </Typography>
                ))}
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Stack>
    </Drawer>
  );
}

export default function FinanceInvoicesPage({ onNavigate }) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const tInvoice = useCallback(
    (key, fallback, options = {}) => t(`manager.finance.invoices.${key}`, { defaultValue: fallback, ...options }),
    [t]
  );
  const paymentLinkLabel = useCallback(
    (row) =>
      row?.payment_link_exists
        ? tInvoice("status.paymentLinkHas", "Has payment link")
        : tInvoice("status.paymentLinkMissing", "Missing payment link"),
    [tInvoice]
  );
  const paymentOriginLabel = useCallback(
    (row) => {
      const value = String(row?.payment_origin || row?.payment_status || row?.status || "").trim().toLowerCase();
      if (!value) return "-";
      return t(`manager.finance.shared.statuses.${value}`, {
        defaultValue: value
          .split("_")
          .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : ""))
          .join(" "),
      });
    },
    [t]
  );

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentLinkFilter, setPaymentLinkFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [helpOpen, setHelpOpen] = useState(false);
  const [expandedOpen, setExpandedOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [invoiceDialogId, setInvoiceDialogId] = useState(null);
  const [invoiceAuditOpen, setInvoiceAuditOpen] = useState(false);
  const [paymentLinkBusyId, setPaymentLinkBusyId] = useState(null);
  const [printBusyId, setPrintBusyId] = useState(null);
  const [pdfBusyId, setPdfBusyId] = useState(null);
  const [similarBusyId, setSimilarBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page,
        per_page: perPage,
        finance_only: true,
      };
      if (search.trim()) params.q = search.trim();
      if (statusFilter && statusFilter !== "all" && statusFilter !== "overdue") {
        params.status = statusFilter;
      }
      const payload = await listFinanceInvoices(params);
      const nextItems = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
      setItems(nextItems);
      setPagination(payload?.pagination || null);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || tInvoice("errors.loadFailed", "Unable to load invoices."));
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, statusFilter, tInvoice]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredItems = useMemo(() => {
    return (items || []).filter((row) => {
      if (statusFilter === "overdue" && !isOverdue(row)) return false;
      if (paymentLinkFilter === "has_link" && !row?.payment_link_exists) return false;
      if (paymentLinkFilter === "missing_link" && row?.payment_link_exists) return false;
      if (search.trim()) {
        const haystack = [
          row?.invoice_number,
          row?.client_name,
          row?.client_email,
          row?.billing_display_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(search.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [items, paymentLinkFilter, search, statusFilter]);

  const openInvoice = (invoiceId) => {
    setInvoiceDialogId(invoiceId);
    setInvoiceDialogOpen(true);
  };

  const handleCopyPaymentLink = async (invoiceId) => {
    setPaymentLinkBusyId(invoiceId);
    setError("");
    try {
      const payload = await createFinanceInvoicePaymentLink(invoiceId);
      const checkoutUrl = payload?.checkout_url || payload?.invoice?.hosted_invoice_url || "";
      if (!checkoutUrl) {
        throw new Error(tInvoice("errors.paymentLinkUnavailable", "Payment link is not available yet."));
      }
      await navigator.clipboard.writeText(checkoutUrl);
      enqueueSnackbar(tInvoice("snackbar.paymentLinkCopied", "Payment link copied."), { variant: "success" });
      await load();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || tInvoice("errors.paymentLink", "Unable to create or copy the payment link."));
    } finally {
      setPaymentLinkBusyId(null);
    }
  };

  const handleOpenPaymentLink = async (row) => {
    const invoiceId = row?.id || row?.invoice_id;
    if (!invoiceId) return;
    setPaymentLinkBusyId(invoiceId);
    setError("");
    try {
      let checkoutUrl = row?.payment_link_exists && row?.hosted_invoice_url ? row.hosted_invoice_url : "";
      if (!checkoutUrl) {
        const payload = await createFinanceInvoicePaymentLink(invoiceId);
        checkoutUrl = payload?.checkout_url || payload?.invoice?.hosted_invoice_url || "";
        if (!checkoutUrl) {
          throw new Error(tInvoice("errors.paymentLinkUnavailable", "Payment link is not available yet."));
        }
        await load();
      }
      window.open(checkoutUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || tInvoice("errors.openPaymentLink", "Unable to open the payment page."));
    } finally {
      setPaymentLinkBusyId(null);
    }
  };

  const handlePrintInvoice = async (invoiceId) => {
    setPrintBusyId(invoiceId);
    setError("");
    try {
      const html = await getFinanceInvoicePrintHtml(invoiceId);
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const blobUrl = URL.createObjectURL(blob);
      const printWindow = window.open(blobUrl, "_blank", "noopener,noreferrer");
      if (!printWindow) {
        URL.revokeObjectURL(blobUrl);
        enqueueSnackbar(tInvoice("snackbar.printBlocked", "Print window was blocked. Please allow popups and try again."), { variant: "warning" });
        return;
      }
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || tInvoice("errors.print", "Unable to open the invoice print view."));
    } finally {
      setPrintBusyId(null);
    }
  };

  const handleDownloadInvoicePdf = async (row) => {
    const invoiceId = row?.invoice_id || row?.id;
    setPdfBusyId(invoiceId);
    setError("");
    try {
      const res = await downloadFinanceInvoicePdf(invoiceId);
      downloadBlob(res, `finance-invoice-${row?.invoice_number || invoiceId}.pdf`);
      enqueueSnackbar(tInvoice("snackbar.pdfDownloaded", "Invoice PDF downloaded."), { variant: "success" });
    } catch (err) {
      if (isLikelyDownloadHandoffError(err)) {
        enqueueSnackbar(
          tInvoice("snackbar.downloadStarted", "Download started in your browser or download manager."),
          { variant: "info" }
        );
        return;
      }
      setError(await extractApiErrorMessage(err, tInvoice("errors.pdf", "Unable to download the invoice PDF.")));
    } finally {
      setPdfBusyId(null);
    }
  };

  const handleCreateSimilarInvoice = async (invoiceId) => {
    setSimilarBusyId(invoiceId);
    setError("");
    try {
      const payload = await createSimilarFinanceInvoice(invoiceId);
      const nextInvoice = payload?.invoice || null;
      if (!nextInvoice?.id) throw new Error(tInvoice("errors.similarMissingInvoice", "New invoice was not returned."));
      enqueueSnackbar(
        tInvoice("snackbar.similarCreated", "Similar invoice created: {{invoice}}.", {
          invoice: nextInvoice.invoice_number || `#${nextInvoice.id}`,
        }),
        { variant: "success" }
      );
      await load();
      openInvoice(nextInvoice.id);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || tInvoice("errors.similar", "Unable to create a similar invoice."));
    } finally {
      setSimilarBusyId(null);
    }
  };

  const invoiceCountLabel = pagination?.total || filteredItems.length;

  const helperCard = (
    <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 3 }}>
      <Stack spacing={1.5} direction={{ xs: "column", lg: "row" }} justifyContent="space-between" alignItems={{ lg: "center" }}>
        <Box sx={{ maxWidth: 760 }}>
          <Typography variant="h5" fontWeight={800}>
            {tInvoice("title", "Invoices")}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            {tInvoice("subtitle", "Manage sent, unpaid, paid, and repeat invoices from one place.")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25 }}>
            {tInvoice(
              "helper",
              "Need to create a new invoice? Start with an estimate, then convert it to an invoice when the client is ready. For repeat billing, open a past invoice and use Create similar invoice."
            )}
          </Typography>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button
            variant="outlined"
            startIcon={<OpenInFullIcon />}
            onClick={() => setExpandedOpen(true)}
            disabled={loading || filteredItems.length === 0}
          >
            {tInvoice("actions.expandView", "Expand View")}
          </Button>
          <Button variant="contained" startIcon={<AddTaskIcon />} onClick={() => onNavigate?.("finance-estimates")}>
            {tInvoice("actions.startWithEstimate", "Start with estimate")}
          </Button>
          <Button variant="outlined" startIcon={<HelpOutlineIcon />} onClick={() => setHelpOpen(true)}>
            {tInvoice("actions.howItWorks", "How invoices work")}
          </Button>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load} disabled={loading}>
            {tInvoice("actions.refresh", "Refresh")}
          </Button>
        </Stack>
      </Stack>
      <Chip
        label={tInvoice(
          Number(invoiceCountLabel) === 1 ? "toolbar.count_one" : "toolbar.count_other",
          Number(invoiceCountLabel) === 1 ? "{{count}} invoice" : "{{count}} invoices",
          { count: invoiceCountLabel }
        )}
        variant="outlined"
        sx={{ alignSelf: { xs: "flex-start", lg: "center" }, mt: 1.5, fontWeight: 700 }}
      />
    </Paper>
  );

  const renderInvoiceCards = (rows) => (
    <Grid container spacing={1.5}>
      {rows.map((row) => (
        <Grid item xs={12} key={row.id || row.invoice_id}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Stack spacing={1.5}>
              <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ lg: "flex-start" }}>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography variant="h6" fontWeight={800}>
                      {row.invoice_number || `#${row.id}`}
                    </Typography>
                    <FinanceStatusChip status={row.payment_status || row.status} />
                    {isOverdue(row) ? <Chip size="small" color="error" label={tInvoice("status.overdue", "Overdue")} /> : null}
                    <Chip size="small" variant="outlined" label={paymentLinkLabel(row)} />
                  </Stack>
                  <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5 }}>
                    {row.billing_display_name || row.client_name || tInvoice("labels.clientFallback", "Client")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {row.client_name && row.billing_display_name && row.client_name !== row.billing_display_name
                      ? `${tInvoice("labels.client", "Client")}: ${row.client_name}${row.client_email ? ` • ${row.client_email}` : ""}`
                      : row.client_email || tInvoice("labels.noEmail", "No email")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                    {row.related_estimate_number
                      ? `${tInvoice("labels.source", "Source")}: ${row.related_estimate_number}`
                      : `${tInvoice("labels.source", "Source")}: ${tInvoice("labels.businessFinance", "Business Finance")}`}
                  </Typography>
                </Box>
                <Stack spacing={0.5} alignItems={{ xs: "flex-start", lg: "flex-end" }}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.4 }}>
                    {tInvoice("labels.total", "Total")}
                  </Typography>
                  <Typography variant="h5" fontWeight={800}>
                    {formatCurrency(row.amount, row.currency)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tInvoice("labels.paid", "Paid")}: {formatCurrency(row.total_recorded_paid_amount, row.currency)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tInvoice("labels.balanceDue", "Balance due")}: {formatCurrency(row.remaining_balance, row.currency)}
                  </Typography>
                </Stack>
              </Stack>

              <Grid container spacing={1.25}>
                <Grid item xs={12} md={3}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.4 }}>
                    {tInvoice("labels.issueDate", "Issue date")}
                  </Typography>
                  <Typography variant="body2">{row.issue_date || "-"}</Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.4 }}>
                    {tInvoice("labels.dueDate", "Due date")}
                  </Typography>
                  <Typography variant="body2">{row.due_date || "-"}</Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.4 }}>
                    {tInvoice("labels.paymentLink", "Payment link")}
                  </Typography>
                  <Typography variant="body2">{paymentLinkLabel(row)}</Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.4 }}>
                    {tInvoice("labels.paymentOrigin", "Payment status")}
                  </Typography>
                  <Typography variant="body2">{paymentOriginLabel(row)}</Typography>
                </Grid>
              </Grid>

              <Stack direction={{ xs: "column", md: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
                <Button variant="contained" startIcon={<OpenInFullIcon />} onClick={() => openInvoice(row.invoice_id || row.id)}>
                  {tInvoice("actions.openInvoice", "Open invoice")}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ContentCopyIcon />}
                  onClick={() => handleCopyPaymentLink(row.invoice_id || row.id)}
                  disabled={paymentLinkBusyId === (row.invoice_id || row.id)}
                >
                  {paymentLinkBusyId === (row.invoice_id || row.id)
                    ? tInvoice("actions.creatingLink", "Working...")
                    : row.payment_link_exists
                      ? tInvoice("actions.copyPaymentLink", "Copy payment link")
                      : tInvoice("actions.createPaymentLink", "Create / copy payment link")}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<LaunchIcon />}
                  onClick={() => handleOpenPaymentLink(row)}
                >
                  {tInvoice("actions.openPaymentPage", "Open payment page")}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<LocalPrintshopOutlinedIcon />}
                  onClick={() => handlePrintInvoice(row.invoice_id || row.id)}
                  disabled={printBusyId === (row.invoice_id || row.id)}
                >
                  {printBusyId === (row.invoice_id || row.id)
                    ? tInvoice("actions.printing", "Opening...")
                    : tInvoice("actions.print", "Print / Save PDF")}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PictureAsPdfOutlinedIcon />}
                  onClick={() => handleDownloadInvoicePdf(row)}
                  disabled={pdfBusyId === (row.invoice_id || row.id)}
                >
                  {pdfBusyId === (row.invoice_id || row.id)
                    ? tInvoice("actions.downloadingPdf", "Downloading PDF...")
                    : tInvoice("actions.downloadPdf", "Download PDF")}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<LibraryAddOutlinedIcon />}
                  onClick={() => handleCreateSimilarInvoice(row.invoice_id || row.id)}
                  disabled={similarBusyId === (row.invoice_id || row.id)}
                >
                  {similarBusyId === (row.invoice_id || row.id)
                    ? tInvoice("actions.creatingSimilar", "Creating...")
                    : tInvoice("actions.createSimilar", "Create similar invoice")}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Stack spacing={2.5}>
      {helperCard}

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <Stack spacing={1.5}>
          <Typography variant="subtitle1" fontWeight={700}>
            {tInvoice("filters.title", "Find and manage invoices")}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="flex-end">
            <Button variant="outlined" onClick={() => setInvoiceAuditOpen(true)}>
              {tInvoice("filters.activityLog", "Activity log")}
            </Button>
          </Stack>
          <Grid container spacing={1.5}>
            <Grid item xs={12} md={6} lg={5}>
              <TextField
                fullWidth
                label={tInvoice("filters.search", "Search invoices")}
                placeholder={tInvoice("filters.searchPlaceholder", "Invoice number, client name, email, or billing recipient")}
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3.5}>
              <FormControl fullWidth>
                <InputLabel>{tInvoice("filters.status", "Status")}</InputLabel>
                <Select
                  label={tInvoice("filters.status", "Status")}
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value);
                    setPage(1);
                  }}
                >
                  <MenuItem value="all">{tInvoice("filters.statusAll", "All")}</MenuItem>
                  <MenuItem value="pending">{tInvoice("filters.statusPending", "Pending / unpaid")}</MenuItem>
                  <MenuItem value="paid">{tInvoice("filters.statusPaid", "Paid")}</MenuItem>
                  <MenuItem value="partial_payment">{tInvoice("filters.statusPartial", "Partially paid")}</MenuItem>
                  <MenuItem value="overdue">{tInvoice("filters.statusOverdue", "Overdue")}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} lg={3.5}>
              <FormControl fullWidth>
                <InputLabel>{tInvoice("filters.paymentLink", "Payment link")}</InputLabel>
                <Select
                  label={tInvoice("filters.paymentLink", "Payment link")}
                  value={paymentLinkFilter}
                  onChange={(event) => setPaymentLinkFilter(event.target.value)}
                >
                  <MenuItem value="all">{tInvoice("filters.paymentLinkAll", "All")}</MenuItem>
                  <MenuItem value="has_link">{tInvoice("filters.paymentLinkHas", "Has payment link")}</MenuItem>
                  <MenuItem value="missing_link">{tInvoice("filters.paymentLinkMissing", "Missing payment link")}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Stack>
      </Paper>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {loading ? (
        <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
          <CircularProgress />
        </Stack>
      ) : filteredItems.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Stack spacing={1.5} alignItems="center">
            <FinanceEmptyState
              title={tInvoice("empty.title", "No invoices yet")}
              description={tInvoice(
                "empty.description",
                "Invoices are created when you convert an approved estimate or create a similar invoice from a past invoice. Create an estimate first, then convert it to an invoice. Once you have invoices, they will appear here for payment tracking, printing, and repeat billing."
              )}
              actionLabel={tInvoice("empty.action", "Create estimate")}
              onAction={() => onNavigate?.("finance-estimates")}
            />
            <Button variant="outlined" startIcon={<HelpOutlineIcon />} onClick={() => setHelpOpen(true)}>
              {tInvoice("empty.learn", "Learn how invoices work")}
            </Button>
          </Stack>
        </Paper>
      ) : (
        renderInvoiceCards(filteredItems)
      )}

      <FinancePagination
        pagination={pagination}
        page={page}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={(next) => {
          setPerPage(next);
          setPage(1);
        }}
      />

      <FinanceInvoiceDetailDialog
        open={invoiceDialogOpen}
        invoiceId={invoiceDialogId}
        onClose={() => setInvoiceDialogOpen(false)}
        onSaved={() => load()}
        onOpenInvoice={(nextInvoiceId) => {
          setInvoiceDialogId(nextInvoiceId);
          setInvoiceDialogOpen(true);
          load();
        }}
      />
      <FinanceAuditTimeline
        open={invoiceAuditOpen}
        onClose={() => setInvoiceAuditOpen(false)}
        entityType="invoice"
        title={tInvoice("audit.pageTitle", "Invoice activity")}
        emptyText={tInvoice("audit.pageEmpty", "No invoice audit records yet.")}
      />

      <InvoiceWorkflowHelpDrawer open={helpOpen} onClose={() => setHelpOpen(false)} tInvoice={tInvoice} />

      <Dialog open={expandedOpen} onClose={() => setExpandedOpen(false)} fullWidth maxWidth="xl">
        <DialogTitle>{tInvoice("title", "Invoices")}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {renderInvoiceCards(filteredItems)}
            <FinancePagination
              pagination={pagination}
              page={page}
              perPage={perPage}
              onPageChange={setPage}
              onPerPageChange={(next) => {
                setPerPage(next);
                setPage(1);
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExpandedOpen(false)}>{tInvoice("actions.close", "Close")}</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
