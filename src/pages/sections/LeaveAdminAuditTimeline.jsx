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
import { leaveSettings } from "../../utils/api";
import { formatDateTimeInTz } from "../../utils/datetime";
import { getUserTimezone } from "../../utils/timezone";

const ACTION_LABELS = {
  settings_updated: "Settings updated",
  balance_policy_updated: "Balance policy updated",
  entitlement_policy_updated: "Entitlement policy updated",
  leave_balance_adjusted: "Balance adjusted",
  leave_request_reviewed: "Leave reviewed",
  leave_request_status_changed: "Status changed",
  accrual_posted: "Accrual posted",
  carryover_applied: "Carryover applied",
  entitlements_applied: "Entitlements applied",
};

const ENTITY_LABELS = {
  leave_settings: "Leave settings",
  balance_policy: "Balance policy",
  entitlement_policy: "Entitlement policy",
  leave_request: "Leave request",
  leave_balance_adjustment: "Balance adjustment",
  accrual_run: "Accrual run",
  carryover_run: "Carryover run",
  entitlement_apply_run: "Entitlement apply",
};

const toneForAction = (action) => {
  if (["settings_updated", "balance_policy_updated", "entitlement_policy_updated", "leave_balance_adjusted", "leave_request_reviewed", "leave_request_status_changed"].includes(action)) return "primary";
  if (["accrual_posted", "carryover_applied", "entitlements_applied"].includes(action)) return "success";
  return "default";
};

const chipSx = (tone) => {
  const tones = {
    primary: { bgcolor: "#dbeafe", color: "#1e3a8a", borderColor: "#93c5fd" },
    success: { bgcolor: "#dcfce7", color: "#166534", borderColor: "#86efac" },
    warning: { bgcolor: "#fef3c7", color: "#92400e", borderColor: "#fbbf24" },
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

function LeaveAdminAuditTimelineContent({ title, emptyText, loading, error, items }) {
  const timezone = React.useMemo(() => getUserTimezone(), []);
  const [expandedIds, setExpandedIds] = React.useState({});

  const toggleExpanded = (id) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
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

      {!loading && !error && !items.length ? (
        <Typography variant="body2" color="text.secondary">{emptyText}</Typography>
      ) : null}

      {!loading && !error && items.length ? (
        <Stack spacing={1.25}>
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
                        <Chip size="small" variant="outlined" label={ENTITY_LABELS[entry.entity_type] || entry.entity_type || "Leave"} />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {entry.created_at ? formatDateTimeInTz(entry.created_at, timezone) : "—"}
                      </Typography>
                      {entry.message ? <Typography variant="body2" color="text.secondary">{entry.message}</Typography> : null}
                      {entry.leave_type ? (
                        <Typography variant="caption" color="text.secondary">
                          Leave type: {String(entry.leave_type).replace(/_/g, " ")}
                          {entry.employee_id ? ` · Employee #${entry.employee_id}` : ""}
                        </Typography>
                      ) : entry.employee_id ? (
                        <Typography variant="caption" color="text.secondary">Employee #{entry.employee_id}</Typography>
                      ) : null}
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
                              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                {prettifyField(field)}
                              </Typography>
                              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: 0.35 }}>
                                <Typography variant="body2"><strong>Before:</strong> {formatValue(delta?.before)}</Typography>
                                <Typography variant="body2"><strong>After:</strong> {formatValue(delta?.after)}</Typography>
                              </Stack>
                            </Paper>
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">No field-level changes captured.</Typography>
                      )}

                      {entry.metadata && Object.keys(entry.metadata).length ? (
                        <Paper variant="outlined" sx={{ p: 1.1, borderRadius: 1.5 }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={700}>Run / event summary</Typography>
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
        </Stack>
      ) : null}
    </Stack>
  );
}

export default function LeaveAdminAuditTimeline({
  open,
  onClose,
  title = "Leave admin activity",
  emptyText = "No activity recorded yet.",
  entityTypes = [],
  entityId,
  employeeId,
  leaveType,
  action,
}) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [items, setItems] = React.useState([]);

  React.useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setError("");
    leaveSettings
      .getAdminAuditLogs({
        entity_type: entityTypes.join(","),
        entity_id: entityId || undefined,
        employee_id: employeeId || undefined,
        leave_type: leaveType || undefined,
        action: action || undefined,
        include_snapshots: true,
        limit: 50,
      })
      .then((payload) => {
        if (!active) return;
        setItems(Array.isArray(payload?.logs) ? payload.logs : []);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.response?.data?.error || err?.message || "Unable to load leave admin activity.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, entityId, employeeId, leaveType, action, entityTypes]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 2,
        "& .MuiDrawer-paper": {
          zIndex: (theme) => theme.zIndex.modal + 2,
        },
      }}
      PaperProps={{
        sx: {
          width: { xs: "100%", md: 540 },
          p: 2,
        },
      }}
    >
      <LeaveAdminAuditTimelineContent
        title={title}
        emptyText={emptyText}
        loading={loading}
        error={error}
        items={items}
      />
    </Drawer>
  );
}
