import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Chip,
  Drawer,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Snackbar,
  Alert,
} from "@mui/material";
import { format, parseISO, differenceInMinutes } from "date-fns";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CloseIcon from "@mui/icons-material/Close";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const SecondEmployeeShiftView = () => {
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  const [shifts, setShifts] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // 1. Add the new states here:
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [form, setForm] = useState({
    leave_type: "sick",
    reason: "",
    override_hours: "",
    is_paid_leave: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, msg: "", error: false });

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const month = format(new Date(), "yyyy-MM");
        const res = await fetch(
          `${API_URL}/automation/shifts/monthly?month=${month}&recruiter_ids=${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();
        setShifts(data.shifts || data || []);
      } catch (err) {
        setErrorMsg("Failed to fetch your shifts.");
      } finally {
        setLoading(false);
      }
    };

    fetchShifts();
  }, [userId, token]);

  // 3. Add open/close logic:
  const openLeaveForm = (shift) => {
    setSelectedShift(shift);
    setForm({
      leave_type: "sick",
      reason: "",
      override_hours: "",
      is_paid_leave: true,
    });
    setModalOpen(true);
  };

  // 4. Add submit handler:
  const submitLeaveRequest = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/employee/leave-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shift_id: selectedShift.id,
          leave_type: form.leave_type,
          reason: form.reason,
          start: selectedShift.clock_in,
          end: selectedShift.clock_out,
          is_paid_leave: form.is_paid_leave,
          override_hours: form.override_hours || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setSnackbar({ open: true, msg: "Leave request submitted.", error: false });
      setModalOpen(false);
    } catch (err) {
      setSnackbar({ open: true, msg: err.message, error: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<CalendarMonthIcon />}
        onClick={() => setOpen(true)}
        sx={{ mb: 2 }}
      >
        View My Shifts
      </Button>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: { width: { xs: "100%", sm: 400 }, p: 3 },
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight="bold">
            👤 My Shifts
          </Typography>
          <IconButton onClick={() => setOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ my: 2 }} />

        {loading ? (
          <Box display="flex" justifyContent="center" mt={5}>
            <CircularProgress />
          </Box>
        ) : errorMsg ? (
          <Typography color="error">{errorMsg}</Typography>
        ) : shifts.length === 0 ? (
          <Typography>No shifts assigned yet.</Typography>
        ) : (
          <Grid container spacing={2}>
            {shifts.map((shift) => {
              const start = parseISO(shift.clock_in);
              const end = parseISO(shift.clock_out);
              const durationMins = differenceInMinutes(end, start);
              const hours = Math.floor(durationMins / 60);
              const minutes = durationMins % 60;

              return (
                <Grid item xs={12} key={shift.id}>
                  <Card elevation={2} sx={{ borderRadius: 2 }}>
                  <CardContent>
  <Typography variant="subtitle2" color="text.secondary">
    {format(start, "EEE, MMM d")}
  </Typography>

  <Typography variant="body1" fontWeight="bold">
    {shift.on_leave ? "⛔ On Leave" : `🕒 ${format(start, "HH:mm")} – ${format(end, "HH:mm")}`}
  </Typography>

  {shift.on_leave && shift.leave_type && (
    <Chip
      label={`Leave: ${shift.leave_type} (${shift.leave_status})`}
      color={
        shift.leave_status === "approved"
          ? "success"
          : shift.leave_status === "pending"
          ? "warning"
          : "error"
      }
      size="small"
      sx={{ mt: 1, mr: 1 }}
    />
  )}

  <Chip
    label={
      shift.override_hours
        ? `⏱️ ${shift.override_hours}h (override)`
        : `⏱️ ${hours}h ${minutes}m`
    }
    color="primary"
    size="small"
    sx={{ mt: 1 }}
  />

  {!shift.on_leave && (
    <Button
      size="small"
      variant="outlined"
      sx={{ mt: 1 }}
      onClick={() => openLeaveForm(shift)}
    >
      Request Leave
    </Button>
  )}
</CardContent>

                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Drawer>

      {/* 6. Add this modal and snackbar at the end of the return block */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Request Leave</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Leave Type"
            fullWidth
            margin="normal"
            value={form.leave_type}
            onChange={(e) => setForm({ ...form, leave_type: e.target.value })}
          >
            <MenuItem value="sick">Sick</MenuItem>
            <MenuItem value="vacation">Vacation</MenuItem>
            <MenuItem value="personal">Personal</MenuItem>
            <MenuItem value="emergency">Emergency</MenuItem>
          </TextField>

          <TextField
            label="Reason"
            fullWidth
            margin="normal"
            multiline
            minRows={2}
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />

          <TextField
            label="Override Hours (optional)"
            type="number"
            fullWidth
            margin="normal"
            value={form.override_hours}
            onChange={(e) => setForm({ ...form, override_hours: e.target.value })}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={form.is_paid_leave}
                onChange={(e) =>
                  setForm({ ...form, is_paid_leave: e.target.checked })
                }
              />
            }
            label="Paid Leave"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button
            onClick={submitLeaveRequest}
            disabled={submitting}
            variant="contained"
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.error ? "error" : "success"}>
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SecondEmployeeShiftView;
