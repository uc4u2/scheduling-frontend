import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  FormControlLabel,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { tenantAssistant } from "../../utils/api";

export default function AiAssistantConsentPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const transactionId = useMemo(() => new URLSearchParams(location.search).get("transaction") || "", [location.search]);
  const [record, setRecord] = useState(null);
  const [selected, setSelected] = useState([]);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem("token");
    if (!transactionId) {
      setLoading(false);
      setError(t("settings.aiAssistants.consentMissing", "This approval link is incomplete."));
      return undefined;
    }
    if (!token) {
      const next = `/manager/ai-assistant-consent?transaction=${encodeURIComponent(transactionId)}`;
      navigate(`/login?next=${encodeURIComponent(next)}`, { replace: true });
      return undefined;
    }
    let active = true;
    tenantAssistant
      .authorization(transactionId)
      .then((payload) => {
        if (!active) return;
        setRecord(payload);
        setSelected((payload.requested_scopes || []).map((item) => item.scope).filter((scope) => scope !== "customers.contact.read"));
      })
      .catch((requestError) => {
        if (!active) return;
        const status = requestError?.response?.status;
        const code = requestError?.response?.data?.error;
        if (status === 404 && (!code || code === "not_found")) {
          setUnavailable(true);
        } else if (status === 401) {
          const next = `/manager/ai-assistant-consent?transaction=${encodeURIComponent(transactionId)}`;
          navigate(`/login?next=${encodeURIComponent(next)}`, { replace: true });
        } else if (code === "authorization_expired") {
          setError(t("settings.aiAssistants.consentExpired", "This approval link has expired or was already used."));
        } else if (code === "not_manager" || code === "integration_permission" || code === "support_session") {
          setError(
            t(
              "settings.aiAssistants.consentDeniedRole",
              "This account cannot approve an assistant connection."
            )
          );
        } else {
          setError(t("settings.aiAssistants.consentLoadError", "This approval could not be loaded."));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [navigate, t, transactionId]);

  const toggle = (scope) => {
    setSelected((current) => {
      if (current.includes(scope)) {
        const next = current.filter((item) => item !== scope);
        if (scope === "customers.read") return next.filter((item) => item !== "customers.contact.read");
        return next;
      }
      if (scope === "customers.contact.read" && !current.includes("customers.read")) return current;
      return [...current, scope];
    });
  };

  const decide = async (decision) => {
    setSubmitting(true);
    setError("");
    try {
      const result = await tenantAssistant.decide(transactionId, {
        decision,
        consent: decision === "approve" ? consent : false,
        scopes: decision === "approve" ? selected : [],
      });
      if (result?.redirect_to) {
        window.location.assign(result.redirect_to);
        return;
      }
      setError(t("settings.aiAssistants.consentNoReturn", "Schedulaa could not return you to the assistant."));
    } catch (requestError) {
      setError(
        requestError?.response?.data?.error ||
          t("settings.aiAssistants.consentSaveError", "The approval could not be saved.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const requestsManagerAccess = (record?.requested_scopes || []).some(
    (item) => !["assistant.whoami", "customers.read", "customers.contact.read"].includes(item.scope)
  );

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={2}>
        <Typography variant="h5" component="h1">
          {t("settings.aiAssistants.consentTitle", "Approve assistant access")}
        </Typography>
        {loading && (
          <Stack direction="row" spacing={1} alignItems="center" aria-busy="true">
            <CircularProgress size={18} />
            <Typography>{t("settings.aiAssistants.loading", "Checking whether AI assistant connections are available.")}</Typography>
          </Stack>
        )}
        {!loading && unavailable && (
          <Alert severity="info">
            {t("settings.aiAssistants.unavailable", "AI assistant connections are not available for this account right now.")}
          </Alert>
        )}
        {!loading && error && <Alert severity="error">{error}</Alert>}
        {!loading && record && (
          <Box>
            <Typography variant="body1">
              {record.business?.name} · {record.business?.timezone}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("settings.aiAssistants.account", "Signed in as")} {record.account?.display_name}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {t("settings.aiAssistants.reportedName", "Name reported by the connector (not verified)")}:{" "}
              {record.reported_client_name || t("settings.aiAssistants.unknownClient", "Unknown")}
            </Typography>
            <Alert severity={requestsManagerAccess ? "warning" : "info"} sx={{ mt: 2 }}>
              {requestsManagerAccess
                ? t(
                    "settings.aiAssistants.managerConsentExplanation",
                    "This connector is requesting Manager access. Review every selected permission. Consequential actions still require a separate in-app human approval."
                  )
                : t(
                    "settings.aiAssistants.readConsentExplanation",
                    "This connector is requesting read-only access. It cannot change business data with these permissions."
                  )}
            </Alert>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t(
                "settings.aiAssistants.newAuthorizationExplanation",
                "This is a new OAuth authorization. It does not add permissions to an existing assistant token or reconnect a disconnected one."
              )}
            </Typography>
            <Stack spacing={0.5} sx={{ mt: 2 }}>
              {(record.requested_scopes || []).map((scope) => (
                <FormControlLabel
                  key={scope.scope}
                  control={
                    <Checkbox
                      checked={selected.includes(scope.scope)}
                      onChange={() => toggle(scope.scope)}
                      inputProps={{ "aria-label": scope.description }}
                    />
                  }
                  label={scope.description}
                />
              ))}
            </Stack>
            <FormControlLabel
              sx={{ mt: 1 }}
              control={
                <Checkbox
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                  inputProps={{ "aria-label": t("settings.aiAssistants.consentCheck", "I approve this read access") }}
                />
              }
              label={t(
                "settings.aiAssistants.consentCheck",
                "I approve the selected access for the signed-in account and this business."
              )}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
              <Button variant="contained" disabled={!consent || submitting || selected.length === 0} onClick={() => decide("approve")}>
                {t("settings.aiAssistants.approve", "Approve")}
              </Button>
              <Button variant="outlined" color="warning" disabled={submitting} onClick={() => decide("deny")}>
                {t("settings.aiAssistants.deny", "Deny")}
              </Button>
              <Button component={Link} to="/manager/dashboard?tab=ai-assistants">
                {t("settings.aiAssistants.back", "Back to settings")}
              </Button>
            </Stack>
          </Box>
        )}
      </Stack>
    </Container>
  );
}
