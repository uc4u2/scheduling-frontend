import React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

export default function HelpDialog({ open, onClose, title, content }) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content || "");
    } catch {
      // noop
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Box component="pre" sx={{ whiteSpace: "pre-wrap", fontFamily: "inherit", m: 0 }}>
          <Typography variant="body2">{content}</Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCopy} variant="outlined">Copy guide</Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
