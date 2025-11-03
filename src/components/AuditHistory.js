// src/components/AuditHistory.js

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Paper,
} from "@mui/material";
import axios from "axios";
import dayjs from "dayjs";

const AuditHistory = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/payroll/audit-history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Payroll Audit History
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : logs.length === 0 ? (
        <Typography>No audit history found.</Typography>
      ) : (
        <Paper sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Editor</TableCell>
                <TableCell>Recruiter</TableCell>
                <TableCell>Month</TableCell>
                <TableCell>Field</TableCell>
                <TableCell>Old Value</TableCell>
                <TableCell>New Value</TableCell>
                <TableCell>Edited At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log, index) => (
                <TableRow key={index}>
                  <TableCell>{log.edited_by}</TableCell>
                  <TableCell>{log.recruiter_name}</TableCell>
                  <TableCell>{log.month}</TableCell>
                  <TableCell>{log.field}</TableCell>
                  <TableCell>{log.old_value}</TableCell>
                  <TableCell>{log.new_value}</TableCell>
                  <TableCell>{dayjs(log.edited_at).format("YYYY-MM-DD HH:mm")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
};

export default AuditHistory;
