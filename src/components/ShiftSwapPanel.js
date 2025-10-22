// ────────────────────────────────────────────────────────────────
//  ShiftSwapPanel.js   –  Manager view: approve / deny peer-accepted swaps
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
import axios from "axios";
import dayjs from "dayjs";

// adjust the path if your folder structure differs
import { STATUS, POLL_MS } from "../utils/shiftSwap";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const ShiftSwapPanel = ({ token, headerStyle }) => {
  // ───────────── state ─────────────
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, msg: "", error: false });

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  // ───────────── fetch ─────────────
  const fetchSwaps = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const qs = showHistory ? "" : "?status=peer_accepted";
      const { data } = await axios.get(`${API_URL}/shift-swap-requests${qs}`, {
        headers,
      });
      setSwaps(data);
    } catch (err) {
      setError(err.response?.data?.error || "Unable to fetch shift-swap requests.");
    } finally {
      setLoading(false);
    }
  }, [token, showHistory, headers]);

  useEffect(() => {
    fetchSwaps();
    const id = setInterval(fetchSwaps, POLL_MS);
    return () => clearInterval(id);
  }, [fetchSwaps]);

  // ───────────── actions ─────────────
  const decide = async (id, approve) => {
    try {
      const { data } = await axios.put(
        `${API_URL}/shift-swap-requests/${id}/manager-decision`,
        { approve },
        { headers }
      );

      setSwaps((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: data.status } : s))
      );

      setSnackbar({
        open: true,
        msg: `Swap ${approve ? "approved" : "denied"}.`,
        error: false,
      });
    } catch (err) {
      setSnackbar({
        open: true,
        msg: err.response?.data?.error || "Decision failed.",
        error: true,
      });
    }
  };

  const resendEmail = async (id) => {
    try {
      await axios.post(`${API_URL}/shift-swap-requests/${id}/send-email`, {}, { headers });
      setSnackbar({ open: true, msg: "E-mail re-sent.", error: false });
    } catch {
      setSnackbar({ open: true, msg: "Could not resend e-mail.", error: true });
    }
  };

  // ───────────── UI ─────────────
  return (
    <>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={headerStyle} flexGrow={1}>
            Shift-Swap Approvals
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
            sx={{ mb: 2 }}
            control={
              <Switch
                checked={showHistory}
                onChange={(e) => setShowHistory(e.target.checked)}
              />
            }
            label="Show history"
          />

          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          {loading ? (
            [...Array(3)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={90} sx={{ mb: 2 }} />
            ))
          ) : swaps.length === 0 ? (
            <Typography>
              {showHistory
                ? "No shift-swap history."
                : "No swaps awaiting manager decision."}
            </Typography>
          ) : (
            swaps.map((swap) => {
              const created = dayjs(swap.created_at).format("MMM D, HH:mm");
              const open = swap.status === "peer_accepted";
              return (
                <Paper
                  key={swap.id}
                  variant="outlined"
                  sx={{ p: 2, mb: 2, position: "relative" }}
                >
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
                      <strong>Swap:</strong> shift&nbsp;{swap.from_shift_id}&nbsp;➜&nbsp;
                      shift&nbsp;{swap.target_shift_id}
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
                    {open && (
                      <>
                        <Button
                          variant="contained"
                          color="success"
                          onClick={() => decide(swap.id, true)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => decide(swap.id, false)}
                        >
                          Deny
                        </Button>
                      </>
                    )}

                    {open && (
                      <Button onClick={() => resendEmail(swap.id)}>Resend e-mail</Button>
                    )}
                  </Stack>
                </Paper>
              );
            })
          )}
        </AccordionDetails>
      </Accordion>

      {/* snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.error ? "error" : "success"} sx={{ width: "100%" }}>
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ShiftSwapPanel;
