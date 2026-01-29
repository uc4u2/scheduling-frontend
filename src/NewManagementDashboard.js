// src/pages/NewManagementDashboard.js
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AppBar,
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Link,
  MenuItem,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  InputLabel,
  FormControl,
  FormLabel,
  InputAdornment,
  FormControlLabel,
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
  Snackbar,
  Alert,
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
  Api as ApiIcon,
  Business,
  Paid,
  Summarize,
  FolderShared,
  OpenInFull,
  CloseFullscreen,
  PersonAddAlt as PersonAddAltIcon,
  InfoOutlined,
  HelpOutline as HelpOutlineIcon,
} from "@mui/icons-material";
import RecruiterComparisonPanel from "./components/RecruiterComparisonPanel";
import GlobalBillingBanner from "./components/billing/GlobalBillingBanner";

import { useNavigate, useLocation } from "react-router-dom";
import api from "./utils/api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import AllEmployeeSlotsCalendar from "./pages/sections/AllEmployeeSlotsCalendar";
import SecondNewManagementDashboard from "./pages/sections/management/SecondNewManagementDashboard";
import ZapierIntegrationPage from "./pages/settings/ZapierIntegrationPage";
import ManagerPaymentsView from "./pages/sections/management/ManagerPaymentsView";

// Sections imports
import Overview from "./pages/sections/Overview";
import MasterCalendar from "./pages/sections/MasterCalendar";
import SecondMasterCalendar from "./pages/sections/SecondMasterCalendar";

import Team from "./pages/sections/Team";
import TimeEntriesPanel from "./pages/sections/TimeEntriesPanel";
import FraudAnomaliesPanel from "./pages/sections/FraudAnomaliesPanel";
import LeaveRequests from "./pages/sections/LeaveRequests";
import Meetings from "./pages/sections/Meetings";
import ROE from "./pages/sections/ROE";
import T4 from "./pages/sections/T4";
import W2 from "./pages/sections/W2";
import PayrollRawPage from "./pages/sections/PayrollRawPage";
import PayrollAuditPage from "./pages/sections/PayrollAuditPage";
import SettingsPage from "./pages/sections/Settings";
import AuditHistory from "./components/AuditHistory";
import MonthlyAttendanceCalendar from "./components/MonthlyAttendanceCalendar";
import CompanyProfile from "./pages/sections/CompanyProfile";
import Payroll from "./pages/sections/Payroll";
import EmployeeProfileForm from "./pages/Payroll/EmployeeProfileForm";
import Tax from "./pages/sections/Tax";
import SavedPayrollsPortal from "./pages/sections/SavedPayrollsPortal";
import AddRecruiter from "./AddRecruiter";
import WebsiteSuite from "./pages/sections/management/WebsiteSuite";
import ManagementFrame from "./components/ui/ManagementFrame";
import ManagerInvoicesPage from "./pages/sections/ManagerInvoicesPage";
import { getUserTimezone } from "./utils/timezone";
import TeamActivity from "./TeamActivity";
import EnhancedMasterCalendar from "./EnhancedMasterCalendar";
import CandidateFunnel from "./CandidateFunnel";
import PerformanceMetrics from "./PerformanceMetrics";
import CandidateSearch from "./CandidateSearch";
import FeedbackNotes from "./FeedbackNotes";
import RecruiterAvailabilityTracker from "./RecruiterAvailabilityTracker";
import ClientProfileSettings from "./pages/client/ClientProfileSettings";
import ManagerJobOpeningsPage from "./pages/manager/ManagerJobOpeningsPage";
import EmployeeManagementHelpDrawer from "./pages/sections/management/components/EmployeeManagementHelpDrawer";

// NEW — FullCalendar for the Setmore-style panel
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import { format, endOfMonth } from "date-fns";

// NEW — Toggle group for views/options
import { ToggleButtonGroup, ToggleButton } from "@mui/material";

const drawerWidth = 280;
const collapsedWidth = 64;
const APP_BAR_HEIGHT = 64;


const overviewChildrenConfig = [
  { labelKey: "manager.menu.teamActivityOverview", key: "team-activity", icon: <Dashboard /> },
  { labelKey: "manager.menu.masterCalendar", key: "master-calendar", icon: <CalendarToday /> },
  { labelKey: "manager.menu.candidateFunnel", key: "candidate-funnel", icon: <Assignment /> },
  { label: "Job Postings", key: "job-openings", icon: <Assignment /> },
  { labelKey: "manager.menu.recruiterPerformance", key: "recruiter-performance", icon: <History /> },
  { labelKey: "manager.menu.candidateSearch", key: "candidate-search", icon: <People /> },
  { labelKey: "manager.menu.feedbackNotes", key: "feedback-notes", icon: <Article /> },
  { labelKey: "manager.menu.recruiterAvailability", key: "recruiter-availability", icon: <CalendarToday /> },
  { labelKey: "manager.menu.recentBookings", key: "recent-bookings", icon: <History /> },
  { label: "Payroll Audit History", key: "audit", icon: <History /> },
  { label: "Monthly Attendance Calendar", key: "attendance", icon: <CalendarToday /> },
  { label: "Candidate Profile", key: "candidate-profile", icon: <PersonAddAltIcon /> },
];


const menuConfig = [
  // Employee group (first)
  {
    labelKey: "manager.menu.employeeManagement",
    key: "employee-group",
    icon: <People />,
    children: [
      { labelKey: "manager.menu.companyProfile", key: "CompanyProfile", icon: <Business /> },
      { labelKey: "manager.menu.employeeProfiles", key: "employee-profiles", icon: <FolderShared /> },
      { label: "Add team member", key: "add-member", icon: <PersonAddAltIcon /> },
    ],
  },

  // Shifts & Availability (second)
  {
    labelKey: "manager.menu.shiftsAvailability",
    key: "shifts-group",
    icon: <CalendarToday />,
    children: [
      { labelKey: "manager.menu.shiftManagement", key: "team", icon: <People /> },
      { label: "Shift Monitoring", key: "shift-monitoring", icon: <History /> },
      { labelKey: "manager.menu.timeTracking", key: "time-tracking", icon: <History /> },
      { label: "Fraud / Anomalies", key: "time-tracking-fraud", icon: <History /> },
      { labelKey: "manager.menu.leaves", key: "leaves", icon: <Assignment /> },
      { labelKey: "manager.menu.swapApprovals", key: "swap-approvals", icon: <Assignment /> },
    ],
  },

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
      { labelKey: "manager.menu.payrollRaw", key: "payroll-raw", icon: <ReceiptLong /> },
      { label: "Payroll Audit", key: "payroll-audit", icon: <History /> },
      { label: "Invoices", key: "invoices", icon: <ReceiptLong /> },
    ],
  },

  // Overview cluster near bottom
  {
    labelKey: "manager.menu.overview",
    key: "overview",
    icon: <Dashboard />,
    children: overviewChildrenConfig,
  },

  // Website & pages
  { labelKey: "manager.menu.websitePages", key: "website-pages", icon: <Article /> },

  // Services & Bookings
  { label: "Services & Bookings", key: "advanced-management", icon: <Dashboard /> },

  // Booking checkout (calendar + payments)
  { label: "Booking Checkout", key: "booking-checkout", icon: <CalendarToday /> },
];

const hrMenuConfig = [
  {
    labelKey: "manager.menu.employeeManagement",
    key: "employee-group",
    icon: <People />,
    children: [
      { labelKey: "manager.menu.employeeProfiles", key: "employee-profiles", icon: <FolderShared /> },
    ],
  },
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

  // Departments
  useEffect(() => {
    const run = async () => {
      try {
        const res = await api.get("/api/departments");
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
        const res = await api.get("/manager/recruiters", {
          params: selectedDepartment ? { department_id: selectedDepartment } : {},
        });
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
        const res = await api.get("/automation/shifts/range", {
          params: {
            start_date: dateRange.start,
            end_date: dateRange.end,
            recruiter_ids: ids,
          },
        });
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

/* ─────────────────────────────────────────────────────────
   BookingCheckoutPanel — calendar + quick actions
─────────────────────────────────────────────────────────── */
const BookingCheckoutPanel = ({ token, currentUserInfo }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [calendarView, setCalendarView] = useState("timeGridWeek");
  const [selected, setSelected] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [baseAmount, setBaseAmount] = useState("");
  const [extraAmount, setExtraAmount] = useState("");
  const [tipMode, setTipMode] = useState("0");
  const [customTip, setCustomTip] = useState("");
  const [invoiceUrl, setInvoiceUrl] = useState("");
  const [offlineOpen, setOfflineOpen] = useState(false);
  const [offlineMethod, setOfflineMethod] = useState("cash");
  const [offlineNote, setOfflineNote] = useState("");
  const [baseLocked, setBaseLocked] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedRecruiter, setSelectedRecruiter] = useState("");
  const isManager = Boolean(currentUserInfo?.is_manager);
  const canManageShifts = Boolean(currentUserInfo?.can_manage_shifts);
  const canCollectPaymentsSelf = Boolean(currentUserInfo?.can_collect_payments_self);
  const isSelfOnly = canCollectPaymentsSelf && !isManager && !canManageShifts;

  const statusColor = (status) => {
    const key = String(status || "").toLowerCase();
    if (key === "completed") return theme.palette.success.light;
    if (key === "no-show" || key === "no_show") return theme.palette.error.light;
    if (key === "cancelled") return theme.palette.grey[400];
    return theme.palette.info.light;
  };

  const parseAmount = (val) => {
    const num = Number(val);
    return Number.isFinite(num) ? num : 0;
  };

  const toCents = (val) => Math.round(parseAmount(val) * 100);

  const loadFilters = async () => {
    if (isSelfOnly) {
      setDepartments([]);
      setRecruiters([]);
      return;
    }
    try {
      const [deptRes, recruiterRes] = await Promise.all([
        api.get("/api/departments"),
        api.get("/manager/recruiters"),
      ]);
      const deptList = Array.isArray(deptRes.data) ? deptRes.data : [];
      const recList = Array.isArray(recruiterRes.data?.recruiters)
        ? recruiterRes.data.recruiters
        : Array.isArray(recruiterRes.data)
        ? recruiterRes.data
        : [];
      setDepartments(deptList);
      setRecruiters(recList);
    } catch (err) {
      console.error("Failed to load booking filters:", err);
      setDepartments([]);
      setRecruiters([]);
    }
  };

  const loadBookings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/manager/bookings");
      const list = Array.isArray(data) ? data : data?.bookings || [];
      setBookings(list);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load bookings.");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadBookings();
    loadFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!isSelfOnly) return;
    if (currentUserInfo?.id) {
      setSelectedRecruiter(String(currentUserInfo.id));
    }
  }, [isSelfOnly, currentUserInfo]);

  const recruiterDeptById = useMemo(() => {
    const map = new Map();
    recruiters.forEach((r) => {
      map.set(String(r.id), String(r.department_id || ""));
    });
    return map;
  }, [recruiters]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const recruiterId = String(b?.recruiter?.id || b?.recruiter_id || "");
      if (isSelfOnly && recruiterId !== String(currentUserInfo?.id || "")) return false;
      if (selectedRecruiter && recruiterId !== String(selectedRecruiter)) return false;
      if (selectedDepartment) {
        const deptId = recruiterDeptById.get(recruiterId) || "";
        if (deptId !== String(selectedDepartment)) return false;
      }
      return true;
    });
  }, [bookings, selectedRecruiter, selectedDepartment, recruiterDeptById]);

  const events = filteredBookings
    .map((b) => {
      const start =
        b.start_iso_local ||
        (b.local_date && b.local_start_time ? `${b.local_date}T${b.local_start_time}` : null);
      const end =
        b.end_iso_local ||
        (b.local_date && b.local_end_time ? `${b.local_date}T${b.local_end_time}` : null);
      if (!start) return null;
      const clientName = b?.client?.full_name || b?.client?.email || "Client";
      const serviceName = b?.service?.name || "Service";
      return {
        id: String(b.id),
        title: `${serviceName} • ${clientName}`,
        start,
        end: end || start,
        backgroundColor: statusColor(b.status),
        borderColor: statusColor(b.status),
        textColor: theme.palette.text.primary,
      };
    })
    .filter(Boolean);

  const handleEventClick = (info) => {
    const booking = filteredBookings.find((b) => String(b.id) === String(info.event.id));
    if (!booking) return;
    setSelected(booking);
    const baseCandidate =
      booking?.service?.base_price ??
      booking?.base_price ??
      booking?.amount ??
      booking?.total ??
      0;
    const baseValue = Number.isFinite(Number(baseCandidate)) ? Number(baseCandidate) : 0;
    const hasBase =
      booking?.service?.base_price != null ||
      booking?.base_price != null ||
      booking?.amount != null ||
      booking?.total != null;
    setBaseAmount(baseValue ? String(baseValue) : "");
    setExtraAmount("");
    setTipMode("0");
    setCustomTip("");
    setInvoiceUrl("");
    setBaseLocked(Boolean(hasBase && baseValue > 0));
    setDetailsOpen(true);
  };

  const handleMarkCompleted = async () => {
    if (!selected) return;
    try {
      await api.post(`/api/manager/bookings/${selected.id}/complete`, {});
      setSnackbar({ open: true, message: "Booking marked completed.", severity: "success" });
      setDetailsOpen(false);
      loadBookings();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err?.response?.data?.error || "Failed to mark completed.",
        severity: "error",
      });
    }
  };

  const handleCollectPayment = () => {
    if (!selected) return;
    const baseCents = toCents(baseAmount);
    const extraCents = toCents(extraAmount);
    const tipCents =
      tipMode === "custom"
        ? toCents(customTip)
        : Math.round((baseCents + extraCents) * (Number(tipMode) / 100));
    const totalCents = Math.max(0, baseCents + extraCents + tipCents);
    const params = new URLSearchParams(location.search);
    params.set("view", "payments-hub");
    params.set("appointmentId", String(selected.id));
    params.set("intent", "collect");
    params.set("currency", currency);
    params.set("amount_override_cents", String(totalCents));
    params.set("amount_cents", String(baseCents));
    params.set("extra_amount_cents", String(extraCents));
    params.set("tip_amount_cents", String(tipCents));
    params.set("amount", (totalCents / 100).toFixed(2));
    params.set("extra", (extraCents / 100).toFixed(2));
    params.set("tip", (tipCents / 100).toFixed(2));
    navigate(`/manager/payments-hub?${params.toString()}`);
  };

  const handleCreateInvoice = async () => {
    if (!selected) return;
    const baseCents = toCents(baseAmount);
    const extraCents = toCents(extraAmount);
    const tipCents =
      tipMode === "custom"
        ? toCents(customTip)
        : Math.round((baseCents + extraCents) * (Number(tipMode) / 100));
    const totalCents = Math.max(0, baseCents + extraCents + tipCents);
    if (totalCents <= 0) {
      setSnackbar({ open: true, message: "Enter a valid amount to invoice.", severity: "error" });
      return;
    }
    const clientId = selected?.client?.id;
    const clientEmail = (selected?.client?.email || "").trim();
    if (!clientId && !clientEmail) {
      setSnackbar({
        open: true,
        message: "Missing client info: need client ID or email to create payment link.",
        severity: "error",
      });
      return;
    }
    const currency = (selected?.currency || "USD").toUpperCase();
    const description = `Booking #${selected.id} • ${selected?.service?.name || "Service"}`;
    try {
      const payload = {
        appointment_id: selected.id,
        currency,
        description,
        amount_cents: totalCents,
        ...(clientId
          ? { client_id: clientId }
          : { client_email: clientEmail, client_name: selected?.client?.full_name || undefined }),
      };
      const { data } = await api.post("/api/manager/manual-payments", payload);
      const url = data?.checkout_url || data?.invoice?.hosted_invoice_url || "";
      if (url) setInvoiceUrl(url);
      setSnackbar({ open: true, message: "Payment link created.", severity: "success" });
    } catch (err) {
      const status = err?.response?.status;
      if (status === 412 && err?.response?.data?.onboarding_url) {
        setSnackbar({
          open: true,
          message: "Stripe onboarding incomplete. Finish setup to create payment links.",
          severity: "warning",
        });
      } else {
        setSnackbar({
          open: true,
          message: err?.response?.data?.error || "Failed to create payment link.",
          severity: "error",
        });
      }
    }
  };

  const handleStartKiosk = async () => {
    if (!selected) return;
    const extraCents = toCents(extraAmount);
    try {
      const { data } = await api.post(`/api/manager/bookings/${selected.id}/kiosk-token`, {
        extra_amount_cents: extraCents,
      });
      const token = data?.token;
      if (!token) {
        setSnackbar({
          open: true,
          message: "Kiosk token unavailable. Try again.",
          severity: "error",
        });
        return;
      }
      setDetailsOpen(false);
      navigate(`/kiosk/pay/${token}`);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err?.response?.data?.error || "Failed to start kiosk checkout.",
        severity: "error",
      });
    }
  };

  const handleCopyInvoice = async () => {
    if (!invoiceUrl) return;
    try {
      await navigator.clipboard.writeText(invoiceUrl);
      setSnackbar({ open: true, message: "Payment link copied.", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Copy failed.", severity: "error" });
    }
  };

  const handleMarkPaidOffline = async () => {
    if (!selected) return;
    try {
      await api.post(`/api/manager/bookings/${selected.id}/mark-paid`, {
        method: offlineMethod,
        note: offlineNote,
      });
      setSnackbar({ open: true, message: "Marked paid (offline).", severity: "success" });
      setOfflineOpen(false);
      setDetailsOpen(false);
      loadBookings();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err?.response?.data?.error || "Failed to mark paid.",
        severity: "error",
      });
    }
  };

  const isPaid = (status) => String(status || "").toLowerCase() === "paid";
  const statusKey = String(selected?.status || "").toLowerCase().replace("-", "_");
  const paymentKey = String(selected?.payment_status || "").toLowerCase();
  const hasCardOnFile = Boolean(selected?.has_card_on_file || selected?.card_on_file);
  const currency = (selected?.currency || "USD").toUpperCase();
  const baseCents = toCents(baseAmount);
  const extraCents = toCents(extraAmount);
  const tipCents =
    tipMode === "custom"
      ? toCents(customTip)
      : Math.round((baseCents + extraCents) * (Number(tipMode) / 100));
  const totalCents = Math.max(0, baseCents + extraCents + tipCents);

  return (
    <ManagementFrame>
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Booking Checkout Calendar
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Click a booking to mark it completed and collect payment.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center" ml={{ md: "auto" }}>
            <ToggleButtonGroup
              value={calendarView}
              exclusive
              onChange={(_, v) => v && setCalendarView(v)}
              size="small"
            >
              <ToggleButton value="timeGridDay">Day</ToggleButton>
              <ToggleButton value="timeGridWeek">Week</ToggleButton>
              <ToggleButton value="dayGridMonth">Month</ToggleButton>
            </ToggleButtonGroup>
            <Button variant="outlined" size="small" onClick={loadBookings} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </Stack>
        </Stack>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
          {isSelfOnly ? (
            <Alert severity="info" sx={{ py: 1, width: "100%" }}>
              Showing only your bookings.
            </Alert>
          ) : (
            <>
              <FormControl sx={{ minWidth: 220 }}>
                <InputLabel id="booking-checkout-department">Department</InputLabel>
                <Select
                  labelId="booking-checkout-department"
                  value={selectedDepartment}
                  label="Department"
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                >
                  <MenuItem value="">All Departments</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={String(dept.id)}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 220 }}>
                <InputLabel id="booking-checkout-employee">Employee</InputLabel>
                <Select
                  labelId="booking-checkout-employee"
                  value={selectedRecruiter}
                  label="Employee"
                  onChange={(e) => setSelectedRecruiter(e.target.value)}
                >
                  <MenuItem value="">All Employees</MenuItem>
                  {recruiters.map((rec) => (
                    <MenuItem key={rec.id} value={String(rec.id)}>
                      {rec.name || rec.full_name || rec.email || `Employee ${rec.id}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        <Paper
          sx={{
            p: 2,
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={calendarView}
            key={`booking-cal-${calendarView}`}
            events={events}
            height={isSmall ? "auto" : 700}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "",
            }}
            eventClick={handleEventClick}
            nowIndicator
          />
        </Paper>
      </Stack>

      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Collect Payment</DialogTitle>
        <DialogContent dividers>
          {selected ? (
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  {selected?.service?.name || "Service"} • {selected?.client?.full_name || selected?.client?.email || "Client"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selected?.client?.email || "—"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selected?.client?.phone || "—"}
                </Typography>
                {(() => {
                  const meetingLink =
                    selected?.meeting_link ||
                    selected?.meeting_url ||
                    selected?.public_meeting_link ||
                    "";
                  if (!meetingLink) return null;
                  return (
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      <b>Video:</b>{" "}
                      <Link href={meetingLink} target="_blank" rel="noopener">
                        Join meeting
                      </Link>
                    </Typography>
                  );
                })()}
                <Typography variant="body2">
                  {selected?.local_date || selected?.date} {selected?.local_start_time || selected?.start_time}{" "}
                  {selected?.appointment_timezone ? `(${selected.appointment_timezone})` : ""}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
                  <Chip size="small" label={selected.status || "booked"} />
                  <Chip size="small" label={selected.payment_status || "unpaid"} variant="outlined" />
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight={700} mb={1}>
                  Amount builder
                </Typography>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    label="Base amount"
                    value={baseAmount}
                    onChange={(e) => setBaseAmount(e.target.value)}
                    fullWidth
                    disabled={baseLocked}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">{currency}</InputAdornment>,
                    }}
                  />
                  <TextField
                    label="Extra amount"
                    value={extraAmount}
                    onChange={(e) => setExtraAmount(e.target.value)}
                    fullWidth
                    InputProps={{
                      endAdornment: <InputAdornment position="end">{currency}</InputAdornment>,
                    }}
                  />
                </Stack>
                <Stack spacing={1} mt={2}>
                  <FormLabel>Tip</FormLabel>
                  <ToggleButtonGroup
                    value={tipMode}
                    exclusive
                    onChange={(_, v) => v && setTipMode(v)}
                    size="small"
                  >
                    <ToggleButton value="0">0%</ToggleButton>
                    <ToggleButton value="10">10%</ToggleButton>
                    <ToggleButton value="15">15%</ToggleButton>
                    <ToggleButton value="20">20%</ToggleButton>
                    <ToggleButton value="custom">Custom</ToggleButton>
                  </ToggleButtonGroup>
                  {tipMode === "custom" && (
                    <TextField
                      label="Custom tip"
                      value={customTip}
                      onChange={(e) => setCustomTip(e.target.value)}
                      sx={{ maxWidth: 240 }}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">{currency}</InputAdornment>,
                      }}
                    />
                  )}
                </Stack>
                <Stack direction="row" spacing={2} alignItems="center" mt={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Billed in {currency}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    Customer payments in {currency}
                  </Typography>
                </Stack>
                <Typography variant="h6" mt={1}>
                  Total: {(totalCents / 100).toFixed(2)} {currency}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight={700} mb={1}>
                  Payment methods
                </Typography>
                {isPaid(paymentKey) && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    This booking is already marked as paid.
                  </Alert>
                )}
                <Stack spacing={1.5}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography fontWeight={600}>Card on file</Typography>
                        <Tooltip
                          title={
                            <Box>
                              <Typography variant="subtitle2" gutterBottom>
                                Tax on Card-on-file charges
                              </Typography>
                              <Typography variant="body2">
                                Tax is not calculated automatically when charging a saved card.
                                If you charge tax (GST/HST/Sales tax), add it to the amount manually.
                                For automatic tax calculation, use Payment link / Invoice or Pay during checkout.
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                Example: Service $50 + 13% tax ($6.50) → Charge $56.50.
                              </Typography>
                            </Box>
                          }
                        >
                          <IconButton size="small">
                            <InfoOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {hasCardOnFile ? "Charge the saved card on file." : "No card on file for this client."}
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={handleCollectPayment}
                        disabled={!hasCardOnFile || isPaid(paymentKey)}
                      >
                        Charge saved card
                      </Button>
                      <Typography variant="caption" color="text.secondary">
                        Tip: Stripe won’t add tax automatically for saved-card charges. Include tax in the total if needed.
                      </Typography>
                      <Stack spacing={0.5}>
                        <Typography variant="body2" color="text.secondary">
                          Want tax calculated automatically? Use a payment link.
                        </Typography>
                        <Button
                          variant="text"
                          size="small"
                          onClick={handleCreateInvoice}
                          disabled={isPaid(paymentKey)}
                          sx={{ alignSelf: "flex-start", px: 0 }}
                        >
                          Create payment link (Stripe calculates tax)
                        </Button>
                        <Typography variant="caption" color="text.secondary">
                          Requires Stripe Automatic Tax enabled in Stripe.
                        </Typography>
                      </Stack>
                    </Stack>
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={1}>
                      <Typography fontWeight={600}>Payment link (invoice)</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Create a hosted payment link and share it with the client.
                      </Typography>
                      <Button
                        variant="outlined"
                        onClick={handleCreateInvoice}
                        disabled={isPaid(paymentKey)}
                      >
                        Create payment link
                      </Button>
                      {invoiceUrl && (
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                          <TextField
                            label="Hosted payment link"
                            value={invoiceUrl}
                            fullWidth
                            InputProps={{ readOnly: true }}
                          />
                          <Button variant="contained" onClick={handleCopyInvoice}>
                            Copy link
                          </Button>
                        </Stack>
                      )}
                    </Stack>
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={1}>
                      <Typography fontWeight={600}>Pay on this device</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Hand the device to the client to choose tip and pay by card.
                      </Typography>
                      <Button
                        variant="outlined"
                        onClick={handleStartKiosk}
                        disabled={isPaid(paymentKey)}
                      >
                        Start kiosk checkout
                      </Button>
                    </Stack>
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={1}>
                      <Typography fontWeight={600}>Mark as paid (offline)</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Record cash, terminal, or e-transfer payments.
                      </Typography>
                      <Button
                        variant="outlined"
                        onClick={() => setOfflineOpen(true)}
                        disabled={isPaid(paymentKey)}
                      >
                        Mark paid
                      </Button>
                    </Stack>
                  </Paper>
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight={700} mb={1}>
                  Booking status
                </Typography>
                <Button
                  variant="outlined"
                  onClick={handleMarkCompleted}
                  disabled={!selected || statusKey === "completed"}
                >
                  Mark Completed
                </Button>
              </Box>
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No booking selected.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={offlineOpen} onClose={() => setOfflineOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Mark as paid</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Method</InputLabel>
              <Select
                label="Method"
                value={offlineMethod}
                onChange={(e) => setOfflineMethod(e.target.value)}
              >
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="terminal">Terminal</MenuItem>
                <MenuItem value="etransfer">E-transfer</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Note (optional)"
              value={offlineNote}
              onChange={(e) => setOfflineNote(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOfflineOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleMarkPaidOffline}>
            Confirm paid
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ManagementFrame>
  );
};

const NewManagementDashboard = ({ token, initialView, sectionOnly = false }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [currentUserInfo, setCurrentUserInfo] = useState(null);
  const isManager = useMemo(() => {
    if (currentUserInfo?.is_manager) return true;
    const stored = (typeof window !== "undefined" && window.localStorage.getItem("role")) || "";
    return String(stored).toLowerCase() === "manager";
  }, [currentUserInfo]);
  const canManageOnboarding = Boolean(currentUserInfo?.can_manage_onboarding);
  const canManageOnboardingLimited = Boolean(currentUserInfo?.can_manage_onboarding_limited);
  const canManageShifts = Boolean(currentUserInfo?.can_manage_shifts);
  const canCollectPaymentsSelf = Boolean(currentUserInfo?.can_collect_payments_self);
  const canManagePayroll = Boolean(currentUserInfo?.can_manage_payroll);
  const hasHrAccess = isManager || canManageOnboarding || canManageOnboardingLimited;
  const hasSupervisorAccess = isManager || canManageShifts;
  const hasPayrollAccess = isManager || canManagePayroll;

  const filteredMenuConfig = useMemo(() => {
    if (isManager) return menuConfig;
    const allowedGroups = new Set();
    if (hasHrAccess) allowedGroups.add("employee-group");
    if (canManageShifts) allowedGroups.add("shifts-group");
    if (canManagePayroll) allowedGroups.add("payroll-group");
    const base = menuConfig
      .filter((item) => allowedGroups.has(item.key))
      .map((item) => {
        if (item.key === "employee-group") {
          return {
            ...item,
            children: (item.children || []).filter((child) => child.key === "employee-profiles"),
          };
        }
        if (item.key === "shifts-group" && canManageShifts && !isManager) {
          const children = item.children || [];
          const hasMaster = children.some((child) => child.key === "master-calendar");
          const extra = hasMaster
            ? []
            : [{ label: "Master Calendar", key: "master-calendar", icon: <CalendarToday /> }];
          return {
            ...item,
            children: [...children, ...extra],
          };
        }
        return item;
      });
    const allowCheckout = canManageShifts || canCollectPaymentsSelf;
    if (allowCheckout) {
      const checkoutItem = menuConfig.find((item) => item.key === "booking-checkout");
      if (checkoutItem) base.push(checkoutItem);
    }
    return base;
  }, [isManager, hasHrAccess, canManageShifts, canCollectPaymentsSelf, canManagePayroll]);

  const menuItems = useMemo(
    () =>
      filteredMenuConfig.map((item) => {
        const mappedItem = {
          ...item,
          label: item.labelKey ? t(item.labelKey) : item.label || "",
        };

        if (item.children) {
          mappedItem.children = item.children.map((child) => ({
            ...child,
            label: child.labelKey ? t(child.labelKey) : child.label || "",
          }));
        }

        return mappedItem;
      }),
    [t, i18n.language, filteredMenuConfig]
  );

  const allowedViewKeys = useMemo(() => {
    const keys = new Set();
    filteredMenuConfig.forEach((item) => {
      if (item.key === "employee-group") {
        keys.add("employee-management");
      }
      if (item.key === "overview") {
        keys.add("overview");
      }
      if (item.children && item.children.length) {
        item.children.forEach((child) => keys.add(child.key));
      } else if (item.key) {
        keys.add(item.key);
      }
    });
    // Allow deep-linked payment hub without showing it in the sidebar.
    keys.add("payments-hub");
    // Allow settings view even when it is hidden from the sidebar.
    keys.add("settings");
    // Allow shift/availability views that are launched from the group header.
    keys.add("available-slots");
    keys.add("available-shifts");
    keys.add("available-shifts-fullscreen");
    return Array.from(keys);
  }, [filteredMenuConfig]);
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
  const [includeArchivedEmployees, setIncludeArchivedEmployees] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [conversionRequests, setConversionRequests] = useState([]);
  const [conversionLoading, setConversionLoading] = useState(false);
  const [employeeHelpOpen, setEmployeeHelpOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmArchiveId, setConfirmArchiveId] = useState(null);
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [statsError, setStatsError] = useState("");
  const [timeRange, setTimeRange] = useState("14");
  const [billingStatus, setBillingStatus] = useState(null);
  const [billingStatusError, setBillingStatusError] = useState("");
  const [billingPortalLoading, setBillingPortalLoading] = useState(false);
  const isMobileViewport = useMediaQuery(theme.breakpoints.down("lg"));
  const navOffset = useMediaQuery(theme.breakpoints.down("sm")) ? 56 : 64; // height of global nav bar
  const managerBarHeight = 0; // remove extra bar on mobile; rely on floating toggle
  const headerOffset = navOffset + managerBarHeight;
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const drawerExpanded = isMobileViewport ? true : isDrawerOpen;
  const drawerWidthCurrent = drawerExpanded ? drawerWidth : collapsedWidth;

  useEffect(() => {
    localStorage.setItem("manager_selected_view", selectedView);
  }, [selectedView]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/me");
        setCurrentUserInfo(res.data || null);
      } catch {
        setCurrentUserInfo(null);
      }
    };
    if (token) fetchUser();
  }, [token]);

  useEffect(() => {
    const loadBillingStatus = async () => {
      setBillingStatusError("");
      try {
        const res = await api.get("/billing/status");
        setBillingStatus(res.data || null);
      } catch (err) {
        if (err?.response?.status !== 403) {
          setBillingStatusError("Unable to load billing status.");
        }
      }
    };
    if (token && isManager) {
      loadBillingStatus();
    }
  }, [token, isManager]);

  useEffect(() => {
    if (isManager && selectedView === "__landing__") {
      setSelectedView("employee-management");
    }
  }, [isManager, selectedView]);

  useEffect(() => {
    if (initialView && initialView !== selectedView) {
      setSelectedView(initialView);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialView]);

  useEffect(() => {
    if (isManager) return;
    if (!allowedViewKeys.length) return;
    if (!allowedViewKeys.includes(selectedView)) {
      setSelectedView(allowedViewKeys[0]);
    }
  }, [isManager, allowedViewKeys, selectedView]);

  // Landing activity feed
  useEffect(() => {
    const run = async () => {
      try {
        const res = await api.get("/manager/activity-feed");
        setActivityLanding(res.data || { recent_bookings: [] });
      } catch (e) {
        setActivityErr("Failed to load activity feed.");
      }
    };
    if (
      token &&
      isManager &&
      (selectedView === "__landing__" || selectedView === "overview" || selectedView === "recent-bookings")
    )
      run();
  }, [token, selectedView, isManager]);

  // Employee management data loading
  useEffect(() => {
    if (token) fetchDepartments();
  }, [token]);

  useEffect(() => {
    if (token && selectedView === "employee-management") fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, departmentFilter, selectedView, includeArchivedEmployees]);

  useEffect(() => {
    if (token && selectedView === "employee-management" && isManager) fetchConversionRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedView, isManager]);

  useEffect(() => {
    if (token && selectedView === "overview") {
      fetchEmployees({ ignoreFilter: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedView]);

  useEffect(() => {
    if (!isMobileViewport) {
      setMobileDrawerOpen(false);
    }
  }, [isMobileViewport]);

  // API calls - Employee Management
  const fetchEmployees = async (options = {}) => {
    const { ignoreFilter = false } = options;
    try {
      const res = await api.get("/manager/recruiters", {
        params: {
          ...(!ignoreFilter && departmentFilter ? { department_id: departmentFilter } : {}),
          ...(selectedView === "employee-management" && includeArchivedEmployees ? { include_archived: 1 } : {}),
        },
      });
      const rows = res.data?.recruiters || res.data || [];
      setEmployees(rows);
    } catch {
      setError("Failed to fetch employees.");
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/api/departments");
      setDepartments(res.data || []);
    } catch {
      setError("Failed to fetch departments.");
    }
  };

  const fetchConversionRequests = async () => {
    try {
      setConversionLoading(true);
      const res = await api.get("/manager/candidates/conversion-requests", {
        params: { status: "pending" },
      });
      setConversionRequests(res.data?.results || []);
    } catch {
      setError("Failed to load conversion requests.");
    } finally {
      setConversionLoading(false);
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      await api.patch(`/manager/recruiters/${id}`, { role: newRole });
      fetchEmployees();
    } catch {
      setError("Failed to update role.");
    }
  };

  const handleResetPassword = async (id) => {
    try {
      await api.post(`/manager/recruiters/${id}/reset-password`, {});
      setMessage("Temporary password sent.");
    } catch {
      setError("Failed to reset password.");
    }
  };

  const handleOnboardingToggle = async (id, enabled) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === id
          ? {
              ...emp,
              can_manage_onboarding: enabled,
              can_manage_onboarding_limited: enabled ? false : emp.can_manage_onboarding_limited,
            }
          : emp
      )
    );
    try {
      await api.patch(`/manager/recruiters/${id}`, {
        can_manage_onboarding: enabled,
        ...(enabled ? { can_manage_onboarding_limited: false } : {}),
      });
      setMessage("Onboarding access updated.");
      fetchEmployees();
    } catch {
      setError("Failed to update onboarding access.");
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === id
            ? {
                ...emp,
                can_manage_onboarding: !enabled,
                can_manage_onboarding_limited: emp.can_manage_onboarding_limited,
              }
            : emp
        )
      );
    }
  };

  const handleLimitedOnboardingToggle = async (id, enabled) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === id
          ? {
              ...emp,
              can_manage_onboarding_limited: enabled,
              can_manage_onboarding: enabled ? false : emp.can_manage_onboarding,
            }
          : emp
      )
    );
    try {
      await api.patch(`/manager/recruiters/${id}`, {
        can_manage_onboarding_limited: enabled,
        ...(enabled ? { can_manage_onboarding: false } : {}),
      });
      setMessage("Limited onboarding access updated.");
      fetchEmployees();
    } catch {
      setError("Failed to update onboarding access.");
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === id
            ? {
                ...emp,
                can_manage_onboarding_limited: !enabled,
                can_manage_onboarding: emp.can_manage_onboarding,
              }
            : emp
        )
      );
    }
  };

  const handleSupervisorAccessToggle = async (id, enabled) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === id
          ? {
              ...emp,
              can_manage_shifts: enabled,
            }
          : emp
      )
    );
    try {
      await api.patch(`/manager/recruiters/${id}`, { can_manage_shifts: enabled });
      setMessage("Supervisor access updated.");
      fetchEmployees();
    } catch {
      setError("Failed to update supervisor access.");
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === id
            ? {
                ...emp,
                can_manage_shifts: !enabled,
              }
            : emp
        )
      );
    }
  };

  const handlePayrollAccessToggle = async (id, enabled) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === id
          ? {
              ...emp,
              can_manage_payroll: enabled,
            }
          : emp
      )
    );
    try {
      await api.patch(`/manager/recruiters/${id}`, { can_manage_payroll: enabled });
      setMessage("Payroll access updated.");
      fetchEmployees();
    } catch {
      setError("Failed to update payroll access.");
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === id
            ? {
                ...emp,
                can_manage_payroll: !enabled,
              }
            : emp
        )
      );
    }
  };

  const handlePaymentSelfToggle = async (id, enabled) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === id
          ? {
              ...emp,
              can_collect_payments_self: enabled,
            }
          : emp
      )
    );
    try {
      await api.patch(`/manager/recruiters/${id}`, { can_collect_payments_self: enabled });
      setMessage("Payment access updated.");
      fetchEmployees();
    } catch {
      setError("Failed to update payment access.");
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === id
            ? {
                ...emp,
                can_collect_payments_self: !enabled,
              }
            : emp
        )
      );
    }
  };

  const handleApproveConversion = async (candidateId) => {
    try {
      await api.post(`/manager/candidates/${candidateId}/approve-conversion`, {});
      setMessage("Conversion approved.");
      fetchConversionRequests();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to approve conversion.");
    }
  };

  const handleRejectConversion = async (candidateId) => {
    const reason = window.prompt("Rejection reason (optional):") || "";
    try {
      await api.post(`/manager/candidates/${candidateId}/reject-conversion`, { reason });
      setMessage("Conversion rejected.");
      fetchConversionRequests();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reject conversion.");
    }
  };

  const handleArchive = async () => {
    try {
      await api.patch(`/manager/recruiters/${confirmArchiveId}/archive`, {});
      setMessage("Employee archived.");
      setConfirmArchiveId(null);
      fetchEmployees();
    } catch {
      setError("Archive failed.");
    }
  };

  const handleRestore = async (id) => {
    try {
      await api.patch(`/manager/recruiters/${id}`, { status: "active" });
      setMessage("Employee restored.");
      fetchEmployees();
    } catch {
      setError("Restore failed.");
    }
  };

  const handleCompare = async () => {
    try {
      const res = await api.get("/manager/recruiters/compare", {
        params: { ids: selectedForComparison, timeRange },
      });
      setComparisonData(res.data);
      setStatsError("");
    } catch {
      setStatsError("Failed to load employee stats.");
    }
  };

  const filteredEmployees = useMemo(() => {
    if (departmentFilter && selectedView === "employee-management") {
      return employees.filter((e) => String(e.department_id) === String(departmentFilter));
    }
    return employees;
  }, [departmentFilter, employees, selectedView]);

  const headerStyle = {
    color: theme.palette.text.primary,
    fontFamily: "Poppins, sans-serif",
    fontWeight: 600,
  };

  const fetchSwapRequests = async () => {
    try {
      const res = await api.get("/shift-swap-requests");
      const peerAccepted = res.data.filter((r) => r.status === "peer_accepted");
      setSwapRequests(peerAccepted);
      setSwapError("");
    } catch {
      setSwapError("Failed to fetch swap requests.");
    }
  };

  const handleManagerDecision = async (swapId, approve) => {
    try {
      await api.put(`/shift-swap-requests/${swapId}/manager-decision`, { approve });
      fetchSwapRequests();
    } catch {
      setSwapError("Failed to update swap status.");
    }
  };

  const viewToPath = (viewKey) => {
    if (!viewKey || viewKey === "__landing__") return "/manager/dashboard";
    return `/manager/${viewKey}`;
  };

  const handleNavSelect = (viewKey) => {
    if (viewKey === "billing") {
      navigate("/manager/settings?tab=billing");
      setSelectedView("settings");
      if (isMobileViewport) {
        setMobileDrawerOpen(false);
      }
      return;
    }
    setSelectedView(viewKey);
    navigate(viewToPath(viewKey));
    if (isMobileViewport) {
      setMobileDrawerOpen(false);
    }
  };

  const toggleDrawer = () => {
    if (isMobileViewport) {
      setMobileDrawerOpen((prev) => !prev);
    } else {
      setIsDrawerOpen((prev) => !prev);
    }
  };

  const handleBillingPortal = async () => {
    setBillingPortalLoading(true);
    try {
      const res = await api.post("/billing/portal");
      const url = res?.data?.url;
      if (url && typeof window !== "undefined") {
        window.location.href = url;
        return;
      }
      throw new Error("Billing portal URL missing.");
    } catch {
      setBillingStatusError("Unable to open billing portal.");
    } finally {
      setBillingPortalLoading(false);
    }
  };

  // Renders content for selected menu item
  const renderView = () => {
    const effectiveView = allowedViewKeys.includes(selectedView)
      ? selectedView
      : allowedViewKeys[0] || selectedView;
    switch (effectiveView) {
      case "__landing__":
        return (
          <ManagementFrame>
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
          <Box>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
              spacing={1}
              sx={{ mb: 2 }}
            >
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Employee Management
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<HelpOutlineIcon />}
                onClick={() => setEmployeeHelpOpen(true)}
              >
                Help
              </Button>
            </Stack>
            {isManager && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mb: 2,
                  borderRadius: 2,
                  border: (theme) => `1px dashed ${theme.palette.divider}`,
                  backgroundColor: (theme) => theme.palette.background.default,
                }}
              >
                <Typography fontWeight={600} gutterBottom>
                  Need to add a new team member?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Use the dedicated Add Member workspace for the full onboarding form (address, department, payroll, compliance consent).
                </Typography>
                <Button
                  sx={{ mt: 2 }}
                  variant="contained"
                  onClick={() => navigate("/manager/add-member")}
                  startIcon={<PersonAddAltIcon />}
                >
                  Launch Add Member
                </Button>
              </Paper>
            )}

            {isManager && (
              <Accordion defaultExpanded sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" sx={headerStyle}>
                    Pending Employee Conversions
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {conversionLoading ? (
                    <Typography color="text.secondary">Loading conversion requests...</Typography>
                  ) : conversionRequests.length === 0 ? (
                    <Typography color="text.secondary">No pending conversion requests.</Typography>
                  ) : (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Candidate</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell>Requested</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {conversionRequests.map((req) => (
                          <TableRow key={req.id} hover>
                            <TableCell>{req.name || "—"}</TableCell>
                            <TableCell>
                              {req.email ? (
                                <Link
                                  href={`/recruiter/candidates/${encodeURIComponent(req.email)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  sx={{ color: theme.palette.primary.main }}
                                >
                                  {req.email}
                                </Link>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell>
                              {req.conversion_requested_at
                                ? new Date(req.conversion_requested_at).toLocaleString()
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                <Button size="small" variant="contained" onClick={() => handleApproveConversion(req.id)}>
                                  Approve
                                </Button>
                                <Button size="small" variant="outlined" color="warning" onClick={() => handleRejectConversion(req.id)}>
                                  Reject
                                </Button>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </AccordionDetails>
              </Accordion>
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
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  alignItems={{ xs: "stretch", sm: "center" }}
                  sx={{ mb: 2 }}
                >
                  <FormControl size="small" fullWidth>
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
                  <Button
                    variant="text"
                    onClick={() => {
                      setDepartmentFilter("");
                      setSelectedForComparison([]);
                    }}
                    sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
                  >
                    Clear filter
                  </Button>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={includeArchivedEmployees}
                        onChange={(e) => setIncludeArchivedEmployees(e.target.checked)}
                      />
                    }
                    label="Show archived employees"
                  />
                </Stack>

                <Grid container spacing={2}>
                  {filteredEmployees
                    .filter((e) => (includeArchivedEmployees ? true : e.status !== "inactive"))
                    .map((e) => (
                      <Grid item xs={12} sm={6} key={e.id}>
                        <Accordion
                          elevation={1}
                          sx={{
                            borderRadius: 2,
                            "&:before": { display: "none" },
                          }}
                        >
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Stack spacing={0.5} sx={{ width: "100%" }}>
                              <Typography fontWeight={600}>
                                {e.first_name} {e.last_name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {e.email} {e.timezone ? `• ${e.timezone}` : ""}
                              </Typography>
                              {e.status === "inactive" && (
                                <Typography variant="caption" color="text.secondary">
                                  Archived
                                </Typography>
                              )}
                            </Stack>
                          </AccordionSummary>
                          <AccordionDetails>
                            {isManager ? (
                              <Stack direction="row" spacing={1} alignItems="center">
                                <TextField
                                  select
                                  size="small"
                                  label="Role"
                                  value={e.is_manager ? "manager" : "recruiter"}
                                  onChange={(ev) => handleRoleChange(e.id, ev.target.value)}
                                  sx={{ width: "60%" }}
                                >
                                  <MenuItem value="recruiter">Employee</MenuItem>
                                  <MenuItem value="manager">Manager</MenuItem>
                                </TextField>
                                <Tooltip
                                  title="Employee: standard staff account (calendar, shifts, time). Manager: full admin access across payroll, scheduling, and settings."
                                  placement="top"
                                >
                                  <IconButton size="small" aria-label="Role help">
                                    <InfoOutlined fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            ) : (
                              <Typography variant="body2">
                                Role: {e.is_manager ? "Manager" : "Employee"}
                              </Typography>
                            )}

                            {isManager && (
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                                <Checkbox
                                  size="small"
                                  checked={Boolean(e.can_manage_onboarding)}
                                  onChange={(ev) => handleOnboardingToggle(e.id, ev.target.checked)}
                                />
                                <Typography variant="body2">HR onboarding access</Typography>
                                <Tooltip
                                  title="Full HR access: view and edit employee profiles, manage onboarding documents, and edit candidate profiles."
                                  placement="top"
                                >
                                  <IconButton size="small" aria-label="HR onboarding access help">
                                    <InfoOutlined fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            )}

                            {isManager && (
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Checkbox
                                  size="small"
                                  checked={Boolean(e.can_manage_onboarding_limited)}
                                  onChange={(ev) =>
                                    handleLimitedOnboardingToggle(e.id, ev.target.checked)
                                  }
                                  disabled={Boolean(e.can_manage_onboarding)}
                                />
                                <Typography variant="body2">Limited HR onboarding access</Typography>
                                <Tooltip
                                  title="Limited HR access: can access HR tabs (invitations, forms, questionnaires, meetings, candidate search, public link) and read candidate profiles. No access to employee profiles or candidate edits."
                                  placement="top"
                                >
                                  <IconButton size="small" aria-label="Limited HR onboarding access help">
                                    <InfoOutlined fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            )}

                            {isManager && (
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Checkbox
                                  size="small"
                                  checked={Boolean(e.can_manage_shifts)}
                                  onChange={(ev) =>
                                    handleSupervisorAccessToggle(e.id, ev.target.checked)
                                  }
                                />
                                <Typography variant="body2">Supervisor access</Typography>
                                <Tooltip
                                  title="Shift & availability tools: Shift Management, Time Tracking, Fraud/Anomalies, Leaves, Swap Approvals, Master Calendar. Includes Booking Checkout access when enabled."
                                  placement="top"
                                >
                                  <IconButton size="small" aria-label="Supervisor access help">
                                    <InfoOutlined fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            )}

                            {isManager && (
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Checkbox
                                  size="small"
                                  checked={Boolean(e.can_collect_payments_self)}
                                  onChange={(ev) =>
                                    handlePaymentSelfToggle(e.id, ev.target.checked)
                                  }
                                />
                                <Typography variant="body2">Collect payments (self only)</Typography>
                                <Tooltip
                                  title="Allow this employee to collect payments for their own bookings only."
                                  placement="top"
                                >
                                  <IconButton size="small" aria-label="Collect payments access help">
                                    <InfoOutlined fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            )}

                            {isManager && (
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Checkbox
                                  size="small"
                                  checked={Boolean(e.can_manage_payroll)}
                                  onChange={(ev) =>
                                    handlePayrollAccessToggle(e.id, ev.target.checked)
                                  }
                                />
                                <Typography variant="body2">Payroll access</Typography>
                                <Tooltip
                                  title="Advanced Payroll tools: Payroll, Saved Payrolls, Tax, ROE, T4, W2, Invoices."
                                  placement="top"
                                >
                                  <IconButton size="small" aria-label="Payroll access help">
                                    <InfoOutlined fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            )}

                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              spacing={1}
                              mt={2}
                            >
                              {isManager && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleResetPassword(e.id)}
                                  startIcon={<RestartAltIcon />}
                                  fullWidth={isMobileViewport}
                                >
                                  Reset Password
                                </Button>
                              )}
                              {isManager && (
                                <Button
                                  size="small"
                                  color="warning"
                                  variant="outlined"
                                  startIcon={<ArchiveIcon />}
                                  onClick={() => setConfirmArchiveId(e.id)}
                                  fullWidth={isMobileViewport}
                                  disabled={e.status === "inactive"}
                                >
                                  Archive
                                </Button>
                              )}
                              {isManager && e.status === "inactive" && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleRestore(e.id)}
                                  fullWidth={isMobileViewport}
                                >
                                  Restore
                                </Button>
                              )}
                              {isManager && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => navigate(`/recruiter-stats/${e.id}`)}
                                  fullWidth={isMobileViewport}
                                >
                                  View Stats
                                </Button>
                              )}
                            </Stack>
                          </AccordionDetails>
                        </Accordion>
                      </Grid>
                    ))}
                </Grid>
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
            <Snackbar
              open={Boolean(message || error)}
              autoHideDuration={5000}
              onClose={() => {
                setMessage("");
                setError("");
              }}
              anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
              <Alert
                onClose={() => {
                  setMessage("");
                  setError("");
                }}
                severity={error ? "error" : "success"}
                variant="filled"
                sx={{ width: "100%" }}
              >
                {error || message}
              </Alert>
            </Snackbar>
            <EmployeeManagementHelpDrawer
              open={employeeHelpOpen}
              onClose={() => setEmployeeHelpOpen(false)}
            />
          </Box>
        );

      case "advanced-management":
        return <SecondNewManagementDashboard token={token} />;

      case "booking-checkout":
        return <BookingCheckoutPanel token={token} currentUserInfo={currentUserInfo} />;

      case "payments-hub":
        return (
          <ManagementFrame>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={700}>
                Payments & Refunds
              </Typography>
              <Button variant="outlined" onClick={() => setSelectedView("booking-checkout")}>
                Back to Booking Checkout
              </Button>
            </Stack>
            <ManagerPaymentsView />
          </ManagementFrame>
        );

      // Other dashboard sections render here
      case "overview":
        return (
          <ManagementFrame>
            {billingStatus && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mb: 2.5,
                  borderRadius: 2,
                  border: (t) => `1px solid ${t.palette.divider}`,
                  backgroundColor: (t) => t.palette.background.paper,
                }}
              >
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center" justifyContent="space-between">
                  <Stack spacing={0.5}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Seats
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active staff: {billingStatus.active_staff_count ?? 0} · Included: {billingStatus.seats_included ?? 0} ·
                      Addon: {billingStatus.seats_addon_qty ?? 0} · Allowed: {billingStatus.seats_allowed ?? 0}
                    </Typography>
                  </Stack>
                  <Button variant="outlined" size="small" onClick={handleBillingPortal} disabled={billingPortalLoading}>
                    {billingPortalLoading ? "Opening..." : "Manage Billing"}
                  </Button>
                </Stack>
              </Paper>
            )}
            <Overview token={token} />

            <Typography variant="h6" sx={{ mt: 3, mb: 1.5, fontWeight: 700 }}>
              Quick Links
            </Typography>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1}
              flexWrap="wrap"
              sx={{ mb: 2 }}
            >
              <Button
                variant="contained"
                onClick={() => setSelectedView("website-pages")}
                fullWidth={isMobileViewport}
              >
                {t("manager.menu.websitePages")}
              </Button>
              {[
                { label: "Team Activity", key: "team-activity" },
                { label: "Master Calendar", key: "master-calendar" },
                { label: "Candidate Funnel", key: "candidate-funnel" },
                { label: "Recruiter Performance", key: "recruiter-performance" },
                { label: "Candidate Search", key: "candidate-search" },
                { label: "Feedback & Notes", key: "feedback-notes" },
                { label: "Recruiter Availability", key: "recruiter-availability" },
                { label: "Recent Bookings", key: "recent-bookings" },
              ].map((item) => (
                <Button
                  key={item.key}
                  variant="outlined"
                  onClick={() => setSelectedView(item.key)}
                  fullWidth={isMobileViewport}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>

            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Compare Employees
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormControl fullWidth>
                  <InputLabel>Select Employees</InputLabel>
                  <Select
                    multiple
                    value={selectedForComparison}
                    onChange={(e) => setSelectedForComparison(e.target.value)}
                    label="Select Employees"
                  >
                    {(filteredEmployees || []).map((e) => (
                      <MenuItem key={e.id} value={e.id}>
                        {e.first_name} {e.last_name} ({e.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }} mt={2}>
                  <TextField
                    select
                    label="Time Range (days)"
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    size="small"
                    sx={{ width: { xs: "100%", md: 200 } }}
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

      case "time-tracking":
        return (
          <ManagementFrame
            title="Time Tracking"
            subtitle="Approve employee punches and keep payroll-ready records."
            fullWidth
            contentSx={{
              p: { xs: 1.5, md: 2.5 },
            }}
          >
            <TimeEntriesPanel />
          </ManagementFrame>
        );

      case "time-tracking-fraud":
        return (
          <ManagementFrame
            title="Fraud / Anomalies"
            subtitle="Detect new devices, new locations, multi-IP, and off-trusted-network clock-ins."
            fullWidth
            contentSx={{
              p: { xs: 1.5, md: 2.5 },
            }}
          >
            <FraudAnomaliesPanel />
          </ManagementFrame>
        );

      case "shift-monitoring":
        return (
          <ManagementFrame
            title="Shift Monitoring"
            subtitle="Coming soon"
          >
            <Paper
              sx={{
                p: 4,
                borderRadius: 3,
                border: "1px dashed",
                borderColor: "divider",
                bgcolor: "action.hover",
                textAlign: "center",
              }}
              elevation={0}
            >
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                Coming soon
              </Typography>
              <Typography color="text.secondary">
                We&apos;re finalizing the new monitoring view. Check back soon.
              </Typography>
            </Paper>
          </ManagementFrame>
        );

      case "team":
        return (
          <ManagementFrame
            title={null}
            subtitle={null}
            fullWidth
            sx={{ mt: { xs: -15, md: -15 } }}
            contentSx={{
              p: { xs: 1.5, md: 2.5 },
            }}
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

      case "job-openings":
        return <ManagerJobOpeningsPage token={token} />;

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
          <ManagementFrame>
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
        return <EmployeeProfileForm token={token} isManager={isManager} />;
      case "add-member":
        return (
          <ManagementFrame
            title="Add Team Member"
            subtitle="Create employee or manager profiles with immediate portal access. Strong passwords and consent are required for enterprise compliance."
          >
            <AddRecruiter />
          </ManagementFrame>
        );

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

      case "payroll-raw":
        return <PayrollRawPage />;

      case "payroll-audit":
        return <PayrollAuditPage />;

      case "invoices":
        return <ManagerInvoicesPage />;

      case "zapier":
        return <ZapierIntegrationPage />;

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

      case "candidate-profile":
        return <ClientProfileSettings />;

      default:
        return <Overview token={token} />;
    }
  };

  const drawerContent = (
    <>
      <Toolbar
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: drawerExpanded ? "flex-end" : "center",
          px: 1,
          py: 1,
          minHeight: 56,
        }}
      >
        {!isMobileViewport && (
          <IconButton onClick={() => setIsDrawerOpen((prev) => !prev)} size="small">
            <MenuIcon />
          </IconButton>
        )}
      </Toolbar>
      <Divider />
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", height: "100%", overflowY: "auto", pt: 0.75 }}>
        <List>
          {menuItems.map((item) => {
            const hasChildren = Array.isArray(item.children) && item.children.length > 0;
            if (!hasChildren) {
              return (
                <Tooltip key={item.key} title={!drawerExpanded ? item.label : ""} placement="right" arrow>
                  <ListItemButton
                    selected={selectedView === item.key}
                    onClick={() => handleNavSelect(item.key)}
                    sx={{
                      justifyContent: drawerExpanded ? "flex-start" : "center",
                      px: 2,
                      "&:hover": { backgroundColor: (t) => t.palette.action.hover },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 36,
                        mr: drawerExpanded ? 2 : 0,
                        justifyContent: "center",
                        color: "text.secondary",
                        "& .MuiSvgIcon-root": { fontSize: 20 },
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {drawerExpanded && (
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{ sx: { whiteSpace: "nowrap", overflow: "visible" } }}
                        sx={{ pr: 1 }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              );
            }

            const isOpen = Boolean(openGroups[item.key]);
            return (
              <Box key={item.key}>
                <Tooltip title={!drawerExpanded ? item.label : ""} placement="right" arrow>
                  <ListItemButton
                    selected={selectedView === item.key || isOpen}
                    onClick={() => {
                      let defaultView = selectedView;
                      if (item.key === "employee-group") defaultView = "employee-management";
                      else if (item.key === "payroll-group") defaultView = "payroll";
                      else if (item.key === "shifts-group") defaultView = "available-slots";
                      else if (item.key === "overview") defaultView = "overview";
                      setSelectedView(defaultView);
                      setOpenGroups((prev) => ({ ...prev, [item.key]: !isOpen }));
                    }}
                    sx={{
                      justifyContent: "flex-start",
                      px: 2,
                      "&:hover": { backgroundColor: (t) => t.palette.action.hover },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 36,
                        mr: drawerExpanded ? 2 : 0,
                        justifyContent: "center",
                        color: "text.secondary",
                        "& .MuiSvgIcon-root": { fontSize: 20 },
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {drawerExpanded && (
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{ noWrap: true }}
                        sx={{ overflow: "hidden", pr: 1 }}
                      />
                    )}
                    {drawerExpanded && (
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
                        disabled={child.key === "shift-monitoring"}
                        onClick={() => {
                          if (child.key === "shift-monitoring") return;
                          const empKeys = ["emp-active", "emp-add", "emp-compare"];
                          const next = empKeys.includes(child.key) ? "employee-management" : child.key;
                          handleNavSelect(next);
                        }}
                        sx={{
                          pl: drawerExpanded ? 4 : 2,
                          "&:hover": { backgroundColor: (t) => t.palette.action.hover },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 36,
                            mr: drawerExpanded ? 2 : 0,
                            color: "text.secondary",
                            "& .MuiSvgIcon-root": { fontSize: 20 },
                          }}
                        >
                          {child.icon}
                        </ListItemIcon>
                        {drawerExpanded && (
                          <ListItemText
                            primary={
                              child.key === "shift-monitoring"
                                ? `${child.label} (Coming soon)`
                                : child.label
                            }
                            primaryTypographyProps={{ sx: { whiteSpace: "nowrap", overflow: "visible" } }}
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
    </>
  );

  if (sectionOnly) {
    return <Box sx={{ width: "100%" }}>{renderView()}</Box>;
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", width: "100%" }}>
      <CssBaseline />
      {isMobileViewport && (
        <IconButton
          color="inherit"
          onClick={toggleDrawer}
          size="large"
          sx={{
            position: "fixed",
            top: navOffset + 8,
            left: 12,
            zIndex: (theme) => theme.zIndex.drawer + 3,
            backgroundColor: (theme) => theme.palette.background.paper,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            boxShadow: 1,
          }}
        >
          <MenuIcon />
        </IconButton>
      )}
      <Box
        component="nav"
        sx={{ width: { lg: drawerWidthCurrent }, flexShrink: { lg: 0 } }}
        aria-label="manager navigation"
      >
          <Drawer
            variant="temporary"
            open={mobileDrawerOpen}
            onClose={toggleDrawer}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: "block", lg: "none" },
              "& .MuiDrawer-paper": {
                width: drawerWidth,
                boxSizing: "border-box",
                top: headerOffset,
                height: `calc(100vh - ${headerOffset}px)`,
              },
            }}
          >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          open
            sx={{
              display: { xs: "none", lg: "block" },
              width: drawerWidthCurrent,
              flexShrink: 0,
              whiteSpace: "nowrap",
              [`& .MuiDrawer-paper`]: {
                width: drawerWidthCurrent,
                overflowX: "hidden",
                transition: "width 0.3s",
                boxSizing: "border-box",
                top: headerOffset,
                height: `calc(100vh - ${headerOffset}px)`,
              },
            }}
          >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          backgroundColor: (theme) => theme.palette.background.default,
          minWidth: 0,
          width: "100%",
          maxWidth: "none",
          mt: `${headerOffset}px`,
        }}
      >
        {billingStatusError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {billingStatusError}
          </Alert>
        )}
        {selectedView !== "team" && <GlobalBillingBanner />}
        {renderView()}
      </Box>
    </Box>
  );
};

export default NewManagementDashboard;
