// src/pages/manager/JobStatusHistoryDrawer.jsx
import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
  CircularProgress,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { jobOpeningsApi } from "../../utils/jobOpenings";

const fmt = (iso) => {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso);
  }
};

export default function JobStatusHistoryDrawer({ open, job, onClose }) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open || !job?.id) return;
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setErr("");
      try {
        const data = await jobOpeningsApi.statusHistory(job.id);
        const results = Array.isArray(data?.results) ? data.results : [];
        if (mounted) setRows(results);
      } catch (e) {
        if (mounted) setErr(e?.response?.data?.error || e?.message || "Failed to load status history.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [open, job?.id]);

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: 320, sm: 420 }, p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Status history
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {job?.title || "Job"}
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {err && <Alert severity="error">{err}</Alert>}

        {loading ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={18} />
            <Typography color="text.secondary">Loading...</Typography>
          </Stack>
        ) : rows.length === 0 ? (
          <Typography color="text.secondary">No status changes recorded yet.</Typography>
        ) : (
          <List dense>
            {rows.map((r, idx) => (
              <ListItem key={`${r.timestamp || idx}`} divider>
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                      <Chip size="small" label={r.status_from || "-"} />
                      <Typography variant="body2">{"->"}</Typography>
                      <Chip size="small" label={r.status_to || "-"} />
                    </Stack>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {fmt(r.timestamp)} {r.user_id ? `| user ${r.user_id}` : ""}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Drawer>
  );
}
