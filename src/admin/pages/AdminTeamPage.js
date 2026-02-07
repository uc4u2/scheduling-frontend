import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import platformAdminApi from "../../api/platformAdminApi";

const ROLE_OPTIONS = [
  { value: "platform_support", label: "Platform Support" },
  { value: "platform_admin", label: "Platform Admin" },
  { value: "platform_owner", label: "Platform Owner" },
];

export default function AdminTeamPage() {
  const [users, setUsers] = useState([]);
  const [admin, setAdmin] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ email: "", role: "platform_support" });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [meRes, usersRes] = await Promise.all([
      platformAdminApi.get("/auth/me"),
      platformAdminApi.get("/team/users"),
    ]);
    setAdmin(meRes.data || null);
    setUsers(usersRes.data?.users || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const canManage = admin?.role === "platform_owner" || admin?.role === "platform_admin";

  const sorted = useMemo(() => {
    const list = Array.isArray(users) ? users : [];
    return [...list].sort((a, b) => (a.email || "").localeCompare(b.email || ""));
  }, [users]);

  const createUser = async () => {
    setError("");
    if (!form.email.trim() || !form.email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }
    try {
      await platformAdminApi.post("/team/users", {
        email: form.email,
        role: form.role,
      });
      setNotice("Invite email sent.");
      setDialogOpen(false);
      setForm({ email: "", role: "platform_support" });
      load();
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to create user.";
      setError(msg);
    }
  };

  const toggleActive = async (user, isActive) => {
    setError("");
    try {
      await platformAdminApi.patch(`/team/users/${user.id}`, { is_active: isActive });
      setNotice(isActive ? "User activated." : "User deactivated.");
      load();
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to update user.";
      setError(msg);
    }
  };

  const resetPassword = async (user) => {
    setError("");
    if (!window.confirm(`Send password reset to ${user.email}?`)) return;
    try {
      await platformAdminApi.post(`/team/users/${user.id}/reset-password`);
      setNotice("Reset email sent.");
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to send reset email.";
      setError(msg);
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">Team</Typography>
      </Stack>
      {canManage && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center">
            <Button variant="contained" onClick={() => setDialogOpen(true)}>
              Create user
            </Button>
          </Stack>
        </Paper>
      )}
      {error && <Typography color="error" sx={{ mb: 1 }}>{error}</Typography>}
      {sorted.length === 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2">No team users found.</Typography>
        </Paper>
      )}
      {sorted.map((u) => (
        <Paper key={u.id} sx={{ p: 2, mb: 1 }}>
          <Typography variant="subtitle1">{u.email}</Typography>
          <Typography variant="body2">Role: {u.role}</Typography>
          <Typography variant="body2">Status: {u.is_active ? "Active" : "Inactive"}</Typography>
          {canManage && (
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Button
                size="small"
                variant="outlined"
                disabled={!u.is_active}
                onClick={() => toggleActive(u, false)}
              >
                Deactivate
              </Button>
              <Button
                size="small"
                variant="outlined"
                disabled={u.is_active}
                onClick={() => toggleActive(u, true)}
              >
                Activate
              </Button>
              <Button size="small" variant="outlined" onClick={() => resetPassword(u)}>
                Reset password
              </Button>
            </Stack>
          )}
        </Paper>
      ))

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create team user</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel id="role-select-label">Role</InputLabel>
              <Select
                labelId="role-select-label"
                label="Role"
                value={form.role}
                onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={createUser}>Create</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={3000}
        onClose={() => setNotice("")}
        message={notice}
      />
    </Box>
  );
}
