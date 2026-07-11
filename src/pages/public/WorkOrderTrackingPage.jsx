import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import RoomOutlinedIcon from "@mui/icons-material/RoomOutlined";
import AltRouteOutlinedIcon from "@mui/icons-material/AltRouteOutlined";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer } from "react-leaflet";
import { useParams } from "react-router-dom";
import { getPublicWorkOrderTracking } from "../finance/financeApi";
import "leaflet/dist/leaflet.css";

const statusLabel = (status) => {
  switch (String(status || "").toLowerCase()) {
    case "on_my_way":
      return "On the way";
    case "arrived":
      return "Arrived";
    default:
      return "Not started";
  }
};

const formatDistance = (meters) => {
  const value = Number(meters);
  if (!Number.isFinite(value)) return "—";
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)} km`;
  return `${Math.round(value)} m`;
};

const formatEta = (seconds) => {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value < 0) return "—";
  const minutes = Math.max(1, Math.round(value / 60));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
};

const routeReasonLabel = (reason) => {
  switch (String(reason || "").toLowerCase()) {
    case "route_only_available_on_my_way":
      return "The live route appears only while the trip is marked On the way.";
    case "missing_origin_location":
      return "Live location has not been shared yet.";
    case "missing_destination_coordinates":
      return "The destination has not been pinned yet.";
    case "stale_origin_location":
      return "Trip location has not refreshed recently, so ETA may be unavailable.";
    default:
      return reason ? "Live route is temporarily unavailable." : "";
  }
};

export default function WorkOrderTrackingPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tracking, setTracking] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!token) return;
      setLoading(true);
      setError("");
      try {
        const res = await getPublicWorkOrderTracking(token);
        if (!mounted) return;
        setTracking(res?.tracking || null);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.error || err?.message || "Unable to load tracking.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [token]);

  const route = tracking?.route || null;
  const routePoints = Array.isArray(route?.polyline) ? route.polyline : [];
  const origin = route?.origin || tracking?.location || null;
  const destination = route?.destination || tracking?.destination_meta || null;
  const hasOrigin = Number.isFinite(origin?.lat) && Number.isFinite(origin?.lng);
  const hasDestination = Number.isFinite(destination?.lat) && Number.isFinite(destination?.lng);

  const mapCenter = useMemo(() => {
    if (hasOrigin) return [origin.lat, origin.lng];
    if (hasDestination) return [destination.lat, destination.lng];
    return [43.6532, -79.3832];
  }, [destination?.lat, destination?.lng, hasDestination, hasOrigin, origin?.lat, origin?.lng]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f7f4ef", py: { xs: 4, md: 6 } }}>
      <Container maxWidth="md">
        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
          {loading ? (
            <Stack alignItems="center" sx={{ py: 8 }} spacing={1.5}>
              <CircularProgress size={26} />
              <Typography color="text.secondary">Loading trip status...</Typography>
            </Stack>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : !tracking ? (
            <Alert severity="warning">Tracking is not available for this trip.</Alert>
          ) : (
            <Stack spacing={3}>
              <Box>
                <Typography variant="overline" color="text.secondary">
                  {tracking.company_name || "Schedulaa"}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  {statusLabel(tracking.status)}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  {[tracking.employee_name, tracking.work_order_number, tracking.work_order_title].filter(Boolean).join(" • ")}
                </Typography>
              </Box>

              <Alert severity={tracking.status === "arrived" ? "success" : "info"}>
                {tracking.status === "arrived"
                  ? `${tracking.employee_name || "Your technician"} has arrived.`
                  : `${tracking.employee_name || "Your technician"} is on the way.`}
              </Alert>

              <Stack spacing={0.75}>
                <Typography variant="body2" color="text.secondary">
                  Destination: {tracking.destination_meta?.label || tracking.destination || "Not provided"}
                </Typography>
                {route?.status === "available" ? (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      Estimated arrival: {formatEta(route.eta_seconds)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Distance remaining: {formatDistance(route.distance_meters)}
                    </Typography>
                  </>
                ) : null}
                {tracking.updated_at ? (
                  <Typography variant="body2" color="text.secondary">
                    Last updated: {new Date(tracking.updated_at).toLocaleString()}
                  </Typography>
                ) : null}
              </Stack>

              {(hasOrigin || hasDestination) ? (
                <Box sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid", borderColor: "divider", height: { xs: 300, md: 420 } }}>
                  <MapContainer center={mapCenter} zoom={11} style={{ height: "100%", width: "100%" }}>
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {route?.status === "available" && routePoints.length >= 2 ? (
                      <Polyline
                        positions={routePoints}
                        pathOptions={{
                          color: "#2563eb",
                          weight: 4,
                          opacity: 0.82,
                          dashArray: route.provider === "google_directions" ? undefined : "8 8",
                        }}
                      />
                    ) : null}
                    {hasOrigin ? (
                      <CircleMarker
                        center={[origin.lat, origin.lng]}
                        radius={10}
                        pathOptions={{ color: "#fff", weight: 2, fillColor: "#2563eb", fillOpacity: 0.9 }}
                      >
                        <Popup>
                          <Stack spacing={0.5}>
                            <Typography fontWeight={700}>Technician</Typography>
                            <Typography variant="body2">{tracking.employee_name || "On the way"}</Typography>
                          </Stack>
                        </Popup>
                      </CircleMarker>
                    ) : null}
                    {hasDestination ? (
                      <CircleMarker
                        center={[destination.lat, destination.lng]}
                        radius={9}
                        pathOptions={{ color: "#fff", weight: 2, fillColor: "#dc2626", fillOpacity: 0.88 }}
                      >
                        <Popup>
                          <Stack spacing={0.5}>
                            <Typography fontWeight={700}>Destination</Typography>
                            <Typography variant="body2">{destination.label || tracking.destination || "Job destination"}</Typography>
                          </Stack>
                        </Popup>
                      </CircleMarker>
                    ) : null}
                  </MapContainer>
                </Box>
              ) : (
                <Alert severity="info">Live location has not been shared yet.</Alert>
              )}

              {routeReasonLabel(route?.reason) ? (
                <Alert severity="info" icon={<AltRouteOutlinedIcon fontSize="inherit" />}>
                  {routeReasonLabel(route?.reason)}
                </Alert>
              ) : null}

              <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
                {tracking.location?.map_url ? (
                  <Button
                    variant="outlined"
                    component="a"
                    href={tracking.location.map_url}
                    target="_blank"
                    rel="noreferrer"
                    startIcon={<OpenInNewOutlinedIcon />}
                  >
                    Open technician location
                  </Button>
                ) : null}
                {destination?.map_url ? (
                  <Button
                    variant="outlined"
                    component="a"
                    href={destination.map_url}
                    target="_blank"
                    rel="noreferrer"
                    startIcon={<RoomOutlinedIcon />}
                  >
                    Open destination
                  </Button>
                ) : null}
              </Stack>
            </Stack>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
