import React, { useEffect, useMemo, useState } from "react";
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
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { api } from "../../utils/api";

const ACTION_LABELS = {
  profile_updated: "Profile updated",
  payroll_fields_updated: "Payroll fields updated",
  sensitive_identity_updated: "Sensitive identity updated",
  public_profile_updated: "Public profile updated",
  permissions_updated: "Permissions updated",
};

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "Empty";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(2);
  return String(value);
};

const formatTimestamp = (value) => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString();
  } catch (err) {
    return value;
  }
};

export default function EmployeeProfileAuditTimeline({
  employeeId,
  open,
  onClose,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState([]);
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [showSnapshots, setShowSnapshots] = useState(false);

  useEffect(() => {
    if (!open || !employeeId) return;
    let ignore = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/manager/employees/${employeeId}/audit-logs`, {
          params: {
            include_snapshots: showSnapshots ? 1 : 0,
            limit: 50,
          },
        });
        if (!ignore) {
          setLogs(res.data?.logs || []);
        }
      } catch (err) {
        if (!ignore) {
          setError(err?.response?.data?.error || "Failed to load employee activity log.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [employeeId, open, showSnapshots]);

  const emptyState = useMemo(
    () => !loading && !error && Array.isArray(logs) && logs.length === 0,
    [loading, error, logs]
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", md: 520 },
          p: 2,
          backgroundColor: "#f8fbff",
        },
      }}
    >
      <Stack spacing={2} sx={{ height: "100%" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
          <Box>
            <Typography variant="h6" fontWeight={800}>
              Activity log
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Employee profile changes only. Sensitive values stay masked here.
            </Typography>
          </Box>
          <Button
            size="small"
            variant={showSnapshots ? "contained" : "outlined"}
            onClick={() => setShowSnapshots((prev) => !prev)}
          >
            {showSnapshots ? "Hide snapshots" : "Show snapshots"}
          </Button>
        </Stack>

        <Alert severity="info" variant="outlined">
          This audit trail shows who changed the employee profile, when it changed, and the before/after values for curated fields only.
        </Alert>

        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ flex: 1 }}>
            <CircularProgress size={28} />
          </Stack>
        ) : null}

        {error ? <Alert severity="error">{error}</Alert> : null}

        {emptyState ? (
          <Alert severity="info">No employee profile changes have been logged yet.</Alert>
        ) : null}

        {!loading && !error ? (
          <Stack spacing={1.25} sx={{ overflowY: "auto", pr: 0.5 }}>
            {logs.map((log, idx) => {
              const expanded = expandedLogId === log.id;
              const diffEntries = Object.entries(log.diff || {});
              return (
                <Paper
                  key={log.id || idx}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    borderColor: "rgba(59, 130, 246, 0.18)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 4,
                      bgcolor: "primary.main",
                    }}
                  />
                  <Stack spacing={1} sx={{ pl: 1 }}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                        <Chip
                          size="small"
                          color="primary"
                          variant="outlined"
                          label={ACTION_LABELS[log.action] || log.action || "Updated"}
                        />
                        <Typography variant="subtitle2" fontWeight={800}>
                          {log.actor_name || log.actor_email || "Unknown actor"}
                        </Typography>
                        {log.actor_email ? (
                          <Typography variant="caption" color="text.secondary">
                            {log.actor_email}
                          </Typography>
                        ) : null}
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {formatTimestamp(log.created_at)}
                      </Typography>
                    </Stack>

                    <Typography variant="body2" color="text.secondary">
                      {log.message || "Employee profile updated."}
                    </Typography>

                    {Array.isArray(log.sensitive_fields_changed) && log.sensitive_fields_changed.length > 0 ? (
                      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                        {log.sensitive_fields_changed.map((field) => (
                          <Chip key={field} size="small" color="warning" variant="outlined" label={`${field} masked`} />
                        ))}
                      </Stack>
                    ) : null}

                    <Button
                      size="small"
                      variant="text"
                      onClick={() => setExpandedLogId(expanded ? null : log.id)}
                      startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      sx={{ alignSelf: "flex-start", px: 0.5 }}
                    >
                      View changes
                    </Button>

                    <Collapse in={expanded} timeout="auto" unmountOnExit>
                      <Stack spacing={1.25}>
                        {diffEntries.map(([field, change]) => (
                          <Paper key={field} variant="outlined" sx={{ p: 1.25, borderRadius: 1.5 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={800}>
                              {change?.label || field}
                            </Typography>
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 0.5 }}>
                              <Typography variant="body2">
                                <strong>Before:</strong> {formatValue(change?.before)}
                              </Typography>
                              <Typography variant="body2">
                                <strong>After:</strong> {formatValue(change?.after)}
                              </Typography>
                            </Stack>
                          </Paper>
                        ))}
                        {showSnapshots ? (
                          <>
                            <Divider />
                            <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 1.5 }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={800}>
                                Before snapshot
                              </Typography>
                              <Box
                                component="pre"
                                sx={{
                                  mt: 0.75,
                                  mb: 0,
                                  fontSize: 12,
                                  overflowX: "auto",
                                  whiteSpace: "pre-wrap",
                                  wordBreak: "break-word",
                                }}
                              >
                                {JSON.stringify(log.before || {}, null, 2)}
                              </Box>
                            </Paper>
                            <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 1.5 }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={800}>
                                After snapshot
                              </Typography>
                              <Box
                                component="pre"
                                sx={{
                                  mt: 0.75,
                                  mb: 0,
                                  fontSize: 12,
                                  overflowX: "auto",
                                  whiteSpace: "pre-wrap",
                                  wordBreak: "break-word",
                                }}
                              >
                                {JSON.stringify(log.after || {}, null, 2)}
                              </Box>
                            </Paper>
                          </>
                        ) : null}
                      </Stack>
                    </Collapse>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        ) : null}
      </Stack>
    </Drawer>
  );
}
