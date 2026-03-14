import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Box, Divider, Grid, Snackbar, Stack, Typography } from "@mui/material";
import LeadProgressCards from "../../components/salesRep/LeadProgressCards";
import LeadCurrentCard from "../../components/salesRep/LeadCurrentCard";
import LeadOutcomeForm from "../../components/salesRep/LeadOutcomeForm";
import LeadCallbacksPanel from "../../components/salesRep/LeadCallbacksPanel";
import LeadHistoryPanel from "../../components/salesRep/LeadHistoryPanel";
import {
  getCurrentLead,
  getLeadHistory,
  getLeadProgress,
  getNextLead,
  getTodayCallbacks,
  skipLead,
  submitLeadOutcome,
  triggerTwilioCall,
} from "../../api/salesRepCRM";

const emptyForm = {
  outcome: "",
  note: "",
  callback_at: "",
  registration_link_sent: false,
  deal_id: "",
};

function toUtcIso(value) {
  if (!value) return undefined;
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return undefined;
  return dt.toISOString();
}

export default function SalesLeadQueuePage() {
  const [progress, setProgress] = useState({});
  const [lead, setLead] = useState(null);
  const [callbacks, setCallbacks] = useState([]);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loadingLead, setLoadingLead] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [calling, setCalling] = useState(false);
  const [banner, setBanner] = useState({ type: "success", message: "" });

  const loadPage = useCallback(async () => {
    try {
      const [progressResp, currentLead, callbacksResp, historyResp] = await Promise.all([
        getLeadProgress(),
        getCurrentLead(),
        getTodayCallbacks(),
        getLeadHistory({ limit: 20 }),
      ]);
      setProgress(progressResp || {});
      setLead(currentLead || null);
      setCallbacks(callbacksResp || []);
      setHistory(historyResp || []);
    } catch (error) {
      setBanner({ type: "error", message: error?.response?.data?.error || "Failed to load lead queue." });
    }
  }, []);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const handleNextLead = async () => {
    setLoadingLead(true);
    try {
      const nextLead = await getNextLead();
      setLead(nextLead || null);
      if (!nextLead) {
        setBanner({ type: "info", message: "No lead is available right now." });
      }
      await loadPage();
    } catch (error) {
      setBanner({ type: "error", message: error?.response?.data?.error || "Failed to fetch the next lead." });
    } finally {
      setLoadingLead(false);
    }
  };

  const handleSubmit = async () => {
    if (!lead || !form.outcome) return;
    if (form.outcome === "call_back_later" && !form.callback_at) {
      setBanner({ type: "warning", message: "Set a callback time before submitting call_back_later." });
      return;
    }
    if (form.outcome === "interested" && !form.callback_at && !form.deal_id) {
      setBanner({ type: "warning", message: "Interested leads need a callback time or an existing deal ID so ownership stays protected." });
      return;
    }
    if (form.outcome === "booked_demo" && !form.deal_id) {
      setBanner({ type: "warning", message: "Booked demo requires an existing deal ID so commission attribution stays linked to you." });
      return;
    }
    setSubmitting(true);
    try {
      await submitLeadOutcome(lead.id, {
        outcome: form.outcome,
        note: form.note || undefined,
        callback_at: form.callback_at ? toUtcIso(form.callback_at) : undefined,
        registration_link_sent: form.registration_link_sent,
        deal_id: form.deal_id ? Number(form.deal_id) : undefined,
      });
      setForm(emptyForm);
      setBanner({ type: "success", message: "Outcome submitted." });
      await loadPage();
    } catch (error) {
      setBanner({ type: "error", message: error?.response?.data?.error || "Failed to submit outcome." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!lead) return;
    setSubmitting(true);
    try {
      await skipLead(lead.id, {});
      setBanner({ type: "success", message: "Lead skipped." });
      await loadPage();
    } catch (error) {
      setBanner({ type: "error", message: error?.response?.data?.error || "Failed to skip lead." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTwilioCall = async () => {
    if (!lead?.id) return;
    setCalling(true);
    try {
      const result = await triggerTwilioCall(lead.id);
      setBanner({
        type: "success",
        message: result?.call_status === "initiated" ? "Twilio call started. Answer your phone to connect." : "Call request sent.",
      });
      await loadPage();
    } catch (error) {
      setBanner({ type: "error", message: error?.response?.data?.error || "Failed to start Twilio call." });
    } finally {
      setCalling(false);
    }
  };

  const statusSummary = useMemo(() => {
    const byStatus = progress?.by_status || {};
    const entries = Object.entries(byStatus);
    if (!entries.length) return "No assigned statuses yet.";
    return entries.map(([key, value]) => `${key}: ${value}`).join(" • ");
  }, [progress]);

  return (
    <Box>
      <Stack spacing={3}>
        <Stack spacing={0.5}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Lead Queue</Typography>
          <Typography variant="body2" color="text.secondary">
            Work one lead at a time, record the outcome, and move to the next call without browsing the full database.
          </Typography>
        </Stack>

        <LeadProgressCards progress={progress} />

        <Alert severity="info" variant="outlined">{statusSummary}</Alert>

        <Grid container spacing={3}>
          <Grid item xs={12} lg={7}>
            <Stack spacing={3}>
              <LeadCurrentCard
                lead={lead}
                loading={loadingLead}
                onNext={handleNextLead}
                onSkip={handleSkip}
                skipDisabled={!lead || submitting || calling}
                onCall={handleTwilioCall}
                callLoading={calling}
              />
              <LeadOutcomeForm
                lead={lead}
                form={form}
                onChange={(field, value) => setForm((prev) => ({ ...prev, [field]: value }))}
                onSubmit={handleSubmit}
                submitting={submitting}
              />
            </Stack>
          </Grid>
          <Grid item xs={12} lg={5}>
            <Stack spacing={3}>
              <LeadCallbacksPanel callbacks={callbacks} />
              <Divider />
              <LeadHistoryPanel history={history} />
            </Stack>
          </Grid>
        </Grid>
      </Stack>

      <Snackbar open={Boolean(banner.message)} autoHideDuration={4000} onClose={() => setBanner({ type: "success", message: "" })}>
        <Alert severity={banner.type} onClose={() => setBanner({ type: "success", message: "" })} sx={{ width: "100%" }}>
          {banner.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
