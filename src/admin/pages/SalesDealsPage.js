import React, { useEffect, useState } from "react";
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import platformAdminApi from "../../api/platformAdminApi";

export default function SalesDealsPage() {
  const [deals, setDeals] = useState([]);
  const [salesRepId, setSalesRepId] = useState("");
  const [planKey, setPlanKey] = useState("");
  const [inviteLink, setInviteLink] = useState("");

  const load = async () => {
    const { data } = await platformAdminApi.get("/sales/deals");
    setDeals(data?.deals || []);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    const { data } = await platformAdminApi.post("/sales/deals", { sales_rep_id: salesRepId, plan_key: planKey });
    setSalesRepId("");
    setPlanKey("");
    load();
    return data?.id;
  };

  const createInvite = async (id) => {
    const { data } = await platformAdminApi.post(`/sales/deals/${id}/invite-link`);
    setInviteLink(data?.invite_link || "");
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Sales Deals</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2}>
          <TextField label="Sales Rep ID" value={salesRepId} onChange={(e) => setSalesRepId(e.target.value)} />
          <TextField label="Plan key" value={planKey} onChange={(e) => setPlanKey(e.target.value)} />
          <Button variant="contained" onClick={create}>Create</Button>
        </Stack>
        {inviteLink && (
          <Typography variant="body2" sx={{ mt: 2 }}>
            Invite link: {inviteLink}
          </Typography>
        )}
      </Paper>
      {deals.map((d) => (
        <Paper key={d.id} sx={{ p: 2, mb: 1 }}>
          <Typography variant="subtitle1">Deal #{d.id}</Typography>
          <Typography variant="body2">
            Rep: {d.sales_rep_id} • Status: {d.status} • Company: {d.company_id || "—"}
          </Typography>
          <Button size="small" variant="outlined" onClick={() => createInvite(d.id)} sx={{ mt: 1 }}>
            Generate invite link
          </Button>
        </Paper>
      ))}
    </Box>
  );
}
