import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Paper,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
  Tooltip,
  Chip,
} from "@mui/material";
import { Link } from "react-router-dom";
import platformAdminApi from "../../api/platformAdminApi";

export default function SalesRepsPage() {
  const [reps, setReps] = useState([]);
  const [query, setQuery] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createdEmail, setCreatedEmail] = useState("");
  const [copyNotice, setCopyNotice] = useState(false);

  const load = useCallback(async () => {
    const { data } = await platformAdminApi.get("/sales/reps");
    setReps(data?.reps || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const list = Array.isArray(reps) ? reps : [];
    const q = query.trim().toLowerCase();
    return list.filter((r) => {
      if (activeOnly && r.is_active === false) return false;
      if (!q) return true;
      return `${r.full_name || ""} ${r.email || ""}`.toLowerCase().includes(q);
    });
  }, [reps, query, activeOnly]);

  const create = async () => {
    setError("");
    setSuccess("");
    setCreatedEmail("");
    if (!form.full_name.trim() || !form.email.trim()) {
      setError("Full name and email are required.");
      return;
    }
    if (!form.email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }
    const { data } = await platformAdminApi.post("/sales/reps", {
      full_name: form.full_name,
      email: form.email,
      phone: form.phone || "",
    });
    const repId = data?.id;
    if (repId) {
      await platformAdminApi.post(`/sales/reps/${repId}/reset-password`);
    }
    setForm({ full_name: "", email: "", phone: "" });
    setSuccess("Rep created and invite email sent.");
    setCreatedEmail(form.email);
    setDialogOpen(false);
    load();
  };

  const resendReset = async (rep) => {
    setError("");
    setSuccess("");
    const ok = window.confirm(`Send password setup email to ${rep.email}?`);
    if (!ok) return;
    await platformAdminApi.post(`/sales/reps/${rep.id}/reset-password`);
    setSuccess("Password setup email sent.");
  };

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">Sales Reps</Typography>
        <Button size="small" variant="text" onClick={() => window.dispatchEvent(new Event("admin:help"))}>
          Help
        </Button>
      </Stack>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center">
          <TextField
            label="Search name or email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ flex: 1 }}
          />
          <FormControlLabel
            control={<Switch checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} />}
            label="Active only"
          />
          <Button variant="contained" onClick={() => setDialogOpen(true)}>
            Create Sales Rep
          </Button>
        </Stack>
        <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
          Showing {filtered.length} of {reps.length}
        </Typography>
        {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
        {success && <Typography color="primary" sx={{ mt: 1 }}>{success}</Typography>}
        {createdEmail && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
            <Typography variant="body2">{createdEmail}</Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(createdEmail);
                  setCopyNotice(true);
                } catch {
                  // noop
                }
              }}
            >
              Copy email
            </Button>
          </Stack>
        )}
      </Paper>
      {filtered.map((r) => (
        <Paper key={r.id} sx={{ p: 2, mb: 1 }}>
          <Typography variant="subtitle1">{r.full_name}</Typography>
          <Typography variant="body2">{r.email} • {r.phone || "—"}</Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
            <Chip
              size="small"
              label={r.is_active === false ? "Inactive" : "Active"}
              color={r.is_active === false ? "default" : "success"}
              variant="outlined"
            />
          </Stack>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button size="small" component={Link} to={`/admin/sales/reps/${r.id}`}>
              View profile
            </Button>
            <Button size="small" variant="outlined" onClick={() => resendReset(r)}>
              Send password reset
            </Button>
            <Tooltip title="Backend endpoint not implemented yet">
              <span>
                <Button size="small" variant="outlined" disabled>
                  Deactivate
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="Backend endpoint not implemented yet">
              <span>
                <Button size="small" variant="outlined" disabled>
                  Activate
                </Button>
              </span>
            </Tooltip>
          </Stack>
        </Paper>
      ))}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Sales Rep</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Full name"
              value={form.full_name}
              onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
              required
            />
            <TextField
              label="Email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
            <TextField
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </Stack>
          {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={create}>Create</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={copyNotice}
        autoHideDuration={1500}
        onClose={() => setCopyNotice(false)}
        message="Copied"
      />
    </Box>
  );
}
