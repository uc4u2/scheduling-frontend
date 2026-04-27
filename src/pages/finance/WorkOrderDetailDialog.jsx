import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { formatDateTimeInTz } from "../../utils/datetime";
import { getUserTimezone } from "../../utils/timezone";
import { formatCurrency } from "../../utils/formatters";
import {
  getWorkOrder,
  updateWorkOrderStatus,
} from "./financeApi";
import WorkOrderAssignmentsPanel from "./WorkOrderAssignmentsPanel";
import WorkOrderMaterialsPanel from "./WorkOrderMaterialsPanel";
import WorkOrderEditorDialog from "./WorkOrderEditorDialog";
import FinanceStatusChip from "./components/FinanceStatusChip";
import FinanceMetricCard from "./components/FinanceMetricCard";

const ACTIONS_BY_STATUS = {
  draft: [{ label: "Schedule", status: "scheduled" }, { label: "Cancel", status: "cancelled", tone: "warning" }],
  scheduled: [
    { label: "Move Back to Draft", status: "draft" },
    { label: "Start", status: "in_progress" },
    { label: "Cancel", status: "cancelled", tone: "warning" },
  ],
  in_progress: [
    { label: "Mark Completed", status: "completed" },
    { label: "Cancel", status: "cancelled", tone: "warning" },
  ],
  completed: [
    { label: "Move Back to Active", status: "in_progress" },
    { label: "Close Job", status: "closed" },
  ],
  closed: [],
  cancelled: [],
};

export default function WorkOrderDetailDialog({ open, workOrderId, onClose, onChanged, clients = [], estimates = [] }) {
  const { enqueueSnackbar } = useSnackbar();
  const timezone = useMemo(() => getUserTimezone(), []);
  const [workOrder, setWorkOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [editingOpen, setEditingOpen] = useState(false);

  const load = async () => {
    if (!workOrderId) return;
    setLoading(true);
    setError("");
    try {
      const res = await getWorkOrder(workOrderId);
      setWorkOrder(res?.work_order || res);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to load work order.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open, workOrderId]);

  const handleStatus = async (status) => {
    if (!workOrder) return;
    setSavingStatus(true);
    try {
      const res = await updateWorkOrderStatus(workOrder.id, status);
      setWorkOrder(res?.work_order || res);
      enqueueSnackbar("Work order status updated.", { variant: "success" });
      onChanged?.();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to update work order status.", { variant: "error" });
    } finally {
      setSavingStatus(false);
    }
  };

  const statusActions = ACTIONS_BY_STATUS[String(workOrder?.status || "draft").toLowerCase()] || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{workOrder?.work_order_number || "Work Order"}</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : workOrder ? (
          <Stack spacing={3}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                  <Typography variant="h5" fontWeight={800}>{workOrder.title}</Typography>
                  <FinanceStatusChip status={workOrder.status} />
                </Stack>
                <Typography variant="body2" color="text.secondary">{workOrder.client_name || "No client linked"}{workOrder.client_email ? ` • ${workOrder.client_email}` : ""}</Typography>
                <Typography variant="body2" color="text.secondary">{workOrder.location || "No location set"}</Typography>
                <Typography variant="body2" color="text.secondary">{workOrder.start_date || "-"} to {workOrder.end_date || "-"}{workOrder.timezone ? ` • ${workOrder.timezone}` : ""}</Typography>
              </Box>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "flex-start" }}>
                <Button variant="outlined" onClick={() => setEditingOpen(true)}>Edit Job</Button>
                {statusActions.map((action) => (
                  <Button
                    key={action.status}
                    variant={action.tone === "warning" ? "outlined" : "contained"}
                    color={action.tone === "warning" ? "warning" : "primary"}
                    onClick={() => handleStatus(action.status)}
                    disabled={savingStatus}
                  >
                    {action.label}
                  </Button>
                ))}
              </Stack>
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}><FinanceMetricCard label="Planned labor hours" value={String(workOrder.planned_labor_hours ?? 0)} accent="primary" /></Grid>
              <Grid item xs={12} md={4}><FinanceMetricCard label="Planned labor cost" value={formatCurrency(workOrder.planned_labor_cost || 0)} accent="secondary" /></Grid>
              <Grid item xs={12} md={4}><FinanceMetricCard label="Assignments" value={String(workOrder.assignment_count ?? 0)} helper="Daily rows assigned to the team." accent="success" /></Grid>
              <Grid item xs={12} md={4}><FinanceMetricCard label="Field reports" value={String(workOrder.field_report_count ?? 0)} helper="Reports submitted from the field." accent="info" /></Grid>
              <Grid item xs={12} md={4}><FinanceMetricCard label="Pending review" value={String(workOrder.pending_review_count ?? 0)} helper="Manager follow-up still needed." accent="warning" /></Grid>
              <Grid item xs={12} md={4}><FinanceMetricCard label="Approved material cost" value={formatCurrency(workOrder.approved_material_cost || 0)} helper="Official after manager approval." accent="error" /></Grid>
            </Grid>

            <WorkOrderAssignmentsPanel workOrder={workOrder} onChanged={async () => { await load(); onChanged?.(); }} />
            <WorkOrderMaterialsPanel workOrder={workOrder} onChanged={async () => { await load(); onChanged?.(); }} />

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>Job Notes</Typography>
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="subtitle2">Employee-visible notes</Typography>
                  <Typography variant="body2" color="text.secondary">{workOrder.employee_visible_notes || "No employee-visible notes yet."}</Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="subtitle2">Manager-only notes</Typography>
                  <Typography variant="body2" color="text.secondary">{workOrder.manager_only_notes || "No manager-only notes yet."}</Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="subtitle2">General notes</Typography>
                  <Typography variant="body2" color="text.secondary">{workOrder.notes || "No general notes yet."}</Typography>
                </Box>
              </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>Audit History</Typography>
              {Array.isArray(workOrder.audit_logs) && workOrder.audit_logs.length ? (
                <Stack spacing={1.25}>
                  {workOrder.audit_logs.map((entry) => (
                    <Box key={entry.id}>
                      <Typography variant="subtitle2">{entry.action}</Typography>
                      <Typography variant="body2" color="text.secondary">{entry.actor_name || "System"} • {entry.created_at ? formatDateTimeInTz(entry.created_at, timezone) : "-"}</Typography>
                      {entry.message ? <Typography variant="body2">{entry.message}</Typography> : null}
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">No audit entries yet.</Typography>
              )}
            </Paper>

            <Alert severity="info">Employees can submit field reports now. Inventory and invoice changes only happen after manager review approval.</Alert>
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      <WorkOrderEditorDialog
        open={editingOpen}
        onClose={() => setEditingOpen(false)}
        onSaved={async () => { setEditingOpen(false); await load(); onChanged?.(); }}
        workOrder={workOrder}
        clients={clients}
        estimates={estimates}
      />
    </Dialog>
  );
}
