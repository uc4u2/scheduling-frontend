// src/pages/sections/management/ProviderTop10.js
import React, { useEffect, useMemo, useState } from "react";
import api from "../../../utils/api";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";

/* ────────────────────────────────────────────────────────── */
/*                           CONFIG                           */
/* ────────────────────────────────────────────────────────── */

/** Server metric keys -> nice labels.
 *  “fallback: true” means we can compute from /api/manager/analytics/summary?provider_id=...
 *  Everything else is server-only (we’ll show “No data” if endpoint isn’t available).
 */
const METRICS = [
  // Original, with fallback
  { key: "revenue",               label: "Revenue (Captured)",              fallback: true, kind: "money" },
  { key: "tips_total",            label: "Tips (Captured)",                 fallback: true, kind: "money" },
  { key: "no_show_rate",          label: "No-Show Rate",                    fallback: true, kind: "percent" },
  { key: "utilization",           label: "Utilization (Booked/Shift)",      fallback: true, kind: "percent" },
  { key: "avg_tip",               label: "Average Tip",                     fallback: true, kind: "money" },

  // Rebook (server-only unless you add advanced endpoint)
  { key: "rebook_rate_30d",       label: "Rebook Rate (30d)",               fallback: false, kind: "percent" },
  { key: "rebook_rate_60d",       label: "Rebook Rate (60d)",               fallback: false, kind: "percent" },
  { key: "rebook_rate_90d",       label: "Rebook Rate (90d)",               fallback: false, kind: "percent" },

  { key: "avg_addons",            label: "Attachment (Avg Add-ons)",        fallback: false, kind: "number" },
  { key: "csat",                  label: "CSAT (Avg Stars)",                fallback: false, kind: "number" },

  // ── 10+ NEW, manager-useful, per-employee ──
  { key: "bookings",              label: "Bookings (Total)",                fallback: true,  kind: "count" },
  { key: "show_ups",              label: "Show-ups (Kept)",                 fallback: true,  kind: "count" }, // total - cancelled - no_show
  { key: "show_up_rate",          label: "Show-up Rate",                    fallback: true,  kind: "percent" },
  { key: "rev_per_booked_hour",   label: "Revenue / Booked Hour",           fallback: true,  kind: "money" },
  { key: "rev_per_avail_hour",    label: "Revenue / Available Hour (RevPAH)",fallback: true, kind: "money" },
  { key: "avg_ticket",            label: "Average Ticket (Rev/Booking)",    fallback: true,  kind: "money" },
  { key: "tip_rate",              label: "Tip Rate",                        fallback: true,  kind: "percent" },
  { key: "avg_lead_time_hours",   label: "Avg Lead Time (h)",               fallback: true,  kind: "hours" },
  { key: "new_clients",           label: "New Clients",                     fallback: true,  kind: "count" },
  { key: "returning_clients",     label: "Returning Clients",               fallback: true,  kind: "count" },
  { key: "new_client_ratio",      label: "New Client Ratio",                fallback: true,  kind: "percent" },
  { key: "net_revenue",           label: "Net Revenue (Rev + Tip − Refund)",fallback: true,  kind: "money" },
  { key: "refunds_total",         label: "Refunds (Total)",                 fallback: true,  kind: "money" },
  { key: "prepaid_rate",          label: "Prepaid Share",                   fallback: true,  kind: "percent" }, // paid_count/total
  { key: "card_on_file_rate",     label: "Card-on-File Share",              fallback: true,  kind: "percent" }, // card_on_file_count/total
  { key: "unpaid_rate",           label: "Unpaid Share",                    fallback: true,  kind: "percent" }, // unpaid_count/total
];

/* ────────────────────────────────────────────────────────── */
/*                        UTIL HELPERS                        */
/* ────────────────────────────────────────────────────────── */

const fmtMoney = (n) => `$${Number(n || 0).toFixed(2)}`;
const fmtPct   = (n) => `${(Number(n || 0) * 100).toFixed(1)}%`;
const fmtHrs   = (n) => `${Number(n || 0).toFixed(2)} h`;

const nameOfRecruiter = (r) =>
  r?.name || [r?.first_name, r?.last_name].filter(Boolean).join(" ") || (r?.id ? `Provider #${r.id}` : "—");

const prettyValue = (kind, v) => {
  switch (kind) {
    case "money":   return fmtMoney(v);
    case "percent": return fmtPct(v);
    case "hours":   return fmtHrs(v);
    case "count":   return `${Number(v || 0)}`;
    default:        return `${v ?? "—"}`;
  }
};

/* ────────────────────────────────────────────────────────── */
/*                        MAIN COMPONENT                      */
/* ────────────────────────────────────────────────────────── */

const ProviderTop10 = ({ token: tokenProp }) => {
  const token = tokenProp || localStorage.getItem("token") || "";
  const auth = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  // Filters (self-contained panel)
  const [from, setFrom] = useState(dayjs().startOf("month").format("YYYY-MM-DD"));
  const [to, setTo]     = useState(dayjs().format("YYYY-MM-DD"));
  const [tz, setTz]     = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  const [departmentId, setDepartmentId] = useState("");
  const [providerId, setProviderId]     = useState(""); // Employee filter
  const [metricKey, setMetricKey]       = useState("revenue");

  // Directory
  const [recruiters, setRecruiters]     = useState([]);
  const [departments, setDepartments]   = useState([]);

  // Data
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dirLoading, setDirLoading] = useState(false);
  const [error, setError] = useState("");

  /* ───────── Directory (Employees + Departments) ───────── */

  const loadDirectory = async () => {
    setDirLoading(true);
    setError("");
    try {
      const [rec, dept] = await Promise.all([
        api.get(`/manager/recruiters`, auth),
        api.get(`/api/departments`,   auth),
      ]);
      setRecruiters(rec?.data?.recruiters || rec?.data || []);
      setDepartments(dept?.data || []);
    } catch {
      setError("Failed to load directory (employees / departments).");
    } finally {
      setDirLoading(false);
    }
  };

  /* ───────── Server Top-10 (preferred) ───────── */

  const loadTop10Server = async () => {
    const params = { metric: metricKey, from, to, tz };
    if (departmentId) params.department_id = departmentId;
    if (providerId)   params.provider_id   = providerId;

    const qs = new URLSearchParams(params).toString();
    const { data } = await api.get(`/api/manager/providers/top10?${qs}`, auth);
    const list = Array.isArray(data) ? data : (data?.rows || []);
    return list;
  };

  /* ───────── Client-side fallback (scan employees with /analytics/summary) ───────── */

  const metricDef = useMemo(
    () => METRICS.find((m) => m.key === metricKey) || METRICS[0],
    [metricKey]
  );

  // extract a single metric from a provider-scoped /analytics/summary result
  const extractFromSummary = (key, json) => {
    const k = json?.kpis || {};
    const clients = json?.clients || {};
    const util = Array.isArray(json?.utilization_by_provider) ? json.utilization_by_provider[0] : null;

    const total   = Number(k.total_appointments || 0);
    const noShowN = Number(k.no_show_appointments || 0);
    const cancelN = Number(k.cancelled || 0);
    const keptN   = Math.max(0, total - noShowN - cancelN);

    const bookedMin = Number(util?.booked_min || 0);
    const shiftMin  = Number(util?.shift_min || 0);
    const bookedHr  = bookedMin / 60;
    const availHr   = shiftMin / 60;

    const gross     = Number(k.gross_balance || 0);
    const tips      = Number(k.tips_total || 0);
    const refunds   = Number(k.refunds_total || 0);
    const net       = Number(k.net_revenue || (gross + tips - refunds));

    switch (key) {
      case "revenue":               return { value: gross,  bookings: total, minutes: bookedMin };
      case "tips_total":            return { value: tips,   bookings: total, minutes: bookedMin };
      case "avg_tip":               return { value: Number(k.avg_tip || 0), bookings: total };
      case "no_show_rate":          return { value: Number(k.no_show_rate || 0), count: noShowN, bookings: total };
      case "utilization":           return { value: util?.utilization ?? null, minutes: bookedMin, secondary: shiftMin };
      case "bookings":              return { value: total, bookings: total, minutes: bookedMin };
      case "show_ups":              return { value: keptN, count: keptN, bookings: total };
      case "show_up_rate":          return { value: total ? keptN / total : 0, count: keptN, bookings: total };
      case "rev_per_booked_hour":   return { value: bookedHr ? (gross / bookedHr) : 0, bookings: total, minutes: bookedMin };
      case "rev_per_avail_hour":    return { value: availHr  ? (gross / availHr)  : 0, bookings: total, minutes: shiftMin };
      case "avg_ticket":            return { value: total ? (gross / total) : 0, bookings: total };
      case "tip_rate":              return { value: Number(k.tip_rate || 0), bookings: total };
      case "avg_lead_time_hours":   return { value: k.avg_lead_time_hours ?? null };
      case "new_clients":           return { value: Number(clients.new || 0),    count: Number(clients.new || 0) };
      case "returning_clients":     return { value: Number(clients.returning || 0), count: Number(clients.returning || 0) };
      case "new_client_ratio": {
        const denom = Number(clients.new || 0) + Number(clients.returning || 0);
        return { value: denom ? (Number(clients.new || 0) / denom) : 0 };
      }
      case "net_revenue":           return { value: net };
      case "refunds_total":         return { value: refunds };
      case "prepaid_rate":          return { value: total ? (Number(k.paid_count || 0) / total) : 0, bookings: total };
      case "card_on_file_rate":     return { value: total ? (Number(k.card_on_file_count || 0) / total) : 0, bookings: total };
      case "unpaid_rate":           return { value: total ? (Number(k.unpaid_count || 0) / total) : 0, bookings: total };
      default:                      return { value: null };
    }
  };

  // scan employees and compute a metric using provider-scoped summaries
  const loadTop10Fallback = async () => {
    // Choose which recruiters we scan
    const candidates = (departmentId
      ? recruiters.filter((r) => String(r.department_id) === String(departmentId))
      : recruiters
    ).filter(Boolean);

    // If an employee is explicitly selected, just scan that one
    const providerIds = providerId
      ? [String(providerId)]
      : candidates.map((r) => String(r.id));

    // Concurrency cap (5 at a time)
    const results = [];
    const chunkSize = 5;
    for (let i = 0; i < providerIds.length; i += chunkSize) {
      const chunk = providerIds.slice(i, i + chunkSize);
      const batch = await Promise.all(
        chunk.map(async (pid) => {
          try {
            const qs = new URLSearchParams({
              from, to, tz, group: "day", provider_id: pid,
            }).toString();
            const { data } = await api.get(`/api/manager/analytics/summary?${qs}`, auth);
            const extracted = extractFromSummary(metricKey, data);
            return {
              provider_id: Number(pid),
              ...extracted,
            };
          } catch {
            return null;
          }
        })
      );
      batch.filter(Boolean).forEach((row) => results.push(row));
    }

    // sort descending by value; keep top 10
    const sorted = results
      .filter((r) => r && r.value != null && !Number.isNaN(r.value))
      .sort((a, b) => Number(b.value) - Number(a.value))
      .slice(0, 10);

    return sorted;
  };

  /* ───────── Loader that prefers server endpoint, falls back if needed ───────── */

  const loadTop10 = async () => {
    setLoading(true);
    setError("");
    try {
      // 1) Try server endpoint (if implemented)
      let list = [];
      try {
        list = await loadTop10Server();
      } catch {
        // ignore; we’ll fall back
      }

      // 2) If server returned nothing OR metric supports fallback, compute locally
      if ((!Array.isArray(list) || list.length === 0) && metricDef.fallback) {
        list = await loadTop10Fallback();
      }

      setRows(Array.isArray(list) ? list : []);
      if ((!list || list.length === 0) && !metricDef.fallback) {
        // server-only metric with no data/endpoint
        setError("No data (or endpoint not implemented) for this metric.");
      }
    } catch (e) {
      setRows([]);
      setError(e?.response?.data?.error || "Failed to load Top-10");
    } finally {
      setLoading(false);
    }
  };

  /* ───────── Effects ───────── */

  // initial directory + first load
  useEffect(() => {
    loadDirectory().then(loadTop10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // when filters change, reload
  useEffect(() => {
    if (!recruiters.length) return; // wait for directory
    loadTop10();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, tz, departmentId, providerId, metricKey]);

  // when department changes, clear provider if it doesn't belong
  useEffect(() => {
    if (!providerId) return;
    const inDept = recruiters.some(
      (r) => String(r.id) === String(providerId) && (!departmentId || String(r.department_id) === String(departmentId))
    );
    if (!inDept) setProviderId("");
  }, [departmentId, providerId, recruiters]);

  /* ───────── Derived ───────── */

  const deptMap = useMemo(() => {
    const m = new Map();
    departments.forEach((d) => m.set(String(d.id), d));
    return m;
  }, [departments]);

  const recruiterMap = useMemo(() => {
    const m = new Map();
    recruiters.forEach((r) => m.set(String(r.id), r));
    return m;
  }, [recruiters]);

  const filteredRecruiters = useMemo(() => {
    return departmentId
      ? recruiters.filter((r) => String(r.department_id) === String(departmentId))
      : recruiters;
  }, [recruiters, departmentId]);

  const directoryLoaded = !dirLoading && (recruiters.length || departments.length);

  /* ───────── CSV Export ───────── */

  const exportCSV = () => {
    const header = [
      "rank",
      "provider_id",
      "provider_name",
      "department",
      METRICS.find((m) => m.key === metricKey)?.label || metricKey,
      "bookings",
      "minutes",
      "count",
      "secondary",
    ];
    const lines = rows.map((r, i) => {
      const rec  = recruiterMap.get(String(r.provider_id));
      const name = nameOfRecruiter(rec) || `Provider #${r.provider_id}`;
      const dept = rec?.department_id ? (deptMap.get(String(rec.department_id))?.name || rec.department_id) : "";
      return [
        i + 1,
        r.provider_id ?? "",
        `"${String(name).replace(/"/g, '""')}"`,
        `"${String(dept || "").replace(/"/g, '""')}"`,
        r.value ?? "",
        r.bookings ?? "",
        r.minutes ?? "",
        r.count ?? "",
        r.secondary ?? "",
      ].join(",");
    });
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `top10_${metricKey}_${from}_${to}${departmentId ? `_dept${departmentId}` : ""}${providerId ? `_prov${providerId}` : ""}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ───────── Render helpers ───────── */

  const providerLine = (pid) => {
    const rec = recruiterMap.get(String(pid));
    const dept = rec?.department_id ? (deptMap.get(String(rec.department_id))?.name || rec.department_id) : null;
    const name = nameOfRecruiter(rec) || `Provider #${pid}`;
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="subtitle2">{name}</Typography>
        {dept ? <Chip size="small" variant="outlined" label={dept} /> : null}
        {rec?.email ? (
          <Tooltip title={rec.email}>
            <Chip size="small" variant="outlined" label="email" />
          </Tooltip>
        ) : null}
      </Stack>
    );
  };

  const metricLabel = useMemo(
    () => METRICS.find((m) => m.key === metricKey)?.label || metricKey,
    [metricKey]
  );

  /* ───────── RENDER ───────── */

  return (
    <Card variant="outlined">
      <CardHeader
        title="Top-10 Employees (by Metric)"
        subheader="Pick a Department, then (optionally) an Employee to filter. Export or drill into any metric."
        action={
          <Stack direction="row" spacing={1}>
            <Button size="small" onClick={() => {
              setFrom(dayjs().startOf("month").format("YYYY-MM-DD"));
              setTo(dayjs().format("YYYY-MM-DD"));
            }}>
              MTD
            </Button>
            <Button size="small" onClick={() => {
              setFrom(dayjs().subtract(29, "day").format("YYYY-MM-DD"));
              setTo(dayjs().format("YYYY-MM-DD"));
            }}>
              Last 30d
            </Button>
            <Button size="small" onClick={() => {
              setFrom(dayjs().startOf("year").format("YYYY-MM-DD"));
              setTo(dayjs().format("YYYY-MM-DD"));
            }}>
              YTD
            </Button>
          </Stack>
        }
      />
      <CardContent>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 1 }}>
          <Grid item xs={12} md={2}>
            <TextField
              label="From"
              type="date"
              fullWidth
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              label="To"
              type="date"
              fullWidth
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Timezone"
              fullWidth
              value={tz}
              onChange={(e) => setTz(e.target.value)}
            />
          </Grid>

          {/* Department select */}
          <Grid item xs={12} md={2}>
            <TextField
              select
              fullWidth
              label="Department"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
            >
              <MenuItem value=""><em>All Departments</em></MenuItem>
              {departments.map((d) => (
                <MenuItem key={d.id} value={String(d.id)}>
                  {d.name || `Dept #${d.id}`}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Employee select (filtered by department) */}
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Employee"
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              helperText="Optional — pick a specific employee"
            >
              <MenuItem value=""><em>All Employees</em></MenuItem>
              {filteredRecruiters.map((r) => (
                <MenuItem key={r.id} value={String(r.id)}>
                  {nameOfRecruiter(r)}
                  {r.department_id
                    ? ` — ${deptMap.get(String(r.department_id))?.name || `Dept #${r.department_id}`}`
                    : ""}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Metric */}
          <Grid item xs={12} md={2}>
            <TextField
              select
              fullWidth
              label="Metric"
              value={metricKey}
              onChange={(e) => setMetricKey(e.target.value)}
            >
              {METRICS.map((m) => (
                <MenuItem key={m.key} value={m.key}>{m.label}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md="auto">
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={loadTop10}>Refresh</Button>
              <Button
                variant="contained"
                onClick={exportCSV}
                disabled={!rows.length}
              >
                Export CSV
              </Button>
            </Stack>
          </Grid>
        </Grid>

        {(dirLoading || loading) && <LinearProgress sx={{ mb: 2 }} />}

        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Directory snapshot to show counts/filters applied */}
        {directoryLoaded && (
          <>
            <Typography variant="caption" color="text.secondary">
              Directory: {filteredRecruiters.length} employee(s)
              {departmentId ? ` in ${deptMap.get(String(departmentId))?.name || "Dept " + departmentId}` : ""}
              {providerId ? ` • Selected: ${nameOfRecruiter(recruiterMap.get(String(providerId)))}` : ""}
            </Typography>
            <Divider sx={{ my: 1.5 }} />
          </>
        )}

        <Typography variant="h6" sx={{ mb: 1 }}>
          {metricLabel}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Top 10 • {from} → {to} ({tz})
          {departmentId ? ` • Dept: ${deptMap.get(String(departmentId))?.name || departmentId}` : ""}
          {providerId ? ` • Employee: ${nameOfRecruiter(recruiterMap.get(String(providerId)))}` : ""}
        </Typography>

        {!rows.length ? (
          <Alert severity="info">
            No data found for the selected filters.
          </Alert>
        ) : (
          <Grid container spacing={1}>
            {rows.map((r, idx) => {
              const topValue = Math.max(1, Number(rows[0]?.value || 1));
              const widthPct = Math.min(100, Math.round((Number(r.value || 0) / topValue) * 100));
              const kind = metricDef.kind || "number";
              return (
                <Grid item xs={12} key={`${r.provider_id}-${idx}`}>
                  <Box sx={{ p: 1.25, border: "1px solid #eee", borderRadius: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip size="small" label={`#${idx + 1}`} />
                        {providerLine(r.provider_id)}
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {r.bookings != null && <Chip size="small" label={`Bookings: ${r.bookings}`} />}
                        {r.minutes  != null && <Chip size="small" label={`Minutes: ${r.minutes}`} />}
                        {r.count    != null && <Chip size="small" label={`Count: ${r.count}`} />}
                        <Chip color="primary" label={prettyValue(kind, r.value)} />
                      </Stack>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={widthPct}
                      sx={{ mt: 0.75, height: 8, borderRadius: 1 }}
                    />
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        )}
      </CardContent>
    </Card>
  );
};

export default ProviderTop10;
