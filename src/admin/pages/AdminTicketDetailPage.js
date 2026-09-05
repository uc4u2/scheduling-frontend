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
import { formatDateTimeInTz } from "../../utils/datetime";
import { getUserTimezone } from "../../utils/timezone";
import {
  buildSupportWorkspacePath,
  downloadWebsiteDesignHandoff,
  getSupportCapabilities,
  getWebsiteDesignWorkspaceAction,
} from "../utils/websiteDesignWorkspace";

const BASE_STATUSES = [
  "new",
  "triaged",
  "in_progress",
  "waiting_on_tenant",
  "needs_engineering",
  "solved",
  "closed",
];

const WEBSITE_DESIGN_STATUSES = [
  "new",
  "in_design",
  "revision_requested",
  "ready_for_publish",
  "published",
  "closed",
];

const formatDate = (value, tz) => formatDateTimeInTz(value, tz);

const FALLBACK_SUPPORT_SCOPES = [
  { scope: "website_all", scope_label: "Website and domain" },
  { scope: "website_services", scope_label: "Website, domain, and services" },
  { scope: "website_catalog", scope_label: "Website, services, and products" },
  { scope: "website_commerce", scope_label: "Full website commerce setup" },
];

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
  const [workspaceBusy, setWorkspaceBusy] = useState(false);
  const [workspaceNotice, setWorkspaceNotice] = useState("");
  const [requestedScope, setRequestedScope] = useState("website_all");
  const [supportScopes, setSupportScopes] = useState(FALLBACK_SUPPORT_SCOPES);
  const theme = useTheme();
  const timezone = useMemo(() => getUserTimezone(admin?.timezone), [admin?.timezone]);
  const lastMessageId = useMemo(() => {
    return messages.length ? messages[messages.length - 1].id : null;
  }, [messages]);

  const canAssign = admin?.role === "platform_owner" || admin?.role === "platform_admin";
  const isSupport = admin?.role === "platform_support";
  const isAssignedToMe = Boolean(admin?.id && assignedAdminId && Number(assignedAdminId) === Number(admin.id));
  const supportSession = ticket?.support_session || null;
  const isWebsiteDesign = ticket?.type === "website_design";
  const isWebsiteSubject = (ticket?.subject || "").toLowerCase() === "website";
  const allowWebsiteSupport = isWebsiteDesign || isWebsiteSubject;
  const statusOptions = isWebsiteDesign ? WEBSITE_DESIGN_STATUSES : BASE_STATUSES;
  const supportPending = supportSession?.status === "pending";
  const supportActive = supportSession?.status === "active";
  const supportApproved = Boolean(supportSession?.approved_at);
  const workspaceAction = getWebsiteDesignWorkspaceAction(supportSession);
  const supportCapabilities = useMemo(() => {
    return getSupportCapabilities(supportSession);
  }, [supportSession]);
  const canManageWebsite = supportCapabilities.includes("website_builder");
  const canManageDomain = supportCapabilities.includes("domain_connect");
  const canManageServices = supportCapabilities.includes("services_manage");
  const canManageProducts = supportCapabilities.includes("products_manage");
  const canManageShipping = supportCapabilities.includes("shipping_manage");

  const loadAdmin = async () => {
    try {
      const { data } = await platformAdminApi.get("/auth/me");
      setAdmin(data || null);
    } catch {
      setAdmin(null);
    }
  };

  const loadTicket = async (before, options = {}) => {
    try {
      if (!options.silent) setLoading(true);
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
      if (!options.silent) setError("Unable to load ticket.");
    } finally {
      if (!options.silent) setLoading(false);
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

  const loadSupportScopes = async () => {
    try {
      const { data } = await platformAdminApi.get("/support-session/scopes");
      if (Array.isArray(data?.scopes) && data.scopes.length) {
        setSupportScopes(data.scopes);
      }
    } catch {
      setSupportScopes(FALLBACK_SUPPORT_SCOPES);
    }
  };

  useEffect(() => {
    loadAdmin();
    loadSupportScopes();
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

  useEffect(() => {
    if (!supportPending || supportApproved) return undefined;
    const timer = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      loadTicket(undefined, { silent: true });
    }, 10000);
    return () => clearInterval(timer);
  }, [supportPending, supportApproved, id]);

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
      setTicket((prev) => (prev ? { ...prev, ...data } : data));
      setStatus(data.status);
    } catch {
      setError("Unable to update status.");
    }
  };

  const updateAssignment = async (value) => {
    try {
      const payload = { assigned_admin_id: value || null };
      const { data } = await platformAdminApi.patch(`/tickets/${id}/assign`, payload);
      setTicket((prev) => (prev ? { ...prev, ...data } : data));
      setAssignedAdminId(data.assigned_admin_id || "");
    } catch {
      setError("Unable to assign ticket.");
    }
  };

  const requestSupportSession = async () => {
    try {
      const { data } = await platformAdminApi.post(`/tickets/${id}/support-session/request`, {
        scope: requestedScope,
      });
      if (data?.support_session) {
        setTicket((prev) => (prev ? { ...prev, support_session: data.support_session } : prev));
      }
      return data?.support_session || null;
    } catch (err) {
      setError("Unable to request support session.");
      return null;
    }
  };

  const startSupportSession = async () => {
    try {
      const { data } = await platformAdminApi.post(`/tickets/${id}/support-session/start`);
      if (data?.support_session) {
        setTicket((prev) => (prev ? { ...prev, support_session: data.support_session } : prev));
      }
      return data?.support_session || null;
    } catch (err) {
      const msg = err?.response?.data?.error || "Unable to start support session.";
      setError(msg);
      return null;
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

  const buildSupportLink = (path, session = supportSession) => {
    return buildSupportWorkspacePath(path, session, ticket?.company_id, window.location.origin);
  };

  const openSupportLink = (path, session = supportSession, targetWindow = null) => {
    const url = buildSupportLink(path, session);
    if (!url) return;
    if (targetWindow && !targetWindow.closed) {
      targetWindow.location.replace(url);
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const launchDesignWorkspace = async () => {
    if (workspaceBusy) return;
    setWorkspaceBusy(true);
    setWorkspaceNotice("");
    setError("");
    let pendingWindow = null;
    try {
      if (workspaceAction.kind === "request") {
        const session = await requestSupportSession();
        if (session) {
          setWorkspaceNotice(
            "Access request sent. This panel refreshes automatically after the manager approves it."
          );
        }
        return;
      }
      if (workspaceAction.kind === "waiting") {
        await loadTicket(undefined, { silent: true });
        setWorkspaceNotice("Waiting for the manager's approval. The status refreshes automatically.");
        return;
      }
      if (workspaceAction.kind === "start") {
        pendingWindow = window.open("", "_blank");
        if (pendingWindow) pendingWindow.opener = null;
        const session = await startSupportSession();
        if (!session) {
          if (pendingWindow) pendingWindow.close();
          return;
        }
        const sessionCapabilities = getSupportCapabilities(session);
        const workspacePath = sessionCapabilities.includes("website_builder")
          ? "/manage/website/builder"
          : "/manager/website";
        openSupportLink(workspacePath, session, pendingWindow);
        setWorkspaceNotice("Support workspace started using the manager-approved access session.");
        return;
      }
      if (workspaceAction.kind === "open") {
        openSupportLink(canManageWebsite ? "/manage/website/builder" : "/manager/website");
      }
    } finally {
      setWorkspaceBusy(false);
    }
  };

  const exportAgentHandoff = async () => {
    if (!supportActive || workspaceBusy) return;
    setWorkspaceBusy(true);
    setWorkspaceNotice("");
    setError("");
    try {
      const { data } = await platformAdminApi.post(`/tickets/${id}/support-session/handoff`);
      if (!data?.handoff || !downloadWebsiteDesignHandoff(data.handoff)) {
        throw new Error("missing_handoff");
      }
      setWorkspaceNotice(
        "Agent handoff downloaded. It contains scoped support access; end the session when work is complete."
      );
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to create agent handoff.");
    } finally {
      setWorkspaceBusy(false);
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
                Company ID: {ticket.company_id} • Created: {formatDate(ticket.created_at, timezone)}
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
                  {statusOptions.map((s) => (
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

        {allowWebsiteSupport && (
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
              {(!supportSession || ["ended", "expired"].includes(supportSession.status)) && (
                <FormControl size="small" sx={{ maxWidth: 440 }}>
                  <InputLabel>Requested access</InputLabel>
                  <Select
                    label="Requested access"
                    value={requestedScope}
                    onChange={(event) => setRequestedScope(event.target.value)}
                  >
                    {supportScopes.map((option) => (
                      <MenuItem key={option.scope} value={option.scope}>
                        {option.scope_label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              {supportSession?.scope_description && (
                <Typography variant="body2" color="text.secondary">
                  {supportSession.scope_description}
                </Typography>
              )}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                <Button
                  variant={workspaceAction.kind === "waiting" ? "outlined" : "contained"}
                  disabled={
                    workspaceBusy ||
                    workspaceAction.kind === "waiting" ||
                    workspaceAction.kind === "unavailable"
                  }
                  onClick={launchDesignWorkspace}
                >
                  {workspaceBusy ? "Preparing…" : workspaceAction.label}
                </Button>
                {workspaceAction.kind === "waiting" && (
                  <Button
                    variant="text"
                    disabled={workspaceBusy}
                    onClick={() => loadTicket(undefined, { silent: true })}
                  >
                    Refresh approval status
                  </Button>
                )}
                {supportActive && (
                  <>
                    {canManageWebsite && (
                      <Button variant="outlined" onClick={() => openSupportLink("/manager/website")}>
                        Open Website Manager
                      </Button>
                    )}
                    <Button variant="outlined" onClick={exportAgentHandoff} disabled={workspaceBusy}>
                      Download agent handoff
                    </Button>
                    {canManageDomain && (
                      <Button variant="outlined" onClick={() => openSupportLink("/manager/website")}>
                        Open Domain Connect
                      </Button>
                    )}
                    {canManageServices && (
                      <Button
                        variant="outlined"
                        onClick={() => openSupportLink("/manager/advanced-management?panel=services")}
                      >
                        Open Services
                      </Button>
                    )}
                    {canManageProducts && (
                      <Button
                        variant="outlined"
                        onClick={() => openSupportLink("/manager/advanced-management?panel=products")}
                      >
                        Open Products
                      </Button>
                    )}
                    {canManageShipping && (
                      <Button
                        variant="outlined"
                        onClick={() => openSupportLink("/manager/advanced-management?panel=easypost-shipping")}
                      >
                        Open Delivery setup
                      </Button>
                    )}
                    <Button color="error" variant="contained" onClick={endSupportSession}>
                      End session
                    </Button>
                  </>
                )}
              </Stack>
              {workspaceNotice && (
                <Typography variant="body2" color="text.secondary">
                  {workspaceNotice}
                </Typography>
              )}
              {isSupport && !isAssignedToMe && supportPending && supportApproved && (
                <Typography variant="caption" color="text.secondary">
                  Assign the ticket to yourself before launching the design workspace.
                </Typography>
              )}
              {supportApproved && supportSession?.expires_at && (
                <Typography variant="caption" color="text.secondary">
                  Approved until {formatDate(supportSession.expires_at, timezone)}
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
                    {msg.sender_type} • {formatDate(msg.created_at, timezone)}
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
