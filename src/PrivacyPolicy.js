import React from "react";
import { Container, Typography } from "@mui/material";

const PrivacyPolicy = () => (
  <Container sx={{ py: 6 }}>
    <Typography variant="h4" gutterBottom>
      Privacy Policy
    </Typography>
    <Typography paragraph>
      Your privacy is important to us. We only collect data required to operate our scheduling
      platform efficiently.
    </Typography>
    <Typography paragraph>
      We do not share, sell, or rent your data to third parties. All user information is securely
      stored and encrypted.
    </Typography>
    <Typography paragraph>
      By using our platform, you consent to the collection and use of your information as outlined
      in this policy.
    </Typography>
  </Container>
);

export default PrivacyPolicy;
