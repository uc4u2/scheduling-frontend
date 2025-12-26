import React, { useEffect, useMemo, useState } from "react";
import { Box, Grid, Paper, Stack, Typography, Chip, Divider, Avatar } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PeopleIcon from "@mui/icons-material/People";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import HotelIcon from "@mui/icons-material/Hotel";
import api from "../../../utils/api";
import ManagementFrame from "../../../components/ui/ManagementFrame";

const formatRangeLabel = (startIso, endIso, tz) => {
  if (!startIso) return "—";
  const start = new Date(startIso);
  const end = endIso ? new Date(endIso) : null;
  if (Number.isNaN(start.getTime())) return "—";
  const fmtDate = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: tz || undefined });
  const fmtTime = new Intl.DateTimeFormat(undefined, { timeStyle: "short", timeZone: tz || undefined });
  const dateLabel = fmtDate.format(start);
  const range = end ? `${fmtTime.format(start)} – ${fmtTime.format(end)}` : fmtTime.format(start);
  return `${dateLabel}, ${range}${tz ? ` (${tz})` : ""}`;
};

const KPI = ({ icon, label, value, sub }) => (
  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box
        sx={(theme) => ({
          width: 44,
          height: 44,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          bgcolor: alpha(theme.palette.primary.main, 0.12),
          color: theme.palette.primary.main,
        })}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="subtitle2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={800}>
          {value}
        </Typography>
        {sub && (
          <Typography variant="caption" color="text.secondary">
            {sub}
          </Typography>
        )}
      </Box>
    </Stack>
  </Paper>
);

const ShiftMonitoringDashboard = ({ token }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [appointmentBlocks, setAppointmentBlocks] = useState([]);
  const [leaveBlocks, setLeaveBlocks] = useState([]);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api
      .get("/my-availability")
      .then((res) => {
        setAppointmentBlocks(res.data?.appointment_blocks || []);
        setLeaveBlocks(res.data?.leave_blocks || []);
        setError("");
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Failed to load shift data");
      })
      .finally(() => setLoading(false));
  }, [token]);

  const now = useMemo(() => new Date(), []);

  const computed = useMemo(() => {
    const todaysBlocks = appointmentBlocks.filter((b) => (b.date || "").startsWith(todayStr));
    const working = [];
    const startingSoon = [];
    const completed = [];

    todaysBlocks.forEach((b) => {
      const start = new Date(b.start);
      const end = b.end ? new Date(b.end) : null;
      if (Number.isNaN(start.getTime())) return;
      if (end && now > end) {
        completed.push(b);
      } else if (now >= start && (!end || now <= end)) {
        working.push(b);
      } else if (start > now && start.getTime() - now.getTime() <= 60 * 60 * 1000) {
        startingSoon.push(b);
      }
    });

    const leaveCount = leaveBlocks.length;
    const totalToday = working.length + startingSoon.length + completed.length;

    return {
      working,
      startingSoon,
      completed,
      leaveCount,
      totalToday,
    };
  }, [appointmentBlocks, leaveBlocks, now, todayStr]);

  const leaveByType = useMemo(() => {
    const out = {};
    (leaveBlocks || []).forEach((l) => {
      const key = (l.type || "Leave").toString();
      out[key] = (out[key] || 0) + 1;
    });
    return out;
  }, [leaveBlocks]);

  return (
    <ManagementFrame title="Shift Monitoring" subtitle="Who is on, who is off, and coverage at a glance.">
      {error && (
        <Paper sx={{ p: 2, mb: 2, borderRadius: 2, border: "1px solid", borderColor: "error.light", bgcolor: alpha(theme.palette.error.main, 0.06) }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPI icon={<PeopleIcon />} label="On shift now" value={computed.working.length} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPI icon={<AccessTimeIcon />} label="Starting soon (≤1h)" value={computed.startingSoon.length} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPI icon={<HotelIcon />} label="On leave today" value={computed.leaveCount} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPI icon={<EventAvailableIcon />} label="Shifts today (total)" value={computed.totalToday} />
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider", mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
          Leave spotlight (today)
        </Typography>
        {Object.keys(leaveByType).length === 0 ? (
          <Typography color="text.secondary">No one on leave.</Typography>
        ) : (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {Object.entries(leaveByType).map(([k, v]) => (
              <Chip key={k} label={`${k}: ${v}`} color="primary" variant="outlined" />
            ))}
          </Stack>
        )}
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          Working now
        </Typography>
        {computed.working.length === 0 && <Typography color="text.secondary">No one on shift right now.</Typography>}
        <Stack spacing={2}>
          {computed.working.map((b) => (
            <Stack key={b.id} direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between">
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar
                  src={b.profile_image_url || undefined}
                  alt={b.recruiter_name || b.candidate_name || "Employee"}
                  sx={{ width: 40, height: 40 }}
                >
                  {(b.recruiter_name || b.candidate_name || "E").charAt(0)}
                </Avatar>
                <Stack spacing={0.4}>
                  <Typography fontWeight={600}>{b.candidate_name || b.recruiter_name || b.candidate_email || "Employee"}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatRangeLabel(b.start, b.end, b.timezone)}
                  </Typography>
                </Stack>
              </Stack>
              <Chip label={b.status || "booked"} color="success" />
            </Stack>
          ))}
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          Starting soon (≤ 60 min)
        </Typography>
        {computed.startingSoon.length === 0 && <Typography color="text.secondary">No one starting in the next hour.</Typography>}
        <Stack spacing={2}>
          {computed.startingSoon.map((b) => (
            <Stack key={b.id} direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between">
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar
                  src={b.profile_image_url || undefined}
                  alt={b.recruiter_name || b.candidate_name || "Employee"}
                  sx={{ width: 40, height: 40 }}
                >
                  {(b.recruiter_name || b.candidate_name || "E").charAt(0)}
                </Avatar>
                <Stack spacing={0.4}>
                  <Typography fontWeight={600}>{b.candidate_name || b.recruiter_name || b.candidate_email || "Employee"}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatRangeLabel(b.start, b.end, b.timezone)}
                  </Typography>
                </Stack>
              </Stack>
              <Chip label="starting soon" color="warning" />
            </Stack>
          ))}
        </Stack>
      </Paper>
    </ManagementFrame>
  );
};

export default ShiftMonitoringDashboard;
