import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import RecruiterTabs from "../../../components/recruiter/RecruiterTabs";
import ManagementFrame from "../../../components/ui/ManagementFrame";
import useRecruiterTabsAccess from "../../../components/recruiter/useRecruiterTabsAccess";
import { listMyWorkOrders } from "../financeApi";
import FinanceStatusChip from "../components/FinanceStatusChip";
import EmployeeFinanceEmptyState from "./EmployeeFinanceEmptyState";
import EmployeeWorkOrderDetailDialog from "./EmployeeWorkOrderDetailDialog";
import EmployeeFieldReportDialog from "./EmployeeFieldReportDialog";

const assignmentPreview = (assignments = [], timezone = "") => {
  if (!assignments.length) return "No assignment details";
  const first = assignments[0];
  return `${first.work_date || "No date"}${first.start_time ? ` • ${first.start_time}` : ""}${first.end_time ? ` to ${first.end_time}` : ""}${first.timezone || timezone ? ` • ${first.timezone || timezone}` : ""}`;
};

export default function EmployeeWorkOrdersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = typeof window !== "undefined" ? (localStorage.getItem("role") || "").toLowerCase() : "";
  const managerViewingEmployee = role === "manager" && location.pathname.startsWith("/employee");
  const { allowHrAccess, isLoading: tabsLoading } = useRecruiterTabsAccess();
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);

  const handleLocalTabChange = (value) => {
    const basePath = location.pathname.startsWith("/recruiter") ? "/recruiter/dashboard" : "/employee/dashboard";
    navigate(`${basePath}?tab=${value}`);
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const workOrdersRes = await listMyWorkOrders();
      setWorkOrders(Array.isArray(workOrdersRes?.items) ? workOrdersRes.items : []);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to load your work orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <ManagementFrame title="My Work Orders" subtitle="See your assigned jobs and send updates from the field." fullWidth sx={{ minHeight: "100vh", px: { xs: 1, md: 2 } }} disableContentCard contentSx={{ p: 0 }}>
      <RecruiterTabs localTab="work-orders" onLocalTabChange={handleLocalTabChange} allowHrAccess={allowHrAccess} isLoading={tabsLoading} />
      <Stack spacing={2} sx={{ mt: 2 }}>
        {managerViewingEmployee ? <Alert severity="info">Viewing Employee Workspace (Manager Mode)</Alert> : null}
        {loading ? (
          <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : workOrders.length === 0 ? (
          <EmployeeFinanceEmptyState title="No work orders assigned" description="Assigned jobs will show up here with your work instructions and planned materials." />
        ) : (
          <Paper variant="outlined" sx={{ overflowX: "auto" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Work order</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Assigned time</TableCell>
                  <TableCell>Instructions</TableCell>
                  <TableCell>Planned materials</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workOrders.map((workOrder) => (
                  <TableRow key={workOrder.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>{workOrder.work_order_number}</Typography>
                      <Typography variant="body2" color="text.secondary">{workOrder.title}</Typography>
                    </TableCell>
                    <TableCell><FinanceStatusChip status={workOrder.status} /></TableCell>
                    <TableCell>{workOrder.location || "-"}</TableCell>
                    <TableCell>{assignmentPreview(workOrder.assignments, workOrder.timezone)}</TableCell>
                    <TableCell>{workOrder.employee_visible_notes || "-"}</TableCell>
                    <TableCell>{Array.isArray(workOrder.planned_materials) ? workOrder.planned_materials.length : 0}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" onClick={() => { setSelectedWorkOrder(workOrder); setDetailOpen(true); }}>Open</Button>
                        <Button size="small" variant="contained" onClick={() => { setSelectedWorkOrder(workOrder); setReportOpen(true); }}>Submit Field Report</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}
      </Stack>

      <EmployeeWorkOrderDetailDialog
        open={detailOpen}
        workOrderId={selectedWorkOrder?.id}
        onClose={() => setDetailOpen(false)}
        onSubmitReport={(workOrder) => {
          setDetailOpen(false);
          setSelectedWorkOrder(workOrder || selectedWorkOrder);
          setReportOpen(true);
        }}
      />
      <EmployeeFieldReportDialog
        open={reportOpen}
        workOrder={selectedWorkOrder}
        onClose={() => setReportOpen(false)}
        onSubmitted={async () => {
          setReportOpen(false);
          await load();
        }}
      />
    </ManagementFrame>
  );
}
