import React, { useEffect, useMemo, useState } from "react";
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
  Tooltip,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useTheme } from "@mui/material/styles";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
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

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const formatSourceLabel = (requestType, sourceType) => {
  const raw = normalizeText(requestType || sourceType);
  if (!raw) return "Manual entry";
  if (raw === "whatsapp") return "WhatsApp note";
  if (raw === "phone") return "Phone call";
  if (raw === "instagram") return "Instagram/DM";
  if (raw === "manual") return "Manual entry";
  if (raw === "website" || raw === "website form" || raw === "website_form") return "Website form";
  return String(requestType || sourceType || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const hasEmailMismatch = (item) =>
  normalizeText(item?.contact_email) && normalizeText(item?.client_email) &&
  normalizeText(item.contact_email) !== normalizeText(item.client_email);

const hasNameMismatch = (item) => {
  const contact = normalizeText(item?.contact_name);
  const client = normalizeText(item?.client_name);
  if (!contact || !client) return false;
  if (contact === client) return false;
  return !contact.includes(client) && !client.includes(contact);
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
  const [confirmEstimateTarget, setConfirmEstimateTarget] = useState(null);

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

  const prefillClientFromContact = (item) => ({
    name: item?.contact_name || "",
    email: item?.contact_email || "",
    phone: item?.contact_phone || "",
  });

  const openLinkClientDialog = (item, preferCreate = false) => {
    setLinkTarget(item);
    setLinkClientId(preferCreate ? "" : item?.client_id ? String(item.client_id) : "");
    setNewClient(prefillClientFromContact(item));
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

  const createEstimateForQuote = async (item) => {
    try {
      const res = await createEstimateFromQuote(item.id);
      const estimate = res?.estimate || {};
      const clientName = item?.client_name || estimate?.client_name || "the linked client";
      enqueueSnackbar(`Estimate created for ${clientName}.`, { variant: "success" });
      await load();
      onNavigate?.("finance-estimates");
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to create estimate.", { variant: "error" });
    }
  };

  const handleCreateEstimate = async (item) => {
    if (!item?.client_id) {
      enqueueSnackbar("Link or create a client before creating an estimate.", { variant: "warning" });
      openLinkClientDialog(item, true);
      return;
    }
    if (hasEmailMismatch(item) || hasNameMismatch(item)) {
      setConfirmEstimateTarget(item);
      return;
    }
    await createEstimateForQuote(item);
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
                <TableCell>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Typography variant="inherit">Source</Typography>
                    <Tooltip title="This is a source label unless automation is connected.">
                      <InfoOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                    </Tooltip>
                  </Stack>
                </TableCell>
                <TableCell>Request Contact</TableCell>
                <TableCell>Linked Client</TableCell>
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
                    <Typography variant="body2">{formatSourceLabel(item.request_type, item.source_type)}</Typography>
                    {item.source_ref ? <Typography variant="body2" color="text.secondary">{item.source_ref}</Typography> : null}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{item.contact_name || "-"}</Typography>
                    <Typography variant="body2" color="text.secondary">{item.contact_email || "-"}</Typography>
                    <Typography variant="body2" color="text.secondary">{item.contact_phone || "-"}</Typography>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.75}>
                      <Box>
                        <Typography variant="body2">{item.client_name || "Not linked"}</Typography>
                        <Typography variant="body2" color="text.secondary">{item.client_email || ""}</Typography>
                      </Box>
                      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                        <Chip
                          size="small"
                          variant="outlined"
                          color={item.client_id ? "success" : "default"}
                          label={item.client_id ? "Linked" : "Not linked"}
                        />
                        {hasEmailMismatch(item) ? (
                          <Chip size="small" variant="outlined" color="warning" label="Contact differs from client" />
                        ) : null}
                        {hasNameMismatch(item) ? (
                          <Chip size="small" variant="outlined" color="warning" label="Check client match" />
                        ) : null}
                      </Stack>
                    </Stack>
                  </TableCell>
                  <TableCell>{item.preferred_timeline || "-"}</TableCell>
                  <TableCell>{item.created_at ? formatDateTimeInTz(item.created_at, timezone) : "-"}</TableCell>
                  <TableCell sx={{ maxWidth: 260 }}>
                    <Typography variant="body2" color="text.secondary">{item.description || "-"}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="flex-end"
                      flexWrap="wrap"
                      useFlexGap
                    >
                      <Button size="small" onClick={() => openEdit(item)}>Edit</Button>
                      <Button size="small" onClick={() => patchStatus(item, "reviewed")}>Mark Reviewed</Button>
                      <Button size="small" onClick={() => openLinkClientDialog(item, !item.client_id)}>Link or Create Client</Button>
                      {item.status === "estimate_created" ? (
                        <Button size="small" variant="outlined" onClick={() => onNavigate?.("finance-estimates")}>
                          Open Estimates
                        </Button>
                      ) : (
                        <Button size="small" variant="contained" onClick={() => handleCreateEstimate(item)} disabled={!item.client_id}>
                          Create Estimate
                        </Button>
                      )}
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
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>Request details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}><TextField fullWidth label="Title" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} /></Grid>
                <Grid item xs={12} md={6}><TextField fullWidth label="Source" value={form.request_type} onChange={(e) => setForm((prev) => ({ ...prev, request_type: e.target.value }))} helperText="Examples: Phone call, WhatsApp note, Website form." /></Grid>
                <Grid item xs={12} md={6}><TextField fullWidth label="Preferred timeline" value={form.preferred_timeline} onChange={(e) => setForm((prev) => ({ ...prev, preferred_timeline: e.target.value }))} /></Grid>
                <Grid item xs={12} md={6}><TextField fullWidth label="Service address" value={form.service_address} onChange={(e) => setForm((prev) => ({ ...prev, service_address: e.target.value }))} /></Grid>
                <Grid item xs={12}><TextField fullWidth label="Description" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} multiline minRows={3} /></Grid>
              </Grid>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>Request contact</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}><TextField fullWidth label="Contact name" value={form.contact_name} onChange={(e) => setForm((prev) => ({ ...prev, contact_name: e.target.value }))} /></Grid>
                <Grid item xs={12} md={4}><TextField fullWidth label="Contact email" value={form.contact_email} onChange={(e) => setForm((prev) => ({ ...prev, contact_email: e.target.value }))} /></Grid>
                <Grid item xs={12} md={4}><TextField fullWidth label="Contact phone" value={form.contact_phone} onChange={(e) => setForm((prev) => ({ ...prev, contact_phone: e.target.value }))} /></Grid>
              </Grid>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>Linked client</Typography>
              <Typography variant="caption" color="text.secondary">
                Contact is who requested the quote. Client is the official customer record used for estimates, invoices, and work orders.
              </Typography>
              <Paper variant="outlined" sx={{ mt: 1.25, p: 1.5, borderColor: theme.palette.divider }}>
                {editing?.client_id ? (
                  <Stack spacing={1}>
                    <Typography variant="body2" fontWeight={700}>{editing.client_name || "Linked client"}</Typography>
                    <Typography variant="body2" color="text.secondary">{editing.client_email || "-"}</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip size="small" variant="outlined" color="success" label="Linked" />
                      {hasEmailMismatch(editing) ? <Chip size="small" variant="outlined" color="warning" label="Contact differs from client" /> : null}
                      {hasNameMismatch(editing) ? <Chip size="small" variant="outlined" color="warning" label="Check client match" /> : null}
                    </Stack>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {editing ? "No client linked yet." : "Save the quote first, then link or create the client."}
                  </Typography>
                )}
              </Paper>
              {editing ? (
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1.25 }}>
                  <Button variant="outlined" onClick={() => openLinkClientDialog(editing, false)}>Link existing client</Button>
                  <Button variant="outlined" onClick={() => openLinkClientDialog(editing, true)}>Create client from contact</Button>
                </Stack>
              ) : null}
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>Notes</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}><TextField fullWidth label="Visible notes" value={form.visible_notes} onChange={(e) => setForm((prev) => ({ ...prev, visible_notes: e.target.value }))} multiline minRows={2} /></Grid>
                <Grid item xs={12}><TextField fullWidth label="Internal notes" value={form.internal_notes} onChange={(e) => setForm((prev) => ({ ...prev, internal_notes: e.target.value }))} multiline minRows={2} /></Grid>
              </Grid>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={saveQuote} disabled={saving}>{saving ? "Saving..." : editing ? "Save changes" : "Create quote"}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(linkTarget)} onClose={() => setLinkTarget(null)} fullWidth maxWidth="sm">
        <DialogTitle>Link or Create Client</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <Alert severity="info">Link an existing client or create a client from the request contact.</Alert>
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

      <Dialog open={Boolean(confirmEstimateTarget)} onClose={() => setConfirmEstimateTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm client for estimate</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5}>
            <Typography variant="body2">
              The request contact is different from the linked client. Continue using this client for the estimate?
            </Typography>
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="caption" color="text.secondary">Request contact</Typography>
              <Typography variant="body2">{confirmEstimateTarget?.contact_name || "-"}</Typography>
              <Typography variant="body2" color="text.secondary">{confirmEstimateTarget?.contact_email || confirmEstimateTarget?.contact_phone || "-"}</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="caption" color="text.secondary">Linked client</Typography>
              <Typography variant="body2">{confirmEstimateTarget?.client_name || "-"}</Typography>
              <Typography variant="body2" color="text.secondary">{confirmEstimateTarget?.client_email || "-"}</Typography>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmEstimateTarget(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              const target = confirmEstimateTarget;
              setConfirmEstimateTarget(null);
              if (target) await createEstimateForQuote(target);
            }}
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
