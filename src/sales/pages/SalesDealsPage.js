import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
} from "@mui/material";
import salesRepApi from "../../api/salesRepApi";

export default function SalesDealsPage() {
  const [deals, setDeals] = useState([]);
  const [planKey, setPlanKey] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [prospectName, setProspectName] = useState("");
  const [prospectEmail, setProspectEmail] = useState("");
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    const { data } = await salesRepApi.get("/deals");
    setDeals(data?.deals || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    setStatus("");
    try {
      await salesRepApi.post("/deals", { plan_key: planKey, prospect_name: prospectName, prospect_email: prospectEmail });
      setPlanKey("");
      setProspectName("");
      setProspectEmail("");
      load();
    } catch (err) {
      if (err?.response?.data?.error === "plan_key_invalid") {
        setStatus("Please select a valid plan: Starter, Pro, or Business.");
      } else if (err?.response?.data?.error === "already_acquired") {
        setStatus("This company is already acquired by another rep.");
      } else if (err?.response?.data?.error === "already_yours") {
        setStatus("This company is already yours. You can create a reactivation follow-up.");
      } else {
        setStatus("Failed to create deal.");
      }
    }
  };

  const createInvite = async (id) => {
    const { data } = await salesRepApi.post(`/deals/${id}/invite-link`);
    setInviteLink(data?.invite_link || "");
  };

  const sendInviteEmail = async (deal) => {
    setStatus("");
    if (!deal?.prospect_email) {
      setStatus("Please set prospect email before sending.");
      return;
    }
    try {
      const { data } = await salesRepApi.post(`/deals/${deal.id}/send-invite-email`, {
        prospect_name: deal.prospect_name,
        prospect_email: deal.prospect_email,
      });
      setInviteLink(data?.invite_link || "");
      setStatus("Invite email sent.");
    } catch (err) {
      setStatus("Failed to send invite email.");
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Deals</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2}>
          <FormControl sx={{ minWidth: 160 }}>
            <InputLabel id="plan-key-label">Plan</InputLabel>
            <Select
              labelId="plan-key-label"
              label="Plan"
              value={planKey}
              onChange={(e) => setPlanKey(e.target.value)}
            >
              <MenuItem value="starter">Starter</MenuItem>
              <MenuItem value="pro">Pro</MenuItem>
              <MenuItem value="business">Business</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Prospect name" value={prospectName} onChange={(e) => setProspectName(e.target.value)} />
          <TextField label="Prospect email" value={prospectEmail} onChange={(e) => setProspectEmail(e.target.value)} />
          <Button variant="contained" onClick={create}>Create Deal</Button>
        </Stack>
        <Alert severity="info" sx={{ mt: 2 }}>
          Plan selection is for tracking and reporting. Billing is handled in Stripe. Discounts and promotions may change the final amount paid and commission base.
        </Alert>
        {inviteLink && (
          <Typography variant="body2" sx={{ mt: 2 }}>
            Invite link: {inviteLink}
          </Typography>
        )}
        {status && <Typography variant="body2" sx={{ mt: 1 }}>{status}</Typography>}
      </Paper>
      {deals.map((d) => (
        <Paper key={d.id} sx={{ p: 2, mb: 1 }}>
          <Typography variant="subtitle1">Deal #{d.id}</Typography>
          <Typography variant="body2">
            Status: {d.status} • Company: {d.company_id || "—"}
          </Typography>
          <Typography variant="body2">
            Prospect: {d.prospect_name || "—"} • {d.prospect_email || "—"}
          </Typography>
          {d.deal_type === "reactivation" && (
            <Typography variant="body2" sx={{ color: "warning.main" }}>
              Reactivation
            </Typography>
          )}
          <Typography variant="body2">
            Invite sent: {(d.invite_sent_count || 0)} • {(d.invite_sent_at || "—")}
          </Typography>
          <Button size="small" variant="outlined" onClick={() => createInvite(d.id)} sx={{ mt: 1 }}>
            Generate invite link
          </Button>
          <Button size="small" variant="outlined" onClick={() => sendInviteEmail(d)} sx={{ mt: 1, ml: 1 }}>
            Send invite email
          </Button>
        </Paper>
      ))}
    </Box>
  );
}
