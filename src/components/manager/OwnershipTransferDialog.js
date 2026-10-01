import React from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";

const OwnershipTransferDialog = ({
  open,
  targetName,
  currentPassword,
  confirmation,
  error,
  saving,
  onPasswordChange,
  onConfirmationChange,
  onClose,
  onConfirm,
}) => (
  <Dialog open={Boolean(open)} onClose={() => !saving && onClose()} fullWidth maxWidth="sm">
    <DialogTitle>Confirm primary ownership transfer</DialogTitle>
    <DialogContent>
      <Alert severity="warning" sx={{ mb: 2 }}>
        After this transfer, only {targetName || "the selected manager"} can transfer ownership again.
        You will remain an active regular manager until the new owner archives your account.
      </Alert>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Stack spacing={2}>
        <TextField
          autoFocus
          fullWidth
          required
          type="password"
          autoComplete="current-password"
          label="Your current password"
          value={currentPassword}
          onChange={(event) => onPasswordChange(event.target.value)}
          disabled={saving}
        />
        <TextField
          fullWidth
          required
          label="Type TRANSFER to confirm"
          value={confirmation}
          onChange={(event) => onConfirmationChange(event.target.value)}
          disabled={saving}
        />
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={saving}>
        Cancel
      </Button>
      <Button
        color="warning"
        variant="contained"
        onClick={onConfirm}
        disabled={saving || !currentPassword || confirmation !== "TRANSFER"}
      >
        {saving ? "Transferring…" : "Transfer ownership"}
      </Button>
    </DialogActions>
  </Dialog>
);

export default OwnershipTransferDialog;
