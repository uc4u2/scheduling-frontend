import React from "react";
import { Box, Button, Stack } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function PayrollActions({ payroll, onPreview, token }) {
  const handleExport = (format) => {
    const query = new URLSearchParams({
      recruiter_id: payroll.employee_id || payroll.recruiter_id,
      start_date: payroll.start_date,
      end_date: payroll.end_date,
      region: payroll.region || "ca",
      format,
    });

    const url = `${API_URL}/automation/payroll/export?${query.toString()}`;
    window.open(url, "_blank");
  };

  const handleFinalize = async () => {
    try {
      await axios.post(`${API_URL}/api/payroll/submit`, payroll, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert("✅ Payroll successfully finalized and saved.");
    } catch (err) {
      console.error("Failed to finalize payroll:", err);
      alert("❌ Failed to submit payroll.");
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Stack direction="row" spacing={2}>
        <Button
          variant="outlined"
          startIcon={<VisibilityIcon />}
          onClick={onPreview}
        >
          Preview
        </Button>

        <Button
          variant="contained"
          startIcon={<PictureAsPdfIcon />}
          onClick={() => handleExport("pdf")}
        >
          Export PDF
        </Button>

        <Button
          variant="contained"
          color="secondary"
          startIcon={<DownloadIcon />}
          onClick={() => handleExport("csv")}
        >
          Export CSV
        </Button>

        <Button
          variant="contained"
          color="success"
          startIcon={<DoneAllIcon />}
          onClick={handleFinalize}
        >
          Finalize Payroll
        </Button>
      </Stack>
    </Box>
  );
}
