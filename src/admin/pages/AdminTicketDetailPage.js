import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate, useParams } from "react-router-dom";
import platformAdminApi from "../../api/platformAdminApi";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

const STATUSES = [
  "new",
  "triaged",
  "in_progress",
  "waiting_on_tenant",
  "needs_engineering",
  "solved",
  "closed",
];

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "");

export default function AdminTicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageMeta, setMessageMeta] = useState({ has_more: false, next_before: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [admin, setAdmin] = useState(null);
  const [teamUsers, setTeamUsers] = useState([]);
  const [messageBody, setMessageBody] = useState("");
  const [status, setStatus] = useState("");
  const [assignedAdminId, setAssignedAdminId] = useState("");
  const theme = useTheme();
  const lastMessageId = useMemo(() => {
    return messages.length ? messages[messages.length - 1].id : null;
  }, [messages]);

  const canAssign = admin?.role === "platform_owner" || admin?.role === "platform_admin";
  const supportSession = ticket?.support_session || null;
  const isWebsiteDesign = ticket?.type === "website_design";
  const supportPending = supportSession?.status === "pending";
  const supportActive = supportSession?.status === "active";
  const supportApproved = Boolean(supportSession?.approved_at);

  const loadAdmin = async () => {
    try {
      const { data } = await platformAdminApi.get("/auth/me");
      setAdmin(data || null);
    } catch {
      setAdmin(null);
    }
  };

  const loadTicket = async (before) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (before) params.set("before", String(before));
      params.set("limit", "50");
      const query = params.toString();
      const { data } = await platformAdminApi.get(`/tickets/${id}${query ? `?${query}` : ""}`);
      setTicket(data || null);
      setMessages(data?.messages || []);
      setMessageMeta({
        has_more: Boolean(data?.has_more),
        next_before: data?.next_before || null,
      });
      setStatus(data?.status || "");
      setAssignedAdminId(data?.assigned_admin_id || "");
      setError("");
    } catch (err) {
      setError("Unable to load ticket.");
    } finally {
      setLoading(false);
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
    if (!lastMessageId) return;
    try {
      const { data } = await platformAdminApi.get(
        `/tickets/${id}?after=${lastMessageId}&limit=200`
      );
      const incoming = data?.messages || [];
      if (incoming.length) {
        setMessages((prev) => mergeMessages(prev, incoming));
      }
    } catch {
      // silent poll failure
    }
  };

  const loadTeamUsers = async () => {
    if (!canAssign) return;
    try {
      const { data } = await platformAdminApi.get("/team/users");
      setTeamUsers(data?.users || []);
    } catch {
      setTeamUsers([]);
    }
  };

  useEffect(() => {
    loadAdmin();
  }, []);

  useEffect(() => {
    if (admin) {
      loadTeamUsers();
    }
  }, [admin]);

  useEffect(() => {
    loadTicket();
  }, [id]);

  useEffect(() => {
    if ((ticket?.status || "").toLowerCase() === "closed") return;
    if (!lastMessageId) return;
    const timer = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      fetchNewMessages();
    }, 5000);
    return () => clearInterval(timer);
  }, [lastMessageId, ticket?.status]);

  const sendMessage = async () => {
    if (!messageBody.trim()) return;
    try {
      const { data } = await platformAdminApi.post(`/tickets/${id}/messages`, {
        body: messageBody.trim(),
      });
      setMessages((prev) => [...prev, data]);
      setMessageBody("");
      await loadTicket();
    } catch {
      setError("Unable to send message.");
    }
  };

  const loadOlderMessages = async () => {
    if (!messageMeta.next_before) return;
    try {
      const { data } = await platformAdminApi.get(
        `/tickets/${id}?before=${messageMeta.next_before}&limit=50`
      );
      const older = data?.messages || [];
      setMessages((prev) => [...older, ...prev]);
      setMessageMeta({
        has_more: Boolean(data?.has_more),
        next_before: data?.next_before || null,
      });
    } catch {
      setError("Unable to load older messages.");
    }
  };

  const deleteMessage = async (messageId) => {
    if (!messageId) return;
    try {
      const { data } = await platformAdminApi.delete(`/tickets/${id}/messages/${messageId}`);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, ...data } : msg))
      );
    } catch (err) {
      const msg = err?.response?.data?.error || "Unable to delete message.";
      setError(msg);
    }
  };

  const updateStatus = async (value) => {
    try {
      const { data } = await platformAdminApi.patch(`/tickets/${id}/status`, { status: value });
      setTicket(data);
      setStatus(data.status);
    } catch {
      setError("Unable to update status.");
    }
  };

  const updateAssignment = async (value) => {
    try {
      const payload = { assigned_admin_id: value || null };
      const { data } = await platformAdminApi.patch(`/tickets/${id}/assign`, payload);
      setTicket(data);
      setAssignedAdminId(data.assigned_admin_id || "");
    } catch {
      setError("Unable to assign ticket.");
    }
  };

  const requestSupportSession = async () => {
    try {
      const { data } = await platformAdminApi.post(`/tickets/${id}/support-session/request`, {
        scope: "website_all",
      });
      if (data?.support_session) {
        setTicket((prev) => (prev ? { ...prev, support_session: data.support_session } : prev));
      }
    } catch (err) {
      setError("Unable to request support session.");
    }
  };

  const startSupportSession = async () => {
    try {
      const { data } = await platformAdminApi.post(`/tickets/${id}/support-session/start`);
      if (data?.support_session) {
        setTicket((prev) => (prev ? { ...prev, support_session: data.support_session } : prev));
      }
    } catch (err) {
      const msg = err?.response?.data?.error || "Unable to start support session.";
      setError(msg);
    }
  };

  const endSupportSession = async () => {
    try {
      const { data } = await platformAdminApi.post(`/tickets/${id}/support-session/end`);
      if (data?.support_session) {
        setTicket((prev) => (prev ? { ...prev, support_session: data.support_session } : prev));
      }
    } catch (err) {
      setError("Unable to end support session.");
    }
  };

  const openSupportLink = (path) => {
    if (!supportSession?.id) return;
    const url = `${path}?support_session=${supportSession.id}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!ticket) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Ticket not found.</Typography>
        <Button sx={{ mt: 2 }} variant="outlined" onClick={() => navigate("/admin/tickets")}>
          Back to tickets
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Button variant="outlined" onClick={() => navigate("/admin/tickets")}>
          Back to tickets
        </Button>

        <Paper sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between">
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {ticket.subject}
                {ticket.sub_subject ? ` • ${ticket.sub_subject}` : ""}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Company ID: {ticket.company_id} • Created: {formatDate(ticket.created_at)}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Chip size="small" label={ticket.status?.replace(/_/g, " ")} />
                {ticket.assigned_admin_id ? (
                  <Chip size="small" label={`Assigned ${ticket.assigned_admin_id}`} />
                ) : (
                  <Chip size="small" label="Unassigned" />
                )}
              </Stack>
            </Box>
            <Stack spacing={2} sx={{ minWidth: 220 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={status}
                  onChange={(e) => updateStatus(e.target.value)}
                >
                  {STATUSES.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {canAssign && (
                <FormControl fullWidth>
                  <InputLabel>Assign</InputLabel>
                  <Select
                    label="Assign"
                    value={assignedAdminId}
                    onChange={(e) => updateAssignment(e.target.value)}
                  >
                    <MenuItem value="">Unassigned</MenuItem>
                    {teamUsers.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.email} ({user.role})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Stack>
          </Stack>
        </Paper>

        {isWebsiteDesign && (
          <Paper sx={{ p: 2 }}>
            <Stack spacing={1}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Website support session
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Chip
                  size="small"
                  label={supportSession ? supportSession.status.replace(/_/g, " ") : "no session"}
                />
                {supportSession?.scope && (
                  <Chip size="small" variant="outlined" label={supportSession.scope.replace(/_/g, " ")} />
                )}
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                {!supportSession && (
                  <Button variant="contained" onClick={requestSupportSession}>
                    Request website access
                  </Button>
                )}
                {supportPending && !supportApproved && (
                  <Button variant="outlined" disabled>
                    Awaiting manager approval
                  </Button>
                )}
                {supportPending && supportApproved && (
                  <Button variant="contained" onClick={startSupportSession}>
                    Start support session
                  </Button>
                )}
                {supportActive && (
                  <>
                    <Button variant="outlined" onClick={() => openSupportLink("/manager/website-pages")}>
                      Open Website Manager
                    </Button>
                    <Button variant="outlined" onClick={() => openSupportLink("/manage/website/builder")}>
                      Open Visual Builder
                    </Button>
                    <Button variant="outlined" onClick={() => openSupportLink("/manager/website-pages")}>
                      Open Domain Connect
                    </Button>
                    <Button color="error" variant="contained" onClick={endSupportSession}>
                      End session
                    </Button>
                  </>
                )}
              </Stack>
              {supportApproved && supportSession?.expires_at && (
                <Typography variant="caption" color="text.secondary">
                  Approved until {formatDate(supportSession.expires_at)}
                </Typography>
              )}
            </Stack>
          </Paper>
        )}

        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Messages
          </Typography>
          <Divider sx={{ my: 2 }} />
          {messageMeta.has_more && (
            <Button size="small" onClick={loadOlderMessages} sx={{ mb: 1 }}>
              Load older messages
            </Button>
          )}
          <Stack spacing={1} sx={{ maxHeight: 360, overflowY: "auto" }}>
            {messages.map((msg) => (
              <Box key={msg.id} sx={{ p: 1.5, background: "#f6f7f9", borderRadius: 1 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                  <Typography variant="caption" color="text.secondary">
                    {msg.sender_type} • {formatDate(msg.created_at)}
                  </Typography>
                  {!msg.is_deleted && msg.sender_type === "agent" && (
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
            {!messages.length && (
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
              disabled={(ticket.status || "").toLowerCase() === "closed"}
            />
            <Button
              variant="contained"
              sx={{ mt: 1 }}
              onClick={sendMessage}
              disabled={(ticket.status || "").toLowerCase() === "closed"}
            >
              Send reply
            </Button>
          </Box>
          {error && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </Paper>
      </Stack>
    </Box>
  );
}
