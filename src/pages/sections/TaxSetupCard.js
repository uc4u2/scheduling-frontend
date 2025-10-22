import React from "react";
import { stripeConnect } from "../../utils/api";
import {
  Card, CardContent, CardHeader,
  Button, Stack, Alert, Typography, Divider, Chip, CircularProgress
} from "@mui/material";
import LaunchIcon from "@mui/icons-material/Launch";

export default function TaxSetupCard() {
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const [loading, setLoading] = React.useState(true);
  const [status, setStatus] = React.useState(null);
  const [err, setErr] = React.useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await stripeConnect.getStatus({ headers });
      setStatus(data);
    } catch (e) {
      setErr(e?.displayMessage || e?.response?.data?.error || e?.message || "Failed to load Stripe status");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); }, []);

  const openStripeDashboard = async () => {
    setErr("");
    try {
      const data = await stripeConnect.dashboardLogin({}, { headers });
      if (data?.url) {
        window.open(data.url, "_blank", "noopener");
      } else {
        throw new Error("Stripe did not provide a dashboard URL.");
      }
    } catch (e) {
      setErr(e?.displayMessage || e?.response?.data?.error || e?.message || "Could not open Stripe dashboard");
    }
  };

  if (!token) {
    return (
      <Card variant="outlined" sx={{ mt: 3 }}>
        <CardHeader title="Tax setup" />
        <CardContent>
          <Alert severity="warning">Please sign in as a manager to configure tax.</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined" sx={{ mt: 3 }}>
      <CardHeader title="Tax setup (Stripe Tax)" />
      <CardContent>
        <Stack spacing={2}>
          {loading ? (
            <Stack direction="row" spacing={2} alignItems="center">
              <CircularProgress size={20} /> <Typography variant="body2">Loading Stripe status…</Typography>
            </Stack>
          ) : (
            <>
              {err && <Alert severity="error">{err}</Alert>}

              {/* Connection status */}
              {status?.connected ? (
                <Alert severity={status?.charges_enabled ? "success" : "warning"}>
                  {status?.charges_enabled
                    ? "Stripe is connected and ready to accept payments."
                    : "Stripe is connected, but charges are not enabled yet. Finish onboarding in Stripe."}
                </Alert>
              ) : (
                <Alert severity="info">
                  Stripe is not connected yet. Use the “Connect with Stripe” button above to get started.
                </Alert>
              )}

              {/* Quick checklist */}
              <Stack spacing={1}>
                <Typography variant="subtitle2">Quick checklist</Typography>
                <Stack spacing={0.5}>
                  <Chip size="small" label="1. Company Profile → set Country & State/Province" />
                  <Chip size="small" label="2. Connect with Stripe (one-time)" />
                  <Chip size="small" label="3. Stripe → Tax → Turn ON “Automatic tax”" />
                  <Chip size="small" label="4. Choose pricing style: 'Prices include tax' ON/OFF" />
                  <Chip size="small" label="5. Tax → Registrations → add home region (+ others if you register)" />
                </Stack>
              </Stack>

              <Divider />

              {/* Open Stripe Tax (via Express Dashboard login) */}
              <Typography variant="body2">
                Open your Stripe dashboard, then click <b>Tax → Overview</b> or <b>Tax → Registrations</b>.
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  startIcon={<LaunchIcon />}
                  onClick={openStripeDashboard}
                  disabled={!status?.connected}
                >
                  Open Stripe Dashboard
                </Button>
                <Button variant="text" onClick={load}>Refresh status</Button>
              </Stack>

              {/* Friendly hints */}
              <Alert severity="info">
                <b>Tip:</b> For CA/US, most teams prefer <i>prices are before tax</i>. In your Company Profile leave
                “Prices include tax” <b>OFF</b> so tax is added on top at checkout. You can change this any time.
              </Alert>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
