/* eslint-disable react-hooks/exhaustive-deps */
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
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RefreshIcon from "@mui/icons-material/Refresh";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { api } from "../../../utils/api";
import { formatCurrency } from "../../../utils/formatters";
import { DateTime } from "luxon";

const fmtISO = (isoLike) => {
  if (!isoLike) return "";
  try {
    return DateTime.fromISO(isoLike).toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS);
  } catch {
    return isoLike;
  }
};

const statusChipColor = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "paid") return "success";
  if (["refunded", "partial_refund", "void"].includes(s)) return "info";
  if (["failed", "canceled"].includes(s)) return "error";
  return "warning";
};

export default function ManagerManualPayments() {
  const [mode, setMode] = useState("existing"); // existing | new
  const [clients, setClients] = useState([]);
  const [clientsLoaded, setClientsLoaded] = useState(false);
  const [clientsError, setClientsError] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientName, setClientName] = useState("");

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("CAD");
  const [reason, setReason] = useState("deposit");
  const [description, setDescription] = useState("");
  const [appointmentId, setAppointmentId] = useState("");

  const [creating, setCreating] = useState(false);
  const [createdLink, setCreatedLink] = useState("");
  const [createdInvoiceId, setCreatedInvoiceId] = useState(null);

  const [items, setItems] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [refundOpen, setRefundOpen] = useState(false);
  const [refundTarget, setRefundTarget] = useState(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refunding, setRefunding] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, severity: "info", message: "" });

  const openSnackbar = (message, severity = "info") =>
    setSnackbar({ open: true, severity, message });
  const closeSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  // Clients (best effort)
  const loadClients = useCallback(async () => {
    setClientsLoaded(false);
    setClientsError("");
    try {
      const res = await api.get("/api/manager/clients");
      const raw = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.items)
        ? res.data.items
        : [];
      setClients(raw);
    } catch (e) {
      setClients([]);
      setClientsError("Client list unavailable; use email instead.");
    } finally {
      setClientsLoaded(true);
    }
  }, []);

  // Invoices list
  const loadManualPayments = useCallback(async () => {
    setListLoading(true);
    setListError("");
    try {
      const res = await api.get("/api/manager/manual-payments", { params: { limit: 100 } });
      const raw =
        Array.isArray(res.data) || Array.isArray(res.data?.items)
          ? res.data.items || res.data
          : res.data?.items || [];
      const normalized = (raw || []).map((inv) => ({
        ...inv,
        amount: Number(inv.amount || inv.amount_cents / 100 || 0),
        currency: inv.currency || "CAD",
      }));
      setItems(normalized);
    } catch (e) {
      setItems([]);
      setListError(e?.response?.data?.error || "Failed to load manual payments.");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadManualPayments();
    loadClients();
  }, []);

  const handleCreate = async () => {
    if (!amount || Number(amount) <= 0) {
      openSnackbar("Enter a valid amount.", "error");
      return;
    }
    const val = Number(amount);
    if (!Number.isFinite(val)) {
      openSnackbar("Amount must be a number.", "error");
      return;
    }
    const amount_cents = Math.round(val * 100);
    const payload = {
      amount_cents,
      currency,
      reason,
      description: description || undefined,
      appointment_id: appointmentId || undefined,
    };
    if (mode === "existing" && selectedClientId) {
      payload.client_id = Number(selectedClientId);
    } else {
      if (!clientEmail) {
        openSnackbar("Client email is required for new clients.", "error");
        return;
      }
      payload.client_email = clientEmail;
      if (clientName) payload.client_name = clientName;
    }

    setCreating(true);
    setCreatedLink("");
    setCreatedInvoiceId(null);
    try {
      const res = await api.post("/api/manager/manual-payments", payload);
      const body = res.data || {};
      const invoice = body.invoice || body;
      const link = body.checkout_url || body.payment_url || invoice.hosted_invoice_url || "";
      if (invoice?.id) setCreatedInvoiceId(invoice.id);
      if (link) setCreatedLink(link);
      openSnackbar("Manual invoice created. Copy the link to send it.", "success");
      await loadManualPayments();
    } catch (e) {
      const msg = e?.response?.data?.error || "Failed to create manual payment.";
      openSnackbar(msg, "error");
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = (value) => {
    if (!value) return;
    try {
      navigator.clipboard.writeText(value);
      openSnackbar("Link copied to clipboard.", "success");
    } catch {
      openSnackbar("Could not copy to clipboard.", "error");
    }
  };

  // Refunds
  const openRefundDialog = (row) => {
    setRefundTarget(row);
    setRefundAmount("");
    setRefundOpen(true);
  };

  const submitRefund = async () => {
    if (!refundTarget) return;
    setRefunding(true);
    try {
      const payload = {};
      const valNum = Number(refundAmount || 0);
      if (valNum > 0) payload.amount_cents = Math.round(valNum * 100);
      const res = await api.post(`/api/manager/manual-payments/${refundTarget.id}/refund`, payload);
      openSnackbar(res?.data?.message || "Refund processed.", "success");
      setRefundOpen(false);
      setRefundTarget(null);
      setRefundAmount("");
      await loadManualPayments();
    } catch (e) {
      const msg = e?.response?.data?.error || "Refund failed.";
      openSnackbar(msg, "error");
    } finally {
      setRefunding(false);
    }
  };

  const statusCounts = useMemo(() => {
    const counts = { paid: 0, pending: 0, refunded: 0 };
    items.forEach((i) => {
      const s = (i.status || "").toLowerCase();
      if (s === "paid") counts.paid += 1;
      else if (["refunded", "partial_refund", "void"].includes(s)) counts.refunded += 1;
      else counts.pending += 1;
    });
    return counts;
  }, [items]);

  return (
    <>
      <Toolbar />
      <Box p={3} maxWidth={1200} mx="auto">
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Typography variant="h5" fontWeight={600}>
            Manual Payments / Invoices
          </Typography>
          <Stack direction="row" spacing={1}>
            <IconButton size="small" onClick={loadManualPayments} disabled={listLoading}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
          <Chip label={`Paid: ${statusCounts.paid}`} color="success" variant="outlined" />
          <Chip
            label={`Pending/Open: ${statusCounts.pending}`}
            color="warning"
            variant="outlined"
          />
          <Chip
            label={`Refunded/Void: ${statusCounts.refunded}`}
            color="info"
            variant="outlined"
          />
        </Stack>

        <Box
          sx={{
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
            p: 3,
            mb: 3,
            backgroundColor: (t) => t.palette.background.paper,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>
              Create new manual invoice
            </Typography>
            <Tooltip title="Send a hosted Stripe invoice for deposits, balances, or no-show fees.">
              <InfoOutlinedIcon fontSize="small" color="action" />
            </Tooltip>
          </Stack>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="manual-client-mode-label">Client type</InputLabel>
                <Select
                  labelId="manual-client-mode-label"
                  value={mode}
                  label="Client type"
                  onChange={(e) => setMode(e.target.value)}
                >
                  <MenuItem value="existing">Existing client</MenuItem>
                  <MenuItem value="new">New client (email only)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {mode === "existing" ? (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="manual-client-select-label">Client</InputLabel>
                  <Select
                    labelId="manual-client-select-label"
                    value={selectedClientId}
                    label="Client"
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    disabled={!clientsLoaded || !!clientsError}
                  >
                    {clients.map((c) => {
                      const fullName =
                        (c.first_name && c.last_name
                          ? `${c.first_name} ${c.last_name}`
                          : c.full_name || c.name || "").trim();
                      const label = fullName || c.email || `Client #${c.id}`;
                      return (
                        <MenuItem key={c.id} value={c.id}>
                          {label}
                          {c.email ? ` (${c.email})` : ""}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
                {clientsError && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                    {clientsError}
                  </Typography>
                )}
              </Grid>
            ) : (
              <>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Client email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Client name (optional)"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    fullWidth
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12} md={4}>
              <TextField
                label="Amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">{currency}</InputAdornment>,
                }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Currency</InputLabel>
                <Select value={currency} label="Currency" onChange={(e) => setCurrency(e.target.value)}>
                  <MenuItem value="CAD">CAD</MenuItem>
                  <MenuItem value="USD">USD</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Reason</InputLabel>
                <Select value={reason} label="Reason" onChange={(e) => setReason(e.target.value)}>
                  <MenuItem value="deposit">Deposit</MenuItem>
                  <MenuItem value="balance">Remaining balance</MenuItem>
                  <MenuItem value="no_show">No-show / cancellation fee</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Attach to booking (optional #id)"
                value={appointmentId}
                onChange={(e) => setAppointmentId(e.target.value)}
                helperText="If set, ties invoice to that appointment."
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description (on invoice/receipt)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                minRows={2}
                fullWidth
              />
            </Grid>
          </Grid>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", sm: "center" }}
            sx={{ mt: 3 }}
          >
            <Button variant="contained" size="medium" onClick={handleCreate} disabled={creating}>
              {creating ? <CircularProgress size={20} color="inherit" /> : "Create & Get Payment Link"}
            </Button>

            {createdLink && (
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ xs: "flex-start", sm: "center" }}
                sx={{ flexGrow: 1 }}
              >
                <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: { xs: "100%", sm: 420 } }}>
                  {createdLink}
                </Typography>
                <IconButton size="small" onClick={() => handleCopy(createdLink)}>
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
                {createdInvoiceId && <Chip size="small" label={`Invoice #${createdInvoiceId}`} variant="outlined" />}
              </Stack>
            )}
          </Stack>
        </Box>

        <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Recent manual invoices
            </Typography>
            <Tooltip title="Reload">
              <IconButton size="small" onClick={loadManualPayments} disabled={listLoading}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>

          {listError && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {listError}
            </Alert>
          )}

          {listLoading ? (
            <Box p={2}>
              <CircularProgress size={24} />
            </Box>
          ) : items.length === 0 ? (
            <Alert severity="info">No manual invoices yet.</Alert>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Booking</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Link</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {row.client_name || row.client?.full_name || row.client?.name || "—"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.client_email || row.client?.email || ""}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatCurrency(Number(row.amount || 0), row.currency || "CAD")}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={row.status || "pending"}
                        color={statusChipColor(row.status)}
                        variant={(row.status || "").toLowerCase() === "paid" ? "filled" : "outlined"}
                      />
                    </TableCell>
                    <TableCell>{row.reason || row.description || "—"}</TableCell>
                    <TableCell>{row.appointment_id ? `#${row.appointment_id}` : "—"}</TableCell>
                    <TableCell>{fmtISO(row.created_at)}</TableCell>
                    <TableCell>
                      {row.checkout_url || row.hosted_invoice_url ? (
                        <IconButton
                          size="small"
                          onClick={() => handleCopy(row.checkout_url || row.hosted_invoice_url)}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          —
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {(row.status || "").toLowerCase() === "paid" && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => openRefundDialog(row)}
                        >
                          Refund
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      </Box>

      <Dialog open={refundOpen} onClose={() => !refunding && setRefundOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          Refund manual invoice
          {refundTarget && (
            <Typography variant="body2" color="text.secondary">
              Invoice #{refundTarget.id} —{" "}
              {formatCurrency(Number(refundTarget.amount || 0), refundTarget.currency || "CAD")} —{" "}
              {refundTarget.client_name || refundTarget.client_email || ""}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Alert severity="info">
              Leave blank to refund the full amount. Set a smaller amount for a partial refund.
            </Alert>
            <TextField
              label={`Refund amount (${refundTarget?.currency || currency})`}
              type="number"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              placeholder="Leave blank for full refund"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {refundTarget?.currency || currency}
                  </InputAdornment>
                ),
              }}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefundOpen(false)} disabled={refunding}>
            Close
          </Button>
          <Button onClick={submitRefund} variant="contained" color="error" disabled={refunding}>
            {refunding ? <CircularProgress size={20} color="inherit" /> : "Issue refund"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={closeSnackbar}>
        <Alert severity={snackbar.severity} onClose={closeSnackbar} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

