import React from "react";
import { Paper, Stack, Typography, Button } from "@mui/material";

export default function LeadBulkAssignBar({ count, onAssign, onUnassign, onSuppress, onDelete, onClear, disabled }) {
  if (!count) return null;

  return (
    <Paper sx={{ p: 2, mb: 2, border: "1px solid", borderColor: "divider" }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "flex-start", md: "center" }} justifyContent="space-between">
        <Typography variant="body2">
          {count} lead{count === 1 ? "" : "s"} selected.
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={onClear}>Clear</Button>
          <Button variant="outlined" onClick={onUnassign} disabled={disabled}>Bulk unassign</Button>
          <Button variant="outlined" color="warning" onClick={onSuppress} disabled={disabled}>Bulk suppress</Button>
          <Button variant="outlined" color="error" onClick={onDelete} disabled={disabled}>Bulk delete</Button>
          <Button variant="contained" onClick={onAssign} disabled={disabled}>Bulk assign</Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
