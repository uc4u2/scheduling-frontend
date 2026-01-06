import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Alert,
  FormControlLabel,
  Checkbox
} from "@mui/material";
import api from "../../../utils/api";

export default function BookingManagement({ token }) {
  const [bookings, setBookings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [editData, setEditData] = useState({});
  const [managerNote, setManagerNote] = useState("");
  const [msg, setMsg] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);

  // ✅ Load data
  useEffect(() => {
    loadBookings();
    loadEmployees();
  }, [includeArchived]);

  const loadBookings = async () => {
    try {
      const { data } = await api.get(`/api/manager/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(data || []);
    } catch (err) {
      console.error("Failed to load bookings", err);
      setMsg("Error loading bookings.");
    }
  };

  // ✅ Fetch employees like W2.js
  const loadEmployees = async () => {
    try {
      const params = includeArchived ? { include_archived: 1 } : {};
      const res = await api.get(`/manager/recruiters`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setEmployees(res.data.recruiters || []);
    } catch (err) {
      console.error("Failed to load employees", err);
      setMsg("Error loading employee list.");
    }
  };

  // ✅ Open booking details
  const handleView = (b) => {
    setSelected(b);
    setEditData({
      service_id: b.service?.id || "",
      recruiter_id: b.recruiter?.id || "",
      date: b.date || "",
      start_time: b.start_time || ""
    });
    setManagerNote("");
    setMsg("");
  };

  // ✅ Cancel booking
  const handleCancel = async () => {
    if (!selected || !window.confirm("Cancel this booking?")) return;
    try {
      await api.delete(`/api/manager/bookings/${selected.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg("Booking cancelled and client notified.");
      loadBookings();
      setSelected(null);
    } catch {
      setMsg("Failed to cancel booking.");
    }
  };

  // ✅ Mark No Show
  const handleNoShow = async () => {
    if (!selected) return;
    try {
      await api.post(`/api/manager/bookings/${selected.id}/no-show`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg("Marked as No Show.");
      loadBookings();
      setSelected(null);
    } catch {
      setMsg("Failed to mark as no-show.");
    }
  };

  // ✅ Save edits
  const handleSave = async () => {
    if (!selected) return;
    try {
      await api.patch(`/api/manager/bookings/${selected.id}`, editData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg("Booking updated successfully and client notified.");
      loadBookings();
      setSelected(null);
    } catch {
      setMsg("Failed to update booking.");
    }
  };

  // ✅ Reassign employee
  const handleReassign = async () => {
    if (!selected) return;
    try {
      await api.post(`/api/manager/bookings/${selected.id}/reassign`, {
        recruiter_id: editData.recruiter_id
      }, { headers: { Authorization: `Bearer ${token}` } });
      setMsg("Employee reassigned successfully.");
      loadBookings();
      setSelected(null);
    } catch {
      setMsg("Failed to reassign employee.");
    }
  };

  // ✅ Add manager note (employee will see it)
  const handleAddNote = async () => {
    if (!selected) return;
    try {
      await api.post(`/api/manager/bookings/${selected.id}/note`, {
        note: managerNote
      }, { headers: { Authorization: `Bearer ${token}` } });
      setMsg("Manager note added.");
    } catch {
      setMsg("Failed to add note.");
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5">Booking Management</Typography>
      <FormControlLabel
        control={
          <Checkbox
            checked={includeArchived}
            onChange={(e) => setIncludeArchived(e.target.checked)}
          />
        }
        label="Show archived employees"
        sx={{ mt: 1 }}
      />

      {bookings.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>No bookings found.</Alert>
      )}

      {bookings.map((b) => (
        <Box key={b.id} sx={{ border: "1px solid #ccc", p: 1, m: 1 }}>
          <Typography>{b.date} {b.start_time} - {b.end_time}</Typography>
          <Typography>Client: {b.client?.full_name || "N/A"} | {b.client?.email || "N/A"}</Typography>
          <Typography>Provider: {b.recruiter?.full_name || "N/A"}</Typography>
          <Typography>Payment: {b.payment_status || "unpaid"}</Typography>
          <Chip 
            label={b.status || "unknown"} 
            color={
              b.status === "cancelled" 
                ? "error" 
                : b.status === "no-show" 
                ? "warning" 
                : "primary"
            } 
          />
          <Button size="small" sx={{ ml: 2 }} onClick={() => handleView(b)}>Manage</Button>
        </Box>
      ))}

      {/* ✅ Dialog */}
      <Dialog open={!!selected} onClose={() => setSelected(null)} fullWidth maxWidth="sm">
        <DialogTitle>Manage Booking</DialogTitle>
        <DialogContent>
          {selected && (
            <>
              <Typography>Service: {selected.service?.name || "N/A"}</Typography>
              <TextField fullWidth label="Date" value={editData.date}
                onChange={(e) => setEditData({ ...editData, date: e.target.value })} sx={{ mt: 2 }} />
              <TextField fullWidth label="Start Time" value={editData.start_time}
                onChange={(e) => setEditData({ ...editData, start_time: e.target.value })} sx={{ mt: 2 }} />

              {/* ✅ Reassign Employee */}
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Reassign Employee</InputLabel>
                <Select
                  value={editData.recruiter_id || ""}
                  onChange={(e) => setEditData({ ...editData, recruiter_id: e.target.value })}
                >
                  {employees.map((emp) => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} ({emp.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* ✅ Manager Note */}
              <TextField fullWidth label="Manager Note (for employee)" multiline minRows={2}
                value={managerNote} onChange={(e) => setManagerNote(e.target.value)} sx={{ mt: 2 }} />
              <Button sx={{ mt: 1 }} onClick={handleAddNote}>Save Note</Button>

              {msg && <Alert severity="info" sx={{ mt: 2 }}>{msg}</Alert>}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button color="error" onClick={handleCancel}>Cancel</Button>
          <Button color="warning" onClick={handleNoShow}>No Show</Button>
          <Button color="secondary" onClick={handleReassign}>Reassign</Button>
          <Button color="primary" variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
