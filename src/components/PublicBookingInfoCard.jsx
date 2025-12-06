import React, { useMemo } from "react";
import { Box, Paper, Typography, Link, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { isoFromParts } from "../utils/datetime";

const formatBooking = (b) => {
  if (!b || !b.date) return "N/A";
  const tz = b.timezone || "UTC";
  // stored times are UTC; render in the booking's timezone
  const startUtcMs = Date.parse(`${b.date}T${b.start_time || "00:00"}Z`);
  const endUtcMs = b.end_time ? Date.parse(`${b.date}T${b.end_time}Z`) : null;
  const fmtDate = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: tz });
  const fmtTime = new Intl.DateTimeFormat(undefined, { timeStyle: "short", timeZone: tz });
  const start = Number.isNaN(startUtcMs) ? null : new Date(startUtcMs);
  const end = endUtcMs && !Number.isNaN(endUtcMs) ? new Date(endUtcMs) : null;
  if (!start) return `${b.date} ${b.start_time || ""}${b.timezone ? ` (${b.timezone})` : ""}`;
  const range = end ? `${fmtTime.format(start)} – ${fmtTime.format(end)}` : fmtTime.format(start);
  return `${fmtDate.format(start)}, ${range}${b.timezone ? ` (${b.timezone})` : ""}`;
};

const cleanClientNote = (raw) => {
  if (!raw) return "";
  const lines = String(raw)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(
      (l) =>
        l &&
        !l.toLowerCase().startsWith("country/region:") &&
        !l.toLowerCase().startsWith("website:")
    );
  return lines.join("\n");
};

const PublicBookingInfoCard = ({ candidate, publicHistory, publicMeetingLink }) => {
  const theme = useTheme();
  const cd = candidate?.custom_data || {};
  const publicBookings = useMemo(() => {
    if (Array.isArray(publicHistory)) return publicHistory;
    return [];
  }, [publicHistory]);

  const sorted = useMemo(() => {
    return [...publicBookings].sort((a, b) => {
      const tzA = a.timezone || "UTC";
      const tzB = b.timezone || "UTC";
      const isoA = isoFromParts(a.date || "", a.start_time || "00:00", tzA);
      const isoB = isoFromParts(b.date || "", b.start_time || "00:00", tzB);
      const da = isoA ? new Date(isoA) : new Date(`${a.date || ""}T${a.start_time || "00:00"}`);
      const db = isoB ? new Date(isoB) : new Date(`${b.date || ""}T${b.start_time || "00:00"}`);
      return db - da;
    });
  }, [publicBookings]);
  const latestBooking = sorted.length ? sorted[0] : null;
  const meetingLink =
    publicMeetingLink ||
    latestBooking?.meeting_link ||
    latestBooking?.meeting_url ||
    cd.meeting_link ||
    cd.jitsi_link ||
    null;
  const clientNote = cleanClientNote(cd.client_note);

  return (
    <Paper
      sx={{
        p: 3,
        borderLeft: `6px solid ${theme.palette.info.main}`,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        Public Booking Info
      </Typography>
      <Stack spacing={1}>
        <Typography>
          <strong>First name:</strong> {candidate?.name?.split(" ")[0] || cd.first_name || "N/A"}
        </Typography>
        <Typography>
          <strong>Last name:</strong> {cd.last_name || (candidate?.name || "").split(" ").slice(1).join(" ") || "N/A"}
        </Typography>
        <Typography>
          <strong>Email:</strong> {candidate?.email || "N/A"}
        </Typography>
        <Typography>
          <strong>WhatsApp Phone:</strong> {cd.phone || candidate?.phone || "N/A"}
        </Typography>
        <Typography>
          <strong>Country/Region:</strong> {cd.country || "N/A"}
        </Typography>
        <Typography>
          <strong>Website:</strong> {cd.website || "N/A"}
        </Typography>
        <Typography component="div">
          <strong>Client Note:</strong>{" "}
          {clientNote ? (
            <Box component="span" sx={{ whiteSpace: "pre-line" }}>
              {clientNote}
            </Box>
          ) : (
            "N/A"
          )}
        </Typography>
        <Typography>
          <strong>Latest booking:</strong> {formatBooking(latestBooking)}
        </Typography>
        <Typography>
          <strong>Meeting link:</strong>{" "}
          {meetingLink ? (
            <Link href={meetingLink} target="_blank" rel="noopener noreferrer">
              Join Meeting
            </Link>
          ) : (
            "N/A"
          )}
        </Typography>
      </Stack>
    </Paper>
  );
};

export default PublicBookingInfoCard;
