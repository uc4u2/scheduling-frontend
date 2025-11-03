// src/pages/NewManagementDashboard.js
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  MenuItem,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogActions,
  Select,
  InputLabel,
  FormControl,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  IconButton,
  Tooltip,
  CssBaseline,
  Chip,
  Checkbox,
  OutlinedInput,
  useMediaQuery,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Collapse,
} from "@mui/material";
import ShiftSwapPanel from "./components/ShiftSwapPanel";

import { useTheme } from "@mui/material/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ArchiveIcon from "@mui/icons-material/Archive";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import MenuIcon from "@mui/icons-material/Menu";
import {
  Dashboard,
  CalendarToday,
  People,
  EventNote,
  Assignment,
  Article,
  ReceiptLong,
  History,
  Settings,
  Business,
  Paid,
  Summarize,
  FolderShared,
  OpenInFull,
  CloseFullscreen,
} from "@mui/icons-material";
import RecruiterComparisonPanel from "./components/RecruiterComparisonPanel";

import { useNavigate } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import AllEmployeeSlotsCalendar from "./pages/sections/AllEmployeeSlotsCalendar";
import SecondNewManagementDashboard from "./pages/sections/management/SecondNewManagementDashboard";

// Sections imports
import Overview from "./pages/sections/Overview";
import MasterCalendar from "./pages/sections/MasterCalendar";
import SecondMasterCalendar from "./pages/sections/SecondMasterCalendar";

import Team from "./pages/sections/Team";
import LeaveRequests from "./pages/sections/LeaveRequests";
import Meetings from "./pages/sections/Meetings";
import ROE from "./pages/sections/ROE";
import T4 from "./pages/sections/T4";
import W2 from "./pages/sections/W2";
import SettingsPage from "./pages/sections/Settings";
import AuditHistory from "./components/AuditHistory";
import MonthlyAttendanceCalendar from "./components/MonthlyAttendanceCalendar";
import CompanyProfile from "./pages/sections/CompanyProfile";
import Payroll from "./pages/sections/Payroll";
import EmployeeProfileForm from "./pages/Payroll/EmployeeProfileForm";
import Tax from "./pages/sections/Tax";
import SavedPayrollsPortal from "./pages/sections/SavedPayrollsPortal";
import WebsiteSuite from "./pages/sections/management/WebsiteSuite";
import ManagementFrame from "./components/ui/ManagementFrame";
import { getUserTimezone } from "./utils/timezone";
import TeamActivity from "./TeamActivity";
import EnhancedMasterCalendar from "./EnhancedMasterCalendar";
import CandidateFunnel from "./CandidateFunnel";
import PerformanceMetrics from "./PerformanceMetrics";
import CandidateSearch from "./CandidateSearch";
import FeedbackNotes from "./FeedbackNotes";
import RecruiterAvailabilityTracker from "./RecruiterAvailabilityTracker";

// NEW — FullCalendar for the Setmore-style panel
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import { format, endOfMonth } from "date-fns";

// NEW — Toggle group for views/options
import { ToggleButtonGroup, ToggleButton } from "@mui/material";

const drawerWidth = 240;
const collapsedWidth = 64;
const APP_BAR_HEIGHT = 64;


const overviewChildrenConfig = [
  { labelKey: "manager.menu.teamActivityOverview", key: "team-activity", icon: <Dashboard /> },
  { labelKey: "manager.menu.masterCalendar", key: "master-calendar", icon: <CalendarToday /> },
  { labelKey: "manager.menu.candidateFunnel", key: "candidate-funnel", icon: <Assignment /> },
  { labelKey: "manager.menu.recruiterPerformance", key: "recruiter-performance", icon: <History /> },
  { labelKey: "manager.menu.candidateSearch", key: "candidate-search", icon: <People /> },
  { labelKey: "manager.menu.feedbackNotes", key: "feedback-notes", icon: <Article /> },
  { labelKey: "manager.menu.recruiterAvailability", key: "recruiter-availability", icon: <CalendarToday /> },
  { labelKey: "manager.menu.recentBookings", key: "recent-bookings", icon: <History /> },
];


const menuConfig = [
  { labelKey: "manager.menu.advancedManagement", key: "advanced-management", icon: <Dashboard /> },

  // Employee group
  {
    labelKey: "manager.menu.employeeManagement",
    key: "employee-group",
    icon: <People />,
    children: [
      { labelKey: "manager.menu.companyProfile", key: "CompanyProfile", icon: <Business /> },
      { labelKey: "manager.menu.employeeProfiles", key: "employee-profiles", icon: <FolderShared /> },
    ],
  },

  // Website & pages stays top-level
  { labelKey: "manager.menu.websitePages", key: "website-pages", icon: <Article /> },

  // Advanced Payroll group
  {
    labelKey: "manager.menu.advancedPayroll",
    key: "payroll-group",
    icon: <Paid />,
    children: [
      { labelKey: "manager.menu.payroll", key: "payroll", icon: <Paid /> },
      { labelKey: "manager.menu.savedPayrolls", key: "saved-payrolls", icon: <FolderShared /> },
      { labelKey: "manager.menu.tax", key: "Tax", icon: <Summarize /> },
      { labelKey: "manager.menu.roe", key: "roe", icon: <Article /> },
      { labelKey: "manager.menu.t4", key: "T4", icon: <ReceiptLong /> },
      { labelKey: "manager.menu.w2", key: "W2", icon: <ReceiptLong /> },
    ],
  },

  // Shifts & Availability group
  {
    labelKey: "manager.menu.shiftsAvailability",
    key: "shifts-group",
    icon: <CalendarToday />,
    children: [
      { labelKey: "manager.menu.availableShifts", key: "available-shifts", icon: <CalendarToday /> },
      { labelKey: "manager.menu.availableSlots", key: "available-slots", icon: <EventNote /> },
      { labelKey: "manager.menu.shiftManagement", key: "team", icon: <People /> },
    ],
  },

  // Remaining single items
  { labelKey: "manager.menu.leaves", key: "leaves", icon: <Assignment /> },
  { labelKey: "manager.menu.swapApprovals", key: "swap-approvals", icon: <Assignment /> },
  { labelKey: "manager.menu.auditHistory", key: "audit", icon: <History /> },
  { labelKey: "manager.menu.attendanceCalendar", key: "attendance", icon: <CalendarToday /> },

  // Move Overview (with children) to the bottom, just above Settings
  {
    labelKey: "manager.menu.overview",
    key: "overview",
    icon: <Dashboard />,
    children: overviewChildrenConfig,
  },
  { labelKey: "manager.menu.settings", key: "settings", icon: <Settings /> },
];

const getDepartmentArray = (raw) =>
  Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object"
    ? Object.values(raw)
    : [];

// PDF export helper function
const exportToPDF = async () => {
  const input = document.getElementById("comparison-report");
  if (!input) return;
  const canvas = await html2canvas(input);
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF();
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  pdf.save("employee-comparison.pdf");
};

/* ─────────────────────────────────────────────────────────
   Helpers for AvailableShiftsPanel (Setmore-style)
─────────────────────────────────────────────────────────── */
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const toArray = (raw) =>
  Array.isArray(raw) ? raw : raw && typeof raw === "object" ? Object.values(raw) : [];

const COLORS = [
  "#E57373",
  "#81C784",
  "#64B5F6",
  "#FFD54F",
  "#4DB6AC",
  "#BA68C8",
  "#FF8A65",
  "#A1887F",
  "#90A4AE",
  "#F06292",
];
const getColorForRecruiter = (recruiterId) => COLORS[recruiterId % COLORS.length];

/* ─────────────────────────────────────────────────────────
   AvailableShiftsPanel — Month/Week/Day + Full-Screen popup
─────────────────────────────────────────────────────────── */
const AvailableShiftsPanel = ({ token, openFullScreenOnMount = false, onCloseFullScreen }) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));

  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [recruiters, setRecruiters] = useState([]);
  const [selectedRecruiters, setSelectedRecruiters] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [dateRange, setDateRange] = useState({
    start: format(new Date(), "yyyy-MM-01"),
    end: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  });

  const [shifts, setShifts] = useState([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [error, setError] = useState("");

  // NEW — enterprise options
  const [calendarView, setCalendarView] = useState("dayGridMonth"); // "timeGridWeek" | "timeGridDay"
  const [showWeekends, setShowWeekends] = useState(true);
  const [workHoursOnly, setWorkHoursOnly] = useState(false);
  const [compactDensity, setCompactDensity] = useState(false);
  const [statusFilter, setStatusFilter] = useState([]); // [] => all

  // NEW — full-screen popup control
  const [fullScreenOpen, setFullScreenOpen] = useState(false);

  useEffect(() => {
    if (openFullScreenOnMount) setFullScreenOpen(true);
  }, [openFullScreenOnMount]);

  const auth = { Authorization: `Bearer ${token}` };

  // Departments
  useEffect(() => {
    const run = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/departments`, { headers: auth });
        setDepartments(toArray(res.data?.departments || res.data));
      } catch {
        setError("Failed to load departments.");
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Recruiters (filter by department)
  useEffect(() => {
    const run = async () => {
      try {
        const url = selectedDepartment
          ? `${API_URL}/manager/recruiters?department_id=${selectedDepartment}`
          : `${API_URL}/manager/recruiters`;
        const res = await axios.get(url, { headers: auth });
        const list = (res.data.recruiters || []).map((r) => ({
          ...r,
          name: r.name || `${r.first_name || ""} ${r.last_name || ""}`.trim(),
        }));
        setRecruiters(list);
      } catch {
        setError("Failed to load employees.");
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedDepartment]);

  // Shifts (manager-assigned)
  useEffect(() => {
    if (!recruiters.length) return;
    const run = async () => {
      try {
        const ids = (selectedRecruiters.length ? selectedRecruiters : recruiters.map((r) => r.id)).join(",");
        const url = `${API_URL}/automation/shifts/range?start_date=${dateRange.start}&end_date=${dateRange.end}&recruiter_ids=${ids}`;
        const res = await axios.get(url, { headers: auth });
        setShifts(res.data.shifts || []);
      } catch {
        setError("Failed to load shifts.");
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, recruiters, selectedRecruiters, dateRange]);

  // Compute unique statuses for filter
  const uniqueStatuses = Array.from(new Set((shifts || []).map((s) => (s.status || "").toString()))).filter(Boolean);

  // Events (all views)
  const baseEvents = (shifts || [])
    .filter((s) => (statusFilter.length ? statusFilter.includes(s.status) : true))
    .map((s) => ({
      id: String(s.id),
      title: recruiters.find((r) => r.id === s.recruiter_id)?.name || `Emp ${s.recruiter_id}`,
      start: s.clock_in,
      end: s.clock_out,
      backgroundColor: getColorForRecruiter(s.recruiter_id),
      borderColor: getColorForRecruiter(s.recruiter_id),
      textColor: "#000",
    }));

  // Chips for selected day
  const dayChips = (shifts || [])
    .filter((s) => (statusFilter.length ? statusFilter.includes(s.status) : true))
    .filter((s) => s.date === selectedDate || (s.clock_in || "").slice(0, 10) === selectedDate)
    .map((s) => {
      const start = new Date(s.clock_in);
      const end = new Date(s.clock_out);
      const startLabel = format(start, "HH:mm");
      const endLabel = format(end, "HH:mm");
      const name = recruiters.find((r) => r.id === s.recruiter_id)?.name || s.recruiter_id;
      return {
        key: `${s.id}-${s.clock_in}`,
        label: `${startLabel}–${endLabel} • ${name} (${s.status})`,
        color: getColorForRecruiter(s.recruiter_id),
      };
    })
    .sort((a, b) => (a.label < b.label ? -1 : 1));

  // Calendar common props
  const calProps = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    height: "auto",
    dayMaxEvents: 3,
    events: baseEvents,
    weekends: showWeekends,
    nowIndicator: true,
    expandRows: true,
    slotDuration: "00:15:00",
    slotMinTime: workHoursOnly ? "08:00:00" : "00:00:00",
    slotMaxTime: workHoursOnly ? "20:00:00" : "24:00:00",
    eventTimeFormat: { hour: "2-digit", minute: "2-digit", meridiem: false },
    dateClick: (arg) => setSelectedDate(arg.dateStr),
    eventClick: (info) => {
      if (info.event.start) setSelectedDate(format(info.event.start, "yyyy-MM-dd"));
    },
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay",
    },
    initialView: "dayGridMonth",
  };

  return (
    <Box>
      {/* Filters / Controls */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Department</InputLabel>
            <Select
              value={selectedDepartment}
              label="Department"
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              {toArray(departments).map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Select Employees</InputLabel>
            <Select
              multiple
              value={selectedRecruiters}
              onChange={(e) => setSelectedRecruiters(e.target.value)}
              input={<OutlinedInput label="Select Employees" />}
              renderValue={(ids) =>
                (ids.length ? ids : recruiters.map((r) => r.id))
                  .map((id) => recruiters.find((r) => r.id === id)?.name || id)
                  .join(", ")
              }
            >
              {recruiters.map((r) => {
                const selectedIds = selectedRecruiters.length ? selectedRecruiters : recruiters.map((x) => x.id);
                return (
                  <MenuItem key={r.id} value={r.id}>
                    <Checkbox checked={selectedIds.includes(r.id)} />
                    <ListItemText primary={r.name} />
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Grid>

        {/* NEW — Status filter */}
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Shift Status</InputLabel>
            <Select
              multiple
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              input={<OutlinedInput label="Shift Status" />}
              renderValue={(vals) => (vals.length ? vals.join(", ") : "All")}
            >
              {uniqueStatuses.length === 0 ? (
                <MenuItem disabled>No statuses</MenuItem>
              ) : (
                uniqueStatuses.map((s) => (
                  <MenuItem key={s} value={s}>
                    <Checkbox checked={statusFilter.includes(s)} />
                    <ListItemText primary={s} />
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={2}>
          <TextField
            type="month"
            label="Month"
            value={selectedMonth}
            onChange={(e) => {
              const month = e.target.value;
              setSelectedMonth(month);
              const first = `${month}-01`;
              const last = format(endOfMonth(new Date(first)), "yyyy-MM-dd");
              setDateRange({ start: first, end: last });
              setSelectedDate(first);
            }}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Grid>

        {/* NEW — View & options row */}
        <Grid item xs={12}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <ToggleButtonGroup
              size="small"
              value={calendarView}
              exclusive
              onChange={(_, v) => v && setCalendarView(v)}
            >
              <ToggleButton value="dayGridMonth">Month</ToggleButton>
              <ToggleButton value="timeGridWeek">Week</ToggleButton>
              <ToggleButton value="timeGridDay">Day</ToggleButton>
            </ToggleButtonGroup>

            <ToggleButtonGroup
              size="small"
              value={showWeekends ? ["weekends"] : []}
              onChange={() => setShowWeekends((s) => !s)}
            >
              <ToggleButton value="weekends">{showWeekends ? "Hide" : "Show"} Weekends</ToggleButton>
            </ToggleButtonGroup>

            <ToggleButtonGroup
              size="small"
              value={workHoursOnly ? ["hours"] : []}
              onChange={() => setWorkHoursOnly((s) => !s)}
            >
              <ToggleButton value="hours">{workHoursOnly ? "All Hours" : "Work Hours"}</ToggleButton>
            </ToggleButtonGroup>

            <ToggleButtonGroup
              size="small"
              value={compactDensity ? ["compact"] : []}
              onChange={() => setCompactDensity((s) => !s)}
            >
              <ToggleButton value="compact">{compactDensity ? "Comfortable" : "Compact"}</ToggleButton>
            </ToggleButtonGroup>

            <Button
              variant="outlined"
              onClick={() => setDateRange((dr) => ({ ...dr }))}
              sx={{ ml: "auto" }}
            >
              Refresh
            </Button>

            {/* NEW — Full screen launcher */}
            <Button
              startIcon={<OpenInFull />}
              variant="contained"
              onClick={() => setFullScreenOpen(true)}
            >
              Open Full Screen
            </Button>
          </Stack>
        </Grid>
      </Grid>

      {/* Calendar (Month/Week/Day) */}
      <Paper sx={{ p: compactDensity ? 1 : 2, mb: 2 }} elevation={1}>
        <FullCalendar {...calProps} initialView={calendarView} key={calendarView} />
      </Paper>

      {/* Legend */}
      <Stack direction="row" spacing={1} sx={{ mb: 1 }} useFlexGap flexWrap="wrap">
        {recruiters
          .filter((r) => selectedRecruiters.length === 0 || selectedRecruiters.includes(r.id))
          .map((r) => (
            <Chip
              key={r.id}
              label={r.name}
              sx={{
                bgcolor: getColorForRecruiter(r.id),
                border: "1px solid rgba(0,0,0,0.2)",
              }}
            />
          ))}
      </Stack>

      {/* Day rail chips */}
      <Paper sx={{ p: 2 }} elevation={1}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            {format(new Date(selectedDate), "EEE, MMM d")} — {dayChips.length} shift(s)
          </Typography>
          <Tooltip title="Each chip uses the employee color">
            <Chip size="small" label="Legend: color by employee" />
          </Tooltip>
          <Button size="small" onClick={() => setDateRange((dr) => ({ ...dr }))} sx={{ ml: "auto" }}>
            Refresh
          </Button>
        </Stack>

        {dayChips.length === 0 ? (
          <Typography color="text.secondary">No shifts for this day.</Typography>
        ) : (
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {dayChips.map((c) => (
              <Chip
                key={c.key}
                label={c.label}
                sx={{
                  bgcolor: c.color,
                  border: "1px solid rgba(0,0,0,0.2)",
                  color: "#000",
                }}
              />
            ))}
          </Stack>
        )}
      </Paper>

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}

      {/* NEW — Full Screen Dialog */}
      <Dialog
        fullScreen
        open={fullScreenOpen}
        onClose={() => {
          setFullScreenOpen(false);
          onCloseFullScreen && onCloseFullScreen();
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <IconButton
            onClick={() => {
              setFullScreenOpen(false);
              onCloseFullScreen && onCloseFullScreen();
            }}
          >
            <CloseFullscreen />
          </IconButton>
          <Typography variant="h6" sx={{ flex: 1 }}>
            Shifts Calendar — Full Screen
          </Typography>

          {/* Controls mirrored in full screen */}
          <ToggleButtonGroup
            size="small"
            value={calendarView}
            exclusive
            onChange={(_, v) => v && setCalendarView(v)}
            sx={{ mr: 1 }}
          >
            <ToggleButton value="dayGridMonth">Month</ToggleButton>
            <ToggleButton value="timeGridWeek">Week</ToggleButton>
            <ToggleButton value="timeGridDay">Day</ToggleButton>
          </ToggleButtonGroup>

          <Button variant="outlined" onClick={() => setDateRange((dr) => ({ ...dr }))}>
            Refresh
          </Button>
        </Toolbar>

        <Box sx={{ p: isSmall ? 1 : 2 }}>
          <Paper sx={{ p: isSmall ? 0 : 1 }}>
            <FullCalendar
              {...calProps}
              initialView={calendarView}
              key={`fs-${calendarView}-${showWeekends}-${workHoursOnly}-${compactDensity}-${statusFilter.join(",")}`}
              height="calc(100vh - 96px)"
            />
          </Paper>
        </Box>

        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button
            startIcon={<CloseFullscreen />}
            variant="contained"
            onClick={() => {
              setFullScreenOpen(false);
              onCloseFullScreen && onCloseFullScreen();
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const NewManagementDashboard = ({ token, initialView, sectionOnly = false }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const menuItems = useMemo(
    () =>
      menuConfig.map((item) => {
        const mappedItem = {
          ...item,
          label: t(item.labelKey),
        };

        if (item.children) {
          mappedItem.children = item.children.map((child) => ({
            ...child,
            label: t(child.labelKey),
          }));
        }

        return mappedItem;
      }),
    [t, i18n.language]
  );
  // Sidebar state
  const [selectedView, setSelectedView] = useState(() => {
    return initialView || localStorage.getItem("manager_selected_view") || "__landing__";
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [overviewOpen, setOverviewOpen] = useState(false); // legacy for overview; kept for compatibility
  const [openGroups, setOpenGroups] = useState({});
  const [swapRequests, setSwapRequests] = useState([]);
  const [swapError, setSwapError] = useState("");
  const [currentTimezone, setCurrentTimezone] = useState(getUserTimezone());
  const [activityLanding, setActivityLanding] = useState({ recent_bookings: [] });
  const [activityErr, setActivityErr] = useState("");

  // Employee Management states
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [newEmployee, setNewEmployee] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    timezone: getUserTimezone(),
    role: "recruiter",
    department_id: "",
    address_street: "",
    address_city: "",
    address_state: "",
    address_zip: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmArchiveId, setConfirmArchiveId] = useState(null);
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [statsError, setStatsError] = useState("");
  const [timeRange, setTimeRange] = useState("14");

  const API_URL_LOCAL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const timezones = [
    "America/Toronto",
    "America/New_York",
    "America/Chicago",
    "Europe/London",
    "Asia/Tokyo",
    "Asia/Kolkata",
    "Australia/Sydney",
  ];

  useEffect(() => {
    localStorage.setItem("manager_selected_view", selectedView);
  }, [selectedView]);

  useEffect(() => {
    if (initialView && initialView !== selectedView) {
      setSelectedView(initialView);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialView]);

  // Landing activity feed
  useEffect(() => {
    const run = async () => {
      try {
        const res = await axios.get(`${API_URL_LOCAL}/manager/activity-feed`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setActivityLanding(res.data || { recent_bookings: [] });
      } catch (e) {
        setActivityErr("Failed to load activity feed.");
      }
    };
    if (token && (selectedView === "__landing__" || selectedView === "overview" || selectedView === "recent-bookings")) run();
  }, [API_URL_LOCAL, token, selectedView]);

  // Employee management data loading
  useEffect(() => {
    if (token) fetchDepartments();
  }, [token]);

  useEffect(() => {
    if (token && selectedView === "employee-management") fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, departmentFilter, selectedView]);

  // API calls - Employee Management
  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_URL_LOCAL}/manager/recruiters`, {
        headers: { Authorization: `Bearer ${token}` },
        params: departmentFilter ? { department_id: departmentFilter } : {},
      });
      setEmployees(res.data.recruiters || []);
    } catch {
      setError("Failed to fetch employees.");
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${API_URL_LOCAL}/api/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDepartments(res.data || []);
    } catch {
      setError("Failed to fetch departments.");
    }
  };

  const handleAddEmployee = async () => {
    const { first_name, last_name, email, password, timezone, role, department_id } = newEmployee;

    if (!first_name || !last_name || !email || !timezone || !role) {
      return setError("First name, last name, email, timezone, and role are required.");
    }

    try {
      const res = await axios.post(`${API_URL_LOCAL}/manager/recruiters`, newEmployee, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage(res.data.message);
      setNewEmployee({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        timezone: "America/New_York",
        role: "recruiter",
        department_id: "",
        address_street: "",
        address_city: "",
        address_state: "",
        address_zip: "",
      });

      fetchEmployees();
    } catch (err) {
      setError(err.response?.data?.error || "Error adding employee.");
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      await axios.patch(
        `${API_URL_LOCAL}/manager/recruiters/${id}`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchEmployees();
    } catch {
      setError("Failed to update role.");
    }
  };

  const handleResetPassword = async (id) => {
    try {
      await axios.post(`${API_URL_LOCAL}/manager/recruiters/${id}/reset-password`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("Temporary password sent.");
    } catch {
      setError("Failed to reset password.");
    }
  };

  const handleArchive = async () => {
    try {
      await axios.patch(`${API_URL_LOCAL}/manager/recruiters/${confirmArchiveId}/archive`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("Employee archived.");
      setConfirmArchiveId(null);
      fetchEmployees();
    } catch {
      setError("Archive failed.");
    }
  };

  const handleRestore = async (id) => {
    try {
      await axios.patch(`${API_URL_LOCAL}/manager/recruiters/${id}`, { status: "active" }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("Employee restored.");
      fetchEmployees();
    } catch {
      setError("Restore failed.");
    }
  };

  const handleCompare = async () => {
    try {
      const res = await axios.get(`${API_URL_LOCAL}/manager/recruiters/compare`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { ids: selectedForComparison, timeRange },
      });
      setComparisonData(res.data);
      setStatsError("");
    } catch {
      setStatsError("Failed to load employee stats.");
    }
  };

  const filteredEmployees =
    departmentFilter ? employees.filter((e) => String(e.department_id) === String(departmentFilter)) : employees;

  const headerStyle = {
    color: theme.palette.text.primary,
    fontFamily: "Poppins, sans-serif",
    fontWeight: 600,
  };

  const fetchSwapRequests = async () => {
    try {
      const res = await axios.get(`${API_URL_LOCAL}/shift-swap-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const peerAccepted = res.data.filter((r) => r.status === "peer_accepted");
      setSwapRequests(peerAccepted);
      setSwapError("");
    } catch {
      setSwapError("Failed to fetch swap requests.");
    }
  };

  const handleManagerDecision = async (swapId, approve) => {
    try {
      await axios.put(
        `${API_URL_LOCAL}/shift-swap-requests/${swapId}/manager-decision`,
        { approve },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchSwapRequests();
    } catch {
      setSwapError("Failed to update swap status.");
    }
  };

  // Renders content for selected menu item
  const renderView = () => {
    switch (selectedView) {
      case "__landing__":
        return (
          <ManagementFrame title="Employee Management" subtitle="Manage active employees, add new team members, and compare performance.">
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Employee Management</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <NewManagementDashboard token={token} initialView="employee-management" sectionOnly />
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>{t("manager.menu.websitePages")}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <WebsiteSuite />
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Team Activity Overview</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TeamActivity token={token} />
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Master Calendar</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <EnhancedMasterCalendar token={token} />
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Candidate Funnel</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <CandidateFunnel token={token} />
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Recruiter Performance</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <PerformanceMetrics token={token} />
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Candidate Search</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <CandidateSearch token={token} />
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Feedback & Notes</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FeedbackNotes token={token} />
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Recruiter Availability</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <RecruiterAvailabilityTracker token={token} />
              </AccordionDetails>
            </Accordion>

            {Array.isArray(activityLanding.recent_bookings) && activityLanding.recent_bookings.length > 0 && (
              <Paper sx={{ p: 3, mt: 3, borderLeft: (theme) => `5px solid ${theme.palette.primary.main}` }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Recent Bookings</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Candidate</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Position</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Start</TableCell>
                      <TableCell>End</TableCell>
                      <TableCell>Recruiter</TableCell>
                      <TableCell>Meeting</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activityLanding.recent_bookings.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>{b.candidate_name}</TableCell>
                        <TableCell>{b.candidate_email}</TableCell>
                        <TableCell>{b.candidate_position}</TableCell>
                        <TableCell>{b.date}</TableCell>
                        <TableCell>{b.start_time}</TableCell>
                        <TableCell>{b.end_time}</TableCell>
                        <TableCell>{b.recruiter}</TableCell>
                        <TableCell>
                          <a href={b.meeting_link} target="_blank" rel="noopener noreferrer">Join</a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            )}
            {activityErr && <Typography color="error" sx={{ mt: 2 }}>{activityErr}</Typography>}
          </ManagementFrame>
        );
      case "employee-management":
        return (
          <ManagementFrame title="Employee Management" subtitle="Manage active employees, add new team members, and compare performance.">

            {error && (
              <Typography color="error" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}
            {message && (
              <Typography color="primary" sx={{ mb: 2 }}>
                {message}
              </Typography>
            )}

            {/* Active Employees */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={headerStyle}>
                  Active Employees
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {/* Department filter */}
                <FormControl size="small" sx={{ mb: 2, minWidth: 200 }}>
                  <InputLabel>Department</InputLabel>
                  <Select
                    label="Department"
                    value={departmentFilter}
                    onChange={(e) => {
                      setDepartmentFilter(e.target.value);
                      setSelectedForComparison([]);
                    }}
                  >
                    <MenuItem value="">All Departments</MenuItem>
                    {getDepartmentArray(departments).map((d) => (
                      <MenuItem key={d.id} value={d.id}>
                        {d.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Grid container spacing={2}>
                  {filteredEmployees
                    .filter((e) => e.status !== "inactive")
                    .map((e) => (
                      <Grid item xs={12} sm={6} key={e.id}>
                        <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                          <Typography fontWeight={600}>
                            {e.first_name} {e.last_name}
                          </Typography>

                          <Typography variant="body2">
                            {e.email} | {e.timezone}
                          </Typography>

                          <TextField
                            select
                            size="small"
                            label="Role"
                            value={e.role}
                            onChange={(ev) => handleRoleChange(e.id, ev.target.value)}
                            sx={{ mt: 1, width: "60%" }}
                          >
                            <MenuItem value="recruiter">Employee</MenuItem>
                            <MenuItem value="manager">Manager</MenuItem>
                          </TextField>

                          <Stack direction="row" spacing={1} mt={2}>
                            <Button size="small" variant="outlined" onClick={() => handleResetPassword(e.id)} startIcon={<RestartAltIcon />}>
                              Reset Password
                            </Button>
                            <Button
                              size="small"
                              color="warning"
                              variant="outlined"
                              startIcon={<ArchiveIcon />}
                              onClick={() => setConfirmArchiveId(e.id)}
                            >
                              Archive
                            </Button>
                            <Button size="small" variant="outlined" onClick={() => navigate(`/recruiter-stats/${e.id}`)}>
                              View Stats
                            </Button>
                          </Stack>
                        </Paper>
                      </Grid>
                    ))}
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Add New Employee */}
            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={headerStyle}>
                  Add New Employee
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <TextField
                    label="First Name"
                    value={newEmployee.first_name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, first_name: e.target.value })}
                    fullWidth
                    required
                  />
                  <TextField
                    label="Last Name"
                    value={newEmployee.last_name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, last_name: e.target.value })}
                    fullWidth
                    required
                  />
                  <TextField
                    label="Email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                    fullWidth
                    required
                  />
                  <TextField
                    label="Password"
                    type="password"
                    value={newEmployee.password}
                    onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                    fullWidth
                    required
                  />

                  <TextField
                    select
                    label="Department"
                    value={newEmployee.department_id || ""}
                    onChange={(e) => setNewEmployee({ ...newEmployee, department_id: e.target.value })}
                    fullWidth
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {getDepartmentArray(departments).map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    label="Street Address"
                    value={newEmployee.address_street}
                    onChange={(e) => setNewEmployee({ ...newEmployee, address_street: e.target.value })}
                    fullWidth
                  />
                  <TextField
                    label="City"
                    value={newEmployee.address_city}
                    onChange={(e) => setNewEmployee({ ...newEmployee, address_city: e.target.value })}
                    fullWidth
                  />
                  <TextField
                    label="State / Province"
                    value={newEmployee.address_state}
                    onChange={(e) => setNewEmployee({ ...newEmployee, address_state: e.target.value })}
                    fullWidth
                  />
                  <TextField
                    label="Postal / ZIP Code"
                    value={newEmployee.address_zip}
                    onChange={(e) => setNewEmployee({ ...newEmployee, address_zip: e.target.value })}
                    fullWidth
                    helperText="🇨🇦 Canada: A1A 1A1 | 🇺🇸 USA: 12345-6789"
                  />

                  <TextField
                    select
                    label="Timezone"
                    value={newEmployee.timezone}
                    onChange={(e) => setNewEmployee({ ...newEmployee, timezone: e.target.value })}
                    fullWidth
                  >
                    {timezones.map((tz) => (
                      <MenuItem key={tz} value={tz}>
                        {tz}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    select
                    label="Role"
                    value={newEmployee.role}
                    onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                    fullWidth
                  >
                    <MenuItem value="recruiter">Employee</MenuItem>
                    <MenuItem value="manager">Manager</MenuItem>
                  </TextField>

                  <Button variant="contained" onClick={handleAddEmployee}>
                    Add Employee
                  </Button>
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Employee Comparison Panel */}
            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={headerStyle}>
                  Compare Employees
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormControl fullWidth>
                  <InputLabel>Select Employees</InputLabel>
                  <Select multiple value={selectedForComparison} onChange={(e) => setSelectedForComparison(e.target.value)} label="Select Employees">
                    {(filteredEmployees || []).map((e) => (
                      <MenuItem key={e.id} value={e.id}>
                        {e.first_name} {e.last_name} ({e.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Stack direction="row" spacing={2} alignItems="center" mt={2}>
                  <TextField
                    select
                    label="Time Range (days)"
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    size="small"
                    sx={{ width: 200 }}
                  >
                    <MenuItem value="7">Last 7 Days</MenuItem>
                    <MenuItem value="14">Last 14 Days</MenuItem>
                    <MenuItem value="30">Last 30 Days</MenuItem>
                    <MenuItem value="all">All Time</MenuItem>
                  </TextField>

                  <Button onClick={handleCompare} variant="contained">
                    Compare
                  </Button>

                  {comparisonData.length > 0 && (
                    <Button onClick={exportToPDF} variant="outlined" color="secondary">
                      Export PDF
                    </Button>
                  )}
                </Stack>

                {statsError && (
                  <Typography color="error" mt={2}>
                    {statsError}
                  </Typography>
                )}

                {comparisonData.length > 0 && <RecruiterComparisonPanel data={comparisonData} />}
              </AccordionDetails>
            </Accordion>

            {/* Confirm Archive Dialog */}
            <Dialog open={!!confirmArchiveId} onClose={() => setConfirmArchiveId(null)}>
              <DialogTitle>Are you sure you want to archive this employee?</DialogTitle>
              <DialogActions>
                <Button onClick={() => setConfirmArchiveId(null)}>Cancel</Button>
                <Button onClick={handleArchive} color="warning">
                  Archive
                </Button>
              </DialogActions>
            </Dialog>
          </ManagementFrame>
        );

      case "advanced-management":
        return <SecondNewManagementDashboard token={token} />;

      // Other dashboard sections render here
      case "overview":
        return (
          <ManagementFrame title="Employee Management" subtitle="Manage active employees, add new team members, and compare performance.">
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              Dashboard Overview
            </Typography>
            <Overview token={token} />

            <Typography variant="h6" sx={{ mt: 3, mb: 1.5, fontWeight: 700 }}>
              Quick Links
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
              <Button variant="contained" onClick={() => setSelectedView("website-pages")}>{t("manager.menu.websitePages")}</Button>
              <Button variant="outlined" onClick={() => setSelectedView("team-activity")}>Team Activity</Button>
              <Button variant="outlined" onClick={() => setSelectedView("master-calendar")}>Master Calendar</Button>
              <Button variant="outlined" onClick={() => setSelectedView("candidate-funnel")}>Candidate Funnel</Button>
              <Button variant="outlined" onClick={() => setSelectedView("recruiter-performance")}>Recruiter Performance</Button>
              <Button variant="outlined" onClick={() => setSelectedView("candidate-search")}>Candidate Search</Button>
              <Button variant="outlined" onClick={() => setSelectedView("feedback-notes")}>Feedback & Notes</Button>
              <Button variant="outlined" onClick={() => setSelectedView("recruiter-availability")}>Recruiter Availability</Button>
              <Button variant="outlined" onClick={() => setSelectedView("recent-bookings")}>Recent Bookings</Button>
            </Stack>

            {/* Inline sections 2..10 */}
            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>{t("manager.menu.websitePages")}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <WebsiteSuite />
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Team Activity Overview</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TeamActivity token={token} />
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Master Calendar</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <EnhancedMasterCalendar token={token} />
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Candidate Funnel</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <CandidateFunnel token={token} />
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Recruiter Performance</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <PerformanceMetrics token={token} />
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Candidate Search</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <CandidateSearch token={token} />
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Feedback & Notes</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FeedbackNotes token={token} />
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Recruiter Availability</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <RecruiterAvailabilityTracker token={token} />
              </AccordionDetails>
            </Accordion>

            {Array.isArray(activityLanding.recent_bookings) && activityLanding.recent_bookings.length > 0 && (
              <Paper sx={{ p: 3, mt: 3, borderLeft: (theme) => `5px solid ${theme.palette.primary.main}` }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Recent Bookings</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Candidate</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Position</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Start</TableCell>
                      <TableCell>End</TableCell>
                      <TableCell>Recruiter</TableCell>
                      <TableCell>Meeting</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activityLanding.recent_bookings.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>{b.candidate_name}</TableCell>
                        <TableCell>{b.candidate_email}</TableCell>
                        <TableCell>{b.candidate_position}</TableCell>
                        <TableCell>{b.date}</TableCell>
                        <TableCell>{b.start_time}</TableCell>
                        <TableCell>{b.end_time}</TableCell>
                        <TableCell>{b.recruiter}</TableCell>
                        <TableCell>
                          <a href={b.meeting_link} target="_blank" rel="noopener noreferrer">Join</a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            )}
            {activityErr && <Typography color="error" sx={{ mt: 2 }}>{activityErr}</Typography>}
          </ManagementFrame>
        );

      case "available-shifts":
        return (
          <ManagementFrame title="Shifts & Availability" subtitle="View assigned shifts and manage availability.">
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              Available Shifts (Assigned)
            </Typography>
            <AvailableShiftsPanel token={token} />
          </ManagementFrame>
        );

      // NEW — selecting this tab auto-opens full-screen popup
      case "available-shifts-fullscreen":
        return (
          <ManagementFrame
            title="Available Shifts (Full Screen)"
            subtitle="View assigned shifts in a full-screen calendar."
          >
            <AvailableShiftsPanel
              token={token}
              openFullScreenOnMount
              onCloseFullScreen={() => setSelectedView("available-shifts")}
            />
          </ManagementFrame>
        );

      case "available-slots":
        return (
          <ManagementFrame
            title="Available Slots (Bookable)"
            subtitle="View and manage bookable availability across your team."
          >
            <AllEmployeeSlotsCalendar token={token} timezone={currentTimezone} />
          </ManagementFrame>
        );

      case "team":
        return (
          <ManagementFrame
            title="Shift Management"
            subtitle="Create, assign, and manage employee shifts."
          >
            <Team token={token} />
          </ManagementFrame>
        );

      case "team-activity":
        return (
          <ManagementFrame title="Team Activity" subtitle="Live activity and recent events across your team.">
            <TeamActivity token={token} />
          </ManagementFrame>
        );

      case "master-calendar":
        return (
          <ManagementFrame title="Master Calendar" subtitle="Manage events and schedules across your organization.">
            <EnhancedMasterCalendar token={token} />
          </ManagementFrame>
        );

      case "candidate-funnel":
        return (
          <ManagementFrame title="Candidate Funnel" subtitle="Track candidates through pipeline stages.">
            <CandidateFunnel token={token} />
          </ManagementFrame>
        );

      case "recruiter-performance":
        return (
          <ManagementFrame title="Recruiter Performance" subtitle="KPIs and metrics per recruiter.">
            <PerformanceMetrics token={token} />
          </ManagementFrame>
        );

      case "candidate-search":
        return (
          <ManagementFrame title="Candidate Search" subtitle="Find and filter candidates quickly.">
            <CandidateSearch token={token} />
          </ManagementFrame>
        );

      case "feedback-notes":
        return (
          <ManagementFrame title="Feedback & Notes" subtitle="Log feedback and maintain notes.">
            <FeedbackNotes token={token} />
          </ManagementFrame>
        );

      case "recruiter-availability":
        return (
          <ManagementFrame title="Recruiter Availability" subtitle="Review and adjust individual availability.">
            <RecruiterAvailabilityTracker token={token} />
          </ManagementFrame>
        );

      case "recent-bookings":
        return (
          <ManagementFrame title="Employee Management" subtitle="Manage active employees, add new team members, and compare performance.">
            <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>Recent Bookings</Typography>
            {Array.isArray(activityLanding.recent_bookings) && activityLanding.recent_bookings.length > 0 ? (
              <Paper sx={{ p: 3, mt: 1, borderLeft: (theme) => `5px solid ${theme.palette.primary.main}` }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Candidate</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Position</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Start</TableCell>
                      <TableCell>End</TableCell>
                      <TableCell>Recruiter</TableCell>
                      <TableCell>Meeting</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activityLanding.recent_bookings.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>{b.candidate_name}</TableCell>
                        <TableCell>{b.candidate_email}</TableCell>
                        <TableCell>{b.candidate_position}</TableCell>
                        <TableCell>{b.date}</TableCell>
                        <TableCell>{b.start_time}</TableCell>
                        <TableCell>{b.end_time}</TableCell>
                        <TableCell>{b.recruiter}</TableCell>
                        <TableCell>
                          <a href={b.meeting_link} target="_blank" rel="noopener noreferrer">Join</a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            ) : (
              <Typography>No recent bookings to show.</Typography>
            )}
          </ManagementFrame>
        );

      case "meetings":
        return <Meetings token={token} />;

      case "leaves":
        return <LeaveRequests token={token} />;

      case "swap-approvals":
        return <ShiftSwapPanel token={token} headerStyle={headerStyle} />;

      case "employee-profiles":
        return <EmployeeProfileForm token={token} />;

      case "website-pages":
        return <WebsiteSuite />;

      case "saved-payrolls":
        return <SavedPayrollsPortal token={token} currentUser={{ role: "manager" }} />;

      case "roe":
        return <ROE token={token} />;

      case "T4":
        return <T4 token={token} />;

      case "W2":
        return <W2 token={token} />;

      case "CompanyProfile":
        return <CompanyProfile token={token} />;

      case "payroll":
        return <Payroll token={token} />;

      case "Tax":
        return <></>;

      case "audit":
        return <AuditHistory token={token} />;

      case "attendance":
        return <MonthlyAttendanceCalendar token={token} />;

      case "settings":
        return <SettingsPage token={token} />;

      default:
        return <Overview token={token} />;
    }
  };

  if (sectionOnly) {
    return (
      <Box sx={{ width: '100%' }}>
        {renderView()}
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", width: '100%' }}>
      <CssBaseline />

      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: isDrawerOpen ? drawerWidth : collapsedWidth,
          flexShrink: 0,
          whiteSpace: "nowrap",
          transition: "width 0.3s",
          mt: `${APP_BAR_HEIGHT}px`,
          height: `calc(100vh - ${APP_BAR_HEIGHT}px)`,
          [`& .MuiDrawer-paper`]: {
            width: isDrawerOpen ? drawerWidth : collapsedWidth,
            overflowX: "hidden",
            transition: "width 0.3s",
            boxSizing: "border-box",
            zIndex: 1200,
            top: APP_BAR_HEIGHT,
            height: `calc(100vh - ${APP_BAR_HEIGHT}px)`,
          },
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: isDrawerOpen ? "space-between" : "center",
            px: 1.5,
            py: 1.5,
            minHeight: 64,
          }}
        >
          {isDrawerOpen ? (
            <Typography
              variant="h6"
              sx={{ fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}
            >
              Schedulaa
            </Typography>
          ) : (
            <Typography variant="h6" sx={{ fontWeight: 800 }}>S</Typography>
          )}
          <IconButton onClick={() => setIsDrawerOpen((prev) => !prev)} size="small">
            <MenuIcon />
          </IconButton>
        </Toolbar>
        <Divider />
        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", height: "100%", overflowY: "auto", pt: 0.75 }}>
          <List>
            {menuItems.map((item) => {
            const hasChildren = Array.isArray(item.children) && item.children.length > 0;
            if (!hasChildren) {
              return (
                <Tooltip key={item.key} title={!isDrawerOpen ? item.label : ""} placement="right" arrow>
                  <ListItemButton
                    selected={selectedView === item.key}
                    onClick={() => setSelectedView(item.key)}
                    sx={{
                      justifyContent: isDrawerOpen ? "flex-start" : "center",
                      px: 2,
                      '&:hover': { backgroundColor: (t) => t.palette.action.hover },
                    }}
                  >
                    <ListItemIcon sx={{
                      minWidth: 36,
                      mr: isDrawerOpen ? 2 : 0,
                      justifyContent: "center",
                      color: 'text.secondary',
                      '& .MuiSvgIcon-root': { fontSize: 20 },
                    }}>
                      {item.icon}
                    </ListItemIcon>
                    {isDrawerOpen && (
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{ noWrap: true }}
                        sx={{ overflow: 'hidden', pr: 1 }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              );
            }

            const isOpen = Boolean((openGroups[item.key] ?? false) || item.children.some((c) => c.key === selectedView));
            return (
              <Box key={item.key}>
                <Tooltip title={!isDrawerOpen ? item.label : ""} placement="right" arrow>
                  <ListItemButton
                    selected={selectedView === item.key || isOpen}
                    onClick={() => {
                      let defaultView = selectedView;
                      if (item.key === 'employee-group') defaultView = 'employee-management';
                      else if (item.key === 'payroll-group') defaultView = 'payroll';
                      else if (item.key === 'shifts-group') defaultView = 'available-shifts';
                      else if (item.key === 'overview') defaultView = 'overview';
                      setSelectedView(defaultView);
                      setOpenGroups({ ...openGroups, [item.key]: !isOpen });
                    }}
                    sx={{ justifyContent: "flex-start", px: 2, '&:hover': { backgroundColor: (t) => t.palette.action.hover } }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, mr: isDrawerOpen ? 2 : 0, justifyContent: "center", color: 'text.secondary', '& .MuiSvgIcon-root': { fontSize: 20 } }}>
                      {item.icon}
                    </ListItemIcon>
                    {isDrawerOpen && (
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{ noWrap: true }}
                        sx={{ overflow: 'hidden', pr: 1 }}
                      />
                    )}
                    {/* Always reserve space for chevron; align to right for clarity */}
                    {isDrawerOpen && (
                      <Box sx={{ ml: "auto", display: "flex", alignItems: "center", minWidth: 28, pl: 1 }}>
                        {isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </Box>
                    )}
                  </ListItemButton>
                </Tooltip>
                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children.map((child) => (
                      <ListItemButton
                        key={child.key}
                        selected={selectedView === child.key}
                        onClick={() => {
                          const empKeys = ['emp-active','emp-add','emp-compare'];
                          const next = empKeys.includes(child.key) ? 'employee-management' : child.key;
                          setSelectedView(next);
                        }}
                        sx={{ pl: isDrawerOpen ? 4 : 2, '&:hover': { backgroundColor: (t) => t.palette.action.hover } }}
                      >
                        <ListItemIcon sx={{ minWidth: 36, mr: isDrawerOpen ? 2 : 0, color: 'text.secondary', '& .MuiSvgIcon-root': { fontSize: 20 } }}>
                          {child.icon}
                        </ListItemIcon>
                        {isDrawerOpen && (
                          <ListItemText
                            primary={child.label}
                            primaryTypographyProps={{ noWrap: true }}
                            sx={{ overflow: 'hidden' }}
                          />
                        )}
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </Box>
            );
          })}
        </List>
      </Box>
    </Drawer>

      {/* Main Content - full width to the right of the sidebar */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          backgroundColor: (theme) => theme.palette.background.default,
          minWidth: 0,
          width: '100%',
          maxWidth: 'none',
        }}
      >
        <Toolbar />

        {renderView()}
      </Box>
    </Box>
  );
};

export default NewManagementDashboard;



