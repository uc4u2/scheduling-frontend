import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
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
import ThemedDateField from "../../components/ui/ThemedDateField";
import { formatCurrency } from "../../utils/formatters";
import WorkOrderEditorDialog from "./WorkOrderEditorDialog";
import WorkOrderDetailDialog from "./WorkOrderDetailDialog";
import {
  getWorkOrdersSummary,
  listEstimates,
  listManagerClients,
  listWorkOrders,
} from "./financeApi";
import FinanceMetricCard from "./components/FinanceMetricCard";
import FinanceStatusChip from "./components/FinanceStatusChip";
import FinanceEmptyState from "./components/FinanceEmptyState";
import FinancePagination from "./components/FinancePagination";

export default function WorkOrdersPage({ createNonce, createSeed, onNavigate }) {
  const { enqueueSnackbar } = useSnackbar();
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({});
  const [clients, setClients] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [prefillEstimate, setPrefillEstimate] = useState(null);
  const [detailId, setDetailId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [workOrdersRes, summaryRes, clientsRes, estimatesRes] = await Promise.all([
        listWorkOrders({
          status: status || undefined,
          q: search || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          page,
          per_page: perPage,
        }),
        getWorkOrdersSummary(),
        listManagerClients(),
        listEstimates({ limit: 100 }),
      ]);
      setItems(Array.isArray(workOrdersRes?.items) ? workOrdersRes.items : Array.isArray(workOrdersRes) ? workOrdersRes : []);
      setPagination(workOrdersRes?.pagination || null);
      setSummary(summaryRes || {});
      setClients(clientsRes || []);
      setEstimates(Array.isArray(estimatesRes?.items) ? estimatesRes.items : Array.isArray(estimatesRes) ? estimatesRes : []);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to load work orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status, page, perPage]);

  useEffect(() => {
    if (createNonce) {
      setPrefillEstimate(createSeed || null);
      setEditorOpen(true);
    }
  }, [createNonce, createSeed]);

  const countByStatus = summary?.count_by_status || {};

  return (
    <Stack spacing={2}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label="Scheduled this week" value={String(summary?.scheduled_this_week ?? 0)} accent="primary" /></Grid>
        <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label="Active jobs" value={String(summary?.active_count ?? 0)} accent="success" /></Grid>
        <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label="Completed this month" value={String(summary?.completed_this_month ?? 0)} accent="info" /></Grid>
        <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label="Planned labor this month" value={formatCurrency(summary?.planned_labor_cost_this_month || 0)} helper={`${summary?.planned_labor_hours_this_month ?? 0} planned hours`} accent="secondary" /></Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between">
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField
              size="small"
              label="Search jobs"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              onKeyDown={(e) => {
                if (e.key === "Enter") load();
              }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                <MenuItem value="">All statuses</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
            <ThemedDateField label="Start date" name="start_date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} fullWidth={false} sx={{ minWidth: 170 }} />
            <ThemedDateField label="End date" name="end_date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} fullWidth={false} sx={{ minWidth: 170 }} />
            <Button variant="outlined" onClick={load}>Refresh</Button>
          </Stack>
          <Button variant="contained" onClick={() => { setPrefillEstimate(null); setEditorOpen(true); }}>New Work Order</Button>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
        <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>Jobs by status</Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} flexWrap="wrap">
          {Object.entries(countByStatus).length ? Object.entries(countByStatus).map(([key, value]) => (
            <Stack key={key} direction="row" spacing={1} alignItems="center">
              <FinanceStatusChip status={key} />
              <Typography variant="body2">{value}</Typography>
            </Stack>
          )) : <Typography variant="body2" color="text.secondary">No work order activity yet.</Typography>}
        </Stack>
      </Paper>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
      ) : items.length === 0 ? (
        <FinanceEmptyState
          title="No work orders yet"
          description="Create jobs manually or from an estimate, then assign the team by daily rows."
          actionLabel="Create work order"
          onAction={() => { setPrefillEstimate(null); setEditorOpen(true); }}
        />
      ) : (
        <Paper variant="outlined" sx={{ overflowX: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Work order #</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Schedule</TableCell>
                <TableCell>Assignments</TableCell>
                <TableCell>Planned hours</TableCell>
                <TableCell>Planned labor</TableCell>
                <TableCell>Materials</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} hover onClick={() => setDetailId(item.id)} sx={{ cursor: "pointer" }}>
                  <TableCell>{item.work_order_number}</TableCell>
                  <TableCell>{item.title}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{item.client_name || "-"}</Typography>
                    <Typography variant="body2" color="text.secondary">{item.client_email || ""}</Typography>
                  </TableCell>
                  <TableCell><FinanceStatusChip status={item.status} /></TableCell>
                  <TableCell>{item.start_date || "-"}{item.end_date ? ` to ${item.end_date}` : ""}</TableCell>
                  <TableCell>{item.assignment_count ?? 0}</TableCell>
                  <TableCell>{item.planned_labor_hours ?? 0}</TableCell>
                  <TableCell>{formatCurrency(item.planned_labor_cost || 0)}</TableCell>
                  <TableCell>{item.material_plan_count ?? 0}</TableCell>
                  <TableCell align="right"><Button size="small" onClick={(e) => { e.stopPropagation(); setDetailId(item.id); }}>Open</Button></TableCell>
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

      <WorkOrderEditorDialog
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSaved={async () => { setEditorOpen(false); setPrefillEstimate(null); await load(); enqueueSnackbar("Work order saved.", { variant: "success" }); if (onNavigate) onNavigate("finance-work-orders"); }}
        clients={clients}
        estimates={estimates}
        prefillEstimate={prefillEstimate}
      />

      <WorkOrderDetailDialog
        open={!!detailId}
        workOrderId={detailId}
        onClose={() => setDetailId(null)}
        onChanged={load}
        clients={clients}
        estimates={estimates}
      />
    </Stack>
  );
}
