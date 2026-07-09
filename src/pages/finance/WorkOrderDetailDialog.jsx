import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import LinkOffOutlinedIcon from "@mui/icons-material/LinkOffOutlined";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import { formatDateTimeInTz } from "../../utils/datetime";
import { getUserTimezone } from "../../utils/timezone";
import { formatCurrency } from "../../utils/formatters";
import {
  createWorkOrderPhotoShareLink,
  getWorkOrder,
  getWorkOrderPhotoShareLink,
  revokeWorkOrderPhotoShareLink,
  updateWorkOrderStatus,
} from "./financeApi";
import WorkOrderAssignmentsPanel from "./WorkOrderAssignmentsPanel";
import WorkOrderMaterialsPanel from "./WorkOrderMaterialsPanel";
import WorkOrderEditorDialog from "./WorkOrderEditorDialog";
import FinanceStatusChip from "./components/FinanceStatusChip";
import FinanceMetricCard from "./components/FinanceMetricCard";

const ACTIONS_BY_STATUS = {
  draft: [{ key: "schedule", label: "Schedule job", status: "scheduled" }, { key: "cancel", label: "Cancel", status: "cancelled", tone: "warning" }],
  scheduled: [
    { key: "moveBackToDraft", label: "Move Back to Draft", status: "draft" },
    { key: "start", label: "Start job", status: "in_progress" },
    { key: "cancel", label: "Cancel", status: "cancelled", tone: "warning" },
  ],
  in_progress: [
    { key: "markCompleted", label: "Mark job completed", status: "completed" },
    { key: "cancel", label: "Cancel", status: "cancelled", tone: "warning" },
  ],
  completed: [
    { key: "moveBackToActive", label: "Reopen job", status: "in_progress" },
    { key: "closeJob", label: "Close Job", status: "closed" },
  ],
  closed: [],
  cancelled: [],
};

const STATUS_HELP = {
  draft: "Draft means the job record is still being prepared. Dates, team assignments, and materials can still be adjusted before scheduling.",
  scheduled: "Scheduled means the job has planned dates and is ready for the team, but field work has not started yet.",
  in_progress: "In progress means the team has started the job and field updates can now come back through reports and manager review.",
  completed: "Completed means field work is done, but the manager may still need to review follow-up items before final close-out.",
  closed: "Closed means the job is fully finished for operations. Use this after the work and manager review are complete.",
  cancelled: "Cancelled means this job will not move forward in its current form.",
};

const ACTION_HELP = {
  editJob: "Update the customer, scope, dates, location, notes, or planned materials before the next step.",
  schedule: "Use this when the draft is ready to become a planned job with dates, instructions, and team assignments.",
  moveBackToDraft: "Use this if the scheduled job still needs setup changes before the team should treat it as ready.",
  start: "Use this when the team has actually started the work so the job moves from planned to active.",
  markCompleted: "Use this when field work is finished and you are ready for final review or close-out.",
  moveBackToActive: "Use this if completed work needs to reopen because the team must return or fix something.",
  closeJob: "Use this when operations are fully finished and the work order should be treated as closed.",
  cancel: "Use this when the job should stop and no longer move forward in the current work-order flow.",
};

export default function WorkOrderDetailDialog({ open, workOrderId, onClose, onChanged, clients = [], estimates = [] }) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
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
  const [photoShareLink, setPhotoShareLink] = useState(null);
  const [photoShareLoading, setPhotoShareLoading] = useState(false);

  const load = useCallback(async () => {
    if (!workOrderId) return;
    setLoading(true);
    setError("");
    try {
      const res = await getWorkOrder(workOrderId);
      setWorkOrder(res?.work_order || res);
      try {
        const share = await getWorkOrderPhotoShareLink(workOrderId);
        setPhotoShareLink(share?.share_link || null);
      } catch {
        setPhotoShareLink(null);
      }
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || tWorkOrders("errors.loadFailed", "Unable to load work order."));
    } finally {
      setLoading(false);
    }
  }, [workOrderId, tWorkOrders]);

  const handleCreateOrCopyPhotoShareLink = async () => {
    if (!workOrder?.id) return;
    setPhotoShareLoading(true);
    try {
      const res = photoShareLink?.public_url ? { share_link: photoShareLink } : await createWorkOrderPhotoShareLink(workOrder.id);
      const next = res?.share_link || null;
      setPhotoShareLink(next);
      if (next?.public_url) {
        await navigator.clipboard.writeText(next.public_url);
        enqueueSnackbar("Photo gallery link copied.", { variant: "success" });
      }
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to create the photo gallery link.", { variant: "error" });
    } finally {
      setPhotoShareLoading(false);
    }
  };

  const handleRevokePhotoShareLink = async () => {
    if (!workOrder?.id || !photoShareLink?.public_url) return;
    setPhotoShareLoading(true);
    try {
      await revokeWorkOrderPhotoShareLink(workOrder.id);
      setPhotoShareLink(null);
      enqueueSnackbar("Photo gallery link revoked.", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to revoke the photo gallery link.", { variant: "error" });
    } finally {
      setPhotoShareLoading(false);
    }
  };

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
                  <Tooltip title={tWorkOrders(`statusHelp.${String(workOrder.status || "").toLowerCase()}`, STATUS_HELP[String(workOrder.status || "").toLowerCase()] || "This status shows where the job is in the operational workflow.")}>
                    <Box sx={{ display: "inline-flex" }}>
                      <FinanceStatusChip status={workOrder.status} />
                    </Box>
                  </Tooltip>
                </Stack>
                <Typography variant="body2" color="text.secondary">{workOrder.client_name || tWorkOrders("fallbacks.noClientLinked", "No client linked")}{workOrder.client_email ? ` • ${workOrder.client_email}` : ""}</Typography>
                <Typography variant="body2" color="text.secondary">{workOrder.location || tWorkOrders("fallbacks.noLocation", "No location set")}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {tWorkOrders("schedule.windowLabel", "Planned schedule")}: {workOrder.start_date || "-"} {tWorkOrders("schedule.to", "to")} {workOrder.end_date || "-"}{workOrder.timezone ? ` • ${workOrder.timezone}` : ""}
                </Typography>
              </Box>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "flex-start" }}>
                <Tooltip title={tWorkOrders("actionHelp.editJob", ACTION_HELP.editJob)}>
                  <Box>
                    <Button variant="outlined" onClick={() => setEditingOpen(true)}>{tWorkOrders("actions.editJob", "Edit Job")}</Button>
                  </Box>
                </Tooltip>
                {statusActions.map((action) => (
                  <Tooltip key={action.status} title={tWorkOrders(`actionHelp.${action.key}`, ACTION_HELP[action.key] || "Update the work order to the next operational step.")}>
                    <Box>
                      <Button
                        variant={action.tone === "warning" ? "outlined" : "contained"}
                        color={action.tone === "warning" ? "warning" : "primary"}
                        onClick={() => handleStatus(action.status)}
                        disabled={savingStatus}
                      >
                        {action.label}
                      </Button>
                    </Box>
                  </Tooltip>
                ))}
              </Stack>
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}><FinanceMetricCard label={tWorkOrders("metrics.plannedLaborHours", "Planned labor hours")} value={String(workOrder.planned_labor_hours ?? 0)} helper={tWorkOrders("metrics.plannedLaborHoursHelp", "Hours currently planned across the team assignments for this job.")} accent="primary" /></Grid>
              <Grid item xs={12} md={4}><FinanceMetricCard label={tWorkOrders("metrics.plannedLaborCost", "Planned labor cost")} value={formatCurrency(workOrder.planned_labor_cost || 0)} helper={tWorkOrders("metrics.plannedLaborCostHelp", "Expected labor cost before field changes or manager review adjustments.")} accent="secondary" /></Grid>
              <Grid item xs={12} md={4}><FinanceMetricCard label={tWorkOrders("metrics.assignments", "Assignments")} value={String(workOrder.assignment_count ?? 0)} helper={tWorkOrders("metrics.assignmentsHelp", "Daily rows assigned to the team.")} accent="success" /></Grid>
              <Grid item xs={12} md={4}><FinanceMetricCard label={tWorkOrders("metrics.fieldReports", "Field reports")} value={String(workOrder.field_report_count ?? 0)} helper={tWorkOrders("metrics.fieldReportsHelp", "Reports submitted from the field.")} accent="info" /></Grid>
              <Grid item xs={12} md={4}><FinanceMetricCard label={tWorkOrders("metrics.pendingReview", "Pending review")} value={String(workOrder.pending_review_count ?? 0)} helper={tWorkOrders("metrics.pendingReviewHelp", "Manager follow-up still needed.")} accent="warning" /></Grid>
              <Grid item xs={12} md={4}><FinanceMetricCard label={tWorkOrders("metrics.approvedMaterialCost", "Approved material cost")} value={formatCurrency(workOrder.approved_material_cost || 0)} helper={tWorkOrders("metrics.approvedMaterialCostHelp", "Official after manager approval.")} accent="error" /></Grid>
            </Grid>

            <WorkOrderAssignmentsPanel workOrder={workOrder} onChanged={async () => { await load(); onChanged?.(); }} />
            <WorkOrderMaterialsPanel workOrder={workOrder} onChanged={async () => { await load(); onChanged?.(); }} />

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ md: "center" }} sx={{ mb: 1.5 }}>
                <Box>
                  <Typography variant="h6" fontWeight={800}>{tWorkOrders("photos.title", "Job Photos")}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tWorkOrders("photos.helper", "Employee field photos linked to this work order appear here and can also surface in Client 360.")}
                  </Typography>
                </Box>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button variant="outlined" onClick={() => navigate(`/manager/field-photos?work_order_id=${workOrder.id}`)}>
                    {tWorkOrders("photos.openAll", "Open Field Photos")}
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<ContentCopyOutlinedIcon />}
                    onClick={handleCreateOrCopyPhotoShareLink}
                    disabled={photoShareLoading}
                  >
                    {photoShareLoading ? "Working..." : photoShareLink?.public_url ? "Copy share link" : "Create share link"}
                  </Button>
                  {photoShareLink?.public_url ? (
                    <>
                      <Button
                        variant="text"
                        startIcon={<OpenInNewOutlinedIcon />}
                        onClick={() => window.open(photoShareLink.public_url, "_blank", "noopener,noreferrer")}
                      >
                        Open gallery
                      </Button>
                      <Button
                        variant="text"
                        color="warning"
                        startIcon={<LinkOffOutlinedIcon />}
                        onClick={handleRevokePhotoShareLink}
                        disabled={photoShareLoading}
                      >
                        Revoke link
                      </Button>
                    </>
                  ) : null}
                </Stack>
              </Stack>
              {photoShareLink?.public_url ? (
                <TextField
                  fullWidth
                  size="small"
                  label="Client photo gallery link"
                  value={photoShareLink.public_url}
                  InputProps={{ readOnly: true }}
                  sx={{ mb: 1.5 }}
                />
              ) : null}
              {(workOrder.recent_field_photos || []).length ? (
                <Stack spacing={1}>
                  {(workOrder.recent_field_photos || []).map((photo) => (
                    <Stack key={photo.id} direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between">
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {photo.work_order?.work_order_number || workOrder.work_order_number} • {photo.uploaded_by || tWorkOrders("photos.employeeFallback", "Employee photo")}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {photo.note || photo.file_name || tWorkOrders("photos.noteFallback", "No note added")}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {photo.created_at ? formatDateTimeInTz(photo.created_at, timezone) : tWorkOrders("photos.noDate", "No date")}
                      </Typography>
                    </Stack>
                  ))}
                  {Number(workOrder.field_photo_count || 0) > Number((workOrder.recent_field_photos || []).length) ? (
                    <Typography variant="caption" color="text.secondary">
                      {tWorkOrders("photos.moreCount", "{{count}} more photos are available in Field Photos.", {
                        count: Number(workOrder.field_photo_count || 0) - Number((workOrder.recent_field_photos || []).length),
                      })}
                    </Typography>
                  ) : null}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {tWorkOrders("photos.empty", "No work-order-linked photos yet. Employees can upload photos directly from their assigned job view now.")}
                </Typography>
              )}
            </Paper>

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
