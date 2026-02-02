import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, Paper, Stack, TextField, Typography } from "@mui/material";
import salesRepApi from "../../api/salesRepApi";

const formatCents = (value) => (Number(value || 0) / 100).toFixed(2);

export default function SalesPayoutsPage() {
  const [batches, setBatches] = useState([]);
  const [filters, setFilters] = useState({
    year: "",
    month: "",
    status: "",
  });

  const load = useCallback(async () => {
    const { data } = await salesRepApi.get("/payouts");
    setBatches(data?.batches || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return batches.filter((b) => {
      if (filters.status && b.status !== filters.status) return false;
      if (filters.year && !String(b.period_start || "").startsWith(String(filters.year))) return false;
      if (filters.month) {
        const m = String(filters.month).padStart(2, "0");
        if (!String(b.period_start || "").includes(`-${m}-`)) return false;
      }
      return true;
    });
  }, [batches, filters]);

  const statusChips = ["draft", "approved", "paid", "void"];

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">Payouts</Typography>
        <Button size="small" variant="text" onClick={() => window.dispatchEvent(new Event("sales:help"))}>
          Help
        </Button>
      </Stack>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="Year"
          type="number"
          value={filters.year}
          onChange={(e) => setFilters((prev) => ({ ...prev, year: e.target.value }))}
        />
        <TextField
          label="Month"
          type="number"
          value={filters.month}
          onChange={(e) => setFilters((prev) => ({ ...prev, month: e.target.value }))}
        />
      </Stack>
      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
        <Chip
          label="All"
          variant={filters.status ? "outlined" : "filled"}
          onClick={() => setFilters((prev) => ({ ...prev, status: "" }))}
        />
        {statusChips.map((status) => (
          <Chip
            key={status}
            label={status}
            variant={filters.status === status ? "filled" : "outlined"}
            onClick={() => setFilters((prev) => ({ ...prev, status }))}
          />
        ))}
      </Stack>
      {!filtered.length && (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          No payouts yet.
        </Typography>
      )}
      {filtered.map((b) => (
        <Paper key={b.id} sx={{ p: 2, mb: 1 }}>
          <Typography variant="subtitle1">{b.period_start} → {b.period_end}</Typography>
          <Typography variant="body2">
            ${formatCents(b.total_payable_cents)} {b.currency?.toUpperCase()} • {b.status}
          </Typography>
          <Typography variant="body2">
            Paid: {b.paid_at || "—"} • Method: {b.paid_method || "—"} • Ref: {b.reference || "—"}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
}
