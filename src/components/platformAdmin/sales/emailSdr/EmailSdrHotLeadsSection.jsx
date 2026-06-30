import React, { useMemo, useState } from "react";
import { Accordion, AccordionDetails, AccordionSummary, Alert, Button, Chip, MenuItem, Pagination, Paper, Stack, Switch, TextField, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const PAGE_SIZE = 4;

function normalizeSearch(value) {
  return String(value || "").toLowerCase();
}

function leadSearchBlob(lead = {}) {
  return normalizeSearch([
    lead.company_name,
    lead.contact_name,
    lead.email,
    lead.reply_status,
    lead.email_outreach_status,
    lead.hot_lead_owner_name,
    lead.hot_lead_status,
    lead.hot_lead_notes,
  ].filter(Boolean).join(" "));
}

export default function EmailSdrHotLeadsSection({
  hotLeads = [],
  reps = [],
  myHotLeadsOnly = false,
  setMyHotLeadsOnly,
  onOpenLead,
  onOpenWorkspace,
  onAssign,
  onNextAction,
  onSnooze,
  onContacted,
  onCreateDeal,
  onClose,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const filteredLeads = useMemo(() => {
    const q = normalizeSearch(searchTerm);
    return hotLeads.filter((lead) => {
      if (statusFilter && (lead.hot_lead_status || "new") !== statusFilter) return false;
      if (q && !leadSearchBlob(lead).includes(q)) return false;
      return true;
    });
  }, [hotLeads, searchTerm, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE));
  const visibleLeads = filteredLeads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  React.useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, hotLeads.length]);

  React.useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  return (
    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Hot Leads Queue</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption">My hot leads</Typography>
            <Switch size="small" checked={myHotLeadsOnly} onChange={() => setMyHotLeadsOnly((prev) => !prev)} />
          </Stack>
        </Stack>
        <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5}>
          <TextField
            size="small"
            label="Search hot leads"
            placeholder="Company, contact, email, owner"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            sx={{ minWidth: { lg: 320 } }}
          />
          <TextField
            size="small"
            select
            label="Status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">All statuses</MenuItem>
            {["new", "assigned", "contacted", "snoozed", "converted", "closed"].map((status) => (
              <MenuItem key={status} value={status}>{status}</MenuItem>
            ))}
          </TextField>
        </Stack>
        {!filteredLeads.length ? (
          <Alert severity="info" variant="outlined">No hot leads yet. Positive replies will surface here for manual follow-up.</Alert>
        ) : (
          <Stack spacing={1.25}>
            {visibleLeads.map((lead) => (
              <Accordion key={lead.id} disableGutters variant="outlined" sx={{ borderRadius: 2, "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack spacing={1} sx={{ width: "100%" }}>
                    <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                      <Stack spacing={0.5}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{lead.company_name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {lead.contact_name || "No contact"} • {lead.email || "No email"} • {lead.reply_status || lead.email_outreach_status}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip size="small" variant="outlined" label={`Owner: ${lead.hot_lead_owner_name || "Unassigned"}`} />
                        <Chip size="small" variant="outlined" label={`Status: ${lead.hot_lead_status || "new"}`} />
                        {lead.hot_lead_overdue ? <Chip size="small" color="warning" variant="outlined" label="Overdue next action" /> : null}
                      </Stack>
                    </Stack>
                    {lead.hot_lead_notes ? <Typography variant="body2">{lead.hot_lead_notes}</Typography> : null}
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={1.25}>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1} useFlexGap>
                      <TextField
                        select
                        size="small"
                        label="Owner"
                        value={lead.hot_lead_owner_id || lead.assigned_rep_id || ""}
                        onChange={(e) => onAssign?.(lead.id, e.target.value)}
                        sx={{ minWidth: 220 }}
                      >
                        <MenuItem value="">None</MenuItem>
                        {reps.map((rep) => <MenuItem key={rep.id} value={rep.id}>{rep.full_name}</MenuItem>)}
                      </TextField>
                      <TextField
                        size="small"
                        type="datetime-local"
                        label="Next action"
                        value={lead.hot_lead_next_action_at ? String(lead.hot_lead_next_action_at).replace("Z", "").slice(0, 16) : ""}
                        onChange={(e) => onNextAction?.(lead.id, e.target.value ? new Date(e.target.value).toISOString() : "")}
                        InputLabelProps={{ shrink: true }}
                        sx={{ minWidth: 220 }}
                      />
                      <Button size="small" variant="outlined" onClick={() => onSnooze?.(lead.id, "tomorrow")}>Tomorrow</Button>
                      <Button size="small" variant="outlined" onClick={() => onSnooze?.(lead.id, "3_days")}>3 days</Button>
                      <Button size="small" variant="outlined" onClick={() => onSnooze?.(lead.id, "next_week")}>Next week</Button>
                    </Stack>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
                      <Button variant="outlined" size="small" onClick={() => onOpenLead?.(lead.id)}>Open lead</Button>
                      {lead.campaign_workspace_id ? (
                        <Button variant="outlined" size="small" onClick={() => onOpenWorkspace?.(lead.campaign_workspace_id)}>Open workspace</Button>
                      ) : null}
                      <Button variant="outlined" size="small" onClick={() => onContacted?.(lead.id)}>Mark contacted</Button>
                      <Button variant="outlined" size="small" onClick={() => onCreateDeal?.(lead.id)}>Create deal</Button>
                      <Button variant="text" size="small" color="error" onClick={() => onClose?.(lead.id)}>Close</Button>
                    </Stack>
                  </Stack>
                </AccordionDetails>
              </Accordion>
            ))}
            {pageCount > 1 ? (
              <Stack alignItems="flex-end">
                <Pagination size="small" page={page} count={pageCount} onChange={(_, nextPage) => setPage(nextPage)} />
              </Stack>
            ) : null}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
