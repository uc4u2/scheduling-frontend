// PayrollHistory.js
import React, { useEffect, useState } from "react";
import { 
  Box, Typography, Button, Table, TableHead, TableRow, 
  TableCell, TableBody, Select, MenuItem, CircularProgress 
} from "@mui/material";
import axios from "axios";
import AuditHistory from "./AuditHistory";

const PayrollHistory = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [showYTD, setShowYTD] = useState(false);
  const [employeeId, setEmployeeId] = useState(null);

  // Get employee/user info for fetching history
  useEffect(() => {
    axios.get("/me").then(res => setEmployeeId(res.data.id));
  }, []);

  useEffect(() => {
    if (employeeId) fetchPayrolls();
    // eslint-disable-next-line
  }, [employeeId, status, showYTD]);

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      // Main endpoint for payroll stubs history
      const res = await axios.get(`/payroll/stub/history/${employeeId}`);
      let data = res.data;
      if (status) data = data.filter(row => row.status === status);

      // Add YTD Net if enabled
      if (showYTD) {
        let runningYTD = 0;
        data = data
          .slice().reverse() // oldest first for YTD calc
          .map(row => {
            runningYTD += row.net_pay;
            return { ...row, ytd_net: runningYTD };
          })
          .reverse(); // display newest first
      }
      setPayrolls(data);
    } catch (err) {
      setPayrolls([]);
    }
    setLoading(false);
  };

  const handleDownload = async (id) => {
    window.open(`/payroll/stub/${id}/download_pdf`, "_blank");
  };

  // For batch download ZIP (manager only)
  const handleBatchDownload = () => {
    window.open(`/payroll/stub/batch_export_zip?employee_id=${employeeId}`, "_blank");
  };

  return (
    <Box>
      <Typography variant="h5">Payroll History</Typography>
      <Box mt={2} display="flex" gap={2}>
        <Select value={status} onChange={e => setStatus(e.target.value)} displayEmpty>
          <MenuItem value="">All Status</MenuItem>
          <MenuItem value="finalized">Finalized</MenuItem>
          <MenuItem value="draft">Draft</MenuItem>
        </Select>
        <Button onClick={() => setShowYTD(!showYTD)} variant="outlined">
          {showYTD ? "Hide YTD" : "Show YTD"}
        </Button>
        <Button onClick={handleBatchDownload} variant="contained" color="primary">
          Download All ZIP
        </Button>
      </Box>
      {loading ? <CircularProgress /> : (
        <Table sx={{ mt: 3 }}>
          <TableHead>
            <TableRow>
              <TableCell>Payroll ID</TableCell>
              <TableCell>Period Start</TableCell>
              <TableCell>Period End</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Gross</TableCell>
              <TableCell>Net</TableCell>
              {showYTD && <TableCell>YTD Net</TableCell>}
              <TableCell>Download</TableCell>
              <TableCell>History</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payrolls.map(row => (
              <TableRow key={row.payroll_id}>
                <TableCell>{row.payroll_id}</TableCell>
                <TableCell>{row.period_start}</TableCell>
                <TableCell>{row.period_end}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell>${row.gross_pay}</TableCell>
                <TableCell>${row.net_pay}</TableCell>
                {showYTD && <TableCell>${row.ytd_net}</TableCell>}
                <TableCell>
                  <Button onClick={() => handleDownload(row.payroll_id)}>PDF</Button>
                </TableCell>
                <TableCell>
                  <AuditHistory recordType="payroll" recordId={row.payroll_id} compact />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
};

export default PayrollHistory;
