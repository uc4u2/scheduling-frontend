import React, { useCallback, useEffect, useState } from "react";
import { Box, Button, MenuItem, Paper, Stack, TextField, Typography, Tooltip } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useNavigate, useParams } from "react-router-dom";
import platformAdminApi from "../../api/platformAdminApi";

export default function SalesRepProfilePage() {
  const { repId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [payoutError, setPayoutError] = useState("");
  const [payoutForm, setPayoutForm] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    currency: "usd",
  });

  const load = useCallback(async () => {
    const { data } = await platformAdminApi.get(`/sales/reps/${repId}/profile`);
    setProfile(data || null);
  }, [repId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!profile) return null;

  const sendReset = async () => {
    await platformAdminApi.post(`/sales/reps/${repId}/reset-password`);
  };

  const generateBatch = async () => {
    setPayoutError("");
    try {
      const payload = {
        sales_rep_id: Number(repId),
        year: Number(payoutForm.year),
        month: Number(payoutForm.month),
        currency: (payoutForm.currency || "usd").toLowerCase(),
      };
      const { data } = await platformAdminApi.post("/sales/payouts/generate", payload);
      if (data?.batch?.id) {
        navigate(`/admin/sales/payouts/${data.batch.id}`);
      }
    } catch (err) {
      const code = err?.response?.data?.error;
      if (code === "no_payable_entries") {
        setPayoutError("No payable entries for that period.");
      } else if (code === "batch_exists") {
        setPayoutError("Batch already exists for that period. Check payouts list.");
      } else {
        setPayoutError("Failed to generate payout batch.");
      }
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>{profile.rep.full_name}</Typography>
      <Typography variant="body2">{profile.rep.email} • {profile.rep.phone || "—"}</Typography>
      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
        <Button variant="outlined" onClick={sendReset}>
          Send password reset
        </Button>
        <Button variant="text" onClick={sendReset}>
          Send invite email
        </Button>
        <Tooltip title="Backend endpoint not implemented yet">
          <span>
            <Button variant="outlined" disabled>
              Deactivate
            </Button>
          </span>
        </Tooltip>
        <Tooltip title="Backend endpoint not implemented yet">
          <span>
            <Button variant="outlined" disabled>
              Activate
            </Button>
          </span>
        </Tooltip>
        <Button variant="text" onClick={() => navigate(`/admin/sales/payouts?rep_id=${repId}`)}>
          Open payouts list
        </Button>
      </Stack>
      <Paper sx={{ p: 2, my: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Generate payout batch</Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            label="Year"
            type="number"
            value={payoutForm.year}
            onChange={(e) => setPayoutForm((prev) => ({ ...prev, year: e.target.value }))}
          />
          <TextField
            label="Month"
            select
            value={payoutForm.month}
            onChange={(e) => setPayoutForm((prev) => ({ ...prev, month: e.target.value }))}
            sx={{ minWidth: 120 }}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <MenuItem key={m} value={m}>{m}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Currency"
            value={payoutForm.currency}
            onChange={(e) => setPayoutForm((prev) => ({ ...prev, currency: e.target.value }))}
          />
          <Button variant="contained" onClick={generateBatch}>
            Generate batch
          </Button>
        </Stack>
        {payoutError && (
          <Typography color="error" sx={{ mt: 1 }}>{payoutError}</Typography>
        )}
      </Paper>
      <Stack direction="row" spacing={2} sx={{ my: 2 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2">Invited</Typography>
          <Typography variant="h6">{profile.kpis.invited}</Typography>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2">Activated</Typography>
          <Typography variant="h6">{profile.kpis.activated}</Typography>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2">Paying</Typography>
          <Typography variant="h6">{profile.kpis.paying}</Typography>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography variant="subtitle2">Estimated MRR</Typography>
            <Tooltip title="Estimated based on selected plan. Actual revenue is determined by Stripe invoices and may differ due to discounts, coupons, or proration.">
              <InfoOutlinedIcon fontSize="small" sx={{ color: "text.secondary" }} />
            </Tooltip>
          </Stack>
          <Typography variant="h6">${(profile.kpis.mrr_cents / 100).toFixed(2)}</Typography>
        </Paper>
      </Stack>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1">Recent deals</Typography>
        {profile.recent_deals.map((d) => (
          <Typography key={d.id} variant="body2">
            Deal #{d.id} • {d.status} • {d.plan_key || "—"}
          </Typography>
        ))}
      </Paper>
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1">Recent customers</Typography>
        {profile.recent_customers.map((c) => (
          <Typography key={c.id} variant="body2">
            {c.name} • {c.slug}
          </Typography>
        ))}
      </Paper>
    </Box>
  );
}
