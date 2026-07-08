import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  createLeadFinderSearch,
  getLeadFinderConfigStatus,
  getLeadFinderAnalytics,
  getLeadFinderUsage,
  importLeadFinderResults,
  listLeadFinderResults,
  listLeadFinderSearches,
  runLeadFinderDiscovery,
  scanLeadFinderEmails,
  selectLeadFinderEmail,
} from "../../../../api/platformAdminSales";

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(href);
}

function statusChip(label, color = "default") {
  return <Chip size="small" variant="outlined" color={color} label={label} />;
}

export default function EmailSdrLeadFinderSection({ onOpenLead }) {
  const [config, setConfig] = useState({ provider: "google_places", configured: false, setup_required: true, message: "" });
  const [usage, setUsage] = useState(null);
  const [searches, setSearches] = useState([]);
  const [analytics, setAnalytics] = useState({ totals: null, top_keywords: [], top_cities_by_email_discovery: [], top_searches_by_imported_leads: [] });
  const [searchId, setSearchId] = useState("");
  const [search, setSearch] = useState(null);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dialogResult, setDialogResult] = useState(null);
  const [lastImportedLeadIds, setLastImportedLeadIds] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [includePersonal, setIncludePersonal] = useState(false);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [form, setForm] = useState({
    industry: "",
    location: "",
    radius_km: 50,
    limit: 100,
  });
  const [filters, setFilters] = useState({
    businessDomain: true,
    businessLike: true,
    personal: false,
    noEmail: false,
    duplicates: false,
    hasPhone: false,
    hasWebsite: false,
    readyOnly: false,
    importedOnly: false,
  });

  const loadResults = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const payload = await listLeadFinderResults(id);
      setSearch(payload.search || null);
      setResults(Array.isArray(payload.results) ? payload.results : []);
      setSummary(payload.summary || {});
      setSelectedIds([]);
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to load Lead Finder results.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSearches = useCallback(async (nextSearchId = null) => {
    const rows = await listLeadFinderSearches({ limit: 25 });
    setSearches(rows);
    const resolvedId = nextSearchId || searchId || rows[0]?.id || "";
    if (resolvedId) {
      setSearchId(String(resolvedId));
      await loadResults(resolvedId);
    }
  }, [loadResults, searchId]);

  const loadConfig = useCallback(async () => {
    const payload = await getLeadFinderConfigStatus();
    setConfig(payload);
    setUsage(payload?.usage || null);
  }, []);

  const loadUsage = useCallback(async () => {
    const payload = await getLeadFinderUsage();
    if (payload) setUsage(payload);
  }, []);

  const loadAnalytics = useCallback(async () => {
    const payload = await getLeadFinderAnalytics({ limit: 50 });
    setAnalytics(payload || { totals: null, top_keywords: [], top_cities_by_email_discovery: [], top_searches_by_imported_leads: [] });
  }, []);

  useEffect(() => {
    loadConfig();
    loadSearches();
    loadAnalytics();
  }, [loadAnalytics, loadConfig, loadSearches]);

  const usageWarning = useMemo(() => {
    const budget = Number(usage?.monthly_budget_usd || 0);
    const estimated = Number(usage?.estimated_cost_usd || 0);
    if (!budget || budget <= 0) return null;
    const pct = estimated / budget;
    if (pct >= 1) return { level: "error", label: "100% used" };
    if (pct >= 0.9) return { level: "warning", label: "90% used" };
    if (pct >= 0.75) return { level: "warning", label: "75% used" };
    return null;
  }, [usage]);

  const filteredResults = useMemo(() => {
    return results.filter((row) => {
      const emails = Array.isArray(row.emails) ? row.emails : [];
      const selected = emails.find((email) => email.id === row.selected_email_id) || emails.find((email) => email.is_selected) || null;
      const type = selected?.email_type || "";
      const hasEmail = Boolean(row.selected_email);
      if (type === "business_domain" && !filters.businessDomain) return false;
      if (type === "free_provider_business_like" && !filters.businessLike) return false;
      if (type === "free_provider_personal_like" && !filters.personal) return false;
      if (!hasEmail && !filters.noEmail) return false;
      if (!filters.duplicates && row.duplicate_status !== "new") return false;
      if (filters.hasPhone && !row.phone) return false;
      if (filters.hasWebsite && !row.website) return false;
      if (filters.readyOnly && row.import_status !== "ready") return false;
      if (filters.importedOnly && row.import_status !== "imported") return false;
      return true;
    });
  }, [filters, results]);

  const allVisibleSelected = filteredResults.length > 0 && filteredResults.every((row) => selectedIds.includes(row.id));

  const handleCreateAndRunDiscovery = async () => {
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const created = await createLeadFinderSearch(form);
      if (!created?.id) throw new Error("Search was not created.");
      const payload = await runLeadFinderDiscovery(created.id);
      setSuccess(payload?.message || "Business discovery completed.");
      await loadConfig();
      await loadUsage();
      await loadAnalytics();
      await loadSearches(created.id);
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || "Unable to run Lead Finder discovery.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleScanEmails = async (targetSearchId = searchId) => {
    if (!targetSearchId) return;
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const payload = await scanLeadFinderEmails(targetSearchId);
      setSuccess(payload?.message || "Website email scan completed.");
      await loadUsage();
      await loadAnalytics();
      await loadResults(targetSearchId);
      await loadSearches(targetSearchId);
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || "Unable to scan websites for emails.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleScanMissingEmails = async (targetSearchId = searchId) => {
    if (!targetSearchId) return;
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const payload = await scanLeadFinderEmails(targetSearchId, { missing_only: true });
      setSuccess(payload?.message || "Missing-email website scan completed.");
      await loadUsage();
      await loadAnalytics();
      await loadResults(targetSearchId);
      await loadSearches(targetSearchId);
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || "Unable to scan missing email results.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRerunSearch = async (targetSearchId = searchId) => {
    if (!targetSearchId) return;
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const payload = await runLeadFinderDiscovery(targetSearchId);
      setSuccess(payload?.message || "Lead Finder discovery reran successfully.");
      await loadConfig();
      await loadUsage();
      await loadAnalytics();
      await loadResults(targetSearchId);
      await loadSearches(targetSearchId);
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || "Unable to rerun this search.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImport = async (mode = "selected", opts = {}) => {
    const targetSearchId = opts.searchId || searchId;
    const targetResults = opts.results || filteredResults;
    const targetSelectedIds = opts.selectedIds || selectedIds;
    if (!targetSearchId) return;
    const resultIds = mode === "selected" ? targetSelectedIds : targetResults.map((row) => row.id);
    if (!resultIds.length) return;
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const payload = await importLeadFinderResults(targetSearchId, {
        result_ids: resultIds,
        require_email: true,
        include_personal: includePersonal,
        skip_duplicates: skipDuplicates,
      });
      setSuccess(
        `Imported ${payload.imported || 0} lead(s). Duplicates: ${payload.duplicates || 0}. Skipped: ${payload.skipped || 0}. Missing email: ${payload.missing_email || 0}.`
      );
      setLastImportedLeadIds(Array.isArray(payload.created_lead_ids) ? payload.created_lead_ids : []);
      await loadUsage();
      await loadAnalytics();
      await loadResults(targetSearchId);
      await loadSearches(targetSearchId);
      if (payload.created_lead_ids?.length && onOpenLead) {
        onOpenLead(payload.created_lead_ids[0]);
      }
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || "Unable to import selected results.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectEmail = async (resultId, emailId) => {
    setSubmitting(true);
    setError("");
    try {
      await selectLeadFinderEmail(resultId, emailId);
      await loadResults(searchId);
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || "Unable to select the email candidate.");
    } finally {
      setSubmitting(false);
    }
  };

  const exportVisibleCsv = () => {
    const rows = [
      ["Company", "Website", "Phone", "City", "Selected Email", "Email Type", "Confidence", "Email Source", "Contact Score", "Contact Status", "Duplicate Status", "Import Status"],
      ...filteredResults.map((row) => {
        const selected = (row.emails || []).find((email) => email.id === row.selected_email_id) || {};
        return [
          row.company_name,
          row.website,
          row.phone,
          row.city,
          row.selected_email,
          selected.email_type || "",
          selected.confidence_label || "",
          selected.source_url || "",
          row.contact_score,
          row.contact_readiness,
          row.duplicate_status,
          row.import_status,
        ];
      }),
    ];
    downloadCsv(`lead-finder-${searchId || "results"}.csv`, rows);
  };

  const importRemainingValidCount = useMemo(
    () => filteredResults.filter((row) => row.import_status === "ready" && !selectedIds.includes(row.id)).length,
    [filteredResults, selectedIds]
  );

  const summaryReasons = summary?.reasons || {};

  return (
    <Paper sx={{ p: 2.5 }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.5}>
          <Box>
            <Typography variant="overline" sx={{ color: "#64748b", fontWeight: 800, letterSpacing: 0.8 }}>
              Upstream intake
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Lead Finder</Typography>
            <Typography variant="body2" color="text.secondary">
              Find businesses through a provider, scan each public website for contact emails, review candidates, then import valid leads into SDR.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {statusChip(config.configured ? "Google Places ready" : "Google Places setup required", config.configured ? "success" : "warning")}
            {search ? statusChip(`Search #${search.id} • ${search.status}`) : null}
          </Stack>
        </Stack>

        {!config.configured ? <Alert severity="warning" variant="outlined">{config.message}</Alert> : null}
        {usage ? (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={1.25}>
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Lead Finder usage
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Estimated Google Places usage for {usage.month_key}. New discoveries stop automatically when the monthly budget is reached.
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {statusChip(usage.budget_reached ? "Budget reached" : "Budget active", usage.budget_reached ? "warning" : "success")}
                  {usageWarning ? statusChip(usageWarning.label, usageWarning.level === "error" ? "error" : "warning") : null}
                </Stack>
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
                <Chip label={`Searches ${usage.searches || 0}`} variant="outlined" />
                <Chip label={`Businesses found ${usage.businesses_found || 0}`} variant="outlined" />
                <Chip label={`API requests ${usage.api_requests || 0}`} variant="outlined" />
                <Chip label={`Estimated cost $${usage.estimated_cost_usd || "0.0000"}`} color="info" variant="outlined" />
                <Chip label={`Monthly budget $${usage.monthly_budget_usd || "0.00"}`} variant="outlined" />
                <Chip label={`Remaining $${usage.remaining_budget_usd || "0.00"}`} color={usage.budget_reached ? "warning" : "success"} variant="outlined" />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Geocode: {usage.geocode_requests || 0} • Nearby search: {usage.places_search_requests || 0} • Place details: {usage.places_details_requests || 0}
              </Typography>
              {usageWarning ? (
                <Alert severity={usageWarning.level}>
                  Lead Finder is approaching its monthly Google Places budget. Discovery will automatically stop at 100%.
                </Alert>
              ) : null}
            </Stack>
          </Paper>
        ) : null}
        {analytics?.totals ? (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={1.5}>
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Lead Finder analytics
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    See which keywords and cities produce the best email discovery and SDR import yield.
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip label={`Cost / imported lead $${analytics.totals.cost_per_imported_lead_usd || "0.0000"}`} color="info" variant="outlined" />
                  <Chip label={`Imported ${analytics.totals.imported || 0}`} color="success" variant="outlined" />
                </Stack>
              </Stack>
              <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>Best keywords by imported leads</Typography>
                  <Stack spacing={0.75} sx={{ mt: 1 }}>
                    {(analytics.top_keywords || []).map((row) => (
                      <Paper key={`${row.search_id}-keyword`} variant="outlined" sx={{ p: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.keyword} • {row.location}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Imported {row.imported} • Email rate {row.email_discovery_rate}% • Cost/lead {row.cost_per_imported_lead_usd ? `$${row.cost_per_imported_lead_usd}` : "—"}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>Best cities by email discovery rate</Typography>
                  <Stack spacing={0.75} sx={{ mt: 1 }}>
                    {(analytics.top_cities_by_email_discovery || []).map((row) => (
                      <Paper key={`${row.search_id}-city`} variant="outlined" sx={{ p: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.city}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.keyword} • {row.email_discovery_rate}% email discovery • {row.emails_found}/{row.found} emails
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>Top searches by imported SDR leads</Typography>
                  <Stack spacing={0.75} sx={{ mt: 1 }}>
                    {(analytics.top_searches_by_imported_leads || []).map((row) => (
                      <Paper key={`${row.search_id}-import`} variant="outlined" sx={{ p: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Imported {row.imported} • Found {row.found} • Cost/lead {row.cost_per_imported_lead_usd ? `$${row.cost_per_imported_lead_usd}` : "—"}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </Stack>
          </Paper>
        ) : null}
        {error ? <Alert severity="error" variant="outlined">{error}</Alert> : null}
        {success ? <Alert severity="success" variant="outlined">{success}</Alert> : null}
        {lastImportedLeadIds.length && onOpenLead ? (
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" size="small" onClick={() => onOpenLead(lastImportedLeadIds[0])}>
              View imported leads
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center" }}>
              Opens the first imported lead. Imported IDs: {lastImportedLeadIds.join(", ")}
            </Typography>
          </Stack>
        ) : null}

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField fullWidth label="Industry" value={form.industry} onChange={(e) => setForm((prev) => ({ ...prev, industry: e.target.value }))} placeholder="Cleaning" />
          <TextField fullWidth label="Location" value={form.location} onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))} placeholder="Toronto" />
          <TextField type="number" label="Radius km" value={form.radius_km} onChange={(e) => setForm((prev) => ({ ...prev, radius_km: e.target.value }))} sx={{ minWidth: 140 }} />
          <TextField type="number" label="Limit" value={form.limit} onChange={(e) => setForm((prev) => ({ ...prev, limit: e.target.value }))} sx={{ minWidth: 140 }} />
          <Button variant="contained" onClick={handleCreateAndRunDiscovery} disabled={submitting || !form.industry || !form.location}>
            Find Businesses
          </Button>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
          <TextField
            select
            label="Recent search"
            value={searchId}
            onChange={async (e) => {
              const value = e.target.value;
              setSearchId(value);
              await loadResults(value);
            }}
            sx={{ minWidth: 320 }}
          >
            {searches.length === 0 ? <MenuItem value="">No searches yet</MenuItem> : null}
            {searches.map((row) => (
              <MenuItem key={row.id} value={row.id}>
                #{row.id} • {row.industry} • {row.location} • {row.status}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="outlined" onClick={handleScanEmails} disabled={submitting || !searchId || !search || search.total_found === 0}>
            Scan Emails
          </Button>
          <Button variant="outlined" onClick={handleScanMissingEmails} disabled={submitting || !searchId || !search || search.total_found === 0}>
            Scan Missing Emails
          </Button>
          <Button variant="outlined" onClick={handleRerunSearch} disabled={submitting || !searchId}>
            Rerun Search
          </Button>
          <Button variant="outlined" onClick={() => handleImport("selected")} disabled={submitting || selectedIds.length === 0}>
            Import Selected
          </Button>
          <Button variant="outlined" onClick={() => handleImport("all")} disabled={submitting || filteredResults.length === 0}>
            Import All Valid
          </Button>
          <Button variant="text" onClick={exportVisibleCsv} disabled={!filteredResults.length}>
            Export CSV
          </Button>
        </Stack>

        {searches.length ? (
          <Paper variant="outlined" sx={{ p: 1.5 }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Search history
              </Typography>
              {searches.slice(0, 6).map((row) => (
                <Stack
                  key={row.id}
                  direction={{ xs: "column", md: "row" }}
                  justifyContent="space-between"
                  spacing={1}
                  sx={{ borderTop: "1px solid #e2e8f0", pt: 1 }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {row.industry} • {row.location} • {row.radius_km} km
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      #{row.id} • {row.total_found || 0} found • {row.total_email_found || 0} with email • {row.status}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Button size="small" onClick={async () => { setSearchId(String(row.id)); await loadResults(row.id); }}>
                      Open results
                    </Button>
                    <Button size="small" onClick={async () => { setSearchId(String(row.id)); await loadResults(row.id); await handleRerunSearch(row.id); }} disabled={submitting}>
                      Rerun search
                    </Button>
                    <Button size="small" onClick={async () => { setSearchId(String(row.id)); await loadResults(row.id); await handleScanMissingEmails(row.id); }} disabled={submitting}>
                      Scan missing emails
                    </Button>
                    <Button
                      size="small"
                      onClick={async () => {
                        setSearchId(String(row.id));
                        const payload = await listLeadFinderResults(row.id);
                        const rowResults = Array.isArray(payload.results) ? payload.results.filter((item) => item.import_status === "ready") : [];
                        setSearch(payload.search || null);
                        setResults(Array.isArray(payload.results) ? payload.results : []);
                        setSummary(payload.summary || {});
                        await handleImport("all", { searchId: row.id, results: rowResults });
                      }}
                      disabled={submitting}
                    >
                      Import remaining valid
                    </Button>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </Paper>
        ) : null}

        <Stack direction={{ xs: "column", md: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
          <Chip label={`Found ${summary.found || 0}`} variant="outlined" />
          <Chip label={`Email found ${summary.email_found || 0}`} color="success" variant="outlined" />
          <Chip label={`No email ${summary.missing_email || 0}`} color="warning" variant="outlined" />
          <Chip label={`Duplicates ${summary.duplicates || 0}`} color="warning" variant="outlined" />
          <Chip label={`Imported ${summary.imported || 0}`} color="info" variant="outlined" />
          <Chip label={`Skipped ${summary.skipped || 0}`} variant="outlined" />
          <Chip label={`Ready ${summary.ready || 0}`} color="success" variant="outlined" />
          <Chip label={`Remaining valid ${importRemainingValidCount}`} variant="outlined" />
        </Stack>
        {searchId ? (
          <Paper variant="outlined" sx={{ p: 1.5 }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Import funnel breakdown
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This shows why discovered businesses did not become SDR leads.
              </Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
                <Chip label={`Duplicate ${summaryReasons.duplicate || 0}`} variant="outlined" />
                <Chip label={`Possible duplicate ${summaryReasons.possible_duplicate || 0}`} variant="outlined" />
                <Chip label={`No email ${summaryReasons.no_email || 0}`} color="warning" variant="outlined" />
                <Chip label={`Personal email ${summaryReasons.personal_email || 0}`} variant="outlined" />
                <Chip label={`Suppressed ${summaryReasons.suppressed || 0}`} variant="outlined" />
                <Chip label={`Invalid email ${summaryReasons.invalid_email || 0}`} variant="outlined" />
                <Chip label={`Missing website ${summaryReasons.missing_website || 0}`} variant="outlined" />
                <Chip label={`Blocked ${summaryReasons.blocked || 0}`} variant="outlined" />
              </Stack>
            </Stack>
          </Paper>
        ) : null}

        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
          <FormControlLabel control={<Switch checked={filters.businessDomain} onChange={(e) => setFilters((prev) => ({ ...prev, businessDomain: e.target.checked }))} />} label="Business domain" />
          <FormControlLabel control={<Switch checked={filters.businessLike} onChange={(e) => setFilters((prev) => ({ ...prev, businessLike: e.target.checked }))} />} label="Gmail/Outlook/Yahoo business-like" />
          <FormControlLabel control={<Switch checked={filters.personal} onChange={(e) => setFilters((prev) => ({ ...prev, personal: e.target.checked }))} />} label="Personal-looking free-provider" />
          <FormControlLabel control={<Switch checked={filters.hasPhone} onChange={(e) => setFilters((prev) => ({ ...prev, hasPhone: e.target.checked }))} />} label="Has phone" />
          <FormControlLabel control={<Switch checked={filters.hasWebsite} onChange={(e) => setFilters((prev) => ({ ...prev, hasWebsite: e.target.checked }))} />} label="Has website" />
          <FormControlLabel control={<Switch checked={filters.noEmail} onChange={(e) => setFilters((prev) => ({ ...prev, noEmail: e.target.checked }))} />} label="No email" />
          <FormControlLabel control={<Switch checked={filters.duplicates} onChange={(e) => setFilters((prev) => ({ ...prev, duplicates: e.target.checked }))} />} label="Include duplicates" />
          <FormControlLabel control={<Switch checked={filters.readyOnly} onChange={(e) => setFilters((prev) => ({ ...prev, readyOnly: e.target.checked }))} />} label="Ready to import" />
          <FormControlLabel control={<Switch checked={filters.importedOnly} onChange={(e) => setFilters((prev) => ({ ...prev, importedOnly: e.target.checked }))} />} label="Imported" />
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <FormControlLabel control={<Switch checked={includePersonal} onChange={(e) => setIncludePersonal(e.target.checked)} />} label="Include personal-looking emails on import" />
          <FormControlLabel control={<Switch checked={skipDuplicates} onChange={(e) => setSkipDuplicates(e.target.checked)} />} label="Skip duplicates by default" />
        </Stack>

        {!searchId ? (
          <Alert severity="info" variant="outlined">Create a Lead Finder search to begin.</Alert>
        ) : loading ? (
          <Alert severity="info" variant="outlined">Loading Lead Finder results…</Alert>
        ) : filteredResults.length === 0 ? (
          <Alert severity="info" variant="outlined">No Lead Finder results match the current filters.</Alert>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={allVisibleSelected}
                      indeterminate={!allVisibleSelected && selectedIds.length > 0}
                      onChange={(e) => setSelectedIds(e.target.checked ? filteredResults.map((row) => row.id) : [])}
                    />
                  </TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Website</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>City</TableCell>
                  <TableCell>Selected email</TableCell>
                  <TableCell>Email type</TableCell>
                  <TableCell>Confidence</TableCell>
                  <TableCell>Email source</TableCell>
                  <TableCell>Contact score</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Duplicate status</TableCell>
                  <TableCell>Import status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredResults.map((row) => {
                  const selected = (row.emails || []).find((email) => email.id === row.selected_email_id) || (row.emails || []).find((email) => email.is_selected) || null;
                  return (
                    <TableRow key={row.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.includes(row.id)}
                          onChange={(e) =>
                            setSelectedIds((prev) =>
                              e.target.checked ? Array.from(new Set([...prev, row.id])) : prev.filter((id) => id !== row.id)
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.company_name}</Typography>
                          <Button size="small" onClick={() => setDialogResult(row)} sx={{ alignSelf: "flex-start", px: 0 }}>
                            Review emails
                          </Button>
                        </Stack>
                      </TableCell>
                      <TableCell>{row.website ? <a href={row.website} target="_blank" rel="noreferrer">{row.website}</a> : "—"}</TableCell>
                      <TableCell>{row.phone || "—"}</TableCell>
                      <TableCell>{row.city || "—"}</TableCell>
                      <TableCell>{row.selected_email || "—"}</TableCell>
                      <TableCell>{selected?.email_type || "—"}</TableCell>
                      <TableCell>{selected ? `${selected.confidence_label} (${selected.confidence_score})` : "—"}</TableCell>
                      <TableCell>{selected?.source_page_type || "—"}</TableCell>
                      <TableCell>{row.contact_score ?? "—"}</TableCell>
                      <TableCell>{row.contact_readiness || "—"}</TableCell>
                      <TableCell>{row.duplicate_status}</TableCell>
                      <TableCell>{row.import_status}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Stack>

      <Dialog open={Boolean(dialogResult)} onClose={() => setDialogResult(null)} maxWidth="md" fullWidth>
        <DialogTitle>Email candidates</DialogTitle>
        <DialogContent dividers>
          {dialogResult ? (
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{dialogResult.company_name}</Typography>
              {!dialogResult.emails?.length ? (
                <Alert severity="info" variant="outlined">No public email candidates found yet for this website.</Alert>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Email</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Confidence</TableCell>
                      <TableCell>Source page</TableCell>
                      <TableCell>Source URL</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dialogResult.emails.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.email}</TableCell>
                        <TableCell>{row.email_type}</TableCell>
                        <TableCell>{row.confidence_label} ({row.confidence_score})</TableCell>
                        <TableCell>{row.source_page_type}</TableCell>
                        <TableCell sx={{ maxWidth: 260, wordBreak: "break-word" }}>{row.source_url || "—"}</TableCell>
                        <TableCell>
                          <Button size="small" variant={row.is_selected ? "contained" : "outlined"} disabled={submitting || row.is_selected} onClick={() => handleSelectEmail(dialogResult.id, row.id)}>
                            {row.is_selected ? "Selected" : "Select"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {dialogResult.has_contact_form ? statusChip("Contact form exists", "info") : null}
                {(dialogResult.social_links || []).slice(0, 3).map((link) => (
                  <Chip key={link} size="small" variant="outlined" label={new URL(link).hostname.replace(/^www\./, "")} component="a" href={link} clickable />
                ))}
              </Stack>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogResult(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
