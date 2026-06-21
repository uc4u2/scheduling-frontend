import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormLabel,
  Grid,
  InputAdornment,
  Link,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip as MuiTooltip,
  Typography,
} from "@mui/material";
import AddCommentOutlinedIcon from "@mui/icons-material/AddCommentOutlined";
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import MoreHorizOutlinedIcon from "@mui/icons-material/MoreHorizOutlined";
import MailOutlineOutlinedIcon from "@mui/icons-material/MailOutlineOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import RestoreFromTrashOutlinedIcon from "@mui/icons-material/RestoreFromTrashOutlined";
import SmsOutlinedIcon from "@mui/icons-material/SmsOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import { useSnackbar } from "notistack";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import ManagementFrame from "../../../components/ui/ManagementFrame";
import SectionCard from "../../../components/ui/SectionCard";
import api from "../../../utils/api";
import { formatDateTimeInTz } from "../../../utils/datetime";
import { getUserTimezone } from "../../../utils/timezone";
import {
  archiveFinanceClient,
  cancelManagerClient360DocumentRequest,
  createManagerClient360Document,
  createManagerClient360DocumentRequest,
  createManagerClient360Note,
  createManagerClient360SessionNote,
  deleteManagerClient360Document,
  getManagerClient360,
  listManagerClient360Documents,
  listManagerClient360DocumentRequests,
  listManagerClient360,
  sendManagerClient360Email,
  updateFinanceClient,
} from "../../finance/financeApi";
import { getClientDisplayName } from "../../finance/clientUtils";
import FinanceMetricCard from "../../finance/components/FinanceMetricCard";
import FinancePagination from "../../finance/components/FinancePagination";
import ClientQuickCreateDialog from "../../finance/ClientQuickCreateDialog";
import { buildClientCreatePayload } from "../../finance/clientUtils";

const CURRENCY = "USD";
const PIE_COLORS = ["#2563eb", "#0f766e", "#d97706", "#7c3aed", "#dc2626", "#0891b2"];
const DEFAULT_DETAIL_SECTIONS = {
  overview: true,
  quickActions: true,
  bookings: true,
  finance: false,
  notes: false,
  documents: false,
  timeline: false,
  insights: false,
};

const CLIENT_DOCUMENT_CATEGORIES = [
  ["consent", "Consent"],
  ["insurance", "Insurance"],
  ["signed_agreement", "Signed agreement"],
  ["treatment_plan", "Treatment plan"],
  ["invoice_support", "Invoice support"],
  ["photos", "Photos"],
  ["id_document", "ID document"],
  ["other", "Other"],
];

const CLIENT_DOCUMENT_REQUEST_TEMPLATES = [
  {
    key: "consent",
    quickLabel: "Request consent",
    dialogLabel: "Consent form",
    title: "Signed consent form",
    category: "consent",
    message: "Please upload the signed consent form before your appointment.",
    expiry_days: 7,
  },
  {
    key: "insurance",
    quickLabel: "Request insurance",
    dialogLabel: "Insurance card",
    title: "Insurance card",
    category: "insurance",
    message: "Please upload a clear photo or PDF of your insurance card.",
    expiry_days: 7,
  },
  {
    key: "signed_agreement",
    quickLabel: "Request signed document",
    dialogLabel: "Signed agreement",
    title: "Signed agreement",
    category: "signed_agreement",
    message: "Please upload the signed agreement so we can keep it with your client profile.",
    expiry_days: 7,
  },
  {
    key: "treatment_plan",
    dialogLabel: "Treatment plan",
    title: "Treatment plan",
    category: "treatment_plan",
    message: "Please upload the requested treatment plan so we can keep it with your client profile.",
    expiry_days: 7,
  },
  {
    key: "invoice_support",
    dialogLabel: "Invoice support document",
    title: "Invoice support document",
    category: "invoice_support",
    message: "Please upload the document we need to support your invoice or billing record.",
    expiry_days: 7,
  },
  {
    key: "photos",
    quickLabel: "Request photos",
    dialogLabel: "Before/after photos",
    title: "Client photos",
    category: "photos",
    message: "Please upload the requested photos so we can keep them with your client profile.",
    expiry_days: 7,
  },
  {
    key: "id_document",
    dialogLabel: "ID document",
    title: "ID document",
    category: "id_document",
    message: "Please upload a clear photo or PDF of the requested ID document.",
    expiry_days: 7,
  },
  {
    key: "other",
    dialogLabel: "Other document",
    title: "Requested document",
    category: "other",
    message: "Please upload the requested document using this secure link.",
    expiry_days: 7,
  },
];

const SESSION_NOTE_TEMPLATES = [
  {
    key: "post_session",
    label: "Post-session follow-up",
    summary: "Follow-up after treatment session",
    outcome: "Client completed the session and tolerated treatment well.",
    follow_up: "Check in on progress and recommend the next visit if symptoms return.",
  },
  {
    key: "pain_relief",
    label: "Pain relief session",
    summary: "Targeted pain-relief treatment",
    outcome: "Focused on the reported pain points and tension areas during the session.",
    follow_up: "Monitor pain response, hydration, and whether additional sessions are needed.",
  },
  {
    key: "maintenance",
    label: "Maintenance visit",
    summary: "Routine maintenance appointment",
    outcome: "Maintenance-focused session completed for ongoing mobility and tension management.",
    follow_up: "Rebook the next maintenance visit based on the client’s preferred cadence.",
  },
  {
    key: "first_visit",
    label: "First-visit summary",
    summary: "Initial visit summary",
    outcome: "Reviewed initial concerns, session goals, and how the client responded to treatment.",
    follow_up: "Send a first-visit follow-up and recommend the next appointment if appropriate.",
  },
];

const FOLLOW_UP_EMAIL_TEMPLATES = [
  {
    key: "rebook",
    label: "Rebook reminder",
    subject: (name) => `${name} rebooking follow-up`,
    body: (name) =>
      `Hi ${name},\n\nThank you for your recent visit. If you would like to book your next appointment, we can help you find the next available time that works for you.\n\nReply to this email if you would like us to help you rebook.\n\nBest,\nSchedulaa team`,
  },
  {
    key: "payment",
    label: "Payment reminder",
    subject: (name) => `${name} payment follow-up`,
    body: (name) =>
      `Hi ${name},\n\nThis is a quick follow-up about your outstanding balance. If you need us to resend your payment link or invoice details, reply to this email and we will help.\n\nBest,\nSchedulaa team`,
  },
  {
    key: "session",
    label: "Session follow-up",
    subject: (name) => `${name} session follow-up`,
    body: (name) =>
      `Hi ${name},\n\nThank you for coming in. This is a quick check-in after your session. If you have any questions or would like to plan your next visit, reply to this email and we’ll help.\n\nBest,\nSchedulaa team`,
  },
];

const formatMoney = (value, currency = CURRENCY) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || CURRENCY,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDateTime = (value, timezone) => {
  if (!value) return "—";
  try {
    return formatDateTimeInTz(value, timezone || getUserTimezone());
  } catch {
    return value;
  }
};

const formatApptWhen = (row, timezone) => {
  if (!row) return "—";
  if (row.when_label) return row.when_label;
  if (row.start_iso || row.start_iso_local) {
    return formatDateTime(row.start_iso || row.start_iso_local, timezone);
  }
  const parts = [row.date, row.start_time && `${row.start_time}${row.end_time ? ` - ${row.end_time}` : ""}`].filter(Boolean);
  return parts.join(" • ") || "—";
};

const statusTone = (status) => {
  const key = String(status || "").toLowerCase();
  if (["paid", "completed", "accepted", "approved", "done", "closed", "active"].includes(key)) return "success";
  if (["pending", "draft", "sent", "scheduled", "booked", "new"].includes(key)) return "warning";
  if (["cancelled", "canceled", "rejected", "void", "no_show", "no-show", "archived", "inactive"].includes(key)) return "default";
  return "primary";
};

const formatStatusLabel = (value, fallback = "Status") => {
  const raw = String(value || "").trim();
  if (!raw) return fallback;
  return raw
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const readableChipSx = (tone = "default") => {
  const palette = {
    success: { bg: "rgba(22,163,74,0.10)", border: "rgba(22,163,74,0.28)", color: "#166534" },
    warning: { bg: "rgba(217,119,6,0.10)", border: "rgba(217,119,6,0.28)", color: "#9a3412" },
    info: { bg: "rgba(8,145,178,0.10)", border: "rgba(8,145,178,0.28)", color: "#0f766e" },
    primary: { bg: "rgba(37,99,235,0.10)", border: "rgba(37,99,235,0.28)", color: "#1d4ed8" },
    default: { bg: "rgba(148,163,184,0.10)", border: "rgba(148,163,184,0.30)", color: "#475569" },
  };
  const selected = palette[tone] || palette.default;
  return {
    backgroundColor: selected.bg,
    borderColor: selected.border,
    color: selected.color,
    "& .MuiChip-label": { color: selected.color, fontWeight: 700 },
  };
};

const readinessTone = (state) => {
  const key = String(state || "").toLowerCase();
  if (key === "ready") return "success";
  if (key === "recommended") return "warning";
  if (key === "done_recently") return "info";
  return "default";
};

const readinessLabel = (state) => {
  const key = String(state || "").toLowerCase();
  if (key === "ready") return "Ready";
  if (key === "recommended") return "Recommended";
  if (key === "done_recently") return "Done recently";
  return "Blocked";
};

const bookingPaymentStateMeta = (row = {}) => {
  const bookingStatus = String(row.status || "").toLowerCase();
  const paymentStatus = String(row.payment_status || "").toLowerCase();
  if (["paid", "package", "refunded", "partially_refunded"].includes(paymentStatus)) {
    return { label: "Paid", tone: "success" };
  }
  if (bookingStatus === "completed") {
    return { label: "Ready for invoice", tone: "warning" };
  }
  if (["booked", "scheduled", "confirmed"].includes(bookingStatus) && paymentStatus !== "paid") {
    return { label: "Collectable", tone: "info" };
  }
  if (bookingStatus === "cancelled" || bookingStatus === "canceled") {
    return { label: "Cancelled", tone: "default" };
  }
  return { label: "Needs review", tone: "default" };
};

const inferFinanceRecordType = (row = {}) => {
  if (Object.prototype.hasOwnProperty.call(row, "invoice_number") || Object.prototype.hasOwnProperty.call(row, "hosted_invoice_url")) return "invoice";
  if (Object.prototype.hasOwnProperty.call(row, "estimate_number") || Object.prototype.hasOwnProperty.call(row, "public_url")) return "estimate";
  if (Object.prototype.hasOwnProperty.call(row, "request_type")) return "quote";
  return "finance";
};

const isClientEmailAuditNote = (value) => normalizeTextValue(value).toLowerCase().startsWith("client email sent:");

const timelineCategory = (item = {}) => {
  if (isClientEmailAuditNote(item.note) || String(item.title || "").toLowerCase().includes("email")) return "emails";
  const key = String(item.event_type || "");
  if (key.startsWith("booking_")) return "bookings";
  if (key.includes("invoice") || key.includes("estimate") || key.includes("quote")) return "finance";
  if (key.includes("work_order")) return "work_orders";
  if (key.includes("note")) return "notes";
  return "other";
};

const bookingActionParams = (appointmentId, extras = {}) => {
  const params = new URLSearchParams();
  params.set("appointmentId", String(appointmentId));
  Object.entries(extras).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });
  return params.toString();
};

const copyText = async (text, enqueueSnackbar, successMessage = "Copied.") => {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    enqueueSnackbar(successMessage, { variant: "success" });
  } catch {
    enqueueSnackbar("Copy failed.", { variant: "error" });
  }
};

const truncateText = (text, limit = 180) => {
  const value = String(text || "");
  if (value.length <= limit) return { truncated: value, needsToggle: false };
  return { truncated: `${value.slice(0, limit).trimEnd()}…`, needsToggle: true };
};

const normalizeTextValue = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "[object Object]") return "Legacy note entry";
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeTextValue(entry)).filter(Boolean).join("\n");
  }
  if (typeof value === "object") {
    for (const key of ["note", "text", "message", "summary", "outcome", "follow_up", "content", "value", "body"]) {
      const next = normalizeTextValue(value?.[key]);
      if (next) return next;
    }
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
};

const getClientDocumentCategoryLabel = (value) =>
  CLIENT_DOCUMENT_CATEGORIES.find(([key]) => key === value)?.[1] || formatStatusLabel(value, "Other");

const documentRequestStateMeta = (row = {}) => {
  const status = String(row.status || "").toLowerCase();
  if (row.expired && status === "pending") {
    return { key: "expired", label: "Expired", tone: "warning", priority: 2 };
  }
  if (status === "uploaded") {
    return { key: "uploaded", label: "Uploaded", tone: "success", priority: 1 };
  }
  if (status === "cancelled") {
    return { key: "cancelled", label: "Cancelled", tone: "default", priority: 3 };
  }
  return { key: "pending", label: "Pending", tone: "primary", priority: 0 };
};

const toCents = (value) => {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return 0;
  return Math.round(numeric * 100);
};

const QuickStatusChip = ({ label, status }) => (
  <Chip
    size="small"
    label={formatStatusLabel(label || status, "—")}
    color={statusTone(status)}
    variant="outlined"
    sx={readableChipSx(statusTone(status))}
  />
);

function ExpandableText({ text, limit = 180 }) {
  const [expanded, setExpanded] = useState(false);
  const normalized = useMemo(() => normalizeTextValue(text), [text]);
  const { truncated, needsToggle } = useMemo(() => truncateText(normalized, limit), [normalized, limit]);
  if (!normalized) return null;
  return (
    <Stack spacing={0.5}>
      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
        {expanded || !needsToggle ? normalized : truncated}
      </Typography>
      {needsToggle ? (
        <Button size="small" sx={{ alignSelf: "flex-start", px: 0 }} onClick={() => setExpanded((prev) => !prev)}>
          {expanded ? "Show less" : "Show more"}
        </Button>
      ) : null}
    </Stack>
  );
}

function ClientEditorDialog({ open, onClose, initialValues, onSubmit, saving = false }) {
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", notes: "" });

  useEffect(() => {
    if (!open) return;
    setForm({
      first_name: initialValues?.first_name || "",
      last_name: initialValues?.last_name || "",
      email: initialValues?.email || "",
      phone: initialValues?.phone || "",
      notes: initialValues?.notes || "",
    });
  }, [open, initialValues]);

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit client</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First name"
                value={form.first_name}
                onChange={(event) => setForm((current) => ({ ...current, first_name: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last name"
                value={form.last_name}
                onChange={(event) => setForm((current) => ({ ...current, last_name: event.target.value }))}
              />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              />
            </Grid>
          </Grid>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Internal notes"
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          disabled={saving || !String(form.email || "").trim()}
          onClick={() => onSubmit(form)}
        >
          {saving ? "Saving..." : "Save client"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ConfirmClientDialog({
  open,
  title,
  body,
  confirmLabel,
  confirmColor = "primary",
  onClose,
  onConfirm,
  saving = false,
}) {
  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary">
          {body}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button color={confirmColor} variant="contained" onClick={onConfirm} disabled={saving}>
          {saving ? "Saving..." : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function OfflinePaymentDialog({ open, booking, saving, onClose, onConfirm }) {
  const [method, setMethod] = useState("cash");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    setMethod("cash");
    setNote("");
  }, [open, booking?.id]);

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Mark paid offline</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            {booking?.service || "Appointment"} • {formatApptWhen(booking, getUserTimezone())}
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Method</InputLabel>
            <Select label="Method" value={method} onChange={(event) => setMethod(event.target.value)}>
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="etransfer">e-Transfer</MenuItem>
              <MenuItem value="card">Card</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="Note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={() => onConfirm({ method, note })} disabled={saving}>
          {saving ? "Saving..." : "Mark paid"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function QuickNoteDialog({ open, client, saving, onClose, onSubmit }) {
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    setNote("");
  }, [open, client?.id]);

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add note</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5} sx={{ mt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            {client?.display_name || getClientDisplayName(client?.client || client)}
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Internal note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={() => onSubmit(note)} disabled={saving || !note.trim()}>
          {saving ? "Saving..." : "Add note"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function QuickSessionDialog({ open, client, bookings = [], saving, onClose, onSubmit }) {
  const [form, setForm] = useState({ appointment_id: "", summary: "", outcome: "", follow_up: "" });

  useEffect(() => {
    if (!open) return;
    setForm({ appointment_id: "", summary: "", outcome: "", follow_up: "" });
  }, [open, client?.id]);

  const applyTemplate = (template) => {
    setForm((prev) => ({
      ...prev,
      summary: template.summary,
      outcome: template.outcome,
      follow_up: template.follow_up,
    }));
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add session note</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5} sx={{ mt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            {client?.display_name || getClientDisplayName(client?.client || client)}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {SESSION_NOTE_TEMPLATES.map((template) => (
              <Chip key={template.key} size="small" label={template.label} onClick={() => applyTemplate(template)} variant="outlined" />
            ))}
          </Stack>
          <FormControl fullWidth>
            <InputLabel>Linked appointment</InputLabel>
            <Select
              label="Linked appointment"
              value={form.appointment_id}
              onChange={(event) => setForm((prev) => ({ ...prev, appointment_id: event.target.value }))}
            >
              <MenuItem value="">No appointment link</MenuItem>
              {bookings.slice(0, 12).map((row) => (
                <MenuItem key={row.id} value={String(row.id)}>
                  #{row.id} • {formatApptWhen(row, getUserTimezone())}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Summary"
            value={form.summary}
            onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))}
          />
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="Outcome"
            value={form.outcome}
            onChange={(event) => setForm((prev) => ({ ...prev, outcome: event.target.value }))}
          />
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="Follow-up"
            value={form.follow_up}
            onChange={(event) => setForm((prev) => ({ ...prev, follow_up: event.target.value }))}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => onSubmit(form)}
          disabled={saving || (!form.summary.trim() && !form.outcome.trim() && !form.follow_up.trim())}
        >
          {saving ? "Saving..." : "Add session note"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function QuickEmailDialog({ open, client, saving, initialForm = null, onClose, onSubmit }) {
  const [form, setForm] = useState({ subject: "", body: "" });

  useEffect(() => {
    if (!open) return;
    const displayName = client?.display_name || getClientDisplayName(client?.client || client);
    setForm({
      subject: initialForm?.subject || `${displayName} follow-up`,
      body: initialForm?.body || "",
    });
  }, [open, client, client?.id, client?.display_name, client?.client, initialForm]);

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Send email</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5} sx={{ mt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            {client?.display_name || getClientDisplayName(client?.client || client)}
            {client?.client?.email || client?.email ? ` • ${client?.client?.email || client?.email}` : ""}
          </Typography>
          <TextField
            fullWidth
            label="Subject"
            value={form.subject}
            onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
          />
          <TextField
            fullWidth
            multiline
            minRows={6}
            label="Message"
            value={form.body}
            onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
          />
          <Alert severity="info">
            This email is logged to the client history with sender and timestamp. SMS will be added later.
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={<MailOutlineOutlinedIcon fontSize="small" />}
          onClick={() => onSubmit(form)}
          disabled={saving || !form.subject.trim() || !form.body.trim()}
        >
          {saving ? "Sending..." : "Send email"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function RequestDocumentDialog({ open, saving, initialValues = null, onClose, onSubmit }) {
  const [form, setForm] = useState({ title: "", category: "other", message: "", expiry_days: 7 });

  useEffect(() => {
    if (!open) return;
    setForm({
      title: initialValues?.title || "",
      category: initialValues?.category || "other",
      message: initialValues?.message || "",
      expiry_days: initialValues?.expiry_days || 7,
    });
  }, [open, initialValues]);

  const applyTemplate = (template) => {
    setForm({
      title: template.title,
      category: template.category,
      message: template.message,
      expiry_days: template.expiry_days,
    });
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Request document</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5} sx={{ mt: 0.5 }}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {CLIENT_DOCUMENT_REQUEST_TEMPLATES.map((template) => (
              <Chip
                key={template.key}
                size="small"
                label={template.dialogLabel}
                variant="outlined"
                onClick={() => applyTemplate(template)}
              />
            ))}
          </Stack>
          <TextField
            fullWidth
            label="Document name"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
          />
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              label="Category"
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
            >
              {CLIENT_DOCUMENT_CATEGORIES.map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Message"
            value={form.message}
            onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
          />
          <TextField
            fullWidth
            type="number"
            label="Expiry days"
            value={form.expiry_days}
            onChange={(event) => setForm((prev) => ({ ...prev, expiry_days: event.target.value }))}
            inputProps={{ min: 1, max: 30 }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => onSubmit(form)}
          disabled={saving || !String(form.title || "").trim()}
        >
          {saving ? "Requesting..." : "Send request"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function Client360CollectPaymentDialog({ open, booking, clientProfile, onClose, onSuccess }) {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [baseAmount, setBaseAmount] = useState("");
  const [extraAmount, setExtraAmount] = useState("");
  const [tipMode, setTipMode] = useState("0");
  const [customTip, setCustomTip] = useState("");
  const [invoiceUrl, setInvoiceUrl] = useState("");
  const [offlineOpen, setOfflineOpen] = useState(false);
  const [offlineMethod, setOfflineMethod] = useState("cash");
  const [offlineNote, setOfflineNote] = useState("");
  const [creatingLink, setCreatingLink] = useState(false);
  const [onboardingUrl, setOnboardingUrl] = useState("");
  const [refreshingSummary, setRefreshingSummary] = useState(false);

  useEffect(() => {
    if (!open) return;
    setBaseAmount(String(Number(booking?.base_amount || 0).toFixed(2)));
    setExtraAmount("");
    setTipMode("0");
    setCustomTip("");
    setInvoiceUrl("");
    setOfflineOpen(false);
    setOfflineMethod("cash");
    setOfflineNote("");
    setCreatingLink(false);
    setOnboardingUrl("");
  }, [open, booking?.id, booking?.base_amount]);

  const statusKey = String(booking?.status || "").toLowerCase().replace("-", "_");
  const paymentKey = String(booking?.payment_status || "").toLowerCase();
  const hasCardOnFile = Boolean(booking?.has_card_on_file || clientProfile?.has_card_on_file);
  const currency = String(booking?.currency || "USD").toUpperCase();
  const baseCents = toCents(baseAmount);
  const extraCents = toCents(extraAmount);
  const tipCents = tipMode === "custom"
    ? toCents(customTip)
    : Math.round((baseCents + extraCents) * (Number(tipMode) / 100));
  const totalCents = Math.max(0, baseCents + extraCents + tipCents);
  const isPaid = paymentKey === "paid";

  const refreshClient360 = useCallback(async () => {
    if (!onSuccess) return;
    setRefreshingSummary(true);
    try {
      return await onSuccess(booking?.id);
    } finally {
      setRefreshingSummary(false);
    }
  }, [booking?.id, onSuccess]);

  const handleChargeSavedCard = () => {
    if (!booking?.id) return;
    const params = new URLSearchParams();
    params.set("view", "payments-hub");
    params.set("appointmentId", String(booking.id));
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
    onClose?.();
  };

  const handleCreatePaymentLink = async () => {
    if (!booking?.id) return;
    if (totalCents <= 0) {
      enqueueSnackbar("Enter a valid amount to invoice.", { variant: "error" });
      return;
    }
    const clientId = clientProfile?.id;
    const clientEmail = String(booking?.client_email || clientProfile?.email || "").trim();
    if (!clientId && !clientEmail) {
      enqueueSnackbar("Missing client info: need client ID or email to create payment link.", { variant: "error" });
      return;
    }
    setCreatingLink(true);
    setInvoiceUrl("");
    setOnboardingUrl("");
    try {
      const payload = {
        appointment_id: booking.id,
        currency,
        description: `Booking #${booking.id} • ${booking?.service || "Service"}`,
        amount_cents: totalCents,
        ...(clientId
          ? { client_id: clientId }
          : { client_email: clientEmail, client_name: booking?.client_name || undefined }),
      };
      const { data } = await api.post("/api/manager/manual-payments", payload);
      const url = data?.checkout_url || data?.invoice?.hosted_invoice_url || "";
      if (url) setInvoiceUrl(url);
      enqueueSnackbar("Payment link created.", { variant: "success" });
      await refreshClient360();
    } catch (err) {
      if (err?.response?.status === 412 && err?.response?.data?.onboarding_url) {
        setOnboardingUrl(err.response.data.onboarding_url);
        enqueueSnackbar("Stripe onboarding incomplete. Finish setup to create payment links.", { variant: "warning" });
      } else {
        enqueueSnackbar(err?.response?.data?.error || "Failed to create payment link.", { variant: "error" });
      }
    } finally {
      setCreatingLink(false);
    }
  };

  const handleStartKiosk = async () => {
    if (!booking?.id) return;
    try {
      const { data } = await api.post(`/api/manager/bookings/${booking.id}/kiosk-token`, {
        extra_amount_cents: extraCents,
      });
      const token = data?.token;
      if (!token) {
        enqueueSnackbar("Kiosk token unavailable. Try again.", { variant: "error" });
        return;
      }
      onClose?.();
      navigate(`/kiosk/pay/${token}`);
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || "Failed to start kiosk checkout.", { variant: "error" });
    }
  };

  const handleCopyInvoice = async () => {
    if (!invoiceUrl) return;
    try {
      await navigator.clipboard.writeText(invoiceUrl);
      enqueueSnackbar("Payment link copied.", { variant: "success" });
    } catch {
      enqueueSnackbar("Copy failed.", { variant: "error" });
    }
  };

  const handleMarkPaidOffline = async () => {
    if (!booking?.id) return;
    try {
      await api.post(`/api/manager/bookings/${booking.id}/mark-paid`, {
        method: offlineMethod,
        note: offlineNote,
      });
      enqueueSnackbar("Marked paid (offline).", { variant: "success" });
      setOfflineOpen(false);
      await refreshClient360();
      onClose?.();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || "Failed to mark paid.", { variant: "error" });
    }
  };

  const handleMarkCompleted = async () => {
    if (!booking?.id) return;
    try {
      await api.post(`/api/manager/bookings/${booking.id}/complete`, {});
      enqueueSnackbar("Booking marked completed.", { variant: "success" });
      await refreshClient360();
      onClose?.();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || "Failed to mark completed.", { variant: "error" });
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Collect Payment</DialogTitle>
        <DialogContent dividers>
          {booking ? (
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  {booking?.service || "Service"} • {booking?.client_name || getClientDisplayName(clientProfile) || "Client"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {booking?.client_email || clientProfile?.email || "—"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {booking?.client_phone || clientProfile?.phone || "—"}
                </Typography>
                {booking?.meeting_link ? (
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    <b>Video:</b>{" "}
                    <Link href={booking.meeting_link} target="_blank" rel="noopener">
                      Join meeting
                    </Link>
                  </Typography>
                ) : null}
                <Typography variant="body2">
                  {formatApptWhen(booking, getUserTimezone())}
                  {booking?.timezone ? ` (${booking.timezone})` : ""}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
                  <Chip size="small" label={booking.status || "booked"} />
                  <Chip size="small" label={booking.payment_status || "unpaid"} variant="outlined" />
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
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {["0", "10", "15", "20", "custom"].map((opt) => (
                      <Chip
                        key={opt}
                        label={opt === "custom" ? "Custom" : `${opt}%`}
                        color={tipMode === opt ? "primary" : "default"}
                        onClick={() => setTipMode(opt)}
                        variant={tipMode === opt ? "filled" : "outlined"}
                      />
                    ))}
                  </Stack>
                  {tipMode === "custom" ? (
                    <TextField
                      label="Custom tip"
                      value={customTip}
                      onChange={(e) => setCustomTip(e.target.value)}
                      sx={{ maxWidth: 240 }}
                      InputProps={{ endAdornment: <InputAdornment position="end">{currency}</InputAdornment> }}
                    />
                  ) : null}
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
                {refreshingSummary ? (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Refreshing client billing and booking status...
                  </Alert>
                ) : null}
                {isPaid ? (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    This booking is already marked as paid.
                  </Alert>
                ) : null}
                <Stack spacing={1.5}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography fontWeight={600}>Card on file</Typography>
                        <MuiTooltip
                          title="Tax is not calculated automatically when charging a saved card. Add tax into the amount manually, or use a payment link for tax-calculated collection."
                        >
                          <IconButton size="small">
                            <InfoOutlinedIcon fontSize="small" />
                          </IconButton>
                        </MuiTooltip>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {hasCardOnFile ? "Charge the saved card on file." : "No card on file for this client."}
                      </Typography>
                      <Button variant="contained" onClick={handleChargeSavedCard} disabled={!hasCardOnFile || isPaid}>
                        Charge saved card
                      </Button>
                      <Typography variant="caption" color="text.secondary">
                        Tip: Stripe won’t add tax automatically for saved-card charges. Include tax in the total if needed.
                      </Typography>
                    </Stack>
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={1}>
                      <Typography fontWeight={600}>Payment link (invoice)</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Create a hosted payment link and share it with the client.
                      </Typography>
                      <Button variant="outlined" onClick={handleCreatePaymentLink} disabled={isPaid || creatingLink}>
                        {creatingLink ? "Creating payment link..." : "Create payment link"}
                      </Button>
                      {onboardingUrl ? (
                        <Alert severity="warning">
                          Stripe onboarding incomplete.{" "}
                          <Button size="small" onClick={() => window.open(onboardingUrl, "_blank", "noopener")}>
                            Finish Stripe setup
                          </Button>
                        </Alert>
                      ) : null}
                      {invoiceUrl ? (
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                          <TextField label="Hosted payment link" value={invoiceUrl} fullWidth InputProps={{ readOnly: true }} />
                          <Button variant="contained" onClick={handleCopyInvoice}>
                            Copy link
                          </Button>
                          <Button variant="outlined" onClick={() => window.open(invoiceUrl, "_blank", "noopener,noreferrer")}>
                            Open link
                          </Button>
                        </Stack>
                      ) : null}
                    </Stack>
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={1}>
                      <Typography fontWeight={600}>Pay on this device</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Hand the device to the client to choose tip and pay by card.
                      </Typography>
                      <Button variant="outlined" onClick={handleStartKiosk} disabled={isPaid}>
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
                      <Button variant="outlined" onClick={() => setOfflineOpen(true)} disabled={isPaid}>
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
                <Button variant="outlined" onClick={handleMarkCompleted} disabled={!booking || statusKey === "completed"}>
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
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={offlineOpen} onClose={() => setOfflineOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Mark as paid</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Method</InputLabel>
              <Select label="Method" value={offlineMethod} onChange={(e) => setOfflineMethod(e.target.value)}>
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
    </>
  );
}

function RowActionMenu({ row, onQuickNote }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        size="small"
        onClick={(event) => {
          event.stopPropagation();
          setAnchorEl(event.currentTarget);
        }}
      >
        <MoreHorizOutlinedIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          component={RouterLink}
          to={`/manager/advanced-management?panel=manager-bookings&clientId=${row.client?.id}`}
          onClick={() => setAnchorEl(null)}
        >
          New booking
        </MenuItem>
        <MenuItem
          component={RouterLink}
          to={`/manager/finance-estimates?clientId=${row.client?.id}&action=create`}
          onClick={() => setAnchorEl(null)}
        >
          Estimate
        </MenuItem>
        <MenuItem
          component={RouterLink}
          to={`/manager/finance-invoices?clientId=${row.client?.id}`}
          onClick={() => setAnchorEl(null)}
        >
          Invoice
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onQuickNote(row);
          }}
        >
          Add note
        </MenuItem>
      </Menu>
    </>
  );
}

function PagedStackList({ items, renderItem, empty, initialVisible = 5, showMoreLabel = "Show more", showLessLabel = "Show less" }) {
  const [visibleCount, setVisibleCount] = useState(initialVisible);

  useEffect(() => {
    setVisibleCount(initialVisible);
  }, [items, initialVisible]);

  if (!items?.length) return empty || null;

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = items.length > visibleCount;
  const canShowLess = visibleCount > initialVisible;

  return (
    <Stack spacing={1.25}>
      {visibleItems.map((item, index) => renderItem(item, index))}
      {hasMore || canShowLess ? (
        <Stack direction="row" spacing={1}>
          {hasMore ? (
            <Button size="small" onClick={() => setVisibleCount((current) => current + initialVisible)}>
              {showMoreLabel}
            </Button>
          ) : null}
          {canShowLess ? (
            <Button size="small" onClick={() => setVisibleCount(initialVisible)}>
              {showLessLabel}
            </Button>
          ) : null}
        </Stack>
      ) : null}
    </Stack>
  );
}

function SectionAccordion({ title, description, icon, expanded, onChange, children, actions }) {
  return (
    <Accordion expanded={expanded} onChange={onChange} disableGutters sx={{ borderRadius: 1, overflow: "hidden" }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
          sx={{ width: "100%", pr: 1 }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            {icon}
            <Box>
              <Typography fontWeight={700}>{title}</Typography>
              {description ? <Typography variant="body2" color="text.secondary">{description}</Typography> : null}
            </Box>
          </Stack>
          {actions ? <Box onClick={(event) => event.stopPropagation()}>{actions}</Box> : null}
        </Stack>
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  );
}

function FinanceRecordActions({ row, enqueueSnackbar }) {
  const recordType = inferFinanceRecordType(row);

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      <Button
        size="small"
        variant="outlined"
        component={RouterLink}
        to={`/manager/${recordType === "quote" ? "finance-quotes" : recordType === "estimate" ? "finance-estimates" : "finance-invoices"}`}
      >
        Open
      </Button>
      {recordType === "estimate" && row.public_url ? (
        <>
          <Button size="small" onClick={() => window.open(row.public_url, "_blank", "noopener,noreferrer")}>
            View link
          </Button>
          <Button size="small" startIcon={<ContentCopyOutlinedIcon fontSize="small" />} onClick={() => copyText(row.public_url, enqueueSnackbar, "Estimate link copied.")}>
            Copy
          </Button>
          <Button
            size="small"
            component={RouterLink}
            to={`/manager/finance-work-orders?estimateId=${row.id}`}
          >
            Create work order
          </Button>
        </>
      ) : null}
      {recordType === "invoice" && row.hosted_invoice_url ? (
        <>
          <Button size="small" onClick={() => window.open(row.hosted_invoice_url, "_blank", "noopener,noreferrer")}>
            View payment
          </Button>
          <Button size="small" startIcon={<ContentCopyOutlinedIcon fontSize="small" />} onClick={() => copyText(row.hosted_invoice_url, enqueueSnackbar, "Payment link copied.")}>
            Copy
          </Button>
        </>
      ) : null}
    </Stack>
  );
}

function EmptyStateCard({ title, description, primaryAction = null, secondaryAction = null }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.25,
        borderRadius: 1.5,
        background: "linear-gradient(180deg, rgba(249,115,22,0.05) 0%, rgba(255,255,255,0.96) 100%)",
      }}
    >
      <Stack spacing={1.25}>
        <Typography fontWeight={800}>{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
        {primaryAction || secondaryAction ? (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {primaryAction}
            {secondaryAction}
          </Stack>
        ) : null}
      </Stack>
    </Paper>
  );
}

function ReadinessCard({ title, entry, primaryAction = null, secondaryAction = null }) {
  const state = entry?.state || "blocked";
  const tone = readinessTone(state);
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.75,
        borderRadius: 1.25,
        height: "100%",
        background: "linear-gradient(180deg, rgba(249,115,22,0.04) 0%, rgba(255,255,255,0.98) 100%)",
      }}
    >
      <Stack spacing={1.1} sx={{ height: "100%" }}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap>
          <Typography fontWeight={800}>{title || entry?.label || "Action"}</Typography>
          <Chip size="small" label={readinessLabel(state)} variant="outlined" sx={readableChipSx(tone)} />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {entry?.reason || "No status details available."}
        </Typography>
        {entry?.next_step ? (
          <Typography variant="caption" color="text.secondary">
            Next: {entry.next_step}
          </Typography>
        ) : null}
        {(primaryAction || secondaryAction) ? (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: "auto", pt: 0.5 }}>
            {primaryAction}
            {secondaryAction}
          </Stack>
        ) : null}
      </Stack>
    </Paper>
  );
}

function NoteSectionCard({ title, description, accent, children }) {
  return (
    <SectionCard
      title={title}
      description={description}
      sx={{
        height: "100%",
        borderRadius: 1.25,
        border: `1px solid ${accent}`,
        background: `linear-gradient(180deg, ${accent}12 0%, rgba(255,255,255,0.98) 100%)`,
      }}
    >
      {children}
    </SectionCard>
  );
}

function EmailAuditCard({ row, timezone }) {
  const text = normalizeTextValue(row?.note);
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const subjectLine = lines.find((line) => line.toLowerCase().startsWith("subject:"));
  const toLine = lines.find((line) => line.toLowerCase().startsWith("to:"));
  const previewLine = lines.find((line) => line.toLowerCase().startsWith("preview:"));
  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
      <Stack spacing={0.75}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Typography fontWeight={700}>{subjectLine?.slice(8).trim() || "Client email sent"}</Typography>
          <Chip size="small" color="primary" variant="outlined" label="Email" />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {toLine || `To: ${row?.client_email || "Client"}`}
        </Typography>
        {previewLine ? <ExpandableText text={previewLine.slice(8).trim()} limit={160} /> : <ExpandableText text={text} limit={160} />}
        <Typography variant="caption" color="text.secondary">
          {row.staff_name || "Staff"} • {formatDateTime(row.created_at, timezone)}
        </Typography>
      </Stack>
    </Paper>
  );
}

function ClientTimeline({ items, timezone }) {
  if (!items?.length) {
    return <Typography color="text.secondary">No timeline activity yet.</Typography>;
  }
  return (
    <Stack spacing={1.25}>
      {items.map((item) => (
        <Paper key={`${item.event_type}-${item.id}-${item.occurred_at || ""}`} variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between">
            <Stack spacing={0.5}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography fontWeight={700}>{item.title || item.event_type}</Typography>
                <QuickStatusChip label={item.status || item.event_type} status={item.status || item.event_type} />
                {isClientEmailAuditNote(item.note) || String(item.title || "").toLowerCase().includes("email") ? (
                  <Chip size="small" color="secondary" variant="outlined" label="Email" sx={readableChipSx("primary")} />
                ) : null}
              </Stack>
              {item.subtitle ? <Typography variant="body2" color="text.secondary">{item.subtitle}</Typography> : null}
              {item.note ? <ExpandableText text={item.note} limit={240} /> : null}
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {formatDateTime(item.occurred_at, timezone)}
            </Typography>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}

function TrendCharts({ detail }) {
  const bookings = useMemo(() => {
    const rows = [...(detail?.bookings?.past || []), ...(detail?.bookings?.upcoming || [])];
    const map = new Map();
    rows.forEach((row) => {
      const bucket = String(row?.date || "").slice(0, 7) || "Unknown";
      if (!map.has(bucket)) {
        map.set(bucket, { label: bucket, total: 0, completed: 0, cancelled: 0, noShow: 0, booked: 0 });
      }
      const slot = map.get(bucket);
      slot.total += 1;
      const status = String(row?.status || "").toLowerCase();
      if (status === "completed") slot.completed += 1;
      else if (status === "cancelled" || status === "canceled") slot.cancelled += 1;
      else if (status === "no_show" || status === "no-show") slot.noShow += 1;
      else slot.booked += 1;
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [detail]);

  const financeTrend = useMemo(() => {
    const rows = [
      ...(detail?.finance?.invoices || []).map((row) => ({
        type: "Invoice total",
        date: row.issue_date || row.created_at,
        amount: Number(row.total || 0),
      })),
      ...(detail?.finance?.estimates || []).map((row) => ({
        type: "Estimate total",
        date: row.issue_date || row.created_at,
        amount: Number(row.total || 0),
      })),
    ];
    const map = new Map();
    rows.forEach((row) => {
      const bucket = String(row.date || "").slice(0, 7) || "Unknown";
      if (!map.has(bucket)) {
        map.set(bucket, { label: bucket, invoices: 0, estimates: 0 });
      }
      const slot = map.get(bucket);
      if (row.type === "Invoice total") slot.invoices += row.amount;
      else slot.estimates += row.amount;
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [detail]);

  const timelineMix = useMemo(() => {
    const counts = new Map();
    (detail?.timeline || []).forEach((row) => {
      const key = row.event_type || "activity";
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  }, [detail]);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} xl={5}>
        <SectionCard title="Booking activity" description="Recent booking statuses by month.">
          {bookings.length ? (
            <Box sx={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={bookings}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="completed" fill="#16a34a" name="Completed" />
                  <Bar dataKey="booked" fill="#2563eb" name="Booked / upcoming" />
                  <Bar dataKey="cancelled" fill="#d97706" name="Cancelled" />
                  <Bar dataKey="noShow" fill="#dc2626" name="No-show" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Typography color="text.secondary">No appointment trend yet.</Typography>
          )}
        </SectionCard>
      </Grid>
      <Grid item xs={12} xl={4}>
        <SectionCard title="Billing trend" description="Recent estimate and invoice totals by month.">
          {financeTrend.length ? (
            <Box sx={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <LineChart data={financeTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <RechartsTooltip formatter={(value) => formatMoney(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="invoices" stroke="#2563eb" strokeWidth={2} name="Invoices" />
                  <Line type="monotone" dataKey="estimates" stroke="#7c3aed" strokeWidth={2} name="Estimates" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Typography color="text.secondary">No finance trend yet.</Typography>
          )}
        </SectionCard>
      </Grid>
      <Grid item xs={12} xl={3}>
        <SectionCard title="Activity mix" description="Timeline item breakdown.">
          {timelineMix.length ? (
            <Box sx={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={timelineMix} dataKey="value" nameKey="name" innerRadius={54} outerRadius={88} paddingAngle={2}>
                    {timelineMix.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Typography color="text.secondary">No timeline items yet.</Typography>
          )}
        </SectionCard>
      </Grid>
    </Grid>
  );
}

function Client360ListTable({ rows, onOpen, onQuickNote }) {
  return (
    <Paper variant="outlined" sx={{ overflow: "hidden", borderRadius: 1 }}>
      <Box sx={{ overflowX: "auto" }}>
        <Table sx={{ minWidth: 1200 }}>
          <TableHead>
            <TableRow>
              <TableCell>Client</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Bookings</TableCell>
              <TableCell>Finance</TableCell>
              <TableCell>Login</TableCell>
              <TableCell>Last activity</TableCell>
              <TableCell>Next appointment</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow hover key={row.client?.id} onClick={() => onOpen(row.client?.id)} sx={{ cursor: "pointer", "& td": { py: 1.5 } }}>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography fontWeight={700}>{row.display_name || getClientDisplayName(row.client)}</Typography>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                      <Chip size="small" label={row.status === "archived" ? "Archived" : "Active"} variant="outlined" />
                      {row.has_card_on_file ? <Chip size="small" label="Card on file" color="success" variant="outlined" /> : null}
                    </Stack>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{row.email || "No email"}</Typography>
                  <Typography variant="body2" color="text.secondary">{row.phone || "No phone"}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={700}>{row.linked_counts?.appointments ?? 0} total</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {row.linked_counts?.upcoming_appointments ?? 0} upcoming • {row.linked_counts?.past_appointments ?? 0} past
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={700}>
                    {row.linked_counts?.open_invoices ?? 0} open invoices • {formatMoney(row.unpaid_balance || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {row.linked_counts?.estimates ?? 0} estimates • {row.linked_counts?.open_work_orders ?? 0} open work orders
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                    <Chip size="small" label={row.has_login ? "Portal linked" : "No login"} color={row.has_login ? "success" : "default"} variant="outlined" />
                    <Chip size="small" label={row.login_status || "none"} variant="outlined" />
                  </Stack>
                </TableCell>
                <TableCell>{row.last_activity_at ? formatDateTime(row.last_activity_at, getUserTimezone()) : "—"}</TableCell>
                <TableCell>{row.next_appointment_at ? formatDateTime(row.next_appointment_at, getUserTimezone()) : "—"}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" justifyContent="flex-end" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpen(row.client?.id);
                      }}
                    >
                      Open
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      component={RouterLink}
                      to={`/manager/booking-checkout?clientId=${row.client?.id}`}
                      onClick={(event) => event.stopPropagation()}
                    >
                      Checkout
                    </Button>
                    <RowActionMenu row={row} onQuickNote={onQuickNote} />
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  );
}

export default function ManagerClientsWorkspace() {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const timezone = useMemo(() => getUserTimezone(), []);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("active");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [listPayload, setListPayload] = useState({ items: [], pagination: null });
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [noteText, setNoteText] = useState("");
  const [sessionForm, setSessionForm] = useState({ appointment_id: "", summary: "", outcome: "", follow_up: "" });
  const [savingNote, setSavingNote] = useState(false);
  const [savingSession, setSavingSession] = useState(false);
  const [detailSections, setDetailSections] = useState(DEFAULT_DETAIL_SECTIONS);
  const [timelineFilter, setTimelineFilter] = useState("all");
  const [editingClient, setEditingClient] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [savingClient, setSavingClient] = useState(false);
  const [collectDialogBooking, setCollectDialogBooking] = useState(null);
  const [offlineBooking, setOfflineBooking] = useState(null);
  const [offlineSaving, setOfflineSaving] = useState(false);
  const [listQuickNoteTarget, setListQuickNoteTarget] = useState(null);
  const [listQuickNoteSaving, setListQuickNoteSaving] = useState(false);
  const [detailQuickNoteOpen, setDetailQuickNoteOpen] = useState(false);
  const [detailQuickSessionOpen, setDetailQuickSessionOpen] = useState(false);
  const [detailQuickEmailOpen, setDetailQuickEmailOpen] = useState(false);
  const [detailEmailDraft, setDetailEmailDraft] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [createClientOpen, setCreateClientOpen] = useState(false);
  const [createClientForm, setCreateClientForm] = useState({ name: "", email: "", phone: "" });
  const [createClientSaving, setCreateClientSaving] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState("");
  const [documentFile, setDocumentFile] = useState(null);
  const [documentCategory, setDocumentCategory] = useState("other");
  const [documentNote, setDocumentNote] = useState("");
  const [documentUploading, setDocumentUploading] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState(null);
  const [documentRequests, setDocumentRequests] = useState([]);
  const [documentRequestsLoading, setDocumentRequestsLoading] = useState(false);
  const [documentRequestsError, setDocumentRequestsError] = useState("");
  const [requestDocumentOpen, setRequestDocumentOpen] = useState(false);
  const [requestDocumentDraft, setRequestDocumentDraft] = useState(null);
  const [requestDocumentSaving, setRequestDocumentSaving] = useState(false);
  const [cancellingRequestId, setCancellingRequestId] = useState(null);
  const [requestTemplateLabels, setRequestTemplateLabels] = useState({});

  const loadList = useCallback(async () => {
    setListLoading(true);
    setListError("");
    try {
      const payload = await listManagerClient360({
        q: query || undefined,
        status,
        page,
        per_page: perPage,
      });
      setListPayload({
        items: Array.isArray(payload?.items) ? payload.items : [],
        pagination: payload?.pagination || null,
      });
    } catch (err) {
      setListPayload({ items: [], pagination: null });
      setListError(err?.response?.data?.error || err?.message || "Unable to load clients.");
    } finally {
      setListLoading(false);
    }
  }, [page, perPage, query, status]);

  const loadDetail = useCallback(async () => {
    if (!clientId) return;
    setDetailLoading(true);
    setDetailError("");
    try {
      const payload = await getManagerClient360(clientId);
      setDetail(payload || null);
      return payload || null;
    } catch (err) {
      setDetail(null);
      setDetailError(err?.response?.data?.error || err?.message || "Unable to load client workspace.");
      return null;
    } finally {
      setDetailLoading(false);
    }
  }, [clientId]);

  const loadDocuments = useCallback(async () => {
    if (!clientId) return [];
    setDocumentsLoading(true);
    setDocumentsError("");
    try {
      const payload = await listManagerClient360Documents(clientId);
      const rows = Array.isArray(payload?.documents) ? payload.documents : [];
      setDocuments(rows);
      return rows;
    } catch (err) {
      setDocuments([]);
      setDocumentsError(err?.response?.data?.error || err?.message || "Unable to load client documents.");
      return [];
    } finally {
      setDocumentsLoading(false);
    }
  }, [clientId]);

  const loadDocumentRequests = useCallback(async () => {
    if (!clientId) return [];
    setDocumentRequestsLoading(true);
    setDocumentRequestsError("");
    try {
      const payload = await listManagerClient360DocumentRequests(clientId);
      const rows = Array.isArray(payload?.requests) ? payload.requests : [];
      setDocumentRequests(rows);
      return rows;
    } catch (err) {
      setDocumentRequests([]);
      setDocumentRequestsError(err?.response?.data?.error || err?.message || "Unable to load document requests.");
      return [];
    } finally {
      setDocumentRequestsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    if (clientId) loadDetail();
  }, [clientId, loadDetail]);

  useEffect(() => {
    if (!clientId) {
      setDocuments([]);
      setDocumentsError("");
      setDocumentRequests([]);
      setDocumentRequestsError("");
      return;
    }
    loadDocuments();
    loadDocumentRequests();
  }, [clientId, loadDocuments, loadDocumentRequests]);

  useEffect(() => {
    setDetailSections(DEFAULT_DETAIL_SECTIONS);
    setDocumentFile(null);
    setDocumentCategory("other");
    setDocumentNote("");
    setRequestDocumentOpen(false);
    setRequestDocumentDraft(null);
    setRequestTemplateLabels({});
  }, [clientId]);

  const listItems = useMemo(() => listPayload.items || [], [listPayload.items]);
  const pagination = listPayload.pagination || null;
  const profile = detail?.client || {};
  const summary = detail?.summary || {};
  const auth = detail?.auth || {};
  const notes = useMemo(() => detail?.notes || [], [detail]);
  const sortedNotes = useMemo(
    () =>
      [...notes].sort((a, b) =>
        String(b?.created_at || b?.updated_at || "").localeCompare(String(a?.created_at || a?.updated_at || ""))
      ),
    [notes]
  );
  const sessionHistory = useMemo(
    () =>
      [...(detail?.session_history || [])].sort((a, b) =>
        String(b?.created_at || b?.updated_at || "").localeCompare(String(a?.created_at || a?.updated_at || ""))
      ),
    [detail]
  );
  const allBookings = useMemo(() => ([...(detail?.bookings?.upcoming || []), ...(detail?.bookings?.past || [])]), [detail]);
  const financeRows = useMemo(
    () =>
      [
        ...(detail?.finance?.quote_requests || []),
        ...(detail?.finance?.estimates || []),
        ...(detail?.finance?.invoices || []),
      ].sort((a, b) => String(b.created_at || b.issue_date || "").localeCompare(String(a.created_at || a.issue_date || ""))),
    [detail]
  );
  const emailHistoryNotes = useMemo(
    () => sortedNotes.filter((row) => isClientEmailAuditNote(row?.note)),
    [sortedNotes]
  );
  const managerNotes = useMemo(
    () =>
      sortedNotes.filter((row) => {
        const text = normalizeTextValue(row?.note).toLowerCase();
        return !text.startsWith("client booking note:") && !isClientEmailAuditNote(row?.note);
      }),
    [sortedNotes]
  );
  const clientBookingNotes = useMemo(
    () => sortedNotes.filter((row) => normalizeTextValue(row?.note).toLowerCase().startsWith("client booking note:")),
    [sortedNotes]
  );
  const sortedDocuments = useMemo(
    () =>
      [...documents].sort((a, b) =>
        String(b?.created_at || b?.updated_at || "").localeCompare(String(a?.created_at || a?.updated_at || ""))
      ),
    [documents]
  );
  const sortedDocumentRequests = useMemo(
    () =>
      [...documentRequests].sort((a, b) => {
        const aMeta = documentRequestStateMeta(a);
        const bMeta = documentRequestStateMeta(b);
        if (aMeta.priority !== bMeta.priority) return aMeta.priority - bMeta.priority;
        return String(b?.created_at || "").localeCompare(String(a?.created_at || ""));
      }),
    [documentRequests]
  );
  const pendingDocumentRequests = useMemo(
    () => sortedDocumentRequests.filter((row) => documentRequestStateMeta(row).key === "pending"),
    [sortedDocumentRequests]
  );
  const completedDocumentRequests = useMemo(
    () => sortedDocumentRequests.filter((row) => documentRequestStateMeta(row).key !== "pending"),
    [sortedDocumentRequests]
  );
  const filteredTimeline = useMemo(() => {
    const rows = detail?.timeline || [];
    if (timelineFilter === "all") return rows;
    return rows.filter((item) => timelineCategory(item) === timelineFilter);
  }, [detail, timelineFilter]);
  const actionReadiness = detail?.action_readiness || {};
  const bookingById = useMemo(
    () => new Map(allBookings.map((row) => [String(row.id), row])),
    [allBookings]
  );

  const clientAlerts = useMemo(() => {
    if (!detail) return [];
    const alerts = [];
    if (Number(summary.open_invoice_count || 0) > 0 || Number(summary.unpaid_balance || 0) > 0) {
      alerts.push({ key: "billing", label: "Billing follow-up", tone: "warning", helper: `${summary.open_invoice_count || 0} open invoices • ${formatMoney(summary.unpaid_balance || 0)} unpaid` });
    }
    if (Number(summary.appointments || 0) <= 1) {
      alerts.push({ key: "first_visit", label: "New or first-visit client", tone: "info", helper: "Keep follow-up and next-visit planning visible." });
    }
    if (!summary.next_appointment && Number(summary.appointments || 0) > 0) {
      alerts.push({ key: "rebook", label: "No next booking", tone: "primary", helper: "Good candidate for a rebooking follow-up." });
    }
    if (Number(summary.no_show_count || 0) > 0) {
      alerts.push({ key: "no_show", label: "Attendance risk", tone: "default", helper: `${summary.no_show_count || 0} no-shows on record.` });
    }
    if (!auth.has_login) {
      alerts.push({ key: "portal", label: "No portal login", tone: "default", helper: "Client history exists without a portal-linked login." });
    }
    if (profile.status === "archived" || profile.archived_at) {
      alerts.push({ key: "archived", label: "Archived profile", tone: "default", helper: "Restore the profile before resuming normal client activity." });
    }
    return alerts;
  }, [auth.has_login, detail, profile.archived_at, profile.status, summary]);

  const wellnessSnapshot = useMemo(() => ([
    {
      label: "Last session",
      value: summary.last_appointment ? formatDateTime(summary.last_appointment, timezone) : "No visits yet",
      helper: "Most recent completed or tracked appointment.",
    },
    {
      label: "Next session",
      value: summary.next_appointment ? formatDateTime(summary.next_appointment, timezone) : "Not booked",
      helper: "Upcoming appointment on the client record.",
    },
    {
      label: "Total visits",
      value: String(summary.appointments ?? 0),
      helper: `${summary.upcoming_appointments ?? 0} upcoming appointment${Number(summary.upcoming_appointments || 0) === 1 ? "" : "s"}.`,
    },
    {
      label: "No-show count",
      value: String(summary.no_show_count ?? 0),
      helper: `${summary.cancelled_count ?? 0} cancelled booking${Number(summary.cancelled_count || 0) === 1 ? "" : "s"}.`,
    },
    {
      label: "Prepaid / package",
      value: "Not tracked yet",
      helper: "No package-credit field is exposed in the current Client 360 payload yet.",
    },
    {
      label: "Outstanding invoice",
      value: formatMoney(summary.unpaid_balance || 0),
      helper: `${summary.open_invoice_count ?? 0} open invoice${Number(summary.open_invoice_count || 0) === 1 ? "" : "s"}.`,
    },
  ]), [summary, timezone]);

  const pageMetrics = useMemo(() => ({
    total: Number(pagination?.total || listItems.length || 0),
    withUpcoming: listItems.filter((row) => Number(row?.linked_counts?.upcoming_appointments || 0) > 0).length,
    withOpenInvoices: listItems.filter((row) => Number(row?.linked_counts?.open_invoices || 0) > 0).length,
    withLogins: listItems.filter((row) => row?.has_login).length,
  }), [listItems, pagination]);

  const handleOpenClient = (id) => {
    if (!id) return;
    navigate(`/manager/clients/${id}`);
  };

  const openCollectDialogForBooking = useCallback((booking) => {
    if (!booking?.id) return;
    setCollectDialogBooking(booking);
  }, []);

  const handleCreateClient = async () => {
    const payload = buildClientCreatePayload(createClientForm);
    if (!payload.first_name || !payload.email) {
      enqueueSnackbar("Client name and email are required.", { variant: "error" });
      return;
    }
    setCreateClientSaving(true);
    try {
      const response = await api.post("/finance/clients", payload);
      const created = response?.data?.client || response?.data || {};
      if (response?.data?.reused) {
        enqueueSnackbar("Existing client reused.", { variant: "info" });
      } else {
        enqueueSnackbar("Client created.", { variant: "success" });
      }
      setCreateClientOpen(false);
      setCreateClientForm({ name: "", email: "", phone: "" });
      await loadList();
      if (created?.id) {
        navigate(`/manager/clients/${created.id}`);
      }
    } catch (err) {
      const conflict = err?.response?.data;
      if (conflict?.error === "client_phone_conflict" && conflict?.suggested_client?.id) {
        enqueueSnackbar(
          `Possible existing client found: ${conflict.suggested_client.name || conflict.suggested_client.email || `#${conflict.suggested_client.id}`}. Opening the existing client.`,
          { variant: "warning" }
        );
        setCreateClientOpen(false);
        navigate(`/manager/clients/${conflict.suggested_client.id}`);
      } else {
        enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to create client.", { variant: "error" });
      }
    } finally {
      setCreateClientSaving(false);
    }
  };

  const toggleSection = (key) => (_, expanded) => {
    setDetailSections((prev) => ({ ...prev, [key]: expanded }));
  };

  const handleCreateNote = async (overrideNote = "") => {
    const resolved = String(overrideNote || noteText || "").trim();
    if (!clientId || !resolved) return;
    setSavingNote(true);
    try {
      await createManagerClient360Note(clientId, { note: resolved });
      setNoteText("");
      setDetailQuickNoteOpen(false);
      enqueueSnackbar("Client note added.", { variant: "success" });
      await Promise.all([loadDetail(), loadList()]);
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to add note.", { variant: "error" });
    } finally {
      setSavingNote(false);
    }
  };

  const handleCreateSessionNote = async (overrideForm = null) => {
    if (!clientId) return;
    const source = overrideForm || sessionForm;
    const payload = {
      appointment_id: source.appointment_id ? Number(source.appointment_id) : undefined,
      summary: source.summary?.trim() || "",
      outcome: source.outcome?.trim() || "",
      follow_up: source.follow_up?.trim() || "",
    };
    if (!payload.summary && !payload.outcome && !payload.follow_up) {
      enqueueSnackbar("Add at least a summary, outcome, or follow-up note.", { variant: "warning" });
      return;
    }
    setSavingSession(true);
    try {
      await createManagerClient360SessionNote(clientId, payload);
      setSessionForm({ appointment_id: "", summary: "", outcome: "", follow_up: "" });
      setDetailQuickSessionOpen(false);
      enqueueSnackbar("Session note added.", { variant: "success" });
      await Promise.all([loadDetail(), loadList()]);
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to add session note.", { variant: "error" });
    } finally {
      setSavingSession(false);
    }
  };

  const handleSendEmail = async (overrideForm = null) => {
    if (!clientId) return;
    const source = overrideForm || {};
    const payload = {
      subject: String(source.subject || "").trim(),
      body: String(source.body || "").trim(),
    };
    if (!payload.subject) {
      enqueueSnackbar("Email subject is required.", { variant: "warning" });
      return;
    }
    if (!payload.body) {
      enqueueSnackbar("Email body is required.", { variant: "warning" });
      return;
    }
    setSendingEmail(true);
    try {
      await sendManagerClient360Email(clientId, payload);
      setDetailQuickEmailOpen(false);
      setDetailEmailDraft(null);
      enqueueSnackbar("Client email sent.", { variant: "success" });
      await Promise.all([loadDetail(), loadList()]);
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to send client email.", { variant: "error" });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleUploadDocument = async () => {
    if (!clientId || !documentFile) {
      enqueueSnackbar("Choose a file to upload first.", { variant: "warning" });
      return;
    }
    setDocumentUploading(true);
    setDocumentsError("");
    try {
      const form = new FormData();
      form.append("file", documentFile);
      form.append("context", "client_document");
      if (profile?.company_id) form.append("company_id", String(profile.company_id));

      const uploadRes = await api.post("/api/website/media/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const rawUrl =
        uploadRes.data?.items?.[0]?.url_public ||
        uploadRes.data?.items?.[0]?.file_url ||
        uploadRes.data?.items?.[0]?.url ||
        uploadRes.data?.url ||
        uploadRes.data?.url_public;
      if (!rawUrl) {
        throw new Error("Upload did not return a file URL.");
      }
      const apiOrigin = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");
      const finalUrl = /^https?:\/\//i.test(rawUrl)
        ? rawUrl
        : apiOrigin
        ? `${apiOrigin}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`
        : rawUrl;

      await createManagerClient360Document(clientId, {
        original_filename: documentFile.name,
        file_url: finalUrl,
        storage_provider: "manual_upload",
        content_type: documentFile.type || "application/octet-stream",
        file_size: documentFile.size || undefined,
        category: documentCategory || "other",
        note: documentNote?.trim() || "",
        scan_status: "clean",
      });
      setDocumentFile(null);
      setDocumentCategory("other");
      setDocumentNote("");
      enqueueSnackbar("Client document uploaded.", { variant: "success" });
      await loadDocuments();
    } catch (err) {
      const message = err?.response?.data?.error || err?.message || "Unable to upload client document.";
      setDocumentsError(message);
      enqueueSnackbar(message, { variant: "error" });
    } finally {
      setDocumentUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!clientId || !documentId) return;
    setDeletingDocumentId(documentId);
    try {
      await deleteManagerClient360Document(clientId, documentId);
      enqueueSnackbar("Client document removed.", { variant: "success" });
      await loadDocuments();
    } catch (err) {
      const message = err?.response?.data?.error || err?.message || "Unable to remove client document.";
      setDocumentsError(message);
      enqueueSnackbar(message, { variant: "error" });
    } finally {
      setDeletingDocumentId(null);
    }
  };

  const handleCreateDocumentRequest = async (form) => {
    if (!clientId) return;
    setRequestDocumentSaving(true);
    setDocumentRequestsError("");
    try {
      const payload = {
        title: String(form.title || "").trim(),
        category: String(form.category || "other"),
        message: String(form.message || "").trim(),
        expiry_days: Number(form.expiry_days || 7),
      };
      const res = await createManagerClient360DocumentRequest(clientId, payload);
      if (res?.request?.id && requestDocumentDraft?.templateLabel) {
        setRequestTemplateLabels((prev) => ({ ...prev, [res.request.id]: requestDocumentDraft.templateLabel }));
      }
      setRequestDocumentOpen(false);
      setRequestDocumentDraft(null);
      enqueueSnackbar(res?.emailed ? "Document request sent." : "Document request created. Copy the upload link to share.", {
        variant: "success",
      });
      await loadDocumentRequests();
    } catch (err) {
      const message = err?.response?.data?.error || err?.message || "Unable to create document request.";
      setDocumentRequestsError(message);
      enqueueSnackbar(message, { variant: "error" });
    } finally {
      setRequestDocumentSaving(false);
    }
  };

  const openRequestDocumentPreset = useCallback((template = null) => {
    setRequestDocumentDraft(
      template
        ? {
            title: template.title,
            category: template.category,
            message: template.message,
            expiry_days: template.expiry_days,
            templateLabel: template.dialogLabel,
          }
        : {
            title: "",
            category: "other",
            message: "",
            expiry_days: 7,
            templateLabel: "",
          }
    );
    setRequestDocumentOpen(true);
  }, []);

  const handleCancelDocumentRequest = async (requestId) => {
    if (!clientId || !requestId) return;
    setCancellingRequestId(requestId);
    try {
      await cancelManagerClient360DocumentRequest(clientId, requestId);
      enqueueSnackbar("Document request cancelled.", { variant: "success" });
      await loadDocumentRequests();
    } catch (err) {
      const message = err?.response?.data?.error || err?.message || "Unable to cancel document request.";
      setDocumentRequestsError(message);
      enqueueSnackbar(message, { variant: "error" });
    } finally {
      setCancellingRequestId(null);
    }
  };

  const applySessionTemplate = (template) => {
    setSessionForm((prev) => ({
      ...prev,
      summary: template.summary,
      outcome: template.outcome,
      follow_up: template.follow_up,
    }));
  };

  const handleSaveClient = async (form) => {
    if (!profile?.id) return;
    setSavingClient(true);
    try {
      await updateFinanceClient(profile.id, {
        first_name: form.first_name,
        last_name: form.last_name || "-",
        email: form.email,
        phone: form.phone,
        notes: form.notes,
      });
      setEditingClient(false);
      enqueueSnackbar("Client updated.", { variant: "success" });
      await Promise.all([loadDetail(), loadList()]);
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to update client.", { variant: "error" });
    } finally {
      setSavingClient(false);
    }
  };

  const handleArchiveClient = async () => {
    if (!profile?.id) return;
    setSavingClient(true);
    try {
      await archiveFinanceClient(profile.id);
      setArchiveOpen(false);
      enqueueSnackbar("Client archived.", { variant: "success" });
      await Promise.all([loadDetail(), loadList()]);
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to archive client.", { variant: "error" });
    } finally {
      setSavingClient(false);
    }
  };

  const handleRestoreClient = async () => {
    if (!profile?.id) return;
    setSavingClient(true);
    try {
      await updateFinanceClient(profile.id, { status: "active" });
      setRestoreOpen(false);
      enqueueSnackbar("Client restored.", { variant: "success" });
      await Promise.all([loadDetail(), loadList()]);
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to restore client.", { variant: "error" });
    } finally {
      setSavingClient(false);
    }
  };

  const handleMarkBookingComplete = async (bookingId) => {
    try {
      await api.post(`/api/manager/bookings/${bookingId}/complete`, {});
      enqueueSnackbar("Booking marked completed.", { variant: "success" });
      await loadDetail();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to mark booking completed.", { variant: "error" });
    }
  };

  const handleMarkBookingPaidOffline = async ({ method, note }) => {
    if (!offlineBooking?.id) return;
    setOfflineSaving(true);
    try {
      await api.post(`/api/manager/bookings/${offlineBooking.id}/mark-paid`, { method, note });
      enqueueSnackbar("Booking marked paid offline.", { variant: "success" });
      setOfflineBooking(null);
      await loadDetail();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to mark booking paid.", { variant: "error" });
    } finally {
      setOfflineSaving(false);
    }
  };

  const handleListQuickNote = async (note) => {
    if (!listQuickNoteTarget?.client?.id || !String(note || "").trim()) return;
    setListQuickNoteSaving(true);
    try {
      await createManagerClient360Note(listQuickNoteTarget.client.id, { note: String(note).trim() });
      enqueueSnackbar("Client note added.", { variant: "success" });
      setListQuickNoteTarget(null);
      await Promise.all([loadList(), clientId === String(listQuickNoteTarget.client.id) ? loadDetail() : Promise.resolve()]);
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to add note.", { variant: "error" });
    } finally {
      setListQuickNoteSaving(false);
    }
  };

  const openNotesComposer = (mode = "note", draft = null) => {
    if (mode === "email") {
      setDetailEmailDraft(draft || null);
      setDetailQuickEmailOpen(true);
      return;
    }
    if (mode === "session") {
      setDetailQuickSessionOpen(true);
      return;
    }
    setDetailQuickNoteOpen(true);
  };

  const buildFollowUpEmail = (templateKey) => {
    const name = getClientDisplayName(profile) || "there";
    const template = FOLLOW_UP_EMAIL_TEMPLATES.find((row) => row.key === templateKey);
    if (!template) return null;
    return {
      subject: template.subject(name),
      body: template.body(name),
    };
  };

  const explainActionState = useCallback((entry, fallback = "Action not ready yet.") => {
    const reason = entry?.reason || fallback;
    const nextStep = entry?.next_step ? ` ${entry.next_step}` : "";
    enqueueSnackbar(`${reason}${nextStep}`, {
      variant: entry?.state === "blocked" ? "warning" : "info",
    });
  }, [enqueueSnackbar]);

  const openCreateEstimateAction = useCallback((entry = actionReadiness.create_estimate) => {
    if (!profile?.id) return;
    if (entry?.state === "blocked") {
      explainActionState(entry, "Estimate workflow is not ready yet.");
      return;
    }
    const params = new URLSearchParams({ clientId: String(profile.id), action: "create" });
    if (entry?.quote_request_id) params.set("quoteRequestId", String(entry.quote_request_id));
    navigate(`/manager/finance-estimates?${params.toString()}`);
  }, [actionReadiness.create_estimate, explainActionState, navigate, profile?.id]);

  const openCreateInvoiceAction = useCallback((entry = actionReadiness.create_invoice) => {
    if (!profile?.id) return;
    if (entry?.state === "blocked") {
      explainActionState(entry, "Invoice workflow is not ready yet.");
      return;
    }
    const params = new URLSearchParams({ clientId: String(profile.id) });
    if (entry?.appointment_id) params.set("appointmentId", String(entry.appointment_id));
    if (entry?.estimate_id) params.set("estimateId", String(entry.estimate_id));
    if (entry?.state === "recommended") params.set("action", "create");
    navigate(`/manager/finance-invoices?${params.toString()}`);
  }, [actionReadiness.create_invoice, explainActionState, navigate, profile?.id]);

  const openCollectPaymentAction = useCallback((entry = actionReadiness.collect_payment) => {
    if (!profile?.id) return;
    if (!entry?.appointment_id || entry?.state === "blocked") {
      explainActionState(entry, "No booking is ready for payment collection yet.");
      return;
    }
    const booking = bookingById.get(String(entry.appointment_id));
    if (booking) {
      openCollectDialogForBooking(booking);
      return;
    }
    navigate(`/manager/booking-checkout?${bookingActionParams(entry.appointment_id, { clientId: profile.id })}`);
  }, [actionReadiness.collect_payment, bookingById, explainActionState, navigate, openCollectDialogForBooking, profile?.id]);

  const openMarkPaidOfflineAction = useCallback((entry = actionReadiness.mark_paid_offline) => {
    if (!entry?.appointment_id || entry?.state === "blocked") {
      explainActionState(entry, "No booking is ready to mark paid offline.");
      return;
    }
    const booking = bookingById.get(String(entry.appointment_id));
    if (booking) {
      setOfflineBooking(booking);
      return;
    }
    navigate(`/manager/booking-checkout?${bookingActionParams(entry.appointment_id, { clientId: profile.id })}`);
  }, [actionReadiness.mark_paid_offline, bookingById, explainActionState, navigate, profile?.id]);

  const handleSmartPaymentLink = useCallback((entry = actionReadiness.send_payment_link) => {
    if (!profile?.id) return;
    if (entry?.state === "ready" && entry?.payment_url) {
      window.open(entry.payment_url, "_blank", "noopener,noreferrer");
      return;
    }
    if (entry?.invoice_id) {
      explainActionState(entry, "Open the invoice to review payment-link readiness.");
      navigate(`/manager/finance-invoices?clientId=${profile.id}&invoiceId=${entry.invoice_id}&action=payment-link`);
      return;
    }
    if (entry?.estimate_id) {
      explainActionState(entry, "Open the estimate and continue it into invoicing first.");
      navigate(`/manager/finance-estimates?clientId=${profile.id}&estimateId=${entry.estimate_id}`);
      return;
    }
    if (entry?.appointment_id) {
      explainActionState(entry, "Open the invoice workflow or booking checkout for this appointment.");
      navigate(`/manager/finance-invoices?clientId=${profile.id}&appointmentId=${entry.appointment_id}&action=create`);
      return;
    }
    explainActionState(entry, "There is no payment link ready yet.");
  }, [actionReadiness.send_payment_link, explainActionState, navigate, profile?.id]);

  const openFollowUpAction = useCallback((entry = actionReadiness.send_follow_up) => {
    if (entry?.state === "blocked") {
      explainActionState(entry, "Follow-up email is not ready yet.");
      return;
    }
    const templateKey = Number(summary.unpaid_balance || 0) > 0
      ? "payment"
      : summary.next_appointment
        ? "session"
        : "rebook";
    openNotesComposer("email", buildFollowUpEmail(templateKey));
  }, [actionReadiness.send_follow_up, buildFollowUpEmail, explainActionState, summary.unpaid_balance, summary.next_appointment]);

  if (clientId) {
    return (
      <ManagementFrame
        title="Client 360"
        subtitle="Client bookings, billing, notes, work orders, and analytics in one compact manager workspace."
        fullWidth
        contentVariant={false}
      >
        <Stack spacing={2.5}>
          {detailLoading ? <CircularProgress /> : null}
          {detailError ? <Alert severity="error">{detailError}</Alert> : null}
          {detail ? (
            <>
              <SectionAccordion
                title="Overview"
                description="Profile, status, and client summary."
                icon={<TimelineOutlinedIcon color="primary" />}
                expanded={detailSections.overview}
                onChange={toggleSection("overview")}
                actions={
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Button size="small" startIcon={<RefreshOutlinedIcon fontSize="small" />} onClick={() => Promise.all([loadDetail(), loadList()])}>
                      Refresh
                    </Button>
                    <Button size="small" startIcon={<EditOutlinedIcon fontSize="small" />} onClick={() => setEditingClient(true)}>
                      Edit
                    </Button>
                    {profile.status === "archived" || profile.archived_at ? (
                      <Button size="small" color="success" startIcon={<RestoreFromTrashOutlinedIcon fontSize="small" />} onClick={() => setRestoreOpen(true)}>
                        Restore
                      </Button>
                    ) : (
                      <Button size="small" color="warning" startIcon={<ArchiveOutlinedIcon fontSize="small" />} onClick={() => setArchiveOpen(true)}>
                        Archive
                      </Button>
                    )}
                    <Button size="small" component={RouterLink} to="/manager/finance-clients">
                      Open finance
                    </Button>
                  </Stack>
                }
              >
                <Stack spacing={2.5}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6} xl={3}>
                      <FinanceMetricCard label="Appointments" value={String(summary.appointments ?? 0)} helper={`${summary.upcoming_appointments ?? 0} upcoming`} accent="primary" />
                    </Grid>
                    <Grid item xs={12} md={6} xl={3}>
                      <FinanceMetricCard label="Unpaid balance" value={formatMoney(summary.unpaid_balance || 0)} helper={`${summary.open_invoice_count ?? 0} open invoices`} accent="warning" />
                    </Grid>
                    <Grid item xs={12} md={6} xl={3}>
                      <FinanceMetricCard label="Revenue snapshot" value={formatMoney(summary.ltv || summary.gross || 0)} helper="Lifetime value when available, otherwise all-time gross snapshot." accent="success" />
                    </Grid>
                    <Grid item xs={12} md={6} xl={3}>
                      <FinanceMetricCard label="Open work orders" value={String(summary.open_work_order_count ?? 0)} helper={`${summary.no_show_count ?? 0} no-shows • ${summary.cancelled_count ?? 0} cancelled`} accent="info" />
                    </Grid>
                  </Grid>
                  {clientAlerts.length ? (
                    <SectionCard title="Client flags & alerts" description="Derived operational alerts from bookings, billing, and portal status.">
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {clientAlerts.map((alert) => (
                          <Chip
                            key={alert.key}
                            label={alert.label}
                            color={alert.tone}
                            variant="outlined"
                            sx={readableChipSx(alert.tone)}
                            title={alert.helper}
                          />
                        ))}
                      </Stack>
                    </SectionCard>
                  ) : null}
                  <Grid container spacing={2}>
                    <Grid item xs={12} lg={5}>
                      <SectionCard title={getClientDisplayName(profile)} description="Core client profile and portal status.">
                        <Stack spacing={1.5}>
                          <Typography variant="body2">{profile.email || "No email"}{profile.phone ? ` • ${profile.phone}` : ""}</Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Chip size="small" label={profile.status === "archived" || profile.archived_at ? "Archived" : "Active"} variant="outlined" />
                            <Chip size="small" label={auth.has_login ? "Portal linked" : "No portal login"} color={auth.has_login ? "success" : "default"} variant="outlined" />
                            {summary.has_card_on_file ? <Chip size="small" label="Card on file" color="success" variant="outlined" /> : null}
                          </Stack>
                          <Divider />
                          <Typography variant="body2" color="text.secondary">Last appointment</Typography>
                          <Typography variant="body2">{formatDateTime(summary.last_appointment, timezone)}</Typography>
                          <Typography variant="body2" color="text.secondary">Next appointment</Typography>
                          <Typography variant="body2">{formatDateTime(summary.next_appointment, timezone)}</Typography>
                          <Typography variant="body2" color="text.secondary">Auth email</Typography>
                          <Typography variant="body2">{auth.auth_email || "No linked auth email"}</Typography>
                          {profile.notes ? (
                            <>
                              <Typography variant="body2" color="text.secondary">Client profile notes</Typography>
                              <ExpandableText text={profile.notes} />
                            </>
                          ) : null}
                        </Stack>
                      </SectionCard>
                    </Grid>
                    <Grid item xs={12} lg={7}>
                      <SectionCard title="Linked summary" description="Operational snapshot across booking, billing, and work orders.">
                        <Grid container spacing={1.5}>
                          <Grid item xs={12} sm={6}>
                            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                              <Typography fontWeight={700}>Bookings</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {summary.appointments ?? 0} total • {summary.upcoming_appointments ?? 0} upcoming
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                              <Typography fontWeight={700}>Invoices</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {summary.open_invoice_count ?? 0} open • {formatMoney(summary.unpaid_balance || 0)}
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                              <Typography fontWeight={700}>Work orders</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {summary.open_work_order_count ?? 0} open
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                              <Typography fontWeight={700}>Client portal</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {auth.has_login ? "Linked" : "No login yet"} • {auth.membership_id ? `Membership #${auth.membership_id}` : "No membership"}
                              </Typography>
                            </Paper>
                          </Grid>
                        </Grid>
                      </SectionCard>
                    </Grid>
                  </Grid>
                  <SectionCard title="Visit & payment snapshot" description="Wellness-style snapshot for appointments, billing follow-up, and session cadence.">
                    <Grid container spacing={1.5}>
                      {wellnessSnapshot.map((card) => (
                        <Grid item xs={12} sm={6} xl={4} key={card.label}>
                          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                            <Typography variant="body2" color="text.secondary">{card.label}</Typography>
                            <Typography fontWeight={800} sx={{ mt: 0.5 }}>{card.value}</Typography>
                            <Typography variant="caption" color="text.secondary">{card.helper}</Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </SectionCard>
                </Stack>
              </SectionAccordion>

              <SectionAccordion
                title="Quick Actions"
                description="Jump into booking, billing, notes, and work-order flows for this client."
                icon={<WorkOutlineOutlinedIcon color="primary" />}
                expanded={detailSections.quickActions}
                onChange={toggleSection("quickActions")}
              >
                <SectionCard title="Manager actions" description="Keep the most-used actions prominent, and use lightweight actions for notes and follow-up.">
                  <Stack spacing={1.5}>
                    <Stack direction={{ xs: "column", lg: "row" }} spacing={1.25} flexWrap="wrap" useFlexGap>
                      <Button variant="contained" component={RouterLink} to={`/manager/advanced-management?panel=manager-bookings&clientId=${profile.id}`}>
                        Book appointment
                      </Button>
                      <Button
                        variant={actionReadiness.collect_payment?.state === "recommended" ? "contained" : "outlined"}
                        color={actionReadiness.collect_payment?.state === "recommended" ? "warning" : "primary"}
                        onClick={() => openCollectPaymentAction()}
                      >
                        Collect payment
                      </Button>
                      <Button
                        variant={actionReadiness.create_estimate?.state === "recommended" ? "contained" : "outlined"}
                        color={actionReadiness.create_estimate?.state === "recommended" ? "warning" : "primary"}
                        onClick={() => openCreateEstimateAction()}
                      >
                        Create estimate
                      </Button>
                      <Button
                        variant={actionReadiness.create_invoice?.state === "recommended" ? "contained" : "outlined"}
                        color={actionReadiness.create_invoice?.state === "recommended" ? "warning" : "primary"}
                        onClick={() => openCreateInvoiceAction()}
                      >
                        Create invoice
                      </Button>
                    </Stack>
                    <Stack direction={{ xs: "column", lg: "row" }} spacing={1.25} flexWrap="wrap" useFlexGap>
                      <Button variant="text" component={RouterLink} to={`/manager/finance-work-orders?clientId=${profile.id}&action=create`}>
                        Create work order
                      </Button>
                      <Button
                        variant="text"
                        onClick={() => handleSmartPaymentLink()}
                      >
                        Send payment link
                      </Button>
                      <Button variant="text" onClick={() => openMarkPaidOfflineAction()}>
                        Mark paid offline
                      </Button>
                      <Button
                        variant="text"
                        startIcon={<MailOutlineOutlinedIcon fontSize="small" />}
                        onClick={() => openNotesComposer("email")}
                        disabled={!String(profile.email || "").trim()}
                      >
                        Send email
                      </Button>
                      <Button variant="text" startIcon={<SmsOutlinedIcon fontSize="small" />} disabled>
                        SMS (coming soon)
                      </Button>
                      <Button variant="text" startIcon={<AddCommentOutlinedIcon fontSize="small" />} onClick={() => openNotesComposer("note")}>
                        Add note
                      </Button>
                      <Button variant="text" startIcon={<AssignmentTurnedInOutlinedIcon fontSize="small" />} onClick={() => openNotesComposer("session")}>
                        Add session note
                      </Button>
                    </Stack>
                    <SectionCard
                      title="Billing readiness"
                      description="See what is ready now, what is recommended next, and why billing actions are blocked."
                      sx={{ borderRadius: 1.25, background: "linear-gradient(180deg, rgba(217,119,6,0.05) 0%, rgba(255,255,255,0.98) 100%)" }}
                    >
                      <Grid container spacing={1.5}>
                        <Grid item xs={12} md={6} xl={3}>
                          <ReadinessCard
                            title="Payment link"
                            entry={actionReadiness.send_payment_link}
                            primaryAction={(
                              <Button size="small" variant="contained" onClick={() => handleSmartPaymentLink()}>
                                {actionReadiness.send_payment_link?.payment_url ? "Open link" : "Review"}
                              </Button>
                            )}
                            secondaryAction={actionReadiness.send_payment_link?.payment_url ? (
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<ContentCopyOutlinedIcon fontSize="small" />}
                                onClick={() => copyText(actionReadiness.send_payment_link?.payment_url, enqueueSnackbar, "Payment link copied.")}
                              >
                                Copy
                              </Button>
                            ) : null}
                          />
                        </Grid>
                        <Grid item xs={12} md={6} xl={3}>
                          <ReadinessCard
                            title="Invoice readiness"
                            entry={actionReadiness.create_invoice}
                            primaryAction={(
                              <Button size="small" variant="contained" onClick={() => openCreateInvoiceAction()}>
                                Create invoice
                              </Button>
                            )}
                          />
                        </Grid>
                        <Grid item xs={12} md={6} xl={3}>
                          <ReadinessCard
                            title="Checkout readiness"
                            entry={actionReadiness.collect_payment}
                            primaryAction={(
                              <Button size="small" variant="contained" onClick={() => openCollectPaymentAction()}>
                                Open checkout
                              </Button>
                            )}
                            secondaryAction={(
                              <Button size="small" variant="outlined" onClick={() => openMarkPaidOfflineAction()}>
                                Offline paid
                              </Button>
                            )}
                          />
                        </Grid>
                        <Grid item xs={12} md={6} xl={3}>
                          <ReadinessCard
                            title="Follow-up"
                            entry={actionReadiness.send_follow_up}
                            primaryAction={(
                              <Button size="small" variant="contained" onClick={() => openFollowUpAction()}>
                                Send follow-up
                              </Button>
                            )}
                          />
                        </Grid>
                      </Grid>
                    </SectionCard>
                    <Divider />
                    <SectionCard
                      title="Follow-up workflow"
                      description="Use lightweight follow-up actions for rebooking, billing, and post-session communication."
                      sx={{ borderRadius: 1.25, background: "linear-gradient(180deg, rgba(37,99,235,0.04) 0%, rgba(255,255,255,0.98) 100%)" }}
                    >
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Button size="small" variant="outlined" onClick={() => openNotesComposer("email", buildFollowUpEmail("rebook"))}>
                          Rebook reminder
                        </Button>
                        <Button size="small" variant="outlined" onClick={() => openNotesComposer("email", buildFollowUpEmail("payment"))}>
                          Payment reminder
                        </Button>
                        <Button size="small" variant="outlined" onClick={() => openFollowUpAction()}>
                          Session follow-up
                        </Button>
                      </Stack>
                    </SectionCard>
                  </Stack>
                </SectionCard>
              </SectionAccordion>

              <SectionAccordion
                title="Bookings & Checkout"
                description="Compact client-only booking agenda with payment and completion actions."
                icon={<CalendarMonthOutlinedIcon color="primary" />}
                expanded={detailSections.bookings}
                onChange={toggleSection("bookings")}
              >
                <Stack spacing={2}>
                  <SectionCard title="Upcoming bookings" description="Client-only booking rows with checkout actions.">
                    <Stack spacing={1.25}>
                      <PagedStackList
                        items={detail?.bookings?.upcoming || []}
                        initialVisible={3}
                        renderItem={(row) => {
                          const paymentMeta = bookingPaymentStateMeta(row);
                          const isPaid = paymentMeta.label === "Paid";
                          const isCompleted = String(row.status || "").toLowerCase() === "completed";
                          const invoiceHref = `/manager/finance-invoices?clientId=${profile.id}&appointmentId=${row.id}&action=create`;
                          return (
                            <Paper key={`upcoming-${row.id}`} variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                              <Stack spacing={1.25}>
                                <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between">
                                  <Stack spacing={0.5}>
                                    <Typography fontWeight={700}>{row.service || "Appointment"}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {formatApptWhen(row, timezone)} • {row.provider || "No provider"}
                                    </Typography>
                                    {row.notes ? <ExpandableText text={row.notes} /> : null}
                                  </Stack>
                                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    <QuickStatusChip status={row.status} />
                                    {row.payment_status ? <Chip size="small" label={formatStatusLabel(row.payment_status)} variant="outlined" sx={readableChipSx(statusTone(row.payment_status))} /> : null}
                                    <Chip size="small" label={paymentMeta.label} variant="outlined" sx={readableChipSx(paymentMeta.tone)} />
                                  </Stack>
                                </Stack>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                  <Button size="small" variant="outlined" component={RouterLink} to={`/manager/booking-checkout?${bookingActionParams(row.id, { clientId: profile.id })}`}>
                                    Open booking
                                  </Button>
                                  {!isPaid ? (
                                    <Button size="small" variant={isCompleted ? "contained" : "outlined"} color={isCompleted ? "warning" : "primary"} onClick={() => openCollectDialogForBooking(row)}>
                                      Collect payment
                                    </Button>
                                  ) : null}
                                  {!isPaid ? (
                                    <Button size="small" onClick={() => setOfflineBooking(row)}>
                                      Mark paid offline
                                    </Button>
                                  ) : null}
                                  {isCompleted && !isPaid ? (
                                    <Button size="small" variant="outlined" component={RouterLink} to={invoiceHref}>
                                      Create invoice
                                    </Button>
                                  ) : null}
                                  {!isCompleted ? (
                                    <Button size="small" onClick={() => handleMarkBookingComplete(row.id)}>
                                      Mark complete
                                    </Button>
                                  ) : null}
                                </Stack>
                              </Stack>
                            </Paper>
                          );
                        }}
                      />
                      {!detail?.bookings?.upcoming?.length ? (
                        <EmptyStateCard
                          title="No upcoming bookings yet"
                          description="Start a new appointment for this client or open the client-scoped checkout view."
                          primaryAction={(
                            <Button variant="contained" size="small" component={RouterLink} to={`/manager/advanced-management?panel=manager-bookings&clientId=${profile.id}`}>
                              Book appointment
                            </Button>
                          )}
                          secondaryAction={(
                            <Button variant="outlined" size="small" component={RouterLink} to={`/manager/booking-checkout?clientId=${profile.id}`}>
                              Open checkout
                            </Button>
                          )}
                        />
                      ) : null}
                    </Stack>
                  </SectionCard>
                  <SectionCard title="Recent bookings" description="Past appointment history with compact actions.">
                    <Stack spacing={1.25}>
                      <PagedStackList
                        items={(detail?.bookings?.past || []).slice(0, 12)}
                        initialVisible={4}
                        renderItem={(row) => {
                          const paymentMeta = bookingPaymentStateMeta(row);
                          const isPaid = paymentMeta.label === "Paid";
                          const isCompleted = String(row.status || "").toLowerCase() === "completed";
                          const invoiceHref = `/manager/finance-invoices?clientId=${profile.id}&appointmentId=${row.id}&action=create`;
                          return (
                            <Paper key={`past-${row.id}`} variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                              <Stack spacing={1.25}>
                                <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between">
                                  <Stack spacing={0.5}>
                                    <Typography fontWeight={700}>{row.service || "Appointment"}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {formatApptWhen(row, timezone)} • {row.provider || "No provider"}
                                    </Typography>
                                    {row.notes ? <ExpandableText text={row.notes} /> : null}
                                  </Stack>
                                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    <QuickStatusChip status={row.status} />
                                    {row.payment_status ? <Chip size="small" label={formatStatusLabel(row.payment_status)} variant="outlined" sx={readableChipSx(statusTone(row.payment_status))} /> : null}
                                    <Chip size="small" label={paymentMeta.label} variant="outlined" sx={readableChipSx(paymentMeta.tone)} />
                                  </Stack>
                                </Stack>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                  <Button size="small" variant="outlined" component={RouterLink} to={`/manager/booking-checkout?${bookingActionParams(row.id, { clientId: profile.id })}`}>
                                    Open booking
                                  </Button>
                                  {!isPaid ? (
                                    <Button size="small" variant={isCompleted ? "contained" : "outlined"} color={isCompleted ? "warning" : "primary"} onClick={() => openCollectDialogForBooking(row)}>
                                      Collect payment
                                    </Button>
                                  ) : null}
                                  {!isPaid ? (
                                    <Button size="small" onClick={() => setOfflineBooking(row)}>
                                      Mark paid offline
                                    </Button>
                                  ) : null}
                                  {isCompleted && !isPaid ? (
                                    <Button size="small" variant="outlined" component={RouterLink} to={invoiceHref}>
                                      Create invoice
                                    </Button>
                                  ) : null}
                                  {!isCompleted ? (
                                    <Button size="small" onClick={() => handleMarkBookingComplete(row.id)}>
                                      Mark complete
                                    </Button>
                                  ) : null}
                                </Stack>
                              </Stack>
                            </Paper>
                          );
                        }}
                      />
                      {!detail?.bookings?.past?.length ? <Typography color="text.secondary">No past bookings for this client.</Typography> : null}
                    </Stack>
                  </SectionCard>
                </Stack>
              </SectionAccordion>

              <SectionAccordion
                title="Finance & Work Orders"
                description="Quotes, estimates, invoices, payment links, and work-order actions."
                icon={<ReceiptLongOutlinedIcon color="primary" />}
                expanded={detailSections.finance}
                onChange={toggleSection("finance")}
              >
                <Stack spacing={2}>
                  <SectionCard title="Finance records" description="Recent quote requests, estimates, and invoices.">
                    <Stack spacing={1.25}>
                      <PagedStackList
                        items={financeRows.slice(0, 16)}
                        initialVisible={4}
                        renderItem={(row) => {
                          const recordType = inferFinanceRecordType(row);
                          return (
                            <Paper key={`finance-${recordType}-${row.id}`} variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                              <Stack spacing={1.25}>
                                <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between">
                                  <Stack spacing={0.5}>
                                    <Typography fontWeight={700}>
                                      {row.invoice_number || row.estimate_number || row.title || `Record #${row.id}`}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {recordType === "quote" ? "Quote request" : recordType === "estimate" ? "Estimate" : "Invoice"}
                                      {row.title ? ` • ${row.title}` : ""}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {(row.issue_date || row.created_at) ? formatDateTime(row.issue_date || row.created_at, timezone) : "—"}
                                    </Typography>
                                  </Stack>
                                  <Stack alignItems={{ xs: "flex-start", md: "flex-end" }} spacing={0.75}>
                                    <QuickStatusChip status={row.status} />
                                    {"total" in row ? <Typography fontWeight={700}>{formatMoney(row.total || 0, row.currency || CURRENCY)}</Typography> : null}
                                  </Stack>
                                </Stack>
                                <FinanceRecordActions row={row} enqueueSnackbar={enqueueSnackbar} />
                              </Stack>
                            </Paper>
                          );
                        }}
                      />
                      {!financeRows.length ? (
                        <EmptyStateCard
                          title="No finance records yet"
                          description="Create an estimate first or open invoices for this client."
                          primaryAction={(
                            <Button variant="contained" size="small" component={RouterLink} to={`/manager/finance-estimates?clientId=${profile.id}&action=create`}>
                              Create estimate
                            </Button>
                          )}
                          secondaryAction={(
                            <Button variant="outlined" size="small" component={RouterLink} to={`/manager/finance-invoices?clientId=${profile.id}`}>
                              Open invoices
                            </Button>
                          )}
                        />
                      ) : null}
                    </Stack>
                  </SectionCard>
                  <SectionCard title="Work orders" description="Recent work orders and assignment counts.">
                    <Stack spacing={1.25}>
                      <PagedStackList
                        items={(detail?.work_orders || []).slice(0, 12)}
                        initialVisible={4}
                        renderItem={(row) => (
                          <Paper key={`work-order-${row.id}`} variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                            <Stack spacing={1.25}>
                              <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between">
                                <Stack spacing={0.5}>
                                  <Typography fontWeight={700}>{row.work_order_number || `WO-${row.id}`}</Typography>
                                  <Typography variant="body2" color="text.secondary">{row.title || "Work order"}</Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {(row.start_date || row.updated_at) ? formatDateTime(row.start_date || row.updated_at, timezone) : "—"}
                                  </Typography>
                                </Stack>
                                <Stack alignItems={{ xs: "flex-start", md: "flex-end" }} spacing={0.75}>
                                  <QuickStatusChip status={row.status} />
                                  <Chip size="small" label={`${row.assignment_count || 0} assigned`} variant="outlined" sx={readableChipSx("info")} />
                                </Stack>
                              </Stack>
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                <Button size="small" variant="outlined" component={RouterLink} to="/manager/finance-work-orders">
                                  Open
                                </Button>
                              </Stack>
                            </Stack>
                          </Paper>
                        )}
                      />
                      {!detail?.work_orders?.length ? (
                        <EmptyStateCard
                          title="No work orders yet"
                          description="Create a work order directly for this client or start from an estimate."
                          primaryAction={(
                            <Button variant="contained" size="small" component={RouterLink} to={`/manager/finance-work-orders?clientId=${profile.id}&action=create`}>
                              Create work order
                            </Button>
                          )}
                          secondaryAction={(
                            <Button variant="outlined" size="small" component={RouterLink} to={`/manager/finance-estimates?clientId=${profile.id}&action=create`}>
                              Create estimate first
                            </Button>
                          )}
                        />
                      ) : null}
                    </Stack>
                  </SectionCard>
                </Stack>
              </SectionAccordion>

              <SectionAccordion
                title="Notes & Session Notes"
                description="Internal notes, mirrored client booking notes, and session history."
                icon={<AddCommentOutlinedIcon color="primary" />}
                expanded={detailSections.notes}
                onChange={toggleSection("notes")}
              >
                <Stack spacing={2.5}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6} xl={3}>
                      <NoteSectionCard title="Manager notes" description="Staff-created internal notes." accent="rgba(37,99,235,0.28)">
                        <PagedStackList
                          items={managerNotes}
                          initialVisible={3}
                          renderItem={(row) => (
                            <Paper key={`note-${row.id}`} variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                              <ExpandableText text={row.note} />
                              <Typography variant="caption" color="text.secondary">
                                {row.staff_name || "System"} • {formatDateTime(row.created_at, timezone)}
                              </Typography>
                            </Paper>
                          )}
                          empty={(
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
                              <Stack spacing={1}>
                                <Typography fontWeight={700}>No manager notes yet</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Add the first internal note for this client.
                                </Typography>
                                <Stack direction="row">
                                  <Button variant="contained" size="small" onClick={() => setDetailQuickNoteOpen(true)}>
                                    Add first note
                                  </Button>
                                </Stack>
                              </Stack>
                            </Paper>
                          )}
                        />
                      </NoteSectionCard>
                    </Grid>
                    <Grid item xs={12} md={6} xl={3}>
                      <NoteSectionCard title="Email history" description="Sent client emails logged with sender and timestamp." accent="rgba(124,58,237,0.28)">
                        <PagedStackList
                          items={emailHistoryNotes}
                          initialVisible={3}
                          renderItem={(row) => <EmailAuditCard row={row} timezone={timezone} />}
                          empty={<Typography color="text.secondary">No client emails sent yet.</Typography>}
                        />
                      </NoteSectionCard>
                    </Grid>
                    <Grid item xs={12} md={6} xl={3}>
                      <NoteSectionCard title="Client booking notes" description="Mirrored notes submitted by the client during booking flows." accent="rgba(217,119,6,0.28)">
                        <PagedStackList
                          items={clientBookingNotes}
                          initialVisible={3}
                          renderItem={(row) => (
                            <Paper key={`client-note-${row.id}`} variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                              <ExpandableText text={row.note} />
                              <Typography variant="caption" color="text.secondary">
                                {row.staff_name || "Client booking"} • {formatDateTime(row.created_at, timezone)}
                              </Typography>
                            </Paper>
                          )}
                          empty={<Typography color="text.secondary">No client-submitted booking notes yet.</Typography>}
                        />
                      </NoteSectionCard>
                    </Grid>
                    <Grid item xs={12} md={6} xl={3}>
                      <NoteSectionCard title="Session notes" description="Operational session history and follow-up notes." accent="rgba(22,163,74,0.28)">
                        <PagedStackList
                          items={sessionHistory}
                          initialVisible={3}
                          renderItem={(row) => (
                            <Paper key={`session-${row.id}`} variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                              <Typography fontWeight={700}>{normalizeTextValue(row.summary) || "Session note"}</Typography>
                              {row.outcome ? <ExpandableText text={row.outcome} limit={160} /> : null}
                              {row.follow_up ? <Typography variant="body2" color="text.secondary">Follow-up: {normalizeTextValue(row.follow_up)}</Typography> : null}
                              <Typography variant="caption" color="text.secondary">
                                {row.staff_name || "Staff"} • {formatDateTime(row.created_at, timezone)}
                              </Typography>
                            </Paper>
                          )}
                          empty={<Typography color="text.secondary">No session notes yet.</Typography>}
                        />
                      </NoteSectionCard>
                    </Grid>
                  </Grid>

                  <Grid container spacing={2}>
                    <Grid item xs={12} lg={6}>
                      <SectionCard title="Add internal note" description="Save a manager-facing note to this client profile.">
                        <Stack spacing={1.25}>
                          <TextField
                            multiline
                            minRows={3}
                            fullWidth
                            label="Internal note"
                            value={noteText}
                            onChange={(event) => setNoteText(event.target.value)}
                          />
                          <Stack direction="row" justifyContent="space-between">
                            <Button variant="text" onClick={loadDetail}>Refresh notes</Button>
                            <Button variant="contained" onClick={() => handleCreateNote()} disabled={savingNote || !noteText.trim()}>
                              {savingNote ? "Saving..." : "Add note"}
                            </Button>
                          </Stack>
                        </Stack>
                      </SectionCard>
                    </Grid>
                    <Grid item xs={12} lg={6}>
                      <SectionCard title="Add session note" description="Save session summary, outcome, and follow-up steps.">
                        <Stack spacing={1.25}>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {SESSION_NOTE_TEMPLATES.map((template) => (
                              <Chip key={template.key} size="small" label={template.label} onClick={() => applySessionTemplate(template)} variant="outlined" />
                            ))}
                          </Stack>
                          <FormControl fullWidth>
                            <InputLabel>Linked appointment</InputLabel>
                            <Select
                              label="Linked appointment"
                              value={sessionForm.appointment_id}
                              onChange={(event) => setSessionForm((prev) => ({ ...prev, appointment_id: event.target.value }))}
                            >
                              <MenuItem value="">No appointment link</MenuItem>
                              {allBookings.slice(0, 12).map((row) => (
                                <MenuItem key={row.id} value={String(row.id)}>
                                  #{row.id} • {formatApptWhen(row, timezone)}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <TextField
                            fullWidth
                            label="Summary"
                            value={sessionForm.summary}
                            onChange={(event) => setSessionForm((prev) => ({ ...prev, summary: event.target.value }))}
                          />
                          <TextField
                            multiline
                            minRows={2}
                            fullWidth
                            label="Outcome"
                            value={sessionForm.outcome}
                            onChange={(event) => setSessionForm((prev) => ({ ...prev, outcome: event.target.value }))}
                          />
                          <TextField
                            multiline
                            minRows={2}
                            fullWidth
                            label="Follow-up"
                            value={sessionForm.follow_up}
                            onChange={(event) => setSessionForm((prev) => ({ ...prev, follow_up: event.target.value }))}
                          />
                          <Stack direction="row" justifyContent="space-between">
                            <Button variant="text" onClick={loadDetail}>Refresh session notes</Button>
                            <Button variant="contained" onClick={() => handleCreateSessionNote()} disabled={savingSession}>
                              {savingSession ? "Saving..." : "Add session note"}
                            </Button>
                          </Stack>
                        </Stack>
                      </SectionCard>
                    </Grid>
                  </Grid>
                </Stack>
              </SectionAccordion>

              <SectionAccordion
                title="Documents"
                description="Consent forms, treatment plans, invoice support files, and other client documents."
                icon={<FolderOpenOutlinedIcon color="primary" />}
                expanded={detailSections.documents}
                onChange={toggleSection("documents")}
              >
                <Stack spacing={2}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} lg={7}>
                      <SectionCard title="Upload document" description="Keep client files in one place without leaving Client 360.">
                        <Stack spacing={1.5}>
                          {documentsError ? <Alert severity="error">{documentsError}</Alert> : null}
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                              <Button
                                component="label"
                                variant="outlined"
                                startIcon={<UploadFileOutlinedIcon />}
                                fullWidth
                                disabled={documentUploading}
                                sx={{ justifyContent: "flex-start", py: 1.4 }}
                              >
                                {documentFile ? documentFile.name : "Choose file"}
                                <input
                                  hidden
                                  type="file"
                                  onChange={(event) => setDocumentFile(event.target.files?.[0] || null)}
                                />
                              </Button>
                            </Grid>
                            <Grid item xs={12} md={3}>
                              <FormControl fullWidth>
                                <InputLabel>Category</InputLabel>
                                <Select
                                  label="Category"
                                  value={documentCategory}
                                  onChange={(event) => setDocumentCategory(event.target.value)}
                                >
                                  {CLIENT_DOCUMENT_CATEGORIES.map(([value, label]) => (
                                    <MenuItem key={value} value={value}>
                                      {label}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={12} md={5}>
                              <TextField
                                fullWidth
                                label="Note (optional)"
                                value={documentNote}
                                onChange={(event) => setDocumentNote(event.target.value)}
                              />
                            </Grid>
                          </Grid>
                          <Stack direction="row" justifyContent="space-between" flexWrap="wrap" useFlexGap>
                            <Typography variant="caption" color="text.secondary">
                              Upload supported files, then keep them attached to this client profile.
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                              <Button variant="text" onClick={loadDocuments} disabled={documentsLoading || documentUploading}>
                                Refresh documents
                              </Button>
                              <Button
                                variant="contained"
                                onClick={handleUploadDocument}
                                disabled={!documentFile || documentUploading}
                              >
                                {documentUploading ? "Uploading..." : "Upload document"}
                              </Button>
                            </Stack>
                          </Stack>
                        </Stack>
                      </SectionCard>
                    </Grid>
                    <Grid item xs={12} lg={5}>
                      <SectionCard title="Request document from client" description="Send a secure upload link to the client and track the response here.">
                        <Stack spacing={1.5}>
                          {documentRequestsError ? <Alert severity="error">{documentRequestsError}</Alert> : null}
                          <Typography variant="body2" color="text.secondary">
                            Reuse the existing secure document-request flow without requiring client login.
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {CLIENT_DOCUMENT_REQUEST_TEMPLATES.filter((template) => Boolean(template.quickLabel)).map((template) => (
                              <Button
                                key={template.key}
                                size="small"
                                variant="outlined"
                                onClick={() => openRequestDocumentPreset(template)}
                              >
                                {template.quickLabel}
                              </Button>
                            ))}
                          </Stack>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Button variant="contained" onClick={() => openRequestDocumentPreset()}>
                              Request document
                            </Button>
                            <Button variant="text" onClick={loadDocumentRequests} disabled={documentRequestsLoading || requestDocumentSaving}>
                              Refresh requests
                            </Button>
                          </Stack>
                        </Stack>
                      </SectionCard>
                    </Grid>
                  </Grid>

                  <SectionCard title="Stored documents" description="Open, download, or remove client files.">
                    {documentsLoading ? (
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 1 }}>
                        <CircularProgress size={18} />
                        <Typography color="text.secondary">Loading client documents...</Typography>
                      </Stack>
                    ) : null}
                    {!documentsLoading ? (
                      <PagedStackList
                        items={sortedDocuments}
                        initialVisible={4}
                        renderItem={(row) => (
                          <Paper key={`client-document-${row.id}`} variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                            <Stack spacing={1.1}>
                              <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between">
                                <Stack spacing={0.5}>
                                  <Typography fontWeight={700}>{row.original_filename || "Document"}</Typography>
                                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                    <Chip
                                      size="small"
                                      label={getClientDocumentCategoryLabel(row.category)}
                                      variant="outlined"
                                      sx={readableChipSx("info")}
                                    />
                                    {row.scan_status ? (
                                      <Chip
                                        size="small"
                                        label={formatStatusLabel(row.scan_status)}
                                        variant="outlined"
                                        sx={readableChipSx(statusTone(row.scan_status))}
                                      />
                                    ) : null}
                                  </Stack>
                                </Stack>
                                <Typography variant="body2" color="text.secondary">
                                  {formatDateTime(row.created_at, timezone)}
                                </Typography>
                              </Stack>
                              {row.note ? <ExpandableText text={row.note} limit={180} /> : null}
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<DownloadOutlinedIcon />}
                                  component="a"
                                  href={row.download_url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Open / download
                                </Button>
                                <Button
                                  size="small"
                                  color="error"
                                  variant="text"
                                  startIcon={<DeleteOutlineOutlinedIcon />}
                                  onClick={() => handleDeleteDocument(row.id)}
                                  disabled={deletingDocumentId === row.id}
                                >
                                  {deletingDocumentId === row.id ? "Removing..." : "Remove"}
                                </Button>
                              </Stack>
                            </Stack>
                          </Paper>
                        )}
                        empty={(
                          <EmptyStateCard
                            title="No documents yet"
                            description="Upload a file or request one from the client."
                            primaryAction={(
                              <Button component="label" variant="contained" size="small" startIcon={<UploadFileOutlinedIcon />}>
                                Choose file
                                <input
                                  hidden
                                  type="file"
                                  onChange={(event) => setDocumentFile(event.target.files?.[0] || null)}
                                />
                              </Button>
                            )}
                          />
                        )}
                      />
                    ) : null}
                  </SectionCard>

                  <SectionCard title="Requested documents" description="See pending, uploaded, expired, or cancelled requests.">
                    {documentRequestsLoading ? (
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 1 }}>
                        <CircularProgress size={18} />
                        <Typography color="text.secondary">Loading document requests...</Typography>
                      </Stack>
                    ) : null}
                    {!documentRequestsLoading ? (
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Pending requests
                          </Typography>
                          <PagedStackList
                            items={pendingDocumentRequests}
                            initialVisible={4}
                            renderItem={(row) => {
                              const stateMeta = documentRequestStateMeta(row);
                              return (
                                <Paper key={`client-document-request-pending-${row.id}`} variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                                  <Stack spacing={1.1}>
                                    <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between">
                                      <Stack spacing={0.5}>
                                        <Typography fontWeight={700}>{row.title || "Document request"}</Typography>
                                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                          <Chip size="small" label={stateMeta.label} variant="outlined" sx={readableChipSx(stateMeta.tone)} />
                                          {row.requested_category ? (
                                            <Chip size="small" label={getClientDocumentCategoryLabel(row.requested_category)} variant="outlined" sx={readableChipSx("info")} />
                                          ) : null}
                                          {requestTemplateLabels[row.id] ? (
                                            <Chip size="small" label={`Template: ${requestTemplateLabels[row.id]}`} variant="outlined" sx={readableChipSx("default")} />
                                          ) : null}
                                        </Stack>
                                      </Stack>
                                      <Stack alignItems={{ xs: "flex-start", md: "flex-end" }} spacing={0.5}>
                                        <Typography variant="body2" color="text.secondary">
                                          Requested {formatDateTime(row.created_at, timezone)}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          Expires {row.expires_at ? formatDateTime(row.expires_at, timezone) : "—"}
                                        </Typography>
                                      </Stack>
                                    </Stack>
                                    {row.message ? <ExpandableText text={row.message} limit={180} /> : null}
                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                      {row.upload_url ? (
                                        <Button
                                          size="small"
                                          variant="contained"
                                          startIcon={<ContentCopyOutlinedIcon />}
                                          onClick={() => copyText(row.upload_url, enqueueSnackbar, "Upload link copied.")}
                                        >
                                          Copy upload link
                                        </Button>
                                      ) : null}
                                      <Button
                                        size="small"
                                        color="error"
                                        variant="text"
                                        onClick={() => handleCancelDocumentRequest(row.id)}
                                        disabled={cancellingRequestId === row.id}
                                      >
                                        {cancellingRequestId === row.id ? "Cancelling..." : "Cancel request"}
                                      </Button>
                                    </Stack>
                                  </Stack>
                                </Paper>
                              );
                            }}
                            empty={<Typography color="text.secondary">No pending document requests.</Typography>}
                          />
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Completed and past requests
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                            Returned documents appear in the document vault.
                          </Typography>
                          <PagedStackList
                            items={completedDocumentRequests}
                            initialVisible={4}
                            renderItem={(row) => {
                              const stateMeta = documentRequestStateMeta(row);
                              return (
                                <Paper key={`client-document-request-history-${row.id}`} variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                                  <Stack spacing={1.1}>
                                    <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between">
                                      <Stack spacing={0.5}>
                                        <Typography fontWeight={700}>{row.title || "Document request"}</Typography>
                                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                          <Chip size="small" label={stateMeta.label} variant="outlined" sx={readableChipSx(stateMeta.tone)} />
                                          {row.requested_category ? (
                                            <Chip size="small" label={getClientDocumentCategoryLabel(row.requested_category)} variant="outlined" sx={readableChipSx("info")} />
                                          ) : null}
                                          {requestTemplateLabels[row.id] ? (
                                            <Chip size="small" label={`Template: ${requestTemplateLabels[row.id]}`} variant="outlined" sx={readableChipSx("default")} />
                                          ) : null}
                                        </Stack>
                                      </Stack>
                                      <Stack alignItems={{ xs: "flex-start", md: "flex-end" }} spacing={0.5}>
                                        <Typography variant="body2" color="text.secondary">
                                          Requested {formatDateTime(row.created_at, timezone)}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          Expires {row.expires_at ? formatDateTime(row.expires_at, timezone) : "—"}
                                        </Typography>
                                        {row.uploaded_at ? (
                                          <Typography variant="caption" color="text.secondary">
                                            Uploaded {formatDateTime(row.uploaded_at, timezone)}
                                          </Typography>
                                        ) : null}
                                      </Stack>
                                    </Stack>
                                    {row.message ? <ExpandableText text={row.message} limit={180} /> : null}
                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                      {row.upload_url ? (
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          startIcon={<ContentCopyOutlinedIcon />}
                                          onClick={() => copyText(row.upload_url, enqueueSnackbar, "Upload link copied.")}
                                        >
                                          Copy upload link
                                        </Button>
                                      ) : null}
                                      {row.uploaded_document?.download_url ? (
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          component="a"
                                          href={row.uploaded_document.download_url}
                                          target="_blank"
                                          rel="noreferrer"
                                          startIcon={<DownloadOutlinedIcon />}
                                        >
                                          Open uploaded file
                                        </Button>
                                      ) : null}
                                    </Stack>
                                  </Stack>
                                </Paper>
                              );
                            }}
                            empty={<Typography color="text.secondary">Returned documents appear in the document vault.</Typography>}
                          />
                        </Box>
                        {!sortedDocumentRequests.length ? (
                          <EmptyStateCard
                            title="No document requests yet"
                            description="Request a document from the client and track the upload status here."
                            primaryAction={(
                              <Button variant="contained" size="small" onClick={() => openRequestDocumentPreset()}>
                                Request document
                              </Button>
                            )}
                          />
                        ) : null}
                      </Stack>
                    ) : null}
                  </SectionCard>
                </Stack>
              </SectionAccordion>

              <SectionAccordion
                title="Timeline"
                description="Compact activity stream across booking, finance, work orders, and notes."
                icon={<TimelineOutlinedIcon color="primary" />}
                expanded={detailSections.timeline}
                onChange={toggleSection("timeline")}
              >
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {[
                      ["all", "All"],
                      ["bookings", "Bookings"],
                      ["finance", "Finance"],
                      ["work_orders", "Work orders"],
                      ["emails", "Emails"],
                      ["notes", "Notes"],
                    ].map(([key, label]) => (
                      <Chip
                        key={key}
                        label={label}
                        color={timelineFilter === key ? "primary" : "default"}
                        variant={timelineFilter === key ? "filled" : "outlined"}
                        onClick={() => setTimelineFilter(key)}
                      />
                    ))}
                  </Stack>
                  <PagedStackList
                    items={filteredTimeline.slice(0, 40)}
                    initialVisible={8}
                    showMoreLabel="Show more activity"
                    showLessLabel="Show less activity"
                    renderItem={(item) => <ClientTimeline items={[item]} timezone={timezone} />}
                  />
                </Stack>
              </SectionAccordion>

              <SectionAccordion
                title="Insights"
                description="Keep analytics visible without making it the main focus."
                icon={<PaymentsOutlinedIcon color="primary" />}
                expanded={detailSections.insights}
                onChange={toggleSection("insights")}
              >
                <TrendCharts detail={detail} />
              </SectionAccordion>
            </>
          ) : null}
        </Stack>

        <ClientEditorDialog
          open={editingClient}
          onClose={() => setEditingClient(false)}
          initialValues={profile}
          onSubmit={handleSaveClient}
          saving={savingClient}
        />
        <ConfirmClientDialog
          open={archiveOpen}
          onClose={() => setArchiveOpen(false)}
          onConfirm={handleArchiveClient}
          saving={savingClient}
          title="Archive client"
          body={`Archive ${getClientDisplayName(profile)} so it no longer appears in the active client list? Existing bookings and finance records will remain intact.`}
          confirmLabel="Archive client"
          confirmColor="warning"
        />
        <ConfirmClientDialog
          open={restoreOpen}
          onClose={() => setRestoreOpen(false)}
          onConfirm={handleRestoreClient}
          saving={savingClient}
          title="Restore client"
          body={`Restore ${getClientDisplayName(profile)} to the active client list?`}
          confirmLabel="Restore client"
          confirmColor="success"
        />
        <Client360CollectPaymentDialog
          open={Boolean(collectDialogBooking)}
          booking={collectDialogBooking}
          clientProfile={profile}
          onClose={() => setCollectDialogBooking(null)}
          onSuccess={async (bookingId) => {
            const [detailPayload] = await Promise.all([loadDetail(), loadList()]);
            if (bookingId && detailPayload) {
              const refreshedBookings = [
                ...(detailPayload?.bookings?.upcoming || []),
                ...(detailPayload?.bookings?.past || []),
              ];
              const nextBooking = refreshedBookings.find((row) => String(row.id) === String(bookingId));
              if (nextBooking) {
                setCollectDialogBooking(nextBooking);
              }
            }
            return detailPayload;
          }}
        />
        <OfflinePaymentDialog
          open={Boolean(offlineBooking)}
          booking={offlineBooking}
          saving={offlineSaving}
          onClose={() => setOfflineBooking(null)}
          onConfirm={handleMarkBookingPaidOffline}
        />
        <QuickNoteDialog
          open={detailQuickNoteOpen}
          client={{ display_name: getClientDisplayName(profile), client: profile }}
          saving={savingNote}
          onClose={() => setDetailQuickNoteOpen(false)}
          onSubmit={handleCreateNote}
        />
        <QuickSessionDialog
          open={detailQuickSessionOpen}
          client={{ display_name: getClientDisplayName(profile), client: profile }}
          bookings={allBookings}
          saving={savingSession}
          onClose={() => setDetailQuickSessionOpen(false)}
          onSubmit={handleCreateSessionNote}
        />
        <QuickEmailDialog
          open={detailQuickEmailOpen}
          client={{ display_name: getClientDisplayName(profile), client: profile }}
          saving={sendingEmail}
          initialForm={detailEmailDraft}
          onClose={() => {
            setDetailQuickEmailOpen(false);
            setDetailEmailDraft(null);
          }}
          onSubmit={handleSendEmail}
        />
        <RequestDocumentDialog
          open={requestDocumentOpen}
          saving={requestDocumentSaving}
          initialValues={requestDocumentDraft}
          onClose={() => {
            setRequestDocumentOpen(false);
            setRequestDocumentDraft(null);
          }}
          onSubmit={handleCreateDocumentRequest}
        />
      </ManagementFrame>
    );
  }

  return (
    <ManagementFrame
      title="Clients"
      subtitle="Open one client and manage bookings, billing, notes, and work orders in one place."
      fullWidth
      contentVariant={false}
    >
      <Stack spacing={2.5}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FinanceMetricCard label="Clients" value={String(pageMetrics.total)} helper="Current result set across active or archived filters." accent="primary" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FinanceMetricCard label="With upcoming bookings" value={String(pageMetrics.withUpcoming)} helper="Clients who still have upcoming appointment activity." accent="success" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FinanceMetricCard label="With open invoices" value={String(pageMetrics.withOpenInvoices)} helper="Clients who still need billing follow-up." accent="warning" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FinanceMetricCard label="Portal linked" value={String(pageMetrics.withLogins)} helper="Clients already linked to a portal login." accent="info" />
          </Grid>
        </Grid>

        <SectionCard title="Client directory" description="Search by name, email, or phone. Open a client profile to manage bookings, billing, notes, and work orders.">
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <TextField
                fullWidth
                size="small"
                label="Search clients"
                placeholder="Name, email, or phone"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") loadList();
                }}
              />
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={status}
                  label="Status"
                  onChange={(event) => {
                    setStatus(event.target.value);
                    setPage(1);
                  }}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                  <MenuItem value="all">All</MenuItem>
                </Select>
              </FormControl>
              <Button variant="contained" onClick={() => setCreateClientOpen(true)}>Add client</Button>
              <Button variant="outlined" onClick={loadList}>Refresh</Button>
            </Stack>

            {listLoading ? <CircularProgress size={28} /> : null}
            {listError ? <Alert severity="error">{listError}</Alert> : null}
            {!listLoading && !listError && !listItems.length ? (
              <Typography color="text.secondary">No clients matched the current search and status filters.</Typography>
            ) : null}
            {!!listItems.length ? <Client360ListTable rows={listItems} onOpen={handleOpenClient} onQuickNote={setListQuickNoteTarget} /> : null}
            <FinancePagination
              pagination={pagination}
              page={page}
              perPage={perPage}
              onPageChange={setPage}
              onPerPageChange={(next) => {
                setPerPage(next);
                setPage(1);
              }}
            />
          </Stack>
        </SectionCard>

        <QuickNoteDialog
          open={Boolean(listQuickNoteTarget)}
          client={listQuickNoteTarget}
          saving={listQuickNoteSaving}
          onClose={() => setListQuickNoteTarget(null)}
          onSubmit={handleListQuickNote}
        />
        <ClientQuickCreateDialog
          open={createClientOpen}
          onClose={() => setCreateClientOpen(false)}
          onSubmit={handleCreateClient}
          form={createClientForm}
          setForm={setCreateClientForm}
          loading={createClientSaving}
          title="Add client"
          description="Create the client profile used for bookings, notes, invoices, and work orders."
          submitLabel="Create client"
        />
      </Stack>
    </ManagementFrame>
  );
}
