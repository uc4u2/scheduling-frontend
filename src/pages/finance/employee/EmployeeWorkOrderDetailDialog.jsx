import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import RoomOutlinedIcon from "@mui/icons-material/RoomOutlined";
import AltRouteOutlinedIcon from "@mui/icons-material/AltRouteOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer } from "react-leaflet";
import { acceptEmployeeDispatchAcknowledgement, getEmployeeDispatchAcknowledgement, getMyWorkOrder, getMyWorkOrderDispatch, listMyWorkOrderFieldPhotos, previewMyWorkOrderDispatchRoute, updateMyWorkOrderDispatchLocation, updateMyWorkOrderDispatchStatus, uploadMyWorkOrderFieldPhoto } from "../financeApi";
import FinanceStatusChip from "../components/FinanceStatusChip";
import { API_BASE_URL } from "../../../utils/api";
import { getAuthedCompanyId } from "../../../utils/authedCompany";
import { formatDateTimeInTz } from "../../../utils/datetime";
import { getUserTimezone } from "../../../utils/timezone";
import { captureDispatchStatusLocation } from "./dispatchLocation";
import "leaflet/dist/leaflet.css";

const DISPATCH_STATUS_LABELS = {
  not_started: "Not started",
  on_my_way: "On my way",
  arrived: "Arrived",
};

export default function EmployeeWorkOrderDetailDialog({ open, workOrderId, onClose, onSubmitReport, onViewReports, initialSection = "" }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const viewerTimezone = getUserTimezone();
  const [workOrder, setWorkOrder] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoNote, setPhotoNote] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [dispatch, setDispatch] = useState(null);
  const [dispatchSettings, setDispatchSettings] = useState(null);
  const [dispatchRoute, setDispatchRoute] = useState(null);
  const [dispatchDestination, setDispatchDestination] = useState(null);
  const [dispatchError, setDispatchError] = useState("");
  const [dispatchBusy, setDispatchBusy] = useState(false);
  const [routePreviewBusy, setRoutePreviewBusy] = useState(false);
  const [dispatchAckModalOpen, setDispatchAckModalOpen] = useState(false);
  const [dispatchAckInfo, setDispatchAckInfo] = useState(null);
  const [dispatchAckBusy, setDispatchAckBusy] = useState(false);
  const [dispatchAckRemember, setDispatchAckRemember] = useState(true);
  const [pendingDispatchStatus, setPendingDispatchStatus] = useState("");
  const watchIdRef = useRef(null);
  const lastPingAtRef = useRef(0);
  const dispatchSectionRef = useRef(null);
  const photoSectionRef = useRef(null);
  const scheduleSectionRef = useRef(null);
  const materialsSectionRef = useRef(null);
  const instructionsSectionRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!open || !workOrderId) return;
      setLoading(true);
      setError("");
      try {
        const [res, photoRes, dispatchRes] = await Promise.all([
          getMyWorkOrder(workOrderId),
          listMyWorkOrderFieldPhotos(workOrderId).catch(() => ({ items: [] })),
          getMyWorkOrderDispatch(workOrderId).catch(() => null),
        ]);
        if (!mounted) return;
        setWorkOrder(res?.work_order || res);
        setPhotos(Array.isArray(photoRes?.items) ? photoRes.items : []);
        setDispatch(dispatchRes?.dispatch || null);
        setDispatchSettings(dispatchRes?.settings || null);
        setDispatchRoute(dispatchRes?.route || null);
        setDispatchDestination(dispatchRes?.destination_meta || dispatchRes?.route?.destination || null);
        setDispatchError("");
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.error || err?.message || "Unable to load work order.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [open, workOrderId]);

  const loadSignedPreview = useCallback(async (photoId) => {
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") || "" : "";
    const companyId = getAuthedCompanyId?.();
    const apiBase = String(API_BASE_URL || "").replace(/\/$/, "");
    const response = await fetch(`${apiBase}/employee/field-photos/${photoId}/download`, {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(companyId ? { "X-Company-Id": String(companyId) } : {}),
      },
    });
    if (!response.ok) {
      throw new Error("Photo is not available yet.");
    }
    const payload = await response.json();
    return payload?.url || "";
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadPreviewUrls = async () => {
      for (const row of photos) {
        if (!row?.id || !row?.is_download_ready || photoPreviewUrls[row.id]) continue;
        try {
          const url = await loadSignedPreview(row.id);
          if (!cancelled && url) {
            setPhotoPreviewUrls((prev) => (prev[row.id] ? prev : { ...prev, [row.id]: url }));
          }
        } catch (_err) {
          // leave preview empty until opened manually
        }
      }
    };
    if (photos.length) loadPreviewUrls();
    return () => {
      cancelled = true;
    };
  }, [loadSignedPreview, photoPreviewUrls, photos]);

  const handleOpenPhoto = async (row) => {
    try {
      const existing = photoPreviewUrls[row.id];
      const url = existing || await loadSignedPreview(row.id);
      if (url && !existing) {
        setPhotoPreviewUrls((prev) => ({ ...prev, [row.id]: url }));
      }
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setPhotoError(err?.message || "Photo is not available yet.");
    }
  };

  const handleUploadPhoto = async () => {
    if (!workOrder?.id || !photoFile) return;
    setUploadingPhoto(true);
    setPhotoError("");
    try {
      const formData = new FormData();
      formData.append("file", photoFile);
      if (photoNote.trim()) formData.append("note", photoNote.trim());
      await uploadMyWorkOrderFieldPhoto(workOrder.id, formData);
      const photoRes = await listMyWorkOrderFieldPhotos(workOrder.id);
      setPhotos(Array.isArray(photoRes?.items) ? photoRes.items : []);
      setPhotoFile(null);
      setPhotoNote("");
    } catch (err) {
      setPhotoError(err?.response?.data?.error || err?.message || "Unable to upload work-order photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const stopDispatchTracking = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation?.clearWatch) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
    lastPingAtRef.current = 0;
  }, []);

  const sendDispatchLocation = useCallback(async (position) => {
    if (!workOrder?.id) return;
    const coords = position?.coords;
    if (!coords) return;
    const now = Date.now();
    if (now - lastPingAtRef.current < 30000) return;
    lastPingAtRef.current = now;
    try {
      const response = await updateMyWorkOrderDispatchLocation(workOrder.id, {
        lat: coords.latitude,
        lng: coords.longitude,
        accuracy_m: coords.accuracy ?? null,
        heading: Number.isFinite(coords.heading) ? coords.heading : null,
        speed: Number.isFinite(coords.speed) ? coords.speed : null,
        permission_state: "granted",
        source: "employee_work_order",
        captured_at: new Date(position.timestamp || now).toISOString(),
      });
      setDispatch(response?.dispatch || null);
      setDispatchRoute((prev) => prev ? {
        ...prev,
        origin: {
          ...(prev.origin || {}),
          lat: coords.latitude,
          lng: coords.longitude,
          captured_at: new Date(position.timestamp || now).toISOString(),
          map_url: `https://maps.google.com/?q=${coords.latitude},${coords.longitude}`,
        },
      } : prev);
      setDispatchError("");
    } catch (err) {
      const code = err?.response?.data?.error || "";
      if (code === "dispatch_not_active") {
        stopDispatchTracking();
        setDispatchError("");
        return;
      }
      setDispatchError(code || err?.message || "Unable to send trip location.");
    }
  }, [stopDispatchTracking, workOrder?.id]);

  const startDispatchTracking = useCallback(() => {
    if (watchIdRef.current !== null || typeof navigator === "undefined" || !navigator.geolocation?.watchPosition) return;
    setDispatchError("");
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        void sendDispatchLocation(position);
      },
      (geoError) => {
        setDispatchError(geoError?.message || "Location access is required while you are on the way.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 15000,
        timeout: 20000,
      }
    );
  }, [sendDispatchLocation]);

  useEffect(() => {
    if (!open || !dispatchSettings?.enabled) {
      stopDispatchTracking();
      return;
    }
    if (dispatch?.status === "on_my_way") {
      startDispatchTracking();
    } else {
      stopDispatchTracking();
    }
    return () => {
      stopDispatchTracking();
    };
  }, [dispatch?.status, dispatchSettings?.enabled, open, startDispatchTracking, stopDispatchTracking]);

  const handleDispatchStatus = async (nextStatus) => {
    if (!workOrder?.id || !dispatchSettings?.enabled) return;
    if (nextStatus === "arrived") {
      stopDispatchTracking();
    }
    if (nextStatus === "on_my_way") {
      try {
        const ack = await getEmployeeDispatchAcknowledgement();
        setDispatchAckInfo(ack || null);
        if (ack?.required) {
          setPendingDispatchStatus(nextStatus);
          setDispatchAckModalOpen(true);
          return;
        }
      } catch (_err) {
        // let the source-of-truth status route decide if ack is required
      }
    }
    setDispatchBusy(true);
    setDispatchError("");
    try {
      const location = await captureDispatchStatusLocation();
      const response = await updateMyWorkOrderDispatchStatus(workOrder.id, { status: nextStatus, location });
      setDispatch(response?.dispatch || null);
      if (response?.route) {
        setDispatchRoute(response.route);
      } else {
        const dispatchRes = await getMyWorkOrderDispatch(workOrder.id);
        setDispatchRoute(dispatchRes?.route || null);
        setDispatchDestination(dispatchRes?.destination_meta || dispatchRes?.route?.destination || null);
      }
      if (nextStatus === "arrived") {
        stopDispatchTracking();
      }
    } catch (err) {
      if (err?.response?.data?.error === "dispatch_ack_required") {
        setDispatchAckInfo({
          required: true,
          policy_version: err?.response?.data?.policy_version || dispatchSettings?.policy_version || "v1",
          client_sharing_possible: Boolean(dispatchSettings?.auto_send_tracking_link),
        });
        setPendingDispatchStatus(nextStatus);
        setDispatchAckModalOpen(true);
      } else {
        setDispatchError(err?.response?.data?.error || err?.message || "Unable to update trip status.");
      }
    } finally {
      setDispatchBusy(false);
    }
  };

  const handlePreviewRoute = async () => {
    if (!workOrder?.id) return;
    setRoutePreviewBusy(true);
    setDispatchError("");
    try {
      const location = await captureDispatchStatusLocation();
      if (!Number.isFinite(location?.lat) || !Number.isFinite(location?.lng)) {
        setDispatchError("Location access is required to preview the route.");
        return;
      }
      const response = await previewMyWorkOrderDispatchRoute(workOrder.id, location);
      setDispatchRoute(response?.route || null);
      setDispatchDestination(response?.destination_meta || response?.route?.destination || null);
    } catch (err) {
      setDispatchError(err?.response?.data?.error || err?.message || "Unable to preview the route.");
    } finally {
      setRoutePreviewBusy(false);
    }
  };

  const handleAcceptDispatchAcknowledgement = async () => {
    setDispatchAckBusy(true);
    setDispatchError("");
    try {
      const response = await acceptEmployeeDispatchAcknowledgement({
        accepted: true,
        policy_version: dispatchAckInfo?.policy_version || dispatchSettings?.policy_version || "v1",
        remember: dispatchAckRemember,
      });
      setDispatchAckInfo(response || null);
      setDispatchAckModalOpen(false);
      const nextStatus = pendingDispatchStatus;
      setPendingDispatchStatus("");
      if (nextStatus) {
        await handleDispatchStatus(nextStatus);
      }
    } catch (err) {
      setDispatchError(err?.response?.data?.error || err?.message || "Unable to save the trip-tracking acknowledgment.");
    } finally {
      setDispatchAckBusy(false);
    }
  };

  useEffect(() => {
    if (!open || !initialSection) return;
    const targetRef = initialSection === "photos"
      ? photoSectionRef
      : initialSection === "dispatch"
      ? dispatchSectionRef
      : null;
    if (!targetRef?.current) return;
    const timer = window.setTimeout(() => {
      targetRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [initialSection, open, workOrder?.id]);

  const scrollToSection = (ref) => {
    ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const routePoints = Array.isArray(dispatchRoute?.polyline) ? dispatchRoute.polyline : [];
  const routeOrigin = dispatchRoute?.origin || null;
  const routeDestination = dispatchRoute?.destination || dispatchDestination || null;
  const hasRouteOrigin = Number.isFinite(routeOrigin?.lat) && Number.isFinite(routeOrigin?.lng);
  const hasRouteDestination = Number.isFinite(routeDestination?.lat) && Number.isFinite(routeDestination?.lng);
  const routeCenter = hasRouteOrigin
    ? [routeOrigin.lat, routeOrigin.lng]
    : hasRouteDestination
    ? [routeDestination.lat, routeDestination.lng]
    : [43.6532, -79.3832];

  const routeReasonLabel = (() => {
    switch (String(dispatchRoute?.reason || "").toLowerCase()) {
      case "route_only_available_on_my_way":
        return "Use Preview route now, or tap On my way to start live trip routing.";
      case "missing_origin_location":
        return "Location access is needed to preview the route.";
      case "missing_destination_coordinates":
        return "This work order destination has not been pinned yet.";
      case "stale_origin_location":
        return "Location has not refreshed recently. Showing the last route preview if available.";
      default:
        return "";
    }
  })();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={isMobile}>
      <DialogTitle>My Work Order</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : workOrder ? (
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between">
              <Stack spacing={0.5}>
                <Typography variant="h6" fontWeight={800}>{workOrder.work_order_number} • {workOrder.title}</Typography>
                <Typography variant="body2" color="text.secondary">{workOrder.client_name || "Client not shown"}</Typography>
                <Typography variant="body2" color="text.secondary">{workOrder.location || "No location set"}</Typography>
              </Stack>
              <FinanceStatusChip status={workOrder.status} />
            </Stack>

            {isMobile ? (
              <Paper
                variant="outlined"
                sx={{
                  p: 1,
                  borderRadius: 1.5,
                  position: "sticky",
                  top: -1,
                  zIndex: 2,
                  bgcolor: "background.paper",
                }}
              >
                <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.25 }} useFlexGap>
                  <Chip label="Schedule" clickable onClick={() => scrollToSection(scheduleSectionRef)} />
                  <Chip label="Trip" clickable onClick={() => scrollToSection(dispatchSectionRef)} />
                  <Chip label="Photos" clickable onClick={() => scrollToSection(photoSectionRef)} />
                  <Chip label="Notes" clickable onClick={() => scrollToSection(instructionsSectionRef)} />
                  <Chip label="Materials" clickable onClick={() => scrollToSection(materialsSectionRef)} />
                </Stack>
              </Paper>
            ) : null}

            <Paper ref={scheduleSectionRef} variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>Assigned date and time</Typography>
              {(workOrder.assignments || []).length ? (
                <Stack spacing={1}>
                  {workOrder.assignments.map((row) => (
                    <Typography key={row.assignment_id} variant="body2">
                      {row.work_date || "No date"}{row.start_time ? ` • ${row.start_time}` : ""}{row.end_time ? ` to ${row.end_time}` : ""}{row.timezone ? ` • ${row.timezone}` : workOrder.timezone ? ` • ${workOrder.timezone}` : ""}
                    </Typography>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">No assignment rows are visible for this job.</Typography>
              )}
            </Paper>

            <Paper ref={dispatchSectionRef} variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
              <Stack spacing={1.5}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ md: "center" }}>
                  <Box>
                    <Typography variant="h6" fontWeight={800}>Trip status</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {isMobile
                        ? "Tap On my way when you start traveling."
                        : "Use On my way when you start traveling to this job. Location sharing only stays active while you are on the way."}
                    </Typography>
                  </Box>
                  <Chip
                    color={dispatch?.status === "on_my_way" ? "warning" : dispatch?.status === "arrived" ? "success" : "default"}
                    label={DISPATCH_STATUS_LABELS[String(dispatch?.status || "not_started")] || "Not started"}
                    sx={
                      dispatch?.status === "on_my_way"
                        ? {
                            fontWeight: 800,
                            color: "#0f172a",
                            "& .MuiChip-label": { color: "#0f172a" },
                          }
                        : undefined
                    }
                  />
                </Stack>
                {!dispatchSettings?.enabled ? (
                  <Alert severity="info">Dispatch tracking is disabled for this company.</Alert>
                ) : null}
                {dispatchSettings?.enabled && dispatchSettings?.ack_required ? (
                  <Typography variant="caption" color="text.secondary">
                    {isMobile ? "One-time acknowledgment is required before first trip use." : "Trip tracking requires a one-time employee acknowledgment before first use."}
                  </Typography>
                ) : null}
                {dispatchError ? <Alert severity="error">{dispatchError}</Alert> : null}
                {dispatch?.public_url ? (
                  <Typography variant="caption" color="text.secondary">
                    {isMobile ? "A client tracking link can be shared for this trip." : "The manager can share a live client tracking link for this trip."}
                  </Typography>
                ) : null}
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
                  <Button
                    variant="contained"
                    sx={{ color: "#0f172a", fontWeight: 800 }}
                    disabled={!dispatchSettings?.enabled || dispatchBusy || dispatch?.status === "on_my_way"}
                    onClick={() => handleDispatchStatus("on_my_way")}
                  >
                    {dispatchBusy && dispatch?.status !== "on_my_way" ? "Working..." : "On my way"}
                  </Button>
                  <Button
                    variant="outlined"
                    disabled={!dispatchSettings?.enabled || dispatchBusy || dispatch?.status === "arrived"}
                    onClick={() => handleDispatchStatus("arrived")}
                  >
                    {dispatchBusy && dispatch?.status === "on_my_way" ? "Working..." : "Arrived"}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<AltRouteOutlinedIcon />}
                    disabled={routePreviewBusy}
                    onClick={handlePreviewRoute}
                  >
                    {routePreviewBusy ? "Loading..." : dispatch?.status === "on_my_way" ? "Refresh route" : "Preview route"}
                  </Button>
                </Stack>
                {dispatch?.last_location_captured_at ? (
                  <Typography variant="caption" color="text.secondary">
                    Last trip location sent at {formatDateTimeInTz(dispatch.last_location_captured_at, workOrder?.timezone || viewerTimezone, "LLL d, yyyy h:mm:ss a")}.
                  </Typography>
                ) : null}
                {(hasRouteOrigin || hasRouteDestination) ? (
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <RoomOutlinedIcon fontSize="small" />
                        <Typography fontWeight={800}>Trip route</Typography>
                      </Stack>
                      {dispatchRoute?.eta_seconds != null || dispatchRoute?.distance_meters != null ? (
                        <Stack spacing={0.35}>
                          {dispatchRoute?.eta_seconds != null ? (
                            <Typography variant="caption" color="text.secondary">ETA: {Math.max(1, Math.round(dispatchRoute.eta_seconds / 60))} min</Typography>
                          ) : null}
                          {dispatchRoute?.distance_meters != null ? (
                            <Typography variant="caption" color="text.secondary">
                              Distance remaining: {dispatchRoute.distance_meters >= 1000 ? `${(dispatchRoute.distance_meters / 1000).toFixed(dispatchRoute.distance_meters >= 10000 ? 0 : 1)} km` : `${Math.round(dispatchRoute.distance_meters)} m`}
                            </Typography>
                          ) : null}
                        </Stack>
                      ) : null}
                      <Box sx={{ height: 240, borderRadius: 1.5, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
                        <MapContainer center={routeCenter} zoom={11} style={{ height: "100%", width: "100%" }}>
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          {routePoints.length >= 2 ? (
                            <Polyline
                              positions={routePoints}
                              pathOptions={{
                                color: "#2563eb",
                                weight: 4,
                                opacity: 0.82,
                                dashArray: dispatchRoute?.provider === "google_directions" ? undefined : "8 8",
                              }}
                            />
                          ) : null}
                          {hasRouteOrigin ? (
                            <CircleMarker
                              center={[routeOrigin.lat, routeOrigin.lng]}
                              radius={9}
                              pathOptions={{ color: "#fff", weight: 2, fillColor: "#2563eb", fillOpacity: 0.9 }}
                            >
                              <Popup><Typography variant="body2">Your location</Typography></Popup>
                            </CircleMarker>
                          ) : null}
                          {hasRouteDestination ? (
                            <CircleMarker
                              center={[routeDestination.lat, routeDestination.lng]}
                              radius={8}
                              pathOptions={{ color: "#fff", weight: 2, fillColor: "#dc2626", fillOpacity: 0.88 }}
                            >
                              <Popup><Typography variant="body2">{routeDestination?.label || workOrder.location || "Destination"}</Typography></Popup>
                            </CircleMarker>
                          ) : null}
                        </MapContainer>
                      </Box>
                      {routeReasonLabel ? <Alert severity="info" icon={<AltRouteOutlinedIcon fontSize="inherit" />}>{routeReasonLabel}</Alert> : null}
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {routeOrigin?.map_url ? (
                          <Button size="small" variant="outlined" startIcon={<OpenInNewOutlinedIcon />} component="a" href={routeOrigin.map_url} target="_blank" rel="noreferrer">
                            Open my location
                          </Button>
                        ) : null}
                        {routeDestination?.map_url ? (
                          <Button size="small" variant="outlined" startIcon={<RoomOutlinedIcon />} component="a" href={routeDestination.map_url} target="_blank" rel="noreferrer">
                            Open destination
                          </Button>
                        ) : null}
                      </Stack>
                    </Stack>
                  </Paper>
                ) : null}
              </Stack>
            </Paper>

            <Paper ref={photoSectionRef} variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
              <Stack spacing={1.5}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ md: "center" }}>
                  <Box>
                    <Typography variant="h6" fontWeight={800}>Job photos</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {isMobile
                        ? "Upload job photos and notes for this work order."
                        : "Upload proof-of-work photos directly to this assigned job. These photos also appear for the manager and in Client 360 when the work order is client-linked."}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {photos.length || workOrder.field_photo_count || 0} linked photo{Number(photos.length || workOrder.field_photo_count || 0) === 1 ? "" : "s"}
                  </Typography>
                </Stack>
                {photoError ? <Alert severity="error">{photoError}</Alert> : null}
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ md: "center" }}>
                  <Button component="label" variant="outlined">
                    {photoFile ? photoFile.name : "Choose photo"}
                    <input
                      hidden
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(event) => setPhotoFile(event.target.files?.[0] || null)}
                    />
                  </Button>
                  <TextField
                    size="small"
                    label={isMobile ? "Note" : "Photo note"}
                    value={photoNote}
                    onChange={(event) => setPhotoNote(event.target.value)}
                    sx={{ minWidth: { xs: "100%", md: 260 } }}
                  />
                  <Button variant="contained" disabled={!photoFile || uploadingPhoto} onClick={handleUploadPhoto}>
                    {uploadingPhoto ? "Uploading..." : "Upload photo"}
                  </Button>
                </Stack>
                {(photos || []).length ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {photos.slice(0, 8).map((row) => (
                      <Stack
                        key={row.id}
                        spacing={0.75}
                        sx={{
                          width: 120,
                          p: 1,
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 1,
                        }}
                      >
                        <Box
                          role="button"
                          tabIndex={0}
                          onClick={() => handleOpenPhoto(row)}
                          onKeyDown={(event) => { if (event.key === "Enter") handleOpenPhoto(row); }}
                          sx={{
                            height: 88,
                            borderRadius: 1,
                            bgcolor: "action.hover",
                            overflow: "hidden",
                            display: "grid",
                            placeItems: "center",
                            cursor: "pointer",
                          }}
                        >
                          {photoPreviewUrls[row.id] ? (
                            <Box component="img" src={photoPreviewUrls[row.id]} alt={row.file_name || "Job photo"} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <Typography variant="caption" color="text.secondary">{row.is_download_ready ? "Preview" : "Processing"}</Typography>
                          )}
                        </Box>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          {row.note || row.file_name || "Job photo"}
                        </Typography>
                        <Button size="small" variant="text" onClick={() => handleOpenPhoto(row)} disabled={!row.is_download_ready}>
                          Open
                        </Button>
                      </Stack>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">No job photos uploaded yet.</Typography>
                )}
              </Stack>
            </Paper>

            <Paper ref={instructionsSectionRef} variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>Instructions</Typography>
              <Typography variant="body2" color="text.secondary">{workOrder.employee_visible_notes || "No employee instructions yet."}</Typography>
            </Paper>

            <Paper ref={materialsSectionRef} variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>Planned materials</Typography>
              {(workOrder.planned_materials || []).length ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Material</TableCell>
                      <TableCell>Planned quantity</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {workOrder.planned_materials.map((row, index) => (
                      <TableRow key={`planned-material-${index}`}>
                        <TableCell>{row.title}</TableCell>
                        <TableCell>{row.qty_planned}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2" color="text.secondary">No planned materials were shared for this job.</Typography>
              )}
            </Paper>

            <Alert severity="info">
              {isMobile
                ? "Submit a field report when the job is done."
                : "Submit a field report when work is done or when the manager needs an update from the field."}
            </Alert>
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions sx={isMobile ? { position: "sticky", bottom: 0, bgcolor: "background.paper", borderTop: "1px solid", borderColor: "divider", zIndex: 2 } : undefined}>
        {workOrder?.status === "completed" ? (
          <Button variant="outlined" onClick={onViewReports}>My Field Reports</Button>
        ) : (
          <Button variant="contained" disabled={!workOrder} onClick={() => onSubmitReport?.(workOrder)}>Submit Field Report</Button>
        )}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
      <Dialog open={dispatchAckModalOpen} onClose={() => !dispatchAckBusy && setDispatchAckModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Trip location sharing notice</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip size="small" label="Trip-only tracking" color="primary" variant="outlined" />
              <Chip size="small" label={`Policy ${dispatchAckInfo?.policy_version || "v1"}`} variant="outlined" />
            </Stack>
            <Alert severity="info" sx={{ py: 0.5 }}>
              This only turns on after you tap <strong>On my way</strong> for an assigned job.
            </Alert>
            <Box sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "background.paper" }}>
              <Stack spacing={1}>
                <Typography variant="body2">• Your manager can view your trip status and last known trip location.</Typography>
                {dispatchAckInfo?.client_sharing_possible ? (
                  <Typography variant="body2">• The client may receive a temporary tracking link for this trip if your company enables it.</Typography>
                ) : null}
                <Typography variant="body2">• Tracking stops when you tap Arrived or when your company ends the trip automatically.</Typography>
              </Stack>
            </Box>
            <FormControlLabel
              control={<Checkbox checked={dispatchAckRemember} onChange={(event) => setDispatchAckRemember(event.target.checked)} />}
              label="Remember my acknowledgment until this policy changes"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDispatchAckModalOpen(false)} disabled={dispatchAckBusy}>Cancel</Button>
          <Button variant="contained" onClick={handleAcceptDispatchAcknowledgement} disabled={dispatchAckBusy}>
            {dispatchAckBusy ? "Saving..." : "Continue"}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
