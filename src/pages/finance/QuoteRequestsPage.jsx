import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
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
import { useSnackbar } from "notistack";
import { useTheme } from "@mui/material/styles";
import { formatDateTimeInTz } from "../../utils/datetime";
import { getUserTimezone } from "../../utils/timezone";
import {
  createEstimateFromQuote,
  createQuoteRequest,
  linkQuoteClient,
  listManagerClients,
  listQuoteRequests,
  updateQuoteRequest,
} from "./financeApi";
import FinanceStatusChip from "./components/FinanceStatusChip";
import FinanceEmptyState from "./components/FinanceEmptyState";
import FinancePagination from "./components/FinancePagination";

const blankForm = {
  title: "",
  request_type: "",
  description: "",
  preferred_timeline: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  service_address: "",
  visible_notes: "",
  internal_notes: "",
};

export default function QuoteRequestsPage({ createNonce, onNavigate }) {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const timezone = useMemo(() => getUserTimezone(), []);
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [linkTarget, setLinkTarget] = useState(null);
  const [linkClientId, setLinkClientId] = useState("");
  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "" });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [quotes, managerClients] = await Promise.all([
        listQuoteRequests({
          status: status || undefined,
          q: search || undefined,
          page,
          per_page: perPage,
        }),
        listManagerClients(),
      ]);
      setItems(Array.isArray(quotes?.items) ? quotes.items : Array.isArray(quotes) ? quotes : []);
      setPagination(quotes?.pagination || null);
      setClients(managerClients);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to load quote requests.");
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
      setForm(blankForm);
      setDialogOpen(true);
    }
  }, [createNonce]);

  const openCreate = () => {
    setEditing(null);
    setForm(blankForm);
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      title: item.title || "",
      request_type: item.request_type || "",
      description: item.description || "",
      preferred_timeline: item.preferred_timeline || "",
      contact_name: item.contact_name || "",
      contact_email: item.contact_email || "",
      contact_phone: item.contact_phone || "",
      service_address: item.service_address || "",
      visible_notes: item.visible_notes || "",
      internal_notes: item.internal_notes || "",
    });
    setDialogOpen(true);
  };

  const saveQuote = async () => {
    if (!form.title) {
      enqueueSnackbar("Title is required.", { variant: "error" });
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      if (editing) {
        await updateQuoteRequest(editing.id, payload);
        enqueueSnackbar("Quote request updated.", { variant: "success" });
      } else {
        await createQuoteRequest(payload);
        enqueueSnackbar("Quote request created.", { variant: "success" });
      }
      setDialogOpen(false);
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to save quote request.", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const patchStatus = async (item, nextStatus) => {
    try {
      await updateQuoteRequest(item.id, { status: nextStatus });
      enqueueSnackbar("Quote request updated.", { variant: "success" });
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to update quote request.", { variant: "error" });
    }
  };

  const handleCreateEstimate = async (item) => {
    try {
      const res = await createEstimateFromQuote(item.id);
      enqueueSnackbar(`Estimate created${res?.estimate_number ? `: ${res.estimate_number}` : ""}.`, { variant: "success" });
      await load();
      onNavigate?.("finance-estimates");
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to create estimate.", { variant: "error" });
    }
  };

  const submitLinkClient = async () => {
    if (!linkTarget) return;
    const payload = linkClientId
      ? { client_id: Number(linkClientId) }
      : { create_client: { name: newClient.name, email: newClient.email, phone: newClient.phone } };
    try {
      await linkQuoteClient(linkTarget.id, payload);
      enqueueSnackbar("Client linked to quote request.", { variant: "success" });
      setLinkTarget(null);
      setLinkClientId("");
      setNewClient({ name: "", email: "", phone: "" });
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to link client.", { variant: "error" });
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between">
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <TextField
            size="small"
            label="Search quotes"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") load();
            }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <MenuItem value="">All statuses</MenuItem>
              <MenuItem value="new">New</MenuItem>
              <MenuItem value="reviewed">Reviewed</MenuItem>
              <MenuItem value="estimate_created">Estimate Created</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" onClick={load}>Refresh</Button>
        </Stack>
        <Button variant="contained" onClick={openCreate}>New Quote</Button>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
      ) : items.length === 0 ? (
        <FinanceEmptyState
          title="No quote requests yet"
          description="Create a quote request here or normalize public quote forms later."
          actionLabel="Create quote"
          onAction={openCreate}
        />
      ) : (
        <Paper variant="outlined" sx={{ overflowX: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Timeline</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Typography fontWeight={700}>{item.title}</Typography>
                    {item.request_type ? <Typography variant="body2" color="text.secondary">{item.request_type}</Typography> : null}
                  </TableCell>
                  <TableCell><FinanceStatusChip status={item.status} /></TableCell>
                  <TableCell>
                    <Typography variant="body2">{item.contact_name || "-"}</Typography>
                    <Typography variant="body2" color="text.secondary">{item.contact_email || item.contact_phone || "-"}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{item.client_name || "Not linked"}</Typography>
                    <Typography variant="body2" color="text.secondary">{item.client_email || ""}</Typography>
                  </TableCell>
                  <TableCell>{item.preferred_timeline || "-"}</TableCell>
                  <TableCell>{item.created_at ? formatDateTimeInTz(item.created_at, timezone) : "-"}</TableCell>
                  <TableCell sx={{ maxWidth: 260 }}>
                    <Typography variant="body2" color="text.secondary">{item.description || "-"}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction={{ xs: "column", lg: "row" }} spacing={1} justifyContent="flex-end">
                      <Button size="small" onClick={() => openEdit(item)}>Edit</Button>
                      <Button size="small" onClick={() => patchStatus(item, "reviewed")}>Mark Reviewed</Button>
                      <Button size="small" onClick={() => setLinkTarget(item)}>Link Client</Button>
                      <Button size="small" variant="contained" onClick={() => handleCreateEstimate(item)}>Create Estimate</Button>
                      <Button size="small" color="warning" onClick={() => patchStatus(item, "closed")}>Close</Button>
                      <Button size="small" color="error" onClick={() => patchStatus(item, "rejected")}>Reject</Button>
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

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{editing ? "Edit quote request" : "New quote request"}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}><TextField fullWidth label="Title" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Request type" value={form.request_type} onChange={(e) => setForm((prev) => ({ ...prev, request_type: e.target.value }))} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Contact name" value={form.contact_name} onChange={(e) => setForm((prev) => ({ ...prev, contact_name: e.target.value }))} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Contact email" value={form.contact_email} onChange={(e) => setForm((prev) => ({ ...prev, contact_email: e.target.value }))} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Contact phone" value={form.contact_phone} onChange={(e) => setForm((prev) => ({ ...prev, contact_phone: e.target.value }))} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Preferred timeline" value={form.preferred_timeline} onChange={(e) => setForm((prev) => ({ ...prev, preferred_timeline: e.target.value }))} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Service address" value={form.service_address} onChange={(e) => setForm((prev) => ({ ...prev, service_address: e.target.value }))} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Description" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} multiline minRows={3} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Visible notes" value={form.visible_notes} onChange={(e) => setForm((prev) => ({ ...prev, visible_notes: e.target.value }))} multiline minRows={2} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Internal notes" value={form.internal_notes} onChange={(e) => setForm((prev) => ({ ...prev, internal_notes: e.target.value }))} multiline minRows={2} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={saveQuote} disabled={saving}>{saving ? "Saving..." : editing ? "Save changes" : "Create quote"}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(linkTarget)} onClose={() => setLinkTarget(null)} fullWidth maxWidth="sm">
        <DialogTitle>Link client</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <Alert severity="info">Link an existing client or create a simple client record for this quote request.</Alert>
            <FormControl fullWidth>
              <InputLabel>Existing client</InputLabel>
              <Select label="Existing client" value={linkClientId} onChange={(e) => setLinkClientId(e.target.value)}>
                <MenuItem value="">Create new client instead</MenuItem>
                {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.first_name || client.last_name
                      ? `${client.first_name || ""} ${client.last_name || ""}`.trim()
                      : client.email || `Client #${client.id}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {!linkClientId ? (
              <Grid container spacing={2}>
                <Grid item xs={12}><TextField fullWidth label="Client name" value={newClient.name} onChange={(e) => setNewClient((prev) => ({ ...prev, name: e.target.value }))} /></Grid>
                <Grid item xs={12}><TextField fullWidth label="Client email" value={newClient.email} onChange={(e) => setNewClient((prev) => ({ ...prev, email: e.target.value }))} /></Grid>
                <Grid item xs={12}><TextField fullWidth label="Client phone" value={newClient.phone} onChange={(e) => setNewClient((prev) => ({ ...prev, phone: e.target.value }))} /></Grid>
              </Grid>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkTarget(null)}>Cancel</Button>
          <Button variant="contained" onClick={submitLinkClient}>Link client</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
