import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Drawer,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import LeadSummaryCards from "../../components/platformAdmin/sales/LeadSummaryCards";
import LeadListTable from "../../components/platformAdmin/sales/LeadListTable";
import LeadDetailDrawer from "../../components/platformAdmin/sales/LeadDetailDrawer";
import LeadCreateDialog from "../../components/platformAdmin/sales/LeadCreateDialog";
import LeadAssignDialog from "../../components/platformAdmin/sales/LeadAssignDialog";
import LeadBulkAssignBar from "../../components/platformAdmin/sales/LeadBulkAssignBar";
import LeadImportCard from "../../components/platformAdmin/sales/LeadImportCard";
import {
  assignLead,
  bulkAssignLeads,
  convertLead,
  createLead,
  deleteLead,
  bulkDeleteLeads,
  getLead,
  getLeadActivityById,
  importLeads,
  getSalesCallSettings,
  getSalesTwilioStatus,
  getLeadSummary,
  listLeadImportBatches,
  listLeads,
  listSalesDeals,
  listSalesReps,
  markLeadDuplicate,
  restoreLead,
  suppressLead,
  unassignLead,
  unlockLead,
  updateLead,
  saveSalesCallSettings,
} from "../../api/platformAdminSales";

const emptyForm = {
  company_name: "",
  contact_name: "",
  phone: "",
  email: "",
  website: "",
  industry: "",
  city: "",
  country: "",
  source: "",
  priority: 0,
  assigned_rep_id: "",
};

const emptyActionState = {
  suppressReason: "",
  duplicateOfLeadId: "",
  convertCompanyId: "",
  convertSalesDealId: "",
  convertNote: "",
};

const emptyImportForm = {
  file: null,
  sales_rep_id: "",
  source: "",
};

const emptyConfirmAction = {
  type: "",
  title: "",
  body: "",
  leadId: null,
  leadIds: [],
};

const emptyDrawerMeta = {
  tab: "overview",
  editMode: false,
};

const defaultCallSettings = {
  crm_call_mode: "legacy",
  crm_phone_visibility: "full",
  crm_call_provider: null,
  crm_rep_call_flow: "manual",
};

export default function SalesCRMPage() {
  const topOffset = { xs: 56, sm: 64 };
  const [summary, setSummary] = useState({});
  const [reps, setReps] = useState([]);
  const [deals, setDeals] = useState([]);
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [assignedRepId, setAssignedRepId] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [flagFilter, setFlagFilter] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("");
  const [callbackState, setCallbackState] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(25);
  const [selectedIds, setSelectedIds] = useState([]);
  const [drawerLeadId, setDrawerLeadId] = useState(null);
  const [drawerLead, setDrawerLead] = useState(null);
  const [drawerActivity, setDrawerActivity] = useState([]);
  const [drawerAssignments, setDrawerAssignments] = useState([]);
  const [drawerLockInfo, setDrawerLockInfo] = useState(null);
  const [drawerMeta, setDrawerMeta] = useState(emptyDrawerMeta);
  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignDialogTitle, setAssignDialogTitle] = useState("Assign lead");
  const [createForm, setCreateForm] = useState(emptyForm);
  const [assignRepId, setAssignRepId] = useState("");
  const [assignReason, setAssignReason] = useState("");
  const [importForm, setImportForm] = useState(emptyImportForm);
  const [importBatches, setImportBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [banner, setBanner] = useState({ type: "success", message: "" });
  const [actionState, setActionState] = useState(emptyActionState);
  const [confirmAction, setConfirmAction] = useState(emptyConfirmAction);
  const [guideOpen, setGuideOpen] = useState(false);
  const [callSettings, setCallSettings] = useState(defaultCallSettings);
  const [twilioStatus, setTwilioStatus] = useState({ configured: false, provider: "twilio", missing_config_fields: [] });
  const [loadingCallSettings, setLoadingCallSettings] = useState(true);
  const [savingCallSettings, setSavingCallSettings] = useState(false);

  const showBanner = useCallback((type, message) => setBanner({ type, message }), []);

  const loadStatic = useCallback(async () => {
    setLoadingCallSettings(true);
    try {
      const [repRows, dealRows, batches, callSettingsResp] = await Promise.all([
        listSalesReps(),
        listSalesDeals(),
        listLeadImportBatches(),
        getSalesCallSettings(),
      ]);
      setReps(repRows);
      setDeals(dealRows);
      setImportBatches(batches);
      setCallSettings(callSettingsResp?.settings || defaultCallSettings);
      setTwilioStatus(callSettingsResp?.twilio_status || { configured: false, provider: "twilio", missing_config_fields: [] });
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to load CRM settings.");
    } finally {
      setLoadingCallSettings(false);
    }
  }, [showBanner]);

  const loadDrawerLead = useCallback(async (leadId) => {
    const [detailResp, activityRows] = await Promise.all([getLead(leadId), getLeadActivityById(leadId)]);
    setDrawerLead(detailResp?.lead || null);
    setDrawerAssignments(detailResp?.assignments || []);
    setDrawerLockInfo(detailResp?.lock || null);
    setDrawerActivity(activityRows || []);
  }, []);

  const loadPage = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryResp, leadsResp] = await Promise.all([
        getLeadSummary(),
        listLeads({
          q: query || undefined,
          status: status || undefined,
          assigned_rep_id: assignedRepId || undefined,
          source: sourceFilter || undefined,
          flag: flagFilter || undefined,
          outcome: outcomeFilter || undefined,
          callback_state: callbackState || undefined,
          sort_by: sortBy,
          sort_dir: sortDir,
          page: page + 1,
          per_page: perPage,
        }),
      ]);
      setSummary(summaryResp);
      setLeads(leadsResp.leads || []);
      setTotal(leadsResp.total || 0);
      if (drawerLeadId) {
        await loadDrawerLead(drawerLeadId);
      }
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to load Sales CRM.");
    } finally {
      setLoading(false);
    }
  }, [assignedRepId, callbackState, drawerLeadId, flagFilter, loadDrawerLead, outcomeFilter, page, perPage, query, showBanner, sortBy, sortDir, sourceFilter, status]);

  useEffect(() => {
    loadStatic();
  }, [loadStatic]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const repLabelById = useMemo(() => {
    const map = {};
    reps.forEach((rep) => {
      map[String(rep.id)] = rep.full_name;
    });
    return map;
  }, [reps]);

  const rows = useMemo(
    () =>
      leads.map((lead) => ({
        ...lead,
        assigned_rep_id: lead.assigned_rep_id ? repLabelById[String(lead.assigned_rep_id)] || `Rep #${lead.assigned_rep_id}` : null,
      })),
    [leads, repLabelById]
  );

  const statusOptions = useMemo(() => {
    const values = new Set(rows.map((lead) => lead.status).filter(Boolean));
    return Array.from(values);
  }, [rows]);
  const sourceOptions = useMemo(() => {
    const values = new Set(leads.map((lead) => (lead.source || "").trim()).filter(Boolean));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [leads]);
  const outcomeOptions = useMemo(() => {
    const values = new Set(leads.map((lead) => (lead.last_outcome || "").trim()).filter(Boolean));
    [
      "no_answer",
      "busy",
      "voicemail",
      "wrong_number",
      "interested",
      "call_back_later",
      "booked_demo",
      "not_interested",
      "do_not_call",
      "already_subscribed",
      "duplicate",
    ].forEach((value) => values.add(value));
    return Array.from(values);
  }, [leads]);

  useEffect(() => {
    setPage(0);
  }, [query, status, assignedRepId, sourceFilter, flagFilter, outcomeFilter, callbackState, perPage, sortBy, sortDir]);

  const openLeadWorkspace = useCallback(async (leadId, meta = {}) => {
    setDrawerLeadId(leadId);
    setActionState(emptyActionState);
    setDrawerMeta({
      tab: meta.tab || "overview",
      editMode: Boolean(meta.editMode),
    });
    try {
      await loadDrawerLead(leadId);
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to load lead details.");
    }
  }, [loadDrawerLead, showBanner]);

  const handleCreateLead = async () => {
    setSubmitting(true);
    try {
      const payload = {
        ...createForm,
        priority: Number(createForm.priority || 0),
        assigned_rep_id: createForm.assigned_rep_id ? Number(createForm.assigned_rep_id) : undefined,
      };
      await createLead(payload);
      setCreateOpen(false);
      setCreateForm(emptyForm);
      showBanner("success", "Lead created.");
      await loadPage();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to create lead.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignSelected = async () => {
    setSubmitting(true);
    try {
      if (selectedIds.length > 1) {
        await bulkAssignLeads({ sales_rep_id: Number(assignRepId), lead_ids: selectedIds, reason: assignReason || undefined });
      } else if (selectedIds.length === 1) {
        await assignLead(selectedIds[0], { sales_rep_id: Number(assignRepId), reason: assignReason || undefined });
      } else if (drawerLeadId) {
        await assignLead(drawerLeadId, { sales_rep_id: Number(assignRepId), reason: assignReason || undefined });
      }
      setAssignOpen(false);
      setAssignDialogTitle("Assign lead");
      setAssignRepId("");
      setAssignReason("");
      setSelectedIds([]);
      showBanner("success", "Lead assignment updated.");
      await loadPage();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to assign lead.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImportLeads = async () => {
    if (!importForm.file) return;
    setImporting(true);
    try {
      const result = await importLeads(importForm);
      setImportForm(emptyImportForm);
      setImportBatches((prev) => [result?.batch, ...prev.filter((row) => row?.id !== result?.batch?.id)].filter(Boolean));
      showBanner(
        "success",
        `Imported ${result?.batch?.imported_count || 0} leads, marked ${result?.batch?.duplicate_count || 0} duplicate, suppressed ${result?.batch?.suppressed_count || 0}.`
      );
      await loadPage();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to import leads.");
    } finally {
      setImporting(false);
    }
  };

  const handleCallModeChange = (mode) => {
    if (mode === "protected_twilio") {
      setCallSettings({
        crm_call_mode: "protected_twilio",
        crm_phone_visibility: "masked",
        crm_call_provider: "twilio",
        crm_rep_call_flow: "twilio_bridge",
      });
      return;
    }
    setCallSettings(defaultCallSettings);
  };

  const handleRefreshTwilioStatus = async () => {
    try {
      const statusResp = await getSalesTwilioStatus();
      setTwilioStatus(statusResp || { configured: false, provider: "twilio", missing_config_fields: [] });
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to refresh Twilio status.");
    }
  };

  const handleSaveCallSettings = async () => {
    setSavingCallSettings(true);
    try {
      const resp = await saveSalesCallSettings(callSettings);
      setCallSettings(resp?.settings || defaultCallSettings);
      setTwilioStatus(resp?.twilio_status || { configured: false, provider: "twilio", missing_config_fields: [] });
      showBanner("success", "Calling workflow updated.");
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Failed to save calling workflow.");
    } finally {
      setSavingCallSettings(false);
    }
  };

  const executeLeadAction = useCallback(async (type, { leadId = drawerLeadId, leadIds = [] } = {}) => {
    if (!leadId && !leadIds.length) return;
    setSubmitting(true);
    try {
      if (type === "suppress") {
        await suppressLead(leadId, { reason: actionState.suppressReason || undefined });
      } else if (type === "duplicate") {
        await markLeadDuplicate(leadId, {
          duplicate_of_lead_id: actionState.duplicateOfLeadId ? Number(actionState.duplicateOfLeadId) : undefined,
        });
      } else if (type === "convert") {
        await convertLead(leadId, {
          company_id: actionState.convertCompanyId ? Number(actionState.convertCompanyId) : undefined,
          sales_deal_id: actionState.convertSalesDealId ? Number(actionState.convertSalesDealId) : undefined,
          note: actionState.convertNote || undefined,
        });
      } else if (type === "restore") {
        await restoreLead(leadId);
      } else if (type === "unassign") {
        if (leadIds.length) {
          await Promise.all(leadIds.map((id) => unassignLead(id, { reason: "bulk_unassign" })));
          setSelectedIds([]);
        } else {
          await unassignLead(leadId, { reason: "admin_unassign" });
        }
      } else if (type === "unlock") {
        await unlockLead(leadId, { note: "admin_unlock" });
      } else if (type === "delete") {
        await deleteLead(leadId);
        if (drawerLeadId === leadId) {
          setDrawerLeadId(null);
          setDrawerLead(null);
          setDrawerAssignments([]);
          setDrawerLockInfo(null);
          setDrawerActivity([]);
        }
      } else if (type === "bulk_suppress") {
        await Promise.all(leadIds.map((id) => suppressLead(id, { reason: "bulk_suppress" })));
        setSelectedIds([]);
      } else if (type === "bulk_delete") {
        const result = await bulkDeleteLeads({ lead_ids: leadIds });
        setSelectedIds([]);
        if (result?.blocked?.length) {
          showBanner(
            "warning",
            `Deleted ${result.deleted_ids?.length || 0} lead(s). ${result.blocked.length} could not be deleted because they are linked or subscribed.`
          );
          await loadPage();
          return;
        }
      }

      setActionState(emptyActionState);
      showBanner("success", "Lead updated.");
      await loadPage();
    } catch (error) {
      showBanner("error", error?.response?.data?.error || "Lead action failed.");
    } finally {
      setSubmitting(false);
    }
  }, [actionState, drawerLeadId, loadPage, showBanner]);

  const openConfirm = useCallback((config) => {
    setConfirmAction(config);
  }, []);

  const handleDrawerAction = (type) => {
    const config = {
      suppress: {
        title: "Suppress lead",
        body: "This will remove the lead from active outreach queues. Continue?",
        leadId: drawerLeadId,
      },
      duplicate: {
        title: "Mark lead as duplicate",
        body: "This will mark the lead as duplicate and remove it from active outreach queues. Continue?",
        leadId: drawerLeadId,
      },
      convert: {
        title: "Convert lead",
        body: "This will mark the lead as converted and optionally link it to a company or deal. Continue?",
        leadId: drawerLeadId,
      },
      restore: {
        title: "Restore lead",
        body: "This will return the lead to an active queue state when it is safe to do so. Continue?",
        leadId: drawerLeadId,
      },
      unassign: {
        title: "Unassign lead",
        body: "This will take the lead back from the current rep and return it to the admin pool. Continue?",
        leadId: drawerLeadId,
      },
      unlock: {
        title: "Force unlock lead",
        body: "This clears the current rep lock while keeping assignment in place. Continue?",
        leadId: drawerLeadId,
      },
      delete: {
        title: "Delete lead",
        body: "This permanently removes the lead if it has no linked subscription or sales-deal conversion. Continue?",
        leadId: drawerLeadId,
      },
    }[type];
    if (!config) return;
    openConfirm({ type, ...config, leadIds: [] });
  };

  const handleRowAction = useCallback((type, leadId) => {
    if (!leadId) return;
    if (type === "view") {
      openLeadWorkspace(leadId, { tab: "overview", editMode: false });
      return;
    }
    if (type === "edit") {
      openLeadWorkspace(leadId, { tab: "overview", editMode: true });
      return;
    }
    if (type === "assign") {
      setSelectedIds([leadId]);
      setAssignDialogTitle("Assign lead");
      setAssignOpen(true);
      return;
    }
    if (type === "suppress" || type === "restore" || type === "duplicate") {
      openLeadWorkspace(leadId, { tab: "queue", editMode: false });
      if (type !== "duplicate") {
        openConfirm({
          type,
          title: type === "suppress" ? "Suppress lead" : "Restore lead",
          body:
            type === "suppress"
              ? "This will remove the lead from active outreach queues. Continue?"
              : "This will return the lead to an active queue state when it is safe to do so. Continue?",
          leadId,
          leadIds: [],
        });
      }
      return;
    }
    if (type === "unassign") {
      openConfirm({
        type,
        title: "Unassign lead",
        body: "This will take the lead back from the current rep and return it to the admin pool. Continue?",
        leadId,
        leadIds: [],
      });
      return;
    }
    if (type === "delete") {
      openConfirm({
        type,
        title: "Delete lead",
        body: "This permanently removes the lead if it has no linked subscription or sales-deal conversion. Continue?",
        leadId,
        leadIds: [],
      });
    }
  }, [openConfirm, openLeadWorkspace]);

  const handleBulkUnassign = () => {
    if (!selectedIds.length) return;
    openConfirm({
      type: "unassign",
      title: "Bulk unassign leads",
      body: `Unassign ${selectedIds.length} selected leads and return them to the admin pool?`,
      leadId: null,
      leadIds: selectedIds,
    });
  };

  const handleBulkSuppress = () => {
    if (!selectedIds.length) return;
    openConfirm({
      type: "bulk_suppress",
      title: "Bulk suppress leads",
      body: `Suppress ${selectedIds.length} selected leads and remove them from active outreach queues?`,
      leadId: null,
      leadIds: selectedIds,
    });
  };

  const handleBulkDelete = () => {
    if (!selectedIds.length) return;
    openConfirm({
      type: "bulk_delete",
      title: "Bulk delete leads",
      body: `Delete ${selectedIds.length} selected leads? Linked, converted, or subscribed leads will be skipped automatically.`,
      leadId: null,
      leadIds: selectedIds,
    });
  };

  return (
    <Box>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Sales CRM</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Lead queue, assignment, duplicate control, conversion tracking, and recovery actions for platform sales operations.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="text" startIcon={<HelpOutlineOutlinedIcon />} onClick={() => setGuideOpen(true)}>Guide</Button>
          <Button variant="outlined" onClick={loadPage}>Refresh</Button>
          <Button variant="contained" onClick={() => setCreateOpen(true)}>Create Lead</Button>
        </Stack>
      </Stack>

      <Stack spacing={3}>
        <LeadSummaryCards summary={summary} />

        <Paper sx={{ p: 2.5 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between">
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Calling Workflow</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Control whether reps work in legacy direct-call mode or protected Twilio mode without changing admin lead visibility.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  size="small"
                  color={twilioStatus?.configured ? "success" : "warning"}
                  label={twilioStatus?.configured ? "Twilio configured" : "Twilio not configured"}
                />
                <Button variant="outlined" onClick={handleRefreshTwilioStatus}>Refresh status</Button>
              </Stack>
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                select
                label="Call mode"
                value={callSettings.crm_call_mode || "legacy"}
                onChange={(e) => handleCallModeChange(e.target.value)}
                sx={{ minWidth: 220 }}
                disabled={loadingCallSettings || savingCallSettings}
              >
                <MenuItem value="legacy">Legacy direct-call mode</MenuItem>
                <MenuItem value="protected_twilio">Protected Twilio mode</MenuItem>
              </TextField>
              <TextField
                label="Phone visibility"
                value={callSettings.crm_phone_visibility || "full"}
                InputProps={{ readOnly: true }}
                sx={{ minWidth: 180 }}
              />
              <TextField
                label="Provider"
                value={callSettings.crm_call_provider || "manual"}
                InputProps={{ readOnly: true }}
                sx={{ minWidth: 160 }}
              />
              <TextField
                label="Rep call flow"
                value={callSettings.crm_rep_call_flow || "manual"}
                InputProps={{ readOnly: true }}
                sx={{ minWidth: 180 }}
              />
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Button variant="contained" onClick={handleSaveCallSettings} disabled={loadingCallSettings || savingCallSettings}>
                  {savingCallSettings ? "Saving…" : "Save workflow"}
                </Button>
              </Box>
            </Stack>

            <Alert severity={twilioStatus?.configured ? "info" : "warning"} variant="outlined">
              {callSettings.crm_call_mode === "protected_twilio" ? (
                twilioStatus?.configured
                  ? "Protected mode is active. Admins keep full lead visibility while reps see masked numbers and place calls through Twilio."
                  : `Protected mode is selected, but Twilio is not fully configured. Missing: ${(twilioStatus?.missing_config_fields || []).join(", ") || "configuration values"}.`
              ) : (
                "Legacy mode is active. Reps continue to see full phone numbers and call outside the system."
              )}
            </Alert>
          </Stack>
        </Paper>

        <LeadImportCard
          reps={reps}
          value={importForm}
          onChange={(field, value) => setImportForm((prev) => ({ ...prev, [field]: value }))}
          onImport={handleImportLeads}
          importing={importing}
          batches={importBatches}
        />

        <Paper sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
            <TextField fullWidth label="Search company, contact, email, phone, website" value={query} onChange={(e) => setQuery(e.target.value)} />
            <TextField select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 180 }}>
              <MenuItem value="">All statuses</MenuItem>
              {statusOptions.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Assigned rep" value={assignedRepId} onChange={(e) => setAssignedRepId(e.target.value)} sx={{ minWidth: 220 }}>
              <MenuItem value="">All reps</MenuItem>
              {reps.map((rep) => (
                <MenuItem key={rep.id} value={rep.id}>{rep.full_name}</MenuItem>
              ))}
            </TextField>
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField select label="Source" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} sx={{ minWidth: 180 }}>
              <MenuItem value="">All sources</MenuItem>
              {sourceOptions.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Flags" value={flagFilter} onChange={(e) => setFlagFilter(e.target.value)} sx={{ minWidth: 180 }}>
              <MenuItem value="">All flags</MenuItem>
              <MenuItem value="assigned">Assigned</MenuItem>
              <MenuItem value="unassigned">Unassigned</MenuItem>
              <MenuItem value="subscribed">Subscribed</MenuItem>
              <MenuItem value="duplicate">Duplicate</MenuItem>
              <MenuItem value="do_not_call">Do not call</MenuItem>
            </TextField>
            <TextField select label="Outcome" value={outcomeFilter} onChange={(e) => setOutcomeFilter(e.target.value)} sx={{ minWidth: 200 }}>
              <MenuItem value="">All outcomes</MenuItem>
              {outcomeOptions.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Callback" value={callbackState} onChange={(e) => setCallbackState(e.target.value)} sx={{ minWidth: 180 }}>
              <MenuItem value="">Any callback state</MenuItem>
              <MenuItem value="due">Due now</MenuItem>
              <MenuItem value="scheduled">Scheduled</MenuItem>
              <MenuItem value="none">No callback</MenuItem>
            </TextField>
            <TextField select label="Sort by" value={sortBy} onChange={(e) => setSortBy(e.target.value)} sx={{ minWidth: 180 }}>
              <MenuItem value="created_at">Created</MenuItem>
              <MenuItem value="updated_at">Updated</MenuItem>
              <MenuItem value="callback_at">Callback</MenuItem>
              <MenuItem value="priority">Priority</MenuItem>
              <MenuItem value="company_name">Company</MenuItem>
              <MenuItem value="status">Status</MenuItem>
              <MenuItem value="assigned_at">Assigned at</MenuItem>
            </TextField>
            <TextField select label="Direction" value={sortDir} onChange={(e) => setSortDir(e.target.value)} sx={{ minWidth: 150 }}>
              <MenuItem value="desc">Newest first</MenuItem>
              <MenuItem value="asc">Oldest first</MenuItem>
            </TextField>
          </Stack>
        </Paper>

        <LeadBulkAssignBar
          count={selectedIds.length}
          onAssign={() => {
            setAssignDialogTitle(selectedIds.length > 1 ? "Bulk assign leads" : "Assign lead");
            setAssignOpen(true);
          }}
          onUnassign={handleBulkUnassign}
          onSuppress={handleBulkSuppress}
          onDelete={handleBulkDelete}
          onClear={() => setSelectedIds([])}
          disabled={submitting}
        />

        <LeadListTable
          leads={rows}
          total={total}
          loading={loading}
          selectedIds={selectedIds}
          onToggleSelect={(leadId) =>
            setSelectedIds((prev) => (prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId]))
          }
          onToggleSelectAll={() => {
            if (rows.length && rows.every((lead) => selectedIds.includes(lead.id))) {
              setSelectedIds([]);
            } else {
              setSelectedIds(rows.map((lead) => lead.id));
            }
          }}
          onOpenLead={(leadId) => openLeadWorkspace(leadId, { tab: "overview", editMode: false })}
          onCreateLead={() => setCreateOpen(true)}
          onRowAction={handleRowAction}
          page={page}
          perPage={perPage}
          onPageChange={setPage}
          onPerPageChange={(value) => {
            setPerPage(value);
            setPage(0);
          }}
        />
      </Stack>

      <LeadCreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateLead}
        form={createForm}
        reps={reps}
        submitting={submitting}
        onChange={(field, value) => setCreateForm((prev) => ({ ...prev, [field]: value }))}
      />

      <LeadAssignDialog
        open={assignOpen}
        onClose={() => {
          setAssignOpen(false);
          setAssignDialogTitle("Assign lead");
          setAssignRepId("");
          setAssignReason("");
        }}
        onSubmit={handleAssignSelected}
        reps={reps}
        value={assignRepId}
        reason={assignReason}
        onRepChange={setAssignRepId}
        onReasonChange={setAssignReason}
        count={selectedIds.length || (drawerLeadId ? 1 : 0)}
        submitting={submitting}
        title={assignDialogTitle}
      />

      <LeadDetailDrawer
        open={Boolean(drawerLeadId)}
        onClose={() => {
          setDrawerLeadId(null);
          setDrawerLead(null);
          setDrawerAssignments([]);
          setDrawerActivity([]);
          setDrawerLockInfo(null);
          setActionState(emptyActionState);
          setDrawerMeta(emptyDrawerMeta);
        }}
        lead={drawerLead}
        assignments={drawerAssignments}
        lockInfo={drawerLockInfo}
        activity={drawerActivity}
        reps={reps}
        onAssign={() => {
          setAssignDialogTitle(drawerLead?.assigned_rep_id ? "Reassign lead" : "Assign lead");
          setAssignOpen(true);
        }}
        onUnassign={() => handleDrawerAction("unassign")}
        onUnlock={() => handleDrawerAction("unlock")}
        onRestore={() => handleDrawerAction("restore")}
        onDelete={() => handleDrawerAction("delete")}
        onSuppress={() => handleDrawerAction("suppress")}
        onMarkDuplicate={() => handleDrawerAction("duplicate")}
        onConvert={() => handleDrawerAction("convert")}
        onSaveEdit={async (payload) => {
          if (!drawerLeadId) return;
          setSubmitting(true);
          try {
            await updateLead(drawerLeadId, payload);
            showBanner("success", "Lead updated.");
            await loadPage();
          } catch (error) {
            showBanner("error", error?.response?.data?.error || "Failed to update lead.");
          } finally {
            setSubmitting(false);
          }
        }}
        actionState={actionState}
        onActionStateChange={(field, value) => setActionState((prev) => ({ ...prev, [field]: value }))}
        onRunAction={handleDrawerAction}
        initialTab={drawerMeta.tab}
        initialEditMode={drawerMeta.editMode}
      />

      <Snackbar open={Boolean(banner.message)} autoHideDuration={4000} onClose={() => setBanner({ type: "success", message: "" })}>
        <Alert severity={banner.type} onClose={() => setBanner({ type: "success", message: "" })} sx={{ width: "100%" }}>
          {banner.message}
        </Alert>
      </Snackbar>

      <Dialog open={Boolean(confirmAction.type)} onClose={() => setConfirmAction(emptyConfirmAction)} maxWidth="xs" fullWidth>
        <DialogTitle>{confirmAction.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirmAction.body}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmAction(emptyConfirmAction)}>Cancel</Button>
          <Button
            variant="contained"
            color={confirmAction.type === "convert" ? "success" : confirmAction.type === "delete" ? "error" : "warning"}
            onClick={async () => {
              const current = confirmAction;
              setConfirmAction(emptyConfirmAction);
              await executeLeadAction(current.type, { leadId: current.leadId, leadIds: current.leadIds });
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Drawer
        anchor="right"
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        sx={{
          "& .MuiDrawer-paper": {
            top: topOffset,
            height: {
              xs: "calc(100% - 56px)",
              sm: "calc(100% - 64px)",
            },
          },
        }}
      >
        <Box sx={{ width: { xs: 320, md: 420 }, p: 3 }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>Sales CRM Guide</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Use this workspace to control assignment, queue recovery, and conversion hygiene without leaving the admin console.
              </Typography>
            </Box>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>What you can filter</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {["Search", "Status", "Assigned rep", "Source", "Flags", "Callback state", "Sort"].map((label) => (
                  <Chip key={label} size="small" label={label} variant="outlined" />
                ))}
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                Search supports company, contact, email, phone, website, source, city, country, and direct lead ID lookups.
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Admin override actions</Typography>
              <Stack spacing={1}>
                <Typography variant="body2">Assign or reassign ownership to the right rep.</Typography>
                <Typography variant="body2">Unassign a lead to return it to the shared admin pool.</Typography>
                <Typography variant="body2">Force unlock when a rep abandons a lead lock.</Typography>
                <Typography variant="body2">Suppress, restore, mark duplicate, convert, or delete when the record is safe.</Typography>
              </Stack>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Bulk actions</Typography>
              <Typography variant="body2" color="text.secondary">
                Bulk assign, unassign, suppress, or delete selected leads. Bulk delete automatically skips linked or subscribed records.
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Lock and queue safety</Typography>
              <Typography variant="body2" color="text.secondary">
                The drawer shows current assignment, lock owner, lock age, callback timing, and conversion links so admins can recover stuck leads without breaking attribution.
              </Typography>
            </Paper>
          </Stack>
        </Box>
      </Drawer>
    </Box>
  );
}
