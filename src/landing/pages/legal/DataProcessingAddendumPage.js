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
        <Typography variant="body1" color="text.secondary">
          Where enabled by the Services you use, this scope may also include AI-assisted or automated processing for website-copy generation, commerce or product-draft assistance, AI sales-development or call-flow tools, message drafting, summarization, classification, routing, validation, and similar assistant or copilot workflows requested by you or your authorized users.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This scope includes security and anti-fraud processing necessary to protect the service, including login audit records, billing risk telemetry, dispute/fraud event linkage, and related operational metadata.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Depending on integration and request context, this may include limited security attributes such as IP address, user-agent, login outcome, billing attempt metadata, and approximate network location signals.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          AI-related processing may involve prompts, instructions, uploaded files, website content, product facts, lead or contact details, communication drafts, transcripts, and related business context provided through the feature.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5">3. Processor obligations</Typography>
        <Typography variant="body1" color="text.secondary">
          Process data only per your instructions, maintain confidentiality and security controls, assist with data subject requests and breach notifications, engage sub-processors under similar obligations, and provide audit rights under reasonable requests.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Sub-processors used for payments, hosting, networking/CDN, and related infrastructure may process security-relevant logs under contractual and technical safeguards appropriate to their role.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Where AI-assisted features are enabled, Schedulaa may use contracted sub-processors that provide model inference, transcription, hosting, safety, or workflow infrastructure. Such providers may process personal data only to deliver the requested feature, support security and abuse controls, maintain service reliability, and satisfy Schedulaa’s contractual or legal obligations.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Unless otherwise stated in a signed enterprise agreement or feature-specific addendum, AI-related personal data is described here as being processed to provide the requested feature and related service operations, rather than as customer authorization for third-party general-purpose model providers to use that data for their own independent model training.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5">4. Controller obligations</Typography>
        <Typography variant="body1" color="text.secondary">
          Ensure a lawful basis for processing, configure Schedulaa appropriately, and respond to subject requests.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          You are also responsible for determining whether AI-assisted or automated features are appropriate for the personal data, business process, and regulatory context involved, and for applying human review before operational use where your workflows or applicable law require it.
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
        <Typography variant="body1" color="text.secondary">
          Reasonable retention exceptions may apply for security logs, fraud investigations, billing disputes, and compliance obligations.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          The same exception may apply to AI-related prompts, transcripts, generated drafts, model-response records, and associated operational metadata where retention is reasonably necessary to provide the feature, support troubleshooting, review incidents or abuse, handle disputes, or satisfy compliance obligations.
        </Typography>
      </Stack>
      <Typography variant="body1" color="text.secondary">
        Full signed DPA available on request: admin@schedulaa.com.
      </Typography>
      <Button
        variant="outlined"
        color="primary"
        component="a"
        href="mailto:admin@schedulaa.com?subject=Schedulaa%20DPA%20Request"
        sx={{ alignSelf: { xs: "stretch", sm: "flex-start" }, textTransform: "none", borderRadius: 999, px: 4 }}
      >
        Request Full DPA
      </Button>
    </Stack>
  </Box>
);

export default DataProcessingAddendumPage;
