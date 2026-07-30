import React, { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

export const CLIENT_BOOKING_BLOCK_REASON_OPTIONS = [
  { value: "repeated_no_shows", label: "Repeated no-shows" },
  { value: "payment_issue", label: "Payment issue" },
  { value: "policy_violation", label: "Policy violation" },
  { value: "manager_review", label: "Manager review" },
  { value: "other", label: "Other" },
];

export default function ClientBookingAccessDialog({ open, saving = false, onClose, onConfirm }) {
  const [reasonCode, setReasonCode] = useState("repeated_no_shows");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    setReasonCode("repeated_no_shows");
    setNote("");
  }, [open]);

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Block new bookings?</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            This prevents this Client from creating or receiving new appointments. Existing appointments and financial records will not be changed.
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Reason</InputLabel>
            <Select
              label="Reason"
              value={reasonCode}
              onChange={(event) => setReasonCode(event.target.value)}
            >
              {CLIENT_BOOKING_BLOCK_REASON_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Internal note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            helperText="Manager and staff only."
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          color="warning"
          variant="contained"
          onClick={() => onConfirm({ reason_code: reasonCode, note: note.trim() })}
          disabled={saving}
        >
          {saving ? "Saving..." : "Block new bookings"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
