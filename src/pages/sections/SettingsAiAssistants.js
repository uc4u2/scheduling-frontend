import React, { useCallback, useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTranslation } from "react-i18next";
import { tenantAssistant } from "../../utils/api";

const stateColor = (state) => {
  if (state === "verified") return "success";
  if (state === "authorized") return "info";
  if (state === "expired" || state === "disconnected") return "warning";
  return "default";
};

const supportLabel = (support, t) => {
  if (support === "partially_verified") return t("settings.aiAssistants.support.partial", "Read-only connection observed; broader support not verified");
  if (support === "not_a_tenant_connection") return t("settings.aiAssistants.support.internal", "Not a business connection");
  if (support === "unsupported") return t("settings.aiAssistants.support.unsupported", "Not supported");
  return t("settings.aiAssistants.support.unverified", "Not verified");
};

export default function SettingsAiAssistants() {
  const { t } = useTranslation();
  const [status, setStatus] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [message, setMessage] = useState(null);
  const [busyId, setBusyId] = useState("");
  const [accessConnection, setAccessConnection] = useState(null);
  const [desiredProfileKey, setDesiredProfileKey] = useState("manager");

  const copyConnectorUrl = async (url) => {
    if (!url || !navigator.clipboard?.writeText) {
      setMessage({ severity: "info", text: t("settings.aiAssistants.copyUnavailable", "Copy is not available in this browser. Select the connector URL below.") });
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setMessage({ severity: "success", text: t("settings.aiAssistants.connectorCopied", "Connector URL copied. Add or reconnect it from your assistant.") });
    } catch (_error) {
      setMessage({ severity: "info", text: t("settings.aiAssistants.copyUnavailable", "Copy is not available in this browser. Select the connector URL below.") });
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const payload = await tenantAssistant.status();
      if (!payload || payload.enabled !== true) {
        setUnavailable(true);
        setStatus(null);
        setActivity([]);
        return;
      }
      setUnavailable(false);
      setStatus(payload);
      if (payload.eligible === true && !payload.configuration_error) {
        const history = await tenantAssistant.activity().catch(() => ({ items: [] }));
        setActivity(history.items || []);
      } else {
        setActivity([]);
      }
    } catch (error) {
      const code = error?.response?.status;
      setUnavailable(true);
      setStatus(null);
      setActivity([]);
      if (code !== 404 && code !== 501) {
        setMessage({
          severity: "error",
          text: t("settings.aiAssistants.loadError", "AI assistant settings could not be loaded. No connection was changed."),
        });
      }
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
    // The translation function is only used for messages. Reloading when its
    // identity changes would leave the panel spinning.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const disconnect = async (connectionId) => {
    setBusyId(connectionId);
    setMessage(null);
    try {
      await tenantAssistant.disconnect(connectionId);
      setMessage({
        severity: "success",
        text: t(
          "settings.aiAssistants.disconnected",
          "Disconnected. This connection stays off until someone approves a new one."
        ),
      });
      await load();
    } catch (error) {
      setMessage({
        severity: "error",
        text: error?.response?.data?.error || t("settings.aiAssistants.disconnectError", "Unable to disconnect."),
      });
    } finally {
      setBusyId("");
    }
  };

  const protocolTest = async (connectionId) => {
    setBusyId(connectionId);
    setMessage(null);
    try {
      const result = await tenantAssistant.protocolTest(connectionId);
      setMessage({
        severity: "info",
        text: result?.provider_verified
          ? t("settings.aiAssistants.providerVerified", "Provider verified.")
          : t(
              "settings.aiAssistants.localCheck",
              "Local protocol check passed. This does not verify Grok, Muse, or any other provider."
            ),
      });
      await load();
    } catch (error) {
      setMessage({
        severity: "error",
        text: error?.response?.data?.error || t("settings.aiAssistants.localCheckError", "Local protocol check failed."),
      });
    } finally {
      setBusyId("");
    }
  };

  if (loading) {
    return (
      <Stack direction="row" spacing={1} alignItems="center" aria-busy="true">
        <CircularProgress size={18} />
        <Typography variant="body2">
          {t("settings.aiAssistants.loading", "Checking whether AI assistant connections are available.")}
        </Typography>
      </Stack>
    );
  }

  if (unavailable || !status) {
    return (
      <Stack spacing={1}>
        {message && <Alert severity={message.severity}>{message.text}</Alert>}
        <Alert severity="info">
          {t(
            "settings.aiAssistants.unavailable",
            "AI assistant connections are not available for this account right now."
          )}
        </Alert>
      </Stack>
    );
  }

  const eligible = status.eligible === true && status.permissions;
  const business = status.business;
  const configurationError = status.configuration_error;
  const profiles = status.access_profiles || [];
  const desiredProfile = profiles.find((profile) => profile.key === desiredProfileKey) || profiles[0];
  const scopeDetails = new Map((status.scopes_offered || []).map((item) => [item.scope, item.description]));
  const grantedScopes = new Set(accessConnection?.scopes || []);
  const desiredScopes = desiredProfile?.scopes || [];
  const usableDesiredScopes = desiredScopes.filter((scope) => grantedScopes.has(scope));
  const missingDesiredScopes = desiredScopes.filter((scope) => !grantedScopes.has(scope));

  return (
    <Stack spacing={2}>
      <Dialog open={Boolean(accessConnection)} onClose={() => setAccessConnection(null)} maxWidth="md" fullWidth>
        <DialogTitle>{t("settings.aiAssistants.manageAccess", "Manage access")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2">
              {t(
                "settings.aiAssistants.manageAccessExplanation",
                "Choose the access you want the assistant to request. This does not alter the current connection: the assistant must start a new OAuth authorization and you must approve the requested scopes."
              )}
            </Typography>
            <Stack spacing={1}>
              {profiles.map((profile) => (
                <Box
                  key={profile.key}
                  sx={{ border: 1, borderColor: desiredProfileKey === profile.key ? "primary.main" : "divider", borderRadius: 1.5, p: 1.25 }}
                >
                  <FormControlLabel
                    control={<Radio checked={desiredProfileKey === profile.key} onChange={() => setDesiredProfileKey(profile.key)} />}
                    label={<Typography variant="body2" sx={{ fontWeight: 700 }}>{profile.name}</Typography>}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>{profile.summary}</Typography>
                </Box>
              ))}
            </Stack>
            <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 1.5 }}>
              <Typography variant="subtitle2">{t("settings.aiAssistants.desiredPermissions", "Desired permissions")}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {desiredProfile?.name || t("settings.aiAssistants.noPermissions", "None")}
              </Typography>
              <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.75} sx={{ mt: 1 }}>
                {desiredScopes.map((scope) => <Chip key={scope} size="small" label={scopeDetails.get(scope) || scope} />)}
              </Stack>
            </Box>
            <Box>
              <Typography variant="subtitle2">{t("settings.aiAssistants.usableNow", "Usable now")}</Typography>
              <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.75} sx={{ mt: 0.75 }}>
                {usableDesiredScopes.length ? usableDesiredScopes.map((scope) => (
                  <Chip key={scope} size="small" color="success" label={scopeDetails.get(scope) || scope} />
                )) : <Typography variant="body2" color="text.secondary">{t("settings.aiAssistants.noneUsable", "None of the selected permissions is on this connection yet.")}</Typography>}
              </Stack>
              {missingDesiredScopes.length > 0 && <>
                <Typography variant="subtitle2" sx={{ mt: 1.25 }}>{t("settings.aiAssistants.stillMissing", "Still missing")}</Typography>
                <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.75} sx={{ mt: 0.75 }}>
                  {missingDesiredScopes.map((scope) => (
                    <Chip key={scope} size="small" color="warning" label={scopeDetails.get(scope) || scope} />
                  ))}
                </Stack>
              </>}
            </Box>
            <Alert severity={missingDesiredScopes.length ? "warning" : "success"}>
              {missingDesiredScopes.length
                ? t("settings.aiAssistants.accessMissing", "This connection does not yet have all desired permissions. Reauthorize it in your assistant, then refresh this page.")
                : t("settings.aiAssistants.accessReady", "This connection already has the selected permissions.")}
            </Alert>
            <Typography variant="body2" color="text.secondary">
              {t("settings.aiAssistants.scopeRequest", "Ask the assistant to request exactly this scope string:")} <Box component="code" sx={{ wordBreak: "break-word" }}>{desiredScopes.join(" ")}</Box>
            </Typography>
            <Typography variant="body2">
              {t("settings.aiAssistants.museReauthorization", "Muse: open the existing Connect card again. It starts a new authorization; sign in to Schedulaa and approve only the scopes shown on its consent screen.")}
            </Typography>
            <Typography variant="body2">
              {t("settings.aiAssistants.grokReauthorization", "Grok: use the same working connector's reconnect flow. Schedulaa does not create a Grok deep link or silently extend existing tokens.")}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t("settings.aiAssistants.reauthorizationSafety", "A new authorization leaves this connection unchanged. Disconnect it separately if you no longer want it to have its current access.")}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={load}>{t("common.refresh", "Refresh")}</Button>
          {status.mcp_url && (
            <Button onClick={() => copyConnectorUrl(status.mcp_url)}>
              {t("settings.aiAssistants.copyConnectorUrl", "Copy connector URL")}
            </Button>
          )}
          <Button onClick={() => setAccessConnection(null)}>
            {t("common.close", "Close")}
          </Button>
        </DialogActions>
      </Dialog>
      {message && <Alert severity={message.severity}>{message.text}</Alert>}
      {!eligible && (
        <Alert severity="warning">
          {t(
            "settings.aiAssistants.ineligible",
            "Only an active owner or manager who can manage integrations can connect an assistant. Nothing has been connected."
          )}
        </Alert>
      )}
      {configurationError && (
        <Alert severity="warning">
          {t(
            "settings.aiAssistants.configurationError",
            "AI assistant connections are not configured on this Schedulaa deployment yet. No connection can be created."
          )}
        </Alert>
      )}
      {eligible && !configurationError && business && (
        <Box>
          <Typography variant="subtitle1">
            {t("settings.aiAssistants.businessHeading", "Business to connect")}
          </Typography>
          <Typography variant="body2">
            {business.name} · {t("settings.aiAssistants.timezone", "Timezone")}: {business.timezone}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("settings.aiAssistants.account", "Signed in as")} {status.account?.display_name}
          </Typography>
        </Box>
      )}
      {eligible && !configurationError && (
        <Box>
          <Typography variant="subtitle1">
            {t("settings.aiAssistants.accessHeading", "Choose access to request")}
          </Typography>
          <Stack spacing={1} sx={{ mt: 1 }}>
            {(status.access_profiles || []).map((profile) => (
              <Box key={profile.key} sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 1.25 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{profile.name}</Typography>
                  {profile.requires_reauthorization && (
                    <Chip size="small" color="warning" label={t("settings.aiAssistants.reauthorization", "New authorization required")} />
                  )}
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{profile.summary}</Typography>
              </Box>
            ))}
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t("settings.aiAssistants.reconnectHelp", "Select a profile under a connection’s Manage access button. Connections begin in your assistant; Settings shows the exact scope request and never changes an existing token itself.")}
          </Typography>
          {Number(status.pending_approval_count) > 0 && (
            <Button component="a" href="/manager/ai-assistant-approvals" variant="contained" sx={{ mt: 1 }}>
              {t(
                "settings.aiAssistants.reviewApprovals",
                `Review ${status.pending_approval_count} assistant action waiting for you`
              )}
            </Button>
          )}
          {status.mcp_url && (
            <Stack spacing={0.5} sx={{ mt: 1 }}>
              <Button variant="outlined" size="small" onClick={() => copyConnectorUrl(status.mcp_url)} sx={{ alignSelf: "flex-start" }}>
                {t("settings.aiAssistants.copyConnectorUrl", "Copy connector URL")}
              </Button>
              <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                {t("settings.aiAssistants.connectorUrl", "Connector URL")}: {status.mcp_url}
              </Typography>
            </Stack>
          )}
        </Box>
      )}
      {eligible && !configurationError && (
        <Stack spacing={1}>
          <Typography variant="subtitle1">{t("settings.aiAssistants.providers", "Assistants")}</Typography>
          {(status.providers || []).map((provider) => (
            <Box key={provider.key}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {provider.name}
                </Typography>
                <Chip size="small" label={supportLabel(provider.support, t)} />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {provider.summary}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                {t(
                  "settings.aiAssistants.providerSetup",
                  "Start this connection inside the assistant. Use its supported remote MCP or connector flow, then sign in to Schedulaa when it opens the consent page."
                )}
              </Typography>
              {provider.reauthorization && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  {provider.reauthorization}
                </Typography>
              )}
            </Box>
          ))}
        </Stack>
      )}
      {eligible && !configurationError && (
        <Stack spacing={1}>
          <Typography variant="subtitle1">{t("settings.aiAssistants.connections", "Connections")}</Typography>
          {(status.connections || []).length === 0 && (
            <Alert severity="info">
              {t("settings.aiAssistants.waiting", "Waiting for authorization. No assistant is connected yet.")}
            </Alert>
          )}
          {(status.connections || []).map((connection) => (
            <Box key={connection.id} sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 1.5 }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between">
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Chip size="small" color={stateColor(connection.state)} label={connection.state} />
                    {connection.verified && (
                      <Chip size="small" color="success" label={t("settings.aiAssistants.verified", "Connection verified")} />
                    )}
                    {!connection.verified && connection.state === "authorized" && (
                      <Chip size="small" label={t("settings.aiAssistants.authorizedOnly", "Authorized, not yet verified")} />
                    )}
                  </Stack>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {connection.account_display_name} · {connection.business_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {t("settings.aiAssistants.lastRequest", "Last successful assistant request")}:{" "}
                    {connection.last_successful_assistant_request_at || t("settings.aiAssistants.never", "Never")}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {connection.state === "disconnected"
                      ? t("settings.aiAssistants.connectionHealthDisconnected", "Connection health: disconnected")
                      : connection.last_successful_assistant_request_at
                        ? t("settings.aiAssistants.connectionHealthActive", "Connection health: a successful assistant request was recorded")
                        : t("settings.aiAssistants.connectionHealthPending", "Connection health: authorized; waiting for the first assistant request")}
                  </Typography>
                </Box>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  {connection.owned_by_self && connection.state !== "disconnected" && (
                    <Button
                      variant="outlined"
                      onClick={() => protocolTest(connection.id)}
                      disabled={busyId === connection.id}
                    >
                      {t("settings.aiAssistants.localTest", "Run local protocol check")}
                    </Button>
                  )}
                  {connection.owned_by_self && connection.state !== "disconnected" && status.mcp_url && (
                    <Button variant="outlined" onClick={() => setAccessConnection(connection)} disabled={busyId === connection.id}>
                      {t("settings.aiAssistants.manageAccess", "Manage access")}
                    </Button>
                  )}
                  {connection.state !== "disconnected" && (connection.owned_by_self || status.permissions?.is_owner) && (
                    <Button
                      color="warning"
                      variant="contained"
                      onClick={() => disconnect(connection.id)}
                      disabled={busyId === connection.id}
                    >
                      {t("settings.aiAssistants.disconnect", "Disconnect")}
                    </Button>
                  )}
                </Stack>
              </Stack>
              <Accordion disableGutters elevation={0} sx={{ mt: 1, borderTop: 1, borderColor: "divider" }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body2">{t("settings.aiAssistants.advanced", "Advanced")}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {t("settings.aiAssistants.reportedName", "Name reported by the connector (not verified)")}: {connection.reported_client_name || t("settings.aiAssistants.unknownClient", "Unknown")}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {t("settings.aiAssistants.effectivePermissions", "Granted OAuth scopes")}: {connection.scopes?.length ? connection.scopes.join(", ") : t("settings.aiAssistants.noPermissions", "None")}
                  </Typography>
                  {connection.local_protocol_checked_at && <Typography variant="caption" color="text.secondary" display="block">{t("settings.aiAssistants.localChecked", "Local protocol check recorded. This is not provider verification.")}</Typography>}
                </AccordionDetails>
              </Accordion>
            </Box>
          ))}
        </Stack>
      )}
      {eligible && !configurationError && (
        <Accordion disableGutters elevation={0} sx={{ borderTop: 1, borderColor: "divider" }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">{t("settings.aiAssistants.advancedActivity", "Advanced activity")}</Typography>
          </AccordionSummary>
          <AccordionDetails>
          <Divider sx={{ mb: 1 }} />
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{t("settings.aiAssistants.activity", "Activity")}</Typography>
          {activity.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              {t("settings.aiAssistants.noActivity", "No assistant activity yet.")}
            </Typography>
          )}
          <Stack component="ul" spacing={0.5} sx={{ pl: 2 }}>
            {activity.map((item) => (
              <Typography component="li" variant="body2" key={item.id}>
                {item.created_at} · {item.actor_display_name || t("settings.aiAssistants.accountActor", "Account")} ·{" "}
                {item.action} · {item.outcome}
                {item.tool_name ? ` · ${item.tool_name}` : ""}
              </Typography>
            ))}
          </Stack>
          </AccordionDetails>
        </Accordion>
      )}
    </Stack>
  );
}
