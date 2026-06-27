import React from "react";
import { Alert, Button, Chip, Divider, List, ListItem, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";

export default function EmailSdrHotLeadsSection({
  hotLeads = [],
  reps = [],
  myHotLeadsOnly = false,
  setMyHotLeadsOnly,
  onOpenLead,
  onAssign,
  onNextAction,
  onSnooze,
  onContacted,
  onCreateDeal,
  onClose,
}) {
  return (
    <Paper sx={{ p: 2.5 }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Hot Leads Queue</Typography>
          <Chip
            size="small"
            variant={myHotLeadsOnly ? "filled" : "outlined"}
            label="My Hot Leads"
            onClick={() => setMyHotLeadsOnly((prev) => !prev)}
          />
        </Stack>
        {!hotLeads.length ? (
          <Alert severity="info" variant="outlined">No hot leads yet. Positive replies will surface here for manual follow-up.</Alert>
        ) : (
          <List disablePadding>
            {hotLeads.map((lead) => (
              <React.Fragment key={lead.id}>
                <ListItem disableGutters sx={{ py: 1.25, alignItems: "flex-start" }}>
                  <Stack spacing={1.25} sx={{ width: "100%" }}>
                    <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                      <BoxLike lead={lead} />
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Button variant="outlined" size="small" onClick={() => onOpenLead?.(lead.id)}>Open lead</Button>
                        <Button variant="outlined" size="small" onClick={() => onAssign?.(lead.id, lead.assigned_rep_id || reps[0]?.id)}>Assign owner</Button>
                        <Button variant="outlined" size="small" onClick={() => onContacted?.(lead.id)}>Mark contacted</Button>
                        <Button variant="outlined" size="small" onClick={() => onCreateDeal?.(lead.id)}>Create deal</Button>
                        <Button variant="text" size="small" color="error" onClick={() => onClose?.(lead.id)}>Close</Button>
                      </Stack>
                    </Stack>
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
                  </Stack>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </Stack>
    </Paper>
  );
}

function BoxLike({ lead }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{lead.company_name}</Typography>
      <Typography variant="body2" color="text.secondary">
        {lead.contact_name || "No contact"} • {lead.email || "No email"} • {lead.reply_status || lead.email_outreach_status}
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Chip size="small" variant="outlined" label={`Owner: ${lead.hot_lead_owner_name || "Unassigned"}`} />
        <Chip size="small" variant="outlined" label={`Status: ${lead.hot_lead_status || "new"}`} />
        {lead.hot_lead_overdue ? <Chip size="small" color="warning" variant="outlined" label="Overdue next action" /> : null}
        {lead.hot_lead_snooze_until ? <Chip size="small" variant="outlined" label={`Snoozed until ${new Date(lead.hot_lead_snooze_until).toLocaleDateString()}`} /> : null}
      </Stack>
      {lead.hot_lead_notes ? <Typography variant="caption" color="text.secondary">{lead.hot_lead_notes}</Typography> : null}
    </Stack>
  );
}
