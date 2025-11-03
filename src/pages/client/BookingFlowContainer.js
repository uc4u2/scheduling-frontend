/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  Alert,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import ServiceList from "./ServiceList";
import ServiceDetails from "./ServiceDetails";
import EmployeeAvailabilityCalendar from "./EmployeeAvailabilityCalendar";
import BookingReview from "./BookingReview";
import Checkout from "./Checkout";
import BookingConfirmation from "./BookingConfirmation";

import { api } from "../../utils/api";
import { isoFromParts, formatDate, formatTime } from "../../utils/datetime";
import { getUserTimezone } from "../../utils/timezone";

export default function BookingFlowContainer({ companySlug, preselect }) {
  /* ─────────────────────────── state ─────────────────────────── */
  const [step, setStep] = useState(1);
  const [service, setService] = useState(null);
  const [artist, setArtist] = useState(null);
  const [slot, setSlot] = useState(null);
  const [appointmentId, setAppointmentId] = useState(null);
  const [cancelToken, setCancelToken] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [allSlots, setAllSlots] = useState([]);
  const [availableAgents, setAvailableAgents] = useState([]);
  const [bookingCart, setBookingCart] = useState([]);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const userTz = getUserTimezone();
  const navigate = useNavigate();
  const theme = useTheme();

  /* ───────────────────── pre-select hydration ─────────────────── */
  useEffect(() => {
    if (!preselect) return;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [{ data: svc }, { data: emp }] = await Promise.all([
          api.get(`/public/${companySlug}/service/${preselect.service_id}`),
          api.get(`/public/${companySlug}/artists/${preselect.employee_id}`)
        ]);

        setService(svc);
        setArtist(emp);
        setSlot({
          date: preselect.date,
          start_time: preselect.start_time,
          end_time: preselect.end_time || null,
          type: preselect.type || "available",
          timezone: preselect.timezone || artist?.timezone || userTz,
        });
        setStep(4);
      } catch {
        setError("Unable to pre-fill booking. Please choose manually.");
      } finally {
        setLoading(false);
      }
    })();
  }, [companySlug, preselect]);

  /* ──────────────────────── step helpers ──────────────────────── */
  const goToStep = (target) => {
    setStep(target);
    if (target < 5) {
      setAppointmentId(null);
      setCancelToken(null);
    }
    if (target < 4) setSlot(null);
    if (target < 3) setArtist(null);
    if (target < 2) setService(null);
    setError(null);
  };

  /* ───────────── build booking payload (timezone-safe) ─────────── */
  const buildBookingPayload = () => {
    if (!service || !artist || !slot) return null;

    return {
      artist_id: artist.id,
      service_id: service.id,
      date: slot.date,           // send raw API value, do not transform
      start_time: slot.start_time, // send raw API value
      end_time: slot.end_time,     // send raw API value, if used
      addon_ids: slot.addon_ids || [],  // ✅ include add-on IDs here!
      client_name: "",
      client_email: "",
    };
  };

  /* ─────────────── handle success from <Checkout/> ─────────────── */
  const handleBookingSuccess = (response) => {
    if (response && response.success) {
      setAppointmentId(response.appointment_id);
      setCancelToken(response.cancel_token);
      window.dispatchEvent(new Event("booking:changed"));

      navigate(
        `/${companySlug}/booking-confirmation/${response.appointment_id}?token=${response.cancel_token}`
      );
    } else {
      setError("Booking was successful but missing appointment details.");
    }
  };

  /* ────────────────────────── data fetches ─────────────────────── */
  const fetchAllSlots = async () => {
    try {
      const { data } = await api.get(`/public/${companySlug}/all-availability`);
      setAllSlots(data.slots || []);
      setCalendarOpen(true);
    } catch {
      setMsg({ type: "error", text: "Unable to load all availabilities" });
    }
  };

  const handleGlobalSlotClick = async (slotInfo) => {
    try {
      const { data } = await api.get(`/public/${companySlug}/agents-for-slot`, {
        params: { date: slotInfo.date, start_time: slotInfo.start_time },
      });
      setAvailableAgents(data.agents || []);
      setAgentModalOpen(true);
    } catch {
      setMsg({ type: "error", text: "Unable to load agents for this slot" });
    }
  };

  /* ───────────────────── cart & checkout helpers ───────────────── */
  const handleAddBooking = (agent) => {
    const newBooking = {
      service,
      agent,
      date: slot?.date || agent.date,
      start_time: slot?.start_time || agent.start_time,
      timezone: slot?.timezone || agent.timezone || userTz,
    };
    setBookingCart([...bookingCart, newBooking]);
    setAgentModalOpen(false);
    setMsg({
      type: "success",
      text: "Booking added. You can add more services or proceed to payment.",
    });
  };

  const proceedToCheckout = () => {
    if (bookingCart.length === 0) {
      setMsg({ type: "info", text: "Please select at least one booking" });
    } else {
      navigate(`/${companySlug}/checkout`, { state: { bookings: bookingCart } });
    }
  };

  /* ──────────────────────────── loading / error ────────────────── */
  if (loading)
    return <div style={{ padding: theme.spacing(4) }}>Loading…</div>;

  if (error)
    return (
      <div
        style={{
          padding: theme.spacing(4),
          color: theme.palette.error.main,
          fontWeight: 500,
        }}
      >
        {error}
        <button
          style={{ marginLeft: theme.spacing(2) }}
          onClick={() => goToStep(1)}
        >
          Start Over
        </button>
      </div>
    );

  /* ────────────────── FullCalendar event preparation ───────────── */
  const events = allSlots.map((s) => {
    const tz = s.timezone || userTz;

    if (s.type === "available") {
      return {
        id: `${s.date}-${s.start_time}`,
        title: `${s.start_time} – ${s.end_time}`,
        start: isoFromParts(s.date, s.start_time, tz),
        end: isoFromParts(s.date, s.end_time, tz),
        extendedProps: {
          type: "available",
          slot: s,
          date: s.date,
          recruiterTimezone: tz,
          timezone: tz,
        },
      };
    }

    return {
      id: `booked-${s.date}-${s.start_time}`,
      title: `✖ ${s.start_time} - ${s.end_time}`,
      start: isoFromParts(s.date, s.start_time, tz),
      end: isoFromParts(s.date, s.end_time, tz),
      classNames: ["slot-booked"],
      extendedProps: {
        type: s.type || "booked",
        date: s.date,
        recruiterTimezone: tz,
        timezone: tz,
        slot: {
          type: s.type || "booked",
          status: "booked",
          start_time: s.start_time,
          end_time: s.end_time,
        },
      },
    };
  });

  /* ─────────────────────────── render ──────────────────────────── */
  return (
    <div>
      {msg.text && (
        <Alert severity={msg.type} sx={{ mb: 2 }}>
          {msg.text}
        </Alert>
      )}

      {/* ──────────────── 1. choose service ──────────────── */}
      {step === 1 && (
        <ServiceList
          companySlug={companySlug}
          onServiceSelect={(svc) => {
            setService(svc);
            setStep(2);
          }}
        />
      )}

      {/* ─────────────── 2. choose artist / global ─────────────── */}
      {step === 2 && service && (
        <ServiceDetails
          companySlug={companySlug}
          serviceId={service.id}
          onArtistSelect={(emp) => {
            setArtist(emp);
            setStep(3);
          }}
          onOpenGlobalCalendar={fetchAllSlots}
          onBack={() => goToStep(1)}
        />
      )}

      {/* ──────────────── 3. pick slot for artist ──────────────── */}
      {step === 3 && service && artist && (
        <EmployeeAvailabilityCalendar
          companySlug={companySlug}
          serviceId={service.id}
          artistId={artist.id}
          renderSlot={(slotData, handleClick) => {
            const isBooked =
              ["booked", "unavailable"].includes(slotData.type) ||
              slotData.status === "booked";

            return (
              <button
                key={slotData.start_time}
                disabled={isBooked}
                onClick={() => !isBooked && handleClick(slotData)}
                style={{
                  margin: theme.spacing(0.5),
                  padding: theme.spacing(1, 1.5),
                  border: `1px solid`,
                  borderRadius: theme.shape.borderRadius / 2,
                  backgroundColor: isBooked
                    ? theme.palette.error.light
                    : theme.palette.success.light,
                  borderColor: isBooked
                    ? theme.palette.error.main
                    : theme.palette.success.main,
                  color: isBooked
                    ? theme.palette.error.contrastText
                    : theme.palette.success.contrastText,
                  fontWeight: 500,
                  cursor: isBooked ? "not-allowed" : "pointer",
                }}
              >
                {slotData.start_time} – {slotData.end_time}
                {isBooked && " (Booked)"}
              </button>
            );
          }}
          onSlotSelect={(selectedSlot) => {
            setSlot({
              ...selectedSlot,
              timezone: selectedSlot.timezone || userTz,
            });
            setStep(4);
          }}
          onBack={() => goToStep(2)}
        />
      )}

      {/* ──────────────── 4. review booking ──────────────── */}
      {step === 4 && service && (artist || slot) && (
        <BookingReview
          companySlug={companySlug}
          service={service}
          artist={artist}
          slot={slot}
          onEditService={() => goToStep(1)}
          onEditArtist={() => goToStep(2)}
          onEditSlot={() => goToStep(3)}
          // ✅ Update onConfirm to accept slot with addons
          onConfirm={(slotWithAddons) => {
            setSlot(slotWithAddons);  // store add-on info here
            setStep(5);               // proceed to checkout
          }}
          buildPayload={buildBookingPayload}
          onAddMore={() => goToStep(1)}
        />
      )}

      {/* ──────────────── 5. checkout & pay ──────────────── */}
      {step === 5 && service && artist && slot && (
        <Checkout
          companySlug={companySlug}
          service={service}
          artist={artist}
          slot={slot}
          cart={bookingCart}
          onSuccess={handleBookingSuccess}
          onBack={() => goToStep(4)}
          disableShell
        />
      )}

      {/* ─────────────── global calendar dialog ─────────────── */}
      <Dialog
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Choose an Available Slot</DialogTitle>
        <DialogContent>
          <FullCalendar
            timeZone={userTz}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            events={events}
            height="600px"
            eventClick={({ event }) =>
              handleGlobalSlotClick(event.extendedProps)
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCalendarOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ─────────────── agent selection modal ─────────────── */}
      <Dialog open={agentModalOpen} onClose={() => setAgentModalOpen(false)}>
        <DialogTitle>Select an Available Agent</DialogTitle>
        <DialogContent>
          <List>
            {availableAgents.map((agent) => (
              <ListItem
                button
                key={agent.id}
                onClick={() => handleAddBooking(agent)}
              >
                <ListItemText primary={`${agent.name} (${agent.department})`} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAgentModalOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
