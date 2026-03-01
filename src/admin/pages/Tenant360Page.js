import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import { API_BASE_URL } from "../../utils/api";
import platformAdminApi from "../../api/platformAdminApi";
import { APP_ORIGIN } from "../../config/origins";

export default function Tenant360Page() {
  const { companyId } = useParams();
  const [tenant, setTenant] = useState(null);
  const [users, setUsers] = useState([]);
  const [billing, setBilling] = useState(null);
  const [events, setEvents] = useState([]);
  const [riskEvents, setRiskEvents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [domainDiag, setDomainDiag] = useState(null);
  const [domainDiagLoading, setDomainDiagLoading] = useState(false);
  const [domainDiagError, setDomainDiagError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [tenantActionBusy, setTenantActionBusy] = useState(false);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [disableDialogBusy, setDisableDialogBusy] = useState(false);
  const [disableReason, setDisableReason] = useState("");
  const [disableDialogError, setDisableDialogError] = useState("");
  const [disableTarget, setDisableTarget] = useState(null);

  const load = useCallback(async () => {
    const [tenantRes, usersRes, billingRes, eventsRes, notesRes] = await Promise.all([
      platformAdminApi.get(`/tenants/${companyId}`),
      platformAdminApi.get(`/tenants/${companyId}/users`),
      platformAdminApi.get(`/tenants/${companyId}/billing/subscription`),
      platformAdminApi.get(`/tenants/${companyId}/billing/events`),
      platformAdminApi.get(`/tenants/${companyId}/notes`),
    ]);
    setTenant(tenantRes.data || null);
    setUsers(usersRes.data?.users || []);
    setBilling(billingRes.data || null);
    setEvents(eventsRes.data?.events || []);
    setRiskEvents(eventsRes.data?.risk_events || []);
    setNotes(notesRes.data?.notes || []);
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  const openDisableDialog = (target) => {
    setDisableTarget(target);
    setDisableReason("");
    setDisableDialogError("");
    setDisableDialogOpen(true);
  };

  const closeDisableDialog = () => {
    if (disableDialogBusy) return;
    setDisableDialogOpen(false);
    setDisableTarget(null);
    setDisableReason("");
    setDisableDialogError("");
  };

  const disableUser = (id, fullName) => {
    openDisableDialog({
      type: "user",
      id,
      label: fullName || `User #${id}`,
    });
  };

  const enableUser = async (id) => {
    await platformAdminApi.post(`/tenants/${companyId}/users/${id}/enable`);
    await load();
  };

  const disableTenant = () => {
    openDisableDialog({
      type: "tenant",
      label: tenant?.name || `Tenant #${companyId}`,
    });
  };

  const confirmDisable = async () => {
    const reason = disableReason.trim();
    if (!reason) {
      setDisableDialogError("Disable reason is required.");
      return;
    }
    setDisableDialogBusy(true);
    try {
      if (disableTarget?.type === "user" && disableTarget?.id) {
        await platformAdminApi.post(`/tenants/${companyId}/users/${disableTarget.id}/disable`, { reason });
      } else {
        await platformAdminApi.post(`/tenants/${companyId}/disable`, { reason });
      }
      await load();
      setDisableDialogOpen(false);
      setDisableTarget(null);
      setDisableReason("");
      setDisableDialogError("");
    } catch (err) {
      if (err?.response?.data?.error === "reason_required") {
        setDisableDialogError("Disable reason is required.");
        return;
      }
      throw err;
    } finally {
      setDisableDialogBusy(false);
    }
  };

  const enableTenant = async () => {
    setTenantActionBusy(true);
    try {
      await platformAdminApi.post(`/tenants/${companyId}/enable`);
      await load();
    } finally {
      setTenantActionBusy(false);
    }
  };

  const republish = async () => {
    await platformAdminApi.post(`/tenants/${companyId}/website/republish`);
  };

  const clearCache = async () => {
    await platformAdminApi.post(`/tenants/${companyId}/website/clear-cache`);
  };

  const addNote = async () => {
    if (!noteDraft.trim()) return;
    await platformAdminApi.post(`/tenants/${companyId}/notes`, { note: noteDraft });
    setNoteDraft("");
    load();
  };

  const adminToken = useMemo(() => {
    if (typeof localStorage === "undefined") return "";
    return localStorage.getItem("platformAdminToken") || "";
  }, []);

  const diagnoseDomain = useCallback(async () => {
    if (!companyId || !adminToken) return;
    setDomainDiagLoading(true);
    setDomainDiagError("");
    try {
      const res = await axios.post(
        `${API_BASE_URL.replace(/\/$/, "")}/api/domains/diagnose`,
        { company_id: Number(companyId) },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      setDomainDiag(res.data || null);
    } catch (err) {
      setDomainDiagError("Failed to run diagnostics.");
    } finally {
      setDomainDiagLoading(false);
    }
  }, [adminToken, companyId]);

  const retrySsl = useCallback(async () => {
    if (!companyId || !adminToken) return;
    setDomainDiagLoading(true);
    setDomainDiagError("");
    try {
      const res = await axios.post(
        `${API_BASE_URL.replace(/\/$/, "")}/api/domains/ssl/retry`,
        { company_id: Number(companyId) },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      setDomainDiag(res.data || null);
    } catch (err) {
      setDomainDiagError("Failed to retry SSL.");
    } finally {
      setDomainDiagLoading(false);
    }
  }, [adminToken, companyId]);

  if (!tenant) return null;

  const ent = tenant.entitlements || {};
  const stats = tenant.stats || {};
  const website = tenant.website || {};
  const paymentsDiag = tenant.payments_diag || {};
  const riskTelemetry = tenant.risk_telemetry || {};
  const paymentsCurrency =
    paymentsDiag.display_currency ||
    tenant.display_currency ||
    tenant.currency ||
    "USD";
  const fmtCurrency = (value) => {
    const numeric = Number(value ?? 0);
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: paymentsCurrency,
        maximumFractionDigits: 2,
      }).format(numeric);
    } catch (err) {
      return `${numeric.toFixed(2)} ${paymentsCurrency}`;
    }
  };
  const domain =
    website.custom_domain &&
    (website.domain_status === "verified" || website.domain_verified_at)
      ? `https://${website.custom_domain.replace(/^https?:\/\//, "")}`
      : null;
  const publicSite = domain || (tenant.slug ? `${APP_ORIGIN}/${tenant.slug}` : APP_ORIGIN);

  const badgeSx = {
    fontWeight: 600,
    textTransform: "none",
  };

  const planLabel = ent.plan_key ? ent.plan_key.toUpperCase() : "STARTER";
  const planStatus = ent.status || "inactive";
  const domainStatus = website.domain_status || "none";
  const sslStatus = website.ssl_status || "unknown";
  const publishStatus = website.is_live ? "live" : "draft";
  const accountStatus = String(tenant.account_status || "active").toLowerCase();
  const riskStatus = String(tenant.risk_status || "normal").toLowerCase();
  const dnsTxtOk = domainDiag?.dns?.txt?.ok;
  const dnsCnameOk = domainDiag?.dns?.cname?.ok;
  const diagCheckedAt = domainDiag?.checked_at || domainDiag?.last_checked;
  const canRetrySsl =
    domainDiag?.cdn_provider === "cloudflare" &&
    (domainDiag?.domain_status === "verified" || domainDiag?.verified_at) &&
    domainDiag?.ssl_status === "error";

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Tenant 360</Typography>
      <Tabs
        value={activeTab}
        onChange={(_, next) => setActiveTab(next)}
        sx={{ mb: 2 }}
      >
        <Tab label="Overview" value="overview" />
        <Tab label="Stripe & Payments" value="payments" />
      </Tabs>
      {activeTab === "overview" ? (
        <>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack spacing={0.5}>
          <Typography variant="subtitle1">{tenant.name}</Typography>
          <Typography variant="body2">
            {tenant.slug} • {tenant.email || "—"} {tenant.phone ? `• ${tenant.phone}` : ""}
          </Typography>
          <Typography variant="body2">
            Company ID: {tenant.id} • Timezone: {tenant.timezone || "—"}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: "wrap" }}>
          <Chip
            label={`Plan: ${planLabel}`}
            color={planStatus === "active" ? "success" : "default"}
            variant={planStatus === "active" ? "filled" : "outlined"}
            sx={badgeSx}
          />
          <Chip
            label={`Status: ${planStatus}`}
            color={planStatus === "active" ? "success" : "warning"}
            variant={planStatus === "active" ? "filled" : "outlined"}
            sx={badgeSx}
          />
          <Chip
            label={`Account: ${accountStatus}`}
            color={accountStatus === "active" ? "success" : "error"}
            variant={accountStatus === "active" ? "filled" : "outlined"}
            sx={badgeSx}
          />
          <Chip
            label={`Risk: ${riskStatus}`}
            color={riskStatus === "normal" ? "success" : "warning"}
            variant={riskStatus === "normal" ? "filled" : "outlined"}
            sx={badgeSx}
          />
          <Chip
            label={`Domain: ${domainStatus}`}
            color={domainStatus === "verified" ? "success" : "default"}
            variant={domainStatus === "verified" ? "filled" : "outlined"}
            sx={badgeSx}
          />
          <Chip
            label={`SSL: ${sslStatus}`}
            color={sslStatus === "active" ? "success" : "default"}
            variant={sslStatus === "active" ? "filled" : "outlined"}
            sx={badgeSx}
          />
          <Chip
            label={`Publish: ${publishStatus}`}
            color={publishStatus === "live" ? "success" : "default"}
            variant={publishStatus === "live" ? "filled" : "outlined"}
            sx={badgeSx}
          />
        </Stack>
        <Stack direction="row" spacing={2} sx={{ mt: 2, flexWrap: "wrap" }}>
          <Button variant="outlined" onClick={() => window.open(publicSite, "_blank")}>
            Open website
          </Button>
          <Button variant="outlined" onClick={() => window.open(`/manager/dashboard?company_id=${tenant.id}`, "_blank")}>
            Open manager dashboard
          </Button>
          <Button variant="outlined" onClick={republish}>Republish website</Button>
          <Button variant="outlined" onClick={clearCache}>Clear cache</Button>
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 2 }}>
          {accountStatus === "disabled" ? (
            <Button variant="contained" onClick={enableTenant} disabled={tenantActionBusy}>
              Enable tenant
            </Button>
          ) : (
            <Button
              color="error"
              variant="contained"
              onClick={disableTenant}
              disabled={tenantActionBusy}
            >
              Disable tenant
            </Button>
          )}
        </Stack>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Typography variant="subtitle1">Health snapshot</Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Plan" secondary={`${ent.plan_key || "starter"} • ${ent.status || "inactive"}`} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Account status" secondary={tenant.account_status || "active"} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Disabled at" secondary={tenant.disabled_at || "—"} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Disabled reason" secondary={tenant.disabled_reason || "—"} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Risk status" secondary={tenant.risk_status || "normal"} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Risk hold reason" secondary={tenant.risk_hold_reason || "—"} />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Risk score"
                  secondary={tenant.risk_profile?.risk_score ?? 0}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Risk level"
                  secondary={tenant.risk_profile?.risk_level || "low"}
                />
              </ListItem>
              <ListItem>
                <ListItemText primary="Seats allowed" secondary={ent.seats_allowed ?? "—"} />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Active staff"
                  secondary={`${stats.staff_active ?? 0} / ${stats.staff_total ?? 0} (Managers: ${stats.manager_count ?? 0})`}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Bookings (30d)"
                  secondary={`${stats.bookings_last_30 ?? 0} (7d: ${stats.bookings_last_7 ?? 0})`}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Cancellations (30d)"
                  secondary={stats.cancellations_last_30 ?? 0}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Product orders (30d)"
                  secondary={stats.product_orders_last_30 ?? 0}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Revenue (30d)"
                  secondary={stats.revenue_last_30 ?? 0}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Revenue (90d)"
                  secondary={stats.revenue_last_90 ?? 0}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Refunds (30d)"
                  secondary={stats.refunds_last_30 ?? 0}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Refunds (90d)"
                  secondary={stats.refunds_last_90 ?? 0}
                />
              </ListItem>
              <ListItem>
                <ListItemText primary="Last booking" secondary={stats.last_booking_at || "—"} />
              </ListItem>
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Typography variant="subtitle1">Website + domain</Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Public URL" secondary={publicSite} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Custom domain" secondary={website.custom_domain || "—"} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Domain status" secondary={website.domain_status || "—"} />
              </ListItem>
              <ListItem>
                <ListItemText primary="SSL status" secondary={website.ssl_status || "—"} />
              </ListItem>
              <ListItem>
                <ListItemText primary="SSL error" secondary={website.ssl_error || "—"} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Published at" secondary={website.branding_published_at || "—"} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Last publish" secondary={website.last_published_at || "—"} />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: "center", mb: 1 }}>
          <Typography variant="subtitle1" sx={{ flex: 1 }}>
            Domain diagnostics
          </Typography>
          <Button
            size="small"
            variant="outlined"
            onClick={diagnoseDomain}
            disabled={domainDiagLoading}
          >
            Test now
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={retrySsl}
            disabled={domainDiagLoading || !canRetrySsl}
          >
            Retry SSL
          </Button>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mb: 1 }}>
          <Chip
            label={`TXT: ${dnsTxtOk === undefined ? "—" : dnsTxtOk ? "ok" : "fail"}`}
            color={dnsTxtOk ? "success" : dnsTxtOk === false ? "error" : "default"}
            variant={dnsTxtOk ? "filled" : "outlined"}
            sx={badgeSx}
          />
          <Chip
            label={`CNAME: ${dnsCnameOk === undefined ? "—" : dnsCnameOk ? "ok" : "fail"}`}
            color={dnsCnameOk ? "success" : dnsCnameOk === false ? "error" : "default"}
            variant={dnsCnameOk ? "filled" : "outlined"}
            sx={badgeSx}
          />
          <Chip
            label={`SSL: ${domainDiag?.ssl_status || "—"}`}
            color={domainDiag?.ssl_status === "active" ? "success" : "default"}
            variant={domainDiag?.ssl_status === "active" ? "filled" : "outlined"}
            sx={badgeSx}
          />
          <Chip
            label={`Domain: ${domainDiag?.domain_status || website.domain_status || "—"}`}
            color={(domainDiag?.domain_status || website.domain_status) === "verified" ? "success" : "default"}
            variant={(domainDiag?.domain_status || website.domain_status) === "verified" ? "filled" : "outlined"}
            sx={badgeSx}
          />
          <Chip
            label={`Checked: ${diagCheckedAt || "—"}`}
            variant="outlined"
            sx={badgeSx}
          />
        </Stack>
        {domainDiagError ? (
          <Typography variant="body2" color="error">
            {domainDiagError}
          </Typography>
        ) : null}
        {domainDiag?.ssl_error ? (
          <Typography variant="body2" color="text.secondary">
            SSL error: {domainDiag.ssl_error}
          </Typography>
        ) : null}
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1">Users</Typography>
        <List>
          {users.map((u) => (
            <ListItem
              key={u.id}
              secondaryAction={
                String(u?.status || "").toLowerCase() === "active" && !u?.archived_at ? (
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => disableUser(u.id, u.full_name)}
                  >
                    Disable
                  </Button>
                ) : (
                  <Button size="small" variant="outlined" onClick={() => enableUser(u.id)}>
                    Enable
                  </Button>
                )
              }
            >
              <ListItemText
                primary={`${u.full_name} (${u.role})`}
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="text.secondary">
                      {`${u.email} • ${u.status}`}
                    </Typography>
                    <br />
                    <Typography component="span" variant="body2" color="text.secondary">
                      {u.last_login
                        ? `Last login: ${u.last_login.timestamp || "—"} • ${u.last_login.outcome || "—"} • IP ${u.last_login.ip_masked || "—"}`
                        : "Last login: —"}
                    </Typography>
                    {(u.last_login?.country || u.last_login?.region || u.last_login?.city || u.last_risk_geo) ? (
                      <>
                        <br />
                        <Typography component="span" variant="body2" color="text.secondary">
                          {`Geo: ${u.last_login?.country || u.last_risk_geo?.country || "—"}, ${u.last_login?.region || u.last_risk_geo?.region || "—"}, ${u.last_login?.city || u.last_risk_geo?.city || "—"}${
                            u.last_login?.timestamp
                              ? ` • Seen: ${u.last_login.timestamp}`
                              : (u.last_risk_geo?.at ? ` • Seen: ${u.last_risk_geo.at}` : "")
                          }`}
                        </Typography>
                      </>
                    ) : null}
                    {u.last_login?.user_agent ? (
                      <>
                        <br />
                        <Typography component="span" variant="body2" color="text.secondary">
                          {`User-Agent: ${u.last_login.user_agent}`}
                        </Typography>
                      </>
                    ) : null}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1">Billing</Typography>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} md={6}>
            <List dense>
              <ListItem>
                <ListItemText primary="Plan" secondary={ent.plan_key || "starter"} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Status" secondary={ent.status || "inactive"} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Subscription" secondary={ent.subscription_state || "none"} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Trial ends" secondary={ent.trial_end || "—"} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Next billing date" secondary={ent.next_billing_date || "—"} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Latest invoice" secondary={ent.latest_invoice_url || "—"} />
              </ListItem>
            </List>
          </Grid>
          <Grid item xs={12} md={6}>
            <List dense>
              <ListItem>
                <ListItemText primary="Seats included" secondary={ent.seats_included ?? 0} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Addon seats" secondary={ent.seats_addon_qty ?? 0} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Total allowed" secondary={ent.seats_allowed ?? 0} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Active staff" secondary={ent.active_staff_count ?? stats.staff_active ?? 0} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Over seats" secondary={ent.seats_overage ? "Yes" : "No"} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Sync error" secondary={ent.sync_error || "—"} />
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1">Billing events</Typography>
        <List>
          {events.map((e) => (
            <ListItem key={e.id}>
              <ListItemText primary={e.type} secondary={e.processed_at} />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1">Notes</Typography>
        <Stack direction="row" spacing={2} sx={{ my: 2 }}>
          <TextField fullWidth value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} label="Add note" />
          <Button variant="contained" onClick={addNote}>Add</Button>
        </Stack>
        <Divider />
        <List>
          {notes.map((n) => (
            <ListItem key={n.id}>
              <ListItemText primary={n.note} secondary={n.created_at} />
            </ListItem>
          ))}
        </List>
      </Paper>
        </>
      ) : null}

      {activeTab === "payments" ? (
        <>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1">Stripe connect</Typography>
            {paymentsDiag.address_complete === false ? (
              <Alert severity="warning" sx={{ mt: 1 }}>
                Company address is incomplete. Missing: {paymentsDiag.address_missing?.join(", ") || "—"}
              </Alert>
            ) : null}
            <List dense>
              <ListItem>
                <ListItemText
                  primary="Account ID"
                  secondary={paymentsDiag.stripe_connect_account_id || "—"}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Charges enabled"
                  secondary={paymentsDiag.stripe_connect_charges_enabled ? "Yes" : "No"}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Payouts enabled"
                  secondary={paymentsDiag.stripe_connect_payouts_enabled ? "Yes" : "No"}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Details submitted"
                  secondary={paymentsDiag.stripe_connect_details_submitted ? "Yes" : "No"}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Requirements"
                  secondary={
                    paymentsDiag.stripe_connect_requirements
                      ? JSON.stringify(paymentsDiag.stripe_connect_requirements)
                      : "—"
                  }
                />
              </ListItem>
            </List>
          </Paper>

          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1">Checkout configuration</Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="Stripe payments"
                  secondary={paymentsDiag.enable_stripe_payments ? "Enabled" : "Disabled"}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Card on file"
                  secondary={paymentsDiag.allow_card_on_file ? "Enabled" : "Disabled"}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Currency mode"
                  secondary={paymentsDiag.charge_currency_mode || "—"}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Display currency"
                  secondary={paymentsDiag.display_currency || "—"}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Prices include tax"
                  secondary={paymentsDiag.prices_include_tax ? "Yes" : "No"}
                />
              </ListItem>
            </List>
          </Paper>

          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1">Payments health</Typography>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} md={6}>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Payments (30d)"
                      secondary={fmtCurrency(paymentsDiag.payments_30d_total)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Payments (90d)"
                      secondary={fmtCurrency(paymentsDiag.payments_90d_total)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Refunds (30d)"
                      secondary={fmtCurrency(paymentsDiag.refunds_30d_total)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Refunds (90d)"
                      secondary={fmtCurrency(paymentsDiag.refunds_90d_total)}
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Failed payments (30d)"
                      secondary={paymentsDiag.failed_30d_count ?? 0}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Last failure"
                      secondary={paymentsDiag.last_failure_at || "—"}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Failure provider"
                      secondary={paymentsDiag.last_failure_provider || "—"}
                    />
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1">Fraud & risk events</Typography>
            <List>
              {riskEvents.length === 0 ? (
                <ListItem>
                  <ListItemText primary="No risk events yet." />
                </ListItem>
              ) : (
                riskEvents.map((evt) => (
                  <ListItem key={evt.id}>
                    <ListItemText
                      primary={`${evt.event_type} • score ${evt.risk_score} • ${evt.risk_level}`}
                      secondary={`${evt.created_at || "—"}${evt.reason ? ` • ${evt.reason}` : ""}`}
                    />
                  </ListItem>
                ))
              )}
            </List>
          </Paper>

          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1">Risk telemetry</Typography>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} md={6}>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Latest billing attempt"
                      secondary={riskTelemetry.latest_billing_attempt?.created_at || "—"}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Latest attempt IP"
                      secondary={riskTelemetry.latest_billing_attempt?.ip_masked || "—"}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Country mismatch"
                      secondary={
                        riskTelemetry.latest_billing_attempt
                          ? `${riskTelemetry.latest_billing_attempt?.ip_country || "—"} / ${riskTelemetry.latest_billing_attempt?.billing_country || "—"}`
                          : "—"
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Signup country"
                      secondary={riskTelemetry.latest_billing_attempt?.signup_country || "—"}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Latest user agent"
                      secondary={riskTelemetry.latest_billing_attempt?.user_agent || "—"}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Time to first paid invoice"
                      secondary={
                        riskTelemetry.hours_from_signup_to_first_paid != null
                          ? `${riskTelemetry.hours_from_signup_to_first_paid}h`
                          : "—"
                      }
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Attempts (30m): tenant total"
                      secondary={riskTelemetry.attempt_counts_30m?.tenant_total ?? 0}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Attempts (30m): tenant blocked"
                      secondary={riskTelemetry.attempt_counts_30m?.tenant_blocked ?? 0}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Attempts (30m): tenant failed"
                      secondary={riskTelemetry.attempt_counts_30m?.tenant_failed ?? 0}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Attempts (30m): global by latest IP"
                      secondary={riskTelemetry.attempt_counts_30m?.global_by_latest_ip ?? 0}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Attempts (30m): global by latest email"
                      secondary={riskTelemetry.attempt_counts_30m?.global_by_latest_email ?? 0}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Latest client telemetry"
                      secondary={
                        riskTelemetry.latest_client_telemetry
                          ? `${riskTelemetry.latest_client_telemetry.country || "—"}, ${riskTelemetry.latest_client_telemetry.region || "—"}, ${riskTelemetry.latest_client_telemetry.city || "—"}`
                          : "—"
                      }
                    />
                  </ListItem>
                </List>
              </Grid>
            </Grid>

            <Divider sx={{ my: 1.5 }} />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Recent billing attempts
            </Typography>
            <List dense>
              {(riskTelemetry.recent_billing_attempts || []).length === 0 ? (
                <ListItem>
                  <ListItemText primary="No billing attempt telemetry yet." />
                </ListItem>
              ) : (
                (riskTelemetry.recent_billing_attempts || []).map((row, idx) => (
                  <ListItem key={`risk-attempt-${idx}`}>
                    <ListItemText
                      primary={`${row.created_at || "—"} • ${row.outcome || "—"} • ${row.ip_masked || "—"} • ${row.ip_country || "—"}`}
                      secondary={`${row.event_type || "—"}${row.reason ? ` • ${row.reason}` : ""}${row.billing_country ? ` • billing=${row.billing_country}` : ""}`}
                    />
                  </ListItem>
                ))
              )}
            </List>

            <Typography variant="subtitle2" sx={{ mb: 1, mt: 2 }}>
              Recent client telemetry
            </Typography>
            <List dense>
              {(riskTelemetry.recent_client_telemetry || []).length === 0 ? (
                <ListItem>
                  <ListItemText primary="No client telemetry rows yet." />
                </ListItem>
              ) : (
                (riskTelemetry.recent_client_telemetry || []).map((row, idx) => (
                  <ListItem key={`risk-client-telemetry-${idx}`}>
                    <ListItemText
                      primary={`${row.event_at || "—"} • ${row.ip_masked || "—"} • ${row.country || "—"}, ${row.region || "—"}, ${row.city || "—"}`}
                      secondary={`${row.device || "—"} / ${row.browser || "—"}${row.page ? ` • ${row.page}` : ""}${row.source ? ` • ${row.source}` : ""}`}
                    />
                  </ListItem>
                ))
              )}
            </List>

            <Typography variant="subtitle2" sx={{ mb: 1, mt: 2 }}>
              Recent login audit
            </Typography>
            <List dense>
              {(riskTelemetry.recent_login_audit || []).length === 0 ? (
                <ListItem>
                  <ListItemText primary="No login audit rows yet." />
                </ListItem>
              ) : (
                (riskTelemetry.recent_login_audit || []).map((row, idx) => (
                  <ListItem key={`risk-login-${idx}`}>
                    <ListItemText
                      primary={`${row.timestamp || "—"} • ${row.outcome || "—"} • ${row.ip_masked || "—"}`}
                      secondary={`${row.user_agent || "—"}${row.user_id ? ` • user_id=${row.user_id}` : ""}`}
                    />
                  </ListItem>
                ))
              )}
            </List>
          </Paper>
        </>
      ) : null}

      <Dialog open={disableDialogOpen} onClose={closeDisableDialog} fullWidth maxWidth="sm">
        <DialogTitle>
          {disableTarget?.type === "user" ? `Disable User: ${disableTarget?.label}` : "Disable Tenant"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Disable reason"
            placeholder="Required"
            fullWidth
            multiline
            minRows={2}
            value={disableReason}
            onChange={(e) => {
              setDisableReason(e.target.value);
              if (disableDialogError) setDisableDialogError("");
            }}
          />
          {disableDialogError ? (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {disableDialogError}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDisableDialog} disabled={disableDialogBusy}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={confirmDisable} disabled={disableDialogBusy}>
            Disable
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
