// src/pages/MasterCalendar.js
import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  Container,
  Typography,
  Alert,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Drawer,
  TextField,
  Button,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import api from "./utils/api";
import moment from "moment-timezone"; // keep for formatting in drawer

const leaveTypes = ["sick", "vacation", "personal", "family"];

const MasterCalendar = ({ token, loggedInRecruiter }) => {
  const theme = useTheme();
  const isManager = loggedInRecruiter?.role === "manager";

  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState(
    loggedInRecruiter ? String(loggedInRecruiter.id) : "all"
  );

  const [error, setError] = useState("");

  const [leaveDrawerOpen, setLeaveDrawerOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);

  const [leaveType, setLeaveType] = useState("sick");
  const [reason, setReason] = useState("");
  const [leaveMsg, setLeaveMsg] = useState("");

  // Use recruiter timezone or fallback to browser timezone
  const timezone =
    loggedInRecruiter?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    if (!token) return;
    fetchDepartments();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchEmployees();
  }, [token, departmentFilter]);

  useEffect(() => {
    if (!token) return;
    fetchEvents();
  }, [token, departmentFilter, employeeFilter]);

  useEffect(() => {
    let evs = [...events];
    if (isManager) {
      if (departmentFilter !== "all") {
        const idsInDept = employees
          .filter((e) => String(e.department_id) === String(departmentFilter))
          .map((e) => String(e.id));
        evs = evs.filter((ev) => idsInDept.includes(String(ev.recruiter_id)));
      }
      if (employeeFilter !== "all") {
        evs = evs.filter((ev) => String(ev.recruiter_id) === String(employeeFilter));
      }
    }
    setFilteredEvents(evs);
  }, [events, employees, departmentFilter, employeeFilter, isManager]);

  const fetchEvents = async () => {
    try {
      if (isManager) {
        const res = await api.get("/recruiter/calendar", {
          params:
            departmentFilter !== "all"
              ? { department_id: departmentFilter }
              : {},
        });
        setEvents(res.data.events || []);
      } else {
        const res = await api.get("/recruiter/calendar");
        setEvents(res.data.events || []);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch calendar events");
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get("/recruiter/team-members", {
        params:
          departmentFilter !== "all" ? { department_id: departmentFilter } : {},
      });
      const list = (res.data.recruiters || []).map((r) => ({
        ...r,
        name: `${r.first_name} ${r.last_name}`,
      }));
      setEmployees(list);
      if (!employeeFilter || employeeFilter === "all") {
        setEmployeeFilter(String(loggedInRecruiter?.id || "all"));
      }
    } catch {
      console.error("Failed to fetch employees");
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/api/departments");
      setDepartments(res.data || []);
    } catch {
      console.error("Failed to fetch departments");
    }
  };

  const handleDepartmentChange = (e) => {
    setDepartmentFilter(e.target.value);
    setEmployeeFilter("all");
  };

  const handleEmployeeChange = (e) => {
    setEmployeeFilter(e.target.value);
  };

  const handleEventClick = (info) => {
    const { extendedProps } = info.event;

    if (extendedProps.type === "shift") {
      setSelectedShift({
        ...extendedProps,
        shift_id: extendedProps.shift_id || extendedProps.id,
        recruiter_id: extendedProps.recruiter_id,
      });
      setLeaveDrawerOpen(true);
      return;
    }

    if (extendedProps.meeting_link) {
      window.open(extendedProps.meeting_link, "_blank");
    }
  };

  const submitLeaveRequest = async () => {
    if (!selectedShift) {
      setLeaveMsg("❌ No shift selected.");
      return;
    }
    if (
      !isManager &&
      loggedInRecruiter &&
      String(selectedShift.recruiter_id) !== String(loggedInRecruiter.id)
    ) {
      setLeaveMsg("❌ You can only request leave for your own shifts.");
      return;
    }

    try {
      const numericShiftId = Number(
        String(selectedShift.shift_id || selectedShift.id)
          .replace("shift-", "")
          .trim()
      );
      await api.post("/employee/leave-request", {
        shift_id: numericShiftId,
        leave_type: leaveType,
        reason,
        start: selectedShift.start,
        end: selectedShift.end,
      });
      setLeaveMsg("✅ Leave request submitted.");
      fetchEvents();
      setLeaveType("sick");
      setReason("");
      setLeaveDrawerOpen(false);
      setSelectedShift(null);
    } catch (err) {
      setLeaveMsg(err.response?.data?.error || "❌ Request failed");
    }
  };

  return (
    <Container sx={{ mt: 5, backgroundColor: theme.palette.background.default }}>
      <Typography variant="h4" gutterBottom sx={{ color: theme.palette.text.primary }}>
        Master Calendar
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      {isManager && (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ mb: 3, maxWidth: 500 }}
        >
          <FormControl fullWidth size="small">
            <InputLabel>Department</InputLabel>
            <Select value={departmentFilter} label="Department" onChange={handleDepartmentChange}>
              <MenuItem value="all">All Departments</MenuItem>
              {departments.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Employee</InputLabel>
            <Select value={employeeFilter} label="Employee" onChange={handleEmployeeChange}>
              <MenuItem value="all">All Employees</MenuItem>
              {employees.map((emp) => (
                <MenuItem key={emp.id} value={String(emp.id)}>
                  {emp.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      )}

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={filteredEvents.map((e) => ({
          id: e.id,
          title: e.title,
          // Key fix: parse ISO strings directly to Date objects to respect original offsets
          start: new Date(e.start),
          end: new Date(e.end),
          backgroundColor:
            e.type === "shift"
              ? theme.palette.warning.main
              : e.type === "leave"
              ? theme.palette.error.main
              : theme.palette.primary.main,
          extendedProps: e,
        }))}
        eventClick={handleEventClick}
        eventMouseEnter={(info) => {
          info.el.title = `${info.event.title}\nEmployee: ${info.event.extendedProps.recruiter}`;
        }}
        height="auto"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
      />

      <Drawer
        anchor="right"
        open={leaveDrawerOpen}
        onClose={() => {
          setLeaveDrawerOpen(false);
          setLeaveMsg("");
          setSelectedShift(null);
          setLeaveType("sick");
          setReason("");
        }}
      >
        <Box sx={{ width: 320, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Request Leave
          </Typography>

          {selectedShift && (
            <>
              <Typography variant="body2" sx={{ mb: 2 }}>
                📅 {moment(selectedShift.start).format("YYYY-MM-DD")}
                <br />
                🕑 {moment(selectedShift.start).format("HH:mm")} –{" "}
                {moment(selectedShift.end).format("HH:mm")}
              </Typography>

              <Stack spacing={2}>
                <TextField
                  select
                  label="Leave type"
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  fullWidth
                >
                  {leaveTypes.map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="Reason (optional)"
                  multiline
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  fullWidth
                />

                <Button variant="contained" onClick={submitLeaveRequest}>
                  Submit
                </Button>

                {leaveMsg && (
                  <Alert
                    severity={leaveMsg.startsWith("✅") ? "success" : "error"}
                    onClose={() => setLeaveMsg("")}
                  >
                    {leaveMsg}
                  </Alert>
                )}
              </Stack>
            </>
          )}
        </Box>
      </Drawer>
    </Container>
  );
};

export default MasterCalendar;
