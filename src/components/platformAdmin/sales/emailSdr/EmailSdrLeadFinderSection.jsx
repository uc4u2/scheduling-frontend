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

  useEffect(() => {
    loadConfig();
    loadSearches();
  }, [loadConfig, loadSearches]);

  const filteredResults = useMemo(() => {
    return results.filter((row) => {
      const emails = Array.isArray(row.emails) ? row.emails : [];
      const selected = emails.find((email) => email.id === row.selected_email_id) || emails.find((email) => email.is_selected) || null;
      const type = selected?.email_type || "";
      if (!filters.businessDomain && type === "business_domain") return false;
      if (!filters.businessLike && type === "free_provider_business_like") return false;
      if (!filters.personal && type === "free_provider_personal_like") return false;
      if (!filters.noEmail && row.email_status === "missing_email") return false;
      if (!filters.duplicates && row.duplicate_status !== "new") return false;
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
      await loadSearches(created.id);
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || "Unable to run Lead Finder discovery.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleScanEmails = async () => {
    if (!searchId) return;
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const payload = await scanLeadFinderEmails(searchId);
      setSuccess(payload?.message || "Website email scan completed.");
      await loadUsage();
      await loadResults(searchId);
      await loadSearches(searchId);
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || "Unable to scan websites for emails.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImport = async (mode = "selected") => {
    if (!searchId) return;
    const resultIds = mode === "selected" ? selectedIds : filteredResults.map((row) => row.id);
    if (!resultIds.length) return;
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const payload = await importLeadFinderResults(searchId, {
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
      await loadResults(searchId);
      await loadSearches(searchId);
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
      ["Company", "Website", "Phone", "City", "Selected Email", "Email Type", "Confidence", "Email Source", "Duplicate Status", "Import Status"],
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
          row.duplicate_status,
          row.import_status,
        ];
      }),
    ];
    downloadCsv(`lead-finder-${searchId || "results"}.csv`, rows);
  };

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
                {statusChip(usage.budget_reached ? "Budget reached" : "Budget active", usage.budget_reached ? "warning" : "success")}
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

        <Stack direction={{ xs: "column", md: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
          <Chip label={`Found ${summary.found || 0}`} variant="outlined" />
          <Chip label={`Email found ${summary.email_found || 0}`} color="success" variant="outlined" />
          <Chip label={`No email ${summary.missing_email || 0}`} color="warning" variant="outlined" />
          <Chip label={`Duplicates ${summary.duplicates || 0}`} color="warning" variant="outlined" />
          <Chip label={`Imported ${summary.imported || 0}`} color="info" variant="outlined" />
          <Chip label={`Ready ${summary.ready || 0}`} color="success" variant="outlined" />
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
          <FormControlLabel control={<Switch checked={filters.businessDomain} onChange={(e) => setFilters((prev) => ({ ...prev, businessDomain: e.target.checked }))} />} label="Business domain" />
          <FormControlLabel control={<Switch checked={filters.businessLike} onChange={(e) => setFilters((prev) => ({ ...prev, businessLike: e.target.checked }))} />} label="Gmail/Outlook/Yahoo business-like" />
          <FormControlLabel control={<Switch checked={filters.personal} onChange={(e) => setFilters((prev) => ({ ...prev, personal: e.target.checked }))} />} label="Personal-looking free-provider" />
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
