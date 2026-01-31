import React, { useCallback, useEffect, useState } from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";
import salesRepApi from "../../api/salesRepApi";

export default function SalesCustomersPage() {
  const [customers, setCustomers] = useState([]);

  const load = useCallback(async () => {
    const { data } = await salesRepApi.get("/customers");
    setCustomers(data?.customers || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Customers</Typography>
      <Stack spacing={1}>
        {customers.map((c) => (
          <Paper key={c.id} sx={{ p: 2 }}>
            <Typography variant="subtitle1">{c.name}</Typography>
            <Typography variant="body2">
              {c.slug} • {c.subscription_status} • {c.plan_key || "—"}
            </Typography>
            <Typography variant="body2">
              Last paid: {c.last_paid_at || "—"}
            </Typography>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}
