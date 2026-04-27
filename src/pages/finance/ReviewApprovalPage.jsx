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

const decisionOptions = ["approve", "adjust", "reject", "client_provided"];
const billingOptions = ["internal_cost_only", "add_to_invoice", "ignore", "client_provided"];

const mapApiError = (error) => {
  if (error === "review_already_approved") return "This review has already been approved and applied.";
  if (error === "insufficient_inventory") return "There is not enough stock available for the approved quantity.";
  if (error === "invalid_material_decision") return "One of the material decisions is not valid.";
  if (error === "invalid_billing_decision") return "One of the billing decisions is not valid.";
  return error || "Unable to complete the review action.";
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

function ReviewDetailDialog({
  open,
  onClose,
  workOrderId,
  review,
  fieldReports,
  comparison,
  inventoryItems,
  onSaved,
}) {
  const { enqueueSnackbar } = useSnackbar();
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
      enqueueSnackbar("Review notes saved.", { variant: "success" });
      onSaved?.();
    } catch (err) {
      enqueueSnackbar(mapApiError(err?.response?.data?.error || err?.message), { variant: "error" });
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
      enqueueSnackbar("Review approved.", { variant: "success" });
      onSaved?.();
    } catch (err) {
      const payload = err?.response?.data || {};
      enqueueSnackbar(mapApiError(payload.error || err?.message), { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleClarification = async () => {
    if (!review?.id) return;
    setSaving(true);
    try {
      await requestReviewClarification(review.id);
      enqueueSnackbar("Clarification requested.", { variant: "success" });
      onSaved?.();
    } catch (err) {
      enqueueSnackbar(mapApiError(err?.response?.data?.error || err?.message), { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!review?.id) return;
    setSaving(true);
    try {
      await rejectWorkOrderReview(review.id);
      enqueueSnackbar("Review rejected.", { variant: "success" });
      onSaved?.();
    } catch (err) {
      enqueueSnackbar(mapApiError(err?.response?.data?.error || err?.message), { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>Review & approve</DialogTitle>
      <DialogContent dividers>
        {review ? (
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Review #{review.id}{review.work_order_number ? ` • ${review.work_order_number}` : ""}
                {selectedFieldReport ? ` • Field report #${selectedFieldReport.id}` : ""}
              </Typography>
              <FinanceStatusChip status={review.status} />
            </Stack>

            {warnings.map((warning) => (
              <Alert key={warning} severity={warning === "invoice_missing_for_work_order" ? "warning" : "info"}>
                {warning === "invoice_missing_for_work_order"
                  ? "No linked invoice exists for this work order, so no invoice extra was created."
                  : warning}
              </Alert>
            ))}

            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Review notes"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
            />

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>Plan vs reported</Typography>
              {comparison ? (
                <Stack spacing={1}>
                  {(comparison.reported_materials || []).map((row) => (
                    <Typography key={`compare-${row.field_report_material_id}`} variant="body2">
                      {row.title} • Reported {row.reported_quantity}{row.is_extra ? " • Extra work" : ""}
                    </Typography>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">No plan-vs-reported data linked to this review yet.</Typography>
              )}
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>Material decisions</Typography>
              {!decisionRows.length ? (
                <Typography variant="body2" color="text.secondary">No reported materials are attached to this review.</Typography>
              ) : (
                <Stack spacing={2}>
                  {decisionRows.map((row, index) => (
                    <Paper key={`decision-${index}`} variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={3}><TextField fullWidth label="Title" value={row.title} onChange={(e) => updateDecisionRow(index, "title", e.target.value)} /></Grid>
                        <Grid item xs={12} md={2}><TextField fullWidth label="Planned qty" value={row.planned_quantity} onChange={(e) => updateDecisionRow(index, "planned_quantity", e.target.value)} /></Grid>
                        <Grid item xs={12} md={2}><TextField fullWidth label="Reported qty" value={row.reported_quantity} onChange={(e) => updateDecisionRow(index, "reported_quantity", e.target.value)} /></Grid>
                        <Grid item xs={12} md={2}><TextField fullWidth label="Approved qty" value={row.approved_quantity} onChange={(e) => updateDecisionRow(index, "approved_quantity", e.target.value)} /></Grid>
                        <Grid item xs={12} md={3}><TextField fullWidth label="Unit cost" value={row.unit_cost_snapshot} onChange={(e) => updateDecisionRow(index, "unit_cost_snapshot", e.target.value)} /></Grid>
                        <Grid item xs={12} md={3}>
                          <FormControl fullWidth>
                            <InputLabel>Decision</InputLabel>
                            <Select label="Decision" value={row.decision} onChange={(e) => updateDecisionRow(index, "decision", e.target.value)}>
                              {decisionOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <FormControl fullWidth>
                            <InputLabel>Billing</InputLabel>
                            <Select label="Billing" value={row.billing_decision} onChange={(e) => updateDecisionRow(index, "billing_decision", e.target.value)}>
                              {billingOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <FormControl fullWidth>
                            <InputLabel>Inventory item</InputLabel>
                            <Select label="Inventory item" value={row.inventory_item_id} onChange={(e) => updateDecisionRow(index, "inventory_item_id", e.target.value)}>
                              <MenuItem value="">No stock item</MenuItem>
                              {inventoryItems.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}><TextField fullWidth label="Note" value={row.note} onChange={(e) => updateDecisionRow(index, "note", e.target.value)} /></Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Paper>

            <Alert severity="info">Inventory changes only after manager approval. This screen does not expose negative-inventory overrides.</Alert>
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSaveDraft} disabled={saving}>Save notes</Button>
        <Button onClick={handleClarification} disabled={saving}>Request clarification</Button>
        <Button color="error" onClick={handleReject} disabled={saving}>Reject</Button>
        <Button variant="contained" onClick={handleApprove} disabled={saving}>Approve review</Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ReviewApprovalPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [workOrders, setWorkOrders] = useState([]);
  const [fieldReports, setFieldReports] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState("");
  const [selectedFieldReportId, setSelectedFieldReportId] = useState("");
  const [selectedReview, setSelectedReview] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBase = async () => {
    const [workOrdersRes, inventoryRes] = await Promise.all([
      listWorkOrders({ limit: 100 }),
      listInventoryItems({ active: true }),
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
      listWorkOrderFieldReports(workOrderIdArg),
      listWorkOrderReviews(workOrderIdArg),
    ]);
    setFieldReports(Array.isArray(reportsRes?.items) ? reportsRes.items : []);
    setReviews(Array.isArray(reviewsRes?.items) ? reviewsRes.items : []);
  };

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const workOrderId = await loadBase();
      await loadWorkOrderScoped(workOrderId);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to load reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (selectedWorkOrderId) {
      loadWorkOrderScoped(selectedWorkOrderId).catch((err) => {
        setError(err?.response?.data?.error || err?.message || "Unable to load reviews.");
      });
    }
  }, [selectedWorkOrderId]);

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
      enqueueSnackbar(mapApiError(err?.response?.data?.error || err?.message), { variant: "error" });
    }
  };

  const handleCreateReview = async () => {
    if (!selectedWorkOrderId) return;
    try {
      await createWorkOrderReview(selectedWorkOrderId, {
        field_report_id: selectedFieldReportId || undefined,
      });
      enqueueSnackbar("Review created.", { variant: "success" });
      await loadWorkOrderScoped(selectedWorkOrderId);
    } catch (err) {
      enqueueSnackbar(mapApiError(err?.response?.data?.error || err?.message), { variant: "error" });
    }
  };

  return (
    <Stack spacing={2.5}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between">
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <FormControl size="small" sx={{ minWidth: 280 }}>
              <InputLabel>Work order</InputLabel>
              <Select label="Work order" value={selectedWorkOrderId} onChange={(e) => setSelectedWorkOrderId(e.target.value)}>
                {workOrders.map((row) => (
                  <MenuItem key={row.id} value={row.id}>{row.work_order_number} • {row.title}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 280 }}>
              <InputLabel>Field report for new review</InputLabel>
              <Select label="Field report for new review" value={selectedFieldReportId} onChange={(e) => setSelectedFieldReportId(e.target.value)}>
                <MenuItem value="">Create empty draft review</MenuItem>
                {fieldReports.map((row) => (
                  <MenuItem key={row.id} value={row.id}>Report #{row.id} • {row.submitted_by_name || row.submitted_by_recruiter_id}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={loadAll}>Refresh</Button>
            <Button variant="contained" onClick={handleCreateReview}>Create review</Button>
          </Stack>
        </Stack>
      </Paper>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : reviews.length === 0 ? (
        <FinanceEmptyState
          title="No reviews yet"
          description="Create manager reviews here after field reports come in from the job site."
          actionLabel="Create review"
          onAction={handleCreateReview}
        />
      ) : (
        <Paper variant="outlined" sx={{ overflowX: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Review</TableCell>
                <TableCell>Field report</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Approved</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.id} hover>
                  <TableCell>Review #{review.id}</TableCell>
                  <TableCell>{review.field_report_id || "-"}</TableCell>
                  <TableCell><FinanceStatusChip status={review.status} /></TableCell>
                  <TableCell>{review.approved_at || "-"}</TableCell>
                  <TableCell align="right"><Button size="small" onClick={() => openReview(review.id)}>Open</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <ReviewDetailDialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        workOrderId={selectedWorkOrderId}
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
