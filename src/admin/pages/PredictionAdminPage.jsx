import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Collapse,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import PredictionEmptyState from "../../pages/prediction/components/PredictionEmptyState";
import {
  formatStageLabel,
  formatUtcLabel,
  formatViewerDateTimeLabel,
  formatViewerTimezoneLabel,
  formatWeekLabel,
} from "../../pages/prediction/predictionViewUtils";
import {
  createPredictionAdminMatch,
  createPredictionAdminDraw,
  createPredictionAdminDailyBonus,
  disqualifyPredictionAdminReferral,
  generatePredictionAdminDrawEntries,
  getPredictionAdminDailyBonus,
  getPredictionAdminMatches,
  getPredictionAdminMultiPickChallenges,
  getPredictionAdminMultiPickLeaderboard,
  getPredictionAdminReferrals,
  getPredictionAdminDraws,
  getPredictionAuditLogs,
  getPredictionAdminLeaderboard,
  getPredictionAdminDrawAwards,
  getPredictionCampaigns,
  getPredictionFixtureSeedPreview,
  importPredictionFixtureSeed,
  publishPredictionAdminDraw,
  recalculatePredictionAdmin,
  runPredictionAdminDraw,
  scorePredictionAdminDailyBonus,
  scorePredictionAdminMultiPickChallenge,
  scoreReadyPredictionAdminDailyBonus,
  seedDailyBonusFromFixtures,
  seedPredictionAdminMultiPickFromFixtures,
  seedPredictionAdminDailyActiveDraws,
  seedPredictionAdminDefaultDraws,
  setPredictionAdminMatchResult,
  publishPredictionAdminMultiPickChallenge,
  updatePredictionAdminAwardStatus,
  updatePredictionAdminDailyBonus,
  updatePredictionAdminDraw,
  updatePredictionAdminMatch,
  createPredictionAdminMultiPickChallenge,
  updatePredictionAdminMultiPickChallenge,
} from "../api/predictionAdminApi";

const emptyMatchForm = {
  home_team_name: "",
  away_team_name: "",
  kickoff_at_utc: "",
  lock_at_utc: "",
  stage_key: "group_stage",
  week_key: "group_week_1",
  venue_timezone: "UTC",
  status: "upcoming",
  group_key: "",
  home_team_code: "",
  away_team_code: "",
};

const emptyResultForm = {
  home_score_actual: "",
  away_score_actual: "",
  status: "finished",
};

const multipickStatuses = ["draft", "open", "locked", "scored", "published"];

const emptyMultiPickForm = {
  title: "",
  mode: "outcome",
  stage_key: "group_stage",
  starts_at_utc: "",
  locks_at_utc: "",
  ends_at_utc: "",
  status: "draft",
  max_cards_per_user: 5,
  match_ids_text: "",
};

const formatUtcShortDate = (value) => {
  if (!value) return "TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  }).format(date);
};

const formatMultiPickRange = (item) => {
  if (!item?.starts_at_utc && !item?.ends_at_utc) return "Date range TBD";
  const start = formatUtcShortDate(item?.starts_at_utc);
  const end = formatUtcShortDate(item?.ends_at_utc || item?.starts_at_utc);
  return start === end ? `${start} UTC` : `${start} - ${end} UTC`;
};

const padDateTimePart = (value) => String(value).padStart(2, "0");

const utcIsoToDateTimeLocalInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return [
    date.getFullYear(),
    padDateTimePart(date.getMonth() + 1),
    padDateTimePart(date.getDate()),
  ].join("-") + `T${padDateTimePart(date.getHours())}:${padDateTimePart(date.getMinutes())}`;
};

const dateTimeLocalInputToUtcIso = (value) => {
  const text = String(value || "").trim();
  if (!text) return "";
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().replace(".000Z", "+00:00");
};

const parseMultiPickMatchIds = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item > 0);
    }
  } catch (_error) {
    // Fall back to comma-separated values.
  }
  return raw
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item > 0);
};

const TimeDisplay = ({ label, value }) => {
  if (!value) return null;
  return (
    <Stack spacing={0.15}>
      <Typography variant="body2" color="text.secondary">
        {label} your time: {formatViewerDateTimeLabel(value)}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label} UTC: {formatUtcLabel(value)}
      </Typography>
    </Stack>
  );
};

const AdminTimezoneNotice = () => (
  <Alert severity="info" sx={{ mb: 2 }}>
    Times are shown in your timezone: <strong>{formatViewerTimezoneLabel()}</strong>. Admin inputs remain in UTC.
  </Alert>
);

const AdminUtcDateTimeField = ({ label, value, onChange }) => {
  const utcValue = utcIsoToDateTimeLocalInput(value);
  return (
    <TextField
      fullWidth
      type="datetime-local"
      label={label}
      value={utcValue}
      onChange={(event) => onChange(dateTimeLocalInputToUtcIso(event.target.value))}
      InputLabelProps={{ shrink: true }}
      helperText={value ? `Your time: ${formatViewerDateTimeLabel(value)} · Stored UTC: ${formatUtcLabel(value)}` : "Pick date and time in your local timezone. It will be stored in UTC automatically."}
    />
  );
};

const LeaderboardRow = ({ row }) => (
  <Paper key={row.recruiter_id} variant="outlined" sx={{ p: 1.5 }}>
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
      <Stack spacing={0.35}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          #{row.rank} {row.display_name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {row.total_points} pts · exact {row.exact_score_count} · outcomes {row.correct_outcome_count}
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary">
        {row.scored_prediction_count} scored picks
      </Typography>
    </Stack>
  </Paper>
);

function MatchesTab() {
  const [state, setState] = useState({ loading: true, error: "", data: null });
  const [form, setForm] = useState(emptyMatchForm);
  const [editingId, setEditingId] = useState(null);
  const [resultMatchId, setResultMatchId] = useState(null);
  const [resultForm, setResultForm] = useState(emptyResultForm);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({ weekKey: "", stageKey: "", status: "", q: "" });

  const load = async (nextFilters = filters) => {
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const data = await getPredictionAdminMatches(nextFilters);
      setState({ loading: false, error: "", data });
    } catch (error) {
      setState({
        loading: false,
        error: error?.response?.data?.error || error?.message || "Failed to load prediction matches.",
        data: null,
      });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submitLabel = editingId ? "Update match" : "Create match";

  const handleMatchSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await updatePredictionAdminMatch(editingId, form);
      } else {
        await createPredictionAdminMatch(form);
      }
      setForm(emptyMatchForm);
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

  const handleResultSubmit = async (matchId) => {
    setSubmitting(true);
    try {
      const response = await setPredictionAdminMatchResult(matchId, {
        home_score_actual: resultForm.home_score_actual,
        away_score_actual: resultForm.away_score_actual,
        status: resultForm.status,
        score_now: true,
      });
      setResultMatchId(null);
      setResultForm(emptyResultForm);
      setState((prev) => ({
        ...prev,
        error: "",
        info: response?.scoring
          ? `Scored ${response.scoring.scored_count} pick(s), skipped ${response.scoring.skipped_count}, awarded ${response.scoring.points_total_awarded} total points.`
          : "",
      }));
      await load();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error?.response?.data?.error || error?.message || "Unable to save match result.",
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const matches = state.data?.matches || [];

  return (
    <Stack spacing={2}>
      <AdminTimezoneNotice />
      {state.error ? <Alert severity="error">{state.error}</Alert> : null}
      {state.info ? <Alert severity="success">{state.info}</Alert> : null}
      <Paper component="form" onSubmit={handleMatchSubmit} sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Typography variant="h6">{submitLabel}</Typography>
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
                <MenuItem value="group_week_1">{formatWeekLabel("group_week_1")}</MenuItem>
                <MenuItem value="group_week_2">{formatWeekLabel("group_week_2")}</MenuItem>
                <MenuItem value="group_week_3">{formatWeekLabel("group_week_3")}</MenuItem>
                <MenuItem value="round_of_32">{formatWeekLabel("round_of_32")}</MenuItem>
                <MenuItem value="round_of_16">{formatWeekLabel("round_of_16")}</MenuItem>
                <MenuItem value="quarter_finals">{formatWeekLabel("quarter_finals")}</MenuItem>
                <MenuItem value="semi_finals">{formatWeekLabel("semi_finals")}</MenuItem>
                <MenuItem value="final_week">{formatWeekLabel("final_week")}</MenuItem>
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
          <Stack direction="row" spacing={1}>
            <Button type="submit" variant="contained" disabled={submitting}>{submitLabel}</Button>
            {editingId ? (
              <Button variant="outlined" onClick={() => { setEditingId(null); setForm(emptyMatchForm); }}>
                Cancel edit
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
          <TextField select label="Week key" value={filters.weekKey} onChange={(e) => setFilters((prev) => ({ ...prev, weekKey: e.target.value }))} sx={{ minWidth: 220 }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="group_week_1">{formatWeekLabel("group_week_1")}</MenuItem>
            <MenuItem value="group_week_2">{formatWeekLabel("group_week_2")}</MenuItem>
            <MenuItem value="group_week_3">{formatWeekLabel("group_week_3")}</MenuItem>
            <MenuItem value="round_of_32">{formatWeekLabel("round_of_32")}</MenuItem>
            <MenuItem value="round_of_16">{formatWeekLabel("round_of_16")}</MenuItem>
            <MenuItem value="quarter_finals">{formatWeekLabel("quarter_finals")}</MenuItem>
            <MenuItem value="semi_finals">{formatWeekLabel("semi_finals")}</MenuItem>
            <MenuItem value="final_week">{formatWeekLabel("final_week")}</MenuItem>
          </TextField>
          <TextField select label="Stage" value={filters.stageKey} onChange={(e) => setFilters((prev) => ({ ...prev, stageKey: e.target.value }))} sx={{ minWidth: 220 }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="group_stage">{formatStageLabel("group_stage")}</MenuItem>
            <MenuItem value="round_of_32">{formatStageLabel("round_of_32")}</MenuItem>
            <MenuItem value="round_of_16">{formatStageLabel("round_of_16")}</MenuItem>
            <MenuItem value="quarter_finals">{formatStageLabel("quarter_finals")}</MenuItem>
            <MenuItem value="semi_finals">{formatStageLabel("semi_finals")}</MenuItem>
            <MenuItem value="final_week">{formatStageLabel("final_week")}</MenuItem>
          </TextField>
          <TextField select label="Status" value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))} sx={{ minWidth: 180 }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="upcoming">upcoming</MenuItem>
            <MenuItem value="locked">locked</MenuItem>
            <MenuItem value="live">live</MenuItem>
            <MenuItem value="finished">finished</MenuItem>
            <MenuItem value="scored">scored</MenuItem>
          </TextField>
          <TextField
            label="Search"
            value={filters.q}
            onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
            placeholder="Team, venue, match #"
            sx={{ minWidth: 220 }}
          />
          <Button variant="outlined" onClick={() => load(filters)}>Apply filters</Button>
        </Stack>

        <Stack spacing={1.5}>
          {matches.map((match) => (
            <Paper key={match.id} variant="outlined" sx={{ p: 1.5 }}>
              <Stack spacing={1}>
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {match.home_team_name} vs {match.away_team_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {match.week_key} · {match.stage_key} · {match.status}
                    </Typography>
                    {match.source_payload_json?.match_number ? (
                      <Typography variant="body2" color="text.secondary">
                        Match #{match.source_payload_json.match_number} · {match.source_payload_json?.venue_name || "Venue TBD"}
                      </Typography>
                    ) : null}
                    <Typography variant="body2" color="text.secondary">
                      Venue TZ: {match.venue_timezone || "UTC"}
                    </Typography>
                    <TimeDisplay label="Kickoff" value={match.kickoff_at_utc} />
                    <TimeDisplay label="Lock" value={match.lock_at_utc || match.kickoff_at_utc} />
                    {match.home_score_actual != null && match.away_score_actual != null ? (
                      <Typography variant="body2" color="text.secondary">
                        Result: {match.home_score_actual}-{match.away_score_actual}
                      </Typography>
                    ) : null}
                  </Box>
                  <Stack direction="row" spacing={1}>
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
                          home_team_code: match.home_team_code || "",
                          away_team_code: match.away_team_code || "",
                        });
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setResultMatchId(match.id === resultMatchId ? null : match.id);
                        setResultForm({
                          home_score_actual: match.home_score_actual ?? "",
                          away_score_actual: match.away_score_actual ?? "",
                          status: match.status === "scored" ? "scored" : "finished",
                        });
                      }}
                    >
                      Set result
                    </Button>
                  </Stack>
                </Stack>
                {resultMatchId === match.id ? (
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
                    <TextField label="Home score" type="number" value={resultForm.home_score_actual} onChange={(e) => setResultForm((prev) => ({ ...prev, home_score_actual: e.target.value }))} sx={{ maxWidth: 140 }} />
                    <TextField label="Away score" type="number" value={resultForm.away_score_actual} onChange={(e) => setResultForm((prev) => ({ ...prev, away_score_actual: e.target.value }))} sx={{ maxWidth: 140 }} />
                    <TextField select label="Post-result status" value={resultForm.status} onChange={(e) => setResultForm((prev) => ({ ...prev, status: e.target.value }))} sx={{ minWidth: 180 }}>
                      <MenuItem value="finished">finished</MenuItem>
                      <MenuItem value="scored">scored</MenuItem>
                    </TextField>
                    <Button variant="contained" disabled={submitting} onClick={() => handleResultSubmit(match.id)}>
                      Save result
                    </Button>
                  </Stack>
                ) : null}
              </Stack>
            </Paper>
          ))}
          {!matches.length && !state.loading ? (
            <Typography variant="body2" color="text.secondary">No prediction matches found for the current filters.</Typography>
          ) : null}
        </Stack>
      </Paper>
    </Stack>
  );
}

function ResultsTab() {
  const [state, setState] = useState({ loading: true, error: "", data: null, summary: null });
  const [filters, setFilters] = useState({ weekKey: "", stageKey: "", status: "", q: "" });
  const [drafts, setDrafts] = useState({});
  const [busy, setBusy] = useState(false);

  const load = async (nextFilters = filters) => {
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const data = await getPredictionAdminMatches(nextFilters);
      setState((prev) => ({ ...prev, loading: false, error: "", data }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error?.response?.data?.error || error?.message || "Failed to load prediction results.",
        data: null,
      }));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleScoreMatch = async (matchId) => {
    const draft = drafts[matchId] || {};
    setBusy(true);
    try {
      const response = await setPredictionAdminMatchResult(matchId, {
        home_score_actual: draft.home_score_actual,
        away_score_actual: draft.away_score_actual,
        status: "finished",
        score_now: true,
      });
      setState((prev) => ({ ...prev, summary: response?.scoring || null, error: "" }));
      await load();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error?.response?.data?.error || error?.message || "Failed to save result and score match.",
      }));
    } finally {
      setBusy(false);
    }
  };

  const handleRecalculate = async (payload, confirmMessage = null) => {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    setBusy(true);
    try {
      const summary = await recalculatePredictionAdmin(payload);
      setState((prev) => ({ ...prev, summary, error: "" }));
      await load();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error?.response?.data?.error || error?.message || "Failed to recalculate prediction scores.",
      }));
    } finally {
      setBusy(false);
    }
  };

  const matches = state.data?.matches || [];

  return (
    <Stack spacing={2}>
      <AdminTimezoneNotice />
      {state.error ? <Alert severity="error">{state.error}</Alert> : null}
      {state.summary ? (
        <Alert severity="success">
          Match count: {state.summary.match_count ?? 1} · Pick count: {state.summary.pick_count ?? 0} · Scored: {state.summary.scored_count ?? 0} · Skipped: {state.summary.skipped_count ?? 0} · Points awarded: {state.summary.points_total_awarded ?? 0}
        </Alert>
      ) : null}
      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField select label="Week key" value={filters.weekKey} onChange={(e) => setFilters((prev) => ({ ...prev, weekKey: e.target.value }))} sx={{ minWidth: 220 }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="group_week_1">{formatWeekLabel("group_week_1")}</MenuItem>
            <MenuItem value="group_week_2">{formatWeekLabel("group_week_2")}</MenuItem>
            <MenuItem value="group_week_3">{formatWeekLabel("group_week_3")}</MenuItem>
            <MenuItem value="round_of_32">{formatWeekLabel("round_of_32")}</MenuItem>
            <MenuItem value="round_of_16">{formatWeekLabel("round_of_16")}</MenuItem>
            <MenuItem value="quarter_finals">{formatWeekLabel("quarter_finals")}</MenuItem>
            <MenuItem value="semi_finals">{formatWeekLabel("semi_finals")}</MenuItem>
            <MenuItem value="final_week">{formatWeekLabel("final_week")}</MenuItem>
          </TextField>
          <TextField select label="Stage" value={filters.stageKey} onChange={(e) => setFilters((prev) => ({ ...prev, stageKey: e.target.value }))} sx={{ minWidth: 220 }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="group_stage">{formatStageLabel("group_stage")}</MenuItem>
            <MenuItem value="round_of_32">{formatStageLabel("round_of_32")}</MenuItem>
            <MenuItem value="round_of_16">{formatStageLabel("round_of_16")}</MenuItem>
            <MenuItem value="quarter_finals">{formatStageLabel("quarter_finals")}</MenuItem>
            <MenuItem value="semi_finals">{formatStageLabel("semi_finals")}</MenuItem>
            <MenuItem value="final_week">{formatStageLabel("final_week")}</MenuItem>
          </TextField>
          <TextField select label="Status" value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))} sx={{ minWidth: 180 }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="upcoming">upcoming</MenuItem>
            <MenuItem value="locked">locked</MenuItem>
            <MenuItem value="live">live</MenuItem>
            <MenuItem value="finished">finished</MenuItem>
            <MenuItem value="scored">scored</MenuItem>
          </TextField>
          <TextField label="Search" value={filters.q} onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))} placeholder="Team, venue, match #" sx={{ minWidth: 220 }} />
          <Button variant="outlined" onClick={() => load(filters)}>Apply filters</Button>
        </Stack>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ mt: 2 }}>
          <Button variant="outlined" disabled={busy || !filters.weekKey} onClick={() => handleRecalculate({ scope: "week", week_key: filters.weekKey })}>
            Recalculate Current Week
          </Button>
          <Button variant="outlined" color="warning" disabled={busy} onClick={() => handleRecalculate({ scope: "campaign" }, "Recalculate the entire campaign?")}>
            Recalculate Campaign
          </Button>
        </Stack>
      </Paper>

      <Stack spacing={1.5}>
        {matches.map((match) => {
          const draft = drafts[match.id] || {
            home_score_actual: match.home_score_actual ?? "",
            away_score_actual: match.away_score_actual ?? "",
          };
          return (
            <Paper key={match.id} variant="outlined" sx={{ p: 1.5 }}>
              <Stack spacing={1.25}>
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {match.home_team_name} vs {match.away_team_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {match.week_key} · {match.stage_key} · {match.status}
                    </Typography>
                    <TimeDisplay label="Kickoff" value={match.kickoff_at_utc} />
                    {match.home_score_actual != null && match.away_score_actual != null ? (
                      <Typography variant="body2" color="text.secondary">
                        Current result: {match.home_score_actual}-{match.away_score_actual}
                      </Typography>
                    ) : null}
                  </Box>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <TextField
                      label="Home score"
                      type="number"
                      value={draft.home_score_actual}
                      onChange={(e) => setDrafts((prev) => ({ ...prev, [match.id]: { ...draft, home_score_actual: e.target.value } }))}
                      sx={{ maxWidth: 140 }}
                    />
                    <TextField
                      label="Away score"
                      type="number"
                      value={draft.away_score_actual}
                      onChange={(e) => setDrafts((prev) => ({ ...prev, [match.id]: { ...draft, away_score_actual: e.target.value } }))}
                      sx={{ maxWidth: 140 }}
                    />
                    <Button variant="contained" disabled={busy} onClick={() => handleScoreMatch(match.id)}>
                      Save Result & Score
                    </Button>
                    <Button variant="outlined" disabled={busy} onClick={() => handleRecalculate({ scope: "match", match_id: match.id })}>
                      Recalculate Selected Match
                    </Button>
                  </Stack>
                </Stack>
              </Stack>
            </Paper>
          );
        })}
        {!matches.length && !state.loading ? (
          <Paper sx={{ p: 2 }}><Typography variant="body2" color="text.secondary">No matches found for the current filters.</Typography></Paper>
        ) : null}
      </Stack>
    </Stack>
  );
}

function LeaderboardTab() {
  const [scope, setScope] = useState("overall");
  const [state, setState] = useState({ loading: true, error: "", data: null });

  useEffect(() => {
    let active = true;
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    getPredictionAdminLeaderboard({ scope })
      .then((data) => {
        if (active) setState({ loading: false, error: "", data });
      })
      .catch((error) => {
        if (active) {
          setState({
            loading: false,
            error: error?.response?.data?.error || error?.message || "Failed to load admin leaderboard.",
            data: null,
          });
        }
      });
    return () => {
      active = false;
    };
  }, [scope]);

  return (
    <Stack spacing={2}>
      {state.error ? <Alert severity="error">{state.error}</Alert> : null}
      <Paper sx={{ borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
        <Tabs value={scope} onChange={(_e, next) => setScope(next)}>
          <Tab value="overall" label="Overall" />
          <Tab value="weekly" label="This Week" />
        </Tabs>
      </Paper>
      <Stack spacing={1.5}>
        {(state.data?.top || []).length ? (
          (state.data?.top || []).map((row) => <LeaderboardRow key={`admin-leaderboard-${row.recruiter_id}`} row={row} />)
        ) : (
          <Paper sx={{ p: 2 }}><Typography variant="body2" color="text.secondary">No scored picks yet for this leaderboard scope.</Typography></Paper>
        )}
      </Stack>
    </Stack>
  );
}

function FixturesTab() {
  const [state, setState] = useState({ loading: false, error: "", preview: null, importResult: null });
  const [submitting, setSubmitting] = useState(false);

  const handlePreview = async () => {
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const data = await getPredictionFixtureSeedPreview();
      setState((prev) => ({ ...prev, loading: false, error: "", preview: data }));
    } catch (error) {
      setState({
        loading: false,
        error: error?.response?.data?.error || error?.message || "Failed to preview fixture seed.",
        preview: null,
        importResult: null,
      });
    }
  };

  const handleImport = async (replace = false) => {
    setSubmitting(true);
    setState((prev) => ({ ...prev, error: "" }));
    try {
      const data = await importPredictionFixtureSeed({ dryRun: false, replace });
      const previewData = await getPredictionFixtureSeedPreview();
      setState((prev) => ({ ...prev, preview: previewData, importResult: data }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error?.response?.data?.error || error?.message || "Failed to import fixture seed.",
      }));
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    handlePreview();
  }, []);

  const seed = state.preview?.seed;
  const importResult = state.importResult?.result;

  return (
    <Stack spacing={2}>
      <AdminTimezoneNotice />
      {state.error ? <Alert severity="error">{state.error}</Alert> : null}
      <Paper sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Typography variant="h6">Fixture Seed Import</Typography>
          <Typography variant="body2" color="text.secondary">
            Active campaign: world_cup_2026. This updates global campaign fixtures.
          </Typography>
          {seed ? (
            <Stack spacing={0.75}>
              <Typography variant="body2">Seed file: {seed.path}</Typography>
              <Typography variant="body2">Source: {seed.source_name || "Unknown"} · {seed.source_version || "n/a"}</Typography>
              <Typography variant="body2">Rows: {seed.counts?.total || 0} · Group stage: {seed.counts?.group_stage || 0} · Knockout TBD matches: {seed.counts?.knockout_placeholders || 0}</Typography>
              <Typography variant="body2">Retrieved: {seed.retrieved_from_web_on || "n/a"}</Typography>
              {seed.errors?.length ? (
                <Alert severity="warning">
                  {seed.errors.length} validation issue(s): {seed.errors.slice(0, 3).join(" | ")}
                </Alert>
              ) : (
                <Alert severity="success">Fixture seed validated successfully.</Alert>
              )}
            </Stack>
          ) : null}
          <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
            <Button variant="outlined" onClick={handlePreview} disabled={state.loading || submitting}>
              Preview Fixture Seed
            </Button>
            <Button variant="contained" onClick={() => handleImport(false)} disabled={submitting || !!seed?.errors?.length}>
              Import Fixtures
            </Button>
            <Button variant="outlined" color="warning" onClick={() => handleImport(true)} disabled={submitting || !!seed?.errors?.length}>
              Import and Replace Fixture Fields
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {importResult ? (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Last Import Result</Typography>
          <Typography variant="body2" color="text.secondary">
            Inserted: {importResult.inserted_count} · Updated: {importResult.updated_count} · Skipped: {importResult.skipped_count} · Errors: {importResult.error_count}
          </Typography>
        </Paper>
      ) : null}
    </Stack>
  );
}

function CampaignTab() {
  const [state, setState] = useState({ loading: true, error: "", campaigns: [] });

  useEffect(() => {
    let active = true;
    getPredictionCampaigns()
      .then((data) => {
        if (active) setState({ loading: false, error: "", campaigns: data?.campaigns || [] });
      })
      .catch((error) => {
        if (active) setState({ loading: false, error: error?.response?.data?.error || error?.message || "Failed to load campaigns.", campaigns: [] });
      });
    return () => {
      active = false;
    };
  }, []);

  if (state.error) return <Alert severity="error">{state.error}</Alert>;

  return (
    <Paper sx={{ p: 2 }}>
      <AdminTimezoneNotice />
      <Typography variant="h6" sx={{ mb: 1.5 }}>Campaign</Typography>
      {(state.campaigns || []).map((campaign) => (
        <Box key={campaign.id} sx={{ mb: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{campaign.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {campaign.campaign_key} · {campaign.status}
          </Typography>
        </Box>
      ))}
      {!state.campaigns.length && !state.loading ? (
        <Typography variant="body2" color="text.secondary">No campaigns found.</Typography>
      ) : null}
    </Paper>
  );
}

function AuditLogsTab() {
  const [state, setState] = useState({ loading: true, error: "", logs: [] });

  useEffect(() => {
    let active = true;
    getPredictionAuditLogs()
      .then((data) => {
        if (active) setState({ loading: false, error: "", logs: data?.logs || [] });
      })
      .catch((error) => {
        if (active) setState({ loading: false, error: error?.response?.data?.error || error?.message || "Failed to load prediction audit logs.", logs: [] });
      });
    return () => {
      active = false;
    };
  }, []);

  if (state.error) return <Alert severity="error">{state.error}</Alert>;

  return (
    <Stack spacing={1.5}>
      {(state.logs || []).map((log) => (
        <Paper key={log.id} sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{log.summary || log.action_type}</Typography>
          <Typography variant="body2" color="text.secondary">
            {log.entity_type} #{log.entity_id}
          </Typography>
          <TimeDisplay label="Created" value={log.created_at} />
          {log.platform_admin_email ? (
            <Typography variant="body2" color="text.secondary">Actor: {log.platform_admin_email}</Typography>
          ) : null}
          {log.metadata_json ? (
            <Typography variant="caption" color="text.secondary">{JSON.stringify(log.metadata_json)}</Typography>
          ) : null}
        </Paper>
      ))}
      {!state.logs.length && !state.loading ? (
        <PredictionEmptyState
          title="No audit logs yet"
          body="Audit history will appear here after fixtures, scoring, prizes, or referrals are updated."
        />
      ) : null}
    </Stack>
  );
}

const emptyDrawForm = {
  draw_type: "weekly_share",
  title: "",
  prize_name: "$25-$100 Gift Card",
  prize_value_cents: "",
  prize_count: 2,
  starts_at_utc: "",
  cutoff_at_utc: "",
  draw_at_utc: "",
  required_qualified_referrals: 1,
  required_predictions: 3,
  required_week_key: "group_week_1",
  status: "draft",
  daily_key: "",
  sponsor_metadata_json: '{"sponsors":[]}',
  public_note: "",
};

function DrawsTab() {
  const [state, setState] = useState({ loading: true, error: "", draws: [], info: "" });
  const [form, setForm] = useState(emptyDrawForm);
  const [editingId, setEditingId] = useState(null);
  const [showHelp, setShowHelp] = useState(false);

  const load = async () => {
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const data = await getPredictionAdminDraws();
      setState((prev) => ({ ...prev, loading: false, draws: data?.draws || [] }));
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: error?.response?.data?.error || error?.message || "Failed to load prediction draws." }));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        ...form,
        prize_value_cents: form.prize_value_cents === "" ? null : Number(form.prize_value_cents),
        rules_snapshot_json: (() => {
          try {
            const parsed = JSON.parse(form.sponsor_metadata_json || "{}");
            const next = typeof parsed === "object" && parsed ? parsed : {};
            if (form.daily_key) next.daily_key = form.daily_key;
            if (form.public_note) next.admin_public_note = form.public_note;
            else delete next.admin_public_note;
            if (form.draw_type === "daily_active") {
              next.eligibility = {
                ...(next.eligibility || {}),
                requires_daily_bonus_or_today_prediction: true,
              };
            }
            return next;
          } catch (_error) {
            throw new Error("Sponsor metadata JSON is invalid.");
          }
        })(),
      };
      if (editingId) {
        await updatePredictionAdminDraw(editingId, payload);
      } else {
        await createPredictionAdminDraw(payload);
      }
      setEditingId(null);
      setForm(emptyDrawForm);
      await load();
    } catch (error) {
      setState((prev) => ({ ...prev, error: error?.response?.data?.error || error?.message || "Failed to save prediction draw." }));
    }
  };

  const doAction = async (fn, args, successMessage) => {
    try {
      await fn(...args);
      setState((prev) => ({ ...prev, error: "", info: successMessage }));
      await load();
    } catch (error) {
      setState((prev) => ({ ...prev, error: error?.response?.data?.error || error?.message || "Prediction draw action failed." }));
    }
  };

  return (
    <Stack spacing={2}>
      <AdminTimezoneNotice />
      {state.error ? <Alert severity="error">{state.error}</Alert> : null}
      {state.info ? <Alert severity="success">{state.info}</Alert> : null}
      <Paper sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1} alignItems={{ sm: "center" }}>
            <Typography variant="h6">How Daily Prize Draws Work</Typography>
            <Button
              variant="text"
              endIcon={<ExpandMoreRoundedIcon sx={{ transform: showHelp ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 160ms ease" }} />}
              onClick={() => setShowHelp((prev) => !prev)}
            >
              {showHelp ? "Hide help" : "Show help"}
            </Button>
          </Stack>
          <Collapse in={showHelp}>
            <Stack spacing={1.25}>
              <Typography variant="body2" color="text.secondary">
                “Seed Daily $25 Draws” creates one draft Daily Prize draw for each matchday or Challenge day. These draws stay safe drafts until Platform Admin sets the cutoff time, draw time, and opens them.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                A daily draw does not become visible or active for users until it is configured and opened. Each daily draw uses the Challenge day UTC / daily key.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                A user qualifies for a daily draw only if, before cutoff, they answer that day’s Daily Bonus or save at least one prediction for a match on that Challenge day UTC.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                After cutoff, generate entries. Entries are frozen at cutoff. Run Draw selects winners only from frozen eligible entries. Publish Winners makes winners visible to users.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                If a draw is only for testing, keep it draft or include TEST in the title. Do not publish test winners.
              </Typography>
              <Stack spacing={0.5}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Workflow
                </Typography>
                <Typography variant="body2" color="text.secondary">1. Seed Daily $25 Draws</Typography>
                <Typography variant="body2" color="text.secondary">2. Edit the draw</Typography>
                <Typography variant="body2" color="text.secondary">3. Set cutoff UTC and draw UTC</Typography>
                <Typography variant="body2" color="text.secondary">4. Change status to open</Typography>
                <Typography variant="body2" color="text.secondary">5. Generate entries after cutoff</Typography>
                <Typography variant="body2" color="text.secondary">6. Run draw</Typography>
                <Typography variant="body2" color="text.secondary">7. Publish winners</Typography>
              </Stack>
              <Alert severity="warning">Do not publish test draws in production.</Alert>
            </Stack>
          </Collapse>
        </Stack>
      </Paper>
      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
            <Typography variant="h6">{editingId ? "Edit draw" : "Create draw"}</Typography>
            <Button variant="outlined" onClick={() => doAction(seedPredictionAdminDefaultDraws, [{}], "Default draws seeded or confirmed.")}>
              Seed Default Draws
            </Button>
            <Button variant="outlined" onClick={() => doAction(seedPredictionAdminDailyActiveDraws, [{}], "Daily $25 draws seeded or confirmed.")}>
              Seed Daily $25 Draws from Daily Bonus / Fixtures
            </Button>
          </Stack>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}><TextField select fullWidth label="Draw type" value={form.draw_type} onChange={(e) => setForm((prev) => {
              const nextType = e.target.value;
              if (nextType === "grand_referral") {
                return {
                  ...prev,
                  draw_type: nextType,
                  prize_name: prev.prize_name === "$25-$100 Gift Card" ? "Sponsor-supported grand prize" : prev.prize_name,
                  prize_value_cents: prev.prize_name === "$25-$100 Gift Card" ? "" : prev.prize_value_cents,
                  prize_count: 1,
                  required_qualified_referrals: prev.required_qualified_referrals || 5,
                  required_predictions: prev.required_predictions || 10,
                  required_week_key: "",
                };
              }
              if (nextType === "daily_active") {
                return {
                  ...prev,
                  draw_type: nextType,
                  prize_name: prev.prize_name === "Sponsor-supported grand prize" ? "$25 Gift Card" : prev.prize_name,
                  prize_count: 1,
                  required_qualified_referrals: 0,
                  required_predictions: 0,
                  required_week_key: "",
                };
              }
              return {
                ...prev,
                draw_type: nextType,
                prize_name: prev.prize_name === "Sponsor-supported grand prize" ? "$25-$100 Gift Card" : prev.prize_name,
                prize_count: 2,
                required_qualified_referrals: prev.required_qualified_referrals || 1,
                required_predictions: prev.required_predictions || 3,
                required_week_key: prev.required_week_key || "group_week_1",
              };
            })} helperText={form.draw_type === "daily_active" ? "Daily draw for one matchday. Eligibility can be daily bonus or today’s prediction." : ""}><MenuItem value="daily_active">Daily Prize</MenuItem><MenuItem value="weekly_share">Weekly Share Prize</MenuItem><MenuItem value="grand_referral">Grand Prize</MenuItem></TextField></Grid>
            <Grid item xs={12} md={8}><TextField fullWidth label="Title" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} required /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Prize name" value={form.prize_name} onChange={(e) => setForm((prev) => ({ ...prev, prize_name: e.target.value }))} required /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Prize value cents" value={form.prize_value_cents} onChange={(e) => setForm((prev) => ({ ...prev, prize_value_cents: e.target.value }))} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Prize count" type="number" value={form.prize_count} onChange={(e) => setForm((prev) => ({ ...prev, prize_count: e.target.value }))} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Starts UTC" value={form.starts_at_utc} onChange={(e) => setForm((prev) => ({ ...prev, starts_at_utc: e.target.value }))} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Cutoff UTC" value={form.cutoff_at_utc} onChange={(e) => setForm((prev) => ({ ...prev, cutoff_at_utc: e.target.value }))} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Draw UTC" value={form.draw_at_utc} onChange={(e) => setForm((prev) => ({ ...prev, draw_at_utc: e.target.value }))} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Required referrals" type="number" value={form.required_qualified_referrals} onChange={(e) => setForm((prev) => ({ ...prev, required_qualified_referrals: e.target.value }))} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Required predictions" type="number" value={form.required_predictions} onChange={(e) => setForm((prev) => ({ ...prev, required_predictions: e.target.value }))} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Weekly prize week" value={form.required_week_key} onChange={(e) => setForm((prev) => ({ ...prev, required_week_key: e.target.value }))} helperText={form.draw_type === "weekly_share" ? "Only used for Weekly Share Prize." : "Not used for Daily Prize or Grand Prize."} /></Grid>
            <Grid item xs={12} md={3}><TextField select fullWidth label="Status" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}><MenuItem value="draft">draft</MenuItem><MenuItem value="open">open</MenuItem><MenuItem value="closed">closed</MenuItem><MenuItem value="drawn">drawn</MenuItem><MenuItem value="published">published</MenuItem></TextField></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Daily key" value={form.daily_key} onChange={(e) => setForm((prev) => ({ ...prev, daily_key: e.target.value }))} helperText={form.draw_type === "daily_active" ? "Daily key controls which Challenge day this Daily Prize belongs to." : "Only needed for Daily Prize draws."} /></Grid>
            <Grid item xs={12} md={8}><TextField fullWidth label="Public note" value={form.public_note} onChange={(e) => setForm((prev) => ({ ...prev, public_note: e.target.value }))} helperText="Optional note shown on the prize page, for example sponsor wording." /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline minRows={4} label="Sponsor metadata JSON" value={form.sponsor_metadata_json} onChange={(e) => setForm((prev) => ({ ...prev, sponsor_metadata_json: e.target.value }))} helperText='Optional advanced sponsor metadata. Leave as {"sponsors":[]} if not needed.' /></Grid>
          </Grid>
          <Stack direction="row" spacing={1}>
            <Button type="submit" variant="contained">{editingId ? "Update draw" : "Create draw"}</Button>
            {editingId ? <Button variant="outlined" onClick={() => { setEditingId(null); setForm(emptyDrawForm); }}>Cancel edit</Button> : null}
          </Stack>
        </Stack>
      </Paper>
      <Stack spacing={1.5}>
        {(state.draws || []).map((draw) => (
          <Paper key={draw.id} variant="outlined" sx={{ p: 1.5 }}>
            <Stack spacing={1}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{draw.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {draw.draw_type === "daily_active" ? "Daily Prize" : draw.draw_type === "weekly_share" ? "Weekly Share Prize" : "Grand Prize"} · {draw.status} · frozen eligible entries {draw.eligible_entry_count || 0} · awards {draw.award_count || 0}
              </Typography>
              {(draw.rules_snapshot_json || {}).daily_key ? (
                <Typography variant="body2" color="text.secondary">
                  Challenge day UTC: {(draw.rules_snapshot_json || {}).daily_key}
                </Typography>
              ) : null}
              {(draw.rules_snapshot_json || {}).admin_public_note ? (
                <Typography variant="body2" color="text.secondary">
                  Public note: {(draw.rules_snapshot_json || {}).admin_public_note}
                </Typography>
              ) : null}
              <TimeDisplay label="Starts" value={draw.starts_at_utc} />
              <TimeDisplay label="Cutoff" value={draw.cutoff_at_utc} />
              <TimeDisplay label="Draw time" value={draw.draw_at_utc} />
              {!draw.cutoff_at_utc || !draw.draw_at_utc ? (
                <Alert severity="warning">Set cutoff and draw times before opening this draw.</Alert>
              ) : null}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button variant="text" onClick={() => { setEditingId(draw.id); setForm({ ...emptyDrawForm, ...draw, prize_value_cents: draw.prize_value_cents ?? "", daily_key: (draw.rules_snapshot_json || {}).daily_key || "", public_note: (draw.rules_snapshot_json || {}).admin_public_note || "", sponsor_metadata_json: JSON.stringify((() => { const meta = { ...(draw.rules_snapshot_json || {}) }; delete meta.admin_public_note; return meta; })(), null, 2) }); }}>Edit</Button>
                <Button variant="outlined" onClick={() => doAction(generatePredictionAdminDrawEntries, [draw.id], "Eligibility snapshot generated.")}>Generate Entries</Button>
                <Button variant="outlined" onClick={() => doAction(runPredictionAdminDraw, [draw.id], "Draw completed.")}>Run Draw</Button>
                <Button variant="outlined" onClick={() => doAction(publishPredictionAdminDraw, [draw.id], "Winners published.")}>Publish Winners</Button>
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Stack>
  );
}

function ReferralsTab() {
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [state, setState] = useState({ loading: true, error: "", referrals: [] });

  const load = async (nextStatus = status, nextQ = q) => {
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const data = await getPredictionAdminReferrals({ status: nextStatus || undefined, q: nextQ || undefined });
      setState({ loading: false, error: "", referrals: data?.referrals || [] });
    } catch (error) {
      setState({ loading: false, error: error?.response?.data?.error || error?.message || "Failed to load prediction referrals.", referrals: [] });
    }
  };

  useEffect(() => { load(); }, []);

  const handleDisqualify = async (id) => {
    const reason = window.prompt("Disqualification reason", "suspected_referral_abuse");
    if (!reason) return;
    try {
      await disqualifyPredictionAdminReferral(id, reason);
      await load();
    } catch (error) {
      setState((prev) => ({ ...prev, error: error?.response?.data?.error || error?.message || "Failed to disqualify referral." }));
    }
  };

  return (
    <Stack spacing={2}>
      <AdminTimezoneNotice />
      {state.error ? <Alert severity="error">{state.error}</Alert> : null}
      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 180 }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">pending</MenuItem>
            <MenuItem value="qualified">qualified</MenuItem>
            <MenuItem value="rejected">rejected</MenuItem>
            <MenuItem value="disqualified">disqualified</MenuItem>
          </TextField>
          <TextField label="Search" value={q} onChange={(e) => setQ(e.target.value)} sx={{ minWidth: 220 }} />
          <Button variant="outlined" onClick={() => load(status, q)}>Apply filters</Button>
        </Stack>
      </Paper>
      <Stack spacing={1.5}>
        {(state.referrals || []).map((row) => (
          <Paper key={row.id} variant="outlined" sx={{ p: 1.5 }}>
            <Stack spacing={1}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{row.referrer_display_name} → {row.referred_display_name || "Pending account resolution"}</Typography>
              <Typography variant="body2" color="text.secondary">
                {row.status} · code {row.referral_code_snapshot}
              </Typography>
              <TimeDisplay label="Qualified" value={row.qualified_at_utc} />
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" color="warning" onClick={() => handleDisqualify(row.id)}>Disqualify</Button>
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Stack>
  );
}

function AwardsTab() {
  const [draws, setDraws] = useState([]);
  const [selectedDrawId, setSelectedDrawId] = useState("");
  const [awards, setAwards] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getPredictionAdminDraws()
      .then((data) => {
        if (!active) return;
        const rows = data?.draws || [];
        setDraws(rows);
        if (rows[0]) setSelectedDrawId(String(rows[0].id));
      })
      .catch((err) => {
        if (active) setError(err?.response?.data?.error || err?.message || "Failed to load draws.");
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedDrawId) return;
    getPredictionAdminDrawAwards(selectedDrawId)
      .then((data) => setAwards(data?.awards || []))
      .catch((err) => setError(err?.response?.data?.error || err?.message || "Failed to load awards."));
  }, [selectedDrawId]);

  const handleStatus = async (awardId, status) => {
    try {
      const adminNotes = window.prompt("Admin notes (optional)", "");
      await updatePredictionAdminAwardStatus(awardId, { status, admin_notes: adminNotes || "" });
      const data = await getPredictionAdminDrawAwards(selectedDrawId);
      setAwards(data?.awards || []);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to update award status.");
    }
  };

  return (
    <Stack spacing={2}>
      <AdminTimezoneNotice />
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Paper sx={{ p: 2 }}>
        <TextField select fullWidth label="Draw" value={selectedDrawId} onChange={(e) => setSelectedDrawId(e.target.value)}>
          {draws.map((row) => <MenuItem key={row.id} value={String(row.id)}>{row.title}</MenuItem>)}
        </TextField>
      </Paper>
      <Stack spacing={1.5}>
        {awards.map((award) => (
          <Paper key={award.id} variant="outlined" sx={{ p: 1.5 }}>
            <Stack spacing={1}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{award.display_name}</Typography>
              <Typography variant="body2" color="text.secondary">{award.prize_name} · {award.status}</Typography>
              <TimeDisplay label="Awarded" value={award.created_at} />
              <TimeDisplay label="Published" value={award.published_at_utc || award.updated_at} />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                {["contacted", "claimed", "forfeited", "disqualified"].map((statusOption) => (
                  <Button key={statusOption} variant="outlined" onClick={() => handleStatus(award.id, statusOption)}>{statusOption}</Button>
                ))}
              </Stack>
            </Stack>
          </Paper>
        ))}
        {!awards.length ? <Paper sx={{ p: 2 }}><Typography variant="body2" color="text.secondary">Run a draw to create prize awards.</Typography></Paper> : null}
      </Stack>
    </Stack>
  );
}

const emptyDailyBonusForm = {
  daily_key: "",
  question_type: "most_goals_match",
  title: "",
  description: "",
  options_json: '[{"key":"yes","label":"Yes"},{"key":"no","label":"No"}]',
  points_value: 1,
  opens_at_utc: "",
  lock_at_utc: "",
  status: "draft",
  source_payload_json: "{}",
};
const dailyBonusQuestionTypes = [
  "most_goals_match",
  "total_goals_range",
  "any_draw_today",
  "biggest_margin_match",
  "fewest_goals_match",
  "clean_sheet_count",
  "draw_count",
  "any_team_3_plus_goals",
  "both_teams_score_count",
  "most_goals_team",
];

function DailyBonusTab() {
  const [filters, setFilters] = useState({ dailyKey: "", status: "", questionType: "" });
  const [state, setState] = useState({ loading: true, error: "", items: [], info: "" });
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyDailyBonusForm);

  const load = async (nextFilters = filters) => {
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const data = await getPredictionAdminDailyBonus({
        dailyKey: nextFilters.dailyKey || undefined,
        status: nextFilters.status || undefined,
        questionType: nextFilters.questionType || undefined,
      });
      setState((prev) => ({ ...prev, loading: false, items: data?.items || [] }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error?.response?.data?.error || error?.message || "Failed to load daily bonus questions.",
      }));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const parseJsonField = (value, fallback) => {
    try {
      return JSON.parse(value || fallback);
    } catch (_error) {
      throw new Error("Invalid JSON payload in options or source payload.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        ...form,
        points_value: Number(form.points_value || 1),
        options_json: parseJsonField(form.options_json, "[]"),
        source_payload_json: parseJsonField(form.source_payload_json, "{}"),
      };
      if (editingId) {
        await updatePredictionAdminDailyBonus(editingId, payload);
      } else {
        await createPredictionAdminDailyBonus(payload);
      }
      setEditingId(null);
      setForm(emptyDailyBonusForm);
      setState((prev) => ({ ...prev, info: "Daily bonus question saved.", error: "" }));
      await load();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error?.response?.data?.error || error?.message || "Failed to save daily bonus question.",
      }));
    }
  };

  const doAction = async (fn, args, successMessage) => {
    try {
      await fn(...args);
      setState((prev) => ({ ...prev, info: successMessage, error: "" }));
      await load();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error?.response?.data?.error || error?.message || "Daily bonus action failed.",
      }));
    }
  };

  return (
    <Stack spacing={2}>
      <AdminTimezoneNotice />
      {state.error ? <Alert severity="error">{state.error}</Alert> : null}
      {state.info ? <Alert severity="success">{state.info}</Alert> : null}
      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
          <Button variant="outlined" onClick={() => doAction(seedDailyBonusFromFixtures, [{ stage_key: "group_stage", replace: false }], "Group-stage daily bonus questions seeded from fixtures.")}>
            Seed from Fixtures
          </Button>
          <Button variant="outlined" onClick={() => doAction(scoreReadyPredictionAdminDailyBonus, [{}], "Ready daily bonus questions scored.")}>
            Score Ready Questions
          </Button>
        </Stack>
      </Paper>
      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Typography variant="h6">{editingId ? "Edit Daily Bonus" : "Create Daily Bonus"}</Typography>
          <Alert severity="info">
            Daily bonus open and lock fields use your local timezone: <strong>{formatViewerTimezoneLabel()}</strong>. They are converted to UTC automatically when saved.
          </Alert>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><TextField fullWidth label="Daily key" value={form.daily_key} onChange={(e) => setForm((prev) => ({ ...prev, daily_key: e.target.value }))} placeholder="2026-06-11" required /></Grid>
            <Grid item xs={12} md={3}><TextField select fullWidth label="Question type" value={form.question_type} onChange={(e) => setForm((prev) => ({ ...prev, question_type: e.target.value }))}>{dailyBonusQuestionTypes.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Title" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} required /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Description" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Points value" type="number" value={form.points_value} onChange={(e) => setForm((prev) => ({ ...prev, points_value: e.target.value }))} /></Grid>
            <Grid item xs={12} md={4}>
              <AdminUtcDateTimeField
                label="Opens (your time)"
                value={form.opens_at_utc}
                onChange={(nextValue) => setForm((prev) => ({ ...prev, opens_at_utc: nextValue }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <AdminUtcDateTimeField
                label="Locks (your time)"
                value={form.lock_at_utc}
                onChange={(nextValue) => setForm((prev) => ({ ...prev, lock_at_utc: nextValue }))}
              />
            </Grid>
            <Grid item xs={12} md={4}><TextField select fullWidth label="Status" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}><MenuItem value="draft">draft</MenuItem><MenuItem value="open">open</MenuItem><MenuItem value="locked">locked</MenuItem><MenuItem value="cancelled">cancelled</MenuItem></TextField></Grid>
            <Grid item xs={12} md={8}><TextField fullWidth multiline minRows={3} label="Options JSON" value={form.options_json} onChange={(e) => setForm((prev) => ({ ...prev, options_json: e.target.value }))} /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline minRows={2} label="Source Payload JSON" value={form.source_payload_json} onChange={(e) => setForm((prev) => ({ ...prev, source_payload_json: e.target.value }))} /></Grid>
          </Grid>
          <Stack direction="row" spacing={1}>
            <Button type="submit" variant="contained">{editingId ? "Update Question" : "Create Question"}</Button>
            {editingId ? <Button variant="outlined" onClick={() => { setEditingId(null); setForm(emptyDailyBonusForm); }}>Cancel edit</Button> : null}
          </Stack>
        </Stack>
      </Paper>
      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField label="Daily key" value={filters.dailyKey} onChange={(e) => setFilters((prev) => ({ ...prev, dailyKey: e.target.value }))} />
          <TextField select label="Status" value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))} sx={{ minWidth: 180 }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="draft">draft</MenuItem>
            <MenuItem value="open">open</MenuItem>
            <MenuItem value="locked">locked</MenuItem>
            <MenuItem value="scored">scored</MenuItem>
            <MenuItem value="cancelled">cancelled</MenuItem>
          </TextField>
          <TextField select label="Question type" value={filters.questionType} onChange={(e) => setFilters((prev) => ({ ...prev, questionType: e.target.value }))} sx={{ minWidth: 220 }}>
            <MenuItem value="">All</MenuItem>
            {dailyBonusQuestionTypes.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
          </TextField>
          <Button variant="outlined" onClick={() => load(filters)}>Apply filters</Button>
        </Stack>
      </Paper>
      <Stack spacing={1.5}>
        {(state.items || []).map((item) => (
          <Paper key={item.id} variant="outlined" sx={{ p: 1.5 }}>
            <Stack spacing={1}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{item.daily_key} · {item.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {item.question_type} · {item.status} · answers {item.answer_count || 0} · correct {item.correct_answer_count || 0}
              </Typography>
              <TimeDisplay label="Opens" value={item.opens_at_utc} />
              <TimeDisplay label="Lock" value={item.lock_at_utc} />
              <TimeDisplay label="Scored" value={item.scored_at_utc} />
              {item.correct_option_keys_json?.length ? (
                <Typography variant="body2" color="text.secondary">
                  Correct options: {item.correct_option_keys_json.join(", ")}
                </Typography>
              ) : null}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button variant="text" onClick={() => {
                  setForm({
                    daily_key: item.daily_key || "",
                    question_type: item.question_type || "most_goals_match",
                    title: item.title || "",
                    description: item.description || "",
                    options_json: JSON.stringify(item.options_json || [], null, 2),
                    points_value: item.points_value || 1,
                    opens_at_utc: item.opens_at_utc || "",
                    lock_at_utc: item.lock_at_utc || "",
                    status: item.status || "draft",
                    source_payload_json: JSON.stringify(item.source_payload_json || {}, null, 2),
                  });
                  setEditingId(item.id);
                }}>
                  Edit
                </Button>
                <Button variant="outlined" onClick={() => doAction(scorePredictionAdminDailyBonus, [item.id], "Daily bonus question scored.")}>
                  Score Question
                </Button>
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Stack>
  );
}

function MultiPickTab() {
  const [state, setState] = useState({
    loading: true,
    error: "",
    info: "",
    items: [],
    leaderboardRows: [],
    leaderboardChallenge: null,
    seedSummary: null,
  });
  const [showHelp, setShowHelp] = useState(false);
  const [replaceDraftBlocks, setReplaceDraftBlocks] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyMultiPickForm);

  const load = async () => {
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const data = await getPredictionAdminMultiPickChallenges({});
      setState((prev) => ({
        ...prev,
        loading: false,
        items: data?.items || [],
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error?.response?.data?.error || error?.message || "Failed to load Multi-Pick challenges.",
      }));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyMultiPickForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        title: form.title,
        mode: "outcome",
        stage_key: form.stage_key || "group_stage",
        starts_at_utc: form.starts_at_utc || null,
        locks_at_utc: form.locks_at_utc || null,
        ends_at_utc: form.ends_at_utc || null,
        status: form.status || "draft",
        max_cards_per_user: Number(form.max_cards_per_user || 5),
        match_ids_json: parseMultiPickMatchIds(form.match_ids_text),
      };
      if (editingId) {
        await updatePredictionAdminMultiPickChallenge(editingId, payload);
        setState((prev) => ({ ...prev, error: "", info: "Multi-Pick block updated." }));
      } else {
        await createPredictionAdminMultiPickChallenge(payload);
        setState((prev) => ({ ...prev, error: "", info: "Multi-Pick block created." }));
      }
      resetForm();
      await load();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error?.response?.data?.message || error?.response?.data?.error || error?.message || "Failed to save Multi-Pick block.",
      }));
    }
  };

  const handleSeed = async () => {
    try {
      const data = await seedPredictionAdminMultiPickFromFixtures({
        stageKey: "group_stage",
        replace: replaceDraftBlocks,
      });
      setState((prev) => ({
        ...prev,
        error: "",
        info: `Seed completed. Created ${data?.created_count || 0}, skipped ${data?.skipped_count || 0}.`,
        seedSummary: data,
      }));
      await load();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error?.response?.data?.error || error?.message || "Failed to seed Multi-Pick blocks from fixtures.",
      }));
    }
  };

  const handleQuickStatus = async (challengeId, status, successMessage) => {
    try {
      await updatePredictionAdminMultiPickChallenge(challengeId, { status });
      setState((prev) => ({ ...prev, error: "", info: successMessage }));
      await load();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error?.response?.data?.error || error?.message || "Failed to update Multi-Pick status.",
      }));
    }
  };

  const handleScore = async (challengeId) => {
    try {
      const data = await scorePredictionAdminMultiPickChallenge(challengeId);
      const topCount = (data?.top || []).length;
      setState((prev) => ({
        ...prev,
        error: "",
        info: `Block scored. ${data?.summary?.scored_card_count || 0} cards scored. Top preview: ${topCount}.`,
      }));
      await load();
    } catch (error) {
      const payload = error?.response?.data || {};
      if (payload?.status === "not_ready" && payload?.reason === "results_missing") {
        const missingCount = (payload?.missing_match_ids || []).length;
        setState((prev) => ({
          ...prev,
          error: `This block cannot be scored yet. Missing results for ${missingCount} matches.`,
        }));
        return;
      }
      setState((prev) => ({
        ...prev,
        error: payload?.error || error?.message || "Failed to score Multi-Pick block.",
      }));
    }
  };

  const handlePublish = async (challengeId) => {
    try {
      const data = await publishPredictionAdminMultiPickChallenge(challengeId);
      setState((prev) => ({
        ...prev,
        error: "",
        info: `Published winners. Top players shown: ${(data?.top || []).length}.`,
      }));
      await load();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error?.response?.data?.error || error?.message || "Failed to publish Multi-Pick winners.",
      }));
    }
  };

  const handleViewLeaderboard = async (challenge) => {
    try {
      const data = await getPredictionAdminMultiPickLeaderboard(challenge.id);
      setState((prev) => ({
        ...prev,
        error: "",
        leaderboardRows: data?.rows || [],
        leaderboardChallenge: {
          ...(challenge || {}),
          ...(data?.challenge || {}),
          participant_count: Number(data?.participant_count || data?.challenge?.participant_count || challenge?.participant_count || 0),
        },
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error?.response?.data?.error || error?.message || "Failed to load Multi-Pick leaderboard.",
      }));
    }
  };

  return (
    <Stack spacing={2}>
      <AdminTimezoneNotice />
      {state.error ? <Alert severity="error">{state.error}</Alert> : null}
      {state.info ? <Alert severity="success">{state.info}</Alert> : null}

      <Paper sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Typography variant="h6">Multi-Pick Challenge</Typography>
          <Typography variant="body2" color="text.secondary">
            Create 3-day outcome-pick blocks from fixtures. Users submit up to 5 cards. Their best card counts.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1} alignItems={{ sm: "center" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              How Multi-Pick Works
            </Typography>
            <Button
              variant="text"
              endIcon={<ExpandMoreRoundedIcon sx={{ transform: showHelp ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 160ms ease" }} />}
              onClick={() => setShowHelp((prev) => !prev)}
            >
              {showHelp ? "Hide help" : "Show help"}
            </Button>
          </Stack>
          <Collapse in={showHelp}>
            <Stack spacing={1.2}>
              <Typography variant="body2" color="text.secondary">
                Multi-Pick is separate from Weekly Challenge.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Users pick Home / Draw / Away, not exact scores.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Users can submit up to 5 cards per block. The best card counts.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This MVP has no cash prize or draw integration.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Admin enters match results in the existing Results tab. After all results are entered, admin scores the Multi-Pick block. Publishing shows the top players to users.
              </Typography>
              <Stack spacing={0.4}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Workflow</Typography>
                <Typography variant="body2" color="text.secondary">1. Seed blocks from fixtures</Typography>
                <Typography variant="body2" color="text.secondary">2. Review block matches and lock time</Typography>
                <Typography variant="body2" color="text.secondary">3. Open the block</Typography>
                <Typography variant="body2" color="text.secondary">4. Users submit cards</Typography>
                <Typography variant="body2" color="text.secondary">5. Enter results in existing Results tab</Typography>
                <Typography variant="body2" color="text.secondary">6. Score the block</Typography>
                <Typography variant="body2" color="text.secondary">7. Publish top players</Typography>
              </Stack>
              <Alert severity="warning">
                Do not confuse Multi-Pick with prize draws. Multi-Pick winners are recognition-only in MVP.
              </Alert>
            </Stack>
          </Collapse>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1} alignItems={{ sm: "center" }}>
            <Typography variant="h6">Seed blocks from fixtures</Typography>
            <Button variant="outlined" onClick={handleSeed}>
              Seed Group-Stage Multi-Pick Blocks
            </Button>
          </Stack>
          <FormControlLabel
            control={<Checkbox checked={replaceDraftBlocks} onChange={(e) => setReplaceDraftBlocks(e.target.checked)} />}
            label="Replace draft blocks only"
          />
          <Typography variant="body2" color="text.secondary">
            Only draft blocks are replaced. Open, scored, or published blocks are skipped.
          </Typography>
          {state.seedSummary ? (
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Stack spacing={1}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Seed result
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Created: {state.seedSummary.created_count || 0} · Skipped: {state.seedSummary.skipped_count || 0}
                </Typography>
                {(state.seedSummary.blocks_created || []).length ? (
                  <Stack spacing={0.35}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>Blocks created</Typography>
                    {(state.seedSummary.blocks_created || []).map((row) => (
                      <Typography key={`created-${row.id || row.title}`} variant="body2" color="text.secondary">
                        {row.title} · {row.match_count} matches
                      </Typography>
                    ))}
                  </Stack>
                ) : null}
                {(state.seedSummary.blocks_skipped || []).length ? (
                  <Stack spacing={0.35}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>Blocks skipped</Typography>
                    {(state.seedSummary.blocks_skipped || []).map((row) => (
                      <Typography key={`skipped-${row.id || row.title}`} variant="body2" color="text.secondary">
                        {row.title} · {row.status} · {row.match_count} matches
                      </Typography>
                    ))}
                  </Stack>
                ) : null}
              </Stack>
            </Paper>
          ) : null}
        </Stack>
      </Paper>

      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Typography variant="h6">{editingId ? "Edit Multi-Pick block" : "Create Multi-Pick block"}</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Title"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Mode" value="Outcome" InputProps={{ readOnly: true }} helperText="Outcome mode only for MVP." />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Stage"
                value={form.stage_key}
                onChange={(e) => setForm((prev) => ({ ...prev, stage_key: e.target.value }))}
                helperText="Group-stage blocks are the intended MVP flow."
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Starts UTC"
                value={form.starts_at_utc}
                onChange={(e) => setForm((prev) => ({ ...prev, starts_at_utc: e.target.value }))}
                placeholder="2026-06-11T19:00:00Z"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Locks UTC"
                value={form.locks_at_utc}
                onChange={(e) => setForm((prev) => ({ ...prev, locks_at_utc: e.target.value }))}
                placeholder="2026-06-11T19:00:00Z"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Ends UTC"
                value={form.ends_at_utc}
                onChange={(e) => setForm((prev) => ({ ...prev, ends_at_utc: e.target.value }))}
                placeholder="2026-06-13T23:00:00Z"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Status"
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                {multipickStatuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Max cards per user"
                value={form.max_cards_per_user}
                onChange={(e) => setForm((prev) => ({ ...prev, max_cards_per_user: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Match IDs"
                value={form.match_ids_text}
                onChange={(e) => setForm((prev) => ({ ...prev, match_ids_text: e.target.value }))}
                helperText="Only edit match IDs if you know what you are doing. Seeded blocks already include the correct group-stage matches."
              />
            </Grid>
          </Grid>
          <Stack direction="row" spacing={1}>
            <Button type="submit" variant="contained">
              {editingId ? "Update block" : "Create block"}
            </Button>
            {editingId ? (
              <Button variant="outlined" onClick={resetForm}>
                Cancel edit
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </Paper>

      <Stack spacing={1.5}>
        {(state.items || []).map((challenge) => {
          const canScore = ["open", "locked"].includes(challenge.status);
          const canPublish = challenge.status === "scored";
          const canOpen = challenge.status === "draft";
          return (
            <Paper key={challenge.id} variant="outlined" sx={{ p: 1.5 }}>
              <Stack spacing={1}>
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {challenge.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Outcome mode · {challenge.status} · {formatMultiPickRange(challenge)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {challenge.match_count || 0} matches · Cards submitted {challenge.card_count || 0} · Max {challenge.max_cards_per_user || 5} cards per user
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Stage: {formatStageLabel(challenge.stage_key || "group_stage")}
                    </Typography>
                    <TimeDisplay label="Lock" value={challenge.locks_at_utc} />
                  </Box>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <Button
                      variant="text"
                      onClick={() => {
                        setEditingId(challenge.id);
                        setForm({
                          title: challenge.title || "",
                          mode: challenge.mode || "outcome",
                          stage_key: challenge.stage_key || "group_stage",
                          starts_at_utc: challenge.starts_at_utc || "",
                          locks_at_utc: challenge.locks_at_utc || "",
                          ends_at_utc: challenge.ends_at_utc || "",
                          status: challenge.status || "draft",
                          max_cards_per_user: challenge.max_cards_per_user || 5,
                          match_ids_text: JSON.stringify(challenge.match_ids_json || [], null, 2),
                        });
                      }}
                    >
                      Edit
                    </Button>
                    {canOpen ? (
                      <Button
                        variant="outlined"
                        onClick={() => handleQuickStatus(challenge.id, "open", "Multi-Pick block opened.")}
                      >
                        Open
                      </Button>
                    ) : null}
                    {canScore ? (
                      <Button variant="outlined" onClick={() => handleScore(challenge.id)}>
                        Score Challenge
                      </Button>
                    ) : null}
                    {canPublish ? (
                      <Button variant="outlined" onClick={() => handlePublish(challenge.id)}>
                        Publish
                      </Button>
                    ) : null}
                    <Button variant="outlined" onClick={() => handleViewLeaderboard(challenge)}>
                      View Leaderboard
                    </Button>
                  </Stack>
                </Stack>
                {(challenge.top_preview || []).length ? (
                  <Stack spacing={0.35}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      Top players
                    </Typography>
                    {challenge.participant_count > 0 ? (
                      <Typography variant="caption" color="text.secondary">
                        Ranking is based on each player's best card. {challenge.participant_count} players scored.
                      </Typography>
                    ) : null}
                    {(challenge.top_preview || []).slice(0, 5).map((row) => (
                      <Typography key={`preview-${challenge.id}-${row.recruiter_id}`} variant="body2" color="text.secondary">
                        #{row.rank} {row.emoji_avatar ? `${row.emoji_avatar} ` : ""}{row.display_name} · Best card {row.card_number} · {row.correct_count}/{challenge.match_count || 0} correct
                      </Typography>
                    ))}
                  </Stack>
                ) : null}
              </Stack>
            </Paper>
          );
        })}
        {!state.loading && !(state.items || []).length ? (
          <PredictionEmptyState
            title="No Multi-Pick blocks yet"
            body="Seed group-stage blocks from fixtures or create a block manually."
          />
        ) : null}
      </Stack>

      <Paper sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Typography variant="h6">Leaderboard review</Typography>
          {state.leaderboardChallenge ? (
            <Stack spacing={0.35}>
              <Typography variant="body2" color="text.secondary">
                {state.leaderboardChallenge.title} · {formatMultiPickRange(state.leaderboardChallenge)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Ranking is based on each player's best card.
                {Number(state.leaderboardChallenge.participant_count || 0) > 0
                  ? ` ${state.leaderboardChallenge.participant_count} players scored.`
                  : ""}
              </Typography>
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Choose View Leaderboard on a block to review top players.
            </Typography>
          )}
          {state.leaderboardChallenge && !state.leaderboardRows.length ? (
            <PredictionEmptyState
              title="No cards submitted yet."
              body="Leaderboard rows will appear here after users submit Multi-Pick cards."
            />
          ) : null}
          <Stack spacing={1}>
            {(state.leaderboardRows || []).map((row) => (
              <Paper key={`leaderboard-${row.recruiter_id}-${row.best_card_id}`} variant="outlined" sx={{ p: 1.25 }}>
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                  <Stack spacing={0.3}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      #{row.rank} {row.emoji_avatar ? `${row.emoji_avatar} ` : ""}{row.display_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Best card {row.card_number} · {row.correct_count}/{state.leaderboardChallenge?.match_count || 0} correct
                    </Typography>
                    {row.favorite_team_name ? (
                      <Typography variant="body2" color="text.secondary">
                        Favorite team: {row.favorite_team_name}
                      </Typography>
                    ) : null}
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Submitted: {formatViewerDateTimeLabel(row.submitted_at_utc)}
                  </Typography>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}

export default function PredictionAdminPage() {
  const [tab, setTab] = useState("matches");
  const tabs = useMemo(
    () => [
      { key: "campaign", label: "Campaign" },
      { key: "fixtures", label: "Fixtures" },
      { key: "matches", label: "Matches" },
      { key: "results", label: "Results" },
      { key: "leaderboard", label: "Leaderboard" },
      { key: "multipick", label: "Multi-Pick" },
      { key: "daily-bonus", label: "Daily Bonus" },
      { key: "draws", label: "Draws" },
      { key: "referrals", label: "Referrals" },
      { key: "awards", label: "Awards" },
      { key: "audit-logs", label: "Audit Logs" },
    ],
    []
  );

  const renderTab = () => {
    switch (tab) {
      case "campaign":
        return <CampaignTab />;
      case "fixtures":
        return <FixturesTab />;
      case "matches":
        return <MatchesTab />;
      case "results":
        return <ResultsTab />;
      case "leaderboard":
        return <LeaderboardTab />;
      case "multipick":
        return <MultiPickTab />;
      case "daily-bonus":
        return <DailyBonusTab />;
      case "draws":
        return <DrawsTab />;
      case "referrals":
        return <ReferralsTab />;
      case "awards":
        return <AwardsTab />;
      case "audit-logs":
        return <AuditLogsTab />;
      default:
        return <MatchesTab />;
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Prediction Challenge</Typography>
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs value={tab} onChange={(_e, next) => setTab(next)} variant="scrollable" scrollButtons="auto">
          {tabs.map((item) => (
            <Tab key={item.key} value={item.key} label={item.label} />
          ))}
        </Tabs>
      </Box>
      {renderTab()}
    </Box>
  );
}
