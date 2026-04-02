/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Typography, Grid,
  FormControl, InputLabel, Select, MenuItem,
  TextField, Button, CircularProgress, Checkbox,
  FormControlLabel, Alert, Stack, Link
} from "@mui/material";
import { useTheme, alpha, lighten } from "@mui/material/styles";
import api from "../../../utils/api";
import EmployeeAvailabilityCalendar from "../../client/EmployeeAvailabilityCalendar";
import { settingsApi } from "../../../utils/api";

export default function ClientBookingView({ token: propToken = null, slug: propSlug = "" }) {

  /* ───────── helpers & theme vars ───────── */
  const theme  = useTheme();
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
  const [slot,  setSlot]  = useState(null);

  const [clientName,  setClientName]  = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [requirePay,  setRequirePay]  = useState(true);
  const [createHostedLink, setCreateHostedLink] = useState(true);
  const [managerCompanySlug, setManagerCompanySlug] = useState(propSlug || "");

  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState({type:"", text:""});
  const [paymentLinkState, setPaymentLinkState] = useState({
    url: "",
    invoiceId: null,
    appointmentId: null,
  });
  const [calendarNonce, setCalendarNonce] = useState(0);

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
    if (propSlug) {
      setManagerCompanySlug(propSlug);
      return;
    }
    (async () => {
      try {
        const data = await settingsApi.get(auth);
        const nextSlug = (data?.slug || "").trim();
        if (nextSlug) {
          setManagerCompanySlug(nextSlug);
          return;
        }
      } catch {
        // fallback below
      }

      try {
        const { data } = await api.get("/admin/company-profile", auth);
        const nextSlug = (data?.slug || "").trim();
        if (nextSlug) {
          setManagerCompanySlug(nextSlug);
        } else {
          setMsg({ type: "error", text: "Company slug is missing. Set it in company profile before booking." });
        }
      } catch {
        setMsg({ type: "error", text: "Unable to load company slug for booking availability." });
      }
    })();
  }, [propSlug, token]);

  useEffect(() => {
    if (!empId) return;
    const exists = recruiters.some((r) => String(r.id) === String(empId));
    if (!exists) {
      setEmpId("");
      setSlot(null);
    }
  }, [recruiters, empId]);

  /* ───────── derived lists ───────── */
  const employees = useMemo(() => {
    if (!svcId) return [];
    const ids = links.filter(l => l.service.id === svcId).map(l => l.recruiter.id);
    return recruiters.filter(r => ids.includes(r.id));
  }, [svcId, links, recruiters]);

  const selectedService = useMemo(
    () => services.find((s) => String(s.id) === String(svcId)) || null,
    [services, svcId]
  );

  const selectedServicePrice = useMemo(() => {
    const raw = selectedService?.base_price ?? selectedService?.price ?? 0;
    const value = Number(raw);
    return Number.isFinite(value) ? value : 0;
  }, [selectedService]);

  useEffect(() => { setEmpId(""); setSlot(null); }, [svcId]);
  useEffect(() => { setSlot(null); }, [empId]);

  /* ───────── booking submit ───────── */
  const handleSubmit = async () => {
    if (!clientName || !clientEmail)
      return setMsg({type:"error", text:"Name & email required"});
    if (!(svcId && empId && slot))
      return setMsg({type:"error", text:"Select service, employee, date & slot"});

    setLoading(true); setMsg({type:"",text:""});

    const companySlug = managerCompanySlug || propSlug || "";
    const bookingDate = slot?.date || "";

    try {
      setPaymentLinkState({ url: "", invoiceId: null, appointmentId: null });

      const bookingRes = await api.post(`/api/manager/book-client`, {
        company_slug : companySlug,
        artist_id    : empId,
        service_id   : svcId,
        date: bookingDate,
        start_time   : slot.start_time,
        client_name  : clientName,
        client_email : clientEmail,
        client_phone : clientPhone,
        require_payment: requirePay
      }, auth);

      const appointmentId = bookingRes?.data?.appointment_id || null;
      let hostedLink = "";
      let hostedInvoiceId = null;
      let successType = "success";
      let successText = requirePay
        ? "Payment required flow started."
        : "Booking created!";

      if (!requirePay && createHostedLink && appointmentId) {
        const amountCents = Math.round(Math.max(0, selectedServicePrice) * 100);
        if (amountCents > 0) {
          try {
            const paymentRes = await api.post("/api/manager/manual-payments", {
              appointment_id: appointmentId,
              amount_cents: amountCents,
              currency: "CAD",
              client_email: clientEmail,
              client_name: clientName,
              description: `Booking #${appointmentId} • ${selectedService?.name || "Service"}`,
            }, auth);
            hostedLink =
              paymentRes?.data?.checkout_url ||
              paymentRes?.data?.invoice?.hosted_invoice_url ||
              "";
            hostedInvoiceId =
              paymentRes?.data?.invoice?.id ||
              paymentRes?.data?.id ||
              null;
            if (hostedLink) {
              successText = "Booking created and hosted payment link is ready.";
            }
          } catch (paymentErr) {
            successType = "warning";
            successText =
              paymentErr?.response?.data?.error ||
              "Booking created, but payment link creation failed.";
          }
        } else {
          successType = "warning";
          successText = "Booking created, but this service has no price to invoice.";
        }
      }

      setMsg({
        type: successType,
        text: successText
      });

      if (appointmentId) {
        setPaymentLinkState({
          url: hostedLink,
          invoiceId: hostedInvoiceId,
          appointmentId,
        });
      }

      // quick reset
      setEmpId(""); setSlot(null);
      setClientName(""); setClientEmail(""); setClientPhone("");
    } catch(e) {
      const status = e?.response?.status;
      const errorText = e?.response?.data?.error || "Booking failed";
      if (status === 409) {
        setSlot(null);
        setCalendarNonce((prev) => prev + 1);
        setMsg({
          type: "warning",
          text: errorText === "Slot already booked"
            ? "That time was just taken. Choose another available slot."
            : errorText,
        });
      } else {
        setMsg({type:"error", text:errorText});
      }
    } finally { setLoading(false); }
  };

  /* ───────── UI ───────── */
  return (
    <Box sx={{ ...cssVars }}>
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

      {/* Availability */}
      {svcId && empId && managerCompanySlug && (
        <Box sx={{ mb:3 }}>
          <EmployeeAvailabilityCalendar
            key={`${managerCompanySlug}:${svcId}:${empId}:${calendarNonce}`}
            companySlug={managerCompanySlug || propSlug || ""}
            artistId={empId}
            serviceId={svcId}
            autoSelectFirstTime={false}
            autoScrollToTimes={false}
            onSlotSelect={(selectedSlot) => {
              setSlot(selectedSlot);
              setMsg({ type: "", text: "" });
            }}
          />
        </Box>
      )}

      {svcId && empId && !managerCompanySlug && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Loading booking availability…
        </Alert>
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
        label="Require payment before confirming booking"
        sx={{ mb:3 }}
      />

      {!requirePay && (
        <FormControlLabel
          control={
            <Checkbox
              checked={createHostedLink}
              onChange={e => setCreateHostedLink(e.target.checked)}
            />
          }
          label={`Create hosted payment link after booking${selectedServicePrice > 0 ? ` (${selectedServicePrice.toFixed(2)} CAD)` : ""}`}
          sx={{ mb:3, display: "block" }}
        />
      )}

      <Button variant="contained" disabled={loading}
              startIcon={loading && <CircularProgress size={20}/>}
              onClick={handleSubmit}>
        {loading ? "Booking…" : "Create Booking"}
      </Button>

      {paymentLinkState.url && (
        <Alert severity="success" sx={{ mt:2 }}>
          <Stack spacing={1}>
            <Typography variant="body2" fontWeight={700}>
              Hosted payment link ready
            </Typography>
            <Typography variant="body2">
              Appointment #{paymentLinkState.appointmentId}
              {paymentLinkState.invoiceId ? ` • Invoice #${paymentLinkState.invoiceId}` : ""}
            </Typography>
            <Link href={paymentLinkState.url} target="_blank" rel="noreferrer">
              {paymentLinkState.url}
            </Link>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => window.open(paymentLinkState.url, "_blank", "noopener,noreferrer")}
              >
                Open link
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => navigator.clipboard.writeText(paymentLinkState.url)}
              >
                Copy link
              </Button>
            </Box>
          </Stack>
        </Alert>
      )}

      {slot && (
        <Alert severity="info" sx={{ mt:2, width:"fit-content" }}>
          Selected {slot.date} {slot.start_time}‑{slot.end_time}
        </Alert>
      )}
    </Box>
  );
}
