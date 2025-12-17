// Collapsed help: Zapier setup + payroll finance automation + templates
import React from "react";
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const ZapierHelpSection = () => {
  return (
    <Accordion defaultExpanded={false} disableGutters elevation={0}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle2" fontWeight={700}>
          Zapier setup guide & examples
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 2 }}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 3,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            backgroundColor: (theme) =>
              theme.palette.mode === "light" ? "#F9FAFB" : theme.palette.background.paper,
          }}
        >
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
                    <strong>Triggers</strong> – Schedulaa sends events to Zapier when something happens. Examples: new booking,
                    client no-show, staff clocks in, shift published, payroll finalized.
                  </Typography>
                }
              />
            </ListItem>
            <ListItem sx={{ pl: 0 }}>
              <ListItemText
                primary={
                  <Typography variant="body2">
                    <strong>Actions</strong> – Zapier creates things inside Schedulaa using your API key. Examples: create booking,
                    create employee, create/update shifts, attach signed documents.
                  </Typography>
                }
              />
            </ListItem>
          </List>

          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
            Step 0 – Create a Schedulaa API key
          </Typography>
          <List dense sx={{ mb: 1 }}>
            <ListItem sx={{ pl: 0 }}>
              <ListItemText
                primary={
                  <Typography variant="body2">
                    Go to the Zapier tab. In the “Zapier API keys” card, create or copy your key. Paste this into Zapier when you
                    connect Schedulaa. Keys are only shown once—create a new one to rotate.
                  </Typography>
                }
              />
            </ListItem>
          </List>

          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
            Step 1 – Create a Zap trigger in Zapier (Catch Hook)
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
            Step 2 – Tell Schedulaa which event to send to that hook
          </Typography>
          <List dense sx={{ mb: 1 }}>
            <ListItem sx={{ pl: 0 }}>
              <ListItemText
                primary={
                  <Typography variant="body2">
                    In the Zapier tab (Event hooks), paste the Zapier hook URL and choose an event: booking.created, booking.no_show,
                    timeclock.clock_in, shift.published, payroll.finalized, payroll.details, payroll.payment_requested.
                  </Typography>
                }
              />
            </ListItem>
            <ListItem sx={{ pl: 0 }}>
              <ListItemText
                primary={
                  <Typography variant="body2">
                    (Optional) Add a secret if you want Schedulaa to sign payloads using HMAC. Click Add hook. Trigger the event once to
                    see JSON in your Catch Hook.
                  </Typography>
                }
              />
            </ListItem>
          </List>

          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
            Step 3 – Add actions in Zapier (Zapier → Schedulaa)
          </Typography>
          <List dense sx={{ mb: 1 }}>
            <ListItem sx={{ pl: 0 }}>
              <ListItemText primary={<Typography variant="body2">In your Zap, add an Action step.</Typography>} />
            </ListItem>
            <ListItem sx={{ pl: 0 }}>
              <ListItemText
                primary={
                  <Typography variant="body2">
                    Choose the Schedulaa app (or your private Schedulaa Zapier app). When asked to connect, paste the API key from Step 0.
                    Pick an action (create booking/employee/shift, attach document) and map fields.
                  </Typography>
                }
              />
            </ListItem>
          </List>

          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
            Finance automation (payroll payment_requested)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            When a manager clicks <strong>Send payroll to Zapier</strong>, Schedulaa emits <code>payroll.payment_requested</code>.
            Start your Zap with Webhooks → Catch Hook and add the hook above. Zapier can sync QuickBooks/Xero (journals), start approvals
            (Slack/Email), export CSV/SFTP, or trigger payout rails (Stripe/Wise). Optionally POST back to update status:
          </Typography>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              backgroundColor: (theme) => (theme.palette.mode === "light" ? "#fff" : "transparent"),
              mb: 1,
              fontFamily: "monospace",
            }}
          >
            <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
              POST /integrations/zapier/payroll/payment-status
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Headers: Authorization: Bearer &lt;zapier_api_key&gt;
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Status options: requested, sent_to_zapier, processing, paid, failed, rejected, canceled.
          </Typography>

          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
            Zap templates (examples)
          </Typography>
          <Stack spacing={1.5} sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              1) QuickBooks payroll journal – Trigger: Catch Hook → QuickBooks Online → Create Journal Entry. Map gross (wages),
              deductions (liabilities), net (cash). Optional: POST payment-status to mark processing/paid.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              2) Xero manual journal – Trigger: Catch Hook → Xero → Manual Journal. Map debit/credit from gross/deductions/net. Optional callback.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              3) Slack approval workflow – Trigger: Catch Hook → Formatter → Slack message with net pay/period/payslip link. Optional Approve/Reject → POST payment-status.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              4) CSV → Drive/SFTP export – Trigger: Catch Hook → Formatter to CSV → Upload to Drive/SFTP. Optional POST payment-status when processed.
            </Typography>
          </Stack>

          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
            Security notes
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Treat Zapier API keys like passwords. Rotate/revoke keys if needed. For sensitive workflows, use the “Secret (optional)” on event hooks and verify HMAC signatures.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Advanced: Subscribe to <code>payroll.details</code> to stream per-employee payroll rows (hours, gross, net, taxes) to Sheets/BI. Ledgers are posted via native QuickBooks/Xero; Zapier is your automation layer.
          </Typography>
        </Paper>
      </AccordionDetails>
    </Accordion>
  );
};

export default ZapierHelpSection;
