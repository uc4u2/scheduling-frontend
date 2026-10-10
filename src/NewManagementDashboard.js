// src/pages/NewManagementDashboard.js
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  GlobalStyles,
} from "@mui/material";
import ShiftSwapPanel from "./components/ShiftSwapPanel";

import { alpha, useTheme } from "@mui/material/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ArchiveIcon from "@mui/icons-material/Archive";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import {
  Dashboard,
  CalendarToday,
  People,
  EventNote,
  Assignment,
  AssignmentTurnedIn,
  Article,
  ReceiptLong,
  RequestQuoteOutlined,
  History,
  Settings,
  Api as ApiIcon,
  Business,
  Paid,
  Summarize,
  Calculate,
  HomeOutlined,
  FolderShared,
  EventAvailable,
  OpenInFull,
  CloseFullscreen,
  Inventory2Outlined,
  ShoppingCartOutlined,
  FactCheckOutlined,
  TrendingUp,
  PersonAddAlt as PersonAddAltIcon,
  InfoOutlined,
  HelpOutline as HelpOutlineIcon,
  PhotoCamera as PhotoCameraIcon,
  SwapHoriz as SwapHorizIcon,
  RocketLaunchOutlined,
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
import ManagerTicketsView from "./pages/sections/management/ManagerTicketsView";
import { OPEN_MANAGER_NAVIGATION_EVENT } from "./utils/managerNavigation";

// Sections imports
import Overview from "./pages/sections/Overview";
import MasterCalendar from "./pages/sections/MasterCalendar";
import SecondMasterCalendar from "./pages/sections/SecondMasterCalendar";

import Team from "./pages/sections/Team";
import TimeEntriesPanel from "./pages/sections/TimeEntriesPanel";
import FraudAnomaliesPanel from "./pages/sections/FraudAnomaliesPanel";
import PunchLocationsPanel from "./pages/sections/PunchLocationsPanel";
import LeaveRequests from "./pages/sections/LeaveRequests";
import Meetings from "./pages/sections/Meetings";
import Training from "./pages/sections/Training";
import Communications from "./pages/sections/Communications";
import FieldPhotos from "./pages/sections/FieldPhotos";
import DispatchTrackingPanel from "./pages/sections/management/DispatchTrackingPanel";
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
import OperationsLauncher from "./pages/sections/management/OperationsLauncher";
import ManagerClientsWorkspace from "./pages/sections/management/ManagerClientsWorkspace";
import ManagementFrame from "./components/ui/ManagementFrame";
import ManagerInvoicesPage from "./pages/sections/ManagerInvoicesPage";
import { getUserTimezone } from "./utils/timezone";
import {
  bookingCalendarDateKey,
  bookingsForCalendarDate,
  calendarDateKey,
  formatBookingCalendarTime,
  formatCalendarDateLabel,
  resolveBookingCalendarTimezone,
} from "./utils/bookingCheckout";
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
import EmployeeProfileAuditTimeline from "./pages/Payroll/EmployeeProfileAuditTimeline";
import MobileManagerHome from "./components/manager/MobileManagerHome";
import BusinessFinanceShell from "./pages/finance/BusinessFinanceShell";
import OwnershipTransferDialog from "./components/manager/OwnershipTransferDialog";

// NEW — FullCalendar for the Setmore-style panel
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import luxonPlugin from "@fullcalendar/luxon3";
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
  { labelKey: "manager.menu.jobPostings", key: "job-openings", icon: <Assignment /> },
  { labelKey: "manager.menu.recruiterPerformance", key: "recruiter-performance", icon: <History /> },
  { labelKey: "manager.menu.candidateSearch", key: "candidate-search", icon: <People /> },
  { labelKey: "manager.menu.feedbackNotes", key: "feedback-notes", icon: <Article /> },
  { labelKey: "manager.menu.recruiterAvailability", key: "recruiter-availability", icon: <CalendarToday /> },
  { labelKey: "manager.menu.recentBookings", key: "recent-bookings", icon: <History /> },
  { labelKey: "manager.menu.auditHistory", key: "audit", icon: <History /> },
  { labelKey: "manager.menu.attendanceCalendar", key: "attendance", icon: <CalendarToday /> },
  { labelKey: "manager.menu.candidateProfile", key: "candidate-profile", icon: <PersonAddAltIcon /> },
];


const menuConfig = [
  {
    label: "Operations Launcher",
    navLabel: "Operations Launcher",
    key: "operations-launcher",
    icon: <RocketLaunchOutlined />,
    tooltip: "Guided shortcuts for setup, bookings, finance, products, and website actions.",
  },
  {
    label: "Dispatch",
    navLabel: "Dispatch",
    key: "dispatch-tracking",
    icon: <History />,
    tooltip: "Live On my way trips, clustered map visibility, and dispatch activity logs.",
  },

  // Employee group (first)
  {
    labelKey: "manager.menu.employeeManagement",
    key: "employee-group",
    icon: <People />,
    tooltip: "Employee Management: team roster, profiles, roles, and access.",
    children: [
      { labelKey: "manager.menu.companyProfile", key: "CompanyProfile", icon: <Business /> },
      { labelKey: "manager.menu.employeeProfiles", key: "employee-profiles", icon: <FolderShared /> },
      { labelKey: "manager.menu.addMember", key: "add-member", icon: <PersonAddAltIcon /> },
      { labelKey: "manager.menu.teamMeetings", key: "meetings", icon: <EventAvailable /> },
      { labelKey: "manager.menu.training", key: "training", icon: <Assignment /> },
      { label: "Communications", key: "communications", icon: <Article /> },
      { label: "Field Photos", key: "field-photos", icon: <PhotoCameraIcon /> },
    ],
  },

  // Shifts & Availability (second)
  {
    labelKey: "manager.menu.shiftsAvailability",
    key: "shifts-group",
    icon: <CalendarToday />,
    children: [
      { labelKey: "manager.menu.shiftManagement", key: "team", icon: <People /> },
      { labelKey: "manager.menu.shiftMonitoring", key: "shift-monitoring", icon: <History /> },
      { labelKey: "manager.menu.timeTracking", key: "time-tracking", icon: <History /> },
      { labelKey: "manager.menu.fraudAnomalies", key: "time-tracking-fraud", icon: <History /> },
      { label: "Punch Locations", key: "time-tracking-locations", icon: <History /> },
      { labelKey: "manager.menu.leaves", key: "leaves", icon: <Assignment /> },
      { labelKey: "manager.menu.swapApprovals", key: "swap-approvals", icon: <Assignment /> },
    ],
  },

  // Advanced Payroll group
  {
    labelKey: "manager.menu.advancedPayroll",
    key: "payroll-group",
    icon: <Paid />,
    tooltip: "Payroll tools: payroll runs, taxes, ROE, T4/W2, and invoices.",
    children: [
      { labelKey: "manager.menu.payroll", key: "payroll", icon: <Paid /> },
      { labelKey: "manager.menu.savedPayrolls", key: "saved-payrolls", icon: <FolderShared /> },
      { labelKey: "manager.menu.tax", key: "Tax", icon: <Summarize /> },
      { labelKey: "manager.menu.roe", key: "roe", icon: <Article /> },
      { labelKey: "manager.menu.t4", key: "T4", icon: <ReceiptLong /> },
      { labelKey: "manager.menu.w2", key: "W2", icon: <ReceiptLong /> },
      { labelKey: "manager.menu.payrollRaw", key: "payroll-raw", icon: <ReceiptLong /> },
      { labelKey: "manager.menu.payrollAudit", key: "payroll-audit", icon: <History /> },
      { labelKey: "manager.menu.invoices", key: "invoices", icon: <ReceiptLong /> },
    ],
  },

  {
    labelKey: "manager.finance.groupLabel",
    key: "finance-group",
    icon: <ReceiptLong />,
    tooltipKey: "manager.finance.groupTooltip",
    children: [
      { labelKey: "manager.finance.tabs.overview", key: "finance-overview", icon: <Dashboard /> },
      { labelKey: "manager.finance.tabs.clients", key: "finance-clients", icon: <People /> },
      { labelKey: "manager.finance.tabs.quotes", key: "finance-quotes", icon: <ReceiptLong /> },
      { labelKey: "manager.finance.tabs.estimates", key: "finance-estimates", icon: <AssignmentTurnedIn /> },
      { labelKey: "manager.finance.tabs.workOrders", key: "finance-work-orders", icon: <Assignment /> },
      { labelKey: "manager.finance.tabs.fieldReports", key: "finance-field-reports", icon: <Article /> },
      { labelKey: "manager.finance.tabs.reviews", key: "finance-reviews", icon: <FactCheckOutlined /> },
      { labelKey: "manager.finance.tabs.invoices", key: "finance-invoices", icon: <RequestQuoteOutlined /> },
      { labelKey: "manager.finance.tabs.materialsSupplies", key: "finance-inventory", icon: <Inventory2Outlined /> },
      { labelKey: "manager.finance.tabs.expenses", key: "finance-expenses", icon: <Paid /> },
      { labelKey: "manager.finance.tabs.purchases", key: "finance-purchases", icon: <ShoppingCartOutlined /> },
      { labelKey: "manager.finance.tabs.vendors", key: "finance-vendors", icon: <Business /> },
      { labelKey: "manager.finance.tabs.profitability", key: "finance-profitability", icon: <TrendingUp /> },
      { labelKey: "manager.finance.tabs.reports", key: "finance-reports", icon: <Summarize /> },
      { labelKey: "manager.finance.tabs.taxSummary", key: "finance-tax-summary", icon: <Calculate /> },
      { labelKey: "manager.finance.tabs.monthEnd", key: "finance-month-end", icon: <EventNote /> },
    ],
  },

  {
    label: "Clients",
    key: "clients",
    icon: <People />,
    tooltip: "Client profiles: bookings, billing, notes, work orders, and activity.",
  },

  // Overview cluster near bottom
  {
    labelKey: "manager.menu.overview",
    key: "overview",
    icon: <Dashboard />,
    children: overviewChildrenConfig,
  },

  // Website & pages
  { labelKey: "manager.menu.websitePages", key: "website-pages", icon: <Article />, tooltip: "Website & Pages: site builder, pages, SEO, and publish." },

  // Support tickets
  { label: "Support Tickets", key: "tickets", icon: <HelpOutlineIcon /> },

  // Services & Bookings
  { labelKey: "manager.menu.servicesBookings", key: "advanced-management", icon: <Dashboard /> },

  // Booking checkout (calendar + payments)
  { labelKey: "manager.menu.bookingCheckout", key: "booking-checkout", icon: <CalendarToday /> },
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
export const BookingCheckoutPanel = ({ token, currentUserInfo }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [calendarView, setCalendarView] = useState("dayGridMonth");
  const [selectedDate, setSelectedDate] = useState(() => calendarDateKey());
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
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [availabilitySummary, setAvailabilitySummary] = useState(null);
  const [availabilityDialog, setAvailabilityDialog] = useState(null);
  const [availabilityStart, setAvailabilityStart] = useState("09:00");
  const [availabilityEnd, setAvailabilityEnd] = useState("17:00");
  const [availabilitySubmitting, setAvailabilitySubmitting] = useState(false);
  const calendarRef = useRef(null);
  const availabilityRequestRef = useRef(0);
  const availabilityMutationRef = useRef(0);
  const availabilityContextRef = useRef("");
  const selectedDayBookingsRef = useRef(null);
  const isManager = Boolean(currentUserInfo?.is_manager);
  const canManageShifts = Boolean(currentUserInfo?.can_manage_shifts);
  const canCollectPaymentsSelf = Boolean(currentUserInfo?.can_collect_payments_self);
  const isSelfOnly = canCollectPaymentsSelf && !isManager && !canManageShifts;
  const canManageAvailability = isManager || canManageShifts;
  const pillButtonSx = (active) => ({
    textTransform: "none",
    fontWeight: active ? 700 : 600,
    borderRadius: "6px",
    px: 2,
    border: "1px solid",
    borderColor: active
      ? alpha(theme.palette.primary.main, 0.45)
      : alpha(theme.palette.text.primary, 0.2),
    backgroundColor: active
      ? alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.32 : 0.14)
      : "transparent",
    color: active ? theme.palette.primary.main : theme.palette.text.primary,
    transition: "all 0.2s ease",
    "&:hover": {
      borderColor: alpha(theme.palette.primary.main, 0.4),
      backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.28 : 0.12),
    },
  });

  const statusColor = (status) => {
    const key = String(status || "").toLowerCase();
    if (key === "completed") return theme.palette.success.main;
    if (key === "no-show" || key === "no_show") return theme.palette.error.main;
    if (key === "cancelled") return theme.palette.grey[600];
    return theme.palette.info.main;
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

  const recruiterDisplayName = useCallback((recruiter) => {
    if (!recruiter) return "Employee";
    const fullName = [recruiter.first_name, recruiter.last_name].filter(Boolean).join(" ").trim();
    return recruiter.name || recruiter.full_name || fullName || recruiter.email || `Employee ${recruiter.id}`;
  }, []);

  const selectedRecruiterRecord = useMemo(
    () =>
      recruiters.find((row) => String(row.id) === String(selectedRecruiter)) ||
      (isSelfOnly && String(currentUserInfo?.id || "") === String(selectedRecruiter)
        ? currentUserInfo
        : null),
    [currentUserInfo, isSelfOnly, recruiters, selectedRecruiter]
  );
  const selectedRecruiterName = recruiterDisplayName(selectedRecruiterRecord);
  const calendarTimezone = resolveBookingCalendarTimezone(selectedRecruiterRecord);
  const calendarTimezoneLabel = selectedRecruiterRecord
    ? calendarTimezone
    : getUserTimezone();
  const selectedRecruiterTimezone = selectedRecruiterRecord ? calendarTimezone : "UTC";
  const availabilityContextKey = `${selectedRecruiter || "all"}|${selectedDate}`;

  const bookingQuery = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const requestedClientId = bookingQuery.get("clientId") || "";
  const requestedAppointmentId = bookingQuery.get("appointmentId") || "";
  const autoOpenedClientBookingRef = useRef("");
  const autoOpenedAppointmentRef = useRef("");

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const recruiterId = String(b?.recruiter?.id || b?.recruiter_id || "");
      if (isSelfOnly && recruiterId !== String(currentUserInfo?.id || "")) return false;
      if (selectedRecruiter && recruiterId !== String(selectedRecruiter)) return false;
      if (selectedDepartment) {
        const deptId = recruiterDeptById.get(recruiterId) || "";
        if (deptId !== String(selectedDepartment)) return false;
      }
      if (requestedClientId && String(b?.client?.id || b?.client_id || "") !== String(requestedClientId)) return false;
      return true;
    });
  }, [bookings, selectedRecruiter, selectedDepartment, recruiterDeptById, requestedClientId, isSelfOnly, currentUserInfo]);

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
      const baseColor = statusColor(b.status);
      const textColor = theme.palette.getContrastText(baseColor);
      return {
        id: String(b.id),
        title: serviceName,
        start,
        end: end || start,
        backgroundColor: baseColor,
        borderColor: baseColor,
        textColor,
        extendedProps: {
          clientName,
          serviceName,
          bookingMode: b?.service?.booking_mode || b?.booking_mode || "one_to_one",
          startTime: b?.local_start_time,
          endTime: b?.local_end_time,
          localDate: b?.local_date,
        },
      };
    })
    .filter(Boolean);

  const selectedDayBookings = useMemo(
    () => bookingsForCalendarDate(filteredBookings, selectedDate, calendarTimezone),
    [calendarTimezone, filteredBookings, selectedDate]
  );

  const activeFilterSummary = useMemo(() => {
    if (isSelfOnly) return `Your bookings • Timezone: ${calendarTimezoneLabel}`;
    const department = departments.find(
      (row) => String(row.id) === String(selectedDepartment)
    );
    const recruiter = recruiters.find((row) => String(row.id) === String(selectedRecruiter));
    return [
      department?.name || "All departments",
      recruiter ? recruiterDisplayName(recruiter) : "All employees",
      calendarView === "timeGridDay" ? "Day view" : calendarView === "timeGridWeek" ? "Week view" : "Month view",
      `Timezone: ${calendarTimezoneLabel}`,
    ].join(" • ");
  }, [calendarTimezoneLabel, calendarView, departments, isSelfOnly, recruiterDisplayName, recruiters, selectedDepartment, selectedRecruiter]);

  useEffect(() => {
    if (!selectedRecruiter || !selectedDepartment) return;
    if (recruiterDeptById.get(String(selectedRecruiter)) !== String(selectedDepartment)) {
      setSelectedRecruiter("");
    }
  }, [recruiterDeptById, selectedDepartment, selectedRecruiter]);

  useEffect(() => {
    availabilityContextRef.current = availabilityContextKey;
    availabilityRequestRef.current += 1;
    setAvailabilitySummary(null);
    setAvailabilityError("");
    setAvailabilityLoading(false);
    setAvailabilityDialog((current) =>
      current && current.contextKey !== availabilityContextKey ? null : current
    );
  }, [availabilityContextKey]);

  const loadAvailabilitySummary = useCallback(async () => {
    if (!canManageAvailability || !selectedRecruiter) {
      setAvailabilitySummary(null);
      setAvailabilityError("");
      setAvailabilityLoading(false);
      return;
    }
    const requestId = ++availabilityRequestRef.current;
    const requestedContext = availabilityContextKey;
    setAvailabilityLoading(true);
    setAvailabilityError("");
    try {
      const { data } = await api.get("/manager/calendar", {
        params: { recruiter_id: Number(selectedRecruiter), view: "fragments" },
      });
      if (
        requestId !== availabilityRequestRef.current ||
        availabilityContextRef.current !== requestedContext
      ) return;
      const events = Array.isArray(data?.events) ? data.events : [];
      const dayEvents = events.filter(
        (event) =>
          String(event.recruiter_id) === String(selectedRecruiter) &&
          String(event.date || "") === selectedDate
      );
      setAvailabilitySummary({
        available: dayEvents.filter((event) => !event.booked).length,
        booked: dayEvents.filter((event) => Boolean(event.booked)).length,
      });
    } catch (err) {
      if (
        requestId !== availabilityRequestRef.current ||
        availabilityContextRef.current !== requestedContext
      ) return;
      setAvailabilitySummary(null);
      setAvailabilityError(err?.response?.data?.error || "Failed to load availability.");
    } finally {
      if (
        requestId === availabilityRequestRef.current &&
        availabilityContextRef.current === requestedContext
      ) {
        setAvailabilityLoading(false);
      }
    }
  }, [availabilityContextKey, canManageAvailability, selectedDate, selectedRecruiter]);

  useEffect(() => {
    if (!canManageAvailability || !selectedRecruiter) return;
    loadAvailabilitySummary();
  }, [canManageAvailability, loadAvailabilitySummary, selectedRecruiter]);

  const openAvailabilityDialog = (kind) => {
    if (!canManageAvailability || !selectedRecruiterRecord) return;
    setAvailabilityDialog({
      kind,
      contextKey: availabilityContextKey,
      recruiterId: Number(selectedRecruiterRecord.id),
      employeeName: selectedRecruiterName,
      date: selectedDate,
      timezone: selectedRecruiterTimezone,
    });
  };

  const submitAvailabilityMutation = async () => {
    if (!availabilityDialog || availabilitySubmitting) return;
    if (
      availabilityDialog.kind === "keep-range" &&
      (!availabilityStart || !availabilityEnd || availabilityEnd <= availabilityStart)
    ) {
      setSnackbar({
        open: true,
        message: "End time must be later than start time.",
        severity: "error",
      });
      return;
    }
    const submittedContext = { ...availabilityDialog };
    const responseGuard = ++availabilityMutationRef.current;
    setAvailabilitySubmitting(true);
    try {
      const keepRange = submittedContext.kind === "keep-range";
      const payload = {
        recruiter_id: submittedContext.recruiterId,
        date: submittedContext.date,
        ...(keepRange
          ? { start_time: availabilityStart, end_time: availabilityEnd }
          : {}),
      };
      const { data } = await api.post(
        keepRange
          ? "/api/manager/availability/keep-range"
          : "/api/manager/availability/close-day",
        payload
      );
      if (
        responseGuard !== availabilityMutationRef.current ||
        availabilityContextRef.current !== submittedContext.contextKey
      ) return;
      const deleted = Number(data?.deleted || 0);
      const skippedBooked = Number(data?.skipped_booked || 0);
      setAvailabilityDialog(null);
      setSnackbar({
        open: true,
        message: `${deleted} free slot${deleted === 1 ? "" : "s"} removed; ${skippedBooked} booked slot${skippedBooked === 1 ? "" : "s"} preserved.`,
        severity: "success",
      });
      await Promise.all([loadBookings(), loadAvailabilitySummary()]);
    } catch (err) {
      if (
        responseGuard !== availabilityMutationRef.current ||
        availabilityContextRef.current !== submittedContext.contextKey
      ) return;
      setSnackbar({
        open: true,
        message: err?.response?.data?.error || "Failed to update availability.",
        severity: "error",
      });
    } finally {
      if (responseGuard === availabilityMutationRef.current) {
        setAvailabilitySubmitting(false);
      }
    }
  };

  const renderBookingEvent = (eventInfo) => {
    const { event, timeText, view } = eventInfo;
    const props = event.extendedProps || {};
    const showTime = timeText || (props.startTime && props.endTime ? `${props.startTime} - ${props.endTime}` : "");
    const isMonth = view?.type === "dayGridMonth";
    const label = isMonth
      ? `${showTime ? `${showTime} • ` : ""}${props.serviceName || event.title}`
      : `${showTime ? `${showTime} • ` : ""}${props.serviceName || event.title} • ${props.clientName || ""}`;
    const modeBadge = props.bookingMode === "group" ? " • Group" : "";
    const textColor = event.textColor || theme.palette.text.primary;
    return (
      <Tooltip title={`${label}${modeBadge}`} arrow placement="top">
        <Box
          sx={{
            px: 0.5,
            py: 0.25,
            fontSize: isMonth ? "0.7rem" : "0.75rem",
            fontWeight: 600,
            lineHeight: 1.2,
            color: textColor,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {label}
          {modeBadge}
        </Box>
      </Tooltip>
    );
  };

  const openBookingDetails = useCallback((booking) => {
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
  }, []);

  const handleEventClick = (info) => {
    const booking = filteredBookings.find((b) => String(b.id) === String(info.event.id));
    if (!booking) return;
    const bookingDate = bookingCalendarDateKey(booking, calendarTimezone);
    setSelectedDate(bookingDate);
    if (isSmall) {
      info.jsEvent?.preventDefault?.();
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          selectedDayBookingsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });
      return;
    }
    openBookingDetails(booking);
  };

  const selectDateAndShowBookings = useCallback((dateKey) => {
    if (!dateKey) return;
    setSelectedDate(dateKey);
    if (!isSmall) return;
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        selectedDayBookingsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }, [isSmall]);

  useEffect(() => {
    if (!requestedAppointmentId || !filteredBookings.length) return;
    if (autoOpenedAppointmentRef.current === String(requestedAppointmentId)) return;
    const booking = filteredBookings.find((row) => String(row.id) === String(requestedAppointmentId));
    if (!booking) return;
    autoOpenedAppointmentRef.current = String(requestedAppointmentId);
    const bookingDate = bookingCalendarDateKey(booking, calendarTimezone);
    if (bookingDate) {
      setSelectedDate(bookingDate);
      calendarRef.current?.getApi()?.gotoDate(bookingDate);
    }
    openBookingDetails(booking);
  }, [calendarTimezone, requestedAppointmentId, filteredBookings, openBookingDetails]);

  useEffect(() => {
    if (!requestedClientId || requestedAppointmentId || !filteredBookings.length) return;
    if (autoOpenedClientBookingRef.current === String(requestedClientId)) return;
    const booking = [...filteredBookings].sort((a, b) => {
      const aStart = String(a?.start_iso_local || `${a?.local_date || ""}T${a?.local_start_time || ""}`);
      const bStart = String(b?.start_iso_local || `${b?.local_date || ""}T${b?.local_start_time || ""}`);
      return aStart.localeCompare(bStart);
    })[0];
    if (!booking) return;
    autoOpenedClientBookingRef.current = String(requestedClientId);
    const bookingDate = bookingCalendarDateKey(booking, calendarTimezone);
    if (bookingDate) {
      setSelectedDate(bookingDate);
      calendarRef.current?.getApi()?.gotoDate(bookingDate);
    }
    openBookingDetails(booking);
  }, [calendarTimezone, requestedClientId, requestedAppointmentId, filteredBookings, openBookingDetails]);

  const handleCalendarViewChange = (_, nextView) => {
    if (!nextView) return;
    setCalendarView(nextView);
    calendarRef.current?.getApi()?.changeView(nextView);
  };

  const handleToday = () => {
    const today = calendarDateKey(new Date(), calendarTimezone);
    setSelectedDate(today);
    calendarRef.current?.getApi()?.gotoDate(today);
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

  const calendarVars = {
    "--fc-button-text-color": theme.palette.text.primary,
    "--fc-button-bg-color": theme.palette.background.paper,
    "--fc-button-border-color": theme.palette.divider,
    "--fc-button-hover-bg-color": alpha(theme.palette.primary.main, 0.08),
    "--fc-button-active-bg-color": alpha(theme.palette.primary.main, 0.16),
    "--fc-event-text-color": theme.palette.text.primary,
    "--fc-more-link-text-color": theme.palette.text.primary,
    "--fc-today-bg-color": alpha(theme.palette.warning.main, 0.15),
    "--fc-border-color": theme.palette.divider,
  };

  return (
    <ManagementFrame>
      <GlobalStyles
        styles={{
          ".booking-checkout-calendar": {
            ...calendarVars,
          },
          ".booking-checkout-calendar .fc .fc-toolbar-title": {
            color: theme.palette.text.primary,
            fontWeight: 700,
          },
          ".booking-checkout-calendar .fc .fc-button": {
            borderRadius: theme.shape.borderRadius,
            textTransform: "none",
            minHeight: 40,
          },
          ".booking-checkout-calendar .fc .fc-button-primary:not(:disabled)": {
            color: theme.palette.text.primary,
          },
          ".booking-checkout-calendar .fc .fc-event": {
            boxShadow: `0 6px 16px ${alpha(theme.palette.common.black, 0.12)}`,
          },
          ".booking-checkout-calendar .fc .fc-daygrid-day-number": {
            color: theme.palette.text.primary,
          },
          ".booking-checkout-calendar .fc .fc-daygrid-day.fc-day-today": {
            backgroundColor: alpha(theme.palette.warning.main, 0.12),
          },
          ".booking-checkout-calendar .fc .fc-more-link": {
            color: theme.palette.text.primary,
            fontWeight: 600,
          },
          ".booking-checkout-calendar .fc .booking-selected-day": {
            backgroundColor: `${alpha(theme.palette.primary.main, 0.13)} !important`,
            boxShadow: `inset 0 0 0 2px ${alpha(theme.palette.primary.main, 0.55)}`,
          },
          "@media (max-width: 600px)": {
            ".booking-checkout-calendar": {
              width: "100%",
              maxWidth: "100%",
              overflow: "hidden",
            },
            ".booking-checkout-calendar .fc, .booking-checkout-calendar .fc-view-harness, .booking-checkout-calendar .fc-scrollgrid": {
              maxWidth: "100%",
            },
            ".booking-checkout-calendar .fc-scrollgrid-sync-table": {
              width: "100% !important",
              tableLayout: "fixed",
            },
            ".booking-checkout-calendar .fc .fc-toolbar": {
              alignItems: "stretch",
              gap: 8,
              flexWrap: "wrap",
            },
            ".booking-checkout-calendar .fc .fc-toolbar-chunk:nth-of-type(2)": {
              width: "100%",
              order: -1,
            },
            ".booking-checkout-calendar .fc .fc-toolbar-title": {
              fontSize: "1.15rem",
              textAlign: "center",
            },
            ".booking-checkout-calendar .fc .fc-daygrid-day-frame": {
              minHeight: 68,
            },
            ".booking-checkout-calendar .fc .fc-daygrid-day-number": {
              padding: 6,
            },
            ".booking-checkout-calendar .fc .fc-event": {
              minHeight: 24,
              boxShadow: "none",
            },
          },
        }}
      />
      <Stack spacing={{ xs: 1.5, sm: 2 }} sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: "1.25rem", sm: undefined } }}>
              Booking Checkout Calendar
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
              Click a booking to mark it completed and collect payment.
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
              {calendarTimezoneLabel}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="outlined"
              size="small"
              onClick={loadBookings}
              disabled={loading}
              sx={pillButtonSx(false)}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </Stack>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}
        {requestedClientId ? (
          <Alert severity="info">
            Client filter active. This checkout calendar is showing bookings for one client only.
            {requestedAppointmentId ? " The requested appointment is auto-opened when available." : " The earliest booking for this client is opened automatically when available."}
          </Alert>
        ) : null}

        <Accordion
          defaultExpanded={false}
          disableGutters
          sx={{
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            "&::before": { display: "none" },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="booking-checkout-filter-options"
            id="booking-checkout-filter-options-header"
            sx={{ px: { xs: 1.5, sm: 2 }, minWidth: 0, "& .MuiAccordionSummary-content": { minWidth: 0, overflow: "hidden" } }}
          >
            <Box sx={{ minWidth: 0, overflow: "hidden" }}>
              <Typography fontWeight={700} noWrap>Filters &amp; calendar options</Typography>
              <Typography variant="body2" color="text.secondary" noWrap sx={{ display: { xs: "none", sm: "block" } }}>
                {activeFilterSummary}
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails id="booking-checkout-filter-options">
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
                      {recruiters
                        .filter((rec) => !selectedDepartment || String(rec.department_id || "") === String(selectedDepartment))
                        .map((rec) => (
                          <MenuItem key={rec.id} value={String(rec.id)}>
                            {recruiterDisplayName(rec)}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </>
              )}
              <ToggleButtonGroup
                value={calendarView}
                exclusive
                onChange={handleCalendarViewChange}
                size="small"
                aria-label="Calendar view"
                sx={{
                  ml: { md: "auto" },
                  "& .MuiToggleButton-root": pillButtonSx(false),
                  "& .MuiToggleButton-root.Mui-selected": pillButtonSx(true),
                }}
              >
                <ToggleButton value="timeGridDay">Day</ToggleButton>
                <ToggleButton value="timeGridWeek">Week</ToggleButton>
                <ToggleButton value="dayGridMonth">Month</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Paper
          className="booking-checkout-calendar"
          sx={{
            p: { xs: 1, sm: 2 },
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            overflow: "hidden",
          }}
        >
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, luxonPlugin]}
            timeZone={calendarTimezone}
            initialView={calendarView}
            initialDate={selectedDate}
            events={events}
            height={isSmall ? "auto" : 700}
            headerToolbar={{
              left: "prev,next selectToday",
              center: "title",
              right: "",
            }}
            customButtons={{
              selectToday: {
                text: "Today",
                click: handleToday,
              },
            }}
            dateClick={(info) => selectDateAndShowBookings(info.dateStr.slice(0, 10))}
            dayCellClassNames={(info) =>
              calendarDateKey(info.date, calendarTimezone) === selectedDate
                ? ["booking-selected-day"]
                : []
            }
            eventClick={handleEventClick}
            moreLinkClick={isSmall ? (info) => {
              info.jsEvent?.preventDefault?.();
              selectDateAndShowBookings(calendarDateKey(info.date, calendarTimezone));
            } : "popover"}
            eventContent={renderBookingEvent}
            eventDisplay="block"
            nowIndicator
          />
        </Paper>

        <Paper
          ref={selectedDayBookingsRef}
          component="section"
          aria-labelledby="selected-day-bookings-title"
          sx={{
            p: { xs: 1.5, sm: 2 },
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            scrollMarginTop: 72,
          }}
        >
          <Stack direction={{ xs: "column", sm: "row" }} gap={1} alignItems={{ sm: "center" }} mb={2}>
            <Box>
              <Typography id="selected-day-bookings-title" variant="h6" fontWeight={700}>
                Bookings for {formatCalendarDateLabel(selectedDate, undefined, calendarTimezone)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedDayBookings.length} booking{selectedDayBookings.length === 1 ? "" : "s"}
              </Typography>
            </Box>
          </Stack>

          {loading && !bookings.length ? (
            <Typography color="text.secondary">Loading bookings…</Typography>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : !selectedDayBookings.length ? (
            <Box sx={{ py: 3, textAlign: "center" }}>
              <Typography fontWeight={600}>No bookings for this day</Typography>
              <Typography variant="body2" color="text.secondary">
                Choose another date or adjust the booking filters.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1}>
              {selectedDayBookings.map((booking) => {
                const bookingStatus = String(booking.status || "booked").replaceAll("_", " ");
                const paymentStatus = String(booking.payment_status || "unpaid").replaceAll("_", " ");
                const cancelled = String(booking.status || "").toLowerCase() === "cancelled";
                return (
                  <Paper
                    key={booking.id}
                    component="button"
                    type="button"
                    onClick={() => openBookingDetails(booking)}
                    variant="outlined"
                    sx={{
                      width: "100%",
                      p: 1.5,
                      textAlign: "left",
                      cursor: "pointer",
                      borderColor: alpha(statusColor(booking.status), 0.4),
                      backgroundColor: cancelled
                        ? alpha(theme.palette.action.disabled, 0.05)
                        : theme.palette.background.paper,
                      opacity: cancelled ? 0.75 : 1,
                      color: "text.primary",
                      font: "inherit",
                      "&:hover, &:focus-visible": {
                        borderColor: theme.palette.primary.main,
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        outline: `2px solid ${alpha(theme.palette.primary.main, 0.25)}`,
                        outlineOffset: 1,
                      },
                    }}
                  >
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignItems={{ sm: "center" }}>
                      <Box sx={{ minWidth: { sm: 130 } }}>
                        <Typography fontWeight={800}>{formatBookingCalendarTime(booking, undefined, calendarTimezone)}</Typography>
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography fontWeight={700} noWrap>{booking?.service?.name || "Service"}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {booking?.client?.full_name || booking?.client?.email || "Client"} • {booking?.recruiter?.full_name || "Provider"}
                        </Typography>
                      </Box>
                      <Stack direction="row" gap={0.75} flexWrap="wrap">
                        <Chip size="small" label={bookingStatus} sx={{ textTransform: "capitalize" }} />
                        <Chip
                          size="small"
                          label={paymentStatus}
                          color={String(booking.payment_status || "").toLowerCase() === "paid" ? "success" : "default"}
                          sx={{ textTransform: "capitalize" }}
                        />
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Paper>

        {canManageAvailability ? (
          <Paper
            component="section"
            aria-labelledby="selected-day-availability-title"
            sx={{
              p: { xs: 1.5, sm: 2 },
              borderRadius: 1,
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.5}
              alignItems={{ md: "center" }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography id="selected-day-availability-title" variant="h6" fontWeight={700}>
                  Availability for {formatCalendarDateLabel(selectedDate, undefined, calendarTimezone)}
                </Typography>
                {selectedRecruiterRecord ? (
                  <Typography variant="body2" color="text.secondary">
                    {selectedRecruiterName} • {selectedRecruiterTimezone}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Select one employee in Filters &amp; calendar options to manage availability.
                  </Typography>
                )}
              </Box>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button
                  variant="outlined"
                  onClick={() => openAvailabilityDialog("keep-range")}
                  disabled={!selectedRecruiterRecord || availabilitySubmitting}
                >
                  Edit Available Window
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => openAvailabilityDialog("close-day")}
                  disabled={!selectedRecruiterRecord || availabilitySubmitting}
                >
                  Close Day
                </Button>
                <Button
                  variant="text"
                  onClick={loadAvailabilitySummary}
                  disabled={!selectedRecruiterRecord || availabilityLoading || availabilitySubmitting}
                >
                  {availabilityLoading ? "Refreshing…" : "Refresh availability"}
                </Button>
              </Stack>
            </Stack>

            {!selectedRecruiterRecord ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                Availability cannot be changed for All Employees. Choose a single employee first.
              </Alert>
            ) : (
              <Stack spacing={1} mt={2}>
                {availabilityError ? <Alert severity="error">{availabilityError}</Alert> : null}
                {availabilitySummary ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip
                      label={`${availabilitySummary.available} available fragment${availabilitySummary.available === 1 ? "" : "s"}`}
                      color="success"
                      variant="outlined"
                    />
                    <Chip
                      label={`${availabilitySummary.booked} booked fragment${availabilitySummary.booked === 1 ? "" : "s"}`}
                      variant="outlined"
                    />
                  </Stack>
                ) : availabilityLoading ? (
                  <Typography variant="body2" color="text.secondary">Loading availability…</Typography>
                ) : null}
                <Typography variant="caption" color="text.secondary">
                  Individual slot editing and deletion remain in Advanced Management.
                </Typography>
              </Stack>
            )}
          </Paper>
        ) : null}
      </Stack>

      <Dialog
        open={Boolean(availabilityDialog)}
        onClose={() => !availabilitySubmitting && setAvailabilityDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {availabilityDialog?.kind === "close-day" ? "Close availability for this day?" : "Edit available window"}
        </DialogTitle>
        <DialogContent dividers>
          {availabilityDialog ? (
            <Stack spacing={2}>
              <Alert severity="info">
                {availabilityDialog.employeeName} • {formatCalendarDateLabel(availabilityDialog.date, undefined, availabilityDialog.timezone)} • {availabilityDialog.timezone}
              </Alert>
              {availabilityDialog.kind === "keep-range" ? (
                <>
                  <Typography variant="body2">
                    This retains existing free slots whose employee-local start falls within the selected range. It does not create, extend, or reopen availability. Existing bookings are preserved.
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label="Start time"
                      type="time"
                      value={availabilityStart}
                      onChange={(event) => setAvailabilityStart(event.target.value)}
                      inputProps={{ step: 300 }}
                      fullWidth
                      disabled={availabilitySubmitting}
                    />
                    <TextField
                      label="End time"
                      type="time"
                      value={availabilityEnd}
                      onChange={(event) => setAvailabilityEnd(event.target.value)}
                      inputProps={{ step: 300 }}
                      fullWidth
                      disabled={availabilitySubmitting}
                    />
                  </Stack>
                </>
              ) : (
                <Alert severity="warning">
                  Close Day removes free availability for this employee-local day. Existing bookings are not cancelled. Attendance, payroll, refunds, and shifts are unchanged.
                </Alert>
              )}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAvailabilityDialog(null)} disabled={availabilitySubmitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={availabilityDialog?.kind === "close-day" ? "error" : "primary"}
            onClick={submitAvailabilityMutation}
            disabled={availabilitySubmitting}
          >
            {availabilitySubmitting
              ? "Updating…"
              : availabilityDialog?.kind === "close-day"
              ? "Close Day"
              : "Keep This Window"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth fullScreen={isSmall}>
        <DialogTitle sx={{ py: { xs: 1.25, sm: 2 }, px: { xs: 2, sm: 3 } }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography component="span" variant="h6">Collect Payment</Typography>
            {isSmall ? (
              <IconButton onClick={() => setDetailsOpen(false)} aria-label="Close payment details" edge="end">
                <CloseIcon />
              </IconButton>
            ) : null}
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
          {selected ? (
            <Stack spacing={{ xs: 2, sm: 3 }}>
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
                    sx={{
                      width: { xs: "100%", sm: "auto" },
                      "& .MuiToggleButton-root": {
                        flex: { xs: 1, sm: "initial" },
                        minWidth: 0,
                        px: { xs: 0.5, sm: 1.5 },
                        fontSize: { xs: "0.74rem", sm: "0.8125rem" },
                      },
                    }}
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
                <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center" mt={2}>
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
                  <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 } }}>
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
                      <Typography variant="caption" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
                        Tip: Stripe won’t add tax automatically for saved-card charges. Include tax in the total if needed.
                      </Typography>
                      <Stack spacing={0.5} sx={{ display: { xs: "none", sm: "flex" } }}>
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

                  <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 } }}>
                    <Stack spacing={1}>
                      <Typography fontWeight={600}>Payment link (invoice)</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
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

                  <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 } }}>
                    <Stack spacing={1}>
                      <Typography fontWeight={600}>Pay on this device</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
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

                  <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 } }}>
                    <Stack spacing={1}>
                      <Typography fontWeight={600}>Mark as paid (offline)</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
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
        <DialogActions sx={{ display: { xs: "none", sm: "flex" }, px: { xs: 2, sm: 3 }, py: { xs: 1, sm: 2 } }}>
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

const NewManagementDashboard = ({
  token,
  initialView,
  sectionOnly = false,
  supportMode = false,
  supportCapabilities = [],
}) => {
  const theme = useTheme();
  const isRtl = theme.direction === "rtl";
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const tManager = (key, fallback) => t(key, { defaultValue: fallback });
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
    if (canManageShifts || canManageOnboarding || canManagePayroll) allowedGroups.add("shifts-group");
    if (canManagePayroll) allowedGroups.add("payroll-group");
    if (canManagePayroll) allowedGroups.add("finance-group");
    if (canManagePayroll || canManageShifts) allowedGroups.add("dispatch-tracking");
    const base = menuConfig
      .filter((item) => allowedGroups.has(item.key))
      .map((item) => {
        if (item.key === "employee-group") {
          return {
            ...item,
            children: (item.children || []).filter((child) => child.key === "employee-profiles"),
          };
        }
        if (item.key === "shifts-group" && !isManager) {
          const children = item.children || [];
          if (!canManageShifts) {
            return {
              ...item,
              children: children.filter((child) => child.key === "leaves"),
            };
          }
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
  }, [isManager, hasHrAccess, canManageOnboarding, canManageShifts, canCollectPaymentsSelf, canManagePayroll]);

  const menuItems = useMemo(
    () =>
      filteredMenuConfig.map((item) => {
        const mappedItem = {
          ...item,
          label: item.labelKey ? t(item.labelKey) : item.label || "",
          navLabel: item.labelKey ? t(item.labelKey) : item.navLabel || item.label || "",
          tooltip: item.tooltipKey ? t(item.tooltipKey) : item.tooltip || "",
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
    if (supportMode) {
      return ["website-pages", "advanced-management"];
    }
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
    // Allow the mobile manager home landing route.
    keys.add("__landing__");
    // Allow shift/availability views that are launched from the group header.
    keys.add("available-slots");
    keys.add("available-shifts");
    keys.add("available-shifts-fullscreen");
    // Allow direct Business Finance section routing inside the grouped shell.
    [
      "finance-overview",
      "finance-clients",
      "finance-group-daily",
      "finance-group-field",
      "finance-group-reports",
      "finance-group-setup",
      "finance-quotes",
      "finance-estimates",
      "finance-invoices",
      "finance-work-orders",
      "finance-inventory",
      "finance-vendors",
      "finance-purchases",
      "finance-field-reports",
      "finance-reviews",
      "finance-profitability",
      "finance-tax-summary",
      "finance-expenses",
      "finance-reports",
      "finance-month-end",
    ].forEach((key) => keys.add(key));
    return Array.from(keys);
  }, [filteredMenuConfig, supportMode]);
  const getInitialSelectedView = () => initialView || localStorage.getItem("manager_selected_view") || "__landing__";
  const getParentGroupKeyForView = (viewKey) =>
    menuItems.find((item) => Array.isArray(item.children) && item.children.some((child) => child.key === viewKey))?.key;

  // Sidebar state
  const [selectedView, setSelectedView] = useState(getInitialSelectedView);
  const [timeTrackingViewNonce, setTimeTrackingViewNonce] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(() => !isRtl);
  const [overviewOpen, setOverviewOpen] = useState(false); // legacy for overview; kept for compatibility
  const [openGroups, setOpenGroups] = useState(() => {
    const parentKey = getParentGroupKeyForView(getInitialSelectedView());
    return parentKey ? { [parentKey]: true } : {};
  });
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
  const [permissionAuditEmployee, setPermissionAuditEmployee] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmArchiveId, setConfirmArchiveId] = useState(null);
  const [ownershipTransferTarget, setOwnershipTransferTarget] = useState(null);
  const [ownershipTransferPassword, setOwnershipTransferPassword] = useState("");
  const [ownershipTransferConfirmation, setOwnershipTransferConfirmation] = useState("");
  const [ownershipTransferError, setOwnershipTransferError] = useState("");
  const [ownershipTransferSaving, setOwnershipTransferSaving] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [statsError, setStatsError] = useState("");
  const [timeRange, setTimeRange] = useState("14");
  const [billingStatus, setBillingStatus] = useState(null);
  const [billingStatusError, setBillingStatusError] = useState("");
  const [billingPortalLoading, setBillingPortalLoading] = useState(false);
  const isMobileViewport = useMediaQuery(theme.breakpoints.down("lg"));
  const navOffset = useMediaQuery(theme.breakpoints.down("sm")) ? 56 : 64; // height of global nav bar
  const managerBarHeight = 0; // manager navigation now opens from the shared mobile toolbar
  const headerOffset = navOffset + managerBarHeight;
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const drawerExpanded = isMobileViewport ? true : isDrawerOpen;
  const drawerWidthCurrent = drawerExpanded ? drawerWidth : collapsedWidth;
  const previousSelectedViewRef = useRef(selectedView);

  useEffect(() => {
    if (!isMobileViewport) return undefined;
    const openManagerNavigation = () => setMobileDrawerOpen(true);
    window.addEventListener(OPEN_MANAGER_NAVIGATION_EVENT, openManagerNavigation);
    return () => window.removeEventListener(OPEN_MANAGER_NAVIGATION_EVENT, openManagerNavigation);
  }, [isMobileViewport]);

  useEffect(() => {
    localStorage.setItem("manager_selected_view", selectedView);
  }, [selectedView]);

  useEffect(() => {
    if (selectedView === "time-tracking" && previousSelectedViewRef.current !== "time-tracking") {
      setTimeTrackingViewNonce((prev) => prev + 1);
    }
    previousSelectedViewRef.current = selectedView;
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
    if (supportMode) return;
    if (isManager && !isMobileViewport && selectedView === "__landing__") {
      setSelectedView("employee-management");
    }
  }, [isManager, isMobileViewport, selectedView, supportMode]);

  useEffect(() => {
    if (supportMode) return;
    if (!isManager || !isMobileViewport) return;
    if (initialView) return;
    if (location.pathname !== "/manager/dashboard") return;
    if (selectedView !== "__landing__") {
      setSelectedView("__landing__");
    }
  }, [initialView, isManager, isMobileViewport, location.pathname, selectedView, supportMode]);

  useEffect(() => {
    if (initialView && initialView !== selectedView) {
      setSelectedView(initialView);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialView]);

  useLayoutEffect(() => {
    const parentGroup = menuItems.find((item) =>
      Array.isArray(item.children) && item.children.some((child) => child.key === selectedView)
    );
    if (parentGroup) {
      setOpenGroups((prev) => (prev[parentGroup.key] && Object.keys(prev).length === 1 ? prev : { [parentGroup.key]: true }));
    } else if (!Array.isArray(menuItems.find((item) => item.key === selectedView)?.children)) {
      setOpenGroups((prev) => (Object.keys(prev).length ? {} : prev));
    }
  }, [menuItems, selectedView]);

  useEffect(() => {
    if (supportMode) return;
    if (isManager) return;
    if (!allowedViewKeys.length) return;
    if (!allowedViewKeys.includes(selectedView)) {
      setSelectedView(allowedViewKeys[0]);
    }
  }, [isManager, allowedViewKeys, selectedView, supportMode]);

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
    if (token && selectedView === "employee-management") {
      fetchDepartments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedView]);

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

  const closeOwnershipTransferDialog = () => {
    if (ownershipTransferSaving) return;
    setOwnershipTransferTarget(null);
    setOwnershipTransferPassword("");
    setOwnershipTransferConfirmation("");
    setOwnershipTransferError("");
  };

  const handleTransferOwnership = async () => {
    if (
      !ownershipTransferTarget?.id ||
      !ownershipTransferPassword ||
      ownershipTransferConfirmation !== "TRANSFER"
    ) {
      return;
    }
    setOwnershipTransferSaving(true);
    setOwnershipTransferError("");
    try {
      await api.post("/manager/ownership/transfer", {
        target_manager_id: ownershipTransferTarget.id,
        confirmation: ownershipTransferConfirmation,
        current_password: ownershipTransferPassword,
      });
      const [currentUserResult] = await Promise.allSettled([
        api.get("/auth/me"),
        fetchEmployees(),
      ]);
      if (currentUserResult.status === "fulfilled") {
        setCurrentUserInfo(currentUserResult.value.data || null);
      } else {
        setCurrentUserInfo((previous) =>
          previous ? { ...previous, is_primary: false } : previous
        );
      }
      setOwnershipTransferTarget(null);
      setOwnershipTransferPassword("");
      setOwnershipTransferConfirmation("");
      setMessage("Primary ownership transferred successfully.");
    } catch (err) {
      setOwnershipTransferError(
        err?.response?.data?.error ||
          "Ownership transfer failed. Confirm the manager is active and has completed account setup."
      );
    } finally {
      setOwnershipTransferSaving(false);
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
    const reason = window.prompt(t("manager.employeeManagement.rejectPrompt")) || "";
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
    // Website & Pages is a dashboard workspace, not the legacy AutoSiteBuilder
    // deep link. Keep the manager in the suite so it can choose Manager,
    // Editor, Templates, Builder, or SEO before opening a tool.
    if (viewKey === "website-pages") return "/manager/dashboard?view=website-pages";
    return `/manager/${viewKey}`;
  };

  const handleNavSelect = (viewKey) => {
    if (viewKey === "billing") {
      navigate("/manager/settings?tab=billing");
      setSelectedView("settings");
      setOpenGroups({});
      if (isMobileViewport) {
        setMobileDrawerOpen(false);
      }
      return;
    }
    setSelectedView(viewKey);
    const parentGroup = menuItems.find((item) =>
      Array.isArray(item.children) && item.children.some((child) => child.key === viewKey)
    );
    setOpenGroups((prev) => {
      if (parentGroup) {
        return prev[parentGroup.key] && Object.keys(prev).length === 1 ? prev : { [parentGroup.key]: true };
      }
      return Object.keys(prev).length ? {} : prev;
    });
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
        if (isManager && isMobileViewport) {
          return (
            <MobileManagerHome
              currentUserInfo={currentUserInfo}
              swapRequests={swapRequests}
              allowedViewKeys={allowedViewKeys}
              onOpenView={handleNavSelect}
              onEmployeeView={() => navigate("/employee/my-time")}
              canUseEmployeeView={isManager}
            />
          );
        }
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
                {tManager("manager.employeeManagement.title", "Employee Management")}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<HelpOutlineIcon />}
                onClick={() => setEmployeeHelpOpen(true)}
              >
                {tManager("manager.employeeManagement.help", "Help")}
              </Button>
            </Stack>
            {isManager && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mb: 2,
                  borderRadius: 1,
                  border: (theme) => `1px dashed ${theme.palette.divider}`,
                  backgroundColor: (theme) => theme.palette.background.default,
                }}
              >
                <Typography fontWeight={600} gutterBottom>
                  {tManager(
                    "manager.employeeManagement.addMemberTitle",
                    "Need to add a new team member?"
                  )}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {tManager(
                    "manager.employeeManagement.addMemberDesc",
                    "Use the dedicated Add Member workspace for the full onboarding form (address, department, payroll, compliance consent)."
                  )}
                </Typography>
                <Button
                  sx={{ mt: 2 }}
                  variant="contained"
                  onClick={() => navigate("/manager/add-member")}
                  startIcon={<PersonAddAltIcon />}
                >
                  {tManager(
                    "manager.employeeManagement.addMemberCta",
                    "Launch Add Member"
                  )}
                </Button>
              </Paper>
            )}

            {isManager && (
              <Accordion defaultExpanded sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" sx={headerStyle}>
                    {tManager(
                      "manager.employeeManagement.pendingTitle",
                      "Pending Employee Conversions"
                    )}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {conversionLoading ? (
                    <Typography color="text.secondary">
                      {tManager(
                        "manager.employeeManagement.pendingLoading",
                        "Loading..."
                      )}
                    </Typography>
                  ) : conversionRequests.length === 0 ? (
                    <Typography color="text.secondary">
                      {tManager(
                        "manager.employeeManagement.pendingEmpty",
                        "No pending conversion requests."
                      )}
                    </Typography>
                  ) : (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>
                            {tManager(
                              "manager.employeeManagement.table.candidate",
                              "Candidate"
                            )}
                          </TableCell>
                          <TableCell>
                            {tManager(
                              "manager.employeeManagement.table.email",
                              "Email"
                            )}
                          </TableCell>
                          <TableCell>
                            {tManager(
                              "manager.employeeManagement.table.requested",
                              "Requested"
                            )}
                          </TableCell>
                          <TableCell>
                            {tManager(
                              "manager.employeeManagement.table.actions",
                              "Actions"
                            )}
                          </TableCell>
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
                                  {tManager("manager.employeeManagement.approve", "Approve")}
                                </Button>
                                <Button size="small" variant="outlined" color="warning" onClick={() => handleRejectConversion(req.id)}>
                                  {tManager("manager.employeeManagement.reject", "Reject")}
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
                  {tManager("manager.employeeManagement.activeEmployees", "Active Employees")}
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
                    <InputLabel>
                      {tManager("manager.employeeManagement.department", "Department")}
                    </InputLabel>
                    <Select
                      label={tManager("manager.employeeManagement.department", "Department")}
                      value={departmentFilter}
                      onChange={(e) => {
                        setDepartmentFilter(e.target.value);
                        setSelectedForComparison([]);
                      }}
                    >
                      <MenuItem value="">
                        {tManager("manager.employeeManagement.allDepartments", "All Departments")}
                      </MenuItem>
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
                    {tManager("manager.employeeManagement.clearFilter", "Clear filter")}
                  </Button>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={includeArchivedEmployees}
                        onChange={(e) => setIncludeArchivedEmployees(e.target.checked)}
                      />
                    }
                    label={tManager("manager.employeeManagement.showArchived", "Show archived employees")}
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
                            borderRadius: 1,
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
                                {currentUserInfo?.is_primary &&
                                  e.is_manager &&
                                  e.account_setup_complete &&
                                  !e.is_primary &&
                                  String(currentUserInfo.id) !== String(e.id) &&
                                  String(e.status || "active").toLowerCase() === "active" && (
                                    <Button
                                      size="small"
                                      color="warning"
                                      variant="outlined"
                                      onClick={() => {
                                        setOwnershipTransferTarget(e);
                                        setOwnershipTransferPassword("");
                                        setOwnershipTransferConfirmation("");
                                        setOwnershipTransferError("");
                                      }}
                                    >
                                      Transfer primary ownership
                                    </Button>
                                  )}
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
                                  title="Full HR access: employee profiles, onboarding documents, candidate profile edits, Leave Settings, leave balance adjustments, Leave Reports, and accrual preview/posting. Does not grant payroll runs, catalog settings, or carryover apply."
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
                                  title="Limited HR access: HR tabs and read-only candidate profiles only. No employee profile edits, Leave Settings, Leave Reports, balance adjustments, accrual posting, or carryover apply."
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
                                  title="Supervisor access: operational scheduling, time tracking, fraud/anomaly review, swap approvals, master calendar, leave approve/reject/cancel, and company-wide Booking Checkout. Use this for a trusted lead who may need to charge for any staff member's customer. No Leave Settings, Leave Reports, balance adjustments, accrual posting, or carryover apply."
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
                                  title="Allow this employee to use Booking Checkout for their own bookings only. This is for charging their own customers, not the whole team. It does not grant payroll, leave settings, reports, or company-wide checkout access."
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
                                  title="Payroll access: payroll runs, saved payrolls, tax forms, ROE, T4/W-2, payroll invoices, plus the full Business Finance workspace. It also includes Leave Reports, leave balance corrections, accrual posting, and carryover apply. Does not grant Leave Settings or leave approval."
                                  placement="top"
                                >
                                  <IconButton size="small" aria-label="Payroll access help">
                                    <InfoOutlined fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            )}

                            {isManager && (
                              <Button
                                size="small"
                                variant="text"
                                sx={{ mt: 1, alignSelf: "flex-start", px: 0.5 }}
                                onClick={() => setPermissionAuditEmployee(e)}
                              >
                                Permission activity
                              </Button>
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
            <OwnershipTransferDialog
              open={Boolean(ownershipTransferTarget)}
              targetName={
                ownershipTransferTarget
                  ? `${ownershipTransferTarget.first_name || ""} ${ownershipTransferTarget.last_name || ""}`.trim()
                  : ""
              }
              currentPassword={ownershipTransferPassword}
              confirmation={ownershipTransferConfirmation}
              error={ownershipTransferError}
              saving={ownershipTransferSaving}
              onPasswordChange={setOwnershipTransferPassword}
              onConfirmationChange={setOwnershipTransferConfirmation}
              onClose={closeOwnershipTransferDialog}
              onConfirm={handleTransferOwnership}
            />
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
      <EmployeeProfileAuditTimeline
        employeeId={permissionAuditEmployee?.id || ""}
        open={Boolean(permissionAuditEmployee)}
        onClose={() => setPermissionAuditEmployee(null)}
        actionFilter="permissions_updated"
        title="Permission activity"
        subtitle="Permission and access changes for this employee only."
        infoText="This timeline shows who changed manager-facing access flags such as HR, supervisor, payroll, and payment permissions."
        emptyText="No permission changes have been logged for this employee yet."
      />
          </Box>
        );

      case "advanced-management":
        return (
          <SecondNewManagementDashboard
            token={token}
            supportMode={supportMode}
            supportCapabilities={supportCapabilities}
          />
        );

      case "operations-launcher":
        return <OperationsLauncher />;

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
                  borderRadius: 1,
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
                color="secondary"
                onClick={() => setSelectedView("operations-launcher")}
                fullWidth={isMobileViewport}
              >
                Operations Launcher
              </Button>
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
            <TimeEntriesPanel key={`time-tracking-${timeTrackingViewNonce}`} />
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

      case "time-tracking-locations":
        return (
          <ManagementFrame
            title="Punch Locations"
            subtitle="Review advisory on-punch location evidence without blocking employee time logging."
            fullWidth
            contentSx={{
              p: { xs: 1.5, md: 2.5 },
            }}
          >
            <PunchLocationsPanel />
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
                borderRadius: 1,
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

      case "training":
        return <Training token={token} />;

      case "communications":
        return <Communications token={token} />;

      case "field-photos":
        return <FieldPhotos token={token} />;

      case "dispatch-tracking":
        return <DispatchTrackingPanel />;

      case "leaves":
        return <LeaveRequests token={token} currentUserInfo={currentUserInfo} />;

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

      case "tickets":
        return <ManagerTicketsView />;

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

      case "finance-overview":
      case "finance-clients":
      case "finance-group-daily":
      case "finance-group-field":
      case "finance-group-reports":
      case "finance-group-setup":
      case "finance-quotes":
      case "finance-estimates":
      case "finance-invoices":
      case "finance-work-orders":
      case "finance-inventory":
      case "finance-vendors":
      case "finance-purchases":
      case "finance-field-reports":
      case "finance-reviews":
      case "finance-profitability":
      case "finance-tax-summary":
      case "finance-expenses":
      case "finance-reports":
      case "finance-month-end":
        return <BusinessFinanceShell viewKey={effectiveView} onNavigate={handleNavSelect} />;

      case "clients":
        return <ManagerClientsWorkspace />;

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

  const navItemSx = (active = false, depth = 0) => ({
    position: "relative",
    justifyContent: drawerExpanded ? "flex-start" : "center",
    mx: isMobileViewport ? 0.75 : 1,
    my: isMobileViewport ? 0.2 : 0.35,
    px: drawerExpanded ? (isMobileViewport ? 1.25 : 1.5) : 1,
    pl: drawerExpanded ? (isMobileViewport ? 1.25 : 1.5) + depth * 1.5 : 1,
    minHeight: isMobileViewport ? 38 : 42,
    borderRadius: "6px",
    color: active ? "primary.main" : "text.primary",
    border: "1px solid",
    borderColor: active ? alpha(theme.palette.primary.main, 0.24) : "transparent",
    backgroundColor: active
      ? alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.18 : 0.09)
      : "transparent",
    boxShadow: active ? `0 10px 26px ${alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.18 : 0.1)}` : "none",
    transition: "background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease, color 160ms ease",
    "&:before": {
      content: active ? '""' : "none",
      position: "absolute",
      left: 0,
      top: 9,
      bottom: 9,
      width: 3,
      borderRadius: "0 8px 8px 0",
      backgroundColor: "primary.main",
    },
    "&:hover": {
      backgroundColor: active
        ? alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.22 : 0.12)
        : alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.12 : 0.055),
      borderColor: active ? alpha(theme.palette.primary.main, 0.3) : alpha(theme.palette.primary.main, 0.12),
    },
    "&.Mui-selected": {
      backgroundColor: active
        ? alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.18 : 0.09)
        : undefined,
      "&:hover": {
        backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.22 : 0.12),
      },
    },
  });

  const navIconSx = (active = false) => ({
    minWidth: isMobileViewport ? 32 : 36,
    mr: drawerExpanded ? (isMobileViewport ? 1.25 : 1.5) : 0,
    justifyContent: "center",
    color: active ? "primary.main" : "text.secondary",
    "& .MuiSvgIcon-root": { fontSize: isMobileViewport ? 18 : 20 },
  });

  const drawerPaperSx = {
    boxSizing: "border-box",
    top: headerOffset,
    height: `calc(100vh - ${headerOffset}px)`,
    borderRight: "1px solid",
    borderColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.2 : 0.1),
    backgroundColor: theme.palette.background.paper,
    backgroundImage: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.12 : 0.045)} 0%, ${alpha(theme.palette.background.paper, 0.995)} 20%, ${theme.palette.background.paper} 100%)`,
    backdropFilter: "none",
    opacity: 1,
    boxShadow: `0 22px 54px ${alpha(theme.palette.common.black, theme.palette.mode === "dark" ? 0.42 : 0.16)}`,
  };

  const drawerContent = (
    <>
      <Toolbar
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: drawerExpanded ? "flex-end" : "center",
          px: 1,
          py: isMobileViewport ? 0.5 : 1,
          minHeight: isMobileViewport ? 48 : 56,
        }}
      >
        {!isMobileViewport && (
          <IconButton onClick={() => setIsDrawerOpen((prev) => !prev)} size="small">
            <MenuIcon />
          </IconButton>
        )}
      </Toolbar>
      <Divider sx={{ borderColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.18 : 0.1) }} />
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", height: "100%", overflowY: "auto", pt: 0.75 }}>
        <List>
          {isMobileViewport && isManager && (
            <ListItemButton
              selected={selectedView === "__landing__"}
              onClick={() => handleNavSelect("__landing__")}
              sx={navItemSx(selectedView === "__landing__")}
            >
              <ListItemIcon sx={navIconSx(selectedView === "__landing__")}>
                <HomeOutlined />
              </ListItemIcon>
              {drawerExpanded && (
                <ListItemText
                  primary="Manager Home"
                  primaryTypographyProps={{ sx: { whiteSpace: "nowrap", overflow: "visible" } }}
                  sx={{ pr: 1 }}
                />
              )}
            </ListItemButton>
          )}
          {menuItems.map((item) => {
            const hasChildren = Array.isArray(item.children) && item.children.length > 0;
            const itemActive = selectedView === item.key;
            if (!hasChildren) {
              return (
                <Tooltip
                  key={item.key}
                  title={item.tooltip || item.label}
                  placement="right"
                  arrow
                >
                  <ListItemButton
                    selected={itemActive}
                    onClick={() => handleNavSelect(item.key)}
                    sx={navItemSx(itemActive)}
                  >
                    <ListItemIcon sx={navIconSx(itemActive)}>
                      {item.icon}
                    </ListItemIcon>
                    {drawerExpanded && (
                      <ListItemText
                        primary={item.navLabel || item.label}
                        primaryTypographyProps={{ sx: { whiteSpace: "nowrap", overflow: "visible" } }}
                        sx={{ pr: 1 }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              );
            }

            const isOpen = Boolean(openGroups[item.key]);
            const groupActive = selectedView === item.key || isOpen || item.children.some((child) => child.key === selectedView);
            return (
              <Box key={item.key}>
                <Tooltip title={item.tooltip || item.label} placement="right" arrow>
                  <ListItemButton
                    selected={groupActive}
                    onClick={() => {
                      let defaultView = selectedView;
                      if (item.key === "employee-group") defaultView = "employee-management";
                      else if (item.key === "payroll-group") defaultView = "payroll";
                      else if (item.key === "shifts-group") defaultView = "available-slots";
                      else if (item.key === "overview") defaultView = "overview";
                      setSelectedView(defaultView);
                      setOpenGroups({ [item.key]: !isOpen });
                    }}
                    sx={navItemSx(groupActive)}
                  >
                    <ListItemIcon sx={navIconSx(groupActive)}>
                      {item.icon}
                    </ListItemIcon>
                    {drawerExpanded && (
                      <ListItemText
                        primary={item.navLabel || item.label}
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
                        onClick={(event) => {
                          event.stopPropagation();
                          if (child.key === "shift-monitoring") return;
                          const empKeys = ["emp-active", "emp-add", "emp-compare"];
                          const next = empKeys.includes(child.key) ? "employee-management" : child.key;
                          handleNavSelect(next);
                        }}
                        sx={navItemSx(selectedView === child.key, 1)}
                      >
                        <ListItemIcon sx={navIconSx(selectedView === child.key)}>
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
      <Box
        component="nav"
        sx={{ width: { lg: drawerWidthCurrent }, flexShrink: { lg: 0 } }}
        aria-label="manager navigation"
      >
          <Drawer
            variant="temporary"
            open={mobileDrawerOpen}
            onClose={toggleDrawer}
            ModalProps={{
              keepMounted: true,
              BackdropProps: {
                sx: {
                  backgroundColor: alpha(theme.palette.common.black, theme.palette.mode === "dark" ? 0.58 : 0.28),
                  backdropFilter: "blur(2px)",
                },
              },
            }}
            sx={{
              display: { xs: "block", lg: "none" },
              "& .MuiDrawer-paper": {
                ...drawerPaperSx,
                width: drawerWidth,
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
                ...drawerPaperSx,
                width: drawerWidthCurrent,
                overflowX: "hidden",
                transition: "width 0.3s",
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
          p: { xs: 1.5, md: 3 },
          backgroundColor: (theme) => theme.palette.background.default,
          backgroundImage: (theme) =>
            theme.palette.mode === "dark"
              ? `radial-gradient(circle at top left, ${alpha(theme.palette.primary.main, 0.12)}, transparent 34%)`
              : `radial-gradient(circle at top left, ${alpha(theme.palette.primary.main, 0.08)}, transparent 34%), linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.025)}, transparent 260px)`,
          minWidth: 0,
          width: "100%",
          maxWidth: "none",
          mt: 0,
          overflowX: "hidden",
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
