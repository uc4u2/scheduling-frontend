import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
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
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { createWorkOrderReview, getPlanVsReported, listWorkOrderFieldReports, listWorkOrders, rejectFieldReport, requestFieldReportClarification } from "./financeApi";
import FinanceEmptyState from "./components/FinanceEmptyState";
import FinanceStatusChip from "./components/FinanceStatusChip";
import FinancePagination from "./components/FinancePagination";

function FieldReportDetailDialog({ open, onClose, report, comparison, onClarification, onReject, onCreateReview }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Field report detail</DialogTitle>
      <DialogContent dividers>
        {report ? (
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.5}>
              <BoxBlock label="Submitted by" value={report.submitted_by_name || report.submitted_by_recruiter_name || report.submitted_by_recruiter_id || "-"} />
              <BoxBlock label="Status" value={<FinanceStatusChip status={report.status} />} />
            </Stack>
            <BoxBlock label="Work notes" value={report.work_notes || "-"} />
            <BoxBlock label="Issues found" value={report.issues_found || "-"} />
            <BoxBlock label="Client requested extra work" value={report.client_requested_extra_work || "-"} />
            <BoxBlock label="Client note" value={report.client_note || "-"} />
            <BoxBlock label="Files" value={Array.isArray(report.files_json) && report.files_json.length ? report.files_json.join(", ") : "No file metadata added."} />

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>Reported materials</Typography>
              {(report.materials || []).length ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Reported qty</TableCell>
                      <TableCell>Planned material</TableCell>
                      <TableCell>Extra work</TableCell>
                      <TableCell>Reason</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.materials.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.title}</TableCell>
                        <TableCell>{row.quantity_reported}</TableCell>
                        <TableCell>{row.material_plan_title || row.material_plan_id || "-"}</TableCell>
                        <TableCell>{row.is_extra ? "Yes" : "No"}</TableCell>
                        <TableCell>{row.reason || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2" color="text.secondary">No reported materials.</Typography>
              )}
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>Plan vs reported</Typography>
              {comparison ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Planned materials</Typography>
                    <Stack spacing={1}>
                      {(comparison.planned_materials || []).map((row) => (
                        <Typography key={`planned-${row.material_plan_id}`} variant="body2">
                          {row.title} • Planned {row.planned_quantity}
                        </Typography>
                      ))}
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Reported materials</Typography>
                    <Stack spacing={1}>
                      {(comparison.reported_materials || []).map((row) => (
                        <Typography key={`reported-${row.field_report_material_id}`} variant="body2">
                          {row.title} • Reported {row.reported_quantity}{row.is_extra ? " • Extra" : ""}
                        </Typography>
                      ))}
                    </Stack>
                  </Grid>
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary">Comparison data is unavailable.</Typography>
              )}
            </Paper>
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button color="warning" onClick={onClarification}>Request clarification</Button>
        <Button color="error" onClick={onReject}>Reject report</Button>
        <Button variant="contained" onClick={onCreateReview}>Create review</Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function BoxBlock({ label, value }) {
  return (
    <div>
      <Typography variant="subtitle2">{label}</Typography>
      {typeof value === "string" ? <Typography variant="body2" color="text.secondary">{value}</Typography> : value}
    </div>
  );
}

export default function FieldReportsPage({ onNavigate }) {
  const { enqueueSnackbar } = useSnackbar();
  const [workOrders, setWorkOrders] = useState([]);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState("");
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [comparison, setComparison] = useState(null);

  const loadWorkOrders = async () => {
    const res = await listWorkOrders({ per_page: 100 });
    const rows = Array.isArray(res?.items) ? res.items : [];
    setWorkOrders(rows);
    if (!selectedWorkOrderId && rows.length) {
      setSelectedWorkOrderId(rows[0].id);
      return rows[0].id;
    }
    return selectedWorkOrderId;
  };

  const loadReports = async (workOrderIdArg) => {
    const activeWorkOrderId = workOrderIdArg || selectedWorkOrderId;
    if (!activeWorkOrderId) {
      setReports([]);
      return;
    }
    const res = await listWorkOrderFieldReports(activeWorkOrderId, { page, per_page: perPage });
    setReports(Array.isArray(res?.items) ? res.items : []);
    setPagination(res?.pagination || null);
  };

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const nextWorkOrderId = await loadWorkOrders();
      await loadReports(nextWorkOrderId);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to load field reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (selectedWorkOrderId) {
      loadReports(selectedWorkOrderId).catch((err) => {
        setError(err?.response?.data?.error || err?.message || "Unable to load field reports.");
      });
    }
  }, [selectedWorkOrderId, page, perPage]);

  const openDetail = async (report) => {
    setSelectedReport(report);
    setDetailOpen(true);
    try {
      const res = await getPlanVsReported(report.id);
      setComparison(res || null);
    } catch (err) {
      setComparison(null);
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to compare planned and reported materials.", { variant: "error" });
    }
  };

  const handleClarification = async () => {
    if (!selectedReport) return;
    try {
      await requestFieldReportClarification(selectedReport.id);
      enqueueSnackbar("Clarification requested.", { variant: "success" });
      setDetailOpen(false);
      await loadReports(selectedWorkOrderId);
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to request clarification.", { variant: "error" });
    }
  };

  const handleReject = async () => {
    if (!selectedReport) return;
    try {
      await rejectFieldReport(selectedReport.id);
      enqueueSnackbar("Field report rejected.", { variant: "success" });
      setDetailOpen(false);
      await loadReports(selectedWorkOrderId);
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to reject report.", { variant: "error" });
    }
  };

  const handleCreateReview = async () => {
    if (!selectedReport || !selectedWorkOrderId) return;
    try {
      const res = await createWorkOrderReview(selectedWorkOrderId, { field_report_id: selectedReport.id });
      enqueueSnackbar("Review created.", { variant: "success" });
      setDetailOpen(false);
      if (onNavigate) onNavigate("finance-reviews");
      return res;
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to create review.", { variant: "error" });
      return null;
    }
  };

  return (
    <Stack spacing={2.5}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between">
          <FormControl size="small" sx={{ minWidth: 280 }}>
            <InputLabel>Work order</InputLabel>
            <Select label="Work order" value={selectedWorkOrderId} onChange={(e) => { setSelectedWorkOrderId(e.target.value); setPage(1); }}>
              {workOrders.map((workOrder) => (
                <MenuItem key={workOrder.id} value={workOrder.id}>
                  {workOrder.work_order_number} • {workOrder.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="outlined" onClick={loadAll}>Refresh</Button>
        </Stack>
      </Paper>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : reports.length === 0 ? (
        <FinanceEmptyState
          title="No field reports for this work order"
          description="No reports submitted yet."
        />
      ) : (
        <Paper variant="outlined" sx={{ overflowX: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Submitted</TableCell>
                <TableCell>Team member</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Completed</TableCell>
                <TableCell>Reported materials</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id} hover>
                  <TableCell>{report.submitted_at || report.created_at || "-"}</TableCell>
                  <TableCell>{report.submitted_by_name || report.submitted_by_recruiter_name || report.submitted_by_recruiter_id || "-"}</TableCell>
                  <TableCell><FinanceStatusChip status={report.status} /></TableCell>
                  <TableCell>{report.completed ? "Yes" : "No"}</TableCell>
                  <TableCell>{Array.isArray(report.materials) ? report.materials.length : 0}</TableCell>
                  <TableCell align="right"><Button size="small" onClick={() => openDetail(report)}>Open</Button></TableCell>
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

      <FieldReportDetailDialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        report={selectedReport}
        comparison={comparison}
        onClarification={handleClarification}
        onReject={handleReject}
        onCreateReview={handleCreateReview}
      />
    </Stack>
  );
}
