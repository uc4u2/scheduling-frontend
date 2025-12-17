// Minimal Zapier settings page: actionable blocks only (API keys + Event hooks) with optional help toggle
import React, { useState } from "react";
import { Box, Paper, Stack, Typography, Tooltip, IconButton, Button, Collapse } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import ZapierApiKeysPanel from "../../components/zapier/ZapierApiKeysPanel";
import ZapierHooksPanel from "../../components/zapier/ZapierHooksPanel";
import ZapierHelpSection from "../../components/zapier/ZapierHelpSection";

const ZapierIntegrationPage = () => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <Box
      sx={(theme) => ({
        p: 3,
        borderRadius: 3,
        background:
          theme.palette.mode === "light" ? "linear-gradient(135deg, #fff 0%, #fff7f2 100%)" : "transparent",
      })}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 1 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 0 }}>
          Zapier integration
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Open Zapier setup guide">
            <IconButton size="small" onClick={() => setShowHelp((v) => !v)} aria-label="Zapier help">
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button size="small" onClick={() => setShowHelp((v) => !v)} sx={{ textTransform: "none" }}>
            Zapier setup guide
          </Button>
        </Stack>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 720, mb: 2 }}>
        Connect Schedulaa with Zapier to automate your workflows. Create an API key, add Event hooks, and you’re live.
      </Typography>

      <Collapse in={showHelp} timeout="auto" unmountOnExit>
        <Paper
          elevation={0}
          sx={{
            p: 0,
            mb: 2,
            borderRadius: 3,
            border: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <ZapierHelpSection />
        </Paper>
      </Collapse>

      <Stack spacing={3}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 3,
            border: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Zapier API keys (start here)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Create or copy your Zapier API key first. Zapier uses this key only when calling Schedulaa actions or callbacks
            (for example, payment-status). Keep it secret; rotate if needed.
          </Typography>
          <ZapierApiKeysPanel />
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 3,
            border: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Event hooks
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Paste your Zapier Catch Hook URL here and choose the events you want Schedulaa to send. You can point multiple
            events to the same hook URL. Tip: For payroll automation (QuickBooks/Xero via Zapier), select
            “When a payroll payment is requested”.
          </Typography>
          <ZapierHooksPanel />
        </Paper>
      </Stack>
    </Box>
  );
};

export default ZapierIntegrationPage;
