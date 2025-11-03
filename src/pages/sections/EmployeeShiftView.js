import React, { useEffect, useState, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  Box,
  Typography,
  Button,
  Paper,
  Snackbar,
  Alert,
  TextField,
  Modal,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel
} from "@mui/material";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { format, addDays } from "date-fns";



const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const EmployeeShiftView = () => {
  // Get recruiterId from the URL (used only for backward compatibility)
  const [searchParams] = useSearchParams();
  const recruiterId = searchParams.get("recruiterId");
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  // LocalStorage-based identity and role
  const userRole = localStorage.getItem("role"); // "manager" or "recruiter"
  console.log("👤 ROLE:", userRole);
  const userId = String(localStorage.getItem("user_id"));


  // Recruiter dropdown & current recruiter context
  const [allRecruiters, setAllRecruiters] = useState([]);
  useEffect(() => {
    console.log("📋 All recruiters fetched:", allRecruiters);
  }, [allRecruiters]);

  // Fetch Departments
useEffect(() => {
  fetch(`${API_URL}/api/departments`, { headers: getAuthHeaders() })
    .then(res => res.json())
    .then(data => setDepartments(data || []));
}, []);
  
  const [selectedRecruiters, setSelectedRecruiters] = useState(() => {
    if (userRole === "manager" && recruiterId) return [recruiterId];
    if (userRole === "recruiter") return [userId];
    return [];
  });
  const currentRecruiterId = selectedRecruiters[0];


  // Primary state variables
  const [recruiter, setRecruiter] = useState({});
  const [shifts, setShifts] = useState([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [auditLog, setAuditLog] = useState([]);

  // When editing, selectedShift holds the shift object; otherwise null (for creating new)
  const [selectedShift, setSelectedShift] = useState(null);
  // Form state with new field "role"
  const [formData, setFormData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    note: "",
    status: "pending",
    recurring: false,
    recurringDays: ["Mon"],
    role: ""
  });
  const [pendingUpdate, setPendingUpdate] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  // Advanced feature states
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [leaveBlocks, setLeaveBlocks] = useState([]);
  const [shiftTemplates, setShiftTemplates] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);


  const [dateRange, setDateRange] = useState({
    start: format(new Date(), "yyyy-MM-dd"),
    end:   format(addDays(new Date(), 30), "yyyy-MM-dd")
  });
  

  // New states for live team calendar overlay and regional filtering
  const [regionFilter, setRegionFilter] = useState("all");

  // Reference for the calendar component
  const calendarRef = useRef(null);

  // Utility function to add authentication headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };


  // ----------------------------------------------------------------
  // 1. Advanced Availability-Aware Scheduling
  const fetchAvailabilityMap = async () => {
    try {
      const res = await fetch(`${API_URL}/employee/availability/all`, {
        headers: getAuthHeaders()
      });
      const data = await res.json(); // Expected format: { recruiterId: { days: ["Mon"], time: "09:00-17:00" }, ... }
      setAvailabilityMap(data);
    } catch {
      setErrorMsg("Failed to fetch availability.");
    }
  };

  // ----------------------------------------------------------------
  // 2. Advanced Leave Overlay + Blocking
  const fetchLeaveBlocks = async () => {
    try {
      const res = await fetch(`${API_URL}/employee/leaves/approved`, { headers: getAuthHeaders() });
      setLeaveBlocks(await res.json());
    } catch {
      setErrorMsg("Failed to fetch leave blocks.");
    }
  };

  // ----------------------------------------------------------------
  // 3. Shift Templates (Full UX Flow)
  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${API_URL}/shift-templates`, { headers: getAuthHeaders() });
      setShiftTemplates(await res.json());
    } catch {
      setErrorMsg("Failed to fetch shift templates.");
    }
  };

  // ----------------------------------------------------------------
  // 7. Inline Leave Approval Panel
  const fetchPendingLeaves = async () => {
    try {
      const res = await fetch(`${API_URL}/employee/leaves?status=pending`, { headers: getAuthHeaders() });
      setPendingLeaves(await res.json());
    } catch {
      setErrorMsg("Failed to fetch pending leaves.");
    }
  };

  const approveLeave = async (id) => {
    try {
      await fetch(`${API_URL}/employee/leaves/approve/${id}`, { method: "POST", headers: getAuthHeaders() });
      fetchPendingLeaves();
    } catch {
      setErrorMsg("Failed to approve leave.");
    }
  };

  const rejectLeave = async (id) => {
    try {
      await fetch(`${API_URL}/employee/leaves/reject/${id}`, { method: "POST", headers: getAuthHeaders() });
      fetchPendingLeaves();
    } catch {
      setErrorMsg("Failed to reject leave.");
    }
  };

  // ----------------------------------------------------------------
  // Fetch recruiter details (manager view)
  const fetchRecruiter = async (id) => {
    try {
      const res = await fetch(`${API_URL}/manager/recruiters`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      const found = data.recruiters?.find(r => String(r.id) === String(id));
      setRecruiter(found || {});
    } catch {
      setErrorMsg("Failed to fetch recruiter info.");
    }
  };
  

  // ----------------------------------------------------------------
  // 3. Live Team Calendar Overlay - Fetch all recruiters list
  const fetchAllRecruiters = async () => {
  try {
    const res = await fetch(`${API_URL}/manager/recruiters`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    setAllRecruiters(data.recruiters || []);
  } catch {
    setErrorMsg("Failed to fetch recruiters.");
  }
};



  // ----------------------------------------------------------------
  // 4. Audit Log for Shift Edits - Fetch audit logs
  const fetchAuditLog = async () => {
    try {
      const res = await fetch(`${API_URL}/shifts/audit-log?recruiter_id=${currentRecruiterId}`, {

        headers: getAuthHeaders()
      });
      const data = await res.json();
      setAuditLog(data || []);
    } catch {
      setErrorMsg("Failed to fetch audit log.");
    }
  };

  // ----------------------------------------------------------------
  // 5. Regional/Branch Filtering & Live Calendar Overlay - Fetch shifts
  const fetchShifts = async () => {
  try {
    const ids = selectedRecruiters.map(String).join(",");
    const res = await fetch(
      `${API_URL}/automation/shifts/range?start_date=${dateRange.start}&end_date=${dateRange.end}&recruiter_ids=${ids}`,
      { headers: getAuthHeaders() }
    );
    const data = await res.json();
    setShifts(data.shifts ?? (Array.isArray(data) ? data : []));
  } catch {
    setErrorMsg("Failed to fetch shifts.");
  }
};

  
  // ----------------------------------------------------------------
  // Helper: Weekly Hour Tracker
  const getWeeklyHours = (recruiterId, date) => {
    const targetWeek = format(new Date(date), "yyyy-'W'II");
    return shifts
      .filter(s => s.recruiter_id === recruiterId && format(new Date(s.date), "yyyy-'W'II") === targetWeek)
      .reduce((sum, s) => {
        const start = new Date(s.clock_in);
        const end = new Date(s.clock_out);
        return sum + (end - start) / 3600000;
      }, 0);
  };

  // ----------------------------------------------------------------
  // Computed: Smart Time Suggestions
  const frequentTimeBlocks = useMemo(() => {
    const blocks = {};
    shifts.forEach(s => {
      const key = `${s.clock_in.slice(11,16)}-${s.clock_out.slice(11,16)}`;
      blocks[key] = (blocks[key] || 0) + 1;
    });
    return Object.entries(blocks)
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k);
  }, [shifts]);

  // ----------------------------------------------------------------
  // Computed: Daily Coverage Panel (Time Buckets)
  const hourlyCoverage = useMemo(() => {
    const hours = Array(24).fill(0);
    shifts.forEach(s => {
      const start = new Date(s.clock_in).getHours();
      const end = new Date(s.clock_out).getHours();
      for (let i = start; i < end; i++) hours[i]++;
    });
    return hours;
  }, [shifts]);

  // ----------------------------------------------------------------
  // Computed: Enterprise-Grade Conflict Heatmap
  const conflictHeatmap = useMemo(() => {
    const map = {};
    shifts.forEach(s => {
      const startHour = new Date(s.clock_in).getHours();
      map[startHour] = (map[startHour] || 0) + 1;
    });
    return map;
  }, [shifts]);

  // Initial data load on mount
  useEffect(() => {
    fetchAllRecruiters(); // Load recruiter list always
  
    // 🧠 Auto-select recruiter from URL if it exists and manager is viewing
    if (userRole === "manager" && recruiterId) {
      setSelectedRecruiters([recruiterId]);
    } else if (userRole === "recruiter") {
      setSelectedRecruiters([userId]);
    }
    
    fetchAvailabilityMap();
    fetchLeaveBlocks();
    fetchTemplates();
    fetchPendingLeaves();
  }, []);
  


  useEffect(() => {
  const filtered = allRecruiters.filter(rec =>
    !selectedDepartment || String(rec.department_id) === String(selectedDepartment)
  );
  if (filtered.length === 1) {
    setSelectedRecruiters([String(filtered[0].id)]);
  } else {
    setSelectedRecruiters([]);
  }
}, [selectedDepartment, allRecruiters]);


  // Re-run fetchShifts whenever selected recruiters or region filter changes
  useEffect(() => {
    if (selectedRecruiters.length > 0) {
      const id = selectedRecruiters[0];
      fetchRecruiter(id);
      setShifts([]);
      fetchShifts();
      fetchAuditLog();  // optional
    }
  }, [selectedRecruiters, regionFilter, dateRange]);
  
  useEffect(() => {
  fetchAllRecruiters();
  setSelectedRecruiters([]); // Optionally clear recruiter selection when department changes
}, [selectedDepartment]);

  // ----------------------------------------------------------------
  // Filter shifts by status
  const filteredShifts = useMemo(() => {
    return shifts.filter(s =>
      selectedRecruiters.includes(String(s.recruiter_id)) &&
      (statusFilter === "all" || s.status === statusFilter)
    );
  }, [shifts, selectedRecruiters, statusFilter]);
  
  
  // Count shifts per day for overview
  const shiftCountPerDay = useMemo(() => {
    const counts = {};
    shifts.forEach(s => {
      const day = format(new Date(s.date), "EEE");
      counts[day] = (counts[day] || 0) + 1;
    });
    return counts;
  }, [shifts]);

  // ----------------------------------------------------------------
  // When an event is clicked, open the modal with its data for editing
  const handleEventClick = (info) => {
    const shift = shifts.find(s => s.id === info.event.id);
    if (shift) {
      setSelectedShift(shift);
      setFormData({
        date: shift.date,
        startTime: shift.clock_in.slice(11, 16),
        endTime: shift.clock_out.slice(11, 16),
        location: shift.location || "",
        note: shift.note || "",
        status: shift.status || "pending",
        recurring: false,
        recurringDays: ["Mon"],
        role: shift.role || ""
      });
      setModalOpen(true);
    }
  };

  // ----------------------------------------------------------------
  // Handle form field changes (supports checkboxes and other inputs)
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      if (name === "recurring") {
        setFormData(prev => ({ ...prev, recurring: checked }));
      } else if (name === "recurringDays") {
        setFormData(prev => {
          const newDays = checked ? [...prev.recurringDays, value] : prev.recurringDays.filter(d => d !== value);
          return { ...prev, recurringDays: newDays };
        });
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // ----------------------------------------------------------------
  // Handle drag-and-drop events in the calendar (update shift times)
  const handleEventDrop = (info) => {
    const { start, end } = info.event;
    if (!start || !end) return;
    setPendingUpdate({
      id: info.event.id,
      clock_in: start.toISOString(),
      clock_out: end.toISOString()
    });
  };
  

  // Save the pending update from drag/resize
  const savePendingUpdate = async () => {
    try {
      await fetch(`${API_URL}/automation/shifts/update/${pendingUpdate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(pendingUpdate)
      });
      setSuccessMsg("Shift updated via drag.");
      setPendingUpdate(null);
      fetchShifts();
    } catch {
      setErrorMsg("Drag update failed.");
    }
  };

  // Cancel pending drag/resize update and refresh shifts
  const cancelPendingUpdate = () => {
    setPendingUpdate(null);
    fetchShifts();
  };

  // ----------------------------------------------------------------
  // Prepare the form for creating a new shift
  const handleNewShift = () => {
    if (!currentRecruiterId) {
      setErrorMsg("Please select a recruiter first.");
      return;
    }
  
    setSelectedShift(null);
    setFormData({
      date: format(new Date(), "yyyy-MM-dd"),
      startTime: "09:00",
      endTime: "17:00",
      location: "",
      note: "",
      status: "pending",
      recurring: false,
      recurringDays: ["Mon"],
      role: ""
    });
    setModalOpen(true);
  };
  
  // ----------------------------------------------------------------
  // Before creating or updating a shift, perform several advanced validations:
  // - Availability: check against availabilityMap
  // - Leave Overlap: check against leaveBlocks
  // - Weekly Hours: check using getWeeklyHours
  const advancedValidation = () => {
    // Availability-Aware Scheduling
    const avail = availabilityMap[recruiterId];
    const weekday = new Date(formData.date).toLocaleDateString("en-US", { weekday: "short" });
    if (
      avail &&
      (!avail.days.includes(weekday) ||
        formData.startTime < avail.time.split("-")[0] ||
        formData.endTime > avail.time.split("-")[1])
    ) {
      setErrorMsg("⛔ Employee not available during selected hours.");
      return false;
    }
    // Leave Overlay Check
    const isInLeave = leaveBlocks.some(l => {
      const start = new Date(`${formData.date}T${formData.startTime}`);
      const end = new Date(`${formData.date}T${formData.endTime}`);
      return new Date(l.from) < end && new Date(l.to) > start;
    });
    if (isInLeave) {
      setErrorMsg("⚠️ Shift overlaps with approved leave.");
      return false;
    }
    // Weekly Hour Tracker
    const currentHours = getWeeklyHours(currentRecruiterId, formData.date);
    const newHours = (new Date(`1970-01-01T${formData.endTime}`) - new Date(`1970-01-01T${formData.startTime}`)) / 3600000;
    if (currentHours + newHours > 40) {
      setErrorMsg("⚠️ Weekly hour limit exceeded.");
      return false;
    }
    return true;
  };

  // ----------------------------------------------------------------
  // Update an existing shift (from the modal)
  const handleShiftUpdate = async () => {
    if (!selectedShift) return;
    if (!advancedValidation()) return;
    try {
      await fetch(`${API_URL}/automation/shifts/update/${selectedShift.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          clock_in: `${formData.date}T${formData.startTime}`,
          clock_out: `${formData.date}T${formData.endTime}`,
          location: formData.location,
          note: formData.note,
          status: formData.status,
          role: formData.role
        })
      });
      setSuccessMsg("Shift updated.");
      setModalOpen(false);
      fetchShifts();
      fetchAuditLog();
    } catch {
      setErrorMsg("Shift update failed.");
    }
  };

  // ----------------------------------------------------------------
  // Create a new shift (from the modal)
  const handleCreateShift = async () => {
    if (!advancedValidation()) return;
    try {
      await fetch(`${API_URL}/automation/shifts/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          recruiter_id: currentRecruiterId, 
          date: formData.date,
          clock_in: `${formData.date}T${formData.startTime}`,
          clock_out: `${formData.date}T${formData.endTime}`,
          location: formData.location,
          note: formData.note,
          status: formData.status,
          role: formData.role
        })
      });
      setSuccessMsg("Shift created.");
      setModalOpen(false);
      fetchShifts();
    } catch {
      setErrorMsg("Shift creation failed.");
    }
  };

  // ----------------------------------------------------------------
  // Delete a shift
  const handleShiftDelete = async () => {
    try {
      await fetch(`${API_URL}/automation/shifts/delete/${selectedShift.id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      setSuccessMsg("Shift deleted.");
      setModalOpen(false);
      fetchShifts();
    } catch {
      setErrorMsg("Deletion failed.");
    }
  };

  // ----------------------------------------------------------------
  // Export the shifts data to an Excel file
  const exportToExcel = () => {
    const data = shifts.map(s => ({
      Date: s.date,
      ClockIn: s.clock_in,
      ClockOut: s.clock_out,
      Location: s.location,
      Note: s.note,
      Status: s.status,
      Role: s.role
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employee_Shifts");
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    saveAs(new Blob([buf], { type: "application/octet-stream" }), `Shifts_${recruiter.first_name || ""}_${recruiter.last_name || "employee"}.xlsx`);

  };

  // ----------------------------------------------------------------
  // Calculate total hours across all shifts for an overview
  const totalHours = shifts.reduce((sum, s) => {
    const start = new Date(s.clock_in);
    const end = new Date(s.clock_out);
    return sum + (end - start) / (1000 * 60 * 60);
  }, 0);

  return (

    
    <Box p={4}>
      <TextField
  label="Start Date"
  type="date"
  value={dateRange.start}
  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
  InputLabelProps={{ shrink: true }}
  sx={{ mr: 2 }}
/>
<TextField
  label="End Date"
  type="date"
  value={dateRange.end}
  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
  InputLabelProps={{ shrink: true }}
  sx={{ mr: 2 }}
/>

      <Typography variant="h4" gutterBottom>
  📋 {allRecruiters.find(r => r.id == currentRecruiterId)?.name || "Employee"}{" "}
  ({allRecruiters.find(r => r.id == currentRecruiterId)?.department?.name || "No Department"}) — Shift Overview
</Typography>


      
      <Grid container spacing={2} mb={3}>
        <Grid item>
          <Button variant="contained" onClick={exportToExcel}>Export to Excel</Button>
        </Grid>
        <Grid item>
          <Typography variant="subtitle1">
            Total Shifts: {shifts.length} | Total Hours: {totalHours.toFixed(1)} hrs
          </Typography>
        </Grid>
      </Grid>
<FormControl fullWidth>
  <InputLabel id="department-select-label">Department</InputLabel>
  <Select
    labelId="department-select-label"
    value={selectedDepartment}
    onChange={(e) => setSelectedDepartment(e.target.value)}
  >
    <MenuItem value="">All Departments</MenuItem>
    {departments.map((dep) => (
      <MenuItem key={dep.id} value={dep.id}>{dep.name}</MenuItem>
    ))}
  </Select>
</FormControl>

      {/* Controls for filtering and calendar overlay */}
      <Grid container spacing={2} alignItems="center" mb={2}>
  {userRole === "manager" && (
    <Grid item xs={12} sm={6} md={4}>
      <FormControl fullWidth>
        <InputLabel id="recruiter-select-label">Select Recruiter</InputLabel>
        <Select
  labelId="recruiter-select-label"
  label="Select Recruiter"
  value={selectedRecruiters[0] || ""}
  onChange={(e) => setSelectedRecruiters([String(e.target.value)])}
>
  {allRecruiters
  .filter(rec =>
    !selectedDepartment || String(rec.department_id) === String(selectedDepartment)
  )
  .map((rec) => (
    <MenuItem key={rec.id} value={rec.id}>
      {rec.first_name} {rec.last_name} {rec.department ? `(${rec.department.name})` : ""}
    </MenuItem>
))}

</Select>

      </FormControl>
    </Grid>
  )}
{userRole === "manager" && (
  <Grid item xs={12} sm={6} md={2}>
    <Button
      fullWidth
      variant="outlined"
      onClick={() => {
        fetchRecruiter(selectedRecruiters[0]);
        setShifts([]);
        fetchShifts();
      }}
    >
      Load Shifts
    </Button>
  </Grid>
)}

  <Grid item xs={12} sm={6} md={3}>
    <FormControl fullWidth>
      <InputLabel>Region</InputLabel>
      <Select
        value={regionFilter}
        onChange={(e) => setRegionFilter(e.target.value)}
      >
        <MenuItem value="all">All Regions</MenuItem>
        <MenuItem value="east">East</MenuItem>
        <MenuItem value="west">West</MenuItem>
        <MenuItem value="ontario">Ontario</MenuItem>
        <MenuItem value="bc">British Columbia</MenuItem>
      </Select>
    </FormControl>
  </Grid>

  <Grid item xs={12} sm={6} md={3}>
    <FormControl fullWidth>
      <InputLabel>Status</InputLabel>
      <Select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
      >
        <MenuItem value="all">All</MenuItem>
        <MenuItem value="pending">Pending</MenuItem>
        <MenuItem value="accepted">Accepted</MenuItem>
        <MenuItem value="rejected">Rejected</MenuItem>
      </Select>
    </FormControl>
  </Grid>

  <Grid item xs={12} sm={6} md={2}>
    <Button fullWidth variant="contained" onClick={handleNewShift}>
      ➕ New Shift
    </Button>
  </Grid>
</Grid>


      {/* Shifts per day overview */}
      <Grid container spacing={2} mb={3}>
        {Object.entries(shiftCountPerDay).map(([day, count]) => (
          <Grid item key={day}>
            <Paper sx={{ p: 1, textAlign: "center" }}>
              <Typography variant="caption">{day}</Typography>
              <Typography variant="h6">{count}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* FullCalendar component with background events from leaveBlocks */}
      {selectedRecruiters.length > 0 && (
  <Paper sx={{ p: 2 }}>
    <FullCalendar
      ref={calendarRef}
      plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
      initialView="timeGridWeek"
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "timeGridWeek,dayGridMonth"
      }}
      editable={true}
      events={[
        ...filteredShifts.map((s) => ({
          id: s.id,
          title: `${format(new Date(s.clock_in), "HH:mm")} - ${format(new Date(s.clock_out), "HH:mm")} (${s.status})`,
          start: s.clock_in,
          end: s.clock_out,
          extendedProps: {
            location: s.location,
            note: s.note,
            status: s.status
          }
        })),
        ...leaveBlocks.map((l) => ({
          start: l.from,
          end: l.to,
          display: "background",
          color: "#eee"
        }))
      ]}
      eventClick={handleEventClick}
      eventDrop={handleEventDrop}
    />
  </Paper>
)}



      {/* Audit Log Display */}
      <Paper sx={{ p: 2, mt: 4 }}>
        <Typography variant="h6">📜 Audit Trail</Typography>
        {auditLog.map((log, i) => (
  <Typography key={i}>{log.timestamp} – {log.user} – {log.action}</Typography>
))}
      </Paper>

      {/* Daily Coverage Panel */}
      <Paper sx={{ mt: 4, p: 2 }}>
        <Typography variant="subtitle1">⏱ Hourly Coverage</Typography>
        <Grid container spacing={1}>
          {hourlyCoverage.map((count, hour) => (
            <Grid item key={hour}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  textAlign: "center",
                  lineHeight: "40px",
                  bgcolor: `rgba(0,0,255,${Math.min(count / 5, 1)})`,
                  color: "#fff"
                }}
              >
                {hour}
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Enterprise-Grade Conflict Heatmap */}
      <Paper sx={{ mt: 4, p: 2 }}>
        <Typography variant="subtitle1">🔥 Conflict Hot Zones</Typography>
        <Grid container spacing={1}>
          {Array.from({ length: 24 }).map((_, hour) => (
            <Grid item key={hour}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  textAlign: "center",
                  lineHeight: "40px",
                  bgcolor: `rgba(255, 0, 0, ${Math.min(conflictHeatmap[hour] / 5, 1)})`,
                  color: "#fff"
                }}
              >
                {hour}
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Inline Leave Approval Panel */}
      <Paper sx={{ mt: 4, p: 2 }}>
        <Typography variant="h6">🗓 Pending Leave Requests</Typography>
        {pendingLeaves.map(leave => (
          <Box key={leave.id} display="flex" justifyContent="space-between" mb={1}>
            <Typography>{leave.employee_name}: {leave.from} → {leave.to}</Typography>
            <Box>
              <Button onClick={() => approveLeave(leave.id)}>✅ Approve</Button>
              <Button color="error" onClick={() => rejectLeave(leave.id)}>❌ Reject</Button>
            </Box>
          </Box>
        ))}
      </Paper>

      {/* Floating panel for pending drag/resize updates */}
      {pendingUpdate && (
        <Box sx={{ position: "fixed", bottom: 20, right: 20, bgcolor: "white", p: 2, borderRadius: 2, boxShadow: 4 }}>
          <Typography>Save drag/update to shift?</Typography>
          <Grid container spacing={2} mt={1}>
            <Grid item>
              <Button variant="contained" onClick={savePendingUpdate}>Save</Button>
            </Grid>
            <Grid item>
              <Button variant="outlined" color="warning" onClick={cancelPendingUpdate}>Cancel</Button>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Modal for Create/Update Shift */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box sx={{ p: 4, bgcolor: "white", width: 400, mx: "auto", mt: 10, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            {selectedShift ? "Edit Shift" : "Create Shift"}
          </Typography>
          {userRole === "manager" && currentRecruiterId && (
  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
    For: {allRecruiters.find(r => String(r.id) === String(currentRecruiterId))?.first_name} {allRecruiters.find(r => String(r.id) === String(currentRecruiterId))?.last_name || "Unknown"}

  </Typography>
)}

          {/* Shift Template Selection */}
          <FormControl fullWidth margin="normal">
            <InputLabel>Template</InputLabel>
            <Select
              onChange={(e) => {
                const t = shiftTemplates.find(t => t.id === e.target.value);
                if (t) {
                  setFormData(prev => ({
                    ...prev,
                    startTime: t.start,
                    endTime: t.end,
                    recurringDays: t.days,
                    role: t.role,
                  }));
                }
              }}
            >
              <MenuItem value="">None</MenuItem>
              {shiftTemplates.map(t => (
                <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Date"
            type="date"
            name="date"
            value={formData.date}
            onChange={handleFormChange}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Start Time"
            type="time"
            name="startTime"
            value={formData.startTime}
            onChange={handleFormChange}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="End Time"
            type="time"
            name="endTime"
            value={formData.endTime}
            onChange={handleFormChange}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          {/* Smart Time Suggestions */}
          <Box mt={1}>
            {frequentTimeBlocks.slice(0, 3).map((block, i) => {
              const [start, end] = block.split("-");
              return (
                <Button key={i} size="small" onClick={() => {
                  setFormData(prev => ({ ...prev, startTime: start, endTime: end }));
                }}>
                  ⏱ Suggest: {block}
                </Button>
              );
            })}
          </Box>
          <TextField
            fullWidth
            label="Location"
            name="location"
            value={formData.location}
            onChange={handleFormChange}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Notes"
            name="note"
            value={formData.note}
            onChange={handleFormChange}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={formData.status}
              onChange={handleFormChange}
              label="Status"
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="accepted">Accepted</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
          {/* Role-Based Shift Assignment */}
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              name="role"
              value={formData.role}
              onChange={handleFormChange}
              label="Role"
            >
              <MenuItem value="greeter">Greeter</MenuItem>
              <MenuItem value="trainer">Trainer</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="support">Support</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Checkbox
                name="recurring"
                checked={formData.recurring}
                onChange={handleFormChange}
              />
            }
            label="Recurring Shift"
          />
          {formData.recurring && (
            <Box mt={2}>
              <Typography variant="subtitle2">Recurring Days:</Typography>
              <Grid container>
                {dayLabels.map(day => (
                  <Grid item key={day}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="recurringDays"
                          value={day}
                          checked={formData.recurringDays.includes(day)}
                          onChange={handleFormChange}
                        />
                      }
                      label={day}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
          <Box mt={2} display="flex" justifyContent="space-between">
            {selectedShift ? (
              <>
                <Button variant="contained" onClick={handleShiftUpdate}>Save</Button>
                <Button variant="outlined" color="error" onClick={handleShiftDelete}>Delete</Button>
              </>
            ) : (
              <Button variant="contained" onClick={handleCreateShift}>Create</Button>
            )}
            <Button variant="outlined" color="error" onClick={() => setModalOpen(false)}>Cancel</Button>
          </Box>
        </Box>
      </Modal>

      <Snackbar open={!!successMsg} autoHideDuration={4000} onClose={() => setSuccessMsg("")}>
        <Alert severity="success">{successMsg}</Alert>
      </Snackbar>
      <Snackbar open={!!errorMsg} autoHideDuration={4000} onClose={() => setErrorMsg("")}>
        <Alert severity="error">{errorMsg}</Alert>
      </Snackbar>
    </Box>
    
  );
};

export default EmployeeShiftView;
