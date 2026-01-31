import React, { useCallback, useEffect, useState } from "react";
import { Box, Chip, Paper, Stack, Typography, ToggleButton, ToggleButtonGroup } from "@mui/material";
import salesRepApi from "../../api/salesRepApi";

export default function SalesCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    const { data } = await salesRepApi.get("/customers");
    setCustomers(data?.customers || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = customers.filter((c) => {
    if (filter === "all") return true;
    return (c.subscription_status || "").toLowerCase() === filter;
  });

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Customers</Typography>
      <ToggleButtonGroup
        value={filter}
        exclusive
        onChange={(_, next) => setFilter(next || "all")}
        sx={{ mb: 2 }}
      >
        <ToggleButton value="all">All</ToggleButton>
        <ToggleButton value="active">Active</ToggleButton>
        <ToggleButton value="trialing">Trialing</ToggleButton>
        <ToggleButton value="past_due">Past due</ToggleButton>
        <ToggleButton value="canceled">Canceled</ToggleButton>
      </ToggleButtonGroup>
      <Stack spacing={1}>
        {filtered.map((c) => (
          <Paper key={c.id} sx={{ p: 2 }}>
            <Typography variant="subtitle1">{c.name}</Typography>
            <Typography variant="body2">
              {c.slug} • {c.plan_key || "—"}
            </Typography>
            <Typography variant="body2">
              Last paid: {c.last_paid_at || "—"}
            </Typography>
            <Chip
              size="small"
              label={(c.subscription_status || "inactive").toUpperCase()}
              color={(c.subscription_status || "").toLowerCase() === "past_due" ? "warning" : "default"}
              sx={{ mt: 1 }}
            />
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}
