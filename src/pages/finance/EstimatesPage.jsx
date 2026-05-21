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
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  Menu,
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
  Tooltip,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LaunchIcon from "@mui/icons-material/Launch";
import LinkIcon from "@mui/icons-material/Link";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LocalPrintshopOutlinedIcon from "@mui/icons-material/LocalPrintshopOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import PaymentOutlinedIcon from "@mui/icons-material/PaymentOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import RequestQuoteOutlinedIcon from "@mui/icons-material/RequestQuoteOutlined";
import AddTaskOutlinedIcon from "@mui/icons-material/AddTaskOutlined";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseIcon from "@mui/icons-material/Close";
import { formatDateTimeInTz } from "../../utils/datetime";
import { getUserTimezone } from "../../utils/timezone";
import { formatCurrency } from "../../utils/formatters";
import EstimateEditorDialog from "./EstimateEditorDialog";
import FinanceInvoiceDetailDialog from "./FinanceInvoiceDetailDialog";
import WorkOrderEditorDialog from "./WorkOrderEditorDialog";
import {
  convertEstimateToInvoice,
  createEstimateTemplate,
  createEstimateShareLink,
  createFinanceInvoicePaymentLink,
  deleteEstimateTemplate,
  duplicateEstimate,
  downloadFinanceEstimatePdf,
  getEstimate,
  getEstimateTemplate,
  getFinanceInvoicePrintHtml,
  listEstimateTemplates,
  listEstimates,
  listManagerClients,
  reopenEstimateResponse,
  sendEstimate,
  sendEstimateEmail,
  updateEstimateTemplate,
  updateEstimate,
} from "./financeApi";
import FinanceStatusChip from "./components/FinanceStatusChip";
import FinanceEmptyState from "./components/FinanceEmptyState";
import FinancePagination from "./components/FinancePagination";
import FinanceAuditTimeline from "./components/FinanceAuditTimeline";
import { extractApiErrorMessage, isLikelyDownloadHandoffError } from "../../utils/apiError";

const downloadBlob = (response, fallbackName) => {
  const blob =
    response?.data instanceof Blob
      ? response.data
      : new Blob([response?.data], {
          type: response?.headers?.["content-type"] || "application/octet-stream",
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

const statusFlagChipSx = {
  height: 24,
  borderRadius: 1.5,
  "& .MuiChip-label": {
    px: 1,
    fontWeight: 600,
  },
};

const captionClampSx = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  lineHeight: 1.4,
};

const formatPaymentState = (item, tEstimate) => {
  const paymentStatus = String(item?.converted_invoice_payment_status || item?.converted_invoice_status || "").toLowerCase();
  if (paymentStatus === "paid") return tEstimate("paymentState.paid", "Payment paid");
  if (paymentStatus === "partial_refund" || paymentStatus === "partially_refunded") return tEstimate("paymentState.partialRefund", "Partially refunded");
  if (paymentStatus === "refunded") return tEstimate("paymentState.refunded", "Refunded");
  if (item?.converted_invoice_hosted_invoice_url) return tEstimate("paymentState.linkReady", "Payment link ready");
  if (item?.converted_invoice_number) return tEstimate("paymentState.noLinkYet", "No payment link yet");
  return tEstimate("paymentState.convertFirst", "Convert first");
};

const buildSupplementalFlags = (item, tEstimate) => {
  const flags = [];
  if (item?.converted_invoice_hosted_invoice_url) {
    flags.push({ label: tEstimate("flags.paymentLinkReady", "Payment link ready"), color: "secondary", variant: "outlined" });
  }
  if (item?.public_url) {
    flags.push({ label: tEstimate("flags.shareLinkReady", "Share link ready"), variant: "outlined" });
  }
  if (item?.client_accepted_at) {
    flags.push({ label: tEstimate("flags.acceptedByClient", "Accepted by client"), color: "success", variant: "outlined" });
  } else if (item?.client_rejected_at) {
    flags.push({ label: tEstimate("flags.rejectedByClient", "Rejected by client"), color: "warning", variant: "outlined" });
  } else if (item?.public_viewed_at) {
    flags.push({ label: tEstimate("flags.viewedByClient", "Viewed by client"), color: "info", variant: "outlined" });
  }
  return flags;
};

function EstimateActionMenu({ actions, tEstimate }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const enabledActions = actions.filter((action) => action.type === "divider" || !action.disabled);
  const cleanedActions = enabledActions.filter((action, index) => {
    if (action.type !== "divider") return true;
    const prev = enabledActions[index - 1];
    const next = enabledActions[index + 1];
    return prev && prev.type !== "divider" && next && next.type !== "divider";
  });
  const unavailableCount = actions.filter((action) => action.type !== "divider" && action.disabled).length;

  const handleOpen = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const run = (fn) => () => {
    handleClose();
    fn?.();
  };

  return (
    <>
      <Tooltip title={tEstimate("actions.moreActions", "More actions")}>
        <IconButton size="small" onClick={handleOpen}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{ sx: { minWidth: 260, borderRadius: 2 } }}
      >
        {cleanedActions.map((action, index) => {
          if (action.type === "divider") {
            return <Divider key={`divider-${index}`} />;
          }
          return (
            <MenuItem key={action.key || action.label} onClick={run(action.onClick)} sx={{ py: 1 }}>
              {action.icon ? <Box sx={{ mr: 1.5, display: "inline-flex", color: "text.secondary" }}>{action.icon}</Box> : null}
              <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} noWrap>
                  {action.label}
                </Typography>
                {action.help ? (
                  <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "normal", lineHeight: 1.35 }}>
                    {action.help}
                  </Typography>
                ) : null}
              </Stack>
            </MenuItem>
          );
        })}
        {unavailableCount > 0 ? (
          <>
            {cleanedActions.length ? <Divider /> : null}
            <Box sx={{ px: 2, py: 1.25 }}>
              <Typography variant="caption" color="text.secondary">
                {tEstimate("actions.unavailableNote", "Some actions are unavailable for this estimate state.")}
              </Typography>
            </Box>
          </>
        ) : null}
      </Menu>
    </>
  );
}

export default function EstimatesPage({ createNonce, onNavigate }) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const timezone = useMemo(() => getUserTimezone(), []);
  const tEstimate = useCallback(
    (key, fallback, options = {}) => t(`manager.finance.estimates.${key}`, { defaultValue: fallback, ...options }),
    [t]
  );
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [taxContext, setTaxContext] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [workOrderDialogOpen, setWorkOrderDialogOpen] = useState(false);
  const [workOrderSeed, setWorkOrderSeed] = useState(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [invoiceDialogId, setInvoiceDialogId] = useState(null);
  const [estimateAuditOpen, setEstimateAuditOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [linkBusyId, setLinkBusyId] = useState(null);
  const [paymentLinkBusyId, setPaymentLinkBusyId] = useState(null);
  const [pdfBusyId, setPdfBusyId] = useState(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailTarget, setEmailTarget] = useState(null);
  const [emailTo, setEmailTo] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [expandedOpen, setExpandedOpen] = useState(false);
  const [postConvertInvoice, setPostConvertInvoice] = useState(null);
  const [templateManagerOpen, setTemplateManagerOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templateEditor, setTemplateEditor] = useState(null);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateArchiveId, setTemplateArchiveId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [estimates, managerClients, templateList] = await Promise.all([
        listEstimates({ status: status || undefined, q: search || undefined, page, per_page: perPage }),
        listManagerClients(),
        listEstimateTemplates(),
      ]);
      setItems(Array.isArray(estimates?.items) ? estimates.items : Array.isArray(estimates) ? estimates : []);
      setPagination(estimates?.pagination || null);
      setTaxContext(estimates?.tax_context || null);
      setClients(managerClients);
      setTemplates(Array.isArray(templateList?.items) ? templateList.items : Array.isArray(templateList) ? templateList : []);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || tEstimate("errors.loadFailed", "Unable to load estimates."));
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, status, tEstimate]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (createNonce) {
      setEditing(null);
      setDialogOpen(true);
    }
  }, [createNonce]);

  useEffect(() => {
    if (!templates.length) {
      setSelectedTemplateId("");
      setTemplateEditor(null);
      return;
    }
    if (!selectedTemplateId || !templates.some((row) => String(row.id) === String(selectedTemplateId))) {
      setSelectedTemplateId(String(templates[0].id));
    }
  }, [templates, selectedTemplateId]);

  useEffect(() => {
    const selected = templates.find((row) => String(row.id) === String(selectedTemplateId));
    if (!selected) return;
    setTemplateEditor({
      id: selected.id,
      name: selected.name || "",
      description: selected.description || "",
      default_notes: selected.default_notes || "",
      default_terms: selected.default_terms || "",
      line_items: Array.isArray(selected.line_items) ? selected.line_items : [],
      is_active: Boolean(selected.is_active),
      updated_at: selected.updated_at || null,
    });
  }, [selectedTemplateId, templates]);

  const saveAsTemplate = async () => {
    if (!editing || !templateName) {
      enqueueSnackbar(tEstimate("snackbar.templateNameRequired", "Open an estimate and enter a template name first."), { variant: "warning" });
      return;
    }
    try {
      await createEstimateTemplate({
        name: templateName,
        default_notes: editing.notes || "",
        default_terms: editing.terms || "",
        line_items: Array.isArray(editing.line_items) ? editing.line_items : [],
      });
      enqueueSnackbar(tEstimate("snackbar.templateSaved", "Estimate template saved."), { variant: "success" });
      setTemplateName("");
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tEstimate("errors.saveTemplateFailed", "Unable to save template."), { variant: "error" });
    }
  };

  const openTemplateManager = () => {
    setTemplateManagerOpen(true);
  };

  const refreshTemplateEditor = async (templateId) => {
    const payload = await getEstimateTemplate(templateId);
    const row = payload?.template || payload;
    if (!row) return;
    setTemplateEditor({
      id: row.id,
      name: row.name || "",
      description: row.description || "",
      default_notes: row.default_notes || "",
      default_terms: row.default_terms || "",
      line_items: Array.isArray(row.line_items) ? row.line_items : [],
      is_active: Boolean(row.is_active),
      updated_at: row.updated_at || null,
    });
  };

  const handleTemplateSave = async () => {
    if (!templateEditor?.id) return;
    if (!String(templateEditor.name || "").trim()) {
      enqueueSnackbar(tEstimate("templateManager.errors.nameRequired", "Template name is required."), { variant: "warning" });
      return;
    }
    try {
      setTemplateSaving(true);
      await updateEstimateTemplate(templateEditor.id, {
        name: String(templateEditor.name || "").trim(),
        description: templateEditor.description || "",
        default_notes: templateEditor.default_notes || "",
        default_terms: templateEditor.default_terms || "",
      });
      enqueueSnackbar(tEstimate("templateManager.snackbar.saved", "Template updated."), { variant: "success" });
      await load();
      await refreshTemplateEditor(templateEditor.id);
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tEstimate("templateManager.errors.saveFailed", "Unable to update template."), { variant: "error" });
    } finally {
      setTemplateSaving(false);
    }
  };

  const handleTemplateArchive = async (templateId) => {
    if (!templateId) return;
    try {
      setTemplateArchiveId(templateId);
      await deleteEstimateTemplate(templateId);
      enqueueSnackbar(tEstimate("templateManager.snackbar.archived", "Template archived."), { variant: "success" });
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tEstimate("templateManager.errors.archiveFailed", "Unable to archive template."), { variant: "error" });
    } finally {
      setTemplateArchiveId(null);
    }
  };

  const handleSend = async (item) => {
    try {
      await sendEstimate(item.id);
      enqueueSnackbar(tEstimate("snackbar.markedSent", "Estimate marked as sent manually."), { variant: "success" });
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tEstimate("errors.markSentFailed", "Unable to mark estimate as sent."), { variant: "error" });
    }
  };

  const handleManualStatus = async (item, nextStatus, successMessage) => {
    try {
      await updateEstimate(item.id, { status: nextStatus });
      enqueueSnackbar(successMessage, { variant: "success" });
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tEstimate("errors.updateStatusFailed", "Unable to update estimate status."), { variant: "error" });
    }
  };

  const handleDuplicate = async (item) => {
    try {
      const res = await duplicateEstimate(item.id);
      const estimateNumber = res?.estimate?.estimate_number || res?.estimate_number;
      enqueueSnackbar(
        estimateNumber
          ? tEstimate("snackbar.duplicatedWithNumber", "Estimate duplicated: {{estimateNumber}}.", { estimateNumber })
          : tEstimate("snackbar.duplicated", "Estimate duplicated."),
        { variant: "success" }
      );
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tEstimate("errors.duplicateFailed", "Unable to duplicate estimate."), { variant: "error" });
    }
  };

  const ensureShareLink = async (item) => {
    const payload = await createEstimateShareLink(item.id);
    const publicUrl = payload?.public_url || payload?.estimate?.public_url;
    if (!publicUrl) {
      throw new Error(tEstimate("errors.shareLinkUnavailable", "Share link is not available."));
    }
    return { payload, publicUrl };
  };

  const handleCopyLink = async (item) => {
    try {
      setLinkBusyId(item.id);
      const { publicUrl } = await ensureShareLink(item);
      await navigator.clipboard.writeText(publicUrl);
      enqueueSnackbar(tEstimate("snackbar.estimateLinkCopied", "Estimate link copied."), { variant: "success" });
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tEstimate("errors.createEstimateLinkFailed", "Unable to create estimate link."), { variant: "error" });
    } finally {
      setLinkBusyId(null);
    }
  };

  const handleOpenLink = async (item) => {
    try {
      setLinkBusyId(item.id);
      const publicUrl = item.public_url || (await ensureShareLink(item)).publicUrl;
      window.open(publicUrl, "_blank", "noopener,noreferrer");
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tEstimate("errors.openEstimateLinkFailed", "Unable to open estimate link."), { variant: "error" });
    } finally {
      setLinkBusyId(null);
    }
  };

  const openSendEmailDialog = (item) => {
    setEmailTarget(item);
    setEmailTo(item?.client_email || "");
    setEmailMessage("");
    setEmailDialogOpen(true);
  };

  const handleSendEmail = async () => {
    if (!emailTarget) return;
    if (!String(emailTo || "").trim()) {
      enqueueSnackbar(tEstimate("errors.emailRequired", "Enter an email address first."), { variant: "warning" });
      return;
    }
    try {
      setEmailSending(true);
      await sendEstimateEmail(emailTarget.id, { email: emailTo.trim(), message: emailMessage.trim() || undefined });
      enqueueSnackbar(tEstimate("snackbar.emailSent", "Estimate email sent."), { variant: "success" });
      setEmailDialogOpen(false);
      setEmailTarget(null);
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tEstimate("errors.sendEmailFailed", "Unable to send estimate email."), { variant: "error" });
    } finally {
      setEmailSending(false);
    }
  };

  const handlePrintEstimate = async (item) => {
    try {
      setLinkBusyId(item.id);
      const publicUrl = item.public_url || (await ensureShareLink(item)).publicUrl;
      window.open(`${publicUrl}${publicUrl.includes("?") ? "&" : "?"}print=1`, "_blank", "noopener,noreferrer");
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tEstimate("errors.openPrintFailed", "Unable to open print view."), { variant: "error" });
    } finally {
      setLinkBusyId(null);
    }
  };

  const handleDownloadEstimatePdf = async (item) => {
    try {
      setPdfBusyId(item.id);
      const res = await downloadFinanceEstimatePdf(item.id);
      downloadBlob(res, `estimate-${item.estimate_number || item.id}.pdf`);
      enqueueSnackbar(tEstimate("snackbar.estimatePdfDownloaded", "Estimate PDF downloaded."), {
        variant: "success",
      });
    } catch (err) {
      if (isLikelyDownloadHandoffError(err)) {
        enqueueSnackbar(tEstimate("snackbar.downloadStarted", "Download started in your browser or download manager."), {
          variant: "info",
        });
        return;
      }
      enqueueSnackbar(await extractApiErrorMessage(err, tEstimate("errors.downloadPdfFailed", "Unable to download estimate PDF.")), {
        variant: "error",
      });
    } finally {
      setPdfBusyId(null);
    }
  };

  const ensurePaymentLink = async (item) => {
    if (!item?.converted_invoice_id) {
      throw new Error(tEstimate("errors.convertFirst", "Convert the estimate to an invoice first."));
    }
    const payload = await createFinanceInvoicePaymentLink(item.converted_invoice_id);
    const publicUrl = payload?.checkout_url || payload?.invoice?.hosted_invoice_url;
    if (!publicUrl) {
      throw new Error(tEstimate("errors.paymentLinkUnavailable", "Payment link is not available."));
    }
    return { payload, publicUrl };
  };

  const handleCopyPaymentLink = async (item) => {
    try {
      setPaymentLinkBusyId(item.id);
      const { publicUrl } = await ensurePaymentLink(item);
      await navigator.clipboard.writeText(publicUrl);
      enqueueSnackbar(tEstimate("snackbar.paymentLinkCopied", "Payment link copied."), { variant: "success" });
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tEstimate("errors.createPaymentLinkFailed", "Unable to create payment link."), { variant: "error" });
    } finally {
      setPaymentLinkBusyId(null);
    }
  };

  const handleOpenPaymentLink = async (item) => {
    try {
      setPaymentLinkBusyId(item.id);
      const publicUrl = item.converted_invoice_hosted_invoice_url || (await ensurePaymentLink(item)).publicUrl;
      window.open(publicUrl, "_blank", "noopener,noreferrer");
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tEstimate("errors.openPaymentLinkFailed", "Unable to open payment link."), { variant: "error" });
    } finally {
      setPaymentLinkBusyId(null);
    }
  };

  const handleReopenResponse = async (item) => {
    try {
      await reopenEstimateResponse(item.id);
      enqueueSnackbar(tEstimate("snackbar.reopenedForRevision", "Estimate reopened for revision."), { variant: "success" });
      await load();
      setEditing(item);
      setDialogOpen(true);
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tEstimate("errors.reopenFailed", "Unable to reopen estimate."), { variant: "error" });
    }
  };

  const handleConvert = async (item) => {
    try {
      const res = await convertEstimateToInvoice(item.id);
      const invoiceNumber = res?.invoice?.invoice_number || res?.invoice_number || res?.invoice?.number;
      const invoiceId = res?.invoice?.id || res?.invoice_id;
      enqueueSnackbar(
        invoiceNumber
          ? tEstimate("snackbar.invoiceCreatedWithNumber", "Invoice created: {{invoiceNumber}}.", { invoiceNumber })
          : tEstimate("snackbar.invoiceCreated", "Invoice created."),
        { variant: "success" }
      );
      if (invoiceId) {
        setPostConvertInvoice({
          id: invoiceId,
          invoiceNumber: invoiceNumber || `#${invoiceId}`,
          estimateNumber: item?.estimate_number || "",
        });
      }
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tEstimate("errors.convertFailed", "Unable to convert estimate to invoice."), { variant: "error" });
    }
  };

  const handlePrintInvoice = async (invoiceId) => {
    try {
      const html = await getFinanceInvoicePrintHtml(invoiceId);
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const blobUrl = URL.createObjectURL(blob);
      const printWindow = window.open(blobUrl, "_blank", "noopener,noreferrer");
      if (!printWindow) {
        URL.revokeObjectURL(blobUrl);
        enqueueSnackbar(tEstimate("errors.openPrintFailed", "Unable to open print view."), { variant: "warning" });
        return;
      }
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tEstimate("errors.openPrintFailed", "Unable to open print view."), { variant: "error" });
    }
  };

  const handleCopySummary = async (item) => {
    try {
      const detail = await getEstimate(item.id);
      const estimate = detail?.estimate || detail || item;
      const lines = Array.isArray(estimate?.line_items) ? estimate.line_items : [];
      const summary = [
        tEstimate("summary.estimateHeader", "Estimate {{estimateNumber}}", {
          estimateNumber: estimate.estimate_number || `#${estimate.id}`,
        }),
        estimate.title || "",
        estimate.client_name ? tEstimate("summary.client", "Client: {{value}}", { value: estimate.client_name }) : "",
        estimate.client_email ? tEstimate("summary.email", "Email: {{value}}", { value: estimate.client_email }) : "",
        "",
        tEstimate("summary.items", "Items:"),
        ...(lines.length
          ? lines.map((line) => {
              const quantity = Number(line.quantity || 0);
              const price = formatCurrency(line.unit_price || 0, estimate.currency);
              return `- ${line.description || tEstimate("summary.lineItem", "Line item")}${quantity ? ` • ${tEstimate("summary.qty", "Qty")} ${quantity}` : ""}${price ? ` • ${price}` : ""}`;
            })
          : [`- ${tEstimate("summary.noItems", "Line items are not available in this summary.")}`]),
        "",
        `${tEstimate("summary.subtotal", "Subtotal")}: ${formatCurrency(estimate.subtotal || 0, estimate.currency)}`,
        `${tEstimate("summary.tax", "Tax")}: ${formatCurrency(estimate.tax_total || 0, estimate.currency)}`,
        `${tEstimate("summary.total", "Total")}: ${formatCurrency(estimate.total || 0, estimate.currency)}`,
        estimate.visible_notes || estimate.notes ? "" : null,
        estimate.visible_notes ? `${tEstimate("summary.notes", "Notes")}: ${estimate.visible_notes}` : null,
        !estimate.visible_notes && estimate.notes ? `${tEstimate("summary.notes", "Notes")}: ${estimate.notes}` : null,
        "",
        tEstimate("summary.reply", "Reply to this message to approve or request changes."),
      ].filter(Boolean).join("\n");
      await navigator.clipboard.writeText(summary);
      enqueueSnackbar(tEstimate("snackbar.summaryCopied", "Estimate summary copied."), { variant: "success" });
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tEstimate("errors.copySummaryFailed", "Unable to copy estimate summary."), { variant: "error" });
    }
  };

  const handleCreateWorkOrder = (item) => {
    setWorkOrderSeed(item);
    setWorkOrderDialogOpen(true);
  };

  const handleOpenInvoice = (item) => {
    if (!item?.converted_invoice_id) {
      enqueueSnackbar(tEstimate("errors.convertFirst", "Convert the estimate to an invoice first."), { variant: "warning" });
      return;
    }
    setInvoiceDialogId(item.converted_invoice_id);
    setInvoiceDialogOpen(true);
  };

  const estimateCountLabel = pagination?.total || items.length;

  const buildRowActions = (item) => {
    const canOpenInvoice = Boolean(item.converted_invoice_id);
    const isConverted = item.status === "converted_to_invoice";
    const rowBusy = linkBusyId === item.id || paymentLinkBusyId === item.id || pdfBusyId === item.id;
    const hasPaymentLink = Boolean(item.converted_invoice_hosted_invoice_url);
    const hasClientResponse = Boolean(item.client_accepted_at || item.client_rejected_at);

    const primaryActions = canOpenInvoice
      ? [
          {
            key: "open-invoice",
            label: tEstimate("actions.openInvoice", "Open Invoice"),
            icon: <DescriptionOutlinedIcon fontSize="small" />,
            onClick: () => handleOpenInvoice(item),
            variant: "contained",
          },
          hasPaymentLink
            ? {
                key: "open-payment-link",
                label: tEstimate("actions.openPaymentLink", "Open Payment Link"),
                icon: <LaunchIcon fontSize="small" />,
                onClick: () => handleOpenPaymentLink(item),
                variant: "outlined",
                disabled: rowBusy,
              }
            : {
                key: "copy-payment-link",
                label: tEstimate("actions.copyPaymentLink", "Create / Copy Payment Link"),
                icon: <PaymentOutlinedIcon fontSize="small" />,
                onClick: () => handleCopyPaymentLink(item),
                variant: "outlined",
                disabled: rowBusy,
              },
        ]
      : [
          {
            key: "edit",
            label: tEstimate("actions.edit", "Edit"),
            icon: <EditOutlinedIcon fontSize="small" />,
            onClick: () => {
              setEditing(item);
              setDialogOpen(true);
            },
            variant: "outlined",
          },
          {
            key: "convert",
            label: tEstimate("actions.convertToInvoice", "Convert to Invoice"),
            icon: <RequestQuoteOutlinedIcon fontSize="small" />,
            onClick: () => handleConvert(item),
            variant: "contained",
            disabled: isConverted,
          },
        ];

    const visibleKeys = new Set(primaryActions.map((action) => action.key));
    const allMenuActions = [
      {
        key: "edit",
        label: tEstimate("actions.edit", "Edit"),
        help: tEstimate("actionHelp.edit", "Open the estimate editor with the current billing snapshot and line items."),
        icon: <EditOutlinedIcon fontSize="small" />,
        onClick: () => {
          setEditing(item);
          setDialogOpen(true);
        },
      },
      {
        key: "copy-link",
        label: tEstimate("actions.copyLink", "Create / Copy Link"),
        help: tEstimate("actionHelp.copyLink", "Create the public estimate link if needed and copy it to the clipboard."),
        icon: <LinkIcon fontSize="small" />,
        onClick: () => handleCopyLink(item),
        disabled: rowBusy,
      },
      {
        key: "open-link",
        label: tEstimate("actions.openLink", "Open Link"),
        help: tEstimate("actionHelp.openLink", "Open the client-facing public estimate page in a new tab."),
        icon: <LaunchIcon fontSize="small" />,
        onClick: () => handleOpenLink(item),
        disabled: rowBusy,
      },
      {
        key: "send-estimate",
        label: tEstimate("actions.sendEstimate", "Send Estimate"),
        help: tEstimate("actionHelp.sendEstimate", "Use the existing mail flow to send the estimate link to the client."),
        icon: <EmailOutlinedIcon fontSize="small" />,
        onClick: () => openSendEmailDialog(item),
        disabled: rowBusy,
      },
      {
        key: "copy-summary",
        label: tEstimate("actions.copySummary", "Copy Summary"),
        help: tEstimate("actionHelp.copySummary", "Copy a text summary with the estimate number, client, line items, and totals."),
        icon: <ContentCopyIcon fontSize="small" />,
        onClick: () => handleCopySummary(item),
      },
      {
        key: "print-pdf",
        label: tEstimate("actions.printPdf", "Print / PDF"),
        help: tEstimate("actionHelp.printPdf", "Open the clean browser print view for save-as-PDF or printing."),
        icon: <LocalPrintshopOutlinedIcon fontSize="small" />,
        onClick: () => handlePrintEstimate(item),
        disabled: rowBusy,
      },
      {
        key: "download-pdf",
        label: tEstimate("actions.downloadPdf", "Download PDF"),
        help: tEstimate("actionHelp.downloadPdf", "Generate a direct PDF file for this estimate."),
        icon: <PictureAsPdfOutlinedIcon fontSize="small" />,
        onClick: () => handleDownloadEstimatePdf(item),
        disabled: rowBusy,
      },
      { type: "divider", key: "divider-1" },
      {
        key: "mark-sent",
        label: tEstimate("actions.markSent", "Mark Sent Manually"),
        help: tEstimate("actionHelp.markSent", "Use when you sent the estimate outside the automated email flow."),
        onClick: () => handleSend(item),
        disabled: isConverted,
      },
      {
        key: "mark-accepted",
        label: tEstimate("actions.markAccepted", "Mark Accepted"),
        help: tEstimate("actionHelp.markAccepted", "Manager-only manual status update. This is not the public client approval flow."),
        onClick: () => handleManualStatus(item, "approved", tEstimate("snackbar.markedAccepted", "Estimate marked accepted manually.")),
        disabled: isConverted,
      },
      {
        key: "mark-rejected",
        label: tEstimate("actions.markRejected", "Mark Rejected"),
        help: tEstimate("actionHelp.markRejected", "Manager-only manual rejection status. This does not use the public client rejection flow."),
        onClick: () => handleManualStatus(item, "rejected", tEstimate("snackbar.markedRejected", "Estimate marked rejected manually.")),
        disabled: isConverted,
      },
      { type: "divider", key: "divider-2" },
      {
        key: "duplicate",
        label: tEstimate("actions.duplicate", "Duplicate"),
        help: tEstimate("actionHelp.duplicate", "Create a new estimate using this estimate as the starting point."),
        onClick: () => handleDuplicate(item),
      },
      {
        key: "convert",
        label: tEstimate("actions.convertToInvoice", "Convert to Invoice"),
        help: tEstimate("actionHelp.convertToInvoice", "Create the local finance invoice from this estimate when billing is ready."),
        icon: <RequestQuoteOutlinedIcon fontSize="small" />,
        onClick: () => handleConvert(item),
        disabled: isConverted,
      },
      {
        key: "copy-payment-link",
        label: tEstimate("actions.copyPaymentLink", "Create / Copy Payment Link"),
        help: tEstimate("actionHelp.copyPaymentLink", "Create or reuse the hosted Stripe invoice link for the converted invoice."),
        icon: <PaymentOutlinedIcon fontSize="small" />,
        onClick: () => handleCopyPaymentLink(item),
        disabled: !item.converted_invoice_id || rowBusy,
      },
      {
        key: "open-payment-link",
        label: tEstimate("actions.openPaymentLink", "Open Payment Link"),
        help: tEstimate("actionHelp.openPaymentLink", "Open the hosted Stripe invoice/payment page for this converted invoice."),
        icon: <LaunchIcon fontSize="small" />,
        onClick: () => handleOpenPaymentLink(item),
        disabled: !item.converted_invoice_id || rowBusy,
      },
      {
        key: "open-invoice",
        label: tEstimate("actions.openInvoice", "Open Invoice"),
        help: tEstimate("actionHelp.openInvoice", "Open the finance invoice detail dialog."),
        icon: <DescriptionOutlinedIcon fontSize="small" />,
        onClick: () => handleOpenInvoice(item),
        disabled: !item.converted_invoice_id,
      },
      {
        key: "create-work-order",
        label: tEstimate("actions.createWorkOrder", "Create Work Order"),
        help: tEstimate("actionHelp.createWorkOrder", "Move the approved estimate into operational job execution."),
        icon: <AddTaskOutlinedIcon fontSize="small" />,
        onClick: () => handleCreateWorkOrder(item),
      },
      {
        key: "revise-resend",
        label: tEstimate("actions.reviseResend", "Revise and Resend"),
        help: tEstimate("actionHelp.reviseResend", "Reopen the client response flow so you can adjust and resend the estimate."),
        onClick: () => handleReopenResponse(item),
        disabled: !hasClientResponse,
      },
    ];

    return {
      primaryActions,
      menuActions: allMenuActions.filter((action) => action.type === "divider" || !visibleKeys.has(action.key)),
    };
  };

  const renderCollapsedStatus = (item) => {
    const supplemental = buildSupplementalFlags(item, tEstimate);
    const visibleSupplemental = supplemental.slice(0, 1);
    const hiddenSupplemental = supplemental.slice(1);

    return (
      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
        <FinanceStatusChip status={item.status} />
        {visibleSupplemental.map((flag) => (
          <Chip
            key={flag.label}
            size="small"
            label={flag.label}
            color={flag.color}
            variant={flag.variant || "outlined"}
            sx={statusFlagChipSx}
          />
        ))}
        {hiddenSupplemental.length ? (
          <Tooltip
            title={
              <Stack spacing={0.25} sx={{ py: 0.25 }}>
                {hiddenSupplemental.map((flag) => (
                  <Typography key={flag.label} variant="caption">{flag.label}</Typography>
                ))}
              </Stack>
            }
          >
            <Chip size="small" label={`+${hiddenSupplemental.length}`} variant="outlined" sx={statusFlagChipSx} />
          </Tooltip>
        ) : null}
      </Stack>
    );
  };

  const renderCompactRows = () => (
    <Stack spacing={1.25}>
      {items.map((item) => {
        const { primaryActions, menuActions } = buildRowActions(item);
        return (
          <Paper key={item.id} variant="outlined" sx={{ p: 1.75, borderRadius: 3 }}>
            <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5} justifyContent="space-between">
              <Stack spacing={1.1} sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ md: "flex-start" }}>
                  <Stack spacing={0.45} sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.2, fontWeight: 800 }}>
                      {item.estimate_number}
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.3 }}>
                      {item.title || tEstimate("fallbacks.untitled", "Untitled estimate")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {item.client_name || "-"}{item.client_email ? ` • ${item.client_email}` : ""}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={captionClampSx}>
                      {item.issue_date || tEstimate("fallbacks.noIssueDate", "No issue date")} • {item.sent_at ? tEstimate("metadata.sentAt", "Sent {{value}}", { value: formatDateTimeInTz(item.sent_at, timezone) }) : tEstimate("fallbacks.notSent", "Not sent")} • {tEstimate(Number(item.line_count ?? 0) === 1 ? "metadata.lineCount_one" : "metadata.lineCount_other", Number(item.line_count ?? 0) === 1 ? "{{count}} line" : "{{count}} lines", { count: item.line_count ?? 0 })}
                    </Typography>
                  </Stack>

                  <Stack spacing={0.65} alignItems={{ xs: "flex-start", md: "flex-end" }} sx={{ minWidth: { md: 180 } }}>
                    {renderCollapsedStatus(item)}
                    <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1 }}>
                      {formatCurrency(item.total, item.currency)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: { md: "right" } }}>
                      {item.converted_invoice_number ? `${item.converted_invoice_number} • ${formatPaymentState(item, tEstimate)}` : `${tEstimate("fallbacks.noInvoiceYet", "No invoice yet")} • ${tEstimate("paymentState.convertFirst", "Convert first")}`}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>

              <Stack direction={{ xs: "row", md: "row" }} spacing={1} alignItems="center" justifyContent={{ xs: "flex-start", lg: "flex-end" }} flexWrap="wrap" useFlexGap sx={{ minWidth: { lg: 320 } }}>
                {primaryActions.map((action) => (
                  <Button
                    key={action.key}
                    size="small"
                    variant={action.variant}
                    startIcon={action.icon}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    sx={{ whiteSpace: "nowrap" }}
                  >
                    {action.label}
                  </Button>
                ))}
                <EstimateActionMenu actions={menuActions} tEstimate={tEstimate} />
              </Stack>
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );

  const renderExpandedTable = () => (
    <Paper variant="outlined" sx={{ overflow: "hidden", borderRadius: 0, borderColor: "transparent" }}>
      <Box sx={{ overflowX: "auto" }}>
        <Table sx={{ minWidth: 1380 }}>
          <TableHead>
            <TableRow
              sx={{
                bgcolor: "background.default",
                "& .MuiTableCell-root": {
                  fontWeight: 800,
                  fontSize: 12,
                  letterSpacing: 0.2,
                  textTransform: "uppercase",
                  color: "text.secondary",
                  whiteSpace: "nowrap",
                },
              }}
            >
              <TableCell sx={{ minWidth: 124 }}>{tEstimate("table.headers.estimateNumber", "Estimate #")}</TableCell>
              <TableCell sx={{ minWidth: 280 }}>{tEstimate("table.headers.title", "Title")}</TableCell>
              <TableCell sx={{ minWidth: 240 }}>{tEstimate("table.headers.client", "Client")}</TableCell>
              <TableCell sx={{ minWidth: 270 }}>{tEstimate("table.headers.status", "Status")}</TableCell>
              <TableCell align="right" sx={{ minWidth: 110 }}>{tEstimate("table.headers.total", "Total")}</TableCell>
              <TableCell sx={{ minWidth: 120 }}>{tEstimate("table.headers.issueDate", "Issue date")}</TableCell>
              <TableCell sx={{ minWidth: 176 }}>{tEstimate("table.headers.sent", "Sent")}</TableCell>
              <TableCell align="center" sx={{ minWidth: 72 }}>{tEstimate("table.headers.lines", "Lines")}</TableCell>
              <TableCell sx={{ minWidth: 220 }}>{tEstimate("table.headers.invoice", "Invoice")}</TableCell>
              <TableCell
                align="right"
                sx={{
                  minWidth: 320,
                  position: "sticky",
                  right: 0,
                  zIndex: 3,
                  bgcolor: "background.paper",
                  borderLeft: (theme) => `1px solid ${theme.palette.divider}`,
                }}
              >
                {tEstimate("table.headers.actions", "Actions")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => {
              const { primaryActions, menuActions } = buildRowActions(item);
              return (
                <TableRow
                  key={item.id}
                  hover
                  sx={{
                    "& .MuiTableCell-root": {
                      py: 1.5,
                      borderBottomColor: "divider",
                      verticalAlign: "top",
                    },
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={800} sx={{ whiteSpace: "nowrap" }}>
                      {item.estimate_number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.35 }}>
                      {item.title || tEstimate("fallbacks.untitled", "Untitled estimate")}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.35} sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={700} noWrap>
                        {item.client_name || "-"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {item.client_email || ""}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                      <FinanceStatusChip status={item.status} />
                      {buildSupplementalFlags(item, tEstimate).map((flag) => (
                        <Chip
                          key={flag.label}
                          size="small"
                          label={flag.label}
                          color={flag.color}
                          variant={flag.variant || "outlined"}
                          sx={statusFlagChipSx}
                        />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={800} sx={{ whiteSpace: "nowrap" }}>
                      {formatCurrency(item.total, item.currency)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
                      {item.issue_date || tEstimate("fallbacks.dash", "-")}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color={item.sent_at ? "text.primary" : "text.secondary"} sx={{ whiteSpace: "nowrap" }}>
                      {item.sent_at ? formatDateTimeInTz(item.sent_at, timezone) : tEstimate("fallbacks.dash", "-")}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={item.line_count ?? 0} size="small" variant="outlined" sx={statusFlagChipSx} />
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.35}>
                      <Typography variant="body2" fontWeight={item.converted_invoice_number ? 700 : 500} color={item.converted_invoice_number ? "text.primary" : "text.secondary"} sx={{ whiteSpace: "nowrap" }}>
                        {item.converted_invoice_number || tEstimate("fallbacks.noInvoiceYet", "No invoice yet")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {formatPaymentState(item, tEstimate)}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      position: "sticky",
                      right: 0,
                      zIndex: 2,
                      bgcolor: "background.paper",
                      borderLeft: (theme) => `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center" flexWrap="wrap" useFlexGap>
                      {primaryActions.map((action) => (
                        <Button
                          key={action.key}
                          size="small"
                          variant={action.variant}
                          startIcon={action.icon}
                          onClick={action.onClick}
                          disabled={action.disabled}
                          sx={{ whiteSpace: "nowrap" }}
                        >
                          {action.label}
                        </Button>
                      ))}
                      <EstimateActionMenu actions={menuActions} tEstimate={tEstimate} />
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  );

  return (
    <Stack spacing={2}>
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, md: 2.5 },
          borderRadius: 3,
          borderColor: "divider",
          background: (theme) => theme.palette.background.paper,
        }}
      >
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={2} justifyContent="space-between" alignItems={{ lg: "flex-start" }}>
            <Stack spacing={0.75} sx={{ minWidth: 0 }}>
              <Typography variant="h5" fontWeight={800}>
                {tEstimate("page.title", "Estimates")}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 720 }}>
                {tEstimate("page.description", "Price custom work, keep client-ready estimate links organized, and move approved jobs into invoice and work-order workflow without losing finance context.")}
              </Typography>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button variant="outlined" onClick={() => setEstimateAuditOpen(true)}>
                {tEstimate("toolbar.activityLog", "Activity log")}
              </Button>
              <Button variant="outlined" startIcon={<OpenInFullIcon />} onClick={() => setExpandedOpen(true)} disabled={loading || items.length === 0}>
                {tEstimate("toolbar.expandView", "Expand View")}
              </Button>
              <Button
                variant="contained"
                startIcon={<AddTaskOutlinedIcon />}
                onClick={() => {
                  setEditing(null);
                  setDialogOpen(true);
                }}
              >
                {tEstimate("toolbar.newEstimate", "New Estimate")}
              </Button>
            </Stack>
          </Stack>

          <Stack direction={{ xs: "column", xl: "row" }} spacing={1.5} alignItems={{ xl: "center" }} justifyContent="space-between">
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} sx={{ flex: 1 }}>
              <TextField
                size="small"
                label={tEstimate("toolbar.searchLabel", "Search estimates")}
                placeholder={tEstimate("toolbar.searchPlaceholder", "Estimate #, title, client, or invoice")}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") load();
                }}
                sx={{ minWidth: { xs: "100%", md: 320 } }}
              />
              <FormControl size="small" sx={{ minWidth: { xs: "100%", md: 190 } }}>
                <InputLabel>{tEstimate("toolbar.statusLabel", "Status")}</InputLabel>
                <Select label={tEstimate("toolbar.statusLabel", "Status")} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                  <MenuItem value="">{tEstimate("toolbar.allStatuses", "All statuses")}</MenuItem>
                  <MenuItem value="draft">{t("manager.finance.shared.statuses.draft", { defaultValue: "Draft" })}</MenuItem>
                  <MenuItem value="sent">{t("manager.finance.shared.statuses.sent", { defaultValue: "Sent" })}</MenuItem>
                  <MenuItem value="viewed">{t("manager.finance.shared.statuses.viewed", { defaultValue: "Viewed" })}</MenuItem>
                  <MenuItem value="approved">{t("manager.finance.shared.statuses.approved", { defaultValue: "Approved" })}</MenuItem>
                  <MenuItem value="rejected">{t("manager.finance.shared.statuses.rejected", { defaultValue: "Rejected" })}</MenuItem>
                  <MenuItem value="converted_to_invoice">{t("manager.finance.shared.statuses.converted_to_invoice", { defaultValue: "Converted to Invoice" })}</MenuItem>
                </Select>
              </FormControl>
              <Button variant="outlined" onClick={load} sx={{ minWidth: 110 }}>
                {tEstimate("toolbar.refresh", "Refresh")}
              </Button>
            </Stack>
            <Chip label={tEstimate(Number(estimateCountLabel) === 1 ? "toolbar.count_one" : "toolbar.count_other", Number(estimateCountLabel) === 1 ? "{{count}} estimate" : "{{count}} estimates", { count: estimateCountLabel })} variant="outlined" sx={{ alignSelf: { xs: "flex-start", xl: "center" }, fontWeight: 700 }} />
          </Stack>

          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2.5, bgcolor: "background.default" }}>
            <Stack direction={{ xs: "column", lg: "row" }} spacing={1.25} alignItems={{ lg: "center" }} justifyContent="space-between">
              <Stack spacing={0.35}>
                <Typography variant="subtitle2" fontWeight={800}>
                  {tEstimate("templateShortcut.title", "Estimate templates")}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {tEstimate("templateShortcut.description", "Save the notes, terms, and line items from the estimate currently open in the editor, then reuse them for future estimates.")}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {tEstimate("templateShortcut.whatGetsSaved", "What gets saved: notes, terms, and line items only.")}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {tEstimate("templateShortcut.whatDoesNotSave", "Not saved: client, dates, status, approval, and payment information.")}
                </Typography>
                {!editing ? (
                  <Typography variant="caption" color="text.secondary">
                    {tEstimate("templateShortcut.openEstimateFirst", "Open an estimate in the editor first, then save its structure as a template.")}
                  </Typography>
                ) : null}
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", lg: "auto" } }}>
                <TextField size="small" disabled={!editing} label={tEstimate("templateShortcut.templateName", "Template name")} value={templateName} onChange={(e) => setTemplateName(e.target.value)} sx={{ minWidth: { xs: "100%", sm: 240 } }} />
                <Button variant="outlined" onClick={saveAsTemplate} disabled={!editing || !String(templateName || "").trim()} sx={{ whiteSpace: "nowrap" }}>
                  {tEstimate("templateShortcut.saveCurrent", "Save estimate structure as template")}
                </Button>
                <Button variant="text" onClick={openTemplateManager} sx={{ whiteSpace: "nowrap" }}>
                  {tEstimate("templateShortcut.manage", "Manage templates")}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      </Paper>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
      ) : items.length === 0 ? (
        <FinanceEmptyState
          title={tEstimate("empty.title", "No estimates yet")}
          description={tEstimate("empty.description", "Create a simple estimate, send it, and convert it to an invoice when the work is approved.")}
          actionLabel={tEstimate("empty.action", "Create estimate")}
          onAction={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        />
      ) : (
        renderCompactRows()
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

      <Dialog fullScreen open={expandedOpen} onClose={() => setExpandedOpen(false)}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1.5 }}>
          <Stack spacing={0.25}>
            <Typography variant="h6" fontWeight={800}>{tEstimate("expanded.title", "Estimates")}</Typography>
            <Typography variant="body2" color="text.secondary">{tEstimate("expanded.description", "Expanded working view with sticky actions and full estimate columns.")}</Typography>
          </Stack>
          <IconButton onClick={() => setExpandedOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, bgcolor: "background.default" }}>
          {renderExpandedTable()}
        </DialogContent>
      </Dialog>

      <EstimateEditorDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={async () => {
          enqueueSnackbar(editing ? tEstimate("snackbar.updated", "Estimate updated.") : tEstimate("snackbar.created", "Estimate created."), { variant: "success" });
          await load();
        }}
        onNavigate={onNavigate}
        estimate={editing}
        clients={clients}
        templates={templates}
        taxContext={taxContext}
      />
      <WorkOrderEditorDialog
        open={workOrderDialogOpen}
        onClose={() => setWorkOrderDialogOpen(false)}
        onSaved={async () => {
          setWorkOrderDialogOpen(false);
          enqueueSnackbar(tEstimate("snackbar.workOrderCreated", "Work order created from estimate."), { variant: "success" });
          await load();
          onNavigate?.("finance-work-orders");
        }}
        clients={clients}
        estimates={items}
        prefillEstimate={workOrderSeed}
      />
      <FinanceInvoiceDetailDialog
        open={invoiceDialogOpen}
        invoiceId={invoiceDialogId}
        onClose={() => {
          setInvoiceDialogOpen(false);
          setInvoiceDialogId(null);
        }}
        onSaved={async () => {
          await load();
        }}
        onOpenInvoice={(nextInvoiceId) => {
          setInvoiceDialogId(nextInvoiceId);
          setInvoiceDialogOpen(true);
        }}
      />
      <FinanceAuditTimeline
        open={estimateAuditOpen}
        onClose={() => setEstimateAuditOpen(false)}
        entityType="estimate"
        title={tEstimate("audit.pageTitle", "Estimate activity")}
        emptyText={tEstimate("audit.pageEmpty", "No estimate audit records yet.")}
      />
      <Dialog
        open={Boolean(postConvertInvoice)}
        onClose={() => setPostConvertInvoice(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{tEstimate("postConvert.title", "Invoice created")}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5}>
            <Typography variant="body1" fontWeight={600}>
              {postConvertInvoice?.invoiceNumber || tEstimate("postConvert.invoiceFallback", "New invoice")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {postConvertInvoice?.estimateNumber
                ? tEstimate(
                    "postConvert.subtitleWithEstimate",
                    "The estimate {{estimateNumber}} is now a finance invoice. Choose the next billing action.",
                    { estimateNumber: postConvertInvoice.estimateNumber }
                  )
                : tEstimate(
                    "postConvert.subtitle",
                    "The estimate is now a finance invoice. Choose the next billing action."
                  )}
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
              <Button
                variant="contained"
                startIcon={<DescriptionOutlinedIcon fontSize="small" />}
                onClick={() => {
                  if (!postConvertInvoice?.id) return;
                  setInvoiceDialogId(postConvertInvoice.id);
                  setInvoiceDialogOpen(true);
                  setPostConvertInvoice(null);
                }}
              >
                {tEstimate("postConvert.openInvoice", "Open invoice")}
              </Button>
              <Button
                variant="outlined"
                startIcon={<PaymentOutlinedIcon fontSize="small" />}
                onClick={async () => {
                  if (!postConvertInvoice?.id) return;
                  try {
                    const payload = await createFinanceInvoicePaymentLink(postConvertInvoice.id);
                    const publicUrl = payload?.checkout_url || payload?.invoice?.hosted_invoice_url;
                    if (!publicUrl) {
                      throw new Error(tEstimate("errors.paymentLinkUnavailable", "Payment link is not available."));
                    }
                    await navigator.clipboard.writeText(publicUrl);
                    enqueueSnackbar(tEstimate("snackbar.paymentLinkCopied", "Payment link copied."), { variant: "success" });
                    await load();
                  } catch (err) {
                    enqueueSnackbar(err?.response?.data?.error || err?.message || tEstimate("errors.createPaymentLinkFailed", "Unable to create payment link."), { variant: "error" });
                  }
                }}
              >
                {tEstimate("postConvert.copyPaymentLink", "Create / copy payment link")}
              </Button>
              <Button
                variant="outlined"
                startIcon={<LocalPrintshopOutlinedIcon fontSize="small" />}
                onClick={() => {
                  if (!postConvertInvoice?.id) return;
                  handlePrintInvoice(postConvertInvoice.id);
                }}
              >
                {tEstimate("postConvert.printInvoice", "Print invoice")}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPostConvertInvoice(null)}>
            {tEstimate("common.close", "Close")}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={templateManagerOpen}
        onClose={templateSaving ? undefined : () => setTemplateManagerOpen(false)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>{tEstimate("templateManager.title", "Manage estimate templates")}</DialogTitle>
        <DialogContent dividers>
          {!templates.length ? (
            <Alert severity="info">
              {tEstimate("templateManager.empty", "No templates yet. Save an estimate structure first, then manage it here.")}
            </Alert>
          ) : (
            <Stack direction={{ xs: "column", md: "row" }} spacing={2.5}>
              <Stack spacing={1} sx={{ width: { xs: "100%", md: 300 }, flexShrink: 0 }}>
                {templates.map((template) => {
                  const selected = String(template.id) === String(selectedTemplateId);
                  return (
                    <Paper
                      key={template.id}
                      variant="outlined"
                      onClick={() => setSelectedTemplateId(String(template.id))}
                      sx={{
                        p: 1.25,
                        borderRadius: 2,
                        cursor: "pointer",
                        borderColor: selected ? "primary.main" : "divider",
                        bgcolor: selected ? "action.hover" : "background.paper",
                      }}
                    >
                      <Stack spacing={0.5}>
                        <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" fontWeight={800}>{template.name}</Typography>
                          <Chip
                            size="small"
                            label={template.is_active ? tEstimate("templateManager.status.active", "Active") : tEstimate("templateManager.status.archived", "Archived")}
                            color={template.is_active ? "success" : "default"}
                            variant="outlined"
                          />
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {tEstimate("templateManager.meta.lineCount", "{{count}} line items", { count: Array.isArray(template.line_items) ? template.line_items.length : 0 })}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {template.updated_at
                            ? tEstimate("templateManager.meta.updated", "Updated {{value}}", { value: formatDateTimeInTz(template.updated_at, timezone) })
                            : tEstimate("fallbacks.dash", "-")}
                        </Typography>
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>

              <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
                {templateEditor ? (
                  <>
                    <TextField
                      label={tEstimate("templateManager.fields.name", "Template name")}
                      value={templateEditor.name}
                      onChange={(e) => setTemplateEditor((prev) => ({ ...prev, name: e.target.value }))}
                      fullWidth
                    />
                    <TextField
                      label={tEstimate("templateManager.fields.description", "Description")}
                      value={templateEditor.description}
                      onChange={(e) => setTemplateEditor((prev) => ({ ...prev, description: e.target.value }))}
                      fullWidth
                    />
                    <TextField
                      label={tEstimate("templateManager.fields.notes", "Default notes")}
                      value={templateEditor.default_notes}
                      onChange={(e) => setTemplateEditor((prev) => ({ ...prev, default_notes: e.target.value }))}
                      multiline
                      minRows={3}
                      fullWidth
                    />
                    <TextField
                      label={tEstimate("templateManager.fields.terms", "Default terms")}
                      value={templateEditor.default_terms}
                      onChange={(e) => setTemplateEditor((prev) => ({ ...prev, default_terms: e.target.value }))}
                      multiline
                      minRows={3}
                      fullWidth
                    />
                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                      <Stack spacing={0.75}>
                        <Typography variant="subtitle2" fontWeight={800}>
                          {tEstimate("templateManager.preview.title", "Saved line items")}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {tEstimate("templateManager.preview.help", "Line items are shown here so you can review what this template will prefill in a new estimate.")}
                        </Typography>
                        {Array.isArray(templateEditor.line_items) && templateEditor.line_items.length ? (
                          <Stack spacing={0.5}>
                            {templateEditor.line_items.map((line, idx) => (
                              <Typography key={`${templateEditor.id}-line-${idx}`} variant="body2" color="text.secondary">
                                {`- ${line.description || tEstimate("lineItems.presets.custom", "Custom")} • ${tEstimate("templateManager.preview.qty", "Qty")} ${Number(line.quantity || 0)} • ${formatCurrency(line.unit_price || 0)}`}
                              </Typography>
                            ))}
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            {tEstimate("templateManager.preview.empty", "No line items saved in this template yet.")}
                          </Typography>
                        )}
                      </Stack>
                    </Paper>
                  </>
                ) : null}
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          {templateEditor?.id ? (
            <Button
              color="warning"
              onClick={() => handleTemplateArchive(templateEditor.id)}
              disabled={templateSaving || templateArchiveId === templateEditor.id}
            >
              {tEstimate("templateManager.archive", "Archive template")}
            </Button>
          ) : null}
          <Button onClick={() => setTemplateManagerOpen(false)} disabled={templateSaving}>
            {tEstimate("common.close", "Close")}
          </Button>
          <Button onClick={handleTemplateSave} variant="contained" disabled={!templateEditor?.id || templateSaving}>
            {templateSaving ? tEstimate("common.saving", "Saving...") : tEstimate("common.saveChanges", "Save changes")}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={emailDialogOpen} onClose={emailSending ? undefined : () => setEmailDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{tEstimate("emailDialog.title", "Send Estimate")}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField label={tEstimate("emailDialog.recipientEmail", "Recipient email")} value={emailTo} onChange={(event) => setEmailTo(event.target.value)} />
            <TextField
              label={tEstimate("emailDialog.messageOptional", "Message (optional)")}
              multiline
              minRows={4}
              value={emailMessage}
              onChange={(event) => setEmailMessage(event.target.value)}
              helperText={tEstimate("emailDialog.helperText", "The estimate link and totals will be added automatically.")}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailDialogOpen(false)} disabled={emailSending}>{tEstimate("common.cancel", "Cancel")}</Button>
          <Button variant="contained" onClick={handleSendEmail} disabled={emailSending}>
            {emailSending ? tEstimate("common.sending", "Sending...") : tEstimate("common.send", "Send")}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
