import React from "react";
import { Box, Paper, Typography, List, ListItem, ListItemText } from "@mui/material";

const ZapierHelpSection = () => {
  return (
    <Box sx={{ maxWidth: 900, mb: 3 }}>
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          backgroundColor: (theme) =>
            theme.palette.mode === "light" ? "#F9FAFB" : theme.palette.background.paper,
        }}
      >
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          Zapier setup guide
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Zapier lets you connect Schedulaa to 6,000+ apps without custom builds.
        </Typography>

        <Typography variant="body2" sx={{ mb: 1 }}>
          There are two sides to the integration:
        </Typography>
        <List dense sx={{ mb: 1 }}>
          <ListItem sx={{ pl: 0 }}>
            <ListItemText
              primary={
                <Typography variant="body2">
                  <strong>Triggers (Step 1)</strong> – Schedulaa sends events to Zapier when something happens.
                  Examples: new booking, client no-show, staff clocks in, shift published, payroll finalized.
                </Typography>
              }
            />
          </ListItem>
          <ListItem sx={{ pl: 0 }}>
            <ListItemText
              primary={
                <Typography variant="body2">
                  <strong>Actions (Step 2)</strong> – Zapier creates things inside Schedulaa using your API key.
                  Examples: create booking, create employee, create/update shifts, attach signed documents.
                </Typography>
              }
            />
          </ListItem>
        </List>

        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
          Step 1 – Create a Schedulaa API key
        </Typography>
        <List dense sx={{ mb: 1 }}>
          <ListItem sx={{ pl: 0 }}>
            <ListItemText
              primary={
                <Typography variant="body2">
                  Go to Settings → Zapier. In “Step 2 – Let Zapier create things in Schedulaa”, find the “Zapier API
                  keys” card.
                </Typography>
              }
            />
          </ListItem>
          <ListItem sx={{ pl: 0 }}>
            <ListItemText
              primary={<Typography variant="body2">If you don’t already have an active key, click “Create my Zapier API key”.</Typography>}
            />
          </ListItem>
          <ListItem sx={{ pl: 0 }}>
            <ListItemText
              primary={
                <Typography variant="body2">
                  Copy the key when it appears. You’ll paste this into Zapier when you connect Schedulaa. (Keys are only
                  shown once—create a new one to rotate.)
                </Typography>
              }
            />
          </ListItem>
        </List>

        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
          Step 2 – Create a Zap trigger in Zapier (Catch Hook)
        </Typography>
        <List dense sx={{ mb: 1 }}>
          <ListItem sx={{ pl: 0 }}>
            <ListItemText primary={<Typography variant="body2">In Zapier, click Create Zap.</Typography>} />
          </ListItem>
          <ListItem sx={{ pl: 0 }}>
            <ListItemText primary={<Typography variant="body2">Choose Webhooks by Zapier → Catch Hook.</Typography>} />
          </ListItem>
          <ListItem sx={{ pl: 0 }}>
            <ListItemText primary={<Typography variant="body2">Zapier will give you a hook URL. Copy it.</Typography>} />
          </ListItem>
        </List>

        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
        Step 3 – Tell Schedulaa which event to send to that hook
        </Typography>
        <List dense sx={{ mb: 1 }}>
          <ListItem sx={{ pl: 0 }}>
            <ListItemText
              primary={
                <Typography variant="body2">
                  In Schedulaa (Settings → Zapier, Step 1), paste the Zapier hook URL into the “Zapier hook URL” field.
                  Choose an event type, for example booking.created, booking.no_show, timeclock.clock_in,
                  shift.published, or payroll.finalized.
                </Typography>
              }
            />
          </ListItem>
          <ListItem sx={{ pl: 0 }}>
            <ListItemText
              primary={
                <Typography variant="body2">
                  (Optional) Add a secret if you want Schedulaa to sign payloads using HMAC. Click Add hook.
                </Typography>
              }
            />
          </ListItem>
          <ListItem sx={{ pl: 0 }}>
            <ListItemText
              primary={
                <Typography variant="body2">
                  Trigger the event once (e.g., create a test booking). Use the Event examples box to see the JSON Zapier
                  will receive.
                </Typography>
              }
            />
          </ListItem>
        </List>

        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
          Step 4 – Add Schedulaa actions in your Zap (Zapier → Schedulaa)
        </Typography>
        <List dense sx={{ mb: 1 }}>
          <ListItem sx={{ pl: 0 }}>
            <ListItemText primary={<Typography variant="body2">In your Zap, add an Action step.</Typography>} />
          </ListItem>
          <ListItem sx={{ pl: 0 }}>
            <ListItemText
              primary={<Typography variant="body2">Choose the Schedulaa app (or your private Schedulaa Zapier app).</Typography>}
            />
          </ListItem>
          <ListItem sx={{ pl: 0 }}>
            <ListItemText
              primary={
                <Typography variant="body2">
                  When asked to connect, paste the API key you created in Step 1. Pick an action (create booking,
                  create employee, create/update shift, attach document). Map fields from your trigger. Use the Action
                  examples box for sample bodies.
                </Typography>
              }
            />
          </ListItem>
        </List>

        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
          Example: onboarding Zap
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          1) Add a new employee and click “Send via Zapier”. 2) Schedulaa sends <code>onboarding.started</code>. 3)
          Zapier sends docs via your e-sign tool. 4) When signed, Zapier calls the attach_document action with your API
          key. 5) The signed PDF appears in the employee’s Documents tab.
        </Typography>

        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
          Security notes
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Treat Zapier API keys like passwords. Rotate/revoke keys if needed. For sensitive workflows, use the “Secret
          (optional)” on event hooks and verify signatures in Zapier using HMAC.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          <strong>Advanced: Payroll details.</strong> If you need full payroll rows in your own system (one row per
          employee with hours, gross, net, and taxes), subscribe to the “When payroll details are ready (one row per
          employee)” event. Schedulaa will send the same data you see in Payroll → Payroll Detail / Raw Data to your
          Zapier hook as JSON.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          <strong>For accountants:</strong> Use the <code>payroll.details</code> event to send per-employee payroll rows
          into Google Sheets, Excel, or BI tools. Combine this with QuickBooks or Xero journals for full reconciliation
          and management reporting.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Mapping and posting to ledgers happens in the QuickBooks and Xero tabs under Workspace Settings. Zapier is
          your automation and analytics layer on top.
        </Typography>
      </Paper>
    </Box>
  );
};

export default ZapierHelpSection;
