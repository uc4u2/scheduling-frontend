// src/pages/sections/AvailableShiftsCalendar.js
import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import axios from "axios";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Paper,
  Tooltip,
} from "@mui/material";

/* ------------------------------------------------------------------
   1️⃣  Pastel-colour generator using the golden-angle
       ▸ Numeric IDs → huge hue jump ⇒ clearly distinct
       ▸ Fallback hash for emails / GUIDs
   ------------------------------------------------------------------ */
function stringToColor(str) {
  const numeric = parseInt(str, 10);
  if (!Number.isNaN(numeric)) {
    const hue = (numeric * 137.508) % 360;          // golden-angle
    return `hsl(${hue}, 70%, 75%)`;
  }
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash * 37) % 360;
  return `hsl(${hue}, 70%, 75%)`;
}

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const AvailableShiftsCalendar = ({ token }) => {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ------------------ Fetch departments ------------------ */
  useEffect(() => {
    if (!token) return;
    axios
      .get(`${API_URL}/api/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) => setDepartments(data || []))
      .catch(() => setError("Failed to fetch departments"));
  }, [token]);

  /* ------------------ Fetch employees ------------------ */
  useEffect(() => {
    if (!token) return;
    const params =
      departmentFilter !== "all" ? { department_id: departmentFilter } : {};
    axios
      .get(`${API_URL}/manager/recruiters`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      })
      .then(({ data }) => setEmployees(data.recruiters || []))
      .catch(() => {
        setError("Failed to fetch employees");
        setEmployees([]);
      });
  }, [token, departmentFilter]);

  /* ------------------ Fetch available shifts ------------------ */
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    const params = {};
    if (departmentFilter !== "all") params.department_id = departmentFilter;
    if (employeeFilter !== "all") params.recruiter_id = employeeFilter;

    axios
      .get(`${API_URL}/manager/calendar`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      })
      .then(({ data }) => {
        const events =
          (data.events || [])
            .filter((ev) => ev.type === "shift")
            .map((shift) => ({
              id: shift.id,
              title:
                shift.recruiter && shift.recruiter.length
                  ? `${shift.recruiter}: Shift`
                  : "Shift",
              start: shift.start,
              end: shift.end,
              color: stringToColor(String(shift.recruiter_id)), // ★ key line
              textColor: "#111",
            })) || [];
        setShifts(events);
      })
      .catch(() => {
        setError("Failed to fetch available shifts");
        setShifts([]);
      })
      .finally(() => setLoading(false));
  }, [token, departmentFilter, employeeFilter]);

  /* ------------------- UI ------------------- */
  return (
    <Box sx={{ my: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
        Available Shifts&nbsp;
        <Typography
          component="span"
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 400 }}
        >
          (Unassigned employee shifts by department)
        </Typography>
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filter Bar */}
      <Paper
        sx={{
          p: 2,
          mb: 2,
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          alignItems: "center",
        }}
        elevation={1}
      >
        <FormControl sx={{ minWidth: 220 }}>
          <InputLabel>Department</InputLabel>
          <Select
            size="small"
            value={departmentFilter}
            label="Department"
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setEmployeeFilter("all");
            }}
          >
            <MenuItem value="all">All Departments</MenuItem>
            {departments.map((d) => (
              <MenuItem key={d.id} value={d.id}>
                {d.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 220 }}>
          <InputLabel>Employee</InputLabel>
          <Select
            size="small"
            value={employeeFilter}
            label="Employee"
            onChange={(e) => setEmployeeFilter(e.target.value)}
            disabled={employees.length === 0}
          >
            <MenuItem value="all">All Employees</MenuItem>
            {employees.map((e) => (
              <MenuItem key={e.id} value={e.id}>
                {e.first_name} {e.last_name} ({e.email})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Legend */}
      {employees.length > 0 && (
        <Box sx={{ display: "flex", gap: 3, mb: 2, flexWrap: "wrap" }}>
          {employees.map((e) => (
            <Tooltip key={e.id} title={e.email} arrow enterDelay={200}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: stringToColor(String(e.id)),
                    marginRight: 6,
                    border: "1px solid #bbb",
                  }}
                />
                <Typography variant="body2">
                  {e.first_name} {e.last_name}
                </Typography>
              </Box>
            </Tooltip>
          ))}
        </Box>
      )}

      {/* Calendar */}
      <Paper sx={{ p: 2 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            height="auto"
            events={shifts}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            eventTimeFormat={{
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }}
            eventDisplay="block"
            eventContent={(arg) => (
              <Tooltip title={arg.event.title} arrow>
                <span>{arg.event.title}</span>
              </Tooltip>
            )}
            slotMinTime="07:00:00"
            slotMaxTime="22:00:00"
            nowIndicator
            selectable={false}
            dayMaxEvents={3}
          />
        )}
      </Paper>
    </Box>
  );
};

export default AvailableShiftsCalendar;
