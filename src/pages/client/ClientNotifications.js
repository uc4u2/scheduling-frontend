import React, { useEffect, useState } from "react";
import {
  Box, Typography, IconButton, CircularProgress, Chip, Tooltip, Snackbar, Alert, Stack, Paper, Menu, MenuItem, Button
} from "@mui/material";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import DeleteIcon from "@mui/icons-material/Delete";
import ArchiveIcon from "@mui/icons-material/Archive";
import RefreshIcon from "@mui/icons-material/Refresh";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import axios from "axios";
import dayjs from "dayjs";

const statusColors = {
  unread: "primary",
  read: "default",
  archived: "info"
};

export default function ClientNotifications() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, msg: "", severity: "info" });
  const [filter, setFilter] = useState("all");
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => { fetchData(); }, [filter]);

  function fetchData() {
    setLoading(true);
    let url = "/notifications";
    if (filter !== "all") url += `?status=${filter}`;
    const token = localStorage.getItem("token");
    axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setNotifs(res.data))
      .catch(() => setSnackbar({ open: true, msg: "Failed to load notifications", severity: "error" }))
      .finally(() => setLoading(false));
  }

  const handleMenuOpen = (event, id) => {
    setAnchorEl(event.currentTarget);
    setSelectedId(id);
  };
  const handleMenuClose = () => setAnchorEl(null);

  const handleAction = (action) => {
    let url = `notifications/${selectedId}`;
    let method = "patch";
    let data = {};
    if (action === "read") url += "/read";
    else if (action === "archive") url += "/archive";
    else if (action === "delete") method = "delete";
    else return handleMenuClose();

    const token = localStorage.getItem("token");
    axios({ method, url, data, headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        setSnackbar({ open: true, msg: `Notification ${action}d`, severity: "success" });
        fetchData();
      })
      .catch(() => setSnackbar({ open: true, msg: `Failed to ${action}`, severity: "error" }))
      .finally(handleMenuClose);
  };

  function handleMarkAllRead() {
    const token = localStorage.getItem("token");
    axios.patch("/notifications/mark_all_read", null, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        setSnackbar({ open: true, msg: "All marked as read!", severity: "success" });
        fetchData();
      });
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 2, mb: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Notifications</Typography>
        <Stack direction="row" spacing={1}>
          <Chip
            label="All"
            color={filter === "all" ? "primary" : "default"}
            onClick={() => setFilter("all")}
          />
          <Chip
            label="Unread"
            color={filter === "unread" ? "primary" : "default"}
            onClick={() => setFilter("unread")}
          />
          <Chip
            label="Read"
            color={filter === "read" ? "primary" : "default"}
            onClick={() => setFilter("read")}
          />
          <Chip
            label="Archived"
            color={filter === "archived" ? "primary" : "default"}
            onClick={() => setFilter("archived")}
          />
          <Tooltip title="Refresh">
            <IconButton onClick={fetchData}><RefreshIcon /></IconButton>
          </Tooltip>
          <Tooltip title="Mark all as read">
            <IconButton onClick={handleMarkAllRead}><MarkEmailReadIcon /></IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {loading ? (
        <Box sx={{ textAlign: "center", py: 4 }}><CircularProgress /></Box>
      ) : notifs.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No notifications.</Typography>
      ) : (
        notifs.map(n => (
          <Paper
            key={n.id}
            elevation={n.status === "unread" ? 5 : 1}
            sx={{
              p: 2, mb: 2, bgcolor: n.status === "unread" ? "rgba(25, 118, 210, 0.05)" : undefined,
              borderLeft: n.status === "unread" ? "4px solid #1976d2" : "4px solid transparent"
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Chip label={n.status} color={statusColors[n.status] || "default"} size="small" sx={{ mb: 1 }} />
                <Typography variant="subtitle1">{n.type && `[${n.type}] `}{n.message}</Typography>
                {n.url && <Button href={n.url} size="small" target="_blank" rel="noopener noreferrer">View</Button>}
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                  {dayjs(n.sent_at).format("YYYY-MM-DD HH:mm")}
                </Typography>
              </Box>
              <Box>
                <IconButton onClick={e => handleMenuOpen(e, n.id)}>
                  <MoreVertIcon />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl) && selectedId === n.id}
                  onClose={handleMenuClose}
                >
                  {n.status !== "read" && <MenuItem onClick={() => handleAction("read")}><MarkEmailReadIcon fontSize="small" />Mark as read</MenuItem>}
                  {n.status !== "archived" && <MenuItem onClick={() => handleAction("archive")}><ArchiveIcon fontSize="small" />Archive</MenuItem>}
                  <MenuItem onClick={() => handleAction("delete")}><DeleteIcon fontSize="small" />Delete</MenuItem>
                </Menu>
              </Box>
            </Box>
          </Paper>
        ))
      )}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity}>{snackbar.msg}</Alert>
      </Snackbar>
    </Paper>
  );
}
