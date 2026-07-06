import React, { useMemo, useState, useEffect } from "react";
import api from "../../../utils/api";
import {
  Alert, Box, Button, Card, CardContent, CardHeader, Checkbox, Divider,
  FormControlLabel, Grid, LinearProgress, MenuItem, Switch,
  Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
  Tooltip, IconButton, Drawer, Accordion, AccordionSummary, AccordionDetails
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { HelpOutline } from "@mui/icons-material";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import MarketingCampaignsGuide from "./MarketingCampaignsGuide";
import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import ExportClientsCard from "./ExportClientsCard";
import UpgradeNoticeBanner from "../../../components/billing/UpgradeNoticeBanner";
import useBillingStatus from "../../../components/billing/useBillingStatus";
import ThemedDateField from "../../../components/ui/ThemedDateField";
function useAuth() {
  const token = useMemo(() => localStorage.getItem("token") || "", []);
  const auth  = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);
  return { token, auth };
}

function CampaignCard({
  title,
  subtitle,
  helpText,
  previewPath,
  sendPath,
  fieldDefs,           // [{name,label,type,default,select?:[{value,label}], helperText?, multiline?, rows? }]
  columns,             // [{key,label,align?}]
  mapRowKey,           // fn(row) -> unique key
  enableCopyOverrides = true,   // NEW
  providerReady = false,
  providerStatus = "missing",
  onCampaignSent,
}) {
  const { t } = useTranslation();
  const { auth } = useAuth();

  // build params state from fieldDefs
  const initialParams = {};
  (fieldDefs || []).forEach(f => { initialParams[f.name] = f.default; });
  // Add copy overrides (blank means "use system default")
  if (enableCopyOverrides) {
    if (initialParams.subject === undefined) initialParams.subject = "";
    if (initialParams.heading === undefined) initialParams.heading = "";
    if (initialParams.intro === undefined) initialParams.intro = "";
    if (initialParams.subtext === undefined) initialParams.subtext = "";
  }

  const [params, setParams] = useState(initialParams);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState({});
  const [dryRun, setDryRun] = useState(true);
  const [sending, setSending] = useState(false);
  const [info, setInfo] = useState("");
  const [sendSummary, setSendSummary] = useState(null);

  // Service lookup (for fields with type: "service")
  const [serviceOptions, setServiceOptions] = useState([]);
  const [svcLoading, setSvcLoading] = useState(false);
  const [serviceSelections, setServiceSelections] = useState({}); // keyed by field name

  const fetchServices = async (q = "") => {
    setSvcLoading(true);
    try {
      const url = `/booking/services${q ? `?q=${encodeURIComponent(q)}` : ""}`;
      const { data } = await api.get(url, auth);
      setServiceOptions(Array.isArray(data) ? data : []);
    } catch (e) {
      // ignore quietly in UI; managers can still type an ID if needed
    } finally {
      setSvcLoading(false);
    }
  };

  // Preload a list once if any field needs services
  useEffect(() => {
    if ((fieldDefs || []).some(fd => fd.type === "service")) {
      fetchServices("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChangeParam = (name, value) => {
    setParams(p => ({ ...p, [name]: value }));
    setRows([]); // clear preview so manager must re-run Preview
  };

  const preview = async () => {
    setErr(""); setInfo(""); setLoading(true); setSelected({});
    try {
      const qs = new URLSearchParams(params).toString();
      const { data } = await api.get(`${previewPath}?${qs}`, auth);
      setRows(Array.isArray(data?.results) ? data.results : []);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || t("campaigns.failedToLoadPreview"));
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (key) => {
    setSelected(s => ({ ...s, [key]: !s[key] }));
  };

  const selectAll = (checked) => {
    if (!checked) { setSelected({}); return; }
    const next = {};
    rows.forEach(r => { next[mapRowKey(r)] = true; });
    setSelected(next);
  };

  const send = async (mode /* "selected" | "all" */) => {
    setErr(""); setInfo(""); setSendSummary(null); setSending(true);
    try {
      let payload = { dry_run: !!dryRun };
      if (mode === "selected") {
        const targets = rows
          .filter(r => selected[mapRowKey(r)])
          .map(r => ({
            client_id: r.client_id ?? null,
            email: r.email,
            subject: r.subject,
            html: r.html,
            text: r.text || "",
          }));
        if (targets.length === 0) {
          setInfo(t("campaigns.noSelection"));
          setSending(false);
          return;
        }
        payload.targets = targets;
      }
      if (mode === "all") {
        if (!rows.length) { setInfo(t("campaigns.noPreviewRows")); setSending(false); return; }
        payload.targets = rows.map(r => ({
          client_id: r.client_id ?? null,
          email: r.email,
          subject: r.subject,
          html: r.html,
          text: r.text || "",
        }));
      }
      const { data } = await api.post(`${sendPath}`, payload, auth);
      if (data?.dry_run) {
        const sentCount = data?.sent ?? 0;
        const dryMode = data?.dry_run ? t("campaigns.dryRunStatusOnShort") : t("campaigns.dryRunStatusOffShort");
        setInfo(t("campaigns.sendResult", { count: sentCount, mode: dryMode }));
      } else {
        setSendSummary({
          campaignId: data?.campaign_id,
          status: data?.status,
          queued: data?.counts?.queued ?? 0,
          sent: data?.counts?.sent ?? 0,
          skipped: data?.counts?.skipped ?? 0,
          failed: data?.counts?.failed ?? 0,
          suppressed: data?.counts?.suppressed ?? 0,
          provider: data?.provider?.name || "SendGrid",
        });
        setInfo(data?.message || "Campaign queued. Schedulaa will send gradually using your SendGrid limits.");
        if (onCampaignSent) onCampaignSent();
      }
    } catch (e) {
      setErr(e?.response?.data?.message || e?.response?.data?.error || e?.message || t("campaigns.failedToSend"));
    } finally {
      setSending(false);
    }
  };

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardHeader title={title} subheader={subtitle} />
      <CardContent>
        {helpText && <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{helpText}</Typography>}
        {!providerReady && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {providerStatus === "draft" && "SendGrid is connected and testable, but live campaigns stay disabled until you click Activate."}
            {providerStatus === "paused" && "Your SendGrid connection is paused. Reactivate it before sending live campaigns."}
            {providerStatus === "error" && "Your SendGrid connection needs attention before live campaigns can be sent."}
            {providerStatus === "missing" && "Connect SendGrid to enable live marketing sends. Recipient preview still works, but shared Schedulaa mail is no longer used for marketing campaigns."}
          </Alert>
        )}

        {/* Params */}
        <Grid container spacing={2} alignItems="center">
          {(fieldDefs || []).map(fd => (
            <Grid key={fd.name} item xs={12} md={fd.md || 3}>
              {fd.select ? (
                <TextField
                  select label={fd.label} fullWidth
                  value={params[fd.name] ?? ""}
                  onChange={e => onChangeParam(fd.name, e.target.value)}
                  helperText={fd.helperText || ""}
                >
                  {fd.select.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                </TextField>
              ) : fd.type === "service" ? (
                <Autocomplete
                  options={serviceOptions}
                  loading={svcLoading}
                  getOptionLabel={(opt) => (opt?.name || "")}
                  value={serviceSelections[fd.name] || null}
                  onChange={(_, val) => {
                    setServiceSelections(s => ({ ...s, [fd.name]: val || null }));
                    onChangeParam(fd.name, val ? val.id : "");
                  }}
                  onInputChange={(_, input) => {
                    if (input && input.length >= 2) fetchServices(input);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={fd.label}
                      helperText={fd.helperText || t("campaigns.fields.serviceSearchHelper")}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {svcLoading ? <CircularProgress size={18} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              ) : fd.type === "date" ? (
                <ThemedDateField
                  label={fd.label}
                  fullWidth
                  value={params[fd.name] ?? ""}
                  onChange={e => onChangeParam(fd.name, e.target.value)}
                  helperText={fd.helperText || ""}
                />
              ) : (
                <TextField
                  type={fd.type || "text"}
                  label={fd.label}
                  fullWidth
                  value={params[fd.name] ?? ""}
                  onChange={e => onChangeParam(fd.name, e.target.value)}
                  helperText={fd.helperText || ""}
                  multiline={!!fd.multiline}
                  minRows={fd.multiline ? (fd.rows || 3) : undefined}
                />
              )}
            </Grid>
          ))}
          <Grid item xs={12} md="auto">
            <Button variant="contained" onClick={preview}>{t("campaigns.preview")}</Button>
          </Grid>
          <Grid item xs={12} md="auto">
            <FormControlLabel
              control={<Switch checked={dryRun} onChange={(e)=>setDryRun(e.target.checked)} />}
              label={`Preview recipients only (${dryRun ? "ON" : "OFF"})`}
            />
          </Grid>
          <Grid item xs={12} md="auto">
            <Button
              variant="outlined"
              disabled={sending || rows.length === 0 || (!providerReady && !dryRun)}
              onClick={()=>send("selected")}
            >
              {dryRun ? "Preview selected" : "Send selected"}
            </Button>
          </Grid>
          <Grid item xs={12} md="auto">
            <Button
              variant={dryRun ? "outlined" : "contained"}
              disabled={sending || (!providerReady && !dryRun)}
              onClick={()=>send("all")}
            >
              {dryRun ? "Preview all rows" : "Send campaign"}
            </Button>
          </Grid>
        </Grid>

        {/* Copy overrides accordion */}
        {enableCopyOverrides && (
          <Accordion sx={{ mt: 2 }} variant="outlined">
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight={600}>{t("campaigns.customizeCopy")}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label={t("campaigns.subjectLabel")}
                    fullWidth
                    value={params.subject ?? ""}
                    onChange={e => onChangeParam("subject", e.target.value)}
                    helperText={t("campaigns.subjectHelper")}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label={t("campaigns.headingLabel")}
                    fullWidth
                    value={params.heading ?? ""}
                    onChange={e => onChangeParam("heading", e.target.value)}
                    helperText={t("campaigns.customize.headingHelper")}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label={t("campaigns.introLabel")}
                    fullWidth
                    multiline
                    minRows={3}
                    value={params.intro ?? ""}
                    onChange={e => onChangeParam("intro", e.target.value)}
                    helperText={t("campaigns.customize.introHelper")}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label={t("campaigns.subtextLabel")}
                    fullWidth
                    multiline
                    minRows={2}
                    value={params.subtext ?? ""}
                    onChange={e => onChangeParam("subtext", e.target.value)}
                    helperText={t("campaigns.customize.subtextHelper")}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}

        {(loading || sending) && <LinearProgress sx={{ my: 2 }} />}
        {err && <Alert severity="error" sx={{ my: 2 }}>{err}</Alert>}
        {info && <Alert severity="success" sx={{ my: 2 }}>{info}</Alert>}
        {sendSummary && (
          <Alert severity="info" sx={{ my: 2 }}>
            Campaign #{sendSummary.campaignId} via {sendSummary.provider}: queued {sendSummary.queued}, sent {sendSummary.sent}, skipped {sendSummary.skipped}, suppressed {sendSummary.suppressed}, failed {sendSummary.failed}. Status: {sendSummary.status}.
          </Alert>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Preview table */}
        {rows.length === 0 ? (
          <Typography variant="body2" color="text.secondary">{t("campaigns.noPreviewYet")}</Typography>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={rows.every(r => selected[mapRowKey(r)])}
                      indeterminate={rows.some(r => selected[mapRowKey(r)]) && !rows.every(r => selected[mapRowKey(r)])}
                      onChange={(e)=>selectAll(e.target.checked)}
                    />
                  </TableCell>
                  {columns.map(col => (
                    <TableCell key={col.key} align={col.align || "left"}>{col.label}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={mapRowKey(r)}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={!!selected[mapRowKey(r)]}
                        onChange={()=>toggleSelect(mapRowKey(r))}
                      />
                    </TableCell>
                    {columns.map(col => {
                      let v = r[col.key];
                      if (col.key === "value" && typeof v === "number") v = v.toFixed(2);
                      if (col.key === "suggested_coupon" && !v) v = t("campaigns.placeholders.noCoupon");
                      if (v === undefined || v === null || v === "") v = t("campaigns.placeholders.empty");
                      return <TableCell key={col.key} align={col.align || "left"}>{String(v)}</TableCell>;
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function CampaignRecipientsDrawer({ auth, campaign, open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recipients, setRecipients] = useState([]);

  useEffect(() => {
    if (!open || !campaign?.id) return;
    let alive = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get(`/api/manager/marketing/campaigns/${campaign.id}/recipients?limit=200`, auth);
        if (alive) setRecipients(Array.isArray(data?.recipients) ? data.recipients : []);
      } catch (e) {
        if (alive) setError(e?.response?.data?.message || e?.response?.data?.error || e?.message || "Failed to load recipients.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [auth, open, campaign?.id]);

  return (
    <Drawer anchor="right" open={open} onClose={onClose} sx={{ '& .MuiDrawer-paper': { width: { xs: "100%", md: 760 }, p: 2 } }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Campaign recipients
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {campaign ? `${campaign.name} · ${campaign.campaign_type}` : ""}
      </Typography>
      {loading ? <LinearProgress sx={{ mb: 2 }} /> : null}
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      <Box sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Attempts</TableCell>
              <TableCell>Provider message ID</TableCell>
              <TableCell>Sent</TableCell>
              <TableCell>Delivered</TableCell>
              <TableCell>Opened</TableCell>
              <TableCell>Clicked</TableCell>
              <TableCell>Bounced</TableCell>
              <TableCell>Error</TableCell>
              <TableCell>Last error</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recipients.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.email || "-"}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell>{row.attempt_count ?? 0}</TableCell>
                <TableCell>{row.provider_message_id || "-"}</TableCell>
                <TableCell>{row.sent_at || "-"}</TableCell>
                <TableCell>{row.delivered_at || "-"}</TableCell>
                <TableCell>{row.opened_at || "-"}</TableCell>
                <TableCell>{row.clicked_at || "-"}</TableCell>
                <TableCell>{row.bounced_at || "-"}</TableCell>
                <TableCell>{row.error_code || "-"}</TableCell>
                <TableCell>{row.last_error || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Drawer>
  );
}

function RecentMarketingCampaigns({ auth, refreshKey = 0 }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/manager/marketing/campaigns?limit=10", auth);
      setCampaigns(Array.isArray(data?.campaigns) ? data.campaigns : []);
    } catch {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth, refreshKey]);

  const runAction = async (campaignId, action) => {
    setActionBusy(true);
    setError("");
    setInfo("");
    try {
      if (action === "process-batch") {
        const { data } = await api.post(`/api/manager/marketing/campaigns/${campaignId}/process-batch`, {}, auth);
        setInfo(data?.summary?.message || "Campaign batch processed.");
      } else {
        await api.post(`/api/manager/marketing/campaigns/${campaignId}/${action}`, {}, auth);
        setInfo(`Campaign ${action.replace("-", " ")} successful.`);
      }
      await loadCampaigns();
    } catch (e) {
      setError(e?.response?.data?.message || e?.response?.data?.error || e?.message || "Campaign action failed.");
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardHeader
        title="Recent marketing campaigns"
        subheader="Campaigns are sent gradually to protect deliverability."
      />
      <CardContent>
        {loading ? <LinearProgress sx={{ mb: 2 }} /> : null}
        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
        {info ? <Alert severity="info" sx={{ mb: 2 }}>{info}</Alert> : null}
        {!loading && campaigns.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No campaign history yet.
          </Typography>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Progress</TableCell>
                  <TableCell align="right">Queued</TableCell>
                  <TableCell align="right">Sent</TableCell>
                  <TableCell align="right">Failed</TableCell>
                  <TableCell align="right">Suppressed</TableCell>
                  <TableCell>Compliance</TableCell>
                  <TableCell>Last processed</TableCell>
                  <TableCell>Provider</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {campaigns.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.campaign_type}</TableCell>
                    <TableCell>{row.status}</TableCell>
                    <TableCell align="right">{row?.progress?.progress_percent ?? 0}%</TableCell>
                    <TableCell align="right">{row?.progress?.queued ?? row?.counts?.queued ?? 0}</TableCell>
                    <TableCell align="right">{row?.progress?.sent ?? row?.counts?.sent_total ?? row?.counts?.sent ?? 0}</TableCell>
                    <TableCell align="right">{row?.counts?.failed ?? 0}</TableCell>
                    <TableCell align="right">{row?.progress?.suppressed ?? row?.counts?.suppressed ?? 0}</TableCell>
                    <TableCell>
                      {`Delivered ${row?.compliance_summary?.delivered ?? 0} | Bounced ${row?.compliance_summary?.bounced ?? 0} | Unsubscribed ${row?.compliance_summary?.unsubscribed ?? 0}`}
                    </TableCell>
                    <TableCell>{row?.progress?.last_processed_at || "-"}</TableCell>
                    <TableCell>{row.provider_name || "SendGrid"}</TableCell>
                    <TableCell align="right">
                      <Box display="flex" gap={1} justifyContent="flex-end" flexWrap="wrap">
                        <Button size="small" onClick={() => setSelectedCampaign(row)}>
                          View recipients
                        </Button>
                        <Button size="small" onClick={() => runAction(row.id, "process-batch")} disabled={actionBusy || ["paused", "cancelled", "completed"].includes(row.status)}>
                          Process next batch
                        </Button>
                        <Button size="small" onClick={() => runAction(row.id, "pause")} disabled={actionBusy || ["paused", "cancelled", "completed"].includes(row.status)}>
                          Pause
                        </Button>
                        <Button size="small" onClick={() => runAction(row.id, "resume")} disabled={actionBusy || row.status !== "paused"}>
                          Resume
                        </Button>
                        <Button size="small" color="error" onClick={() => runAction(row.id, "cancel")} disabled={actionBusy || ["cancelled", "completed"].includes(row.status)}>
                          Cancel
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </CardContent>
      <CampaignRecipientsDrawer auth={auth} campaign={selectedCampaign} open={Boolean(selectedCampaign)} onClose={() => setSelectedCampaign(null)} />
    </Card>
  );
}

function MarketingSuppressionsCard({ auth, refreshKey = 0 }) {
  const [suppressions, setSuppressions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [form, setForm] = useState({ email: "", reason: "manual", notes: "" });

  const loadSuppressions = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/api/manager/marketing/suppressions?limit=50", auth);
      setSuppressions(Array.isArray(data?.suppressions) ? data.suppressions : []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.response?.data?.error || e?.message || "Failed to load suppressions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppressions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const addSuppression = async () => {
    setSaving(true);
    setError("");
    setInfo("");
    try {
      await api.post("/api/manager/marketing/suppressions", form, auth);
      setForm({ email: "", reason: "manual", notes: "" });
      setInfo("Suppression added.");
      await loadSuppressions();
    } catch (e) {
      setError(e?.response?.data?.message || e?.response?.data?.error || e?.message || "Failed to add suppression.");
    } finally {
      setSaving(false);
    }
  };

  const removeSuppression = async (id) => {
    setSaving(true);
    setError("");
    setInfo("");
    try {
      await api.delete(`/api/manager/marketing/suppressions/${id}`, auth);
      setInfo("Suppression removed.");
      await loadSuppressions();
    } catch (e) {
      setError(e?.response?.data?.message || e?.response?.data?.error || e?.message || "Failed to remove suppression.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardHeader
        title="Marketing suppressions"
        subheader="Suppressed emails are skipped automatically before live marketing sends."
      />
      <CardContent>
        {loading ? <LinearProgress sx={{ mb: 2 }} /> : null}
        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
        {info ? <Alert severity="success" sx={{ mb: 2 }}>{info}</Alert> : null}
        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid item xs={12} md={4}>
            <TextField label="Email" fullWidth value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField select label="Reason" fullWidth value={form.reason} onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}>
              <MenuItem value="manual">Manual block</MenuItem>
              <MenuItem value="unsubscribe">Unsubscribe</MenuItem>
              <MenuItem value="bounce">Bounce</MenuItem>
              <MenuItem value="complaint">Complaint</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField label="Notes (optional)" fullWidth value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button variant="contained" fullWidth onClick={addSuppression} disabled={saving || !form.email.trim()}>
              Add suppression
            </Button>
          </Grid>
        </Grid>
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {suppressions.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{row.reason}</TableCell>
                  <TableCell>{row.source}</TableCell>
                  <TableCell>{row.created_at || "-"}</TableCell>
                  <TableCell align="right">
                    <Button color="error" size="small" onClick={() => removeSuppression(row.id)} disabled={saving}>
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </CardContent>
    </Card>
  );
}

function MarketingProviderCard({ auth, onProviderChange }) {
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [form, setForm] = useState({
    provider: "sendgrid",
    name: "Primary SendGrid",
    from_email: "",
    from_name: "",
    reply_to_email: "",
    daily_limit: 500,
    hourly_limit: 100,
    sendgrid_api_key: "",
    test_to_email: "",
  });

  const loadProvider = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/api/manager/marketing/provider", auth);
      const row = data?.provider || null;
      setProvider(row);
      if (onProviderChange) onProviderChange(row);
      setForm((prev) => ({
        ...prev,
        provider: "sendgrid",
        name: row?.name || "Primary SendGrid",
        from_email: row?.from_email || "",
        from_name: row?.from_name || "",
        reply_to_email: row?.reply_to_email || "",
        daily_limit: row?.daily_limit || 500,
        hourly_limit: row?.hourly_limit || 100,
        sendgrid_api_key: "",
      }));
    } catch (e) {
      setError(e?.response?.data?.message || e?.response?.data?.error || e?.message || "Failed to load marketing provider.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProvider();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const saveProvider = async () => {
    setSaving(true);
    setError("");
    setInfo("");
    try {
      const payload = {
        provider: "sendgrid",
        name: form.name,
        from_email: form.from_email,
        from_name: form.from_name,
        reply_to_email: form.reply_to_email,
        daily_limit: Number(form.daily_limit || 500),
        hourly_limit: Number(form.hourly_limit || 100),
      };
      if (form.sendgrid_api_key) payload.sendgrid_api_key = form.sendgrid_api_key;
      const { data } = provider?.id
        ? await api.patch(`/api/manager/marketing/provider/${provider.id}`, payload, auth)
        : await api.post("/api/manager/marketing/provider", payload, auth);
      if (onProviderChange) onProviderChange(data?.provider || null);
      setForm((prev) => ({ ...prev, sendgrid_api_key: "" }));
      setInfo("SendGrid provider saved.");
      await loadProvider();
    } catch (e) {
      setError(e?.response?.data?.message || e?.response?.data?.error || e?.message || "Failed to save marketing provider.");
    } finally {
      setSaving(false);
    }
  };

  const testProvider = async () => {
    if (!provider?.id) return;
    setSaving(true);
    setError("");
    setInfo("");
    try {
      const { data } = await api.post(`/api/manager/marketing/provider/${provider.id}/test`, {
        to_email: form.test_to_email || form.reply_to_email || form.from_email,
      }, auth);
      setInfo(`Test email sent to ${data?.result?.sent_to || form.test_to_email || form.from_email}.`);
      await loadProvider();
    } catch (e) {
      setError(e?.response?.data?.message || e?.response?.data?.error || e?.message || "Failed to send provider test email.");
    } finally {
      setSaving(false);
    }
  };

  const setProviderStatus = async (action) => {
    if (!provider?.id) return;
    setSaving(true);
    setError("");
    setInfo("");
    try {
      const { data } = await api.post(`/api/manager/marketing/provider/${provider.id}/${action}`, {}, auth);
      if (onProviderChange) onProviderChange(data?.provider || null);
      setInfo(action === "activate" ? "Provider activated." : "Provider paused.");
      await loadProvider();
    } catch (e) {
      setError(e?.response?.data?.message || e?.response?.data?.error || e?.message || `Failed to ${action} provider.`);
    } finally {
      setSaving(false);
    }
  };

  const statusLabel = provider?.status || "missing";
  const showDraftActivationHint = provider?.id && provider?.status === "draft";
  const showPausedHint = provider?.id && provider?.status === "paused";
  const showErrorHint = provider?.id && provider?.status === "error";

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardHeader
        title="Marketing Email Provider"
        subheader="Use your own SendGrid account for marketing campaigns. Transactional Schedulaa emails stay on shared app mail."
      />
      <CardContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {info && <Alert severity="success" sx={{ mb: 2 }}>{info}</Alert>}
        {showDraftActivationHint && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Your SendGrid connection saved successfully. Test it first, then click <strong>Activate</strong> to enable live marketing sends.
          </Alert>
        )}
        {showPausedHint && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            This SendGrid connection is paused. Preview still works, but live campaigns will stay disabled until you click <strong>Activate</strong>.
          </Alert>
        )}
        {showErrorHint && (
          <Alert severity="error" sx={{ mb: 2 }}>
            This SendGrid connection is in an error state. Review the last provider error, update the connection, and test again before activating it.
          </Alert>
        )}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={2}>
            <TextField label="Provider" fullWidth value="SendGrid" disabled />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField label="Connection status" fullWidth value={statusLabel} disabled />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField label="Connection name" fullWidth value={form.name} onChange={(e) => onChange("name", e.target.value)} disabled={loading || saving} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label={provider?.credentials_configured ? "SendGrid API key (leave blank to keep current key)" : "SendGrid API key"}
              fullWidth
              type="password"
              value={form.sendgrid_api_key}
              onChange={(e) => onChange("sendgrid_api_key", e.target.value)}
              disabled={loading || saving}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField label="From email" fullWidth value={form.from_email} onChange={(e) => onChange("from_email", e.target.value)} disabled={loading || saving} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField label="From name" fullWidth value={form.from_name} onChange={(e) => onChange("from_name", e.target.value)} disabled={loading || saving} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField label="Reply-to email" fullWidth value={form.reply_to_email} onChange={(e) => onChange("reply_to_email", e.target.value)} disabled={loading || saving} />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField label="Daily limit" type="number" fullWidth value={form.daily_limit} onChange={(e) => onChange("daily_limit", e.target.value)} disabled={loading || saving} />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField label="Hourly limit" type="number" fullWidth value={form.hourly_limit} onChange={(e) => onChange("hourly_limit", e.target.value)} disabled={loading || saving} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField label="Test email recipient" fullWidth value={form.test_to_email} onChange={(e) => onChange("test_to_email", e.target.value)} disabled={loading || saving || !provider?.id} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">
              Last provider test: {provider?.last_test_send_at || "Never"}<br />
              Last provider error: {provider?.last_error || "None"}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Button variant="contained" onClick={saveProvider} disabled={loading || saving}>
                Save
              </Button>
              <Button variant="outlined" onClick={testProvider} disabled={loading || saving || !provider?.id}>
                Test send
              </Button>
              <Button variant="outlined" onClick={() => setProviderStatus("pause")} disabled={loading || saving || !provider?.id || provider?.status === "paused"}>
                Pause
              </Button>
              <Button variant="outlined" onClick={() => setProviderStatus("activate")} disabled={loading || saving || !provider?.id || provider?.status === "active"}>
                Activate
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default function MarketingCampaignsTab() {
  const { t, i18n } = useTranslation();
  const { status: billingStatus } = useBillingStatus();
  const planKey = (billingStatus?.plan_key || "starter").toLowerCase();
  const isActive = ["active", "trialing"].includes(billingStatus?.status || "");
  const canAccess = (planKey === "pro" || planKey === "business") && isActive;
  const fieldLabel = (key) => {
    const labelKey = `campaigns.fields.${key}.label`;
    const value = t(labelKey);
    return value === labelKey ? key : value;
  };
  const fieldHelper = (key) => {
    const helperKey = `campaigns.fields.${key}.helper`;
    const value = t(helperKey);
    return value === helperKey ? undefined : value;
  };
  const columnLabel = (key) => {
    const columnKey = `campaigns.columns.${key}`;
    const value = t(columnKey);
    return value === columnKey ? key : value;
  };
  const segmentOptions = useMemo(() => ([
    { value: "all", label: t("campaigns.segments.all") },
    { value: "no_future", label: t("campaigns.segments.noFuture") },
  ]), [i18n.language]);
  const booleanOptions = useMemo(() => ([
    { value: "true", label: t("common.yes") },
    { value: "false", label: t("common.no") },
  ]), [i18n.language]);

  // Compute nice defaults here once
  const currentMonth = String(dayjs().month() + 1); // 1..12
  const defaultVipExpiry     = dayjs().add(14, "day").format("YYYY-MM-DD");
  const defaultAnnivExpiry   = dayjs().endOf("month").format("YYYY-MM-DD");
  const defaultWinbackExpiry = dayjs().add(7, "day").format("YYYY-MM-DD");

  const monthOptions = useMemo(() => (
    Array.from({ length: 12 }, (_, index) => ({
      value: String(index + 1),
      label: t(`common.monthShort.${index + 1}`),
    }))
  ), [i18n.language]);

  const [guideOpen, setGuideOpen] = useState(false);
  const { auth } = useAuth();
  const [provider, setProvider] = useState(null);
  const [campaignRefreshKey, setCampaignRefreshKey] = useState(0);

  const handleCampaignSent = () => setCampaignRefreshKey((v) => v + 1);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get("/api/manager/marketing/provider", auth);
        if (alive) setProvider(data?.provider || null);
      } catch {
        if (alive) setProvider(null);
      }
    })();
    return () => { alive = false; };
  }, [auth]);

  if (!canAccess) {
    return (
      <Box>
        <UpgradeNoticeBanner
          requiredPlan="pro"
          message="Email campaigns require the Pro plan or higher."
        />
        <Typography variant="body2" color="text.secondary">
          Upgrade to Pro to export clients and launch Broadcast, Win-Back, VIP, No-Show, and Anniversary campaigns.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header + Guide */}
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4">{t("titles.marketingCampaigns")}</Typography>
        <Tooltip title={t("tooltips.marketingGuide")}>

          <IconButton onClick={() => setGuideOpen(true)}>
            <HelpOutline />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Guide Drawer (content imported to keep this file lean) */}
      <Drawer
        anchor="right"
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ zIndex: (theme) => theme.zIndex.modal + 2000, '& .MuiDrawer-paper': { zIndex: 'inherit' } }}
      >
        <MarketingCampaignsGuide onClose={()=>setGuideOpen(false)} />
      </Drawer>
      <Alert severity="info" sx={{ mb: 2 }}>
        Every marketing email includes an unsubscribe link. Suppressed emails are skipped automatically, and campaigns are sent gradually to protect deliverability.
      </Alert>
      {/* Export: company clients (scoped) */}
      <MarketingProviderCard auth={auth} onProviderChange={setProvider} />
      <RecentMarketingCampaigns auth={auth} refreshKey={campaignRefreshKey} />
      <MarketingSuppressionsCard auth={auth} refreshKey={campaignRefreshKey} />
      <ExportClientsCard />

      {/* 0) Broadcast (Simple Announcement) */}
      <CampaignCard
        title={t("campaigns.cards.broadcast.title")}
        subtitle={t("campaigns.cards.broadcast.subtitle")}
        helpText={t("campaigns.cards.broadcast.help")}
        previewPath="/api/manager/campaigns/broadcast/preview"
        sendPath="/api/manager/campaigns/broadcast/send"
        fieldDefs={[
          { name: "subject", label: fieldLabel("subject"), default: t("campaigns.defaults.broadcast.subject"), helperText: fieldHelper("subject") },
          { name: "heading", label: fieldLabel("heading"), default: t("campaigns.defaults.broadcast.heading"), helperText: fieldHelper("heading") },
          { name: "intro", label: fieldLabel("intro"), default: t("campaigns.defaults.broadcast.intro"), multiline: true, rows: 3, helperText: fieldHelper("intro") },
          { name: "subtext", label: fieldLabel("subtext"), default: t("campaigns.defaults.broadcast.subtext"), multiline: true, rows: 2, helperText: fieldHelper("subtext") },
          { name: "cta_text", label: fieldLabel("ctaText"), default: t("campaigns.defaults.broadcast.ctaText"), helperText: fieldHelper("ctaText") },
          { name: "cta_url", label: fieldLabel("ctaUrl"), default: "?page=services-classic", helperText: fieldHelper("ctaUrl") },
          { name: "coupon_code", label: fieldLabel("couponOverride"), default: "", helperText: fieldHelper("couponOverride") },
          { name: "expires", label: fieldLabel("expiresOptional"), type: "date", default: "", helperText: fieldHelper("expiresOptional") },
          { name: "segment", label: fieldLabel("segment"), default: "all", select: segmentOptions, helperText: fieldHelper("segment") },
          { name: "since_days", label: fieldLabel("sinceDays"), type: "number", default: "", helperText: fieldHelper("sinceDays") },
          { name: "limit", label: fieldLabel("limit"), type: "number", default: 500, helperText: fieldHelper("limit") },
        ]}
        columns={[
          { key: "client_id", label: columnLabel("clientId") },
          { key: "name", label: columnLabel("name") },
          { key: "email", label: columnLabel("email") },
          { key: "subject", label: columnLabel("subject") },
        ]}
        mapRowKey={(r)=>`broadcast_${r.client_id}`}
        enableCopyOverrides={false}
        providerReady={provider?.status === "active"}
        providerStatus={provider?.status || "missing"}
        onCampaignSent={handleCampaignSent}
      />

      {/* 1) Win-Back */}
      <CampaignCard
        title={t("campaigns.cards.winback.title")}
        subtitle={t("campaigns.cards.winback.subtitle")}
        helpText={t("campaigns.cards.winback.help")}
        previewPath="/api/manager/campaigns/winback/preview"
        sendPath="/api/manager/campaigns/winback/send"
        fieldDefs={[
          { name: "overdue_multiplier", label: fieldLabel("overdueMultiplier"), type: "number", default: 1.5, helperText: fieldHelper("overdueMultiplier") },
          { name: "discount_percent", label: fieldLabel("discountPercent"), type: "number", default: 15, helperText: fieldHelper("discountPercent") },
          { name: "valid_days", label: fieldLabel("validDays"), type: "number", default: 7, helperText: fieldHelper("validDays") },
          { name: "expires", label: fieldLabel("expiresOverride"), type: "date", default: defaultWinbackExpiry, helperText: fieldHelper("expiresOverride") },
          { name: "limit", label: fieldLabel("limit"), type: "number", default: 50, helperText: fieldHelper("limit") },
          { name: "coupon_prefix", label: fieldLabel("couponPrefix"), default: "WINBACK", helperText: fieldHelper("couponPrefix") },
          { name: "coupon_code", label: fieldLabel("couponOverride"), default: "", helperText: fieldHelper("couponOverride") },
          { name: "rebook_link", label: fieldLabel("rebookLink"), default: "/book", helperText: fieldHelper("rebookLink") },
        ]}
        columns={[
          { key: "client_id", label: columnLabel("clientId") },
          { key: "name", label: columnLabel("name") },
          { key: "email", label: columnLabel("email") },
          { key: "days_since_last", label: columnLabel("daysSince"), align: "right" },
          { key: "expected_gap_days", label: columnLabel("expectedGap"), align: "right" },
          { key: "overdue_ratio", label: columnLabel("overdueRatio"), align: "right" },
          { key: "suggested_coupon", label: columnLabel("coupon") },
          { key: "suggested_expiry", label: columnLabel("expiry") },
        ]}
        mapRowKey={(r)=>`winback_${r.client_id}`}
        providerReady={provider?.status === "active"}
        providerStatus={provider?.status || "missing"}
        onCampaignSent={handleCampaignSent}
      />

      {/* 2) Skipped Rebook */}
      <CampaignCard
        title={t("campaigns.cards.skippedRebook.title")}
        subtitle={t("campaigns.cards.skippedRebook.subtitle")}
        helpText={t("campaigns.cards.skippedRebook.help")}
        previewPath="/api/manager/campaigns/skipped_rebook/preview"
        sendPath="/api/manager/campaigns/skipped_rebook/send"
        fieldDefs={[
          { name: "lookback_days", label: fieldLabel("lookbackDays"), type: "number", default: 3, helperText: fieldHelper("lookbackDays") },
          { name: "discount_percent", label: fieldLabel("discountPercent"), type: "number", default: 0, helperText: fieldHelper("discountPercentZero") },
          { name: "coupon_prefix", label: fieldLabel("couponPrefix"), default: "REBOOK", helperText: fieldHelper("couponPrefix") },
          { name: "coupon_code", label: fieldLabel("couponOverride"), default: "", helperText: fieldHelper("couponOverride") },
          { name: "expires", label: fieldLabel("expiresOptional"), type: "date", default: "", helperText: fieldHelper("expiresOptional") },
          { name: "deep_link", label: fieldLabel("deepLink"), default: "/rebook", helperText: fieldHelper("deepLink") },
        ]}
        columns={[
          { key: "client_id", label: columnLabel("clientId") },
          { key: "name", label: columnLabel("name") },
          { key: "email", label: columnLabel("email") },
          { key: "last_service_date", label: columnLabel("lastService") },
          { key: "suggested_coupon", label: columnLabel("coupon") },
        ]}
        mapRowKey={(r)=>`skipped_${r.client_id}_${r.last_service_date}`}
        providerReady={provider?.status === "active"}
        providerStatus={provider?.status || "missing"}
        onCampaignSent={handleCampaignSent}
      />

      {/* 3) VIP Loyalty */}
      <CampaignCard
        title={t("campaigns.cards.vip.title")}
        subtitle={t("campaigns.cards.vip.subtitle")}
        helpText={t("campaigns.cards.vip.help")}
        previewPath="/api/manager/campaigns/vip/preview"
        sendPath="/api/manager/campaigns/vip/send"
        fieldDefs={[
          { name: "vip_pct", label: fieldLabel("vipPct"), type: "number", default: 10, helperText: fieldHelper("vipPct") },
          { name: "limit", label: fieldLabel("limit"), type: "number", default: 50, helperText: fieldHelper("limit") },
          { name: "discount_percent", label: fieldLabel("discountPercent"), type: "number", default: 20, helperText: fieldHelper("discountPercent") },
          { name: "coupon_prefix", label: fieldLabel("couponPrefix"), default: "VIP", helperText: fieldHelper("couponPrefix") },
          { name: "coupon_code", label: fieldLabel("couponOverride"), default: "", helperText: fieldHelper("couponOverride") },
          { name: "vip_link", label: fieldLabel("vipLink"), default: "/vip", helperText: fieldHelper("vipLink") },
          { name: "expires", label: fieldLabel("expiresOverride"), type: "date", default: defaultVipExpiry, helperText: fieldHelper("expiresOverride") },
        ]}
        columns={[
          { key: "client_id", label: columnLabel("clientId") },
          { key: "name", label: columnLabel("name") },
          { key: "email", label: columnLabel("email") },
          { key: "ltv", label: columnLabel("ltv"), align: "right" },
          { key: "suggested_coupon", label: columnLabel("coupon") },
        ]}
        mapRowKey={(r)=>`vip_${r.client_id}`}
        providerReady={provider?.status === "active"}
        providerStatus={provider?.status || "missing"}
        onCampaignSent={handleCampaignSent}
      />

      {/* 4) Anniversary */}
      <CampaignCard
        title={t("campaigns.cards.anniversary.title")}
        subtitle={t("campaigns.cards.anniversary.subtitle")}
        helpText={t("campaigns.cards.anniversary.help")}
        previewPath="/api/manager/campaigns/anniversary/preview"
        sendPath="/api/manager/campaigns/anniversary/send"
        fieldDefs={[
          { name: "month", label: fieldLabel("month"), default: String(currentMonth), select: monthOptions, helperText: fieldHelper("month") },
          { name: "limit", label: fieldLabel("limit"), type: "number", default: 50, helperText: fieldHelper("limit") },
          { name: "coupon_prefix", label: fieldLabel("couponPrefix"), default: "ANNIV", helperText: fieldHelper("couponPrefix") },
          { name: "coupon_code", label: fieldLabel("couponOverride"), default: "", helperText: fieldHelper("couponOverride") },
          { name: "anniv_link", label: fieldLabel("annivLink"), default: "/book", helperText: fieldHelper("annivLink") },
          { name: "expires", label: fieldLabel("expiresOverride"), type: "date", default: defaultAnnivExpiry, helperText: fieldHelper("expiresOverride") },
          { name: "require_email", label: fieldLabel("requireEmail"), select: booleanOptions, default: "true", helperText: fieldHelper("requireEmail") },
        ]}
        columns={[
          { key: "client_id", label: columnLabel("clientId") },
          { key: "name", label: columnLabel("name") },
          { key: "email", label: columnLabel("email") },
          { key: "first_visit", label: columnLabel("firstVisit") },
          { key: "suggested_coupon", label: columnLabel("coupon") },
        ]}
        mapRowKey={(r)=>`anniv_${r.client_id}`}
        providerReady={provider?.status === "active"}
        providerStatus={provider?.status || "missing"}
        onCampaignSent={handleCampaignSent}
      />

      {/* 5) New Service Launch (optional) */}
      <CampaignCard
        title={t("campaigns.cards.newService.title")}
        subtitle={t("campaigns.cards.newService.subtitle")}
        helpText={t("campaigns.cards.newService.help")}
        previewPath="/api/manager/campaigns/new_service/preview"
        sendPath="/api/manager/campaigns/new_service/send"
        fieldDefs={[
          { name: "service_id", label: fieldLabel("serviceId"), type: "service", default: "", helperText: fieldHelper("serviceId") },
          { name: "lookback_months", label: fieldLabel("lookbackMonths"), type: "number", default: 12, helperText: fieldHelper("lookbackMonths") },
          { name: "discount_percent", label: fieldLabel("discountPercent"), type: "number", default: 0, helperText: fieldHelper("discountPercentZero") },
          { name: "coupon_prefix", label: fieldLabel("couponPrefix"), default: "NEW", helperText: fieldHelper("couponPrefix") },
          { name: "coupon_code", label: fieldLabel("couponOverride"), default: "", helperText: fieldHelper("couponOverride") },
          { name: "launch_link", label: fieldLabel("launchLink"), default: "?page=services-classic", helperText: fieldHelper("launchLink") },
          { name: "expires", label: fieldLabel("expiresOptional"), type: "date", default: "", helperText: fieldHelper("expiresOptional") },
          { name: "limit", label: fieldLabel("limit"), type: "number", default: 200, helperText: fieldHelper("limit") },
        ]}
        columns={[
          { key: "client_id", label: columnLabel("clientId") },
          { key: "name", label: columnLabel("name") },
          { key: "email", label: columnLabel("email") },
          { key: "suggested_coupon", label: columnLabel("coupon") },
        ]}
        mapRowKey={(r)=>`newsvc_${r.client_id}`}
        providerReady={provider?.status === "active"}
        providerStatus={provider?.status || "missing"}
        onCampaignSent={handleCampaignSent}
      />

      {/* 6) No-Show Recovery (optional) */}
      <CampaignCard
        title={t("campaigns.cards.noShow.title")}
        subtitle={t("campaigns.cards.noShow.subtitle")}
        helpText={t("campaigns.cards.noShow.help")}
        previewPath="/api/manager/campaigns/no_show_recovery/preview"
        sendPath="/api/manager/campaigns/no_show_recovery/send"
        fieldDefs={[
          { name: "lookback_days", label: fieldLabel("lookbackDays"), type: "number", default: 30, helperText: fieldHelper("lookbackDays") },
          { name: "require_no_future", label: fieldLabel("requireNoFuture"), select: booleanOptions, default: "true", helperText: fieldHelper("requireNoFuture") },
          { name: "require_fee", label: fieldLabel("requireFee"), select: booleanOptions, default: "false", helperText: fieldHelper("requireFee") },
          { name: "discount_percent", label: fieldLabel("discountPercent"), type: "number", default: 0, helperText: fieldHelper("discountPercentZero") },
          { name: "coupon_prefix", label: fieldLabel("couponPrefix"), default: "RECOVER", helperText: fieldHelper("couponPrefix") },
          { name: "coupon_code", label: fieldLabel("couponOverride"), default: "", helperText: fieldHelper("couponOverride") },
          { name: "rebook_link", label: fieldLabel("landingLink"), default: "/", helperText: fieldHelper("landingLink") },
          { name: "expires", label: fieldLabel("expiresOptional"), type: "date", default: "", helperText: fieldHelper("expiresOptional") },
          { name: "limit", label: fieldLabel("limit"), type: "number", default: 200, helperText: fieldHelper("limit") },
        ]}
        columns={[
          { key: "client_id", label: columnLabel("clientId") },
          { key: "name", label: columnLabel("name") },
          { key: "email", label: columnLabel("email") },
          { key: "suggested_coupon", label: columnLabel("coupon") },
        ]}
        mapRowKey={(r)=>`nsr_${r.client_id}`}
        providerReady={provider?.status === "active"}
        providerStatus={provider?.status || "missing"}
        onCampaignSent={handleCampaignSent}
      />

      {/* 7) Add-on Upsell (optional) */}
      <CampaignCard
        title={t("campaigns.cards.addonUpsell.title")}
        subtitle={t("campaigns.cards.addonUpsell.subtitle")}
        helpText={t("campaigns.cards.addonUpsell.help")}
        previewPath="/api/manager/campaigns/addon_upsell/preview"
        sendPath="/api/manager/campaigns/addon_upsell/send"
        fieldDefs={[
          { name: "base_service_id", label: fieldLabel("baseServiceId"), type: "service", default: "", helperText: fieldHelper("baseServiceId") },
          { name: "addon_name", label: fieldLabel("addonName"), default: "", helperText: fieldHelper("addonName") },
          { name: "lookback_days", label: fieldLabel("lookbackDays"), type: "number", default: 45, helperText: fieldHelper("lookbackDays") },
          { name: "discount_percent", label: fieldLabel("discountPercent"), type: "number", default: 10, helperText: fieldHelper("discountPercent") },
          { name: "coupon_prefix", label: fieldLabel("couponPrefix"), default: "ADDON", helperText: fieldHelper("couponPrefix") },
          { name: "coupon_code", label: fieldLabel("couponOverride"), default: "", helperText: fieldHelper("couponOverride") },
          { name: "deep_link", label: fieldLabel("deepLink"), default: "?page=services-classic", helperText: fieldHelper("deepLink") },
          { name: "expires", label: fieldLabel("expiresOptional"), type: "date", default: "", helperText: fieldHelper("expiresOptional") },
          { name: "limit", label: fieldLabel("limit"), type: "number", default: 200, helperText: fieldHelper("limit") },
        ]}
        columns={[
          { key: "client_id", label: columnLabel("clientId") },
          { key: "name", label: columnLabel("name") },
          { key: "email", label: columnLabel("email") },
          { key: "suggested_coupon", label: columnLabel("coupon") },
        ]}
        mapRowKey={(r)=>`upsell_${r.client_id}`}
        providerReady={provider?.status === "active"}
        providerStatus={provider?.status || "missing"}
        onCampaignSent={handleCampaignSent}
      />

    </Box>
  );
}
