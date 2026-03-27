import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import PublicPageShell from "./PublicPageShell";
import {
  Typography,
  Box,
  CircularProgress,
  Alert,
  TextField,
  Stack,
  IconButton,
  Paper,
  Button,
  Divider,
  Chip,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EmployeeAvailabilityCalendar from "./EmployeeAvailabilityCalendar";
import { getTenantHostMode } from "../../utils/tenant";

const PRESERVED_QUERY_KEYS = [
  "embed",
  "primary",
  "text",
  "h",
  "b",
  "link",
  "hfont",
  "bfont",
  "cardbg",
];

const EmployeeProfile = ({ slugOverride }) => {
  const { slug: routeSlug, employeeId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const querySlug = (searchParams.get("site") || "").trim();
  let storedSlug = "";
  if (typeof window !== "undefined") {
    try {
      storedSlug = (localStorage.getItem("site") || "").trim();
    } catch {
      storedSlug = "";
    }
  }
  const effectiveSlug = (slugOverride || routeSlug || querySlug || storedSlug || "").trim();
  const isCustomDomain = getTenantHostMode() === "custom";
  const basePath = isCustomDomain ? "" : `/${effectiveSlug}`;

  const isEmbed = searchParams.get("embed") === "1";
  const serviceId = searchParams.get("service_id");
  const departmentId = searchParams.get("department_id") || "";

  const [profile, setProfile] = useState(null);
  const [services, setServices] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [error, setError] = useState("");
  const [companySlug, setCompanySlug] = useState("");

  useEffect(() => {
    if (!effectiveSlug) return;
    setLoadingProfile(true);
    setError("");
    api
      .get(
        `/public/${effectiveSlug}/artists/${employeeId}${departmentId ? `?department_id=${departmentId}` : ""}`
      )
      .then((res) => {
        setProfile(res.data);
        setCompanySlug(res.data?.company?.slug || effectiveSlug || "");
      })
      .catch(() => {
        setError("Failed to load employee profile.");
        setProfile(null);
      })
      .finally(() => setLoadingProfile(false));
  }, [effectiveSlug, employeeId, departmentId]);

  useEffect(() => {
    if (!effectiveSlug) return;
    setLoadingServices(true);
    api
      .get(
        `/public/${effectiveSlug}/artist/${employeeId}/services${departmentId ? `?department_id=${departmentId}` : ""}`
      )
      .then((res) => {
        const items = Array.isArray(res.data) ? res.data : [];
        setServices(items.filter((svc) => svc?.is_active !== false));
      })
      .catch(() => setServices([]))
      .finally(() => setLoadingServices(false));
  }, [effectiveSlug, employeeId, departmentId]);

  const handleServiceSelect = (svcId) => {
    const next = new URLSearchParams(searchParams);
    next.set("service_id", svcId);
    if (departmentId) {
      next.set("department_id", departmentId);
    } else {
      next.delete("department_id");
    }
    setSearchParams(next);
    setError("");
  };

  const handleSlotSelected = (slot) => {
    if (!slot || !serviceId || !effectiveSlug) return;

    const qs = new URLSearchParams();
    PRESERVED_QUERY_KEYS.forEach((key) => {
      const val = searchParams.get(key);
      if (val) {
        qs.set(key, val);
      }
    });
    qs.set("employee_id", employeeId);
    qs.set("service_id", serviceId);
    qs.set("date", slot.date);
    qs.set("start_time", slot.start_time);
    if (slot.timezone) {
      qs.set("timezone", slot.timezone);
    }

    navigate(`${basePath}/book?${qs.toString()}`);
  };

  let body = null;

  if (loadingProfile) {
    body = (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  } else if (error && !profile) {
    body = (
      <Alert severity="error" sx={{ mt: 4 }}>
        {error}
      </Alert>
    );
  } else if (!profile) {
    body = (
      <Alert severity="warning" sx={{ mt: 4 }}>
        Employee not found.
      </Alert>
    );
  } else {
    const providerName = profile.full_name || profile.name;
    const bookingUrl = `${(typeof window !== "undefined" && window.location.origin) || (process.env.REACT_APP_FRONTEND_URL || "http://localhost:3000")}/${companySlug || "<slug>"}/meet/${profile?.public_meet_token || profile?.id}`;

    body = (
      <Stack spacing={3.5}>
        {error && (
          <Alert severity="error">
            {error}
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.25, md: 3 },
            borderRadius: 4,
            border: "1px solid rgba(200,93,124,0.14)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(251,240,243,0.98) 100%)",
            boxShadow: "0 20px 48px rgba(124,72,92,0.08)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 2.5, md: 3 }}
            alignItems={{ xs: "center", md: "flex-start" }}
          >
            <Box
              sx={{
                width: 156,
                height: 156,
                borderRadius: "50%",
                overflow: "hidden",
                border: "6px solid rgba(255,255,255,0.92)",
                boxShadow: "0 16px 34px rgba(124,72,92,0.14)",
                bgcolor: "rgba(200,93,124,0.10)",
                flexShrink: 0,
              }}
            >
              {profile.profile_image_url ? (
                <Box
                  component="img"
                  src={profile.profile_image_url}
                  alt={providerName}
                  sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : null}
            </Box>

            <Stack spacing={1.25} sx={{ flex: 1, minWidth: 0, textAlign: { xs: "center", md: "left" } }}>
              <Stack spacing={0.75}>
                <Chip
                  label="Provider profile"
                  sx={{
                    alignSelf: { xs: "center", md: "flex-start" },
                    bgcolor: "rgba(200,93,124,0.12)",
                    color: "#7a3550",
                    fontWeight: 700,
                    letterSpacing: ".04em",
                  }}
                />
                <Typography variant="h3" sx={{ fontWeight: 800, color: "#4a2331", lineHeight: 1.05 }}>
                  {providerName}
                </Typography>
              </Stack>

              <Typography sx={{ maxWidth: 700, color: "rgba(74,35,49,0.80)", lineHeight: 1.75 }}>
                {profile.bio || "No bio available."}
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ pt: 0.5 }}>
                <Button
                  variant="contained"
                  href={serviceId ? undefined : '#services-offered'}
                  onClick={serviceId ? undefined : (e) => {
                    e.preventDefault();
                    const el = document.getElementById('services-offered');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  sx={{
                    borderRadius: 999,
                    px: 2.25,
                    py: 1,
                    bgcolor: "#c85d7c",
                    color: "#fffafc",
                    boxShadow: "0 14px 28px rgba(124,72,92,0.12)",
                  }}
                >
                  {serviceId ? "Viewing availability" : "View services"}
                </Button>
                {profile?.allow_public_booking ? (
                  <Button
                    variant="outlined"
                    onClick={() => navigator.clipboard.writeText(bookingUrl)}
                    sx={{ borderRadius: 999, px: 2.25, py: 1 }}
                  >
                    Copy booking link
                  </Button>
                ) : null}
              </Stack>
            </Stack>
          </Stack>
        </Paper>

        {!serviceId ? (
          <Paper
            id="services-offered"
            elevation={0}
            sx={{
              p: { xs: 2.25, md: 3 },
              borderRadius: 4,
              border: "1px solid rgba(200,93,124,0.12)",
              background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,246,248,0.98) 100%)",
              boxShadow: "0 18px 42px rgba(124,72,92,0.06)",
            }}
          >
            <Stack spacing={2}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#4a2331" }}>
                  Services Offered
                </Typography>
                <Typography sx={{ mt: 0.75, color: "rgba(74,35,49,0.72)", maxWidth: 720 }}>
                  Choose a treatment to view availability and continue to booking.
                </Typography>
              </Box>
              {loadingServices ? (
                <CircularProgress />
              ) : services.length === 0 ? (
                <Typography>
                  No services available{departmentId ? " in this department" : ""}.
                </Typography>
              ) : (
                <Stack spacing={1.25}>
                  {services.map((svc) => (
                    <Paper
                      key={svc.id}
                      elevation={0}
                      onClick={() => handleServiceSelect(svc.id)}
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        border: "1px solid rgba(200,93,124,0.14)",
                        background: "rgba(255,255,255,0.94)",
                        cursor: "pointer",
                        transition: "transform .16s ease, box-shadow .16s ease, border-color .16s ease",
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          borderColor: 'rgba(200,93,124,0.30)',
                          boxShadow: '0 16px 32px rgba(124,72,92,0.08)'
                        }
                      }}
                    >
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 800, color: '#4a2331' }}>{svc.name}</Typography>
                          <Typography sx={{ mt: 0.5, color: 'rgba(74,35,49,0.72)' }}>
                            {svc.description || 'Select this service to continue to available appointment times.'}
                          </Typography>
                        </Box>
                        <Button variant="outlined" sx={{ borderRadius: 999, flexShrink: 0 }}>
                          View & Book
                        </Button>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Stack>
          </Paper>
        ) : (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.25, md: 3 },
              borderRadius: 4,
              border: "1px solid rgba(200,93,124,0.12)",
              background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,246,248,0.98) 100%)",
              boxShadow: "0 18px 42px rgba(124,72,92,0.06)",
            }}
          >
            <Stack spacing={2}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#4a2331", textAlign: { xs: 'center', md: 'left' } }}>
                  Availability Calendar
                </Typography>
                <Typography sx={{ mt: 0.75, color: "rgba(74,35,49,0.72)", textAlign: { xs: 'center', md: 'left' } }}>
                  Select a time to continue your booking with {providerName}.
                </Typography>
              </Box>
              <Divider />
              <EmployeeAvailabilityCalendar
                companySlug={effectiveSlug}
                artistId={employeeId}
                serviceId={serviceId}
                departmentId={departmentId}
                onSlotSelect={handleSlotSelected}
              />
            </Stack>
          </Paper>
        )}
        {profile?.allow_public_booking ? (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              border: "1px solid rgba(200,93,124,0.12)",
              background: "rgba(255,255,255,0.92)",
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ color: '#4a2331', fontWeight: 700 }}>
              Public booking link
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
              <TextField
                fullWidth
                size="small"
                value={bookingUrl}
                InputProps={{ readOnly: true }}
              />
              <IconButton
                onClick={() => navigator.clipboard.writeText(bookingUrl)}
                title="Copy link"
                size="small"
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Paper>
        ) : null}
      </Stack>
    );
  }

  const content = (
    <Box
      sx={{
        width: "100%",
        maxWidth: isEmbed ? "100%" : 960,
        mx: "auto",
        px: isEmbed ? 0 : { xs: 2, md: 4 },
        py: isEmbed ? { xs: 2, md: 3 } : { xs: 6, md: 8 },
      }}
    >
      {body}
    </Box>
  );

  if (!effectiveSlug) {
    return content;
  }

  return (
    <PublicPageShell activeKey="__services" slugOverride={effectiveSlug}>
      {content}
    </PublicPageShell>
  );
};

export default EmployeeProfile;
