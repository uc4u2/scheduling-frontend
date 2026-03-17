import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  Link,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  applyAiSdrResult,
  getAiSdrLeadContext,
  listAiSdrLeadCalls,
  startAiSdrLeadCall,
} from "../../../api/platformAdminSales";
import platformAdminApi from "../../../api/platformAdminApi";
import { formatDateTimeInTz } from "../../../utils/datetime";
import { getUserTimezone } from "../../../utils/timezone";

const AI_RESULT_OPTIONS = [
  "asked_not_to_call_again",
  "asked_for_info_by_email",
  "wants_account_or_registration",
  "unavailable_but_open_later",
  "no_answer",
  "voicemail",
  "busy",
  "wrong_number",
  "not_interested",
];

function formatDateTime(value, timezone) {
  if (!value) return "—";
  return formatDateTimeInTz(value, timezone) || value;
}

function DetailRow({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2">{value || "—"}</Typography>
    </Box>
  );
}

const initialFormState = {
  result_key: "",
  callback_at: "",
  explicit_demo_resend: false,
  explicit_invite_resend: false,
  summary: "",
};

export default function LeadAiSdrPanel({ lead, reps = [], onRefresh, showBanner }) {
  const viewerTimezone = useMemo(() => getUserTimezone(), []);
  const assignedRep = useMemo(
    () => reps.find((rep) => Number(rep.id) === Number(lead?.assigned_rep_id)) || null,
    [lead?.assigned_rep_id, reps]
  );
  const isAiOwned = Boolean(assignedRep?.is_ai_agent);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [contextResp, setContextResp] = useState({ enabled: false, context: null, block_reason: null });
  const [calls, setCalls] = useState([]);
  const [error, setError] = useState("");
  const [formsByCallId, setFormsByCallId] = useState({});

  const load = useCallback(async () => {
    if (!lead?.id) {
      setContextResp({ enabled: false, context: null, block_reason: null });
      setCalls([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [contextData, callsData] = await Promise.all([
        getAiSdrLeadContext(lead.id),
        listAiSdrLeadCalls(lead.id),
      ]);
      setContextResp(contextData || { enabled: false, context: null, block_reason: null });
      setCalls(callsData?.calls || []);
    } catch (loadError) {
      setError(loadError?.response?.data?.error || "Failed to load AI SDR details.");
    } finally {
      setLoading(false);
    }
  }, [lead?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const next = {};
    calls.forEach((call) => {
      next[call.id] = formsByCallId[call.id] || initialFormState;
    });
    setFormsByCallId(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calls]);

  const setCallFormValue = useCallback((callId, field, value) => {
    setFormsByCallId((prev) => ({
      ...prev,
      [callId]: {
        ...(prev[callId] || initialFormState),
        [field]: value,
      },
    }));
  }, []);

  const handleStartCall = async () => {
    if (!lead?.id) return;
    setSubmitting(true);
    try {
      await startAiSdrLeadCall(lead.id);
      showBanner?.("success", "AI SDR call started.");
      await load();
      await onRefresh?.();
    } catch (requestError) {
      showBanner?.("error", requestError?.response?.data?.error || "Failed to start AI SDR call.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyResult = async (callId) => {
    const form = formsByCallId[callId] || initialFormState;
    if (!form.result_key) {
      showBanner?.("error", "Select an AI result first.");
      return;
    }
    if (form.result_key === "unavailable_but_open_later" && !form.callback_at) {
      showBanner?.("error", "Callback time is required for unavailable_but_open_later.");
      return;
    }
    setSubmitting(true);
    try {
      await applyAiSdrResult(callId, {
        result_key: form.result_key,
        callback_at: form.callback_at ? new Date(form.callback_at).toISOString() : null,
        explicit_demo_resend: Boolean(form.explicit_demo_resend),
        explicit_invite_resend: Boolean(form.explicit_invite_resend),
        summary: form.summary || undefined,
      });
      setFormsByCallId((prev) => ({ ...prev, [callId]: initialFormState }));
      showBanner?.("success", "AI SDR result applied.");
      await load();
      await onRefresh?.();
    } catch (requestError) {
      showBanner?.("error", requestError?.response?.data?.error || "Failed to apply AI SDR result.");
    } finally {
      setSubmitting(false);
    }
  };

  const context = contextResp?.context || null;
  const blockReason = contextResp?.block_reason || null;

  const handleToggleExcluded = async () => {
    if (!lead?.id) return;
    setSubmitting(true);
    try {
      await platformAdminApi.patch(`/sales/leads/${lead.id}`, {
        ai_sdr_excluded: !Boolean(lead.ai_sdr_excluded),
      });
      showBanner?.("success", lead.ai_sdr_excluded ? "Lead restored to AI SDR." : "Lead excluded from AI SDR.");
      await load();
      await onRefresh?.();
    } catch (requestError) {
      showBanner?.("error", requestError?.response?.data?.error || "Failed to update AI SDR lead exclusion.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2.25 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="subtitle2">AI SDR</Typography>
          <Typography variant="body2" color="text.secondary">
            Compact admin-only visibility into AI lead ownership, context, call history, and deterministic result application.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
          <Chip
            size="small"
            variant="outlined"
            color={isAiOwned ? "primary" : "default"}
            label={assignedRep ? `${isAiOwned ? "AI rep" : "Human rep"} · ${assignedRep.full_name}` : "Unassigned"}
          />
          <Chip
            size="small"
            variant="outlined"
            color={contextResp?.enabled ? "success" : "warning"}
            label={contextResp?.enabled ? "AI SDR enabled" : "AI SDR disabled"}
          />
          {isAiOwned ? (
            <Chip
              size="small"
              variant="outlined"
              color={blockReason ? "warning" : "success"}
              label={blockReason ? `Blocked: ${blockReason}` : "Eligible now"}
            />
          ) : null}
          {lead?.ai_sdr_excluded ? (
            <Chip size="small" variant="outlined" color="warning" label="AI excluded" />
          ) : null}
          {isAiOwned && assignedRep?.ai_sdr_paused ? (
            <Chip size="small" variant="outlined" color="warning" label="Rep AI paused" />
          ) : null}
        </Stack>

        {!isAiOwned ? (
          <Alert severity="info" variant="outlined">
            This lead is not assigned to an AI rep. AI SDR actions are intentionally hidden for human-owned leads.
          </Alert>
        ) : null}

        {error ? <Alert severity="error" variant="outlined">{error}</Alert> : null}

        <Grid container spacing={1.5}>
          <Grid item xs={12} md={6}>
            <DetailRow label="Last outcome" value={context?.last_outcome} />
          </Grid>
          <Grid item xs={12} md={6}>
            <DetailRow label={`Callback at (${viewerTimezone})`} value={formatDateTime(context?.callback_at, viewerTimezone)} />
          </Grid>
          <Grid item xs={12} md={6}>
            <DetailRow label="Demo sent recently" value={context?.demo_link_sent_recently ? "Yes" : "No"} />
          </Grid>
          <Grid item xs={12} md={6}>
            <DetailRow label="Invite sent recently" value={context?.invite_sent_recently ? "Yes" : "No"} />
          </Grid>
          <Grid item xs={12} md={6}>
            <DetailRow label="Lead excluded from AI" value={context?.ai_sdr_excluded ? "Yes" : "No"} />
          </Grid>
          <Grid item xs={12} md={6}>
            <DetailRow label="Assigned AI rep paused" value={context?.assigned_rep_ai_sdr_paused ? "Yes" : "No"} />
          </Grid>
          <Grid item xs={12} md={6}>
            <DetailRow label="Sales deal" value={context?.sales_deal_id ? `Deal #${context.sales_deal_id}` : "—"} />
          </Grid>
          <Grid item xs={12} md={6}>
            <DetailRow label="AI calls in 7d" value={String(context?.recent_ai_call_count_7d ?? 0)} />
          </Grid>
        </Grid>

        {Array.isArray(context?.latest_notes) && context.latest_notes.length ? (
          <Box>
            <Typography variant="caption" color="text.secondary">Recent notes</Typography>
            <Stack spacing={1} sx={{ mt: 0.75 }}>
              {context.latest_notes.map((note, index) => (
                <Paper key={`${lead?.id || "lead"}-note-${index}`} variant="outlined" sx={{ p: 1.25 }}>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{note}</Typography>
                </Paper>
              ))}
            </Stack>
          </Box>
        ) : null}

        <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
          <Button variant="outlined" onClick={load} disabled={loading || submitting}>
            {loading ? "Refreshing…" : "Refresh AI SDR"}
          </Button>
          {isAiOwned ? (
            <Button variant="outlined" color={lead?.ai_sdr_excluded ? "success" : "warning"} onClick={handleToggleExcluded} disabled={loading || submitting}>
              {lead?.ai_sdr_excluded ? "Include in AI" : "Exclude from AI"}
            </Button>
          ) : null}
          {isAiOwned ? (
            <Button
              variant="contained"
              onClick={handleStartCall}
              disabled={Boolean(blockReason) || loading || submitting || !contextResp?.enabled}
            >
              Start AI call
            </Button>
          ) : null}
        </Stack>

        <Divider />

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>AI call history</Typography>
          {!calls.length ? (
            <Alert severity="info" variant="outlined">
              No AI SDR calls have been logged for this lead yet.
            </Alert>
          ) : (
            <Stack spacing={1.5}>
              {calls.map((call) => {
                const form = formsByCallId[call.id] || initialFormState;
                return (
                  <Paper key={call.id} variant="outlined" sx={{ p: 1.5 }}>
                    <Stack spacing={1.25}>
                      <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" spacing={1}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            Call #{call.id}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Started {formatDateTime(call.started_at, viewerTimezone)} ({viewerTimezone})
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                          <Chip size="small" variant="outlined" label={call.status || "queued"} />
                          {call.result ? <Chip size="small" variant="outlined" color="primary" label={call.result} /> : null}
                          <Chip size="small" variant="outlined" label={`Duration: ${call.duration_seconds || 0}s`} />
                          {call.demo_link_sent ? <Chip size="small" variant="outlined" color="info" label="Demo sent" /> : null}
                          {call.invite_link_sent ? <Chip size="small" variant="outlined" color="success" label="Invite sent" /> : null}
                          {call.callback_set ? <Chip size="small" variant="outlined" color="warning" label="Callback set" /> : null}
                        </Stack>
                      </Stack>

                      <Grid container spacing={1.5}>
                        <Grid item xs={12} md={6}>
                          <DetailRow label="Call SID" value={call.twilio_call_sid} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <DetailRow label="Model" value={call.model_name} />
                        </Grid>
                      </Grid>

                      {call.recording_url ? (
                        <Link href={call.recording_url} target="_blank" rel="noreferrer" underline="hover">
                          Open recording
                        </Link>
                      ) : null}

                      <Divider />

                      <Grid container spacing={1.5}>
                        <Grid item xs={12} md={4}>
                          <TextField
                            select
                            fullWidth
                            size="small"
                            label="Apply result"
                            value={form.result_key}
                            onChange={(event) => setCallFormValue(call.id, "result_key", event.target.value)}
                          >
                            <MenuItem value="">Select result</MenuItem>
                            {AI_RESULT_OPTIONS.map((option) => (
                              <MenuItem key={option} value={option}>{option}</MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            size="small"
                            type="datetime-local"
                            label="Callback at"
                            value={form.callback_at}
                            onChange={(event) => setCallFormValue(call.id, "callback_at", event.target.value)}
                            InputLabelProps={{ shrink: true }}
                            disabled={form.result_key !== "unavailable_but_open_later"}
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Summary override"
                            value={form.summary}
                            onChange={(event) => setCallFormValue(call.id, "summary", event.target.value)}
                          />
                        </Grid>
                      </Grid>

                      <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                        <FormControlLabel
                          control={(
                            <Switch
                              checked={Boolean(form.explicit_demo_resend)}
                              onChange={(event) => setCallFormValue(call.id, "explicit_demo_resend", event.target.checked)}
                            />
                          )}
                          label="Allow demo resend"
                        />
                        <FormControlLabel
                          control={(
                            <Switch
                              checked={Boolean(form.explicit_invite_resend)}
                              onChange={(event) => setCallFormValue(call.id, "explicit_invite_resend", event.target.checked)}
                            />
                          )}
                          label="Allow invite resend"
                        />
                        <Box sx={{ flexGrow: 1 }} />
                        <Button
                          variant="contained"
                          onClick={() => handleApplyResult(call.id)}
                          disabled={submitting || !form.result_key}
                        >
                          Apply result
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}
