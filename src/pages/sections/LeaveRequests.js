import React, { useEffect, useState } from "react";
import api from "../../utils/api";
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
  Stack,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { format } from "date-fns";

const LeaveRequests = () => {
  const theme = useTheme();
  const isMobileCards = useMediaQuery("(max-width:900px)");
  const token = localStorage.getItem("token");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [reviewComments, setReviewComments] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, msg: "", error: false });

  useEffect(() => {
    api
      .get(`/manager/leave-requests?status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const data = res.data || {};
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
      const res = await api.post(
        `/manager/leave-review`,
        { request_id: id, action, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = res?.data || {};

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

      {/* status filter */}
      <Select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        sx={{ mb: 2 }}
      >
        <MenuItem value="pending">Pending</MenuItem>
        <MenuItem value="approved">Approved</MenuItem>
        <MenuItem value="rejected">Rejected</MenuItem>
      </Select>

      {loading ? (
        <Box mt={4} display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      ) : (
        isMobileCards ? (
          <Stack spacing={1.25}>
            {requests.map((r) => (
              <Paper key={r.id} sx={{ p: 1.5, border: `1px solid ${theme.palette.divider}` }}>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography fontWeight={700}>{r.recruiter_name}</Typography>
                    <Chip label={r.status} size="small" />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {r.shift_date} • {r.clock_in} - {r.clock_out}
                  </Typography>
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                    <Chip label={r.leave_type || "Leave"} size="small" variant="outlined" />
                    {r.leave_subtype && <Chip label={r.leave_subtype} size="small" color="info" />}
                    <Chip
                      label={r.is_paid_leave ? "Paid" : "Unpaid"}
                      color={r.is_paid_leave ? "success" : "warning"}
                      size="small"
                    />
                  </Stack>
                  {r.reason && <Typography variant="body2">{r.reason}</Typography>}
                  <TextField
                    size="small"
                    placeholder="Add comment"
                    value={reviewComments[r.id] || ""}
                    onChange={(e) =>
                      setReviewComments({
                        ...reviewComments,
                        [r.id]: e.target.value,
                      })
                    }
                    fullWidth
                  />
                  {statusFilter === "pending" ? (
                    <Stack direction="row" spacing={1}>
                      <Button size="small" onClick={() => handleReview(r.id, "approve")}>
                        Approve
                      </Button>
                      <Button size="small" color="error" onClick={() => handleReview(r.id, "reject")}>
                        Reject
                      </Button>
                    </Stack>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      Reviewed by {r.reviewer_name || "—"} {r.reviewed_at ? `at ${format(new Date(r.reviewed_at), "yyyy-MM-dd HH:mm")}` : ""}
                    </Typography>
                  )}
                </Stack>
              </Paper>
            ))}
          </Stack>
        ) : (
          <Paper>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Recruiter</TableCell>
                  <TableCell>Shift</TableCell>
                  <TableCell>Type</TableCell>
                  {/* NEW */}
                  <TableCell>Subtype</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Paid?</TableCell>
                  <TableCell>Override Hours</TableCell>
                  {/* NEW */}
                  <TableCell>Top-up</TableCell>
                  <TableCell>Reviewed By</TableCell>
                  <TableCell>Reviewed At</TableCell>
                  <TableCell>Comment</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.recruiter_name}</TableCell>

                    <TableCell>
                      {r.shift_date}
                      <br />
                      {r.clock_in} – {r.clock_out}
                    </TableCell>

                    <TableCell>{r.leave_type}</TableCell>

                    {/* NEW ▸ parental subtype */}
                    <TableCell>
                      {r.leave_subtype ? (
                        <Chip
                          label={r.leave_subtype}
                          size="small"
                          color="info"
                        />
                      ) : (
                        "—"
                      )}
                    </TableCell>

                    <TableCell>{r.reason}</TableCell>

                    <TableCell>
                      <Chip
                        label={r.is_paid_leave ? "Paid" : "Unpaid"}
                        color={r.is_paid_leave ? "success" : "warning"}
                        size="small"
                      />
                    </TableCell>

                    <TableCell>{r.override_hours || "—"}</TableCell>

                    {/* NEW ▸ employer top-up display */}
                    <TableCell>
                      {r.top_up_percent || r.top_up_cap ? (
                        <>
                          {r.top_up_percent ? `${r.top_up_percent}%` : "—"}{" "}
                          {r.top_up_cap
                            ? `/ $${Number(r.top_up_cap).toFixed(2)}`
                            : ""}
                        </>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{r.reviewer_name || "—"}</TableCell>
                    <TableCell>
                      {r.reviewed_at ? format(new Date(r.reviewed_at), "yyyy-MM-dd HH:mm") : "—"}
                    </TableCell>

                    <TableCell>
                      <TextField
                        size="small"
                        placeholder="Add comment"
                        value={reviewComments[r.id] || ""}
                        onChange={(e) =>
                          setReviewComments({
                            ...reviewComments,
                            [r.id]: e.target.value,
                          })
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
        )
      )}

      {/* snackbar feedback */}
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
