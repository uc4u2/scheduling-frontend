import React, { useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { candidatePortal } from "../../utils/candidatePortal";

export default function CandidateLoginDialog({ open, onClose, companySlug }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [converted, setConverted] = useState(false);

  const handleSend = async () => {
    setError("");
    setSuccess(false);
    setConverted(false);
    const value = email.trim().toLowerCase();
    if (!value) {
      setError("Email is required.");
      return;
    }

    setLoading(true);
    try {
      const resp = await candidatePortal.requestMagicLink(companySlug, value);
      if (resp?.converted) {
        setConverted(true);
      } else {
        setSuccess(true);
      }
    } catch (e) {
      setError(
        e?.response?.data?.error ||
          e?.displayMessage ||
          e?.message ||
          "Failed to send login link."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setError("");
    setSuccess(false);
    setConverted(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 800 }}>Candidate login</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography color="text.secondary">
            Enter the email you used to apply. We’ll send a secure magic link to access your
            dashboard.
          </Typography>
          {error && <Alert severity="error">{error}</Alert>}
          {success && (
            <Alert severity="success">
              If this email is on file, a login link is on its way.
            </Alert>
          )}
          {converted && (
            <Alert severity="info">
              Your profile is now managed as an employee. Please log in using your staff
              account.
            </Alert>
          )}
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Close
        </Button>
        <Button variant="contained" onClick={handleSend} disabled={loading}>
          {loading ? "Sending..." : "Send login link"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
