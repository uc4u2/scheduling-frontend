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
  Menu,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import LaunchIcon from "@mui/icons-material/Launch";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LocalPrintshopOutlinedIcon from "@mui/icons-material/LocalPrintshopOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import LibraryAddOutlinedIcon from "@mui/icons-material/LibraryAddOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseIcon from "@mui/icons-material/Close";
import AddTaskIcon from "@mui/icons-material/AddTask";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
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
  sendFinanceInvoiceEmail,
} from "./financeApi";
import { formatCurrency } from "../../utils/formatters";
import TutorialHelpCard from "../../components/tutorials/TutorialHelpCard";
import { BUSINESS_FINANCE_TUTORIAL_GROUP } from "./financeTutorials";
import ThemedDateField from "../../components/ui/ThemedDateField";

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

const getPreferredInvoiceRowEmail = (row) =>
  String(row?.billing_recipient?.email || row?.client_email || row?.client?.email || "").trim();

const getRowSendPaymentLinkDisabledReason = (row, tInvoice) => {
  const status = String(row?.payment_status || row?.status || "").trim().toLowerCase();
  const remainingBalance = Number(row?.remaining_balance || 0);
  const recipientEmail = getPreferredInvoiceRowEmail(row);
  if (!recipientEmail) {
    return tInvoice("tooltips.sendPaymentLinkMissingEmail", "Add a client or billing email before sending the payment link.");
  }
  if (status === "void") {
    return tInvoice("tooltips.sendPaymentLinkVoid", "This invoice is void. Payment link sending is unavailable.");
  }
  if (status === "refunded" || status === "partial_refund" || status === "partially_refunded") {
    return tInvoice("tooltips.sendPaymentLinkRefunded", "This invoice has been refunded. Do not send a payment link.");
  }
  if (!(remainingBalance > 0)) {
    return tInvoice("tooltips.sendPaymentLinkPaid", "This invoice is already paid. A payment link is no longer needed.");
  }
  return "";
};

function InvoiceActionMenu({ actions, tInvoice }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const enabledActions = actions.filter((action) => action.type === "divider" || !action.disabled);
  const cleanedActions = enabledActions.filter((action, index) => {
    if (action.type !== "divider") return true;
    const prev = enabledActions[index - 1];
    const next = enabledActions[index + 1];
    return prev && prev.type !== "divider" && next && next.type !== "divider";
  });

  return (
    <>
      <Tooltip title={tInvoice("actions.moreActions", "More actions")}>
        <IconButton size="small" onClick={(event) => setAnchorEl(event.currentTarget)}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{ sx: { minWidth: 260, borderRadius: 2 } }}
      >
        {cleanedActions.map((action, index) =>
          action.type === "divider" ? (
            <Box key={`divider-${index}`} sx={{ my: 0.5, borderTop: 1, borderColor: "divider" }} />
          ) : (
            <MenuItem
              key={action.key || action.label}
              onClick={() => {
                setAnchorEl(null);
                action.onClick?.();
              }}
              sx={{ py: 1 }}
            >
              <Stack spacing={0.25}>
                <Typography variant="body2" fontWeight={700}>
                  {action.label}
                </Typography>
                {action.help ? (
                  <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "normal", lineHeight: 1.35 }}>
                    {action.help}
                  </Typography>
                ) : null}
              </Stack>
            </MenuItem>
          )
        )}
      </Menu>
    </>
  );
}

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

function InvoiceTutorialDrawer({ open, onClose, tInvoice, featuredTutorial }) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: "100%", sm: 520 }, maxWidth: "100%" } }}
    >
      <Stack sx={{ height: "100%" }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ p: 2.5, borderBottom: 1, borderColor: "divider" }}
        >
          <Stack spacing={0.5}>
            <Typography variant="h6" fontWeight={800}>
              {tInvoice("actions.quickTutorial", "Quick tutorial")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {featuredTutorial?.title}
            </Typography>
          </Stack>
          <IconButton onClick={onClose} aria-label={tInvoice("tutorial.close", "Close quick tutorial")}>
            <CloseIcon />
          </IconButton>
        </Stack>
        <Box sx={{ p: 2.5 }}>
          <TutorialHelpCard
            tutorialGroup={BUSINESS_FINANCE_TUTORIAL_GROUP}
            title={tInvoice("actions.quickTutorial", "Quick tutorial")}
            body={featuredTutorial?.purpose}
            watchLabel={tInvoice("tutorial.watch", "Watch tutorial")}
            moreLabel={tInvoice("tutorial.more", "More walkthroughs")}
            youtubeLabel={tInvoice("tutorial.watchYoutube", "Watch on YouTube")}
            closeLabel={tInvoice("common.close", "Close")}
          />
        </Box>
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
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
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
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailTarget, setEmailTarget] = useState(null);
  const [emailTo, setEmailTo] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [tutorialDrawerOpen, setTutorialDrawerOpen] = useState(false);
  const featuredTutorial = BUSINESS_FINANCE_TUTORIAL_GROUP.featured;

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
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
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
  }, [dateFrom, dateTo, page, perPage, search, statusFilter, tInvoice]);

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

  const openSendEmailDialog = (row) => {
    setEmailTarget(row);
    setEmailTo(getPreferredInvoiceRowEmail(row));
    setEmailMessage("");
    setEmailDialogOpen(true);
  };

  const handleSendEmail = async () => {
    const invoiceId = emailTarget?.invoice_id || emailTarget?.id;
    if (!invoiceId) return;
    if (!String(emailTo || "").trim()) {
      enqueueSnackbar(tInvoice("errors.emailRequired", "Enter an email address first."), {
        variant: "warning",
      });
      return;
    }
    try {
      setEmailSending(true);
      await sendFinanceInvoiceEmail(invoiceId, {
        email: String(emailTo || "").trim(),
        message: String(emailMessage || "").trim() || undefined,
      });
      enqueueSnackbar(tInvoice("snackbar.paymentLinkEmailSent", "Payment link email sent."), {
        variant: "success",
      });
      setEmailDialogOpen(false);
      setEmailTarget(null);
      await load();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          tInvoice("errors.sendPaymentLinkEmail", "Unable to send the payment link email.")
      );
    } finally {
      setEmailSending(false);
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
          <Tooltip
            title={tInvoice(
              "helper",
              "Manage sent, unpaid, paid, and repeat invoices from one place. Start with an estimate, then convert it to an invoice when the client is ready. For repeat billing, open a past invoice and use Create similar invoice."
            )}
          >
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ width: "fit-content", cursor: "help" }}>
              <Typography variant="h5" fontWeight={800}>
                {tInvoice("title", "Invoices")}
              </Typography>
              <InfoOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
            </Stack>
          </Tooltip>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button variant="outlined" onClick={() => setInvoiceAuditOpen(true)}>
            {tInvoice("filters.activityLog", "Activity log")}
          </Button>
          <Button variant="outlined" startIcon={<SchoolOutlinedIcon />} onClick={() => setTutorialDrawerOpen(true)}>
            {tInvoice("actions.quickTutorial", "Quick tutorial")}
          </Button>
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
    <Stack spacing={1.25}>
      {rows.map((row) => {
        const rowId = row.invoice_id || row.id;
        const sendPaymentLinkDisabledReason = getRowSendPaymentLinkDisabledReason(row, tInvoice);
        const paymentButtonBusy = paymentLinkBusyId === rowId;
        const printBusy = printBusyId === rowId;
        const downloadBusy = pdfBusyId === rowId;
        const similarBusy = similarBusyId === rowId;
        const menuActions = [
          {
            key: "copy-payment-link",
            label: row.payment_link_exists
              ? tInvoice("actions.copyPaymentLink", "Copy payment link")
              : tInvoice("actions.createPaymentLink", "Create / copy payment link"),
            help: tInvoice("actionHelp.copyPaymentLink", "Create or reuse the hosted Stripe invoice link and copy it to the clipboard."),
            onClick: () => handleCopyPaymentLink(rowId),
            disabled: paymentButtonBusy,
          },
          {
            key: "send-payment-link",
            label: tInvoice("actions.sendPaymentLink", "Send payment link"),
            help: sendPaymentLinkDisabledReason || tInvoice("actionHelp.sendPaymentLink", "Email the hosted Stripe invoice link to the client."),
            onClick: () => openSendEmailDialog(row),
            disabled: Boolean(sendPaymentLinkDisabledReason),
          },
          { type: "divider" },
          {
            key: "print",
            label: tInvoice("actions.print", "Print / Save PDF"),
            help: tInvoice("actionHelp.print", "Open the browser print view for this invoice."),
            onClick: () => handlePrintInvoice(rowId),
            disabled: printBusy,
          },
          {
            key: "download",
            label: tInvoice("actions.downloadPdf", "Download PDF"),
            help: tInvoice("actionHelp.downloadPdf", "Download a PDF file for this invoice."),
            onClick: () => handleDownloadInvoicePdf(row),
            disabled: downloadBusy,
          },
          {
            key: "similar",
            label: tInvoice("actions.createSimilar", "Create similar invoice"),
            help: tInvoice("actionHelp.createSimilar", "Create a new invoice using this one as the starting point."),
            onClick: () => handleCreateSimilarInvoice(rowId),
            disabled: similarBusy,
          },
        ];

        return (
          <Paper key={rowId} variant="outlined" sx={{ p: 1.75, borderRadius: 3 }}>
            <Stack spacing={1.15}>
              <Stack direction={{ xs: "column", lg: "row" }} spacing={1.25} justifyContent="space-between">
                <Stack spacing={0.7} sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ md: "flex-start" }}>
                    <Stack spacing={0.45} sx={{ minWidth: 0, flex: 1 }}>
                      <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                        <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.2, fontWeight: 800 }}>
                          {row.invoice_number || `#${row.id}`}
                        </Typography>
                        <FinanceStatusChip status={row.payment_status || row.status} />
                        {isOverdue(row) ? <Chip size="small" color="error" label={tInvoice("status.overdue", "Overdue")} /> : null}
                        <Chip size="small" variant="outlined" label={paymentLinkLabel(row)} />
                      </Stack>
                      <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.3 }}>
                        {row.billing_display_name || row.client_name || tInvoice("labels.clientFallback", "Client")}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {row.client_name && row.billing_display_name && row.client_name !== row.billing_display_name
                          ? `${row.client_name}${row.client_email ? ` • ${row.client_email}` : ""}`
                          : row.client_email || tInvoice("labels.noEmail", "No email")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.related_estimate_number
                          ? `${tInvoice("labels.source", "Source")}: ${row.related_estimate_number}`
                          : `${tInvoice("labels.source", "Source")}: ${tInvoice("labels.businessFinance", "Business Finance")}`}
                        {` • ${tInvoice("labels.issueDate", "Issue date")}: ${row.issue_date || "-"}`}
                        {` • ${tInvoice("labels.dueDate", "Due date")}: ${row.due_date || "-"}`}
                      </Typography>
                    </Stack>

                    <Stack spacing={0.55} alignItems={{ xs: "flex-start", md: "flex-end" }} sx={{ minWidth: { md: 180 } }}>
                      <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1 }}>
                        {formatCurrency(row.amount, row.currency)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {tInvoice("labels.paid", "Paid")}: {formatCurrency(row.total_recorded_paid_amount, row.currency)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {tInvoice("labels.balanceDue", "Balance due")}: {formatCurrency(row.remaining_balance, row.currency)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {paymentOriginLabel(row)}
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: "flex-start", lg: "flex-end" }} flexWrap="wrap" useFlexGap sx={{ minWidth: { lg: 260 } }}>
                  <Button variant="contained" size="small" startIcon={<OpenInFullIcon />} onClick={() => openInvoice(rowId)}>
                    {tInvoice("actions.openInvoice", "Open invoice")}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<LaunchIcon />}
                    onClick={() => handleOpenPaymentLink(row)}
                  >
                    {tInvoice("actions.openPaymentPage", "Open payment page")}
                  </Button>
                  <InvoiceActionMenu actions={menuActions} tInvoice={tInvoice} />
                </Stack>
              </Stack>
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );

  return (
    <Stack spacing={2.5}>
      {helperCard}

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <Stack spacing={1.5}>
          <Typography variant="subtitle1" fontWeight={700}>
            {tInvoice("filters.title", "Find and manage invoices")}
          </Typography>
          <Grid container spacing={1.5}>
            <Grid item xs={12} lg={4}>
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
            <Grid item xs={12} sm={6} lg={2.5}>
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
            <Grid item xs={12} sm={6} lg={2.5}>
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
            <Grid item xs={12} sm={6} lg={1.5}>
              <ThemedDateField
                fullWidth
                label={tInvoice("filters.dateFrom", "From")}
                value={dateFrom}
                onChange={(event) => {
                  setDateFrom(event.target.value);
                  setPage(1);
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={1.5}>
              <ThemedDateField
                fullWidth
                label={tInvoice("filters.dateTo", "To")}
                value={dateTo}
                onChange={(event) => {
                  setDateTo(event.target.value);
                  setPage(1);
                }}
              />
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
      <Dialog open={emailDialogOpen} onClose={emailSending ? undefined : () => setEmailDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{tInvoice("emailDialog.title", "Send Payment Link")}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              label={tInvoice("emailDialog.recipientEmail", "Recipient email")}
              value={emailTo}
              onChange={(event) => setEmailTo(event.target.value)}
            />
            <TextField
              label={tInvoice("emailDialog.messageOptional", "Message (optional)")}
              multiline
              minRows={4}
              value={emailMessage}
              onChange={(event) => setEmailMessage(event.target.value)}
              helperText={tInvoice("emailDialog.helperText", "The payment link and invoice total will be added automatically.")}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailDialogOpen(false)} disabled={emailSending}>
            {tInvoice("common.cancel", "Cancel")}
          </Button>
          <Button variant="contained" onClick={handleSendEmail} disabled={emailSending}>
            {emailSending ? tInvoice("common.sending", "Sending...") : tInvoice("common.send", "Send")}
          </Button>
        </DialogActions>
      </Dialog>
      <FinanceAuditTimeline
        open={invoiceAuditOpen}
        onClose={() => setInvoiceAuditOpen(false)}
        entityType="invoice"
        title={tInvoice("audit.pageTitle", "Invoice activity")}
        emptyText={tInvoice("audit.pageEmpty", "No invoice audit records yet.")}
      />

      <InvoiceWorkflowHelpDrawer open={helpOpen} onClose={() => setHelpOpen(false)} tInvoice={tInvoice} />
      <InvoiceTutorialDrawer
        open={tutorialDrawerOpen}
        onClose={() => setTutorialDrawerOpen(false)}
        tInvoice={tInvoice}
        featuredTutorial={featuredTutorial}
      />

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
