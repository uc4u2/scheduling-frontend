import React, { useCallback, useEffect, useState } from "react";
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
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import ManagementFrame from "../../../components/ui/ManagementFrame";
import FinanceMetricCard from "../../finance/components/FinanceMetricCard";
import {
  createWorkOrderDispatchLink,
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

const formatDateTime = (value, timezone) => (value ? formatDateTimeInTz(value, timezone, "LLL d, yyyy h:mm a") : "—");

export default function DispatchTrackingPanel() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const timezone = getUserTimezone();
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [settings, setSettings] = useState(null);
  const [filtersApplied, setFiltersApplied] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState("");
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
      setItems(Array.isArray(res?.items) ? res.items : []);
      setSummary(res?.summary || null);
      setSettings(res?.settings || null);
      setFiltersApplied(res?.filters_applied || null);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to load dispatch trips.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

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
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || "Unable to revoke tracking link.", { variant: "error" });
    } finally {
      setBusyKey("");
    }
  };

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <ManagementFrame
      title="Dispatch"
      subtitle="Monitor On my way trips without mixing them into punch-location audit screens."
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
                    <Chip
                      label="Today"
                      color={filters.date === "today" ? "primary" : "default"}
                      variant={filters.date === "today" ? "filled" : "outlined"}
                      onClick={() => updateFilter("date", "today")}
                    />
                    <Chip
                      label="Tomorrow"
                      color={filters.date === "tomorrow" ? "primary" : "default"}
                      variant={filters.date === "tomorrow" ? "filled" : "outlined"}
                      onClick={() => updateFilter("date", "tomorrow")}
                    />
                    <Chip
                      label="Custom"
                      color={filters.date === "custom" ? "primary" : "default"}
                      variant={filters.date === "custom" ? "filled" : "outlined"}
                      onClick={() => updateFilter("date", "custom")}
                    />
                    <Chip
                      label="All dates"
                      color={filters.date === "all" ? "primary" : "default"}
                      variant={filters.date === "all" ? "filled" : "outlined"}
                      onClick={() => updateFilter("date", "all")}
                    />
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
                    <Chip
                      label="Active"
                      color={filters.status === "active" ? "primary" : "default"}
                      variant={filters.status === "active" ? "filled" : "outlined"}
                      onClick={() => updateFilter("status", "active")}
                    />
                    <Chip
                      label="On my way"
                      color={filters.status === "on_my_way" ? "primary" : "default"}
                      variant={filters.status === "on_my_way" ? "filled" : "outlined"}
                      onClick={() => updateFilter("status", "on_my_way")}
                    />
                    <Chip
                      label="Arrived"
                      color={filters.status === "arrived" ? "primary" : "default"}
                      variant={filters.status === "arrived" ? "filled" : "outlined"}
                      onClick={() => updateFilter("status", "arrived")}
                    />
                    <Chip
                      label="All statuses"
                      color={filters.status === "all" ? "primary" : "default"}
                      variant={filters.status === "all" ? "filled" : "outlined"}
                      onClick={() => updateFilter("status", "all")}
                    />
                  </Stack>
                </Stack>
                {filters.date === "custom" ? (
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
                    <TextField
                      size="small"
                      label="From"
                      type="date"
                      value={filters.date_from}
                      onChange={(event) => updateFilter("date_from", event.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      size="small"
                      label="To"
                      type="date"
                      value={filters.date_to}
                      onChange={(event) => updateFilter("date_to", event.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
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
              <Grid item xs={12} md={4}>
                <FinanceMetricCard label="Matching trips" value={String(summary?.matching_trips || 0)} helper="Trips matching the current date, status, and search filters." accent="secondary" />
              </Grid>
              <Grid item xs={12} md={4}>
                <FinanceMetricCard label="On the way" value={String(summary?.on_my_way || 0)} helper="Employees currently traveling to a client job." accent="primary" />
              </Grid>
              <Grid item xs={12} md={4}>
                <FinanceMetricCard label="Arrived" value={String(summary?.arrived || 0)} helper="Trips marked as arrived." accent="success" />
              </Grid>
              <Grid item xs={12} md={6}>
                <FinanceMetricCard label="Tracking links sent" value={String(summary?.tracking_links_sent || 0)} helper="Client emails sent from the filtered dispatch trips." accent="info" />
              </Grid>
              <Grid item xs={12} md={6}>
                <FinanceMetricCard label="Stale trips" value={String(summary?.stale_trips || 0)} helper="On my way trips with no fresh location update in the last 10 minutes." accent="warning" />
              </Grid>
            </Grid>
            {items.length ? (
              <Stack spacing={1.5}>
                {items.map((row) => (
                  <Paper key={row.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Stack spacing={1.25}>
                      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.5}>
                        <Box>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 0.75 }}>
                            <Typography fontWeight={800}>{row.recruiter_name || "Assigned employee"}</Typography>
                            <Chip size="small" label={String(row.status || "").replaceAll("_", " ")} color={statusChipColor(row.status)} variant="outlined" />
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
                          ) : null}
                          {row.status === "on_my_way" && !row.location?.captured_at ? (
                            <Chip size="small" color="warning" variant="outlined" label="Waiting for location" />
                          ) : null}
                        </Stack>
                      </Stack>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Button size="small" variant="outlined" onClick={() => navigate("/manager/dashboard?view=finance-work-orders")}>
                          Open work order
                        </Button>
                        {row.client_id ? (
                          <Button size="small" variant="outlined" onClick={() => navigate(`/manager/clients/${row.client_id}`)}>
                            Open client
                          </Button>
                        ) : null}
                        {row.map_url ? (
                          <Button size="small" variant="outlined" component="a" href={row.map_url} target="_blank" rel="noreferrer">
                            Open map
                          </Button>
                        ) : null}
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ContentCopyOutlinedIcon />}
                          onClick={() => handleCreateOrCopyLink(row)}
                          disabled={Boolean(busyKey)}
                        >
                          {busyKey === `copy-${row.id}` ? "Working..." : row.public_url ? "Copy tracking link" : "Create tracking link"}
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<MailOutlineOutlinedIcon />}
                          onClick={() => handleSend(row)}
                          disabled={Boolean(busyKey)}
                        >
                          {busyKey === `send-${row.id}` ? "Sending..." : "Send to client"}
                        </Button>
                        {row.public_url ? (
                          <Button size="small" variant="outlined" startIcon={<OpenInNewOutlinedIcon />} component="a" href={row.public_url} target="_blank" rel="noreferrer">
                            Open tracking page
                          </Button>
                        ) : null}
                        {row.public_url ? (
                          <Button
                            size="small"
                            color="warning"
                            variant="text"
                            startIcon={<LinkOffOutlinedIcon />}
                            onClick={() => handleRevoke(row)}
                            disabled={Boolean(busyKey)}
                          >
                            {busyKey === `revoke-${row.id}` ? "Revoking..." : "Revoke link"}
                          </Button>
                        ) : null}
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Alert severity="info">No active On my way or Arrived trips yet.</Alert>
            )}
          </>
        )}
      </Stack>
    </ManagementFrame>
  );
}
