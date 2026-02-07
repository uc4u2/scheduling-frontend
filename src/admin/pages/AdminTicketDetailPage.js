import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import platformAdminApi from "../../api/platformAdminApi";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [admin, setAdmin] = useState(null);
  const [teamUsers, setTeamUsers] = useState([]);
  const [messageBody, setMessageBody] = useState("");
  const [status, setStatus] = useState("");
  const [assignedAdminId, setAssignedAdminId] = useState("");

  const canAssign = admin?.role === "platform_owner" || admin?.role === "platform_admin";

  const loadAdmin = async () => {
    try {
      const { data } = await platformAdminApi.get("/auth/me");
      setAdmin(data || null);
    } catch {
      setAdmin(null);
    }
  };

  const loadTicket = async () => {
    try {
      setLoading(true);
      const { data } = await platformAdminApi.get(`/tickets/${id}`);
      setTicket(data || null);
      setMessages(data?.messages || []);
      setStatus(data?.status || "");
      setAssignedAdminId(data?.assigned_admin_id || "");
      setError("");
    } catch (err) {
      setError("Unable to load ticket.");
    } finally {
      setLoading(false);
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

        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Messages
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Stack spacing={1} sx={{ maxHeight: 320, overflowY: "auto" }}>
            {messages.map((msg) => (
              <Box key={msg.id} sx={{ p: 1.5, background: "#f6f7f9", borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {msg.sender_type} • {formatDate(msg.created_at)}
                </Typography>
                <Typography variant="body2">{msg.body}</Typography>
              </Box>
            ))}
            {!messages.length && (
              <Typography variant="body2" color="text.secondary">
                No messages yet.
              </Typography>
            )}
          </Stack>
          <Divider sx={{ my: 2 }} />
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
