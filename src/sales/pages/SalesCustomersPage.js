import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import salesRepApi from "../../api/salesRepApi";

export default function SalesCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [copyNotice, setCopyNotice] = useState("");

  const load = useCallback(async () => {
    const { data } = await salesRepApi.get("/customers");
    setCustomers(data?.customers || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const saved = localStorage.getItem("sales_customers_filters");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (typeof parsed.filter === "string") setFilter(parsed.filter);
      if (typeof parsed.query === "string") setQuery(parsed.query);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sales_customers_filters", JSON.stringify({ filter, query }));
  }, [filter, query]);

  const counts = useMemo(() => {
    const tally = { all: customers.length, active: 0, trialing: 0, past_due: 0, canceled: 0 };
    customers.forEach((c) => {
      const status = (c.subscription_status || "").toLowerCase();
      if (status && tally[status] !== undefined) tally[status] += 1;
    });
    return tally;
  }, [customers]);

  const filtered = customers.filter((c) => {
    const status = (c.subscription_status || "").toLowerCase();
    if (filter !== "all" && status !== filter) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const hay = `${c.name || ""} ${c.slug || ""} ${c.email || ""} ${c.plan_key || ""}`.toLowerCase();
    return hay.includes(q);
  });

  const formatDate = (value) => {
    if (!value) return null;
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return null;
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(dt);
  };

  const getStatusColor = (status) => {
    switch ((status || "").toLowerCase()) {
      case "active":
        return "success";
      case "trialing":
        return "info";
      case "past_due":
        return "warning";
      case "canceled":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Customers</Typography>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2, alignItems: { md: "center" } }}>
        <TextField
          label="Search customers"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ minWidth: 260 }}
        />
        <Typography variant="body2" color="text.secondary">
          Showing {filtered.length} of {customers.length} customers
        </Typography>
      </Stack>
      <ToggleButtonGroup
        value={filter}
        exclusive
        onChange={(_, next) => setFilter(next || "all")}
        sx={{ mb: 2 }}
      >
        <ToggleButton value="all">All ({counts.all})</ToggleButton>
        <ToggleButton value="active">Active ({counts.active})</ToggleButton>
        <ToggleButton value="trialing">Trialing ({counts.trialing})</ToggleButton>
        <ToggleButton value="past_due">Past due ({counts.past_due})</ToggleButton>
        <ToggleButton value="canceled">Canceled ({counts.canceled})</ToggleButton>
      </ToggleButtonGroup>
      <Stack spacing={1}>
        {!customers.length && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="body2">
              No customers yet. Customers appear after someone subscribes through your link.
            </Typography>
          </Paper>
        )}
        {customers.length > 0 && !filtered.length && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="body2">No customers found for this filter.</Typography>
          </Paper>
        )}
        {filtered.map((c) => (
          <Paper key={c.id} sx={{ p: 2 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1">{c.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {c.slug} • {c.email || "—"}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
                  <Chip
                    size="small"
                    label={(c.subscription_status || "inactive").toUpperCase()}
                    color={getStatusColor(c.subscription_status)}
                  />
                  {c.plan_key && (
                    <Chip size="small" variant="outlined" label={c.plan_key.toUpperCase()} />
                  )}
                </Stack>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Last paid: {formatDate(c.last_paid_at) || "No successful payment yet"}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(c.slug);
                      setCopyNotice("Slug copied.");
                    } catch {
                      // noop
                    }
                  }}
                >
                  Copy slug
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={async () => {
                    const link = `https://www.schedulaa.com/${c.slug}`;
                    try {
                      await navigator.clipboard.writeText(link);
                      setCopyNotice("Public link copied.");
                    } catch {
                      // noop
                    }
                  }}
                >
                  Copy public link
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => window.open(`https://www.schedulaa.com/${c.slug}`, "_blank", "noopener,noreferrer")}
                >
                  Open
                </Button>
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Stack>
      <Snackbar
        open={Boolean(copyNotice)}
        autoHideDuration={1500}
        onClose={() => setCopyNotice("")}
        message={copyNotice}
      />
    </Box>
  );
}
