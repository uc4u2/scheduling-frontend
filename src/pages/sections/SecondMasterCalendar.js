import React, { useState, useEffect } from "react";
import axios from "axios";
import moment from "moment-timezone";

/* one authoritative helper for the viewer’s zone */
import { getUserTimezone } from "../../utils/timezone";   // ← path: pages/sections → utils

/* ------------------------------------------------------------------ */
/*  1.  Reusable hook for “Recruiter creates / books meetings”         */
/* ------------------------------------------------------------------ */
export const useRecruiterMeetingHandler = (
  token,
  API_URL,
  resetForm,
  fetchEvents,
  setIsSubmitting,
  setSuccessMessage,
  setError,
  setOpenModal,
  setEvents
) => {
  /* current recruiter (or browser) timezone */
  const recruiterTimezone = getUserTimezone("America/Toronto");

  /* ─── Minimal slot creator (no email) ─── */
  const handleRecruiterSaveMeeting = async (form) => {
    setIsSubmitting(true);
    setSuccessMessage("");
    setError("");

    try {
      if (!form.date || !form.start || !form.end) {
        setError("Please fill in date, start time, and end time.");
        setIsSubmitting(false);
        return;
      }

      const startMoment = moment.tz(
        `${form.date} ${form.start}`,
        "YYYY-MM-DD HH:mm",
        recruiterTimezone
      );
      const endMoment = moment.tz(
        `${form.date} ${form.end}`,
        "YYYY-MM-DD HH:mm",
        recruiterTimezone
      );

      if (!startMoment.isValid() || !endMoment.isValid()) {
        setError("Invalid date or time format.");
        setIsSubmitting(false);
        return;
      }
      if (!endMoment.isAfter(startMoment)) {
        setError("End time must be after start time.");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        title: form.title || "Interview Slot",
        start: startMoment.utc().toISOString(),
        end: endMoment.utc().toISOString(),
        location: form.location || "",
        description: form.description || "",
        invite_link: await ensureInviteLink(form.invite_link),
        attendees: form.attendees || [],
      };

      await axios.post(`${API_URL}/api/add-meeting-iso`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccessMessage("✅ Meeting created (no booking/email).");
      setOpenModal(false);
      resetForm();
      fetchEvents();
    } catch (err) {
      console.error("❌ Failed to save meeting:", err);
      setError("❌ Failed to save meeting. Please check required fields.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ─── Direct booking (email + link) ─── */
  const handleRecruiterDirectBooking = async (form) => {
    setIsSubmitting(true);
    setSuccessMessage("");
    setError("");

    try {
      if (
        !form.date ||
        !form.start ||
        !form.end ||
        !form.title ||
        !form.candidate_name ||
        !form.candidate_email
      ) {
        setError("Missing required fields.");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        candidate_name: form.candidate_name,
        candidate_email: form.candidate_email,
        position: form.title,
        date: form.date,
        start: form.start,
        end: form.end,
        location: form.location || "",
        description: form.description || "",
        invite_link: form.invite_link || "",
      };

      const res = await axios.post(
        `${API_URL}/recruiter/direct-booking`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMessage(res.data.message || "✅ Interview booked and email sent.");
      setOpenModal(false);
      resetForm();
      fetchEvents();
    } catch (err) {
      console.error("❌ Booking failed:", err);
      setError("❌ Booking failed. Please verify fields.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ─── Load recruiter calendar (slots & bookings) ─── */
  const fetchRecruiterEvents = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/recruiter/calendar`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const recruiterTz = getUserTimezone("America/Toronto");
      const slots = data?.slots || [];

      const transformed = slots.map((slot) => {
        const startUtc = moment.tz(
          `${slot.date} ${slot.start_time}`,
          "YYYY-MM-DD HH:mm:ss",
          "UTC"
        );
        const endUtc = moment.tz(
          `${slot.date} ${slot.end_time}`,
          "YYYY-MM-DD HH:mm:ss",
          "UTC"
        );

        return {
          id: slot.id,
          title: slot.booked ? "Booked" : "Available",
          start: startUtc.tz(recruiterTz).toDate(),
          end: endUtc.tz(recruiterTz).toDate(),
          backgroundColor: slot.booked ? "#ffcdd2" : "#c8e6c9",
          borderColor: slot.booked ? "#f44336" : "#4caf50",
          textColor: "#000",
          extendedProps: { booked: slot.booked },
        };
      });

      setEvents(transformed);
    } catch (err) {
      console.error("❌ Failed to load recruiter events:", err);
      setError("Failed to fetch recruiter calendar.");
    }
  };

  /* helper: lazy‑create Jitsi link when none supplied */
  const ensureInviteLink = async (existing) => {
    if (existing) return existing;
    const { data } = await axios.get(`${API_URL}/utils/generate-jitsi`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data.link;
  };

  return {
    handleRecruiterSaveMeeting,
    handleRecruiterDirectBooking,
    fetchRecruiterEvents,
  };
};

/* ------------------------------------------------------------------ */
/*  2.  Thin wrapper component that uses the hook                      */
/* ------------------------------------------------------------------ */
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const SecondMasterCalendar = ({ token }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  const { fetchRecruiterEvents } = useRecruiterMeetingHandler(
    token,
    API_URL,
    () => {},              // resetForm placeholder
    () => fetchRecruiterEvents(),
    setIsSubmitting,
    setSuccessMessage,
    setError,
    setOpenModal,
    setEvents
  );

  useEffect(() => {
    if (token) fetchRecruiterEvents().then(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /* ─── very simple render (replace with FullCalendar if desired) ─── */
  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
      {successMessage && <div style={{ color: "green" }}>{successMessage}</div>}

      <ul>
        {events.map((evt) => (
          <li key={evt.id}>
            <b>{evt.title}</b> —{" "}
            {evt.start.toLocaleString()} &nbsp;–&nbsp; {evt.end.toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SecondMasterCalendar;
