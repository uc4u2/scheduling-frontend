// ────────────────────────────────────────────────────────────────
//  IncomingSwapRequests.js
//  Employee view – respond to *incoming* swap-requests
// ────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Stack,
  Button,
  Paper,
  Chip,
  Tooltip,
  IconButton,
  CircularProgress,
  Skeleton,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RefreshIcon from "@mui/icons-material/Refresh";
import api from "../utils/api";
import dayjs from "dayjs";
import { STATUS, POLL_MS } from "../utils/shiftSwap";


const POLL_INTERVAL_MS = POLL_MS;


const IncomingSwapRequests = ({ token }) => {
  // ───────────── basic state ─────────────
  const userId = Number(localStorage.getItem("userId"));          // logged-in recruiter ID
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    msg: "",
    error: false,
  });

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  // ───────────── fetch helper ─────────────
  const fetchSwaps = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const qs = showHistory ? "" : "?status=pending,executed";

      const { data } = await api.get(
        `/shift-swap-requests${qs}`,
        { headers }
      );
      setSwaps(data);
    } catch (err) {
      setError(
        err.response?.data?.error || "Unable to fetch swap requests."
      );
    } finally {
      setLoading(false);
    }
  }, [token, showHistory, headers]);

  // initial & polling
  useEffect(() => {
    fetchSwaps();
    const id = setInterval(fetchSwaps, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchSwaps]);

  // ───────────── actions ─────────────
  const respond = async (id, accept) => {
    try {
      await api.put(
        `/shift-swap-requests/${id}/peer-response`,
        { accept },
        { headers }
      );
      setSwaps((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, status: accept ? "peer_accepted" : "denied" }
            : s
        )
      );
      setSnackbar({ open: true, msg: "Response submitted.", error: false });
       } catch (err) {
      setSnackbar({
        open: true,
        msg: err.response?.data?.error || "Failed to submit response.",
        error: true,
      });
    }

  };

  const cancel = async (id) => {
  try {
    await api.delete(`/shift-swap-requests/${id}`, { headers });
    setSwaps((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: "cancelled" } : s
      )
    );
    setSnackbar({ open: true, msg: "Swap cancelled.", error: false });
  } catch (err) {
    setSnackbar({
      open: true,
      msg: err.response?.data?.error || "Failed to cancel request.",
      error: true,
    });
  }
};


  const resendEmail = async (id) => {
    try {
      await api.post(
        `/shift-swap-requests/${id}/send-email`,
        {},
        { headers }
      );
      setSnackbar({ open: true, msg: "E-mail re-sent.", error: false });
    } catch {
      setSnackbar({
        open: true,
        msg: "Could not resend e-mail.",
        error: true,
      });
    }
  };

  // ───────────── UI ─────────────
  return (
    <>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight="bold" flexGrow={1}>
            Shift-Swap Requests
          </Typography>
          {loading ? (
            <CircularProgress size={18} />
          ) : (
            <Tooltip title="Refresh now">
              <IconButton size="small" onClick={fetchSwaps}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </AccordionSummary>

        <AccordionDetails>
          {/* history toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={showHistory}
                onChange={(e) => setShowHistory(e.target.checked)}
              />
            }
            label="Show history"
            sx={{ mb: 2 }}
          />

          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          {/* list */}
          {loading ? (
            [...Array(3)].map((_, i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                height={90}
                sx={{ mb: 2 }}
              />
            ))
          ) : swaps.length === 0 ? (
            <Typography>
              {showHistory
                ? "No swap history."
                : "No active swap requests."}
            </Typography>
          ) : (
            swaps.map((swap) => {
              const created = dayjs(swap.created_at).format("MMM D, HH:mm");

              // who am I in this swap?
              const canRespond = swap.status === "pending" && swap.is_target;
              const canCancel  = swap.status === "pending" && swap.is_requester;




              return (
                <Paper
                  key={swap.id}
                  variant="outlined"
                  sx={{ p: 2, mb: 2, position: "relative" }}
                >
                  {/* status chip */}
                  <Chip
  label={STATUS[swap.status]?.label || swap.status.replace(/_/g, " ")}
  color={STATUS[swap.status]?.chip || "default"}
  size="small"
  sx={{ position: "absolute", top: 8, right: 8 }}
/>


                  <Typography variant="subtitle2" gutterBottom>
                    #{swap.id} • {created}
                  </Typography>

                  <Stack spacing={0.5}>
                    <Typography>
                      <strong>Swap:</strong> shift&nbsp;
                      {swap.from_shift_id} ➜ shift&nbsp;
                      {swap.target_shift_id}
                    </Typography>

                    <Typography>
                      <strong>Requester:</strong> {swap.requester_name}
                    </Typography>

                    {swap.message && (
                      <Typography>
                        <strong>Msg:</strong> {swap.message}
                      </Typography>
                    )}
                  </Stack>

                  <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                    {canRespond && (
                      <>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => respond(swap.id, true)}
                        >
                          Accept
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => respond(swap.id, false)}
                        >
                          Decline
                        </Button>
                      </>
                    )}

                    {canCancel && (
                      <Button
                        size="small"
                        color="warning"
                        onClick={() => cancel(swap.id)}
                      >
                        Cancel
                      </Button>
                    )}

                    {(canRespond || canCancel) && (
                      <Button
                        size="small"
                        onClick={() => resendEmail(swap.id)}
                      >
                        Resend e-mail
                      </Button>
                    )}
                  </Stack>
                </Paper>
              );
            })
          )}
        </AccordionDetails>
      </Accordion>

      {/* feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.error ? "error" : "success"}
          sx={{ width: "100%" }}
        >
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </>
  );
};

export default IncomingSwapRequests;
