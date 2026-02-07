import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useLocation } from "react-router-dom";
import api from "../../../utils/api";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { formatDateTimeInTz } from "../../../utils/datetime";
import { getUserTimezone } from "../../../utils/timezone";

const SUBJECT_OPTIONS = [
  "website",
  "booking",
  "payroll",
  "billing",
  "general",
];

const statusLabel = (status) =>
  status ? status.replace(/_/g, " ") : "new";

const formatDate = (value, tz) => formatDateTimeInTz(value, tz);

export default function ManagerTicketsView() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailMeta, setDetailMeta] = useState({ has_more: false, next_before: null });
  const [subject, setSubject] = useState("website");
  const [subSubject, setSubSubject] = useState("");
  const [description, setDescription] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [showWebsiteDesignSuccess, setShowWebsiteDesignSuccess] = useState(false);
  const [supportNotice, setSupportNotice] = useState("");
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const timezone = useMemo(() => getUserTimezone(), []);
  const lastMessageId = useMemo(() => {
    const msgs = detail?.messages || [];
    return msgs.length ? msgs[msgs.length - 1].id : null;
  }, [detail?.messages]);

  const selectedTicket = useMemo(
    () => tickets.find((t) => t.id === selectedId) || detail,
    [tickets, selectedId, detail]
  );
  const supportSession = detail?.support_session || null;
  const isWebsiteDesign = (selectedTicket?.type || "").toLowerCase() === "website_design";

  const loadTickets = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/support/tickets");
      setTickets(data?.tickets || []);
      setError("");
    } catch (err) {
      setError("Unable to load tickets.");
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (ticketId, before) => {
    if (!ticketId) return;
    try {
      setDetailLoading(true);
      const params = new URLSearchParams();
      if (before) params.set("before", String(before));
      params.set("limit", "50");
      const query = params.toString();
      const { data } = await api.get(`/api/support/tickets/${ticketId}${query ? `?${query}` : ""}`);
      setDetail(data || null);
      setDetailMeta({
        has_more: Boolean(data?.has_more),
        next_before: data?.next_before || null,
      });
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const mergeMessages = (prevMessages, incoming) => {
    if (!incoming?.length) return prevMessages;
    const seen = new Set((prevMessages || []).map((msg) => msg.id));
    const merged = [...(prevMessages || [])];
    incoming.forEach((msg) => {
      if (!seen.has(msg.id)) {
        merged.push(msg);
        seen.add(msg.id);
      }
    });
    return merged;
  };

  const fetchNewMessages = async () => {
    if (!selectedId || !lastMessageId) return;
    try {
      const { data } = await api.get(
        `/api/support/tickets/${selectedId}?after=${lastMessageId}&limit=200`
      );
      const incoming = data?.messages || [];
      if (incoming.length) {
        setDetail((prev) =>
          prev ? { ...prev, messages: mergeMessages(prev.messages, incoming) } : prev
        );
        await loadTickets();
      }
    } catch {
      // silent poll failure
    }
  };

  useEffect(() => {
    loadTickets();
    const timer = setInterval(loadTickets, 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    const isSuccess = params.get("wd") === "success";
    setShowWebsiteDesignSuccess(isSuccess);
    if (isSuccess) {
      loadTickets();
    }
  }, [location.search]);

  useEffect(() => {
    if (selectedId) {
      loadDetail(selectedId);
    }
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    if ((selectedTicket?.status || "").toLowerCase() === "closed") return;
    const timer = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      fetchNewMessages();
    }, 5000);
    return () => clearInterval(timer);
  }, [selectedId, lastMessageId, selectedTicket?.status]);

  const createTicket = async () => {
    if (!subject || !description.trim()) return;
    try {
      const payload = {
        subject,
        sub_subject: subSubject || undefined,
        description: description.trim(),
      };
      const { data } = await api.post("/api/support/tickets", payload);
      setDescription("");
      setSubSubject("");
      await loadTickets();
      if (data?.id) {
        setSelectedId(data.id);
        setDetail(data);
      }
    } catch {
      setError("Unable to create ticket.");
    }
  };

  const sendMessage = async () => {
    if (!selectedId || !messageBody.trim()) return;
    try {
      const { data } = await api.post(
        `/api/support/tickets/${selectedId}/messages`,
        { body: messageBody.trim() }
      );
      setMessageBody("");
      setDetail((prev) =>
        prev
          ? { ...prev, messages: [...(prev.messages || []), data] }
          : prev
      );
      setDetailMeta((prev) => ({ ...prev, has_more: prev.has_more, next_before: prev.next_before }));
      await loadTickets();
    } catch {
      setError("Unable to send message.");
    }
  };

  const deleteMessage = async (messageId) => {
    if (!selectedId || !messageId) return;
    try {
      const { data } = await api.delete(`/api/support/tickets/${selectedId}/messages/${messageId}`);
      setDetail((prev) => {
        if (!prev) return prev;
        const updated = (prev.messages || []).map((msg) =>
          msg.id === messageId ? { ...msg, ...data } : msg
        );
        return { ...prev, messages: updated };
      });
    } catch (err) {
      const msg = err?.response?.data?.error || "Unable to delete message.";
      setError(msg);
    }
  };

  const approveSupportSession = async () => {
    const sessionId = detail?.support_session?.id;
    if (!sessionId) return;
    try {
      const { data } = await api.get(`/api/support/sessions/${sessionId}/approval-link`);
      if (data?.approval_link) {
        window.location.href = data.approval_link;
        return;
      }
      setError("Unable to open approval link.");
    } catch (err) {
      const msg = err?.response?.data?.error || "Unable to approve support session.";
      setError(msg);
    }
  };

  const loadOlderMessages = async () => {
    if (!selectedId || !detailMeta.next_before) return;
    try {
      const { data } = await api.get(
        `/api/support/tickets/${selectedId}?before=${detailMeta.next_before}&limit=50`
      );
      setDetail((prev) => {
        if (!prev) return prev;
        const older = data?.messages || [];
        return { ...prev, messages: [...older, ...(prev.messages || [])] };
      });
      setDetailMeta({
        has_more: Boolean(data?.has_more),
        next_before: data?.next_before || null,
      });
    } catch {
      setError("Unable to load older messages.");
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Stack spacing={2}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Support Tickets
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Create a ticket for website, booking, payroll, billing, or general help.
          </Typography>
          {showWebsiteDesignSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Payment received. Your Website Design ticket was created. Open it below.
            </Alert>
          )}
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Subject</InputLabel>
              <Select value={subject} label="Subject" onChange={(e) => setSubject(e.target.value)}>
                {SUBJECT_OPTIONS.map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Sub subject (optional)"
              value={subSubject}
              onChange={(e) => setSubSubject(e.target.value)}
            />
          </Stack>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Describe the issue"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mt: 2 }}
          />
          <Button variant="contained" sx={{ mt: 2 }} onClick={createTicket}>
            Create Ticket
          </Button>
          {error && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </Paper>

        <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
          {!isMobile || !selectedTicket ? (
            <Paper sx={{ p: 2, width: { xs: "100%", lg: "35%" } }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Your Tickets
            </Typography>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <List dense>
                {tickets.map((ticket) => (
                  <ListItem key={ticket.id} disablePadding>
                    <ListItemButton
                      selected={selectedId === ticket.id}
                      onClick={() => setSelectedId(ticket.id)}
                    >
                      <ListItemText
                        primary={`${ticket.subject}${ticket.sub_subject ? ` • ${ticket.sub_subject}` : ""}`}
                        secondary={`Status: ${statusLabel(ticket.status)} • ${formatDate(ticket.last_activity_at, timezone)}`}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
                {!tickets.length && (
                  <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
                    No tickets yet.
                  </Typography>
                )}
              </List>
            )}
          </Paper>
          ) : null}

          {(!isMobile || selectedTicket) && (
          <Paper sx={{ p: 2, width: { xs: "100%", lg: "65%" } }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Ticket Detail
            </Typography>
            {isMobile && selectedTicket && (
              <Button
                variant="text"
                size="small"
                onClick={() => setSelectedId(null)}
                sx={{ mt: 1 }}
              >
                Back to tickets
              </Button>
            )}
            {!selectedTicket && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Select a ticket to view messages.
              </Typography>
            )}
            {detailLoading && (
              <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                <CircularProgress size={22} />
              </Box>
            )}
            {selectedTicket && (
              <>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }} alignItems="center">
                  <Typography variant="subtitle2">
                    {selectedTicket.subject}
                  </Typography>
                  <Chip label={statusLabel(selectedTicket.status)} size="small" />
                </Stack>
                <Divider sx={{ my: 2 }} />
                {isWebsiteDesign &&
                  supportSession?.status === "pending" &&
                  !supportSession?.approved_at && (
                    <Alert
                      severity="info"
                      sx={{ mb: 2 }}
                      action={
                        <Button color="inherit" size="small" onClick={approveSupportSession}>
                          Approve website access
                        </Button>
                      }
                    >
                      Support requested access to your website builder. Approve to allow editing for 30 minutes.
                    </Alert>
                  )}
                {supportNotice && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    {supportNotice}
                  </Alert>
                )}
                {detailMeta.has_more && (
                  <Button size="small" onClick={loadOlderMessages} sx={{ mb: 1 }}>
                    Load older messages
                  </Button>
                )}
                <Stack spacing={1} sx={{ maxHeight: 360, overflowY: "auto" }}>
                  {(detail?.messages || []).map((msg) => (
                    <Box key={msg.id} sx={{ p: 1.5, background: "#f6f7f9", borderRadius: 1 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                        <Typography variant="caption" color="text.secondary">
                          {msg.sender_type} • {formatDate(msg.created_at, timezone)}
                        </Typography>
                        {!msg.is_deleted && msg.sender_type === "tenant" && (
                          <IconButton
                            size="small"
                            onClick={() => deleteMessage(msg.id)}
                            aria-label="Delete message"
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Stack>
                      <Typography
                        variant="body2"
                        sx={msg.is_deleted ? { color: "text.secondary", fontStyle: "italic" } : null}
                      >
                        {msg.is_deleted ? "[deleted]" : msg.body}
                      </Typography>
                    </Box>
                  ))}
                  {!detail?.messages?.length && (
                    <Typography variant="body2" color="text.secondary">
                      No messages yet.
                    </Typography>
                  )}
                </Stack>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ position: "sticky", bottom: 0, background: theme.palette.background.paper, pt: 1 }}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    label="Reply"
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    disabled={(selectedTicket.status || "").toLowerCase() === "closed"}
                  />
                  <Button
                    variant="contained"
                    sx={{ mt: 1 }}
                    onClick={sendMessage}
                    disabled={(selectedTicket.status || "").toLowerCase() === "closed"}
                  >
                    Send Message
                  </Button>
                </Box>
              </>
            )}
          </Paper>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
