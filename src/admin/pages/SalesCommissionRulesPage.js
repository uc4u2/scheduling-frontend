import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
  Chip,
  Snackbar,
} from "@mui/material";
import platformAdminApi from "../../api/platformAdminApi";

export default function SalesCommissionRulesPage() {
  const [rules, setRules] = useState([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    version: "",
    close_bonus_pct: "",
    recurring_pct: "",
    months_cap: "",
    is_active: true,
  });

  const sortedRules = useMemo(() => {
    const list = Array.isArray(rules) ? [...rules] : [];
    list.sort((a, b) => {
      if (Boolean(a.is_active) !== Boolean(b.is_active)) {
        return a.is_active ? -1 : 1;
      }
      return Number(b.version || 0) - Number(a.version || 0);
    });
    return list;
  }, [rules]);

  const load = useCallback(async () => {
    setError("");
    try {
      const { data } = await platformAdminApi.get("/sales/rules");
      setRules(data?.rules || []);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load commission rules");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    setError("");
    const payload = {
      version: Number(form.version),
      close_bonus_pct: Number(form.close_bonus_pct),
      recurring_pct: Number(form.recurring_pct),
      months_cap: Number(form.months_cap),
      is_active: Boolean(form.is_active),
    };
    if (!Number.isFinite(payload.version)) {
      setError("Version must be a number.");
      return;
    }
    if (!Number.isFinite(payload.close_bonus_pct) || payload.close_bonus_pct < 0 || payload.close_bonus_pct > 100) {
      setError("Close bonus percent must be between 0 and 100.");
      return;
    }
    if (!Number.isFinite(payload.recurring_pct) || payload.recurring_pct < 0 || payload.recurring_pct > 100) {
      setError("Recurring percent must be between 0 and 100.");
      return;
    }
    if (!Number.isFinite(payload.months_cap) || payload.months_cap < 0) {
      setError("Months cap must be 0 or greater.");
      return;
    }
    try {
      await platformAdminApi.post("/sales/rules", payload);
      setOpen(false);
      setForm({ version: "", close_bonus_pct: "", recurring_pct: "", months_cap: "", is_active: true });
      setNotice("Rule created.");
      load();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to create rule");
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h5">Commission Rules</Typography>
          <Button size="small" variant="text" onClick={() => window.dispatchEvent(new Event("admin:help"))}>
            Help
          </Button>
        </Stack>
        <Button variant="contained" onClick={() => setOpen(true)}>New Rule</Button>
      </Stack>
      <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
        Rules affect future commissions only. Existing ledger entries are not recalculated.
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
        Only one active rule should be used for future commissions.
      </Typography>
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

      {sortedRules.map((r) => (
        <Paper key={r.id} sx={{ p: 2, mb: 1 }}>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="subtitle1">Version {r.version}</Typography>
              <Typography variant="body2">
                Close bonus: {r.close_bonus_pct}% • Recurring: {r.recurring_pct}% • Months cap: {r.months_cap}
              </Typography>
              <Typography variant="body2">Created: {r.created_at || "—"}</Typography>
            </Box>
            {r.is_active && <Chip label="Active" color="success" size="small" />}
          </Stack>
        </Paper>
      ))}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New commission rule</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Version"
              type="number"
              value={form.version}
              onChange={(e) => setForm((prev) => ({ ...prev, version: e.target.value }))}
              required
            />
            <TextField
              label="Close bonus %"
              type="number"
              value={form.close_bonus_pct}
              onChange={(e) => setForm((prev) => ({ ...prev, close_bonus_pct: e.target.value }))}
              required
            />
            <TextField
              label="Recurring %"
              type="number"
              value={form.recurring_pct}
              onChange={(e) => setForm((prev) => ({ ...prev, recurring_pct: e.target.value }))}
              required
            />
            <TextField
              label="Months cap"
              type="number"
              value={form.months_cap}
              onChange={(e) => setForm((prev) => ({ ...prev, months_cap: e.target.value }))}
              required
            />
          </Stack>
          {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submit}>Create</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={1500}
        onClose={() => setNotice("")}
        message={notice}
      />
    </Box>
  );
}
