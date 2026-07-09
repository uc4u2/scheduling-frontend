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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listDispatchItems();
      setItems(Array.isArray(res?.items) ? res.items : []);
      setSummary(res?.summary || null);
      setSettings(res?.settings || null);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to load dispatch trips.");
    } finally {
      setLoading(false);
    }
  }, []);

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
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FinanceMetricCard label="On the way" value={String(summary?.on_my_way || 0)} helper="Employees currently traveling to a client job." accent="primary" />
              </Grid>
              <Grid item xs={12} md={4}>
                <FinanceMetricCard label="Arrived" value={String(summary?.arrived || 0)} helper="Trips marked as arrived." accent="success" />
              </Grid>
              <Grid item xs={12} md={4}>
                <FinanceMetricCard label="Tracking links sent" value={String(summary?.tracking_links_sent || 0)} helper="Client emails sent from active dispatch trips." accent="info" />
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
                        </Stack>
                      </Stack>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Button size="small" variant="outlined" onClick={() => navigate(`/manager/business-finance?work_order_id=${row.work_order_id}`)}>
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
