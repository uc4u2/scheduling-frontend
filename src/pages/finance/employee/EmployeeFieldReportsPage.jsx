import React, { useEffect, useState } from "react";
import {
  Alert,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
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
import { getFieldReport, listMyFieldReports } from "../financeApi";
import FinanceStatusChip from "../components/FinanceStatusChip";
import FinancePagination from "../components/FinancePagination";
import EmployeeFinanceEmptyState from "./EmployeeFinanceEmptyState";

function FieldReportDetailDialog({ open, onClose, report }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>My Field Report</DialogTitle>
      <DialogContent dividers>
        {report ? (
          <Stack spacing={2}>
            {report.status === "clarification_requested" ? (
              <Alert severity="warning">Your manager requested clarification. Update flow will be added later if backend supports editing.</Alert>
            ) : null}
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Submitted {report.submitted_at || report.created_at || "-"}</Typography>
              <FinanceStatusChip status={report.status} />
            </Stack>
            <Typography variant="body2">Completed: {report.completed ? "Yes" : "No"}</Typography>
            <Typography variant="body2">Work notes: {report.work_notes || "-"}</Typography>
            <Typography variant="body2">Issues found: {report.issues_found || "-"}</Typography>
            <Typography variant="body2">Extra work requested: {report.client_requested_extra_work || "-"}</Typography>
            <Typography variant="body2">Client note: {report.client_note || "-"}</Typography>
            <Typography variant="body2">Files: {Array.isArray(report.files_json) && report.files_json.length ? report.files_json.join(", ") : "No file metadata added."}</Typography>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>Materials reported</Typography>
              {(report.materials || []).length ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Extra</TableCell>
                      <TableCell>Reason</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.materials.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.title}</TableCell>
                        <TableCell>{row.quantity_reported}</TableCell>
                        <TableCell>{row.is_extra ? "Yes" : "No"}</TableCell>
                        <TableCell>{row.reason || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2" color="text.secondary">No materials were reported.</Typography>
              )}
            </Paper>
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
    </Dialog>
  );
}

export default function EmployeeFieldReportsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = typeof window !== "undefined" ? (localStorage.getItem("role") || "").toLowerCase() : "";
  const managerViewingEmployee = role === "manager" && location.pathname.startsWith("/employee");
  const { allowHrAccess, isLoading: tabsLoading } = useRecruiterTabsAccess();
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const handleLocalTabChange = (value) => {
    const basePath = location.pathname.startsWith("/recruiter") ? "/recruiter/dashboard" : "/employee/dashboard";
    navigate(`${basePath}?tab=${value}`);
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listMyFieldReports({ page, per_page: perPage });
      setReports(Array.isArray(res?.items) ? res.items : []);
      setPagination(res?.pagination || null);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to load your field reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, perPage]);

  const openDetail = async (reportId) => {
    try {
      const res = await getFieldReport(reportId);
      setSelectedReport(res?.field_report || res);
      setDetailOpen(true);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to load your field report.");
    }
  };

  return (
    <ManagementFrame title="My Field Reports" subtitle="See what you already sent for manager review." fullWidth sx={{ minHeight: "100vh", px: { xs: 1, md: 2 } }} disableContentCard contentSx={{ p: 0 }}>
      <RecruiterTabs localTab="field-reports" onLocalTabChange={handleLocalTabChange} allowHrAccess={allowHrAccess} isLoading={tabsLoading} />
      <Stack spacing={2} sx={{ mt: 2 }}>
        {managerViewingEmployee ? <Alert severity="info">Viewing Employee Workspace (Manager Mode)</Alert> : null}
        {loading ? (
          <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : reports.length === 0 ? (
          <EmployeeFinanceEmptyState title="No field reports yet" description="Reports you submit from your work orders will show here for manager review." />
        ) : (
          <Paper variant="outlined" sx={{ overflowX: "auto" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Submitted</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Completed</TableCell>
                  <TableCell>Work notes</TableCell>
                  <TableCell>Materials</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id} hover>
                    <TableCell>{report.submitted_at || report.created_at || "-"}</TableCell>
                    <TableCell><FinanceStatusChip status={report.status} /></TableCell>
                    <TableCell>{report.completed ? "Yes" : "No"}</TableCell>
                    <TableCell>{report.work_notes || "-"}</TableCell>
                    <TableCell>{Array.isArray(report.materials) ? report.materials.length : 0}</TableCell>
                    <TableCell align="right"><Button size="small" onClick={() => openDetail(report.id)}>Open</Button></TableCell>
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
      <FieldReportDetailDialog open={detailOpen} onClose={() => setDetailOpen(false)} report={selectedReport} />
    </ManagementFrame>
  );
}
