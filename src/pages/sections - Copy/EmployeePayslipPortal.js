// src/pages/sections/EmployeePayslipPortal.js

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  TablePagination,
  Alert,
} from "@mui/material";
import axios from "axios";

const EmployeePayslipPortal = ({ token }) => {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [monthFilter, setMonthFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);

  useEffect(() => {
    fetchPayrolls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthFilter, startDate, endDate, page, rowsPerPage]);

  const fetchPayrolls = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
      };
      if (monthFilter) params.month = monthFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await axios.get(`${API_URL}/main/payroll_portal_list`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      const enriched = await Promise.all(
        (res.data.results || []).map(async (p) => {
          try {
            const meta = await axios.get(`${API_URL}/main/payroll_portal_metadata/${p.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            return { ...p, ...meta.data };
          } catch {
            return p;
          }
        })
      );

      setPayrolls(enriched);
      setTotalRows(res.data.total || 0);
    } catch (err) {
      console.error("Failed to load payrolls", err);
      setError("Unable to retrieve payrolls. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id) => {
    try {
      const res = await fetch(`${API_URL}/main/payroll_portal_download/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payslip-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error", err);
      alert("Unable to download the payslip.");
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Payslips
      </Typography>

      {/* Filters */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
        <TextField
          label="Month"
          type="month"
          size="small"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
        />
        <TextField
          label="Start Date"
          type="date"
          size="small"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="End Date"
          type="date"
          size="small"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <Button onClick={() => fetchPayrolls()} variant="outlined" disabled={loading}>
          Filter
        </Button>
      </Box>

      {loading ? (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
          <Typography mt={2}>Loading your payslips...</Typography>
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Paper elevation={3}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Month</TableCell>
                <TableCell>Pay Period</TableCell>
                <TableCell>Gross</TableCell>
                <TableCell>Net</TableCell>
                <TableCell>Download</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payrolls.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.month}</TableCell>
                  <TableCell>
                    {p.start_date} → {p.end_date}
                  </TableCell>
                  <TableCell>${Number(p.gross_pay || 0).toFixed(2)}</TableCell>
                  <TableCell>${Number(p.net_pay || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <Button size="small" variant="contained" onClick={() => handleDownload(p.id)}>
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            count={totalRows}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </Paper>
      )}
    </Box>
  );
};

export default EmployeePayslipPortal;
