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
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const tWorkOrders = useMemo(
    () => (key, fallback, options = {}) => t(`manager.finance.workOrders.${key}`, { defaultValue: fallback, ...options }),
    [t]
  );
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
        listManagerClients({ limit: 20 }),
        listEstimates({ limit: 100 }),
      ]);
      setItems(Array.isArray(workOrdersRes?.items) ? workOrdersRes.items : Array.isArray(workOrdersRes) ? workOrdersRes : []);
      setPagination(workOrdersRes?.pagination || null);
      setSummary(summaryRes || {});
      setClients(clientsRes || []);
      setEstimates(Array.isArray(estimatesRes?.items) ? estimatesRes.items : Array.isArray(estimatesRes) ? estimatesRes : []);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || tWorkOrders("errors.loadFailed", "Unable to load work orders."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Search and date filters stay manual via Enter/Refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label={tWorkOrders("metrics.scheduledThisWeek", "Scheduled this week")} value={String(summary?.scheduled_this_week ?? 0)} accent="primary" /></Grid>
        <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label={tWorkOrders("metrics.activeJobs", "Active jobs")} value={String(summary?.active_count ?? 0)} accent="success" /></Grid>
        <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label={tWorkOrders("metrics.completedThisMonth", "Completed this month")} value={String(summary?.completed_this_month ?? 0)} accent="info" /></Grid>
        <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label={tWorkOrders("metrics.plannedLaborThisMonth", "Planned labor this month")} value={formatCurrency(summary?.planned_labor_cost_this_month || 0)} helper={tWorkOrders("metrics.plannedHoursHelper", "{{count}} planned hours", { count: summary?.planned_labor_hours_this_month ?? 0 })} accent="secondary" /></Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between">
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField
              size="small"
              label={tWorkOrders("toolbar.searchLabel", "Search jobs")}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              onKeyDown={(e) => {
                if (e.key === "Enter") load();
              }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>{tWorkOrders("toolbar.statusLabel", "Status")}</InputLabel>
              <Select label={tWorkOrders("toolbar.statusLabel", "Status")} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                <MenuItem value="">{tWorkOrders("toolbar.allStatuses", "All statuses")}</MenuItem>
                <MenuItem value="draft">{t("manager.finance.shared.statuses.draft", { defaultValue: "Draft" })}</MenuItem>
                <MenuItem value="scheduled">{t("manager.finance.shared.statuses.scheduled", { defaultValue: "Scheduled" })}</MenuItem>
                <MenuItem value="in_progress">{t("manager.finance.shared.statuses.in_progress", { defaultValue: "In Progress" })}</MenuItem>
                <MenuItem value="completed">{t("manager.finance.shared.statuses.completed", { defaultValue: "Completed" })}</MenuItem>
                <MenuItem value="closed">{t("manager.finance.shared.statuses.closed", { defaultValue: "Closed" })}</MenuItem>
                <MenuItem value="cancelled">{t("manager.finance.shared.statuses.cancelled", { defaultValue: "Cancelled" })}</MenuItem>
              </Select>
            </FormControl>
            <ThemedDateField label={tWorkOrders("toolbar.startDate", "Start date")} name="start_date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} fullWidth={false} sx={{ minWidth: 170 }} />
            <ThemedDateField label={tWorkOrders("toolbar.endDate", "End date")} name="end_date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} fullWidth={false} sx={{ minWidth: 170 }} />
            <Button variant="outlined" onClick={load}>{tWorkOrders("toolbar.refresh", "Refresh")}</Button>
          </Stack>
          <Button variant="contained" onClick={() => { setPrefillEstimate(null); setEditorOpen(true); }}>{tWorkOrders("toolbar.newWorkOrder", "New Work Order")}</Button>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
        <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>{tWorkOrders("statusSummary.title", "Jobs by status")}</Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} flexWrap="wrap">
          {Object.entries(countByStatus).length ? Object.entries(countByStatus).map(([key, value]) => (
            <Stack key={key} direction="row" spacing={1} alignItems="center">
              <FinanceStatusChip status={key} />
              <Typography variant="body2">{value}</Typography>
            </Stack>
          )) : <Typography variant="body2" color="text.secondary">{tWorkOrders("statusSummary.empty", "No work order activity yet.")}</Typography>}
        </Stack>
      </Paper>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
      ) : items.length === 0 ? (
        <FinanceEmptyState
          title={tWorkOrders("empty.title", "No work orders yet")}
          description={tWorkOrders("empty.description", "Create jobs manually or from an estimate, then assign the team by daily rows.")}
          actionLabel={tWorkOrders("empty.action", "Create work order")}
          onAction={() => { setPrefillEstimate(null); setEditorOpen(true); }}
        />
      ) : (
        <Paper variant="outlined" sx={{ overflowX: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{tWorkOrders("table.headers.workOrderNumber", "Work order #")}</TableCell>
                <TableCell>{tWorkOrders("table.headers.title", "Title")}</TableCell>
                <TableCell>{tWorkOrders("table.headers.client", "Client")}</TableCell>
                <TableCell>{tWorkOrders("table.headers.status", "Status")}</TableCell>
                <TableCell>{tWorkOrders("table.headers.schedule", "Schedule")}</TableCell>
                <TableCell>{tWorkOrders("table.headers.assignments", "Assignments")}</TableCell>
                <TableCell>{tWorkOrders("table.headers.plannedHours", "Planned hours")}</TableCell>
                <TableCell>{tWorkOrders("table.headers.plannedLabor", "Planned labor")}</TableCell>
                <TableCell>{tWorkOrders("table.headers.materials", "Materials")}</TableCell>
                <TableCell align="right">{tWorkOrders("table.headers.actions", "Actions")}</TableCell>
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
                  <TableCell>{item.start_date || "-"}{item.end_date ? ` ${tWorkOrders("table.to", "to")} ${item.end_date}` : ""}</TableCell>
                  <TableCell>{item.assignment_count ?? 0}</TableCell>
                  <TableCell>{item.planned_labor_hours ?? 0}</TableCell>
                  <TableCell>{formatCurrency(item.planned_labor_cost || 0)}</TableCell>
                  <TableCell>{item.material_plan_count ?? 0}</TableCell>
                  <TableCell align="right"><Button size="small" onClick={(e) => { e.stopPropagation(); setDetailId(item.id); }}>{tWorkOrders("table.open", "Open")}</Button></TableCell>
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
        onSaved={async () => { setEditorOpen(false); setPrefillEstimate(null); await load(); enqueueSnackbar(tWorkOrders("snackbar.saved", "Work order saved."), { variant: "success" }); if (onNavigate) onNavigate("finance-work-orders"); }}
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
