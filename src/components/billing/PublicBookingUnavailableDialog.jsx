import React from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Stack,
  Typography,
} from "@mui/material";

const PublicBookingUnavailableDialog = ({
  open,
  message,
  contactEmail,
  contactPhone,
  onClose,
  onBack,
}) => {
  const detail =
    message ||
    "Online booking is currently unavailable for this business. Please contact the business or try again later.";

  const contactHref = contactEmail
    ? `mailto:${contactEmail}`
    : contactPhone
    ? `tel:${contactPhone}`
    : null;
  const contactLabel = contactEmail
    ? "Contact"
    : contactPhone
    ? "Call"
    : null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Booking unavailable</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5}>
          <Typography variant="body1">{detail}</Typography>
          {contactEmail && (
            <Typography variant="body2" color="text.secondary">
              Contact: {contactEmail}
            </Typography>
          )}
          {!contactEmail && contactPhone && (
            <Typography variant="body2" color="text.secondary">
              Contact: {contactPhone}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Close</Button>
        <Button variant="outlined" onClick={onBack}>
          Back to services
        </Button>
        {contactHref && contactLabel && (
          <Button variant="contained" href={contactHref}>
            {contactLabel}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PublicBookingUnavailableDialog;
