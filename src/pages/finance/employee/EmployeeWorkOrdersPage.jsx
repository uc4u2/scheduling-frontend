import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
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
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useLocation, useNavigate } from "react-router-dom";
import RecruiterTabs from "../../../components/recruiter/RecruiterTabs";
import ManagementFrame from "../../../components/ui/ManagementFrame";
import useRecruiterTabsAccess from "../../../components/recruiter/useRecruiterTabsAccess";
import { listMyWorkOrders, updateMyWorkOrderDispatchStatus } from "../financeApi";
import FinanceStatusChip from "../components/FinanceStatusChip";
import FinancePagination from "../components/FinancePagination";
import EmployeeFinanceEmptyState from "./EmployeeFinanceEmptyState";
import EmployeeWorkOrderDetailDialog from "./EmployeeWorkOrderDetailDialog";
import EmployeeFieldReportDialog from "./EmployeeFieldReportDialog";

const assignmentPreview = (assignments = [], timezone = "") => {
  if (!assignments.length) return "No assignment details";
  const first = assignments[0];
  return `${first.work_date || "No date"}${first.start_time ? ` • ${first.start_time}` : ""}${first.end_time ? ` to ${first.end_time}` : ""}${first.timezone || timezone ? ` • ${first.timezone || timezone}` : ""}`;
};

export default function EmployeeWorkOrdersPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const location = useLocation();
  const role = typeof window !== "undefined" ? (localStorage.getItem("role") || "").toLowerCase() : "";
  const managerViewingEmployee = role === "manager" && location.pathname.startsWith("/employee");
  const { allowHrAccess, isLoading: tabsLoading } = useRecruiterTabsAccess();
  const [workOrders, setWorkOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const [detailSection, setDetailSection] = useState("");
  const [dispatchBusyId, setDispatchBusyId] = useState(null);

  const handleLocalTabChange = (value) => {
    const basePath = location.pathname.startsWith("/recruiter") ? "/recruiter/dashboard" : "/employee/dashboard";
    navigate(`${basePath}?tab=${value}`);
  };

  const openMyFieldReports = () => {
    navigate(location.pathname.startsWith("/recruiter") ? "/recruiter/field-reports" : "/employee/field-reports");
  };

  const openDetail = (workOrder, section = "") => {
    setSelectedWorkOrder(workOrder);
    setDetailSection(section);
    setDetailOpen(true);
  };

  const handleDispatchAction = async (workOrder, status) => {
    if (!workOrder?.id) return;
    setDispatchBusyId(workOrder.id);
    try {
      await updateMyWorkOrderDispatchStatus(workOrder.id, { status });
      await load();
      if (selectedWorkOrder?.id === workOrder.id) {
        setSelectedWorkOrder((prev) => ({ ...prev, dispatch: { ...(prev?.dispatch || {}), status } }));
      }
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to update trip status.");
    } finally {
      setDispatchBusyId(null);
    }
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const workOrdersRes = await listMyWorkOrders({ page, per_page: perPage });
      setWorkOrders(Array.isArray(workOrdersRes?.items) ? workOrdersRes.items : []);
      setPagination(workOrdersRes?.pagination || null);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to load your work orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, perPage]);

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
        ) : isMobile ? (
          <Stack spacing={1.5}>
            {workOrders.map((workOrder) => (
              <Paper key={workOrder.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body1" fontWeight={800}>{workOrder.work_order_number}</Typography>
                      <Typography variant="body2" color="text.secondary">{workOrder.title}</Typography>
                    </Box>
                    <FinanceStatusChip status={workOrder.status} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">{workOrder.location || "No location set"}</Typography>
                  <Typography variant="body2" color="text.secondary">{assignmentPreview(workOrder.assignments, workOrder.timezone)}</Typography>
                  {workOrder.employee_visible_notes ? (
                    <Typography variant="body2" color="text.secondary">{workOrder.employee_visible_notes}</Typography>
                  ) : null}
                  <Typography variant="caption" color="text.secondary">
                    Planned materials: {Array.isArray(workOrder.planned_materials) ? workOrder.planned_materials.length : 0}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Button size="small" variant="outlined" onClick={() => openDetail(workOrder)}>
                      Open
                    </Button>
                    <Button size="small" variant="outlined" onClick={() => openDetail(workOrder, "photos")}>
                      Add photo
                    </Button>
                    {String(workOrder?.dispatch?.status || "").toLowerCase() === "on_my_way" ? (
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        disabled={dispatchBusyId === workOrder.id}
                        onClick={() => handleDispatchAction(workOrder, "arrived")}
                      >
                        {dispatchBusyId === workOrder.id ? "Working..." : "Arrived"}
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        variant="contained"
                        sx={{ color: "#0f172a", fontWeight: 800 }}
                        disabled={dispatchBusyId === workOrder.id}
                        onClick={() => handleDispatchAction(workOrder, "on_my_way")}
                      >
                        {dispatchBusyId === workOrder.id ? "Working..." : "On my way"}
                      </Button>
                    )}
                    {workOrder.status === "completed" ? (
                      <Button size="small" variant="outlined" onClick={openMyFieldReports}>My Field Reports</Button>
                    ) : (
                      <Button size="small" variant="contained" onClick={() => { setSelectedWorkOrder(workOrder); setReportOpen(true); }}>Submit Field Report</Button>
                    )}
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
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
                        <Button size="small" variant="outlined" onClick={() => openDetail(workOrder, "photos")}>Add photo</Button>
                        {workOrder.status === "completed" ? (
                          <Button size="small" variant="outlined" onClick={openMyFieldReports}>My Field Reports</Button>
                        ) : (
                          <Button size="small" variant="contained" onClick={() => { setSelectedWorkOrder(workOrder); setReportOpen(true); }}>Submit Field Report</Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}
      </Stack>

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

      <EmployeeWorkOrderDetailDialog
        open={detailOpen}
        workOrderId={selectedWorkOrder?.id}
        initialSection={detailSection}
        onClose={() => {
          setDetailOpen(false);
          setDetailSection("");
        }}
        onViewReports={openMyFieldReports}
        onSubmitReport={(workOrder) => {
          setDetailOpen(false);
          setDetailSection("");
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
