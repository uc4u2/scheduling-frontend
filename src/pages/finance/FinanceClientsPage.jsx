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
  createFinanceClient,
  getFinanceClient,
  listFinanceClients,
  updateFinanceClient,
} from "./financeApi";
import { buildClientCreatePayload, getClientDisplayName } from "./clientUtils";
import ClientQuickCreateDialog from "./ClientQuickCreateDialog";
import FinanceEmptyState from "./components/FinanceEmptyState";
import FinanceMetricCard from "./components/FinanceMetricCard";
import FinancePagination from "./components/FinancePagination";
import FinanceStatusChip from "./components/FinanceStatusChip";

const blankClient = { name: "", email: "", phone: "", notes: "" };

function ClientEditorDialog({ open, onClose, initialValues, onSubmit, saving = false }) {
  const [form, setForm] = useState(blankClient);

  useEffect(() => {
    if (!open) return;
    setForm({ ...blankClient, ...initialValues });
  }, [open, initialValues]);

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initialValues?.id ? "Edit client" : "Add client"}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.25 }}>
          <TextField
            fullWidth
            label="Client / business name"
            placeholder="ABC Property Management"
            value={form.name}
            onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
          />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                placeholder="billing@abcproperty.ca"
                value={form.email}
                onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                placeholder="(416) 555-0132"
                value={form.phone}
                onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))}
              />
            </Grid>
          </Grid>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Internal notes"
            placeholder="Billing preferences, special contact notes, or service reminders."
            value={form.notes}
            onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={() => onSubmit(form)} disabled={saving}>
          {initialValues?.id ? "Save client" : "Create client"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ClientArchiveDialog({ open, client, onClose, onConfirm, saving = false }) {
  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Archive client</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          <Typography variant="body2">
            Archive <strong>{client?.name || "this client"}</strong> so it no longer appears in the normal active client pickers.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Existing quotes, estimates, invoices, work orders, and expenses stay intact. Archive is safer than delete for finance records.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button color="warning" variant="contained" onClick={onConfirm} disabled={saving}>
          Archive client
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ClientRestoreDialog({ open, client, onClose, onConfirm, saving = false }) {
  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Restore client</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          <Typography variant="body2">
            Restore <strong>{client?.name || "this client"}</strong> to the active client list.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The client will appear again in Quotes, Estimates, Work Orders, and the active Business Finance client directory.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button color="success" variant="contained" onClick={onConfirm} disabled={saving}>
          Restore client
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ClientDetailDialog({ open, clientId, onClose, onEdit, onArchive, onRestore, refreshNonce = 0 }) {
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
      const message = err?.response?.data?.error || err?.message || "Unable to load client details.";
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
        <Typography variant="body2" color="text.secondary">No recent records.</Typography>
      )}
    </Paper>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{client?.name || "Client details"}</DialogTitle>
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
                  {client.email || "No billing email"}{client.phone ? ` • ${client.phone}` : ""}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip size="small" label={client.status === "archived" ? "Archived client" : "Active client"} color={client.status === "archived" ? "default" : "success"} />
                  <Chip size="small" label={client.has_card_on_file ? "Card on file" : "No card on file"} variant="outlined" />
                  <Chip size="small" label={`Created ${client.created_at ? formatDateTimeInTz(client.created_at, timezone) : "-"}`} variant="outlined" />
                </Stack>
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                <Button variant="outlined" onClick={() => onEdit(client)}>Edit client</Button>
                {client.status !== "archived" ? (
                  <Button color="warning" variant="contained" onClick={() => onArchive(client)}>Archive client</Button>
                ) : (
                  <Button color="success" variant="contained" onClick={() => onRestore(client)}>Restore client</Button>
                )}
              </Stack>
            </Stack>

            {client.notes ? (
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.75 }}>Internal notes</Typography>
                <Typography variant="body2" color="text.secondary">{client.notes}</Typography>
              </Paper>
            ) : null}

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FinanceMetricCard label="Open invoices" value={String(counts.open_invoices ?? 0)} helper="Invoices still waiting for payment or follow-up." accent="warning" />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FinanceMetricCard label="Open work orders" value={String(counts.open_work_orders ?? 0)} helper="Jobs not yet fully closed or cancelled." accent="primary" />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FinanceMetricCard label="Estimates" value={String(counts.estimates ?? 0)} helper="Pricing records linked to this client." accent="success" />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FinanceMetricCard label="Quotes" value={String(counts.quote_requests ?? 0)} helper="Intake requests captured before pricing." accent="info" />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                {renderRecentRows("Recent estimates", recent.estimates, (row) => (
                  <>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" fontWeight={700}>{row.estimate_number || `Estimate #${row.id}`}</Typography>
                      <FinanceStatusChip status={row.status} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">{row.title}</Typography>
                  </>
                ))}
              </Grid>
              <Grid item xs={12} md={6}>
                {renderRecentRows("Recent invoices", recent.invoices, (row) => (
                  <>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" fontWeight={700}>{row.invoice_number || `Invoice #${row.id}`}</Typography>
                      <FinanceStatusChip status={row.status} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">{row.total} {row.currency}</Typography>
                  </>
                ))}
              </Grid>
              <Grid item xs={12} md={6}>
                {renderRecentRows("Recent work orders", recent.work_orders, (row) => (
                  <>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" fontWeight={700}>{row.work_order_number || `WO-${row.id}`}</Typography>
                      <FinanceStatusChip status={row.status} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">{row.title}</Typography>
                  </>
                ))}
              </Grid>
              <Grid item xs={12} md={6}>
                {renderRecentRows("Recent expenses", recent.expenses, (row) => (
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
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function FinanceClientsPage() {
  const { t } = useTranslation();
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
      setError(err?.response?.data?.error || err?.message || "Unable to load clients.");
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

  const handleCreate = async () => {
    const payload = buildClientCreatePayload(createForm);
    if (!payload.first_name || !payload.email) {
      enqueueSnackbar("Client name and email are required.", { variant: "error" });
      return;
    }
    setSaving(true);
    try {
      await createFinanceClient(payload);
      enqueueSnackbar("Client created.", { variant: "success" });
      setCreateOpen(false);
      setCreateForm({ name: "", email: "", phone: "" });
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to create client.", { variant: "error" });
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
      enqueueSnackbar("Client name and email are required.", { variant: "error" });
      return;
    }
    setSaving(true);
    try {
      await updateFinanceClient(selectedClient.id, payload);
      enqueueSnackbar("Client updated.", { variant: "success" });
      setEditorOpen(false);
      setSelectedClient(null);
      setDetailRefreshNonce((current) => current + 1);
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to update client.", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!archiveTarget?.id) return;
    setSaving(true);
    try {
      await archiveFinanceClient(archiveTarget.id);
      enqueueSnackbar("Client archived.", { variant: "success" });
      if (detailId === archiveTarget.id) {
        setDetailRefreshNonce((current) => current + 1);
      }
      setArchiveTarget(null);
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to archive client.", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreTarget?.id) return;
    setSaving(true);
    try {
      await updateFinanceClient(restoreTarget.id, { status: "active" });
      enqueueSnackbar("Client restored.", { variant: "success" });
      if (detailId === restoreTarget.id) {
        setDetailRefreshNonce((current) => current + 1);
      }
      setRestoreTarget(null);
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to restore client.", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <FinanceMetricCard label="Active clients" value={String(summary.active_clients ?? 0)} helper="Official client records currently available in quote, estimate, and work order flows." accent="primary" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FinanceMetricCard label="Archived clients" value={String(summary.archived_clients ?? 0)} helper="Inactive client records kept for finance history and lookup." accent="warning" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FinanceMetricCard label="Clients with open invoices" value={String(summary.clients_with_open_invoices ?? 0)} helper="Customers who still have invoice follow-up pending." accent="error" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FinanceMetricCard label="Clients with open work orders" value={String(summary.clients_with_open_work_orders ?? 0)} helper="Customers with jobs still active in the operational workflow." accent="success" />
        </Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between">
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField
              size="small"
              label="Search clients"
              placeholder="ABC Property Management"
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
              <InputLabel>Status</InputLabel>
              <Select
                value={status}
                label="Status"
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="active">Active clients</MenuItem>
                <MenuItem value="archived">Archived clients</MenuItem>
                <MenuItem value="all">All clients</MenuItem>
              </Select>
            </FormControl>
            <Button variant="outlined" onClick={load}>Refresh</Button>
          </Stack>
          <Button variant="contained" onClick={() => setCreateOpen(true)}>Add client</Button>
        </Stack>
      </Paper>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : items.length === 0 ? (
        <FinanceEmptyState
          title="No clients yet"
          description="Create the official customer records used across quotes, estimates, invoices, work orders, and expense links."
          actionLabel="Add client"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <Paper variant="outlined" sx={{ overflowX: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Client</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Last activity</TableCell>
                <TableCell>Estimates</TableCell>
                <TableCell>Open invoices</TableCell>
                <TableCell>Open work orders</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((client) => (
                <TableRow key={client.id} hover sx={{ cursor: "pointer" }} onClick={() => setDetailId(client.id)}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>{client.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {client.linked_counts?.quote_requests ?? 0} quote requests • {client.linked_counts?.invoices ?? 0} invoices
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{client.email || "-"}</Typography>
                    <Typography variant="body2" color="text.secondary">{client.phone || ""}</Typography>
                  </TableCell>
                  <TableCell>
                    {client.linked_counts?.last_activity_at ? formatDateTimeInTz(client.linked_counts.last_activity_at, getUserTimezone()) : "No linked finance activity yet"}
                  </TableCell>
                  <TableCell>{client.linked_counts?.estimates ?? 0}</TableCell>
                  <TableCell>{client.linked_counts?.open_invoices ?? 0}</TableCell>
                  <TableCell>{client.linked_counts?.open_work_orders ?? 0}</TableCell>
                  <TableCell>{client.status === "archived" ? "Archived" : "Active"}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" onClick={(e) => { e.stopPropagation(); openEdit(client); }}>Edit</Button>
                      {client.status !== "archived" ? (
                        <Button size="small" color="warning" onClick={(e) => { e.stopPropagation(); setArchiveTarget(client); }}>
                          Archive
                        </Button>
                      ) : (
                        <Button size="small" color="success" onClick={(e) => { e.stopPropagation(); setRestoreTarget(client); }}>
                          Restore
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
        title="Add client"
        description="Create the official customer record used for estimates, invoices, work orders, and Business Finance reporting."
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
    </Stack>
  );
}
