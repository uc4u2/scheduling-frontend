import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import {
  Box,
  Grid,
  TextField,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  Typography,
  Pagination,
  CircularProgress,
  Stack,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useDepartments, useEmployeesByDepartment } from "./hooks/useRecruiterDepartments";
import { formatDateTimeInTz } from "../../utils/datetime";
import { getUserTimezone } from "../../utils/timezone";
import UpgradeNoticeBanner from "../../components/billing/UpgradeNoticeBanner";

export default function PayrollAuditPage() {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : "";
  const departments = useDepartments();
  const [recruiterId, setRecruiterId] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [region, setRegion] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [overwritesOnly, setOverwritesOnly] = useState(false);

  const employeesHook = useEmployeesByDepartment(); // shape: { all: [...], [deptId]: [...] }
  const employeesByDept = employeesHook && typeof employeesHook === "object" ? employeesHook : { all: [] };
  const employees =
    (employeesByDept[selectedDept] ??
      employeesByDept[String(selectedDept)] ??
      employeesByDept.all) || [];

  const coerceUtcIso = (iso) => {
    if (!iso) return iso;
    return /[zZ]|[+-]\d{2}:?\d{2}/.test(iso) ? iso : `${iso}Z`;
  };

  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);
  const [snapshot, setSnapshot] = useState(null);
  const [diff, setDiff] = useState(null);
  const [pdfId, setPdfId] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const userTz = getUserTimezone();

  const fetchRows = async (pageOverride) => {
    const currentPage = pageOverride || page;
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        page_size: pageSize,
        overwrites_only: overwritesOnly,
      };
      if (recruiterId) params.employee_id = recruiterId;
      if (region) params.region = region;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await api.get(`/automation/payroll/audit`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setRows(res.data?.rows || []);
      setPage(res.data?.page || currentPage);
      setTotalRows(res.data?.total_rows || 0);
    } catch (err) {
      console.error("Payroll audit fetch failed", err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recruiterId, region, startDate, endDate, overwritesOnly, pageSize]);

  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));

  const handleDownloadPdf = async (id) => {
    if (!id) return;
    setDownloading(true);
    try {
      const res = await api.get(`/automation/payroll/audit/${id}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: res.headers["content-type"] || "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `payroll_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download failed", err?.response?.data || err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <UpgradeNoticeBanner
        requiredPlan="pro"
        message="Payroll audit features require the Pro plan or higher."
      />
      <Typography variant="h5" gutterBottom fontWeight={700}>
        Payroll Finalization Audit
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Shows who finalized or overwrote a payroll period. Latest entry is the authoritative snapshot.
      </Typography>

      <Grid container spacing={2} sx={{ my: 2 }}>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Department</InputLabel>
            <Select
              label="Department"
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setRecruiterId("");
              }}
            >
              <MenuItem value="">All</MenuItem>
              {departments.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Employee</InputLabel>
            <Select
              label="Employee"
              value={recruiterId}
              onChange={(e) => setRecruiterId(e.target.value)}
            >
              <MenuItem value="">All Employees</MenuItem>
              {employees
                .filter((r) => !selectedDept || String(r.department_id) === String(selectedDept))
                .map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.first_name} {r.last_name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel>Region</InputLabel>
            <Select label="Region" value={region} onChange={(e) => setRegion(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="ca">Canada</MenuItem>
              <MenuItem value="qc">Québec</MenuItem>
              <MenuItem value="us">United States</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            type="date"
            label="Start date"
            fullWidth
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            type="date"
            label="End date"
            fullWidth
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <FormControlLabel
            control={<Switch checked={overwritesOnly} onChange={(e) => setOverwritesOnly(e.target.checked)} />}
            label="Overwrites only"
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <Button variant="outlined" fullWidth onClick={() => fetchRows(1)}>
            Refresh
          </Button>
        </Grid>
      </Grid>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Period</TableCell>
                <TableCell>Region</TableCell>
                <TableCell>Employee</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Finalized By</TableCell>
                <TableCell>Finalized At</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No audit entries yet.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    {row.start_date} → {row.end_date}
                  </TableCell>
                  <TableCell>{row.region?.toUpperCase() || "—"}</TableCell>
                  <TableCell>{row.employee_id}</TableCell>
                  <TableCell>{row.action}</TableCell>
                  <TableCell>{row.finalized_by_email || row.finalized_by_id || "—"}</TableCell>
                  <TableCell>
                    {row.created_at ? formatDateTimeInTz(coerceUtcIso(row.created_at), userTz) : "—"}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setSnapshot(row.snapshot_json || null);
                          setDiff(row.diff_json || null);
                          setPdfId(row.finalized_payroll_id || null);
                        }}
                      >
                        View snapshot
                      </Button>
                      <Button
                        size="small"
                        disabled={downloading}
                        onClick={() => handleDownloadPdf(row.id)}
                      >
                        {downloading ? "Downloading…" : "PDF"}
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </TableContainer>
      )}

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalRows)} of {totalRows}
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Page size</InputLabel>
            <Select
              label="Page size"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {[10, 20, 50, 100].map((n) => (
                <MenuItem key={n} value={n}>
                  {n}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Pagination
            count={pageCount}
            page={page}
            onChange={(_, p) => {
              setPage(p);
              fetchRows(p);
            }}
            showFirstButton
            showLastButton
          />
        </Stack>
      </Stack>
      <Dialog
        open={!!snapshot || !!diff}
        onClose={() => {
          setSnapshot(null);
          setDiff(null);
          setPdfId(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Snapshot / Diff</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" gutterBottom>
            Snapshot
          </Typography>
          <Box component="pre" sx={{ maxHeight: 300, overflow: "auto", p: 1, bgcolor: "grey.100" }}>
            {snapshot ? JSON.stringify(snapshot, null, 2) : "No snapshot"}
          </Box>
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            Diff (old → new)
          </Typography>
          <Box component="pre" sx={{ maxHeight: 300, overflow: "auto", p: 1, bgcolor: "grey.100" }}>
            {diff ? JSON.stringify(diff, null, 2) : "No diff"}
          </Box>
          {pdfId ? (
            <Button
              sx={{ mt: 2 }}
              href={`/main/payroll_portal_download/${pdfId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open PDF
            </Button>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setSnapshot(null);
              setDiff(null);
              setPdfId(null);
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
