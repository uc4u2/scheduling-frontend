import React from "react";
import { Alert, Button, Divider, List, ListItem, ListItemText, Paper, Stack, Typography } from "@mui/material";

export default function EmailSdrCampaignReviewSection({ rows = [], onOpenLead, onApproveDrafts, onTakeNext }) {
  return (
    <Paper sx={{ p: 2.5 }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Campaigns Needing Review</Typography>
          {rows.length ? <Button size="small" variant="outlined" onClick={onTakeNext}>Take next unresolved</Button> : null}
        </Stack>
        {!rows.length ? (
          <Alert severity="success" variant="outlined">No campaigns currently need review.</Alert>
        ) : (
          <List disablePadding>
            {rows.map((row) => (
              <React.Fragment key={`review-campaign-${row.campaign.id}`}>
                <ListItem disableGutters sx={{ py: 1.25, alignItems: "flex-start" }}>
                  <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1} sx={{ width: "100%" }}>
                    <ListItemText
                      primary={row.campaign.name}
                      secondary={`${row.campaign.status} • ${row.issues.join(", ")}`}
                    />
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="outlined" onClick={() => onOpenLead?.(row.campaign.id)}>Open campaign</Button>
                      <Button size="small" variant="outlined" onClick={() => onApproveDrafts?.(row.campaign.id)}>Approve drafts</Button>
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
