import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { DateTime } from "luxon";
import { timeTracking } from "../../utils/api";
import { getUserTimezone } from "../../utils/timezone";

const formatDateTime = (value, timezone) => {
  if (!value) return "—";
  try {
    return DateTime.fromISO(value, { zone: "utc" }).setZone(timezone || "UTC").toFormat("LLL d, yyyy HH:mm");
  } catch {
    return value;
  }
};

const mapLink = (loc) => {
  if (!loc?.has_location) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${loc.lat},${loc.lng}`)}`;
};

const LocationCell = ({ location }) => {
  if (!location?.has_location && !location?.permission_state) {
    return <Typography color="text.secondary">No evidence</Typography>;
  }
  const href = mapLink(location);
  return (
    <Stack spacing={0.5}>
      <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
        <Chip
          size="small"
          label={location.permission_state || "unknown"}
          color={location.has_location ? "success" : location.permission_state === "denied" ? "warning" : "default"}
        />
        {location.has_location && href && (
          <Link href={href} target="_blank" rel="noreferrer" underline="hover">
            Open map
          </Link>
        )}
      </Stack>
      {location.has_location && (
        <Typography variant="body2">
          {Number(location.lat).toFixed(6)}, {Number(location.lng).toFixed(6)}
        </Typography>
      )}
      {location.accuracy_m != null && (
        <Typography variant="caption" color="text.secondary">
          Accuracy: {Math.round(Number(location.accuracy_m))}m
        </Typography>
      )}
    </Stack>
  );
};

const PunchLocationsPanel = () => {
  const viewerTimezone = getUserTimezone();
  const today = useMemo(() => DateTime.local().toISODate(), []);
  const [filters, setFilters] = useState({ start_date: today, end_date: today });
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await timeTracking.listPunchLocations(filters);
      setItems(Array.isArray(data?.items) ? data.items : []);
      setSummary(data?.summary || null);
      setPolicy(data?.policy || null);
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to load punch locations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = (key) => (event) => {
    setFilters((prev) => ({ ...prev, [key]: event.target.value }));
  };

  return (
    <Stack spacing={2.5}>
      <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: (theme) => `1px solid ${theme.palette.divider}` }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6" fontWeight={800}>
              Punch Locations
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Advisory GPS evidence captured only when employees tap Clock In or Clock Out. This is review-only and never blocks a punch.
            </Typography>
          </Box>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField type="date" fullWidth label="From" value={filters.start_date} onChange={handleFilter("start_date")} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField type="date" fullWidth label="To" value={filters.end_date} onChange={handleFilter("end_date")} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button variant="contained" onClick={load} disabled={loading}>
                Refresh
              </Button>
            </Grid>
          </Grid>
        </Stack>
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={2}>
        {[
          ["Mode", policy?.punch_location_mode || "off"],
          ["Punches with evidence", summary?.with_location ?? 0],
          ["Missing location", summary?.missing_location ?? 0],
          ["Permission denied", summary?.permission_denied ?? 0],
        ].map(([label, value]) => (
          <Grid item xs={12} sm={6} md={3} key={label}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: (theme) => `1px solid ${theme.palette.divider}` }}>
              <Typography variant="body2" color="text.secondary">
                {label}
              </Typography>
              <Typography variant="h6" fontWeight={800}>
                {value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={0} sx={{ borderRadius: 3, overflow: "hidden", border: (theme) => `1px solid ${theme.palette.divider}` }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={5}>
            <CircularProgress size={26} />
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Clock In</TableCell>
                <TableCell>Clock In Location</TableCell>
                <TableCell>Clock Out</TableCell>
                <TableCell>Clock Out Location</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.shift_id} hover>
                  <TableCell>
                    <Stack spacing={0.25}>
                      <Typography fontWeight={700}>{item.employee?.name || item.employee?.email || item.employee?.id}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.employee?.email}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>{formatDateTime(item.clock_in, item.timezone || viewerTimezone)}</TableCell>
                  <TableCell><LocationCell location={item.clock_in_location} /></TableCell>
                  <TableCell>{formatDateTime(item.clock_out, item.timezone || viewerTimezone)}</TableCell>
                  <TableCell><LocationCell location={item.clock_out_location} /></TableCell>
                </TableRow>
              ))}
              {!items.length && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography color="text.secondary" align="center" py={3}>
                      No punch location evidence found for this range.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Stack>
  );
};

export default PunchLocationsPanel;
