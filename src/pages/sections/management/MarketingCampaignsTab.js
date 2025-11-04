import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
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
const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

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
  const [dryRun, setDryRun] = useState(false);
  const [sending, setSending] = useState(false);
  const [info, setInfo] = useState("");

  // Service lookup (for fields with type: "service")
  const [serviceOptions, setServiceOptions] = useState([]);
  const [svcLoading, setSvcLoading] = useState(false);
  const [serviceSelections, setServiceSelections] = useState({}); // keyed by field name

  const fetchServices = async (q = "") => {
    setSvcLoading(true);
    try {
      const url = `${API}/booking/services${q ? `?q=${encodeURIComponent(q)}` : ""}`;
      const { data } = await axios.get(url, auth);
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
      const { data } = await axios.get(`${API}${previewPath}?${qs}`, auth);
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
    setErr(""); setInfo(""); setSending(true);
    try {
      let payload = { dry_run: !!dryRun };
      if (mode === "selected") {
        const targets = rows
          .filter(r => selected[mapRowKey(r)])
          .map(r => ({
            email: r.email,
            subject: r.subject,
            html: r.html
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
        payload.targets = rows.map(r => ({ email: r.email, subject: r.subject, html: r.html }));
      }
      const { data } = await axios.post(`${API}${sendPath}`, payload, auth);
      const sentCount = data?.sent ?? 0;
      const dryMode = data?.dry_run ? t("campaigns.dryRunStatusOnShort") : t("campaigns.dryRunStatusOffShort");
      setInfo(t("campaigns.sendResult", { count: sentCount, mode: dryMode }));
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || t("campaigns.failedToSend"));
    } finally {
      setSending(false);
    }
  };

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardHeader title={title} subheader={subtitle} />
      <CardContent>
        {helpText && <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{helpText}</Typography>}

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
              ) : (
                <TextField
                  type={fd.type || "text"}
                  label={fd.label}
                  fullWidth
                  value={params[fd.name] ?? ""}
                  onChange={e => onChangeParam(fd.name, e.target.value)}
                  helperText={fd.helperText || ""}
                  InputLabelProps={fd.type === "date" ? { shrink: true } : undefined}
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
              label={`${t("campaigns.dryRun")} (${dryRun ? t("campaigns.dryRunOn") : t("campaigns.dryRunOff")})`}
            />
          </Grid>
          <Grid item xs={12} md="auto">
            <Button
              variant="outlined"
              disabled={sending || rows.length === 0}
              onClick={()=>send("selected")}
            >
              {t("buttons.sendSelected")}
            </Button>
          </Grid>
          <Grid item xs={12} md="auto">
            <Button
              variant="outlined"
              disabled={sending}
              onClick={()=>send("all")}
            >
              {t("buttons.sendAllServer")}
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

export default function MarketingCampaignsTab() {
  const { t, i18n } = useTranslation();
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
      {/* Export: company clients (scoped) */}
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
      />

    </Box>
  );
}

