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
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

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
    const saved = localStorage.getItem("admin_payout_filters");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFilters((prev) => ({ ...prev, ...parsed.filters }));
        if (typeof parsed.activeOnly === "boolean") {
          setActiveOnly(parsed.activeOnly);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("admin_payout_filters", JSON.stringify({ filters, activeOnly }));
  }, [filters, activeOnly]);

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

  const exportBatchesCsv = () => {
    if (!sortedRows.length) return;
    const headers = ["batch_id", "sales_rep_id", "period_start", "period_end", "total_payable_cents", "status", "paid_at", "paid_method", "reference"];
    const csvRows = sortedRows.map((row) => [
      row.id,
      row.sales_rep_id,
      row.period_start,
      row.period_end,
      row.total_payable_cents,
      row.status,
      row.paid_at,
      row.paid_method,
      row.reference,
    ]);
    const csv = [headers.join(","), ...csvRows.map((r) => r.map((v) => `"${String(v ?? "")}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sales_payout_batches.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const bulkGenerate = async () => {
    setBulkResult(null);
    const activeReps = repOptions.filter((r) => r.is_active !== false);
    let created = 0;
    let batchExists = 0;
    let noPayable = 0;
    let errors = 0;
    for (const rep of activeReps) {
      try {
        await platformAdminApi.post("/sales/payouts/generate", {
          sales_rep_id: Number(rep.id),
          year: Number(filters.year),
          month: Number(filters.month),
          currency: "usd",
        });
        created += 1;
      } catch (err) {
        const code = err?.response?.data?.error;
        if (code === "batch_exists") batchExists += 1;
        else if (code === "no_payable_entries") noPayable += 1;
        else errors += 1;
      }
      await new Promise((r) => setTimeout(r, 150));
    }
    setBulkResult({ created, batchExists, noPayable, errors, total: activeReps.length });
    setBulkOpen(true);
    load();
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5">Sales Payouts</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={exportBatchesCsv} disabled={!sortedRows.length}>
            Export CSV (filtered)
          </Button>
          <Button variant="outlined" onClick={bulkGenerate} disabled={loading}>
            Generate for all active reps
          </Button>
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

      <Dialog open={bulkOpen} onClose={() => setBulkOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Bulk generate results</DialogTitle>
        <DialogContent>
          {bulkResult ? (
            <Stack spacing={1} sx={{ mt: 1 }}>
              <Typography>Processed reps: {bulkResult.total}</Typography>
              <Typography>Created: {bulkResult.created}</Typography>
              <Typography>Batch exists: {bulkResult.batchExists}</Typography>
              <Typography>No payable entries: {bulkResult.noPayable}</Typography>
              <Typography>Errors: {bulkResult.errors}</Typography>
            </Stack>
          ) : (
            <Typography>Running...</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
