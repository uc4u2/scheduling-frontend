// src/pages/sections/SecondMasterCalendar.js
import axios from "axios";
import moment from "moment-timezone";

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
  const recruiterTimezone = localStorage.getItem("timezone") || "America/Toronto";

  // ➤ Original Meeting Creator (minimal)
  const handleRecruiterSaveMeeting = async (form, editingEvent) => {
    setIsSubmitting(true);
    setSuccessMessage("");
    setError("");

    try {
      if (!form.date || !form.start || !form.end) {
        setError("Please fill in date, start time, and end time.");
        setIsSubmitting(false);
        return;
      }

      const startMoment = moment.tz(`${form.date} ${form.start}`, "YYYY-MM-DD HH:mm", recruiterTimezone);
      const endMoment = moment.tz(`${form.date} ${form.end}`, "YYYY-MM-DD HH:mm", recruiterTimezone);

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

      const startUtc = startMoment.utc().toISOString();
      const endUtc = endMoment.utc().toISOString();

      // 🎯 Get Jitsi invite link if not provided
      let inviteLink = form.invite_link;
      if (!inviteLink) {
        const res = await axios.get(`${API_URL}/utils/generate-jitsi`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        inviteLink = res.data.link;
      }

      const payload = {
        title: form.title || "Interview Slot",
        start: startUtc,
        end: endUtc,
        location: form.location || "",
        description: form.description || "",
        invite_link: inviteLink,
        attendees: form.attendees || [],
      };

      const url = `${API_URL}/api/add-meeting-iso`;

      await axios.post(url, payload, {
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

  // ➤ NEW: Full Booking + Email + Jitsi
  const handleRecruiterDirectBooking = async (form) => {
    setIsSubmitting(true);
    setSuccessMessage("");
    setError("");

    try {
      if (!form.date || !form.start || !form.end || !form.title || !form.candidate_name || !form.candidate_email) {
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

      const res = await axios.post(`${API_URL}/recruiter/direct-booking`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

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

  // ✅ Patched version of fetchRecruiterEvents to prevent .map crash
  const fetchRecruiterEvents = async () => {
    try {
      const response = await axios.get(`${API_URL}/recruiter/calendar`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const recruiterTz = localStorage.getItem("timezone") || "America/Toronto";

      const slots = response?.data?.slots || []; // 🛡️ Safe fallback
      const transformedEvents = slots.map((slot) => {
        const startUtc = moment.tz(`${slot.date} ${slot.start_time}`, "YYYY-MM-DD HH:mm:ss", "UTC");
        const endUtc = moment.tz(`${slot.date} ${slot.end_time}`, "YYYY-MM-DD HH:mm:ss", "UTC");

        return {
          id: slot.id,
          title: slot.booked ? "Booked" : "Available",
          start: startUtc.tz(recruiterTz).toDate(),
          end: endUtc.tz(recruiterTz).toDate(),
          backgroundColor: slot.booked ? "#ffcdd2" : "#c8e6c9",
          borderColor: slot.booked ? "#f44336" : "#4caf50",
          textColor: "#000",
          extendedProps: {
            booked: slot.booked,
          },
        };
      });

      setEvents(transformedEvents);
    } catch (err) {
      console.error("❌ Failed to load recruiter events:", err);
      setError("Failed to fetch recruiter calendar.");
    }
  };

  return {
    handleRecruiterSaveMeeting,
    handleRecruiterDirectBooking,
    fetchRecruiterEvents,
  };
};
