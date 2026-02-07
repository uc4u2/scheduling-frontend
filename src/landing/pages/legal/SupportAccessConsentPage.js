import React from "react";
import { Box, Container, Stack, Typography } from "@mui/material";

const SupportAccessConsentPage = () => {
  return (
    <Box sx={{ py: { xs: 6, md: 10 } }}>
      <Container maxWidth="md">
        <Stack spacing={2}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Support Access Consent
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            By approving support access, you authorize Schedulaa support staff to temporarily
            access your website and/or domain settings for the purpose of resolving your request.
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            • Access is time-limited and may be ended at any time.
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            • Access is limited to the scope requested (website builder, domain connect, or both).
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            • Only authorized Schedulaa staff assigned to your ticket may use this access.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
};

export default SupportAccessConsentPage;
