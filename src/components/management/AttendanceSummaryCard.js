import React, { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  Stack,
  Button,
  CircularProgress,
} from "@mui/material";
import TimelineIcon from "@mui/icons-material/Timeline";
import { api } from "../../utils/api";

export default function AttendanceSummaryCard({ onViewReport }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(
          "/api/reports/attendance-summaries?limit=1"
        );
        setSummary(Array.isArray(res.data) ? res.data[0] : null);
      } catch (err) {
        setError("Unable to load attendance summary.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <TimelineIcon color="primary" fontSize="small" />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Attendance summary
        </Typography>
      </Stack>
      {loading ? (
        <Stack alignItems="center" sx={{ py: 4 }}>
          <CircularProgress size={24} />
        </Stack>
      ) : error ? (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      ) : summary ? (
        <>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 1 }}
          >
            {summary.period_start} → {summary.period_end}
          </Typography>
          <Typography variant="body1" sx={{ flexGrow: 1 }}>
            {summary.summary_text}
          </Typography>
          {summary.raw_metrics && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Shifts: {summary.raw_metrics.shift_count ?? 0} • Missed breaks:{" "}
              {summary.raw_metrics.missed_breaks ?? 0} • OT shifts:{" "}
              {summary.raw_metrics.overtime_shifts ?? 0}
            </Typography>
          )}
        </>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No summaries yet. They will appear after your next weekly cycle.
        </Typography>
      )}

      <Button
        variant="text"
        size="small"
        sx={{ mt: 2 }}
        onClick={onViewReport}
        disabled={!onViewReport}
      >
        View details
      </Button>
    </Paper>
  );
}
