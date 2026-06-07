import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  Grid,
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
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import { formatDateTimeInTz } from "../../utils/datetime";
import { getUserTimezone } from "../../utils/timezone";
import {
  archiveFinanceClient,
  commitFinanceClientImport,
  createFinanceClient,
  downloadFinanceClientImportTemplate,
  getFinanceClient,
  listFinanceImportHistory,
  listFinanceClients,
  previewFinanceClientImport,
  updateFinanceClient,
} from "./financeApi";
import { buildClientCreatePayload, getClientDisplayName } from "./clientUtils";
import ClientQuickCreateDialog from "./ClientQuickCreateDialog";
import FinanceImportDialog from "./FinanceImportDialog";
import FinanceEmptyState from "./components/FinanceEmptyState";
import FinanceMetricCard from "./components/FinanceMetricCard";
import FinancePagination from "./components/FinancePagination";
import FinanceStatusChip from "./components/FinanceStatusChip";

function downloadBlobFromResponse(response, fallbackName) {
  const blob = response?.data;
  if (!(blob instanceof Blob)) return;
  const header = response?.headers?.["content-disposition"] || "";
  const match = /filename=\"?([^\";]+)\"?/i.exec(header);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = match?.[1] || fallbackName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const blankClient = { name: "", email: "", phone: "", notes: "" };

function ClientEditorDialog({ open, onClose, initialValues, onSubmit, saving = false }) {
  const { t } = useTranslation();
  const tClients = (key, fallback, options = {}) =>
    t(`manager.finance.clients.${key}`, { defaultValue: fallback, ...options });
  const [form, setForm] = useState(blankClient);

  useEffect(() => {
    if (!open) return;
    setForm({ ...blankClient, ...initialValues });
  }, [open, initialValues]);

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initialValues?.id ? tClients("editor.titleEdit", "Edit client") : tClients("editor.titleCreate", "Add client")}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.25 }}>
          <TextField
            fullWidth
            label={tClients("editor.fields.name", "Client / business name")}
            placeholder={tClients("editor.placeholders.name", "ABC Property Management")}
            value={form.name}
            onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
          />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={tClients("editor.fields.email", "Email")}
                placeholder={tClients("editor.placeholders.email", "billing@abcproperty.ca")}
                value={form.email}
                onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={tClients("editor.fields.phone", "Phone")}
                placeholder={tClients("editor.placeholders.phone", "(416) 555-0132")}
                value={form.phone}
                onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))}
              />
            </Grid>
          </Grid>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label={tClients("editor.fields.notes", "Internal notes")}
            placeholder={tClients(
              "editor.placeholders.notes",
              "Billing preferences, special contact notes, or service reminders."
            )}
            value={form.notes}
            onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>{tClients("actions.cancel", "Cancel")}</Button>
        <Button variant="contained" onClick={() => onSubmit(form)} disabled={saving}>
          {initialValues?.id ? tClients("actions.saveClient", "Save client") : tClients("actions.createClient", "Create client")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ClientArchiveDialog({ open, client, onClose, onConfirm, saving = false }) {
  const { t } = useTranslation();
  const tClients = (key, fallback, options = {}) =>
    t(`manager.finance.clients.${key}`, { defaultValue: fallback, ...options });
  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{tClients("archive.title", "Archive client")}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          <Typography variant="body2">
            {tClients("archive.body", "Archive {{name}} so it no longer appears in the normal active client pickers.", {
              name: client?.name || tClients("archive.fallbackName", "this client"),
            }).split(String(client?.name || tClients("archive.fallbackName", "this client"))).map((part, index, arr) => (
              <React.Fragment key={`${part}-${index}`}>
                {part}
                {index < arr.length - 1 ? <strong>{client?.name || tClients("archive.fallbackName", "this client")}</strong> : null}
              </React.Fragment>
            ))}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {tClients(
              "archive.helper",
              "Existing quotes, estimates, invoices, work orders, and expenses stay intact. Archive is safer than delete for finance records."
            )}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>{tClients("actions.cancel", "Cancel")}</Button>
        <Button color="warning" variant="contained" onClick={onConfirm} disabled={saving}>
          {tClients("actions.archiveClient", "Archive client")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ClientRestoreDialog({ open, client, onClose, onConfirm, saving = false }) {
  const { t } = useTranslation();
  const tClients = (key, fallback, options = {}) =>
    t(`manager.finance.clients.${key}`, { defaultValue: fallback, ...options });
  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{tClients("restore.title", "Restore client")}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          <Typography variant="body2">
            {tClients("restore.body", "Restore {{name}} to the active client list.", {
              name: client?.name || tClients("restore.fallbackName", "this client"),
            }).split(String(client?.name || tClients("restore.fallbackName", "this client"))).map((part, index, arr) => (
              <React.Fragment key={`${part}-${index}`}>
                {part}
                {index < arr.length - 1 ? <strong>{client?.name || tClients("restore.fallbackName", "this client")}</strong> : null}
              </React.Fragment>
            ))}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {tClients(
              "restore.helper",
              "The client will appear again in Quotes, Estimates, Work Orders, and the active Business Finance client directory."
            )}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>{tClients("actions.cancel", "Cancel")}</Button>
        <Button color="success" variant="contained" onClick={onConfirm} disabled={saving}>
          {tClients("actions.restoreClient", "Restore client")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ClientDetailDialog({ open, clientId, onClose, onEdit, onArchive, onRestore, refreshNonce = 0 }) {
  const { t } = useTranslation();
  const tClients = (key, fallback, options = {}) =>
    t(`manager.finance.clients.${key}`, { defaultValue: fallback, ...options });
  const { enqueueSnackbar } = useSnackbar();
  const timezone = useMemo(() => getUserTimezone(), []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(null);

  const load = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    setError("");
    try {
      const res = await getFinanceClient(clientId);
      setPayload(res);
    } catch (err) {
      const message = err?.response?.data?.error || err?.message || tClients("errors.loadDetailFailed", "Unable to load client details.");
      setError(message);
      enqueueSnackbar(message, { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [clientId, enqueueSnackbar]);

  useEffect(() => {
    if (open) load();
  }, [open, load, refreshNonce]);

  const client = payload?.client || null;
  const recent = payload?.recent_activity || {};
  const counts = client?.linked_counts || {};

  const renderRecentRows = (title, rows, renderLine) => (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
      <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.25 }}>
        {title}
      </Typography>
      {(rows || []).length ? (
        <Stack spacing={1.25}>
          {rows.map((row) => (
            <Stack key={`${title}-${row.id}`} spacing={0.25}>
              {renderLine(row)}
            </Stack>
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">{tClients("detail.noRecentRecords", "No recent records.")}</Typography>
      )}
    </Paper>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{client?.name || tClients("detail.title", "Client details")}</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : client ? (
          <Stack spacing={2.5}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
              <Stack spacing={0.75}>
                <Typography variant="body2" color="text.secondary">
                  {client.email || tClients("detail.noBillingEmail", "No billing email")}{client.phone ? ` • ${client.phone}` : ""}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip
                    size="small"
                    label={client.status === "archived" ? tClients("detail.status.archived", "Archived client") : tClients("detail.status.active", "Active client")}
                    color={client.status === "archived" ? "default" : "success"}
                  />
                  <Chip
                    size="small"
                    label={client.has_card_on_file ? tClients("detail.cardOnFile", "Card on file") : tClients("detail.noCardOnFile", "No card on file")}
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    label={tClients("detail.createdAt", "Created {{value}}", {
                      value: client.created_at ? formatDateTimeInTz(client.created_at, timezone) : "-",
                    })}
                    variant="outlined"
                  />
                </Stack>
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                <Button variant="outlined" onClick={() => onEdit(client)}>{tClients("actions.editClient", "Edit client")}</Button>
                {client.status !== "archived" ? (
                  <Button color="warning" variant="contained" onClick={() => onArchive(client)}>{tClients("actions.archiveClient", "Archive client")}</Button>
                ) : (
                  <Button color="success" variant="contained" onClick={() => onRestore(client)}>{tClients("actions.restoreClient", "Restore client")}</Button>
                )}
              </Stack>
            </Stack>

            {client.notes ? (
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.75 }}>{tClients("detail.internalNotes", "Internal notes")}</Typography>
                <Typography variant="body2" color="text.secondary">{client.notes}</Typography>
              </Paper>
            ) : null}

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FinanceMetricCard
                  label={tClients("detail.metrics.openInvoices.label", "Open invoices")}
                  value={String(counts.open_invoices ?? 0)}
                  helper={tClients("detail.metrics.openInvoices.helper", "Invoices still waiting for payment or follow-up.")}
                  accent="warning"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FinanceMetricCard
                  label={tClients("detail.metrics.openWorkOrders.label", "Open work orders")}
                  value={String(counts.open_work_orders ?? 0)}
                  helper={tClients("detail.metrics.openWorkOrders.helper", "Jobs not yet fully closed or cancelled.")}
                  accent="primary"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FinanceMetricCard
                  label={tClients("detail.metrics.estimates.label", "Estimates")}
                  value={String(counts.estimates ?? 0)}
                  helper={tClients("detail.metrics.estimates.helper", "Pricing records linked to this client.")}
                  accent="success"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FinanceMetricCard
                  label={tClients("detail.metrics.quotes.label", "Quotes")}
                  value={String(counts.quote_requests ?? 0)}
                  helper={tClients("detail.metrics.quotes.helper", "Intake requests captured before pricing.")}
                  accent="info"
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                {renderRecentRows(tClients("detail.sections.recentEstimates", "Recent estimates"), recent.estimates, (row) => (
                  <>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" fontWeight={700}>{row.estimate_number || tClients("detail.fallbacks.estimateNumber", "Estimate #{{id}}", { id: row.id })}</Typography>
                      <FinanceStatusChip status={row.status} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">{row.title}</Typography>
                  </>
                ))}
              </Grid>
              <Grid item xs={12} md={6}>
                {renderRecentRows(tClients("detail.sections.recentInvoices", "Recent invoices"), recent.invoices, (row) => (
                  <>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" fontWeight={700}>{row.invoice_number || tClients("detail.fallbacks.invoiceNumber", "Invoice #{{id}}", { id: row.id })}</Typography>
                      <FinanceStatusChip status={row.status} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">{row.total} {row.currency}</Typography>
                  </>
                ))}
              </Grid>
              <Grid item xs={12} md={6}>
                {renderRecentRows(tClients("detail.sections.recentWorkOrders", "Recent work orders"), recent.work_orders, (row) => (
                  <>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" fontWeight={700}>{row.work_order_number || tClients("detail.fallbacks.workOrderNumber", "WO-{{id}}", { id: row.id })}</Typography>
                      <FinanceStatusChip status={row.status} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">{row.title}</Typography>
                  </>
                ))}
              </Grid>
              <Grid item xs={12} md={6}>
                {renderRecentRows(tClients("detail.sections.recentExpenses", "Recent expenses"), recent.expenses, (row) => (
                  <>
                    <Typography variant="body2" fontWeight={700}>{row.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{row.amount} {row.currency}</Typography>
                  </>
                ))}
              </Grid>
            </Grid>
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{tClients("actions.close", "Close")}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function FinanceClientsPage() {
  const { t } = useTranslation();
  const tClients = (key, fallback, options = {}) =>
    t(`manager.finance.clients.${key}`, { defaultValue: fallback, ...options });
  const { enqueueSnackbar } = useSnackbar();
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", phone: "" });
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [detailRefreshNonce, setDetailRefreshNonce] = useState(0);
  const [importOpen, setImportOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listFinanceClients({
        q: search || undefined,
        status,
        page,
        per_page: perPage,
      });
      setItems(Array.isArray(res?.items) ? res.items : []);
      setSummary(res?.summary || {});
      setPagination(res?.pagination || null);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || tClients("errors.loadFailed", "Unable to load clients."));
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, status]);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = (client) => {
    setSelectedClient({
      id: client.id,
      name: client.name || getClientDisplayName(client),
      email: client.email || "",
      phone: client.phone || "",
      notes: client.notes || "",
    });
    setEditorOpen(true);
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await downloadFinanceClientImportTemplate();
      downloadBlobFromResponse(response, "schedulaa-finance-clients-template.csv");
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tClients("errors.downloadTemplateFailed", "Unable to download template."), { variant: "error" });
    }
  };

  const handleCreate = async () => {
    const payload = buildClientCreatePayload(createForm);
    if (!payload.first_name || !payload.email) {
      enqueueSnackbar(tClients("errors.nameEmailRequired", "Client name and email are required."), { variant: "error" });
      return;
    }
    setSaving(true);
    try {
      await createFinanceClient(payload);
      enqueueSnackbar(tClients("snackbar.created", "Client created."), { variant: "success" });
      setCreateOpen(false);
      setCreateForm({ name: "", email: "", phone: "" });
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tClients("errors.createFailed", "Unable to create client."), { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleEditSave = async (form) => {
    if (!selectedClient?.id) return;
    const payload = {
      ...buildClientCreatePayload(form),
      notes: form.notes || "",
    };
    if (!payload.first_name || !payload.email) {
      enqueueSnackbar(tClients("errors.nameEmailRequired", "Client name and email are required."), { variant: "error" });
      return;
    }
    setSaving(true);
    try {
      await updateFinanceClient(selectedClient.id, payload);
      enqueueSnackbar(tClients("snackbar.updated", "Client updated."), { variant: "success" });
      setEditorOpen(false);
      setSelectedClient(null);
      setDetailRefreshNonce((current) => current + 1);
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tClients("errors.updateFailed", "Unable to update client."), { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!archiveTarget?.id) return;
    setSaving(true);
    try {
      await archiveFinanceClient(archiveTarget.id);
      enqueueSnackbar(tClients("snackbar.archived", "Client archived."), { variant: "success" });
      if (detailId === archiveTarget.id) {
        setDetailRefreshNonce((current) => current + 1);
      }
      setArchiveTarget(null);
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tClients("errors.archiveFailed", "Unable to archive client."), { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreTarget?.id) return;
    setSaving(true);
    try {
      await updateFinanceClient(restoreTarget.id, { status: "active" });
      enqueueSnackbar(tClients("snackbar.restored", "Client restored."), { variant: "success" });
      if (detailId === restoreTarget.id) {
        setDetailRefreshNonce((current) => current + 1);
      }
      setRestoreTarget(null);
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tClients("errors.restoreFailed", "Unable to restore client."), { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <FinanceMetricCard
            label={tClients("metrics.activeClients.label", "Active clients")}
            value={String(summary.active_clients ?? 0)}
            helper={tClients("metrics.activeClients.helper", "Official client records currently available in quote, estimate, and work order flows.")}
            accent="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FinanceMetricCard
            label={tClients("metrics.archivedClients.label", "Archived clients")}
            value={String(summary.archived_clients ?? 0)}
            helper={tClients("metrics.archivedClients.helper", "Inactive client records kept for finance history and lookup.")}
            accent="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FinanceMetricCard
            label={tClients("metrics.clientsWithOpenInvoices.label", "Clients with open invoices")}
            value={String(summary.clients_with_open_invoices ?? 0)}
            helper={tClients("metrics.clientsWithOpenInvoices.helper", "Customers who still have invoice follow-up pending.")}
            accent="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FinanceMetricCard
            label={tClients("metrics.clientsWithOpenWorkOrders.label", "Clients with open work orders")}
            value={String(summary.clients_with_open_work_orders ?? 0)}
            helper={tClients("metrics.clientsWithOpenWorkOrders.helper", "Customers with jobs still active in the operational workflow.")}
            accent="success"
          />
        </Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between">
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField
              size="small"
              label={tClients("filters.searchLabel", "Search clients")}
              placeholder={tClients("filters.searchPlaceholder", "ABC Property Management")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") load();
              }}
              sx={{ minWidth: { md: 300 } }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>{tClients("filters.statusLabel", "Status")}</InputLabel>
              <Select
                value={status}
                label={tClients("filters.statusLabel", "Status")}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="active">{tClients("filters.statusOptions.active", "Active clients")}</MenuItem>
                <MenuItem value="archived">{tClients("filters.statusOptions.archived", "Archived clients")}</MenuItem>
                <MenuItem value="all">{tClients("filters.statusOptions.all", "All clients")}</MenuItem>
              </Select>
            </FormControl>
            <Button variant="outlined" onClick={load}>{tClients("actions.refresh", "Refresh")}</Button>
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
            <Button variant="text" onClick={handleDownloadTemplate}>{tClients("actions.downloadTemplate", "Download template")}</Button>
            <Button variant="outlined" onClick={() => setImportOpen(true)}>{tClients("actions.importClients", "Import clients")}</Button>
            <Button variant="contained" onClick={() => setCreateOpen(true)}>{tClients("actions.addClient", "Add client")}</Button>
          </Stack>
        </Stack>
      </Paper>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : items.length === 0 ? (
        <FinanceEmptyState
          title={tClients("empty.title", "No clients yet")}
          description={tClients("empty.description", "Create the official customer records used across quotes, estimates, invoices, work orders, and expense links.")}
          actionLabel={tClients("actions.addClient", "Add client")}
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <Paper variant="outlined" sx={{ overflowX: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{tClients("table.headers.client", "Client")}</TableCell>
                <TableCell>{tClients("table.headers.contact", "Contact")}</TableCell>
                <TableCell>{tClients("table.headers.lastActivity", "Last activity")}</TableCell>
                <TableCell>{tClients("table.headers.estimates", "Estimates")}</TableCell>
                <TableCell>{tClients("table.headers.openInvoices", "Open invoices")}</TableCell>
                <TableCell>{tClients("table.headers.openWorkOrders", "Open work orders")}</TableCell>
                <TableCell>{tClients("table.headers.status", "Status")}</TableCell>
                <TableCell align="right">{tClients("table.headers.actions", "Actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((client) => (
                <TableRow key={client.id} hover sx={{ cursor: "pointer" }} onClick={() => setDetailId(client.id)}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>{client.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {tClients("table.linkedCounts", "{{quotes}} quote requests • {{invoices}} invoices", {
                        quotes: client.linked_counts?.quote_requests ?? 0,
                        invoices: client.linked_counts?.invoices ?? 0,
                      })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{client.email || "-"}</Typography>
                    <Typography variant="body2" color="text.secondary">{client.phone || ""}</Typography>
                  </TableCell>
                  <TableCell>
                    {client.linked_counts?.last_activity_at
                      ? formatDateTimeInTz(client.linked_counts.last_activity_at, getUserTimezone())
                      : tClients("table.noLinkedActivity", "No linked finance activity yet")}
                  </TableCell>
                  <TableCell>{client.linked_counts?.estimates ?? 0}</TableCell>
                  <TableCell>{client.linked_counts?.open_invoices ?? 0}</TableCell>
                  <TableCell>{client.linked_counts?.open_work_orders ?? 0}</TableCell>
                  <TableCell>{client.status === "archived" ? tClients("table.status.archived", "Archived") : tClients("table.status.active", "Active")}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" onClick={(e) => { e.stopPropagation(); openEdit(client); }}>{tClients("actions.edit", "Edit")}</Button>
                      {client.status !== "archived" ? (
                        <Button size="small" color="warning" onClick={(e) => { e.stopPropagation(); setArchiveTarget(client); }}>
                          {tClients("actions.archive", "Archive")}
                        </Button>
                      ) : (
                        <Button size="small" color="success" onClick={(e) => { e.stopPropagation(); setRestoreTarget(client); }}>
                          {tClients("actions.restore", "Restore")}
                        </Button>
                      )}
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

      <ClientQuickCreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        form={createForm}
        setForm={setCreateForm}
        loading={saving}
        title={tClients("quickCreate.title", "Add client")}
        description={tClients("quickCreate.description", "Create the official customer record used for estimates, invoices, work orders, and Business Finance reporting.")}
        nameLabel={tClients("editor.fields.name", "Client / business name")}
        namePlaceholder={tClients("editor.placeholders.name", "ABC Property Management")}
        emailLabel={tClients("editor.fields.email", "Email")}
        emailPlaceholder={tClients("editor.placeholders.email", "billing@abcproperty.ca")}
        phoneLabel={tClients("editor.fields.phone", "Phone")}
        phonePlaceholder={tClients("editor.placeholders.phone", "(416) 555-0132")}
        cancelLabel={tClients("actions.cancel", "Cancel")}
        submitLabel={tClients("actions.createClient", "Create client")}
      />

      <ClientEditorDialog
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setSelectedClient(null);
        }}
        initialValues={selectedClient}
        onSubmit={handleEditSave}
        saving={saving}
      />

      <ClientArchiveDialog
        open={!!archiveTarget}
        client={archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchive}
        saving={saving}
      />

      <ClientRestoreDialog
        open={!!restoreTarget}
        client={restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onConfirm={handleRestore}
        saving={saving}
      />

      <ClientDetailDialog
        open={!!detailId}
        clientId={detailId}
        onClose={() => setDetailId(null)}
        onEdit={openEdit}
        onArchive={setArchiveTarget}
        onRestore={setRestoreTarget}
        refreshNonce={detailRefreshNonce}
      />

      <FinanceImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title={tClients("import.title", "Import clients")}
        importType="clients"
        entityLabel={tClients("import.entityLabel", "clients")}
        entitySingular={tClients("import.entitySingular", "client")}
        entityPlural={tClients("import.entityPlural", "clients")}
        templateFileName="schedulaa-finance-clients-template.csv"
        csvStructure={`client_name,first_name,last_name,email,phone,notes,status\nAcme Cleaning,,,billing@acme.com,+14165550123,VIP commercial client,active\n,John,Doe,john@example.com,+14165550124,Residential client,active`}
        downloadTemplate={downloadFinanceClientImportTemplate}
        previewImport={previewFinanceClientImport}
        commitImport={commitFinanceClientImport}
        listHistory={listFinanceImportHistory}
        onImported={async () => {
          await load();
          setImportOpen(false);
        }}
      />
    </Stack>
  );
}
