import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  createPredictionMatch,
  getPredictionAdminMatches,
  updatePredictionMatch,
} from "./predictionApi";

const emptyForm = {
  home_team_name: "",
  away_team_name: "",
  kickoff_at_utc: "",
  lock_at_utc: "",
  stage_key: "group_stage",
  week_key: "group_week_1",
  venue_timezone: "UTC",
  status: "upcoming",
  group_key: "",
};

const PredictionAdminMatchesPage = ({ currentUserInfo }) => {
  const canManage = Boolean(currentUserInfo?.is_manager);
  const [state, setState] = useState({ loading: true, error: "", data: null });
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const data = await getPredictionAdminMatches();
      setState({ loading: false, error: "", data });
    } catch (error) {
      setState({
        loading: false,
        error: error?.response?.data?.error || error?.message || "Failed to load admin matches.",
        data: null,
      });
    }
  };

  useEffect(() => {
    if (canManage) load();
  }, [canManage]);

  const submitLabel = useMemo(() => (editingId ? "Update match" : "Create match"), [editingId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await updatePredictionMatch(editingId, form);
      } else {
        await createPredictionMatch(form);
      }
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error?.response?.data?.error || error?.message || "Unable to save prediction match.",
      }));
    } finally {
      setSubmitting(false);
    }
  };

  if (!canManage) {
    return <Alert severity="info">Global match management is available from the Platform Admin prediction workspace.</Alert>;
  }

  return (
    <Stack spacing={2}>
      {state.error ? <Alert severity="error">{state.error}</Alert> : null}
      <Paper component="form" onSubmit={handleSubmit} elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
        <Stack spacing={2}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {submitLabel}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Home team" value={form.home_team_name} onChange={(e) => setForm((prev) => ({ ...prev, home_team_name: e.target.value }))} required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Away team" value={form.away_team_name} onChange={(e) => setForm((prev) => ({ ...prev, away_team_name: e.target.value }))} required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Kickoff UTC" placeholder="2026-06-12T19:00:00Z" value={form.kickoff_at_utc} onChange={(e) => setForm((prev) => ({ ...prev, kickoff_at_utc: e.target.value }))} required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Lock UTC" placeholder="Optional, defaults to kickoff" value={form.lock_at_utc} onChange={(e) => setForm((prev) => ({ ...prev, lock_at_utc: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField select fullWidth label="Stage" value={form.stage_key} onChange={(e) => setForm((prev) => ({ ...prev, stage_key: e.target.value }))}>
                <MenuItem value="group_stage">Group Stage</MenuItem>
                <MenuItem value="round_of_32">Round of 32</MenuItem>
                <MenuItem value="round_of_16">Round of 16</MenuItem>
                <MenuItem value="quarter_finals">Quarter Finals</MenuItem>
                <MenuItem value="semi_finals">Semi Finals</MenuItem>
                <MenuItem value="final_week">Final Week</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField select fullWidth label="Week key" value={form.week_key} onChange={(e) => setForm((prev) => ({ ...prev, week_key: e.target.value }))}>
                <MenuItem value="group_week_1">group_week_1</MenuItem>
                <MenuItem value="group_week_2">group_week_2</MenuItem>
                <MenuItem value="group_week_3">group_week_3</MenuItem>
                <MenuItem value="round_of_32">round_of_32</MenuItem>
                <MenuItem value="round_of_16">round_of_16</MenuItem>
                <MenuItem value="quarter_finals">quarter_finals</MenuItem>
                <MenuItem value="semi_finals">semi_finals</MenuItem>
                <MenuItem value="final_week">final_week</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField select fullWidth label="Status" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}>
                <MenuItem value="upcoming">upcoming</MenuItem>
                <MenuItem value="locked">locked</MenuItem>
                <MenuItem value="live">live</MenuItem>
                <MenuItem value="finished">finished</MenuItem>
                <MenuItem value="scored">scored</MenuItem>
              </TextField>
            </Grid>
          </Grid>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitLabel}
            </Button>
            {editingId ? (
              <Button
                variant="outlined"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
              >
                Cancel edit
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
        <Stack spacing={1.5}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Existing matches
          </Typography>
          {(state.data?.matches || []).length ? (
            (state.data.matches || []).map((match) => (
              <Box key={match.id} sx={{ p: 1.75, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {match.home_team_name} vs {match.away_team_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {match.week_key} · {match.stage_key} · {match.status}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Kickoff UTC: {match.kickoff_at_utc}
                    </Typography>
                  </Box>
                  <Button
                    variant="text"
                    onClick={() => {
                      setEditingId(match.id);
                      setForm({
                        home_team_name: match.home_team_name || "",
                        away_team_name: match.away_team_name || "",
                        kickoff_at_utc: match.kickoff_at_utc || "",
                        lock_at_utc: match.lock_at_utc || "",
                        stage_key: match.stage_key || "group_stage",
                        week_key: match.week_key || "group_week_1",
                        venue_timezone: match.venue_timezone || "UTC",
                        status: match.status || "upcoming",
                        group_key: match.group_key || "",
                      });
                    }}
                  >
                    Edit
                  </Button>
                </Stack>
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              No prediction matches have been created for the active campaign yet.
            </Typography>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
};

export default PredictionAdminMatchesPage;
