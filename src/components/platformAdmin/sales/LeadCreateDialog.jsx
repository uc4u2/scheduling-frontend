import React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
} from "@mui/material";

const PRIORITY_OPTIONS = [0, 1, 2, 3, 4, 5];

export default function LeadCreateDialog({
  open,
  onClose,
  onSubmit,
  form,
  onChange,
  reps,
  submitting,
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Create Lead</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.25 }}>
          <Grid item xs={12} md={6}>
            <TextField fullWidth required label="Company name" value={form.company_name} onChange={(e) => onChange("company_name", e.target.value)} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Contact name" value={form.contact_name} onChange={(e) => onChange("contact_name", e.target.value)} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Phone" value={form.phone} onChange={(e) => onChange("phone", e.target.value)} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Email" value={form.email} onChange={(e) => onChange("email", e.target.value)} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Website" value={form.website} onChange={(e) => onChange("website", e.target.value)} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Industry" value={form.industry} onChange={(e) => onChange("industry", e.target.value)} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="City" value={form.city} onChange={(e) => onChange("city", e.target.value)} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Country" value={form.country} onChange={(e) => onChange("country", e.target.value)} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Source" value={form.source} onChange={(e) => onChange("source", e.target.value)} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField select fullWidth label="Priority" value={form.priority} onChange={(e) => onChange("priority", e.target.value)}>
              {PRIORITY_OPTIONS.map((value) => (
                <MenuItem key={value} value={value}>{value}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField select fullWidth label="Assign rep (optional)" value={form.assigned_rep_id} onChange={(e) => onChange("assigned_rep_id", e.target.value)}>
              <MenuItem value="">Unassigned</MenuItem>
              {reps.map((rep) => (
                <MenuItem key={rep.id} value={rep.id}>{rep.full_name}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onSubmit} disabled={submitting}>Create Lead</Button>
      </DialogActions>
    </Dialog>
  );
}
