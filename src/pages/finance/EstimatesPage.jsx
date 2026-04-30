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
import { useSnackbar } from "notistack";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LaunchIcon from "@mui/icons-material/Launch";
import LinkIcon from "@mui/icons-material/Link";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LocalPrintshopOutlinedIcon from "@mui/icons-material/LocalPrintshopOutlined";
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
  duplicateEstimate,
  getEstimate,
  listEstimateTemplates,
  listEstimates,
  listManagerClients,
  reopenEstimateResponse,
  sendEstimate,
  sendEstimateEmail,
  updateEstimate,
} from "./financeApi";
import FinanceStatusChip from "./components/FinanceStatusChip";
import FinanceEmptyState from "./components/FinanceEmptyState";
import FinancePagination from "./components/FinancePagination";

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

const formatPaymentState = (item) => {
  const paymentStatus = String(item?.converted_invoice_payment_status || item?.converted_invoice_status || "").toLowerCase();
  if (paymentStatus === "paid") return "Payment paid";
  if (paymentStatus === "partial_refund" || paymentStatus === "partially_refunded") return "Partially refunded";
  if (paymentStatus === "refunded") return "Refunded";
  if (item?.converted_invoice_hosted_invoice_url) return "Payment link ready";
  if (item?.converted_invoice_number) return "No payment link yet";
  return "Convert first";
};

const buildSupplementalFlags = (item) => {
  const flags = [];
  if (item?.converted_invoice_hosted_invoice_url) {
    flags.push({ label: "Payment link ready", color: "secondary", variant: "outlined" });
  }
  if (item?.public_url) {
    flags.push({ label: "Share link ready", variant: "outlined" });
  }
  if (item?.client_accepted_at) {
    flags.push({ label: "Accepted by client", color: "success", variant: "outlined" });
  } else if (item?.client_rejected_at) {
    flags.push({ label: "Rejected by client", color: "warning", variant: "outlined" });
  } else if (item?.public_viewed_at) {
    flags.push({ label: "Viewed by client", color: "info", variant: "outlined" });
  }
  return flags;
};

function EstimateActionMenu({ actions }) {
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
      <Tooltip title="More actions">
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
                Some actions are unavailable for this estimate state.
              </Typography>
            </Box>
          </>
        ) : null}
      </Menu>
    </>
  );
}

export default function EstimatesPage({ createNonce, onNavigate }) {
  const { enqueueSnackbar } = useSnackbar();
  const timezone = useMemo(() => getUserTimezone(), []);
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
  const [templateName, setTemplateName] = useState("");
  const [linkBusyId, setLinkBusyId] = useState(null);
  const [paymentLinkBusyId, setPaymentLinkBusyId] = useState(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailTarget, setEmailTarget] = useState(null);
  const [emailTo, setEmailTo] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [expandedOpen, setExpandedOpen] = useState(false);

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
      setError(err?.response?.data?.error || err?.message || "Unable to load estimates.");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, status]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (createNonce) {
      setEditing(null);
      setDialogOpen(true);
    }
  }, [createNonce]);

  const saveAsTemplate = async () => {
    if (!editing || !templateName) {
      enqueueSnackbar("Open an estimate and enter a template name first.", { variant: "warning" });
      return;
    }
    try {
      await createEstimateTemplate({
        name: templateName,
        default_notes: editing.notes || "",
        default_terms: editing.terms || "",
        line_items_json: Array.isArray(editing.line_items) ? editing.line_items : [],
      });
      enqueueSnackbar("Estimate template saved.", { variant: "success" });
      setTemplateName("");
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to save template.", { variant: "error" });
    }
  };

  const handleSend = async (item) => {
    try {
      await sendEstimate(item.id);
      enqueueSnackbar("Estimate marked as sent manually.", { variant: "success" });
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to mark estimate as sent.", { variant: "error" });
    }
  };

  const handleManualStatus = async (item, nextStatus, successMessage) => {
    try {
      await updateEstimate(item.id, { status: nextStatus });
      enqueueSnackbar(successMessage, { variant: "success" });
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to update estimate status.", { variant: "error" });
    }
  };

  const handleDuplicate = async (item) => {
    try {
      const res = await duplicateEstimate(item.id);
      const estimateNumber = res?.estimate?.estimate_number || res?.estimate_number;
      enqueueSnackbar(`Estimate duplicated${estimateNumber ? `: ${estimateNumber}` : ""}.`, { variant: "success" });
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to duplicate estimate.", { variant: "error" });
    }
  };

  const ensureShareLink = async (item) => {
    const payload = await createEstimateShareLink(item.id);
    const publicUrl = payload?.public_url || payload?.estimate?.public_url;
    if (!publicUrl) {
      throw new Error("Share link is not available.");
    }
    return { payload, publicUrl };
  };

  const handleCopyLink = async (item) => {
    try {
      setLinkBusyId(item.id);
      const { publicUrl } = await ensureShareLink(item);
      await navigator.clipboard.writeText(publicUrl);
      enqueueSnackbar("Estimate link copied.", { variant: "success" });
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to create estimate link.", { variant: "error" });
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
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to open estimate link.", { variant: "error" });
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
      enqueueSnackbar("Enter an email address first.", { variant: "warning" });
      return;
    }
    try {
      setEmailSending(true);
      await sendEstimateEmail(emailTarget.id, { email: emailTo.trim(), message: emailMessage.trim() || undefined });
      enqueueSnackbar("Estimate email sent.", { variant: "success" });
      setEmailDialogOpen(false);
      setEmailTarget(null);
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to send estimate email.", { variant: "error" });
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
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to open print view.", { variant: "error" });
    } finally {
      setLinkBusyId(null);
    }
  };

  const ensurePaymentLink = async (item) => {
    if (!item?.converted_invoice_id) {
      throw new Error("Convert the estimate to an invoice first.");
    }
    const payload = await createFinanceInvoicePaymentLink(item.converted_invoice_id);
    const publicUrl = payload?.checkout_url || payload?.invoice?.hosted_invoice_url;
    if (!publicUrl) {
      throw new Error("Payment link is not available.");
    }
    return { payload, publicUrl };
  };

  const handleCopyPaymentLink = async (item) => {
    try {
      setPaymentLinkBusyId(item.id);
      const { publicUrl } = await ensurePaymentLink(item);
      await navigator.clipboard.writeText(publicUrl);
      enqueueSnackbar("Payment link copied.", { variant: "success" });
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to create payment link.", { variant: "error" });
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
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to open payment link.", { variant: "error" });
    } finally {
      setPaymentLinkBusyId(null);
    }
  };

  const handleReopenResponse = async (item) => {
    try {
      await reopenEstimateResponse(item.id);
      enqueueSnackbar("Estimate reopened for revision.", { variant: "success" });
      await load();
      setEditing(item);
      setDialogOpen(true);
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to reopen estimate.", { variant: "error" });
    }
  };

  const handleConvert = async (item) => {
    try {
      const res = await convertEstimateToInvoice(item.id);
      const invoiceNumber = res?.invoice?.invoice_number || res?.invoice_number || res?.invoice?.number;
      enqueueSnackbar(invoiceNumber ? `Invoice created: ${invoiceNumber}.` : "Invoice created.", { variant: "success" });
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to convert estimate to invoice.", { variant: "error" });
    }
  };

  const handleCopySummary = async (item) => {
    try {
      const detail = await getEstimate(item.id);
      const estimate = detail?.estimate || detail || item;
      const lines = Array.isArray(estimate?.line_items) ? estimate.line_items : [];
      const summary = [
        `Estimate ${estimate.estimate_number || `#${estimate.id}`}`,
        estimate.title || "",
        estimate.client_name ? `Client: ${estimate.client_name}` : "",
        estimate.client_email ? `Email: ${estimate.client_email}` : "",
        "",
        "Items:",
        ...(lines.length
          ? lines.map((line) => {
              const quantity = Number(line.quantity || 0);
              const price = formatCurrency(line.unit_price || 0, estimate.currency);
              return `- ${line.description || "Line item"}${quantity ? ` • Qty ${quantity}` : ""}${price ? ` • ${price}` : ""}`;
            })
          : ["- Line items are not available in this summary."]),
        "",
        `Subtotal: ${formatCurrency(estimate.subtotal || 0, estimate.currency)}`,
        `Tax: ${formatCurrency(estimate.tax_total || 0, estimate.currency)}`,
        `Total: ${formatCurrency(estimate.total || 0, estimate.currency)}`,
        estimate.visible_notes || estimate.notes ? "" : null,
        estimate.visible_notes ? `Notes: ${estimate.visible_notes}` : null,
        !estimate.visible_notes && estimate.notes ? `Notes: ${estimate.notes}` : null,
        "",
        "Reply to this message to approve or request changes.",
      ].filter(Boolean).join("\n");
      await navigator.clipboard.writeText(summary);
      enqueueSnackbar("Estimate summary copied.", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to copy estimate summary.", { variant: "error" });
    }
  };

  const handleCreateWorkOrder = (item) => {
    setWorkOrderSeed(item);
    setWorkOrderDialogOpen(true);
  };

  const handleOpenInvoice = (item) => {
    if (!item?.converted_invoice_id) {
      enqueueSnackbar("Convert the estimate to an invoice first.", { variant: "warning" });
      return;
    }
    setInvoiceDialogId(item.converted_invoice_id);
    setInvoiceDialogOpen(true);
  };

  const estimateCountLabel = pagination?.total || items.length;

  const buildRowActions = (item) => {
    const canOpenInvoice = Boolean(item.converted_invoice_id);
    const isConverted = item.status === "converted_to_invoice";
    const rowBusy = linkBusyId === item.id || paymentLinkBusyId === item.id;
    const hasPaymentLink = Boolean(item.converted_invoice_hosted_invoice_url);
    const hasClientResponse = Boolean(item.client_accepted_at || item.client_rejected_at);

    const primaryActions = canOpenInvoice
      ? [
          {
            key: "open-invoice",
            label: "Open Invoice",
            icon: <DescriptionOutlinedIcon fontSize="small" />,
            onClick: () => handleOpenInvoice(item),
            variant: "contained",
          },
          hasPaymentLink
            ? {
                key: "open-payment-link",
                label: "Open Payment Link",
                icon: <LaunchIcon fontSize="small" />,
                onClick: () => handleOpenPaymentLink(item),
                variant: "outlined",
                disabled: rowBusy,
              }
            : {
                key: "copy-payment-link",
                label: "Create / Copy Payment Link",
                icon: <PaymentOutlinedIcon fontSize="small" />,
                onClick: () => handleCopyPaymentLink(item),
                variant: "outlined",
                disabled: rowBusy,
              },
        ]
      : [
          {
            key: "edit",
            label: "Edit",
            icon: <EditOutlinedIcon fontSize="small" />,
            onClick: () => {
              setEditing(item);
              setDialogOpen(true);
            },
            variant: "outlined",
          },
          {
            key: "convert",
            label: "Convert to Invoice",
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
        label: "Edit",
        help: "Open the estimate editor with the current billing snapshot and line items.",
        icon: <EditOutlinedIcon fontSize="small" />,
        onClick: () => {
          setEditing(item);
          setDialogOpen(true);
        },
      },
      {
        key: "copy-link",
        label: "Create / Copy Link",
        help: "Create the public estimate link if needed and copy it to the clipboard.",
        icon: <LinkIcon fontSize="small" />,
        onClick: () => handleCopyLink(item),
        disabled: rowBusy,
      },
      {
        key: "open-link",
        label: "Open Link",
        help: "Open the client-facing public estimate page in a new tab.",
        icon: <LaunchIcon fontSize="small" />,
        onClick: () => handleOpenLink(item),
        disabled: rowBusy,
      },
      {
        key: "send-estimate",
        label: "Send Estimate",
        help: "Use the existing mail flow to send the estimate link to the client.",
        icon: <EmailOutlinedIcon fontSize="small" />,
        onClick: () => openSendEmailDialog(item),
        disabled: rowBusy,
      },
      {
        key: "copy-summary",
        label: "Copy Summary",
        help: "Copy a text summary with the estimate number, client, line items, and totals.",
        icon: <ContentCopyIcon fontSize="small" />,
        onClick: () => handleCopySummary(item),
      },
      {
        key: "print-pdf",
        label: "Print / PDF",
        help: "Open the clean browser print view for save-as-PDF or printing.",
        icon: <LocalPrintshopOutlinedIcon fontSize="small" />,
        onClick: () => handlePrintEstimate(item),
        disabled: rowBusy,
      },
      { type: "divider", key: "divider-1" },
      {
        key: "mark-sent",
        label: "Mark Sent Manually",
        help: "Use when you sent the estimate outside the automated email flow.",
        onClick: () => handleSend(item),
        disabled: isConverted,
      },
      {
        key: "mark-accepted",
        label: "Mark Accepted",
        help: "Manager-only manual status update. This is not the public client approval flow.",
        onClick: () => handleManualStatus(item, "approved", "Estimate marked accepted manually."),
        disabled: isConverted,
      },
      {
        key: "mark-rejected",
        label: "Mark Rejected",
        help: "Manager-only manual rejection status. This does not use the public client rejection flow.",
        onClick: () => handleManualStatus(item, "rejected", "Estimate marked rejected manually."),
        disabled: isConverted,
      },
      { type: "divider", key: "divider-2" },
      {
        key: "duplicate",
        label: "Duplicate",
        help: "Create a new estimate using this estimate as the starting point.",
        onClick: () => handleDuplicate(item),
      },
      {
        key: "convert",
        label: "Convert to Invoice",
        help: "Create the local finance invoice from this estimate when billing is ready.",
        icon: <RequestQuoteOutlinedIcon fontSize="small" />,
        onClick: () => handleConvert(item),
        disabled: isConverted,
      },
      {
        key: "copy-payment-link",
        label: "Create / Copy Payment Link",
        help: "Create or reuse the hosted Stripe invoice link for the converted invoice.",
        icon: <PaymentOutlinedIcon fontSize="small" />,
        onClick: () => handleCopyPaymentLink(item),
        disabled: !item.converted_invoice_id || rowBusy,
      },
      {
        key: "open-payment-link",
        label: "Open Payment Link",
        help: "Open the hosted Stripe invoice/payment page for this converted invoice.",
        icon: <LaunchIcon fontSize="small" />,
        onClick: () => handleOpenPaymentLink(item),
        disabled: !item.converted_invoice_id || rowBusy,
      },
      {
        key: "open-invoice",
        label: "Open Invoice",
        help: "Open the finance invoice detail dialog.",
        icon: <DescriptionOutlinedIcon fontSize="small" />,
        onClick: () => handleOpenInvoice(item),
        disabled: !item.converted_invoice_id,
      },
      {
        key: "create-work-order",
        label: "Create Work Order",
        help: "Move the approved estimate into operational job execution.",
        icon: <AddTaskOutlinedIcon fontSize="small" />,
        onClick: () => handleCreateWorkOrder(item),
      },
      {
        key: "revise-resend",
        label: "Revise and Resend",
        help: "Reopen the client response flow so you can adjust and resend the estimate.",
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
    const supplemental = buildSupplementalFlags(item);
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
                      {item.title || "Untitled estimate"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {item.client_name || "-"}{item.client_email ? ` • ${item.client_email}` : ""}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={captionClampSx}>
                      {item.issue_date || "No issue date"} • {item.sent_at ? `Sent ${formatDateTimeInTz(item.sent_at, timezone)}` : "Not sent"} • {item.line_count ?? 0} line{Number(item.line_count ?? 0) === 1 ? "" : "s"}
                    </Typography>
                  </Stack>

                  <Stack spacing={0.65} alignItems={{ xs: "flex-start", md: "flex-end" }} sx={{ minWidth: { md: 180 } }}>
                    {renderCollapsedStatus(item)}
                    <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1 }}>
                      {formatCurrency(item.total, item.currency)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: { md: "right" } }}>
                      {item.converted_invoice_number ? `${item.converted_invoice_number} • ${formatPaymentState(item)}` : "No invoice yet • Convert first"}
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
                <EstimateActionMenu actions={menuActions} />
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
              <TableCell sx={{ minWidth: 124 }}>Estimate #</TableCell>
              <TableCell sx={{ minWidth: 280 }}>Title</TableCell>
              <TableCell sx={{ minWidth: 240 }}>Client</TableCell>
              <TableCell sx={{ minWidth: 270 }}>Status</TableCell>
              <TableCell align="right" sx={{ minWidth: 110 }}>Total</TableCell>
              <TableCell sx={{ minWidth: 120 }}>Issue date</TableCell>
              <TableCell sx={{ minWidth: 176 }}>Sent</TableCell>
              <TableCell align="center" sx={{ minWidth: 72 }}>Lines</TableCell>
              <TableCell sx={{ minWidth: 220 }}>Invoice</TableCell>
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
                Actions
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
                      {item.title || "Untitled estimate"}
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
                      {buildSupplementalFlags(item).map((flag) => (
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
                      {item.issue_date || "-"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color={item.sent_at ? "text.primary" : "text.secondary"} sx={{ whiteSpace: "nowrap" }}>
                      {item.sent_at ? formatDateTimeInTz(item.sent_at, timezone) : "-"}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={item.line_count ?? 0} size="small" variant="outlined" sx={statusFlagChipSx} />
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.35}>
                      <Typography variant="body2" fontWeight={item.converted_invoice_number ? 700 : 500} color={item.converted_invoice_number ? "text.primary" : "text.secondary"} sx={{ whiteSpace: "nowrap" }}>
                        {item.converted_invoice_number || "No invoice yet"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {formatPaymentState(item)}
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
                      <EstimateActionMenu actions={menuActions} />
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
                Estimates
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 720 }}>
                Price custom work, keep client-ready estimate links organized, and move approved jobs into invoice and work-order workflow without losing finance context.
              </Typography>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button variant="outlined" startIcon={<OpenInFullIcon />} onClick={() => setExpandedOpen(true)} disabled={loading || items.length === 0}>
                Expand View
              </Button>
              <Button
                variant="contained"
                startIcon={<AddTaskOutlinedIcon />}
                onClick={() => {
                  setEditing(null);
                  setDialogOpen(true);
                }}
              >
                New Estimate
              </Button>
            </Stack>
          </Stack>

          <Stack direction={{ xs: "column", xl: "row" }} spacing={1.5} alignItems={{ xl: "center" }} justifyContent="space-between">
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} sx={{ flex: 1 }}>
              <TextField
                size="small"
                label="Search estimates"
                placeholder="Estimate #, title, client, or invoice"
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
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                  <MenuItem value="">All statuses</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="sent">Sent</MenuItem>
                  <MenuItem value="viewed">Viewed</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                  <MenuItem value="converted_to_invoice">Converted to Invoice</MenuItem>
                </Select>
              </FormControl>
              <Button variant="outlined" onClick={load} sx={{ minWidth: 110 }}>
                Refresh
              </Button>
            </Stack>
            <Chip label={`${estimateCountLabel} estimate${Number(estimateCountLabel) === 1 ? "" : "s"}`} variant="outlined" sx={{ alignSelf: { xs: "flex-start", xl: "center" }, fontWeight: 700 }} />
          </Stack>

          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2.5, bgcolor: "background.default" }}>
            <Stack direction={{ xs: "column", lg: "row" }} spacing={1.25} alignItems={{ lg: "center" }} justifyContent="space-between">
              <Stack spacing={0.35}>
                <Typography variant="subtitle2" fontWeight={800}>
                  Template shortcut
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Save the estimate currently open in the editor as a reusable starting point.
                </Typography>
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", lg: "auto" } }}>
                <TextField size="small" label="Template name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} sx={{ minWidth: { xs: "100%", sm: 240 } }} />
                <Button variant="outlined" onClick={saveAsTemplate} sx={{ whiteSpace: "nowrap" }}>
                  Save current estimate as template
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
          title="No estimates yet"
          description="Create a simple estimate, send it, and convert it to an invoice when the work is approved."
          actionLabel="Create estimate"
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
            <Typography variant="h6" fontWeight={800}>Estimates</Typography>
            <Typography variant="body2" color="text.secondary">Expanded working view with sticky actions and full estimate columns.</Typography>
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
          enqueueSnackbar(editing ? "Estimate updated." : "Estimate created.", { variant: "success" });
          await load();
        }}
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
          enqueueSnackbar("Work order created from estimate.", { variant: "success" });
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
      />
      <Dialog open={emailDialogOpen} onClose={emailSending ? undefined : () => setEmailDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Send Estimate</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField label="Recipient email" value={emailTo} onChange={(event) => setEmailTo(event.target.value)} />
            <TextField
              label="Message (optional)"
              multiline
              minRows={4}
              value={emailMessage}
              onChange={(event) => setEmailMessage(event.target.value)}
              helperText="The estimate link and totals will be added automatically."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailDialogOpen(false)} disabled={emailSending}>Cancel</Button>
          <Button variant="contained" onClick={handleSendEmail} disabled={emailSending}>
            {emailSending ? "Sending..." : "Send"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
