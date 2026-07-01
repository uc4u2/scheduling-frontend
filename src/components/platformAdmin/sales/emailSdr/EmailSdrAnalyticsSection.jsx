import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import LaunchIcon from "@mui/icons-material/Launch";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import {
  activateEmailCampaign,
  getEmailSdrResults,
  pauseEmailCampaign,
} from "../../../../api/platformAdminSales";

const resultTabs = [
  { key: "campaigns", label: "Campaigns" },
  { key: "suppression", label: "Suppression" },
  { key: "unmatched", label: "Unmatched" },
  { key: "recent_events", label: "Recent events" },
  { key: "providers", label: "Providers" },
];

const healthTone = {
  healthy: "success",
  monitor: "info",
  at_risk: "warning",
  pause_and_fix: "error",
};

const issueTone = {
  info: "info",
  warning: "warning",
  danger: "error",
};

function formatDateTime(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function compactText(value, max = 140) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "No details.";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function KpiCard({ label, value, tone = "default", helper = null }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.75,
        borderRadius: 3,
        minWidth: 150,
        flex: 1,
        bgcolor: "#fff",
        borderColor: tone === "default" ? "#dbe2f0" : undefined,
      }}
    >
      <Stack spacing={0.5}>
        <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, letterSpacing: 0.4 }}>
          {label}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a" }}>
          {value}
        </Typography>
        {helper ? <Typography variant="caption" color="text.secondary">{helper}</Typography> : null}
      </Stack>
    </Paper>
  );
}

function SectionCard({ title, subtitle = null, action = null, children }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 3, bgcolor: "#fff" }}>
      <Stack spacing={1.5}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{title}</Typography>
            {subtitle ? <Typography variant="body2" color="text.secondary">{subtitle}</Typography> : null}
          </Box>
          {action}
        </Stack>
        {children}
      </Stack>
    </Paper>
  );
}

function TableHeader({ columns = [] }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: columns.map((column) => column.width || "1fr").join(" "),
        gap: 1.25,
        px: 1.25,
        py: 1,
        borderBottom: "1px solid #e2e8f0",
        bgcolor: "#f8fafc",
        borderRadius: "12px 12px 0 0",
      }}
    >
      {columns.map((column) => (
        <Typography key={column.key} variant="caption" sx={{ color: "#475569", fontWeight: 800, letterSpacing: 0.4 }}>
          {column.label}
        </Typography>
      ))}
    </Box>
  );
}

function TableRow({ columns = [], rowKey, children }) {
  return (
    <Box
      key={rowKey}
      sx={{
        display: "grid",
        gridTemplateColumns: columns.map((column) => column.width || "1fr").join(" "),
        gap: 1.25,
        px: 1.25,
        py: 1.25,
        borderBottom: "1px solid #edf2f7",
        alignItems: "start",
      }}
    >
      {children}
    </Box>
  );
}

export default function EmailSdrAnalyticsSection({
  campaigns = [],
  providerConnections = [],
  onOpenWorkspace,
  onOpenLead,
  showBanner,
}) {
  const presetStorageKey = "email-sdr-results-presets-v1";
  const [dateRange, setDateRange] = useState("30d");
  const [viewMode, setViewMode] = useState("all");
  const [campaignId, setCampaignId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [healthFilter, setHealthFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [warningsOnly, setWarningsOnly] = useState(false);
  const [activeTab, setActiveTab] = useState("campaigns");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savedPresetName, setSavedPresetName] = useState("");
  const [savedPresets, setSavedPresets] = useState([]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(presetStorageKey);
      setSavedPresets(stored ? JSON.parse(stored) : []);
    } catch {
      setSavedPresets([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadResults = async () => {
      setLoading(true);
      setError("");
      try {
        const payload = await getEmailSdrResults({
          date_range: dateRange,
          campaign_id: viewMode === "campaign" && campaignId ? campaignId : undefined,
          provider_connection_id: providerId || undefined,
          status: statusFilter || undefined,
          health: healthFilter || undefined,
          search: searchTerm || undefined,
        });
        if (!cancelled) {
          setResults(payload);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError?.response?.data?.error || "Failed to load Email SDR results.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    loadResults();
    return () => {
      cancelled = true;
    };
  }, [campaignId, dateRange, healthFilter, providerId, searchTerm, statusFilter, viewMode]);

  const selectedCampaign = useMemo(
    () => campaigns.find((row) => Number(row.id) === Number(campaignId)) || null,
    [campaignId, campaigns]
  );
  const activeFilters = useMemo(() => ({
    dateRange,
    viewMode,
    campaignId,
    providerId,
    healthFilter,
    statusFilter,
    searchTerm,
    warningsOnly,
  }), [campaignId, dateRange, healthFilter, providerId, searchTerm, statusFilter, viewMode, warningsOnly]);
  const campaignHealthRows = useMemo(() => {
    const rows = results?.campaign_health_rows || [];
    if (!warningsOnly) return rows;
    return rows.filter((row) => (row.warnings || []).length > 0);
  }, [results, warningsOnly]);
  const suppressionRows = results?.suppression_rows || [];
  const unmatchedRows = results?.unmatched_rows || [];
  const recentEvents = results?.recent_events || [];
  const providerHealthRows = results?.provider_health_rows || [];
  const summary = results?.executive_summary || {};
  const healthState = summary?.health_state || "monitor";
  const healthLabel = {
    healthy: "Healthy",
    monitor: "Monitor",
    at_risk: "At risk",
    pause_and_fix: "Pause and fix",
  }[healthState] || "Monitor";

  const persistPresets = (nextPresets) => {
    setSavedPresets(nextPresets);
    try {
      window.localStorage.setItem(presetStorageKey, JSON.stringify(nextPresets));
    } catch {
      // ignore local storage errors
    }
  };

  const handleSavePreset = () => {
    const name = savedPresetName.trim();
    if (!name) {
      showBanner?.("warning", "Enter a preset name before saving.");
      return;
    }
    const nextPresets = [
      ...savedPresets.filter((row) => row.name !== name),
      { name, filters: activeFilters },
    ].sort((a, b) => a.name.localeCompare(b.name));
    persistPresets(nextPresets);
    showBanner?.("success", `Saved results preset: ${name}.`);
  };

  const handleApplyPreset = (name) => {
    const preset = savedPresets.find((row) => row.name === name);
    if (!preset) return;
    const filters = preset.filters || {};
    setDateRange(filters.dateRange || "30d");
    setViewMode(filters.viewMode || "all");
    setCampaignId(filters.campaignId || "");
    setProviderId(filters.providerId || "");
    setHealthFilter(filters.healthFilter || "");
    setStatusFilter(filters.statusFilter || "");
    setSearchTerm(filters.searchTerm || "");
    setWarningsOnly(Boolean(filters.warningsOnly));
  };

  const handleDeletePreset = (name) => {
    persistPresets(savedPresets.filter((row) => row.name !== name));
  };

  const handleToggleCampaignStatus = async (row) => {
    try {
      if (row.status === "paused") {
        await activateEmailCampaign(row.campaign_id);
        showBanner?.("success", "Campaign resumed.");
      } else {
        await pauseEmailCampaign(row.campaign_id);
        showBanner?.("success", "Campaign paused.");
      }
      const payload = await getEmailSdrResults({
        date_range: dateRange,
        campaign_id: viewMode === "campaign" && campaignId ? campaignId : undefined,
        provider_connection_id: providerId || undefined,
        status: statusFilter || undefined,
        health: healthFilter || undefined,
        search: searchTerm || undefined,
      });
      setResults(payload);
    } catch (actionError) {
      showBanner?.("error", actionError?.response?.data?.error || "Failed to update campaign status.");
    }
  };

  return (
    <Stack spacing={2.25}>
      <SectionCard
        title="Results"
        subtitle="Review campaign performance, delivery quality, replies, and operational risks before scaling."
        action={
          selectedCampaign ? (
            <Button
              variant="outlined"
              endIcon={<LaunchIcon fontSize="small" />}
              onClick={() => onOpenWorkspace?.(selectedCampaign.id)}
            >
              Open campaign workspace
            </Button>
          ) : null
        }
      >
        <Stack direction={{ xs: "column", lg: "row" }} spacing={1.25} flexWrap="wrap" useFlexGap>
          <TextField
            select
            size="small"
            label="Date range"
            value={dateRange}
            onChange={(event) => setDateRange(event.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="7d">Last 7 days</MenuItem>
            <MenuItem value="30d">Last 30 days</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label="View"
            value={viewMode}
            onChange={(event) => setViewMode(event.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="all">All campaigns</MenuItem>
            <MenuItem value="campaign">Selected campaign</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label="Campaign"
            value={campaignId}
            onChange={(event) => setCampaignId(event.target.value)}
            sx={{ minWidth: 260 }}
          >
            <MenuItem value="">All campaigns</MenuItem>
            {campaigns.map((row) => (
              <MenuItem key={`results-campaign-${row.id}`} value={row.id}>{row.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Provider"
            value={providerId}
            onChange={(event) => setProviderId(event.target.value)}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">All providers</MenuItem>
            {providerConnections.map((row) => (
              <MenuItem key={`results-provider-${row.id}`} value={row.id}>{row.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Health"
            value={healthFilter}
            onChange={(event) => setHealthFilter(event.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">All health</MenuItem>
            <MenuItem value="healthy">Healthy</MenuItem>
            <MenuItem value="monitor">Monitor</MenuItem>
            <MenuItem value="at_risk">At risk</MenuItem>
            <MenuItem value="pause_and_fix">Pause and fix</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">All statuses</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="queued">Queued</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="paused">Paused</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </TextField>
          <TextField
            size="small"
            label="Search"
            placeholder="Campaign, provider, city, sender"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            sx={{ minWidth: 260, flex: 1 }}
          />
          <FormControlLabel
            control={<Switch checked={warningsOnly} onChange={(event) => setWarningsOnly(event.target.checked)} />}
            label="Warnings only"
            sx={{ ml: 0.5 }}
          />
          <TextField
            select
            size="small"
            label="Saved preset"
            value=""
            onChange={(event) => handleApplyPreset(event.target.value)}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">Choose preset</MenuItem>
            {savedPresets.map((row) => (
              <MenuItem key={`results-preset-${row.name}`} value={row.name}>{row.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            label="Save current filters as"
            value={savedPresetName}
            onChange={(event) => setSavedPresetName(event.target.value)}
            sx={{ minWidth: 220 }}
          />
          <Button variant="outlined" startIcon={<SaveOutlinedIcon fontSize="small" />} onClick={handleSavePreset}>
            Save preset
          </Button>
        </Stack>
        {!!savedPresets.length && (
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {savedPresets.map((row) => (
              <Chip
                key={`results-preset-chip-${row.name}`}
                label={row.name}
                onClick={() => handleApplyPreset(row.name)}
                onDelete={() => handleDeletePreset(row.name)}
                variant="outlined"
                size="small"
              />
            ))}
          </Stack>
        )}
      </SectionCard>

      {error ? <Alert severity="error" variant="outlined">{error}</Alert> : null}
      {loading && !results ? <Alert severity="info" variant="outlined">Loading Email SDR results…</Alert> : null}

      <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} flexWrap="wrap" useFlexGap>
        <KpiCard label="Sent" value={summary.sent || 0} />
        <KpiCard label="Delivered" value={summary.delivered || 0} />
        <KpiCard label="Replies" value={summary.replies || 0} helper={`${summary.reply_rate || 0}% reply rate`} />
        <KpiCard label="Positive replies" value={summary.positive_replies || 0} helper={`${summary.positive_reply_rate || 0}% positive reply rate`} />
        <KpiCard label="Hot leads" value={summary.hot_leads || 0} />
        <KpiCard label="Needs action" value={summary.needs_action || 0} />
        <KpiCard label="Bounces" value={summary.bounces || 0} helper={`${summary.bounce_rate || 0}% bounce rate`} />
        <KpiCard label="Unsubscribes" value={summary.unsubscribes || 0} helper={`${summary.unsubscribe_rate || 0}% unsubscribe rate`} />
      </Stack>

      <Alert severity={healthTone[healthState] || "info"} variant="outlined">
        <strong>{healthLabel}</strong>
        {summary.health_message ? ` — ${summary.health_message}` : ""}
      </Alert>

      <SectionCard title="Operational issues" subtitle="Structured risks and follow-up problems that need action before you scale.">
        {!results?.operational_issues?.length ? (
          <Alert severity="success" variant="outlined">No active operational issues for the current filter set.</Alert>
        ) : (
          <Stack spacing={1.25}>
            {results.operational_issues.map((issue) => (
              <Paper key={issue.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2.5, bgcolor: "#fff" }}>
                <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" spacing={1.5}>
                  <Stack spacing={0.75}>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip size="small" color={issueTone[issue.severity] || "default"} variant="outlined" label={issue.severity} />
                      <Chip size="small" variant="outlined" label={issue.category} />
                    </Stack>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{issue.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{issue.explanation}</Typography>
                  </Stack>
                  {issue.campaign_id ? (
                    <Button variant="outlined" size="small" onClick={() => onOpenWorkspace?.(issue.campaign_id)}>
                      {issue.action_label || "Open campaign"}
                    </Button>
                  ) : (
                    <Chip size="small" variant="outlined" label={issue.action_label || issue.action_type || "Review"} />
                  )}
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </SectionCard>

      <SectionCard title="Detailed results" subtitle="Use tabs to move from campaign health to suppression, unmatched replies, provider health, and the recent event stream.">
        <Tabs value={activeTab} onChange={(_, nextValue) => setActiveTab(nextValue)} variant="scrollable" allowScrollButtonsMobile>
          {resultTabs.map((tab) => <Tab key={tab.key} value={tab.key} label={tab.label} />)}
        </Tabs>

        {activeTab === "campaigns" ? (
          !campaignHealthRows.length ? (
            <Alert severity="info" variant="outlined">No campaigns match the current filters.</Alert>
          ) : (
            <Box sx={{ border: "1px solid #e2e8f0", borderRadius: 3, overflow: "hidden" }}>
              <TableHeader
                columns={[
                  { key: "campaign", label: "Campaign", width: "2.2fr" },
                  { key: "provider", label: "Provider / Senders", width: "1.5fr" },
                  { key: "performance", label: "Performance", width: "1.8fr" },
                  { key: "quality", label: "Quality", width: "1.3fr" },
                  { key: "activity", label: "Last activity", width: "1fr" },
                  { key: "actions", label: "Actions", width: "0.9fr" },
                ]}
              />
              {campaignHealthRows.map((row) => (
                <TableRow
                  key={`campaign-health-${row.campaign_id}`}
                  rowKey={`campaign-health-${row.campaign_id}`}
                  columns={[
                    { key: "campaign", width: "2.2fr" },
                    { key: "provider", width: "1.5fr" },
                    { key: "performance", width: "1.8fr" },
                    { key: "quality", width: "1.3fr" },
                    { key: "activity", width: "1fr" },
                    { key: "actions", width: "0.9fr" },
                  ]}
                >
                  <Stack spacing={0.5}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{row.campaign_name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {[row.business_type, row.city, row.status].filter(Boolean).join(" • ")}
                    </Typography>
                      {!!row.warnings?.length && (
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                          {row.warnings.slice(0, 2).map((warning) => (
                            <Chip key={`${row.campaign_id}-${warning.code}`} size="small" color="warning" variant="outlined" label={warning.code.replaceAll("_", " ")} />
                          ))}
                        </Stack>
                    )}
                  </Stack>
                  <Stack spacing={0.5}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.provider_name || "No provider"}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.provider_type || "fallback"}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(row.sender_agents || []).map((agent) => agent.name).join(", ") || "No sender agent"}
                    </Typography>
                  </Stack>
                  <Stack spacing={0.5}>
                    <Typography variant="body2">Sent {row.sent} • Delivered {row.delivered} • Replies {row.replies}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Positive {row.positive_replies} • Hot leads {row.hot_leads} • Needs action {row.needs_action}
                    </Typography>
                  </Stack>
                  <Stack spacing={0.75}>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Chip size="small" color={healthTone[row.health_state] || "default"} variant="outlined" label={row.health_state.replaceAll("_", " ")} />
                      <Tooltip title={row.health_reason || "No additional health context."}>
                        <IconButton size="small" sx={{ p: 0.25 }}>
                          <InfoOutlinedIcon fontSize="inherit" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Bounce {row.bounce_rate}% • Unsub {row.unsubscribe_rate}%
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">{formatDateTime(row.last_activity_at)}</Typography>
                  <Stack spacing={1} alignItems="flex-start">
                    <Button variant="outlined" size="small" onClick={() => onOpenWorkspace?.(row.campaign_id)}>Open workspace</Button>
                    <Button
                      variant="text"
                      size="small"
                      startIcon={row.status === "paused" ? <PlayCircleOutlineIcon fontSize="small" /> : <PauseCircleOutlineIcon fontSize="small" />}
                      onClick={() => handleToggleCampaignStatus(row)}
                    >
                      {row.status === "paused" ? "Resume" : "Pause"}
                    </Button>
                  </Stack>
                </TableRow>
              ))}
            </Box>
          )
        ) : null}

        {activeTab === "suppression" ? (
          !suppressionRows.length ? (
            <Alert severity="info" variant="outlined">No suppression rows for the current filter set.</Alert>
          ) : (
            <Stack spacing={1}>
              {suppressionRows.map((row) => (
                <Paper key={`suppression-${row.email}-${row.created_at}`} variant="outlined" sx={{ p: 1.5, borderRadius: 2.5 }}>
                  <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" spacing={1}>
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{row.email}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {[row.reason, row.source, row.company_name, row.campaign_name].filter(Boolean).join(" • ")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{formatDateTime(row.created_at)}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      {row.lead_id ? (
                        <Button variant="text" size="small" startIcon={<OpenInNewIcon fontSize="small" />} onClick={() => onOpenLead?.(row.lead_id)}>
                          Open lead
                        </Button>
                      ) : null}
                      {row.campaign_id ? <Button variant="outlined" size="small" onClick={() => onOpenWorkspace?.(row.campaign_id)}>Open workspace</Button> : null}
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )
        ) : null}

        {activeTab === "unmatched" ? (
          !unmatchedRows.length ? (
            <Alert severity="info" variant="outlined">No unmatched inbound events for the current filter set.</Alert>
          ) : (
            <Stack spacing={1}>
              {unmatchedRows.map((row) => (
                <Paper key={`unmatched-${row.inbound_event_id}`} variant="outlined" sx={{ p: 1.5, borderRadius: 2.5 }}>
                  <Stack spacing={0.75}>
                    <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{row.from_email || "Unknown sender"}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {[row.provider, row.match_reason, row.subject].filter(Boolean).join(" • ")}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        {row.suggested_classification ? <Chip size="small" color="info" variant="outlined" label={row.suggested_classification} /> : null}
                        {row.suggested_next_action ? <Chip size="small" color="secondary" variant="outlined" label={`Next: ${row.suggested_next_action}`} /> : null}
                      </Stack>
                    </Stack>
                    <Typography variant="body2">{row.body_snippet}</Typography>
                    <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                      <Typography variant="caption" color="text.secondary">{formatDateTime(row.received_at)}</Typography>
                      {row.campaign_guess ? <Button variant="outlined" size="small" onClick={() => onOpenWorkspace?.(row.campaign_guess)}>Open campaign</Button> : null}
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )
        ) : null}

        {activeTab === "recent_events" ? (
          !recentEvents.length ? (
            <Alert severity="info" variant="outlined">No recent events for the current filter set.</Alert>
          ) : (
            <Stack spacing={1}>
              {recentEvents.slice(0, 40).map((row, index) => (
                <Paper key={`recent-event-${index}-${row.time}`} variant="outlined" sx={{ p: 1.5, borderRadius: 2.5 }}>
                  <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{row.event_type.replaceAll("_", " ")}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {[row.campaign_name, row.company_name, row.actor_or_source].filter(Boolean).join(" • ")}
                      </Typography>
                      <Typography variant="body2">{compactText(row.details)}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {row.lead_id ? (
                        <Button variant="text" size="small" startIcon={<OpenInNewIcon fontSize="small" />} onClick={() => onOpenLead?.(row.lead_id)}>
                          Open lead
                        </Button>
                      ) : null}
                      <Typography variant="caption" color="text.secondary">{formatDateTime(row.time)}</Typography>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )
        ) : null}

        {activeTab === "providers" ? (
          !providerHealthRows.length ? (
            <Alert severity="info" variant="outlined">No provider rows for the current filter set.</Alert>
          ) : (
            <Stack spacing={1}>
              {providerHealthRows.map((row) => (
                <Paper key={`provider-health-${row.provider_connection_id}`} variant="outlined" sx={{ p: 1.5, borderRadius: 2.5 }}>
                  <Stack spacing={0.75}>
                    <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{row.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {[row.provider, row.status, `Last event ${row.last_event_received_at ? formatDateTime(row.last_event_received_at) : "never"}`].join(" • ")}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip size="small" variant="outlined" label={`Sent ${row.sent}`} />
                        <Chip size="small" variant="outlined" label={`Delivered ${row.delivered}`} />
                        <Chip size="small" variant="outlined" label={`Replies ${row.replies}`} />
                        <Chip size="small" color="error" variant="outlined" label={`Bounces ${row.bounces}`} />
                        <Chip size="small" color="warning" variant="outlined" label={`Unsubs ${row.unsubscribes}`} />
                      </Stack>
                    </Stack>
                    {!!row.warnings?.length && (
                      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                        {row.warnings.map((warning) => (
                          <Chip key={`${row.provider_connection_id}-${warning.code}`} size="small" color={warning.level === "info" ? "info" : "warning"} variant="outlined" label={warning.message} />
                        ))}
                      </Stack>
                    )}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )
        ) : null}
      </SectionCard>
    </Stack>
  );
}
