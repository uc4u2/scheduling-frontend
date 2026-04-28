import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { getMyWorkOrder } from "../financeApi";
import FinanceStatusChip from "../components/FinanceStatusChip";

export default function EmployeeWorkOrderDetailDialog({ open, workOrderId, onClose, onSubmitReport }) {
  const [workOrder, setWorkOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!open || !workOrderId) return;
      setLoading(true);
      setError("");
      try {
        const res = await getMyWorkOrder(workOrderId);
        if (!mounted) return;
        setWorkOrder(res?.work_order || res);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.error || err?.message || "Unable to load work order.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [open, workOrderId]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>My Work Order</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : workOrder ? (
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between">
              <Stack spacing={0.5}>
                <Typography variant="h6" fontWeight={800}>{workOrder.work_order_number} • {workOrder.title}</Typography>
                <Typography variant="body2" color="text.secondary">{workOrder.client_name || "Client not shown"}</Typography>
                <Typography variant="body2" color="text.secondary">{workOrder.location || "No location set"}</Typography>
              </Stack>
              <FinanceStatusChip status={workOrder.status} />
            </Stack>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>Assigned date and time</Typography>
              {(workOrder.assignments || []).length ? (
                <Stack spacing={1}>
                  {workOrder.assignments.map((row) => (
                    <Typography key={row.assignment_id} variant="body2">
                      {row.work_date || "No date"}{row.start_time ? ` • ${row.start_time}` : ""}{row.end_time ? ` to ${row.end_time}` : ""}{row.timezone ? ` • ${row.timezone}` : workOrder.timezone ? ` • ${workOrder.timezone}` : ""}
                    </Typography>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">No assignment rows are visible for this job.</Typography>
              )}
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>Instructions</Typography>
              <Typography variant="body2" color="text.secondary">{workOrder.employee_visible_notes || "No employee instructions yet."}</Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>Planned materials</Typography>
              {(workOrder.planned_materials || []).length ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Material</TableCell>
                      <TableCell>Planned quantity</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {workOrder.planned_materials.map((row, index) => (
                      <TableRow key={`planned-material-${index}`}>
                        <TableCell>{row.title}</TableCell>
                        <TableCell>{row.qty_planned}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2" color="text.secondary">No planned materials were shared for this job.</Typography>
              )}
            </Paper>

            <Alert severity="info">Submit a field report when work is done or when the manager needs an update from the field.</Alert>
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button variant="contained" disabled={!workOrder} onClick={() => onSubmitReport?.(workOrder)}>Submit Field Report</Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
