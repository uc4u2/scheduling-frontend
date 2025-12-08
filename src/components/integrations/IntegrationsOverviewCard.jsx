import React from "react";
import { Paper, Typography, Stack } from "@mui/material";

const IntegrationsOverviewCard = () => (
  <Paper
    variant="outlined"
    sx={{
      p: 2,
      borderRadius: 2,
    }}
  >
    <Typography variant="subtitle1" sx={{ fontWeight: 700 }} gutterBottom>
      Schedulaa integrations overview
    </Typography>
    <Typography variant="body2" color="text.secondary" paragraph>
      Schedulaa sits at the center of your operations. Use QuickBooks or Xero for official accounting, and Zapier for automation, analytics, and workflows in over 6,000 apps.
    </Typography>
    <Stack component="ul" spacing={0.5} sx={{ pl: 2 }}>
      <Typography component="li" variant="body2">
        <strong>QuickBooks / Xero</strong> – post balanced payroll and revenue journals for accounting.
      </Typography>
      <Typography component="li" variant="body2">
        <strong>Zapier</strong> – automate bookings, timeclock, break compliance, PTO, and send detailed payroll data to Sheets, BI, CRMs, and more.
      </Typography>
    </Stack>
  </Paper>
);

export default IntegrationsOverviewCard;
