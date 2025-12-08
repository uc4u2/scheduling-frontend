// src/pages/settings/ZapierIntegrationPage.jsx
import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Stack,
  IconButton,
  Tooltip,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import CodeIcon from "@mui/icons-material/Code";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ZapierApiKeysPanel from "../../components/zapier/ZapierApiKeysPanel";
import ZapierHooksPanel from "../../components/zapier/ZapierHooksPanel";
import ZapierHelpSection from "../../components/zapier/ZapierHelpSection";

const eventExamples = [
  {
    key: "booking.created",
    label: "When a new booking is created",
    payload: {
      event: "booking.created",
      booking: {
        id: 123,
        status: "booked",
        source: "zapier_action",
        service_id: 1,
        service_name: "Consultation",
        recruiter_id: 45,
        recruiter_name: "Jane Host",
        client_email: "client@example.com",
        start: "2025-12-10T14:00:00",
        end: "2025-12-10T15:00:00",
        meeting_link: "https://meet.jit.si/...",
        price: 99,
        timezone: "America/New_York",
        branch_id: 2,
        department_id: 3,
      },
    },
  },
  {
    key: "public_booking.created",
    label: 'When a public "book with me" link is used',
    payload: {
      event: "public_booking.created",
      channel: "public_link",
      booking: {
        id: 321,
        status: "booked",
        source: "public_link",
        recruiter_id: 45,
        client_email: "guest@example.com",
        start: "2025-12-11T09:00:00",
      },
      links: {
        jitsi: "https://meet.jit.si/...",
        cancel: "https://schedulaa.com/cancel-booking?token=...",
        reschedule: "https://schedulaa.com/reschedule?token=...",
      },
    },
  },
  {
    key: "booking.cancelled",
    label: "When a booking is cancelled",
    payload: {
      event: "booking.cancelled",
      booking: {
        id: 123,
        status: "cancelled",
        recruiter_id: 45,
        client_email: "client@example.com",
      },
      reason: "manager",
    },
  },
  {
    key: "booking.updated",
    label: "When a booking is rescheduled/updated",
    payload: {
      event: "booking.updated",
      booking: {
        id: 123,
        start: "2025-12-10T16:00:00",
        end: "2025-12-10T17:00:00",
      },
      changed: { start_time: "16:00", end_time: "17:00" },
      previous_start: "2025-12-10T14:00:00",
      previous_end: "2025-12-10T15:00:00",
    },
  },
  {
    key: "booking.no_show",
    label: "When a client is marked as no-show",
    payload: {
      event: "booking.no_show",
      booking: {
        id: 123,
        recruiter_id: 45,
        client_email: "client@example.com",
      },
      reason: "manager_marked",
    },
  },
  {
    key: "leave.approved",
    label: "When a leave request is approved",
    payload: {
      event: "leave.approved",
      leave: {
        id: 555,
        recruiter_id: 45,
        leave_type: "vacation",
        start_date: "2025-12-20",
        end_date: "2025-12-24",
        status: "approved",
      },
    },
  },
  {
    key: "swap.requested",
    label: "When a shift swap is requested",
    payload: {
      event: "swap.requested",
      swap: {
        id: 900,
        status: "pending",
        requester_id: 45,
        from_shift: {
          id: 1,
          date: "2025-12-10",
          recruiter_id: 45,
        },
        target_shift: {
          id: 2,
          date: "2025-12-10",
          recruiter_id: 46,
        },
        message: "Can we swap?",
      },
    },
  },
  {
    key: "timeclock.clock_in",
    label: "When a staff member clocks in",
    payload: {
      event: "timeclock.clock_in",
      shift: {
        id: 77,
        recruiter_id: 45,
        date: "2025-12-10",
        clock_in: "2025-12-10T13:59:00Z",
        scheduled_start: "2025-12-10T14:00:00",
      },
      anomalies: { device_new: false, location_new: false },
    },
  },
  {
    key: "break.missed",
    label: "When a break is missed/short",
    payload: {
      event: "break.missed",
      shift: { id: 77, recruiter_id: 45, date: "2025-12-10" },
      break: { minutes: 5 },
      expected_minutes: 15,
      actual_minutes: 5,
    },
  },
  {
    key: "break.enforced",
    label: "When a break is auto-ended",
    payload: {
      event: "break.enforced",
      shift: { id: 77, recruiter_id: 45, date: "2025-12-10" },
      break: { end: "2025-12-10T18:05:00Z", minutes: 15 },
      expected_minutes: 15,
      actual_minutes: 15,
      reason: "auto_end",
    },
  },
  {
    key: "payroll.finalized",
    label: "When payroll is finalized/exported",
    payload: {
      event: "payroll.finalized",
      payroll: {
        id: 333,
        period_start: "2025-12-01",
        period_end: "2025-12-15",
        recruiter_id: 45,
        gross_pay: 2400,
        net_pay: 1800,
      },
      export: {
        provider: "xero",
        external_id: "MJ-123",
        export_log_id: 888,
      },
    },
  },
  {
    key: "shift.published",
    label: "When a shift is published",
    payload: {
      event: "shift.published",
      shift: {
        id: 501,
        recruiter_id: 45,
        date: "2025-12-12",
        start_time: "09:00:00",
        end_time: "17:00:00",
        branch_id: 2,
        department_id: 3,
        status: "scheduled",
      },
    },
  },
  {
    key: "shift.updated",
    label: "When a shift is updated",
    payload: {
      event: "shift.updated",
      shift: {
        id: 501,
        recruiter_id: 45,
        date: "2025-12-12",
        start_time: "10:00:00",
        end_time: "18:00:00",
        status: "scheduled",
      },
    },
  },
  {
    key: "payroll.details",
    label: "When payroll details (per employee) are ready",
    payload: {
      event: "payroll.details",
      payroll: {
        id: 333,
        period_start: "2025-12-01",
        period_end: "2025-12-15",
        month: "2025-12",
      },
      rows: [
        {
          employee_id: 45,
          employee_name: "Jane Doe",
          region: "Downtown",
          department: "Front desk",
          rate: 20.0,
          hours: 80,
          regular_hours: 72,
          ot_hours: 8,
          regular_pay: 1440,
          ot_pay: 240,
          holiday_pay: 0,
          bonus: 50,
          commission: 120,
          gross: 1850,
          vacation: 40,
          fed_tax: 180,
          prov_tax: 120,
          cpp_qpp: 75,
          ei_rqap: 30,
          total_deductions: 445,
          net_pay: 1405,
        },
      ],
    },
  },
];

const actionExamples = [
  {
    key: "create_booking",
    label: "Create booking in Schedulaa",
    payload: {
      service_id: 1,
      recruiter_id: 45,
      client_first_name: "Jane",
      client_last_name: "Doe",
      client_email: "jane@example.com",
      date: "2025-12-10",
      start_time: "14:00",
      end_time: "15:00",
      notes: "Lead from external form",
      meeting_link: "https://meet.jit.si/...",
      price: 99.0,
    },
  },
  {
    key: "create_employee",
    label: "Create employee",
    payload: {
      first_name: "Ava",
      last_name: "Nguyen",
      email: "ava@schedulaa-demo.com",
      role: "employee",
      department_id: 3,
      branch_id: 2,
      timezone: "America/New_York",
    },
  },
  {
    key: "create_shift",
    label: "Create shift",
    payload: {
      recruiter_id: 45,
      date: "2025-12-12",
      start_time: "09:00",
      end_time: "17:00",
      branch_id: 2,
      department_id: 3,
      break_policy: {
        mode: "fixed",
        length_minutes: 30,
        start_time: "12:00",
        end_time: "12:30",
      },
    },
  },
  {
    key: "update_shift",
    label: "Update shift",
    payload: {
      date: "2025-12-12",
      start_time: "10:00",
      end_time: "18:00",
      branch_id: 4,
      department_id: 3,
      break_policy: {
        mode: "window",
        window_start: "12:00",
        window_end: "14:00",
        length_minutes: 30,
      },
    },
  },
  {
    key: "attach_document",
    label: "Attach document to employee",
    payload: {
      name: "Employment Contract",
      file_url: "https://example.com/signed.pdf",
      provider: "signwell",
      provider_envelope_id: "env_123",
      provider_document_id: "doc_123",
      signed_at: "2025-12-07T12:00:00Z",
    },
  },
];

const featureLibrary = {
  triggers: [
    {
      title: "New bookings & changes",
      key: "booking.created / booking.cancelled / booking.updated / booking.no_show / public_booking.created",
      description:
        'Whenever a client books, cancels, reschedules, doesn’t show up, or uses a public “book with me” link, Schedulaa can send that event into Zapier so you can notify staff, log to Sheets, or push to CRM.',
      useCases: [
        "Notify staff in Slack/Teams",
        "Log new clients/bookings to CRM",
        "Track bookings/cancellations in Sheets",
      ],
      steps: [
        "In Zapier: Create a Zap with Webhooks by Zapier → Catch Hook. Copy the Hook URL.",
        "In Schedulaa: Settings → Zapier → Event hooks. Paste the URL. Choose an event (e.g., booking.created, booking.cancelled, booking.no_show, public_booking.created). Add hook.",
        "In Zapier: Add Actions, e.g., Slack → Send Channel Message; Google Sheets → Create Spreadsheet Row; HubSpot/Zoho/Salesforce → Create/Update Contact.",
        "Result: Every booking event triggers your workflow (notify team, update CRM, keep reporting sheet in sync).",
      ],
      apps: "Slack, Microsoft Teams, Google Sheets, HubSpot, Zoho CRM, Salesforce, Gmail",
    },
    {
      title: "Timeclock events",
      key: "timeclock.clock_in / timeclock.clock_out",
      description:
        "Each time a staff member clocks in or out, Schedulaa can send a timeclock event to Zapier so you can build your own timesheet, lateness report, or feed hours into another system.",
      useCases: [
        "Build custom timesheets",
        "Track lateness vs scheduled start",
        "Feed hours into payroll or BI",
      ],
      steps: [
        "In Zapier: Create a Zap with Webhooks → Catch Hook. Copy the Hook URL.",
        'In Schedulaa: Settings → Zapier → Event hooks. Paste the URL. Select “When a staff member clocks in” (timeclock.clock_in). Add hook. Optionally add another for timeclock.clock_out.',
        "In Zapier: Add Actions, e.g., Google Sheets → Create Spreadsheet Row with employee, date, times, anomalies; or Webhooks → POST to your API/payroll engine.",
        "Result: Every clock-in/out shows up in your sheet or external system for analysis and payroll prep.",
      ],
      apps: "Google Sheets, Excel Online, internal APIs, custom payroll systems, Power BI",
    },
    {
      title: "Break tracking",
      key: "break.started / break.ended / break.missed / break.enforced",
      description:
        "Track break starts, ends, missed or auto-ended breaks for compliance, alerts, or unpaid break calculations.",
      useCases: [
        "Compliance tracking and alerts",
        "Calculate unpaid break time externally",
        "Monitor repeated missed breaks",
      ],
      steps: [
        "In Zapier: Use Webhooks → Catch Hook and copy the Hook URL.",
        "In Schedulaa: Settings → Zapier → Event hooks. Add hooks for break.missed or break.enforced (or others), using the URL.",
        'In Zapier: Add actions like Slack → Send Message: “Anna missed her 15-minute break on [Date]”, or Sheets → Append Row for compliance.',
        "Result: Keep Schedulaa as the source of truth for break rules while monitoring patterns and generating compliance reports in external tools.",
      ],
      apps: "Slack, Teams, Google Sheets, compliance dashboards, email",
    },
    {
      title: "Shift publishing & updates",
      key: "shift.published / shift.updated",
      description:
        "When you publish or update a shift in Schedulaa, Zapier can push that info to calendars or team channels.",
      useCases: [
        "Notify staff of new/updated shifts",
        "Add shifts to external calendars",
        "Sync shifts to HR/workforce tools",
      ],
      steps: [
        "In Zapier: Create a Zap with Webhooks → Catch Hook. Copy the Hook URL.",
        "In Schedulaa: Settings → Zapier → Event hooks. Paste the URL. Choose shift.published or shift.updated. Add hook.",
        'In Zapier: Add actions like Google Calendar → Create/Update Event per shift, or Slack → Send Channel Message “New shift for [Name] on [Date] [Time]”.',
        "Result: Shifts appear in external calendars or team channels without manual copying.",
      ],
      apps: "Google Calendar, Outlook, Slack, Teams",
    },
    {
      title: "Onboarding flows (with e-sign)",
      key: "onboarding.started (+ attach_document action)",
      description:
        "Start onboarding in Schedulaa, send contracts via your e-sign tool, then push signed PDFs back into Schedulaa.",
      useCases: [
        "Automate sending onboarding contracts",
        "Store signed PDFs on employee profiles",
        "Streamline HR paperwork",
      ],
      steps: [
        "In Zapier: Create a Zap using Webhooks → Catch Hook. Copy the Hook URL.",
        "In Schedulaa: Settings → Zapier → Event hooks. Add the URL with event type onboarding.started.",
        "In Zapier: Add Action from your e-sign app (SignWell/DocuSign/Zoho Sign) to send a template using employee name/email.",
        "Create a second Zap: Trigger = e-sign app (Document completed) → Action = Schedulaa attach_document with employee ID, file URL, name, signed timestamp.",
        "Result: Manager clicks “Send via Zapier” → contracts go out → signed PDF appears in the employee’s Documents tab.",
      ],
      apps: "SignWell, DocuSign, Zoho Sign, HelloSign, Adobe Sign",
    },
    {
      title: "Time-off approvals and payroll prep",
      key: "leave.requested / leave.approved / leave.denied / leave.status_changed (+ payroll.ready)",
      description:
        "When employees request leave and managers approve/deny it, Zapier can notify teams, log PTO externally, or sync with HR systems. If leave makes a period ready for payroll, you can notify accounting via payroll.ready.",
      useCases: [
        "Notify HR/managers on leave approvals or denials",
        "Log time-off to an external sheet",
        "Sync PTO balances in another HR system",
      ],
      steps: [
        "In Zapier: Create a Zap with Webhooks → Catch Hook. Copy the Hook URL.",
        "In Schedulaa: Settings → Zapier → Event hooks. Paste the URL. Choose events like leave.approved or leave.status_changed. Add hook.",
        "In Zapier: Add actions (Slack/Teams message to a time-off channel, Sheets row with employee/dates/type/status, HR/Custom API update for PTO balances).",
        "Optional: Add another hook for payroll.ready to alert accounting when a period becomes ready after leave approval.",
        "Result: Managers approve leave in Schedulaa; HR/accounting/reporting tools stay in sync automatically.",
      ],
      apps: "Slack, Teams, Google Sheets, HRIS, internal APIs",
    },
    {
      title: "Shift swap automation",
      key: "swap.requested / swap.approved / swap.rejected",
      description:
        "When staff request swaps and managers approve or reject them, Zapier can broadcast updates or log them externally.",
      useCases: [
        "Notify managers of new swap requests",
        "Email employees when swaps are approved",
        "Track swap decisions in tickets or Sheets",
      ],
      steps: [
        "In Zapier: Create a Zap with Webhooks → Catch Hook. Copy the Hook URL.",
        "In Schedulaa: Settings → Zapier → Event hooks. Paste the URL. Choose swap.requested. Add hook. (Optional: add swap.approved and swap.rejected hooks too.)",
        "In Zapier: Add actions per event: swap.requested → Slack message; swap.approved → email both employees; swap.rejected → notify requester with reason.",
        "Result: Everyone stays informed about swap requests and decisions without manual messaging.",
      ],
      apps: "Slack, Teams, Gmail/Outlook, Zendesk, ClickUp",
    },
    {
      title: "When onboarding documents are signed",
      key: "onboarding.document_signed",
      description:
        "When a signed document is attached to an employee (via the attach_document action), Schedulaa can notify Zapier for compliance logs, HR checklists, or welcome sequences.",
      useCases: [
        "Mark HR checklist tasks complete in PM tools",
        "Send a welcome email once contracts are signed",
        "Log signed docs to Sheets for audits",
      ],
      steps: [
        "In Zapier: Create a Zap with Webhooks → Catch Hook. Copy the Hook URL.",
        "In Schedulaa: Settings → Zapier → Event hooks. Paste the URL. Choose onboarding.document_signed. Add hook.",
        "In Zapier: Add actions like ClickUp/Asana/Notion checklist update, send welcome email, or append to a Sheets audit log.",
        "Result: Signed docs in Schedulaa keep HR workflows, checklists, and emails in sync automatically.",
      ],
      apps: "ClickUp, Asana, Notion, Google Sheets, Gmail/Outlook, HR tools",
    },
    {
      title: "Payroll finalized",
      key: "payroll.finalized",
      description:
        "As soon as a payroll run is finalized, Zapier can notify accounting, log the event, or perform backups.",
      useCases: [
        "Notify accounting automatically",
        "Post a Slack message when payroll closes",
        "Track payroll runs in an external sheet",
      ],
      steps: [
        "In Zapier: Create a Zap with Webhooks → Catch Hook. Copy the Hook URL.",
        "In Schedulaa: Settings → Zapier → Event hooks. Paste the URL. Choose payroll.finalized. Add hook.",
        "In Zapier: Add an Action like email to accountant, Slack message “Payroll for [Period] is finalized”, or append a row to a Payroll runs sheet.",
        "Result: Stakeholders get notified and you keep an external audit trail of payroll periods.",
      ],
      apps: "Slack, Gmail/Outlook, Google Sheets, internal audit tools",
    },
    {
      title: "Payroll details (raw data per employee)",
      key: "payroll.details",
      description:
        "When you finalize payroll, Schedulaa can send the same detailed rows you see in Payroll → Payroll Detail / Raw Data to Zapier as JSON (one row per employee).",
      useCases: [
        "Build custom payroll reports in Sheets/Excel",
        "Send detailed payroll to accountants",
        "Feed QuickBooks Desktop/Sage/ERP or BI dashboards",
      ],
      steps: [
        "In Zapier: Create a Zap with Webhooks → Catch Hook. Copy the Hook URL.",
        "In Schedulaa: Settings → Zapier → Event hooks. Paste the URL. Choose payroll.details. Add hook.",
        "Finalize payroll in Schedulaa; it emits payroll.finalized and payroll.details.",
        "In Zapier: Add an Action like Google Sheets → Create Spreadsheet Row(s) or Webhooks → POST to your API. Use Looping by Zapier to iterate over rows[].",
        "Result: Every payroll finalization sends full per-employee payroll rows to your external tool for reporting or backups.",
      ],
      apps: "Google Sheets, Excel, QuickBooks Desktop (via connector), Sage, Power BI, custom ERP/APIs",
    },
  ],
  actions: [
    {
      title: "Create booking in Schedulaa",
      key: "create_booking",
      description: "Create an appointment against a service/employee.",
      useCases: [
        "Convert form leads into bookings",
        "Booking via chatbots/CRMs",
        "Automate lead → appointment flows",
      ],
      apps: "Web forms, Chatbots, CRM, Calendars",
      steps: [
        "Trigger: external app (e.g., Typeform submission, HubSpot deal stage, Facebook Lead Ad).",
        "Action: Schedulaa → Create booking. Map fields (service, employee, date, time, client name/email).",
        "Use your Schedulaa Zapier API key when connecting.",
        "Result: New bookings are created automatically with no manual work.",
      ],
    },
    {
      title: "Create employee",
      key: "create_employee",
      description: "Add a new employee profile to Schedulaa.",
      useCases: [
        "Import staff from HR systems",
        "Auto-create employees from recruitment tools",
        "Sync BambooHR/Workday to Schedulaa",
      ],
      apps: "HRIS (BambooHR/Workday), ATS, CRM",
    },
    {
      title: "Create shift",
      key: "create_shift",
      description: "Add a scheduled shift for a staff member.",
      useCases: [
        "Auto-generate shift schedules",
        "AI/demand-based scheduling",
        "Sync forecasting apps to shifts",
      ],
      apps: "Scheduling bots, Forecasting tools, AI helpers",
    },
    {
      title: "Update shift",
      key: "update_shift",
      description: "Modify shift time/branch/department/break policy.",
      useCases: [
        "Adjust shifts dynamically",
        "Integrate with staffing forecasts",
        "Real-time schedule corrections",
      ],
      apps: "Forecasting tools, Scheduling bots",
    },
    {
      title: "Attach document to employee",
      key: "attach_document",
      description: "Store a signed doc or PDF on an employee.",
      useCases: [
        "Save signed contracts from e-sign tools",
        "Store onboarding packs",
        "Auto-file employee documents",
      ],
      apps: "SignWell, HelloSign, DocuSign, Zoho Sign",
    },
    {
      title: "Automate employee and shift creation from other systems",
      key: "create_employee / create_shift / update_shift",
      description:
        "Let Zapier create employees and shifts so you don’t retype data from HR or recruiting systems.",
      useCases: [
        "Auto-create employees from HRIS/ATS hires",
        "Generate initial shifts when someone is hired",
        "Update shifts when upstream systems change dates/times",
      ],
      steps: [
        "Trigger from your system (e.g., BambooHR/Workday new hire, Greenhouse/Lever/Workable move to Hired, or a new row in a “New staff” sheet).",
        "Action: Schedulaa → Create employee. Map first/last name, email, role, department, branch, timezone. Use your Zapier API key.",
        "Action: Schedulaa → Create shift to add initial shifts; or Update shift when upstream changes dates/times (map date, start/end, branch, department, break policy).",
        "Result: New hires appear in Schedulaa with shifts already created—no duplicate typing.",
      ],
      apps: "BambooHR, Workday, Personio, Greenhouse, Lever, Workable, Google Sheets",
    },
  ],
};

const ZapierIntegrationPage = () => {
  const [showHelp, setShowHelp] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(eventExamples[0]);
  const [selectedAction, setSelectedAction] = useState(actionExamples[0]);
  const [showEventPayload, setShowEventPayload] = useState(false);
  const [showActionPayload, setShowActionPayload] = useState(false);

  return (
    <Box
      sx={(theme) => ({
        p: 3,
        borderRadius: 3,
        background:
          theme.palette.mode === "light" ? "linear-gradient(135deg, #fff 0%, #fff7f2 100%)" : "transparent",
      })}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 1 }}>
        <Typography variant="h5" gutterBottom>
          Zapier integration
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Open Zapier setup guide">
            <IconButton size="small" onClick={() => setShowHelp((v) => !v)} aria-label="Zapier help">
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button size="small" onClick={() => setShowHelp((v) => !v)} sx={{ textTransform: "none" }}>
            Zapier setup guide
          </Button>
        </Stack>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 720, mb: 3 }}>
        Connect Schedulaa with Zapier to automate your workflows. Start by sending events (like new bookings, shifts, and
        clock-ins) from Schedulaa to a Zapier Catch Hook, then let Zapier create things in Schedulaa using your API key.
      </Typography>

      <Collapse in={showHelp} timeout="auto" unmountOnExit>
        <ZapierHelpSection />
      </Collapse>

      <Box sx={{ mb: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 3,
            border: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Accordion elevation={0} disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Zapier Feature Library (Click to explore what’s possible)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Triggers send data to Zapier; actions let Zapier create things in Schedulaa.
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Triggers (Schedulaa → Zapier)
              </Typography>
              <Divider sx={{ mb: 1 }} />
              {featureLibrary.triggers.map((item) => (
                <Accordion key={item.key} disableGutters elevation={0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {item.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.key}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <InfoOutlinedIcon fontSize="small" color="action" />
                        <Typography variant="body2">{item.description}</Typography>
                      </Stack>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          border: (theme) => `1px solid ${theme.palette.divider}`,
                          backgroundColor: (theme) =>
                            theme.palette.mode === "light" ? "#f9fafb" : "transparent",
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          How to set it up
                        </Typography>
                        <List dense sx={{ mt: 0.5, mb: 1 }}>
                          {item.steps.map((step, idx) => (
                            <ListItem key={idx} sx={{ py: 0, pl: 0 }}>
                              <ListItemIcon sx={{ minWidth: 28 }}>
                                <CheckCircleOutlineIcon color="primary" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary={<Typography variant="body2">{step}</Typography>} sx={{ my: 0 }} />
                            </ListItem>
                          ))}
                        </List>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          What can I do with this?
                        </Typography>
                        <List dense sx={{ mt: 0.5, mb: 1 }}>
                          {item.useCases.map((u, idx) => (
                            <ListItem key={idx} sx={{ py: 0, pl: 0 }}>
                              <ListItemIcon sx={{ minWidth: 28 }}>
                                <CheckCircleOutlineIcon color="primary" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary={<Typography variant="body2">{u}</Typography>} sx={{ my: 0 }} />
                            </ListItem>
                          ))}
                        </List>
                        <Typography variant="caption" color="text.secondary">
                          Good with: {item.apps}
                        </Typography>
                      </Box>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              ))}

              <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
                Actions (Zapier → Schedulaa)
              </Typography>
              <Divider sx={{ mb: 1 }} />
              {featureLibrary.actions.map((item) => (
                <Accordion key={item.key} disableGutters elevation={0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {item.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.key}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <InfoOutlinedIcon fontSize="small" color="action" />
                        <Typography variant="body2">{item.description}</Typography>
                      </Stack>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          border: (theme) => `1px solid ${theme.palette.divider}`,
                          backgroundColor: (theme) =>
                            theme.palette.mode === "light" ? "#f9fafb" : "transparent",
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          What can I do with this?
                        </Typography>
                        <List dense sx={{ mt: 0.5, mb: 0 }}>
                          {item.useCases.map((u, idx) => (
                            <ListItem key={idx} sx={{ py: 0, pl: 0 }}>
                              <ListItemIcon sx={{ minWidth: 28 }}>
                                <CheckCircleOutlineIcon color="primary" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary={<Typography variant="body2">{u}</Typography>} sx={{ my: 0 }} />
                            </ListItem>
                          ))}
                        </List>
                        <Typography variant="caption" color="text.secondary">
                          Recommended apps: {item.apps}
                        </Typography>
                      </Box>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              ))}
            </AccordionDetails>
          </Accordion>
        </Paper>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Step 1 – Send events from Schedulaa to Zapier
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Choose an event, copy the example if needed, then add your Zapier hook URL below to start receiving data.
        </Typography>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 3,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            backgroundColor: (theme) => (theme.palette.mode === "light" ? "#f9fafb" : "transparent"),
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Event examples (for developers)
          </Typography>
          <Chip label="Trigger" size="small" color="primary" variant="outlined" sx={{ mb: 1 }} />
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "flex-start", md: "center" }}>
            <FormControl size="small" sx={{ minWidth: 260 }}>
              <InputLabel id="zapier-event-select-label">Event type (sample payload)</InputLabel>
              <Select
                labelId="zapier-event-select-label"
                value={selectedEvent.key}
                label="Event type (sample payload)"
                onChange={(e) => {
                  const next = eventExamples.find((it) => it.key === e.target.value);
                  if (next) setSelectedEvent(next);
                }}
              >
                {eventExamples.map((evt) => (
                  <MenuItem key={evt.key} value={evt.key}>
                    <Box>
                      <Typography variant="body2">{evt.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {evt.key}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Stack spacing={1} sx={{ width: "100%", maxWidth: "100%", overflow: "auto" }}>
              <Button
                size="small"
                variant="text"
                startIcon={<CodeIcon fontSize="small" />}
                onClick={() => setShowEventPayload((prev) => !prev)}
                sx={{ alignSelf: "flex-start", textTransform: "none", px: 0 }}
              >
                {showEventPayload ? "Hide JSON payload" : "Show JSON payload"}
              </Button>
              {showEventPayload && (
                <Typography
                  component="pre"
                  sx={{
                    m: 0,
                    p: 1.5,
                    borderRadius: 2,
                    fontFamily: "monospace",
                    fontSize: 12,
                    backgroundColor: (theme) => (theme.palette.mode === "light" ? "#111827" : "#0b1220"),
                    color: "#e5e7eb",
                    maxHeight: 260,
                    overflow: "auto",
                  }}
                >
                  {JSON.stringify(selectedEvent.payload, null, 2)}
                </Typography>
              )}
            </Stack>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 3,
            border: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <ZapierHooksPanel />
        </Paper>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Step 2 – Let Zapier create things in Schedulaa
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Use Zapier actions to create bookings, employees, or shifts in Schedulaa. Zapier will call Schedulaa using
          your API key and the request body examples below.
        </Typography>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 3,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            backgroundColor: (theme) => (theme.palette.mode === "light" ? "#f9fafb" : "transparent"),
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Action examples (for developers)
          </Typography>
          <Chip label="Action" size="small" color="primary" variant="outlined" sx={{ mb: 1 }} />
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "flex-start", md: "center" }}>
            <FormControl size="small" sx={{ minWidth: 260 }}>
              <InputLabel id="zapier-action-select-label">Action (sample request body)</InputLabel>
              <Select
                labelId="zapier-action-select-label"
                value={selectedAction.key}
                label="Action (sample request body)"
                onChange={(e) => {
                  const next = actionExamples.find((it) => it.key === e.target.value);
                  if (next) setSelectedAction(next);
                }}
              >
                {actionExamples.map((act) => (
                  <MenuItem key={act.key} value={act.key}>
                    <Box>
                      <Typography variant="body2">{act.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {act.key}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Stack spacing={1} sx={{ width: "100%", maxWidth: "100%", overflow: "auto" }}>
              <Button
                size="small"
                variant="text"
                startIcon={<CodeIcon fontSize="small" />}
                onClick={() => setShowActionPayload((prev) => !prev)}
                sx={{ alignSelf: "flex-start", textTransform: "none", px: 0 }}
              >
                {showActionPayload ? "Hide JSON body" : "Show JSON body"}
              </Button>
              {showActionPayload && (
                <Typography
                  component="pre"
                  sx={{
                    m: 0,
                    p: 1.5,
                    borderRadius: 2,
                    fontFamily: "monospace",
                    fontSize: 12,
                    backgroundColor: (theme) => (theme.palette.mode === "light" ? "#111827" : "#0b1220"),
                    color: "#e5e7eb",
                    maxHeight: 260,
                    overflow: "auto",
                  }}
                >
                  {JSON.stringify(selectedAction.payload, null, 2)}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                Hint: use POST /zapier/bookings, /zapier/employees, /zapier/shifts, or PATCH /zapier/shifts/:id with your
                Zapier API key in Authorization: Bearer &lt;key&gt;.
              </Typography>
            </Stack>
          </Stack>
        </Paper>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 3,
                border: (theme) => `1px solid ${theme.palette.divider}`,
              }}
            >
              <ZapierApiKeysPanel />
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default ZapierIntegrationPage;
