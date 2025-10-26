import React, { useState, useEffect } from "react";
import {
  Box, Typography, Tabs, Tab, CircularProgress, Button,
  Table, TableBody, TableCell, TableHead, TableRow, Paper, Alert,
  Dialog, DialogTitle, DialogContent, TextField, DialogActions
} from "@mui/material";
import axios from "axios";
import dayjs from "dayjs";
import InteractiveCalendar from "./InteractiveCalendar";
import ShiftCalendar from "./ShiftCalendar"; // or correct relative path

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const EmployeeScheduling = () => {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [shiftLogs, setShiftLogs] = useState([]);
  const [hourlyRate, setHourlyRate] = useState(null);
  const [payroll, setPayroll] = useState([]);
  const [error, setError] = useState("");
  const [leaveModal, setLeaveModal] = useState(false);
  const [availabilityModal, setAvailabilityModal] = useState(false);
  const [leaveData, setLeaveData] = useState({ from: "", to: "", reason: "" });
  const [availabilityData, setAvailabilityData] = useState({ days: "", time: "" });

  const token = localStorage.getItem("access_token");
  const recruiterId = localStorage.getItem("user_id");
  console.log("🧪 recruiterId from localStorage:", recruiterId);
  const month = dayjs().format("YYYY-MM");
  const region = "ca"; // placeholder

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (token) {
      fetchShifts();
      fetchRate();
      fetchPayroll();
    }
  }, []);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/automation/shifts/monthly?month=${month}&recruiter_id=${recruiterId}`, { headers });
      console.log("✅ Loaded shiftLogs:", res.data);
      setShiftLogs(res.data || []);
    } catch (err) {
      setError("❌ Could not load shifts.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRate = async () => {
    try {
      const res = await axios.get(`${API_URL}/automation/rates/latest?recruiter_id=${recruiterId}`, { headers });
      setHourlyRate(res.data);
    } catch (err) {
      setError("❌ Could not fetch rate info.");
    }
  };

  const fetchPayroll = async () => {
    try {
      const res = await axios.get(`${API_URL}/payroll?month=${month}&region=${region}&recruiter_id=${recruiterId}`, { headers });
      setPayroll(res.data.records || []);
    } catch (err) {
      setError("❌ Payroll could not be loaded.");
    }
  };

  const exportPayroll = async (format = "pdf") => {
    try {
      const res = await axios.get(`${API_URL}/payroll/export?recruiter_id=${recruiterId}&format=${format}`, {
        headers,
        responseType: "blob",
      });
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Payslip_${month}.${format}`;
      a.click();
    } catch (err) {
      alert("Export failed.");
    }
  };

  const handleLeaveSubmit = async () => {
    try {
      await axios.post(`${API_URL}/employee/leave-request`, { ...leaveData, recruiter_id: recruiterId }, { headers });
      alert("Leave request submitted.");
      setLeaveModal(false);
    } catch (err) {
      alert("Error submitting leave request.");
    }
  };

  const handleAvailabilitySubmit = async () => {
    try {
      await axios.post(`${API_URL}/employee/availability`, { ...availabilityData, recruiter_id: recruiterId }, { headers });
      alert("Availability updated.");
      setAvailabilityModal(false);
    } catch (err) {
      alert("Error saving availability.");
    }
  };

  return (
    <Box p={4}>
      <Typography variant="h5" gutterBottom>
        My Schedule & Payroll
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Tabs value={tab} onChange={(_, t) => setTab(t)} sx={{ mb: 2 }} variant="scrollable" scrollButtons>
        <Tab label="Shift Calendar" />
        <Tab label="Shift Logs" />
        <Tab label="Hourly Rate" />
        <Tab label="Payroll" />
        <Tab label="Request Leave" />
        <Tab label="Edit Availability" />
      </Tabs>

      {tab === 0 && <ShiftCalendar shiftLogs={shiftLogs} />}

      {tab === 1 && (
        <Box>
          {loading ? <CircularProgress /> : (
            <Table component={Paper}>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Clock In</TableCell>
                  <TableCell>Clock Out</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shiftLogs.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.date}</TableCell>
                    <TableCell>{s.clock_in}</TableCell>
                    <TableCell>{s.clock_out}</TableCell>
                    <TableCell>{s.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      )}

      {tab === 2 && (
        <Box>
          {hourlyRate ? (
            <>
              <Typography>Rate: ${hourlyRate.rate}/hr</Typography>
              <Typography>Effective Date: {hourlyRate.effective_date}</Typography>
            </>
          ) : <Typography>No rate found.</Typography>}
        </Box>
      )}

      {tab === 3 && (
        <Box>
          {payroll.length === 0 ? (
            <Typography>No payroll records.</Typography>
          ) : (
            <>
              <Table component={Paper}>
                <TableHead>
                  <TableRow>
                    <TableCell>Gross Pay</TableCell>
                    <TableCell>Tax</TableCell>
                    <TableCell>Net</TableCell>
                    <TableCell>Bonus</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payroll.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell>${p.gross_pay}</TableCell>
                      <TableCell>${p.tax}</TableCell>
                      <TableCell>${p.net_pay}</TableCell>
                      <TableCell>${p.bonus}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Box mt={2}>
                <Button onClick={() => exportPayroll("pdf")}>Download PDF</Button>
                <Button onClick={() => exportPayroll("xlsx")} sx={{ ml: 2 }}>Download Excel</Button>
              </Box>
            </>
          )}
        </Box>
      )}

      {tab === 4 && (
        <Box>
          <Button variant="outlined" onClick={() => setLeaveModal(true)}>Submit Leave Request</Button>
        </Box>
      )}

      {tab === 5 && (
        <Box>
          <Button variant="outlined" onClick={() => setAvailabilityModal(true)}>Edit Availability</Button>
        </Box>
      )}

      {/* Leave Modal */}
      <Dialog open={leaveModal} onClose={() => setLeaveModal(false)}>
        <DialogTitle>Request Leave</DialogTitle>
        <DialogContent>
          <TextField label="From" type="date" fullWidth margin="dense" InputLabelProps={{ shrink: true }}
            onChange={(e) => setLeaveData({ ...leaveData, from: e.target.value })} />
          <TextField label="To" type="date" fullWidth margin="dense" InputLabelProps={{ shrink: true }}
            onChange={(e) => setLeaveData({ ...leaveData, to: e.target.value })} />
          <TextField label="Reason" fullWidth margin="dense"
            onChange={(e) => setLeaveData({ ...leaveData, reason: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLeaveModal(false)}>Cancel</Button>
          <Button onClick={handleLeaveSubmit}>Submit</Button>
        </DialogActions>
      </Dialog>

      {/* Availability Modal */}
      <Dialog open={availabilityModal} onClose={() => setAvailabilityModal(false)}>
        <DialogTitle>Edit Availability</DialogTitle>
        <DialogContent>
          <TextField label="Available Days (e.g. Mon, Wed)" fullWidth margin="dense"
            onChange={(e) => setAvailabilityData({ ...availabilityData, days: e.target.value })} />
          <TextField label="Preferred Time Slots (e.g. 9am-5pm)" fullWidth margin="dense"
            onChange={(e) => setAvailabilityData({ ...availabilityData, time: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAvailabilityModal(false)}>Cancel</Button>
          <Button onClick={handleAvailabilitySubmit}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeScheduling;
