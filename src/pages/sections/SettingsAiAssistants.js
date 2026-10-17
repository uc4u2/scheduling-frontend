import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { tenantAssistant } from "../../utils/api";

const stateColor = (state) => {
  if (state === "verified") return "success";
  if (state === "authorized") return "info";
  if (state === "expired" || state === "disconnected") return "warning";
  return "default";
};

const supportLabel = (support, t) => {
  if (support === "partially_verified") return t("settings.aiAssistants.support.partial", "Setup documented, plan not verified");
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
      if (payload.eligible === true) {
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

  return (
    <Stack spacing={2}>
      {message && <Alert severity={message.severity}>{message.text}</Alert>}
      {!eligible && (
        <Alert severity="warning">
          {t(
            "settings.aiAssistants.ineligible",
            "Only an active owner or manager who can manage integrations can connect an assistant. Nothing has been connected."
          )}
        </Alert>
      )}
      {eligible && business && (
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
      {eligible && (
        <Box>
          <Typography variant="subtitle1">
            {t("settings.aiAssistants.permissionsHeading", "Read permissions you can approve")}
          </Typography>
          <Stack component="ul" spacing={0.5} sx={{ pl: 2, m: 0 }}>
            {(status.scopes_offered || []).map((scope) => (
              <Typography component="li" variant="body2" key={scope.scope}>
                {scope.description}
              </Typography>
            ))}
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t(
              "settings.aiAssistants.reconnectHelp",
              "Open your assistant and add Schedulaa's connector. When it asks you to sign in, approve this business. A disconnected connection is not turned back on by itself."
            )}
          </Typography>
          {status.mcp_url && (
            <Typography variant="body2" sx={{ mt: 1, wordBreak: "break-all" }}>
              {t("settings.aiAssistants.connectorUrl", "Connector URL")}: {status.mcp_url}
            </Typography>
          )}
        </Box>
      )}
      {eligible && (
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
            </Box>
          ))}
        </Stack>
      )}
      {eligible && (
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
                    {t("settings.aiAssistants.reportedName", "Name reported by the connector (not verified)")}:{" "}
                    {connection.reported_client_name || t("settings.aiAssistants.unknownClient", "Unknown")}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {t("settings.aiAssistants.lastRequest", "Last successful assistant request")}:{" "}
                    {connection.last_successful_assistant_request_at || t("settings.aiAssistants.never", "Never")}
                  </Typography>
                  {connection.local_protocol_checked_at && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {t(
                        "settings.aiAssistants.localChecked",
                        "Local protocol check recorded. This is not provider verification."
                      )}
                    </Typography>
                  )}
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
            </Box>
          ))}
        </Stack>
      )}
      {eligible && (
        <Box>
          <Divider sx={{ mb: 1 }} />
          <Typography variant="subtitle1">{t("settings.aiAssistants.activity", "Activity")}</Typography>
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
        </Box>
      )}
    </Stack>
  );
}
