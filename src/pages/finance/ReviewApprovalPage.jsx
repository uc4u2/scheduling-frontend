import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import {
  approveWorkOrderReview,
  createWorkOrderReview,
  getPlanVsReported,
  getWorkOrderReview,
  listInventoryItems,
  listWorkOrderFieldReports,
  listWorkOrderReviews,
  listWorkOrders,
  rejectWorkOrderReview,
  requestReviewClarification,
  updateWorkOrderReview,
} from "./financeApi";
import FinanceEmptyState from "./components/FinanceEmptyState";
import FinanceStatusChip from "./components/FinanceStatusChip";
import FinancePagination from "./components/FinancePagination";

const decisionOptions = ["approve", "adjust", "reject", "client_provided"];
const billingOptions = ["internal_cost_only", "add_to_invoice", "ignore", "client_provided"];

const mapApiError = (error, tReviews) => {
  if (error === "review_already_approved") return tReviews("errors.alreadyApproved", "This review has already been approved and applied.");
  if (error === "insufficient_inventory") return tReviews("errors.insufficientInventory", "There is not enough stock available for the approved quantity.");
  if (error === "invalid_material_decision") return tReviews("errors.invalidMaterialDecision", "One of the material decisions is not valid.");
  if (error === "invalid_billing_decision") return tReviews("errors.invalidBillingDecision", "One of the billing decisions is not valid.");
  return error || tReviews("errors.actionFailed", "Unable to complete the review action.");
};

const buildDecisionRows = (review, comparison) => {
  if (Array.isArray(review?.material_decisions) && review.material_decisions.length) {
    return review.material_decisions.map((row) => ({
      field_report_material_id: row.field_report_material_id || "",
      material_plan_id: row.material_plan_id || "",
      inventory_item_id: row.inventory_item_id || "",
      title: row.title || "",
      planned_quantity: row.planned_quantity ?? "",
      reported_quantity: row.reported_quantity ?? "",
      approved_quantity: row.approved_quantity ?? "",
      unit_cost_snapshot: row.unit_cost_snapshot ?? "",
      decision: row.decision || "approve",
      billing_decision: row.billing_decision || "internal_cost_only",
      note: row.note || "",
    }));
  }

  const plannedById = new Map((comparison?.planned_materials || []).map((row) => [row.material_plan_id, row]));
  return (comparison?.reported_materials || []).map((row) => ({
    field_report_material_id: row.field_report_material_id || "",
    material_plan_id: row.material_plan_id || "",
    inventory_item_id: row.inventory_item_id || "",
    title: row.title || "",
    planned_quantity: plannedById.get(row.material_plan_id)?.planned_quantity ?? "",
    reported_quantity: row.reported_quantity ?? "",
    approved_quantity: row.reported_quantity ?? "",
    unit_cost_snapshot: row.unit_cost_snapshot ?? "",
    decision: row.is_extra ? "adjust" : "approve",
    billing_decision: row.is_extra ? "add_to_invoice" : "internal_cost_only",
    note: row.reason || "",
  }));
};

function ReviewDetailDialog({ open, onClose, review, fieldReports, comparison, inventoryItems, onSaved }) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const tReviews = useCallback(
    (key, fallback, options = {}) => t(`manager.finance.reviews.${key}`, { defaultValue: fallback, ...options }),
    [t]
  );
  const [reviewNotes, setReviewNotes] = useState("");
  const [decisionRows, setDecisionRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [warnings, setWarnings] = useState([]);

  useEffect(() => {
    if (!open) return;
    setReviewNotes(review?.review_notes || "");
    setDecisionRows(buildDecisionRows(review, comparison));
    setWarnings([]);
  }, [open, review, comparison]);

  const selectedFieldReport = useMemo(
    () => fieldReports.find((row) => row.id === review?.field_report_id),
    [fieldReports, review]
  );

  const updateDecisionRow = (index, field, value) => {
    setDecisionRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)));
  };

  const handleSaveDraft = async () => {
    if (!review?.id) return;
    setSaving(true);
    try {
      await updateWorkOrderReview(review.id, { review_notes: reviewNotes });
      enqueueSnackbar(tReviews("snackbar.notesSaved", "Review notes saved."), { variant: "success" });
      onSaved?.();
    } catch (err) {
      enqueueSnackbar(mapApiError(err?.response?.data?.error || err?.message, tReviews), { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!review?.id) return;
    setSaving(true);
    try {
      const payload = {
        review_notes: reviewNotes,
        material_decisions: decisionRows.map((row) => ({
          field_report_material_id: row.field_report_material_id || null,
          material_plan_id: row.material_plan_id || null,
          inventory_item_id: row.inventory_item_id || null,
          title: row.title,
          planned_quantity: row.planned_quantity === "" ? null : Number(row.planned_quantity),
          reported_quantity: row.reported_quantity === "" ? null : Number(row.reported_quantity),
          approved_quantity: Number(row.approved_quantity || 0),
          unit_cost_snapshot: row.unit_cost_snapshot === "" ? null : Number(row.unit_cost_snapshot),
          decision: row.decision,
          billing_decision: row.billing_decision,
          note: row.note,
        })),
      };
      const res = await approveWorkOrderReview(review.id, payload);
      const nextWarnings = Array.isArray(res?.warnings) ? res.warnings : [];
      setWarnings(nextWarnings);
      enqueueSnackbar(tReviews("snackbar.reviewApproved", "Review approved."), { variant: "success" });
      onSaved?.();
    } catch (err) {
      const payload = err?.response?.data || {};
      enqueueSnackbar(mapApiError(payload.error || err?.message, tReviews), { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleClarification = async () => {
    if (!review?.id) return;
    setSaving(true);
    try {
      await requestReviewClarification(review.id);
      enqueueSnackbar(tReviews("snackbar.clarificationRequested", "Clarification requested."), { variant: "success" });
      onSaved?.();
    } catch (err) {
      enqueueSnackbar(mapApiError(err?.response?.data?.error || err?.message, tReviews), { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!review?.id) return;
    setSaving(true);
    try {
      await rejectWorkOrderReview(review.id);
      enqueueSnackbar(tReviews("snackbar.reviewRejected", "Review rejected."), { variant: "success" });
      onSaved?.();
    } catch (err) {
      enqueueSnackbar(mapApiError(err?.response?.data?.error || err?.message, tReviews), { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>{tReviews("detail.title", "Review & approve")}</DialogTitle>
      <DialogContent dividers>
        {review ? (
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                {tReviews("detail.reviewNumber", "Review #{{id}}", { id: review.id })}{review.work_order_number ? ` • ${review.work_order_number}` : ""}
                {selectedFieldReport ? ` • ${tReviews("detail.fieldReportNumber", "Field report #{{id}}", { id: selectedFieldReport.id })}` : ""}
              </Typography>
              <FinanceStatusChip status={review.status} />
            </Stack>

            {warnings.map((warning) => (
              <Alert key={warning} severity={warning === "invoice_missing_for_work_order" ? "warning" : "info"}>
                {warning === "invoice_missing_for_work_order"
                  ? tReviews("detail.invoiceMissingWarning", "No linked invoice exists for this work order, so no invoice extra was created.")
                  : warning}
              </Alert>
            ))}

            <TextField
              fullWidth
              multiline
              minRows={3}
              label={tReviews("detail.reviewNotes", "Review notes")}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
            />

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>{tReviews("detail.planVsReported", "Plan vs reported")}</Typography>
              {comparison ? (
                <Stack spacing={1}>
                  {(comparison.reported_materials || []).map((row) => (
                    <Typography key={`compare-${row.field_report_material_id}`} variant="body2">
                      {row.title} • {tReviews("detail.reportedQuantity", "Reported {{count}}", { count: row.reported_quantity })}{row.is_extra ? ` • ${tReviews("detail.extraWork", "Extra work")}` : ""}
                    </Typography>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">{tReviews("detail.noComparison", "No plan-vs-reported data linked to this review yet.")}</Typography>
              )}
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>{tReviews("detail.materialDecisions", "Material decisions")}</Typography>
              {!decisionRows.length ? (
                <Typography variant="body2" color="text.secondary">{tReviews("detail.noReportedMaterials", "No reported materials are attached to this review.")}</Typography>
              ) : (
                <Stack spacing={2}>
                  {decisionRows.map((row, index) => (
                    <Paper key={`decision-${index}`} variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={3}><TextField fullWidth label={tReviews("detail.fields.title", "Title")} value={row.title} onChange={(e) => updateDecisionRow(index, "title", e.target.value)} /></Grid>
                        <Grid item xs={12} md={2}><TextField fullWidth label={tReviews("detail.fields.plannedQty", "Planned qty")} value={row.planned_quantity} onChange={(e) => updateDecisionRow(index, "planned_quantity", e.target.value)} /></Grid>
                        <Grid item xs={12} md={2}><TextField fullWidth label={tReviews("detail.fields.reportedQty", "Reported qty")} value={row.reported_quantity} onChange={(e) => updateDecisionRow(index, "reported_quantity", e.target.value)} /></Grid>
                        <Grid item xs={12} md={2}><TextField fullWidth label={tReviews("detail.fields.approvedQty", "Approved qty")} value={row.approved_quantity} onChange={(e) => updateDecisionRow(index, "approved_quantity", e.target.value)} /></Grid>
                        <Grid item xs={12} md={3}><TextField fullWidth label={tReviews("detail.fields.unitCost", "Unit cost")} value={row.unit_cost_snapshot} onChange={(e) => updateDecisionRow(index, "unit_cost_snapshot", e.target.value)} /></Grid>
                        <Grid item xs={12} md={3}>
                          <FormControl fullWidth>
                            <InputLabel>{tReviews("detail.fields.decision", "Decision")}</InputLabel>
                            <Select label={tReviews("detail.fields.decision", "Decision")} value={row.decision} onChange={(e) => updateDecisionRow(index, "decision", e.target.value)}>
                              {decisionOptions.map((option) => <MenuItem key={option} value={option}>{tReviews(`decisionOptions.${option}`, option)}</MenuItem>)}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <FormControl fullWidth>
                            <InputLabel>{tReviews("detail.fields.billing", "Billing")}</InputLabel>
                            <Select label={tReviews("detail.fields.billing", "Billing")} value={row.billing_decision} onChange={(e) => updateDecisionRow(index, "billing_decision", e.target.value)}>
                              {billingOptions.map((option) => <MenuItem key={option} value={option}>{tReviews(`billingOptions.${option}`, option)}</MenuItem>)}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <FormControl fullWidth>
                            <InputLabel>{tReviews("detail.fields.inventoryItem", "Inventory item")}</InputLabel>
                            <Select label={tReviews("detail.fields.inventoryItem", "Inventory item")} value={row.inventory_item_id} onChange={(e) => updateDecisionRow(index, "inventory_item_id", e.target.value)}>
                              <MenuItem value="">{tReviews("detail.fields.noStockItem", "No stock item")}</MenuItem>
                              {inventoryItems.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}><TextField fullWidth label={tReviews("detail.fields.note", "Note")} value={row.note} onChange={(e) => updateDecisionRow(index, "note", e.target.value)} /></Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Paper>

            <Alert severity="info">{tReviews("detail.inventoryInfo", "Inventory changes only after manager approval. This screen does not expose negative-inventory overrides.")}</Alert>
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSaveDraft} disabled={saving}>{tReviews("actions.saveNotes", "Save notes")}</Button>
        <Button onClick={handleClarification} disabled={saving}>{tReviews("actions.requestClarification", "Request clarification")}</Button>
        <Button color="error" onClick={handleReject} disabled={saving}>{tReviews("actions.reject", "Reject")}</Button>
        <Button variant="contained" onClick={handleApprove} disabled={saving}>{tReviews("actions.approveReview", "Approve review")}</Button>
        <Button onClick={onClose}>{tReviews("common.close", "Close")}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ReviewApprovalPage() {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const tReviews = useCallback(
    (key, fallback, options = {}) => t(`manager.finance.reviews.${key}`, { defaultValue: fallback, ...options }),
    [t]
  );
  const [workOrders, setWorkOrders] = useState([]);
  const [fieldReports, setFieldReports] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState("");
  const [selectedFieldReportId, setSelectedFieldReportId] = useState("");
  const [selectedReview, setSelectedReview] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBase = async () => {
    const [workOrdersRes, inventoryRes] = await Promise.all([
      listWorkOrders({ per_page: 100 }),
      listInventoryItems({ active: true, per_page: 100 }),
    ]);
    const workOrderRows = Array.isArray(workOrdersRes?.items) ? workOrdersRes.items : [];
    setWorkOrders(workOrderRows);
    setInventoryItems(Array.isArray(inventoryRes?.items) ? inventoryRes.items : []);
    if (!selectedWorkOrderId && workOrderRows.length) {
      setSelectedWorkOrderId(workOrderRows[0].id);
      return workOrderRows[0].id;
    }
    return selectedWorkOrderId;
  };

  const loadWorkOrderScoped = async (workOrderIdArg) => {
    if (!workOrderIdArg) {
      setReviews([]);
      setFieldReports([]);
      return;
    }
    const [reportsRes, reviewsRes] = await Promise.all([
      listWorkOrderFieldReports(workOrderIdArg, { per_page: 100 }),
      listWorkOrderReviews(workOrderIdArg, { page, per_page: perPage }),
    ]);
    setFieldReports(Array.isArray(reportsRes?.items) ? reportsRes.items : []);
    setReviews(Array.isArray(reviewsRes?.items) ? reviewsRes.items : []);
    setPagination(reviewsRes?.pagination || null);
  };

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const workOrderId = await loadBase();
      await loadWorkOrderScoped(workOrderId);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || tReviews("errors.loadFailed", "Unable to load reviews."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // Initial page bootstrap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedWorkOrderId) {
      loadWorkOrderScoped(selectedWorkOrderId).catch((err) => {
        setError(err?.response?.data?.error || err?.message || tReviews("errors.loadFailed", "Unable to load reviews."));
      });
    }
    // Keep reload scoped to selected work order and pagination without making the helper identity-sensitive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorkOrderId, page, perPage, tReviews]);

  const openReview = async (reviewId) => {
    try {
      const reviewRes = await getWorkOrderReview(reviewId);
      const review = reviewRes?.review || reviewRes;
      setSelectedReview(review);
      if (review?.field_report_id) {
        const comparisonRes = await getPlanVsReported(review.field_report_id);
        setComparison(comparisonRes || null);
      } else {
        setComparison(null);
      }
      setDetailOpen(true);
    } catch (err) {
      enqueueSnackbar(mapApiError(err?.response?.data?.error || err?.message, tReviews), { variant: "error" });
    }
  };

  const handleCreateReview = async () => {
    if (!selectedWorkOrderId) return;
    try {
      await createWorkOrderReview(selectedWorkOrderId, {
        field_report_id: selectedFieldReportId || undefined,
      });
      enqueueSnackbar(tReviews("snackbar.reviewCreated", "Review created."), { variant: "success" });
      await loadWorkOrderScoped(selectedWorkOrderId);
    } catch (err) {
      enqueueSnackbar(mapApiError(err?.response?.data?.error || err?.message, tReviews), { variant: "error" });
    }
  };

  return (
    <Stack spacing={2.5}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between">
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <FormControl size="small" sx={{ minWidth: 280 }}>
              <InputLabel shrink>{tReviews("toolbar.workOrder", "Work order")}</InputLabel>
              <Select
                label={tReviews("toolbar.workOrder", "Work order")}
                value={selectedWorkOrderId}
                displayEmpty
                notched
                renderValue={(value) => {
                  if (value) {
                    const selected = workOrders.find((row) => String(row.id) === String(value));
                    return selected ? `${selected.work_order_number} • ${selected.title}` : value;
                  }
                  return workOrders.length
                    ? tReviews("toolbar.workOrderPlaceholder", "Select a work order to review")
                    : tReviews("toolbar.workOrderEmpty", "No work orders are ready for review yet");
                }}
                onChange={(e) => { setSelectedWorkOrderId(e.target.value); setPage(1); }}
              >
                <MenuItem value="" disabled>
                  {workOrders.length
                    ? tReviews("toolbar.workOrderPlaceholder", "Select a work order to review")
                    : tReviews("toolbar.workOrderEmpty", "No work orders are ready for review yet")}
                </MenuItem>
                {workOrders.map((row) => (
                  <MenuItem key={row.id} value={row.id}>{row.work_order_number} • {row.title}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 280 }}>
              <InputLabel shrink>{tReviews("toolbar.fieldReportForNewReview", "Field report for new review")}</InputLabel>
              <Select
                label={tReviews("toolbar.fieldReportForNewReview", "Field report for new review")}
                value={selectedFieldReportId}
                displayEmpty
                notched
                renderValue={(value) => {
                  if (value) {
                    const selected = fieldReports.find((row) => String(row.id) === String(value));
                    return selected
                      ? `${tReviews("toolbar.reportNumber", "Report #{{id}}", { id: selected.id })} • ${selected.submitted_by_name || selected.submitted_by_recruiter_id}`
                      : value;
                  }
                  if (!selectedWorkOrderId) {
                    return tReviews("toolbar.selectWorkOrderFirst", "Select a work order first");
                  }
                  return fieldReports.length
                    ? tReviews("toolbar.createEmptyDraftReview", "Create empty draft review")
                    : tReviews("toolbar.noFieldReportsYet", "No field reports submitted for this work order yet");
                }}
                onChange={(e) => setSelectedFieldReportId(e.target.value)}
              >
                <MenuItem value="">
                  {!selectedWorkOrderId
                    ? tReviews("toolbar.selectWorkOrderFirst", "Select a work order first")
                    : fieldReports.length
                      ? tReviews("toolbar.createEmptyDraftReview", "Create empty draft review")
                      : tReviews("toolbar.noFieldReportsYet", "No field reports submitted for this work order yet")}
                </MenuItem>
                {fieldReports.map((row) => (
                  <MenuItem key={row.id} value={row.id}>{tReviews("toolbar.reportNumber", "Report #{{id}}", { id: row.id })} • {row.submitted_by_name || row.submitted_by_recruiter_id}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={loadAll}>{tReviews("toolbar.refresh", "Refresh")}</Button>
            <Button variant="contained" onClick={handleCreateReview} disabled={!selectedWorkOrderId}>{tReviews("toolbar.createReview", "Create review")}</Button>
          </Stack>
        </Stack>
      </Paper>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : reviews.length === 0 ? (
        <FinanceEmptyState
          title={tReviews("empty.title", "No reviews yet")}
          description={tReviews("empty.description", "No reviews created yet.")}
          actionLabel={tReviews("empty.action", "Create review")}
          onAction={handleCreateReview}
        />
      ) : (
        <Paper variant="outlined" sx={{ overflowX: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{tReviews("table.headers.review", "Review")}</TableCell>
                <TableCell>{tReviews("table.headers.fieldReport", "Field report")}</TableCell>
                <TableCell>{tReviews("table.headers.status", "Status")}</TableCell>
                <TableCell>{tReviews("table.headers.approved", "Approved")}</TableCell>
                <TableCell align="right">{tReviews("table.headers.actions", "Actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.id} hover>
                  <TableCell>{tReviews("table.reviewNumber", "Review #{{id}}", { id: review.id })}</TableCell>
                  <TableCell>{review.field_report_id || "-"}</TableCell>
                  <TableCell><FinanceStatusChip status={review.status} /></TableCell>
                  <TableCell>{review.approved_at || "-"}</TableCell>
                  <TableCell align="right"><Button size="small" onClick={() => openReview(review.id)}>{tReviews("table.open", "Open")}</Button></TableCell>
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

      <ReviewDetailDialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        review={selectedReview}
        fieldReports={fieldReports}
        comparison={comparison}
        inventoryItems={inventoryItems}
        onSaved={async () => {
          setDetailOpen(false);
          await loadWorkOrderScoped(selectedWorkOrderId);
        }}
      />
    </Stack>
  );
}
