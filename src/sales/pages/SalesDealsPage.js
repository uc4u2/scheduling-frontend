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
  Snackbar,
  Tooltip,
} from "@mui/material";
import salesRepApi from "../../api/salesRepApi";

export default function SalesDealsPage() {
  const [deals, setDeals] = useState([]);
  const [planKey, setPlanKey] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [inviteLinks, setInviteLinks] = useState({});
  const [prospectName, setProspectName] = useState("");
  const [prospectEmail, setProspectEmail] = useState("");
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [copyNotice, setCopyNotice] = useState("");
  const [inviteNotice, setInviteNotice] = useState("");

  const load = useCallback(async () => {
    const { data } = await salesRepApi.get("/deals");
    setDeals(data?.deals || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const saved = localStorage.getItem("sales_deals_filters");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (typeof parsed.query === "string") setQuery(parsed.query);
      if (typeof parsed.statusFilter === "string") setStatusFilter(parsed.statusFilter);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sales_deals_filters", JSON.stringify({ query, statusFilter }));
  }, [query, statusFilter]);

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
    const link = data?.invite_link || "";
    setInviteLink(link);
    setInviteLinks((prev) => ({ ...prev, [id]: link }));
    if (link) {
      try {
        await navigator.clipboard.writeText(link);
        setInviteNotice("Invite link created and copied.");
      } catch {
        setInviteNotice("Invite link created.");
      }
    }
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
      const link = data?.invite_link || "";
      setInviteLink(link);
      if (link) {
        setInviteLinks((prev) => ({ ...prev, [deal.id]: link }));
      }
      setInviteNotice("Invite email sent.");
    } catch (err) {
      setStatus("Failed to send invite email.");
    }
  };

  const filteredDeals = deals.filter((d) => {
    const q = query.trim().toLowerCase();
    if (q) {
      const hay = `${d.prospect_name || ""} ${d.prospect_email || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (statusFilter && d.status !== statusFilter) return false;
    return true;
  });

  const statusOptions = Array.from(new Set(deals.map((d) => d.status).filter(Boolean)));

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">Deals</Typography>
        <Button size="small" variant="text" onClick={() => window.dispatchEvent(new Event("sales:help"))}>
          Help
        </Button>
      </Stack>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="Search prospect name/email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ minWidth: 260 }}
        />
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
          <Button
            size="small"
            variant={statusFilter ? "outlined" : "contained"}
            onClick={() => setStatusFilter("")}
          >
            All
          </Button>
          {statusOptions.map((s) => (
            <Button
              key={s}
              size="small"
              variant={statusFilter === s ? "contained" : "outlined"}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </Button>
          ))}
        </Stack>
      </Stack>
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
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              ℹ️ Plan selection is for tracking only. Final billing and commission are based on Stripe payments and may differ due to discounts or promotions.{" "}
              <Button
                variant="text"
                size="small"
                onClick={() => window.dispatchEvent(new Event("sales:help"))}
                sx={{ p: 0, minWidth: "auto", fontSize: "inherit", textTransform: "none" }}
              >
                Learn more
              </Button>
            </Typography>
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
        {status && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            {status}
          </Typography>
        )}
      </Paper>
      {filteredDeals.map((d) => (
        <Paper key={d.id} sx={{ p: 2, mb: 1 }}>
          <Typography variant="subtitle1">Deal #{d.id}</Typography>
          <Typography variant="body2">
            Status: {d.status} • Company: {d.company_id || "—"}
          </Typography>
          <Typography variant="body2">
            Prospect: {d.prospect_name || "—"} • {d.prospect_email || "—"}
          </Typography>
          {!d.prospect_email && (
            <Typography variant="body2" sx={{ color: "warning.main" }}>
              Missing email
            </Typography>
          )}
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
          <Tooltip title={inviteLinks[d.id] ? "" : "Generate invite link first"}>
            <span>
              <Button
                size="small"
                variant="text"
                disabled={!inviteLinks[d.id]}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(inviteLinks[d.id]);
                    setCopyNotice("Invite link copied.");
                  } catch {
                    // noop
                  }
                }}
                sx={{ mt: 1, ml: 1 }}
              >
                Copy invite link
              </Button>
            </span>
          </Tooltip>
          {inviteLinks[d.id] && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              Send this link to the customer by email.
            </Typography>
          )}
        </Paper>
      ))}
      <Snackbar
        open={Boolean(copyNotice)}
        autoHideDuration={1500}
        onClose={() => setCopyNotice("")}
        message={copyNotice}
      />
      <Snackbar
        open={Boolean(inviteNotice)}
        autoHideDuration={2000}
        onClose={() => setInviteNotice("")}
      >
        <Alert severity="success" onClose={() => setInviteNotice("")} sx={{ width: "100%" }}>
          {inviteNotice}
        </Alert>
      </Snackbar>
    </Box>
  );
}
