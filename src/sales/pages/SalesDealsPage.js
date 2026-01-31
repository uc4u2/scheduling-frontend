import React, { useCallback, useEffect, useState } from "react";
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import salesRepApi from "../../api/salesRepApi";

export default function SalesDealsPage() {
  const [deals, setDeals] = useState([]);
  const [planKey, setPlanKey] = useState("");
  const [inviteLink, setInviteLink] = useState("");

  const load = useCallback(async () => {
    const { data } = await salesRepApi.get("/deals");
    setDeals(data?.deals || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    await salesRepApi.post("/deals", { plan_key: planKey });
    setPlanKey("");
    load();
  };

  const createInvite = async (id) => {
    const { data } = await salesRepApi.post(`/deals/${id}/invite-link`);
    setInviteLink(data?.invite_link || "");
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Deals</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2}>
          <TextField label="Plan key" value={planKey} onChange={(e) => setPlanKey(e.target.value)} />
          <Button variant="contained" onClick={create}>Create Deal</Button>
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
            Status: {d.status} • Company: {d.company_id || "—"}
          </Typography>
          <Button size="small" variant="outlined" onClick={() => createInvite(d.id)} sx={{ mt: 1 }}>
            Generate invite link
          </Button>
        </Paper>
      ))}
    </Box>
  );
}
