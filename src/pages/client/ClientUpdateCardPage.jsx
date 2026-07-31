import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Checkbox, CircularProgress, FormControlLabel, Paper, Stack, Typography } from "@mui/material";
import { useParams, useSearchParams } from "react-router-dom";
import api from "../../utils/api";

export default function ClientUpdateCardPage() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const site = String(searchParams.get("site") || "").trim();
  const sessionId = String(searchParams.get("session_id") || "").trim();
  const canceled = searchParams.get("canceled") === "1";
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);

  const state = payload?.state || payload?.request?.status;
  const pendingRequest = payload?.request?.status === "pending";
  const canLaunch = Boolean(site && token && pendingRequest && !sessionId);
  const showCanceledNotice = Boolean(canceled && pendingRequest && !sessionId);

  const loadRequest = useCallback(async () => {
    if (!site || !token) {
      setError("This card update link is incomplete.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const url = sessionId
        ? `/public/${site}/card-on-file/update-session/${encodeURIComponent(sessionId)}`
        : `/public/${site}/card-on-file/update-request/${encodeURIComponent(token)}`;
      const res = sessionId
        ? await api.get(url, {
            params: { token },
            noAuth: true,
            noCompanyHeader: true,
          })
        : await api.get(url, { noAuth: true, noCompanyHeader: true });
      setPayload(res.data || null);
      setError("");
      setConsentAccepted(false);
    } catch (err) {
      setPayload(null);
      setError(err?.response?.data?.error || err?.message || "Unable to load this card update link.");
    } finally {
      setLoading(false);
    }
  }, [sessionId, site, token]);

  useEffect(() => {
    loadRequest();
  }, [loadRequest]);

  useEffect(() => {
    if (!sessionId) return undefined;
    if (!["verifying", "pending"].includes(state)) return undefined;
    const id = window.setInterval(() => {
      loadRequest();
    }, 2500);
    return () => window.clearInterval(id);
  }, [loadRequest, sessionId, state]);

  const handleStart = useCallback(async () => {
    if (!canLaunch || launching) return;
    if (!consentAccepted) {
      setError("Please accept the saved-card authorization to continue.");
      return;
    }
    try {
      setLaunching(true);
      const res = await api.post(
        `/public/${site}/card-on-file/update-request/${encodeURIComponent(token)}/checkout/session`,
        { card_on_file_consent: { accepted: true } },
        { noAuth: true, noCompanyHeader: true }
      );
      const url = res?.data?.url;
      if (!url) {
        await loadRequest();
        return;
      }
      window.location.assign(url);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to start secure card update.");
    } finally {
      setLaunching(false);
    }
  }, [canLaunch, consentAccepted, launching, loadRequest, site, token]);

  const heading = useMemo(() => {
    if (state === "confirmed" || payload?.request?.status === "completed") return "Card updated";
    if (state === "expired" || payload?.request?.status === "expired") return "Link expired";
    if (state === "canceled" || payload?.request?.status === "canceled") return "Card update canceled";
    if (state === "failed") return "Card update failed";
    if (state === "verifying") return "Verifying your card";
    return "Update saved card";
  }, [payload?.request?.status, state]);

  const bodyText = useMemo(() => {
    if (state === "confirmed" || payload?.request?.status === "completed") {
      return "Your saved card was updated successfully. No payment was collected.";
    }
    if (state === "expired" || payload?.request?.status === "expired") {
      return "This secure link has expired. Ask the business to send a new card update request.";
    }
    if (state === "canceled" || payload?.request?.status === "canceled") {
      return "Card update was not completed. You can try again while this secure link is still active.";
    }
    if (state === "failed") {
      return "We could not verify and save this card. Try again or ask the business to send a new secure link.";
    }
    if (state === "verifying") {
      return "We are confirming the card with Stripe and updating the saved card on file.";
    }
    return "Use this secure Stripe flow to replace the card saved on file. No payment is collected now.";
  }, [payload?.request?.status, state]);

  return (
    <Box sx={{ minHeight: "100vh", px: 2, py: 6, background: "linear-gradient(180deg, #f8f4f6 0%, #fff 100%)" }}>
      <Paper sx={{ maxWidth: 720, mx: "auto", p: { xs: 3, md: 4 }, borderRadius: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h3" sx={{ fontWeight: 800 }}>
            {heading}
          </Typography>
          {loading ? <CircularProgress /> : null}
          {!loading && error ? <Alert severity="error">{error}</Alert> : null}
          {!loading && !error && payload ? (
            <>
              <Typography variant="body1">{bodyText}</Typography>
              {showCanceledNotice ? (
                <Alert severity="info">Card update was not completed. You can try again using this secure link while it remains active.</Alert>
              ) : null}
              <Typography variant="body2" color="text.secondary">
                {payload?.company?.name ? `${payload.company.name}` : "The business"} requested a secure saved-card update for{" "}
                {payload?.client?.masked_email || "this client"}.
              </Typography>
              {payload?.card_on_file?.status_label ? (
                <Alert severity={payload?.card_on_file?.card_status === "update_required" || payload?.card_on_file?.expired ? "warning" : "info"}>
                  Current saved-card status: {payload.card_on_file.status_label}
                </Alert>
              ) : null}
              {payload?.request?.expires_at ? (
                <Typography variant="caption" color="text.secondary">
                  Link expires at {new Date(payload.request.expires_at).toLocaleString()}.
                </Typography>
              ) : null}
              {canLaunch ? (
                <Stack spacing={1.5}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={consentAccepted}
                        onChange={(event) => setConsentAccepted(event.target.checked)}
                        inputProps={{ "aria-label": "Authorize saved-card update" }}
                      />
                    }
                    label={`I authorize ${payload?.company?.name || "this business"} to securely save this card with Stripe for future charges permitted by the cancellation and no-show policy.`}
                  />
                  {payload?.request?.consent?.policy_text ? (
                    <Typography variant="body2" color="text.secondary">
                      {payload.request.consent.policy_text}
                    </Typography>
                  ) : null}
                  <Typography variant="body2" color="text.secondary">
                    No payment is collected now. A saved card can still be declined later.
                  </Typography>
                  <Button variant="contained" size="large" onClick={handleStart} disabled={launching || !consentAccepted}>
                    {launching ? "Opening secure Stripe checkout..." : "Update card securely"}
                  </Button>
                </Stack>
              ) : null}
            </>
          ) : null}
        </Stack>
      </Paper>
    </Box>
  );
}
