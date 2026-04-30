import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { useTranslation } from "react-i18next";
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
  draft: [{ key: "schedule", label: "Schedule", status: "scheduled" }, { key: "cancel", label: "Cancel", status: "cancelled", tone: "warning" }],
  scheduled: [
    { key: "moveBackToDraft", label: "Move Back to Draft", status: "draft" },
    { key: "start", label: "Start", status: "in_progress" },
    { key: "cancel", label: "Cancel", status: "cancelled", tone: "warning" },
  ],
  in_progress: [
    { key: "markCompleted", label: "Mark Completed", status: "completed" },
    { key: "cancel", label: "Cancel", status: "cancelled", tone: "warning" },
  ],
  completed: [
    { key: "moveBackToActive", label: "Move Back to Active", status: "in_progress" },
    { key: "closeJob", label: "Close Job", status: "closed" },
  ],
  closed: [],
  cancelled: [],
};

export default function WorkOrderDetailDialog({ open, workOrderId, onClose, onChanged, clients = [], estimates = [] }) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const tWorkOrders = React.useCallback(
    (key, fallback, options = {}) => t(`manager.finance.workOrders.detail.${key}`, { defaultValue: fallback, ...options }),
    [t]
  );
  const timezone = useMemo(() => getUserTimezone(), []);
  const [workOrder, setWorkOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [editingOpen, setEditingOpen] = useState(false);

  const load = useCallback(async () => {
    if (!workOrderId) return;
    setLoading(true);
    setError("");
    try {
      const res = await getWorkOrder(workOrderId);
      setWorkOrder(res?.work_order || res);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || tWorkOrders("errors.loadFailed", "Unable to load work order."));
    } finally {
      setLoading(false);
    }
  }, [workOrderId, tWorkOrders]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const handleStatus = async (status) => {
    if (!workOrder) return;
    setSavingStatus(true);
    try {
      const res = await updateWorkOrderStatus(workOrder.id, status);
      setWorkOrder(res?.work_order || res);
      enqueueSnackbar(tWorkOrders("snackbar.statusUpdated", "Work order status updated."), { variant: "success" });
      onChanged?.();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tWorkOrders("errors.updateStatusFailed", "Unable to update work order status."), { variant: "error" });
    } finally {
      setSavingStatus(false);
    }
  };

  const statusActions = (ACTIONS_BY_STATUS[String(workOrder?.status || "draft").toLowerCase()] || []).map((action) => ({
    ...action,
    label: tWorkOrders(`statusActions.${action.key}`, action.label),
  }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{workOrder?.work_order_number || tWorkOrders("title.fallback", "Work Order")}</DialogTitle>
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
                <Typography variant="body2" color="text.secondary">{workOrder.client_name || tWorkOrders("fallbacks.noClientLinked", "No client linked")}{workOrder.client_email ? ` • ${workOrder.client_email}` : ""}</Typography>
                <Typography variant="body2" color="text.secondary">{workOrder.location || tWorkOrders("fallbacks.noLocation", "No location set")}</Typography>
                <Typography variant="body2" color="text.secondary">{workOrder.start_date || "-"} {tWorkOrders("schedule.to", "to")} {workOrder.end_date || "-"}{workOrder.timezone ? ` • ${workOrder.timezone}` : ""}</Typography>
              </Box>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "flex-start" }}>
                <Button variant="outlined" onClick={() => setEditingOpen(true)}>{tWorkOrders("actions.editJob", "Edit Job")}</Button>
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
              <Grid item xs={12} md={4}><FinanceMetricCard label={tWorkOrders("metrics.plannedLaborHours", "Planned labor hours")} value={String(workOrder.planned_labor_hours ?? 0)} accent="primary" /></Grid>
              <Grid item xs={12} md={4}><FinanceMetricCard label={tWorkOrders("metrics.plannedLaborCost", "Planned labor cost")} value={formatCurrency(workOrder.planned_labor_cost || 0)} accent="secondary" /></Grid>
              <Grid item xs={12} md={4}><FinanceMetricCard label={tWorkOrders("metrics.assignments", "Assignments")} value={String(workOrder.assignment_count ?? 0)} helper={tWorkOrders("metrics.assignmentsHelp", "Daily rows assigned to the team.")} accent="success" /></Grid>
              <Grid item xs={12} md={4}><FinanceMetricCard label={tWorkOrders("metrics.fieldReports", "Field reports")} value={String(workOrder.field_report_count ?? 0)} helper={tWorkOrders("metrics.fieldReportsHelp", "Reports submitted from the field.")} accent="info" /></Grid>
              <Grid item xs={12} md={4}><FinanceMetricCard label={tWorkOrders("metrics.pendingReview", "Pending review")} value={String(workOrder.pending_review_count ?? 0)} helper={tWorkOrders("metrics.pendingReviewHelp", "Manager follow-up still needed.")} accent="warning" /></Grid>
              <Grid item xs={12} md={4}><FinanceMetricCard label={tWorkOrders("metrics.approvedMaterialCost", "Approved material cost")} value={formatCurrency(workOrder.approved_material_cost || 0)} helper={tWorkOrders("metrics.approvedMaterialCostHelp", "Official after manager approval.")} accent="error" /></Grid>
            </Grid>

            <WorkOrderAssignmentsPanel workOrder={workOrder} onChanged={async () => { await load(); onChanged?.(); }} />
            <WorkOrderMaterialsPanel workOrder={workOrder} onChanged={async () => { await load(); onChanged?.(); }} />

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>{tWorkOrders("notes.title", "Job Notes")}</Typography>
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="subtitle2">{tWorkOrders("notes.employeeVisible", "Employee-visible notes")}</Typography>
                  <Typography variant="body2" color="text.secondary">{workOrder.employee_visible_notes || tWorkOrders("notes.employeeVisibleEmpty", "No employee-visible notes yet.")}</Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="subtitle2">{tWorkOrders("notes.managerOnly", "Manager-only notes")}</Typography>
                  <Typography variant="body2" color="text.secondary">{workOrder.manager_only_notes || tWorkOrders("notes.managerOnlyEmpty", "No manager-only notes yet.")}</Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="subtitle2">{tWorkOrders("notes.general", "General notes")}</Typography>
                  <Typography variant="body2" color="text.secondary">{workOrder.notes || tWorkOrders("notes.generalEmpty", "No general notes yet.")}</Typography>
                </Box>
              </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>{tWorkOrders("audit.title", "Audit History")}</Typography>
              {Array.isArray(workOrder.audit_logs) && workOrder.audit_logs.length ? (
                <Stack spacing={1.25}>
                  {workOrder.audit_logs.map((entry) => (
                    <Box key={entry.id}>
                      <Typography variant="subtitle2">{entry.action}</Typography>
                      <Typography variant="body2" color="text.secondary">{entry.actor_name || tWorkOrders("audit.system", "System")} • {entry.created_at ? formatDateTimeInTz(entry.created_at, timezone) : "-"}</Typography>
                      {entry.message ? <Typography variant="body2">{entry.message}</Typography> : null}
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">{tWorkOrders("audit.empty", "No audit entries yet.")}</Typography>
              )}
            </Paper>

            <Alert severity="info">{tWorkOrders("fieldReportInfo", "Employees can submit field reports now. Inventory and invoice changes only happen after manager review approval.")}</Alert>
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{tWorkOrders("common.close", "Close")}</Button>
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
