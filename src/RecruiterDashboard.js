// src/RecruiterDashboard.js
import React, { useState, useEffect, useCallback } from "react";
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
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  IconButton,
  Tooltip,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "./utils/api";
import RecurringAvailabilityForm from "./RecurringAvailabilityForm";
import InteractiveCalendar from "./InteractiveCalendar";
import { useSnackbar } from "notistack";
import SecondEmployeeShiftView from "./pages/sections/SecondEmployeeShiftView";
import MySetmoreCalendar from "./MySetmoreCalendar";
import ManagementFrame from "./components/ui/ManagementFrame";
import RecruiterTabs from "./components/recruiter/RecruiterTabs";
const LOCAL_TABS = ["calendar", "availability"];

const RecruiterDashboard = ({ token }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  /* ---------- form fields ---------- */
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [dailyDuration, setDailyDuration] = useState("60");
  /* ---------- UI + data state ---------- */
  const [recruiter, setRecruiter] = useState(null);
  const [authInfo, setAuthInfo] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const allowHrAccess = Boolean(
    authInfo?.is_manager ||
    authInfo?.can_manage_onboarding ||
    authInfo?.can_manage_onboarding_limited
  );
  const availableTabs = allowHrAccess ? LOCAL_TABS : ["calendar"];
  const { enqueueSnackbar } = useSnackbar();
  const initialTab = searchParams.get("tab");
  const defaultTab = availableTabs.includes(initialTab) ? initialTab : availableTabs[0];
  const [activeTab, setActiveTab] = useState(defaultTab);
  const navigate = useNavigate();

  useEffect(() => {
    const queryValue = searchParams.get("tab");
    if (queryValue && !availableTabs.includes(queryValue)) {
      if (queryValue === "invitations") {
        navigate("/employee/invitations", { replace: true });
      } else if (queryValue === "candidate-forms") {
        navigate("/employee/invitations?section=forms", { replace: true });
      } else if (queryValue === "upcoming-meetings") {
        navigate("/employee/upcoming-meetings", { replace: true });
      } else if (queryValue === "candidate-search") {
        navigate("/employee/candidate-search", { replace: true });
      } else {
        const params = new URLSearchParams(searchParams);
        params.set("tab", availableTabs[0]);
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

  useEffect(() => {
    if (activeTab === "availability" && !allowHrAccess) {
      setActiveTab("calendar");
      const params = new URLSearchParams(searchParams);
      params.set("tab", "calendar");
      setSearchParams(params, { replace: true });
    }
  }, [activeTab, allowHrAccess, searchParams, setSearchParams]);

  const handleLocalTabChange = useCallback((newValue) => {
    if (!availableTabs.includes(newValue)) {
      return;
    }
    if (newValue === "availability" && !allowHrAccess) {
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
  }, [searchParams, setSearchParams, availableTabs, allowHrAccess]);
  /* dialogs, calendars, misc (unchanged vars) */
  const [pendingSlotUpdate, setPendingSlotUpdate] = useState(null);
  const [calendarRefreshTrigger, setCalendarRefreshTrigger] = useState(Date.now());
  const [interactiveFullScreenOpen, setInteractiveFullScreenOpen] = useState(false);
  const [coolingTime, setCoolingTime] = useState("0");
  const [dailyMessage, setDailyMessage] = useState("");
  const [dailyError, setDailyError] = useState("");
  const [oneTimeMessage, setOneTimeMessage] = useState("");
  const [oneTimeError, setOneTimeError] = useState("");
  /* ---------- initial load ---------- */
  useEffect(() => {
    if (!token) return;
    api
      .get("/auth/me")
      .then((res) => setAuthInfo(res.data || null))
      .catch(() => setAuthInfo(null))
      .finally(() => setAuthLoaded(true));
    api
      .get("/profile")
      .then((res) => {
        setRecruiter(res.data);
        localStorage.setItem("timezone", res.data.timezone || "UTC");
      })
      .catch((e) => console.error("Profile load failed:", e));
  }, [token]);
  const handleSubmitOneTime = useCallback(async () => {
    if (!date || !startTime || !endTime) {
      setOneTimeError("All fields are required.");
      setOneTimeMessage("");
      return;
    }
    try {
      const { data } = await api.post("/set-availability", {
        date,
        start_time: startTime,
        end_time: endTime,
      });
      setOneTimeMessage(data.message);
      setOneTimeError("");
      setDate("");
      setStartTime("");
      setEndTime("");
      setCalendarRefreshTrigger(Date.now());
    } catch (err) {
      setOneTimeError(err.response?.data?.error || "Failed to set availability.");
      setOneTimeMessage("");
    }
  }, [date, startTime, endTime]);
  const handleSubmitDailyAvailability = useCallback(async () => {
    if (!date || !startTime || !endTime || !dailyDuration) {
      setDailyError("All fields (date, start, end, duration) are required.");
      return;
    }
    try {
      const { data } = await api.post("/set-daily-availability", {
        date,
        start_time: startTime,
        end_time: endTime,
        duration: dailyDuration,
        cooling_time: parseInt(coolingTime) || 0,
      });
      setDailyMessage(data.message);
      setDailyError("");
      setDate("");
      setStartTime("");
      setEndTime("");
      setCalendarRefreshTrigger(Date.now());
    } catch (err) {
      setDailyError(err.response?.data?.error || "Failed to set daily availability.");
      setDailyMessage("");
    }
  }, [date, startTime, endTime, dailyDuration, coolingTime]);
  /* Handle slot drop (drag & drop on calendar) */
  const handleSlotDrop = useCallback((slotId, newDate, newStartTime, newEndTime) => {
    setPendingSlotUpdate({ slotId, newDate, newStartTime, newEndTime });
  }, []);
  /* Handle save slot update after drag & drop */
  const handleSaveSlotUpdate = useCallback(async () => {
    if (!pendingSlotUpdate) return;
    const { slotId, newDate, newStartTime, newEndTime } = pendingSlotUpdate;
    try {
      await api.put(`/update-availability/${slotId}`, {
        date: newDate,
        start_time: newStartTime,
        end_time: newEndTime,
      });
      enqueueSnackbar("Slot updated via drag.", { variant: "success" });
      setPendingSlotUpdate(null);
      setCalendarRefreshTrigger(Date.now());
    } catch (err) {
      const detail = err.response?.data?.error || "Drag update failed.";
      enqueueSnackbar(detail, { variant: "error" });
    }
  }, [pendingSlotUpdate, enqueueSnackbar]);
  /* ------------------------------------------------------------------ */
  /*  RENDER                                                            */
  /* ------------------------------------------------------------------ */
  return (
    <ManagementFrame
      title="Employee Dashboard"
      subtitle="Manage your availability, bookings, and invites."
      fullWidth
      sx={{ minHeight: "100vh", mt: { xs: 4, md: 0 }, px: { xs: 1, md: 2 } }}
      contentSx={{ p: { xs: 1.5, md: 2.5 } }}
    >
      <RecruiterTabs
        localTab={activeTab}
        onLocalTabChange={handleLocalTabChange}
        allowHrAccess={authLoaded ? allowHrAccess : null}
        isLoading={!authLoaded}
      />

      {activeTab === "calendar" ? (
        <Grid container spacing={2}>
          {allowHrAccess ? (
            <>
              <Grid item xs={12} md={6}>
                <Box id="tab-calendar" sx={{ scrollMarginTop: theme.spacing(10) }}>
                  <Accordion defaultExpanded={true}>
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
              </Grid>
              <Grid item xs={12} md={6}>
                <Accordion defaultExpanded={true}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ width: "100%" }}>
                      <Typography variant="h6" sx={{ color: theme.palette.primary.main, flexGrow: 1 }}>
                        Interactive Calendar
                      </Typography>
                      {/* Full Screen handled inside InteractiveCalendar header */}
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    <InteractiveCalendar
                      token={token}
                      recruiterId={recruiter?.id}
                      onSlotDrop={handleSlotDrop}
                      refreshTrigger={calendarRefreshTrigger}
                      onOpenFullScreen={() => setInteractiveFullScreenOpen(true)}
                      embedded
                      readOnly={false}
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
                  </AccordionDetails>
                </Accordion>
              </Grid>
            </>
          ) : (
              <Grid item xs={12}>
              {authLoaded ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box id="tab-calendar" sx={{ scrollMarginTop: theme.spacing(10) }}>
                      <Accordion defaultExpanded={true}>
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
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Accordion defaultExpanded={true}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ width: "100%" }}>
                          <Typography variant="h6" sx={{ color: theme.palette.primary.main, flexGrow: 1 }}>
                            Interactive Calendar
                          </Typography>
                          {/* Full Screen handled inside InteractiveCalendar header */}
                        </Stack>
                      </AccordionSummary>
                      <AccordionDetails>
                        <InteractiveCalendar
                          token={token}
                          recruiterId={recruiter?.id}
                          onSlotDrop={handleSlotDrop}
                          refreshTrigger={calendarRefreshTrigger}
                          onOpenFullScreen={() => setInteractiveFullScreenOpen(true)}
                          embedded
                          readOnly={true}
                        />
                      </AccordionDetails>
                    </Accordion>
                  </Grid>
                </Grid>
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.secondary">
                    Loading calendar…
                  </Typography>
                </Box>
              )}
            </Grid>
          )}
        </Grid>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12}>
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
                    <Button variant="contained" onClick={handleSubmitOneTime} fullWidth={isSmDown}>
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
                      setCalendarRefreshTrigger(Date.now());
                    }}
                  />
                </AccordionDetails>
              </Accordion>
            </Box>
          </Grid>
        </Grid>
      )}
      <Dialog
        open={interactiveFullScreenOpen}
        onClose={() => setInteractiveFullScreenOpen(false)}
        fullScreen
      >
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h6">Interactive Calendar</Typography>
        <Tooltip title="Close full screen">
          <IconButton
            size="small"
            onClick={() => setInteractiveFullScreenOpen(false)}
            aria-label="Close full screen interactive calendar"
          >
            <CloseFullscreenIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </DialogTitle>
        <DialogContent dividers>
          <InteractiveCalendar
            token={token}
            recruiterId={recruiter?.id}
            onSlotDrop={handleSlotDrop}
            refreshTrigger={calendarRefreshTrigger}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInteractiveFullScreenOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </ManagementFrame>
  );
};
export default RecruiterDashboard;
