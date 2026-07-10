import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import MailOutlineOutlinedIcon from "@mui/icons-material/MailOutlineOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import LinkOffOutlinedIcon from "@mui/icons-material/LinkOffOutlined";
import RoomOutlinedIcon from "@mui/icons-material/RoomOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import AltRouteOutlinedIcon from "@mui/icons-material/AltRouteOutlined";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, Polyline, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import Supercluster from "supercluster";
import "leaflet/dist/leaflet.css";
import ManagementFrame from "../../../components/ui/ManagementFrame";
import FinanceMetricCard from "../../finance/components/FinanceMetricCard";
import {
  createWorkOrderDispatchLink,
  getDispatchRoute,
  listDispatchActivity,
  listDispatchItems,
  revokeWorkOrderDispatchLink,
  sendWorkOrderDispatchLinkEmail,
} from "../../finance/financeApi";
import { getUserTimezone } from "../../../utils/timezone";
import { formatDateTimeInTz } from "../../../utils/datetime";

const statusChipColor = (status) => {
  switch (String(status || "").toLowerCase()) {
    case "on_my_way":
      return "primary";
    case "arrived":
      return "success";
    default:
      return "default";
  }
};

const statusMarkerColor = (row) => {
  if (row?.is_stale) return "#d97706";
  switch (String(row?.status || "").toLowerCase()) {
    case "on_my_way":
      return "#2563eb";
    case "arrived":
      return "#16a34a";
    default:
      return "#64748b";
  }
};

const formatDateTime = (value, timezone) => (value ? formatDateTimeInTz(value, timezone, "LLL d, yyyy h:mm a") : "—");

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

const formatApproxLocation = (snapshot) => {
  const lat = Number(snapshot?.lat);
  const lng = Number(snapshot?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "";
  const accuracy = Number(snapshot?.accuracy_m);
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}${Number.isFinite(accuracy) ? ` • ~${Math.round(accuracy)}m` : ""}`;
};

const neutralFilterChipSx = (selected) => ({
  bgcolor: selected ? "rgba(37, 99, 235, 0.16)" : "transparent",
  color: selected ? "#1d4ed8" : "text.primary",
  borderColor: selected ? "rgba(37, 99, 235, 0.45)" : "divider",
  fontWeight: selected ? 700 : 600,
});

const stalePulseSx = {
  animation: "dispatchStalePulse 1.8s ease-in-out infinite",
  "@keyframes dispatchStalePulse": {
    "0%": { boxShadow: "0 0 0 0 rgba(217, 119, 6, 0.18)" },
    "70%": { boxShadow: "0 0 0 8px rgba(217, 119, 6, 0)" },
    "100%": { boxShadow: "0 0 0 0 rgba(217, 119, 6, 0)" },
  },
};

function FitMapToPoints({ items }) {
  const map = useMap();
  useEffect(() => {
    if (!items.length) return;
    const bounds = L.latLngBounds(items.map((item) => [item.location.lat, item.location.lng]));
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 12 });
  }, [items, map]);
  return null;
}

function FocusSelectedTrip({ row }) {
  const map = useMap();
  useEffect(() => {
    if (!Number.isFinite(row?.location?.lat) || !Number.isFinite(row?.location?.lng)) return;
    map.flyTo([row.location.lat, row.location.lng], Math.max(map.getZoom(), 12), {
      animate: true,
      duration: 0.45,
    });
  }, [map, row?.id, row?.location?.lat, row?.location?.lng]);
  return null;
}

function FitRouteBounds({ route }) {
  const map = useMap();
  useEffect(() => {
    const points = Array.isArray(route?.polyline) ? route.polyline : [];
    if (points.length < 2) return;
    const bounds = L.latLngBounds(points.map((point) => [point[0], point[1]]));
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: 13 });
  }, [map, route?.polyline]);
  return null;
}

function MapBoundsWatcher({ onChange }) {
  useMapEvents({
    moveend(event) {
      const map = event.target;
      const bounds = map.getBounds();
      onChange({
        zoom: map.getZoom(),
        bounds: [
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth(),
        ],
      });
    },
  });
  return null;
}

function clusterIcon(pointCount) {
  return L.divIcon({
    html: `<div style="background:#111827;color:#fff;border-radius:999px;width:42px;height:42px;display:flex;align-items:center;justify-content:center;font-weight:800;border:3px solid rgba(255,255,255,.95);box-shadow:0 6px 18px rgba(15,23,42,.24);">${pointCount}</div>`,
    className: "",
    iconSize: [42, 42],
  });
}

function eventChipSx(eventType) {
  const value = String(eventType || "").toLowerCase();
  if (value === "location_stale") {
    return {
      bgcolor: "rgba(217, 119, 6, 0.12)",
      color: "#b45309",
      borderColor: "rgba(217, 119, 6, 0.28)",
    };
  }
  if (value === "location_resumed" || value === "arrived") {
    return {
      bgcolor: "rgba(22, 163, 74, 0.12)",
      color: "#15803d",
      borderColor: "rgba(22, 163, 74, 0.28)",
    };
  }
  if (value === "on_my_way" || value === "tracking_link_created" || value === "tracking_link_sent") {
    return {
      bgcolor: "rgba(37, 99, 235, 0.12)",
      color: "#1d4ed8",
      borderColor: "rgba(37, 99, 235, 0.28)",
    };
  }
  return {
    bgcolor: "rgba(15, 23, 42, 0.06)",
    color: "text.secondary",
    borderColor: "divider",
  };
}

function activityMetaSummary(row) {
  const meta = row?.meta_json || {};
  if (meta.sent_to) return `Sent to ${meta.sent_to}`;
  if (meta.minutes_since_location != null) return `No location update for ${meta.minutes_since_location} min`;
  if (meta.resume_source === "arrived") return "Stale warning closed after arrival";
  if (meta.resume_source === "location_update") return "Fresh location update received";
  if (meta.public_path) return meta.public_path;
  return "";
}

const DISPATCH_AUTO_REFRESH_MS = 2 * 60 * 1000;

function DispatchMapMarkers({ clusters, clusterIndex, selectedDispatchId, onSelect }) {
  const map = useMap();
  return clusters.map((cluster) => {
    const [lng, lat] = cluster.geometry.coordinates;
    const { cluster: isCluster, point_count: pointCount } = cluster.properties || {};
    if (isCluster) {
      return (
        <Marker
          key={`cluster-${cluster.id}`}
          position={[lat, lng]}
          icon={clusterIcon(pointCount)}
          eventHandlers={{
            click: () => {
              if (!clusterIndex?.getClusterExpansionZoom) return;
              const zoom = Math.min(clusterIndex.getClusterExpansionZoom(cluster.id), 16);
              map.flyTo([lat, lng], zoom, { animate: true, duration: 0.4 });
            },
          }}
        >
          <Popup>{pointCount} employees in this area</Popup>
        </Marker>
      );
    }
    const row = cluster.properties?.row;
    return (
      <CircleMarker
        key={`dispatch-marker-${row.id}`}
        center={[lat, lng]}
        radius={row.id === selectedDispatchId ? 12 : 9}
        pathOptions={{
          color: "#fff",
          weight: row.id === selectedDispatchId ? 3 : 2,
          fillColor: statusMarkerColor(row),
          fillOpacity: row.id === selectedDispatchId ? 0.98 : 0.82,
        }}
        eventHandlers={{ click: () => onSelect(row.id) }}
      >
        <Popup>
          <Stack spacing={0.5}>
            <Typography fontWeight={700}>{row.recruiter_name || "Assigned employee"}</Typography>
            <Typography variant="body2">{[row.work_order_number, row.work_order_title].filter(Boolean).join(" • ")}</Typography>
            <Typography variant="caption" color="text.secondary">{row.client_name || "No client linked"}</Typography>
          </Stack>
        </Popup>
      </CircleMarker>
    );
  });
}

export default function DispatchTrackingPanel() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const timezone = getUserTimezone();
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [settings, setSettings] = useState(null);
  const [filtersApplied, setFiltersApplied] = useState(null);
  const [filterOptions, setFilterOptions] = useState({ employees: [], departments: [], clients: [], work_orders: [] });
  const [activity, setActivity] = useState([]);
  const [selectedDispatchId, setSelectedDispatchId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routeError, setRouteError] = useState("");
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState("");
  const [mapState, setMapState] = useState({ zoom: 5, bounds: null });
  const [filters, setFilters] = useState({
    date: "today",
    status: "active",
    search: "",
    date_from: "",
    date_to: "",
    employee_id: "",
    department_id: "",
    client_id: "",
    work_order_id: "",
    preset: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        date: filters.date,
        status: filters.status,
        search: filters.search || undefined,
        date_from: filters.date === "custom" ? filters.date_from || undefined : undefined,
        date_to: filters.date === "custom" ? filters.date_to || undefined : undefined,
        employee_id: filters.employee_id || undefined,
        department_id: filters.department_id || undefined,
        client_id: filters.client_id || undefined,
        work_order_id: filters.work_order_id || undefined,
      };
      const res = await listDispatchItems(params);
      const nextItems = Array.isArray(res?.items) ? res.items : [];
      setItems(nextItems);
      setSummary(res?.summary || null);
      setSettings(res?.settings || null);
      setFiltersApplied(res?.filters_applied || null);
      setFilterOptions(res?.filter_options || { employees: [], departments: [], clients: [], work_orders: [] });
      setSelectedDispatchId((prev) => (nextItems.some((row) => row.id === prev) ? prev : nextItems[0]?.id || null));
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to load dispatch trips.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      load();
    }, DISPATCH_AUTO_REFRESH_MS);
    return () => window.clearInterval(intervalId);
  }, [load]);

  const loadActivity = useCallback(async () => {
    setActivityLoading(true);
    try {
      const res = await listDispatchActivity({
        dispatch_state_id: selectedDispatchId || undefined,
        search: filters.search || undefined,
        employee_id: filters.employee_id || undefined,
        department_id: filters.department_id || undefined,
        client_id: filters.client_id || undefined,
        work_order_id: filters.work_order_id || undefined,
        limit: 25,
      });
      setActivity(Array.isArray(res?.items) ? res.items : []);
    } catch (_err) {
      setActivity([]);
    } finally {
      setActivityLoading(false);
    }
  }, [filters.search, filters.employee_id, filters.department_id, filters.client_id, filters.work_order_id, selectedDispatchId]);

  useEffect(() => {
    if (!selectedDispatchId && !filters.search && !filters.employee_id && !filters.department_id && !filters.client_id && !filters.work_order_id) {
      setActivity([]);
      return;
    }
    loadActivity();
  }, [loadActivity, selectedDispatchId, filters.search, filters.employee_id, filters.department_id, filters.client_id, filters.work_order_id]);

  const handleCreateOrCopyLink = async (row) => {
    if (!row?.work_order_id || !row?.recruiter_id) return;
    const busyId = `copy-${row.id}`;
    setBusyKey(busyId);
    try {
      const next = row?.public_url
        ? row
        : (await createWorkOrderDispatchLink(row.work_order_id, row.recruiter_id))?.dispatch;
      if (next?.public_url) {
        await navigator.clipboard.writeText(next.public_url);
        enqueueSnackbar("Tracking link copied.", { variant: "success" });
      }
      await load();
      await loadActivity();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to create tracking link.", { variant: "error" });
    } finally {
      setBusyKey("");
    }
  };

  const handleSend = async (row) => {
    const busyId = `send-${row.id}`;
    setBusyKey(busyId);
    try {
      const res = await sendWorkOrderDispatchLinkEmail(row.work_order_id, row.recruiter_id);
      enqueueSnackbar(`Tracking link emailed to ${res?.sent_to || "the client"}.`, { variant: "success" });
      await load();
      await loadActivity();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to send tracking link.", { variant: "error" });
    } finally {
      setBusyKey("");
    }
  };

  const handleRevoke = async (row) => {
    const busyId = `revoke-${row.id}`;
    setBusyKey(busyId);
    try {
      await revokeWorkOrderDispatchLink(row.work_order_id, row.recruiter_id);
      enqueueSnackbar("Tracking link revoked.", { variant: "success" });
      await load();
      await loadActivity();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to revoke tracking link.", { variant: "error" });
    } finally {
      setBusyKey("");
    }
  };

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const presetFilteredItems = useMemo(() => {
    if (filters.preset === "needs_attention") {
      return items.filter((row) => row.is_stale || (String(row.status || "").toLowerCase() === "on_my_way" && !row.location?.captured_at));
    }
    if (filters.preset === "links_sent") {
      return items.filter((row) => Boolean(row.last_client_email_sent_at));
    }
    if (filters.preset === "no_location") {
      return items.filter((row) => !row.location?.captured_at);
    }
    return items;
  }, [filters.preset, items]);

  useEffect(() => {
    setSelectedDispatchId((prev) => (presetFilteredItems.some((row) => row.id === prev) ? prev : presetFilteredItems[0]?.id || null));
  }, [presetFilteredItems]);

  const selectedRow = useMemo(
    () => presetFilteredItems.find((row) => row.id === selectedDispatchId) || null,
    [presetFilteredItems, selectedDispatchId]
  );

  useEffect(() => {
    let cancelled = false;
    const loadRoute = async () => {
      if (!selectedRow?.id) {
        setSelectedRoute(null);
        setRouteError("");
        return;
      }
      if (!selectedRow.can_route) {
        setSelectedRoute(null);
        setRouteError(selectedRow.route_ready_reason || "");
        return;
      }
      setRouteLoading(true);
      setRouteError("");
      try {
        const res = await getDispatchRoute(selectedRow.id);
        if (cancelled) return;
        setSelectedRoute(res?.route || null);
        setRouteError(res?.route?.reason || "");
      } catch (err) {
        if (cancelled) return;
        setSelectedRoute(null);
        setRouteError(err?.response?.data?.error || err?.message || "Unable to load route details.");
      } finally {
        if (!cancelled) setRouteLoading(false);
      }
    };
    loadRoute();
    return () => {
      cancelled = true;
    };
  }, [selectedRow?.id, selectedRow?.can_route, selectedRow?.route_ready_reason]);

  const mapPoints = useMemo(
    () => presetFilteredItems.filter((row) => Number.isFinite(row?.location?.lat) && Number.isFinite(row?.location?.lng)),
    [presetFilteredItems]
  );

  const geoPoints = useMemo(
    () => mapPoints.map((row) => ({
      type: "Feature",
      properties: { cluster: false, dispatchId: row.id, row },
      geometry: {
        type: "Point",
        coordinates: [row.location.lng, row.location.lat],
      },
    })),
    [mapPoints]
  );

  const clusterIndex = useMemo(() => {
    if (!geoPoints.length) return null;
    const nextIndex = new Supercluster({ radius: 68, maxZoom: 16 });
    nextIndex.load(geoPoints);
    return nextIndex;
  }, [geoPoints]);

  const clusters = useMemo(() => {
    if (!clusterIndex?.getClusters) return [];
    const bbox = mapState.bounds || [-140, 20, -40, 70];
    const zoom = Number.isFinite(mapState.zoom) ? Math.round(mapState.zoom) : 5;
    return clusterIndex.getClusters(bbox, zoom);
  }, [clusterIndex, mapState.bounds, mapState.zoom]);

  const selectedLinkStatus = selectedRow?.public_url
    ? selectedRow?.public_link_revoked_at
      ? "Revoked"
      : "Active"
    : "Not created";

  const selectedAuditSummary = useMemo(() => {
    if (!selectedRow) return [];
    const latestByType = {};
    for (const row of activity) {
      const type = String(row?.event_type || "").toLowerCase();
      if (!latestByType[type]) latestByType[type] = row;
    }
    const onMyWayEvent = latestByType.on_my_way;
    const arrivedEvent = latestByType.arrived;
    return [
      onMyWayEvent?.created_at ? `On my way: ${formatDateTime(onMyWayEvent.created_at, timezone)}` : (selectedRow.on_my_way_at ? `On my way: ${formatDateTime(selectedRow.on_my_way_at, timezone)}` : null),
      formatApproxLocation(onMyWayEvent?.location_snapshot) ? `Approx. On my way location: ${formatApproxLocation(onMyWayEvent?.location_snapshot)}` : null,
      arrivedEvent?.created_at ? `Arrived: ${formatDateTime(arrivedEvent.created_at, timezone)}` : (selectedRow.arrived_at ? `Arrived: ${formatDateTime(selectedRow.arrived_at, timezone)}` : null),
      formatApproxLocation(arrivedEvent?.location_snapshot) ? `Approx. Arrived location: ${formatApproxLocation(arrivedEvent?.location_snapshot)}` : null,
      selectedRow.last_client_email_sent_at ? `Last tracking email: ${formatDateTime(selectedRow.last_client_email_sent_at, timezone)}` : null,
      selectedRow.location?.captured_at ? `Last location ping: ${formatDateTime(selectedRow.location.captured_at, timezone)}` : null,
    ].filter(Boolean);
  }, [activity, selectedRow, timezone]);

  const routeSummary = useMemo(() => {
    if (!selectedRoute || selectedRoute.status !== "available") return [];
    return [
      selectedRoute.eta_seconds != null ? `ETA: ${formatEta(selectedRoute.eta_seconds)}` : null,
      selectedRoute.distance_meters != null ? `Distance remaining: ${formatDistance(selectedRoute.distance_meters)}` : null,
    ].filter(Boolean);
  }, [selectedRoute]);

  const routeReasonLabel = useMemo(() => {
    switch (String(routeError || "").toLowerCase()) {
      case "route_only_available_on_my_way":
        return "Routing is shown only while the trip is On my way.";
      case "missing_origin_location":
        return "No live trip location is available yet.";
      case "missing_destination_coordinates":
        return "Destination coordinates are not available for this work order yet.";
      case "stale_origin_location":
        return "Trip location is stale, so the route preview is paused.";
      default:
        return routeError ? "Route preview is unavailable right now." : "";
    }
  }, [routeError]);

  return (
    <ManagementFrame
      title="Dispatch"
      subtitle="Filter today’s trips, watch active employees on the map, and review useful trip events without mixing this into punch-location audit screens."
      fullWidth
    >
      <Stack spacing={2}>
        {!settings?.enabled ? (
          <Alert severity="info">
            Dispatch tracking is currently disabled. Enable it from Time Tracking settings to let employees start On my way trips.
          </Alert>
        ) : null}
        {error ? <Alert severity="error">{error}</Alert> : null}
        {loading ? (
          <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
        ) : (
          <>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack spacing={1.5}>
                <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5} justifyContent="space-between">
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip label="Today" variant={filters.date === "today" ? "filled" : "outlined"} sx={neutralFilterChipSx(filters.date === "today")} onClick={() => updateFilter("date", "today")} />
                    <Chip label="Tomorrow" variant={filters.date === "tomorrow" ? "filled" : "outlined"} sx={neutralFilterChipSx(filters.date === "tomorrow")} onClick={() => updateFilter("date", "tomorrow")} />
                    <Chip label="Custom" variant={filters.date === "custom" ? "filled" : "outlined"} sx={neutralFilterChipSx(filters.date === "custom")} onClick={() => updateFilter("date", "custom")} />
                    <Chip label="All dates" variant={filters.date === "all" ? "filled" : "outlined"} sx={neutralFilterChipSx(filters.date === "all")} onClick={() => updateFilter("date", "all")} />
                  </Stack>
                  <Button variant="outlined" onClick={load}>Refresh</Button>
                </Stack>
                <Stack direction={{ xs: "column", lg: "row" }} spacing={1.25}>
                  <TextField
                    size="small"
                    label="Search employee, client, work order"
                    value={filters.search}
                    onChange={(event) => updateFilter("search", event.target.value)}
                    sx={{ minWidth: { xs: "100%", lg: 320 } }}
                  />
                  <TextField
                    select
                    size="small"
                    label="Employee"
                    value={filters.employee_id}
                    onChange={(event) => updateFilter("employee_id", event.target.value)}
                    sx={{ minWidth: { xs: "100%", md: 180 } }}
                  >
                    <MenuItem value="">All employees</MenuItem>
                    {(filterOptions.employees || []).map((option) => (
                      <MenuItem key={option.id} value={String(option.id)}>{option.label}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    size="small"
                    label="Department"
                    value={filters.department_id}
                    onChange={(event) => updateFilter("department_id", event.target.value)}
                    sx={{ minWidth: { xs: "100%", md: 180 } }}
                  >
                    <MenuItem value="">All departments</MenuItem>
                    {(filterOptions.departments || []).map((option) => (
                      <MenuItem key={option.id} value={String(option.id)}>{option.label}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    size="small"
                    label="Client"
                    value={filters.client_id}
                    onChange={(event) => updateFilter("client_id", event.target.value)}
                    sx={{ minWidth: { xs: "100%", md: 200 } }}
                  >
                    <MenuItem value="">All clients</MenuItem>
                    {(filterOptions.clients || []).map((option) => (
                      <MenuItem key={option.id} value={String(option.id)}>{option.label}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    size="small"
                    label="Work order"
                    value={filters.work_order_id}
                    onChange={(event) => updateFilter("work_order_id", event.target.value)}
                    sx={{ minWidth: { xs: "100%", md: 240 } }}
                  >
                    <MenuItem value="">All work orders</MenuItem>
                    {(filterOptions.work_orders || []).map((option) => (
                      <MenuItem key={option.id} value={String(option.id)}>{option.label}</MenuItem>
                    ))}
                  </TextField>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                    <Chip label="Active" variant={filters.status === "active" ? "filled" : "outlined"} sx={neutralFilterChipSx(filters.status === "active")} onClick={() => updateFilter("status", "active")} />
                    <Chip label="On my way" variant={filters.status === "on_my_way" ? "filled" : "outlined"} sx={neutralFilterChipSx(filters.status === "on_my_way")} onClick={() => updateFilter("status", "on_my_way")} />
                    <Chip label="Arrived" variant={filters.status === "arrived" ? "filled" : "outlined"} sx={neutralFilterChipSx(filters.status === "arrived")} onClick={() => updateFilter("status", "arrived")} />
                    <Chip label="All statuses" variant={filters.status === "all" ? "filled" : "outlined"} sx={neutralFilterChipSx(filters.status === "all")} onClick={() => updateFilter("status", "all")} />
                  </Stack>
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                  <Chip
                    label="Needs attention"
                    variant={filters.preset === "needs_attention" ? "filled" : "outlined"}
                    color={filters.preset === "needs_attention" ? "warning" : "default"}
                    onClick={() => updateFilter("preset", filters.preset === "needs_attention" ? "" : "needs_attention")}
                  />
                  <Chip
                    label="Links sent"
                    variant={filters.preset === "links_sent" ? "filled" : "outlined"}
                    color={filters.preset === "links_sent" ? "success" : "default"}
                    onClick={() => updateFilter("preset", filters.preset === "links_sent" ? "" : "links_sent")}
                  />
                  <Chip
                    label="No location yet"
                    variant={filters.preset === "no_location" ? "filled" : "outlined"}
                    color={filters.preset === "no_location" ? "warning" : "default"}
                    onClick={() => updateFilter("preset", filters.preset === "no_location" ? "" : "no_location")}
                  />
                  {filters.preset ? (
                    <Chip label="Clear preset" variant="outlined" onClick={() => updateFilter("preset", "")} />
                  ) : null}
                </Stack>
                {filters.date === "custom" ? (
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
                    <TextField size="small" label="From" type="date" value={filters.date_from} onChange={(event) => updateFilter("date_from", event.target.value)} InputLabelProps={{ shrink: true }} />
                    <TextField size="small" label="To" type="date" value={filters.date_to} onChange={(event) => updateFilter("date_to", event.target.value)} InputLabelProps={{ shrink: true }} />
                  </Stack>
                ) : null}
                {filtersApplied ? (
                  <Typography variant="caption" color="text.secondary">
                    Showing {presetFilteredItems.length} trip{Number(presetFilteredItems.length || 0) === 1 ? "" : "s"} for {filtersApplied.date === "today" ? "today" : filtersApplied.date === "tomorrow" ? "tomorrow" : filtersApplied.date === "custom" ? "the selected dates" : "all dates"}{filters.preset ? " with the selected preset." : "."}
                  </Typography>
                ) : null}
              </Stack>
            </Paper>

            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <FinanceMetricCard label="Matching trips" value={String(summary?.matching_trips || 0)} helper="Trips matching the current date, status, and search filters." accent="secondary" />
              </Grid>
              <Grid item xs={12} md={3}>
                <FinanceMetricCard label="On the way" value={String(summary?.on_my_way || 0)} helper="Employees currently traveling to a client job." accent="primary" />
              </Grid>
              <Grid item xs={12} md={3}>
                <FinanceMetricCard label="Arrived" value={String(summary?.arrived || 0)} helper="Trips marked as arrived." accent="success" />
              </Grid>
              <Grid item xs={12} md={3}>
                <FinanceMetricCard label="Stale trips" value={String(summary?.stale_trips || 0)} helper="On my way trips with no fresh location update in the last 10 minutes." accent="warning" />
              </Grid>
            </Grid>

            <Grid container spacing={2} alignItems="flex-start">
              <Grid item xs={12} lg={4}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%", minHeight: 420, display: "flex", flexDirection: "column" }}>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1} sx={{ mb: 1.5 }}>
                    <Box>
                      <Typography fontWeight={800}>Trip queue</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Review and select active trips before opening details, map focus, and activity.
                      </Typography>
                    </Box>
                    <Chip size="small" variant="outlined" label={`${presetFilteredItems.length} shown`} />
                  </Stack>
                  <Stack spacing={1.5} sx={{ flex: 1, overflowY: "auto", pr: 0.5 }}>
                    {presetFilteredItems.length ? presetFilteredItems.map((row) => (
                      <Paper
                        key={row.id}
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          borderColor: row.id === selectedDispatchId ? "primary.main" : "divider",
                          cursor: "pointer",
                          ...(row.is_stale ? stalePulseSx : null),
                        }}
                        onClick={() => setSelectedDispatchId(row.id)}
                      >
                        <Stack spacing={1.25}>
                          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.5}>
                            <Box>
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 0.75 }}>
                                <Typography fontWeight={800}>{row.recruiter_name || "Assigned employee"}</Typography>
                                <Chip size="small" label={String(row.status || "").replaceAll("_", " ")} color={statusChipColor(row.status)} variant="outlined" />
                                {row.is_stale ? <Chip size="small" color="warning" variant="outlined" label="Stale" /> : null}
                              </Stack>
                              <Typography variant="body2" color="text.secondary">
                                {[row.work_order_number, row.work_order_title, row.client_name].filter(Boolean).join(" • ")}
                              </Typography>
                              {row.department_name ? (
                                <Typography variant="caption" color="text.secondary">
                                  Department: {row.department_name}
                                </Typography>
                              ) : null}
                              <Typography variant="body2" color="text.secondary">
                                {row.destination || "No destination set"}
                              </Typography>
                              {row.assignment?.work_date ? (
                                <Typography variant="caption" color="text.secondary">
                                  Scheduled {row.assignment.work_date}
                                  {row.assignment.start_time ? ` • ${row.assignment.start_time}` : ""}
                                  {row.assignment.end_time ? ` to ${row.assignment.end_time}` : ""}
                                </Typography>
                              ) : null}
                            </Box>
                            <Stack alignItems={{ xs: "flex-start", md: "flex-end" }} spacing={0.5}>
                              <Typography variant="caption" color="text.secondary">
                                Last update {formatDateTime(row.updated_at || row.last_location_captured_at, timezone)}
                              </Typography>
                              {row.location?.captured_at ? (
                                <Typography variant="caption" color="text.secondary">
                                  Location captured {formatDateTime(row.location.captured_at, timezone)}
                                </Typography>
                              ) : (
                                <Typography variant="caption" color="text.secondary">
                                  No location ping yet
                                </Typography>
                              )}
                              <Button size="small" variant={row.id === selectedDispatchId ? "contained" : "outlined"} onClick={(event) => { event.stopPropagation(); setSelectedDispatchId(row.id); }}>
                                {row.id === selectedDispatchId ? "Selected" : "Review trip"}
                              </Button>
                            </Stack>
                          </Stack>
                        </Stack>
                      </Paper>
                    )) : (
                      <Alert severity="info">No dispatch trips match the current filters.</Alert>
                    )}
                  </Stack>
                </Paper>
              </Grid>

              <Grid item xs={12} lg={8}>
                <Stack spacing={2}>
                  <Grid container spacing={2} alignItems="stretch">
                    <Grid item xs={12} xl={5}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%" }}>
                        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                          <Box>
                            <Typography fontWeight={800}>Selected trip details</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {selectedRow ? "Focused trip state, link status, and the latest dispatch checkpoints." : "Select a trip from the list or map to focus it here."}
                            </Typography>
                          </Box>
                          {selectedRow ? (
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                              <Chip size="small" label={String(selectedRow.status || "").replaceAll("_", " ")} color={statusChipColor(selectedRow.status)} variant="outlined" />
                              {selectedRow.is_stale ? <Chip size="small" label="Stale" color="warning" variant="outlined" /> : null}
                              <Chip size="small" label={`Link: ${selectedLinkStatus}`} variant="outlined" />
                            </Stack>
                          ) : null}
                        </Stack>
                        {selectedRow ? (
                          <Stack spacing={1} sx={{ mt: 1.25 }}>
                            <Grid container spacing={1.25}>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="caption" color="text.secondary">Employee</Typography>
                                <Typography fontWeight={700}>{selectedRow.recruiter_name || "Assigned employee"}</Typography>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="caption" color="text.secondary">Client</Typography>
                                <Typography fontWeight={700}>{selectedRow.client_name || "No client linked"}</Typography>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="caption" color="text.secondary">Work order</Typography>
                                <Typography fontWeight={700}>{[selectedRow.work_order_number, selectedRow.work_order_title].filter(Boolean).join(" • ") || "—"}</Typography>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="caption" color="text.secondary">Department</Typography>
                                <Typography fontWeight={700}>{selectedRow.department_name || "Unassigned"}</Typography>
                              </Grid>
                            </Grid>
                            <Stack spacing={0.5}>
                              {selectedAuditSummary.map((line) => (
                                <Typography key={line} variant="caption" color="text.secondary">{line}</Typography>
                              ))}
                              {routeSummary.map((line) => (
                                <Typography key={line} variant="caption" color="text.secondary">{line}</Typography>
                              ))}
                              {!selectedAuditSummary.length && !routeSummary.length ? (
                                <Typography variant="caption" color="text.secondary">No audit checkpoints recorded yet.</Typography>
                              ) : null}
                            </Stack>
                            {routeReasonLabel ? (
                              <Alert severity="info" icon={<AltRouteOutlinedIcon fontSize="inherit" />} sx={{ py: 0.25 }}>
                                {routeReasonLabel}
                              </Alert>
                            ) : null}
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                              <Button size="small" variant="outlined" onClick={() => navigate("/manager/dashboard?view=finance-work-orders")}>
                                Open work order
                              </Button>
                              {selectedRow.client_id ? (
                                <Button size="small" variant="outlined" onClick={() => navigate(`/manager/clients/${selectedRow.client_id}`)}>
                                  Open client
                                </Button>
                              ) : null}
                              {selectedRow.map_url ? (
                                <Button size="small" variant="outlined" component="a" href={selectedRow.map_url} target="_blank" rel="noreferrer">
                                  Open map
                                </Button>
                              ) : null}
                            </Stack>
                            <Divider flexItem />
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                              <Button size="small" variant="outlined" startIcon={<ContentCopyOutlinedIcon />} onClick={() => handleCreateOrCopyLink(selectedRow)} disabled={Boolean(busyKey)}>
                                {busyKey === `copy-${selectedRow.id}` ? "Working..." : selectedRow.public_url ? "Copy tracking link" : "Create link"}
                              </Button>
                              <Button size="small" variant="outlined" startIcon={<MailOutlineOutlinedIcon />} onClick={() => handleSend(selectedRow)} disabled={Boolean(busyKey)}>
                                {busyKey === `send-${selectedRow.id}` ? "Sending..." : "Send to client"}
                              </Button>
                              {selectedRow.public_url ? (
                                <Button size="small" variant="outlined" startIcon={<OpenInNewOutlinedIcon />} component="a" href={selectedRow.public_url} target="_blank" rel="noreferrer">
                                  Open tracking page
                                </Button>
                              ) : null}
                              {selectedRow.public_url ? (
                                <Button size="small" color="warning" variant="text" startIcon={<LinkOffOutlinedIcon />} onClick={() => handleRevoke(selectedRow)} disabled={Boolean(busyKey)}>
                                  {busyKey === `revoke-${selectedRow.id}` ? "Revoking..." : "Revoke link"}
                                </Button>
                              ) : null}
                            </Stack>
                          </Stack>
                        ) : null}
                      </Paper>
                    </Grid>

                    <Grid item xs={12} xl={7}>
                      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, height: "100%", overflow: "hidden" }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <RoomOutlinedIcon fontSize="small" />
                          <Typography fontWeight={800}>Live trip map</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Nearby employees cluster automatically so the map stays readable when many trips are active.
                          </Typography>
                        </Stack>
                        {mapPoints.length ? (
                          <Box sx={{ height: 360, borderRadius: 2, overflow: "hidden" }}>
                            <MapContainer center={[43.6532, -79.3832]} zoom={5} style={{ height: "100%", width: "100%" }}>
                              <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                              />
                              <FitMapToPoints items={mapPoints} />
                              <FitRouteBounds route={selectedRoute} />
                              <FocusSelectedTrip row={selectedRow} />
                              <MapBoundsWatcher onChange={setMapState} />
                              <DispatchMapMarkers
                                clusters={clusters}
                                clusterIndex={clusterIndex}
                                selectedDispatchId={selectedDispatchId}
                                onSelect={setSelectedDispatchId}
                              />
                              {selectedRoute?.status === "available" && Array.isArray(selectedRoute.polyline) && selectedRoute.polyline.length >= 2 ? (
                                <>
                                  <Polyline positions={selectedRoute.polyline} pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.75, dashArray: "8 8" }} />
                                  {Number.isFinite(selectedRoute.destination?.lat) && Number.isFinite(selectedRoute.destination?.lng) ? (
                                    <CircleMarker
                                      center={[selectedRoute.destination.lat, selectedRoute.destination.lng]}
                                      radius={9}
                                      pathOptions={{ color: "#fff", weight: 2, fillColor: "#dc2626", fillOpacity: 0.88 }}
                                    >
                                      <Popup>
                                        <Stack spacing={0.5}>
                                          <Typography fontWeight={700}>Destination</Typography>
                                          <Typography variant="body2">{selectedRoute.destination?.label || "Work order destination"}</Typography>
                                          {selectedRoute.destination?.map_url ? (
                                            <Typography
                                              component="a"
                                              href={selectedRoute.destination.map_url}
                                              target="_blank"
                                              rel="noreferrer"
                                              variant="caption"
                                              sx={{ color: "primary.main", textDecoration: "none", fontWeight: 700 }}
                                            >
                                              Open map
                                            </Typography>
                                          ) : null}
                                        </Stack>
                                      </Popup>
                                    </CircleMarker>
                                  ) : null}
                                </>
                              ) : null}
                            </MapContainer>
                          </Box>
                        ) : (
                          <Alert severity="info">No live locations yet. The map will populate after employees tap On my way and the app sends a location ping.</Alert>
                        )}
                      </Paper>
                    </Grid>
                    <Grid item xs={12}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <HistoryOutlinedIcon fontSize="small" />
                          <Typography fontWeight={800}>Activity feed</Typography>
                        </Stack>
                        {selectedRow ? (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                            Showing useful trip events for {selectedRow.recruiter_name || "the selected employee"}.
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                            Select a trip to focus the event feed.
                          </Typography>
                        )}
                        {activityLoading ? (
                          <Stack alignItems="center" sx={{ py: 3 }}><CircularProgress size={24} /></Stack>
                        ) : activity.length ? (
                          <Stack spacing={1.25}>
                            {activity.map((row) => (
                              <Stack key={row.id} spacing={0.25} sx={{ pb: 1.25, borderBottom: "1px solid", borderColor: "divider" }}>
                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                  <Typography variant="body2" fontWeight={700}>{row.event_label}</Typography>
                                  <Chip size="small" variant="outlined" label={String(row.event_type || "event").replaceAll("_", " ")} sx={eventChipSx(row.event_type)} />
                                </Stack>
                                <Typography variant="caption" color="text.secondary">
                                  {[row.recruiter_name, row.work_order_number, row.client_name].filter(Boolean).join(" • ")}
                                </Typography>
                                {activityMetaSummary(row) ? (
                                  <Typography variant="caption" color="text.secondary">
                                    {activityMetaSummary(row)}
                                  </Typography>
                                ) : null}
                                {formatApproxLocation(row.location_snapshot) ? (
                                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                                    <Typography variant="caption" color="text.secondary">
                                      Approx. location: {formatApproxLocation(row.location_snapshot)}
                                    </Typography>
                                    {row.location_snapshot?.map_url ? (
                                      <Typography
                                        component="a"
                                        href={row.location_snapshot.map_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        variant="caption"
                                        sx={{ color: "primary.main", textDecoration: "none", fontWeight: 700 }}
                                      >
                                        Open map
                                      </Typography>
                                    ) : null}
                                  </Stack>
                                ) : null}
                                <Typography variant="caption" color="text.secondary">
                                  {formatDateTime(row.created_at, timezone)}
                                </Typography>
                              </Stack>
                            ))}
                          </Stack>
                        ) : (
                          <Alert severity="info">No dispatch activity has been recorded yet for the current selection.</Alert>
                        )}
                      </Paper>
                    </Grid>
                  </Grid>
                </Stack>
              </Grid>
            </Grid>
          </>
        )}
      </Stack>
    </ManagementFrame>
  );
}
