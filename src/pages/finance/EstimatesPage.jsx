import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
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
import { formatDateTimeInTz } from "../../utils/datetime";
import { getUserTimezone } from "../../utils/timezone";
import { formatCurrency } from "../../utils/formatters";
import EstimateEditorDialog from "./EstimateEditorDialog";
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

export default function EstimatesPage({ createNonce, onNavigate }) {
  const { enqueueSnackbar } = useSnackbar();
  const timezone = useMemo(() => getUserTimezone(), []);
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [templates, setTemplates] = useState([]);
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
  const [templateName, setTemplateName] = useState("");
  const [linkBusyId, setLinkBusyId] = useState(null);
  const [paymentLinkBusyId, setPaymentLinkBusyId] = useState(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailTarget, setEmailTarget] = useState(null);
  const [emailTo, setEmailTo] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  const load = async () => {
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
      setClients(managerClients);
      setTemplates(Array.isArray(templateList?.items) ? templateList.items : Array.isArray(templateList) ? templateList : []);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to load estimates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status, page, perPage]);

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
      enqueueSnackbar(
        invoiceNumber ? `Invoice created: ${invoiceNumber}.` : "Invoice created.",
        { variant: "success" }
      );
      enqueueSnackbar("Hosted payment link creation for finance invoices is not available yet. Use invoice records for now.", {
        variant: "info",
      });
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

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between">
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <TextField
            size="small"
            label="Search estimates"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") load();
            }}
          />
          <FormControl size="small" sx={{ minWidth: 190 }}>
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
          <Button variant="outlined" onClick={load}>Refresh</Button>
        </Stack>
        <Button variant="contained" onClick={() => { setEditing(null); setDialogOpen(true); }}>New Estimate</Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
          <Typography fontWeight={700}>Optional template shortcut</Typography>
          <TextField size="small" label="Template name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} sx={{ minWidth: 220 }} />
          <Button variant="outlined" onClick={saveAsTemplate}>Save current estimate as template</Button>
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
          onAction={() => { setEditing(null); setDialogOpen(true); }}
        />
      ) : (
        <Paper variant="outlined" sx={{ overflowX: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Estimate #</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Issue date</TableCell>
                <TableCell>Sent</TableCell>
                <TableCell>Lines</TableCell>
                <TableCell>Invoice</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.estimate_number}</TableCell>
                  <TableCell>{item.title}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{item.client_name || "-"}</Typography>
                    <Typography variant="body2" color="text.secondary">{item.client_email || ""}</Typography>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.75} alignItems="flex-start">
                      <FinanceStatusChip status={item.status} />
                      {item.public_url ? <Chip size="small" variant="outlined" label="Share link ready" /> : null}
                      {item.public_viewed_at && !item.client_accepted_at && !item.client_rejected_at ? (
                        <Chip size="small" color="info" variant="outlined" label="Viewed by client" />
                      ) : null}
                      {item.client_accepted_at ? <Chip size="small" color="success" variant="outlined" label="Accepted by client" /> : null}
                      {item.client_rejected_at ? <Chip size="small" color="warning" variant="outlined" label="Rejected by client" /> : null}
                      {item.converted_invoice_hosted_invoice_url ? (
                        <Chip size="small" color="secondary" variant="outlined" label="Payment link ready" />
                      ) : null}
                    </Stack>
                  </TableCell>
                  <TableCell>{formatCurrency(item.total, item.currency)}</TableCell>
                  <TableCell>{item.issue_date || "-"}</TableCell>
                  <TableCell>{item.sent_at ? formatDateTimeInTz(item.sent_at, timezone) : "-"}</TableCell>
                  <TableCell>{item.line_count ?? 0}</TableCell>
                  <TableCell>{item.converted_invoice_number || "-"}</TableCell>
                  <TableCell align="right">
                    <Stack direction={{ xs: "column", lg: "row" }} spacing={1} justifyContent="flex-end">
                      <Button size="small" onClick={() => { setEditing(item); setDialogOpen(true); }}>Edit</Button>
                      <Tooltip title="Create a public estimate link, then copy it to email, WhatsApp, or another channel.">
                        <span>
                          <Button
                            size="small"
                            startIcon={<LinkIcon />}
                            onClick={() => handleCopyLink(item)}
                            disabled={linkBusyId === item.id}
                          >
                            Create / Copy Link
                          </Button>
                        </span>
                      </Tooltip>
                      <Tooltip title="Open the public estimate page the client will see.">
                        <span>
                          <Button
                            size="small"
                            startIcon={<LaunchIcon />}
                            onClick={() => handleOpenLink(item)}
                            disabled={linkBusyId === item.id}
                          >
                            Open Link
                          </Button>
                        </span>
                      </Tooltip>
                      <Tooltip title="Send the public estimate link by email using the existing mail system.">
                        <span>
                          <Button
                            size="small"
                            startIcon={<EmailOutlinedIcon />}
                            onClick={() => openSendEmailDialog(item)}
                            disabled={linkBusyId === item.id}
                          >
                            Send Estimate
                          </Button>
                        </span>
                      </Tooltip>
                      <Button size="small" startIcon={<ContentCopyIcon />} onClick={() => handleCopySummary(item)}>Copy Summary</Button>
                      <Tooltip title="Use this after you send the estimate by email, WhatsApp, or another channel.">
                        <span>
                          <Button size="small" onClick={() => handleSend(item)} disabled={item.status === "converted_to_invoice"}>
                            Mark Sent Manually
                          </Button>
                        </span>
                      </Tooltip>
                      <Tooltip title="Manual manager status only. This is not a customer approval link.">
                        <span>
                          <Button
                            size="small"
                            onClick={() => handleManualStatus(item, "approved", "Estimate marked accepted manually.")}
                            disabled={item.status === "converted_to_invoice"}
                          >
                            Mark Accepted
                          </Button>
                        </span>
                      </Tooltip>
                      <Tooltip title="Manual manager status only. This is not a customer rejection workflow.">
                        <span>
                          <Button
                            size="small"
                            color="warning"
                            onClick={() => handleManualStatus(item, "rejected", "Estimate marked rejected manually.")}
                            disabled={item.status === "converted_to_invoice"}
                          >
                            Mark Rejected
                          </Button>
                        </span>
                      </Tooltip>
                      <Button size="small" onClick={() => handleDuplicate(item)}>Duplicate</Button>
                      <Button size="small" variant="contained" onClick={() => handleConvert(item)} disabled={item.status === "converted_to_invoice"}>
                        Convert to Invoice
                      </Button>
                      <Tooltip title="Create or reuse the hosted payment link for the invoice created from this estimate.">
                        <span>
                          <Button
                            size="small"
                            startIcon={<PaymentOutlinedIcon />}
                            onClick={() => handleCopyPaymentLink(item)}
                            disabled={!item.converted_invoice_id || paymentLinkBusyId === item.id}
                          >
                            Create / Copy Payment Link
                          </Button>
                        </span>
                      </Tooltip>
                      <Tooltip title="Open the hosted payment link for this finance invoice.">
                        <span>
                          <Button
                            size="small"
                            onClick={() => handleOpenPaymentLink(item)}
                            disabled={!item.converted_invoice_id || paymentLinkBusyId === item.id}
                          >
                            Open Payment Link
                          </Button>
                        </span>
                      </Tooltip>
                      <Tooltip title="Open a clean print view. You can save it as PDF from the browser print dialog.">
                        <span>
                          <Button
                            size="small"
                            startIcon={<LocalPrintshopOutlinedIcon />}
                            onClick={() => handlePrintEstimate(item)}
                            disabled={linkBusyId === item.id}
                          >
                            Print / PDF
                          </Button>
                        </span>
                      </Tooltip>
                      {(item.client_accepted_at || item.client_rejected_at) ? (
                        <Button size="small" color="warning" onClick={() => handleReopenResponse(item)}>
                          Revise and Resend
                        </Button>
                      ) : null}
                      <Button size="small" onClick={() => handleCreateWorkOrder(item)}>Create Work Order</Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
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
      <Dialog open={emailDialogOpen} onClose={emailSending ? undefined : () => setEmailDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Send Estimate</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              label="Recipient email"
              value={emailTo}
              onChange={(event) => setEmailTo(event.target.value)}
            />
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
