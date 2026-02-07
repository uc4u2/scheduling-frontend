import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
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

const SUBJECT_OPTIONS = ["website", "booking", "payroll", "billing", "general"];

export default function AdminTeamPage() {
  const [users, setUsers] = useState([]);
  const [admin, setAdmin] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ email: "", role: "platform_support" });
  const [coverageById, setCoverageById] = useState({});
  const [coverageDialog, setCoverageDialog] = useState({
    open: false,
    user: null,
    subjects: [],
    loading: false,
    saving: false,
  });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);

  const load = useCallback(async () => {
    try {
      const [meRes, usersRes] = await Promise.all([
        platformAdminApi.get("/auth/me"),
        platformAdminApi.get("/team/users"),
      ]);
      setAdmin(meRes.data || null);
      setUsers(usersRes.data?.users || []);
      setForbidden(false);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403) {
        setForbidden(true);
        setUsers([]);
      } else {
        setError("Failed to load team users.");
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const canManage = admin?.role === "platform_owner" || admin?.role === "platform_admin";
  const allowedRoleOptions = useMemo(() => {
    if (admin?.role === "platform_owner") return ROLE_OPTIONS;
    return ROLE_OPTIONS.filter((opt) => opt.value !== "platform_owner");
  }, [admin]);

  const sorted = useMemo(() => {
    const list = Array.isArray(users) ? users : [];
    return [...list].sort((a, b) => (a.email || "").localeCompare(b.email || ""));
  }, [users]);

  const loadCoverageForUsers = useCallback(async (teamUsers) => {
    if (!canManage) return;
    const supportUsers = (teamUsers || []).filter((u) => u.role === "platform_support");
    if (!supportUsers.length) return;
    const results = await Promise.allSettled(
      supportUsers.map((u) => platformAdminApi.get(`/team/coverage/${u.id}`))
    );
    const next = {};
    results.forEach((res, idx) => {
      if (res.status === "fulfilled") {
        next[supportUsers[idx].id] = res.value?.data?.subjects || [];
      }
    });
    setCoverageById(next);
  }, [canManage]);

  useEffect(() => {
    if (users.length) {
      loadCoverageForUsers(users);
    }
  }, [users, loadCoverageForUsers]);

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

  const openCoverageDialog = async (user) => {
    setError("");
    setCoverageDialog({ open: true, user, subjects: [], loading: true, saving: false });
    try {
      const { data } = await platformAdminApi.get(`/team/coverage/${user.id}`);
      const subjects = data?.subjects || [];
      setCoverageById((prev) => ({ ...prev, [user.id]: subjects }));
      setCoverageDialog({ open: true, user, subjects, loading: false, saving: false });
    } catch (err) {
      const status = err?.response?.status;
      setCoverageDialog({ open: true, user, subjects: [], loading: false, saving: false });
      if (status === 403) {
        setError("You don’t have permission to edit coverage.");
      } else {
        setError("Failed to load coverage.");
      }
    }
  };

  const toggleCoverage = (subject) => {
    setCoverageDialog((prev) => {
      const exists = prev.subjects.includes(subject);
      const nextSubjects = exists
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject];
      return { ...prev, subjects: nextSubjects };
    });
  };

  const selectAllCoverage = () => {
    setCoverageDialog((prev) => ({ ...prev, subjects: [...SUBJECT_OPTIONS] }));
  };

  const clearCoverage = () => {
    setCoverageDialog((prev) => ({ ...prev, subjects: [] }));
  };

  const saveCoverage = async () => {
    if (!coverageDialog.user) return;
    setCoverageDialog((prev) => ({ ...prev, saving: true }));
    try {
      const payload = { subjects: coverageDialog.subjects };
      await platformAdminApi.put(`/team/coverage/${coverageDialog.user.id}`, payload);
      setCoverageById((prev) => ({ ...prev, [coverageDialog.user.id]: coverageDialog.subjects }));
      setCoverageDialog((prev) => ({ ...prev, saving: false, open: false }));
      setNotice("Coverage updated");
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403) {
        setError("You don’t have permission to edit coverage.");
      } else {
        setError("Failed to update coverage.");
      }
      setCoverageDialog((prev) => ({ ...prev, saving: false }));
    }
  };

  if (forbidden) {
    return (
      <Box>
        <Typography variant="h5" sx={{ mb: 2 }}>Team</Typography>
        <Paper sx={{ p: 3 }}>
          <Typography variant="body1">
            You don’t have permission to view Team management.
          </Typography>
        </Paper>
      </Box>
    );
  }

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
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Coverage:{" "}
            {u.role !== "platform_support" ? (
              "All (implicit)"
            ) : coverageById[u.id]?.length ? (
              <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: "wrap" }}>
                {coverageById[u.id].map((subject) => (
                  <Chip key={subject} size="small" label={subject} sx={{ mb: 0.5 }} />
                ))}
              </Stack>
            ) : (
              "No coverage assigned"
            )}
          </Typography>
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
              {u.role === "platform_support" && (
                <Button size="small" variant="outlined" onClick={() => openCoverageDialog(u)}>
                  Edit coverage
                </Button>
              )}
            </Stack>
          )}
        </Paper>
      ))}

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
                {allowedRoleOptions.map((opt) => (
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

      <Dialog
        open={coverageDialog.open}
        onClose={() => setCoverageDialog({ open: false, user: null, subjects: [], loading: false, saving: false })}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Ticket coverage for {coverageDialog.user?.email || ""}
        </DialogTitle>
        <DialogContent>
          {coverageDialog.loading ? (
            <Stack alignItems="center" sx={{ py: 3 }}>
              <CircularProgress size={24} />
            </Stack>
          ) : (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="outlined" onClick={selectAllCoverage}>
                  Select all
                </Button>
                <Button size="small" variant="outlined" onClick={clearCoverage}>
                  Clear
                </Button>
              </Stack>
              <FormGroup>
                {SUBJECT_OPTIONS.map((subject) => (
                  <FormControlLabel
                    key={subject}
                    control={
                      <Checkbox
                        checked={coverageDialog.subjects.includes(subject)}
                        onChange={() => toggleCoverage(subject)}
                      />
                    }
                    label={subject}
                  />
                ))}
              </FormGroup>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setCoverageDialog({ open: false, user: null, subjects: [], loading: false, saving: false })}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={saveCoverage}
            disabled={coverageDialog.loading || coverageDialog.saving}
          >
            Save
          </Button>
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
