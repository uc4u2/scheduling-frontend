import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import {
  Box,
  Chip,
  Grid,
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
  Alert,
  Divider,
  Collapse,
} from "@mui/material";
import { useDepartments, useEmployeesByDepartment } from "./hooks/useRecruiterDepartments";
import { formatDateTimeInTz } from "../../utils/datetime";
import { getUserTimezone } from "../../utils/timezone";
import UpgradeNoticeBanner from "../../components/billing/UpgradeNoticeBanner";
import { extractApiErrorMessage } from "../../utils/apiError";
import ThemedDateField from "../../components/ui/ThemedDateField";

export default function PayrollAuditPage() {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : "";
  const departments = useDepartments();
  const [recruiterId, setRecruiterId] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [region, setRegion] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [overwritesOnly, setOverwritesOnly] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(false);

  const employeesHook = useEmployeesByDepartment({ includeArchived }); // shape: { all: [...], [deptId]: [...] }
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
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showRaw, setShowRaw] = useState(false);
  const userTz = getUserTimezone();
  const latestEntryByPeriod = rows.reduce((acc, row) => {
    const key = `${row.employee_id || "na"}|${row.region || "na"}|${row.start_date || "na"}|${row.end_date || "na"}`;
    if (!acc[key]) acc[key] = row.id;
    return acc;
  }, {});

  const fetchRows = async (pageOverride) => {
    const currentPage = pageOverride || page;
    setLoading(true);
    setErrorMessage("");
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
      setErrorMessage(await extractApiErrorMessage(err, "Payroll audit fetch failed."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recruiterId, region, startDate, endDate, overwritesOnly, pageSize]);

  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));

  const actionLabel = (value) => {
    const normalized = String(value || "").toLowerCase();
    if (normalized === "create") return "Created";
    if (normalized === "update") return "Overwritten";
    return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : "Updated";
  };

  const actionColor = (value) => {
    const normalized = String(value || "").toLowerCase();
    if (normalized === "create") return "success";
    if (normalized === "update") return "warning";
    return "default";
  };

  const regionLabel = (value) => {
    const normalized = String(value || "").toLowerCase();
    if (normalized === "ca") return "Canada";
    if (normalized === "qc") return "Québec";
    if (normalized === "us") return "United States";
    if (normalized === "other") return "Other";
    return normalized ? normalized.toUpperCase() : "—";
  };

  const formatValue = (value) => {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(2);
    if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? "" : "s"}`;
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    return String(value);
  };

  const prettyFieldLabel = (field) =>
    String(field || "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

  const selectedAuditDiffEntries = selectedAudit?.diff_json && typeof selectedAudit.diff_json === "object"
    ? Object.entries(selectedAudit.diff_json)
    : [];

  const handleDownloadPdf = async (id) => {
    if (!id) return;
    setDownloading(true);
    setErrorMessage("");
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
      setErrorMessage(await extractApiErrorMessage(err, "PDF download failed."));
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
      {errorMessage && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setErrorMessage("")}>
          {errorMessage}
        </Alert>
      )}

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
          <FormControlLabel
            control={
              <Switch
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
              />
            }
            label="Show archived employees"
          />
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
          <ThemedDateField
            label="Start date"
            fullWidth
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <ThemedDateField
            label="End date"
            fullWidth
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
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
                <TableCell>Status</TableCell>
                <TableCell>Finalized By</TableCell>
                <TableCell>Finalized At</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
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
                  <TableCell>
                    <Chip size="small" variant="outlined" label={regionLabel(row.region)} />
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.25}>
                      <Typography variant="body2" fontWeight={700}>
                        {row.employee_name || `Employee #${row.employee_id}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.employee_email || "—"}
                        {row.employee_department ? ` • ${row.employee_department}` : ""}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" color={actionColor(row.action)} variant="outlined" label={actionLabel(row.action)} />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      variant={latestEntryByPeriod[`${row.employee_id || "na"}|${row.region || "na"}|${row.start_date || "na"}|${row.end_date || "na"}`] === row.id ? "filled" : "outlined"}
                      color={latestEntryByPeriod[`${row.employee_id || "na"}|${row.region || "na"}|${row.start_date || "na"}|${row.end_date || "na"}`] === row.id ? "primary" : "default"}
                      label={
                        latestEntryByPeriod[`${row.employee_id || "na"}|${row.region || "na"}|${row.start_date || "na"}|${row.end_date || "na"}`] === row.id
                          ? "Latest"
                          : "Historical"
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.25}>
                      <Typography variant="body2" fontWeight={700}>
                        {row.actor_name || row.finalized_by_email || row.finalized_by_id || "—"}
                      </Typography>
                      {row.finalized_by_email ? (
                        <Typography variant="caption" color="text.secondary">
                          {row.finalized_by_email}
                        </Typography>
                      ) : null}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {row.created_at ? formatDateTimeInTz(coerceUtcIso(row.created_at), userTz) : "—"}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setSelectedAudit(row);
                          setShowRaw(false);
                        }}
                      >
                        View details
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
        open={!!selectedAudit}
        onClose={() => {
          setSelectedAudit(null);
          setShowRaw(false);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Payroll audit detail</DialogTitle>
        <DialogContent>
          {selectedAudit ? (
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
                <Chip size="small" color={actionColor(selectedAudit.action)} variant="outlined" label={actionLabel(selectedAudit.action)} />
                <Chip
                  size="small"
                  variant={latestEntryByPeriod[`${selectedAudit.employee_id || "na"}|${selectedAudit.region || "na"}|${selectedAudit.start_date || "na"}|${selectedAudit.end_date || "na"}`] === selectedAudit.id ? "filled" : "outlined"}
                  color={latestEntryByPeriod[`${selectedAudit.employee_id || "na"}|${selectedAudit.region || "na"}|${selectedAudit.start_date || "na"}|${selectedAudit.end_date || "na"}`] === selectedAudit.id ? "primary" : "default"}
                  label={latestEntryByPeriod[`${selectedAudit.employee_id || "na"}|${selectedAudit.region || "na"}|${selectedAudit.start_date || "na"}|${selectedAudit.end_date || "na"}`] === selectedAudit.id ? "Latest authoritative snapshot" : "Historical overwrite snapshot"}
                />
                <Chip size="small" variant="outlined" label={regionLabel(selectedAudit.region)} />
              </Stack>

              <Paper variant="outlined" sx={{ p: 1.5 }}>
                <Stack spacing={0.75}>
                  <Typography variant="subtitle2" fontWeight={700}>Summary</Typography>
                  <Typography variant="body2">
                    <strong>Employee:</strong> {selectedAudit.employee_name || `Employee #${selectedAudit.employee_id}`}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Actor:</strong> {selectedAudit.actor_name || selectedAudit.finalized_by_email || selectedAudit.finalized_by_id || "—"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Period:</strong> {selectedAudit.start_date} → {selectedAudit.end_date}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Finalized at:</strong> {selectedAudit.created_at ? formatDateTimeInTz(coerceUtcIso(selectedAudit.created_at), userTz) : "—"}
                  </Typography>
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  What changed
                </Typography>
                {selectedAuditDiffEntries.length ? (
                  <Stack spacing={1}>
                    {selectedAuditDiffEntries.map(([field, delta]) => (
                      <Paper key={field} variant="outlined" sx={{ p: 1.25 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>
                          {prettyFieldLabel(field)}
                        </Typography>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 0.35 }}>
                          <Typography variant="body2">
                            <strong>Before:</strong> {formatValue(delta?.before)}
                          </Typography>
                          <Typography variant="body2">
                            <strong>After:</strong> {formatValue(delta?.after)}
                          </Typography>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No field-level diff was captured for this payroll audit record.
                  </Typography>
                )}
              </Paper>

              <Button
                variant="text"
                size="small"
                onClick={() => setShowRaw((prev) => !prev)}
                sx={{ alignSelf: "flex-start" }}
              >
                {showRaw ? "Hide raw snapshot / diff" : "Show raw snapshot / diff"}
              </Button>
              <Collapse in={showRaw}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Raw snapshot
                    </Typography>
                    <Box component="pre" sx={{ maxHeight: 300, overflow: "auto", p: 1, bgcolor: "grey.100" }}>
                      {JSON.stringify(selectedAudit.snapshot_json || {}, null, 2)}
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Raw diff
                    </Typography>
                    <Box component="pre" sx={{ maxHeight: 300, overflow: "auto", p: 1, bgcolor: "grey.100" }}>
                      {JSON.stringify(selectedAudit.diff_json || {}, null, 2)}
                    </Box>
                  </Box>
                </Stack>
              </Collapse>
              <Divider />
              <Button
                disabled={downloading || !selectedAudit.id}
                onClick={() => handleDownloadPdf(selectedAudit.id)}
              >
                {downloading ? "Downloading…" : "Download PDF snapshot"}
              </Button>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setSelectedAudit(null);
              setShowRaw(false);
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
