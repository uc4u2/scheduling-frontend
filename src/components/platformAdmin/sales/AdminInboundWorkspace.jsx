import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  getInboundCall,
  getInboundLiveReps,
  getInboundOverview,
  listInboundCalls,
} from "../../../api/platformAdminSales";
import InboundOverviewCards from "./InboundOverviewCards";
import InboundCallsTable from "./InboundCallsTable";
import InboundCallDetailDrawer from "./InboundCallDetailDrawer";
import InboundLiveRepPanel from "./InboundLiveRepPanel";

const emptyFilters = {
  date_from: "",
  date_to: "",
  department_key: "",
  rep_id: "",
  status: "",
  caller: "",
  has_recording: false,
  voicemail_only: false,
};

export default function AdminInboundWorkspace({ reps, onOpenLead, showBanner }) {
  const [overview, setOverview] = useState(null);
  const [calls, setCalls] = useState([]);
  const [liveRows, setLiveRows] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCallId, setSelectedCallId] = useState(null);
  const [selectedCall, setSelectedCall] = useState(null);

  const loadInbound = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewResp, callsResp, liveResp] = await Promise.all([
        getInboundOverview(),
        listInboundCalls({
          ...filters,
          date_from: filters.date_from || undefined,
          date_to: filters.date_to || undefined,
          department_key: filters.department_key || undefined,
          rep_id: filters.rep_id || undefined,
          status: filters.status || undefined,
          caller: filters.caller || undefined,
          has_recording: filters.has_recording || undefined,
          voicemail_only: filters.voicemail_only || undefined,
        }),
        getInboundLiveReps(),
      ]);
      setOverview(overviewResp);
      setCalls(callsResp?.calls || []);
      setLiveRows(liveResp?.rows || []);
      if (selectedCallId) {
        const detailResp = await getInboundCall(selectedCallId);
        setSelectedCall(detailResp?.call || null);
      }
    } catch (error) {
      showBanner?.("error", error?.response?.data?.error || "Failed to load inbound workspace.");
    } finally {
      setLoading(false);
    }
  }, [filters, selectedCallId, showBanner]);

  useEffect(() => {
    loadInbound();
  }, [loadInbound]);

  const openCall = useCallback(async (callId) => {
    setDrawerOpen(true);
    setSelectedCallId(callId);
    try {
      const detailResp = await getInboundCall(callId);
      setSelectedCall(detailResp?.call || null);
    } catch (error) {
      showBanner?.("error", error?.response?.data?.error || "Failed to load inbound call detail.");
    }
  }, [showBanner]);

  const statusOptions = useMemo(() => {
    const values = new Set((calls || []).map((row) => row.status).filter(Boolean));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [calls]);

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 2.5 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between">
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Inbound Operations</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Review inbound call traffic, rep availability, voicemail activity, and matched CRM context without affecting the outbound queue.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip size="small" variant="outlined" label={`Calls loaded: ${calls.length}`} />
            <Button variant="outlined" onClick={loadInbound}>Refresh</Button>
          </Stack>
        </Stack>
      </Paper>

      <InboundOverviewCards overview={overview} />

      <Paper sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Inbound Calls</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Filter inbound sessions by caller, department, rep, and recording/voicemail flags.
              </Typography>
            </Box>
          </Stack>

          <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5} useFlexGap sx={{ flexWrap: "wrap" }}>
            <TextField
              size="small"
              type="datetime-local"
              label="Date from"
              value={filters.date_from}
              onChange={(event) => setFilters((prev) => ({ ...prev, date_from: event.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              size="small"
              type="datetime-local"
              label="Date to"
              value={filters.date_to}
              onChange={(event) => setFilters((prev) => ({ ...prev, date_to: event.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              size="small"
              select
              label="Department"
              value={filters.department_key}
              onChange={(event) => setFilters((prev) => ({ ...prev, department_key: event.target.value }))}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="sales">Sales</MenuItem>
              <MenuItem value="support">Support</MenuItem>
              <MenuItem value="billing">Billing</MenuItem>
            </TextField>
            <TextField
              size="small"
              select
              label="Rep"
              value={filters.rep_id}
              onChange={(event) => setFilters((prev) => ({ ...prev, rep_id: event.target.value }))}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">All</MenuItem>
              {(reps || []).map((rep) => (
                <MenuItem key={rep.id} value={String(rep.id)}>{rep.full_name}</MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              select
              label="Status"
              value={filters.status}
              onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="">All</MenuItem>
              {statusOptions.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              label="Caller"
              value={filters.caller}
              onChange={(event) => setFilters((prev) => ({ ...prev, caller: event.target.value }))}
            />
            <TextField
              size="small"
              select
              label="Recording"
              value={filters.has_recording ? "yes" : ""}
              onChange={(event) => setFilters((prev) => ({ ...prev, has_recording: event.target.value === "yes" }))}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="yes">Has recording</MenuItem>
            </TextField>
            <TextField
              size="small"
              select
              label="Voicemail"
              value={filters.voicemail_only ? "yes" : ""}
              onChange={(event) => setFilters((prev) => ({ ...prev, voicemail_only: event.target.value === "yes" }))}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="yes">Voicemail only</MenuItem>
            </TextField>
          </Stack>

          <Alert severity="info" variant="outlined">
            Inbound and outbound remain separate workspaces. This table is read-only and uses the inbound session backend only.
          </Alert>

          <InboundCallsTable rows={calls} loading={loading} onOpen={openCall} />
        </Stack>
      </Paper>

      <InboundLiveRepPanel rows={liveRows} />

      <InboundCallDetailDrawer
        open={drawerOpen}
        call={selectedCall}
        onClose={() => setDrawerOpen(false)}
        onOpenLead={onOpenLead}
      />
    </Stack>
  );
}
