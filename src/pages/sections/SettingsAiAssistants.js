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

const sectionSx = {
  border: "1px solid",
  borderColor: "rgba(40, 83, 174, 0.16)",
  borderRadius: 3,
  bgcolor: "background.paper",
  boxShadow: "0 8px 24px rgba(24, 45, 90, 0.06)",
  p: { xs: 2, sm: 2.5 },
};

const uiFont = '"Inter", "Roboto", "Helvetica", Arial, sans-serif';
const sectionTitleSx = { fontFamily: uiFont, fontWeight: 750, letterSpacing: "-0.01em", fontSize: "1rem" };
const mutedTextSx = { fontFamily: uiFont, fontSize: "0.875rem", lineHeight: 1.55, color: "text.secondary" };

const scopePreview = (scopes, details, limit = 4) => scopes.slice(0, limit).map((scope) => details.get(scope) || scope);

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

  const openAccess = (connection = {}) => {
    setDesiredProfileKey("manager");
    setAccessConnection(connection);
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
  const activeConnections = (status.connections || []).filter((connection) => connection.state !== "disconnected");
  const previousConnections = (status.connections || []).filter((connection) => connection.state === "disconnected");

  const copyText = async (value, successText) => {
    if (!value || !navigator.clipboard?.writeText) {
      setMessage({ severity: "info", text: t("settings.aiAssistants.copyUnavailable", "Copy is not available in this browser. Select the text below.") });
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setMessage({ severity: "success", text: successText });
    } catch (_error) {
      setMessage({ severity: "info", text: t("settings.aiAssistants.copyUnavailable", "Copy is not available in this browser. Select the text below.") });
    }
  };

  return (
    <Stack
      spacing={2.5}
      sx={{
        fontFamily: uiFont,
        maxWidth: 1180,
        pb: 2,
        color: "#172554",
        "& .MuiTypography-root": { fontFamily: uiFont, color: "#172554" },
        "& .MuiTypography-colorTextSecondary": { color: "#52617a" },
        "& .MuiChip-root": {
          height: 24,
          borderRadius: 1.25,
          bgcolor: "#eef4ff",
          border: "1px solid #cadbff",
          color: "#19345d",
          fontFamily: uiFont,
          fontWeight: 700,
          fontSize: "0.72rem",
          "& .MuiChip-label": { color: "#19345d", px: 1 },
        },
        "& .MuiChip-colorSuccess": { bgcolor: "#e7f6ed", borderColor: "#a9ddbc", "& .MuiChip-label": { color: "#17653a" } },
        "& .MuiChip-colorWarning": { bgcolor: "#fff5df", borderColor: "#f1c86d", "& .MuiChip-label": { color: "#825600" } },
        "& .MuiChip-colorInfo": { bgcolor: "#e9f3ff", borderColor: "#a9ccfb", "& .MuiChip-label": { color: "#164f8e" } },
      }}
    >
      <Dialog open={Boolean(accessConnection)} onClose={() => setAccessConnection(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, "& .MuiTypography-root": { fontFamily: uiFont, color: "#172554" }, "& .MuiChip-root": { color: "#19345d", bgcolor: "#eef4ff", border: "1px solid #cadbff", fontWeight: 700, "& .MuiChip-label": { color: "#19345d" } }, "& .MuiChip-colorSuccess": { bgcolor: "#e7f6ed", "& .MuiChip-label": { color: "#17653a" } }, "& .MuiChip-colorWarning": { bgcolor: "#fff5df", "& .MuiChip-label": { color: "#825600" } } } }}>
        <DialogTitle>{accessConnection?.id ? t("settings.aiAssistants.manageAccess", "Manage access") : "Connect an assistant"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {t(
                "settings.aiAssistants.manageAccessExplanation",
                "Choose the access to request. Schedulaa never changes an existing connection here: reconnect from your assistant, then approve the new request."
              )}
            </Typography>
            <Stack spacing={1.25}>
              {profiles.map((profile) => (
                <Box
                  key={profile.key}
                  sx={{ border: 1, borderColor: desiredProfileKey === profile.key ? "primary.main" : "divider", borderRadius: 2, p: 1.25, bgcolor: desiredProfileKey === profile.key ? "action.selected" : "background.paper" }}
                >
                  <FormControlLabel
                    control={<Radio checked={desiredProfileKey === profile.key} onChange={() => setDesiredProfileKey(profile.key)} />}
                    label={<Typography variant="body2" sx={{ fontWeight: 700 }}>{profile.name}</Typography>}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>{profile.summary}</Typography>
                </Box>
              ))}
            </Stack>
            <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.5 }}>
              <Typography variant="subtitle2">{t("settings.aiAssistants.desiredPermissions", "Desired permissions")}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {desiredProfile?.name || t("settings.aiAssistants.noPermissions", "None")}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {desiredScopes.length} permission{desiredScopes.length === 1 ? "" : "s"} requested. Sensitive actions still require a separate in-app approval.
              </Typography>
              <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.75} sx={{ mt: 1 }}>
                {scopePreview(desiredScopes, scopeDetails).map((label) => <Chip key={label} size="small" label={label} />)}
                {desiredScopes.length > 4 && <Chip size="small" variant="outlined" label={`+${desiredScopes.length - 4} more`} />}
              </Stack>
            </Box>
            <Box>
              <Typography variant="subtitle2">{t("settings.aiAssistants.usableNow", "Usable now")}</Typography>
              <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.75} sx={{ mt: 0.75 }}>
                {usableDesiredScopes.length ? scopePreview(usableDesiredScopes, scopeDetails).map((label) => (
                  <Chip key={label} size="small" color="success" label={label} />
                )) : <Typography variant="body2" color="text.secondary">{t("settings.aiAssistants.noneUsable", "None of the selected permissions is on this connection yet.")}</Typography>}
                {usableDesiredScopes.length > 4 && <Chip size="small" color="success" variant="outlined" label={`+${usableDesiredScopes.length - 4} more`} />}
              </Stack>
              {missingDesiredScopes.length > 0 && <>
                <Typography variant="subtitle2" sx={{ mt: 1.25 }}>{t("settings.aiAssistants.stillMissing", "Still missing")}</Typography>
                <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.75} sx={{ mt: 0.75 }}>
                  {scopePreview(missingDesiredScopes, scopeDetails).map((label) => (
                    <Chip key={label} size="small" color="warning" label={label} />
                  ))}
                  {missingDesiredScopes.length > 4 && <Chip size="small" color="warning" variant="outlined" label={`+${missingDesiredScopes.length - 4} more`} />}
                </Stack>
              </>}
            </Box>
            <Alert severity={missingDesiredScopes.length ? "warning" : "success"}>
              {missingDesiredScopes.length
                ? t("settings.aiAssistants.accessMissing", "This connection does not yet have all desired permissions. Reauthorize it in your assistant, then refresh this page.")
                : t("settings.aiAssistants.accessReady", "This connection already has the selected permissions.")}
            </Alert>
            <Typography variant="body2" color="text.secondary">
              {t(
                "settings.aiAssistants.usableActionCount",
                `${(accessConnection?.usable_tools || []).length} assistant action${(accessConnection?.usable_tools || []).length === 1 ? " is" : "s are"} currently usable with this connection.`
              )}
            </Typography>
            <Box sx={{ borderRadius: 2, p: 1.5, bgcolor: "#f8fbff", border: "1px solid #d7e5fb" }}>
              <Typography sx={{ ...sectionTitleSx, fontSize: ".92rem" }}>Finish in your assistant</Typography>
              <Typography sx={{ ...mutedTextSx, mt: .5 }}>Muse: open the existing Schedulaa Connect card again. Grok: use the same connector’s reconnect action. Each opens the Schedulaa consent page for this new request.</Typography>
              {status.mcp_url && <Button size="small" variant="outlined" sx={{ mt: 1 }} onClick={() => copyConnectorUrl(status.mcp_url)}>Copy connector URL</Button>}
            </Box>
            <Accordion disableGutters elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="body2">Exact technical scope request</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Stack spacing={1}>
                  <Box component="code" sx={{ display: "block", p: 1, borderRadius: 1, bgcolor: "action.hover", fontSize: "0.76rem", wordBreak: "break-word" }}>{desiredScopes.join(" ")}</Box>
                  <Button size="small" variant="outlined" onClick={() => copyText(desiredScopes.join(" "), "Requested scope string copied.")} sx={{ alignSelf: "flex-start" }}>Copy scope request</Button>
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={load}>{t("common.refresh", "Refresh")}</Button>
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
        <Box sx={{ ...sectionSx, overflow: "hidden", position: "relative", background: "linear-gradient(135deg, rgba(29,78,216,.11), rgba(124,58,237,.06) 58%, rgba(255,255,255,.96))" }}>
          <Box sx={{ position: "absolute", width: 190, height: 190, borderRadius: "50%", right: -72, top: -92, bgcolor: "rgba(37,99,235,.08)" }} />
          <Stack spacing={0.75} sx={{ position: "relative" }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1} alignItems={{ sm: "center" }}>
              <Box>
                <Typography sx={{ ...sectionTitleSx, fontSize: "1.18rem" }}>{t("settings.aiAssistants.businessHeading", "AI assistant workspace")}</Typography>
                <Typography sx={mutedTextSx}>{t("settings.aiAssistants.account", "Signed in as")} {status.account?.display_name}</Typography>
              </Box>
              <Chip size="small" color={activeConnections.length ? "success" : "default"} label={activeConnections.length ? `${activeConnections.length} active connection${activeConnections.length === 1 ? "" : "s"}` : "No active connection"} />
            </Stack>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 1.25, mt: 1 }}>
              <Box sx={{ borderRadius: 2, p: 1.25, bgcolor: "rgba(255,255,255,.72)" }}><Typography sx={{ ...mutedTextSx, fontSize: "0.72rem", fontWeight: 750, textTransform: "uppercase", letterSpacing: ".06em" }}>Business</Typography><Typography sx={{ fontFamily: uiFont, fontWeight: 750, mt: .25 }}>{business.name}</Typography></Box>
              <Box sx={{ borderRadius: 2, p: 1.25, bgcolor: "rgba(255,255,255,.72)" }}><Typography sx={{ ...mutedTextSx, fontSize: "0.72rem", fontWeight: 750, textTransform: "uppercase", letterSpacing: ".06em" }}>Timezone</Typography><Typography sx={{ fontFamily: uiFont, fontWeight: 650, mt: .25 }}>{business.timezone}</Typography></Box>
            </Box>
          </Stack>
        </Box>
      )}
      {eligible && !configurationError && (
        <Box sx={sectionSx}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={.75} alignItems={{ sm: "center" }}>
            <Box><Typography sx={sectionTitleSx}>{t("settings.aiAssistants.accessHeading", "Access profiles")}</Typography><Typography sx={mutedTextSx}>Choose what a new authorization may request. Existing connections never change here.</Typography></Box>
            {Number(status.pending_approval_count) > 0 && <Button component="a" href="/manager/ai-assistant-approvals" variant="contained" size="small">Review approvals</Button>}
          </Stack>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 1.25, mt: 1.5 }}>
            {(status.access_profiles || []).map((profile) => (
              <Box key={profile.key} sx={{ border: "1px solid", borderColor: profile.key === "manager" ? "primary.light" : "divider", borderRadius: 2, p: 1.5, bgcolor: profile.key === "manager" ? "rgba(37,99,235,.045)" : "background.default" }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography sx={{ fontFamily: uiFont, fontWeight: 750, fontSize: ".94rem" }}>{profile.name}</Typography>
                  {profile.requires_reauthorization && (
                    <Chip size="small" color="warning" label={t("settings.aiAssistants.reauthorization", "New authorization required")} />
                  )}
                </Stack>
                <Typography sx={{ ...mutedTextSx, mt: .6 }}>{profile.summary}</Typography>
              </Box>
            ))}
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1.5 }}>
            <Button variant="contained" size="small" onClick={() => openAccess()}>{activeConnections.length ? "Request different access" : "Connect an assistant"}</Button>
            <Typography sx={{ ...mutedTextSx, alignSelf: { sm: "center" } }}>Setup starts in your assistant. This page never changes a connection’s permissions silently.</Typography>
          </Stack>
        </Box>
      )}
      {eligible && !configurationError && (
        <Stack spacing={1.25} sx={sectionSx}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={.75}><Box><Typography sx={sectionTitleSx}>{t("settings.aiAssistants.connections", "Your connections")}</Typography><Typography sx={mutedTextSx}>Connection health and access are shown here. Technical details stay collapsed.</Typography></Box>{status.mcp_url && <Button variant="outlined" size="small" onClick={() => copyConnectorUrl(status.mcp_url)}>Copy connector URL</Button>}</Stack>
          {activeConnections.length === 0 && (
            <Alert severity="info">
              {t("settings.aiAssistants.waiting", "Waiting for authorization. No assistant is connected yet.")}
            </Alert>
          )}
          <Stack spacing={1.25}>
          {activeConnections.map((connection) => (
            <Box key={connection.id} sx={{ border: "1px solid", borderColor: "primary.light", borderRadius: 2.25, p: { xs: 1.5, sm: 2 }, bgcolor: "rgba(37,99,235,.025)" }}>
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
                  <Typography sx={{ fontFamily: uiFont, fontWeight: 750, fontSize: ".95rem", mt: .75 }}>
                    {connection.account_display_name} · {connection.business_name}
                  </Typography>
                  <Typography sx={{ ...mutedTextSx, fontSize: ".78rem", mt: .4 }}>
                    {t("settings.aiAssistants.lastRequest", "Last successful assistant request")}:{" "}
                    {connection.last_successful_assistant_request_at || t("settings.aiAssistants.never", "Never")}
                  </Typography>
                  <Typography sx={{ ...mutedTextSx, fontSize: ".78rem" }}>
                    {connection.state === "disconnected"
                      ? t("settings.aiAssistants.connectionHealthDisconnected", "Connection health: disconnected")
                      : connection.last_successful_assistant_request_at
                        ? t("settings.aiAssistants.connectionHealthActive", "Connection health: a successful assistant request was recorded")
                        : t("settings.aiAssistants.connectionHealthPending", "Connection health: authorized; waiting for the first assistant request")}
                  </Typography>
                </Box>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={.75}>
                  {connection.owned_by_self && connection.state !== "disconnected" && status.mcp_url && (
                    <Button variant="outlined" size="small" onClick={() => openAccess(connection)} disabled={busyId === connection.id}>
                      {t("settings.aiAssistants.manageAccess", "Manage access")}
                    </Button>
                  )}
                  {connection.state !== "disconnected" && (connection.owned_by_self || status.permissions?.is_owner) && (
                    <Button
                      color="warning"
                      variant="contained"
                      size="small"
                      onClick={() => disconnect(connection.id)}
                      disabled={busyId === connection.id}
                    >
                      {t("settings.aiAssistants.disconnect", "Disconnect")}
                    </Button>
                  )}
                </Stack>
              </Stack>
              <Accordion disableGutters elevation={0} sx={{ mt: 1.25, border: "1px solid", borderColor: "divider", borderRadius: 1.5, bgcolor: "background.paper", "&:before": { display: "none" } }}>
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
                  {connection.owned_by_self && <Button size="small" variant="text" sx={{ mt: .75 }} onClick={() => protocolTest(connection.id)} disabled={busyId === connection.id}>Run connection diagnostic</Button>}
                </AccordionDetails>
              </Accordion>
            </Box>
          ))}
          </Stack>
          {previousConnections.length > 0 && <Accordion disableGutters elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "action.hover", "&:before": { display: "none" } }}><AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography sx={{ ...mutedTextSx, fontWeight: 700 }}>Previous connections ({previousConnections.length})</Typography></AccordionSummary><AccordionDetails sx={{ pt: 0 }}><Stack spacing={.75}>{previousConnections.map((connection) => <Box key={connection.id} sx={{ px: 1.25, py: 1, borderRadius: 1.5, bgcolor: "background.paper" }}><Typography sx={{ fontFamily: uiFont, fontSize: ".85rem", fontWeight: 650 }}>{connection.account_display_name} · {connection.business_name}</Typography><Typography sx={{ ...mutedTextSx, fontSize: ".76rem" }}>Disconnected. It cannot access this business.</Typography></Box>)}</Stack></AccordionDetails></Accordion>}
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
