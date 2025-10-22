// src/pages/sections/PayrollDownloadPage.js

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Paper,
  Divider
} from "@mui/material";
import axios from "axios";

const PayrollDownloadPage = () => {
  const { id } = useParams();
  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchPayroll = async () => {
      try {
        const res = await axios.get(`${API_URL}/main/payroll_portal_metadata/${id}`);
        setPayroll(res.data);
      } catch (err) {
        console.error("Payroll fetch failed", err);
        setError("Payroll not found or inaccessible.");
      } finally {
        setLoading(false);
      }
    };

    fetchPayroll();
  }, [id, API_URL]);

  const handleDownload = async () => {
    try {
      const res = await fetch(`${API_URL}/main/payroll_portal_download/${id}`);
      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = payroll?.file_name || `payroll-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download payroll", err);
      setError("Failed to download the payroll file.");
    }
  };

  if (loading) {
    return (
      <Box sx={{ mt: 5, textAlign: "center" }}>
        <CircularProgress />
        <Typography mt={2}>Loading payroll document...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 5, textAlign: "center" }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Payslip for {payroll.recruiter_name}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="body1">
          <strong>Month:</strong> {payroll.month}
        </Typography>
        <Typography variant="body1">
          <strong>Pay Period:</strong> {payroll.start_date} to {payroll.end_date}
        </Typography>
        <Typography variant="body1">
          <strong>Gross Pay:</strong> ${payroll.gross_pay?.toFixed(2)}
        </Typography>
        <Typography variant="body1">
          <strong>Net Pay:</strong> ${payroll.net_pay?.toFixed(2)}
        </Typography>
        <Typography variant="body1" gutterBottom>
          <strong>Deductions:</strong>{" "}
          {payroll.total_deductions ? `$${payroll.total_deductions.toFixed(2)}` : "N/A"}
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ textAlign: "center" }}>
          <Button variant="contained" onClick={handleDownload}>
            Download PDF
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default PayrollDownloadPage;
