// AuditHistory.js
import React, { useEffect, useState } from "react";
import { Box, Table, TableHead, TableRow, TableCell, TableBody, Typography } from "@mui/material";
import axios from "axios";

const AuditHistory = ({ recordType, recordId, compact }) => {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let params = {};
    if (recordType && recordId) {
      // For most, action format: e.g. "Paystub 123" or "ROE 4"
      params.action = `${recordType.charAt(0).toUpperCase() + recordType.slice(1)} ${recordId}`;
    }
    axios.get(`/audit/history`, { params })
      .then(res => setRows(res.data));
    // eslint-disable-next-line
  }, [recordType, recordId]);

  if (compact) {
    return (
      <Box>
        <Typography variant="caption" color="text.secondary">History</Typography>
        <ul style={{ margin: 0, padding: 0 }}>
          {rows.slice(0, 2).map((r, idx) => (
            <li key={idx} style={{ fontSize: 11 }}>{r.timestamp} - {r.action}</li>
          ))}
        </ul>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1">Audit Trail</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>User</TableCell>
            <TableCell>Action</TableCell>
            <TableCell>Comment</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              <TableCell>{row.timestamp}</TableCell>
              <TableCell>{row.user_name || row.user_id}</TableCell>
              <TableCell>{row.action}</TableCell>
              <TableCell>{row.comment}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};
export default AuditHistory;
