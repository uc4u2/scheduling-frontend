import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Switch,
} from "@mui/material";
import { timeTracking } from "../../utils/api";
import { getUserTimezone } from "../../utils/timezone";
import { formatDateTimeInTz } from "../../utils/datetime";
import RefreshIcon from "@mui/icons-material/Refresh";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const statusColor = {
  assigned: "default",
  in_progress: "warning",
  completed: "info",
  approved: "success",
  rejected: "error",
};

const TimeEntriesPanel = ({ recruiters = [] }) => {
  const viewerTimezone = getUserTimezone();
  const today = useMemo(() => new Date(), []);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState(recruiters || []);
  const [filters, setFilters] = useState({
    status: "all",
    recruiterId: "",
    departmentId: "",
    startDate: today.toISOString().slice(0, 10),
    endDate: today.toISOString().slice(0, 10),
  });
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    severity: "info",
    message: "",
  });
  const [rejectState, setRejectState] = useState({
    open: false,
    entryId: null,
    reason: "",
  });
  const [selectedIds, setSelectedIds] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    templateId: "",
    breakMinutes: "",
    breakPaid: true,
  });

  const statusOptions = useMemo(
    () => [
      { value: "all", label: "All statuses" },
      { value: "completed", label: "Completed (awaiting approval)" },
      { value: "approved", label: "Approved" },
      { value: "rejected", label: "Rejected" },
      { value: "in_progress", label: "In progress" },
    ],
    []
  );
  const templateOptions = useMemo(() => {
    if (Array.isArray(templates)) return templates;
    if (templates && Array.isArray(templates.templates)) {
      return templates.templates;
    }
    return [];
  }, [templates]);

  const handleChange = (key) => (event) => {
    const value = event.target.value;
    setFilters((prev) => ({ ...prev, [key]: value }));
  };
  const handleDepartmentChange = (event) => {
    const value = event.target.value;
    setFilters((prev) => {
      let recruiterId = prev.recruiterId;
      if (
        value &&
        recruiterId &&
        !employees.some(
          (emp) =>
            String(emp.id) === String(recruiterId) &&
            String(emp.department_id || emp.departmentId || "") === String(value)
        )
      ) {
        recruiterId = "";
      }
      return { ...prev, departmentId: value, recruiterId };
    });
  };
  const selectedCount = selectedIds.length;
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const allIds = entries.map((entry) => entry.id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };
  const handleSelectOne = (entryId) => (event) => {
    if (event.target.checked) {
      setSelectedIds((prev) => Array.from(new Set([...prev, entryId])));
    } else {
      setSelectedIds((prev) => prev.filter((id) => id !== entryId));
    }
  };

  const fetchEntries = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filters.status && filters.status !== "all") params.status = filters.status;
      if (filters.recruiterId) params.recruiter_id = filters.recruiterId;
      if (filters.departmentId) params.department_id = filters.departmentId;
      if (filters.startDate) params.start_date = filters.startDate;
      if (filters.endDate) params.end_date = filters.endDate;
      const data = await timeTracking.listEntries(params);
      setEntries(data.time_entries || []);
    } catch (err) {
      setEntries([]);
      setError(err?.response?.data?.error || "Failed to load time entries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.startDate, filters.endDate, filters.recruiterId, filters.departmentId]);

  useEffect(() => {
    if (!entries.length) {
      if (selectedIds.length) {
        setSelectedIds([]);
      }
      return;
    }
    setSelectedIds((prev) => prev.filter((id) => entries.some((entry) => entry.id === id)));
  }, [entries, selectedIds.length]);

  useEffect(() => {
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const loadDepartments = async () => {
      try {
        const res = await fetch(`${API_URL}/api/departments`, { headers });
        const data = await res.json();
        if (Array.isArray(data)) {
          setDepartments(data.map((dept) => ({ id: dept.id, name: dept.name })));
        }
      } catch {
        setDepartments([]);
      }
    };

    const loadEmployees = async () => {
      try {
        const res = await fetch(`${API_URL}/manager/recruiters`, { headers });
        const data = await res.json();
        if (Array.isArray(data?.recruiters)) {
          setEmployees(data.recruiters);
        } else if (Array.isArray(data)) {
          setEmployees(data);
        } else if (recruiters.length) {
          setEmployees(recruiters);
        }
      } catch {
        if (recruiters.length) {
          setEmployees(recruiters);
        }
      }
    };

    loadDepartments();
    loadEmployees();
  }, [recruiters]);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const data = await timeTracking.listTemplates();
        if (Array.isArray(data)) {
          setTemplates(data);
        } else if (Array.isArray(data?.templates)) {
          setTemplates(data.templates);
        }
      } catch {
        setTemplates([]);
      }
    };
    loadTemplates();
  }, []);

  useEffect(() => {
    if (!filters.recruiterId) return;
    const exists = employees.some((emp) => String(emp.id) === String(filters.recruiterId));
    if (!exists) {
      setFilters((prev) => ({ ...prev, recruiterId: "" }));
    }
  }, [employees, filters.recruiterId]);

  const departmentOptions = useMemo(() => {
    if (departments.length) return departments;
    const unique = new Map();
    employees.forEach((emp) => {
      if (emp.department_id && emp.department_name) {
        unique.set(emp.department_id, emp.department_name);
      }
    });
    return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
  }, [departments, employees]);

  const visibleEmployees = useMemo(() => {
    if (!filters.departmentId) return employees;
    return employees.filter(
      (emp) => String(emp.department_id || emp.departmentId || "") === String(filters.departmentId)
    );
  }, [employees, filters.departmentId]);

  const formatClock = (iso, tz) =>
    formatDateTimeInTz(iso, tz || viewerTimezone, {
      ...Intl.DateTimeFormat().resolvedOptions(),
    });

  const handleApprove = async (id) => {
    setActionId(id);
    try {
      await timeTracking.approveEntry(id);
      setSnackbar({
        open: true,
        severity: "success",
        message: "Time entry approved.",
      });
      fetchEntries();
    } catch (err) {
      setSnackbar({
        open: true,
        severity: "error",
        message: err?.response?.data?.error || "Approve failed.",
      });
    } finally {
      setActionId(null);
    }
  };

  const openRejectDialog = (entryId) => {
    setRejectState({ open: true, entryId, reason: "" });
  };

  const submitReject = async () => {
    if (!rejectState.entryId) return;
    setActionId(rejectState.entryId);
    try {
      await timeTracking.rejectEntry(rejectState.entryId, {
        reason: rejectState.reason || undefined,
      });
      setSnackbar({
        open: true,
        severity: "info",
        message: "Time entry rejected.",
      });
      setRejectState({ open: false, entryId: null, reason: "" });
      fetchEntries();
    } catch (err) {
      setSnackbar({
        open: true,
        severity: "error",
        message: err?.response?.data?.error || "Reject failed.",
      });
    } finally {
      setActionId(null);
    }
  };
  const resetBulkForm = () =>
    setBulkForm({
      templateId: "",
      breakMinutes: "",
      breakPaid: true,
    });
  const handleBulkFormChange = (field) => (event) => {
    const value = field === "breakPaid" ? event.target.checked : event.target.value;
    setBulkForm((prev) => ({ ...prev, [field]: value }));
  };
  const closeBulkDialog = () => {
    setBulkDialogOpen(false);
    resetBulkForm();
  };
  const submitBulkAdjust = async () => {
    if (!selectedCount) return;
    const payload = {
      shift_ids: selectedIds,
    };
    if (bulkForm.templateId) {
      payload.template_id = Number(bulkForm.templateId);
    }
    if (bulkForm.breakMinutes) {
      payload.break_minutes = Number(bulkForm.breakMinutes);
    }
    if (typeof bulkForm.breakPaid === "boolean") {
      payload.break_paid = bulkForm.breakPaid;
    }

    setBulkSubmitting(true);
    try {
      await timeTracking.bulkAdjustEntries(payload);
      setSnackbar({
        open: true,
        severity: "success",
        message: "Template applied to selected entries.",
      });
      closeBulkDialog();
      setSelectedIds([]);
      fetchEntries();
    } catch (err) {
      setSnackbar({
        open: true,
        severity: "error",
        message: err?.response?.data?.error || "Bulk update failed.",
      });
    } finally {
      setBulkSubmitting(false);
    }
  };

  return (
    <>
      <Paper elevation={1} sx={{ p: 3, borderRadius: 3, mt: 4 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Time tracking approvals
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review employee punches, approve them for payroll, or send them back with notes.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchEntries}
              disabled={loading}
            >
              Refresh
            </Button>
          </Stack>
        </Stack>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Status"
              value={filters.status}
              onChange={handleChange("status")}
            >
              {statusOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Department"
              value={filters.departmentId}
              onChange={handleDepartmentChange}
            >
              <MenuItem value="">All departments</MenuItem>
              {departmentOptions.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Employee"
              value={filters.recruiterId}
              onChange={handleChange("recruiterId")}
            >
              <MenuItem value="">All employees</MenuItem>
              {visibleEmployees.map((rec) => {
                const displayName = 
                  rec.name ||
                  rec.full_name ||
                  [rec.first_name, rec.last_name].filter(Boolean).join(" ") ||
                  (rec.email ? rec.email : `#${rec.id}`);
                return (
                  <MenuItem key={rec.id} value={rec.id}>
                    {displayName}
                  </MenuItem>
                );
              })}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              type="date"
              fullWidth
              label="From"
              InputLabelProps={{ shrink: true }}
              value={filters.startDate}
              onChange={handleChange("startDate")}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              type="date"
              fullWidth
              label="To"
              InputLabelProps={{ shrink: true }}
              value={filters.endDate}
              onChange={handleChange("endDate")}
            />
          </Grid>
        </Grid>

        {selectedCount > 0 && (
          <Box
            sx={{
              mt: 2,
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {selectedCount} entr{selectedCount === 1 ? "y" : "ies"} selected.
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button size="small" onClick={() => setSelectedIds([])}>
                Clear
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={() => setBulkDialogOpen(true)}
              >
                Apply template
              </Button>
            </Stack>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mt: 2 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={28} />
            </Box>
          ) : entries.length === 0 ? (
            <Typography color="text.secondary">No time entries found for this filter.</Typography>
          ) : (
            <Table size="small" sx={{ mt: 1 }}>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedCount > 0 && selectedCount < entries.length}
                      checked={entries.length > 0 && selectedCount === entries.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Employee</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Clocked</TableCell>
                  <TableCell>Hours</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.includes(entry.id)}
                        onChange={handleSelectOne(entry.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={600}>
                        {entry.recruiter?.name || entry.recruiter?.full_name || `#${entry.recruiter_id}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {entry.recruiter?.email}
                      </Typography>
                    </TableCell>
                    <TableCell>{entry.date}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        In: {formatClock(entry.clock_in, entry.timezone)}
                      </Typography>
                      <Typography variant="body2">
                        Out: {formatClock(entry.clock_out, entry.timezone)}
                      </Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" mt={0.5}>
                        {entry.clock_in_ip && (
                          <Tooltip title={entry.clock_in_device_hint || "Clock-in device"}>
                            <Chip
                              label={`In · ${entry.clock_in_ip}`}
                              color={entry.clock_in_unusual ? "error" : "default"}
                              size="small"
                              variant={entry.clock_in_unusual ? "filled" : "outlined"}
                            />
                          </Tooltip>
                        )}
                        {entry.clock_out_ip && (
                          <Tooltip title={entry.clock_out_device_hint || "Clock-out device"}>
                            <Chip
                              label={`Out · ${entry.clock_out_ip}`}
                              color={entry.clock_out_unusual ? "error" : "default"}
                              size="small"
                              variant={entry.clock_out_unusual ? "filled" : "outlined"}
                            />
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography>{entry.hours_worked_rounded ?? entry.hours_worked}h</Typography>
                      {entry.break_non_compliant ? (
                        <Chip
                          size="small"
                          color="error"
                          label={`Break missing ${entry.break_missing_minutes}m`}
                          sx={{ mt: 0.5 }}
                        />
                      ) : entry.break_taken_minutes ? (
                        <Chip
                          size="small"
                          color="success"
                          variant="outlined"
                          label={`Break ${entry.break_taken_minutes}m`}
                          sx={{ mt: 0.5 }}
                        />
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={entry.status}
                        color={statusColor[entry.status] || "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={
                            entry.status !== "completed" ||
                            actionId === entry.id ||
                            entry.is_locked
                          }
                          onClick={() => handleApprove(entry.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          disabled={actionId === entry.id || entry.is_locked}
                          onClick={() => openRejectDialog(entry.id)}
                        >
                          Reject
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      </Paper>

      <Dialog
        open={rejectState.open}
        onClose={() => setRejectState({ open: false, entryId: null, reason: "" })}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Reject time entry</DialogTitle>
        <DialogContent>
          <TextField
            label="Reason (optional)"
            fullWidth
            multiline
            minRows={2}
            value={rejectState.reason}
            onChange={(e) => setRejectState((prev) => ({ ...prev, reason: e.target.value }))}
            placeholder="Let the employee know what to fix."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectState({ open: false, entryId: null, reason: "" })}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={submitReject}
            disabled={!rejectState.entryId}
          >
            Reject entry
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={bulkDialogOpen} onClose={closeBulkDialog} fullWidth maxWidth="sm">
        <DialogTitle>Apply break template</DialogTitle>
        <DialogContent dividers>
          <DialogContentText sx={{ mb: 2 }}>
            Use a saved shift template or override break minutes for the {selectedCount} selected{" "}
            {selectedCount === 1 ? "entry" : "entries"}. Existing approvals stay in place.
          </DialogContentText>
          <TextField
            select
            fullWidth
            label="Shift template"
            value={bulkForm.templateId}
            onChange={handleBulkFormChange("templateId")}
            helperText="Optional — pulls break window + paid/unpaid from the template."
            margin="normal"
          >
            <MenuItem value="">No template</MenuItem>
            {templateOptions.map((tpl) => (
              <MenuItem key={tpl.id} value={tpl.id}>
                {tpl.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Break minutes override"
            type="number"
            value={bulkForm.breakMinutes}
            onChange={handleBulkFormChange("breakMinutes")}
            helperText="Leave blank to keep the template default. Example: 30"
            margin="normal"
          />
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(bulkForm.breakPaid)}
                onChange={handleBulkFormChange("breakPaid")}
              />
            }
            label="Break is paid"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeBulkDialog}>Cancel</Button>
          <Button
            variant="contained"
            disabled={bulkSubmitting || !selectedCount}
            onClick={submitBulkAdjust}
          >
            {bulkSubmitting ? "Applying..." : "Apply"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default TimeEntriesPanel;
