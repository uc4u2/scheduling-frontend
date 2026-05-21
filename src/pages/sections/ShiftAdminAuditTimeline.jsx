import React from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  Drawer,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import ExpandLessOutlinedIcon from "@mui/icons-material/ExpandLessOutlined";
import { shiftAdmin } from "../../utils/api";
import {
  formatDateTimeInTz,
  formatLocalDateAndTimeInTz,
} from "../../utils/datetime";
import { formatTimezoneLabel, getUserTimezone } from "../../utils/timezone";

const ACTION_LABELS = {
  shift_created: "Shift created",
  shift_updated: "Shift updated",
  shift_deleted: "Shift deleted",
  shift_bulk_assigned: "Bulk assigned",
  shift_bulk_deleted: "Bulk deleted",
  shift_converted_to_time_off: "Converted to time off",
  time_entry_approved: "Time entry approved",
  time_entry_rejected: "Time entry rejected",
  time_entry_corrected: "Punch corrected",
  time_entry_force_clock_out: "Force clock-out",
  time_entry_deleted: "Time entry deleted",
  swap_requested: "Swap requested",
  swap_peer_accepted: "Peer accepted",
  swap_denied: "Swap denied",
  swap_manager_approved: "Manager approved",
  swap_executed: "Swap executed",
  swap_deleted: "Swap deleted",
  availability_created: "Availability created",
  availability_updated: "Availability updated",
  availability_deleted: "Availability deleted",
  availability_range_closed: "Availability range closed",
  smart_shift_suggested: "Smart Shift suggested",
  smart_shift_applied: "Smart Shift applied",
  smart_shift_run_deleted: "Smart Shift run deleted",
  smart_shift_rule_updated: "Rule updated",
  smart_shift_exception_updated: "Exception updated",
  smart_shift_preference_updated: "Preference updated",
};

const ENTITY_LABELS = {
  shift: "Shift",
  time_entry: "Time entry",
  shift_swap: "Shift swap",
  availability: "Availability",
  smart_shift_rule: "Smart Shift rule",
  smart_shift_exception: "Smart Shift exception",
  smart_shift_preference: "Smart Shift preference",
  smart_shift_run: "Smart Shift run",
  shift_template: "Shift template",
};

const toneForAction = (action) => {
  if (["shift_deleted", "shift_bulk_deleted", "time_entry_rejected", "swap_denied"].includes(action)) return "warning";
  if (["time_entry_approved", "swap_manager_approved", "swap_executed", "smart_shift_applied"].includes(action)) return "success";
  if (["time_entry_corrected", "availability_range_closed", "smart_shift_suggested"].includes(action)) return "info";
  return "primary";
};

const chipSx = (tone) => {
  const tones = {
    primary: { bgcolor: "#dbeafe", color: "#1e3a8a", borderColor: "#93c5fd" },
    success: { bgcolor: "#dcfce7", color: "#166534", borderColor: "#86efac" },
    warning: { bgcolor: "#fef3c7", color: "#92400e", borderColor: "#fbbf24" },
    info: { bgcolor: "#e0f2fe", color: "#0c4a6e", borderColor: "#7dd3fc" },
    default: { bgcolor: "#f8fafc", color: "#334155", borderColor: "#cbd5e1" },
  };
  return {
    ...(tones[tone] || tones.default),
    border: "1px solid",
    fontWeight: 800,
    "& .MuiChip-label": { color: "inherit" },
  };
};

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(2);
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? "" : "s"}`;
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
};

const prettifyField = (field) =>
  String(field || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatEmployeeLabel = (entry) =>
  entry?.employee_name || (entry?.employee_id ? `Employee #${entry.employee_id}` : "Shift activity");

const SHIFT_LOCAL_DATETIME_FIELDS = new Set(["clock_in", "clock_out", "break_start", "break_end"]);
const SHIFT_LOCAL_TIME_FIELDS = new Set(["start_time", "end_time"]);

const formatShiftFieldValue = (field, value, snapshot, entryTimezone, viewerTimezone) => {
  if (value === null || value === undefined || value === "") return "—";
  if (field === "timezone") return formatTimezoneLabel(value) || String(value);
  if (SHIFT_LOCAL_DATETIME_FIELDS.has(field) && typeof value === "string") {
    return formatDateTimeInTz(value, entryTimezone || viewerTimezone);
  }
  if (SHIFT_LOCAL_TIME_FIELDS.has(field) && typeof value === "string") {
    const dateValue = snapshot?.date;
    if (dateValue) {
      return formatLocalDateAndTimeInTz(dateValue, value, entryTimezone || viewerTimezone);
    }
  }
  return formatValue(value);
};

export default function ShiftAdminAuditTimeline({
  open,
  onClose,
  title = "Shift admin activity",
  emptyText = "No activity recorded yet.",
  entityTypes = [],
  entityId,
  employeeId,
  action,
  dateFrom,
  dateTo,
}) {
  const PAGE_SIZE = 25;
  const timezone = React.useMemo(() => getUserTimezone(), []);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState("");
  const [items, setItems] = React.useState([]);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(false);
  const [expandedIds, setExpandedIds] = React.useState({});

  React.useEffect(() => {
    if (!open) return;
    let active = true;
    const initialPage = 1;
    setLoading(true);
    setLoadingMore(false);
    setError("");
    setItems([]);
    setPage(initialPage);
    setTotal(0);
    setHasMore(false);
    const params = { include_snapshots: true, limit: PAGE_SIZE, page: initialPage };
    if (entityTypes?.length) params.entity_type = entityTypes;
    if (entityId) params.entity_id = entityId;
    if (employeeId) params.employee_id = employeeId;
    if (action) params.action = action;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;

    shiftAdmin
      .getAuditLogs(params)
      .then((data) => {
        if (!active) return;
        const nextItems = Array.isArray(data?.logs) ? data.logs : [];
        const nextTotal = Number(data?.total || 0);
        setItems(nextItems);
        setTotal(nextTotal);
        setHasMore(initialPage * PAGE_SIZE < nextTotal);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.response?.data?.error || "Failed to load activity.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, entityTypes, entityId, employeeId, action, dateFrom, dateTo]);

  const toggleExpanded = React.useCallback((id) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleLoadMore = React.useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    const nextPage = page + 1;
    const params = { include_snapshots: true, limit: PAGE_SIZE, page: nextPage };
    if (entityTypes?.length) params.entity_type = entityTypes;
    if (entityId) params.entity_id = entityId;
    if (employeeId) params.employee_id = employeeId;
    if (action) params.action = action;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    setLoadingMore(true);
    setError("");
    shiftAdmin
      .getAuditLogs(params)
      .then((data) => {
        const nextItems = Array.isArray(data?.logs) ? data.logs : [];
        const nextTotal = Number(data?.total || total || 0);
        setItems((prev) => [...prev, ...nextItems]);
        setPage(nextPage);
        setTotal(nextTotal);
        setHasMore(nextPage * PAGE_SIZE < nextTotal);
      })
      .catch((err) => {
        setError(err?.response?.data?.error || "Failed to load more activity.");
      })
      .finally(() => {
        setLoadingMore(false);
      });
  }, [action, dateFrom, dateTo, employeeId, entityId, entityTypes, hasMore, loading, loadingMore, page, total]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 2,
        "& .MuiDrawer-paper": {
          width: { xs: "100%", sm: 560 },
          p: 2,
          zIndex: (theme) => theme.zIndex.modal + 2,
        },
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} alignItems="center">
          <HistoryOutlinedIcon fontSize="small" color="action" />
          <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
        </Stack>

        {loading ? (
          <Stack alignItems="center" sx={{ py: 3 }}>
            <CircularProgress size={24} />
          </Stack>
        ) : null}

        {!loading && error ? <Alert severity="error">{error}</Alert> : null}
        {!loading && !error && !items.length ? <Typography variant="body2" color="text.secondary">{emptyText}</Typography> : null}

        {!loading && !error && items.length ? (
          <Stack spacing={1.25}>
            {!!total ? (
              <Typography variant="caption" color="text.secondary">
                Showing {items.length} of {total}
              </Typography>
            ) : null}
            {items.map((entry, index) => {
              const expanded = Boolean(expandedIds[entry.id]);
              const diffs = entry?.diff && typeof entry.diff === "object" ? Object.entries(entry.diff) : [];
              return (
                <Box key={entry.id}>
                  <Stack spacing={1}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ sm: "flex-start" }}>
                      <Stack spacing={0.5}>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                          <Typography variant="body2" fontWeight={700}>{entry.actor_name || entry.actor_email || "System"}</Typography>
                          <Chip size="small" label={ACTION_LABELS[entry.action] || entry.action || "Updated"} sx={chipSx(toneForAction(entry.action))} />
                          <Chip size="small" variant="outlined" label={ENTITY_LABELS[entry.entity_type] || entry.entity_type || "Shift"} />
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {entry.created_at ? formatDateTimeInTz(entry.created_at, timezone) : "—"}
                        </Typography>
                        {entry.message ? <Typography variant="body2" color="text.secondary">{entry.message}</Typography> : null}
                        <Typography variant="caption" color="text.secondary">
                          {formatEmployeeLabel(entry)}
                          {entry.timezone ? ` · ${formatTimezoneLabel(entry.timezone) || entry.timezone}` : ""}
                        </Typography>
                      </Stack>
                      <Button size="small" variant="text" endIcon={expanded ? <ExpandLessOutlinedIcon /> : <ExpandMoreOutlinedIcon />} onClick={() => toggleExpanded(entry.id)}>
                        View changes
                      </Button>
                    </Stack>

                    <Collapse in={expanded} timeout="auto" unmountOnExit>
                      <Stack spacing={1.25} sx={{ pt: 0.5 }}>
                        {diffs.length ? (
                          <Stack spacing={0.75}>
                            {diffs.map(([field, delta]) => (
                              <Paper key={field} variant="outlined" sx={{ p: 1.1, borderRadius: 1.5 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={700}>{prettifyField(field)}</Typography>
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: 0.35 }}>
                                  <Typography variant="body2">
                                    <strong>Before:</strong>{" "}
                                    {formatShiftFieldValue(
                                      field,
                                      delta?.before,
                                      entry?.before,
                                      entry?.before?.timezone || entry?.timezone,
                                      timezone
                                    )}
                                  </Typography>
                                  <Typography variant="body2">
                                    <strong>After:</strong>{" "}
                                    {formatShiftFieldValue(
                                      field,
                                      delta?.after,
                                      entry?.after,
                                      entry?.after?.timezone || entry?.timezone,
                                      timezone
                                    )}
                                  </Typography>
                                </Stack>
                              </Paper>
                            ))}
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="text.secondary">No field-level changes captured.</Typography>
                        )}

                        {entry.metadata && Object.keys(entry.metadata).length ? (
                          <Paper variant="outlined" sx={{ p: 1.1, borderRadius: 1.5 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700}>Event summary</Typography>
                            <Box component="pre" sx={{ m: 0, mt: 0.75, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 12 }}>
                              {JSON.stringify(entry.metadata, null, 2)}
                            </Box>
                          </Paper>
                        ) : null}

                        <details>
                          <summary style={{ cursor: "pointer" }}>
                            <Typography component="span" variant="caption" color="text.secondary">Raw snapshots</Typography>
                          </summary>
                          <Stack spacing={1} sx={{ mt: 1 }}>
                            <Box>
                              <Typography variant="caption" color="text.secondary">Before</Typography>
                              <Box component="pre" sx={{ m: 0, mt: 0.5, p: 1, borderRadius: 1, bgcolor: "background.default", overflowX: "auto", fontSize: 12 }}>
                                {JSON.stringify(entry.before || {}, null, 2)}
                              </Box>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">After</Typography>
                              <Box component="pre" sx={{ m: 0, mt: 0.5, p: 1, borderRadius: 1, bgcolor: "background.default", overflowX: "auto", fontSize: 12 }}>
                                {JSON.stringify(entry.after || {}, null, 2)}
                              </Box>
                            </Box>
                          </Stack>
                        </details>
                      </Stack>
                    </Collapse>
                  </Stack>
                  {index < items.length - 1 ? <Divider sx={{ mt: 1.25 }} /> : null}
                </Box>
              );
            })}
            {hasMore ? (
              <Button
                size="small"
                variant="outlined"
                onClick={handleLoadMore}
                disabled={loadingMore}
                sx={{ alignSelf: "flex-start" }}
              >
                {loadingMore ? "Loading..." : "Load more"}
              </Button>
            ) : null}
          </Stack>
        ) : null}

        <Box>
          <Button onClick={onClose}>Close</Button>
        </Box>
      </Stack>
    </Drawer>
  );
}
