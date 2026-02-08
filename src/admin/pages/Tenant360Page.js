import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import { API_BASE_URL } from "../../utils/api";
import platformAdminApi from "../../api/platformAdminApi";

export default function Tenant360Page() {
  const { companyId } = useParams();
  const [tenant, setTenant] = useState(null);
  const [users, setUsers] = useState([]);
  const [billing, setBilling] = useState(null);
  const [events, setEvents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [domainDiag, setDomainDiag] = useState(null);
  const [domainDiagLoading, setDomainDiagLoading] = useState(false);
  const [domainDiagError, setDomainDiagError] = useState("");

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
    setNotes(notesRes.data?.notes || []);
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  const disableUser = async (id) => {
    await platformAdminApi.post(`/tenants/${companyId}/users/${id}/disable`);
    load();
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
  const domain =
    website.custom_domain &&
    (website.domain_status === "verified" || website.domain_verified_at)
      ? `https://${website.custom_domain.replace(/^https?:\/\//, "")}`
      : null;
  const publicSite = domain || `https://www.schedulaa.com/${tenant.slug}`;

  const badgeSx = {
    fontWeight: 600,
    textTransform: "none",
  };

  const planLabel = ent.plan_key ? ent.plan_key.toUpperCase() : "STARTER";
  const planStatus = ent.status || "inactive";
  const domainStatus = website.domain_status || "none";
  const sslStatus = website.ssl_status || "unknown";
  const publishStatus = website.is_live ? "live" : "draft";
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
            <ListItem key={u.id} secondaryAction={
              <Button size="small" variant="outlined" onClick={() => disableUser(u.id)}>Disable</Button>
            }>
              <ListItemText primary={`${u.full_name} (${u.role})`} secondary={`${u.email} • ${u.status}`} />
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
    </Box>
  );
}
