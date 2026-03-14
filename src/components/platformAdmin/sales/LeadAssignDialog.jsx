import React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

export default function LeadAssignDialog({
  open,
  onClose,
  onSubmit,
  reps,
  value,
  reason,
  onRepChange,
  onReasonChange,
  count,
  submitting,
  title,
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title || (count > 1 ? "Bulk assign leads" : "Assign lead")}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            {count > 1 ? `Assign ${count} selected leads to a sales rep.` : "Assign this lead to a sales rep."}
          </Typography>
          <TextField select fullWidth label="Sales rep" value={value} onChange={(e) => onRepChange(e.target.value)}>
            {reps.map((rep) => (
              <MenuItem key={rep.id} value={rep.id}>{rep.full_name}</MenuItem>
            ))}
          </TextField>
          <TextField fullWidth label="Reason" value={reason} onChange={(e) => onReasonChange(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onSubmit} disabled={submitting || !value}>Assign</Button>
      </DialogActions>
    </Dialog>
  );
}
