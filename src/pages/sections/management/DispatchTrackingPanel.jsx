import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
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
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import Supercluster from "supercluster";
import "leaflet/dist/leaflet.css";
import ManagementFrame from "../../../components/ui/ManagementFrame";
import FinanceMetricCard from "../../finance/components/FinanceMetricCard";
import {
  createWorkOrderDispatchLink,
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

function FitMapToPoints({ items }) {
  const map = useMap();
  useEffect(() => {
    if (!items.length) return;
    const bounds = L.latLngBounds(items.map((item) => [item.location.lat, item.location.lng]));
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 12 });
  }, [items, map]);
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

export default function DispatchTrackingPanel() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const timezone = getUserTimezone();
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [settings, setSettings] = useState(null);
  const [filtersApplied, setFiltersApplied] = useState(null);
  const [activity, setActivity] = useState([]);
  const [selectedDispatchId, setSelectedDispatchId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState("");
  const [mapState, setMapState] = useState({ zoom: 5, bounds: null });
  const [filters, setFilters] = useState({
    date: "today",
    status: "active",
    search: "",
    date_from: "",
    date_to: "",
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
      };
      const res = await listDispatchItems(params);
      const nextItems = Array.isArray(res?.items) ? res.items : [];
      setItems(nextItems);
      setSummary(res?.summary || null);
      setSettings(res?.settings || null);
      setFiltersApplied(res?.filters_applied || null);
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

  const loadActivity = useCallback(async () => {
    setActivityLoading(true);
    try {
      const res = await listDispatchActivity({
        dispatch_state_id: selectedDispatchId || undefined,
        search: filters.search || undefined,
        limit: 25,
      });
      setActivity(Array.isArray(res?.items) ? res.items : []);
    } catch (_err) {
      setActivity([]);
    } finally {
      setActivityLoading(false);
    }
  }, [filters.search, selectedDispatchId]);

  useEffect(() => {
    if (!selectedDispatchId && !filters.search) {
      setActivity([]);
      return;
    }
    loadActivity();
  }, [loadActivity, selectedDispatchId, filters.search]);

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

  const selectedRow = useMemo(
    () => items.find((row) => row.id === selectedDispatchId) || null,
    [items, selectedDispatchId]
  );

  const mapPoints = useMemo(
    () => items.filter((row) => Number.isFinite(row?.location?.lat) && Number.isFinite(row?.location?.lng)),
    [items]
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

  const clusters = useMemo(() => {
    if (!geoPoints.length) return [];
    const clusterIndex = new Supercluster({ radius: 60, maxZoom: 16 });
    clusterIndex.load(geoPoints);
    const bbox = mapState.bounds || [-140, 20, -40, 70];
    const zoom = Number.isFinite(mapState.zoom) ? Math.round(mapState.zoom) : 5;
    return clusterIndex.getClusters(bbox, zoom);
  }, [geoPoints, mapState.bounds, mapState.zoom]);

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
                    <Chip label="Today" color={filters.date === "today" ? "primary" : "default"} variant={filters.date === "today" ? "filled" : "outlined"} onClick={() => updateFilter("date", "today")} />
                    <Chip label="Tomorrow" color={filters.date === "tomorrow" ? "primary" : "default"} variant={filters.date === "tomorrow" ? "filled" : "outlined"} onClick={() => updateFilter("date", "tomorrow")} />
                    <Chip label="Custom" color={filters.date === "custom" ? "primary" : "default"} variant={filters.date === "custom" ? "filled" : "outlined"} onClick={() => updateFilter("date", "custom")} />
                    <Chip label="All dates" color={filters.date === "all" ? "primary" : "default"} variant={filters.date === "all" ? "filled" : "outlined"} onClick={() => updateFilter("date", "all")} />
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
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                    <Chip label="Active" color={filters.status === "active" ? "primary" : "default"} variant={filters.status === "active" ? "filled" : "outlined"} onClick={() => updateFilter("status", "active")} />
                    <Chip label="On my way" color={filters.status === "on_my_way" ? "primary" : "default"} variant={filters.status === "on_my_way" ? "filled" : "outlined"} onClick={() => updateFilter("status", "on_my_way")} />
                    <Chip label="Arrived" color={filters.status === "arrived" ? "primary" : "default"} variant={filters.status === "arrived" ? "filled" : "outlined"} onClick={() => updateFilter("status", "arrived")} />
                    <Chip label="All statuses" color={filters.status === "all" ? "primary" : "default"} variant={filters.status === "all" ? "filled" : "outlined"} onClick={() => updateFilter("status", "all")} />
                  </Stack>
                </Stack>
                {filters.date === "custom" ? (
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
                    <TextField size="small" label="From" type="date" value={filters.date_from} onChange={(event) => updateFilter("date_from", event.target.value)} InputLabelProps={{ shrink: true }} />
                    <TextField size="small" label="To" type="date" value={filters.date_to} onChange={(event) => updateFilter("date_to", event.target.value)} InputLabelProps={{ shrink: true }} />
                  </Stack>
                ) : null}
                {filtersApplied ? (
                  <Typography variant="caption" color="text.secondary">
                    Showing {summary?.matching_trips || 0} trip{Number(summary?.matching_trips || 0) === 1 ? "" : "s"} for {filtersApplied.date === "today" ? "today" : filtersApplied.date === "tomorrow" ? "tomorrow" : filtersApplied.date === "custom" ? "the selected dates" : "all dates"}.
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

            <Grid container spacing={2} alignItems="stretch">
              <Grid item xs={12} lg={5}>
                <Stack spacing={1.5}>
                  {items.length ? items.map((row) => (
                    <Paper
                      key={row.id}
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        borderColor: row.id === selectedDispatchId ? "primary.main" : "divider",
                        cursor: "pointer",
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
                          </Stack>
                        </Stack>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          <Button size="small" variant="outlined" onClick={(event) => { event.stopPropagation(); navigate("/manager/dashboard?view=finance-work-orders"); }}>
                            Open work order
                          </Button>
                          {row.client_id ? (
                            <Button size="small" variant="outlined" onClick={(event) => { event.stopPropagation(); navigate(`/manager/clients/${row.client_id}`); }}>
                              Open client
                            </Button>
                          ) : null}
                          {row.map_url ? (
                            <Button size="small" variant="outlined" component="a" href={row.map_url} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
                              Open map
                            </Button>
                          ) : null}
                          <Button size="small" variant="outlined" startIcon={<ContentCopyOutlinedIcon />} onClick={(event) => { event.stopPropagation(); handleCreateOrCopyLink(row); }} disabled={Boolean(busyKey)}>
                            {busyKey === `copy-${row.id}` ? "Working..." : row.public_url ? "Copy tracking link" : "Create tracking link"}
                          </Button>
                          <Button size="small" variant="outlined" startIcon={<MailOutlineOutlinedIcon />} onClick={(event) => { event.stopPropagation(); handleSend(row); }} disabled={Boolean(busyKey)}>
                            {busyKey === `send-${row.id}` ? "Sending..." : "Send to client"}
                          </Button>
                          {row.public_url ? (
                            <Button size="small" variant="outlined" startIcon={<OpenInNewOutlinedIcon />} component="a" href={row.public_url} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
                              Open tracking page
                            </Button>
                          ) : null}
                          {row.public_url ? (
                            <Button size="small" color="warning" variant="text" startIcon={<LinkOffOutlinedIcon />} onClick={(event) => { event.stopPropagation(); handleRevoke(row); }} disabled={Boolean(busyKey)}>
                              {busyKey === `revoke-${row.id}` ? "Revoking..." : "Revoke link"}
                            </Button>
                          ) : null}
                        </Stack>
                      </Stack>
                    </Paper>
                  )) : (
                    <Alert severity="info">No active On my way or Arrived trips yet.</Alert>
                  )}
                </Stack>
              </Grid>

              <Grid item xs={12} lg={7}>
                <Stack spacing={2}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, height: 420, overflow: "hidden" }}>
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
                          <MapBoundsWatcher onChange={setMapState} />
                          {clusters.map((cluster) => {
                            const [lng, lat] = cluster.geometry.coordinates;
                            const { cluster: isCluster, point_count: pointCount } = cluster.properties || {};
                            if (isCluster) {
                              return (
                                <Marker key={`cluster-${cluster.id}`} position={[lat, lng]} icon={clusterIcon(pointCount)}>
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
                                pathOptions={{ color: "#fff", weight: 2, fillColor: statusMarkerColor(row), fillOpacity: 0.92 }}
                                eventHandlers={{ click: () => setSelectedDispatchId(row.id) }}
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
                          })}
                        </MapContainer>
                      </Box>
                    ) : (
                      <Alert severity="info">No live locations yet. The map will populate after employees tap On my way and the app sends a location ping.</Alert>
                    )}
                  </Paper>

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
                            <Typography variant="body2" fontWeight={700}>{row.event_label}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {[row.recruiter_name, row.work_order_number, row.client_name].filter(Boolean).join(" • ")}
                            </Typography>
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
                </Stack>
              </Grid>
            </Grid>
          </>
        )}
      </Stack>
    </ManagementFrame>
  );
}
