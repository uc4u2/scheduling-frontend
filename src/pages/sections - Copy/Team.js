import React, { useEffect, useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Modal,
  TextField,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Snackbar,
  Alert,
  Paper,
  Grid,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Collapse,
  IconButton,
} from "@mui/material";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material"; // ✅ ADD THIS TOO
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { format, getDay } from "date-fns";
import { useNavigate } from "react-router-dom";

const COLORS = [
  "#E57373", "#81C784", "#64B5F6", "#FFD54F",
  "#4DB6AC", "#BA68C8", "#FF8A65", "#A1887F",
  "#90A4AE", "#F06292"
];
const getColorForRecruiter = (recruiterId) => {
  return COLORS[recruiterId % COLORS.length];
};

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const SecondTeam = () => {
  // Basic States
  const [expandedRows, setExpandedRows] = useState({});
  const [calendarHeight, setCalendarHeight] = useState("600px");
  const [calendarWidth, setCalendarWidth] = useState("100%");


const toggleRow = (id) => {
  setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
};
  const [selectedShiftIds, setSelectedShiftIds] = useState([]);
  const navigate = useNavigate();
  const [recruiters, setRecruiters] = useState([]);
  const [selectedRecruiters, setSelectedRecruiters] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Modal state for shift assign/edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [formData, setFormData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    note: "",
    recurring: false,
    recurringDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    selectedTemplate: ""
  });

  // State for editable shift templates
  const [templates, setTemplates] = useState([
    { label: "Morning (9am-1pm, Mon–Fri)", start: "09:00", end: "13:00", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], recurring: true },
    { label: "Evening (2pm-6pm, Mon–Fri)", start: "14:00", end: "18:00", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], recurring: true },
    { label: "Weekend (Sat–Sun 10am-4pm)", start: "10:00", end: "16:00", days: ["Sat", "Sun"], recurring: true }
  ]);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateFormData, setTemplateFormData] = useState({
    label: "",
    start: "",
    end: "",
    days: [],
    recurring: true
  });
  const [editingTemplateIndex, setEditingTemplateIndex] = useState(null);

  // State for pending event updates (drag/resize)
  const [pendingEventUpdate, setPendingEventUpdate] = useState(null);
  const pendingRevertCallbackRef = useRef(null);

  const calendarRef = useRef(null);
  const handleBulkDeleteShifts = async () => {
    if (!window.confirm("Are you sure you want to delete selected shifts?")) return;
  
    try {
      const res = await fetch(`${API_URL}/automation/shifts/delete-bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({ shift_ids: selectedShiftIds })
      });
  
      const result = await res.json();
  
      if (res.ok) {
        setSuccessMsg(result.message || "Shifts deleted successfully.");
        setSelectedShiftIds([]);
        fetchShifts();
      } else {
        setErrorMsg(result.error || "Error deleting shifts.");
      }
    } catch (err) {
      setErrorMsg("Bulk delete failed.");
    }
  };
  
  // Define update and delete handlers first so that ESLint finds them
  const handleDeleteShift = async () => {
    if (!editingShift) return;
  
    try {
      await fetch(`${API_URL}/automation/shifts/delete/${editingShift.id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      setSuccessMsg("Shift deleted successfully.");
      setModalOpen(false);
      fetchShifts();
    } catch (err) {
      setErrorMsg("Error deleting shift.");
    }
  };
  
  const handleUpdateShift = async () => {
    if (!editingShift) return;
  
    const recruiterId = editingShift.recruiter_id;
    const dateStr = formData.date;
    const clock_in = `${dateStr}T${formData.startTime}`;
    const clock_out = `${dateStr}T${formData.endTime}`;
    const createdBy = localStorage.getItem("user_email"); // or whatever key you use for logged-in user
  
    const payload = {
      recruiter_id: recruiterId,
      date: dateStr,
      clock_in,
      clock_out,
      location: formData.location,
      note: formData.note,
      status: "assigned",
      created_by: createdBy
    };
  
    if (hasConflict(recruiterId, dateStr, formData.startTime, formData.endTime, editingShift.id)) {
      setErrorMsg("Conflict detected for updated shift.");
      return;
    }
  
    try {
      await fetch(`${API_URL}/automation/shifts/update/${editingShift.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
      });
      setSuccessMsg("Shift updated successfully.");
      setModalOpen(false);
      fetchShifts();
    } catch (err) {
      setErrorMsg("Error updating shift.");
    }
  };
  

  // useEffect to load data on mount
  useEffect(() => {
    fetchRecruiters();
    fetchShifts();
  }, []);

  // Fetch recruiters
  const fetchRecruiters = async () => {
    try {
      const res = await fetch(`${API_URL}/manager/recruiters`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      setRecruiters(data.recruiters || []);
    } catch (err) {
      setErrorMsg("Failed to fetch recruiters.");
    }
  };

  // Fetch shifts (using current month)
  const fetchShifts = async () => {
    try {
      const now = new Date();
      const month = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
      const res = await fetch(`${API_URL}/automation/shifts/monthly?month=${month}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      setShifts(data.shifts || []); // ✅ FIX: extract the array
      
    } catch (err) {
      setErrorMsg("Failed to fetch shifts.");
    }
  };

  // Auth header helper
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Generate recurring dates for given base date and selected days
  const generateRecurringDates = (baseDate, days, count = 14) => {
    const result = [];
    let current = new Date(baseDate);
    while (result.length < count) {
      if (days.includes(dayLabels[current.getDay()])) {
        result.push(format(current, "yyyy-MM-dd"));
      }
      current.setDate(current.getDate() + 1);
    }
    return result;
  };

  // Check for conflicts between shifts
  const hasConflict = (recruiterId, date, startTime, endTime, shiftIdToExclude = null) => {
    const newStart = new Date(`${date}T${startTime}`);
    const newEnd = new Date(`${date}T${endTime}`);
    return shifts.some(s => {
      if (s.recruiter_id !== recruiterId) return false;
      if (shiftIdToExclude && s.id === shiftIdToExclude) return false;
      const existingStart = new Date(s.clock_in);
      const existingEnd = new Date(s.clock_out);
      return newStart < existingEnd && newEnd > existingStart;
    });
  };


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
  
  // Handle changes in the shift assignment form
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      if (name === "recurring") {
        setFormData(prev => ({ ...prev, recurring: checked }));
      } else if (name === "recurringDays") {
        setFormData(prev => {
          const newDays = checked
            ? [...prev.recurringDays, value]
            : prev.recurringDays.filter(day => day !== value);
          return { ...prev, recurringDays: newDays };
        });
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle template selection
  const handleTemplateSelect = (e) => {
    const templateLabel = e.target.value;
    const template = templates.find(t => t.label === templateLabel);
    if (template) {
      setFormData(prev => ({
        ...prev,
        selectedTemplate: templateLabel,
        startTime: template.start,
        endTime: template.end,
        recurring: template.recurring,
        recurringDays: template.days
      }));
    } else {
      setFormData(prev => ({ ...prev, selectedTemplate: "" }));
    }
  };

  // Shift submission handler
  const handleSubmitShift = async () => {
    if (!formData.date) {
      setErrorMsg("Please specify a date.");
      return;
    }
  
    setErrorMsg(""); // Clear old errors
    setSuccessMsg(""); // Clear old success
    setIsSubmitting(true); // Optional: UI flag to disable button
  
    let dates = formData.recurring
      ? generateRecurringDates(formData.date, formData.recurringDays, 14)
      : [formData.date];
  
    let successCount = 0;
    let conflicts = [];
    let failures = [];
  
    for (let dateStr of dates) {
      for (let recruiterId of selectedRecruiters) {
        if (hasConflict(recruiterId, dateStr, formData.startTime, formData.endTime)) {
          conflicts.push(`🟡 Conflict - Recruiter ${recruiterId} on ${dateStr}`);
          continue;
        }
       
        const clock_in = `${dateStr}T${formData.startTime}`;
        const clock_out = `${dateStr}T${formData.endTime}`;
  
        const payload = {
          recruiter_id: recruiterId,
          date: dateStr,
          clock_in,
          clock_out,
          location: formData.location,
          note: formData.note,
          status: "assigned",
          created_by: parseInt(localStorage.getItem("userId"))
        };
        
        try {
          const res = await fetch(`${API_URL}/automation/shifts/create`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...getAuthHeaders()
            },
            body: JSON.stringify(payload)
          });
  
          if (!res.ok) {
            failures.push(`🔴 Failed - Recruiter ${recruiterId} on ${dateStr}`);
          } else {
            successCount++;
          }
        } catch (err) {
          failures.push(`🔴 Error - Recruiter ${recruiterId} on ${dateStr}`);
        }
      }
    }
  
    // Post-process results
    let resultMsg = "";
    if (successCount > 0) {
      resultMsg += `✅ ${successCount} shift(s) assigned successfully.\n`;
      setSuccessMsg(resultMsg);
    }
  
    if (conflicts.length > 0 || failures.length > 0) {
      const combined = [...conflicts, ...failures].join("\n");
      setErrorMsg(`Some issues occurred:\n${combined}`);
    }
  
    setModalOpen(false);
    fetchShifts();
    setIsSubmitting(false);
  };
  

  // Floating panel for pending drag/resize updates
  const handleSavePendingEventUpdate = async () => {
    if (!pendingEventUpdate) return;
    const newDate = format(pendingEventUpdate.newStart, "yyyy-MM-dd");
    const newStartTime = format(pendingEventUpdate.newStart, "HH:mm");
    const newEndTime = format(pendingEventUpdate.newEnd, "HH:mm");
    const payload = {
      date: newDate,
      clock_in: `${newDate}T${newStartTime}`,
      clock_out: `${newDate}T${newEndTime}`,
      location: pendingEventUpdate.location,
      note: pendingEventUpdate.note,
      status: pendingEventUpdate.status
    };
    try {
      const res = await fetch(`${API_URL}/automation/shifts/update/${pendingEventUpdate.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSuccessMsg("Shift update saved successfully.");
        setPendingEventUpdate(null);
        pendingRevertCallbackRef.current = null;
        fetchShifts();
      } else {
        setErrorMsg("Error saving shift update.");
      }
    } catch (err) {
      setErrorMsg("Error saving shift update.");
    }
  };

  const handleCancelPendingEventUpdate = () => {
    if (pendingRevertCallbackRef.current) {
      pendingRevertCallbackRef.current();
    }
    setPendingEventUpdate(null);
    pendingRevertCallbackRef.current = null;
  };

  // Event handler for drag-and-drop updates
  const handleEventDrop = (dropInfo) => {
    pendingRevertCallbackRef.current = dropInfo.revert;
    setPendingEventUpdate({
      id: dropInfo.event.id,
      newStart: dropInfo.event.start,
      newEnd: dropInfo.event.end,
      recruiter_id: dropInfo.event.extendedProps.recruiter_id,
      status: dropInfo.event.extendedProps.status,
      location: dropInfo.event.extendedProps.location,
      note: dropInfo.event.extendedProps.note
    });
  };

  // Event handler for event resizing
  const handleEventResize = (resizeInfo) => {
    pendingRevertCallbackRef.current = resizeInfo.revert;
    setPendingEventUpdate({
      id: resizeInfo.event.id,
      newStart: resizeInfo.event.start,
      newEnd: resizeInfo.event.end,
      recruiter_id: resizeInfo.event.extendedProps.recruiter_id,
      status: resizeInfo.event.extendedProps.status,
      location: resizeInfo.event.extendedProps.location,
      note: resizeInfo.event.extendedProps.note
    });
  };

  // When an event is clicked, open the modal for editing
  const handleEventClick = (clickInfo) => {
    const shift = shifts.find(s => String(s.id) === clickInfo.event.id);
    if (shift) {
      setEditingShift(shift);
      setFormData({
        date: shift.date,
        startTime: shift.clock_in.slice(11, 16),
        endTime: shift.clock_out.slice(11, 16),
        location: shift.location || "",
        note: shift.note || "",
        recurring: false,
        recurringDays: [],
        selectedTemplate: ""
      });
      setModalOpen(true);
    }
  };

  // When a blank date is clicked, open the add new shift modal
  const handleDateClick = (clickInfo) => {
    setEditingShift(null);
    setFormData({
      date: clickInfo.dateStr.split("T")[0],
      startTime: "09:00",
      endTime: "17:00",
      location: "",
      note: "",
      recurring: false,
      recurringDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      selectedTemplate: ""
    });
    setModalOpen(true);
  };

  // Prepare filtered shifts for calendar events
  const filteredShifts = shifts
    .filter(s => statusFilter === "all" ? true : s.status === statusFilter)
    .filter(s => selectedRecruiters.length === 0 ? true : selectedRecruiters.includes(s.recruiter_id));

    const calendarEvents = filteredShifts.map(s => {
      const color = getColorForRecruiter(s.recruiter_id);
      const isOnLeave = s.on_leave === true; // ← from backend
      return {
        id: s.id,
        title: isOnLeave
          ? `${recruiters.find(r => r.id === s.recruiter_id)?.name || s.recruiter_id} ⛔ On Leave`
          : `${recruiters.find(r => r.id === s.recruiter_id)?.name || s.recruiter_id} (${s.status})`,
        start: s.clock_in,
        end: s.clock_out,
        backgroundColor: isOnLeave ? "#f0f0f0" : color,
        borderColor: isOnLeave ? "#ccc" : color,
        textColor: isOnLeave ? "#999" : "#000",
        editable: !isOnLeave,
        extendedProps: {
          location: s.location,
          note: s.note,
          recruiter_id: s.recruiter_id,
          status: s.status,
          leave_reason: s.leave_reason || null
        }
      };
    });
    
    

  // Export shifts to Excel
  const exportShiftsToExcel = () => {
    const data = filteredShifts.map(s => ({
      Recruiter: recruiters.find(r => r.id === s.recruiter_id)?.name || s.recruiter_id,
      Date: s.date,
      ClockIn: s.clock_in,
      ClockOut: s.clock_out,
      Location: s.location || "",
      Note: s.note || "",
      Status: s.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Shifts");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "shifts_schedule.xlsx");
  };

  // ----- Shift Template Editor Handlers -----
  const openTemplateModal = () => {
    setTemplateFormData({ label: "", start: "", end: "", days: [], recurring: true });
    setEditingTemplateIndex(null);
    setTemplateModalOpen(true);
  };

  const handleTemplateFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "days") {
      setTemplateFormData(prev => {
        const newDays = checked
          ? [...prev.days, value]
          : prev.days.filter(d => d !== value);
        return { ...prev, days: newDays };
      });
    } else {
      setTemplateFormData(prev => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value
      }));
    }
  };

  const handleTemplateSave = () => {
    if (!templateFormData.label || !templateFormData.start || !templateFormData.end || templateFormData.days.length === 0) {
      setErrorMsg("Please fill all template fields.");
      return;
    }
    if (editingTemplateIndex !== null) {
      const updatedTemplates = [...templates];
      updatedTemplates[editingTemplateIndex] = { ...templateFormData };
      setTemplates(updatedTemplates);
      setSuccessMsg("Template updated successfully.");
    } else {
      setTemplates(prev => [...prev, { ...templateFormData }]);
      setSuccessMsg("Template added successfully.");
    }
    setTemplateModalOpen(false);
  };

  const handleTemplateEdit = (index) => {
    setTemplateFormData({ ...templates[index] });
    setEditingTemplateIndex(index);
    setTemplateModalOpen(true);
  };

  const handleTemplateDelete = (index) => {
    setTemplates(prev => prev.filter((_, i) => i !== index));
    setSuccessMsg("Template deleted successfully.");
  };

  // Prepare employee shift summary for table below calendar
  const employeeShiftData = recruiters.map(r => {
    const employeeShifts = shifts.filter(s => s.recruiter_id === r.id);
    return { id: r.id, name: r.name, shiftCount: employeeShifts.length, shifts: employeeShifts };
  });

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>
        Shift Management Dashboard
      </Typography>

      {/* Top Toolbar */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Select Recruiters</InputLabel>
            <Select
              multiple
              value={selectedRecruiters}
              onChange={(e) => setSelectedRecruiters(e.target.value)}
              input={<OutlinedInput label="Select Recruiters" />}
              renderValue={(selected) =>
                selected.map(id => recruiters.find(r => r.id === id)?.name || id).join(", ")
              }
            >
              {recruiters.map(r => (
                <MenuItem key={r.id} value={r.id}>
                  <Checkbox checked={selectedRecruiters.indexOf(r.id) > -1} />
                  <ListItemText primary={r.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel>Status Filter</InputLabel>
            <Select
              value={statusFilter}
              label="Status Filter"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="accepted">Accepted</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Shift Template</InputLabel>
            <Select
              value={formData.selectedTemplate}
              label="Shift Template"
              onChange={handleTemplateSelect}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {templates.map((t, idx) => (
                <MenuItem key={idx} value={t.label}>{t.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={2}>
          <Button variant="outlined" onClick={openTemplateModal}>
            Edit Templates
          </Button>
        </Grid>
        <Grid item xs={12} md={2}>
          <Button variant="contained" onClick={() => { setModalOpen(true); setEditingShift(null); }}>
            ➕ Assign Shift
          </Button>
        </Grid>
      </Grid>

      <Box mb={2}>
        <Button variant="contained" onClick={exportShiftsToExcel}>
          Export to Excel
        </Button>
      </Box>

      {/* Week View and Calendar */}
      <Typography variant="h6" gutterBottom>
        🧭 Week View
      </Typography>
      <Box mb={2} display="flex" gap={2}>
  <Button
    variant="outlined"
    onClick={() =>
      setCalendarHeight(calendarHeight === "90vh" ? "600px" : "90vh")
    }
  >
    {calendarHeight === "90vh" ? "Collapse Calendar" : "Expand Calendar (Vertical)"}
  </Button>

  <Button
    variant="outlined"
    onClick={() =>
      setCalendarWidth(calendarWidth === "200%" ? "100%" : "300%")
    }
  >
    {calendarWidth === "200%" ? "Collapse Width" : "Expand Calendar (Wide)"}
  </Button>
</Box>


<Paper
  sx={{
    p: 2,
    mb: 4,
    minHeight: "600px",
    width: calendarWidth,
    maxWidth: "150vw",
    overflowX: calendarWidth !== "100%" ? "auto" : "hidden", // 💡 scroll only if wide
  }}
>
  <FullCalendar
    ref={calendarRef}
    plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
    initialView="timeGridWeek"
    headerToolbar={{
      left: "prev,next today",
      center: "title",
      right: "timeGridWeek,dayGridMonth"
    }}
    height={calendarHeight}
    selectable
    editable
    events={calendarEvents}
    dateClick={handleDateClick}
    eventClick={handleEventClick}
    eventDrop={handleEventDrop}
    eventResize={handleEventResize}
  />
</Paper>


      {/* Floating panel for pending event update */}
      {pendingEventUpdate && (
  <Box sx={{ position: "fixed", bottom: 16, right: 16, zIndex: 1300, background: "white", p: 2, borderRadius: 2, boxShadow: 3 }}>
    <Typography variant="body1" gutterBottom>Unsaved shift update</Typography>
    <Button onClick={handleSavePendingEventUpdate} variant="contained" sx={{ mr: 1 }}>Save</Button>
    <Button onClick={handleCancelPendingEventUpdate} color="secondary" sx={{ mr: 1 }}>Cancel</Button>
    <Button
      variant="outlined"
      color="primary"
      sx={{ mr: 1 }}
      onClick={() => {
        const shift = shifts.find(s => String(s.id) === String(pendingEventUpdate.id));
        if (shift) {
          setEditingShift(shift);
          setFormData({
            date: shift.date,
            startTime: shift.clock_in.slice(11, 16),
            endTime: shift.clock_out.slice(11, 16),
            location: shift.location || "",
            note: shift.note || "",
            recurring: false,
            recurringDays: [],
            selectedTemplate: ""
          });
          setPendingEventUpdate(null); // close panel
          pendingRevertCallbackRef.current = null;
          setModalOpen(true);
        }
      }}
    >
      Edit
    </Button>
    <Button
      variant="outlined"
      color="error"
      onClick={async () => {
        try {
          await fetch(`${API_URL}/automation/shifts/delete/${pendingEventUpdate.id}`, {
            method: "DELETE",
            headers: getAuthHeaders()
          });
          setSuccessMsg("Shift deleted.");
          setPendingEventUpdate(null);
          pendingRevertCallbackRef.current = null;
          fetchShifts();
        } catch (err) {
          setErrorMsg("Error deleting shift.");
        }
      }}
    >
      Delete
    </Button>
  </Box>
)}


      {/* Modal for Adding/Editing Shift */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditingShift(null); }}>
        <Box sx={{
          p: 4,
          bgcolor: "white",
          width: 400,
          mx: "auto",
          mt: "10%",
          borderRadius: 2,
          boxShadow: 6
        }}>
          <Typography variant="h6" gutterBottom>
            {editingShift ? "Edit Shift" : "Add New Shift"}
          </Typography>
          <TextField
            fullWidth
            label="Date"
            type="date"
            margin="normal"
            name="date"
            InputLabelProps={{ shrink: true }}
            value={formData.date}
            onChange={handleFormChange}
          />
          <TextField
            fullWidth
            label="Start Time"
            type="time"
            margin="normal"
            name="startTime"
            InputLabelProps={{ shrink: true }}
            value={formData.startTime}
            onChange={handleFormChange}
          />
          <TextField
            fullWidth
            label="End Time"
            type="time"
            margin="normal"
            name="endTime"
            InputLabelProps={{ shrink: true }}
            value={formData.endTime}
            onChange={handleFormChange}
          />
          <TextField
            fullWidth
            label="Location"
            margin="normal"
            name="location"
            value={formData.location}
            onChange={handleFormChange}
          />
          <TextField
            fullWidth
            label="Note"
            margin="normal"
            name="note"
            value={formData.note}
            onChange={handleFormChange}
          />
          <Box mt={2}>
            <FormControl fullWidth>
              <InputLabel>Recurring</InputLabel>
              <Select
                value={formData.recurring ? "yes" : "no"}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, recurring: e.target.value === "yes" }))
                }
                label="Recurring"
              >
                <MenuItem value="no">No</MenuItem>
                <MenuItem value="yes">Yes</MenuItem>
              </Select>
            </FormControl>
            {formData.recurring && (
              <Box mt={2}>
                <Typography variant="subtitle2">Select Days</Typography>
                <Grid container>
                  {dayLabels.map(day => (
                    <Grid item key={day}>
                      <Checkbox
                        name="recurringDays"
                        value={day}
                        checked={formData.recurringDays.includes(day)}
                        onChange={handleFormChange}
                      />
                      <Typography variant="caption">{day}</Typography>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Box>
          <Box mt={3} display="flex" justifyContent="space-between">
            {editingShift ? (
              <>
                <Button variant="contained" onClick={handleUpdateShift}>
                  Update Shift
                </Button>
                <Button variant="outlined" color="error" onClick={handleDeleteShift}>
                  Delete Shift
                </Button>
              </>
            ) : (
              <Button variant="contained" onClick={handleSubmitShift} disabled={isSubmitting}>
  {isSubmitting ? "Assigning..." : "Submit Shift"}
</Button>

            )}
          </Box>
        </Box>
      </Modal>

      {/* Modal for Shift Template Editor */}
      <Modal open={templateModalOpen} onClose={() => setTemplateModalOpen(false)}>
        <Box sx={{
          p: 4,
          bgcolor: "white",
          width: 500,
          mx: "auto",
          mt: "8%",
          borderRadius: 2,
          boxShadow: 6
        }}>
          <Typography variant="h6" gutterBottom>
            Shift Template Editor
          </Typography>
          <TextField
            fullWidth
            label="Template Label"
            margin="normal"
            name="label"
            value={templateFormData.label}
            onChange={handleTemplateFormChange}
          />
          <TextField
            fullWidth
            label="Start Time"
            type="time"
            margin="normal"
            name="start"
            InputLabelProps={{ shrink: true }}
            value={templateFormData.start}
            onChange={handleTemplateFormChange}
          />
          <TextField
            fullWidth
            label="End Time"
            type="time"
            margin="normal"
            name="end"
            InputLabelProps={{ shrink: true }}
            value={templateFormData.end}
            onChange={handleTemplateFormChange}
          />
          <Box mt={2}>
            <Typography variant="subtitle2">Select Days</Typography>
            <Grid container>
              {dayLabels.map(day => (
                <Grid item key={day}>
                  <Checkbox
                    name="days"
                    value={day}
                    checked={templateFormData.days.includes(day)}
                    onChange={handleTemplateFormChange}
                  />
                  <Typography variant="caption">{day}</Typography>
                </Grid>
              ))}
            </Grid>
          </Box>
          <Box mt={2}>
            <FormControl fullWidth>
              <InputLabel>Recurring</InputLabel>
              <Select
                value={templateFormData.recurring ? "yes" : "no"}
                onChange={(e) =>
                  setTemplateFormData(prev => ({ ...prev, recurring: e.target.value === "yes" }))
                }
                label="Recurring"
              >
                <MenuItem value="yes">Yes</MenuItem>
                <MenuItem value="no">No</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box mt={3} display="flex" justifyContent="space-between">
            <Button variant="contained" onClick={handleTemplateSave}>
              Save Template
            </Button>
            <Button variant="outlined" color="error" onClick={() => setTemplateModalOpen(false)}>
              Cancel
            </Button>
          </Box>
          <Box mt={3}>
            <Typography variant="subtitle1">Existing Templates</Typography>
            {templates.map((temp, index) => (
              <Box key={index} display="flex" alignItems="center" justifyContent="space-between" mt={1} p={1} sx={{ border: "1px solid #ccc", borderRadius: 1 }}>
                <Typography>{temp.label} ({temp.start} - {temp.end} on {temp.days.join(", ")})</Typography>
                <Box>
                  <Button size="small" onClick={() => handleTemplateEdit(index)}>Edit</Button>
                  <Button size="small" color="error" onClick={() => handleTemplateDelete(index)}>Delete</Button>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Modal>

      {/* Notification Snackbars */}
      <Snackbar open={!!successMsg} autoHideDuration={4000} onClose={() => setSuccessMsg("")}>
        <Alert severity="success">{successMsg}</Alert>
      </Snackbar>
      <Snackbar open={!!errorMsg} autoHideDuration={4000} onClose={() => setErrorMsg("")}>
        <Alert severity="error">{errorMsg}</Alert>
      </Snackbar>

 {/* Employee Shift Summary Table */}
<Box mt={4}>
  <Typography variant="h6" gutterBottom>
    Employee Shift Summary
  </Typography>

  <Table>
    <TableHead>
      <TableRow>
        <TableCell />
        <TableCell>Employee Name</TableCell>
        <TableCell align="right"># of Shifts</TableCell>
        <TableCell>Delete Mode</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {recruiters.map((r) => {
        const employeeShifts = shifts.filter((s) => s.recruiter_id === r.id);
        const isExpanded = expandedRows[r.id] || false;
        return (
          <React.Fragment key={r.id}>
            <TableRow hover>
              <TableCell>
                <IconButton size="small" onClick={() => toggleRow(r.id)}>
                  {isExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                </IconButton>
              </TableCell>
              <TableCell
                sx={{ cursor: "pointer", fontWeight: 500 }}
                onClick={() =>
                  navigate(`/manager/employee-shift-view?recruiterId=${r.id}`)
                }
              >
                {r.name}
              </TableCell>
              <TableCell align="right">{employeeShifts.length}</TableCell>
              <TableCell>
                {employeeShifts.some((s) => selectedShiftIds.includes(s.id))
                  ? "Selected"
                  : ""}
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <Box sx={{ margin: 1 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
  🕓 Weekly Hours: {getWeeklyHours(r.id, new Date()).toFixed(1)} hrs
</Typography>

                    {employeeShifts.map((s, i) => (
                      <Box
                        key={i}
                        display="flex"
                        alignItems="center"
                        gap={1}
                        mb={0.5}
                      >
                        <Checkbox
                          size="small"
                          checked={selectedShiftIds.includes(s.id)}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            setSelectedShiftIds((prev) =>
                              e.target.checked
                                ? [...prev, s.id]
                                : prev.filter((id) => id !== s.id)
                            );
                          }}
                        />
                        <Typography variant="caption">
                          📅 {s.date} ({s.clock_in.slice(11, 16)}–{s.clock_out.slice(11, 16)})
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Collapse>
              </TableCell>
            </TableRow>
          </React.Fragment>
        );
      })}
    </TableBody>
  </Table>

  {/* ✅ Delete Selected Button */}
  {selectedShiftIds.length > 0 && (
    <Box mt={2}>
      <Button
        variant="outlined"
        color="error"
        onClick={handleBulkDeleteShifts}
      >
        🗑 Delete Selected ({selectedShiftIds.length})
      </Button>
    </Box>
  )}
</Box>

</Box>
  );
};


export default SecondTeam;
