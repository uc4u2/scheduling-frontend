import React, { useState, useEffect } from "react";
import axios from "axios";
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
  Drawer,
  Divider,
  Stack,
} from "@mui/material";
import { useDepartments, useEmployeesByDepartment } from "./hooks/useRecruiterDepartments";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function PayrollRawPage() {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : "";
  const departments = useDepartments();
  const employees = useEmployeesByDepartment();

  // Filters
  const [recruiterId, setRecruiterId] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [region, setRegion] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [month, setMonth] = useState("");

  // Data + pagination
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);
  const [detailRow, setDetailRow] = useState(null);

  const fetchRows = async (pageOverride) => {
    const currentPage = pageOverride || page;
    if (!startDate || !endDate) return;

    setLoading(true);
    try {
      const params = {
        page: currentPage,
        page_size: pageSize,
        finalized_only: true,
        start_date: startDate,
        end_date: endDate,
      };
      if (recruiterId) params.recruiter_id = recruiterId;
      if (region) params.region = region;
      if (month) params.month = month;
      if (selectedDept) params.department_id = selectedDept;

      const res = await axios.get(`${API_URL}/automation/payroll/raw`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setRows(res.data?.rows || []);
      setPage(res.data?.page || currentPage);
      setTotalRows(res.data?.total_rows || 0);
    } catch (err) {
      console.error("Raw payroll fetch failed", err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (fmt) => {
    if (!startDate || !endDate) return;
    try {
      const params = new URLSearchParams();
      params.append("start_date", startDate);
      params.append("end_date", endDate);
      params.append("format", fmt);
      if (recruiterId) params.append("recruiter_id", recruiterId);
      if (region) params.append("region", region);
      if (month) params.append("month", month);
      if (selectedDept) params.append("department_id", selectedDept);
      params.append("summary", "true");
      const url = `${API_URL}/automation/payroll/export-finalized?${params.toString()}`;
      const resp = await axios.get(url, {
        responseType: "blob",
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = new Blob([resp.data], { type: resp.headers["content-type"] });
      const a = document.createElement("a");
      a.href = window.URL.createObjectURL(blob);
      a.download = `payroll_raw.${fmt}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error("Export failed", err?.response?.data || err.message);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchRows(1);
  };

  const handlePageChange = (_, newPage) => {
    setPage(newPage);
    fetchRows(newPage);
  };

  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

  useEffect(() => {
    // Wait for user to click “Load data” to avoid auto-loading on page mount.
  }, []);

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Payroll Detail / Raw Data
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Accountant view: one row per finalized payroll period. Use filters, then export via existing CSV/XLSX endpoints.
      </Typography>
      <Box display="flex" gap={1} mb={2} flexWrap="wrap">
        <Button variant="outlined" size="small" onClick={() => handleExport("csv")} disabled={!startDate || !endDate}>
          Export CSV
        </Button>
        <Button variant="outlined" size="small" onClick={() => handleExport("xlsx")} disabled={!startDate || !endDate}>
          Export Excel
        </Button>
      </Box>

      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="dept-label">Department</InputLabel>
            <Select
              labelId="dept-label"
              label="Department"
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setRecruiterId("");
              }}
            >
              <MenuItem value="">
                <em>All Departments</em>
              </MenuItem>
              {(departments || []).map((d) => (
                <MenuItem key={d.id} value={String(d.id)}>
                  {d.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="employee-label">Employee</InputLabel>
            <Select
              labelId="employee-label"
              label="Employee"
              value={recruiterId}
              onChange={(e) => setRecruiterId(e.target.value)}
            >
              <MenuItem value="">
                <em>All Employees</em>
              </MenuItem>
              {(employees[selectedDept] || employees.all || []).map((emp) => {
                const displayName =
                  emp.name ||
                  [emp.first_name, emp.last_name].filter(Boolean).join(" ") ||
                  emp.full_name ||
                  emp.email ||
                  `#${emp.id}`;
                return (
                  <MenuItem key={emp.id} value={String(emp.id)}>
                    {displayName}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="region-label">Region</InputLabel>
            <Select
              labelId="region-label"
              label="Region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="ca">Canada</MenuItem>
              <MenuItem value="qc">Quebec</MenuItem>
              <MenuItem value="us">US</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} sm={2}>
          <TextField
            label="Start date"
            type="date"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </Grid>
        <Grid item xs={6} sm={2}>
          <TextField
            label="End date"
            type="date"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </Grid>
        <Grid item xs={6} sm={2}>
          <TextField
            label="Month (YYYY-MM)"
            size="small"
            fullWidth
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Button fullWidth variant="contained" onClick={handleSearch} sx={{ height: "100%" }}>
            Load data
          </Button>
        </Grid>
      </Grid>

      <Paper elevation={1}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Region</TableCell>
                <TableCell>Period</TableCell>
                <TableCell align="right">Rate</TableCell>
                <TableCell align="right">Hours</TableCell>
                <TableCell align="right">Reg Hrs</TableCell>
                <TableCell align="right">OT Hrs</TableCell>
                <TableCell align="right">Regular Pay</TableCell>
                <TableCell align="right">OT Pay</TableCell>
                <TableCell align="right">Holiday Pay</TableCell>
                <TableCell align="right">Bonus</TableCell>
                <TableCell align="right">Commission</TableCell>
                <TableCell align="right">Tip</TableCell>
                <TableCell align="right">Shift Prem.</TableCell>
                <TableCell align="right">Travel Allow.</TableCell>
                <TableCell align="right">Tax Credit</TableCell>
                <TableCell align="right">Family Bonus</TableCell>
                <TableCell align="right">Parental Ins.</TableCell>
                <TableCell align="right">Medical Ins.</TableCell>
                <TableCell align="right">Dental Ins.</TableCell>
                <TableCell align="right">Life Ins.</TableCell>
                <TableCell align="right">Ret (Emp)</TableCell>
                <TableCell align="right">Union Dues</TableCell>
                <TableCell align="right">Garnishment</TableCell>
                <TableCell align="right">Reimb. (Non-tax)</TableCell>
                <TableCell align="right">Other Deduction</TableCell>
                <TableCell align="right">Gross</TableCell>
                <TableCell align="right">Vacation</TableCell>
                <TableCell align="right">Fed Tax</TableCell>
                <TableCell align="right">Prov/State Tax</TableCell>
                <TableCell align="right">CPP/QPP</TableCell>
                <TableCell align="right">EI/RQAP</TableCell>
                <TableCell align="right">FICA</TableCell>
                <TableCell align="right">Medicare</TableCell>
                <TableCell align="right">Total Deductions</TableCell>
                <TableCell align="right">Net Pay</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} hover onClick={() => setDetailRow(row)} sx={{ cursor: "pointer" }}>
                  <TableCell>
                    {row.employee_name} {row.employee_id ? `( #${row.employee_id})` : ""}
                  </TableCell>
                  <TableCell>{row.region?.toUpperCase()}</TableCell>
                  <TableCell>
                    {row.start_date} → {row.end_date}
                  </TableCell>
                  <TableCell align="right">{row.rate}</TableCell>
                  <TableCell align="right">{row.hours_worked}</TableCell>
                  <TableCell align="right">{row.regular_hours}</TableCell>
                  <TableCell align="right">{row.overtime_hours}</TableCell>
                  <TableCell align="right">{row.regular_pay}</TableCell>
                  <TableCell align="right">{row.overtime_pay}</TableCell>
                  <TableCell align="right">{row.holiday_pay}</TableCell>
                  <TableCell align="right">{row.bonus}</TableCell>
                  <TableCell align="right">{row.commission}</TableCell>
                  <TableCell align="right">{row.tip}</TableCell>
                  <TableCell align="right">{row.shift_premium}</TableCell>
                  <TableCell align="right">{row.travel_allowance}</TableCell>
                  <TableCell align="right">{row.tax_credit}</TableCell>
                  <TableCell align="right">{row.family_bonus}</TableCell>
                  <TableCell align="right">{row.parental_insurance}</TableCell>
                  <TableCell align="right">{row.medical_insurance}</TableCell>
                  <TableCell align="right">{row.dental_insurance}</TableCell>
                  <TableCell align="right">{row.life_insurance}</TableCell>
                  <TableCell align="right">{row.retirement_amount}</TableCell>
                  <TableCell align="right">{row.union_dues}</TableCell>
                  <TableCell align="right">{row.garnishment}</TableCell>
                  <TableCell align="right">{row.non_taxable_reimbursement}</TableCell>
                  <TableCell align="right">{row.deduction}</TableCell>
                  <TableCell align="right">{row.gross_pay}</TableCell>
                  <TableCell align="right">{row.vacation_pay}</TableCell>
                  <TableCell align="right">{row.federal_tax_amount}</TableCell>
                  <TableCell align="right">{row.provincial_tax_amount || row.state_tax_amount}</TableCell>
                  <TableCell align="right">{row.cpp_amount || row.qpp_amount || row.cpp || row.qpp}</TableCell>
                  <TableCell align="right">{row.ei_amount || row.rqap_amount || row.ei || row.rqap}</TableCell>
                  <TableCell align="right">{row.fica_amount || row.fica}</TableCell>
                  <TableCell align="right">{row.medicare_amount || row.medicare}</TableCell>
                  <TableCell align="right">{row.total_deductions}</TableCell>
                  <TableCell align="right">
                    <strong>{row.net_pay}</strong>
                  </TableCell>
                </TableRow>
              ))}

              {!loading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    No data. Pick filters and click “Load data”.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {loading && (
          <Box p={2} textAlign="center">
            <CircularProgress size={24} />
          </Box>
        )}

        {totalRows > pageSize && (
          <Box p={2} display="flex" justifyContent="flex-end">
            <Pagination count={totalPages} page={page} onChange={handlePageChange} size="small" />
          </Box>
        )}
      </Paper>

      <Drawer
        anchor="right"
        open={Boolean(detailRow)}
        onClose={() => setDetailRow(null)}
        sx={{ "& .MuiDrawer-paper": { width: { xs: "100%", sm: 420 }, p: 3 } }}
      >
        <Typography variant="h6" gutterBottom>
          Payroll details
        </Typography>
        {detailRow ? (
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Employee
              </Typography>
              <Typography fontWeight={700}>
                {detailRow.employee_name} {detailRow.employee_id ? `( #${detailRow.employee_id})` : ""}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {detailRow.region?.toUpperCase()} {detailRow.province ? `• ${detailRow.province}` : ""}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Period: {detailRow.start_date} → {detailRow.end_date} ({detailRow.pay_frequency || "biweekly"})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Status: {detailRow.status || "finalized"}
              </Typography>
            </Box>

            <Divider />
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Earnings
              </Typography>
              <Stack spacing={0.5}>
                <Typography variant="body2">Rate: ${detailRow.rate}</Typography>
                <Typography variant="body2">Hours: {detailRow.hours_worked} (Reg {detailRow.regular_hours} / OT {detailRow.overtime_hours} / Hol {detailRow.holiday_hours})</Typography>
                {[
                  ["Regular pay", detailRow.regular_pay],
                  ["Overtime pay", detailRow.overtime_pay],
                  ["Holiday pay", detailRow.holiday_pay],
                  ["Vacation pay", detailRow.vacation_pay],
                  ["Bonus", detailRow.bonus],
                  ["Commission", detailRow.commission],
                  ["Tips", detailRow.tip],
                  ["Shift premium", detailRow.shift_premium],
                  ["Travel allowance", detailRow.travel_allowance],
                  ["Tax credit", detailRow.tax_credit],
                  ["Family bonus", detailRow.family_bonus],
                  ["Parental insurance", detailRow.parental_insurance],
                  ["Non-taxable reimbursement", detailRow.non_taxable_reimbursement],
                ]
                  .filter(([, v]) => Number(v) !== 0)
                  .map(([label, v]) => (
                    <Typography key={label} variant="body2">
                      {label}: ${v}
                    </Typography>
                  ))}
                <Typography variant="body2" fontWeight={700}>
                  Gross: ${detailRow.gross_pay}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Vacation taxable?: {detailRow.include_vacation_in_gross ? "Yes" : "No"}
                </Typography>
              </Stack>
            </Box>

            <Divider />
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Employee deductions
              </Typography>
              <Stack spacing={0.5}>
                {[
                  ["Federal tax", detailRow.federal_tax_amount],
                  ["Provincial/State tax", detailRow.provincial_tax_amount || detailRow.state_tax_amount],
                  ["CPP/QPP", detailRow.cpp_amount || detailRow.qpp_amount],
                  ["EI", detailRow.ei_amount],
                  ["RQAP", detailRow.rqap_amount],
                  ["FICA", detailRow.fica_amount],
                  ["Medicare", detailRow.medicare_amount],
                  ["Health insurance", detailRow.medical_insurance],
                  ["Dental insurance", detailRow.dental_insurance],
                  ["Life insurance", detailRow.life_insurance],
                  ["Retirement (employee)", detailRow.retirement_amount],
                  ["Union dues", detailRow.union_dues],
                  ["Garnishment", detailRow.garnishment],
                  ["Other deduction", detailRow.deduction],
                ]
                  .filter(([, v]) => Number(v) !== 0)
                  .map(([label, v]) => (
                    <Typography key={label} variant="body2">
                      {label}: ${v}
                    </Typography>
                  ))}
                <Typography variant="body2" fontWeight={700}>
                  Total deductions: ${detailRow.total_deductions}
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  Net pay: ${detailRow.net_pay}
                </Typography>
              </Stack>
            </Box>

            <Divider />
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Employer taxes & contributions
              </Typography>
              <Stack spacing={0.5}>
                {[
                  ["CPP employer", detailRow.cpp_employer],
                  ["QPP employer", detailRow.qpp_employer],
                  ["EI employer", detailRow.ei_employer],
                  ["RQAP employer", detailRow.rqap_employer],
                  ["FICA employer", detailRow.fica_employer],
                  ["Medicare employer", detailRow.medicare_employer],
                  ["Retirement (employer)", detailRow.retirement_employer],
                ]
                  .filter(([, v]) => Number(v) !== 0)
                  .map(([label, v]) => (
                    <Typography key={label} variant="body2">
                      {label}: ${v}
                    </Typography>
                  ))}
              </Stack>
            </Box>

            <Divider />
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Audit & sync
              </Typography>
              <Stack spacing={0.5}>
                <Typography variant="body2">Payroll ID: {detailRow.id}</Typography>
                <Typography variant="body2">BPA applied: ${detailRow.bpa_applied}</Typography>
                <Typography variant="body2">BPA remaining: ${detailRow.bpa_remaining}</Typography>
                <Typography variant="body2">Created at: {detailRow.created_at || "-"}</Typography>
                <Typography variant="body2">Finalized at: {detailRow.finalized_at || "-"}</Typography>
                <Typography variant="body2">
                  QuickBooks synced: {detailRow.synced_quickbooks ? "Yes" : "No"} {detailRow.quickbooks_journal_id ? `(${detailRow.quickbooks_journal_id})` : ""}
                </Typography>
                <Typography variant="body2">
                  Xero synced: {detailRow.synced_xero ? "Yes" : "No"} {detailRow.xero_manual_journal_id ? `(${detailRow.xero_manual_journal_id})` : ""}
                </Typography>
              </Stack>
            </Box>
          </Stack>
        ) : null}
      </Drawer>
    </Box>
  );
}
