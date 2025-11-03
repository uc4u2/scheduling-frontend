// src/pages/client/PublicReviewList.js
import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Typography, Paper, Rating, CircularProgress, Alert,
  Divider, Stack, Button, TextField, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions,
  List, ListItemButton, ListItemText, ListItemAvatar, Avatar,
  IconButton, Tooltip
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PersonIcon from "@mui/icons-material/Person";
import axios from "axios";
import { useParams } from "react-router-dom";
import PublicPageShell from "./PublicPageShell";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function PublicReviewList({ slug, limit = 20, disableShell = false }) {
  // slug can come from props or the route
  const params = useParams();
  const effectiveSlug = useMemo(() => {
    if (slug) return slug;
    const qs = new URLSearchParams(window.location.search || "");
    const byQs = (qs.get('site') || '').trim();
    let byPath = '';
    try { byPath = (window.location.pathname || '/').split('/')[1] || ''; } catch {}
    let byLs = '';
    try { byLs = localStorage.getItem('site') || ''; } catch {}
    return (params.slug || byQs || byPath || byLs || '').trim();
  }, [slug, params.slug]);

  // If you store client token differently, adjust here:
  const clientToken =
    localStorage.getItem("clientToken") ||
    localStorage.getItem("token") ||
    "";

  // Public list
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [err, setErr] = useState("");

  // Client eligibility
  const [eligLoading, setEligLoading] = useState(false);
  const [elig, setElig] = useState({
    window_days: 14,
    eligible: [],
    window_expired: false,
    message: null
  });

  // Inline form state
  const [form, setForm] = useState({
    apptId: null,
    rating: 5,
    comment: "",
    submitting: false,
    error: "",
    done: false,
  });

  // Picker dialog visible?
  const [pickerOpen, setPickerOpen] = useState(false);

  // --------- data fetchers ----------
  const loadReviews = async () => {
    if (!effectiveSlug) return;
    setLoading(true);
    setErr("");
    try {
      const enc = encodeURIComponent(effectiveSlug);
      const { data } = await axios.get(`${API}/public/${enc}/reviews`, { params: { limit } });
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.reviews)
        ? data.reviews
        : Array.isArray(data?.items)
        ? data.items
        : [];
      setReviews(list);
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  };

  const loadEligibility = async () => {
    if (!clientToken || !effectiveSlug) return;
    setEligLoading(true);
    try {
      const enc = encodeURIComponent(effectiveSlug);
      const { data } = await axios.get(`${API}/client/${enc}/reviews/eligibility`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      const payload = {
        window_days: Number(data?.window_days ?? 14),
        eligible: Array.isArray(data?.eligible) ? data.eligible : [],
        window_expired: !!data?.window_expired,
        message: data?.message || null,
      };
      setElig(payload);

      // Auto-select most recent eligible appointment (compact UI)
      if (!form.apptId && payload.eligible.length) {
        setForm((f) => ({ ...f, apptId: payload.eligible[0].appointment_id }));
      }
    } catch (e) {
      // non-fatal on the public page
      console.warn("Eligibility error:", e?.response?.data || e.message);
    } finally {
      setEligLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveSlug, limit]);

  useEffect(() => {
    if (clientToken) loadEligibility();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveSlug, clientToken]);

  const avg = useMemo(() => {
    if (!reviews.length) return 0;
    const s = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    return s / reviews.length;
  }, [reviews]);

  // --------- actions ----------
  const openPicker = () => setPickerOpen(true);
  const closePicker = () => setPickerOpen(false);

  const chooseAppt = (apptId) => {
    setForm({ apptId, rating: 5, comment: "", submitting: false, error: "", done: false });
    closePicker();
  };

  const submitReview = async () => {
    if (!clientToken || !form.apptId || !effectiveSlug) return;
    try {
      setForm((f) => ({ ...f, submitting: true, error: "" }));
      const enc = encodeURIComponent(effectiveSlug);
      await axios.post(
        `${API}/client/${enc}/feedback/review`,
        {
          appointment_id: form.apptId,
          rating: Number(form.rating),
          comment: (form.comment || "").trim(),
        },
        { headers: { Authorization: `Bearer ${clientToken}` } }
      );

      await Promise.all([loadReviews(), loadEligibility()]);
      setForm((f) => ({ ...f, submitting: false, done: true }));
    } catch (e) {
      setForm((f) => ({
        ...f,
        submitting: false,
        error: e?.response?.data?.error || "Submit failed.",
      }));
    }
  };

  // --------- UI ----------
  const page = (
    <Box>
      {/* Summary */}
      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
        <Rating name="avg-rating" value={avg} precision={0.5} readOnly />
        <Typography variant="body2" color="text.secondary">
          {avg ? avg.toFixed(1) : "0.0"} / 5 · {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
        </Typography>
      </Stack>

      {/* Public list */}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        {loading ? (
          <Box sx={{ py: 2, textAlign: "center" }}>
            <CircularProgress size={22} />
          </Box>
        ) : err ? (
          <Alert severity="error">{err}</Alert>
        ) : !reviews.length ? (
          <Typography variant="body2">No reviews yet.</Typography>
        ) : (
          <Stack spacing={2}>
            {reviews.map((r, i) => (
              <Box key={r.id || i}>
                <Rating value={Number(r.rating) || 0} precision={0.5} readOnly />
                {r.comment && <Typography sx={{ mt: 0.5 }}>{r.comment}</Typography>}
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                  {r.client_first ? `— ${r.client_first}` : ""} {r.service ? `• ${r.service}` : ""} {r.provider ? `• ${r.provider}` : ""}
                </Typography>
                {i < reviews.length - 1 && <Divider sx={{ mt: 2 }} />}
              </Box>
            ))}
          </Stack>
        )}
      </Paper>

      {/* Inline client review (compact by default) */}
      {clientToken && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
            Share feedback from a recent visit
          </Typography>

          {eligLoading ? (
            <Box sx={{ py: 1, textAlign: "center" }}>
              <CircularProgress size={20} />
            </Box>
          ) : elig.eligible.length ? (
            <Card variant="outlined">
              <CardContent>
                {/* Compact review box defaults to the most recent appointment */}
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body2" color="text.secondary">
                      {form.apptId
                        ? `Reviewing appointment #${form.apptId}`
                        : `You're eligible to review a recent visit`}
                    </Typography>
                    <Tooltip title="Pick a different visit">
                      <IconButton size="small" onClick={openPicker} aria-label="Choose another appointment">
                        <PersonIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>

                  {/* Rating + comment */}
                  <Rating
                    value={form.rating}
                    onChange={(_, v) => setForm((f) => ({ ...f, rating: v || 5 }))}
                  />
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    placeholder="Tell us about your experience (optional)"
                    value={form.comment}
                    onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                  />

                  {form.error && <Alert severity="error">{form.error}</Alert>}
                  {form.done && <Alert severity="success">Thanks! Your review was submitted.</Alert>}

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <Button
                      variant="contained"
                      disabled={form.submitting || !form.apptId}
                      onClick={submitReview}
                    >
                      {form.submitting ? "Submitting…" : "Submit review"}
                    </Button>
                    <Button variant="text" onClick={openPicker}>
                      Choose another appointment
                    </Button>
                  </Stack>

                  <Typography variant="caption" color="text.secondary">
                    Review window: last {elig.window_days} days.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          ) : (
            <Alert severity="info">
              {elig.message || `No eligible visits in the last ${elig.window_days} days.`}
            </Alert>
          )}
        </Box>
      )}

      {/* Stylish picker (modal) */}
      <Dialog open={pickerOpen} onClose={closePicker} fullWidth maxWidth="sm">
        <DialogTitle>Pick a recent visit</DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {elig.eligible.length ? (
            <List
              dense
              sx={{
                maxHeight: 360,
                overflowY: "auto",
              }}
            >
              {elig.eligible.map((e) => (
                <ListItemButton key={e.appointment_id} onClick={() => chooseAppt(e.appointment_id)}>
                  <ListItemAvatar>
                    <Avatar>
                      <CalendarMonthIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${e.service} — ${e.provider}`}
                    secondary={e.date}
                  />
                </ListItemButton>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2">No eligible appointments.</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closePicker}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  if (disableShell) return page;
  return <PublicPageShell activeKey="__reviews">{page}</PublicPageShell>;
}
