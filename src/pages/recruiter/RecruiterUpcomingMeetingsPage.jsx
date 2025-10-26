import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Stack,
  Paper,
  Typography,
  Alert,
  Button,
  Divider,
  CircularProgress,
  Avatar,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import GroupsIcon from "@mui/icons-material/Groups";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LaunchIcon from "@mui/icons-material/Launch";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import axios from "axios";
import { useSnackbar } from "notistack";

import ManagementFrame from "../../components/ui/ManagementFrame";
import RecruiterTabs from "../../components/recruiter/RecruiterTabs";

const formatRange = (startIso, endIso, formatter, timezone) => {
  if (!startIso) return "";
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return "";
  const end = endIso ? new Date(endIso) : null;
  const dateLabel = formatter.date.format(start);
  const startLabel = formatter.time.format(start);
  const endLabel = end && !Number.isNaN(end.getTime()) ? formatter.time.format(end) : "";
  const range = endLabel ? `${startLabel} – ${endLabel}` : startLabel;
  return `${dateLabel}, ${range}${timezone ? ` (${timezone})` : ""}`;
};

const mapBlocks = (blocks = []) =>
  blocks
    .map((block) => {
      const startIso =
        block.start ||
        (block.date && block.start_time ? `${block.date}T${block.start_time}` : null);
      const endIso =
        block.end ||
        (block.date && block.end_time ? `${block.date}T${block.end_time}` : null);
      if (!startIso) return null;
      const startDate = new Date(startIso);
      if (Number.isNaN(startDate.getTime())) return null;
      return {
        ...block,
        startIso,
        endIso,
        startDate,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.startDate - b.startDate);

const RecruiterUpcomingMeetingsPage = ({ token }) => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const [candidateBlocks, setCandidateBlocks] = useState([]);
  const [clientBlocks, setClientBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const dateFormatter = useMemo(
    () => ({
      date: new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }),
      time: new Intl.DateTimeFormat(undefined, { timeStyle: "short" }),
    }),
    []
  );

  const frontendOrigin = typeof window !== "undefined" ? window.location.origin : "";

  const fetchMeetings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/my-availability`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCandidateBlocks(mapBlocks(data.candidate_blocks));
      setClientBlocks(mapBlocks(data.appointment_blocks));
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load upcoming meetings.");
    } finally {
      setLoading(false);
    }
  }, [API_URL, token]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const handleCopyLink = useCallback(
    (link) => {
      if (!link) return;
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard
          .writeText(link)
          .then(() => enqueueSnackbar("Cancellation link copied", { variant: "success" }))
          .catch(() => enqueueSnackbar(link, { variant: "info" }));
      } else {
        enqueueSnackbar(link, { variant: "info" });
      }
    },
    [enqueueSnackbar]
  );

  const renderCandidateCard = (block) => {
    const cancelHref =
      block.cancellation_token && frontendOrigin
        ? `${frontendOrigin}/cancel-booking?token=${block.cancellation_token}`
        : null;
    const timeRange = formatRange(block.startIso, block.endIso, dateFormatter, block.timezone);

    return (
      <Box key={block.id ?? `${block.startIso}_${block.candidate_email}`}>
        <Stack spacing={1.5}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <Stack spacing={0.5}>
              <Typography variant="subtitle1" fontWeight={600}>
                {block.candidate_name || block.candidate_email || "Candidate"}
              </Typography>
              {block.candidate_position && (
                <Typography variant="body2" color="text.secondary">
                  {block.candidate_position}
                </Typography>
              )}
            </Stack>
            {timeRange && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ color: "text.secondary" }}>
                <AccessTimeIcon fontSize="small" />
                <Typography variant="body2">{timeRange}</Typography>
              </Stack>
            )}
          </Stack>
          <Stack spacing={0.75}>
            {block.candidate_email && (
              <Stack direction="row" spacing={1} alignItems="center">
                <EmailIcon fontSize="small" color="primary" />
                <Typography variant="body2">{block.candidate_email}</Typography>
              </Stack>
            )}
            {block.candidate_phone && (
              <Stack direction="row" spacing={1} alignItems="center">
                <PhoneIcon fontSize="small" color="primary" />
                <Typography variant="body2">{block.candidate_phone}</Typography>
              </Stack>
            )}
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {block.candidate_email && (
              <Button
                size="small"
                variant="contained"
                endIcon={<LaunchIcon fontSize="small" />}
                href={`/recruiter/candidates/${encodeURIComponent(block.candidate_email)}`}
              >
                View Candidate
              </Button>
            )}
            {block.meeting_link && (
              <Button
                size="small"
                variant="outlined"
                component="a"
                href={block.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<LaunchIcon fontSize="small" />}
              >
                Join Meeting
              </Button>
            )}
            {cancelHref && (
              <Button
                size="small"
                color="inherit"
                startIcon={<ContentCopyIcon fontSize="small" />}
                onClick={() => handleCopyLink(cancelHref)}
              >
                Copy Cancel Link
              </Button>
            )}
          </Stack>
        </Stack>
      </Box>
    );
  };

  const renderClientCard = (block) => {
    const timeRange = formatRange(block.startIso, block.endIso, dateFormatter, block.timezone);
    return (
      <Box key={block.id ?? `${block.startIso}_${block.candidate_email}`}>
        <Stack spacing={1.5}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <Typography variant="subtitle1" fontWeight={600}>
              {block.candidate_name || block.candidate_email || "Client"}
            </Typography>
            {timeRange && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ color: "text.secondary" }}>
                <AccessTimeIcon fontSize="small" />
                <Typography variant="body2">{timeRange}</Typography>
              </Stack>
            )}
          </Stack>
          <Stack spacing={0.75}>
            {block.candidate_email && (
              <Stack direction="row" spacing={1} alignItems="center">
                <EmailIcon fontSize="small" color="secondary" />
                <Typography variant="body2">{block.candidate_email}</Typography>
              </Stack>
            )}
            {block.status && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Status: {block.status}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Stack>
      </Box>
    );
  };

  return (
    <ManagementFrame
      title="Upcoming Meetings"
      subtitle="Stay ahead of scheduled candidate interviews and client appointments."
    >
      <RecruiterTabs localTab="upcoming-meetings" />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={3}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, md: 3 },
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
            }}
          >
            <Stack spacing={3}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack spacing={0.5}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Upcoming Candidate Interviews
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Keep your recruiting team ahead of the next conversations.
                  </Typography>
                </Stack>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.15),
                    color: theme.palette.primary.main,
                    width: 48,
                    height: 48,
                  }}
                >
                  <CalendarMonthIcon />
                </Avatar>
              </Stack>
              {candidateBlocks.length ? (
                <Stack
                  spacing={2.5}
                  divider={<Divider flexItem sx={{ borderColor: alpha(theme.palette.primary.main, 0.12) }} />}
                >
                  {candidateBlocks.map(renderCandidateCard)}
                </Stack>
              ) : (
                <Alert severity="info" variant="outlined">
                  No upcoming candidate interviews.
                </Alert>
              )}
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, md: 3 },
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.18)}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
            }}
          >
            <Stack spacing={3}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack spacing={0.5}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Upcoming Client Appointments
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    See who your recruiting team is meeting next.
                  </Typography>
                </Stack>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.secondary.main, 0.15),
                    color: theme.palette.secondary.main,
                    width: 48,
                    height: 48,
                  }}
                >
                  <GroupsIcon />
                </Avatar>
              </Stack>
              {clientBlocks.length ? (
                <Stack
                  spacing={2.5}
                  divider={<Divider flexItem sx={{ borderColor: alpha(theme.palette.secondary.main, 0.12) }} />}
                >
                  {clientBlocks.map(renderClientCard)}
                </Stack>
              ) : (
                <Alert severity="info" variant="outlined">
                  No upcoming client appointments.
                </Alert>
              )}
            </Stack>
          </Paper>
        </Stack>
      )}
    </ManagementFrame>
  );
};

export default RecruiterUpcomingMeetingsPage;
