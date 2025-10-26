import React from "react";
import { Box, Typography, Stack, Button } from "@mui/material";
import Meta from "../../../components/Meta";

const DataProcessingAddendumPage = () => (
  <Box sx={{ px: { xs: 2, md: 6 }, py: { xs: 10, md: 12 }, maxWidth: 900, mx: "auto" }}>
    <Meta
      title="Schedulaa Data Processing Addendum"
      description="Summary of Schedulaa’s data processing obligations for controllers using the platform."
      canonical="https://www.schedulaa.com/data-processing"
    />
    <Stack spacing={3}>
      <Typography variant="h3" component="h1" fontWeight={800}>
        Data Processing Addendum Summary
      </Typography>
      <Stack spacing={2}>
        <Typography variant="h5" component="h2">1. Purpose</Typography>
        <Typography variant="body1" color="text.secondary">
          Outlines our GDPR-compliant data processing obligations when you (the Controller) use Schedulaa (the Processor).
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5">2. Scope</Typography>
        <Typography variant="body1" color="text.secondary">
          We process personal data (employees, clients) on your behalf for bookings, payroll, and scheduling tasks.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5">3. Processor obligations</Typography>
        <Typography variant="body1" color="text.secondary">
          Process data only per your instructions, maintain confidentiality and security controls, assist with data subject requests and breach notifications, engage sub-processors under similar obligations, and provide audit rights under reasonable requests.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5">4. Controller obligations</Typography>
        <Typography variant="body1" color="text.secondary">
          Ensure a lawful basis for processing, configure Schedulaa appropriately, and respond to subject requests.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5">5. International transfers</Typography>
        <Typography variant="body1" color="text.secondary">
          Transfers outside the EEA rely on Standard Contractual Clauses or equivalent safeguards.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5">6. Termination</Typography>
        <Typography variant="body1" color="text.secondary">
          Upon request, we delete or return personal data at the end of the services.
        </Typography>
      </Stack>
      <Typography variant="body1" color="text.secondary">
        Full signed DPA available on request: privacy@schedulaa.com.
      </Typography>
      <Button
        variant="outlined"
        color="primary"
        component="a"
        href="mailto:privacy@schedulaa.com?subject=Schedulaa%20DPA%20Request"
        sx={{ alignSelf: { xs: "stretch", sm: "flex-start" }, textTransform: "none", borderRadius: 999, px: 4 }}
      >
        Request Full DPA
      </Button>
    </Stack>
  </Box>
);

export default DataProcessingAddendumPage;
