// src/pages/sections/EnhancedMasterCalendar.js
import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  Box,
  Typography,
  Alert,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
  Paper,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import axios from "axios";

/* ──────────────────────────────────────────────────────────── *\
   One helper for every component that needs “the user’s zone”
\* ──────────────────────────────────────────────────────────── */
import { getUserTimezone } from "./utils/timezone";   // adjust path if needed
import { isoFromParts } from "./utils/datetime";
const EnhancedMasterCalendar = ({ token }) => {
  const theme = useTheme();

  /* ─────────── state ─────────── */
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedRecruiter, setSelectedRecruiter] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [error, setError] = useState("");

  /* env */
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  /* logged‑in (or browser) timezone */
  const timeZone = getUserTimezone();

  /* ─────────── data loading ─────────── */
  useEffect(() => {
    if (!token) return;
    fetchEvents();
    fetchRecruiters();
    fetchDepartments();
  }, [token]);

  const fetchEvents = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/manager/calendar`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      /* API already returns ISO strings with offsets – no extra conversion */
      const evts = (data.events || []).map((e) => ({
        ...e,
        /* FullCalendar understands `start` / `end` ISO 8601 with offset */
        start: e.start,
        end:   e.end,
        title: e.title || e.type,                     // fallback
      }));

      setEvents(evts);
      setFilteredEvents(evts);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch calendar events.");
    }
  };

  const fetchRecruiters = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/manager/recruiters`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecruiters(data?.recruiters || data || []);
    } catch (err) {
      console.error("Failed to fetch recruiters.", err);
      setRecruiters([]);
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDepartments(data || []);
    } catch (err) {
      console.error("Failed to fetch departments.", err);
    }
  };

  /* ─────────── derived filters ─────────── */
  const filteredRecruiters = selectedDepartment
    ? recruiters.filter((r) => String(r.department_id) === String(selectedDepartment))
    : recruiters;

  useEffect(() => {
    if (selectedRecruiter === "all") {
      setFilteredEvents(events);
    } else {
      setFilteredEvents(
        events.filter((e) => String(e.recruiter_id) === String(selectedRecruiter))
      );
    }
  }, [selectedRecruiter, events]);

  /* ─────────── render ─────────── */
  return (
    <Box sx={{ my: 3, backgroundColor: theme.palette.background.default }}>
      <Typography variant="h5" gutterBottom sx={{ color: theme.palette.text.primary }}>
        Enhanced Master Calendar
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      {/* ───── Filters ───── */}
      <Paper
        sx={{
          p: 2,
          mb: 2,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
        }}
      >
        {/* Department */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="department-select-label">Filter by Department</InputLabel>
          <Select
            labelId="department-select-label"
            value={selectedDepartment}
            label="Filter by Department"
            onChange={(e) => {
              setSelectedDepartment(e.target.value);
              setSelectedRecruiter("all");        // reset recruiter
            }}
          >
            <MenuItem value="">All Departments</MenuItem>
            {departments.map((d) => (
              <MenuItem key={d.id} value={d.id}>
                {d.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Recruiter */}
        <FormControl fullWidth>
          <InputLabel id="recruiter-select-label">Filter by Recruiter</InputLabel>
          <Select
            labelId="recruiter-select-label"
            value={selectedRecruiter}
            label="Filter by Recruiter"
            onChange={(e) => setSelectedRecruiter(e.target.value)}
          >
            <MenuItem value="all">All Recruiters</MenuItem>
            {filteredRecruiters.map((r) => (
              <MenuItem key={r.id} value={r.id}>
                {r.first_name} {r.last_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* ───── Calendar ───── */}
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        timeZone={timeZone}                 /* ← ONE authoritative zone */
        initialView="dayGridMonth"
        events={filteredEvents}
        height="auto"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        eventDidMount={(info) => {
          /* Simple tooltip & click‑through meeting link */
          const tooltip = `${info.event.title}\nRecruiter: ${info.event.extendedProps.recruiter}`;
          info.el.setAttribute("data-tooltip", tooltip);

          if (info.event.extendedProps.meeting_link) {
            info.el.style.cursor = "pointer";
            info.el.onclick = () => window.open(info.event.extendedProps.meeting_link, "_blank");
          }
        }}
      />
    </Box>
  );
};

export default EnhancedMasterCalendar;
