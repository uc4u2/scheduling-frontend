/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useState } from "react";
import {
  Container, Box, Typography, Grid,
  FormControl, InputLabel, Select, MenuItem,
  TextField, Button, CircularProgress, Checkbox,
  FormControlLabel, Alert
} from "@mui/material";
import { useTheme, alpha, lighten } from "@mui/material/styles";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import api from "../../../utils/api";

import { getUserTimezone } from "../../../utils/timezone";
import { isoFromParts } from "../../../utils/datetime";

import "../../../components/calendar-enterprise.css";

/* ──────────────────────────────────────────────── */
/* Split a raw availability window into N‑minute blocks */
function splitByDuration(slot, minutes) {
  const [h1, m1] = slot.start_time.split(":").map(Number);
  const [h2, m2] = slot.end_time.split(":").map(Number);

  const startM = h1 * 60 + m1;
  const endM   = h2 * 60 + m2;
  const blocks = [];

  for (let t = startM; t + minutes <= endM; t += minutes) {
    const hS = String(Math.floor(t / 60)).padStart(2, "0");
    const mS = String(t % 60).padStart(2, "0");
    const hE = String(Math.floor((t + minutes) / 60)).padStart(2, "0");
    const mE = String((t + minutes) % 60).padStart(2, "0");
    blocks.push({
      ...slot,
      start_time: `${hS}:${mS}`,
      end_time  : `${hE}:${mE}`,
    });
  }
  return blocks;
}

export default function ClientBookingView({ token: propToken = null, slug: propSlug = "" }) {

  /* ───────── helpers & theme vars ───────── */
  const theme  = useTheme();
  const userTz = getUserTimezone();
  const token  = propToken || localStorage.getItem("token") || "";
  const auth   = token ? { headers:{ Authorization:`Bearer ${token}` } } : {};

  const cssVars = useMemo(() => ({
    "--grid-border"    : alpha(theme.palette.divider, 0.6),
    "--row-sep"        : alpha(theme.palette.divider, 0.3),
    "--grid-bg"        : theme.palette.background.paper,
    "--grid-axis-bg"   : theme.palette.grey[50],
    "--grid-axis-color": theme.palette.text.secondary,
    "--slot-ok-start"  : theme.palette.secondary.main,
    "--slot-ok-end"    : lighten(theme.palette.secondary.main, 0.2),
    "--slot-bad-start" : theme.palette.error.light,
    "--slot-bad-end"   : theme.palette.error.dark,
    "--row-h"          : "36px",
  }), [theme]);

  /* ───────── state ───────── */
  const [services,  setServices]   = useState([]);
  const [recruiters,setRecruiters] = useState([]);
  const [links,     setLinks]      = useState([]);
  const [includeArchived, setIncludeArchived] = useState(false);

  const [svcId, setSvcId] = useState("");
  const [empId, setEmpId] = useState("");
  const [date,  setDate]  = useState("");

  const [slots, setSlots] = useState([]);
  const [evtId, setEvtId] = useState("");
  const [slot,  setSlot]  = useState(null);

  const [clientName,  setClientName]  = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [requirePay,  setRequirePay]  = useState(true);

  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState({type:"", text:""});

  /* ───────── reference data ───────── */
  useEffect(() => {
    (async () => {
      try {
        const recruiterParams = includeArchived ? { include_archived: 1 } : { active: true };
        const [svcRes, recRes, linkRes] = await Promise.all([
          api.get(`/booking/services`, auth),
          api.get(`/manager/recruiters`, { ...auth, params: recruiterParams }),
          api.get(`/booking/employee-services`, auth)
        ]);
        setServices(svcRes.data || []);
        setRecruiters(recRes.data.recruiters || recRes.data || []);
        setLinks(linkRes.data || []);
      } catch {
        setMsg({type:"error", text:"Unable to load reference data"});
      }
    })();
  }, [includeArchived]);

  useEffect(() => {
    if (!empId) return;
    const exists = recruiters.some((r) => String(r.id) === String(empId));
    if (!exists) {
      setEmpId("");
      setSlots([]);
      setEvtId("");
      setSlot(null);
    }
  }, [recruiters, empId]);

  /* ───────── derived lists ───────── */
  const employees = useMemo(() => {
    if (!svcId) return [];
    const ids = links.filter(l => l.service.id === svcId).map(l => l.recruiter.id);
    return recruiters.filter(r => ids.includes(r.id));
  }, [svcId, links, recruiters]);

  useEffect(() => { setEmpId(""); setSlots([]); setEvtId(""); setSlot(null); }, [svcId]);

  /* ───────── fetch availability ───────── */
  useEffect(() => {
    const service  = services.find(s => s.id === svcId);
    const duration = service?.duration;            // minutes
    const isPublic = Boolean(propSlug);            // only true in the public flow

    if (!(svcId && empId && date && duration)) { setSlots([]); return; }

    (async () => {
      try {
        let raw = [];

        if (isPublic) {
          // Public endpoint (already trimmed to service length)
          const { data } = await api.get(
            `/public/${propSlug}/availability`,
            { params:{ artist_id: empId, service_id: svcId, date } }
          );
          raw = data.slots || [];
        } else {
          // Manager endpoint → split long windows client‑side
          const { data } = await api.get(
            `/manager/available-slots`,
            { ...auth, params:{ recruiter_id: empId } }
          );
          const daySlots = (data.slots || []).filter(s => s.date === date);
          raw = daySlots.flatMap(s => splitByDuration(s, duration));
        }

        setSlots(raw);
        setMsg(raw.length ? {type:"", text:""} : {type:"info", text:"No free slots"});
      } catch {
        setMsg({type:"error", text:"Unable to load slots"});
        setSlots([]);
      }
    })();
  }, [svcId, empId, date, services, propSlug, auth]);

  /* ───────── calendar events ───────── */
  const recruiterTz = recruiters.find(r => r.id === empId)?.timezone || "UTC";

  const events = useMemo(() => slots.map(s => {
    const zone = s.timezone || recruiterTz || userTz;
    const id   = `${s.date}-${s.start_time}`;
    const seatInfo = (s.mode === "group" && Number.isFinite(s.capacity))
      ? ` • ${Number.isFinite(s.seats_left) ? s.seats_left : 0}/${s.capacity} left`
      : "";
    return {
      id,
      title:`${s.start_time}‑${s.end_time}${seatInfo}`,
      start: isoFromParts(s.date, s.start_time, zone),
      end  : isoFromParts(s.date, s.end_time,   zone),
      classNames:["slot-available", id === evtId ? "slot-selected" : ""],
      extendedProps:{ slot: s }
    };
  }), [slots, evtId, recruiterTz, userTz]);

  const calendarTz = slots[0]?.timezone || recruiterTz || userTz;

  /* ───────── booking submit ───────── */
  const handleSubmit = async () => {
    if (!clientName || !clientEmail)
      return setMsg({type:"error", text:"Name & email required"});
    if (!(svcId && empId && date && slot))
      return setMsg({type:"error", text:"Select service, employee, date & slot"});

    setLoading(true); setMsg({type:"",text:""});

    const companySlug = propSlug
      || services.find(s => s.id === svcId)?.company_slug
      || "";

    try {
      await api.post(`/api/manager/book-client`, {
        company_slug : companySlug,
        artist_id    : empId,
        service_id   : svcId,
        date,
        start_time   : slot.start_time,
        client_name  : clientName,
        client_email : clientEmail,
        client_phone : clientPhone,
        require_payment: requirePay
      }, auth);

      setMsg({
        type:"success",
        text: requirePay
          ? "Payment link sent – booking will confirm after payment."
          : "Booking created!"
      });

      // quick reset
      setEmpId(""); setDate(""); setSlots([]); setEvtId(""); setSlot(null);
      setClientName(""); setClientEmail(""); setClientPhone("");
    } catch(e) {
      setMsg({type:"error", text:e.response?.data?.error || "Booking failed"});
    } finally { setLoading(false); }
  };

  /* ───────── UI ───────── */
  return (
    <Container sx={{ my:4, ...cssVars }}>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Book a Service for Client
      </Typography>

      {msg.text && <Alert severity={msg.type} sx={{mb:2}}>{msg.text}</Alert>}

      {/* Service */}
      <FormControl fullWidth sx={{ mb:2 }}>
        <InputLabel>Service</InputLabel>
        <Select value={svcId} label="Service" onChange={e=>setSvcId(e.target.value)}>
          {services.map(s=>(
            <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Employee */}
      <FormControl fullWidth sx={{ mb:2 }} disabled={!svcId}>
        <InputLabel>Employee</InputLabel>
        <Select value={empId} label="Employee" onChange={e=>setEmpId(e.target.value)}>
          {employees.map(r=>(
            <MenuItem key={r.id} value={r.id}>
              {r.full_name || `${r.first_name} ${r.last_name}`}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {token && (
        <FormControlLabel
          control={
            <Checkbox
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
            />
          }
          label="Show archived employees"
          sx={{ mb: 2 }}
        />
      )}

      {/* Date */}
      <TextField
        fullWidth type="date" label="Date" disabled={!empId}
        InputLabelProps={{ shrink:true }}
        value={date} onChange={e=>setDate(e.target.value)}
        sx={{ mb:3 }}
      />

      {/* Calendar */}
      {date && (
        <Box sx={{ mb:3 }}>
          <FullCalendar
            plugins={[dayGridPlugin,timeGridPlugin,interactionPlugin]}
            initialView="timeGridDay"
            height="auto"
            headerToolbar={{left:"",center:"title",right:""}}
            events={events}
            timeZone={calendarTz}
            eventClick={({ event })=>{
              setEvtId(event.id);
              setSlot(event.extendedProps.slot);
            }}
          />
        </Box>
      )}

      {/* Client details */}
      <Grid container spacing={2} sx={{ mb:2 }}>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Client Name" value={clientName}
                     onChange={e=>setClientName(e.target.value)}/>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Client Email" value={clientEmail}
                     onChange={e=>setClientEmail(e.target.value)}/>
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth label="Phone (optional)" value={clientPhone}
                     onChange={e=>setClientPhone(e.target.value)}/>
        </Grid>
      </Grid>

      <FormControlLabel
        control={<Checkbox checked={requirePay}
                           onChange={e=>setRequirePay(e.target.checked)}/>}
        label="Send payment link (book after payment)"
        sx={{ mb:3 }}
      />

      <Button variant="contained" disabled={loading}
              startIcon={loading && <CircularProgress size={20}/>}
              onClick={handleSubmit}>
        {loading ? "Booking…" : "Create Booking"}
      </Button>

      {slot && (
        <Alert severity="info" sx={{ mt:2, width:"fit-content" }}>
          Selected {date} {slot.start_time}‑{slot.end_time}
        </Alert>
      )}
    </Container>
  );
}
