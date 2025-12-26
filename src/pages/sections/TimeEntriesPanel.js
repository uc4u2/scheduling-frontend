import React, { useEffect, useMemo, useState } from "react";
import api from "../../utils/api";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
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
  Avatar,
} from "@mui/material";
import { DateTime } from "luxon";
import { timeTracking } from "../../utils/api";
import { getUserTimezone } from "../../utils/timezone";
import RefreshIcon from "@mui/icons-material/Refresh";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LogoutIcon from "@mui/icons-material/Logout";
import DeleteIcon from "@mui/icons-material/Delete";

const statusColor = {
  assigned: "default",
  in_progress: "warning",
  completed: "info",
  approved: "success",
  rejected: "error",
};

const palette = {
  accent: "#FF7A3C",
  success: "#21A179",
  warning: "#FFB020",
  error: "#E53935",
  info: "#4C6FFF",
  neutralText: "#64748B",
  neutralBg: "#EEF2F7",
};

const SummaryCard = ({ label, value, icon }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      borderRadius: 3,
      border: (theme) => `1px solid ${theme.palette.divider}`,
      background: "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(245,247,250,0.9))",
      flex: 1,
      minWidth: 180,
    }}
  >
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: "14px",
          bgcolor: `${palette.accent}1A`,
          color: palette.accent,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
        }}
      >
        {icon || "•"}
      </Box>
      <Box>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h6" fontWeight={800}>
          {value}
        </Typography>
      </Box>
    </Stack>
  </Paper>
);

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
  const [roster, setRoster] = useState([]);
  const [rosterCollapsed, setRosterCollapsed] = useState(false);
  const [rosterUpdatedAt, setRosterUpdatedAt] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailEmployee, setDetailEmployee] = useState(null);
  const [detailEntries, setDetailEntries] = useState([]);
  const [detailSummary, setDetailSummary] = useState(null);
  const [detailFilters, setDetailFilters] = useState(() => {
    const today = new Date();
    const end = today.toISOString().slice(0, 10);
    const start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return { startDate: start, endDate: end, status: "all" };
  });
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const recruiterMap = useMemo(() => {
    const map = {};
    (employees || []).forEach((r) => {
      if (!r || typeof r !== "object") return;
      const id = r.id || r.recruiter_id;
      if (!id) return;
      map[id] = r;
    });
    return map;
  }, [employees]);

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
  const rosterStats = useMemo(() => {
    const active = roster.length;
    const onBreak = roster.filter((person) => person.break_in_progress).length;
    return { active, onBreak };
  }, [roster]);
  const pendingCount = useMemo(
    () => entries.filter((e) => e.status === "completed").length,
    [entries]
  );
  const hoursToday = useMemo(() => {
    const targetDate = filters.startDate === filters.endDate ? filters.startDate : null;
    return entries.reduce((sum, e) => {
      if (targetDate && e.date !== targetDate) return sum;
      const hrs = Number(e.hours_worked_rounded ?? e.hours_worked ?? 0);
      return sum + (Number.isFinite(hrs) ? hrs : 0);
    }, 0);
  }, [entries, filters.startDate, filters.endDate]);
  const clockedInCount = rosterStats.active;
  const onBreakCount = rosterStats.onBreak;
  const detailEmployeeName = useMemo(() => {
    if (!detailEmployee) return "";
    const idLabel = detailEmployee.id ? `#${detailEmployee.id}` : "";
    const full = `${detailEmployee.first_name || ""} ${detailEmployee.last_name || ""}`.trim();
    return detailEmployee.name || detailEmployee.full_name || full || detailEmployee.email || idLabel;
  }, [detailEmployee]);
  const detailStats = useMemo(() => {
    if (!Array.isArray(detailEntries) || !detailEntries.length) {
      return {
        total: 0,
        breakCompliance: null,
        breakNonCompliant: 0,
        unusualIPs: 0,
        rejected: 0,
        approved: 0,
        inProgress: 0,
        anomalies: 0,
        maxBreakMissing: 0,
      };
    }
    let breakNon = 0;
    let unusual = 0;
    let rejected = 0;
    let approved = 0;
    let inProgress = 0;
    let anomalies = 0;
    let maxBreakMissing = 0;
    detailEntries.forEach((e) => {
      if (e.break_non_compliant) breakNon += 1;
      if (e.clock_in_unusual || e.clock_out_unusual) unusual += 1;
      if (e.status === "rejected") rejected += 1;
      if (e.status === "approved") approved += 1;
      if (e.status === "in_progress") inProgress += 1;
      const missing = Number(e.break_missing_minutes || 0);
      if (missing > maxBreakMissing) maxBreakMissing = missing;
    });
    anomalies = breakNon + unusual + rejected;
    const total = detailEntries.length;
    const breakCompliance = total ? Math.round(((total - breakNon) / total) * 100) : null;
    return {
      total,
      breakCompliance,
      breakNonCompliant: breakNon,
      unusualIPs: unusual,
      rejected,
      approved,
      inProgress,
      anomalies,
      maxBreakMissing,
    };
  }, [detailEntries]);

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
      setRoster(Array.isArray(data.roster) ? data.roster : []);
      setRosterUpdatedAt(new Date());
    } catch (err) {
      setEntries([]);
      setRoster([]);
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
        const res = await api.get(`/api/departments`, { headers });
        const data = res.data;
        if (Array.isArray(data)) {
          setDepartments(data.map((dept) => ({ id: dept.id, name: dept.name })));
        }
      } catch {
        setDepartments([]);
      }
    };

    const loadEmployees = async () => {
      try {
        const res = await api.get(`/manager/recruiters`, { headers });
        const data = res.data;
        const normalize = (arr = []) =>
          arr.map((r) => {
            const role = ["recruiter", "manager"].includes(r.role) ? r.role : "recruiter";
            return { ...r, role };
          });
        if (Array.isArray(data?.recruiters)) {
          setEmployees(normalize(data.recruiters));
        } else if (Array.isArray(data)) {
          setEmployees(normalize(data));
        } else if (recruiters.length) {
          setEmployees(normalize(recruiters));
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

  useEffect(() => {
    if (detailOpen) {
      loadDetailHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailOpen, detailFilters.startDate, detailFilters.endDate, detailFilters.status]);

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

  const formatClock = (iso, tz) => {
    if (!iso) return "—";
    try {
      return DateTime.fromISO(iso, { zone: "utc" })
        .setZone(tz || viewerTimezone)
        .toFormat("MMM d, yyyy, hh:mm:ss a");
    } catch {
      return iso;
    }
  };
  const formatClockShort = (iso, tz) => {
    if (!iso) return "—";
    try {
      return DateTime.fromISO(iso, { zone: "utc" })
        .setZone(tz || viewerTimezone)
        .toFormat("LLL d, HH:mm");
    } catch {
      return iso;
    }
  };
  const formatRosterClock = (iso, tz) => {
    if (!iso) return "—";
    try {
      return DateTime.fromISO(iso, { zone: "utc" })
        .setZone(tz || viewerTimezone)
        .toFormat("hh:mm a");
    } catch {
      return iso;
    }
  };
  const anomalyChips = (entry) => {
    const chips = [];
    if (entry.device_new) {
      chips.push(
        <Chip
          key="device_new"
          size="small"
          label="New device"
          sx={{ bgcolor: "rgba(76,111,255,0.12)", color: palette.info, fontWeight: 600 }}
        />
      );
    }
    if (entry.location_new) {
      chips.push(
        <Chip
          key="location_new"
          size="small"
          label="New location"
          sx={{ bgcolor: "rgba(255,176,32,0.14)", color: "#B9780C", fontWeight: 600 }}
        />
      );
    }
    if (entry.multi_ip_same_day) {
      chips.push(
        <Chip
          key="multi_ip"
          size="small"
          label="Multiple IPs"
          sx={{ bgcolor: "rgba(255,122,60,0.12)", color: palette.accent, fontWeight: 600 }}
        />
      );
    }
    if (entry.outside_trusted) {
      chips.push(
        <Chip
          key="outside_trusted"
          size="small"
          label="Outside trusted IPs"
          sx={{ bgcolor: "rgba(229,57,53,0.12)", color: palette.error, fontWeight: 600 }}
        />
      );
    }
    return chips;
  };
  const rosterUpdatedLabel = useMemo(() => {
    if (!rosterUpdatedAt) return null;
    try {
      return DateTime.fromJSDate(rosterUpdatedAt).setZone(viewerTimezone).toFormat("hh:mm:ss a");
    } catch {
      return null;
    }
  }, [rosterUpdatedAt, viewerTimezone]);

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

  const handleDelete = async (id) => {
    const confirm = window.confirm("Delete this time entry? This cannot be undone.");
    if (!confirm) return;
    setActionId(id);
    try {
      await timeTracking.deleteEntry(id);
      setEntries((prev) => prev.filter((e) => String(e.id) !== String(id)));
      setSnackbar({
        open: true,
        severity: "success",
        message: "Time entry deleted.",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        severity: "error",
        message: err?.response?.data?.error || "Failed to delete entry.",
      });
    } finally {
      setActionId(null);
    }
  };

  const handleForceClockOut = async (id) => {
    setActionId(id);
    try {
      await timeTracking.forceClockOut(id);
      setSnackbar({
        open: true,
        severity: "warning",
        message: "Clock-out forced.",
      });
      fetchEntries();
    } catch (err) {
      setSnackbar({
        open: true,
        severity: "error",
        message: err?.response?.data?.error || "Failed to force clock-out.",
      });
    } finally {
      setActionId(null);
    }
  };

  const openHistoryDetail = (entry) => {
    const base = entry.recruiter || {};
    const id = base.id || entry.recruiter_id;
    const first = base.first_name || entry.first_name || "";
    const last = base.last_name || entry.last_name || "";
    const full = base.full_name || `${first} ${last}`.trim();
    const name =
      base.name ||
      full ||
      base.email ||
      entry.recruiter?.email ||
      (id ? `#${id}` : "");
    const email = base.email || entry.recruiter?.email || entry.email;
    setDetailEmployee({
      id,
      name,
      full_name: full,
      first_name: first,
      last_name: last,
      email,
    });
    setDetailOpen(true);
  };

  const handleDetailFilterChange = (key) => (event) => {
    const value = event.target.value;
    setDetailFilters((prev) => ({ ...prev, [key]: value }));
  };

  const loadDetailHistory = async () => {
    if (!detailEmployee) return;
    setDetailLoading(true);
    setDetailError("");
    try {
      const data = await timeTracking.managerHistory({
        recruiter_id: detailEmployee.id,
        start_date: detailFilters.startDate,
        end_date: detailFilters.endDate,
        status: detailFilters.status !== "all" ? detailFilters.status : undefined,
      });
      setDetailEntries(Array.isArray(data?.entries) ? data.entries : []);
      setDetailSummary(data?.summary || null);
    } catch (err) {
      setDetailEntries([]);
      setDetailSummary(null);
      setDetailError(err?.response?.data?.error || "Failed to load history.");
    } finally {
      setDetailLoading(false);
    }
  };

  const downloadDetailCsv = () => {
    if (!detailEmployee || !detailEntries.length) {
      setSnackbar({ open: true, severity: "error", message: "Nothing to download." });
      return;
    }

    const csvEscape = (val) => {
      if (val === null || val === undefined) return "";
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const lines = [];
    lines.push("Summary,,,,,,,,,,,");
    lines.push(
      [
        "Employee",
        csvEscape(detailEmployeeName || detailEmployee.email || detailEmployee.id),
        "", "", "", "", "", "", "", "", "",
      ].join(",")
    );
    lines.push(
      [
        "Range",
        `${csvEscape(detailFilters.startDate)} to ${csvEscape(detailFilters.endDate)}`,
        "", "", "", "", "", "", "", "", "",
      ].join(",")
    );
    lines.push(
      ["Hours", csvEscape(detailSummary?.hours_worked ?? 0), "", "", "", "", "", "", "", "", ""].join(",")
    );
    lines.push(
      ["Overtime", csvEscape(detailSummary?.overtime_hours ?? 0), "", "", "", "", "", "", "", "", ""].join(",")
    );
    const padSummary = (label, value) => [label, value, ...Array(12).fill("")].join(",");
    lines.push(padSummary("Break minutes", csvEscape(detailSummary?.break_minutes ?? 0)));
    lines.push(padSummary("Missed breaks", csvEscape(detailSummary?.missed_breaks ?? 0)));
    if (detailStats.breakCompliance !== null) {
      lines.push(padSummary("Break compliance", csvEscape(`${detailStats.breakCompliance}%`)));
    }
    lines.push(padSummary("Anomalies", csvEscape(detailStats.anomalies)));
    lines.push(padSummary("Unusual IPs", csvEscape(detailStats.unusualIPs)));
    if (detailStats.maxBreakMissing > 0) {
      lines.push(padSummary("Max break missing", csvEscape(`${detailStats.maxBreakMissing}m`)));
    }
    lines.push(new Array(18).fill("").join(",")); // blank line before detail rows
    lines.push(
      [
        "Employee",
        "Date",
        "Clock In",
        "Clock Out",
        "Timezone",
        "Hours",
        "Break minutes",
        "Break required",
        "Break missing",
        "Shift deviation (m)",
        "Status",
        "Device new",
        "New location",
        "Multi IP (day)",
        "Outside trusted",
        "Approved by",
        "Clock-in IP",
        "Clock-out IP",
      ].join(",")
    );

    detailEntries.forEach((entry) => {
      lines.push(
        [
          csvEscape(detailEmployeeName || detailEmployee.email || detailEmployee.id),
          csvEscape(entry.date),
          csvEscape(formatClockShort(entry.clock_in, entry.timezone)),
          csvEscape(formatClockShort(entry.clock_out, entry.timezone)),
          csvEscape(entry.timezone || ""),
          csvEscape(entry.hours_worked_rounded ?? entry.hours_worked),
          csvEscape(entry.break_minutes || 0),
          csvEscape(entry.break_required_minutes || 0),
          csvEscape(entry.break_missing_minutes || 0),
          csvEscape(entry.shift_deviation_minutes ?? ""),
          csvEscape(entry.status),
          csvEscape(entry.device_new ? "1" : "0"),
          csvEscape(entry.location_new ? "1" : "0"),
          csvEscape(entry.multi_ip_same_day ? "1" : "0"),
          csvEscape(entry.outside_trusted ? "1" : "0"),
          csvEscape(entry.approved_by_name || ""),
          csvEscape(entry.clock_in_ip || ""),
          csvEscape(entry.clock_out_ip || ""),
        ].join(",")
      );
    });

    try {
      const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `time_entries_${detailEmployeeName || "employee"}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setSnackbar({ open: true, severity: "error", message: "Unable to download CSV." });
    }
  };

  const downloadDetailPdf = async () => {
    if (!detailEmployee || !detailEntries.length) {
      setSnackbar({ open: true, severity: "error", message: "Nothing to download." });
      return;
    }
    const recruiterId =
      detailEmployee.id ||
      detailEmployee.recruiter_id ||
      (detailEntries.length ? detailEntries[0].recruiter_id : null);
    if (!recruiterId) {
      setSnackbar({ open: true, severity: "error", message: "Missing employee id for export." });
      return;
    }
    try {
      const params = new URLSearchParams({
        recruiter_id: recruiterId,
        start_date: detailFilters.startDate,
        end_date: detailFilters.endDate,
        format: "pdf",
      });
      if (detailFilters.status && detailFilters.status !== "all") {
        params.set("status", detailFilters.status);
      }
      const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : "";
      const res = await api.get(`/manager/time-entries/history?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        responseType: "blob",
      });
      const ct = res.headers?.["content-type"] || "";
      const blob = res.data;
      if (blob.size === 0 || (ct && !ct.includes("pdf"))) {
        setSnackbar({ open: true, severity: "error", message: "PDF export returned an empty file." });
        return;
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `time_entries_${detailEmployeeName || "employee"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setSnackbar({ open: true, severity: "success", message: "PDF downloaded." });
    } catch (err) {
      setSnackbar({ open: true, severity: "error", message: "Unable to download PDF." });
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
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <SummaryCard label="Clocked in now" value={clockedInCount} />
            <SummaryCard label="On break now" value={onBreakCount} />
            <SummaryCard label="Pending approvals" value={pendingCount} />
            <SummaryCard label="Hours (range)" value={hoursToday.toFixed(2)} />
          </Stack>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={1} sx={{ p: 3, borderRadius: 3 }}>
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
                  helperText="Choose one employee or leave as All employees to see everyone."
                >
                  <MenuItem value="">All employees (show everyone)</MenuItem>
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
                      <TableCell>Anomalies</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {entries.map((entry) => {
                      const r =
                        entry.recruiter ||
                        recruiterMap[entry.recruiter_id] ||
                        {};
                      const name =
                        r.name ||
                        r.full_name ||
                        `${(r.first_name || "").trim()} ${(r.last_name || "").trim()}`.trim() ||
                        entry.recruiter?.name ||
                        entry.recruiter?.full_name ||
                        entry.recruiter?.email ||
                        `#${entry.recruiter_id}`;
                      const email = r.email || entry.recruiter?.email;
                      const avatarSrc = r.profile_image_url || r.avatar || undefined;
                      const avatarAlt = name || email || "Employee";
                      const breakChips = (
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" mt={0.5} useFlexGap>
                          {entry.break_schedule_label && (
                            <Chip
                              size="small"
                              variant="outlined"
                              color="info"
                              label={`Scheduled ${entry.break_schedule_label}`}
                            />
                          )}
                          {entry.break_plan_max_simultaneous && (
                            <Chip
                              size="small"
                              variant="outlined"
                              label={`Max ${entry.break_plan_max_simultaneous} on break`}
                            />
                          )}
                          {entry.break_non_compliant ? (
                            <Chip
                              size="small"
                              sx={{
                                bgcolor: "rgba(229,57,53,0.10)",
                                color: palette.error,
                                fontWeight: 600,
                              }}
                              label={`Break missing ${entry.break_missing_minutes}m`}
                            />
                          ) : entry.break_taken_minutes ? (
                            <Chip
                              size="small"
                              sx={{
                                bgcolor: "rgba(33,161,121,0.12)",
                                color: palette.success,
                                fontWeight: 600,
                              }}
                              label={`Break ${entry.break_taken_minutes}m`}
                            />
                          ) : null}
                          {entry.break_auto_enforced && (
                            <Tooltip title={entry.break_auto_reason || "Break auto-enforced"}>
                              <Chip
                                size="small"
                                sx={{
                                  bgcolor: "rgba(255,176,32,0.14)",
                                  color: "#B9780C",
                                  fontWeight: 600,
                                }}
                                label={
                                  entry.break_auto_reason
                                    ? `Auto break · ${entry.break_auto_reason}`
                                    : "Auto break enforced"
                                }
                              />
                            </Tooltip>
                          )}
                        </Stack>
                      );
                      return (
                        <TableRow key={entry.id} hover>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedIds.includes(entry.id)}
                              onChange={handleSelectOne(entry.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              onClick={() => {
                                openHistoryDetail({
                                  ...entry.recruiter,
                                  id: entry.recruiter_id,
                                });
                              }}
                              sx={{ p: 0, textTransform: "none" }}
                            >
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Avatar
                                  src={avatarSrc}
                                  alt={avatarAlt}
                                  sx={{ width: 36, height: 36 }}
                                >
                                  {(name || avatarAlt || "E").charAt(0)}
                                </Avatar>
                                <Box textAlign="left">
                                  <Typography fontWeight={600}>
                                    {name}
                                  </Typography>
                                  {email && (
                                    <Typography variant="caption" color="text.secondary">
                                      {email}
                                    </Typography>
                                  )}
                                </Box>
                              </Stack>
                            </Button>
                          </TableCell>
                          <TableCell>{entry.date}</TableCell>
                          <TableCell>
                            <Stack spacing={0.5}>
                              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                <Chip size="small" variant="outlined" label="In" />
                                <Typography variant="body2">{formatClock(entry.clock_in, entry.timezone)}</Typography>
                                {entry.clock_in_ip && (
                                  <Tooltip title={entry.clock_in_device_hint || "Clock-in device"}>
                                    <Chip
                                      label={entry.clock_in_ip}
                                      color={entry.clock_in_unusual ? "error" : "default"}
                                      size="small"
                                      variant={entry.clock_in_unusual ? "filled" : "outlined"}
                                    />
                                  </Tooltip>
                                )}
                              </Stack>
                              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                <Chip size="small" variant="outlined" label="Out" />
                                <Typography variant="body2">{formatClock(entry.clock_out, entry.timezone)}</Typography>
                                {entry.clock_out_ip && (
                                  <Tooltip title={entry.clock_out_device_hint || "Clock-out device"}>
                                    <Chip
                                      label={entry.clock_out_ip}
                                      color={entry.clock_out_unusual ? "error" : "default"}
                                      size="small"
                                      variant={entry.clock_out_unusual ? "filled" : "outlined"}
                                    />
                                  </Tooltip>
                                )}
                              </Stack>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Stack spacing={0.5}>
                              <Typography>{entry.hours_worked_rounded ?? entry.hours_worked}h</Typography>
                              {breakChips}
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                              {anomalyChips(entry)}
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Stack spacing={0.5}>
                              <Chip
                                label={entry.status}
                                size="small"
                                sx={{
                                  bgcolor:
                                    entry.status === "in_progress"
                                      ? "rgba(255,122,60,0.12)"
                                      : entry.status === "approved"
                                      ? "rgba(33,161,121,0.12)"
                                      : entry.status === "rejected"
                                      ? "rgba(229,57,53,0.12)"
                                      : palette.neutralBg,
                                  color:
                                    entry.status === "in_progress"
                                      ? palette.accent
                                      : entry.status === "approved"
                                      ? palette.success
                                      : entry.status === "rejected"
                                      ? palette.error
                                      : palette.neutralText,
                                  fontWeight: 600,
                                }}
                              />
                            </Stack>
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
                              <Button
                                size="small"
                                variant="outlined"
                                disabled={
                                  entry.status !== "completed" ||
                                  actionId === entry.id ||
                                  entry.is_locked
                                }
                                onClick={() => handleApprove(entry.id)}
                                sx={{
                                  borderColor: palette.accent,
                                  color: palette.accent,
                                  fontWeight: 600,
                                }}
                              >
                                Approve
                              </Button>
                              {entry.status === "in_progress" && (
                                <Tooltip title="Force clock-out when the employee forgot to punch out. Logs your name.">
                                  <span>
                                    <Button
                                      size="small"
                                      sx={{
                                        borderColor: palette.warning,
                                        color: palette.warning,
                                        fontWeight: 600,
                                      }}
                                      variant="outlined"
                                      startIcon={<LogoutIcon fontSize="small" />}
                                      disabled={actionId === entry.id || entry.is_locked}
                                      onClick={() => handleForceClockOut(entry.id)}
                                    >
                                      Force out
                                    </Button>
                                  </span>
                                </Tooltip>
                              )}
                              <Button
                                size="small"
                                color="error"
                                disabled={actionId === entry.id || entry.is_locked}
                                onClick={() => openRejectDialog(entry.id)}
                              >
                                Reject
                              </Button>
                              <Tooltip title="Delete this entry">
                                <span>
                                  <Button
                                    size="small"
                                    color="error"
                                    variant="text"
                                    startIcon={<DeleteIcon fontSize="small" />}
                                    disabled={actionId === entry.id}
                                    onClick={() => handleDelete(entry.id)}
                                  >
                                    Delete
                                  </Button>
                                </span>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

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

      <Paper
        elevation={0}
        sx={{
          mt: 4,
          p: 3,
          borderRadius: 3,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          background: (theme) => theme.palette.background.paper,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
              Live roster
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Who’s clocked in right now
            </Typography>
            {rosterUpdatedLabel && (
              <Typography variant="caption" color="text.secondary">
                Updated {rosterUpdatedLabel}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              color="primary"
              variant="outlined"
              label={`${rosterStats.active} active`}
            />
            <Chip
              size="small"
              color={rosterStats.onBreak ? "warning" : "default"}
              variant="outlined"
              label={`${rosterStats.onBreak} on break`}
            />
            <Tooltip title={rosterCollapsed ? "Expand roster" : "Collapse roster"}>
              <IconButton size="small" onClick={() => setRosterCollapsed((prev) => !prev)}>
                {rosterCollapsed ? <ExpandMoreIcon fontSize="small" /> : <ExpandLessIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh roster">
              <span>
                <IconButton size="small" onClick={fetchEntries} disabled={loading}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>
        <Collapse in={!rosterCollapsed} timeout="auto" unmountOnExit>
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={24} />
            </Box>
          ) : roster.length ? (
            <Grid container spacing={2} sx={{ mt: 2 }}>
              {roster.map((active) => (
                <Grid item xs={12} sm={6} md={4} key={active.id}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      height: "100%",
                      borderColor: (theme) =>
                        active.break_in_progress
                          ? theme.palette.warning.light
                          : theme.palette.divider,
                    }}
                  >
                    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 0.5 }}>
                      <Avatar
                        src={active.profile_image_url || active.avatar || undefined}
                        alt={active.employee_name || "Employee"}
                        sx={{ width: 40, height: 40 }}
                      >
                        {(active.employee_name || "E").charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography fontWeight={600}>{active.employee_name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Clocked in {formatRosterClock(active.clock_in, active.timezone)}
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                      <Chip
                        size="small"
                        color={statusColor[active.status] || "default"}
                        label={active.status}
                      />
                      {(() => {
                        if (active.break_in_progress) {
                          const elapsed = Number.isFinite(active.break_elapsed_minutes)
                            ? `${active.break_elapsed_minutes}m`
                            : null;
                          const required = Number.isFinite(active.break_required_minutes)
                            ? `${active.break_required_minutes}m`
                            : null;
                          const overage =
                            Number.isFinite(active.break_elapsed_minutes) &&
                            Number.isFinite(active.break_required_minutes) &&
                            active.break_elapsed_minutes > active.break_required_minutes;

                          const label = overage
                            ? `On break · ${active.break_elapsed_minutes}m (over)`
                            : required && elapsed
                            ? `On break · ${elapsed} / ${required}`
                            : elapsed
                            ? `On break · ${elapsed}`
                            : "On break";

                          return (
                            <Chip
                              size="small"
                              color={overage ? "error" : "warning"}
                              label={label}
                              variant={overage ? "filled" : "outlined"}
                            />
                          );
                        }
                        return <Chip size="small" variant="outlined" label="On shift" />;
                      })()}
                      {active.break_slot?.start && active.break_slot?.end && (
                        <Chip
                          size="small"
                          variant="outlined"
                          color="info"
                          label={`Slot ${active.break_slot.start}–${active.break_slot.end}`}
                        />
                      )}
                      {active.timezone && (
                        <Chip size="small" variant="outlined" label={active.timezone} />
                      )}
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              No one is clocked in right now.
            </Typography>
          )}
        </Collapse>
      </Paper>

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

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} fullWidth maxWidth="lg">
        <DialogTitle>
          {detailEmployeeName ? `Time history · ${detailEmployeeName}` : "Time history"}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                type="date"
                label="From"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={detailFilters.startDate}
                onChange={handleDetailFilterChange("startDate")}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                type="date"
                label="To"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={detailFilters.endDate}
                onChange={handleDetailFilterChange("endDate")}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                label="Status"
                fullWidth
                value={detailFilters.status}
                onChange={handleDetailFilterChange("status")}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="in_progress">In progress</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <Stack direction="row" spacing={1} mt={2} flexWrap="wrap" useFlexGap>
            <Chip
              label={`Hours: ${detailSummary?.hours_worked ?? 0}`}
              variant="outlined"
              color="primary"
            />
            <Chip
              label={`Overtime: ${detailSummary?.overtime_hours ?? 0}`}
              variant="outlined"
              color={detailSummary?.overtime_hours ? "warning" : "default"}
            />
            <Chip
              label={`Break minutes: ${detailSummary?.break_minutes ?? 0}`}
              variant="outlined"
            />
            <Chip
              label={`Missed breaks: ${detailSummary?.missed_breaks ?? 0}`}
              variant="outlined"
              color={detailSummary?.missed_breaks ? "error" : "default"}
            />
            {detailStats.breakCompliance !== null && (
              <Chip
                label={`Break compliance: ${detailStats.breakCompliance}%`}
                color={detailStats.breakCompliance < 90 ? "warning" : "success"}
                variant="outlined"
              />
            )}
            <Chip
              label={`Anomalies: ${detailStats.anomalies}`}
              color={detailStats.anomalies ? "error" : "default"}
              variant={detailStats.anomalies ? "filled" : "outlined"}
            />
            {detailStats.unusualIPs > 0 && (
              <Chip
                label={`Unusual IPs: ${detailStats.unusualIPs}`}
                color="warning"
                variant="outlined"
              />
            )}
            {detailStats.maxBreakMissing > 0 && (
              <Chip
                label={`Max break missing: ${detailStats.maxBreakMissing}m`}
                color="error"
                variant="outlined"
              />
            )}
          </Stack>

          {detailError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {detailError}
            </Alert>
          )}

          <Box sx={{ mt: 2 }}>
            {detailLoading ? (
              <Box display="flex" justifyContent="center" py={3}>
                <CircularProgress size={24} />
              </Box>
            ) : detailEntries.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No entries for this range.
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Clocked</TableCell>
                    <TableCell>Hours</TableCell>
                    <TableCell>Deviation</TableCell>
                    <TableCell>Breaks</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detailEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          In: {formatClockShort(entry.clock_in, entry.timezone)}
                        </Typography>
                        <Typography variant="body2">
                          Out: {formatClockShort(entry.clock_out, entry.timezone)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {entry.clock_in_ip ? `IP: ${entry.clock_in_ip}` : ""}
                        </Typography>
                      </TableCell>
                      <TableCell>{entry.hours_worked_rounded ?? entry.hours_worked}h</TableCell>
                      <TableCell>
                        {entry.shift_deviation_minutes !== null && entry.shift_deviation_minutes !== undefined ? (
                          <Chip
                            size="small"
                            label={`${entry.shift_deviation_minutes}m`}
                            color={
                              entry.shift_deviation_minutes > 0
                                ? "success"
                                : entry.shift_deviation_minutes < 0
                                ? "warning"
                                : "default"
                            }
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={`${entry.break_minutes || 0}m`}
                          color={entry.break_non_compliant ? "error" : "default"}
                          variant={entry.break_non_compliant ? "filled" : "outlined"}
                        />
                        {entry.break_missing_minutes > 0 && (
                          <Typography variant="caption" color="error.main" sx={{ display: "block" }}>
                            Missing {entry.break_missing_minutes}m
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={entry.status} />
                        {entry.approved_by_name && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            By {entry.approved_by_name}
                          </Typography>
                        )}
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                          {anomalyChips(entry)}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={downloadDetailCsv} disabled={!detailEntries.length}>
            Download CSV
          </Button>
          <Button onClick={downloadDetailPdf} disabled={!detailEntries.length}>
            Download PDF
          </Button>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TimeEntriesPanel;
