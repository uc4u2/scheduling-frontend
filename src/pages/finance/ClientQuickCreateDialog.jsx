import React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

export default function ClientQuickCreateDialog({
  open,
  onClose,
  onSubmit,
  form,
  setForm,
  loading = false,
  title = "Create new client",
  description = "Create the official customer record used for estimates, invoices, and work orders.",
  nameLabel = "Client / business name",
  namePlaceholder = "ABC Property Management",
  emailLabel = "Email",
  emailPlaceholder = "billing@abcproperty.ca",
  phoneLabel = "Phone",
  phonePlaceholder = "(416) 555-0132",
  cancelLabel = "Cancel",
  submitLabel = "Create client",
}) {
  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={nameLabel}
                placeholder={namePlaceholder}
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={emailLabel}
                placeholder={emailPlaceholder}
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={phoneLabel}
                placeholder={phonePlaceholder}
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
              />
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>{cancelLabel}</Button>
        <Button variant="contained" onClick={onSubmit} disabled={loading}>{submitLabel}</Button>
      </DialogActions>
    </Dialog>
  );
}
