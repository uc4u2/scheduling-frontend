import React, { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogContent,
  DialogActions,
  Chip,
  TextField,
  Alert,
  Divider,
  Link,
} from "@mui/material";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

import { getUserTimezone } from "../../utils/timezone";
import { isoFromParts, formatDate, formatTime } from "../../utils/datetime";

export default function ClientBookings() {
  const [bookings, setBookings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [note, setNote] = useState("");
  const [noteMsg, setNoteMsg] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  // Helper to preserve current query string (e.g. ?embed=1&primary=...)
  const go = (to) =>
    navigate(
      typeof to === "string"
        ? { pathname: to, search: location.search }
        : { ...to, search: location.search }
    );

  const userTimezone = getUserTimezone();

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get("/api/client/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const data = res.data.bookings || res.data || [];
        setBookings(data);
      })
      .catch((err) => console.error("Failed to load bookings:", err));
  }, []);

  useEffect(() => {
    const token = () => localStorage.getItem("token");
    const handler = () => {
      axios
        .get("/api/client/bookings", {
          headers: { Authorization: 'Bearer ' + token() },
        })
        .then((res) => setBookings(res.data.bookings || res.data || []))
        .catch((err) => console.error("Failed to load bookings:", err));
    };

    window.addEventListener("booking:changed", handler);
    return () => window.removeEventListener("booking:changed", handler);
  }, []);

  function handleCancel(row) {
    if (row.status === "cancelled" || row.status === "unavailable") return;
    if (window.confirm("Cancel this booking?")) {
      const token = localStorage.getItem("token");
      axios
        .post(`/api/client/bookings/${row.id}/cancel`, null, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(() => {
          setBookings((prev) =>
            prev.map((b) =>
              b.id === row.id ? { ...b, status: "cancelled" } : b
            )
          );
          setDetailOpen(false);
        })
        .catch((err) => console.error("Cancel failed:", err));
    }
  }

  function handleSendNote() {
    if (!note.trim()) return;
    const token = localStorage.getItem("token");
    axios
      .post(
        `/api/client/bookings/${selected.id}/note`,
        { note },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        setNoteMsg("Note sent successfully!");
        setNote("");
      })
      .catch(() => setNoteMsg("Failed to send note. Please try again."));
  }

  function handleView(row) {
    setSelected(row);
    setDetailOpen(true);
    setNoteMsg("");
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "cancelled":
        return "error";
      case "booked":
        return "success";
      case "unavailable":
        return "warning";
      default:
        return "primary";
    }
  };

  const columns = [
    { field: "id", headerName: "ID", width: 80 },
    {
      field: "date",
      headerName: "Date",
      width: 130,
      valueGetter: (p) => {
        const tz = p.row.timezone || userTimezone;
        const iso = isoFromParts(p.row.date, p.row.start_time, tz);
        return formatDate(new Date(iso));
      },
    },
    {
      field: "start_time",
      headerName: "Start",
      width: 90,
      valueGetter: (p) => {
        const tz = p.row.timezone || userTimezone;
        const iso = isoFromParts(p.row.date, p.row.start_time, tz);
        return formatTime(new Date(iso));
      },
    },
    {
      field: "end_time",
      headerName: "End",
      width: 90,
      valueGetter: (p) => {
        const tz = p.row.timezone || userTimezone;
        const iso = isoFromParts(p.row.date, p.row.end_time, tz);
        return formatTime(new Date(iso));
      },
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value === "unavailable" ? "Unavailable" : params.value}
          color={getStatusColor(params.value)}
          size="small"
        />
      ),
    },
    { field: "recruiter", headerName: "With", width: 140 },
    {
      field: "actions",
      headerName: "Actions",
      width: 220,
      renderCell: (params) => {
        const isDisabled =
          params.row.status === "cancelled" || params.row.status === "unavailable";
        return (
          <Box>
            <Button size="small" onClick={() => handleView(params.row)}>
              View
            </Button>
            {!isDisabled && (
              <Button
                size="small"
                color="error"
                variant="outlined"
                sx={{ ml: 1 }}
                onClick={() => handleCancel(params.row)}
              >
                Cancel
              </Button>
            )}
          </Box>
        );
      },
    },
  ];

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        My Bookings
      </Typography>

      <div style={{ height: 420, width: "100%" }}>
        <DataGrid rows={bookings} columns={columns} pageSize={5} disableSelectionOnClick />
      </div>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        <DialogContent>
          {selected && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Booking Details
              </Typography>

              {(() => {
                const tz = selected.timezone || userTimezone;
                const startIso = isoFromParts(selected.date, selected.start_time, tz);
                const endIso = isoFromParts(selected.date, selected.end_time, tz);
                const startDateObj = new Date(startIso);
                const endDateObj = new Date(endIso);
                const displayDate = formatDate(startDateObj);
                const displayStartTime = formatTime(startDateObj);
                const displayEndTime = formatTime(endDateObj);
                return (
                  <>
                    <Typography>
                      <b>Date:</b> {displayDate}
                    </Typography>
                    <Typography>
                      <b>Start Time:</b> {displayStartTime} - {displayEndTime}
                    </Typography>
                  </>
                );
              })()}

              <Typography>
                <b>Service:</b> {selected.service}
              </Typography>
              <Typography>
                <b>Provider:</b> {selected.recruiter}
              </Typography>
              <Typography>
                <b>Status:</b>{" "}
                <Chip
                  label={selected.status}
                  color={getStatusColor(selected.status)}
                  size="small"
                />
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1">Company Info:</Typography>
              {selected.company_slug && (
                <Typography>
                  <b>Company:</b>{" "}
                  <Link
                    href={`/${selected.company_slug}`}
                    underline="hover"
                    target="_blank"
                  >
                    {selected.company_name || selected.company_slug}
                  </Link>
                </Typography>
              )}
              {selected.company_address && (
                <Typography>
                  <b>Address:</b> {selected.company_address}
                </Typography>
              )}
              {selected.company_phone && (
                <Typography>
                  <b>Phone:</b> {selected.company_phone}
                </Typography>
              )}
              {selected.company_email && (
                <Typography>
                  <b>Email:</b> {selected.company_email}
                </Typography>
              )}

              {selected.status !== "cancelled" &&
                selected.status !== "unavailable" && (
                  <Box sx={{ mt: 2 }}>
                    <TextField
                      fullWidth
                      label="Send a note to your provider"
                      multiline
                      minRows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                    <Button
                      sx={{ mt: 1 }}
                      variant="contained"
                      size="small"
                      onClick={handleSendNote}
                    >
                      Send Note
                    </Button>
                    {noteMsg && (
                      <Alert sx={{ mt: 1 }} severity="info">
                        {noteMsg}
                      </Alert>
                    )}
                  </Box>
                )}
            </Box>
          )}
        </DialogContent>

        {selected &&
          selected.status !== "cancelled" &&
          selected.status !== "unavailable" && (
            <DialogActions sx={{ justifyContent: "flex-end", p: 1 }}>
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={() => handleCancel(selected)}
              >
                Cancel Booking
              </Button>
            </DialogActions>
          )}
      </Dialog>
    </Box>
  );
}
