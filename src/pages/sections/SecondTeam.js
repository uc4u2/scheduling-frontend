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
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useNavigate } from "react-router-dom";
import { format, endOfMonth, addDays } from "date-fns";
import TimeEntriesPanel from "./TimeEntriesPanel";
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Parse "YYYY-MM-DD" as a LOCAL date (never use new Date("YYYY-MM-DD"))
const asLocalDate = (ymd) => {
  if (!ymd) return new Date();
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

// quick format helpers (local)
const hhmm = (iso) => (iso ? format(new Date(iso), "HH:mm") : "");
const ymdFromIso = (iso) => (iso ? format(new Date(iso), "yyyy-MM-dd") : "");

const toArray = (raw) =>
  Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object"
      ? Object.values(raw)
      : [];
const SecondTeam = () => {
  /* ─────────────────────────── State ─────────────────────────── */
  const [expandedRows, setExpandedRows] = useState({});
  const toggleRow = (id) =>
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));

  const [selectedShiftIds, setSelectedShiftIds] = useState([]);
  const navigate = useNavigate();
  const [recruiters, setRecruiters] = useState([]);
  const [selectedRecruiters, setSelectedRecruiters] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), "yyyy-MM")
  );

  const today = new Date();
  // Add after other useState:
  const [dateRange, setDateRange] = useState({
    start: format(new Date(), "yyyy-MM-dd"),
    end: format(addDays(new Date(), 30), "yyyy-MM-dd"),
  });

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_URL}/departments`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      setDepartments(data.departments || []);
    } catch (err) {
      setErrorMsg("Failed to load departments.");
    }
  };

  /* ───────── omitted: modal / templates / calendar refs … ─────── */

  /* ------------------------------------------------------------------
     ①  Load recruiter list once on mount
  ------------------------------------------------------------------ */
  useEffect(() => {
    fetchRecruiters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchRecruiters();
  }, [selectedDepartment]);

  /* ------------------------------------------------------------------
     ②  After we have recruiter IDs – or the range / selection changes –
        pull shifts.
  ------------------------------------------------------------------ */
  useEffect(() => {
    if (!recruiters.length || !selectedRecruiters.length) return;
    fetchShifts();
  }, [recruiters, selectedRecruiters, dateRange]);

  /* ------------------------------------------------------------------
     Fetch recruiters and auto-select them on the first load
  ------------------------------------------------------------------ */
  const fetchRecruiters = async () => {
    try {
      const url = selectedDepartment
        ? `${API_URL}/manager/recruiters?department_id=${selectedDepartment}`
        : `${API_URL}/manager/recruiters`;

      const res = await fetch(url, {
        headers: getAuthHeaders(),
      });

      const data = await res.json();
      const list = (data.recruiters || []).map((r) => ({
        ...r,
        name: r.name || `${r.first_name || ""} ${r.last_name || ""}`.trim(),
      }));

      setRecruiters(list);

      setSelectedRecruiters((prev) =>
        prev.length === 0 ? list.map((r) => r.id) : prev
      );
    } catch (err) {
      setErrorMsg("Failed to load recruiters.");
    }
  };

  /* ------------------------------------------------------------------
     Fetch shifts for the current dateRange and selected recruiters
  ------------------------------------------------------------------ */
  const fetchShifts = async () => {
    try {
      const ids = selectedRecruiters.length
        ? selectedRecruiters.join(",")
        : recruiters.map((r) => r.id).join(",");

      const url = `${API_URL}/automation/shifts/range?start_date=${dateRange.start}&end_date=${dateRange.end}&recruiter_ids=${ids}`;

      const res = await fetch(url, { headers: getAuthHeaders() });
      const data = await res.json();
      setShifts(data.shifts || []);
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
    let current = asLocalDate(baseDate);
    while (result.length < count) {
      if (days.includes(dayLabels[current.getDay()])) {
        result.push(format(current, "yyyy-MM-dd"));
      }
      current.setDate(current.getDate() + 1);
    }
    return result;
  };

  // Check for conflicts between shifts
  const hasConflict = (
    recruiterId,
    date,
    startTime,
    endTime,
    shiftIdToExclude = null
  ) => {
    const newStart = new Date(`${date}T${startTime}`);
    const newEnd = new Date(`${date}T${endTime}`);
    return shifts.some((s) => {
      if (s.recruiter_id !== recruiterId) return false;
      if (shiftIdToExclude && s.id === shiftIdToExclude) return false;
      const existingStart = new Date(s.clock_in);
      const existingEnd = new Date(s.clock_out);
      return newStart < existingEnd && newEnd > existingStart;
    });
  };

  // Handle changes in the shift assignment form
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      if (name === "recurring") {
        setFormData((prev) => ({ ...prev, recurring: checked }));
      } else if (name === "recurringDays") {
        setFormData((prev) => {
          const newDays = checked
            ? [...prev.recurringDays, value]
            : prev.recurringDays.filter((day) => day !== value);
          return { ...prev, recurringDays: newDays };
        });
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle template selection
  const handleTemplateSelect = (e) => {
    const templateLabel = e.target.value;
    const template = templates.find((t) => t.label === templateLabel);
    if (template) {
      setFormData((prev) => ({
        ...prev,
        selectedTemplate: templateLabel,
        startTime: template.start,
        endTime: template.end,
        recurring: template.recurring,
        recurringDays: template.days,
      }));
    } else {
      setFormData((prev) => ({ ...prev, selectedTemplate: "" }));
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
        if (
          hasConflict(
            recruiterId,
            dateStr,
            formData.startTime,
            formData.endTime
          )
        ) {
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
          created_by: parseInt(localStorage.getItem("userId")),
        };

        try {
          const res = await fetch(`${API_URL}/automation/shifts/create`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...getAuthHeaders(),
            },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            failures.push(
              `🔴 Failed - Recruiter ${recruiterId} on ${dateStr}`
            );
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

    if (dates.length > 0) {
      const first = dates[0];
      const last = dates[dates.length - 1];
      setDateRange({ start: first, end: last });
      setSelectedMonth(first.slice(0, 7)); // keep month picker in sync
    }

    setModalOpen(false);

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
      status: pendingEventUpdate.status,
    };
    try {
      const res = await fetch(
        `${API_URL}/automation/shifts/update/${pendingEventUpdate.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify(payload),
        }
      );
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
      note: dropInfo.event.extendedProps.note,
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
      note: resizeInfo.event.extendedProps.note,
    });
  };

  // When an event is clicked, open the modal for editing
  const handleEventClick = (clickInfo) => {
    const shift = shifts.find((s) => String(s.id) === clickInfo.event.id);
    if (shift) {
      setEditingShift(shift);
      setFormData({
        date: ymdFromIso(shift.clock_in) || shift.date,
        startTime: hhmm(shift.clock_in),
        endTime: hhmm(shift.clock_out),
        location: shift.location || "",
        note: shift.note || "",
        recurring: false,
        recurringDays: [],
        selectedTemplate: "",
      });
      setModalOpen(true);
    }
  };

  // When a blank date is clicked, open the add new shift modal
  const handleDateClick = (clickInfo) => {
    setEditingShift(null);
    setFormData({
      date: format(clickInfo.date, "yyyy-MM-dd"),
      startTime: "09:00",
      endTime: "17:00",
      location: "",
      note: "",
      recurring: false,
      recurringDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      selectedTemplate: "",
    });
    setModalOpen(true);
  };

  // Prepare filtered shifts for calendar events
  const filteredShifts = shifts
    .filter((s) => (statusFilter === "all" ? true : s.status === statusFilter))
    .filter((s) =>
      selectedRecruiters.length === 0
        ? true
        : selectedRecruiters.includes(s.recruiter_id)
    );

  const calendarEvents = filteredShifts.map((s) => ({
    id: s.id,
    title: `${
      recruiters.find((r) => r.id === s.recruiter_id)?.name || s.recruiter_id
    } (${s.status})`,
    start: s.clock_in,
    end: s.clock_out,
    extendedProps: {
      location: s.location,
      note: s.note,
      recruiter_id: s.recruiter_id,
      status: s.status,
    },
  }));

  // Export shifts to Excel
  const exportShiftsToExcel = () => {
    const data = filteredShifts.map((s) => ({
      Recruiter:
        recruiters.find((r) => r.id === s.recruiter_id)?.name ||
        s.recruiter_id,
      Date: s.date,
      ClockIn: s.clock_in,
      ClockOut: s.clock_out,
      Location: s.location || "",
      Note: s.note || "",
      Status: s.status,
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
    setTemplateFormData({
      label: "",
      start: "",
      end: "",
      days: [],
      recurring: true,
    });
    setEditingTemplateIndex(null);
    setTemplateModalOpen(true);
  };

  const handleTemplateFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "days") {
      setTemplateFormData((prev) => {
        const newDays = checked
          ? [...prev.days, value]
          : prev.days.filter((d) => d !== value);
        return { ...prev, days: newDays };
      });
    } else {
      setTemplateFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleTemplateSave = () => {
    if (
      !templateFormData.label ||
      !templateFormData.start ||
      !templateFormData.end ||
      templateFormData.days.length === 0
    ) {
      setErrorMsg("Please fill all template fields.");
      return;
    }
    if (editingTemplateIndex !== null) {
      const updatedTemplates = [...templates];
      updatedTemplates[editingTemplateIndex] = { ...templateFormData };
      setTemplates(updatedTemplates);
      setSuccessMsg("Template updated successfully.");
    } else {
      setTemplates((prev) => [...prev, { ...templateFormData }]);
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
    setTemplates((prev) => prev.filter((_, i) => i !== index));
    setSuccessMsg("Template deleted successfully.");
  };

  // Prepare employee shift summary for table below calendar
  const employeeShiftData = recruiters.map((r) => {
    const employeeShifts = shifts.filter((s) => s.recruiter_id === r.id);
    return {
      id: r.id,
      name: r.name,
      shiftCount: employeeShifts.length,
      shifts: employeeShifts,
    };
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
            <InputLabel>Department</InputLabel>
            <Select
              value={selectedDepartment}
              label="Department"
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {toArray(departments).map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Select Employees</InputLabel>
            <Select
              multiple
              value={selectedRecruiters}
              onChange={(e) => setSelectedRecruiters(e.target.value)}
              input={<OutlinedInput label="Select Employees" />}
              renderValue={(selected) =>
                recruiters
                  .filter((r) => selected.includes(r.id))
                  .map((r) => r.name)
                  .join(", ")
              }
            >
              {recruiters.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  <Checkbox checked={selectedRecruiters.includes(r.id)} />
                  <ListItemText primary={r.name} secondary={r.email} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Status filter */}
        <Grid item xs={12} md={2}>
          {/* … unchanged code … */}
        </Grid>

        {/* Template picker */}
        <Grid item xs={12} md={3}>
          {/* … unchanged code … */}
        </Grid>

        {/* Edit templates button */}
        <Grid item xs={12} md={2}>
          <Button variant="outlined" onClick={openTemplateModal}>
            Edit Templates
          </Button>
        </Grid>

        {/* ───────── Month picker – drives dateRange ───────── */}
        <Grid item xs={12} md={2}>
          <TextField
            type="month"
            label="Month"
            value={selectedMonth}
            onChange={(e) => {
              const month = e.target.value; // "YYYY-MM"
              setSelectedMonth(month);

              const first = `${month}-01`;
              const last = format(endOfMonth(asLocalDate(first)), "yyyy-MM-dd");

              setDateRange({ start: first, end: last });
            }}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Grid>

        {/* Assign-shift button */}
        <Grid item xs={12} md={2}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => {
              setModalOpen(true);
              setEditingShift(null);
            }}
          >
            ➕ Assign&nbsp;Shift
          </Button>
        </Grid>
      </Grid>{" "}
      {/* ← closes the toolbar grid container */}

      /* ───────── Buttons that live *below* the toolbar ───────── */
      <Box mb={2}>
        <Button variant="contained" onClick={exportShiftsToExcel}>
          Export&nbsp;to&nbsp;Excel
        </Button>
      </Box>

      {/* Week View and Calendar */}
      <Typography variant="h6" gutterBottom>
        🧭 Week View
      </Typography>
      <Paper sx={{ p: 2, mb: 4 }}>
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "timeGridWeek,dayGridMonth",
          }}
          selectable={true}
          editable={true}
          events={calendarEvents}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
        />
      </Paper>

      {/* Floating panel for pending event update */}
      {pendingEventUpdate && (
        <Box
          sx={{
            position: "fixed",
            bottom: 16,
            right: 16,
            zIndex: 1300,
            background: "white",
            p: 2,
            borderRadius: 2,
            boxShadow: 3,
          }}
        >
          <Typography variant="body1" gutterBottom>
            Unsaved shift update
          </Typography>
          <Button
            onClick={handleSavePendingEventUpdate}
            variant="contained"
            sx={{ mr: 1 }}
          >
            Save
          </Button>
          <Button
            onClick={handleCancelPendingEventUpdate}
            color="secondary"
            sx={{ mr: 1 }}
          >
            Cancel
          </Button>
          <Button
            variant="outlined"
            color="primary"
            sx={{ mr: 1 }}
            onClick={() => {
              const shift = shifts.find(
                (s) => String(s.id) === String(pendingEventUpdate.id)
              );
              if (shift) {
                setEditingShift(shift);
                setFormData({
                  date: ymdFromIso(shift.clock_in) || shift.date,
                  startTime: hhmm(shift.clock_in),
                  endTime: hhmm(shift.clock_out),
                  location: shift.location || "",
                  note: shift.note || "",
                  recurring: false,
                  recurringDays: [],
                  selectedTemplate: "",
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
                await fetch(
                  `${API_URL}/automation/shifts/delete/${pendingEventUpdate.id}`,
                  {
                    method: "DELETE",
                    headers: getAuthHeaders(),
                  }
                );
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
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingShift(null);
        }}
      >
        <Box
          sx={{
            p: 4,
            bgcolor: "white",
            width: 400,
            mx: "auto",
            mt: "10%",
            borderRadius: 2,
            boxShadow: 6,
          }}
        >
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
                  setFormData((prev) => ({
                    ...prev,
                    recurring: e.target.value === "yes",
                  }))
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
                  {dayLabels.map((day) => (
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
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleDeleteShift}
                >
                  Delete Shift
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmitShift}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Assigning..." : "Submit Shift"}
              </Button>
            )}
          </Box>
        </Box>
      </Modal>

      {/* Modal for Shift Template Editor */}
      <Modal
        open={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
      >
        <Box
          sx={{
            p: 4,
            bgcolor: "white",
            width: 500,
            mx: "auto",
            mt: "8%",
            borderRadius: 2,
            boxShadow: 6,
          }}
        >
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
              {dayLabels.map((day) => (
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
                  setTemplateFormData((prev) => ({
                    ...prev,
                    recurring: e.target.value === "yes",
                  }))
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
            <Button
              variant="outlined"
              color="error"
              onClick={() => setTemplateModalOpen(false)}
            >
              Cancel
            </Button>
          </Box>
          <Box mt={3}>
            <Typography variant="subtitle1">Existing Templates</Typography>
            {templates.map((temp, index) => (
              <Box
                key={index}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mt={1}
                p={1}
                sx={{ border: "1px solid #ccc", borderRadius: 1 }}
              >
                <Typography>
                  {temp.label} ({temp.start} - {temp.end} on{" "}
                  {temp.days.join(", ")})
                </Typography>
                <Box>
                  <Button size="small" onClick={() => handleTemplateEdit(index)}>
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleTemplateDelete(index)}
                  >
                    Delete
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Modal>

      {/* Notification Snackbars */}
      <Snackbar
        open={!!successMsg}
        autoHideDuration={4000}
        onClose={() => setSuccessMsg("")}
      >
        <Alert severity="success">{successMsg}</Alert>
      </Snackbar>
      <Snackbar
        open={!!errorMsg}
        autoHideDuration={4000}
        onClose={() => setErrorMsg("")}
      >
        <Alert severity="error">{errorMsg}</Alert>
      </Snackbar>

      <TimeEntriesPanel recruiters={recruiters} />

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
              const employeeShifts = shifts.filter(
                (s) => s.recruiter_id === r.id
              );
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
                        navigate(
                          `/manager/employee-shift-view?recruiterId=${r.id}`
                        )
                      }
                    >
                      {r.name}
                    </TableCell>
                    <TableCell align="right">
                      {employeeShifts.length}
                    </TableCell>
                    <TableCell>
                      {employeeShifts.some((s) =>
                        selectedShiftIds.includes(s.id)
                      )
                        ? "Selected"
                        : ""}
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell
                      style={{ paddingBottom: 0, paddingTop: 0 }}
                      colSpan={4}
                    >
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
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
                                📅 {s.date} ({hhmm(s.clock_in)}–{hhmm(s.clock_out)})
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
