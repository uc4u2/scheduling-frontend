import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Grid,
  Link,
  Paper,
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { DateTime } from "luxon";
import api, { timeTracking } from "../../utils/api";
import { getUserTimezone } from "../../utils/timezone";
import ThemedDateField from "../../components/ui/ThemedDateField";

const formatDateTime = (value, timezone) => {
  if (!value) return "—";
  try {
    return DateTime.fromISO(value, { zone: "utc" }).setZone(timezone || "UTC").toFormat("LLL d, yyyy HH:mm");
  } catch {
    return value;
  }
};

const mapLink = (loc) => {
  if (!loc?.has_location) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${loc.lat},${loc.lng}`)}`;
};

const locationStateChipSx = (location) => (theme) => {
  const isDenied = location?.permission_state === "denied";
  const base = location?.has_location
    ? theme.palette.success.main
    : isDenied
    ? theme.palette.warning.main
    : theme.palette.text.secondary;
  return {
    color: theme.palette.text.primary,
    bgcolor: alpha(base, 0.14),
    border: `1px solid ${alpha(base, 0.38)}`,
    fontWeight: 800,
    "& .MuiChip-label": {
      color: "inherit",
    },
  };
};

const slowLocationChipSx = (theme) => ({
  color: theme.palette.text.primary,
  bgcolor: alpha(theme.palette.warning.main, 0.14),
  border: `1px solid ${alpha(theme.palette.warning.main, 0.42)}`,
  fontWeight: 800,
  "& .MuiChip-label": {
    color: "inherit",
  },
});

const LocationCell = ({ location }) => {
  if (!location?.has_location && !location?.permission_state) {
    return <Typography color="text.secondary">No evidence</Typography>;
  }
  const href = mapLink(location);
  return (
    <Stack spacing={0.5}>
      <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
        <Chip
          size="small"
          label={location.permission_state || "unknown"}
          sx={locationStateChipSx(location)}
        />
        {Number(location.capture_delay_ms) > 5000 && (
          <Chip size="small" label="Slow location" sx={slowLocationChipSx} />
        )}
        {location.has_location && href && (
          <Link href={href} target="_blank" rel="noreferrer" underline="hover">
            Open map
          </Link>
        )}
      </Stack>
      {location.has_location && (
        <Typography variant="body2">
          {Number(location.lat).toFixed(6)}, {Number(location.lng).toFixed(6)}
        </Typography>
      )}
      {location.accuracy_m != null && (
        <Typography variant="caption" color="text.secondary">
          Accuracy: {Math.round(Number(location.accuracy_m))}m
        </Typography>
      )}
    </Stack>
  );
};

const PunchLocationsPanel = () => {
  const viewerTimezone = getUserTimezone();
  const today = useMemo(() => DateTime.local().toISODate(), []);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({
    recruiter_id: "",
    department_id: "",
    start_date: today,
    end_date: today,
  });
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await timeTracking.listPunchLocations(filters);
      setItems(Array.isArray(data?.items) ? data.items : []);
      setSummary(data?.summary || null);
      setPolicy(data?.policy || null);
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to load punch locations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const loadDepartments = async () => {
      try {
        const res = await api.get("/api/departments", { headers });
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
        const res = await api.get("/manager/recruiters", {
          headers,
        });
        const data = res.data;
        const rows = Array.isArray(data?.recruiters) ? data.recruiters : Array.isArray(data) ? data : [];
        setEmployees(rows);
      } catch {
        setEmployees([]);
      }
    };

    loadDepartments();
    loadEmployees();
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.start_date, filters.end_date, filters.department_id, filters.recruiter_id]);

  const handleFilter = (key) => (event) => {
    setFilters((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleDepartmentChange = (event) => {
    const value = event.target.value;
    setFilters((prev) => {
      let recruiterId = prev.recruiter_id;
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
      return { ...prev, department_id: value, recruiter_id: recruiterId };
    });
  };

  const applyDatePreset = (preset) => {
    const now = DateTime.local();
    let start = now;
    let end = now;
    if (preset === "this_week") {
      start = now.startOf("week");
      end = now.endOf("week");
    } else if (preset === "last_week") {
      start = now.startOf("week").minus({ weeks: 1 });
      end = start.endOf("week");
    }
    setFilters((prev) => ({
      ...prev,
      start_date: start.toISODate(),
      end_date: end.toISODate(),
    }));
  };

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
    if (!filters.department_id) return employees;
    return employees.filter(
      (emp) => String(emp.department_id || emp.departmentId || "") === String(filters.department_id)
    );
  }, [employees, filters.department_id]);

  return (
    <Stack spacing={2.5}>
      <Paper elevation={0} sx={{ p: 2, borderRadius: 1, border: (theme) => `1px solid ${theme.palette.divider}` }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6" fontWeight={800}>
              Punch Locations
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Advisory GPS evidence captured only when employees tap Clock In or Clock Out. This is review-only and never blocks a punch.
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="Department"
                value={filters.department_id}
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
                value={filters.recruiter_id}
                onChange={handleFilter("recruiter_id")}
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
              <ThemedDateField
                fullWidth
                label="From"
                value={filters.start_date}
                onChange={handleFilter("start_date")}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <ThemedDateField
                fullWidth
                label="To"
                value={filters.end_date}
                onChange={handleFilter("end_date")}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ height: "100%" }}>
                <Button size="small" variant="outlined" onClick={() => applyDatePreset("today")}>
                  Today
                </Button>
                <Button size="small" variant="outlined" onClick={() => applyDatePreset("this_week")}>
                  This week
                </Button>
                <Button size="small" variant="outlined" onClick={() => applyDatePreset("last_week")}>
                  Last week
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button variant="contained" onClick={load} disabled={loading}>
                Refresh
              </Button>
            </Grid>
          </Grid>
        </Stack>
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={2}>
        {[
          ["Mode", policy?.punch_location_mode || "off"],
          ["Punches with evidence", summary?.with_location ?? 0],
          ["Missing location", summary?.missing_location ?? 0],
          ["Permission denied", summary?.permission_denied ?? 0],
        ].map(([label, value]) => (
          <Grid item xs={12} sm={6} md={3} key={label}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 1, border: (theme) => `1px solid ${theme.palette.divider}` }}>
              <Typography variant="body2" color="text.secondary">
                {label}
              </Typography>
              <Typography variant="h6" fontWeight={800}>
                {value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={0} sx={{ borderRadius: 1, overflow: "hidden", border: (theme) => `1px solid ${theme.palette.divider}` }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={5}>
            <CircularProgress size={26} />
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Clock In</TableCell>
                <TableCell>Clock In Location</TableCell>
                <TableCell>Clock Out</TableCell>
                <TableCell>Clock Out Location</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.shift_id} hover>
                  <TableCell>
                    <Stack spacing={0.25}>
                      <Typography fontWeight={700}>{item.employee?.name || item.employee?.email || item.employee?.id}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.employee?.email}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>{formatDateTime(item.clock_in, item.timezone || viewerTimezone)}</TableCell>
                  <TableCell><LocationCell location={item.clock_in_location} /></TableCell>
                  <TableCell>{formatDateTime(item.clock_out, item.timezone || viewerTimezone)}</TableCell>
                  <TableCell><LocationCell location={item.clock_out_location} /></TableCell>
                </TableRow>
              ))}
              {!items.length && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography color="text.secondary" align="center" py={3}>
                      No punch location evidence found for this range.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Stack>
  );
};

export default PunchLocationsPanel;
