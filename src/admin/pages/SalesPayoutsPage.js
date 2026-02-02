import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import platformAdminApi from "../../api/platformAdminApi";

const formatCents = (value) => {
  const cents = Number(value || 0);
  return (cents / 100).toFixed(2);
};

export default function SalesPayoutsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [rows, setRows] = useState([]);
  const [reps, setReps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);

  const [filters, setFilters] = useState({
    repId: "",
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    status: "",
  });

  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    sales_rep_id: "",
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    currency: "usd",
  });

  const repById = useMemo(() => {
    const list = Array.isArray(reps) ? reps : [];
    return Object.fromEntries(list.map((r) => [String(r.id), r]));
  }, [reps]);

  const repOptions = useMemo(() => {
    const list = Array.isArray(reps) ? reps : [];
    return activeOnly ? list.filter((r) => r.is_active !== false) : list;
  }, [reps, activeOnly]);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.repId) params.set("rep_id", filters.repId);
    if (filters.year) params.set("year", String(filters.year));
    if (filters.month) params.set("month", String(filters.month));
    if (filters.status) params.set("status", filters.status);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, [filters]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [payoutsRes, repsRes] = await Promise.all([
        platformAdminApi.get(`/sales/payouts${queryParams}`),
        platformAdminApi.get("/sales/reps"),
      ]);
      const data = payoutsRes?.data;
      const repsData = repsRes?.data;
      setRows(data?.batches || []);
      setReps(repsData?.reps || []);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load payouts");
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const repId = params.get("rep_id");
    if (repId) {
      setFilters((prev) => ({ ...prev, repId }));
    }
  }, [location.search]);

  const generateBatch = async () => {
    setError("");
    try {
      const payload = {
        sales_rep_id: Number(generateForm.sales_rep_id),
        year: Number(generateForm.year),
        month: Number(generateForm.month),
        currency: (generateForm.currency || "usd").toLowerCase(),
      };
      const { data } = await platformAdminApi.post("/sales/payouts/generate", payload);
      if (data?.batch?.id) {
        setGenerateOpen(false);
        navigate(`/admin/sales/payouts/${data.batch.id}`);
      }
    } catch (err) {
      const code = err?.response?.data?.error;
      if (code === "no_payable_entries") {
        setError("No payable entries for that period.");
      } else if (code === "batch_exists") {
        setError("A batch already exists for that rep and period.");
      } else {
        setError("Failed to generate payout batch.");
      }
    }
  };

  const clearFilters = () => {
    const now = new Date();
    setFilters({
      repId: "",
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      status: "",
    });
  };

  const statusChips = ["draft", "approved", "paid", "void"];
  const sortedRows = useMemo(() => {
    const list = Array.isArray(rows) ? [...rows] : [];
    list.sort((a, b) => (Number(b.id || 0) - Number(a.id || 0)));
    return list;
  }, [rows]);

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5">Sales Payouts</Typography>
        <Button
          variant="contained"
          onClick={() => {
            setGenerateForm((prev) => ({
              ...prev,
              year: filters.year || new Date().getFullYear(),
              month: filters.month || new Date().getMonth() + 1,
            }));
            setGenerateOpen(true);
          }}
        >
          Generate batch
        </Button>
      </Stack>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Autocomplete
            options={repOptions}
            value={repOptions.find((r) => String(r.id) === String(filters.repId)) || null}
            getOptionLabel={(option) =>
              option
                ? `${option.full_name || "Rep"} — ${option.email || "no-email"} (id:${option.id})`
                : ""
            }
            filterOptions={(options, state) => {
              const query = state.inputValue.toLowerCase();
              return options.filter((opt) =>
                `${opt.full_name || ""} ${opt.email || ""}`.toLowerCase().includes(query)
              );
            }}
            onChange={(_, value) =>
              setFilters((prev) => ({ ...prev, repId: value ? String(value.id) : "" }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Sales Rep"
                helperText={
                  filters.repId && repById[String(filters.repId)]
                    ? repById[String(filters.repId)]?.email
                    : ""
                }
              />
            )}
            sx={{ minWidth: 280 }}
          />
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
          <TextField
            label="Status"
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          />
          <Button variant="outlined" onClick={load} disabled={loading}>Refresh</Button>
          <Button variant="text" onClick={clearFilters}>Clear filters</Button>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
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
          <FormControlLabel
            control={<Switch checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} />}
            label="Active only"
            sx={{ ml: 1 }}
          />
        </Stack>
        {error && (
          <Typography color="error" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
      </Paper>

      {!sortedRows.length && !loading && (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          No payout batches found.
        </Typography>
      )}

      {sortedRows.map((row) => {
        const rep = repById[String(row.sales_rep_id)];
        const repLabel = rep
          ? `${rep.full_name || "Rep"} — ${rep.email || "no-email"} (id:${rep.id})`
          : `Rep ${row.sales_rep_id}`;
        return (
        <Paper
          key={row.id}
          sx={{ p: 2, mb: 1, cursor: "pointer" }}
          onClick={() => navigate(`/admin/sales/payouts/${row.id}`)}
        >
          <Typography variant="subtitle1">
            Batch #{row.id} • {repLabel}
          </Typography>
          <Typography variant="body2">
            Period {row.period_start} → {row.period_end} • ${formatCents(row.total_payable_cents)} {row.currency?.toUpperCase()}
          </Typography>
          <Typography variant="body2">
            Status: {row.status} • Paid: {row.paid_at || "—"} • Method: {row.paid_method || "—"} • Ref: {row.reference || "—"}
          </Typography>
          <Button
            size="small"
            variant="outlined"
            sx={{ mt: 1 }}
            onClick={(event) => {
              event.stopPropagation();
              navigate(`/admin/sales/reps/${row.sales_rep_id}`);
            }}
          >
            View Rep
          </Button>
        </Paper>
      )})}

      <Dialog open={generateOpen} onClose={() => setGenerateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Generate payout batch</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Autocomplete
              options={repOptions}
              value={repOptions.find((r) => String(r.id) === String(generateForm.sales_rep_id)) || null}
              getOptionLabel={(option) =>
                option
                  ? `${option.full_name || "Rep"} — ${option.email || "no-email"} (id:${option.id})`
                  : ""
              }
              filterOptions={(options, state) => {
                const query = state.inputValue.toLowerCase();
                return options.filter((opt) =>
                  `${opt.full_name || ""} ${opt.email || ""}`.toLowerCase().includes(query)
                );
              }}
              onChange={(_, value) =>
                setGenerateForm((prev) => ({ ...prev, sales_rep_id: value ? String(value.id) : "" }))
              }
              renderInput={(params) => <TextField {...params} label="Sales Rep" required />}
            />
            <TextField
              label="Year"
              type="number"
              value={generateForm.year}
              onChange={(e) => setGenerateForm((prev) => ({ ...prev, year: e.target.value }))}
              required
            />
            <TextField
              label="Month"
              type="number"
              value={generateForm.month}
              onChange={(e) => setGenerateForm((prev) => ({ ...prev, month: e.target.value }))}
              required
            />
            <TextField
              label="Currency"
              value={generateForm.currency}
              onChange={(e) => setGenerateForm((prev) => ({ ...prev, currency: e.target.value }))}
            />
          </Stack>
          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={generateBatch}>Generate</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
