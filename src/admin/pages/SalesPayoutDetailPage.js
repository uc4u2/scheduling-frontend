import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
  IconButton,
  Snackbar,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import platformAdminApi from "../../api/platformAdminApi";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

const formatCents = (value) => (Number(value || 0) / 100).toFixed(2);

export default function SalesPayoutDetailPage() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [paidOpen, setPaidOpen] = useState(false);
  const [paidForm, setPaidForm] = useState({ paid_method: "", reference: "", notes: "" });
  const [copyNotice, setCopyNotice] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: resp } = await platformAdminApi.get(`/sales/payouts/${batchId}`);
      setData(resp);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load payout batch");
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async () => {
    setError("");
    try {
      await platformAdminApi.post(`/sales/payouts/${batchId}/approve`);
      load();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to approve");
    }
  };

  const markPaid = async () => {
    setError("");
    try {
      const confirmMsg = `Mark paid for Rep ${batch?.sales_rep_id || ""} (${batch?.period_start} → ${batch?.period_end})?`;
      if (!window.confirm(confirmMsg)) return;
      await platformAdminApi.post(`/sales/payouts/${batchId}/mark-paid`, paidForm);
      setPaidOpen(false);
      load();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to mark paid");
    }
  };

  const voidBatch = async () => {
    setError("");
    try {
      if (!window.confirm("Void this payout batch? This will detach entries.")) return;
      await platformAdminApi.post(`/sales/payouts/${batchId}/void`);
      load();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to void");
    }
  };

  const batch = data?.batch;
  const entries = data?.entries || [];
  const entriesCount = data?.entries_count ?? entries.length;
  const copyReference = async () => {
    if (!batch?.reference) return;
    try {
      await navigator.clipboard.writeText(batch.reference);
      setCopyNotice(true);
    } catch {
      // noop
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <Button variant="text" onClick={() => window.history.back()}>
          Back to payouts
        </Button>
        {batch?.sales_rep_id && (
          <Button variant="text" onClick={() => navigate(`/admin/sales/reps/${batch.sales_rep_id}`)}>
            View Rep profile
          </Button>
        )}
      </Stack>
      <Typography variant="h5" sx={{ mb: 2 }}>Payout Batch #{batchId}</Typography>
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

      {batch && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1">Rep {batch.sales_rep_id}</Typography>
          <Typography variant="body2">Period {batch.period_start} → {batch.period_end}</Typography>
          <Typography variant="body2">Total: ${formatCents(batch.total_payable_cents)} {batch.currency?.toUpperCase()}</Typography>
          <Typography variant="body2">Status: {batch.status}</Typography>
          <Typography variant="body2">Approved: {batch.approved_at || "—"}</Typography>
          <Typography variant="body2">Paid: {batch.paid_at || "—"}</Typography>
          <Typography variant="body2">Method: {batch.paid_method || "—"}</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2">Reference: {batch.reference || "—"}</Typography>
            {batch.reference && (
              <IconButton size="small" onClick={copyReference} aria-label="Copy reference">
                <ContentCopyIcon fontSize="inherit" />
              </IconButton>
            )}
          </Stack>
          {batch.notes && <Typography variant="body2">Notes: {batch.notes}</Typography>}
          <Typography variant="body2">Entries: {entriesCount}</Typography>

          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            {batch.status === "draft" && (
              <Button variant="contained" onClick={approve} disabled={loading}>Approve</Button>
            )}
            {(batch.status === "draft" || batch.status === "approved") && (
              <Button variant="outlined" onClick={() => setPaidOpen(true)} disabled={loading}>Mark Paid</Button>
            )}
            {batch.status === "draft" && (
              <Button color="error" onClick={voidBatch} disabled={loading}>Void</Button>
            )}
          </Stack>
        </Paper>
      )}

      {entries.map((entry) => (
        <Paper key={entry.id} sx={{ p: 2, mb: 1 }}>
          <Typography variant="subtitle2">
            {entry.type} • ${formatCents(entry.amount_cents)} {entry.currency?.toUpperCase()}
          </Typography>
          <Typography variant="body2">
            Deal {entry.deal_id} • Company {entry.company_id} • Invoice {entry.stripe_invoice_id}
          </Typography>
          <Typography variant="body2">Created: {entry.created_at}</Typography>
        </Paper>
      ))}

      <Dialog open={paidOpen} onClose={() => setPaidOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Mark batch paid</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Paid method"
              value={paidForm.paid_method}
              onChange={(e) => setPaidForm((prev) => ({ ...prev, paid_method: e.target.value }))}
            />
            <TextField
              label="Reference"
              value={paidForm.reference}
              onChange={(e) => setPaidForm((prev) => ({ ...prev, reference: e.target.value }))}
            />
            <TextField
              label="Notes"
              value={paidForm.notes}
              onChange={(e) => setPaidForm((prev) => ({ ...prev, notes: e.target.value }))}
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaidOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={markPaid}>Save</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={copyNotice}
        autoHideDuration={1500}
        onClose={() => setCopyNotice(false)}
        message="Copied"
      />
    </Box>
  );
}
