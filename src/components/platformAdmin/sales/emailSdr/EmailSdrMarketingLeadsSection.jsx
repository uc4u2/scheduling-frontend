import React from "react";
import { Alert, Button, Chip, Divider, List, ListItem, Paper, Stack, Switch, Typography } from "@mui/material";

export default function EmailSdrMarketingLeadsSection({ leads = [], consentOnly, setConsentOnly, onOpenLead }) {
  return (
    <Paper sx={{ p: 2.5 }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
          <BoxTitle />
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption">Consent only</Typography>
            <Switch checked={consentOnly} onChange={(e) => setConsentOnly(e.target.checked)} />
          </Stack>
        </Stack>
        {!leads.length ? (
          <Alert severity="info" variant="outlined">No marketing widget leads match the current filter.</Alert>
        ) : (
          <List disablePadding>
            {leads.slice(0, 20).map((lead) => (
              <React.Fragment key={`marketing-lead-${lead.id}`}>
                <ListItem disableGutters sx={{ py: 1.25, alignItems: "flex-start" }}>
                  <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1} sx={{ width: "100%" }}>
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{lead.company_name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {lead.contact_name || "No contact"} • {lead.business_type || "Unknown type"} • {lead.city || "No city"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {lead.email || "No email"}{lead.phone ? ` • ${lead.phone}` : ""} • CRM: {lead.current_crm || "Unknown"}
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip size="small" color={lead.consent_to_contact ? "success" : "default"} label={lead.consent_to_contact ? "Explicit opt-in" : "Stored only"} />
                        {(lead.routing_suggestion?.matched_rule_name || lead.routing_suggestion?.suggested_campaign_id || lead.routing_suggestion?.suggested_template_id) ? (
                          <Chip
                            size="small"
                            variant="outlined"
                            label={lead.routing_suggestion?.matched_rule_name ? `Rule: ${lead.routing_suggestion.matched_rule_name}` : "Suggested next step"}
                          />
                        ) : null}
                      </Stack>
                    </Stack>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Button variant="outlined" size="small" onClick={() => onOpenLead?.(lead.id)}>Open Lead</Button>
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

function BoxTitle() {
  return (
    <Stack spacing={0.5}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Marketing Chatbot Leads</Typography>
      <Typography variant="body2" color="text.secondary">
        Leads captured from the separate marketing-site lead widget. These can be segmented, added to campaigns, or handled manually.
      </Typography>
    </Stack>
  );
}
