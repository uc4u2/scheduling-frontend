import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import PublicPageShell from "./PublicPageShell";
import {
  Typography,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Alert,
} from "@mui/material";
import EmployeeAvailabilityCalendar from "./EmployeeAvailabilityCalendar";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

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

const EmployeeProfile = () => {
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
  const effectiveSlug = (routeSlug || querySlug || storedSlug || "").trim();

  const isEmbed = searchParams.get("embed") === "1";
  const serviceId = searchParams.get("service_id");
  const departmentId = searchParams.get("department_id") || "";

  const [profile, setProfile] = useState(null);
  const [services, setServices] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!effectiveSlug) return;
    setLoadingProfile(true);
    setError("");
    axios
      .get(
        `${API_BASE}/public/${effectiveSlug}/artists/${employeeId}${departmentId ? `?department_id=${departmentId}` : ""}`
      )
      .then((res) => setProfile(res.data))
      .catch(() => {
        setError("Failed to load employee profile.");
        setProfile(null);
      })
      .finally(() => setLoadingProfile(false));
  }, [effectiveSlug, employeeId, departmentId]);

  useEffect(() => {
    if (!effectiveSlug) return;
    setLoadingServices(true);
    axios
      .get(
        `${API_BASE}/public/${effectiveSlug}/artist/${employeeId}/services${departmentId ? `?department_id=${departmentId}` : ""}`
      )
      .then((res) => setServices(Array.isArray(res.data) ? res.data : []))
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

    navigate(`/${effectiveSlug}/book?${qs.toString()}`);
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
    body = (
      <Box>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Typography variant="h4" gutterBottom>
          {profile.full_name || profile.name}
        </Typography>

        {profile.profile_image_url && (
          <Box
            component="img"
            src={profile.profile_image_url}
            alt={profile.full_name || profile.name}
            sx={{
              width: 140,
              height: 140,
              borderRadius: "50%",
              mb: 3,
              objectFit: "cover",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          />
        )}

        <Typography sx={{ mb: 3 }}>
          {profile.bio || "No bio available."}
        </Typography>

        {!serviceId ? (
          <Box>
            <Typography variant="h6" gutterBottom>
              Services Offered
            </Typography>
            {loadingServices ? (
              <CircularProgress />
            ) : services.length === 0 ? (
              <Typography>
                No services available{departmentId ? " in this department" : ""}.
              </Typography>
            ) : (
              <List dense>
                {services.map((svc) => (
                  <ListItem
                    button
                    key={svc.id}
                    onClick={() => handleServiceSelect(svc.id)}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      "&:hover": { backgroundColor: "rgba(25,118,210,0.1)" },
                    }}
                  >
                    <ListItemText
                      primary={svc.name}
                      secondary={svc.description}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        ) : (
          <Box>
            <Typography variant="h6" gutterBottom>
              Availability Calendar
            </Typography>
            <EmployeeAvailabilityCalendar
              companySlug={effectiveSlug}
              artistId={employeeId}
              serviceId={serviceId}
              onSlotSelect={handleSlotSelected}
            />
          </Box>
        )}
      </Box>
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
