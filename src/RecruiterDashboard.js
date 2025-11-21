// src/RecruiterDashboard.js
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Paper,
  Stack,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import RecurringAvailabilityForm from "./RecurringAvailabilityForm";
import InteractiveCalendar from "./InteractiveCalendar";
import { useSnackbar } from "notistack";
import moment from "moment-timezone";
import { isoFromParts } from "./utils/datetime";   // already used elsewhere
import SecondEmployeeShiftView from "./pages/sections/SecondEmployeeShiftView";
import MySetmoreCalendar from "./MySetmoreCalendar";
import ManagementFrame from "./components/ui/ManagementFrame";
import RecruiterTabs from "./components/recruiter/RecruiterTabs";
const PAGE_SIZE = 20; // number of slots per page
const LOCAL_TABS = ["calendar", "availability", "shifts"];

const RecruiterDashboard = ({ token }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  /* ---------- form fields ---------- */
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [dailyDuration, setDailyDuration] = useState("60");
  /* ---------- UI + data state ---------- */
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [recruiter, setRecruiter] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const initialTab = searchParams.get("tab");
  const defaultTab = LOCAL_TABS.includes(initialTab) ? initialTab : LOCAL_TABS[0];
  const [activeTab, setActiveTab] = useState(defaultTab);
  const navigate = useNavigate();

  useEffect(() => {
    const queryValue = searchParams.get("tab");
    if (queryValue && !LOCAL_TABS.includes(queryValue)) {
      if (queryValue === "invitations") {
        navigate("/recruiter/invitations", { replace: true });
      } else if (queryValue === "candidate-forms") {
        navigate("/recruiter/invitations?section=forms", { replace: true });
      } else if (queryValue === "upcoming-meetings") {
        navigate("/recruiter/upcoming-meetings", { replace: true });
      } else {
        const params = new URLSearchParams(searchParams);
        params.set("tab", LOCAL_TABS[0]);
        setSearchParams(params, { replace: true });
      }
      return;
    }
    if (!queryValue) {
      const params = new URLSearchParams(searchParams);
      params.set("tab", activeTab);
      setSearchParams(params, { replace: true });
      return;
    }
    if (queryValue !== activeTab) {
      setActiveTab(queryValue);
    }
  }, [activeTab, navigate, searchParams, setSearchParams]);

  const handleLocalTabChange = useCallback((newValue) => {
    if (!LOCAL_TABS.includes(newValue)) {
      return;
    }
    setActiveTab(newValue);
    const params = new URLSearchParams(searchParams);
    if (params.get("tab") !== newValue) {
      params.set("tab", newValue);
      setSearchParams(params, { replace: true });
    }
    const target = document.getElementById(`tab-${newValue}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [searchParams, setSearchParams]);
  /* Pagination and filtering state */
  const [currentPage, setCurrentPage] = useState(1);
  const [filterMonth, setFilterMonth] = useState(""); // format 'YYYY-MM'
  /* NEW ? how many weeks of history we show (default 4) - still used for fetch */
  const [pastWeeks, setPastWeeks] = useState(4);
  const weeksAgoDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - pastWeeks * 7);
    return d;
  }, [pastWeeks]);
  const [selectedSlotIds, setSelectedSlotIds] = useState([]);
  /* dialogs, calendars, misc (unchanged vars) */
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentEditSlot, setCurrentEditSlot] = useState(null);
  const [editDate, setEditDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [pendingSlotUpdate, setPendingSlotUpdate] = useState(null);
  const [calendarRefreshTrigger, setCalendarRefreshTrigger] = useState(Date.now());
  const [coolingTime, setCoolingTime] = useState("0");
  const [dailyMessage, setDailyMessage] = useState("");
  const [dailyError, setDailyError] = useState("");
  const [oneTimeMessage, setOneTimeMessage] = useState("");
  const [oneTimeError, setOneTimeError] = useState("");
  const [cancelConfirmDialogOpen, setCancelConfirmDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [candidateEmailConfirm, setCandidateEmailConfirm] = useState("");
  const [cancelError, setCancelError] = useState("");
  /* ---------- helpers ---------- */
  const sortDesc = useCallback(
    (a, b) =>
      new Date(`${b.date}T${b.start_time}`) - new Date(`${a.date}T${a.start_time}`),
    []
  );
  /* ---------- fetch availability ---------- */
  const fetchSlots = useCallback(async () => {
    if (!token) return;
    setLoadingSlots(true);
    try {
      const { data } = await axios.get(`${API_URL}/my-availability`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const availableSlotsData = data.available_slots || [];
      const filtered = availableSlotsData
        .filter((slot) => {
          if (!weeksAgoDate) return true;
          const start = new Date(`${slot.date}T${slot.start_time}`);
          if (Number.isNaN(start.getTime())) return false;
          return start >= weeksAgoDate;
        })
        .sort(sortDesc);
      setSlots(filtered);
      setCurrentPage(1); // reset page when data reloads
      setFilterMonth(""); // reset month filter on fresh fetch
    } catch (err) {
      enqueueSnackbar(err.response?.data?.error || "Failed to fetch availability.", { variant: "error" });
    } finally {
      setLoadingSlots(false);
    }
  }, [API_URL, token, weeksAgoDate, sortDesc, enqueueSnackbar]);
  /* ---------- initial load + re-fetch on pastWeeks change ---------- */
  useEffect(() => {
    if (!token) return;
    fetchSlots();
    axios
      .get(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setRecruiter(res.data);
        localStorage.setItem("timezone", res.data.timezone || "UTC");
      })
      .catch((e) => console.error("Profile load failed:", e));
  }, [token, fetchSlots, API_URL]);
  /* ---------------- derived ---------------- */
  const filteredSlots = useMemo(() => {
    if (!filterMonth) return slots;
    return slots.filter((s) => s.date.startsWith(filterMonth));
  }, [slots, filterMonth]);
  const nonBookedFilteredSlots = useMemo(() => filteredSlots.filter((s) => !s.booked), [filteredSlots]);
  const paginatedSlots = useMemo(() => {
    const startIdx = (currentPage - 1) * PAGE_SIZE;
    return filteredSlots.slice(startIdx, startIdx + PAGE_SIZE);
  }, [filteredSlots, currentPage]);
  const totalPages = Math.ceil(filteredSlots.length / PAGE_SIZE);
  const handleDelete = useCallback(
    async (slotId) => {
      try {
        await axios.delete(`${API_URL}/delete-availability/${slotId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchSlots();
        setCalendarRefreshTrigger(Date.now());
        setSelectedSlotIds((prev) => prev.filter((id) => id !== slotId));
        enqueueSnackbar("Slot deleted", { variant: "success" });
      } catch (err) {
        enqueueSnackbar(err.response?.data?.error || "Failed to delete slot.", { variant: "error" });
      }
    },
    [API_URL, token, fetchSlots, enqueueSnackbar]
  );
  const handleDeleteSelected = useCallback(async () => {
    if (selectedSlotIds.length === 0) return;
    try {
      await Promise.all(
        selectedSlotIds.map((slotId) =>
          axios.delete(`${API_URL}/delete-availability/${slotId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      enqueueSnackbar("Selected slots deleted", { variant: "success" });
      fetchSlots();
      setCalendarRefreshTrigger(Date.now());
      setSelectedSlotIds([]);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.error || "Failed to delete selected slots.", { variant: "error" });
    }
  }, [API_URL, token, selectedSlotIds, fetchSlots, enqueueSnackbar]);
  const handleSelectSlot = useCallback((slotId, isSelected) => {
    setSelectedSlotIds((prev) =>
      isSelected ? [...prev, slotId] : prev.filter((id) => id !== slotId)
    );
  }, []);
  const handleSelectAll = useCallback(
    (isSelected) => {
      const nonBookedSlotIds = nonBookedFilteredSlots.map((slot) => slot.id);
      setSelectedSlotIds(isSelected ? nonBookedSlotIds : []);
    },
    [nonBookedFilteredSlots]
  );
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };
  const handleMonthChange = (e) => {
    setFilterMonth(e.target.value);
    setCurrentPage(1);
  };
  const handleSubmitOneTime = useCallback(async () => {
    if (!date || !startTime || !endTime) {
      setOneTimeError("All fields are required.");
      setOneTimeMessage("");
      return;
    }
    try {
      const { data } = await axios.post(
        `${API_URL}/set-availability`,
        { date, start_time: startTime, end_time: endTime },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOneTimeMessage(data.message);
      setOneTimeError("");
      setDate("");
      setStartTime("");
      setEndTime("");
      fetchSlots();
      setCalendarRefreshTrigger(Date.now());
    } catch (err) {
      setOneTimeError(err.response?.data?.error || "Failed to set availability.");
      setOneTimeMessage("");
    }
  }, [API_URL, token, date, startTime, endTime, fetchSlots]);
  const handleSubmitDailyAvailability = useCallback(async () => {
    if (!date || !startTime || !endTime || !dailyDuration) {
      setDailyError("All fields (date, start, end, duration) are required.");
      return;
    }
    try {
      const { data } = await axios.post(
        `${API_URL}/set-daily-availability`,
        {
          date,
          start_time: startTime,
          end_time: endTime,
          duration: dailyDuration,
          cooling_time: parseInt(coolingTime) || 0,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDailyMessage(data.message);
      setDailyError("");
      setDate("");
      setStartTime("");
      setEndTime("");
      fetchSlots();
      setCalendarRefreshTrigger(Date.now());
    } catch (err) {
      setDailyError(err.response?.data?.error || "Failed to set daily availability.");
      setDailyMessage("");
    }
  }, [API_URL, token, date, startTime, endTime, dailyDuration, coolingTime, fetchSlots]);
  const handleCancelBooking = useCallback(
    async (bookingId) => {
      if (!candidateEmailConfirm) {
        setCancelError("Please enter the candidate's email.");
        return;
      }
      try {
        await axios.delete(`${API_URL}/cancel-booking/${bookingId}`, {
          params: { email: candidateEmailConfirm },
        });
        enqueueSnackbar("Booking cancelled.", { variant: "success" });
        setCancelConfirmDialogOpen(false);
        setCandidateEmailConfirm("");
        setCancelError("");
        setSelectedBooking(null);
        fetchSlots();
        setCalendarRefreshTrigger(Date.now());
      } catch (err) {
        const detail = err.response?.data?.error || "Failed to cancel booking.";
        setCancelError(detail);
        enqueueSnackbar(detail, { variant: "error" });
      }
    },
    [API_URL, candidateEmailConfirm, fetchSlots, enqueueSnackbar]
  );
  /* Handle edit click */
  const handleEditClick = useCallback((slot) => {
    setCurrentEditSlot(slot);
    setEditDate(slot.date);
    setEditStartTime(slot.start_time);
    setEditEndTime(slot.end_time);
    setEditDialogOpen(true);
  }, []);
  /* Handle edit submit */
  const handleEditSubmit = useCallback(async () => {
    try {
      await axios.put(
        `${API_URL}/update-availability/${currentEditSlot.id}`,
        { date: editDate, start_time: editStartTime, end_time: editEndTime },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditDialogOpen(false);
      enqueueSnackbar("Availability updated.", { variant: "success" });
      fetchSlots();
      setCalendarRefreshTrigger(Date.now());
    } catch (err) {
      const detail = err.response?.data?.error || "Failed to update slot.";
      enqueueSnackbar(detail, { variant: "error" });
    }
  }, [API_URL, token, currentEditSlot, editDate, editStartTime, editEndTime, fetchSlots, enqueueSnackbar]);
  /* Handle slot drop (drag & drop on calendar) */
  const handleSlotDrop = useCallback((slotId, newDate, newStartTime, newEndTime) => {
    setPendingSlotUpdate({ slotId, newDate, newStartTime, newEndTime });
  }, []);
  /* Handle save slot update after drag & drop */
  const handleSaveSlotUpdate = useCallback(async () => {
    if (!pendingSlotUpdate) return;
    const { slotId, newDate, newStartTime, newEndTime } = pendingSlotUpdate;
    try {
      await axios.put(
        `${API_URL}/update-availability/${slotId}`,
        { date: newDate, start_time: newStartTime, end_time: newEndTime },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      enqueueSnackbar("Slot updated via drag.", { variant: "success" });
      setPendingSlotUpdate(null);
      fetchSlots();
      setCalendarRefreshTrigger(Date.now());
    } catch (err) {
      const detail = err.response?.data?.error || "Drag update failed.";
      enqueueSnackbar(detail, { variant: "error" });
    }
  }, [API_URL, token, pendingSlotUpdate, fetchSlots, enqueueSnackbar]);
  /* ------------------------------------------------------------------ */
  /*  RENDER                                                            */
  /* ------------------------------------------------------------------ */
  return (
    <ManagementFrame
      title="Employee Dashboard"
      subtitle="Manage your availability, bookings, and invites."
      fullWidth
      sx={{ minHeight: "100vh", px: { xs: 1, md: 2 } }}
      contentSx={{ p: { xs: 1.5, md: 2.5 } }}
    >
      <RecruiterTabs localTab={activeTab} onLocalTabChange={handleLocalTabChange} />

      <Paper sx={{ mb: 3, p: 2 }} elevation={1}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Need a focused clock view?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Use the new My Time or View My Shift tabs to open the streamlined clock-in workspace.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button variant="outlined" onClick={() => navigate("/recruiter/my-time")}>My Time</Button>
            <Button variant="contained" onClick={() => navigate("/recruiter/my-shifts")}>View My Shift</Button>
          </Stack>
        </Stack>
      </Paper>

      {/* --- OTHER PANELS ABOVE (unchanged) --- */}
      <Grid container spacing={2}>
        {/* --- left column (panels) ------------------------------------------------ */}
        <Grid item xs={12} md={4}>
          {/* Calendar */}
          <Box id="tab-calendar" sx={{ scrollMarginTop: theme.spacing(10) }}>
            <Accordion defaultExpanded={false}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                My Calendar
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <MySetmoreCalendar token={token} />
            </AccordionDetails>
          </Accordion>
          </Box>
          <Box id="tab-availability" sx={{ scrollMarginTop: theme.spacing(10) }}>
            {/* One-Time Availability */}
          <Accordion defaultExpanded={false}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                Set One-Time Availability
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {oneTimeMessage && <Alert severity="success" sx={{ mb: 2 }}>{oneTimeMessage}</Alert>}
              {oneTimeError && <Alert severity="error" sx={{ mb: 2 }}>{oneTimeError}</Alert>}
              <Stack spacing={2}>
                <TextField
                  label="Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
                <TextField
                  label="Start Time"
                  type="time"
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
                <TextField
                  label="End Time"
                  type="time"
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
                <Button variant="contained" onClick={handleSubmitOneTime}>
                  Set Availability
                </Button>
              </Stack>
            </AccordionDetails>
          </Accordion>
          {/* Daily Availability */}
          <Accordion defaultExpanded={false}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                Set Daily Availability
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {dailyMessage && <Alert severity="success" sx={{ mb: 2 }}>{dailyMessage}</Alert>}
              {dailyError && <Alert severity="error" sx={{ mb: 2 }}>{dailyError}</Alert>}
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Date"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Start Time"
                    type="time"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="End Time"
                    type="time"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Slot Duration"
                    select
                    fullWidth
                    value={dailyDuration}
                    onChange={(e) => setDailyDuration(e.target.value)}
                  >
                    <MenuItem value="15">15 min</MenuItem>
                    <MenuItem value="30">30 min</MenuItem>
                    <MenuItem value="45">45 min</MenuItem>
                    <MenuItem value="60">1 hour</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Cooling Time Between Slots (minutes)"
                    type="number"
                    fullWidth
                    value={coolingTime}
                    onChange={(e) => setCoolingTime(e.target.value)}
                    InputProps={{ inputProps: { min: 0, step: 5 } }}
                    InputLabelProps={{ shrink: true }}
                    placeholder="e.g., 5, 10, 15"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" fullWidth onClick={handleSubmitDailyAvailability}>
                    Set Daily Availability
                  </Button>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
          {/* Recurring Availability */}
          <Accordion defaultExpanded={false}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                Set Recurring Availability
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <RecurringAvailabilityForm
                token={token}
                onSuccess={() => {
                  fetchSlots();
                  setCalendarRefreshTrigger(Date.now());
                }}
              />
            </AccordionDetails>
          </Accordion>
          {/* Availability Slots */}
          <Accordion defaultExpanded={false}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                Your Availability Slots
              </Typography>
              <Box sx={{ mt: 1, display: "flex", gap: 2 }}>
                <TextField
                  select
                  size="small"
                  label="Show past weeks"
                  value={pastWeeks}
                  onChange={(e) => setPastWeeks(Number(e.target.value))}
                  sx={{ width: 140 }}
                >
                  {[1, 2, 4, 8, 12, 24].map((w) => (
                    <MenuItem key={w} value={w}>
                      {w === 1 ? "1 week" : `${w} weeks`}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Filter by Month"
                  type="month"
                  size="small"
                  value={filterMonth}
                  onChange={handleMonthChange}
                  sx={{ width: 140 }}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {nonBookedFilteredSlots.length > 0 && (
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Checkbox
                    checked={
                      nonBookedFilteredSlots.length > 0 &&
                      selectedSlotIds.length === nonBookedFilteredSlots.length
                    }
                    indeterminate={
                      selectedSlotIds.length > 0 &&
                      selectedSlotIds.length < nonBookedFilteredSlots.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                  <Typography variant="body1">Select All</Typography>
                  {selectedSlotIds.length > 0 && (
                    <Button
                      variant="contained"
                      color="error"
                      onClick={handleDeleteSelected}
                      sx={{ ml: 2 }}
                    >
                      Delete Selected
                    </Button>
                  )}
                </Box>
              )}
              {loadingSlots ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    p: 3,
                  }}
                >
                  <CircularProgress />
                </Box>
              ) : filteredSlots.length === 0 ? (
                <Typography>No available slots for selected filter.</Typography>
              ) : (
                <Grid container spacing={2}>
                  {paginatedSlots.map((slot) => {
                    const localStart = moment(isoFromParts(
  slot.date,
  slot.start_time,
  slot.timezone            // <- use what the server sent
   ));
                    const localEnd = moment(
   isoFromParts(slot.date, slot.end_time, slot.timezone)   // keep the slots zone
);
                    return (
                      <Grid key={slot.id} item xs={12} sm={6}>
                        <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
                          <Typography variant="subtitle1">
                            {`?? ${localStart.format("YYYY-MM-DD")} | ?? ${localStart.format("HH:mm")} - ${localEnd.format("HH:mm")}`}
                          </Typography>
                          {slot.booked ? (
                            <>
                              <Alert severity="info" sx={{ mt: 1 }}>Booked</Alert>
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="body2">
                                  <strong>Candidate:</strong> {slot.candidate_name}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Position:</strong> {slot.candidate_position || "N/A"}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Email:</strong>{" "}
                                  <Link
                                    to={`/recruiter/candidates/${encodeURIComponent(slot.candidate_email)}`}
                                    style={{ color: "#1976d2", textDecoration: "underline" }}
                                  >
                                    {slot.candidate_email}
                                  </Link>
                                </Typography>
                              </Box>
                              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                <Button
                                  variant="contained"
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    setSelectedBooking(slot);
                                    setCancelError("");
                                    setCandidateEmailConfirm("");
                                    setCancelConfirmDialogOpen(true);
                                  }}
                                >
                                  Cancel Booking
                                </Button>
                              </Stack>
                            </>
                          ) : (
                            <Stack direction="row" spacing={1} sx={{ mt: 1, alignItems: "center" }}>
                              <Button variant="outlined" size="small" onClick={() => handleEditClick(slot)}>
                                Edit
                              </Button>
                              <Button variant="outlined" size="small" color="error" onClick={() => handleDelete(slot.id)}>
                                Delete
                              </Button>
                              <Checkbox
                                checked={selectedSlotIds.includes(slot.id)}
                                onChange={(e) => handleSelectSlot(slot.id, e.target.checked)}
                              />
                            </Stack>
                          )}
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
              {filteredSlots.length > PAGE_SIZE && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 3, gap: 2 }}>
                  <Button
                    variant="outlined"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <Typography sx={{ alignSelf: "center" }}>
                    Page {currentPage} of {totalPages}
                  </Typography>
                  <Button
                    variant="outlined"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Next
                  </Button>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
          </Box>
        </Grid>
        {/* Right Column: Calendar & Upcoming Meetings */}
        <Grid item xs={12} md={8}>
          <Stack spacing={3}>
            <Paper sx={{ p: 3 }} elevation={3}>
              <Typography variant="h6" gutterBottom>
                Interactive Calendar
              </Typography>
              <InteractiveCalendar
                token={token}
                recruiterId={recruiter?.id}
                onSlotDrop={handleSlotDrop}
                refreshTrigger={calendarRefreshTrigger}
              />
              {pendingSlotUpdate && (
                <Box sx={{ mt: 2 }}>
                  <Alert severity="info">
                    You have unsaved changes for slot ID {pendingSlotUpdate.slotId}.{" "}
                    <Button variant="contained" onClick={handleSaveSlotUpdate} sx={{ ml: 2 }}>
                      Save Changes
                    </Button>
                  </Alert>
                </Box>
              )}
            </Paper>
          </Stack>
        </Grid>
      </Grid>
      {loadingSlots && (
        <Box
          sx={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1300,
          }}
        >
          <CircularProgress />
        </Box>
      )}
      {/* Edit Slot Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Availability</DialogTitle>
        <DialogContent>
          <TextField
            label="Date"
            type="date"
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
          />
          <TextField
            label="Start Time"
            type="time"
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={editStartTime}
            onChange={(e) => setEditStartTime(e.target.value)}
          />
          <TextField
            label="End Time"
            type="time"
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={editEndTime}
            onChange={(e) => setEditEndTime(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
      {/* Cancel Booking Confirmation Dialog */}
      <Dialog open={cancelConfirmDialogOpen} onClose={() => setCancelConfirmDialogOpen(false)}>
        <DialogTitle>Confirm Booking Cancellation</DialogTitle>
        <DialogContent>
          <Typography>
            Enter <strong>{selectedBooking?.candidate_email}</strong> to confirm cancellation.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Candidate Email"
            margin="normal"
            value={candidateEmailConfirm}
            onChange={(e) => setCandidateEmailConfirm(e.target.value)}
          />
          {cancelError && <Alert severity="error">{cancelError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              if (candidateEmailConfirm.trim() !== selectedBooking?.candidate_email) {
                setCancelError("Email does not match.");
                return;
              }
              handleCancelBooking(selectedBooking?.booking_id || selectedBooking?.id);
              setCancelConfirmDialogOpen(false);
            }}
          >
            Confirm Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </ManagementFrame>
  );
};
export default RecruiterDashboard;

