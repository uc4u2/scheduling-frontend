import React, { useCallback, useEffect, useState } from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import platformAdminApi from "../../api/platformAdminApi";

export default function SalesRepProfilePage() {
  const { repId } = useParams();
  const [profile, setProfile] = useState(null);

  const load = useCallback(async () => {
    const { data } = await platformAdminApi.get(`/sales/reps/${repId}/profile`);
    setProfile(data || null);
  }, [repId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!profile) return null;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>{profile.rep.full_name}</Typography>
      <Typography variant="body2">{profile.rep.email} • {profile.rep.phone || "—"}</Typography>
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
          <Typography variant="subtitle2">MRR</Typography>
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
