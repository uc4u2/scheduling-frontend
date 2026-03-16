import React from "react";
import {
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

function formatDateTime(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleString();
}

export default function InboundCallsTable({ rows, loading, onOpen }) {
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Time</TableCell>
            <TableCell>Caller</TableCell>
            <TableCell>Department</TableCell>
            <TableCell>Assigned Rep</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Duration</TableCell>
            <TableCell>Wait</TableCell>
            <TableCell>Matched Entity</TableCell>
            <TableCell>Signals</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {!loading && !(rows || []).length ? (
            <TableRow>
              <TableCell colSpan={10}>
                <Typography variant="body2" color="text.secondary">
                  No inbound calls matched the current filters.
                </Typography>
              </TableCell>
            </TableRow>
          ) : null}
          {(rows || []).map((row) => (
            <TableRow hover key={row.id}>
              <TableCell>{formatDateTime(row.started_at)}</TableCell>
              <TableCell>{row.from_phone || row.from_phone_normalized || "Unknown"}</TableCell>
              <TableCell>{row.department_key || "-"}</TableCell>
              <TableCell>{row.assigned_rep_name || (row.assigned_rep_id ? `Rep #${row.assigned_rep_id}` : "-")}</TableCell>
              <TableCell>
                <Chip size="small" label={row.status || "unknown"} variant="outlined" />
              </TableCell>
              <TableCell>{row.duration_seconds ?? "-"}</TableCell>
              <TableCell>{row.wait_seconds ?? "-"}</TableCell>
              <TableCell>
                {row.matched_preview ? (
                  <Stack spacing={0.25}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {row.matched_preview.company_name || row.matched_preview.contact_name || row.matched_preview.name || row.matched_preview.type}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.matched_preview.type} #{row.matched_preview.id}
                    </Typography>
                  </Stack>
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell>
                <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: "wrap" }}>
                  {row.is_voicemail_left ? <Chip size="small" color="warning" variant="outlined" label="Voicemail" /> : null}
                  {row.recordings?.length ? <Chip size="small" color="info" variant="outlined" label={row.recordings[0]?.status || "Recording"} /> : null}
                  {row.route_result ? <Chip size="small" variant="outlined" label={row.route_result} /> : null}
                </Stack>
              </TableCell>
              <TableCell align="right">
                <Button size="small" variant="outlined" onClick={() => onOpen?.(row.id)}>
                  Open
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
