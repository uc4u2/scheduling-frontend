import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  Button,
  TextField,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { format } from "date-fns";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const LeaveRequests = () => {
  const token = localStorage.getItem("token");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [reviewComments, setReviewComments] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, msg: "", error: false });

  useEffect(() => {
    fetch(`${API_URL}/manager/leave-requests?status=${statusFilter}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setRequests(data.requests || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setSnackbar({ open: true, msg: "Failed to load leave requests.", error: true });
        setLoading(false);
      });
  }, [statusFilter]);

  const handleReview = async (id, action) => {
    const comment = reviewComments[id] || "";

    try {
      const res = await fetch(`${API_URL}/manager/leave-review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ request_id: id, action, comment }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");

      setSnackbar({ open: true, msg: `Leave ${action}ed.`, error: false });
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setSnackbar({ open: true, msg: err.message, error: true });
    }
  };

  if (loading) {
    return (
      <Box mt={4} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        📋 Leave Requests
      </Typography>

      <Select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        sx={{ mb: 2 }}
      >
        <MenuItem value="pending">Pending</MenuItem>
        <MenuItem value="approved">Approved</MenuItem>
        <MenuItem value="rejected">Rejected</MenuItem>
      </Select>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Recruiter</TableCell>
              <TableCell>Shift</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Paid?</TableCell>
              <TableCell>Override Hours</TableCell>
              <TableCell>Comment</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.recruiter_name}</TableCell>
                <TableCell>
                  {r.shift_date} <br />
                  {r.clock_in} – {r.clock_out}
                </TableCell>
                <TableCell>{r.leave_type}</TableCell>
                <TableCell>{r.reason}</TableCell>
                <TableCell>
                  <Chip
                    label={r.is_paid_leave ? "Paid" : "Unpaid"}
                    color={r.is_paid_leave ? "success" : "warning"}
                    size="small"
                  />
                </TableCell>
                <TableCell>{r.override_hours || "—"}</TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    placeholder="Add comment"
                    value={reviewComments[r.id] || ""}
                    onChange={(e) =>
                      setReviewComments({ ...reviewComments, [r.id]: e.target.value })
                    }
                  />
                </TableCell>
                <TableCell>
                  {statusFilter === "pending" ? (
                    <>
                      <Button
                        size="small"
                        onClick={() => handleReview(r.id, "approve")}
                      >
                        ✅ Approve
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleReview(r.id, "reject")}
                      >
                        ❌ Reject
                      </Button>
                    </>
                  ) : (
                    <Chip label={r.status} size="small" />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.error ? "error" : "success"}>
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LeaveRequests;
