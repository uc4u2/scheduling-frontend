import React, { useMemo, useState } from "react";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { MOBILE_PAYMENTS_MESSAGE, toWebAppUrl } from "../../utils/mobileCompliance";

const MobileWebOnlyNotice = ({
  title = "Web-only billing action",
  message = MOBILE_PAYMENTS_MESSAGE,
  webPath = "/manager/dashboard?view=settings&tab=billing",
}) => {
  const [copied, setCopied] = useState(false);
  const webUrl = useMemo(() => toWebAppUrl(webPath), [webPath]);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(webUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Box sx={{ py: 2 }}>
      <Stack spacing={1.5}>
        <Alert severity="info">{message}</Alert>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          Use desktop web for Stripe checkout, subscription upgrades, seat purchases, and Connect onboarding.
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Button variant="outlined" size="small" startIcon={<ContentCopyIcon />} onClick={copyUrl}>
            Copy web URL
          </Button>
          <Typography variant="caption" color={copied ? "success.main" : "text.secondary"}>
            {copied ? "Copied" : webUrl}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
};

export default MobileWebOnlyNotice;
