import React, { useMemo } from "react";
import { Chip, Paper, Stack, Typography } from "@mui/material";
import { formatDateTimeInTz } from "../../../utils/datetime";
import { getUserTimezone } from "../../../utils/timezone";

function statusColor(status) {
  if (status === "available") return "success";
  if (status === "ringing") return "warning";
  if (status === "in_call") return "primary";
  if (status === "paused") return "default";
  return "default";
}

export default function InboundLiveRepPanel({ rows }) {
  const timezone = useMemo(() => getUserTimezone(), []);
  const formatDateTime = (value) => (value ? formatDateTimeInTz(value, timezone) || "-" : "-");

  return (
    <Paper sx={{ p: 2.5 }}>
      <Stack spacing={1.5}>
        <BoxTitle />
        {!(rows || []).length ? (
          <Typography variant="body2" color="text.secondary">
            No inbound rep availability rows are available yet.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {(rows || []).map((row) => (
              <Stack
                key={`${row.sales_rep_id}-${row.department_key || "none"}`}
                direction={{ xs: "column", lg: "row" }}
                spacing={1}
                justifyContent="space-between"
                sx={{ p: 1.25, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}
              >
                <Stack spacing={0.25}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {row.full_name || `Rep #${row.sales_rep_id}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {row.department_key || "No department selected"}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: "wrap", alignItems: "center" }}>
                  <Chip size="small" color={statusColor(row.status)} label={row.status || "unknown"} />
                  <Chip size="small" variant="outlined" label={row.device_registered ? "Device registered" : "Device not registered"} />
                  {row.current_call_sid ? <Chip size="small" variant="outlined" label={`Call: ${row.current_call_sid}`} /> : null}
                  <Chip size="small" variant="outlined" label={`Last seen: ${formatDateTime(row.last_seen_at)}`} />
                </Stack>
              </Stack>
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

function BoxTitle() {
  return (
    <Stack spacing={0.5}>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        Live Rep Availability
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Current inbound phone-state board for reps assigned to inbound departments.
      </Typography>
    </Stack>
  );
}
