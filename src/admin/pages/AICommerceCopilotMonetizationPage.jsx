import React, { useEffect, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Chip, Divider, Stack, Typography } from "@mui/material";
import platformAdminApi from "../../api/platformAdminApi";

const ChecklistRow = ({ label, ok, value }) => (
  <Stack direction="row" justifyContent="space-between" spacing={2}>
    <Typography variant="body2">{label}</Typography>
    <Chip size="small" color={ok ? "success" : "default"} label={value || (ok ? "Ready" : "Missing")} />
  </Stack>
);

const ToggleRow = ({ label, help, enabled, onToggle, disabled, actionLabel }) => (
  <Card variant="outlined">
    <CardContent>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{label}</Typography>
          <Typography variant="body2" color="text.secondary">{help}</Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip label={enabled ? "Enabled" : "Disabled"} color={enabled ? "success" : "default"} />
          <Button variant="outlined" onClick={onToggle} disabled={disabled}>{actionLabel}</Button>
        </Stack>
      </Stack>
    </CardContent>
  </Card>
);

export default function AICommerceCopilotMonetizationPage() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const load = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const { data } = await platformAdminApi.get("/ai-commerce-copilot/monetization");
      setState(data);
    } catch (error) {
      setMessage({ type: "error", text: error?.response?.data?.message || "Unable to load AI Commerce Copilot runtime status." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const runCheck = async () => {
    setLoading(true);
    try {
      const { data } = await platformAdminApi.post("/ai-commerce-copilot/monetization/check");
      setState(data);
      setMessage({ type: "success", text: "Configuration check updated." });
    } catch (error) {
      setMessage({ type: "error", text: error?.response?.data?.message || "Unable to verify Stripe configuration." });
    } finally {
      setLoading(false);
    }
  };

  const refreshRuntime = async () => {
    setLoading(true);
    try {
      const { data } = await platformAdminApi.post("/ai-commerce-copilot/runtime/check");
      setState(data);
      setMessage({ type: "success", text: "Runtime status refreshed." });
    } catch (error) {
      setMessage({ type: "error", text: error?.response?.data?.message || "Unable to refresh runtime status." });
    } finally {
      setLoading(false);
    }
  };

  const testOpenAI = async () => {
    setLoading(true);
    try {
      await platformAdminApi.post("/ai-commerce-copilot/runtime/test-openai");
      setMessage({ type: "success", text: "OpenAI connection test succeeded." });
      await refreshRuntime();
    } catch (error) {
      setMessage({ type: "error", text: error?.response?.data?.message || "AI is temporarily unavailable. Try again." });
    } finally {
      setLoading(false);
    }
  };

  const toggleRuntime = async (payload) => {
    const confirmed = window.confirm("Update Commerce Copilot runtime controls?");
    if (!confirmed) return;
    setLoading(true);
    try {
      const { data } = await platformAdminApi.post("/ai-commerce-copilot/runtime/set", {
        ...payload,
        confirmation: true,
      });
      setState(data);
      setMessage({ type: "success", text: "Commerce Copilot runtime controls updated." });
    } catch (error) {
      setMessage({ type: "error", text: error?.response?.data?.message || "Unable to update Commerce Copilot runtime controls." });
    } finally {
      setLoading(false);
    }
  };

  const toggleMonetization = async (nextEnabled) => {
    const counts = state?.counts || {};
    const extraAck = !nextEnabled && Number(counts.active_addon_tenants || 0) > 0;
    const confirmed = window.confirm(
      nextEnabled
        ? "Enable paid Commerce Copilot add-on enforcement? This will not subscribe or charge tenants automatically."
        : "Disable paid Commerce Copilot add-on enforcement? This will not cancel existing Stripe subscriptions automatically."
    );
    if (!confirmed) return;
    setLoading(true);
    try {
      const { data } = await platformAdminApi.post("/ai-commerce-copilot/monetization/set", {
        paid_addon_enforcement_enabled: nextEnabled,
        confirmation: true,
        acknowledge_active_subscribers: extraAck,
      });
      setState(data);
      setMessage({ type: "success", text: nextEnabled ? "Paid add-on enforcement enabled." : "Free launch mode restored." });
    } catch (error) {
      setMessage({ type: "error", text: error?.response?.data?.message || "Unable to change AI Commerce Copilot monetization mode." });
    } finally {
      setLoading(false);
    }
  };

  const configuration = state?.configuration || {};
  const counts = state?.counts || {};
  const runtime = state?.runtime || {};
  const freeLaunch = state?.monetization_mode !== "paid_addon_required";

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>AI Commerce Copilot Monetization</Typography>
          <Typography variant="body2" color="text.secondary">
            Control tenant availability, approved safe writes, and whether Commerce Copilot requires a paid recurring add-on.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button variant="outlined" onClick={refreshRuntime} disabled={loading}>Refresh status</Button>
          <Button variant="outlined" onClick={runCheck} disabled={loading}>Check Copilot readiness</Button>
          <Button variant="outlined" onClick={testOpenAI} disabled={loading}>Test OpenAI connection</Button>
        </Stack>
      </Stack>

      {message.text ? <Alert severity={message.type || "info"}>{message.text}</Alert> : null}

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>Commerce Copilot runtime</Typography>
          <Stack spacing={1}>
            <ChecklistRow label="Deployment master switch" ok={Boolean(runtime.deployment_master_enabled)} value={runtime.deployment_master_enabled ? "Enabled" : "Disabled"} />
            <ChecklistRow label="Deployment write switch" ok={Boolean(runtime.deployment_write_enabled)} value={runtime.deployment_write_enabled ? "Enabled" : "Disabled"} />
            <ChecklistRow label="Platform tenant access" ok={Boolean(runtime.platform_tenant_access_enabled)} value={runtime.platform_tenant_access_enabled ? "Enabled" : "Disabled"} />
            <ChecklistRow label="Platform safe writes" ok={Boolean(runtime.platform_write_actions_enabled)} value={runtime.platform_write_actions_enabled ? "Enabled" : "Disabled"} />
            <ChecklistRow label="OpenAI configured" ok={Boolean(runtime.openai_configured)} value={runtime.openai_configured ? "Yes" : "No"} />
            <ChecklistRow label="Model" ok={Boolean(runtime.model_name)} value={String(runtime.model_name || "Not set")} />
            <ChecklistRow label="Monetization" ok value={freeLaunch ? "Free launch" : "Paid required"} />
            <ChecklistRow label="Current readiness" ok={String(runtime.readiness || "") === "ready"} value={String(runtime.readiness || "unknown")} />
          </Stack>
          {(runtime.blockers || []).length ? (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Blockers: {(runtime.blockers || []).join(", ")}
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      <ToggleRow
        label="Available to tenants"
        help="Available to tenants controls whether managers can chat, create drafts, and review plans."
        enabled={Boolean(state?.commerce_copilot_tenant_access_enabled)}
        onToggle={() => toggleRuntime({ commerce_copilot_tenant_access_enabled: !state?.commerce_copilot_tenant_access_enabled })}
        disabled={loading}
        actionLabel={state?.commerce_copilot_tenant_access_enabled ? "Disable tenant availability" : "Enable tenant availability"}
      />

      <ToggleRow
        label="Allow approved safe changes"
        help="Allow approved safe changes controls whether approved plans may change Products and safe settings."
        enabled={Boolean(state?.commerce_copilot_write_actions_enabled)}
        onToggle={() => toggleRuntime({ commerce_copilot_write_actions_enabled: !state?.commerce_copilot_write_actions_enabled })}
        disabled={loading}
        actionLabel={state?.commerce_copilot_write_actions_enabled ? "Disable approved writes" : "Enable approved writes"}
      />

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={1}>
            <Chip label={freeLaunch ? "OFF — Free launch" : "ON — Paid add-on required"} color={freeLaunch ? "default" : "warning"} sx={{ alignSelf: "flex-start" }} />
            <Typography variant="body2">
              {freeLaunch
                ? "Commerce Copilot is available to active tenants without an add-on. Usage is recorded but not billed. No tenant is automatically charged."
                : "Pro and Business tenants require an active Copilot add-on. Starter tenants must upgrade first. Tenants are not subscribed automatically."}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button variant={freeLaunch ? "contained" : "outlined"} color={freeLaunch ? "warning" : "success"} onClick={() => toggleMonetization(freeLaunch)} disabled={loading || (freeLaunch && !configuration.ready)}>
              {freeLaunch ? "Require paid add-on" : "Return to free launch"}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>Configuration checklist</Typography>
          <Stack spacing={1}>
            <ChecklistRow label="Stripe Price configured" ok={Boolean(configuration.price_configured)} />
            <ChecklistRow label="Price recurring" ok={Boolean(configuration.price_recurring)} />
            <ChecklistRow label="Stripe secret configured" ok={Boolean(configuration.stripe_secret_configured)} />
            <ChecklistRow label="Webhook verification configured" ok={Boolean(configuration.webhook_secret_configured)} />
            <ChecklistRow label="Monthly allowance configured" ok={Boolean(configuration.allowance_configured)} value={String(configuration.monthly_action_allowance || 0)} />
            <ChecklistRow label="Current Stripe mode" ok={Boolean(configuration.stripe_mode && configuration.stripe_mode !== "unknown")} value={String(configuration.stripe_mode || "unknown")} />
          </Stack>
          {(configuration.warnings || []).length ? (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {(configuration.warnings || []).join(" ")}
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>Tenant impact</Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Chip label={`Active add-ons: ${Number(counts.active_addon_tenants || 0)}`} />
            <Chip label={`In grace: ${Number(counts.grace_tenants || 0)}`} />
            <Chip label={`Would be locked: ${Number(counts.locked_tenants || 0)}`} />
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2">Last enabled: {state?.last_toggle?.enabled_at || "Never"}</Typography>
          <Typography variant="body2">Last disabled: {state?.last_toggle?.disabled_at || "Never"}</Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}
