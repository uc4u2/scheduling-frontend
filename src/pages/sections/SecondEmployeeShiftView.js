// ─────────────────────────────────────────────────────────────────────────
//  SecondEmployeeShiftView.js  •  Employee self-service: Shifts + Leave + Swap + Manager Approvals
// ─────────────────────────────────────────────────────────────────────────
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
  Modal,
  Stack,
  Tooltip,
  Switch,
} from "@mui/material";
import { format, parseISO, differenceInMinutes, addDays } from "date-fns";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import { STATUS } from "../../utils/shiftSwap";
import { POLL_MS } from "../../utils/shiftSwap";

import ShiftSwapPanel from "../../components/ShiftSwapPanel";
import IncomingSwapRequests from "../../components/IncomingSwapRequests";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const SecondEmployeeShiftView = () => {
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole") || ""; // Example role storage

  const isManager = userRole.toLowerCase() === "manager";
  const [optOut, setOptOut] = useState(false);

  // ──────────────── Shift / leave states ────────────────
  const [shifts, setShifts] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Leave-request dialog
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [leaveForm, setLeaveForm] = useState({
    leave_type: "sick",
    reason: "",
    override_hours: "",
    is_paid_leave: true,
  });
  const [submittingLeave, setSubmittingLeave] = useState(false);

  // ──────────────── Swap states ────────────────
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapTargetShiftId, setSwapTargetShiftId] = useState(null);
  const [swapMsg, setSwapMsg] = useState("");
  const [swappableShifts, setSwappableShifts] = useState([]);
  const [scopeWeek, setScopeWeek] = useState(false); 
  const [pendingSwaps, setPendingSwaps] = useState([]);
  const [showSwapHistory, setShowSwapHistory] = useState(false);

  // Manager approvals toggle
  const [showSwapApprovals, setShowSwapApprovals] = useState(false);

  // Employee “My Swap Requests” toggle moved inside drawer
  const [showMySwapRequests, setShowMySwapRequests] = useState(false);

  // Snackbar feedback (shared)
  const [snackbar, setSnackbar] = useState({ open: false, msg: "", error: false });

 // ───────────────────────────────────────────────────────
//  Fetch helpers
// ───────────────────────────────────────────────────────
const authHeader = { Authorization: `Bearer ${token}` };

const loadShifts = async () => {
  try {
    const today = format(new Date(), "yyyy-MM-dd");
    const in30 = format(addDays(new Date(), 30), "yyyy-MM-dd");
    const res = await fetch(
      `${API_URL}/recruiter/calendar?start_date=${today}&end_date=${in30}`,
      { headers: authHeader }
    );

    const { events = [] } = await res.json();

    const shiftEvents = events
      .filter((e) => e.type === "shift")
      .map((e) => ({
        id: e.shift_id,
        clock_in: e.start,
        clock_out: e.end,
        is_locked: e.is_locked ?? false,
        swap_status: e.swap_status,
        on_leave: e.on_leave,
        leave_type: e.leave_type,
        leave_subtype: e.leave_subtype,
        leave_status: e.leave_status,
        override_hours: e.override_hours,
      }));

    setShifts(shiftEvents);
  } catch (err) {
    setErrorMsg("Failed to fetch your shifts.");
  } finally {
    setLoading(false);
  }
};

const loadPendingSwaps = async (showHistory = false) => {
  try {
    const statusFilter = showHistory ? "" : "?status=pending,executed";
    const res = await fetch(`${API_URL}/shift-swap-requests${statusFilter}`, {
      headers: authHeader,
    });
    const data = await res.json();
    setPendingSwaps(data);
  } catch (_) {
    setPendingSwaps([]);
  }
};

const loadOptOut = async () => {
  try {
    const res = await fetch(`${API_URL}/employee/swap-opt-out`, {
      headers: authHeader,
    });
    const data = await res.json();
    setOptOut(Boolean(data.opt_out));
  } catch {
    /* if call fails, keep default = false */
  }
};

const loadSwappableShifts = async (shiftId, scope = "week") => {
  try {
    const res = await fetch(
      `${API_URL}/employee/swappable-shifts?shift_id=${shiftId}&scope=${scope}`,
      { headers: authHeader }
    );
    const data = await res.json();
    setSwappableShifts(data);
  } catch (_) {
    setSwappableShifts([]);
  }
};

useEffect(() => {
  loadShifts();
  loadPendingSwaps(showSwapHistory);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [userId]);

useEffect(() => {
  const intervalId = setInterval(() => {
    loadShifts();
    loadPendingSwaps(showSwapHistory);
  }, POLL_MS); // <--- use the shared constant!
  return () => clearInterval(intervalId);
}, [showSwapHistory]);

// ───────────────────────────────────────────────────────
//  Leave-request logic

  // ───────────────────────────────────────────────────────
  const openLeaveForm = (shift) => {
    setSelectedShift(shift);
    setLeaveForm({
      leave_type: "sick",
      reason: "",
      override_hours: "",
      is_paid_leave: true,
    });
    setLeaveModalOpen(true);
  };

  const submitLeaveRequest = async () => {
    setSubmittingLeave(true);
    try {
      const res = await fetch(`${API_URL}/employee/leave-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify({
          shift_id: selectedShift.id,
          leave_type: leaveForm.leave_type,
          leave_subtype: leaveForm.leave_subtype,
          reason: leaveForm.reason,
          start: selectedShift.clock_in,
          end: selectedShift.clock_out,
          is_paid_leave: leaveForm.is_paid_leave,
          override_hours: leaveForm.override_hours || null,
          top_up_percent: leaveForm.top_up_percent,
          top_up_cap: leaveForm.top_up_cap,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setSnackbar({ open: true, msg: "Leave request submitted.", error: false });
      setLeaveModalOpen(false);
      loadShifts();
    } catch (err) {
      setSnackbar({ open: true, msg: err.message, error: true });
    } finally {
      setSubmittingLeave(false);
    }
  };

  // ───────────────────────────────────────────────────────
  //  Swap logic
  // ───────────────────────────────────────────────────────

  const fireEmail = async (swapId) => {
    if (!swapId) return;
    try {
      await axios.post(
        `${API_URL}/shift-swap-requests/${swapId}/send-email`,
        {},
        { headers: authHeader }
      );
      setSnackbar({ open: true, msg: "Swap request e-mail sent!", error: false });
    } catch {
      setSnackbar({ open: true, msg: "Swap created but e-mail failed.", error: true });
    }
  };

  const openSwapModal = (shift) => {
    setSelectedShift(shift);
    setSwapTargetShiftId(null);
    setSwapMsg("");
    setSwapModalOpen(true);
    loadSwappableShifts(
    shift.id,
     scopeWeek ? "week" : "month"          // fallback is month now
    );
    loadPendingSwaps(showSwapHistory);
  };

  const handleSwapRequest = async () => {
    try {
      const res = await axios.post(
        `${API_URL}/shift-swap-requests`,
        {
          from_shift_id: selectedShift.id,
          target_shift_id: swapTargetShiftId,
          message: swapMsg,
        },
        { headers: authHeader }
      );

      await fireEmail(res.data?.swap_id);
      setSwapModalOpen(false);
      loadPendingSwaps(showSwapHistory);
      loadShifts();
    } catch (err) {
  if (err.response?.status === 409 && err.response.data?.swap_id) {
    await fireEmail(err.response.data.swap_id);
    setSwapModalOpen(false);
  } else {
    setSnackbar({
      open: true,
      msg: err.response?.data?.error || "Swap failed",
      error: true,
    });
  }
}

  };

  const cancelSwap = async (swapId) => {
    try {
      await axios.delete(`${API_URL}/shift-swap-requests/${swapId}`, {
        headers: authHeader,
      });
      setSnackbar({ open: true, msg: "Swap cancelled.", error: false });
      loadPendingSwaps(showSwapHistory);
      loadShifts();
    } catch (_) {
      setSnackbar({ open: true, msg: "Cancel failed", error: true });
    }
  };

  // ───────────────────────────────────────────────────────
  //  Render helpers
  // ───────────────────────────────────────────────────────
  const durationChip = (shift) => {
    const start = parseISO(shift.clock_in);
    const end = parseISO(shift.clock_out);
    const mins = differenceInMinutes(end, start);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return shift.override_hours
      ? `⏱️ ${shift.override_hours}h (override)`
      : `⏱️ ${h}h ${m}m`;
  };

  const swapStatusChip = (shift) => {
  if (!shift.swap_status) return null;
  return (
    <Tooltip title={STATUS[shift.swap_status]?.label || shift.swap_status}>
      <Chip
        label={`Swap: ${STATUS[shift.swap_status]?.label || shift.swap_status}`}
        color={STATUS[shift.swap_status]?.chip || "default"}
        size="small"
        sx={{ mt: 1, mr: 1 }}
      />
    </Tooltip>
  );
};


  //  Component markup
// ───────────────────────────────────────────────────────
return (
  <>
    {/* Top-level button */}
    <Button
      variant="outlined"
      startIcon={<CalendarMonthIcon />}
      onClick={() => setDrawerOpen(true)}
      sx={{ mb: 2 }}
    >
      View My Shifts
    </Button>
    
    {/* Manager-only toggle for approvals */}
    {isManager && (
      <Button
        variant="outlined"
        color={showSwapApprovals ? "secondary" : "primary"}
        onClick={() => setShowSwapApprovals(!showSwapApprovals)}
        sx={{ mb: 2, ml: 1 }}
      >
        {showSwapApprovals ? "Hide" : "Show"} Swap Approvals
      </Button>
    )}

    {/* ─────────────── Drawer ─────────────── */}
    <Drawer
      anchor="right"
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      PaperProps={{ sx: { width: { xs: "100%", sm: 420 }, p: 3 } }}
    >
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" fontWeight="bold">
          👤 My Shifts
        </Typography>
        <IconButton onClick={() => setDrawerOpen(false)}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/*  ➤ Opt-out toggle */}
      <FormControlLabel
        sx={{ mt: 2 }}
        control={
          <Switch
            checked={optOut}
            onChange={async (e) => {
              const val = e.target.checked;
              setOptOut(val);
              try {
                await axios.put(
                  `${API_URL}/employee/swap-opt-out`,
                  { opt_out: val },
                  { headers: authHeader }
                );
              } catch {
                setOptOut(!val); // rollback
                setSnackbar({
                  open: true,
                  msg: "Failed to save preference.",
                  error: true,
                });
              }
            }}
          />
        }
        label="Hide my shifts from swap offers"
      />

      {/* “My Swaps” toggle (non-managers) */}
      {!isManager && (
        <Button
          size="small"
          variant="outlined"
          sx={{ ml: 1, mt: 2, mb: 2 }}
          onClick={() => setShowMySwapRequests(!showMySwapRequests)}
        >
          {showMySwapRequests ? "Hide" : "Show"} My Swaps
        </Button>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Shifts list, loading & error blocks */}
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
            const end   = parseISO(shift.clock_out);
            const disabledSwap =
              shift.is_locked || shift.swap_status === "pending";

            return (
              <Grid item xs={12} key={shift.id}>
                <Card elevation={2} sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                    >
                      {format(start, "EEE, MMM d")}
                    </Typography>

                    <Typography variant="body1" fontWeight="bold">
                      {shift.on_leave
                        ? "⛔ On Leave"
                        : `🕒 ${format(start, "HH:mm")} – ${format(
                            end,
                            "HH:mm"
                          )}`}
                    </Typography>

                    {/* Chips */}
                    {shift.on_leave && (
                      <Chip
                        label={`Leave: ${shift.leave_type}${
                          shift.leave_subtype
                            ? ` – ${shift.leave_subtype}`
                            : ""
                        } (${shift.leave_status})`}
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
                    {swapStatusChip(shift)}
                    <Chip
                      label={durationChip(shift)}
                      color="primary"
                      size="small"
                      sx={{ mt: 1 }}
                    />

                    {/* Action buttons */}
                    {!shift.on_leave && (
                      <>
                        <Button
                          size="small"
                          variant="outlined"
                          sx={{ mt: 1, mr: 1 }}
                          onClick={() => openLeaveForm(shift)}
                        >
                          Request Leave
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="secondary"
                          sx={{ mt: 1 }}
                          onClick={() => openSwapModal(shift)}
                          disabled={disabledSwap}
                        >
                          Request Swap
                        </Button>
                        {disabledSwap && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ ml: 1 }}
                          >
                            Shift finalised
                          </Typography>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Incoming requests (non-manager) */}
      {!isManager && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Incoming Swap Requests
          </Typography>
          <IncomingSwapRequests token={token} />
        </>
      )}
    </Drawer>

      {/* Leave dialog */}
      <Dialog
        open={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {/* Leave form markup as before */}
        <DialogTitle>Request Leave</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Leave Type"
            fullWidth
            margin="normal"
            value={leaveForm.leave_type}
            onChange={(e) =>
              setLeaveForm({ ...leaveForm, leave_type: e.target.value, leave_subtype: "" })
            }
          >
            <MenuItem value="sick">Sick</MenuItem>
            <MenuItem value="vacation">Vacation</MenuItem>
            <MenuItem value="personal">Personal</MenuItem>
            <MenuItem value="emergency">Emergency</MenuItem>
            <MenuItem value="family">Family / Parental</MenuItem>
          </TextField>

          {leaveForm.leave_type === "family" && (
            <TextField
              select
              label="Subtype"
              fullWidth
              margin="normal"
              value={leaveForm.leave_subtype || ""}
              onChange={(e) => setLeaveForm({ ...leaveForm, leave_subtype: e.target.value })}
            >
              <MenuItem value="maternity">Maternity</MenuItem>
              <MenuItem value="paternity">Paternity</MenuItem>
              <MenuItem value="parental">Parental</MenuItem>
              <MenuItem value="adoption">Adoption</MenuItem>
            </TextField>
          )}

          <TextField
            label="Reason"
            fullWidth
            margin="normal"
            multiline
            minRows={2}
            value={leaveForm.reason}
            onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
          />

          {leaveForm.leave_type === "family" && leaveForm.leave_subtype && (
            <>
              <TextField
                label="Employer Top-up %"
                type="number"
                fullWidth
                margin="normal"
                value={leaveForm.top_up_percent || ""}
                onChange={(e) => setLeaveForm({ ...leaveForm, top_up_percent: e.target.value })}
                InputProps={{ endAdornment: <Typography sx={{ ml: 0.5 }}>%</Typography> }}
              />
              <TextField
                label="Top-up Cap (per pay)"
                type="number"
                fullWidth
                margin="normal"
                value={leaveForm.top_up_cap || ""}
                onChange={(e) => setLeaveForm({ ...leaveForm, top_up_cap: e.target.value })}
                InputProps={{ startAdornment: <Typography sx={{ mr: 0.5 }}>$</Typography> }}
              />
            </>
          )}

          <TextField
            label="Override Hours (optional)"
            type="number"
            fullWidth
            margin="normal"
            value={leaveForm.override_hours}
            onChange={(e) => setLeaveForm({ ...leaveForm, override_hours: e.target.value })}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={leaveForm.is_paid_leave}
                onChange={(e) => setLeaveForm({ ...leaveForm, is_paid_leave: e.target.checked })}
              />
            }
            label="Paid Leave"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLeaveModalOpen(false)}>Cancel</Button>
          <Button onClick={submitLeaveRequest} disabled={submittingLeave} variant="contained">
            Submit
          </Button>
        </DialogActions>
      </Dialog>

            {/* Swap modal */}
      <Modal open={swapModalOpen} onClose={() => setSwapModalOpen(false)}>
        {/* Swap modal markup unchanged */}
        <Box
          sx={{
            p: 3,
            bgcolor: "background.paper",
            borderRadius: 2,
            mx: "auto",
            my: "10%",
            width: 420,
            maxWidth: "90vw",
          }}
        >
          <Typography variant="h6" mb={2}>
            Request Shift Swap
          </Typography>
          // inside the Swap modal, above the select
<FormControlLabel
  control={
    <Switch
      checked={scopeWeek}
      onChange={(e) => {
        setScopeWeek(e.target.checked);
        loadSwappableShifts(selectedShift.id, e.target.checked ? "week" : "day");
      }}
    />
  }
  label="Limit to this week"
/>

          <TextField
            select
            fullWidth
            label="Swap With Shift"
            value={swapTargetShiftId || ""}
            onChange={(e) => setSwapTargetShiftId(Number(e.target.value))}
          >
            {swappableShifts.length === 0 && (
              <MenuItem disabled value="">
                No eligible shifts found
              </MenuItem>
            )}
            {swappableShifts.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {format(parseISO(s.clock_in), "MMM d HH:mm")} –{" "}
                {format(parseISO(s.clock_out), "HH:mm")} ({s.recruiter_name})
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            label="Message (optional)"
            multiline
            rows={2}
            margin="normal"
            value={swapMsg}
            onChange={(e) => setSwapMsg(e.target.value)}
          />

          <FormControlLabel
            control={
              <Switch
                checked={showSwapHistory}
                onChange={(e) => {
                  setShowSwapHistory(e.target.checked);
                  loadPendingSwaps(e.target.checked);
                }}
              />
            }
            label="Show swap history"
            sx={{ mb: 1, mt: 2 }}
          />

          {pendingSwaps.length > 0 && (
            <>
              <Typography variant="subtitle2" mt={2}>
                My Pending Swaps
              </Typography>
              <Stack spacing={1} mt={1} sx={{ maxHeight: 160, overflow: "auto" }}>
                {pendingSwaps.map((sw) => (
                  <Paper
                    key={sw.id}
                    variant="outlined"
                    sx={{ p: 1, display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2">
                      #{sw.id} → Shift&nbsp;{sw.target_shift_id} ({sw.status})
                    </Typography>
                    {/* Show Cancel only if this user is the requester */}
                    {sw.status === "pending" && sw.is_requester && (
                      <Button size="small" color="error" onClick={() => cancelSwap(sw.id)}>
                        Cancel
                      </Button>
                    )}
                  </Paper>
                ))}
              </Stack>
            </>
          )}

          <Stack direction="row" justifyContent="flex-end" spacing={2} mt={3}>
            <Button onClick={() => setSwapModalOpen(false)}>Close</Button>
            <Button
              variant="contained"
              disabled={!swapTargetShiftId}
              onClick={handleSwapRequest}
            >
              Submit Swap
            </Button>
          </Stack>
        </Box>
      </Modal>

      {/* Manager Swap Approvals panel (only for managers) */}
      {isManager && showSwapApprovals && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Shift Swap Approvals
          </Typography>
          <ShiftSwapPanel token={token} headerStyle={{ fontWeight: "bold" }} />
        </>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.error ? "error" : "success"}>{snackbar.msg}</Alert>
      </Snackbar>
    </>
  );
};

export default SecondEmployeeShiftView;
