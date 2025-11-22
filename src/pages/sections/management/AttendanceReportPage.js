import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Divider,
} from "@mui/material";
import { api } from "../../../utils/api";

export default function AttendanceReportPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(
          "/api/reports/attendance-summaries?limit=12"
        );
        setRows(Array.isArray(res.data) ? res.data : []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Attendance Summaries
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Weekly AI summaries generated from your shift logs and break tracking.
        Use them for manager digests and compliance reviews.
      </Typography>

      {loading ? (
        <Typography>Loading…</Typography>
      ) : rows.length === 0 ? (
        <Typography>No summaries yet.</Typography>
      ) : (
        <Stack spacing={2}>
          {rows.map((row) => (
            <Paper
              key={row.id}
              variant="outlined"
              sx={{ p: 3, borderRadius: 3 }}
            >
              <Typography variant="subtitle2" color="text.secondary">
                {row.period_start} → {row.period_end}
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.5 }}>
                {row.summary_text}
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              {row.raw_metrics && (
                <Typography variant="body2" color="text.secondary">
                  Shifts: {row.raw_metrics.shift_count ?? 0} • Missed breaks:{" "}
                  {row.raw_metrics.missed_breaks ?? 0} • Late clock-ins:{" "}
                  {row.raw_metrics.late_clockins ?? 0} • OT shifts:{" "}
                  {row.raw_metrics.overtime_shifts ?? 0}
                </Typography>
              )}
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}
